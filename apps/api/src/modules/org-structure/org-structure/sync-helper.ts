/**
 * @module org-structure/sync-helper
 * @description Keeps `departments` and `positions` tables in sync with org_departments.
 *   Pure helper — no DI; takes a row + action and writes via runQuery.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - ON CONFLICT (code) DO UPDATE SET col = EXCLUDED.col upsert pattern
 *     against legacy `departments` and `positions` tables (mirror-sync targets
 *     for the canonical org_departments tree)
 *   - Cross-schema writes — these legacy mirror tables are intentionally NOT
 *     declared as Drizzle schemas (they are derived/projected from org_departments)
 *   - Synthetic code generation ('ORG-' + orgId) used inline as the conflict key
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

type Row = Record<string, unknown>;

export async function syncToCoreTable(
  row: Row,
  action: 'create' | 'update' | 'deactivate',
): Promise<void> {
  try {
    const nodeType = (row.node_type as string) ?? 'department';
    const orgId   = Number(row.id);
    const name    = String(row.name ?? '');
    const nameRu  = row.name_ru ? String(row.name_ru) : null;
    const isActive = action !== 'deactivate';

    if (nodeType === 'position') {
      if (action === 'create') {
        await runQuery(sql`
          INSERT INTO positions (code, name_uz, name_ru, is_active, created_at, updated_at)
          VALUES (${'ORG-' + orgId}, ${name}, ${nameRu ?? name}, ${isActive}, NOW(), NOW())
          ON CONFLICT (code) DO UPDATE
            SET name_uz   = EXCLUDED.name_uz,
                name_ru   = EXCLUDED.name_ru,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
        `);
      } else {
        await runQuery(sql`
          UPDATE positions
          SET name_uz    = ${name},
              name_ru    = ${nameRu ?? name},
              is_active  = ${isActive},
              updated_at = NOW()
          WHERE code = ${'ORG-' + orgId}
        `);
      }
    } else {
      if (action === 'create') {
        await runQuery(sql`
          INSERT INTO departments (code, name_uz, name_ru, level, sort_order, is_active, created_at, updated_at)
          VALUES (
            ${'ORG-' + orgId}, ${name}, ${nameRu ?? name},
            ${Number(row.level ?? 1)}, ${Number(row.sort_order ?? 0)},
            ${isActive}, NOW(), NOW()
          )
          ON CONFLICT (code) DO UPDATE
            SET name_uz    = EXCLUDED.name_uz,
                name_ru    = EXCLUDED.name_ru,
                level      = EXCLUDED.level,
                sort_order = EXCLUDED.sort_order,
                is_active  = EXCLUDED.is_active,
                updated_at = NOW()
        `);
      } else {
        await runQuery(sql`
          UPDATE departments
          SET name_uz    = ${name},
              name_ru    = ${nameRu ?? name},
              is_active  = ${isActive},
              updated_at = NOW()
          WHERE code = ${'ORG-' + orgId}
        `);
      }
    }
  } catch {
    // Non-critical sync failure — caller already swallows
  }
}
