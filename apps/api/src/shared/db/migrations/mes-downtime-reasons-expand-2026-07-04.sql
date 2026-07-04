-- ============================================================================
-- SB0417/SB0441 — mes_downtime_reasons: 7 -> 16 standart TPM to'xtash sababi
-- ============================================================================
-- mes_downtime_reasons jadvali allaqachon mavjud va MES modulida to'liq ulangan
-- (GET /api/mes/downtime-reasons, POST /api/mes/downtime-events reason_id FK
-- orqali) — bu yangi jadval EMAS, faqat qo'shimcha qatorlar (Q-35: additive seed).
-- Ro'yxat TPM/OEE "olti katta yo'qotish" (six big losses) umumiy sanoat
-- taksonomiyasiga asoslangan (fabrikatsiya emas — Q-40), egasi keyinchalik
-- o'ziga xos kodlarni qo'shishi/o'zgartirishi mumkin.
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
    -- breakdown (rejasiz uskuna nosozligi)
    ('DT-HYDR',    'Gidravlika nosozligi',              'breakdown',     false, true, NOW()),
    ('DT-SENSOR',  'Datchik/nazorat nosozligi',          'breakdown',     false, true, NOW()),
    -- material (material/xomashyo)
    ('DT-MAT-QUAL','Material sifati muvofiq emas',       'material',      false, true, NOW()),
    ('DT-MAT-WAIT','Materialni kutish (yetkazib berish)','material',      false, true, NOW()),
    -- setup / changeover (rejalashtirilgan sozlash)
    ('DT-CHANGEOVER','Mahsulot almashinuvi (changeover)','setup',         true,  true, NOW()),
    ('DT-CALIBRATE', 'Mashina kalibrlash',               'setup',         true,  true, NOW()),
    -- quality (sifat nazorati sababli to'xtash)
    ('DT-QUAL-REWORK','Qayta ishlov (rework) sababli to''xtash','quality',false, true, NOW()),
    -- organizational (tashkiliy — kutish, brifing va h.k.)
    ('DT-BRIEFING','Smena brifingi',                     'organizational',true,  true, NOW()),
    ('DT-STAFF',   'Xodim yetishmovchiligi',              'organizational',false, true, NOW())
  ON CONFLICT (code) DO NOTHING;
END $$;
