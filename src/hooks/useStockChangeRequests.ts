import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StockChangeRequest, StockChangeReason, StockChangeType, MatchaProduct } from "@/types/database";
import { toast } from "sonner";

export function useStockChangeRequests(status?: 'pending' | 'approved' | 'rejected') {
  return useQuery({
    queryKey: ["stock-change-requests", status],
    queryFn: async () => {
      let query = supabase
        .from("stock_change_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StockChangeRequest[];
    },
  });
}

interface CreateStockChangeRequest {
  product_id: string;
  requested_by: string;
  change_type: StockChangeType;
  quantity_kg: number;
  new_stock_kg: number;
  reason: StockChangeReason;
  notes?: string;
}

export function useCreateStockChangeRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: CreateStockChangeRequest) => {
      const { data, error } = await supabase
        .from("stock_change_requests")
        .insert({
          product_id: request.product_id,
          requested_by: request.requested_by,
          change_type: request.change_type,
          quantity_kg: request.quantity_kg,
          new_stock_kg: request.new_stock_kg,
          reason: request.reason,
          notes: request.notes || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-change-requests"] });
      toast.success("Stock change request submitted for approval");
    },
    onError: (error) => {
      toast.error("Failed to submit request: " + error.message);
    },
  });
}

interface ReviewStockChangeRequest {
  id: string;
  decision: 'approved' | 'rejected';
  reviewed_by: string;
  review_notes?: string;
  product_id: string;
  new_stock_kg: number;
}

export function useReviewStockChangeRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: ReviewStockChangeRequest) => {
      // Update the request status
      const { error: requestError } = await supabase
        .from("stock_change_requests")
        .update({
          status: review.decision,
          reviewed_by: review.reviewed_by,
          reviewed_at: new Date().toISOString(),
          review_notes: review.review_notes || null,
        })
        .eq("id", review.id);
      
      if (requestError) throw requestError;
      
      // If approved, update the product stock
      if (review.decision === 'approved') {
        const newStatus = review.new_stock_kg <= 0 ? 'out_of_stock' : 
                         review.new_stock_kg <= 20 ? 'low_stock' : 'in_stock';
        
        const { error: productError } = await supabase
          .from("matcha_products")
          .update({ 
            stock_kg: review.new_stock_kg,
            status: newStatus,
          })
          .eq("id", review.product_id);
        
        if (productError) throw productError;
      }
      
      return review.decision;
    },
    onSuccess: (decision) => {
      queryClient.invalidateQueries({ queryKey: ["stock-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["matcha-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-changes"] });
      toast.success(`Stock change ${decision === 'approved' ? 'approved and applied' : 'rejected'}`);
    },
    onError: (error) => {
      toast.error("Failed to process review: " + error.message);
    },
  });
}
