-- APPROVED: egasi 2026-06-30 "kod-tomonni boshla" (prikaz/protokol jadvallari kiritilgan)
-- Modul 04 (Coordination) — приказ (prikaz) + протокол (protocol). Tekshiruv (2026-06-27):
-- ikkala jadval ham UMUMAN yo'q edi (information_schema'da yo'q).

-- ── PRIKAZ (приказ — direktor buyrug'i) ───────────────────────────────────────
-- Vizyon 04.27/04.28/04.31: raqam ketma-ketligi (SEQUENCE) + bekor qilingan raqam teshigi
-- saqlanadi (imzolanganda raqam beriladi, qayta ishlatilmaydi); imzolangach IMMUTABLE,
-- o'zgartirish faqat yangi приказ bilan (supersedes_id).
CREATE SEQUENCE IF NOT EXISTS prikaz_number_seq;

CREATE TABLE IF NOT EXISTS prikaz (
  id            SERIAL PRIMARY KEY,
  prikaz_number INTEGER,                                  -- imzolanganda nextval bilan beriladi (NULL=qoralama)
  title         TEXT        NOT NULL,
  content       TEXT,
  issued_by     INTEGER,
  status        TEXT        NOT NULL DEFAULT 'draft',      -- draft|signed|cancelled
  signed_at     TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT,
  supersedes_id INTEGER,                                   -- bu приказ qaysi eski приказни almashtiradi
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_prikaz_status CHECK (status IN ('draft','signed','cancelled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prikaz_number ON prikaz (prikaz_number) WHERE prikaz_number IS NOT NULL;

-- ── PROTOCOL (протокол — majlis bayonnomasi) ──────────────────────────────────
-- Vizyon 04.34/04.36/04.37: rais/kotib, imzo, IMMUTABLE + tuzatish-protokoli (parent_protocol_id),
-- alohida fikr (особое мнение) jsonb.
CREATE TABLE IF NOT EXISTS protocol (
  id                 SERIAL PRIMARY KEY,
  council_id         INTEGER,
  title              TEXT        NOT NULL,
  agenda             TEXT,                                 -- kun tartibi (povestka)
  decisions          TEXT,                                 -- qabul qilingan qarorlar
  chairperson_id     INTEGER,                              -- rais
  secretary_id       INTEGER,                              -- kotib
  dissenting_opinion JSONB,                                -- alohida fikrlar (особое мнение)
  status             TEXT        NOT NULL DEFAULT 'draft',  -- draft|signed|amended
  signed_at          TIMESTAMPTZ,
  parent_protocol_id INTEGER,                              -- tuzatish-protokoli asl protokolga ishora
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_protocol_status CHECK (status IN ('draft','signed','amended'))
);
CREATE INDEX IF NOT EXISTS idx_protocol_council ON protocol (council_id);
