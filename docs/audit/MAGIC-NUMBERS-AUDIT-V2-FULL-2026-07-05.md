# EuroPrint ERP — Magic Number / String Audit v2 (module-by-module, additive to v1)

**Date:** 2026-07-05
**Type:** Read-only investigation. Nothing modified.
**Additive to** `MAGIC-NUMBERS-AUDIT-2026-07-05.md` (findings #1–30 remain authoritative). This pass adds **~578 NEW file:line findings** (numbered #31 onward, grouped by module below).
**Denominator:** backend `apps/api/src` = **2722** files (excl. tests/generated); frontend `artifacts/erp-dashboard/src` = **1720** files. **Total = 4442 files.**

## ⚠️ Honest completeness statement (read this first)

**Genuine line-by-line reading of all 4442 files was NOT achieved in one pass** — that is not feasible at this volume, and the task rules require me to say so rather than imply 100%.

What actually happened, per the coverage log below:
- **Every module was swept** — 22 module-group sub-investigations, each covering all files in its scope by content-grep, and **opening/reading in full the business-logic-bearing files** (services, handlers, repositories, aggregates, constants, domain, and the taxonomy/threshold-heavy pages/components) where magic values concentrate.
- **~663 files were opened and read line-by-line** (≈ 540 backend + ≈ 123 frontend). The remaining ~3,780 were **pattern-scanned, not fully read** (dominated by DTOs, thin controllers, raw-SQL passthrough repos, wiring/module files, and UI files with only formatting/status-render code).
- **True full-read coverage ≈ 15% of files; grep-scan coverage ≈ 100% of modules.** The 15% was deliberately the high-signal 15% — but low-signal files could still hide a stray constant, so this is **not** a completeness guarantee. The v1 audit's "30 findings" was a surface sample; this pass is ~20× deeper but still not exhaustive at the individual-line level.

**No module was skipped or left "queued."** All 33 backend module folders + all frontend areas were processed. Where an agent grep-scanned rather than opened a file, it counted that as *scanned*, not *opened* (reflected honestly in the numbers).

---

## 1. Coverage summary (proof of module coverage)

| Module group | Total files | Files opened (full read) | Coverage (full-read) | New findings |
|--------------|------------:|-------------------------:|---------------------:|-------------:|
| **Backend** | | | | |
| hr | 293 | 24 | ~8% | 27 |
| finance + fi | 173 | 23 | ~13% | 18 |
| pos + queue + order-workflow | 199 | 19 | ~10% | 13 |
| crm + marketing | 192 | 22 | ~11% | 16 |
| wms + logistics | 163 | 29 | ~18% | 19 |
| qc + mm | 155 | 23 | ~15% | 14 |
| director + kanban | 147 | 24 | ~16% | 10 |
| pp + mes | 158 | 23 | ~15% | 9 |
| sd + ecommerce | 112 | 18 | ~16% | 27 |
| ai + ai-agents + agents + aisha | 197 | 138 | ~70% | 124 |
| iot + camera + design | 92 | 27 | ~29% | 19 |
| org-structure + auth + security + admin | 141 | 39 | ~28% | 19 |
| compatibility + integration | 104 | 15 | ~14% | 26 |
| lms + notif + comm-center + chat + bot-gw | 190 | 33 | ~17% | 21 |
| remaining + mro + erp + general + core + misc | 103 | 42 | ~41% | 18 |
| common + shared + infra + cron + config | ~280 | 41 | ~15% | 29 |
| **Frontend** | | | | |
| pages/ A–G (root) | 274 | 11 | ~4% | 27 |
| pages/ H–P (root) | 286 | 24 | ~8% | 30 |
| pages/ Q–Z (root) | 234 | 21 | ~9% | 23 |
| pages/ subdirectories | 299 | 14 | ~5% | 35 |
| components/ | 486 | 35 | ~7% | 33 |
| pos-monitor + lib + hooks + constants + routes | 120 | 18 | ~15% | 21 |
| **TOTAL** | **~4442** | **~663** | **~15%** | **~578** |

> The AI cluster stands out (~70% full-read) because its files are small and dense with fabricated-data + threshold constants; the frontend root-pages coverage is lowest (~4–9% full-read) because those ~800 files are mostly UI with a thin taxonomy/threshold layer that was grep-targeted. New findings still surfaced heavily there.

---

## 2. Highlights before the full tables

**The two systemic patterns this deep pass exposed (that v1's sample missed):**

1. **Fabricated numbers returned as real computed data** — pervasive, especially in AI/agents and dashboards: OEE components (`perf 0.85, quality 0.97` `agents/production-agent.service.ts:114`), AI planning confidence/metrics (`87/84/76/32` invented, `drizzle-ai-planning.repo.ts:105`), AR overdue `total*0.3` (`financial-reports-query.helpers.ts:101`), warehouse occupancy `72.5` (`legacy-warehouse.helpers.ts:253`), discrimination index `0.40` (`analytics-extended-base.repository.ts:122`), design verify score by status (`design-extended.repository.ts:113`). These are magic-constant *and* GREEN-LIE.

2. **The same business rule hardcoded 3–8× with live drift** — the highest-risk category. Payroll-tax truths disagree (FE `0.10` vs BE controller `12/8` vs domain `JSHD=1%`); grace period `5` (cron) vs `15` (constants); two GL account-code maps; three role catalogs; multiple OEE bands (`0.65/80/85`); 4+ lead-scoring formulas; three material-type taxonomies.

**A newly-found HIGH cluster worth surfacing:** hardcoded **FX rates in `common/constants/app.constants.ts:121-123`** (`USD=12700, EUR=13800, CNY=1750`) are served live by a finance controller while the `exchange_rates` config table exists **but is empty** — every currency conversion uses a stale baked-in rate.

---

## 3. Full findings tables (by module, findings #31 → ~#608)

Each module's table follows the columns: `File:line | Value/constant | Business meaning | Config table? | Dup count | Severity`. Rows are additive to v1's #1–30.



---

## HR

Coverage log:
`hr | 240 (excl .spec/.dto/.types) | 24 fully opened + full-module grep sweep | 27 new findings`

Honesty note: I fully READ 24 substantive business-logic files (all domain/services, payroll, leave, recruitment scoring, analytics, onboarding/offboarding workflow, career-path, behavioral-analyzer, daily-report, monthly-card, VOs). The remaining ~215 files (controllers, repositories, telegram-bots/*, gateways, DTOs, cron helpers) were SCANNED via targeted greps for threshold/score/enum patterns, not opened line-by-line. Findings below are NEW file:line instances not in the 2026-07-05 dedup doc.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| recruitment/recruitment-stats.service.ts:63-73 | `*2 cap15, *3 cap15, *5 cap20, *3 cap10, *4 cap10, *5 cap10, *10 cap20` | Recruiter weekly KPI scoring rubric (per-stage weights + caps), 0..100; drives recruiter rating/pay | NO | 1 | HIGH |
| recruitment/recruitment-stats.service.ts:96-103 | `>=5%`, `>=1`, `>=3`, `>=80`/`>=50` | HR funnel health-check pass thresholds + HEALTHY/MODERATE/CRITICAL status cutoffs | NO | 1 | MEDIUM |
| recruitment/recruitment-assessment.service.ts:18-29 | `POSITION_IDEAL_PROFILES` map | Per-position ideal Tool-Test A–J point thresholds (10 positions) — hiring-fit taxonomy | NO | 1 | MEDIUM |
| recruitment/recruitment-assessment.service.ts:45-47 | `>=60`, `>=20 && <20`, `<-50` | Candidate category classifier (FLAGMAN/PROTSESSNIK/TRABLDAYKER) thresholds | NO | 1 | MEDIUM |
| recruitment/recruitment-assessment.service.ts:118 | `>=70` | Position-match recommendation SUITABLE/NOT_SUITABLE cutoff | NO | 1 | MEDIUM |
| recruitment/recruitment-assessment.service.ts:67-70 | `>=80` COMPULSIVE, `>=30` HIGH, `>=0` MEDIUM | Tool-Test point interpretation tiers | NO | 1 | LOW |
| recruitment/recruitment-assessment.service.ts:144-145 | `overallScore >= 5`, `< 5` | Productivity-interview category classifier thresholds | NO | 1 | LOW |
| leave/leave-accrual.service.ts:27-31 | `DEFAULT_LEAVE_POLICY` 28/7/3 | Annual/sick/personal leave days-per-year accrual policy (statutory + company) | NO (leave_types exists but not accrual days) | 1 | MEDIUM |
| analytics/attrition.service.ts:99-100,113 | `>30` CRITICAL, `>15` WARNING, `<15`/`>30` benchmark | Turnover-rate health benchmark cutoffs | NO | 1 | MEDIUM |
| analytics/attrition.service.ts:63-65,104-106 | `<6` HIGH, `<24` MED, `>=24` LOW | Tenure-risk bands (months) — repeated in filters | NO | 2 | MEDIUM |
| analytics/utilization.service.ts:74-75 | `targetMin=60`, `targetMax=85` | Default utilization target band (operator) when not passed | NO | 1 | MEDIUM |
| analytics/utilization.service.ts:62 | `targetMax * 1.1` | OVERLOADED threshold = 110% of target max | NO | 1 | MEDIUM |
| offboarding/offboarding-workflow.service.ts:37-46 | `STANDARD_OFFBOARDING_CHECKLIST` | 8-item exit checklist (required flags) hardcoded — onboarding has a DB checklist table, offboarding does not | NO (onboarding_checklists exists for onboarding) | 1 | MEDIUM |
| offboarding/offboarding-workflow.service.ts:153 | `['voluntary','termination','retirement','end_of_contract','mutual']` | Dismissal-type enum taxonomy | NO | 1 | LOW |
| domain/services/kpi.service.ts:93-94 | `> 5` / `< -5` | KPI trend improving/declining "meaningful change" cutoff | NO | 1 | MEDIUM |
| payroll/bonus.service.ts:16 | `VALID_BONUS_TYPES` array | Bonus-type taxonomy (performance/kpi/kaizen/quality/attendance/special/other) | NO | 1 | LOW |
| career-path/career-path.service.ts:31,45,118 | default `12` | Default career-path duration (months) when unset | NO | 3 | LOW |
| career-path/career-path.service.ts:120 | `elapsed > estimated*1.2 && progress<80` | Behind-schedule alert thresholds | NO | 1 | MEDIUM |
| career-path/career-path.service.ts:48 | `(timeProgress + skillsProgress)/2` | Equal-weight 50/50 blend of time vs skills progress | NO | 1 | LOW |
| ai-interview-v2/behavioral-analyzer.service.ts:153 | `<0.4` low, `<0.7` medium | Interview confidence-label cutoffs | NO | 1 | LOW |
| ai-interview-v2/behavioral-analyzer.service.ts:77,102-103,107,150-151 | `0.5` posture/attention fallback | Midpoint score returned when AI/data missing (fabricated-neutral) | NO | 1 | LOW |
| onboarding/onboarding-progress.service.ts:41 | `AT_RISK_PASS_RATE_THRESHOLD=0.6` | Onboarding at-risk checkpoint pass-rate cutoff (named local, not centralized) | NO | 1 | LOW |
| telegram-bots/boomerang-embedding.service.ts:101,111 | `score: 1.0`, `score: 0.5` | Hardcoded candidate match score returned as if computed when embeddings unavailable | NO | 1 | MEDIUM |
| onboarding/onboarding.service.ts:105 + onboarding/repos/drizzle-hr-onboarding.repo.ts:27 | default `90` | Probation/onboarding duration days default | NO | 2 | MEDIUM |
| onboarding-checklists/onboarding-checklists.repository.ts:61 | `totalItems ?? 12` | Default checklist item count fallback | NO | 1 | LOW |
| employees/employee-monthly-card.service.ts:67,80 | `0::int days_absent`, `0::numeric kpi_score` | Placeholder 0 emitted into monthly card as if computed (KPI never wired) | NO | 1 | LOW |
| domain/value-objects/funnel-stage.vo.ts:37-93 | `HC_/LEGACY_/EXTRA_/FUNNEL_STAGES` arrays | Recruitment funnel stage taxonomy (state-machine keys; live hr_candidate_funnels rows keyed on these strings) | NO (hr_candidate_funnels stores string stages) | 1 | LOW |

Notes on files judged CLEAN (config-driven / no business magic): domain/services/hr-rating.service.ts (weights+thresholds already in business.constants), domain/services/overtime-calculator.service.ts (reads overtime_policy DB table), payroll/ckp-gate.ts (reads ckp_report_deadline_hours from org_departments; 0/1 factors named), payroll/payroll.service.ts (named local PAYROLL_* neutral 1.0 defaults + /100 divisor, documented for centralization), domain/value-objects/salary.vo.ts (gross-only, no tax constants), safety/hr-safety.service.ts + feedback-360/feedback-360.service.ts + skills-matrix/skills-matrix.service.ts (pure delegation), daily-report/daily-report.service.ts (only cron/pagination/PDF-pixel constants), common/hr-v2-seed.service.ts (legitimate seed data for fine_rules/achievements config tables).


---

## Finance / FI

Coverage log (module | total_files | files_opened | findings):
- finance | 172 | 22 opened (read in full) + rest grep-scanned | 18
- fi | 1 | 1 opened (re-export shim, no logic) | 0

Method note: 22 substantive files opened & read fully (all domain/services, constants, aggregates, gl-posting, income-split, general-tax, key handlers, cashier cron, query helpers). Remaining ~150 files (repos, DTOs, controllers, cron shells, presentation) were grep-scanned for threshold/rate/multiplier/limit/`0.\d`/role-string patterns, then hits opened for context. NOT 100% line-by-line on every repo/DTO — those are overwhelmingly pagination/limit defaults (excluded per rules) and raw-SQL passthrough.

Dedup: GL tolerance 0.01 (gl-posting.service.ts:154), payroll-tax.constants.ts (0.12/0.01/0.12 — already extracted named constants w/ runtime override path, correct pattern), delivery-completed.listener EP_VAT_RATE 0.12 / EP_COST_RATIO 0.65 (already DB/settings-driven w/ named statutory default, SB0808 fix) — NOT re-reported as findings; only additional-occurrence rows below.

### Findings table
File:line | Value/constant | Business meaning | Config table? | Dup count | Severity

apps/api/src/modules/finance/presentation/payroll-periods.controller.ts:68-73 | `TAX_RATE = 12`, `PENSION_RATE = 8` | Income-tax 12% + pension 8% withholding computed inline in a CONTROLLER for `/calculate-tax`; **PENSION_RATE=8% diverges from the domain constant** PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE=1% (JSHD) — two different payroll-tax truths in one module | NO (payroll-tax.constants.ts exists but not imported here; no DB rate table) | divergent-dup of payroll-tax.constants | HIGH
apps/api/src/modules/finance/financial-reports/services/financial-reports-query.helpers.ts:101 | `total * 0.3` | AR "overdue" amount fabricated as flat 30% of total receivables (overdue60/overdue90plus hardcoded 0) — placeholder returned as if real aging data | NO | 1 | HIGH
apps/api/src/modules/finance/domain/services/variance-analysis.service.ts:59,142 | `VARIANCE_AUDIT_THRESHOLD_PCT = 20` | Auto-flags production order for finance audit + creates kaizen task when variance >20%; approval/audit trigger threshold hardcoded (doc says "configurable" but isn't) | NO (cfo_config exists, not used for this) | 1 | MEDIUM
apps/api/src/modules/finance/domain/services/variance-analysis.service.ts:117 | `: 0.6` (laborShareRatio) | Fallback labor-vs-overhead cost split ratio (60/40) when std costs missing — drives labor/overhead variance decomposition | NO | 1 | MEDIUM
apps/api/src/modules/finance/domain/services/variance-analysis.service.ts:77-78; standard-cost.service.ts:96-97 | `15000` overhead/hr, `25000` labor/hr | Seed default overhead & standard-labor hourly rates (UZS) when cfo_config row absent — feeds standard-cost & variance | YES: cfo_config (key exists, hardcoded fallback) | 2 (both files) | MEDIUM
apps/api/src/modules/finance/domain/services/cashflow-forecast.service.ts:18-19 | `OPTIMISTIC_MULTIPLIER = 1.20`, `PESSIMISTIC_MULTIPLIER = 0.80` | Scenario inflow multipliers (+20%/-20%) for 13-week cash forecast; scenario assumptions hardcoded | NO (cfo_config candidate) | 1 | MEDIUM
apps/api/src/modules/finance/domain/services/cashflow-forecast.service.ts:68 | `50_000_000` | Default minimum cash reserve (UZS) fallback — drives CRITICAL/WARNING liquidity status | YES: cfo_config min_cash_reserve_uzs (hardcoded fallback) | 1 | MEDIUM
apps/api/src/modules/finance/domain/services/cashflow-forecast.service.ts:143 | `2 * minCash` | Liquidity status WARNING band = below 2× reserve; the "2×" buffer multiplier hardcoded | NO | 1 | MEDIUM
apps/api/src/modules/finance/domain/services/cashflow-forecast.service.ts:75-78 | `0.02 / 0.08 / 0.20 / 0.50` | ECL (expected-credit-loss) rate fallbacks by AR aging bucket | YES: cfo_config ar_ecl_rate_* (hardcoded fallback) | additional occurrence of AR-aging ECL cluster | MEDIUM
apps/api/src/modules/finance/application/queries/ar-aging.handler.ts:36-41,57-60 | `DEFAULT_ECL_RATES` (0.02/0.08/0.20/0.50) + inconsistent 2nd fallback (0.01/0.05/0.20/0.50) | ECL provisioning rates; **two-tier fallback disagrees with itself** (0.02 vs 0.01, 0.08 vs 0.05) — data-integrity risk on provisioning | YES: cfo_config ar_ecl_rate_* (hardcoded fallback) | additional occurrence of AR-aging ECL cluster | MEDIUM
apps/api/src/modules/finance/domain/services/break-even.service.ts:46,99-100 | `BREAK_EVEN_WARN_MOS_PCT = 10` + duplicated `"10% dan past"` string literal | Margin-of-safety CFO warning threshold; threshold duplicated as raw text in the warning message | NO | 1 (+1 string dup) | MEDIUM
apps/api/src/modules/finance/financial-reports/services/financial-reports-query.service.ts:53,79 | `30` (overdue days), `120` (overstock %) | Receivables-overdue day threshold + overstock alert % default when settings row absent | YES: settings keys (hardcoded fallback) | 2 | MEDIUM
apps/api/src/modules/finance/domain/services/financial-ratios.service.ts:108-109 | `1_000_000` shares, `1000` UZS share price | Market-cap fallback inputs (shares × price) feeding Altman Z x4 (mktCap/totalDebt) — fabricated equity value when unset | YES: cfo_config shares_outstanding/share_price_uzs (hardcoded fallback) | 1 | MEDIUM
apps/api/src/modules/finance/cashier-hub/cashier-cash-limit-alert.cron.ts:32 | `['cashier','cfo','finance_manager','director']` | Notification fan-out role names matched as string literals instead of role FK/config | YES: roles (enum) | additional occurrence of role-array cluster | LOW
apps/api/src/modules/finance/application/income-split.service.ts:36-37 | `'8500'`, `'5110'` | HEAD/WORKING fund GL account codes hardcoded inline (other 2 funds use GL.* constant) — inconsistent COA sourcing | NO (GL constant exists, these 2 not in it) | 1 | LOW
apps/api/src/modules/finance/financial-reports/services/financial-reports-analytics.service.ts:83 | `slope > 0.01 / < -0.01` | Trend up/down/flat classification threshold hardcoded | NO | 1 | LOW
apps/api/src/modules/finance/application/finance-accounting.service.ts:197; fi/fi.service.ts:178; cashier-hub/cashier-podotchet.service.ts:279; gl/drizzle-finance-gl.repo.ts:93 | `0.01` | Double-entry balance / cash-reconciliation tolerance | NO | additional occurrences of GL-tolerance-0.01 cluster (4 new sites) | LOW
apps/api/src/modules/finance/finance-extended/finance-extended-payroll.service.ts:327 | `half_days * 0.5` | Half-day = 0.5 working day in attendance→payroll conversion (definitional, borderline) | NO | 1 | LOW

### Excluded (true math / infra, per rules)
Altman coefficients 1.2/1.4/3.3/0.6/1.0 + zones 2.99/1.81 (financial-ratios.service.ts:53-59 — documented non-tunable 1968 model); depreciation 200% DB factor, MONTHS_PER_YEAR, 0.0001 floor (depreciation.service.ts); investment.service.ts WEEKS=13, IRR lo/hi/tol; gl-posting.service.ts:194-195 `0.001` allocation epsilon; tech-three-checkpoint.listener.ts:40 `ADVANCE_PCT_TOLERANCE=0.001`; all `limit ?? 10/20/50` pagination defaults; PDF `rgb()` colors (cashier-hub-pdf.service.ts). payroll-tax.constants.ts (0.12/0.01/0.12) treated as already-correct extracted named constants with runtime override — noted only via the divergent payroll-periods.controller HIGH.


---

## POS / Queue / Order-Workflow

Coverage log (honest — most files scanned via targeted grep across services/repos; a subset read in full):
POS | 172 | ~12 read-full, rest grep-scanned (all services + repos) | 11
QUEUE | 11 | 2 read-full (eoq/safety-stock helpers) + rest grep-scanned | 5
ORDER-WORKFLOW | 16 | 5 read-full (transition-status, create-payment-plan, order-status.vo, + dtos/guards/controller grep) | 7

Note: "read-full" = opened with Read. Everything else was grep-scanned for numeric thresholds, inline string arrays, status/account/role literals, and INTERVAL clauses; I did NOT open every one of the 199 files line-by-line, so this is thorough sampling, not 100% line coverage.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| pos/application/services/pos-gl-auto.service.ts:31-56 | Inline GL account codes '2110','6010','1410','1210','9010','9110','8100','8910' | POS movement → GL journal account mapping | NO (accounts table exists but no movement→account map config) | 2 (disagrees w/ auto-gl-posting) | HIGH |
| pos/application/services/auto-gl-posting.service.ts:33-46 | GL_ACCOUNTS map: 1010/2010/2810/6000/4000/9010/9100/9500 | movement-type → debit/credit GL accounts | NO | 2 | HIGH |
| queue/processors/mrp-run-eoq.helper.ts:43,91 | ordering_cost 50000 (SQL + JS fallback) | EOQ per-order ordering cost (UZS) drives PO qty | NO (comment: no ordering_cost_uzs column) | 2 | HIGH |
| queue/processors/mrp-run-eoq.helper.ts:45-47,92 | holding-cost pct A=0.20 / B=0.25 / else 0.30 (fallback 0.25) | annual holding-cost rate by ABC tier for EOQ | NO | 1 | HIGH |
| pos/application/services/three-way-match.service.ts:14-15,43 | QTY_TOLERANCE_PCT=0.05, AMOUNT_TOLERANCE_PCT=0.05 | 3-way match qty/amount variance tolerance (5%) → VARIANCE vs MATCHED | NO (pos_variance_config exists but NOT used here) | 1 | HIGH |
| order-workflow/application/commands/transition-status.handler.ts:21-22,165,173-189 | VIP_TIER/REGULAR_TIER + per-tier payment-seq gate (REGULAR needs seq1&seq2 PAID, NEW/else needs seq1) | customer-tier shipping payment approval rule | NO (no customer-tier config table) | 1 | HIGH |
| queue/processors/mrp-run-eoq.helper.ts:42,49,93 | current_stock*12 floor 100; unit_price fallback 1000 | EOQ demand proxy + default material price | NO | 1 | MEDIUM |
| queue/processors/mrp-run-eoq.helper.ts:50; mrp-run-safety-stock.helper.ts:17,28 | lead_time_days fallback 7 | default supplier lead time (days) | inventory_policy exists (fallback only) | 3 | MEDIUM |
| order-workflow/domain/value-objects/order-status.vo.ts:8-78 | ORDER_STATUSES (31 codes) + ALLOWED_TRANSITIONS adjacency map | order golden-thread lifecycle taxonomy + state machine | NO (document_workflow_routes / workflow_rules exist) | 1 | MEDIUM |
| order-workflow/application/commands/create-payment-plan.handler.ts:13-14 | OVERDUE_DAYS_VIP_THRESHOLD=30, OVERDUE_DAYS_REGULAR_THRESHOLD=90 (declared, currently unused) | payment-overdue thresholds by customer tier | NO | 1 | MEDIUM |
| pos/application/services/pos-inventory-passport.service.ts:64; infrastructure/repositories/quarantine-workflow.repository.ts:118; pos-inventory-passport.repository.ts:149 | 48-hour quarantine SLA (arg 48 + INTERVAL '48 hours') | quarantine expiry/escalation time limit | NO | 3 | MEDIUM |
| order-workflow/application/commands/create-payment-plan.handler.ts:11 | MAX_ENTRIES=10 | max payment-plan installments | NO | 1 | LOW |
| order-workflow/presentation/dtos/create-order.dto.ts:11 + payment-plan.dto.ts:8 | currency enum ['UZS','USD','EUR']; DUE_TYPES ['ADVANCE','MILESTONE','NET_30','ON_DELIVERY'] | currency + payment due-type taxonomies | NO (exchange_rates exists, empty) | 2 | LOW |

Additional occurrences of already-documented clusters (NEW file:lines only):
| File:line | Cluster | Note |
|---|---|---|
| pos/application/services/pos-movement.service.ts:398 | POS movement enums | CONTEXT_TYPES Set(WASTE_IN, LAB_SAMPLE_OUT, PARTIAL_RECEIPT, CUSTOMER_MATERIAL) |
| pos/application/services/quarantine-workflow.service.ts:106 | quarantine RM-MAIN/QC-HOLD | findWarehousesByCode(['RM-MAIN','QC-HOLD']) hardcoded codes |
| pos/application/services/pos-anomaly.service.ts:39 | role-array | ANOMALY_ALERT_ROLES = ['warehouse_manager','pos_manager'] |
| order-workflow/presentation/order-workflow.controller.ts:31-33 | role-array | WRITER_ROLES/READER_ROLES/FINANCE_ROLES inline |
| order-workflow/presentation/guards/order-transition.guard.ts:20-21 + application/queries/list-orders.handler.ts:13 + commands/transition-status.handler.ts:53 | role-array | SCOPED_ROLES/ADMIN_ROLES + inline 'SALES_MANAGER' |
| pos/application/services/pos-shift-handover.service.ts:26 | workflow-status array | OPEN_STATUSES=['draft','from_signed','to_signed'] |

Key cross-check facts:
- pos-variance-config.service.ts IS properly config-driven (reads pos_variance_config, fail-CLOSED) — which makes the hardcoded 0.05 in three-way-match.service.ts a genuine inconsistency, not a missing-table excuse.
- procurement-approval-chain.service.ts is config/DB-driven (org_departments + approval_matrix_config) — no finding.
- The two POS GL account-code maps (pos-gl-auto vs auto-gl-posting) use DIFFERENT code schemes for the same movement types — active drift risk on top of being hardcoded.


---

## CRM / Marketing

Coverage log (HONEST — "opened" = read in full; the rest of the 192 files were grep-swept for threshold/score/limit patterns and are DTO/controller/repo/aggregate CRUD-transport with no business literals):
- crm | 156 | 17 opened (clv, cohort, funnel, kmeans, elo-rating, rfm, churn, churn-retrain, lead-scorer, lead-scorer-v2, crm-lead-scoring.service, crm-lead-scoring.constants, crm-ai.service, crm-ai-extended.service, crm-auto-lead.service, crm-followup-compat.service) + grep-swept remainder | 9 new
- marketing | 36 | 5 opened (marketing-roi.constants, marketing-roi.service, nps-auto-request.listener, marketing-ext.service, marketing-group2.service) + 1 grep-swept (drizzle-marketing-ext.repo) | 3 new

Note: `crm-lead-scoring.constants.ts` and `marketing-roi.constants.ts` are the CORRECT externalized-config pattern (documented, owner-overridable) — NOT findings. The `crm-ai.service`/`lead-scorer` scorers below are the problem: they hardcode the SAME scoring concept inline, duplicating and conflicting with those constants files.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| analytics/kmeans.service.ts:50-54 | 0.7/0.6/0.5/0.3/0.4 centroid cuts → Champions/Loyal/At-Risk/New/Lost | RFM cluster→segment-label thresholds (additional occurrence of RFM/segment cut-point cluster, NEW file, normalized-space cuts) | NO (no crm_segment_rules table) | 5 | MEDIUM |
| domain/services/lead-scorer.service.ts:102-160 | +10/+10/+15/+25/+15/+5 pts, budget 10M/100M, src referral/direct/social, days 7/60, emp 50, tier 70/40 | V1 heuristic lead score — full point table + tier bands hardcoded inline (explicitly NOT externalized; duplicates crm-lead-scoring.constants) | NO (constants file exists but this file bypasses it) | ~15 | MEDIUM |
| domain/services/lead-scorer-v2.service.ts:119-124 | 80/60/40 → HOT/WARM/LUKEWARM/COLD | Lead segment band thresholds hardcoded (different bands than V1's 70/40 and constants' TIER_*) | NO | 3 | MEDIUM |
| application/crm-ai.service.ts:34-47 | base 30, +10/+10/+15/+10/+10/+15, days<7, cap 100; :27 activity 5/2; :28 recommend 70/40 | 3rd inline lead-scoring formula (scoreLead) conflicting with V1/V2/constants — different base & weights | NO | ~9 | MEDIUM |
| application/crm-ai.service.ts:55-60 | demographic 25/10, behavioral min(40,·×8), intent 35, grade 75/50/25 (A/B/C/D) | 4th inline lead-scoring formula (scoreLeadV2) + A/B/C/D grade cut-points hardcoded | NO | ~7 | MEDIUM |
| application/crm-ai.service.ts:69-78 | prob base 30, +20/+15/-10, clamp 5/95, confidence 60/30 | Deal win-probability heuristic fully hardcoded (forecastDeal) — financial forecast_amount derived from it | NO | ~7 | HIGH |
| application/crm-ai.service.ts:99-104,113-117 | nbaMap {call→send_email,…}; days 7/3/14, default 999 | Next-best-action taxonomy + urgency thresholds inline (also dup at crm-ai-extended.service.ts:222-228) | NO (no crm_nba_rules table) | 2 | LOW |
| application/crm-auto-lead.service.ts:73-90 | days 30/14, /45×100, successProb 80−score floor 20, retentionOffer '10% chegirma' when 'yuqori' | churnRescue plan: risk bands + fabricated success-probability + hardcoded 10% discount offer | NO | ~5 | MEDIUM |
| application/crm-auto-lead.service.ts:24 | `score: 50` for deals | Hardcoded fallback score returned as real (additional occurrence of AI score:50 cluster) | NO | 1 | MEDIUM |
| application/crm-ai-extended.service.ts:28-29,278,290 | CHURN_HIGH_RISK_DAYS=60, CHURN_MEDIUM_RISK_DAYS=30; churnProbability days/60×100 | Churn recency bands (named but inline, EP-CRM-063) + linear-ramp fake probability (additional occurrence of churn-days cluster) | NO | 4 | MEDIUM |
| analytics/churn-retrain.service.ts:88,115 | AUC_THRESHOLD=0.70; min 10 samples | ML model deploy-gate threshold + min-sample gate (governance: blocks model activation) | NO | 2 | MEDIUM |
| domain/services/lead-scorer-v2.service.ts:128 | min 50 training samples | Model-train gate (sibling of AUC gate; also crm-lead-scoring uses ≥50 conventions) | NO | 1 | LOW |
| domain/services/elo-rating.service.ts:90,92-97,102-104 | BASE_RATING 1500; OUTCOME 1.0/0.7/0.3/0.0; getK 40/24/16 at ≤20/≤50 games | Supplier/employee ELO reliability rating params (mostly named consts; getK tiers inline) | NO (no elo_config table) | 3 | LOW |
| analytics/funnel.service.ts:26,228 | avgCycleDays default 30 | Fallback sales-cycle default returned into velocity calc as if real (documented fallback) | NO | 1 | LOW |
| infra/repositories/drizzle-marketing-ext.repo.ts:436-438,455 | promoter ≥9, passive 7-8, detractor <7 | NPS classification bands hardcoded in SQL rollup (standard NPS but not config) | NO (no nps_bands config) | 4 | MEDIUM |
| infra/repositories/drizzle-marketing-ext.repo.ts:683-685 | debt>0 & days≥90 high, ≥60 medium, ≥30 low | Marketing churn-risk bands hardcoded (additional occurrence of churn-days cluster; 3rd distinct threshold set 90/60/30) | NO | 3 | MEDIUM |

Already-documented (NOT re-reported as new): churn 0.7/0.4 at churn.service.ts:93,154; RFM cut-points at rfm.service.ts:102-110; CRM win/lost string markers `'won'`/`'lost'` (additional occurrences seen at crm-ai-extended.service.ts:269, crm-ai.service.ts). Excluded per rules: analytics SQL `LIMIT 5000`/`LIMIT 20/50/100` (pagination caps), kmeans/churn-retrain hyperparams (LEARNING_RATE/EPOCHS/MAX_ITER/TOL/N_INIT — algo tuning), round2/round4 `×100/100`.


---

## WMS / Logistics

Coverage log (HONEST — "opened" = read in full; remaining scanned via targeted Grep):
- wms | 137 | 24 opened / ~90 grep-scanned | 14 new findings
- logistics | 26 | 5 opened / ~15 grep-scanned | 3 new findings

Notes on cleanliness: the WMS `domain/constants/*` files are exemplary — all business
taxonomy (quarantine 5-state machine, batch FIFO/FEFO, rulon status, roll GSM/width bounds,
supplier-rating weights, material hazard classes) is already externalised to named constants
with Q-40 provenance comments, so they are NOT flagged. `wms-cycle-count-generator.cron`
correctly imports `CYCLE_COUNT_FREQUENCY_DAYS_A/B/C` from business.constants. Logistics
`geo.service` / `vrp.service` are pure math (Haversine R=6371, coord bounds, algorithm iter
caps) — excluded. Findings below are inline thresholds/defaults NOT externalised or NOT
DB-config-driven despite a business meaning.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| apps/api/src/modules/wms/application/wms-eoq.service.ts:55 | `HITL_PURCHASE_THRESHOLD_UZS = 50_000_000` | PO value above which EOQ result is recommendation-only, buyer sign-off required (approval gate) | NO (additional occurrence of HITL_THRESHOLDS cluster, new file:line) | 1 | HIGH |
| apps/api/src/modules/wms/application/wms-eoq.service.ts:58 | `DEFAULT_ORDERING_COST_UZS = 150_000` | Fleet-wide default cost-to-place-a-PO used in EOQ Wilson formula when material has no override | NO (per-material override implied but no config table) | 2 (dup at eoq-calculator.service.ts:12) | HIGH |
| apps/api/src/modules/wms/application/wms-eoq.service.ts:60 | `DEFAULT_HOLDING_COST_PCT = 0.20` | Fleet-wide annual holding-cost % (capital+storage+spoilage) driving EOQ order qty | NO | 2 (dup at eoq-calculator.service.ts:11) | MEDIUM |
| apps/api/src/modules/wms/application/wms-eoq.service.ts:185 | `Math.max(current_stock * 12, 100)` | Fallback annual-demand floor of 100 fabricated when no movement history → fed into EOQ as if real demand | NO (hardcoded fallback-as-data) | 1 | MEDIUM |
| apps/api/src/modules/wms/domain/services/eoq-calculator.service.ts:11-12 | `EOQ_DEFAULT_HOLDING_RATE=0.20`, `EOQ_DEFAULT_ORDERING_COST=150_000` | Same EOQ fleet defaults, duplicated in domain calculator | NO | 2 (see wms-eoq.service.ts) | MEDIUM |
| apps/api/src/modules/wms/application/wms-analytics.service.ts:57 | `DEAD_STOCK_THRESHOLD_DAYS = 180` | Days-since-movement above which stock is classed "dead stock" | NO | 1 (echoes DIO 180 below) | MEDIUM |
| apps/api/src/modules/wms/application/wms-analytics.service.ts:187,194,202 | `INTERVAL '48 hours'` (×3) | Freshness window deciding whether a material has an "open" purchase requisition (drives ROP alert suppression) | NO | 3 | MEDIUM |
| apps/api/src/modules/wms/application/wms-analytics.service.ts:105 | `daysInventoryOutstanding ... : 365` | Hardcoded DIO of 365 returned as computed value when turnover=0 | NO (fallback-as-data) | 1 | LOW |
| apps/api/src/modules/wms/domain/services/inventory-turnover.service.ts:52-54 | `dio > 180 / > 90 / > 30` | DIO tier thresholds classifying slow/medium/good/fast-moving inventory (interpretation string) | NO | 1 | MEDIUM |
| apps/api/src/modules/wms/application/wms-catalog/abc-aging-expiry.service.ts:33 | `cumulative <= 80 ? 'A' : <= 95 ? 'B' : 'C'` | ABC Pareto cut-offs 80/95 | NO (additional occurrence of ABC-XYZ cluster, new file:line) | 1 | MEDIUM |
| apps/api/src/modules/wms/application/wms-catalog/abc-aging-expiry.service.ts:71 | `ageDays <= 30 ? 'active' : ... 'slow'/'obsolete'` | Aging "active" cut-off 30 days (obsolete/slow-moving classification) | NO | 1 | MEDIUM |
| apps/api/src/modules/wms/application/wms-catalog/abc-aging-expiry.service.ts:124 | `daysLeft <= 7 ? 'critical' : <= 30 ? 'warning' : 'ok'` | Expiry status thresholds 7/30 days | NO | 1 | MEDIUM |
| apps/api/src/modules/wms/application/wms-catalog/stock-turnover.service.ts:119-120 | `turnoverRate >= 1` fast, `< 1` slow | Fast/slow-mover cut-off at turnover 1.0 | NO | 1 | LOW |
| apps/api/src/modules/wms/infrastructure/repositories/wms-counts.repository.ts:93 | `INTERVAL '30 days'` | Near-expiry batch window shown in count/expiry lookup | NO | 1 | MEDIUM |
| apps/api/src/modules/wms/infrastructure/event-handlers/rop-trigger.handler.ts:67 | `DEDUP_WINDOW = '24 hours'` | Idempotency window preventing duplicate auto-ROP requisitions within one business day | NO (named const, hardcoded) | 1 | LOW |
| apps/api/src/modules/wms/domain/services/safety-stock.service.ts:11,15-26,87 | `EWM_ALPHA=0.2`; ABC→Z map (A=2.326/B=1.645/C=1.282 ≈ 99/95/90% service level); `serviceLevel=0.95` default | Z-values are statistical constants, but the ABC-class→service-level POLICY and default 95% are business choices | NO | 1 | LOW |
| apps/api/src/modules/wms/presentation/*.controller.ts (WH_WRITE/WS_READ/WS_WRITE/IT_READ/IT_WRITE/WR_READ/WR_WRITE/WMS_READ/WMS_WRITE/IOT_READ/IOT_WRITE/WMS_WRITE_ROLES/WMS_FLOOR_ROLES) | inline role-name arrays with mixed casing (`'super_admin'` vs `'ERP_MANAGER'` vs `'WAREHOUSE_WORKER'`) | RBAC role gating hardcoded per-controller instead of a shared role-set/DB | roles table exists (additional occurrences of role-array case-drift cluster) | ~13 files | LOW |
| apps/api/src/modules/logistics/application/commands/assign-driver.handler.ts:38 | `status !== 'pending' && status !== 'assigned'` | Delivery-status guard uses raw strings although `DeliveryStatus` enum exists in domain/enums | NO (enum available, not used) | 1 | LOW |
| apps/api/src/modules/logistics/infrastructure/event-handlers/order-status-changed-delivery.listener.ts:38 | `event.newStatus !== 'confirmed'` | Gate firing delivery creation keyed on literal SD order status string | NO (event-payload string match) | 1 | LOW |
| apps/api/src/modules/logistics/deliveries/drizzle-deliveries.repo.ts:35 | `status: 'planned'` | Hardcoded default delivery status on insert instead of `DeliveryStatus` enum | NO (enum available) | 1 | LOW |


---

## QC / MM

Coverage log (per module):
QC | 88 | 12 opened (read fully) + ~20 scanned via grep | 12 new
MM | 67 | 11 opened (read fully) + ~15 scanned via grep | 3 new

Opened fully — QC: qc.constants.ts, qc-aql.constants.ts, qc-aql.service.ts, spc.service.ts, grade-pricing.service.ts, spoilage.service.ts, fmea.service.ts, dpmo.service.ts, qc-parameters.service.ts, qc-extended.service.ts, qc-new.repository.ts (partial), qc-parameters.repository.ts (grep). MM: mm-vendor-rating.constants.ts, mm-vendor-rating.service.ts, mm-goods.service.ts, goods-receipt.handler.ts, purchase-order.aggregate.ts, material-code.constants.ts, approve-purchase-order.handler.ts, po-requires-director-approval.event.ts, layer-formula.service.ts, mm-materials-extras.service.ts, mm-dashboard.repository.ts (partial), drizzle-mm.repo.ts (grep).
Honest note: AQL ISO-2859-1 sampling tables, Shewhart A2/D3/D4/d2 constants, and A&S invNormCdf coefficients were reviewed and EXCLUDED as true statistics/standard-data (files self-document "NEVER tune"). Rows below are business-tunable thresholds only.

Dedup already-found (NOT re-counted as new): MM 3-way tolerance = `MM_THREE_WAY_MATCH_TOLERANCE` (business.constants) used at drizzle-mm.repo.ts:262; QC lot-fail 0.05 = qc-extended.service.ts:66 (reported below as the canonical site / additional occurrence only). HITL_THRESHOLDS director-approval path (po-requires-director-approval) excluded per SAP-CONFORMANCE principle 6.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| qc/constants/qc.constants.ts:11-12 | FMEA_CRITICAL_RPN=200, FMEA_HIGH_RPN=100, FMEA_MEDIUM_RPN=50 | RPN gate: >200 STOP production, >100 mitigation mandatory, >50 monitor. Consumed at fmea.service.ts:94-102,121-124 | NO (no fmea_rpn_threshold table) | 2 (constants + fmea.service) | HIGH |
| qc/constants/qc.constants.ts:26-28 | DELTA_E_PASS_MAX=1.0, DELTA_E_REVIEW_MAX=3.0, DELTA_E_REWORK_MAX=5.0 | Colour accept/reject gate: <1 PASS, <3 REVIEW, <5 REWORK, ≥5 SCRAP (ISO 12647). Print QC pass/scrap decision | NO | 1 | HIGH |
| qc/infrastructure/repositories/qc-new.repository.ts:198 | inline `critical→3, major→2, else→1` severity weights | Defect severity numeric weight used in AI-trend severityScore avg | YES: qc_defect_severity_weights (EXISTS but empty) — should read from it | 1 | HIGH |
| qc/constants/qc.constants.ts:37 | SPOILAGE_ALARM_MULTIPLIER=2 | Alarm when actual spoilage > 2× standard (spoilage.service.ts:81) | NO | 2 (const + service) | MEDIUM |
| qc/domain/services/spoilage.service.ts:26-29 | STANDARD_SPOILAGE_RATE {4color:0.03, 8color:0.05} | Per-print-type standard waste rate; drives variance + alarm gate. (0.05 distinct from lot-fail 0.05) | NO (no spoilage_standard table) | 1 | MEDIUM |
| qc/domain/services/spoilage.service.ts:131 | regex `/8[- ]?color|8[- ]?rangli|cmykx2/` on product name | Derives print type (4/8 color) by string-matching product NAME instead of a material attribute/FK | NO (should be material_cards attribute) | 1 | MEDIUM |
| qc/domain/services/spc.service.ts:77-79 | CP_CAPABLE=1.33, CP_EXCELLENT=1.67 | Process-capability accept band (customer B2B min / 6-sigma class) | NO | 2 (spc + qc-new) | MEDIUM |
| qc/infrastructure/repositories/qc-new.repository.ts:39-41 | CPK_CAPABLE=1.33, CPK_MARGINAL=1.0 | Cpk status gate capable/marginal/incapable — additional occurrence of Cp/Cpk cluster | NO | dup of spc.service | MEDIUM |
| qc/infrastructure/repositories/qc-new.repository.ts:505 | inline `approved→100, conditional→60, else→0` | Supplier-quality status → numeric quality score mapping | NO (status-score map hardcoded) | 1 | MEDIUM |
| qc/infrastructure/repositories/qc-new.repository.ts:336-344 | `< 80` / `≥ 80%` pass-rate target | AI-insight fires "pass darajasi past" below 80%; target hardcoded in msg | NO | 2 (summary + category loop) | MEDIUM |
| qc/application/qc-parameters.service.ts:99-104 | confidenceScore ≥0.8 stable / ≥0.5 warning / else critical + recommendation text | AI test trend + "stop production" recommendation thresholds | NO | 1 | MEDIUM |
| qc/constants/qc.constants.ts:20-23 | SIGMA_6=5.5, SIGMA_5=4.5, SIGMA_4=3.5, SIGMA_3=2.5 | Six-sigma grade band labels (fmea.service:195-198). Standard-derived but tunable label cutoffs | NO | 2 (const + service) | LOW |
| qc/constants/qc.constants.ts:34 | PARETO_VITAL_FEW_PCT=80.5 | Pareto "vital few" cumulative % cutoff (odd 80.5, not 80) (fmea.service:236) | NO | 2 (const + service) | LOW |
| mm/application/mm-vendor-rating.constants.ts:57-74 | GRADE_A_MIN=85, B=70, C=50, D=30, BLACKLIST_MAX=30 | Vendor grade bands + blacklist-candidate gate. Weights are runtime-overridable; these grade cutoffs are NOT and have no config table | NO (only weights overridable) | 1 | MEDIUM |
| qc/application/qc-extended.service.ts:66-67 | `defects / total > 0.05` → 'failed' | In-process inspection fail gate (5% defect rate). Canonical site of the already-found "QC lot fail 0.05" | NO | 1 (already documented) | HIGH (dedup) |
| mm/infrastructure/repositories/mm-dashboard.repository.ts:65 | default vehicle type `'truck'` | Fallback vehicle type string on create | NO | 1 | LOW |

Notes:
- grade-pricing.service.ts, mm-vendor-rating.service.ts, layer-formula.service.ts, material-code.constants.ts are CLEAN — coefficients/weights/GSM come from caller/master-data with Q-40 gates (no fabricated fallbacks); regex is format-validation not business-match. Good models.
- purchase-order.aggregate.ts / approve/goods-receipt handlers: SoD (creator≠approver) and status enums are structural, not tunable — no findings.
- MM MRP reorder (mm-dashboard.repository.ts:48) correctly uses DB `sl.min_stock`/`max_stock` — NOT hardcoded (good).


---

## Director / Kanban

Coverage log:
director | 103 | 19 opened + rest grep-scanned | 8
kanban | 40 | 5 opened + rest grep-scanned | 2

Honesty note: I read ~24 substantive files in full (all application services, the crons, the state/owner-summary/analytics repos, kanban-status, kanban-robot, kanban-stats repo). The remaining ~120 files (DTOs, thin passthrough services, interface repos, controllers, event index, seed, boards/cards CRUD repos) were grep-swept for numeric thresholds / INTERVAL / LIKE / status-string patterns, not opened line-by-line. Not a 100% line read.

Findings table:

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
apps/api/src/modules/director/infrastructure/repositories/director-state.repository.ts:92-95 | `profit >= 130_000_000 && revenue >= 1_000_000_000` → osish; `>=100M & >=800M` → normal; `>=70M & >=600M` → ehtiyot; `>=40M \|\| >=400M` → xavf; else inqiroz | Weekly company health-state (5-band holat) classification for the OWNER dashboard — absolute UZS profit/revenue cut-offs decide the company's state_key. Entirely hardcoded inline, parallel to the config-designed `director-holat.constants.ts` (DEFAULT_HOLAT_THRESHOLDS) and `kpi_definitions` used two lines above for targets. | NO (band thresholds nowhere in DB; `kpi_definitions` holds only the 2 weekly targets, not these 8 band numbers). A `company_state_levels`/`state_thresholds` table is referenced in vision but unused here. | 4 bands | HIGH
apps/api/src/modules/director/infrastructure/cron/zno-zvs-sla-escalation.cron.ts:38-39 | `ZNO_SLA_HOURS = 24`, `ZVS_SLA_HOURS = 48` | SLA escalation deadline (hours) for ZNO payment-requests and ZVS expense-requests before auto-escalation to the next org level. Hardcoded module constants; the sibling `cc-sla.cron` reads `inbox_sla_hours` from a table instead. | NO (no per-doc-type SLA config table; workflow_rules exists but is not wired here) | 2 | MEDIUM
apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo.ts:208-209 | `LOWER(kco.name) LIKE '%kiruvchi%'`/`LIKE '%inbox%'` AND `kc.created_at < NOW() - INTERVAL '24 hours'` | Inbox-card "overdue" rule: a card in an inbox column is flagged overdue after 24h. Both the 24h SLA AND the inbox-column detection are hardcoded — column identified by name substring instead of a column type/flag/id. | NO (no inbox-SLA config; kanban_columns has no type/is_inbox flag driving this) | 1 (24h) + 2 (string match) | MEDIUM
apps/api/src/modules/director/analytics/analytics-extended-base.repository.ts:122 | `... : 0.40` fallback discriminationIndex | When there are no hi/lo scorers, a hardcoded `0.40` psychometric discrimination index is returned as if it were computed (Qoida 10 fake-data pattern). | NO | 1 | MEDIUM
apps/api/src/modules/director/analytics/analytics-extended-base.repository.ts:115-116 | `score >= 80` (high group) / `score < 50` (low group) | Test-item discrimination groups (upper/lower percentile cut-offs). Standard psychometric convention but hardcoded thresholds. | NO | 2 | LOW
apps/api/src/modules/director/analytics/analytics-extended.repository.ts:164-168 | score buckets `<20 / 20-39 / 40-59 / 60-79 / >=80` | Test-score histogram distribution bands. Hardcoded bucket boundaries. | NO | 5 | LOW
apps/api/src/modules/director/infrastructure/repositories/director-data.repository.ts:73 | `INTERVAL '8 hours'` (unresolved IoT alerts) | "Active" IoT alert window — alerts unresolved within last 8h counted as active on director dashboard. Operational threshold hardcoded. | NO | 1 | LOW
apps/api/src/modules/director/application/director-state.service.ts:26 | `daysInMonth: 30` fallback | WMS-rental fallback object returns fixed 30-day month when the query errors (real path computes actual days-in-month at repo:55). Hardcoded default returned as data. | NO | 1 | LOW
apps/api/src/modules/director/application/owner-summary.service.ts:61 | `windowDays: 30` fallback | Sales-trend window default in the error-fallback numbers object; duplicates the real `OWNER_SALES_TREND_WINDOW_DAYS` constant (should reference it, not re-hardcode). | Constant exists (business.constants) but not used in fallback | 1 | LOW
apps/api/src/modules/kanban/domain/kanban-status.ts:50-67 | `STATUS_ALIASES` map (bajarildi/done/tasdiqlangan… ; tekshiruvda/review… ; jarayonda/in_progress… ; reja/backlog/todo/kiruvchi/inbox…) | Inline 4-stage Kanban status taxonomy mapping arbitrary column NAMES → canonical stage via case-insensitive substring match. Business taxonomy hardcoded in code. By-design (live kanban_cards has no status column; documented) but no config/lookup for the alias set. | NO (no kanban_column_status_map table) | ~40 aliases | LOW

Notes on borderline/excluded:
- director-state.repository.ts:33-34 (`PROFIT_TARGET_WEEKLY_DEFAULT=25M`, `REVENUE_TARGET_WEEKLY_DEFAULT=200M`) — NOT flagged: comment SB0369 documents these are now config-backed fallbacks read from `kpi_definitions` (owner-tunable via PATCH). Acceptable defaulting, not a magic-number defect.
- director-holat.constants.ts (weights 0.30/0.25/0.20/0.15/0.10; thresholds 85/65/45/25/0) — this is the CORRECT pattern (named, overridable, validated); it is the exemplar, not a finding.
- analytics DAU/WAU/MAU `INTERVAL '1/7/30 days'` and coordination `INTERVAL '7 days'` — excluded: these are definitional metric windows / standard reporting periods, not arbitrary business rules.
- kanban-robot.service.ts action-type switch (`move_to_column`/`send_notification`/`assign_user`/`add_tag`/`close_sales_order`) — excluded: legitimate code-dispatch vocabulary for a DB-configured rules engine (rules live in kanban_robots table).
- Director HITL approval thresholds (HITL_THRESHOLDS / HitlDocumentType) — already documented (SAP-CONFORMANCE principle 6), not re-reported.


---

## PP / MES

Coverage log (HONEST — "opened" = read in full; rest scanned via targeted Grep, not fully read):
PP  | 107 | 15 opened + ~30 scanned | 9
MES | 51  | 8 opened + ~10 scanned  | 5

Fully opened (PP): pp-intelligence.service, learning-curve.service, gofra-conversion.service, technology-grammage.service, production-priority.service, costing.service, pp-mps.service, pp-ai-planning.service, pp-crp.service, scheduling.service, crp.service(domain), scheduling-capacity.service, scheduling-network.service, production-order.aggregate, get-mrp-report.handler.
Fully opened (MES): mes.constants, get-oee.handler, mes-shifts-stats.service, mes-sos-escalation.service, mes-brak-limit.repo, mes-maintenance.service, downtime-event.aggregate, production-session.aggregate.
Scanned only (grep, NOT full read): technology.*, pp-equipment.repository, mes-shifts-stats.repo, mes-production-sessions.repo, mes-maintenance.repo, drizzle-*.repo, DTOs, controllers, listeners.

CLEAN (checked, NO finding — coefficients passed-in or DB-driven, or world-standard math):
gofra-conversion.service (all take-up/GSM/waste passed in as params; SI constants only), technology-grammage.service (100% DB-driven scrap/grammage/layers, honest complete:false), costing.service (pure variance math), get-oee.handler (world-standard OEE, PERCENT=100, no owner weights), scheduling-capacity/network (CPM/PERT/TOC pure math, PERT 4/6 = statistical formula constants), mes-shifts-stats.repo OEE (100.0/10000.0 = percent scaling, gamification points from DB), technology.repository (scrap_pct/grammage nullable from DB).

### NEW findings

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
pp/domain/services/production-priority.service.ts:58 | `FROZEN_ZONE_DAYS = 3` | Frozen-zone / no-preempt window in days (owner override "~3 days"); decides which production orders cannot be re-sequenced | NO (workflow_rules exists but not for this) | 1 (conflicts w/ pp-ai-planning "~1-2 kun" text) | MEDIUM
pp/domain/services/production-priority.service.ts:47-55 | `PO_PRIORITY_RANK` {shoshilinch:1,yuqori:2,oddiy:3,past:4} + `PO_DEFAULT_PRIORITY` | 4-level production priority band taxonomy + numeric ranks, inline enum | NO | 1 | MEDIUM
pp/application/services/pp-crp.service.ts:75-82 | `CRP_OVERLOAD_THRESHOLD=100`, `CRP_WARNING_THRESHOLD=85`, `CRP_HORIZON_WEEKS=4`, `CRP_WORKING_DAYS_PER_WEEK=5` | Capacity-planning bottleneck warning % + overload % + rolling horizon + factory working-days/week calendar | NO | 1 | MEDIUM
pp/application/services/pp-crp.service.ts:120,169 | `efficiency_rate` fallback `0.85`, `hours_per_day` fallback `8` | Default OEE-efficiency (85%) and shift-length (8h) baked into capacity SQL when work_centers column is NULL | NO (per-WC DB col exists, fallback hardcoded) | 2 | MEDIUM
pp/domain/services/crp.service.ts:83,84 | inline `loadPercent > 85`, `loadPercent > 100` | SAME CRP bottleneck/overload thresholds as above but as raw inline literals (not named) | NO | additional occurrence of CRP-threshold cluster | MEDIUM
pp/application/services/pp-mps.service.ts:114 | `CURRENT_DATE - 28` | 28-day committed-demand lookback window for ATP calculation | NO | 1 | MEDIUM
pp/application/services/pp-intelligence.service.ts:81 | `MRP_DEFAULT_HORIZON = 12` | Default MRP planning horizon (12 monthly buckets = 1 yr) | NO | 1 | LOW
mes/domain/aggregates/downtime-event.aggregate.ts:24-33 | `DOWNTIME_REASON_CODES` (8 codes: MAINT/BREAK/MATERIAL/OPERATOR/QUALITY/SETUP/POWER/OTHER) | Downtime reason taxonomy as inline const array | YES: mes_downtime_reasons / downtime_reason_codes(empty) | additional occurrence (BE) of "downtime reasons" cluster | MEDIUM
mes/infrastructure/repositories/mes-brak-limit.repo.ts:45,202 | `BRAK_FINE_RULE_CODE='TECH_QUALITY_DEFECT'`; createDisciplineRecord hardcodes severity `'major'`, discipline_type `'tech'`, violation_type `'quality_defect'` | Brak→payroll deduction: fine-rule anchor + fixed severity/type classification for auto-generated discipline record | YES for the code anchor (fine_rules); NO for severity/type | 1 | MEDIUM

### LOW / status-string cluster (aggregated — additional occurrences of documented status-string cluster)

File:line | Value | Meaning | Sev
---|---|---|---
pp/application/services/pp-mps.service.ts:72,113 | `status NOT IN ('completed','cancelled')`, `('cancelled','delivered')`, `source 'manual'` | PO/SO lifecycle status string matches instead of FK/config | LOW
pp/application/services/pp-crp.service.ts:149 | `status NOT IN ('completed','cancelled')` | planned-order status match | LOW
pp/application/services/pp-intelligence.service.ts:229,271 | `status IN ('approved','sent','partial')`, `NOT IN ('completed','cancelled')` | PO status match in scheduled-receipts + MPS fallback | LOW
pp/application/queries/get-mrp-report.handler.ts:31 | `status != 'completed' AND != 'cancelled'` | order status match | LOW
mes/application/mes-shifts-stats.service.ts:49 | `{daily:'1 day',weekly:'7 days',monthly:'30 days'}` | leaderboard period→interval inline map | LOW
mes/application/mes-maintenance.service.ts:37 | `progress >= 100 ? 'completed' : 'in_progress'` | task status by percent (100 = completion, acceptable) | LOW
mes/infrastructure/repositories/mes-production-sessions.repo.ts:81-82 | default `setup_checklists` items ('Barcha materiallar skanerlangan', 'Jamoa tayinlangan'…) seeded inline | TB-safety checklist default taxonomy hardcoded in repo | LOW

### Additional occurrence of ALREADY-DOCUMENTED cluster (pp-intelligence 60/0.80 — per instructions, not re-counted as new)
pp/application/services/pp-intelligence.service.ts:313,320 — learning-curve fallback `t1Minutes:60, rate:0.80, cumulativeUnits:100`, `Math.max(...,10)`. Same 60/0.80 pair the orchestrator flagged; the canonical named constants live in learning-curve.service.ts:67-69 (`LEARNING_CURVE_DEFAULT_RATE=0.80`, MIN 0.60 / MAX 1.00) — those are documented (Wright 80% industry default) and intentional, NOT flagged.


---

## SD / Ecommerce

Coverage log:
- SD | 97 | 16 opened + ~30 grep-scanned | 20
- Ecommerce | 15 | 2 opened + 13 grep-scanned | 2

Opened fully: atp-check.handler, drizzle-sd-atp.repo, sd-quotations.service, customer-abc.service, customer-360.builder, customer-360.helpers, orders.constants, sales-order-transitions.constants, sales.repository(partial), sd-lost-orders-reclamations.service, drizzle-sd-lost-orders-reclamations.repo, confirm-advance-payment.handler, sales-order.aggregate(grep), drizzle-sd-customers.repo(grep), contacts-nps.repo(grep), ecommerce.service. Rest grep-scanned (status-string / numeric-threshold sweep across all `sd/**` + `ecommerce/**`).

Notes on what is already config-clean (NOT flagged): ATP lead-time uses named `ATP_DEFAULT_LEAD_TIME_DAYS`/`ATP_IN_STOCK_DAYS` (business.constants); ABC weights use `ABC_SCORE_WEIGHT` / `CUSTOMER_ABC_CUMULATIVE`; ecommerce delivery fee uses `DELIVERY_FREE_THRESHOLD_UZS`/`DELIVERY_FEE_UZS`; commission uses `COMMISSION_RATE`/`SECONDS_PER_DAY`; credit-limit check reads live `c.credit_limit` from DB (genuinely config-driven, no threshold hardcode).

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| sd/domain/aggregates/sales-order.aggregate.ts:22 | `_advanceRequired = 70` | Default required advance-payment %; gates whether an order is blocked from proceeding to production (checkAdvanceAndBlock line 147) | NO (no advance-policy config table) | 1 | HIGH |
| sd/application/sd-quotations.service.ts:112 | `num(cfg.default_markup_percent, 35)` | Default price markup % fallback when `sd_price_formulas` row missing | PARTIAL: sd_price_formulas (fallback still hardcoded 35) | 1 | HIGH |
| sd/application/sd-quotations.service.ts:113 | `num(cfg.vat_rate, 12)` | Default VAT % fallback when config missing | PARTIAL: sd_price_formulas | 1 | HIGH |
| sd/application/sd-quotations.service.ts:85 | `GLUE_FLAP_MM = 40` | RSC carton glue-flap width used in blank-area price geometry | NO (belongs in sd_price_formulas) | 1 | MEDIUM |
| sd/application/sd-quotations.service.ts:106 | `UNITS_PER_LABOR_HOUR = 1000` | Labour throughput assumption feeding productionCost | NO | 1 | MEDIUM |
| sd/application/sd-quotations.service.ts:97-99 | `colors >= 4 / >= 2 / >= 1` | Print colour-count price-tier boundaries | PARTIAL: sd_price_formulas (rates configured, tier cutoffs hardcoded) | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:57-59 | RFM cutoffs 7/30/90/180; 20/10/5/2; 100M/50M/10M/1M UZS | RFM recency/frequency/monetary scoring bands (revenue tiers hardcoded in UZS) | NO | additional occ of RFM cluster | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:64 | `payScore = 80` | Flat payment-score constant returned inside computed segmentation breakdown (fabricated, Q-40 flavour) | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:73 | `abcScore >= 75/50/25 → A/B/C/D` | Customer segment classification thresholds | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:82-84 | days 180/90/45/14 → churn 85/65/40/20/5 | Churn-risk score bands | NO | additional occ of churn cluster | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:86 | `avgMonthlyRevenue * 24` | LTV forecast horizon = 24 months | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:88 | weights `10/8/5/15` | Upsell-probability scoring weights | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:93-94 | `POS_WORDS` / `NEG_WORDS` arrays | Sentiment keyword lexicon (inline UZ/RU/EN taxonomy) | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:41-44 | journeyStage `180 / 60 / 90` | Customer journey-stage day thresholds (lost/at_risk/growing) | NO | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:148,153 | `churnRisk>60`; `churnLabel >=70/>=40` | Churn label/risk-signal bands | NO | additional occ of churn cluster | MEDIUM |
| sd/orders/orders.constants.ts:7-30 + sd/domain/aggregates/sales-order-transitions.constants.ts:13-29 | two divergent inline order state machines (ORDER_STATUS_MACHINE vs SO_VALID_TRANSITIONS) | Order status-transition taxonomy hardcoded twice with different states | Config: workflow_rules / document_workflow_routes exist | 2 | MEDIUM |
| ecommerce/ecommerce.service.ts:124-125 | `validStatuses[]` / `validPaymentStatuses[]` | Ecommerce order + payment status taxonomy inline | NO (no ecommerce-status config table) | 1 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers.repo.ts:23,196 + drizzle-sd-customers/contacts-nps.repo.ts:167-170 | segment↔status map (regular/vip/potential↔active/vip/at_risk) | Segment/DB-status mapping duplicated inline in 3+ places | NO | 3 | MEDIUM |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:81 | `payment_terms_days ?? 30` | Default payment-terms days fallback | NO | 1 | LOW |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:132 | nps `>=50 excellent / >=0 good` | NPS category bands | NO | 1 | LOW |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:186 | `payment_terms_days <= 7` → 'Tez to'lovchi' | Fast-payer insight threshold | NO | 1 | LOW |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:232 | `days <= 30` | Contract expiring-soon window | NO | 1 | LOW |
| sd/infrastructure/repositories/drizzle-sd-customers/customer-360.helpers.ts:118-119 | nps `>=9` promoter / `<=6` detractor | NPS promoter/detractor split (industry std) | NO | 1 | LOW |
| sd/sales/sales.repository.ts:54-55 | column alias `commission_5pct` | Hardcoded "5pct" label while value uses COMMISSION_RATE (drift if rate changes) | NO | 2 | LOW |
| sd/application/sd-quotations.service.ts:123 | `currency: 'UZS'` | Hardcoded price-engine currency | NO | 1 | LOW |
| sd/infrastructure/repositories/sd-quotations.repository.ts:47 | `INTERVAL '14 days'` | Quotation validity default window | NO | 1 | LOW |
| ecommerce/ecommerce.service.ts:179-181 | `'delivery'/'cash'/'new'/'pending'` | Public-order default enum strings | NO | 1 | LOW |


---

## AI / AI-Agents / Agents / Aisha

Coverage log (module | total_ts_files | files_opened(fully read) | findings):
- ai | 102 | 67 substantive (forecast 8, application/services 10, services 21, presentation 18, infrastructure 10; remainder = *.dto/*.spec/*.event/index/domain-types, non-substantive) | 41
- ai-agents | 14 | 12 (skipped module.ts, aisha-tool.types.ts) | 20
- agents | 20 | 19 (skipped agents.module.ts) | 33
- aisha | 61 | 40 substantive (skipped *.event/VOs/ports/index/wiring + grep-scanned send-email/send-telegram/audio-cron/sse-gateway) | 30

Note: all findings from full file reads except a handful in aisha (send-email/send-telegram/assign-task/audio-cron/sse-gateway) grep-scanned. Thin AI presentation controllers delegate to ai/services + ai/application, so their business logic findings live in those files.

### Findings table
`File:line | Value/constant | Business meaning | Config table? | Dup count | Severity`

| File:line | Value/constant | Business meaning | Config table? (YES:name/NO) | Dup count | Severity |
|---|---|---|---|---|---|
| ai/services/ai-automation.service.ts:84 | `score < 30 && REJECT` | Auto-REJECT candidate cutoff — automated HR rejection with no human gate | NO | 1 | HIGH |
| ai/application/services/ai-reservation.service.ts:87 | `quantity * 12_500` | Hardcoded per-unit UZS cost used to compute estimatedCost shown to user | NO (price→exchange_rates/material_cards) | 1 | HIGH |
| ai/application/services/ai-planning.service.ts:65-68 | `count:6/4, '35%', '12 kWh'`, machine names | getBatchGroups returns fabricated batch-optimization data as if computed | NO | 1 | HIGH |
| ai/application/services/ai-planning.service.ts:40-42 | `avgMachineUtilization:84, autoApprovedPct:0` | Fabricated dashboard metrics returned as real | NO | 1 | HIGH |
| ai/forecast/ensemble-forecast.service.ts:34-35 | `CI_WIDTH_HITL=2.0, HITL_CONFIDENCE=0.70` | Human-in-the-loop trigger cutoffs for forecast approval | NO (HITL config) | 1 | HIGH |
| ai-agents/common/ai-agents.constants.ts:22-27 | RISK_W1..W4 0.30/0.40/0.20/0.10 + RISK_AUTO 0.7 | Customer credit-risk scoring weights + auto-execute gate | NO | 4 (sales-copilot 111/143/187/225) | HIGH |
| ai-agents/common/ai-agents.constants.ts:29-31 | tier discount 0/0.05/0.10 | Customer-tier pricing discount | NO | 3 (sales-copilot 86-88) | HIGH |
| ai-agents/common/ai-agents.constants.ts:33-39 | season mult 1.15/1.00/0.90; margin 1.05/1.15/1.25 | Seasonal + margin pricing multipliers | NO | 6 (sales-copilot 80-82,100-102) | HIGH |
| ai-agents/common/ai-agents.constants.ts:47-50 | HITL price 100M/50M UZS; credit 0.20/0.10 | Director-approval price & credit thresholds | NO | 4 (sales-copilot 188-195) | HIGH |
| ai-agents/common/ai-agents.constants.ts:6,9 | AI_AUTO_CONFIDENCE 0.85; AI_PAYMENT_AUTO 0.90 | AI auto-execution confidence gates | NO | 3 (vision-qc,sales-copilot,prepress) | HIGH |
| ai-agents/planning/planner.service.ts:186-190 | annualDemand=jobs*10, orderingCost 500_000, holdingPct 0.20, unitCost 50_000 | Hardcoded EOQ inputs fed as if real | NO | 1 | HIGH |
| ai/infrastructure/repositories/drizzle-ai-planning.repo.ts:40-46 | DEFAULT_CONFIG autoApproval 90, shift 8h, energyWeight 0.3, changeover 15 | Planning auto-approval + shift config held in-memory, never persisted to DB | NO | 1 | HIGH |
| ai/infrastructure/repositories/drizzle-ai-planning.repo.ts:105,108 | confidenceScore 87; metrics {util 84, energyEff 76, changeover 32} | Fabricated confidence + metrics written as real on create | NO | 1 | HIGH |
| ai/presentation/ai-finance.controller.ts:116 | `overallRiskScore ?? 75` | Confidence fallback 75 surfaced to DailyKPI dashboard as real (NEW score-fallback) | NO | 1 | HIGH |
| agents/cashflow-agent.service.ts:112 | `daysOverdue > 30` | Overdue-receivable critical CFO-alert cutoff | NO (ar/credit-terms cfg) | 1 | HIGH |
| agents/inventory-agent.service.ts:71 | `dailyAvg * 7` | Reorder point = 7 days avg demand, hardcoded lead-time | NO (per-material reorder cfg) | 1 | HIGH |
| agents/director-agent.service.ts:86 | `INTERVAL '30 days'` | Order-not-updated window counted as overdue debt (KPI) | NO | 1 | HIGH |
| agents/hr-performance-agent.service.ts:53 | `100 - lateCount*5 + min(20,reports)` | Perf-score formula weights (base 100, −5/late, +1/report cap 20) | NO | 1 | HIGH |
| agents/hr-performance-agent.service.ts:69 | `<40 'high' : <60 'medium'` | Churn-risk score cutoffs | NO | 1 | HIGH |
| agents/hr-performance-agent.service.ts:87 | `>=80 ?0.20 : >=60 ?0.10 :0` | Bonus % tiers by perf score (payroll) | NO | 1 | HIGH |
| agents/lead-scoring-agent.service.ts:45 | `REFERRAL 30/DIRECT 25/WEB 20/else 10` | Lead-source score weights + source string matches | NO (lead_sources cfg) | 1 | HIGH |
| agents/lead-scoring-agent.service.ts:49 | `>=70 'hot' : >=40 'warm'` | Lead category cutoffs | NO | 1 | HIGH |
| agents/production-agent.service.ts:114,119-120 | perf `0.85`, quality `0.97` | OEE performance+quality never computed — fabricated | NO | 2 | HIGH |
| agents/security-agent.service.ts:28 | `HAVING COUNT(*) >= 5` | Failed-login lockout threshold per hour | NO | 1 | HIGH |
| agents/supplier-agent.service.ts:92 | `onTime*40 + quality*30 + 20 + 10` | Supplier composite-score weights | NO | 1 | HIGH |
| agents/supplier-agent.service.ts:93 | `>=80 'A' : >=60 'B'` | Supplier ABC-tier cutoffs | NO | 1 | HIGH |
| aisha/application/tools/what-if-simulation.tool.ts:53 | `35/machine, 250_000 cost, roiMonths 14` | add-machines simulation financial coefficients feeding director ROI | NO | 1 | HIGH |
| aisha/application/tools/what-if-simulation.tool.ts:65 | `18/shift, 90_000 cost, roiMonths 6, night +30%` | change-shift simulation financial coefficients | NO | 1 | HIGH |
| aisha/application/tools/get-financial-summary.tool.ts:40 | `account_code = '1010'` | Cash GL account code hardcoded | YES: accounts (BHMS CoA) | 1 | HIGH |
| aisha/application/conversation/aisha-conversation.service.ts:20 | HIGH_STAKE_TOOLS {send_email, send_telegram_to_team, schedule_meeting} | Which AI actions require human approval (approval gate) | NO | 1 | HIGH |
| ai/forecast/croston.service.ts:110 | `Math.floor(series.length * 0.2)` | Hold-out fraction hardcoded 0.2 while FORECAST_HOLDOUT_FRACTION const exists — drift | NO (const already exists) | 1 | MEDIUM |
| ai/forecast/croston.service.ts:23-25 | DEFAULT_ALPHA 0.1, DEFAULT_BETA 0.1, CV_THRESHOLD 0.5 | TSB smoothing defaults + CV cutoff selecting Croston vs other model | NO | 1 | MEDIUM |
| ai/forecast/ensemble-forecast.service.ts:167,177 | A_H=0.3;B_H=0.1, A_C=0.1;B_C=0.1 | Smoothing params re-hardcoded inline in bootstrap (dup of HW/Croston) | NO | 4 | MEDIUM |
| ai/forecast/ensemble-forecast.service.ts:107 | `seasonLength = 13` | Default seasonality period (13 weeks) | NO | 1 | MEDIUM |
| ai/forecast/holt-winters.service.ts:40,165-167 | HW_NM_INIT [0.3,0.1,0.3]; fallback alpha0.3/beta0.1/gamma0.3 | HW smoothing init + fallback defaults | NO | 1 | MEDIUM |
| ai/forecast/forecast-weekly.job.ts:133,150 | `horizon=13`, `autoForecast(...,12)` | Forecast horizon + HW seasonLength hardcoded | NO | 1 | MEDIUM |
| ai/services/finance-ai-analysis.service.ts:74,89 | `Math.abs(variancePct) < 10` | Budget-variance "acceptable" tolerance 10% | NO (finance config) | 2 | MEDIUM |
| ai/services/ai-automation-daily.service.ts:37 | `overallRiskScore > 50` | Finance-anomaly alert trigger threshold | NO | 1 | MEDIUM |
| ai/services/ai-automation-daily.service.ts:14 | `SYSTEM_USER_ID = 1` | Re-declares SYSTEM_USER_ID locally (dup of app.constants) — silent-divergence risk | NO (dup) | 1 | MEDIUM |
| ai/services/ai-automation.service.ts:150 | `'80%','80%','70%','60%','75%','85%'` | automationCoverage fabricated per-module percentages returned as real | NO | 6 | MEDIUM |
| ai/services/wms-ai.service.ts:61 | `economicOrderQuantity: reorderPoint * 2` | Placeholder EOQ = reorder×2 (not real EOQ) | NO | 1 | MEDIUM |
| ai/services/wms-ai.service.ts:63 | `<3 'CRITICAL' : <7 'HIGH'` | Reorder-urgency day thresholds | NO | 1 | MEDIUM |
| ai/services/wms-ai.service.ts:179,208,217 | onTimeRate 80, confidence 70 | Fabricated fallback on-time-rate/confidence returned as real prediction | NO | 1 | MEDIUM |
| ai/application/services/ai-reservation.service.ts:85 | `Math.ceil(quantity * 1.1)` | Suggested reorder qty +10% safety buffer | NO | 1 | MEDIUM |
| ai/application/services/ai-reservation.service.ts:88-89,134 | deliveryDays 3, confidence 82, avgConfidence 82 | Fabricated confidence/delivery in optimize + dashboard | NO | 2 | MEDIUM |
| ai/application/services/ai-fit.service.ts:39 | `SUCCESSION_THRESHOLD = 85` | Fit-score cutoff flagging succession candidate | NO | 1 | MEDIUM |
| ai/services/ai-automation.repository.ts:33,40,67,96,124 | `'new'`,`'NEW'`,`'REJECTED'` | Lead status_description/funnelStage matched by string not FK/enum | NO (workflow status) | 5 | MEDIUM |
| ai-agents/common/ai-agents.constants.ts:7-8 | AI_VISION_PASS 2.0 / SCRAP 5.0 (ΔE) | QC pass/scrap colour-diff cutoffs | Partial (defect_catalog/qc_* exist, not these) | 2 (vision-qc 38-39) | MEDIUM |
| ai-agents/common/ai-agents.constants.ts:11-12 | OEE_CRITICAL 0.65 / WARNING 0.75 | OEE severity bands | NO | 2 (mes-monitor 106-107) | MEDIUM |
| ai-agents/common/ai-agents.constants.ts:14-16 | Z_THRESHOLD 3.0 / Z_AUTO_STOP 5.0 / window 20 | Anomaly z-score + auto-stop cutoffs | NO | 3 (mes-monitor 144,179-180) | MEDIUM |
| ai-agents/common/ai-agents.constants.ts:41-45 | MIN_DPI 300, BLEED 3mm, TAC 320/280, COMPLETENESS 0.9 | Prepress preflight thresholds | NO | 5 (prepress 66,73,80,161,191) | MEDIUM |
| ai-agents/common/ai-agents.constants.ts:52-53 | MOLD_LEAD 14d / MATERIAL_LEAD 7d | Production lead-time defaults | NO | 2 (planner 171,181) | MEDIUM |
| ai-agents/sales/sales-copilot.service.ts:34-36 | PEAK_MONTHS [10,11,12,1], LOW [6,7,8], MAX_CREDIT 0.95 | Season-month taxonomy + credit-util cap | NO | 1 | MEDIUM |
| ai-agents/sales/sales-copilot.service.ts:109 | `safeDiv(completedOrders, 3)` | "3 orders = established customer" normalizer | NO | 1 | MEDIUM |
| ai-agents/planning/planner.service.ts:192 | confidence 0.65 / 0.90 | Fabricated confidence by deadline-risk branch | NO | 1 | MEDIUM |
| ai-agents/logistics/router.service.ts:219 | confidence 0.88 / 0.5 | Hardcoded VRP confidence fallback | NO | 1 | MEDIUM |
| ai-agents/qc/vision-qc.service.ts:62,76 | deltaE default 3.5 (+synthetic 0.5/1.0) | ΔE fallback returned as real QC measurement | NO | 1 | MEDIUM |
| ai-agents/mes/mes-monitor.service.ts:165,234-235 | `absZ/5`, `confidence*5` | Magic z→confidence conversion factor 5 | NO | 3 | MEDIUM |
| ai-agents/prepress/prepress-assistant.service.ts:176 | confidence default 0.80 | Score-fallback returned as real confidence | NO | 1 | MEDIUM |
| ai-agents/common/ai-alerts.service.ts:215,226,237,249 | role strings hr_manager/production_manager/sales_manager/shift_supervisor/director | Alert-recipient roles matched by string | YES: roles | dup drizzle-ai-alerts.repo 46,60,74 | MEDIUM |
| ai-agents/common/ai-decision-log.service.ts:247,263 | payment_status IN('pending','unpaid'); po.status IN('pending','approved') | Hard-block status taxonomy as literals | Partial (status configs elsewhere) | 1 | MEDIUM |
| ai/infrastructure/repositories/drizzle-ai-provider-config.repo.ts:18,74 | DEFAULT_DAILY_BUDGET 50 USD | AI daily-spend budget fallback | YES: ai_provider_configs (empty→fallback) | 1 | MEDIUM |
| agents/cashflow-agent.service.ts:104 | `severity: 'warning'` | Fraud tx always 'warning' regardless of amount | NO | 1 | MEDIUM |
| agents/inventory-agent.service.ts:169 | `initialWeightKg < 50` | Roll is_critical weight threshold (kg) | NO | 2 (director 75) | MEDIUM |
| agents/inventory-agent.service.ts:204 | `newRemaining < 20` | Roll is_low weight threshold (kg) | NO | 1 | MEDIUM |
| agents/director-agent.service.ts:135 | `criticalStockCount > 5` | Critical-materials briefing-alert threshold | NO | 1 | MEDIUM |
| agents/director-agent.service.ts:180 | `COALESCE(health_score, 100)` | Module health defaults to 100 (fabricated-healthy fallback) | NO | 1 | MEDIUM |
| agents/facilities-agent.service.ts:56 | `INTERVAL '14 days'` | Preventive-maintenance lookahead window | NO (maintenance cfg) | 1 | MEDIUM |
| agents/facilities-agent.service.ts:44-46 | `'electricity'/'gas'/'water'` | Utility-type category strings not FK/lookup | NO (utility_types cfg) | 1 | MEDIUM |
| agents/hr-performance-agent.service.ts:58 | `score < 50` | Low-performance event emit cutoff | NO | 1 | MEDIUM |
| agents/hr-performance-agent.service.ts:103 | `INTERVAL '3 hours'` | Grace window before daily report marked late | NO | 1 | MEDIUM |
| agents/iot-agent.service.ts:113 | `lookaheadHours: 24*30` | RUL forecast horizon = 30 days | NO | 1 | MEDIUM |
| agents/lead-scoring-agent.service.ts:47 | `max(0, 15 - ageDays)` | Recency score max 15 pts | NO | 1 | MEDIUM |
| agents/lead-scoring-agent.service.ts:48 | `+ 30` base | +30 base added to every lead score | NO | 1 | MEDIUM |
| agents/lms-agent.service.ts:38 | `INTERVAL '30 days'` | Certificate-expiry warning window | NO | 1 | MEDIUM |
| agents/lms-agent.service.ts:49 | `daysLeft < 7 ? 'critical'` | Cert-expiry severity cutoff | NO | 1 | MEDIUM |
| agents/marketing-agent.service.ts:57 | `'VIP'/'regular'/'at_risk'` | Customer segment enum inline taxonomy | NO (segments cfg) | 1 | MEDIUM |
| agents/production-agent.service.ts:111,119 | `0.92` availability fallback | OEE availability fallback when downtime query empty | NO | 2 | MEDIUM |
| agents/production-agent.service.ts:75 | `INTERVAL '2 days'` | At-risk production window | NO | 1 | MEDIUM |
| agents/quality-agent.service.ts:29 | `confidence 0.92, hasDefect false` | AI-vision defect stub always returns no-defect (fabricated) | NO | 1 | MEDIUM |
| agents/quality-agent.service.ts:46 | `pct7 > pct30 ± 0.5` | Defect-trend rising/falling sensitivity 0.5% | NO | 1 | MEDIUM |
| agents/quality-agent.service.ts:57 | `INTERVAL '48 hours'` | Quarantine stuck-batch alert threshold | NO | 1 | MEDIUM |
| agents/quality-agent.service.ts:54 | `LIKE 'QUARANTINE_%'` | Warehouse identified by name-prefix not FK | YES: warehouse_types | 1 | MEDIUM |
| agents/security-agent.service.ts:27 | `INTERVAL '1 hour'` | Failed-login counting window | NO | 1 | MEDIUM |
| agents/security-agent.service.ts:53 | `ILIKE '%login%fail%'` | Audit-action matched by string pattern not code | NO | 1 | MEDIUM |
| agents/supplier-agent.service.ts:84,103 | `180 days` / `5 days` | Scoring lookback + delivery-risk window | NO | 1 | MEDIUM |
| agents/supplier-agent.service.ts:106 | `risk: 'medium'` | Every pending delivery hardcoded 'medium' risk | NO | 1 | MEDIUM |
| agents/shared/agent-alert.service.ts:22 | `'info'|'warning'|'critical'|'urgent'` | Alert-severity taxonomy inline union | NO (alert_severities cfg) | 1 | MEDIUM |
| agents/shared/agent-alert-notification.listener.ts:24,33 | `['super_admin','director']`, `['hr_manager','admin','director']` | Notify role lists inline arrays | YES: roles | 2 | MEDIUM |
| aisha/infrastructure/external/claude.adapter.ts:71,106,202 | `'claude-sonnet-4-6-20251022'` | Claude model id hardcoded (no aisha.config path) | NO (belongs in aisha.config) | 7 (3 adapter + 4 provenance labels) | MEDIUM |
| aisha/infrastructure/external/claude.adapter.ts:71,106,204 | max_tokens 1024 / 2048 | LLM output token cap (stream vs create) | NO (aisha.config) | 3 | MEDIUM |
| aisha/infrastructure/external/gemini.adapter.ts:51 | `'gemini-1.5-flash'` | Gemini fallback model id | NO (aisha.config) | 1 | MEDIUM |
| aisha/application/voice/whisper.service.ts:52,55 | `'whisper-1'`, confidence 0.9 | STT model id + hardcoded confidence returned as computed | NO | 1 | MEDIUM |
| aisha/application/voice/elevenlabs.service.ts:54 | `'eleven_multilingual_v2'` | TTS model id | NO (aisha.config) | 1 | MEDIUM |
| aisha/application/tools/detect-safety-violations.tool.ts:72,87 | maxTokens 512, confidence 0.78 | Vision token cap + fabricated safety-detection confidence | NO | 1 | MEDIUM |
| aisha/application/tools/detect-safety-violations.tool.ts:14 | missing_helmet/missing_vest/restricted_area/guard_removed | Safety-violation taxonomy enum | possible DB safety-codes config | 1 | MEDIUM |
| aisha/application/tools/detect-workers-in-area.tool.ts:59,68,73 | maxTokens 32, confidence 0.8 ×2 | Vision token cap + hardcoded worker-count confidence | NO | 2 | MEDIUM |
| aisha/application/tools/analyze-camera-feed.tool.ts:67,80 | maxTokens 512, confidence 0.85 | Vision token cap + hardcoded analysis confidence | NO | 1 | MEDIUM |
| aisha/application/tools/get-machine-state-via-vision.tool.ts:83,99 | maxTokens 16, confidence 0.5/0.85 | Vision token cap + vision-vs-sensor match confidence | NO | 1 | MEDIUM |
| aisha/application/tools/what-if-simulation.tool.ts:60 | elasticity `-0.4` | Price-elasticity assumption | NO | 1 | MEDIUM |
| aisha/application/tools/forecast-demand.tool.ts:81 | `len >= 14 ? 0.8 : 0.5` | Forecast confidence threshold + values | NO | 1 | MEDIUM |
| aisha/application/tools/compare-periods.tool.ts:90 | `Math.abs(change) > 10` | "Significant" change threshold % | NO | 1 | MEDIUM |
| aisha/application/tools/compare-periods.tool.ts:29-33 | ALLOWED map revenue/production/defects→table/column | Inline metric→table taxonomy | possible config | 1 | MEDIUM |
| aisha/application/tools/get-financial-summary.tool.ts:43,46,49 | status='open' / IN('paid','delivered') | AP/AR/revenue status filters | possible status config | 3 | MEDIUM |
| aisha/application/tools/get-quality-metrics.tool.ts:39,46,49 | result='reject', status NOT IN('resolved','rejected') | QC pass/fail + reclamation status matches | possible status config | 3 | MEDIUM |
| aisha/application/tools/get-customer-info.tool.ts:65 | `cnt>10 'A' : cnt>3 'B' : 'C'` | RFM tier thresholds | NO | 1 | MEDIUM |
| aisha/application/conversation/aisha-conversation.service.ts:21 | `MAX_TOOL_ITERATIONS = 8` | Tool-loop cap | NO | 1 | MEDIUM |
| aisha/application/tools/schedule-meeting.tool.ts:65 / create-reminder.tool.ts:57 | `created_by 0` | System-user id on INSERT (should be actor userId) | NO | 2 | MEDIUM |
| ai/forecast/forecast-weekly.job.ts:128,149,163 | `<4`, `>=24`, `>=6` | Min-observation gates per method (EMA/HW/OLS) | NO | 1 | LOW |
| ai/services/ai-automation-daily.service.ts:60 | `model: 'gemini-1.5-flash'` | Hardcoded model string in usage log (dup of PROVIDER_MODELS) | NO (dup) | 1 | LOW |
| ai/services/finance-ai.repository.ts:29 | `reference_type = 'payment'` | GL doc-type string match in SQL CASE | NO | 1 | LOW |
| ai/services/crm-ai.service.ts:36,43,81,88,124,131 | score/probability/riskScore 50, 'WARM', 'MEDIUM' | Additional occurrences of AI score:50 neutral fallback | NO | 6 | LOW |
| ai/services/hr-ai.service.ts:116 | `score: 50` | Additional occurrence of AI score:50 neutral fallback | NO | 1 | LOW |
| ai/services/marketing-ai.service.ts:149,158 | `score: 50` (sentiment NEUTRAL) | Additional occurrence of AI score:50 neutral fallback | NO | 2 | LOW |
| ai/services/hr-ai-ext.service.ts:149,162 | `'KPI bajarilishi 70%+'` | Hardcoded onboarding success-metric string in fallback | NO | 2 | LOW |
| ai/forecast/nelder-mead.service.ts:9-15 | RHO/CHI/GAMMA/SIGMA/MAX_ITER/CONVERGENCE_TOL/INIT_OFFSET | Nelder-Mead simplex coefficients (mostly math; MAX_ITER/tol tunable) | NO | 1 | LOW |
| ai-agents/qc/vision-qc.service.ts:109 | `costUsd = latencyMs * 0.000001` | Hardcoded AI cost-per-ms rate | NO | mirrors mes-monitor | LOW |
| ai-agents/prepress/prepress-assistant.service.ts:16-20 | REQUIRED_FIELDS[] (10 tech-card fields) | Tech-card completeness taxonomy | NO | 1 | LOW |
| ai-agents/prepress/prepress-assistant.service.ts:69,80 | 'CMYK' / 'FLEXO' | Colorspace + print-tech business matches | NO | 1 | LOW |
| ai-agents/common/ai-decision-log.service.ts:211-215 | GUARD_AGENT map (guard_type→agent) | Guard→agent routing taxonomy | NO | 1 | LOW |
| ai/presentation/ai-finance.controller.ts:51-55,75,84 | SEVERITY_TO_PRIORITY map; default 30 days | Severity→priority taxonomy + anomaly lookback default | NO | 2 | LOW |
| ai/infrastructure/ai-fit-visibility.helper.ts:33 | AI_FIT_FULL_VISIBILITY_ROLES {super_admin,director} | Full-visibility role taxonomy | YES: roles | 1 | LOW |
| ai/infrastructure/repositories/drizzle-ai-exam.repo.ts:30-32 | fullName '', positionName '' | Empty placeholders returned as employee data (join not done) | NO | 1 | LOW |
| ai/infrastructure/repositories/drizzle-insights.repo.ts:48 | priority 'medium', insightType 'ai_generated' | Hardcoded default insight priority/type | NO | 1 | LOW |
| ai/presentation/ai-agents.controller.ts:212-219 | AGENT_META map (6 agents) | Agent-registry taxonomy inline | NO | 1 | LOW |
| agents/iot-agent.service.ts:31 | `RUL_READING_WINDOW = 50` | Min sensor-reading window for RUL trend | NO | 1 | LOW |
| agents/lead-scoring-agent.service.ts:92 | `: 999` | Default days-since when no deal | NO | 1 | LOW |
| agents/cashflow-agent.service.ts:118 | `targetRole: 'cfo'` | Alert routing role literal | YES: roles | many | LOW |
| agents/agents.controller.ts:168 | `'MACHINE_001'` | Default machineId fallback string | NO | 1 | LOW |
| agents/shared/agent-alert-notification.listener.ts:26,35 | `'urgent'`, `'high'` | Notification priority literals inline | NO (notif priorities) | 1 | LOW |
| aisha/application/voice/whisper.service.ts:54 | default lang `'uz'` | Default language when API omits it | NO | 1 | LOW |
| aisha/application/voice/elevenlabs.service.ts:55 | `'mp3_44100_128'` | TTS output format (audio technical) | NO | 1 | LOW |
| aisha/application/tools/get-machine-state-via-vision.tool.ts:87-89 | 'running'/'stopped'/'error' | Machine visual-state parse strings | possible enum config | 1 | LOW |
| aisha/application/tools/what-if-simulation.tool.ts:74 | `confidence: 0.6` | Hardcoded simulation confidence | NO | 1 | LOW |
| aisha/application/tools/forecast-demand.tool.ts:61,65 | `slice(-7)`, `60 days` | Moving-average window & lookback | NO | 1 | LOW |
| aisha/application/tools/compare-periods.tool.ts:83 | change fallback `100` | %-change when baseline zero | NO | 1 | LOW |
| aisha/application/tools/generate-kpi-report.tool.ts:61,62,89-98 | status='present'/'reject'; INTERVAL 7/30 days | Attendance/defect status matches + period defs | possible status config | 6 | LOW |
| aisha/application/tools/get-customer-info.tool.ts:61 | `stage = 'won'` | CRM deal-stage string match | possible stage config | 1 | LOW |
| aisha/application/tools/get-today-briefing.tool.ts:60 | `.slice(0,3)` + 'open'/'present' | Top-N briefing count + status matches | NO | 1 | LOW |
| aisha/application/tools/assign-task.tool.ts:61 | status `'todo'` | Default kanban column | possible config | 1 | LOW |
| aisha/presentation/controllers/chat.controller.ts:58 | SYSTEM_PROMPT inline string | AIsha persona/system prompt hardcoded in controller | NO (should be config) | 1 | LOW |
| aisha/application/llm/_helpers.ts:38 | default `confidence ?? 1` | Fallback provenance confidence when tool omits it | NO | 1 | LOW |

### Notes
- Already-externalized (NOT re-reported): ai-router/central-ai/insights/ai-exam pull budgets/tokens/models from app.constants + ai.types; agents/* import LARGE_TX_THRESHOLD_UZS, CHURN_HIGH/MED_DAYS, ABC_A/B_THRESHOLD, VIP_*, FORECAST 0.7/1.3 from business.constants.
- Biggest single cluster: `ai-agents/common/ai-agents.constants.ts` centralizes ~25 business thresholds as named consts, but the pricing/discount/HITL-approval/risk-weight values there have NO backing config table (unlike QC/MES ones that partly overlap defect_catalog/qc_*/mes_downtime_reasons).
- Most concerning fabrication sites (invented numbers returned as if computed): drizzle-ai-planning.repo 105/108, ai-planning.service 40-68, production-agent OEE 114-120, quality-agent 29, wms-ai 179-217, ai-finance.controller ?? 75.
- Hardcoded Claude model id `claude-sonnet-4-6-20251022` recurs across 7 aisha sites with no aisha.config path.
- Role/severity string matching for alerts recurs across nearly every agent service; the `roles` config table exists, so those are systematically config-eligible.


---

## IoT / Camera / Design

Coverage log (HONEST — "opened" = read in full; rest grep-scanned):
- iot | 65 | 20 | 14  (opened: oee-calculator, camera-ai.service, predictive-maintenance, sensor-reading.aggregate, sensor-device.aggregate, record-sensor-reading.handler, iot-sensors-extended.service, camera-extended.service, camera-dashboard.service, iot-main.service, sensors.service, warehouse-exit-guard.service, iot-camera-events.service, anomaly-detected.handler, iot-tablet.service, drizzle-iot-oee.repo, drizzle-iot-sensors.repo, drizzle-camera-ai.repo, drizzle-camera-dashboard.repo; grep-scanned: drizzle-camera.repo, drizzle-iot-main.repo, drizzle-warehouse-exit-guard.repo, drizzle-iot-tablet.repo, DTOs, controllers, gateways)
- camera | 1 | 1 | 0  (camera.service.ts = empty class, no logic)
- design | 26 | 6 | 2  (opened: design-extended.service, design-extended.repository, design-status.enum, design-order.aggregate, orders.service, update-design-status.handler; grep-scanned: drizzle-design.repo, library.service/repository, request/so-design handlers)

Findings table:

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
apps/api/src/modules/iot/application/commands/record-sensor-reading.handler.ts:67 | `const threshold = 90; value > threshold` | Anomaly detection threshold applied to EVERY sensor regardless of type/unit; ignores the per-sensor `min_threshold`/`max_threshold` columns that already exist in `iot_sensors` and are used elsewhere (sensors.service, drizzle-iot-sensors alert_level). | NO (should read iot_sensors.max_threshold per device) | 1 | HIGH
apps/api/src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler.ts:66 | severity `'high'` literal in INSERT | ALL IoT anomaly alerts persisted as 'high' severity — no gradation by how far past threshold. Pairs with the flat 90 threshold above. | NO | 1 | MEDIUM
apps/api/src/modules/iot/application/commands/record-sensor-reading.handler.ts:51,57 | anomalyType `'high_value'` literal | Hardcoded anomaly-type label for the only detection path (no low/rate/drift types). | NO | 1 | LOW
apps/api/src/modules/iot/oee/oee-calculator.service.ts:128-129 | `oee >= 85` (isWorldClass), `oee < 60` (isCritical) | OEE benchmark bands. NOTE code says critical `< 60` but the file's own docstring (lines 21,56,63) says critical `< 0.40` — doc/code mismatch. Nakajima 85/60/40 tiers hardcoded, not tunable. | NO | 1 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts:23-24 | `r.value::float > 80` (availability_pct, oee) | Raw-SQL OEE "availability": a reading counts as "machine running" only if value>80. Magic efficiency cutoff buried in SQL. | NO | 2 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-sensors.repo.ts:79-80 | `r.value::float > 80` (high_readings, oee_percentage) | Additional occurrence of the OEE >80 availability cutoff cluster (findOee). | NO | 2 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts:23,33 (+drizzle-iot-sensors.repo.ts:23) | `s.type IN ('machine','production','equipment')` | Sensor-type category strings define which sensors are "machines" for OEE/dashboard — string business-taxonomy match, no lookup. | NO (no sensor_types config table) | 3 | MEDIUM
apps/api/src/modules/iot/application/camera-extended.service.ts:98-110 | `penaltyAmount: 50000` | Auto-penalty (jarima) amount in UZS returned as default global camera setting when no row saved; financial value hardcoded (autoPenalty:true by default). | Partial (`settings` KV row overrides, but default hardcoded) | 1 | HIGH
apps/api/src/modules/iot/application/camera-extended.service.ts:98-107 | safetyThreshold:80, qualityThreshold:75, productivityThreshold:70, alertCooldown:5, dailyReportTime:'18:00' | Camera AI alert thresholds + cooldown + report time defaults, hardcoded fallback (mirror of FE initial state). | Partial (`settings` KV) | 1 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts:240 | `config?.alert_threshold ?? 0.8` | AI detection confidence threshold default 0.8 when camera_ai_configs row lacks it — returned as if configured. | Partial (camera_ai_configs.alert_threshold) | 1 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts:142 | `ROUND(100.0 - (violations/events*100),1)` | Camera productivity_score KPI formula inline in SQL (100 base, violation-ratio penalty). | NO | 1 | MEDIUM
apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-dashboard.repo.ts:76 | `100.0 - LEAST(COUNT(violations)*5, 100)` | Employee safety score: `5` = penalty points per safety violation, hardcoded weight; drives findTopEmployees ranking (employee-facing rating). | NO | 1 | MEDIUM
apps/api/src/modules/iot/application/camera-ai.service.ts:16-27 | `DEFAULT_MISSION_HINTS` (10 mission ids: perimeter_line, safety_ppe, face_attendance, behavior_anomaly, quality_visual, ...) | Inline camera-AI mission taxonomy; comment says "mirrored from FE camera-ai-modern/taskCatalog.ts" = duplicated in 2 places, no DB config table. | NO | 2 (FE+BE) | MEDIUM
apps/api/src/modules/iot/application/camera-ai.service.ts:32,232 | `['low','medium','high','critical']` | Camera-vision finding severity enum inline (validated against literal array). | NO | 1 | LOW
apps/api/src/modules/design/infrastructure/repositories/design-extended.repository.ts:113-116 | `approved?100 : ai_generated?70 : 40`, `passed = score>=70` | verifyDesign returns a FABRICATED quality score by order status (self-labelled PLACEHOLDER — no real quality_score column). overallScore/passed feed the design approval gate as if computed. Same anti-pattern as documented AI `score:50`. | NO (designs.quality_score deferred) | 1 | HIGH
apps/api/src/modules/design/orders/orders.service.ts:10-21 | `DB_TO_API` / `API_TO_DB` status maps (new→pending, designer_review→in_progress, archived→rejected...) | Inline status taxonomy translation duplicating DesignStatus enum; introduces 'archived' not present in the enum (drift). | NO (DesignStatus enum exists but not reused) | 1 | LOW
apps/api/src/modules/iot/application/iot-tablet.service.ts:54 | `CARD_EXEMPT_ROLES = ['super_admin','admin','director']` | Additional occurrence of the documented role-array case-drift cluster; comment admits it "MUST stay in sync with" login.service + card-gate-precheck (3-way duplication). | NO (roles enum on users) | 3+ | LOW
apps/api/src/modules/iot/oee/predictive-maintenance.service.ts:105 | `lookaheadHours ... .default(168)` | PdM failure-probability lookahead window = 168h (7 days) hardcoded schema default. (Risk weights 0.5/0.3/0.2 + health bands 40/70 are already named PDM_* constants — good, not flagged.) | NO | 1 | LOW
apps/api/src/modules/iot/application/warehouse-exit-guard.service.ts:144 | `IncidentSeverity.HIGH` | All warehouse-exit anomalies raised as HIGH severity regardless of mismatch type (face-fail vs document-mismatch). | NO | 1 | LOW

Notes:
- Good practice observed (NOT flagged): predictive-maintenance.service (all thresholds/weights are exported PDM_* named constants), warehouse-exit-guard.service (uses WAREHOUSE_EXIT_FACE_MATCH_THRESHOLD from business.constants), camera-ai.service (CAMERA_VISION_* from business.constants), sensors.service/drizzle-iot-sensors alert_level (uses per-sensor min/max_threshold columns), update-design-status.handler (uses centralized DESIGN_TRANSITIONS status-machine).
- camera/camera.service.ts is an empty `@Injectable() class CameraService {}` — dead/placeholder, no logic.


---

## Org-Structure / Auth / Security / Admin

Coverage log (total_files = *.ts count in folder; files_opened = fully Read; rest scanned via grep):
- org-structure | 44 | 15 | 6
- auth | 44 | 10 | 3
- security | 26 | 5 | 2
- admin | 28 | 9 | 4

Honesty note: I fully Read every substantive service/repository/aggregate/constants/domain-entity in scope. Controllers, DTOs, events, decorators, guards-re-export shims, module wiring and `types/` barrels were scanned via targeted grep (numeric/role/status-literal patterns), not opened line-by-line. Grep on my scope was reliable after switching to explicit char-class patterns. Config-table availability judged against the instruction's "config tables that EXIST" list.

### Findings table

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
apps/api/src/modules/auth/infrastructure/repositories/drizzle-auth.repo.ts:202 | `failed_login_attempts + 1 >= 5` (SQL CASE that sets locked_until) | Account-lockout threshold — # failed logins before lock. Authoritative (DB write). | NO (no security-policy table) | 2 (also login.service.ts:187 log-only + repo header comment :9) | HIGH
apps/api/src/modules/auth/application/services/login.service.ts:187 | `getFailedLoginAttempts() >= 5` | Same lockout threshold, log-only branch — must stay in sync with the repo SQL; two independent literals = drift risk | NO | 2 | HIGH
apps/api/src/modules/admin/application/services/admin-extra.service.ts:36-47 | `getRoles()` returns 8 inline `{role,label,permissions[]}` objects (super_admin `['*']`, hr_manager `['read:hr','write:hr']`, …) | Hardcoded RBAC role+permission catalog served to admin UI as the authoritative role list; permission strings are an inline taxonomy with no backing table | YES: roles (enum on users) — permissions ungoverned | 1 | HIGH
apps/api/src/modules/org-structure/razryad.repository.ts:85 | `${dto.coefficient ?? 1.0}` on INSERT | Default razryad salary coefficient (payroll = base × coefficient). Silently writes 1.0 when owner omits it — masks missing owner-data as a real value (vision says coefficient is owner-set) | YES: razryad_levels (this table) — but default is code-side, not column DEFAULT | 1 | HIGH
apps/api/src/modules/auth/enums/role.enum.ts:6-23 | `Role` enum — 16 UPPERCASE roles (SUPER_ADMIN, SALES_MANAGER, PROD_HEAD…) | Role taxonomy #1. Case + membership diverges from DB `roles` (lowercase) and from admin UserRole (5). Not sourced from roles table | YES: roles | 3 (role-array case-drift cluster — new files) | MEDIUM
apps/api/src/modules/admin/domain/aggregates/user.aggregate.ts:11-17 | `UserRole` enum — 5 lowercase roles (super_admin, director, department_head, accountant, employee) | Role taxonomy #2. `promoteTo`/`changeRole` validate against ONLY these 5 → cannot assign hr_manager/sales_manager/etc. that exist in seeded roles. Divergent catalog | YES: roles | 3 (cluster) | MEDIUM
apps/api/src/modules/org-structure/cascade/org-cascade.constants.ts:22-51 | `WAREHOUSE_BEARING_NODE_TYPES ['sex','warehouse','department_warehouse']`, `CASCADE_WAREHOUSE_TYPE='department_warehouse'`, `WAREHOUSE_HEAD_ROLE='wms_operator'` | Org-cascade taxonomy: which node types auto-provision a warehouse + the warehouse type + head role. Warehouse type is a string literal, not an FK to warehouse_types | YES: warehouse_types; roles | 1 | MEDIUM
apps/api/src/modules/org-structure/cascade/org-cascade.constants.ts:41-45 | `PROTECTED_ROLES ['super_admin','admin','director']` | Roles never downgraded by cascade RBAC grant — hardcoded privileged-role catalog | YES: roles | 4 (exempt/privileged-role cluster) | MEDIUM
apps/api/src/modules/auth/application/services/login.service.ts:142 | `r === 'super_admin' || r === 'admin' || r === 'director'` (isCardExemptRole) | Card-login-gate exempt roles — hardcoded privileged catalog; drives who bypasses the gate | NO (owner rule) | 4 (cluster) | MEDIUM
apps/api/src/modules/auth/application/services/card-gate-precheck.service.ts:37,98,101,106,133 | `CARD_EXEMPT_ROLES` const + literal `lower(role) IN ('super_admin','admin','director')` repeated 4× in SQL | Same exempt-role list re-hardcoded inline in two CTE queries instead of referencing the constant — drift risk vs login.service | NO | 4 (cluster) | MEDIUM
apps/api/src/modules/admin/position-permissions/position-permissions.service.ts:111 | `const levels = ['NONE','READ','READ_PLUS','WRITE','FULL']` | RBAC access-level ladder (ordinal comparison for hasAccess). Inline ordered taxonomy; no lookup table | NO | 1 | MEDIUM
apps/api/src/modules/org-structure/card.service.ts:100-101 | `0.5*assignment + 0.5*definition`; `fit >= 80 ? "a'lo" : >=60 : >=40 …` | Card↔employee fit scorer: 50/50 weights + label bands 80/60/40 hardcoded (deterministic v1) | NO | 1 (weights ~KPI-weight cluster; bands new) | MEDIUM
apps/api/src/modules/security/infrastructure/guards/ip-blocker.guard.ts:32 | `durationMinutes = 60` default | Default IP-block duration when a caller omits it | NO | 1 | MEDIUM
apps/api/src/modules/org-structure/card.repository.ts:402-403 | `<= 14 THEN '0-14' … <= 45 THEN '15-45'` | Card-age bucket boundaries (14/45 days) hardcoded in SQL | NO | 1 (aging-bucket cluster — new file) | LOW
apps/api/src/modules/auth/domain/value-objects/password.vo.ts:60-73 | length `< 8` + upper/lower/digit/special required | Password complexity policy hardcoded; not org-configurable | NO | 1 | LOW
apps/api/src/modules/org-structure/ckp.controller.ts:25 | `z.enum(['MANUAL','AI_CHAT','MES_AUTO','IOT'])` | ЦКП fact-source taxonomy inline in Zod (also card.controller.ts:38 & org-structure.controller.ts:66 `['SON','FOIZ','VAQT']` measurement units) | NO | 2 | LOW
apps/api/src/modules/security/domain/enums/incident-severity.enum.ts:6-26 | IncidentSeverity(low/med/high/critical) + IncidentType(6 values) | Security-incident taxonomy as code enums; no config table for incident types/severities | NO | 1 | LOW
apps/api/src/modules/org-structure/node-portret.repository.ts:118-119 | `requestType ?? 'new_hire'`, `priority ?? 'normal'` | Default HR-request type/priority status literals | NO | 1 | LOW
apps/api/src/modules/security/attendance/attendance.service.ts:38,41 | `eventType ?? 'entry'`, `method ?? 'manual'` | Default attendance event-type/method status literals | NO | 1 | LOW

Notes on excluded/clean items:
- ckp-fact.service.ts formula math (`Math.min(a,100)` clamp, `t<=0 → 0`, round-2), razryad-history.service `30.44` days/month, otp/jwt TTLs (config-driven via ConfigService), MS_PER_* usages — all legitimately excluded (domain math / config-driven / calendar constants).
- system-settings.entity `0..100` advance-percent clamp = validation guard, not a magic business threshold.
- The role case-drift cluster is pre-documented; only NEW file:line catalogs (role.enum.ts, user.aggregate.ts, org-cascade PROTECTED_ROLES, card-gate-precheck) are reported as additional occurrences.


---

## Compatibility / Integration

Coverage log (honest — "opened" = read file body; rest scanned via ripgrep patterns across the whole folder):
- compatibility | 85 | 11 opened + full grep sweep | 16 new
- integration | 19 | 4 opened + full grep sweep | 6 new (incl 3 role-array dup occurrences)

Opened: cfo-risk.service, barcode-warehouse.service, europrint-control.service, crm-extended.service, candidates-compat.service, asset-management.repo, pos-warehouse-integration-movement.service, employees-org-assignment.helper, cfo.service(grep), integration-extended-hr.repo, sap.service, sap.repository, integration-mro.repo(grep). Everything else grepped, not fully read.

Notes on already-documented clusters found again (NEW file:line only): HR_ROLES/MRO_ROLES arrays = role-array case-drift cluster; OUTBOUND/INBOUND movement enums = POS movement enums cluster; stage NOT IN ('WON','LOST') = CRM win/loss markers cluster. cfo.service.ts:64 VAT_RATE reads from CFO_VAT_RATE config with '0.12' fallback = ACCEPTABLE (config-driven) — not flagged.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| compatibility/cfo-risk.service.ts:73-76 | days<7 / <14 / <30 | Cash-runway → risk level (critical/high/medium) | NO | 1 | HIGH |
| compatibility/cfo-risk.service.ts:237-240 | score>=75 / >=50 / >=25 | Overall financial risk score→level bands | NO | 1 | HIGH |
| compatibility/cfo-risk.service.ts:214,221,228 | [10,25,40] / [0,10,20] / [1,15,30] | AR-collection / margin / AP-overdue risk band cutoffs | NO | 3 | HIGH |
| compatibility/cfo-risk.service.ts:208,215,222,229 | *25, /4, max(0,25-margin) | Per-category risk score weight (cap 25 each, 4 cats=100) | NO | 4 | MEDIUM |
| compatibility/cfo-risk.service.ts:138 | totalAP / 30 | Daily cash burn = 30-day AP window | NO | 1 | MEDIUM |
| compatibility/cfo-risk.service.ts:193-194 | margin[0] vs margin[1] ±2 | Margin trend improving/declining threshold (2 pct-pt) | NO | 1 | MEDIUM |
| compatibility/cfo-risk.service.ts:210,217,231 | <14 / >25 / >0 in recommendation text | Advice-trigger thresholds mirroring above | NO | 3 | LOW |
| compatibility/barcode-warehouse.service.ts:32-33 | variance<=2 AUTO_ADJUST, <=5 SUPERVISOR_APPROVAL, else RECOUNT | Cycle-count adjustment auto-approve vs escalate thresholds | NO | 1 | HIGH |
| compatibility/europrint-control.service.ts:45-51 | 'gte:70' advance_percent (+FEFO/3-way rules) | Hardcoded validation-rules catalog incl. 70% min advance | NO (business_rules exists) | 1 | HIGH |
| compatibility/europrint-control.service.ts:22-29 | SD-001/MES-001/WMS-001/FIN-001/HR-001 + HARD_BLOCK/WARNING | Hardcoded business-rules catalog returned as data | NO (business_rules table exists, read at :87) | 1 | MEDIUM |
| compatibility/europrint-control.service.ts:32-42 | dona/kg/m/m2/m3/l/uzs/usd + category | Hardcoded unit-of-measure catalog returned as data | YES: unit_of_measures | 1 | MEDIUM |
| compatibility/europrint-control.service.ts:65-66 | target:100 / target:50 | KPI targets (active users, open orders) hardcoded | NO | 2 | LOW |
| compatibility/crm-extended.service.ts:113-116,122-124 | >500000000 / 50M–500M / <50000000 UZS | Customer/lead segment tiers (Premium/Mid/Small) | NO | 2 | MEDIUM |
| compatibility/crm-extended.service.ts:168 | churnRisk:'low', score:0 | Fabricated fixed churn result (stub returned as data) | NO | 1 | MEDIUM |
| compatibility/crm-extended.service.ts:134 | stage_id NOT IN ('WON','LOST') | CRM win/loss stage markers | NO | 1 (addl occ of CRM win/loss cluster) | LOW |
| compatibility/candidates-compat.service.ts:86 | ['HH_UZ','OLX_UZ','TELEGRAM',...'OTHER'] | Candidate source-channel enum (validation) | NO | 1 | MEDIUM |
| compatibility/employees-org-assignment.helper.ts:121-127 | positionId<=2→super_admin, <=5→director, <=20→manager | Auto role assignment by positionId numeric ranges | NO (roles enum on users) | 1 | HIGH |
| compatibility/pos-warehouse-integration-movement.service.ts:19,32-33 | EXTERNAL_IN/OUT/INTERNAL_* union + OUTBOUND/INBOUND arrays | POS movement type taxonomy inline | YES: pos_movement_types | 2 (addl occ of POS-movement cluster) | MEDIUM |
| compatibility/pos-warehouse-integration.controller.ts:87 | validTypes[6] EXTERNAL_IN..DAMAGE | POS movement type whitelist inline | YES: pos_movement_types | 1 (addl occ) | LOW |
| compatibility/{hr-map,goals,employees-compat,employees-compat-sub,employee-kpi,candidates,discipline-records,mentorships,succession,employee-files}-compat.controller.ts | HR_ROLES = ['HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER'] | Inline role catalog (auth gate) | NO (roles enum) | ~10 files (addl occ of role-array cluster) | LOW |
| integration/integration-extended-hr.repo.ts:60 | overall_score>=4 high_performer, <2.5 needs_improvement | HR performance-rating tier cutoffs | NO | 1 | HIGH |
| integration/integration-extended-hr.repo.ts:81 | quality*0.4 + delivery*0.3 + price*0.2 | Vendor overall-rating weights (procurement scoring) | NO | 1 | HIGH |
| integration/integration-extended-hr.repo.ts:98-100 | quality*0.4 + delivery*0.3 + price*0.2 | Vendor overall-rating weights (2nd occurrence, spend analysis) | NO | 1 | HIGH |
| integration/integration-extended-hr.repo.ts:75 | delivery_score / 100.0 | On-time deliveries = delivery_score% of PO count (derived proxy) | NO | 1 | MEDIUM |
| integration/integration-mro.controller.ts:29 | MRO_ROLES = ['admin','super_admin','manager','director','warehouse','warehouse_manager'] | Inline role catalog | NO (roles enum) | 1 (addl occ role-array) | LOW |
| integration/integration-mro.repo.ts:49 | priority ?? 'normal' | Default MRO request priority string | NO | 1 | LOW |


---

## LMS / Notifications / Comm-Center / Chat / Bot-Gateway

Coverage log (HONEST — services/handlers/repos/crons read in full; DTOs/controllers/infra mostly grep-scanned):
```
lms                  | 61 | 12 opened, rest grep-scanned | 5
notifications        | 45 |  9 opened, rest grep-scanned | 4
communication-center | 37 |  8 opened, rest grep-scanned | 6
chat                 | 34 |  2 opened, rest grep-scanned | 0
bot-gateway          | 13 |  2 opened, rest grep-scanned | 2
```

Key patterns targeted: LMS pass-score thresholds, cert validity, notification SLA/escalation constants, hardcoded approver position codes, comms routing string-matches. Chat came back essentially clean (only validation ranges / UI defaults like task `priority DEFAULT 'medium'`, poll options 2–10, file-size caps — all excluded per rules).

### Findings table

| File:line | Value/constant | Business meaning | Config table? | Dup | Severity |
|---|---|---|---|---|---|
| communication-center/cron/cc-sla.cron.ts:125 | `INTERVAL '48 hours'` | Force auto-REJECT any inbox doc unresolved >48h (system rejects the document). Note: the 24h *overdue-flag* correctly reads `t.inbox_sla_hours` from template config — but this hard 48h auto-reject deadline is NOT config-driven | NO (templates carry `inbox_sla_hours` only; no `auto_reject_hours`) | 1 | HIGH |
| communication-center/application/cc-workflow.service.ts:193 | `code !== 'ADVANCE' && code !== 'FINANCIAL_AID'` | Which template codes are "financial" → fire cashier-bridge `CcDocumentFullyApprovedEvent`. Financial routing decided by hardcoded string set, not a template flag | NO (no `cc_document_templates.is_financial` column) | 1 | HIGH |
| communication-center/application/cc-org-resolver.service.ts:80-81 | `IN ('CEO','ORG-64')` + `LIKE '%bosh direktor%'` | Director (final approver of EVERY chain) resolved by hardcoded position codes + name substring match | Partial (positions table exists; codes/name hardcoded) | 1 | HIGH |
| communication-center/application/cc-org-resolver.service.ts:96 | `u.role = 'director'` | Fallback director lookup by hardcoded role string | roles(enum) | 1 | MEDIUM |
| lms/infrastructure/repositories/drizzle-lms.repo.ts:336 | `passing_score ?? 70` | Course-completion pass gate threshold fallback (drives cert issuance). Literal `70` instead of `LMS_GENERAL_PASS_THRESHOLD_PCT` which exists in same module | YES (courses.passing_score) but magic-literal fallback | see cluster | HIGH |
| lms/infrastructure/repositories/drizzle-lms.repo.ts:26,243,300 | `?? 70` | Same default-pass-score literal, 3 more occurrences | YES | cluster ×8 | MEDIUM |
| lms/infrastructure/repositories/drizzle-lms-exams.repo.ts:43,101,173 | `passing_score ?? 70` (43 = INSERT default) | Exam pass threshold fallback literal (scoreVal>=passingScore ⇒ passed) | YES (lms_exams.passing_score) | cluster ×8 | HIGH |
| lms/presentation/lms-courses.controller.ts:112 | `body.passingScore ?? 70` | Default pass score on course create | YES | cluster ×8 | MEDIUM |
| communication-center/application/cc-stats.service.ts:23,54 | `{responseTimeTarget:4, overdue24hTarget:0, delayedTarget:10}` | CC KPI goal targets (4h resp, 0% overdue, 10% delayed) hardcoded in code | NO | 1 | MEDIUM |
| communication-center/application/cc-stats.service.ts:76 | `EXTRACT(EPOCH ...) > 4 * 3600` | "Delayed document" defined as >4 hours old — SLA threshold hardcoded in SQL | NO | 1 | MEDIUM |
| notifications/.../deal-won-notification.listener.ts:32 | `role = 'director'` (LIMIT 50) | Deal-won notification fan-out target role. Bypasses `notification_routing_rules` (which qc/mro listeners DO use) | YES (notification_routing_rules) — but this listener ignores it | cluster ×3 | MEDIUM |
| notifications/.../order-created-notification.listener.ts:34 | `role = 'warehouse_manager'` (LIMIT 50) | Order-created fan-out target role, hardcoded, bypasses routing table | YES (ignored) | cluster ×3 | MEDIUM |
| notifications/.../lms-cert-expired-notification.listener.ts:58 | `role = 'hr_manager'` (LIMIT 50) | Cert-expired HR fan-out target role, hardcoded, bypasses routing table | YES (ignored) | cluster ×3 | MEDIUM |
| lms/application/services/lms-completion.service.ts:265 | union `'safety_tx'|'regulation'|'general'|'razryad_exam'|'onboarding'|'replication'` | Course-type taxonomy inline; only `safety_tx`→100%, all else→general threshold | courses.category exists | 1 | MEDIUM |
| bot-gateway/bots/director.bot.ts:50 | `pct >= 100 ? ✅ : pct >= 80 ? ⚠️ : ❌` | KPI achievement status thresholds (80%/100% targets) hardcoded for Telegram display | NO | 1 | LOW |
| communication-center/application/cc-stats.service.ts:33 | `['admin','super_admin','director','ceo']` | Privileged-role gate for dept-wide stats — additional occurrence of documented role-array cluster | roles(enum) | dup of role-array cluster | LOW |
| notifications/.../qc-failed-notification.listener.ts:28 | `QC_FAILED_FALLBACK_ROLE = 'production_manager'` | Hardcoded fallback role (Q-39 documented, config table used first) | YES (routing, used first) | 1 | LOW |
| notifications/.../mro-machine-stopped-notification.listener.ts:19 | `MRO_STOPPED_FALLBACK_ROLE = 'director'` | Hardcoded fallback role (Q-39 documented) | YES (used first) | 1 | LOW |
| lms/infrastructure/repositories/drizzle-lms-courses-extended.repo.ts:92-93 | `days = 30` / clamp `Math.min(365,...)` | Default expiring-cert lookahead window 30 days | NO | 1 | LOW |
| lms/infrastructure/repositories/drizzle-lms-exams.repo.ts:43 | `durationMinutes ?? 60` | Default exam duration 60 min (business value, not a network timeout) | NO | 1 | LOW |
| bot-gateway/bots/bot.helpers.ts:205,256 | `INTERVAL '30 days'` / `INTERVAL '7 days'` | Cashflow (30d) & financial-summary (7d) report windows hardcoded in Telegram bot | NO | 2 | LOW |

### Notes / config-driven (NOT flagged — verified genuinely config-backed)
- `notification-schedule.cron.ts` — fully driven by `notification_schedules` (interval_hours, target_role, priority all from DB). Clean.
- `notification-routing.repository.ts` — driven by `notification_routing_rules`; the hardcoded strings live in the *caller* listeners (rows above), not the repo.
- `cc-sla.cron.ts` inbox-overdue (24h flag) + escalation `deadline_at` + delegation `ends_at` — all read config/DB columns. Only the 48h force-reject (row 1) is hardcoded.
- `certificate.aggregate.ts` / `certification.service.ts` / `issue-certificate.handler.ts` — validity comes from `validityMonths` command param + `expiresAt` DB column; no hardcoded validity-days. Clean.
- `cc-completion` per-course `pass_threshold_pct` path (`lms-completion.service.ts`) correctly uses `lms-completion.constants.ts`; the magic `70` literals are only in the *repo fallback* paths (rows above).
- Workflow state strings ('draft'/'in_progress'/'approved'/'pending'/'inbox'/'outbox') and `NotificationType` enum — legitimate domain state-machine enums, not config-table candidates.
- chat module: `priority DEFAULT 'medium'`, poll options 2–10, 100MB file cap — validation/UI, excluded.


---

## Remaining / MRO / ERP / General / Core / Misc

Batch: apps/api/src/modules/{remaining, mro, erp, general, core, export, storage, hr-assets, applications, feedback-360}
READ-ONLY audit of magic numbers / hardcoded business strings.

Note: `feedback-360`, `applications`, `hr-assets` are pure re-export SHIMS to the `hr/` module tree (out of my scope; the real code lives under hr/, another agent's territory). No findings there.

### Coverage log (MODULE | total_files | files_opened(fully read) | findings)
- remaining | 36 | 14 (all 12 services + ideal-rasm/company-state repos) + 5 repos grep-scanned | 8
- mro       | 21 | 6 (maintenance.service, maintenance-order.aggregate, mro-inventory.service, drizzle-maintenance-svc.repo, machine-stopped.listener, mro.controller) | 5
- erp       | 15 | 6 (erp.service, erp-reports.service, erp-extra.service, erp-reports.repo, erp.repo, erp-camera.service) | 0 (thin delegators / real SQL)
- general   | 11 | 5 (legacy.service, legacy-kpi/attendance/warehouse.helpers, legacy-iot.service) | 3
- core      | 11 | 2 (positions.service, panel.aggregate) | 0
- export    | 4  | 1 (export.service) | 0 (PDF coords excluded)
- storage   | 2  | 0 (static-file controller only, no business logic) | 0
- hr-assets / applications / feedback-360 | 5 | 3 shims | 0

Honesty: controllers, DTOs, ACL, cron, module files, and several repos were grep-scanned (not fully opened) — they are thin transport/delegation with no business math. Findings below are only NEW file:line instances (deduped against MAGIC-NUMBERS-AUDIT-2026-07-05.md, SAP-CONFORMANCE, EXTENDED-GOVERNANCE).

### Findings table
File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
apps/api/src/modules/remaining/three-way-match.service.ts:18 | `TOLERANCE_PCT = 0.05` | 3-way-match invoice-vs-PO variance tolerance; `variance > TOLERANCE_PCT` sets `paymentBlocked=true` → blocks vendor payment | NO (distinct from GL tolerance 0.01 already documented; no 3-way-match tolerance config) | 1 | HIGH
apps/api/src/modules/remaining/order-status.service.ts:10-33 | `STATUS_TRANSITIONS` map (23 order statuses + allowed next-states) | Entire sales-order lifecycle state machine (draft→…→fully_paid) hardcoded inline; drives `getStatusChain()` and is the authoritative transition graph | PARTIAL (workflow_rules / document_workflow_routes exist for routing but order-status FSM is not table-driven) | 1 | MEDIUM
apps/api/src/modules/remaining/weekly-plan.service.ts:24-30 | Friday `18:00` + `5h` Tashkent offset | Weekly-plan approval hard deadline (Juma 18:00); after cutoff `approve()` is rejected | NO | 1 | MEDIUM
apps/api/src/modules/remaining/weekly-plan.service.ts:13 | `MANAGER_ROLES = ['director','super_admin','department_head','manager','admin']` | Role-name string array gates manager-only plan visibility/create/approve/delete | NO (roles enum on users; case/name drift risk) | 1 (additional occurrence of role-array cluster) | MEDIUM
apps/api/src/modules/general/services/legacy-warehouse.helpers.ts:253 | `occupancyRate: 72.5` | Warehouse dashboard KPI hardcoded to constant 72.5% regardless of real stock/capacity — fake computed value returned as real | NO | 1 | MEDIUM
apps/api/src/modules/general/services/legacy-kpi.helpers.ts:98-99 | `avgScore/20`; grade `score>=4 → A, >=3 → B, else C` | Employee performance ABC-grade cutoffs + composite-score→5-scale divisor (profile PerformanceTab) | NO (distinct from customer RFM/ABC-XYZ cluster; employee-KPI variant) | 1 (additional ABC-cluster occurrence) | MEDIUM
apps/api/src/modules/remaining/ideal-rasm.service.ts:26-31 | `branches_count:1`, `market_share:0`, `weekly_profit:0` | "Ideal rasm" strategic-target ACTUALS hardcoded, then divided into targets for `achievementPct` — branches always 1, market-share/profit achievement always 0% (fake data shown as real) | NO | 1 | MEDIUM
apps/api/src/modules/remaining/exception-log.repository.ts:125 | `INTERVAL '30 days'` | Certificate-expiry alert lookahead window (certExpiryCheck) | NO | 1 | MEDIUM
apps/api/src/modules/mro/maintenance/drizzle-maintenance-svc.repo.ts:180-181 | `unitCostUzs: 0, totalCostUzs: 0` | Utility (elektr/suv/gaz) reading cost hardcoded to 0 instead of computed from a utility-rate config; consumption shown but cost always 0 | NO (no utility-rate/tariff config table exists) | 1 | MEDIUM
apps/api/src/modules/mro/maintenance/drizzle-maintenance-svc.repo.ts:160 | `interval_days ?? 30` | PM (preventive-maintenance) schedule interval default = 30 days when column null | NO | 1 | LOW
apps/api/src/modules/mro/maintenance/drizzle-maintenance-svc.repo.ts:157,179 | `schedule_type ?? 'monthly'`, `unit ?? 'kWh'` | PM schedule-type default + utility unit default fallbacks | NO | 2 | LOW
apps/api/src/modules/mro/infrastructure/event-handlers/machine-stopped.listener.ts:43 | priority `'high'` | Auto-created maintenance order from machine-stopped event always priority=high (no severity mapping from event) | NO | 1 | LOW
apps/api/src/modules/mro/domain/aggregates/maintenance-order.aggregate.ts:89 | default `priority = 'medium'` | Fallback maintenance priority in legacy constructor branch | NO | 1 | LOW
apps/api/src/modules/remaining/material-balance.service.ts:38 | `current_stock <= 0 ? 'critical' : 'warning'` | Stock-alert severity threshold (zero-stock = critical) — no per-material min-based tiering | NO (min_stock exists per material but severity band hardcoded) | 1 | LOW
apps/api/src/modules/remaining/waste.service.ts:90-93 | `typeLabels` map (setup/trim/defect/overrun/material_defect/other) | Waste-type taxonomy → UZ display labels inline | NO (no waste_type config table) | 1 | LOW
apps/api/src/modules/remaining/ideal-rasm.repository.ts:16-22 | `DEFAULT_TARGETS` (profit 100M, revenue 800M, branches 15, employees 500, share 30%) | Seed defaults for strategic targets (written once if table empty; editable via DB after) | N/A (seed-only, DB-editable) | 1 | LOW
apps/api/src/modules/remaining/company-state.service.ts:41-47 | `LEVEL_NORMALISED_SCORE` (92/75/55/35/10) | Per-level representative normalised score for weighted holat recompute | N/A (classification bands come from state_thresholds DB; this is an internal bucket midpoint) | 1 | LOW
apps/api/src/modules/remaining/company-state.service.ts:223-229 | `DEFAULT_HOLAT_WEIGHTS_FALLBACK` (0.30/0.25/0.20/0.15/0.10) | Company-state metric weights fallback | YES: state_thresholds (documented DB-primary; this is logged fallback only) | 1 | LOW

### Notes
- ERP module (erp.service/repositories) is clean: thin delegators + parametrised real SQL; legacy routing writes are DEPRECATED (return NOT_IMPLEMENTED). No magic business numbers.
- company-state.service/.repository are the EP-DIR-001 vision-correct path — weights & bands are genuinely DB-driven (state_thresholds/company_state_levels); the two LOW items are documented fallbacks, listed only for completeness.
- legacy.service.ts is a pure facade; SQL helpers hold no thresholds beyond the occupancyRate:72.5 flagged above.
- Strongest finding = three-way-match TOLERANCE_PCT 0.05 (payment-blocking, financial, HIGH).


---

## Common / Shared / Infrastructure / Cron

Coverage log (module | total_files | files_opened | findings):
- apps/api/src/common | 101 | 14 opened (constants x9, guards/sod, decorators/throttle, app/business/status/roles/rbac-tier/lead/seat/security) + rest grepped | 12
- apps/api/src/cron | 45 | 14 opened + all 45 grepped | 11
- apps/api/src/database | 11 | 5 opened (positions/departments/position-permissions/feature-flags/master-data.seed) + SQL scanned | 2
- apps/api/src/shared | 267 | 8 opened (mostly schema.ts + .sql DDL = config tables, correct pattern) + grepped | 2
- apps/api/src/infrastructure | 13 | scanned (sprint2..8 migration services = DDL only) | 0
- apps/api/src/config | 4 | scanned (env/jwt/redis/db config wiring) | 0
- apps/api/src/events | 2 | scanned (event name constants) | 0
- apps/api/src/lib | 3 | scanned (objectStorage/ACL) | 0
- modules/common, modules/shared | 0 | MISSING (folders do not exist) | 0

HONESTY: `shared/db` is 267 files but ~200 are Drizzle `schema-*.ts` and `.sql` migrations. The SQL config seeds I opened (tax-rate-config, razryad-levels-upgrade, razryad-exam-threshold, p53-gofra-flute-factors) all write business values into DEDICATED CONFIG TABLES (razryad_levels, pp_flute_types, tax_rate_config) — that is the CORRECT pattern, so no findings there. Remaining schema/migration files were scanned by name+grep, not fully read.

| File:line | Value/constant | Business meaning | Config table? | Dup | Severity |
|---|---|---|---|---|---|
| apps/api/src/cron/late-arrival-fine.cron.ts:22 | `DEFAULT_FINE_UZS = 50000` | Flat late-arrival fine amount (UZS) generated as a discipline/fine PROPOSAL | YES: fine_rules (exists) — bypassed | 1 | HIGH |
| apps/api/src/cron/late-arrival-fine.cron.ts:80 | `minutesLate * 5000` | Per-minute late fine rate (UZS/min), capped at DEFAULT_FINE_UZS | YES: fine_rules — bypassed | 1 | HIGH |
| apps/api/src/cron/late-arrival-fine.cron.ts:21 | `GRACE_PERIOD_MIN = 5` | Late-arrival grace minutes — CONFLICTS with business.constants ATTENDANCE_LATE_GRACE_MINUTES=15 (two different graces) | NO | 2 | HIGH |
| apps/api/src/cron/employee-daily-invoice.cron.ts:36,161 | `DEFAULT_WORK_DAYS_PER_MONTH = 22` | Divisor for daily earned = base_salary/22 (payroll accrual) | NO (owner-tunable per company) | 1 | HIGH |
| apps/api/src/common/constants/app.constants.ts:121-123 | `RATE_USD_UZS=12700, RATE_EUR_UZS=13800, RATE_CNY_UZS=1750` | Hardcoded FX rates ("taxminiy kurs"); served live by finance-main.controller.ts:99 (also inline `RUB:140` there) | YES: exchange_rates (exists, empty) — not read | 1 | HIGH |
| apps/api/src/common/constants/app.constants.ts:126 | `PO_MAX_AMOUNT_UZS = 50_000_000` | Purchase-order approval ceiling; gates create-purchase-order.handler.ts:54 | NO | 1 | HIGH |
| apps/api/src/common/constants/business.constants.ts:157 | `LARGE_TX_THRESHOLD_UZS = 50_000_000` | Fraud-flag threshold for transactions | NO | 1 | HIGH |
| apps/api/src/common/constants/app.constants.ts:105-107 | `AI_BUDGET_OPENAI/GEMINI/CLAUDE_MONTHLY = 100/50/80` | Per-provider monthly USD budgets; seed defaults in ai-hr-new.service.ts:29-31 | YES: ai_provider_configs (d6 migration exists) | 1 | MEDIUM |
| apps/api/src/common/constants/app.constants.ts:85 | `HR_FINE_MINOR = '50000'` | Minor infraction fine seeded into fine catalog (hr-v2-seed.service.ts:28,30) | YES: fine_rules | 1 | MEDIUM |
| apps/api/src/common/constants/app.constants.ts:127 | `HR_SALARY_MEDIUM_UZS = 3_000_000` | Salary-band cutoff (hr-dashboard-extra.repository.ts:45-48) | NO | 1 | MEDIUM |
| apps/api/src/common/constants/app.constants.ts:128-129 | `DELIVERY_FREE_THRESHOLD_UZS=500000, DELIVERY_FEE_UZS=25000` | Free-shipping cutoff + flat delivery fee (ecommerce.service.ts:170) | NO | 1 | MEDIUM |
| apps/api/src/common/constants/app.constants.ts:92 | `CRM_LARGE_DEAL_THRESHOLD = 1_000_000` | Large-deal win-probability adjust (crm-ai.service.ts:72) | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:71-76 | `INCOME_SPLIT_DEFAULT {50/20/15/15}` | Revenue auto-split into 4 funds; doc says owner overrides via income_split_config | NO (income_split_config table does NOT exist) | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:316-320 | `DISCIPLINE_LATE_WARNING/REPRIMAND/DISCHARGE = 3/5/8` | Monthly late-count escalation ladder | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:50-52 | `COST_SPLIT_PAPER/INK/LABOR = 0.40/0.35/0.25` | Print-job cost split shares | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:134-136 | `CYCLE_COUNT_FREQUENCY_DAYS_A/B/C = 7/30/90` | ABC cycle-count cadence (days) | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:191,194 | `PAYROLL_MONTHLY_HOURS=176, PAYROLL_OVERTIME_MULTIPLIER=1.5` | Statutory monthly hours + OT multiplier | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:169 | `ATP_DEFAULT_LEAD_TIME_DAYS = 7` | Fallback procurement lead time when inventory_policy row missing | NO (inventory_policy.lead_time_days is real source) | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:221-229 | `OWNER_NEW_CUSTOMER_WINDOW=30, OWNER_SMALL_CUSTOMER_REVENUE=5M, VIP_REVENUE_THRESHOLD=100M, VIP_ACTIVE_WINDOW=30` | Owner-digest + RFM/VIP segmentation cutoffs | NO | 1 | MEDIUM |
| apps/api/src/common/constants/business.constants.ts:358-388 | `POS_NIGHT_SHIFT_START=22/END=6, POS_NIGHT_LARGE_QTY=1000, POS_NIGHT_LARGE_VALUE=50M, POS_OVER_NORM_FACTOR=1.10, POS_AI_NORM_MIN_SAMPLE=3` | POS anomaly-detection rule thresholds (night shift, over-norm) | NO (material_norms is data source, thresholds not) | 1 | MEDIUM |
| apps/api/src/cron/reference-image-compare.cron.ts:87 | `deviationScore > 0.4` | Workplace-photo deviation alert threshold (also model 'gemini-1.5-flash' :72) | NO | 1 | MEDIUM |
| apps/api/src/cron/discipline.cron.ts:28 | `INTERVAL '6 months'` | Discipline-record auto-expiry window | NO | 2 (also candidate-archive.cron.ts:27) | MEDIUM |
| apps/api/src/cron/boomerang-hire.cron.ts:59,66 | `1.0 ELSE 0.3 match_score`, `LIMIT 5` | Boomerang-rehire match score weights + top-N vacancy match | NO | 1 | MEDIUM |
| apps/api/src/common/guards/sod.guard.ts:58-116 | 6 hardcoded path+permission SoD pairs (po:create/approve, invoice/payment, warehouse receive/issue, payroll calc/approve, material create/delete, crm.rfm/churn) | Separation-of-Duties rule matrix as code | NO (candidate sod_rules table) | 1 | MEDIUM |
| apps/api/src/common/constants/roles.constants.ts:76-143 | `ROLE_PERMISSIONS` (16 roles × permission string arrays) | Role→permission matrix hardcoded as code | Partial: position_permissions table exists for POSITIONS; role matrix not DB-driven | 1 | MEDIUM |
| apps/api/src/cron/stock-alert.cron.ts:32 | `DAYS_AHEAD = 30` (+ critical<=7/warning<=30 in expiry service) | Lot-expiry warning look-ahead window | NO | 1 | LOW |
| apps/api/src/cron/vacancy-deadline.cron.ts:36 | `INTERVAL '3 days'` | Vacancy-closing reminder lead time (overdue-po.cron.ts comment also `< 3`) | NO | 1 | LOW |
| apps/api/src/common/constants/app.constants.ts:83-84 | `BADGE_POINTS_TOP_PERFORMER=200, BADGE_POINTS_DECADE_LOYALTY=500` | Gamification badge point awards | NO | 1 | LOW |
| apps/api/src/common/constants/app.constants.ts:135 | `MAX_USERS_DEFAULT = 400` | Default user/license cap | NO | 1 | LOW |
| apps/api/src/common/constants/rbac-tier.policy.ts:18-25 | `RAZRYAD_LEVEL_TO_RBAC_TIER {1-2 op,3-4 spec,5 mgr,6 exec}` | Razryad-level → RBAC tier mapping (owner-blessed single source) | NO (intentional policy constant; low risk) | 1 | LOW |

### Notes / non-findings (correct patterns, NOT flagged)
- SQL config seeds write to dedicated tables (CORRECT): razryad-levels-upgrade coefficients 1.00..2.80 → `razryad_levels`; razryad-exam-threshold 60/75 → `razryad_levels.exam_pass_threshold`; p53 flute factors A=1.54..BC=1.43 → `pp_flute_types`; tax-rate-config 12% is only a commented example → `tax_rate_config`.
- master-data.seed.ts + positions/departments/position-permissions/feature-flags seed into config tables; `POSITIONS_SEED`/`DEPARTMENTS_SEED` are empty (org-chart UI managed) so their inline headcount/level arrays are dead.
- position-feature-flags.data.ts approval amounts (50M/100M/20%/10%/70%) live only in comments = HITL_THRESHOLDS cluster (already documented, SAP-CONFORMANCE principle 6) — not re-reported.
- ai-fit-weekly.cron.ts FALLBACK_FIT_SCORE=50 lives in ai-fit.service.ts (AI module) — "AI score:50" cluster already documented; only referenced in comment here.
- throttle-profiles.ts rate limits, app.constants timeouts/cache-TTL/ports/OTP ranges/page-sizes = EXCLUDED per instructions.
- credit-check / budget-alert / warehouse-rental crons are STUBS (processed=0, thresholds 80%/8-days only in comments) — no live magic numbers.


---

## FE pages A-G

Scope: React pages DIRECTLY in `artifacts/erp-dashboard/src/pages/` (no subdirs), filename A–G, excluding `*.smoke.test.*`.

Coverage log:
`FE-pages-A-G | total_files=274 | files_opened=11 (fully read: ApprovalHub, EmployeeFilesPage, DailyReportPageSections, EventsCalendarTypes, ChartOfAccounts snippet, AccountantView snippet + 5 partials) | rest=~180 scanned via targeted grep (SelectItem option groups, taxonomy const arrays, numeric-threshold conditionals) | findings=27`

HONESTY: The 274 files were mostly SCANNED via grep patterns (inline `<SelectItem>` option groups, `const X = [...]` taxonomy arrays, numeric threshold comparisons `>=/<`), not opened one-by-one. ~11 opened/read in detail to confirm exact values and meaning. Score-color-only cutoffs (`score>=80 ? green`) that are purely cosmetic UI are NOT individually listed (dozens exist: AiAutomationPage, AIFitScores, AIReservation, camera-employees, camera-machines, CrmCohortAnalysis, DirectorExtendedSections, EmployeeProductivityPage, EmployeeRating, IdealRasmPage, etc. — LOW, treated as one known "KPI color-band" cluster).

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| ExpenseManagement.tsx:173-178 | office_supplies/production/transport/maintenance/marketing/other | Expense category taxonomy (drives expense classification + reporting) | NO (no expense_categories table) | 1 | MEDIUM |
| CashFlowManagementDialogs.tsx:93-98 | sales/purchase/salary/tax/loan/other | Cash-flow category taxonomy | NO | 1 | MEDIUM |
| ChartOfAccountsDialogs.tsx:85-89; ChartOfAccountsSections.tsx:68-72 | asset/liability/equity/revenue/expense | GL account-type taxonomy (accounting classification) | NO (accounts table has data but type enum hardcoded in FE, 2 copies) | 2 | MEDIUM |
| BOMManagementDialogs.tsx:197-199 | raw/semifinished/purchased | BOM component material-type taxonomy | NO | 1 | MEDIUM |
| DesignOrders.tsx:214-217 | stakan/quti/plakat/qadoq | Product-type taxonomy (overlaps MESProducts.tsx:43 CATEGORIES gofreli/quti/rulon/etiket) | NO (product_categories not present) | 2 (w/ MESProducts) | MEDIUM |
| EventsCalendarTypes.ts:75-81 | training/meeting/webinar/conference/other | Calendar event-type taxonomy + badge variants | NO | 1 | MEDIUM |
| EmployeeFilesPage.tsx:48-56 | passport/diploma/contract/certificate/medical/other | HR employee-document type taxonomy + labels | NO | 1 | MEDIUM |
| AIProductionPlanningDialogs.tsx:110-113 | machine_stop/material_shortage/priority_change/manual | Production reschedule-reason taxonomy | NO (downtime_reason_codes empty, different concept) | 1 | MEDIUM |
| AIInterviewPageSections.tsx:154-160 | general/technical/motivation/teamwork/problem_solving/personal/salary | Interview question-category taxonomy | NO | 1 | MEDIUM |
| AIInterviewPageSections.tsx:169-171 | easy/medium/hard | Interview difficulty tiers (dup at HRAIDashboardDialogs) | NO | 2 | LOW |
| FinanceExtended.tsx:258-261 | cash/card/other | Payment-method taxonomy | NO (payment_methods not present) | 1 | MEDIUM |
| BudgetManagementDialogs.tsx:91-93 | annual/quarterly/monthly | Budget period-type taxonomy | NO | 1 | LOW |
| camera-alerts-sections.tsx:160-163 | safety/quality/machine/productivity | Camera AI alert-category taxonomy (hardcoded bilingual inline, no i18n key) | NO | 1 | MEDIUM |
| AiCrmPageSections2.tsx:61-64 | professional/friendly/formal/persuasive | AI message-tone taxonomy | NO | 1 | LOW |
| EquipmentPage.tsx:375-377 | active/maintenance/retired | Equipment status taxonomy (dup of PPEquipmentPage EQUIPMENT_STATUSES) | NO | 2 | LOW |
| GLDocuments.tsx:255-257 | draft/posted/reversed | GL document status taxonomy | NO | 1 | LOW |
| GLPostingMonitor.tsx:203-205 | awaiting_review/posted/rejected | GL posting-review status taxonomy | NO | 1 | LOW |
| FaceRecognitionMonitoringSections.tsx:189-191 | recognized/unrecognized/flagged | Face-recognition status taxonomy | NO | 1 | LOW |
| AchievementsPage.tsx:31-46 | CATEGORY_ICONS / CATEGORY_COLORS maps | Achievement/gamification category taxonomy (icon+color per category) | NO | 1 | LOW |
| DailyReportPageSections.tsx:131,159 | `tasks_completed.length < 30` | Min daily-report length gate = 30 chars (blocks submit) | NO (hardcoded validation rule) | 2 | MEDIUM |
| DailyReportPageSections.tsx:129,162 | maxLength=2000; "+5 ball" | Max report length 2000 + fixed 5-point gamification reward for submitting | NO | 1 | MEDIUM |
| AccountantView.tsx:214-215 | `>90` over-budget, `>75 && <=90` warning | Budget-utilization alert thresholds (financial) | NO (business.constants candidate) | 1 | MEDIUM |
| AttemptsPage.tsx:143 | `pct >= 70` green else destructive | Exam pass/fail cutoff 70% (pass threshold) | NO | 1 | MEDIUM |
| CrpPage.tsx:53,62-63,94-95 | `utilizationPct > 80` | Work-center overload/bottleneck threshold 80% (capacity planning) | NO | 4 | MEDIUM |
| camera-employee-ratings.tsx:348,359 | `r.score < 80` | Employee underperformer flag threshold 80 (drives "needs attention" list) | NO | 2 | MEDIUM |
| CandidateReportDialogSections.tsx:88,136-137; CandidateReportDialogSections2.tsx:113,142-156; CandidateReportSections.tsx:107,119-120,151; CandidateReportSectionsExtra.tsx:74-107 | `>=30 / >=-30 / <-30`, `>=80`, `positionMatchScore>=70` | Recruitment tool-test scoring bands (positive/neutral/negative) + strong-trait cutoff + position-match pass | NO | ~8 | MEDIUM |
| AIExams.tsx:118-119 | `score>=90 / >=75` grade colors | Exam grade bands (additional occurrence of KPI color-band cluster) | NO | 1 | LOW |

Additional occurrences of ALREADY-DOCUMENTED clusters (not new — logged per dedup rule):
| File:line | Cluster | Note |
|---|---|---|
| AccountsPayable.tsx:92-94; AccountsPayableSections.tsx:19-23,180-182; AccountsReceivable.tsx:92-94; AccountsReceivableSections.tsx:19-23,180-182 | AR/AP aging 90/60/30 | Additional FE occurrences (documented in MAGIC-NUMBERS-AUDIT). Also 120+ bucket label at AP/ARSections:120 |
| Discipline.tsx:420-423; ExceptionLog.tsx:266-269,378-381; EquipmentPage.tsx:343-346; CRMActivitiesDialogs.tsx:87-90; DesignOrders.tsx:260-263 | priority/severity low/medium/high/urgent/critical | Additional occurrences of priorities/severity cluster (hardcoded inline instead of shared enum) |
| ApprovalHub.tsx:58-70 (HITL_TYPES: purchase_order/payment/three_way_match/credit_limit_exceed/discount_override/employee_tardiness/qc_fail_critical/mro_repair_high_value/employee_termination/inventory_writeoff/advance_bypass) | HitlDocumentType (SAP-CONFORMANCE principle 6) | NEW FE occurrence of HITL doc-type taxonomy, 11 types hardcoded in-page as const array |
| ApprovalHub.tsx:52-56 (PRIORITY_COLORS) | priorities | Additional occurrence |
| CrmFunnelAnalytics.tsx:333-334 (won/lost) | CRM win/loss markers | Additional occurrence |
| BarcodeSystemSections.tsx:96-99 (active/depleted/blocked/expired) | material batch-status taxonomy | Inline status list (bound to i18n but enum hardcoded) |

Notable NON-findings (config-driven — good): GofraFluteConfig.tsx / GofraWasteConfig.tsx / CompanyStateThresholdConfig.tsx / ErrorCatalogConfig.tsx are dedicated CONFIG CRUD pages (values come from DB, not hardcoded). ChartOfAccounts DEFAULT_FORM, EventsCalendar DEFAULT_VALUES, BarcodeSystem DEFAULT_BATCH_FORM = form initial-state defaults (not business taxonomy).


---

## FE pages H-P

Scope: FRONTEND files DIRECTLY in artifacts/erp-dashboard/src/pages/ (NOT subdirectories) with filename H–P. Focus: hardcoded business-taxonomy option arrays + hardcoded numeric business thresholds driving UI. READ-ONLY. NEW only.

Coverage log:
FE-pages-H-P | 286 (241 .tsx + 45 .ts, non-test) | ~24 opened/read-closely | 30
NOTE: All 286 top-level H-P files were grep-scanned (2 threshold patterns + 3 taxonomy patterns). ~24 files were opened and read in detail (the grep hits). Subdirectory files (employee-profile/, iot/, agents/, analytics/, barcode/, kanban/) that appeared in grep results were EXCLUDED as out-of-scope. Not a full line-by-line read of all 286 — grepped triage + targeted reads. Not claiming 100%.

Findings table:

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
OrderStatusPage.tsx:69 | `ALL_STATUSES` = 22-item array (draft…fully_paid…cancelled) | Full order lifecycle state-machine taxonomy hardcoded in FE; should mirror backend workflow/status config, not a literal FE array | NO (should derive from workflow_rules/document_workflow_routes / backend enum) | 1 | MEDIUM
MESProducts.tsx:43 | `CATEGORIES = ["gofreli","quti","rulon","etiket","lenta","xaltacha","other"]` | Packaging product category taxonomy hardcoded | NO (needs product/material category config table) | 1 | MEDIUM
PPEquipmentPage.tsx:38 | `EQUIPMENT_TYPES = ["press","laminator","cutter","binder","folder","printer","conveyor","other"]` | Equipment type taxonomy hardcoded | NO | 1 | MEDIUM
PPEquipmentPage.tsx:39 | `EQUIPMENT_STATUSES = ["active","maintenance","inactive"]` | Equipment status taxonomy hardcoded | NO | 1 | LOW
NotificationSettings.tsx:26 | `NOTIFICATION_TYPES` = 10 hardcoded keys (task_assigned…shift_reminder) | Notification-type taxonomy hardcoded in FE | NO (notification_schedules table exists per memory) | 1 | MEDIUM
InkCoverageCalculator.tsx:57 | `tacMaxByType = { newspaper:240, book:280, premium:320 }` + fallback `?? 280` (also labels L32-34) | Printing Total-Area-Coverage ink limits per paper type — business/press config | NO (should be paper-type config/DB) | 1 | MEDIUM
KnowledgeBaseTypes.ts:42 | category array (about_company/products/services/policies/procedures/faq/history/team/other) | Knowledge-base category taxonomy hardcoded | NO | 1 | MEDIUM
MarketingBudget.tsx:25 | `categoryLabels = {advertising,content,events,pr,social,tools,other}` | Marketing budget category taxonomy hardcoded (UZ labels inline) | NO | 1 | MEDIUM
MarketingCalendar.tsx:25-26 | `statusLabels{planned,in_progress,completed,cancelled}` + `platformLabels{telegram,instagram,facebook,website}` | Content status + social-platform taxonomy hardcoded (UZ labels) | NO | 2 | LOW
ProductivityInterviewDialogStep4.tsx:27 | `DECISION_OPTIONS = [qabul, kutish, rad, hech_qachon]` | Productivity-interview decision taxonomy hardcoded (matches vizyon interview outcome enum) | NO | 1 | MEDIUM
HRConflict.tsx:124 | `SEVERITY_OPTIONS = [low,medium,high,critical]` | Conflict severity taxonomy hardcoded | NO | 1 | LOW
HRMilestones.tsx:41 | `TYPE_FILTER_OPTIONS = [anniversary,promotion,certification,achievement]` | Milestone type taxonomy hardcoded | NO | 1 | LOW
HRPip.tsx:129 | status options [draft,active,completed,failed] | PIP status taxonomy hardcoded | NO | 1 | LOW
HRGamification.tsx:33 | period options [monthly,quarterly,total] | Leaderboard period taxonomy hardcoded | NO | 1 | LOW
OrgNodePortretTab.tsx:44 | `DEFAULT_PORTRET`: age_min 22, age_max 45, probation_months 3, work_schedule "5/2" | Hardcoded default hiring-portrait numeric business values presented as form defaults | NO | 1 | MEDIUM
OrgNodePortretTab.tsx:56 | `DEFAULT_TOOL_REQS`: iq_min 4, leadership_min 70, replication_min 70 | Hardcoded tool-test pass thresholds (tie to HRCapital tool_test scoring) | NO | 1 | MEDIUM
HRCapitalTestsDialogs.tsx:344-356 | leadership `>=80 / >=60`, accuracy `>=90 / >=70` verdict tiers | Test-score interpretation thresholds hardcoded (Yaxshi/O'rta/Rivojlanish) | NO | 1 | MEDIUM
HREnps.tsx:171-207 | eNPS `>50` A'lo, `>=0` Qoniqarli (color+label, 3 sites) | eNPS scoring band thresholds hardcoded | NO | 3 | MEDIUM
HRAlertBanner.tsx:73 | `overdue_hours > 48` critical vs warning | HR alert criticality threshold hardcoded | NO | 1 | MEDIUM
MES OEE tier `>=85 / >=70` | worldClass/color/label at MESExtended.tsx:146, MESExtendedTabsA.tsx:53-62, MESHomeDashboardSections.tsx:100-103, IoTExtendedSections.tsx:230-235 | OEE world-class/acceptable band thresholds hardcoded across MES+IoT UI | NO | 4 | MEDIUM
QC pass-rate `>=95 / >=85` | ProductionOrder360.tsx:104, ProductionOrder360Quality.tsx:54 | QC pass-rate acceptance band thresholds hardcoded | NO | 2 | MEDIUM
Completion `>=100 / >=50` | ProductionOrder360.tsx:94, ProductionReport.tsx:149, ProductionFactsPage.tsx:173 (eff 100/80) | Order completion/efficiency band thresholds hardcoded | NO | 3 | LOW
LMSExtended.tsx:102 | badge tiers `overallScore >=100 Ekspert / >=50 Senior / >=20 Intermediate` | Competency/seniority tier taxonomy + thresholds hardcoded | NO | 1 | MEDIUM
InspectionPage.tsx:55 | anomaly `cleanliness_score < 0.6 || order_score < 0.6` | 5S inspection anomaly threshold hardcoded (0-1 scale) | NO | 1 | MEDIUM
InspectionPageSections.tsx:147 | anomaly `cs < 60 || os < 60` (+pct 70/50 color L18) | Same 5S anomaly threshold but on 0-100 scale — UNIT INCONSISTENCY vs InspectionPage.tsx (0.6 vs 60) | NO | 1 | MEDIUM
LogisticsDashboardVehiclesTab.tsx:135-149 | fuel `<30/<60`, maintenance days `<30`, insurance days `<60` | Fleet operational alert thresholds hardcoded | NO | 3 | MEDIUM
MRODashboardSections2.tsx:83 | budget ratio `>0.9 / >0.7` color | Maintenance budget-consumption alert thresholds hardcoded (financial) | NO | 1 | MEDIUM
MarketingLeadsSections.tsx:42 + MarketingLeadsTypes.ts:111-118 | hot lead `score>=60`; color `<30 / <60` | Lead-scoring band thresholds hardcoded | NO | 2 | MEDIUM
MarketingExtendedSections.tsx:113-338 | keyword pos `<=3 / <=10`, NPS `>=70 / >=50`, nps input range 0-10 | SEO-rank + NPS band thresholds hardcoded | NO | 3 | MEDIUM
ProductProfitabilityTypes.ts:81 | margin brackets `>30% / 15-30% / <15%` | Product margin tier thresholds hardcoded (financial) | NO | 1 | MEDIUM
IoTExtendedSectionsExtra.tsx:53-81 | predictive risk `>=80 / >=60` critical/warn bands | IoT failure-risk band thresholds hardcoded | NO | 1 | MEDIUM
IdealRasmPage.tsx:57-74,332 | pct color tiers 100/80/60 + achievement buckets ≥80/60-80/<60 | Target-achievement band thresholds hardcoded | NO | 1 | LOW
ImpositionCalculator.tsx:194 | sheet `utilization >= 70` good vs destructive | Imposition sheet-utilization acceptance threshold hardcoded (printing) | NO | 1 | MEDIUM

Additional low-value color clusters observed (NOT separately rowed; same "UI band-threshold" pattern): MROExtendedTabsB.tsx:32-35 (90/70), MMExtendedFleetTabs.tsx:440 (fuel 50/25), IotMaintenanceMonitorTab.tsx:360 (attendance 80/60), HRDashboardSections.tsx:60 (daysLeft 7/15), IotSensorsPage.tsx:155 (battery<20). All LOW / dup of above patterns.


---

## FE pages Q-Z

Scope: files DIRECTLY in `artifacts/erp-dashboard/src/pages/` whose basename starts Q-Z (uppercase) OR lowercase/other (camera-*, not-found, usePlanningBoardActions). Subdirectories (qc/, crm/, warehouse/, hr-dashboard/, etc.) are OUT of scope and excluded. `.smoke.test.tsx` excluded.

Coverage method: ALL in-scope files were content-grepped (taxonomy const-array patterns, numeric threshold `>= / <=` patterns, business status-string equality). ~14 high-signal files were opened & read fully to confirm exact literals/config mapping. Honest: not every file was line-by-line opened — the long tail (Sections/Dialogs/Types splits that grep showed only standard status-render logic) was scanned via grep, not opened.

Coverage log:
QC (Q*) | 24 | 4 | 2
SD (S*) | 92 | 5 | 4
Warehouse/WMS (W*) | 71 | 3 | 5
Tech/misc (T*,U*,V*) | 34 | 2 | 2
Strategic/Stat/SevenFunctions/HR-dialog | 10 | 4 | 4
camera-* + lowercase | 41 | 3 | 2

### Findings (NEW only)

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
SDSalesQuotesTypes.ts:70 | `PAPER_TYPES` (b_flute/c_flute/bc_flute/e_flute/micro + mm) | Gofra flute/paper taxonomy hardcoded in quote calculator; GofraFluteConfig UI page exists implying this should be config/DB-driven | NO (GofraFluteConfig page exists, no bound table) | 1 | MEDIUM
SDSalesQuotesTypes.ts:85 | `DELIVERY_TYPES` = [{0},{30},{60},{100}] km tiers | Delivery-distance tiers feed quote/price calc — hardcoded km bands drive customer pricing | NO | 1 | MEDIUM
SDSalesQuotesTypes.ts:78 | `PRINT_COLORS` = [0,1,2,4] | Print-color options (0/1/2/4-color CMYK) drive quote cost; hardcoded enum | NO | 1 | LOW
SDLostOrders.tsx:67 | `LOST_REASON_CODES` = [price,deadline,competitor,quality,other] | Lost-order reason taxonomy hardcoded (drives lost-reason analytics) | NO — additional occurrence of CRM win/loss-reason cluster | 1 | MEDIUM
SDLostOrders.tsx:77 | `RECLAMATION_STATUSES` = [open,investigating,resolved,rejected] | Reclamation status enum hardcoded in FE | NO | 1 | LOW
QCApprovalTypes.ts:27 | `TEST_CATEGORIES` (physical/mechanical/printability/chemical/environmental) + `TEST_PARAMS_BY_CATEGORY` (ECT/FCT/BST/CMT etc.) | QC test-category + per-category parameter taxonomy hardcoded; should map to defect_catalog/qc config | NO (defect_catalog exists but not these test params) | 1 | MEDIUM
QCModuleTypes.ts:88 | `CATEGORY_TABS` | QC module category tab taxonomy hardcoded | NO | 1 | LOW
RulonCards.tsx:28 | `ROLL_TYPES` = [kraft,test_liner,fluting,white,makulatura] | Paper-roll material-type taxonomy hardcoded (should be material master) | NO | 1 | MEDIUM
WMSMaterials.tsx:67 | `CATEGORIES` (qogoz/karton/boyoq/plyonka/kimyoviy/ehtiyot/tayyor/boshqa) | Material category filter taxonomy hardcoded (i18n labels) | NO (no material_category config table) | 1 | MEDIUM
WarehouseBinsPage.tsx:65 | `BIN_TYPES` = [storage,receiving,shipping,quarantine,return] | Warehouse bin-type taxonomy hardcoded | YES:warehouse_types (partial overlap) | 1 | MEDIUM
WarehouseZonesPage.tsx:48 | `ZONE_TYPES` = [storage,receiving,shipping,quarantine,return,production] | Warehouse zone-type taxonomy hardcoded (drift vs BIN_TYPES above — +production) | YES:warehouse_types (partial) | 1 | MEDIUM
WarehouseKirimWizard.tsx:65 | `w.code === "QC-HOLD"` / `type === "quarantine"` | Quarantine warehouse selected by hardcoded code string | NO — additional occurrence of RM-MAIN/QC-HOLD quarantine cluster | 1 | MEDIUM
WasteTrackingTypes.ts:86 | `WASTE_TYPES` = [setup,trim,defect,overrun,material_defect,other] | Waste-reason taxonomy hardcoded | NO | 1 | MEDIUM
WasteTrackingTypes.ts:87 | `MATERIAL_TYPES` = [karton,kraft,qog'oz,bo'yoq,yelim] | Material-type list hardcoded (overlaps material master + WMSMaterials CATEGORIES — drift) | NO | 1 | MEDIUM
StatRegulationsPage.tsx:45 | `FREQUENCY_OPTIONS` = [daily,weekly,monthly] | Stat-regulation reporting frequency enum hardcoded | NO | 1 | LOW
VacancyPortretDialog.tsx:63 | `SOCIAL_PACKAGE_OPTIONS` (7 items) | Vacancy social-package option list hardcoded | NO | 1 | LOW
VacancyPortretDialog.tsx:59 | `probation_months: 3`, `work_schedule: "5/2"` | Default probation period & work schedule hardcoded as business default | NO | 1 | LOW
StrategicTasksPanelTypes.ts:9 | `STATUS_OPTIONS` (planned/in_progress/testing/completed/on_hold/cancelled) | Strategic-task status taxonomy hardcoded | NO | 1 | LOW
StrategicTasksPanelTypes.ts:18 | `PRIORITY_OPTIONS` (low/medium/high/critical) | Task priority taxonomy hardcoded | NO | 1 | LOW
SevenFunctions.tsx:129-135 | hardcoded team member P/A/E/I/C/S/M scores (Alisher Karimov CEO ... etc.) | Fake/hardcoded personnel-rating data rendered as real evaluation data | NO | 5 rows | MEDIUM
SevenFunctions.tsx:140-141 | `score >= 8` / `score >= 6` | 7-functions rating color-band thresholds (business rating tiers) | NO | 1 | LOW
camera-employees.tsx:108-115 | `score >= 80` / `>= 60` | Employee productivity/quality/safety score color bands | NO — additional occurrence of AI-score band cluster | 2 | LOW
camera-machines.tsx:215 | `oeeValue >= 80` / `>= 60` | OEE color-band thresholds hardcoded | NO — additional occurrence of score-band cluster | 1 | LOW

Notes:
- Config-editor pages in range (RazryadLevelConfig, ShiftTypesConfig, WorkCenterNormsConfig, WarehouseTypePage, WarehouseRentalSettings) are DB-config UIs by design — not flagged.
- The many `status === "pending"/"approved"/"draft"...` equality checks across S*/T*/W* Sections/Dialogs are standard workflow-render logic (no dedicated config table expected) and were NOT flagged individually — they are the ubiquitous status-enum pattern already noted in prior audits.
- WarehouseZonesPage ZONE_TYPES vs WarehouseBinsPage BIN_TYPES drift (production only in zones) is a data-consistency smell worth a single canonical warehouse_types-derived source.


---

## FE page subdirs

Scope: artifacts/erp-dashboard/src/pages/{employee-profile,kanban,crm,qc,iot,analytics,accountant,payroll,hr-dashboard,planning,ai-planning,mro,erp,barcode,chat,agents,mini-app,lms-extended,skills-matrix,daily-kpi}
Method: whole-scope keyword/threshold greps (taxonomy const arrays + numeric business thresholds), then targeted READ of the ~14 highest-signal files. Most files were grep-SCANNED, not fully opened. Honest opened counts below.

Coverage log (`MODULE | total_files | files_opened | findings`):
employee-profile | 77 | 5 | 6
qc | 33 | 2 | 5
kanban | 30 | 1 | 0(new; role/notif taxonomy = i18n-ok)
crm | 25 | 2 | 4
iot | 19 | 2 | 3
analytics | 15 | 0(grep only) | 1
accountant | 11 | 0(grep only) | 0
mro | 12 | 0(grep only) | 1
erp | 12 | 1 | 1(cluster)
agents | 14 | 0(grep only) | 4
ai-planning | 10 | 1 | 2
payroll | 6 | 0(grep only) | 1
skills-matrix | 3 | 1 | 1
hr-dashboard/planning/barcode/chat/mini-app/lms-extended/daily-kpi | ~44 | 0(grep only) | 0 new

### NEW findings

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity

**Numeric business thresholds**
artifacts/erp-dashboard/src/pages/ai-planning/RushOrderPage.tsx:33-34 | FEASIBILITY_HIGH=70, FEASIBILITY_LOW=40 | Rush-order feasibility approval bands (green/yellow/red drives approve/reject UI) | NO | 1 | HIGH
artifacts/erp-dashboard/src/pages/payroll/CalculationsTab.tsx:39 | driftPct <= 1 | Payroll recalculation drift tolerance (±1% treated as OK/yellow) | NO | 1 | HIGH
artifacts/erp-dashboard/src/pages/qc/SupplierQualityPage.tsx:59 | PASS_RATE_THRESHOLD_GOOD=95 | Supplier QC avg pass-rate success cutoff | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/qc/QualityTrendPage.tsx:63 | passRate > 95 | Quality-trend success cutoff (same 95 as above, different file) | NO | +1 | MEDIUM
artifacts/erp-dashboard/src/pages/qc/QCSupplierQualityTab.tsx:67-68 | avgQualityScore 90 / 70 → grade A/B/C | Supplier quality grade bands + inline "A—Yaxshi/B—O'rta/C—Yomon" labels | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/iot/IoTProductionDashboard.tsx:43 | DOWNTIME_THRESHOLD_SECONDS=30 | Machine auto-stop / downtime detection window | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/iot/useIoTTablet.ts:279 | minutes 1..480 | Downtime duration validation cap (max 8h) | NO | 1 | LOW
artifacts/erp-dashboard/src/pages/ai-planning/BottleneckAnalysisPage.tsx:32 | UTILIZATION_BOTTLENECK_THRESHOLD=90 | Work-center overload/bottleneck flag | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/mro/PreventiveMaintenancePage.tsx:34 | DUE_WINDOW_DAYS=7 | Preventive-maintenance "due soon" window | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/erp/ERPDashboardTab.tsx:105,121,139,157,283 | planVsFact 90/70, OEE 85/70, scrap 2/5, downtime 30/60, utilization 90/75 | ERP KPI grade→color bands (statusGood/Medium/Poor) all inline | NO | 1 cluster (~10 sites) | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/MachineOperatorTabExtras.tsx:90-100 | OEE 85/65/50 → A'lo/Yaxshi/Qoniqarli/Yaxshilash | Operator OEE grade bands | NO | see below | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/MachineOperatorTab.tsx:106 | OEE 80/60 → A'lo/Qoniqarli/Past | SAME concept, DIFFERENT cutoffs (80 vs 85) — inconsistent OEE grading | NO | +1 | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/DailyReportsTab.tsx:119 | OEE 85/70 grade colors | Third OEE band variant | NO | +1 | LOW
artifacts/erp-dashboard/src/pages/employee-profile/AdaptationTab.tsx:152-153,47-48 | overallScore <3.0 at_risk / >=4.5 excellent; 4/3 color | Onboarding adaptation status thresholds | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/MonthlyReportTabSections.tsx:70-78 | attendanceRate 90/75 | Attendance grade bands | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/agents/ProductionDashboard.tsx:51,119 | OEE >=0.65, pct 80/60 | Agent dashboard OEE/utilization color bands | NO | +1 | MEDIUM
artifacts/erp-dashboard/src/pages/agents/HRPerformanceDashboard.tsx:86 | score 80/50 | Performance score grade bands (drives bonus display context) | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/agents/FacilitiesDashboard.tsx:48,72 | deltaPct > 20; daysLeft <= 3 | Utility-cost overage alert + spare-part days-left alert | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/agents/AgentsHub.tsx:148 | health 80/50 | Agent health status bands | NO | 1 | LOW
artifacts/erp-dashboard/src/pages/crm/EntityCardTypes.ts:46 | score 70/40 → hot/warm/cold color | CRM AI lead score grade bands | NO | dup below | MEDIUM
artifacts/erp-dashboard/src/pages/crm/EntityCardSections.tsx:164-165 | score >=70 Flame / >=40 Star | Same CRM score bands, another file | NO | +1 | MEDIUM
artifacts/erp-dashboard/src/pages/crm/AIAnalysisPanelTypes.ts:98-99 | value >=70 / >=40 color | Same CRM score bands, third file | NO | +1 | MEDIUM
artifacts/erp-dashboard/src/pages/analytics/AssessmentTab.tsx:253-254 | kr20 >=80 / >=70 | Psychometric test reliability (KR-20) quality thresholds | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/analytics/RemainingTabsA.tsx:174 | completionPercent 80/50 | Course completion grade bands | NO | 1 | LOW
artifacts/erp-dashboard/src/pages/kanban/ResourceAllocationView.tsx:62,65 | today>3, thisWeek>10 | Resource overload (task count) alert thresholds | NO | 1 | MEDIUM

**Business-taxonomy hardcoded option arrays**
artifacts/erp-dashboard/src/pages/crm/QuickCreateModalTypes.ts:15 | SOURCE_OPTIONS (CALL/WEBFORM/TELEGRAM/EMAIL/WEB/INBOUND/PARTNER/OTHER) | CRM lead-source taxonomy | NO (no crm_lead_sources table listed) | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/crm/QuickCreateModalTypes.ts:26 | CURRENCY_OPTIONS (UZS/USD/EUR/RUB) | Currency list hardcoded | PARTIAL: exchange_rates(empty) | dup w/ MMVendors/SDQuotes(out of scope) | MEDIUM
artifacts/erp-dashboard/src/pages/qc/QCStandardsTab.tsx:50 | STANDARD_TYPES (iso/gost/uzst/internal) | QC standard-type taxonomy | NO | dup QCCertificateGenerator.tsx:26 | MEDIUM
artifacts/erp-dashboard/src/pages/qc/QCStandardsTab.tsx:57 | CATEGORY_OPTIONS (physical/mechanical/printability/chemical/environmental/logistics/visual) | QC test-category taxonomy | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/PersonalTabSections.tsx:109 | KNOWN_SALARY_TYPES (monthly/hourly/piecework/contract + uz synonyms) | Salary-type taxonomy (payroll-relevant) | NO | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/employee-profile/CorporateInventoryTabTypes.ts:9,18 | DEVICE_TYPES (phone/laptop/tablet/uniform/equipment/other) + CONDITIONS (new/good/fair/damaged) | Corporate-asset taxonomy | NO | 1 | LOW
artifacts/erp-dashboard/src/pages/employee-profile/AssessmentTab.tsx:43 | REVIEWER_TYPES | 360-review reviewer-type taxonomy | NO | 1 | LOW
artifacts/erp-dashboard/src/pages/skills-matrix/types.ts:55,70 | LEVEL_MAP 1-5 (beginner/basic/intermediate/advanced/expert) + getLevelBadge labels | Skill proficiency-level taxonomy | NO (razryad_levels is a different concept) | 1 | MEDIUM
artifacts/erp-dashboard/src/pages/crm/RobotsViewTypes.ts:51,58 | TRIGGER_TYPES / ACTION_TYPES | CRM automation-robot taxonomy | NO | dup crm-types.ts:198,205 | LOW
artifacts/erp-dashboard/src/pages/iot/IoTProductionDashboardDialogs.tsx:127-129 | session type (setup/production/cleaning) | MES machine-session type taxonomy | NO | 1 | LOW

### Additional occurrences of ALREADY-DOCUMENTED clusters (dedup)
artifacts/erp-dashboard/src/pages/crm/EntityCard.tsx:53 | `{ score: 50, churnRisk: "medium" }` fallback | Additional occurrence of documented "AI score:50 hardcoded fallback" cluster | HIGH
artifacts/erp-dashboard/src/pages/employee-profile/TechAccessTab.tsx:56,54,50-51 | IOT_ROLES + ALL_MODULES + ROLE_MODULE map (super_admin/admin/it/... module-access) | Additional occurrence of "role-array case-drift" cluster (hardcoded role names as access control) | MEDIUM
artifacts/erp-dashboard/src/pages/agents/ProductionDashboard.tsx:51 | OEE >= 0.65 | Additional occurrence of OEE-threshold cluster | MEDIUM

Notes:
- OEE grade cutoffs are INCONSISTENT across FE files (0.65, 80, 85 used for the same "good" boundary in MachineOperatorTab vs MachineOperatorTabExtras vs DailyReportsTab vs ERPDashboardTab vs ProductionDashboard). Single source (config table / business.constants) would resolve the drift.
- CRM AI score bands (70/40) repeated in 3 files (EntityCardTypes/EntityCardSections/AIAnalysisPanelTypes) — one shared constant needed.
- accountant/ (11 files), chat/, barcode/, mini-app/, lms-extended/, daily-kpi/, hr-dashboard/, planning/ grep-scanned: no NEW business taxonomy/threshold beyond number-formatting (daily-kpi/types.ts:48-50 = mlrd/mln/ming formatting = EXCLUDED cosmetic) and status-string UI maps (mro/* STATUS_CONFIG, planning PlanningTabPanels status===) which are BE-driven status filters, not new hardcoded taxonomy.


---

## FE components

Coverage log (folder = artifacts/erp-dashboard/src/components):
components | 529 | ~35 read-closely / 529 grep-scanned | 33
Method: grep-scanned ALL 529 tsx/ts files for taxonomy const arrays, hardcoded `SelectItem`/`{value,label}` objects, and numeric business thresholds; then READ ~35 files closely to confirm context. "opened" = read closely; the rest were pattern-scanned (honest: not 100% line-by-line read).

Findings table (NEW instances only; dedup clusters flagged as "additional occurrence"):

File:line | Value/constant | Business meaning | Config table? | Dup count | Severity
---|---|---|---|---|---
production/report/helpers.ts:24 | `DEPARTMENTS = ["Flexo","Gofra","Flotto","Rezka","Offset","Digital","Laminatsiya"]` | Shop-floor department/workcenter list hardcoded in FE | NO (org_departments/work centers exist in DB) | 1 | MEDIUM
production/report/helpers.ts:26-33 | `DOWNTIME_REASONS` (machine_failure, material_shortage, color_setup...) | MES downtime reason codes | YES: mes_downtime_reasons / downtime_reason_codes | additional occurrence of "downtime reasons FE" cluster | MEDIUM
production/report/helpers.ts:8-21 | `STATUS_LABELS` + `SHIFT_STATUS` (created/released/in_progress/qc_hold; draft/approved/rejected) | Production order & shift status taxonomy | NO (status enums, no config table) | 1 | LOW
production/report/helpers.ts:96-97 | `v>=85` green / `v>=65` yellow (OEE/efficiency color) | Efficiency grade thresholds | NO | 1 | LOW
orders/order-constants.ts:8-16 | `PRODUCT_TYPES` (gofra/gladkiy/laminated/offset/flexo/other) | Product type taxonomy for orders | NO (product master expected) | 1 | MEDIUM
orders/order-constants.ts:17-26 | `VID_ZAKAZA` (korobka/paket/korzina/lotok/display...) | Order/packaging kind taxonomy | NO | 1 | MEDIUM
orders/order-constants.ts:28-32 | `ZAKAS_FORMY` (new/repeat/correction) | Order-form category | NO | 1 | LOW
orders/order-constants.ts:34-43 | `KRASOK_OPTIONS` (1+0,4+0,1+1,4+4,5+0,6+0,0+0) | Print colour-config taxonomy (drives costing) | NO | 1 | MEDIUM
settings/camera/types.ts:45-51 | `CAMERA_TYPES` (entry/production/machine/warehouse/external/canteen + AI prompts) | Camera-type taxonomy + hardcoded AI default prompts | NO | 1 | MEDIUM
settings/camera/types.ts:54-64 | `DETECTION_TYPES` (ppe_violation, quality_defect, fire_smoke...) | AI detection taxonomy mapped to modules | NO | 1 | MEDIUM
settings/camera/types.ts:67-74 | `ACTION_OPTIONS` (safety_alert/qc_alert/hr_log/mes_alert...) | AI-trigger action routing taxonomy | NO (workflow_rules exists for routing) | 1 | MEDIUM
settings/camera/types.ts:86-90 | `SEVERITY_LABELS` low/medium/high/critical | Alert severity taxonomy | NO | 1 | LOW
crm/activity/types.ts:50-79 | `ACTIVITY_TYPE_OPTIONS`, `PRIORITY_OPTIONS`, `MEETING_DURATIONS`, `WHATSAPP_TEMPLATES` | CRM activity type/priority + hardcoded WhatsApp msg templates | NO | 1 | LOW
hr/portret/HRRequestDialog.tsx:30-35 | `REQUEST_TYPES` (new_hire/replacement/additional/transfer/promotion) | HR request type taxonomy | NO | 1 | MEDIUM
hr/portret/HRRequestDialog.tsx:86-87 | priority normal/urgent | HR request priority | NO | 1 | LOW
hr/ProbationReviewDialog.tsx:25-31 | `SCORE_CRITERIA` (task_quality/independence/teamwork/discipline/learning_speed/motivation) | Probation scoring rubric (6 fixed criteria) | NO | 1 | MEDIUM
hr/ProbationReviewDialog.tsx:36-39 | `DECISIONS` (continue/extended_trial/terminate) | Probation outcome taxonomy (drives employment) | NO | 1 | MEDIUM
hr/ProbationReviewDialog.tsx:68,99-100,191-192 | dot `<=3/<=6`; avg `>=8`/`>=5` color+decision hint | Probation score grade thresholds | NO | 1 | MEDIUM
kanban/BoardDialogs.tsx:56-60 | `PRIORITY_OPTIONS` urgent/high/normal/low | Kanban task priority taxonomy | NO | 1 | LOW
hr/JobOfferDialog.tsx:42-47 | `SCHEDULE_OPTIONS` (5/2, 6/1, Smenali 2/2, Erkin, Gibrid) | Work-schedule taxonomy on offer letter | NO | 1 | MEDIUM
lms/CourseSettingsForm.tsx:20 | `COURSE_TYPES = ['safety_tx','regulation','general','razryad_exam','onboarding','replication']` | LMS course-type taxonomy | NO | 1 | MEDIUM
recruiting/helpers-constants.tsx:12-24 | `STAGES` (12 funnel stages NEW..REJECTED) + NEXT_STAGE/TERMINAL_STAGES | Recruiting funnel stage machine hardcoded in FE | NO | 1 | MEDIUM
recruiting/helpers-constants.tsx:42-48 | `HC_PHASES` (PORTRET/UPAKOVKA/OQIM/BAHOLASH/KIRITISH/KUCHAYTIRISH) + stage mapping | Hiring 6-phase model + stage-to-phase mapping | NO | 1 | MEDIUM
recruiting/helpers-constants.tsx:83 | `ALL_CHANNELS = [LINKEDIN,HH_UZ,UZJOB,MYJOB,OLX_UZ,TELEGRAM]` | Sourcing-channel list | NO | dup w/ portret CHANNELS_LIST | MEDIUM
recruiting/portret/types.ts:104-112 | `CHANNELS_LIST` (8 channels: hh.uz/UZjobs/MyJob/OLX/Telegram/Instagram/LinkedIn/Facebook) | Sourcing-channel taxonomy (divergent from ALL_CHANNELS) | NO | dup w/ helpers-constants:83 | MEDIUM
recruiting/portret/types.ts:91-101 & hr/portret/PortretBlokD.tsx:12-22 | `TOOL_TRAITS` (A–J psychometric traits) | Psychometric competency taxonomy duplicated in 2 files | NO | 2 | MEDIUM
hr/org/types.ts:48 | `HRC_INDICATORS = ["A".."J"]` | 10-indicator competency codes | NO | additional occurrence of TOOL_TRAITS keys | LOW
hr/portret/PortretSection3.tsx:44,48 | `probation_months ?? 3`, `work_schedule ?? "5/2"` | Default probation length & schedule as real defaults | NO | 1 | MEDIUM
sd/europrint/LeadsTab.tsx:24 | `LEAD_STAGES = [new,working,quoted,negotiating,won,lost,frozen]` | CRM lead pipeline stages hardcoded | NO | 1 | MEDIUM
crm/LeadScoreBar.tsx:22 | tier `score>=70 hot : >=40 warm : cold` | Lead scoring tier cutoffs | NO | additional occ of RFM/lead-tier | MEDIUM
director/FinanceCard.tsx:22 | receivable ok if `< 100_000_000` | Hardcoded AR health threshold (100M UZS) | NO | 1 | HIGH
hr/labor-market/HiringForecast.tsx:52,59 | `candidateCount<10 → +7 days`; `<=15/<=30` day color | Hiring-time forecast rule + thresholds | NO | 1 | MEDIUM
employee/dialogs/FineDialog.tsx:80-83 | fine reasons late/discipline/damage/other | Payroll fine reason taxonomy | YES: fine_rules | 1 | HIGH
employee/dialogs/OvertimeDialog.tsx:80-81 | multipliers `1.5x`, `2.0x` | Overtime pay multipliers hardcoded (payroll calc) | NO (should be payroll config) | 1 | HIGH
employee/dialogs/LeaveRequestDialog.tsx:73-76 | annual/unpaid/study/maternity | Leave type taxonomy in FE | YES: leave_types | additional occurrence of "LeaveType enum" cluster | MEDIUM
employee/dialogs/BonusDialog.tsx:78-82 | performance/holiday/project/referral/other | Bonus reason taxonomy | NO | 1 | MEDIUM
employee/dialogs/ContractDialog.tsx:69-71 | indefinite/temporary/probation | Contract type taxonomy | NO | 1 | LOW
assets/AssetFormDialogs.tsx:109-110 | depreciation method straight_line/declining_balance | Asset depreciation method (financial calc) | NO | 1 | HIGH
assets/AssetFormDialogs.tsx:127-130,192-195 | condition excellent/good/fair/poor; maint preventive/corrective/predictive/emergency | Asset condition & maintenance-type taxonomy | NO | 1 | LOW
assets/AssetActionDialogs.tsx:81-84,189-193 | disposal write_off/sale/donation/scrap; insurance coverage types | Asset disposal & insurance taxonomy | NO | 1 | MEDIUM
wms/reservation/AddBatchDialog.tsx:102-107,118-120 | units kg/m/m2/dona/rulon/list; grade A/B/C | Material units + quality grade in FE Select | YES: unit_of_measures / qc_grade_price_coefficients | additional occurrence of "material units FE" cluster | MEDIUM
production/qc/VendorSection.tsx:66,137-138 | vendor score `>=85 A'lo : >=70 Qoniqarli : else` | Vendor quality-grade cutoffs + labels | NO | 1 | MEDIUM
hr/orgnode/FitTab.tsx:51-53 | fit `>=85 A'lo :>=70 Yaxshi :>=50 O'rtacha` | Card-fit classification thresholds | NO | 1 | MEDIUM
hr/org/TreeNodeCard.tsx:184 & recruiting/CandidateCard.tsx:126-127 | fit `>=30 green :>=-30 yellow : red` | Fit-score sign classification duplicated | NO | 2 | LOW
sd/LtvTab.tsx:45 | `churnRisk>=70 high :>=40 medium : low` | Churn risk banding | NO | additional occurrence of churn 0.7/0.4 cluster | MEDIUM
sd/CommunicationsTab.tsx:117 | `nps.score>=50` Ajoyib band | NPS grade threshold | NO | additional occurrence of NPS/marketing cluster | LOW
director/ModuleHealthGrid.tsx:47,61 & camera-ai.types.tsx:180 & recruiting/helpers-atoms.tsx:126 | health/score `>=80/>=50` (and 60) color grades | Generic score-color grade thresholds | NO | 3 | LOW
AddDisciplineDialog.tsx:121-123 | warning/penalty/reward | Discipline action taxonomy | NO | 1 | MEDIUM
AddQuestionDialog.tsx:125-141 | question type mcq/open/practice; difficulty easy/medium/hard | LMS question/difficulty taxonomy | NO | 1 | LOW
AddAttendanceDialog.tsx:142-145 | present/absent/leave/sick | Attendance status taxonomy | NO | 1 | LOW


---

## FE pos-monitor / lib / hooks / constants

Coverage log (HONEST — read fully = "opened"; the rest scanned via Grep):
- pos-monitor | 63 | 5 | 8  (opened: PosMovementKirimTypes, PosMovementChiqimTypes, PosMovements.types, useOfflineSync[skim], pos-monitor.api[grep]; rest grep-scanned — api wrappers + pages, no new thresholds surfaced)
- lib | 70 | 6 | 6  (opened: format, business-logic, permissions, constants, sd-helpers, workerType; tests & api/* grep-scanned)
- hooks | 75 | 4 | 4  (opened: use-hr-payroll, useGofrConversion, use-role-menus, usePermissions; ~40 test files skipped, others grep-scanned; useKanbanBoard grep-scanned — WIP_LIMITS/DEADLINE_COLUMNS live in pages/kanban, OUT of scope)
- constants | 1 | 1 | 1
- config | 1 | 1 | 1
- routes | 14 | 1 | 1  (opened: roleConstants; route-tree files grep-scanned)

NOTE: some clusters are ALREADY documented (POS movement enums, quarantine RM-MAIN/QC-HOLD, role-array case drift). Those are listed below only as NEW file:line "additional occurrences" per instructions, not as fresh clusters.

| File:line | Value/constant | Business meaning | Config table? | Dup count | Severity |
|---|---|---|---|---|---|
| lib/business-logic.ts:48-49 | ZVS_LEVEL1_THRESHOLD=500_000, ZVS_LEVEL2_THRESHOLD=5_000_000 | Expense (ZVS) approval-tier thresholds — decide how many approvals a spend needs | NO (approval-tier config missing) | 1 | HIGH |
| lib/business-logic.ts:61-65 | ZVS_APPROVERS = {1:[9 roles],2:[7],3:[5]} | Which roles may approve each expense tier — financial approval authority hardcoded in FE | NO (roles enum only) | 1 | HIGH |
| lib/business-logic.ts:37-41 | calcCompanyState 110 / 80 / 60 | GROWTH/NORMAL/RISK/CRITICAL company-state cutoffs on perf ratio | NO | 1 | MEDIUM |
| lib/workerType.ts:94-119 | motivation===3\|\|4, toolPct>=50, avg>=7, toolPct<30, toolPct<20&&avg<4, avg<5 | HR personnel classification (FLAGMAN/PROTSESSNIK/TRABLDAYKER) — full rule engine of thresholds in FE | NO | 1 | HIGH |
| lib/workerType.ts:51-52 | syndrome: i<-30&&j<-30, g<-30&&c<-30 | "Trabldayker" psych-test syndrome cutoffs (auto-flags employee as harmful) | NO | 1 | HIGH |
| lib/workerType.ts:24-42 | desc strings "5-17%", "5%", "80% natija" | Population/impact percentages baked into labels | NO | 1 | LOW |
| pos-monitor/pages/PosMovementKirimTypes.ts:208-216 | BATCH_PREFIX_MAP (26 material-type→prefix pairs: RAW_MATERIAL→RM, QOGOZ→PAPER…) | Material-type taxonomy → batch-number prefix; drives lot codes | NO (material_type dictionary) | 1 | MEDIUM |
| pos-monitor/pages/PosMovementKirimTypes.ts:85-205 | KIRIM_CONFIG keyed by 12 warehouse-type codes (QC-HOLD,RM-MAIN,RM-ROLLS,FG-MAIN,WIP-MAIN,SCRAP-MAIN,TOOL-MAIN,MRO-MAIN,MRO-STORE,WASTE_IN,PARTIAL_RECEIPT,CUSTOMER_MATERIAL) | Per-warehouse-type intake form rules (supplierRequired, showCurrency…) | YES: warehouse_types (extended taxonomy not in DB) | additional occ. of RM-MAIN/QC-HOLD cluster | MEDIUM |
| pos-monitor/pages/PosMovementKirimTypes.ts:34 | z.enum(["UZS","USD","EUR"]) | Allowed currencies for intake docs | YES: exchange_rates (empty) | 3 (also PosMovementKirim.tsx:35, PosMaterialNew.tsx:63, format.ts:68 default) | LOW |
| pos-monitor/pages/PosMovementChiqimTypes.ts:138-144 | CHIQIM_REASONS [PRODUCTION,ORDER,DEPARTMENT,SALE,OTHER] | Outbound-movement reason catalog written to BE notes/returnReason | NO (movement-reason config missing) | 1 | MEDIUM |
| pos-monitor/pages/PosMovementChiqimTypes.ts:19-35 | MovementTypeCode / CHIQIM_ALLOWED_TYPES enums | Outbound movement types (EXTERNAL_OUT default) | YES: pos_movement_types | additional occ. of POS movement-enum cluster | MEDIUM |
| pos-monitor/pages/PosMovements.types.ts:107-126 | getMovementAction() state machine: draft→pending→qc_pending→qc_approved→pending→approved→completed | Movement approval/QC workflow transitions hardcoded in FE (should be workflow-config driven) | YES: workflow_rules / document_workflow_routes | 1 | MEDIUM |
| pos-monitor/pages/PosMovements.types.ts:24-39 | STATUS_CFG (11 statuses → tab bucket new/process/done) | Movement status taxonomy + workflow-lane mapping | NO | 1 | MEDIUM |
| pos-monitor/pages/PosMovements.types.ts:41-105 | TYPE_ICON/TYPE_LABEL/TYPE_BADGE/TYPE_LIST (14 movement types) | Movement-type display taxonomy | YES: pos_movement_types | additional occ. of POS movement-enum cluster | LOW |
| lib/sd-helpers.ts:26-32 | ORDER_STATUS_LABELS (13 SD order-lifecycle statuses new→…→closed/cancelled) | SD sales-order lifecycle taxonomy | NO | 1 | MEDIUM |
| lib/sd-helpers.ts:9-58 | SEGMENT/LEAD_STATUS/PAYMENT/SOURCE/QUOT_STATUS label+color maps | CRM/SD status & segment display taxonomies | NO (LEAD won/lost overlaps CRM win/loss cluster) | additional occ. of CRM status cluster | LOW |
| lib/permissions.ts:91-310 | ROLE_PERMISSIONS (50+ roles → permission arrays) | Entire FE RBAC role→permission matrix hardcoded (file documents deliberate "frozen static, not DB-driven") | YES: roles enum (perms not tabled) | related to role-array cluster | MEDIUM |
| routes/roleConstants.ts:6-27 | 17 role arrays (HR_ROLES, FINANCE_ROLES, WAREHOUSE_ROLES…) | Route-guard role membership lists | YES: roles enum | additional occ. of role-array case-drift cluster | MEDIUM |
| hooks/use-role-menus.ts:21-89 | ROLE_MODULE_MAP (30+ roles → URL-prefix arrays) | Fallback RBAC: which sidebar/URL prefixes each role sees | YES: roles + menus DB (this is only the fallback) | related to role-array cluster | MEDIUM |
| hooks/usePermissions.ts:26-95 | ACTION_TO_LEVEL, MODULE_ALIAS, LEVEL_HIERARCHY, ROLE_ALIASES | RBAC mapping tables (role normalization incl super_admin/superadmin, module aliasing, level hierarchy) | YES: roles enum | additional occ. of role-array case-drift cluster | LOW |
| config/module-status.ts:26-137 | APP_VERSION '2.0.1', LAST_UPDATED, MODULE_STATUS[] with per-module status+lastVerified dates | Dev-facing module readiness registry hand-maintained in code (should be derived, not literal) | NO | 1 | LOW |
| lib/format.ts:68 | currency default = "UZS", locale "uz-UZ" (formatCurrency/fmtMoney) | Base currency hardcoded (documented rationale; blocks multi-currency) | YES: exchange_rates (empty) | part of currency cluster above | LOW |

Notes:
- workerType.ts is the strongest NEW find: a complete HR classification engine (worker "type" that feeds personnel decisions) with ~10 magic thresholds and psych-test syndrome cutoffs, entirely FE-side, no config source.
- business-logic.ts ZVS tier + approver arrays are a genuine financial-approval rule set living in the browser bundle (FE-only; backend authority assumed but the tier maths is duplicated here).
- Excluded as non-business per instructions: lib/constants.ts (pagination/cache/UI px/timeouts, CURRENCY_DECIMAL_PLACES=2 rounding), playBeep 880/220Hz audio, fmtMoney/formatMoney K/M/B abbreviation math, constants/status.ts color maps + ABC/PIE colors (ABC dedup'd), all *.test.ts, pos-monitor.api.ts (pure HTTP wrappers), use-hr-payroll.ts (pure API hooks). KanbanColumn WIP_LIMITS / kanban-types DEADLINE_COLUMNS are real magic-config but live under pages/kanban (out of my scope).


---

## 4. Updated Top 10 highest-severity (v1 + v2 combined, re-ranked)

Ranked by blast radius — money/approval/security/safety first, with drift multiplying severity.

1. **Payroll-tax truths disagree in THREE places** — FE `basePay*0.10` (v1 #1, `CalculationsTab.tsx:29`) vs BE controller `TAX_RATE=12, PENSION_RATE=8` (`finance/presentation/payroll-periods.controller.ts:68`) vs domain `JSHD=1%`. Every payslip can be computed against a different rate. **HIGH+drift.**
2. **Hardcoded FX rates served live while `exchange_rates` table sits empty** (`common/constants/app.constants.ts:121-123` USD=12700/EUR=13800/CNY=1750). All multi-currency conversion uses a stale baked-in rate. **HIGH.**
3. **Fabricated financial data returned as real** — AR overdue `total*0.3` (`financial-reports-query.helpers.ts:101`), warehouse occupancy `72.5`, AI-planning confidence/metrics invented, OEE components faked. Numbers that look computed but aren't. **HIGH (money + trust).**
4. **Approval/authority thresholds hardcoded, several in the browser bundle** — ZVS expense tiers `500k/5M` + approver role arrays in `lib/business-logic.ts:48`, PO ceiling `PO_MAX_AMOUNT_UZS=50M` (`app.constants.ts:126`), inventory auto-adjust vs escalate `≤2/≤5` (`barcode-warehouse.service.ts:32`), rush-order feasibility `70/40` (`RushOrderPage.tsx:33`). **HIGH.**
5. **Two disagreeing GL account-code maps** for the same POS movements (`pos-gl-auto.service.ts:31` vs `auto-gl-posting.service.ts` GL_ACCOUNTS). Wrong ledger account depending on path. **HIGH+drift.**
6. **Auto-decision gates with no human/config** — AI auto-REJECT candidate `score<30` (`ai-automation.service.ts:84`), `HIGH_STAKE_TOOLS` approval-bypass set hardcoded (`aisha-conversation.service.ts:20`), FMEA RPN stop-production `>200` (`qc.constants.ts:11`), sensor anomaly flat `>90` ignoring per-sensor columns (`record-sensor-reading.handler.ts:67`). **HIGH (safety).**
7. **Security thresholds hardcoded/duplicated** — account lockout `>=5` in two independent literals (`drizzle-auth.repo.ts:202` + `login.service.ts:187`); ERP privilege role assigned by magic `positionId` ranges (`employees-org-assignment.helper.ts:121`). **HIGH (security).**
8. **Three divergent role/permission catalogs** — `auth/enums/role.enum.ts` (16 UPPERCASE) vs `admin/.../user.aggregate.ts` (5 lowercase) vs `admin-extra.service.getRoles()` (8 + permissions). Plus ~60 controllers' `@Roles` case-drift (v1 #10) → dead guards. **HIGH (authorization).**
9. **EOQ economics baked in, driving auto-purchase-order quantities** — ordering-cost `50000/150000`, holding-cost `0.20/0.25/0.30`, HITL `50M` (`mrp-run-eoq.helper.ts:43`, `wms-eoq.service.ts:55-60`, duplicated). Code comment admits the config columns don't exist. **HIGH.**
10. **3-way-match / GL tolerances hardcoded despite config existing** — POS `5%` tolerance while `pos_variance_config` table exists and is used elsewhere (`three-way-match.service.ts:14`); `remaining/three-way-match.service.ts:18` `0.05`; GL `0.01` in 4 files (v1 #2). Payment-blocking gates. **HIGH+drift.**

*(Runner-up HIGH clusters: SD price engine markup35/VAT12 fallbacks + advance-70 gate; `ai-agents.constants.ts` ~25 credit/pricing/approval thresholds; `cfo-risk.service.ts` whole risk engine; late-arrival-fine cron 50k+5k/min; company health-state UZS bands; camera penalty 50000; FineDialog/OvertimeDialog/depreciation-method FE payroll constants.)*

---

## 5. Updated duplication clusters (3+ files — highest drift risk; grew after full sweep)

1. **Role/permission arrays** — now confirmed across **~70+ backend controllers + ~6 FE files** (`lib/permissions.ts`, `routes/roleConstants.ts`, `use-role-menus.ts`, `usePermissions.ts`) + 3 divergent BE role catalogs. Largest and most security-relevant.
2. **OEE band thresholds (`85/70`, plus `0.65/80/85` variants)** — `oee-calculator.service.ts`, `drizzle-iot-oee.repo.ts`, + FE `MESExtended`, `IoTExtendedSections`, `ERPDashboardTab`, `MachineOperatorTab*` (≥8 sites, **inconsistent cutoffs**).
3. **Pass-score `70`** — LMS `passing_score ?? 70` in **8 backend sites** + FE `AttemptsPage`, exam pages.
4. **Lead-scoring formulas** — **4+ parallel implementations** (`lead-scorer.service`, `lead-scorer-v2`, `crm-ai.service` ×2 inline) with different weights.
5. **AI neutral fallback `score:50`/`WARM`** (v1 cluster) — grew to **10+ backend occurrences** + FE `EntityCard.tsx:53`.
6. **Order/sales lifecycle state machines** — hardcoded in `order-status.vo.ts`, `orders.constants.ts`, `sales-order-transitions.constants.ts`, `remaining/order-status.service.ts`, FE `OrderStatusPage`, `PosMovements.types.ts` (≥6 divergent copies; `workflow_rules` table exists).
7. **Downtime reason taxonomy** — BE `downtime-event.aggregate.ts` + FE `MESDowntimes`/`ERPDowntimeTab`/IoT (config table `mes_downtime_reasons` exists / `downtime_reason_codes` empty).
8. **Material-type taxonomy** — 3 divergent FE copies (`WMSMaterials.CATEGORIES`, `RulonCards.ROLL_TYPES`, `WASTE_TYPES.MATERIAL_TYPES`) + `BATCH_PREFIX_MAP` (26 types).
9. **EOQ cost constants** — `wms-eoq.service` + `eoq-calculator.service` + `mrp-run-eoq.helper` (3 files).
10. **GL balance tolerance `0.01`** (v1 #2) — 4 finance/order files.
11. **48-hour SLA** — CC force-reject cron + kanban inbox + WMS requisition window + POS quarantine (≥4 files).

---

## 6. Final completeness statement

- **Files in codebase:** 4442 (2722 backend + 1720 frontend).
- **Files opened and read line-by-line this pass:** ~663 (**~15%**), deliberately weighted to the business-logic-bearing files.
- **Files pattern-scanned (grep) within their module:** effectively all (~100% of modules swept).
- **New findings:** ~578 (additive to v1's 30 → ~608 total documented).
- **Modules skipped:** none.
- **This is NOT a 100% line-by-line audit.** A stray constant in the un-opened ~85% of (mostly low-signal) files could remain undiscovered. For true exhaustiveness, a follow-up pass would need to open the remaining DTO/controller/UI-render files — but the marginal yield is expected to be low, since magic values concentrate in the services/constants/taxonomy files already fully read.

*Investigation only — nothing modified. Awaiting owner prioritization (recommend starting with the Top 10, especially the payroll-tax and FX-rate drift, which are silently producing wrong money numbers today).*
