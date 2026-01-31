import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  MatchaProduct, 
  Client, 
  ClientOrder, 
  InventoryChange,
  Supplier,
  SupplierProduct,
  WarehouseArrival,
  ClientAllocation
} from "@/types/database";
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

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useSupplierProducts() {
  return useQuery({
    queryKey: ["supplier-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_products")
        .select("*")
        .order("is_primary_supplier", { ascending: false });
      
      if (error) throw error;
      return data as SupplierProduct[];
    },
  });
}

export function useWarehouseArrivals() {
  return useQuery({
    queryKey: ["warehouse-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouse_arrivals")
        .select("*")
        .order("arrival_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as WarehouseArrival[];
    },
  });
}

export function useClientAllocations() {
  return useQuery({
    queryKey: ["client-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_allocations")
        .select("*")
        .order("allocated_kg", { ascending: false });
      
      if (error) throw error;
      return data as ClientAllocation[];
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

export function useUpdateSupplierProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupplierProduct> }) => {
      const { data, error } = await supabase
        .from("supplier_products")
        .update({ 
          ...updates, 
          last_price_update: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      toast.success("Supplier pricing updated");
    },
    onError: (error) => {
      toast.error("Failed to update pricing: " + error.message);
    },
  });
}

export function useAddWarehouseArrival() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (arrival: Omit<WarehouseArrival, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("warehouse_arrivals")
        .insert(arrival)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update product stock directly
      const { data: product } = await supabase
        .from("matcha_products")
        .select("stock_kg")
        .eq("id", arrival.product_id)
        .single();
      
      if (product) {
        await supabase
          .from("matcha_products")
          .update({ 
            stock_kg: Number(product.stock_kg) + Number(arrival.quantity_kg),
            status: 'in_stock'
          })
          .eq("id", arrival.product_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["matcha-products"] });
      toast.success("Warehouse arrival recorded and stock updated");
    },
    onError: (error) => {
      toast.error("Failed to record arrival: " + error.message);
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientAllocation> }) => {
      const { data, error } = await supabase
        .from("client_allocations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-allocations"] });
      toast.success("Allocation updated");
    },
    onError: (error) => {
      toast.error("Failed to update allocation: " + error.message);
    },
  });
}

export function useAddAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (allocation: Omit<ClientAllocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("client_allocations")
        .insert(allocation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-allocations"] });
      toast.success("Allocation created");
    },
    onError: (error) => {
      toast.error("Failed to create allocation: " + error.message);
    },
  });
}

export function useRevertChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ change, product }: { change: InventoryChange; product: MatchaProduct }) => {
      const updates: Partial<MatchaProduct> = {};
      
      if (change.field_changed === "stock_kg" && change.old_value) {
        updates.stock_kg = parseFloat(change.old_value);
      } else if (change.field_changed === "status" && change.old_value) {
        updates.status = change.old_value as MatchaProduct["status"];
      } else if (change.field_changed === "cost_per_kg" && change.old_value) {
        updates.cost_per_kg = parseFloat(change.old_value);
      }
      
      const { error: productError } = await supabase
        .from("matcha_products")
        .update(updates)
        .eq("id", change.product_id);
      
      if (productError) throw productError;
      
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
