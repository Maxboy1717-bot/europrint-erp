-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35 (Phase-2 harvested batch, ca3648bf)
-- Vision vision-1000-answers/14-marketing.md #20 -- "Promo-kod 1 mijoz / 1 kampaniya bo'yicha
--   cheklangan (default); cheklash qoidasini marketing boshliq kampaniya sozlamalarida
--   belgilaydi -- yangi kampaniyada boshqa limit qo'yish mumkin."
-- Additive + idempotent: brand-new promo_codes table, no existing column/table touched.
-- campaign_id -> marketing_campaigns(id) (canonical campaigns table, owner 2026-06-05 --
--   see campaigns.repository.ts header in this repo). customer_id -> sd_customers(id),
--   nullable (a promo code can be created generic/unassigned before a customer redeems it).
-- usage_limit defaults to 1 -- the vision default ("1 mijoz / 1 kampaniya"); the caller
--   (marketing boshliq, via campaign settings) can pass a higher limit per campaign at
--   create-time -- matches "boshqa limit qo'yish mumkin". used_count is incremented
--   atomically on redeem (see promo-codes.repository.ts redeem()).
-- Partial unique index enforces "1 promo-code row per customer per campaign" at the DB
--   level once a customer is assigned; a unique code lets redemption look up by code string.

CREATE TABLE IF NOT EXISTS promo_codes (
  id            serial PRIMARY KEY,
  code          varchar(64)  NOT NULL,
  campaign_id   varchar(36)  NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id   integer      REFERENCES sd_customers(id) ON DELETE SET NULL,
  usage_limit   integer      NOT NULL DEFAULT 1,
  used_count    integer      NOT NULL DEFAULT 0,
  created_at    timestamp    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_codes_code ON promo_codes (code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_codes_campaign_customer
  ON promo_codes (campaign_id, customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_codes_campaign_id ON promo_codes (campaign_id);
