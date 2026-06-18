-- APPROVED: owner (2026-06-18)
-- seed-05-defects.sql: Nuqson katalogi (EuroPrint: gofra, offset, silkscreen, flexi)
-- Idempotent: ON CONFLICT (code) DO NOTHING
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-05-defects.sql
-- AI QC kamerasi va QcInspectionFailedEvent da ishlatiladigan katalog

BEGIN;

INSERT INTO defect_catalog (
  code,
  name_uz,
  name_ru,
  direction,    -- gofra | offset | silkscreen | flexi | universal
  severity,     -- CRITICAL | MAJOR | MINOR
  auto_reject,  -- CRITICAL bo'lsa darrov rad
  description_uz,
  corrective_action_uz,
  created_at,
  updated_at
)
VALUES

  -- =============================================
  -- UNIVERSAL (barcha yo'nalish)
  -- =============================================
  ('DEF-U-001', 'Noto''g''ri o''lcham',       'Неправильный размер',       'universal',   'CRITICAL', true,
   'Mahsulot o''lchami spec dan ±2mm dan ortiq farq qiladi.',
   'O''lchash va spec tekshirish. Moslamalarni kalibrovka qilish.',
   NOW(), NOW()),

  ('DEF-U-002', 'Dog'' / Ifloslanish',         'Пятно / Загрязнение',       'universal',   'MAJOR',    false,
   'Yuzada yot modda: yog'', toza bo''lmagan detal yoki atrof muhit.',
   'Yuzani spirt bilan artish. Ish joyni tozalash.',
   NOW(), NOW()),

  ('DEF-U-003', 'Yirtilish / G''ijim',         'Разрыв / Смятие',           'universal',   'CRITICAL', true,
   'Material yirtilgan yoki qaytmas deformatsiya.',
   'Mahsulotni brakka chiqarish. Uskunani tekshirish.',
   NOW(), NOW()),

  ('DEF-U-004', 'Noto''g''ri miqdor',          'Неправильное количество',   'universal',   'MAJOR',    false,
   'Partiya miqdori buyurtmadan kam yoki ortiq.',
   'Sanash va to''liq etkazish.',
   NOW(), NOW()),

  -- =============================================
  -- GOFRA (corrugated packaging)
  -- =============================================
  ('DEF-G-001', 'Flüt ezilishi',               'Смятие флюта',              'gofra',       'CRITICAL', true,
   'Gofra ichki to''ldirgichi (flüt) ezilgan — mahsulot mustahkamligi yo''qoladi.',
   'Bosim sozlamalarini tekshirish. Yuklash/taxlash qoidalariga rioya qilish.',
   NOW(), NOW()),

  ('DEF-G-002', 'Yelim yo''q / Ajralish',      'Отсутствие клея / Расслоение', 'gofra',   'CRITICAL', true,
   'Karton qavatlari bir-biridan ajraladi — gofra liniyasi yelim muammosi.',
   'Yelim quvvati va haroratini tekshirish. Gofra liniyasini tozalash.',
   NOW(), NOW()),

  ('DEF-G-003', 'Qiya kesim',                  'Косой рез',                 'gofra',       'MAJOR',    false,
   'Kesim chizig''i ±1mm dan ortiq og''ishda.',
   'Kesim moslamasini kalibrovka qilish.',
   NOW(), NOW()),

  ('DEF-G-004', 'Namlanish',                   'Намокание',                 'gofra',       'CRITICAL', true,
   'Karton namlanib, mustahkamligi yo''qolgan.',
   'Saqlash sharoitini tekshirish. Namlangan mahsulotni brakka chiqarish.',
   NOW(), NOW()),

  ('DEF-G-005', 'Bigiz chizig''i noto''g''ri', 'Неправильная биговка',      'gofra',       'MINOR',    false,
   'Bukish chizig''i spec joyida emas — qutilarni yig''ish qiyin.',
   'Bigiz moslamasini spec bo''yicha sozlash.',
   NOW(), NOW()),

  ('DEF-G-006', 'Kesim parchasi',              'Остаток после вырубки',     'gofra',       'MINOR',    false,
   'Kesimdan so''ng toza bo''lmagan chet qoladi.',
   'Kesim o''tkir bo''lishi kerak. Qurol almashtirish.',
   NOW(), NOW()),

  -- =============================================
  -- OFFSET BOSMA
  -- =============================================
  ('DEF-O-001', 'Rang o''zgarishi (misregistration)', 'Несовмещение красок', 'offset',    'MAJOR',    false,
   'CMYK qatlamlar bir-biriga to''g''ri kelmaydi — ±0.3mm dan ortiq.',
   'Registratsiya sozlamalarini tekshirish. Plitani tekshirish.',
   NOW(), NOW()),

  ('DEF-O-002', 'Siyoh haddan tashqari ko''p',  'Переизбыток краски',       'offset',      'MAJOR',    false,
   'Bosmada siyoh to''yinishi — rangi o''ta to''q, dog'' beradi.',
   'Siyoh balansini tekshirish. Suv muvozanatini sozlash.',
   NOW(), NOW()),

  ('DEF-O-003', 'Siyoh haddan tashqari oz',     'Недостаток краски',        'offset',      'MINOR',    false,
   'Bosmada siyoh yetishmaydi — rang ochiq, xira.',
   'Siyoh sarfini oshirish. Rezervuarni tekshirish.',
   NOW(), NOW()),

  ('DEF-O-004', 'Bosma tasvirida yirtilish',    'Разрыв изображения',       'offset',      'CRITICAL', true,
   'Tasvirda bo''shliq yoki chiziq — plita yoki siqim muammosi.',
   'Plitani tekshirish. Bosim sozlamalarini aniqlash.',
   NOW(), NOW()),

  ('DEF-O-005', 'Ghosting (soya ko''rinishi)', 'Призрачное изображение',    'offset',      'MAJOR',    false,
   'Oldingi bosma izlari keyingi sahifada ko''rinib qoladi.',
   'Siyoh vallarini tozalash. Blanka tartibini o''zgartirish.',
   NOW(), NOW()),

  ('DEF-O-006', 'Lak qoplanmagan joy',          'Непокрытое место лаком',   'offset',      'MAJOR',    false,
   'Lak bosma qismi ustiga to''liq tushmagani — yaltiray qilish kerak joylarda mat.',
   'Lak valini tekshirish. Lak viskozitasini tekshirish.',
   NOW(), NOW()),

  ('DEF-O-007', 'Pantone rang noto''g''ri',     'Неправильный цвет Pantone','offset',      'CRITICAL', true,
   'Spec bo''yicha Pantone rang emas — mijoz rang standarti buzilgan.',
   'Pantone kartochkasi bilan solishtirish. Siyoh aralashmasini qayta hisoblash.',
   NOW(), NOW()),

  -- =============================================
  -- SILKSCREEN (ip-parda bosma)
  -- =============================================
  ('DEF-S-001', 'Siyoh o''tib ketishi',        'Прокол краски',             'silkscreen',  'MAJOR',    false,
   'Siyoh qolip teshiklaridan o''tib, chet qirralari ifloslangan.',
   'Qolip sifatini tekshirish. Siyoh viskozitasini oshirish.',
   NOW(), NOW()),

  ('DEF-S-002', 'Tasvir o''chirilishi',         'Стирание изображения',     'silkscreen',  'CRITICAL', true,
   'Bosma siyohi yaxshi yopishmasdan bo''kildi.',
   'Yuzani yaxshiroq tozalash. Siyoh turi materialga mos bo''lishi kerak.',
   NOW(), NOW()),

  ('DEF-S-003', 'Qalınlık noto''g''ri',         'Неравномерная толщина',   'silkscreen',  'MINOR',    false,
   'Siyoh qatlami bir xil emas — qalin va yupqa joylar bor.',
   'Rakkel bosimini va burchagini sozlash.',
   NOW(), NOW()),

  -- =============================================
  -- FLEXI (flexografik bosma)
  -- =============================================
  ('DEF-F-001', 'Anilox val tiqilib qolishi',  'Засорение анилокса',        'flexi',       'MAJOR',    false,
   'Anilox valining katakchalariga siyoh qotib qolgan — siyoh tarqalishi notekis.',
   'Ultratovush tozalash. Anilox valini tekshirish.',
   NOW(), NOW()),

  ('DEF-F-002', 'Bosma plitasi ezilishi',       'Деформация клише',          'flexi',       'CRITICAL', true,
   'Yumshoq plita ezilgan yoki yirtilgan — tasvir buzilgan.',
   'Plitani almashtirish. Bosim sozlamalarini kamaytirish.',
   NOW(), NOW()),

  ('DEF-F-003', 'Siyoh qurimasligi',            'Незакрепление краски',      'flexi',       'MAJOR',    false,
   'Chiqish vaqtida siyoh qurimagan — keyingi amalda ishqaladi.',
   'UV lampa kuchini tekshirish (UV flexi). Quritgich haroratini oshirish.',
   NOW(), NOW())

ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT code, name_uz, direction, severity, auto_reject FROM defect_catalog ORDER BY direction, code;
-- SELECT direction, COUNT(*) FROM defect_catalog GROUP BY direction;
