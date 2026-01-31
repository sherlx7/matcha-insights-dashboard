
# Plan: Improve Revenue Forecast Accuracy in Sandbox

## Summary
The current sandbox forecast has calculation accuracy issues that need to be fixed. The main problem is that the "Actual" scenario baseline uses simulated values instead of true database values, making comparisons misleading.

## What Needs to Change

### 1. Separate Actual vs Simulated Volume Tracking
Store original client monthly volumes separately from simulation state so "Actual" scenario uses real historical data.

### 2. Pass Original Values to Comparison Chart
Provide the chart with both:
- Original database values (for "Actual" bars)
- Simulated values (for "Simulated" bars)

### 3. Use Product-Specific Orders for Revenue Calculation
Instead of averaging all product prices, calculate revenue based on actual client-product order patterns from historical data.

## Technical Details

### File Changes

**src/components/dashboard/sandbox/ProfitabilitySandbox.tsx**
- Create a new `originalState` object that captures database values on load
- Pass this original state to `ScenarioComparisonChart` for accurate "Actual" calculations
- Add a `useMemo` to compute historical volumes from orders data

**src/components/dashboard/sandbox/ScenarioComparisonChart.tsx**
- Add new props: `originalSupplierState` and `originalClientState`
- Update `forecastData` calculation:
  - "Actual" scenario uses original database values exclusively
  - "Simulated" scenario uses current simulation state
- Fix volume calculation to use actual historical order data for baseline
- Consider weighting product prices by historical order frequency per client

**src/components/dashboard/sandbox/ClientSandbox.tsx**
- Store original volumes separately from simulation state
- Display difference indicators between original and simulated values

### Data Flow After Fix

```text
Database Values (orders, suppliers, products)
         |
         v
+-------------------+
| Original State    |  <-- Captured once on load, never modified
| - exchangeRates   |
| - productCostsJpy |
| - clientVolumes   |
| - sellingPrices   |
+-------------------+
         |
         +----------------+
         |                |
         v                v
   "Actual Scenario"   "Simulated Scenario"
   (uses original)     (uses simulation state)
```

### Calculation Formula Improvements

**For Revenue:**
```
Per Client Monthly Revenue = SUM over products they order of:
  (Product Selling Price * (1 - Client Discount%)) * Historical Monthly Volume for that product
```

**For COGS:**
```
Per Product Cost = (Cost JPY * Exchange Rate + Shipping) * 1.09
Per Client Monthly COGS = SUM of (Product Cost * Monthly Volume for that product)
```

**For Forecast:**
- Use historical trend analysis instead of hardcoded 2% growth
- Or allow user to set growth assumptions as a sandbox input

## Result
After these changes:
- "Actual" bars will show true projections based on current database values
- "Simulated" bars will show how changes affect the forecast
- The "Profit Impact" and "Margin Shift" metrics will be accurate comparisons
