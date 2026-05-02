import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { CertificateExpiredEvent } from '../events/certificate-expired.event';

export interface CertificateProps {
  id: number;
  employeeId: number;
  courseId: number;
  courseName: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

export class Certificate {
  private readonly logger = new Logger(Certificate.name);
  private events: DomainEvent[] = [];

  constructor(private props: CertificateProps) {}

  static create(props: CertificateProps): Certificate {
    return new Certificate(props);
  }

  get id(): number { return this.props.id; }
  get employeeId(): number { return this.props.employeeId; }
  get courseId(): number { return this.props.courseId; }
  get status(): string { return this.props.status; }
  get expiresAt(): Date | undefined { return this.props.expiresAt; }

  isValid(): boolean {
    if (this.props.status !== 'active') {
      this.logger.debug(`Certificate ${this.props.id} is not active`);
      return false;
    }

    if (!this.props.expiresAt) {
      this.logger.debug(`Certificate ${this.props.id} has no expiration date`);
      return true;
    }

    const isValid = _time.now() < this.props.expiresAt;
    this.logger.debug(`Certificate ${this.props.id} validity: ${isValid}`);
    return isValid;
  }

  checkExpiry(): void {
    if (!this.isValid() && this.props.status === 'active') {
      this.props.status = 'expired';
      const event = new CertificateExpiredEvent({
        certificateId: this.props.id,
        employeeId: this.props.employeeId,
        courseId: this.props.courseId,
        courseName: this.props.courseName,
        expiresAt: this.props.expiresAt,
        expiredAt: _time.now(),
      });
      this.events.push(event);
      this.logger.warn(
        `Certificate ${this.props.id} for employee ${this.props.employeeId} marked as expired`
      );
    }
  }

  revoke(reason: string): void {
    this.props.status = 'revoked';
    this.logger.log(
      `Certificate ${this.props.id} revoked - Reason: ${reason}`
    );
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
