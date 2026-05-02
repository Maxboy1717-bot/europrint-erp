import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { PipRepository } from './pip.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class PipService {
  private readonly logger = new Logger(PipService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: PipRepository,
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
    return safeCall(async () => {
      const durationDays = dto.durationDays || 30;
      const today = _time.now();
      const startDate = dto.startDate || today.toISOString().split('T')[0];
      const endDate = dto.endDate || new Date(today.getTime() + durationDays * MS_PER_DAY).toISOString().split('T')[0];
      const goals = dto.goals || '';

      const row = await this.repo.createPip({ employeeId: dto.employeeId, createdBy: dto.createdBy, supervisorId: dto.supervisorId, durationDays, startDate, endDate, goals, successCriteria: dto.successCriteria });

      const rowData = (row?.ok ? row.data as { id?: number } : {});
      this.eventEmitter.emit(HrV2Events.PIP_STARTED, {
        employeeId: dto.employeeId,
        pipId: rowData?.id,
        supervisorId: dto.supervisorId,
      });

      return row;
    });
  }

  async addProgressUpdate(pipId: number, dto: {
    updatedBy: number;
    notes: string;
    status?: string;
  }) {
    return safeCall(async () => {
      const status = dto.status || 'on_track';
      const row = await this.repo.addProgressUpdate(pipId, dto.updatedBy, dto.notes, status);

      const pip = await this.repo.getPip(pipId);
      if (pip.ok && pip.data) {
        this.eventEmitter.emit(HrV2Events.PIP_PROGRESS_UPDATED, {
          pipId,
          employeeId: pip.data.employee_id,
          status: dto.status,
        });

        if (dto.status === 'completed') {
          await this.repo.markCompleted(pipId);
          this.eventEmitter.emit(HrV2Events.PIP_COMPLETED, { pipId, employeeId: pip.data.employee_id });
        } else if (dto.status === 'failed') {
          await this.repo.markFailed(pipId);
          this.eventEmitter.emit(HrV2Events.PIP_FAILED, { pipId, employeeId: pip.data.employee_id });
        }
      }

      return row;
    });
  }

  async acknowledge(pipId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const row = await this.repo.acknowledge(pipId);
      if (!row) throw new NotFoundException(`PIP #${pipId} not found`);
      return row;
    });
  }

  async getById(pipId: number) {
    return safeCall(async () => {
      const pip = await this.repo.getByIdWithEmployee(pipId);
      if (!pip || !pip.ok || !pip.data) throw new NotFoundException(`PIP #${pipId} not found`);
      pip.data.progress_updates = await this.repo.getProgressUpdates(pipId);
      return pip;
    });
  }

  async getByEmployee(employeeId: number) {
    return safeCall(async () => {
      const rowsR = await this.repo.getByEmployee(employeeId);
      const rows = (rowsR.ok ? rowsR.data as Record<string, unknown>[] : []);
      for (const pip of rows) {
        pip['progress_updates'] = await this.repo.getProgressUpdates(pip['id'] as number);
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
      for (const pip of (activePips.ok ? activePips.data : [])) {
        this.eventEmitter.emit(HrV2Events.PIP_PROGRESS_UPDATED, {
          pipId: pip.id,
          employeeId: pip.employee_id,
          reminder: true,
          supervisorId: pip.supervisor_id,
        });
      }
      this.logger.log(`✅ PIP weekly reminders: ${activePips.ok ? activePips.data.length : 0} active PIPs`);
    } catch (err) {
      this.logger.error('sendWeeklyPipReminders error', errMsg(err));
    }
  }

  @Cron('0 8 * * *')
  async checkOverduePips() {
    try {
      const today = _time.now().toISOString().split('T')[0];
      const rowsR = await this.repo.getOverduePips(today);
      const rows = (rowsR.ok ? rowsR.data as { id: number; employee_id: number }[] : []);
      for (const pip of rows) {
        this.eventEmitter.emit(HrV2Events.PIP_FAILED, {
          pipId: pip.id,
          employeeId: pip.employee_id,
          reason: 'overdue',
        });
      }
      this.logger.log(`✅ CheckOverduePips: ${rows.length} overdue PIPs found`);
    } catch (err) {
      this.logger.error('checkOverduePips error', errMsg(err));
    }
  }
}
