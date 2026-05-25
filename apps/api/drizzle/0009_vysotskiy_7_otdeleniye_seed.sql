-- ============================================================================
-- Vysotskiy 7 funksiya modeli — Europrint tashkiliy strukturasi
-- 7 ta otdeleniye (bo'linma) hierarchy_level=1 sifatida qo'shiladi
-- ============================================================================

-- otdeleniye_id maydoniga dataset
INSERT INTO org_departments (name, name_ru, color, display_order, hierarchy_level, node_type, otdeleniye_code, icon, tskp, tskp_ru, sort_order)
VALUES
  ('Ma''muriy bo''lim',        'Административный отдел',    '#64748B', 7, 1, 'otdeleniye', 'OTD7', '🏛️', 'Korxona boshqaruvi va rasmiy masalalar yechilgan', 'Управление компанией', 7),
  ('Qurilish bo''linmasi',     'Отдел построения',          '#3B82F6', 1, 1, 'otdeleniye', 'OTD1', '🏗️', 'Yo''naltirish va personal jalb qilingan',           'Привлечение персонала',  1),
  ('Tarqatish bo''linmasi',    'Отдел распространения',     '#10B981', 2, 1, 'otdeleniye', 'OTD2', '📈', 'Mijozlar topilgan va savdo qilingan',              'Продажи',                 2),
  ('Ishlab chiqarish',         'Производство',              '#F59E0B', 3, 1, 'otdeleniye', 'OTD3', '🏭', 'Mahsulot ishlab chiqarilgan',                       'Производство продукции',  3),
  ('Texnik ta''minot',         'Техническое обеспечение',   '#8B5CF6', 4, 1, 'otdeleniye', 'OTD4', '🔧', 'Uskuna va xom ashyo ta''minlangan',                 'Снабжение',               4),
  ('Moliya bo''linmasi',       'Финансовый отдел',          '#EC4899', 5, 1, 'otdeleniye', 'OTD5', '💰', 'Daromad olingan va xarajatlar nazoratda',            'Финансы',                  5),
  ('Rivojlanish bo''linmasi',  'Отдел развития',            '#06B6D4', 6, 1, 'otdeleniye', 'OTD6', '🚀', 'Korxona rivojlangan',                                'Развитие',                  6)
ON CONFLICT DO NOTHING;

-- Mavjud bo'limlarni 7 otdeleniyega bog'lash
-- (Ma'muriyat → OTD7, Marketing/PR → OTD1, Sotuvlar → OTD2, IshChiq → OTD3, ...)
DO $$
DECLARE
  otd1 integer; otd2 integer; otd3 integer; otd4 integer; otd5 integer; otd6 integer; otd7 integer;
BEGIN
  SELECT id INTO otd1 FROM org_departments WHERE otdeleniye_code = 'OTD1' LIMIT 1;
  SELECT id INTO otd2 FROM org_departments WHERE otdeleniye_code = 'OTD2' LIMIT 1;
  SELECT id INTO otd3 FROM org_departments WHERE otdeleniye_code = 'OTD3' LIMIT 1;
  SELECT id INTO otd4 FROM org_departments WHERE otdeleniye_code = 'OTD4' LIMIT 1;
  SELECT id INTO otd5 FROM org_departments WHERE otdeleniye_code = 'OTD5' LIMIT 1;
  SELECT id INTO otd6 FROM org_departments WHERE otdeleniye_code = 'OTD6' LIMIT 1;
  SELECT id INTO otd7 FROM org_departments WHERE otdeleniye_code = 'OTD7' LIMIT 1;

  -- Marketing va aloqa → OTD1 (Qurilish/personal)
  UPDATE org_departments SET otdeleniye_id = otd1, hierarchy_level = 2 WHERE name IN ('Marketing', 'PR va aloqalar', 'Kadrlar bo''limi') AND otdeleniye_id IS NULL;
  -- Yollash sektsiyasi → OTD1 (kadrlar bo'limi ostida)
  UPDATE org_departments SET otdeleniye_id = otd1, hierarchy_level = 3 WHERE name IN ('Yollash sektsiyasi') AND otdeleniye_id IS NULL;
  -- Sotuvlar va Hamkorlar → OTD2
  UPDATE org_departments SET otdeleniye_id = otd2, hierarchy_level = 2 WHERE name IN ('Sotuvlar', 'Hamkorlar') AND otdeleniye_id IS NULL;
  -- Ishlab chiqarish + sexlar → OTD3
  UPDATE org_departments SET otdeleniye_id = otd3, hierarchy_level = 2 WHERE name IN ('Ishlab chiqarish', 'Sifat nazorati') AND otdeleniye_id IS NULL;
  UPDATE org_departments SET otdeleniye_id = otd3, hierarchy_level = 3 WHERE name IN ('Ofset sexi', 'Flekso sexi', 'Preprint bo''limi') AND otdeleniye_id IS NULL;
  -- Ombor + yetkazib berish → OTD4
  UPDATE org_departments SET otdeleniye_id = otd4, hierarchy_level = 2 WHERE name IN ('Ombor', 'Yetkazib berish') AND otdeleniye_id IS NULL;
  -- Moliya + buxgalteriya → OTD5
  UPDATE org_departments SET otdeleniye_id = otd5, hierarchy_level = 2 WHERE name IN ('Moliya') AND otdeleniye_id IS NULL;
  UPDATE org_departments SET otdeleniye_id = otd5, hierarchy_level = 3 WHERE name IN ('Buxgalteriya') AND otdeleniye_id IS NULL;
  -- O'qitish + Innovatsiya → OTD6
  UPDATE org_departments SET otdeleniye_id = otd6, hierarchy_level = 2 WHERE name IN ('O''qitish bo''limi') AND otdeleniye_id IS NULL;
  UPDATE org_departments SET otdeleniye_id = otd6, hierarchy_level = 3 WHERE name IN ('O''qitish Boshlig''i') AND otdeleniye_id IS NULL;
  -- Ma'muriyat + Bosh Direktor ofisi → OTD7
  UPDATE org_departments SET otdeleniye_id = otd7, hierarchy_level = 2 WHERE name IN ('Ma''muriyat', 'Bosh Direktor ofisi') AND otdeleniye_id IS NULL;
END $$;

-- Pozitsiyalar uchun standart kodlar (CC workflow uchun kerak)
INSERT INTO positions (code, name_uz, name_ru, level, rbac_tier)
VALUES
  ('CEO',      'Bosh direktor',         'Генеральный директор',    7, 'executive'),
  ('CFO',      'Moliya direktori',      'Финансовый директор',     6, 'executive'),
  ('HR_HEAD',  'HR rahbari',            'Руководитель HR',          5, 'manager'),
  ('KASSIR',   'Kassir',                'Кассир',                   3, 'standard'),
  ('SECURITY', 'Xavfsizlik xodimi',     'Сотрудник безопасности',   3, 'standard')
ON CONFLICT (code) DO NOTHING;
