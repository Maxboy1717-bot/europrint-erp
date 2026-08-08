-- Fix (2026-08-03): CC ADVANCE GL mapping (20-cc#49, seed-gl-account-mappings-cc-2026-07-13.sql)
-- seeds gl_account_mappings.debit_account = '4200' for transaction_type='ADVANCE', but account_code
-- '4200' was never actually seeded into `accounts`. Verified by repo-wide search across every
-- `INSERT INTO accounts` source:
--   - docs/migration/seed/seed-00-foundation-canonical-2026-06-19.sql (the CANONICAL, real-schema
--     seed — only 1000/4000/5010/6310/6710/9010/9100/9500)
--   - apps/api/src/shared/db/migrations/gl-loss-marketing-referral-intransit-accounts-2026-07-13.sql
--     (added 9520/9820/9210/9220/1020 — never 4200)
--   - docs/migration/seed/seed-04-accounts.sql is NOT authoritative — its own header/the canonical
--     seed's header both mark it "stale" (targets a non-existent `code` column instead of the real
--     `account_code` column), so its 1230 "Xodimlar bilan hisob-kitob" row is not live evidence.
--
-- Net effect without this fix: CcApprovedGlPostingListener resolves the ADVANCE mapping row fine
-- (gl_account_mappings has no FK to accounts), but GlPostingService.postJournal -> insertJournal ->
-- resolveAccountIds (drizzle-gl-posting.repo.ts) fails with "GL account code(s) not in chart of
-- accounts: 4200" for EVERY ADVANCE approval — logged as a cc→GL error, no GL entry ever posted.
-- FINANCIAL_AID (9500/5010, both pre-existing) is unaffected by this gap.
--
-- Sub-account of 4000 (Debitorlar/AR) — mirrors the 9820 (parent 9810) / 9210+9220 (parent 9200)
-- parent-hierarchy convention from the 2026-07-13 patch. account_type lowercase 'asset' to match
-- the Zod enum (insertAccountSchema, lib/db/src/schema/fi-gl.ts) and the majority of existing rows
-- (accounts_type_chk exists only in the Drizzle model file, not in the live DB_CONSTRAINTS list, so
-- casing here is a consistency choice, not a hard constraint).
--
-- Data seed (NOT DDL). Idempotent / re-runnable (WHERE NOT EXISTS).
-- Live-applied copy: apps/api/src/shared/db/invariants/migrations-schema.ts
-- ('accounts: 4200 employee-advance-receivable (CC ADVANCE GL mapping fix, 2026-08-03)').
INSERT INTO accounts (account_code, account_name, account_name_ru, account_type, parent_account_id, is_active, created_at, updated_at)
SELECT '4200', 'Xodimlardan olinadigan summalar (avans)', 'Расчёты с сотрудниками (аванс)', 'asset',
       (SELECT id FROM accounts WHERE account_code = '4000'), true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_code = '4200');
