/**
 * @module certificate-expired-live.event
 * @description Wave 4 round-2 (PA2-18): canonical event class for the
 *   `lms.certificate.expired.live` topic. This is the realtime variant of
 *   `CertificateExpiredEvent` — emitted when an active session detects that
 *   the operator's certificate has just expired (vs. the daily cron sweep
 *   which uses `CertificateExpiredEvent`).
 *
 *   The MES `LmsCertExpiredListener` was previously listening via
 *   `@OnEvent(ERP_EVENTS.LMS_CERT_EXPIRED_LIVE)`; it now subscribes to this
 *   class. EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   No production code currently publishes this event on the CQRS bus;
 *   the listener is therefore a no-op at runtime until a publisher is
 *   wired — same dead-letter state as the legacy @OnEvent listener was
 *   previously in.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CertificateExpiredLiveEventProps {
  certificateId: number;
  employeeId: number;
  courseId?: number;
  certificateType?: string;
  expiredAt: Date;
}

export class CertificateExpiredLiveEvent extends DomainEvent {
  constructor(public readonly props: CertificateExpiredLiveEventProps) {
    super(props.certificateId, 'CertificateExpiredLive');
  }
}
