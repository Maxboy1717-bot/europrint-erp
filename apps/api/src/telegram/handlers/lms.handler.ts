/**
 * @module lms.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { TelegramService } from '../telegram.service'

interface Enrollment {
  id: string
  employee_id: string
  course_name: string
  employee_chat_id: string
  hr_chat_id: string
}

interface Certificate {
  id: string
  employee_id: string
  course_name: string
  expiry_date: string
  employee_chat_id: string
  hr_chat_id: string
  days_remaining: number
}

@Injectable()
export class LmsHandler {
  private readonly logger = new Logger(LmsHandler.name)

  constructor(private telegramService: TelegramService) {}

  async onCourseCompleted(enrollment: Enrollment): Promise<void> {
    try {
      const text = `
🎓 <b>Kurs Yakunlandi!</b>

📚 <b>Kurs Nomi:</b> ${enrollment.course_name}
✅ <b>Status:</b> Muvaffaqiyatli tugallandi

Sertifikat olish uchun portal'ga o'ting.
      `
      await this.telegramService.sendMessage(enrollment.employee_chat_id, text)
      this.logger.log(`Course completed notified: ${enrollment.id}`)
    } catch (err) {
      this.logger.error(`onCourseCompleted error: ${String(err)}`)
    }
  }

  async onCertificateIssued(certificate: Certificate): Promise<void> {
    try {
      const text = `
🏆 <b>Sertifikat Berildi!</b>

📚 <b>Kurs:</b> ${certificate.course_name}
📅 <b>Muddati Tugaydi:</b> ${certificate.expiry_date}
⏰ <b>Qolgan Kun:</b> ${certificate.days_remaining} kun

Sertifikatni yuklab oling: ${process.env.LMS_PORTAL_URL}
      `
      await this.telegramService.sendMessage(certificate.employee_chat_id, text)
      await this.telegramService.sendMessage(certificate.hr_chat_id, text)
      this.logger.log(`Certificate issued notified: ${certificate.id}`)
    } catch (err) {
      this.logger.error(`onCertificateIssued error: ${String(err)}`)
    }
  }

  async onCertificateExpiringSoon(certificate: Certificate): Promise<void> {
    try {
      const text = `
⏰ <b>Sertifikat Muddati Yakunlanmoqda!</b>

📚 <b>Kurs:</b> ${certificate.course_name}
📅 <b>Tugashi:</b> ${certificate.expiry_date}
⚠️ <b>Qolgan:</b> ${certificate.days_remaining} kun

Yangilash uchun tezda ro'yxatdan o'ting!
      `
      await this.telegramService.sendMessage(certificate.employee_chat_id, text)
      await this.telegramService.sendMessage(certificate.hr_chat_id, text)
      this.logger.log(`Certificate expiry warning: ${certificate.id}`)
    } catch (err) {
      this.logger.error(`onCertificateExpiringSoon error: ${String(err)}`)
    }
  }
}
