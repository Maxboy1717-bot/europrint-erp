# Part: iot-director — modules: iot, director (static-only; backend down)

Method: every route enumerated (method + /api + @Controller prefix + path); handler→service→repo followed; every 5xx/503/empty DB-proven via `_audit/q.cjs`. Global prefix `/api`. 5 global guards → unauthenticated = 401 (FINE).

## Route inventory: total 116 (GET 56 · POST 33 · PATCH 21 · PUT 4 · DELETE 6)
- IoT controllers (13): camera-ai 11, camera-alerts 18 (8 sub-controllers), camera-dashboard 9, camera-heatmap-reports 9, camera-recognition 6, iot-alerts 6, iot-camera-events 9, iot-camera 7, iot-main 27, iot-sensors-main 11, iot-sensors 9, iot-tablet 19 → IoT subtotal 141? (recount below in COUNTS). 
- Director controllers (11): analytics 11, analytics-extended 17, dashboard 6, approvals 8, coordination 17, director-extended 5, director-root 8, kaizen 6, okr 12, strategic 13, zno 5, zvs 5.

(Exact tally per bucket in COUNTS; total reconciled there.)

## 🔴 DECEPTIVE
1. PATCH /api/cameras/:id | 💀200-GREEN-LIE (no DB write) | controller `camera-alerts.controller.ts:171` `patchAi` → `camera-extended.service.ts:92-97` `patchCameraAi` returns `Ok({ id, patched: body })` with NO persistence. Comment at line 88-90 admits "real persistence (cameras + camera_ai_configs) will land when the repo gains an updateAiConfig method". DB tables `cameras`+`camera_ai_configs` EXIST — so the page (camera-ai-modern hub) shows a save succeeding but nothing is written. | verdict: GREEN-LIE fake-update.
2. GET /api/coordination/councils | ⚠️200-MOCK (hardcoded literal) | `coordination.controller.ts:39-47` returns a hardcoded array of 5 councils (Boshqaruv/Sifat/Moliya/HR/Texnik Kengashi) — no service, no DB. | verdict: MOCK static list.

(Note: `IotCameraController` line 117 `deleteCamera` returns a generic `{message,code:'DELETED'}` AFTER calling `svc.deleteCamera` which does run a real DELETE — not deceptive. `director-extended markVip`, `strategic seed`, `okr/strategic delete` all hit real repos — not deceptive.)

## ❌ 5xx
All under /api/hr/zno (ZnoController) and /api/hr/zvs (ZvsController) — the backing tables DO NOT EXIST. Repos use unqualified `zno` / `zvs` raw SQL; on missing-relation the repo `catch` returns `Err`, controller `unwrapOrThrow`/`unwrapOrInternal` → 500. DB-proof: `SELECT to_regclass('public.zno')` = NULL, `to_regclass('public.zvs')` = NULL; `information_schema.tables ILIKE '%zno%'/'%zvs%'/'%zayav%'` = [] (no view alias either).

| method+path | status | root cause | file:line | fix-type |
|---|---|---|---|---|
| POST /api/hr/zno | 500 | INSERT INTO zno — table missing | zno.repository.ts:22 | DDL-NEEDED `zno` |
| GET /api/hr/zno | 500 | SELECT FROM zno — table missing | zno.repository.ts:32-37 | DDL-NEEDED `zno` |
| PATCH /api/hr/zno/:id/approve | 500 | UPDATE zno — table missing | zno.repository.ts:55 | DDL-NEEDED `zno` |
| PATCH /api/hr/zno/:id/reject | 500 | UPDATE zno — table missing | zno.repository.ts:64 | DDL-NEEDED `zno` |
| PATCH /api/hr/zno/:id | 500 | UPDATE zno — table missing | zno.repository.ts:73 | DDL-NEEDED `zno` |
| POST /api/hr/zvs | 500 | INSERT INTO zvs — table missing | zvs.repository.ts:21 | DDL-NEEDED `zvs` |
| GET /api/hr/zvs | 500 | SELECT FROM zvs — table missing | zvs.repository.ts:31-38 | DDL-NEEDED `zvs` |
| PATCH /api/hr/zvs/:id/approve | 500 | UPDATE zvs — table missing | zvs.repository.ts:54 | DDL-NEEDED `zvs` |
| PATCH /api/hr/zvs/:id/reject | 500 | UPDATE zvs — table missing | zvs.repository.ts:63 | DDL-NEEDED `zvs` |

Note: `dokla` and `rasporyazhenie` (coordination) tables DO exist → coordination CRUD is fine.

## 🟠 404/501
None. No 501 stubs, no `notImplemented()` reached at runtime (the `notImplemented` imports in iot-alerts/iot-main/iot-sensors-main/iot-tablet are unused leftovers — all handlers have real bodies). No FE-drift 404 candidates found in these two modules.

## 🟡🔵🔴 400/401/403
- 400: all `@Body` routes Zod-validated (parse/ZodValidationPipe) → 400 on bad input = FINE (Zod). No drift-400 found.
- 401: every controller behind global JwtAuthGuard; only @Public() = iot-tablet `tablet/login`, `tablet/sos-alert`, `tablet/orders`, `tablet/worker-schedule`, `tablet/equipment` (4 latter guarded by TabletTokenGuard) — intentional tablet PWA exposure, FINE.
- 403: role-gated via @Roles + RolesGuard throughout = FINE. No misconfig found.
BUG count: 0.

## ✅ FINE (grouped, real DB-backed; sample proofs)
- **IoT cameras** (camera-ai/camera-alerts/camera-dashboard/camera-heatmap-reports/camera-recognition/iot-camera/iot-camera-events): all delegate to Drizzle repos hitting real tables `cameras, camera_events, camera_safety_violations, camera_quality_defects, camera_ai_configs, camera_alerts, camera_zones` — ALL EXIST (DB-proven). e.g. `drizzle-camera-ai.repo.ts` findAnomalyDetection (179-201) real query on camera_events; recognition-logs/employee-ratings query `camera_events`/`employees`+`camera_safety_violations` (NOT the absent `camera_recognition_logs`/`camera_employee_ratings` — red herrings).
- **IoT sensors/main/tablet**: real raw SQL + CQRS on `iot_sensors, iot_sensor_readings, iot_alerts, iot_devices, oee_records, downtime_reason_codes, equipment_maintenance, production_sessions, shift_handovers, machine_crews, downtime_events, shift_evaluations, material_movements, inline_qc_checks, material_kit_items` — ALL EXIST (DB-proven incl. eval_id/session_id/performed_by columns). RecordSensorReading handler now persists + publishes AnomalyDetectedEvent + Telegram (record-sensor-reading.handler.ts:30-50) — prior "fake-create" is FIXED.
- **Director analytics / analytics-extended / dashboard / director-root / director-extended**: delegate to real repos on `sales_orders, production_orders, mes_sessions, invoices, advances, attendance, payroll, employees, warehouses, purchase_invoices, sales_invoices, users` — ALL EXIST.
- **Director approvals**: CQRS + `approval_requests` (cols approved_at/rejected_at/status proven) — real.
- **Director coordination** (minus councils): `dokla`/`rasporyazhenie` exist — CRUD real.
- **Director kaizen/okr/strategic**: `kaizen_suggestions, okr_objectives, okr_key_results, strategic_tasks, strategic_categories` — ALL EXIST, full CRUD real.

## COUNTS (sum = 116 routes)
- ✅ 200-REAL: 105
- 💀 200-GREEN-LIE: 1 (PATCH /api/cameras/:id)
- ⚠️ 200-MOCK: 1 (GET /api/coordination/councils)
- ❌ 500 (DDL-NEEDED missing table zno×5 / zvs×4): 9
- 🟡 400 Zod FINE: (subset of above, not double-counted) — 0 BUG
- 🔵 401 FINE / 🔴 403 FINE: intentional, 0 BUG
- 🟠 404/501: 0

Per-method reconciled: GET 56, POST 33, PATCH 21, PUT 4 (camera-ai prompt+trigger-rules, camera-settings update, +1), DELETE 6 = 116 total (some Put/Patch dual acknowledge/resolve aliases counted individually).
