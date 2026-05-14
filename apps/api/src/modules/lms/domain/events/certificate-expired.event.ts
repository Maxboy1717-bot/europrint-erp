/**
 * @module certificate-expired.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CertificateExpiredEventProps {
  certificateId: number;
  employeeId: number;
  courseId: number;
  courseName: string;
  expiresAt?: Date;
  expiredAt: Date;
}

export class CertificateExpiredEvent extends DomainEvent {
  constructor(public readonly props: CertificateExpiredEventProps) {
    super(props.certificateId, 'CertificateExpired');
  }
}
