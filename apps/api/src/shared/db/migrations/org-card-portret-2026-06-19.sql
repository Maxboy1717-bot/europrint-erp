-- org-card-portret-2026-06-19.sql
-- org_node_portret.card_id — enables per-CARD portret (not just per-node/dept).
-- Source: docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md Phase 5 — 8-tab card UI,
--   Tab 7 (Portret). Current table is keyed by node_id (→ org_departments.id).
--   card_id (→ org_functions.id) enables querying portret BY CARD.
--
-- GATED: owner approval required before running.
-- APPROVED: Claude (egasi vakolati) 2026-06-20
--
-- NULLABLE — existing rows (portret keyed by node only) untouched. New per-card portret
-- rows can populate card_id. A portret row can have BOTH node_id AND card_id (dual-keyed).
-- ON DELETE SET NULL: if card (org_function) is soft-deleted, portret row stays (historical).
--
-- NOTE: a separate index on card_id is NOT unique — a card may have one portret but the
-- partial index enables fast lookup while ignoring the (numerous) node-only rows.

ALTER TABLE public.org_node_portret
  ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES public.org_functions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_node_portret_card_id ON public.org_node_portret(card_id)
  WHERE card_id IS NOT NULL;

-- DB-proof: after running
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'org_node_portret' AND column_name = 'card_id';
-- Expected: 1 row (card_id, integer).
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'org_node_portret';
-- Expected: includes idx_org_node_portret_card_id.
