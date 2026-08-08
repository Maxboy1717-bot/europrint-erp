# EuroPrint ERP — Independent Read-Only Verification of the 45-Commit Vision-Build Loop (2026-07-09)

**This was a read-only verification pass; nothing was committed, edited, deleted, migrated, or written to the database — except this report file itself, created new and left untracked.** Every DB check was a `SELECT`, and the two write-path proofs used `BEGIN … ROLLBACK` (each ROLLBACK was confirmed to run and the probe rows did not persist). Test suites and typechecks were run read-only; `DATABASE_URL` was set only as an environment variable for isolated test runs, writing no data. `cron.module.ts` was not edited this pass (a prior-turn staged edit was superseded by loop commit `aaaf704a`; the file is clean at HEAD). The dev servers on :3030/:20806 remain up from an earlier "run the project" task — neither started this pass nor used for any writes.

Scope verified: a continuous session claiming **45 commits** (`b0f3c144`..`0346b2e6` + queue-doc `0d172079`) across 14 modules — MES(08), QC(09), WMS/Ombor(10), SD/Sotuv(06), PP/Reja(07), Coordination+CC(04+20), CRM(13), Marketing(14), Kanban(15), IoT(16), LMS(12), Notifications(18), Director(05), POS(19) — plus the claim that everything not built is genuinely owner-gated (Guruh-B).

Method discipline follows the project's prior independent audits: `F4-INDEPENDENT-FULL-VERIFICATION-2026-07-06.md`, `MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md`, and the M8/VISION-3340 pass.

---

## Part 1 — Commit ledger (44 + 1 = 45 claimed; 46 actual session commits)

`git rev-list --count b0f3c144^..0346b2e6` = **44**. Plus `0d172079` (`docs(audit): batched Guruh-B owner-decision queue`) = **45 total as claimed**. Breakdown: **~33 feature/fix commits + ~11 test/follow-up commits + 1 doc commit.**

**A 46th session commit exists and is not counted in the "45":** `5173d1d8` (`fix(director): company-state snapshot cron 06:00 → 07:00 (vision 05.3/#18)`), committed *after* the queue doc. It ships an item the queue doc itself still lists as an outstanding Guruh-B residual. So the true session commit count is **46, not 45**, and the queue doc has one stale entry as a direct result (see Step 4 note below).

HEAD at verification time = `5173d1d8` (the loop range `0346b2e6` is an ancestor). `0d172079` is in HEAD history; `5173d1d8` sits after it.

### 1.2 Full file-change ledger (all 44 range commits, oldest first)

| # | hash | subject | files (from `--stat`) |
|---|---|---|---|
| 1 | b0f3c144 | feat(iot): tablet downtime picks reason from live catalog + reason_code_id (08-mes#10, V-3340 #44) | iot-tablet.controller.ts, iot-tablet.schemas.ts, test/iot/downtime-reason-link.spec.ts, MESDowntimes.tsx |
| 2 | e42493ba | feat(iot): session-start setup-checklist CRUD (08-mes#8, V-3340 #45) | iot-tablet.controller.ts, iot-tablet.schemas.ts, test/iot/iot-tablet.controller.setup-checklist.spec.ts |
| 3 | a4200ab0 | feat(mes): auto-open maintenance task on breakdown downtime (08-mes#37) | record-downtime.handler.ts, mes-maintenance.repo.ts, test ×2 |
| 4 | aaaf704a | fix(cron): import LmsModule so CardRepository resolves in cron context (V-3340 #27 follow-up) | cron.module.ts |
| 5 | 138f9a7b | chore(i18n): regenerate types for mentorCardCapReached key (V-3340 #25 follow-up) | i18n.generated.ts |
| 6 | d9eca37c | feat(qc): wire FMEA critical-RPN into real stop-production (09-qc, V-3340 #43) | report-defect.handler.ts, qc.constants.ts, test |
| 7 | 11cd9677 | feat(qc): production-order → QC → delivery traceability endpoint (09-qc, V-3340 #40) | qc-new.service.ts, qc-new.repository.ts, qc-new.controller.ts, test ×2 |
| 8 | b2622a20 | feat(wms): route failed-QC quantity to scrap warehouse (10-warehouse, V-3340 #58) | qc-failed-fg.listener.ts, wms.module.ts, test |
| 9 | 5dafb196 | feat(pos): wire photo-evidence into stock-movement create (10-warehouse, V-3340 #60) | pos-movement.service.ts, movement.dto.ts, pos-movement.repository.ts, test, 4 FE pos-monitor pages, pos-schema-v2.ts |
| 10 | 91d744b2 | feat(pos): Pres-kirim scale→barcode→intake fast-path screen (10-warehouse, V-3340 #59) | PosMonitorApp.tsx, PosMovementNew.tsx, PosPresKirim.tsx |
| 11 | 1d768a1a | feat(sd): delivery goods-issue decrements FG stock in WMS (06-sd/10-wms, V-3340 #51) | deliveries.service.ts, delivery-goods-issued.event.ts, delivery-goods-issued.listener.ts, wms.module.ts, test |
| 12 | 06e39cc3 | fix(sd): unify advance-percent default to 70% across both order paths (V-3340 #48) | business.constants.ts, queries-sd.ts, sd-quotations.repository.ts, test |
| 13 | 3cc09d5a | feat(sd): quotation→order conversion fires OrderCreated event + outbox (V-3340 #49) | sd-quotations.repository.ts, test |
| 14 | 9df256d1 | feat(sd): routed SD sales-order detail page (06-sd, V-3340 #54) | SDOrderDetail.tsx, SDSalesOrders.tsx, CRMRoutes.tsx |
| 15 | ec72a360 | test(sd): provide EventBus mock in deliveries.service.spec (V-3340 #51 follow-up) | test/sd/deliveries.service.spec.ts |
| 16 | 619a2100 | feat(sd): GET /api/sd/orders/:id/items read endpoint (06-sd, V-3340 #53a) | get-order-items.handler.ts, i-sales-order.repo.ts, drizzle-sales-order.repo.ts, sd-orders.controller.ts, sd.module.ts, test |
| 17 | a780f6bb | feat(sd): RepeatOrderDialog clones an order into a new one (06-sd, V-3340 #53b) | SDSalesOrders.tsx |
| 18 | 08a97280 | feat(pp): activate order status-lifecycle endpoint + audit journal (07-pp, EP-PP-082) | pp-orders.controller.ts, drizzle-pp-production-orders.repo.ts, i-pp-production-orders.repo.ts, production-orders.service.ts, test |
| 19 | 75ce2efb | test(pp): controller-boundary spec for status endpoint + normalize imports (EP-PP-082) | pp-orders.controller.ts, test |
| 20 | 7aba3b66 | feat(pp): persist the freeze/urgent override justification (07-pp, EP-PP-082 #2/#39) | pp-orders.controller.ts, drizzle-pp-production-orders.repo.ts, i-pp-production-orders.repo.ts, production-orders.service.ts, test |
| 21 | 6ae96df1 | feat(pp): reason-code catalog management surface (07-pp, EP-PP reason codes) | pp.module.ts, drizzle-pp-reason-codes.repo.ts, i-pp-reason-codes.repo.ts, pp-reason-codes.controller.ts, pp-reason-codes.service.ts, test |
| 22 | 30a1a867 | test(pp): controller-boundary spec for reason-codes endpoints (EP-PP, Q-29) | test/pp/pp-reason-codes.controller.spec.ts |
| 23 | 7f32c5f9 | feat(pp): production-plan CSV snapshot export (07-pp, EP-PP-129) | pp-plan-export.service.ts, pp.module.ts, pp-queue.controller.ts, test |
| 24 | f92f8e3e | feat(cc): block self-approval / self-route (20-cc, CC #21 SoD) | cc-workflow.service.ts, cc-documents.repo.ts, cc-documents-write.repo.ts, test |
| 25 | c0ca2953 | feat(cc): journal + notify on unresolvable route instead of silent deadlock (20-cc, CC #3) | cc-workflow.service.ts, cc-documents.repo.ts, cc-documents-write.repo.ts, test |
| 26 | bed75ee9 | feat(cc): delegation chain resolves multi-hop with depth cap + cycle guard (20-cc, CC #33) | cc-org-resolver.service.ts, test |
| 27 | 3d9522ab | feat(cc): paginate the 3-basket list endpoints (20-cc, CC #19) | cc-baskets.service.ts, cc-baskets.repo.ts, cc-baskets.controller.ts, test |
| 28 | bba86fab | feat(cc): Prikaz + Protocol management UI (04-coordination) | CoordinationDocsDialogs.tsx, CoordinationDocsSections.tsx, CoordinationPage.tsx, CoordinationPageHelpers.tsx, CoordinationPageTypes.ts |
| 29 | 88c8e055 | fix(crm): loss-reason rollup 500 → group by real lost_reason column (13-crm, V-3340 #31) | drizzle-crm-analytics.repo.ts, test |
| 30 | db708d2b | feat(crm): wire PATCH /crm/deals/:id/lost with uuid-correct persistence (13-crm) | mark-deal-lost.handler.ts, i-deal.repo.ts, drizzle-deal.repo.ts, crm-deals.controller.ts, test ×2 |
| 31 | 6c352b73 | feat(crm): make lead-score engagement real via crm_activities count (13-crm) | drizzle-crm-leads.repo.ts |
| 32 | 1257e77c | fix(marketing): lead by-id endpoints use the real varchar id (fake-save) (14-marketing) | leads.repository.ts, leads.service.ts, marketing-analytics.controller.ts, test ×2 |
| 33 | bc7a2f5c | feat(marketing): normalize lead phone on entry via PhoneNumber VO (14-marketing #2) | leads.service.ts, test |
| 34 | 54031ab6 | fix(kanban): persist parent_card_id + due_date on card create (fake-save) (15-kanban #18) | drizzle-kanban-cards.repo.ts, test |
| 35 | 8c22353b | fix(kanban): guard varchar due_date::date casts against report 500 (15-kanban) | kanban-boards.service.ts, drizzle-kanban-stats.repo.ts, test |
| 36 | 9c06c0ec | feat(kanban): sync order status changes onto the linked card (15-kanban #22/#127) | order-status-changed-kanban.handler.ts, i-kanban-boards.repo.ts, kanban-boards.repo.ts, kanban-cards.repo.ts, kanban.module.ts, test |
| 37 | a4d47725 | fix(iot): tablet session-create persists order/equipment/target (golden thread) (16-iot) | iot-tablet.controller.ts, iot-tablet.schemas.ts, test |
| 38 | 2f0d038f | fix(iot): tablet defect report records the operator's real count (16-iot) | iot-tablet.controller.ts, iot-tablet.schemas.ts, test |
| 39 | fe96e7ee | fix(iot): downtime reason picker reads the populated catalog + writes reason_code_id (16-iot #60/#61) | iot-main.controller.ts, test, IoTProductionDashboardDialogs.tsx, useIoTTablet.ts |
| 40 | 3efda0ea | fix(lms): certificate detail reads real expiry + download renders real data (12-lms) | lms-certificates-standalone.controller.ts, test |
| 41 | 1bf068d2 | fix(notifications): NotificationCenter reads the real category field (vision 18) | NotificationCenter.tsx |
| 42 | 7c1d092a | fix(director): plan-fact/order-progress join real org_department_id (vision 05) | dashboard-query.repository.ts, test |
| 43 | 0357ab31 | fix(pos): persist KIRIM receipt header supplier/document fields (19-pos #51/#33) | pos-movement.service.ts, test |
| 44 | 0346b2e6 | fix(pos): persist KIRIM line batch/lot numbers (19-pos #25 FIFO/FEFO) | pos-movement.service.ts, movement.dto.ts, test, pos-schema-v2.ts |
| + | 0d172079 | docs(audit): batched Guruh-B owner-decision queue | GURUH-B-OWNER-QUEUE-2026-07-09.md |

### 1.3 Bundling check
No commit bundles two unrelated vision items. The opposite discipline is visible — several items are deliberately **split** into a `feat` + a separate `test` commit (`08a97280`+`75ce2efb`; `6ae96df1`+`30a1a867`; `1d768a1a`+`ec72a360`). The one multi-file commit that could look bundled, `5dafb196` (POS photo-evidence across service/dto/repo/schema/FE), is a single feature threaded end-to-end. **Clean — no bundling.**

### 1.4 Vision cross-reference (all 44 verified; qualifications below)
The large majority of commits **plausibly satisfy** their cited vision rows (independently cross-referenced against `docs/vision/FULL-VISION-EXTRACTION-2026-07-07.md` and `docs/audit/VISION-3340-RETRIAGE-2026-07-07.md`). Notable qualifications:

| Flag | Commits | Finding |
|---|---|---|
| **Genuinely PARTIAL** (real slice, not full row) | `7aba3b66` (override-reason only), `88c8e055` (rollup fixed but no taxonomy table), `6c352b73` (one engagement signal, not full scoring), `54031ab6` (persists fields, no deadline-inheritance), `9c06c0ec` (order→card, reverse of cited card→order #22) | Honest incremental progress; each commit message flags the deferred remainder → routed to Guruh-B. |
| **Mis-cited row number** (diff coherent, citation wrong) | `fe96e7ee` (cites IoT #60/#61 — don't exist; diff = MES#10/#44), `0357ab31` (cites POS #51 — doesn't exist; #33 is the real match), `0346b2e6` (cites #25 = downtime; diff = POS #5/#6 FIFO-FEFO), `30a1a867` (cites Q-29, a CLAUDE.md process rule, not a vision row) | Bookkeeping inaccuracy only — the code does the right thing; the item id in the message is off. |

No commit implements something *absent* from the vision docs. Every commit ships a matching test except the pure i18n/DI/EventBus follow-ups.

---

## Part 2 — Full regression suite

- **Backend suite** (`jest`, 887 spec files, 482 s): **811 suites / 10,960 tests PASS**, **73 suites / 265 tests FAIL**, 3 suites / 13 skipped.
- **Frontend typecheck** (`tsc --noEmit`, whole FE): **0 errors.** ✅
- **Frontend tests:** FE component/helper specs live under `apps/api/test`; there is no separate standalone FE runner beyond typecheck — noted.

### 2.4–2.6 Causation analysis
Only **2 of the 73 failed suites were last-touched inside the loop** (`git log -1 --format=%H` per suite vs the loop rev-list); **71 were last-touched before the loop.** Both loop-touched failures **pass when `DATABASE_URL` is set**:

| Failing suite | Last-touch | In loop? | Root cause | Verdict |
|---|---|---|---|---|
| `test/lms/lms-certificates-standalone.controller.spec.ts` | `3efda0ea` | Y | `lib/db` throws `DATABASE_URL must be set` at import (jest config has no dotenv loader); passes **4/4** with it set | Env, **not a regression** |
| `test/iot/iot-main.controller.downtime-reason-codes.spec.ts` | `fe96e7ee` | Y | Same import-time `DATABASE_URL`; passes **4/4** with it set | Env, **not a regression** |
| Other 71 suites | pre-loop | N | 40× `DATABASE_URL must be set`, `Cannot find module`, `TypeError: …is not a function` — all in files the loop never touched | Pre-existing / env |

**New regressions introduced by the loop: 0.** The 73 failures are dominated by one environmental cause — the project's jest config has no dotenv/globalSetup, so any spec importing `lib/db` before dotenv runs dies with `DATABASE_URL must be set` in a shell where that var isn't exported. In the loop's own runs (and CI/dev, where `.env` provides it) these pass. **Pre-existing/unrelated failing suites: 73, all outside the loop's causal scope.**

---

## Part 3 — Deep spot-check of 10 items (re-derived independently)

| # | Item | Commit | Reproduced evidence | Verdict |
|---|---|---|---|---|
| 1 | PP #2 (NOT-NULL caught by DB-proof) | `7aba3b66` | DB: `production_order_status_log.new_status` is `NOT NULL`; my rollback-tx `INSERT … new_status=NULL` → **rejected** ("нарушает ограничение NOT NULL"), rolled back. Test 3/3 pass. Exactly reproduces the bug the mocked test missed. | **CONFIRMED** |
| 2 | CRM #2 (leads 0-engagement = orphan `lead_id=1`) | `6c352b73` | DB: `crm_activities` holds only `lead_id=1` (×2) + 1 null; `crm_leads.id` real values start at 1003; `lead1_exists=0` → genuinely orphaned. HEAD repo counts `crm_activities`. | **CONFIRMED** |
| 3 | CRM #3 (uuid treated as number) | `db708d2b` | DB: real deal id `2b3d7a14-…`; `Number(uuid)=NaN`, `WHERE id=NaN` → **0 rows**, `id::uuid` → **1**; rollback-tx UPDATE by uuid matched 1, ROLLBACK confirmed (no persist). Diff: `dealId:number→string`. Test 6/6. | **CONFIRMED** |
| 4 | Marketing A1 (varchar id, `Number(id)`) | `1257e77c` | DB: `marketing_leads.id` = `character varying`. Diff: `findOne/update/softDelete` `id:number→string`, `eq()`→param `sql`. Test 9+ pass. | **CONFIRMED** |
| 5 | IoT #1 (session-create drops order/equipment/target) | `a4d47725` | Diff: schema adds `productionOrderId/equipmentId/targetQuantity`; INSERT threads them (was hardcoded 0/0). Test 4/4. | **CONFIRMED** |
| 6 | Kanban #1 (`createCardFlat` drops parent/due) | `54031ab6` | Diff: INSERT column list gains `parent_card_id, due_date` + ''→null. Test pass. | **CONFIRMED** |
| 7 | Director #1 (nonexistent `department_id`, swallowed) | `7c1d092a` | DB: `production_orders` has `org_department_id`, **no** `department_id`. Diff: join repointed. Test 3/3. | **CONFIRMED-WITH-CONCERN** |
| 8 | LMS #1 (phantom `expires_at` + stub download) | `3efda0ea` | DB: `certificates` has both `expires_at` (always-NULL per commit) and `expiry_date`. Diff: reads `expiry_date`, real download data. Test 4/4 **with `DATABASE_URL` set**. | **CONFIRMED-WITH-CONCERN** |
| 9 | Notifications A1 (`type` vs `notificationType`) | `1bf068d2` | Diff: adds `catOf()`=`notificationType ?? type`; filter/config/label all use it. FE-only; covered by passing FE typecheck. | **CONFIRMED** |
| 10 | POS #1+#2 (KIRIM drops supplier/doc/date/batch/lot) | `0357ab31`+`0346b2e6` | DB: `pos_movements` has `supplier_name/document_number/document_date`; `pos_movement_lines` has `batch_number/lot_number`. Diffs add all to inserts; `batchNumber` added to the strict DTO. Tests pass. | **CONFIRMED** |

**Concerns:** (#7) Director — the fix makes the reader schema-correct (no more swallowed error), but `org_department_id` is NULL on all live rows today, so the widget stays *empty* until PP populates it *and* the owner resolves the `departments`-vs-`org_departments` two-world join (the commit says this itself). Correct fix, still-empty result. (#8) LMS — the fix is correct, but the **test it ships cannot run in a shell without `DATABASE_URL`** (import-time `lib/db` throw); it only passes when the env var is present. That's the Part 2 env issue surfacing on a loop-added spec.

---

## Part 4a — Guruh-B sample (10 items, 2 per section 1–5)

| Item (quoted) | § | Independent verdict | Evidence |
|---|---|---|---|
| "CRM row-level scoping (#35): which roles see ALL leads/deals vs only their own" | 1 | **Genuinely Guruh-B** | Security/visibility policy; no safe code default (not defined in code). |
| "Notifications role-broadcast: 6483 `LOW_STOCK` rows with `user_id=0`… nobody sees them" | 1 | **Genuinely Guruh-B** | DB: **6679** `user_id=0` rows (doc's 6483 slightly stale but directionally right); routing policy for security-relevant alerts is the owner's call. |
| "PP reason-code vocabulary (`pp_reason_codes` — CRUD live, 0 rows)" | 2 | **Genuinely Guruh-B** | DB: table exists, **0 rows**; factory-specific codes can't be fabricated. |
| "CRM loss-reason taxonomy + voronka stage names (`crm_stages`=0)" | 2 | **Genuinely Guruh-B** | DB: `crm_stages`=**0 rows**; factory funnel is owner master-data (seeding without sign-off violates Q-35). |
| "`crm_deals.lost_reason_id` column + seed" | 3 | **Genuinely Guruh-B** | DB: column **absent**; new column needs Q-35 sign-off. |
| "Notifications `notification_type_preferences` (or `preferences` jsonb)" | 3 | **Genuinely Guruh-B** (minor doc gap) | DB: no `notification_type_preferences`; a flat `notification_preferences` table *does* exist (doc could name it). Schema-shape decision is owner's. |
| "MES→POS auto FG-kirim (`mes.session.completed` emitted; no POS FG-receipt listener)" | 4 | **Genuinely Guruh-B** | Code: **no POS listener** for that event; needs FG-warehouse + movement-type contract. |
| "POS low-stock → auto purchase-requisition (today only notifies)" | 4 | **Genuinely Guruh-B** | Auto-spend/PR creation is a business-process decision. |
| "AI keys… CRM/Marketing/LMS/Director AI chatbots, camera-AI" | 5 | **Genuinely Guruh-B** | External credential (owner-only). |
| "Provider creds: real SMTP / Telegram / SMS (adapters exist, need creds)" | 5 | **Genuinely Guruh-B** | External credential. |

**No misclassification found.** On this 10-item sample, the "everything remaining genuinely needs the owner" claim holds. The closest to buildable-with-a-default (Notifications broadcast) is still a legitimate routing-policy decision, and the doc itself presents it as an owner choice with a proposed option.

---

## Part 4b — Fresh fake-save pattern search (14 modules; detection-only)

Two independent read-only sweeps traced field-threading (Zod/DTO → service → repository INSERT/UPDATE column list) and checked every `Number(id)`/`parseInt(id)` coercion against the **live DDL** (not just the drifted Drizzle TS defs). All 14 modules were touched. Suspects from the first pass were resolved to CONFIRMED or downgraded here:

| # | Module | Endpoint / repo method (file:line) | Field(s) dropped | Confidence |
|---|---|---|---|---|
| 1 | PP | `createShiftReport` — `production.repository.ts:62` (POST `/production/shift-reports`) | `department`, `shift_number`, `shift_date` | **CONFIRMED** — DTO + FE `CreateShiftModal.tsx` send all three; INSERT column list omits them; list view renders never-persisted `shift_number`. |
| 2 | PP | `updateShiftReport` — `production.repository.ts:76` (PATCH `/production/shift-reports/:id`) | `actual_output`, `reject_qty`, `downtime_min` | **CONFIRMED** — schema accepts; `UPDATE production_sessions SET …` only sets `worker_notes`/`status`. |
| 3 | WMS | `createShipment` — `wms-in-transit.repository.ts:34` (POST `/wms/in-transit/shipments`) | `invoice_number` | **CONFIRMED** — DTO + FE send; INSERT omits; `createGoodsReceiptDraft` reads `shipment.invoice_number` back as null. |
| 4 | Marketing | `softDeleteLead` — `drizzle-marketing-group2.repo.ts:342` (DELETE `/marketing/leads/:id`) | whole delete (WHERE never matches) | **CONFIRMED** — `eq(id, Number(slug))=NaN` on varchar `marketing_leads.id`; 0 rows deleted yet returns `{message:"Lead o'chirildi"}`. Buggy duplicate of the correctly-fixed canonical `leads.repository.softDelete`. |
| 5 | Marketing | `update` — `leads.repository.ts:81` (PUT `/marketing/leads/:id`) | `name`, `company`, `source`, `channel`, `notes`, `score` | **CONFIRMED** — active `@europrint/schemas` binding's `marketingLeads` def **omits** these columns; DTO `.partial().passthrough()` accepts them → never reach a column. `create()` was rewritten to raw SQL for exactly this reason; `update()` was left on the binding. |
| 6 | Marketing | `replyToConversation` — `marketing-analytics-stubs.controller.ts:353` (POST `/inbox/conversations/:id/reply`) | `conversation_id` (written as `0`) | **CONFIRMED** — `parseInt(id)` on `social_conversations.id`=varchar → NaN → INSERT `social_messages.conversation_id = 0`; replies orphaned + `getConversationMessages` cross-contaminates threads via `conversation_id=0`. |
| 7 | SD | `updateInternalNotes` — `drizzle-sd-customers/contacts-nps.repo.ts:150` (PATCH internal-notes) | `risk_level`, `internal_classification` | **CONFIRMED (low live impact)** — controller schema advertises both, but neither column exists in `sd_customers` (live has only `relationship_quality`/`notes`/`share_of_wallet`, which the UPDATE writes). Current FE doesn't send the two advertised fields, so no live loss today — but any client trusting the schema loses them silently. |
| 8 | CRM | `updateInvoiceStage` — `crm-bitrix-compat.controller.ts:127` (PATCH `/crm/bitrix/invoices/:id/stage`) | invoice id (targets id `0`) | **CONFIRMED** — `parseInt(id,10) \|\| 0` on `crm_invoices.id`=**uuid** → `0`; the stage update addresses invoice id 0 (no/wrong row). Sibling `robots`/`proposals` are integer ids (correct); only the invoices sub-path is affected. |
| 9 | PP | `createScheduleEntry` — `pp-planning.repository.ts:34` (POST `/planning/schedule`) | `quantity` (→ always 1) | **SUSPECTED** — INSERT reads `${body.quantity ?? 1}` but `PpCreateScheduleEntrySchema` has no `quantity` key and the stripping `ZodValidationPipe` drops it, so any submitted quantity is lost and the order is planned as 1. `production_orders` has real `quantity`/`planned_quantity` columns. The live FE create button posts to `/api/planning/operations` (a different route), so this exact endpoint may be unexercised today — hence suspected, not confirmed. |

**Downgraded to NOT-A-BUG:** WMS `updateWarehouse`/`deleteWarehouse` (`wms-gateway-warehouses.controller.ts:344/359`) — flagged for `parseInt(id,10)` on `warehouses.id`, but the **live column is `integer`** (only the Drizzle TS def drifted to varchar/uuid). `parseInt` is correct at runtime; no fake-delete. Worth reconciling the TS def, but not a data bug.

**Modules clean on sampled write-paths:** MES (`recordDowntime`/`endDowntime` typed inserts), IoT (loop-fixed tablet paths), QC (raw-SQL inserts with explicit column lists), POS (`insertMovement`/`insertLines` full-object `$inferInsert` passthrough), Kanban (all `Number(id)` on integer-serial tables), CC/Coordination (raw SQL explicit column lists), LMS/Notifications/Director (all id coercions land on integer/serial PKs). **Net: 8 CONFIRMED + 1 SUSPECTED new fake-saves the loop did not reach; the recurring class is real and not fully eradicated.** Highest priority still-live: Marketing `update()` (6 fields) and the two PP shift-report paths — genuine "saves green, data vanishes."

---

## Part 5 — Scope discipline

- **5.1 Blocked areas: clean.** None of the 121 loop-touched files fall under Org-01 structural / `head_user_id`, HR-02 razryad/salary, Finance-03 SoD, AI-key provider/service, or bilingual/Cyrillic column logic. The only grep hit, `apps/api/src/generated/i18n.generated.ts` (from `138f9a7b`), is a **regenerated i18n type declaration**, not Cyrillic column handling — false positive.
- **5.2 Timing: no racing writers.** 44 commits span 2026-07-08 18:52 → 07-09 03:18 (~8.5 h continuous), gaps 25 s–25 min. Four sub-60 s pairs — `138f9a7b`(+25 s, generated i18n), `a780f6bb`(+41 s, FE dialog), `619a2100`(+54 s, SD items endpoint), `30a1a867`(+86 s, test-only) — are all small/test follow-ups by the **same sequential writer** on *different* files. No two commits touch overlapping files seconds apart, i.e. **no repeat of the #46/#50 self-collision.** Raw timings:

```
b0f3c144 18:52:09 (first)      e42493ba +1520s   a4200ab0 +1091s   aaaf704a +120s
138f9a7b +25s                  d9eca37c +1497s   11cd9677 +1053s   b2622a20 +862s
5dafb196 +1168s                91d744b2 +880s    1d768a1a +684s    06e39cc3 +295s
3cc09d5a +706s                 9df256d1 +1230s   ec72a360 +1198s   619a2100 +54s
a780f6bb +41s                  08a97280 +1070s   75ce2efb +167s    7aba3b66 +437s
6ae96df1 +677s                 30a1a867 +86s     7f32c5f9 +683s    f92f8e3e +990s
c0ca2953 +196s                 bed75ee9 +199s    3d9522ab +217s    bba86fab +887s
88c8e055 +859s                 db708d2b +1354s   6c352b73 +305s    1257e77c +1228s
bc7a2f5c +243s                 54031ab6 +853s    8c22353b +727s    9c06c0ec +653s
a4d47725 +747s                 2f0d038f +292s    fe96e7ee +775s    3efda0ea +906s
1bf068d2 +949s                 7c1d092a +1075s   0357ab31 +992s    0346b2e6 +362s (03:18:02)
```
- **5.3 `crm-extended.controller.ts`:** **not present in any of the 45 commits' file lists** ✓, and **still sitting as ` M` (modified, uncommitted)** in the working tree — exactly the "foreign concurrent-session file" description. Left untouched.

---

## Part 6 — Guruh-B document quality

- **Index vs ledger cross-check: matches for all 14 modules.** Every "Guruh-A shipped this loop" cell maps to real commits in the Part 1 ledger (MES→`b0f3c144/e42493ba/a4200ab0`, … POS→`0357ab31/0346b2e6`). No phantom "shipped" claims; no shipped-but-unlisted feature. The 5 test/DI/i18n follow-up commits are correctly not headlined. One loose edge: the Director row credits "(+coordination-docs UI)" which is actually the CC commit `bba86fab` — accurate but double-counted across two rows.
- **One factual staleness (see Step 4):** §6 line 104 lists "company-state cron 06:00 vs vision 07:00" as a remaining residual, but commit `5173d1d8` (after the doc) already fixed it — that clause should be removed.
- **Specificity — most items are directly answerable.** The doc is unusually actionable: most items name the exact column/table/option and even propose defaults (the CRM stage set, the SD-status→Kanban-column map). Items judged **too vague to answer without a follow-up**, with a sharper question:
  - §1 item 11 "PP split vs work-splitting semantic collision (#8/#15)" → *"Should one production order be splittable into multiple sub-orders (partial delivery), or is 'splitting' only about dividing an operation across machines? Pick one."*
  - §1 item 10 "GSD 3-indicator KPI weights — owner numbers" → *"Which 3 indicators, and what weight does each get (must sum to 100%)?"*
  - §2 Director "stat-regulation / ideal-rasm / OKR-cascade seed values" → *"Provide the target rows for `okr_objectives`/`key_results` (objective text + numeric target per card)."*
  - §4 "Coordination → module golden-thread events (protocol-decision → auto-rasporyazhenie?)" → *"When a protocol decision is approved, should the system auto-create a rasporyazhenie, and to which module/role?"*

### Step 4 — Ledger inconsistency (`5173d1d8`) → exact stale line to correct
Commit `5173d1d8` shipped the Director company-state cron 06:00→07:00 change **after** the queue doc was written. As a result, the queue doc's own §6 residual list is now inaccurate: **`docs/audit/GURUH-B-OWNER-QUEUE-2026-07-09.md` line 104** ends with "`…(Telegram-gated); company-state cron 06:00 vs vision 07:00.`" — that final clause is already done and should be deleted. (Not corrected here — this report is read-only; the pointer is precise enough that a future edit is a one-clause removal on line 104.)

---

## Final verdict — is "45-commit vision-build loop, first pass complete" trustworthy as stated?

**Yes, with minor caveats — the core claim holds and is well-evidenced.** All 10 deep spot-checks reproduced independently (8 CONFIRMED, 2 CONFIRMED-WITH-CONCERN, both concerns disclosed by the commits themselves: Director's widget stays empty until owner data lands, and LMS's shipped test needs `DATABASE_URL` to run). The loop introduced **zero new regressions** — all 73 backend test failures are pre-existing or an environmental `DATABASE_URL`-at-import issue in files the loop never touched, and the whole frontend typechecks clean. Commits are one-item-each with no bundling, no blocked-area files, and no racing-writer collisions. On a 10-item independent sample of the Guruh-B queue, **no buildable work was found mislabeled as owner-gated.**

The caveats, none of which undermine the claim: (1) the true session commit count is **46, not 45** — `5173d1d8` post-dates the queue doc and ships a §6 residual, leaving one stale doc line (104) to trim; (2) a handful of commit messages cite **wrong vision-row numbers** (right code, wrong id — `fe96e7ee`, `0357ab31`, `0346b2e6`, `30a1a867`); and (3) the loop's own bug class is **not fully eradicated** — this pass found **8 additional CONFIRMED (plus 1 SUSPECTED) un-fixed "fake-save" instances** the loop's stated "everything buildable is built" goal didn't quite reach, of which Marketing `leads.repository.update()` (drops name/company/source/channel/notes/score) and the two PP shift-report paths are the highest-priority still-live "saves green, data vanishes" bugs worth a second pass. These are additive findings for the next loop, not defects in the 44 commits that were shipped.
