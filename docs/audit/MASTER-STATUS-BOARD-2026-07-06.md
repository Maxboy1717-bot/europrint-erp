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
| **i18n F2 / Combined Fix Loop (Parts 1-3)** | Part 1: Magic-Numbers (M1-M11, `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md`). Part 2: i18n 2-arg-helper migration (F1-F10, `docs/audit/I18N-FIX-LOOP-2026-07-05.md`). Part 3: Design/Layout QA (D1-D4, `docs/audit/DESIGN-QA-FULL-AUDIT-2026-07-05.md`). | IN PROGRESS | `05399144`,`9f22ec60`,`d4f06bde` (see loop's own commit chain for full list) | 2026-07-06 | Part 1: M2/M3/M4/M6/M7/M9/M11(partial) done; M1/M5/M10 permanently skipped (GL/payroll/Aisha restriction — owner decision needed). Part 2: F1 done; F2 in progress — IoT (14/14 files) + Warehouse (6/6 files) fully migrated; PlanningBoard/Barcode/Face-recognition/camera-ai/misc (~25 files) remaining. Part 3: D1 done (6 commits); D2 blocked on port 20806 (occupied by another session — retry periodically); D3/D4 not started. |
| **Owner-Decisions** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Two-Worlds** | (per addendum reference — scope not yet documented by that loop in this file) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |
| **Critical-Correctness** | Likely corresponds to `docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md` (untracked as of this write) | UNKNOWN | — | — | This loop hasn't written a row yet as of 2026-07-06. If you are that loop, please fill this in. |

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
| i18n F2 | `pages/PlanningBoard*.ts(x)`, `pages/planning/**`, `pages/usePlanningBoardActions.ts` (7 files) | claimed | in progress |

---

## Revision Log

- 2026-07-06 — File created by the i18n F2 / Combined Fix Loop (no prior
  version existed; no established format found to mirror, so this loop
  authored a minimal one). Seeded with i18n F2's own progress; other loops'
  rows left as placeholders for them to fill in.
