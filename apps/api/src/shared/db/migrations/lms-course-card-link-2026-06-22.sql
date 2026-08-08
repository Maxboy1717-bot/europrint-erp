-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/lms-course-card-link-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- EP-LMS-001 — card-centric LMS (owner's #1 LMS rule: "Darslik kartaga
-- biriktiriladi", NOT to a department/employee). A course (darslik) gains a
-- logical reference to an org-CARD (org_functions.id). Additive + idempotent.
--
-- Logical ref only — NO hard FK (cross-module ADR: lms -> org_functions is a
-- read reference across module boundaries, not an ownership FK). The existing
-- department_id column is kept untouched (legacy binding still works); existing
-- rows get card_id = NULL.
--
-- After this: POST/PATCH /api/lms/courses can set card_id, and
-- GET /api/lms/courses/by-card/:cardId lists the darsliklar of a card.
-- The full 16-table salary-gate (lms_salary_blocks / MES gate / nazorat_varaqa /
-- certificate auto-gen / razryad exam) is a SEPARATE later slice — not this one.
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_courses_card_id ON courses (card_id);
