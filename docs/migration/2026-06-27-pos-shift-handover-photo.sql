-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- P3-HANDOVER-PHOTO — POS Monitor: smena-topshirish akti (2-imzo) + foto-dalil + qaytariladigan-tara
--
-- VIZYON: smenadan smenaga material topshirish 2-IMZO akti (topshiruvchi + qabul qiluvchi
--   ikkalasi ham imzolamasa akt YOPILMAYDI); foto-dalil (kirim/brak/inventar-farq) majburiy
--   bo'lishi mumkin; bo'sh poddon/rohler — qaytariladigan-tara hisobi.
--
-- ADDITIVE (Q-46): mavjud POS/WMS oqimiga TEGMAYDI. Faqat CREATE/ALTER IF NOT EXISTS.
--   DESTRUCTIVE amal YO'Q. Mavjud `shift_handovers` (MES smena-topshirish: mashina holati,
--   sifat muammosi) BOSHQA jadval — bu yangi `pos_shift_handovers` ombor material-aktiga oid.

-- ─── 1. POS smena-topshirish akti (2-imzo) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_shift_handovers (
  id              SERIAL PRIMARY KEY,
  handover_number VARCHAR(40),
  warehouse_id    VARCHAR(40),
  from_user_id    INTEGER NOT NULL,                 -- topshiruvchi (smena tugatuvchi)
  to_user_id      INTEGER NOT NULL,                 -- qabul qiluvchi (smena boshlovchi)
  items           JSONB   NOT NULL DEFAULT '[]'::jsonb,  -- [{materialCardId, quantity, unit, note}]
  notes           TEXT,
  photo_evidence_url TEXT,                          -- akt umumiy foto-dalili (ixtiyoriy)
  from_signed_at  TIMESTAMP,                        -- topshiruvchi imzo vaqti
  to_signed_at    TIMESTAMP,                        -- qabul qiluvchi imzo vaqti
  -- 2-IMZO GATE: status 'closed' faqat ikkala imzo bo'lganda (service darvozasi + DB check)
  status          VARCHAR(24) NOT NULL DEFAULT 'draft',  -- draft|from_signed|to_signed|closed|cancelled
  cancel_reason   TEXT,
  created_by      INTEGER,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 2-imzo invariant: 'closed' bo'lsa ikkala imzo ham mavjud bo'lishi shart (DB-darajadagi himoya)
ALTER TABLE pos_shift_handovers
  ADD CONSTRAINT pos_shift_handovers_two_sign_chk
  CHECK (status <> 'closed' OR (from_signed_at IS NOT NULL AND to_signed_at IS NOT NULL))
  NOT VALID;

CREATE INDEX IF NOT EXISTS idx_pos_shift_handovers_warehouse ON pos_shift_handovers (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pos_shift_handovers_status    ON pos_shift_handovers (status);
CREATE INDEX IF NOT EXISTS idx_pos_shift_handovers_from_user ON pos_shift_handovers (from_user_id);
CREATE INDEX IF NOT EXISTS idx_pos_shift_handovers_to_user   ON pos_shift_handovers (to_user_id);

-- ─── 2. pos_movements'ga foto-dalil ustuni ────────────────────────────────────
-- Foto-dalil: kirim qabul qilish / brak akti / inventar-farq uchun rasm URL.
ALTER TABLE pos_movements ADD COLUMN IF NOT EXISTS photo_evidence_url TEXT;

-- ─── 3. Qaytariladigan-tara (bo'sh poddon / rohler) hisobi ────────────────────
-- Har bir tara turi (poddon, rohler) bo'yicha kim qancha qarzdor: chiqarilgan vs qaytarilgan.
CREATE TABLE IF NOT EXISTS pos_returnable_pallets (
  id               SERIAL PRIMARY KEY,
  warehouse_id     VARCHAR(40),
  pallet_type      VARCHAR(40) NOT NULL,            -- 'pallet' (poddon) | 'roller' (rohler) | ...
  direction        VARCHAR(12) NOT NULL,            -- 'out' (berildi) | 'in' (qaytdi)
  quantity         NUMERIC(14,2) NOT NULL DEFAULT 0,
  counterparty_id  INTEGER,                         -- xodim/kontragent (kim oldi/qaytardi)
  handover_id      INTEGER REFERENCES pos_shift_handovers (id),  -- smena-aktiga bog'lash (ixtiyoriy)
  movement_id      INTEGER,                         -- pos_movements bilan bog'lash (ixtiyoriy)
  photo_evidence_url TEXT,
  note             TEXT,
  created_by       INTEGER,
  created_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_returnable_pallets_warehouse    ON pos_returnable_pallets (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pos_returnable_pallets_type         ON pos_returnable_pallets (pallet_type);
CREATE INDEX IF NOT EXISTS idx_pos_returnable_pallets_counterparty ON pos_returnable_pallets (counterparty_id);
CREATE INDEX IF NOT EXISTS idx_pos_returnable_pallets_handover     ON pos_returnable_pallets (handover_id);
