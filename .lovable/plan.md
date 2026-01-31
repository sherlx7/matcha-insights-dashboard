

# Add Test Data for Financial Calculations

This plan will populate the database with realistic test data so you can see the Client Pricing & Costs feature working with proper calculations.

## What Will Be Added

### 1. Product Pricing in Yen
Update 4 products with Japanese Yen costs and selling prices:

| Product | Cost (JPY/kg) | Selling Price (USD/kg) |
|---------|---------------|------------------------|
| Uji Premium | ¥42,000 | $350 |
| Ume 梅 | ¥36,000 | $300 |
| Kagoshima Organic | ¥27,000 | $220 |
| Shizuoka Blend | ¥22,500 | $190 |

### 2. Supplier Exchange Rates
Update exchange rates to reflect realistic market variations:

| Supplier | Exchange Rate (JPY→USD) |
|----------|-------------------------|
| Kyoto Tea Gardens | 0.0067 (current rate) |
| Nishio Matcha Co | 0.0065 |
| Kagoshima Organic Farms | 0.0068 |
| Shizuoka Premium Tea | 0.0066 |

### 3. Client Discounts
Add tiered discounts for loyal/volume clients:

| Client | Discount | Delivery Day |
|--------|----------|--------------|
| Zen Cafe Tokyo | 5% | 15th |
| Matcha & Co | 8% | 1st |
| Pacific Tea House | 3% | 20th |
| Green Leaf Bakery | 0% | 10th |
| Sakura Sweets | 10% | 5th |

## Expected Result

After running these updates, the **Client Pricing & Costs** tab will display:
- Cost breakdown: Yen price → USD conversion → +$15 shipping → +9% tax → Total cost
- Per-client effective prices with discounts applied
- Profit per kg calculations
- Monthly volume and profit projections based on order history

---

## Technical Details

### SQL Updates to Execute

```sql
-- 1. Update matcha_products with JPY costs and selling prices
UPDATE matcha_products SET cost_per_kg_jpy = 42000, selling_price_per_kg = 350 WHERE name = 'Uji Premium';
UPDATE matcha_products SET cost_per_kg_jpy = 36000, selling_price_per_kg = 300 WHERE name = 'Ume 梅';
UPDATE matcha_products SET cost_per_kg_jpy = 27000, selling_price_per_kg = 220 WHERE name = 'Kagoshima Organic';
UPDATE matcha_products SET cost_per_kg_jpy = 22500, selling_price_per_kg = 190 WHERE name = 'Shizuoka Blend';

-- 2. Update suppliers with varied exchange rates
UPDATE suppliers SET exchange_rate_jpy_usd = 0.0065 WHERE name = 'Nishio Matcha Co';
UPDATE suppliers SET exchange_rate_jpy_usd = 0.0068 WHERE name = 'Kagoshima Organic Farms';
UPDATE suppliers SET exchange_rate_jpy_usd = 0.0066 WHERE name = 'Shizuoka Premium Tea';

-- 3. Update clients with discounts and delivery schedules
UPDATE clients SET discount_percent = 5, delivery_day_of_month = 15 WHERE name = 'Zen Cafe Tokyo';
UPDATE clients SET discount_percent = 8, delivery_day_of_month = 1 WHERE name = 'Matcha & Co';
UPDATE clients SET discount_percent = 3, delivery_day_of_month = 20 WHERE name = 'Pacific Tea House';
UPDATE clients SET discount_percent = 0, delivery_day_of_month = 10 WHERE name = 'Green Leaf Bakery';
UPDATE clients SET discount_percent = 10, delivery_day_of_month = 5 WHERE name = 'Sakura Sweets';
```

### No Code Changes Required
This is a data-only update. The existing `ClientPricingTable.tsx` component will automatically display the calculations once the data is populated.

