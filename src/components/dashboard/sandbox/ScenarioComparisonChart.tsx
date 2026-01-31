import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Client, MatchaProduct, Supplier, SupplierProduct, ClientOrder } from "@/types/database";
import { SupplierSimulationState } from "./SupplierSandbox";
import { ClientSimulationState } from "./ClientSandbox";
import { IMPORT_TAX_RATE } from "@/types/database";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScenarioComparisonChartProps {
  clients: Client[];
  products: MatchaProduct[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  supplierSimulation: SupplierSimulationState;
  clientSimulation: ClientSimulationState;
  originalSupplierState: SupplierSimulationState;
  originalClientState: ClientSimulationState;
  orders: ClientOrder[];
}

export function ScenarioComparisonChart({
  clients,
  products,
  suppliers,
  supplierProducts,
  supplierSimulation,
  clientSimulation,
  originalSupplierState,
  originalClientState,
  orders,
}: ScenarioComparisonChartProps) {
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

  const primarySupplierMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    supplierProducts.filter(sp => sp.is_primary_supplier).forEach(sp => {
      const supplier = supplierMap.get(sp.supplier_id);
      if (supplier) {
        map.set(sp.product_id, supplier);
      }
    });
    return map;
  }, [supplierProducts, supplierMap]);

  // Calculate historical volumes per client-product from orders
  const clientProductVolumes = useMemo(() => {
    const volumes: Record<string, Record<string, number>> = {};
    clients.forEach(client => {
      volumes[client.id] = {};
      const clientOrders = orders.filter(o => o.client_id === client.id);
      clientOrders.forEach(order => {
        if (!volumes[client.id][order.product_id]) {
          volumes[client.id][order.product_id] = 0;
        }
        volumes[client.id][order.product_id] += Number(order.quantity_kg);
      });
      // Convert to monthly average (assuming 3-month data)
      Object.keys(volumes[client.id]).forEach(productId => {
        volumes[client.id][productId] = Math.round(volumes[client.id][productId] / 3);
      });
    });
    return volumes;
  }, [clients, orders]);

  const calculateCost = (productId: string, supplierState: SupplierSimulationState) => {
    const product = productMap.get(productId);
    const supplier = primarySupplierMap.get(productId);
    if (!product) return 0;

    const costJpy = supplierState.productCostsJpy[productId] ?? (product.cost_per_kg_jpy || 0);
    const exchangeRate = supplier 
      ? (supplierState.exchangeRates[supplier.id] ?? (supplier.exchange_rate_jpy_usd || 0.0067))
      : 0.0067;
    const shipping = supplierState.shippingCostPerKg;

    const costUsd = costJpy * exchangeRate;
    const subtotal = costUsd + shipping;
    const totalCost = subtotal * (1 + IMPORT_TAX_RATE);

    return totalCost;
  };

  const forecastData = useMemo(() => {
    const months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
    
    return months.map((month, idx) => {
      let actualRevenue = 0;
      let actualCOGS = 0;
      let simulatedRevenue = 0;
      let simulatedCOGS = 0;
      const growthFactor = 1 + (idx * 0.02);

      clients.forEach(client => {
        const clientVolumes = clientProductVolumes[client.id] || {};
        
        // Calculate revenue and COGS based on actual product order patterns
        Object.entries(clientVolumes).forEach(([productId, baseVolume]) => {
          const product = productMap.get(productId);
          if (!product) return;

          // ACTUAL scenario: use original database values
          const actualSellingPrice = originalClientState.sellingPrices[productId] ?? (product.selling_price_per_kg || 0);
          const actualDiscount = originalClientState.discounts[client.id] ?? (client.discount_percent || 0);
          const actualVolume = (originalClientState.monthlyVolumes[client.id] ?? baseVolume) > 0 
            ? baseVolume * growthFactor 
            : 0;
          const actualEffectivePrice = actualSellingPrice * (1 - actualDiscount / 100);
          actualRevenue += actualVolume * actualEffectivePrice;
          actualCOGS += actualVolume * calculateCost(productId, originalSupplierState);

          // SIMULATED scenario: use current simulation values
          const simSellingPrice = clientSimulation.sellingPrices[productId] ?? (product.selling_price_per_kg || 0);
          const simDiscount = clientSimulation.discounts[client.id] ?? (client.discount_percent || 0);
          // Apply volume scaling based on total client volume simulation vs original
          const originalClientVolume = originalClientState.monthlyVolumes[client.id] || 1;
          const simClientVolume = clientSimulation.monthlyVolumes[client.id] ?? originalClientVolume;
          const volumeRatio = originalClientVolume > 0 ? simClientVolume / originalClientVolume : 1;
          const simVolume = baseVolume * volumeRatio * growthFactor;
          const simEffectivePrice = simSellingPrice * (1 - simDiscount / 100);
          simulatedRevenue += simVolume * simEffectivePrice;
          simulatedCOGS += simVolume * calculateCost(productId, supplierSimulation);
        });

        // Handle clients with no orders but with simulated volume
        if (Object.keys(clientVolumes).length === 0) {
          const simVolume = clientSimulation.monthlyVolumes[client.id] ?? 0;
          if (simVolume > 0) {
            // Use average product prices and costs for clients without order history
            const avgSellingPrice = products.reduce((sum, p) => 
              sum + (clientSimulation.sellingPrices[p.id] ?? (p.selling_price_per_kg || 0)), 0) / Math.max(1, products.length);
            const simDiscount = clientSimulation.discounts[client.id] ?? (client.discount_percent || 0);
            const simEffectivePrice = avgSellingPrice * (1 - simDiscount / 100);
            simulatedRevenue += simVolume * growthFactor * simEffectivePrice;
            
            const avgCost = products.reduce((sum, p) => sum + calculateCost(p.id, supplierSimulation), 0) / Math.max(1, products.length);
            simulatedCOGS += simVolume * growthFactor * avgCost;
          }
        }
      });

      const actualProfit = actualRevenue - actualCOGS;
      const simulatedProfit = simulatedRevenue - simulatedCOGS;
      const actualMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0;
      const simulatedMargin = simulatedRevenue > 0 ? (simulatedProfit / simulatedRevenue) * 100 : 0;

      return {
        month,
        actualProfit: Math.round(actualProfit),
        simulatedProfit: Math.round(simulatedProfit),
        actualRevenue: Math.round(actualRevenue),
        simulatedRevenue: Math.round(simulatedRevenue),
        actualMargin,
        simulatedMargin,
      };
    });
  }, [clients, products, clientSimulation, supplierSimulation, originalClientState, originalSupplierState, clientProductVolumes, calculateCost, productMap]);

  const summary = useMemo(() => {
    const totalActualProfit = forecastData.reduce((sum, d) => sum + d.actualProfit, 0);
    const totalSimProfit = forecastData.reduce((sum, d) => sum + d.simulatedProfit, 0);
    const profitDiff = totalSimProfit - totalActualProfit;
    const profitDiffPercent = totalActualProfit > 0 ? (profitDiff / totalActualProfit) * 100 : 0;

    const totalActualRevenue = forecastData.reduce((sum, d) => sum + d.actualRevenue, 0);
    const totalSimRevenue = forecastData.reduce((sum, d) => sum + d.simulatedRevenue, 0);
    const revenueDiff = totalSimRevenue - totalActualRevenue;

    const avgActualMargin = forecastData.reduce((sum, d) => sum + d.actualMargin, 0) / forecastData.length;
    const avgSimMargin = forecastData.reduce((sum, d) => sum + d.simulatedMargin, 0) / forecastData.length;
    const marginDiff = avgSimMargin - avgActualMargin;

    return {
      totalActualProfit,
      totalSimProfit,
      profitDiff,
      profitDiffPercent,
      revenueDiff,
      avgActualMargin,
      avgSimMargin,
      marginDiff,
    };
  }, [forecastData]);

  const chartConfig = {
    actualProfit: { label: "Current Scenario", color: "hsl(var(--muted-foreground))" },
    simulatedProfit: { label: "Simulated Scenario", color: "hsl(var(--primary))" },
  };

  const TrendIcon = summary.profitDiff > 0 ? TrendingUp : summary.profitDiff < 0 ? TrendingDown : Minus;
  const trendColor = summary.profitDiff > 0 ? "text-primary" : summary.profitDiff < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle>6-Month Profit Forecast Comparison</CardTitle>
        <CardDescription>
          Compare current profitability trajectory vs simulated scenario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Profit Impact</div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${trendColor}`}>
              <TrendIcon className="h-5 w-5" />
              {summary.profitDiff >= 0 ? "+" : ""}${summary.profitDiff.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.profitDiffPercent >= 0 ? "+" : ""}{summary.profitDiffPercent.toFixed(1)}% change
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Revenue Impact</div>
            <div className="text-2xl font-bold">
              {summary.revenueDiff >= 0 ? "+" : ""}${summary.revenueDiff.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Over 6 months</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Margin Shift</div>
            <div className={`text-2xl font-bold ${summary.marginDiff >= 0 ? "text-primary" : "text-destructive"}`}>
              {summary.marginDiff >= 0 ? "+" : ""}{summary.marginDiff.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.avgActualMargin.toFixed(1)}% → {summary.avgSimMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar 
                dataKey="actualProfit" 
                name="Current Scenario" 
                fill="hsl(var(--muted-foreground))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="simulatedProfit" 
                name="Simulated Scenario" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
