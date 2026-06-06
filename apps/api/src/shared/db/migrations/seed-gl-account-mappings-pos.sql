-- Seed: POS movement type -> GL debit/credit account mapping (Uzbek NAS chart of accounts).
-- APPROVED: owner 2026-06-05 (data seed into existing gl_account_mappings; NO CREATE TABLE / no DDL).
-- Owner-approved 2026-06-05. Data seed (NOT DDL — no CREATE TABLE). Idempotent / re-runnable.
-- The codes (debit_account/credit_account) resolve to accounts.id at post time
-- (GlPostingLogRepository.postMovementToLedger). INTERNAL_TRANSFER is intentionally omitted
-- (same account both sides -> no GL impact). EXTERNAL_OUT posts the primary receivable/revenue
-- leg only; the COGS leg (Dr 9100 / Cr 2810) is a future multi-leg enhancement.
INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
FROM (VALUES
  ('EXTERNAL_IN',        '1010', '6000', 'Tashqaridan mol qabul: Dr Xom ashyo va materiallar / Cr Kreditorlar'),
  ('EXTERNAL_OUT',       '4000', '9010', 'Sotuv: Dr Debitorlar / Cr Tayyor mahsulot sotuvidan tushum'),
  ('INTERNAL_ISSUE',     '2010', '1010', 'Ishlab chiqarishga berish: Dr Asosiy ishlab chiqarish / Cr Xom ashyo'),
  ('INTERNAL_RETURN',    '1010', '2010', 'Qaytarish: Dr Xom ashyo / Cr Asosiy ishlab chiqarish'),
  ('DAMAGE',             '9500', '1010', 'Brak/zarar: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo'),
  ('INVENTORY_ADJ_PLUS', '1010', '9810', 'Inventarizatsiya ortiqcha: Dr Xom ashyo / Cr Boshqa daromadlar')
) AS v(tt, da, ca, descr)
WHERE NOT EXISTS (
  SELECT 1 FROM gl_account_mappings g WHERE g.transaction_type = v.tt
);
