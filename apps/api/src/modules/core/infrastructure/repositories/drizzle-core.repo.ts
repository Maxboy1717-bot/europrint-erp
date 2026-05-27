/**
 * @module drizzle-core.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, user_panels as userPanels } from '@shared/db';
import { Result, Err, Ok } from '@common/types/result.type';
import { ICoreRepo } from '../../domain/repositories/i-core.repo';
import { Panel, PanelLayout } from '../../domain/aggregates/panel.aggregate';
import { createId } from '@paralleldrive/cuid2';

// Re-export so callers that previously imported `userPanels` from this file keep working.
export { userPanels };

type DbRow = Record<string, unknown>;
type UserPanelRow = typeof userPanels.$inferSelect;

function extractFirst<T>(result: T[] | { rows?: T[] }): T | undefined {
  return Array.isArray(result) ? result[0] : result.rows?.[0];
}

function errMsg(e: unknown): string {
  return e instanceof Error ? (e as Error).message : String(e);
}

@Injectable()
export class DrizzleCoreRepo implements ICoreRepo {
  private readonly logger = new Logger(DrizzleCoreRepo.name);

  async findPanelByUserId(userId: string): Promise<Result<Panel | null>> {
    try {
      const result = await db.select().from(userPanels).where(eq(userPanels.userId, userId));
      if (result.length === 0) return Ok(null);
      return Ok(this.mapToPanel(result[0]));
    } catch (error) {
      this.logger.error(
        { method: 'findPanelByUserId', userId, error },
        'Database query failed',
      );
      return Err(`Failed to fetch user panel: ${(error as Error).message}`);
    }
  }

  async savePanelForUser(userId: string, layout: PanelLayout[], name?: string): Promise<Result<Panel>> {
    try {
      const id = createId();
      const now = _time.now();
      const data = { id, userId, name: name || 'My Dashboard', layout: layout || [], isDefault: false, createdAt: now, updatedAt: now };
      const result = await db.insert(userPanels).values(data).returning();
      const created = extractFirst<UserPanelRow>(result as UserPanelRow[] | { rows?: UserPanelRow[] });
      if (!created) return Err('Panelni saqlashda xato');
      return Ok(this.mapToPanel(created));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async updatePanelLayout(userId: string, layout: PanelLayout[]): Promise<Result<Panel>> {
    try {
      const result = await db.update(userPanels).set({ layout: layout || [], updatedAt: _time.now() }).where(eq(userPanels.userId, userId)).returning();
      const updated = extractFirst<UserPanelRow>(result as UserPanelRow[] | { rows?: UserPanelRow[] });
      if (!updated) return Err('Panel topilmadi');
      return Ok(this.mapToPanel(updated));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async getDefaultPanel(): Promise<Result<Panel | null>> {
    try {
      const result = await db.select().from(userPanels).where(eq(userPanels.isDefault, true));
      if (result.length === 0) return Ok(null);
      return Ok(this.mapToPanel(result[0]));
    } catch (error) {
      this.logger.error(
        { method: 'getDefaultPanel', error },
        'Database query failed',
      );
      return Err(`Failed to fetch default panel: ${(error as Error).message}`);
    }
  }

  private mapToPanel(row: UserPanelRow | DbRow): Panel {
    const r = row as DbRow;
    return new Panel(
      String(r['id'] ?? ''), String(r['userId'] || r['user_id'] || ''), String(r['name'] ?? ''),
      (r['layout'] as PanelLayout[]) || [], Boolean(r['isDefault'] || r['is_default']),
      new Date(String(r['createdAt'] || r['created_at'] || _time.now())),
      new Date(String(r['updatedAt'] || r['updated_at'] || _time.now())),
    );
  }
}
