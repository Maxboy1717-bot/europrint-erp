-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 09-qc#35: "Tekshiruv o'tkazib yuborish" = qc:override RBAC (faqat sifat boshlig'i + direktor);
--   kunlik 3 (oylik 15) limit + har override qc_override_log ga yoziladi; limitdan oshsa direktorga eskalatsiya.
-- Additive-only: yangi jadval qc_override_log. Mavjud qatorlar ta'sirlanmaydi (yangi jadval, backfill yo'q).
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS. Qayta ishga tushirish xavfsiz.
-- DB-proof (rollback-tx, europrint 2026-07-10): DDL 2x idempotent; 4 override — 1..3 escalated=false,
--   4-chi escalated=true (kunlik 3 dan oshdi); Tashkent-timezone kunlik/oylik hisoblagich to'g'ri.
--   psql "$DATABASE_URL" -f qc-override-log-2026-07-11.sql

CREATE TABLE IF NOT EXISTS qc_override_log (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  inspection_id INTEGER REFERENCES qc_inspections(id) ON DELETE SET NULL,
  reason        TEXT NOT NULL,
  escalated     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qc_override_log_user_created
  ON qc_override_log (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_qc_override_log_inspection
  ON qc_override_log (inspection_id);
