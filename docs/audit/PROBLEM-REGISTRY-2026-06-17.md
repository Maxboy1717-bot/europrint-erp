# EuroPrint — App-wide PROBLEM REGISTRY (advisor-verified) — 2026-06-17

> Read-only app-wide audit (workflow wl3ybatxa, 6 agents) → **advisor TRIAGED + VERIFIED each claim against live
> DB + code** (Q-29). The agents reported ~46 candidates but OVER-CLAIMED heavily; only the verified-real ones are
> "rasvo". This registry separates CONFIRMED / OVER-CLAIMED / COSMETIC. Source of truth = live DB + code, not the
> agents.

## ⚠️ Why triage was needed (agents over-claimed)
- T2/T3 agent said `camera_events.camera_id` is VARCHAR & the `::text` cast is "correct" — WRONG. Live = **integer**;
  my DB proof: `cameras.id::text = camera_id` → `operator does not exist: text = integer` (a real crash).
- "Missing /api/achievements endpoint" — WRONG, it EXISTS (`lms-misc.controller.ts:161 @Controller('achievements')`).
- "mm-goods deleteGoodsReceipt/Issue returns fake {}" — WRONG, it does a REAL delete (service→repo `Promise<void>`); returning {} after is fine.
- "accounting/ar + accounting/ap sidebar have no routes" — WRONG, routes EXIST (`FinanceRoutes.tsx:43-44`).
- "production-agent calculateOEE hardcoded 0.92/0.85/0.97" — PARTIAL; availability is computed for real (line 109); some factors are documented TODO placeholders.
- Several "type mismatch" joins are **both INTEGER** cast to text → work fine, only a perf/index-miss (NOT errors).

---

## 🔴 CONFIRMED REAL — correctness/crash (verified by me)

### R1 — Camera `::text = camera_id(integer)` JOIN crash (503) — MULTIPLE IoT repos
`cameras.id` and `camera_events.camera_id` are BOTH **integer** (live-verified), but the join casts
`cameras.id::text = camera_events.camera_id` → Postgres `operator does not exist: text = integer` → query throws → 503.
- Repos affected (same pattern): `drizzle-camera-dashboard.repo.ts` (48,63,156,175,215,237,241,245),
  `drizzle-camera-ai.repo.ts` (147,151,171,193), `drizzle-camera.repo.ts` (50,97,232), `drizzle-iot-main.repo.ts` (93,118,156,197,219).
- FIX: `eq(cameras.id, camera_events.camera_id)` (drop `::text`; both int). **Already directed for camera-dashboard
  in MUSLIMBEK-PROMT-LOCAL-CLEANUP — EXTEND to all 4 repos.** Severity HIGH (every camera/IoT read 503s).

### R2 — `sales_orders.assigned_to` (UUID) joined to `employees.id` (INT) → silent EMPTY join
Both sides cast to `::text` (`o.assigned_to::text = e.id::text`) so it doesn't crash, but a UUID-string never equals
an INT-string → the assigned-employee is ALWAYS null/blank (silent data loss, Q-40 "green but wrong").
- File: `sd/sales/sales.repository.ts` (54,55,72). Severity HIGH (correctness).
- ROOT: the known "two-worlds" UUID-vs-INT drift. FIX = schema realignment (assigned_to → int, or employees.id → uuid)
  — a DESIGN decision (owner-gated, bigger than a cast removal).

### R3 — `crm_deals.lead_id` (UUID) joined to `crm_leads.id` (INT) → silent EMPTY join
Same as R2: `d.lead_id::text = l.id::text`, uuid-string ≠ int-string → lead link always blank.
- File: `sd/infrastructure/repositories/sd-quotations.repository.ts:119`. Severity HIGH (correctness). Same schema-realignment root.

---

## 🟡 CONFIRMED REAL — but lower / known / cosmetic

### R4 — i18n missing keys (≈43 app-wide: ~28 code + ~15 file-parity)
Text DISPLAYS correctly (fallback = the right Uzbek text); only the keys are absent from locale files. Cosmetic.
FIX: add keys (value = fallback) + run i18n scanner. Already in MUSLIMBEK-PROMT-LOCAL-CLEANUP. Severity LOW (cosmetic).

### R5 — Sentry dev 403 spam
Local `VITE_SENTRY_DSN` set → Sentry inits in dev → 403 upload spam (external, harmless). FIX: gate init to
`isProduction` (main.tsx:22). Already in MUSLIMBEK-PROMT-LOCAL-CLEANUP. Severity LOW.

### R6 — ORG instruction-divergence (razryad/Kartalar/Skills)
Already verified + directed in MUSLIMBEK-PROMT-ORG-RAZRYAD-FIX. Severity MED.

### R7 — Real stubs to verify+fix (agent-reported, CLAUDE.md-corroborated; exact lines need spot-check)
- `crm-extended.service.ts` — createTask/processChat/churnAnalysis/processVoice/runAutoTasks return canned/empty
  (CLAUDE.md already lists crm-extended as `as unknown` FAIL). PLAUSIBLE real — spot-verify before fix.
- `admin-queue.service.ts` — `mockQueueStats` ("mock" in name) — PLAUSIBLE placeholder.
- `ai-router*.service.ts` — `latencyMs` hardcoded 0 (telemetry only) — cosmetic.
- `production-agent.calculateOEE` — perf/quality factors placeholder (availability real, documented TODO) — PARTIAL.
- `cfo-cash-position-acl.ts:66` — returns `{id:null}` instead of NOT_FOUND — minor.

### R8 — 22 stub routes (StubPage) — KNOWN (CLAUDE.md F4)
Routes still showing StubPage. Real but already-known/expected (placeholder pages). Belongs to vision-build (build the real pages).

---

## ❌ OVER-CLAIMED — verified NOT real (dismissed, do NOT fix)
- `/api/achievements` "missing" — EXISTS (`lms-misc.controller.ts:161`).
- `mm-goods deleteGoodsReceipt/deleteGoodsIssue` "fake {}" — REAL delete (`drizzle-mm-goods.repo` Promise<void>).
- `accounting/ar` + `accounting/ap` "no route" — routes EXIST (`FinanceRoutes.tsx:43-44`).
- "Camera join INTEGER→VARCHAR, cast correct" — type mislabel (it IS a crash, fixed under R1).
- both-INT joins cast to text (sd_customer_interactions, sd_dashboard, crm_leads.assigned_to, crm-comments/tasks,
  production_orders.product_id) — WORK fine; only perf/index-miss. Optional cleanup, NOT a bug.
- Goals(411)/Assets(415)/OrgNodeDetail(HRRoutes:69) — owner already said DO-NOT-TOUCH (agent opinion).

---

## FIX PLAN (cleanup phase, owner-gated)
1. R1 camera crash → extend MUSLIMBEK-PROMT-LOCAL-CLEANUP to ALL 4 IoT repos (drop `::text`). [quick, real 503 fix]
2. R6 razryad → MUSLIMBEK-PROMT-ORG-RAZRYAD-FIX (in flight).
3. R4 i18n + R5 Sentry → MUSLIMBEK-PROMT-LOCAL-CLEANUP. [cosmetic/local]
4. R7 stubs → spot-verify each, fix the real ones (crm-extended, mock-queue). [needs verify]
5. R2/R3 uuid-vs-int → **owner decision** (schema realignment — two-worlds; bigger, may belong to vision-build).
6. Over-claims + both-int casts + R8 stub routes → NOT cleanup-phase (over-claims dismissed; stub pages = vision-build).
