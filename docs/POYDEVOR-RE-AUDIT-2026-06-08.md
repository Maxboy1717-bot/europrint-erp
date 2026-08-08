# POYDEVOR RE-AUDIT — 2026-06-08

> **Rol:** 🟢 Bajaruvchi — lekin bu PHASE 0 (faqat-o'qish re-audit). Hech qanday kod/DB o'zgartirilmadi.
> **Metod:** Har bir da'vo JONLI tasdiqlandi — repo'dagi AYNAN SQL fragmenti `_audit/q.cjs` (read-only) orqali bevosita DB'ga yuborildi. SQL xato bersa = STILL BROKEN; muvaffaqiyatli bo'lsa = ALREADY FIXED/NOT BROKEN.
> **Server:** `:3030` UP (health 200). Login paroli yo'q → JWT mint QILINMADI (Q-30). Q-32 static fallback: HTTP o'rniga aniq SQL fragmentlari ishlatildi (auth'dan mustaqil, kuchliroq isbot).
> **Manba da'volar:** Promtdagi "suspected items" — ko'pi STALE bo'lib chiqdi (oldingi sprintlarda tuzatilgan).

---

## XULOSA (TL;DR)

| Kategoriya | STILL BROKEN | ALREADY FIXED / STALE | Owner qaror kerak |
|---|---|---|---|
| **DRIFT Group B** (ustun nomi) | **15** joy / 6 fayl | 6 da'vo stale | 4 joy (semantik) |
| **DRIFT Group C** (FK uuid↔int) | **1** joy | — | — |
| **DRIFT Group A** (jadval yo'q) | **2** (mm_purchase_order_lines, PosLowStockJob) | gl_journal_lines, warehouse_stock_balance, mes_downtime_events stale | 2 (ikkalasi) |
| **FAKE-CREATE** (Package B) | **0** | hammasi (chat/wms-int/sd-customers) stale | — |
| **DUPLICATES** (Package C) | **0** runtime break | sd_leads/orders/stock/chat hammasi RESOLVED | KPI-orphan, camera-method, mm_lines (DEFER/owner) |

**Asosiy topilma:** Poydevor da'vo qilinganidan ANCHA toza. 15 ta haqiqiy ustun-drift (asosan MES + ERP repo'lar) + 1 FK-cast + 2 yo'q-jadval qoldi. Fake-create YO'Q (PAKET 4 + oldingi ishlarda tugatilgan). Duplikatlar (2-dunyo) allaqachon kanonikallashtirilgan (sd_leads/orders DROP, sd_sales_orders=VIEW, current_stock=VIEW).

---

## PACKAGE A — DRIFT (STILL BROKEN, jonli SQL bilan tasdiqlangan)

### Group B — ustun nomi drift (kod ustunni kutadi, DB'da boshqa nom)

| # | item | file:line | live state | proposed fix | effort |
|---|---|---|---|---|---|
| B1 | `mes_shift_handovers` INSERT `incoming_supervisor` | `modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:25` | 🔴 STILL BROKEN — `ERROR: incoming_supervisor yo'q`. DB'da: `outgoing_supervisor`✓, `received_by`, `handed_over_by`, `issues`✓, `handover_time`✓ (NO `incoming_supervisor`, NO `notes`) | Kod: `incoming_supervisor`→`received_by`. ⚠️ `notes` ham yo'q — tekshirish | S |
| B2 | `mes_shift_handovers` JOIN `sh.incoming_supervisor` | `mes-shifts-stats.repo.ts:171` (getShifts) | 🔴 STILL BROKEN — bir xil ustun | Kod: `sh.incoming_supervisor`→`sh.received_by` | S |
| B3 | `mes_maintenance_requests` INSERT `work_center_id` | `modules/mes/infrastructure/repositories/mes-maintenance.repo.ts:28` | 🔴 STILL BROKEN — DB'da `equipment_id` (NO `work_center_id`) | Kod: `work_center_id`→`equipment_id` | S |
| B4 | `mes_maintenance_requests` UPDATE `assigned_to` | `mes-maintenance.repo.ts:39` | 🔴 STILL BROKEN — `ERROR: assigned_to yo'q`. DB'da `resolved_by` bor, `assigned_to` YO'Q | ⚠️ SEMANTIK: `assigned_to` tushunchasi DB'da yo'q. (a) `ALTER ADD COLUMN assigned_to INT` (owner DDL) yoki (b) `resolved_by`ga map (semantikasi boshqa) → owner tanlasin | M |
| B5 | `mes_maintenance_requests` JOIN `mr.assigned_to` + `mr.work_center_id` | `mes-shifts-stats.repo.ts:185-186` (getMaintenanceRequests) | 🔴 STILL BROKEN — ikkala ustun ham yo'q | B3+B4 bilan birga: `work_center_id`→`equipment_id`; `assigned_to`→owner qaror | M |
| B6 | `erp_daily_reports` INSERT `work_center_id, shift, planned_qty` | `modules/erp/erp-reports.repository.ts:155` (createDailyReport) | 🔴 STILL BROKEN — DB shakli BUTUNLAY boshqa: `id, report_date, department_id, data(jsonb), created_at` | ⚠️ MODEL MOS EMAS: (a) `ALTER ADD COLUMN work_center_id/shift/planned_qty/actual_qty/notes` (owner DDL) yoki (b) repo'ni `data` JSONB'ga yozishga o'tkazish → owner tanlasin | M |
| B7 | `erp_daily_reports` UPDATE `planned_qty` | `erp-reports.repository.ts:162` (updateDailyReport) | 🔴 STILL BROKEN — bir xil model mos-emas | B6 bilan birga | M |
| B8 | `erp_downtime_logs` UPDATE `duration_minutes, resolved` | `erp-reports.repository.ts:77` (updateDowntimeLog) | 🔴 STILL BROKEN — DB'da `duration_min` (NO `duration_minutes`, NO `resolved`) | Kod: `duration_minutes`→`duration_min`; `resolved`→ALTER ADD yoki drop (owner) | M |
| B9 | `erp_downtime_logs` INSERT `work_center_id, duration_minutes, resolved, reported_by` | `erp-reports.repository.ts:190` (createDowntimeLog) | 🔴 STILL BROKEN — DB'da `machine_id, duration_min` (NO `work_center_id/duration_minutes/resolved/reported_by`) | Kod: `work_center_id`→`machine_id`, `duration_minutes`→`duration_min`; `resolved/reported_by`→ALTER ADD yoki drop (owner) | M |
| B10 | `production_orders` INSERT `customer_name, due_date` | `modules/erp/erp-extra.repository.ts:140` (createOrder) | 🔴 STILL BROKEN — `ERROR: customer_name yo'q`. (`product_id, priority, status, notes` BOR✓) | Kod: `customer_name` drop (mijoz sales_order orqali); `due_date`→`planned_end_date` yoki drop | S |
| B11 | `internal_requests` JOIN `ir.material_card_id` + `ir.from_warehouse_id` | `modules/remaining/material-balance.repository.ts:34` (getInternalRequests) | 🔴 STILL BROKEN — DB'da `material_id, warehouse_id` | Kod: `material_card_id`→`material_id`, `from_warehouse_id`→`warehouse_id` (toza rename) | S |
| B12 | `wms_transactions` UPDATE `deleted_at` | `modules/wms/infrastructure/repositories/wms-crud.repository.ts:32` (softDeleteTransaction) | 🔴 STILL BROKEN — DB'da soft-delete ustunlari YO'Q | `ALTER ADD COLUMN deleted_at/deleted_by` (owner DDL, idempotent) — boshqa wms jadvallar bilan izchil | M |
| B13 | `wms_transactions` WHERE `deleted_at IS NULL` | `wms-crud.repository.ts:42` (patchTransaction) | 🔴 STILL BROKEN — bir xil | B12 bilan birga | M |
| B14 | `wms_transactions` WHERE `t.deleted_at` | `modules/wms/infrastructure/repositories/inventory-materials.repository.ts:70` (getMaterialRecentTransactions) | 🔴 STILL BROKEN — bir xil | B12 bilan birga | M |
| B15 | `wms_stock` JOIN `ws.material_card_id` | `wms-crud.repository.ts:162` (getStockById) | 🔴 STILL BROKEN — `wms_stock` = stub jadval (`id, qty, batch_no, notes...` — material/warehouse ustuni YO'Q) | ⚠️ SEMANTIK: `wms_stock` noto'g'ri jadval. `warehouse_stock` yoki `wms_inventory`'ga o'tkazish → owner | M |

> **Eslatma (Group B umumiy):** Promt "code/alias fix afzal" deydi — B1,B2,B3,B10,B11 toza rename (darrov qilsa bo'ladi). B4,B6-B9,B12-B15 da DB ustuni umuman yo'q yoki model boshqa → **semantik qaror (Q-34)** = owner ruxsati kerak (ALTER ADD COLUMN yoki repo qayta-yo'naltirish).

### Group C — FK type uuid↔int

| # | item | file:line | live state | proposed fix | effort |
|---|---|---|---|---|---|
| C1 | `mes_sessions.work_center_id`(uuid) = `work_centers.id`(int) | `modules/erp/erp-reports.repository.ts:86` (getCapacity) | 🔴 STILL BROKEN — `ERROR: operator yo'q: uuid = integer` | Kod: `ON ms.work_center_id::text = wc.id::text` (xavfsiz cast, data migratsiya yo'q) | S |

### Group A — jadval yo'q

| # | item | file:line | live state | proposed fix | effort |
|---|---|---|---|---|---|
| A1 | `mm_purchase_order_lines` jadval YO'Q | `modules/mm/infrastructure/repositories/mm-dashboard.repository.ts:101` (getPriceHistory) + `modules/wms/infrastructure/repositories/inventory-materials.repository.ts:62` (getMaterialRecentPurchases) | 🔴 STILL BROKEN — `ERROR: mm_purchase_order_lines yo'q`. `mm_purchase_order_items` = VIEW (`purchase_order_items` ustida, `unit_price/quantity/material_id` bor) | ⛔ **STOP — owner qaror:** `mm_purchase_order_lines` = `mm_purchase_order_items`mi (VIEW'ga repo'ni qaytarish) yoki alohida jadvalmi? (oldingi sprintdan ham shu STOP nuqta) | M |
| A2 | `pos_stock_balances` + `pos_materials` jadval YO'Q | `PosLowStockJob` cron (jonli logда har daqiqa `ERROR INTERNAL`) | 🔴 STILL BROKEN — cron har ishga tushganda crash (HTTP emas, fon job) | ⚠️ SEMANTIK: kanonik pos-stok jadvaliga (`retail_pos_*` yoki `warehouse_stock`/pos VIEW) qaytarish yoki cron'ni o'chirish → owner | M |

---

## PACKAGE B — FAKE-CREATE: **0 ta tasdiqlangan**

Promtdagi 3 ta aniq da'vo — hammasi STALE (jonli kod bilan tekshirildi):

| Da'vo | Holat |
|---|---|
| `chat.controller.ts:307,315,369` `return {ok:true}` | ❌ STALE — faylda umuman `ok: true` YO'Q (grep=0). Hamma metod `chatService`'ga delegate qiladi |
| `wms-integration.controller.ts:60,66,88` `return {data:[]}` | ❌ STALE — bu satrlar dekoratorlar; fayl `notImplemented()` ishlatadi (halol 501) |
| `sd-customers.controller.ts:111,152,184,204` `return {}` | ❌ STALE — `return {}` faqat DELETE handler'larda, real `svc.*delete()` chaqiruvdan KEYIN (to'g'ri DELETE semantikasi) |

**Sweep (barcha controller POST/PATCH/PUT):** 21 ta `return {ok:true}`/`return {}` topildi — **hammasi** real service/repo chaqiruvidan keyin (kanban, cc-documents, telegram-bots, crm-*, mm-* delete handler'lar). Hech biri fake emas. → **Package B bo'sh.**

---

## PACKAGE C — DUPLICATES (2-dunyo): runtime break **0**

| Dup | Live state | Holat |
|---|---|---|
| `crm_leads` ╳ `sd_leads` | `sd_leads` DROP qilingan; jonli `.ts` kodda 0 ta active DML (faqat re-export/comment) | ✅ RESOLVED — kanonik `crm_leads` |
| `sales_orders` ╳ `sd_sales_orders` ╳ `orders` | `sd_sales_orders` = VIEW (`sales_orders` ustida); `orders` DROP qilingan | ✅ RESOLVED — kanonik `sales_orders` |
| `warehouse_stock` ╳ `current_stock` ╳ `stocks` | `current_stock` = VIEW (`warehouse_stock` ustida); `stocks` = KEEP (karton ombor) | ✅ RESOLVED — kanonik `warehouse_stock`; jonli `upsertWarehouseStock` to'g'ri `material_id` ishlatadi |
| GL: `entries`/`gl_entries`(VIEW) ╳ `gl_journal_entries`/`gl_lines` | 4 ta obyekt mavjud; `gl_journal_entries`+`gl_lines` = 0 qator | ⏸️ DON'T TOUCH (SAP #76) |
| KPI: `kpi_definitions`/`kpi_values`/`seven_function_kpis` | 3 jadval mavjud, lekin **0 ta active query** (orphan) | 🟡 DEFER — schema bloat, runtime break emas |
| `cameras` ╳ `camera_settings` | `cameras` jadval bor; `camera_settings` jadval YO'Q lekin controller `CameraExtendedService` ishlatadi. BE: GET+PUT `/camera-settings`; FE: POST | 🟡 DEFER — metod mos-emas (POST vs PUT), IoT hudud |
| POS prefix: `pos_*` ╳ `retail_pos_*` | `retail_pos_*` kanonik (jonli); `pos_*` asosan dormant | 🟡 Qisman — `pos_stock_balances/pos_materials` yo'q → A2 (cron crash) |
| `mm_purchase_order_items`(VIEW) ╳ `mm_purchase_order_lines`(yo'q) | items=VIEW, lines=YO'Q | ⛔ owner qaror → A1 |

---

## STALE DA'VOLAR (broken deb da'vo qilingan, lekin ALREADY FIXED — verify-don't-trust)

| Da'vo | Tekshiruv natijasi |
|---|---|
| `material_cards.name` → `xom_ashyo` (8+ fayl) | ✅ ALREADY FIXED — barcha call-site `xom_ashyo AS name` alias ishlatadi (erp-reports, erp.repository, mm-materials-extras, label.repo). 0 ta broken |
| `mes_sessions.start_time/end_time/pp_order_id` | ✅ NOT BROKEN — yagona `end_time` ishlatish `mes_production_sessions` jadvaliga (u `end_time/produced_qty` ga EGA). `mes_sessions` emas. getStats query muvaffaqiyatli ishladi |
| `mes_downtime_events` jadval yo'q | ✅ ALREADY FIXED — 0 ta referens (oldingi taskда `downtime_events`ga ulangan) |
| `mes_work_centers` | ✅ NOT BROKEN — 0 ta SQL referens (hammasi `work_centers`) |
| `gl_journal_lines` jadval yo'q | ✅ NOT BROKEN — 0 ta referens (kod `gl_lines`/`gl_entries`/`entries` ishlatadi) |
| `warehouse_stock_balance` jadval yo'q | ✅ NOT BROKEN — 0 ta referens (1 ta comment) |
| `warehouse_stock.material_card_id` | ✅ NOT BROKEN (jonli kod) — faqat eski migration `.sql`'da; jonli `upsertWarehouseStock` to'g'ri `material_id` ishlatadi (`material_card_id` = faqat JS param nomi) |

---

## TAVSIYA ETILGAN BAJARISH TARTIBI (owner ruxsatidan KEYIN)

**Toza rename — darrov (S effort, 1 commit/fayl):**
- B11 (internal_requests material_id/warehouse_id) · B3 (equipment_id) · B1+B2 (received_by) · B10 (customer_name/due_date drop) · C1 (::text cast)

**Semantik / DDL — owner qaror kerak (M effort):**
- B4+B5 (mes_maintenance assigned_to — ADD COLUMN yoki resolved_by?)
- B6+B7 (erp_daily_reports — ADD COLUMN yoki JSONB?)
- B8+B9 (erp_downtime_logs — resolved/reported_by ADD yoki drop?)
- B12-B14 (wms_transactions deleted_at — ADD COLUMN soft-delete?)
- B15 (wms_stock → warehouse_stock/wms_inventory qaysi?)
- A1 (mm_purchase_order_lines — ⛔ STOP nuqta)
- A2 (PosLowStockJob — kanonik pos-stok jadval yoki cron o'chirish?)

**DEFER (runtime break emas):** KPI orphan jadvallar · camera-settings POST/PUT metod mos-emas (IoT)

---

*Tayyorlandi: 2026-06-08 · Bajaruvchi (PHASE 0 read-only) · Hech qanday kod/DB/commit o'zgartirilmadi — git status'da faqat shu fayl ko'rinishi kerak.*
