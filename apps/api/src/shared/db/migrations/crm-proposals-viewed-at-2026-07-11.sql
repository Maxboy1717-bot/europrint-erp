-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- CRM-13#5 — KP (proposal) email-open pixel tracking. Clean-additive column, no owner decision needed.
ALTER TABLE crm_proposals
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
COMMENT ON COLUMN crm_proposals.viewed_at IS 'CRM-13#5: KP emailga o''rnatilgan 1x1 pixel GET orqali birinchi ochilgan vaqt (idempotent — faqat NULL bo''lganda yoziladi, CC #47 markViewed naqshi bilan bir xil).';
