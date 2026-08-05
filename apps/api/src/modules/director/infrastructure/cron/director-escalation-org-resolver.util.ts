/**
 * @module director-escalation-org-resolver.util
 * @description Item #105: shared org-walk used by both zno-zvs and rasporyazhenie
 *   multi-stage SLA escalation crons. Same two-step fallback already used inline by
 *   zno-zvs-sla-escalation.cron.ts's resolveNextLevel (direct manager, else nearest
 *   org_departments head up the tree) — extracted here so calling it twice gives
 *   "manager's manager" for stage 2 without duplicating the SQL in two cron files.
 *   Not imported from the CC module (cc-org-resolver.service.ts) per MODUL_SHARTNOMASI.md
 *   module-boundary rule — this is a same-module (director) copy of the identical logic.
 */
import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

const logger = new Logger('DirectorEscalationOrgResolver');

/**
 * senderUserId → next-higher org level: direct manager (employees.manager_id → users.id),
 * else nearest org_departments head up the tree. Returns null (and warns) if neither
 * resolves — callers must fail-open (skip that hop, never throw).
 */
export async function resolveNextOrgLevel(senderUserId: number): Promise<number | null> {
  const direct = await runQuery<{ user_id: number | null }>(sql`
    SELECT m.user_id
    FROM employees e
    JOIN employees m ON m.id = e.manager_id
    WHERE e.user_id = ${senderUserId} AND e.manager_id IS NOT NULL AND e.manager_id <> 0
    LIMIT 1
  `);
  const directId = direct.rows[0]?.user_id ?? null;
  if (directId) return directId;

  const walk = await runQuery<{ head_user_id: number | null }>(sql`
    WITH RECURSIVE chain AS (
      SELECT od.id, od.parent_id, od.head_user_id, 0 AS depth
      FROM employee_org_departments eod
      JOIN org_departments od ON od.id = eod.org_department_id
      WHERE eod.user_id = ${senderUserId} AND eod.is_primary = true
      UNION ALL
      SELECT p.id, p.parent_id, p.head_user_id, c.depth + 1
      FROM chain c
      JOIN org_departments p ON p.id = c.parent_id
      WHERE c.depth < 20
    )
    SELECT head_user_id FROM chain
    WHERE head_user_id IS NOT NULL AND head_user_id <> ${senderUserId}
    ORDER BY depth
    LIMIT 1
  `);
  const headId = walk.rows[0]?.head_user_id ?? null;
  if (!headId) {
    logger.warn(`resolveNextOrgLevel(sender=${senderUserId}): manager_id NULL/0 va org tree'da bo'lim rahbari yo'q — escalation notify skip`);
    return null;
  }
  return headId;
}

/** users.id → employees.id (discipline_records.employee_id references employees, not users). */
export async function resolveEmployeeIdForUser(userId: number): Promise<number | null> {
  const r = await runQuery<{ id: number }>(sql`SELECT id FROM employees WHERE user_id = ${userId} LIMIT 1`);
  return r.rows[0]?.id ?? null;
}
