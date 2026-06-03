# Zanjir-4: Jadvallar Bog'lanish Xaritasi (FK + Mantiqiy Havolalar)

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (QAT'IY read-only — kod/DB o'zgartirilmadi, faqat shu hisobot)
**DB:** `europrint` @ 127.0.0.1:5432 (read-only, `_audit/q.cjs` orqali)
**Drizzle manba:** `lib/db/src/schema/` (kanonik @workspace/db) + `apps/api/src/shared/db/schema-*.ts` (lokal stub/superset)

---

## 0. Qisqa xulosa

- Jonli DB'da **183 ta haqiqiy FOREIGN KEY** mavjud (public sxema).
- **Markaziy 4 jadval** barcha havolalarning yarmidan ko'pini yutadi: `employees` (30), `org_functions` (28), `users` (27), `org_departments` (26).
- **Order zanjiri FK'siz** — `sd_sales_orders` (jonli buyurtma jadvali) ga **birorta ham** enforce qilingan FK kelmaydi. 75+ jadval `order_id` ustuni mantiqiy bog'langan, lekin FK YO'Q.
- **Type drift:** `order_id` ko'pchilik joyda `integer`, lekin ~12 `ow_*` jadval hali `uuid`, `order_costings`=`text`, `sales_invoices`/`sd-orders.ts`=`varchar`.
- **Dublikat/chalkash kontseptlar:** mijoz (`sd_customers` jonli vs bo'sh `customer_*`/`clients`/`crmCompanies`), material (`material_cards` jonli vs bo'sh `materials`/`mm_materials`/`raw_materials`), buyurtma (`sd_sales_orders` ≈ `sales_orders`, ikkalasi ham 12 qator).
- **Buzuq havola:** `employees.manager_id` hali **0/30 NULL** + DB'da FK constraint YO'Q (Drizzle'da bor: `employees.ts:38`).
- **Schema barrel drift:** Drizzle `employees.ts` `departments`/`positions` ga references qiladi, jonli DB esa `org_departments`/`org_functions` ga (FK nomi `fk_employees_org_dept`/`fk_employees_org_fn`).

---

## 1. Markaziy jadvallar (eng ko'p havola qilinadigan)

Kelayotgan FK soni bo'yicha (DB `constraint_column_usage`):

| # | Jadval | Kelayotgan FK | Izoh |
|---|--------|--------------|------|
| 1 | **employees** | 30 | HR yadrosi; PK `id` (integer) |
| 2 | **org_functions** | 28 | Lavozim/funksiya — org-struktura yadrosi |
| 3 | **users** | 27 | Auth/aktyor (created_by, approved_by, signer_id…) |
| 4 | **org_departments** | 26 | Bo'lim — org-struktura yadrosi |
| 5 | material_cards | 10 | Material kanonik jadval (21 qator jonli) |
| 6 | cc_documents | 10 | Hujjat-aylanma yadrosi |
| 7 | pos_movements | 6 | Ombor harakati |
| 8 | warehouses | 6 | Ombor |
| 9 | cc_document_templates | 4 | |
| 10 | candidates / sd_customers | 3 / 3 | |

**Xulosa:** "org-struktura uchligi" (`employees` + `org_functions` + `org_departments`) + `users` = jami **111 FK** (183 dan ~61%). Bu 4 jadval butun ERP'ning grafik markazi.

### 1.1 Org-struktura yadrosi (`employees`, `org_departments`, `org_functions`)

`employees` ning jonli DB FK'lari (faqat 2 ta!):
- `fk_employees_org_dept`: `employees.org_department_id` → `org_departments.id`
- `fk_employees_org_fn`: `employees.org_function_id` → `org_functions.id`

⚠️ Drizzle (`lib/db/src/schema/employees.ts`) boshqacha deklaratsiya qiladi:
- `:21` `user_id` → `users.id` (`.unique()`) ✅ DB'da FK YO'Q lekin ustun to'la (quyida)
- `:36` `department_id` → **`departments`** ❌ (jonli DB `org_departments` ga FK qo'ygan)
- `:37` `position_id` → **`positions`** ❌ (jonli DB `org_functions` ga FK qo'ygan)
- `:38` `manager_id` → `employees.id` ❌ DB'da FK YO'Q + 0/30 to'ldirilgan (buzuq, §2)

Bu **schema barrel precedence drift**: Drizzle `departments`/`positions` stublariga ishora qiladi, jonli DB esa `org_*` superset jadvallarini ishlatadi.

### 1.2 `users` ko'p aktyor-roli bilan
27 FK ko'pincha "kim qildi" ustunlari: `created_by(_id)`, `approved_by`, `requested_by`, `signer_id`, `printed_by`, `matched_by`, `operator_id`, `host_employee_id`(employees orqali emas)…

---

## 2. Buzuq / yo'qolgan havolalar (FK bo'lishi kerak edi, lekin yo'q)

### 2.1 `employees.manager_id` — 0/30 NULL + FK YO'Q 🔴
- DB: `SELECT count(manager_id) FROM employees` → **0** (30 dan).
- DB'da `employees` jadvalida `manager_id` FK constraint umuman yo'q (faqat org_dept + org_fn).
- Drizzle'da bor: `lib/db/src/schema/employees.ts:38`.
- **Oqibat (memory bilan mos):** `MANAGER_OF_SENDER` yo'li menejer topa olmaydi → `DEPT_HEAD` yo'lidan foydalanish kerak. `org_departments.head_user_id` esa faqat 18/142 to'ldirilgan.

### 2.2 `employees.user_id` — endi TO'LIQ (oldin buzuq edi) ✅
- DB: `count(user_id)` → **30/30** (backfill bo'lgan, memory: `project_employees_users_link_fix`).
- Bijeksiya: `users` 31 qator, `employee_id` 30 ta to'la (1 ortiqcha user = admin). Orphan YO'Q.
- ⚠️ Lekin bu **DB-darajada FK constraint EMAS** — backfill + `OrgStructureService.onModuleInit` self-heal orqali ushlab turiladi, schema enforcement yo'q.

### 2.3 Order zanjirida enforce qilingan FK umuman YO'Q 🔴
- Jonli buyurtma jadvali `sd_sales_orders` (12 qator) ga **birorta FK kelmaydi** (DB tasdiqladi: faqat `production_orders` ga 1 FK — `variance_report`).
- 75+ jadval `order_id` ustuniga ega (qarang §3), lekin hammasi **mantiqiy** havola — DB enforcement yo'q.
- `sd_order_departments`, `sd_invoices`, `sd_payments`, barcha `ow_*`, `qc_*` — hammasi FK'siz.
- Orphan tekshiruvi (`sd_order_departments`) hozir 0 qator, shuning uchun toza, lekin himoya yo'q.

### 2.4 `sd_sales_orders.customer_id` → `sd_customers` FK YO'Q
- `sd_sales_orders.customer_id` (integer) = `sd_customers.id` (integer) — tip mos, lekin FK constraint yo'q. Faqat `sd_customer_contacts`/`sd_customer_interactions` `sd_customers` ga FK qo'ygan.

---

## 3. Tip drift (uuid ↔ int ↔ text/varchar nomuvofiqligi)

`order_id` ustuni 75+ jadvalda. Asosiy turi **`integer`** (jonli `sd_sales_orders.id` = `serial`/integer ga mos). Ammo qoldiqlar:

| Tur | Jadvallar | Holat |
|-----|-----------|-------|
| `uuid` | `ow_contracts`, `ow_fg_transfers`, `ow_order_lines`, `ow_order_samples`, `ow_order_status_history`, `ow_order_surveys`, `ow_pallet_recoveries`, `ow_payment_plan_entries`, `ow_production_plans`, `ow_rework_events`, `qc_reclamations` | ❌ drift — integer order PK bilan join qilolmaydi |
| `text` | `order_costings` | ❌ drift |
| `varchar` | `sales_invoices`, `sd-orders.ts` Drizzle `salesInvoices`/`salesOrders.order_id` | ❌ drift |
| `integer` | qolgan ~60 jadval (sd_*, qc_* ko'pi, mes_*, mm_*, ow_molds/cliches/tech_cards/material_requirements/shipping_requests) | ✅ kanonik |

> Memory (`session_2026-06-01_phase4_fanout`): Phase-4 fan-out qatnashgan 5 ta `ow_*` jadval `order_id` allaqachon `uuid→int` repoint qilingan (ow_molds, ow_tech_cards, ow_cliches, ow_shipping_requests, ow_material_requirements — hammasi yuqorida `integer`). Qolgan `ow_*` (contracts/order_lines/production_plans/…) HALI `uuid` — keyingi repoint nomzodlari.

### 3.1 FK ustun-nomi drift (constraint nomi eski, ustun yangi)
`material_cards` ga 8 FK constraint nomi `..._material_card_id_fkey` deyiladi, lekin **ustun `material_id`** (RENAME qilingan, constraint nomi eski qolgan):
- `pos_material_requests.material_id` (constraint: `pos_material_requests_material_card_id_fkey`)
- `material_price_history.material_id`, `employee_balances.material_id`, `low_stock_alerts.material_id`, `material_supplier_ratings.material_id`, `label_print_history.material_id`, `employee_liability_cases.material_id`
- Faqat `material_card_suggestions.created_material_card_id` ustun nomi mos.
- ✅ Bog'lanish ishlaydi (orphan 0), faqat nomlanish chalkash.

---

## 4. Dublikat / chalkash bog'lanishlar (bitta kontsept → bir nechta jadval)

### 4.1 Mijoz (Customer) — ×7+ jadval, faqat bittasi jonli
| Jadval | Qator | Holat |
|--------|-------|-------|
| **`sd_customers`** | **9** | ✅ JONLI kanonik (FK target: contacts/interactions/parent) |
| `customer_accounts` | 0 | bo'sh dublikat |
| `customer_orders` | 0 | bo'sh |
| `customer_contacts` vs `sd_customer_contacts` | 0 / 8 | parallel to'plam — `sd_*` jonli |
| `clients` | 0 | bo'sh stub (3 ustun) |
| `crmCompanies` (Drizzle) | — | `sd-orders.ts:27,106` `customer_id` BUNGA references qiladi (sd_customers EMAS!) |
| `customers` | **YO'Q** | ❌ AI/kod `customers` kutadi (memory) — jadval umuman mavjud emas → bo'linish |

**Chalkashlik:** `sd_sales_orders.customer_id` ↔ `sd_customers`, ammo Drizzle `salesOrders.customer_id` ↔ `crmCompanies`. AI esa nomavjud `customers` ni kutadi. Uch xil "mijoz" manzili.

### 4.2 Material — ×4 asosiy, faqat bittasi jonli
| Jadval | Qator | Holat |
|--------|-------|-------|
| **`material_cards`** | **21** | ✅ JONLI kanonik (10 FK shunga keladi) |
| `materials` | 0 | bo'sh (jadval bor, FK yo'q) |
| `mm_materials` | 0 | bo'sh test-only |
| `raw_materials` | 0 | bo'sh (memory: bog'liq lug'at, dublikat emas) |

`material_cards` 10 ta FK qabul qiladi (bom_items, material_price_history, low_stock_alerts, pos_material_requests, production_order_components.raw_material_id, …) → haqiqiy kanonik markaz.

### 4.3 Buyurtma (Order) — ×4 jadval, 2 tasi 12 qator (sync dublikat?)
| Jadval | Qator | Holat |
|--------|-------|-------|
| **`sd_sales_orders`** | **12** | ✅ JONLI (fan-out yadrosi) — lekin kelayotgan FK 0 |
| `sales_orders` | **12** | ⚠️ AYNAN 12 qator — `sd_sales_orders` bilan sync/dublikat shubhasi |
| `orders` | 0 | bo'sh (Drizzle `salesInvoices.order_id` → `orders.id`) |
| `production_orders` | 0 | bo'sh (yagona FK target: variance_report) |

**Chalkashlik:** `sd_sales_orders` va `sales_orders` ikkalasi 12 qator — qaysi biri haqiqiy manba ekani noaniq; Drizzle `order_id` lar `orders`/`sales_orders` ga ishora qiladi, jonli fan-out esa `sd_sales_orders` ni ishlatadi.

### 4.4 Lavozim (Position) — ×3
`org_functions` (jonli, 28 FK) vs Drizzle `positions` (stub) vs `position_*` yordamchi jadvallar. Drizzle `employees.position_id → positions`, jonli `employees.org_function_id → org_functions`.

### 4.5 Bo'lim (Department) — ×2
`org_departments` (jonli, 26 FK) vs Drizzle `departments` (stub). Yana barrel drift.

---

## 5. Toza / mustahkam bog'langan klasterlar (FK enforce qilingan)

Quyidagilar DB-darajada to'g'ri FK bilan yopilgan (yaxshi misollar):
- **cc_documents** klasteri: 10 bola (cc_approvals, cc_attachments, cc_audit_trail, cc_versions, cc_print_log, cc_complaints… + self-FK `cc_doc_parent_fk`).
- **pos_movements** klasteri: 6 bola (pos_movement_lines, pos_gl_postings, pos_inventory_passport, three_way_match_log, label/price history).
- **HR recruitment**: `candidates` → employee_referrals/hr_job_offers/hr_references_checks; `hr_candidate_funnels`, `hr_onboarding_processes` → milestones.
- **LMS**: courses → lms_exams → lms_exam_questions/attempts → lms_exam_answers (to'liq zanjir, FK bilan).
- **Warehouse**: warehouses → warehouse_employees/low_stock_alerts/department_warehouse_map; warehouse_bins → batch_lots/warehouse_stock; warehouse_rolls → warehouse_roll_usage.
- **Self-referencing**: `master_categories.parent_id`, `sd_customers.parent_company_id`, `cc_documents.parent_document_id` — daraxt strukturalar to'g'ri.

---

## 6. Tavsiyalar (faqat ma'lumot uchun — bajarish EGASI ruxsati bilan)

> ⚠️ Qoida 23: bu **tavsiya ≠ ruxsat**. Hech biri shu sessiyada bajarilmadi.

1. 🔴 `employees.manager_id` ni to'ldirish + FK qo'shish (yoki rasman `head_user_id` yo'liga o'tish) — hozir 0/30.
2. 🔴 Order zanjiriga FK qo'shish: kamida `sd_order_departments/sd_invoices/sd_payments.order_id → sd_sales_orders.id`.
3. 🟠 `sd_sales_orders` vs `sales_orders` (ikkalasi 12 qator) — qaysi kanonik ekanini hal qilib, birini VIEW/o'chirish.
4. 🟠 Qolgan `ow_*` `order_id uuid→int` repoint (contracts, order_lines, production_plans, payment_plan_entries, rework_events, samples, surveys, status_history, fg_transfers, pallet_recoveries) + `order_costings` text→int, `sales_invoices` varchar→int.
5. 🟡 `sd_sales_orders.customer_id → sd_customers.id` FK; Drizzle `sd-orders.ts`/`employees.ts` ni jonli jadvallarga moslab tuzatish (crmCompanies→sd_customers, departments→org_departments, positions→org_functions).
6. 🟡 Material FK constraint nomlarini ustun nomiga moslash (`material_card_id`→`material_id`) — kosmetik.

---

*Manba dalillari: 183 FK (`information_schema`), markaziy jadval agregati, employees/users/material orphan tekshiruvlari, `order_id` tip skani, `lib/db/src/schema/employees.ts:21-38`, `lib/db/src/schema/sd-orders.ts:27,106`, `apps/api/src/shared/db/schema-ext-a-1.ts:124`. Hammasi read-only `_audit/q.cjs` + Grep/Read orqali.*
