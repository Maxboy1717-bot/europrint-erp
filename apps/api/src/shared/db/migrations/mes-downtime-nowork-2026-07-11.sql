-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 08-mes #86 — 'ish yo'q' (no-work) downtime'dan alohida kategoriya
-- ============================================================================
-- Vision: TASDIQ-2146 §08 #36 — "ish yo'q"ni downtime'dan alohida hisoblash.
-- mes_downtime_reasons jadvali ALLAQACHON mavjud (schema-business-c-1.ts) va MES
-- modulida ulangan (GET /api/mes/downtime-reasons). Bu YANGI jadval EMAS — faqat
-- bitta additive qator (Q-35: additive seed). "ish yo'q" = operator aybi
-- bo'lmagan bo'sh vaqt (topshiriq berilmagan); OEE availability jarimasidan
-- CHIQARILADI va alohida hisoblanadi (rejali to'xtash EMAS, rejasiz brak EMAS).
-- Label o'zini o'zi belgilaydi — egasi DATA'si shart emas (Q-40). Idempotent:
-- ON CONFLICT (code) DO NOTHING (mes_downtime_reasons_code_key unique mavjud).
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
    ('DT-NOWORK', 'Ish yo''q (topshiriq berilmagan bo''sh vaqt)', 'no-work', true, true, NOW())
  ON CONFLICT (code) DO NOTHING;
END $$;
