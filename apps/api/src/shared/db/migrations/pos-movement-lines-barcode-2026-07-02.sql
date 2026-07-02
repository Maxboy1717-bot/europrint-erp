-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
-- G1-1 BARKOD SERVER-GATE (POS terminal): EXTERNAL_IN kirim qatorlarida barkod
-- majburiy (egasi: "barcode bo'lmasa qabul qilmaydi", kitob 18400-18402).
-- Additive-only: pos_movement_lines ga barcode ustuni (avval FE yuborardi, BE tashlab yubordi).
ALTER TABLE pos_movement_lines ADD COLUMN IF NOT EXISTS barcode text;
CREATE INDEX IF NOT EXISTS idx_pos_mv_lines_barcode ON pos_movement_lines (barcode);
