<p align="center">
  <img src="public/MatsuMatcha.jpeg" alt="MatsuMatcha Logo" width="200"/>
</p>

<h1 align="center">Matcha Insights Dashboard</h1>

<p align="center">
  A business intelligence dashboard for premium matcha tea distribution and operations management.
</p>

---

## Overview

Matcha Insights Dashboard is a comprehensive analytics and operations platform designed for matcha tea distributors. It provides real-time visibility into financial performance, inventory management, client profitability, and AI-powered recommendations.

## Features

### Financial Analytics
- **Revenue & Profit Tracking** - Real-time KPIs with customizable date range filters
- **Client Profitability Analysis** - Revenue, COGS, and profit margins per client
- **Client Pricing & Costs** - Multi-currency cost breakdown (JPY→USD conversion, shipping, tax)
- **AI Analysis & Forecasting** - Intelligent insights and trend predictions

### Inventory Management
- **Stock Tracking** - Real-time inventory levels with low-stock alerts
- **Supplier Management** - Track suppliers, exchange rates, and product sourcing
- **Warehouse Arrivals** - Monitor incoming shipments and allocations
- **Manual Adjustments** - Approval workflow for stock corrections

### Operations
- **Orders Management** - Track and manage client orders
- **Client Allocations** - Allocated vs. available inventory visibility
- **Approval Workflow** - Supervisor approval for manual stock changes

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** Supabase (PostgreSQL + Auth)
- **Data Fetching:** TanStack React Query
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/sherlx7/matcha-insights-dashboard.git

# Navigate to the project directory
cd matcha-insights-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   │   ├── Header.tsx
│   │   ├── KPICard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── InventoryTable.tsx
│   │   ├── ClientPricingTable.tsx
│   │   └── ...
│   └── ui/              # Reusable UI components (shadcn)
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── types/               # TypeScript type definitions
└── lib/                 # Utility functions
```

## License

This project is private and proprietary.

---

<p align="center">
  Built with care for matcha lovers everywhere
</p>
