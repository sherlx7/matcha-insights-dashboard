-- Create matcha products table
CREATE TABLE public.matcha_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('ceremonial', 'premium', 'culinary')),
  origin TEXT NOT NULL,
  cost_per_kg DECIMAL(10,2) NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 100),
  stock_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client orders table (for tracking revenue)
CREATE TABLE public.client_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE RESTRICT,
  quantity_kg DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_revenue DECIMAL(12,2) GENERATED ALWAYS AS (quantity_kg * unit_price) STORED,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory changes table (for version control)
CREATE TABLE public.inventory_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reverted_at TIMESTAMP WITH TIME ZONE
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_matcha_products_updated_at
  BEFORE UPDATE ON public.matcha_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Track inventory changes automatically
CREATE OR REPLACE FUNCTION public.track_inventory_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_kg != NEW.stock_kg THEN
    INSERT INTO public.inventory_changes (product_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'stock_kg', OLD.stock_kg::TEXT, NEW.stock_kg::TEXT);
  END IF;
  IF OLD.status != NEW.status THEN
    INSERT INTO public.inventory_changes (product_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'status', OLD.status, NEW.status);
  END IF;
  IF OLD.cost_per_kg != NEW.cost_per_kg THEN
    INSERT INTO public.inventory_changes (product_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'cost_per_kg', OLD.cost_per_kg::TEXT, NEW.cost_per_kg::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER track_matcha_inventory_changes
  AFTER UPDATE ON public.matcha_products
  FOR EACH ROW
  EXECUTE FUNCTION public.track_inventory_changes();

-- Enable RLS
ALTER TABLE public.matcha_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_changes ENABLE ROW LEVEL SECURITY;

-- Create public read policies (B2B dashboard is for internal use)
CREATE POLICY "Allow public read access to matcha_products"
  ON public.matcha_products FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to clients"
  ON public.clients FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to client_orders"
  ON public.client_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to inventory_changes"
  ON public.inventory_changes FOR SELECT
  USING (true);

-- Create insert/update/delete policies for all tables
CREATE POLICY "Allow public insert to matcha_products"
  ON public.matcha_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to matcha_products"
  ON public.matcha_products FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete to matcha_products"
  ON public.matcha_products FOR DELETE
  USING (true);

CREATE POLICY "Allow public insert to clients"
  ON public.clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to clients"
  ON public.clients FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete to clients"
  ON public.clients FOR DELETE
  USING (true);

CREATE POLICY "Allow public insert to client_orders"
  ON public.client_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to client_orders"
  ON public.client_orders FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete to client_orders"
  ON public.client_orders FOR DELETE
  USING (true);

CREATE POLICY "Allow public insert to inventory_changes"
  ON public.inventory_changes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to inventory_changes"
  ON public.inventory_changes FOR UPDATE
  USING (true);

-- Insert sample matcha products
INSERT INTO public.matcha_products (name, grade, origin, cost_per_kg, quality_score, stock_kg, status) VALUES
  ('Uji Premium', 'ceremonial', 'Uji, Kyoto', 280.00, 95, 45.5, 'in_stock'),
  ('Nishio Select', 'ceremonial', 'Nishio, Aichi', 240.00, 92, 32.0, 'in_stock'),
  ('Kagoshima Organic', 'premium', 'Kagoshima', 180.00, 88, 78.0, 'in_stock'),
  ('Shizuoka Blend', 'premium', 'Shizuoka', 150.00, 85, 120.0, 'in_stock'),
  ('Culinary Grade A', 'culinary', 'Kyoto', 80.00, 75, 200.0, 'in_stock'),
  ('Everyday Matcha', 'culinary', 'Multiple', 60.00, 70, 15.0, 'low_stock');

-- Insert sample clients
INSERT INTO public.clients (name, contact_email, address) VALUES
  ('Zen Cafe Tokyo', 'orders@zencafe.jp', 'Tokyo, Japan'),
  ('Green Leaf Bakery', 'purchase@greenleaf.com', 'Los Angeles, CA'),
  ('Matcha & Co', 'supply@matchaco.co.uk', 'London, UK'),
  ('Pacific Tea House', 'info@pacifictea.com', 'San Francisco, CA'),
  ('Sakura Sweets', 'buy@sakurasweets.jp', 'Osaka, Japan');

-- Insert sample orders
INSERT INTO public.client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status)
SELECT 
  c.id,
  p.id,
  CASE 
    WHEN p.grade = 'ceremonial' THEN 5.0
    WHEN p.grade = 'premium' THEN 15.0
    ELSE 30.0
  END,
  p.cost_per_kg * 1.35,
  CURRENT_DATE - (random() * 30)::INTEGER,
  'delivered'
FROM public.clients c
CROSS JOIN public.matcha_products p
WHERE random() > 0.5;