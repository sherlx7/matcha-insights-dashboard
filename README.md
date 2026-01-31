<p align="center">
  <img src="public/MatsuMatcha.jpeg" alt="MatsuMatcha Logo" width="200"/>
</p>

<h1 align="center">Matsu Matcha - AI-Powered B2B Dashboard & Profitability Engine</h1>

<p align="center">
  A comprehensive B2B dashboard for Matsu Matcha, a Singapore matcha brand sourcing from multiple Japanese suppliers.
</p>

---

## Overview

Matcha Insights Dashboard is a comprehensive analytics and operations platform designed for matcha tea distributors. It provides real-time visibility into financial performance, inventory management, client profitability, and AI-powered recommendations for supplier/SKU optimization.

## Features

### Core Functionality
- **Client Management**: Track B2B clients, contracts, pricing, and delivery schedules
- **Supplier Management**: Manage Japanese matcha suppliers with lead times and reliability scores
- **SKU Management**: Organize matcha products by quality tier (Competition/Ceremonial/Cafe)
- **Inventory Tracking**: Lot-based inventory with FIFO allocation and expiry tracking
- **FX Rate Management**: Track JPY→SGD exchange rates for accurate cost calculations

### Profitability Engine
- **Landed Cost Calculation**: Automatic calculation including powder cost, shipping (SGD 15/kg), and import tax (9%)
- **Profit Analysis**: Per-client, per-SKU, and per-supplier profitability metrics
- **Margin Tracking**: Real-time gross margin calculations with discount handling

### AI Recommendations
- **Supplier Swap**: Identify cost savings by switching suppliers while maintaining quality
- **SKU Swap**: Suggest higher-margin alternatives within the same quality tier
- **Reorder Alerts**: Proactive stock replenishment recommendations based on demand
- **Allocation Optimization**: Identify unallocated or over-allocated inventory

### Security & Audit
- **Authentication**: JWT-based auth with email/password
- **Role-Based Access**: Admin and Viewer roles
- **Audit Logging**: Full version history for inventory, pricing, and allocations
- **Revert Capability**: Restore previous states from audit log

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Dashboard │ │Inventory │ │ Clients  │ │ Recommendations  │   │
│  │  KPIs    │ │Management│ │ Pricing  │ │     Panel        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express.js)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │   CRUD   │ │ Metrics  │ │  Recommendation  │   │
│  │  Routes  │ │  Routes  │ │  Routes  │ │     Engine       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Cost Calculation Module                      │   │
│  │  • Landed Cost  • Profit/Margin  • Stock Coverage        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Suppliers │ │   SKUs   │ │ Clients  │ │  InventoryLots   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ FXRates  │ │Allocations│ │AuditLogs │ │   OrderPlans    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user info |

### CRUD Operations
| Resource | Endpoints |
|----------|-----------|
| Suppliers | `GET/POST /api/suppliers`, `GET/PUT/DELETE /api/suppliers/:id` |
| SKUs | `GET/POST /api/skus`, `GET/PUT/DELETE /api/skus/:id` |
| Supplier Offers | `GET/POST /api/supplier-offers`, `GET/PUT/DELETE /api/supplier-offers/:id` |
| Clients | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id` |
| Contract Lines | `GET/POST /api/client-contract-lines`, `GET/PUT/DELETE /api/client-contract-lines/:id` |
| Inventory Lots | `GET/POST /api/inventory-lots`, `GET/PUT/DELETE /api/inventory-lots/:id` |
| Allocations | `GET/POST /api/allocations`, `GET/PUT/DELETE /api/allocations/:id` |
| FX Rates | `GET/POST /api/fx-rates`, `GET /api/fx-rates/latest`, `GET /api/fx-rates/history` |

### Analytics & Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/profitability?group_by=client\|sku\|supplier` | Profitability metrics |
| GET | `/api/metrics/inventory` | Inventory status and coverage |
| GET | `/api/recommendations` | AI-powered recommendations |
| POST | `/api/recommendations/simulate` | Simulate proposed changes |

### Versioning & Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit?entity_type=&entity_id=` | Get audit logs |
| POST | `/api/audit/revert` | Revert to previous version |

## Cost Calculations

### Landed Cost Formula
```
powder_cost_sgd = cost_jpy_per_kg × fx_rate_jpy_to_sgd
shipping_sgd_per_kg = 15
import_tax = 0.09 × (powder_cost_sgd + shipping_sgd_per_kg)
landed_cost_sgd_per_kg = powder_cost_sgd + shipping_sgd_per_kg + import_tax
```

### Profit Calculation
```
net_selling_price = selling_sgd_per_kg × (1 - discount_pct)
profit_per_kg = net_selling_price - landed_cost_sgd_per_kg
gross_margin_pct = (profit_per_kg / net_selling_price) × 100
monthly_profit = profit_per_kg × monthly_volume_kg
```

### Stock Coverage
```
stock_coverage_days = total_available_kg / (monthly_demand_kg / 30)
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** Express.js + Prisma ORM
- **Database:** PostgreSQL
- **Data Fetching:** TanStack React Query
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **Authentication:** JWT with bcrypt

## Getting Started

### Prerequisites

- Node.js 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- PostgreSQL 15+ (or Docker)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sherlx7/matcha-insights-dashboard.git

# Navigate to the project directory
cd matcha-insights-dashboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Database Setup

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d db
```

**Option B: Local PostgreSQL**
```bash
createdb matcha_insights
```

### Configuration

```bash
# Backend environment
cp server/.env.example server/.env
# Edit server/.env with your database URL

# Frontend environment (optional)
echo "VITE_API_URL=http://localhost:3001" >> .env
```

### Run Migrations and Seed Data

```bash
cd server
npx prisma migrate dev
npm run db:seed
cd ..
```

### Start Development Servers

```bash
npm run dev:full
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Login
After seeding, use these credentials:
- Email: `admin@matsumatcha.com`
- Password: `admin123`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run dev:api` | Start backend API server |
| `npm run dev:full` | Start both frontend and backend |
| `npm run build` | Build frontend for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start all services with Docker |
| `npm run docker:down` | Stop Docker services |
| `npm test` | Run tests |

## Docker Deployment

### Full Stack with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | API server port (default: 3001) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Project Structure

```
matcha-insights-dashboard/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── ui/             # Reusable UI components (shadcn)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities & API client
│   ├── pages/              # Page components
│   └── types/              # TypeScript types
├── server/                 # Backend source
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── db/             # Database client & seed
│   └── prisma/             # Prisma schema & migrations
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.frontend     # Frontend container
└── README.md
```

## Security Considerations

- All business endpoints require authentication
- Admin role required for create/update/delete operations
- Rate limiting on auth endpoints (5 requests/minute)
- JWT tokens expire after 7 days
- Passwords hashed with bcrypt (12 rounds)
- CORS configured for specific frontend origin

## License

This project is private and proprietary.

---

<p align="center">
  Built with care for matcha lovers everywhere
</p>
