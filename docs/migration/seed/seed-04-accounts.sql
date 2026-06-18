-- APPROVED: owner (2026-06-18)
-- seed-04-accounts.sql: Hisoblar rejasi (Chart of Accounts — BHMS)
-- O'zbekiston Buxgalteriya Hisobi Milliy Standarti (BHMS) asosida
-- Idempotent: ON CONFLICT (code) DO UPDATE
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-04-accounts.sql
-- ⚠️  GL `entries` jadvaliga yozish uchun `entries.account_id` shu jadvaldan keladi
-- ⚠️  gl_journal_entries TEGMA — SAP#76, o'chirilgan, nol qator

BEGIN;

INSERT INTO accounts (
  code,
  name_uz,
  name_ru,
  type,         -- ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  normal_side,  -- DEBIT | CREDIT
  is_active,
  parent_code,
  created_at,
  updated_at
)
VALUES
  -- =============================================
  -- 1-SINF: UZOQ MUDDATLI AKTIVLAR
  -- =============================================
  ('0100', 'Asosiy vositalar (balans)',              'Основные средства (баланс)',             'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),
  ('0110', 'Yer uchastkalar',                        'Земельные участки',                      'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),
  ('0120', 'Binolar va inshootlar',                  'Здания и сооружения',                    'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),
  ('0130', 'Mashinalar va uskunalar',                'Машины и оборудование',                  'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),
  ('0140', 'Kompyuter va axborot tizimlari',         'Компьютеры и информационные системы',    'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),
  ('0150', 'Transport vositalari',                   'Транспортные средства',                  'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),
  ('0160', 'Asbob-uskunalar va jihoz',               'Инструменты и инвентарь',               'ASSET',     'DEBIT',  true, '0100', NOW(), NOW()),

  ('0200', 'Amortizatsiya (asosiy vositalar)',        'Амортизация (основные средства)',        'ASSET',     'CREDIT', true, NULL,   NOW(), NOW()),

  -- =============================================
  -- 2-SINF: AYLANMA AKTIVLAR
  -- =============================================
  ('1000', 'Tovar-moddiy boyliklar (TMB)',           'Товарно-материальные ценности',          'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),
  ('1010', 'Xom ashyo va materiallar',               'Сырье и материалы',                      'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),
  ('1020', 'Yordamchi materiallar',                  'Вспомогательные материалы',              'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),
  ('1030', 'Yoqilg''i',                              'Топливо',                                'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),
  ('1040', 'Ehtiyot qismlar',                        'Запасные части',                         'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),
  ('1060', 'Tayyor mahsulotlar',                     'Готовая продукция',                      'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),
  ('1070', 'Tovarlar (qayta sotish uchun)',           'Товары (для перепродажи)',               'ASSET',     'DEBIT',  true, '1000', NOW(), NOW()),

  -- Pul mablag'lari
  ('1100', 'Kassa (naqd pul)',                       'Касса (наличные)',                       'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),
  ('1110', 'Hisob-raqam (bank)',                     'Расчётный счёт (банк)',                  'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),
  ('1120', 'Chet el valyutasidagi hisob',            'Счёт в иностранной валюте',              'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),

  -- Debitorlik
  ('1200', 'Debitorlar (xaridorlar)',                'Дебиторы (покупатели)',                  'ASSET',     'DEBIT',  true, NULL,   NOW(), NOW()),
  ('1210', 'Xaridor va buyurtmachilar',              'Покупатели и заказчики',                 'ASSET',     'DEBIT',  true, '1200', NOW(), NOW()),
  ('1220', 'Bo''naklar (xaridorlardan)',              'Авансы (от покупателей)',                'ASSET',     'DEBIT',  true, '1200', NOW(), NOW()),
  ('1230', 'Xodimlar bilan hisob-kitob',             'Расчёты с сотрудниками',                'ASSET',     'DEBIT',  true, '1200', NOW(), NOW()),

  -- =============================================
  -- 3-SINF: KAPITAL VA ZAXIRALAR
  -- =============================================
  ('3000', 'Ustav kapitali',                         'Уставный капитал',                       'EQUITY',    'CREDIT', true, NULL,   NOW(), NOW()),
  ('3100', 'Qo''shimcha kapital',                    'Добавочный капитал',                     'EQUITY',    'CREDIT', true, NULL,   NOW(), NOW()),
  ('3400', 'Taqsimlanmagan foyda (zarar)',           'Нераспределённая прибыль (убыток)',       'EQUITY',    'CREDIT', true, NULL,   NOW(), NOW()),

  -- =============================================
  -- 4-SINF: UZOQ MUDDATLI MAJBURIYATLAR
  -- =============================================
  ('4000', 'Uzoq muddatli kreditlar va qarzlar',    'Долгосрочные кредиты и займы',           'LIABILITY', 'CREDIT', true, NULL,   NOW(), NOW()),

  -- =============================================
  -- 5-SINF: JORIY MAJBURIYATLAR
  -- =============================================
  ('6000', 'Kreditorlar (etkazib beruvchilar)',      'Кредиторы (поставщики)',                 'LIABILITY', 'CREDIT', true, NULL,   NOW(), NOW()),
  ('6010', 'Etkazib beruvchilar va pudratchilar',    'Поставщики и подрядчики',               'LIABILITY', 'CREDIT', true, '6000', NOW(), NOW()),
  ('6020', 'Bo''naklar (etkazib beruvchilarga)',      'Авансы (поставщикам)',                  'LIABILITY', 'CREDIT', true, '6000', NOW(), NOW()),
  ('6300', 'Mehnatga haq to''lash bo''yicha qarz',  'Задолженность по зарплате',              'LIABILITY', 'CREDIT', true, NULL,   NOW(), NOW()),
  ('6400', 'Soliq va yig''imlar bo''yicha qarz',    'Задолженность по налогам',               'LIABILITY', 'CREDIT', true, NULL,   NOW(), NOW()),
  ('6410', 'NDFL (daromad solig''i)',                'НДФЛ (подоходный налог)',                'LIABILITY', 'CREDIT', true, '6400', NOW(), NOW()),
  ('6420', 'INPS (ijtimoiy sug''urta)',              'ИНПС (социальное страхование)',          'LIABILITY', 'CREDIT', true, '6400', NOW(), NOW()),
  ('6430', 'QQS (qo''shimcha qiymat solig''i)',     'НДС (налог на добавленную стоимость)',    'LIABILITY', 'CREDIT', true, '6400', NOW(), NOW()),

  -- =============================================
  -- 6-SINF: DAROMADLAR
  -- =============================================
  ('9000', 'Asosiy faoliyat daromadlari',            'Доходы от основной деятельности',       'REVENUE',   'CREDIT', true, NULL,   NOW(), NOW()),
  ('9010', 'Mahsulot sotishdan daromad',             'Выручка от реализации продукции',        'REVENUE',   'CREDIT', true, '9000', NOW(), NOW()),
  ('9020', 'Xizmat ko''rsatishdan daromad',          'Доходы от услуг',                       'REVENUE',   'CREDIT', true, '9000', NOW(), NOW()),
  ('9030', 'Boshqa daromadlar',                      'Прочие доходы',                          'REVENUE',   'CREDIT', true, '9000', NOW(), NOW()),

  -- =============================================
  -- 7-SINF: XARAJATLAR
  -- =============================================
  ('2000', 'Ishlab chiqarish xarajatlari',           'Затраты на производство',               'EXPENSE',   'DEBIT',  true, NULL,   NOW(), NOW()),
  ('2010', 'Xom ashyo va material xarajati',         'Материальные затраты',                  'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),
  ('2020', 'Mehnat haqi xarajatlari',                'Затраты на оплату труда',               'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),
  ('2030', 'INPS (ishlab chiqarish)',                'ИНПС (производство)',                    'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),
  ('2040', 'Amortizatsiya xarajati',                 'Амортизационные отчисления',             'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),
  ('2050', 'Elektr energiya xarajati',               'Расходы на электроэнергию',             'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),
  ('2060', 'Boshqa ishlab chiqarish xarajatlari',    'Прочие производственные затраты',       'EXPENSE',   'DEBIT',  true, '2000', NOW(), NOW()),

  ('8000', 'Sotishga sarflangan xarajatlar',         'Расходы на продажу',                    'EXPENSE',   'DEBIT',  true, NULL,   NOW(), NOW()),
  ('8010', 'Marketing va reklama',                   'Маркетинг и реклама',                   'EXPENSE',   'DEBIT',  true, '8000', NOW(), NOW()),
  ('8100', 'Ma''muriy va boshqaruv xarajatlari',     'Административные расходы',               'EXPENSE',   'DEBIT',  true, NULL,   NOW(), NOW()),
  ('8110', 'Ma''muriy xodimlar ish haqi',            'Зарплата административного персонала',  'EXPENSE',   'DEBIT',  true, '8100', NOW(), NOW()),
  ('8120', 'Ofis va aloqa xarajatlari',              'Офисные и коммуникационные расходы',    'EXPENSE',   'DEBIT',  true, '8100', NOW(), NOW())

ON CONFLICT (code) DO UPDATE SET
  name_uz     = EXCLUDED.name_uz,
  name_ru     = EXCLUDED.name_ru,
  type        = EXCLUDED.type,
  normal_side = EXCLUDED.normal_side,
  is_active   = EXCLUDED.is_active,
  parent_code = EXCLUDED.parent_code,
  updated_at  = NOW();

COMMIT;

-- ============================================================
-- STANDART GL OPERATSIYALAR (qo'llanma)
-- ============================================================
-- Sotish:    DEBIT  1210 (Xaridor)     | CREDIT 9010 (Daromad)
-- Kirim to'lov: DEBIT 1110 (Bank)     | CREDIT 1210 (Xaridor)
-- Xarid:    DEBIT  1010 (Material)    | CREDIT 6010 (Etkazib beruvchi)
-- Chiqim to'lov: DEBIT 6010 (Etkazib) | CREDIT 1110 (Bank)
-- Maosh:    DEBIT  2020 (Ish haqi x)  | CREDIT 6300 (Qarz xodimlarga)
-- Maosh to'lov: DEBIT 6300 (Qarz)     | CREDIT 1110 (Bank)
-- Naqd kirim:   DEBIT 1100 (Kassa)    | CREDIT 1110 (Bank)

-- Tekshirish:
-- SELECT code, name_uz, type, normal_side FROM accounts ORDER BY code;
-- SELECT COUNT(*) FROM accounts; -- 42 ta bo'lishi kerak
