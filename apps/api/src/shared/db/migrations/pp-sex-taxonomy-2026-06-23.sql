-- Wave 1 (500K_QURISH_REJA_PROMPT.md): PP sex taksonomiyasi + FLEKSO/OFSET bo'lim.
-- APPROVED: Claude (egasi vakolati) 2026-06-23
-- Additive, NULLABLE, idempotent (IF NOT EXISTS). Faqat STRUKTURA — qiymatlar
-- (har work_center'ning sex_code'i + department_kind'i) egasi-DATA (22-sex ro'yxati),
-- keyin to'ldiriladi. Soxta qiymat YOZILMAYDI (Q-40).
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS sex_code VARCHAR(50);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS department_kind VARCHAR(10);
COMMENT ON COLUMN work_centers.sex_code IS 'Kanonik sex kodi (gofra_liniya/kashirovka_avto/tigel_ruchnoy/tisneniya/skleyka/lak/flekso_pechat...) — egasi 22-sex royxatidan';
COMMENT ON COLUMN work_centers.department_kind IS 'Bolim: FLEKSO yoki OFSET';
