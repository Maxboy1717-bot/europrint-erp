-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 19-pos#17 — clean-additive columns, no owner decision needed.
-- Vision (vision-1000-answers/19-pos.md #17): shoshilinch/rejasiz chiqimga ruxsat, lekin
-- sabab (pos_movements.notes) majburiy + is_unplanned=true bayrog'i; PP kunlik reja balansi
-- O'ZGARMAYDI — shoshilinch chiqim "og'ish" hisobiga o'tadi (variance_qty ustunida qaydlanadi).
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS is_unplanned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS variance_qty NUMERIC(18,4);

COMMENT ON COLUMN pos_movements.is_unplanned IS '19-pos#17: shoshilinch/rejasiz chiqim bayrog''i (INTERNAL_ISSUE) — true bo''lsa sabab (notes) majburiy, boshliqqa real-time Telegram push yuboriladi.';
COMMENT ON COLUMN pos_movements.variance_qty IS '19-pos#17: shoshilinch chiqim miqdori — PP kunlik reja balansini o''zgartirmaydi, "og''ish" sifatida shu ustunda alohida qaydlanadi.';

CREATE INDEX IF NOT EXISTS idx_pos_movements_is_unplanned ON pos_movements (is_unplanned) WHERE is_unplanned = true;
