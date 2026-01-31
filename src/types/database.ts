export interface MatchaProduct {
  id: string;
  name: string;
  grade: 'ceremonial' | 'premium' | 'culinary';
  origin: string;
  cost_per_kg: number;
  cost_per_kg_jpy: number | null;
  selling_price_per_kg: number | null;
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
  discount_percent: number;
  delivery_day_of_month: number | null;
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
  scheduled_delivery_date: string | null;
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
  exchange_rate_jpy_usd: number;
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
  cost_per_kg_jpy: number | null;
  exchange_rate_used: number | null;
  arrival_date: string;
  batch_number: string | null;
  expiry_date: string | null;
  status: 'pending' | 'received' | 'inspecting' | 'rejected';
  notes: string | null;
  created_at: string;
}

export type StockChangeReason = 
  | 'reservation_made'
  | 'reservation_cancelled'
  | 'damage_to_stock'
  | 'quality_issue'
  | 'stock_correction'
  | 'sample_given'
  | 'internal_use'
  | 'other';

export type StockChangeType = 'increase' | 'decrease' | 'set';

export interface StockChangeRequest {
  id: string;
  product_id: string;
  requested_by: string;
  change_type: StockChangeType;
  quantity_kg: number;
  new_stock_kg: number | null;
  reason: StockChangeReason;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export const STOCK_CHANGE_REASON_LABELS: Record<StockChangeReason, string> = {
  reservation_made: 'Reservation Made',
  reservation_cancelled: 'Reservation Cancelled',
  damage_to_stock: 'Damage to Stock',
  quality_issue: 'Quality Issue',
  stock_correction: 'Stock Correction',
  sample_given: 'Sample Given',
  internal_use: 'Internal Use',
  other: 'Other',
};

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

// Cost calculation constants
export const SHIPPING_COST_PER_KG = 15; // $15/kg shipping
export const IMPORT_TAX_RATE = 0.09; // 9% import tax

// Cost calculation utilities
export interface ProductCostBreakdown {
  costJpy: number;
  exchangeRate: number;
  costUsd: number;
  shippingCost: number;
  subtotalBeforeTax: number;
  importTax: number;
  totalCostPerKg: number;
}

export function calculateProductCost(
  costJpy: number,
  exchangeRate: number
): ProductCostBreakdown {
  const costUsd = costJpy * exchangeRate;
  const shippingCost = SHIPPING_COST_PER_KG;
  const subtotalBeforeTax = costUsd + shippingCost;
  const importTax = subtotalBeforeTax * IMPORT_TAX_RATE;
  const totalCostPerKg = subtotalBeforeTax + importTax;

  return {
    costJpy,
    exchangeRate,
    costUsd,
    shippingCost,
    subtotalBeforeTax,
    importTax,
    totalCostPerKg,
  };
}

export interface ClientPricingDetails {
  client: Client;
  product: MatchaProduct;
  costBreakdown: ProductCostBreakdown;
  sellingPricePerKg: number;
  discountPercent: number;
  effectiveSellingPrice: number;
  profitPerKg: number;
  monthlyQuantityKg: number;
  monthlyProfit: number;
  existingStock: number;
  lastOrderDate: string | null;
  lastArrivalDate: string | null;
  daysToNextOrder: number | null;
  kgNeededToFulfill: number;
  nextDeliveryDate: string | null;
}
