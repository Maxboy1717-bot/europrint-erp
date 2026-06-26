-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/t20-b2-ckp-engine-2026-06-26.sql
-- T20-B2-CKP-ENGINE — ЦКП-dvigatel (gap #12,#10,#14).
-- APPROVED: egasi 'hamma vizyon' 2026-06-26
--   ADDITIV + idempotent (CREATE/ALTER IF NOT EXISTS, seed ON CONFLICT). DESTRUCTIVE YO'Q.
--   FABRIKATSIYA YO'Q (Q-40): norma-QIYMATLAR (target_value) egasi-data → BO'SH qoladi;
--   bu yerda faqat STRUKTURA + lookup quriladi. Soxta norma YOZILMAYDI.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- GAP #12 — ЦКП formula-turi (per-karta) ustuni.
--   org_departments.tskp_formula_type — achievement% hisoblash usuli (4-variant):
--     'quantity_pct' (bajarilgan/norma %), 'foiz' (actual o'zi foiz),
--     'vaqt' (vaqt-norma: norma/actual teskari), 'boolean' (ha/yo'q -> 100/0).
--   NULL -> service 'quantity_pct' default (CKP_DEFAULT_FORMULA_TYPE). Mavjud
--   `ckp_formula_type` (text) BUZILMAYDI — service ikkalasini ham o'qiydi
--   (tskp_formula_type ustun, keyin ckp_formula_type fallback).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS tskp_formula_type text;

-- Qiymat-domeni CHECK (faqat 4 kanonik tur yoki NULL). NOT VALID emas — additiv,
-- mavjud qatorlar NULL (hali to'ldirilmagan) → buzmaydi. IF NOT EXISTS emulyatsiyasi.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_org_departments_tskp_formula_type'
      AND conrelid = 'org_departments'::regclass
  ) THEN
    ALTER TABLE org_departments
      ADD CONSTRAINT ck_org_departments_tskp_formula_type
      CHECK (tskp_formula_type IS NULL OR tskp_formula_type IN ('quantity_pct','foiz','vaqt','boolean'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- GAP #10 — ЦКП multi-product slot.
--   ckp_card_products: bitta karta bir nechta mahsulot bo'yicha norma+formula
--   saqlaydi (productId-specifik lookup). target_value egasi-data → NULL-able.
--   Karta-global norma (org_departments.tskp_target) = fallback (bu yerda yo'q product).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ckp_card_products (
  id            serial PRIMARY KEY,
  card_id       integer NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  product_id    integer NOT NULL,
  target_value  numeric,                 -- egasi-data → NULL = norma yo'q (FABRIKATSIYA YO'Q)
  formula_type  text,                    -- NULL -> kartaning tskp_formula_type/default
  measurement_unit varchar(50),
  is_active     boolean NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamp NOT NULL DEFAULT NOW(),
  updated_at    timestamp,
  CONSTRAINT ck_ckp_card_products_formula
    CHECK (formula_type IS NULL OR formula_type IN ('quantity_pct','foiz','vaqt','boolean'))
);
-- Bitta karta+mahsulot = bitta slot (idempotent upsert kaliti).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ckp_card_products_card_product
  ON ckp_card_products (card_id, product_id);
CREATE INDEX IF NOT EXISTS ix_ckp_card_products_card
  ON ckp_card_products (card_id);

-- ─────────────────────────────────────────────────────────────
-- GAP #14 — Per-employee norma override.
--   ckp_personal_targets: aniq xodim uchun aniq karta+davr (period) bo'yicha
--   shaxsiy norma. Bor bo'lsa karta-global o'rniga ustun. target_value egasi-data → NULL-able.
--   period = 'YYYY-MM' (oylik) yoki NULL (umumiy/davrsiz override).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ckp_personal_targets (
  id            serial PRIMARY KEY,
  employee_id   integer NOT NULL,
  card_id       integer NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  product_id    integer,                 -- ixtiyoriy: mahsulot-specifik shaxsiy norma
  period        varchar(7),              -- 'YYYY-MM' yoki NULL (davrsiz)
  target_value  numeric,                 -- egasi-data → NULL = override yo'q (FABRIKATSIYA YO'Q)
  formula_type  text,
  notes         text,
  created_at    timestamp NOT NULL DEFAULT NOW(),
  updated_at    timestamp,
  CONSTRAINT ck_ckp_personal_targets_formula
    CHECK (formula_type IS NULL OR formula_type IN ('quantity_pct','foiz','vaqt','boolean'))
);
-- Bitta xodim+karta+mahsulot+davr = bitta override (COALESCE NULL→0 kaliti — idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ckp_personal_targets_key
  ON ckp_personal_targets (employee_id, card_id, COALESCE(product_id,0), COALESCE(period,''));
CREATE INDEX IF NOT EXISTS ix_ckp_personal_targets_card
  ON ckp_personal_targets (card_id);
CREATE INDEX IF NOT EXISTS ix_ckp_personal_targets_emp
  ON ckp_personal_targets (employee_id);
