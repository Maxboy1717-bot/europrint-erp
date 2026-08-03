# EuroPrint ERP — Full Org-Chart-Based Permission Readiness Audit (read-only, whole project)

**Date:** 2026-07-06
**Question:** Is the org chart (`org_departments`, `employee_cards`, `org_functions`, `employee_org_departments`) ready *today* to derive Separation-of-Duties (maker/checker) and general authorization from **org-chart structure** — across the **whole system**, not just finance?
**Method:** Live read-only queries (`_audit/q.cjs`) + a per-module `@Roles` census. **Analysis only — no design, no code, no data change.**

> **One-line answer: NO module is ready today, and the blocker is uniform and structural.** Members and department heads live in **two disconnected card layers**: all 31 employees sit on `department` cards that have **no head and never reach one up the hierarchy (0/18)**, while every head sits on a separate `director`/`section` card with **zero members**. Worse, the membership table the existing working auth-gates actually read (`employee_org_departments`) is **30/31 empty of `employee_id`**, and `employees.manager_id` is **0/31** — so every approver-resolution path is data-dead. The *mechanism* exists and is proven (POS procurement + CC document approval gates), but it currently resolves to nothing for real employees.

---

## Part A — Org-chart structural readiness

| # | Question | Answer | Evidence (live) |
|---|----------|--------|-----------------|
| A1 | Department-card inventory + head fill-rate | **143 cards total.** By `node_type`: position 93, department 18, otdeleniye 14, director 11, section 5, ceo 1, owner 1. **19 cards have ≥1 employee** (via `employees.org_department_id`). **18/143 have `head_user_id` (12.6%)** — unchanged from the prior ~18/145 finding. Heads exist only on `director`(11/11), `section`(5/5), `ceo`(1/1), `owner`(1/1); **`department` 0/18 and `otdeleniye` 0/14 have a head.** | `count(head_user_id)=18/143`; by-type counts; `count(distinct org_department_id)=19` from employees. |
| A2 | Hierarchy fallback resolvability | **Broken.** Of the 18 **member-bearing** department cards, **0 reach a head anywhere up their `parent_id` chain** (recursive, depth ≤10). The head-bearing `director`/`section` cards are in a **separate, disconnected subtree** from the member-bearing `department` cards. Overall, of 37 dept/otdeleniye/section nodes only 12 resolve to a head (those 12 are the head-cards themselves); **25 are unresolvable**, and **every card that actually has employees is among the unresolvable**. | Recursive `parent_id` chain from each member card → `reaches_head=0` for all 18. |
| A3 | Card-membership data quality | **0 orphaned employees** (all 31 have `org_department_id`); **0 multi-card** (each has exactly one active `employee_cards` row). **BUT membership is recorded in THREE disagreeing tables:** (1) `employees.org_department_id` — 31/31, points to **headless `department` cards** (44–61); (2) `employee_cards.card_id` — 31/31, points to **`position` cards** (e.g. 71 "Bosh Buxgalter") and **disagrees with (1) for 30/31 employees**; (3) `employee_org_departments` — 31 rows but **30 have `employee_id = NULL`** (1 usable), and points to the **head-bearing `director`/`section` layer**. `employees.manager_id` is **0/31 filled**. | `agree=1 / disagree=30`; `employee_org_departments non_null_emp=1/31`; `manager_id with_mgr=0/31`. |
| A4 | Can existing auth code answer "user ∈ dept Y?" / "is head of Y?" live? | **Not in the guards; yes in two service-layer gates, but both are data-disabled.** No guard resolves membership/headship: `SodGuard` is permission-string based (non-functional), `PermissionGuard` reads `cardId` from the JWT but `org_departments` has no permission columns (`permission.guard.ts:24`), `RolesGuard` checks flat role claims. **Two real org-chart auth gates DO exist** — POS P2P procurement (`procurement-approval-chain.service.ts` + `procurement-request.service.ts:199` throws Forbidden if caller ≠ designated approver) and CC document approval (`cc-org-resolver.service.ts` + `cc-workflow-approve.helpers.ts:109` throws Forbidden if not the assigned approver). Both read `head_user_id`/`employee_org_departments`/`manager_id` — **all of which are empty/null for real employees today**, so both self-disable (ZVS's org-chain gate `zvs.service.ts:157` likewise degrades to `Ok(true)` when `head_user_id` is null). This logic is **not shared infrastructure** — each module rolled its own; a reusable "membership/head resolver" would need to be built once for all modules. | `permission.guard.ts:20-24,115`; `procurement-request.service.ts:199`; `cc-workflow-approve.helpers.ts:109`; `zvs.service.ts:157-184`. |

**Part A takeaway:** the org tree is duplicated into parallel layers (member `department` cards ╳ head `director`/`section` cards) that are not linked by `parent_id`; the three membership tables disagree and point at different layers; and the one membership table the working gates read is empty of employees. Every structural precondition for org-derived permissions is currently unmet.

---

## Part B — Per-module current authorization state

**Live role holders (the only ones that exist):** `super_admin` 3 · `director` 1 · `manager` 27 · `employee` 1. **Every specialized role below has 0 live holders** (`FINANCE_OFFICER`, `FINANCE_MANAGER`, `ACCOUNTANT`, `PAYROLL_OFFICER`, `HR_MANAGER`, `PURCHASER`, `PURCHASE_MANAGER`, `WAREHOUSE_KEEPER`, `WAREHOUSE_MANAGER`, `QC_MANAGER`, `QC_INSPECTOR`, `SALES_MANAGER`, `cashier`, `ceo`, `cfo`, `admin`, …). `RolesGuard` lowercases both sides, so casing is not the issue — the roles simply have no holders, so **both maker and checker collapse onto `super_admin`/`director`** (with `manager` satisfying only loosely-gated create sides).

| Module | Current flat role(s) — create → approve (file:line) | Live holders | Matching org-chart dept card? (member/head) | Existing org-derived pattern to copy? |
|---|---|---|---|---|
| **Finance/GL** | create `FINANCE_OFFICER`/`FINANCE_MANAGER`/`ACCOUNTANT` → approve `DIRECTOR, SUPER_ADMIN` (finance-payments:74/89; finance-main-actions:77/92 w/ SoD comment) | maker roles **0**; checker `director`1/`super_admin`3 | **Y** — dept 51 "Moliya" (1 mbr, no head) + 60 "Buxgalteriya" (2, no head); head on twin: director 26 head 47, section 27 head 48 | ZVS/procurement/CC (data-disabled) |
| **HR/payroll** | `PAYROLL_OFFICER, HR_MANAGER, DIRECTOR, SUPER_ADMIN` → `DIRECTOR, SUPER_ADMIN` (hr-payroll:48/63; closure:37 single-gate); bonus give `…MANAGER…` → approve (no MANAGER) hr-bonus:53/69 | `PAYROLL_OFFICER`/`HR_MANAGER` **0**; falls to `director`/`super_admin`; `manager`27 can create bonus | **Y** — dept 56 "Kadrlar bo'limi" (2, no head); head on twin director 21 (Madina); also 55 "O'qitish"(2), 59 "Yollash"(1) | same (data-disabled) |
| **MM/procurement** | PO create `PURCHASER, SUPER_ADMIN` → approve `PURCHASE_MANAGER, SUPER_ADMIN, DIRECTOR` (mm-purchase-orders:197/219); goods-receipt `MM_WRITE` mm-goods:61 | `PURCHASER`/`PURCHASE_MANAGER`/`mm_manager` **0** | **N** — **no procurement/Ta'minot/Xarid department card**; "Texnik ta'minot" (40/158 otdeleniye) is IT, **0 members, no head** | POS procurement gate exists but for POS P2P, not MM |
| **WMS/warehouse** | goods-issue/stock-adjust `WAREHOUSE_KEEPER, SUPER_ADMIN, DIRECTOR` (wms-goods-issue:59, wms-stock:54); warehouse create `SUPER_ADMIN, WAREHOUSE_MANAGER` (wms-warehouses:51) | `WAREHOUSE_KEEPER`/`WAREHOUSE_MANAGER` **0** | **Y** — dept 46 "Ombor" (2, no head); head on twin director 32 (Farrux) | same (data-disabled) |
| **POS/cashier** | POS uses `@RequirePermission('pos.*.approve')` (razryad→tier, not @Roles); cashier `CASHIER_ROLES=cashier, finance_manager, director, super_admin` (cashier-hub:20); salary-payout `…accountant, finance_manager…` | `cashier`/`finance_manager` **0**; POS perm via rbac-tier (separate) | **N** — **no Kassa/Kassir department card** (cashier nominally under Buxgalteriya) | **POS P2P procurement (procurement-request.service.ts:199) — the one fully-wired enforced gate**, but data-disabled |
| **QC/quality** | inspection `QC_INSPECTION_ROLES` (qc-inspections:44); defect `QC_MANAGER, PRODUCTION_MANAGER` → resolve `QC_MANAGER, SUPER_ADMIN` (qc-defects:108/125); several approve endpoints have **no method @Roles** | `QC_MANAGER`/`qc_specialist`/`qc_inspector` **0** | **Y** — dept 47 "Sifat nazorati" (2, no head); head on twin director 34 (Zarina) | same (data-disabled) |
| **SD/sales** | order create `SALES_MANAGER, DIRECTOR, SUPER_ADMIN, FINANCE_MANAGER` → confirm `DIRECTOR, SUPER_ADMIN` (sd-orders:54/183); quotation `SD_ROLES` (sd-quotations:61) | `SALES_MANAGER`/`SALES` **0** | **Y** — dept 45 "Sotuvlar" (3, no head); head on twin director 25 (Akmal) | same (data-disabled) |
| **Director/strategic** | ZVS class `admin,manager,supervisor,director,ceo,finance_manager` create → approve **no method @Roles** (service org-chain + approval-matrix) zvs.controller:35/58; approvals create `…` → approve `SUPER_ADMIN, DIRECTOR` (approvals:139/168); prikaz/protocol sign (coordination-docs) | `manager`27 create; `director`/`super_admin` approve; others 0 | Director layer itself: 11 `director` cards, all head-filled (0 members) + owner/ceo | **ZVS org-chain gate (zvs.repository.ts:110-152)** — exists, self-disables on null head |
| **Communication-Center** | draft/send broad class → approve/reject **no method @Roles** (PIN + workflow-assigned approver) cc-documents:74/191 | broad; real gate is org-resolver | Uses `org_departments` root head + `manager_id` + `employee_org_departments` | **CC approval gate (cc-org-resolver + cc-workflow-approve.helpers:109) — fully wired & enforced**, data-disabled |
| **MES/production** | No `@Roles`-gated production sign-off endpoint (completion via events/qc-decision) | n/a | **Y** — dept 52 "Ishlab chiqarish"(2) + shops 57/58/61; heads on twins director 28 + sections 29/30/31 | same (data-disabled) |
| **Marketing / Logistics / PR** | Marketing dept 50(2), Logistics "Yetkazib berish" 53(1), PR "PR va aloqalar" 48(1) — flat role-gated | mostly `manager`/`director` | **Y** — heads on twins: director 24 (Jasur), 33 (Olim), 35 (Nodir) | same (data-disabled) |
| **Order-workflow / CRM / IoT / Kanban** | flat `SUPER_ADMIN, DIRECTOR[, FINANCE]` / `crm_manager` / `production_manager, ERP_MANAGER` / hardcoded 4 live roles | specialized 0; live 4 apply where named | varies | visibility-only org usage (kanban/ai-fit), not auth gates |

---

## Overall readiness verdict

**No module can switch to org-chart-derived permissions today. The gap is uniform and structural, not per-module.** Every module fails on the same three data facts (Part A): (1) members sit on headless `department` cards that reach no head up-chain (0/18); (2) the membership table the working gates read (`employee_org_departments`) is 30/31 empty of `employee_id`, and `manager_id` is 0/31; (3) the tree is duplicated into disconnected member vs head layers.

**Relative distance (given a data reconciliation):**

- **CLOSEST — has both halves, needs linking/merging (10 modules):** Finance, HR, WMS, QC, SD, MES, Marketing, Logistics (Yetkazib berish), PR/Communications, and Training (O'qitish). Each already has **a member-bearing `department` card AND a head-bearing `director`/`section` twin for the same function** (e.g. Moliya dept 51 ╳ director 26; Ombor dept 46 ╳ director 32; Sifat dept 47 ╳ director 34; Sotuvlar dept 45 ╳ director 25). The head data already exists on the twin — the missing piece is *linking* the member card to the head (via `parent_id` or by filling the department's `head_user_id`) and *fixing* the membership source. These are reconciliation, not creation.
- **FARTHEST — a half is missing entirely (2 modules):** **MM/procurement** (no procurement/Ta'minot/Xarid department card with members — "Texnik ta'minot" is empty IT) and **POS/cashier** (no Kassa/Kassir card at all). These need a department card created and populated before any org-derived approach is even possible.
- **Special case — Director/CC:** the two modules whose gates are already *fully wired* to the org chart (Director ZVS, CC documents) are paradoxically also blocked — the code works, the data doesn't.

---

## Ranked list of missing owner-data (module by module)

**Systemic prerequisites (affect ALL modules — fix once):**
1. **Decide the canonical membership table** — `employees.org_department_id` (populated, points to member/department cards) vs `employee_cards.card_id` (populated, points to position cards) vs `employee_org_departments` (what the working gates read — but 30/31 rows have null `employee_id`). Today they disagree 30/31.
2. **Reconcile the duplicated tree** — merge the parallel `department` (member) and `director`/`section` (head) layers, or link them so a member card's `parent_id` chain reaches its function's head card. Currently 0/18 member cards reach any head.
3. **Provide the head for the member-bearing level** — either fill `head_user_id` on the 18 `department`/14 `otdeleniye` cards (currently 0%), or wire the hierarchy so the existing `director`-card heads become the resolvable fallback. (`manager_id` is also 0/31 if a manager-chain fallback is desired.)

**Per-module missing data (what must exist for that module specifically):**

| Rank | Module | Missing data (structural — not naming people) |
|---|---|---|
| 1 | **MM/procurement** | A procurement department card **does not exist** — must be created, given members, and given a head. Farthest from ready. |
| 2 | **POS/cashier** | A cashier department card **does not exist** — must be created, given members, and given a head. |
| 3 | **Finance** | Member cards 51/60 have **no head** and don't reach the head-bearing twins (director 26 / section 27); needs the member↔head link + canonical-membership decision. |
| 4 | **HR/payroll** | Member card 56 (+55/59) has **no head**; head exists on twin director 21 but is disconnected — needs linking. |
| 5 | **WMS** | Member card 46 "Ombor" has **no head**; head on twin director 32 disconnected — needs linking. |
| 6 | **QC** | Member card 47 "Sifat nazorati" has **no head**; head on twin director 34 disconnected — needs linking. |
| 7 | **SD/sales** | Member card 45 "Sotuvlar" has **no head**; head on twin director 25 disconnected — needs linking. |
| 8 | **MES/production** | Member cards 52/57/58/61 have **no head**; heads on twins (director 28, sections 29/30/31) disconnected — needs linking. |
| 9 | **Marketing / Logistics / PR / Training** | Member cards 50/53/48/55 have **no head**; heads on twins (director 24/33/35/23) disconnected — needs linking. |
| 10 | **Director / CC** | Gates already wired; missing only the **membership data** (`employee_org_departments.employee_id` is 30/31 null) so the wired gates can resolve a real employee. |

*(Per the rules, no specific person is suggested for any assignment; the report states only what structural data is absent. The heads already recorded on the `director`/`section` twin cards are reported as existing data, not as recommendations.)*

---

*Investigation only. No org-chart data or code was created, assigned, or modified. Live figures are read-only queries against `europrint` on 2026-07-06; reproduce with `node _audit/q.cjs "…"`. Cross-references: `docs/audit/FINANCE-SOD-ORGCHART-READINESS-2026-07-06.md`, `docs/audit/ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md` (#8), `docs/audit/TWO-WORLDS-FULL-AUDIT-2026-07-06.md` (positions/departments duplication). No design or fix proposed — readiness snapshot only.*
