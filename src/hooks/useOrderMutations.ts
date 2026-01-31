import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientOrder } from "@/types/database";
import { toast } from "sonner";

export function useAddOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: Omit<ClientOrder, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("client_orders")
        .insert(order)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      toast.success("Order added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add order: " + error.message);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientOrder> }) => {
      const { data, error } = await supabase
        .from("client_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      toast.success("Order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update order: " + error.message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_orders")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      toast.success("Order deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete order: " + error.message);
    },
  });
}
