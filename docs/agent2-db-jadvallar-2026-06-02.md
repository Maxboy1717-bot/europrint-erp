# EuroPrint DB — HAMMA JADVAL INVENTARIZATSIYASI (agent2-db-jadvallar, 2026-06-02)

**FAQAT TAHLIL — read-only. Hech narsa o'chirilmadi/o'zgartirilmadi.**
Manba: jonli DB `europrint`@127.0.0.1:5432 (superuser=europrint, API shunga ulanadi) — `node _audit/q.cjs` orqali ANIQ `count(*)`;
Drizzle sxema 2 joydan (`lib/db/src/schema/**` + `apps/api/src/shared/db/schema-*.ts`) `pgTable(...)` regex bilan;
kod-reference `apps/api/src` + `lib` korpusida query-konteks (FROM/JOIN/INTO/`.from()`/`.insert()`/camelCase Drizzle obyekt) bilan tasdiqlangan.

> Bu hujjat agent2 vazifasi. Ombor bo'limi (1-8) `ombor-jadvallari-inventarizatsiya-2026-06-02.md` ni KENGAYTIRADI (qaytarmaydi); bu yerda butun BAZA miqyosi.

---

## 0. UMUMIY RAQAMLAR (ANIQ, count bilan)

| Ko'rsatkich | Son |
|---|---|
| **Base jadval** (relkind='r') | **953** |
| **Oddiy VIEW** (relkind='v') | **77** |
| **Materialized view** (relkind='m') | **3** (`mv_inventory_daily`, `mv_kpi_daily`, `mv_sales_monthly`) |
| **JAMI relation** | **1033** |
| Data bor jadval (>0 qator) | **117** (12%) |
| Bo'sh jadval (0 qator) | **836** (88%) |
| Jami qatorlar (hamma jadval) | **~17 900** |
| FK bilan bog'langan jadval | atigi **35** (180 FK) — baza deyarli bog'lanmagan |
| public sxema | 1 ta (hammasi `public` da) |

**Asosiy xulosa: baza QURILISH BOSQICHIDA.** 88% jadval bo'sh. Eng ko'p qator — audit jurnallari
(`audit_logs`=9193, `agents_audit_log`=3350, `daily_reports`=1890), biznes jadvallari kichik (eng kattasi
`position_permissions`=1380, `org_departments`=142, `warehouse_bins`=126). Bu memory `reference_live_db_location.md`
dagi "europrint BO'SH, migration kerak emas" xulosasini TASDIQLAYDI va kengaytiradi (4 rpt_×5 emas — aslida 117 jadvalda data bor).

### TOP-20 data bor jadval (qator soni)
`audit_logs`=9193 · `agents_audit_log`=3350 · `daily_reports`=1890 · `position_permissions`=1380 ·
`org_departments`=142 · `warehouse_bins`=126 · `org_functions`=97 · `positions`=96 · `hr_leave_balances`=90 ·
`hr_onboarding_milestones`=90 · `cc_rejection_reasons`=84 · `gamification_points`=77 · `kanban_time_tracks`=47 ·
`accounts`=42 · `audit_log`=36 · `cc_workflow_steps`=34 · `chat_messages`=34 · `notifications`=33 ·
`position_feature_flags`=32 · `users`=31.

---

## 1. KLASSIFIKATSIYA: ISHLAYDI / QISMAN-STUB(bo'sh) / YO'Q-BUZUQ(dead)

Query-konteks modeli bilan (eng ishonchli, false-positive/negativ tuzatilgan — pastdagi "Metodologiya" ga qarang):

| Toifa | Son | Ta'rif |
|---|---|---|
| **ISHLAYDI** (data + query) | **105** | qatori bor VA kod query qiladi → haqiqiy faol |
| **ISHLAYDI** (data, query boshqa yo'l) | **12** | qatori bor, lekin query faqat migration/Drizzle-obyekt orqali (korpus ajratuvi tashqarisi) — pastda ro'yxat, hammasi REAL |
| **QISMAN-STUB** (bo'sh + wired) | **692** | 0 qator, lekin kod query qiladi → "canonical-bo'sh", data kutilmoqda (qurilish) |
| **QISMAN** (bo'sh + faqat eslatma) | **75** | 0 qator, faqat izoh/migration/string da nomi bor, haqiqiy query yo'q |
| **YO'Q-BUZUQ (DEAD)** | **69** | 0 qator + query kodida UMUMAN ishlatilmagan → o'lik |
| **JAMI** | **953** | |
| ISHLAYDI yoki wired (LIVE) jami | **809** | query bor YOKI data bor |

### 1a. "Data bor, lekin query-korpusda topilmadi" (12) — HAMMASI REAL, dead EMAS
`crm_tasks`(5, migration-managed) · `employee_referrals`(15) · `fine_rules`(20, `fines-rebuild.sql` seed + `fineRules` obyekt) ·
`hr_brand_settings`(1) · `hr_onboarding_milestones`(90) · `hr_onboarding_processes`(30) · `hr_v2_daily_reports`(24) ·
`rpt_ishlab_chiqarish`(14) · `rpt_kassa_transactions`(14) · `rpt_kreditorlar`(14) · `rpt_ombor_qoldiq`(14) · `violation_catalog`(10).
→ `rpt_*` TASDIQLANDI: `financial-reports.repository.ts` ularni `omborQoldiq/kassaTransactions/...` Drizzle obyekt orqali o'qiydi.

---

## 2. O'LIK JADVALLAR (DEAD) — eng ishonchli ro'yxat

### 2a. ENG ISHONCHLI DEAD = bo'sh + Drizzle def YO'Q + query kodida yo'q (**48**)
Bu 48 ta — DB da bor, lekin (a) hech bir `pgTable(...)` def yo'q, (b) 0 qator, (c) query kodida ishlatilmaydi.
Faqat migration/DDL da yaratilgan, hech kim o'qimaydi → o'lik nomzodlar:

```
ai_interview_questions, ai_prompts, ai_providers_config, ai_report_insights, ai_tasks, ai_tasks_queue,
approval_workflow_approvals, approval_workflow_steps, approval_workflow_templates, approval_workflows,
audit_trail_log, batch_lot_movements, business_rules, cc_attachments, cc_branches, change_requests,
cost_objects, currency_transactions, deleted_records, document_lifecycle, document_lifecycle_history,
document_reversals, erp_roles, event_participants, exception_activities, exception_inbox, exception_types,
exchange_rates, fiscal_periods, hr_question_bank, hr_question_responses, kpi_results, posting_entries,
process_chains, role_dashboard_widgets, role_menus, role_ui_configs, room_bookings, rule_violations,
saved_filters, separation_of_duties_rules, sop_steps, sop_templates, status_change_history,
support_messages, validation_results, validation_rules, welcome_events
```

### 2b. DEAD lekin orphan Drizzle def bor (**21**) — bo'sh + query yo'q, lekin `pgTable` def osilib qolgan
```
document_route_steps, document_routes, document_routing_rules, enps_survey_responses, finance_payments,
integration_shifts, iot_devices, label_print_history, master_categories, material_supplier_ratings,
mes_operations, mm_drivers, mro_work_orders, pos_shift_audit, position_folder_content, pp_routing,
qc_ai_trend, qc_defects_extended, seven_function_kpis, seven_functions, warehouse_kpi_cache
```
→ DEAD jami = **69** (48 + 21). Bularni o'chirish xavfsiz (lekin egasi tasdig'i bilan; ba'zilari kelajak rejasi bo'lishi mumkin).

### 2c. "Bo'sh + faqat eslatma" (75) — DEAD emas, lekin DARDLI
Bular 0 qator, query yo'q, AMMO nomi izoh/migration/log-string da uchraydi (ya'ni kelajak uchun rejalashtirilgan
yoki yarim-stub). Misol: `lms_exam_*`, `ow_*` ba'zi (samples/surveys/work_orders), `qc_*` inspeksiyalar, `mro_*`,
`hr_tz2_*` to'plami. Bular "qurilmoqda, hali ulanmagan" toifasi.

---

## 3. VIEW lar (80 ta) — QAYSI BAZAGA ISHORA QILADI

**Eng muhim arxitektura: 75 ta "jadval" aslida VIEW (alohida jadval EMAS).** Drizzle da `pgTable('mm_materials',...)`
deb yozilgan, lekin DB da `mm_materials` = VIEW → `materials`. Bu compat-alias qatlami (memory `reference_schema_barrel_precedence.md`).
VIEW'ni MUSTAQIL o'chirmang — u canonical bazani o'qiydi.

### 3a. Compat-alias VIEW → canonical base (to'liq xarita, view_definition dan)

| VIEW (prefiks) | → o'qiydigan base |
|---|---|
| `mm_materials` | materials |
| `mm_goods_receipts/_items/_lines`, `mm_goods_issues/_items` | goods_receipts/_items/_lines, goods_issues/_items |
| `mm_purchase_orders/_items`, `mm_purchase_requisitions` | purchase_orders/_items, purchase_requisitions |
| `mm_vendors` | vendors · `mm_deliveries`→deliveries · `mm_driver_expenses`→driver_expenses |
| `wms_warehouses` | warehouses · `wms_inventory_counts`→inventory_counts · `wms_internal_requests`→internal_requests · `wms_exit_logs`→exit_logs |
| `pos_orders`, `pp_orders`, `ow_orders`, `sd_orders` | **orders** (4 view → 1 base) |
| `sd_sales_orders` | **sales_orders** (boshqa order-view'lardan farqli!) |
| `pos_inventory_counts`, `wms_inventory_counts` | **inventory_counts** (1 base + 2 view) |
| `pos_inventory_count_lines` | inventory_count_lines |
| `pos_warehouse_stock_view`, `current_stock` | **warehouse_stock** |
| `pos_stock_ledger` | stock_ledger · `pos_barcode_print_queue`→barcode_print_queue |
| `pos_movements_legacy_view` | material_movements (pos shaklga bridge) |
| `pos_products` | retail_pos_products · `retail_pos_transactions`→pos_transactions · `pos_audit_log`→audit_log · `pos_notifications`→notifications |
| `material_lots_view`, `ai_material_batches` | batch_lots (LEFT JOIN warehouse_bins), material_batches |
| `crm_deals` | deals · `crm_invoices`/`fi_invoices`/`sd_invoices`→invoices · `crm_products`→products · `crm_product_categories`→product_categories |
| `sd_leads` | leads · `sd_quotations`→quotations · `sd_payments`→payments · `sd_customer_*`(competitors/complaints/documents)→customer_* |
| `gl_entries` | entries · `fi_gl_documents`→gl_documents |
| `mes_papka_orders` | papka_orders · `mes_production_sessions`→production_sessions · `mes_shift_evaluations`→shift_evaluations · `mes_shift_handovers`→shift_handovers |
| `pp_mrp_runs` | mrp_runs · `pp_routing_operations`→routing_operations · `pp_work_centers`→work_centers |
| `lms_courses/_modules/_lessons/_tests/_questions/_enrollments/_certificates/_achievements/_assignments/_user_achievements` | courses/modules/lessons/tests/questions/enrollments/certificates/achievements/assignments/user_achievements |
| `hr_daily_reports`→daily_reports · `hr_applications`→applications · `hr_application_responses`→application_responses |
| `iot_sensor_readings`→sensor_readings · `shift_schedules`→shift_assignments(+users JOIN) |
| `asset_items`→asset_inventory · `mro_equipment`→equipment · `mro_budgets`→budgets · `mro_pm_schedules`→pm_schedules |
| `ai_interviews`→interviews · `cc_notifications`→notifications · `qc_certificates`→certificates |

### 3b. Materialized view (3) — bo'sh (hech qachon REFRESH qilinmagan)
`mv_inventory_daily`, `mv_kpi_daily`, `mv_sales_monthly` — 0 qator.

### 3c. ⚠️ MUHIM: order-jadval bo'linishi (data joylashuvi)
- `orders` base = **0 qator**; `sales_orders` base = **12 qator** (jonli).
- `sd_orders`/`pos_orders`/`pp_orders`/`ow_orders` VIEW lar `orders` ni o'qiydi → **BO'SH ko'rinadi**.
- `sd_sales_orders` VIEW `sales_orders` ni o'qiydi → **12 ta jonli buyurtmani ko'rsatadi**.
- Memory `session_2026-06-01_phase4_fanout.md` tasdiqlaydi: Phase 3 da `sales_orders` ga konvergentsiya bo'lgan,
  jonli buyurtma yaratish `execSdSalesOrderInsert` → `sales_orders`. **Demak `orders` base + uni o'qiydigan 4 view = amalda o'lik yo'nalish.**

---

## 4. DUBLIKAT JADVALLAR (semantik — view-alias dan tashqari ham)

`[V]` = VIEW (alohida jadval emas). Quyidagilar BIR maqsadda bir nechta base-jadval (haqiqiy fragmentatsiya):

| Semantik guruh | Jadvallar (base, [V]=view) | Izoh |
|---|---|---|
| **Mijoz** | `sd_customers`(9), `crm_companies`, `crm_contacts`, `customer_contacts`, `sd_customer_contacts`(8), `clients`, `customer_accounts` | 7 ta. Canonical=`sd_customers` (jonli, lekin AI `customers` kutadi — memory). `customers` jadvali UMUMAN YO'Q. |
| **Material lug'at** | `material_cards`(21), `materials`(0), `raw_materials`(0), `products`(0), `product_masters`(0), `retail_pos_products`(5), `public_products`(0) | Canonical=`material_cards`. `mm_materials`[V]→materials. |
| **Stok qoldiq** | `warehouse_stock`(24), `stocks`, `stock_items`, `wms_stock`, `wms_stock_levels`, `wms_inventory`, `mro_inventory`, `stock_ledger`(0), `current_stock`[V] | Canonical=`warehouse_stock`. 6 ta wms/stock = DEAD. |
| **Material harakati** | `pos_movements`(2), `material_movements`(3), `stock_movements`, `stock_moves`, `barcode_movements`, `wms_transactions`, `warehouse_transactions` | Canonical=`pos_movements`. |
| **Inventarizatsiya** | `inventory_counts`(6), `pos_inventory_counts`[V], `wms_inventory_counts`[V], `cycle_count_results` | "3 parallel" = 1 base + 2 VIEW! |
| **Partiya/Lot** | `batch_lots`(21), `batches`, `material_batches`, `warehouse_batches`, `wms_stock_batches` | Canonical=`batch_lots` (Drizzle def YO'Q — raw SQL!). |
| **Buyurtma** | `sales_orders`(12), `orders`(0), + view: `sd_orders`/`sd_sales_orders`/`ow_orders`/`pos_orders`/`pp_orders` + `customer_orders`, `orders_registry`, `sap_sales_orders` | 3-bo'limga qarang. Jonli=`sales_orders`. |
| **Invoice** | `invoices`(0) + view `crm_invoices`/`sd_invoices`/`fi_invoices` + base `finance_invoices`, `sales_invoices`, `vendor_invoices`, `purchase_invoices`, `billing_documents` | 5 ta haqiqiy base invoice jadvali — fragmentatsiya. |
| **Davomat** | `attendance`, `attendance_records`, `attendance_logs`, `daily_attendance_summary`, `hr_ai_attendance`, `hr_tz2_daily_attendance`, `security_attendance` | 7 ta, hammasi 0 qator. |
| **Ishlab-chiqarish fakti** | `production_fact`, `production_facts`, `production_facts_sm72`, `erp_production_facts` | 4 ta (singular+plural+sm72+erp_). |
| **Smena** | `shift_assignments`(30), `shifts`, `shift_calendars`, `erp_shift_calendars`, `integration_shifts` + view `shift_schedules`/`mes_shift_*` | Jonli=`shift_assignments`; `shift_schedules`[V]→shift_assignments. |
| **GL hujjat** | `gl_documents`(0), `entries`(0), `gl_journal_entries`, `posting_entries` + view `fi_gl_documents`/`gl_entries` | accounts=42 jonli (lug'at), hujjatlar bo'sh. |
| **Payroll** | `payroll`, `payroll_calculations`, `payroll_entries`, `payroll_rows`, `payroll_periods`(1), `fp_cycles`, `salary_history` | 7 ta payroll jadvali (memory: payroll_calculations dormant). |
| **Equipment/Aktiv** | `equipment`(0), `asset_inventory`(0), `employee_assets` + view `mro_equipment`/`asset_items` | 3 base + 2 view. |
| **Kanban vs Task** | `kanban_*`(boards=2,cards=2,columns=10) VA `task_*`(subtasks/projects/...) | IKKI parallel kanban tizimi (memory tasdiqlagan). |
| **ERP-prefiks (11)** | `erp_daily_reports`, `erp_downtime_logs`, `erp_employee_work_centers`, `erp_employees`, `erp_mrp_results`, `erp_mrp_runs`, `erp_production_facts`, `erp_production_plans`, `erp_purchase_requisitions`, `erp_roles`, `erp_shift_calendars` | HAMMASI 0 qator, DEAD/orphan — canonical (no-prefix) jadvallarning dublikati. |
| **WMS-prefiks base (8)** | `wms_alerts`, `wms_inventory`, `wms_production_supply`, `wms_stock`, `wms_stock_batches`, `wms_stock_levels`, `wms_transactions`, `wms_transfers` | `wms_warehouses`/`wms_inventory_counts`/`wms_internal_requests`/`wms_exit_logs` = VIEW; bular esa base, asosan DEAD. |
| **Bildirishnoma** | `notifications`(33) + view `pos_notifications`/`cc_notifications` + `notification_logs`, `notification_preferences` | Canonical=`notifications` (jonli). 2 alias view. |

**Dublikat xulosa:** "ko'rinma" dublikat juda ko'p (~250+), LEKIN aksariyati **VIEW-alias** (75) — alohida data emas.
HAQIQIY (base) semantik dublikat: ~16 yirik oila (mijoz×7, material×7, stok×9, harakat×7, invoice×9, davomat×7,
smena×5 base, payroll×7, ishlab-chiqarish-fakti×4, erp_×11, wms_×8, kanban-vs-task...). Aksariyat dublikatlar **bo'sh** —
ya'ni faqat struktura masalasi, ko'chadigan data YO'Q (memory: "MIGRATION KERAK EMAS").

---

## 5. DRIZZLE SXEMA ↔ DB MOSLIGI

| Ko'rsatkich | Son |
|---|---|
| Drizzle `pgTable` def — `lib/db/src/schema/**` | **694** (96 fayl) |
| Drizzle `pgTable` def — `apps/api/src/shared/db/schema-*.ts` | **427** (≈60 fayl: compat/ext/business/db-only-generated) |
| Drizzle def — UNION distinct | **962** |
| DB base jadval | 953 |
| **DB-only** (DB da bor, Drizzle def YO'Q) | **68** |
| **Drizzle-only** (def bor, DB da na jadval na view) | **2**: `hr_mentorship_pairings`, `hr_referrals` (fantom def) |
| **Drizzle def aslida VIEW ga ishora** (real jadval emas) | **75** |

### 5a. DB-only 68 — Drizzle pgTable def YO'Q (faqat raw SQL/migration bilan boshqariladi)
```
ai_interview_questions, ai_prompts, ai_providers_config, ai_report_insights, ai_tasks, ai_tasks_queue,
approval_workflow_approvals/_steps/_templates, approval_workflows, audit_trail_log, batch_lot_movements,
batch_lots, business_rules, cc_ai_sessions, cc_approvals, cc_attachments, cc_audit_trail, cc_basket_history,
cc_branches, cc_complaints, cc_delegations, cc_document_templates, cc_document_versions, cc_documents,
cc_notification_prefs, cc_print_log, cc_rejection_reasons, cc_user_pins, cc_workflow_steps, change_requests,
cost_objects, currency_transactions, daily_reports, deleted_records, designOrderMessages, designOrderNotifications,
document_lifecycle, document_lifecycle_history, document_reversals, erp_roles, event_participants,
exception_activities/_inbox/_types, exchange_rates, fiscal_periods, hr_question_bank, hr_question_responses,
kpi_results, lms_exam_answers, posting_entries, process_chains, role_dashboard_widgets, role_menus, role_ui_configs,
room_bookings, rule_violations, saved_filters, sd_order_departments, separation_of_duties_rules, sop_steps,
sop_templates, status_change_history, support_messages, validation_results, validation_rules, welcome_events
```
**Muhim:** DB-only ≠ dead. Ulardan **19 tasi JONLI** (raw SQL bilan query qilinadi): butun **CC (Communication-Center)** to'plami
(`cc_ai_sessions`, `cc_approvals`, `cc_audit_trail`, `cc_basket_history`, `cc_complaints`, `cc_delegations`,
`cc_document_templates`, `cc_document_versions`, `cc_documents`, `cc_notification_prefs`, `cc_print_log`,
`cc_rejection_reasons`(84), `cc_user_pins`, `cc_workflow_steps`(34)), `batch_lots`(21, ombor canonical!),
`daily_reports`(1890!), `designOrderMessages`/`designOrderNotifications` (camelCase quoted-identifier),
`sd_order_departments` (Phase-4 fan-out spine). → CC moduli butunlay raw-SQL bilan ishlaydi, Drizzle EMAS.
Qolgan 48 ta DB-only = DEAD (2a-bo'lim).

### 5b. CamelCase quoted-identifier jadvallar (2) — anomaliya
DB da `"designOrderMessages"`, `"designOrderNotifications"` (qo'shtirnoqli, camelCase) bor — snake_case konvensiyasini buzadi,
lekin JONLI (design moduli o'qiydi). Saqlang.

### 5c. Drizzle "barrel precedence" tasdiqi
`apps/api/src/shared/db/schema-*.ts` da `materials`, `mm_materials`, `wms_*`, `compat-*`, `ext-*`, `business-*` STUB def lari
bor; `@europrint/schemas` barrel ularni canonical (`lib/db`) ustidan resolve qiladi (memory `reference_schema_barrel_precedence.md`).
`schema-db-only-generated.ts` esa ataylab DB-only jadvallar uchun def beradi. **Runtime ustun-xato yo'q** chunki jonli DB = ADD-ONLY superset.

---

## 6. MODUL BO'YICHA GURUHLASH (prefiks/keyword evristikasi; taxminiy chegaralar)

| Modul | Jadval | Data bor | Qator | LIVE | DEAD |
|---|---|---|---|---|---|
| HR / Xodim | **175** | 37 | 754 | 157 | 3 |
| Boshqa / Other | 111 | 5 | 1955 | 93 | 10 |
| Audit / Sozlama / Tizim | 84 | 13 | **14402** | 47 | 28 |
| **Ombor / WMS / Material / Stok** | **80** | 13 | 259 | 73 | 3 |
| MES / Ishlab-chiqarish / PP | 74 | 1 | 10 | 71 | 2 |
| **CC / Aloqa markazi** | 67 | 10 | 229 | 62 | 3 |
| Moliya / Finance / GL | 53 | 7 | 113 | 41 | 6 |
| Kanban / Vazifa | 47 | 9 | 72 | 46 | 0 |
| CRM | 37 | 4 | 16 | 36 | 0 |
| Strategik / RACI / OKR | 35 | 6 | 49 | 29 | 5 |
| **POS / Kassir** | 34 | 4 | 16 | 24 | 1 |
| AI / Agent | 32 | 1 | 5 | 25 | 6 |
| IoT / Kamera / Sensor | 31 | 1 | 4 | 28 | 1 |
| LMS / O'qitish | 30 | 2 | 21 | 25 | 0 |
| SD / Sotuv | 25 | 4 | 36 | 25 | 0 |
| Order-Workflow (ow_) | 21 | 0 | 0 | 12 | 0 |
| Aktiv / MRO | 17 | 0 | 0 | 15 | 1 |

> Eslatma: bucketing keyword-bo'yicha — chegaralar taxminiy (masalan `orders`/`products` MES ga tushdi).
> "HR=175" — ERP dagi eng katta domen (hr_, hr_tz2_, hr_v2_, hr_capital_, employee_*, payroll, leave, shift, recruit...).
> "Audit=14402 qator" — `audit_logs`+`agents_audit_log`+`position_permissions` hisobiga.

### Ombor moduli (80 jadval) — kengaytma
`ombor-jadvallari-inventarizatsiya-2026-06-02.md` da batafsil. Bu yerda DB-miqyos qo'shimchasi:
- Ombor 80 jadvaldan **13 tasida data** (warehouse_bins=126, warehouse_stock=24, material_cards=21, batch_lots=21,
  warehouses=12, warehouse_types/zones/employees=9, material_categories=7, stock_transfer_lines=7, stock_transfers=5,
  inventory_counts=6, pos_movements/lines=2, material_movements=3). Qolgan 67 = bo'sh (canonical-wired yoki dead).
- `batch_lots` JONLI lekin Drizzle def YO'Q (raw SQL) — DB-only LIVE.
- Ombor DEAD (3): `warehouse_kpi_cache` + boshqalar (ombor doc 168-176 ro'yxati bilan mos).

### CC / Aloqa markazi (67 jadval) — yangi kashfiyot
- `cc_*` (kommunikatsiya-markazi) to'plami butunlay **raw SQL** bilan ishlaydi (Drizzle def yo'q), 10 jadvalda data:
  `cc_rejection_reasons`=84, `cc_workflow_steps`=34, `cc_document_templates`=14, `cc_ai_sessions`=3 va boshq.
- `chat_*` (14 jadval, Drizzle def bor) — `chat_messages`=34, `chat_members`=12, `chat_rooms`=6 jonli.
- → IKKI aloqa quyi-tizimi: `cc_*` (hujjat-workflow, raw SQL) + `chat_*` (messenjer, Drizzle).
  Manba: `communication-center-roadmap.md`.

---

## 7. ENG KATTA "FANTOM/STUB" GURUHLAR (egasi e'tibori uchun)

1. **75 view-alias** — `pgTable` da "jadval" deb ko'rinadi, aslida VIEW. O'chirmang; canonical bazani o'qiydi.
2. **48 DB-only DEAD** — Drizzle def yo'q + bo'sh + query yo'q (2a). O'chirish xavfsiz (egasi tasdig'i bilan).
3. **21 orphan Drizzle def DEAD** — def osilgan, jadval bo'sh, query yo'q (2b).
4. **11 `erp_*`** — canonical jadvallarning prefiksli dublikati, hammasi bo'sh, DEAD.
5. **2 fantom Drizzle def** (`hr_mentorship_pairings`, `hr_referrals`) — na DB jadval na view; def-only.
6. **3 bo'sh matview** — hech qachon refresh qilinmagan.

---

## 8. METODOLOGIYA va CHEKLOVLAR (verify-don't-trust)

- **Qator soni**: har jadval uchun ANIQ `count(*)` (953 ta query). `pg_stat_user_tables.n_live_tup` va `pg_class.reltuples`
  ESTIMATE lari STALE edi (n_live_tup faqat 23 nonzero ko'rsatdi, reltuples 27) — ulardan FOYDALANILMADI. Haqiqiy = **117 nonzero**.
- **DEAD/LIVE**: 3 bosqichli evolyutsiya bilan tuzatildi:
  1. Qattiq (faqat `"x"`/`.x` quoted) → 584 "dead" — XATO (raw SQL `FROM x` ni o'tkazib yubordi; misol: Phase-4 `ow_*` jadvallar `INSERT INTO ow_tech_cards` bilan ishlatiladi, lekin "dead" deb belgilangandi).
  2. Yumshoq (har qanday token) → 17 dead — juda kam (izoh/string ni ham hisobladi).
  3. **Query-konteks (yakuniy)**: `FROM/JOIN/INTO/UPDATE/DELETE FROM <t>` + `.from()/.insert()/.update()/.delete(<camelObj>)` + camelCase obyekt `.`/`,`/`)` → **69 dead**, false-pos/neg minimal. Korpus: query kod (schema-def + migration + invariants ALOHIDA, ular "yaratish" ≠ "ishlatish").
- **Cheklov**: "data bor lekin query-korpusda yo'q" 12 ta — bular migration-seed yoki Drizzle-obyekt orqali o'qiladi (korpus ajratuvi tufayli ko'rinmadi); QO'LDA tekshirildi → hammasi REAL (1a-bo'lim).
- **VIEW→base**: hamma 77 view'ning `view_definition` o'qildi; `FROM <base>` aniq ajratildi (3-bo'lim).
- **Drizzle**: 2 joy (`lib/db` + `apps/api/shared/db`) `pgTable('name',...)` regex; UNION distinct = 962.
- **Brauzer ishlatilmadi** — hammasi DB + kod (fayl:satr) bilan. UI holati uchun mavjud docs ga tayanildi.
- Bu hujjat — FAQAT tahlil. **Hech narsa o'chirilmadi/o'zgartirilmadi.** Keyingi qadam egasi tasdig'idan keyin.

---

## XULOSA (egasi uchun)

EuroPrint `europrint` DB = **953 base jadval + 80 view (77 oddiy + 3 matview) = 1033 relation**, lekin **88% (836) bo'sh** —
baza qurilish bosqichida (memory tasdig'i: migration kerak emas, ko'chadigan data yo'q). Faqat **117 jadvalda data** (~17 900 qator,
asosan audit jurnali). **75 ta "jadval" aslida VIEW** (compat-alias → canonical base); **68 jadval Drizzle def-siz** (raw SQL, shundan
butun CC moduli + `batch_lots` + `daily_reports` JONLI); atigi **2 fantom Drizzle def**. **DEAD (o'chsa bo'ladigan): 69** (48 eng ishonchli + 21 orphan-def);
HAQIQIY semantik dublikat ~16 oila (mijoz×7, material×7, stok×9, invoice×9, davomat×7, smena, payroll, erp_×11...), aksariyati bo'sh = struktura masalasi.
Order-jadval bo'linishi tasdiqlandi: jonli buyurtma `sales_orders`(12) da, `orders` base(0) + uni o'qiydigan 4 view amalda o'lik yo'nalish.
