-- APPROVED: egasi (Bilim Grafi rejalashtirish suhbati, 2026-08-08) — native ERP-ichi
-- bilim grafi. Obsidian (tashqi desktop wiki-ilova) TZ'da tavsiya qilingan edi, lekin
-- egasi rad etdi: "ERP tashqarisida ish YO'Q" qoidasiga zid (docs/audit/
-- QARORLAR-JURNALI-2026-07-11.md:123). Grafik ma'lumoti to'liq shu DB'da.
--
-- kg_nodes = polimorfik entity ko'rsatgich (mijoz/xodim/buyurtma/hujjat/...).
-- kg_edges = ular orasidagi yo'naltirilgan, tipli aloqa. entity_id/source_id/target_id
-- VARCHAR (integer-PK VA erp_documents kabi uuid-PK entity'larni bittasi qamrab olishi
-- uchun). is_broken/broken_reason — AI-overlay "buzilgan bog'lanish" bayrog'i (QC rad
-- etilganda yoki oltin-ip bosqichi kutilgan vaqtda kelmaganda tinglovchi/cron o'rnatadi).
--
-- pgvector ATAYLAB ishlatilmaydi: bu deploymentda `vector` kengaytmasi o'rnatilmagan
-- HAM o'rnatib bo'lmaydi (pg_available_extensions'da yo'q) — xuddi shu sabab
-- drizzle-attendance.repo.ts:88-98da employees.face_embedding fantom-ustun bo'lib,
-- oddiy xodim qo'shishni ham 500 bilan buzgan edi. Semantik qidiruv kerak bo'lsa
-- (keyingi faza) — face_embeddings.embedding naqshiga mos oddiy TEXT (JSON) ustun.
--
-- Idempotent (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS kg_nodes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type        VARCHAR(50) NOT NULL,
  entity_id          VARCHAR(64) NOT NULL,
  title              TEXT NOT NULL,
  summary            TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_updated_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kg_nodes_entity ON kg_nodes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON kg_nodes(entity_type) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS kg_edges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type    VARCHAR(50) NOT NULL,
  source_id      VARCHAR(64) NOT NULL,
  target_type    VARCHAR(50) NOT NULL,
  target_id      VARCHAR(64) NOT NULL,
  relation_type  VARCHAR(50) NOT NULL,
  weight         NUMERIC(5,4) NOT NULL DEFAULT 1,
  is_broken      BOOLEAN NOT NULL DEFAULT false,
  broken_reason  TEXT,
  source         VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (source IN ('system','manual','ai')),
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kg_edges_triple ON kg_edges(source_type, source_id, target_type, target_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_kg_edges_source ON kg_edges(source_type, source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kg_edges_target ON kg_edges(target_type, target_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kg_edges_broken ON kg_edges(is_broken) WHERE is_broken = true;
