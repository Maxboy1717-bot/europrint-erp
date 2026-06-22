-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/wms-rulon-cards-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- rulon_cards (rulon qog'oz ombori — roll-paper warehouse, the owner's most
-- important factory-core warehouse). GET /api/wms/rulon-cards returned 503
-- because the table did not exist. Columns match the canonical Drizzle schema
-- lib/db/src/schema/wms-rulon-cards.ts and the reader's SELECT list.
-- warehouse_id is varchar(50) with NO FK (live warehouses.id is INTEGER; the
-- app uses warehouse_id as a free-form code). Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rulon_cards (
  id                 SERIAL PRIMARY KEY,
  roll_code          VARCHAR(64)  NOT NULL UNIQUE,
  qr_label           VARCHAR(128),
  width_mm           INTEGER      NOT NULL,
  diameter_mm        INTEGER,
  grammage_gsm       INTEGER      NOT NULL,
  initial_weight_kg  NUMERIC(12,3) NOT NULL,
  current_weight_kg  NUMERIC(12,3) NOT NULL,
  estimated_length_m NUMERIC(14,3),
  roll_type          VARCHAR(30)  NOT NULL,
  supplier           TEXT,
  certificate        TEXT,
  received_date      TIMESTAMP    DEFAULT NOW(),
  humidity_pct       NUMERIC(5,2),
  storage_zone       VARCHAR(40),
  warehouse_id       VARCHAR(50),
  status             VARCHAR(20)  NOT NULL DEFAULT 'full',
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT rulon_cards_type_chk     CHECK (roll_type IN ('kraft','test_liner','fluting','white','makulatura')),
  CONSTRAINT rulon_cards_status_chk   CHECK (status IN ('full','opened','remnant')),
  CONSTRAINT rulon_cards_width_chk    CHECK (width_mm > 0),
  CONSTRAINT rulon_cards_grammage_chk CHECK (grammage_gsm > 0)
);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_status       ON public.rulon_cards (status);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_roll_type    ON public.rulon_cards (roll_type);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_warehouse_id ON public.rulon_cards (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_grammage     ON public.rulon_cards (grammage_gsm);
