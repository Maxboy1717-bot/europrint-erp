# OMBOR / MATERIAL / STOK JADVALLARI — TO'LIQ INVENTARIZATSIYA (2026-06-02)

**Faqat ro'yxat + tahlil. Hech narsa o'chirilmadi/o'zgartirilmadi.** Egasi ko'rib qaror qiladi.
Manba: Drizzle sxema + **jonli DB `europrint`@:5432** (qator soni ANIQ `count(*)` bilan olingan),
writer/reader **grep bilan tasdiqlangan** (taxmin emas).

---

## 2026-07-02 YANGILANISH (jonli qayta-o'lchov)

> Barcha sonlar 2026-07-02 kuni `node _audit/q.cjs` bilan jonli `count(*)` qilib olindi;
> writer/reader `grep` bilan qayta tasdiqlandi. Quyidagi 4 blok 2026-06-02 holatga NISBATAN o'zgarishlar.

### A. Kanonik-jonli ro'yxat (data o'sdi / tirildi)

| Jadval | 2026-06-02 | 2026-07-02 | Izoh |
|---|---|---|---|
| **warehouse_stock** | 23 | **37** | CANONICAL stok — o'sishda |
| **material_cards** | 21 | **31** | CANONICAL material lug'ati |
| **pos_movements** / pos_movement_lines | 1 / 1 | **3 / 3** | CANONICAL harakat |
| **pos_movement_confirmations** | 0 (DEAD deb belgilangan edi) | **3** | ⭐ **DEAD→JONLI**: writer `pos/application/services/stock-ledger.service.ts` (imzolangan tasdiq, real `signature_hash`). §4 va "O'CHIRISH MUMKIN" ro'yxatidagi DEAD bahosi BEKOR — endi KEEP |
| **pos_gl_posting_log** | (ro'yxatda yo'q edi) | **2** | JONLI: `gl-posting-log.service/.repository` + `gl.controller` yozadi; POSTED holatida real Debit/Credit gl_entries (2110/6010/1410) |
| **wms_goods_issues** | 0 | **1** | JONLI: `wms/application/commands/goods-issue.handler.ts` + IoT `warehouse-exit-guard` o'qiydi |
| inventory_counts | 6 | **17** | CANONICAL sanoq — o'sishda |
| stock_ledger | 0 | **1** | canonical jurnal — birinchi yozuv tushdi |
| batch_lots | 21 | 21 | o'zgarishsiz |
| warehouses | 12 | 12 | o'zgarishsiz |

### B. Tozalash-nomzodlar (data bor, lekin sifatsiz)

| Jadval | Qator | Muammo |
|---|---|---|
| pos_stock_alerts | **1078** | ⚠️ **FLOOD**: hammasi 1 dona materialga, 2026-06-20 13:00 → 2026-07-01 14:00 oralig'ida soatlik cron takror yozgan (dedup yo'q). Kod jonli (KEEP), lekin data tozalanishi + cron'ga dedup-guard kerak |
| stock_items | **7** | hammasi "(DEMO)" nomli seed-qatorlar ("Karton quti A4 (DEMO)"...). 2026-06-02'da DEAD (0 qator + kod yo'q) edi — demo data DEAD jadvalga tushgan; jadval baho DEAD'ligicha qoladi, data ham tozalash-nomzod |
| pos_printer_config (birlik) | 0 | **DUBLIKAT**: faqat `migrations-drift.ts`da tilga olinadi (runtime kod YO'Q). Kanonik = `pos_printer_configs` (ko'plik; `wms-barcode.controller.ts` + `schema-ext-b-2.ts` ishlatadi, 0 qator=jonli-bo'sh) |

### C. Yangi DEAD-nomzodlar (0 qator + runtime kod YO'Q — grep tasdiqlangan)

| Jadval | Qator | Kod-iste'molchi |
|---|---|---|
| pos_serial_number_items | 0 | 0 runtime fayl (faqat `drift-fix-03b-missing-tables.sql` DDL `CREATE TABLE IF NOT EXISTS` — DROP'dan keyin qayta qo'llansa jadvalni TIKLAYDI) |
| pos_offline_queue | 0 | 0 fayl |
| operator_material_balance | 0 | 0 fayl |
| excel_import_batches | 0 | 0 fayl |
| ai_material_insights | 0 | 0 runtime fayl (faqat `drift-fix-03b-missing-tables.sql` DDL `CREATE TABLE IF NOT EXISTS` — DROP'dan keyin qayta qo'llansa jadvalni TIKLAYDI) |
| warehouse_rows | 0 | faqat `migrations-drift.ts` (DDL-invariant, runtime emas) |
| warehouse_shelves | 0 | faqat `migrations-drift.ts` (DDL-invariant, runtime emas) |

> O'chirish Q-46 tartibida: avval 0-iste'molchi isboti (yuqoridagi grep), keyin egasi ruxsati bilan DROP.

### D. mm_materials VIEW nishoni ALMASHGAN

2026-06-02: `mm_materials` VIEW → `materials` o'qirdi (§ "VIEW→baza" jadvali va §2).
**2026-07-02 jonli `pg_views` tekshiruvi: `mm_materials` endi `material_cards`ni o'qiydi**
(`SELECT id, xom_ashyo AS name, kod AS code, ... FROM material_cards`) — ya'ni § "BIRLASHTIRISH"
bo'limidagi 1-tavsiya (materials→material_cards) VIEW darajasida BAJARILGAN. `materials` jadvali
hanuz 0 qator — endi VIEW ham unga qaramaydi, birlashtirish-nomzodligi kuchaydi.

---

## ⚠️ ENG MUHIM KASHFIYOT: bu "dublikat to'plami" emas — **canonical baza + compat-VIEW** arxitekturasi

Ko'p "dublikat" ko'ringan jadval aslida **VIEW** (jonli baza ustidan oyna), alohida jadval EMAS.
VIEW o'chirilmaydi mustaqil — u canonical bazani o'qiydi. Tasdiqlangan VIEW→baza:

| VIEW | → o'qiydigan canonical baza |
|---|---|
| `current_stock`, `pos_warehouse_stock_view` | **warehouse_stock** |
| `pos_inventory_counts`, `wms_inventory_counts` | **inventory_counts** ← "3 parallel" aslida 1 baza + 2 VIEW! |
| `pos_inventory_count_lines` | inventory_count_lines |
| `mm_materials` | materials |
| `material_lots_view`, `ai_material_batches` | batch_lots / material_batches |
| `wms_warehouses` | warehouses |
| `mm_goods_receipts/issues/items/lines` | goods_receipts/issues/items/lines |
| `pos_stock_ledger` | stock_ledger |
| `pos_barcode_print_queue` | barcode_print_queue |
| `pos_movements_legacy_view` | material_movements (pos shaklga bridge) |
| `wms_exit_logs`, `wms_internal_requests` | exit_logs / internal_requests |

---

## 1. STOK jadvallari → **canonical = `warehouse_stock`**

| Jadval | Nima | Qator | Writer | Reader | Baho |
|---|---|---|---|---|---|
| **warehouse_stock** | ombor×material qoldiq snapshot | **23** | ✅ pos-wms-sync.helpers (raw INSERT), pos-warehouse-integration-movement (UPDATE) | ✅ drizzle-wms-inventory.repo | **CANONICAL** |
| stock_ledger | stok jurnali (kirim/chiqim history) | 0 | ✅ pos/stock-ledger.repository | ✅ stock-ledger.repository | **canonical-bo'sh** (jurnal; kod jonli, data yo'q) |
| current_stock | — | 23 | — | (VIEW) | **VIEW→warehouse_stock** (saqlang) |
| pos_warehouse_stock_view | warehouse_stock+warehouses+material_cards | 22 | — | (VIEW) | **VIEW** (saqlang) |
| pos_stock_ledger | — | 0 | — | (VIEW) | **VIEW→stock_ledger** |
| inventory_policy | min/max/ROP siyosati | 0 | ✅ mrp-run helpers | ✅ pp-intelligence | jonli-bo'sh (KEEP) |
| pos_stock_alerts / stockAlerts | stok ogohlantirish | 0 | ✅ stock-ledger.repository | ✅ stock-ledger.repository | jonli-bo'sh (KEEP) |
| stocks, stock_items, stock_movements, wms_stock, wms_stock_levels, wms_inventory, mro_inventory, warehouse_kpi_cache, inventory_valuation, material_inventory_valuations, stock_gl_postings, stock_movement_gl_postings, min_stock_alerts, low_stock_alerts, stock_moves | har xil stok/valuatsiya | **0** | ❌ yo'q (yoki faqat sxema) | ❌ yo'q | **DEAD** (0 qator + kod yo'q → o'chsa bo'ladi) |

---

## 2. MATERIAL jadvallari → **canonical = `material_cards`**

| Jadval | Nima | Qator | Writer | Reader | Baho |
|---|---|---|---|---|---|
| **material_cards** | material kartochka (asosiy lug'at) | **21** | ✅ 8 fayl (erp.repo, resources.svc, pos-barcode-ext, procurement...) | ✅ 55 fayl | **CANONICAL** |
| materials | material (Drizzle repo) | 0 | ✅ drizzle-material.repo | ✅ drizzle-material.repo (4) | **DUBLIKAT** (kod bor, baza bo'sh → material_cards bilan birlashtirish; mm_materials VIEW shuni o'qiydi) |
| raw_materials | xom-ashyo lug'ati | 0 | ❌ | ✅ finance + mm-extras | **legacy/bog'liq** (o'quvchi bor, bo'sh — KEEP, tekshir) |
| material_categories | material kategoriya | 7 | (migration) | ✅ JOIN (erp, mm-extras) | **CANONICAL** (kichik lug'at) |
| material_recommendation | EOQ tavsiya | 0 | ✅ wms-eoq, mrp-run-eoq | ✅ rop-trigger | jonli-bo'sh (KEEP) |
| material_price_history | narx tarixi | 0 | ❌ | ✅ material-360 | read-only-bo'sh |
| mm_materials | — | 0 | — | (VIEW) | **VIEW→materials** |
| material_batches, batches, material_consumption, production_consumption, mro_consumption, consumption_suggestions, material_norms, material_kits, material_kit_items, material_barcodes, material_card_suggestions, qc_material_tests, material_category_dept_rules, production_material_allocs | har xil | **0** | ❌ | ❌ | **DEAD** (0 + kod yo'q) |

---

## 3. PARTIYA / LOT → **canonical = `batch_lots`**

| Jadval | Nima | Qator | Writer | Reader | Baho |
|---|---|---|---|---|---|
| **batch_lots** | partiya/lot (FEFO) | **21** | ✅ wms-gateway-warehouse-lots.controller | ✅ 3 direct + material_lots_view | **CANONICAL** |
| material_lots_view | batch_lots+warehouse_bins | 21 | — | (VIEW) | **VIEW→batch_lots** |
| warehouse_batches | ombor partiya (raw SQL) | 0 | ✅ warehouse-catalog/label.svc | ✅ warehouse-barcode-ops, catalog | jonli-bo'sh (ikkilamchi — batch_lots bilan ko'rib chiqing) |
| wms_stock_batches | — | 0 | ❌ | ✅ wms-counts/extended | read-only-bo'sh |
| ai_material_batches | — | 0 | — | (VIEW→material_batches) | VIEW |
| batches, material_batches, batch_lot_movements | — | 0 | ❌ | ❌ | **DEAD** |

---

## 4. HARAKAT (movement/transaction) → **canonical = `pos_movements` (+ lines + types)**

| Jadval | Nima | Qator | Writer | Reader | Baho |
|---|---|---|---|---|---|
| **pos_movements** | kirim/chiqim harakati | **1** | ✅ pos-movement.repository, drizzle-pos-svc.repo, barcode-warehouse.svc | ✅ barcode-warehouse-queries | **CANONICAL** |
| **pos_movement_lines** | harakat satrlari | 1 | ✅ (pos repo) | ✅ barcode-warehouse-queries | **CANONICAL** |
| pos_movement_types | harakat turlari lug'ati | 7 | — | ✅ barcode-warehouse | **CANONICAL lug'at** |
| material_movements | eski material harakati | 1 | ❌ | (pos_movements_legacy_view orqali) | **legacy** (bridge view bor) |
| pos_movements_legacy / pos_movements_archive | retention/arxiv | 0 | ✅ queries-data-retention | ✅ queries-data-retention | jonli-bo'sh (retention) |
| wms_transactions | wms tranzaksiya | 0 | ✅ barcode-warehouse, wms-crud | ✅ integration-employee, inventory-materials | jonli-bo'sh (ikkilamchi) |
| warehouse_transactions | — | 0 | ❌ | ✅ inventory-agent, quality-agent | read-only-bo'sh |
| stock_movements, stock_moves, barcode_movements, batch_lot_movements, pos_movement_confirmations, role_movement_permissions | — | 0 | ❌ | ❌ | **DEAD** |

---

## 5. INVENTARIZATSIYA (owner: "3 parallel") → **canonical = `inventory_counts` (boshqa 2 si VIEW!)**

| Jadval | Nima | Qator | Writer | Reader | Baho |
|---|---|---|---|---|---|
| **inventory_counts** | inventarizatsiya sessiyasi | **6** | ✅ drizzle-pos-v2.repo | ✅ drizzle-pos-v2.repo | **CANONICAL** |
| **inventory_count_lines** | sanoq satrlari | 0 | ✅ queries-remaining-b | ✅ drizzle-pos-v2-report | canonical (jonli) |
| pos_inventory_counts | — | 6 | — | (VIEW) | **VIEW→inventory_counts** (alohida jadval EMAS) |
| wms_inventory_counts | — | 6 | — | (VIEW) | **VIEW→inventory_counts** (alohida jadval EMAS) |
| pos_inventory_count_lines | — | 0 | — | (VIEW) | **VIEW→inventory_count_lines** |
| pos_inventory_passport | inventar passport | 0 | ❌ | ✅ pos-inventory-passport.repo | read-only-bo'sh |
| cycle_count_results, pos_inventory_variances, pos_inventory_plans, inventory_passports, pos_material_passports | — | 0 | ❌ | ❌ (yoki kam) | **DEAD / deyarli o'lik** |

→ **"3 parallel inventarizatsiya" = 1 ta haqiqiy jadval (`inventory_counts`) + 2 ta VIEW.** Birlashtirish KERAK EMAS.

---

## 6. TRANSFER / GOODS (qabul-chiqim)

| Jadval | Qator | Holat | Baho |
|---|---|---|---|
| stock_transfers / stock_transfer_lines | 5 / 7 | ✅ writer+reader | **CANONICAL** (ombor-aro ko'chirish) |
| goods_receipts/issues + *_items/_lines | 0 | ✅ queries-mm-goods jonli | canonical-bo'sh; **mm_goods_*** = VIEW ustidan |
| transfer_requests / transfer_request_lines | 0 | ✅ drizzle-pos-v2-request | jonli-bo'sh |
| ow_material_requirements | 0 | ✅ Phase-4 fan-out (sd-order-departments) | jonli-bo'sh (KEEP) |
| warehouse_transfers, wms_transfers | 0 | faqat reader | read-only-bo'sh |
| ow_fg_transfers, asset_transfers | 0 | ❌ | **DEAD** |

---

## 7. OMBOR STRUKTURASI

| Jadval | Qator | Baho |
|---|---|---|
| **warehouses** | 12 | **CANONICAL** (writer+reader) · `wms_warehouses` = VIEW |
| **warehouse_bins** | **126** | **CANONICAL** (jonli, eng ko'p data) |
| warehouse_zones | 9 | CANONICAL (reader) |
| warehouse_types | 9 | CANONICAL lug'at (reader) |
| warehouse_employees | 9 | jonli (reader) |
| warehouse_access_grants, department_warehouse_map | 0 | jonli (pos-department.guard o'qiydi) |
| warehouse_rental_records/settings | 0 | reader (rental) |
| warehouse_kpi_cache, warehouse_roll_usage, daily_warehouse_plans, pos_warehouse_access | 0 | **DEAD** |
| warehouse_rolls | 0 | reader bor (director/inventory-agent) — KEEP |

---

## 8. BARCODE / REZERV / PODOTCHET / ALERT

| Jadval | Qator | Baho |
|---|---|---|
| barcode_print_queue (+pos VIEW) | 0 | jonli write (KEEP) |
| inventory_barcode_assignments | 0 | jonli (KEEP) |
| pos_barcode_map | 0 | reader |
| employee_inventory_ledger / employee_issuance_log | 0 | **jonli — PODOTCHET** (employees-compat-profile-orm yozadi) (KEEP) |
| stock_reservations | 0 | reader (pos-barcode-ext, pos-reports) |
| pos_stock_reservations, ai_reservation_requests/batches | 0 | def bor, kod kam |
| wms_alerts | 0 | write-only |
| material_barcodes, low_stock_alerts, min_stock_alerts, pos_stock_alerts(kod bor), barcode_movements | 0 | DEAD / jonli-bo'sh |

---

## XULOSA — egasi tozalashni xohlasa

### ✅ QOLADI (canonical — yagona haqiqat manbai)
`warehouse_stock` (stok) · `material_cards` (material) · `material_categories` · `batch_lots` (lot) ·
`pos_movements`+`pos_movement_lines`+`pos_movement_types` (harakat) · `inventory_counts`+`inventory_count_lines` (sanoq) ·
`warehouses`+`warehouse_bins`+`warehouse_zones`+`warehouse_types`+`warehouse_employees` · `stock_transfers`+`lines` ·
`goods_receipts/issues+items` · `transfer_requests+lines` · `ow_material_requirements` · `stock_ledger` ·
`employee_inventory_ledger`+`employee_issuance_log` (podotchet) · `barcode_print_queue` · `inventory_barcode_assignments` · `material_recommendation` · `inventory_policy`.

### 🪟 QOLADI (VIEW — compat, MUSTAQIL o'chirmang)
current_stock, pos_warehouse_stock_view, pos_stock_ledger, mm_materials, mm_goods_*, wms_warehouses,
material_lots_view, ai_material_batches, pos_inventory_counts, wms_inventory_counts, pos_inventory_count_lines,
pos_barcode_print_queue, pos_movements_legacy_view, wms_exit_logs, wms_internal_requests.

### 🔀 BIRLASHTIRISH (dublikat → canonical) — egasi tasdig'i bilan
- **`materials` (+ `mm_materials` VIEW) → `material_cards`** — materials Drizzle repo bo'sh, material_cards = haqiqiy data. (memory: mm/materials = test-only dublikat).
- **`raw_materials`** — bog'liq lug'at, o'quvchi bor; tekshirib material_cards bilan moslang yoki saqlang.
- **`warehouse_batches`** — `batch_lots` bilan maqsad bir xil; ko'rib chiqing.
- **`wms_transactions` / `warehouse_transactions`** — `pos_movements` bilan bir maqsad (harakat); birlashtirishni ko'rib chiqing.

### 🗑️ O'CHIRISH MUMKIN (0 qator + KOD YO'Q = o'lik/orphan)
stocks, stock_items, stock_movements, wms_stock, wms_stock_levels, wms_inventory, mro_inventory,
warehouse_kpi_cache, inventory_valuation, material_inventory_valuations, stock_gl_postings,
stock_movement_gl_postings, min_stock_alerts, low_stock_alerts, stock_moves, material_batches, batches,
material_consumption, production_consumption, mro_consumption, consumption_suggestions, material_norms,
material_kits, material_kit_items, material_barcodes, material_card_suggestions, qc_material_tests,
material_category_dept_rules, production_material_allocs, pos_movement_confirmations, barcode_movements,
batch_lot_movements, ow_fg_transfers, role_movement_permissions, cycle_count_results, inventory_passports,
warehouse_roll_usage, pos_warehouse_access, daily_warehouse_plans.

---

## ⚠️ ESLATMALAR (egasi uchun)
1. **DB qurilish bosqichida** — 0 qator ≠ doim o'lik. "0 qator + kod yo'q" = o'lik; "0 qator + kod jonli" = canonical-bo'sh (saqlang). Men ikkalasini ajratdim.
2. **VIEW'larni mustaqil o'chirmang** — ular canonical baza ustidan oyna; bazani o'chirsangiz VIEW sinadi.
3. **Verify-don't-trust:** dastlabki agent baholari data-jadvallarda XATO edi (material_cards/batch_lots/warehouse_bins/pos_movements "orphan/read-only" deb belgilangan); men har bir canonical tanlovini **to'g'ridan-to'g'ri grep + count** bilan tekshirib to'g'riladim.
4. Bu hujjat — faqat tahlil. **Hech narsa o'chirilmadi.** Keyingi qadam (birlashtirish/o'chirish) egasi tasdig'idan keyin, alohida.
