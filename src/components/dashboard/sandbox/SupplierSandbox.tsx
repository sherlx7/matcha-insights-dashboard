import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Truck } from "lucide-react";
import { Supplier, SupplierProduct, MatchaProduct } from "@/types/database";
import { SHIPPING_COST_PER_KG, IMPORT_TAX_RATE } from "@/types/database";

export interface SupplierSimulationState {
  exchangeRates: Record<string, number>;
  productCostsJpy: Record<string, number>;
  shippingCostPerKg: number;
  leadTimes: Record<string, number>;
}

interface SupplierSandboxProps {
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  products: MatchaProduct[];
  simulationState: SupplierSimulationState;
  onSimulationChange: (state: SupplierSimulationState) => void;
}

export function SupplierSandbox({
  suppliers,
  supplierProducts,
  products,
  simulationState,
  onSimulationChange,
}: SupplierSandboxProps) {
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const primarySupplierMap = useMemo(() => {
    const map = new Map<string, { supplier: Supplier; supplierProduct: SupplierProduct }>();
    supplierProducts.filter(sp => sp.is_primary_supplier).forEach(sp => {
      const supplier = suppliers.find(s => s.id === sp.supplier_id);
      if (supplier) {
        map.set(sp.product_id, { supplier, supplierProduct: sp });
      }
    });
    return map;
  }, [suppliers, supplierProducts]);

  const handleExchangeRateChange = (supplierId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      exchangeRates: { ...simulationState.exchangeRates, [supplierId]: numValue },
    });
  };

  const handleProductCostChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      productCostsJpy: { ...simulationState.productCostsJpy, [productId]: numValue },
    });
  };

  const handleShippingChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      shippingCostPerKg: numValue,
    });
  };

  const handleLeadTimeChange = (supplierId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onSimulationChange({
      ...simulationState,
      leadTimes: { ...simulationState.leadTimes, [supplierId]: numValue },
    });
  };

  const handleReset = () => {
    const defaultState: SupplierSimulationState = {
      exchangeRates: Object.fromEntries(suppliers.map(s => [s.id, s.exchange_rate_jpy_usd || 0.0067])),
      productCostsJpy: Object.fromEntries(products.map(p => [p.id, p.cost_per_kg_jpy || 0])),
      shippingCostPerKg: SHIPPING_COST_PER_KG,
      leadTimes: Object.fromEntries(suppliers.map(s => [s.id, s.lead_time_days || 14])),
    };
    onSimulationChange(defaultState);
  };

  const calculateSimulatedCost = (productId: string) => {
    const product = productMap.get(productId);
    const supplierInfo = primarySupplierMap.get(productId);
    if (!product || !supplierInfo) return null;

    const costJpy = simulationState.productCostsJpy[productId] ?? (product.cost_per_kg_jpy || 0);
    const exchangeRate = simulationState.exchangeRates[supplierInfo.supplier.id] ?? (supplierInfo.supplier.exchange_rate_jpy_usd || 0.0067);
    const shipping = simulationState.shippingCostPerKg;

    const costUsd = costJpy * exchangeRate;
    const subtotal = costUsd + shipping;
    const importTax = subtotal * IMPORT_TAX_RATE;
    const totalCost = subtotal + importTax;

    return { costJpy, exchangeRate, costUsd, shipping, importTax, totalCost };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier Simulation
              </CardTitle>
              <CardDescription>
                Simulate how changes to supplier costs affect your margins. Suppliers are the businesses you purchase stock from.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Actual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Global Shipping Cost (USD/kg)</Label>
              <Input
                type="number"
                step="0.5"
                value={simulationState.shippingCostPerKg}
                onChange={(e) => handleShippingChange(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Current: ${SHIPPING_COST_PER_KG}/kg • Import Tax: {(IMPORT_TAX_RATE * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supplier Exchange Rates</CardTitle>
          <CardDescription>Adjust JPY to USD conversion rates per supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Exchange Rate (JPY→USD)</TableHead>
                <TableHead className="text-right">Lead Time (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const actualRate = supplier.exchange_rate_jpy_usd || 0.0067;
                const simRate = simulationState.exchangeRates[supplier.id] ?? actualRate;
                const rateChanged = Math.abs(simRate - actualRate) > 0.0001;

                const actualLead = supplier.lead_time_days || 14;
                const simLead = simulationState.leadTimes[supplier.id] ?? actualLead;
                const leadChanged = simLead !== actualLead;

                return (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.country || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="0.0001"
                          value={simRate}
                          onChange={(e) => handleExchangeRateChange(supplier.id, e.target.value)}
                          className="w-28 font-mono text-right"
                        />
                        {rateChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="1"
                          value={simLead}
                          onChange={(e) => handleLeadTimeChange(supplier.id, e.target.value)}
                          className="w-20 font-mono text-right"
                        />
                        {leadChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Product Costs (JPY/kg)</CardTitle>
          <CardDescription>Adjust base costs from suppliers to see margin impact</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Primary Supplier</TableHead>
                <TableHead className="text-right">Cost (¥/kg)</TableHead>
                <TableHead className="text-right">Simulated Total ($/kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.filter(p => p.cost_per_kg_jpy).map((product) => {
                const actualCost = product.cost_per_kg_jpy || 0;
                const simCost = simulationState.productCostsJpy[product.id] ?? actualCost;
                const costChanged = simCost !== actualCost;
                const supplierInfo = primarySupplierMap.get(product.id);
                const calculated = calculateSimulatedCost(product.id);

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{product.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplierInfo?.supplier.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="100"
                          value={simCost}
                          onChange={(e) => handleProductCostChange(product.id, e.target.value)}
                          className="w-28 font-mono text-right"
                        />
                        {costChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {calculated ? `$${calculated.totalCost.toFixed(2)}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
