-- APPROVED: Claude(egasi vakolati) 2026-06-19 — WMS Vision-Build · Rulon qog'oz karta (paper-roll card)
-- Manba: docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3 (rulon karta maydonlari).
-- Additive only (CREATE TABLE IF NOT EXISTS — destructive ALTER yo'q, mavjud jadvallarga tegmaydi).
-- Idempotent (IF NOT EXISTS). Yangi jadval = `rulon_cards` (har bir jismoniy rulon uchun bitta karta/pasport).
-- FK: warehouse_id varchar REFERENCES warehouses(id) ON DELETE SET NULL (warehouses.id = varchar PK — drift yo'q).
-- Kanonik balans = warehouse_stock (H-rail); bu jadval rulon IDENTITETI uchun (balans emas) — ikkalasi birga ishlaydi.
-- Matematik miya (taxminiy uzunlik / qoldiq og'irlik) ALOHIDA xizmatda (WmsRollCalcService) — formula bu yerda takrorlanmaydi.
--
-- ⚠️ BU MIGRATION HALI ISHGA TUSHIRILMAGAN (NOT RUN). Egasi tasdig'idan keyin
--     drizzle-kit / psql orqali qo'lda ishga tushiriladi.

CREATE TABLE IF NOT EXISTS rulon_cards (
  id                  serial PRIMARY KEY,

  -- Noyob biznes-ID + QR label (qabulda avto-bosiladi).
  roll_code           varchar(64)  NOT NULL,
  qr_label            varchar(128),

  -- Fizik o'lchovlar.
  width_mm            integer      NOT NULL,
  diameter_mm         integer,
  grammage_gsm        integer      NOT NULL,

  -- Og'irlik (kg) — boshlang'ich va joriy qoldiq.
  initial_weight_kg   numeric(12,3) NOT NULL,
  current_weight_kg   numeric(12,3) NOT NULL,

  -- AI avto-hisob: taxminiy uzunlik (m) = weight × 1e6 / (gramaj × kenglik).
  estimated_length_m  numeric(14,3),

  -- Taksonomiya / kelib chiqishi.
  roll_type           varchar(30)  NOT NULL,
  supplier            text,
  certificate         text,
  received_date       timestamp DEFAULT now(),

  -- Sifat / saqlash.
  humidity_pct        numeric(5,2),
  storage_zone        varchar(40),

  -- Ombor bog'lanishi.
  warehouse_id        varchar(50)  REFERENCES warehouses(id) ON DELETE SET NULL,

  -- Holat (FIFO).
  status              varchar(20)  NOT NULL DEFAULT 'full',

  created_at          timestamp    NOT NULL DEFAULT now(),
  updated_at          timestamp    NOT NULL DEFAULT now(),

  CONSTRAINT rulon_cards_roll_code_key   UNIQUE (roll_code),
  CONSTRAINT rulon_cards_type_chk        CHECK (roll_type IN ('kraft','test_liner','fluting','white','makulatura')),
  CONSTRAINT rulon_cards_status_chk      CHECK (status IN ('full','opened','remnant')),
  CONSTRAINT rulon_cards_width_chk       CHECK (width_mm > 0),
  CONSTRAINT rulon_cards_grammage_chk    CHECK (grammage_gsm > 0)
);

CREATE INDEX IF NOT EXISTS idx_rulon_cards_status       ON rulon_cards (status);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_roll_type    ON rulon_cards (roll_type);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_warehouse_id ON rulon_cards (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_rulon_cards_grammage     ON rulon_cards (grammage_gsm);
