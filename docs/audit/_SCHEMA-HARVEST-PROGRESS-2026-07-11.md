# Schema-unlock harvest progress — 2026-07-11

Owner granted Q-35 schema-approval → building the 315-item build-now queue in golden-thread batches.
Pipeline: triage(`wf_79de48f6-ebb`) → build-spec(`wf_5c4c4be5-895`, batch-1=39 MES/QC/WMS/PP) → single-writer harvest.
Tools: `scratchpad/harvest.cjs` (now `SPEC_DIR` env + `<m>__<n>` names), `applymatch.cjs`, `driver.sh`.
Specs live in `scratchpad/schema-specs/<m>__<n>.json` (migration .sql in newFiles w/ APPROVED marker + Drizzle edits + code + rollback-tx DB-proof).

## Batch-1 (39 specs) — HARVEST in progress
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
