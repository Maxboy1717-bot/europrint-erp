# Owner-Decision Queue — VISION-3340 Re-Triage Routing (2026-07-08)

**Purpose:** Route every remaining open item from `VISION-3340-RETRIAGE-2026-07-07.md`
into a clear, answerable question for the owner. Nothing in Parts 1–3 below is
executed until the owner responds. This doc is the full list; the board
(`MASTER-STATUS-BOARD-2026-07-06.md`) carries the one-line summary + pointer here.

Source of counts: `VISION-3340-RETRIAGE-2026-07-07.md` (365 distinct root causes across
20 areas: 65 fixable-now, 41 owner-data, 82 owner-decision, 177 skip-low-value).

---

## Part 0 — batch1 fix-workflow outcome (the true state)

Workflow `wf_1eee15f8-be1` ("vision-3340-fix-batch1", 43 clustered units for the 59
fixable items) **ran to `status: completed` but did NOT succeed on most units.** The
final `43/43 work-units processed` line counts *dispatched* units, not *implemented*
ones. Per the workflow's own log array:

- **9 units produced real, complete work** (non-empty reports): `01-pp-cancel-event`,
  `03-ai-invoice-classify-event`, `04-lms-mentor-rating`, `05-jwt-doc-fix`,
  `08-stat-reglament-approval`, `10-ai-daily-summary-telegram`,
  `11-iot-mes-director-query`, `18-oee-real-formula`, `19-sos-telegram`.
- **~34 units FAILED** with `You've hit your weekly limit · resets 9am (Asia/Tashkent)`.
  5 of those first `stalled (no progress) after ~1000s` and were killed on retry — so
  they left **partial, incomplete edits** in the shared working tree before dying
  (the workflow ran agents concurrently in ONE working dir, no worktree isolation).

**Commit status of the 9 successful units:**

| Unit | VISION-3340 # | Commit | One-item? | Test |
|---|---|---|---|---|
| 01-pp-cancel-event | #1 | `9f3f3e61` | yes | pp-planning.service.spec + trigger spec |
| 03-ai-invoice-classify-event | #3 | `0db81c59` | yes | finance-invoices.controller.ai-event.spec |
| 04-lms-mentor-rating | #4 | `5d112328` | yes | lms-misc.service.spec + additive migration |
| 05-jwt-doc-fix | #5 | `5500a0aa` | yes | doc-only (ARCHITECTURE.md), no test needed |
| 08-stat-reglament-approval | — | UNCOMMITTED | — | spec present, unverified |
| 10-ai-daily-summary-telegram | — | UNCOMMITTED | — | spec present, unverified |
| 11-iot-mes-director-query | — | UNCOMMITTED | — | spec present, unverified |
| 18-oee-real-formula | — | UNCOMMITTED | — | spec present, unverified |
| 19-sos-telegram | — | UNCOMMITTED | — | spec present, unverified |

**Working-tree hazard:** ~45 tracked-modified files + many untracked sit in the tree.
This is NOT a clean 9-unit diff — it also contains (a) partial fragments from the ~5
stalled-then-failed units, and (b) accumulated uncommitted work from *earlier* sessions
(June-30 vizyon wave: notification-schedules / hr-nda / qc-calibration; plus
question-bank, error-catalog). `tsc --noEmit` on apps/api is exit 0, but that does NOT
prove the partial fragments are complete or correct. **Do not bulk-commit this tree.**

**Recommended follow-up (execution, not owner-decision):**
1. Re-run the ~34 failed units after the weekly limit resets (9am Asia/Tashkent),
   ideally with `isolation: 'worktree'` so concurrent agents cannot race the same file.
2. Review + test + commit the 5 completed-but-uncommitted units (08/10/11/18/19),
   one commit per unit, each with its own passing test — before re-running the failed set.
3. Triage the pre-existing multi-session uncommitted accumulation separately.

---

## Part 1 — dead role-file deletion: ALREADY DONE (premise stale, no owner action)

The 2 files the M8 safety-classifier had flagged —
`apps/api/src/modules/auth/enums/role.enum.ts` and its barrel
`apps/api/src/modules/auth/types/role.ts` — **were already deleted inside the M8 commit
`5b68d53b`.** Fresh check (2026-07-08): neither exists on disk; zero live importers
(`grep` clean). `git log --diff-filter=D` confirms `5b68d53b` removed both.

That commit also fixed a real live bug (the deleted minority enum's `Role.WAREHOUSE`
value was silently locking real warehouse staff out of 2 SD golden-thread endpoints +
AiReservationController). Removed content: a 16-value UPPERCASE `enum Role {}` and a
6-line barrel re-export. **No yes/no needed — this item is closed.** The board's
"BLOCKED-OWNER-DECISION" flag on it was already corrected to DONE in `ac476cc0`.

---

## Part 2 — 6 schema-approval items (PENDING-OWNER-DECISION)

Excluded from the 43-unit workflow by design; each touches DB schema. **Ordered by
downstream blocking impact.** None touched until owner responds.

### 1. GL `entries.cost_center_id` (finding #21, SB0835) — Moliya/GL
- **Plain terms:** Add an optional "which cost center" tag column to the general-ledger
  posting table. Cost centers already exist as full master data, but today no accounting
  entry can be attached to one — so no cost-per-department / cost-per-center reporting
  is possible.
- **Why owner sign-off:** GL is an owner-protected area by project convention. The
  change is purely additive (nullable column, all existing callers keep working), but
  GL edits require explicit approval regardless.
- **Blocks downstream:** cost-center P&L, department cost attribution, energy→GL costing.

### 2. PP `pp_reason_codes` + `pp_shift_plans` tables (finding #23, SB0245/0246) — PP
- **Plain terms:** Two NEW tables. (a) A lookup list of standard "reason codes" so
  production-order reasons stop being free typed text. (b) A real shift-plan table so
  the AI shift-assignment step actually stores a plan instead of returning a hardcoded
  placeholder string.
- **Why owner sign-off:** creates new tables (workflow was forbidden to). Defines a new
  master-data vocabulary (reason codes) that is a business taxonomy decision.
- **Blocks downstream:** AI shift planning, PP analytics, reason-based rollups.

### 3. CRM `crm_deals.sales_order_id` type change varchar→integer + FK (finding #32, SB0667) — CRM
- **Plain terms:** The column that links a won deal to its sales order is stored as text
  but the sales-order id is a number, so a real database link (FK) can't exist and the
  two can silently drift. The column is 100% empty today, so converting it is safe now.
- **Why owner sign-off:** irreversible column-type migration (`ALTER COLUMN ... TYPE
  integer`); safe only because empty — needs confirmation nothing will populate it as
  text first.
- **Blocks downstream:** CRM→SD deal-to-order integrity (the golden thread's CRM entry).

### 4. CRM `crm_loss_reasons` lookup table + `crm_deals.lost_reason_id` (finding #31, SB0655/0663/0675) — CRM
- **Plain terms:** A NEW lookup table of standard "why we lost this deal" reasons, plus
  an optional link column on deals. Today the lost-reason is free text only, so no
  win/loss analytics can be rolled up.
- **Why owner sign-off:** creates a new table + defines a business taxonomy (the canonical
  set of loss reasons is an owner call).
- **Blocks downstream:** sales win/loss analytics, the `/api/crm/analytics/loss-reasons`
  rollup.

### 5. CRM `crm_stage_history` audit table (finding #34, SB0669) — CRM
- **Plain terms:** A NEW table recording every deal/lead stage change (from→to, who,
  when). Today handlers overwrite the stage in place with no history — no audit trail of
  how a deal moved through the funnel.
- **Why owner sign-off:** creates a new table; retention/audit policy is an owner call.
- **Blocks downstream:** funnel-velocity analytics, sales-process audit.

### 6. IoT tablet idempotency columns `tablet_id` + `local_seq_no` (finding #38, SB0459) — QC/IoT
- **Plain terms:** Add two optional columns to the tables behind the offline shop-floor
  tablet (defect / inline-QC / session start-stop / material-return) so a retried offline
  submission can be de-duplicated instead of inserted twice.
- **Why owner sign-off:** additive columns + a new unique index across several live QC
  tables; per Q-35 migration convention, schema adds need sign-off.
- **Blocks downstream:** reliable offline tablet sync (double-insert risk on retry).

---

## Part 3 — 123 owner-data + owner-decision items

Do not infer defaults for any of these, even where an earlier-precedent argument exists.
Precedents are flagged as suggestions only; the owner confirms applicability.

### 3.1 — 41 owner-DATA root causes, ranked by highest-leverage data-point

The pattern to exploit: one piece of owner-provided master data unblocks many downstream
mechanisms at once (like `head_user_id` did).

| Rank | Single data-point the owner would provide | # items unblocked | Modules |
|---|---|---|---|
| 1 | **Per-card attributes** (razryad_level_id, rbac_tier, salary_type/min/max, base_salary, otdeleniye_no) — fill each KARTA's master fields | 8 | Auth/RBAC, Moliya/GL, Org, HR, Xavfsizlik |
| 2 | **IoT/telemetry & camera hardware registry** (sensors, readings/alerts, camera_ai_configs, energy, shift-handover) | 6 | AI, IoT |
| 3 | **ЦКП/OKR/governance targets & config** (error_catalog rows, tskp_target/formula, OKR cascade linkage, council_members, workflow_rules) | 5 | CKP, Hisobot, Frontend |
| 4 | **card_id occupancy + operator-role users + stake_fraction/is_acting defaults** (note: employee_cards now 31/31; remainder is operator-role users + defaults) | 7 | IoT, Org, MES, Xavfsizlik, HR |
| 5 | **Org-chart manager/head linkage** (head_user_id ~13% filled; no manager_id column) — the classic high-leverage one | 3 | Auth/RBAC, Org, HR |
| 6 | **Customer/material master gaps** (customer segment/manager_id; material_layer_config/material_kind for corrugated) | 2 | Master-data |
| 7 | **PP capacity/work-center norma & dept linkage** (production_orders.org_department_id 0-filled; work_centers norma partial) | 2 | PP |
| 8 | **Vacancy tracking rows** (aging/SLA code ready, 0 rows) | 2 | Org, HR |
| 9 | **Adoption/transactional usage** of built pipelines (ckp_fact_values, razryad_requests/history, 70%-advance golden chain) | 3 | CKP, Razryad, Moliya |
| 10 | **LMS course→card binding** (courses.card_id 0/5) | 1 | LMS |
| 11 | **QC instrument-calibration registry** (0 instruments) | 1 | QC |
| 12 | **SD credit-limit / debtor master** (nothing to gate advance-bypass against) | 1 | SD |

**Total: 41.** Filling data-point #1 alone (per-card attributes) is the single biggest
unblock and is also the precondition for several Part-3.2 "flip the switch" decisions.

### 3.2 — 82 owner-DECISION root causes, grouped by decision TYPE

Each row states the plain question the owner must answer. File paths/SB-ids are reference
only, never part of the question.

#### Type A — "Turn ON a built-but-off mechanism?" (data is now ready)
1. **Do we activate the card-based permission system now?** (needs a `card_permissions`
   table; position-ids 1-92 numerically collide with card-ids 19-173, so naive reuse
   would grant false-allows) — SB cross-cutting #1, 4 root causes.
2. **Do we flip the card-login gate ON?** It's fully built and off by default; card data
   coverage went from near-zero to ~100%. — cross-cutting #2, 2 rc.
3. **Do we roll out multi-tenancy?** The guard+decorator are built but registered
   nowhere; only ~10 files/~35-40 tables are tenant-aware; `users` has no tenant_id. —
   cross-cutting #4, 2 rc.

#### Type B — "Which of the parallel tables/vocabularies is canonical (drop the rest)?"
4. **Which org base table is the real one** — org_departments, org_functions, or
   departments (all three populated in parallel)? — Org, SB0149/187.
5. **Which materials table is canonical** — mm_materials / raw_materials / materials /
   products, vs. material_cards? (already logged "EGASI QARORI KERAK") — Master-data,
   SB0733/740/747.
6. **Which SD order-status vocabulary is real** — the live 15-state machine or the
   schema's 23-state `master_status` (100% NULL, never written)? — SD, SB0587/620/624.
7. **`entries` debit/credit account-id type drift** (varchar vs integer, ripples ~5
   files) — which type is canonical? — Moliya, SB0833.
8. **`ai_ckp_scores`** — build it out or drop it (dormant duplicate)? — CKP, SB0019/30/50.
9. **`company_tskp`** — wire up as a lookup or drop (orphaned)? — CKP, SB0052.
10. **`units` table** — wire up or drop (confirmed true orphan)? — Master-data, SB0761.
11. **CRM ABC scoring vs SD ABC** — `crm_companies` ABC columns never computed, duplicate
    of SD's own calc (a two-world split) — which owns ABC? — CRM, SB0674.

#### Type C — "What business rule / threshold / policy applies?"
12. **Exam pass-threshold & max-retakes** values? (reverted after an unapproved seed) —
    Razryad, SB0763/770/781/786/792.
13. **Cross-machine material-loss threshold** — is gofra 3% the rule? — IoT, SB0367.
14. **Downtime reason-code taxonomy** — reconcile 11 EuroPrint codes vs 6 SAP codes;
    which set is authoritative? — IoT, SB0307/337/353/364.
15. **ЦКП deadline spec** — 16h or 3h? — Moliya, SB0800.
16. **Onboarding-stage pay coefficients** — values + where stored? — LMS, SB0130.
17. **Absence auto-block policy** — the day-3 cron fully disables an account with no
    pre-approval gate (may overstep the E1 human-confirm principle) — keep, or add a
    confirm gate? — AI/Auth, cross-cutting #5, 2 rc.
18. **Field-level PII masking policy** for salary/razryad/AI-scores/confidential HR docs —
    what is masked from whom? — Auth/HR, cross-cutting #3, 2 rc.
19. **Split-order / partial-delivery** — allow it, or keep all-or-nothing batches? — PP,
    SB0265/275.
20. **Discount/compensation abuse-flag criteria** — what triggers a flag? — CRM, SB0664.
21. **4-account revenue-split trigger** — on real cash-inflow events, or manual only? —
    Moliya, SB0799/809.
22. **Fuel/transport costing rules** — entirely undefined. — Moliya, SB0821.
23. **RBAC granularity standard** — POS uses ~20 dotted action-keys, everything else uses
    module:LEVEL — which standard wins? — Xavfsizlik, SB0722.
24. **Customer/material business-key code standard** + customer_code generator (missing) —
    what format? — Master-data, SB0735/739.
25. **Course-versioning / re-certification semantics** — undefined. — LMS, SB0131.
26. **Multi-card stake-share ratio** — no real data source, always defaults to 1.0 — what
    rule sets it? — Org, SB0160/174.
27. **`workflow_rules`** — cross-department mechanism built, zero rules defined — what
    rules? (also an owner-data item from another area) — Org, SB0167/183.

#### Type D — "Should this feature exist at all / build-vs-defer?"
(Grouped; each is a yes/build-now vs. no/defer call. Full per-item SB-ids in retriage doc.)
28. **AI:** JARVIS desktop voice client (separate out-of-repo app?); SD→PP→MES AI model
    call (deliberately unwired pending EP-AI-085 governance) — SB0507/520/516.
29. **Auth/RBAC:** acting-role (i.o.) cards scoped/reduced permission set?; 2-signature
    approval for new card creation? — SB0198/219/229, SB0199/231.
30. **CKP:** ЦКП hard-gate blocked→HR unlock override path (currently none, by design)? —
    SB0021.
31. **Hisobot/dashboard:** card-attributed KPIs (currently company-wide only)?; Dept×
    Operation 2-axis nav?; 7-otdeleniye KPI aggregate (never built/seeded)?; role-based
    dashboard-widget config? — SB0371/388/393, SB0376, SB0407, SB0409/410.
32. **Razryad:** recurring re-certification/attestation scaffold?; automatic
    razryad-decrease trigger (currently manual only)? — SB0774/790, SB0795.
33. **IoT (feature-existence decisions):** operator competency/razryad machine-access
    gate; material sarf-norma↔MES integration; norma-versioning RD-4 workflow; AI
    auto-approval gate for GSD/MES; Andon shop-floor board (doesn't exist);
    card_activity_logs/A-System integration; camera report-vs-AI cross-check service;
    energy cost auto-post to GL; camera safety-violation conflict-resolution workflow —
    SB0301/303/309/327/328/330/340/341/359/362.
34. **PP:** production_orders assignee FK + card redesign; qc_gate as a blocking
    transition; AI-release chain bypassable by SUPER_ADMIN (fix?) — SB0234/238/273.
35. **QC:** rework-cycle parent_order_id lineage; Cost-of-Quality table/service; CAPA
    entity + Kanban linkage; QC-outcome-specific payroll gate — SB0458/462/464/468.
36. **MES:** version/effective-date on routing-level tables; material-norm
    auto-calculation/approval; standing brigade/team master table — SB0421/442/413/427.
37. **SD:** klishe/die ownership-and-retention asset registry — SB0595/604.
38. **CRM (feature-existence):** card_id on CRM entities into the KARTA model; unified
    "corporate number" identity; credit_limit/is_blocked gating; departed-manager book
    takeover; funnel→Vysotskiy-7 approval mapping; "papka" folder grouping; field-visit
    GPS check-in; crm_proposals approval workflow; CRM↔MM/SD pricing integration;
    lead→deal sales-rahbari approval gate; stage prerequisite-artifact checks —
    SB0629..0670 (11 distinct).
39. **WMS/POS:** karta/razryad into POS/WMS RBAC; MES→WMS auto material-issue-per-norma;
    PWA true Background Sync API — SB0535/577/562, SB0538/555, SB0575.
40. **Master-data:** Technology/PP spec ↔ MES execution-data link (structural gap);
    Customer-360 10-flat-tab grouping (UX) — SB0749, SB0758.

**Total: 82** (12 folded into the 5 cross-cutting themes, 70 area-specific).

---

## Precedent flags (suggestions only — owner confirms before treated as decided)
- Type-B canonical-table decisions (#4 org base, #5 materials) echo prior "canonical =
  org_departments" (memory) and "canonical = material_cards" precedents — but both are
  explicitly logged as still-open owner calls; do NOT auto-apply.
- Type-A "flip the gate" (#2) is now data-ready (card coverage ~100%), matching the
  earlier stated precondition — but flipping a login gate in production is the owner's call.
