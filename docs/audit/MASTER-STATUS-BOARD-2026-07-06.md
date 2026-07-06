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
| **i18n F2 / Combined Fix Loop (Parts 1-3)** | Part 1: Magic-Numbers (M1-M11, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`). Part 2: i18n 2-arg-helper migration (F1-F10, `docs/audit/I18N-FIX-LOOP-2026-07-05.md`). Part 3: Design/Layout QA (D1-D4, `docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`). | IN PROGRESS | `88d608d8`,`bb40788e`,`c8585cf7`,`7069d2f5`,`0a6c0b6`,`69c24222`,`891f9401` (+ earlier IoT/Warehouse chain `467b3207`..`d4f06bde`) | 2026-07-06 | Part 1: M2/M3/M4/M6/M7/M9/M11(partial) done; M1/M5/M10 permanently skipped (GL/payroll/Aisha restriction — owner decision needed). **Part 2 F2's entire "2-language-only" bug scope is now CLOSED**: IoT/Warehouse/PlanningBoard/Barcode/Face-recognition/camera-ai-modern/wms-reservation/PapkaOrders all migrated (repo-wide grep confirms only intentional 2-state toggle buttons + legitimate DB-column fallbacks remain); `components/orders/WizardHeader.tsx` cluster and `pos-monitor/i18n/usePosI18n.ts` verified as pre-existing false positives (already 3-language-correct). F3 (Cyrillic DB column decision) and Tier 2-4 (F4 ~470 BE messages / F5 / F6 / F7 / F8 / F9 / F10) not started — F4 in particular is a large, separate undertaking. Part 3: D1 done (6 commits); D3 done (`69c24222`); D2 blocked on port 20806 (occupied by another session — retry periodically); D4 not started. |
| **Owner-Decisions** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Two-Worlds** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Critical-Correctness** | `docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md` — C1-C4 (payment race/no-tx, IoT tablet TTL, GL UTC date + varchar period-lock, invoice-number Date.now() collision) + HIGH/MEDIUM/LOW batches | **BLOCKED — waiting on i18n Tier-2 F4 claim above** | — | 2026-07-06 | All 4 CRITICAL items touch files under `apps/api/src/modules/**` (finance, iot) — directly inside the i18n F4 claim's "do not edit" scope above. Holding PLAN/investigation only (read-only) until that claim clears; will not commit code into `apps/api/src/modules/**` until then. |
| **Accounting-Standards / Finance GL Remediation (F1-F11)** | `docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md` + `docs/audit/FINANCE-FULL-AUDIT-2026-07-06.md` — F1 (purge garbage GL row), F2 (data-quality gate), F3 (unify 2 bespoke writers: payroll, POS), F4 (AR/AP aging → canonical `finance_invoices`), F5 (creator/approver columns), F6 (real CBU feed + currencies reconciliation + POS 1:1 default removed), F7 (SoD — flagged, owner-data blocked), F8 (depreciation → GL), F9 (manual-JE draft→review→post gate), F10 (trial-balance PDF export), F11 item 1 (recurring JE templates, done+tested, **commit pending**) | 10/11 sub-items DONE + committed; F7 flagged (owner data); F11 items 2-3 (year-end close, FX revaluation) proposed only, not built (explicitly deferred per the owner's own "don't assume all three equally urgent") | `f25e8811`,`3508537d`,`9b04fd3f`,`b42ab33f`,`495c8128`,`f26b6469`,`53ab2edd`,`99f019c2`,`e9495c09`,`064852ad`,`7a7a09a2`,`0461eb5f`,`4ed79e1e` | 2026-07-06 | **CONFLICT FLAGGED**: F11 item 1's finished, tested code sits uncommitted in `apps/api/src/modules/finance/application/finance-accounting.service.ts` + `apps/api/src/modules/finance/presentation/finance-main-actions.controller.ts` (staged, ready) — both files are inside the i18n F4 claim's `apps/api/src/modules/**` scope. Holding the commit until that claim clears rather than racing it (these files also contain several `throw new BadRequestException("...")`-style hardcoded messages from F9/F11 that F4's workflow may target for i18n conversion — a real edit-collision risk, not just a lock-timing one). Sanity check after every commit: `entries` table 6 rows, ΣDebit=ΣCredit=140,344,273 UZS, unchanged throughout. |

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
| i18n Tier 2 F4 | `apps/api/src/modules/**` + `apps/api/src/common/guards/**` + `apps/api/src/lib/**` + `apps/api/src/shared/db/**` (backend hardcoded exception messages, 486 confirmed sites across 36 module/dir groups, editing shared `apps/api/src/i18n/{uz,ru,uz-cyr}/{errors,validation}.json` — **do not edit these locale files or any `apps/api/src/modules/**` file until this claim is marked done**, to avoid racing a sequential background workflow) | IN PROGRESS | Step 0 done (486 sites confirmed, ~470 estimate matched); background workflow `wf_4a49d49b-6fd` running all 36 module batches sequentially (largest-first: pos 111 → compatibility 78 → hr 56 → ... → chat 1); global-exception.filter.ts special item not started yet |
| Accounting-Standards/Finance (F1-F11) | `apps/api/src/modules/finance/application/finance-accounting.service.ts`, `apps/api/src/modules/finance/presentation/finance-main-actions.controller.ts` (F11 recurring-JE-template additions — `createRecurringTemplate`, `createRecurringGlTemplate` route) | **WAITING (respecting i18n F4's claim above, not editing further)** | uncommitted, staged — will commit once i18n F4's `apps/api/src/modules/**` claim clears |
| Accounting-Standards/Finance (F1-F11) | Everything else in `apps/api/src/modules/finance/**`, `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts`, `apps/api/src/modules/pos/infrastructure/repositories/gl-posting-log.repository.ts`, `apps/api/src/modules/pos/application/services/pos-movement.service.ts`, `apps/api/src/modules/compatibility/asset-management.service.ts`, `apps/api/src/cron/currency-rates.cron.ts`, `apps/api/src/cron/recurring-journal-entries.cron.ts` (F1-F10 + F11 item 1, all already committed before this claim was discovered) | done (already committed, listed for visibility only — no further edits planned unless the owner redirects) | see commit hash list in the loop's summary row above |

---

## Revision Log

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
