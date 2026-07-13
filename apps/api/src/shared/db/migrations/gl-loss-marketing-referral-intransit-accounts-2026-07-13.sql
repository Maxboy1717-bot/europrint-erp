-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
--
-- GL/Chart-of-Accounts — owner interview 2026-07-13 (chat), 4 related decisions:
--   (1) Scrap/loss (brak/kamomad) value should default to a GENERAL "Ishlab chiqarish
--       zarari" (production-loss) GL account for ALL loss-type events. Before this,
--       only POS DAMAGE mapped to account 9500 "Boshqa operatsion xarajatlar" (a
--       catch-all shared with unrelated other-expense postings) — INVENTORY_ADJ_MINUS
--       (inventory shrinkage, also a loss) shared the exact same 9500 account.
--   (2) Makulatura (waste-paper) resale income should go to its OWN "Boshqa
--       daromadlar (makulatura)" account, distinct from 9810 "Boshqa daromadlar
--       (kurs farqi va h.k.)" which is reserved for currency-exchange differences.
--       `accounts.parent_account_id` already existed (unused, no live rows had it
--       set) — used here to record 9820 as a sub-account of 9810 for reporting
--       hierarchy, while 9820 remains its own distinct account_code (the mapping/
--       posting code always resolves by account_code, never by parent_account_id).
--   (3) Marketing expense and referral (employee-referral) bonus need TWO SEPARATE
--       new GL accounts. They currently share ONE account, 9200 "Sotuv xarajatlari
--       (logistika, marketing)", and there is no referral-bonus account at all.
--       9200 is left untouched (Q-46 additive-only) — 9210/9220 are new siblings
--       recorded as its children via parent_account_id.
--   (4) In-transit imported goods (raw materials shipped from abroad, tracked by
--       wms_in_transit_shipments / WmsInTransitService) need a separate TEMPORARY
--       "Yo'lda tovar" asset account. The logistics state-machine
--       (shipped -> customs -> arrived) was already fully built with zero GL
--       entries; this migration adds the account, and the accompanying code change
--       (wms-in-transit.service.ts markArrived()) posts a real Dr Materiallar (1000)
--       / Cr Yo'lda tovar (1020) journal entry via GlPostingService.postJournal at
--       the moment a shipment transitions from in-transit to arrived.
--
-- Q-40 (no fabrication): only structural GL facts (account codes/names/types) —
-- no invented business numbers. The in-transit GL post itself only fires when
-- wms_in_transit_shipments.declared_value is a known positive number AND currency
-- is UZS/blank (no FX-rate source exists on that table — a foreign-currency
-- shipment is skipped with a logged reason rather than mis-scaling the amount).
--
-- Idempotent / re-runnable. Loader entries: SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (same SQL, split into
-- 5 named migration steps — this file is the human-readable mirror).

-- 1) Five new GL accounts (BHMS-style numbering, fits existing bands: 1000s
--    assets/materials, 9200s sales/marketing expense, 9500s other-expense,
--    9800s other-income).
INSERT INTO accounts (account_code, account_name, account_type, parent_account_id)
VALUES
  ('9520', 'Ishlab chiqarish zarari (brak, kamomad)', 'EXPENSE', NULL),
  ('9820', 'Boshqa daromadlar (makulatura sotuvidan)', 'REVENUE', (SELECT id FROM accounts WHERE account_code = '9810')),
  ('9210', 'Marketing xarajatlari', 'EXPENSE', (SELECT id FROM accounts WHERE account_code = '9200')),
  ('9220', 'Referal (xodim tavsiyasi) bonuslari', 'EXPENSE', (SELECT id FROM accounts WHERE account_code = '9200')),
  ('1020', 'Yo''lda tovar (import, hali yetib kelmagan)', 'ASSET', NULL)
ON CONFLICT (account_code) DO NOTHING;

-- 2) Re-point the two existing loss-type gl_account_mappings rows (DAMAGE,
--    INVENTORY_ADJ_MINUS) from the shared 9500 to the new dedicated 9520.
--    Guarded by `debit_account = '9500'` so a re-run (or a mapping the owner has
--    since customized away from 9500) is never clobbered.
DO $$
BEGIN
  UPDATE gl_account_mappings
    SET debit_account = '9520',
        description = 'Brak/zarar: Dr Ishlab chiqarish zarari / Cr Xom ashyo',
        updated_at = NOW()
    WHERE transaction_type = 'DAMAGE' AND debit_account = '9500';
  UPDATE gl_account_mappings
    SET debit_account = '9520',
        description = 'Inventar kamayishi: Dr Ishlab chiqarish zarari / Cr Xom ashyo',
        updated_at = NOW()
    WHERE transaction_type = 'INVENTORY_ADJ_MINUS' AND debit_account = '9500';
END $$;

-- 3) New WASTE_OUT mapping (makulatura resale) — mirrors EXTERNAL_OUT's shape
--    (Dr Debitorlar / Cr income), just posting to the new makulatura-specific
--    income account instead of 9010 Tayyor mahsulot sotuvidan tushum.
INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT 'WASTE_OUT', '4000', '9820', 'Makulatura sotuvi: Dr Debitorlar / Cr Boshqa daromadlar (makulatura)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM gl_account_mappings WHERE transaction_type = 'WASTE_OUT');

-- 4) WASTE_OUT movement-type — the resale-side counterpart of the existing
--    WASTE_IN (makulatura receiving-in). Same conditional-enum + seed-row pattern
--    as docs/migration/2026-06-27-pos-movement-taxonomy-expand.sql used for
--    WASTE_IN/LAB_SAMPLE_OUT/PARTIAL_RECEIPT/CUSTOMER_MATERIAL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_movement_type_enum') THEN
    ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'WASTE_OUT';
  END IF;
END $$;

INSERT INTO pos_movement_types (code, name, name_ru, direction, is_issue, is_receipt, is_active, requires_document)
VALUES ('WASTE_OUT', 'Chiqindi/Qoldiq chiqim (makulatura sotuvi)', 'Расход отходов/макулатуры (продажа)', 'out', true, false, true, false)
ON CONFLICT (code) DO NOTHING;
