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
];
