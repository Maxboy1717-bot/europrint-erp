import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { Result, Ok, Err, AppErr, safeCall } from '@common/result';
import { PipRepository } from './pip.repository';
import {
  PipWorkflowService,
  type PipStatus,
} from './pip-workflow.service';

@Injectable()
export class PipService {
  private readonly logger = new Logger(PipService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: PipRepository,
    private readonly workflow: PipWorkflowService,
  ) {}

  async createPip(dto: {
    employeeId: number;
    createdBy: number;
    supervisorId?: number;
    durationDays?: number;
    startDate?: string;
    endDate?: string;
    goals?: string;
    successCriteria?: string;
  }) {
    const planR = this.workflow.buildPlan({
      employeeId:      dto.employeeId,
      createdBy:       dto.createdBy,
      supervisorId:    dto.supervisorId,
      durationDays:    dto.durationDays,
      startDate:       dto.startDate,
      endDate:         dto.endDate,
      goals:           dto.goals,
      successCriteria: dto.successCriteria,
    }, _time.now());
    if (!planR.ok) return planR;
    const plan = planR.data;

    const row = await this.repo.createPip(plan);
    if (!row.ok) return row;
    const rowData = (row.data as { id?: number }) ?? {};
    this.eventEmitter.emit(HrV2Events.PIP_STARTED, {
      employeeId:   dto.employeeId,
      pipId:        rowData?.id,
      supervisorId: dto.supervisorId,
    });
    return row;
  }

  async addProgressUpdate(pipId: number, dto: {
    updatedBy: number;
    notes: string;
    status?: string;
  }) {
    const statusR = this.workflow.validateProgressStatus(dto.status);
    if (!statusR.ok) return statusR;
    const progressStatus = statusR.data;

    const pip = await this.repo.getPip(pipId);
    if (!pip.ok) return pip;
    if (!pip.data) return Err(AppErr('NOT_FOUND', `PIP #${pipId} topilmadi`));
    const currentStatus = String((pip.data as Record<string, unknown>)['status'] ?? 'active') as PipStatus;
    if (currentStatus !== 'active') {
      return Err(AppErr('INVALID_TRANSITION', `Faqat active PIP ga progress qo'shish mumkin (joriy: ${currentStatus})`));
    }

    const row = await this.repo.addProgressUpdate(pipId, dto.updatedBy, dto.notes, progressStatus);
    if (!row.ok) return row;

    const employeeId = Number((pip.data as Record<string, unknown>)['employee_id'] ?? 0);
    this.eventEmitter.emit(HrV2Events.PIP_PROGRESS_UPDATED, {
      pipId,
      employeeId,
      status: progressStatus,
    });

    const decision = this.workflow.outcomeFromProgress(progressStatus);
    if (decision.outcome === 'PASSED') {
      await this.repo.markCompleted(pipId);
      this.eventEmitter.emit(HrV2Events.PIP_COMPLETED, { pipId, employeeId });
    } else if (decision.outcome === 'FAILED') {
      await this.repo.markFailed(pipId);
      this.eventEmitter.emit(HrV2Events.PIP_FAILED, { pipId, employeeId });
    }
    return row;
  }

  async acknowledge(pipId: number): Promise<Result<object>> {
    const pip = await this.repo.getPip(pipId);
    if (!pip.ok) return pip;
    if (!pip.data) return Err(AppErr('NOT_FOUND', `PIP #${pipId} topilmadi`));
    const row = await this.repo.acknowledge(pipId);
    return row as Result<object>;
  }

  async cancelPip(pipId: number, reason?: string): Promise<Result<object>> {
    const pip = await this.repo.getPip(pipId);
    if (!pip.ok) return pip;
    if (!pip.data) return Err(AppErr('NOT_FOUND', `PIP #${pipId} topilmadi`));
    const currentStatus = String((pip.data as Record<string, unknown>)['status'] ?? 'active') as PipStatus;
    const trans = this.workflow.assertTransition(currentStatus, 'cancelled');
    if (!trans.ok) return trans;

    const result = await this.repo.cancel(pipId);
    if (result.ok) {
      this.logger.log(`PIP #${pipId} bekor qilindi: ${reason ?? '-'}`);
    }
    return result as Result<object>;
  }

  async extendPip(pipId: number, extraDays: number): Promise<Result<object>> {
    if (!Number.isInteger(extraDays) || extraDays <= 0 || extraDays > 90) {
      return Err(AppErr('VALIDATION', "extraDays 1..90 oraligida bo'lishi kerak"));
    }
    const pip = await this.repo.getPip(pipId);
    if (!pip.ok) return pip;
    if (!pip.data) return Err(AppErr('NOT_FOUND', `PIP #${pipId} topilmadi`));
    const currentStatus = String((pip.data as Record<string, unknown>)['status'] ?? 'active') as PipStatus;
    if (currentStatus !== 'active') {
      return Err(AppErr('INVALID_TRANSITION', `Faqat active PIP ni uzaytirish mumkin (joriy: ${currentStatus})`));
    }
    const oldEnd = String((pip.data as Record<string, unknown>)['end_date'] ?? '');
    const oldTs  = Date.parse(oldEnd);
    if (!Number.isFinite(oldTs)) {
      return Err(AppErr('INTERNAL', `PIP end_date noto'g'ri formatda: ${oldEnd}`));
    }
    const newEnd = new Date(oldTs + extraDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    return this.repo.updateEndDate(pipId, newEnd) as Promise<Result<object>>;
  }

  /**
   * Finalize a PIP plan with explicit outcome (PASSED / FAILED).
   * Frontend calls `PATCH /api/hr-v2/pip/:id/complete { result: 'PASSED'|'FAILED' }`.
   */
  async completePip(pipId: number, outcome: 'PASSED' | 'FAILED'): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const pipR = await this.repo.getPip(pipId);
      if (!pipR.ok || !pipR.data) throw new NotFoundException(`PIP #${pipId} not found`);

      if (outcome === 'PASSED') {
        await this.repo.markCompleted(pipId);
      } else {
        await this.repo.markFailed(pipId);
      }

      const pip = pipR.data as { employee_id?: number };
      this.eventEmitter.emit(
        outcome === 'PASSED' ? HrV2Events.PIP_COMPLETED : HrV2Events.PIP_FAILED,
        { pipId, employeeId: pip.employee_id, outcome, source: 'manual_complete' },
      );

      const updated = await this.repo.getPip(pipId);
      return updated.ok && updated.data ? updated.data : { id: pipId, outcome };
    });
  }

  async getById(pipId: number) {
    return safeCall(async () => {
      const pip = await this.repo.getByIdWithEmployee(pipId);
      if (!pip || !pip.ok || !pip.data) {
        throw new Error(`PIP #${pipId} topilmadi`);
      }
      const progressR = await this.repo.getProgressUpdates(pipId);
      pip.data.progress_updates = progressR.ok ? progressR.data : [];
      return pip.data;
    });
  }

  async getByEmployee(employeeId: number) {
    return safeCall(async () => {
      const rowsR = await this.repo.getByEmployee(employeeId);
      const rows = (rowsR.ok ? rowsR.data as Record<string, unknown>[] : []);
      for (const pip of rows) {
        const r = await this.repo.getProgressUpdates(pip['id'] as number);
        pip['progress_updates'] = r.ok ? r.data : [];
      }
      return rows;
    });
  }

  async getActivePips() {
    return this.repo.getActivePips();
  }

  async listAll() {
    return this.repo.listAll();
  }

  @Cron('0 9 * * 1')
  async sendWeeklyPipReminders() {
    try {
      const activePips = await this.repo.getActivePips();
      const rows = activePips.ok ? activePips.data : [];
      for (const pip of rows) {
        this.eventEmitter.emit(HrV2Events.PIP_PROGRESS_UPDATED, {
          pipId: pip.id,
          employeeId: pip.employee_id,
          reminder: true,
          supervisorId: pip.supervisor_id,
        });
      }
      this.logger.log(`PIP weekly reminders: ${rows.length} active PIPs`);
    } catch (err) {
      this.logger.error('sendWeeklyPipReminders error', errMsg(err));
    }
  }

  @Cron('0 8 * * *')
  async checkOverduePips() {
    try {
      const today = _time.now().toISOString().split('T')[0]!;
      const rowsR = await this.repo.getOverduePips(today);
      const rows = (rowsR.ok ? rowsR.data as { id: number; employee_id: number }[] : []);
      for (const pip of rows) {
        this.eventEmitter.emit(HrV2Events.PIP_FAILED, {
          pipId: pip.id,
          employeeId: pip.employee_id,
          reason: 'overdue',
        });
      }
      this.logger.log(`CheckOverduePips: ${rows.length} overdue PIPs found`);
    } catch (err) {
      this.logger.error('checkOverduePips error', errMsg(err));
    }
  }
}
