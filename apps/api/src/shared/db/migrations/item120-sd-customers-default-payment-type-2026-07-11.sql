-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- CRM-13 #120 — Default payment type on customer.
--   Adds an optional `default_payment_type` to sd_customers so a customer's usual
--   settlement method (cash/card/bank-transfer/online) can be pre-filled onto new
--   orders/payments instead of re-selecting it every time.
--   Vocabulary: reused verbatim from the codebase's existing, already-shipped
--   payment-type enum — SdCreatePaymentSchema.payment_method in
--   apps/api/src/modules/sd/dto/sd.dto.ts:83 (`z.enum(['cash','card','bank_transfer','online'])`),
--   which is the same set already written into sd_payments.payment_method by
--   sd-payments.repository.ts. No new vocabulary invented for this column.
--   Nullable, not NOT NULL: existing sd_customers rows (and both existing create/update
--   callers) do not supply this field today — a NOT NULL default would need a
--   business-chosen fallback that isn't ours to pick. The CHECK constraint still
--   restricts any value that IS supplied to the 4 known payment types.
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS default_payment_type varchar(20);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sd_customers_default_payment_type_chk') THEN
    ALTER TABLE sd_customers
      ADD CONSTRAINT sd_customers_default_payment_type_chk
      CHECK (default_payment_type IS NULL OR default_payment_type IN ('cash', 'card', 'bank_transfer', 'online'));
  END IF;
END $$;
