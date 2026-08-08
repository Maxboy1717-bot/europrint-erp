# Phase-2 DEFINITIVE Buildable Queue — 2026-07-11 (workflow-verified)

Source: `master-plan-full-triage` workflow (37 agents, adversarially skeptic-verified). Only items that survived as buildable on the EXISTING schema, no owner input, no blocked deps. A few are near-duplicates (flagged in title). Each still gets a fresh Step-1.2 re-verify at build time.

| bucket | count |
|---|---|
| confirmedBuildable | 84 |
| schemaGated (Q-35) | 369 |
| ownerDecision | 276 |
| chainDep | 297 |
| blocked | 71 |
| alreadyHa | 4 |
| markers total | 1143 |

---

## 08-mes — 1 buildable

### #93 — 'Who is on which machine now' live board
- **Files:** CORE (buildable now, no blocked dep): read from production_sessions directly — apps/api/src/modules/mes/infrastructure/repositories/mes-production-sessions.repo.ts (add an active-board query: SELECT ps.worker_id, emp name, ps.equipment_id, e.name, ps.status FROM production_sessions ps JOIN equipment e ON e.id=ps.equipment_id LEFT JOIN employees emp ON emp.id=ps.worker_id WHERE ps.status IN ('running','in_progress','paused') AND ps.deleted_at IS NULL) + a GET endpoint on a MES controller + FE board under artifacts/erp-dashboard/src. worker_id is populated 8/8 and resolves to employees (verified: Bobur, Nilufar); equipment_id 8/8 resolves (Ofset/Flexo machines). CORRECTION to first agent: the board's data source is production_sessions, NOT machine_status_logs — the machine_status_logs.operator_id write at iot-tablet session-start (column exists, 0/9 populated) is an OPTIONAL secondary enhancement, not required for the board. The doc's dep on item 69/operator_card_id is genuinely avoidable (worker_id is the live identity source).
- **DB-proof:** Live-verified now: SELECT ps.worker_id, ps.equipment_id, e.name, ps.status FROM production_sessions ps JOIN equipment e ON e.id=ps.equipment_id WHERE ps.status IN ('running','in_progress') returns real worker↔machine rows today (4 active sessions: 3 in_progress + 1 running; worker_id 8/8, all resolving to employee names). No new table/column, no owner threshold, no blocked area (worker_id = the session worker's identity, not org head_user_id/razryad/salary). After wiring the endpoint+FE, the board renders the current worker-on-machine snapshot. No existing endpoint already does this (camera-machines.tsx shows AI/camera machine status, not session worker↔machine).

## Module 10 — WMS/Ombor — 8 buildable

### #24 — Ostatok rulon taklifi PP rejalashtiruvchiga (remnant-roll suggestion list)
- **Files:** apps/api/src/modules/wms/application/rulon-card.service.ts (add listRemnantSuggestions); apps/api/src/modules/wms/infrastructure/repositories/drizzle-rulon-card.repo.ts (ranked query); apps/api/src/modules/wms/presentation/rulon-card.controller.ts (add GET /wms/rulon-cards/remnant-suggestions)
- **DB-proof:** VERIFIED: all 3 cited files exist. rulon_cards has status/current_weight_kg/received_date (+width_mm/grammage_gsm for optional match) live; RULON_STATUS_REMNANT='remnant' const exists (wms-rulon-card.constants.ts:15). Ranked read on existing columns, no new schema, no owner value. NOTE: vision #24 aspires to AI-priority (muddat+kam qoldiq, tag E3); the buildable slice is a deterministic heuristic list (weight ASC, received ASC) which needs NO AI credential — the AI deadline-matching refinement is a later enhancement, not a build blocker. Table currently empty (runtime, not build).

### #28 — Aniqlik% Direktor dashboardida, <95% signal
- **Files:** Reuse WmsCountsService.getCountAccuracy (apps/api/src/modules/wms/application/wms-counts.service.ts:116 — first agent said :113, actual :116, delegates to repo.getCountAccuracy); add KPI tile in apps/api/src/modules/director/dashboard/dashboard.service.ts; scheduled alert calling NotificationRoutingRepository.resolveUserIds (notification-routing.repository.ts:127) fallback role 'director'
- **DB-proof:** VERIFIED: getCountAccuracy exists (dep item #12 is DONE → unblocked). director/dashboard/dashboard.service.ts exists. <95% threshold is VISION-GIVEN (docs/vision/_parts/10-warehouse.md #28: '<95% CC+Telegram, KPI kartaga') — not owner. resolveUserIds is genuine RBAC (SELECT id FROM users WHERE role IN (...)) — NOT org head_user_id, so routing is unblocked. No new schema. Alert cron writes notifications (user_id/type/title/body NOT NULL — all suppliable).

### #30 — Ish vaqtidan tashqari amal bayrog'i AVTO (off-hours flag)
- **Files:** New apps/api/src/modules/wms/application/off-hours-audit.service.ts + repo; weekly cron routing via resolveUserIds fallback 'director'/'hr'
- **DB-proof:** VERIFIED: shift_schedules has employee_id/shift_date/start_time/end_time (30 rows live); material_movements.performed_by=integer; employees.user_id populated (31/… linked). Proof join executed clean (empty=empty DB, no schema error). Shift-schedule read is NOT a blocked HR area (only razryad/salary/payroll are blocked). Flag computed in-report → no new column. RBAC routing to director/hr. No owner threshold (off-hours = movement time outside shift start/end).

### #32 — Rohler chaqiruv eskalatsiya 15/30/60 daqiqa
- **Files:** New cron apps/api/src/modules/wms/infrastructure/cron/internal-request-escalation.cron.ts over internal_requests; escalate via NotificationRoutingRepository.resolveUserIds (RBAC ladder operator→warehouse_head→director)
- **DB-proof:** VERIFIED: 15/30/60 ladder is VISION-GIVEN (10-warehouse.md #32 title). internal_requests has request_no/status/urgency/created_at/telegram_message_id (live). DT-MAT reason code EXISTS (mes_downtime_reasons code='DT-MAT'/'DT-MAT-WAIT', category='material'). resolveUserIds is RBAC (role-based, not org head_user_id) → ladder is buildable. CORRECTION to first agent: do NOT insert a standalone downtime_events row — downtime_events.session_id is NOT NULL and an unfulfilled internal_request carries no MES session; instead reference the DT-MAT/DT-MAT-WAIT reason code in the notification (metadata/notes). Core escalation → notifications is buildable now; no new schema/owner/blocked/dep.

### #45 — PP rezervi inventar muzlatishdan USTUN
- **Files:** apps/api/src/modules/wms/application/inventory-freeze.service.ts (checkExitAllowed: add stock_reservations pre-freeze lookup, return allowed=true tagged 'KUTMOQDA'); add reservation query in apps/api/src/modules/wms/infrastructure/repositories/inventory-freeze.repository.ts (findActiveFreeze:21)
- **DB-proof:** VERIFIED: rule + KUTMOQDA tag are VISION-GIVEN (10-warehouse.md #45: 'Muzlatish faqat yangi harakat blok', 'PP muddat rezervi KUTMOQDA'). checkExitAllowed exists AND is WIRED into live goods-issue hard-gate (goods-issue.handler.ts:95). stock_reservations (material_id/warehouse_id/status/created_at) + inventory_freeze_zones (frozen_at/status/material_id/warehouse_id) exist. Query stock_reservations from the freeze repo (no WMS reservations-repo exists yet, but table does) — no new schema, no owner value. ExitFreezeCheck interface gains a KUTMOQDA tag (code change, not schema).

### #47 — Kunlik hisobot barcha ombor turlari (CRON)
- **Files:** New cron apps/api/src/modules/wms/infrastructure/cron/daily-warehouse-report.cron.ts reading WmsCatalogDashboardService (apps/api/src/modules/wms/application/wms-catalog/dashboard.service.ts — getStatsTotal already LEFT JOINs warehouses → zero-activity included); route via resolveUserIds (warehouse_head=detailed, director=summary)
- **DB-proof:** VERIFIED: dashboard.service.ts exists (dep item #91) with getStatsTotal/getDashboardKpis/getMovementSummary/getDashboardAlerts. warehouses + warehouse_types tables exist → 'all types, empty=0' via LEFT JOIN. Recipient split (warehouse_head=detailed, director=summary) is VISION-GIVEN (10-warehouse.md #47). RBAC routing, no org head_user_id. Only gap is the CRON writer — no new schema, no owner value.

### #65 — Avans to'lov ↔ yetkazish bog'lanishi (yopilmagan avanslar)
- **Files:** New read service apps/api/src/modules/wms/application/advance-linkage.service.ts + controller (or Finance read-model); joins mm_goods_receipts + advance_payments
- **DB-proof:** VERIFIED: advance_payments has vendor_id/purchase_order_id/settlement_status/settled_amount/amount; mm_goods_receipts has supplier_id/purchase_order_id/receipt_number (all live). Proof join (ap.vendor_id=gr.supplier_id AND ap.purchase_order_id=gr.purchase_order_id WHERE settlement_status<>'settled') executed clean. Pure cross-module READ-model — not Finance SoD user-provisioning (which is the blocked Finance area). No new schema, no owner value.

### #88 — Norma og'ish tahlili (norma/fakt %)
- **Files:** apps/api/src/modules/pos/application/services/material-norms.service.ts (add getDeviation reader) + controller GET endpoint
- **DB-proof:** VERIFIED: material-norms.service.ts exists with list/getById/create/update/deactivate/recalculateAi. material_norms has material_id/norm_quantity_per_1000/formula; material_movements has material_id/movement_type/quantity. getDeviation is a plain read+compute ((actual-norm)/norm, vision-given standard) — INDEPENDENT of the AI populator, so NO AI credential needed; norms are also populatable via the existing manual create(). Table empty=0 rows (runtime, not build). No new schema, no owner value, no blocked area.

## 06 SD/Sotuv — 3 buildable

### #43 — Margin/costPrice field-masking by role (SdOrderProjection::forRole)
- **Files:** apps/api/src/modules/sd/presentation/sd-quotations.controller.ts (add @CurrentUser() to calculatePrice — decorator already imported line 26; pass user.role to service). apps/api/src/modules/sd/application/sd-quotations.service.ts:118-124 (strip margin+costPrice from the returned object when role NOT in [director, super_admin]). VISION-PRIMARY surface also = sd-quotations.repository.ts getQuotationById:191 / listQuotations (both return sd_quotations.margin + cost_price columns) — mask there too for full #43 fidelity; the item's calculatePrice-only scope is narrower than vision but is itself buildable.
- **DB-proof:** RBAC path is LIVE: Role enum (common/constants/roles.constants.ts), RolesGuard + @Roles(...SD_ROLES) at controller lines 29/60, @CurrentUser imported line 26. calculatePrice (service:118-124) returns margin+costPrice unconditionally to sales_manager/SALES today. No schema change. Behavioral proof: POST /sd/calculate-price with a sales_manager JWT -> response has NO margin/costPrice; with a director JWT -> both present. CAVEAT (corrected): vision #43 grants margin to ['director','sales_manager_senior'], but 'sales_manager_senior' does NOT exist in the Role enum — implement with existing roles (director/super_admin see; sales_manager/SALES masked). A senior-manager tier would need the owner to define that role, but its absence does not block the core masking.

### #47 — Surface queue_position/estimated_start on the SD order card
- **Files:** apps/api/src/modules/pp/application/queries/get-production-queue.handler.ts:64-77 (buildQueue output map — it already emits rank=queue_position; add sales_order_id + scheduled_start[as estimated_start], both already present because it SELECT *'s production_orders into byId at line 42-48). SD order-card read model / FE: join the PP queue entry by sales_order_id. production-priority.service.ts:119 buildQueue + pp-queue.controller.ts:41 GET /pp/queue are the BUILT, wired dependency.
- **DB-proof:** DB proof: production_orders has queue_sequence(integer), scheduled_start(timestamp), sales_order_id(integer) — no new table/column (the literal column names queue_position/estimated_start do NOT exist, but the item correctly DERIVES them from rank/list-index + scheduled_start, so no DDL). GetProductionQueueHandler.execute already returns rank(idx+1)==queue_position; after adding sales_order_id + scheduled_start to its output map, GET /pp/queue returns queue_position + estimated_start per order; SD card looks it up by sales_order_id. SCOPE NOTE: this confirms only the narrow SURFACING of the two fields — NOT the full vision #47 3-criterion (promised_date/ABC/workload) AI ranking, which buildQueue does not implement.

### #108 — KP (quotation) auto-PDF reusing the invoice PDF service
- **Files:** NEW apps/api/src/modules/sd/invoices/sd-quotation-pdf.service.ts (reuse the pdf-lib draw-row/_buildPdf pattern from apps/api/src/modules/sd/invoices/sd-invoice-pdf.service.ts) — MUST also register it in apps/api/src/modules/sd/sd.module.ts providers (like SdInvoicePdfService at :139). apps/api/src/modules/sd/presentation/sd-quotations.controller.ts (add GET /sd/quotations/:id/pdf). Data: sd-quotations.repository.ts getQuotationById:191 already exists; add a getQuotationItems query over sd_quotation_items for the PDF line rows.
- **DB-proof:** sd-invoice-pdf.service.ts (pdf-lib, generateInvoicePdf -> Result<Buffer>) is the LIVE reuse precedent, already provided in sd.module.ts. DB proof: sd_quotations has quotation_number/total_amount/total_price/valid_until/margin/cost_price; sd_quotation_items table exists with quantity/unit_price/cost_price/product_type (line rows). getQuotationById:191 returns the header+customer_name. Proof: create a quotation, GET /sd/quotations/:id/pdf -> non-empty application/pdf byte stream; SELECT count(*) FROM sd_quotations confirms the source row. No schema change.

## 07-pp — 8 buildable

### #3 — Pessimistic lock for parallel session collision on one stanok
- **Files:** apps/api/src/modules/mes/application/commands/start-session.handler.ts + apps/api/src/modules/mes/infrastructure/repositories/drizzle-mes.repo.ts (getSession/saveSession/withTransaction already accept tx)
- **DB-proof:** VERIFIED on existing schema. production_sessions HAS work_center_id (confirmed via information_schema). Repo already exposes withTransaction() and getSession(id,tx?)/saveSession(session,tx?). CORRECTION to first agent's proof: session statuses are 'in_progress'/'running' — there is NO 'active' value, so the proof must be `SELECT count(*) FROM production_sessions WHERE work_center_id=X AND status IN ('in_progress','running') = 1`, not status='active'. Implementation: wrap getSession->start->saveSession in the existing withTransaction(), take pg_advisory_xact_lock(work_center_id) (or SELECT ... FOR UPDATE), and reject if a sibling session on the same work_center_id is already in_progress/running. No new table/column, no owner threshold, MES-only (not a blocked area).

### #38 — Worst-machine OEE ranking + separate brak% flag (Director)
- **Files:** new read endpoint/service under apps/api/src/modules/iot/oee or apps/api/src/modules/pp; reads mes_shift_stats + work_centers.brak_limit_pct
- **DB-proof:** VERIFIED. mes_shift_stats (6 rows) has machine_id/oee/defect_qty/produced_qty; the machine_id values (5,6,7,8,9,11) map 1:1 to work_centers.id (5=OFFSET-1 ... 11=FLEXO-1), so the join mes_shift_stats.machine_id = work_centers.id is valid. work_centers.brak_limit_pct is populated per work center (1.00-3.00) — a stored master-data threshold, NOT a value the developer must invent. Read-only: SELECT machine_id, oee, defect_qty::float/NULLIF(produced_qty,0) AS brak_pct FROM mes_shift_stats JOIN work_centers wc ON wc.id=machine_id ORDER BY oee ASC; flag rows where brak_pct > wc.brak_limit_pct. No schema/owner change; OEE% primary + separate flag is fixed by vision.

### #86 — Daily replan cron (Reja/Tasdiqlangan only, skip frozen)
- **Files:** new cron under apps/api/src/cron/ + apps/api/src/modules/pp/domain/services/production-priority.service.ts (buildQueue) + apps/api/src/modules/pp/production-orders/production-orders.service.ts (reorderQueue) / drizzle-pp-production-orders.repo.ts (reorderQueue persistence)
- **DB-proof:** VERIFIED. buildQueue (production-priority.service.ts:119) returns frozen orders first in their committed sequence (never re-ranked) then flexible orders ranked ZARUR->deadline->band — 'skip frozen' is already the coded behavior. reorderQueue (drizzle-pp-production-orders.repo.ts:206) persists queue_sequence 1..N atomically (two-phase negative-then-positive to dodge the unique index) and writes ONLY queue_sequence, so is_frozen is untouched. @Cron infra is live (100+ cron files, e.g. cron/*.cron.ts). Cron iterates work_centers, loads status IN ('planned','confirmed') orders, calls buildQueue, persists via reorderQueue. Proof: queue_sequence re-ranked for non-frozen; is_frozen rows unchanged. No schema/owner/blocked.

### #89 — CancelProductionOrder command (mandatory reason + WIP/alloc reversal)
- **Files:** new command/handler under apps/api/src/modules/pp + production-orders/production-orders.service.ts (updateStatus already logs reason) + production-orders/drizzle-pp-production-orders.repo.ts; aggregate.cancel() in domain/aggregates/production-order.aggregate.ts
- **DB-proof:** VERIFIED on existing schema. aggregate.cancel() (production-order.aggregate.ts:216) validates the transition to CANCELLED via PO_STATUS_TRANSITIONS. production-orders.service.updateStatus(id,status,changedBy,reason) ALREADY writes production_order_status_log with the reason — so the status-flip + mandatory-reason logging half is essentially in place; the command just enforces reason non-empty. NEW work = reverse production_material_allocs: it has production_order_id/status/returned_qty columns (all exist). CORRECTION to first agent: there is NO existing alloc-return writer to 'reuse' — production/production.repository.ts only READS production_material_allocs (SELECT at :250); material-balance.repository writes returned_qty into a different (movements) table. So the reversal is a net-new UPDATE production_material_allocs SET status=..., returned_qty=allocated_qty on existing columns. No new table/column, no owner threshold, PP-owned (not blocked). Proof: cancel with reason -> production_order_status_log row + alloc rows reversed for that order_id.

### #106 — 3-timer daily dashboard (elapsed/remaining/not-started)
- **Files:** new read endpoint/service in apps/api/src/modules/pp (e.g. production/production.repository.ts or a pp-queue read handler)
- **DB-proof:** VERIFIED. production_sessions has started_at/ended_at/start_time/end_time; production_orders has planned_start_date/planned_end_date/actual_start/actual_end. Note planned_start_date/actual_start_date are character varying, so the aggregation must cast (planned_start_date::date/::timestamp) — trivial, no schema change. Pure bucketing query counting: elapsed (started, not ended), remaining (planned, not started), not-started. No owner threshold, no blocked area. Proof: bucket counts match manual timestamp math over the 7 production_orders / 8 production_sessions rows.

### #107 — Waiting-zone-with-reason dashboard
- **Files:** new read endpoint in apps/api/src/modules/pp + FE screen; joins production_orders.reason_code_id -> pp_reason_codes filtered by waiting statuses
- **DB-proof:** VERIFIED. production_orders.reason_code_id EXISTS and IS written by updateFlags (drizzle-pp-production-orders.repo.ts:147 UPDATE ... SET reason_code_id). pp_reason_codes table exists (0 rows now = build-phase seed data, not a blocker). CORRECTION to first agent: 'qc_hold' is NOT a valid status — the PoStatus enum has 'in_qc' (and live data has 'paused'/'in_progress'/'completed'). Waiting bucket = status IN ('paused','in_qc'). SELECT o.id, r.name FROM production_orders o JOIN pp_reason_codes r ON o.reason_code_id=r.id WHERE o.status IN ('paused','in_qc'). No schema change; choosing paused/in_qc as 'waiting' is a reasonable default, not owner-DATA.

### #110 — Clone latest approved tech card on repeat order
- **Files:** apps/api/src/modules/pp/technology/technology.controller.ts (new @Post clone endpoint) + technology.service.ts + technology.repository.ts (NEW cloneLatestApproved method — do NOT route through createCard)
- **DB-proof:** Buildable on existing schema BUT first agent's proof is materially wrong and corrected here. technology_cards has product_id/version/status/lab_approved (all columns exist) and versioning/snapshot infra is live (tech_card_versions, updateCard version-bump, restoreVersion). CRITICAL CORRECTION: createCard (technology.repository.ts:196) does NOT insert product_id (INSERT column list omits it), and product_id is never queried anywhere in technology/*.ts; the single live card has product_id=NULL. So a clone routed through createCard would write product_id=NULL and the cited proof (count WHERE product_id=X increases) would FAIL. Correct implementation: a dedicated cloneLatestApproved(productId) repo method that SELECTs max(version) WHERE product_id=X AND lab_approved=true and INSERTs a full copy INCLUDING product_id (code-only, no DDL). Linkage is build-phase-sparse (cards created without product_id), so the create/AI paths must also write product_id for resolution to work — still code-only. No new table/column, no owner threshold, tech-cards not a blocked area.

### #142 — Monthly reason-code Pareto aggregation report
- **Files:** new report endpoint/service in apps/api/src/modules/pp; sources pp_reason_codes + production_orders.reason_code_id (+ optionally production_order_status_log)
- **DB-proof:** VERIFIED. Pure aggregation on existing columns: production_orders.reason_code_id (written by updateFlags, confirmed) and pp_reason_codes (names). production_order_status_log exists too. SELECT reason_code_id, count(*) FROM production_orders WHERE reason_code_id IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, joined to pp_reason_codes for labels. Sparse rows now (pp_reason_codes 0, status_log 0) = build-phase data, not a schema/owner blocker. Pareto = sorted counts, no owner weighting. No blocked area.

## 20 CC — 3 buildable

### #128 — Hujjatlar zanjir bog'lanishi (parent_document_id yozuv yo'li)
- **Files:** cc-documents.controller.ts (CreateDraftSchema: + parentDocumentId: z.string().uuid().optional()); cc-workflow.types.ts (CreateDraftDto: + parentDocumentId?: string | null); cc-workflow.service.ts createDraft (pass dto.parentDocumentId ?? null into docs.createDraft(...)); infrastructure/repositories/cc-documents/cc-documents-write.repo.ts createDraft (add parent_document_id to INSERT column list + ${input.parentDocumentId} to VALUES); cc-documents/types.ts CreateDraftInput (+ parentDocumentId: string | null)
- **DB-proof:** RE-VERIFIED: column cc_documents.parent_document_id = uuid, is_nullable=YES (DB confirmed). grep across whole CC module shows it ONLY at read.repo:81 (SELECT ... AS parentDocumentId) and types.ts:27 — NEVER in any INSERT; createDraft INSERT (write.repo:33-47) omits it, so every row is NULL today. Purely additive: no new table/column/enum, no owner threshold, no blocked area (no head_user_id/razryad/AI/bilingual), no unbuilt dep. Proof: POST /api/cc/documents/draft with parentDocumentId=<an existing cc_documents.id>, then SELECT parent_document_id FROM cc_documents WHERE id='<newId>' returns that uuid (was always NULL).

### #3 — Ikki uchastka boshlig'ida marshrut noaniq bo'lsa ambiguous_route log
- **Files:** application/cc-org-resolver.service.ts (add a detection helper, e.g. countActiveByPosition(code) that runs the resolveByPosition query WITHOUT LIMIT 1 and returns candidate count — do NOT change resolveApprover's Result<number> contract); application/cc-workflow.service.ts createFirstStepApprovals (when step.approverPositionCode starts with 'POSITION:' and count>1, call this.docs.logAudit action='ambiguous_route'); write.repo logAudit (ALREADY EXISTS at cc-documents-write.repo.ts:270 — reuse, no new code)
- **DB-proof:** RE-VERIFIED as genuinely unbuilt: cc-workflow.service.ts:138-180 already journals 'approver_unresolved' and 'self_route_blocked', but resolveByPosition (org-resolver:192-213) does ORDER BY e.id ASC LIMIT 1 with ZERO ambiguity detection — silently picks one. cc_audit_trail.action = varchar, comment = text (DB confirmed) so the string is additive. logAudit(documentId, action, comment) exists; createFirstStepApprovals has doc.id + step in scope. Position-code resolution is the allowed RBAC path and READ-ONLY over positions/employees (NOT head_user_id backfill) → not blocked. count>1 is structural ambiguity, not an owner-set threshold. Proof: seed 2 active employees (user_id NOT NULL) sharing one positions.code, a template whose first cc_workflow_steps.approver_position_code='POSITION:<CODE>', send a doc → SELECT action,comment FROM cc_audit_trail WHERE action='ambiguous_route' ORDER BY performed_at DESC LIMIT 1 returns a row (0 today); pick-one send behavior unchanged.

### #36 — Yangi versiya yaratilsa eski Kanban kartaga 'eskirgan' belgisi (avto-ko'chirmasdan)
- **Files:** application/cc-kanban-bridge.service.ts (add markCardStale(documentId): UPDATE kanban_cards SET title = title || ' [ESKIRGAN]' WHERE related_type='cc_document' AND related_ref=<docId> AND title NOT LIKE '%[ESKIRGAN]%'); application/cc-workflow.service.ts (CORRECTION vs first agent: inject CcKanbanBridgeService into the constructor — it is a registered provider at communication-center.module.ts:93 — and call bridge.markCardStale(doc.id) from resubmit() after the runResubmitTx transaction); optionally cc-workflow/cc-workflow-reject-resubmit.helpers.ts (only if calling inside runResubmitTx, add a bridge param — the helper currently receives no bridge)
- **DB-proof:** RE-VERIFIED: kanban_cards.title=text, related_type=varchar, related_ref=text (DB confirmed). Bridge links cards via related_type='cc_document' + related_ref=String(documentId) (createCardForDocument:59-73). CcKanbanBridgeService IS a provider in the same module (module:93) → injects cleanly into CcWorkflowService (whose constructor currently lacks it — this is the file-list gap the first agent missed). Additive title-append, no new column/threshold/blocked-area/unbuilt-dep. NOTE for proof: the plain POST /documents/draft path (wf.createDraft:51-74) does NOT create a card — a card is auto-created only via the AI-interview finalize path (bridge.createCardForDocument, per bridge header). Proof: create doc via the card-creating (AI-interview) path → send → reject → resubmit → SELECT title FROM kanban_cards WHERE related_type='cc_document' AND related_ref='<docId>' shows ' [ESKIRGAN]'.

## 04-coordination — 1 buildable

### ##4 — Event-driven Rasporyazheniye status → COR % update
- **Files:** Emit on status change from apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts (updateRasp/markRaspDone/updateDokla). CORRECTION: the first agent's 'write a domain_events row via outbox-event-writer.service.ts' is wrong — OutboxEventWriter is a CQRS EventBus SUBSCRIBER (onModuleInit -> eventBus.subscribe) with no public write method. Two valid LIVE write paths: (a) inject EventBus and publish a NEW event class (e.g. director/domain/events/rasporyazhenie-status-changed.event.ts) — OutboxEventWriter auto-persists every bus event into domain_events; or (b) inject OutboxRepository (@shared/outbox) and call insertBatch([...]) directly, the same pattern SD create-order uses. New CQRS listener apps/api/src/modules/director/infrastructure/event-handlers/rasporyazhenie-status.listener.ts modeled on the existing advance-bypass-approved.listener.ts (@EventsHandler) re-queries CoordinationService.getStats — getStatsRasp already computes done/total/overdue over rasporyazhenie.
- **DB-proof:** domain_events table + OutboxRepository.insertBatch/fetchUnpublished + OutboxEventWriter (bus->domain_events) + OutboxPublisher (@Interval 10s) all verified live; CoordinationRepository.getStatsRasp already returns {assigned,in_progress,done,overdue,total}. After PATCH /coordination/rasporyazhenie/:id status change: node _audit/q.cjs "SELECT event_name,aggregate_id FROM domain_events WHERE event_name ILIKE 'rasporyazhenie%' ORDER BY occurred_at DESC LIMIT 1" returns the emitted row (event_name = the new event class name, e.g. RasporyazhenieStatusChangedEvent, matches ILIKE 'rasporyazhenie%'), and getStats reflects the new done/total. No CREATE TABLE / ADD COLUMN, no owner threshold, no blocked area (rasporyazhenie.to_user is a plain user id — no org head_user_id / razryad / salary / AI routing), no unbuilt dependency.

## 13-crm — 6 buildable

### #2 — Round-robin race: concurrency guard on manager pick
- **Files:** apps/api/src/modules/crm/listeners/website-lead.repository.ts:37 (pickNextSalesManager) + website-lead.service.ts:41,75 (the pick+insert are two SEPARATE awaits, so the race spans both calls, not just the query).
- **DB-proof:** CORRECTION to first agent: FOR UPDATE SKIP LOCKED CANNOT be added to pickNextSalesManager — its query is a LEFT JOIN + GROUP BY aggregate, and Postgres rejects FOR UPDATE on a GROUP BY query ('FOR UPDATE is not allowed with GROUP BY clause'). Use a pg advisory lock (pg_advisory_xact_lock with a fixed round-robin key) wrapping the pick+insert inside one db.transaction in website-lead.service.ts, so concurrent leads serialize. Routing is RBAC (employees.role='sales_manager', is_active) — verified column exists — NOT org head_user_id, so allowed. Prove: fire two concurrent website-lead inserts; SELECT manager_id,count(*) FROM crm_leads WHERE created_at>now()-interval '1 minute' GROUP BY manager_id — no manager double-assigned. No schema/owner input.

### #4 — Manager field-visit entry via mobile (GPS optional)
- **Files:** apps/api/src/modules/crm/infrastructure/repositories/crm-activities.repository.ts create() (lines 109-123) + application/crm-activities.service.ts create() + presentation/crm-activities.controller.ts create() (line 85-88) + dto/crm-activities.dto.ts + CRM activities FE.
- **DB-proof:** Verified: crm_activities is a base table; type is free-text with NO check constraint; communication_data(jsonb) and scheduled_at columns EXIST. CORRECTION: the current create path does NOT persist them — controller passes only (type,subject,lead_id,deal_id,assigned_to,due_date,notes,status) and repo.create inserts exactly those. So this needs the service+repo create signature extended to write communication_data (address/GPS) + scheduled_at (both existing columns; no ALTER). Then POST a visit → SELECT type,communication_data,scheduled_at,notes FROM crm_activities WHERE type='visit' shows the jsonb GPS/address persisted. No new column, no owner input.

### #14 — Export row-scope WHERE assigned_to=current_user + audit
- **Files:** apps/api/src/modules/crm/presentation/crm-deals.controller.ts (NOT deals/... as cited — controller lives in presentation/) + reuse apps/api/src/modules/crm/common/crm-row-scope.ts (crmOwnerScope/crmSeesAllRows, already implemented) + DealsService.findAll(user) scoping + audit_logs table (exists).
- **DB-proof:** Verified: crm_deals view exposes assigned_to; list()/findOne() are ALREADY row-scoped via crmOwnerScope/crmSeesAllRows (RBAC, privileged roles see all); audit_logs exists with action/user_id/user_role/table_name columns; NO export endpoint exists yet on deals. Add GET /crm/deals/export reusing crmOwnerScope(user) so a non-privileged manager exports only assigned_to=self and privileged roles export all; write an audit_logs row (action='export'). Prove: manager A export count == count WHERE assigned_to=A; then SELECT ... FROM audit_logs WHERE action='export' LIMIT 1. NOTE (as agent flagged): field-level RBAC (which COLUMNS each role may export) is a separate owner-policy concern — defer; only the row-scope + audit is built now. No schema change.

### #16 — 360 parallel per-block queries + skeletons
- **Files:** artifacts/erp-dashboard/src/components/sd/Customer360View.tsx (the single composite fetch GET /api/sd/customers/:id/360 is here, line 130-133) + per-tab components (OrdersTab/FinanceTab/ComplaintsTab/etc).
- **DB-proof:** FE refactor, existing schema. CORRECTION to 'existing endpoints': today it is ONE composite /360 fetch. Standalone per-block GET endpoints DO exist for complaints (:id/complaints), documents (:id/documents), interactions, nps, competitors, contacts — but there is NO standalone :id/orders or :id/payments (those are only inside /360). So split blocks that have endpoints into their own useQuery+Skeleton; for orders/payments either keep /360 or add a thin GET reading existing tables (no schema change). Prove in network panel: blocks fetch in parallel, each with an independent skeleton. No schema/owner input.

### #50 — CRM offline PWA (lead+activity; KP online-only; server-wins)
- **Files:** Extend artifacts/erp-dashboard/src/lib/erp-offline-db.ts (REAL IndexedDB queue — already queues QC rechecks + POS movements with detectConflict/last-write-wins) + src/hooks/useErpOfflineSync.ts (add CRM lead/activity sync) + CRM lead/activity create forms (offline-enqueue) + block KP create offline. PWA infra: vite-plugin-pwa in vite.config.ts.
- **DB-proof:** Verified the offline foundation is real, not greenfield: erp-offline-db.ts uses IndexedDB object stores with synced/conflicted/wallClock + vector-clock conflict detection; useErpOfflineSync auto-syncs on 'online'. Follow the same pattern to add lead/activity queues using existing FE create endpoints; server-wins conflict policy is specified in the vision (no owner input). Block KP creation while offline (FE guard). Prove: create a lead offline, reconnect, SELECT crm_leads WHERE contact_phone=... shows the queued lead persisted; offline KP attempt refused. Substantial FE effort but no schema/owner/blocked/unbuilt-dep.

### #93 — GP-kod repeat-order button (clone past deal)
- **Files:** apps/api/src/modules/crm/deals/drizzle-crm-deals.repo.ts (create() already INSERTs through the crm_deals VIEW successfully) + presentation/crm-deals.controller.ts (add clone/reorder endpoint).
- **DB-proof:** Verified: is_repeating/is_recurring/is_return_customer flags exist on base `deals` AND are exposed by the crm_deals view; the existing create() already inserts through the view (auto-updatable). No existing reorder/clone endpoint (grep found only crm-custom-fields reorder). Add a clone endpoint: fetch source deal, INSERT a new deal copying title/opportunity/company_id/etc and set is_repeating=true — CORRECTION: the current INSERT column list does NOT include these flags, so extend it (columns already exist; no ALTER). Prove: POST clone from deal X → SELECT id,is_repeating,title FROM crm_deals ORDER BY date_create DESC LIMIT 1 shows the cloned row flagged. Basic clone only; diff/per-field-consent = Item 22. No schema/owner input.

## 14-marketing — 13 buildable

### #14-2 — Telefon +998 avto-normalizatsiya + dublikat merge
- **Files:** CORRECTED: cited crm create/update-lead.handler.ts is a DEAD CQRS path (CreateLeadCommand dispatched nowhere — self-admitted in the file comment). Live write path = crm/infrastructure/repositories/crm-leads-ops.repository.ts (writes crm_leads.contact_phone/source) + crm/application/crm-auto-lead.repository.ts. A PhoneNumber VO already exists (shared/domain/value-objects/phone-number.vo.ts) and strips spaces/dashes/parens to E.164 — reuse it, do NOT write a new util. Dedup merge endpoint + soft-merge via existing crm_leads.deleted_at; repoint sd_lead_activities.lead_id + crm activities to canonical.
- **DB-proof:** crm_leads.phone (text), contact_phone, deleted_at all exist (verified). SELECT phone,count(*) FROM crm_leads WHERE deleted_at IS NULL GROUP BY phone HAVING count(*)>1 detects dups; after merge SELECT deleted_at FROM crm_leads WHERE id=<dup> is non-null and sd_lead_activities repointed. CAVEAT: crm_leads has THREE phone columns (phone/contact_phone/phones-jsonb) — pick `phone` as canonical (code decision, not owner-gated).

### #14-8 — Dizayn bosqichiga o'tganda marketing→dizayn Kanban vazifasi avto-yaratiladi
- **Files:** Verified: ERP_EVENTS.SO_DESIGN_REQUESTED (emitted in sd/create-order.handler.ts) + DesignApprovedEvent (published by design/update-design-status.handler.ts) exist; DesignRejectedEvent CLASS exists in design/domain/events/index.ts but is NOT emitted — add emission on DesignStatus.REJECTED in update-design-status.handler.ts. Card create = KanbanExtCardService.createCardFlat (kanban-ext-card.service.ts). New listener under kanban/application/event-handlers/ (pattern: order-created-kanban.handler.ts).
- **DB-proof:** kanban_cards/kanban_columns exist. SELECT count(*) FROM kanban_cards before/after a design-stage transition increments by 1. CAVEAT: the 'move card back to text column' on reject needs target column resolution via kanban_columns lookup — code detail, not schema/owner-gated; core auto-create is solid.

### #14-11 — 'Ritm' birinchi 3 buyurtmadan keyin hisoblanadi, N sozlanadi
- **Files:** New marketing/application/customer-rhythm.service.ts over sales_orders; read N from marketing_settings KV (id/key/value/category — table verified). Default N=3 (specified in the item title, not owner-pending).
- **DB-proof:** sales_orders.customer_id + order_date (date) verified. INSERT marketing_settings(id,key,value,category) then service over SELECT customer_id,order_date FROM sales_orders WHERE customer_id=X ORDER BY order_date returns avg-days matching manual calc, only after >=3 orders.

### #14-12 — 'Kichiklashgan buyurtma' signali (faqat pul qiymati kamayganda)
- **Files:** New marketing/application/order-trend.service.ts computing per-customer moving avg of sales_orders.total_amount; read endpoint. Optional decline threshold in marketing_settings KV with a default (recent-avg < historical-avg needs no threshold at all).
- **DB-proof:** sales_orders.total_amount (numeric) + order_date verified. Customers whose recent avg total_amount < historical avg surface, keyed on money value not qty.

### #14-30 — Diler AR balansini faqat moliya+marketing boshliq ko'radi (field RBAC)
- **Files:** getChurnRisk (marketing-ext.service.ts:291 + drizzle-marketing-ext.repo.ts:668) exposes openDebt via GET marketing-analytics-stubs.controller.ts:187. RolesGuard + @Roles already used in this controller. CORRECTION: role 'marketing_head' does NOT exist in roles.constants.ts — use existing Role.FINANCE ('finance' verified present) + 'marketing_manager'/'director'. RBAC field-masking path exists (no org head_user_id routing).
- **DB-proof:** Pure code, no schema. Mask openDebt in the serializer for non-finance roles. NOTE: current GET only allows super_admin/marketing_manager/director; widening to give 'manager' a masked badge is part of the change.

### #14-43 — Diler 'manba: diler' maydoni (marketing xodimi nomidan)
- **Files:** CORRECTED: cited create-lead.handler.ts is the DEAD CQRS path. Live crm write = crm-leads-ops.repository.ts (source col, verified free varchar with NO check constraint); live marketing write = marketing/leads/leads.repository.ts (marketing_leads.source, defaults 'website'). Add 'diler' to allowed source values + set created_by. NOTE column is crm_leads.created_by_id (not created_by).
- **DB-proof:** source is varchar, zero check constraints (verified) → NO ALTER. INSERT a lead source='diler'; SELECT source,created_by_id FROM crm_leads WHERE id=X returns 'diler' + the marketing user id.

### #14-46 — 3 oy buyurtma bermagan mijozga win-back avto-start + SD aktiv lid tekshiruv
- **Files:** New marketing win-back.cron.ts (cron infra proven — 20 *.cron.ts files, e.g. crm/cron/lead-aging-reassign.cron.ts). Detect inactive customers from sales_orders; check crm_leads for open lead; create kanban task (createCardFlat) assigned to crm_leads.manager_id (lead's own manager field — NOT org head_user_id routing).
- **DB-proof:** SELECT customer_id,max(order_date) FROM sales_orders GROUP BY customer_id HAVING max(order_date) < now()-interval '3 months' → each gets a win-back task UNLESS an open lead exists. 3-month value specified in title (not owner-pending).

### #14-55 — 'Kichiklashgan buyurtmalar' signali (dup of #12)
- **Files:** DUP of 14-12 — same order-trend.service.ts over sales_orders.total_amount. Build ONCE, shared endpoint serves 14-12/55/63.
- **DB-proof:** Same SELECT-based proof as 14-12.

### #14-63 — Nosirov 'Kichiklashgan buyurtmalar' avto (dup of #12/#55)
- **Files:** DUP of 14-12/14-55 — do not build three times; same order-trend.service.ts.
- **DB-proof:** Same proof as 14-12.

### #14-75 — Papka № (PT/KT/E) bo'yicha 'takror qil' tugmasi
- **Files:** papka_orders.papka_no + papka_orders.sales_order_id both verified. New lookup endpoint: papka_no → papka_orders.sales_order_id → reuse the EXISTING 'Takrorlash'/clone flow in artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx (VISION-3340 #53, already real — lines 209/798).
- **DB-proof:** SELECT papka_no,sales_order_id FROM papka_orders; endpoint resolves papka_no to its sales_order and returns line items for prefill into the existing repeat draft.

### #14-77 — NPS oldidan oxirgi brak/reklamatsiya tekshiruvi
- **Files:** nps-requests.repository.ts createFromDelivery + nps-auto-request.listener.ts — before insert, check qc_reclamations (is_resolved boolean + customer_id verified) for the delivery's customer; skip (create no row) if an open reclamation exists. NARROWER than 14-7: needs NO new status value → NOT schema-gated.
- **DB-proof:** With an open qc_reclamation (is_resolved=false) for the customer: SELECT count(*) FROM nps_requests WHERE delivery_id=X stays 0; with none open it becomes 1. Works entirely on existing schema.

### #14-87 — Marketing dizayn bandligini (kanban yuki) ko'rib va'da bermaydi
- **Files:** Read-only aggregate: kanban read service + marketing consumer. kanban_cards.column_id + kanban_columns verified. Expose live card count per design column.
- **DB-proof:** SELECT column_id,count(*) FROM kanban_cards GROUP BY column_id → design column's live count surfaced read-only to marketing before quoting dates. No schema, no owner input.

### #14-90 — Savdo menejer kartasida faollik+natija statistikasi
- **Files:** New marketing/application/manager-kpi.service.ts + repo aggregating sd_lead_activities by manager_id. Columns verified: sd_lead_activities has lead_id/type/manager_id/created_at/deleted_at.
- **DB-proof:** SELECT manager_id,count(*) FROM sd_lead_activities WHERE deleted_at IS NULL GROUP BY manager_id → endpoint returns matching per-manager activity counts; results (natija) can join crm_leads.converted_at (exists).

## 15 Kanban — 13 buildable

### #A16 — Shablon N-qadam qayta ochilsa — cascade-freeze
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo.ts (toggleChecklistItem)
- **DB-proof:** Verified: the UUID kanban_checklist_items table (position INT NOT NULL, is_completed BOOL) is the LIVE checklist path — FE toggles via PUT /kanban/checklist-items/:id/toggle (useTaskDetailMutations.ts:69). Fetch item.checklist_id+position; on toggle-to-complete reject if an earlier-position item is still incomplete; on toggle-to-reopen at position P cascade-set is_completed=false for all position>P in same checklist. All existing columns. Proof: 3-item checklist, uncheck pos1 then attempt complete pos3 -> 400; SELECT is_completed ORDER BY position.

### #A24 — Ta'til 50+ vazifa — bulk-assign UI + queue
- **Files:** apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts (new PATCH cards/bulk-assign, no route collision with :id/assign) + KanbanExtService + repo; artifacts/erp-dashboard/src/hooks/useKanbanBoard.mutations.ts board UI
- **DB-proof:** No bulkAssign exists (grep clean). Reuse assignCard's UPDATE kanban_cards SET owner_user_id WHERE id IN (...). owner_user_id is a plain users FK (not org/HR blocked). NOTE: only bulk-assign is delivered; the 'queue' half is a follow-on. Proof: PATCH {ids:[..],userId} -> SELECT owner_user_id WHERE id IN(..) all = userId.

### #C6 — Jarayonda'ga: ijrochi+muddat to'ldirilgan bo'lsa
- **Files:** CORRECTED -> apps/api/src/modules/kanban/application/kanban-boards.service.ts (moveCard + assertCanMoveTo). (Audit cited kanban-cards.repo.ts moveCard, which is a dumb UPDATE; the only guarded move path is the service.)
- **DB-proof:** Single manual-move route PUT /kanban/cards/:id/move -> boardsSvc.moveCard -> assertCanMoveTo. Extend it: when statusFromColumnName(destName)===JARAYONDA, require the card's owner_user_id AND due_date non-null (add due_date to moveCard's existing pre-fetch SELECT). Uses existing columns + existing statusFromColumnName helper. Order/sales cards auto-move via repo (moveOrderCardByStatusMap) and bypass the guard, so golden-thread is unaffected. Proof: move card w/ null owner into Jarayonda col -> 400; fill owner+due -> 200.

### #C8 — WIP chegarasi: ko'pi bilan 3 ta Jarayonda
- **Files:** CORRECTED -> apps/api/src/modules/kanban/application/kanban-boards.service.ts (assertCanMoveTo). (Audit cited kanban-ext-card.service/kanban-cards.repo — wrong layer.)
- **DB-proof:** When statusFromColumnName(destName)===JARAYONDA, COUNT active cards already in that column (per-column WIP = natural reading of '3 ta Jarayonda'); if >=3 reject. No wip_limit column needed; limit 3 vision-specified; statusFromColumnName scopes the cap to In-Progress columns only (custom/Done columns unaffected). Proof: 3 cards in Jarayonda column, move a 4th in -> 400.

### #C29 — Bir kunda ko'pi bilan 2 Shoshilinch
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo.ts (createCardFlat) AND application/kanban-boards.service.ts (addCard — the live FE quick-add path posts to POST /kanban/boards/:id/cards)
- **DB-proof:** priority='urgent' confirmed as a live DB value. Guard per-CREATOR (assigner_user_id = acting user, already set by controller): before INSERT when priority='urgent', COUNT(*) WHERE priority='urgent' AND assigner_user_id=X AND created_at::date=CURRENT_DATE; reject the 3rd. Must be wired into BOTH create paths (addCard is the live quick-add). Non-regressive (only blocks a 3rd urgent, normal-priority create untouched). Proof: 2 urgent as user X today OK; 3rd -> 400.

### #C32 — Shoshilinch → shu kun oxiri muddat
- **Files:** apps/api/src/modules/kanban/application/kanban-boards.service.ts (updateCard) + drizzle-kanban-cards.repo.ts (createCardFlat) / addCard
- **DB-proof:** When priority set/transitions to 'urgent' and due_date is empty, set due_date = today (EOD). Existing priority + varchar due_date columns. Wire on both update and create paths. Proof: PUT card priority=urgent with empty due -> SELECT due_date = today's date.

### #C44 — Kuzatuvchi ko'pi bilan 5
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-engagement.repo.ts (addObserver) + application/kanban-ext-flow.service.ts + presentation/kanban-cards.controller.ts (addCardObserver)
- **DB-proof:** kanban_observers exists (UNIQUE(card_id,user_id) confirmed; 4 live rows). Before INSERT, SELECT COUNT(*) FROM kanban_observers WHERE card_id=X; if >=5 -> 400. Limit 5 vision-specified. Proof: add 5 observers OK, 6th -> 400. (DUPLICATE of #74.)

### #C46 — Kuzatuvchi @mention → xabar
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo.ts (addComment — live path for both /cards/:id/comments and /cards/:id/chat)
- **DB-proof:** Parse @token via regex in content; resolve SELECT id FROM users WHERE username = ANY(tokens) (all 32 users have non-empty username — verified); INSERT kanban_notifications rows (type='mention' — type is TEXT, no enum add). kanban_notifications + users.username both exist. Proof: comment '@<username> ..' -> SELECT kanban_notifications WHERE user_id=that user -> 1 new row. (DUPLICATE of #76.)

### ##72 — Kuzatuvchiga faqat muhim hodisa xabari
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo.ts (completeCard/acceptCard) + infrastructure/cron/kanban-overdue-escalation.cron.ts
- **DB-proof:** Observers currently receive NO event notifications (complete/accept notify only owner_user_id). Add branch: on complete + overdue-escalation, SELECT kanban_observers for the card and INSERT one kanban_notifications row each; routine moves stay silent, satisfying 'faqat muhim hodisa'. Existing tables only. Proof: complete a card with observers -> notification rows per observer; routine move -> none. (Event-set = interpretation of 'muhim hodisa'.)

### ##74 — Kuzatuvchi ko'pi bilan 5
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-engagement.repo.ts (addObserver) + presentation/kanban-cards.controller.ts (addCardObserver)
- **DB-proof:** Same as C44 — COUNT(*)<5 guard on kanban_observers before insert. Buildable on existing schema. (DUPLICATE of C44.)

### ##76 — @mention → xabar boradi
- **Files:** apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo.ts (addComment)
- **DB-proof:** Same as C46 — @username regex parse, resolve via users.username (populated), insert kanban_notifications (type TEXT). (DUPLICATE of C46.)

### ##118 — Vazifani 'qaytarish' sabab bilan
- **Files:** apps/api/src/modules/kanban/presentation/kanban-cards.controller.ts (new PUT cards/:id/reject) + service/repo
- **DB-proof:** No reject endpoint exists (grep clean). UPDATE kanban_cards SET owner_user_id = assigner_user_id (both columns exist) + INSERT reason into kanban_card_comments (uuid, card_id text — the live comment table). Proof: POST reject{reason} -> SELECT owner_user_id = assigner_user_id + a matching kanban_card_comments row present.

### ##124 — Bo'lim taxtasi kunlik 'letuchka' bir ekran
- **Files:** artifacts/erp-dashboard/src/pages (new board-scoped Letuchka page, DashboardPage template)
- **DB-proof:** Compose existing LIVE endpoints (verified in kanban-reports.controller.ts): GET /kanban/overdue-inbox, GET /kanban/dashboard/team-metrics, GET /kanban/reports/overdue. FE-only, board-scoped (pass boardId — no org-head resolution needed). No BE change, no unbuilt dep. Proof: drive FE, page renders composed overdue+metrics.

## 12-lms — 3 buildable

### #3 — 2 marta yiqilsa auto qayta-o'qish + murabbiy/HR xabar
- **Files:** apps/api/src/modules/lms/application/services/lms-exams.service.ts (submitExam:47 — after grading, when !passed, COUNT failed attempts); apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-exams.repo.ts (COUNT(*) WHERE lms_exam_attempts.exam_id=? AND passed=false AND status='submitted'; NEW reopenEnrollment method UPDATE enrollments SET status='in_progress' for the exam's course — NOTE the existing autoEnroll CANNOT re-open: it requires a cardId and its ON CONFLICT DO UPDATE deliberately preserves status); notify via INSERT INTO notifications(user_id,type,title,body,...) mirroring apps/api/src/modules/director/infrastructure/cron/rasporyazhenie-escalation.cron.ts:76 — recipients = mentor (lms_card_mentors.mentor_user_id) + HR (SELECT id FROM users WHERE role='HR_MANAGER').
- **DB-proof:** lms_exam_attempts.passed(bool)+status exist and enrollments.status is free-text — no new column. Submit 2 failing attempts for one (user,exam); assert the exam's-course enrollment reset to in_progress and 2 notifications rows written (mentor_user_id + HR_MANAGER users). Threshold '2' is fixed by the vision title (not owner-undecided). Routing is NON-org-head: HR via users.role (RBAC), mentor via lms_card_mentors — no org_departments.head_user_id. lms_card_mentors is 0 rows (data gap → mentor copy inert) but HR/self routing still fires; does not block the mechanism. Correction: doc's 're-open via existing autoEnroll' is wrong (autoEnroll preserves status + needs cardId).

### #27 — Haftalik avto progress hisobot (non-AI half)
- **Files:** NEW apps/api/src/modules/lms/infrastructure/event-handlers/weekly-progress-report.handler.ts (@Cron weekly, mirrors cert-expiry.handler.ts:57); per-employee aggregate from enrollments + lms_exam_attempts (findMyProgress-shape per employee) — NOTE the doc's cited GET /progress/summary (lms-misc.controller.ts:324) is a GLOBAL single-row COUNT, NOT per-employee, so it is the WRONG source; dispatch via INSERT INTO notifications per recipient (self + mentor lms_card_mentors.mentor_user_id + HR users.role='HR_MANAGER'), same pattern as rasporyazhenie-escalation.cron.ts:76.
- **DB-proof:** Trigger the weekly cron; assert one notification per active employee routed to self, mentor, and HR (role-based) — no org head_user_id backfill. Building blocks verified live: reads (enrollments/lms_exam_attempts), notifications table, users.role RBAC, and the cert-expiry @Cron pattern. AI-laggard-analysis is the only owner/AI-gated piece and is explicitly excluded from this non-AI report half. Correction: per-employee reads (not the global summary endpoint) are the data source.

### #85 — POS Monitor tablet LMS quick-training widget
- **Files:** NEW artifacts/erp-dashboard/src/pos-monitor/pages/ page + api entry consuming GET /api/micro-modules (LmsMicroModulesController.listMicroModules, lms-misc.controller.ts:59, @Roles incl EMPLOYEE) and GET/POST /api/video-progress (LmsVideoProgressController, lms-misc.controller.ts:148/157, @Roles incl EMPLOYEE). Actual paths are /api/micro-modules and /api/video-progress (global prefix 'api' at main-bootstrap.ts:179), NOT '/api/lms/...'.
- **DB-proof:** Both controllers registered in lms.module.ts (imports 45/47, controllers array 82/84). pos-monitor authenticates via ERP SSO httpOnly access_token cookie (pos-monitor.api.ts:3, credentials:include) as a real ERP user with a role, so EMPLOYEE-gated endpoints are callable from the tablet surface (existing pos-monitor/pages/Pos*.tsx structure). Pure FE integration: POST /api/video-progress writes a video_progress row; GET /api/micro-modules returns 200. No schema/owner/blocked touch. micro_modules=1 row, video_progress=0 rows — thin data but does not block the widget.

## 18 Notifications — 4 buildable

### #17 — Bot inline keyboard PRIMARY (bot-gateway)
- **Files:** apps/api/src/modules/bot-gateway/bot-gateway.controller.ts:132-138 (webhook reply builder currently returns ONLY method/chat_id/text/parse_mode — no reply_markup) + bots/bot.helpers.ts BotReply interface (add optional replyMarkup) + at least one bot handler (e.g. bots/mes.bot.ts) to populate it. reply_markup.inline_keyboard pattern verified in-repo: modules/pos/application/services/pos-telegram.service.ts and communication-center/telegram/cc-bot/cc-bot.helpers.ts.
- **DB-proof:** POST a webhook update to /bot/:bot/webhook for a handler that returns replyMarkup; assert the JSON response includes reply_markup.inline_keyboard. No schema, no owner data. CORRECTION vs first agent: the change is not just the controller builder — BotReply type + a bot handler must also carry the keyboard for :132-138 to emit it.

### #20 — Brak recategorize (QC texnolog)
- **Files:** apps/api/src/modules/qc/presentation/qc-defects.controller.ts (already @UseGuards(RolesGuard) with @Roles + @Patch pattern, e.g. Patch('defects/:id/resolve') at :129) — add a @Patch updating qc_defects.defect_type (varchar, exists), gated @Roles(Role.TECHNOLOGIST). Role.TECHNOLOGIST EXISTS (common/constants/roles.constants.ts:13, also in the QC roles group :32-37). Delegate to a defect service/repo method (Rule 15).
- **DB-proof:** PATCH defect_type of an existing qc_defects row → SELECT defect_type WHERE id=<x> shows the new value; a non-technologist role → 403. NOTE: no live USER currently holds 'technologist' (seed-data gap, not a code blocker) — assign a test user the role to prove the 200/403 split.

### #33 — i.o. LeaveApprovedEvent → avto bildirishnoma
- **Files:** NEW listener using @OnEvent('LeaveApproved') (EventEmitter2) mirroring orphan-events.listener.ts — NOT @EventsHandler(LeaveApprovedEvent)/qc-failed-notification.listener.ts. WRONG-BUS CORRECTION: approve-leave.handler.ts:79-81 publishes via EventEmitter2.emit(ev.eventName='LeaveApproved', ev), not the CQRS eventBus, so an @EventsHandler would never fire. Event exists + fires live. Recipient = event.props.userId (direct, no org head_user_id). Register in notifications.module.ts.
- **DB-proof:** Run ApproveLeaveCommand on a pending leave → SELECT count(*) FROM notifications WHERE user_id=<employee userId> AND reference_type='leave_request' → >0. Set reference_type only; leave id may be non-integer while notifications.reference_id is INTEGER, so leave reference_id NULL/omit. RBAC routing not even required (recipient carried on the event).

### #70 — Digestga PDF biriktirish (sendDocument)
- **Files:** apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts — add sendDocument() (multipart POST to /sendDocument via the existing HttpService + withRetry, mirrors sendMessage at :41-64) AND add the method to the ITelegramSender port (domain/ports/i-telegram-sender.port.ts). modules/queue/processors/pdf-generation.processor.ts exists.
- **DB-proof:** Call sendDocument(chatId, pdfBuffer) against a stubbed HttpService; assert a POST to /sendDocument is issued and a text-only sendMessage fallback fires on HTTP failure. No schema, no owner data. NOTE: this is the transport primitive only; wiring it to an actual digest PDF is a separate broader task, but the adapter method is a self-contained provable unit with no unbuilt dependency (pdf processor + HttpService both present).

## 05 Director — 8 buildable

### #3 — Og'ish tezligi 3-kun ketma-ket tushish → EP-DIR-005 alert
- **Files:** apps/api/src/modules/remaining/company-state.service.ts (or a sibling director-decline detector); PREFER emitting via domain_events (canonical outbox, live writers) rather than system_alerts — grep 'INSERT INTO system_alerts' = 0 writers and it has NOT NULL alert_type/severity/category/title/message. company_state_log(score_total, detected_at) already fed by company-state-snapshot.cron (07:00).
- **DB-proof:** No new schema (company_state_log + domain_events both exist). Interpretation: 'og'ish tezligi 3-kun tushish' = score_total strictly declining across 3 consecutive daily snapshots (the '3' is vision-given, not an owner threshold). CAVEAT: live company_state_log is FLAT (42 rows all score_total=59.85, identical detected_at) so no natural declining run exists — prove in a rollback-tx: insert 3 synthetic descending-date/score rows, run detector, assert a domain_events row (event_name LIKE '%DIR-005%') appears.

### #18 — Telegram /holat 07:00 oxirgi saqlangan holatni qaytaradi
- **Files:** apps/api/src/modules/bot-gateway/bots/director.bot.ts — add '/holat' branch + getHolat() reading latest company_state_log(state_code, score_total, detected_at). Confirmed: bot has only /kpi,/ai,/summary; registered in bot-gateway.module.ts and dispatched in bot-gateway.controller.ts; plain-SQL (execSqlResult), RBAC via hasBotPermission — NOT AI-gated.
- **DB-proof:** DirectorBotService.handle({command:'/holat', role:'director', text:''}) returns state_code+score_total. DB proof: SELECT state_code, score_total FROM company_state_log ORDER BY detected_at DESC LIMIT 1 → EHTIYOT / 59.85.

### #48 — Faqat to'liq tugagan ishlar 'fakt'; in-progress alohida ustun
- **Files:** apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts — getPlanFact() already has total/completed/remaining; add COUNT(po.id) FILTER (WHERE po.status='in_progress')::int AS in_progress. production_orders.status exists; no new schema.
- **DB-proof:** SELECT COUNT(*) FILTER (WHERE status='completed') AS fakt, COUNT(*) FILTER (WHERE status='in_progress') AS in_progress FROM production_orders → fakt=1, in_progress=5 (distinct buckets). CAVEAT: getPlanFact groups by po.org_department_id which is NULL on ALL rows (two-world gap), so the per-department widget stays empty until PP writes org_department_id — the in_progress column itself is additive and schema-correct.

### #77 — Telegram bot /holat /kundalik /ideal_rasm
- **Files:** apps/api/src/modules/bot-gateway/bots/director.bot.ts — add /holat (company_state_log, 42 rows), /kundalik (diary_entries, 2 rows), /ideal_rasm (ideal_rasm_targets) branches. All 3 tables exist; bot is plain-SQL + RBAC (not AI-gated). Overlaps item 18 on /holat.
- **DB-proof:** Each command returns live rows. DB proofs: company_state_log=42, diary_entries=2. CAVEAT: ideal_rasm_targets is EMPTY (0 rows) — /ideal_rasm returns 'no targets' until the owner enters strategic targets (data gap, NOT a schema/build blocker).

### #87 — 'Kechikishlar soni' + 'plan-og'ish soni' alohida
- **Files:** apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts (add a two-count method) + dashboard.controller.ts (add a GET, mirroring plan-fact/order-progress wiring). production_orders has planned_end_date/actual_end_date (varchar 'YYYY-MM-DD'/NULL) + planned_quantity/confirmed_quantity (numeric).
- **DB-proof:** SELECT COUNT(*) FILTER (WHERE actual_end_date::date > planned_end_date::date) AS delay_count, COUNT(*) FILTER (WHERE confirmed_quantity <> planned_quantity) AS deviation_count FROM production_orders. Varchar dates hold valid ISO/NULL (safe ::date cast). Live: delay_count=0 (6/7 actual_end_date NULL), deviation_count>0. Two raw counts need no schema/owner input; reason-category breakdown correctly left as owner-gated.

### #106 — Operatsiya davomiylik (Dlitelnost) reja vs fakt panel
- **Files:** apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts (add method) + dashboard.controller.ts (add GET). Join mes_production_sessions(started_at,ended_at,running_time_seconds) → production_orders(planned_start_date,planned_end_date).
- **DB-proof:** SELECT s.session_number, EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) AS actual_sec, s.running_time_seconds FROM mes_production_sessions s JOIN production_orders po ON po.id = s.production_order_id. Real data present (running_time_seconds 12960–57600). CAVEAT: 'reja' source = order-level planned dates (coarse); per-operation plan would need routing — a refinement, not a schema/owner blocker.

### #113 — 'Ketgan/qolgan kun' buyurtma sikl-vaqt (reja vs fakt)
- **Files:** apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts (add method) + dashboard.controller.ts (add GET). sales_orders.order_date (date) + delivery_date (timestamptz) exist.
- **DB-proof:** SELECT id, order_date, delivery_date, (delivery_date::date - CURRENT_DATE) AS days_remaining, (CURRENT_DATE - order_date) AS days_elapsed FROM sales_orders (13 live rows). Date columns exist; no new schema; extends the already-real getOrderProgress (item 112).

### #114 — 'Priladka/setup vaqti' sozlash-yo'qotish panel
- **Files:** apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts (add setup-loss method) + dashboard.controller.ts (add GET). mes_production_sessions.setup_seconds/main_seconds/teardown_seconds ALL exist.
- **DB-proof:** SELECT session_number, setup_seconds, main_seconds, teardown_seconds, ROUND(100.0*setup_seconds/NULLIF(setup_seconds+main_seconds,0),1) AS setup_loss_pct FROM mes_production_sessions. Doc's 'needs setup-vs-run split first' is STALE — columns are WRITTEN by MES/IoT stage transitions (iot-tablet.controller.ts:708, drizzle-mes.repo.ts:91) and already consumed by drizzle-iot-oee.repo.ts. CAVEAT: all 8 live seed sessions have 0 for these (never stage-tracked), so panel shows 0 until real stage-advanced sessions run — data gap, not a build blocker.

## 11-MM/Ta'minot — 9 buildable

### ##3 — Past reytingli vendorga PO director-HITL + modal ogohlantirish
- **Files:** apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts (add vendor-rating fetch + second HITL trigger when rating<threshold; currently only fires on totalAmount>poMaxAmount at :58-60); IMmRepository.getVendorRating (mm_vendors.rating numeric exists); FE PO-create modal
- **DB-proof:** VERIFIED: PoRequiresDirectorApprovalEvent + PoRequiresDirectorApprovalListener -> hitl_approvals already wired live (handler:60, mm.module.ts:62). mm_vendors.rating (numeric) exists. Threshold const SUPPLIER_RATING_LOW_THRESHOLD=2.5 exists but lives in WMS (apps/api/src/modules/wms/domain/constants/supplier-rating.constants.ts) — define an MM-local constant to avoid cross-module import (MODUL_SHARTNOMASI). Proof: set a vendor rating<2.5, create PO -> SELECT * FROM hitl_approvals shows it queued. No new schema.

### ##10 — Muddati o'tgan ariza tasdiqlansin, '+N kun', avto rad yo'q
- **Files:** apps/api/src/modules/mm/application/mm-vendors-pr.service.ts listRequisitions() -> add overdue_days computed field (today - mm_purchase_requisitions.needed_by); GET /mm/purchase-requisitions already exists at mm-vendors-pr.controller.ts:148; FE approver badge. Cron optional.
- **DB-proof:** VERIFIED: list endpoint + needed_by (date) + created_at + status columns all exist; no auto-reject logic exists to remove. overdue_days = today-needed_by is a pure computed field, '+N kun' is display only (no owner threshold). Proof: insert requisition with needed_by in past; GET list returns overdue_days>0, status unchanged. No new column.

### ##15 — Ustuvorlik: holat > FIFO sana
- **Files:** apps/api/src/modules/wms/domain/services/batch-selection.service.ts order() comparator + IssuableBatchLot interface (add qualityStatus field); apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms.repo.ts:330 map r.quality_status; queryIssuableBatchLots SELECT must expose quality_status (column already filtered via quality_status=ANY(allowed))
- **DB-proof:** VERIFIED: batch_lots.quality_status exists; only 2 issuable statuses (approved/pending) per BATCH_ISSUABLE_QUALITY_STATUSES -> rank 'approved' before 'pending', then FIFO/FEFO date (ranking derivable from existing QC semantics, no owner policy). IssuableBatchLot currently lacks quality_status; add it (pure code, column exists). Unit-test order() ranks status before received-date. No new schema.

### ##18 — Mijoz materiali warehouse_stock owner_type ustuni
- **Files:** goods-receipt write path -> set warehouse_stock.owner_type (currently NO writer sets it; defaults to 'own'); inventory-valuation / cost-rollup query filters owner_type<>'customer'. Columns confirmed: warehouse_stock.owner_type (default 'own', NOT NULL) + owner_customer_id; material_cards.owner_type; MATERIAL_OWNER_TYPES=['own','customer'] (material-life.constants.ts)
- **DB-proof:** VERIFIED stale-doc claim is correct — all columns/enum exist (material-life.repository.ts writes material_cards.owner_type; note it does NOT yet write warehouse_stock.owner_type). Proof: INSERT warehouse_stock row owner_type='customer'; confirm excluded from valuation/cost rollup. No new schema.

### ##23 — Narx prays-list yoki oxirgi PO narxiga: 10%/25% flag
- **Files:** apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts + price-variance helper comparing new unitPrice vs latest mm_purchase_order_items.unit_price for material_id (ORDER BY created_at DESC); thresholds 10%/25% -> business.constants
- **DB-proof:** VERIFIED: mm_purchase_order_items has unit_price + created_at + material_id -> last-PO-price computable. Thresholds 10/25% are vision-given (in item title), not fabricated owner data -> add as named constants. Flag is a computed warning, no persistence. Proof: PO >25% above last price -> qizil, 10-25% -> sariq. supplier_price_tiers path (exists) is the secondary price-list source. No new schema.

### ##33 — Sverka akti on-demand + oy-oxiri cron digest, PDF
- **Files:** new MM reconciliation service/controller joining finance_invoices (vendor_id, total_amount, paid_amount, created_at) + mm_goods_receipts (purchase_order_id->mm_purchase_orders.vendor_id, total_value); PDF via existing pdfkit infra (pdf-generation.processor.ts + 15+ *-pdf.service.ts); month-end digest cron
- **DB-proof:** VERIFIED tables + PDF infra exist. IMPORTANT CORRECTION: gl_entries has NO vendor dimension (debit/credit_account_id only) -> finance_invoices is the AP ledger source; payments = finance_invoices.paid_amount, receipts = mm_goods_receipts.total_value (via PO->vendor), opening = prior-period cumulative(total_amount-paid_amount). Formula boshlang'ich+kirim-to'lov=qoldiq is vision-given. No new schema.

### #11.8 — Yetkazadigan materiallar ro'yxati + material-narx-tarix
- **Files:** PO/goods-receipt handlers writing supplier_price_tiers (supplier_id/material_id/unit_price) + material_price_history (material_id/unit_price/supplier_name/purchase_date); FE price-history graph
- **DB-proof:** VERIFIED both tables exist. material_price_history currently has a READER only (pos/material-360.service.ts:120 'Narx tarixi') and NO writer -> add writers is accurate. supplier_price_tiers read by EOQ (wms-eoq.service.ts). Proof: create PO/receipt; SELECT count(*) from both tables increases. No new schema.

### #11.13 — Tasdiqlangan arizadan PO ga avto-ko'chirish tugmasi
- **Files:** new convert-requisition-to-po command/handler + controller in modules/mm reading mm_purchase_requisitions + mm_purchase_requisition_items (material_id/quantity/unit_price), calling CreatePurchaseOrderCommand(supplierId, items[], createdBy), writing back mm_purchase_requisitions.purchase_order_id
- **DB-proof:** VERIFIED all primitives exist: requisitions + items tables, purchase_order_id column, CreatePurchaseOrderHandler (create-purchase-order.handler.ts). Proof: approve requisition, call convert -> SELECT purchase_order_id shows new PO id; PO items match requisition items. No new schema.

### #11.47 — Davr sverka akti avto (boshlang'ich+kirim+to'lov=qoldiq) PDF
- **Files:** DUPLICATE of #33 — same MM vendor-reconciliation calc: finance_invoices(vendor_id, paid_amount) + mm_goods_receipts(PO->vendor) + PDF via existing pdfkit infra
- **DB-proof:** VERIFIED same as #33 (same tables + PDF infra, no new schema). Note: 11.47 and #33 are the same requirement — build once. finance_invoices is AP source (gl_entries has no vendor dimension).

## 01-org — 1 buildable

### #82 — Saqlangan filtr/ko'rinishlar CRUD endpoint
- **Files:** NEW apps/api/src/modules/org-structure/saved-filters.{controller,service,repository}.ts, registered in the existing controllers:[] array at apps/api/src/modules/org-structure/org-structure.module.ts:61. Writes to the EXISTING live saved_filters table (id,name,description,filter_data jsonb,is_public,created_by,created_at) — VERIFIED via information_schema, columns match exactly, 0 rows, no FK on created_by (plain int), NOT-NULL cols = name/filter_data/is_public (created_at defaults now()). No schema change. CORRECTION to first agent: the FE 'saved-view dropdown on the cards list' does NOT exist yet — grep of artifacts/erp-dashboard/src finds saved_filter only in shared-schema.ts (a Drizzle mirror), not a component; scope is the BE CRUD, FE dropdown is an optional follow-up, not part of this buildable item.
- **DB-proof:** Confirmed unwired: grep saved_filter/savedFilter over apps/api/src = 0 matches (RE-VERIFIED). POST /api/org-structure/cards/saved-filters {name:'vakant-red',filter_data:{status:'vacant'},is_public:false} with created_by from req.user.id; then node _audit/q.cjs "SELECT count(*) FROM saved_filters WHERE name='vakant-red'" returns 1 with created_by=caller; GET returns the row. Works on existing schema, no owner threshold/policy value, no blocked area (generic UI-prefs table — no head_user_id/razryad/salary/AI/bilingual), no unbuilt dependency.

## 02 HR — 2 buildable

### #25 — Expired-qualification hard-rejects shift scheduling
- **Files:** apps/api/src/modules/hr/shift/shift.service.ts (add expired-qualification guard inside assignShift() BEFORE repo.assignShift) + shift.repository.ts (new method e.g. hasExpiredQualification(employeeId) querying employee_skills WHERE employee_id=X AND status='active' AND expiry_date <> '' AND expiry_date::date < CURRENT_DATE). Route = POST /hr-v2/shifts (shift.controller.ts:73, @Roles admin/manager/supervisor/hr_manager). LIVE-CONFIRMED schema: employee_skills.expiry_date(varchar)/status(varchar)/required_level(int); shift_schedules base table exists. Vision #25 (docs/vision/_parts/02-hr.md line 30) = qattiq blok, override yo'q — no owner threshold. Not razryad/salary/org-structural.
- **DB-proof:** Seed employee_skills(employee_id=X, status='active', expiry_date=yesterday). POST /hr-v2/shifts {employee_id:X, shift_date:today} -> expect Result err (hard reject, no override). Verify: SELECT count(*) FROM shift_schedules WHERE employee_id=X AND shift_date=CURRENT_DATE => 0. NB assignShift uses onConflictDoUpdate on (employee_id,shift_date) so ensure X has no pre-existing shift row for that date. Then set expiry_date=future -> repeat -> row inserted. NB expiry_date is VARCHAR -> must compare via expiry_date::date.

### #46 — HR 'attention-needed employee' weekly digest cron
- **Files:** New apps/api/src/cron/hr-attention-digest.cron.ts + a repository query. Reads existing employee_daily_kpi (overall_score, evaluation_date[varchar], 70 rows), hr_daily_reports.is_late, hr_leave_requests (all LIVE-CONFIRMED). HR delivery is role-based: reuse absence-block.repository.ts findHrManagersWithTelegram() (RBAC path CONFIRMED at absence-block.cron.ts:39-42). Criteria are vision-specified (02-hr.md #46: 7-day >=10% overall_score drop, 3+ late reports, leave<3d, empty->'muammo yo'q') so no owner input. No new table/column; not blocked.
- **DB-proof:** Run the cron. Selection query: employees with >=10% overall_score drop over 7 days (employee_daily_kpi, evaluation_date::date >= now()-interval '7 days') UNION is_late count>=3 (hr_daily_reports) UNION leave duration<3d (hr_leave_requests, end_date-start_date<3). Assert a digest message is emitted to HR recipients from findHrManagersWithTelegram(); when the set is empty assert the explicit 'muammo yo'q' message. NB employee_daily_kpi has both user_id and employee_id; evaluation_date is varchar (cast needed).

## 03 Finance/Moliya — 1 buildable

### #C12 — FP-tsikl cron kunlarini egasi ekrandan o'zgartiradi (DB-driven schedule)
- **Files:** apps/api/src/modules/finance/application/fp-cycle-cron.service.ts (replace the 4 hardcoded @Cron('0 9 * * N') days with a cfo_config-driven schedule — EITHER SchedulerRegistry dynamic CronJob registration [ScheduleModule.forRoot() is already registered at app.module.ts:85, @nestjs/schedule 6.1.3], OR the simpler zero-infra path: keep a daily @Cron('0 9 * * *') per notification and gate the body on today's DOW == the configured value); apps/api/src/modules/finance/infrastructure/repositories/fp-cycle-cron.repository.ts (add getScheduleConfig() reading the 4 numeric fp_cycle_*_dow keys from cfo_config). NO new FE screen needed — artifacts/erp-dashboard/src/pages/CfoConfigSettings.tsx ALREADY EXISTS and is a generic cfo_config key-value editor (GET list + PUT /:key), so new keys auto-render; only optionally add KEY_LABELS entries. Write endpoint ALREADY EXISTS: apps/api/src/modules/finance/presentation/finance-cfo-config.controller.ts (POST + PUT /api/finance/cfo-config → CfoConfigService.update → repo.upsertCfoConfig).
- **DB-proof:** No DDL. cfo_config(config_key varchar, config_value NUMERIC, description, updated_at) confirmed live with 15 keys via node _audit/q.cjs. config_value is NUMERIC (not text — first agent's '4' string example is off, but numeric DOW 1-7 stores cleanly). Seed 4 keys with the CURRENT hardcoded defaults using the existing POST /api/finance/cfo-config (or INSERT ... ON CONFLICT DO NOTHING): fp_cycle_cash_dow=1 (Mon), fp_cycle_zvs_dow=2 (Tue), fp_cycle_fp_dow=3 (Wed), fp_cycle_bank_dow=4 (Thu) — these mirror the existing @Cron('0 9 * * 1|2|3|4'). Proof: node _audit/q.cjs "SELECT config_key,config_value FROM cfo_config WHERE config_key LIKE 'fp_cycle%'" returns the 4 rows; PUT /api/finance/cfo-config/fp_cycle_zvs_dow {value:4} then re-query shows 4; assert the service reads the new day (SchedulerRegistry re-register on config write, or the daily-cron DOW gate now matches Thu). Recipient routing stays role-based (getEmployeeIdsByRoles → employees.role) = RBAC, NOT org head_user_id, so NOT blocked. No owner data (defaults = current hardcoded days), no new table/column/enum (INSERT only), no blocked area (not org/razryad/salary/SoD/AI/bilingual), no unbuilt dependency (cron service registered in finance.module.ts:211; CfoConfigService + FE editor already live).

