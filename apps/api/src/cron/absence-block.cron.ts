/**
 * @module absence-block.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelegramService } from '../telegram/telegram.service';
import { CronStatusService } from './cron-status.service';
import { AbsenceBlockRepository, AbsentEmployeeRow, HrManagerRow } from './repositories/absence-block.repository';
import { extractDrizzleError } from '@common/utils/drizzle-error.util';

@Injectable()
export class AbsenceBlockCron {
  private readonly logger = new Logger(AbsenceBlockCron.name);

  constructor(
    @Optional() private readonly telegram: TelegramService,
    private readonly cronStatus: CronStatusService,
    private readonly absenceRepo: AbsenceBlockRepository,
    private readonly events: EventEmitter2,
  ) {}

  @Cron('0 10 * * *')
  async blockAbsentEmployees(): Promise<void> {
    const jobName = 'AbsenceBlockCron';
    try {
      const [day1, day2, day3] = await Promise.all([
        this.absenceRepo.findAbsentEmployees1Day(),
        this.absenceRepo.findAbsentEmployees2Day(),
        this.absenceRepo.findAbsentEmployeesToBlock(),
      ]);

      // Pre-fetch HR contacts once — reused by both escalate and block steps
      const [hrManagers, directors] = (day2.length > 0 || day3.length > 0)
        ? await Promise.all([
            this.absenceRepo.findHrManagersWithTelegram(),
            this.absenceRepo.findDirectorsWithTelegram(),
          ])
        : [[], []] as [HrManagerRow[], HrManagerRow[]];

      await this._warnDay1(day1);
      await this._escalateDay2(day2, hrManagers);
      const blockedCount = await this._blockDay3(day3, hrManagers, directors);

      this.logger.log(
        `AbsenceBlockCron: warned=${day1.length} escalated=${day2.length} blocked=${blockedCount}`,
      );
      this.cronStatus.recordSuccess(jobName);
    } catch (err) {
      const detail = extractDrizzleError(err);
      this.logger.error('AbsenceBlockCron error: %s', detail);
      this.cronStatus.recordFailure(jobName, detail);
    }
  }

  private async _warnDay1(employees: AbsentEmployeeRow[]): Promise<void> {
    for (const emp of employees) {
      try {
        if (this.telegram && emp.telegram_chat_id) {
          const msg =
            `⚠️ Xurmatli ${emp.first_name} ${emp.last_name},\n\n` +
            `Bugun ish joyingizga kelmadingiz (1-ogohlantirish).\n` +
            `Ertaga ham kelmasangiz, ERP kirishingiz bloklanadi.\n` +
            `HR bo'limiga murojaat qiling.`;
          await this.telegram.sendMessage(emp.telegram_chat_id, msg).catch((e) =>
            this.logger.warn(`AbsenceBlockCron day1 notify emp=${emp.employee_id}: ${String(e)}`),
          );
        }
        this.events.emit('employee.absence.day1', { employee_id: emp.employee_id });
      } catch (e) {
        this.logger.warn(`AbsenceBlockCron _warnDay1 emp=${emp.employee_id}: ${String(e)}`);
      }
    }
  }

  private async _escalateDay2(
    employees: AbsentEmployeeRow[],
    hrManagers: HrManagerRow[],
  ): Promise<void> {
    for (const emp of employees) {
      try {
        if (this.telegram && emp.telegram_chat_id) {
          const msg =
            `🚨 Xurmatli ${emp.first_name} ${emp.last_name},\n\n` +
            `Ketma-ket 2 kun kelmadingiz — OXIRGI OGOHLANTIRISH.\n` +
            `Ertaga ham kelmasangiz, ERP kirishingiz avtomatik bloklanadi.\n` +
            `Zudlik bilan HR bilan bog'laning.`;
          await this.telegram.sendMessage(emp.telegram_chat_id, msg).catch((e) =>
            this.logger.warn(`AbsenceBlockCron day2 emp=${emp.employee_id}: ${String(e)}`),
          );
        }
        for (const hr of hrManagers) {
          if (this.telegram) {
            const hrMsg =
              `⚠️ 2-kun: ${emp.first_name} ${emp.last_name} ` +
              `(${emp.department_name ?? 'bo\'lim noma\'lum'}) 2 kun kelmadi.`;
            await this.telegram.sendMessage(hr.telegram_chat_id, hrMsg).catch((e) =>
              this.logger.warn(`AbsenceBlockCron day2 HR notify: ${String(e)}`),
            );
          }
        }
        this.events.emit('employee.absence.day2', { employee_id: emp.employee_id });
      } catch (e) {
        this.logger.warn(`AbsenceBlockCron _escalateDay2 emp=${emp.employee_id}: ${String(e)}`);
      }
    }
  }

  private async _blockDay3(
    employees: AbsentEmployeeRow[],
    hrManagers: HrManagerRow[],
    directors: HrManagerRow[],
  ): Promise<number> {
    const blockReason = "Avtomatik bloklash: 3 kun ketma-ket yo'qlik";
    const deptLeadCache = new Map<number, HrManagerRow | null>();

    let blockedCount = 0;
    const blockedNames: string[] = [];

    for (const emp of employees) {
      try {
        await this.absenceRepo.deactivateExistingBlocks(emp.employee_id);
        await this.absenceRepo.insertEmployeeBlock(emp.employee_id, blockReason);
        await this.absenceRepo.blockEmployee(emp.employee_id, blockReason);
        await this.absenceRepo.markAbsenceAutoBlocked(emp.employee_id);

        if (emp.user_id !== null) {
          await this.absenceRepo.disableUserAccount(emp.user_id).catch((e) =>
            this.logger.warn(`AbsenceBlockCron disableUser emp=${emp.employee_id}: ${String(e)}`),
          );
        }

        blockedCount++;
        blockedNames.push(
          `• ${emp.first_name} ${emp.last_name} (${emp.department_name ?? 'bo\'lim noma\'lum'}) — ${emp.consecutive_day_count} kun`,
        );

        if (this.telegram && emp.telegram_chat_id) {
          const msg =
            `⛔ ${emp.first_name} ${emp.last_name}, ERP kirishingiz bloklandi.\n` +
            `Sabab: 3 kun ketma-ket sababsiz yo'qlik.\n` +
            `Blokdan chiqish uchun HR bilan bog'laning.`;
          await this.telegram.sendMessage(emp.telegram_chat_id, msg).catch((e) =>
            this.logger.warn(`AbsenceBlockCron day3 emp notify emp=${emp.employee_id}: ${String(e)}`),
          );
        }

        if (emp.department_id !== null) {
          // Cache dept lead to avoid a DB round-trip per employee in the same dept
          let deptLead = deptLeadCache.get(emp.department_id);
          if (deptLead === undefined) {
            deptLead = await this.absenceRepo
              .findDepartmentLeadWithTelegram(emp.department_id)
              .catch((e) => { this.logger.warn(`AbsenceBlockCron deptLead lookup dept=${emp.department_id}: ${String(e)}`); return null; });
            deptLeadCache.set(emp.department_id, deptLead ?? null);
          }
          if (this.telegram && deptLead) {
            const deptMsg =
              `⛔ Xodim ${emp.first_name} ${emp.last_name} 3 kun kelmadi — ERP bloklandi.`;
            await this.telegram.sendMessage(deptLead.telegram_chat_id, deptMsg).catch((e) =>
              this.logger.warn(`AbsenceBlockCron deptLead notify: ${String(e)}`),
            );
          }
        }

        this.events.emit('employee.blocked', { employee_id: emp.employee_id, reason: blockReason, source: 'AbsenceBlockCron' });
        this.events.emit('access.chip.revoke',   { employee_id: emp.employee_id });
        this.events.emit('iot.attendance.block',  { employee_id: emp.employee_id });
        this.events.emit('email.account.disable', { employee_id: emp.employee_id });
      } catch (empErr) {
        this.logger.warn(`AbsenceBlockCron block failed emp=${emp.employee_id}: ${String(empErr)}`);
      }
    }

    if (blockedCount > 0) {
      const allRecipients = [...hrManagers, ...directors];
      await this._notifyHrBlock(blockedCount, blockedNames, allRecipients).catch((e) =>
        this.logger.warn(`AbsenceBlockCron HR notify: ${String(e)}`),
      );
    }

    return blockedCount;
  }

  private async _notifyHrBlock(
    blockedCount: number,
    names: string[],
    hrManagers: { telegram_chat_id: string }[],
  ): Promise<void> {
    const today = _time.now().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const message =
      `⛔ <b>Avtomatik Bloklash</b>\n\n` +
      `Sana: ${today}\n\n` +
      `<b>${blockedCount} xodim</b> 3 kun ketma-ket kelmagan:\n\n` +
      `${names.join('\n')}\n\n` +
      `Blokdan chiqarish uchun HR dalolatnoma tasdiqlatishi kerak.`;

    if (hrManagers.length === 0) {
      this.logger.warn('AbsenceBlockCron: no HR managers with Telegram');
      return;
    }
    for (const hr of hrManagers) {
      if (this.telegram) {
        await this.telegram.sendMessage(hr.telegram_chat_id, message).catch((e) =>
          this.logger.warn(`AbsenceBlockCron HR Telegram: ${String(e)}`),
        );
      }
    }
  }
}
