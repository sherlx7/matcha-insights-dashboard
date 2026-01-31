import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSearch } from "./TableSearch";
import { 
  Client, 
  MatchaProduct, 
  ClientOrder, 
  Supplier, 
  SupplierProduct,
  WarehouseArrival,
  ClientAllocation,
  ClientPricingDetails,
  SHIPPING_COST_PER_KG,
  IMPORT_TAX_RATE,
} from "@/types/database";
import { buildClientPricingDetails } from "@/lib/costCalculations";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Package, 
  Truck,
  AlertTriangle,
  Percent
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientPricingTableProps {
  clients: Client[];
  products: MatchaProduct[];
  orders: ClientOrder[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  arrivals: WarehouseArrival[];
  allocations: ClientAllocation[];
  isLoading: boolean;
}

export function ClientPricingTable({
  clients,
  products,
  orders,
  suppliers,
  supplierProducts,
  arrivals,
  allocations,
  isLoading,
}: ClientPricingTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Build comprehensive pricing data for each client-product combination
  const pricingData = useMemo(() => {
    const data: ClientPricingDetails[] = [];
    
    // Find which products each client orders
    const clientProductPairs = new Map<string, Set<string>>();
    
    orders.forEach(order => {
      if (!clientProductPairs.has(order.client_id)) {
        clientProductPairs.set(order.client_id, new Set());
      }
      clientProductPairs.get(order.client_id)!.add(order.product_id);
    });
    
    // Also include allocations
    allocations.forEach(alloc => {
      if (!clientProductPairs.has(alloc.client_id)) {
        clientProductPairs.set(alloc.client_id, new Set());
      }
      clientProductPairs.get(alloc.client_id)!.add(alloc.product_id);
    });
    
    clientProductPairs.forEach((productIds, clientId) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      productIds.forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const details = buildClientPricingDetails(
          client,
          product,
          suppliers,
          supplierProducts,
          orders,
          arrivals,
          allocations
        );
        
        if (details) {
          data.push(details);
        }
      });
    });
    
    return data.sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  }, [clients, products, orders, suppliers, supplierProducts, arrivals, allocations]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return pricingData;
    
    const query = searchQuery.toLowerCase();
    return pricingData.filter((item) =>
      item.client.name.toLowerCase().includes(query) ||
      item.product.name.toLowerCase().includes(query) ||
      item.product.grade.toLowerCase().includes(query)
    );
  }, [pricingData, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground">Loading pricing data...</div>
        </CardContent>
      </Card>
    );
  }

  if (pricingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Pricing & Profitability</CardTitle>
          <CardDescription>
            Complete cost breakdown including yen pricing, shipping, and import taxes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>No pricing data available.</p>
            <p className="text-sm mt-2">
              Add cost prices in yen to products and create client orders to see pricing details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Pricing & Profitability</CardTitle>
            <CardDescription>
              Complete cost breakdown: ¥ cost → ${SHIPPING_COST_PER_KG}/kg shipping → {IMPORT_TAX_RATE * 100}% import tax → profit
            </CardDescription>
          </div>
          <TableSearch 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search clients or products..."
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Cost (¥/kg)</TableHead>
                <TableHead className="text-right">Exchange Rate</TableHead>
                <TableHead className="text-right">Total Cost ($/kg)</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-center">Discount</TableHead>
                <TableHead className="text-right">Profit/kg</TableHead>
                <TableHead className="text-right">Monthly kg</TableHead>
                <TableHead className="text-right">Monthly Profit</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Last Arrival</TableHead>
                <TableHead className="text-right">Days to Reorder</TableHead>
                <TableHead className="text-right">Kg Needed</TableHead>
                <TableHead>Next Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <PricingRow key={`${item.client.id}-${item.product.id}`} item={item} />
              ))}
            </TableBody>
          </Table>
        </div>
        {searchQuery && filteredData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No results match "{searchQuery}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PricingRow({ item }: { item: ClientPricingDetails }) {
  const isProfitable = item.profitPerKg > 0;
  const isUrgent = item.daysToNextOrder !== null && item.daysToNextOrder <= 7;
  const needsStock = item.kgNeededToFulfill > 0;

  return (
    <TableRow className={isUrgent ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.client.name}</span>
          {item.discountPercent > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Percent className="h-3 w-3" />
                    {item.discountPercent}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Special discount for this client
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{item.product.name}</span>
          <Badge variant="outline" className="capitalize text-xs">
            {item.product.grade}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">
        ¥{item.costBreakdown.costJpy.toLocaleString()}
      </TableCell>
      <TableCell className="text-right font-mono text-muted-foreground">
        {item.costBreakdown.exchangeRate.toFixed(4)}
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="font-mono">
              ${item.costBreakdown.totalCostPerKg.toFixed(2)}
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <div className="space-y-1">
                <div>Cost USD: ${item.costBreakdown.costUsd.toFixed(2)}</div>
                <div>Shipping: ${item.costBreakdown.shippingCost.toFixed(2)}</div>
                <div>Import Tax (9%): ${item.costBreakdown.importTax.toFixed(2)}</div>
                <div className="font-bold pt-1 border-t">
                  Total: ${item.costBreakdown.totalCostPerKg.toFixed(2)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right font-mono">
        ${item.sellingPricePerKg.toFixed(2)}
      </TableCell>
      <TableCell className="text-center">
        {item.discountPercent > 0 ? (
          <span className="text-amber-600 font-medium">{item.discountPercent}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className={cn(
        "text-right font-mono font-medium",
        isProfitable ? "text-primary" : "text-destructive"
      )}>
        <div className="flex items-center justify-end gap-1">
          {isProfitable ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          ${item.profitPerKg.toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">
        {item.monthlyQuantityKg.toFixed(1)}
      </TableCell>
      <TableCell className={cn(
        "text-right font-mono font-medium",
        isProfitable ? "text-primary" : "text-destructive"
      )}>
        ${item.monthlyProfit.toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{item.existingStock.toFixed(1)}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {item.lastOrderDate ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(item.lastOrderDate), "MMM d")}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {item.lastArrivalDate ? (
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {format(parseISO(item.lastArrivalDate), "MMM d")}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right">
        {item.daysToNextOrder !== null ? (
          <Badge 
            variant="outline" 
            className={cn(
              isUrgent 
                ? "bg-destructive/10 text-destructive border-destructive/20" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isUrgent && <AlertTriangle className="h-3 w-3 mr-1" />}
            {item.daysToNextOrder}d
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {needsStock ? (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono">
            +{item.kgNeededToFulfill.toFixed(1)}kg
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {item.nextDeliveryDate ? (
          <div className="flex items-center gap-1 text-primary">
            <Truck className="h-3 w-3" />
            {format(parseISO(item.nextDeliveryDate), "MMM d")}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
