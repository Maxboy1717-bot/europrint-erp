# EXECUTOR DIRECTIVE #02L — ORG Phase 7 (final feature phase): vacancy + i.o. (acting) + glossary + staleness
> Phases 1-6 done + advisor-verified. Phase 7 = the LAST ORG feature phase. Vacancy has duplication risk — re-audit first. 2026-06-08

## ✅ Where we are
ORG's functional core is built + verified: card model, razryad, folder/ЦКП, exam, 8-tab detail, employee↔card M:N + FORMULA-A salary + cert-in-card. Phase 7 finishes the ORG feature set; then only card-gate (EP-ORG-003) remains.

## ⚠️ Vacancy = DUPLICATION RISK → re-audit first
The `vacancies` table already exists (you used it in the Phase-5 Vakant tab, `org_function_id` link). There's likely an existing recruitment/vacancy module (HR recruitment was built earlier). So vacancy management = WIRE/extend the existing `vacancies` + recruitment infra to the card, NOT build a parallel vacancy world (C6).

## ▶️ STEP 1 — PHASE-7 RE-AUDIT (read-only) — FIRST, then STOP for owner
Write `docs/ORG-PHASE7-REAUDIT-2026-06-08.md`:
- **Vacancy:** `vacancies` columns (`q.cjs`), row count; existing vacancy/recruitment BE module/controller (real vs stub); existing FE vacancy pages. What's there vs the vision (aging/priority/SLA/bulk-import).
- **I.o. (acting):** is there ANY acting/temporary-assignment model? (check for `acting`, `temporary`, `is_acting`, or whether `employee_cards.ended_at` + a flag can model it). 
- **Glossary:** the Phase-3 glossary tooltips (EP-ORG-129) — extend or a glossary table?
- **Card staleness:** does `org_functions` have a last-reviewed date, or use `updated_at`?
- **DDL proposal** (if any): e.g. `employee_cards` already has `ended_at` → acting could be a time-bound link with an `is_acting` flag + `acting_supplement`; staleness could be a `last_reviewed_at` column. Propose minimal DDL → owner-approval gate (Q-35).
- **STOP → show owner the re-audit + reuse/DDL plan → "davom" before any code.**

## 🎯 Phase 7 vision (build prompt §PHASE 7 — build to this)
- **Vacancy:** aging buckets (0-14 / 15-45 / 45+ days, EP-ORG-072), priority (EP-ORG-073), SLA (EP-ORG-074), bulk import (EP-ORG-075/076). Reuse `vacancies` + the card link.
- **I.o. (acting):** dated, **auto-reverts** at end date (EP-ORG-060); **acting salary = own + supplement** (EP-ORG-061 — supplement adds to FORMULA A; salaries empty now = correct-empty); **acting rights = ops YES / money+HR NO** (EP-ORG-062 — connects to RBAC, the eventual card-gate).
- **Glossary** + tooltip (extend EP-ORG-129).
- **Card staleness:** last-reviewed date + **1-year reminder** (EP-ORG-137).

## ▶️ STEP 2+ — BUILD (after owner approves the reuse/DDL plan)
Each sub-feature: permission → BE+FE → verify → commit → report. Reuse the `vacancies`/recruitment infra + `employee_cards` (acting as a time-bound link). Mirror the established card/razryad/folder patterns (Result+Zod+parametrized; EP tokens+templates+DetailPage tabs; self-verify). Surface vacancy in the card's Vakant tab (Phase 5) + i.o. on the Xodimlar tab.

## ⭐ SELF-VERIFY + DoD-7 + RAILS
DB-proof (vacancy aging buckets compute correctly for seeded dates; i.o. auto-revert logic; acting supplement adds to the salary sum; staleness 1-year flag) · BE+FE tsc 0 + build · no regression (Phases 1-6 — card CRUD, M:N, salary, the Vakant/Xodimlar tabs all still work) · honest ComingSoon/501 over fake · DDL = owner-approved SQL · EP-ORG-060/061/062/072-076/137 op-codes · separate commits (`git add <file>`) · Uzbek report with proof.

## STOP POINTS
1. **After the RE-AUDIT** — reuse/DDL plan → owner "davom" before code.
2. Before any new table/column (Q-35) — show SQL.
3. After each sub-phase — report + proof, wait "davom".

## RAILS
RE-AUDIT first (vacancy duplication risk) · reuse `vacancies`/recruitment + `employee_cards` (no parallel vacancy world, C6) · acting supplement feeds FORMULA A (max_salary + supplement) · no regression to Phases 1-6 · DDL owner-approved · self-verify · canonical card stays `org_functions`. After Phase 7 → only card-gate (EP-ORG-003) remains to complete ORG.
