import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MatchaProduct, StockChangeReason, STOCK_CHANGE_REASON_LABELS } from "@/types/database";
import { useCreateStockChangeRequest } from "@/hooks/useStockChangeRequests";
import { AlertCircle } from "lucide-react";

const stockChangeSchema = z.object({
  change_type: z.enum(["increase", "decrease", "set"]),
  quantity_kg: z.number().min(0.1, "Quantity must be at least 0.1 kg"),
  reason: z.enum([
    "reservation_made",
    "reservation_cancelled",
    "damage_to_stock",
    "quality_issue",
    "stock_correction",
    "sample_given",
    "internal_use",
    "other",
  ]),
  notes: z.string().max(500).optional(),
  requested_by: z.string().min(2, "Name is required"),
});

type StockChangeFormData = z.infer<typeof stockChangeSchema>;

interface StockChangeRequestDialogProps {
  product: MatchaProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockChangeRequestDialog({
  product,
  open,
  onOpenChange,
}: StockChangeRequestDialogProps) {
  const createRequest = useCreateStockChangeRequest();
  
  const form = useForm<StockChangeFormData>({
    resolver: zodResolver(stockChangeSchema),
    defaultValues: {
      change_type: "decrease",
      quantity_kg: 0,
      reason: "stock_correction",
      notes: "",
      requested_by: "",
    },
  });

  const watchChangeType = form.watch("change_type");
  const watchQuantity = form.watch("quantity_kg");

  const calculateNewStock = () => {
    const currentStock = Number(product.stock_kg);
    const qty = Number(watchQuantity) || 0;
    
    switch (watchChangeType) {
      case "increase":
        return currentStock + qty;
      case "decrease":
        return Math.max(0, currentStock - qty);
      case "set":
        return qty;
      default:
        return currentStock;
    }
  };

  const newStock = calculateNewStock();
  const stockDifference = newStock - Number(product.stock_kg);

  const onSubmit = (data: StockChangeFormData) => {
    createRequest.mutate({
      product_id: product.id,
      requested_by: data.requested_by,
      change_type: data.change_type,
      quantity_kg: data.quantity_kg,
      new_stock_kg: newStock,
      reason: data.reason as StockChangeReason,
      notes: data.notes,
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Stock Change</DialogTitle>
          <DialogDescription>
            Submit a manual stock adjustment for supervisor approval.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {product.grade} grade
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-lg font-mono font-semibold">
                {Number(product.stock_kg).toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requested_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="change_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="decrease">Decrease</SelectItem>
                        <SelectItem value="increase">Increase</SelectItem>
                        <SelectItem value="set">Set to Value</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchQuantity > 0 && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New Stock Level:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{newStock.toFixed(1)} kg</span>
                    <Badge 
                      variant={stockDifference >= 0 ? "default" : "destructive"}
                      className="font-mono"
                    >
                      {stockDifference >= 0 ? "+" : ""}{stockDifference.toFixed(1)} kg
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(STOCK_CHANGE_REASON_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about this adjustment..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add context for the supervisor reviewing this request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This request will be sent for supervisor approval before the stock is updated.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
