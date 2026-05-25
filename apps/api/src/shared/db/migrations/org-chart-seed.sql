-- Migration: org-chart-seed.sql
-- Sabab: Tashkiliy Tuzilma sahifasi `vep`, `color`, `icon` ko'rsatadi,
-- lekin departments jadvalida bu maydonlar NULL edi. Frontend bo'sh ko'rinardi.
--
-- Yana: 0 ta xodim mavjud → har bo'limda "0 xodim" ko'rinardi.
-- Bu seed: 18 ta bo'limga metadata + 30 ta test xodim qo'shadi.
--
-- Idempotent: ON CONFLICT DO NOTHING + WHERE clause.

-- ─── 1. Departments metadata ────────────────────────────────────────────────
-- Color (Tailwind hsl), icon (Lucide name), vep (rahbar lavozimi nomi)

UPDATE departments SET color = 'hsl(220 70% 50%)', icon = 'Building2',     vep = 'Bosh Direktor'      WHERE id = 19 AND color IS NULL; -- Ma'muriyat
UPDATE departments SET color = 'hsl(280 70% 55%)', icon = 'Crown',         vep = 'Bosh Direktor'      WHERE id = 20 AND color IS NULL; -- Bosh Direktor ofisi
UPDATE departments SET color = 'hsl(330 70% 55%)', icon = 'Users',         vep = "HR Boshlig'i"       WHERE id = 21 AND color IS NULL; -- Kadrlar bo'limi
UPDATE departments SET color = 'hsl(160 70% 45%)', icon = 'UserSearch',    vep = 'Yollash menejeri'   WHERE id = 22 AND color IS NULL; -- Yollash sektsiyasi
UPDATE departments SET color = 'hsl(40 80% 55%)',  icon = 'GraduationCap', vep = "O'qitish boshlig'i" WHERE id = 23 AND color IS NULL; -- O'qitish bo'limi
UPDATE departments SET color = 'hsl(20 80% 55%)',  icon = 'Megaphone',     vep = 'Marketing boshlig''i' WHERE id = 24 AND color IS NULL; -- Marketing
UPDATE departments SET color = 'hsl(140 70% 45%)', icon = 'TrendingUp',    vep = "Sotuvlar boshlig'i" WHERE id = 25 AND color IS NULL; -- Sotuvlar
UPDATE departments SET color = 'hsl(200 80% 50%)', icon = 'DollarSign',    vep = 'Moliya direktori'   WHERE id = 26 AND color IS NULL; -- Moliya
UPDATE departments SET color = 'hsl(210 75% 50%)', icon = 'Calculator',    vep = 'Bosh Buxgalter'     WHERE id = 27 AND color IS NULL; -- Buxgalteriya
UPDATE departments SET color = 'hsl(0 75% 55%)',   icon = 'Factory',       vep = 'Ishlab Chiqarish Boshlig''i' WHERE id = 28 AND color IS NULL; -- Ishlab chiqarish
UPDATE departments SET color = 'hsl(260 70% 55%)', icon = 'Printer',       vep = "Flekso Sex Boshlig'i" WHERE id = 29 AND color IS NULL; -- Flekso sexi
UPDATE departments SET color = 'hsl(190 70% 50%)', icon = 'Printer',       vep = "Ofset Sex Boshlig'i" WHERE id = 30 AND color IS NULL; -- Ofset sexi
UPDATE departments SET color = 'hsl(310 65% 55%)', icon = 'Palette',       vep = 'Preprint Boshlig''i' WHERE id = 31 AND color IS NULL; -- Preprint
UPDATE departments SET color = 'hsl(50 80% 50%)',  icon = 'Package',       vep = "Ombor Boshlig'i"    WHERE id = 32 AND color IS NULL; -- Ombor
UPDATE departments SET color = 'hsl(170 70% 45%)', icon = 'Truck',         vep = 'Logistika Boshlig''i' WHERE id = 33 AND color IS NULL; -- Yetkazib berish
UPDATE departments SET color = 'hsl(120 70% 45%)', icon = 'ShieldCheck',   vep = "Sifat Boshlig'i"    WHERE id = 34 AND color IS NULL; -- Sifat nazorati
UPDATE departments SET color = 'hsl(290 70% 55%)', icon = 'Speaker',       vep = "PR Boshlig'i"       WHERE id = 35 AND color IS NULL; -- PR va aloqalar
UPDATE departments SET color = 'hsl(230 65% 55%)', icon = 'Handshake',     vep = 'Hamkorlik boshlig''i' WHERE id = 36 AND color IS NULL; -- Hamkorlar

-- ─── 2. Test xodimlar (30 ta) — har bo'limga 1-3 ta ─────────────────────────
-- Faqat agar employees jadvali bo'sh bo'lsa kiritamiz (idempotent)

INSERT INTO employees (
  first_name, last_name, employee_code, status, department_id, position_id,
  email_personal, phone_number, hire_date, telegram_chat_id, address_actual
)
SELECT * FROM (VALUES
  -- Ma'muriyat (id=19)
  ('Bobur',    'Karimov',     'EP-2025-001', 'active', 19, 1,  'bobur.k@europrint.uz',     '+998901111101', DATE '2020-01-15', NULL, 'Toshkent sh., Yunusobod'),
  -- Bosh Direktor ofisi (id=20)
  ('Sherzod',  'Aliyev',      'EP-2025-002', 'active', 20, 2,  'sherzod.a@europrint.uz',   '+998901111102', DATE '2019-03-10', NULL, 'Toshkent sh., Mirzo Ulug''bek'),
  ('Dilshod',  'Toshev',      'EP-2025-003', 'active', 20, 3,  'dilshod.t@europrint.uz',   '+998901111103', DATE '2020-06-20', NULL, 'Toshkent sh., Chilonzor'),
  -- Kadrlar bo'limi (id=21)
  ('Madina',   'Yusupova',    'EP-2025-004', 'active', 21, 6,  'madina.y@europrint.uz',    '+998901111104', DATE '2021-02-01', NULL, 'Toshkent sh., Yashnobod'),
  ('Nilufar',  'Ergasheva',   'EP-2025-005', 'active', 21, 6,  'nilufar.e@europrint.uz',   '+998901111105', DATE '2022-04-15', NULL, 'Toshkent sh., Sergeli'),
  -- Yollash sektsiyasi (id=22)
  ('Aziza',    'Rahimova',    'EP-2025-006', 'active', 22, 6,  'aziza.r@europrint.uz',     '+998901111106', DATE '2022-08-20', NULL, 'Toshkent sh., Olmazor'),
  -- O'qitish bo'limi (id=23)
  ('Otabek',   'Sodiqov',     'EP-2025-007', 'active', 23, 19, 'otabek.s@europrint.uz',    '+998901111107', DATE '2021-09-01', NULL, 'Toshkent sh., Mirobod'),
  ('Munisa',   'Saidova',     'EP-2025-008', 'active', 23, 19, 'munisa.s@europrint.uz',    '+998901111108', DATE '2023-01-10', NULL, 'Toshkent sh., Shayxontohur'),
  -- Marketing (id=24)
  ('Jasur',    'Nomonov',     'EP-2025-009', 'active', 24, 8,  'jasur.n@europrint.uz',     '+998901111109', DATE '2020-11-05', NULL, 'Toshkent sh., Bektemir'),
  ('Kamola',   'Ismoilova',   'EP-2025-010', 'active', 24, 8,  'kamola.i@europrint.uz',    '+998901111110', DATE '2022-07-12', NULL, 'Toshkent sh., Uchtepa'),
  -- Sotuvlar (id=25)
  ('Akmal',    'Tursunov',    'EP-2025-011', 'active', 25, 7,  'akmal.t@europrint.uz',     '+998901111111', DATE '2019-05-15', NULL, 'Toshkent sh., Yakkasaroy'),
  ('Diyora',   'Hasanova',    'EP-2025-012', 'active', 25, 7,  'diyora.h@europrint.uz',    '+998901111112', DATE '2021-12-01', NULL, 'Toshkent sh., Yunusobod'),
  ('Rustam',   'Qodirov',     'EP-2025-013', 'active', 25, 7,  'rustam.q@europrint.uz',    '+998901111113', DATE '2023-03-20', NULL, 'Toshkent sh., Mirzo Ulug''bek'),
  -- Moliya (id=26)
  ('Saida',    'Toxtaeva',    'EP-2025-014', 'active', 26, 9,  'saida.t@europrint.uz',     '+998901111114', DATE '2020-02-10', NULL, 'Toshkent sh., Chilonzor'),
  -- Buxgalteriya (id=27)
  ('Lola',     'Mirzayeva',   'EP-2025-015', 'active', 27, 9,  'lola.m@europrint.uz',      '+998901111115', DATE '2019-08-15', NULL, 'Toshkent sh., Yashnobod'),
  ('Gulnora',  'Karimova',    'EP-2025-016', 'active', 27, 9,  'gulnora.k@europrint.uz',   '+998901111116', DATE '2021-04-05', NULL, 'Toshkent sh., Sergeli'),
  -- Ishlab chiqarish (id=28)
  ('Bekzod',   'Yo''ldoshev', 'EP-2025-017', 'active', 28, 10, 'bekzod.y@europrint.uz',    '+998901111117', DATE '2018-09-10', NULL, 'Toshkent sh., Olmazor'),
  ('Sardor',   'Hamidov',     'EP-2025-018', 'active', 28, 10, 'sardor.h@europrint.uz',    '+998901111118', DATE '2020-03-25', NULL, 'Toshkent sh., Mirobod'),
  -- Flekso sexi (id=29)
  ('Sanjar',   'Otaboyev',    'EP-2025-019', 'active', 29, 17, 'sanjar.o@europrint.uz',    '+998901111119', DATE '2021-06-15', NULL, 'Toshkent sh., Shayxontohur'),
  ('Behzod',   'Rashidov',    'EP-2025-020', 'active', 29, 17, 'behzod.r@europrint.uz',    '+998901111120', DATE '2022-09-01', NULL, 'Toshkent sh., Bektemir'),
  -- Ofset sexi (id=30)
  ('Doniyor',  'Eshonov',     'EP-2025-021', 'active', 30, 18, 'doniyor.e@europrint.uz',   '+998901111121', DATE '2020-11-20', NULL, 'Toshkent sh., Uchtepa'),
  ('Murod',    'Saidov',      'EP-2025-022', 'active', 30, 18, 'murod.s@europrint.uz',     '+998901111122', DATE '2023-02-10', NULL, 'Toshkent sh., Yakkasaroy'),
  -- Preprint bo'limi (id=31)
  ('Aziz',     'Sobirov',     'EP-2025-023', 'active', 31, 15, 'aziz.s@europrint.uz',      '+998901111123', DATE '2022-05-15', NULL, 'Toshkent sh., Yunusobod'),
  -- Ombor (id=32)
  ('Farrux',   'Mahmudov',    'EP-2025-024', 'active', 32, 11, 'farrux.m@europrint.uz',    '+998901111124', DATE '2020-07-01', NULL, 'Toshkent sh., Mirzo Ulug''bek'),
  ('Shavkat',  'Bahromov',    'EP-2025-025', 'active', 32, 11, 'shavkat.b@europrint.uz',   '+998901111125', DATE '2022-10-15', NULL, 'Toshkent sh., Chilonzor'),
  -- Yetkazib berish (id=33)
  ('Olim',     'Nazarov',     'EP-2025-026', 'active', 33, 14, 'olim.n@europrint.uz',      '+998901111126', DATE '2021-11-10', NULL, 'Toshkent sh., Yashnobod'),
  -- Sifat nazorati (id=34)
  ('Zarina',   'Mansurova',   'EP-2025-027', 'active', 34, 12, 'zarina.m@europrint.uz',    '+998901111127', DATE '2020-04-20', NULL, 'Toshkent sh., Sergeli'),
  ('Umida',    'Tojiyeva',    'EP-2025-028', 'active', 34, 12, 'umida.t@europrint.uz',     '+998901111128', DATE '2022-01-15', NULL, 'Toshkent sh., Olmazor'),
  -- PR va aloqalar (id=35)
  ('Nodir',    'Salimov',     'EP-2025-029', 'active', 35, 20, 'nodir.s@europrint.uz',     '+998901111129', DATE '2021-07-05', NULL, 'Toshkent sh., Mirobod'),
  -- Hamkorlar (id=36)
  ('Bahrom',   'Yusupov',     'EP-2025-030', 'active', 36, 13, 'bahrom.y@europrint.uz',    '+998901111130', DATE '2019-12-20', NULL, 'Toshkent sh., Shayxontohur')
) AS new_employees(
  first_name, last_name, employee_code, status, department_id, position_id,
  email_personal, phone_number, hire_date, telegram_chat_id, address_actual
)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code LIKE 'EP-2025-0%');

-- ─── 3. manager_id belgilash (har bo'lim uchun birinchi xodim) ──────────────
UPDATE departments d
SET manager_id = (
  SELECT e.id FROM employees e
  WHERE e.department_id = d.id AND e.status = 'active'
  ORDER BY e.hire_date ASC, e.id ASC LIMIT 1
)
WHERE d.manager_id IS NULL;
