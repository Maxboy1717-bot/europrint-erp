-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — DECISION 6 (kosmetik tozalash, ma'lumotga tegmaydi).
--   warehouse_stock jadvalida IKKI xil takror UNIQUE(warehouse_id, material_id) cheklovi bor edi:
--     • warehouse_stock_wh_mat_uniq   — KANONIK (kod izohlarida referens: queries-wms.ts:45 "backs the
--       ON CONFLICT", iot-tablet.controller.ts:1030) → SAQLANADI.
--     • warehouse_stock_wh_mat_unique — hech qayerda referens yo'q, tasodifiy dublikat → OLIB TASHLANADI.
--
--   ON CONFLICT (warehouse_id, material_id) USTUNLAR bo'yicha hal qilinadi (cheklov NOMI bo'yicha emas),
--   va saqlanadigan wh_mat_uniq o'sha ustunlarni qoplaydi → xatti-harakat O'ZGARMAYDI. 39 jonli qatorga
--   tegilmaydi (faqat DDL). Idempotent (IF EXISTS).

ALTER TABLE warehouse_stock DROP CONSTRAINT IF EXISTS warehouse_stock_wh_mat_unique;
