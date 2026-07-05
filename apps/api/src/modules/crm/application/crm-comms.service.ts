/**
 * @module crm-comms.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { Result, AppError, Err, Ok } from '@common/result';
import { CRM_COMMS_REPO, type ICrmCommsRepo } from '../domain/repositories/i-crm-comms.repo';
import { EMAIL_SENDER, type IEmailSender } from '@modules/notifications/domain/ports/i-email-sender.port';
import { SMS_SENDER, type ISmsSender } from '@modules/notifications/domain/ports/i-sms-sender.port';

@Injectable()
export class CrmCommsService {
  constructor(
    @Inject(CRM_COMMS_REPO) private readonly repo: ICrmCommsRepo,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    @Inject(SMS_SENDER) private readonly smsSender: ISmsSender,
  ) {}

  async sendEmail(to: string, subject: string, body: string, leadId: number | null, dealId: number | null): Promise<Result<object, AppError>> {
    const r = await this.repo.logEmail(subject, leadId, dealId, body);
    if (!r.ok) return Err(r.error);
    // Real SMTP delivery (SmtpEmailAdapter). When SMTP_* env is unset the adapter
    // itself now returns Err(EXTERNAL_SERVICE), so sendResult.ok is false and the
    // caller sees `sent:false` instead of a fabricated success (Q-40).
    const sendResult = await this.emailSender.send({ to, subject, html: body, text: body });
    return Ok({ sent: sendResult.ok, to, subject, sent_at: _time.now() });
  }

  async scheduleMeeting(title: string, leadId: number | null, dealId: number | null, scheduledAt: string, attendees: unknown[]): Promise<Result<object, AppError>> {
    const r = await this.repo.scheduleMeeting(title, leadId, dealId, scheduledAt, attendees);
    if (!r.ok) return Err(r.error);
    const row = r.data;
    return Ok(row ?? { title, lead_id: leadId, deal_id: dealId, scheduled_at: scheduledAt, status: 'pending' });
  }

  async sendSms(phone: string, message: string, leadId: number | null): Promise<Result<object, AppError>> {
    const r = await this.repo.logSms(phone, `SMS sent to ${phone}`, message, leadId);
    if (!r.ok) return Err(r.error);
    // Real SMS delivery (EskizSmsAdapter — Eskiz/Infobip). When ESKIZ_TOKEN /
    // INFOBIP_API_KEY are unset the adapter itself now returns
    // Err(EXTERNAL_SERVICE) — same as email above.
    const sendResult = await this.smsSender.send({ to: phone, text: message });
    return Ok({ sent: sendResult.ok, phone, message_length: message?.length ?? 0, sent_at: _time.now() });
  }

  async sendWhatsapp(phone: string, message: string, leadId: number | null): Promise<Result<object, AppError>> {
    const r = await this.repo.logWhatsapp(message, leadId);
    if (!r.ok) return Err(r.error);
    // No WhatsApp provider is wired anywhere in the codebase (no port/adapter,
    // no API key config) — fabricating a "sent" response would violate Q-40.
    // We keep the activity-log write (useful as a queued/manual-followup record)
    // but report honestly that no channel actually delivered the message.
    return Ok({
      sent: false,
      phone,
      channel: 'whatsapp',
      reason: 'WhatsApp provayder ulanmagan — faqat CRM tarixiga yozildi',
      logged_at: _time.now(),
    });
  }
}
