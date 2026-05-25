/**
 * @module drizzle-insights.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, or, isNull } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { aiInsights } from '@europrint/schemas';
import { InsightItem } from '../../presentation/dto/ai-insights.dto';

@Injectable()
export class DrizzleInsightsRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  private toItem(r: typeof aiInsights.$inferSelect): InsightItem {
    return {
      id:          r.id,
      module:      r.module,
      title:       r.title,
      description: r.description,
      type:        r.insightType as InsightItem['type'],
      priority:    r.priority as InsightItem['priority'],
      isRead:      r.isRead,
      createdAt:   r.createdAt?.toISOString() ?? _time.now().toISOString(),
      readAt:      r.readAt?.toISOString() ?? null,
    };
  }

  async findAll(userId: string): Promise<Result<InsightItem[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiInsights)
        .where(or(eq(aiInsights.userId, Number(userId)), isNull(aiInsights.userId)))
        .limit(50);
      return (Array.isArray(rows) ? rows : []).map((r) => this.toItem(r));
    });
  }

  async create(module: string, title: string, description: string, userId: string): Promise<Result<InsightItem>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiInsights)
        .values({ module, title, description, userId: Number(userId), insightType: 'ai_generated', priority: 'medium', isRead: false })
        .returning();
      if (!row) throw new Error('AI insight yaratishda xato: natija qaytmadi');
      return this.toItem(row);
    });
  }

  async markRead(id: string, userId: string): Promise<Result<void>> {
    return safeCall(async () => {
      const updated = await this.drizzle.db
        .update(aiInsights)
        .set({ isRead: true, readAt: _time.now() })
        .where(and(eq(aiInsights.id, id), eq(aiInsights.userId, Number(userId))))
        .returning({ id: aiInsights.id });
      if (updated.length === 0) throw new NotFoundException(`Tushuncha topilmadi: ${id}`);
    });
  }
}
