# EXECUTOR DIRECTIVE #02H — ORG Phase 4: exam / certification (REUSE existing LMS/AI infra)
> Phases 1-3 done + advisor-verified. Phase 4 has HIGH duplication risk — re-audit FIRST, reuse, don't rebuild. 2026-06-08

## ⛔ READ THIS FIRST — Phase 4 is INTEGRATION, not greenfield
Unlike Phases 1-3 (new card/razryad/folder CRUD), the exam/certificate domain **already exists and is large**. The advisor's live scan found:
- **LMS exam (full set):** `lms_exams`, `lms_exam_questions`, `lms_exam_answers`, `lms_exam_attempts`, `lms_questions`, `lms_tests`, `lms_test_attempts` + `modules/lms/presentation/` (lms-tests.controller, lms-certificates.controller, lms-core, lms-courses, lms-enrollments, lms-lessons, lms-attempts).
- **AI exam (LIVE):** `modules/ai/presentation/ai-exam.controller.ts` (`@Controller('ai-exam')`) + `ai_exam_attempts` + `ai_interview_questions`.
- **Certificates (THREE tables):** `certificates`, `lms_certificates`, `qc_certificates`.
- **Question banks:** `hr_question_bank`, `hr_tz2_ai_question_banks`, `questions`, `test_questions`, `hr_interview_questions`.

**The principle (C6 — one canonical truth):** Phase 4 must **WIRE the CARD to the canonical existing exam/cert infra**, NOT create `org_exams`/`org_certificates`. Building a parallel exam world is the failure mode to avoid (Q-40). Ignore the `.claude/worktrees/*` copies — those are stale; the live code is `apps/api/src/modules/lms/...`.

## ▶️ STEP 1 — PHASE-4 RE-AUDIT (read-only) — FIRST, then STOP for owner
Map the existing exam/cert/question infra vs the Phase-4 vision. Write `docs/ORG-PHASE4-EXAM-REAUDIT-2026-06-08.md`:
- For each of `lms_exams`/`lms_exam_questions`/`lms_exam_attempts`/`lms_certificates`/`ai-exam.controller`/`certificates`/`hr_question_bank`: row count (`q.cjs`), is the BE endpoint REAL or stub, is there an FE page (the `/ai-exam`, `/ai-exam` routes are in the stub list — confirm).
- **Which is canonical?** exam = `lms_exams`? certificate = which of the 3? Recommend the canonical one per table (most-FK'd / most-used / vision-fit).
- **Gap table:** the Phase-4 vision features (below) × exists? × where × gap × reuse-or-build.
- **STOP → show the owner + advisor → get approval on the reuse-vs-build plan before ANY code.**

## 🎯 Phase 4 vision (build prompt #02 §PHASE 4 — what the CARD needs)
- Exam = theory + practical (EP-ORG-046); **pass-threshold configurable** (EP-ORG-055); **retake rule configurable** (EP-ORG-056); **question-bank keyed by card-type + razryad** (EP-ORG-053).
- **Each card has its own AI exam** (scenario questions) — likely wire the existing `ai-exam.controller` + `ai_exam_attempts` to the card/razryad.
- **Certificate list shown IN the card** + **30-day expiry warning** (EP-ORG-047).

The likely REAL work (confirm in re-audit): the **card↔exam link** (which exam applies to a card-type+razryad), per-card AI-exam config, and surfacing the certificate list + expiry inside the card — NOT new exam tables. If a thin link table is genuinely needed (e.g. `card_exam_configs`), propose it via the DDL gate (Q-35, APPROVED, show SQL first) — but prefer reusing existing columns/links.

## ▶️ STEP 2+ — BUILD (only after owner approves the reuse plan)
Phase-by-phase, mirroring the established pattern (Result+Zod+parametrized SQL; EP tokens+templates; self-verify). Each sub-feature: permission → BE+FE → verify → commit → report. Reuse the canonical LMS/ai-exam services (extend, don't duplicate). Surface exam status + certificates + 30-day expiry in the card folder/detail (Phase 3 papka or the card detail).

## ⭐ SELF-VERIFY + DoD-7 + RAILS (same as before)
DB-proof (real exam/cert rows, card↔exam link resolves, expiry warning fires at ≤30 days) · BE+FE tsc 0 + FE build · reviewers PASS · no regression (LMS module + card CRUD/razryad/folder still work) · honest 501 over fake · DDL only via owner-approved SQL · EP-ORG op-codes (046/047/053/055/056) · separate commits (`git add <file>`) · Uzbek report with proof.

## STOP POINTS
1. **After the Phase-4 RE-AUDIT** — show the reuse-vs-build plan, get owner "davom" BEFORE any code (this is the big one — avoids a parallel exam world).
2. Before any new table (Q-35) — show SQL.
3. After each build sub-phase — report + proof, wait "davom".

## RAILS (Phase 4 specific)
⭐ **REUSE the canonical LMS/ai-exam/certificate infra — do NOT create org_exams/org_certificates (C6).** Re-audit before building. Pick ONE canonical certificate table (3 exist — recommend, owner confirms). No regression to the LMS module. Canonical card stays `org_functions`. Self-verify everything.
