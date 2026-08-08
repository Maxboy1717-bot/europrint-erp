-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 08-mes #34 — Gofra (2/5 qatlam) ishini м2 + qatlam soni bilan alohida hisoblash
-- ============================================================================
-- Vision: EP-MES-059 (docs/audit/decisions/08-mes.md:426-431) — "gofra liniyasi м2 +
-- qatlam soni alohida (to'g'ri o'lchov + material). Forma 'ЛИНИЯ 5 слой', 'Формат
-- гофро (2-слой)', 'Гф линия (м2)'." Kitob izohi: 5/3-qatlam aralashtirib yuborilishi
-- (logistika xatosi) — shu xatoni oldini olish uchun qatlam soni ALOHIDA maydon
-- (format_a/format_b/gramm bilan aralashtirilmaydi — ular flekso/ofset formatga
-- tegishli, bu esa gofra-xos qatlam+maydon). Additive, faqat gofra ishida to'ldiriladi
-- (boshqa texnologiya turlari uchun NULL).
-- ============================================================================

ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS gofra_layer_count SMALLINT,
  ADD COLUMN IF NOT EXISTS gofra_area_m2 NUMERIC(10,2);

COMMENT ON COLUMN production_sessions.gofra_layer_count IS
  '08-mes#34: Gofra qatlam soni (masalan 2, 3, 5) — flekso/ofset formatdan (format_a/b/gramm) ALOHIDA, aralashtirib bo''lmaydi.';
COMMENT ON COLUMN production_sessions.gofra_area_m2 IS
  '08-mes#34: Gofra liniyasi ishlab chiqargan maydon, m² (EP-MES-059 "Гф линия (м2)").';
