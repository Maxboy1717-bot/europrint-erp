export const meta = {
  name: 'europrint-100-audit',
  description: 'Read-only 100-slice exhaustive audit of EuroPrint ERP; each agent writes docs/audit/parts/NN.md',
  phases: [
    { title: 'Backend', detail: 'slices 01-72 (modules + cross-module backend)', model: 'sonnet' },
    { title: 'Cross-cutting', detail: 'slices 73-85 (two-worlds, events, governance)', model: 'sonnet' },
    { title: 'Frontend', detail: 'slices 86-95 (FE pages + shared)', model: 'sonnet' },
    { title: 'Vision', detail: 'slices 96-100 (22 visions + golden thread)', model: 'sonnet' },
  ],
}

// ---- Shared context handed to every analyst -------------------------------
const ENV = `
PROJECT ENVIRONMENT (read-only audit):
- Backend root (NestJS): apps/api/src  (controllers under apps/api/src/modules/<module>/presentation/ or */controllers/)
- Frontend root (Vite/React): artifacts/erp-dashboard/src  (pages under artifacts/erp-dashboard/src/pages)
- LIVE DB query helper (read-only, BEGIN READ ONLY..ROLLBACK enforced): from the repo dir run
    node _audit/q.cjs "SELECT count(*) FROM <table>"
  Use it to get REAL live row counts and to check if a table exists (query information_schema.tables / pg_class).
- The live DB name is "europrint". Many base tables are empty (build stage) — empty is OK if a writer exists in code.
- You have Read, Grep, Glob, Bash (for node _audit/q.cjs) tools. DO NOT use Edit. Only Write is allowed for your ONE part file.
`

const RULES = `
ROLE: ANALYST (read-only). Rules (MANDATORY):
- DO NOT change any code. DO NOT run git. The ONLY file you may Write is your assigned part file.
- verify-don't-trust: every claim backed by file:line (live code via Grep/Read) AND live DB (table exists? row count? via node _audit/q.cjs).
  Prior catalogs over-counted (44+ false positives) — re-verify, do not echo old claims.
- For EVERY route in your slice, classify with proof:
  * REAL = genuinely queries/inserts/updates DB (even if table currently empty) — give file:line + table.
  * 501-STUB = explicit NotImplemented/501 — note if a FE page calls it (then it's a real gap).
  * GREEN-LIE = returns 200/success but does NOT persist (echo, Date.now() id, hardcoded, {ok:true} w/o write).
  * DUPLICATE = same concept twice — name canonical vs other. (Harmless verb-alias = label, not a real dup.)
  * ORPHAN = dead: 0 rows AND no writer/caller in code — confirm by grepping for writers/callers.
- For DB: list every table your slice touches + live row count + whether it has a writer in code.
- For FE<->BE: note any FE call to a path/field the BE lacks (drift), or BE route no FE calls.
- Note "two-worlds": same business concept split across multiple tables (writers != readers).
`

const OUTPUT_FMT = (n, slice) => `
OUTPUT: Write your analysis to the file  docs/audit/parts/${n}.md  with EXACTLY this structure:

## [${n}] ${slice}
### Routes (file:line | verb path | classification | DB table | note)
<markdown table of every route in your slice; if none, write "n/a">
### DB tables (table | row count | has writer? | canonical/orphan)
<markdown table; row counts MUST come from node _audit/q.cjs>
### Breaks (drift / missing FK / two-worlds / green-lie / orphan)
<bulleted list with file:line proof>
### Vision link (which of 22 visions this serves, % built)
### 3-line summary

Keep it self-contained. English is fine. Write the file with the Write tool, then return your structured roll-up.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['n', 'slice', 'real', 'stub', 'greenLie', 'duplicate', 'orphan', 'topBreaks', 'visionLink', 'summary', 'wrote'],
  properties: {
    n: { type: 'string', description: 'two-digit slice number, e.g. 01' },
    slice: { type: 'string' },
    real: { type: 'integer', description: 'count of REAL routes' },
    stub: { type: 'integer', description: 'count of 501-STUB routes' },
    greenLie: { type: 'integer', description: 'count of GREEN-LIE routes' },
    duplicate: { type: 'integer', description: 'count of real DUPLICATE concepts' },
    orphan: { type: 'integer', description: 'count of true ORPHAN tables' },
    topBreaks: { type: 'array', items: { type: 'string' }, description: 'up to 5 most important breaks, each one line with file:line or table' },
    visionLink: { type: 'string', description: 'which vision(s) and rough % built' },
    summary: { type: 'string', description: '3-line summary' },
    wrote: { type: 'boolean', description: 'true if you successfully wrote docs/audit/parts/NN.md' },
  },
}

// ---- The 100 slices -------------------------------------------------------
const TASKS = [
  ['01','CRM/Savdo core','Analyze all CRM/Savdo controllers (crm/presentation/* and crm/*controllers). List every route with classification. Confirm crm_leads(~5)/sd_customers(~9) writers in code. Lead create/update/convert — real DB write or echo? Deal/contact/activity routes. FE drift (which CRM FE pages call these). Two-worlds: crm_leads vs leads vs marketing_leads.'],
  ['02','CRM AI-extended','crm-ai-extended.controller — green-lie suspects (e.g. Date.now() task id ~:137). Which AI routes are intentional feature-gated vs genuinely broken echo. ai voice/email comms (vision #13) — built or stub.'],
  ['03','SD orders/sales','SD order controllers. RESOLVE the order-world: sd_orders / sales_orders(~12) / sd_sales_orders (VIEW?). Which is canonical, which is dead, exact row counts, who writes/reads each. Order status flow. Is sd_sales_orders just a VIEW over sales_orders (confirm via DB)?'],
  ['04','SD customers/quotations','sd_customers, quotations. Real vs stub. FK from order to customer. Quotation->order conversion. Drift.'],
  ['05','Marketing core','Marketing campaign/lead controllers. marketing_campaigns(~0)/marketing_leads(~0) writers. Real vs stub. Campaign CRUD. Lead capture (vision #18 4-channel) — built or stub.'],
  ['06','Marketing PR/inbox','marketing pr (pr_activities), inbox (social_conversations/social_messages). Verify they persist. ai-reply (~:126) intentional stub. Vision #17 SMM-AI oversight.'],
  ['07','Marketing exhibitions/settings/ab-tests','exhibitions/exhibition_leads, marketing_settings/social_api_configs, marketing_ab_tests. Verify real persist with DB row check.'],
  ['08','Marketing analytics/content','marketing-analytics-stubs, content. 501 stubs. Which FE pages (MarketingContent/MarketingSocialInbox) call them — real user-facing gaps.'],
  ['09','Design core','Design controllers. designs table writers. generate/approve/reject — real INSERT/UPDATE or echo. design_orders. Vision: design request from order.'],
  ['10','Design tooling/notifications/messages','designOrderMessages, design_tooling, designOrderNotifications. Verify real. die_cut knowledge (vision #9 tigel).'],
  ['11','QC inspections','qc_inspections writers. submit/approve/reject — real status UPDATE + event publish (submit-inspection.handler ~:51). QC verdict chain. Vision: QC checkpoint.'],
  ['12','QC defects/braks','qc-defects. braks, cost-impact, pending. Real vs stub. Defect (brak) tracking — vision #9/#10.'],
  ['13','QC SPC/control-charts','qc-new control-charts. control_charts table. SPC math (p-chart, X-bar/R, Cp/Cpk, sigma) — verify formula correctness.'],
  ['14','Technology/PP routing','pp-routing. 501 because work_centers=0? routing/routing_operations schema. Vision #4 (22 shops routing).'],
  ['15','Technology cards','technology_cards table. generate/optimize — intentional AI vs real. Tech card -> BOM link.'],
  ['16','PP production-orders','production_orders writers (likely 0). The order->production-order bridge. Vision #21 golden thread piece.'],
  ['17','MES sessions','mes-production-sessions repo. production_sessions, work_centers join (0 work centers?). mes_sessions. Vision #10.'],
  ['18','MES facts/OEE','oee_records, MES facts, iot payroll-sync fields (iot-schema ~:497). OEE calc.'],
  ['19','WMS inventory-materials','inventory-materials. material create 501 (orphan avoid). mm_materials(~0) vs material_cards(~21) split. Which does FE read.'],
  ['20','WMS material-kits','material_kits vs mm_material_kits DRIFT. FE WarehouseMaterialKits.tsx ~:37 calls /iot-enhanced/material-kits, repo uses mm_material_kits, DB has material_kits. Confirm current state.'],
  ['21','WMS stock','warehouse_stock(~25) vs wms_stock(~0) vs wms_stock_levels(~0) vs stock_ledger(~0). Writers vs readers. Which FE screen reads which. Two-worlds.'],
  ['22','WMS catalog/transactions','wms-catalog. transactions, orders-by-date. Verify persist.'],
  ['23','WMS warehouses','warehouse_types(~9)/warehouses(~12). household_mro, paper_rolls, finished, defective, waste, tools, dept, flexo. Vision #3 (9-13 types) coverage.'],
  ['24','POS movements','pos-movement-status.service. pos_movements(~2)/lines(~2). DRAFT->quarantine->QC->warehouse->GL flow. Vision #1. Row counts prove how much flowed.'],
  ['25','POS GL log','pos_gl_posting_log(~0). pos-gl-auto.listener (self-labeled "dead-letter" ~:18-21). The promotion to entries ledger is MISSING. Money mismatch gap. Vision #1 AI_GL.'],
  ['26','POS quarantine/QC workflow','quarantine-workflow.repository ~:65 (writes warehouse_stock). QC decision in POS. Stock write path.'],
  ['27','POS printer-config/material-kits','pos_printer_configs after wms-barcode rewrite. Verify real.'],
  ['28','Finance GL/entries','entries(~0, canonical) vs gl_journal_entries(~0)/gl_lines(~0, unused) vs pos_gl_posting_log(~0). 3-GL-world gap. gl-posting.service ~:63. No bridge POS->entries. Vision #1.'],
  ['29','Finance payments','finance-payments ~:75 root 501 (orphan avoid). Payment approve flow (verb-dup PATCH/POST).'],
  ['30','Finance budgets','budgets standalone vs finance/budgets. Canonical? FE which path. Vision #16 marketing spend->finance.'],
  ['31','Finance reports/loans','#FX-4 feature-flagged 501. Intentional. loan_applications.'],
  ['32','Finance-extended tax/salary','payroll_tax_rules (tax-calendar), salary_bands (salary-benchmark). Verify.'],
  ['33','Finance payroll-posting','GL posting for payroll. gl_account_mappings(~6). Balance (debit=credit) logic. Account 6710/1100. Vision #11.'],
  ['34','HR core/employees','employees(~30)/users(~31). PATCH alias. Real vs stub. updateEmployee.'],
  ['35','HR daily-report','daily-report.controller ~:64 override delegates to service. Real.'],
  ['36','HR dashboard','hr-dashboard. birthdays/settings (#16 still 501?). The 5 recently-fixed routes (ai-interview etc). Verify.'],
  ['37','HR vacancies/recruiter','hr_vacancy_profiles. channels/probation_start/probation_end. candidate_portrait JSONB.'],
  ['38','HR vacancies-pipeline','hr_candidate_funnels.checklist_data. Pipeline stage tracking.'],
  ['39','HR compat-a/tests','hr_tool_test_results, hr_interview_sessions. test_questions PATCH/DELETE/POST.'],
  ['40','HR 360/enps','employee_360_assessments, enps_surveys/enps_survey_responses. Verify.'],
  ['41','HR career/offboarding','employee_career_profiles, offboarding_checklist_items. Verify.'],
  ['42','HR payroll/advances','payroll_periods(~1)/payroll_rows(~0)/payroll_advances(~0). PIN advance flow (vision #11) — built or gap. cash_registers(~0)/cash_transactions(~0).'],
  ['43','LMS courses','courses writers. patchCourse real (COALESCE). attempts/certificates duplication.'],
  ['44','LMS certificates/events','lms.certificate event name-drift (dot vs underscore). Verify if fixed. Certificate issue flow.'],
  ['45','Security visitors','security_visitors SELECT/UPDATE. getVisitors/exit. Real.'],
  ['46','Security PPE/fire','security ~:195 #FX-6 feature-flagged 501 + 3 new POST routes. ppe-checks/fire-sensors. Vision: safety.'],
  ['47','Household/MRO','household_mro warehouse type. Cook/canteen consumption (vision #12) — built or gap. Food expense path.'],
  ['48','IoT devices/sensors','iot_devices. getDevice 404-if-missing. alert create/resolve. Sensors.'],
  ['49','IoT-tablet sessions','vision #10. production_sessions. crew(machine_crews), evaluation(shift_evaluations), return(material_movements RETURN). start/stop/defect/inline-qc/handover/kit-scan. Operator flow.'],
  ['50','IoT main/OEE-live','oee_records AVG (getOeeLive). downtime-reason-codes. iot-main.'],
  ['51','Director approvals','approval_requests. approvedToday/rejectedToday COUNT. approvals.service ~:58 event publish. Vision #11 (director approves payroll).'],
  ['52','Director dashboard/KPI','director kpi/kpis alias. Dashboard showing 12 orders. Vision #14 manager panel adjacent.'],
  ['53','Admin/SaaS','admin-extra ~:85 /admin/login compat-only (not auth). tenants/v2. SaaS multi-tenant.'],
  ['54','Tasks/Kanban boards','kanban_cards (live ~2 rows) vs kanban_tasks (dead CQRS ~0). KanbanController retired. boards/cards/flows.'],
  ['55','Kanban cards/assign','cards/:id/assign. chat-message-files (task_chat_message_files). card detail.'],
  ['56','Kanban reports/projects','task_projects. kanban-reports. Project rollup.'],
  ['57','Coordination/CC','CC resolver MANAGER_OF_SENDER/DEPT_HEAD fallback. document/template routes. Vision #22 integration (CC->Kanban->Cashier).'],
  ['58','Chat core','chat rooms/messages. Real after hr-v2 retire. Canonical /chat. pinned/poll.'],
  ['59','Chat uploads/advanced','chat-uploads ~:80 (service before {ok:true}). ChatAdvancedController retired. thread/forward/upload.'],
  ['60','Org-structure core','org_departments(~142). head_user_id only ~18/142 (vision #19/#20 master link). CRUD/export/tree. ~23 routes.'],
  ['61','Org-structure history','node_hr_requests (node history). Change log.'],
  ['62','Supply/MM dashboard','mm-dashboard ~:150. vendor-invoices/3-way-match/fleet/vehicles 501 (#FX-2). Procurement.'],
  ['63','MM materials/layer-formula','layer-formula.service.ts ~:27 + mm-materials.controller ~:54. THE PRODUCTION BRAIN (vision #7). Test exists (476 sheets/591.61 GSM). material_cards.format_a/format_b/grammage/material_kind + material_layer_config(~0). Is it integrated into BOM/MRP/material-kit? Confirm formula correctness + integration gap.'],
  ['64','MM purchase-orders/kits','mm_material_kits. Purchase order flow. PO->receiving->stock.'],
  ['65','AI-agents','ai-agents ~:208 agent list metadata live. trigger intentional. agent-event-bus ~:22. AI agent registry.'],
  ['66','AI-planning demand/rush','ai.controller ~:176 demand/rush 501 (#FX). FE DemandForecastingPage/RushOrderPage call them — real user gaps.'],
  ['67','AI-planning core','planner deadline-risk event (zero-listener). Scheduling/MPS. Vision: AI planning needs layer-formula brain.'],
  ['68','Website/Ecommerce','ecommerce.service ~:209/229. website_pages(~0)/website_settings(~0). order/contact CQRS publish. Vision #15 (web catalog+CMS).'],
  ['69','Integration employee/skill','employee_skill_scores (skill-gap). integration-employee. Skill matrix.'],
  ['70','Integration mm/fi','wms-integration MM/FI bridges (#FX-3) intentional. Module bridges.'],
  ['71','Other/Compat legacy','~623 routes, ~47 green-lie suspects (triage each — many false positive), dup keys (~11). Legacy compat layer. Biggest bucket — be thorough. Search modules: compatibility, remaining, general, erp, applications.'],
  ['72','Material-balance','material_movements. movements/fp-cycle/adaptation real. Balance tracking.'],
  ['73','IKKI OLAM: order','sales_orders(~12)/orders(~0)/sd_orders(~0)/ow_orders(~0)/orders_registry(~0)/customer_orders(~0). For EACH: row count, writers in code, readers in code, FK. Which is canonical (sales_orders likely). Which are dead. Recommend canonical + migration/adapter path (analysis only). Codex #1 priority.'],
  ['74','IKKI OLAM: material','material_cards(~21)/mm_materials(~0)/materials(~0)/raw_materials(~0). Same analysis. Canonical recommendation.'],
  ['75','IKKI OLAM: stock','warehouse_stock(~25)/wms_stock(~0)/wms_stock_levels(~0)/stock_ledger(~0). Same. Which POS writes, which WMS reads.'],
  ['76','IKKI OLAM: GL','entries(~0)/gl_journal_entries(~0)/gl_lines(~0)/pos_gl_posting_log(~0). Same + the POS->entries promotion gap (dead-letter). Money flow break.'],
  ['77','IKKI OLAM: attendance/davomat','All attendance/davomat tables. Which writer, which reader. The 7-world split — confirm via DB + grep.'],
  ['78','ZERO-LISTENER events (full audit)','Every domain event emitted with NO listener: hr.attendance.recorded, hr.payroll.calculated, payroll.period.closed, pos.gl.auto_posted, pos.requisition.* (5), employee.created, rbac.permission.changed, ai.planner.deadline_risk. For each: emit site (file:line), is there ANY listener (grep), impact. Classify each (needs handler) / (intentional fire-and-forget).'],
  ['79','EVENT name-drift (full audit)','Every emit-name vs listener-name mismatch across ALL modules (e.g. lms.certificate dot vs _underscore). List each pair: emitter file:line + listener file:line + the mismatch.'],
  ['80','ORPHAN tables (full audit)','Every base table with 0 rows AND no writer in code. Confirm by grepping for INSERT/writer. Distinguish "build-stage empty but has writer" (fine) from "truly dead, no writer" (orphan). List all true orphans. Use node _audit/q.cjs to enumerate tables and counts.'],
  ['81','domain_events/outbox','outbox.repository ~:44, outbox-publisher.service, domain_events(~0). Why is durable integration not exercised? Is the publisher wired? Vision #22.'],
  ['82','EventBridge/CQRS','event-bridge.service ~:5 (CQRS<->EventEmitter bridge). agent-event-bus. How events flow. Durability gap.'],
  ['83','head_user_id coverage (org governance)','core-schema ~:302 head_user_id. ~18/142 org nodes have heads. Impact on who-sees-what / who-approves-what (vision #19). Which flows break without heads.'],
  ['84','manager_id NULL','30/30 employees manager_id NULL (verify via DB). Org reporting chain impact. Approval routing (CC resolver) impact.'],
  ['85','Auth/RBAC','position_permissions(~1380), positions(~96). Guards, JWT mint, role->permission flow. RBAC completeness. 4 global guards (Jwt/Roles/Sod/Permission).'],
  ['86','FE CRM/SD pages','artifacts/erp-dashboard CRM/SD pages. Which call real BE, which hit 501/missing (drift). Form save: do forms actually submit+persist or just fireEvent. List drift.'],
  ['87','FE Marketing pages','MarketingContent ~:103, MarketingSocialInbox ~:68 calling 501s. Marketing pages real-data vs empty. Drift list.'],
  ['88','FE Design/QC pages','Design/QC FE pages. Real data vs empty tables. Which buttons work.'],
  ['89','FE Production/MES/WMS pages','Production/MES/WMS pages. work_centers=0 impact (empty dropdowns). WarehouseMaterialKits drift page. Stock screens.'],
  ['90','FE POS pages','POS monitor pages. The DRAFT->QC->warehouse UI flow. printer-config. cameras-management ~:77 drift.'],
  ['91','FE Finance pages','Finance GL/payment/budget pages. Empty ledgers impact. Which forms persist.'],
  ['92','FE HR pages','HR dashboard/vacancies/payroll/360/enps pages. Which real, which call 501. Form save.'],
  ['93','FE Director/Admin pages','Director dashboard KPI, approvals. Admin pages. ChatAdminPage ~:55 drift.'],
  ['94','FE stub routes + navigation','StubRoutes.tsx ~:79 — 5 left (/export /sap /modules /pos/printer-config /micro-modules). Navigation honesty. Any other StubPage pointers.'],
  ['95','FE shared/lib','api clients (lib/api/*), ai.ts ~:74 drift. business-logic.test (ZVS levels 500K/5M/100M), i18n loader. Shared infra.'],
  ['96','Vizyon 1-5','For each: POS Monitor(1), cashier-hub(2), 9-13 warehouse types(3), 22 offset shops(4), flexo(5). State done/partial/broken/missing + exact proof (which tables/routes/pages exist or are empty). What is missing per vision.'],
  ['97','Vizyon 6-10','corrugated(6), layer-formula(7), kashirovka(8), tigel(9), material-per-order(10). Same scoring + proof. For #7: confirm the formula code+test exist and the integration gap.'],
  ['98','Vizyon 11-15','payroll/PIN(11), cook/canteen(12), CRM-comms SMS/voice/email(13), manager-panel(14), website(15). Score+proof.'],
  ['99','Vizyon 16-22','marketing-spend(16), SMM-AI-oversight(17), lead-gen-4ch(18), org-tie(19), org-constructor(20), golden-thread(21), integration(22). Score+proof each.'],
  ['100','GOLDEN THREAD end-to-end','Trace ONE order through the live system: SD order -> design request -> tech card/BOM -> routing -> production order/session -> POS issue/receive -> QC -> warehouse -> GL posting. At EACH hop: does the table exist, does it have a writer, does data flow, or does it break? Pinpoint exactly where the live chain breaks and the minimum needed to make it run once end-to-end. System acceptance test (vision #21).'],
]

function phaseFor(num) {
  if (num <= 72) return 'Backend'
  if (num <= 85) return 'Cross-cutting'
  if (num <= 95) return 'Frontend'
  return 'Vision'
}

function buildPrompt(n, slice, body) {
  return `${ENV}\n${RULES}\nYOUR SLICE [${n}] ${slice}:\n${body}\n${OUTPUT_FMT(n, slice)}`
}

log(`Launching 100 read-only audit analysts; each writes docs/audit/parts/NN.md`)

const results = await parallel(
  TASKS.map(([n, slice, body]) => () =>
    agent(buildPrompt(n, slice, body), {
      label: `audit:${n} ${slice}`,
      phase: phaseFor(Number(n)),
      model: 'sonnet',
      schema: SCHEMA,
    })
  )
)

const ok = results.filter(Boolean)
log(`Done: ${ok.length}/100 analysts returned. Wrote: ${ok.filter(r => r.wrote).length}.`)

return ok
