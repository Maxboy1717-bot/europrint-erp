# POS v2 Database Migrations

## SQL Schema

Run these SQL statements to create the required tables for POS v2 module.

### Create Tables

```sql
-- Inventory Counts Table
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  count_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  started_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for inventory_counts
CREATE INDEX idx_inventory_counts_warehouse_id ON inventory_counts(warehouse_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_counts_created_at ON inventory_counts(created_at);

-- Inventory Count Lines Table
CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL,
  sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  system_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
  counted_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
  variance DECIMAL(12, 3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  location TEXT,
  notes TEXT
);

-- Create indexes for inventory_count_lines
CREATE INDEX idx_inventory_count_lines_count_id ON inventory_count_lines(count_id);
CREATE INDEX idx_inventory_count_lines_stock_item_id ON inventory_count_lines(stock_item_id);
CREATE INDEX idx_inventory_count_lines_sku ON inventory_count_lines(sku);

-- Transfer Requests Table
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  from_warehouse_id UUID NOT NULL,
  to_warehouse_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for transfer_requests
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_from_warehouse_id ON transfer_requests(from_warehouse_id);
CREATE INDEX idx_transfer_requests_to_warehouse_id ON transfer_requests(to_warehouse_id);
CREATE INDEX idx_transfer_requests_created_at ON transfer_requests(created_at);

-- Transfer Request Lines Table
CREATE TABLE IF NOT EXISTS transfer_request_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  requested_qty DECIMAL(12, 3) NOT NULL,
  approved_qty DECIMAL(12, 3),
  unit TEXT NOT NULL DEFAULT 'pcs'
);

-- Create indexes for transfer_request_lines
CREATE INDEX idx_transfer_request_lines_request_id ON transfer_request_lines(request_id);
CREATE INDEX idx_transfer_request_lines_stock_item_id ON transfer_request_lines(stock_item_id);
```

## Using Drizzle Migrations

If using Drizzle ORM migrations, create a migration file:

### Generate Migration

```bash
npm run drizzle:generate -- --name add_pos_v2_tables
```

### Create Migration File

Place in `src/migrations/` directory:

```typescript
// src/migrations/0001_add_pos_v2_tables.ts
import { sql } from "drizzle-orm";
import type { Migration } from "drizzle-orm/migrator";

export const migration: Migration = {
  sql: `
    CREATE TABLE IF NOT EXISTS inventory_counts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL,
      count_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      started_by TEXT NOT NULL,
      approved_by TEXT,
      approved_at TIMESTAMP WITH TIME ZONE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE INDEX idx_inventory_counts_warehouse_id ON inventory_counts(warehouse_id);
    CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
    CREATE INDEX idx_inventory_counts_created_at ON inventory_counts(created_at);

    CREATE TABLE IF NOT EXISTS inventory_count_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
      stock_item_id UUID NOT NULL,
      sku TEXT NOT NULL,
      item_name TEXT NOT NULL,
      system_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
      counted_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
      variance DECIMAL(12, 3) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      location TEXT,
      notes TEXT
    );

    CREATE INDEX idx_inventory_count_lines_count_id ON inventory_count_lines(count_id);
    CREATE INDEX idx_inventory_count_lines_stock_item_id ON inventory_count_lines(stock_item_id);
    CREATE INDEX idx_inventory_count_lines_sku ON inventory_count_lines(sku);

    CREATE TABLE IF NOT EXISTS transfer_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_number TEXT NOT NULL UNIQUE,
      from_warehouse_id UUID NOT NULL,
      to_warehouse_id UUID NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      approved_by TEXT,
      approved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
    CREATE INDEX idx_transfer_requests_from_warehouse_id ON transfer_requests(from_warehouse_id);
    CREATE INDEX idx_transfer_requests_to_warehouse_id ON transfer_requests(to_warehouse_id);
    CREATE INDEX idx_transfer_requests_created_at ON transfer_requests(created_at);

    CREATE TABLE IF NOT EXISTS transfer_request_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,
      stock_item_id UUID NOT NULL,
      item_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      requested_qty DECIMAL(12, 3) NOT NULL,
      approved_qty DECIMAL(12, 3),
      unit TEXT NOT NULL DEFAULT 'pcs'
    );

    CREATE INDEX idx_transfer_request_lines_request_id ON transfer_request_lines(request_id);
    CREATE INDEX idx_transfer_request_lines_stock_item_id ON transfer_request_lines(stock_item_id);
  `,
  breakpoints: true,
};
```

### Run Migration

```bash
npm run drizzle:migrate
```

## Schema Documentation

### inventory_counts

Stores physical inventory count records.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| warehouse_id | UUID | Target warehouse |
| count_number | TEXT | Auto-generated: CNT-YYYYMMDD-XXX |
| status | TEXT | draft, in_progress, completed, approved |
| started_by | TEXT | User ID who initiated |
| approved_by | TEXT | User ID who approved |
| approved_at | TIMESTAMP | When approved |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-updated |

### inventory_count_lines

Individual items in a count.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| count_id | UUID | Foreign key to inventory_counts |
| stock_item_id | UUID | Reference to stock_items |
| sku | TEXT | Stock keeping unit |
| item_name | TEXT | Product name |
| system_quantity | DECIMAL | Qty from database |
| counted_quantity | DECIMAL | Physical count |
| variance | DECIMAL | Difference |
| unit | TEXT | pcs, kg, etc. |
| location | TEXT | Warehouse location |
| notes | TEXT | Per-item notes |

### transfer_requests

Requests to move stock between warehouses.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| request_number | TEXT | Auto-generated: TR-YYYYMMDD-XXXXX |
| from_warehouse_id | UUID | Source warehouse |
| to_warehouse_id | UUID | Destination warehouse |
| status | TEXT | pending, approved, in_transit, completed, rejected |
| reason | TEXT | Why transfer is needed |
| requested_by | TEXT | User ID who created |
| approved_by | TEXT | User ID who approved |
| approved_at | TIMESTAMP | When approved |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-updated |

### transfer_request_lines

Items in a transfer request.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| request_id | UUID | Foreign key to transfer_requests |
| stock_item_id | UUID | Reference to stock_items |
| item_name | TEXT | Product name |
| sku | TEXT | Stock keeping unit |
| requested_qty | DECIMAL | How much requested |
| approved_qty | DECIMAL | How much approved |
| unit | TEXT | pcs, kg, etc. |

## Indexes

All tables have strategic indexes for common queries:

- `warehouse_id` for filtering by warehouse
- `status` for filtering by status
- `created_at` for sorting/date range queries
- Foreign key columns for joins
- `sku` and `request_number`, `count_number` for lookups

## Data Integrity

- Cascade delete on line items when parent record deleted
- Unique constraints on `count_number` and `request_number`
- Foreign key relationships maintained
- Default values for status and unit fields
- Automatic timestamps

## Backup & Recovery

Before applying migrations to production:

```bash
# Backup current database
pg_dump -U postgres dbname > pos_v2_backup.sql

# Test migration on staging
# Then apply to production after verification
```

## Rollback

If needed, rollback the migration:

```sql
DROP TABLE IF EXISTS transfer_request_lines CASCADE;
DROP TABLE IF EXISTS transfer_requests CASCADE;
DROP TABLE IF EXISTS inventory_count_lines CASCADE;
DROP TABLE IF EXISTS inventory_counts CASCADE;
```

## Performance Considerations

- Indexes on `status` allow fast filtering of in-progress items
- `created_at` index supports date range queries for reports
- Cascade delete on lines prevents orphaned records
- Decimal(12,3) provides precision for fractional quantities
- UNIQUE constraints prevent duplicate count/request numbers
