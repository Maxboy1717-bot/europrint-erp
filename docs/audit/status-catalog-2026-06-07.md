# EUROPRINT — HTTP STATUS CATALOG, GOLDEN-THREAD ORIENTED (status + cause) — 2026-06-07

**Role:** 🔵 Analyst, READ-ONLY. Nothing changed — no code, no DB writes, no commit (only this report + `docs/audit/_parts/`).
**Frame:** every endpoint's status + WHY, analyzed **through the golden-thread lens** — does this status/cause break the
`order → planning → production → QC → warehouse → finance → delivery` chain? Each row tagged **ON-CHAIN (hop 1–7)** or **OFF-CHAIN**.

**Evidence method (backend UP this session, `:3030/api/auth/health` = 200):**
- **GET = live route-existence probe** (unauthenticated): `401` = route exists + guarded · `404` = route missing/drift · `200` = `@Public`.
  No token minted/forged (project norm — security-pentest-2026-06-01); protected handler **bodies** classified **static + DB-proof**
  (REAL/EMPTY/MOCK can't be read through the global JWT guard without a session).
- **WRITE (POST/PUT/PATCH/DELETE) = STATIC code-read only** — never probed (would mutate). Status = what the CODE returns + `file:line`.
- **5xx/503 = DB-proven** via `node _audit/q.cjs` (`BEGIN READ ONLY … ROLLBACK`). All missing-table claims re-verified this session (`to_regclass = null`).
- Routing: global prefix `/api`; **5 global guards** (Throttler, Jwt, Roles, Sod, Permission) → no `@Public` ⇒ 401.
- Coverage: all **341 controllers** / **~2,127 distinct routes**, swept by 13 read-only agents; per-group detail in `docs/audit/_parts/*.md`.

**Live DB anchors (2026-06-07):** `sales_orders`=12 · `sd_sales_orders`(view)=12 · `sales_order_items`=0 · `work_centers`=12 ·
`mes_sessions`=0 · `qc_inspections`=0 · `qc_defects`=0 · `warehouse_stock`=25 · `pos_movements`=2 · `pos_gl_posting_log`=1 ·
`entries`=1 · `gl_journal_entries`/`gl_lines`=0 · `accounts`=42 · `sd_customers`=9 · `deliveries`=0 · `sd_payments`=0.

---

## ⭐ GOLDEN-THREAD CHAIN — order → … → delivery (walked hop 1→7)

"Critical-path" = the single call that must succeed for the chain to flow. Live = unauth route-existence probe this session.

| # | Hop | Critical-path endpoint | Status | Cause | Live probe | Chain |
|---|-----|------------------------|--------|-------|-----------|-------|
| **1** | **SD ORDER** | `POST /api/sd/orders` | **201 · 200-REAL** | tx insert header+items+outbox; `.returning(id)`+assignPersistedId (no `id:0`) — `create-order.handler.ts:93-118` | `GET /api/sd/orders` → **401** (exists) | ✅ **OK** |
| **2** | **AI PLANNING** | `GET /api/pp/mps` · `/api/pp/crp` · `POST /api/pp/mrp/run` | **200 · 200-REAL** | real `mps_periods`/`production_orders`/`sales_order_items`/`work_centers`; cols exist incl `work_centers.efficiency_rate` — `pp-mps.service.ts:29-118` | `/pp/mps`,`/pp/crp` → **401** (exist) | ✅ **OK** |
| **3** | **MES PRODUCTION** | `POST /api/mes/sessions` → `…/:id/complete` | **201 · 200-REAL** | real INSERT/UPDATE `mes_sessions`; complete publishes `MesCompletedEvent` — `complete-session.handler.ts:28-79` | `/mes/sessions` → **401** (exists) | ✅ **OK** |
| 3→4 | **MES→QC handoff** | (event) `MesCompletedListener` → INSERT `qc_inspections` | **REAL** (event path) | real insert; prior "no-op stub" memory OUTDATED — `qc/.../mes-completed.listener.ts` | n/a (event) | ✅ **OK** |
| **4** | **QC** | `POST /api/qc/inspections` (HTTP create) | **❌ 500** | **no `@CommandHandler` for `CreateInspectionCommand`** (qc.module providers = Submit/Report/Resolve/CreateReclamation only) — `qc-inspections.controller.ts:78`; `qc.module.ts:62-67` | `GET /api/qc/inspections` → **401** (route exists; 500 is post-auth handler) | 🔴 **BREAK** |
| **5** | **WAREHOUSE** | `POST /api/pos/movements` → `PATCH …/:id/status` completed | **201→200 · 200-REAL** | inserts `pos_movements`+lines (balance-guard 409); completion upserts canonical `warehouse_stock` (25) + `pos_gl_posting_log` — `pos-movement-status.service.ts:153-226` | `/pos/movements` → **401** (exists) | ✅ **OK** |
| **6** | **FINANCE/GL** | `POST /api/pos/gl/approve/:movementId` → `entries` | **200 · 200-REAL** | DB-proven `entries` row `POS-GL-2` (Dr1010/Cr6000); idempotent bridge log→canonical ledger — `gl-posting-log.service.ts:84-111` | `/pos/gl/journal`,`/pos/gl/pending` → **401** (exist) | ✅ **OK** |
| **7** | **DELIVERY** | `POST /api/sd/deliveries` (create) | **🟠 404-B** | **route never bound** — controller has only `@Get`/`@Get(:id)`/`@Patch(:id/status)`; `DeliveriesService.create()` exists but is dead/unreachable — `sd-deliveries.controller.ts`; `deliveries.service.ts:37` | `GET /api/sd/deliveries` → **401** (GET exists); POST static-confirmed absent | 🔴 **BREAK** |
| **7** | **PAYMENT** | `POST /api/sd/payments` | **201 · 200-REAL** | real INSERT `sd_payments` — `sd-payments.repository.ts:55-86` | `/sd/payments` → **401** (exists) | ✅ **OK** |

### 🔴 FIRST BREAK POINTS (where the chain stops flowing)
1. **HOP 4 — `POST /api/qc/inspections` → 500** (unregistered command handler). The *event-driven* MES→QC entry inserts real `qc_inspections`, but the **HTTP create-inspection endpoint is severed** → every downstream HTTP QC step (getById, submit, pass/fail) is unreachable through the API. `qc_inspections`=0.
2. **HOP 7 — `POST /api/sd/deliveries` → 404-B** (route never registered). A delivery can only be `PATCH`-status-updated, never created via the SD API. (Even the dead `create` would 500 — `deliveries.delivery_number` is NOT NULL UNIQUE, no default.)

**NET:** critical path flows **1→3 and 5→6** end-to-end (DB-proven through canonical `entries`). It breaks at **QC HTTP create (hop 4)** and **delivery create (hop 7)**. Hop-2 core planning is real; only its auxiliary AI endpoints lie. All other 5xx/green-lie/mock are on **auxiliary** branches of each hop (maintenance, ratings, AI advice), not the load-bearing call — see "on-chain auxiliary" vs "off-chain" split in the summary.

---

## Status-bucket tables (every flagged endpoint · oltin-ip = hop# or OFF)

### 🔴 200-GREEN-LIE — 200/201 but NO real INSERT/UPDATE (silent data loss)

| method + path | cause | oltin-ip | proof (file:line) |
|---|---|---|---|
| `PATCH/POST /api/qc/approve/finance/:orderId` · `…/approve/qc/:orderId` | real UPDATE `qc_inspections` but returns `{approved:true}` **ignoring rowCount** (qc_inspections=0 → always no-op) | **hop 4** | qc-defects.controller.ts:167-205 (`_setQcStatus`:59) |
| `PATCH/POST /api/qc/reject/:orderId` · `…/inspector-submit/:orderId` | `{rejected/submitted:true}` ignores rowCount | **hop 4** | qc-defects.controller.ts:211-249 |
| `POST /api/ai-planning/decisions/:id/accept` | log-only, no write to `ai_planning_decisions` | **hop 2 (aux)** | ai-planning.service.ts:116 |
| `POST /api/ai-planning/orders/:orderId/block-material` | log-only "Material band qilindi", no reservation | **hop 2 (aux)** | ai-planning.service.ts:121 |
| `POST /api/finance/invoices/:invoiceId/post` | "posted to GL" — only status flip, **no `entries` insert** | **hop 6 (aux)** | finance-invoices.controller.ts:124-139 |
| `POST /api/finance/payments/:paymentId/verify` | `{message:'verified'}`, no DB write | **hop 6 (aux)** | finance-payments.controller.ts:120-127 |
| `GET /api/finance/gl-entries/:id/reverse` | hardcoded `{reversed:false}`, does nothing | **hop 6 (aux)** | finance-main-actions.controller.ts:78-81 |
| `POST /api/finance/profitability/recalculate` · `POST /api/reports/profitability/export` | `jobId=…${Date.now()}`, no recompute/export | **hop 6 (aux)** | finance-main-actions.controller.ts:129; reports.controller.ts:109 |
| `PATCH /api/pos/inventory/:productId/adjust` | echoes `{adjusted:true,...dto}`, no write (`LEGACY_NOOP`) | **hop 5 (aux)** | pos-stub.controller.ts:146-151 |
| `GET /api/pos-v2/inventory-counts` | a "list" READ that **WRITES a new count every call**, never queries existing | **hop 5 (aux)** | inventory-count.controller.ts:72-83 |
| `PATCH /api/warehouse/inventory-counts/lines/:lineId` · `PATCH /api/warehouse/transfers/:id/status` | echoes body, NO UPDATE | **hop 5 (aux)** | wms-gateway-inventory.controller.ts:165; wms-warehouse-gateway.controller.ts:102 |
| `POST /api/erp/work-center-capacity` | literal `{message,updatedAt}`, body unused, no write | **hop 3 (aux)** | erp-reports.controller.ts:935 |
| `PATCH /api/logistics/:id/complete` | emits `DELIVERY_COMPLETED` but returns literal, **no DB update** | **hop 7 (aux)** | logistics.controller.ts (completeDelivery) |
| `POST /api/hr/referrals` · `PATCH /…/:id` · `POST /api/hr/mentorship-pairings` · `PATCH /…/:id` · `POST /api/hr/gsd/employees/:id` | INSERT into missing `hr_referrals`/`hr_mentorship_pairings` (swallowed) / `{updated:true}` no UPDATE | OFF | hr-gsd.controller.ts:526-620 |
| `POST /api/crm/ai/create-task` · `/api/crm/auto-tasks` · `/api/crm/ai/nba/create-task` | `{status:'created'}` / `{tasksCreated:0}` / `{taskId:Date.now()}`, no INSERT | OFF | crm-extended.service.ts:143-153; crm-ai-extended.controller.ts:137 |
| `POST /api/crm/email/send` · `/sms/send` · `/whatsapp/send` | `sent:true` but only logs `crm_activities` (no provider) | OFF | crm-comms.controller.ts:51-97 |
| `POST /api/employees/:id/corporate-inventory/:itemId/sign` · `/return` | `{signed/returned:true}`, no DB | OFF | employees-extra.controller.ts:107-117 |
| `PATCH /api/barcode-warehouse/debts/:id` · `POST /api/warehouses/notify-vacancies` · `/org-departments/notify-vacancies` | echo / `{notified/queued:true}` | OFF | barcode-warehouse.controller.ts:206; resources.controller.ts:64,136 |
| `PATCH /api/cameras/:id` | `{id,patched:body}`, never persists (`cameras`/`camera_ai_configs` exist) | OFF | camera-extended.service.ts:92-97 |
| `GET /api/certificates/:id` | hardcoded `{status:'unknown',...}`, no DB read | OFF | lms-certificates-standalone.controller.ts:75-83 |
| `POST /api/admin/queues/retry/:queue/:jobId` · `DELETE /api/admin/queues/failed/:id` | `{status:'retried'}` / `{deleted:true}`, no BullMQ | OFF | admin-queue.service.ts:33; admin-queue.controller.ts:63 |
| `PATCH /api/integration/mro/:id/approve` | `{approved:true}`, no DB (sibling `PUT requests/:id/approve` IS real) | OFF | integration-mro.controller.ts:131 |
| `PATCH /api/aisha/wake/sensitivity` | in-memory only, not persisted | OFF | wake-config.controller.ts:60 |

### ⚠️ 200-MOCK — hardcoded/fake data (file:line of literal)

| method + path | oltin-ip | proof |
|---|---|---|
| `GET /api/qc/tests/:id` | **hop 4** | qc-parameters.controller.ts:121-125 |
| `GET /api/ai-planning/plans/:id/batch-groups` ("Mashina №1/№2") · `GET /api/ai-planning/dashboard` (`avgMachineUtilization:84`) | **hop 2 (aux)** | ai-planning.service.ts:64,42 |
| `GET /api/ai-reservation/optimize` (fake qty*1.1/cost) | **hop 2 (aux)** | ai-reservation.service.ts:50 |
| `GET /api/finance/exchange-rates` (RUB literal 140) · `/api/finance/payments/:invoiceId/outstanding` (`0`) · `/api/finance-extended/asset-inventory/summary` · `/ai-finance-insights` | **hop 6 (aux)** | finance-main.controller.ts:71; finance-payments.controller.ts:132; finance-extended-income.controller.ts:108,158 |
| `GET /api/warehouse/dashboard` · `/inventory-counts/lines/:lineId` · `/transfers/:id` | **hop 5 (aux)** | wms-catalog.controller.ts:99; wms-gateway-inventory.controller.ts:152; wms-warehouse-gateway.controller.ts:89 |
| `GET /api/pos/barcode/ai-suggestion/pending` | **hop 5 (aux)** | barcode.controller.ts:109-112 |
| `GET /api/mm/vendor-performance` (literal `[]`) | **hop 5 (aux)** | mm-vendors-pr.controller.ts:52-57 |
| `GET /api/ai/bottleneck/analysis` · `/api/ai/shift/recommendations` · `/api/gpt/status` · `/api/gpt/chat` | OFF | ai.controller.ts:172,214; gpt.controller.ts:36,42 |
| `GET /api/agents/strategic/investment` · `/facilities/utility` · `/supplies` · `/iot/sensor` · `/iot/anomaly/:id` · `/iot/rul/:id` | OFF | strategic-agent.service.ts:59; facilities-agent.service.ts:26,41; iot-agent.service.ts:34,38,53 |
| `GET /api/coordination/councils` · `/api/system/cron-jobs`(+v2) · `/api/admin/queues/status`·`/failed`·`/failed/:queue` · `/api/design/templates` · `POST /api/design/:id/mockup` | OFF | coordination.controller.ts:39; system.service.ts:65; admin-queue.service.ts:14; design-extended.repository.ts:69,121 |
| `GET /api/marketing/segments` · `POST /api/crm/chat`·`/auto-tasks`·`/ai/churn`·`/ai/voice` (compat) · `POST /api/crm/ai/nba/:t/:id`·`/churn-rescue/:t/:id` | OFF | crm-extended.service.ts:109-161; crm-ai-extended.controller.ts:146-193 |
| `GET /api/hr/recruitment/pipeline/:id/probation-review` · `/employees/:id/operator-stats` · `/documents/employee`·`/my`·`/pending` | OFF | hr-vacancies-probation.controller.ts:502; hr-employees-ext.controller.ts:397; hr-dashboard.controller.ts:1188 |
| *(partial-mock: real read + invented field)* `GET /api/agents/production/oee` · `POST /api/agents/strategic/scenario` · `GET /api/ai-agents/list` · `/api/ai/automation/status` | OFF | production-agent.service.ts:114; strategic-agent.service.ts:34; ai-agents.controller.ts:231; ai-automation.service.ts:149 |

### ⚠️ 200-EMPTY-e2 — silent-catch masks a missing table → `[]`

| method + path | oltin-ip | proof |
|---|---|---|
| `GET /api/hr/referrals` · `/referrals/boomerang` · `/mentorship-pairings` | OFF | hr-gsd.controller.ts:470-582 (repo try/catch → `[]`; `hr_referrals`/`hr_mentorship_pairings` `to_regclass`=null) |
| `GET /api/employees/:id/business-trips` | OFF | employees-compat-sub.controller.ts:116 (read-twin of the POST 500) |

### ❌ 500 — server error (unregistered handler / column drift)

| method + path | status | cause (wrong→real / handler) | oltin-ip | proof + DB |
|---|---|---|---|---|
| `POST /api/qc/inspections` | 500 | unregistered `CreateInspectionCommand` handler | **hop 4** ⭐ | qc-inspections.controller.ts:78; qc.module.ts:62-67 |
| `GET /api/qc/defects/stats` · `/defects/:id` · `/reclamations/:id` | 500 | `commandBus.execute({type:'…Query'})` plain object, no handler | **hop 4** | qc-defects.controller.ts:85,97; qc-reclamations.controller.ts:85 |
| `POST /api/finance/invoices` · `/invoices/create` | 500 | `fi_invoices.source_type/source_id` → **`sales_order_id`** | **hop 6 (aux)** | drizzle-finance-invoice.repo.ts:108-122; DB: `fi_invoices` has `sales_order_id` only |
| `GET /api/finance/budgets/:id` | 500 | unregistered `GetBudgetByIdQuery` handler | **hop 6 (aux)** | finance-budgets.controller.ts:77-81; finance.module.ts:136 |
| `GET /api/crm/invoices`(+`/v2`) | 500 | `invoices.issue_date` → **`invoice_date`** | OFF | crm-extended.service.ts:29; DB: `invoices` has `invoice_date` |
| `GET /api/warehouse/label/batches`(+v2)·`/history`·`PATCH …/:id/status`·`POST …/print` | 500 | `warehouse_batches.material_card_id`→**`item_id`** + missing `status/updated_at/production_date/expiry_date` | OFF | warehouse-label.service.ts:64-119; DB: `warehouse_batches` = id,warehouse_id,item_id,batch_number,quantity,received_at,created_at |
| `POST /api/employees/:id/business-trips` | 500 | table `employee_business_trips` missing | OFF | employees-compat-financials.service.ts:156; `to_regclass`=null |
| `POST/GET/PATCH×3 /api/hr/zno` · `POST/GET/PATCH×2 /api/hr/zvs` | 500 | tables `zno`/`zvs` missing | OFF | zno.repository.ts; zvs.repository.ts; both `to_regclass`=null |
| `GET/POST /api/micro-modules` · `POST/PATCH /api/micro-modules/:id/view` | 500 | tables `micro_modules`/`micro_module_views` missing | OFF | drizzle-lms-misc.repo.ts:23,30; both `to_regclass`=null |
| `GET /api/mm/vendor-ratings`·`/mrp-results`·`POST /mrp-run`·`GET /materials/:id/price-history` | 500 | tables `mm_vendor_ratings`/`mm_mrp_results`/`mm_purchase_order_lines` missing | **hop 5 (aux)** | mm-dashboard.controller.ts:62-140; all `to_regclass`=null |
| `GET /api/mes/sos/history`·`POST /sos`·`GET /downtime-events`(+/:sessionId)·`POST /downtime-events`·`POST /material-consumption` | 500 | tables `mes_sos_events`/`mes_downtime_events`/`mes_material_consumption` missing | **hop 3 (aux)** | mes-maintenance.controller.ts:97-142; mes-shifts-stats.controller.ts:148; all `to_regclass`=null |

### ❌ 503 — DB drift (missing table) — surfaces as a clean 503/500

| method + path | cause | oltin-ip | proof |
|---|---|---|---|
| `GET/POST /api/qc/approvals` · `PATCH /api/qc/approvals/:id` | table `qc_approvals` missing | **hop 4** | qc-approvals repo:91-120; `to_regclass('public.qc_approvals')`=null |

### 🟠 404 / 501

| method + path | status·cause | oltin-ip | real route / proof |
|---|---|---|---|
| `POST /api/sd/deliveries` | **404-B route missing** | **hop 7** ⭐ | no `@Post`; dead `deliveries.service.ts:37` · live: `GET /sd/deliveries`=401 (GET exists) |
| `GET /api/pp/work-centers/:id` · `PATCH /…/:id/toggle-active` | **404 functional** — `wc.id===id` string≠int → every existing WC 404s | **hop 2** | pp-work-centers.controller.ts:70-135 · live: route=401 (post-auth logic bug) |
| `POST /api/pp/technology/cards/generate` · `/cards/:id/optimize` | **501-C leftover** | **hop 2 (aux)** | pp-tech-cards.controller.ts:113,129 |
| `POST /api/design/orders` | **501-C leftover** → use `POST /api/design` | OFF | design controller (redirect to requestDesign) |
| `GET /api/sd/sales/orders` | **404** (non-canonical path) | hop 1 | live probe 404; canonical `GET /api/sd/orders`=401 (exists) — not a drift, just an alias that was never bound |
| ~44 feature-gated `notImplemented()` | **501-A honest stub (FINE)** | mixed | wms #FX-3, mm #FX-2 (17), finance loans/reports #FX-4, ai rush-orders, hr #FX-9, pp routing, security ppe #FX-6 … |

### 🧨 FK type-drift (uuid↔int) — create→read silently broken (not 5xx)

| routes | cause | oltin-ip | proof |
|---|---|---|---|
| `POST/GET /api/marketing/exhibitions/:id/leads` | `exhibitions.id`=varchar vs `exhibition_leads.exhibition_id`=int | OFF | marketing-analytics-stubs.controller.ts:440-460 |
| `GET/POST /api/marketing/inbox/conversations/:id/messages`·`/reply`·`/ai-reply/:id` | `social_conversations.id`=varchar vs `social_messages.conversation_id`=int | OFF | marketing-analytics-stubs.controller.ts:320-367 |

### 🔵 401 / 🔴 403 / 🟡 400 (only the non-FINE ones)

| method + path | status·cause | oltin-ip | proof |
|---|---|---|---|
| `POST /api/pos-v2/inventory-counts` | **400 shape-drift** — parses `@Query` with wrong schema, ignores `@Body` | hop 5 (aux) | inventory-count.controller.ts:56-68 |
| pos-v2 ~16 routes | **403 risk** — UPPER_CASE `@Roles('WAREHOUSE_MANAGER',…)` vs live lowercase role model | hop 5 (aux) | pos-v2 controllers (flag for owner; not live-provable without a session) |
| *(all other non-`@Public` routes)* | **401 intentional (FINE)** — global JWT guard; live-confirmed across all 7 hops (every GET probe = 401) | all | — |
| ~15 `@Public` (storefront ×10, cc/verify, cc/webhooks HMAC, health, ai-interview ×3) | **open by design (FINE)** | OFF | — |

### ✅ 200-REAL / 200-EMPTY-e1 (healthy — chain backbone)

| method + path | oltin-ip | proof |
|---|---|---|
| `POST /api/sd/orders` · `GET /api/sd/orders`(+`/:id`) · `PATCH/PUT /:id/status` | **hop 1** | create-order.handler.ts:93-118; drizzle-sales-order.repo.ts:79-123 |
| `GET /api/pp/mps`·`/crp` · `POST /api/pp/mrp/run` · `GET/POST /api/planning/schedule` · ai-planning CRUD (`/plans`,`/generate`,`/approve`,…) | **hop 2** | pp-mps.service.ts:29; ai-planning.service.ts:47-132 |
| `POST /api/mes/sessions`·`…/:id/complete` · `GET /api/mes/sessions`(+`/:id`) · `GET /api/pp/work-centers` | **hop 3** | mes-production-sessions.repo.ts:34-62; pp-work-centers.controller.ts:48 |
| `POST /api/qc/defects` · `PATCH /:id/resolve` · `POST /api/qc/reclamations` · `GET /api/qc/inspections`·`/defects`·`/reclamations` (e1, tables=0) | **hop 4** | report-defect.handler.ts:46; get-inspections.handler.ts:35 |
| `POST /api/pos/movements` · `PATCH …/:id/status` · `GET /api/pos/movements`·`/wms/warehouse/:id/stock` | **hop 5** | pos-movement.service.ts:90-159; pos-wms-query.service.ts:154 |
| `POST /api/finance/gl/post-sales-invoice`·`/post-payroll` · `GET /api/finance/gl`·`/trial-balance`·`/ledger/:acct` · `POST /api/pos/gl/approve/:id` · `GET /api/pos/gl/journal`·`/pending` | **hop 6** | gl-posting.service.ts:72-117; gl-posting-log.service.ts:84 |
| `PATCH /api/sd/deliveries/:id/status` · `GET /api/sd/deliveries`(+`/:id`, e1) · `POST/PUT /api/sd/payments` · `GET /api/sd/payments` (e1) | **hop 7** | drizzle-sd-deliveries.repo.ts:60; sd-payments.repository.ts:55-104 |
| ~1,900 more OFF-CHAIN REAL/e1 (hr/crm/director/iot/lms/kanban/ecommerce/mm/integration/admin/AI-router…) | OFF | `docs/audit/_parts/*.md` |

---

## SUMMARY — counts (status · cause · golden-thread impact)

**Per status (≈2,127 routes, static handler-read + live route-existence + DB-proof):**
| status | count | of which ON-CHAIN |
|---|---:|---:|
| ✅ 200-REAL / 200-EMPTY-e1 (FINE) | ~1,930 | chain backbone hops 1,2-core,3,5,6,7-pay |
| 💀 200-GREEN-LIE | ~38 | **on-chain 14** (qc echo ×8 hop4 · ai-planning ×2 hop2 · finance ×4 hop6 · pos/wms ×4 hop5 · erp-capacity hop3 · logistics hop7) |
| ⚠️ 200-MOCK (incl. partial) | ~34 | on-chain ~12 (qc tests hop4 · ai-planning/reservation hop2 · finance hop6 · wms/pos hop5) |
| ⚠️ 200-EMPTY-e2 | 2 | 0 (both OFF — HR) |
| ❌ 500 | ~38 | **on-chain ~16** (qc create+queries hop4 · finance invoices/budgets hop6 · mm hop5 · mes maintenance hop3) |
| ❌ 503 (missing table) | 3 | **3 (hop4 qc_approvals)** |
| 🟠 404-B route missing | 1 | **1 (hop7 delivery create)** |
| 🟠 404 functional / non-canonical | 3 | 2 (hop2 work-centers/:id) + 1 alias |
| 🟠 501-C leftover | 3 | 2 (hop2 tech-cards) |
| 🟠 501-A honest stub (FINE) | ~44 | several (vision-deferred) |
| 🧨 FK type-drift (silent) | 5 | 0 (OFF — marketing) |
| 🟡 400 shape-drift | 1 | 1 (hop5 pos-v2) |
| 🔵 401 intentional / 🔴 403-by-design | all / 6 | live-confirmed; no misconfigured-RBAC bug found |

**Per cause:** unregistered-handler 500 ×5 (4 on-chain, hop4/hop6) · column-drift 500 ×9 (4 on-chain hop6 + 5 off `warehouse_label`) · missing-table 500/503 ×27 (on-chain: hop3 mes ×6, hop5 mm ×4, hop4 qc_approvals ×3) · green-lie echo/no-write ×38 · hardcoded-literal mock ×34 · silent-catch e2 ×2 · FK uuid↔int ×5 · route-missing 404-B ×1 · type-coercion 404 ×2 · leftover-501 ×3.

**ON-CHAIN BREAKS vs OFF-CHAIN issues:**
- 🔴 **On-chain CRITICAL-PATH breaks: 2** — `POST /api/qc/inspections` (500, hop 4) · `POST /api/sd/deliveries` (404-B, hop 7). These stop the chain flowing.
- 🟠 **On-chain AUXILIARY-branch issues: ~44** — bad statuses on non-load-bearing endpoints of hops 2–6 (qc echo-lies ×8, qc_approvals 503 ×3, qc defect-queries 500 ×3, finance invoices/budgets 500 ×3 + green-lies ×4 + mocks, mes maintenance 500 ×6, mm 500 ×4, pos/wms green-lies ×4 + mocks, ai-planning green-lies ×2 + mocks). They degrade a hop but don't sever the proven sub-chain.
- ⚪ **Off-chain issues: ~70** — HR/CRM/marketing/AI-agents/admin/design/iot deceptive + drift (no golden-thread impact).

**Proven sub-chain (2026-06-06, re-confirmed):** POS EXTERNAL_IN → `warehouse_stock` → `pos_gl_posting_log` → `entries` flows REAL (DB row `POS-GL-2`). `entries` is the single canonical ledger; `gl_journal_entries`/`gl_lines`=0 (unused 2nd model, deferred to SAP audit #76).

---

*Generated read-only 2026-06-07 (backend UP). GET = live unauth route-existence probe (401=exists / 404=missing); protected bodies + all writes = static code-read; 5xx/503 = `_audit/q.cjs` DB-proof. No token minted, no write probed, nothing changed. Per-group detail: `docs/audit/_parts/*.md`.*
