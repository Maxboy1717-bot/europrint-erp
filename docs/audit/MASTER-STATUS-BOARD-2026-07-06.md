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

## Active Loops — Summary

| Loop | Scope | Status | Last commit(s) | Last updated | Notes |
|---|---|---|---|---|---|
| **i18n F2 / Combined Fix Loop (Parts 1-3)** | Part 1: Magic-Numbers (M1-M11, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`). Part 2: i18n 2-arg-helper migration (F1-F10, `docs/audit/I18N-FIX-LOOP-2026-07-05.md`). Part 3: Design/Layout QA (D1-D4, `docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`). | IN PROGRESS | `88d608d8`,`bb40788e`,`c8585cf7`,`7069d2f5`,`0a6c0b6`,`69c24222`,`891f9401` (+ earlier IoT/Warehouse chain `467b3207`..`d4f06bde`) | 2026-07-06 | Part 1 (corrected 2026-07-07 per `docs/audit/MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md` — MN-5, this row previously overstated M6/M9 as flatly "done"): M2/M3/M4/M7 done; **M6 now fully done (4/4, `5726e00a` closed the 2 remaining items — QC-lot fail-ratio + quarantine RM-MAIN/QC-HOLD routing — MN-1)**; **M9 config-schema gap now closed (`a09b2a3b`, MN-3)** — both the flat 150k/0.20 scheme (`wms-eoq.service.ts`) and the divergent ABC-tiered 50k scheme (`mrp-run-eoq.helper.ts`) are now independently settings-table-tunable via `getConfigNumber`; investigated and confirmed the 2 schemes are a genuine, deliberate methodology difference (not drift) — did not merge them, left which-is-canonical as an explicit owner decision; M11 partial (1/7 duplication clusters); M8 (role-catalog unification, ~70 files/759 uppercase literals) not started, confirmed NOT a live security issue (`roles.guard.ts` already case-insensitive + fail-closed since `21d775de`); M1/M5/M10 permanently skipped (GL/payroll/Aisha restriction — owner decision needed). **Part 2 F2's entire "2-language-only" bug scope is now CLOSED**: IoT/Warehouse/PlanningBoard/Barcode/Face-recognition/camera-ai-modern/wms-reservation/PapkaOrders all migrated (repo-wide grep confirms only intentional 2-state toggle buttons + legitimate DB-column fallbacks remain); `components/orders/WizardHeader.tsx` cluster and `pos-monitor/i18n/usePosI18n.ts` verified as pre-existing false positives (already 3-language-correct). F3 (Cyrillic DB column decision) and Tier 3-4 (F5 / F6 / F7 / F8 / F9 / F10) not started. **F4 (~470 BE exception messages) is now DONE** — see its own dedicated row in Active File/Module Claims below (513 sites across 37 module commits + 3 gap-fill commits + the global-exception.filter.ts special item). Part 3: D1 done (6 commits); D3 done (`69c24222`); D2 blocked on port 20806 (occupied by another session — retry periodically); D4 not started. |
| **Owner-Decisions** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Two-Worlds** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Critical-Correctness** | `docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md` — C1-C4 (payment race/no-tx, IoT tablet TTL, GL UTC date + varchar period-lock, invoice-number Date.now() collision) + HIGH/MEDIUM/LOW batches | **C1-C4 DONE. Part 2 ALL HIGH-severity DONE** (1.2 backend stopgap `6e86310c` + 1.4/1.5/6.1/6.2/8.1/8.2/8.3). Part 3 (35 MEDIUM/LOW) IN PROGRESS — see items below. **1.2-frontend follow-up NOT STARTED** (needs FE work, tracked as its own line above). | `6e86310c` (1.2 stopgap) | 2026-07-06 | **1.2** (`sd-payments.repository.ts`, `sd.dto.ts`): owner decided this is its own dedicated item — ship a backend-only debounce stopgap now (explicitly PARTIAL, not a full fix), track the full client-idempotency-key fix as a separate FE follow-up. Added a 7s debounce SELECT (order_id key, customer_id fallback for cash/unlinked sales, skipped when neither present) before the pre-existing overpay guard; an explicit `idempotency_key` in the body bypasses it (not persistently deduped — no schema backing, an accepted stopgap-only limitation). Live dry-run + 6/6 new tests PASS; full test/sd/ suite (204 tests) re-run, 3 pre-existing unrelated failures confirmed via git-stash. **1.2-frontend (NOT STARTED):** full fix needs the payment form to generate a client-side idempotency key (e.g. UUID cached per form-open) and resend it unchanged on retry/double-click — a frontend contract change outside this backend-only pass. **RESOLVED (817fa27c)**: owner decided "do not delete, re-link where sensible, flag unresolvable rows for manual review." Investigation found ZERO of the (now 99, grew from 84 as this is an ACTIVELY FIRING bug — see below) orphaned `okr_key_results` rows can be confidently relinked: 100% share an identical placeholder title ('KR1'), `created_by=2` has no matching `users` row, and `okr_objectives` itself only cycles through 3 generic titles with no distinguishing signal — forcing a relink would fabricate false provenance. All 99 rows flagged live via a `[NEEDS_REVIEW]` marker in the previously-empty `notes` column (idempotent UPDATE, no schema change, no deletion). **Root-cause note**: this repo's own test suite was grepped and ruled out (both OKR test files mock the DB/repo layer entirely) — the most likely ongoing source is a concurrent git worktree (`.claude/worktrees/green-lie-group1`) also touching the OKR module against this same shared dev DB; flagged for the owner rather than guessed at further. | `a7f0129e` (C1), `f4d17363`+`b29c8bce` (C2), `e6cebf7d` (C3), `cc3f8a9d`+`1e5802d9` (C4), `e8c5a1f6` (1.4), `7e8d7bd9` (1.5), `dfa2b1d7` (6.1), `4432944` (6.2), `12e6bd63` (8.1), `9f8a62e1` (8.2) | 2026-07-06 | **8.1+8.2** (`auto-barcode.{service,repository}.ts`, `pos-stock-issuable.{service,repository}.ts`): both findings share one root table — `pos_barcode_print_queue` is a plain-SELECT VIEW over base table `barcode_print_queue`, which had NO unique constraint on `barcode` at all (confirmed live: `ALTER TABLE` on the view itself is rejected by Postgres — "not supported for views" — had to target the base table). Added a live UNIQUE constraint on `barcode_print_queue.barcode` after a dry-run confirmed zero existing duplicates. 8.1's random-suffix generator and 8.2's COUNT(*)+1-then-existence-check allocator both now surface the Postgres 23505 code via `AppError.details.pgCode` and retry with a fresh barcode/sequence on collision (bounded: 3 attempts for 8.1, 5 full allocate+insert cycles for 8.2) — any other DB failure kind returns immediately, no infinite-retry risk. 4/4 + 4/4 new tests PASS; full `test/pos/` suite (117 tests) re-run clean both times. **6.2** (`okr.repository.ts`): `deleteObjective()` hard-deleted only `okr_objectives`; Drizzle schema declares `okrKeyResults.objectiveId` with `onDelete:'cascade'` but that migration was never applied live (`okr_key_results` has no FK on `objective_id` at all) — every objective delete orphaned its key results. Fixed with the same atomic `db.transaction` cascade pattern as 6.1 (no DDL). Live dry-run + 2/2 new tests PASS. **6.1** (`erp.repository.ts`): `deleteBomHeader()` hard-deleted only `bom_headers`; `bom_items` has no FK to `bom_headers` (only `component_id→material_cards`) — orphaned line items on every header delete. Same atomic-transaction-cascade fix (delete `bom_items WHERE bom_id=id` then the header, one `db.transaction`). Live dry-run (2-items + 0-items cases) + 3/3 new tests PASS. **1.5** (`pos-warehouse-integration-movement.service.ts`): `decreaseFromWarehouseStock()` had a fully unguarded UPDATE (no WHERE-quantity-check at all, worse than 1.4's incorrect-guard) after a stale pre-transaction SELECT in `validateOutboundStock()` — same TOCTOU class as 1.4. Same atomic guarded-UPDATE-with-RETURNING fix, this time preserving the existing PRD Q38 rule (ASSET hard-blocks on insufficient stock, CONSUMABLE allowed negative) via a guard clause with an `OR NOT EXISTS (...material_type='ASSET')` branch. Live dry-run covered all 5 permutations (ASSET suff/insuff, CONSUMABLE suff/insuff, missing row). 3/3 new tests PASS; confirmed pre-existing `barcode-warehouse.spec.ts` failure via git-stash is unrelated. **1.4** (`queries-wms.ts`, `drizzle-wms.repo.ts`): `reserveMaterial()`/`issueGoods()` wrote an unguarded ABSOLUTE new value after a stale SELECT snapshot — TOCTOU oversell under concurrent reservation/issue. Converted to the same atomic guarded-relative-delta UPDATE pattern already proven elsewhere (`execIssueFromWarehouseStock`, `saveStock()`'s tx-branch); functions now return boolean applied/not-applied, repo only decrements `remainingAmount` on success, falls through to next FEFO row otherwise. A live rollback-tx dry-run caught a real bug in the first-draft guard (ad-hoc issue could still oversell against reserved stock) before it shipped — fixed with a third guard term derived from the post-write non-negativity invariant. 5/5 new tests PASS (`test/wms/drizzle-wms.repo.oversell-guard.spec.ts`); confirmed via git-stash that 5 pre-existing unrelated WMS handler-spec failures predate this change. **C4 follow-on** (`1e5802d9`): after the first C4 commit, a fresh grep for `Date.now()` across `apps/api/src/modules/finance` found 3 MORE independent writers to `finance_invoices.invoice_number` sharing the exact same collision root cause — `finance-actions.repository.ts` (createApEntry/createArEntry, raw SQL) and `finance-ar.repository.ts`/`finance-ap.repository.ts` (Drizzle `.insert().values()`). All 4 writers now generate via `nextval('invoice_number_seq')`. 4/4 new tests PASS. Finding 1.3 is now closed across the whole finance module, not just one call site. | C1/C2: see prior entries. **C3** (`gl-posting.service.ts`): `new Date().toISOString().slice(0,10)` was UTC, mis-dating any GL post made 00:00-05:00 Tashkent time to the previous calendar day (and letting it slip past the period-lock a day early) — now uses `TashkentTimeService.formatDate(new Date())`. Confirmed the period-lock comparison itself (varchar ISO lexicographic BETWEEN) was ALREADY correct — only the date computation was the bug, audit framing partially wrong. 24/24 tests PASS (2 new, jest fake-timers proving the UTC-boundary case). **C4** (`drizzle-finance-invoice.repo.ts`, `finance-invoices.controller.ts`): `invoice_number` was `INV-${Date.now()}` with zero DB uniqueness enforcement — now server-side generated via the previously-dormant `invoice_number_seq` sequence (atomic, collision-proof), plus a live UNIQUE constraint added as a safety net (dry-run confirmed zero existing duplicates first). Controller no longer computes/returns a stale client-side number — uses the DB-RETURNING value. 2/2 new tests PASS; full finance suite re-run, same 4 pre-existing unrelated failures, zero new ones. Note: `finance-invoices.controller.ts` also carries an unrelated, not-yet-committed i18n Tier-2 F4 edit (error-message `this.i18n.t()` wrapping) that was already in the working tree — documented transparently in the C4 commit message, not claimed as this session's work. |
| **Org-Card Manual-Entry Remediation (G1-G12)** | `docs/audit/ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06.md` (Parts A-D) + `docs/migration/02-vysotskiy-7-tree.md` (vision) — G1 (HR role missing from write-guard), G2 (employee-assignment split across `employee_org_departments`/`employee_cards`), G3 (node_type vocabulary missing otdel/sektsiya/sektor), G4 (parent-picker + duplicate-card), G5 (legacy mirror-write in sync-helper.ts), G6 (two competing create entry-points), G7 (ЦКП/salary card→payroll wiring), G8 (course↔card binding), G9 (single-tree invariant, DECIDE), G10 (single canonical card table, DECIDE), G11 (mandatory-reason audit), G12 (BE-side confidential-field projection) | **LOOP CLOSED.** G1-G6 DONE + committed; G5 DEFERRED (documented, no code change — see note); G7/G8 verified ALREADY IMPLEMENTED (no action needed, audit doc was stale on this point); G9/G10 DECIDE-only, flagged not implemented; G11/G12 correctly scoped OUT of this pass (real, valuable, each needs its own dedicated session) | `8507126a` (G1), `82d24fe6` (G2), `0c3a9474` (G3), `db05b9b3`+`893c1c54` (G4), `879258e1` (G6) | 2026-07-06 | **G6** (`StubRoutes.tsx`, `AppRouter.tsx`): `/api/core/departments` (OrgDepartmentsPage's BE) already routes into canonical `org_departments` — not a real two-worlds split — BUT `createCoreDepartment()` never set `parent_id`, so every department made there became an orphan ROOT node, directly feeding G9's "14 roots" finding. Page had zero sidebar links (grep-confirmed unreachable except by direct URL) — redirected `/org-departments → /org-structure/hierarchy`, mirroring the same file's existing pattern for 6 other legacy org routes. `OrgDepartmentsPage.tsx` + `CoreDepartmentsCompatController` left in place as now-orphaned dead code (small, reversible change) — available follow-up cleanup, not required. typecheck 0 errors, check-sidebar-routes.mjs 285/285 PASS. **G7+G8 — VERIFIED ALREADY DONE, no commit needed:** grepped `computeGatedMonthlySalary`/`previewCardSalary` (payroll.service.ts) and `lms-card-gate.service.ts` — both are fully built AND wired into the live `closePeriod`/payroll-row-generation flow (ЦКП-gate + LMS-gate, "a card with allComplete=false withholds that card's salary"), landed in an earlier session (T7-09/T20-A1/EP-ORG-027 per in-code op-codes). The audit doc's "PARTIAL/MISSING — card→payroll unwired / course→card 0/5" framing was about **DATA sparsity** (courses.card_id owner-data not yet populated, tskp_target mostly 0), not missing code wiring — the mechanism is live and correctly fails open ("no course bound = no block", not a fabricated pass, per Q-40). Re-implementing would have been pure duplicate work. **G9/G10** — DECIDE-only per the directive, not implemented: both are the Two-Worlds loop's own root-cause-cluster-3 (KARTA-centric org unification, IN-PROGRESS 40%, commit `d89c87de`) under a different name; flagging here rather than re-solving. **G11 (mandatory-reason audit) / G12 (BE-side confidential-field projection)** — verified genuinely still open (no existing `reason` field on the update DTO; `findOne` returns full node unfiltered by role) and NOT claimed by any other loop on this board — correctly scoped out of this pass rather than rushed; each is a real, self-contained follow-up (G11: add `reason` param + `razryad_history`-style audit row on salary/razryad edits; G12: role-based response projection in `OrgStructureService.findOne`/list). | **G5 (legacy mirror-write in sync-helper.ts) — DEFERRED, no commit, by design:** investigated per the directive's own instruction ("If any live reader exists... do not guess"). Found **8+ genuine live readers** of `positions`/`departments` that would silently go stale if `syncToCoreTable()` stopped writing: `succession-compat.service.ts:79-80` (succession-plan readiness), `employees-payload.adapter.ts:76,82` (employee create/update FK validation), `employees-org-assignment.helper.ts:111` (`positions.rbac_tier` — **derives the operator's RBAC ROLE**, 100%-populated/96-96 rows, load-bearing), `dashboard-query.repository.ts:96-97` (director dashboard stats), `analytics.repository.ts:106,126` (position/department leaderboards), `position-permissions.repository.ts:19,37` (permissions repo — full-table Drizzle reads), `positions.repository.ts:17,26` (the `/api/positions` CRUD backing repo itself, still live), `career-path.repository.ts:132` (HR career-path feature), `erp-camera.repository.ts:68` (camera analytics by department). Stopping the mirror-write today would break RBAC role derivation, director dashboards, succession planning, analytics leaderboards, and camera reports — this is NOT a small follow-up, it is genuinely schema-migration-scale (repointing 8+ files' SQL to `org_departments`' different column shape). Cross-checked Two-Worlds root-cause-cluster-3 (KARTA-centric org unification, IN-PROGRESS 40%, commit `d89c87de`) — confirmed that commit was purely additive (new columns on `org_departments`, non-destructive) and did NOT touch `sync-helper.ts` or any reader, so this finding is not duplicate work, it is a genuinely new, still-open sub-item of that same cluster. Recommendation for whoever picks this up: repoint the 8 readers to `org_departments` FIRST (one file at a time, each with its own test), THEN stop the mirror-write as the final step — never the reverse order. | G4 (`ParentCardSelect.tsx` new + `AddNodeDialog.tsx`/`TreeCanvas.tsx`/`TreeNodeCard.tsx`/`OrgStructureHierarchy.tsx`/`.claude/launch.json`): parent-picker reuses the ManagerSelect.tsx combobox pattern (Radix Popover+cmdk), sourced from `/nodes/flat?limit=1000`; duplicate-card adds a Copy-icon button that pre-fills AddNodeDialog from the source card (name+suffix, nodeType, tskp, razryadLevelId, same parentId via a new child→parent lookup built once per TreeCanvas render) — salary/rbac/schedule fields intentionally stay blank (not on the lightweight tree-node object), an honest partial-clone, not full. Live click-through UI verification was blocked by a concurrent session occupying port 20806 (same as the pre-existing "D2 blocked" note above) — fell back to Q-32 static verification: typecheck 0 errors, i18n-leak-detector at baseline (262), backend 401 (not 500) on the unauthenticated flat-nodes probe confirming the route/guard resolve correctly, and a code-trace of `org-queries.repo.ts`'s SELECT columns confirming the API response shape matches what the picker expects. | G3 (`components/hr/org/types.ts`, `components/hr/orgnode/types.ts` + new `nodeTypeLabels.test.ts`): confirmed pure FE fix (no DB CHECK, no Zod enum on `nodeType`) — added otdeleniye/otdel/sektsiya/sektor to both NODE_TYPE_LABELS maps (kept in sync per existing code comment). 3/3 new tests PASS; live rollback-tx dry-run proved all 4 values insert cleanly. G1 (`org-structure.controller.ts` + new `test/org-structure/org-structure.controller.roles.spec.ts`): class-level `@Roles(...)` was gating BOTH reads and writes with the same list (omitted hr/hr_manager, included viewer). Now the class-level list is a READ baseline (hr/hr_manager added, viewer kept); 11 write methods (create/update/delete/move/assign/folder/hr-request/portret) got a narrower per-method `@Roles` override dropping viewer. 14/14 new tests PASS (Reflect metadata inspection), 20/20 full org-structure suite PASS. G2 (`org-mutations.repo.ts` + new `test/org-structure/org-mutations.repo.assign-dual-write.spec.ts`): `assignUser()`/`removeUser()` now dual-write/soft-remove `employee_cards` alongside `employee_org_departments` — live FK confirmed `employee_cards.card_id → org_departments.id` (same id-space as nodeId) and `employee_cards.employee_id → employees.id` (resolved from userId via the employees.user_id/users.employee_id bidirectional bridge already used in razryad-history.repository.ts). Idempotent `ON CONFLICT (employee_id, card_id) WHERE is_active DO NOTHING` (live unique index confirmed). 2/2 new tests PASS; full HR+finance+org-structure suite re-run — 7 pre-existing unrelated failures (payroll.service/cashier-payroll/cashier-hub/drizzle-reports/gl.service/drizzle-hr-vacancies/create-employee.handler), zero org-structure/org-mutations failures. G9/G10 are DECIDE-only (cross-reference Two-Worlds loop, no implementation) — will flag in the final report, not implement. |
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
| Magic-Numbers | Finding #10: Role-name case drift, dead @Roles (~60 files) | QUEUED-NOT-STARTED (= M8, MN-2 below) | n/a | 0% | Confirmed NOT a live security issue (`roles.guard.ts` already case-insensitive + fail-closed since `21d775de`, predates this finding) — code-hygiene debt only, not an authorization vulnerability. ~70 files / 759 uppercase literals per `MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md` |
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
| i18n | F1 — Centralize number/date/currency formatting | QUEUED-NOT-STARTED | n/a | 0% | All Tier 1/2/3 subsequent items |
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
| Design-QA | HR: InspectionPage hardcoded light colors break dark mode | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: HRBrandPage/CandidateReport hardcoded text-gray-900 | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: HROffboarding duplicate sm: breakpoint | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: Compact-header family no flex-wrap | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | HR: HRMap fixed height map (uncertain) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | HR: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | Production: DesignOrderDetail gradient never renders | QUEUED-NOT-STARTED | n/a | 0% | n/a |
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
| Design-QA | Finance/Director: AgentsHub duplicate lg: grid bug | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: DirectorExtended missing h-full under overflow-hidden | QUEUED-NOT-STARTED | n/a | 0% | 6 director routes |
| Design-QA | Finance/Director: agent dashboards hand-rolled KpiBox | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: KpiThresholdConfig etc. custom header | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | Finance/Director: FinanceExtendedTabsExtra placeholders (allowed) | UNKNOWN | n/a | 0% | n/a |
| Design-QA | Finance/Director: kanban DashboardPanel bounded scroll (acceptable) | DONE | n/a | 100% | n/a |
| Design-QA | Finance/Director: No BROKEN pages (verified sound) | DONE | n/a | 100% | n/a |
| Design-QA | CRM: SDSalesOrders fixed w-80 sidebar no mobile stacking | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | CRM: CRMWorkspace 7-day calendar collapses to 2 columns | QUEUED-NOT-STARTED | n/a | 0% | n/a |
| Design-QA | CRM: SecurityExtended TabsList overflow no wrap | QUEUED-NOT-STARTED | n/a | 0% | n/a |
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
| Design-QA | Admin/LMS: AgentsHub duplicate lg:grid-cols (dup of Finance finding) | QUEUED-NOT-STARTED | n/a | 0% | n/a |
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
| Two-Worlds | Root-cause cluster 3 — KARTA-centric org unification | IN-PROGRESS | d89c87de | 40% | A7. Subsumes Org-Card G9 (single-tree invariant — 14 roots unresolved, otdeleniye_no 1-7 not enforced) and G10 (single canonical card table — org_departments/org_functions/departments still parallel, employee carries 3 pointers) for tracking purposes: independently re-verified (2026-07-06) these are the SAME unimplemented consolidation under a different name, not duplicate-of-already-done work — d89c87de was purely additive (new columns on org_departments only) and no later commit has retired positions/org_functions or enforced a single tree. Still 0% built beyond the additive schema groundwork. G5 (Org-Card's legacy sync-helper.ts mirror-write removal, 8 named readers) stays a SEPARATE tracked item — confirmed genuinely distinct, not covered by this cluster or any commit since (verified via git log/diff on all 8 reader files). |
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
| Two-Worlds | Role-catalog finalization (~36 catalogs) | IN-PROGRESS | n/a | 20% | n/a |
| **VISION-3340 BACKLOG (226 open items, 835 total)** | | | | | |
| VISION-3340 | SUMMARY-TOTAL | IN-PROGRESS | n/a | 17% DONE/46% OPEN/27% PARTIAL/10% UNVERIF | n/a |
| VISION-3340 | AREA-01-CKP (54 items) | IN-PROGRESS | n/a | ~31% resolved | n/a |
| VISION-3340 | AREA-02-HR (54 items) | IN-PROGRESS | n/a | ~24% resolved | n/a |
| VISION-3340 | AREA-05-AUTH (44 items) | IN-PROGRESS | n/a | ~9% resolved | n/a |
| VISION-3340 | AREA-07-GOLDEN-THREAD (20 items) | IN-PROGRESS | n/a | ~45% resolved | n/a |
| VISION-3340 | AREA-06-PP (46 items) | IN-PROGRESS | n/a | ~11% resolved | n/a |
| VISION-3340 | AREA-08-IOT (69 items) | IN-PROGRESS | n/a | ~12% resolved | n/a |
| VISION-3340 | AREA-11-QC (54 items) | IN-PROGRESS | n/a | ~19% resolved | n/a |
| VISION-3340 | AREA-15-CRM (51 items) | IN-PROGRESS | n/a | ~6% resolved | n/a |
| VISION-3340 | AREA-14-SD (50 items) | IN-PROGRESS | n/a | ~4% resolved | n/a |
| VISION-3340 | AREA-13-WMS (49 items) | IN-PROGRESS | n/a | ~10% resolved | n/a |
| VISION-3340 | AREA-09-REPORTS (43 items) | IN-PROGRESS | n/a | ~9% resolved | n/a |
| VISION-3340 | AREA-03-LMS (40 items, highest resolved rate) | IN-PROGRESS | n/a | ~53% resolved | n/a |
| VISION-3340 | AREA-04-ORG-STRUCTURE (40 items) | IN-PROGRESS | n/a | ~13% resolved | n/a |
| VISION-3340 | AREA-20-FINANCE (40 items, read-only) | IN-PROGRESS | n/a | ~10% resolved | n/a |
| VISION-3340 | AREA-12-AI (33 items) | IN-PROGRESS | n/a | ~18% resolved | n/a |
| VISION-3340 | AREA-19-RAZRYAD (33 items) | IN-PROGRESS | n/a | ~24% resolved | n/a |
| VISION-3340 | AREA-10-MES (32 items) | IN-PROGRESS | n/a | ~13% resolved | n/a |
| VISION-3340 | AREA-18-MASTER-DATA (31 items) | IN-PROGRESS | n/a | ~35% resolved | n/a |
| VISION-3340 | AREA-16-FRONTEND (27 items) | IN-PROGRESS | n/a | ~4% resolved | n/a |
| VISION-3340 | AREA-17-SECURITY (25 items, final area) | IN-PROGRESS | n/a | ~8% resolved | n/a |
| VISION-3340 | (835 individual SB-numbered items: SB0001-SB0835) | MIXED | n/a | see per-item | Full item-level detail omitted here for space; see source doc VISION-3340-RECONCILIATION-2026-07-04.md — notable items: SB0312 (0 live `operator` role users) blocks every downstream tablet/shift/GSD/sensor-session workflow; SB0445 (aql_standards/sort_grade_pricing tables absent) blocks 6+ other QC findings; SB0421 (no routing version/effective-date) blocks norma-change-affects-next-batch vision requirement; SB0691 (no --mod-org/--ep-org-l0..l6 tokens) blocks org-level visual differentiation |
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
| Critical-Correctness | 1.9 GL findEntryIdByReference-then-insert (safe) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 1.10 Kanban MAX(sort_order)+1 (acceptable) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 2.1 GL entryDate UTC day instead of Tashkent | DONE | e6cebf7d | 100% | GL entry mis-dating; #5 top-10 (C3) |
| Critical-Correctness | 2.2 GL period lock raw text compare, no cast normalize | DONE | 9919dc92 | 100% | GL posting into closed period; #5 top-10 (C2) |
| Critical-Correctness | 2.3 CKP 16h deadline anchored UTC midnight | BLOCKED-OWNER-DECISION | n/a | 0% | Fixing anchors deadline 5h earlier (16:00 not 21:00 Tashkent) — live payroll-gate business-rule change, needs owner sign-off before touching ckp-gate.ts + ckp-fact.service.ts in lockstep |
| Critical-Correctness | 2.4 Two 'today' conventions coexist (Tashkent vs UTC) | DONE (verified stale) | e6cebf7d | 100% | GL half fixed under C3; cashier cron was never broken; remainder is fully subsumed by 2.3 |
| Critical-Correctness | 2.5 sd-quotations getMonth() OS-local/UTC | DONE | 44cd0814 | 100% | n/a |
| Critical-Correctness | 2.6 addDays() not TZDate-wrapped | DONE | 37623cda | 100% | n/a |
| Critical-Correctness | 3.1 GL balance check unrounded vs rounded (latent) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 3.2 delivery-completed float math (exact by construction) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 3.3 payroll multi-step float division/resum (tolerance holds) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 3.4 payroll-closure tolerance aligned (correct guard) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 3.5 sd-quotations independently-rounded mismatch (display only) | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 3.6 gl-posting postDeliveryCompleted (exact, already correct) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.1 legacy.service.ts sql.raw(rawQuery) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.2 schema.ts ddlRun DDL_PREFIX_RE guard | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.3 invariants.ts static-migration-only sql | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.4 aisha compare-periods.tool allowlist (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.5 doc-sequences.helper allowlist regex (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.6 supplier-rating.repository integer coercion (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.7 admin-extra.repo parameterized dynamic-WHERE (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 4.8 ORDER BY hardcoded column refs (safe) | DONE | n/a | 100% | n/a |
| Critical-Correctness | 5.1 record-payment 3 writes no transaction | UNKNOWN | n/a | 0% | Invoice paid with no ledger entry on GL failure; #1 top-10 |
| Critical-Correctness | 5.2 iot-tablet 3 db.execute no tx | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 5.3 iot-tablet material_movements/warehouse_stock no tx | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 5.4 warehouse-config 3 raw calls no tx | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 5.5 pos-inventory-count for-loop no all-or-nothing tx | UNKNOWN | n/a | 0% | n/a |
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
| Critical-Correctness | 8.6 pos-barcode scan no is_active/status gate | UNKNOWN | n/a | 0% | n/a |
| Critical-Correctness | 8.7 barcode-warehouse movement_number timestamp collision | UNKNOWN | n/a | 0% | n/a |
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
