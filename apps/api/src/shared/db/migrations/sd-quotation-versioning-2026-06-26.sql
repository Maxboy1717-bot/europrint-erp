-- sd-quotation-versioning-2026-06-26.sql
-- A44 SD — Kotirovka (quotation) versiyalash. Vizyon: har o'zgarishda yangi versiya.
--
-- Konteks: `sd_quotations` = VIEW over base table `quotations` (relkind='v', insertable+updatable).
--   Versiyalash uchun (1) base `quotations` ga `version` ustun qo'shiladi (default 1),
--   (2) VIEW qayta yaratiladi (yangi ustunni ko'rsatish uchun — oddiy CREATE OR REPLACE ustunni
--   oxiriga qo'shadi), (3) `sd_quotation_revisions` tarix jadvali yaratiladi (har edit'da oldingi
--   holat snapshot bo'lib yoziladi).
--
-- Additive/relaxing only. quotations = 0 rows (build phase, safe). Hech qanday mavjud ustun
-- o'zgarmaydi, hech narsa o'chirilmaydi. version default=1 → mavjud yozuvlar v1 bo'ladi.
--
-- DB-PROOF (rollback-tx, 2026-06-26): v1->v2->v3 view orqali INSERT/UPDATE + revision trail PASS.
--
-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
--   (T18-C3-CRM-GATED — additiv: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW [version oxirida, non-destructive] + CREATE TABLE IF NOT EXISTS).

-- 1. Base jadvalga version ustuni (optimistik emas — revizion versiya: har edit +1)
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- 2. VIEW ni version ustuni bilan qayta yarat (mavjud ustunlar tartibi saqlanadi, version oxirida)
CREATE OR REPLACE VIEW public.sd_quotations AS
  SELECT id, quotation_number, customer_id, customer_name, quotation_date, valid_until, status, currency,
    net_value, tax_amount, total_value, payment_terms, notes, markup_percent, vat_rate, manager_id,
    converted_to_order_id, created_by, created_at, updated_at, deleted_at, lead_id, total_price, cost_price,
    margin, sent_at, approved_at, order_id, total_amount, version
  FROM public.quotations;

-- 3. Revizion tarix jadvali — har edit'dan OLDINGI holat shu yerga yoziladi (immutable snapshot)
CREATE TABLE IF NOT EXISTS public.sd_quotation_revisions (
  id               serial PRIMARY KEY,
  quotation_id     integer NOT NULL,
  version          integer NOT NULL,
  quotation_number varchar(30),
  customer_id      integer,
  customer_name    text,
  status           varchar(20),
  valid_until      varchar(10),
  payment_terms    varchar,
  notes            text,
  total_price      numeric,
  total_amount     numeric,
  total_value      numeric,
  markup_percent   numeric,
  vat_rate         numeric,
  snapshot         jsonb,
  changed_by       integer,
  change_reason    text,
  created_at       timestamp NOT NULL DEFAULT NOW()
);

-- Bitta versiya — bir marta (idempotent snapshot kafolati)
CREATE UNIQUE INDEX IF NOT EXISTS sd_quotation_revisions_q_ver_uq
  ON public.sd_quotation_revisions (quotation_id, version);
CREATE INDEX IF NOT EXISTS sd_quotation_revisions_q_idx
  ON public.sd_quotation_revisions (quotation_id);
