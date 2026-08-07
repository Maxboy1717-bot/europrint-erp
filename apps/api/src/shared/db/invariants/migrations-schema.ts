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
  // APPROVED: egasi (owner) 2026-07-08 VISION-3340 #21 — cost_centers is full CRUD master
  // data (drizzle-fi.repo.ts), but no GL posting could be tagged to a cost center: the
  // canonical posting table `entries` (written by drizzle-gl-posting.repo.ts's
  // insertJournal/insertEntry — the ONE engine, NOT gl_journal_entries/gl_lines, SAP#76)
  // had no cost_center_id. Adds an OPTIONAL nullable FK tag to each GL journal line, plus
  // an index. cost_centers.id is SERIAL (integer) so the INTEGER FK matches; ON DELETE SET
  // NULL keeps historical entries intact when a cost center is deleted. Existing rows/callers
  // unaffected (NULL when the tag is omitted — Q-39/Q-46). See
  // apps/api/src/shared/db/migrations/gl-entries-cost-center-2026-07-08.sql for the
  // human-readable mirror of these entries.
  {
    name: 'entries.cost_center_id column (VISION-3340 #21, GL cost-center tag)',
    sql: `ALTER TABLE IF EXISTS entries ADD COLUMN IF NOT EXISTS cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL`,
  },
  {
    name: 'entries.cost_center_id index (VISION-3340 #21)',
    sql: `CREATE INDEX IF NOT EXISTS idx_entries_cost_center_id ON entries (cost_center_id)`,
  },
  // APPROVED: egasi (owner) 2026-07-08 VISION-3340 #23 — two NEW tables:
  //   (A) pp_reason_codes — structured, reusable order-level PP reason lookup
  //       (mirrors downtime_reason_codes shape) so a flagged order can reference a
  //       reason code instead of only free-text. Seeds NOTHING (owner master-data, Q-40).
  //       Adds a NULLABLE production_orders.reason_code_id tag (write-path:
  //       pp-orders.controller.ts setFlags → ProductionOrdersService.updateFlags →
  //       DrizzlePpProductionOrdersRepository.updateFlags).
  //   (B) pp_shift_plans — real persistence target for the AI 7-step planner's step 6
  //       (PpAiPlanningService.runStep6ShiftAssign), replacing its hardcoded stub.
  // See apps/api/src/shared/db/migrations/pp-reason-codes-shift-plans-2026-07-08.sql
  // for the human-readable mirror of these entries. work_centers.id is SERIAL so the
  // INTEGER FK on pp_shift_plans.work_center_id is type-correct; both FKs use ON DELETE
  // SET NULL so existing rows stay valid (Q-39/Q-46).
  {
    name: 'pp_reason_codes table (VISION-3340 #23, order-level reason lookup)',
    sql: `
      CREATE TABLE IF NOT EXISTS pp_reason_codes (
        id          SERIAL PRIMARY KEY,
        code        VARCHAR(30)  NOT NULL UNIQUE,
        name        TEXT         NOT NULL,
        name_ru     TEXT,
        category    VARCHAR(30)  NOT NULL,
        color       VARCHAR(10)  DEFAULT '#808080',
        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
        sort_order  INTEGER      NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'pp_reason_codes active index (VISION-3340 #23)',
    sql: `CREATE INDEX IF NOT EXISTS idx_pp_reason_codes_active ON pp_reason_codes (is_active, sort_order)`,
  },
  {
    name: 'production_orders.reason_code_id column (VISION-3340 #23, structured flag reason)',
    sql: `ALTER TABLE IF EXISTS production_orders ADD COLUMN IF NOT EXISTS reason_code_id INTEGER REFERENCES pp_reason_codes(id) ON DELETE SET NULL`,
  },
  {
    name: 'production_orders.reason_code_id index (VISION-3340 #23)',
    sql: `CREATE INDEX IF NOT EXISTS idx_production_orders_reason_code_id ON production_orders (reason_code_id)`,
  },
  {
    name: 'pp_shift_plans table (VISION-3340 #23, real shift-plan persistence)',
    sql: `
      CREATE TABLE IF NOT EXISTS pp_shift_plans (
        id                 SERIAL PRIMARY KEY,
        work_center_id     INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,
        shift_date         DATE,
        shift_type         VARCHAR(20),
        target_quantity    NUMERIC(18,4),
        assigned_employees JSONB,
        created_by         INTEGER,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'pp_shift_plans (work_center_id, shift_date, shift_type) unique index (VISION-3340 #23)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_shift_plans_wc_date_type ON pp_shift_plans (work_center_id, shift_date, shift_type)`,
  },
  {
    name: 'pp_shift_plans shift_date index (VISION-3340 #23)',
    sql: `CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_shift_date ON pp_shift_plans (shift_date)`,
  },
  // APPROVED: egasi (owner) 2026-07-08 VISION-3340 #31 — crm_deals.lost_reason was
  // FREE-TEXT only, so no rollup/analytics over WHY deals are lost was possible. Adds a
  // structured loss-reason taxonomy (crm_loss_reasons — seeds NOTHING, owner master-data,
  // Q-40) plus an OPTIONAL nullable crm_deals.lost_reason_id FK tag; the existing free-text
  // lost_reason column is kept as a supplementary note. Table is created FIRST so the ALTER
  // that references it always resolves. FK is ON DELETE SET NULL (deleting a reason keeps
  // historical deals — Q-39/Q-46). Write path: MarkDealLostHandler → DrizzleDealRepository
  // .updateLostReasonId. Read path: GET /api/crm/analytics/loss-reasons →
  // DrizzleCrmAnalyticsRepository.getLossReasonRollup. See
  // apps/api/src/shared/db/migrations/crm-loss-reasons-2026-07-08.sql for the human-readable
  // mirror of these entries.
  {
    name: 'crm_loss_reasons table (VISION-3340 #31, loss-reason taxonomy)',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_loss_reasons (
        id          SERIAL       PRIMARY KEY,
        code        VARCHAR(50)  NOT NULL UNIQUE,
        label_uz    TEXT,
        label_ru    TEXT,
        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
        sort_order  INTEGER      NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'crm_loss_reasons active index (VISION-3340 #31)',
    sql: `CREATE INDEX IF NOT EXISTS idx_crm_loss_reasons_active ON crm_loss_reasons (is_active, sort_order)`,
  },
  {
    name: 'crm_deals.lost_reason_id column (VISION-3340 #31, structured loss reason)',
    sql: `ALTER TABLE IF EXISTS crm_deals ADD COLUMN IF NOT EXISTS lost_reason_id INTEGER REFERENCES crm_loss_reasons(id) ON DELETE SET NULL`,
  },
  {
    name: 'crm_deals.lost_reason_id index (VISION-3340 #31)',
    sql: `CREATE INDEX IF NOT EXISTS idx_crm_deals_lost_reason_id ON crm_deals (lost_reason_id)`,
  },
  // APPROVED: egasi (owner) 2026-07-08 VISION-3340 #34 — the CRM stage-transition handlers
  // (update-deal-stage.handler.ts / update-lead-stage.handler.ts) overwrote stage_id in place
  // with NO audit trail. Adds one append-only history table (crm_stage_history) that receives a
  // row on each successful transition. Seeds NOTHING (Q-40 — rows come only from real moves).
  // entity_id is VARCHAR (not integer) on purpose: a deal id is a UUID (crm_deals.id ::uuid) and
  // a lead id is an integer, so one column must hold both; from_stage/to_stage are VARCHAR
  // (deal stage = free-form code, lead stage = numeric crm_lead_stages.id stored as text);
  // changed_by is a plain nullable INTEGER (neither command carries an acting user yet → NULL).
  // Write path (best-effort, never rolls back the transition): DrizzleCrmDealsRepository /
  // CrmLeadsOpsRepository.recordStageHistory. See
  // apps/api/src/shared/db/migrations/crm-stage-history-2026-07-08.sql for the human-readable
  // mirror of these entries.
  {
    name: 'crm_stage_history table (VISION-3340 #34, stage-transition audit trail)',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_stage_history (
        id          SERIAL       PRIMARY KEY,
        entity_type VARCHAR(10)  NOT NULL,
        entity_id   VARCHAR(64)  NOT NULL,
        from_stage  VARCHAR(100),
        to_stage    VARCHAR(100) NOT NULL,
        changed_by  INTEGER,
        changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'crm_stage_history (entity_type, entity_id, changed_at) index (VISION-3340 #34)',
    sql: `CREATE INDEX IF NOT EXISTS idx_crm_stage_history_entity ON crm_stage_history (entity_type, entity_id, changed_at)`,
  },
  // VISION-3340 #32 (2026-07-08, owner-approved option (a)): crm_deals.sales_order_id
  // varchar -> integer + FK to sales_orders(id). crm_deals is a VIEW over base `deals`, so this
  // DROPs/RECREATEs the 50-column pass-through view around a base-column type change. Idempotent:
  // the structural block only fires while deals.sales_order_id is still character varying; the FK
  // only adds when absent. Validated by a BEGIN/ROLLBACK dry-run (exact 50-col recreation, view
  // stays auto-updatable, counts unchanged). Human-readable mirror + full rationale:
  // apps/api/src/shared/db/migrations/crm-deals-sales-order-fk-2026-07-08.sql.
  {
    name: 'crm_deals.sales_order_id varchar->integer + FK (VISION-3340 #32, view rebuild)',
    sql: `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'deals' AND column_name = 'sales_order_id' AND data_type = 'character varying'
        ) THEN
          DROP VIEW IF EXISTS crm_deals;
          ALTER TABLE deals
            ALTER COLUMN sales_order_id TYPE integer USING NULLIF(btrim(sales_order_id), '')::integer;
          CREATE VIEW crm_deals AS
            SELECT id, lead_id, title, amount, currency, status, probability, won_at, lost_reason,
                   created_by, created_at, updated_at, stage_semantic_id, opportunity, value, customer_id,
                   manager_id, closed_at, category_id, stage_id, is_new, is_recurring, is_return_customer,
                   is_repeated_approach, currency_id, is_manual_opportunity, tax_value, company_id, contact_ids,
                   begin_date, close_date, assigned_by_id, created_by_id, modify_by_id, date_create, date_modify,
                   opened, closed, comments, additional_info, originator_id, origin_id, sales_order_id,
                   forecast_amount, sla_deadline, is_repeating, last_activity_at, next_activity_at, deleted_at, metadata
            FROM deals;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'deals' AND constraint_name = 'fk_deals_sales_order'
        ) THEN
          ALTER TABLE deals
            ADD CONSTRAINT fk_deals_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `,
  },
  // POS-19 #49 (Bitta qurilmada MES brak + POS chiqim, mes_session_id FK) — vision
  // vision-1000-answers/19-pos.md #49: "MES sessiya ID POS harakat metadata'siga avtomatik
  // bog'lanadi: pos_movements.mes_session_id -> MES production_sessions.id FK." Column
  // confirmed absent via a full information_schema.columns read of pos_movements
  // (2026-07-11); production_sessions(id integer) confirmed to exist. Pure additive
  // ADD COLUMN, nullable, ON DELETE SET NULL — no consumer wiring yet (schema-only per
  // the build note; the auto-link write path is a separate later slice).
  // APPROVED: owner schema-approval wave 2026-07-11 (Muslimbek, chat) — Q-35,
  // docs/audit/_PHASE2-OWNER-DECISIONS-2026-07-11.md ##49 (Schema sign-off Q-35 batch).
  // Human-readable mirror:
  // apps/api/src/shared/db/migrations/pos-49-mes-session-id-fk-2026-07-11.sql.
  {
    name: 'pos_movements.mes_session_id FK -> production_sessions (POS-19 #49)',
    sql: `ALTER TABLE IF EXISTS pos_movements ADD COLUMN IF NOT EXISTS mes_session_id INTEGER REFERENCES production_sessions(id) ON DELETE SET NULL`,
  },
  {
    name: 'pos_movements.mes_session_id index (POS-19 #49)',
    sql: `CREATE INDEX IF NOT EXISTS idx_pos_movements_mes_session_id ON pos_movements (mes_session_id)`,
  },
  // LMS-12 #30 (2026-07-11): legal-minimal certificate fields — vision
  // docs/audit/vision-1000-answers/12-lms.md #30 requires to'liq ism / lavozim / tashkilot
  // nomi / tasdiq sana+vaqt / IP manzil / SHA-256 hash on every issued certificate (F5
  // immutable-document principle). ism (employees JOIN) and sana (issued_at/issued_date)
  // already exist on `certificates`; the two missing technical columns are added here
  // (additive, nullable — Q-39 existing rows unaffected). Wired in both certificate-issuance
  // write paths (LmsCertRepo.saveCertificate for POST /lms/certificates/issue,
  // LmsCoursesExtendedRepository.saveCertificate for POST /certificates) since both insert
  // into this same table. See
  // apps/api/src/shared/db/migrations/lms-certificate-legal-fields-2026-07-11.sql for the
  // human-readable mirror of this entry.
  {
    name: 'certificates.issued_ip column (LMS-12 #30, legal-minimal cert fields)',
    sql: `ALTER TABLE IF EXISTS certificates ADD COLUMN IF NOT EXISTS issued_ip VARCHAR(64)`,
  },
  {
    name: 'certificates.cert_hash column (LMS-12 #30, SHA-256 digital-signature substitute)',
    sql: `ALTER TABLE IF EXISTS certificates ADD COLUMN IF NOT EXISTS cert_hash VARCHAR(64)`,
  },
  // Owner decision 2026-07-13 (chat): council kvorumi endi HAR BIR kengash uchun CRUD orqali
  // sozlanadigan bo'lishi kerak — avval COUNCIL_QUORUM_NUMERATOR/DENOMINATOR
  // (business.constants.ts, 2/3) BARCHA kengashlarga global qattiq-kodlangan edi. Nullable —
  // NULL qolsa council-quorum.service.ts o'sha global konstantalarga qaytadi (additive,
  // regressiya yo'q). CRUD: mavjud PATCH /coordination/councils/:id (coordination.repository.ts
  // updateCouncil) orqali. APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/council-quorum-override-2026-07-13.sql.
  {
    name: 'councils.quorum_numerator column (per-council kvorum override, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS councils ADD COLUMN IF NOT EXISTS quorum_numerator INTEGER`,
  },
  {
    name: 'councils.quorum_denominator column (per-council kvorum override, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS councils ADD COLUMN IF NOT EXISTS quorum_denominator INTEGER`,
  },
  // council_votes — har bir a'zoning har bir qarorga (decision_ref) bergan alohida ovozi.
  // council-quorum.service.ts'ning evaluateDecision() ilgari faqat agregat
  // presentCount/votesFor/votesAgainst integer qabul qilardi (per-vote yozuv yo'q edi). Eski
  // aggregat-integer yo'l o'zgarmasdan ishlaydi (Q-46); bu jadval council-members.controller.ts
  // POST /councils/:councilId/votes orqali to'ldiriladi va decisionRef bilan tally qilinadi.
  {
    name: 'council_votes table (per-member vote logging, owner 2026-07-13)',
    sql: `CREATE TABLE IF NOT EXISTS council_votes (
      id            SERIAL PRIMARY KEY,
      council_id    INTEGER     NOT NULL,
      decision_ref  TEXT        NOT NULL,
      voter_user_id INTEGER     NOT NULL,
      vote          TEXT        NOT NULL,
      voted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_council_votes_decision_voter UNIQUE (council_id, decision_ref, voter_user_id),
      CONSTRAINT ck_council_votes_vote CHECK (vote IN ('for','against','abstain'))
    )`,
  },
  {
    name: 'council_votes (council_id, decision_ref) index',
    sql: `CREATE INDEX IF NOT EXISTS idx_council_votes_decision ON council_votes (council_id, decision_ref)`,
  },
  {
    name: 'council_votes.voter_user_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_council_votes_voter ON council_votes (voter_user_id)`,
  },
  // SD #18-followup (2026-07-13): taxonomy_entries category='code_prefix' (KT/PT/E/GL —
  // Korobka tartibi/Paddon tartibi/Etiketka/Gofra list; seeded taxonomy-entries-2026-07-11.sql)
  // was dead: zero code referenced the 4 literal prefixes anywhere. Investigated live:
  // ow_molds.die_code (vision 06-sd#18, sd-ow-molds-die-code-18-2026-07-11.sql) is a
  // free-text physical-die identity tagged MANUALLY via PATCH
  // /sd/orders/:id/molds/:moldId/die-code (SdOrderDepartmentsRepository.setDieCode) — no
  // numbering sequence exists in the ow_molds insert path to prepend a prefix onto, so
  // code_prefix is added as a CLASSIFICATION TAG on the mold/die, validated against the
  // live taxonomy_entries set at the application layer (SdOrderDepartmentsRepository.
  // setCodePrefix reads taxonomy_entries at request time — not hardcoded, Q-40). Additive,
  // nullable — no regression (0 rows in ow_molds today). SCHEMA_MIGRATIONS runs before
  // DRIFT_MIGRATIONS' `ow_molds CREATE TABLE`, hence the defensive `IF EXISTS`.
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/sd-ow-molds-code-prefix-2026-07-13.sql.
  {
    name: 'ow_molds.code_prefix column (SD #18-followup, taxonomy code_prefix classification tag)',
    sql: `ALTER TABLE IF EXISTS ow_molds ADD COLUMN IF NOT EXISTS code_prefix TEXT`,
  },
  {
    name: 'ow_molds.code_prefix comment (SD #18-followup)',
    sql: `COMMENT ON COLUMN ow_molds.code_prefix IS 'taxonomy_entries(category=code_prefix).code classification tag for this mold/die (kt/pt/e/gl = Korobka tartibi/Paddon tartibi/Etiketka/Gofra list). NULL until tagged; validated against the live taxonomy_entries set at the application layer (SdOrderDepartmentsRepository.setCodePrefix), not hardcoded.'`,
  },
  {
    name: 'ow_molds.code_prefix index (SD #18-followup)',
    sql: `CREATE INDEX IF NOT EXISTS idx_ow_molds_code_prefix ON ow_molds (code_prefix) WHERE code_prefix IS NOT NULL`,
  },
  // 07-pp#119 owner-correction (docs/audit/QARORLAR-JURNALI-2026-07-11.md:85): "bezash
  // turlari = CRUD ro'yxat (AI-reja+operator-tayinlash uchun MAJBURIY), 'erkin matn' EMAS."
  // Decoration type (Laminatsiya yaltiroq/mat, UV-lak to'liq/spot, Oddiy lak) must be a
  // MANDATORY STRUCTURED field — taxonomy_entries.code, category='decoration_type' (3 seeded
  // rows: apps/api/src/shared/db/migrations/taxonomy-seed-2026-07-11.sql:25-27). Feeds PP
  // AI-planning (pp-ai-planning.service.ts step 6 shift-assign) + operator-assignment
  // visibility. Nullable: not every technology card involves a decoration/lamination/varnish
  // operation (e.g. plain corrugated boxes) — additive, no regress on existing NULL rows
  // (Q-46). Application layer (technology.controller.ts CreateCardDto/UpdateCardDto,
  // DECORATION_TYPE_CODES) restricts the value to the 3 known codes — no free text.
  // APPROVED: owner schema-approval wave 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror:
  // apps/api/src/shared/db/migrations/technology-cards-decoration-type-2026-07-13.sql.
  {
    name: 'technology_cards.decoration_type column (07-pp#119)',
    sql: `ALTER TABLE IF EXISTS technology_cards ADD COLUMN IF NOT EXISTS decoration_type VARCHAR(50)`,
  },
  // Owner decision (2026-07-13, chat): 4 new kanban_cards fields — Tiraj/progress (production
  // qty progress), qoldiq-to'lov (remaining payment on the linked sales_order — COMPUTED via a
  // read-time LEFT JOIN in kanban-cards.controller.ts getBoardCards/getAllCards, deliberately
  // NOT a stored column here to avoid a sync-bug-prone denormalized copy of
  // sales_orders.balance_due_amount), stansiya-operator (work_centers FK — "which
  // station/operator is handling this card"), Izoh-belgi (boolean "has important note" flag).
  // Additive + idempotent, all nullable/defaulted — no existing row impact (Q-39).
  // Verified live before drafting: kanban_cards had exactly the 32 documented columns (no
  // progress/station_operator_id/comment_flag yet); work_centers.id is an integer PK (FK target
  // confirmed, same pattern as mes_sos_events/pp_shift_plans); sales_orders has
  // total_amount/paid_amount/balance_due_amount (2026-07-13).
  // APPROVED: owner schema-approval wave 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror:
  // apps/api/src/shared/db/migrations/kanban-cards-progress-station-flag-2026-07-13.sql.
  {
    name: 'kanban_cards.progress column (owner 4-field request 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS progress NUMERIC`,
  },
  {
    name: 'kanban_cards.station_operator_id FK -> work_centers (owner 4-field request 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS station_operator_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL`,
  },
  {
    name: 'kanban_cards.station_operator_id index (owner 4-field request 2026-07-13)',
    sql: `CREATE INDEX IF NOT EXISTS idx_kanban_cards_station_operator_id ON kanban_cards (station_operator_id)`,
  },
  {
    name: 'kanban_cards.comment_flag column (owner 4-field request 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS comment_flag BOOLEAN NOT NULL DEFAULT false`,
  },
  // Owner decision 2026-07-13 (chat): the "orders" Kanban board must have exactly these 7
  // columns in this exact order: Navbatda -> Flekso -> Yuqori bosma -> Kesish/Vysechka ->
  // Kashirovka -> Qadoqlash -> Tayyor. Applies to the EXISTING orders board, not a new/separate
  // board concept. kanban_boards and kanban_columns were BOTH EMPTY (0 rows, verified live
  // 2026-07-13 — post the 2026-07-11 full company reset). OrderCreatedKanbanHandler ->
  // KanbanCardsRepository.createKanbanForOrder() (kanban-cards.repo.ts) already runs on every
  // new sales order and looks for a board matching type='sales' OR
  // name ILIKE '%buyurtma%'/'%order%'/'%sotuv%', then drops a card into that board's first
  // (lowest sort_order) column — with zero boards it has been silently no-op'ing (logs a warn,
  // never blocks order creation, by design). This seeds exactly the board+columns that lookup
  // already expects, closing the gap without touching that repo code. Column labels reused
  // verbatim from taxonomy_entries (category='kanban_stage', sort_order 1-7, already seeded by
  // taxonomy-seed-2026-07-11.sql) — no re-invented wording (Q-40). Both INSERTs are idempotent
  // (re-run every boot per ensureSchemaAdditions — no migrations-tracking table): the board
  // insert only fires if no board already matches createKanbanForOrder()'s own lookup predicate;
  // the columns insert only fires for the exact 'Buyurtmalar'/'sales' board and only while it has
  // zero active columns.
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/kanban-buyurtmalar-board-2026-07-13.sql.
  {
    name: 'kanban_boards Buyurtmalar orders-board seed (7-stage, owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_boards (name, type, description)
      SELECT
        'Buyurtmalar',
        'sales',
        'Standart 7 bosqichli buyurtma ishlab chiqarish oqimi: Navbatda -> Flekso -> Yuqori bosma -> Kesish/Vysechka -> Kashirovka -> Qadoqlash -> Tayyor.'
      WHERE NOT EXISTS (
        SELECT 1 FROM kanban_boards
        WHERE deleted_at IS NULL
          AND (type = 'sales' OR name ILIKE '%buyurtma%' OR name ILIKE '%order%' OR name ILIKE '%sotuv%')
      )
    `,
  },
  {
    name: 'kanban_columns Buyurtmalar 7-stage seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_columns (board_id, name, sort_order, color)
      SELECT b.id, v.name, v.sort_order, v.color
      FROM kanban_boards b
      CROSS JOIN (VALUES
        ('Navbatda',        0, '#A0AEC0'),
        ('Flekso',          1, '#5B9BD5'),
        ('Yuqori bosma',    2, '#F5C96A'),
        ('Kesish/Vysechka', 3, '#A78BFA'),
        ('Kashirovka',      4, '#F6AD55'),
        ('Qadoqlash',       5, '#6DC5A0'),
        ('Tayyor',          6, '#48BB78')
      ) AS v(name, sort_order, color)
      WHERE b.name = 'Buyurtmalar'
        AND b.type = 'sales'
        AND b.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
        )
    `,
  },
  // Owner decision 2026-07-13 (chat): confidential kanban cards. discipline_records is
  // already a SEPARATE table (confirmed live) for confidential tasks/discipline records —
  // the missing piece was that kanban_cards had NO confidential-type column at all, so a
  // card could never be flagged "hide from the general board". Additive, NOT NULL DEFAULT
  // false — every existing row becomes non-confidential (Q-46, zero regression). Wired in
  // kanban-visibility.helper.ts (new kanbanConfidentialClause, same privileged-role pattern
  // as the existing hasFullKanbanVisibility/kanbanCardVisibilityPredicate org-visibility
  // gate) + kanban-boards.repo.ts getBoardById() + kanban-cards.controller.ts
  // cardVisibilityClause() (getBoardCards/getAllCards) + kanban.dto.ts
  // (KanbanAddCardSchema/KanbanUpdateCardSchema) + kanban-boards.service.ts
  // addCard()/updateCard() + kanban-cards.repo.ts addCard()/updateCard().
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/kanban-cards-confidential-flag-2026-07-13.sql.
  {
    name: 'kanban_cards.is_confidential column (confidential-card visibility gap, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT false`,
  },
  // Owner decision 2026-07-13 (chat): CC template-level archive_after_days
  // (cc_document_templates, kun hisobida — 18 ta shablonda mavjud lekin qiymat
  // yo'q edi, hech qanday kod o'qimasdi) endi cc-sla.cron.ts (applyTemplateArchival)
  // tomonidan haqiqatan qo'llaniladi. Bundan tashqari yangi 90-kunlik "eskirgan
  // qoralama" (stale draft) arxiv qoidasi qo'shildi (archiveStaleDrafts). Q-40 —
  // 90-kunlik chegara chatda hardcode qilinmaydi, business_settings CRUD orqali
  // sozlanadigan (default 90).
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/cc-stale-draft-archive-threshold-2026-07-13.sql.
  {
    name: 'business_settings cc.stale_draft_archive_days seed (CC stale-draft archive, owner 2026-07-13)',
    sql: `
      INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('cc', 'cc.stale_draft_archive_days', 'Eskirgan qoralama arxiv muddati (kun)', 'days', 90, 'kun', 1, NULL,
        'DRAFT holatda shu kundan ko''proq turgan (hech qachon yuborilmagan) CC hujjatlar cc-sla.cron.ts ning archiveStaleDrafts() joblari orqali avtomatik arxivlanadi (o''chirilmaydi, faqat archived_at o''rnatiladi, cc-retention.service.archiveWithRetention orqali). Owner 2026-07-13 (chat).', true)
      ON CONFLICT (setting_key) DO NOTHING
    `,
  },
  // Owner decision 2026-07-13 (chat): TT (topshiriq/task) majburiy-maydon + 24 soatlik
  // eskalatsiya CC (Communication Center) shablon qoidalariga mos kelishi kerak — CRUD-
  // extensible, CC'ning haqiqiy 24h SLA mexanizmini (cc_document_templates.inbox_sla_hours,
  // cc-sla.cron.ts markInboxOverdue() — 30-daqiqalik poll) qayta ishlatib, Kanban'ning hozirgi
  // umumiy KUNLIK-09:00 job'i (kanban-cron.processor.ts OVERDUE_ESCALATION, due_date-asosli)
  // o'rniga emas — QO'SHIMCHA (Q-46, mavjud xatti-harakat o'zgarmaydi).
  //
  // kanban_cards.task_type — taxonomy_entries (category='kanban_task_type') kodiga soft-
  // reference: shu jadvalning o'zidagi related_type ustuni bilan bir xil FK'siz varchar
  // konvensiyasi (taxonomy_entries'ga HECH BIR jadval FK qilmaydi — 2026-07-13 tekshiruv:
  // pg_constraint WHERE confrelid = 'taxonomy_entries'::regclass = 0 qator; egasi istalgan
  // vaqt yangi TT turini mavjud generic Taksonomiya CRUD orqali qo'sha oladi —
  // TaxonomyRepository.create(), taxonomy-entries-2026-07-11.sql). operation_type kategoriyasi
  // ATAYLAB ishlatilmadi — u MES/ishlab-chiqarish operatsiyalari (bosma/kashirovka/kley/lak/
  // rezka/vysechka) uchun, TT vazifa-turi bilan semantik aloqasi yo'q.
  //
  // kanban_cards.sla_hours — karta darajasidagi ixtiyoriy SLA override (soat). Cron effektiv
  // SLA'ni ushbu zanjirdan hisoblaydi: (1) kanban_cards.sla_hours, (2)
  // taxonomy_entries.attrs->>'sla_hours' (tur darajasidagi standart — attrs jsonb allaqachon
  // shu maqsad uchun mo'ljallangan ustun, taxonomy-entries-2026-07-11.sql), (3)
  // business_settings 'kanban.tt_task_sla_hours_default' (global default — Q-40, hech qanday
  // raqam kodga hardcode qilinmaydi; CC inbox_sla_hours bilan bir xil boshlang'ich qiymat 24).
  //
  // Ikkalasi ham additive/nullable — mavjud kartalar (task_type=NULL) yangi TT_SLA_ESCALATION
  // job query'siga kirmaydi; joriy due_date-asosidagi kunlik OVERDUE_ESCALATION O'ZGARMAYDI.
  //
  // C9 note (2026-07-13): kanban's cron infra migrated to BullMQ same day — this SLA job is
  // registered as a 3rd repeatable job (TT_SLA_ESCALATION, every 30 min) in the same
  // kanban-cron.processor.ts, not a standalone @Cron file.
  //
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/kanban-tt-sla-2026-07-13.sql.
  {
    name: 'kanban_cards.task_type column (TT/task-type governs mandatory-field + SLA, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS task_type VARCHAR(60)`,
  },
  {
    name: 'kanban_cards.sla_hours column (per-card SLA override in hours, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_cards ADD COLUMN IF NOT EXISTS sla_hours NUMERIC(6,2)`,
  },
  {
    name: 'kanban_cards.sla_hours positive-value check (owner 2026-07-13)',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'kanban_cards_sla_hours_chk'
        ) THEN
          ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_sla_hours_chk CHECK (sla_hours IS NULL OR sla_hours > 0);
        END IF;
      END $$
    `,
  },
  {
    name: 'kanban_cards.task_type partial index (TT SLA-cron lookup, owner 2026-07-13)',
    sql: `CREATE INDEX IF NOT EXISTS idx_kanban_cards_task_type ON kanban_cards (task_type) WHERE task_type IS NOT NULL`,
  },
  {
    name: 'business_settings kanban.tt_task_sla_hours_default seed (owner 2026-07-13, CC-parity default 24h)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description)
      SELECT 'kanban', 'kanban.tt_task_sla_hours_default', 'TT vazifa standart SLA (soat)', 'number', 24, 'soat', 1, 168,
        'Owner 2026-07-13 (chat): TT/task karta uchun standart eskalatsiya SLA (soat) - CC cc_document_templates.inbox_sla_hours (24) bilan bir xil boshlang''ich qiymat. Karta darajasida (kanban_cards.sla_hours) yoki tur darajasida (taxonomy_entries.attrs->>''sla_hours'', category=''kanban_task_type'') override qilinishi mumkin; hech biri bo''lmasa shu global default ishlatiladi.'
      WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'kanban.tt_task_sla_hours_default')`,
  },
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // 20-cc#49 (P0, owner 2026-07-11): CC hujjat tasdiqlanganda (ADVANCE/FINANCIAL_AID — publisher
  // buni faqat shu ikki moliyaviy shablon uchun chiqaradi, cc-workflow.service.ts
  // emitFullyApprovedIfFinancial) endi avtomatik GL yozuvi yaratiladi
  // (CcApprovedGlPostingListener). gl_account_mappings jadvali POS harakatlari uchun allaqachon
  // ishlatiladi (transaction_type keyed — GlPostingLogRepository.postMovementToLedger bilan bir xil
  // naqsh); CC uchun ham AYNAN shu naqsh: transaction_type = CC shablon kodi. Standart hisob juftligi
  // (owner/buxgalter mavjud GL Mapping CRUD orqali istalgan vaqt o'zgartirishi mumkin — bu faqat
  // boshlang'ich default, Q-40):
  //   ADVANCE       -> Dr 4200 (Xodimlardan olinadigan summalar — qaytariladigan avans debitor)
  //                     Cr 5010 (Kassa — naqd pul chiqimi)
  //   FINANCIAL_AID -> Dr 9500 (Boshqa operatsion xarajatlar — qaytarilmaydigan yordam xarajati)
  //                     Cr 5010 (Kassa)
  // Data-seed (DDL emas — gl_account_mappings jadvali allaqachon mavjud), idempotent (WHERE NOT
  // EXISTS — mavjud transaction_type uchun qayta qo'shilmaydi). Human-readable mirror:
  // apps/api/src/shared/db/migrations/seed-gl-account-mappings-cc-2026-07-13.sql.
  {
    name: 'gl_account_mappings seed: CC ADVANCE/FINANCIAL_AID (20-cc#49 GL auto-post)',
    sql: `INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
      SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
      FROM (VALUES
        ('ADVANCE',       '4200', '5010', 'CC avans hujjati tasdiqlandi: Dr Xodimlardan olinadigan summalar / Cr Kassa'),
        ('FINANCIAL_AID', '9500', '5010', 'CC moddiy yordam hujjati tasdiqlandi: Dr Boshqa operatsion xarajatlar / Cr Kassa')
      ) AS v(tt, da, ca, descr)
      WHERE NOT EXISTS (
        SELECT 1 FROM gl_account_mappings g WHERE g.transaction_type = v.tt
      )`,
  },
  // 2026-08-03 fix: the ADVANCE mapping seeded above (20-cc#49) points debit_account at '4200',
  // but account_code '4200' was never actually seeded into `accounts` (seed-00-foundation-canonical
  // only has 1000/4000/5010/6310/6710/9010/9100/9500; the later 2026-07-13 patch added
  // 9520/9820/9210/9220/1020 — never 4200). Verified by repo-wide grep across every
  // `INSERT INTO accounts` source (seed-00-foundation-canonical-2026-06-19.sql,
  // gl-loss-marketing-referral-intransit-accounts-2026-07-13.sql, this file) — none seed 4200.
  // Net effect without this fix: CcApprovedGlPostingListener would resolve the ADVANCE mapping
  // fine, but GlPostingService.postJournal -> insertJournal -> resolveAccountIds would fail with
  // "GL account code(s) not in chart of accounts: 4200" for EVERY ADVANCE approval (logged as
  // cc→GL error, no GL entry posted) — FINANCIAL_AID (9500/5010, both pre-existing) is unaffected.
  // Sub-account of 4000 (Debitorlar/AR) — same parent-hierarchy convention as the 9820/9210/9220
  // additions above. `account_type` lowercase 'asset' to match the Zod enum
  // (insertAccountSchema in fi-gl.ts) and the majority of existing rows (the 2026-07-13 patch's
  // uppercase 'ASSET'/'EXPENSE'/'REVENUE' values are the outlier, not a live enforced constraint —
  // accounts_type_chk exists only in the Drizzle model file, not in DB_CONSTRAINTS).
  // Human-readable mirror: apps/api/src/shared/db/migrations/cc-advance-account-4200-2026-08-03.sql.
  {
    name: 'accounts: 4200 employee-advance-receivable (CC ADVANCE GL mapping fix, 2026-08-03)',
    sql: `INSERT INTO accounts (account_code, account_name, account_name_ru, account_type, parent_account_id, is_active, created_at, updated_at)
      SELECT '4200', 'Xodimlardan olinadigan summalar (avans)', 'Расчёты с сотрудниками (аванс)', 'asset',
             (SELECT id FROM accounts WHERE account_code = '4000'), true, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_code = '4200')`,
  },
  // Owner decision 2026-07-13 (chat): 4 new columns on the single `notifications` table (not a
  // new table) — module_code/channel/status/immutable. See
  // apps/api/src/shared/db/migrations/notifications-module-channel-status-immutable-2026-07-13.sql
  // for the full rationale (vocabulary sources, handler wiring, immutable-enforcement precedent).
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  {
    name: 'notifications.module_code column (owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS module_code TEXT`,
  },
  {
    name: 'notifications.channel column (owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS channel TEXT`,
  },
  {
    name: 'notifications.status column (owner 2026-07-13, delivery status — distinct from is_read/read_at)',
    sql: `ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`,
  },
  {
    name: 'notifications.immutable column (owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS immutable BOOLEAN NOT NULL DEFAULT false`,
  },
  // ── GL/CoA owner-interview 2026-07-13 (chat) — 4 related decisions ─────────
  // (1) Scrap/loss (DAMAGE + INVENTORY_ADJ_MINUS) → new general "Ishlab chiqarish
  //     zarari" (9520) instead of sharing 9500 "Boshqa operatsion xarajatlar".
  // (2) Makulatura (waste-paper) resale income → new sibling "Boshqa daromadlar
  //     (makulatura)" (9820, parent_account_id=9810) — 9810 stays FX-differences only.
  // (3) Marketing expense (9210) + referral bonus (9220) split out of the combined
  //     9200 "Sotuv xarajatlari (logistika, marketing)" (9200 itself untouched, Q-46).
  // (4) In-transit imported goods → new temporary "Yo'lda tovar" (1020) asset account,
  //     wired in wms-in-transit.service.ts markArrived() via GlPostingService.postJournal.
  // `parent_account_id` already existed on `accounts` (unused before this) — used here
  // for the (2)/(3) sub-account hierarchy without touching the FK-less flat rows.
  // Human-readable mirror: apps/api/src/shared/db/migrations/gl-loss-marketing-referral-intransit-accounts-2026-07-13.sql.
  {
    name: 'accounts: 5 new GL accounts (production-loss/makulatura-income/marketing/referral-bonus/in-transit, owner 2026-07-13)',
    sql: `INSERT INTO accounts (account_code, account_name, account_type, parent_account_id)
      VALUES
        ('9520', 'Ishlab chiqarish zarari (brak, kamomad)', 'EXPENSE', NULL),
        ('9820', 'Boshqa daromadlar (makulatura sotuvidan)', 'REVENUE', (SELECT id FROM accounts WHERE account_code = '9810')),
        ('9210', 'Marketing xarajatlari', 'EXPENSE', (SELECT id FROM accounts WHERE account_code = '9200')),
        ('9220', 'Referal (xodim tavsiyasi) bonuslari', 'EXPENSE', (SELECT id FROM accounts WHERE account_code = '9200')),
        ('1020', 'Yo''lda tovar (import, hali yetib kelmagan)', 'ASSET', NULL)
      ON CONFLICT (account_code) DO NOTHING`,
  },
  {
    name: 'gl_account_mappings: DAMAGE + INVENTORY_ADJ_MINUS reassigned 9500->9520 (owner 2026-07-13, all loss-type events)',
    sql: `DO $$
      BEGIN
        UPDATE gl_account_mappings
          SET debit_account = '9520',
              description = 'Brak/zarar: Dr Ishlab chiqarish zarari / Cr Xom ashyo',
              updated_at = NOW()
          WHERE transaction_type = 'DAMAGE' AND debit_account = '9500';
        UPDATE gl_account_mappings
          SET debit_account = '9520',
              description = 'Inventar kamayishi: Dr Ishlab chiqarish zarari / Cr Xom ashyo',
              updated_at = NOW()
          WHERE transaction_type = 'INVENTORY_ADJ_MINUS' AND debit_account = '9500';
      END $$`,
  },
  {
    name: 'gl_account_mappings: WASTE_OUT seed row (makulatura resale -> 9820, owner 2026-07-13)',
    sql: `INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
      SELECT 'WASTE_OUT', '4000', '9820', 'Makulatura sotuvi: Dr Debitorlar / Cr Boshqa daromadlar (makulatura)', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM gl_account_mappings WHERE transaction_type = 'WASTE_OUT')`,
  },
  {
    name: 'pos_movement_type_enum ADD VALUE WASTE_OUT (conditional, mirrors 2026-06-27 WASTE_IN pattern)',
    sql: `DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_movement_type_enum') THEN
          ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'WASTE_OUT';
        END IF;
      END $$`,
  },
  {
    name: 'pos_movement_types: WASTE_OUT seed row (makulatura chiqim/sotuv, owner 2026-07-13)',
    sql: `INSERT INTO pos_movement_types (code, name, name_ru, direction, is_issue, is_receipt, is_active, requires_document)
      VALUES ('WASTE_OUT', 'Chiqindi/Qoldiq chiqim (makulatura sotuvi)', 'Расход отходов/макулатуры (продажа)', 'out', true, false, true, false)
      ON CONFLICT (code) DO NOTHING`,
  },
  // Owner decision 2026-07-13 (chat): MES/QC/HR/PP domain events should ALL be able to
  // auto-spawn CC documents (previously only POS/procurement did). Three new
  // cc_document_templates rows (FAQAT DATA seed, idempotent WHERE NOT EXISTS — same
  // shape as itemB-gate1-delivery-request-cc-type-2026-07-09.sql's DELIVERY_REQUEST
  // insert). No cc_workflow_steps row (matches PROCUREMENT's existing informational-only
  // pattern — Q-46 minimal scope). APPROVED: owner schema-approval 2026-07-11
  // (Muslimbek, chat) — Q-35. Human-readable mirror:
  // apps/api/src/shared/db/migrations/cc-cross-module-spawn-templates-2026-07-13.sql.
  {
    name: 'cc_document_templates MES_ESCALATION row (owner 2026-07-13, cross-module CC spawn)',
    sql: `INSERT INTO cc_document_templates
      (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
    SELECT
      'MES_ESCALATION', 'To''xtagan ishlab chiqarish — eskalatsiya xabari', 'Уведомление об эскалации простоя',
      'xabar', '[]'::jsonb, 1, true, 'urgent', 'MES-ESK-{YYYY}-{SEQ}'
    WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'MES_ESCALATION')`,
  },
  {
    name: 'cc_document_templates QC_INSPECTION_FAILED row (owner 2026-07-13, cross-module CC spawn)',
    sql: `INSERT INTO cc_document_templates
      (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
    SELECT
      'QC_INSPECTION_FAILED', 'QC tekshiruvi rad etildi — rahbariyat ko''rigi', 'Инспекция ОТК отклонена — на рассмотрение руководства',
      'hisobot', '[]'::jsonb, 1, true, 'high', 'QC-FAIL-{YYYY}-{SEQ}'
    WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'QC_INSPECTION_FAILED')`,
  },
  {
    name: 'cc_document_templates PLAN_CHANGE row (owner 2026-07-13, cross-module CC spawn)',
    sql: `INSERT INTO cc_document_templates
      (code, name_uz, name_ru, category, ai_questions, version, is_active, default_priority, number_format)
    SELECT
      'PLAN_CHANGE', 'Ishlab chiqarish rejasi o''zgarishi', 'Изменение производственного плана',
      'xabar', '[]'::jsonb, 1, true, 'normal', 'REJA-{YYYY}-{SEQ}'
    WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'PLAN_CHANGE')`,
  },
  // Owner decision 2026-07-13 (chat): a QC defect marked "customer fault" auto-notifies
  // the sales manager who owns the linked order's customer. Nullable, no default —
  // NULL = not yet classified; every existing qc_defects INSERT/UPDATE flow (saveDefect/
  // updateDefect in drizzle-defect.repo.ts) keeps working unchanged (Q-46). Set via
  // PATCH /qc/defects/:id/fault-attribution -> QcDefectCustomerFaultEvent ->
  // sd/infrastructure/event-handlers/qc-customer-fault-sd.listener.ts. APPROVED: owner
  // schema-approval 2026-07-11 (Muslimbek, chat) — Q-35. Human-readable mirror:
  // apps/api/src/shared/db/migrations/qc-defects-customer-fault-2026-07-13.sql.
  {
    name: 'qc_defects.is_customer_fault column (owner 2026-07-13, sales-manager auto-notify)',
    sql: `ALTER TABLE IF EXISTS qc_defects ADD COLUMN IF NOT EXISTS is_customer_fault BOOLEAN`,
  },
  // Owner decision 2026-07-13 (chat): Kanban WIP-limit (kanban-boards.service.ts
  // KANBAN_WIP_LIMIT_JARAYONDA=3, previously hardcoded identically on every
  // "Jarayonda" column of every board) is now per-column CRUD-configurable. Nullable —
  // NULL keeps a column on the historical global default (additive, Q-46
  // non-regression). CRUD: existing POST /kanban/boards/:boardId/columns and
  // PATCH /kanban/boards/:boardId/columns/:columnId endpoints (kanban-boards.service.ts
  // addColumn/updateColumn) now also accept wipLimit/wip_limit. Verified live
  // 2026-07-13: kanban_columns is a base table (relkind='r', not a view), no
  // wip_limit column yet. APPROVED: owner schema-approval 2026-07-11 (Muslimbek,
  // chat) — Q-35. Human-readable mirror:
  // apps/api/src/shared/db/migrations/kanban-wip-limit-2026-07-13.sql.
  {
    name: 'kanban_columns.wip_limit column (per-column WIP-limit override, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS kanban_columns ADD COLUMN IF NOT EXISTS wip_limit INTEGER`,
  },
  // kanban_wip_overrides — audit log written when a supervisor-role user moves a card
  // into an at-limit "Jarayonda" column: KanbanBoardsService.assertCanMoveTo() allows
  // the move and records it here instead of blocking with the usual CONFLICT error.
  // Shape/naming mirrors qc_override_log (schema-misc-qc.ts /
  // qc-override-log-2026-07-11.sql): user_id -> overridden_by_user_id, reason,
  // created_at. Verified live 2026-07-13: table does not exist yet; kanban_cards.id /
  // kanban_columns.id are both integer serial PKs (FK-safe).
  {
    name: 'kanban_wip_overrides table (WIP-limit supervisor-override log, owner 2026-07-13)',
    sql: `CREATE TABLE IF NOT EXISTS kanban_wip_overrides (
      id                    SERIAL PRIMARY KEY,
      card_id               INTEGER NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
      column_id             INTEGER NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
      overridden_by_user_id INTEGER NOT NULL REFERENCES users(id),
      reason                TEXT NOT NULL,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  },
  {
    name: 'kanban_wip_overrides.column_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_kanban_wip_overrides_column ON kanban_wip_overrides (column_id)`,
  },
  {
    name: 'kanban_wip_overrides.card_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_kanban_wip_overrides_card ON kanban_wip_overrides (card_id)`,
  },
  // Owner decision 2026-07-13 (chat): dokla/rasporyazhenie hard-delete -> soft-delete +
  // audit trail (coordination.repository.ts deleteDokla()/deleteRasp() previously ran a
  // real Drizzle .delete()). Mirrors sd_customers.deleted_at/deleted_by shape
  // (VISION-3340 #63, commit 01daa468). Additive, nullable (Q-35/Q-46). Human-readable
  // mirror: apps/api/src/shared/db/migrations/dokla-rasporyazhenie-soft-delete-2026-07-13.sql.
  {
    name: 'dokla.deleted_at column (soft-delete, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS dokla ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
  },
  {
    name: 'dokla.deleted_by column (soft-delete audit, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS dokla ADD COLUMN IF NOT EXISTS deleted_by INTEGER`,
  },
  {
    name: 'rasporyazhenie.deleted_at column (soft-delete, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS rasporyazhenie ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
  },
  {
    name: 'rasporyazhenie.deleted_by column (soft-delete audit, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS rasporyazhenie ADD COLUMN IF NOT EXISTS deleted_by INTEGER`,
  },
  // Owner decision 2026-07-13 (chat): QC/MES/Design events now fan out into Kanban cards.
  // Today's session added 3 real event listeners (QcFailedKanbanHandler,
  // MesCompletedKanbanHandler, DesignRequestedKanbanHandler --
  // apps/api/src/modules/kanban/application/event-handlers/) that call
  // KanbanCardsRepository.createKanbanForQcInspection / createKanbanForMesSession /
  // createKanbanForDesignTask, which all delegate into the shared createKanbanForSource()
  // helper (kanban-cards.repo.ts) with these exact hint arrays:
  //   QC:      boardTypeHints=['qc'],               boardNameHints=['sifat','qc','nazorat']
  //   MES:     boardTypeHints=['production','mes'],  boardNameHints=['ishlab chiqarish','mes','production']
  //   Design:  boardTypeHints=['design'],             boardNameHints=['dizayn','design']
  // Live-verified 2026-07-13: kanban_boards has exactly 1 row (id=2, type='sales', the
  // 'Buyurtmalar' board seeded by kanban-buyurtmalar-board-2026-07-13.sql). None of the 3
  // hint arrays above match it, so all 3 new triggers have been silently no-op'ing since they
  // were wired today (createKanbanForSource logs a warn and returns Ok(void) -- by design, it
  // must never block QC/MES/Design workflows). This seeds 3 more boards, each with exactly 1
  // default column, closing that gap -- mirrors kanban-buyurtmalar-board-2026-07-13.sql's
  // pattern exactly: a board INSERT guarded by WHERE NOT EXISTS on the SAME predicate the
  // lookup itself uses, then a column INSERT guarded by "this board has zero active columns".
  // Column name 'Navbatda' + color '#A0AEC0' reused verbatim from the existing 'Buyurtmalar'
  // board's first column -- no re-invented wording (Q-40); pure board/column infrastructure
  // scaffolding, not a business threshold/number, so no business_settings entry is needed.
  // Only 3 boards (not 4): the MES hint array OR-matches type='production' OR type='mes', so a
  // single board with type='production' satisfies createKanbanForMesSession's lookup without a
  // separate 'mes'-type board -- avoids inventing a 4th board the repo code never asks for.
  // Both statements per board are idempotent (safe to re-run every boot -- apps/api/src/
  // shared/db/invariants.ts ensureSchemaAdditions() re-executes every SCHEMA_MIGRATIONS entry
  // on each start, there is no migrations-tracking table).
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/kanban-qc-mes-design-boards-2026-07-13.sql.
  {
    name: 'kanban_boards Sifat nazorati (QC) board seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_boards (name, type, description)
      SELECT
        'Sifat nazorati',
        'qc',
        'QC tekshiruvi rad etilganda avtomatik karta tushadigan standart kanban board.'
      WHERE NOT EXISTS (
        SELECT 1 FROM kanban_boards
        WHERE deleted_at IS NULL
          AND (type = 'qc' OR name ILIKE '%sifat%' OR name ILIKE '%qc%' OR name ILIKE '%nazorat%')
      )
    `,
  },
  {
    name: 'kanban_columns Sifat nazorati default column seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_columns (board_id, name, sort_order, color)
      SELECT b.id, 'Navbatda', 0, '#A0AEC0'
      FROM kanban_boards b
      WHERE b.name = 'Sifat nazorati'
        AND b.type = 'qc'
        AND b.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
        )
    `,
  },
  {
    name: 'kanban_boards Ishlab chiqarish (production/MES) board seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_boards (name, type, description)
      SELECT
        'Ishlab chiqarish',
        'production',
        'MES ishlab chiqarish sessiyasi tugaganda avtomatik karta tushadigan standart kanban board.'
      WHERE NOT EXISTS (
        SELECT 1 FROM kanban_boards
        WHERE deleted_at IS NULL
          AND (type = 'production' OR type = 'mes' OR name ILIKE '%ishlab chiqarish%' OR name ILIKE '%mes%' OR name ILIKE '%production%')
      )
    `,
  },
  {
    name: 'kanban_columns Ishlab chiqarish default column seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_columns (board_id, name, sort_order, color)
      SELECT b.id, 'Navbatda', 0, '#A0AEC0'
      FROM kanban_boards b
      WHERE b.name = 'Ishlab chiqarish'
        AND b.type = 'production'
        AND b.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
        )
    `,
  },
  {
    name: 'kanban_boards Dizayn (design) board seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_boards (name, type, description)
      SELECT
        'Dizayn',
        'design',
        'Dizayn vazifasi talab qilinganda avtomatik karta tushadigan standart kanban board.'
      WHERE NOT EXISTS (
        SELECT 1 FROM kanban_boards
        WHERE deleted_at IS NULL
          AND (type = 'design' OR name ILIKE '%dizayn%' OR name ILIKE '%design%')
      )
    `,
  },
  {
    name: 'kanban_columns Dizayn default column seed (owner 2026-07-13)',
    sql: `
      INSERT INTO kanban_columns (board_id, name, sort_order, color)
      SELECT b.id, 'Navbatda', 0, '#A0AEC0'
      FROM kanban_boards b
      WHERE b.name = 'Dizayn'
        AND b.type = 'design'
        AND b.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM kanban_columns kc WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
        )
    `,
  },
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35. CC-COMPLETE-FRESH-
  // ANALYSIS-2026-07-11.md item #12/#45/#50 ("Outbox + Finance reversal"): only the
  // `document_hashes` half is built here — SHA-256 fingerprint of the final signed PDF export
  // (CcPdfService.generate()) so Finance can verify byte-for-byte integrity before acting on a
  // reversal. Distinct from the existing cc_approvals.signature_hash (cc-pin.service.ts:69-73)
  // which proves a PIN-signed approval STEP happened, not that the rendered PDF bytes are
  // unaltered. The `cc_outbox` half of the same audit item is INTENTIONALLY SKIPPED — verified
  // live 2026-07-13 this repo already has a generic transactional-outbox (`domain_events` +
  // OutboxRepository/OutboxEventWriter/OutboxPublisher, apps/api/src/modules/shared/outbox/,
  // commit 21d775de 2026-06-26) that already durably captures CC's own eventBus.publish()
  // calls (CcSpawnRequestedEvent — cc-webhook.controller.ts:105; CcDocumentFullyApprovedEvent —
  // cc-workflow.service.ts:279) with zero extra code. A new `cc_outbox` would duplicate
  // `domain_events` exactly as the sibling same-day migration qc-brak-snapshot-2026-07-11.sql:
  // 6-10 already flagged for QC. Also: cc_documents.basket_state already has a live value named
  // 'outbox' (Inbox/Pending/Outbox 3-basket UI) — naming-collision risk. Human-readable mirror:
  // apps/api/src/shared/db/migrations/cc-document-hashes-2026-07-13.sql.
  {
    name: 'document_hashes table (PDF integrity hash for Finance-reversal check, owner 2026-07-11 Q-35)',
    sql: `CREATE TABLE IF NOT EXISTS document_hashes (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id   UUID NOT NULL REFERENCES cc_documents(id) ON DELETE CASCADE,
      hash          VARCHAR(128) NOT NULL,
      algorithm     VARCHAR(20) NOT NULL DEFAULT 'sha256',
      created_at    TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: 'document_hashes.document_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_document_hashes_document_id ON document_hashes (document_id)`,
  },
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // CC gap fix (docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md, item #25, P1):
  // taxonomy_entries already seeds contact_type (5 rows: buyruq/malumot_talabi/
  // bildirishnoma/sorov/hisobot) and document_type (6 rows: tex_karta/ish_rejasi/
  // sifat_hisoboti/smena_topshirigi/xavfsizlik_brifingi/nazorat_varaqasi) — confirmed live
  // 2026-07-13 (11 rows total) — but no cc_* table references them (\d on cc_documents and
  // cc_document_templates: no such column). Target = cc_document_templates, not
  // cc_documents: a document's type/contact-nature is a property of its template
  // (cc_documents.template_id already fixes which template — and therefore which
  // classification — a document has), mirroring how cc_document_templates.category
  // (ariza/buyruq/hisobot/xabar, 21 live rows) already classifies templates, not
  // individual documents; only cc_document_templates has an admin CRUD surface today
  // (POST /cc/templates, PATCH /cc/templates/:id — cc-documents.controller.ts
  // createTemplate/updateTemplate, super_admin-only) for an owner to set these on.
  // Soft-reference, no FK — project convention (schema-kanban.ts kanban_cards.task_type
  // comment: taxonomy_entries(category=..., code) ga soft-reference, FK'siz). VARCHAR(60)
  // matches taxonomy_entries.code's live width (character varying(60)). Nullable, no
  // default: NULL = not yet classified — every existing cc_document_templates row and
  // every existing createTemplate/updateTemplate caller keeps working unchanged (Q-46).
  // Human-readable mirror:
  // apps/api/src/shared/db/migrations/cc-document-templates-taxonomy-codes-2026-07-13.sql.
  {
    name: 'cc_document_templates.document_type_code column (CC taxonomy soft-ref, owner 2026-07-11 schema-approval)',
    sql: `ALTER TABLE IF EXISTS cc_document_templates ADD COLUMN IF NOT EXISTS document_type_code VARCHAR(60)`,
  },
  {
    name: 'cc_document_templates.contact_type_code column (CC taxonomy soft-ref, owner 2026-07-11 schema-approval)',
    sql: `ALTER TABLE IF EXISTS cc_document_templates ADD COLUMN IF NOT EXISTS contact_type_code VARCHAR(60)`,
  },
  // Notifications module gap (docs/audit/NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md):
  // the 6-value notification-category taxonomy (buyruq/ogohlantirish/talab/tasdiqlash_sorovi/
  // hisobot/elon) was already seeded into taxonomy_entries (category='notification_category', 6
  // rows, ids 62-67 — verified live 2026-07-13 via SELECT * FROM taxonomy_entries WHERE
  // category='notification_category'; source: taxonomy-seed-2026-07-11.sql:66-71) but the
  // `notifications` table had no column referencing it. category_code closes that gap: a
  // soft-reference to taxonomy_entries.code, same FK-less TEXT convention as the sibling
  // module_code/channel/status columns added on this same table earlier today (entries directly
  // above in this file) and the same convention already used for other taxonomy soft-references
  // in this codebase (ow_molds.code_prefix, technology_cards.decoration_type,
  // kanban_cards.task_type) — taxonomy_entries has zero incoming FK constraints by design
  // (2026-07-13 check: pg_constraint WHERE confrelid = 'taxonomy_entries'::regclass = 0 rows),
  // validated at the application layer instead. Nullable, additive — existing rows/callers
  // unaffected (Q-46). Scope of this change is deliberately narrow (Q-33/Q-46): column +
  // CreateNotificationCommand optional constructor param only. Populating category_code on every
  // existing notification-creation call site across the codebase is a separate, much larger
  // follow-up item and is explicitly NOT attempted here.
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35.
  // Human-readable mirror: apps/api/src/shared/db/migrations/notifications-category-code-2026-07-13.sql.
  {
    name: 'notifications.category_code column (notification-category taxonomy soft-reference, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS category_code TEXT`,
  },
  // Owner decision 2026-07-13 (chat) — "Mahsulot vs Buyurtma zanjiri" gap: sales_order_items
  // only has product_id (finished-goods catalog SKU), but sd_quotation_items describes a
  // bespoke print job by physical spec (paper_type, dimensions, print_colors, lamination, ...)
  // with NO product_id at all — this print shop quotes custom jobs, not catalog SKUs. Because
  // of this mismatch, the 2 quotation-to-order conversion paths (approveQuotation() in
  // drizzle-quotation.repo.ts, convertQuotationToOrder() in sd-quotations.repository.ts) could
  // only ever insert the sales_orders HEADER row — they had no column to carry the quotation's
  // line-item spec into, so converted orders silently lost their entire product breakdown.
  // These columns mirror sd_quotation_items' physical-spec columns 1:1 (types matched live via
  // psql \d sd_quotation_items 2026-07-13) so a conversion can copy the spec across with
  // product_id left NULL (the order line is "custom, no catalog SKU" — same convention as any
  // other nullable optional column on this table). Quotation-internal PRICING breakdown columns
  // (cost_price/paper_cost/production_cost/print_cost/delivery_cost/die_cost) are deliberately
  // NOT mirrored — the order line's existing net_price/total_price already carry the final
  // agreed price; those are quotation-margin-calculation internals, not order-fulfillment data.
  // quotation_item_id is an additional soft-reference (no FK, taxonomy_entries-style convention
  // already used elsewhere in this codebase) back to sd_quotation_items.id, so a re-run of the
  // conversion can detect already-copied lines instead of duplicating them. All nullable,
  // additive — existing product_id-based order-item rows and the canonical manual create-order
  // flow (create-order.handler.ts's saveItems(), which only ever sets product_id/description/
  // qty/unit/price) are completely unaffected (Q-46).
  // Human-readable mirror: apps/api/src/shared/db/migrations/sales-order-items-custom-spec-2026-07-13.sql.
  {
    name: 'sales_order_items.quotation_item_id column (traceback to sd_quotation_items, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS quotation_item_id INTEGER`,
  },
  {
    name: 'sales_order_items.product_type column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS product_type VARCHAR(100)`,
  },
  {
    name: 'sales_order_items.paper_type column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS paper_type VARCHAR(100)`,
  },
  {
    name: 'sales_order_items.thickness_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS thickness_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.length_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS length_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.width_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS width_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.height_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS height_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.print_colors column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS print_colors INTEGER`,
  },
  {
    name: 'sales_order_items.lamination column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS lamination BOOLEAN`,
  },
  {
    name: 'sales_order_items.perforation column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS perforation BOOLEAN`,
  },
  {
    name: 'sales_order_items.special_coating column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS special_coating BOOLEAN`,
  },
  {
    name: 'sales_order_items.is_new_die column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS is_new_die BOOLEAN`,
  },
  {
    name: 'sales_order_items.printing_method column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS printing_method VARCHAR(100)`,
  },
  {
    name: 'sales_order_items.machine_format column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS machine_format VARCHAR(100)`,
  },
  {
    name: 'sales_order_items.load_capacity_kg column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS load_capacity_kg NUMERIC`,
  },
  {
    name: 'sales_order_items.core_diameter_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS core_diameter_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.gilza_diameter_mm column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS gilza_diameter_mm NUMERIC`,
  },
  {
    name: 'sales_order_items.roll_length_m column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS roll_length_m NUMERIC`,
  },
  {
    name: 'sales_order_items.kashirovka column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS kashirovka BOOLEAN`,
  },
  {
    name: 'sales_order_items.print_sides column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS print_sides SMALLINT`,
  },
  {
    name: 'sales_order_items.layer_count column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS layer_count INTEGER`,
  },
  {
    name: 'sales_order_items.setup_time_minutes column (custom-job spec, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS setup_time_minutes INTEGER`,
  },
  // APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat) -- QC lab-tests session model.
  // Owner decision (given directly in chat, not a Q-35 owner-data gap): the live FE
  // (artifacts/erp-dashboard/src/components/production/qc/LabSection.tsx, LabSchema /
  // createLabTest mutation) records ONE lab-test SESSION -- material identity
  // (materialName/lotNumber) + 4 SIMULTANEOUS measurements (grammatura/qalinlik/bosim/
  // namlik) + operator -- not the generic one-parameter-per-row model qc_lab_tests was
  // originally built for (parameter_name + a single value/unit/min_value/max_value per
  // row). These columns are ADDITIVE alongside that pre-existing generic-model shape
  // (Q-46) -- nothing that reads/writes parameter_name/value/unit/min_value/max_value/
  // tested_by is touched. POST /qc/lab-tests (QcNewController.createLabTest ->
  // QcNewService.createLabTest -> QcNewRepository.insertLabTest) now accepts and persists
  // whichever shape the caller sends.
  // The pre-existing `result` TEXT NOT NULL DEFAULT 'pending' column is REUSED as-is for
  // the session model's pass/fail/conditional choice (LabSchema.result on the FE already
  // only allows those 3 values) -- no new result/status column or enum is added, per the
  // "check LabSection.tsx's actual result field options before deciding" instruction: it's
  // free text already, same convention the column always had (previously server-computed
  // pass/fail/pending from a min/max compare; now it can also arrive pre-set from the FE).
  // parameter_name's NOT NULL constraint is dropped in the same migration below: the
  // session model has no single "parameter name" (4 simultaneous parameters, not 1).
  // Verified live 2026-07-13 that QcNewRepository.insertLabTest (qc-new.repository.ts) is
  // the ONLY live write path to this table -- QcParametersService.createTest /
  // qc-parameters.repository.ts's insertTest also reference qc_lab_tests.parameterName but
  // are dead code (no controller route calls QcParametersService.createTest; the sibling
  // POST /qc/tests route in qc-parameters.controller.ts calls
  // svc.createMaterialTest() -> qc_material_tests, a completely different table) --
  // dropping the NOT NULL constraint cannot break any live caller.
  // Human-readable mirror: apps/api/src/shared/db/migrations/qc-lab-tests-session-model-2026-07-13.sql.
  {
    name: 'qc_lab_tests.material_name column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS material_name TEXT`,
  },
  {
    name: 'qc_lab_tests.lot_number column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS lot_number TEXT`,
  },
  {
    name: 'qc_lab_tests.grammatura column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS grammatura NUMERIC`,
  },
  {
    name: 'qc_lab_tests.qalinlik column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS qalinlik NUMERIC`,
  },
  {
    name: 'qc_lab_tests.bosim column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS bosim NUMERIC`,
  },
  {
    name: 'qc_lab_tests.namlik column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS namlik NUMERIC`,
  },
  {
    name: 'qc_lab_tests.operator_name column (lab-session model, owner 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS operator_name TEXT`,
  },
  {
    name: 'qc_lab_tests.parameter_name drop notnull (lab-session model has no single parameter, owner 2026-07-13)',
    sql: `ALTER TABLE qc_lab_tests ALTER COLUMN parameter_name DROP NOT NULL`,
  },
  // APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35.
  // Owner decision 2026-07-13 (chat): GET /ai/forecast/demand wired to the real forecast
  // engines (was a hard-gated 501 stub, apps/api/src/modules/ai/
  // presentation/ai.controller.ts). Owner explicitly ruled the minimum-history threshold
  // must NOT be hardcoded/asked in chat -- read via getBusinessSettingNumber() with a
  // CRUD-editable row, same pattern as sd.full_advance_discount_pct /
  // cc.stale_draft_archive_days. Default=10 is a starting default pending owner tuning
  // (DemandForecastService doc-comment), not an invented magic number pulled from nowhere.
  // Human-readable mirror: apps/api/src/shared/db/migrations/
  // ai-forecast-min-orders-threshold-2026-07-13.sql.
  {
    name: 'business_settings ai.forecast_min_orders seed (demand-forecast min-history gate, owner 2026-07-13)',
    sql: `
      INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.forecast_min_orders', 'Talab bashorati uchun minimal tarixiy buyurtmalar soni', 'number', 10, 'ta', 1, NULL,
        'GET /ai/forecast/demand shu sondan kam tarixiy (oxirgi 18 oy) savdo buyurtmasi bo''lsa EMA modelni ishga tushirmaydi, o''rniga status=insufficient_history qaytaradi (DemandForecastService.getDemandForecast, owner 2026-07-13).', true)
      ON CONFLICT (setting_key) DO NOTHING
    `,
  },
  // AI Rush Orders (owner 2026-07-13, chat) — ai.controller.ts had 3 hard-gated 501 stubs
  // (GET /ai/rush-orders, POST :id/approve, POST :id/reject; FE reference already built:
  // artifacts/erp-dashboard/src/pages/ai-planning/RushOrderPage.tsx). sales_orders has NO
  // rush-specific columns and its existing master_status is a 23-value order-fulfillment
  // lifecycle (draft..cancelled, see sd-orders.ts salesOrders CHECK) — unrelated to a rush
  // approve/reject decision, so it is NOT overloaded here (Q-46). This new table is the
  // dedicated persistence home for that decision, one row per sales_orders.id (unique
  // order_id — GET always wants the CURRENT status, not a history of re-decisions).
  // Snapshot columns (standard_lead_days/rush_lead_days/surcharge_pct/feasibility_score) are
  // captured at approve/reject time so a later business_settings tuning change never mutates
  // the audit trail of an already-decided request (only still-virtual/pending candidates in
  // GET are computed live from current settings). Qualification rule, surcharge %, and
  // feasibility-scoring weights are ALL owner-tunable via business_settings CRUD (Q-40) —
  // none hardcoded; see rush-orders.service.ts getBusinessSettingNumber() calls. FK
  // order_id -> sales_orders(id) ON DELETE CASCADE (row is meaningless without its order,
  // mirrors kanban_wip_overrides' card_id/column_id FK convention). requested_by/approved_by
  // -> users(id) ON DELETE SET NULL (keep the audit row if the acting user is later removed).
  // APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat) — AI Rush Orders.
  // Human-readable mirror: apps/api/src/shared/db/migrations/rush-orders-2026-07-13.sql.
  {
    name: 'rush_order_requests table (AI rush-order approve/reject persistence, owner 2026-07-13)',
    sql: `CREATE TABLE IF NOT EXISTS rush_order_requests (
      id                  SERIAL PRIMARY KEY,
      order_id            INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
      requested_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
      standard_lead_days  INTEGER NOT NULL,
      rush_lead_days      INTEGER NOT NULL,
      surcharge_pct       NUMERIC(5,2) NOT NULL,
      feasibility_score   INTEGER NOT NULL,
      status              VARCHAR(20) NOT NULL DEFAULT 'pending_approval',
      approved_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved_at         TIMESTAMPTZ,
      rejected_reason     TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT rush_order_requests_status_chk CHECK (status IN ('pending_approval','approved','rejected')),
      CONSTRAINT rush_order_requests_feasibility_chk CHECK (feasibility_score BETWEEN 0 AND 100)
    )`,
  },
  {
    name: 'rush_order_requests.order_id unique index (one current decision per order, owner 2026-07-13)',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_rush_order_requests_order_id ON rush_order_requests (order_id)`,
  },
  {
    name: 'rush_order_requests.status index (owner 2026-07-13)',
    sql: `CREATE INDEX IF NOT EXISTS idx_rush_order_requests_status ON rush_order_requests (status)`,
  },
  // business_settings seed: 5 owner-tunable rush-order numbers (Q-40 — none hardcoded in
  // rush-orders.service.ts; all read via getBusinessSettingNumber(key, fallback) so a missing/
  // inactive row silently falls back instead of throwing). Defaults below are placeholders
  // pending owner tuning through the business_settings CRUD screen, NOT researched business
  // numbers (explicit owner instruction 2026-07-13 chat).
  //   rush_order_max_lead_days: an order qualifies as "rush" when its requested delivery date
  //     is within N days of order creation (N=3 default placeholder).
  //   rush_order_surcharge_pct: extra % charged on a rush order (20 default placeholder).
  //   rush_order_standard_lead_days: the "normal" lead time shown on the FE next to the rush
  //     lead time for comparison (RushOrderPage.tsx standardLeadDays field) — 14 default
  //     placeholder (distinct from rush_order_max_lead_days, which gates qualification).
  //   rush_order_load_penalty_per_order: feasibility-score points deducted per open
  //     production_orders-per-active-work_center ratio (5 default placeholder).
  //   rush_order_feasibility_weight_load_pct: 0-100 weight given to the production-load
  //     component of the feasibility score; the remaining (100-weight) goes to the
  //     lead-time-margin component (50/50 default placeholder split).
  // APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat).
  {
    name: 'business_settings ai.rush_order_max_lead_days seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'rush_order_max_lead_days', 'Rush buyurtma - maksimal muddat (kun)', 'days', 3, 'kun', 1, 30,
        'Buyurtma yaratilgan kundan talab qilingan yetkazib berish sanasigacha shu kundan kam/teng bo''lsa, "rush" (tezkor) deb hisoblanadi. Placeholder default=3, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.rush_order_surcharge_pct seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'rush_order_surcharge_pct', 'Rush buyurtma - qo''shimcha to''lov (%)', 'percent', 20, '%', 0, 100,
        'Rush deb tasdiqlangan buyurtmaga qo''llaniladigan qo''shimcha to''lov foizi. Placeholder default=20, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.rush_order_standard_lead_days seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'rush_order_standard_lead_days', 'Standart ishlab chiqarish muddati (kun)', 'days', 14, 'kun', 1, NULL,
        'Rush bo''lmagan buyurtma uchun odatiy ishlab chiqarish muddati - RushOrderPage taqqoslash uchun ko''rsatadi. Placeholder default=14, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.rush_order_load_penalty_per_order seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'rush_order_load_penalty_per_order', 'Rush feasibility - yuklama jarimasi', 'number', 5, NULL, 0, 100,
        'Har bir ochiq production_orders / faol work_centers nisbati birligi uchun feasibility balidan ayiriladigan ball. Placeholder default=5, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.rush_order_feasibility_weight_load_pct seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'rush_order_feasibility_weight_load_pct', 'Rush feasibility - yuklama og''irligi (%)', 'percent', 50, '%', 0, 100,
        'Feasibility skorida ishlab chiqarish yuklamasi komponentining og''irligi (%); qolgan qism muddat-zaxira komponentiga beriladi. Placeholder default=50 (teng bo''lingan), egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // AI HR Dashboard budgets (2026-07-13) — HRAIDashboard.tsx "Provayderlar va byudjet"
  // panel + "AI vazifani ishga tushirish" panel. AiHrNewService.buildProviderBudgets()/
  // submitTask() used to read hardcoded app.constants.ts numbers — two of the three
  // "dailyRequestLimit" values were unrelated constants reused by numeric coincidence
  // (MAX_EXPORT_LIMIT / AI_SHORT_MAX_TOKENS). Q-12/Q-40: every number now comes from
  // business_settings via getBusinessSettingNumber(key, fallback), same pattern as
  // ai.forecast_min_orders / rush_order_*. Defaults below are IDENTICAL to the previous
  // hardcoded values (no visible change until owner tuning). Human-readable mirror:
  // apps/api/src/shared/db/migrations/ai-hr-dashboard-budgets-2026-07-13.sql.
  {
    name: 'business_settings ai.hr_dashboard_budget_openai_monthly seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_budget_openai_monthly', 'AI HR Dashboard - OpenAI oylik byudjet', 'number', 100, 'USD', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - OpenAI uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=100, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_budget_gemini_monthly seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_budget_gemini_monthly', 'AI HR Dashboard - Gemini oylik byudjet', 'number', 50, 'USD', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - Gemini uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=50, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_budget_claude_monthly seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_budget_claude_monthly', 'AI HR Dashboard - Claude oylik byudjet', 'number', 80, 'USD', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - Claude uchun oylik xarajat byudjeti ko''rsatkichi. Placeholder default=80, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_daily_limit_openai seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_daily_limit_openai', 'AI HR Dashboard - OpenAI kunlik so''rov chegarasi', 'number', 1000, 'so''rov/kun', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - OpenAI uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=1000, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_daily_limit_gemini seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_daily_limit_gemini', 'AI HR Dashboard - Gemini kunlik so''rov chegarasi', 'number', 2000, 'so''rov/kun', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - Gemini uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=2000, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_daily_limit_claude seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_daily_limit_claude', 'AI HR Dashboard - Claude kunlik so''rov chegarasi', 'number', 500, 'so''rov/kun', 0, NULL,
        'AI HR Dashboard (Provayderlar va byudjet paneli) - Claude uchun kunlik AI so''rovlar chegarasi ko''rsatkichi. Placeholder default=500, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings ai.hr_dashboard_task_max_tokens seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('ai', 'ai.hr_dashboard_task_max_tokens', 'AI HR Dashboard - vazifa AI javobi token chegarasi', 'number', 800, 'token', 1, NULL,
        'AiHrNewService.submitTask() (AI HR Dashboard "AI vazifani ishga tushirish" paneli) har bir ad-hoc AI chaqiruvi uchun max_tokens chegarasi. Placeholder default=800, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // hr-employees-orphan-fields (2026-07-13): EmployeeDialog.tsx form fields with no
  // matching `employees` column — silently discarded on save (Q-40/Q-43 fake-save).
  // See apps/api/src/shared/db/migrations/hr-employees-orphan-fields-2026-07-13.sql
  // for full rationale. Wired into saveEmployee()/updateEmployee() in
  // drizzle-hr-base.repo.ts in the same change.
  { name: 'employees.shift column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS shift VARCHAR(20)` },
  { name: 'employees.salary_type column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20)` },
  { name: 'employees.workshop_zone column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS workshop_zone VARCHAR(100)` },
  { name: 'employees.attestation_date column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS attestation_date DATE` },
  { name: 'employees.marital_status column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30)` },
  { name: 'employees.children_count column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS children_count INTEGER` },
  { name: 'employees.children_education column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS children_education VARCHAR(30)` },
  { name: 'employees.household_size column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS household_size INTEGER` },
  { name: 'employees.household_members column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS household_members TEXT` },
  { name: 'employees.housing_type column (hr-employees-orphan-fields)', sql: `ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS housing_type VARCHAR(30)` },
  // ── HR Nazorat 4-page fix (2026-07-13, Muslimbek chat directive) — Intizom (Discipline) ──
  // discipline_records already has a real severity classifier + _applyLatenessPenalty fine
  // calc (late-arrival.service.ts) — NOT rewritten. Missing per vision: (a) reprimands auto
  // soft-archive after 6 months with repeat violations counted cumulatively; (b) escalation
  // follows verbal -> written -> fine -> dismissal stages. Both wired via discipline-escalation
  // .helper.ts (computeDisciplineEscalation) + discipline.cron.ts (expireOldRecords, unchanged
  // cadence 01:00 daily). Thresholds are business_settings-driven (Q-40 — never hardcoded);
  // defaults below reuse the 3/5/8 figures already live as DISCIPLINE_LATE_WARNING_THRESHOLD/
  // DISCIPLINE_LATE_REPRIMAND_THRESHOLD/DISCIPLINE_LATE_DISCHARGE_THRESHOLD (business.constants.ts,
  // flagged in project_magic_numbers_verify_2026_07_07.md), generalised here from "late arrivals
  // per month" to "any discipline_records violation within a rolling window" (cumulative, not
  // reset by archival). Columns is_archived/archived_at/escalation_stage added to
  // lib/db/src/schema/discipline.ts disciplineRecords (see that file for full column rationale).
  {
    name: 'discipline_records.is_archived column (reprimand soft-archive, 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false`,
  },
  {
    name: 'discipline_records.archived_at column (2026-07-13)',
    sql: `ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`,
  },
  {
    name: 'discipline_records.escalation_stage column (verbal/written/fine/dismissal, 2026-07-13)',
    sql: `ALTER TABLE IF EXISTS discipline_records ADD COLUMN IF NOT EXISTS escalation_stage VARCHAR(20) DEFAULT 'verbal'`,
  },
  {
    name: 'discipline_records.escalation_stage check constraint (2026-07-13)',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'discipline_records_escalation_stage_chk'
        ) THEN
          ALTER TABLE discipline_records ADD CONSTRAINT discipline_records_escalation_stage_chk
            CHECK (escalation_stage IS NULL OR escalation_stage IN ('verbal','written','fine','dismissal'));
        END IF;
      END $$
    `,
  },
  {
    name: 'business_settings hr.discipline_archive_after_months seed (2026-07-13)',
    // NOTE: value_type must be one of business_settings_value_type_chk's allowed values
    // (number|percent|days|minutes|amount|text|boolean) — 'months' is NOT in that CHECK
    // constraint list (business-settings-2026-07-11.sql) and silently failed every boot
    // until fixed here 2026-07-13; 'number' + unit='oy' carries the same meaning.
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('hr', 'hr.discipline_archive_after_months', 'Intizom: ogohlantirish arxiv muddati (oy)', 'number', 6, 'oy', 1, 60,
        'Discipline_records.discipline_type = ''reprimand'' bo''lgan yozuvlar shu oy sonidan (issued_date bo''yicha) o''tgach discipline.cron.ts orqali avtomatik soft-arxivlanadi (is_archived=true) — o''chirilmaydi, faqat faol Intizom ro''yxatidan yashiriladi, kumulyativ hisobga ta''sir qilmaydi. Default=6 oy, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.discipline_escalation_window_months seed (2026-07-13)',
    // NOTE: same value_type fix as hr.discipline_archive_after_months above.
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('hr', 'hr.discipline_escalation_window_months', 'Intizom: eskalatsiya oyna muddati (oy)', 'number', 12, 'oy', 1, 60,
        'Xodimning intizom eskalatsiya bosqichi (verbal/written/fine/dismissal) shu oy oynasi ichidagi qoidabuzarliklar soni bo''yicha hisoblanadi (discipline-escalation.helper.ts computeDisciplineEscalation). Default=12 oy, egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.discipline_written_threshold seed (2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('hr', 'hr.discipline_written_threshold', 'Intizom: yozma ogohlantirish bosqichi (dona)', 'number', 3, 'ta', 1, NULL,
        'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''written''ga o''tadi. Default=3 — DISCIPLINE_LATE_WARNING_THRESHOLD (business.constants.ts) bilan bir xil boshlang''ich qiymat, endi barcha buzilish turlariga umumlashtirilgan. Egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.discipline_fine_threshold seed (2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('hr', 'hr.discipline_fine_threshold', 'Intizom: jarima bosqichi (dona)', 'number', 5, 'ta', 1, NULL,
        'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''fine''ga o''tadi. Default=5 — DISCIPLINE_LATE_REPRIMAND_THRESHOLD bilan bir xil boshlang''ich qiymat, endi umumlashtirilgan. Egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.discipline_dismissal_threshold seed (2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('hr', 'hr.discipline_dismissal_threshold', 'Intizom: ishdan bo''shatish bosqichi (dona)', 'number', 8, 'ta', 1, NULL,
        'Oyna ichida shu sondan ko''p (kumulyativ) qoidabuzarlik bo''lsa escalation_stage=''dismissal''ga o''tadi. Default=8 — DISCIPLINE_LATE_DISCHARGE_THRESHOLD bilan bir xil boshlang''ich qiymat, endi umumlashtirilgan. Egasi business_settings CRUD orqali sozlaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // ── HR Nazorat 4-page fix (2026-07-13) — Xavfsizlik/Sog'liq Nazorati (hr-safety) ──
  // HRSafetyDialogs.tsx TrainingDialog free-text training name + ZoneDialog location/
  // hazardType/description had no DB column at all — silently dropped on submit
  // (Q-40/Q-43 fake-save). See schema-business-c-2-hr-safety.ts safety_training_records /
  // hazard_zones for full column rationale; wired into hr-compat-safety.repository.ts
  // createSafetyTraining/getSafetyTrainings/createHazardZone/getHazardZones in the same change.
  {
    name: 'safety_training_records.training_name column (2026-07-13)',
    sql: `ALTER TABLE IF EXISTS safety_training_records ADD COLUMN IF NOT EXISTS training_name TEXT`,
  },
  {
    name: 'hazard_zones.location column (2026-07-13)',
    sql: `ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS location TEXT`,
  },
  {
    name: 'hazard_zones.hazard_type column (2026-07-13)',
    sql: `ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS hazard_type TEXT`,
  },
  {
    name: 'hazard_zones.description column (2026-07-13)',
    sql: `ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS description TEXT`,
  },
  // HR Nazorat fix (2026-07-13, verified live): safety_training_records.training_id was
  // NOT NULL at the DB level, which made the whole training_name free-text-fallback
  // feature (added above) unreachable — even with training_name populated, ANY insert
  // with no course selected (training_id=null) still hit "null value in column
  // training_id violates not-null constraint" (confirmed via direct psql insert).
  // employee_id stays NOT NULL (a training record must always name who was trained).
  {
    name: 'safety_training_records.training_id DROP NOT NULL (2026-07-13, unblocks free-text fallback)',
    sql: `ALTER TABLE IF EXISTS safety_training_records ALTER COLUMN training_id DROP NOT NULL`,
  },
  // Owner question (2026-07-13): "where is most of the Add-Employee form's data configured
  // from?" — the "Vysotskiy darajasi (preset)" salary midpoints were hardcoded in
  // BaseSalaryInput.tsx (GRADE_PRESETS), not adjustable anywhere. Moved to business_settings
  // (module "hr") so HR/owner can tune them via the existing /admin/business-settings CRUD
  // screen. Human-readable mirror:
  // apps/api/src/shared/db/migrations/hr-vysotskiy-grade-salaries-2026-07-13.sql.
  {
    name: 'business_settings hr.grade_a_salary seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
      VALUES ('hr', 'hr.grade_a_salary', 'Vysotskiy darajasi A - asosiy maosh (o''rtacha)', 'amount', 12000000, 'som',
        'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida A darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.grade_b_salary seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
      VALUES ('hr', 'hr.grade_b_salary', 'Vysotskiy darajasi B - asosiy maosh (o''rtacha)', 'amount', 8000000, 'som',
        'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida B darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.grade_c_salary seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
      VALUES ('hr', 'hr.grade_c_salary', 'Vysotskiy darajasi C - asosiy maosh (o''rtacha)', 'amount', 5000000, 'som',
        'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida C darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings hr.grade_d_salary seed (owner 2026-07-13)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
      VALUES ('hr', 'hr.grade_d_salary', 'Vysotskiy darajasi D - asosiy maosh (o''rtacha)', 'amount', 3000000, 'som',
        'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida D darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // Item #104: Director dashboard aiInsights was hardcoded []. Thresholds for the
  // karta-AI aggregate (ckp_fact_values -> which cards are underperforming).
  // Human-readable mirror: apps/api/src/shared/db/migrations/director-card-ai-aggregate-thresholds-2026-08-05.sql.
  {
    name: 'business_settings director.card_ai_lookback_days seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.card_ai_lookback_days', 'Karta-AI agregat - orqaga qarash oynasi (kun)', 'days', 7, 'kun', 1, 90,
        'Director dashboard aiInsights (karta-AI agregat) ckp_fact_values dan shu sondan kam kun oldingi faktlarni o''rtachalaydi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings director.card_ai_underperform_threshold_pct seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.card_ai_underperform_threshold_pct', 'Karta-AI agregat - past-korsatkich chegarasi (%)', 'percent', 80, '%', 0, 100,
        'Shu foizdan past o''rtacha achievement_pct bo''lgan kartalar "erishmayapti" deb aiInsights ro''yxatida chiqadi.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings director.card_ai_aggregate_limit seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.card_ai_aggregate_limit', 'Karta-AI agregat - korsatiladigan kartalar soni', 'number', 10, 'ta', 1, 50,
        'aiInsights ro''yxatida bir vaqtda korsatiladigan eng-yomon kartalar maksimal soni.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // Item #116: diary carry-over only ever looked 1 day back, so an unresolved
  // problem silently stopped escalating unless the user retyped the exact same
  // text. Vision (05-director.md #7) already specifies the default threshold (3
  // days) and escalation recipients (director + org_functions.manager_id chain).
  // Human-readable mirror: apps/api/src/shared/db/migrations/dir-diary-chronic-escalation-2026-08-05.sql.
  {
    name: 'diary_entries.dir_chronic_days column (2026-08-05)',
    sql: `ALTER TABLE IF EXISTS diary_entries ADD COLUMN IF NOT EXISTS dir_chronic_days INTEGER NOT NULL DEFAULT 0`,
  },
  {
    name: 'business_settings director.diary_chronic_threshold_days seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.diary_chronic_threshold_days', 'Surunkali muammo eskalatsiya chegarasi (kun)', 'days', 3, 'kun', 1, 30,
        'diary_entries.main_issue shu kunlar soni ketma-ket carry-over qilinsa "surunkali muammo" deb belgilanadi va direktor + author_card_id ning org_functions.manager_id zanjiridagi yuqori kartaga eskalatsiya-bildirishnoma yuboriladi. Default=3 - vision-1000-answers/05-director.md#7.', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // Item #105: ZNO/ZVS and rasporyazhenie SLA escalation were both flat/single-shot —
  // vision (05-director.md #33) asks for a 3-stage chain: notify -> escalate to
  // manager's-manager -> HR discipline_records. Human-readable mirror:
  // apps/api/src/shared/db/migrations/director-multistage-sla-escalation-2026-08-05.sql.
  {
    name: 'zno/zvs/rasporyazhenie.escalation_stage columns (2026-08-05)',
    sql: `ALTER TABLE zno ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0`,
  },
  {
    name: 'zvs.escalation_stage column (2026-08-05)',
    sql: `ALTER TABLE zvs ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0`,
  },
  {
    name: 'rasporyazhenie.escalation_stage column (2026-08-05)',
    sql: `ALTER TABLE rasporyazhenie ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0`,
  },
  {
    name: 'business_settings director.escalation_stage2_sla_multiplier seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.escalation_stage2_sla_multiplier', 'ZNO/ZVS 2-bosqich: bazaviy SLA soatining necha barobari', 'number', 2, 'x', 1, 10,
        'stage 1->2 (managers-manager) necha x bazaviy SLA (24h/48h) dan keyin', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings director.escalation_stage3_sla_multiplier seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.escalation_stage3_sla_multiplier', 'ZNO/ZVS 3-bosqich: bazaviy SLA soatining necha barobari', 'number', 3, 'x', 2, 15,
        'stage 2->3 (HR discipline_records) necha x bazaviy SLA dan keyin', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings director.rasp_escalation_stage2_days seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.rasp_escalation_stage2_days', 'Farmoyish 2-bosqich: overdue dan necha kun keyin', 'number', 1, 'kun', 0, 30,
        'rasporyazhenie stage1(overdue)->2 (ijrochi menejerining menejeri) necha kundan keyin', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings director.rasp_escalation_stage3_days seed (2026-08-05)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('director', 'director.rasp_escalation_stage3_days', 'Farmoyish 3-bosqich: overdue dan necha kun keyin', 'number', 2, 'kun', 1, 60,
        'rasporyazhenie stage2->3 (HR discipline_records) necha kundan keyin', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // Item #151 (CC audit tavsiya #24, 2026-07-11): cc-sla.cron.ts remindOverdue48h()
  // hardcoded INTERVAL '48 hours' / '24 hours' — CRUD-sozlanadigan qilindi, cc.stale_draft_archive_days
  // bilan bir xil naqsh (business_settings, category='cc').
  {
    name: 'business_settings cc.overdue_reminder_threshold_hours seed (2026-08-06)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('cc', 'cc.overdue_reminder_threshold_hours', 'Kiruvchi savat: necha soatdan keyin takroriy eslatma boshlanadi', 'number', 48, 'soat', 1, 336,
        'cc-sla.cron.ts remindOverdue48h() — basket_entered_at dan shu soatdan ko''p vaqt o''tgan hujjatlarga takroriy eslatma yuborish boshlanadi (avto-rad etish YO''Q, 20-cc#30)', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings cc.overdue_reminder_repeat_hours seed (2026-08-06)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('cc', 'cc.overdue_reminder_repeat_hours', 'Takroriy eslatma orasidagi minimal interval', 'number', 24, 'soat', 1, 168,
        'cc-sla.cron.ts remindOverdue48h() — overdue_reminder_sent_at gate: shu soatdan kam vaqt o''tgan bo''lsa qayta eslatma yuborilmaydi', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // Magic-Numbers M6 remaining gap (memory: "quarantine still hardcoded", 2026-07-07):
  // quarantine-workflow.repository.ts escalateExpiredQuarantine() had a hardcoded
  // INTERVAL '48 hours' — CRUD-sozlanadigan qilindi, director escalation-hours bilan
  // bir xil naqsh (business_settings, category='pos').
  {
    name: 'business_settings pos.quarantine_escalation_hours seed (2026-08-06)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('pos', 'pos.quarantine_escalation_hours', 'Karantin: necha soatdan keyin QC-ko''rikka avtomatik o''tkaziladi', 'number', 48, 'soat', 1, 336,
        'quarantine-workflow.repository.ts escalateExpiredQuarantine() — status=''karantin'' shu soatdan ko''p turgan pos_movements avtomatik ''qc_review''ga o''tkaziladi (pos-quarantine-check.job.ts, har soatlik cron)', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3 §2.2 (fake-save): SdCreateContractSchema
  // (sd-quotations.dto.ts) already accepts start_date/total_amount as input — the DTO
  // contract committed to this shape — but sd_contracts had no backing column for either,
  // so both were silently dropped on every contract create. Additive nullable columns,
  // numeric(18,2) matches sales_orders.total_amount precedent.
  {
    name: 'sd_contracts.start_date + total_amount columns (2026-08-06, fake-save fix)',
    sql: `ALTER TABLE IF EXISTS sd_contracts
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2)`,
  },
  // audit 2026-08-06 T17: chat presence had no TTL — a user whose disconnect event was
  // lost (server crash, Q-44 nest-watch kill) stayed "ONLINE" forever (live DB showed a
  // row stuck ONLINE for 3+ weeks). chat-presence-cleanup.cron.ts sweeps stale rows;
  // threshold is CRUD-configurable per the owner's business_settings rule.
  {
    name: 'business_settings chat.presence_ttl_minutes seed (2026-08-07)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('chat', 'chat.presence_ttl_minutes', 'Chat: necha daqiqa harakatsizlikdan keyin OFFLINE deb belgilanadi', 'number', 5, 'daqiqa', 1, 120,
        'chat-presence-cleanup.cron.ts — last_seen_at shu daqiqadan eski ONLINE qatorlar avtomatik OFFLINE qilinadi (disconnect-event yo''qolgan holatlar uchun)', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // audit 2026-08-06 (QC): qc-extended.service.ts createInProcessInspection() lot auto-fail
  // chegarasi getConfigNumber('qc_lot_defect_fail_ratio') orqali ESKI `settings` jadvalidan
  // o'qilardi — u yerda qator yo'q edi va `settings` uchun CRUD ekran ham yo'q, ya'ni egasi
  // chegarani HECH QACHON o'zgartira olmasdi (doimo 0.05 fallback). Kanonik business_settings
  // ga ko'chirildi ("threshold qiymatlar = doim CRUD" qoidasi).
  // Ulush (ratio) sifatida saqlanadi — kod defects/total > failRatio deb solishtiradi,
  // shuning uchun value_type='number', 0..1 oralig'i (percent 0..100 konvensiyasi EMAS).
  {
    name: 'business_settings qc.lot_defect_fail_ratio seed (2026-08-07)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('qc', 'qc.lot_defect_fail_ratio', 'Lot brak ulushi: shu chegaradan oshsa lot avtomatik "failed"', 'number', 0.05, 'ulush', 0, 1,
        'qc-extended.service.ts createInProcessInspection() — jarayon-ichi ko''rikda brak/jami nisbati shu ulushdan (0.05 = 5%) katta bo''lsa status=''failed'', aks holda brak bo''lsa ''conditional'', brak yo''q bo''lsa ''passed''', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // audit 2026-08-06 (QC bonus): kalibrovka/etalon-namuna "due_soon" oynasi xom SQL'da
  // CURRENT_DATE + 30 deb qattiq yozilgan edi (instrument-calibration.repository.ts,
  // reference-sample.repository.ts) — CRUD-yo'l yo'q edi. Endi shu sozlama boshqaradi.
  {
    name: 'business_settings qc.calibration_due_soon_days seed (2026-08-07)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('qc', 'qc.calibration_due_soon_days', 'Kalibrovka/etalon namuna: muddat tugashiga necha kun qolganda ogohlantiriladi', 'days', 30, 'kun', 1, 365,
        'instrument-calibration.repository.ts (next_due_at) va reference-sample.repository.ts (retention_until) — muddat shu kundan yaqinroq bo''lsa due_soon / expiring_soon bayrog''i yoqiladi', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  // audit 2026-08-06 (MM — 18 modulli auditga umuman kirmagan modul): vendor-invoice
  // moslashtirish chegaralari kodda hardcoded bo'lishi mumkin emas ("threshold qiymatlar
  // = doim CRUD" qoidasi). mm-vendor-invoice.service.ts shu ikki sozlamani o'qiydi;
  // so'rovda foiz berilsa (FE `{ tolerance: 5 }`) o'sha ustun bo'ladi, aks holda shu qiymat.
  // ULUSH sifatida saqlanadi (0.05 = 5%) — qc.lot_defect_fail_ratio bilan bir xil konvensiya,
  // percent 0..100 EMAS.
  {
    name: 'business_settings mm.three_way_qty_tolerance_pct seed (2026-08-07)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('mm', 'mm.three_way_qty_tolerance_pct', '3-tomonlama moslik: miqdor chetlanishi uchun ruxsat etilgan ulush', 'number', 0.05, 'ulush', 0, 1,
        'mm-vendor-invoice.service.ts runThreeWayMatch()/matchInvoiceToPo() — hisob-faktura miqdori qabul qilingan (GR) miqdordan shu ulushdan ko''p farq qilsa match_status=''variance''', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
  {
    name: 'business_settings mm.three_way_amount_tolerance_pct seed (2026-08-07)',
    sql: `INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
      VALUES ('mm', 'mm.three_way_amount_tolerance_pct', '3-tomonlama moslik: summa chetlanishi uchun ruxsat etilgan ulush', 'number', 0.05, 'ulush', 0, 1,
        'mm-vendor-invoice.service.ts runThreeWayMatch()/matchInvoiceToPo() — hisob-faktura summasi xarid buyurtmasi (PO) summasidan shu ulushdan ko''p farq qilsa match_status=''variance'' va to''lov bloklanadi', true)
      ON CONFLICT (setting_key) DO NOTHING`,
  },
];
