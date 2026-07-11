-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 08-mes #87 — qolip/pichoq-shakl (mold/die) almashtirish downtime kategoriyasi
-- ============================================================================
-- Vision: TASDIQ-2146 §08 — qolip almashtirish alohida sabab sifatida ajratilsin
-- (mexanik nosozlik yoki material tugashi bilan aralashtirilmasin — har xil
-- ildiz-sabab, har xil oldini olish choralari). mes_downtime_reasons jadvali
-- ALLAQACHON mavjud va MES modulida ulangan; bu faqat additive qator (Q-35).
-- Idempotent: ON CONFLICT (code) DO NOTHING.
-- ============================================================================

DO $$
DECLARE
  has_table BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mes_downtime_reasons')
    INTO has_table;

  IF NOT has_table THEN
    RAISE NOTICE 'mes_downtime_reasons jadvali topilmadi — seed o''tkazib yuborildi';
    RETURN;
  END IF;

  INSERT INTO mes_downtime_reasons (code, name, category, is_planned, is_active, created_at) VALUES
    ('DT-MOLD', 'Qolip/pichoq-shakl almashtirish', 'changeover', true, true, NOW())
  ON CONFLICT (code) DO NOTHING;
END $$;
