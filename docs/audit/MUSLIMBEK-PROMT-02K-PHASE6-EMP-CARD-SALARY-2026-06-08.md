# EXECUTOR DIRECTIVE #02K — ORG Phase 6: employee↔card link + salary→profile aggregation
> Phases 1-5 done + advisor-verified. Phase 6 = the functional core. HIGH care: touches employees + payroll. 2026-06-08

## ⛔ This is the heaviest ORG phase — RE-AUDIT FIRST, DDL gate, no rewrite
Phase 6 changes the employee↔card model (currently 1:1 via `employees.org_function_id`) to **many-to-many** (an employee may hold several cards; each card still has ≤1 active employee — the atomic guard EP-ORG-002 / EP-ORG-094 "3 separate Operator cards"). It also wires **salary → profile aggregation**. This reaches into employees + payroll → extra care, no regression (Q-39).

## ✅ OWNER DECISION (locked, resolves a vision conflict)
**Multi-card salary = FORMULA A (EP-ORG-142 final): each card shows its FULL salary; the employee PROFILE = the SIMPLE SUM of all the employee's cards' salaries. NO cap.** (Owner confirmed 2026-06-13, superseding the EP-ORG-066 "max 1.0 stavka cap" and the decisions/01 "30-50%" variants — those are VOID.) Example: cards 3M + 2M → profile 5M.
- (Optional, owner-noted abuse-watch — NOT a cap, NOT a block): you MAY surface a soft informational flag in the profile if an employee holds many cards (e.g. >N) so the owner can see it — but never cap or block (principle: AI flags → human decides). Keep it minimal/optional; the formula itself is uncapped sum.

## ▶️ STEP 1 — PHASE-6 RE-AUDIT (read-only) — FIRST, then STOP for owner
Map the current model vs the many-to-many target. Write `docs/ORG-PHASE6-EMP-CARD-REAUDIT-2026-06-08.md`:
- Current link: `employees.org_function_id` (1:1) — how many employees linked, how the atomic guard counts occupants (Phase 1 used `employees WHERE org_function_id`).
- Salary fields: where is a card's salary defined (`org_functions.min_salary`/`max_salary`/a single salary?) — which value is "the card's full salary" for the sum? Confirm.
- The profile/payroll path: how does an employee's salary currently reach payroll (the existing aggregation, if any)? What table/endpoint shows the employee profile total?
- Cert-in-card (EP-ORG-047, deferred from Phase 4): certificates are per-employee (`certificates`); now that we have the link, the card can show its occupant's earned certs + 30-day expiry. Map the `certificates` columns (employee link, expiry_date).
- **DDL proposal:** likely a new link table `employee_cards` (employee_id, card_id→org_functions, is_primary bool, assigned_at, ended_at/is_active) with the constraint that a card has ≤1 active employee (partial unique index on card_id WHERE is_active). Migrate the existing `employees.org_function_id` links into it (keep org_function_id as the primary-card mirror for back-compat, or note the plan). 
- **STOP → show the owner the re-audit + DDL + migration plan → get approval before ANY code.** This is the big gate (model + payroll change).

## ▶️ STEP 2+ — BUILD (only after owner approves the model + DDL)
Each sub-feature: permission → BE+FE → verify → commit → report.
1. **DDL** (owner-approved SQL, APPROVED marker, show before running): `employee_cards` link + the ≤1-active-employee-per-card constraint. Migrate existing org_function_id links (careful, idempotent).
2. **Employee↔card many-to-many BE:** assign/unassign an employee to a card (respect the atomic guard — reuse the Phase-1 `canAssignEmployee` check before assigning); a card's occupants; an employee's cards. Result + Zod + parametrized.
3. **Salary aggregation (FORMULA A):** the employee profile total = SUM of the employee's active cards' salaries (full, no cap). Compute in the service (not stored, or a clear derived value). Surface on the employee profile + the card's "Xodimlar" tab. DB-proof the sum (2 cards → correct total).
4. **Cert-in-card (EP-ORG-047):** the card detail shows the occupant's certificates (`certificates`) + a 30-day expiry warning. Reuse the `certificates` source (no new cert table — C6).
5. **FE:** employee↔card assignment UI (reuse the card detail "Xodimlar" tab from Phase 5 + the existing assign patterns); salary sum shown on the profile; cert list + expiry on the card. EP tokens + templates (Q-41), round-trip (Q-43).

## ⭐ SELF-VERIFY + DoD-7 + RAILS
DB-proof (link table, ≤1-active-per-card constraint blocks a 2nd active assign, salary SUM correct for a multi-card employee, cert expiry fires at ≤30 days) · BE+FE tsc 0 + build · no regression (the Phase-1 atomic guard, card CRUD, the existing employees.org_function_id readers all still work — this is the riskiest regression surface) · honest over fake · DDL = owner-approved SQL only · EP-ORG-002/047/066/142 op-codes · separate commits (`git add <file>`) · Uzbek report with proof.

## STOP POINTS (this phase has the most)
1. **After the RE-AUDIT** — model + DDL + migration plan → owner approves before any code (BIG gate).
2. **Before the `employee_cards` DDL** — show final SQL → owner "ha".
3. **Before migrating the existing org_function_id links** — show the migration + prove no employee loses their card.
4. After each sub-phase — report + proof, wait "davom".

## RAILS
RE-AUDIT first · salary = FORMULA A (full sum, no cap — locked) · reuse `certificates` for EP-ORG-047 (no new cert table, C6) · atomic guard (≤1 active employee per card) enforced · no regression to employees/payroll/atomic-guard · DDL owner-approved · self-verify everything · canonical card stays `org_functions`.
