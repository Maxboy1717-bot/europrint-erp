/**
 * @module lms-cert-expired-mes.listener
 * @description Wave 4 round-2 (PA2-18): canonical CQRS
 *   `@EventsHandler(CertificateExpiredEvent)` form. Extracted from
 *   `lms-cert-expired.listener.ts` so the Trigger 17 MES operator-block
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.LMS_CERT_EXPIRED` string topic. The EventBridge still
 *   re-emits to the string topic for any non-migrated consumers — see
 *   EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Trigger 17 — LMS sertifikat muddati tugadi → MES da operator tegishli
 *   mashinalardan bloklanadi.
 *   ARCHITECTURE.md §10 #17, §8.3
 *
 *   Note: today the certificate aggregate creates `CertificateExpiredEvent`
 *   but no command flushes it via `eventBus.publish` — same dead-letter
 *   state as the legacy @OnEvent listener was previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CertificateExpiredEvent } from '@modules/lms/domain/events/certificate-expired.event';
import { LmsCertExpiredBlockService } from './lms-cert-expired-block.service';

@Injectable()
@EventsHandler(CertificateExpiredEvent)
export class LmsCertExpiredMesListener
  implements IEventHandler<CertificateExpiredEvent>
{
  private readonly logger = new Logger(LmsCertExpiredMesListener.name);

  constructor(private readonly blockService: LmsCertExpiredBlockService) {}

  async handle(event: CertificateExpiredEvent): Promise<void> {
    await this.blockService.block({
      employeeId: Number(event.props.employeeId),
      courseId: event.props.courseId,
      certificateType: event.props.courseName,
    });
  }
}
