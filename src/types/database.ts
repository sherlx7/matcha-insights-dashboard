export interface MatchaProduct {
  id: string;
  name: string;
  grade: 'ceremonial' | 'premium' | 'culinary';
  origin: string;
  cost_per_kg: number;
  quality_score: number;
  stock_kg: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  reorder_point_kg: number;
  reorder_quantity_kg: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientOrder {
  id: string;
  client_id: string;
  product_id: string;
  quantity_kg: number;
  unit_price: number;
  total_revenue: number;
  order_date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface InventoryChange {
  id: string;
  product_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  changed_at: string;
  reverted_at: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  lead_time_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  unit_cost: number;
  min_order_kg: number;
  is_primary_supplier: boolean;
  last_price_update: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseArrival {
  id: string;
  product_id: string;
  supplier_id: string;
  quantity_kg: number;
  unit_cost: number;
  arrival_date: string;
  batch_number: string | null;
  expiry_date: string | null;
  status: 'pending' | 'received' | 'inspecting' | 'rejected';
  notes: string | null;
  created_at: string;
}

export interface ClientAllocation {
  id: string;
  client_id: string;
  product_id: string;
  allocated_kg: number;
  reserved_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProfitability {
  client: Client;
  totalRevenue: number;
  totalCOGS: number;
  profit: number;
  profitMargin: number;
  orders: (ClientOrder & { product: MatchaProduct })[];
}

export interface ProductRecommendation {
  currentProduct: MatchaProduct;
  recommendedProduct: MatchaProduct;
  client: Client;
  potentialSavings: number;
  reason: string;
}

export interface ProductInventoryStatus {
  product: MatchaProduct;
  totalStock: number;
  allocatedStock: number;
  unallocatedStock: number;
  needsReorder: boolean;
  primarySupplier: Supplier | null;
  supplierPrice: number | null;
  leadTimeDays: number | null;
  allocations: (ClientAllocation & { client: Client })[];
}

export interface ReorderAlert {
  product: MatchaProduct;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  primarySupplier: Supplier | null;
  supplierPrice: number | null;
  leadTimeDays: number | null;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
