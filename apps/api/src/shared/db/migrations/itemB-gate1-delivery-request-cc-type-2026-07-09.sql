-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 3 Item B, GATE 1 (yangi yo'lni qurish; eski #51 tegilmaydi).
--   Yangi CC hujjat turi DELIVERY_REQUEST (yetkazib berish zayavkasi) ro'yxatga olinadi + tasdiqlash
--   marshruti: MANAGER_OF_SENDER (egasi qarori — sotuvchining menejeri). Bu FAQAT DATA seed (yangi jadval
--   YO'Q, sxema o'zgarishi YO'Q, zaxira/stock tegilmaydi) — mavjud cc_documents/cc_workflow_steps engine'ini
--   ishlatadi. Idempotent (WHERE NOT EXISTS).
--
-- Zayavka maydonlari (ai_questions): qachon (delivery_datetime), qayerga (destination), transport turi
--   (vehicle_type), narx (price), qo'shimchalar (extras — erkin matn/JSONB), sotuv buyurtma havolasi
--   (sales_order_ref). "extras" erkin matn (egasi tasdig'i bo'yicha — qat'iy sxema emas).

INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
SELECT
  'DELIVERY_REQUEST', 'Yetkazib berish zayavkasi', 'Заявка на доставку', 'ariza',
  '[
    {"key":"delivery_datetime","qUz":"Yetkazib berish sanasi/vaqti","qRu":"Дата/время доставки","type":"text","required":true},
    {"key":"destination","qUz":"Manzil (qayerga)","qRu":"Адрес доставки","type":"text","required":true},
    {"key":"vehicle_type","qUz":"Transport turi","qRu":"Тип транспорта","type":"text","required":true},
    {"key":"price","qUz":"Narx (UZS)","qRu":"Цена (UZS)","type":"number","required":false},
    {"key":"extras","qUz":"Qo''shimchalar (erkin matn)","qRu":"Дополнительно (свободный текст)","type":"text","required":false},
    {"key":"sales_order_ref","qUz":"Sotuv buyurtma raqami","qRu":"Номер заказа","type":"text","required":false}
  ]'::jsonb,
  1, true, 'normal', 'ZAYAVKA-{YYYY}-{SEQ}'
WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'DELIVERY_REQUEST');

-- Bitta tasdiqlash bosqichi: MANAGER_OF_SENDER (egasi qarori). Boshqa CC hujjatlaridagi kabi
-- mavjud approver_position_code ishlatiladi — yangi rol IXTIRO QILINMAYDI.
INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT t.id, 1, 1, 'sequential', 'MANAGER_OF_SENDER', true, 4, true
FROM cc_document_templates t
WHERE t.code = 'DELIVERY_REQUEST'
  AND NOT EXISTS (
    SELECT 1 FROM cc_workflow_steps w WHERE w.template_id = t.id AND w.template_version = 1 AND w.step_order = 1
  );
