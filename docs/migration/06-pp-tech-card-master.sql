-- APPROVED: owner (2026-06-18) — PP Vision-Build · Phase 1 · texkarta master = technology_cards
-- Additive only (no destructive ALTER). technology_cards is EMPTY (0 rows) + is the canonical rich master
-- (calculated_by_ai=false → human master, true → AI estimate; one table). tech_cards (thin, papka-bound,
-- 3 live readers) and ow_tech_cards (uuid, dead two-world) are NOT touched (Q-39).
-- Idempotent (IF NOT EXISTS). Child FKs: technology_card_id integer REFERENCES technology_cards(id) — no cascade
-- (master uses soft-delete deleted_at). int↔int (technology_cards.id is int4 PK) — no uuid drift here.

-- 1) technology_cards (master) — add the vision columns missing from the rich base (additive).
ALTER TABLE technology_cards
  ADD COLUMN IF NOT EXISTS code             varchar(50),
  ADD COLUMN IF NOT EXISTS name             varchar(200),
  ADD COLUMN IF NOT EXISTS direction        varchar(20),       -- ofs-kar / ofs-gof / flx-gof (EP-PP-087)
  ADD COLUMN IF NOT EXISTS material_type    varchar(50),
  ADD COLUMN IF NOT EXISTS print_params     jsonb,             -- rang soni + profil + registr + plotnost
  ADD COLUMN IF NOT EXISTS kesim            jsonb,
  ADD COLUMN IF NOT EXISTS qolip_id         integer,
  ADD COLUMN IF NOT EXISTS post_press       jsonb,             -- begovka/tisnenie/laminat… (EP-PP-122)
  ADD COLUMN IF NOT EXISTS ish_tartibi      jsonb,
  ADD COLUMN IF NOT EXISTS format_code      varchar(20),       -- 105/72 (format_a/format_b already exist)
  ADD COLUMN IF NOT EXISTS gofra_profile    varchar(20),       -- E/B/C, 2/5-sloy (EP-PP-116)
  ADD COLUMN IF NOT EXISTS raskroy_per_list integer,           -- N dona / list (EP-PP-094)
  ADD COLUMN IF NOT EXISTS scrap_pct        numeric(5,2),
  ADD COLUMN IF NOT EXISTS version          integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status           varchar(20) NOT NULL DEFAULT 'draft',  -- draft/approved/archived
  ADD COLUMN IF NOT EXISTS lab_approved     boolean DEFAULT false,                  -- EP-PP-091
  ADD COLUMN IF NOT EXISTS lab_approved_by  integer,
  ADD COLUMN IF NOT EXISTS lab_approved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS maket_approved   boolean DEFAULT false,                  -- EP-PP-123
  ADD COLUMN IF NOT EXISTS created_by       integer;

CREATE UNIQUE INDEX IF NOT EXISTS ux_technology_cards_code ON technology_cards(code) WHERE code IS NOT NULL;

-- 2) BOM (EP-PP-089) — MRP reads this.
CREATE TABLE IF NOT EXISTS tech_card_bom (
  id serial PRIMARY KEY,
  technology_card_id integer NOT NULL REFERENCES technology_cards(id),
  material_code varchar(50) NOT NULL,
  quantity numeric(14,3) NOT NULL,
  unit varchar(10) NOT NULL DEFAULT 'kg',
  layer varchar(20),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tech_card_bom_card ON tech_card_bom(technology_card_id);

-- 3) Marshrut (EP-PP-032..036) — 10/20/30 ops; machine bind + alt + norm + setup + scrap + min razryad.
CREATE TABLE IF NOT EXISTS tech_card_routes (
  id serial PRIMARY KEY,
  technology_card_id integer NOT NULL REFERENCES technology_cards(id),
  op_seq integer NOT NULL,
  operation varchar(100) NOT NULL,
  machine_id integer,
  alt_machine_id integer,
  norm_per_hour numeric(12,2),
  setup_minutes integer,
  scrap_fixed integer,
  scrap_pct numeric(5,2),
  min_razryad integer,
  is_core boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tech_card_routes_card ON tech_card_routes(technology_card_id);

-- 4) Versiyalash (EP-PP-014/037) — every change = a new version snapshot.
CREATE TABLE IF NOT EXISTS tech_card_versions (
  id serial PRIMARY KEY,
  technology_card_id integer NOT NULL REFERENCES technology_cards(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by integer,
  changed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tech_card_versions_card ON tech_card_versions(technology_card_id);
