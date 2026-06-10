# POYDEVOR — Semantik/DDL drift taklifi (owner ruxsati kerak)

> **Davomi:** [POYDEVOR-RE-AUDIT-2026-06-08.md](POYDEVOR-RE-AUDIT-2026-06-08.md) PHASE 0.
> **Holat:** Sub-group 1 (6 toza rename) + A2 + A1 BAJARILDI va push qilindi.
> **Bu hujjat:** qolgan **10 ta semantik/DDL drift** — har biri uchun aniq `file:line` + taklif + sabab.
> **⛔ Q-35:** DDL (`ALTER TABLE ADD COLUMN`) HAR BIRI uchun owner ruxsati kerak. Hech narsa hali o'zgartirilmadi.
> **Tasdiqlash usuli:** owner har item yoniga "ha"/"yo'q"/"boshqa" yozadi → keyin bajaman (har biri: fix → DB-proof → tsc → alohida commit).

---

## A GURUH — KOD-ONLY (DDL kerak EMAS, lekin semantik qaror → tasdiq so'rayman)

Bular jadval tanlash/qayta-yo'naltirish — A2 (PosLowStockJob) bilan bir xil naqsh. DDL yo'q, faqat kod.

### S1. B15 — `getStockById` `wms_stock` → `warehouse_stock`
| | |
|---|---|
| **file:line** | `modules/wms/infrastructure/repositories/wms-crud.repository.ts:158-165` |
| **Muammo** | `wms_stock` = stub jadval (`id, qty, batch_no, notes, deleted_at...` — `warehouse_id`/`material_id`/`material_card_id` YO'Q). Query `ws.material_card_id` va `ws.warehouse_id` ga JOIN qiladi → ikkalasi ham yo'q → crash |
| **Taklif (kod)** | `FROM warehouse_stock ws` + `JOIN ... ON ws.material_id = mc.id` + `ON ws.warehouse_id = w.id` + `WHERE ws.id = ${id}` (warehouse_stock'da `deleted_at` yo'q → filtri olib tashlanadi) |
| **Sabab** | Kanonik stok = `warehouse_stock` (owner D8 + A2 bilan izchil). `wms_stock` ishlatilmaydigan stub |
| **Effort** | S (kod-only) · **Tavsiyam: HA** (A2 bilan bir xil) |

### S2. B8/B9 (qisman) — `erp_downtime_logs` toza renamelar
| | |
|---|---|
| **file:line** | `modules/erp/erp-reports.repository.ts:77` (update) + `:190` (insert) |
| **Muammo** | Kod `work_center_id`, `duration_minutes` ishlatadi; DB'da `machine_id`, `duration_min` |
| **Taklif (kod)** | `work_center_id`→`machine_id`, `duration_minutes`→`duration_min` (toza rename) |
| **Sabab** | DB ustunlari shu nom bilan data saqlaydi — alias yetarli |
| **Effort** | S (kod-only) · **Tavsiyam: HA** · ⚠️ `resolved`/`reported_by` ESA yo'q → pastda D-guruh (B8/B9 DDL qismi) |

---

## D GURUH — DDL kerak (`ALTER TABLE ADD COLUMN`, Q-35 — har biriga alohida "ha")

> Hammasi **idempotent** (`ADD COLUMN IF NOT EXISTS`), jonli DB qurilish bosqichida (jadvallar bo'sh yoki kam data) → xavfsiz. Har bir migration faylida `-- APPROVED: owner 2026-06-08` bo'ladi.

### D1. B1 — `mes_shift_handovers` ADD COLUMN `notes`
| | |
|---|---|
| **file:line** | `modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:25` (shiftHandover INSERT) |
| **Muammo** | INSERT `(outgoing_supervisor, incoming_supervisor, notes, issues, handover_time)`. `incoming_supervisor`→`received_by` (kod, toza) LEKIN `notes` ustuni umuman YO'Q |
| **Taklif** | (a) **DDL:** `ALTER TABLE mes_shift_handovers ADD COLUMN IF NOT EXISTS notes text` + (b) kod: `incoming_supervisor`→`received_by` |
| **Muqobil** | `notes`ni INSERT'dan olib tashlash (DTO maydoni yo'qoladi — Q-43 buzilishi) |
| **Sabab** | Shift handover formasi `notes` yuboradi; o'z ustuni bo'lsa getShifts `sh.*` orqali qaytadi (round-trip) |
| **Effort** | S · **Tavsiyam: (a) ADD COLUMN notes** |

### D2. B4/B5 — `mes_maintenance_requests` ADD COLUMN `assigned_to`
| | |
|---|---|
| **file:line** | `mes-maintenance.repo.ts:39` (update `assigned_to`) + `mes-shifts-stats.repo.ts:185-186` (getMaintenanceRequests JOIN `mr.assigned_to` + `mr.work_center_id`) |
| **Muammo** | `assigned_to` ustuni yo'q (DB'da `resolved_by` bor, lekin u "kim yopdi", "kim biriktirilgan" emas). `work_center_id`→`equipment_id` (kod, toza) |
| **Taklif** | (a) **DDL:** `ALTER TABLE mes_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to int REFERENCES employees(id)` + (b) kod: B5 SELECT'da `mr.work_center_id`→`mr.equipment_id` |
| **Muqobil** | `assigned_to`→`resolved_by` map (semantikasi noto'g'ri) |
| **Sabab** | Texnik xizmat so'rovini xodimga biriktirish — real biznes tushuncha; `resolved_by`dan farqli |
| **Effort** | M · **Tavsiyam: (a) ADD COLUMN assigned_to** |

### D3. B6/B7 — `erp_daily_reports` ADD COLUMNs (model mos emas)
| | |
|---|---|
| **file:line** | `erp-reports.repository.ts:155` (createDailyReport) + `:162` (updateDailyReport) |
| **Muammo** | DB shakli: `id, report_date, department_id, data(jsonb), created_at`. Kod kutadi: `work_center_id, shift, planned_qty, actual_qty, notes` |
| **Taklif** | (a) **DDL:** `ADD COLUMN IF NOT EXISTS work_center_id int, shift text, planned_qty numeric, actual_qty numeric, notes text` |
| **Muqobil** | (b) repo'ni `data` JSONB ga yozishga qayta yozish (ko'proq kod, queryda noqulay) |
| **Sabab** | Kunlik hisobot maydonlari birinchi-darajali queryable ustun bo'lishi kerak (filter/agregatsiya) |
| **Effort** | M · **Tavsiyam: (a) ADD COLUMNs** |

### D4. B8/B9 (DDL qismi) — `erp_downtime_logs` ADD COLUMN `resolved`, `reported_by`
| | |
|---|---|
| **file:line** | `erp-reports.repository.ts:77` (update) + `:190` (insert) |
| **Muammo** | Kod `resolved`, `reported_by` yozadi; DB'da yo'q (S2 da `machine_id`/`duration_min` rename qilinadi) |
| **Taklif** | **DDL:** `ALTER TABLE erp_downtime_logs ADD COLUMN IF NOT EXISTS resolved boolean DEFAULT false, ADD COLUMN IF NOT EXISTS reported_by int` |
| **Muqobil** | `resolved`/`reported_by`ni query'dan olib tashlash (data yo'qoladi) |
| **Sabab** | Downtime hal qilindi-mi + kim xabar berdi — real audit maydonlari |
| **Effort** | S · **Tavsiyam: HA** (S2 bilan birga to'liq downtime fix) |

### D5. B12/B13/B14 — `wms_transactions` ADD COLUMN `deleted_at`, `deleted_by`
| | |
|---|---|
| **file:line** | `wms-crud.repository.ts:32` (softDelete) + `:42` (patch WHERE) + `inventory-materials.repository.ts:70` (getMaterialRecentTransactions WHERE) |
| **Muammo** | Kod soft-delete (`deleted_at`) ishlatadi; `wms_transactions`'da bu ustunlar yo'q |
| **Taklif** | **DDL:** `ALTER TABLE wms_transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz, ADD COLUMN IF NOT EXISTS deleted_by int` |
| **Muqobil** | Hard-delete'ga o'tish (boshqa wms jadvallar soft-delete naqshini buzadi) |
| **Sabab** | Boshqa wms jadvallar (`warehouses`, `wms_inventory`) soft-delete ishlatadi — izchillik |
| **Effort** | S · **Tavsiyam: HA** |

---

## XULOSA

| Guruh | Item | Tur | Tavsiya |
|---|---|---|---|
| A (kod-only) | S1 (B15 wms_stock→warehouse_stock) | kod | HA |
| A (kod-only) | S2 (B8/B9 machine_id/duration_min rename) | kod | HA |
| D (DDL) | D1 (B1 notes) | ADD COLUMN | HA |
| D (DDL) | D2 (B4/B5 assigned_to) | ADD COLUMN | HA |
| D (DDL) | D3 (B6/B7 daily_reports ×5) | ADD COLUMN | HA |
| D (DDL) | D4 (B8/B9 resolved/reported_by) | ADD COLUMN | HA |
| D (DDL) | D5 (B12-B14 wms_transactions soft-delete) | ADD COLUMN | HA |

**So'rov:** Har item yoniga **HA / YO'Q / boshqa-variant** belgilang. A-guruh (S1,S2) DDL'siz — istasangiz darrov boshlayman. D-guruh har biri Q-35 ruxsatini kutadi.

*Tayyorlandi: 2026-06-08 · Bajaruvchi · Hech qanday DDL/kod hali o'zgartirilmadi (bu faqat taklif).*
