-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/mes-operator-certifications-2026-06-20.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Fix: POST /api/mes/sessions/:id/start could 500 when a session requires
--   certification. drizzle-mes.repo.ts:150 runs
--     SELECT * FROM operator_certifications WHERE operator_id=? AND course_id=? LIMIT 1
--   against a missing table → 42P01 caught → wrong 500 instead of the intended
--   403 FORBIDDEN ("LMS sertifikati kerak"). Creating the (empty) table makes the
--   gate behave correctly: no cert row → start is BLOCKED with 403 (HARD BLOCK).
-- Columns derived from the exact WHERE/read usage (operator_id, course_id,
--   expires_at, course_name). course_id → courses(id) (live int PK). operator_id
--   kept as plain INTEGER (no FK): MES operatorId source is ambiguous
--   (employees vs users) — equality is all the code needs (Q-29 conservative).
-- Idempotent. No seed required; the empty state is safe-by-default.
-- ============================================================

CREATE TABLE IF NOT EXISTS operator_certifications (
  id          SERIAL PRIMARY KEY,
  operator_id INTEGER NOT NULL,                    -- MES session worker id (no hard FK: employees/users ambiguous)
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_name VARCHAR(200),                        -- denormalized; read at drizzle-mes.repo.ts:157
  issued_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMP,                           -- NULL => treated as INVALID by repo:156
  status      VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP,
  deleted_at  TIMESTAMP,
  CONSTRAINT operator_certifications_status_chk
    CHECK (status IN ('active','expired','revoked'))
);

-- One cert per operator+course (re-cert UPDATEs the row); matches WHERE + LIMIT 1.
CREATE UNIQUE INDEX IF NOT EXISTS uq_operator_certifications_operator_course
  ON operator_certifications (operator_id, course_id);
CREATE INDEX IF NOT EXISTS idx_operator_certifications_course_id
  ON operator_certifications (course_id);
