import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatchaProduct, Client, ClientOrder, InventoryChange } from "@/types/database";
import { toast } from "sonner";

export function useMatchaProducts() {
  return useQuery({
    queryKey: ["matcha-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matcha_products")
        .select("*")
        .order("grade", { ascending: true });
      
      if (error) throw error;
      return data as MatchaProduct[];
    },
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClientOrders() {
  return useQuery({
    queryKey: ["client-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_orders")
        .select("*")
        .order("order_date", { ascending: false });
      
      if (error) throw error;
      return data as ClientOrder[];
    },
  });
}

export function useInventoryChanges(productId?: string) {
  return useQuery({
    queryKey: ["inventory-changes", productId],
    queryFn: async () => {
      let query = supabase
        .from("inventory_changes")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);
      
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryChange[];
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MatchaProduct> }) => {
      const { data, error } = await supabase
        .from("matcha_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matcha-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-changes"] });
      toast.success("Inventory updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update inventory: " + error.message);
    },
  });
}

export function useRevertChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ change, product }: { change: InventoryChange; product: MatchaProduct }) => {
      // Revert the product to the old value
      const updates: Partial<MatchaProduct> = {};
      
      if (change.field_changed === "stock_kg" && change.old_value) {
        updates.stock_kg = parseFloat(change.old_value);
      } else if (change.field_changed === "status" && change.old_value) {
        updates.status = change.old_value as MatchaProduct["status"];
      } else if (change.field_changed === "cost_per_kg" && change.old_value) {
        updates.cost_per_kg = parseFloat(change.old_value);
      }
      
      // Update the product
      const { error: productError } = await supabase
        .from("matcha_products")
        .update(updates)
        .eq("id", change.product_id);
      
      if (productError) throw productError;
      
      // Mark the change as reverted
      const { error: changeError } = await supabase
        .from("inventory_changes")
        .update({ reverted_at: new Date().toISOString() })
        .eq("id", change.id);
      
      if (changeError) throw changeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matcha-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-changes"] });
      toast.success("Change reverted successfully");
    },
    onError: (error) => {
      toast.error("Failed to revert change: " + error.message);
    },
  });
}
