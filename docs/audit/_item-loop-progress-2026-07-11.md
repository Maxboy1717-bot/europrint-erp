# Loop progress — 2026-07-11

## Phase 1 — Design fixes: COMPLETE (6/6 items, 14 commits, range dbce2b1e..a0c79e7f)
| Item | Commit | Note |
|---|---|---|
| D1 peach `--background`→#FAFAF9 | dbce2b1e | + ep-bg/ep-border/border; static-verified 4 modals |
| D2 AppShellModern overflowX auto | ef1058e9 | CRM Kanban + 2 Cat-A pages confirmed |
| D3 EPTable canonical | 23d02c11 | promoted DataTable, chrome opt-in |
| D4a DedicatedPageShell space-y-6 | b76dba28 | double-pad removed, 21 consumers |
| D4b ModulePage space-y-6 | 436e060f | distinct code path |
| D5 (×7 tables) | 42ac76fd 0d0f6c14 57673cf4 c4157d74 8bf1942e 197d22e1 39ad0240 | in-place §3.4 (behavior-preserving) |
| D6 module-colour signature | a0c79e7f | EPPageHeader `--mod-*` tile, live on RulonCards |
Doc commits: 13d81d43, e9fb66c1 (open-questions). All tsc + hooks green.

## Phase 2 — BUILT ITEMS (Ha achieved)
| Item | Commit | Proof |
|---|---|---|
| 09-qc#1 atomic quarantine transition (SERIALIZABLE + FOR UPDATE) | 537e2ab3 | BE tsc EXIT=0; rollback-tx DB-proof: FOR UPDATE mutual-exclusion (57014) + KARANTIN→QC_PASS + guard + clean rollback |
| 10-warehouse#12 count-accuracy KPI (GET /wms/inventory-counts/accuracy) | 19b2e0fc | BE tsc EXIT=0; DB-proof: emitted SQL → total=35 var=3 accurate=32 accuracy_pct=91.43 (=32/35×100) |
| 07-pp#3 pessimistic lock vs parallel session on one machine | 4ab3cea6 | pg_advisory_xact_lock in withTransaction; rollback-tx proof: lock blocks conn2 (57014), busy=1 reject, self=0 |
| 14-marketing#77 gate NPS auto-request on open QC reclamation | 5b5c2a7c | harvested (workflow spec); NOT EXISTS guard; agent rollback-tx proof |
| 13-crm#2 serialize round-robin pick+insert (advisory lock) | fd313f48 | harvested; pickAndInsertWebsiteLead atomic; agent rollback-tx proof |

## Phase 2 — MASS HARVEST 2026-07-11 (harvester script, single-writer)
- Built `scratchpad/harvest.cjs` (atomic per-spec apply: anchor must match exactly once
  or abort with no writes; CRLF-aware — normalize to LF for matching, restore CRLF on write;
  idempotent — skips edits whose replacement is already present) + `driver.sh` (apply→commit;
  on tsc-fail auto-revert that spec [tracked→HEAD, new→rm] and continue; collects casualties
  to `_needmanual.txt`). Pre-commit tsc gates EVERY commit.
- **39 specs landed this session** (range 6de960b4..066ac4fc). Committed spec-file #s:
  02,03,04,05,07,08,10,11,12,17,20,21,25,26,28,30,31,35,37,39,40,41,43,46,47,49,52,54,57,58,59,61,63,65,66,67,68,69,72
  (plus earlier-session 18 harvest entries). FE specs 26/40/49/52 passed FE typecheck too.
  WMS cluster 05/07/08 landed via newonly+hand-wire (re-anchored around #04 off-hours block,
  deduped NotificationRoutingRepository which #03 already registered).
- **Manual tail progress (tools: scratchpad/applymatch.cjs applies all matching edits + writes newFiles
  + reports drift idx; then hand-fix drift + commit exact files from spec).** LANDED: 18 (63abc1d4,
  Err(res.error) fix), 19 (6724e799, +parentDocumentId:null at 2 call sites), 27 (1c007e5b, re-anchor
  clone endpoint on `}`), 33 (6147d1fb, re-anchor CurrentUser import past sibling OrderTrendService),
  60 (953583aa — /holat already in #58, added only /kundalik+/ideal_rasm, NO dup getHolat).
- **NEEDS MANUAL (7) — anchor-drift, each a distinct sibling-modified file:** 34,38 (marketing.module),
  42 (kanban-boards.service — ALL 4 edits drift, sibling 39/41/43), 48 (drizzle-kanban repo),
  64 (dashboard-query repo), 70 (mm.module, nf6), 71 (mm.repository — ALL 3 drift, entangled w/ 65/69/72).
  ⚠️ Watch cross-spec DUPLICATION (like 58/60): a superset spec may re-add a sibling's symbol.
  For each: applymatch → re-anchor drift edits → verify no dup → commit.
- **edits=0 probes (re-run/skip): 14, 29, 44, 45, 62, 75.**
- Watch: pre-commit flagged route dups GET /api/crm/deals/:id ×2 and /api/mm/purchase-orders/:id ×2
  (WARN) — verify #72/#26 didn't add a genuinely duplicate route in the manual pass.

## Phase 2 — build-spec workflow (84 items) → HARVEST in progress
- **Workflow phase2-build-specs** (84 agents): **75 ready | 1 rejected | 1 already-done | 5 dup | 2 errored**.
- Ready specs saved individually: `scratchpad/specs/NN.json`; index `scratchpad/spec-index.json`.
- **28 collision-free** specs = safe first-harvest batch; the rest share files (kanban/director/mm/marketing
  clusters — sequence same-file specs).
- Harvest loop PROVEN: read spec → verify anchor in live file → apply Edit(s)+newFiles → commit (pre-commit
  tsc validates). **Harvested so far (12): #36 5b5c2a7c, #23 fd313f48, #56 20576be8, #16 e1cc49e2,
  #13 cffdd66f, #55 2c948b8f, #15 e2d579ec, #32 82b37103, #09 9c00fbda, #24 2456338d,
  #53 c6a0f2ae, #06 db28924a, #51 004e13aa, #74 dd3d3f77, #73 b4054358, #50 5018d782,
  #22 9ab8fe06, #02 6de960b4 (WMS #24 remnant-roll suggestions for PP planner).**
  RESUME: collision-free remaining — #52,#01,#28,#67,#11,#17,#18,#54,#26,#49
  — then same-file clusters (director/kanban/mm/marketing).
  ~60 ready specs remain (of 75). Each: read scratchpad/specs/NN.json → verify anchors live →
  apply Edit(s)+newFiles → commit (pre-commit tsc). 15 landed; #73 needed a tsc fix (return
  Err(error) not Result<boolean>) — the pre-commit tsc catches such agent slips; fix + re-commit.
  See AGENTLAR-TOLIQ-IJRO-REJA-2026-07-11.md for the full agent-execution plan.
  NOTE: verify repo return-shape (camelCase vs snake_case) per spec before applying — spec #09
  looked wrong (snake_case query type) but HistoricalConsumption maps to camelCase; always
  check the mapped RETURN type, not the intermediate query type.
- **Rejected (log, do not build): 13-crm#16** — parallel-360 FE refactor would REGRESS live data
  (standalone :id/complaints reads sd_customer_complaints=0 rows vs the 360's sd_customer_interactions
  type='complaint'=1 row; no :id/orders or :id/payments endpoint exists). Needs a 2-item re-scope:
  (1) backend split customer-360.builder into per-block derived-shape endpoints; (2) FE parallel useQuery.
- **Errored (StructuredOutput cap — re-run): 07-pp#107** (waiting-zone dashboard), **11-MM#11.13** (approved-req→PO).
- **Incomplete specs (edits=0 — re-run): 07-pp#86, 14-mkt#14-8, kanban#C32, kanban#C44, 05-dir#106, 03-fin#C12.**
- **Already-done: 07-pp#3** (built 4ab3cea6). **Dup: mkt 14-55/14-63, kanban #74/#76, MM 11.47.**
- RESUME HARVEST: continue collision-free batch (spec-index safe list), then same-file clusters.

## Phase 2 — already-satisfied on live re-verify (STALE-DOC, marked Ha, no build needed)
| Item | Finding |
|---|---|
| 10-warehouse#120 blind count | Plan says Yo'q ("grep=0") but live code HAS it: `wms-counts.service.ts` blind-mask (5 refs) + controller `blind` param. Mechanism DONE. Only the UX policy (opt-in / mandatory / A-segment) is owner-gated → open-questions. |

## Phase 2 — 1,163-item build loop: STARTED, MES(08) triaged
- **Step 0 queue built:** `_item-loop-queue-2026-07-11.md` (priority order + module offsets).
- **MES(08) triaged (Step 1.2 live re-verification):** 62 "Code-buildable-now" markers →
  overwhelmingly **schema-gated (owner-gated Q-35)** or **blocked-org-entangled** or
  **chain-dependent**. Genuinely-safe no-schema buildable set ≈ empty (item 68 blocked-entangled).
  All logged to `_loop-open-questions` Q-A0 (grouped by unlocking schema decision).
- **Items built this pass:** 0 code items (all near-term MES items reclassified owner-gated on
  live re-read — the exact Step-1.2 reclassification the plan anticipates). No half-built work;
  nothing unsafe forced; nothing in the working tree left dirty.

## RESUME POINT (Step 3) for a fresh session
1. Read `_item-loop-queue-2026-07-11.md` + `_loop-open-questions-2026-07-11.md` (this triage).
2. **Blocking dependency for most of MES:** owner answer to Q-A0 (schema approval). Until then,
   MES near-term items are owner-gated.
3. Continue per-module triage/build in priority order starting at **QC(09)** (offset 11494),
   extracting Code-buildable-now items (`awk` pairing pattern in queue file) and Step-1.2
   re-verifying each against live schema before building. Expect the same schema-approval-unlock
   pattern; build only items that work on existing schema without blocked-module deps.
4. Modules 06/07/04/05/09-20 not yet extracted.
