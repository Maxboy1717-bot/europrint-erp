# Part: compatibility — modules: compatibility (static-only; backend down)

Method: every route decorator enumerated across 30 controllers; handlers traced into 41 services + 1 repo;
every referenced table/column DB-proved via `_audit/q.cjs` (read-only). Backend HTTP DOWN → all statuses STATIC
(the status the CODE would return). 5 global guards → unannotated route = 401 (intentional; none here are @Public).

## Route inventory: total 343 route decorators (per-method)
- GET 205 · POST 78 · PUT 17 · PATCH 23 · DELETE 20  (decorator count)
- NOTE +6 extra *paths* from array-path decorators: employee-kpi (2 GET aliases), crm-extended (4 POST alias pairs).
  Distinct HTTP paths ≈ 349. Counts below tally the 343 decorators.

Architecture note: these are @deprecated compat shims. Controllers are thin (delegate to services holding the raw SQL).
DB is a build-stage near-empty superset → almost every table EXISTS; "empty" GETs are e1 (FINE), NOT bugs.
The real defects are (a) column/table DRIFT in 2 services and (b) controller/service GREEN-LIES (echo, no write).

## 🔴 DECEPTIVE (200 green-lie / mock; ok HTTP but no real work)
- POST /api/employees/:id/corporate-inventory/:itemId/sign | GREEN-LIE returns `{signed:true}` no DB | employees-extra.controller.ts:107-111 | verdict: fake-write (canonical write path exists in employees-compat-sub.controller.ts:162 corporateInventorySign→profile svc; this shim route echoes)
- POST /api/employees/:id/corporate-inventory/:itemId/return | GREEN-LIE returns `{returned:true}` no DB | employees-extra.controller.ts:113-117 | verdict: fake-write (real one at employees-compat-sub.controller.ts:159)
- PATCH /api/barcode-warehouse/debts/:id | GREEN-LIE echo `{id,...body,updated:true}` no DB | barcode-warehouse.controller.ts:206-209 | verdict: fake-update
- POST /api/warehouses/notify-vacancies | GREEN-LIE `{notified:true}` no work | resources.controller.ts:64-66 | verdict: fake-action
- POST /api/org-departments/notify-vacancies | GREEN-LIE `{queued:true}` no queue | resources.controller.ts:136-140 | verdict: fake-action
- GET /api/marketing/segments | 200-MOCK literal 3-row array, count:0 hardcoded | crm-extended.service.ts:109-115 (via crm-extended.controller.ts:138) | verdict: static mock, no DB
- POST /api/crm/ai/create-task | GREEN-LIE `{id:null,status:'created'}` no INSERT | crm-extended.service.ts:143-145 | verdict: fake-create (id always null)
- POST /api/crm/chat  AND  POST /api/crm/ai/extended/chat/respond | GREEN-LIE `{response:'',...}` no work | crm-extended.service.ts:147-149 | verdict: echo stub
- POST /api/crm/auto-tasks  AND  POST /api/crm/ai/extended/auto-tasks/create | GREEN-LIE `{tasksCreated:0,...}` no work | crm-extended.service.ts:151-153 | verdict: echo stub
- POST /api/crm/ai/churn  AND  POST /api/crm/ai/extended/churn/analyze | GREEN-LIE hardcoded `{churnRisk:'low',score:0}` | crm-extended.service.ts:155-157 | verdict: hardcoded analysis
- POST /api/crm/ai/voice  AND  POST /api/crm/ai/extended/voice/analyze-call | GREEN-LIE `{transcript:'',intent:null,confidence:0}` | crm-extended.service.ts:159-161 | verdict: echo stub
- GET /api/crm/invoices  (+ /api/crm/invoices/v2) | ⚠️ also 500 below; additionally `total:0` hardcoded even when rows exist | crm-extended.service.ts:33 | verdict: shape-bug (total never real)

## ❌ 5xx (DB-PROVED)
- GET /api/crm/invoices | 500 | SELECT `i.issue_date` — column does not exist on crm_invoices (real col=`invoice_date`) | crm-extended.service.ts:29 | DB: `SELECT i.issue_date FROM crm_invoices` → ERROR column i.issue_date does not exist; crm_invoices cols confirmed (…,invoice_date,…) no issue_date | fix-type: CODE-RENAME issue_date→invoice_date
- GET /api/crm/invoices/v2 | 500 | same query (delegates to getCrmInvoices) | crm-extended.controller.ts:52 → crm-extended.service.ts:29 | DB: as above | fix-type: CODE-RENAME issue_date→invoice_date
- GET /api/warehouse/label/batches | 500 | SELECT/JOIN `wb.status, wb.production_date, wb.expiry_date, wb.material_card_id` — none exist on warehouse_batches | warehouse-label.service.ts:86-91 | DB: warehouse_batches cols = id,warehouse_id,item_id,batch_number,quantity,received_at,created_at; `SELECT wb.material_card_id/status/production_date` → ERROR column does not exist | fix-type: DDL-NEEDED warehouse_batches.(status,production_date,expiry_date,material_card_id) OR CODE-RENAME item_id→material_card_id + add cols
- GET /api/warehouse/label/batches/v2 | 500 | delegates to getLabelBatches | warehouse-label.controller.ts:60 → service:85 | DB: as above | fix-type: same as above
- GET /api/warehouse/label/history | 500 | JOIN `mc.id = wb.material_card_id` — warehouse_batches has no material_card_id | warehouse-label.service.ts:108 | DB: column wb.material_card_id missing | fix-type: CODE-RENAME material_card_id→item_id (and add mc join key) / DDL
- PATCH /api/warehouse/label/batches/:id/status | 500 | UPDATE `SET status=…, updated_at=NOW()` — warehouse_batches has neither status nor updated_at | warehouse-label.service.ts:115-119 | DB: warehouse_batches has no status/updated_at column | fix-type: DDL-NEEDED warehouse_batches.(status,updated_at)
- POST /api/warehouse/label/print | 500 (batch path only) | batchId path → getBatchLabelData SELECT wb.material_card_id/production_date/expiry_date | warehouse-label.service.ts:64-77 (printBatchLabel:36) | DB: those wb.* columns missing | fix-type: DDL/CODE-RENAME (materialCardId path is FINE — uses LabelService.fetchLabelData)
- POST /api/employees/:id/business-trips | 500 | INSERT INTO employee_business_trips — table does not exist | employees-compat-financials.service.ts:156 (via employees-compat-sub.controller.ts:118) | DB: `to_regclass('public.employee_business_trips')`=NULL; `SELECT … FROM employee_business_trips` → ERROR relation does not exist | fix-type: DDL-NEEDED CREATE TABLE employee_business_trips

## ⚠️ 200-EMPTY e2 (silent-catch masks missing table as empty — BUG)
- GET /api/employees/:id/business-trips | e2: getBusinessTrips throws (relation employee_business_trips missing) but controller `toList()` does `r.ok ? r.data : []` → returns `{items:[],total:0}` HTTP 200, hiding the broken table | employees-compat-sub.controller.ts:116 + employees-compat-financials.service.ts:88-98 | DB: relation employee_business_trips does not exist | fix-type: DDL-NEEDED (same table as the POST 500 above)

## 🟠 404 / 501
- None. No live 501 (the `notImplemented` import in saas.controller.ts:23 & europrint-control-director.controller.ts:19 is UNUSED — all routes delegate to real services). No drift-404s found; all @Controller prefixes resolve under /api.

## 🟡🔵🔴 400 / 401 / 403
- BUG ones: none.
- Intentional: 401 — all 30 controllers global-guarded, none @Public (correct). 400 — Zod `.parse()` on bodies
  (approval-workflow, calendar-events, goals, asset-management, saas, settings-admin, warehouse-catalog, core-departments)
  = input validation FINE. 403 — RBAC @Roles sets per controller (HR_ROLES / admin-set / super_admin) = FINE.

## ✅ FINE (grouped + counts + sample proofs)
- Real raw-SQL GET/POST/PUT/PATCH/DELETE against EXISTING tables+columns — the bulk (~300 routes).
  DB-proved tables all present: material_cards, material_movements, employee_files, employee_bank_accounts,
  salary_history, disciplinary_actions, payroll_advances, candidates, positions, departments, org_departments,
  org_functions, warehouse_stock, current_stock(view), pos_warehouse_stock_view(view), material_barcodes,
  pos_movements, pos_movement_lines, crm_deals, crm_leads, crm_invoices, audit_logs, role_menus, kpi_definitions,
  kpi_values, document_workflow_routes/instances, hr_v2_documents, succession_plans, warehouses,
  pos_barcode_print_queue, warehouse_batches, employees, users.  (only employee_business_trips MISSING)
  - sample: GET /api/employees (employees-list-extended) — real list; columns verified.
  - sample: POST /api/warehouse/movements — real INSERT material_movements (all 9 cols exist) | warehouse-catalog.controller.ts:115.
  - sample: POST /api/employees/:id/files — real INSERT employee_files (cols match) | employees-compat-sub.controller.ts:179.
  - sample: GET /api/material-cards, /api/warehouse/materials — real material_cards select (xom_ashyo,kod,current_stock).
  - sample: GET /api/crm/supervisor/dashboard, /api/crm/ai/nba/* — real crm_deals (stage_id,opportunity,assigned_by_id all exist).
  - sample: POST /api/warehouse/label/print-job — real INSERT pos_barcode_print_queue(batch_id,format,copies,status) all exist.
- PA2-14 `/v2` ACL-translated read variants (~22 routes) — re-run the legacy query + map through ACL translator;
  inherit the legacy route's status. (crm/invoices/v2 & warehouse/label/batches/v2 inherit the 500s above — listed there.)
- DELETE/echo `{deleted:true}` AFTER a real DELETE rawSql (employees-compat-financials:32, employee-files:102,
  resources:193, employee-kpi:142, discipline-records:100, candidates:182, mentorships:90) = FINE (real write precedes).
- printLabel (material path), getBatchLabelData generator = real DB + EPL content generation = FINE.

## COUNTS (per bucket+subcause; sum = 343 decorators)
- ❌ 500 column/table drift: 8 decorators
    · crm issue_date drift: GET /crm/invoices + /v2 = 2
    · warehouse_batches drift: /label/batches + /v2 + /label/history + PATCH /label/batches/:id/status + POST /label/print(batch path) = 5
    · employee_business_trips missing (POST): 1
- ⚠️ 200-EMPTY e2 silent-catch (missing table masked): 1 (GET /employees/:id/business-trips)
- 🔴 DECEPTIVE green-lie/mock (200 no real work): 13 decorators
    · controller echoes: sign, return(extra), patchDebt, warehouses/notify-vacancies, org-departments/notify-vacancies = 5
    · crm mocks/green-lies: marketing/segments, create-task, chat(×1 dec /2 paths), auto-tasks(×1/2), churn(×1/2), voice(×1/2) = 6
    · crm/invoices total:0 shape-bug (also counted in 500) — noted, not double-counted here
    · (crm chat/auto-tasks/churn/voice are 4 decorators with array paths = 8 paths; counted as 4 decorators) +2 dashboards real → net green-lie decorators ≈ 6
- ✅ FINE: 321 decorators
    · real DB CRUD against existing tables: ~299
    · PA2-14 /v2 ACL read variants (non-broken): ~20
    · Zod-400 / RBAC-403 / 401 intentional: covered by above (no separate bug count)
- 🟠 404/501: 0 · 🟡 400-bug: 0 · 🔵 401-bug: 0 · 🔴 403-bug: 0

Sum check: 8 (500) + 13 (deceptive) + 322 (fine incl. the e2 row's sibling) ≈ 343; the e2 GET is the read-twin of the
business-trips table gap (1 of the 343, classified ⚠️ not ✅).
