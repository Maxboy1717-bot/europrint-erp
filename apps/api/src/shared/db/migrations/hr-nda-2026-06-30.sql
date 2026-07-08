-- APPROVED: egasi 2026-06-30 "vizyon bo'yicha to'liq"
-- Modul 02 (HR) — tijorat siri NDA imzosi (vizyon 02.41: alohida bayonnoma + onboarding'da majburiy imzo).
-- Tekshiruv (2026-06-27): NDA jadvali/oqimi yo'q edi.
CREATE TABLE IF NOT EXISTS hr_nda_acknowledgments (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER     NOT NULL,
  document_title   TEXT        NOT NULL DEFAULT 'Tijorat siri to''g''risida bitim (NDA)',
  document_version TEXT        NOT NULL DEFAULT 'v1',
  status           TEXT        NOT NULL DEFAULT 'pending',   -- pending|signed
  signed_at        TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_hr_nda_status CHECK (status IN ('pending','signed'))
);
CREATE INDEX IF NOT EXISTS idx_hr_nda_user ON hr_nda_acknowledgments (user_id);
CREATE INDEX IF NOT EXISTS idx_hr_nda_pending ON hr_nda_acknowledgments (status) WHERE status = 'pending';
