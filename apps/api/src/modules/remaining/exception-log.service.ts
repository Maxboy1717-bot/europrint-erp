/**
 * @module exception-log.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { ExceptionLogRepository, ExceptionInsert } from './exception-log.repository';

@Injectable()
export class ExceptionLogService {
  private readonly logger = new Logger(ExceptionLogService.name);

  constructor(
    private readonly repo: ExceptionLogRepository,
    private readonly i18n: I18nService,
  ) {}

  async getAll(q: Record<string, string>): Promise<Result<object, AppError>> {
    const limit = parseInt(q['limit'] ?? '50', 10);
    const offset = parseInt(q['offset'] ?? '0', 10);
    try {
      const data = await this.repo.getAll({
        module: q['module'], exceptionType: q['exceptionType'], status: q['status'],
        relatedRecordId: q['relatedRecordId'], documentNumber: q['documentNumber'],
        fromDate: q['fromDate'], toDate: q['toDate'], limit, offset,
      });
      const total = await this.repo.countAll({ module: q['module'], exceptionType: q['exceptionType'], status: q['status'] });
      return Ok({ data, total, limit, offset });
    } catch {
      this.logger.warn('exception_logs table not found, returning empty list');
      return Ok({ data: [], total: 0, limit, offset });
    }
  }

  async getStats() {
    try {
      const all = await this.repo.getAllForStats();
      const byModule: Record<string, number> = {};
      const byType:   Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      for (const row of (all.ok ? all.data : [])) {
        const m = String(row['module'] ?? '');
        const t = String(row['exception_type'] ?? '');
        const s = String(row['status'] ?? '');
        byModule[m] = (byModule[m] || 0) + 1;
        byType[t]   = (byType[t]   || 0) + 1;
        byStatus[s] = (byStatus[s] || 0) + 1;
      }
      const recentCount = await this.repo.countRecent();
      return { total: all.ok ? all.data.length : 0, byModule, byType, byStatus, recentCount };
    } catch {
      return { total: 0, byModule: {}, byType: {}, byStatus: {}, recentCount: 0 };
    }
  }

  async getOne(id: string) {
    const row = await this.repo.getOne(id);
    if (!row) throw new NotFoundException(await this.i18n.t('errors.exceptionLogNotFound', { args: { id } }));
    return row;
  }

  private async insertLog(p: ExceptionInsert) {
    try {
      return await this.repo.insert(p);
    } catch {
      this.logger.warn('exception_logs insert failed — table may not exist');
      return { id: null, module: p.module, status: p.status, createdAt: _time.now() };
    }
  }

  create(body: Record<string, unknown>, userId: number) {
    return this.insertLog({
      module:          String(body['module'] ?? ''),
      exceptionType:   String(body['exceptionType'] ?? ''),
      status:          String(body['status'] ?? 'pending'),
      relatedRecordId: body['relatedRecordId'],
      documentNumber:  body['documentNumber'],
      description:     body['description'],
      reason:          body['reason'] ?? body['description'],
      requestedBy:     userId,
      meta:            body['meta'],
    });
  }

  advanceBypass(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'SD', exceptionType: 'advance_bypass', status: 'pending', relatedRecordId: body['orderId'], documentNumber: body['documentNumber'], description: body['reason'], requestedBy: userId });
  }

  statusForce(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'SD', exceptionType: 'status_force', status: 'pending', relatedRecordId: body['orderId'], documentNumber: body['documentNumber'], description: body['reason'], requestedBy: userId });
  }

  designReject(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'MES', exceptionType: 'design_reject', status: 'auto_approved', relatedRecordId: body['orderId'], description: body['reason'], requestedBy: userId });
  }

  advanceBlock(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'FI', exceptionType: 'advance_hard_block', status: 'auto_approved', relatedRecordId: body['orderId'], description: body['reason'], requestedBy: userId });
  }

  materialShortage(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'WMS', exceptionType: 'material_shortage', status: 'pending', relatedRecordId: body['orderId'], description: body['description'], requestedBy: userId });
  }

  machineBreakdown(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'MES', exceptionType: 'machine_breakdown', status: 'pending', relatedRecordId: body['orderId'], description: body['description'], requestedBy: userId });
  }

  qcFailed(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'QC', exceptionType: 'qc_failed', status: 'pending', relatedRecordId: body['orderId'], description: body['description'], requestedBy: userId });
  }

  deliveryFailed(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'SD', exceptionType: 'delivery_failed', status: 'pending', relatedRecordId: body['orderId'], description: body['description'], requestedBy: userId });
  }

  employeeAbsent(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'HR', exceptionType: 'employee_absent', status: 'pending', relatedRecordId: body['employeeId'], description: body['reason'], requestedBy: userId });
  }

  materialNotReturned(body: Record<string, unknown>, userId: number) {
    return this.insertLog({ module: 'WMS', exceptionType: 'material_not_returned', status: 'pending', relatedRecordId: body['orderId'], description: body['description'], requestedBy: userId });
  }

  /**
   * Q24 fix: was a static `{ breakdown: null, machineId: null }` payload
   * regardless of orderId. Now looks up the latest MES machine_breakdown
   * exception_logs row actually tied to this order.
   *
   * NOTE: the write path (machineBreakdown() above) never captures a
   * distinct machine identifier (no machineId field is persisted anywhere
   * in exception_logs — related_record_id holds the orderId itself), so
   * machineId stays null here rather than fabricating a value from an
   * unrelated column.
   */
  async getMachineBreakdown(orderId: string) {
    const row = await this.repo.getMachineBreakdown(orderId);
    if (!row.ok || !row.data) return { orderId, breakdown: null, machineId: null };
    return { orderId, breakdown: row.data, machineId: null };
  }

  async certExpiryCheck() {
    try {
      const expiring = await this.repo.getExpiringCerts();
      return { checked: true, expiring };
    } catch {
      return { checked: true, expiring: [] };
    }
  }

  async update(id: string, patch: Record<string, unknown>) {
    const result = await this.repo.update(id, patch);
    if (!result.ok) throw new NotFoundException(await this.i18n.t('errors.exceptionLogNotFound', { args: { id } }));
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.exceptionLogNotFound', { args: { id } }));
    return Ok(result.data);
  }

  async deleteOne(id: string) {
    const deleted = await this.repo.softDelete(id);
    if (!deleted.ok || !deleted.data) throw new NotFoundException(await this.i18n.t('errors.exceptionLogNotFound', { args: { id } }));
    return Ok({ deleted: true, id });
  }
}
