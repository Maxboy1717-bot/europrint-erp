import { Injectable, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IHrPayrollRepository, HR_PAYROLL_REPO } from './i-hr-payroll.repo';
import {
  PayrollClosureService,
  type PayrollRow as DomainPayrollRow,
  type PayrollPeriod as DomainPayrollPeriod,
} from './payroll-closure.service';
import { safeCall, Result, AppError, Ok, Err, AppErr } from '@common/result';
import { PayrollRecord } from '../domain/aggregates/payroll-record.aggregate';
import type { DomainEvent } from '@shared/domain/domain-event';

type Row = Record<string, unknown>;

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @Inject(HR_PAYROLL_REPO) private readonly hrPayrollRepo: IHrPayrollRepository,
    private readonly closure: PayrollClosureService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10, userId, changeType, fromDate, toDate } = query;
      const offset = (Number(page) - 1) * Number(limit);
      const result = await this.hrPayrollRepo.findAll({
        limit: Number(limit),
        offset,
        userId:     userId     !== undefined ? Number(userId) : undefined,
        changeType: changeType !== undefined ? String(changeType) : undefined,
        fromDate:   fromDate   !== undefined ? String(fromDate)   : undefined,
        toDate:     toDate     !== undefined ? String(toDate)     : undefined,
      });
      if (!result.ok) throw new InternalServerErrorException(result.error);
      const { data, count: total } = result.data;
      return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
    });
  }

  async create(dto: Record<string, unknown>) {
    return safeCall(async () => {
      const result = await this.hrPayrollRepo.create(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  /**
   * Close a payroll period: aggregate rows, mark period closed, mark rows posted,
   * build & post the balanced GL journal entries, emit PAYROLL_CLOSED event.
   */
  async closePeriod(
    periodId: number,
  ): Promise<Result<{ period: Row; totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }; gl: { inserted: number } }>> {
    const periodR = await this.hrPayrollRepo.findPeriodById(periodId);
    if (!periodR.ok) return periodR as unknown as Result<never>;
    if (!periodR.data) return Err(AppErr('NOT_FOUND', `Payroll davri #${periodId} topilmadi`));

    const period = this.normalizePeriod(periodR.data);
    const datesR = this.closure.validatePeriodDates(period);
    if (!datesR.ok) return datesR as unknown as Result<never>;

    const rowsR = await this.hrPayrollRepo.listRowsByPeriod(periodId);
    if (!rowsR.ok) return rowsR as unknown as Result<never>;
    const rows = (Array.isArray(rowsR.data) ? rowsR.data : []).map((r) => this.normalizeRow(r));

    const canClose = this.closure.canClose(period, rows);
    if (!canClose.ok) return canClose as unknown as Result<never>;
    const totals = canClose.data.totals;

    const journalR = this.closure.buildJournal(totals, period.periodName ?? `#${periodId}`);
    if (!journalR.ok) return journalR as unknown as Result<never>;

    const closedR = await this.hrPayrollRepo.markPeriodClosed(periodId, totals);
    if (!closedR.ok) return closedR as unknown as Result<never>;

    const postedR = await this.hrPayrollRepo.markRowsPosted(periodId);
    if (!postedR.ok) {
      this.logger.warn(`markRowsPosted xatolik: ${postedR.error.message}`);
    }

    const glR = await this.hrPayrollRepo.insertGlJournalLines(periodId, journalR.data);
    if (!glR.ok) return glR as unknown as Result<never>;

    // Per-employee domain events: hydrate a PayrollRecord aggregate for each
    // row, transition it to `posted`, drain events and forward through the
    // event bus. Additive — the legacy period-level emit below stays.
    const recordEvents = this.emitPayrollRecordCompletions(periodId, rows);

    this.eventEmitter.emit('payroll.period.closed', {
      periodId,
      totals,
      glLines: journalR.data,
      recordEventCount: recordEvents,
    });

    return Ok({
      period: closedR.data as Row,
      totals,
      gl: glR.data,
    });
  }

  // ─── helpers ────────────────────────────────────────────────────────────
  private normalizePeriod(raw: Row): DomainPayrollPeriod {
    return {
      id:               Number(raw['id'] ?? 0),
      status:           String(raw['status'] ?? 'open'),
      periodStartDate:  this.toIsoDateString(raw['periodStartDate'] ?? raw['period_start_date']),
      periodEndDate:    this.toIsoDateString(raw['periodEndDate']   ?? raw['period_end_date']),
      periodName:       (raw['periodName'] ?? raw['period_name']) as string | undefined,
    };
  }

  private normalizeRow(raw: Row): DomainPayrollRow {
    return {
      id:          Number(raw['id'] ?? 0),
      employeeId:  (raw['employeeId'] ?? raw['employee_id']) as string | number,
      baseSalary:  Number(raw['baseSalary']  ?? raw['base_salary']  ?? 0),
      bonus:       Number(raw['bonus']       ?? 0),
      deductions:  Number(raw['deductions']  ?? 0),
      netPay:      Number(raw['netPay']      ?? raw['net_pay']      ?? 0),
      status:      String(raw['status']      ?? 'draft'),
    };
  }

  private toIsoDateString(v: unknown): string | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString().split('T')[0];
    return String(v);
  }

  /**
   * Hydrate one PayrollRecord aggregate per closure row, call completeRun(),
   * and forward the resulting domain events through EventEmitter2. Returns
   * the count of events emitted. Failures are logged and skipped — payroll
   * closure must not be blocked by a downstream listener.
   */
  private emitPayrollRecordCompletions(periodId: number, rows: DomainPayrollRow[]): number {
    let emitted = 0;
    const now = new Date();
    for (const row of rows) {
      const employeeId = Number(row.employeeId);
      if (!Number.isFinite(employeeId)) {
        this.logger.warn(`Payroll row id=${row.id} da noto'g'ri employeeId — domain event skip`);
        continue;
      }
      // Row pre-`markRowsPosted` state — `canClose` already filtered out
      // 'draft' rows, so anything not in our state enum is normalized to
      // 'approved' (pending posting). The aggregate's completeRun then
      // performs the draft|approved → posted transition + emits the event.
      const status: 'draft' | 'approved' | 'posted' =
        row.status === 'posted' ? 'posted'
        : row.status === 'draft' ? 'draft'
        : 'approved';
      const recordR = PayrollRecord.fromProps({
        id:           row.id,
        employeeId,
        periodId,
        gross:        row.baseSalary + row.bonus,
        other:        row.deductions,
        status,
        createdAt:    now,
        updatedAt:    now,
      });
      if (!recordR.ok) {
        this.logger.warn(`PayrollRecord hydrate xato (row ${row.id}): ${recordR.error.message}`);
        continue;
      }
      const completeR = recordR.data.completeRun();
      if (!completeR.ok) {
        this.logger.warn(`completeRun xato (row ${row.id}): ${completeR.error.message}`);
        continue;
      }
      for (const ev of recordR.data.getDomainEvents()) {
        this.eventEmitter.emit(this.eventNameFor(ev), ev);
        emitted++;
      }
      recordR.data.clearDomainEvents();
    }
    return emitted;
  }

  /** Map a domain event to its EventEmitter2 channel name (lowercased). */
  private eventNameFor(ev: DomainEvent): string {
    return `payroll.record.${ev.eventName.toLowerCase()}`;
  }
}
