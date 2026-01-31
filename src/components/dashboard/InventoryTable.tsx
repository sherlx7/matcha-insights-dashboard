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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableSearch } from "./TableSearch";
import { MatchaProduct, InventoryChange } from "@/types/database";
import { useInventoryChanges, useRevertChange } from "@/hooks/useMatchaData";
import { useStockChangeRequests } from "@/hooks/useStockChangeRequests";
import { Pencil, History, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StockChangeRequestDialog } from "./StockChangeRequestDialog";

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
  const [historyProduct, setHistoryProduct] = useState<MatchaProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<MatchaProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: changes } = useInventoryChanges(historyProduct?.id);
  const revertChange = useRevertChange();
  const { data: pendingRequests = [] } = useStockChangeRequests('pending');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.grade.toLowerCase().includes(query) ||
      product.origin.toLowerCase().includes(query) ||
      product.status.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleRevert = (change: InventoryChange) => {
    if (historyProduct) {
      revertChange.mutate({ change, product: historyProduct });
    }
  };

  // Check if a product has a pending request
  const hasPendingRequest = (productId: string) => {
    return pendingRequests.some(r => r.product_id === productId);
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
      <div className="flex justify-end mb-4">
        <TableSearch 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products..."
        />
      </div>
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
          {filteredProducts.map((product) => {
            const isPending = hasPendingRequest(product.id);
            
            return (
              <TableRow key={product.id} className={isPending ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {product.name}
                    {isPending && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("capitalize", gradeColors[product.grade])}>
                    {product.grade}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.origin}</TableCell>
                <TableCell className="text-right">
                  ${Number(product.cost_per_kg).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {Number(product.stock_kg).toFixed(1)}
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
                  <Badge variant="outline" className={cn("capitalize", statusColors[product.status])}>
                    {product.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setEditingProduct(product)} 
                      className="h-8 w-8"
                      disabled={isPending}
                      title={isPending ? "This product has a pending stock change request" : "Request stock change"}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setHistoryProduct(product)} 
                          className="h-8 w-8"
                        >
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
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {searchQuery && filteredProducts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No products match "{searchQuery}"
        </p>
      )}

      {/* Stock Change Request Dialog */}
      {editingProduct && (
        <StockChangeRequestDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
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
