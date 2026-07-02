-- G4 — CC-KANBAN-KASSIR birlashuv (additive)
-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
--
-- 1) kanban_cards.related_ref (text) — CC hujjatlari UUID bilan bog'lash uchun.
--    Sabab: kanban_cards.related_id INTEGER (jonli DB) — cc_documents.id UUID
--    String(uuid) INSERT 22P02 bilan yiqilardi (cc-event.listener.ts:126).
--    related_id INTEGER'ligicha qoladi (sales_order kabi son ID'lar uchun);
--    UUID manbalar related_ref'ga yoziladi.
-- 2) SAFAR (xizmat safari) + ONLINE_PURCHASE (onlayn xarid) CC xarajat
--    shablonlari — idempotent seed (ON CONFLICT DO NOTHING).
--    Tasdiqlash zanjiri — SOZLANADIGAN DEFAULT (ADVANCE zanjiri naqshida);
--    EGASI-DATA: yakuniy zanjirni egasi cc_workflow_steps'da o'zgartirishi mumkin.

-- ── 1. kanban_cards.related_ref ────────────────────────────────────────────
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS related_ref text;

CREATE INDEX IF NOT EXISTS kanban_cards_related_ref_idx
  ON kanban_cards (related_type, related_ref)
  WHERE related_ref IS NOT NULL;

-- ── 2. CC xarajat shablonlari: SAFAR + ONLINE_PURCHASE ────────────────────
INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, default_priority, number_format)
VALUES
  (
    'SAFAR',
    'Xizmat safari uchun ariza',
    'Заявление на командировку',
    'ariza',
    '[
      {"key": "destination", "qUz": "Safar manzili (shahar/tashkilot)", "qRu": "Место командировки (город/организация)", "type": "text",   "required": true},
      {"key": "purpose",     "qUz": "Safar maqsadi",                    "qRu": "Цель командировки",                      "type": "text",   "required": true},
      {"key": "start_date",  "qUz": "Boshlanish sanasi",                "qRu": "Дата начала",                            "type": "date",   "required": true},
      {"key": "end_date",    "qUz": "Tugash sanasi",                    "qRu": "Дата окончания",                         "type": "date",   "required": true},
      {"key": "amount",      "qUz": "Taxminiy xarajat (UZS)",           "qRu": "Ориентировочные расходы (UZS)",          "type": "number", "required": true}
    ]'::jsonb,
    'normal',
    'SAFAR-{YYYY}-{SEQ}'
  ),
  (
    'ONLINE_PURCHASE',
    'Onlayn xarid uchun ariza',
    'Заявление на онлайн-покупку',
    'ariza',
    '[
      {"key": "item",   "qUz": "Xarid qilinadigan mahsulot/xizmat", "qRu": "Приобретаемый товар/услуга", "type": "text",   "required": true},
      {"key": "url",    "qUz": "Havola (URL)",                      "qRu": "Ссылка (URL)",               "type": "text",   "required": false},
      {"key": "amount", "qUz": "Summa (UZS)",                       "qRu": "Сумма (UZS)",                "type": "number", "required": true},
      {"key": "reason", "qUz": "Xarid sababi",                      "qRu": "Причина покупки",            "type": "text",   "required": true}
    ]'::jsonb,
    'normal',
    'ONL-{YYYY}-{SEQ}'
  )
ON CONFLICT (code) DO NOTHING;

-- Tasdiqlash zanjiri (sozlanadigan default, ADVANCE naqshi:
-- MANAGER_OF_SENDER → CEO → POSITION:CFO → POSITION:KASSIR → DIRECTOR).
-- Idempotent: shablon uchun bironta step bo'lsa — qayta yozilmaydi.
INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT t.id, t.version, s.step_order, 'sequential', s.code, true, s.hours, true
FROM cc_document_templates t
CROSS JOIN (VALUES
  (1, 'MANAGER_OF_SENDER', 24),
  (2, 'CEO',               24),
  (3, 'POSITION:CFO',      24),
  (4, 'POSITION:KASSIR',    8),
  (5, 'DIRECTOR',          72)
) AS s(step_order, code, hours)
WHERE t.code IN ('SAFAR', 'ONLINE_PURCHASE')
  AND NOT EXISTS (
    SELECT 1 FROM cc_workflow_steps ws
    WHERE ws.template_id = t.id AND ws.template_version = t.version
  );
