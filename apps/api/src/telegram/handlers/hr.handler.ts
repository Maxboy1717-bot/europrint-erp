/**
 * @module hr.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
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

  constructor(private telegramService: TelegramService) {}

  async onAttendanceMissing(alert: AttendanceAlert): Promise<void> {
    try {
      const text = `
❌ <b>Xodim Kelmadi</b>

👤 <b>Ism:</b> ${alert.employee_name}
🆔 <b>ID:</b> <code>${alert.employee_id}</code>
📅 <b>Bugun:</b> ${_time.now().toLocaleDateString('uz-UZ')}

Tezda bog'lanib olish kerak.
      `
      await this.telegramService.sendMessage(alert.hr_manager_chat_id, text)
      this.logger.log(`Attendance alert sent: ${alert.employee_id}`)
    } catch (err) {
      this.logger.error(`onAttendanceMissing error: ${String(err)}`)
    }
  }

  async onLeaveApproved(leave: LeaveApproval): Promise<void> {
    try {
      const text = `
✅ <b>Ta'til Tasdiqlandi!</b>

📅 <b>Boshlanishi:</b> ${leave.start_date}
📅 <b>Tugatilishi:</b> ${leave.end_date}
📊 <b>Kunlar:</b> ${leave.days} kun

Safrdan lazzat oling!
      `
      await this.telegramService.sendMessage(leave.employee_chat_id, text)
      this.logger.log(`Leave approved notified: ${leave.employee_id}`)
    } catch (err) {
      this.logger.error(`onLeaveApproved error: ${String(err)}`)
    }
  }

  async onBirthdayNotification(bday: BirthdayNotification): Promise<void> {
    try {
      const text = `
🎉 <b>Tug'ilgan Kun Tabriklaymiz!</b>

🎂 Siz bugun ${bday.employee_name} ning tug'ilgan kuniga yetdingiz!

Ko'p yoshli, baxt va samarali bo'ling!
      `
      await this.telegramService.sendMessage(bday.employee_chat_id, text)
      await this.telegramService.sendMessage(bday.manager_chat_id, text)
      this.logger.log(`Birthday notification sent: ${bday.employee_id}`)
    } catch (err) {
      this.logger.error(`onBirthdayNotification error: ${String(err)}`)
    }
  }

  async onSalaryReminder(reminder: SalaryReminder): Promise<void> {
    try {
      const text = `
💰 <b>Maosh To'lash Eslatmasi</b>

👥 <b>Xodimlar Soni:</b> ${reminder.total_employees} ta
📅 <b>To'lash Muddati:</b> 28-kun (bugun: 28)

Maosh hisob-kitobini tekshiring va to'lovni tasdiqlang.
HR Portal: ${process.env.HR_PORTAL_URL}
      `
      await this.telegramService.sendMessage(reminder.hr_manager_chat_id, text)
      this.logger.log('Salary reminder sent')
    } catch (err) {
      this.logger.error(`onSalaryReminder error: ${String(err)}`)
    }
  }
}
