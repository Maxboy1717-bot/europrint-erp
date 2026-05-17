/**
 * @module lms-cert-expired-live-mes.listener
 * @description Wave 4 round-2 (PA2-18): canonical CQRS
 *   `@EventsHandler(CertificateExpiredLiveEvent)` form. Extracted from
 *   `lms-cert-expired.listener.ts` so the Trigger 17 realtime variant
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.LMS_CERT_EXPIRED_LIVE` string topic. The EventBridge still
 *   re-emits to the string topic for any non-migrated consumers — see
 *   EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Trigger 17 (realtime variant) — fires when an active session detects
 *   that the operator's certificate has just expired (vs. the daily cron
 *   sweep which uses `CertificateExpiredEvent`).
 *
 *   Note: today no command publishes `CertificateExpiredLiveEvent` on the
 *   CQRS bus; the listener is therefore a no-op at runtime until a
 *   publisher is wired — same dead-letter state as the legacy @OnEvent
 *   listener was previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CertificateExpiredLiveEvent } from '@modules/lms/domain/events/certificate-expired-live.event';
import { LmsCertExpiredBlockService } from './lms-cert-expired-block.service';

@Injectable()
@EventsHandler(CertificateExpiredLiveEvent)
export class LmsCertExpiredLiveMesListener
  implements IEventHandler<CertificateExpiredLiveEvent>
{
  private readonly logger = new Logger(LmsCertExpiredLiveMesListener.name);

  constructor(private readonly blockService: LmsCertExpiredBlockService) {}

  async handle(event: CertificateExpiredLiveEvent): Promise<void> {
    await this.blockService.block({
      employeeId: Number(event.props.employeeId),
      courseId: event.props.courseId,
      certificateType: event.props.certificateType,
    });
  }
}
