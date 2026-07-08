/**
 * @module invariants/migrations-schema
 * @description Schema-addition migrations (tables, columns, indexes, seeds).
 */

export interface MigrationDef { name: string; sql: string }

export const SCHEMA_MIGRATIONS: Array<MigrationDef> = [
  // MUHIM-4 fix: INV-${Date.now()} race condition uchun atomic sequence.
  // Dastur har ishga tushganda yaratiladi (IF NOT EXISTS — idempotent).
  // Foydalanish: SELECT nextval('invoice_number_seq') → INV-2026-001042
  {
    name: 'invoice_number_seq sequence (MUHIM-4)',
    sql: `CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000 INCREMENT 1 NO CYCLE`,
  },
  // A4: per-prefix document-number sequences (atomic, race-free) — same proven pattern as
  // invoice_number_seq. Used by nextDocNumber() to replace `PREFIX-${Date.now()}` codegen
  // (millisecond-collision risk in batch inserts + non-human-readable). Format PREFIX-YYYY-NNNNNN.
  // Scoped to PO + MES (opaque formats, no strict regex validator). DLV/SO keep their
  // PREFIX-\d{10} validators → migrated in a separate slice with a matching format.
  { name: 'doc_seq_po sequence (A4)',  sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_po START 1 INCREMENT 1 NO CYCLE` },
  { name: 'doc_seq_mes sequence (A4)', sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_mes START 1 INCREMENT 1 NO CYCLE` },
  // Wave 1 (500K build): PP sex taxonomy + FLEKSO/OFSET department (structure only; values = owner DATA).
  { name: 'work_centers.sex_code column (Wave1 sex-taxonomy)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS sex_code VARCHAR(50)` },
  { name: 'work_centers.department_kind column (Wave1 sex-taxonomy)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS department_kind VARCHAR(10)` },
  // Wave 2 (500K build): PP non-linear routing graph + rework returns + work_center_io_rules (structure; values = owner DATA).
  { name: 'routing_operations.predecessor_operation_id (Wave2)', sql: `ALTER TABLE IF EXISTS routing_operations ADD COLUMN IF NOT EXISTS predecessor_operation_id INTEGER` },
  { name: 'routing_operations.successor_operation_ids (Wave2)', sql: `ALTER TABLE IF EXISTS routing_operations ADD COLUMN IF NOT EXISTS successor_operation_ids JSONB` },
  { name: 'routing_operations.return_to_operation_id (Wave2)', sql: `ALTER TABLE IF EXISTS routing_operations ADD COLUMN IF NOT EXISTS return_to_operation_id INTEGER` },
  { name: 'routing_operations.routing_condition (Wave2)', sql: `ALTER TABLE IF EXISTS routing_operations ADD COLUMN IF NOT EXISTS routing_condition VARCHAR(50)` },
  { name: 'production_order_operations.returned_from_operation_id (Wave2)', sql: `ALTER TABLE IF EXISTS production_order_operations ADD COLUMN IF NOT EXISTS returned_from_operation_id INTEGER` },
  { name: 'production_order_operations.rework_reason (Wave2)', sql: `ALTER TABLE IF EXISTS production_order_operations ADD COLUMN IF NOT EXISTS rework_reason TEXT` },
  { name: 'production_order_operations.rework_count (Wave2)', sql: `ALTER TABLE IF EXISTS production_order_operations ADD COLUMN IF NOT EXISTS rework_count INTEGER NOT NULL DEFAULT 0` },
  { name: 'work_center_io_rules table (Wave2)', sql: `CREATE TABLE IF NOT EXISTS work_center_io_rules (id SERIAL PRIMARY KEY, work_center_id INTEGER NOT NULL, allowed_predecessors JSONB NOT NULL DEFAULT '[]'::jsonb, allowed_successors JSONB NOT NULL DEFAULT '[]'::jsonb, rework_allowed_to JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())` },
  // Wave 4 (500K build): PP per-sex work_center norma/brak/crew parametrlari (structure; values = owner DATA, Q-40).
  { name: 'work_centers.norma_m2_per_shift (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS norma_m2_per_shift NUMERIC(10,2)` },
  { name: 'work_centers.norma_kg_per_shift (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS norma_kg_per_shift NUMERIC(10,2)` },
  { name: 'work_centers.brak_limit_pct (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS brak_limit_pct NUMERIC(5,2)` },
  { name: 'work_centers.min_crew_size (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS min_crew_size INTEGER` },
  { name: 'work_centers.max_crew_size (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS max_crew_size INTEGER` },
  {
    name: 'domain_events outbox table (PA0-6)',
    sql: `
      CREATE TABLE IF NOT EXISTS domain_events (
        id              UUID PRIMARY KEY,
        aggregate_type  TEXT NOT NULL,
        aggregate_id    TEXT NOT NULL,
        event_name      TEXT NOT NULL,
        payload         JSONB NOT NULL,
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at    TIMESTAMPTZ,
        attempts        INTEGER NOT NULL DEFAULT 0,
        last_error      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'domain_events unpublished index',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_domain_events_unpublished
      ON domain_events (published_at, occurred_at)
    `,
  },
  {
    name: 'sd_sales_orders.version column',
    sql: `ALTER TABLE IF EXISTS sd_sales_orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0`,
  },
  {
    name: 'sd_advance_idempotency_keys table',
    sql: `
      CREATE TABLE IF NOT EXISTS sd_advance_idempotency_keys (
        id               SERIAL PRIMARY KEY,
        order_id         INTEGER NOT NULL,
        idempotency_key  TEXT    NOT NULL,
        advance_paid     NUMERIC(15,2) NOT NULL,
        created_at       TIMESTAMP DEFAULT NOW(),
        CONSTRAINT uq_sd_advance_idempotency UNIQUE (order_id, idempotency_key)
      )
    `,
  },
  {
    name: 'wms_alerts deduplicate open low_stock rows before unique index',
    sql: `
      DELETE FROM wms_alerts a
      USING (
        SELECT MIN(id) AS keep_id, material_id, warehouse_id
        FROM wms_alerts
        WHERE type = 'low_stock' AND is_resolved = false
        GROUP BY material_id, warehouse_id
        HAVING COUNT(*) > 1
      ) dup
      WHERE a.material_id = dup.material_id
        AND a.warehouse_id = dup.warehouse_id
        AND a.type = 'low_stock'
        AND a.is_resolved = false
        AND a.id <> dup.keep_id
    `,
  },
  {
    name: 'wms_alerts unique open low_stock index',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS uq_wms_alert_open_low_stock
      ON wms_alerts (material_id, warehouse_id)
      WHERE type = 'low_stock' AND is_resolved = false
    `,
  },
  {
    name: 'sd_orders.version column',
    sql: `ALTER TABLE IF EXISTS sd_orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`,
  },
  {
    name: 'cfo_config table',
    sql: `
      CREATE TABLE IF NOT EXISTS cfo_config (
        id           SERIAL PRIMARY KEY,
        config_key   VARCHAR(100) NOT NULL UNIQUE,
        config_value NUMERIC(20,6) NOT NULL,
        description  TEXT,
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'cfo_config seed ECL rates and financial parameters',
    sql: `
      INSERT INTO cfo_config (config_key, config_value, description) VALUES
        ('ar_ecl_rate_0_30',   0.020000, 'AR ECL stavkasi: 0-30 kun'),
        ('ar_ecl_rate_31_60',  0.080000, 'AR ECL stavkasi: 31-60 kun'),
        ('ar_ecl_rate_61_90',  0.200000, 'AR ECL stavkasi: 61-90 kun'),
        ('ar_ecl_rate_91_plus',0.500000, 'AR ECL stavkasi: 91+ kun'),
        ('default_cost_ratio', 0.350000, 'Standart xarajat nisbati (35% of revenue)'),
        ('min_cash_reserve_uzs',50000000.000000, 'Minimal naqd pul rezervi (so''m)')
      ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value
    `,
  },
  {
    name: 'cfo_config rename ecl_rate keys to ar_ecl_rate',
    sql: `
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_0_30'  WHERE config_key = 'ecl_rate_0_30';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_31_60' WHERE config_key = 'ecl_rate_31_60';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_61_90' WHERE config_key = 'ecl_rate_61_90';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_91_plus' WHERE config_key = 'ecl_rate_91_180';
      DELETE FROM cfo_config WHERE config_key IN ('ecl_rate_181_365','ecl_rate_365plus','ar_ecl_rate_181_365','ar_ecl_rate_365plus','ar_ecl_rate_91_180');
    `,
  },
  {
    name: 'cfo_config consolidate ar_ecl_rate_91_plus and fix default_cost_ratio',
    sql: `
      DELETE FROM cfo_config WHERE config_key IN ('ar_ecl_rate_181_365','ar_ecl_rate_365plus','ar_ecl_rate_91_180');
      INSERT INTO cfo_config (config_key, config_value, description)
        VALUES ('ar_ecl_rate_91_plus', 0.500000, 'AR ECL stavkasi: 91+ kun')
        ON CONFLICT (config_key) DO UPDATE SET config_value = 0.500000;
      UPDATE cfo_config SET config_value = 0.350000, description = 'Standart xarajat nisbati (35% of revenue)'
        WHERE config_key = 'default_cost_ratio';
    `,
  },
  {
    name: 'Sprint1 standard_cost table',
    sql: `
      CREATE TABLE IF NOT EXISTS standard_cost (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name     VARCHAR(255) NOT NULL,
        period           VARCHAR(7)   NOT NULL,
        std_material_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        std_labor_uzs    NUMERIC(18,4) NOT NULL DEFAULT 0,
        std_overhead_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now(),
        UNIQUE (product_name, period)
      );
      CREATE INDEX IF NOT EXISTS idx_standard_cost_product ON standard_cost(product_name);
      CREATE INDEX IF NOT EXISTS idx_standard_cost_period  ON standard_cost(period);
    `,
  },
  { name: 'Sprint1 standard_cost add product_id int col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 standard_cost add std_total_uzs col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS std_total_uzs NUMERIC(18,4) GENERATED ALWAYS AS (std_material_uzs + std_labor_uzs + std_overhead_uzs) STORED` },
  { name: 'Sprint1 standard_cost add created_by int col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 standard_cost product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_standard_cost_product_id ON standard_cost(product_id)` },
  {
    name: 'Sprint1 price_tier table',
    sql: `
      CREATE TABLE IF NOT EXISTS price_tier (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name VARCHAR(255) NOT NULL,
        tier_name    VARCHAR(50)  NOT NULL,
        min_qty      INTEGER      NOT NULL DEFAULT 0,
        max_qty      INTEGER,
        price_uzs    NUMERIC(18,4) NOT NULL,
        valid_from   DATE         NOT NULL,
        valid_to     DATE,
        created_at   TIMESTAMPTZ  DEFAULT now(),
        CONSTRAINT chk_price_tier_qty   CHECK (min_qty >= 0 AND (max_qty IS NULL OR max_qty > min_qty)),
        CONSTRAINT chk_price_tier_price CHECK (price_uzs > 0),
        UNIQUE (product_name, min_qty, valid_from)
      );
      CREATE INDEX IF NOT EXISTS idx_price_tier_product ON price_tier(product_name);
    `,
  },
  { name: 'Sprint1 price_tier add product_id int col',
    sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 price_tier add created_by int col',
    sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 price_tier product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_price_tier_product_id ON price_tier(product_id)` },
  {
    name: 'Sprint1 variance_report table',
    sql: `
      CREATE TABLE IF NOT EXISTS variance_report (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id       UUID NOT NULL,
        mpv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        mqv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        lrv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        lev            NUMERIC(18,4) NOT NULL DEFAULT 0,
        ov             NUMERIC(18,4) NOT NULL DEFAULT 0,
        total_variance NUMERIC(18,4) NOT NULL DEFAULT 0,
        calculated_at  TIMESTAMPTZ   DEFAULT now(),
        UNIQUE (order_id)
      );
      CREATE INDEX IF NOT EXISTS idx_variance_report_order ON variance_report(order_id);
    `,
  },
  { name: 'Sprint1 variance_report drop unique constraint',
    sql: `ALTER TABLE variance_report DROP CONSTRAINT IF EXISTS variance_report_order_id_key` },
  { name: 'Sprint1 variance_report drop old index',
    sql: `DROP INDEX IF EXISTS idx_variance_report_order` },
  { name: 'Sprint1 variance_report order_id to integer',
    sql: `ALTER TABLE variance_report ALTER COLUMN order_id TYPE INTEGER USING NULL` },
  { name: 'Sprint1 variance_report order_id drop notnull',
    sql: `ALTER TABLE variance_report ALTER COLUMN order_id DROP NOT NULL` },
  {
    name: 'Sprint1 variance_report order_id fk',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'variance_report_order_id_fk'
        ) THEN
          ALTER TABLE variance_report ADD CONSTRAINT variance_report_order_id_fk
            FOREIGN KEY (order_id) REFERENCES production_orders(id) ON DELETE CASCADE;
        END IF;
      END $$
    `,
  },
  { name: 'Sprint1 variance_report unique index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_variance_report_order_id ON variance_report(order_id)` },
  {
    name: 'Sprint1 cost_structure table',
    sql: `
      CREATE TABLE IF NOT EXISTS cost_structure (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name     VARCHAR(255) NOT NULL,
        period           VARCHAR(7)   NOT NULL,
        fixed_cost_uzs   NUMERIC(18,4) NOT NULL DEFAULT 0,
        variable_cost_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        selling_price_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now(),
        UNIQUE (product_name, period)
      );
      CREATE INDEX IF NOT EXISTS idx_cost_structure_product ON cost_structure(product_name);
    `,
  },
  { name: 'Sprint1 cost_structure add product_id int col',
    sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 cost_structure add created_by int col',
    sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 cost_structure product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_cost_structure_product_id ON cost_structure(product_id)` },
  {
    name: 'Sprint1 financial_ratios_snapshot table',
    sql: `
      CREATE TABLE IF NOT EXISTS financial_ratios_snapshot (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period           VARCHAR(7)   NOT NULL UNIQUE,
        current_ratio    NUMERIC(12,6),
        quick_ratio      NUMERIC(12,6),
        gross_margin_pct NUMERIC(8,4),
        net_margin_pct   NUMERIC(8,4),
        roa              NUMERIC(8,4),
        roe              NUMERIC(8,4),
        debt_to_equity   NUMERIC(12,6),
        altman_z         NUMERIC(12,6),
        altman_zone      VARCHAR(20),
        revenue          NUMERIC(18,4),
        net_income       NUMERIC(18,4),
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_fin_ratios_snapshot_period ON financial_ratios_snapshot(period DESC);
    `,
  },
  {
    name: 'Sprint1 cfo_config defaults',
    sql: `
      INSERT INTO cfo_config (config_key, config_value, description) VALUES
        ('overhead_rate_per_hour',      15000, 'Umumiy xarajat stavkasi soatiga (UZS)'),
        ('std_labor_rate_per_hour',     25000, 'Standart mehnat stavkasi soatiga (UZS)'),
        ('shares_outstanding',      1000000,   'Muomaladagi aksiyalar soni'),
        ('share_price_uzs',             1000,  'Bir aksiya narxi (UZS)'),
        ('opening_cash_balance_uzs',       0,  'Boshlang\'ich kassa qoldig\'i (UZS)'),
        ('min_cash_reserve_uzs',    50000000,  'Minimal kassa zahirasi (UZS)')
      ON CONFLICT (config_key) DO NOTHING;
    `,
  },
  {
    name: 'marketing_calendar_events table',
    sql: `
      CREATE TABLE IF NOT EXISTS marketing_calendar_events (
        id           SERIAL PRIMARY KEY,
        title        TEXT NOT NULL,
        event_type   VARCHAR(50) NOT NULL DEFAULT 'campaign'
          CHECK (event_type IN ('campaign','meeting','deadline','exhibition')),
        start_date   DATE NOT NULL,
        end_date     DATE,
        description  TEXT,
        status       VARCHAR(50) NOT NULL DEFAULT 'planned'
          CHECK (status IN ('planned','ongoing','completed','cancelled')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'marketing_calendar_events.start_date index',
    sql: `CREATE INDEX IF NOT EXISTS idx_marketing_calendar_events_start_date ON marketing_calendar_events (start_date)`,
  },
  // T7-05 (reconcile BRAK 1 — "operator = KARTA"): direct, ADDITIVE card link on the
  // canonical MES session table. The A67 ckp-mes-feed listener already resolves the
  // ЦКП card from real links (users.card_id → employee_cards → pp_work_centers.
  // org_department_id), but those are all owner-DATA today (0 work-center cards,
  // workers without card_id) so every completed session currently skips. This column
  // lets MES record the responsible card (org_departments.id) directly at session
  // time — the vision's canonical operator=KARTA link — which the listener prefers
  // (priority-0) over the resolve-via paths. Nullable + ON DELETE SET NULL: existing
  // 8 rows stay valid (NULL), no fabrication (Q-40); the value is owner/MES DATA.
  // Idempotent ADD COLUMN IF NOT EXISTS — same proven additive pattern as
  // standard_cost.product_id above; applied at boot via ensureSchemaAdditions().
  {
    name: 'T7-05 production_sessions.operator_card_id (operator=KARTA link)',
    sql: `ALTER TABLE IF EXISTS production_sessions ADD COLUMN IF NOT EXISTS operator_card_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL`,
  },
  {
    name: 'T7-05 production_sessions.operator_card_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_production_sessions_operator_card_id ON production_sessions (operator_card_id)`,
  },
  // FAZA D (Hujjat/PDF akt, 2026-07-01): kategoriya-bo'yicha akt raqamlash sequences.
  // APPROVED: egasi vizyon-qurish 2026-07-01, FAZA D.
  // Bo'shliq: pos_movements.movement_number avval bitta generic 'POS-YYYY-NNNNN'
  // hisoblagichdan foydalanardi (harakat turi raqamda aks etmasdi). Endi har
  // MovementCategory (KIRIM/CHIQIM/KOCHIRISH/INVENTARIZATSIYA/ZARAR) o'zining
  // atomik PostgreSQL SEQUENCE'iga ega — nextDocNumber() (doc-sequences.helper.ts)
  // orqali "PREFIX-YYYY-NNNNNN" formatda (masalan KIRIM-AKT-2026-000001). Xuddi
  // shu proven pattern — doc_seq_po / doc_seq_mes bilan bir xil (A4 yuqorida).
  { name: 'doc_seq_kirim_akt sequence (FAZA D)',     sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_kirim_akt START 1 INCREMENT 1 NO CYCLE` },
  { name: 'doc_seq_chiqim_akt sequence (FAZA D)',    sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_chiqim_akt START 1 INCREMENT 1 NO CYCLE` },
  { name: 'doc_seq_kochirish_akt sequence (FAZA D)', sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_kochirish_akt START 1 INCREMENT 1 NO CYCLE` },
  { name: 'doc_seq_inv_akt sequence (FAZA D)',       sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_inv_akt START 1 INCREMENT 1 NO CYCLE` },
  { name: 'doc_seq_zarar_akt sequence (FAZA D)',     sql: `CREATE SEQUENCE IF NOT EXISTS doc_seq_zarar_akt START 1 INCREMENT 1 NO CYCLE` },
  // 2.15-summa-tasdiq-darvoza (MASTER-REJA-VIZYON-2026-07-02): ZVS summa-chegaralari avval
  // zvs.service.ts'da HARDCODE edi (<=500k lvl1, <=5M lvl2, >5M lvl3). approval_matrix_config
  // jadvali ALLAQACHON mavjud (bo'sh) — bu yerda document_type='zvs' bilan 3 qator SEED qilinadi
  // (mavjud hardcode qiymatlarning aynan o'zi — xulq-atvor o'zgarmaydi, faqat manba DB'ga ko'chadi;
  // egasi keyinchalik screen orqali sozlashi mumkin). approver_role bir nechta rolni vergul bilan
  // saqlaydi (ZvsService shu formatni vergul bo'yicha split qiladi) — yangi CREATE TABLE emas,
  // mavjud jadvalga qator qo'shish (Q-35 additive, jadval yaratilmaydi).
  // APPROVED: egasi 2026-07-02 vizyonni toliq qilish
  // Ustun kengaytirish (widen, additive — DROP/torайтirish emas): live approver_role
  // VARCHAR(50) edi — ko'p-rolli vergul-ro'yxat ("admin,super_admin,...,manager" = 76 belgi)
  // sig'maydi. VARCHAR(255)ga kengaytirish faqat limitni oshiradi, mavjud qiymatlarga
  // (hozircha 0 qator) ta'sir qilmaydi — Q-39/Q-46 regressiya emas.
  {
    name: 'approval_matrix_config.approver_role widen VARCHAR(255) (2.15 — comma-role-list)',
    sql: `ALTER TABLE IF EXISTS approval_matrix_config ALTER COLUMN approver_role TYPE VARCHAR(255)`,
  },
  {
    name: 'approval_matrix_config seed (zvs) — 2.15 summa-tasdiq-darvoza',
    sql: `
      INSERT INTO approval_matrix_config
        (document_type, min_amount, max_amount, approval_level, approver_role, is_active)
      SELECT * FROM (VALUES
        ('zvs'::varchar, 0::numeric,       500000::numeric,  1, 'admin,super_admin,director,ceo,cfo,finance_manager,department_head,manager'::varchar, true),
        ('zvs'::varchar, 500000::numeric,  5000000::numeric, 2, 'admin,super_admin,director,ceo,cfo,finance_manager'::varchar, true),
        ('zvs'::varchar, 5000000::numeric, NULL::numeric,    3, 'admin,super_admin,director,ceo'::varchar, true)
      ) AS seed(document_type, min_amount, max_amount, approval_level, approver_role, is_active)
      WHERE NOT EXISTS (SELECT 1 FROM approval_matrix_config WHERE document_type = 'zvs')
    `,
  },
  {
    name: 'approval_matrix_config document_type+active index (2.15)',
    sql: `CREATE INDEX IF NOT EXISTS idx_approval_matrix_config_doctype_active ON approval_matrix_config (document_type, is_active)`,
  },
  // EP-ORG-116 follow-up (2026-07-07): mentor assignment/approval CRUD on lms_card_mentors is
  // real (T10-09), but no rating or qualification-verification existed. Additive columns only
  // (Q-35 — no new table). `rating` nullable NUMERIC(2,1), bounded 0..5 via CHECK — same
  // bounded-rating shape as employee_360_assessments.*_rating. Existing rows unaffected (Q-39,
  // live table = 0 rows, dry-run verified 2026-07-07). See
  // apps/api/src/shared/db/migrations/lms-card-mentors-rating-qualification-2026-07-07.sql for
  // the human-readable mirror of this entry.
  {
    name: 'lms_card_mentors.rating column (mentor bahosi, EP-ORG-116 follow-up)',
    sql: `ALTER TABLE IF EXISTS lms_card_mentors ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) CHECK (rating BETWEEN 0 AND 5)`,
  },
  {
    name: 'lms_card_mentors.qualification_verified_at column (EP-ORG-116 follow-up)',
    sql: `ALTER TABLE IF EXISTS lms_card_mentors ADD COLUMN IF NOT EXISTS qualification_verified_at TIMESTAMP`,
  },
  // FK convention mirrors standard_cost.created_by / price_tier.created_by above (REFERENCES
  // users(id) ON DELETE SET NULL — verifier account deletion must not delete the mentor record).
  {
    name: 'lms_card_mentors.qualification_verified_by column (EP-ORG-116 follow-up)',
    sql: `ALTER TABLE IF EXISTS lms_card_mentors ADD COLUMN IF NOT EXISTS qualification_verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
  },
  // VISION-3340 #13 (2026-07-08): razryad_levels.min_months=0 silently disables the
  // 3-month interval guard already coded in razryad-history.service.ts checkInterval()
  // ("if (minMonths <= 0) return Ok(true)"). All 6 rows carry the column DEFAULT 0
  // (razryad-levels-upgrade-2026-06-18.sql) and were never set — DATA-only backfill,
  // guard logic itself is unchanged. APPROVED: egasi — EP-ORG-011 "Imtihon oralig'i
  // (min 3 oy)", Holat: JAVOBLANGAN/APPROVE (docs/audit/decisions/01-org-kartalar.md:85-90).
  // See apps/api/src/shared/db/migrations/razryad-min-months-activate-2026-07-08.sql for
  // the human-readable mirror of this entry.
  {
    name: 'razryad_levels.min_months activate 3-month guard (VISION-3340 #13, EP-ORG-011)',
    sql: `UPDATE public.razryad_levels SET min_months = 3 WHERE min_months = 0`,
  },
  // VISION-3340 #16 (2026-07-08): material_kit_items had no FK to material_batches
  // (28 cols, 0 rows) — a floor-operator's scan could never be traced back to the
  // physical LOT it consumed. Additive nullable FK; write-path is
  // IotTabletController.persistKitItemScan (scanMaterialKitItem/patchScanMaterialKitItem).
  {
    name: 'material_kit_items.batch_id column (VISION-3340 #16, LOT/batch traceability)',
    sql: `ALTER TABLE IF EXISTS material_kit_items ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES material_batches(id) ON DELETE SET NULL`,
  },
  {
    name: 'material_kit_items.batch_id index (VISION-3340 #16)',
    sql: `CREATE INDEX IF NOT EXISTS idx_material_kit_items_batch_id ON material_kit_items(batch_id)`,
  },
  // APPROVED: egasi 2026-06-30 "kod-tomonni boshla" — notification_schedules jadval yaratish
  // kiritilgan (Modul 18 / NTF Q3/Q79: markazlashtirilgan, sozlanuvchi, takrorlanuvchi
  // bildirishnoma-jadval matritsasi). Recovered from a weeks-old uncommitted working-tree
  // state (see apps/api/src/shared/db/migrations/notification-schedules-2026-06-30.sql for
  // the human-readable mirror of this entry) — this MigrationDef registration itself never
  // existed before, so the table was never actually applied despite the source/SQL files
  // being written.
  {
    name: 'notification_schedules table (2026-06-30, egasi-approved)',
    sql: `
      CREATE TABLE IF NOT EXISTS notification_schedules (
        id                SERIAL PRIMARY KEY,
        name              TEXT        NOT NULL,
        notification_type TEXT        NOT NULL,
        target_role       TEXT,
        target_user_id    INTEGER,
        title_uz          TEXT        NOT NULL,
        title_ru          TEXT,
        body_uz           TEXT        NOT NULL,
        body_ru           TEXT,
        priority          VARCHAR(10) NOT NULL DEFAULT 'normal',
        interval_hours    INTEGER     NOT NULL DEFAULT 24,
        next_run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_run_at       TIMESTAMPTZ,
        is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'notification_schedules due-lookup index (2026-06-30)',
    sql: `CREATE INDEX IF NOT EXISTS idx_notification_schedules_due ON notification_schedules (next_run_at) WHERE is_active = TRUE`,
  },
  {
    name: 'notification_schedules default daily company-digest seed (2026-06-30)',
    sql: `
      INSERT INTO notification_schedules
        (name, notification_type, target_role, title_uz, title_ru, body_uz, body_ru, priority, interval_hours, next_run_at)
      SELECT
        'Kunlik kompaniya digesti', 'company_digest', 'super_admin',
        'Kunlik hisobot', 'Ежедневный отчёт',
        'Bugungi kompaniya holati: buyurtmalar, ishlab chiqarish, moliya — panelda ko''ring.',
        'Состояние компании за сегодня: заказы, производство, финансы — смотрите на панели.',
        'normal', 24, date_trunc('day', NOW()) + INTERVAL '1 day 9 hours'
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_schedules WHERE notification_type = 'company_digest' AND target_role = 'super_admin'
      )
    `,
  },
  // APPROVED: egasi 2026-06-30 "vizyon bo'yicha to'liq" — Modul 02 (HR) tijorat siri NDA
  // imzosi (vizyon 02.41: alohida bayonnoma + onboarding'da majburiy imzo). Recovered from
  // a weeks-old uncommitted working-tree state alongside the NdaModule source
  // (apps/api/src/modules/hr/nda/) — see
  // apps/api/src/shared/db/migrations/hr-nda-2026-06-30.sql for the human-readable mirror.
  {
    name: 'hr_nda_acknowledgments table (2026-06-30, egasi-approved)',
    sql: `
      CREATE TABLE IF NOT EXISTS hr_nda_acknowledgments (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER     NOT NULL,
        document_title   TEXT        NOT NULL DEFAULT 'Tijorat siri to''g''risida bitim (NDA)',
        document_version TEXT        NOT NULL DEFAULT 'v1',
        status           TEXT        NOT NULL DEFAULT 'pending',
        signed_at        TIMESTAMPTZ,
        notes            TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT ck_hr_nda_status CHECK (status IN ('pending','signed'))
      )
    `,
  },
  {
    name: 'hr_nda_acknowledgments user index (2026-06-30)',
    sql: `CREATE INDEX IF NOT EXISTS idx_hr_nda_user ON hr_nda_acknowledgments (user_id)`,
  },
  {
    name: 'hr_nda_acknowledgments pending-status partial index (2026-06-30)',
    sql: `CREATE INDEX IF NOT EXISTS idx_hr_nda_pending ON hr_nda_acknowledgments (status) WHERE status = 'pending'`,
  },
  // APPROVED: egasi 2026-06-30 "vizyon bo'yicha to'liq" — Modul 14 (Marketing) NPS
  // avto-yig'ish so'rovi (vizyon 14.60). All consumer source (nps-auto-request.listener.ts,
  // nps-requests.repository.ts, nps-requests.controller.ts, marketing.module.ts) was already
  // committed and depended on this table; only this migration's registration was missing.
  {
    name: 'nps_requests table (2026-06-30, egasi-approved)',
    sql: `
      CREATE TABLE IF NOT EXISTS nps_requests (
        id              SERIAL PRIMARY KEY,
        delivery_id     INTEGER,
        sales_order_id  INTEGER,
        customer_id     INTEGER,
        customer_name   TEXT,
        status          TEXT        NOT NULL DEFAULT 'pending',
        nps_response_id INTEGER,
        requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        responded_at    TIMESTAMPTZ,
        CONSTRAINT ck_nps_req_status CHECK (status IN ('pending','responded','skipped'))
      )
    `,
  },
  {
    name: 'nps_requests unique delivery index (2026-06-30)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_nps_req_delivery ON nps_requests (delivery_id) WHERE delivery_id IS NOT NULL`,
  },
  {
    name: 'nps_requests pending-status index (2026-06-30)',
    sql: `CREATE INDEX IF NOT EXISTS idx_nps_req_pending ON nps_requests (status) WHERE status = 'pending'`,
  },
  // APPROVED: Claude (egasi vakolati) 2026-06-20 — org_node_portret.card_id enables
  // per-CARD portret (not just per-node/dept), EP-ORG Phase 5 Tab 7. Already-committed
  // consumers (card.controller.ts, card.repository.ts, card.service.ts,
  // node-portret.repository.ts, ddl-migrations.ts) depend on this column; only this
  // migration's registration was missing.
  {
    name: 'org_node_portret.card_id column (2026-06-19, egasi-approved)',
    sql: `ALTER TABLE public.org_node_portret ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES public.org_functions(id) ON DELETE SET NULL`,
  },
  {
    name: 'org_node_portret.card_id partial index (2026-06-19)',
    sql: `CREATE INDEX IF NOT EXISTS idx_org_node_portret_card_id ON public.org_node_portret(card_id) WHERE card_id IS NOT NULL`,
  },
  // APPROVED: Claude (egasi vakolati) 2026-06-20 — razryad_levels exam configurability
  // (EP-ORG-055 pass threshold + EP-ORG-056 max retakes). DEFAULT NULL is deliberate per
  // owner's own "no hardcoded default" instruction — NULL means "owner hasn't set a value
  // yet", not a fallback threshold. Already-committed consumers (lms-completion.service.ts,
  // card.repository.ts, exam-passed-razryad.listener.ts, razryad-history.repository.ts,
  // razryad-history.service.ts) depend on these columns; only this migration's registration
  // was missing.
  {
    name: 'razryad_levels.exam_pass_threshold + max_retakes columns (2026-06-19, egasi-approved)',
    sql: `ALTER TABLE public.razryad_levels ADD COLUMN IF NOT EXISTS exam_pass_threshold NUMERIC(5,2) DEFAULT NULL, ADD COLUMN IF NOT EXISTS max_retakes INTEGER DEFAULT NULL`,
  },
  {
    name: 'razryad_levels exam_pass_threshold/max_retakes CHECK constraints (2026-06-19)',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_razryad_exam_pass_threshold') THEN
          ALTER TABLE public.razryad_levels
            ADD CONSTRAINT chk_razryad_exam_pass_threshold
            CHECK (exam_pass_threshold IS NULL OR exam_pass_threshold BETWEEN 0 AND 100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_razryad_max_retakes') THEN
          ALTER TABLE public.razryad_levels
            ADD CONSTRAINT chk_razryad_max_retakes
            CHECK (max_retakes IS NULL OR max_retakes >= 0);
        END IF;
      END $$
    `,
  },
  // APPROVED: Claude (egasi vakolati) 2026-06-20 — org_departments unit fields for the
  // Bo'lim→Sex→Uskuna→Ishchi hierarchy (code/QYM-uz/QYM-ru/camera-zone/Telegram-group-ID).
  // Already-committed consumers (hr-map-compat.service.ts, erp-camera.repository.ts,
  // drizzle-camera-dashboard.repo.ts, drizzle-camera.repo.ts, drizzle-iot-main.repo.ts)
  // depend on these columns; only this migration's registration was missing.
  {
    name: 'org_departments unit fields: code/qym_uz/qym_ru/camera_zone_id/telegram_group_id (2026-06-19, egasi-approved)',
    sql: `ALTER TABLE public.org_departments ADD COLUMN IF NOT EXISTS code VARCHAR(50), ADD COLUMN IF NOT EXISTS qym_uz TEXT, ADD COLUMN IF NOT EXISTS qym_ru TEXT, ADD COLUMN IF NOT EXISTS camera_zone_id TEXT, ADD COLUMN IF NOT EXISTS telegram_group_id TEXT`,
  },
  // APPROVED: egasi 2026-06-30 "kod-tomonni boshla / vizyon bo'yicha to'liq" — Modul 09 (QC)
  // o'lchov asboblari kalibrovkasi (09.36). Already-committed consumer
  // (instrument-calibration.repository.ts) depends on this table; only this migration's
  // registration was missing.
  {
    name: 'qc_instrument_calibrations table (2026-06-30, egasi-approved)',
    sql: `
      CREATE TABLE IF NOT EXISTS qc_instrument_calibrations (
        id                  SERIAL PRIMARY KEY,
        instrument_name     TEXT        NOT NULL,
        instrument_code     TEXT,
        location            TEXT,
        responsible_user_id INTEGER,
        interval_days       INTEGER     NOT NULL DEFAULT 365,
        last_calibrated_at  DATE,
        next_due_at         DATE,
        certificate_number  TEXT,
        status              TEXT        NOT NULL DEFAULT 'active',
        notes               TEXT,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT ck_qc_calib_status CHECK (status IN ('active','retired'))
      )
    `,
  },
  {
    name: 'qc_instrument_calibrations due-lookup index (2026-06-30)',
    sql: `CREATE INDEX IF NOT EXISTS idx_qc_calib_due ON qc_instrument_calibrations (next_due_at) WHERE status = 'active'`,
  },
  // APPROVED: egasi (owner) 2026-07-08 VISION-3340 #38 — IoT tablet offline defect /
  // inline-QC / material-return mutations had no dedup key, so an offline tablet
  // re-submitting after a network retry double-inserts. Adds an OPTIONAL idempotency
  // key (tablet_id TEXT + local_seq_no BIGINT, both nullable) to each of the three
  // raw-SQL INSERT targets, plus a PARTIAL UNIQUE INDEX per table on (tablet_id,
  // local_seq_no) WHERE both NOT NULL so legacy NULL rows are exempt. Write-path is
  // IotTabletController.reportProductionDefect/submitInlineQc/submitMaterialReturn.
  // See apps/api/src/shared/db/migrations/iot-tablet-idempotency-2026-07-08.sql for
  // the human-readable mirror of these entries.
  {
    name: 'downtime_events.tablet_id column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS downtime_events ADD COLUMN IF NOT EXISTS tablet_id TEXT`,
  },
  {
    name: 'downtime_events.local_seq_no column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS downtime_events ADD COLUMN IF NOT EXISTS local_seq_no BIGINT`,
  },
  {
    name: 'inline_qc_checks.tablet_id column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS inline_qc_checks ADD COLUMN IF NOT EXISTS tablet_id TEXT`,
  },
  {
    name: 'inline_qc_checks.local_seq_no column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS inline_qc_checks ADD COLUMN IF NOT EXISTS local_seq_no BIGINT`,
  },
  {
    name: 'material_movements.tablet_id column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS material_movements ADD COLUMN IF NOT EXISTS tablet_id TEXT`,
  },
  {
    name: 'material_movements.local_seq_no column (VISION-3340 #38, iot-tablet idempotency)',
    sql: `ALTER TABLE IF EXISTS material_movements ADD COLUMN IF NOT EXISTS local_seq_no BIGINT`,
  },
  {
    name: 'downtime_events (tablet_id, local_seq_no) partial unique index (VISION-3340 #38)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_downtime_events_tablet_seq ON downtime_events (tablet_id, local_seq_no) WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL`,
  },
  {
    name: 'inline_qc_checks (tablet_id, local_seq_no) partial unique index (VISION-3340 #38)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_inline_qc_checks_tablet_seq ON inline_qc_checks (tablet_id, local_seq_no) WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL`,
  },
  {
    name: 'material_movements (tablet_id, local_seq_no) partial unique index (VISION-3340 #38)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_material_movements_tablet_seq ON material_movements (tablet_id, local_seq_no) WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL`,
  },
];
