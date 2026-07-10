-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 09-qc #62 — Birinchi namuna (first article) tirajni to'xtatadi.
-- First-article approval GATE. A production run (tiraj) is HALTED until the run's
-- first article (birinchi namuna) has been inspected and APPROVED. Exactly one gate
-- row per production_order (UNIQUE). status defaults 'pending' => the run is blocked
-- by default; it flips to 'approved' only when a QC specialist passes the first
-- article, or to 'rejected' (run stays halted). Additive + idempotent: no existing
-- table is altered; existing runs simply have no gate row yet (read as pending/halted),
-- so nothing is regressed.
CREATE TABLE IF NOT EXISTS qc_first_article_approvals (
  id                  SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,
  inspection_id       INTEGER,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  sample_size         INTEGER NOT NULL DEFAULT 1,
  defect_count        INTEGER NOT NULL DEFAULT 0,
  decided_by          INTEGER,
  decided_at          TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- status domain guard (pending|approved|rejected).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_first_article_approvals_status_chk') THEN
    ALTER TABLE qc_first_article_approvals
      ADD CONSTRAINT qc_first_article_approvals_status_chk
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- one gate row per production run (enables the ON CONFLICT upsert).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_first_article_approvals_po_uniq') THEN
    ALTER TABLE qc_first_article_approvals
      ADD CONSTRAINT qc_first_article_approvals_po_uniq UNIQUE (production_order_id);
  END IF;
END $$;

-- FK to the run being gated; the gate dies with its production order.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_first_article_approvals_po_fkey') THEN
    ALTER TABLE qc_first_article_approvals
      ADD CONSTRAINT qc_first_article_approvals_po_fkey
      FOREIGN KEY (production_order_id) REFERENCES production_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS qc_first_article_approvals_po_idx
  ON qc_first_article_approvals (production_order_id);
CREATE INDEX IF NOT EXISTS qc_first_article_approvals_status_idx
  ON qc_first_article_approvals (status);
