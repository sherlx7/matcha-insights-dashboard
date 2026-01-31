-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Japan',
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "typical_lead_time_days" INTEGER NOT NULL DEFAULT 21,
    "reliability_score" REAL NOT NULL DEFAULT 0.9,
    "min_order_kg" REAL NOT NULL DEFAULT 10,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matcha_skus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quality_tier" TEXT NOT NULL,
    "tasting_notes" TEXT,
    "intended_use" TEXT NOT NULL DEFAULT 'LATTE',
    "substitutable_group_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "supplier_sku_offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "cost_jpy_per_kg" REAL NOT NULL,
    "last_updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moq_kg" REAL,
    "pack_size_kg" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_sku_offers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_sku_offers_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "matcha_skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "segment" TEXT NOT NULL DEFAULT 'CAFE',
    "default_discount_pct" REAL NOT NULL DEFAULT 0,
    "payment_terms" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "client_contract_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "selling_sgd_per_kg" REAL NOT NULL,
    "discount_pct" REAL NOT NULL DEFAULT 0,
    "monthly_volume_kg" REAL NOT NULL,
    "delivery_frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "next_delivery_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "client_contract_lines_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_contract_lines_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "matcha_skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "arrived_at" DATETIME NOT NULL,
    "qty_kg_total" REAL NOT NULL,
    "qty_kg_remaining" REAL NOT NULL,
    "cost_basis_sgd_per_kg" REAL NOT NULL,
    "warehouse_location" TEXT,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_lots_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "matcha_skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory_lot_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "qty_kg_allocated" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "allocations_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "allocations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "allocations_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "matcha_skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fx_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" TEXT NOT NULL DEFAULT 'JPY',
    "quote" TEXT NOT NULL DEFAULT 'SGD',
    "rate" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "order_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expected_arrival_date" DATETIME,
    "notes" TEXT,
    CONSTRAINT "order_plans_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_plan_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_plan_id" TEXT NOT NULL,
    "sku_id" TEXT NOT NULL,
    "qty_kg" REAL NOT NULL,
    "cost_jpy_per_kg_snapshot" REAL NOT NULL,
    "fx_rate_snapshot" REAL NOT NULL,
    "projected_landed_sgd_per_kg" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_plan_lines_order_plan_id_fkey" FOREIGN KEY ("order_plan_id") REFERENCES "order_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_plan_lines_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "matcha_skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" TEXT,
    "after_json" TEXT,
    "actor_user_id" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_sku_offers_supplier_id_sku_id_key" ON "supplier_sku_offers"("supplier_id", "sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_contract_lines_client_id_sku_id_key" ON "client_contract_lines"("client_id", "sku_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
