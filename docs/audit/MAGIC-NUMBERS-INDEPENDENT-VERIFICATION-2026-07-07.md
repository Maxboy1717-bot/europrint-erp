# Magic-Numbers M2-M11 — Independent Full Verification

**Date:** 2026-07-07
**Auditor:** Independent verification pass (fresh session, not the executor).
**Method:** Every claim backed by a `git show` / file:line / live-DB / test-run citation. Investigation only — nothing modified.
**Repo root:** `Uzbek-Language-Module/` (outer `EuroPrint-Clean/` is not a git repo).
**Sources:** `docs/audit/MASTER-STATUS-BOARD-2026-07-06.md` (line 35 top-row claim), `docs/audit/MAGIC-NUMBERS-AUDIT-2026-07-05.md` (v1, Top-10 = the M-numbering), `docs/audit/MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md` (v2).

---

## Overall Verdict: **CONFIRMED-WITH-CONCERNS**

The magic-numbers work is **partially done**, and the shipped commits are honest and well-scoped — but the board's top-row summary ("M2/M3/M4/M6/M7/M9/M11(partial) done") **overstates M6 and M9**, and the task's premise that **M8 is "claimed done" is wrong**: M8 has zero commits and was never claimed done by the board.

A recurring positive: the executor's **commit messages consistently under-claim** (they self-label "2/4 items", "cluster 1/7", "not consolidated with X", "separate larger task") — it is the board's one-line roll-up that compresses those honest partials into a flat "done."

### Plain answer: is M2-M11 done, partially done, or not started?
**PARTIALLY DONE.** Of the 8 non-excluded items:
- **Fully done & independently verified (4):** M2, M3, M4, M7
- **Partially done (3):** M6 (2 of 4 items), M9 (consolidation only, 1 divergent site left, no config schema), M11 (1 of 7 clusters)
- **Not started (1):** M8 (role-catalog unification) — 0 commits
- **Correctly untouched / owner-excluded (3):** M1, M5, M10

---

## Per-item table

| Item | Board claim | Commit(s) | Independently verified? | Verdict |
|---|---|---|---|---|
| **M1** (payroll FE/BE tax drift) | excluded | none | Yes — 0 commits, still hardcoded | CONFIRMED excluded (untouched as expected) |
| **M2** (FX rate) | done | `31c6953c` | Yes — live `exchange_rates`=8 rows, code prefers DB (`source:'db'`), RUB named | **CONFIRMED** |
| **M3** (fabricated data, 4 sites) | done | `9919dc92`,`2cb7f7d4`,`e2acd40b`,`6eb82b18` | Yes — all 4 sites real / honest-empty / disclosed-estimated | **CONFIRMED** |
| **M4** (approval thresholds) | done | `6e92aaf7`,`110aa00f` | Yes — backend PO-ceiling HITL + cycle-count config; dead FE removed | **CONFIRMED** |
| **M5** (GL tolerance 0.01) | excluded | none | Yes — 0 commits (GL restriction) | CONFIRMED excluded |
| **M6** (safety/approval gates, "4 items") | done | `f069bb09` (2/4) | Yes — 2/4 done; QC-lot `0.05` + quarantine `RM-MAIN`/`QC-HOLD` STILL hardcoded | **CONTRADICTED (board overstates "done"; actually 2/4 PARTIAL)** |
| **M7** (security thresholds + role fix) | done | `deb801c3` | Yes — lockout constant consolidated + real `rbac_tier` lookup; tests pass | **CONFIRMED** (explicitly defers full role consolidation to M8) |
| **M8** (role-catalog unification, ~70 files) | *not claimed by board* | **none** | Yes — 0 commits; 759 uppercase role literals + `WH_READ` still has `ERP_MANAGER`/`admin` | **NOT STARTED** (task's "claimed done" premise is wrong) |
| **M9** (EOQ config) | done | `81126af9` | Yes — shared constants consolidate 2 sites; `mrp-run-eoq` 50k left divergent; no settings schema | **CONFIRMED-WITH-CONCERN (partial)** |
| **M10** (Aisha) | excluded | none | Yes — 0 commits | CONFIRMED excluded |
| **M11** (7 duplication clusters) | partial | `d2a216b1` (1/7) | Yes — only LMS pass-score done; other 6 clusters still duplicated | **CONFIRMED partial (1/7)** |

**Commit-ledger cross-check** (`git log | grep '(M<n>'`): M1=0, M2=1, M3=4, M4=2, M5=0, M6=1, M7=1, M8=0, M9=1, M10=0, M11=1. Matches the analysis above exactly.

**Board self-inconsistency (LOW):** the board's own *detailed* rows (lines 216–253) still list every magic-numbers finding as `QUEUED-NOT-STARTED / 0%` — directly contradicting its top-row "done" summary (line 35). The detailed table was never updated as items shipped.

---

## Detailed verification

### M2 — FX rate `31c6953c` — CONFIRMED
- **Live DB:** queried `exchange_rates` → **8 rows**: 4 `source='seed-initial'` dated 2026-07-05 (USD 12700, EUR 13800, RUB 140, CNY 1750 — exactly the M2 seed values) + 4 `source='CBU-API'` dated 2026-07-06 (real feed). The table is genuinely populated now (was 0 rows per the audit).
- **Code prefers DB:** `finance-main.controller.ts:76 getExchangeRates()` runs `SELECT ... FROM exchange_rates`, returns `source:'db'` when rows exist (line 95); on empty/error it `Logger.warn`s and falls back to named constants with `source:'default'` (lines 97-106).
- **Magic number named:** `RATE_RUB_UZS = 140` added to `app.constants.ts`; the inline `RUB: 140` literal replaced with the constant.
- **Honest scope:** commit message itself corrects the audit's overstatement ("read path already preferred the DB correctly — the real gaps were narrower"). Accurate.
- *Test note:* `finance-main.controller.exchange-rates.spec.ts` could not run under jest here (`DATABASE_URL must be set` — not injected into the jest process); M2 is confirmed via the live-DB + code inspection above instead.

### M3 — fabricated data, 4 sites — CONFIRMED
1. `9919dc92` (finance AR overdue): `total * 0.3` → real `COALESCE(SUM(CASE WHEN payment_date < targetDate - threshold THEN amount ELSE 0 END),0)`. Regression grep: `total * 0.3` = **0** occurrences left.
2. `2cb7f7d4` (general warehouse-KPI): fabricated `occupancyRate: 72.5` removed (dead helper, zero callers). Regression grep: the only remaining `72.5` hit is a **code comment** documenting the removal, not a live value.
3. `e2acd40b` (AI planning repo): fabricated `confidenceScore: 87` → `0`, `optimizationMetrics: {…fake…}` → `{}` (honest-empty). Regression grep: `confidenceScore: 87` = **0** left.
4. `6eb82b18` (agents OEE): availability now scoped by `machineId` (was ignoring it, summing hardcoded 0.92/0.85/0.97); adds `estimated: true` so callers can distinguish real availability from still-placeholder performance/quality — disclosed, not silently fabricated.
- All 4 either compute real values or return honest-empty/disclosed placeholders. Matches the "real computation or honest empty" bar.

### M4 — approval thresholds `6e92aaf7` + `110aa00f` — CONFIRMED
- **Part 1** removed dead client-side ZVS approval-matrix code (`business-logic.ts` + its test) — FE-only, no backend equivalent lost.
- **Part 2** added `business-config.helper.ts::getConfigNumber(key, fallback)` reading the generic `settings` table, wired into:
  - **PO ceiling (real backend gate):** `create-purchase-order.handler.ts:57` reads `getConfigNumber('po_max_amount_uzs', PO_MAX_AMOUNT_UZS)`; when exceeded it publishes `PoRequiresDirectorApprovalEvent` → HITL director approval (`hitl_approvals`). This is genuine **backend enforcement**, answering the task's "not just frontend display" concern.
  - **Cycle-count variance:** `barcode-warehouse.service.ts` reads `cycle_count_auto_adjust_pct`/`cycle_count_supervisor_pct` to drive `AUTO_ADJUST` vs `SUPERVISOR_APPROVAL` in the backend.
- Test `barcode-warehouse-cycle-count.spec.ts`: **PASS** (ran here).

### M6 — safety/approval gates — CONTRADICTED (board says "done"; actually 2/4)
- Only commit `f069bb09`, self-labelled **"2/4 items"**:
  - ✔ `ai_auto_reject_score` now `getConfigNumber('ai_auto_reject_score', 30)`.
  - ✔ IoT anomaly detection now reads each device's `iot_sensors.min_threshold/max_threshold` instead of a single hardcoded `90` (falls back to 90 only when a device has none).
- **The other 2/4 are still hardcoded** (regression grep):
  - QC lot auto-fail: `qc-extended.service.ts:66` `defects / total > 0.05 ? 'failed'` — still an inline literal (v1 #5).
  - Quarantine routing: **10** occurrences of `'RM-MAIN'`/`'QC-HOLD'` literals still present (v1 #4).
- Test `record-sensor-reading.handler.spec.ts`: **PASS**. But the board's flat "M6 done" is **inaccurate** — it's 2/4.

### M7 — security thresholds + role fix `deb801c3` — CONFIRMED
- Consolidated `MAX_FAILED_LOGIN_ATTEMPTS` into `security.constants.ts`; both call sites import it.
- Replaced positionId numeric-range **guessing** with a real `resolveRoleFromPositionRbacTier()` that reads `positions.rbac_tier` (100% populated live).
- Explicitly discloses: "Full role-enum consolidation is a separate, larger task" — i.e. M7 does NOT claim M8.
- Test `employees-org-assignment-role.spec.ts`: **PASS** (ran here).

### M8 — role-catalog unification (~70 files) — NOT STARTED
- **Zero commits.** The board's top row never lists M8 as done; its detailed rows mark v1 #10 "QUEUED-NOT-STARTED 0%" and the parallel "Role-catalog finalization (~36 catalogs) IN-PROGRESS 20%". The task's assumption that M8 was "claimed done" is incorrect.
- **Live evidence it's untouched:** `759` uppercase role string literals across the BE; `WH_READ = ['super_admin', ..., 'ERP_MANAGER', 'admin', 'manager', ...]` still mixes lowercase with the non-existent uppercase `'ERP_MANAGER'`; `@Roles('EMPLOYEE','HR_SPECIALIST','HR_MANAGER','TRAINING_OFFICER','SUPER_ADMIN','DIRECTOR')` used **34×**; duplicate local `enum Role {…}` definitions in ≥10 controllers (design/finance-advance/finance-gl/finance-invoices/finance-payments/iot-sensors/logistics/marketing/…).
- **BUT the security premise behind #10/M8 is MOOT** — I traced the guard: `roles.guard.ts` normalizes **both** sides with `.toLowerCase()` (lines 82, 93), applies a case-insensitive `super_admin/admin/director` bypass (line 89), and is **fail-CLOSED** (`throw new ForbiddenException` when nothing matches, lines 98-100). So the uppercase `@Roles` are **not "dead guards"** — they match correctly at runtime. That normalization landed **2026-06-26** (`21d775de`), *before* the 2026-07-05 audit, so v1 #10's "authorization never matches / security-relevant" framing was **already false when written**.
- **Net:** M8 remains an unshipped code-hygiene / maintainability task (~36 divergent catalogs, dead list entries like `'ERP_MANAGER'`/`'admin'` that aren't in the enum). No live authorization vulnerability. The role-authorization test suites I ran (`roles.guard.spec.ts`, `roles-guard.spec.ts`, `roles-guard-extended.spec.ts`, plus M7's role test) **all PASS** (38 tests), corroborating that role matching works end-to-end.

### M9 — EOQ config `81126af9` — CONFIRMED-WITH-CONCERN
- Moved `DEFAULT_ORDERING_COST_UZS=150_000` / `DEFAULT_HOLDING_COST_PCT=0.20` into a shared `wms/domain/constants/eoq.constants.ts`, imported by both `wms-eoq.service.ts` and `eoq-calculator.service.ts`. Real de-duplication of those 2 sites.
- **Two concerns:** (a) the commit itself discloses it is **"NOT consolidated with `mrp-run-eoq.helper.ts`'s ordering-cost=50_000"** — a third EOQ cost with a *different value* remains divergent; (b) the task expected "schema + consolidation" but M9 is a **named-constant** only — no `settings`/config-table backing, so it's not owner-tunable without a deploy. Consolidation ✓, config schema ✗.

### M11 — duplication clusters — CONFIRMED partial (1 of 7)
- Only `d2a216b1`: consolidated 9 `?? 70` LMS pass-score fallbacks onto `LMS_GENERAL_PASS_THRESHOLD_PCT` (self-labelled **"cluster 1/7"**).
- The other 6 clusters remain hardcoded/duplicated (regression grep): OEE bands (**6** sites), AR/AP aging `90/60/30` (**116** FE sites), material-type taxonomy (**60** sites), plus lead-scoring / order-state-machine / 48h-SLA clusters untouched.
- Board honestly labels this "M11(partial)."

---

## Step 4 — Residual/regression grep (did fixed patterns creep back?)
| Pattern (fixed) | Expected | Found | Status |
|---|---|---|---|
| `total * 0.3` (M3 AR) | 0 | 0 | clean |
| `confidenceScore: 87` (M3 AI) | 0 | 0 | clean |
| `occupancyRate: 72.5` (M3 general) | 0 live | 0 live (1 comment) | clean |
| QC lot `> 0.05` (M6 undone) | still present | 1 | as expected (M6 2/4) |
| `RM-MAIN`/`QC-HOLD` (M6 undone) | still present | 10 | as expected (M6 2/4) |
| OEE / aging / material-type (M11 undone) | still present | 6 / 116 / 60 | as expected (M11 1/7) |

No fixed pattern regressed; every still-present instance corresponds to a genuinely-undone item.

---

## Step 5 — Authorization test run (M8 highest-risk area)
Ran with jest (`--runInBand`): **6 of 7 suites pass, 38 tests pass.**
- PASS: `unit/guards/roles.guard.spec.ts`, `roles-guard.spec.ts`, `roles-guard-extended.spec.ts`, `compatibility/employees-org-assignment-role.spec.ts` (M7), `barcode-warehouse-cycle-count.spec.ts` (M4), `record-sensor-reading.handler.spec.ts` (M6).
- FAIL: `finance-main.controller.exchange-rates.spec.ts` (M2) — **environment only** (`DATABASE_URL must be set` at suite load; jest doesn't inject `.env`). Not a code failure; M2 verified via live DB instead.

---

## Findings by severity
| Severity | Finding |
|---|---|
| **HIGH** | **M6 is 2/4, not done** — board's "M6 done" is inaccurate; QC-lot `0.05` accept/reject gate + quarantine `RM-MAIN`/`QC-HOLD` safety routing (both v1 "safety" Top-10 items) remain hardcoded. |
| **MEDIUM** | **M8 not started** (task assumed done) — ~36 role catalogs / 759 uppercase literals uncleaned. *Mitigant:* no live auth vulnerability (guard is case-insensitive + fail-closed; #10's "dead guards" premise was already false). |
| **MEDIUM** | **M9 partial** — 3rd EOQ cost (`mrp-run-eoq` 50k) left divergent; no config-schema despite "schema" expectation. |
| **LOW** | **M11 is 1/7** (board discloses "partial", so accurate). |
| **LOW** | Board detailed table (216-253) stale at "QUEUED-NOT-STARTED 0%", contradicting its own top-row "done". |

---

## What is CONFIRMED vs UNCONFIRMED
**Confirmed:** the full M-commit ledger; M2 (live DB + read path); M3 (all 4 sites + regression grep); M4 (backend HITL enforcement + test); M7 (code + passing test); M8 not-started (759 literals) and its security-moot status (guard trace + history); M9 partial (diff + disclosed divergence); M11 1/7 (diff + regression grep); authorization test suite passing.
**Unconfirmed:** M2's own jest spec pass/fail (env-blocked on `DATABASE_URL`; covered by live-DB verification instead). Fully closing it needs `DATABASE_URL` exported into the jest process.

*Investigation only — nothing fixed. Report ends.*
