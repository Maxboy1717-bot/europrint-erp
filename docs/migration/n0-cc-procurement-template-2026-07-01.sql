-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA N0 (Integratsiya zanjiri — Savdo->Ombor->Ta'minotchi->CC->Kanban->Kassir)
-- ============================================================================
-- N0: Communication Center — P2P xarid so'rovi uchun "PROCUREMENT" shabloni seed
--
-- Maqsad: procurement-request.service.ts (P2P xarid so'rovi) yaratilganda
-- Communication Center'da REAL ko'rinishi uchun (hozir 14 shablon orasida
-- xarid-maxsus shablon yo'q edi — audit N0-SUB-2). Bu shablon FAQAT
-- ko'rinish/xabar maqsadida (informational broadcast): P2P so'rovning
-- HAQIQIY tasdiq zanjiri procurement_approvals jadvalida davom etadi
-- (procurement-request.service.ts, o'zgarishsiz — Q-39 kod-qotirish).
-- Shu sabab bu shablon uchun cc_workflow_steps QO'SHILMAYDI (draft holatda
-- qoladi, CC'ning o'z tasdiq-dvigateli P2P qarorini duplicate qilmaydi —
-- "ikki-dunyo" xavfini oldini olish, audit-flagged risk).
--
-- Idempotent: ON CONFLICT (code) DO NOTHING — qayta ishga tushirish xavfsiz.
-- ============================================================================

INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, default_priority, number_format)
VALUES
  ('PROCUREMENT', 'P2P xarid so''rovi xabari', 'Уведомление о заявке на закупку (P2P)', 'xabar',
   '[]'::jsonb, 'normal', 'XAR-{YYYY}-{SEQ}')
ON CONFLICT (code) DO NOTHING;
