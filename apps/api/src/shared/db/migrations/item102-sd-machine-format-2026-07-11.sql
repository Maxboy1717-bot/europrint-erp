-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #102 (EP-SD) — Mashina formati (72 / 52SM / KVA) tavsiya + narx.
--   Vizyon: har kotirovka-qatorida qaysi bosma mashina formati tanlanadi (72 / 52SM / KVA); format
--   list o'lchami/material sarfini mustaqil belgilaydi. "Narx-tavsiya" qismi format bo'yicha narx
--   jadvalidan keladi — jadval BO'SH-narx boshlanadi, egasi CRUD orqali to'ldiradi (narx + list
--   o'lchami = egasi master-data). Format kodlari (72/52SM/KVA) vizyonda ANIQ berilgan → 3 qator
--   seed qilinadi (narx/o'lcham NULL). Kanonik qatorlar jadvali = sd_quotation_items (STANDARTLAR §15;
--   carton dims + print_colors shu yerda) — fork YO'Q.
--   Sof qo'shimcha: sd_quotation_items.machine_format nullable (mavjud qatorlar NULL → regress yo'q);
--   sd_machine_format_prices yangi lookup (CREATE IF NOT EXISTS + WHERE NOT EXISTS seed).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sd_quotation_items' AND column_name='machine_format') THEN
    ALTER TABLE sd_quotation_items ADD COLUMN machine_format varchar(10);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sd_machine_format_prices (
  id                       serial PRIMARY KEY,
  format_code              varchar(10)  NOT NULL,
  label                    varchar(120),
  max_sheet_width_mm       numeric(10,2),
  max_sheet_height_mm      numeric(10,2),
  price_per_1000_sheets    numeric(14,2),
  price_adjustment_percent numeric(6,2) DEFAULT 0,
  is_active                boolean      NOT NULL DEFAULT true,
  tenant_id                integer      NOT NULL DEFAULT 1,
  created_at               timestamp    NOT NULL DEFAULT now(),
  updated_at               timestamp    NOT NULL DEFAULT now(),
  deleted_at               timestamp
);

-- Bir format-kod bir marta (soft-delete hisobga olib) — partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS ux_sd_machine_format_prices_code
  ON sd_machine_format_prices (format_code) WHERE deleted_at IS NULL;

-- Vizyon-berilgan 3 format kodi seed (narx/o'lcham NULL → egasi CRUD bilan to'ldiradi). Additive.
INSERT INTO sd_machine_format_prices (format_code, label)
SELECT v.code, v.label FROM (VALUES
  ('72',   'Format 72 sm'),
  ('52SM', 'Format 52 sm'),
  ('KVA',  'KVA (katta format)')
) AS v(code, label)
WHERE NOT EXISTS (SELECT 1 FROM sd_machine_format_prices p WHERE p.format_code = v.code);
