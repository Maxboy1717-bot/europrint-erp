-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- WMS #29 — Namuna/probnik chiqimi "namuna" kod bilan hisobotda (sample-issue tagging)
-- Vision: vision-1000-answers/10-warehouse.md #29
-- ----------------------------------------------------------------------------
-- Mexanizm mavjud ustunlar ustida ishlaydi (yangi jadval/ustun YO'Q):
--   - material_movements.reason (erkin-matn) 'NAMUNA' kodi bilan teglanadi;
--   - namuna-chiqimlar shrinkage/kamomad hisobidan chiqariladi va alohida
--     hisobotda ko'rsatiladi (SampleIssueReport READ-model).
-- Bu migration FAQAT additive seed qo'shadi: namuna-chiqim oylik signal chegarasi
-- (default 10 kg/oy) — vizyondagi "10kg/oy signal". Egasi keyin sozlashi mumkin.
-- Idempotent: WHERE NOT EXISTS — qayta ishga tushirish xavfsiz, mavjud qatorni buzmaydi.
-- ============================================================================

INSERT INTO wms_settings (id, key, value, category, description, updated_at)
SELECT gen_random_uuid()::text,
       'sample_issue_monthly_limit_kg',
       '10',
       'inventory',
       'Namuna/probnik chiqimi oylik signal chegarasi (kg) — oshsa hisobotda bayroq',
       NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM wms_settings WHERE key = 'sample_issue_monthly_limit_kg'
);
