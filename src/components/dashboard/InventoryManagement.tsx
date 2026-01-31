import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MatchaProduct, 
  Supplier, 
  SupplierProduct, 
  WarehouseArrival,
  ClientAllocation,
  Client,
  ProductInventoryStatus,
  ReorderAlert
} from "@/types/database";
import { 
  useUpdateSupplierProduct, 
  useAddWarehouseArrival 
} from "@/hooks/useMatchaData";
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  Edit2, 
  Check, 
  X, 
  Plus,
  Users,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface InventoryManagementProps {
  products: MatchaProduct[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  arrivals: WarehouseArrival[];
  allocations: ClientAllocation[];
  clients: Client[];
  isLoading: boolean;
}

export function InventoryManagement({
  products,
  suppliers,
  supplierProducts,
  arrivals,
  allocations,
  clients,
  isLoading,
}: InventoryManagementProps) {
  // Calculate inventory status for each product
  const inventoryStatus: ProductInventoryStatus[] = useMemo(() => {
    return products.map(product => {
      const productAllocations = allocations.filter(a => a.product_id === product.id);
      const allocatedStock = productAllocations.reduce((sum, a) => sum + Number(a.allocated_kg), 0);
      const unallocatedStock = Number(product.stock_kg) - allocatedStock;
      
      const primarySupplierProduct = supplierProducts.find(
        sp => sp.product_id === product.id && sp.is_primary_supplier
      );
      const primarySupplier = primarySupplierProduct 
        ? suppliers.find(s => s.id === primarySupplierProduct.supplier_id)
        : null;
      
      return {
        product,
        totalStock: Number(product.stock_kg),
        allocatedStock,
        unallocatedStock: Math.max(0, unallocatedStock),
        needsReorder: Number(product.stock_kg) <= Number(product.reorder_point_kg),
        primarySupplier,
        supplierPrice: primarySupplierProduct?.unit_cost || null,
        leadTimeDays: primarySupplier?.lead_time_days || null,
        allocations: productAllocations.map(a => ({
          ...a,
          client: clients.find(c => c.id === a.client_id)!
        })).filter(a => a.client),
      };
    });
  }, [products, allocations, supplierProducts, suppliers, clients]);

  // Calculate reorder alerts
  const reorderAlerts: ReorderAlert[] = useMemo(() => {
    return inventoryStatus
      .filter(item => item.needsReorder)
      .map(item => {
        const stockPercentage = (item.totalStock / Number(item.product.reorder_point_kg)) * 100;
        let urgency: ReorderAlert['urgency'] = 'low';
        if (stockPercentage <= 25) urgency = 'critical';
        else if (stockPercentage <= 50) urgency = 'high';
        else if (stockPercentage <= 75) urgency = 'medium';
        
        return {
          product: item.product,
          currentStock: item.totalStock,
          reorderPoint: Number(item.product.reorder_point_kg),
          suggestedOrderQty: Number(item.product.reorder_quantity_kg),
          primarySupplier: item.primarySupplier,
          supplierPrice: item.supplierPrice,
          leadTimeDays: item.leadTimeDays,
          urgency,
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
  }, [inventoryStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reorder Alerts */}
      {reorderAlerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Reorder Alerts</CardTitle>
              <Badge variant="destructive">{reorderAlerts.length}</Badge>
            </div>
            <CardDescription>
              Products below reorder point that need to be ordered from suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReorderAlertsTable alerts={reorderAlerts} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="arrivals" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Warehouse Arrivals
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Allocations
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Supplier Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels & Availability</CardTitle>
              <CardDescription>
                Current stock, allocated vs unallocated inventory per product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockLevelsTable inventoryStatus={inventoryStatus} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arrivals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Warehouse Arrivals</CardTitle>
                  <CardDescription>
                    Record incoming shipments from suppliers
                  </CardDescription>
                </div>
                <NewArrivalDialog 
                  products={products} 
                  suppliers={suppliers} 
                  supplierProducts={supplierProducts}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ArrivalsTable 
                arrivals={arrivals} 
                products={products} 
                suppliers={suppliers} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle>Client Stock Allocations</CardTitle>
              <CardDescription>
                View reserved stock per client and available inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllocationsTable 
                inventoryStatus={inventoryStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Pricing</CardTitle>
              <CardDescription>
                Manage supplier costs and update pricing when changes occur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierPricingTable 
                suppliers={suppliers}
                products={products}
                supplierProducts={supplierProducts}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReorderAlertsTable({ alerts }: { alerts: ReorderAlert[] }) {
  const urgencyColors = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-destructive/80 text-destructive-foreground",
    medium: "bg-amber-500 text-amber-50",
    low: "bg-amber-400 text-amber-900",
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Urgency</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Current Stock</TableHead>
          <TableHead className="text-right">Reorder Point</TableHead>
          <TableHead className="text-right">Suggested Order</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Cost/kg</TableHead>
          <TableHead className="text-right">Lead Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.product.id}>
            <TableCell>
              <Badge className={cn("capitalize", urgencyColors[alert.urgency])}>
                {alert.urgency}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{alert.product.name}</TableCell>
            <TableCell className="text-right font-mono">
              {alert.currentStock.toFixed(1)} kg
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground">
              {alert.reorderPoint.toFixed(1)} kg
            </TableCell>
            <TableCell className="text-right font-mono text-primary font-medium">
              {alert.suggestedOrderQty.toFixed(1)} kg
            </TableCell>
            <TableCell>
              {alert.primarySupplier?.name || "—"}
            </TableCell>
            <TableCell className="text-right">
              {alert.supplierPrice ? `$${alert.supplierPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="text-right">
              {alert.leadTimeDays ? `${alert.leadTimeDays} days` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StockLevelsTable({ inventoryStatus }: { inventoryStatus: ProductInventoryStatus[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead className="text-right">Total Stock</TableHead>
          <TableHead className="text-right">Allocated</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">Reorder Point</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Primary Supplier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventoryStatus.map((item) => (
          <TableRow key={item.product.id}>
            <TableCell className="font-medium">{item.product.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {item.product.grade}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {item.totalStock.toFixed(1)} kg
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground">
              {item.allocatedStock.toFixed(1)} kg
            </TableCell>
            <TableCell className="text-right font-mono font-medium text-primary">
              {item.unallocatedStock.toFixed(1)} kg
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground">
              {Number(item.product.reorder_point_kg).toFixed(1)} kg
            </TableCell>
            <TableCell>
              {item.needsReorder ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Reorder
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  OK
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.primarySupplier?.name || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ArrivalsTable({ 
  arrivals, 
  products, 
  suppliers 
}: { 
  arrivals: WarehouseArrival[];
  products: MatchaProduct[];
  suppliers: Supplier[];
}) {
  const productMap = new Map(products.map(p => [p.id, p]));
  const supplierMap = new Map(suppliers.map(s => [s.id, s]));

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    received: "bg-primary/10 text-primary border-primary/20",
    inspecting: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (arrivals.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No arrivals recorded yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <TableHead>Batch #</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {arrivals.map((arrival) => {
          const product = productMap.get(arrival.product_id);
          const supplier = supplierMap.get(arrival.supplier_id);
          
          return (
            <TableRow key={arrival.id}>
              <TableCell>
                {format(new Date(arrival.arrival_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="font-medium">
                {product?.name || "Unknown"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {supplier?.name || "Unknown"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {Number(arrival.quantity_kg).toFixed(1)} kg
              </TableCell>
              <TableCell className="text-right">
                ${Number(arrival.unit_cost).toFixed(2)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {arrival.batch_number || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", statusColors[arrival.status])}>
                  {arrival.status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function AllocationsTable({ inventoryStatus }: { inventoryStatus: ProductInventoryStatus[] }) {
  const productsWithAllocations = inventoryStatus.filter(item => item.allocations.length > 0);

  if (productsWithAllocations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No allocations yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {productsWithAllocations.map((item) => (
        <div key={item.product.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.product.name}</span>
              <Badge variant="outline" className="capitalize">{item.product.grade}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Total: <span className="font-mono">{item.totalStock.toFixed(1)} kg</span>
              </span>
              <span className="text-muted-foreground">
                Allocated: <span className="font-mono">{item.allocatedStock.toFixed(1)} kg</span>
              </span>
              <span className="text-primary font-medium">
                Available: <span className="font-mono">{item.unallocatedStock.toFixed(1)} kg</span>
              </span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead>Reserved Until</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.allocations.map((alloc) => (
                <TableRow key={alloc.id}>
                  <TableCell className="font-medium">{alloc.client.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(alloc.allocated_kg).toFixed(1)} kg
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {alloc.reserved_until 
                      ? format(new Date(alloc.reserved_until), "MMM d, yyyy")
                      : "—"
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {alloc.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

function SupplierPricingTable({
  suppliers,
  products,
  supplierProducts,
}: {
  suppliers: Supplier[];
  products: MatchaProduct[];
  supplierProducts: SupplierProduct[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const updatePricing = useUpdateSupplierProduct();

  const productMap = new Map(products.map(p => [p.id, p]));
  const supplierMap = new Map(suppliers.map(s => [s.id, s]));

  const startEdit = (sp: SupplierProduct) => {
    setEditingId(sp.id);
    setEditValue(Number(sp.unit_cost));
  };

  const saveEdit = () => {
    if (editingId && editValue > 0) {
      updatePricing.mutate({ id: editingId, updates: { unit_cost: editValue } });
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Cost/kg</TableHead>
          <TableHead className="text-right">Min Order</TableHead>
          <TableHead>Primary</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {supplierProducts.map((sp) => {
          const supplier = supplierMap.get(sp.supplier_id);
          const product = productMap.get(sp.product_id);
          
          return (
            <TableRow key={sp.id}>
              <TableCell className="font-medium">{supplier?.name || "Unknown"}</TableCell>
              <TableCell>{product?.name || "Unknown"}</TableCell>
              <TableCell className="text-right">
                {editingId === sp.id ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => setEditValue(parseFloat(e.target.value))}
                    className="w-24 h-8"
                  />
                ) : (
                  <span className="font-mono">${Number(sp.unit_cost).toFixed(2)}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {Number(sp.min_order_kg).toFixed(1)} kg
              </TableCell>
              <TableCell>
                {sp.is_primary_supplier ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">Primary</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(sp.last_price_update), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                {editingId === sp.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8">
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <Button size="icon" variant="ghost" onClick={() => startEdit(sp)} className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function NewArrivalDialog({
  products,
  suppliers,
  supplierProducts,
}: {
  products: MatchaProduct[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  
  const addArrival = useAddWarehouseArrival();

  // Get available suppliers for selected product
  const availableSuppliers = useMemo(() => {
    if (!productId) return suppliers;
    const productSupplierIds = supplierProducts
      .filter(sp => sp.product_id === productId)
      .map(sp => sp.supplier_id);
    return suppliers.filter(s => productSupplierIds.includes(s.id));
  }, [productId, suppliers, supplierProducts]);

  // Get unit cost for selected product/supplier combo
  const unitCost = useMemo(() => {
    if (!productId || !supplierId) return 0;
    const sp = supplierProducts.find(
      sp => sp.product_id === productId && sp.supplier_id === supplierId
    );
    return sp ? Number(sp.unit_cost) : 0;
  }, [productId, supplierId, supplierProducts]);

  const handleSubmit = () => {
    if (!productId || !supplierId || !quantity || parseFloat(quantity) <= 0) {
      return;
    }

    addArrival.mutate({
      product_id: productId,
      supplier_id: supplierId,
      quantity_kg: parseFloat(quantity),
      unit_cost: unitCost,
      arrival_date: new Date().toISOString().split('T')[0],
      batch_number: batchNumber || null,
      expiry_date: null,
      status: 'received',
      notes: null,
    }, {
      onSuccess: () => {
        setOpen(false);
        setProductId("");
        setSupplierId("");
        setQuantity("");
        setBatchNumber("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Record Arrival
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Warehouse Arrival</DialogTitle>
          <DialogDescription>
            Record incoming matcha shipment from supplier
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <Select value={productId} onValueChange={(v) => { setProductId(v); setSupplierId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier</label>
            <Select value={supplierId} onValueChange={setSupplierId} disabled={!productId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {availableSuppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity (kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Cost</label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                ${unitCost.toFixed(2)}/kg
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Number (optional)</label>
            <Input
              placeholder="e.g., BATCH-2024-001"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!productId || !supplierId || !quantity || addArrival.isPending}
          >
            {addArrival.isPending ? "Saving..." : "Record Arrival"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
