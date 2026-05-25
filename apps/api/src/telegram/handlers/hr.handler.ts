/**
 * @module hr.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { TelegramService } from '../telegram.service'

interface AttendanceAlert {
  employee_id: string
  employee_name: string
  hr_manager_chat_id: string
}

interface LeaveApproval {
  employee_id: string
  employee_name: string
  start_date: string
  end_date: string
  days: number
  employee_chat_id: string
}

interface BirthdayNotification {
  employee_id: string
  employee_name: string
  employee_chat_id: string
  manager_chat_id: string
}

interface SalaryReminder {
  hr_manager_chat_id: string
  total_employees: number
}

@Injectable()
export class HrHandler {
  private readonly logger = new Logger(HrHandler.name)

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  async onAttendanceMissing(alert: AttendanceAlert): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.hr.attendanceMissing', {
        args: {
          employeeName: alert.employee_name,
          employeeId: alert.employee_id,
          today: _time.now().toLocaleDateString('uz-UZ'),
        },
      })
      await this.telegramService.sendMessage(alert.hr_manager_chat_id, text)
      this.logger.log(`Attendance alert sent: ${alert.employee_id}`)
    } catch (err) {
      this.logger.error(`onAttendanceMissing error: ${String(err)}`)
    }
  }

  async onLeaveApproved(leave: LeaveApproval): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.hr.leaveApproved', {
        args: {
          startDate: leave.start_date,
          endDate: leave.end_date,
          days: leave.days,
        },
      })
      await this.telegramService.sendMessage(leave.employee_chat_id, text)
      this.logger.log(`Leave approved notified: ${leave.employee_id}`)
    } catch (err) {
      this.logger.error(`onLeaveApproved error: ${String(err)}`)
    }
  }

  async onBirthdayNotification(bday: BirthdayNotification): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.hr.birthday', {
        args: { employeeName: bday.employee_name },
      })
      await this.telegramService.sendMessage(bday.employee_chat_id, text)
      await this.telegramService.sendMessage(bday.manager_chat_id, text)
      this.logger.log(`Birthday notification sent: ${bday.employee_id}`)
    } catch (err) {
      this.logger.error(`onBirthdayNotification error: ${String(err)}`)
    }
  }

  async onSalaryReminder(reminder: SalaryReminder): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.hr.salaryReminder', {
        args: {
          totalEmployees: reminder.total_employees,
          portalUrl: process.env.HR_PORTAL_URL ?? '',
        },
      })
      await this.telegramService.sendMessage(reminder.hr_manager_chat_id, text)
      this.logger.log('Salary reminder sent')
    } catch (err) {
      this.logger.error(`onSalaryReminder error: ${String(err)}`)
    }
  }
}
