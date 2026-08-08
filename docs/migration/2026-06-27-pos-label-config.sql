-- ============================================================================
-- POS Terminal — Per-warehouse-type ETIKET (label) config
-- Spec: "OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md" — KIRIM barkod-etiketi
-- POS Monitor printeridan 'tug'iladi'; etiket-o'lchami har ombor turiga moslashadi.
-- APPROVED: egasi 'Ombor terminal spec' 2026-06-27
-- ADDITIVE only (IF NOT EXISTS). BE ma'lumot-mantiq buzilmaydi (Q-46).
-- Q-40: config yo'q bo'lsa → BE default o'lcham qaytaradi (jadval bo'sh bo'lishi mumkin).
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_label_config (
  id              SERIAL PRIMARY KEY,
  warehouse_type  VARCHAR(64)  NOT NULL,           -- warehouses.type / warehouse_types.code
  label_width_mm  INTEGER      NOT NULL DEFAULT 58,
  label_height_mm INTEGER      NOT NULL DEFAULT 40,
  template        VARCHAR(64)  NOT NULL DEFAULT 'standard',
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_by      INTEGER
);

-- Bitta ombor-turi uchun bitta faol config (upsert kaliti).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_label_config_type
  ON pos_label_config (warehouse_type);
