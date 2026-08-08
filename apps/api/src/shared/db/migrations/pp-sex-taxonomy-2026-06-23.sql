-- Wave 1 (500K_QURISH_REJA_PROMPT.md): PP sex taksonomiyasi + FLEKSO/OFSET bo'lim.
-- APPROVED: Claude (egasi vakolati) 2026-06-23
-- Additive, NULLABLE, idempotent (IF NOT EXISTS). Faqat STRUKTURA — qiymatlar
-- (har work_center'ning sex_code'i + department_kind'i) egasi-DATA (22-sex ro'yxati),
-- keyin to'ldiriladi. Soxta qiymat YOZILMAYDI (Q-40).
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS sex_code VARCHAR(50);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS department_kind VARCHAR(10);
COMMENT ON COLUMN work_centers.sex_code IS 'Kanonik sex kodi (gofra_liniya/kashirovka_avto/tigel_ruchnoy/tisneniya/skleyka/lak/flekso_pechat...) — egasi 22-sex royxatidan';
COMMENT ON COLUMN work_centers.department_kind IS 'Bolim: FLEKSO yoki OFSET';

-- Mavjud 12 work_center: faqat ANIQ bo'lganlarini map. Idempotent (WHERE ... IS NULL guard:
-- egasi keyin tahrirlasa clobber qilmaydi). Qolgan sex'lar + bo'lim taqsimi = egasi 22-sex royxati.
UPDATE work_centers SET sex_code = 'ofset_pechat'  WHERE code IN ('OFFSET-1','OFFSET-2') AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'flekso_pechat' WHERE code = 'FLEXO-1'    AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'rezka'         WHERE code = 'CUTTING-1'  AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'laminatsiya'   WHERE code = 'LAMINATION' AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'tikish'        WHERE code = 'BINDING'    AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'klishe'        WHERE code = 'CLICHE'     AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'qadoqlash'     WHERE code = 'PACKING'    AND sex_code IS NULL;
UPDATE work_centers SET sex_code = 'raqamli_bosma' WHERE code = 'DIGITAL-1'  AND sex_code IS NULL;
-- department_kind: faqat egasi ANIQ aytgan (FLEKSO = gofra; OFSET = ofset + rezka + tigel).
UPDATE work_centers SET department_kind = 'OFSET'  WHERE code IN ('OFFSET-1','OFFSET-2','CUTTING-1') AND department_kind IS NULL;
UPDATE work_centers SET department_kind = 'FLEKSO' WHERE code = 'FLEXO-1' AND department_kind IS NULL;
-- PREPRESS-1 / QC-STATION / MAINT-SHOP = support (ishlab-chiqarish sexi emas) → sex_code NULL qoladi.
