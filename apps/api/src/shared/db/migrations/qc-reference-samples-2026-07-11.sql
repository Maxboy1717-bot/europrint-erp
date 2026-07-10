-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Modul 09 (QC) — Arxiv namuna (etalon) 6 oy + joylashuv. Vizyon: TASDIQ-2146 §09 #21.
-- Etalon namunani ombor joylashuvi bilan arxivlaymiz; saqlash muddati 6 oy (default).
-- retention_until = arxivlangan sana + retention_months; muddat yaqinlashganda (30 kun) expiring_soon.
CREATE TABLE IF NOT EXISTS qc_reference_samples (
  id                  SERIAL PRIMARY KEY,
  sample_ref          TEXT        NOT NULL,                      -- namuna kodi / etalon nomeri
  product_id          INTEGER,                                   -- ixtiyoriy: mahsulot bog'lami
  order_id            INTEGER,                                   -- ixtiyoriy: buyurtma bog'lami
  inspection_id       INTEGER,                                   -- ixtiyoriy: qc_inspections bog'lami
  description         TEXT,
  storage_location    TEXT,                                      -- ombor joylashuvi (run-time kiritiladi)
  responsible_user_id INTEGER,
  metadata_json       JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- o'lchov/parametr snapshot
  archived_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_months    INTEGER     NOT NULL DEFAULT 6,            -- vizyon: 6 oy
  retention_until     DATE,                                      -- = archived_at + retention_months (repo hisoblaydi)
  status              TEXT        NOT NULL DEFAULT 'archived',   -- archived | disposed
  disposed_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_qc_ref_sample_status    CHECK (status IN ('archived','disposed')),
  CONSTRAINT ck_qc_ref_sample_retention CHECK (retention_months > 0)
);
CREATE INDEX IF NOT EXISTS idx_qc_ref_sample_retention ON qc_reference_samples (retention_until) WHERE status = 'archived';
CREATE INDEX IF NOT EXISTS idx_qc_ref_sample_ref       ON qc_reference_samples (sample_ref);
