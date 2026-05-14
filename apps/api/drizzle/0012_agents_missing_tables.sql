-- ============================================================================
-- Inventory Agent uchun yetishmayotgan jadvallar
-- - warehouse_rolls — Roll boshqaruv (gofrokarton rulonlar, FIFO + QR)
-- - purchase_requests — Auto purchase request (kritik qoldiq aniqlanganda)
-- ============================================================================

-- Roll boshqaruv jadvali (gofrokarton rulonlar uchun maxsus)
CREATE TABLE IF NOT EXISTS "warehouse_rolls" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "roll_id"               varchar(80)  NOT NULL UNIQUE,    -- ta'minotchidan kelgan unikal raqam (masalan "RL-2026-0042")
  "article_code"          varchar(80)  NOT NULL,           -- material artikuli (masalan "GOFRO-180-B")
  "supplier_id"           integer,                         -- crm_companies.id (ta'minotchi)
  "supplier_name"         varchar(200),                    -- denormalize (snapshot)
  "initial_weight_kg"     numeric(10, 2) NOT NULL,
  "remaining_weight_kg"   numeric(10, 2) NOT NULL,
  "warehouse_id"          varchar(80),                     -- qaysi omborda
  "bin_location"          varchar(120),                    -- ombordagi joy (freeform)
  "qr_code_url"           varchar(500),                    -- QR rasm URL (statik PDF/PNG)
  "qr_code_payload"       text,                            -- QR ichidagi JSON: {rollId, articleCode, weight, supplier}
  "received_date"         timestamp NOT NULL DEFAULT now(),  -- FIFO uchun (eski roll birinchi)
  "expires_at"            timestamp,                       -- ba'zi rolllar uchun muddat
  "is_critical"           boolean NOT NULL DEFAULT false,   -- og'irligi 50 kg dan kam → noqulay
  "is_low"                boolean NOT NULL DEFAULT false,   -- og'irligi 20 kg dan kam → tugayapti
  "status"                varchar(20) NOT NULL DEFAULT 'available',  -- available|in_use|empty|defective
  "created_at"            timestamp NOT NULL DEFAULT now(),
  "updated_at"            timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "warehouse_rolls_article_idx"   ON "warehouse_rolls"("article_code");
CREATE INDEX IF NOT EXISTS "warehouse_rolls_received_idx"  ON "warehouse_rolls"("received_date" ASC);   -- FIFO
CREATE INDEX IF NOT EXISTS "warehouse_rolls_status_idx"    ON "warehouse_rolls"("status", "remaining_weight_kg");
CREATE INDEX IF NOT EXISTS "warehouse_rolls_supplier_idx"  ON "warehouse_rolls"("supplier_id");

-- Roll harakat tarixi (ishlatilgan og'irlik audit)
CREATE TABLE IF NOT EXISTS "warehouse_roll_usage" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "roll_id"               uuid NOT NULL REFERENCES warehouse_rolls(id) ON DELETE CASCADE,
  "used_weight_kg"        numeric(10, 2) NOT NULL,
  "remaining_weight_kg"   numeric(10, 2) NOT NULL,
  "production_order_id"   varchar(80),
  "used_by_user_id"       integer,
  "used_at"               timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "warehouse_roll_usage_roll_idx" ON "warehouse_roll_usage"("roll_id", "used_at" DESC);

-- Auto purchase request (Inventory + Supplier agentlar)
CREATE TABLE IF NOT EXISTS "purchase_requests" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "material_id"           integer NOT NULL,
  "qty"                   numeric(12, 2) NOT NULL,
  "reason"                text,
  "requested_by"          varchar(40) DEFAULT 'agent',     -- agent yoki user_id
  "requested_by_user_id"  integer,
  "approved_by_user_id"   integer,
  "approved_at"           timestamp,
  "status"                varchar(20) NOT NULL DEFAULT 'pending',  -- pending|approved|rejected|fulfilled
  "preferred_supplier_id" integer,
  "estimated_cost"        numeric(14, 2),
  "currency"              varchar(10) DEFAULT 'UZS',
  "notes"                 text,
  "created_at"            timestamp NOT NULL DEFAULT now(),
  "updated_at"            timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "purchase_requests_status_idx"   ON "purchase_requests"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "purchase_requests_material_idx" ON "purchase_requests"("material_id");
