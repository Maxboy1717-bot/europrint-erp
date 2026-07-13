-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
--
-- Owner decision 2026-07-13 (chat): MES/QC/HR/PP domain events should ALL be able to
-- auto-spawn Communication Center (CC) documents, not just POS/procurement (the only
-- existing CcSpawnRequestedEvent emitter — procurement-request.service.ts). Three new
-- CC document-template rows are seeded here (FAQAT DATA seed — no new table, no schema
-- change, mirrors the exact idempotent WHERE-NOT-EXISTS shape used by
-- itemB-gate1-delivery-request-cc-type-2026-07-09.sql for DELIVERY_REQUEST):
--
--   MES_ESCALATION       — MesSosEscalationService.escalateOverdue(): a downtime/SOS
--                          escalation chain that climbs usta→bo'lim→direktor and is STILL
--                          unresolved when it reaches the top of the chain (no parent
--                          department left) already fires a CRITICAL Telegram alert to the
--                          top-of-chain responsible user; this template lets that same
--                          moment also leave a durable CC document in that user's basket.
--   QC_INSPECTION_FAILED — SubmitInspectionHandler already publishes QcFailedEvent on
--                          every failed QC decision; a new listener spawns a CC document
--                          addressed from the inspector for director-level review/record.
--   PLAN_CHANGE           — the template flagged by the 2026-07-11 CC audit
--                          (docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md:129,269)
--                          as "SD/PP PLAN_CHANGE → CC hujjat: YO'Q". PpPlanningService
--                          already publishes PpCancelledEvent when a planning operation's
--                          status is set to 'cancelled' (updateOperation) — the same call
--                          site now also spawns a PLAN_CHANGE CC document.
--
-- All three are modelled on the existing PROCUREMENT/ZRS_ZVS "xabar" (informational
-- message) templates: category='xabar' or 'hisobot', NO cc_workflow_steps row (Q-46 /
-- minimal scope — these are auto-generated informational records that land directly in
-- the resolved user's outbox, exactly like PROCUREMENT already does; inventing an
-- approval-routing chain for them is a separate, owner-gated decision, not part of this
-- wiring item). Column list/shape matches the live cc_document_templates table exactly
-- (verified via \d cc_document_templates) and the DELIVERY_REQUEST precedent migration.

INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
SELECT
  'MES_ESCALATION', 'To''xtagan ishlab chiqarish — eskalatsiya xabari', 'Уведомление об эскалации простоя',
  'xabar', '[]'::jsonb, 1, true, 'urgent', 'MES-ESK-{YYYY}-{SEQ}'
WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'MES_ESCALATION');

INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
SELECT
  'QC_INSPECTION_FAILED', 'QC tekshiruvi rad etildi — rahbariyat ko''rigi', 'Инспекция ОТК отклонена — на рассмотрение руководства',
  'hisobot', '[]'::jsonb, 1, true, 'high', 'QC-FAIL-{YYYY}-{SEQ}'
WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'QC_INSPECTION_FAILED');

INSERT INTO cc_document_templates
  (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
SELECT
  'PLAN_CHANGE', 'Ishlab chiqarish rejasi o''zgarishi', 'Изменение производственного плана',
  'xabar', '[]'::jsonb, 1, true, 'normal', 'REJA-{YYYY}-{SEQ}'
WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'PLAN_CHANGE');
