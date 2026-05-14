-- Add auto-increment sequence to crm_leads.id
-- crm_leads.id was defined as integer PRIMARY KEY NOT NULL with no default,
-- so application inserts without id fail. This migration adds a sequence.
-- Starting at 1000000 to avoid collision with any Bitrix24-imported IDs.

CREATE SEQUENCE IF NOT EXISTS crm_leads_id_seq
  AS integer
  START WITH 1000000
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Set the sequence as the default for crm_leads.id
ALTER TABLE crm_leads
  ALTER COLUMN id SET DEFAULT nextval('crm_leads_id_seq');

-- Advance the sequence past any existing IDs
SELECT setval('crm_leads_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM crm_leads), 0), 999999) + 1, false);
