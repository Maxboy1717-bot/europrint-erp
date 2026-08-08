-- error-catalog-seed-2026-07-13.sql
-- INSERT-only (no CREATE TABLE / no ALTER TABLE) — Q-35 schema-approval NOT required
-- (table `error_catalog` already exists, created by T10-08 migrations-drift block +
-- _audit/apply-t10-08-error-catalog.cjs; columns unchanged). Owner task: "Xato Katalogi"
-- (HR page /org-structure/error-catalog) is CRUD-complete but was seeded with 0 rows —
-- first-load empty state. This migration adds a REAL-WORLD, print-industry-specific
-- STARTER list (~18 rows) so the page is not empty on first load.
--
-- ⭐ NOT a violation of the "Q-40 fabrikatsiya taqiq" note in error-catalog.service.ts —
-- that note is about the *service* never synthesising fake rows at runtime; a one-time,
-- explicitly-requested master-data seed via a reviewed migration is the same mechanism
-- already used for `defect_catalog` (docs/migration/seed/seed-05-defects.sql) and other
-- taxonomy/vocab tables (docs/MASTER_DATA_STANDARTLARI.md: "lookup = seed-only starting
-- point"). Every row below is card_id = NULL ("umumiy" — applies to any karta) and stays
-- fully editable afterward through the existing ErrorCatalogConfig.tsx CRUD screen
-- (create / inline-edit / archive) already verified live against this table.
--
-- Idempotent: ON CONFLICT matches the live partial-unique index
-- uq_error_catalog_code_active (code) WHERE code IS NOT NULL AND is_active = TRUE
-- AND deleted_at IS NULL — safe to re-run (e.g. after a future full-company reset).
--
-- Category taxonomy mirrors the repository doc-comment ("category = defect-guruh: sifat /
-- deadline / material / qayta-ishlash / ...") plus the 4 print processes already used by
-- defect_catalog.direction (gofra / offset / silkscreen / flexi) + docs/LUGAT.md §1 terms.
-- Severity uses 4 tiers (low / medium / major / critical) — "major" tone rendering fixed
-- in the same change (ErrorCatalogConfig.tsx + DefectDropdown.tsx severityTone()).

BEGIN;

INSERT INTO error_catalog (card_id, code, name, name_ru, category, severity, description, sort_order, is_active, created_at, updated_at)
VALUES
  (NULL, 'RANG-001',    'Rangi noto''g''ri / rang siljishi',      'Неправильный цвет / смещение цвета',
   'sifat',         'major',     'CMYK yoki Pantone rang spetsifikatsiyadan farq qiladi; qatlamlar orasida siljish (misregistration) kuzatiladi.', 10, true, NOW(), NOW()),

  (NULL, 'QOGOZ-001',   'Qog''oz / karton yirtilishi',              'Разрыв бумаги / картона',
   'material',      'critical',  'Bosma yoki kesish jarayonida material yirtilgan — mahsulot butunligi buzilgan.', 20, true, NOW(), NOW()),

  (NULL, 'OLCHAM-001',  'O''lcham xatosi',                          'Ошибка размера',
   'sifat',         'major',     'Tayyor mahsulot o''lchami texkarta spetsifikatsiyasidan ±2mm dan ortiq farq qiladi.', 30, true, NOW(), NOW()),

  (NULL, 'ELIM-001',    'Elim / yelim yopishmasligi',               'Клей не держит',
   'material',      'critical',  'Qatlamlar orasida yelim yaxshi yopishmagan — qadoq/mahsulot ajralib ketishi mumkin.', 40, true, NOW(), NOW()),

  (NULL, 'BOSIM-001',   'Bosim notekisligi',                        'Неравномерное давление',
   'sifat',         'medium',    'Bosma yoki laminatsiya bosimi notekis taqsimlangan — sifat pasayadi.', 50, true, NOW(), NOW()),

  (NULL, 'KESIM-001',   'Kesish chizig''i noto''g''ri',             'Неправильная линия реза',
   'sifat',         'major',     'Kesim (die-cutting) chizig''i sxemadan chetga chiqqan — mahsulot shakli buzilgan.', 60, true, NOW(), NOW()),

  (NULL, 'LAM-001',     'Laminatsiya pufakchasi',                   'Пузыри при ламинации',
   'sifat',         'medium',    'Plyonka ostida havo pufakchalari qolgan — yuza notekis va estetik jihatdan yaroqsiz.', 70, true, NOW(), NOW()),

  (NULL, 'SILK-001',    'Silkscreen registratsiya xatosi',          'Ошибка совмещения в шелкографии',
   'silkscreen',    'major',     'Ip-parda bosma qatlamlari bir-biriga to''g''ri kelmadi (registratsiya siljishi).', 80, true, NOW(), NOW()),

  (NULL, 'OFSET-001',   'Ofset dog''lash',                          'Пятна при офсетной печати',
   'offset',        'medium',    'Ofset bosmada siyoh dog'' qoldirgan — valik yoki suv-siyoh muvozanati muammosi.', 90, true, NOW(), NOW()),

  (NULL, 'GOFRA-001',   'Gofra qatlam ajralishi',                   'Расслоение гофрокартона',
   'gofra',         'critical',  'Gofra qatlamlari (flyut + layner) bir-biridan ajralgan — mustahkamlik yo''qolgan.', 100, true, NOW(), NOW()),

  (NULL, 'GOFRA-002',   'Flyut ezilishi',                           'Смятие флюта',
   'gofra',         'major',     'Gofra ichki to''ldirgichi (flyut) yuklash yoki bosim tufayli ezilgan.', 110, true, NOW(), NOW()),

  (NULL, 'OFSET-002',   'Rang registratsiyasi siljishi',            'Смещение цветовой регистрации',
   'offset',        'major',     'CMYK qatlamlar bir-biriga aniq tushmagan (misregistration ±0.3mm dan ortiq).', 120, true, NOW(), NOW()),

  (NULL, 'FLEXI-001',   'Anilox val tiqilishi',                     'Засорение анилоксового вала',
   'flexi',         'medium',    'Anilox valining katakchalari siyoh bilan tiqilib qolgan — bosma notekis chiqadi.', 130, true, NOW(), NOW()),

  (NULL, 'FLEXI-002',   'Bosma plastinka deformatsiyasi',           'Деформация печатной формы',
   'flexi',         'critical',  'Yumshoq flexi plastinka ezilgan yoki yirtilgan — tasvir buzilgan.', 140, true, NOW(), NOW()),

  (NULL, 'DEADLINE-001','Muddat o''tkazib yuborilgan',              'Просрочка срока',
   'deadline',      'major',     'Buyurtma ishlab chiqarish yoki yetkazish muddati belgilangan deadlinedan kechikkan.', 150, true, NOW(), NOW()),

  (NULL, 'MAT-001',     'Material yetishmovchiligi',                'Нехватка материала',
   'material',      'medium',    'Ishlab chiqarish uchun kerakli xomashyo/material ombordan yetarli miqdorda kelmagan.', 160, true, NOW(), NOW()),

  (NULL, 'UMUMIY-001',  'Operator xatosi',                          'Ошибка оператора',
   'umumiy',        'low',       'Uskuna sozlamalarini noto''g''ri kiritish yoki jarayon tartibini buzish natijasidagi inson xatosi.', 170, true, NOW(), NOW()),

  (NULL, 'UMUMIY-002',  'Uskuna nosozligi',                         'Неисправность оборудования',
   'umumiy',        'critical',  'Uskunaning texnik nosozligi ishlab chiqarish jarayonini to''xtatgan yoki nuqsonli mahsulot chiqargan.', 180, true, NOW(), NOW())

ON CONFLICT (code) WHERE code IS NOT NULL AND is_active = TRUE AND deleted_at IS NULL
DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT code, name, category, severity FROM error_catalog WHERE deleted_at IS NULL ORDER BY sort_order;
-- SELECT severity, COUNT(*) FROM error_catalog GROUP BY severity ORDER BY 2 DESC;
