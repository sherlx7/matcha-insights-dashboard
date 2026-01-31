-- Add cost_per_kg_jpy to matcha_products for yen pricing
ALTER TABLE public.matcha_products
ADD COLUMN cost_per_kg_jpy numeric DEFAULT NULL,
ADD COLUMN selling_price_per_kg numeric DEFAULT NULL;

-- Add exchange rate to suppliers (JPY to USD)
ALTER TABLE public.suppliers
ADD COLUMN exchange_rate_jpy_usd numeric DEFAULT 0.0067;

-- Add client discount and delivery preferences
ALTER TABLE public.clients
ADD COLUMN discount_percent numeric DEFAULT 0,
ADD COLUMN delivery_day_of_month integer DEFAULT NULL;

-- Add scheduled delivery date to client_orders
ALTER TABLE public.client_orders
ADD COLUMN scheduled_delivery_date date DEFAULT NULL;

-- Add cost tracking to warehouse_arrivals  
ALTER TABLE public.warehouse_arrivals
ADD COLUMN cost_per_kg_jpy numeric DEFAULT NULL,
ADD COLUMN exchange_rate_used numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.matcha_products.cost_per_kg_jpy IS 'Cost price in Japanese Yen per kg';
COMMENT ON COLUMN public.matcha_products.selling_price_per_kg IS 'Base selling price in USD per kg';
COMMENT ON COLUMN public.suppliers.exchange_rate_jpy_usd IS 'Exchange rate from JPY to USD';
COMMENT ON COLUMN public.clients.discount_percent IS 'Special discount percentage for this client';
COMMENT ON COLUMN public.clients.delivery_day_of_month IS 'Preferred delivery day of month';
COMMENT ON COLUMN public.client_orders.scheduled_delivery_date IS 'Scheduled delivery date for this order';