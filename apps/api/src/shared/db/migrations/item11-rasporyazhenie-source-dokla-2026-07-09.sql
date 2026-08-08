-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 5 Item 11 (Koordinatsiya avto-rasporyazhenie).
--   dokla (hisobot) 'resolved' bo'lganda undan avtomatik rasporyazhenie (ko'rsatma) yaratiladi.
--   Kuzatuv + idempotentlik uchun rasporyazhenie ga manba-dokla havolasi va avto-bayroq qo'shiladi:
--     source_dokla_id — qaysi dokladan avto-yaratilgan (NULL = qo'lda yaratilgan);
--     auto_generated  — avto-yaratilganmi (true) yoki qo'lda (false).
--
-- FAQAT ADD COLUMN: yangi jadval yo'q, destructive amal yo'q (rasporyazhenie 0 qator). Idempotent.
-- Qisman unique index: bitta dokladan faqat bitta avto-rasporyazhenie (takror avto-yaratish bo'lmaydi).

ALTER TABLE rasporyazhenie ADD COLUMN IF NOT EXISTS source_dokla_id integer;
ALTER TABLE rasporyazhenie ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rasporyazhenie_source_dokla
  ON rasporyazhenie (source_dokla_id)
  WHERE source_dokla_id IS NOT NULL;
