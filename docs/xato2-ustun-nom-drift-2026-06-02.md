# EuroPrint ERP — Ustun Nomi Drift Katalogi
Sana: 2026-06-02 | Branch: chore/schema-convergence | Holat: READ-ONLY tahlil

---

## JAMI STATISTIKA

| Ko'rsatkich | Son |
|---|---|
| Tekshirilgan jadval soni (DB) | 27 |
| Drizzle schema fayllari | 60+ |
| Nomuvofiqlik topilgan jadvallar | 13 |
| Jami drift ustun juftligi | 42+ |
| Eng kritik (500 sabab) | 9 ta jadval |
| DB'da umuman YO'Q jadvallar (kod ishlatmoqda) | 2 (`mes_downtime_events`, `warehouse_stock_balance`) |

---

## DRIFT JADVALI (Jami 35+ nomuvofiqlik)

| Jadval | Kod kutgan ustun | DB'dagi haqiqiy ustun | Xato turi | Ta'sir qiladigan endpoint |
|---|---|---|---|---|
| `material_cards` | `name` | YO'Q (asl nom: `xom_ashyo`) | SELECT/INSERT/UPDATE 500 | GET/PUT /api/erp/products, GET /api/erp/bom-*, GET /api/erp/routings |
| `material_cards` | `name_ru` | YO'Q (asl nom: `xom_ashyo_ru`) | INSERT 500 | POST /api/erp/products |
| `material_cards` | `unit` | YO'Q (asl nom: `unit_of_measure`) | UPDATE 500 | PUT /api/erp/products/:id |
| `material_cards` | `standard_cost` | YO'Q | INSERT 500 | POST /api/erp/products |
| `material_cards` | `min_stock` | `min_stock` — BOR | OK | — |
| `material_cards` | `code` | `kod` (DB), `code` ham bor? | Tekshiruv kerak | — |
| `erp_daily_reports` | `work_center_id` | YO'Q (DB'da: `id, report_date, department_id, data, created_at`) | JOIN 500 | GET /api/erp/daily-reports |
| `erp_daily_reports` | `shift` | YO'Q | INSERT 500 | POST /api/erp/daily-reports |
| `erp_daily_reports` | `planned_qty` | YO'Q | INSERT/UPDATE 500 | POST/PUT /api/erp/daily-reports |
| `erp_daily_reports` | `actual_qty` | YO'Q | INSERT/UPDATE 500 | POST/PUT /api/erp/daily-reports |
| `erp_daily_reports` | `updated_at` | YO'Q | UPDATE 500 | PUT /api/erp/daily-reports |
| `erp_downtime_logs` | `work_center_id` | YO'Q (DB'da: `id, machine_id, reason, started_at, ended_at, duration_min, created_at`) | JOIN 500 | GET /api/erp/downtime-logs |
| `erp_downtime_logs` | `duration_minutes` | YO'Q (DB'da: `duration_min`) | INSERT/UPDATE 500 | POST/PUT /api/erp/downtime-logs |
| `erp_downtime_logs` | `resolved` | YO'Q | UPDATE 500 | PUT /api/erp/downtime-logs |
| `erp_downtime_logs` | `reported_by` | YO'Q | INSERT 500 | POST /api/erp/downtime-logs |
| `erp_downtime_logs` | `updated_at` | YO'Q | UPDATE 500 | PUT /api/erp/downtime-logs |
| `mes_sessions` | `start_time` | YO'Q (DB'da: `started_at`) | SELECT/INSERT 500 | GET /api/mes/sessions |
| `mes_sessions` | `end_time` | YO'Q (DB'da: `completed_at`) | SELECT 500 | GET /api/mes/sessions stats |
| `mes_sessions` | `pp_order_id` | YO'Q (DB'da: `production_order_id`) | INSERT 500 | POST /api/mes/sessions |
| `work_centers` | `hours_per_day` | `hours_per_day` — BOR | OK (mavjud) | — |
| `work_centers` | `name_ru` | `name_ru` — BOR | OK | — |
| `work_centers` | `efficiency_rate` | `efficiency_rate` — BOR (drift-migration qo'shdi) | OK | — |
| `production_orders` | `customer_name` | YO'Q (DB'da: `id, order_number, product_id, ...planned_quantity, ...`) | INSERT 500 | POST /api/erp/orders |
| `production_orders` | `due_date` | YO'Q (DB'da: `planned_end_date`) | INSERT 500 | POST /api/erp/orders |
| `production_orders` | `quantity` | `quantity` — BOR (ham bor) | OK | — |
| `warehouse_stock` | `material_card_id` | YO'Q (DB'da: `material_id`) | JOIN 500 | GET /api/wms/stock-*, GET /api/mm/materials |
| `bom_items` | `material_id` | `material_id` — BOR | OK | — |
| `bom_items` | `component_id` | `component_id` — BOR | OK (lekin kod `material_id` kutadi) | — |
| `erp_production_facts` | `fact_qty` | YO'Q (DB'da: `produced_qty`) | INSERT 500 | POST /api/erp/production-facts |
| `erp_production_facts` | `good_qty` | YO'Q | INSERT 500 | POST /api/erp/production-facts |
| `erp_production_facts` | `defect_qty` | `defect_qty` — YO'Q (DB'da: `produced_qty, shift_date, fact_date, order_id, machine_id`) | INSERT 500 | POST /api/erp/production-facts |
| `production_facts` (asosiy) | `planned_qty`, `actual_qty`, `variance`, `defects`, `notes` | `production_facts_sm72` jadvalida bor | 2 xil jadval nomi | GET /api/remaining/production-facts |

---

## DRIZZLE SCHEMA vs DB TAQQOSLASH

### 1. `material_cards`

**DB'dagi haqiqiy ustunlar:**
```
id, kod, xom_ashyo, xom_ashyo_ru, unit_of_measure, category, format_a, format_b,
grammage, current_stock, reserved_stock, available_stock, min_stock, max_stock,
reorder_point, unit_price, currency, last_purchase_price, last_purchase_date,
supplier_name, vendor_id, description, raw_material_id, warehouse_id, material_type,
storage_conditions, shelf_life_days, abc_segment, is_active, created_at, updated_at, barcode
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `name` — DB'da `xom_ashyo` (O'zbek) va `xom_ashyo_ru` (Rus)
- `name_ru` — DB'da `xom_ashyo_ru`
- `unit` — DB'da `unit_of_measure`
- `standard_cost` — umuman yo'q

**Drift manbalari (fayllar):**
- `apps/api/src/modules/erp/erp.repository.ts:37,134` — `UPDATE material_cards SET name=`, `INSERT INTO material_cards (code, name, name_ru, unit, standard_cost)` → barcha 4 ustun yo'q
- `apps/api/src/modules/erp/erp.repository.ts:46,54,63,71,97,105` — `mc.name AS product_name` → `name` ustuni yo'q
- `apps/api/src/modules/erp/erp-extra.repository.ts:59,60,68,113,114,122` — `mc.name AS` → `name` yo'q
- `apps/api/src/modules/erp/erp-reports.repository.ts:35,43` — `mc.name AS product_name`
- `apps/api/src/modules/pp/infrastructure/repositories/pp-planning.repository.ts:20` — `mc.name AS product_name`
- `apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts:133` — `mc.name AS material_name`
- `apps/api/src/modules/wms/presentation/wms-gateway-warehouses.controller.ts:176` — `mc.name`
- `apps/api/src/modules/qc/infrastructure/repositories/drizzle-qc.repo.ts:82` — `mc.name AS product_name`

**To'g'ri ishlatish (misol):** `apps/api/src/modules/erp/erp.repository.ts:20,28` — `mc.xom_ashyo AS name` — bu TO'G'RI yondashuv

**Tuzatish:** `mc.name` → `mc.xom_ashyo AS name` yoki `mc.xom_ashyo AS material_name`

---

### 2. `erp_daily_reports`

**DB'dagi haqiqiy ustunlar:**
```
id, report_date, department_id, data, created_at
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `work_center_id` — umuman yo'q
- `shift` — yo'q
- `planned_qty` — yo'q
- `actual_qty` — yo'q
- `updated_at` — yo'q

**Drift manbalari:**
- `erp-reports.repository.ts:18,26` — `JOIN work_centers wc ON wc.id = dr.work_center_id` → 500
- `erp-reports.repository.ts:135` — `INSERT INTO erp_daily_reports (work_center_id, report_date, shift, planned_qty, actual_qty)` → 500
- `erp-reports.repository.ts:142` — `UPDATE erp_daily_reports SET planned_qty=..., actual_qty=..., updated_at=NOW()` → 500

**Tuzatish:** DB'da `data JSONB` ustuni bor — barcha qo'shimcha ustunlar shu yerga sig'ishi mumkin, YOKI migration orqali ustunlar qo'shilsin.

---

### 3. `erp_downtime_logs`

**DB'dagi haqiqiy ustunlar:**
```
id, machine_id, reason, started_at, ended_at, duration_min, created_at
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `work_center_id` — yo'q (DB'da: `machine_id`)
- `duration_minutes` — yo'q (DB'da: `duration_min`)
- `resolved` — yo'q
- `reported_by` — yo'q
- `updated_at` — yo'q

**Drift manbalari:**
- `erp-reports.repository.ts:60,68` — `JOIN work_centers wc ON wc.id = dl.work_center_id` → 500
- `erp-reports.repository.ts:77` — `UPDATE erp_downtime_logs SET duration_minutes=..., resolved=..., updated_at=...` → 500
- `erp-reports.repository.ts:170` — `INSERT INTO erp_downtime_logs (work_center_id, ..., duration_minutes, resolved, reported_by)` → 500

**Tuzatish:** `work_center_id` → `machine_id`, `duration_minutes` → `duration_min`; `resolved`/`reported_by` uchun migration kerak.

---

### 4. `mes_sessions`

**DB'dagi haqiqiy ustunlar:**
```
id, status, defect_qty, quality_passed, started_at, completed_at, machine_id,
operator_id, created_at, updated_at, production_order_id, work_center_id, notes
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `start_time` — yo'q (DB'da: `started_at`)
- `end_time` — yo'q (DB'da: `completed_at`)
- `pp_order_id` — yo'q (DB'da: `production_order_id`)

**Drift manbalari:**
- `mes-production-sessions.repo.ts:25` — `ORDER BY ms.start_time DESC` → 500 (start_time yo'q)
- `mes-production-sessions.repo.ts:37` — `INSERT INTO mes_sessions (work_center_id, operator_id, pp_order_id, start_time, ...)` → 500
- `erp-extra.repository.ts:49` — `ms.end_time - ms.start_time` → 500

**Tuzatish:**
- `start_time` → `started_at`
- `end_time` → `completed_at`
- `pp_order_id` → `production_order_id`

---

### 5. `erp_production_facts`

**DB'dagi haqiqiy ustunlar:**
```
id, order_id, machine_id, product_id, work_center_id, produced_qty, shift_date, fact_date, created_at
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `fact_qty` — yo'q (DB'da: `produced_qty`)
- `good_qty` — yo'q
- `defect_qty` — yo'q (DB'da yo'q; `production_facts_sm72.defects` bor)

**Drift manbalari:**
- `erp-reports.repository.ts:163` — `INSERT INTO erp_production_facts (product_id, work_center_id, fact_date, fact_qty, good_qty, defect_qty)` → 500

**Tuzatish:** `fact_qty` → `produced_qty`; `good_qty`/`defect_qty` uchun migration yoki olib tashlash.

---

### 6. `production_orders`

**DB'dagi haqiqiy ustunlar (to'liq):**
```
id, order_number, product_id, bom_id, routing_id, sales_order_id, planned_quantity,
confirmed_quantity, scrap_quantity, order_type, status, planned_start_date, planned_end_date,
actual_start_date, actual_end_date, priority, work_center_id, production_type, defective_qty,
planned_cost, actual_cost, responsible_manager_id, shift_supervisor_id, qc_inspector_id,
notes, created_by, created_at, updated_at, deleted_at, scheduled_start, scheduled_end,
product_name, quantity, unit, actual_start, actual_end
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `customer_name` — yo'q
- `due_date` — yo'q (DB'da: `planned_end_date`)

**Drift manbalari:**
- `erp-extra.repository.ts:140` — `INSERT INTO production_orders (order_number, product_id, quantity, customer_name, due_date, ...)` → 500

**Tuzatish:** `customer_name` olib tashlash yoki migration, `due_date` → `planned_end_date`.

---

### 7. `warehouse_stock`

**DB'dagi haqiqiy ustunlar:**
```
id, warehouse_id, material_id, quantity, reserved_quantity, available_quantity,
unit_of_measure, last_updated_at, created_at, reorder_point, max_stock,
bin_location_id, last_movement_at, item_id, updated_at, unit
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `material_card_id` — yo'q (DB'da: `material_id`)

**Drift manbalari (eski `material_card_id` nomi ishlatilmoqda):**
- `wms/application/wms-catalog/stock-turnover.service.ts:25,64,105` — `ws.material_card_id = mc.id` → 500
- `wms/application/wms-catalog/dashboard.service.ts:16,41,49,51,101` — `ws.material_card_id` → 500
- `wms/application/wms-catalog/abc-aging-expiry.service.ts:21` — `ws.material_card_id` → 500
- `mm/infrastructure/repositories/mm-materials-extras.repository.ts:44-49,57` — `ws.material_card_id` → 500
- `wms/presentation/wms-warehouses.controller.ts:133,137` — `ws.material_card_id` → 500
- `wms/presentation/wms-gateway-warehouses.controller.ts:71,160,175,183,206,213` — `ws.material_card_id` → 500
- `wms/presentation/wms-gateway-inventory.controller.ts:246` — `ws.material_card_id` → 500
- `wms/infrastructure/repositories/wms-crud.repository.ts:162` — `ws.material_card_id` → 500

**Tuzatish:** `ws.material_card_id` → `ws.material_id` (barcha WMS fayllarida)

> **Eslatma:** `warehouse_stock.material_id` ustuni DB'da bor. Eski `material_card_id` nomini sprint tozalamagan.

---

### 8. `work_centers`

**DB'dagi haqiqiy ustunlar:**
```
id, code, name, name_ru, type, capacity, department_id, is_active, created_at,
deleted_at, hours_per_day, department, org_department_id, cost_per_hour,
certification_lms_course_id, updated_at, name_uz, required_skill_name,
capacity_per_hour, efficiency_rate
```

**Drizzle schema nomuvofiqliqlari:**
- `schema-manufacturing.ts:131-143` — `costPerHour: decimal('cost_per_hour')` → camelCase JS, snake_case DB → OK
- `schema-manufacturing.ts` — `certificationLmsCourseId: uuid('certification_lms_course_id')` → uuid tip, lekin DB'da integer → TIP FARQI

**Kod kutgan lekin DB'da YO'Q:**
- `schema-manufacturing.ts` — `id: uuid(...)` → DB'da `id` serial integer (PP `work_centers` ga qaralsa serial, manufacturing'da uuid)
- **2 TA DRIZZLE DEFINITION**: `schema-manufacturing.ts` (uuid PK) vs `schema-pp.ts` (serial PK) — DB'da faqat 1 ta `work_centers` jadval, u `serial` ishlatadi → `schema-manufacturing.ts` id noto'g'ri tip

**Yaxshi ishlatgan joylar:** `erp-extra.repository.ts:23` — `hours_per_day` → BOR

---

### 9. `production_facts` vs `production_facts_sm72`

**Muammo:** `remaining/production-facts.repository.ts` `production_facts_sm72` jadvalini ishlatadi.
DB'da `production_facts` jadvalida boshqa ustunlar bor:
```
id, papka_order_id, papka_no, planning_operation_id, sana, buyurtma_nomi,
bajarilgan_list_soni, brak, izoh, berilgan_bolim, operator1...operator4,
muammolar, plan_quantity, variance, variance_percent, brak_percent
```

`production_facts_sm72` esa: `id, papka_no, fact_date, operator_id, work_center_id, planned_qty, actual_qty, variance, defects, notes`

Repository `production_facts_sm72` ishlatadi — bu jadval DB'da bor, lekin `GET /api/erp/production-facts` (erp-reports.repository.ts) esa `erp_production_facts` ishlatadi va u `mc.name` so'raydi → `name` ustuni yo'qligi sababli 500.

---

## UMUMIY DRIFT PATTERN TAHLILI

### Pattern 1: `name` ustuni yo'q, `xom_ashyo` bor
- **Holat:** 8+ fayl `mc.name` yozadi, DB'da `material_cards.name` ustuni umuman yo'q
- **Kelib chiqishi:** `material_cards` jadval Uzbekcha nomlash (xom_ashyo = xom ashyo) bilan yaratilgan; keyingi sprint'larda agentlar `name` kutgan

### Pattern 2: `material_card_id` → `material_id` rename yarimta bajarildi
- **Holat:** `warehouse_stock` jadvalida ustun `material_id` ga o'zgartirildi, lekin 10+ fayl hali `material_card_id` ishlatadi
- **Sprint tarixi:** 2026-05-21 ultra-dedup sprint'da `material_card_id → material_id` repoint bajarildi, lekin WMS fayllari o'zgarmadi

### Pattern 3: ERP `erp_*` jadvallari kam ustun bilan yaratilgan
- `erp_daily_reports`, `erp_downtime_logs`, `erp_production_facts` — minimal ustunlar bilan DB'da bor, lekin kod ko'proq ustun kutadi
- **Muammo:** Drizzle migrations-drift.ts faylda bu ustunlar "ADD COLUMN IF NOT EXISTS" sifatida mavjud — demak migration yugurilmagan yoki o'tib ketgan

### Pattern 4: `mes_sessions` ustun nomlarining farqi
- DB: `started_at`, `completed_at`, `production_order_id`
- Kod: `start_time`, `end_time`, `pp_order_id`
- Schema-manufacturing.ts ni to'g'ri ko'rinadi (`started_at`) lekin raw SQL repo noto'g'ri

### Pattern 5: `work_centers` ikki Drizzle ta'rif
- `schema-manufacturing.ts`: `id: uuid` — noto'g'ri (DB'da serial int)
- `schema-pp.ts` (`ppWorkCenters`): `id: serial` — to'g'ri
- Bu ikkita Drizzle ta'rif bir jadvalga — TypeScript konflikti yo'q, lekin uuid vs int FK muammosi bor

---

## TUZATISH USTUVORLIGI

### P0 — Bevosita 500 xato beruvchilar

| Fayl | Qator | Muammo | Tuzatish |
|---|---|---|---|
| `erp.repository.ts` | 37 | `UPDATE material_cards SET name=`, `unit=` | `name→xom_ashyo`, `unit→unit_of_measure` |
| `erp.repository.ts` | 134 | `INSERT INTO material_cards (code, name, name_ru, unit, standard_cost)` | `name→xom_ashyo`, `name_ru→xom_ashyo_ru`, `unit→unit_of_measure`, `standard_cost` olib tashlash |
| `erp.repository.ts` | 46,54,63,71,97,105 | `mc.name AS product_name` (6 ta so'rov) | `mc.xom_ashyo AS product_name` |
| `erp-extra.repository.ts` | 59,60,68 | `mc.name AS product_name` | `mc.xom_ashyo AS product_name` |
| `erp-extra.repository.ts` | 113,114,122 | `mc.name AS material_name` | `mc.xom_ashyo AS material_name` |
| `erp-extra.repository.ts` | 140 | `customer_name, due_date` yo'q | olib tashlash yoki `planned_end_date` |
| `erp-reports.repository.ts` | 35,43 | `mc.name AS product_name` | `mc.xom_ashyo AS product_name` |
| `erp-reports.repository.ts` | 18,26,135,142 | `erp_daily_reports.work_center_id, shift, planned_qty` yo'q | Migration yoki kod tuzatish |
| `erp-reports.repository.ts` | 60,68,77,170 | `erp_downtime_logs.work_center_id, duration_minutes, resolved` yo'q | `work_center_id→machine_id`, `duration_minutes→duration_min` |
| `mes-production-sessions.repo.ts` | 25,37 | `start_time`, `pp_order_id` yo'q | `start_time→started_at`, `pp_order_id→production_order_id` |

### P1 — WMS `material_card_id` → `material_id` (10+ fayl)

| Fayl | Ta'sir |
|---|---|
| `wms/application/wms-catalog/stock-turnover.service.ts` | 3 ta so'rov 500 |
| `wms/application/wms-catalog/dashboard.service.ts` | 5 ta so'rov 500 |
| `wms/application/wms-catalog/abc-aging-expiry.service.ts` | 1 ta so'rov 500 |
| `mm/infrastructure/repositories/mm-materials-extras.repository.ts` | 5 ta so'rov 500 |
| `wms/presentation/wms-warehouses.controller.ts` | 2 ta so'rov 500 |
| `wms/presentation/wms-gateway-warehouses.controller.ts` | 6 ta so'rov 500 |
| `wms/presentation/wms-gateway-inventory.controller.ts` | 1 ta so'rov 500 |
| `wms/infrastructure/repositories/wms-crud.repository.ts` | 1 ta so'rov 500 |

**Tuzatish:** `ws.material_card_id` → `ws.material_id` (global replace P1 fayllarida)

### P2 — `erp_production_facts` ustun nomlari

| Fayl | Qator | Muammo |
|---|---|---|
| `erp-reports.repository.ts` | 163 | `fact_qty, good_qty, defect_qty` yo'q |

**Tuzatish:** `fact_qty → produced_qty`; `good_qty/defect_qty` uchun migration yoki olib tashlash

### P3 — `work_centers` uuid vs serial PK

| Fayl | Muammo |
|---|---|
| `schema-manufacturing.ts:131` | `id: uuid(...)` lekin DB'da serial integer |

**Tuzatish:** `schema-manufacturing.ts` da `id: uuid` ni `id: serial` ga o'zgartirish

---

### 10. `internal_requests` (qisman)

**DB'dagi haqiqiy ustunlar:**
```
id, request_no, request_type, requester_id, requester_name, department_id, material_id,
material_name, quantity, unit, urgency, status, notes, approved_by_id, approved_at,
issued_at, telegram_message_id, created_at, updated_at, org_department_id, warehouse_id,
item_id, requested_by
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `material_card_id` — yo'q (DB'da: `material_id`)
- `from_warehouse_id` — yo'q (DB'da: `warehouse_id`)

**Drift manbasi:**
- `remaining/material-balance.repository.ts:34` — `ir.material_card_id` va `ir.from_warehouse_id` → 500

**Tuzatish:** `ir.material_card_id → ir.material_id`, `ir.from_warehouse_id → ir.warehouse_id`

---

### 11. `mes_downtime_events` — JADVAL YO'Q

**Muammo:** `mes_downtime_events` jadvali DB'da UMUMAN YO'Q.

**Drift manbalari:**
- `mes-production-sessions.repo.ts:67` — `INSERT INTO mes_downtime_events (session_id, reason, duration_minutes, started_at, event_type)` → 500
- `mes-production-sessions.repo.ts:80` — `SELECT * FROM mes_downtime_events` → 500
- `mes-maintenance.repo.ts:96,106` — `mes_downtime_events` — 500

**Tuzatish:** Migration yoki `downtime_events` jadvaliga yo'naltirish (DB'da `downtime_events` bor)

---

### 12. `warehouse_stock_balance` — JADVAL YO'Q

**Muammo:** `warehouse_stock_balance` jadvali DB'da UMUMAN YO'Q.

**Drift manbasi:**
- `agents/inventory-agent.service.ts:65,80` — `FROM warehouse_stock_balance` → 500

**Tuzatish:** `warehouse_stock` jadvalidan o'qish yoki VIEW yaratish

---

### 13. `warehouse_batches` — ustun nomlar farqi

**DB'dagi haqiqiy ustunlar:**
```
id, warehouse_id, item_id, batch_number, quantity, received_at, created_at
```

**Kod kutgan (lekin DB'da YO'Q) ustunlar:**
- `material_card_id` — yo'q (DB'da: `item_id`)
- `remaining_quantity` — yo'q

**Drift manbalari:**
- `compatibility/warehouse-catalog.service.ts:56,63,70,83` — `wb.material_card_id` → 500
- `compatibility/warehouse-label.service.ts:67,74,91,108` — `wb.material_card_id` → 500

**Tuzatish:** `wb.material_card_id → wb.item_id`

---

## QO'SHIMCHA TEKSHIRUV ZARUR

Quyidagi jadvallar qisman tekshirildi — to'liq audit davom ettirish tavsiya qilinadi:

1. `crm_leads` / `crm_deals` — kod `name` ustunini ishlatadimi? (DB'da `crm_leads.name` bor)
2. `sd_customers` — kod `full_name` ishlatadimi? (DB'da `full_name` bor, lekin ba'zi so'rovlar `name` kutishi mumkin)
3. `positions` — `name` vs `name_uz`/`name_ru` drift (DB'da `name, name_uz, name_ru` hammasi bor)

---

## XULOSA

**Eng ko'p ta'sir qiladigan 3 ta drift:**

1. **`material_cards.name` yo'q** — 8+ fayl, 15+ endpoint, asosiy ism ustuni noto'g'ri → ERP modul butunlay ishlamaydi
2. **`warehouse_stock.material_card_id` yo'q** — 10+ fayl, WMS/MM moduli butunlay ishlamaydi
3. **`erp_daily_reports`/`erp_downtime_logs` qo'shimcha ustunlar yo'q** — ERP hisobot CRUD barcha o'qish/yozish operatsiyalari 500

**DB tuzatish vs Kod tuzatish:**
- `material_cards`: **Kod tuzatish** to'g'ri — DB original Uzbekcha nomlar (xom_ashyo) bilan to'g'ri, kod `name` kutib noto'g'ri so'raydi
- `warehouse_stock.material_card_id`: **Kod tuzatish** — DB `material_id` ga ko'chirilgan, kodlar yangilanmagan
- `erp_daily_reports` qo'shimcha ustunlar: **DB tuzatish** — migrations-drift.ts da bu ustunlar "ADD COLUMN" sifatida mavjud, boot'da run qilinishi kerak
- `mes_sessions` ustun nomlari: **Kod tuzatish** — DB to'g'ri (`started_at`), raw SQL noto'g'ri

*Tahlilchi: Claude Sonnet 4.6 | Holat: READ-ONLY, hech narsa o'zgartirilmadi*
