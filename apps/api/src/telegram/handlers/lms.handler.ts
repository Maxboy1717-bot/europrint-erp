/**
 * @module lms.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
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

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  async onCourseCompleted(enrollment: Enrollment): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.lms.courseCompleted', {
        args: { courseName: enrollment.course_name },
      })
      await this.telegramService.sendMessage(enrollment.employee_chat_id, text)
      this.logger.log(`Course completed notified: ${enrollment.id}`)
    } catch (err) {
      this.logger.error(`onCourseCompleted error: ${String(err)}`)
    }
  }

  async onCertificateIssued(certificate: Certificate): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.lms.certificateIssued', {
        args: {
          courseName: certificate.course_name,
          expiryDate: certificate.expiry_date,
          daysRemaining: certificate.days_remaining,
          portalUrl: process.env.LMS_PORTAL_URL ?? '',
        },
      })
      await this.telegramService.sendMessage(certificate.employee_chat_id, text)
      await this.telegramService.sendMessage(certificate.hr_chat_id, text)
      this.logger.log(`Certificate issued notified: ${certificate.id}`)
    } catch (err) {
      this.logger.error(`onCertificateIssued error: ${String(err)}`)
    }
  }

  async onCertificateExpiringSoon(certificate: Certificate): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.lms.certificateExpiringSoon', {
        args: {
          courseName: certificate.course_name,
          expiryDate: certificate.expiry_date,
          daysRemaining: certificate.days_remaining,
        },
      })
      await this.telegramService.sendMessage(certificate.employee_chat_id, text)
      await this.telegramService.sendMessage(certificate.hr_chat_id, text)
      this.logger.log(`Certificate expiry warning: ${certificate.id}`)
    } catch (err) {
      this.logger.error(`onCertificateExpiringSoon error: ${String(err)}`)
    }
  }
}
