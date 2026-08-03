# EuroPrint ERP — Hardcoded Magic Number / Magic String Audit

**Date:** 2026-07-05
**Type:** Read-only investigation (code + live DB). Nothing modified.
**Live DB:** native postgres `localhost:5432` (populated dev DB).
**Excluded as already-documented:** `HitlDocumentType` enum + `HITL_THRESHOLDS` constants (SAP-CONFORMANCE-CHECK.md principle 6). CLAUDE.md Qoida-12's magic-number list is partly stale (`depreciation.service.ts` now uses `MONTHS_PER_YEAR`; `sd-quotations.service.ts` VAT/markup come from params — both OK, not re-reported).
**Note on `business.constants.ts`:** the project centralizes many business constants there (named, no drift) — those are reported as MEDIUM "centralized but deploy-to-change," while **scattered inline literals** (drift risk) rank higher.

---

## Findings table

| # | File:line | Value/constant | Business meaning | Config table available? | Dup count | Severity |
|---|-----------|----------------|------------------|-------------------------|-----------|----------|
| 1 | `artifacts/…/pages/payroll/CalculationsTab.tsx:29` | `basePay * 0.10` | Expected payroll deduction rate; drift >1% flags rows red | **NO** — and **contradicts** backend `INCOME_TAX_RATE=0.12` | 1 (but mismatched w/ BE) | **HIGH** |
| 2 | `finance/domain/services/gl-posting.service.ts:154`; `finance/fi/fi.service.ts:178`; `finance/application/finance-accounting.service.ts:197`; `order-workflow/…/create-payment-plan.handler.ts:48` | `> 0.01` | GL debit/credit balance tolerance | NO (should be `GL_BALANCE_TOLERANCE`) | **4 files** | **HIGH** |
| 3 | `hr/domain/aggregates/leave-request.aggregate.ts:32` | enum `annual/sick/maternity/unpaid/study` | Leave types (drives balances/approval) | **YES: `leave_types` (5 rows)** — and **DRIFTED**: enum has `study`∉table, table has `compassion`∉enum | 1 enum | **HIGH** |
| 4 | `pos/application/services/quarantine-workflow.service.ts:107-108` | `w.code === 'RM-MAIN'`, `=== 'QC-HOLD'` | Quarantine/QC-hold warehouse routing by literal code | NO (warehouse rows exist, no config key) | 2 | **HIGH** (safety/quarantine) |
| 5 | `qc/application/qc-extended.service.ts:66` | `defects/total > 0.05` | 5% defect rate auto-fails a lot | NO (`qc_defect_severity_weights` is severity, not accept-rate) | 1 | **HIGH** (quality gate) |
| 6 | `artifacts/…/pages/AccountsReceivableSections.tsx:19-24` + `AccountsPayableSections.tsx:19-24` | `days > 90 / 60 / 30` | AR/AP aging buckets (overdue urgency/collections) | NO (should be `aging_bucket_config`) | **2 files (identical)** | **HIGH** (money) |
| 7 | `artifacts/…/pages/OrderApprovalWorkflowTypes.ts:60-65` | `STAGES = design→technical→qc→finance` | Order approval chain (4 fixed stages) | Partial (`workflow_rules` exists but not used here) | 1 | **HIGH** (approval chain) |
| 8 | `common/constants/business.constants.ts:157,228,365` | `LARGE_TX_THRESHOLD_UZS=50M`, `VIP_REVENUE_THRESHOLD_UZS=100M`, `POS_NIGHT_LARGE_VALUE_THRESHOLD=50M` | Large-tx / VIP / night-fraud money thresholds | NO (needs a `business_thresholds` table) | centralized | **HIGH** (financial/fraud) |
| 9 | `pos/dto/movement-enums.ts:6-20,82-144` | enum `MovementTypeCode` + category/stockSign map | POS movement taxonomy | **YES: `pos_movement_types` (11 rows)** — DRIFTED (`INVENTORY_ADJ_PLUS/MINUS` in code vs `INVENTORY_ADJUST` in DB; workaround literal at `:131`) | ~13 codes | **MEDIUM-HIGH** |
| 10 | ~60 `*/presentation/*.controller.ts` `@Roles([...])` (e.g. `wms-warehouse-gateway.controller.ts:51`) | `'ERP_MANAGER'`, `'SUPER_ADMIN'` (uppercase) | Authorization role names | YES (`users.role` enum) — **case drift**: live enum is `super_admin/director/manager` (lowercase) → those guards are **dead** | ~60 files | **HIGH** (authorization) |
| 11 | `crm/analytics/churn.service.ts:93,154`; `sd/…/customer-360.builder.ts:153`; `customer-360.helpers.ts:132` | `0.7 / 0.4` (and `>=70/>=40/>60`) | Churn HIGH/MED/LOW cutoffs | NO (sibling `crm-ai-extended.service.ts:278` uses `CHURN_*` consts — proves drift) | ~4 sites (2 exact) | MEDIUM |
| 12 | `ai/services/crm-ai.service.ts:36,43,81,88,124,131`; `marketing-ai.service.ts:149,158`; `hr-ai.service.ts:116`; `crm-auto-lead.service.ts:24` | `score:50` / `WARM` / `NEUTRAL` | Neutral AI fallback presented as data | NO | **10 occ / 4 files** | MEDIUM |
| 13 | `crm/analytics/kmeans.service.ts:50-54` | `0.7/0.6/0.5/0.4/0.3` | RFM segment cut-points (Champions/Loyal/At-Risk/New/Lost) | NO | 1 | MEDIUM |
| 14 | `wms/analytics/abc-xyz.service.ts:184-185` | `0.25 / 0.50` | ABC-XYZ variability class (X/Y/Z) | NO | 1 | MEDIUM |
| 15 | `director/approvals/approvals.service.ts:21` | `EMPLOYEE_TARDINESS_MINUTES: 60` | Tardiness gate for approval routing (overlaps HR `ATTENDANCE_LATE_GRACE_MINUTES=15`) | NO | 1 (conflicts w/ 15) | MEDIUM |
| 16 | `finance/finance-extended/finance-extended-payroll.service.ts:350,377` | `60 / 90 / 50` | Payroll confidence values presented as data | NO | 1 | MEDIUM |
| 17 | `crm/application/commands/mark-deal-won.handler.ts:29-30` | `LOST_MARKERS`/`WON_MARKERS` string arrays | CRM terminal win/loss detection on free-form `stage_id` | Partial (funnel stages in DB) | 1 | MEDIUM |
| 18 | `artifacts/…/pages/MESDowntimes.tsx:48-62` + `erp/ERPDowntimeTab.tsx:219-222,319-321` | `REASON_LABELS` (14 codes) vs 5 codes | Downtime reason taxonomy (drives MES/OEE) | **YES: `downtime_reason_codes`** (live = **0 rows**, needs seed) — and FE copies **DIVERGED** (14 vs 5) | **3+ places** | **HIGH** (operational) |
| 19 | `artifacts/…/pages/camera-quality.tsx:49-57,59-62` | `defectTypeLabels` (7) + `actionLabels` (3) | Defect type + QC disposition taxonomy | **YES: `defect_catalog` (23 rows)** | ~59 files ref codes | **HIGH** (QC) |
| 20 | `artifacts/…/components/wms/MaterialDialog.tsx:106-107` | `categories`(8) + `units`(10) | Material category + unit-of-measure lists | Units: **YES `unit_of_measures` (19 rows)**; categories: NO | 1 | MEDIUM |
| 21 | `artifacts/…/pages/GoalsKPITypes.ts:23-35` | `PRIORITIES`(4) + `STATUS_OPTIONS`(4) | Priority/status taxonomy (repeated CRM/kanban) | NO (candidate `priority_levels`) | multi-module | MEDIUM |
| 22 | `artifacts/…/pages/kanban/RobotsDialog.tsx:79-91` | `triggerTypes`(4) + `actionTypes`(4) | Automation-rule taxonomy (backend must implement each) | NO | 1 | LOW-MED |
| 23 | `common/constants/business.constants.ts:204,207-208` | `COMMISSION_RATE=0.05`, `BULK_DISCOUNT_*` | Sales commission + bulk-discount rates | NO (needs pricing config) | centralized | MEDIUM |
| 24 | `mm` `MM_THREE_WAY_MATCH_TOLERANCE=0.02` (business.constants) | `0.02` | 3-way-match tolerance | NO | centralized | MEDIUM |
| 25 | `common/constants/business.constants.ts:316,318,320` | `DISCIPLINE_LATE_*=3/5/8` | HR discipline escalation thresholds | NO | centralized | MEDIUM |
| 26 | `pp/application/services/pp-intelligence.service.ts:313` | `t1Minutes:60, rate:0.80` | Learning-curve fallback when no row | NO | 1 | LOW |
| 27 | `hr/analytics/utilization.service.ts:62`; `hr/career-path/career-path.service.ts:120`; `qc/application/qc-parameters.service.ts:99` | `*1.1`, `*1.2 && <80`, `0.8/0.5` | Heuristic coefficients | NO | 3 files | LOW |
| 28 | `compatibility/saas.service.ts:95` | `thirtyDays * 0.8` | Trial-expiry alert at 80% | NO | 1 | LOW |
| 29 | `artifacts/…/analytics/RemainingTabsUsers.tsx:197`; `RemainingTabsB.tsx:261`; `RecruiterKPIPageCards.tsx:24` | `*0.15`, `*0.10`, `*0.1` | Conversion/target ratios driving KPIs | NO | 3 files | LOW-MED |
| 30 | `communication-center/…/cc-org-resolver.service.ts:55-59` | `'CEO'/'DIRECTOR'/'DEPT_HEAD'` | Approver-strategy keys | `workflow_rules` exists (acceptable resolver pattern) | 1 | LOW |

---

## Top 10 highest-severity findings (financial / approval / safety first)

1. **#1 Payroll FE deduction `0.10` contradicts backend `INCOME_TAX_RATE=0.12`** (`CalculationsTab.tsx:29`) — a money constant hardcoded in the FE that **disagrees** with the backend rate; every payroll row is validated against the wrong number.
2. **#2 GL balance tolerance `0.01` in 4 separate ledger files** — the single most-duplicated money constant; change it in one engine and the others silently diverge.
3. **#10 Role-name case drift → dead `@Roles` guards** (~60 controllers) — `'ERP_MANAGER'`/`'SUPER_ADMIN'` don't exist in the live lowercase enum, so those authorization checks never match (security-relevant).
4. **#3 `LeaveType` enum has already DRIFTED from the `leave_types` table** — enum/table disagree on `study` vs `compassion`; a real config table exists and isn't used.
5. **#8 Large-tx / VIP / night-fraud thresholds (50M/100M/50M)** hardcoded in `business.constants.ts` — approval and fraud gates a business owner would reasonably tune without a deploy.
6. **#4 Quarantine routing on literal warehouse codes `RM-MAIN`/`QC-HOLD`** — a rename/re-config silently breaks the quarantine safety flow.
7. **#5 QC lot auto-fail at `> 0.05`** — a quality accept/reject gate baked into code, no config.
8. **#6 AR/AP aging buckets `90/60/30`** duplicated across two files — drives overdue-money escalation/coloring.
9. **#7 Order approval pipeline hardcoded (4 stages)** — the money-approval chain can't be reconfigured; a `workflow_rules` mechanism exists elsewhere.
10. **#18 Downtime reason taxonomy diverged (14 vs 5 codes)** across MES/ERP/IoT screens — already inconsistent, and the `downtime_reason_codes` table is empty.

---

## Quick-win (config table already exists — just wire it) vs Needs-new-schema

### QUICK-WIN — config table exists, code should read from it
- **#3 `LeaveType` → `leave_types` (5 rows).** Reconcile drift + read from table.
- **#9 `MovementTypeCode` / POS movement code branches → `pos_movement_types` (11 rows).** Fix `INVENTORY_ADJUST` drift.
- **#19 Defect types (FE camera-quality, ~59 refs) → `defect_catalog` (23 rows).**
- **#20 Material units (FE MaterialDialog) → `unit_of_measures` (19 rows).**
- **#10 Role arrays → align with the live `users.role` enum** (fix case, kill dead guards).
- **#18 Downtime reasons → `downtime_reason_codes`** — table EXISTS but is **empty (0 rows)**; seed it first, then wire the 3 diverged FE copies.

### NEEDS-NEW-SCHEMA — no config mechanism exists yet
- **#2 GL tolerance**, **#5 QC lot accept-rate**, **#11 churn / #13 RFM / #14 ABC-XYZ analytics thresholds**, **#6 AR/AP aging buckets**, **#7 order approval stages** (or extend `workflow_rules`), **#8/#23/#24/#25 financial thresholds & rates** (commission, bulk-discount, 3-way tolerance, discipline, large-tx/VIP/night) → a `business_thresholds`/`business_rules` config table, **#21 priority levels**, **#20 material categories**, **#4 quarantine warehouse routing** (a settings lookup). **Data prereq: `exchange_rates` is empty (0 rows)** — multi-currency GL relies on a rate passed in per call (`cashier-hub.service.ts:389`).

---

## Duplication clusters (same magic value hardcoded in 3+ places — highest drift risk)

1. **Role-name arrays** — ~60 controllers hardcode `@Roles([...])` sets, with several referencing non-existent uppercase roles (dead guards). **Highest count.**
2. **Defect type codes** — sourced in `camera-quality.tsx`, referenced across **~59 files**.
3. **Neutral AI fallback `score:50`** — **10 occurrences across 4 AI services** (`crm-ai`, `marketing-ai`, `hr-ai`, `crm-auto-lead`).
4. **GL balance tolerance `0.01`** — **4 finance/order files** (ledger integrity — the most dangerous drift).
5. **Churn cutoffs `0.7/0.4`** — ~4 sites (2 exact), while a sibling service uses the named constant (proof of live drift).
6. **POS movement code literals** — ~9 occurrences in `pos-movement.service.ts` + status service.
7. **Downtime reasons** — MES + ERP + IoT (3+ copies, already diverged 14 vs 5).
8. **AR/AP aging buckets `90/60/30`** — 2 identical FE files (money urgency).
9. **Priority levels (4)** — repeated across GoalsKPI, CRM, kanban components.

*Investigation only — nothing changed. Awaiting owner prioritization.*
