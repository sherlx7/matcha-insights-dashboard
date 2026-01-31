# Matsu Matcha Backend Implementation Summary

## Overview

This document summarizes the backend implementation for the Matsu Matcha B2B Dashboard & Profitability Engine.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite + TypeScript)                 │   │
│  │  • Dashboard KPIs    • Inventory Management    • Client Pricing      │   │
│  │  • Recommendations Panel    • Profitability Sandbox                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js + TypeScript Backend                    │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │    Auth     │  │    CRUD     │  │   Metrics   │  │   Audit     │  │   │
│  │  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │              RECOMMENDATION ENGINE SERVICE                     │   │   │
│  │  │  • Supplier Swap    • SKU Swap    • Reorder    • Allocation   │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │              COST CALCULATION MODULE                           │   │   │
│  │  │  • Landed Cost    • Profit/Margin    • Stock Coverage         │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Prisma ORM
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL / SQLite Database                       │   │
│  │                                                                       │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │   │
│  │  │ Suppliers │  │   SKUs    │  │  Clients  │  │ SupplierSKUOffers │  │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │   │
│  │  │ FX Rates  │  │Allocations│  │Audit Logs │  │    OrderPlans     │  │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                         │   │
│  │  │   Users   │  │ Inventory │  │ Contracts │                         │   │
│  │  │           │  │   Lots    │  │   Lines   │                         │   │
│  │  └───────────┘  └───────────┘  └───────────┘                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Suppliers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/suppliers` | List all suppliers | Yes |
| GET | `/api/suppliers/:id` | Get supplier by ID | Yes |
| POST | `/api/suppliers` | Create supplier | Admin |
| PUT | `/api/suppliers/:id` | Update supplier | Admin |
| DELETE | `/api/suppliers/:id` | Delete supplier | Admin |

### SKUs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/skus` | List all SKUs | Yes |
| GET | `/api/skus/:id` | Get SKU by ID | Yes |
| POST | `/api/skus` | Create SKU | Admin |
| PUT | `/api/skus/:id` | Update SKU | Admin |
| DELETE | `/api/skus/:id` | Soft delete SKU | Admin |

### Supplier Offers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/supplier-offers` | List all offers | Yes |
| GET | `/api/supplier-offers/:id` | Get offer by ID | Yes |
| POST | `/api/supplier-offers` | Create offer | Admin |
| PUT | `/api/supplier-offers/:id` | Update offer | Admin |
| DELETE | `/api/supplier-offers/:id` | Delete offer | Admin |

### Clients
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/clients` | List all clients | Yes |
| GET | `/api/clients/:id` | Get client by ID | Yes |
| POST | `/api/clients` | Create client | Admin |
| PUT | `/api/clients/:id` | Update client | Admin |
| DELETE | `/api/clients/:id` | Delete client | Admin |

### Contract Lines
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/client-contract-lines` | List all contracts | Yes |
| GET | `/api/client-contract-lines/:id` | Get contract by ID | Yes |
| POST | `/api/client-contract-lines` | Create contract | Admin |
| PUT | `/api/client-contract-lines/:id` | Update contract | Admin |
| DELETE | `/api/client-contract-lines/:id` | Delete contract | Admin |

### Inventory Lots
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/inventory-lots` | List all lots | Yes |
| GET | `/api/inventory-lots/:id` | Get lot by ID | Yes |
| POST | `/api/inventory-lots` | Create lot | Admin |
| PUT | `/api/inventory-lots/:id` | Update lot | Admin |
| DELETE | `/api/inventory-lots/:id` | Delete lot | Admin |

### Allocations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/allocations` | List all allocations | Yes |
| GET | `/api/allocations/:id` | Get allocation by ID | Yes |
| POST | `/api/allocations` | Create allocation | Admin |
| PUT | `/api/allocations/:id` | Update allocation | Admin |
| DELETE | `/api/allocations/:id` | Delete allocation | Admin |

### FX Rates
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/fx-rates` | List all rates | Yes |
| GET | `/api/fx-rates/latest` | Get latest rate | Yes |
| GET | `/api/fx-rates/history` | Get rate history | Yes |
| POST | `/api/fx-rates` | Create rate | Admin |

### Metrics
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/metrics/profitability` | Profitability by client/SKU/supplier | Yes |
| GET | `/api/metrics/inventory` | Inventory status and coverage | Yes |

### Recommendations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/recommendations` | Get AI recommendations | Yes |
| POST | `/api/recommendations/simulate` | Simulate proposed changes | Yes |

### Audit
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/audit` | Get audit logs | Yes |
| POST | `/api/audit/revert` | Revert to previous version | Admin |

## Recommendation Engine

### How Recommendations Are Computed

The recommendation engine analyzes the current state of inventory, contracts, and pricing to generate actionable insights:

#### 1. Supplier Swap Recommendations
- **Trigger**: When another supplier offers the same SKU at a lower landed cost
- **Process**:
  1. For each client contract line, get all supplier offers for that SKU
  2. Calculate landed cost for each offer using current FX rate
  3. Compare with current supplier's cost
  4. If savings > SGD 10/month, generate recommendation
- **Scoring**: Impact based on monthly savings, risk based on supplier reliability

#### 2. SKU Swap Recommendations
- **Trigger**: When a contract has low margin (<25%) and alternative SKUs exist
- **Process**:
  1. Identify low-margin contract lines
  2. Find alternative SKUs in the same quality tier or substitutable group
  3. Calculate potential margin improvement
  4. If margin improvement > 5% and profit improvement > SGD 20/month, recommend
- **Scoring**: Impact based on profit improvement, moderate risk for SKU changes

#### 3. Reorder Recommendations
- **Trigger**: When stock coverage falls below 30 days
- **Process**:
  1. Calculate total available stock per SKU
  2. Calculate monthly demand from contract lines
  3. Compute stock coverage in days
  4. If coverage < 30 days, recommend reorder
  5. Suggest quantity = 2 months demand or supplier MOQ (whichever is higher)
- **Scoring**: Critical (90) if < 14 days, Warning (60) if < 30 days

#### 4. Allocation Optimization
- **Trigger**: Over-allocation or expiring unallocated stock
- **Process**:
  1. For each inventory lot, sum all allocations
  2. If allocated > remaining, flag over-allocation
  3. If lot has expiry date < 60 days and unallocated > 5kg, flag
- **Scoring**: High impact for over-allocation issues

### Scoring Formula
```
impact_score = weighted sum of:
  - Profit uplift (0-100)
  - Stockout risk reduction (0-100)
  - Cash tied up reduction (0-100)

risk_score = weighted sum of:
  - Lead time risk (0-100)
  - Supplier reliability (0-100)
  - FX volatility (0-100)

final_score = impact_score × 0.7 - risk_score × 0.3
```

## Cost Calculations

### Landed Cost Formula
```typescript
// FX rate is stored as: 1 JPY = X SGD (e.g., 0.009)
powder_cost_sgd = cost_jpy_per_kg × fx_rate

shipping_sgd_per_kg = 15  // Fixed SGD 15/kg

import_tax = 0.09 × (powder_cost_sgd + shipping_sgd_per_kg)

landed_cost_sgd_per_kg = powder_cost_sgd + shipping_sgd_per_kg + import_tax
```

### Profit Calculation
```typescript
net_selling_price = selling_sgd_per_kg × (1 - discount_pct / 100)

profit_per_kg = net_selling_price - landed_cost_sgd_per_kg

gross_margin_pct = (profit_per_kg / net_selling_price) × 100

monthly_profit = profit_per_kg × monthly_volume_kg
```

### Stock Coverage
```typescript
daily_demand = monthly_demand_kg / 30

stock_coverage_days = total_available_kg / daily_demand
```

## Running Locally

### Prerequisites
- Node.js 20+
- npm or pnpm

### Quick Start
```bash
# Clone and install
git clone https://github.com/sherlx7/matcha-insights-dashboard.git
cd matcha-insights-dashboard
npm install
cd server && npm install && cd ..

# Configure environment
cp server/.env.example server/.env

# Run migrations and seed
cd server
npx prisma migrate dev
npm run db:seed
cd ..

# Start development servers
npm run dev:full
```

### Default Credentials
- **Email**: admin@matsumatcha.com
- **Password**: admin123

## Deployment

### Docker Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | API server port (default: 3001) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

### Production Checklist
1. Set strong `JWT_SECRET`
2. Use PostgreSQL (not SQLite)
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up database backups
6. Monitor with logging service

## Seed Data Summary

The seed script creates:
- **1 Admin User**: admin@matsumatcha.com / admin123
- **3 Suppliers**: Marukyu Koyamaen, Aiya Co., Ltd., Ippodo Tea Co.
- **5 SKUs**: Competition, Ceremonial (2), Cafe (2) grades
- **7 Supplier Offers**: Various pricing across suppliers
- **5 Clients**: Mix of cafes, brands, and industrial
- **5 Contract Lines**: Different volumes and pricing
- **5 Inventory Lots**: Including low stock scenarios
- **5 Allocations**: Including over-allocation scenario
- **31 FX Rate Entries**: 30 days of history

This data generates at least 5 recommendations:
1. CRITICAL reorder for Kyoto Ceremonial (8 days coverage)
2. CRITICAL reorder for Everyday Cafe (7.5 days coverage)
3. Over-allocation warning for Kyoto Ceremonial lot
4. Supplier swap opportunities (Aiya vs Marukyu pricing)
5. SKU swap suggestions for low-margin contracts
