# EuroPrint ERP — Hamma GET Endpoint Status Katalogi
**Sana:** 2026-06-02 | **Backend:** localhost:3030 (NestJS/Fastify) | **Auth:** admin / super_admin roli  
**DB:** postgres@localhost:5432/europrint | **Controller soni:** 341 | **Prefix soni:** 274

---

## JAMI STATISTIKA

| Status | Belgi | Son |
|---|---|---|
| 200 (real data) | ✅ | 18 |
| 200 (bo'sh — DB jadval bo'sh) | ⚠️ | 31 |
| 200 (ma'lumotli) | ✅ | 14 |
| 400 (BAD_REQUEST — param kerak) | 🔵 | 4 |
| 404 (NOT_FOUND — route yo'q) | 🟠 | 80+ |
| 503 (SERVICE_UNAVAILABLE — DB drift) | ❌ | 9 |
| 200 ok=false (EXTERNAL_SERVICE xato) | ❌ | 5 |

**Tekshirilgan endpoint:** ~130  
**Ishlaydi (200+data):** ~32  
**Ishlamaydi (5xx / ok=false):** 14  
**Route yo'q (404):** ~80  

---

## MODUL BO'YICHA

### ERP Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/erp/production-facts | ❌ 200/ok=false | EXTERNAL_SERVICE | SQL: `erp_production_facts.papka_no` va `operator_id` ustunlari DB'da yo'q (faqat 9 ustun, kodni 11 ta kutadi) |
| GET /api/erp/production-plans | ❌ 200/ok=false | EXTERNAL_SERVICE | SQL: `material_cards` JOIN, lekin production_plans JOIN noto'g'ri |
| GET /api/erp/daily-reports | ❌ 200/ok=false | EXTERNAL_SERVICE | SQL: `erp_daily_reports` → `work_centers` JOIN col drift |
| GET /api/erp/downtime-logs | ❌ 200/ok=false | EXTERNAL_SERVICE | SQL: `erp_downtime_logs` → `work_centers` JOIN col drift |
| GET /api/erp/capacity | ❌ 503 | DB drift | SQL: `work_centers.hours_per_day`, `mes_sessions.status` col drift |
| GET /api/erp/products | ✅ 200 | Real data (9 ta material) | material_cards alias |
| GET /api/erp/orders | ❌ 200/ok=false | EXTERNAL_SERVICE | `production_orders` → `material_cards` JOIN col drift |
| GET /api/erp/overview | 🟠 404 | Route yo'q | Controller yozilmagan |
| GET /api/erp/kpi | 🟠 404 | Route yo'q | Controller yozilmagan |
| GET /api/erp/machines | 🟠 404 | Route yo'q | Controller yozilmagan |
| GET /api/erp/shifts | 🟠 404 | Route yo'q | Controller yozilmagan |
| GET /api/erp/reports | 🟠 404 | Route yo'q | Controller yozilmagan |

### PP (Production Planning) Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/pp/crp | ✅ 200 | Bo'sh (work_centers=0) | Real DB, jadval bo'sh |
| GET /api/pp/work-centers | ✅ 200 | Bo'sh `[]` | Real DB, work_centers bo'sh |
| GET /api/pp/orders | ✅ 200 | Bo'sh paginated | Real DB, bo'sh |
| GET /api/pp/routing | ✅ 200 | Bo'sh paginated | Real DB, bo'sh |
| GET /api/pp/production-orders | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/pp/bom | ❌ 503 | SERVICE_UNAVAILABLE | `Cannot read properties of undefined (reading 'message')` — null pointer, BOM table/service xato |
| GET /api/pp/mrp | 🟠 404 | Route yo'q | — |
| GET /api/pp/planning | 🟠 404 | Route yo'q | — |
| GET /api/pp/routing-operations | 🟠 404 | Route yo'q | — |
| GET /api/pp/capacity | 🟠 404 | Route yo'q | — |

### MES (Manufacturing Execution) Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/mes/sessions | ✅ 200 | Bo'sh `{items:[],total:0}` | Real DB |
| GET /api/mes/oee | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/mes/operations | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/mes/shifts | ❌ 503 | DB drift | `mes_shift_handovers` → `employees.assigned_to` JOIN col yo'q DB'da (jadval 19 ustun lekin `assigned_to` yo'q) |
| GET /api/mes/maintenance | ❌ 503 | DB drift | `mes_maintenance_requests.assigned_to` va `work_center_id` DB'da yo'q (12 ustun, kod 14 ta kutadi) |
| GET /api/mes/production-orders | 🟠 404 | Route yo'q | — |
| GET /api/mes/downtime | 🟠 404 | Route yo'q | — |
| GET /api/mes/telemetry | 🟠 404 | Route yo'q | — |

### WMS/Ombor Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/wms/warehouses | ✅ 200 | Real data (19 ombor) | Real DB |
| GET /api/wms/stock | ✅ 200 | Real data (1 qator) | warehouse_stock |
| GET /api/wms/inventory | ✅ 200 | Real data (1 qator) | warehouse_stock (alias) |
| GET /api/wms/movements | ✅ 200 | Real data (2 qator) | material_movements |
| GET /api/wms/transactions | ❌ 503 | DB drift | `wms_transactions.deleted_at` ustuni DB'da yo'q; `mm_materials` JOIN `e.full_name` drift |
| GET /api/wms/inventory/materials | 🔵 400 | BAD_REQUEST | materialId param kerak |
| GET /api/wms/overview | 🟠 404 | Route yo'q | — |
| GET /api/wms/lot-traceability | 🟠 404 | Route yo'q | — |
| GET /api/inventory/materials | ✅ 200 | Bo'sh | Real DB |
| GET /api/inventory/rolls | 🟠 404 | Route yo'q | — |
| GET /api/warehouse/rolls | 🟠 404 | Route yo'q | — |
| GET /api/warehouse/stock | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/raw-materials | ✅ 200 | Real data (material_cards alias) | 9 ta material |

### POS Monitor Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/pos/stock | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/pos/movements | ✅ 200 | Real data (pos_movements) | 1 ta harakat |
| GET /api/pos/inventory-counts | ✅ 200 | Real data (6 ta) | pos_inventory_counts |
| GET /api/pos/requests | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/pos/gl/pending | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/pos/wms/warehouse/1/stock | ✅ 200 | Real data | 5 ta material |
| GET /api/pos/printer-config | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/pos-v2/inventory-counts | ❌ 503 | DB error | "Database error" — v2 versiyasi boshqa jadval ishlatadi |
| GET /api/pos/warehouses | 🟠 404 | Route yo'q | — |
| GET /api/pos/barcode/TEST123 | 🟠 404 | Route yo'q | barcode endpoint prefix boshqacha |
| GET /api/pos/reports | 🟠 404 | Route yo'q | — |

### Finance Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/finance/gl | ❌ 503 | SERVICE_UNAVAILABLE | `gl_journal_entries` jadval bo'sh + findGlEntries query xato |
| GET /api/finance/gl/trial-balance | ✅ 200 | Real (debit:0,credit:0) | Jadval bo'sh → 0 |
| GET /api/finance/gl/ledger/0100 | ✅ 200 | Bo'sh `[]` | GL ledger bo'sh |
| GET /api/finance/ratios | ❌ 503 | SERVICE_UNAVAILABLE | "Ichki server xatosi" — ratios service balance sheet 0 qatorga bo'linish xatosi |
| GET /api/finance/payments | ✅ 200 | Bo'sh paginated | Real DB, bo'sh |
| GET /api/finance/invoices | ✅ 200 | Bo'sh paginated | Real DB, bo'sh |
| GET /api/finance/accounts | ✅ 200 | Real data (42 ta CoA) | gl_chart_of_accounts real |
| GET /api/finance/budget | ✅ 200 | Bo'sh `{data:[]}` | Real DB |
| GET /api/finance/budgets | ✅ 200 | Bo'sh `{items:[]}` | Real DB |
| GET /api/finance/cfo-config | ✅ 200 | Real data (11 config) | cfo_config jadval |
| GET /api/finance/accounting | ✅ 200 | Real (all zeros) | Aggregat SQL, bo'sh ma'lumot |
| GET /api/finance/break-even | 🔵 400 | BAD_REQUEST | `productName` query param majburiy |
| GET /api/budgets | ✅ 200 | Bo'sh | Real DB (boshqa prefix) |
| GET /api/finance/trial-balance | 🟠 404 | Route yo'q | Togri: /api/finance/gl/trial-balance |
| GET /api/finance/cashflow | 🟠 404 | Route yo'q | — |
| GET /api/finance/advance | 🟠 404 | Route yo'q | — |
| GET /api/finance/standard-cost | 🟠 404 | Route yo'q | — |
| GET /api/finance/cashflow-forecast | 🟠 404 | Route yo'q | — |
| GET /api/finance/order-costing | 🟠 404 | Route yo'q | — |
| GET /api/finance/pricing | 🟠 404 | Route yo'q | — |
| GET /api/finance/variance | 🟠 404 | Route yo'q | — |
| GET /api/finance/payroll/list | 🟠 404 | Route yo'q | To'g'ri: /api/finance-extended/... |

### HR Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/hr/employees | ✅ 200 | Real data (30 xodim) | employees jadval |
| GET /api/hr/departments | ⚠️ 200 | Noto'g'ri data | 18 ta bo'lim, lekin `name=null` — org_departments.name col drift |
| GET /api/hr/positions | ⚠️ 200 | Noto'g'ri data | 96 ta lavozim, lekin `name=null` — positions.name col drift |
| GET /api/hr/leave-requests | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/hr/recruitment | ✅ 200 | Real data (5 kandidat) | recruitment_funnel |
| GET /api/hr/payroll | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/hr/attendance | ✅ 200 | Bo'sh `{data:{ok:true,data:[]}}` | Real DB |
| GET /api/hr/kpi | 🟠 404 | Route yo'q | — |
| GET /api/hr/performance | 🟠 404 | Route yo'q | — |
| GET /api/hr/career-path | 🟠 404 | Route yo'q | — |
| GET /api/hr/skills-matrix | 🟠 404 | Route yo'q | — |
| GET /api/hr/recruitment/offers | 🟠 404 | Route yo'q | — |
| GET /api/hr/telegram-bots | 🟠 404 | Route yo'q | — |
| GET /api/hr/inspection | 🟠 404 | Route yo'q | — |

### SD (Sales Distribution) Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/sd/customers | ✅ 200 | Real data (3 mijoz) | sd_customers |
| GET /api/sd/orders | ✅ 200 | Real data (7 buyurtma) | sd_sales_orders |
| GET /api/sd/invoices | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/sd/payments | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/sd/deliveries | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/sd/contracts | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/sd/leads | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/sales-orders | ✅ 200 | Real data (7 buyurtma) | sd_sales_orders (alias) |
| GET /api/sd/price-lists | 🟠 404 | Route yo'q | — |
| GET /api/sd/products | 🟠 404 | Route yo'q | — |
| GET /api/sd/discounts | 🟠 404 | Route yo'q | — |
| GET /api/sd/dashboard | 🟠 404 | Route yo'q | — |

### CRM Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/crm/leads | ✅ 200 | Real data (5 ta lead) | crm_leads |
| GET /api/crm/deals | ✅ 200 | Bo'sh `{data:[],total:0}` | Real DB |
| GET /api/crm/contacts | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/crm/activities | ✅ 200 | Real data (2 ta) | crm_activities |
| GET /api/crm/followup-activities | ✅ 200 | Real data | crm_followup_activities |
| GET /api/crm/custom-fields | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/crm/pipelines | 🟠 404 | Route yo'q | — |
| GET /api/crm/reports | 🟠 404 | Route yo'q | — |
| GET /api/crm/analytics | 🟠 404 | Route yo'q | — |
| GET /api/crm/communications | 🟠 404 | Route yo'q | — |
| GET /api/crm/extras | 🟠 404 | Route yo'q | — |

### QC (Quality Control) Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/qc/inspections | ✅ 200 | Bo'sh `{items:[],total:0}` | Real DB |
| GET /api/qc/defects | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/qc/standards | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/qc/reclamations | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/qc/reports | 🟠 404 | Route yo'q | — |

### Marketing Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/marketing/nps | ✅ 200 | Real data (NPS ma'lumotlar) | nps_surveys |
| GET /api/marketing/campaigns | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/marketing/leads | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/marketing/budget | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/marketing/calendar | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/marketing/analytics | 🟠 404 | Route yo'q | — |
| GET /api/marketing/hot-leads | 🟠 404 | Route yo'q | — |
| GET /api/marketing/blog | 🟠 404 | Route yo'q | — |

### Director Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/director/dashboard | ✅ 200 | Real aggregate | orders/hr/alerts real SQL |
| GET /api/director/kpi | ✅ 200 | Real (all zeros — bo'sh DB) | Real SQL |
| GET /api/director/approvals | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/approval-workflow | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/director/coordination | 🟠 404 | Route yo'q | — |
| GET /api/director/okr | 🟠 404 | Route yo'q | — |
| GET /api/director/strategic | 🟠 404 | Route yo'q | — |
| GET /api/director/zno | 🟠 404 | Route yo'q | — |
| GET /api/director/zvs | 🟠 404 | Route yo'q | — |
| GET /api/director/kaizen | 🟠 404 | Route yo'q | — |

### Admin/Auth Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/admin/users | ✅ 200 | Real data (31 user) | users jadval |
| GET /api/admin/settings | ✅ 200 | Real config | admin_settings |
| GET /api/admin/cron-status | ✅ 200 | Real (42 job) | cron_state |
| GET /api/notifications | ✅ 200 | Real data | notifications jadval |
| GET /api/org-functions | ✅ 200 | Real data (org funksiyalar) | org_functions |
| GET /api/safety-violations | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/cameras | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/achievements | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/calendar-events | ✅ 200 | Bo'sh `[]` | Real DB |
| GET /api/integration/mro | ✅ 200 | Real (all zeros) | Real SQL |
| GET /api/design | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/design/statistics | ✅ 200 | Real (all zeros) | Real SQL |
| GET /api/security | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/users | ✅ 200 | Bo'sh `[]` | Real DB (eski endpoint) |
| GET /api/health | 🟠 404 | Route yo'q | Healthcheck /api bilan emas boshqa |
| GET /api/auth/profile | 🟠 404 | Route yo'q | — |
| GET /api/settings | 🟠 404 | Route yo'q | — |
| GET /api/audit-log | 🟠 404 | Route yo'q | — |
| GET /api/admin/queue | 🟠 404 | Route yo'q | — |

### Kanban/LMS Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/kanban/boards | ✅ 200 | Real data (1 board) | kanban_boards |
| GET /api/kanban/cards | ✅ 200 | Bo'sh paginated | Real DB |
| GET /api/lms/courses | ✅ 200 | Bo'sh `{items:[],total:0}` | Real DB |
| GET /api/courses | ✅ 200 | Bo'sh paginated | Real DB (alias) |
| GET /api/iot/sensors | ✅ 200 | Bo'sh `{sensors:[],total:0}` | Real DB |

### IoT/AI Moduli
| Endpoint | Status | Javob turi | Aniq sabab |
|---|---|---|---|
| GET /api/iot/sensors | ✅ 200 | Bo'sh | Real DB |
| GET /api/iot/camera/* | 🟠 404 | Route yo'q | camera controller prefix boshqa |
| GET /api/ai/* | 🟠 404 | Route yo'q | AI routes faqat POST |
| GET /api/order-workflow/orders | ✅ 200 | Bo'sh paginated | Real DB |

---

## XATO ENDPOINTLAR TO'LIQ RO'YXATI (5xx / ok=false)

| Endpoint | Status | Aniq sabab |
|---|---|---|
| GET /api/erp/production-facts | ❌ 200/ok=false | `erp_production_facts`: `papka_no`, `operator_id` ustunlari DB'da yo'q |
| GET /api/erp/production-plans | ❌ 200/ok=false | `erp_production_plans` → `material_cards` JOIN col drift |
| GET /api/erp/daily-reports | ❌ 200/ok=false | `erp_daily_reports` → `work_centers` JOIN col drift |
| GET /api/erp/downtime-logs | ❌ 200/ok=false | `erp_downtime_logs` → `work_centers` JOIN col drift |
| GET /api/erp/capacity | ❌ 503 | `work_centers.hours_per_day` + `mes_sessions.status` col drift |
| GET /api/erp/orders | ❌ 200/ok=false | `production_orders` → `material_cards` JOIN col drift |
| GET /api/pp/bom | ❌ 503 | NullPointerException — `Cannot read properties of undefined (reading 'message')` |
| GET /api/mes/shifts | ❌ 503 | `mes_shift_handovers.assigned_to` DB'da yo'q (faqat 19 ustun, kod ko'proq kutadi) |
| GET /api/mes/maintenance | ❌ 503 | `mes_maintenance_requests.assigned_to` va `work_center_id` DB'da yo'q |
| GET /api/wms/transactions | ❌ 503 | `wms_transactions.deleted_at` DB'da yo'q (11 ustun, kod 12 ta kutadi) |
| GET /api/finance/gl | ❌ 503 | `gl_journal_entries` jadval bo'sh + findGlEntries CQRS handler exception |
| GET /api/finance/ratios | ❌ 503 | FinancialRatiosService bo'sh balance-sheet'ga bo'lish = internal error |
| GET /api/pos-v2/inventory-counts | ❌ 503 | "Database error" — pos-v2 prefix boshqa jadval ishlatadi |

---

## BO'SH JAVOB ENDPOINTLAR (200 + bo'sh)

| Endpoint | Jadval | Izoh |
|---|---|---|
| GET /api/pp/crp | pp_work_centers | work_centers jadval bo'sh |
| GET /api/pp/work-centers | work_centers | Bo'sh |
| GET /api/pp/orders | pp_production_orders | Bo'sh |
| GET /api/pp/routing | pp_routing_operations | Bo'sh |
| GET /api/mes/sessions | mes_sessions | Bo'sh |
| GET /api/mes/oee | mes_oee | Bo'sh |
| GET /api/mes/operations | mes_operations | Bo'sh |
| GET /api/wms/inventory | warehouse_stock | 1 qator (real) |
| GET /api/wms/stock | warehouse_stock | 1 qator (real) |
| GET /api/inventory/materials | mm_materials | Bo'sh |
| GET /api/finance/payments | ar_payments | Bo'sh |
| GET /api/finance/invoices | ar_invoices | Bo'sh |
| GET /api/finance/budget | finance_budgets | Bo'sh |
| GET /api/finance/budgets | finance_budgets | Bo'sh |
| GET /api/hr/leave-requests | leave_requests | Bo'sh |
| GET /api/hr/payroll | payroll_records | Bo'sh |
| GET /api/hr/attendance | attendance | Bo'sh |
| GET /api/sd/invoices | sd_invoices | Bo'sh |
| GET /api/sd/payments | sd_payments | Bo'sh |
| GET /api/sd/deliveries | sd_deliveries | Bo'sh |
| GET /api/crm/deals | crm_deals | Bo'sh |
| GET /api/crm/contacts | crm_contacts | Bo'sh |
| GET /api/qc/inspections | qc_inspections | Bo'sh |
| GET /api/qc/defects | qc_defects | Bo'sh |
| GET /api/qc/standards | qc_standards | Bo'sh |
| GET /api/qc/reclamations | qc_reclamations | Bo'sh |
| GET /api/marketing/campaigns | marketing_campaigns | Bo'sh |
| GET /api/marketing/leads | marketing_leads | Bo'sh |
| GET /api/lms/courses | lms_courses | Bo'sh |
| GET /api/kanban/cards | kanban_cards | Bo'sh |

---

## NOTO'G'RI DATA ENDPOINTLAR (200 + NULL fieldlar)

| Endpoint | Muammo | Sabab |
|---|---|---|
| GET /api/hr/departments | `name=null` (18/18 ta) | `org_departments.name` col drift — jadvalda `name_uz`/`name_ru` bor, `name` yo'q |
| GET /api/hr/positions | `name=null` (96/96 ta) | `positions.name` col drift — `name_uz`/`name_ru` bor |

---

## DB HOLATI

```
Jami jadvallar: 1032 (public schema)
Ma'lumotli jadvallar (n_live_tup > 0): 23 ta

Top 10 jadval (row count):
1. agents_audit_log      — 3735 qator (AI agent loglar)
2. daily_reports         — 2372 qator (kundalik hisobotlar)
3. audit_logs            — 836 qator
4. hr_leave_balances     — 90 qator
5. gamification_points   — 48 qator
6. users                 — 31 qator
7. absence_tracking      — 30 qator
8. cfo_config            — 11 qator
9. warehouse_types       — 9 qator
10. rpt_* jadvallar      — 5 qatordan

Bo'sh muhim jadvallar:
- gl_journal_entries     — 0 qator (finance/gl 503 sababi)
- gl_entries             — 0 qator
- work_centers           — 0 qator (PP/MES/ERP bo'sh sababi)
- mes_sessions           — 0 qator
- sd_invoices            — 0 qator
- crm_deals              — 0 qator
```

---

## DRIFT (DB USTUN YO'Q) SABAB BO'LGAN XATOLAR

| Endpoint | Jadval | Yo'q ustun | Kod kutayotgan |
|---|---|---|---|
| /api/erp/production-facts | erp_production_facts | `papka_no`, `operator_id` | SQL da ko'rsatilgan |
| /api/mes/maintenance | mes_maintenance_requests | `assigned_to`, `work_center_id` | SQL JOIN da |
| /api/mes/shifts | mes_shift_handovers | `assigned_to` join | SQL JOIN da |
| /api/wms/transactions | wms_transactions | `deleted_at` | WHERE clause da |
| /api/hr/departments | org_departments | `name` (faqat `name_uz`/`name_ru` bor) | SELECT da |
| /api/hr/positions | positions | `name` (faqat `name_uz`/`name_ru` bor) | SELECT da |
| /api/erp/capacity | work_centers | `hours_per_day` | SELECT da |

---

## ENG MUAMMOLI MODULLAR (Prioritet tartibida)

1. **ERP Moduli** — 6 ta xato (production-facts/plans/daily-reports/downtime-logs/capacity/orders); asosiy sabab: `material_cards` JOIN + `erp_*` jadval ustun drift
2. **Finance Moduli** — 2 ta kritik xato (GL + ratios); GL jadval bo'sh + ratios bo'linish xato; plus 8 ta yo'q route
3. **MES Moduli** — 2 ta drift (shifts + maintenance); `assigned_to`, `work_center_id` yo'q
4. **WMS Moduli** — 1 ta drift (transactions); `deleted_at` yo'q
5. **HR Moduli** — 2 ta NULL data (departments + positions); `name` o'rniga `name_uz`/`name_ru`

---

## TAVSIYALAR (P0 → P3)

### P0 — Tezkor fix (drift ustun qo'shish)
1. `mes_maintenance_requests`: `ADD COLUMN assigned_to int REFERENCES employees(id)`, `ADD COLUMN work_center_id int REFERENCES work_centers(id)`
2. `wms_transactions`: `ADD COLUMN deleted_at timestamptz`
3. `mes_shift_handovers`: `assigned_to` JOIN ishlatilishi tekshirilsin (outgoing_supervisor/incoming_supervisor to'g'ri nom)
4. `erp_production_facts`: `papka_no`, `operator_id` ustunlari qo'shilsin yoki SQL tuzatilsin

### P1 — HR NULL fix
5. `hr/departments` va `hr/positions` servisida `name_uz` → `name` alias qo'shilsin

### P2 — Finance GL
6. `finance/gl` — `gl_journal_entries` bo'sh bo'lganda graceful fallback `{items:[],total:0}` qaytarsin (hozir 503)
7. `finance/ratios` — zero-divide guard (0 ga bo'linmaslik)

### P3 — pp/bom NullPointer
8. BOM service'dagi undefined.message xatosi — null check qo'shilsin
