/**
 * @module advance-bypass-approved.listener
 * @description Trigger 20 — director-side audit listener.
 *
 * When the SD module approves an advance-payment bypass (sales-order
 * aggregate emits AdvanceBypassApproved; CQRS publish + EventEmitter2
 * emit happen in approve-advance-bypass.handler.ts), record an audit
 * entry. Today this is structured-log only because the director module
 * does not yet expose a generic audit-write repository; once one exists,
 * replace the Logger call with a persisted audit-trail write.
 *
 * TODO PA0: Replace Logger-only audit with a persisted entry in
 *           director_audit (or shared audit_trail) once the repo lands.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

interface AdvanceBypassApprovedPayload {
  aggregateId?: number;
  eventName?: string;
  timestamp?: Date;
  data?: {
    orderId?: number;
    bypassBy?: number;
    reason?: string;
  };
}

@Injectable()
export class AdvanceBypassApprovedListener {
  private readonly logger = new Logger(AdvanceBypassApprovedListener.name);

  @OnEvent(ERP_EVENTS.ADVANCE_BYPASS_APPROVED, { async: true })
  async handle(event: AdvanceBypassApprovedPayload): Promise<void> {
    const orderId = event?.data?.orderId ?? event?.aggregateId ?? null;
    const bypassBy = event?.data?.bypassBy ?? null;
    const reason = event?.data?.reason ?? '';
    const timestamp = event?.timestamp ?? new Date();

    this.logger.warn({
      msg: 'Trigger 20: advance bypass approved — director audit',
      orderId,
      bypassBy,
      reason,
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp),
    });
  }
}
