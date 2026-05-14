/**
 * @module crm-comms.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmCommsRepository } from './crm-comms.repository';

@Injectable()
export class CrmCommsService {
  constructor(private readonly repo: CrmCommsRepository) {}

  async sendEmail(to: string, subject: string, body: string, leadId: number | null, dealId: number | null): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.logEmail(subject, leadId, dealId, body);
      if (!r.ok) throw new Error(r.error.message);
      return { sent: true, to, subject, sent_at: _time.now() };
    });
  }

  async scheduleMeeting(title: string, leadId: number | null, dealId: number | null, scheduledAt: string, attendees: unknown[]) {
    return safeCall(async () => {
      const r = await this.repo.scheduleMeeting(title, leadId, dealId, scheduledAt, attendees);
      if (!r.ok) throw new Error(r.error.message);
      const row = r.data;
      return row ?? { title, lead_id: leadId, deal_id: dealId, scheduled_at: scheduledAt, status: 'pending' };
    });
  }

  async sendSms(phone: string, message: string, leadId: number | null) {
    return safeCall(async () => {
      const r = await this.repo.logSms(phone, `SMS sent to ${phone}`, message, leadId);
      if (!r.ok) throw new Error(r.error.message);
      return { sent: true, phone, message_length: message?.length ?? 0, sent_at: _time.now() };
    });
  }

  async sendWhatsapp(phone: string, message: string, leadId: number | null) {
    return safeCall(async () => {
      const r = await this.repo.logWhatsapp(message, leadId);
      if (!r.ok) throw new Error(r.error.message);
      return { sent: true, phone, channel: 'whatsapp', sent_at: _time.now() };
    });
  }
}
