/**
 * @module invariants/migrations-crm
 * @description CRM tables/columns + warehouses seed + POS movement types seed migrations.
 */

import type { MigrationDef } from './migrations-schema';

export const CRM_MIGRATIONS: Array<MigrationDef> = [
  {
    name: 'crm_activities table',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_activities (
        id           SERIAL PRIMARY KEY,
        entity_type  TEXT,
        entity_id    INTEGER,
        type         TEXT,
        subject      TEXT,
        notes        TEXT,
        outcome      TEXT,
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        due_date     TIMESTAMP,
        lead_id      INTEGER,
        deal_id      INTEGER,
        assigned_to  INTEGER,
        created_by   INTEGER,
        assignee_id  INTEGER,
        status       TEXT DEFAULT 'scheduled',
        created_at   TIMESTAMP DEFAULT now(),
        updated_at   TIMESTAMP DEFAULT now()
      )
    `,
  },
  { name: 'crm_activities add lead_id col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS lead_id INTEGER` },
  { name: 'crm_activities add deal_id col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS deal_id INTEGER` },
  { name: 'crm_activities add notes col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS notes TEXT` },
  { name: 'crm_activities add subject col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS subject TEXT` },
  { name: 'crm_activities add due_date col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS due_date TIMESTAMP` },
  { name: 'crm_activities add status col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'` },
  { name: 'crm_activities add outcome col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS outcome TEXT` },
  { name: 'crm_activities add completed_at col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP` },
  { name: 'crm_activities add assigned_to col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS assigned_to INTEGER` },
  { name: 'crm_activities add created_at col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()` },
  { name: 'crm_activities add updated_at col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()` },
  { name: 'crm_activities add entity_type col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS entity_type TEXT` },
  { name: 'crm_activities add entity_id col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS entity_id INTEGER` },
  { name: 'crm_activities add type col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS type TEXT` },
  { name: 'crm_activities add scheduled_at col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP` },
  { name: 'crm_activities add assignee_id col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS assignee_id INTEGER` },
  { name: 'crm_activities add created_by col if missing', sql: `ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS created_by INTEGER` },
  { name: 'crm_activities drop NOT NULL on owner_type_id', sql: `ALTER TABLE crm_activities ALTER COLUMN owner_type_id DROP NOT NULL` },
  { name: 'crm_activities drop NOT NULL on owner_id', sql: `ALTER TABLE crm_activities ALTER COLUMN owner_id DROP NOT NULL` },
  { name: 'crm_activities drop NOT NULL on type_id', sql: `ALTER TABLE crm_activities ALTER COLUMN type_id DROP NOT NULL` },
  { name: 'crm_activities drop NOT NULL on responsible_id', sql: `ALTER TABLE crm_activities ALTER COLUMN responsible_id DROP NOT NULL` },
  { name: 'crm_comments drop NOT NULL on entity_type', sql: `ALTER TABLE crm_comments ALTER COLUMN entity_type DROP NOT NULL` },
  { name: 'crm_comments drop NOT NULL on entity_id', sql: `ALTER TABLE crm_comments ALTER COLUMN entity_id DROP NOT NULL` },
  { name: 'crm_comments drop NOT NULL on content', sql: `ALTER TABLE crm_comments ALTER COLUMN content DROP NOT NULL` },
  { name: 'crm_comments drop NOT NULL on author_id', sql: `ALTER TABLE crm_comments ALTER COLUMN author_id DROP NOT NULL` },
  {
    name: 'crm_comments table',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_comments (
        id         SERIAL PRIMARY KEY,
        lead_id    INTEGER,
        deal_id    INTEGER,
        text       TEXT,
        author_id  INTEGER,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `,
  },
  { name: 'crm_comments add lead_id col if missing', sql: `ALTER TABLE crm_comments ADD COLUMN IF NOT EXISTS lead_id INTEGER` },
  { name: 'crm_comments add deal_id col if missing', sql: `ALTER TABLE crm_comments ADD COLUMN IF NOT EXISTS deal_id INTEGER` },
  { name: 'crm_comments add text col if missing', sql: `ALTER TABLE crm_comments ADD COLUMN IF NOT EXISTS text TEXT` },
  { name: 'crm_comments add author_id col if missing', sql: `ALTER TABLE crm_comments ADD COLUMN IF NOT EXISTS author_id INTEGER` },
  {
    name: 'crm_tasks table',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_tasks (
        id          SERIAL PRIMARY KEY,
        title       TEXT,
        lead_id     INTEGER,
        deal_id     INTEGER,
        assigned_to INTEGER,
        due_date    TIMESTAMP,
        status      TEXT DEFAULT 'pending',
        priority    TEXT DEFAULT 'medium',
        created_at  TIMESTAMP DEFAULT now(),
        updated_at  TIMESTAMP DEFAULT now()
      )
    `,
  },
  { name: 'crm_tasks add lead_id col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS lead_id INTEGER` },
  { name: 'crm_tasks add deal_id col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS deal_id INTEGER` },
  { name: 'crm_tasks add priority col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'` },
  { name: 'crm_tasks add status col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'` },
  { name: 'crm_tasks add due_date col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP` },
  { name: 'crm_tasks add assigned_to col if missing', sql: `ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS assigned_to INTEGER` },
  { name: 'crm_leads add contact_name col if missing', sql: `ALTER TABLE IF EXISTS crm_leads ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200)` },
  { name: 'crm_leads add contact_email col if missing', sql: `ALTER TABLE IF EXISTS crm_leads ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200)` },
  { name: 'crm_leads add contact_phone col if missing', sql: `ALTER TABLE IF EXISTS crm_leads ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)` },
  // APPROVED: owner Q-35 schema-approval wave (2026-07-11, ca3648bf) — EP-MKT-102
  // (docs/audit/decisions/14-marketing.md:733-738, Javob A, action: CREATE). Marketing #80
  // "Hudud+eksport belgisi": har lid uchun hudud (viloyat/davlat) + eksport/ichki belgisi.
  // Scoped to crm_leads only (the live lead table — the standalone `leads` table has 0 code
  // references, confirmed 2026-07-11). Additive/nullable region + default-false is_export;
  // existing rows unaffected (Q-39/Q-46). Human-readable mirror:
  // apps/api/src/shared/db/migrations/crm-leads-region-export-2026-07-11.sql.
  { name: 'crm_leads add region col if missing (EP-MKT-102, Marketing #80)', sql: `ALTER TABLE IF EXISTS crm_leads ADD COLUMN IF NOT EXISTS region TEXT` },
  { name: 'crm_leads add is_export col if missing (EP-MKT-102, Marketing #80)', sql: `ALTER TABLE IF EXISTS crm_leads ADD COLUMN IF NOT EXISTS is_export BOOLEAN NOT NULL DEFAULT FALSE` },
  { name: 'warehouses: deactivate old WH-* test warehouses',
    sql: `UPDATE warehouses SET is_active = false WHERE code LIKE 'WH-%' AND is_active = true` },
  { name: 'warehouses seed: RM-MAIN (Xom Ashyo)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'RM-MAIN', 'Xom Ashyo Ombori', 'raw_material', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-MAIN')` },
  { name: 'warehouses seed: RM-ROLLS (Rulon Ombori)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'RM-ROLLS', 'Rulon Ombori', 'raw_material', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'RM-ROLLS')` },
  { name: 'warehouses seed: FG-MAIN (Tayyor Mahsulot)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'FG-MAIN', 'Tayyor Mahsulot Ombori', 'finished_goods', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'FG-MAIN')` },
  { name: 'warehouses seed: WIP-MAIN (Yarim Tayyor)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'WIP-MAIN', 'Yarim Tayyor Mahsulot', 'wip', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'WIP-MAIN')` },
  { name: 'warehouses seed: SCRAP-MAIN (Brak)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'SCRAP-MAIN', 'Brak Ombori', 'scrap', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'SCRAP-MAIN')` },
  { name: 'warehouses seed: QC-HOLD (Karantin)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'QC-HOLD', 'Karantin Ombori', 'quarantine', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'QC-HOLD')` },
  { name: 'warehouses seed: TOOL-MAIN (Asbob-Uskuna)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'TOOL-MAIN', 'Asbob-Uskuna Ombori', 'tools', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'TOOL-MAIN')` },
  { name: "warehouses seed: MRO-MAIN (Xo'jalik)",
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'MRO-MAIN', 'Xo''jalik Ombori', 'household', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-MAIN')` },
  { name: 'warehouses seed: MRO-STORE (MRO)',
    sql: `INSERT INTO warehouses (code, name, type, is_active, created_at)
          SELECT 'MRO-STORE', 'MRO Ombori', 'mro', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRO-STORE')` },
  { name: 'warehouses: ensure 9 standard warehouses are active',
    sql: `UPDATE warehouses SET is_active = true
          WHERE code IN ('RM-MAIN','RM-ROLLS','FG-MAIN','WIP-MAIN','SCRAP-MAIN',
                         'QC-HOLD','TOOL-MAIN','MRO-MAIN','MRO-STORE')
            AND (is_active IS NULL OR is_active = false)` },
  { name: 'pos_movement_types seed: EXTERNAL_IN',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'EXTERNAL_IN', 'Tashqi Kirim', 'in', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'EXTERNAL_IN')` },
  { name: 'pos_movement_types seed: EXTERNAL_OUT',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'EXTERNAL_OUT', 'Tashqi Chiqim', 'out', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'EXTERNAL_OUT')` },
  { name: 'pos_movement_types seed: INTERNAL_ISSUE',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'INTERNAL_ISSUE', 'Bo''limga Berish', 'out', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'INTERNAL_ISSUE')` },
  { name: 'pos_movement_types seed: INTERNAL_RETURN',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'INTERNAL_RETURN', 'Qaytarish', 'in', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'INTERNAL_RETURN')` },
  { name: "pos_movement_types seed: INTERNAL_TRANSFER",
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'INTERNAL_TRANSFER', 'Ombor Ko''chirish', 'transfer', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'INTERNAL_TRANSFER')` },
  { name: 'pos_movement_types seed: DAMAGE',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'DAMAGE', 'Zarar Akti', 'adjustment', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'DAMAGE')` },
  { name: 'pos_movement_types seed: INVENTORY_ADJUST',
    sql: `INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
          SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
                 'INVENTORY_ADJUST', 'Inventarizatsiya Tuzatish', 'adjustment', true, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = 'INVENTORY_ADJUST')` },
  { name: 'pos_movement_types: reactivate any disabled types',
    sql: `UPDATE pos_movement_types SET is_active = true
          WHERE code IN ('EXTERNAL_IN','EXTERNAL_OUT','INTERNAL_ISSUE','INTERNAL_RETURN',
                         'INTERNAL_TRANSFER','DAMAGE','INVENTORY_ADJUST')
            AND (is_active IS NULL OR is_active = false)` },
];
