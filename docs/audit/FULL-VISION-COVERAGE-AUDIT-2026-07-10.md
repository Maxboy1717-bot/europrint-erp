# EuroPrint ERP — Full Vision Coverage Audit — all 20 modules (2026-07-10)

**This was a read-only analysis; nothing was changed.** 20 module-audit subagents ran in parallel, each exhaustively re-verifying its module's vision rows against HEAD code + the live `europrint` database (SELECT / information_schema only; two orchestrator spot-checks used no writes). No commits, edits, migrations, seeds, or DB writes were made. This file is the one new documentation artifact, left untracked for the owner to review.

## How to read this (important caveat on comparability)
Each module's vision has **two-to-three overlapping source tables** (a 50-row "vision-1000" set, an 82–143-row "[B/TASDIQ]" set, and a cross-ref set). Each subagent picked the most granular authoritative set for its module, so **row-count bases differ between modules** — a raw row total is not perfectly comparable module-to-module. The comparable metric is **% Ha (fully real, live-verified)**, and the qualitative verdict. Where a module used a combined base (e.g. SD 50+107=157), it's noted.

The single dominant finding, true in **every** module: the system is **"engine-real / data-empty."** Code paths, controllers, and write-paths are overwhelmingly built and registered non-stub, but the transactional tables they drive are almost all 0 rows, and the vision/retriage tracking docs are **systematically stale** because multiple build loops shipped after they were frozen.

---

## 1. Master coverage table

| # | Module | Total rows | Ha | Qisman | Yo'q | % Ha | Blocked/Open | Plain verdict |
|---|---|---|---|---|---|---|---|---|
| 19 | POS / Kassa-monitor | 82 | 40 | 19 | 17 | **48.8%** | open | Most-complete module; canonical stock+GL loop flowing |
| 10 | WMS / Ombor | 121 | 35 | 61 | 21 | **28.9%** | open | Core loop live (QC→scrap, FEFO, goods-issue, GL) |
| 01 | Org-Kartalar | 143 | 39 | 68 | 28 | **27.3%** | blocked | Broad engine on an empty tank; owner-data + canonicalization gated |
| 02 | HR | 82 | 16 | 47 | 11 | **19.5%** | blocked | Wired scaffold; razryad/salary output 0% (owner-data) |
| 17 | AI / Aisha | 95 | 18 | 47 | 29 | **18.9%** | blocked | "Brain" built but inert; ~31% genuinely unbuilt code gaps |
| 03 | Finance | 136 | 25 | 71 | 35 | **18.4%** | blocked | GL core clean & unified; SoD DB-proven inert (0 finance-role users) |
| 05 | Director | 85 | 12 | 43 | 31 | **14.1%** | open | Command-center real & now data-flowing; long analytics tail unbuilt |
| 07 | PP / Reja | 142 | 15 | 77 | 46 | **10.6%** | open | Status/reason/CSV loop real; 3 live fake-saves |
| 12 | LMS / Darslik | 85 | 9 | 45 | 23 | **10.6%** | open | Thin slice; 14/21 core tables empty; both card-bindings NULL |
| 14 | Marketing | 99 | 10 | 44 | 43 | **10.1%** | open | CRUD-real, automation-thin; 3 fake-saves (2 new) |
| 04 | Coordination | 115 | ~12 | ~47 | ~56 | **~10%** | open | Prikaz/protocol built post-doc (11 stale); all tables empty |
| 13 | CRM | 135 | 13 | 27 | 85 | **9.6%** | open | Core live + loop landed; big tracked cross-module tail |
| 09 | QC / Sifat | 97 | 8 | 60 | 27 | **8.2%** | open | 70% partially-wired; dominant gap = empty tables + no cron |
| 06 | SD / Sotuv | 157 | 10 | 56 | 62 | **6.4%** | open | Code-real / data-thin: 0 live SD events, 1/7 PP links |
| 16 | IoT / Telemetriya | 86 | 5 | 33 | 48 | **5.8%** | open | Strongest floor-facing slice; rest = sensor/camera CAPEX |
| 08 | MES | 132 | 7 | 55 | 64 | **5.3%** | open | Loop deltas real; norma/master-data tail Yo'q |
| 20 | CC / Hujjat-shartnoma | 38* | 2 | 19 | 17 | **~5.3%** | open | 04+20 loop shipped (4 stale); B-20 84-row template set mostly Yo'q |
| 18 | Notifications | 132 | 5 | 44 | 83 | **3.8%** | open | Thin CRUD + 9-flat-boolean prefs; 2-way prefs fake-save |
| 11 | MM / Ta'minot | 68 | 2 | 27 | 37 | **3.0%** | open | Thin real core; SoD bypassable; ~37 features unbuilt |
| 15 | Kanban | 137 | 3 | 34 | 100 | **2.2%** | open | 73% unbuilt-by-design (owner-gated subsystems) |

\* CC (20): the reconciled/verified 38-row set; the separate `B-20-cc.md` 84-row template/integration set is overwhelmingly Yo'q (not re-counted to avoid double-counting).

**Overall rollup (≈2,167 rows across the 20 primary bases):** **Ha ≈ 286 (≈13%) · Qisman ≈ 924 (≈43%) · Yo'q ≈ 957 (≈44%).** Read as: ~13% of the vision is fully live-verified, ~43% is partially wired (usually code-real but data-empty or owner-gated), ~44% is unbuilt (the large majority owner-gated by design — schema/seed/decision/credential — not silently missing).

---

## 2. Newly-discovered gaps (NOT in any existing tracking doc)

Grouped by severity. These are the audit's highest-value output — nothing below is in the vision extraction, retriage, or Guruh-B queue.

### Security / integrity (act first)
1. **MM — Separation-of-Duties is trivially bypassable.** `mm-purchase-orders.controller.ts:200-231`: `createPo` takes `createdBy` and `approvePo` takes `approvedBy` **from the request `@Body()`, not `@CurrentUser()`**. The SoD guard (`approve-purchase-order.handler.ts:36`, `purchase-order.aggregate.ts:93`) compares two client-supplied numbers — a caller sends any `approvedBy ≠ createdBy` and defeats the control. *Orchestrator-verified.* (Also: `createPo` has a `MmCreatePurchaseOrderSchema` defined but never applies `ZodValidationPipe` — unvalidated body, Qoida 3.)
2. **Finance — split invoice-world feeds different screens live.** `drizzle-finance-report.repo.ts:44,58` (P&L / tax / collection) still reads legacy `fi_invoices` (7 rows) while AR/AP aging was migrated to canonical `finance_invoices` (8 rows). Both populated → P&L and AR-aging screens show **divergent numbers** from different invoice tables.
3. **CRM — fabricated data written on every lead-create.** `create-lead.handler.ts:86` persists `AIScore.create(Math.round(Math.random()*100))` — a random ai_score hits the column on every DDD lead-create (masked on read by the live scorer, but real fabricated data in the table).

### Correctness (silent wrong results)
4. **CRM — no working audit trail.** `crm_history`=0 rows and no CRM entity calls any AuditService, despite rows grading it "live." Broader than tracked.
5. **SD — golden thread is data-dead.** `update-order-status.handler` atomically inserts `sd.order.status_changed` to the outbox, but `domain_events` contains **zero SD event rows**; only 1 of 7 `production_orders` links to a sales order. The flow compiles and routes but has never fired at data level.
6. **MES — `operator_certifications`=0 under a live hard-block cert gate** (`start-session.handler.ts:41`). Fail-closed gate reading an empty table = no operator can pass unless a requirement row is simply absent.
7. **Kanban — `getTeamMetrics` due_date left un-hardened** (`drizzle-kanban-stats.repo.ts:169`) — the one query the loop's P2 sweep missed; `'' < today` lexical compare mis-counts overdue.
8. **Marketing — inbox FK type mismatch** (schema-level): `social_conversations.id`=varchar but `social_messages.conversation_id`=integer — no varchar slug can ever be stored; root cause of the reply fake-save.
9. **IoT — legacy `POST tablet/sessions` writes zero-linkage rows** (`iot-tablet.controller.ts:160`) hardcoding `production_order_id=0, equipment_id=0, target_quantity=0`, parallel to the loop-fixed canonical `POST production-sessions`. If the FE still calls it, sessions detach from order/machine.

### Architecture / hygiene (tracked-adjacent)
10. **Coordination — raw `db.execute` inside the controller** (`coordination.controller.ts:45,226`) — bypasses service+repo (Qoida 6/15). Plus prikaz number is a plain integer, not the vision-mandated `PR-YYYY-NNN`; and prikaz has no `effective_date`/`expiry_date` columns.
11. **MES — `pm_schedules` orphan table** (0 rows, **0 code references** anywhere); MRO uses a separate `mro_pm_schedules`. Decide: wire MES/IoT PM onto the MRO table or drop the orphan.
12. **PP — shipped catalogs are unseeded** (`pp_reason_codes`=0, `pp_shift_plans`=0, `production_order_status_log`=0): the CRUD surface exists but has no vocabulary/data, so `reason_code_id` can't be populated by default.
13. **LMS — `course_type` populated 0/5** (column exists & is written, but all courses NULL → the TX-100%/general-70% threshold can't differentiate); `video_progress`=0 despite a real upsert (#24 "Ha" overstates).
14. **Kanban / HR / Notifications / Marketing — parallel duplicate tables**: `kanban_observers` vs `kanban_card_watchers`(0), `kanban_comments`(0), `kanban_tasks`(0); HR `leave_requests`(0) vs `hr_leave_requests`(29); Marketing dead `campaigns` CQRS table vs `marketing_campaigns`(6). Two-world duplication, the empty half dead.

---

## 3. New fake-save findings (feeds a future fix-loop; Part-4b format)

**CONFIRMED (15):**

| # | Module | file:line | Field(s) dropped / faked | Note |
|---|---|---|---|---|
| 1 | PP | `production/production.repository.ts:62` createShiftReport | `department`, `shift_number`, `shift_date` | re-confirmed, still un-fixed; no such columns |
| 2 | PP | `pp-planning.repository.ts:34` createScheduleEntry | `quantity` → always 1 | **the "fix" is DEAD CODE** — DTO has no `quantity` key, ZodValidationPipe strips it before the repo |
| 3 | PP | `pp-equipment.repository.ts:244` update | `location` (col exists), `notes` (no col) | new; UPDATE sets only status+name |
| 4 | WMS | `wms-in-transit.repository.ts:34` createShipment | `invoice_number` | column absent from DB entirely; downstream reads it as null |
| 5 | MES | `iot-tablet.controller.ts:436` machine_crews | crew IDs on mid-shift change | `INSERT … ON CONFLICT DO NOTHING` — no UPDATE path |
| 6 | AI | `ai.controller.ts:174` getBottleneckAnalysis | `{bottlenecks:[]}` hardcode | no service call |
| 7 | AI | `ai.controller.ts:216` getShiftRecommendations | `{recommendations:[]}` hardcode | new; no service call |
| 8 | CRM | `create-lead.handler.ts:86` | random `ai_score` fabricated+persisted | see gap #3 |
| 9 | Notifications | `notification-preferences.repository.ts:47` (WRITE) | entire per-type × per-channel matrix | only 9 flat booleans persisted; matrix discarded |
| 10 | Notifications | `notifications.controller.ts:109` (READ) | prefs array vs object | `Array.isArray` always false → page never rehydrates |
| 11 | Marketing | `leads/leads.repository.ts:59` create() | `campaign_id`, `assigned_to` | **new** — same class the loop fixed for 6 cols; these 2 skipped |
| 12 | Marketing | `leads/leads.repository.ts:89` update() | `campaign_id`, `assigned_to` | **new** — updating campaign/assignee silently no-ops |
| 13 | Marketing | `marketing-analytics-stubs.controller.ts:359` replyToConversation | `conversation_id`=0 | still-broken (latent; inbox tables 0/0); FK-type root cause (gap #8) |
| 14 | IoT | `iot-tablet.controller.ts:848` reportProductionDefect | `defectCount` in 200 body | green-but-wrong: DB write correct, response echoes raw DTO (undefined); left by the "defect real count" loop fix |
| 15 | POS | `pos.service.ts:143` addMovementLine | echoes `{movementId, ...dto}`, no INSERT | *orchestrator-verified*; live-routed `POST /movements/:id/lines`; orphan vs canonical line-write |

**SUSPECTED (6):**
- Finance `fi.service.ts:83` getCostCenters — returns hardcoded CC-001..004 when repo empty (fake-READ masks empty table).
- MM `mm-purchase-orders.controller.ts:66-92` — `received_amount`/`pending_amount` computed from **ordered** line totals (goods-receipts never joined) → misleading receipt figures.
- Kanban delete-echo — `removeCardTag`/`removeObserver`/`removeCoExecutor`/`deleteFile` return `{removed/deleted:true}` ignoring rows-affected (no-op delete reports success).
- SD `sd_payments`=0 despite a payment listener (likely writes to Finance GL — needs data-proof).
- CC `cc-stats.service.ts:125,149` — `catch { return []; }` masks DB errors into empty arrays.
- LMS `Ok((r[0] ?? data))` fallbacks — benign (sit on real `INSERT … RETURNING`).

**Note on the prior fix-loop:** items #11/#12 mean the loop's own "Marketing update() fixed" (my 2026-07-09 verification, Part 4b) was **incomplete** — it fixed 6 columns but left `campaign_id`/`assigned_to` dropped. And #2 (createScheduleEntry) is *worse* than that report stated — not just SUSPECTED-unexercised but a **dead-code fix that never took effect.**

---

## 4. Stale-document findings (the tracking docs are systematically outdated)

Build loops shipped after every tracking doc was frozen, so the docs now **understate** real completion across the board. Correct these:

### `docs/audit/VISION-3340-RETRIAGE-2026-07-07.md`
- **Org (01):** 6 items marked missing are BUILT — #2 portret PDF+email, #6/#7 ЦКП per-product/per-employee write-paths, #14 question-bank CRUD, #15 razryad-cert PDF, #24 sensitive-field reason-gate (node-editor half). All still 0 rows (owner-data), so Yo'q→egasi-data/Qisman.
- **SD (06):** 10 clusters stale — PP→SD feedback (#SB0294, the doc's "only real still-open flow"), SD→MM material-wait, auto-invoice, manager leaderboard, advance gate, delivery→WMS stock-out, and 5 FE pages (SDOrderDetail/SDLostOrders/Reclamation/clone/cancel) all shipped real.
- **QC (09):** 09.36 instrument-calibration table+CRUD shipped → Yo'q→Qisman.
- **MES (08):** #17 current_stage timer, #37 breakdown→maintenance, #44 downtime reason_code_id, #46 OEE shift/shop grouping all shipped.
- **PP (07):** `pp_reason_codes`/`pp_shift_plans` EXIST; canonical status-log table is `production_order_status_log` (doc tracks wrong name `pp_order_status_log`).

### `docs/audit/GURUH-B-OWNER-QUEUE-2026-07-09.md`
- **IoT downtime (line ~50):** "переделка" is **already seeded** (`DT-QUAL-REWORK`, id 23, `mes_downtime_reasons`=16 not 7). Only "иш йук" (idle) and "колиб тайёр эмас" (die-not-ready) remain genuinely absent — trim the переделка ask.
- **POS techcard gate FE** (implied remaining): **already shipped** (`PosMovementDetail.tsx` + `recheckTechcard`); only the owner-override path remains.
- **Notifications broadcast (line ~28):** the count is now **6707** `user_id=0` rows (was 6483), still invisible — directionally right, number stale.

### `docs/audit/VISION-LOOP-INDEPENDENT-VERIFICATION-2026-07-09.md` (my own prior report)
- **Part 4b #8 (CRM `updateInvoiceStage` uuid bug): now FIXED at HEAD.** `crm-bitrix-compat.controller.ts:124-129` passes the raw uuid with an explanatory comment; `crm_proposals.id` is integer so the remaining `parseInt||0` there is correct. That finding is **superseded** — the fix landed after 2026-07-09.
- **Part 4b Marketing `update()`:** reported "fixed"; actually only 6 of 8 columns — `campaign_id`/`assigned_to` still dropped (new items #11/#12 above).
- **Part 4b `createScheduleEntry`:** reported SUSPECTED; now CONFIRMED the fix is dead code (item #2).

### Vision extraction / B-docs (rowcount & existence drift — direction usually unchanged)
- "0 rows" claims now data-flowing: `company_state_log`=42 (Director), `ai_fit_scores`=31 (AI/Org), `department_warehouse_map`=47 + `pos_variance_config`=1 (POS), `cc_documents`=2 (Coord), `mm_goods_receipts`=1 (MM), `hr_daily_reports`=8666 (HR), `okr_objectives/key_results`=204 each (Director, but placeholder/orphan).
- Finance: FX "fake-success cron" and the "62.8B UZS garbage POS ledger row" are both **purged/rewritten** (real CBU fetch; `entries` now 6 clean rows). Approval-matrix thresholds now read from `approval_matrix_config` (3 rows), not hardcode.
- WMS: in-transit module built (eta/customs/GTD), `material_substitutes` exists (doc said absent), `write_off_acts` does **not** exist (doc claimed it does).
- LMS: `courses.course_type` column exists, cross-card-credit engine built, cert download real (3 stale).
- IoT: IotGateway WebSocket now a registered provider (doc "dead"); MES/AI: `ai_fit_scores` writer live.
- Director/Finance: `stat_regulations` table EXISTS (0 rows) — the `05-director.md`/SB0372 "table not created" claim is a naming error.
- MM: `supplier-quality-fail.listener.ts` was **removed 2026-07-02**; live logic is WMS `supplier-rating.listener.ts` (real recompute) — 3 rows cite the dead file.

---

## 5. Priority re-ranking by TRUE remaining work

Ranked NOT by old priority but by what's actually left — and split by whether the remainder is **code-buildable now** vs **owner-gated** (data/decision/credential/schema-sign-off), because that changes who acts.

**Tier A — code-buildable now (do these without the owner; small, concrete):**
1. **Fix the 15 confirmed fake-saves** (§3) — highest ROI; each is a "saves green, data vanishes" bug with a live path. Priority within: MM SoD-bypass (security), Marketing `create/update` (attribution loss), PP `createShiftReport`/`createScheduleEntry`, Notifications 2-way prefs, POS orphan line-endpoint.
2. **Finance report-repo → `finance_invoices`** (kills the divergent-numbers bug), payroll-calc→GL posting, ZNO-approval→auto-GL listener.
3. **Seed the shipped-but-empty catalogs** that are code-only (pp_reason_codes vocabulary is owner-data, but the wiring/UX around it is done).
4. **Kanban `getTeamMetrics` hardening; IoT `:848` echo; CRM audit-trail writer; Coordination raw-SQL→repo.**

**Tier B — owner-gated (cannot start without input), by leverage:**
- **Highest leverage single unblock: card master-data** (razryad_level_id, salary_min/max, salary_type, head_user_id, tskp_target) — inert-but-built across **Org, HR, Finance, MES, LMS, Director** simultaneously. One data-entry campaign flips dozens of Qisman rows.
- **Finance-role user provisioning** — SoD is DB-proven inert (0 finance_officer/accountant/kassir users); until they exist, all Finance approval chains collapse to super_admin.
- **AI credential** — the "brain" (router + ~26 tools + analysis services + forecast engine) is built; Gemini key empty + `aisha_tool_calls`=0 means it has never run live. (Anthropic key now present but the task map routes primarily to Gemini.)
- **Schema sign-offs (Q-35):** crm_deals.lost_reason_id + stage-history tables, IoT sensor/camera CAPEX, CC document_hashes/retention/councils, PP queue_sequence.

**Re-prioritization headlines the owner hasn't seen:**
- **POS (48.8%) and WMS (28.9%) are the most-complete modules** — near ready; residual is mostly cross-module wiring (MES→POS FG-kirim, low-stock→PR).
- **Kanban (2.2%), MM (3%), Notifications (3.8%) rank lowest on %Ha, but their gap is overwhelmingly owner-gated-by-design**, not code debt — so a low % here does NOT mean "most code work left."
- **The genuinely code-unbuilt surface is concentrated in AI (~31% real code gaps: routeToManager, camera cross-check, governance, burnout, succession, imports)** — the only module where a large fraction of the block is missing code the owner's credential won't fix.
- **The real cross-system risk isn't any single module's %; it's the "engine-real / data-empty" pattern** — golden-thread flows (SD→PP→MES→QC→WMS→FIN) are wired but unexercised (0 live SD events, 1/7 PP links), so nothing has proven end-to-end on real data.

---

## 6. Verdict

Across all 20 modules the system is **~13% fully-live / ~43% partially-wired / ~44% unbuilt**, but that headline undersells the code and oversells the gap: the code is broadly built and non-stub, the tracking docs are **systematically stale** (every module found retriage/queue/vision rows the loops have since shipped — including two corrections to my own 2026-07-09 verification report), and the true blocker is **empty tables + owner-data/decision/credential/schema gates**, not missing code. The most-complete modules are POS (49%) and WMS (29%); the most owner-blocked are Org/HR/Finance/AI; the lowest %Ha modules (Kanban/MM/Notifications) are low by design, not neglect. The audit's actionable residue for a code-only fix-loop is small and concrete: **15 confirmed fake-saves** (one a security-grade SoD bypass in MM, two new attribution-loss bugs in Marketing, one dead-code "fix" in PP), the Finance split-invoice divergence, and the CRM fabricated-ai_score write. Everything else worth doing needs the owner: one card-master-data entry campaign is the single highest-leverage unblock, flipping inert-but-built mechanisms across six modules at once.
