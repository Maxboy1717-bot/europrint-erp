-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #78 — Shartnoma strukturalangan shartlar (to'lov/jarima/penya).
-- Vizyon: TASDIQ-2146 §06 #28 / FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11 [Module-06] #78.
--   Ilgari sd_contracts da faqat contract_number/status/signed_at bor edi — to'lov sharti,
--   jarima (penalty) va penya stavkalari hamda valyuta uchun strukturalangan ustun YO'Q edi.
--   Bu migration 4 ta ustun qo'shadi. Qiymatlar har shartnoma bo'yicha ish vaqtida kiritiladi
--   (egasi master-data EMAS) — shuning uchun default NULL/UZS yetarli, regressiya yo'q.
--
-- FAQAT ADDITIV: ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotent; 0-row jadval).
--   payment_terms — to'lov sharti matni (masalan "50% avans + 5 kun", "100%", "N kun", "konsignatsiya")
--   penalty_rate  — jarima stavkasi (foiz), shartnoma buzilishi uchun
--   penya_rate    — penya (kunlik kechikish foizi)
--   currency      — valyuta (ISO-3), default 'UZS'

ALTER TABLE sd_contracts ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE sd_contracts ADD COLUMN IF NOT EXISTS penalty_rate  numeric(6,3);
ALTER TABLE sd_contracts ADD COLUMN IF NOT EXISTS penya_rate    numeric(6,3);
ALTER TABLE sd_contracts ADD COLUMN IF NOT EXISTS currency      varchar(3) DEFAULT 'UZS';
