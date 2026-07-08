-- APPROVED: egasi 2026-06-30 "kod-tomonni boshla / vizyon bo'yicha to'liq"
-- Modul 09 (QC) — o'lchov asboblari kalibrovkasi. Tekshiruv (2026-06-27, 09.36):
-- asbob-kalibrovka jadvali/kodi UMUMAN yo'q edi. Sertifikat-muddat patterni (01.5) kabi:
-- next_due_at yaqinlashganda due_soon ogohlantirish.
CREATE TABLE IF NOT EXISTS qc_instrument_calibrations (
  id                  SERIAL PRIMARY KEY,
  instrument_name     TEXT        NOT NULL,
  instrument_code     TEXT,                                  -- inventar/seriya raqami
  location            TEXT,                                  -- qayerda (sex/uchastka)
  responsible_user_id INTEGER,
  interval_days       INTEGER     NOT NULL DEFAULT 365,      -- qayta-kalibrovka davri
  last_calibrated_at  DATE,
  next_due_at         DATE,
  certificate_number  TEXT,
  status              TEXT        NOT NULL DEFAULT 'active',  -- active|retired
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_qc_calib_status CHECK (status IN ('active','retired'))
);
CREATE INDEX IF NOT EXISTS idx_qc_calib_due ON qc_instrument_calibrations (next_due_at) WHERE status = 'active';
