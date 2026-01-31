-- =====================================================
-- MATSU MATCHA - REAL B2B DATA MIGRATION
-- Singapore-based matcha brand
-- Currency: SGD (Singapore Dollars)
-- Cost Formula: (JPY cost × FX rate) + $15 shipping + 9% tax
-- =====================================================

-- Clear existing sample data
TRUNCATE TABLE client_orders CASCADE;
TRUNCATE TABLE client_allocations CASCADE;
TRUNCATE TABLE warehouse_arrivals CASCADE;
TRUNCATE TABLE supplier_products CASCADE;
TRUNCATE TABLE stock_change_requests CASCADE;
TRUNCATE TABLE inventory_changes CASCADE;
TRUNCATE TABLE matcha_products CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE suppliers CASCADE;

-- =====================================================
-- SUPPLIERS (Real Japanese matcha suppliers)
-- =====================================================
INSERT INTO suppliers (id, name, contact_name, contact_email, country, lead_time_days, exchange_rate_jpy_usd, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Marukyu Koyamaen', 'Tanaka Kenji', 'orders@marukyu.co.jp', 'Japan - Kyoto (Uji)', 21, 0.0082, 'Premium ceremonial grade specialist, 300+ year history. JAS Organic certified.'),
  ('a1000000-0000-0000-0000-000000000002', 'Horii Shichimeien', 'Yamamoto Akira', 'export@horii7.jp', 'Japan - Kyoto (Uji)', 28, 0.0082, 'Competition grade matcha specialist. Limited quantities. JAS Organic.'),
  ('a1000000-0000-0000-0000-000000000003', 'Aiya Matcha', 'Suzuki Yuki', 'wholesale@aiya.co.jp', 'Japan - Aichi (Nishio)', 14, 0.0082, 'Large scale production, consistent quality. USDA/JAS certified.'),
  ('a1000000-0000-0000-0000-000000000004', 'Ippodo Tea', 'Nakamura Hiro', 'b2b@ippodo.co.jp', 'Japan - Kyoto', 21, 0.0082, 'Established 1717, premium ceremonial grades. JAS Organic.'),
  ('a1000000-0000-0000-0000-000000000005', 'Ocha no Maruhachi', 'Ito Sakura', 'sales@maruhachi.jp', 'Japan - Kagoshima', 18, 0.0082, 'Budget-friendly cafe grade, excellent volume pricing. JAS certified.'),
  ('a1000000-0000-0000-0000-000000000006', 'Yamecha Cooperative', 'Watanabe Ken', 'export@yamecha.or.jp', 'Japan - Fukuoka', 25, 0.0082, 'Yame region specialty, known for strong umami profile. JAS certified.');

-- Rename column for SGD (exchange_rate_jpy_usd is actually JPY to SGD now)
COMMENT ON COLUMN suppliers.exchange_rate_jpy_usd IS 'Exchange rate from JPY to SGD (Singapore Dollars)';

-- =====================================================
-- MATCHA PRODUCTS (Real Matsu Matcha SKUs)
-- Prices converted to per-kg for B2B
-- =====================================================
INSERT INTO matcha_products (id, name, grade, origin, cost_per_kg, cost_per_kg_jpy, selling_price_per_kg, quality_score, stock_kg, status, reorder_point_kg, reorder_quantity_kg) VALUES
  -- Competition Grade (Highest tier - $75-89/30g retail = $2500-2967/kg)
  ('b1000000-0000-0000-0000-000000000001', 'Saemidori Competition Grade', 'ceremonial', 'Uji, Kyoto', 285.00, 28000, 420.00, 99, 2.5, 'low_stock', 3, 5),
  ('b1000000-0000-0000-0000-000000000002', 'Honzu Asahi Competition Grade', 'ceremonial', 'Uji, Kyoto', 320.00, 32000, 480.00, 99, 1.8, 'low_stock', 2, 5),

  -- Ceremonial Grade (Premium tier - $49-59/30g retail)
  ('b1000000-0000-0000-0000-000000000003', 'Ume 梅 Ceremonial', 'ceremonial', 'Uji, Kyoto', 180.00, 18000, 280.00, 95, 8.5, 'in_stock', 5, 10),
  ('b1000000-0000-0000-0000-000000000004', 'Cho Ro Sui 朝露翠 Ceremonial', 'ceremonial', 'Uji, Kyoto', 210.00, 21000, 320.00, 97, 6.2, 'in_stock', 5, 10),

  -- Café Grade - Latte Series (B2B workhorses - $25-55/100g retail)
  ('b1000000-0000-0000-0000-000000000005', 'Suisho 翠初 (Series 00) - Entry Latte', 'culinary', 'Uji, Kyoto', 65.00, 6500, 120.00, 80, 45.0, 'in_stock', 20, 50),
  ('b1000000-0000-0000-0000-000000000006', 'Ryokuun 緑雲 (Series 01) - Mid Latte', 'culinary', 'Uji, Kyoto', 85.00, 8500, 150.00, 85, 32.0, 'in_stock', 15, 40),
  ('b1000000-0000-0000-0000-000000000007', 'Seiha 青波 (Series 02) - Mid Latte', 'culinary', 'Uji, Kyoto', 95.00, 9500, 165.00, 87, 0.0, 'out_of_stock', 15, 40),
  ('b1000000-0000-0000-0000-000000000008', 'Samidori Kun さみどり薫 (Series 03) - Premium Latte', 'premium', 'Uji, Kyoto', 130.00, 13000, 220.00, 90, 0.0, 'out_of_stock', 10, 25),

  -- Additional B2B products for variety
  ('b1000000-0000-0000-0000-000000000009', 'Kagoshima Organic Café Blend', 'culinary', 'Kagoshima', 55.00, 5500, 100.00, 78, 58.0, 'in_stock', 25, 60),
  ('b1000000-0000-0000-0000-000000000010', 'Yame Umami Special', 'premium', 'Fukuoka (Yame)', 145.00, 14500, 240.00, 92, 12.0, 'in_stock', 8, 20);

-- =====================================================
-- B2B CLIENTS (Real Singapore F&B businesses)
-- =====================================================
INSERT INTO clients (id, name, contact_email, contact_phone, address, discount_percent, delivery_day_of_month) VALUES
  -- Major F&B Partners (mentioned in challenge doc)
  ('c1000000-0000-0000-0000-000000000001', 'Greendot Patisserie', 'orders@greendot.sg', '+65 8123 4567', '100 Beach Road, Shaw Tower, Singapore 189702', 8, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Sweet Cheeks Holland Village', 'hello@sweetcheeks.sg', '+65 9234 5678', '26 Lor Mambong, Holland Village, Singapore 277685', 5, 15),

  -- Matcha-focused cafes
  ('c1000000-0000-0000-0000-000000000003', 'Hvala Singapore', 'wholesale@hvala.com.sg', '+65 8345 6789', 'Chijmes, 30 Victoria Street, Singapore 187996', 10, 1),
  ('c1000000-0000-0000-0000-000000000004', 'Kurasu Singapore', 'orders@kurasu.sg', '+65 9456 7890', '21 Tanjong Pagar Road, Singapore 088444', 5, 10),

  -- Hotels & Restaurants
  ('c1000000-0000-0000-0000-000000000005', 'Mandarin Oriental SG - MO Bar', 'fnb.procurement@mohg.com', '+65 6338 0066', '5 Raffles Avenue, Singapore 039797', 12, 5),
  ('c1000000-0000-0000-0000-000000000006', 'The Fullerton Hotel - Jade Restaurant', 'purchasing@fullertonhotels.com', '+65 6877 8888', '1 Fullerton Square, Singapore 049178', 10, 5),

  -- Growing cafe chains
  ('c1000000-0000-0000-0000-000000000007', 'Kyo Kohee', 'hello@kyokohee.com', '+65 8567 8901', '437 Joo Chiat Road, Singapore 427650', 5, 20),
  ('c1000000-0000-0000-0000-000000000008', 'Nanas Green Tea SG', 'orders@nanas.sg', '+65 9678 9012', 'Suntec City Mall, 3 Temasek Boulevard, Singapore 038983', 8, 10),

  -- Bakeries & Dessert shops
  ('c1000000-0000-0000-0000-000000000009', 'Pantler Bakery', 'wholesale@pantler.com.sg', '+65 8789 0123', '198 Telok Ayer Street, Singapore 068637', 3, 25),
  ('c1000000-0000-0000-0000-000000000010', 'Flor Patisserie', 'orders@florpatisserie.com', '+65 9890 1234', '2 Duxton Hill, Singapore 089588', 5, 15),

  -- Bubble tea / Beverage chains
  ('c1000000-0000-0000-0000-000000000011', 'LiHO TEA (Selected Outlets)', 'procurement@liho.com.sg', '+65 6789 0123', 'HQ: 1 Kim Seng Promenade, Singapore 237994', 15, 1),
  ('c1000000-0000-0000-0000-000000000012', 'Matchaya', 'hello@matchaya.sg', '+65 8901 2345', '78 Airport Boulevard, Jewel Changi, Singapore 819666', 7, 20);

-- =====================================================
-- SUPPLIER-PRODUCT RELATIONSHIPS (Who supplies what)
-- =====================================================
INSERT INTO supplier_products (supplier_id, product_id, unit_cost, min_order_kg, is_primary_supplier, notes) VALUES
  -- Marukyu Koyamaen (Competition & Ceremonial)
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 250.00, 2, true, 'Primary supplier for Saemidori Competition'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 155.00, 5, true, 'Primary supplier for Ume Ceremonial'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 185.00, 5, true, 'Primary supplier for Cho Ro Sui'),

  -- Horii Shichimeien (Competition Grade specialist)
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 280.00, 2, true, 'Primary supplier for Honzu Asahi Competition'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 260.00, 2, false, 'Backup supplier for Saemidori'),

  -- Aiya Matcha (Café grade volume supplier)
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 55.00, 20, true, 'Primary supplier for Suisho Series 00'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 72.00, 15, true, 'Primary supplier for Ryokuun Series 01'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000007', 82.00, 15, true, 'Primary supplier for Seiha Series 02'),

  -- Ippodo Tea (Premium ceremonial backup)
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 165.00, 5, false, 'Backup supplier for Ume'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 195.00, 5, false, 'Backup supplier for Cho Ro Sui'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', 115.00, 10, true, 'Primary supplier for Samidori Kun'),

  -- Ocha no Maruhachi (Budget café grade)
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000009', 45.00, 25, true, 'Primary supplier for Kagoshima Café Blend'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 58.00, 20, false, 'Backup supplier for Suisho'),

  -- Yamecha Cooperative (Yame specialty)
  ('a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000010', 125.00, 10, true, 'Primary supplier for Yame Umami Special');

-- =====================================================
-- CLIENT ORDERS (Realistic order history - past 3 months)
-- =====================================================

-- Greendot Patisserie - High volume café grade user
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 15.0, 110.40, '2025-11-01', 'delivered', '2025-11-05'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 8.0, 138.00, '2025-11-01', 'delivered', '2025-11-05'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 18.0, 110.40, '2025-12-01', 'delivered', '2025-12-05'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 10.0, 138.00, '2025-12-01', 'delivered', '2025-12-05'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 20.0, 110.40, '2026-01-02', 'shipped', '2026-01-05');

-- Sweet Cheeks - Premium gelato maker, uses ceremonial
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 2.0, 266.00, '2025-11-15', 'delivered', '2025-11-18'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 2.5, 266.00, '2025-12-15', 'delivered', '2025-12-18'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 3.0, 266.00, '2026-01-15', 'pending', '2026-01-18');

-- Hvala - Major matcha café, high volume multiple SKUs
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 5.0, 288.00, '2025-11-01', 'delivered', '2025-11-03'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 12.0, 135.00, '2025-11-01', 'delivered', '2025-11-03'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 6.0, 288.00, '2025-12-01', 'delivered', '2025-12-03'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 15.0, 135.00, '2025-12-01', 'delivered', '2025-12-03'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 1.0, 378.00, '2025-12-15', 'delivered', '2025-12-18'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 5.5, 288.00, '2026-01-02', 'shipped', '2026-01-05'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 18.0, 135.00, '2026-01-02', 'shipped', '2026-01-05');

-- Mandarin Oriental - Premium hotel, uses ceremonial for high-end drinks
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 3.0, 281.60, '2025-11-05', 'delivered', '2025-11-08'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 0.5, 422.40, '2025-11-05', 'delivered', '2025-11-08'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 3.5, 281.60, '2025-12-05', 'delivered', '2025-12-08'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 0.5, 422.40, '2025-12-05', 'delivered', '2025-12-08'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 4.0, 281.60, '2026-01-05', 'pending', '2026-01-08');

-- Kurasu - Specialty coffee, moderate matcha usage
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 5.0, 142.50, '2025-11-10', 'delivered', '2025-11-13'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 6.0, 142.50, '2025-12-10', 'delivered', '2025-12-13'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 7.0, 142.50, '2026-01-10', 'pending', '2026-01-13');

-- LiHO TEA - High volume budget user
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000009', 30.0, 85.00, '2025-11-01', 'delivered', '2025-11-03'),
  ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000009', 35.0, 85.00, '2025-12-01', 'delivered', '2025-12-03'),
  ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000009', 40.0, 85.00, '2026-01-02', 'shipped', '2026-01-05');

-- Kyo Kohee - Mid-range café
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000006', 4.0, 142.50, '2025-11-20', 'delivered', '2025-11-23'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 1.5, 266.00, '2025-11-20', 'delivered', '2025-11-23'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000006', 5.0, 142.50, '2025-12-20', 'delivered', '2025-12-23'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 2.0, 266.00, '2025-12-20', 'delivered', '2025-12-23'),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000006', 6.0, 142.50, '2026-01-20', 'pending', '2026-01-23');

-- Pantler Bakery - Uses café grade for baked goods
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', 3.0, 116.40, '2025-11-25', 'delivered', '2025-11-28'),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', 4.0, 116.40, '2025-12-25', 'delivered', '2025-12-28'),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', 4.5, 116.40, '2026-01-25', 'pending', '2026-01-28');

-- Matchaya - Premium matcha specialist
INSERT INTO client_orders (client_id, product_id, quantity_kg, unit_price, order_date, status, scheduled_delivery_date) VALUES
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 3.0, 260.40, '2025-11-20', 'delivered', '2025-11-23'),
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000010', 2.0, 223.20, '2025-11-20', 'delivered', '2025-11-23'),
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 4.0, 260.40, '2025-12-20', 'delivered', '2025-12-23'),
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000010', 3.0, 223.20, '2025-12-20', 'delivered', '2025-12-23'),
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000003', 4.5, 260.40, '2026-01-20', 'pending', '2026-01-23');

-- =====================================================
-- WAREHOUSE ARRIVALS (Recent shipments from Japan)
-- =====================================================
INSERT INTO warehouse_arrivals (product_id, supplier_id, quantity_kg, unit_cost, cost_per_kg_jpy, exchange_rate_used, arrival_date, batch_number, expiry_date, status, notes) VALUES
  -- November arrivals
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 50.0, 55.00, 6500, 0.0082, '2025-11-05', 'AIYA-2025-1105-001', '2026-11-05', 'received', 'Standard Suisho shipment'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 40.0, 72.00, 8500, 0.0082, '2025-11-05', 'AIYA-2025-1105-002', '2026-11-05', 'received', 'Ryokuun batch'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000005', 60.0, 45.00, 5500, 0.0082, '2025-11-08', 'MARU-2025-1108-001', '2026-11-08', 'received', 'Kagoshima café blend'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 15.0, 155.00, 18000, 0.0082, '2025-11-12', 'MKYM-2025-1112-001', '2026-05-12', 'received', 'Ume ceremonial - fresh harvest'),

  -- December arrivals
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 12.0, 185.00, 21000, 0.0082, '2025-12-03', 'MKYM-2025-1203-001', '2026-06-03', 'received', 'Cho Ro Sui premium batch'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 5.0, 250.00, 28000, 0.0082, '2025-12-10', 'MKYM-2025-1210-001', '2026-06-10', 'received', 'Saemidori Competition - limited'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 3.0, 280.00, 32000, 0.0082, '2025-12-15', 'HORI-2025-1215-001', '2026-06-15', 'received', 'Honzu Asahi Competition'),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000006', 15.0, 125.00, 14500, 0.0082, '2025-12-18', 'YAME-2025-1218-001', '2026-06-18', 'received', 'Yame Umami Special'),

  -- January arrivals (pending/in transit)
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 60.0, 55.00, 6500, 0.0082, '2026-01-25', 'AIYA-2026-0125-001', '2027-01-25', 'pending', 'Restock order - arriving late Jan'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 40.0, 82.00, 9500, 0.0082, '2026-01-28', 'AIYA-2026-0128-001', '2027-01-28', 'pending', 'Seiha Series 02 restock'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 25.0, 115.00, 13000, 0.0082, '2026-02-01', 'IPPO-2026-0201-001', '2027-02-01', 'pending', 'Samidori Kun restock');

-- =====================================================
-- CLIENT ALLOCATIONS (Reserved stock for regular clients)
-- =====================================================
INSERT INTO client_allocations (client_id, product_id, allocated_kg, reserved_until, notes) VALUES
  -- Greendot - Large monthly allocation
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 20.0, '2026-02-01', 'Monthly Suisho allocation'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 10.0, '2026-02-01', 'Monthly Ryokuun allocation'),

  -- Hvala - Premium allocation
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 6.0, '2026-02-01', 'Monthly Cho Ro Sui allocation'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 15.0, '2026-02-01', 'Monthly Ryokuun allocation'),

  -- LiHO - High volume budget allocation
  ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000009', 40.0, '2026-02-01', 'Monthly Kagoshima allocation'),

  -- Mandarin Oriental - Premium ceremonial
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 4.0, '2026-02-01', 'Monthly Cho Ro Sui for MO Bar'),

  -- Sweet Cheeks - Ceremonial for gelato
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 3.0, '2026-02-01', 'Monthly Ume for premium gelato');

-- =====================================================
-- Add computed fields and indexes for performance
-- =====================================================

-- Create index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_client_orders_client_date ON client_orders(client_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_orders_product_date ON client_orders(product_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_arrivals_product ON warehouse_arrivals(product_id, arrival_date DESC);

-- Add comments for documentation
COMMENT ON TABLE matcha_products IS 'Matsu Matcha product catalog - all prices in SGD per kg for B2B';
COMMENT ON TABLE clients IS 'B2B clients - Singapore F&B businesses';
COMMENT ON TABLE suppliers IS 'Japanese matcha suppliers with lead times and quality certifications';
COMMENT ON COLUMN matcha_products.cost_per_kg IS 'Landed cost in SGD: (JPY cost × FX rate) + $15 shipping + 9% tax';
COMMENT ON COLUMN matcha_products.cost_per_kg_jpy IS 'Raw cost from supplier in Japanese Yen per kg';
