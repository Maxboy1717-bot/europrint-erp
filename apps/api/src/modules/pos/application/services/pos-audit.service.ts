/**
 * @module pos-audit.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Audit Log Service
 */
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PosAuditRepository, AuditLogEntry } from '../../infrastructure/repositories/pos-audit.repository';

export type { AuditLogEntry };

@Injectable()
export class PosAuditService {
  private readonly logger = new Logger(PosAuditService.name);

  constructor(private readonly repo: PosAuditRepository) {}

  async log(entry: AuditLogEntry): Promise<Result<void, AppError>> {
    const r = await safeCall(async () => {
      await this.repo.insertLog({ ...entry, createdAt: _time.now() });
    });
    if (!r.ok) this.logger.error(`Audit log yozishda xato: ${r.error.message}`);
    return r;
  }

  async logError(entry: Omit<AuditLogEntry, 'success'> & { error: Error }): Promise<void> {
    await this.log({ ...entry, success: false, errorMessage: entry.error.message });
  }

  async getAuditLog(options: {
    userId?: number; entityType?: string; entityId?: number; action?: string;
    dateFrom?: Date; dateTo?: Date; page?: number; limit?: number;
  }) {
    const page   = options.page  ?? 1;
    const limit  = options.limit ?? 50;
    const offset = (page - 1) * limit;

    const auditR = await this.repo.queryAuditLog(
      { userId: options.userId, entityType: options.entityType, entityId: options.entityId,
        action: options.action, dateFrom: options.dateFrom, dateTo: options.dateTo },
      limit, offset,
    );
    const { items, countRow } = (auditR.ok ? auditR.data : { items: [], countRow: undefined }) as { items: unknown[]; countRow?: Record<string, unknown> };
    return {
      items,
      total: Number(countRow?.['total'] ?? 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countRow?.['total'] ?? 0) / limit),
    };
  }

  async getEntityHistory(entityType: string, entityId: number) {
    return this.repo.getEntityHistory(entityType, entityId);
  }
}
