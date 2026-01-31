export interface MatchaProduct {
  id: string;
  name: string;
  grade: 'ceremonial' | 'premium' | 'culinary';
  origin: string;
  cost_per_kg: number;
  quality_score: number;
  stock_kg: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
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
