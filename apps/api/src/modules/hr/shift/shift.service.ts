import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

import { HrV2Events } from '../events/hr-v2-events';
import { Result, safeCall } from '@common/result';
import { ShiftRepository } from './shift.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: ShiftRepository,
  ) {}

  async assignShift(dto: {
    employeeId: number;
    shiftDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    return safeCall(async () => {
      const row = await this.repo.assignShift(dto);
      this.eventEmitter.emit(HrV2Events.SHIFT_ASSIGNED, {
        employeeId: dto.employeeId,
        shiftDate: dto.shiftDate,
        shiftType: dto.shiftType,
      });
      return row;
    });
  }

  async requestSwap(dto: {
    fromEmployeeId: number;
    toEmployeeId: number;
    fromShiftId: number;
    reason: string;
  }) {
    return safeCall(async () => {
      const fromShift = await this.repo.findShiftById(dto.fromShiftId);
      if (!fromShift || !fromShift.ok || !fromShift.data) throw new BadRequestException('Shift topilmadi');
      if (fromShift.data.employee_id !== dto.fromEmployeeId) {
        throw new BadRequestException('Bu shift siz uchun emas');
      }
      const hasLeave = await this.repo.checkLeaveConflict(dto.toEmployeeId, fromShift.data.shift_date);
      if (hasLeave) throw new BadRequestException("Xodim shu kunda ta'tilda");
      const swapMeta = JSON.stringify({ reason: dto.reason, to_employee_id: dto.toEmployeeId });
      await this.repo.updateShiftStatus(dto.fromShiftId, 'swap_pending', swapMeta);
      this.eventEmitter.emit(HrV2Events.SHIFT_SWAP_REQUESTED, {
        fromEmployeeId: dto.fromEmployeeId,
        toEmployeeId: dto.toEmployeeId,
        fromShiftId: dto.fromShiftId,
        reason: dto.reason,
      });
      return { success: true, fromShiftId: dto.fromShiftId };
    });
  }

  async approveSwap(shiftId: number) {
    return safeCall(async () => {
      const fromShift = await this.repo.findSwapPendingShift(shiftId);
      if (!fromShift || !fromShift.ok || !fromShift.data) throw new BadRequestException("Swap so'rov topilmadi yoki allaqachon tasdiqlangan");
      let toEmployeeId: number | null = null;
      try {
        const meta = typeof fromShift.data.notes === 'string' ? JSON.parse(fromShift.data.notes) : fromShift.data.notes;
        toEmployeeId = meta?.to_employee_id ?? null;
      } catch {
        // notes may not be JSON — treat as no target
      }
      if (toEmployeeId) {
        const toShift = await this.repo.findEmployeeShiftOnDate(toEmployeeId, fromShift.data.shift_date);
        if (toShift && toShift.ok && toShift.data) {
          await this.repo.swapEmployees(shiftId, toEmployeeId, Number(toShift.data.id), fromShift.data.employee_id);
        } else {
          await this.repo.moveShiftToEmployee(shiftId, toEmployeeId);
        }
      } else {
        await this.repo.clearShiftPending(shiftId);
      }
      this.eventEmitter.emit(HrV2Events.SHIFT_SWAP_APPROVED, {
        shiftId,
        fromEmployeeId: fromShift.data.employee_id,
        toEmployeeId,
      });
      return { success: true, shiftId, fromEmployeeId: fromShift.data.employee_id, toEmployeeId };
    });
  }

  async getSchedule(params: { employeeId?: number; departmentId?: number; weekStart?: string }) {
    // MUHIM: repo `Result<Row[]>` qaytaradi — qayta `safeCall` bilan o'rash double-wrap qiladi
    // (frontend `{ok, data: {ok, data: [...]}}` oladi, `for(...of)` ishlamaydi).
    const weekStart = params.weekStart || _time.now().toISOString().split('T')[0];
    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * MS_PER_DAY).toISOString().split('T')[0];
    return this.repo.getSchedule(weekStart, weekEnd, params.employeeId, params.departmentId);
  }

  async getSwapRequests() {
    return safeCall(async () => {
      const rows = await this.repo.getSwapRequests();
      return (Array.isArray(rows) ? rows : []).map((r) => {
        let meta: Record<string, unknown> = {};
        try { meta = typeof r.notes === 'string' ? JSON.parse(r.notes) : {}; } catch { /* skip */ }
        return { ...r, reason: meta.reason, to_employee_id: meta.to_employee_id };
      });
    });
  }

  async deleteShift(id: number) {
    return safeCall(async () => {
      await this.repo.deleteShift(id);
      return { success: true, deleted: id };
    });
  }

  @Cron('*/30 5-10 * * 1-6')
  async sendShiftReminders() {
    try {
      const now = _time.now();
      const todayStr = now.toISOString().split('T')[0];
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const minMinutes = nowMinutes + 45;
      const maxMinutes = nowMinutes + 75;
      const rows = await this.repo.getUpcomingShifts(todayStr, minMinutes, maxMinutes);
      for (const shift of (rows.ok ? rows.data : [])) {
        this.eventEmitter.emit(HrV2Events.SHIFT_REMINDER, {
          employeeId: shift.employee_id,
          shiftType: shift.shift_type,
          startTime: shift.start_time,
          date: todayStr,
        });
      }
      if (rows.ok && rows.data.length > 0) {
        this.logger.log(`Shift reminders sent: ${rows.data.length} employees (window: ${minMinutes}-${maxMinutes} min from now)`);
      }
    } catch (err) {
      this.logger.error('sendShiftReminders error', errMsg(err));
    }
  }

  async findEmployeeByUserId(userId: string): Promise<Result<number | undefined>> {
    return this.repo.findEmployeeByUserId(userId);
  }

  async findShiftByEmployeeAndDate(employeeId: number, shiftDate: string): Promise<Result<number | undefined>> {
    return this.repo.findShiftByEmployeeAndDate(employeeId, shiftDate);
  }
}
