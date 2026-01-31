import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, FlaskConical } from "lucide-react";
import { Client, MatchaProduct, ClientOrder, Supplier, SupplierProduct } from "@/types/database";
import { SHIPPING_COST_PER_KG } from "@/types/database";
import { SupplierSandbox, SupplierSimulationState } from "./SupplierSandbox";
import { ClientSandbox, ClientSimulationState } from "./ClientSandbox";
import { ScenarioComparisonChart } from "./ScenarioComparisonChart";

interface ProfitabilitySandboxProps {
  clients: Client[];
  products: MatchaProduct[];
  orders: ClientOrder[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  isLoading: boolean;
}

export function ProfitabilitySandbox({
  clients,
  products,
  orders,
  suppliers,
  supplierProducts,
  isLoading,
}: ProfitabilitySandboxProps) {
  const [view, setView] = useState<"suppliers" | "clients">("suppliers");

  // Calculate historical monthly volumes per client from orders data
  const clientMonthlyVolumes = useMemo(() => {
    const volumes: Record<string, number> = {};
    clients.forEach(client => {
      const clientOrders = orders.filter(o => o.client_id === client.id);
      if (clientOrders.length === 0) {
        volumes[client.id] = 0;
        return;
      }
      const totalKg = clientOrders.reduce((sum, o) => sum + Number(o.quantity_kg), 0);
      volumes[client.id] = Math.round(totalKg / 3);
    });
    return volumes;
  }, [clients, orders]);

  // Original state captured once from database values - never modified by simulation
  const originalSupplierState = useMemo<SupplierSimulationState>(() => ({
    exchangeRates: Object.fromEntries(suppliers.map(s => [s.id, s.exchange_rate_jpy_usd || 0.0067])),
    productCostsJpy: Object.fromEntries(products.map(p => [p.id, p.cost_per_kg_jpy || 0])),
    shippingCostPerKg: SHIPPING_COST_PER_KG,
    leadTimes: Object.fromEntries(suppliers.map(s => [s.id, s.lead_time_days || 14])),
  }), [suppliers, products]);

  const originalClientState = useMemo<ClientSimulationState>(() => ({
    discounts: Object.fromEntries(clients.map(c => [c.id, c.discount_percent || 0])),
    monthlyVolumes: clientMonthlyVolumes,
    sellingPrices: Object.fromEntries(products.map(p => [p.id, p.selling_price_per_kg || 0])),
    paymentTerms: Object.fromEntries(clients.map(c => [c.id, 30])),
  }), [clients, products, clientMonthlyVolumes]);

  // Simulation state - user can modify these
  const [supplierSimulation, setSupplierSimulation] = useState<SupplierSimulationState>(() => ({
    exchangeRates: Object.fromEntries(suppliers.map(s => [s.id, s.exchange_rate_jpy_usd || 0.0067])),
    productCostsJpy: Object.fromEntries(products.map(p => [p.id, p.cost_per_kg_jpy || 0])),
    shippingCostPerKg: SHIPPING_COST_PER_KG,
    leadTimes: Object.fromEntries(suppliers.map(s => [s.id, s.lead_time_days || 14])),
  }));

  const [clientSimulation, setClientSimulation] = useState<ClientSimulationState>(() => ({
    discounts: Object.fromEntries(clients.map(c => [c.id, c.discount_percent || 0])),
    monthlyVolumes: clientMonthlyVolumes,
    sellingPrices: Object.fromEntries(products.map(p => [p.id, p.selling_price_per_kg || 0])),
    paymentTerms: Object.fromEntries(clients.map(c => [c.id, 30])),
  }));

  // Re-initialize simulation state when data loads
  useMemo(() => {
    if (suppliers.length > 0 && Object.keys(supplierSimulation.exchangeRates).length === 0) {
      setSupplierSimulation({
        exchangeRates: Object.fromEntries(suppliers.map(s => [s.id, s.exchange_rate_jpy_usd || 0.0067])),
        productCostsJpy: Object.fromEntries(products.map(p => [p.id, p.cost_per_kg_jpy || 0])),
        shippingCostPerKg: SHIPPING_COST_PER_KG,
        leadTimes: Object.fromEntries(suppliers.map(s => [s.id, s.lead_time_days || 14])),
      });
    }
  }, [suppliers, products]);

  useMemo(() => {
    if (clients.length > 0 && Object.keys(clientSimulation.discounts).length === 0) {
      setClientSimulation({
        discounts: Object.fromEntries(clients.map(c => [c.id, c.discount_percent || 0])),
        monthlyVolumes: clientMonthlyVolumes,
        sellingPrices: Object.fromEntries(products.map(p => [p.id, p.selling_price_per_kg || 0])),
        paymentTerms: Object.fromEntries(clients.map(c => [c.id, 30])),
      });
    }
  }, [clients, products, clientMonthlyVolumes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading sandbox data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Profitability Sandbox
          </CardTitle>
          <CardDescription>
            Experiment with "what-if" scenarios to understand how changes to supplier costs and client pricing affect your margins. 
            Changes here are for simulation only—they won't affect actual data.
          </CardDescription>
        </CardHeader>
      </Card>

      <ScenarioComparisonChart
        clients={clients}
        products={products}
        suppliers={suppliers}
        supplierProducts={supplierProducts}
        supplierSimulation={supplierSimulation}
        clientSimulation={clientSimulation}
        originalSupplierState={originalSupplierState}
        originalClientState={originalClientState}
        orders={orders}
      />

      <Tabs value={view} onValueChange={(v) => setView(v as "suppliers" | "clients")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Suppliers (Your Stock Sources)
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients (Your Buyers)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <SupplierSandbox
            suppliers={suppliers}
            supplierProducts={supplierProducts}
            products={products}
            simulationState={supplierSimulation}
            onSimulationChange={setSupplierSimulation}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientSandbox
            clients={clients}
            products={products}
            orders={orders}
            simulationState={clientSimulation}
            onSimulationChange={setClientSimulation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
