# EUROPRINT ERP — AGENT STANDARTLARI (To'liq Qo'llanma)

> **Bu hujjatni har sessiyada o'qi.** Agent biror narsa yaratishdan OLDIN bu yerdan tekshiradi.
> Maqsad: DUPLIKAT va NOMLASH XATOLARINI NOLGA TUSHIRISH.
> Qamrov: jadval nomlash · ustun nomlash · API URL · DDD tuzilma · Drizzle namunalar · controller/service/repo shablonlar · xato formati.
> Bog'liq: [LOYIHA_QOIDALARI.md](LOYIHA_QOIDALARI.md) · [DIZAYN_QOIDALARI.md](DIZAYN_QOIDALARI.md).

---

## ❗ BIRINCHI: YANGI NARSA YARATISHDAN OLDIN (MAJBURIY)

Har qanday yangi jadval / service / komponent yaratishdan OLDIN shu tekshiruvlarni bajar:

```bash
# 1. Shu tushuncha uchun jadval bormi?
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%[kalit_so_z]%' ORDER BY 1"

# 2. Shu nomda Drizzle schema bormi?
grep -r "pgTable('[kalit_so_z]" lib/db/src/schema/

# 3. Shu nomda service/controller bormi?
grep -r "class [Nom]Service\|class [Nom]Controller\|class [Nom]Repository" apps/api/src/

# 4. Shu nomda FE komponent/sahifa bormi?
grep -r "function [Nom]Page\|export.*[Nom]Page\|export.*[Nom]Component" artifacts/erp-dashboard/src/pages/
```

**Agar topilsa → YANGI YARATMA. Mavjudni kengaytir yoki VIEW yarat.**
**Agar topilmasa → §1 dan §4 gacha tekshir, keyin yaratishga ruxsat.**

---

## § 1. KANONIK JADVALLAR (Yagona Haqiqat)

**Qoida:** Shu ro'yxatdan tashqari jadvaldan foydalanishdan OLDIN egasidan ruxsat ol (Q-35).

### 1.1 IAM / Auth

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `users` | KANONIK | Login, JWT, rol |
| `roles` | KANONIK | RBAC rol |
| `permissions` | KANONIK | Ruxsat |
| `role_permissions` | KANONIK | Rol↔ruxsat bog'liq |
| `user_roles` | KANONIK | Foydalanuvchi↔rol |
| `token_blacklist` | KANONIK | JWT jti blacklist |
| `audit_log` | KANONIK (append-only) | Har o'zgarish yozuvi |

### 1.2 Org Tuzilma

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `org_functions` | ⭐ KANONIK (29 FK hub) | Lavozim KARTA — asosiy ob'ekt |
| `org_departments` | KANONIK | Bo'lim |
| `razryad_levels` | KANONIK | Razryad 1-6 |
| `positions` | ❌ DEPRECATED | 0 FK — faqat VIEW sifatida |
| `org_node_portret` | KANONIK | Karta portret (JSONB) |
| `org_chart_snapshots` | KANONIK | Org zanjir snapshot |

### 1.3 HR / Xodim

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `hr_employees` | KANONIK | Xodim |
| `hr_leave_requests` | KANONIK | Ta'til so'rovi |
| `hr_leave_balances` | KANONIK | Ta'til qoldig'i |
| `hr_documents` | KANONIK | Xodim hujjatlar |
| `hr_leave_requests` | KANONIK | Ta'til |
| `employees` | ❌ DEPRECATED | `hr_employees` ishlat |

### 1.4 Savdo / SD

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `sales_orders` | ⭐ KANONIK | Buyurtma |
| `sales_order_items` | KANONIK | Buyurtma qatorlari |
| `sd_customers` | KANONIK | Mijoz |
| `sd_quotations` | KANONIK | Taklif |
| `sd_quotation_items` | KANONIK | Taklif qatorlari |
| `sd_invoices` | KANONIK | Faktura |
| `sd_payments` | KANONIK | To'lov |
| `sd_contracts` | KANONIK | Shartnoma |
| `sd_sales_orders` | 🔵 VIEW | `sales_orders` ustida |
| `orders` | ❌ DEPRECATED | `sales_orders` ishlat |

### 1.5 Material

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `material_cards` | ⭐ KANONIK | Material master |
| `raw_materials` | KANONIK | Xomashyo (alohida maqsad) |
| `unit_of_measures` | KANONIK | O'lchov birligi |
| `mm_materials` | ❌ DEPRECATED (test-only) | `material_cards` ishlat |
| `units` | ❌ DEPRECATED | `unit_of_measures` ishlat |

### 1.6 Ombor / WMS

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `warehouse_stock` | ⭐ KANONIK | Stok (joriy qoldiq) |
| `warehouse_transactions` | KANONIK (append-only) | Kirim/chiqim ledger |
| `warehouses` | KANONIK | Ombor |
| `warehouse_zones` | KANONIK | Zona |
| `warehouse_transfers` | KANONIK | O'tkazma |
| `stocks` | KANONIK | Partiya/muddat (alohida maqsad) |
| `current_stock` | 🔵 VIEW | `warehouse_stock` ustida |
| `wms_stock` | ❌ DEPRECATED | `warehouse_stock` ishlat |
| `wms_warehouses` | ❌ DEPRECATED | `warehouses` ishlat |
| `wms_inventory` | ❌ DEPRECATED | `warehouse_stock` ishlat |
| `wms_transactions` | ❌ DEPRECATED | `warehouse_transactions` ishlat |

### 1.7 Ishlab Chiqarish / PP

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `technology_cards` | ⭐ KANONIK | Texkarta MASTER |
| `tech_card_bom` | KANONIK | Material norma (tech_card FK) |
| `tech_card_routes` | KANONIK | Operatsiya marshrut |
| `tech_card_versions` | KANONIK | Versiya tarixi |
| `work_centers` | ⭐ KANONIK | Mashina/ish markazi |
| `work_orders` | KANONIK | Ish buyurtma |
| `pp_mrp_runs` | KANONIK | MRP yugurish |
| `pp_mrp_run_lines` | KANONIK | MRP qatorlar |
| `pp_routing` | KANONIK | Routing |
| `pp_routing_operations` | KANONIK | Operatsiyalar |
| `tech_cards` | ❌ ORDER-BOUND | Order-bog'liq, master emas |
| `pp_work_centers` | ❌ DEPRECATED | `work_centers` ishlat |

### 1.8 MES

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `shift_handovers` | ⭐ KANONIK | Smena hisobot |
| `mes_shift_handovers` | 🔵 VIEW | `shift_handovers` ustida |
| `mes_telemetry` | KANONIK | IoT telemetriya |
| `mes_sessions` | KANONIK | MES sessiya |
| `mes_operations` | KANONIK | Operatsiya |
| `mes_papka_orders` | 🔵 VIEW | `papka_orders` ustida |

### 1.9 Sifat / QC

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `qc_checks` | KANONIK | QC tekshiruv |
| `qc_reclamations` | KANONIK | Reklamatsiya |

### 1.10 Moliya / FIN

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `entries` | ⭐ KANONIK | GL yozuvi |
| `accounts` | KANONIK | GL hisoblar (CoA) |
| `accounting_periods` | KANONIK | Moliya davri |
| `vendors` | KANONIK | Yetkazuvchi |
| `vendor_invoices` | KANONIK | Yetkazuvchi faktura |
| `gl_journal_entries` | ❌ SAP#76 TEGMA | `entries` ishlat |
| `gl_lines` | ❌ SAP#76 TEGMA | `entries` ishlat |

### 1.11 CRM

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `crm_leads` | KANONIK | Lid |
| `crm_deals` | KANONIK | Bitim |
| `crm_contacts` | KANONIK | Kontakt |

### 1.12 Tizim

| Jadval | Turi | Eslatma |
|--------|------|---------|
| `domain_events` | KANONIK (outbox, append-only) | Event outbox |
| `idempotency_keys` | KANONIK | Idempotentlik |

---

## § 2. JADVAL NOMLASH QOIDALARI

### 2.1 Asosiy qoida

```
[modul_prefiksi]_[tushuncha_ko'plik]

Misollar:
✅ hr_leave_requests     (HR + ta'til so'rovlar)
✅ sd_quotation_items    (SD + taklif qatorlar)
✅ mes_downtime_reasons  (MES + to'xtash sabablari)

❌ LeaveRequest          (ko'plik emas, prefiks yo'q, PascalCase)
❌ hrLeaveRequest        (camelCase)
❌ hr_leave_request      (birlik)
❌ leave_requests        (prefiks yo'q — yangi jadval uchun TAQIQ)
```

### 2.2 Modul prefikslari (to'liq ro'yxat)

| Modul | Prefiks | Misol |
|-------|---------|-------|
| Org tuzilma | `org_` | `org_functions`, `org_departments` |
| HR / Xodim | `hr_` | `hr_employees`, `hr_leave_requests` |
| Savdo | `sd_` | `sd_quotations`, `sd_contracts` |
| Ishlab chiqarish reja | `pp_` | `pp_mrp_runs`, `pp_routing` |
| MES / Ijro | `mes_` | `mes_sessions`, `mes_telemetry` |
| Sifat | `qc_` | `qc_checks`, `qc_reclamations` |
| Ombor | `wms_` | `wms_internal_requests` (yangi) |
| Material | `mm_` | `mm_purchase_orders` (yangi) |
| Moliya | `fi_` | `fi_budgets`, `fi_banking` |
| CRM | `crm_` | `crm_leads`, `crm_deals` |
| POS | `pos_` | `pos_transactions` |
| IoT | `iot_` | `iot_sensors` (yangi) |
| AI | `ai_` | `ai_decision_log`, `ai_alerts` |
| LMS | `lms_` | `lms_courses`, `lms_modules` |
| Marketing | `mkt_` | `mkt_campaigns` |
| Kanban | `kan_` | `kan_boards`, `kan_tasks` → `task_*` mavjud |
| Notification | `ntf_` | `ntf_notifications` |
| Kamera | `cc_` | `cc_violations` |
| Saas | `saas_` | `saas_plans` |

> **ESLATMA:** Legacy (eski) jadvallar prefikssiz (`users`, `sales_orders`, `warehouses` va h.k.) — ularni QAYTA NOMLAMA, kanonik deb ishlat.

### 2.3 Jadval toifalari va qo'shimcha majburiy ustunlar

| Toifa | Majburiy ustunlar | Misol |
|-------|-------------------|-------|
| **Aggregate-root** (biznes ob'ekt) | id · created_at · updated_at · deleted_at · created_by · updated_by · version | `sales_orders`, `hr_employees` |
| **Child/line** (tafsilot) | id · created_at · parent_id (FK) | `sales_order_items`, `tech_card_bom` |
| **Lookup/ma'lumotnoma** | id · code (UNIQUE) · name · is_active | `razryad_levels`, `unit_of_measures` |
| **Append-only (ledger)** | id · created_at · created_by · (updated_at YO'Q, deleted_at YO'Q) | `entries`, `domain_events`, `audit_log` |
| **VIEW** | Yangi ustun yo'q — manba jadvaldan | `sd_sales_orders`, `current_stock` |

---

## § 3. USTUN NOMLASH (To'liq Qo'llanma)

### 3.1 Umumiy qoidalar

| Pattern | Drizzle tip | SQL tip | Misol |
|---------|-------------|---------|-------|
| Birlamchi kalit | `integer('id').primaryKey().generatedAlwaysAsIdentity()` | `INTEGER GENERATED ALWAYS AS IDENTITY` | `id` |
| Chet el kaliti | `integer('xxx_id').references(() => table.id)` | `INTEGER REFERENCES xxx(id)` | `customer_id`, `org_function_id` |
| Vaqt tamg'alari | `timestamp('xxx_at', { withTimezone: true })` | `TIMESTAMPTZ` | `created_at`, `updated_at`, `deleted_at` |
| Kim qildi | `integer('xxx_by').references(() => users.id)` | `INTEGER REFERENCES users(id)` | `created_by`, `updated_by`, `approved_by` |
| Status | `varchar('status', { length: 50 }).notNull().default('active')` | `VARCHAR(50) NOT NULL DEFAULT 'active'` | `status` |
| Bayroq | `boolean('is_xxx').notNull().default(false)` | `BOOLEAN NOT NULL DEFAULT FALSE` | `is_active`, `is_deleted` ❌ (soft-delete uchun `deleted_at`) |
| Miqdor | `numeric('qty_xxx', { precision: 18, scale: 4 })` | `NUMERIC(18,4)` | `qty_ordered`, `qty_produced` |
| Pul | `numeric('xxx_amount', { precision: 18, scale: 2 })` | `NUMERIC(18,2)` | `total_amount`, `unit_price` |
| Kod | `varchar('code', { length: 50 }).notNull().unique()` | `VARCHAR(50) NOT NULL UNIQUE` | `code` |
| Matn | `text('description')` | `TEXT` | `description`, `notes`, `reason` |
| Qisqa matn | `varchar('name', { length: 200 }).notNull()` | `VARCHAR(200) NOT NULL` | `name`, `title` |
| JSON ma'lumot | `jsonb('attributes')` | `JSONB` | `attributes`, `meta`, `config` |
| Versiya | `integer('version').notNull().default(1)` | `INTEGER NOT NULL DEFAULT 1` | `version` |

### 3.2 Maxsus nomlar (standartlashtirilgan)

```
✅ TO'G'RI nomlash:
  customer_id        (FK uchun: jadval nomi + _id)
  org_function_id    (FK uchun to'liq jadval nomi)
  created_at         (vaqt tamg'asi)
  approved_by        (kim bajardi/tasdiqadi)
  is_active          (holat bayrog'i)
  qty_ordered        (miqdor — qty_ prefiksi)
  total_amount       (pul miqdori)
  razryad_level_id   (FK)
  delivery_date      (sana — DATE tip, vaqtsiz)
  delivered_at       (sana+vaqt — TIMESTAMPTZ)

❌ NOTO'G'RI nomlash:
  customerId         (camelCase — TAQIQ)
  cust_id            (qisqartma — TAQIQ)
  orderDate          (camelCase va nomuvofiq — TAQIQ)
  amount             (noaniq — total_amount/unit_price yaz)
  flag               (noaniq — is_active/is_approved yaz)
  val                (qisqartma — TAQIQ)
  data               (juda umumiy — attributes/meta yaz)
  info               (juda umumiy)
  dt                 (qisqartma — TAQIQ)
```

### 3.3 Standart majburiy ustunlar (Drizzle namuna)

```ts
// LIB: lib/db/src/schema/_common.ts — bu yerdan import qil
import { integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Aggregate-root uchun standart ustunlar:
const aggregateRootColumns = {
  id:        integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  version:   integer('version').notNull().default(1),
  status:    varchar('status', { length: 50 }).notNull().default('active'),
};

// Child/line uchun standart:
const childColumns = {
  id:        integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
};

// Append-only (ledger/audit) uchun:
const appendOnlyColumns = {
  id:        integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  // updated_at, deleted_at YO'Q — faqat insert
};
```

---

## § 4. API URL STANDARTLARI

### 4.1 URL pattern

```
GET    /api/[modul]/[resurs]              → ro'yxat (pagination bilan)
GET    /api/[modul]/[resurs]/:id          → bitta element
POST   /api/[modul]/[resurs]             → yaratish
PUT    /api/[modul]/[resurs]/:id         → to'liq yangilash
PATCH  /api/[modul]/[resurs]/:id         → qisman yangilash
DELETE /api/[modul]/[resurs]/:id         → o'chirish (soft-delete)

Misol:
GET    /api/hr/employees
GET    /api/hr/employees/42
POST   /api/hr/employees
PUT    /api/hr/employees/42
DELETE /api/hr/employees/42
```

### 4.2 Nested resurslar

```
GET    /api/pp/technology/cards                 → texkartalar
GET    /api/pp/technology/cards/:id/bom         → texkarta BOM
POST   /api/pp/technology/cards/:id/bom         → BOM qatori yaratish
GET    /api/pp/technology/cards/:id/routes      → marshrut
GET    /api/pp/technology/cards/:id/versions    → versiya tarixi

GET    /api/sd/orders/:id/items                 → buyurtma qatorlari
POST   /api/sd/orders/:id/confirm               → tasdiq (action endpoint)
POST   /api/sd/orders/:id/cancel                → bekor qilish
```

### 4.3 Filtering va pagination

```
GET /api/hr/employees?page=1&limit=20&status=active&org_function_id=5&search=Ali

// Response format:
{
  "data": [...],
  "total": 93,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 4.4 Muvaffaqiyatli javob formati

```ts
// Yaratish (POST 201):
{
  "id": 42,
  "name": "Ali Karimov",
  "status": "active",
  "createdAt": "2026-06-18T10:00:00Z"
}

// Yangilash (PUT/PATCH 200):
{ ...yangilangan ob'ekt }

// O'chirish (DELETE 200):
{ "message": "O'chirildi", "id": 42 }

// Ro'yxat (GET 200):
{ "data": [...], "total": 93, "page": 1, "limit": 20 }
```

### 4.5 Xato javob formati

```ts
// Validatsiya xatosi (400):
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Noto'g'ri ma'lumot",
    "details": [
      { "field": "email", "message": "Email format noto'g'ri" }
    ]
  }
}

// Topilmadi (404):
{ "error": { "code": "NOT_FOUND", "message": "Xodim topilmadi" } }

// Ruxsat yo'q (403):
{ "error": { "code": "FORBIDDEN", "message": "Ruxsat yo'q" } }

// Server xatosi (500):
{ "error": { "code": "INTERNAL_ERROR", "message": "Server xatosi" } }
```

### 4.6 HTTP status kodlari

| Holat | Kod | Qachon |
|-------|-----|--------|
| Muvaffaqiyatli | 200 | GET, PUT, PATCH, DELETE |
| Yaratildi | 201 | POST |
| Xato ma'lumot | 400 | Validatsiya, noto'g'ri format |
| Auth kerak | 401 | Token yo'q/muddati o'tgan |
| Ruxsat yo'q | 403 | Role/permission yetarli emas |
| Topilmadi | 404 | ID bo'yicha topilmadi |
| Ziddiyat | 409 | UNIQUE constraint, ikki yozuv |
| Server xato | 500 | Kutilmagan xato |
| Hali yo'q | 501 | Hali qurilmagan endpoint |

---

## § 5. DDD FAYL TUZILMASI (Har Modul)

### 5.1 Modul papkasi tuzilmasi

```
apps/api/src/modules/[MODULE]/
├── domain/
│   ├── aggregates/
│   │   └── [module].aggregate.ts          # root aggregate
│   ├── entities/
│   │   └── [entity].entity.ts
│   ├── value-objects/
│   │   └── [vo].vo.ts                     # immutable, o'z-o'zini validate
│   ├── repositories/
│   │   └── i-[module].repository.ts       # port (interface)
│   └── events/
│       └── [event].event.ts               # domain event
├── application/
│   ├── services/
│   │   └── [module].service.ts
│   ├── commands/
│   │   └── create-[entity].command.ts
│   ├── queries/
│   │   └── get-[entity].query.ts
│   └── dtos/
│       └── create-[entity].dto.ts         # Zod schema
├── infrastructure/
│   ├── repositories/
│   │   └── drizzle-[module].repository.ts # impl (Drizzle)
│   └── adapters/
│       └── [external].adapter.ts
├── presentation/
│   └── controllers/
│       └── [module].controller.ts
└── [module].module.ts
```

### 5.2 Fayl nomlash

```
Fayllar: kebab-case.ts
Classlar: PascalCase
Funksiyalar/o'zgaruvchilar: camelCase
Konstantalar: UPPER_SNAKE_CASE

Misol fayllari:
  hr-employees.service.ts
  drizzle-hr-employees.repository.ts
  i-hr-employees.repository.ts       (interface/port)
  create-employee.dto.ts
  employee-created.event.ts
  employment-status.vo.ts
```

---

## § 6. DRIZZLE SCHEMA SHABLONLARI (Copy-Paste Tayyor)

### 6.1 Aggregate-root (biznes jadval)

```ts
// lib/db/src/schema/[modul]-[tushuncha].ts
import { pgTable, integer, varchar, text, timestamp, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { orgFunctions } from './org-functions';

export const hrLeaveRequests = pgTable('hr_leave_requests', {
  id:          integer('id').primaryKey().generatedAlwaysAsIdentity(),

  // Domain FK lar:
  employeeId:  integer('employee_id').notNull().references(() => hrEmployees.id),

  // Domain maydonlar:
  type:        varchar('type', { length: 50 }).notNull(),           // 'annual'/'sick'/'unpaid'
  startDate:   timestamp('start_date', { withTimezone: true }).notNull(),
  endDate:     timestamp('end_date', { withTimezone: true }).notNull(),
  daysCount:   numeric('days_count', { precision: 5, scale: 1 }),
  reason:      text('reason'),
  status:      varchar('status', { length: 50 }).notNull().default('pending'),

  // Audit / system:
  createdBy:   integer('created_by').references(() => users.id),
  updatedBy:   integer('updated_by').references(() => users.id),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),     // soft-delete
  version:     integer('version').notNull().default(1),             // optimistic lock
});

export type HrLeaveRequest = typeof hrLeaveRequests.$inferSelect;
export type NewHrLeaveRequest = typeof hrLeaveRequests.$inferInsert;
```

### 6.2 Child/line jadval

```ts
export const techCardBom = pgTable('tech_card_bom', {
  id:               integer('id').primaryKey().generatedAlwaysAsIdentity(),
  technologyCardId: integer('technology_card_id').notNull().references(() => technologyCards.id),
  materialCardId:   integer('material_card_id').notNull().references(() => materialCards.id),
  qtyPerUnit:       numeric('qty_per_unit', { precision: 18, scale: 4 }).notNull(),
  unitOfMeasureId:  integer('unit_of_measure_id').references(() => unitOfMeasures.id),
  scrapPct:         numeric('scrap_pct', { precision: 5, scale: 2 }).default('0'),
  notes:            text('notes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // NB: updated_at, deleted_at, version — child'da YO'Q (parent boshqaradi)
});
```

### 6.3 Append-only (ledger / audit)

```ts
export const warehouseTransactions = pgTable('warehouse_transactions', {
  id:            integer('id').primaryKey().generatedAlwaysAsIdentity(),
  materialCardId: integer('material_card_id').notNull().references(() => materialCards.id),
  warehouseId:   integer('warehouse_id').notNull().references(() => warehouses.id),
  qty:           numeric('qty', { precision: 18, scale: 4 }).notNull(), // + kirim, - chiqim
  type:          varchar('type', { length: 50 }).notNull(),              // 'receipt'/'issue'/'transfer'
  referenceId:   integer('reference_id'),
  referenceType: varchar('reference_type', { length: 50 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy:     integer('created_by').references(() => users.id),
  // updated_at, deleted_at YO'Q — faqat INSERT
});
```

### 6.4 Lookup (ma'lumotnoma)

```ts
export const razryadLevels = pgTable('razryad_levels', {
  id:       integer('id').primaryKey().generatedAlwaysAsIdentity(),
  level:    integer('level').notNull().unique(),                         // 1-6
  nameUz:   varchar('name_uz', { length: 100 }).notNull(),
  nameRu:   varchar('name_ru', { length: 100 }),
  minExperienceMonths: integer('min_experience_months').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  // deleted_at, version — lookup'da YO'Q
});
```

### 6.5 VIEW (Drizzle'da e'lon qilish)

```ts
// Drizzle VIEW e'lon:
import { pgView } from 'drizzle-orm/pg-core';

export const sdSalesOrders = pgView('sd_sales_orders').as((qb) =>
  qb
    .select({
      id: salesOrders.id,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      totalAmount: salesOrders.totalAmount,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .where(isNull(salesOrders.deletedAt))
);
```

### 6.6 Re-export (shared/db/schema.ts)

```ts
// apps/api/src/shared/db/schema.ts — FAQAT re-export
export * from '@workspace/db';
// Bu faylda HECH QACHON yangi pgTable YARATMA
```

---

## § 7. REPOSITORY SHABLON

```ts
// apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-employees.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@/common/drizzle';
import { db as DbType } from '@/shared/db';
import { hrEmployees } from '@workspace/db';
import { eq, isNull, and, ilike, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@/common/result';
import { IHrEmployeesRepository } from '../../domain/repositories/i-hr-employees.repository';
import { AppError } from '@/common/errors';

@Injectable()
export class DrizzleHrEmployeesRepository implements IHrEmployeesRepository {

  constructor(@InjectDrizzle() private readonly db: typeof DbType) {}

  async findAll(filters: { status?: string; page: number; limit: number }): Promise<Result<{ data: any[]; total: number }, AppError>> {
    try {
      const where = and(
        isNull(hrEmployees.deletedAt),
        filters.status ? eq(hrEmployees.status, filters.status) : undefined,
      );
      const [data, [{ count }]] = await Promise.all([
        this.db.select().from(hrEmployees).where(where)
          .limit(filters.limit).offset((filters.page - 1) * filters.limit)
          .orderBy(desc(hrEmployees.createdAt)),
        this.db.select({ count: sql<number>`count(*)::int` }).from(hrEmployees).where(where),
      ]);
      return Ok({ data, total: count });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async findById(id: number): Promise<Result<any, AppError>> {
    try {
      const [row] = await this.db.select().from(hrEmployees)
        .where(and(eq(hrEmployees.id, id), isNull(hrEmployees.deletedAt)));
      return row ? Ok(row) : Err({ code: 'NOT_FOUND', message: `Xodim #${id} topilmadi` });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async create(dto: any, userId: number): Promise<Result<any, AppError>> {
    try {
      const [row] = await this.db.insert(hrEmployees).values({ ...dto, createdBy: userId, updatedBy: userId }).returning();
      return Ok(row);
    } catch (e: any) {
      if (e.code === '23505') return Err({ code: 'DUPLICATE', message: 'Bunday yozuv allaqachon mavjud' });
      if (e.code === '23503') return Err({ code: 'FK_VIOLATION', message: 'Bog\'liq yozuv topilmadi' });
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async update(id: number, dto: any, userId: number): Promise<Result<any, AppError>> {
    try {
      const [row] = await this.db.update(hrEmployees)
        .set({ ...dto, updatedBy: userId, updatedAt: new Date(), version: sql`version + 1` })
        .where(and(eq(hrEmployees.id, id), isNull(hrEmployees.deletedAt)))
        .returning();
      return row ? Ok(row) : Err({ code: 'NOT_FOUND', message: `Xodim #${id} topilmadi` });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async softDelete(id: number, userId: number): Promise<Result<void, AppError>> {
    try {
      await this.db.update(hrEmployees)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(and(eq(hrEmployees.id, id), isNull(hrEmployees.deletedAt)));
      return Ok(undefined);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
```

---

## § 8. SERVICE SHABLON

```ts
// apps/api/src/modules/hr/application/services/hr-employees.service.ts
import { Injectable } from '@nestjs/common';
import { IHrEmployeesRepository } from '../../domain/repositories/i-hr-employees.repository';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { Result, Ok, Err } from '@/common/result';

@Injectable()
export class HrEmployeesService {
  constructor(private readonly repo: IHrEmployeesRepository) {}

  async findAll(filters: { status?: string; page: number; limit: number }) {
    return this.repo.findAll(filters);
  }

  async findById(id: number) {
    return this.repo.findById(id);
  }

  async create(dto: CreateEmployeeDto, userId: number) {
    // Biznes mantiq (agar kerak):
    // 1. Org function mavjudligini tekshir
    // 2. Razryad mavjudligini tekshir
    return this.repo.create(dto, userId);
  }

  async update(id: number, dto: Partial<CreateEmployeeDto>, userId: number) {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    return this.repo.update(id, dto, userId);
  }

  async remove(id: number, userId: number) {
    return this.repo.softDelete(id, userId);
  }
}
```

---

## § 9. CONTROLLER SHABLON

```ts
// apps/api/src/modules/hr/presentation/controllers/hr-employees.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { HrEmployeesService } from '../../application/services/hr-employees.service';
import { CreateEmployeeSchema } from '../../application/dtos/create-employee.dto';
import type { JwtPayload } from '@/modules/auth/domain/value-objects/jwt-payload';

@Controller('hr/employees')
@UseGuards(JwtAuthGuard)
export class HrEmployeesController {
  constructor(private readonly service: HrEmployeesService) {}

  @Get()
  async findAll(@Query() query: { status?: string; page?: string; limit?: string }) {
    const result = await this.service.findAll({
      status: query.status,
      page: parseInt(query.page ?? '1'),
      limit: parseInt(query.limit ?? '20'),
    });
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findById(parseInt(id));
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') throw new NotFoundException(result.error.message);
      throw new InternalServerErrorException(result.error.message);
    }
    return result.data;
  }

  @Post()
  @Roles('manager', 'super_admin', 'director')
  async create(@Body() body: unknown, @CurrentUser() user: JwtPayload) {
    const dto = CreateEmployeeSchema.parse(body);           // Zod validatsiya
    const result = await this.service.create(dto, user.sub);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  @Put(':id')
  @Roles('manager', 'super_admin', 'director')
  async update(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: JwtPayload) {
    const dto = UpdateEmployeeSchema.parse(body);
    const result = await this.service.update(parseInt(id), dto, user.sub);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') throw new NotFoundException(result.error.message);
      throw new BadRequestException(result.error.message);
    }
    return result.data;
  }

  @Delete(':id')
  @Roles('super_admin', 'director')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const result = await this.service.remove(parseInt(id), user.sub);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { message: "O'chirildi", id: parseInt(id) };
  }
}
```

---

## § 10. DTO SHABLON (Zod)

```ts
// apps/api/src/modules/hr/application/dtos/create-employee.dto.ts
import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  userId:           z.number().int().positive(),
  orgFunctionId:    z.number().int().positive().optional(),
  razryadLevelId:   z.number().int().min(1).max(6).optional(),
  employeeNumber:   z.string().max(50).optional(),
  hiredAt:          z.string().datetime().optional(),
  phone:            z.string().max(50).optional(),
  address:          z.string().max(500).optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
```

---

## § 11. MIGRATION SHABLON (Idempotent)

```sql
-- docs/migration/[NN]-[tavsif].sql
-- APPROVED: Ayubxon Pozilov (2026-06-18)

BEGIN;

-- Yangi jadval (agar kerak bo'lsa):
CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE RESTRICT,
  type        VARCHAR(50) NOT NULL,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  version     INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT chk_hr_leave_requests_status
    CHECK (status IN ('pending','approved','rejected','cancelled'))
);

-- Indeks (FK uchun MAJBURIY):
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_employee
  ON hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_status
  ON hr_leave_requests(status) WHERE deleted_at IS NULL;

-- Ustun qo'shish (agar kerak):
ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER;

-- FK qo'shish (agar esa):
ALTER TABLE hr_employees
  ADD CONSTRAINT fk_hr_employees_razryad
  FOREIGN KEY (razryad_level_id) REFERENCES razryad_levels(id) ON DELETE SET NULL;

COMMIT;
```

---

## § 12. DOMAIN EVENT SHABLON

```ts
// Domain event:
export class EmployeeCreatedEvent {
  readonly type = 'employee.created' as const;
  constructor(
    public readonly employeeId: number,
    public readonly orgFunctionId: number | undefined,
    public readonly createdBy: number,
  ) {}
}

// Outbox ga yozish (tx ichida):
await tx.insert(domainEvents).values({
  type: 'employee.created',
  payload: JSON.stringify({ employeeId: emp.id, orgFunctionId: dto.orgFunctionId }),
  status: 'pending',
  createdAt: new Date(),
});

// Listener:
@OnEvent('employee.created')
async handleEmployeeCreated(event: EmployeeCreatedEvent): Promise<void> {
  // Org notification, LMS enrollment va h.k.
}
```

---

## § 13. DUPLIKAT TEKSHIRUV SKRIPTLARI

```bash
# Jadval duplikatini tekshirish:
node _audit/q.cjs "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name LIKE '%employee%'
  ORDER BY 1"

# Drizzle schema duplikatini tekshirish:
grep -rn "pgTable('hr_leave_requests'" lib/db/src/schema/

# Kanonik jadval foydalanishni tekshirish (to'g'ri FK):
node _audit/q.cjs "
  SELECT tc.table_name, kcu.column_name, ccu.table_name AS references_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name
  WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='hr_employees'
  ORDER BY 1"

# Schema dup ratchet:
node scripts/check-schema-dups.js

# VIEW vs jadval tekshirish:
node _audit/q.cjs "
  SELECT table_name, table_type FROM information_schema.tables
  WHERE table_schema='public' AND table_name IN ('sd_sales_orders','current_stock','mes_shift_handovers')
  ORDER BY 1"
```

---

## § 14. TEZKOR TEKSHIRUV (Pre-commit)

```bash
# Har commit'dan oldin:
npx tsc -p apps/api/tsconfig.json --noEmit          # BE typecheck
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit  # FE typecheck
node scripts/check-design-tokens.mjs                # 0 raw color
node scripts/check-sidebar-routes.mjs               # 0 broken route
node scripts/i18n-status.mjs                        # 0 missing key
node scripts/check-schema-dups.js                   # dup ratchet

# Golden thread (SD→PP→MES→QC→WMS→FIN):
node scripts/golden-thread-chain-proof.cjs
```

---

## § 15. TARIXIY XATOLAR KATALOGI

> **Maqsad:** EuroPrint ERP ning ~8 oylik tarixida aniqlangan barcha xato naqshlari.
> Har xato: **kod** · muammo · qoida · tekshiruv · ❌/✅ misol.
> Bu ro'yxat qoidadir — har yangi agent bu xatolarni QAYTA qilmasligi shart.
> Manba: 80+ agent audit sessiyasi (2026-05-14 — 2026-06-18).

---

### 15.1 XAVFSIZLIK XATOLARI (SEC)

---

**SEC-1 — Fail-open RolesGuard: `@UseGuards` bor, `@Roles` yo'q**

- **Muammo:** `JwtAuthGuard` foydalanuvchini tasdiqlaydi (autentifikatsiya), lekin `@Roles()` dekoratori bo'lmasa `RolesGuard` hamma ruxsat beradi. 27 menejer barcha xodimlarning maxfiy PIP/eNPS ma'lumotlarini o'qidi.
- **Qoida:** Har himoyalangan endpoint da ikkalasi ham bo'lishi SHART: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('hr_manager', 'super_admin')`. `JwtAuthGuard` yolg'iz yetarli emas.
- **Tekshiruv:** `grep -rn "@UseGuards" apps/api/src/ | grep -v "@Roles"` — natija bo'sh bo'lishi kerak.
- ❌ XATO: `@UseGuards(JwtAuthGuard, RolesGuard)` — `@Roles` dekoratori yo'q → hamma kiradi.
- ✅ TO'G'RI: `@Roles('hr_manager', 'super_admin')` + `@UseGuards(JwtAuthGuard, RolesGuard)`.

---

**SEC-2 — `@Public()` dekoratori asossiz ishlatilgan**

- **Muammo:** IoT tablet va storage endpointlari `@Public()` bilan belgilangan edi — autentifikatsiyasiz 200 OK qaytardi. Bu High darajali zaiflik.
- **Qoida:** `@Public()` faqat yozma asoslash bilan: `// PUBLIC: IoT terminal — IP whitelist bilan himoyalangan`. Yozuvsiz `@Public()` = taqiq.
- **Tekshiruv:** `grep -rn "@Public()" apps/api/src/ | grep -v "// PUBLIC:"`.
- ❌ XATO: `@Public() @Get('worker-schedule')` — izoh yo'q, hech qanday himoya yo'q.
- ✅ TO'G'RI: `@Public() // PUBLIC: IoT tablet — TabletTokenGuard + IP whitelist @Get('worker-schedule')`.

---

**SEC-3 — Hardcoded parol fallback**

- **Muammo:** `ADMIN_SEED_PASSWORD ?? 'Admin123!'` — env o'rnatilmasa `Admin123!` ishlatilgan. Production da ham ishlashi mumkin edi.
- **Qoida:** Env yo'q bo'lsa `throw new Error('ADMIN_SEED_PASSWORD env missing')`. Hech qachon hardcoded fallback parol.
- **Tekshiruv:** `grep -rn "'Admin\|'admin\|'password\|'secret\|'123" apps/api/src/ --include="*.ts"`.
- ❌ XATO: `const pw = process.env.ADMIN_SEED_PASSWORD ?? 'Admin123!';`
- ✅ TO'G'RI: `const pw = process.env.ADMIN_SEED_PASSWORD; if (!pw) throw new Error('ADMIN_SEED_PASSWORD env missing');`

---

**SEC-4 — `sql.raw(o'zgaruvchi)` — SQL Injection xavfi**

- **Muammo:** `sql.raw(rawQuery)` va `sql.raw(q)` foydalanuvchidan kelgan qiymat bilan ishlatilingan. Bu SQL injection ni to'g'ridan imkon beradi.
- **Qoida:** `sql.raw()` faqat **literal** DDL/string bilan — hech qachon o'zgaruvchi bilan. Dinamik qiymatlar uchun Drizzle parametrli sintaksis: `` sql`WHERE id = ${id}` ``.
- **Tekshiruv:** `grep -rn "sql\.raw(" apps/api/src/ lib/db/src/` — har natijani ko'zdan kechir.
- ❌ XATO: `db.execute(sql.raw(userInputQuery))`
- ✅ TO'G'RI: `` db.execute(sql`SELECT * FROM users WHERE id = ${userId}`) ``

---

**SEC-5 — JWT refresh token noto'g'ri secret bilan tekshirilgan**

- **Muammo:** `jwtService.verify(body.refreshToken)` — `JWT_SECRET` (access token uchun) bilan tekshirilgan. Refresh token uchun `JWT_REFRESH_SECRET` alohida bo'lishi kerak.
- **Qoida:** Access token → `JWT_SECRET`. Refresh token → `JWT_REFRESH_SECRET`. `ConfigService.getOrThrow('JWT_REFRESH_SECRET')` ishlatilsin.
- **Tekshiruv:** Auth controller + refresh handler da secret alohida ekanini tekshir.
- ❌ XATO: `this.jwtService.verify(refreshToken)` — default (access) secret ishlatiladi.
- ✅ TO'G'RI: `this.jwtService.verify(refreshToken, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') })`

---

**SEC-6 — JWT `algorithms` pinlanmagan**

- **Muammo:** Algoritm ko'rsatilmagan — token almashtirish hujumi mumkin (algorithm confusion).
- **Qoida:** `JwtModule.registerAsync` da `algorithms: ['HS256']` explicit ko'rsatilsin.
- ✅ TO'G'RI: `JwtModule.registerAsync({ useFactory: (c) => ({ secret: c.getOrThrow('JWT_SECRET'), signOptions: { expiresIn: '15m', algorithm: 'HS256' }, verifyOptions: { algorithms: ['HS256'] } }) })`

---

**SEC-7 — OTP per-sessiya cheklov yo'q**

- **Muammo:** OTP brute-force uchun faqat IP bo'yicha rate-limit bor. Bir sessiyada cheksiz urinish mumkin.
- **Qoida:** `otp_sessions.attempts` ustuni qo'shilsin. Maksimum 5 urinishdan so'ng sessiya o'chirilsin.
- **Tekshiruv:** `otp_sessions` jadvalida `attempts INTEGER DEFAULT 0` ustuni bor-yo'qligini tekshir.

---

**SEC-8 — Log fayllari `.gitignore` da to'liq emas**

- **Muammo:** `.gitignore` faqat `*.log` ni tutadi. `backend.log.prev3`, `backend.log.2026-06-01` kabi rotatsiya fayllari tushib qolishi mumkin. JWT token va maxfiy ma'lumotlar log da bo'lishi mumkin.
- **Qoida:** `.gitignore` da: `backend.log*` + `*.log.*` + `logs/` + `*.log` — to'rt qator.
- **Tekshiruv:** `grep -n "\.log" .gitignore` — barcha variant bor ekanini tekshir.

---

**SEC-9 — Migration ichida test paroli hash**

- **Muammo:** `org-structure-sync.sql` da `test123` ning bcrypt hash i bor. Migration faqat tuzilma uchun — parol hech qachon SQL da bo'lmasin.
- **Qoida:** Parol → faqat seed script + env orqali. Migration SQL da hash, parol, token bo'lmasin.
- **Tekshiruv:** `grep -rn "bcrypt\|password\|hash" docs/migration/*.sql`.

---

### 15.2 SOXTA DATA XATOLARI (FAKE)

---

**FAKE-1 — `return { ok: true }` — DB ga yozilmaydi**

- **Muammo:** Controller `{ ok: true }` qaytaradi, ammo hech qanday DB operatsiyasi bajarmaydi. Foydalanuvchi ma'lumot saqlandı deb o'ylaydi.
- **Qoida:** Ma'lumotlar saqlanmagan → `501 NOT_IMPLEMENTED`. `{ ok: true }` soxta muvaffaqiyat = taqiq.
- **Tekshiruv:** `grep -rn "return { ok: true }" apps/api/src/` — har natijani tekshir.
- ❌ XATO: `async saveData(@Body() dto) { return { ok: true }; }`
- ✅ TO'G'RI: `throw new HttpException('Not implemented', 501);`

---

**FAKE-2 — `return { data: [] }` — hardcoded bo'sh massiv**

- **Muammo:** Endpoint `{ data: [] }` qaytaradi — foydalanuvchi jadval bo'sh deb o'ylaydi, aslida query yozilmagan.
- **Qoida:** Real DB query yo'q bo'lsa → `501`. Bo'sh massiv faqat DB query natijasi bo'lishi mumkin.
- **Tekshiruv:** `grep -rn "return { data: \[\]" apps/api/src/`.
- ❌ XATO: `async getAll() { return { data: [], total: 0 }; }`
- ✅ TO'G'RI: `const result = await this.service.findAll(dto); if (!result.ok) throw ...; return result.value;`

---

**FAKE-3 — Butun controller stub, FE ishlayotgandek ko'rinadi**

- **Muammo:** `FinanceExtendedPayrollController` ning 7 ta route si `notImplemented()` qaytarardi. TypeScript tsc PASS bo'ldi chunki URL string tekshirilmaydi. FE Calculate, Run, Approve tugmalari ishlayotgandek ko'rindi.
- **Qoida:** tsc 0 ≠ feature ishlayapti. Har feature uchun round-trip isboti shart: kirit → saqla → qayta och → ko'rin.
- **Tekshiruv:** Har yangi endpoint uchun: `curl -X POST http://localhost:3030/api/[path] -H "Authorization: Bearer [token]" -d '{...}'` — 200 va real DB yozuvi.

---

**FAKE-4 — `return {} as unknown as T` — type-safe soxta**

- **Muammo:** `as unknown as ReturnType` pattern — TypeScript da ishlaydi, runtime da crash.
- **Qoida:** `as unknown` faqat test mock larda ruxsat. Production kodda `as unknown as T` = taqiq.
- **Tekshiruv:** `grep -rn "as unknown as" apps/api/src/ --include="*.ts"` — production fayllarida 0 bo'lishi kerak.

---

**FAKE-5 — Mock ob'ekt production kodida**

- **Muammo:** `mockQueueStats`, `mockDashboardData` nomlari production service da qoldirilgan. Real ma'lumot o'rniga statik ob'ekt qaytarilgan.
- **Qoida:** `mock`, `stub`, `dummy`, `fake` nomli har qanday ob'ekt/funksiya production build da bo'lmasin. Faqat `*.spec.ts` va `*.test.ts` da ruxsat.
- **Tekshiruv:** `grep -rn "mock\|stub\|dummy\|fake" apps/api/src/ --include="*.ts" | grep -v "\.spec\|\.test"`.

---

**FAKE-6 — MES→QC handoff no-op stub**

- **Muammo:** `qc/mes-completed.listener.ts` event ni qabul qiladi, lekin `CreateInspectionCommand` handler yo'q. Event yuboriladi, QC tekshiruvi hech qachon yaratilmaydi.
- **Qoida:** Listener yozilmagan bo'lsa event publish qilinmasin YOKI stub handler `501` qaytarsin va log qilsin.
- ❌ XATO: `@OnEvent('mes.order.completed') async handle(e) { this.logger.log('received'); }` — hech ish qilmaydi.
- ✅ TO'G'RI: Ya handler to'liq yoziladi, ya event publish `TODO` bilan belgilanadi va `@OnEvent` qo'shilmaydi.

---

**FAKE-7 — IoT anomaly handler pure `console.log`**

- **Muammo:** `anomaly-detected.handler.ts` faqat `console.log('anomaly received')` qiladi. Hech qanday ogohlantirish, DB yozuvi, yoki amal yo'q.
- **Qoida:** Handler logikasi yo'q bo'lsa — `@OnEvent` ro'yxatdan o'chirsin. "Ushlab qolgan" deb ko'rinadigan lekin hech narsa qilmaydigan handler = FAKE.
- **Tekshiruv:** `grep -rn "@OnEvent" apps/api/src/` — har listenerning tanasini ko'r, faqat `logger` bo'lsa tekshir.

---

**FAKE-8 — 13+ event: yuboriladim, hech kim olmaydi (zero-listener)**

- **Muammo:** `DealLost`, `StockUpdated`, `3×ApprovalGranted`, `stock.critical`, `iot.anomaly`, `crm.hot_leads_found` va boshqalar — `eventEmitter.emit()` chaqiriladi, lekin `@OnEvent(...)` listener yo'q.
- **Qoida:** Event publish qilishdan OLDIN: `grep -rn "@OnEvent('[event_name]')" apps/api/src/` — kamida bitta natija bo'lishi shart.
- **Tekshiruv:** `grep -rn "eventEmitter\.emit\|this\.eventEmitter\.emit" apps/api/src/` — har event nomi uchun listener borligini tekshir.

---

**FAKE-9 — Outbox ishlaydi, `domain_events` da 0 yozuv**

- **Muammo:** Outbox relay 10 sekundda ishlaydi. Lekin `domain_events` jadvalida hech qachon yozuv bo'lmagan — chunki hech bir service `domain_events` ga yozgani yo'q.
- **Qoida:** Outbox faqat `domain_events` ga real yozuv borligida yoqilsin. `domain_events` bo'sh bo'lsa cron isrof.
- **Tekshiruv:** `node _audit/q.cjs "SELECT COUNT(*) FROM domain_events"` — 0 bo'lsa outbox relay o'chirilsin.

---

### 15.3 IKKI-DUNYO XATOLARI (TWO)

---

**TWO-1 — `sales_orders` vs `orders`: ikkita parallel buyurtma jadvali**

- **Muammo:** `sales_orders` (int PK, SD moduli) va `orders` (boshqa asos, PP moduli) — hech qanday FK/event aloqasi yo'q. PP `OrderCreatedEvent` ni tinglamaydi. SD buyurtmasi PP ga hech qachon yetib bormagan.
- **Qoida:** Kanonik jadval: `sales_orders`. `orders` → ehtiyotkorlik bilan tekshir, kerak bo'lsa `sales_orders` ga FK qo'sh. Yangi jadval yaratishdan OLDIN "bu tushuncha uchun jadval bormi?" tekshiruvi MAJBURIY.
- **Tekshiruv:** `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%order%'"`.

---

**TWO-2 — UUID vs INT PK mismatch: silent bo'sh JOIN**

- **Muammo:** `crm_deals.lead_id UUID` joined `crm_leads.id INT` — type mismatch tufayli join doim bo'sh natija beradi. Hech qanday xato yo'q, faqat 0 qator. 
- **Qoida:** JOIN yozishdan OLDIN: ikki jadvalning bog'lanuvchi ustunlari tiplarini tekshir. `UUID ↔ INT` mismatch = silent data loss.
- **Tekshiruv:** `node _audit/q.cjs "SELECT a.column_name, a.data_type, b.column_name, b.data_type FROM information_schema.columns a JOIN information_schema.columns b ON a.column_name LIKE '%_id' WHERE a.table_name='crm_deals' AND b.table_name='crm_leads'"`.
- ❌ XATO: `JOIN crm_leads ON crm_deals.lead_id = crm_leads.id` — UUID ↔ INT, doim 0 qator.
- ✅ TO'G'RI: Avval type ni moslashtir yoki explicit cast + comment: `crm_deals.lead_id::int` (agar xavfsiz bo'lsa).

---

**TWO-3 — `gl_journal_entries` + `gl_lines` vs `entries`: ikkita GL model**

- **Muammo:** `gl_journal_entries` + `gl_lines` jadvallari mavjud ammo 0 qator. Haqiqiy GL yozuvlari `entries` jadvalga yoziladi. Ikki parallel model = data mos emas.
- **Qoida:** GL posting FAQAT `entries` jadvaliga. `gl_journal_entries` va `gl_lines` ga TEGMA (SAP#76). Bu jadvallar eski arxitektura qoldig'i.
- **Tekshiruv:** `grep -rn "gl_journal_entries\|gl_lines" apps/api/src/` — agar INSERT/UPDATE bo'lsa — STOP, egadan ruxsat ol.

---

**TWO-4 — `warehouse_stock` vs `stocks` vs `wms_stock`: uchta stock jadvali**

- **Muammo:** `warehouse_stock` (kanonik, UI ishlatadi), `stocks` (WMS `receiveFg` shu yozgan, lekin UI da ko'rinmagan), `wms_stock` (deprecated stub). WMS yozuvi ko'rinmagan — UI da ombor doim bo'sh ko'ringani shu sabab.
- **Qoida:** Stock yozuvi FAQAT `warehouse_stock` ga. `stocks` va `wms_stock` → tegma.
- **Tekshiruv:** `grep -rn "\.stocks\|'stocks'" lib/db/src/schema/ apps/api/src/` — foydalanish bo'lsa tekshir.

---

**TWO-5 — `current_stock` VIEW, TABLE emas**

- **Muammo:** Agent `current_stock` ga `CREATE UNIQUE INDEX` tavsiya qildi. Aslida `current_stock` — `warehouse_stock` ustidagi VIEW. INDEX VIEW ga qo'shilmaydi.
- **Qoida:** Yangi jadval yoki INDEX yaratishdan OLDIN VIEW yoki TABLE ekanini tekshir: `SELECT table_type FROM information_schema.tables WHERE table_name='[nom]'`.
- **Tekshiruv:** `node _audit/q.cjs "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('current_stock','sd_sales_orders','mes_shift_handovers')"`.

---

### 15.4 DB / SCHEMA XATOLARI (DB)

---

**DB-1 — VIEW ga `ALTER TABLE ADD COLUMN` — crash**

- **Muammo:** `mes_shift_handovers` VIEW edi. `ALTER TABLE mes_shift_handovers ADD COLUMN ...` — PostgreSQL xato berdi, deployment to'xtadi.
- **Qoida:** Har `ALTER TABLE` dan OLDIN: `SELECT table_type FROM information_schema.tables WHERE table_name='...'` — `BASE TABLE` bo'lsa ALTER ruxsat, `VIEW` bo'lsa ALTER yozma.
- ❌ XATO: `ALTER TABLE mes_shift_handovers ADD COLUMN notes TEXT;` — VIEW ga ALTER.
- ✅ TO'G'RI: VIEW asosiy jadvalga ALTER: `ALTER TABLE shift_handovers ADD COLUMN notes TEXT;`

---

**DB-2 — Noto'g'ri ustun nomi → query crash**

- **Muammo:** `mes-shifts-stats` query `incoming_supervisor` ustunini ishlatgan. Real ustun nomi `received_by`. 500 xatosi.
- **Qoida:** Har yangi query yozishdan OLDIN ustun nomlarini live DB dan tekshir: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='[jadval]' ORDER BY 1"`.
- **Tekshiruv:** Har query → ustun nomlari `information_schema.columns` bilan solishtir.

---

**DB-3 — `::text` cast bilan JOIN → crash yoki bo'sh natija**

- **Muammo:** `cameras.id::text = camera_events.camera_id` — ikkalasi ham INT. `::text` cast keraksiz va INDEX ni o'chiradi.
- **Qoida:** Drizzle ORM type-safe join ishlatilsin: `eq(table1.id, table2.foreignId)`. `::text` cast faqat hujjatlangan sababda.
- ❌ XATO: `sql\`cameras.id::text = camera_events.camera_id\``
- ✅ TO'G'RI: `eq(cameras.id, cameraEvents.cameraId)` — Drizzle type-safe.

---

**DB-4 — `material_card_id` vs `material_id`: 35+ jadvalda drift**

- **Muammo:** Eski jadvallar `material_card_id` ishlatgan. Kanonik nom `material_id` ga o'zgartirilgan. 35+ jadvalda drift edi — JOIN lar silent fail qilar edi.
- **Qoida:** Referenced jadval uchun bitta kanonik FK nomi: `material_cards` → `material_id`. `material_card_id` ishlatilsa — STOP, to'g'ri nom bilan almashtir.
- **Tekshiruv:** `grep -rn "material_card_id" lib/db/src/schema/ apps/api/src/` — agar topilsa, `material_id` bilan almashtir.

---

**DB-5 — `delivery_date TIMESTAMPTZ` ga regex `~` operatori → crash**

- **Muammo:** PP MPS service `delivery_date` ga `~ '^[0-9]...'` regex ishlatar edi. PostgreSQL: `operator does not exist: timestamptz ~ unknown`. Deployment crash.
- **Qoida:** Har operatorda type mosligini tekshir. `TIMESTAMPTZ` → `>`, `<`, `BETWEEN`, `::date`. Regex faqat `VARCHAR`/`TEXT`.
- ❌ XATO: `sql\`delivery_date ~ '^2026'\``
- ✅ TO'G'RI: `sql\`delivery_date::date >= '2026-01-01'\``

---

**DB-6 — 104 ta `NOT NULL` ustunda DB default yo'q**

- **Muammo:** Drizzle schema da `.default(...)` bor, lekin DB da `DEFAULT` yo'q (migration da `SET DEFAULT` yozilmagan). Insert da `NOT NULL` violation — 503.
- **Qoida:** Drizzle `.default(val)` va DB `DEFAULT val` birga bo'lishi shart. Migration: `ALTER TABLE t ALTER COLUMN c SET DEFAULT val;`.
- **Tekshiruv:** `node _audit/q.cjs "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND is_nullable='NO' AND column_default IS NULL AND column_name NOT IN ('id','created_at') ORDER BY 1,2" | head -20`.

---

**DB-7 — `NOT NULL` ustun uchun fallback zanjiri yo'q**

- **Muammo:** `crm_deals.assigned_by_id NOT NULL` — lead convert da `assigned_by_id` null kelib qoldi → 500.
- **Qoida:** `NOT NULL` ustunlar uchun fallback zanjiri majburiy: `command.assignedById ?? lead.ownerId ?? adminId`.
- ❌ XATO: `assigned_by_id: command.userId` — null bo'lsa crash.
- ✅ TO'G'RI: `assigned_by_id: command.userId ?? deal.owner_id ?? this.defaultAdminId`.

---

**DB-8 — Drizzle stub ustun nomi noto'g'ri → upsert silent fail**

- **Muammo:** `schema-ext-a-1.ts` stub da `material_card_id` deb yozilgan. Real DB ustuni `material_id`. Drizzle upsert `WHERE material_card_id = X` — ustun yo'q, hech narsa yangilanmaydi, xato ham yo'q.
- **Qoida:** Drizzle stub = live DB schema bilan EXACT match. Har ustun nomini `information_schema.columns` dan olib yoz.
- **Tekshiruv:** Yangi Drizzle schema yozgandan keyin: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='[jadval]'"` — har ustun borligini solishtir.

---

**DB-9 — Drizzle da jadval bor, DB da yo'q → cron flood**

- **Muammo:** `AiMesMonitorService` har 30 sekundda `mes_telemetry` ga so'rov qildi. Jadval Drizzle da bor, DB da yo'q. 6900+ xato log to'pladi. Server resurs isrof.
- **Qoida:** Har cron/service boshlashdan OLDIN: `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name='[jadval]'"` — mavjud bo'lsa ishga tushirsin, yo'q bo'lsa migration kutsin.
- **Tekshiruv:** `grep -rn "setInterval\|@Cron" apps/api/src/` — har cron, ishlatiladigan jadvalini tekshir.

---

**DB-10 — Drizzle-only jadvallar: DB da yo'q, runtime crash**

- **Muammo:** `payroll_calculations`, `posTransactions` — Drizzle schema da bor, live DB da yo'q. Ular import qilinsa runtime `relation does not exist` xatosi.
- **Qoida:** Har Drizzle table import qilishdan OLDIN `information_schema.tables` da bor-yo'qligini tekshir. Drizzle-only = migration kerak.
- **Tekshiruv:** `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_schema='public'" | sort > /tmp/db_tables.txt && grep "pgTable" lib/db/src/schema/*.ts | sed "s/.*pgTable('\([^']*\)'.*/\1/" | sort > /tmp/drizzle_tables.txt && comm -23 /tmp/drizzle_tables.txt /tmp/db_tables.txt`.

---

### 15.5 BACKEND / API XATOLARI (API)

---

**API-1 — GL journal multi-leg, transaction yo'q → orphan entry**

- **Muammo:** `createJournalEntry` — for-loop ichida har leg alohida INSERT. Leg 2 muvaffaqiyatsiz bo'lsa, leg 1 orphan qoladi. GL balans buziladi.
- **Qoida:** Barcha GL legs BITTA `db.transaction()` ichida. Bitta leg muvaffaqiyatsiz = hammasi rollback.
- ❌ XATO: `for (const leg of legs) { await db.insert(entries).values(leg); }` — atomic emas.
- ✅ TO'G'RI: `await db.transaction(async (tx) => { for (const leg of legs) { await tx.insert(entries).values(leg); } });`

---

**API-2 — POS sync: `unit_of_measure` vs `unit` ustun nomi drift**

- **Muammo:** `pos-wms-sync.service.ts` `unit_of_measure` ustunini ishlatdi. Real ustun nomi `unit`. Barcha warehouse transactions yozilmadi.
- **Qoida:** Har INSERT/UPDATE/SELECT ustun nomi live DB schema bilan tekshirilsin. `information_schema.columns` dan ko'r.
- ❌ XATO: `await db.insert(warehouseTransactions).values({ unit_of_measure: dto.unit })`
- ✅ TO'G'RI: `await db.insert(warehouseTransactions).values({ unit: dto.unit })`

---

**API-3 — Hardcoded `'kirim'` transaction type**

- **Muammo:** `pos-wms-sync.service.ts` `transaction_type = 'kirim'` hardcoded edi. `chiqim` ham `kirim` sifatida yozilardi.
- **Qoida:** Status/type qiymatlar hech qachon hardcoded string emas. `MOVEMENT_TYPE_MAP: Record<string, string>` yoki `enum` ishlatilsin.
- ❌ XATO: `transaction_type: 'kirim'` — doim bir xil.
- ✅ TO'G'RI: `const MOVEMENT_TYPE_MAP = { sell: 'chiqim', receive: 'kirim' }; transaction_type: MOVEMENT_TYPE_MAP[event.type]`

---

**API-4 — `@Param('id')` null tekshirilmaydi → 200 + null**

- **Muammo:** `findById(id)` — id null yoki undefined bo'lsa, query `WHERE id = null` → 0 qator → `null` qaytaradi. Frontend crash.
- **Qoida:** `if (!result || !result.ok) throw new NotFoundException(\`${id} topilmadi\`)`.
- ❌ XATO: `return await this.service.findById(id);` — result null bo'lsa frontend crash.
- ✅ TO'G'RI: `const r = await this.service.findById(id); if (!r.ok) throw new NotFoundException(); return r.value;`

---

**API-5 — FE URL ≠ BE endpoint → 404 (Windows `find` silent fail)**

- **Muammo:** `check-fe-api-urls.mjs` script Windows da `execSync('find ...')` bilan barcha URL PASS deb hisobot qildi. Aslida `find` cmd.exe da boshqacha ishlaydi — natija to'g'ri emas. `POST /api/hr/payroll/run` endpoint umuman yo'q edi.
- **Qoida:** `check-fe-api-urls.mjs` → `execSync('find')` o'rniga Node.js native `fs.readdirSync` yoki `glob` package ishlatilsin. Windows compatibility majburiy.

---

**API-6 — Service to'g'ridan `db.*` chaqiradi (repository layer aylanib o'tiladi)**

- **Muammo:** `legacy.service.ts`, `financial-reports-query.service.ts`, `ai-alerts.service.ts` — `db.select()`, `db.insert()` to'g'ridan. Repository pattern buzilgan.
- **Qoida:** Service faqat repository orqali DB bilan ishlaydi. `db.*` faqat `*.repository.ts` fayllarida.
- **Tekshiruv:** `grep -rn "db\.select\|db\.insert\|db\.update\|db\.delete" apps/api/src/ --include="*.service.ts"` — 0 bo'lishi kerak.

---

**API-7 — Controller ichida biznes logika**

- **Muammo:** `wms-catalog.controller.ts` (ABC hisob), `hr-payroll.controller.ts` (INPS/NDFL), `crm-ai-extended.controller.ts` (discount hisob) — barcha logika controller da.
- **Qoida:** Controller = faqat transport (parse → service → format response). Hisob-kitob, biznes qoidalar → service yoki domain. Repository → faqat DB.
- ❌ XATO: `@Get() async abc() { const items = await this.db.select(...); return items.sort((a,b) => b.revenue - a.revenue).slice(0, 10); }`
- ✅ TO'G'RI: `@Get() async abc(@Query() q) { const r = await this.service.getAbcReport(q); if (!r.ok) throw ...; return r.value; }`

---

**API-8 — `queryKey` mismatch: yangi yozuv ko'rinmaydi**

- **Muammo:** `GLDocuments.tsx` da `invalidateQueries(["/api/finance/gl/documents"])` — lekin `useQuery` key boshqa edi. Yangi hujjat saqlangandan keyin ro'yxat yangilanmaydi.
- **Qoida:** `invalidateQueries` key = `useQuery` key bilan EXACT match. Bir joyda konstant sifatida chiqarilsin: `const GL_DOCS_KEY = ['gl', 'documents'];`.
- ❌ XATO: `useQuery({ queryKey: ['glDocs'] })` + `invalidateQueries(['/api/finance/gl/documents'])` — ikki xil format.
- ✅ TO'G'RI: `const KEY = ['gl', 'docs']; useQuery({ queryKey: KEY })` + `invalidateQueries({ queryKey: KEY })`.

---

**API-9 — Magic number: biznes qoidalar hardcoded**

- **Muammo:** `0.5 + 0.3 + 0.2` (KPI og'irliklari), `> 180` (churn kunlar), `* 0.05` (komissiya), `/ 12` (amortizatsiya). Biznes qoidalar o'zgarsa — hamma joyni topib o'zgartirish kerak.
- **Qoida:** `business.constants.ts` faylida nom bilan: `KPI_WEIGHT_SALES = 0.5`, `CHURN_DAYS_THRESHOLD = 180`. Sehrli raqam = taqiq.
- **Tekshiruv:** `grep -rn "0\.08\|0\.12\|1120000\|0\.85\|0\.5\|0\.3" apps/api/src/ --include="*.ts"` — har topilganni konstantga o'tkazish kerakmi tekshir.

---

### 15.6 EVENT / XABAR XATOLARI (EVT)

---

**EVT-1 — CQRS `EventsHandler` va `EventEmitter2` ko'prigi yo'q**

- **Muammo:** `pos-movement-status.service.ts` `eventEmitter.emit('pos.movement.completed', ...)` chaqirdi. WMS va GL `@EventsHandler(PosMovementCompletedEvent)` bilan kutdi — lekin `EventEmitter2` string event ni CQRS `@EventsHandler` ga bermaydi.
- **Qoida:** `EventEmitter2.emit()` va `CommandBus/EventBus.publish()` alohida kanallar. Agar CQRS handler kerak bo'lsa, `this.eventBus.publish(new PosMovementCompletedEvent(...))` ishlatilsin.
- ❌ XATO: `this.eventEmitter.emit('pos.movement.completed', data)` + `@EventsHandler(PosMovementCompletedEvent)` — hech qachon yetib bormaydi.
- ✅ TO'G'RI: `this.eventBus.publish(new PosMovementCompletedEvent(data))` + `@EventsHandler(PosMovementCompletedEvent)`.

---

**EVT-2 — Double-write: bir jadvalni ikki mustaqil yozuvchi**

- **Muammo:** `warehouse_stock` ga: (1) inline writer, (2) compat writer, (3) aktivlashtirilgan listener — hammasi parallel yozdi. Race condition, noto'g'ri qiymat.
- **Qoida:** Har jadvalda BITTA yozuvchi. Yangisini aktivlashtirishdan OLDIN mavjud writerlarni sanab chiq va o'chir.
- **Tekshiruv:** `grep -rn "\.insert(warehouseStock\|\.update(warehouseStock" apps/api/src/` — bir joy bo'lishi kerak.

---

**EVT-3 — Backbone link yo'q: SD→PP o'tish hech qachon ishlamagan**

- **Muammo:** Butun PP, MES, QC zanjiri `SalesOrderConfirmedEvent` ni kutgan. Lekin SD module shu eventni hech qachon publish qilmagan. Zanjirning birinchi halqasi uzilgan — barcha keyingi modullar "ishlaydi" lekin aslida hech narsa olmagan.
- **Qoida:** Backbone link BIRINCHI quriladi. Downstream modullar backbone ishlaganini isbotlash bilan yoziladi.
- **Tekshiruv:** `grep -rn "SalesOrderConfirmedEvent\|OrderConfirmed" apps/api/src/` — emit qilinishi + kamida bitta listener bo'lishi kerak.

---

### 15.7 FRONTEND / UI XATOLARI (FE)

---

**FE-1 — `useQuery` loading holati yo'q → `undefined.map` crash**

- **Muammo:** `const { data } = useQuery(...)` → `<Table data={data} />` — sahifa yuklanganda `data` undefined. `data.map(...)` crash.
- **Qoida:** Har `useQuery` da: `isLoading` → Skeleton, `isError` → EPErrorState, `data ?? []` default.
- ❌ XATO: `const { data } = useQuery(...); return <Table rows={data} />;`
- ✅ TO'G'RI: `const { data, isLoading, isError } = useQuery(...); if (isLoading) return <EPSkeletonTable />; if (isError) return <EPErrorState />; return <Table rows={data?.data ?? []} />;`

---

**FE-2 — `useMutation` `onError` handler yo'q → silent fail**

- **Muammo:** Delete mutation muvaffaqiyatsiz bo'lsa — foydalanuvchi bilmaydi. Toast ham yo'q, reload ham yo'q.
- **Qoida:** Har mutation da: `onSuccess: () => { queryClient.invalidateQueries(...); toast({...}); }` + `onError: () => { toast({ variant: 'destructive', ... }); }`.
- **Tekshiruv:** `grep -B2 -A10 "useMutation" artifacts/erp-dashboard/src/ -r | grep -L "onError"` — har mutation `onError` borligini tekshir.

---

**FE-3 — Delete tugmasi tasdiqlashsiz to'g'ridan mutation**

- **Muammo:** O'chirish tugmasi bosilganda darhol `deleteMutation.mutate(id)` — tasdiqlash so'ralmaydi. Tasodifiy o'chirishlar bo'lgan.
- **Qoida:** Har delete uchun `ConfirmDialog` yoki `AlertDialog` majburiy: "O'chirishni tasdiqlaysizmi?"
- ❌ XATO: `<Button onClick={() => deleteMutation.mutate(id)}>O'chir</Button>`
- ✅ TO'G'RI: `<ConfirmDialog onConfirm={() => deleteMutation.mutate(id)} trigger={<Button>O'chir</Button>} />`

---

**FE-4 — Xom rang (raw color): design token ishlatilmaydi**

- **Muammo:** `style={{ color: '#fff' }}`, `text-[#94a3b8]`, `bg-[#FF902F]` — hardcoded. Design token o'zgarsa — hamma joyni topib o'zgartirish kerak.
- **Qoida:** Faqat `var(--ep-*)` va Tailwind semantic. Xom HEX/RGB = taqiq.
- **Tekshiruv:** `node scripts/check-design-tokens.mjs` — 0 bo'lishi kerak.
- ❌ XATO: `<div style={{ backgroundColor: '#FF902F' }}>`
- ✅ TO'G'RI: `<div style={{ backgroundColor: 'var(--ep-primary)' }}>` yoki `<div className="bg-primary">`

---

**FE-5 — Brand rang ko'k deb taxmin qilingan (aslida ORANGE)**

- **Muammo:** Agent "EuroPrint brand rangini ko'k (#235D9F) ishlatamiz" dedi. EuroPrint brand rang ORANGE `#FF902F`. Barcha UI element noto'g'ri rang bilan bo'lgan.
- **Qoida:** `--ep-primary: #FF902F` — ORANGE. Har rang ishlatishdan oldin `DIZAYN_QOIDALARI.md §1.1` tekshirilsin.
- **Tekshiruv:** `grep -rn "235D9F\|#2563EB\|#3B82F6" artifacts/erp-dashboard/src/` — topilsa — STOP, `var(--ep-primary)` bilan almashtir.

---

**FE-6 — AppShell double-padding: sahifa root noto'g'ri**

- **Muammo:** `AppShellModern.tsx` allaqachon `p-4 lg:p-6` + `overflowY:auto` beradi. Ba'zi sahifalar o'ziga ham `flex h-full p-5 overflow-auto` qo'shgan → ikki marta padding + scroll.
- **Qoida:** Sahifa root FAQAT `<div className="space-y-6">`. `flex h-full overflow-auto` yoki `p-*` TAQIQ sahifa root da.
- ❌ XATO: `return <div className="flex h-full flex-col overflow-auto p-6"><PageContent /></div>`
- ✅ TO'G'RI: `return <div className="space-y-6"><EPPageHeader ... /><MainContent /></div>`

---

**FE-7 — Sahifa tekshiruvida co-located fayllar o'tkazib yuborilgan**

- **Muammo:** Audit faqat `<PageName>.tsx` fayllarini tekshirdi. `<PageName>Sections/`, `<PageName>Tabs/`, `<PageName>Charts/` papkalaridagi komponentlar tekshirilmadi. Bu papkalarda xatolar qoldi.
- **Qoida:** Har sahifa audit da: `find artifacts/erp-dashboard/src/pages -name "*Page.tsx" -o -name "*Sections*" -o -name "*Tabs*" -o -name "*Charts*"` — hammasi tekshirilsin.

---

**FE-8 — Sentry dev muhitda ishga tushiriladi → 403 spam**

- **Muammo:** `VITE_SENTRY_DSN` local `.env` da set qilingan → Sentry dev da inits → har console xatosi Sentry ga ketadi.
- **Qoida:** `main.tsx` da `if (import.meta.env.PROD)` tekshiruvi bilan Sentry init qilinsin.
- ❌ XATO: `Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });`
- ✅ TO'G'RI: `if (import.meta.env.PROD) { Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN }); }`

---

### 15.8 NOMLASH XATOLARI (NAM)

---

**NAM-1 — Jadval nomini taxmin qilish, DB da tekshirmaslik**

- **Muammo:** `mm_purchase_order_lines` deb yozilgan — jadval yo'q. Real nom `purchase_order_items`. `pos_stock_balances`, `pos_materials` — ham yo'q. Cron har soat crash.
- **Qoida:** HECH QACHON jadval nomini taxmin qilma. Har yangi jadval ishlatishdan OLDIN: `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%[so'z]%'"`.

---

**NAM-2 — Drizzle schema ustun nomi ≠ DB ustun nomi**

- **Muammo:** `crm_deals` Drizzle schema: `assigned_to` (yo'q), `created_by` (yo'q), `status` (yo'q). Real: `assigned_by_id`, `created_by_id`, `stage_id`. Har INSERT crash yoki silent fail.
- **Qoida:** Yangi Drizzle schema → `.columnName('real_db_column')` yoki `information_schema.columns` bilan tekshir.
- **Tekshiruv:** Drizzle schema yozgandan keyin: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='[jadval]' ORDER BY 1"` — har Drizzle ustun shu ro'yxatda bo'lishi kerak.

---

**NAM-3 — `positions` jadval deprecated, `org_functions` kanonik**

- **Muammo:** Yangi FK lar `positions` jadvaliga yozilgan — 0 FK hub, UI ishlatmaydi. Kanonik: `org_functions` (29 FK, karta-markaz model).
- **Qoida:** Lavozim/funksiya ma'lumoti → `org_functions`. `positions` → faqat legacy compat, yangi FK yozma.
- **Tekshiruv:** `grep -rn "positions\." lib/db/src/schema/ apps/api/src/` — yangi FK `positions` ga bo'lsa tekshir.

---

### 15.9 JARAYON XATOLARI (PRC)

---

**PRC-1 — Agent da'volarini tekshirmay qabul qilish**

- **Muammo:** "FAKE-CREATE=10, duplikatlar bor" degan agent da'vosi qabul qilindi. Tekshirgandan so'ng: FAKE-CREATE=0, duplikatlar allaqachon kanonik jadvallar. Noto'g'ri asosda ish qilingan.
- **Qoida:** Har agent da'vosi: kod + live DB + probe bilan mustaqil tasdiqlansin. "Agent shunday dedi" = isbotlanmagan.
- **Qoida:** `verify-don't-trust` — har katta da'vo uchun mustaqil tekshiruv.

---

**PRC-2 — Docker image rebuild qilinmagan (stale kod brauzerda)**

- **Muammo:** Fix :3000 portida yashil, egasi :3030 da 500. Eski image ishlab turgan edi.
- **Qoida:** Fix deploy = to'g'ri portda rebuild: `docker compose up --build -d`. Ikki xil port = ikki xil muhit.

---

**PRC-3 — `localhost` IPv6 vs IPv4 bind mismatch**

- **Muammo:** API faqat `0.0.0.0:3030` (IPv4) bind qilgan. Docker healthcheck `localhost:3030` → IPv6 `::1:3030` → "unhealthy" yolg'on signal.
- **Qoida:** Docker healthcheck, Vite proxy, va har service config da `localhost` o'rniga `127.0.0.1` ishlatilsin.
- ❌ XATO: `CMD ["wget", "-qO-", "http://localhost:3030/health"]`
- ✅ TO'G'RI: `CMD ["wget", "-qO-", "http://127.0.0.1:3030/health"]`

---

**PRC-4 — `git add -A`: parallel sessiya ishini o'chirib yuborish**

- **Muammo:** Parallel sessiya `git add -A` qildi — egasining "faqat tahlil qilgin" degan boshqa sessiya fayllarini ham staged qilib commit qildi.
- **Qoida:** `git add <aniq-fayl-nomi>` FAQAT. `git add -A`, `git add .`, `git add src/` = TAQIQ. Har commit faqat o'z fayllarini.

---

**PRC-5 — TypeScript tsc 0 = feature ishlayapti taxmini (XATO)**

- **Muammo:** `FinanceExtendedPayrollController` — tsc 0, lekin 7 route 501. URL string typecheck qilinmaydi.
- **Qoida:** tsc 0 + round-trip isboti = tayyor. Round-trip: kirit → saqla → qayta och → ko'rin.

---

**PRC-6 — Docker logs soati muzlab qolgan (ishonchsiz vaqt)**

- **Muammo:** Docker daemon saat 9 kun orqada edi. Log da vaqt bo'yicha muammo aniqlash noto'g'ri natija berdi.
- **Qoida:** Vaqt bo'yicha emas, strukturaviy tekshir: `SELECT COUNT(*)`, `curl -I endpoint`, `docker exec -it postgres psql`.

---

**PRC-7 — Ishlab turgan funksiyani cleanup bahonasida o'chirish**

- **Muammo:** HR Recruiting 9 ta stat kartasi ishlab turgan edi. "Dizayn moslash" bahonasida 5 ta o'chirildi.
- **Qoida (Q-46):** Ishlaydi + to'g'ri = SAQLANADI. Faqat: broken kod yoki fake/stub = to'liq o'chiriladi. "Dizayn" sababi ishlayotgan funksiyani o'chirish uchun yetarli emas.

---

**PRC-8 — Bajaruvchi ruxsatsiz ish qiladi**

- **Muammo:** Tahlil hisobotidagi "o'chirib yuboring" tavsiyasi — bajaruvchi egadan ruxsat olmay bajardi.
- **Qoida:** Tavsiya ≠ ruxsat. Faqat egasi aniq "ha" deguncha hech qanday o'chirish/o'zgartirish yo'q. Analizchi (Claude advisor) = faqat hujjat/direktiv. Bajaruvchi (Muslimbek) = faqat tasdiqlangan vazifa.

---

**PRC-9 — Windows da `find` komandasi boshqacha ishlaydi**

- **Muammo:** `check-fe-api-urls.mjs` da `execSync('find . -name "*.tsx"')` — Linux da ishlaydi, Windows cmd.exe da boshqa natija. Barcha URL PASS deb noto'g'ri hisobot.
- **Qoida:** Cross-platform skriptlar faqat Node.js native API: `fs.readdirSync`, `path.join`, `glob` package. `find`, `grep`, `sed`, `awk` = Unix-only, skriptda taqiq.

---

**PRC-10 — Parallel agent sessiyalari bir-birining fayllarini to'qnash qiladi**

- **Muammo:** Ikki sessiya bir vaqtda bir filga edit qildi. Birinchi commit ikkinchisi tomonidan overwrite qilindi.
- **Qoida (Q-23):** BIR VAQTDA BITTA bajaruvchi. Parallel agent faqat alohida modullarda, bir-biriga tegmaydigan fayllarda. Git conflict = sessiyani to'xtat, egaga xabar ber.

---

### 15.10 PERFORMANCE XATOLARI (PF)

---

**PF-1 — N+1 query: loop ichida DB so'rov**

- **Muammo:** `for (const emp of employees) { const dept = await db.select().from(departments).where(eq(departments.id, emp.deptId)); }` — 100 xodim = 100+1 query.
- **Qoida:** Bitta `JOIN` yoki `WHERE id IN (...)`. Loop ichida `await db.select()` = taqiq.
- ❌ XATO: `for (const e of emps) { e.dept = await this.deptRepo.findById(e.deptId); }`
- ✅ TO'G'RI: `const emps = await db.select({ ...employees, deptName: departments.name }).from(employees).leftJoin(departments, eq(employees.deptId, departments.id));`

---

**PF-2 — Non-null assertion `!` → runtime crash**

- **Muammo:** `config!.value`, `results[0]!.name`, `list.find(x => x.id === id)!` — TypeScript da ishlaydi, runtime da undefined bo'lsa crash.
- **Qoida:** `!` faqat 100% kafolatli bo'lsa. Shubhali bo'lsa optional chaining `?.` yoki explicit null check.
- ❌ XATO: `const user = users.find(u => u.id === id)!;`
- ✅ TO'G'RI: `const user = users.find(u => u.id === id); if (!user) throw new NotFoundException();`

---

**PF-3 — `Array.isArray()` tekshiruvisiz `.map()/.filter()`**

- **Muammo:** API `data` field ba'zan array, ba'zan object qaytardi. `data.map(...)` — data object bo'lsa crash.
- **Qoida:** `const rows = Array.isArray(data?.data) ? data.data : [];` — har FE component da.
- ❌ XATO: `{data.map(item => <Row key={item.id} {...item} />)}`
- ✅ TO'G'RI: `{(data?.data ?? []).map(item => <Row key={item.id} {...item} />)}`

---

**PF-4 — Pagination yo'q: barcha yozuvlar bir so'rovda**

- **Muammo:** `/api/hr/employees` — `LIMIT` yo'q. 10,000 xodim bo'lsa browser freeze.
- **Qoida:** Har `findAll` endpoint da `LIMIT/OFFSET` yoki cursor pagination. Default: `limit = 20`.
- **Tekshiruv:** `grep -rn "\.select()" apps/api/src/ --include="*.repository.ts" | grep -v "limit\|LIMIT"` — limitni tekshir.

---

## § 15 YAKUNIY TEKSHIRUV BUYRUG'I

Yangi modul yozishdan OLDIN barcha 4 qoida:

```bash
# 1. Jadval bor-yo'q (tahmin qilma)
node _audit/q.cjs "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%[so_z]%'"

# 2. Ustun nomlari to'g'ri (draft Drizzle dan oldin)
node _audit/q.cjs "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='[jadval]' ORDER BY 1"

# 3. Listener bor (event yozishdan oldin)
grep -rn "@OnEvent('[event_name]')" apps/api/src/

# 4. Security (endpoint yozgandan keyin)
# @UseGuards? @Roles? @Public izoh? Guard fail-open emas?
grep -rn "@UseGuards" apps/api/src/ | grep -v "@Roles" | grep -v "// PUBLIC:"
```

---

*Hujjat oxiri · [LOYIHA_QOIDALARI.md](LOYIHA_QOIDALARI.md) bilan birga o'qiladi*
*EuroPrint ERP · Agent Reference Manual · Versiya: 2026-06-18 · §15 qo'shildi*
*Yangilash: har sessiyada yangi standart kirganda shu faylga qo'sh*
