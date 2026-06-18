-- APPROVED: owner (2026-06-18)
-- seed-02-razryad.sql: Razryad darajalari (1-6)
-- Idempotent: ON CONFLICT DO UPDATE
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-02-razryad.sql

BEGIN;

-- ============================================================
-- Razryad darajalari: 1 = yangi xodim, 6 = ekspert/master
-- koeffitsient = base_salary * coefficient = faktik maosh
-- min_months   = bu razryadda minimal ish staji (oy)
-- ============================================================

INSERT INTO razryad_levels (
  level,
  name_uz,
  name_ru,
  coefficient,
  min_months,
  description_uz,
  created_at,
  updated_at
)
VALUES
  (1, 'Boshlang''ich',   'Начальный',       1.00, 0,
   'Yangi xodim, 0-6 oy tajriba. Asosiy ko''nikmalar egallash bosqichi.',
   NOW(), NOW()),

  (2, 'Assistent',       'Ассистент',        1.25, 6,
   'Asosiy vazifalarni mustaqil bajara oladi. 6+ oy tajriba.',
   NOW(), NOW()),

  (3, 'Mutaxassis',      'Специалист',       1.55, 18,
   'Barcha standart vazifalar. Kichik loyiha olib borish. 18+ oy.',
   NOW(), NOW()),

  (4, 'Katta mutaxassis','Старший специалист',1.90, 36,
   'Murakkab vazifalar. Yosh xodimlar mentori. 3+ yil.',
   NOW(), NOW()),

  (5, 'Yetakchi',        'Ведущий',          2.30, 60,
   'Bo''lim ko''magini olib boradi. Standart va jarayonlar yaratadi. 5+ yil.',
   NOW(), NOW()),

  (6, 'Ekspert/Master',  'Эксперт/Мастер',   2.80, 96,
   'Yuqori daraja malaka. Bo''lim strategiyasini belgilaydi. 8+ yil.',
   NOW(), NOW())

ON CONFLICT (level) DO UPDATE SET
  name_uz      = EXCLUDED.name_uz,
  name_ru      = EXCLUDED.name_ru,
  coefficient  = EXCLUDED.coefficient,
  min_months   = EXCLUDED.min_months,
  description_uz = EXCLUDED.description_uz,
  updated_at   = NOW();

COMMIT;

-- Maosh hisoblash misoli:
-- base_salary = 3_000_000 UZS (karta bazaviy maoshi)
-- Razryad 3 (Mutaxassis): faktik maosh = 3_000_000 * 1.55 = 4_650_000 UZS
-- INPS 8%: 372_000 | NDFL 12%: 558_000 | Qo'lga: 3_720_000 UZS

-- Tekshirish:
-- SELECT level, name_uz, coefficient, min_months FROM razryad_levels ORDER BY level;
