-- search-fts-indexes.sql — TZ-50/51: FTS + pg_trgm indekslari
-- Ishlatish: psql -f search-fts-indexes.sql yoki ddlRun bilan
-- Bu migration bir marta ishga tushirilishi kerak

-- pg_trgm kengaytmasi (fuzzy search va trigram indeks uchun)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indekslari (fuzzy search — LIKE '%...' o'rniga)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_name_trgm
  ON product USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_description_trgm
  ON product USING gin(COALESCE(description, '') gin_trgm_ops);

-- FTS GIN indekslari (BM25 / ts_rank_cd uchun)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_fts_simple
  ON product USING gin(
    to_tsvector('simple', name || ' ' || COALESCE(description, ''))
  );

-- Mijoz nomi uchun trigram indeks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_name_trgm
  ON customer USING gin(name gin_trgm_ops);
