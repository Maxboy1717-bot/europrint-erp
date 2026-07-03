-- razryad-exam-threshold-seed-2026-07-03.sql
-- A4-exam-threshold: razryad_levels.exam_pass_threshold qiymatlarini o'rnatish.
-- Additive UPDATE (CREATE TABLE emas) — mavjud ustunga egasi-qazish qiymatini yozadi.
--
-- APPROVED: egasi-intervyu qazish 2026-07-03, iqtibos-manba:
--   docs/audit/decisions/01-org-kartalar.md EP-ORG-055/056
--   docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md:90-96 (01.13) va :258-264 (01.55)
--   Qaror: "A — Har razryad uchun alohida chegara (1-3 → 60%, 4-6 → 75%); amaliy ustun 70/30."
--
-- ⚠ practical_weight/theory_weight (70/30 amaliy/nazariy og'irlik) uchun razryad_levels
--   jadvalida ustun YO'Q (schema tekshirildi 2026-07-03) — shu sabab bu migratsiya faqat
--   exam_pass_threshold ni o'rnatadi. 70/30 og'irlik alohida ustun/jadval qo'shilganda
--   qo'llanadi (EGASI-DATA fabrikatsiya taqiq — yangi ustun yaratish bu vazifa doirasida emas).
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f razryad-exam-threshold-seed-2026-07-03.sql

UPDATE public.razryad_levels
  SET exam_pass_threshold = 60
  WHERE level IN (1, 2, 3);

UPDATE public.razryad_levels
  SET exam_pass_threshold = 75
  WHERE level IN (4, 5, 6);

-- DB-proof: after running
-- SELECT level, exam_pass_threshold FROM razryad_levels ORDER BY level;
-- Expected: level 1-3 => 60.00, level 4-6 => 75.00
