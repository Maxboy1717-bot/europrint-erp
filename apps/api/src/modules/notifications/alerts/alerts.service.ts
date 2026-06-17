/**
 * @module alerts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { notifications } from '@europrint/schemas';
import { Result, safeCall } from '@common/result';
import { AlertsRepository } from './alerts.repository';

type NotificationRow = typeof notifications.$inferSelect;

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly repo: AlertsRepository) {}

  async findAll(query: Record<string, unknown> = {}) {
    return safeCall(async () => {
      const page = Number(query['page'] ?? 1);
      const limit = Number(query['limit'] ?? 10);
      const resultR = await this.repo.findAll(page, limit);
      const { data, total } = (resultR.ok ? resultR.data : { data: [], total: 0 }) as { data: unknown[]; total: number };
      return { data, pagination: { total, page, limit } };
    });
  }

  async findOne(id: number): Promise<NotificationRow> {
    const rowR = await this.repo.findOne(id);
    const row = (rowR.ok ? rowR.data : null) as NotificationRow | null;
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      // notifications.body is NOT NULL in the live DB — guarantee it (fall back to message/title) so the
      // insert can't 23502 when the caller only sent message/title.
      const body = dto.body ?? dto.message ?? dto.title ?? '';
      const values = { ...dto, body, ...(createdBy ? { createdBy } : {}) } as typeof notifications.$inferInsert;
      return this.repo.create(values);
    });
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof notifications.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.remove(id);
      this.logger.log(`alerts: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }
}
