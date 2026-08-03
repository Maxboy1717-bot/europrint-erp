# IoT Tablet Page (`/iot/tablet`) — Deep Dive

**Date:** 2026-07-04
**Type:** Read-only investigation. No code modified, no migrations, nothing committed.
**Verification:** static code trace (FE+BE) **+ live backend probes** (`:3030`, all read-only, every write attempt correctly rejected) **+ live native DB** (`localhost:5432`, the populated dev DB).

## Step 0 — page & wiring

- **Route:** `iot/tablet` → `App.tsx:27` (`const IoTTablet = lazy(() => import("@/pages/IoTTablet"))`); sidebar `components/sidebar/constants.ts:282`.
- **Page:** `src/pages/IoTTablet.tsx` (157 lines) + hook family under `src/pages/iot/`: `useIoTTablet.ts` (orchestrator), `useIoTTabletCore.ts` (state), `useIoTTabletData.ts` (queries + `tabletFetch`), `useIoTTabletAlerts.ts` (SOS + offline queue), `useIoTTabletAuth.ts` (login).
- **Backend:** almost everything is on one controller — `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts` (`@Controller('iot')`, class guard `@UseGuards(JwtAuthGuard, RolesGuard)` at line 71) — plus `iot-tablet.service.ts` (login/SOS).
- **Two auth worlds in one controller (the crux):**
  - `login`, `sos-alert` → `@Public()` (no token needed).
  - `tablet/orders`, `tablet/worker-schedule`, `tablet/equipment` → `@Public() + @UseGuards(TabletTokenGuard)` (accept the `x-tablet-token`).
  - **Everything else** (`tablet/shift`, `tablet/sessions`, `production-sessions*`, `material-kit-items/:id/scan`, `downtime-events`, `handover`) → class-level `JwtAuthGuard + RolesGuard` with `@Roles(...IOT_READ)`, where **`IOT_READ = [super_admin, director, production_manager, ERP_MANAGER, admin, technologist]` — `operator` is NOT included** (`iot-main.controller.ts:40`).
- **`tabletFetch` sends ONLY `x-tablet-token`, no ERP cookie** (`useIoTTabletData.ts:32-36`). So the tablet's write calls hit JWT-guarded routes with the wrong credential → rejected.

---

## Part A — feature-by-feature

| # | Feature | Status | Evidence (FE + BE) | Notes |
|---|---------|--------|--------------------|-------|
| 1 | Login / worker identification | **REAL** | FE `useIoTTabletAuth.ts:49` `POST /api/iot/tablet/login`; BE `iot-tablet.controller.ts:177` (`@Public`) → `iot-tablet.service.ts:152` `login()` resolves `employees.employee_code = tabelNumber`, verifies `password` against `users.password_hash`, issues an 8h tablet JWT (`{tablet:true, role}`). | Real auth, honest errors (`:66-71`). Live DB: **31 loginable workers** (employee_code + active user + password_hash). Role in token = `rbacTier ?? worker.role ?? 'operator'`. |
| 2 | Material scan at job start | **MOCK (FE green-lie)** | FE `useIoTTablet.ts:147-167` `apiRequest POST /material-kit-items/:id/scan`; BE `:271` real `UPDATE material_kit_items SET is_scanned=true`. | Three problems: (a) BE route is `@Roles(...IOT_READ)` → tablet token 401; (b) **FE swallows the error** (`:156 catch{}`) then **always** marks `isScanned=true` + toasts "Material skanlandi" (`:159-164`) regardless of outcome — a frontend green-lie; (c) live `material_kit_items = 0` so there is nothing to scan; (d) BE returns `{scanned:true}` with no row-count check (`:278`). |
| 3 | Semi-finished transfer scan | **NOT-FOUND** | — | No dedicated "transfer to next stage / work-center" scan button or endpoint on this page. Stage transitions are logged internally by `logStageTransition` (`iot-tablet.controller.ts:695`) during stop/return, but there is no operator-facing transfer-scan feature here. |
| 4 | Session start / stop | **PARTIAL** | FE create `useIoTTablet.ts:131` `POST /production-sessions`; start `:173,186`; stop `:200`. BE `createProductionSession:302` (`INSERT INTO production_sessions … RETURNING *`), `startProductionSession:361`, `stopProductionSession:416` (returns completion report). | BE writes are **real**. But all three are JWT+`@Roles(...IOT_READ)` guarded → the tablet's `x-tablet-token` is rejected: **live probe `POST /production-sessions` → `401 "Token majburiy"`**. Unreachable from the tablet. Live `production_sessions = 8` (created earlier via manager JWT / seed). |
| 5 | Defect / downtime reporting | **PARTIAL** | FE defect `useIoTTablet.ts:218` `POST /:id/defect`; downtime `:280` `POST /downtime-events`. BE `reportProductionDefect:552` (`UPDATE production_sessions` + `INSERT INTO downtime_events`), `reportDowntimeEvent:829` (`INSERT INTO downtime_events … RETURNING *`). | BE writes real; downtime feeds `downtime_events` (live = 2 rows, so this path *has* produced data before, via manager JWT). Both JWT-guarded → **401 "Token majburiy"** from the tablet token. |
| 6 | Shift handover | **PARTIAL** | FE `useIoTTablet.ts:237` raw `fetch POST /api/iot/tablet/handover` (x-tablet-token). BE `tabletHandover:207` real `INSERT INTO shift_handovers … RETURNING *`, honest 2-signature status (`pending` until a receiver accepts, `:217`). | BE is real and well-designed. But the route is `@Roles(...IOT_READ)` (NOT `@Public + TabletTokenGuard`) → tablet token 401. Live `shift_handovers = 0`. |
| 7 | SOS / emergency alert | **REAL** | FE `useIoTTabletAlerts.ts:187` raw `fetch POST /api/iot/tablet/sos-alert` (x-tablet-token). BE `tabletSosAlert:188` (`@Public`) → `service.raiseSosAlert` real insert; "cannot fail closed", anonymous `workerId=0` allowed (`:190-200`). | **The one core action that works end-to-end from the tablet** — it's `@Public`, so no JWT needed. Honest error handling (`:202-210`). |
| 8 | Equipment / checklist display | **REAL (equipment) / PARTIAL (kit checklist)** | FE equipment `useIoTTabletData.ts:113` `GET /api/iot/tablet/equipment`; BE `getTabletEquipment:118` (`@Public + TabletTokenGuard`). Kit checklist FE `useIoTTablet.ts:105-118` `POST /material-kits/generate` + `GET /material-kits/:id`. | Equipment read works with the tablet token; live `equipment = 7`. The material-kit checklist has **0 kits/items** live, so the checklist renders empty unless kit-generate is run. |
| 9 | Sensor / telemetry display | **NOT-FOUND** | — | This page is an **input device** (scan/report), not a sensor dashboard. No query reads `mes_telemetry` / `iot_sensor_readings`. The prior audit's telemetry-empty finding is **irrelevant to this page**. |
| 10a | Production orders list | **REAL** | FE `useIoTTabletData.ts:81` `GET /api/iot/tablet/orders?workerId`; BE `getTabletOrders:94` (`@Public + TabletTokenGuard`). | Works with tablet token; live `production_orders = 7`. |
| 10b | Worker schedule | **REAL** | FE `useIoTTabletData.ts:151` `GET /api/iot/tablet/worker-schedule`; BE `:106` (`@Public + TabletTokenGuard`). | Works with tablet token. |
| 10c | Shift banner / active-session restore | **PARTIAL (blocked)** | FE `useIoTTabletData.ts:164` `GET /api/iot/tablet/shift`, `:197` `GET /api/iot/tablet/sessions`; BE `getTabletShift:128`, `getTabletSessions:141` — both `@Roles(...IOT_READ)`. | **Live probe `GET /tablet/shift` + tablet token → `401 "Token majburiy"`.** So right after login, the shift banner and any in-progress-session restore fail. |
| 10d | Inline QC | **PARTIAL** | FE `useIoTTablet.ts:260` `POST /:id/inline-qc`; BE `submitInlineQc:773`. | Real BE, JWT-guarded → 401 from tablet. Honest FE `onError` toast (`:270`). |
| 10e | Crew picker (employees) | **PARTIAL** | FE `useIoTTabletData.ts:134` `GET /api/hr/employees` (`apiRequest`, cookie auth). | Requires an ERP session cookie; from a bare tablet (token only) it 401s. Live `employees = 31`. |

---

## Part B — end-to-end usability

**Q11 — Can a worker use this page today?** Partially, then it hits a wall. Happy path:
1. **Login → WORKS.** 31 real workers can authenticate (employee_code + password); an 8h tablet JWT is issued. ✅
2. **See my orders / equipment / schedule → WORKS** (tablet-token routes; live data: 7 orders, 7 equipment). ✅
3. **Shift banner / restore active session → BREAKS immediately** — `GET /tablet/shift` and `/tablet/sessions` are JWT-`@Roles`-guarded → **401 "Token majburiy"** (live-confirmed) with only the tablet token. ❌
4. **Start a job (create production session) → HARD STOP** — `POST /production-sessions` is JWT-`@Roles(...IOT_READ)`-guarded; the tablet sends only `x-tablet-token` → **401 "Token majburiy"** (live-confirmed). **This is the first fatal break of the core workflow.** ❌
5. Everything downstream (scan, start, stop, defect, downtime, inline-QC, handover) is guarded the same way → all 401 from the tablet.
6. **SOS → WORKS** (it's `@Public`). ✅

So a worker can log in, view their order list, and hit the panic button — but **cannot start or run a job**. The whole production loop is gated behind a manager-role ERP JWT the tablet was never designed to carry.

**Q12 — Cross-reference prior findings (with corrections).** The MES+IoT deep-dive (`MES-IOT-DEEP-DIVE-2026-07-04.md`) flagged empty `mes_telemetry`/`iot_sensor_readings` and "0 operator users / login impossible" (SB0312). Against the **real native DB**, three corrections apply to *this* page:
- **Sensor telemetry is irrelevant here** — this page never reads it (Part A #9), so its emptiness does not block the tablet.
- **Login is NOT blocked** — `operator`-role users = 0, but login keys off `employee_code + users.password_hash`, and **31 workers are loginable** live. The prior "login impossible" claim was based on the empty docker DB; on the real DB it's false.
- **The real blocker is NEW and previously undocumented: a FE↔BE auth mismatch.** The tablet authenticates with `x-tablet-token`, but the entire write workflow (and `tablet/shift`/`tablet/sessions`) sits behind `JwtAuthGuard + @Roles(...IOT_READ)`, which ignores the tablet token and excludes `operator`. This is a more fundamental gap than the data emptiness the earlier audit focused on — and it is confirmed live, not inferred.

**Q13 — Error handling / frontend green-lie.** Mostly honest, with one clear exception:
- **`scanMaterial` is a frontend green-lie** (`useIoTTablet.ts:156,159-164`): it `catch{}`-swallows the API error and then *unconditionally* marks the item scanned and toasts success — so a 401/failed scan still shows "Material skanlandi". 
- `handover` (`:254`), `inline-qc` (`:270`), and `downtime` surface honest `onError` toasts. `createSession`/`start`/`stop`/`defect` have **onSuccess-only** handlers, so a 401 shows no toast at all — a silent no-op (the "start" button just does nothing), which is confusing but not a false-success claim.
- BE minor: `scanMaterialKitItem` (`:278`) and `tabletHandover` (`:238`) return `{scanned:true}`/`{data:row}` without a row-count guard — a scan/handover against a non-existent id returns success with 0 rows affected.

---

## Plain verdict

**No — this page cannot be handed to a shop-floor worker today.** A worker can log in (31 real accounts exist), view orders/equipment, and press SOS — but the **entire production workflow (start job → scan → run → defect/downtime → QC → stop → handover) returns `401 "Token majburiy"`**, because the FE authenticates with `x-tablet-token` while those routes demand a manager-role ERP JWT. This is live-confirmed, not theoretical.

**Ordered blockers:**
1. **Auth mismatch (wrong BE guards / missing FE wiring) — THE blocker.** ~10 routes (`tablet/shift`, `tablet/sessions`, `production-sessions` + all sub-routes, `material-kit-items/:id/scan`, `downtime-events`, `tablet/handover`) are `@Roles(...IOT_READ)` under `JwtAuthGuard` but are called by the tablet with only `x-tablet-token`. Until fixed, nothing past login works.
2. **Mixed FE auth.** `scanMaterial` and the crew picker use `apiRequest` (ERP cookie) while the rest use `tabletFetch` (x-tablet-token) — inconsistent; the cookie calls also fail on a bare tablet.
3. **FE green-lie.** `scanMaterial` reports success on failure — must honor the BE result.
4. **Owner/work data.** `material_kits`/`material_kit_items` = 0 (scan checklist empty) and `shift_handovers` = 0; orders/equipment/sessions exist. Kit generation must be exercised (or seeded) for the scan flow to have items.

## Fastest path to a working demo

1. **Flip the tablet workflow routes to the tablet-auth pattern** — change each of the ~10 routes from `@Roles(...IOT_READ)` to `@Public() + @UseGuards(TabletTokenGuard)`, exactly like `tablet/orders`/`tablet/equipment` already are (`iot-tablet.controller.ts:92-93,104-105,116-117`). This single change removes the 401 wall and is the highest-leverage fix. *(Confirm each handler's authorization then relies on the tablet token's identity, not an ERP role.)*
2. **Unify `scanMaterial` to `tabletFetch`** (x-tablet-token) and make its `onSuccess` depend on `res.ok` — kill the green-lie.
3. **Provide one test credential** — the owner supplies a known `employee_code` + password for one of the 31 existing workers (owner-data; not derivable from code).
4. **Give that worker one order + one material kit** — pick one of the 7 existing `production_orders` and either run the kit-generate flow or seed one `material_kits` + a few `material_kit_items` so the scan checklist is non-empty.
5. Then the full happy path — **login → pick order → start session → scan kit items → report a defect/downtime → inline-QC → stop (completion report) → shift handover → SOS** — is demonstrable end-to-end on real tables. Steps 1–2 are code, 3–4 are data; step 1 alone unblocks ~90% of the page.

*Note: no fix was applied — investigation only, per instructions.*
