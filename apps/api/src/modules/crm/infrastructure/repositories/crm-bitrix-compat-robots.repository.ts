/**
 * @module crm-bitrix-compat-robots.repository (infrastructure)
 * @description Sub-repository for Bitrix-compatible CRM automation robots.
 *   Split from `crm-bitrix-compat.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmBitrixCompatRepository` is the sole implementer of `ICrmBitrixCompatRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_robots } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmBitrixCompatRobotsRepository {
  private readonly logger = new Logger(CrmBitrixCompatRobotsRepository.name);

  async listRobots(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select().from(crm_robots)
          .orderBy(sql`${crm_robots.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listRobots: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async getRobot(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      try {
        const rows = await db.select().from(crm_robots).where(eq(crm_robots.id, id));
        return (rows[0] ?? null) as Row | null;
      } catch (err) {
        this.logger.warn(`getRobot: ${(err as Error).message}`);
        throw err;
      }
      }, 'DB_ERROR');
  }

  async createRobot(body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_robots).values({
        name:         (body.name as string) ?? 'New Robot',
        trigger_type: (body.trigger_event as string) ?? undefined,
        action_type:  (body.type as string) ?? 'automation',
        config:       body.actions ? { actions: body.actions, conditions: body.conditions ?? null } : undefined,
        is_active:    (body.is_active as boolean) ?? true,
      }).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async updateRobot(id: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_robots).set({
        name:         sql`COALESCE(${body.name ?? null}, ${crm_robots.name})`,
        trigger_type: sql`COALESCE(${body.trigger_event ?? null}, ${crm_robots.trigger_type})`,
        action_type:  sql`COALESCE(${body.type ?? null}, ${crm_robots.action_type})`,
      }).where(eq(crm_robots.id, id)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async toggleRobot(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_robots)
        .set({ is_active: sql`NOT ${crm_robots.is_active}` })
        .where(eq(crm_robots.id, id))
        .returning({ id: crm_robots.id, is_active: crm_robots.is_active });
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteRobot(id: number): Promise<void> {
    await db.delete(crm_robots).where(eq(crm_robots.id, id));
  }
}
