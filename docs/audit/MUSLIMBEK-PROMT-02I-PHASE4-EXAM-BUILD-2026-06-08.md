# EXECUTOR DIRECTIVE #02I — ORG Phase 4 BUILD: wire the card to the existing exam infra
> Re-audit done + advisor-verified; owner made the canonical decisions. Now WIRE (reuse, don't rebuild). 2026-06-08

## ✅ OWNER DECISIONS (locked)
- **Canonical (confirmed, advisor-DB-verified):** AI exam = `ai_exam_attempts` + `modules/ai/.../ai-exam.controller` (real, `AiExamService`) · official exam = `lms_exams` (`passing_score` = configurable threshold, already there) · certificate = `certificates` (richest, has `expiry_date`) · question bank = `hr_question_bank`. **Do NOT touch `lms_certificates` (LMS overlap) or `qc_certificates` (QC domain) — out of scope.**
- **Cert-in-card (EP-ORG-047) → DEFERRED to Phase 6** (earned-cert list + 30-day expiry needs the employee↔card occupant link). NOT in Phase 4.
- **razryad question-keying (EP-ORG-053) → DO NOW** (small DDL, owner-approved concept; show SQL before run).
- **Retake rule (EP-ORG-056) → DEFERRED** (refinement; no exams are being taken yet).
- The card↔exam/question link **already exists in schema** (`org_function_id` on `ai_exam_attempts`, `hr_question_bank`, `hr_tz2_ai_question_banks`, `lms_tests`) — Phase 4 = USE it, do not re-create.

## ▶️ BUILD (reuse-heavy; extend existing services; mirror prior phases' rigor)

**Sub-phase A — razryad question-keying DDL (the only new DDL):**
- `ALTER TABLE hr_question_bank ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER REFERENCES razryad_levels(id);` (idempotent, `-- APPROVED: owner 2026-06-08`).
- **Show the final SQL to the owner → wait "ha" → run → DB-proof** (column exists, FK resolves). Then questions can be filtered by card-type (`org_function_id`) + razryad.

**Sub-phase B — wire AI exam to the card (reuse `AiExamService` + `ai-exam.controller`, NO new tables):**
- An AI exam attempt is scoped to a card: `ai_exam_attempts.org_function_id` (exists) + the card's razryad. The question pool = `hr_question_bank` / `hr_tz2_ai_question_banks` filtered by `org_function_id` (+ razryad from sub-phase A).
- Extend the existing service (don't duplicate); add the card-scoping where it's missing. Per-card AI exam (EP-ORG-046).

**Sub-phase C — surface "this card's exams" in the card UI (reuse `AIExams.tsx`/`AllExams.tsx` components):**
- In the card detail/folder (Phase 3 papka or a card detail area), show: which exams apply to this card (by `org_function_id` + razryad), the configured `passing_score` (EP-ORG-055), and attempt status. Launch an AI exam from the card (reuse the existing AI-exam FE flow).
- Real data via the existing `/api/ai-exam` + `/api/.../lms-tests` endpoints (verify the exact URLs against the controllers — Qoida 18). No fake.

## 🚫 Do NOT
- Create `org_exams` / `org_certificates` / a new question table (C6 — one truth).
- Touch `lms_certificates` / `qc_certificates`.
- Build cert-in-card or retake (deferred).
- Rewrite `AiExamService` / `lms-tests` — extend.

## ⭐ SELF-VERIFY + DoD-7
DB-proof (razryad column resolves; an AI-exam attempt scoped to a card org_function_id persists; question pool filters by card+razryad) · BE+FE tsc 0 + FE build · reviewers PASS · live probe (the exam endpoints 200/401, server up) · no regression (ai-exam/lms/card/razryad/folder all still work) · FE round-trip (launch exam from card → attempt records) · separate commits (`git add <file>`) · EP-ORG-046/053/055 op-codes · Uzbek report with proof.

## STOP POINTS
- Before the `hr_question_bank` razryad DDL — show SQL, wait "ha" (Q-35).
- After each sub-phase — report + proof, wait "davom".

## RAILS
Reuse the canonical infra (extend, don't duplicate) · only DDL = the razryad column (owner-approved SQL) · no regression to the LMS/AI-exam modules · cert-in-card + retake deferred · EP tokens + existing templates · self-verify everything · canonical card stays `org_functions`.
