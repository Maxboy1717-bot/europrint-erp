# CCA Guruh 5 — DB Drift (schema vs kod) konsolidatsiya + staleness verify

**Sana:** 2026-06-03 | **Branch:** chore/schema-convergence | **Rol:** 🔵 Tahlilchi (QAT'IY READ-ONLY)
**DB:** `127.0.0.1:5432 europrint` (live, deyarli bo'sh — qurilish bosqichi)
**Metod:** status3-5xx-rootcause + xato2-ustun-nom-drift (2026-06-02) har bir da'vosi `_audit/q.cjs` (read-only tx) + jonli kod grep bilan QAYTA tasdiqlandi.

> ⚠️ **ASOSIY XULOSA:** Avvalgi 2 hujjat ~40% STALE. Eng yirik 2 drift (`material_cards.name` ×8 fayl, `warehouse_stock.material_card_id` WMS-catalog) ALLAQACHON TUZATILGAN. Lekin yangi-tasdiqlangan AKTIV driftlar bor (gl_journal_lines/qc_approvals/fi_payments jadval yo'q, mes-shifts/maintenance ustun yo'q, wms_transactions uuid↔int + deleted_at). Quyida har biri STALE/AKTIV teglangan.

---

## 0. METODOLOGIYA — nima tasdiqlandi

| Tekshiruv | Buyruq |
|---|---|
| Jadval bor/yo'q | `SELECT to_regclass('public.<t>')` → NULL = yo'q |
| Ustun bor/yo'q | `information_schema.columns` |
| Ustun turi | `data_type` |
| Qator soni (DDL xavfsizligi) | `pg_stat_user_tables.n_live_tup` |
| Kod hali ishlatadimi (STALE/AKTIV) | `Grep apps/api/src` |

---

## 5.1 — USTUN NOM DRIFT (har biri live tasdiqlandi)

| Jadval | Kod kutadi | DB haqiqiy | Kod hali ishlatadimi (file:line) | Holat |
|---|---|---|---|---|
| `material_cards` | `name` | YO'Q (`xom_ashyo`) | **`mc.name` = 0 match** | ✅ **STALE (TUZATILGAN)** |
| `material_cards` | `name_ru` | YO'Q (`xom_ashyo_ru`) | INSERT'lar `xom_ashyo_ru` ishlatadi (erp.repository.ts:134, pos-barcode-ext.repository.ts:21) | ✅ **STALE (TUZATILGAN)** |
| `material_cards` | `unit` | YO'Q (`unit_of_measure`) | INSERT/UPDATE `unit_of_measure` ishlatadi (erp.repository.ts:37,134) | ✅ **STALE (TUZATILGAN)** |
| `material_cards` | `standard_cost` | YO'Q | INSERT'da olib tashlangan (erp.repository.ts:134 endi faqat kod/xom_ashyo/xom_ashyo_ru/unit_of_measure/is_active) | ✅ **STALE (TUZATILGAN)** |
| `material_cards` | `code` | YO'Q (`kod`) | INSERT'lar `kod` ishlatadi | ✅ **STALE** |
| `warehouse_stock` | `material_card_id` | YO'Q (`material_id`) | WMS-catalog (stock-turnover:25,64,105 / dashboard:41,101 / abc-aging-expiry:21) endi `ws.material_id = mc.id` | ✅ **STALE (TUZATILGAN)** — 1 ta qoldiq: `wms-crud.repository.ts:162` hamon `ws.material_card_id = mc.id` ❗AKTIV (1 fayl) |
| `mes_sessions` | `start_time` | YO'Q (`started_at`) | `mes-production-sessions.repo.ts:25` endi `ms.started_at` | ✅ **STALE (TUZATILGAN)** |
| `mes_sessions` | `end_time` | YO'Q (`completed_at`) | `mes-shifts-stats.repo.ts:69,70` hamon `DATE(end_time)` ishlatadi (mes_papka_orders kontekstida — boshqa jadval, tekshiruv kerak) | ⚠️ **QISMAN** (mes_sessions uchun STALE; mes-shifts-stats end_time = boshqa jadval) |
| `mes_sessions` | `pp_order_id` | YO'Q (`production_order_id`) | `mes-production-sessions.repo.ts:37` INSERT endi `production_order_id` (qiymat manbai `body.ppOrderId` — bu DTO maydoni, ustun emas → OK) | ✅ **STALE (TUZATILGAN)** |
| `erp_production_facts` | `fact_qty`/`good_qty`/`defect_qty` | `produced_qty` bor; `fact_qty`/`good_qty` YO'Q | erp-reports.repository.ts:35 SELECT endi `pf.*` (INSERT topilmadi) | ✅ **STALE (SELECT path)** |
| `production_orders` | `customer_name` | YO'Q (tasdiq: 0) | erp-extra INSERT — tekshiruv kerak, lekin `customer_name` DB'da yo'q (AKTIV agar INSERT bo'lsa) | ⚠️ **AKTIV agar yozish path bor** |
| `production_orders` | `due_date` | YO'Q (`planned_end_date`) | xuddi yuqori | ⚠️ **AKTIV agar yozish path bor** |
| `internal_requests` | `material_card_id` | YO'Q (`material_id`) | `remaining/material-balance.repository.ts:34` hamon `ir.material_card_id` | ❗ **AKTIV** |
| `internal_requests` | `from_warehouse_id` | YO'Q (`warehouse_id`) | `material-balance.repository.ts:34` hamon `ir.from_warehouse_id` | ❗ **AKTIV** |
| `warehouse_batches` | `material_card_id` | YO'Q (`item_id`) | `compatibility/warehouse-catalog.service.ts:88,95,102,115,138` + `warehouse-label.service.ts:67,74,91,108` + `warehouse-barcode-ops.service.ts:42,84,106` hamon `wb.material_card_id` | ❗ **AKTIV** (3 fayl, ~11 joy) |
| `warehouse_batches` | `remaining_quantity` | YO'Q | `warehouse-catalog.service.ts:115` INSERT | ❗ **AKTIV** |
| `production_material_balance` | `material_card_id` | YO'Q (`material_id`) | `material-balance.repository.ts:60,68` hamon `pmb.material_card_id` / INSERT | ❗ **AKTIV** |
| `warehouse_transactions` | `material_card_id` | YO'Q (`material_id`) | `material-balance.repository.ts:85` hamon `material_card_id =` | ❗ **AKTIV** |

> **Eslatma — `mc.name` vs `m.name`:** Grep'dagi `.name AS material_name` / `.name AS product_name` (wms-extended, wms-counts, mm-dashboard, wms-warehouse-gateway, iot) — bularning alias'i `m.` = **`mm_materials`** (DB'da `name` BOR, uuid PK) yoki `p.` = products. Bu material_cards EMAS → **TO'G'RI**, drift emas.

---

## 5.2 — YO'Q JADVALLAR (kod ishlatadi, DB'da yo'q)

`to_regclass` natijasi (NULL = jadval yo'q):

| Jadval | to_regclass | Kod (file:line) | Endpoint ta'siri | Holat |
|---|---|---|---|---|
| `gl_journal_lines` | **NULL** | `drizzle-finance-invoice.repo.ts:240` (LEFT JOIN), `drizzle-finance-planning.repo.ts:162` (FROM) | GET /api/finance/gl, /api/finance/ratios → 503 | ❗ **AKTIV** |
| `gl_accounts` | **NULL** | `drizzle-finance-planning.repo.ts` JOIN gl_accounts | finance/ratios 503 | ❗ **AKTIV** — ⚠️ status3 DDL `gl_accounts(id)`'ga REFERENCES qiladi, lekin u ham yo'q. Haqiqiy GL hisob jadvali = **`accounts`** (BOR). DDL'ni to'g'rilash kerak. |
| `qc_approvals` | **NULL** | `qc-defects-extended.repository.ts:97,98,107,116` (SELECT/INSERT/UPDATE) | GET/POST/PUT /api/qc/approvals → 5xx | ❗ **AKTIV** (status3 ro'yxatida YO'Q edi — yangi topildi) |
| `fi_payments` | **NULL** | `drizzle-finance-ops.repo.ts:87` (INSERT), `drizzle-finance-invoice.repo.ts:182` (INSERT) | POST payments → 5xx | ❗ **AKTIV** (status3 ro'yxatida YO'Q edi — yangi topildi) |
| `mes_downtime_events` | **NULL** | `mes-maintenance.repo.ts:96,106` (INSERT/FROM) | mes/maintenance downtime → 5xx | ❗ **AKTIV** (1 fayl qoldi) |
| `warehouse_stock_balance` | **NULL** | `agents/inventory-agent.service.ts` — faqat **izoh/doc satrida** (12-qator), JONLI SQL'da `warehouse_stock` (material_id) ishlatadi (65,81) | yo'q (faqat kommentariya) | ✅ **STALE** (kod allaqachon warehouse_stock'ga ko'chgan) |

**STALE muhim:** xato2 da'vosi `mes-production-sessions.repo.ts:67,80` `mes_downtime_events` ishlatadi degandi — JONLI kod endi **`downtime_events`** (BOR) ishlatadi (67,80-satr). Faqat `mes-maintenance.repo.ts` qoldi.

---

## 5.3 — FK TUR DRIFT (uuid vs int)

| Jadval.ustun | Tur | Mos jadval.id | Tur | JOIN holati | Holat |
|---|---|---|---|---|---|
| `mes_sessions.work_center_id` | **uuid** | `work_centers.id` | **integer** | `erp-reports.repository.ts:86` (getCapacity) `ms.work_center_id = wc.id` + `mes-production-sessions.repo.ts:21,53` | ❗ **AKTIV** — `operator does not exist: uuid = integer` → /api/erp/capacity 503 |
| `mes_sessions.production_order_id` | **uuid** | (production_orders.id = ?) | — | INSERT body NULL beradi | ⚠️ past xavf (bo'sh) |
| `wms_transactions.material_id` | **integer** | `mm_materials.id` | **uuid** | `wms-extended.repository.ts:55` `mm_materials m ON m.id = t.material_id` | ❗ **AKTIV** — uuid=int → /api/wms/transactions 503 |
| `warehouse_stock.material_id` | integer | `material_cards.id` | **integer** | mos | ✅ OK |
| `internal_requests.material_id` | integer | — | — | — | OK |

**mes_sessions / wms_transactions = 0 qator** → tur o'zgartirish DDL **xavfsiz** (data yo'qolmaydi). Yoki kod-level `::text` cast.

---

## 5.4 — YO'Q USTUNLAR (status3 §5.4 ro'yxati)

| Jadval.ustun | DB tasdiq (count) | Kod (file:line) | Holat |
|---|---|---|---|
| `mes_shift_handovers.incoming_supervisor` | **YO'Q** (DB'da `outgoing_supervisor`+`received_by` bor) | `mes-shifts-stats.repo.ts:171` `sh.incoming_supervisor` (try/catch YO'Q) | ❗ **AKTIV** → mes/shifts 503 |
| `mes_maintenance_requests.assigned_to` | **YO'Q** (`requested_by`/`resolved_by` bor) | `mes-shifts-stats.repo.ts:185` `mr.assigned_to` | ❗ **AKTIV** → mes/maintenance 503 |
| `mes_maintenance_requests.work_center_id` | **YO'Q** (`equipment_id` bor) | `mes-shifts-stats.repo.ts:186` `mr.work_center_id` | ❗ **AKTIV** |
| `wms_transactions.deleted_at` | **YO'Q** | `wms-extended.repository.ts:58` `WHERE t.deleted_at IS NULL`, `wms-crud.repository.ts:32`, `inventory-materials.repository.ts:70` | ❗ **AKTIV** → wms/transactions 503 (deleted_at + uuid↔int = ikkita sabab) |
| `erp_daily_reports.work_center_id` | **YO'Q** (DB: id/report_date/department_id/data/created_at) | erp-reports.repository.ts:18 SELECT endi `dr.*` (JOIN OLIB TASHLANGAN) | ✅ **STALE (GET TUZATILGAN)** |
| `erp_downtime_logs.work_center_id` | **YO'Q** (DB: machine_id) | erp-reports.repository.ts:60 SELECT endi `dl.*` (JOIN olib tashlangan) | ✅ **STALE (GET TUZATILGAN)** |
| `erp_downtime_logs.reported_by` | **YO'Q** | SELECT'da yo'q | ✅ **STALE (GET)** |
| `erp_downtime_logs.duration_minutes` | **YO'Q** (DB: `duration_min`) | `erp-reports.repository.ts:77` UPDATE hamon `duration_minutes` | ❗ **AKTIV (PUT path)** → /api/erp/downtime-logs PUT 5xx |
| `erp_downtime_logs.resolved` | **YO'Q** | `erp-reports.repository.ts:77` UPDATE | ❗ **AKTIV (PUT)** |
| `erp_downtime_logs.updated_at` | **YO'Q** | `erp-reports.repository.ts:77` UPDATE | ❗ **AKTIV (PUT)** |
| `erp_production_plans.status` | **YO'Q** | `erp-reports.repository.ts:51` UPDATE `status =` | ❗ **AKTIV (PUT)** → /api/erp/production-plans PUT 5xx |
| `erp_production_plans.updated_at` | **BOR** (1) | — | ✅ OK |
| `erp_production_facts.product_id` | **BOR** (1) | erp-reports.repository.ts:35 | ✅ **STALE** (status3/xato2 "YO'Q" degan — DB'da BOR) |
| `erp_production_facts.work_center_id` | **BOR** (1) | — | ✅ **STALE** (xato2 "YO'Q" degan — DB'da BOR) |
| `production_orders.customer_name` | **YO'Q** (0) | erp-extra.repository.ts:140 INSERT (tekshiruv) | ⚠️ AKTIV agar INSERT bor |

---

## ⭐ STALENESS XULOSASI — qaysi da'vo AKTIV, qaysi TUZATILGAN

### ✅ TUZATILGAN (STALE — avvalgi hujjat eskirgan)
1. **`material_cards.name` (×8 fayl da'vosi)** — `mc.name` = **0 match**. Memory'dagi 80c1faaa **TASDIQLANDI**. Barcha INSERT/UPDATE `xom_ashyo`/`xom_ashyo_ru`/`unit_of_measure` ishlatadi.
2. **`warehouse_stock.material_card_id` (WMS-catalog 8 fayl da'vosi)** — stock-turnover/dashboard/abc-aging-expiry endi `ws.material_id`. **Faqat 1 qoldiq:** `wms-crud.repository.ts:162`.
3. **`mes_sessions.start_time/pp_order_id` + `mes_downtime_events` (mes-production-sessions.repo)** — endi `started_at`/`production_order_id`/`downtime_events`. To'liq tuzatilgan.
4. **`erp_daily_reports`/`erp_downtime_logs`/`erp_production_facts` GET JOIN** — work_centers JOIN'lar SELECT'dan olib tashlangan (`dr.*`/`dl.*`/`pf.*`). GET endpointlar endi 200.
5. **`erp_production_facts.product_id` + `work_center_id`** — DB'da endi **BOR** (xato2 "YO'Q" degani noto'g'ri/eskirgan).
6. **`warehouse_stock_balance`** — kod allaqachon `warehouse_stock` ishlatadi; faqat izoh satrida nom qolgan.

### ❗ HALI AKTIV (haqiqiy joriy drift)
**Jadval yo'q (A guruh — CREATE kerak, egasi ruxsati):**
- `gl_journal_lines` → finance/gl, finance/ratios 503 (+ `gl_accounts` ham yo'q; DDL'ni `accounts`'ga moslash kerak)
- `qc_approvals` → qc/approvals 5xx (status3'da yo'q edi — YANGI)
- `fi_payments` → payments INSERT 5xx (status3'da yo'q edi — YANGI)
- `mes_downtime_events` → mes-maintenance.repo.ts:96,106 (1 fayl qoldi)

**Ustun yo'q (B guruh — ADD COLUMN yoki kod-fix):**
- `mes_shift_handovers.incoming_supervisor` → mes/shifts 503
- `mes_maintenance_requests.assigned_to` + `work_center_id` → mes/maintenance 503
- `wms_transactions.deleted_at` → wms/transactions 503
- `erp_downtime_logs.duration_minutes`/`resolved`/`updated_at` → PUT downtime-logs 5xx
- `erp_production_plans.status` → PUT production-plans 5xx

**FK tur drift (C guruh — ehtiyotkorlik; jadvallar bo'sh = xavfsiz):**
- `mes_sessions.work_center_id` uuid ↔ `work_centers.id` int → erp/capacity 503
- `wms_transactions.material_id` int ↔ `mm_materials.id` uuid → wms/transactions 503

**Ustun nom drift (kod-fix — eski `material_card_id` nomi qoldi):**
- `internal_requests.material_card_id`→`material_id`, `from_warehouse_id`→`warehouse_id` (material-balance.repository.ts:34)
- `warehouse_batches.material_card_id`→`item_id` (compatibility 3 fayl: warehouse-catalog/warehouse-label/warehouse-barcode-ops)
- `production_material_balance.material_card_id`→`material_id` (material-balance.repository.ts:60,68)
- `warehouse_transactions.material_card_id`→`material_id` (material-balance.repository.ts:85)
- `wms_transactions` JOIN: `wms-crud.repository.ts:162` `ws.material_card_id`

---

## DDL kerak (egasi ruxsati) vs Kod-fix ajratish

### 🔴 DDL KERAK — `CREATE TABLE` (Q-35: egasi ruxsati majburiy)
| Jadval | Endpoint | Eslatma |
|---|---|---|
| `gl_journal_lines` | finance/gl, finance/ratios | + parent `gl_accounts` yo'qligini hal qil (DDL'ni `accounts`'ga moslash) |
| `qc_approvals` | qc/approvals | type/reference_id/approver_id/notes/status ustunlar |
| `fi_payments` | payments INSERT | finance-ops + finance-invoice ikkalasi yozadi |
| `mes_downtime_events` | mes-maintenance | YOKI kod-fix → `downtime_events`'ga yo'naltir (afzal) |

### 🟠 DDL yoki kod-fix (tanlov) — `ADD COLUMN` (bo'sh jadval, xavfsiz)
- `mes_shift_handovers.incoming_supervisor` (yoki kod → `received_by`)
- `mes_maintenance_requests.assigned_to`, `work_center_id` (yoki kod → `equipment_id`/`resolved_by`)
- `wms_transactions.deleted_at`
- `erp_downtime_logs.duration_minutes`/`resolved`/`updated_at` (yoki kod → `duration_min` + ustunlarni olib tashlash)
- `erp_production_plans.status`

### 🟢 FAQAT KOD-FIX (DDL kerak emas — DB to'g'ri, kod eski nom ishlatadi)
- `internal_requests`: `ir.material_card_id`→`ir.material_id`, `ir.from_warehouse_id`→`ir.warehouse_id`
- `warehouse_batches`: `wb.material_card_id`→`wb.item_id` (3 fayl)
- `production_material_balance`: `pmb.material_card_id`→`pmb.material_id`
- `warehouse_transactions`: `material_card_id`→`material_id`
- `wms-crud.repository.ts:162`: `ws.material_card_id`→`ws.material_id`

### 🟢 FK tur — kod-level `::text` cast (DDL'siz, xavfsiz) yoki bo'sh-jadval ALTER
- erp/capacity: `ms.work_center_id::text = wc.id::text`
- wms/transactions: `m.id::text = t.material_id::text` (+ deleted_at hal qilingach)

---

## DB GROUND TRUTH (qator soni — DDL xavfsizligi)

| Jadval | n_live_tup | DDL xavfi |
|---|---|---|
| `mes_sessions` | 0 | tur o'zgartirish XAVFSIZ |
| `wms_transactions` | 0 | tur o'zgartirish XAVFSIZ |
| `gl_journal_entries` | 0 | (parent bo'sh) |
| `inventory_counts` | 0 | — |
| `material_cards` | 0 | — |
| `sales_orders` | 0 | — |
| `warehouse_stock` | 1 | past |
| `sd_customers` | 3 | past |

> Butun DB qurilish bosqichi (deyarli bo'sh) → migratsiya emas, struktura/kod masalasi (memory `reference_live_db_location.md` bilan mos).

---

## YAKUNIY HISOB

| Toifa | status3/xato2 da'vo | Tasdiqlandi AKTIV | STALE (tuzatilgan) |
|---|---|---|---|
| Ustun nom drift | ~20 | 6 guruh (internal_requests/warehouse_batches/pmb/wt/wms-crud + erp PUT) | material_cards ×5, warehouse_stock WMS-catalog, mes_sessions |
| Yo'q jadval | 5 (status3) | **5 AKTIV** (gl_journal_lines, qc_approvals*, fi_payments*, mes_downtime_events, +gl_accounts) | warehouse_stock_balance |
| FK tur drift | 2 | **2 AKTIV** (mes_sessions.wc_id, wms_transactions.material_id) | — |
| Yo'q ustun | ~10 | **5 AKTIV** (mes shifts/maint ×3, wms deleted_at, erp PUT ×4) | erp GET JOIN ×3 (production_facts product_id/wc_id DB'da BOR) |

`*` = qc_approvals va fi_payments status3 ro'yxatida BOR edi (5.2 promt), kod-tasdiq AKTIV.

**Eng katta o'zgarish vs eski hujjat:** material_cards.name (eng ko'p ta'sirli da'vo) + WMS material_card_id + mes_sessions + erp GET JOIN'lar — HAMMASI tuzatilgan. Qolgan AKTIV ish asosan: (1) 4 ta yo'q jadval CREATE, (2) mes shifts/maintenance ustun, (3) 2 ta uuid↔int, (4) compatibility/material-balance eski `material_card_id` nomi (kod-fix).

---

*Tahlilchi: Claude Opus 4.8 | 2026-06-03 | QAT'IY READ-ONLY (q.cjs read-only tx + grep) | Hech narsa o'zgartirilmadi (faqat shu hujjat)*
