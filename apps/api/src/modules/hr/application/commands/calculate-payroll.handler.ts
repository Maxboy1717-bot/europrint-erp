/**
 * @module calculate-payroll.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HR_REPO, IHrRepo } from '../../domain/repositories/i-hr.repo';
import {
  findUserIdByEmployee,
  hasAnyOrgAssignment,
} from '../../../compatibility/employees-org-assignment.helper';

// O'zbekiston mehnat qonuni (2024)
const INPS_RATE   = 0.08;   // 8%  — xodimdan ushlab qolinadi
const JSHD_RATE   = 0.12;   // 12% — ish beruvchi to'laydi

export class CalculatePayrollCommand {
  constructor(public readonly employeeId: number,
    public readonly period: string,          // YYYY-MM
    public readonly baseSalary: number,
    public readonly overtimeHours: number = 0,
    public readonly bonus: number = 0,
    public readonly otherDeductions: number = 0,
    public readonly calculatedBy: number = 0) {}
}

@CommandHandler(CalculatePayrollCommand)
export class CalculatePayrollHandler implements ICommandHandler<CalculatePayrollCommand> {
  private readonly logger = new Logger(CalculatePayrollHandler.name);

  constructor(
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CalculatePayrollCommand): Promise<Result<Record<string, unknown>>> {
      this.logger.debug(`Calculating payroll for employee ${command.employeeId}, period: ${command.period}`);

      // Biznes qoida: xodim org-structure'da biriktirilgan bo'lishi shart.
      // Aks holda — oylik bazaga kiritilmaydi (lavozim/funksiya yo'q).
      const userId = await findUserIdByEmployee(command.employeeId);
      if (userId === null) {
        return Err({
          code: 'BAD_REQUEST',
          message: `Xodim ID=${command.employeeId} uchun user yaratilmagan — oylik kiritilmaydi`,
        });
      }
      const isAssigned = await hasAnyOrgAssignment(userId);
      if (!isAssigned) {
        return Err({
          code: 'BAD_REQUEST',
          message: `Xodim ID=${command.employeeId} tashkiliy tuzilmaga biriktirilmagan — oylik kiritilmaydi. Avval xodim org-structure'da bo'limga assign qilinishi kerak.`,
        });
      }

      // INPS/JSHD hisob-kitobi
      const dailyRate = command.baseSalary / 22;
      const overtimePay = command.overtimeHours * (dailyRate / 8) * 1.5;
      const grossSalary = command.baseSalary + overtimePay + command.bonus;

      const inpsEmployee = grossSalary * INPS_RATE;
      const jshdEmployer = grossSalary * JSHD_RATE;
      const netSalary = grossSalary - inpsEmployee - command.otherDeductions;

      const periodStart = new Date(`${command.period}-01`);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

      const result = await this.hrRepo.savePayroll({
        employeeId: command.employeeId,
        periodStart,
        periodEnd,
        baseSalary: command.baseSalary,
        netSalary,
        bonus: command.bonus,
        otherDeductions: command.otherDeductions,
      });

      if (!result.ok) {
        return Err(result.error ?? 'Payroll save failed');
      }

      this.logger.log(
        `Payroll calculated - Employee: ${command.employeeId}, Gross: ${grossSalary}, Net: ${netSalary}, INPS: ${inpsEmployee}`,
      );

      this.eventEmitter.emit('hr.payroll.calculated', {
        employeeId: command.employeeId,
        period: command.period,
        grossSalary,
        netSalary,
        inpsEmployee,
        jshdEmployer,
        calculatedBy: command.calculatedBy,
        calculatedAt: _time.now(),
      });

      return {
        ok: true,
        data: {
          ...result.data,
          grossSalary,
          netSalary,
          inpsEmployee,
          jshdEmployer,
          period: command.period,
        },
      };
  }
}
