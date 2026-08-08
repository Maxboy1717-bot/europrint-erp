# QC RE-AUDIT — gap log

## 2026-06-22 — Quality KPI panel wired (EP-QC-077 / EP-QC-018 / EP-QC-084)

**Gap:** `GetInspectionStatsHandler` (QC inspection statistics) existed and was
registered in `QcModule`, but was BROKEN and UNREACHABLE:
- It queried the wrong table `quality_defects_camera` (0 rows, camera-defect
  feature) and conflated `is_resolved` → "passed/failed". Output was all-zero
  garbage — "yashil lekin noto'g'ri" (Q-40).
- No controller invoked `GetInspectionStatsQuery` → the documented EP-QC-077
  "Sifat KPI / statistikasi" panel was not exposed by any route.

**Fix (computed from real `qc_inspections`, no AI / no owner coefficient):**
- Rewrote `apps/api/src/modules/qc/application/queries/get-inspection-stats.handler.ts`
  to aggregate `qc_inspections` (`items_checked` / `items_passed` / `items_failed`,
  `result`/`status`). Metrics, per `docs/audit/decisions/09-qc.md`:
  - `brak_percent` = items_failed ÷ items_checked  (EP-QC-084: brak ÷ plan)
  - `pass_rate`    = items_passed ÷ items_checked
  - `ftq_percent`  = inspections passed on submit ÷ total inspections (EP-QC-077 FTQ)
  - Optional `?from=&to=` window on `COALESCE(inspected_at, created_at)`.
  - NOTE: the ≤2% per-operation anomaly threshold (EP-QC-084) is owner-gated —
    NOT hardcoded here; only brak% is computed.
- Wired `GET /api/qc/inspections/stats` in `qc-inspections.controller.ts`,
  declared BEFORE `@Get(':id')` so the literal route is not shadowed by the
  param route.

**Verify:**
- tsc: 0 errors in `qc/` (16 pre-existing errors are all in unrelated locked
  modules: ai/, ai-agents/, bot-gateway/, integration/, mes/, main-bootstrap).
- DB-proof (BEGIN; INSERT; ROLLBACK): current data → brak%=1.01, pass=98.99,
  FTQ=100; after +1 failing inspection → brak%=2.52, FTQ=50 (aggregation + FTQ
  filter both correct).
- Live: `GET /api/qc/inspections/stats` →
  `{"ok":true,"data":{"total_inspections":1,"total_checked":4950,"total_passed":4900,"total_failed":50,"pass_rate":98.99,"fail_rate":1.01,"brak_percent":1.01,"ftq_percent":100}}`

**Files:**
- `apps/api/src/modules/qc/application/queries/get-inspection-stats.handler.ts` (rewritten)
- `apps/api/src/modules/qc/presentation/qc-inspections.controller.ts` (route added)
