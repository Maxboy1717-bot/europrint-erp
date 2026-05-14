/**
 * @module crm-comms.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { crm_activities } from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class CrmCommsRepository {
  private readonly logger = new Logger(CrmCommsRepository.name);

  async logEmail(subject: string, leadId: number | null, dealId: number | null, body: string): Promise<Result<void>> {
    try {
      await db.insert(crm_activities).values({
        type:    'email',
        subject,
        lead_id:  leadId ?? undefined,
        deal_id:  dealId ?? undefined,
        notes:   body,
        status:  'completed',
      });
      return Ok(undefined);
    } catch (err) {
      this.logger.warn(`logEmail: ${(err as Error).message}`);
      return Err((err as Error).message);
    }
  }

  async scheduleMeeting(title: string, leadId: number | null, dealId: number | null, scheduledAt: string, attendees: unknown[]): Promise<Result<Row | null>> {
    try {
      const rows = await db.insert(crm_activities).values({
        type:     'meeting',
        subject:   title,
        lead_id:   leadId ?? undefined,
        deal_id:   dealId ?? undefined,
        due_date:  new Date(scheduledAt),
        status:   'pending',
        notes:    JSON.stringify({ attendees }),
      }).returning();
      return Ok((rows[0] ?? null) as Row | null);
    } catch (err) {
      this.logger.warn(`scheduleMeeting: ${(err as Error).message}`);
      return Err((err as Error).message);
    }
  }

  async logSms(phone: string, subject: string, message: string, leadId: number | null): Promise<Result<void>> {
    try {
      await db.insert(crm_activities).values({
        type:    'sms',
        subject,
        lead_id:  leadId ?? undefined,
        notes:   message,
        status:  'completed',
      });
      return Ok(undefined);
    } catch (err) {
      this.logger.warn(`logSms (phone=${phone}): ${(err as Error).message}`);
      return Err((err as Error).message);
    }
  }

  async logWhatsapp(message: string, leadId: number | null): Promise<Result<void>> {
    try {
      await db.insert(crm_activities).values({
        type:    'whatsapp',
        subject: 'WhatsApp',
        lead_id:  leadId ?? undefined,
        notes:   message,
        status:  'completed',
      });
      return Ok(undefined);
    } catch (err) {
      this.logger.warn(`logWhatsapp: ${(err as Error).message}`);
      return Err((err as Error).message);
    }
  }
}
