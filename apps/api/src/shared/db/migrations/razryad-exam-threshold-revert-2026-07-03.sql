-- APPROVED: egasi-intervyu qazish 2026-07-03 (revert) — adversarial verify-agent
-- topdi: commit 5e40c5ff docs/audit/decisions/01-org-kartalar.md EP-ORG-055/056
-- ni "egasi qarori" deb noto'g'ri talqin qilgan. Haqiqatda o'sha yozuv "Holat: OCHIQ"
-- (JAVOBLANGAN emas) — hujjat legendasi (qator 9) buni aniq belgilaydi: "OCHIQ —
-- v2 granular tafsilotlar, egasi keyin hal qiladi, A-default TAVSIYA berildi".
-- Bu tahlilchi tavsiyasi, egasi tasdig'i EMAS. Kod ham buni ataylab NULL-gate
-- qilgan (razryad-history.service.ts: "FABRIKATSIYA TAQIQ: exam_pass_threshold
-- NULL -> RAD, default yo'q"; controller buni egasi PATCH qiladigan maydon
-- sifatida ochgan). Shuning uchun 5e40c5ff bilan yozilgan 60/75 qiymatlar
-- fabrikatsiya hisoblanadi — bekor qilinadi, egasi haqiqiy qarorini
-- (EP-ORG-055/056 ni "Holat: JAVOBLANGAN" ga o'tkazib) kutish kerak.

UPDATE razryad_levels SET exam_pass_threshold = NULL WHERE level IN (1,2,3,4,5,6);
