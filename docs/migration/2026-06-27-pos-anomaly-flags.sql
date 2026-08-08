-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- P2-ANOMALY — POS Monitor: qoida-asosli anomaliya aniqlash (additive).
-- Vizyon: shubhali harakat → boshliqqa signal; tungi-smena anomaliya (vaqt+miqdor);
-- topshir↔qabul nomuvofiqligi; norma-fakt ortiqcha-sarf; bekor/prostoy signali.
--
-- ADDITIVE faqat: yangi jadval + indekslar. Mavjud WMS dvigateliga (Q-46) tegmaydi.
-- Anomaliya aniqlash side-effect: movement-completed listener'da ishlaydi,
-- asosiy stock/ledger yo'liga ta'sir qilmaydi.

CREATE TABLE IF NOT EXISTS pos_anomaly_flags (
  id               SERIAL PRIMARY KEY,
  movement_id      INTEGER,                 -- pos_movements.id (bog'liq harakat, nullable)
  movement_number  VARCHAR(64),             -- inson o'qiy oladigan raqam (snapshot)
  rule_code        VARCHAR(64)  NOT NULL,   -- NIGHT_LARGE_QTY / SEND_RECEIVE_MISMATCH / OVER_NORM_CONSUMPTION / CANCELLED_IDLE / SUSPICIOUS_VALUE
  severity         VARCHAR(16)  NOT NULL DEFAULT 'warning',  -- info / warning / critical
  title            TEXT         NOT NULL,
  detail           TEXT,                    -- qoida nima uchun ishga tushdi (inson o'qiydi)
  metrics          JSONB        NOT NULL DEFAULT '{}'::jsonb, -- raqamli dalillar (qty, threshold, hour, ...)
  detected_by      VARCHAR(16)  NOT NULL DEFAULT 'rule',     -- rule / ai (AI-kalit kelganda)
  status           VARCHAR(16)  NOT NULL DEFAULT 'open',     -- open / acknowledged / dismissed
  acknowledged_by  INTEGER,
  acknowledged_at  TIMESTAMP,
  created_by       INTEGER,                 -- harakatni yaratgan/yakunlagan xodim (audit uchun)
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Idempotent qo'shimcha ustunlar (jadval avval mavjud bo'lsa)
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS movement_id      INTEGER;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS movement_number  VARCHAR(64);
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS rule_code        VARCHAR(64);
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS severity         VARCHAR(16) DEFAULT 'warning';
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS title            TEXT;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS detail           TEXT;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS metrics          JSONB DEFAULT '{}'::jsonb;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS detected_by      VARCHAR(16) DEFAULT 'rule';
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS status           VARCHAR(16) DEFAULT 'open';
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS acknowledged_by  INTEGER;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS acknowledged_at  TIMESTAMP;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS created_by       INTEGER;
ALTER TABLE pos_anomaly_flags ADD COLUMN IF NOT EXISTS created_at       TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_pos_anomaly_flags_movement  ON pos_anomaly_flags (movement_id);
CREATE INDEX IF NOT EXISTS idx_pos_anomaly_flags_status    ON pos_anomaly_flags (status);
CREATE INDEX IF NOT EXISTS idx_pos_anomaly_flags_rule      ON pos_anomaly_flags (rule_code);
CREATE INDEX IF NOT EXISTS idx_pos_anomaly_flags_created   ON pos_anomaly_flags (created_at DESC);

-- Bir harakat + bir qoida juftligi takror flag bo'lmasligi uchun (idempotent listener)
CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_anomaly_flags_mov_rule
  ON pos_anomaly_flags (movement_id, rule_code)
  WHERE movement_id IS NOT NULL;
