-- APPROVED: egasi 2026-06-30 "kod-tomonni boshla" (council_members/prikaz/protokol jadvallari kiritilgan)
-- Modul 04 (Coordination) — kengash a'zoligi jadvali (vizyon 04.1/04.2).
-- Tekshiruv (2026-06-27): councils jadval bor (5 qator) lekin council_members UMUMAN yo'q,
-- chairperson_id hammasi NULL — a'zolik mexanizmi qurilmagan edi.
-- 4 rol: chair (Rais) / secretary (Kotib) / member (A'zo) / guest (Mehmon).
-- is_permanent = org-strukturadan doimiy a'zo (CEO + 7 otdeleniye boshlig'i).
-- Iste'mol qiluvchi: council-members.controller (CRUD) + coordination paneli.
CREATE TABLE IF NOT EXISTS council_members (
  id           SERIAL PRIMARY KEY,
  council_id   INTEGER     NOT NULL,
  user_id      INTEGER     NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'member',   -- chair|secretary|member|guest
  is_permanent BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_council_members_council_user UNIQUE (council_id, user_id),
  CONSTRAINT ck_council_members_role CHECK (role IN ('chair','secretary','member','guest'))
);

CREATE INDEX IF NOT EXISTS idx_council_members_council ON council_members (council_id);
CREATE INDEX IF NOT EXISTS idx_council_members_user    ON council_members (user_id);
