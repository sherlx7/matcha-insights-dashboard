import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users } from "lucide-react";
import { Client, ClientOrder, MatchaProduct } from "@/types/database";

export interface ClientSimulationState {
  discounts: Record<string, number>;
  monthlyVolumes: Record<string, number>;
  sellingPrices: Record<string, number>;
  paymentTerms: Record<string, number>;
}

interface ClientSandboxProps {
  clients: Client[];
  products: MatchaProduct[];
  orders: ClientOrder[];
  simulationState: ClientSimulationState;
  onSimulationChange: (state: ClientSimulationState) => void;
}

export function ClientSandbox({
  clients,
  products,
  orders,
  simulationState,
  onSimulationChange,
}: ClientSandboxProps) {
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

  const handleDiscountChange = (clientId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      discounts: { ...simulationState.discounts, [clientId]: Math.min(100, Math.max(0, numValue)) },
    });
  };

  const handleVolumeChange = (clientId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      monthlyVolumes: { ...simulationState.monthlyVolumes, [clientId]: numValue },
    });
  };

  const handlePaymentTermChange = (clientId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onSimulationChange({
      ...simulationState,
      paymentTerms: { ...simulationState.paymentTerms, [clientId]: numValue },
    });
  };

  const handleReset = () => {
    const defaultState: ClientSimulationState = {
      discounts: Object.fromEntries(clients.map(c => [c.id, c.discount_percent || 0])),
      monthlyVolumes: clientMonthlyVolumes,
      sellingPrices: Object.fromEntries(products.map(p => [p.id, p.selling_price_per_kg || 0])),
      paymentTerms: Object.fromEntries(clients.map(c => [c.id, 30])),
    };
    onSimulationChange(defaultState);
  };

  const handleSellingPriceChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onSimulationChange({
      ...simulationState,
      sellingPrices: { ...simulationState.sellingPrices, [productId]: numValue },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Simulation
              </CardTitle>
              <CardDescription>
                Simulate how changes to client pricing affect your revenue. Clients are the businesses that purchase from you.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Actual
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Product Selling Prices</CardTitle>
          <CardDescription>Adjust base selling prices before client discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Selling Price ($/kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.filter(p => p.selling_price_per_kg).map((product) => {
                const actualPrice = product.selling_price_per_kg || 0;
                const simPrice = simulationState.sellingPrices[product.id] ?? actualPrice;
                const priceChanged = simPrice !== actualPrice;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{product.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="5"
                          value={simPrice}
                          onChange={(e) => handleSellingPriceChange(product.id, e.target.value)}
                          className="w-28 font-mono text-right"
                        />
                        {priceChanged && <Badge variant="secondary">Modified</Badge>}
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
          <CardTitle className="text-base">Client Discounts & Volumes</CardTitle>
          <CardDescription>Adjust discount percentages and expected monthly orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Discount (%)</TableHead>
                <TableHead className="text-right">Monthly Volume (kg)</TableHead>
                <TableHead className="text-right">Payment Terms (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const actualDiscount = client.discount_percent || 0;
                const simDiscount = simulationState.discounts[client.id] ?? actualDiscount;
                const discountChanged = simDiscount !== actualDiscount;

                const actualVolume = clientMonthlyVolumes[client.id] || 0;
                const simVolume = simulationState.monthlyVolumes[client.id] ?? actualVolume;
                const volumeChanged = simVolume !== actualVolume;

                const actualTerms = 30;
                const simTerms = simulationState.paymentTerms[client.id] ?? actualTerms;
                const termsChanged = simTerms !== actualTerms;

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.contact_email && (
                          <div className="text-xs text-muted-foreground">{client.contact_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={simDiscount}
                          onChange={(e) => handleDiscountChange(client.id, e.target.value)}
                          className="w-20 font-mono text-right"
                        />
                        {discountChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="5"
                          min="0"
                          value={simVolume}
                          onChange={(e) => handleVolumeChange(client.id, e.target.value)}
                          className="w-24 font-mono text-right"
                        />
                        {volumeChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="15"
                          min="0"
                          value={simTerms}
                          onChange={(e) => handlePaymentTermChange(client.id, e.target.value)}
                          className="w-20 font-mono text-right"
                        />
                        {termsChanged && <Badge variant="secondary">Modified</Badge>}
                      </div>
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
