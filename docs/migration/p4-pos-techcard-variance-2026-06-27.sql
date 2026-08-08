-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- ============================================================================
-- P4-TECHCARD-VARIANCE — POS Monitor vizyon-build (ADDITIVE, Q-46)
-- ============================================================================
-- Vizyon manba (docs/audit/decisions/10-warehouse.md):
--   §EP-WMS-084/085 — texkarta-material mosligi chiqimdan OLDIN blok
--       (kod ≠ chiqarilayotgan → blok; gofra qavat mos kelmasa → blok).
--   Inventar farqi chegarasi — avto-tasdiq limiti; oshsa menejer-tasdiq.
--   Buyurtma o'zgarishi — chiqarilgan materialga qayta-tekshiruv (gate).
--
-- Bu migration FAQAT additive: yangi 2 jadval + idempotent seed. Mavjud
-- jadvallar/oqimlarga TEGILMAYDI (regress YO'Q). DESTRUCTIVE amal YO'Q.
--
-- 1) pos_movement_techcard — POS chiqim harakati QAYSI texkartaga (va gofra
--    qavatiga) bog'langanini saqlaydi. Texkarta-gate (EP-WMS-084/085) shu
--    bog'lanishni ishlatadi; buyurtma-o'zgarish handleri esa qayta-tekshiradi.
--    Bog'lanish ixtiyoriy — texkarta yo'q chiqim gate-siz o'tadi (fail-open).
--
-- 2) pos_variance_config — inventarizatsiya farqi avto-tasdiq chegarasi.
--    Ombor-doirasida (warehouse_id) yoki global (warehouse_id IS NULL) default.
--    Farq chegaradan KICHIK/teng → avto-tasdiq; OSHSA → menejer-tasdiq (escalate).
--    Default qiymatlar egasi-DATA bilan almashtiriladi (Q-40 — fabrikatsiya yo'q,
--    bular faqat xavfsiz boshlang'ich; egasi har ombor uchun aniq limitni beradi).
-- ============================================================================

-- ─── 1. POS chiqim ↔ texkarta bog'lanishi ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_movement_techcard (
  id                  SERIAL PRIMARY KEY,
  movement_id         INTEGER NOT NULL,
  -- technology_cards.id (texkarta). tech_card_bom.technology_card_id shu id.
  technology_card_id  INTEGER NOT NULL,
  -- chiqarilayotgan material gofra qavati (EP-WMS-085) — ixtiyoriy.
  issued_layer        INTEGER,
  -- gate natijasi auditi: 'ALLOWED' | 'BLOCK_TECH_CARD_MISMATCH' | 'BLOCK_GOFRA_LAYER_MISMATCH'
  gate_result         VARCHAR(40),
  gate_message        TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bitta harakat = bitta texkarta bog'lanishi (upsert uchun).
CREATE UNIQUE INDEX IF NOT EXISTS ux_pos_movement_techcard_movement
  ON pos_movement_techcard (movement_id);

CREATE INDEX IF NOT EXISTS ix_pos_movement_techcard_techcard
  ON pos_movement_techcard (technology_card_id);

-- ─── 2. Inventar farqi avto-tasdiq chegarasi ───────────────────────────────
CREATE TABLE IF NOT EXISTS pos_variance_config (
  id                      SERIAL PRIMARY KEY,
  -- NULL = global default; aks holda shu ombor uchun maxsus chegara.
  warehouse_id            INTEGER,
  -- Avto-tasdiq miqdor-farqi chegarasi (foiz). |variance|/system_qty*100 shu
  -- foizdan kichik/teng bo'lsa avto-tasdiq.
  auto_approve_qty_pct    NUMERIC(8,3) NOT NULL DEFAULT 2.000,
  -- Avto-tasdiq qiymat-farqi chegarasi (so'm, absolyut). |value_variance| shu
  -- summadan kichik/teng bo'lsa avto-tasdiq.
  auto_approve_value_uzs  NUMERIC(18,2) NOT NULL DEFAULT 50000.00,
  -- Ikki chegaradan biri oshsa → escalate (menejer-tasdiq) deb hisoblanadi.
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  notes                   TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bitta ombor uchun bitta config VA global default uchun ham bitta (NULL).
-- COALESCE(warehouse_id, -1) — NULL global qatorni -1 ga normallashtirib,
-- bitta unique indeks bilan ham ombor-config, ham global default'ni bitta qiladi.
CREATE UNIQUE INDEX IF NOT EXISTS ux_pos_variance_config_scope
  ON pos_variance_config (COALESCE(warehouse_id, -1));

-- Global default seed (idempotent). Egasi keyinchalik UPDATE qiladi (egasi-DATA).
INSERT INTO pos_variance_config (warehouse_id, auto_approve_qty_pct, auto_approve_value_uzs, notes)
SELECT NULL, 2.000, 50000.00, 'P4 global default — egasi har ombor uchun aniq limitni belgilaydi'
WHERE NOT EXISTS (
  SELECT 1 FROM pos_variance_config WHERE warehouse_id IS NULL
);
