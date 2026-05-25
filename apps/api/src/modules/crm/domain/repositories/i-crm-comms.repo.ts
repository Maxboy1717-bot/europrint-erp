/**
 * @module i-crm-comms.repo
 * @description Domain repository interface for CRM communications
 *   (email, SMS, WhatsApp, meeting). Concrete implementation lives at
 *   `infrastructure/repositories/crm-comms.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ICrmCommsRepo {
  logEmail(
    subject: string,
    leadId: number | null,
    dealId: number | null,
    body: string,
  ): Promise<Result<void>>;
  scheduleMeeting(
    title: string,
    leadId: number | null,
    dealId: number | null,
    scheduledAt: string,
    attendees: unknown[],
  ): Promise<Result<Row | null>>;
  logSms(
    phone: string,
    subject: string,
    message: string,
    leadId: number | null,
  ): Promise<Result<void>>;
  logWhatsapp(message: string, leadId: number | null): Promise<Result<void>>;
}

export const CRM_COMMS_REPO = Symbol('CRM_COMMS_REPO');
