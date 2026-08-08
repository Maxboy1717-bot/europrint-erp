-- APPROVED: egasi F6 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06), 2026-07-06 --
--   "reconcile `currencies` vs `exchange_rates`."
--
-- `currencies.exchange_rate` (hardcoded seed values, USD=12500/EUR=13500/RUB=135) diverged from
-- `exchange_rates` (real CBU data as of F6 sub-fix 1, USD=11973.90/EUR=13700.54/RUB=154.82) by
-- 1.5-14%. One-time sync: currencies.exchange_rate <- latest exchange_rates.rate per currency.
--
-- Dry-run (rollback-tx) TASDIQLANDI, real amounts:
--   USD: 12500 -> 11973.9000
--   EUR: 13500 -> 13700.5400
--   RUB: 135   -> 154.8200
--   (UZS unaffected -- it's the base currency, exchange_rate stays 1, no exchange_rates row for
--    from_currency='UZS' since a currency never converts to itself.)
--
-- DATA-ONLY: DDL yo'q, destructive amal yo'q. CurrencyRatesCron endi har kunlik fetch'da bu ikki
-- jadvalni BIRGALIKDA yangilaydi (currency-rates.cron.ts) -- shu bilan bu ikki manba qayta
-- ajralib ketmaydi.

UPDATE currencies c
SET exchange_rate = latest.rate, updated_at = NOW()
FROM (
  SELECT DISTINCT ON (from_currency) from_currency, rate
  FROM exchange_rates
  WHERE to_currency = 'UZS'
  ORDER BY from_currency, created_at DESC
) latest
WHERE c.code = latest.from_currency;
