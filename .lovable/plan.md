
# Guided Tutorial Implementation Plan

## Overview
Create an interactive, step-by-step onboarding tutorial that guides new users through every section of the Matsu Matcha B2B Dashboard after login. The tutorial will use spotlight highlights, tooltips, and modal cards to explain each feature and the insights users can derive from it.

## Tutorial Flow Structure

The tutorial will consist of **14 steps** organized across the dashboard sections:

### Part 1: Dashboard Overview (Steps 1-3)
1. **Welcome & KPI Cards** - Introduction to the dashboard and explanation of the 5 key metrics (Revenue, Profit, Inventory, Low Stock, Active Clients)
2. **Date Range Filter** - How to filter all data by custom date ranges
3. **Navigation Tabs** - Overview of Financials, Operations, and Sandbox sections

### Part 2: Financials Tab (Steps 4-8)
4. **Revenue Chart** - Weekly revenue trends and how to interpret patterns
5. **Pricing & Costs Table** - Understanding the full cost breakdown (Yen cost, shipping, import tax, profit margins)
6. **Sales Orders** - Viewing order history, revenue, COGS, and per-order profitability
7. **Profitability Table** - Client-level profit analysis with margin color coding
8. **AI Insights** - Generating forecasts, analysis reports, and product swap recommendations

### Part 3: Operations Tab (Steps 9-12)
9. **Stock Levels** - Total vs allocated vs available inventory per product
10. **Warehouse Arrivals** - Tracking incoming shipments and supplier deliveries
11. **Client Allocations** - Understanding reserved stock per client
12. **Approvals Workflow** - How manual stock adjustments require supervisor approval

### Part 4: Sandbox Tab (Steps 13-14)
13. **Supplier Simulations** - "What-if" scenarios for exchange rates and supplier costs
14. **Client Simulations** - Testing pricing changes and volume impacts without affecting live data

## Technical Implementation

### New Files to Create

```text
src/components/onboarding/
├── OnboardingProvider.tsx    # Context provider for tutorial state
├── OnboardingTutorial.tsx    # Main tutorial controller component
├── TutorialStep.tsx          # Individual step with spotlight + tooltip
├── TutorialSpotlight.tsx     # Highlight overlay for focused element
├── TutorialTooltip.tsx       # Positioned tooltip with step content
├── WelcomeDialog.tsx         # Initial welcome modal
├── CompletionDialog.tsx      # Congratulations modal at the end
└── tutorialSteps.ts          # Step definitions and content
```

### New Hook

```text
src/hooks/useTutorial.ts      # Hook for consuming tutorial context
```

### Database Change
Add a `has_completed_tutorial` boolean column to the `profiles` table to track completion status and avoid showing the tutorial repeatedly.

### Key Features

**1. Spotlight Effect**
- Dark overlay covers the entire page except the highlighted element
- Smooth CSS transitions between steps
- Click outside spotlight to dismiss (with confirmation)

**2. Tooltip Cards**
Each tooltip will include:
- Step number indicator (e.g., "Step 4 of 14")
- Section badge (e.g., "Financials")
- Title and description
- "Key Insight" callout box explaining what users can learn
- Navigation buttons (Previous, Next, Skip Tutorial)
- Progress bar

**3. Auto-Navigation**
When a step references a different tab, the tutorial will automatically:
- Switch to the correct main tab (Financials/Operations/Sandbox)
- Switch to the correct sub-tab within that section
- Wait for content to render before showing the spotlight

**4. Persistence**
- Tutorial progress saved to localStorage
- Can be restarted from user menu
- Completion status saved to database

### Tutorial Step Content

**Step 1: Welcome KPIs**
- Target: `.grid.gap-4` (KPI cards container)
- Insight: "At a glance, see your total revenue, profit margins, inventory health, and client activity. Red borders on Low Stock indicate items needing reorder."

**Step 2: Date Filter**
- Target: Date Range Filter component
- Insight: "All financial metrics and charts update based on your selected date range. Use this to analyze seasonal trends or compare periods."

**Step 3: Navigation Tabs**
- Target: Header tabs
- Insight: "Financials shows money flow. Operations manages inventory. Sandbox lets you experiment safely."

**Step 4: Revenue Chart**
- Target: RevenueChart component
- Insight: "Weekly aggregated view helps identify sales patterns. Look for trends in revenue vs profit to spot margin compression."

**Step 5: Pricing & Costs**
- Target: ClientPricingTable
- Insight: "See the full cost journey: Yen price, USD conversion, shipping ($3.50/kg), 9% import tax, and final profit per kg. Color-coded profit shows healthy vs thin margins."

**Step 6: Sales Orders**
- Target: OrdersManagement
- Insight: "Each order shows revenue, COGS, and profit. Use this to identify which products and clients drive profitability."

**Step 7: Client Profitability**
- Target: ClientProfitabilityTable
- Insight: "Clients sorted by profit. Green margins (30%+) are healthy, amber (20-30%) need attention, red (<20%) require pricing review."

**Step 8: AI Insights**
- Target: AIInsightsTab
- Insight: "Generate 3-month forecasts and get product swap recommendations. AI analyzes your data to suggest margin improvements."

**Step 9: Stock Levels**
- Target: StockLevelsTable (in InventoryManagement)
- Insight: "Total stock minus allocated equals available. Red 'Reorder' badges flag items below their reorder point."

**Step 10: Warehouse Arrivals**
- Target: ArrivalsTable
- Insight: "Track incoming shipments with costs in both Yen and USD. Status shows if stock is pending, received, or under inspection."

**Step 11: Client Allocations**
- Target: AllocationsTable
- Insight: "Reserved stock per client ensures fulfillment. Unallocated kg is available for new orders."

**Step 12: Approvals**
- Target: PendingApprovalsPanel
- Insight: "Manual stock adjustments require supervisor sign-off. This maintains audit trails for reservations, damages, or corrections."

**Step 13: Supplier Sandbox**
- Target: SupplierSandbox
- Insight: "Simulate exchange rate changes or supplier cost increases to see profit impact before negotiating contracts."

**Step 14: Client Sandbox**
- Target: ClientSandbox
- Insight: "Test pricing adjustments or volume changes. The 6-month comparison chart shows projected profit impact vs current reality."

### UI/UX Design

**Tooltip Styling**
- Width: 360px max
- Background: Card background with subtle border
- Shadow: Elevated shadow for focus
- Arrow pointing to target element
- Animations: Fade in/out with subtle scale

**Progress Indicator**
- Segmented bar showing completion
- Current step highlighted
- Section labels visible

**Mobile Responsiveness**
- On mobile, tooltips appear as bottom sheets
- Spotlight still works but with adjusted positioning
- Steps may consolidate for smaller screens

### Integration Points

1. **Index.tsx** - Wrap content with OnboardingProvider
2. **Header.tsx** - Add "Restart Tutorial" option to user dropdown
3. **ProtectedRoute.tsx** - Check if user should see tutorial on first login
4. **Database** - Migration to add `has_completed_tutorial` column

### User Flow

```text
User logs in for first time
         │
         ▼
┌─────────────────────────┐
│    Welcome Dialog       │
│ "Welcome to Matsu       │
│  Matcha Dashboard!"     │
│                         │
│ [Start Tutorial] [Skip] │
└─────────────────────────┘
         │
         ▼ (if Start)
   Tutorial begins
   Step 1 → Step 14
         │
         ▼
┌─────────────────────────┐
│  Completion Dialog      │
│ "You're all set!"       │
│                         │
│ [Explore Dashboard]     │
│ [Restart Tutorial]      │
└─────────────────────────┘
```

### Restart Tutorial Access
Users can restart the tutorial anytime via:
- Header dropdown menu → "Restart Tutorial"
- This resets localStorage and shows the tutorial again
