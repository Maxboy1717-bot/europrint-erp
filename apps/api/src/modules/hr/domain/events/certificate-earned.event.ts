/**
 * @module certificate-earned.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `training.certificate.earned` topic (HrV2Events.CERTIFICATE_EARNED).
 *
 *   The `SkillsMatrixService.onCertificateEarned` listener (plus a duplicate
 *   handler on `GamificationService`) were previously listening via
 *   `@OnEvent(HrV2Events.CERTIFICATE_EARNED)`. Skills-matrix now subscribes
 *   to this class via the canonical `@EventsHandler` form; gamification is
 *   still on the legacy string topic and is kept alive by the EventBridge
 *   re-emit path (see EVENT_NAME_MAP entry in event-bridge.service.ts).
 *
 *   No production code currently publishes this event on either bus —
 *   the listener was already a dead-letter prior to migration.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CertificateEarnedEventProps {
  employeeId: number;
  certificateName?: string;
  skillCode?: string;
  level?: number;
}

export class CertificateEarnedEvent extends DomainEvent {
  constructor(public readonly props: CertificateEarnedEventProps) {
    super(String(props.employeeId), 'CertificateEarned');
  }
}
