# Phase 2 — 1,163-item build queue (working state, 2026-07-11)

Source: `FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md`. This is untracked working state
for the loop's resume point (Step 0.2 / Step 3).

## Priority order (golden-thread first)
MES(08) → QC(09) → WMS(10) → SD(06) → PP(07) → CC(20) → Coordination(04) → CRM(13)
→ Marketing(14) → Kanban(15) → IoT(16) → LMS(12) → Notifications(18) → Director(05)
→ POS(19) → MM(11). **SKIP AI(17) entirely.** **SKIP Org(01)/HR(02)/Finance(03)**
structural/razryad/salary/SoD items (module-level block overrides the doc's fast-pass
"Code-buildable-now" judgement).

## Module section offsets (in the master plan)
01 Org 31 · 02 HR 1481 · 03 Finance 2365 · 04 Coord 3682 · 05 Director 5407 ·
06 SD 6871 · 07 PP 8594 · 08 MES 10102 · 09 QC 11494 · 10 WMS 12547 · 11 MM 13797 ·
12 LMS 15119 · 13 CRM 16068 · 14 Marketing 17583 · 15 Kanban 18724 · 16 IoT 20878 ·
17 AI 22355 (SKIP) · 18 Notif 23392 · 19 POS 24901 · 20 CC 26182.

## ⚠️ Critical caveat discovered at Step 0 (affects the whole queue)
The doc's "Code-buildable-now" fast-pass label frequently means "buildable **once a new
table/column exists**". Under project rule **Q-35**, any new `CREATE TABLE`/`ALTER` is
**owner-gated** (pre-commit `check-unauthorized-migration` enforces it). So a large share
of "Code-buildable-now" items are in practice **schema-gated → owner-gated** and must be
logged to `_loop-open-questions`, NOT built. The genuinely-safe buildable subset =
items that work on the **existing** schema (the classify line says "no schema change
needed" or only wires existing columns/events). Each item's Step-1.2 re-read must confirm
this before building.

---

## MES(08) — 62 "Code-buildable-now" markers; triaged below

### Genuinely buildable on existing schema (no new table/column) — BUILD
- **Item 68** — time-based auto-alert for stopped machines (15/30 min). classify: "no
  schema change needed" — cron over `machine_status_logs.status='stopped'`
  (`status_started_at` present), reuse SOS escalation cron/notification pattern. → IN PROGRESS

### Schema-gated (needs new table/column/enum) → OWNER-GATED (Q-35), log, do not build
- Item 4, 17 (norma-versioning table) · 24 (format/gramm cols) · 25 (corrected-net class)
  · 28 (passport-power col) · 30 (bonus pipeline needs mes_shift_evaluations populated)
  · 33 (training boolean ALTER) · 34 (layer cols) · 36 (OEE-target settings TABLE)
  · 55/58/84/85 (per-station norm TABLE) · 83 (machine_crew_members child TABLE)
  · 86/87/97 (new DT-* downtime codes = seed, borderline) · 88 (dept master-data TABLE)
  · 89/90 (pure owner data entry) · 92 (equipment_department_assignments TABLE)
  · 94 (multi-machine model) · 95 (GsdStage enum extend + norm table)

### Depends-on-other-unbuilt-item (chain) → requeue after dependency
- Item 11/13 (needs norma link) · 14 (machine_crews GSD path) · 19/47 (needs current_stage
  populated, item 18) · 22 (downtime material-category listener — check if buildable on
  existing mes_downtime_reasons) · 23 (crew reassign endpoint) · 37 (breakdown→Kanban
  listener) · 39 (needs shift-plan page item 81) · 45 (IoT-camera cross-check) · 48
  (role-scoped shift-report) · 49 (2-signature Akt gate) · 77 (MES→Payroll event) · 81
  (new FE FormPage) · 93 (populate operator_id + board).

> Note: several "listener/event/endpoint" items (22, 23, 37, 48, 77, 93) MAY be buildable
> on existing schema — each needs an individual Step-1.2 live re-read before classifying.

## Modules 09–20 / 06 / 07 / 04 / 05 — NOT YET EXTRACTED
Extract per-module (same awk pairing) at resume, in priority order.
