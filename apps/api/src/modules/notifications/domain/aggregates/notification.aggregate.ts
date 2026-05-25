/**
 * @module notification.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Ok, Err, AppErr, Result } from '@common/result';
import { NotificationType, NotificationStatus } from '../enums/notification-type.enum';
import { NotificationReadEvent, NotificationExpiredEvent } from '../events';

export class Notification extends AggregateRoot {
  id: string;
  userId: number | string;
  type: NotificationType | string;
  title: string;
  message: string;
  body: string;
  status: NotificationStatus | string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  readAt: Date | null;
  updatedAt: Date;
  expiredAt: Date | null = null;

  // New fields for extended notification functionality
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;

  constructor(userId: number | string, title: string, body: string, type?: NotificationType | string);
  constructor(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  );
  constructor(
    userId: number | string,
    typeOrTitle: NotificationType | string,
    titleOrBody?: string,
    messageOrType?: string | Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ) {
    super();
    this.id = uuid();

    if (titleOrBody && typeof titleOrBody === 'string' && !messageOrType) {
      // New constructor: (userId, title, body, type)
      this.userId = userId;
      this.title = typeOrTitle as string;
      this.body = typeof titleOrBody === 'string' ? titleOrBody : JSON.stringify(titleOrBody);
      this.type = (typeof messageOrType === 'string' ? messageOrType : undefined) || 'info';
      this.message = titleOrBody;
      this.status = NotificationStatus.SENT;
      this.isRead = false;
      this.referenceId = null;
      this.referenceType = null;
    } else if (typeof messageOrType === 'string') {
      // New constructor with type: (userId, title, body, type)
      this.userId = userId;
      this.title = typeOrTitle as string;
      this.body = titleOrBody ?? '';
      this.type = messageOrType;
      this.message = titleOrBody ?? '';
      this.status = NotificationStatus.SENT;
      this.isRead = false;
      this.referenceId = null;
      this.referenceType = null;
    } else {
      // Old constructor: (userId, type, title, message, metadata)
      this.userId = userId;
      this.type = typeOrTitle;
      this.title = titleOrBody ?? '';
      this.message = String(messageOrType);
      this.body = String(messageOrType);
      this.status = NotificationStatus.SENT;
      this.metadata = (metadata) || {};
      this.isRead = false;
      this.referenceId = null;
      this.referenceType = null;
    }

    this.metadata = this.metadata || {};
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
    this.readAt = null;
  }

  markAsRead(by?: number): Result<void> | void {
    // Backwards-compatible: legacy callers invoke markAsRead() with no args.
    // New behavior: markAsRead(by) enforces invariants and raises a domain event.
    if (typeof by === 'number') {
      if (!Number.isInteger(by) || by <= 0) {
        return Err(AppErr('VALIDATION', 'by must be a positive integer'));
      }
      if (this.isRead) {
        return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Notification is already read'));
      }
      this.status = NotificationStatus.READ;
      this.readAt = _time.now();
      this.isRead = true;
      this.updatedAt = _time.now();
      this.addDomainEvent(new NotificationReadEvent(this.id, this.userId, by, this.readAt));
      return Ok<void>();
    }
    this.status = NotificationStatus.READ;
    this.readAt = _time.now();
    this.isRead = true;
    this.updatedAt = _time.now();
  }

  expire(): Result<void> {
    if (this.expiredAt !== null) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Notification is already expired'));
    }
    const now = _time.now();
    this.expiredAt = now;
    this.updatedAt = now;
    this.addDomainEvent(new NotificationExpiredEvent(this.id, this.userId, now));
    return Ok<void>();
  }

  static create(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Notification {
    return new Notification(userId, type, title, message, metadata);
  }

  static createForUser(userId: string, title: string, body: string, type: string = 'info'): Notification {
    return new Notification(userId, title, body, type);
  }
}
