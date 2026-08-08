# 02 — MA'LUMOTLAR BAZASI STRATEGIYASI

> EuroPrint DB: nomlash, kanonik jadvallar, dedup, ikki-dunyo xavfi, majburiy ustunlar.
> Standart: [LOYIHA_QOIDALARI.md §3](../../../LOYIHA_QOIDALARI.md).
> **Holat: 🔧 Qisman** — asosiy jadvallar bor, lekin ikki-dunyo muammo hal qilinmagan.

---

## 2.1 Kanonik jadvallar (yagona haqiqat)

| Tushuncha | Kanonik jadval | VIEW/alias | O'chirilishi kerak |
|-----------|---------------|------------|-------------------|
| Buyurtma | `sales_orders` | `sd_sales_orders` (VIEW) | `orders` (eski) |
| Mijoz | `sd_customers` | — | `customers` (agar dup) |
| Stok | `warehouse_stock` | `current_stock` (VIEW) | — |
| Partiya | `stocks` | — | (alohida maqsad — saqlanadi) |
| GL yozuv | `entries` | — | `gl_journal_entries`+`gl_lines` (SAP#76, tegma) |
| Material | `material_cards` | — | `mm_materials` (test dup) |
| Texkarta | `technology_cards` | — | `tech_cards` (order-bound, tegma) |
| Lavozim/Karta | `org_functions` | — | `positions` (0 FK, saqlanadi VIEW sifatida) |
| Bo'lim | `org_departments` | — | — |
| Razryad | `razryad_levels` | — | — |

**Qoida (H4):** Yangi jadval yaratishdan OLDIN:
1. Shu tushuncha uchun boshqa jadval bormi? → mavjud bo'lsa VIEW yoki shu jadvalni ishlat
2. Egasi ruxsati kerak (Q-35): `-- APPROVED: egasi (sana)` izoh migratsiyada

---

## 2.2 Majburiy ustunlar (har jadvalda)

```sql
-- Baza (barcha jadvalda):
id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at  TIMESTAMPTZ                         -- soft delete

-- Aggregate-root (biznes jadval) qo'shimcha:
created_by  INTEGER REFERENCES users(id)
updated_by  INTEGER REFERENCES users(id)
version     INTEGER NOT NULL DEFAULT 1          -- optimistic lock

-- Append-only (ledger/audit/outbox) — faqat insert:
-- UPDATE/DELETE trigger rad etadi
```

---

## 2.3 Drizzle schema tashkiloti

```
lib/db/src/schema/
├── users.ts                    # IAM
├── org-functions.ts            # karta hub
├── org-departments.ts
├── razryad-levels.ts
├── hr-employees.ts
├── sales-orders.ts             # kanonik
├── sales-order-items.ts
├── material-cards.ts           # kanonik
├── warehouse-stock.ts          # kanonik
├── technology-cards.ts         # kanonik master texkarta
├── tech-card-bom.ts
├── tech-card-routes.ts
├── tech-card-versions.ts
├── entries.ts                  # kanonik GL
├── domain-events.ts            # outbox
├── audit-log.ts
└── index.ts                    # barcha export

apps/api/src/shared/db/schema.ts:
  // FAQAT re-export — yangi pgTable TAQIQ
  export * from '@workspace/db';
```

---

## 2.4 Migration qoidalari

```sql
-- IDEMPOTENT (IF NOT EXISTS, IF EXISTS):
CREATE TABLE IF NOT EXISTS hr_employees ( ... );
ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER;

-- APPROVED izoh (Q-35):
-- APPROVED: Ayubxon Pozilov (2026-06-18)

-- INDEX:
CREATE INDEX IF NOT EXISTS idx_hr_employees_org_function ON hr_employees(org_function_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

---

## 2.5 Ikki-dunyo xavfi (eng muhim)

Ikki-dunyo = bir tushuncha uchun 2 ta jadval → data inkonsistensiya.

**Mavjud ikki-dunyo muammolar (T1-T4):**

```sql
-- T1: Buyurtma (HAL QILINISHI KERAK)
SELECT COUNT(*) FROM sales_orders;  -- kanonik
SELECT COUNT(*) FROM orders;        -- eski, o'chirilsin

-- T2: Stok (HAL QILINGAN)
warehouse_stock -- kanonik (ishlaydi)
current_stock   -- VIEW → warehouse_stock (TO'G'RI)
stocks          -- partiya (alohida maqsad, saqlanadi)

-- T3: GL (TEGMA - SAP#76)
entries          -- kanonik
gl_journal_entries  -- tegma, o'chirma

-- T4: Texkarta (HAL QILINMOQDA)
technology_cards  -- kanonik master (ALTER qilingan 2026-06-18)
tech_cards        -- order-bound, readers bor, tegma
```

---

## 2.6 View pattern (modul izolyatsiyasi)

```sql
-- Kanonik jadval bir marta:
CREATE TABLE sales_orders ( id, customer_id, status, total, ... );

-- VIEW = modul ko'rinishi (ustunni qayta nomlash ruxsat):
CREATE OR REPLACE VIEW sd_sales_orders AS
  SELECT id, customer_id, status, total, created_at
  FROM sales_orders WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW current_stock AS
  SELECT material_id, warehouse_id, qty, reserved_qty
  FROM warehouse_stock WHERE deleted_at IS NULL;
```

---

## 2.7 Index strategiyasi

```sql
-- FK → har birida index (N+1 oldini olish):
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_user ON hr_employees(user_id);

-- Qidiruv:
CREATE INDEX IF NOT EXISTS idx_material_cards_code ON material_cards(code);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id, created_at DESC);

-- Soft-delete partial:
CREATE INDEX IF NOT EXISTS idx_hr_employees_active
  ON hr_employees(org_function_id) WHERE deleted_at IS NULL;
```

---

## 2.8 Immutable jadvallar (faqat insert)

```sql
-- Ledger (warehouse_stock harakatlar):
CREATE TABLE warehouse_transactions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  material_id INTEGER NOT NULL REFERENCES material_cards(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  qty NUMERIC(18,4) NOT NULL,     -- + kirim, - chiqim
  type VARCHAR(50) NOT NULL,      -- receipt/issue/transfer/adjustment
  reference_id INTEGER,           -- buyurtma/akt ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
  -- updated_at YO'Q, deleted_at YO'Q — faqat insert
);

-- GL entries (kanonik):
CREATE TABLE entries (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  account_code VARCHAR(20) NOT NULL,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  description TEXT,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
  -- faqat insert
);
```

---

## 2.9 Dedup strategiyasi

```sql
-- pg_trgm: yangi yozuv kiritishdan oldin o'xshashini ko'rsat:
SELECT id, name, similarity(name, 'Alisher Qodirov') AS sim
FROM sd_customers
WHERE similarity(name, 'Alisher Qodirov') > 0.6
ORDER BY sim DESC LIMIT 5;

-- Uniq indeks (variant matritsasi):
CREATE UNIQUE INDEX IF NOT EXISTS uq_tech_card_bom_material
  ON tech_card_bom(technology_card_id, material_card_id)
  WHERE deleted_at IS NULL;
```

---

## 2.10 Tekshirish buyruqlari

```bash
# Jonli DB tekshiruv (read-only):
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"

# Ikki-dunyo tekshiruvi:
node _audit/q.cjs "SELECT 'sales_orders' as tbl, COUNT(*) FROM sales_orders UNION ALL SELECT 'orders', COUNT(*) FROM orders"

# FK'siz jadvallar (potensial orphan):
node _audit/q.cjs "SELECT tc.table_name FROM information_schema.table_constraints tc WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_name NOT IN (SELECT ccu.table_name FROM information_schema.constraint_column_usage ccu JOIN information_schema.referential_constraints rc ON ccu.constraint_name=rc.constraint_name) ORDER BY 1"
```

---

*Keyingi: [03_Datalar_almashuvi.md](03_Datalar_almashuvi.md) — Event-driven + outbox*
