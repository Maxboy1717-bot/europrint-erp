# MASTER STATUS BOARD — 2026-07-06

> Shared coordination file for all concurrent build/fix loops running in this
> repo today. **Read this before starting or resuming any loop.** Update your
> loop's row (and the file-claims table) after every commit or small batch of
> commits — this is now the single place progress is recorded; do not create
> a separate tracking doc for a loop covered here.
>
> Format is intentionally simple (tables, one row per loop / claim) so any
> loop can extend it without a coordination meeting. If your loop needs a
> column the table doesn't have, add it — don't fork a second file.

## How to use this file

1. **Before touching files**: check the "Active File/Module Claims" table
   below. If another loop has an open claim on the exact file or module
   you're about to edit, do not edit it — pick the next item in your own
   queue and re-check later, or coordinate via a note in your loop's row.
2. **Claim before you edit**: add a row to "Active File/Module Claims" the
   moment you start a file/module (not after). Remove the claim (or mark it
   `done`) once your commit for it lands.
3. **After every commit or small batch**: update your loop's summary row
   below with the latest commit hash(es) and a one-line status.
4. **Standard per-commit concurrency check still applies** (git status/diff
   before staging, exact-file `git add`, never `git add -A`, preserve
   unrelated concurrent edits, retry on lock rather than force) — this board
   is an *additional* check, not a replacement for it.

---

## Live Console Errors (CE-1/2/3, reported 2026-07-07)

| Item | Status | Commit | Notes |
|---|---|---|---|
| CE-1 (CRITICAL) — login/`/auth/me` 500 | **NOT REPRODUCIBLE** | none | Started backend fresh, live-tested `POST /api/auth/login` (admin/Admin123!) → 200 with valid tokens; `GET /api/auth/me` with that token → 200 with correct user claims. Code-reviewed the full path: `login.service.ts`'s card-gate call (`resolveCardGate`) is try/catch-guarded with a safe `empty` fallback on any error; `LoginSchema` is permissive and matches the frontend's exact payload shape (`{username: trim().toLowerCase(), password}`); `global-exception.filter.ts` correctly converts `ZodError`→422, not 500. Could not find or trigger any 500 path. Likely explanations: already fixed by an earlier commit in this branch, or environment/data-specific to whichever session observed it (not reproducible with the current live DB's admin account). **Flagging for the owner**: if this recurs, please capture the exact backend log line (`[Nest] ... ERROR`) and request body — without a live reproduction, further guessing risks a blind, unverified change. |
| CE-2 (HIGH) — `/api/director/approvals/pending?limit=5` 422 | **FIXED** | `275fe94c` | Root cause: `GetPendingDtoSchema`'s `page`/`limit` used `z.number()`, but `@Query()` always delivers HTTP query-string values as strings — fixed with `z.coerce.number()`, matching every sibling query schema in the module. Live-verified: reproduced the exact 422 before, confirmed 200 with real approval data after, using the exact reported repro. |
| CE-3 (MEDIUM) — 3 missing i18n keys in `PendingApprovalsCard.tsx` | **FIXED** | `8bac9d2e` | `kutilayotganTasdiqlar`/`hitlTasdiqSorovlari`/`kutayotganTasdiqYoq` were missing from all 3 locale files (not just uz) — real translations added to all 3. Note: the FE's `t(key, fallback)` 2-arg pattern already prevented literal raw-key display (falls back to inline Uzbek text on any missing key), so the actual symptom was ru/uz-cyr users silently seeing Uzbek text for these 3 labels, not raw keys as literally described — same underlying gap, corrected symptom description. |

## Six-batch verification + build (2026-07-09 → 07-10)

> One session processed six dispatched batches. Verification (Batches 1-3) was an
> independent read-only pass (git ledger + re-derived DB-proofs + 98 tests re-run).

| Batch | Scope | True status | Commits |
|---|---|---|---|
| 1 | Vision-Build Pass 2 (Section-6 residuals + re-scan) | **DONE-VERIFIED** — 9 commits real; re-derived Director `/kpi` phantom-table (`kpi_metrics` absent, canonical present), CRM invoice uuid (`id='0'` throws), Marketing A2 (campaigns.id varchar) | `5173d1d8`,`79b70747`,`9400075d`,`2099949e`,`16147dc3`,`91aca52a`,`e9ef01d9`,`0c7960ca`,`5bce37e6` |
| 2 | 9 fake-saves (Mkt/PP/WMS/CRM/SD) | **DONE-VERIFIED** — incl. 2 adversarial-verify follow-ups (`softDeleteLead` 500→404; SD internal-notes real fields). 3 Q-35 flags **re-confirmed still-live**: `social_messages.conversation_id` int vs `social_conversations.id` varchar; `production_sessions` missing dept/shift cols; `wms_in_transit_shipments` missing `invoice_number` | `cd25da8d`,`a2295249`,`9d490690`,`cda7ce1e`,`9111fdf1`,`be40fa14`,`0c7960ca` |
| 3 | 8 owner-decisions | **DONE-VERIFIED** — LOW_STOCK per-user warehouse routing (rule=`warehouse_keeper` ✓); Kanban inert map; granular notif prefs; MES accepted-status; frozen-zone/split docs. **3 blockers re-confirmed live** (see below) | `34f2b9d8`,`a2499ab0`,`8b35f2e3`,`1762c6c8`,`d39c33e5`,`8368657b`,`190c2854` |
| 4 | MM security + 15 fake-saves | **PARTIAL** — Phase 0 (SoD security) **DONE-THIS-SESSION + VERIFIED**; Phase 1 (13 items) **investigated, not built** (1.3 already-fixed by `d39c33e5`; 1.1 premise incomplete — service also drops `assignedTo`) | Phase 0 = `b779f221` |
| 5 | 16 owner-decisions (schema/CRUD/cleanup/calendar) | **DONE (11 build items, 2026-07-09)** — all DB-proven, tsc 0, i18n baseline held. Items 9/15 = owner-premise-corrections (docs, prior); 12/13 correctly halted (live refs); 16 (AI) skipped. Items 5/6/7 "3 settings-CRUDs" owner-clarified 2026-07-09 (PP reason-codes / CRM loss+stage vocab / LMS course-card). See Batch-5 detail table below. | `cfc8a336`,`a76771e4`,`d4ac0b9a`,`908c13c1`,`c5b42216`,`1e48e2ef`,`c52525aa`,`5b3828a9`,`83b7c21e`,`7327f44f`,`918d79bc`,`e4f9ca3f` |
| 6 | CRM ownership (Item A) + SD zayavka 5-gate (Item B) | **Item A ATTEMPTED→REVERTED** (implement-only sub-agent died mid-refactor; broken partial NOT committed, tree restored clean); **Item B NOT STARTED** (5-gate safety-critical, needs a dedicated session) | — |

**Batch 5 — per-item outcome (2026-07-09; single-writer, one commit/item, DB-proof each; concurrent CRM-ownership session's `crm-extended.controller.ts`/`schema-compat-1a.ts` left untouched):**

| Item | Built | Commit(s) | Verify |
|---|---|---|---|
| 2 IoT CAPEX | `sensor_devices.install_status` (needed/planned/installed) + first-ever CRUD + settings screen `/iot/sensor-capex` | `cfc8a336`,`a76771e4` | DB: INSERT/LIST/UPDATE/CHECK/UNIQUE; routes 401 |
| 4 PP navbat | `production_orders.queue_sequence` per-machine queue (EP-PP-085) + drag reorder + FE `/pp/queue` | `d4ac0b9a` | DB: reorder→1,2,3, dup-pos 23505; 401 |
| 5 PP reason-codes | `pp_reason_codes` mgmt screen `/pp/reason-codes` (BE existed; added findAll+includeInactive) | `908c13c1` | DB: active/all + reactivate; 401 |
| 6 CRM funnel settings | `crm_loss_reasons` + `crm_stages` manager CRUD `/crm/funnel-settings` (new crm/settings slice) | `c5b42216` | DB: loss+stage create/update, auto status_id; 401 |
| 7 LMS course-card | course→org_departments binding screen `/lms/course-card-binding` (BE existed; FE gap) | `1e48e2ef` | DB: bind/unbind/by-card; 401 |
| 8 CC quorum | council 2/3 quorum + decision eval (advisory/majority/chair-tie) `/coordination/quorum` | `c52525aa` | DB: 5 outcomes + guest-exclude; 401 |
| 10 WMS variance | inventory variance always-human-confirm (no %-auto-approve) `/wms/variance-approval` | `5b3828a9` | DB: block-no-reason/approve/conflict; 401 |
| 11 Coordination | auto-rasporyazhenie from resolved dokla (idempotent) + FE "Avto" badge | `83b7c21e` | DB: auto+idempotent+subject-fallback; 401 |
| 14 PP weekly | weekly plan calendar + reschedule `/pp/weekly-plan` (EP-PP-110) | `7327f44f` | DB: 7-in-range, reschedule; 401 |
| 1 CRM lost-reason | `deals.lost_reason_id` FK + controller wiring + structured rollup (stage-history already wired) | `918d79bc` | DB: write+FK 23503+labelled rollup+stage-hist |
| 3 CC hash/retention | archive retention leader10y/worker3y (immutable) + signature-hash verify | `e4f9ca3f` | DB: 10y/3y+immutable+hash-format; static-fallback (Q-44 boot) |

**Batch-3 blockers (re-confirmed live 2026-07-09):**
- **CRM ownership (→ Batch 6 Item A):** `crm_leads.assigned_to` exists but 0/16 populated; `crm_deals`/`deals` have NO `assigned_to`. Owner decided (Item A) to converge on `assigned_to` + add it to deals — attempted, reverted (see above).
- **SD stock-out coupling (→ Batch 6 Item B):** POS `EXTERNAL_OUT` already decrements `warehouse_stock` inline; no delivery↔POS link (0 EXTERNAL_OUT rows) → retiring `#51` prematurely = silent under-issue. Owner decided the 5-gate zayavka chain (Item B).
- **MES shift-id:** `shifts` master table = 0 rows; no shift-id source. (Accepted-status half shipped `8368657b`.)

**Open owner-facing questions carried forward:**
- LOW_STOCK routing is mechanism-only until warehouse users exist: **0 active `warehouse_keeper` users**; **6,739** historical `user_id=0` LOW_STOCK rows left as-is (non-destructive).
- Dead-code: PP `/planning/schedule` (`createScheduleEntry`) — 0 FE callers → wire up or remove?
- Q-35 column gaps (Batch 2's 3 flags above) awaiting sign-off.

---

## VISION-3340 batch2 fix-workflow — CLOSED OUT (2026-07-08)

`wf_91c2396c-5db` ("vision-3340-fix-batch2", 39 clustered work-units covering the
remaining 43 fixable-now items). The background workflow process itself got
killed by session/environment restarts multiple times during this dispatch
(not a code failure — `<task-notification status="stopped">`, no completion
record) and had to be resumed 3 times; each resume re-started whatever hadn't
reached a durable "result" checkpoint, so units that were mid-task at each kill
lost progress and restarted from scratch. Recovery used the same forensic
process as batch1: `git status` + actually running tests/diff-reading each
unit's leftover files rather than trusting any self-report (none of the 39
agents actually got to return a final report in this run).

**Result: 14 of 39 clusters (14 items) fully completed, reviewed, tested, and
committed; 1 more (item #29) partially completed (backend-only, its FE half
still open); the other 24 clusters (28 items) never wrote any code at all —
cut off before starting, not "attempted and failed."**

| # | Item | Commit |
|---|---|---|
| 12 | ЦКП deadline-gate compliance rate on director summary | `a5282363` |
| 13 | razryad_levels.min_months 0→3 backfill (EP-ORG-011) | `a1dbd39d` |
| 15 | Razryad promotion certificate PDF | `7916944a` |
| 16-17 | material_kit_items batch/LOT FK + production_sessions stage writes | `32bd6ccb` |
| 20 | IoT CRITICAL anomaly → MES auto-pause | `53ffb456` |
| 24 | Sensitive karta-field edits require a reason | `976ee28c` |
| 26 | Card-template apply + bulk node import FE | `6632f1db` |
| 28 | CRM Kanban stage-keys match real DB values | `a19218e0` |
| 29 | Customer 360 financial/risk fields — **backend only** | `b1e1c767`, `7827d3a1` |
| 30 | CRM overdue badge (pending activities + history tab) | `acee03f9` |
| 33 | CRM lead-aging daily reassignment cron | `f855ca16` |
| 36 | QC certificate PDF trilingual + real QR | `d62d0784` |
| 37 | QC final sign-off razryad gate | `0af03e54` |
| 39 | AI vision QC confidence threshold configurable | `b931b326` |
| — | shared `business.constants.ts` append for #20/#33/#37 | `022481b0` |

**Two real defects found and fixed during forensic review** (beyond the dispatched
scope, both necessary to make the dispatched work actually correct — not scope
creep, completion of what was already claimed done):
1. **Unit 20's `mes.module.ts` registration was already silently broken since
   commit `b0ba1815`** (VISION-3340 #19, batch1): that commit's `mes.module.ts`
   diff referenced `PauseSessionHandler` from a file that was never actually
   committed to git — only present as an untracked leftover in this working
   tree. A fresh clone at that commit would have failed to build. Fixed by
   finally committing `pause-session.command.ts`/`pause-session.handler.ts` as
   part of `53ffb456`.
2. **Unit 29's premise was wrong**: `getCompany()`'s `db.select().from(crmCompanies)`
   only returns columns mapped in the Drizzle schema object, not a literal SQL
   `SELECT *` — `is_blocked`/`block_reason`/`open_debt` existed live but were
   never mapped in `schema-compat-1a.ts`, so they were silently omitted
   regardless of the DB. Fixed in `7827d3a1`.

**Also recovered a fully-written implementation from a leftover `.tmp` file**:
unit 16-17's `drizzle-mes.repo.ts` edit was interrupted mid-write (an atomic
write-then-rename got killed between steps), leaving a `.tmp` sibling file with
the COMPLETE intended implementation and the real file with only a partial
version + an orphaned unused import. Diffed the two, confirmed the `.tmp`
version was a clean superset, promoted it. Also completed a genuinely missing
piece unit 16 referenced but never created: the `material_kit_items.batch_id`
migration + Drizzle schema mapping (`32bd6ccb`).

**Remaining scope — 28 items never attempted, need re-dispatch**: 9, 35, 40,
41, 42, 43, 44-45, 46, 47, 48-49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
61-62, 63, 64, 65 (full fix detail in `VISION-3340-RETRIAGE-2026-07-07.md`) +
item #29's FE half (Customer 360 "Financial status" block). Plus the 6
schema-approval items, still PENDING-OWNER-DECISION (unchanged).

**Recommendation for the next dispatch**: this environment appears to kill
long-running background processes unpredictably (observed 3 times across
batch1+batch2, unrelated to the weekly rate limit that caused batch1's
failures) — favor smaller batches (4-8 units at a time via direct Agent calls,
not one large Workflow) so a kill mid-run loses less committed-but-unreported
progress, and so forensic recovery per round stays tractable.

## VISION-3340 batch1 fix-workflow — CLOSED OUT (2026-07-08)

Full routing detail: **`docs/audit/OWNER-QUEUE-2026-07-08.md`**. Summary:

**Workflow `wf_1eee15f8-be1` (43 units for the 59 fixable items): `status: completed`
but only 9/43 units self-reported success.** ~34 units FAILED on `You've hit your weekly
limit · resets 9am (Asia/Tashkent)`. Forensic recovery (checked `git status` +
actually ran the tests for every "failed" unit rather than trusting the self-report)
found **6 more units had silently finished their work before being cut off**
(units 02, 06-07, 14, 22, 25, 27) — raising the true success count from 9 to **15/43**.
The other ~34 units left genuinely-incomplete/interleaved partial edits in shared files
(agents ran concurrently in ONE working dir, no worktree isolation); those fragments
were surgically reverted (keeping the 15 complete units' contributions intact where
they shared a file) and 2 fully-orphaned new files were deleted per Q-46.

**All 15 confirmed-complete units are now reviewed, tested, and committed
(1 commit/item, per the session's standing convention):**

| # | Item | Commit |
|---|---|---|
| 1 | PP order-cancel → notify SD | `9f3f3e61` |
| 2 | Karta Portret PDF export + email | `7aafbd24` |
| 3 | Finance invoice-created → AI classify listener | `0db81c59` |
| 4 | LMS mentor rating + qualification-verification | `5d112328` |
| 5 | Auth JWT TTL doc fix (24h→15m) | `5500a0aa` |
| 6-7 | ЦКП per-product/per-employee target write paths | `77188479` |
| 8 | Director stat-regulation approve/sign-off | `17c1fc52` |
| 10 | AI daily executive summary → owner Telegram | `2de0ab7f` |
| 11 | Director dashboard IoT/MES downtime+telemetry | `dfd845b2` |
| 14 | hr_question_bank CRUD | `726e4adf` |
| 18 | IoT OEE availability — real session timing | `81ef299f` |
| 19 | MES SOS escalation → Telegram alert | `b0ba1815` |
| 22 | ERPOrdersTab — all 9 PO statuses | `ffc7411c` |
| 25 | mentors.card_id write path + 2-per-card cap | `462789e0` |
| 27 | LMS mandatory-darslik gate on FE card summary | `e1d91c8f` |
| — | shared `org-structure.module.ts` wiring for #2/#14/#27 | `5804485c` |

Working tree confirmed clean of all fix-batch1 fragments after commit (`git status`
on every file touched by the reverted units returns nothing).

**Remaining scope — NOT yet attempted, needs re-dispatch:**
- **43 fixable-now items still open** (65 total − 6 owner-approval-excluded − 16
  items closed above = 43). Full detail per-item in
  `docs/audit/VISION-3340-RETRIAGE-2026-07-07.md` items #9,12,13,15-17,20,24,
  26,28-30,33,35-37,39-65 (minus the 6 excluded).
- **6 schema-approval items** — unchanged, still PENDING-OWNER-DECISION (see below).
- Recommended approach for the next dispatch: same clustering, but with
  `isolation:'worktree'` per agent this time to eliminate the interleaved-shared-file
  problem entirely (the root cause of this batch's cleanup cost) — worth the extra
  setup cost given how much forensic work the shared-tree approach required.

### Owner-routed items (nothing executed until owner responds)

- **Dead role-file deletion (Part 1): ALREADY DONE — no yes/no needed.** `role.enum.ts`
  + `types/role.ts` barrel were deleted inside M8 commit `5b68d53b` (fresh check: absent
  on disk, 0 importers). The earlier "BLOCKED-OWNER-DECISION" flag was already corrected
  to DONE in `ac476cc0`. Premise was stale.

- **6 schema-approval items — PENDING-OWNER-DECISION** (ordered by downstream impact,
  plain-language questions in the queue doc):
  1. GL `entries.cost_center_id` — tag GL postings to a cost center? (owner-protected area)
  2. PP `pp_reason_codes` + `pp_shift_plans` — 2 new tables for reason codes + real shift plans?
  3. CRM `crm_deals.sales_order_id` varchar→integer + FK — irreversible type change (empty now)?
  4. CRM `crm_loss_reasons` new lookup + `lost_reason_id` — canonical loss-reason taxonomy?
  5. CRM `crm_stage_history` new audit table — funnel stage-change audit trail?
  6. IoT tablet `tablet_id`+`local_seq_no` idempotency columns — offline-retry dedup?

- **123 owner-data/owner-decision items — PENDING-OWNER-INPUT.** 41 owner-data (ranked by
  highest-leverage data-point: #1 = per-card attributes unblocks 8) + 82 owner-decision
  (grouped by type: A flip-a-switch / B which-table-is-canonical / C what-rule-applies /
  D should-feature-exist). Full grouped list + counts: `docs/audit/OWNER-QUEUE-2026-07-08.md`.

## Active Loops — Summary

| Loop | Scope | Status | Last commit(s) | Last updated | Notes |
|---|---|---|---|---|---|
| **i18n F2 / Combined Fix Loop (Parts 1-3)** | Part 1: Magic-Numbers (M1-M11, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`). Part 2: i18n 2-arg-helper migration (F1-F10, `docs/audit/I18N-FIX-LOOP-2026-07-05.md`). Part 3: Design/Layout QA (D1-D4, `docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`). | IN PROGRESS | `88d608d8`,`bb40788e`,`c8585cf7`,`7069d2f5`,`0a6c0b6`,`69c24222`,`891f9401` (+ earlier IoT/Warehouse chain `467b3207`..`d4f06bde`) | 2026-07-06 | Part 1 (corrected 2026-07-07 per `docs/audit/MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md` — MN-5, this row previously overstated M6/M9 as flatly "done"): M2/M3/M4/M7 done; **M6 now fully done (4/4, `5726e00a` closed the 2 remaining items — QC-lot fail-ratio + quarantine RM-MAIN/QC-HOLD routing — MN-1)**; **M9 config-schema gap now closed (`a09b2a3b`, MN-3)** — both the flat 150k/0.20 scheme (`wms-eoq.service.ts`) and the divergent ABC-tiered 50k scheme (`mrp-run-eoq.helper.ts`) are now independently settings-table-tunable via `getConfigNumber`; investigated and confirmed the 2 schemes are a genuine, deliberate methodology difference (not drift) — did not merge them, left which-is-canonical as an explicit owner decision; M11 partial (1/7 duplication clusters); **M8 slice 1 done (`a96b1980`, MN-2)** — live DB check found `users.role` has exactly 4 distinct values in use today (manager×27/super_admin×3/director×1/employee×1, no CHECK constraint), proving `'ERP_MANAGER'`/`'admin'` are 100% dead in every role array (never assigned, guard already case-insensitive so this changes zero current auth behavior); removed all 39 occurrences across 31 files. Broader M8 scope (~36 divergent role catalogs, ~10 duplicate local `enum Role {}` definitions, remaining ~40 files' uppercase-vs-lowercase drift) still QUEUED-NOT-STARTED — this slice only removed what live data proved dead, not a full catalog unification; M1/M5/M10 permanently skipped (GL/payroll/Aisha restriction — owner decision needed). **Part 2 F2's entire "2-language-only" bug scope is now CLOSED**: IoT/Warehouse/PlanningBoard/Barcode/Face-recognition/camera-ai-modern/wms-reservation/PapkaOrders all migrated (repo-wide grep confirms only intentional 2-state toggle buttons + legitimate DB-column fallbacks remain); `components/orders/WizardHeader.tsx` cluster and `pos-monitor/i18n/usePosI18n.ts` verified as pre-existing false positives (already 3-language-correct). F3 (Cyrillic DB column decision) not started. **2026-07-07 correction:** re-read the source doc (`I18N-FIX-LOOP-2026-07-05.md`) directly — "F5-F10" do not actually exist as defined work items; the doc's own text says Tier 1's remaining items and any Tier 2/3 items are explicitly left for the owner to fill in later ("keyinroq to'ldiriladi/aniqlashtiriladi"), and only F1 is fully specified today. Earlier board entries referencing "F5/F6/F7/F8/F9/F10 not started" were citing placeholder numbers that were never actually defined — there is nothing to execute or plan for them yet; this is not a gap in this pass's work, it's a correction of a stale premise. The doc is also explicit that execution of this WHOLE loop (including F1) only begins once the owner gives clear go-ahead — F1 itself is already correctly tracked as BLOCKED-OWNER-CONFIRMATION in its own row below. **F4 (~470 BE exception messages) is now DONE** — see its own dedicated row in Active File/Module Claims below (513 sites across 37 module commits + 3 gap-fill commits + the global-exception.filter.ts special item). Part 3: D3 done (`69c24222`, ImpositionCalculator token+breakpoint alignment). **2026-07-07 correction:** the "D1 done (6 commits)" / "D2 blocked on port 20806" / "D4 not started" labels in this row were a bookkeeping error — the 6 cited commits (`88d608d8` etc.) are all Part 2 i18n F2 commits, not Design-QA fixes, and "D1/D2/D4" don't correspond to any section of `DESIGN-QA-FULL-AUDIT-2026-07-05.md` itself. Re-read that doc's own §5 "Top 10 worst offenders" (the real, source-of-truth ranked list) directly: #10 (hardcoded light-only colors) is DONE (`949490db`); #4/#5/#6/#7/#8/#9 (single-file bugs: AgentsHub duplicate-`lg:`, DirectorExtended missing `h-full`, SDSalesOrders fixed-width sidebar, CRMWorkspace 7-day-calendar breakpoint, DesignOrderDetail missing gradient direction class, SecurityExtended 7-tab overflow) dispatched via Workflow `w57m1v0xu` (2026-07-07), pending main-agent review+commit. #1 (duplicate-`sm:`/`lg:` grid bug, 8+ pages), #2 (app-shell double/triple padding, ~all pages — canonical convention already documented as `DIZAYN_QOIDALARI.md` D-4: shell provides `p-4 lg:p-6`, page root should be `space-y-6` only, no page-level padding), and #3 (`EPPageHeader` non-adoption, ~54+ pages) are the 3 shared-root-cause systemic sweeps — each individually mechanical/well-defined but large in scope; correctly scoped OUT of this pass as dedicated follow-ups (each deserves its own session to sweep consistently) rather than fixed piecemeal into an inconsistent half-migration. |
| **Owner-Decisions** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Two-Worlds** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Critical-Correctness** | `docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md` — C1-C4 (payment race/no-tx, IoT tablet TTL, GL UTC date + varchar period-lock, invoice-number Date.now() collision) + HIGH/MEDIUM/LOW batches | **C1-C4 DONE. Part 2 ALL HIGH-severity DONE** (1.2 backend stopgap `6e86310c` + 1.4/1.5/6.1/6.2/8.1/8.2/8.3). Part 3 (35 MEDIUM/LOW) IN PROGRESS — 7 items closed this pass (3.1 `fb01fc44`, 5.2+5.3 `e3a4dc22`, 5.4 `ca186aed`, 5.5 `f0ae8c56`, 8.6 `5a9fb60e`, 8.7 `867b1cf5`) — see items below for remaining UNKNOWN rows. **1.2-frontend follow-up NOT STARTED** (needs FE work, tracked as its own line above). | `6e86310c` (1.2 stopgap) | 2026-07-06 | **1.2** (`sd-payments.repository.ts`, `sd.dto.ts`): owner decided this is its own dedicated item — ship a backend-only debounce stopgap now (explicitly PARTIAL, not a full fix), track the full client-idempotency-key fix as a separate FE follow-up. Added a 7s debounce SELECT (order_id key, customer_id fallback for cash/unlinked sales, skipped when neither present) before the pre-existing overpay guard; an explicit `idempotency_key` in the body bypasses it (not persistently deduped — no schema backing, an accepted stopgap-only limitation). Live dry-run + 6/6 new tests PASS; full test/sd/ suite (204 tests) re-run, 3 pre-existing unrelated failures confirmed via git-stash. **1.2-frontend (NOT STARTED):** full fix needs the payment form to generate a client-side idempotency key (e.g. UUID cached per form-open) and resend it unchanged on retry/double-click — a frontend contract change outside this backend-only pass. **RESOLVED (817fa27c)**: owner decided "do not delete, re-link where sensible, flag unresolvable rows for manual review." Investigation found ZERO of the (now 99, grew from 84 as this is an ACTIVELY FIRING bug — see below) orphaned `okr_key_results` rows can be confidently relinked: 100% share an identical placeholder title ('KR1'), `created_by=2` has no matching `users` row, and `okr_objectives` itself only cycles through 3 generic titles with no distinguishing signal — forcing a relink would fabricate false provenance. All 99 rows flagged live via a `[NEEDS_REVIEW]` marker in the previously-empty `notes` column (idempotent UPDATE, no schema change, no deletion). **Root-cause note**: this repo's own test suite was grepped and ruled out (both OKR test files mock the DB/repo layer entirely) — the most likely ongoing source is a concurrent git worktree (`.claude/worktrees/green-lie-group1`) also touching the OKR module against this same shared dev DB; flagged for the owner rather than guessed at further. | `a7f0129e` (C1), `f4d17363`+`b29c8bce` (C2), `e6cebf7d` (C3), `cc3f8a9d`+`1e5802d9` (C4), `e8c5a1f6` (1.4), `7e8d7bd9` (1.5), `dfa2b1d7` (6.1), `4432944` (6.2), `12e6bd63` (8.1), `9f8a62e1` (8.2) | 2026-07-06 | **8.1+8.2** (`auto-barcode.{service,repository}.ts`, `pos-stock-issuable.{service,repository}.ts`): both findings share one root table — `pos_barcode_print_queue` is a plain-SELECT VIEW over base table `barcode_print_queue`, which had NO unique constraint on `barcode` at all (confirmed live: `ALTER TABLE` on the view itself is rejected by Postgres — "not supported for views" — had to target the base table). Added a live UNIQUE constraint on `barcode_print_queue.barcode` after a dry-run confirmed zero existing duplicates. 8.1's random-suffix generator and 8.2's COUNT(*)+1-then-existence-check allocator both now surface the Postgres 23505 code via `AppError.details.pgCode` and retry with a fresh barcode/sequence on collision (bounded: 3 attempts for 8.1, 5 full allocate+insert cycles for 8.2) — any other DB failure kind returns immediately, no infinite-retry risk. 4/4 + 4/4 new tests PASS; full `test/pos/` suite (117 tests) re-run clean both times. **6.2** (`okr.repository.ts`): `deleteObjective()` hard-deleted only `okr_objectives`; Drizzle schema declares `okrKeyResults.objectiveId` with `onDelete:'cascade'` but that migration was never applied live (`okr_key_results` has no FK on `objective_id` at all) — every objective delete orphaned its key results. Fixed with the same atomic `db.transaction` cascade pattern as 6.1 (no DDL). Live dry-run + 2/2 new tests PASS. **6.1** (`erp.repository.ts`): `deleteBomHeader()` hard-deleted only `bom_headers`; `bom_items` has no FK to `bom_headers` (only `component_id→material_cards`) — orphaned line items on every header delete. Same atomic-transaction-cascade fix (delete `bom_items WHERE bom_id=id` then the header, one `db.transaction`). Live dry-run (2-items + 0-items cases) + 3/3 new tests PASS. **1.5** (`pos-warehouse-integration-movement.service.ts`): `decreaseFromWarehouseStock()` had a fully unguarded UPDATE (no WHERE-quantity-check at all, worse than 1.4's incorrect-guard) after a stale pre-transaction SELECT in `validateOutboundStock()` — same TOCTOU class as 1.4. Same atomic guarded-UPDATE-with-RETURNING fix, this time preserving the existing PRD Q38 rule (ASSET hard-blocks on insufficient stock, CONSUMABLE allowed negative) via a guard clause with an `OR NOT EXISTS (...material_type='ASSET')` branch. Live dry-run covered all 5 permutations (ASSET suff/insuff, CONSUMABLE suff/insuff, missing row). 3/3 new tests PASS; confirmed pre-existing `barcode-warehouse.spec.ts` failure via git-stash is unrelated. **1.4** (`queries-wms.ts`, `drizzle-wms.repo.ts`): `reserveMaterial()`/`issueGoods()` wrote an unguarded ABSOLUTE new value after a stale SELECT snapshot — TOCTOU oversell under concurrent reservation/issue. Converted to the same atomic guarded-relative-delta UPDATE pattern already proven elsewhere (`execIssueFromWarehouseStock`, `saveStock()`'s tx-branch); functions now return boolean applied/not-applied, repo only decrements `remainingAmount` on success, falls through to next FEFO row otherwise. A live rollback-tx dry-run caught a real bug in the first-draft guard (ad-hoc issue could still oversell against reserved stock) before it shipped — fixed with a third guard term derived from the post-write non-negativity invariant. 5/5 new tests PASS (`test/wms/drizzle-wms.repo.oversell-guard.spec.ts`); confirmed via git-stash that 5 pre-existing unrelated WMS handler-spec failures predate this change. **C4 follow-on** (`1e5802d9`): after the first C4 commit, a fresh grep for `Date.now()` across `apps/api/src/modules/finance` found 3 MORE independent writers to `finance_invoices.invoice_number` sharing the exact same collision root cause — `finance-actions.repository.ts` (createApEntry/createArEntry, raw SQL) and `finance-ar.repository.ts`/`finance-ap.repository.ts` (Drizzle `.insert().values()`). All 4 writers now generate via `nextval('invoice_number_seq')`. 4/4 new tests PASS. Finding 1.3 is now closed across the whole finance module, not just one call site. | C1/C2: see prior entries. **C3** (`gl-posting.service.ts`): `new Date().toISOString().slice(0,10)` was UTC, mis-dating any GL post made 00:00-05:00 Tashkent time to the previous calendar day (and letting it slip past the period-lock a day early) — now uses `TashkentTimeService.formatDate(new Date())`. Confirmed the period-lock comparison itself (varchar ISO lexicographic BETWEEN) was ALREADY correct — only the date computation was the bug, audit framing partially wrong. 24/24 tests PASS (2 new, jest fake-timers proving the UTC-boundary case). **C4** (`drizzle-finance-invoice.repo.ts`, `finance-invoices.controller.ts`): `invoice_number` was `INV-${Date.now()}` with zero DB uniqueness enforcement — now server-side generated via the previously-dormant `invoice_number_seq` sequence (atomic, collision-proof), plus a live UNIQUE constraint added as a safety net (dry-run confirmed zero existing duplicates first). Controller no longer computes/returns a stale client-side number — uses the DB-RETURNING value. 2/2 new tests PASS; full finance suite re-run, same 4 pre-existing unrelated failures, zero new ones. Note: `finance-invoices.controller.ts` also carries an unrelated, not-yet-committed i18n Tier-2 F4 edit (error-message `this.i18n.t()` wrapping) that was already in the working tree — documented transparently in the C4 commit message, not claimed as this session's work. |
| **Org-Card Manual-Entry Remediation (G1-G12)** | `docs/audit/ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06.md` (Parts A-D) + `docs/migration/02-vysotskiy-7-tree.md` (vision) — G1 (HR role missing from write-guard), G2 (employee-assignment split across `employee_org_departments`/`employee_cards`), G3 (node_type vocabulary missing otdel/sektsiya/sektor), G4 (parent-picker + duplicate-card), G5 (legacy mirror-write in sync-helper.ts), G6 (two competing create entry-points), G7 (ЦКП/salary card→payroll wiring), G8 (course↔card binding), G9 (single-tree invariant, DECIDE), G10 (single canonical card table, DECIDE), G11 (mandatory-reason audit), G12 (BE-side confidential-field projection) | **LOOP CLOSED.** G1-G6 DONE + committed; G5 DEFERRED (documented, no code change — see note); G7/G8 verified ALREADY IMPLEMENTED (no action needed, audit doc was stale on this point); G9/G10 DECIDE-only, flagged not implemented; G11/G12 correctly scoped OUT of this pass (real, valuable, each needs its own dedicated session) | `8507126a` (G1), `82d24fe6` (G2), `0c3a9474` (G3), `db05b9b3`+`893c1c54` (G4), `879258e1` (G6) | 2026-07-06 | **G6** (`StubRoutes.tsx`, `AppRouter.tsx`): `/api/core/departments` (OrgDepartmentsPage's BE) already routes into canonical `org_departments` — not a real two-worlds split — BUT `createCoreDepartment()` never set `parent_id`, so every department made there became an orphan ROOT node, directly feeding G9's "14 roots" finding. Page had zero sidebar links (grep-confirmed unreachable except by direct URL) — redirected `/org-departments → /org-structure/hierarchy`, mirroring the same file's existing pattern for 6 other legacy org routes. `OrgDepartmentsPage.tsx` + `CoreDepartmentsCompatController` left in place as now-orphaned dead code (small, reversible change) — available follow-up cleanup, not required. typecheck 0 errors, check-sidebar-routes.mjs 285/285 PASS. **G7+G8 — VERIFIED ALREADY DONE, no commit needed:** grepped `computeGatedMonthlySalary`/`previewCardSalary` (payroll.service.ts) and `lms-card-gate.service.ts` — both are fully built AND wired into the live `closePeriod`/payroll-row-generation flow (ЦКП-gate + LMS-gate, "a card with allComplete=false withholds that card's salary"), landed in an earlier session (T7-09/T20-A1/EP-ORG-027 per in-code op-codes). The audit doc's "PARTIAL/MISSING — card→payroll unwired / course→card 0/5" framing was about **DATA sparsity** (courses.card_id owner-data not yet populated, tskp_target mostly 0), not missing code wiring — the mechanism is live and correctly fails open ("no course bound = no block", not a fabricated pass, per Q-40). Re-implementing would have been pure duplicate work. **G9/G10** — DECIDE-only per the directive, not implemented: both are the Two-Worlds loop's own root-cause-cluster-3 (KARTA-centric org unification, IN-PROGRESS 40%, commit `d89c87de`) under a different name; flagging here rather than re-solving. **G11 (mandatory-reason audit) / G12 (BE-side confidential-field projection)** — verified genuinely still open (no existing `reason` field on the update DTO; `findOne` returns full node unfiltered by role) and NOT claimed by any other loop on this board — correctly scoped out of this pass rather than rushed; each is a real, self-contained follow-up (G11: add `reason` param + `razryad_history`-style audit row on salary/razryad edits; G12: role-based response projection in `OrgStructureService.findOne`/list). | **G5 (legacy mirror-write in sync-helper.ts) — DEFERRED, no commit, by design:** investigated per the directive's own instruction ("If any live reader exists... do not guess"). Found **8+ genuine live readers** of `positions`/`departments` that would silently go stale if `syncToCoreTable()` stopped writing: `succession-compat.service.ts:79-80` (succession-plan readiness), `employees-payload.adapter.ts:76,82` (employee create/update FK validation), `employees-org-assignment.helper.ts:111` (`positions.rbac_tier` — **derives the operator's RBAC ROLE**, 100%-populated/96-96 rows, load-bearing), `dashboard-query.repository.ts:96-97` (director dashboard stats), `analytics.repository.ts:106,126` (position/department leaderboards), `position-permissions.repository.ts:19,37` (permissions repo — full-table Drizzle reads), `positions.repository.ts:17,26` (the `/api/positions` CRUD backing repo itself, still live), `career-path.repository.ts:132` (HR career-path feature), `erp-camera.repository.ts:68` (camera analytics by department). Stopping the mirror-write today would break RBAC role derivation, director dashboards, succession planning, analytics leaderboards, and camera reports — this is NOT a small follow-up, it is genuinely schema-migration-scale (repointing 8+ files' SQL to `org_departments`' different column shape). Cross-checked Two-Worlds root-cause-cluster-3 (KARTA-centric org unification, IN-PROGRESS 40%, commit `d89c87de`) — confirmed that commit was purely additive (new columns on `org_departments`, non-destructive) and did NOT touch `sync-helper.ts` or any reader, so this finding is not duplicate work, it is a genuinely new, still-open sub-item of that same cluster. Recommendation for whoever picks this up: repoint the 8 readers to `org_departments` FIRST (one file at a time, each with its own test), THEN stop the mirror-write as the final step — never the reverse order. | G4 (`ParentCardSelect.tsx` new + `AddNodeDialog.tsx`/`TreeCanvas.tsx`/`TreeNodeCard.tsx`/`OrgStructureHierarchy.tsx`/`.claude/launch.json`): parent-picker reuses the ManagerSelect.tsx combobox pattern (Radix Popover+cmdk), sourced from `/nodes/flat?limit=1000`; duplicate-card adds a Copy-icon button that pre-fills AddNodeDialog from the source card (name+suffix, nodeType, tskp, razryadLevelId, same parentId via a new child→parent lookup built once per TreeCanvas render) — salary/rbac/schedule fields intentionally stay blank (not on the lightweight tree-node object), an honest partial-clone, not full. **UPGRADED TO LIVE-VERIFIED (2026-07-07)**: port 20806 freed up (the other concurrent session's process ended); full click-through now done — logged in, opened "Отдел qo'shish", clicked the "Ota kartani tanlang" combobox, confirmed the searchable dropdown renders real card data with correct type labels (Ishlab chiqarish/Otdeleniye, TEST-Operator/position, Ma'muriyat/Bo'lim, etc.) sourced live from `GET /api/org-structure/nodes/flat?limit=1000&picker=true` (200 OK). Previously only Q-32 static-verified (typecheck + i18n-leak baseline + 401-not-500 probe) — now fully confirmed end-to-end in the browser. | G3 (`components/hr/org/types.ts`, `components/hr/orgnode/types.ts` + new `nodeTypeLabels.test.ts`): confirmed pure FE fix (no DB CHECK, no Zod enum on `nodeType`) — added otdeleniye/otdel/sektsiya/sektor to both NODE_TYPE_LABELS maps (kept in sync per existing code comment). 3/3 new tests PASS; live rollback-tx dry-run proved all 4 values insert cleanly. G1 (`org-structure.controller.ts` + new `test/org-structure/org-structure.controller.roles.spec.ts`): class-level `@Roles(...)` was gating BOTH reads and writes with the same list (omitted hr/hr_manager, included viewer). Now the class-level list is a READ baseline (hr/hr_manager added, viewer kept); 11 write methods (create/update/delete/move/assign/folder/hr-request/portret) got a narrower per-method `@Roles` override dropping viewer. 14/14 new tests PASS (Reflect metadata inspection), 20/20 full org-structure suite PASS. G2 (`org-mutations.repo.ts` + new `test/org-structure/org-mutations.repo.assign-dual-write.spec.ts`): `assignUser()`/`removeUser()` now dual-write/soft-remove `employee_cards` alongside `employee_org_departments` — live FK confirmed `employee_cards.card_id → org_departments.id` (same id-space as nodeId) and `employee_cards.employee_id → employees.id` (resolved from userId via the employees.user_id/users.employee_id bidirectional bridge already used in razryad-history.repository.ts). Idempotent `ON CONFLICT (employee_id, card_id) WHERE is_active DO NOTHING` (live unique index confirmed). 2/2 new tests PASS; full HR+finance+org-structure suite re-run — 7 pre-existing unrelated failures (payroll.service/cashier-payroll/cashier-hub/drizzle-reports/gl.service/drizzle-hr-vacancies/create-employee.handler), zero org-structure/org-mutations failures. G9/G10 are DECIDE-only (cross-reference Two-Worlds loop, no implementation) — will flag in the final report, not implement. |
| **Accounting-Standards / Finance GL Remediation (F1-F11)** | `docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md` + `docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md` — F1 (purge garbage GL row), F2 (data-quality gate), F3 (unify 2 bespoke writers: payroll, POS), F4 (AR/AP aging → canonical `finance_invoices`), F5 (creator/approver columns), F6 (real CBU feed + currencies reconciliation + POS 1:1 default removed), F7 (SoD — flagged, owner-data blocked), F8 (depreciation → GL), F9 (manual-JE draft→review→post gate), F10 (trial-balance PDF export), F11 item 1 (recurring JE templates) | 11/11 sub-items DONE + committed (F7 is an explicit owner-data flag, not a code gap); F11 items 2-3 (year-end close, FX revaluation) proposed only, not built (explicitly deferred per the owner's own "don't assume all three equally urgent") | `f25e8811`,`3508537d`,`9b04fd3f`,`b42ab33f`,`495c8128`,`f26b6469`,`53ab2edd`,`99f019c2`,`e9495c09`,`064852ad`,`7a7a09a2`,`0461eb5f`,`4ed79e1e`,`ce308e9e` | 2026-07-06 | F11 item 1's commit (`ce308e9e`) was held pending verification, then landed once confirmed the i18n F4 workflow hadn't reached `finance`/`iot` modules yet (live `git status` check right before commit, zero overlap). Now moving into Critical-Correctness EXECUTE, file-by-file, re-checking F4's live progress before each one. Sanity check after every commit: `entries` table 6 rows, ΣDebit=ΣCredit=140,344,273 UZS, unchanged throughout. |

> Observed-but-unclaimed concurrent activity (files seen modified by *someone
> else* during the i18n F2 loop's git-status checks today, not yet
> attributed to a named loop above): `apps/api/src/generated/i18n.generated.ts`,
> `apps/api/src/modules/compatibility/crm-extended.controller.ts`,
> `apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm.repo.ts`,
> `apps/api/src/modules/wms/presentation/wms-gateway-warehouses.controller.ts`,
> `apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts`. None
> of these were touched by the i18n F2 loop — noted here only so whichever
> loop owns them can claim the row above.

---

## Active File/Module Claims

> Add a row when you start a file/module; remove or mark `done` when its
> commit lands. Keep `done` rows for a while (don't delete instantly) so
> other loops can see recent history at a glance — trim once the list gets
> long.

| Loop | File(s) / Module | Status | Commit |
|---|---|---|---|
| i18n F2 | `pages/iot/**` (14 files: 9 components + 5 hooks) | done | `467b3207`,`d156d641`,`05399144` (+ earlier slices) |
| i18n F2 | `pages/WarehouseDailyView*.ts(x)` (4 files) | done | `9f22ec60` |
| i18n F2 | `pages/WarehouseMaterialKits*.ts(x)` (4 files) | done | `d4f06bde` |
| i18n F2 | `pages/PlanningBoard*.ts(x)`, `pages/planning/**`, `pages/usePlanningBoardActions.ts`, `locales/*/production.json` (8 files, workflow lane `planning-board`) | done | `88d608d8` |
| i18n F2 | `pages/BarcodeSystem*.ts(x)`, `pages/barcode/**`, `locales/*/barcode.json` (11 files, workflow lane `barcode`) | done | `bb40788e` |
| i18n F2 | `pages/FaceRecognitionMonitoring*.ts(x)`, `pages/FaceRegistration*.ts(x)`, `locales/*/iot.json` (10 files, workflow lane `face-recognition`) | done | `c8585cf7` |
| i18n F2 | `camera-ai-modern/**`, `locales/*/security.json` (7 files, workflow lane `camera-ai-modern`) | done | `7069d2f5` |
| i18n F2 | `pages/StockReservation.tsx`, `components/wms/reservation/**`, `components/wms/reports/ReportsHeader.tsx`, `locales/*/wms.json` (13 files, workflow lane `wms-reservation`) | done | `0a6c0b6` |
| i18n F2 | `pages/PapkaOrders.tsx`, `pages/PapkaOrdersSections.tsx`, `pages/PapkaOrdersTypes.ts` (narrow toast/status-badge ternary fix, no shared locale file) | done | `891f9401` |
| i18n F2 (verified false-positive, no action) | `components/orders/WizardHeader.tsx` + 6 sibling wizard files | done — confirmed already 3-language-complete | n/a |
| i18n F2 (verified false-positive, no action) | `pos-monitor/i18n/usePosI18n.ts` | done — confirmed already implements a correct 3-state uz→uz-cyr→ru cycle | n/a |
| i18n Part 3 (D3) | `pages/ImpositionCalculator.tsx` | done | `69c24222` |
| i18n Tier 2 F4 | `apps/api/src/modules/**` + `apps/api/src/common/**` + `apps/api/src/lib/**` + `apps/api/src/shared/db/**` + `apps/api/src/i18n/{uz,ru,uz-cyr}/{errors,validation}.json` + `apps/api/src/generated/i18n.generated.ts` | **DONE** (F4-1/F4-2/F4-3 gap-fix, `docs/audit/F4-INDEPENDENT-FULL-VERIFICATION-2026-07-06.md`, applied 2026-07-07) | **42 commits total**: 37 module commits (`cb66c216`..`96d24101`) + `275d32a0` (consolidated locale keys) + `e06718bd` (mm gap-fill — 7 sites the mm agent had actually edited but mis-reported as "already migrated", found via post-workflow `git status`) + `cfa0eb11` (`parse-or-throw.util.ts` gap-fill — `common/utils/` was never enumerated in Step 0, only `common/guards/` was) + `10c5804a` (global-exception.filter.ts special item, 3 sites) + `e7889956` (test-regression fix for `cfa0eb11`) + `49d365bd` (F4-1: 5 uz-locale keys backfilled, see below) | **513 exception-message sites localized total** (501 from the 37-module workflow + 7 mm gap-fill + 1 shared parseOrThrow fix covering 2 call sites + 3 global-exception.filter.ts — corrected from a stale "8 mm gap-fill" count; `e06718bd`'s own subject line says "7 more", matching the diff). Final sweep re-grep: 7 hardcoded-literal sites remain, all verified as legitimate architectural exclusions (2× `lib/objectAcl.ts` + 1× `lib/objectStorage.helpers.ts` — plain non-DI functions; 3× `crm/infrastructure/repositories/drizzle-{deal,lead}.repo.ts` — unreachable TS-exhaustiveness guards; 1× `shared/db/schema.ts:90` — throws at module-load time before any Nest context exists). Zero remaining *reachable* hardcoded `throw new XException('literal')` exception literals. `global-exception.filter.ts` used `I18nContext.current(host)` instead of DI injection since it's manually instantiated (`app.useGlobalFilters(new ...())`, not through Nest's container) — the documented nestjs-i18n pattern for filters outside the DI graph. **F4-1 (HIGH, FIXED `49d365bd`):** independent re-verification found 5 `remaining`-module keys (`stateThresholdNotFound`/`exceptionLogNotFound`/`idealTargetNotFound`/`productionFactCreateFailed`/`reportDefinitionNotFound`) were added to ru+uz-cyr by `275d32a0` but never to uz — since `fallbackLanguage` is uz, primary-language users saw the raw key path. Backfilled with real Uzbek text; all 3 locales now have 424/424 keys aligned. **F4-2 (MEDIUM) — DONE for the assert*() half, BLOCKED-OWNER-DECISION for the DomainError half:**
- **assert*() sites (131/131 DONE, `d8568683`,`ebb9562`,`761975cb`,`b5fecf74`,`bde73b43`,`af23773d`):** every `assertFound`/`assertRequired`/`assertAnyRequired`/`assertValidated`/`assertAuth`/`assertInternal`/`assertDefined` call across 47 controller files (batch 1 erp+qc, batch 2 wms+pos, batch 3 chat+admin+director, batch 4 sd+core+ai+iot+integration+security, batch 5 crm, batch 6 pp+hr+lms+mm+mes+finance) now resolves `await this.i18n.t(...)` before throwing, reusing existing keys where the meaning already matched (~35 keys) and adding ~65 new keys otherwise. All 3 locales re-verified key-aligned after every batch (final: errors.json 462/462/462, validation.json 96/96/96). Caught and fixed 2 real DI regressions pre-commit (adding `I18nService` to a controller broke a `TestingModule` that didn't mock it — same class as F4's own `cfa0eb11`→`e7889956` incident): `OkrController`/`KaizenController` (batch 3), `CameraAiController`/`RaciController` (batch 4) all fixed with `{ provide: I18nService, useValue: mockI18n }`. Also independently verified (exact error-message inspection, not just pass/fail counts) 4 *other* test-suite failures surfaced along the way are pre-existing and unrelated to this work: `test/mes-qc-extended.spec.ts` (missing `CommandBus` mock for `QcDefectsExtendedController`, predates all i18n work per `git show`), `test/mm-wms-extended.spec.ts` (missing `InventoryFreezeService` mock for `WmsCountsController`), `test/e2e/hr-employees.controller.e2e-spec.ts` (missing `HrRatingReader` mock, added by unrelated commit `708b5b60`), `test/finance-accounting.spec.ts` (missing `QueryBus` mock for `FinanceArController`, added by unrelated commit `53ab2edd`) — none reference `I18nService`, none introduced by this batch; flagged here for whoever picks up test-infra debt, not fixed (out of scope).
- **DomainError/MoneyArithmeticError sites (17, BLOCKED-OWNER-DECISION, investigated not implemented):** traced `safeCall()`'s catch block (`common/result.ts:189-201`) — it does `message: err instanceof Error ? err.message : String(err)`, so a `DomainError`'s raw hardcoded message (e.g. `'Advance percent must be between 0 and 100'`, `'Faqat pending so'rov tasdiqlanadi'`) genuinely reaches the HTTP response body via `AppError.message` → `unwrapOrThrow`. This **contradicts** the independent audit's hedge that these "may be intentionally out of scope" — they are user-facing. However, cleanly localizing them is **not a mechanical fix like the assert*() sites**: all 14 `DomainError` + 3 `MoneyArithmeticError` throw sites live in pure domain-layer files (`admin/domain/entities/system-settings.entity.ts`, `auth/domain/value-objects/password.vo.ts`, `director/domain/aggregates/approval-request.aggregate.ts`, `finance/domain/aggregates/budget.aggregate.ts`, `common/money/money.vo.ts`, `shared/domain/{result,value-objects/money}.ts`) with **zero `@nestjs`/`I18nService` imports today** (confirmed via grep) — injecting `I18nService` there would break this codebase's consistently-maintained DDD domain-layer purity. The `code` field (e.g. `'INVALID_STATE'`) can't serve as a translation key either — it's reused across multiple *different* messages within the same file (e.g. `budget.aggregate.ts` throws 4 distinct messages all coded `'INVALID_STATE'`). A correct fix needs a real design decision (e.g. adding a distinct `i18nKey` field to `DomainError` alongside `code`+`message`, translated at the `safeCall()`/HTTP boundary the same way `global-exception.filter.ts` already does via `I18nContext.current()` for out-of-DI contexts) — flagging for the owner rather than guessing at a domain-model change. **Question for owner:** should `DomainError`/`MoneyArithmeticError` gain a dedicated i18n-key field (translated at the Result→HTTP boundary), or is a different mechanism preferred? |
| Accounting-Standards/Finance (F1-F11) | `apps/api/src/modules/finance/**`, `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts`, `apps/api/src/modules/pos/infrastructure/repositories/gl-posting-log.repository.ts`, `apps/api/src/modules/pos/application/services/pos-movement.service.ts`, `apps/api/src/modules/compatibility/asset-management.service.ts`, `apps/api/src/cron/currency-rates.cron.ts`, `apps/api/src/cron/recurring-journal-entries.cron.ts` (F1-F11 item 1, all committed) | done | `f25e8811`..`ce308e9e`, full list in the loop's summary row above |
| Critical-Correctness | `apps/api/src/modules/finance/application/commands/record-payment.handler.ts` + 6 sibling finance repo/dto/controller files (C1: transaction wrap + atomic guarded UPDATE + idempotency key) | done | `a7f0129e` |
| Critical-Correctness | `apps/api/src/modules/iot/**` + FE tablet auth/fetch files (C2: TTL mismatch + refresh endpoint) | done | `f4d17363`,`b29c8bce` |

---

## F4 — Flagged Ambiguous-Translation Items (Owner Decision 2026-07-07)

> **RESOLVED-ACCEPTED — no re-translation.** Owner reviewed all 20 items
> below (flagged during the F4 workflow across 13 modules) and accepted the
> existing translations as-is. Do not re-open or re-translate any of these
> unless the owner raises a specific one again. Listed here in full since
> the F4 final report referenced "full list in this board" before this
> section actually existed — corrected now.

| # | Module | Key(s) | What was flagged |
|---|---|---|---|
| 1 | pos | `errors.receiptQtyOutOfTolerance`, `errors.reservedMaterialOutboundBlocked`, `errors.insufficientWarehouseStock`, `errors.techCardMaterialMismatch` | Business/warehouse-domain phrasing (tolerance-based receipt gate, tech-card/material-mismatch) translated by closest-pattern match to sibling POS/WMS keys — not owner-verified EuroPrint-specific printing/production jargon. |
| 2 | pos | `errors.employeeInsufficientMaterialBalance`, `errors.insufficientAvailableStock` | Both express "not enough stock/balance" with different arg shapes — kept as two distinct keys; possibly over-fragmented. |
| 3 | pos | uz-cyr transliteration | Embedded Latin/English tokens (barcode, EXTERNAL_IN, EXTERNAL_OUT, QC, PO, GL, warehouseId) intentionally left in Latin script per the loanword/acronym transliteration rule. |
| 4 | compatibility | `errors.assetInsufficientStock` | Uses "saldo/сальдо" (accounting balance term) copied verbatim from the original literal, vs. "qoldiq/остаток" used elsewhere in errors.json for warehouse stock — possible asset-ledger-vs-warehouse-stock terminology inconsistency. |
| 5 | hr | `errors.employeeHasNoAssignedCard`, `employeeIdOrUserIdRequiredNotFound`, `employeeNotFoundByUserId` | "karta"/"user_id bo'yicha xodim" translated by pattern-matching closest sibling keys, no pre-existing exact Russian precedent for this HR-card context — sensitive given the project's KARTA-centric org terminology. |
| 6 | hr | `errors.shiftTypeNotFoundWithId` | "Тип смены id={id} не найден" — no prior sibling RU translation of "shift_type" existed to copy from. |
| 7 | ai | `errors.forecastSeriesSaveFailed` | Kept "forecast_series" (DB table name) untranslated across all 3 languages per sibling-key convention. |
| 8 | ai | `errors.toolTestNotFoundWithId`, `examAssignmentFailed` | "Tool Test"/"exam" (HR Capital methodology terms) kept in Latin form in uz-cyr per established sibling-key style. |
| 9 | pp | `errors.ppInvalidTransition`, `errors.ppUnknownStatus` | Kept the machine-readable `PP_INVALID_TRANSITION:`/`PP_UNKNOWN_STATUS:` code prefix OUT of the localized message, translating only the human-readable portion — revisit if the raw prefix is parsed programmatically elsewhere. |
| 10 | pp | `errors.gofraConfigKeyNotFound` | Kept the raw `{key}` interpolation matching internal `gofra_config` table key naming rather than a user-friendly label. |
| 11 | finance | `errors.usePaymentRecordEndpoint` (ru) | "с привязкой к счёту-фактуре и проводкой в GL" — contextual translation of "invoice + GL", not a literal/terser accounting-standard phrasing. |
| 12 | finance | `errors.glDocumentAlreadyReviewedWithStatus`, `errors.glDocumentNotFoundOrReviewed` | Domain term "pending_review" kept as a literal English/snake_case status value, matching sibling keys (e.g. `onlyDraftBudgetApprovable` keeps "draft"). |
| 13 | communication-center | `errors.approveTransactionFailed`, `errors.claudeError`, `errors.documentNumberError` | Wraps a raw technical `{message}` value (possibly already English/untranslated from a downstream Result) inside a localized sentence — matches existing sibling-key convention. |
| 14 | mm | `errors.paymentNotImplementedFiPaymentsPending` | "fi_payments" internal table name kept verbatim (Latin) across all 3 languages, matching similar technical-identifier messages elsewhere. |
| 15 | mm | `errors.onlyDraftOrderDeletable`, `onlyDraftOrderEditable` | "draft" kept verbatim (matching the DB status enum value); RU uses guillemets «черновик» instead of quoting the literal enum token — inconsistent convention vs. quoting style. |
| 16 | qc | `errors.inspectionDeleteFailedWithId` (uz-cyr) | "tekshiruv" → "текширув" transliteration; sibling key `errors.deleteFailed` uses a more generic "Ўчирилмади" — this key kept more specific per-ID wording instead. |
| 17 | general | `errors.fileSizeExceededMax` (ru/uz-cyr) | Used "МБ"/"MB" abbreviation for megabytes; no prior exact business-terminology precedent existed to copy from (though the term itself is unambiguous). |
| 18 | core | `errors.positionHasEmployees` (ru) | "В должности числится {count} сотрудник(ов)" — parenthetical plural suffix instead of full Russian numeral-agreement grammar (1 сотрудник / 2 сотрудника / 5 сотрудников). |
| 19 | bot-gateway | `errors.botSecretTokenNotConfigured` | Kept "secret token" as a Latin loanword (mirroring sibling key `webhookSecretNotConfigured`'s style) rather than translating to "maxfiy token"/"сирли токен". |
| 20 | org-structure | `errors.orgNodeNotFoundWithId` | Original literal said "Node #{id} topilmadi"; translated "Node" → "Karta" per the project's KARTA-centric org vocabulary (memory: org-structure elements are always "KARTA", never "node") instead of a literal transliteration. |

**Status: all 20 → RESOLVED-ACCEPTED, 2026-07-07, owner decision. No code or locale-file changes made as a result — this is a documentation-only closure of the open item.**

---

## Revision Log
- 2026-07-07 — Owner reviewed all 20 F4 flagged ambiguous-translation items
  (see dedicated section above, added in this same revision since the prior
  F4 close-out claimed "full list in this board" when it wasn't actually
  written in yet) and accepted them as-is — **RESOLVED-ACCEPTED, no
  re-translation**. i18n Tier 2 F4 loop remains fully DONE; this closes the
  loop's one remaining open sub-item.
- 2026-07-06 — **i18n Tier 2 F4 loop CLOSED.** 37 module batches (workflow
  `wf_4a49d49b-6fd`/resumed `wbw3773bf`) all committed (`cb66c216`..`96d24101`)
  + consolidated locale-key commit `275d32a0`. Post-workflow independent
  `git status` sweep found 2 categories of edits that existed in the working
  tree but were never committed anywhere: (1) 3 mm-module files
  (`mm-vendors-pr.service.ts`, `mm-purchase-orders.controller.ts`,
  `purchase.service.ts`) the mm agent had genuinely edited but described in
  its own report as "already migrated before this pass" — verified all
  referenced locale keys existed and were correct, committed as `e06718bd`;
  (2) `common/utils/parse-or-throw.util.ts` + its 2 callers
  (`strategic.controller.ts`, `iot-camera.controller.ts`) — this directory
  was never enumerated in Step 0 (only `common/guards/` was), committed as
  `cfa0eb11`. Then executed the directive's separate global-exception.filter.ts
  special item (`10c5804a`): localized its 3 hardcoded messages using
  `I18nContext.current(host)` instead of DI injection since the filter is
  registered via `app.useGlobalFilters(new GlobalExceptionFilter())` (manual
  instantiation, bypasses Nest's container) — the nestjs-i18n-documented
  pattern for exactly this case; falls back to the original English string
  if no i18n context is available, so it can never throw where the old code
  couldn't. Had to update the existing filter's unit-test mock `ArgumentsHost`
  to implement `getType()` (real Nest hosts always do; the mock didn't, since
  it predated this dependency) — all 7 pre-existing tests still pass otherwise.
  Final re-grep sweep: 7 hardcoded-exception-literal sites remain repo-wide,
  all verified as legitimate non-fixable-without-a-refactor exclusions (listed
  in the loop's summary row above) — zero *reachable* hardcoded exception
  literals left. 513 total sites localized across the whole loop. Full
  backend suite re-run after all commits (598s): 68 failed / 3 skipped / 739
  passed suites, 807 of 810 total — same 68-failed-suite count as the
  workflow's own established baseline (all DATABASE_URL-env or pre-existing
  DI-wiring gaps, none touching i18n). One genuine regression was caught by
  this run and fixed on the spot: the `cfa0eb11` gap-fill added I18nService
  to `strategic.controller.ts`'s constructor but never updated its test
  (`test/misc-extended.spec.ts`), crashing that whole suite — fixed in
  `e7889956` by adding the same `{ provide: I18nService, useValue: mockI18n }`
  mock the same file already uses for `IotCameraController`; confirmed the
  suite's remaining 2 failures (OkrController, CoordinationController) are
  unrelated pre-existing bugs untouched by any F4 commit. Also noted
  but deliberately left untouched: `apps/api/src/modules/compatibility/crm-extended.controller.ts`
  has an unrelated uncommitted change (removing duplicate `@Post()` route
  aliases) sitting in the working tree — not an i18n change, not part of any
  F4 batch, owner unknown; flagging here per this board's own
  "observed-but-unclaimed" convention rather than committing something
  outside this loop's scope.

- 2026-07-06 -- Consolidated-status Workflow ran per owner directive ("Consolidate
  Everything into One Master Status Board"): read every tracking doc in
  `docs/audit/` (Magic-Numbers M1-M11 v1+v2, i18n F1-F10, Design-QA D1-D5,
  B14/Owner-Decisions, Two-Worlds Remediation A/B/C/D-series, VISION-3340
  backlog 226 open items, Governance Check A/B-series, Critical-Correctness
  C1-C9, Design-System-Unification) and cross-referenced 1201 rows across 10
  source docs for overlaps. Full consolidated table appended below as its own
  section (535 lines -- too granular for the quick pre-edit check above, kept
  separate so the Active Loops/Claims tables above stay fast to scan). Notable
  cross-check the synthesis flagged: Two-Worlds A1/A18/C2/C3 (AR/AP legacy-vs-
  canonical invoices) are marked BLOCKED-OWNER but tagged "LIKELY ALREADY
  RESOLVED by f26b6469" -- the Accounting-Standards F4 commit already unified
  AR/AP aging onto `finance_invoices`; whichever loop picks these up should
  verify against live DB before re-doing the work, not re-run it blind.

- 2026-07-06 — File created by the i18n F2 / Combined Fix Loop (no prior
  version existed; no established format found to mirror, so this loop
  authored a minimal one). Seeded with i18n F2's own progress; other loops'
  rows left as placeholders for them to fill in.
- 2026-07-06 — i18n F2 loop: all 5 parallel workflow lanes
  (planning-board/barcode/face-recognition/camera-ai-modern/wms-reservation)
  completed, independently reviewed (tsc --noEmit 0 errors repo-wide + JSON
  validation + grep sweep), and committed one cluster per commit. Plus
  PapkaOrders narrow fix and D3 (ImpositionCalculator) done directly.
  Part 2 F2's file-level scope is now fully closed. Also noted: a separate
  concurrent session touched `apps/api/src/modules/finance/**` and
  `apps/api/src/modules/hr/**` repo/controller files during this window
  (observed via git status, not attributed to a named loop above, already
  gone from git status by the time of this update — presumably committed
  by its own session).
- 2026-07-06 — Accounting-Standards/Finance loop (F1-F11, the session
  referenced in the note directly above) claims its row: 10 commits
  landed (`f25e8811` .. `4ed79e1e`, full list in the summary row), F7
  flagged for owner data, F11 items 2-3 proposed-only. Found this board
  already existed with an active i18n-F4 claim on all of
  `apps/api/src/modules/**` — one already-written, tested F11 commit
  (recurring-JE templates) is being HELD rather than raced against that
  claim; a new Critical-Correctness loop (C1-C4) is also blocked for the
  same reason since all 4 CRITICAL items live under `apps/api/src/modules/**`.
  Will resume both the moment the i18n F4 row above is marked done.

---

# EuroPrint ERP — Consolidated Workstream Status

| Stream | Sub-item | Status | Last commit hash | % complete | Blocking what else |
|---|---|---|---|---|---|
| **MAGIC-NUMBERS (M1-M11)** | | | | | |
| _MN-5 note (2026-07-07):_ | _this table's "Finding #N" numbering is the older `MAGIC-NUMBERS-AUDIT-2026-07-05.md` (v1) scheme; the M2-M11 numbering used in commit messages/the top-row summary above is `MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`'s renumbering of the same underlying items. Rows below are corrected only where a direct 1:1 content match to already-shipped work exists; unmatched rows remain as this table's own original claim._ | | | | |
| Magic-Numbers | DOC-v1 overall | IN-PROGRESS | `5726e00a` | ~7% | 2 of 30 findings fixed (#4, #5 below); 28 pending owner prioritization |
| Magic-Numbers | Finding #1: Payroll FE 0.10 vs BE 0.12 tax drift | QUEUED-NOT-STARTED | n/a | 0% | Payroll deduction validation correctness |
| Magic-Numbers | Finding #2: GL balance tolerance 0.01 hardcoded (4 files) | QUEUED-NOT-STARTED | n/a | 0% | Ledger integrity consistency |
| Magic-Numbers | Finding #3: LeaveType enum drift vs leave_types table | QUEUED-NOT-STARTED | n/a | 0% | Leave balance/approval correctness |
| Magic-Numbers | Finding #4: Quarantine routing literal warehouse codes | **DONE** | `5726e00a` | 100% | Resolved via `getConfigString('quarantine_hold_warehouse_code'\|'quarantine_source_warehouse_code', ...)`, settings-table-tunable, defaults unchanged (MN-1) |
| Magic-Numbers | Finding #5: QC lot auto-fail defect ratio 0.05 | **DONE** | `5726e00a` | 100% | Resolved via `getConfigNumber('qc_lot_defect_fail_ratio', 0.05)` (MN-1) |
| Magic-Numbers | Finding #6: AR/AP aging buckets 90/60/30 duplicated | QUEUED-NOT-STARTED | n/a | 0% | Overdue-money escalation consistency |
| Magic-Numbers | Finding #7: Order approval 4 fixed stages hardcoded | QUEUED-NOT-STARTED | n/a | 0% | Reconfigurable approval chain |
| Magic-Numbers | Finding #8: Fraud/VIP thresholds 50M/100M/50M | QUEUED-NOT-STARTED | n/a | 0% | Owner-tunable fraud/approval gates |
| Magic-Numbers | Finding #9: MovementTypeCode drift vs pos_movement_types | QUEUED-NOT-STARTED | n/a | 0% | POS movement taxonomy correctness |
| Magic-Numbers | Finding #10: Role-name case drift, dead @Roles (~60 files) | DONE (minority enum retired) | `5b68d53b` | 100% for the `auth/enums/role.enum.ts` fork; ~759-literal broader cleanup still QUEUED-NOT-STARTED (separate, lower-value) | **2026-07-07 correction (independent verification caught an over-escalation):** this row previously blocked on an owner decision assuming a ~70-file blast radius. A fresh, independent audit (no stake in the prior framing) found the minority `auth/enums/role.enum.ts` fork had only **4 real importers** (12 files counting its `auth/types/role.ts` barrel + 9 downstream AI/SD/CRM controllers), not ~70 — and, critically, found this wasn't cost-free tech debt: **`Role.WAREHOUSE`** (an orphaned value existing ONLY in the minority enum) was gating 2 live SD golden-thread endpoints (`PATCH /sd/orders/:id/shipping/status`, `PATCH /sd/orders/:id/materials/:reqId/status`) plus `AiReservationController`'s whole class, and since it never matches any real user's role (canonical is `warehouse_keeper`), **real warehouse staff were silently locked out of all of them** — a genuine live bug, not merely inconsistent naming. Fixed: all 12 files now import the canonical lowercase `Role` from `roles.constants.ts`; `Role.WAREHOUSE`→`Role.WAREHOUSE_KEEPER` (3 sites); redundant dead `Role.ADMIN` dropped (2 sites, `Role.SUPER_ADMIN` already covered it); the now-fully-dead `role.enum.ts` + `types/role.ts` barrel deleted. 2 new Reflect-metadata tests lock in both the dead-value removal and the real-value presence; full sd/crm/ai/auth suites re-run clean (pre-existing unrelated failures confirmed via git log). The BROADER cleanup (~10 duplicate local `enum Role{}` re-declarations + ~759 raw uppercase string literals in `@Roles('X', ...)` calls that import neither enum) remains real code-hygiene debt, confirmed still cosmetic-only (no more live bugs found in that broader set during this pass) — left QUEUED-NOT-STARTED as a separate, genuinely-optional follow-up, not re-escalated to BLOCKED. |
| Magic-Numbers | Finding #11: Churn cutoffs 0.7/0.4 drift | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #12: AI neutral fallback score cluster | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #13: RFM segment cut-points | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #14: ABC-XYZ variability class 0.25/0.50 | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #15: Tardiness gate 60min vs grace 15min conflict | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #16: Payroll confidence values as data | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #17: CRM LOST/WON marker string arrays | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #18: Downtime reason taxonomy diverged, table empty | QUEUED-NOT-STARTED | n/a | 0% | MES/OEE downtime reporting consistency |
| Magic-Numbers | Finding #19: Defect/QC disposition taxonomy | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #20: Material category + UOM lists | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #21: Priority/status taxonomy GoalsKPITypes | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #22: Automation-rule taxonomy RobotsDialog | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #23: Sales commission + bulk-discount rates | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #24: MM 3-way-match tolerance 0.02 | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #25: HR discipline escalation thresholds 3/5/8 | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #26: Learning-curve fallback t1/rate | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #27: Heuristic coefficients (*1.1 etc.) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #28: Trial-expiry alert 80% | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #29: Conversion/target ratios | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | Finding #30: Approver-strategy keys (acceptable pattern) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | DOC-v2 overall (~578 new findings) | IN-PROGRESS | n/a | 15% | All v2 findings unfixed (read-only) |
| Magic-Numbers | V2 Module: HR (27 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Finance/FI (18 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: POS/Queue/Order-Workflow (13 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: CRM/Marketing (16 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: WMS/Logistics (19 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: QC/MM (14 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Director/Kanban (10 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: PP/MES (9 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: SD/Ecommerce (27 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: AI/AI-Agents/Agents/Aisha (124 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: IoT/Camera/Design (19 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Org-Structure/Auth/Security/Admin (19 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Compatibility/Integration (26 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: LMS/Notif/Comm-Center/Chat/Bot-GW (21 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Remaining/MRO/ERP/General/Core/Misc (18 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: Common/Shared/Infra/Cron/Config (29 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE pages A-G (27 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE pages H-P (30 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE pages Q-Z (23 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE pages subdirectories (35 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE components (33 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Module: FE pos-monitor/lib/hooks/constants/routes (21 findings) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Magic-Numbers | V2 Updated Top-10 ranking (combined) | QUEUED-NOT-STARTED | n/a | 0% | Owner prioritization decision |
| Magic-Numbers | V2 Duplication clusters (11) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| **I18N FIX LOOP (F1-F10)** | | | | | |
| i18n | F1 — Centralize number/date/currency formatting | **PLAN DONE, BLOCKED-OWNER-CONFIRMATION** | n/a | 0% | All Tier 1/2/3 subsequent items — `I18N-FIX-LOOP-2026-07-05.md`'s OWN execution model requires owner confirmation before every EXECUTE step (explicitly distinct from the continuous autonomous-loop model used elsewhere), so this is correctly not auto-executed. PLAN (2026-07-07): re-verified call sites — `lib/format.ts:48,59,70,80,109` (5, confirmed still hardcoded `"uz-UZ"`), `lib/sd-helpers.ts:7` (1, confirmed), `components/director/MetricCard.tsx:57` (**already fixed by an earlier session, no longer hardcoded — audit was stale on this one site**), `pos-monitor/pages/*` (**21 files, not ~15** — re-grep found more than the audit's estimate). Locale-code question resolved: `uz-Cyrl-UZ`/`uz-Cyrl` are valid, `Intl`-recognized BCP-47 identifiers (verified via Node's `Intl.NumberFormat` — script subtag `Cyrl` = ISO 15924 Cyrillic), so no fallback/placeholder locale string is needed for the uz-Cyrillic case. **Question for owner**: proceed to EXECUTE (map each of the 27 call sites' hardcoded `"uz-UZ"` to the currently-selected language → `uz-UZ`/`ru-RU`/`uz-Cyrl-UZ`), and separately, the compatibility-requirement's DB question (base-column + `_ru` sibling convention — does Cyrillic get a 3rd `_cyrl` sibling column, or is this the point to introduce a proper translations table)? |
| i18n | Tier 1 remaining items (unenumerated) | QUEUED-NOT-STARTED | n/a | 0% | Cannot start until owner enumerates |
| i18n | Whole I18N Fix Loop workstream | QUEUED-NOT-STARTED | n/a | 0% | Depends on VISION-3340/Residual/IoT-Kiosk loops reaching 100% |
| i18n | A1 — Library/framework choice | DONE | n/a | 100% | n/a |
| i18n | A2 — Translation file coverage | IN-PROGRESS | n/a | 70% | n/a |
| i18n | A3 — Language switcher | IN-PROGRESS | n/a | 60% | Server-side localization of notifications/PDFs (C10, C11) |
| i18n | A4 — Uzbek-Cyrillic specifically | IN-PROGRESS | n/a | 35% | n/a |
| i18n | B5 — Hardcoded strings bypassing i18n | IN-PROGRESS | n/a | UNKNOWN | n/a |
| i18n | B6 — Per-module 2-arg helper bug | IN-PROGRESS | n/a | UNKNOWN | n/a |
| i18n | B7 — Date/number/currency formatting locale-frozen | QUEUED-NOT-STARTED | n/a | 0% | Every screen for ru/uz-cyr users (Top-10 #1); same item as F1 |
| i18n | B8 — Cyrillic/script rendering | DONE | n/a | 100% | n/a |
| i18n | C9 — API error/validation messages | DONE | `10c5804a` | 100% | n/a |
| i18n | C10 — Notification content | IN-PROGRESS | n/a | UNKNOWN | n/a |
| i18n | C11 — Generated documents/PDFs | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | D12 — Multi-language content storage (DB, no _cyrl) | IN-PROGRESS | n/a | UNKNOWN | Structural ceiling on uz-cyr; owner architecture decision needed |
| i18n | D13 — User language preference column | IN-PROGRESS | n/a | UNKNOWN | n/a |
| i18n | Top-10 gap #1 (uz-UZ locale lock, format.ts) | QUEUED-NOT-STARTED | n/a | 0% | Every screen for ru+uz-cyr users; = F1/B7 |
| i18n | Top-10 gap #2 (DB no _cyrl columns) | QUEUED-NOT-STARTED | n/a | 0% | All uz-Cyrillic data rendering |
| i18n | Top-10 gap #3 (2-arg helper ~40 files, IoT/WMS) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Top-10 gap #4 (PDFs hardcoded Uzbek) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Top-10 gap #5 (cron/Telegram notifications hardcoded Uzbek) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Top-10 gap #6 (Zod + ~470 backend throws not localized) | DONE | `10c5804a` | 100% | n/a |
| i18n | Top-10 gap #7 (language pref only localStorage; employees no lang col) | QUEUED-NOT-STARTED | n/a | 0% | Server-side localization |
| i18n | Top-10 gap #8 (~29 FE pages hardcoded Uzbek JSX) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Top-10 gap #9 (duplicate language+lang columns) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Top-10 gap #10 (key-set drift ru~25k vs uz~16.9k) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| i18n | Structural verdict — uz-Cyrillic (code/wiring) | UNKNOWN | n/a | 35% | n/a |
| i18n | Structural verdict — Russian (content/translation) | UNKNOWN | n/a | 65% | n/a |
| i18n | Per-language score: uz-Latin | DONE | n/a | 92% | n/a |
| i18n | Per-language score: Russian | IN-PROGRESS | n/a | 65% | n/a |
| i18n | Per-language score: Uzbek-Cyrillic | IN-PROGRESS | n/a | 35% | n/a |
| **DESIGN-QA (D1-D5)** | | | | | |
| Design-QA | HR: ~41/48 pages missing EPPageHeader | QUEUED-NOT-STARTED | n/a | 0% | HR header consistency cleanup |
| Design-QA | HR: page-header.tsx no mobile stacking | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: AppShellModern double padding (uncertain) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: RecruitingKanban legacy tokens + nested scroll | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: InspectionPage hardcoded light colors break dark mode | **DONE** | `949490db` | 100% | title/subtitle -> text-foreground/muted-foreground, anomaly alert box -> bg-destructive/10 border-destructive/40. Live-verified in browser dark mode (screenshot confirms readable white text). |
| Design-QA | HR: HRBrandPage/CandidateReport hardcoded text-gray-900 | **DONE** | `949490db` | 100% | HRBrandPage: full token swap. CandidateReport: this is an intentional paper-styled printable report card (`print:border-black`, `border-gray-800`) — only the specifically-flagged title fixed via `dark:text-foreground` variant, preserving the light "paper" look rather than restyling the whole print-card. |
| Design-QA | HR: HROffboarding duplicate sm: breakpoint | **NOT REPRODUCIBLE** | n/a | n/a | Re-checked live code at the cited line — already correctly reads `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` (no duplicate `sm:`). Audit finding was stale; no action taken. |
| Design-QA | HR: Compact-header family no flex-wrap | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: HRMap fixed height map (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | HR: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | Production: DesignOrderDetail gradient never renders | DONE | `882f476c` | 100% | Added missing `bg-gradient-to-br` base class at both flagged locations (from-/via-/to- are no-ops without it); color stops unchanged. Typecheck clean; no live design_orders row exists to visually exercise the loaded-state branch, verified via diff+syntax review instead (Q-32 static fallback). |
| Design-QA | Production: DesignOrderDetail min-h-screen scroll-trap | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: ImpositionCalculator duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: ImpositionCalculator raw palette colors | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: IoT tablet panels min-h-screen (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Production: PapkaOrders/DesignOrders loading spinner min-h-screen | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: TechPPExtendedSections bogus band-y-4 class | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: MESExtended padding inconsistency | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: DedicatedPageShell double padding | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Production: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | Finance/Director: FinanceBreakEven duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: FinanceVariance duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: FinanceDashboardTabs duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: PricingTiers duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: IdealRasmPage duplicate sm: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: AgentsHub duplicate lg: grid bug | NOT REPRODUCIBLE | n/a | 100% | Re-checked live code: line already reads `grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7` (no duplicate `lg:`) — a clean progressive ladder matching this file's own other grids (lines 124, 160). Already fixed by an earlier, uncredited session; audit was stale. Repo-wide regex scan confirmed zero remaining duplicate-breakpoint grid classes anywhere in this file. |
| Design-QA | Finance/Director: DirectorExtended missing h-full under overflow-hidden | DONE | `4db11567` | 100% | 6 director routes. Confirmed real (not a false positive) — every other page using the same Tabs/flex-1/overflow-hidden pattern (FinanceExtended/MMExtended/QCExtended/MROExtended/SaaSExtended/TechPPExtended/SecurityExtended/IoTExtended/LMSExtended) sets h-full; DirectorExtended was the sole outlier. Live-verified in browser: header now stays pinned, tab body scrolls independently. |
| Design-QA | Finance/Director: agent dashboards hand-rolled KpiBox | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: KpiThresholdConfig etc. custom header | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: FinanceExtendedTabsExtra placeholders (allowed) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Finance/Director: kanban DashboardPanel bounded scroll (acceptable) | DONE | n/a | 100% | n/a |
| Design-QA | Finance/Director: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | CRM: SDSalesOrders fixed w-80 sidebar no mobile stacking | DONE | `6ddee48f` | 100% | flex-col below lg:, flex-row at 1024px+; list panel w-full when stacked, w-80 side-by-side. Live-verified at 900px (stacks) and desktop (side-by-side, unchanged). |
| Design-QA | CRM: CRMWorkspace 7-day calendar collapses to 2 columns | DONE | `6383ae79` | 100% | Removed the responsive breakpoint entirely — cell content (2-char day labels, truncated event chips) fits at any width, so grid-cols-7 now applies unconditionally. Live-verified at 900px: clean 7-column render. |
| Design-QA | CRM: SecurityExtended TabsList overflow no wrap | DONE | `503ca93f` | 100% | Matched the ERPProduction.tsx pattern (flex w-full overflow-x-auto + shrink-0 whitespace-nowrap per trigger) rather than a grid-based tab convention, since SecurityExtended uses an underline-style tab design. Live-verified via computed style: overflowX=auto, scrollWidth(1043)>clientWidth(944) — tab strip scrolls instead of clipping. |
| Design-QA | CRM: SDEuroprint inert sticky nav (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | CRM: Camera module hand-rolled KPI cards | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | CRM: Camera AI/Live-Monitoring tight max-h scroll (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | CRM: Camera feed ScrollAreas fixed heights (not a defect) | DONE | n/a | 100% | n/a |
| Design-QA | CRM: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | WMS/IoT: WarehouseMaterial360 7-col KPI cramped (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | WMS/IoT: PosLayout topbar no flex-wrap (portrait) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | WMS/IoT: MMPurchaseOrders md:grid-cols-6 tight | UNKNOWN | n/a | 0% | n/a |
| Design-QA | WMS/IoT: pos-monitor separate design system (by design) | DONE | n/a | 100% | n/a |
| Design-QA | WMS/IoT: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | Admin/LMS: AppShellModern double padding app-wide (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Admin/LMS: Extended/Hub family triple nested padding | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Admin/LMS: ApprovalHub/SaaSExtended inset border-b header | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Admin/LMS: ~54/76 pages missing EPPageHeader | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Admin/LMS: AgentsHub duplicate lg:grid-cols (dup of Finance finding) | NOT REPRODUCIBLE | n/a | 100% | Same finding as the Finance/Director row above — see that row's note. Already fixed by an earlier session; audit was stale. |
| Design-QA | Admin/LMS: NotificationSettings cramped 5-field grid (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Admin/LMS: TelegramBotAdmin bounded scroll (likely intentional) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Admin/LMS: CameraAIAnalytics bounded scroll (likely intentional) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Admin/LMS: EuroprintControlPage bounded scroll (likely intentional) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Admin/LMS: StubRoutes confirmed NOT stubs | DONE | n/a | 100% | n/a |
| Design-QA | Admin/LMS: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | Root cause #1: Duplicate-breakpoint Tailwind grid bug (codebase-wide) | QUEUED-NOT-STARTED | n/a | 0% | Tablet/laptop cramped KPI grids app-wide |
| Design-QA | Root cause #2: App-shell double/triple padding (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Root cause #3: EPPageHeader non-adoption (~54-95 pages) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Live-browser screenshot verification (0% coverage) | QUEUED-NOT-STARTED | n/a | 0% | Visual confirmation of all findings |
| Design-QA | Overall audit deliverable (this doc) | DONE | n/a | 100% | Separate fix task (not started) |
| **B14 / OWNER DECISIONS** | | | | | |
| B14-Owner | G1 (mini-app approval gate) | DONE | d77062b1 | 100% | n/a |
| B14-Owner | G2 (save360Feedback Err fix) | DONE | f136f39f | 100% | n/a |
| B14-Owner | R1 (remove dead undo-toast) | DONE | 91c60c91 | 100% | n/a |
| B14-Owner | R2 (camera-reports download fix) | DONE | dd4db385 | 100% | n/a |
| B14-Owner | R3 (postDocument tests fix) | DONE | d1091345 | 100% | n/a |
| B14-Owner | R4 (Smtp/Sms adapters return Err) | DONE | 710fe1ac | 100% | n/a |
| B14-Owner | R5 (telegram-announce event) | DONE | 516e03ab | 100% | n/a |
| B14-Owner | R6 (unwrapOrInternal 501) | DONE | 33e51401 | 100% | n/a |
| B14-Owner | G3 (FK indexes org_department_id etc.) | DONE | 4dd08593 | 100% | n/a |
| B14-Owner | R7 (IoT/MRO sensor data — no data to act on) | BLOCKED-OWNER | n/a | 100% | IoT anomaly/MRO trend features can't be exercised e2e |
| B14-Owner | R8 (source text lost, unresolvable) | BLOCKED-OWNER | n/a | 100% | n/a |
| B14-Owner | G4 (dup-check + NOT NULL constraints) | DONE | 9eba25a6 | 100% | n/a |
| B14-Owner | G4-note (security-classifier sign-off) | DONE | n/a | 100% | n/a |
| B14-Owner | A1 (repo-naming 570+ files) | QUEUED-NOT-STARTED | n/a | 0% | Priority decision needed |
| B14-Owner | A2 (findAll pagination limit) | DONE | c06d6cda | 100% | n/a |
| B14-Owner | A3 (N+1 queries, partial) | IN-PROGRESS | n/a | 40% | Multi-file scope beyond single-file limit |
| B14-Owner | A3-follow-up (N+1 batch-prefetch) | DONE | a05938c8 | 100% | n/a |
| B14-Owner | A4 (recalculateProfitability moved to service) | DONE | 3857bfcb | 100% | n/a |
| B14-Owner | A5 (drizzle-lead.repo Err fix) | DONE | 9f534593 | 100% | n/a |
| B14-Owner | A7 (gofra-conversion role restriction) | DONE | cd718a03 | 100% | n/a |
| B14-Owner | A8 (design.controller canonical + status fix) | DONE | 933ae75b | 100% | n/a |
| B14-Owner | B9 (GEN-% fallback code retry on 23505) | DONE | 19a2e7e8 | 100% | n/a |
| B14-Owner | B10 (MM VIEW consolidation, slice 1) | IN-PROGRESS | e4a58095 | 30% | Owner decision on VIEW-ify materials/products/raw_materials |
| B14-Owner | B13 (currency float fix, slice 1) | IN-PROGRESS | 3847f3a9 | 20% | UOM standardization (72 tables/74 cols) needs policy + batch execution |
| B14-Owner | B14 (created_by/updated_by wiring, overall) | IN-PROGRESS | 7da3a714 | 85% | ~18 more write-sites remain (mechanical) |
| B14-Owner | B14 slice 1 (CRM quick-deal) | DONE | ce205fd5 | 100% | n/a |
| B14-Owner | B14 slice 2 (CRM lead created_by) | DONE | 5ba0797a | 100% | n/a |
| B14-Owner | B14 slice 3 (SD customers) | DONE | 88bb40f4 | 100% | n/a |
| B14-Owner | B14 slice 4 (SD quotation->order) | DONE | 8cf22074 | 100% | n/a |
| B14-Owner | B14 slice 5 (warehouse_transactions) | DONE | da8c394d | 100% | n/a |
| B14-Owner | B14 slice 6 (material_cards, 4-layer) | DONE | e46273a5 | 100% | n/a |
| B14-Owner | B14 slice 7 (production_orders, pp-planning) | DONE | 7230e1c9 | 100% | n/a |
| B14-Owner | B14 slice 8 (qc_reclamations) | DONE | 74725793 | 100% | n/a |
| B14-Owner | B14 slice 9 (salary_change_log) | DONE | 7da3a714 | 100% | n/a |
| B14-Owner | B14 slice 10 (sales_orders, lead->order) | DONE | 42056eb4 | 100% | n/a |
| B14-Owner | B15 (vysotskiy_grade_requests, stashed) | BLOCKED-OWNER | n/a | 70% | Owner must approve new table before commit |
| B14-Owner | IoT Kiosk auth-guard (17 routes) | BLOCKED-OWNER | n/a | 0% | All 17 tablet routes always 401 until owner approves @Public+TabletTokenGuard |
| B14-Owner | Ombor tozalash (warehouse dedup, ~21 org_departments pairs) | BLOCKED-OWNER | n/a | 0% | Owner must choose canonical org_departments row |
| B14-Owner | VISION-3340 STILL-OPEN (226 items) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| B14-Owner | IoT Kiosk-Screen (full 20-requirement build) | QUEUED-NOT-STARTED | n/a | 0% | Depends on IoT Kiosk auth-guard decision |
| B14-Owner | i18n fix-loop (Cyrillic columns architecture decision) | BLOCKED-OWNER | 836cc826 | 5% | Architecture decision (3rd _cyrl column vs translation table) not yet formally asked |
| **TWO-WORLDS REMEDIATION** | | | | | |
| Two-Worlds | A1 Invoices (invoices vs finance_invoices) | BLOCKED-OWNER | d6286993 | 0% | AR aging accuracy, AP payable visibility — LIKELY ALREADY RESOLVED by f26b6469, verify before re-doing |
| Two-Worlds | A2 GL/ledger (entries vs gl_journal_entries etc.) | DONE | n/a | 100% | n/a |
| Two-Worlds | A3 Stock levels (warehouse_stock vs stocks/current_stock) | DONE | n/a | 100% | See A17 |
| Two-Worlds | A4 Materials (material_cards vs raw_materials/products/etc.) | DONE | n/a | 100% | n/a |
| Two-Worlds | A5 Sales orders (sales_orders vs orders/etc.) | DONE | ce8d72c4 | 100% | n/a |
| Two-Worlds | A6 Payments (payments/finance_payments/etc.) | QUEUED-NOT-STARTED | n/a | 0% | AR reconciliation once payments flow |
| Two-Worlds | A7 Position/job-card three-world | IN-PROGRESS | d89c87de | 40% | D3 per-controller role enums keyed off position tiers |
| Two-Worlds | A8 Users vs employees | DONE | n/a | 100% | n/a |
| Two-Worlds | A9 Payroll (payroll_period_record vs payroll_rows/salary_history) | BLOCKED-OWNER | n/a | 0% | Payroll reporting accuracy |
| Two-Worlds | A10 FX rates (currencies.exchange_rate vs exchange_rates.rate) | QUEUED-NOT-STARTED | n/a | 0% | FX valuation consistency |
| Two-Worlds | A11 Vendor rating (mm_vendor_ratings vs vendor_performance) | IN-PROGRESS | c2b5e32d | 60% | vendor_rating_unified view accuracy |
| Two-Worlds | A12 Customers (sd_customers vs clients/etc.) | DONE | 77c19e37 | 100% | n/a |
| Two-Worlds | A13 Leads (crm_leads vs marketing_leads) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | A14 Deals (deals vs crm_deals view) | DONE | n/a | 100% | n/a |
| Two-Worlds | A15 Attendance (summary vs attendance_records raw) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | A16 sales_orders Drizzle dup (serial vs integer) | DONE | n/a | 100% | n/a |
| Two-Worlds | A17 warehouse_stock Drizzle dup (varchar vs integer FK) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | A18 Invoice views wrong base (fi_invoices/sd_invoices/crm_invoices) | BLOCKED-OWNER | n/a | 0% | AR/AP aging accuracy — LIKELY ALREADY RESOLVED by f26b6469, verify before re-doing |
| Two-Worlds | B1 GL post engine | DONE | n/a | 100% | n/a |
| Two-Worlds | B2 Payroll -> GL dual writer | QUEUED-NOT-STARTED | n/a | 0% | GL validation/period-lock integrity |
| Two-Worlds | B3 POS movement -> GL dual writer | IN-PROGRESS | f846a393 | 50% | GL reconciliation |
| Two-Worlds | B4 GL entry writer orphan (dead code) | DONE | n/a | 100% | n/a |
| Two-Worlds | B5 Payment write (finance_payments/payments/sd_payments) | QUEUED-NOT-STARTED | n/a | 0% | AR reconciliation |
| Two-Worlds | B6 Invoice create (finance_invoices/sd_invoices/shim) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | B7 Recruitment stage-change event name drift | QUEUED-NOT-STARTED | n/a | 0% | Recruitment Telegram notification |
| Two-Worlds | B8 Legacy POS vs POS/WMS ops | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | B9 warehouse prefix collision (compat vs wms) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | B10 Material master create (mm/wms/compat) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | B11 Sales-order create (sd/erp/saas compat) | QUEUED-NOT-STARTED | n/a | 0% | Tied to C1 |
| Two-Worlds | B12 Surviving /v2 route (pos-printer-config-v2) | QUEUED-NOT-STARTED | 44038eb9 | 0% | n/a |
| Two-Worlds | C1 Sales-order list/create read/write asymmetry | QUEUED-NOT-STARTED | n/a | 0% | Order visibility across screens |
| Two-Worlds | C2 Receivables aging (ar_aging snapshot vs live fi_invoices) | QUEUED-NOT-STARTED | n/a | 0% | AR totals accuracy — LIKELY ALREADY RESOLVED by f26b6469, verify before re-doing |
| Two-Worlds | C3 Debtor amounts three-way | QUEUED-NOT-STARTED | n/a | 0% | Debtor reporting accuracy — LIKELY ALREADY RESOLVED by f26b6469, verify before re-doing |
| Two-Worlds | C4 Warehouse/stock dashboard namespace split | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | C5 Stock hook namespaces (use-wms.ts) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | C6 Vendor view (mm vs vendor-performance) | QUEUED-NOT-STARTED | n/a | 0% | Tied to A11 |
| Two-Worlds | C7 Executive revenue/health KPI (4 aggregators) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | C8 Weekly plan duplicate page | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | C9 Mentorship duplicate page | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | D1 Role enum casing (lowercase vs UPPERCASE) | IN-PROGRESS | n/a | 30% | n/a |
| Two-Worlds | D2 Role enum 3rd/4th catalog | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | D3 Per-controller local enum Role (27 dups) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | D4 FE role lists (4-5 catalogs) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | D5 Design status 3-way | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | D6 POS movement types (consistent, not a defect) | DONE | n/a | 100% | n/a |
| Two-Worlds | D7 QC/reclamation status | DONE | f5428125 | 100% | n/a |
| Two-Worlds | D8 Lead/in-transit/quarantine status | DONE | n/a | 100% | n/a |
| Two-Worlds | Root-cause cluster 1 — invoices canonical migration | QUEUED-NOT-STARTED | d6286993 | 0% | A1,A18,C2,C3 — LIKELY ALREADY RESOLVED by f26b6469, verify before re-doing |
| Two-Worlds | Root-cause cluster 2 — writers bypassing GL/payment table | QUEUED-NOT-STARTED | n/a | 0% | B2,B3,B4,B5,A6 |
| Two-Worlds | Root-cause cluster 3 — KARTA-centric org unification | BLOCKED-OWNER-DATA (G9) + BLOCKED-OWNER-DECISION (G10) | d89c87de | 40% | A7. Subsumes Org-Card G9 (single-tree invariant) and G10 (single canonical card table) for tracking purposes — re-verified (2026-07-06) these are the SAME unimplemented consolidation under a different name; d89c87de was purely additive (new columns on org_departments only), no later commit has retired positions/org_functions or enforced a single tree. **G9 live-verified 2026-07-07 (this session)** — it is worse than "14 orphan roots" suggested: `org_departments` currently has **15 root rows** (parent_id IS NULL, 12 still active) spanning at least 4 disconnected/tangled generations of seed data — (a) 10 flat legacy `director`-type departments from 2026-05-05 (Kadrlar bo'limi, Marketing, Moliya, etc.), (b) a `department`-type root "Ma'muriyat" (id=44), (c) a `ceo`-rooted otdeleniye subtree (id=20 "Bosh Direktor ofisi") whose OWN parent_id=115 points to a `position` row ("IT Mutaxassis") — the CEO node is nested under an IT-specialist position, and (d) a SEPARATE otdeleniye-rooted subtree (id=157 "Ishlab chiqarish", itself a root) under which the sole `owner`-type node (id=19 "Ma'muriyat") is nested as a CHILD — i.e. Owner is currently a descendant of a mid-level otdeleniye, the exact inverse of the Vysotskiy-7 Owner→CEO→Otdeleniye vision. Plus 3 disabled duplicate-named otdeleniye orphans (154/156/159) that look like abandoned prior-attempt remnants. This is test/seed garbage reflecting several incompatible past attempts at building the tree, not a simple "reparent the orphans" cleanup — guessing which links are "correct" would fabricate a fake org chart. **This is the exact same blocker already independently documented as B8 in `docs/ai-execution/BLOCKERS_OWNER_DATA.md`** (currently sitting uncommitted in the working tree, part of an unrelated separate execution-pipeline's output — not committed by this pass, cited here only as corroborating evidence): "17 root'dan bittasini tuzish... egasi 7-otdeleniye→CEO→Owner ierarxiyasini bergач unify." **Owner question (G9):** please provide the real company org chart — who is the Owner, who is the CEO under them, and which of the 7 Otdeleniye (or the legacy `director`-level departments) report to whom — so the 15 roots can be correctly re-parented into one tree instead of guessed at. **G10 (separate, architecture-level) — still open:** `org_functions` alone is referenced in 59 files today (fresh grep, 2026-07-07); `positions`/`departments` have 8+ live readers (per G5's investigation on the same audit). A 2026-06-25 session memory records "Canonical=org_departments" as an apparent prior decision, but no commit since has actually retired `org_functions`/`positions`/`departments` or repointed their readers — full consolidation is genuinely migration-scale (repoint 59+8 files, one at a time, each independently tested) and should not be started without the owner confirming `org_departments` is still the intended final canonical table before this much surface area is touched. G5 (Org-Card's legacy sync-helper.ts mirror-write removal, 8 named readers) stays a SEPARATE tracked item — confirmed genuinely distinct, not covered by this cluster or any commit since (verified via git log/diff on all 8 reader files). |
| Two-Worlds | Root-cause cluster 4 — two config sources per value | QUEUED-NOT-STARTED | n/a | 0% | A10,D1,D2,D3,D4,D5 |
| Two-Worlds | Root-cause cluster 5 — rewrite-in-place left old module | QUEUED-NOT-STARTED | n/a | 0% | B8,B9,B12 |
| Two-Worlds | Root-cause cluster 6 — snapshot vs live grain | QUEUED-NOT-STARTED | n/a | 0% | C2,A15 |
| Two-Worlds | WORLD 1 ORDER (sales_orders canonical) | IN-PROGRESS | n/a | 90% | n/a |
| Two-Worlds | WORLD 2 GL (entries vs gl_journal_entries) | BLOCKED-OWNER | n/a | 0% | GL writer migration |
| Two-Worlds | WORLD 3 MATERIAL | DONE | n/a | 100% | n/a |
| Two-Worlds | WORLD 4 STOCK | IN-PROGRESS | n/a | 70% | n/a |
| Two-Worlds | WORLD 5 ATTENDANCE | UNKNOWN | n/a | ? | n/a |
| Two-Worlds | Open Decision D1 (MATERIAL forecast query target) | UNKNOWN | n/a | ? | AI forecast job |
| Two-Worlds | Open Decision D2 (retire materials/mm_materials) | UNKNOWN | n/a | ? | n/a |
| Two-Worlds | Open Decision D3 (stocks table active or dead) | UNKNOWN | n/a | ? | n/a |
| Two-Worlds | Open Decision D4 (GL entries canonical + currency col) | BLOCKED-OWNER | n/a | 0% | GL world merge |
| Two-Worlds | Open Decision D5 (posStockLedger Drizzle/VIEW mismatch) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Two-Worlds | Role-catalog finalization (~36 catalogs) | DONE (minority enum retired) | `5b68d53b` | 100% for the `auth/enums/role.enum.ts` fork (a genuine live warehouse-lockout bug fixed, not just a naming decision) | Same fix as Magic-Numbers Finding #10/M8 above — see that row. The other ~34 catalogs (local per-controller `enum Role{}` re-declarations + raw uppercase `@Roles('X',...)` literals) are separate, confirmed-cosmetic-only, and remain queued as a lower-value follow-up. |
| **VISION-3340 BACKLOG (835 total findings — 2026-07-07 re-triage supersedes the stale "226 open" figure)** | | | | | |
| VISION-3340 | 2026-07-07 RE-TRIAGE | IN-PROGRESS | n/a | see `docs/audit/VISION-3340-RETRIAGE-2026-07-07.md` | The 2026-07-04 reconciliation (385 STILL-OPEN + 223 PARTIALLY-RESOLVED = 608 candidates) was re-verified against live code by 20 parallel read-only agents (one per area), 2026-07-07. **116 already resolved** by intervening work since the audit (not previously credited on this board — see the retriage doc's "Now-Resolved" section for the list, including GL two-worlds P0 closure, cashier 4-stage payout chain, Z-report cron, VAT de-hardcoding, period-lock enforcement, employee_cards 100% coverage, and the IotGateway dead-WebSocket-provider fix). After dedup, **365 distinct root causes** remain, classified: **65 fixable-now** (59 dispatched to fix-batch1 workflow `wf_1eee15f8-be1`, pending main-agent review+commit; 6 explicitly need owner/schema sign-off — see doc), **41 owner-data** (grouped into 12 themes — mostly card/karta attribute master-data + org-chart linkage still empty, cross-referencing the same "owner-data" blockers already tracked elsewhere on this board), **82 owner-decision** (grouped into ~17 themes — largest cross-cutting one: activate card-based permission system, `CARD_PERMISSION_SOURCE_READY` hardcoded false), **177 skip-low-value** (vague/cosmetic/requires-live-runtime-proof, no action needed). The old 20 per-area "~X% resolved" rows below are superseded by this retriage and left as historical record only — do not re-cite their percentages. |
| VISION-3340 | AREA-01-CKP (54 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-02-HR (54 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-05-AUTH (44 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-07-GOLDEN-THREAD (20 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-06-PP (46 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-08-IOT (69 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-11-QC (54 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-15-CRM (51 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-14-SD (50 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-13-WMS (49 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-09-REPORTS (43 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-03-LMS (40 items, highest resolved rate) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-04-ORG-STRUCTURE (40 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-20-FINANCE (40 items, read-only) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-12-AI (33 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-19-RAZRYAD (33 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-10-MES (32 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-18-MASTER-DATA (31 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-16-FRONTEND (27 items) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | AREA-17-SECURITY (25 items, final area) | SUPERSEDED | n/a | see retriage | historical — superseded by 2026-07-07 retriage row above |
| VISION-3340 | (835 individual SB-numbered items: SB0001-SB0835) | MIXED | n/a | see `docs/audit/VISION-3340-RETRIAGE-2026-07-07.md` for the deduplicated/reclassified list | Superseded pointer: the original per-item detail lived in `VISION-3340-RECONCILIATION-2026-07-04.md`; the 2026-07-07 retriage doc is now the source of truth for STILL-OPEN/PARTIALLY-RESOLVED items (RESOLVED/UNVERIFIABLE items from the original doc are unaffected and still valid as-is). |
| **GOVERNANCE CHECK (A/B-series)** | | | | | |
| Governance | A1 (.repo.ts vs .repository.ts naming split) | IN-PROGRESS | n/a | 40% | Tooling/lint codemods for A2/A3/A4 |
| Governance | A2 (unbounded SELECT *, 561+236 occurrences) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | A3 (~73 genuine N+1 sites) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | A4 (business logic in controllers, 5 confirmed sites) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | A5 (silent-catch-swallow, fake Ok returns) | IN-PROGRESS | n/a | 33% | Trust in A7/A4 fixes (Top-5 #1) |
| Governance | A6 (missing FK indexes on org-card columns) | QUEUED-NOT-STARTED | n/a | 0% | Active VIZYON org-card build performance (Top-5 #2) |
| Governance | A7 (auth decorator coverage gaps, incl. mini-app) | IN-PROGRESS | n/a | 70% | Exploitable: Telegram mini-app can approve/reject material requests (Top-5 #5) |
| Governance | A8 (duplicate routes, 148 total 4.5%) | IN-PROGRESS | 44038eb9 | 90% | n/a |
| Governance | B9 (intelligent-key format, fallback codes unstable) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | B10 (materials/products fragmentation) | IN-PROGRESS | n/a | 20% | Top-5 #3 |
| Governance | B11 (no duplicate lookup before insert) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | B12 (nullable columns despite .notNull() declared) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | B13 (date storage varchar not date/timestamp, ~11%; UOM gap) | IN-PROGRESS | n/a | 50% | n/a |
| Governance | B14 (created_by/updated_by audit columns, low coverage) | QUEUED-NOT-STARTED | n/a | 14% | Compounds with A6 (Top-5 #2) |
| Governance | B15 (taxonomy classification columns, partial/degenerate) | IN-PROGRESS | n/a | 33% | n/a |
| Governance | B16 (soft-delete/archival rate check) | DONE | n/a | 100% | n/a |
| Governance | Top-5 #1 (A5 fix) | QUEUED-NOT-STARTED | n/a | 0% | Precondition for trusting every other fix in audit |
| Governance | Top-5 #2 (A6 fix) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | Top-5 #3 (B10 fix) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | Top-5 #4 (A1 fix) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Governance | Top-5 #5 (A7 fix) | QUEUED-NOT-STARTED | n/a | 0% | Intersects B14, A5 |
| Governance | ABAP: Transport Requests (N/A classification) | DONE | n/a | 100% | n/a |
| Governance | ABAP: AUTHORITY-CHECK (mechanism exists, fail-open) | IN-PROGRESS | n/a | 70% | n/a |
| Governance | ABAP: sy-subrc (Result/Err pattern exists) | IN-PROGRESS | n/a | UNKNOWN | n/a |
| **CRITICAL-CORRECTNESS (C1-C4)** | | | | | |
| Critical-Correctness | 1.1 Payment double-spend (no idempotency/tx) | DONE | a7f0129e | 100% | Payment double-spend; #1 top-10 (C1) |
| Critical-Correctness | 1.2 Duplicate customer payments (SD ledger) — backend debounce stopgap | DONE | 6e86310c | 100% (partial mitigation only) | n/a |
| Critical-Correctness | 1.2-frontend: client-side idempotency key for payment submission | NOT-STARTED | n/a | 0% | Needs FE work — see note on the Critical-Correctness summary row |
| Critical-Correctness | 1.3 Duplicate invoice numbers (Date.now()) | DONE | cc3f8a9d+1e5802d9 | 100% | Duplicate invoice numbers; #6 top-10 (C4, incl. 3-more-writers follow-on) |
| Critical-Correctness | 1.4 WMS oversell (no atomic quantity guard) | DONE | e8c5a1f6 | 100% | WMS oversell; #3 top-10 |
| Critical-Correctness | 1.5 POS oversell / negative stock (TOCTOU) | DONE | 7e8d7bd9 | 100% | POS oversell; #4 top-10 |
| Critical-Correctness | 1.6 Quarantine GREATEST clamp masking oversell | DONE | a9d1a583 | 100% | n/a |
| Critical-Correctness | 1.7 count()+1 seqNum read-max race | DONE | b8422afd | 100% | n/a |
| Critical-Correctness | 1.8 SELECT-then-INSERT duplicate-name guard non-atomic | PARTIAL (see note) | d75898a2 | 60% | Full atomic fix (UNIQUE index) blocked by pre-existing duplicate warehouse names, itself a symptom of the already-tracked org_departments duplication (Two-Worlds cluster-3 / G9 "14 roots") — cross-referenced, not a new independent bug |
| Critical-Correctness | 1.9 GL findEntryIdByReference-then-insert (safe) | DONE (was actually a latent bug) | b60ce795 | 100% | Independent verification found the board's "(safe)" framing was wrong for the true-concurrency case: `entry_number` embeds `Date.now()`, so no UNIQUE constraint can catch two truly-concurrent posts of the same `reference` both missing the pre-check and both inserting — a silent GL double-post (low-frequency, manual-accountant-action risk, but real). Fixed with a transaction-scoped Postgres advisory lock (`pg_advisory_xact_lock(hashtext(reference))`, no migration needed) + in-tx re-check before insert; `insertJournal()`'s new `reference` param is optional so any other caller is unaffected. 3 new tests + full `test/finance/` suite re-run, 4 pre-existing unrelated failing suites (env/DB-URL + 2 unrelated services) confirmed via git-stash. |
| Critical-Correctness | 1.10 Kanban MAX(sort_order)+1 (acceptable) | DONE (verified stale) | n/a | 100% | Confirmed via independent read-only investigation: `kanban_cards.sort_order` has no UNIQUE/CHECK constraint, so a collision (e.g. a user reordering at the same moment the daily 07:00 recurring-card cron runs) produces only a cosmetic display-ordering tie, not a crash or data corruption; the cron itself is a single scheduled instance processing rows sequentially so it can't race against itself. Matches the audit's own "acceptable" hint — no fix needed. |
| Critical-Correctness | 2.1 GL entryDate UTC day instead of Tashkent | DONE | e6cebf7d | 100% | GL entry mis-dating; #5 top-10 (C3) |
| Critical-Correctness | 2.2 GL period lock raw text compare, no cast normalize | DONE | 9919dc92 | 100% | GL posting into closed period; #5 top-10 (C2) |
| Critical-Correctness | 2.3 CKP 16h deadline anchored UTC midnight | BLOCKED-OWNER-DECISION | n/a | 0% | Fixing anchors deadline 5h earlier (16:00 not 21:00 Tashkent) — live payroll-gate business-rule change, needs owner sign-off before touching ckp-gate.ts + ckp-fact.service.ts in lockstep |
| Critical-Correctness | 2.4 Two 'today' conventions coexist (Tashkent vs UTC) | DONE (verified stale) | e6cebf7d | 100% | GL half fixed under C3; cashier cron was never broken; remainder is fully subsumed by 2.3 |
| Critical-Correctness | 2.5 sd-quotations getMonth() OS-local/UTC | DONE | 44cd0814 | 100% | n/a |
| Critical-Correctness | 2.6 addDays() not TZDate-wrapped | DONE | 37623cda | 100% | n/a |
| Critical-Correctness | 3.1 GL balance check unrounded vs rounded (latent) | DONE | fb01fc44 | 100% | `createJournalEntry()` balance check now rounds both sides to cents and requires exact equality (was `Math.abs(diff) > 0.01` on raw floats); added a last-leg residual-adjustment so independent per-row rounding (e.g. a 100/3 three-way split) can't leave persisted rows summing 1 cent short of the validated total. 3 new tests + full suite 27/27 PASS. |
| Critical-Correctness | 3.2 delivery-completed float math (exact by construction) | DONE (verified stale) | n/a | 100% | Confirmed via independent investigation: `gl-posting.service.ts#postDeliveryCompleted` derives revenue as `amount = totalAmount - tax` (subtraction, not independent rounding), so ΣDebit = ΣCredit = `totalAmount + costOfGoods` exactly, by algebraic construction, regardless of how `tax`/`costOfGoods` round. Same code already assessed "ALREADY CORRECT" under 3.6 — no fix needed. |
| Critical-Correctness | 3.3 payroll multi-step float division/resum (tolerance holds) | DONE (verified stale) | n/a | 100% | Confirmed via independent investigation: `payroll.service.ts`'s day-loop (`dayBase = proratedGross/totalDays`, no intermediate rounding) and the cross-card resum have no systematic drift source — only raw IEEE-754 summation noise, which at realistic salary magnitudes (10^5-10^8 UZS, ≤366 day-terms/card) is many orders of magnitude below the existing 0.01 tolerance check. Holds even at scale — no fix needed. |
| Critical-Correctness | 3.4 payroll-closure tolerance aligned (correct guard) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 3.5 sd-quotations independently-rounded mismatch (display only) | DONE (verified stale) | n/a | 100% | Confirmed via independent investigation: the rounding mismatch (`unitPrice*qty` vs `totalPrice`, up to 1 cent) is confined to the stateless `POST /sd/calculate-price` preview endpoint; `POST /sd/quotations` (`createQuotation`) is a completely separate code path that never calls `calculatePrice`, and no other backend caller chains its output into anything persisted/invoiced/GL-posted. Genuinely display-only — no fix needed. |
| Critical-Correctness | 3.6 gl-posting postDeliveryCompleted (exact, already correct) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.1 legacy.service.ts sql.raw(rawQuery) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.2 schema.ts ddlRun DDL_PREFIX_RE guard | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.3 invariants.ts static-migration-only sql | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.4 aisha compare-periods.tool allowlist (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.5 doc-sequences.helper allowlist regex (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.6 supplier-rating.repository integer coercion (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.7 admin-extra.repo parameterized dynamic-WHERE (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.8 ORDER BY hardcoded column refs (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 5.1 record-payment 3 writes no transaction | DONE (verified stale) | a7f0129e | 100% | Same code path as 1.1/1.2 (`record-payment.handler.ts`) — already fixed by C1's transactional rewrite: payment INSERT + invoice atomic guarded UPDATE commit together in one `db.transaction` (line 92). GL posting happens after (its own internal transaction, documented accepted tradeoff per F3); if GL fails, an explicit compensating transaction deletes the payment row + reverses the invoice amount (line 131-138) so the net effect matches a full rollback — the exact "paid with no ledger entry" scenario this finding names cannot occur. Audit's own cross-reference (see notes above) already flagged 5.1 as closed by the same fix; board row was just never updated. |
| Critical-Correctness | 5.2 iot-tablet 3 db.execute no tx | DONE | e3a4dc22 | 100% | `reportProductionDefect()`'s `production_sessions` UPDATE + `downtime_events` INSERT wrapped in one `db.transaction`; QC-bridge call stays outside on purpose (own try/catch, different module's table). 3 new tests + full `test/iot/` (196 tests) re-run, 1 pre-existing unrelated failure confirmed via git-stash. |
| Critical-Correctness | 5.3 iot-tablet material_movements/warehouse_stock no tx | DONE | e3a4dc22 | 100% | `creditReturnedMaterialToStock()`'s TOCTOU SELECT/UPDATE-else-INSERT collapsed into one atomic `INSERT ... ON CONFLICT (warehouse_id, material_id) DO UPDATE`, same pattern as `execReceiveFg`/`upsertWarehouseStock`. Same commit as 5.2 (same file). 3 new tests PASS. |
| Critical-Correctness | 5.4 warehouse-config 3 raw calls no tx | DONE | ca186aed | 100% | `WarehouseConfigService.receiveStock()`'s 3 independent rawSql calls (stock upsert, current_stock update, movement insert) now run inside one `db.transaction`; stock upsert is now atomic `INSERT ... ON CONFLICT DO UPDATE` (was UPDATE-then-fallback-INSERT). 4 new tests + full `test/pos/` (17 suites/143 tests) re-run clean. |
| Critical-Correctness | 5.5 pos-inventory-count for-loop no all-or-nothing tx | DONE | f0ae8c56 | 100% | `bulkRecordActualQty()`'s per-line loop (each line previously its own implicit one-statement transaction) now shares ONE `db.transaction` via a new `repo.runInTransaction()`; `findLine`/`checkBarcode`/`updateCountLine` thread an optional `executor`. 3 new tests (incl. rollback-on-line-2-of-3 and rollback-on-last-line) PASS. |
| Critical-Correctness | 5.6 approval-workflow Promise.allSettled (acceptable) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 6.1 hard DELETE orphaned BOM lines | DONE | dfa2b1d7 | 100% | Orphaned BOM lines; #9 top-10 |
| Critical-Correctness | 6.2 hard DELETE orphaned OKR key results | DONE (code + data) | 4432944, 817fa27c | 100% | Orphaned OKR key results; #9 top-10 |
| Critical-Correctness | 6.3 warehouse-barcode-ops no soft-delete filter | DONE | 765b6772 | 100% | n/a |
| Critical-Correctness | 6.4 pos-barcode findByBarcode no soft-delete filter | DONE | 0e0d42a7 | 100% | n/a |
| Critical-Correctness | 6.5 auto-barcode LEFT JOIN no deleted_at filter | DONE | 08cc5b04 | 100% | n/a |
| Critical-Correctness | 6.6 customer-360 inconsistent deleted_at filtering | DONE (verified stale) | n/a | 100% | drizzle-sd-customers.repo.ts:103 already has `AND deleted_at IS NULL`, matches sibling getRecentOrders(); audit's citation pointed at a pure-presentation file with no SQL |
| Critical-Correctness | 6.7 gl-posting account resolve no is_active filter | DONE | 9e3963b1 | 100% | n/a |
| Critical-Correctness | 6.8 systemic soft-delete non-enforcement (~92 files) | DONE (scoped) | 765b6772,0e0d42a7,08cc5b04,9e3963b1 | 100% (all 4 concrete satellite findings + the 1 ledger-critical case); ~85 remaining material_cards references intentionally NOT swept — audit itself called a full 95-file sweep disproportionate given 0 live soft-deleted rows today | Read-side soft-delete enforcement; #8 top-10. Scope decision: fixed every KNOWN unfiltered call site (6.3/6.4/6.5/6.7); did not blanket-sweep all ~95 material_cards references since most are display/reporting paths where a soft-deleted row appearing is cosmetic, not a correctness bug — a full sweep is its own dedicated pass if the owner wants it, not bundled into a single-session mechanical fix. |
| Critical-Correctness | 7.1 IoT tablet TTL mismatch BE 8h vs FE 12h | DONE | f4d17363,b29c8bce | 100% | Silent write failures up to 4h/shift; #2 top-10 |
| Critical-Correctness | 7.2 No 401/refresh handling on IoT tablet, no refresh endpoint | DONE | f4d17363,b29c8bce | 100% | Unsaved session/scan work lost; #2 top-10 |
| Critical-Correctness | 7.3 login.service comment/code TTL doc drift | DONE | 40e96477 | 100% | n/a |
| Critical-Correctness | 7.4 chat JWT 24h vs auth 15m default mismatch | DONE | 2dbcc340 | 100% | n/a |
| Critical-Correctness | 7.5 15m access token risk for long unsaved POSTs | BLOCKED-OWNER-DECISION | n/a | 0% | Should wizard forms autosave (localStorage/server-draft) before a forced-logout redirect, or is losing unsaved state on session expiry acceptable given refresh normally succeeds? If autosave wanted, which wizards first? |
| Critical-Correctness | 7.6 refresh-token race, two live token pairs | DONE | 90f9b226 | 100% | n/a |
| Critical-Correctness | 8.1 auto-barcode Math.random suffix no unique constraint | DONE | 12e6bd63 | 100% | Duplicate barcodes; #7 top-10 |
| Critical-Correctness | 8.2 pos-stock-issuable COUNT(*)+1 TOCTOU barcode | DONE | 9f8a62e1 | 100% | Duplicate barcodes; #7 top-10 |
| Critical-Correctness | 8.3 procurement-request PR number COUNT(*)+1 no lock | DONE | 4167a16a | 100% | Duplicate PR numbers; #10 top-10 |
| Critical-Correctness | 8.4 employees-compat inline COUNT(*)+1 (low volume) | DONE | 7b7b3edc | 100% | n/a |
| Critical-Correctness | 8.5 ecommerce order number read-lastNumber+1 (unverified constraint) | DONE (verified stale) | n/a | 100% | generateSequenceNumber() already uses atomic db.transaction UPDATE-RETURNING/ON CONFLICT; customer_orders.order_number has a live UNIQUE constraint — audit's own "not confirmed" now confirmed safe |
| Critical-Correctness | 8.6 pos-barcode scan no is_active/status gate | DONE (+ wrong-table bug fix) | 5a9fb60e | 100% | Audit's literal ask needed no code change (`pos_barcode_map.barcode` is UNIQUE, `material_cards.barcode` is write-once — no reassignment path exists). But investigation found `clearPrimaryBarcode()` was updating the WRONG table entirely (`inventory_barcode_assignments`, a passport/serial-tracking table) instead of `pos_barcode_map` — a complete no-op every time it ran. Fixed the table + added `pos_barcode_map` to the `@shared/db` barrel export. 3 new tests + live dry-run against real columns PASS. |
| Critical-Correctness | 8.7 barcode-warehouse movement_number timestamp collision | DONE | 867b1cf5 | 100% | `receive()`/`productionReceive()` generated `movement_number` via second-resolution `TO_CHAR(NOW(),'YYYYMMDD-HH24MISS')` — concurrent same-second requests crashed on the live `pos_movements_movement_number_key` UNIQUE constraint. Now generated in JS with a random suffix + bounded 5-attempt retry-on-23505, matching the established C8.1/C8.2 pattern. Incidentally fixed a pre-existing TS2415 (redundant `logger` redeclaration shadowing the base class's). 5 new tests + full `test/compatibility/` (293 tests) re-run, 1 pre-existing unrelated failure confirmed via git-stash. |
| Critical-Correctness | 8.8 mm-purchase-orders po_number from serial (fine) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 9.1 uncapped array .min(1) no .max(), DoS risk | DONE | 30469999 | 100% | n/a |
| Critical-Correctness | 9.2 .svg in upload allowlist, stored XSS risk (mitigated) | DONE | 918a2685 | 100% | n/a |
| Critical-Correctness | 9.3 storage.controller path-confinement (correct) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 9.4 upload handlers ext-allowlist+size-cap (correct) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 9.5 xlsx export-only, no upload-parse (correct) | DONE | n/a | 100% | n/a |
| **DESIGN SYSTEM UNIFICATION (692 hardcoded colors)** | | | | | |
| Design-System | Part A — Theme cascade (Layer1/Layer2) | DONE | n/a | 100% | n/a |
| Design-System | CRM workspace color drift (Material Design palette) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #1 |
| Design-System | Kanban module color/design drift (neumorphic) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #1 |
| Design-System | Agents/AI pages color + emoji-icon drift | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #1, #8 |
| Design-System | Director export/analytics inline Tailwind tints | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | POS Monitor separate theme (by design) | DONE | n/a | 100% | n/a |
| Design-System | 692 hardcoded color lines (root cause) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #1 |
| Design-System | Design-token guard gap (misses TS constants/arrays) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #2 |
| Design-System | Base UI primitives hardcoded colors (badge/button) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Part B — 5 documented page templates (don't exist) | UNKNOWN | n/a | 0% | Top-10 fix #4 |
| Design-System | EPPageHeader adoption (~619 pages) | IN-PROGRESS | n/a | 26% | Top-10 fix #4 |
| Design-System | Warehouse CRUD pages — no shared template | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4 |
| Design-System | *Config pages (11+) — no shared template | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4 |
| Design-System | HR cluster pages — no shared template | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4 |
| Design-System | List cluster pages — no shared template | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4/#6 |
| Design-System | StubPage.tsx should use EPComingSoon | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Bespoke pages (legit exceptions) | DONE | n/a | 100% | n/a |
| Design-System | Analytics dashboards (legit exceptions) | DONE | n/a | 100% | n/a |
| Design-System | 360 composite pages (weak legit exception) | IN-PROGRESS | n/a | 0% | n/a |
| Design-System | Public/auth/media pages (legit exceptions) | DONE | n/a | 100% | n/a |
| Design-System | Part C #6 — Visual hierarchy inconsistency | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4 |
| Design-System | Part C #7 — App-shell double/triple padding | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #5 |
| Design-System | Part C #8 — Color discipline broken outside token zone | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #1 |
| Design-System | Part C #9 — Primary buttons (consistent) | DONE | n/a | 100% | n/a |
| Design-System | Part C #9 — Status pills drift | IN-PROGRESS | n/a | 0% | Top-10 fix #7 |
| Design-System | Part C #9 — Table headers drift (67 files) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #6 |
| Design-System | Part C #9 — KPI/stat cards ~15 divergent implementations | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #3 |
| Design-System | Part C #10 — Icon library discipline (Lucide only) | DONE | n/a | 100% | n/a |
| Design-System | Part C #10 — 494 emoji as functional UI icons | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #8 |
| Design-System | Dead Material Symbols font unused | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #8 |
| Design-System | Icon sizing inconsistency (~22 distinct values) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #8 |
| Design-System | Part C #11 — Empty/loading/error state adoption partial | IN-PROGRESS | n/a | 0% | n/a |
| Design-System | Part C #12 — Responsive quality (breakpoint bug fixed, deeper posture open) | DONE | n/a | 50% | n/a |
| Design-System | Part C #13 — Background token mismatch (doc vs code) | BLOCKED-OWNER | n/a | 0% | Top-10 decide #9 |
| Design-System | Part C #13 — Overall warm-soft brand direction sign-off | BLOCKED-OWNER | n/a | 0% | Top-10 decide #10 |
| Design-System | Part D (1) Duplicate-breakpoint grid-cols bug (8+ pages) | DONE | 7a462a72 | 100% | n/a |
| Design-System | Part D (2) HR header inconsistency (~41/48 pages) | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #4 |
| Design-System | Part D (3) ImpositionCalculator token deviation | DONE | n/a | 100% | n/a |
| Design-System | Part D (4a) Shared duplicate-breakpoint grid | DONE | n/a | 100% | n/a |
| Design-System | Part D (4b) Shared app-shell double/triple padding | QUEUED-NOT-STARTED | n/a | 0% | Top-10 fix #5 |
| Design-System | Part D (4c) Shared EPPageHeader non-adoption | QUEUED-NOT-STARTED | n/a | 26% | Top-10 fix #4 |
| Design-System | Part D (bonus) DesignOrderDetail inert gradient | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #1 Unify three color languages | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #2 Close design-token guard gap | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #3 Consolidate KPI/stat cards onto EPKpiCard | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #4 Build/adopt real page-header/list template | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #5 Kill app-shell double/triple padding | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #6 Standardize tables onto shared DataTable | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #7 Finish status-pill migration | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #8 Icon hygiene (494 emoji, dead font, sizing) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-System | Top-10 #9 Reconcile background token | BLOCKED-OWNER | n/a | 0% | n/a |
| Design-System | Top-10 #10 Confirm warm-soft brand direction | BLOCKED-OWNER | n/a | 0% | n/a |
| Design-System | Overall doc status (investigation only) | UNKNOWN | n/a | 0% | n/a |
| **FINANCE SoD / ORG-CHART READINESS** | | | | | |
| SoD-OrgChart | FINANCE-SOD Q1: Finance dept card exists (duplicated 5x) | BLOCKED-OWNER | n/a | 0% | Defining 'the finance department' at all |
| SoD-OrgChart | FINANCE-SOD Q2: Which employees assigned to Finance dept | BLOCKED-OWNER | n/a | 0% | Knowing who counts as finance 'maker' |
| SoD-OrgChart | FINANCE-SOD Q3: head_user_id for Finance card / fallback | BLOCKED-OWNER | n/a | 0% | 'Head of my department' lookup for finance members |
| SoD-OrgChart | FINANCE-SOD Q4: head_user_id fill-rate (18/143) | QUEUED-NOT-STARTED | n/a | 13% | Finance dept/otdeleniye level = 0% head coverage |
| SoD-OrgChart | FINANCE-SOD Q5: Guards can't answer org-chart membership live | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| SoD-OrgChart | FINANCE-SOD Q6: Current finance maker/checker (0 live holders) | DONE | n/a | 100% | SoD functionally inert |
| SoD-OrgChart | FINANCE-SOD Q7: Existing org-chart permission pattern (ZVS) works | DONE | n/a | 100% | n/a |
| SoD-OrgChart | FINANCE-SOD Finding #1: Finance card duplicated, no canonical | BLOCKED-OWNER | n/a | 0% | All downstream SoD-from-org-chart work |
| SoD-OrgChart | FINANCE-SOD Finding #2: Members/heads on different twin cards | BLOCKED-OWNER | n/a | 0% | 'Head of my dept' query returns null for all 3 finance staff |
| SoD-OrgChart | FINANCE-SOD Finding #3: Dept/otdeleniye heads 0% filled | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| SoD-OrgChart | FINANCE-SOD Finding #4: Membership linkage multi-world | BLOCKED-OWNER | n/a | 0% | Well-defined 'who is a finance maker' |
| SoD-OrgChart | FINANCE-SOD Finding #5: Maker role unassignable (baseline) | DONE | n/a | 100% | n/a |
| SoD-OrgChart | ORGCHART-FULL A1: Dept-card inventory + head fill-rate | QUEUED-NOT-STARTED | n/a | 13% | n/a |
| SoD-OrgChart | ORGCHART-FULL A2: Hierarchy fallback resolvability (broken) | BLOCKED-OWNER | n/a | 0% | Every module's approver-resolution path is data-dead |
| SoD-OrgChart | ORGCHART-FULL A3: Card-membership data (3 disagreeing tables) | BLOCKED-OWNER | n/a | 0% | Canonical membership source system-wide |
| SoD-OrgChart | ORGCHART-FULL A4: Auth code can't answer membership/headship live | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| SoD-OrgChart | ORGCHART-FULL Part B: Finance/GL authorization state | BLOCKED-OWNER | n/a | 0% | Ranked #3 farthest-from-ready |
| SoD-OrgChart | ORGCHART-FULL Part B: HR/payroll authorization state | BLOCKED-OWNER | n/a | 0% | Ranked #4 |
| SoD-OrgChart | ORGCHART-FULL Part B: MM/procurement authorization state (no dept card) | BLOCKED-OWNER | n/a | 0% | Ranked #1 farthest — dept card must be created |
| SoD-OrgChart | ORGCHART-FULL Part B: WMS/warehouse authorization state | BLOCKED-OWNER | n/a | 0% | Ranked #5 |
| SoD-OrgChart | ORGCHART-FULL Part B: POS/cashier authorization state (no dept card) | BLOCKED-OWNER | n/a | 0% | Ranked #2 farthest — dept card must be created |
| SoD-OrgChart | ORGCHART-FULL Part B: QC/quality authorization state | BLOCKED-OWNER | n/a | 0% | Ranked #6 |
| SoD-OrgChart | ORGCHART-FULL Part B: SD/sales authorization state | BLOCKED-OWNER | n/a | 0% | Ranked #7 |
| SoD-OrgChart | ORGCHART-FULL Part B: Director/strategic (ZVS/approvals) | IN-PROGRESS | n/a | 50% | employee_org_departments.employee_id null blocks resolution; ranked #10 |
| SoD-OrgChart | ORGCHART-FULL Part B: Communication-Center (CC) | IN-PROGRESS | n/a | 50% | Same null-employee_id block; ranked #10 |
| SoD-OrgChart | ORGCHART-FULL Part B: MES/production authorization state | QUEUED-NOT-STARTED | n/a | 0% | Ranked #8 |
| SoD-OrgChart | ORGCHART-FULL Part B: Marketing/Logistics/PR/Training | BLOCKED-OWNER | n/a | 0% | Ranked #9 |
| SoD-OrgChart | ORGCHART-FULL Part B: Order-workflow/CRM/IoT/Kanban | UNKNOWN | n/a | ? | n/a |
| SoD-OrgChart | Systemic prereq #1: Decide canonical membership table | BLOCKED-OWNER | n/a | 0% | All modules' membership resolution |
| SoD-OrgChart | Systemic prereq #2: Reconcile duplicated tree | BLOCKED-OWNER | n/a | 0% | All modules' headship resolution |
| SoD-OrgChart | Systemic prereq #3: Provide head for member-bearing level | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| SoD-OrgChart | DOC_MISSING (both docs found, N/A) | UNKNOWN | n/a | ? | n/a |

---

## Cross-stream overlaps

These sub-items from different streams describe the same underlying issue. Treat each group as ONE fix, not N separate ones — assign to a single owner/PR to avoid duplicate work.

1. **AR/AP legacy `fi_invoices`/`invoices` vs canonical `finance_invoices`** (the big one)
   - Two-Worlds: A1 (Invoices), A18 (Invoice views wrong base), C2 (Receivables aging snapshot vs live), C3 (Debtor amounts three-way), Root-cause cluster 1
   - Governance: not directly named but B12 (nullable `finance_invoices.total_amount`/`customer_id`) touches the same table
   - **Status: already addressed elsewhere — see "Known already-fixed-elsewhere" below.**

2. **Payment write fragmentation (payments / finance_payments / sd_payments / customer_payments / invoice_payments)**
   - Two-Worlds: A6 (Payments), B5 (Payment write three tables), Root-cause cluster 2
   - Critical-Correctness: 1.1 (record-payment double-spend, no idempotency/tx), 5.1 (record-payment 3 writes no transaction — same handler, same file `record-payment.handler.ts`), 1.2 (sd-payments duplicate INSERT)
   - These are the SAME code path (`finance/record-payment.handler.ts` + `sd-payments.repository.ts`) being described from a "which table" angle (Two-Worlds) and a "is it safe" angle (Critical-Correctness). A single transactional rewrite of payment recording closes Two-Worlds A6/B5 AND Critical-Correctness 1.1/1.2/5.1 at once.

3. **GL dual-writers / GL engine bypass**
   - Two-Worlds: B2 (Payroll→GL dual writer), B3 (POS movement→GL dual writer), B4 (orphan GL writer), Root-cause cluster 2, WORLD 2 GL / Open Decision D4
   - Critical-Correctness: 2.1/2.2 (GL date/period-lock correctness), 3.1 (GL balance tolerance latent bug)
   - B14-Owner: SB0817/SB0820 (pos_gl_postings subledger vs canonical `entries`, same "which GL table" question as Two-Worlds B2/B3)
   - All describe the same unresolved architectural fact: multiple code paths write GL data outside `GlPostingService.postJournal`, and the target table (`entries` vs `gl_journal_entries`/`pos_gl_postings`) is still undecided (Open Decision D4 = owner approval gate for the whole cluster).

4. **Role/permission catalog fragmentation (~36 catalogs, case-drift, dead @Roles)**
   - Two-Worlds: D1 (lowercase vs UPPERCASE), D2 (3rd/4th catalog), D3 (27 per-controller local enums), D4 (FE role lists), Root-cause cluster 4, "Role-catalog finalization" row
   - Magic-Numbers: Finding #10 (role-name case drift, ~60 dead @Roles files) — nearly identical evidence/root cause to Two-Worlds D1/D3
   - Governance: A7 (auth decorator coverage gaps) touches the same guard behavior (fail-open when no/mismatched @Roles)
   - Magic-Numbers Finding #10 and Two-Worlds D1/D3 are describing the exact same static analysis finding from two different audit passes — should be fixed once, not twice.

5. **Org-chart / KARTA head_user_id + membership resolution (0% head fill, 3-way membership disagreement)**
   - Two-Worlds: A7 (position/job-card three-world), Root-cause cluster 3
   - B14-Owner: SB0068/SB0079/SB0100/SB0191/SB0215/SB0216/SB0798 style items (org_departments head_user_id/rbac_tier near-0% filled) — see VISION-3340 AREA-04/AREA-05
   - SoD-OrgChart: FINANCE-SOD Q1-Q4 + Findings #1-#4, ORGCHART-FULL A1-A4, Systemic prereqs #1-#3 — this is the SAME `org_departments`/`employees`/`employee_cards` data-quality problem (duplicated tree, 0% head_user_id, 3 disagreeing membership tables) examined generically by Two-Worlds/VISION-3340 and then in финанс-specific depth by SoD-OrgChart.
   - **This is the single highest-value consolidation target**: at least 3 independent audits (Two-Worlds A7, VISION-3340 Area-04/05, SoD-OrgChart) all point at "org_departments head_user_id / membership source" as the root blocker for authorization, payroll-by-card, and approval-chain work across nearly every module. Fix once (Systemic prereqs #1-#3), and A7, ORGCHART-FULL A2/A3, and multiple VISION-3340 SB-items (SB0068, SB0215, SB0216, SB0718, SB0798, etc.) all close together.

6. **Design-token / hardcoded-color duplicate-breakpoint grid bug**
   - Design-QA: "Root cause #1: Duplicate-breakpoint Tailwind grid bug" + every `duplicate sm:/lg: grid bug` row across HR/Finance/CRM/Admin
   - Design-System: "Part D (1) Duplicate-breakpoint grid-cols bug (8+ pages)" — marked DONE with commit 7a462a72 (and 5 sibling commits)
   - **These are the same underlying bug, but the two audits disagree on status**: Design-QA (read-only, no fix status noted, still lists items as QUEUED-NOT-STARTED) vs Design-System (explicitly DONE via commit 7a462a72 + 5 more, "precise regex = 0 matches app-wide"). Design-System's audit ran later and did the actual fix — the Design-QA rows for duplicate `sm:`/`lg:` grid bugs (FinanceBreakEven, FinanceVariance, FinanceDashboardTabs, PricingTiers, IdealRasmPage, AgentsHub, ImpositionCalculator, HROffboarding) should be re-verified against commit 7a462a72 before anyone re-fixes them — **likely already resolved**, same pattern as the AR/AP note below.

7. **EPPageHeader non-adoption**
   - Design-QA: "Root cause #3: EPPageHeader non-adoption (~54-95 pages)" + per-module rows (HR ~41/48, Admin/LMS ~54/76)
   - Design-System: "EPPageHeader adoption (~619 pages, 26%)" + "Part D (4c) Shared EPPageHeader non-adoption" + Top-10 fix #4
   - VISION-3340: SB0680/SB0699 ("EPPageHeader used in 162/870 page files, ~19% adoption")
   - Three separate audits independently measured the same metric (EPPageHeader adoption rate) with slightly different denominators (48 HR pages / 76 Admin pages / 619 pages / 870 pages) — should be tracked as ONE metric/fix effort, not four.

8. **Vendor rating view (mm_vendor_ratings vs vendor_performance)**
   - Two-Worlds: A11 (Vendor rating), C6 (Vendor view, tied to A11)
   - Already noted as tied within the same document, but flagging since C6 cites A11 explicitly — no new fix needed beyond what A11 already covers.

9. **Sales-order create/read asymmetry across compat surfaces**
   - Two-Worlds: B11 (sales-order create sd/erp/saas compat), C1 (sales-order list/create read/write asymmetry) — B11 explicitly says "tied to C1"
   - Already cross-referenced within the same doc; consolidate into one fix (repoint erp/saas compat reads to `sales_orders`/`sd_sales_orders` VIEW consistently).

10. **IoT/sensor empty-data pattern blocking multiple features**
    - VISION-3340: SB0312 (0 operator-role users), SB0314/SB0316/SB0331/SB0345 (iot_sensors/iot_sensor_readings/iot_alerts all 0 rows), SB0330 (no Andon table), many AREA-08-IOT items reference this same "consistent with Area08's empty-IoT-data pattern"
    - B14-Owner: R7 (IoT anomaly z-score baseline / MRO trend features blocked by same 0-row sensor tables)
    - Same root blocker (no real sensor hardware/data yet) cited independently by ~15+ VISION-3340 SB-items and B14-Owner R7 — one owner decision (install real sensors / accept synthetic test data) unblocks all of them simultaneously.

---

## Known already-fixed-elsewhere

The Master Status Board's Active Loops table already records that the **Accounting-Standards/Finance GL loop fixed AR/AP aging to read canonical `finance_invoices` in commit `f26b6469` (2026-07-06)**. Cross-checking against this consolidation's inputs, the following items describe that exact same AR/AP legacy-vs-canonical problem and should be marked **LIKELY ALREADY RESOLVED by f26b6469 — verify before re-doing** rather than left QUEUED/BLOCKED:

- **Two-Worlds A1** — Invoices (`invoices` vs `finance_invoices`) — BLOCKED-OWNER, commit `d6286993` (pre-dates f26b6469)
- **Two-Worlds A18** — Invoice views wrong base (`fi_invoices`/`sd_invoices`/`crm_invoices` FROM legacy `invoices`) — BLOCKED-OWNER, explicitly "same root as A1: AR aging reads `fi_invoices` (legacy) → understates ~85M"
- **Two-Worlds C2** — Receivables aging (`ar_aging` snapshot vs live `fi_invoices`) — QUEUED-NOT-STARTED
- **Two-Worlds C3** — Debtor amounts three-way (`ar_aging` vs `fi_invoices` vs `sales_orders` via SDDebitors) — QUEUED-NOT-STARTED
- **Two-Worlds Root-cause cluster 1** — "One fix (repoint `fi_invoices`/`sd_invoices`/`crm_invoices` + `ar-aging.handler`/`ap-aging.handler` to `finance_invoices`) closes A1, A18, C2, C3 at once" — this is word-for-word the fix that commit `f26b6469` appears to implement (per Master Status Board Active Loops).

No item in the Governance, Magic-Numbers, or Critical-Correctness inputs directly names `fi_invoices`→`finance_invoices` re-pointing (Governance B12 touches `finance_invoices` nullability, a related-but-distinct data-quality issue, not the legacy-table-read problem — leave that one as-is, not resolved by f26b6469).

**Action before closing these four rows:** confirm `f26b6469` actually updated `ar-aging.handler.ts` / `ap-aging.handler.ts` (and the `fi_invoices`/`sd_invoices`/`crm_invoices` views) rather than only a narrower slice of AR aging — the Two-Worlds audit's own proposed fix bundles all four sub-items together, so a partial fix could leave C3 (three-way debtor amounts) still diverged even if C2 (aging) is closed.
