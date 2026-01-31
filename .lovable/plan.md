
# Plan: Improve Revenue Forecast Accuracy in Sandbox

## Status: COMPLETED ✅

The forecast accuracy fixes have been implemented.

## Changes Made

### 1. ProfitabilitySandbox.tsx
- Added `originalSupplierState` and `originalClientState` as memos that capture database values on load
- These original states are now passed to `ScenarioComparisonChart` for accurate baseline calculations

### 2. ScenarioComparisonChart.tsx  
- Added new props: `originalSupplierState`, `originalClientState`, and `orders`
- Refactored `forecastData` calculation:
  - "Actual" scenario now uses `originalClientState` and `originalSupplierState` exclusively
  - "Simulated" scenario uses current `clientSimulation` and `supplierSimulation` states
- Added `clientProductVolumes` memo to calculate per-client, per-product historical volumes from orders
- Revenue and COGS now calculated based on actual client-product order patterns instead of averages
- Volume scaling properly applied when simulating volume changes

## Result
- "Current Scenario" bars show true projections based on database values
- "Simulated Scenario" bars show how user changes affect the forecast  
- Profit Impact, Revenue Impact, and Margin Shift metrics are now accurate comparisons
