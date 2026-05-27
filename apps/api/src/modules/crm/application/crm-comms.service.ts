/**
 * @module crm-comms.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { Result, AppError, Err, Ok } from '@common/result';
import { CRM_COMMS_REPO, type ICrmCommsRepo } from '../domain/repositories/i-crm-comms.repo';

@Injectable()
export class CrmCommsService {
  constructor(@Inject(CRM_COMMS_REPO) private readonly repo: ICrmCommsRepo) {}

  async sendEmail(to: string, subject: string, body: string, leadId: number | null, dealId: number | null): Promise<Result<object, AppError>> {
    const r = await this.repo.logEmail(subject, leadId, dealId, body);
    if (!r.ok) return Err(r.error);
    return Ok({ sent: true, to, subject, sent_at: _time.now() });
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
    return Ok({ sent: true, phone, message_length: message?.length ?? 0, sent_at: _time.now() });
  }

  async sendWhatsapp(phone: string, message: string, leadId: number | null): Promise<Result<object, AppError>> {
    const r = await this.repo.logWhatsapp(message, leadId);
    if (!r.ok) return Err(r.error);
    return Ok({ sent: true, phone, channel: 'whatsapp', sent_at: _time.now() });
  }
}
