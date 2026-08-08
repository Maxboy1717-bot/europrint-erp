-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- sd-load-capacity-flute-layer-2026-07-11.sql
-- 06-sd#107 — Gruzopodyomnost (kg) → gofra qatlam/flute AI tavsiya
--
-- WHAT (additive, idempotent, Q-46 non-regressive):
--   1. sd_quotation_items.load_capacity_kg  NUMERIC(12,3) NULL
--        Per-order yuk-ko'tarish talabi (kg). DEFAULT yo'q -> har bir mavjud satr
--        NULL bo'lib qoladi (jonli 0 satr; regress yo'q). Runtime-DATA — egasi
--        master-data'si kerak emas.
--   2. sd_load_capacity_rules — YANGI, BO'SH owner-fillable lookup jadval (Q-35).
--        Yuk-oralig'i (kg) -> tavsiya etilgan qatlam soni + flute profil. BO'SH
--        boshlanadi: haqiqiy weight->konstruksiya xaritasi ishlab-chiqarish
--        muhandisligi DATA'sini talab qiladi (egasi keyin CRUD orqali to'ldiradi).
--        Bo'sh jadval -> tavsiya = NULL (non-blocking); hardcoded/soxta mapping YO'Q.
--
-- KANONIK JADVAL: sd_quotation_items (STANDARTLAR §15) — ALTER shu REAL jadvalga
--   (relkind='r'); sd_quotations = VIEW (relkind='v'), unga tegilmaydi; dublikat fork
--   YARATILMAYDI. Jonli tekshirildi 2026-07-11 (_audit/q.cjs): load_capacity_kg ustuni
--   yo'q; sd_load_capacity_rules jadvali yo'q.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS + CREATE TABLE/INDEX IF NOT EXISTS.
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f sd-load-capacity-flute-layer-2026-07-11.sql

ALTER TABLE sd_quotation_items ADD COLUMN IF NOT EXISTS load_capacity_kg NUMERIC(12,3);

CREATE TABLE IF NOT EXISTS sd_load_capacity_rules (
  id                   SERIAL PRIMARY KEY,
  min_load_kg          NUMERIC(12,3) NOT NULL DEFAULT 0,
  max_load_kg          NUMERIC(12,3),
  recommended_layers   INTEGER,
  recommended_flute    VARCHAR(10),
  note                 TEXT,
  is_active            BOOLEAN       NOT NULL DEFAULT true,
  tenant_id            INTEGER       NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sd_load_capacity_rules_active_range
  ON sd_load_capacity_rules (is_active, min_load_kg, max_load_kg);

-- Seed YO'Q: weight->konstruksiya xaritasi egasi/ishlab-chiqarish DATA'si, keyin CRUD
-- orqali to'ldiriladi. Bo'sh jadval => tavsiya NULL (non-blocking).

-- DB-proof (rollback-tx, live europrint) TASDIQLANDI:
--   column_present={numeric,nullable}; rules_table=sd_load_capacity_rules; rec_when_empty=null;
--   rec_in_range={5,BC}; rec_out_of_range=null; item_update.load_capacity_kg=12.500; rolled_back=true.
