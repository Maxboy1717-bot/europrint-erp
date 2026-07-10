# Schema-unlock harvest progress — 2026-07-11

Owner granted Q-35 schema-approval → building the 315-item build-now queue in golden-thread batches.
Pipeline: triage(`wf_79de48f6-ebb`) → build-spec(`wf_5c4c4be5-895`, batch-1=39 MES/QC/WMS/PP) → single-writer harvest.
Tools: `scratchpad/harvest.cjs` (now `SPEC_DIR` env + `<m>__<n>` names), `applymatch.cjs`, `driver.sh`.
Specs live in `scratchpad/schema-specs/<m>__<n>.json` (migration .sql in newFiles w/ APPROVED marker + Drizzle edits + code + rollback-tx DB-proof).

## ⚠️ Harvester fix + collision insight (2026-07-11, iter 2)
- **CRLF anchor bug FIXED** in harvest.cjs/applymatch.cjs: schema-spec agents captured anchors from
  CRLF files (embedded `\r`); harvester now normalizes anchorOld/replacement to LF too. (Some fails were
  this; most are genuine cluster collisions.)
- **KEY INSIGHT for next batches:** parallel agents each editing the SAME shared per-module file
  (`lib/db/src/schema/<mod>-schema.ts`, `apps/api/src/shared/db/schema-*.ts`, `<mod>.module.ts`,
  `pp/pp-production.ts`) collide — only 1-3/module land automatically; the rest need re-anchoring because
  a sibling changed the region. Additive-only (each adds a DISTINCT table/column), so re-anchoring is
  mechanical (append the new table at the CURRENT end; add the provider at the current array end). ⭐ FUTURE
  build-spec batches: instruct agents to anchor new Drizzle tables at END-OF-FILE and providers/controllers
  at the array's last element (stable anchors) to cut the collision rate.

## ITER-3 (2026-07-11): 19 landed; double-CR bug fixed; STRATEGY PIVOT
- **Landed 19** (wms#10 `32623dce` GTD-flag added iter-3). Double-CR (`\r\r\n`) corruption fixed in
  harvest.cjs/applymatch.cjs (strip ALL `\r`, not just `\r\n`) — was breaking anchors + the Edit tool.
- **STRATEGY PIVOT — manual re-anchor is too token-expensive** (~1 spec/iteration). The ~20 batch-1
  cluster casualties are ADDITIVE but collide because parallel agents anchored on the ORIGINAL shared
  file; the fix is to REGENERATE them (not hand-re-anchor): a small build-spec workflow that reads the
  CURRENT (post-sibling) files and anchors new Drizzle tables at END-OF-FILE + providers/controllers at
  the array's LAST element (stable) → then harvest cleanly. Apply the SAME stable-anchor rule to all
  future batches from the start.
- **Casualties to regenerate (~20):** qc #8/#22/#26/#67 (qc-schema.ts), #39 (qc.module), #62 (schema-wms.ts),
  #35 (tsc-slip: cast+user.id); wms #6/#17 (wms.module/wms-schema); mes #83 (mes.module), #24/#33/#108/#116
  (schema-compat-4 productionSessions), #106 (pp-enhanced material_norms); pp #30/#124 (pp-production),
  #49 (pp.module), #125 (pp-enhanced). **pp #90 = DUP of pp#37** (both gang-runs) → mark satisfied/merge, not rebuild.

## ITER-4 (2026-07-11): regen worked — 29 landed this wave
- Regen workflow `wf_76be6944-45e` (stable anchors) → harvested **10 more**: qc#22 `e35f5249`, #67 `549f94d6`,
  #39 `14c0414b`, #35 `695e6dd2`; wms#6 `5468930c`, #17 `bfd4770a`; mes#24 `5691aaa8`, #116 `a691a5c3`;
  pp#30 `d8d314fd`, #125 `0d36ada9`. **29 landed this wave** (of 39 batch-1).
- **⭐ RECURRING tsc-slip = new table not re-exported via the barrel.** qc#8 (`qcSupplierRegime` absent from
  `@workspace/db`), pp#49 (`ppPlanSnapshots` absent from `@europrint/schemas`) — the Drizzle table is defined
  in the schema file but the barrel index doesn't re-export it, so the repo's `import { X } from '@workspace/db'`
  fails. FIX: add the re-export line to the barrel. ⭐ FUTURE build-spec agents MUST add the barrel re-export
  for every new table (add to the stable-anchor instruction set).
- **Batch-1 stragglers (9) for next iter:** tsc barrel-export: qc#8, pp#49. tsc Result-type (return Err(res.error)):
  qc#26 (qc-dispatch-conclusion.service:70), mes#83 (mes-crew-members.service:26). tsc property: mes#108
  (get-oee.handler:256 isTrainingSession not on session type — the VIEW/type needs the column). anchor-straggler
  (re-run driver; siblings landed): qc#62 (qc.module import), mes#33 (mes-schema.ts import), pp#124 (pp.module
  providers). edits=0 (regen returned empty — re-run 1 agent or hand-build): mes#106. pp#90 still = DUP of pp#37.

## ⭐⭐ ITER-5 CRITICAL INFRA FINDING — @workspace/db = STALE DIST (2026-07-11)
- `@workspace/db` package.json resolves to `./dist/cjs/index.d.ts` (COMPILED), NOT source. So a new
  Drizzle table added to `lib/db/src/schema/*` is INVISIBLE to `apps/api` tsc until **lib/db is rebuilt**.
  This is why table-OBJECT-importing specs (qc#8 `qcSupplierRegime`, pp#49 `ppPlanSnapshots`) tsc-failed
  while raw-SQL specs passed. **MANDATORY harvest step for any new-table spec whose repo imports the table
  object: after applying, run `cd lib/db && npx tsc -p tsconfig.cjs.json` (dist is gitignored — local only),
  THEN the apps/api pre-commit tsc validates correctly.**
- **Integrity check PASSED:** after rebuilding dist, `apps/api npx tsc --noEmit` = **0 errors** — all 30
  landed schema items are genuinely type-valid; stale dist masked barrel-visibility only, not real errors.
- qc#8 landed `15f95222` (via dist-rebuild) — **30 landed this wave.** Also fixed a duplicate `date` import
  in qc-schema.ts committed by a sibling (masked by stale dist; apps/api tsc doesn't compile lib/db source).
- **Remaining 8 stragglers:** pp#49 (apply→rebuild-dist→commit, same as qc#8); Result-type qc#26/mes#83
  (return Err(res.error)); property mes#108 (get-oee:256 isTrainingSession — VIEW/type); anchor qc#62/mes#33/
  pp#124 (hand-re-anchor); mes#106 (edits=0 → hand-build material_norms ALTER). pp#90 = DUP of pp#37.

## Batch-1 (39 specs) — HARVEST in progress
**Landed this wave: 18** (see below + PP/MES additions iter 2).
PP iter2: 07-pp#46 `228c60a7`, #20 `a1461058`, #37 `b152f7e6`, #24 `b58c9f42`, #118 `a5ee4f94`,
#131 `d65e1205`, #132 `ab151834`. PP casualties (cluster): #30/#90/#49/#124/#125.
MES production_sessions cluster (#24/#33/#108/#116) + #106: all need re-anchor (target
`apps/api/src/shared/db/schema-compat-4.ts` productionSessions def + mes.module.ts).
**LANDED (11):** 09-qc#11 `aea8cd07`, #48 `f60d541f`, #34 `5a353001`, #96 `fd63da32`; 10-wms#4 `6b9e0802`,
#5 `f508edb1`, #29 `724539d8`, #39 `3e5fa037`; 08-mes#36 `636a39d6`, #86 `013b21a6`, #4 `48f85a82`.

**NEEDS MANUAL — cluster casualties (10 anchor-drift + 1 tsc-slip):** schema specs collide on the shared
per-module Drizzle file (`lib/db/src/schema/qc-schema.ts`, `wms-schema.ts`) and `*.module.ts` — the first
spec of a module lands, siblings drift. Re-anchor the Drizzle table def + module registration past the
landed sibling (same technique as the 51-spec code tail; watch cross-spec dup).
- qc: #22, #67, #8, #26 (qc-schema.ts import anchor), #39, #62 (qc.module.ts). #35 = TSC-SLIP:
  qc-override.repository.ts:29 `QueryResult` cast (use `unknown` first / typedExecute) + controller:44
  `user.userId`→`user.id` (AuthenticatedUser has `id` not `userId`).
- wms: #6 (wms-schema.ts A92 anchor), #10, #17 (wms.module.ts AdvanceLinkageController anchor — landed via
  #08 last session).
- mes: #83 (mes.module.ts controllers anchor).

**NOT YET RUN (batch-1 remainder):** 08-mes#24, #33, #108, #116 (all ALTER production_sessions — sequence:
one lands, re-anchor the Drizzle production_sessions table def for the rest), #106 (material_norms, pairs
with #4). 07-pp#20, #24, #30, #37, #46, #49, #90, #118, #124, #125, #131, #132 (12, not yet harvested).

## Next batches (build-spec → harvest), golden-thread order
06-sd(44), 20-cc(25), 04-coord(12), 13-crm(26), 14-mkt(29), 15-kanban(37), 16-iot(6), 12-lms(13),
18-notif(23), 05-dir(6), 19-pos(11), 11-mm(33), + review Org(4)/HR(6)/Fin(1) buildNow (blocked-module —
double-check each is genuinely non-structural before building). Source: `_SCHEMA-BUILD-QUEUE-2026-07-11.md`.
Owner questions for the 277 data-gated + 52 blocked: `SAVOLLAR-VA-MUAMMOLAR-2026-07-11.md`.

## Migration application
Specs COMMIT the migration .sql + Drizzle types (tsc-gated); applying migrations to the live europrint DB
is the deploy-time step (idempotent IF NOT EXISTS, APPROVED-marked). DB-proofs already validated each in
rollback-tx. Do NOT ad-hoc-apply mid-harvest (let the migration runner own it).
