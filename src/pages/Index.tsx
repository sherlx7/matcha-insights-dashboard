import { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { InventoryTable } from "@/components/dashboard/InventoryTable";
import { ClientProfitabilityTable } from "@/components/dashboard/ClientProfitabilityTable";
import { ClientPricingTable } from "@/components/dashboard/ClientPricingTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { InventoryManagement } from "@/components/dashboard/InventoryManagement";
import { OrdersManagement } from "@/components/dashboard/OrdersManagement";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { PendingApprovalsPanel } from "@/components/dashboard/PendingApprovalsPanel";
import { AIInsightsTab } from "@/components/dashboard/AIInsightsTab";
import { ProfitabilitySandbox } from "@/components/dashboard/sandbox/ProfitabilitySandbox";
import { OnboardingProvider, useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useMatchaProducts, 
  useClients, 
  useClientOrders,
  useSuppliers,
  useSupplierProducts,
  useWarehouseArrivals,
  useClientAllocations,
} from "@/hooks/useMatchaData";
import { useStockChangeRequests } from "@/hooks/useStockChangeRequests";
import { useAuth } from "@/hooks/useAuth";
import { ClientProfitability } from "@/types/database";
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Users,
  AlertTriangle,
  ShieldCheck,
  Info,
  Calculator,
  Brain,
  Lock
} from "lucide-react";

function DashboardContent() {
  const { isAdmin, permissions } = useAuth();
  const { setOnTabChange, setOnSubTabChange } = useOnboarding();

  const { data: products = [], isLoading: productsLoading } = useMatchaProducts();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: orders = [], isLoading: ordersLoading } = useClientOrders();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: supplierProducts = [], isLoading: supplierProductsLoading } = useSupplierProducts();
  const { data: arrivals = [], isLoading: arrivalsLoading } = useWarehouseArrivals();
  const { data: allocations = [], isLoading: allocationsLoading } = useClientAllocations();

  // Check permissions
  const canAccessFinancials = isAdmin || permissions?.can_access_financials;
  const canAccessOperations = isAdmin || permissions?.can_access_operations;
  const canAccessSandbox = isAdmin || permissions?.can_access_sandbox;

  // Main navigation tab state - default to first accessible tab
  const getDefaultTab = () => {
    if (canAccessFinancials) return "financials";
    if (canAccessOperations) return "operations";
    if (canAccessSandbox) return "sandbox";
    return "financials";
  };

  const [mainTab, setMainTab] = useState(getDefaultTab());
  const [financialsSubTab, setFinancialsSubTab] = useState("pricing");
  const [operationsSubTab, setOperationsSubTab] = useState("inventory");
  const [sandboxSubTab, setSandboxSubTab] = useState("supplier");

  // Register tab change handlers for tutorial navigation
  useEffect(() => {
    setOnTabChange(() => setMainTab);
    return () => setOnTabChange(null);
  }, [setOnTabChange]);

  useEffect(() => {
    setOnSubTabChange(() => (tab: string) => {
      // Map tutorial subTab names to actual tab values
      const subTabMap: Record<string, () => void> = {
        // Financials sub-tabs
        'overview': () => setFinancialsSubTab('pricing'),
        'pricing': () => setFinancialsSubTab('pricing'),
        'orders': () => setFinancialsSubTab('orders'),
        'profitability': () => setFinancialsSubTab('clients'),
        'ai': () => setFinancialsSubTab('ai-insights'),
        // Operations sub-tabs
        'stock': () => setOperationsSubTab('inventory'),
        'arrivals': () => setOperationsSubTab('inventory'),
        'allocations': () => setOperationsSubTab('inventory'),
        'approvals': () => setOperationsSubTab('approvals'),
        // Sandbox sub-tabs
        'supplier': () => setSandboxSubTab('supplier'),
        'client': () => setSandboxSubTab('client'),
      };
      subTabMap[tab]?.();
    });
    return () => setOnSubTabChange(null);
  }, [setOnSubTabChange]);

  // Update tab when permissions change
  useEffect(() => {
    const defaultTab = getDefaultTab();
    if (!canAccessFinancials && mainTab === "financials") setMainTab(defaultTab);
    if (!canAccessOperations && mainTab === "operations") setMainTab(defaultTab);
    if (!canAccessSandbox && mainTab === "sandbox") setMainTab(defaultTab);
  }, [canAccessFinancials, canAccessOperations, canAccessSandbox]);

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange?.from) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.order_date);
      const start = startOfDay(dateRange.from!);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(orderDate, { start, end });
    });
  }, [orders, dateRange]);

  // Calculate client profitability
  const clientProfitability: ClientProfitability[] = useMemo(() => {
    if (!clients.length || !filteredOrders.length || !products.length) return [];

    const productMap = new Map(products.map(p => [p.id, p]));

    return clients.map(client => {
      const clientOrders = filteredOrders.filter(o => o.client_id === client.id);
      
      const ordersWithProducts = clientOrders.map(order => ({
        ...order,
        product: productMap.get(order.product_id)!,
      })).filter(o => o.product);

      const totalRevenue = ordersWithProducts.reduce((sum, o) => sum + Number(o.total_revenue), 0);
      const totalCOGS = ordersWithProducts.reduce((sum, o) => 
        sum + (Number(o.quantity_kg) * Number(o.product.cost_per_kg)), 0);
      const profit = totalRevenue - totalCOGS;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        client,
        totalRevenue,
        totalCOGS,
        profit,
        profitMargin,
        orders: ordersWithProducts,
      };
    }).filter(c => c.orders.length > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [clients, filteredOrders, products]);

  // Calculate KPI totals
  const kpis = useMemo(() => {
    const totalRevenue = clientProfitability.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalCOGS = clientProfitability.reduce((sum, c) => sum + c.totalCOGS, 0);
    const totalProfit = totalRevenue - totalCOGS;
    const avgMargin = clientProfitability.length > 0 
      ? clientProfitability.reduce((sum, c) => sum + c.profitMargin, 0) / clientProfitability.length 
      : 0;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock_kg), 0);
    const lowStockCount = products.filter(p => 
      Number(p.stock_kg) <= Number(p.reorder_point_kg || 20)
    ).length;
    
    // Calculate allocated vs unallocated
    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocated_kg), 0);
    const totalUnallocated = Math.max(0, totalStock - totalAllocated);

    return { totalRevenue, totalCOGS, totalProfit, avgMargin, totalStock, lowStockCount, totalAllocated, totalUnallocated };
  }, [clientProfitability, products, allocations]);

  const isLoading = productsLoading || clientsLoading || ordersLoading;
  const isInventoryLoading = suppliersLoading || supplierProductsLoading || arrivalsLoading || allocationsLoading;

  // Get pending approvals count for badge
  const { data: pendingRequests = [] } = useStockChangeRequests('pending');
  const pendingCount = pendingRequests.length;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={mainTab}
        onTabChange={setMainTab}
        pendingCount={pendingCount}
      />
      
      <main className="container py-6 space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between" data-tutorial="date-filter">
          <h2 className="text-lg font-semibold">Dashboard Overview</h2>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" data-tutorial="kpi-cards">
          <KPICard
            title="Total Revenue"
            value={`$${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={dateRange?.from ? "Selected period" : "All time"}
            icon={DollarSign}
          />
          <KPICard
            title="Total Profit"
            value={`$${kpis.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`${kpis.avgMargin.toFixed(1)}% avg margin`}
            icon={TrendingUp}
            trend={{ value: kpis.avgMargin, isPositive: kpis.avgMargin >= 25 }}
          />
          <KPICard
            title="Total Inventory"
            value={`${kpis.totalStock.toFixed(0)} kg`}
            subtitle={`${kpis.totalUnallocated.toFixed(0)} kg available`}
            icon={Package}
          />
          <KPICard
            title="Low Stock Items"
            value={kpis.lowStockCount.toString()}
            subtitle={kpis.lowStockCount > 0 ? "Need reorder" : "All stocked"}
            icon={AlertTriangle}
            className={kpis.lowStockCount > 0 ? "border-destructive/50" : ""}
          />
          <KPICard
            title="Active Clients"
            value={clientProfitability.length.toString()}
            subtitle={`${clients.length} total`}
            icon={Users}
          />
        </div>

        {/* No Access Message */}
        {!canAccessFinancials && !canAccessOperations && !canAccessSandbox && (
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-muted">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">No Access Granted</h3>
              <p className="text-muted-foreground">
                You don't have permission to access any dashboard sections yet. 
                Please contact an administrator to request access.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Financials Content */}
        {mainTab === "financials" && canAccessFinancials && (
          <div className="space-y-6">
            {/* Revenue Chart */}
            <div data-tutorial="revenue-chart">
              <RevenueChart orders={filteredOrders} products={products} dateRange={dateRange} />
            </div>
            
            {/* Financial Sub-tabs */}
            <Tabs value={financialsSubTab} onValueChange={setFinancialsSubTab} className="space-y-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Pricing & Costs</span>
                  <span className="sm:hidden">Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-background">
                  Sales Orders
                </TabsTrigger>
                <TabsTrigger value="clients" className="data-[state=active]:bg-background">
                  Profitability
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Insights</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pricing">
                <div data-tutorial="pricing-table">
                  <ClientPricingTable
                    clients={clients}
                    products={products}
                    orders={filteredOrders}
                    suppliers={suppliers}
                    supplierProducts={supplierProducts}
                    arrivals={arrivals}
                    allocations={allocations}
                    isLoading={isLoading || isInventoryLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <div data-tutorial="orders-table">
                  <OrdersManagement
                    orders={filteredOrders}
                    clients={clients}
                    products={products}
                    isLoading={ordersLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="clients">
                <div data-tutorial="profitability-table">
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Profitability</CardTitle>
                      <CardDescription>
                        Revenue, COGS, and profit analysis for each client
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ClientProfitabilityTable 
                        clients={clientProfitability} 
                        isLoading={isLoading} 
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ai-insights">
                <div data-tutorial="ai-insights">
                  <AIInsightsTab 
                    clients={clientProfitability}
                    products={products}
                    orders={orders}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Operations Content */}
        {mainTab === "operations" && canAccessOperations && (
          <div className="space-y-6">
            <Tabs value={operationsSubTab} onValueChange={setOperationsSubTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
                <TabsTrigger value="stock" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Manual Stock Adjustments
                </TabsTrigger>
                <TabsTrigger value="approvals" className="flex items-center gap-2">
                  Approvals
                  {pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500 text-amber-50 px-1.5 py-0.5 text-xs font-medium">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory">
                <div data-tutorial="stock-levels">
                  <InventoryManagement
                    products={products}
                    suppliers={suppliers}
                    supplierProducts={supplierProducts}
                    arrivals={arrivals}
                    allocations={allocations}
                    clients={clients}
                    isLoading={productsLoading || isInventoryLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="stock">
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Stock Adjustments</CardTitle>
                    <CardDescription>
                      Request stock changes with supervisor approval. Stock is usually automated—use this for exceptions only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Stock updates are typically automated from warehouse systems. Manual adjustments require supervisor approval for audit purposes (e.g., reservations, damages, quality issues).
                      </AlertDescription>
                    </Alert>
                    <InventoryTable 
                      products={products} 
                      isLoading={productsLoading} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approvals">
                <div data-tutorial="pending-approvals">
                  <PendingApprovalsPanel products={products} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Sandbox Content */}
        {mainTab === "sandbox" && canAccessSandbox && (
          <div data-tutorial="supplier-sandbox">
            <ProfitabilitySandbox
              clients={clients}
              products={products}
              orders={orders}
              suppliers={suppliers}
              supplierProducts={supplierProducts}
              isLoading={productsLoading || clientsLoading || ordersLoading || suppliersLoading || supplierProductsLoading}
            />
          </div>
        )}
      </main>
      
      <OnboardingTutorial />
    </div>
  );
}

const Index = () => {
  return (
    <OnboardingProvider>
      <DashboardContent />
    </OnboardingProvider>
  );
};

export default Index;
