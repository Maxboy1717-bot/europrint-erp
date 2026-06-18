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

*Hujjat oxiri · [LOYIHA_QOIDALARI.md](LOYIHA_QOIDALARI.md) bilan birga o'qiladi*
*EuroPrint ERP · Agent Reference Manual · Versiya: 2026-06-18*
*Yangilash: har sessiyada yangi standart kirganda shu faylga qo'sh*
