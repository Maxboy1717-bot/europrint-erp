-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- qc-norm-versions-2026-07-11.sql
-- Modul 09 (QC) — item #39: norma snapshot-versiyalash. Tekshiruv (2026-07-11, 09.39):
-- qc_norm_versions UMUMAN yo'q edi (to_regclass=null); qc_standards mavjud (0 satr) lekin
-- versiyalash ustunlari yo'q. Norma o'zgarganda joriy normalar JSON-snapshot sifatida
-- [valid_from, valid_to) oynasi bilan saqlanadi. Eski sanadagi buyurtma o'sha paytdagi
-- (eski) norma versiyasiga bog'lanadi (getActiveAt). valid_to IS NULL = joriy faol versiya.
-- Additive + idempotent: CREATE TABLE/INDEX IF NOT EXISTS; mavjud jadvallarga tegilmaydi.
CREATE TABLE IF NOT EXISTS qc_norm_versions (
  id            SERIAL       PRIMARY KEY,
  norm_ref      TEXT         NOT NULL,                       -- norma to'plami biznes-kaliti (standart/material kodi)
  version_no    INTEGER      NOT NULL DEFAULT 1,             -- norm_ref bo'yicha monoton versiya
  valid_from    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),         -- versiya kuchga kirgan payt
  valid_to      TIMESTAMPTZ,                                 -- NULL = joriy faol versiya
  snapshot_json JSONB        NOT NULL DEFAULT '{}'::jsonb,   -- o'sha paytdagi normalar snapshoti
  note          TEXT,
  created_by    INTEGER,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_qc_norm_versions_window CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
-- Bir norm_ref uchun bir vaqtda FAQAT bitta ochiq (valid_to IS NULL) versiya bo'lishi mumkin.
CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_norm_versions_open
  ON qc_norm_versions (norm_ref) WHERE valid_to IS NULL;
-- Sana bo'yicha faol versiyani tez topish (getActiveAt).
CREATE INDEX IF NOT EXISTS idx_qc_norm_versions_ref
  ON qc_norm_versions (norm_ref, valid_from);
