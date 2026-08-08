-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
-- Seed: Communication Center (CC) document template code -> GL debit/credit account mapping.
--
-- 20-cc#49 (P0, owner 2026-07-11): CC document approval must auto-post to GL. Owner flagged
-- cc-approved-kassir.listener.ts as a contradiction — its own JSDoc said "To'lov AVTO
-- yaratilmaydi" (no auto-payment), yet the decision requires an automatic GL journal entry on
-- full approval. Investigation of the live 18 cc_document_templates rows found only two
-- templates carry a required numeric `amount` ai_question AND already trigger
-- CcDocumentFullyApprovedEvent (cc-workflow.service.ts emitFullyApprovedIfFinancial, which is
-- pre-existing and scoped to ADVANCE/FINANCIAL_AID only): ADVANCE (avans) and FINANCIAL_AID
-- (moddiy yordam). Every other template (ariza/VACATION/TRANSFER/... , buyruq/ORDER,
-- hisobot/DOKLAD+REPORT, xabar/PROCUREMENT+ZRS_ZVS) is either non-financial or has no amount
-- field in its ai_questions (ZRS_ZVS is a plain message — subject/body only, no amount) — so no
-- GL row is seeded for them (Q-40: never fabricate a GL entry for a leave/message document).
--
-- Reused table: gl_account_mappings already exists and is already the live pattern for POS
-- movement-type -> GL account mapping (see seed-gl-account-mappings-pos.sql +
-- GlPostingLogRepository.postMovementToLedger). CC reuses the exact same table/shape, keyed by
-- transaction_type = CC template code, consumed by CcApprovedGlPostingListener
-- (apps/api/src/modules/communication-center/events/cc-approved-gl-posting.listener.ts) via the
-- ONE canonical posting engine (GlPostingService.postJournal -> `entries`).
--
-- Standard account pairing below is a SENSIBLE DEFAULT the owner/accountant can repoint at any
-- time via the existing GL Mapping CRUD (gl_account_mappings) — it is not a fixed/hardcoded rule:
--   ADVANCE       -> Dr 4200 (Xodimlardan olinadigan summalar — advance recoverable from employee)
--                     Cr 5010 (Kassa — cash paid out)
--   FINANCIAL_AID -> Dr 9500 (Boshqa operatsion xarajatlar — non-recoverable aid expense)
--                     Cr 5010 (Kassa)
-- All three account codes (4200/5010/9500) are live, active rows in `accounts` (verified).
--
-- Data seed (NOT DDL — no CREATE TABLE, gl_account_mappings already exists). Idempotent /
-- re-runnable (WHERE NOT EXISTS — a transaction_type already present is left untouched, so a
-- prior owner repoint of these two rows survives a re-run of this file).
INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
FROM (VALUES
  ('ADVANCE',       '4200', '5010', 'CC avans hujjati tasdiqlandi: Dr Xodimlardan olinadigan summalar / Cr Kassa'),
  ('FINANCIAL_AID', '9500', '5010', 'CC moddiy yordam hujjati tasdiqlandi: Dr Boshqa operatsion xarajatlar / Cr Kassa')
) AS v(tt, da, ca, descr)
WHERE NOT EXISTS (
  SELECT 1 FROM gl_account_mappings g WHERE g.transaction_type = v.tt
);
