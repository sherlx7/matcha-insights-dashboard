import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MatchaProduct, InventoryChange } from "@/types/database";
import { useUpdateProduct, useInventoryChanges, useRevertChange } from "@/hooks/useMatchaData";
import { Pencil, History, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface InventoryTableProps {
  products: MatchaProduct[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  in_stock: "bg-primary/10 text-primary border-primary/20",
  low_stock: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  out_of_stock: "bg-destructive/10 text-destructive border-destructive/20",
  discontinued: "bg-muted text-muted-foreground border-muted",
};

const gradeColors: Record<string, string> = {
  ceremonial: "bg-primary text-primary-foreground",
  premium: "bg-accent text-accent-foreground",
  culinary: "bg-secondary text-secondary-foreground",
};

export function InventoryTable({ products, isLoading }: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<MatchaProduct>>({});
  const [historyProduct, setHistoryProduct] = useState<MatchaProduct | null>(null);
  
  const updateProduct = useUpdateProduct();
  const { data: changes } = useInventoryChanges(historyProduct?.id);
  const revertChange = useRevertChange();

  const startEditing = (product: MatchaProduct) => {
    setEditingId(product.id);
    setEditValues({
      stock_kg: product.stock_kg,
      status: product.status,
      cost_per_kg: product.cost_per_kg,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      updateProduct.mutate({ id: editingId, updates: editValues });
      setEditingId(null);
      setEditValues({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleRevert = (change: InventoryChange) => {
    if (historyProduct) {
      revertChange.mutate({ change, product: historyProduct });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead className="text-right">Cost/kg</TableHead>
            <TableHead className="text-right">Stock (kg)</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge className={cn("capitalize", gradeColors[product.grade])}>
                  {product.grade}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{product.origin}</TableCell>
              <TableCell className="text-right">
                {editingId === product.id ? (
                  <Input
                    type="number"
                    value={editValues.cost_per_kg}
                    onChange={(e) => setEditValues({ ...editValues, cost_per_kg: parseFloat(e.target.value) })}
                    className="w-24 h-8"
                  />
                ) : (
                  `$${product.cost_per_kg.toFixed(2)}`
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingId === product.id ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={editValues.stock_kg}
                    onChange={(e) => setEditValues({ ...editValues, stock_kg: parseFloat(e.target.value) })}
                    className="w-24 h-8"
                  />
                ) : (
                  product.stock_kg.toFixed(1)
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${product.quality_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{product.quality_score}</span>
                </div>
              </TableCell>
              <TableCell>
                {editingId === product.id ? (
                  <Select
                    value={editValues.status}
                    onValueChange={(value) => setEditValues({ ...editValues, status: value as MatchaProduct["status"] })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn("capitalize", statusColors[product.status])}>
                    {product.status.replace("_", " ")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {editingId === product.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8">
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8">
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => startEditing(product)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => setHistoryProduct(product)} className="h-8 w-8">
                            <History className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Change History: {product.name}</DialogTitle>
                            <DialogDescription>
                              View and revert previous changes to this product's inventory.
                            </DialogDescription>
                          </DialogHeader>
                          <ChangeHistory 
                            changes={changes || []} 
                            onRevert={handleRevert}
                            isReverting={revertChange.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function ChangeHistory({ 
  changes, 
  onRevert, 
  isReverting 
}: { 
  changes: InventoryChange[]; 
  onRevert: (change: InventoryChange) => void;
  isReverting: boolean;
}) {
  if (changes.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No changes recorded yet.
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Field</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => (
            <TableRow key={change.id} className={change.reverted_at ? "opacity-50" : ""}>
              <TableCell className="text-sm">
                {format(new Date(change.changed_at), "MMM d, HH:mm")}
              </TableCell>
              <TableCell className="capitalize font-medium">
                {change.field_changed.replace("_", " ")}
              </TableCell>
              <TableCell className="text-muted-foreground">{change.old_value}</TableCell>
              <TableCell>{change.new_value}</TableCell>
              <TableCell>
                {change.reverted_at ? (
                  <Badge variant="outline" className="text-muted-foreground">Reverted</Badge>
                ) : (
                  <Badge variant="outline" className="text-primary border-primary/20">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!change.reverted_at && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onRevert(change)}
                    disabled={isReverting}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
