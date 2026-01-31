export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  insight: string;
  targetSelector: string;
  section: 'overview' | 'financials' | 'operations' | 'sandbox';
  mainTab?: 'financials' | 'operations' | 'sandbox';
  subTab?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const tutorialSteps: TutorialStep[] = [
  // Part 1: Dashboard Overview (Steps 1-3)
  {
    id: 'kpi-cards',
    title: 'Key Performance Indicators',
    description: 'These KPI cards give you an instant snapshot of your business health. Each card shows a different metric with trend indicators.',
    insight: 'At a glance, see your total revenue, profit margins, inventory health, and client activity. Red borders on Low Stock indicate items needing reorder.',
    targetSelector: '[data-tutorial="kpi-cards"]',
    section: 'overview',
    mainTab: 'financials',
    position: 'bottom',
  },
  {
    id: 'date-filter',
    title: 'Date Range Filter',
    description: 'Filter all financial data by selecting custom date ranges. This affects charts, tables, and KPI calculations.',
    insight: 'All financial metrics and charts update based on your selected date range. Use this to analyze seasonal trends or compare periods.',
    targetSelector: '[data-tutorial="date-filter"]',
    section: 'overview',
    mainTab: 'financials',
    position: 'bottom',
  },
  {
    id: 'navigation-tabs',
    title: 'Main Navigation',
    description: 'Navigate between the three main sections of the dashboard: Financials, Operations, and Sandbox.',
    insight: 'Financials shows money flow. Operations manages inventory. Sandbox lets you experiment safely without affecting real data.',
    targetSelector: '[data-tutorial="navigation-tabs"]',
    section: 'overview',
    position: 'bottom',
  },

  // Part 2: Financials Tab (Steps 4-8)
  {
    id: 'revenue-chart',
    title: 'Revenue & Profit Trends',
    description: 'This chart shows your weekly revenue and profit trends. Hover over data points to see exact values.',
    insight: 'Weekly aggregated view helps identify sales patterns. Look for trends in revenue vs profit to spot margin compression.',
    targetSelector: '[data-tutorial="revenue-chart"]',
    section: 'financials',
    mainTab: 'financials',
    subTab: 'overview',
    position: 'top',
  },
  {
    id: 'pricing-table',
    title: 'Pricing & Cost Breakdown',
    description: 'View the complete cost journey for each product: from Japanese Yen pricing through currency conversion, shipping, import taxes, to final profit margins.',
    insight: 'See the full cost journey: Yen price, SGD conversion, shipping ($3.50/kg), 9% import tax, and final profit per kg. Color-coded profit shows healthy vs thin margins.',
    targetSelector: '[data-tutorial="pricing-table"]',
    section: 'financials',
    mainTab: 'financials',
    subTab: 'pricing',
    position: 'top',
  },
  {
    id: 'orders-table',
    title: 'Sales Orders',
    description: 'Track all customer orders with detailed financial breakdown including revenue, cost of goods sold, and per-order profitability.',
    insight: 'Each order shows revenue, COGS, and profit. Use this to identify which products and clients drive profitability.',
    targetSelector: '[data-tutorial="orders-table"]',
    section: 'financials',
    mainTab: 'financials',
    subTab: 'orders',
    position: 'top',
  },
  {
    id: 'profitability-table',
    title: 'Client Profitability Analysis',
    description: 'Analyze profit contribution by client. Clients are ranked by total profit, with color-coded margins for quick assessment.',
    insight: 'Clients sorted by profit. Green margins (30%+) are healthy, amber (20-30%) need attention, red (<20%) require pricing review.',
    targetSelector: '[data-tutorial="profitability-table"]',
    section: 'financials',
    mainTab: 'financials',
    subTab: 'profitability',
    position: 'top',
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Insights',
    description: 'Generate intelligent forecasts, analysis reports, and product swap recommendations using AI analysis of your data.',
    insight: 'Generate 3-month forecasts and get product swap recommendations. AI analyzes your data to suggest margin improvements.',
    targetSelector: '[data-tutorial="ai-insights"]',
    section: 'financials',
    mainTab: 'financials',
    subTab: 'ai',
    position: 'top',
  },

  // Part 3: Operations Tab (Steps 9-12)
  {
    id: 'stock-levels',
    title: 'Stock Levels Overview',
    description: 'Monitor total inventory, allocated stock, and available quantities for each product. Track reorder points and stock health.',
    insight: 'Total stock minus allocated equals available. Red "Reorder" badges flag items below their reorder point.',
    targetSelector: '[data-tutorial="stock-levels"]',
    section: 'operations',
    mainTab: 'operations',
    subTab: 'stock',
    position: 'top',
  },
  {
    id: 'warehouse-arrivals',
    title: 'Warehouse Arrivals',
    description: 'Track incoming shipments from suppliers with detailed cost information in both original currency and converted rates.',
    insight: 'Track incoming shipments with costs in both Yen and SGD. Status shows if stock is pending, received, or under inspection.',
    targetSelector: '[data-tutorial="warehouse-arrivals"]',
    section: 'operations',
    mainTab: 'operations',
    subTab: 'arrivals',
    position: 'top',
  },
  {
    id: 'client-allocations',
    title: 'Client Allocations',
    description: 'View reserved stock for each client. Allocations ensure committed orders can be fulfilled from available inventory.',
    insight: 'Reserved stock per client ensures fulfillment. Unallocated kg is available for new orders.',
    targetSelector: '[data-tutorial="client-allocations"]',
    section: 'operations',
    mainTab: 'operations',
    subTab: 'allocations',
    position: 'top',
  },
  {
    id: 'pending-approvals',
    title: 'Approval Workflow',
    description: 'Review and approve manual stock adjustment requests. All changes require supervisor authorization for audit compliance.',
    insight: 'Manual stock adjustments require supervisor sign-off. This maintains audit trails for reservations, damages, or corrections.',
    targetSelector: '[data-tutorial="pending-approvals"]',
    section: 'operations',
    mainTab: 'operations',
    subTab: 'approvals',
    position: 'top',
  },

  // Part 4: Sandbox Tab (Steps 13-14)
  {
    id: 'supplier-sandbox',
    title: 'Supplier Simulations',
    description: 'Run "what-if" scenarios to understand how exchange rate fluctuations or supplier cost changes would impact your margins.',
    insight: 'Simulate exchange rate changes or supplier cost increases to see profit impact before negotiating contracts.',
    targetSelector: '[data-tutorial="supplier-sandbox"]',
    section: 'sandbox',
    mainTab: 'sandbox',
    subTab: 'supplier',
    position: 'top',
  },
  {
    id: 'client-sandbox',
    title: 'Client Pricing Simulations',
    description: 'Test pricing adjustments or volume changes for clients without affecting live data. Compare scenarios side-by-side.',
    insight: 'Test pricing adjustments or volume changes. The comparison chart shows projected profit impact vs current reality.',
    targetSelector: '[data-tutorial="client-sandbox"]',
    section: 'sandbox',
    mainTab: 'sandbox',
    subTab: 'client',
    position: 'top',
  },
];

export const getSectionLabel = (section: TutorialStep['section']): string => {
  switch (section) {
    case 'overview':
      return 'Dashboard Overview';
    case 'financials':
      return 'Financials';
    case 'operations':
      return 'Operations';
    case 'sandbox':
      return 'Sandbox';
    default:
      return '';
  }
};

export const getSectionColor = (section: TutorialStep['section']): string => {
  switch (section) {
    case 'overview':
      return 'bg-blue-500/10 text-blue-500';
    case 'financials':
      return 'bg-green-500/10 text-green-500';
    case 'operations':
      return 'bg-amber-500/10 text-amber-500';
    case 'sandbox':
      return 'bg-purple-500/10 text-purple-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
