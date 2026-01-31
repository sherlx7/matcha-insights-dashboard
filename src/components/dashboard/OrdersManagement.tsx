import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSearch } from "./TableSearch";
import { Client, MatchaProduct, ClientOrder } from "@/types/database";
import { useAddOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/useOrderMutations";
import { Plus, Pencil, Trash2, FileSpreadsheet, Info } from "lucide-react";
import { format } from "date-fns";

interface OrdersManagementProps {
  orders: ClientOrder[];
  clients: Client[];
  products: MatchaProduct[];
  isLoading: boolean;
}

export function OrdersManagement({ orders, clients, products, isLoading }: OrdersManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClientOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const addOrder = useAddOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [formData, setFormData] = useState({
    client_id: "",
    product_id: "",
    quantity_kg: "",
    unit_price: "",
    total_revenue: "",
    order_date: format(new Date(), "yyyy-MM-dd"),
    status: "delivered" as ClientOrder["status"],
  });

  // Filter orders based on search
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const client = clients.find(c => c.id === order.client_id);
      const product = products.find(p => p.id === order.product_id);
      return (
        client?.name.toLowerCase().includes(query) ||
        product?.name.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.order_date.includes(query)
      );
    });
  }, [orders, clients, products, searchQuery]);

  const resetForm = () => {
    setFormData({
      client_id: "",
      product_id: "",
      quantity_kg: "",
      unit_price: "",
      total_revenue: "",
      order_date: format(new Date(), "yyyy-MM-dd"),
      status: "delivered",
    });
  };

  const handleAdd = () => {
    const quantity = parseFloat(formData.quantity_kg);
    const unitPrice = parseFloat(formData.unit_price);
    const totalRevenue = formData.total_revenue ? parseFloat(formData.total_revenue) : quantity * unitPrice;

    addOrder.mutate({
      client_id: formData.client_id,
      product_id: formData.product_id,
      quantity_kg: quantity,
      unit_price: unitPrice,
      total_revenue: totalRevenue,
      order_date: formData.order_date,
      status: formData.status,
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdate = () => {
    if (!editingOrder) return;
    
    const quantity = parseFloat(formData.quantity_kg);
    const unitPrice = parseFloat(formData.unit_price);
    const totalRevenue = formData.total_revenue ? parseFloat(formData.total_revenue) : quantity * unitPrice;

    updateOrder.mutate({
      id: editingOrder.id,
      updates: {
        client_id: formData.client_id,
        product_id: formData.product_id,
        quantity_kg: quantity,
        unit_price: unitPrice,
        total_revenue: totalRevenue,
        order_date: formData.order_date,
        status: formData.status,
      }
    }, {
      onSuccess: () => {
        setEditingOrder(null);
        resetForm();
      }
    });
  };

  const handleEdit = (order: ClientOrder) => {
    setEditingOrder(order);
    setFormData({
      client_id: order.client_id,
      product_id: order.product_id,
      quantity_kg: order.quantity_kg.toString(),
      unit_price: order.unit_price.toString(),
      total_revenue: order.total_revenue.toString(),
      order_date: order.order_date,
      status: order.status,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder.mutate(id);
    }
  };

  const getClientName = (clientId: string) => 
    clients.find(c => c.id === clientId)?.name || "Unknown";
  
  const getProductName = (productId: string) => 
    products.find(p => p.id === productId)?.name || "Unknown";

  const getProductCost = (productId: string) => 
    products.find(p => p.id === productId)?.cost_per_kg || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    delivered: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  const OrderForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Client</Label>
          <Select value={formData.client_id} onValueChange={(v) => setFormData(f => ({ ...f, client_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Product</Label>
          <Select value={formData.product_id} onValueChange={(v) => setFormData(f => ({ ...f, product_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity (kg)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.quantity_kg}
            onChange={(e) => setFormData(f => ({ ...f, quantity_kg: e.target.value }))}
            placeholder="0.0"
          />
        </div>
        <div className="space-y-2">
          <Label>Unit Price ($/kg)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => setFormData(f => ({ ...f, unit_price: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Total Revenue ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.total_revenue}
            onChange={(e) => setFormData(f => ({ ...f, total_revenue: e.target.value }))}
            placeholder="Auto-calculated if empty"
          />
          <p className="text-xs text-muted-foreground">Leave empty to auto-calculate from qty × price</p>
        </div>
        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input
            type="date"
            value={formData.order_date}
            onChange={(e) => setFormData(f => ({ ...f, order_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v as ClientOrder["status"] }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={isEdit ? handleUpdate : handleAdd} 
        disabled={!formData.client_id || !formData.product_id || !formData.quantity_kg || !formData.unit_price}
        className="w-full"
      >
        {isEdit ? "Update Order" : "Add Order"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>
            In production, revenue and cost data syncs from your sales system or Xero. 
            Use this interface to add test data for dashboard validation.
          </span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Orders</CardTitle>
            <CardDescription>
              Manage order records for profitability calculations
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <TableSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders..."
            />
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Test Order</DialogTitle>
                  <DialogDescription>
                    Add a test order to validate dashboard calculations
                  </DialogDescription>
                </DialogHeader>
                <OrderForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty (kg)</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.slice(0, 20).map((order) => {
                const cogs = Number(order.quantity_kg) * getProductCost(order.product_id);
                const profit = Number(order.total_revenue) - cogs;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.order_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{getClientName(order.client_id)}</TableCell>
                    <TableCell>{getProductName(order.product_id)}</TableCell>
                    <TableCell className="text-right">{Number(order.quantity_kg).toFixed(1)}</TableCell>
                    <TableCell className="text-right">${Number(order.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(order.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      ${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog open={editingOrder?.id === order.id} onOpenChange={(open) => !open && setEditingOrder(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(order)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Order</DialogTitle>
                              <DialogDescription>
                                Update order details
                              </DialogDescription>
                            </DialogHeader>
                            <OrderForm isEdit />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredOrders.length > 20 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing 20 of {filteredOrders.length} orders
            </p>
          )}
          {searchQuery && filteredOrders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders match "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
