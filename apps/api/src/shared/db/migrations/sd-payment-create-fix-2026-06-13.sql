-- sd-payment-create-fix-2026-06-13.sql
-- #04 SD — make payment-create work. The live `payments` base table has id(uuid)+paid_at(timestamp)+
-- recorded_by(uuid) all NOT NULL with NO default, so every sd_payments INSERT threw 23502 (= why
-- sd_payments had 0 rows). Pending payments legitimately have no paid_at/recorded_by yet, and recorded_by
-- is uuid while app user ids are integer (no clean mapping) → relax to nullable + give id a default.
-- Additive/relaxing only; live payments = 0 rows (safe).
-- APPROVED: owner 2026-06-13

ALTER TABLE public.payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.payments ALTER COLUMN paid_at DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN recorded_by DROP NOT NULL;
