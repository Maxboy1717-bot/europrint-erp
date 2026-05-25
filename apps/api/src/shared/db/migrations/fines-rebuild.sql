-- ============================================================================
-- Migration: fines-rebuild.sql
--
-- PRD Q126-127: Jarima tizimini qayta tashkil etish.
--
-- Asosiy printsiplar:
--   - Severity: minor (1) → major (2) → serious (3) → critical (4) → terminate (5)
--   - Mushtlashish/Xavfsizlik = ISHDAN BO'SHATISH (eng yuqori)
--   - Telefon ishlatish = MINOR (kichik)
--   - Mantiqiy izchillik: zarar darajasiga proporsional jarima
--   - Avto-eskalatsiya: 3+ minor → major; 3+ major → serious; va h.k.
-- ============================================================================

-- ─── 1. fine_rules — jarima qoidalari ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS fine_rules (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(200) NOT NULL,
  name_ru         VARCHAR(200),
  category        VARCHAR(50) NOT NULL,  -- 'safety', 'discipline', 'tech', 'attendance', 'tools', 'communication'
  severity        VARCHAR(20) NOT NULL,  -- 'minor', 'major', 'serious', 'critical', 'terminate'
  fine_amount     NUMERIC(12,2) DEFAULT 0,
  description     TEXT,
  -- Eskalatsiya: 3 marta minor → 1 marta major
  escalation_count INTEGER,           -- nechta takrorlanishi kerak
  escalation_to   VARCHAR(20),        -- qanday severity'ga
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Tartibga solingan jarima qoidalari ─────────────────────────────────
INSERT INTO fine_rules (code, name, name_ru, category, severity, fine_amount, description, escalation_count, escalation_to)
SELECT * FROM (VALUES
  -- ─── XAVFSIZLIK (eng yuqori) ─────────────────────────────────────────────
  ('SAFETY_FIGHT',          'Mushtlashish, jismoniy nizo', 'Драка',                  'safety',     'terminate', 0,         'Ishdan bo''shatish + mehnat shartnomasi bekor qilinadi', NULL, NULL),
  ('SAFETY_VIOLATION',      'Xavfsizlik qoidalari buzilishi', 'Нарушение ТБ',         'safety',     'critical',  500000,    'Yong''in xavfi, elektr qisqasi va h.k.',                  3,    'terminate'),
  ('SAFETY_NO_PPE',         'Himoya vositasi ishlatmaslik (PPE)', 'Без СИЗ',          'safety',     'major',     200000,    'Qo''lqop, dubulg''a, ko''zoynak yo''q',                   3,    'critical'),

  -- ─── INTIZOM ─────────────────────────────────────────────────────────────
  ('DISC_LATE_30MIN',       'Kechikish (30 daq gacha)',     'Опоздание до 30 мин',   'attendance', 'minor',     50000,     'Ishga 30 daqiqagacha kech kelish',                       3,    'major'),
  ('DISC_LATE_HOUR',        'Kechikish (1 soatdan ortiq)',  'Опоздание более 1 часа','attendance', 'major',     150000,    'Ishga 1+ soat kech kelish',                              3,    'serious'),
  ('DISC_NO_REPORT',        'Sababsiz ishga kelmaslik',     'Прогул',                'attendance', 'serious',   500000,    '1 kun sababsiz, dalolatnomasiz',                         3,    'terminate'),
  ('DISC_3DAY_ABSENCE',     '3+ kun sababsiz',              '3+ дней без причины',   'attendance', 'terminate', 0,         'Ishdan bo''shatish (Mehnat kodeksi)',                    NULL, NULL),
  ('DISC_DRUNK',            'Mast holatda ishga kelish',    'Появление в нетрезвом виде','discipline','terminate',0,        'Ishdan bo''shatish + mehnat shartnomasi bekor qilinadi', NULL, NULL),
  ('DISC_THEFT',            'O''g''irlik yoki firibgarlik', 'Кража или мошенничество','discipline','terminate', 0,         'Ishdan bo''shatish + huquqiy javobgarlik',               NULL, NULL),

  -- ─── TEXNIK QOIDABUZARLIKLAR ────────────────────────────────────────────
  ('TECH_MACHINE_BREAK',    'Uskunani ishlatish qoidasini buzish', 'Нарушение эксплуатации', 'tech', 'major',  300000,    'Standart bo''lmagan ishlash, zarar yetkazish',           2,    'serious'),
  ('TECH_QUALITY_DEFECT',   'Sifatsiz ish (yaroqsiz mahsulot)', 'Брак в работе',     'tech',       'major',     200000,    'QC tomonidan ko''rsatilgan brak',                        3,    'serious'),
  ('TECH_NO_CLEANING',      'Ish joyini tozalamaslik',      'Не убрано рабочее место','tech',     'minor',     30000,     'Smena tugashida ish joyi tartibsiz',                     5,    'major'),

  -- ─── ALOQA / KOMMUNIKATSIYA ─────────────────────────────────────────────
  ('COMM_PHONE_USE',        'Ish vaqtida telefon ishlatish', 'Использование телефона','communication','minor',  20000,     'Shaxsiy telefon, social media',                          5,    'major'),
  ('COMM_NO_REPORT',        'Kunlik hisobot bermaslik',     'Не сдан отчёт',         'communication','minor',   30000,     'Bot orqali yuborilmagan',                                3,    'major'),
  ('COMM_DISRESPECT',       'Hamkasblarni hurmatsiz',       'Неуважительное отношение','communication','major', 100000,    'Janjal, qo''pollik',                                     2,    'serious'),

  -- ─── ASBOB-USKUNA / OMBOR ───────────────────────────────────────────────
  ('TOOLS_LOSS',            'Asbobni yo''qotish',           'Потеря инструмента',    'tools',      'major',     0,         'Asbob qiymati 100% xodimdan undirib olinadi',            2,    'serious'),
  ('TOOLS_DAMAGE',          'Asbobga zarar yetkazish',      'Повреждение инструмента','tools',     'minor',     0,         'Tuzatish narxi xodimdan',                                3,    'major'),
  ('STOCK_UNAUTHORIZED',    'Ruxsatsiz ombor olish',        'Несанкционированный отбор','tools',   'serious',   500000,    'Ruxsat hujjatisiz olib chiqib ketish',                   1,    'terminate'),

  -- ─── HUJJAT QOIDABUZARLIKLAR ─────────────────────────────────────────────
  ('DOC_FORGERY',           'Hujjat soxtalashtirish',       'Подделка документов',   'discipline', 'terminate', 0,         'Ishdan bo''shatish + huquqiy javobgarlik',               NULL, NULL),
  ('DOC_LATE_SUBMIT',       'Hujjatni vaqtida topshirmaslik', 'Несвоевременная сдача','communication','minor',  50000,     'Vaqtida imzolanmagan/topshirilmagan',                    3,    'major')
) AS r(code, name, name_ru, category, severity, fine_amount, description, escalation_count, escalation_to)
WHERE NOT EXISTS (SELECT 1 FROM fine_rules WHERE code = r.code);

-- ─── 3. Discipline records — fine_rule_id qo'shish (link) ──────────────────
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS fine_rule_id INTEGER REFERENCES fine_rules(id);
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS auto_escalated BOOLEAN DEFAULT false;

-- ─── 4. Mavjud yozuvlarning severity'ni yangi tizimga moslashtirish ─────
UPDATE discipline_records SET severity = 'minor' WHERE severity IS NULL OR severity = '';

-- ─── 5. Verify ─────────────────────────────────────────────────────────────
SELECT category, severity, COUNT(*) AS rules
FROM fine_rules
WHERE is_active = true
GROUP BY category, severity
ORDER BY category, severity;

SELECT 'fine_rules' AS t, COUNT(*) FROM fine_rules
UNION ALL SELECT 'discipline_records', COUNT(*) FROM discipline_records;
