# MES + its IoT table (`mes_telemetry`) — Deep Dive

**Date:** 2026-07-04
**Type:** Read-only investigation. No code modified, no migrations, nothing committed.
**Table identified:** **`mes_telemetry`** — the single IoT-related table consumed by the MES layer.

---

## Step 0 — table identity

| Property | Value |
|----------|-------|
| **Name** | `mes_telemetry` |
| **Drizzle export** | `mesTelemetry` at `apps/api/src/shared/db/schema-db-only-generated.ts:532` — note it lives in the **db-only generated** barrel, NOT the canonical `lib/db/src/schema` barrel. Because of that, every app read/write uses **raw parameterized SQL**, not the ORM ("Parameterized SQL (Drizzle barrel lacks mes_telemetry)" — `record-sensor-reading.handler.ts:75`). |
| **Columns** | `id` uuid PK · `machine_id` text NOT NULL · `metric_type` varchar(100) · `metric_value` numeric(14,3) · `value` numeric(14,3) · `recorded_at` timestamptz NOT NULL · `created_at` timestamptz NOT NULL (`schema-db-only-generated.ts:532-542`) |
| **Live creation** | Not in a normal migration — created at boot by the drift-invariant `migrations-drift.ts:3115-3125` (`CREATE TABLE IF NOT EXISTS` + `recorded_at` DESC index). The comment records it was *"never created in the live DB, so every tick errored 'relation mes_telemetry does not exist' — flooding logs (6900+ lines)"* until this invariant was added (2026-06-01). |
| **Live row count** | **0** — confirmed live in `VISION-3340-RECONCILIATION-2026-07-04.md` SB0317 (*"both source tables (mes_telemetry, iot_sensor_readings) confirmed empty"*). Not re-queryable this pass (Docker/PG container is down); corroborated by `pp-equipment.repository.ts:211` (*"holds only seed/demo rows"*). |

**Every read/write call site of the table:**
- **WRITE** — `apps/api/src/modules/iot/application/commands/record-sensor-reading.handler.ts:80-83` (`feedMesTelemetry`, raw `INSERT INTO mes_telemetry ...`). This is the **only** writer.
- **READ** — `apps/api/src/modules/ai-agents/mes/mes-monitor.service.ts:80-85` (`AiMesMonitorService.runTelemetryCheck`, raw `SELECT ... FROM mes_telemetry`). This is the **only** reader.
- **DELIBERATE NON-READ** — `apps/api/src/modules/pp/infrastructure/repositories/pp-equipment.repository.ts:210-213` returns `telemetry: []` with an honest note instead of surfacing the table.
- **Docs/comments only** (no runtime access): `schema-db-only-generated.ts:50`, `i-pp-equipment.repo.ts:18`, `migrations-drift.ts:3109`.

---

## Findings table

| # | Question | Status | Evidence (file:line / row count) | Notes |
|---|----------|--------|----------------------------------|-------|
| 0 | Exact table name & columns | **REAL** | `schema-db-only-generated.ts:532`; created via `migrations-drift.ts:3116` | 7 columns; dual `metric_value` + `value` (writer fills both; reader uses `value`). |
| A1 | Is there a real write path, or schema-only? | **REAL (path) / EMPTY-DATA (rows)** | Writer `record-sensor-reading.handler.ts:80`; rows = 0 (SB0317) | Exactly **one** writer exists and is wired; it just receives no data. |
| A2 | Trace the write path fully | **REAL** | Endpoint `POST /api/iot/devices/:id/readings` (`iot-sensors.controller.ts:126`, `@Controller('iot')`, RBAC `OPERATOR/TECHNOLOGIST/SUPER_ADMIN`, Zod `RecordReadingDtoSchema`) → `RecordSensorReadingCommand` → handler persists to `iot_sensor_readings` (repo) **and** raw-INSERTs `mes_telemetry` (`:44`, `:80`) | Captures `machine_id`(=deviceId), `metric_type`(=unit), `metric_value`+`value`, timestamps via DB default. Telemetry feed is **non-fatal** (try/catch logs, never rolls back the primary reading). |
| A3 | Real device integration or manual API stand-in? | **PARTIAL (manual stand-in)** | `iot-sensors.controller.ts:128-134` — a plain HTTP `@Post` | It is a **generic HTTP ingest**, not a hardware integration. No MQTT/CoAP/serial/gateway listener feeds it; `IotGateway` (WebSocket) is confirmed **never registered** as a provider (dead code, SB0315). A human/script must POST readings. Controller passes `deviceId` as both device and machine id. |
| B4 | Is there a real read path / downstream calc? | **REAL** | Reader `mes-monitor.service.ts:78-96` | A 30s `setInterval` cron (`:66`) SELECTs `machine_id, value` over a 1-minute rolling window and runs **per-machine z-score anomaly detection** (`detectAnomaly` `:131`, `computeZScore` `:169`). Can AUTO_STOP a machine (`UPDATE mes_work_orders SET status='PAUSED'` `:202`) and log to `ai_decision_log`. |
| B5 | Does the calc handle 0/few rows honestly, or fabricate? | **REAL (honest empty)** | `mes-monitor.service.ts:86-92`; `computeZScore:169-176` via `safeDiv/stddev/safeAvg` | Empty result → `rows=[]` → the `for` loop is a **no-op**; nothing is fabricated. With one data point, `stddev=0` and `safeDiv` guards div-by-zero → `z=0`, **no false anomaly**. No mock, no plausible-looking fake output. |
| B6 | Frontend page displaying this table's data? | **STUB (none)** | `IoTDashboard.tsx:32-70` queries `/api/iot-sensors/{dashboard,live,readings,oee}` — a **different** table family | `mes_telemetry` has **no read API endpoint at all** — only the internal cron reads it. **No FE page shows `mes_telemetry` data.** (Confirmed by grepping the FE for the table/route — zero hits.) |
| C7 | Linked to `production_sessions` / `downtime_events` by FK? | **STUB (no link)** | `schema-db-only-generated.ts:532-542` — no `session_id`, no `order_id`, no FK | Keyed only by `machine_id` (free text). It is an **orphan stream table** — not joined to `production_sessions` or `downtime_events`. The only downstream use of its `machine_id` is the cron's `mes_work_orders` UPDATE (a different table). |
| C8 | Does the MES golden thread depend on it? | **STUB (independent)** | Golden thread SD→PP→**MES**→QC→WMS→FIN; session lifecycle in `production_sessions` (mes-schema), not telemetry | **No.** Session start → material consumption → stop → QC handoff all function with zero telemetry rows. The anomaly monitor is a **side-channel safety feature**, purely supplementary/optional — not a step in the production flow. |
| C9 | Is this the table behind the mocked `agents/iot/*` endpoints? | **REAL (separate, not the mock)** | `agents/iot-agent.service.ts:7,48-67` (post-Q29 `fc0ecf3b`) reads `iot_sensors`/`iot_sensor_readings`; it never references `mes_telemetry` | **Distinct systems.** The previously-mocked `agents/iot/*` endpoints were rewired to `iot_sensor_readings` (also empty) — **not** `mes_telemetry`. `mes_telemetry` is a genuinely separate, real (schema+code) table fed by the real sensor handler and read by the real anomaly cron. Do **not** conflate them. |

---

## Plain verdict

**`mes_telemetry` is REAL and fully wired end-to-end in code — but EMPTY in practice (0 live rows), so it is not exercised in any production flow today.** It has exactly one genuine writer (`POST /api/iot/devices/:id/readings` → `feedMesTelemetry`) and exactly one genuine reader (the 30-second `AiMesMonitorService` z-score anomaly cron), and the reader handles the empty case **honestly** — it silently processes zero rows and fabricates nothing. It is therefore **not** schema-only, **not** a mock, and **not** dead/orphan *code*; it is a correct-but-starved feature. Its only weakness is that no hardware or gateway actually pushes readings (the write endpoint is a generic manual HTTP ingest, and the WebSocket `IotGateway` is dead), so the anomaly monitor loops over nothing every 30s. It is also structurally decoupled from the rest of MES: no FK to `production_sessions`/`downtime_events`, and the golden thread does not depend on it at all.

## Real but empty — what data must start flowing

For `mes_telemetry` to become meaningful, physical machine sensors (vibration / temperature / current) must be installed and wired to POST readings to **`POST /api/iot/devices/:id/readings`** with `{ value, unit }` for a **registered** IoT device (`iot_sensors` currently 0 rows, SB0316). Concretely the prerequisites are: (1) seed real `iot_sensors` device rows; (2) a device/gateway (or a bridge script) that emits readings on an interval — today nothing does; (3) ideally revive the dead `IotGateway` or add an MQTT/HTTP bridge so ingest is automatic rather than manual. Once even one machine streams readings, the existing z-score cron begins detecting anomalies and can auto-pause `mes_work_orders` — all of that logic already exists and works; it is purely input-starved. (Note the adjacent blocker SB0312: `users` has 0 `operator`-role rows, so the shop-floor tablet that would drive device activity also has no one to log in.)

## Recommendation (do not act this pass)

**Keep it — do not remove.** This is working, correctly-wired code with honest empty-data handling; deleting it would violate the project's Q-46 rule (working code is not removed for lack of data). The only runtime cost is a cheap 30s no-op cron. The productive follow-ups are additive, not removal: seed `iot_sensors`, provide a real reading source, and (optional) add an FK/`session_id` column if telemetry should ever be correlated to a specific production session rather than just a `machine_id` string. If a future decision is that on-machine sensors will never be installed, the honest alternative is to disable the 30s cron (stop the empty loop) rather than drop the table — but that is an owner/vision call, not a cleanup.
