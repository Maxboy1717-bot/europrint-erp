-- APPROVED: owner 2026-06-08
-- ORG Phase 4A — razryad question-keying (EP-ORG-053). hr_question_bank already has
--   org_function_id (card-type link); add razryad_level_id so the AI-exam question pool
--   can be filtered by card-type + razryad. Idempotent. FK → razryad_levels(id).
--   NO new exam/question table (C6 — reuse the canonical hr_question_bank).
ALTER TABLE hr_question_bank
  ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER REFERENCES razryad_levels(id);
