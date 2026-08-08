-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA J (Bo'lim ombori + AI norma).
-- Maqsad: iste'mol-nazorati (pos-anomaly.service.ts checkOverNorm) endi
--   BO'LIM darajasida ham solishtira oladi — hozir faqat material_id
--   darajasida edi (vizyon EP-POS-044/020 "bo'lim me'yoridan oshsa" talab qiladi).
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS, nullable — mavjud (agar bo'lsa)
--   qatorlar buzilmaydi. department_code qiymat-fazosi pos_movements.bulim
--   bilan bir xil (erkin matn, org_departments'ga hali rasman FK bog'lanmagan —
--   bulim ustuni ham xuddi shunday erkin matn). NULL = global (barcha bo'lim
--   uchun) norma; qiymat berilsa = shu bo'limga xos norma (global'dan ustun).
-- Idempotent — qayta qo'llasa xavfsiz.

ALTER TABLE material_norms ADD COLUMN IF NOT EXISTS department_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_material_norms_material_dept ON material_norms(material_id, department_code);
