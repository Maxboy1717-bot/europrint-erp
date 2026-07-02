-- ===========================================================================
-- Migration: marketing-leads-crm-lead-id-backfill.sql            (2026-07-02)
-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- ===========================================================================
-- Sabab (problem): `marketing_leads.crm_lead_id` 0% to'ldirilgan edi (14/14 NULL).
--   Root-cause: POST /api/marketing/leads/:id/convert-to-crm handlerida
--   (marketing-analytics-stubs.controller.ts) `WHERE id=${parseInt(id, 10)}`
--   ishlatilgan edi, lekin `marketing_leads.id` VARCHAR(36) — UUID yoki seed
--   slug ("demo-lead-003") — INTEGER EMAS. `parseInt("demo-lead-003", 10)` =>
--   NaN, shu sababli SELECT hech qachon qatorni topmagan va crm_lead_id
--   HECH QACHON yozilmagan (natija doim 0). Kod-bug shu commit'da tuzatildi
--   (id endi string sifatida to'g'ridan-to'g'ri solishtiriladi).
--
-- Bu migratsiya — retroaktiv backfill: bug tuzatilishidan OLDIN status='converted'
-- deb belgilangan, lekin buglangan endpoint sabab hech qachon crm_leads qatoriga
-- ega bo'lmagan 2 ta marketing_lead uchun (demo-lead-003, demo-lead-008) xuddi
-- endpoint bajaradigan AYNAN o'sha amalni (yangi crm_leads qator yaratish +
-- crm_lead_id bilan bog'lash) qo'lda takrorlaydi — REAL, mavjud marketing_lead
-- ma'lumotidan (ism/telefon/email/manba), hech qanday soxta/taxminiy moslashtirish
-- yo'q (Q-40). Mavjud crm_leads qatorlari orasida bu 2 ta lidga mos keladigan
-- (bir xil telefon/email) yozuv YO'Q edi (_audit/q.cjs bilan tasdiqlangan) —
-- shuning uchun moslashtirish emas, yangi qator yaratish to'g'ri yechim.
--
-- IDEMPOTENT: faqat `status='converted' AND crm_lead_id IS NULL` bo'lgan
--   qatorlarga tegadi — qayta ishga tushirish xavfsiz.
--
-- Qo'llash (manual):
--   node _audit/apply-migration.cjs apps/api/src/shared/db/migrations/marketing-leads-crm-lead-id-backfill.sql
-- ===========================================================================

DO $$
DECLARE
  ml RECORD;
  new_crm_id INTEGER;
BEGIN
  FOR ml IN
    SELECT * FROM marketing_leads
    WHERE status = 'converted' AND crm_lead_id IS NULL AND deleted_at IS NULL
  LOOP
    INSERT INTO crm_leads (contact_name, contact_phone, contact_email, source, notes, status, created_at, updated_at)
    VALUES (
      COALESCE(ml.name, ml.company, ''),
      COALESCE(ml.phone, ''),
      COALESCE(ml.email, ''),
      COALESCE(ml.source, 'marketing'),
      COALESCE(ml.notes, ''),
      'new',
      COALESCE(ml.created_at, NOW()),
      NOW()
    )
    RETURNING id INTO new_crm_id;

    UPDATE marketing_leads
       SET crm_lead_id = new_crm_id,
           converted_at = COALESCE(converted_at, NOW()),
           updated_at = NOW()
     WHERE id = ml.id AND crm_lead_id IS NULL;
  END LOOP;
END $$;

-- Tekshiruv (kutilgan: status='converted' qatorlarning barchasi crm_lead_id NOT NULL):
--   SELECT id, name, status, crm_lead_id FROM marketing_leads WHERE status='converted' ORDER BY id;
