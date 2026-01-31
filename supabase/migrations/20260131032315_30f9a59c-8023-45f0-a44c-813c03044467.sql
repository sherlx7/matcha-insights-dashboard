-- Create stock change requests table for approval workflow
CREATE TABLE public.stock_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.matcha_products(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL DEFAULT 'user',
  change_type TEXT NOT NULL CHECK (change_type IN ('increase', 'decrease', 'set')),
  quantity_kg NUMERIC NOT NULL,
  new_stock_kg NUMERIC, -- calculated new stock after change
  reason TEXT NOT NULL CHECK (reason IN (
    'reservation_made',
    'reservation_cancelled', 
    'damage_to_stock',
    'quality_issue',
    'stock_correction',
    'sample_given',
    'internal_use',
    'other'
  )),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to stock_change_requests" 
ON public.stock_change_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to stock_change_requests" 
ON public.stock_change_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to stock_change_requests" 
ON public.stock_change_requests 
FOR UPDATE 
USING (true);

-- Update matcha_products with SKU data from Matsu Matcha
-- First, update existing products or insert new ones based on the Excel data
-- Note: Mapping Grade from Excel to our grade system (ceremonial, premium, culinary)

-- Update existing ceremonial products
UPDATE public.matcha_products SET 
  name = 'Ume 梅',
  origin = 'Japan',
  grade = 'ceremonial',
  status = 'in_stock'
WHERE name ILIKE '%ume%' OR id IN (SELECT id FROM public.matcha_products WHERE grade = 'ceremonial' LIMIT 1);

-- Insert the main matcha products from the SKU database if they don't exist
INSERT INTO public.matcha_products (name, grade, origin, cost_per_kg, quality_score, stock_kg, status, reorder_point_kg, reorder_quantity_kg)
SELECT * FROM (VALUES
  ('Ume 梅', 'ceremonial', 'Japan - Uji', 1633.33, 95, 5.0, 'in_stock', 2, 10),
  ('Cho Ro Sui 朝露翠', 'ceremonial', 'Japan - Uji', 1966.67, 98, 3.0, 'in_stock', 2, 10),
  ('Saemidori Competition Grade', 'ceremonial', 'Japan - Uji', 2500.00, 99, 2.0, 'low_stock', 1, 5),
  ('Honzu Asahi Competition Grade', 'ceremonial', 'Japan - Uji', 2966.67, 99, 1.5, 'low_stock', 1, 5),
  ('Suisho 翠初 (Series 00)', 'culinary', 'Japan - Uji', 250.00, 75, 50.0, 'in_stock', 20, 100),
  ('Ryokuun 緑雲 (Series 01)', 'culinary', 'Japan - Uji', 350.00, 80, 35.0, 'in_stock', 15, 75),
  ('Seiha 青波 (Series 02)', 'culinary', 'Japan - Uji', 390.00, 82, 0.0, 'out_of_stock', 15, 75),
  ('Samidori Kun さみどり 薫 (Series 03)', 'premium', 'Japan - Uji', 550.00, 88, 0.0, 'out_of_stock', 10, 50)
) AS v(name, grade, origin, cost_per_kg, quality_score, stock_kg, status, reorder_point_kg, reorder_quantity_kg)
WHERE NOT EXISTS (
  SELECT 1 FROM public.matcha_products mp WHERE mp.name = v.name
);

-- Delete old sample data if any
DELETE FROM public.matcha_products WHERE name IN ('Uji Ceremonial', 'Kyoto Premium', 'Kagoshima Culinary') 
AND NOT EXISTS (SELECT 1 FROM client_orders WHERE product_id = matcha_products.id);