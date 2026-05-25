/**
 * @module operations.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { downtimeEvents } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { OperationsRepository } from './operations.repository';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(private readonly repo: OperationsRepository) {}

  async getDowntimeEvents(sessionId?: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.findDowntimeEvents(sessionId);
  }

  async createDowntimeEvent(dto: Record<string, unknown>) {
    return safeCall(async () => {
      const sessionId = dto['sessionId'] as string;
      const sessionsR = await this.repo.findSession(parseInt(sessionId));
      const sessions = (sessionsR.ok ? sessionsR.data as Record<string, unknown>[] : []);
      if (!sessions[0]) throw new NotFoundException(`Sessiya #${sessionId} topilmadi`);
      const createdR = await this.repo.createDowntimeEvent(dto as typeof downtimeEvents.$inferInsert);
      const created = (createdR.ok ? createdR.data as { id?: number } : {});
      this.logger.log(`operations: yaratildi id=${created?.id}`);
      return created;
    });
  }

  async getReasonCodes() {
    return this.repo.findReasonCodes();
  }
}
