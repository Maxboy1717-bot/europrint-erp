/**
 * @module insights.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { DrizzleInsightsRepo } from '../../infrastructure/repositories/drizzle-insights.repo';
import { InsightItem } from '../../presentation/dto/ai-insights.dto';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(private readonly repo: DrizzleInsightsRepo) {}

  async getAll(userId: string): Promise<Result<InsightItem[]>> {
    return this.repo.findAll(userId);
  }

  async generate(module: string, userId: string): Promise<Result<InsightItem>> {
    const title       = `AI tushunchasi — ${module}`;
    const description = `${module} moduli uchun AI tahlili. Tizim AI tomonidan yaratildi.`;
    return this.repo.create(module, title, description, userId);
  }

  async markRead(id: string, userId: string): Promise<Result<{ message: string }>> {
    const result = await this.repo.markRead(id, userId);
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Insight marked as read: ${id} by user ${userId}`);
    return Ok({ message: 'O`qilgan deb belgilandi' });
  }
}
