-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT,
  lead_time_days INTEGER DEFAULT 14,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_products table (links suppliers to products with pricing)
CREATE TABLE public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE CASCADE,
  unit_cost DECIMAL(10,2) NOT NULL,
  min_order_kg DECIMAL(10,2) DEFAULT 10,
  is_primary_supplier BOOLEAN DEFAULT false,
  last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

-- Create warehouse arrivals table
CREATE TABLE public.warehouse_arrivals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  quantity_kg DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  arrival_date DATE NOT NULL DEFAULT CURRENT_DATE,
  batch_number TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('pending', 'received', 'inspecting', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client stock allocations table
CREATE TABLE public.client_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE RESTRICT,
  allocated_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  reserved_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, product_id)
);

-- Add reorder fields to matcha_products
ALTER TABLE public.matcha_products
ADD COLUMN reorder_point_kg DECIMAL(10,2) DEFAULT 20,
ADD COLUMN reorder_quantity_kg DECIMAL(10,2) DEFAULT 50;

-- Create triggers for timestamp updates
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_allocations_updated_at
  BEFORE UPDATE ON public.client_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "Allow public read access to suppliers"
  ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert to suppliers"
  ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to suppliers"
  ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to suppliers"
  ON public.suppliers FOR DELETE USING (true);

-- RLS policies for supplier_products
CREATE POLICY "Allow public read access to supplier_products"
  ON public.supplier_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert to supplier_products"
  ON public.supplier_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to supplier_products"
  ON public.supplier_products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to supplier_products"
  ON public.supplier_products FOR DELETE USING (true);

-- RLS policies for warehouse_arrivals
CREATE POLICY "Allow public read access to warehouse_arrivals"
  ON public.warehouse_arrivals FOR SELECT USING (true);
CREATE POLICY "Allow public insert to warehouse_arrivals"
  ON public.warehouse_arrivals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to warehouse_arrivals"
  ON public.warehouse_arrivals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to warehouse_arrivals"
  ON public.warehouse_arrivals FOR DELETE USING (true);

-- RLS policies for client_allocations
CREATE POLICY "Allow public read access to client_allocations"
  ON public.client_allocations FOR SELECT USING (true);
CREATE POLICY "Allow public insert to client_allocations"
  ON public.client_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to client_allocations"
  ON public.client_allocations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to client_allocations"
  ON public.client_allocations FOR DELETE USING (true);

-- Insert sample suppliers
INSERT INTO public.suppliers (name, contact_name, contact_email, country, lead_time_days) VALUES
  ('Kyoto Tea Gardens', 'Takeshi Yamamoto', 'takeshi@kyototeagardens.jp', 'Japan', 21),
  ('Nishio Matcha Co', 'Yuki Tanaka', 'yuki@nishiomatcha.co.jp', 'Japan', 18),
  ('Kagoshima Organic Farms', 'Kenji Sato', 'kenji@kagoshimaorganic.jp', 'Japan', 25),
  ('Shizuoka Premium Tea', 'Akiko Watanabe', 'akiko@shizuokapremium.jp', 'Japan', 14);

-- Link suppliers to products with pricing
INSERT INTO public.supplier_products (supplier_id, product_id, unit_cost, min_order_kg, is_primary_supplier)
SELECT 
  s.id,
  p.id,
  CASE 
    WHEN p.name LIKE '%Uji%' AND s.name LIKE '%Kyoto%' THEN 250.00
    WHEN p.name LIKE '%Nishio%' AND s.name LIKE '%Nishio%' THEN 210.00
    WHEN p.name LIKE '%Kagoshima%' AND s.name LIKE '%Kagoshima%' THEN 155.00
    WHEN p.name LIKE '%Shizuoka%' AND s.name LIKE '%Shizuoka%' THEN 125.00
    ELSE p.cost_per_kg * 0.85
  END,
  CASE WHEN p.grade = 'ceremonial' THEN 5 WHEN p.grade = 'premium' THEN 10 ELSE 20 END,
  CASE
    WHEN p.name LIKE '%Uji%' AND s.name LIKE '%Kyoto%' THEN true
    WHEN p.name LIKE '%Nishio%' AND s.name LIKE '%Nishio%' THEN true
    WHEN p.name LIKE '%Kagoshima%' AND s.name LIKE '%Kagoshima%' THEN true
    WHEN p.name LIKE '%Shizuoka%' AND s.name LIKE '%Shizuoka%' THEN true
    ELSE false
  END
FROM public.suppliers s
CROSS JOIN public.matcha_products p
WHERE 
  (p.name LIKE '%Uji%' AND s.name LIKE '%Kyoto%') OR
  (p.name LIKE '%Nishio%' AND s.name LIKE '%Nishio%') OR
  (p.name LIKE '%Kagoshima%' AND s.name LIKE '%Kagoshima%') OR
  (p.name LIKE '%Shizuoka%' AND s.name LIKE '%Shizuoka%');

-- Add some sample allocations
INSERT INTO public.client_allocations (client_id, product_id, allocated_kg, reserved_until)
SELECT 
  c.id,
  p.id,
  CASE WHEN p.grade = 'ceremonial' THEN 5.0 WHEN p.grade = 'premium' THEN 10.0 ELSE 20.0 END,
  CURRENT_DATE + 30
FROM public.clients c
CROSS JOIN public.matcha_products p
WHERE random() > 0.6;

-- Sample warehouse arrivals
INSERT INTO public.warehouse_arrivals (product_id, supplier_id, quantity_kg, unit_cost, arrival_date, batch_number, status)
SELECT 
  p.id,
  sp.supplier_id,
  CASE WHEN p.grade = 'ceremonial' THEN 15.0 WHEN p.grade = 'premium' THEN 30.0 ELSE 50.0 END,
  sp.unit_cost,
  CURRENT_DATE - (random() * 14)::INTEGER,
  'BATCH-' || substring(gen_random_uuid()::TEXT, 1, 8),
  'received'
FROM public.matcha_products p
JOIN public.supplier_products sp ON sp.product_id = p.id AND sp.is_primary_supplier = true;