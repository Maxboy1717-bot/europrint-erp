# DIRECTIVE — Local app cleanup (camera 503 + Sentry dev-spam + i18n missing keys)

> Advisor (Claude) → Executor (Muslimbek). Owner-approved 2026-06-17 ("avval lokal app'ni tozala, keyin vizyon").
> Goal: the locally-running app (FE :20806/erp-dashboard/, BE :3030) should run CLEAN (no 503, no console spam)
> before we pivot to vision-build. Advisor-verified causes below (DB-proven). The razryad/Kartalar/Skills fix is
> a SEPARATE directive (MUSLIMBEK-PROMT-ORG-RAZRYAD-FIX-2026-06-17.md) — both are the "cleanup phase".

## RULES BLOCK
- EXECUTOR (🟢). Do EXACTLY these 3; no extra scope. `git add <exact-file>` only. No logs committed. No DDL.
  Don't touch payroll/GL/Aisha. Q-39 no-regression.

## FIX 1 🔴 — camera-dashboard 503 (JOIN type mismatch — DB-PROVEN)
Files: `apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-dashboard.repo.ts`
- `findPendingAlerts` (~line 48) and `findRecentEvents` (~line 63) both join:
  `.leftJoin(cameras, sql\`${cameras.id}::text = ${camera_events.camera_id}\`)`
- **Proven cause:** `cameras.id` is INTEGER and `camera_events.camera_id` is INTEGER, but `::text` casts the left
  side → Postgres `operator does not exist: text = integer` → the query THROWS → Result Err → controller
  `unwrapOrThrow` → **503**. (NOT empty data, NOT a missing column — purely the cast.)
- **Fix:** both sides are integers → drop the `::text` cast: `eq(cameras.id, camera_events.camera_id)` (or
  `sql\`${cameras.id} = ${camera_events.camera_id}\``). Apply to BOTH methods.
- **EXTEND to ALL IoT repos with this pattern** (advisor app-wide audit found the SAME `cameras.id::text = camera_events.camera_id` crash beyond camera-dashboard): `drizzle-camera-dashboard.repo.ts` (48,63,156,175,215,237,241,245), `drizzle-camera-ai.repo.ts` (147,151,171,193), `drizzle-camera.repo.ts` (50,97,232), `drizzle-iot-main.repo.ts` (93,118,156,197,219). Fix the join in EACH (`eq(cameras.id, camera_events.camera_id)`, drop `::text` — both INTEGER, live-verified). Grep each file for `::text =` to catch all.
- **Proof:** with the fix, an authenticated GET `/api/camera-dashboard/recent-events` + `/pending-alerts` return
  200 with `{...}`/`[]` (empty array is fine — there's no camera data locally, and empty is the CORRECT 200
  response, not 503). DB-proof the join now runs: `SELECT ... FROM camera_events LEFT JOIN cameras ON cameras.id = camera_events.camera_id LIMIT 1` executes without the text=integer error.

## FIX 2 ⚠️ — Sentry 403 console spam (dev should not init Sentry)
File: `artifacts/erp-dashboard/src/main.tsx` (~line 22).
- Currently `if (sentryDsn && sentryDsn.length > 0) { Sentry.init(...) }` — so when `VITE_SENTRY_DSN` is set in
  the local `.env`, Sentry initializes in DEV and spams `sentry.io ... 403` (the project rejects dev uploads).
- **Fix:** gate init to production only — `if (sentryDsn && sentryDsn.length > 0 && isProduction) { ... }`
  (`isProduction` is already defined at line 20 = `import.meta.env.PROD === true`). Keep the existing
  `else { console.warn(...) }` branch. Now dev never inits Sentry → no 403 spam; production still reports.
- (Do NOT edit `.env` — the code gate is the clean fix.)

## FIX 3 ⚠️ — i18n missing keys (text is already correct; only the keys are absent)
The console shows many `[i18n] Missing key '...' — falling back to "..."`. The fallback IS the correct Uzbek
text, so the UI is fine; the keys are just not in the locale files. Add them so the warnings stop.
- Add the SEEN keys to the right namespace files (value = the fallback shown in the console):
  - `uz/common`: `whDash.title/byWarehouse/recent/totalValue/sum/warehouses/stocked/stockLines/materials/lowStock/warehouse/lines/qty/value`, `useCRMWorkspace.kochirildi`, `ExtraTabs.jamiBolimlarFarzand`, `AIDesignGenerator.dizaynTasdiqlangandaPapkaordersStatusPending`, `IoTExtended.ogohlantirishlar`.
  - `uz/hr`: `toshkentShahri, uzbekistan, xalqBanki, ismFamiliya, otaOnaTurmushORtogI, abcDaraja, kursTugatish, samaradorlik, muddatsiz, muddatli, sinovMuddati, loyihaAsosida, qoshimchaMalumot`.
- Then run the existing i18n gap scanner to catch the REST app-wide (the owner only visited a few pages — there
  are more). Use the project's i18n script (e.g. `scripts/i18n-*` — find the missing-key checker) and fill all
  reported missing keys with their fallback text. Mirror to `ru` + `uz-cyr` if those are the i18n convention.
- This is mechanical (key → existing-fallback-text). No logic change.

## SELF-VERIFY
- FE tsc 0; BE tsc 0; reviewers no new FAIL.
- camera: authenticated `/api/camera-dashboard/recent-events` + `/pending-alerts` → 200 (not 503). DB-proof the join.
- Sentry: in dev, no `Sentry.init` runs (console shows the "DISABLED" warn, no sentry.io 403).
- i18n: the listed keys no longer warn; i18n scanner missing-count drops.
- Backend health 200, login 401/422; golden-thread exit 0 (no regression).

## COMMIT + REPORT
- `git add <exact files>` only. Commits per fix is fine (e.g. `fix(iot): camera-dashboard join text=int → 200`,
  `fix(web): gate Sentry to production (no dev 403 spam)`, `fix(i18n): add missing uz keys`).
- Report: per fix done, commit hashes, the camera 200 proof, i18n missing-count before/after, no-regression. Stop —
  advisor re-verifies (camera 200 live + DB-proof; Sentry off in dev; i18n count).
