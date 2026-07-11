-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- sd-layer-count-2026-07-11.sql
-- 06-sd#147 — Gofroyashik qatlami (2/3/5-sloy) + AI yuk (load) tavsiya
--
-- WHAT (additive, idempotent, Q-46 non-regressive):
--   sd_quotation_items.layer_count  INTEGER NULL
--     Per-order gofra qatlam soni. Standart to'lqin devor konstruksiyalari:
--       2 = single-face, 3 = single-wall, 5 = double-wall, 7 = triple-wall.
--     thickness_mm (fizik o'lchov) dan ALOHIDA maydon. DEFAULT yo'q -> har bir
--     mavjud satr NULL bo'lib qoladi (jonli 0 satr; regress yo'q). Runtime-DATA —
--     egasi master-data'si kerak emas (per-order tanlanadi).
--   + CHECK ck_sd_quotation_items_layer_count: NULL yoki (2,3,5,7) — noto'g'ri
--     qatlam sonini DB darajasida rad etadi. Idempotent DO-blok bilan qo'shiladi.
--
-- KANONIK JADVAL: sd_quotation_items (STANDARTLAR §15) — ALTER shu REAL jadvalga
--   (relkind='r'). sd_quotations = VIEW (relkind='v') — unga tegilmaydi; dublikat
--   fork YARATILMAYDI. Jonli tekshirildi 2026-07-11 (_audit/q.cjs): layer_count
--   ustuni yo'q (PostgreSQL 18.3).
--
-- "AI yuk" tavsiyasi (qatlam -> yuk-ko'tarish oralig'i) NON-BLOCKING: 06-sd#107
--   egasi-to'ldiradigan sd_load_capacity_rules lug'atidan teskari o'qiladi. Bu
--   migration u jadvalni YARATMAYDI (u #107 ga tegishli) — bo'sh/yo'q bo'lsa tavsiya
--   = NULL (kod recR.ok?..:null bilan bloklanmaydi). deps 06-sd#107.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS + constraint DO-blok (IF NOT EXISTS).
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f sd-layer-count-2026-07-11.sql

ALTER TABLE sd_quotation_items ADD COLUMN IF NOT EXISTS layer_count INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_sd_quotation_items_layer_count'
      AND conrelid = 'sd_quotation_items'::regclass
  ) THEN
    ALTER TABLE sd_quotation_items
      ADD CONSTRAINT ck_sd_quotation_items_layer_count
      CHECK (layer_count IS NULL OR layer_count IN (2, 3, 5, 7));
  END IF;
END$$;

-- Seed YO'Q: layer_count per-order tanlanadi (master-data emas). Qatlam->yuk xaritasi
-- 06-sd#107 sd_load_capacity_rules lug'atida (egasi keyin CRUD orqali to'ldiradi).

-- DB-proof (rollback-tx, live europrint 18.3) TASDIQLANDI:
--   column_present={integer,nullable}; item_update.layer_count=5; check_rejects_4=rejected;
--   rec_when_table_absent=null; rec_when_empty=null; rec_for_layers_5={10-20kg,BC};
--   rec_for_layers_2=null; rolled_back=true.
