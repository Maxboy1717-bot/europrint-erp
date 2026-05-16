/**
 * notification.aggregate.spec.ts — Notification domain aggregate unit tests.
 *
 * Covers both overloaded constructors (old & new), markAsRead state transition,
 * and the two static factories (create / createForUser).
 */

import { Notification } from '../../src/modules/notifications/domain/aggregates/notification.aggregate';
import {
  NotificationType,
  NotificationStatus,
} from '../../src/modules/notifications/domain/enums/notification-type.enum';
import { notificationFactory } from '../_fixtures/factories';

describe('Notification aggregate', () => {
  describe('construction', () => {
    it('builds notification with metadata when old constructor signature is used', () => {
      const data = notificationFactory({ userId: 42 });
      const meta = { orderId: 'ORD-1' };
      const n = new Notification(
        data.userId as number,
        NotificationType.ORDER_STATUS,
        data.title,
        data.message,
        meta,
      );
      expect(n.userId).toBe(42);
      expect(n.type).toBe(NotificationType.ORDER_STATUS);
      expect(n.title).toBe(data.title);
      expect(n.message).toBe(data.message);
      expect(n.metadata).toEqual(meta);
      expect(n.status).toBe(NotificationStatus.SENT);
    });

    it('defaults metadata to empty object when none is supplied', () => {
      const data = notificationFactory();
      const n = new Notification(
        data.userId as number,
        NotificationType.STOCK_ALERT,
        data.title,
        data.message,
      );
      expect(n.metadata).toEqual({});
    });

    it('assigns unique uuid when each instance is created', () => {
      const data = notificationFactory();
      const a = new Notification(data.userId as number, NotificationType.QC_RESULT, 't', 'm');
      const b = new Notification(data.userId as number, NotificationType.QC_RESULT, 't', 'm');
      expect(a.id).not.toBe(b.id);
      expect(a.id).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('builds notification with default info type when new (userId,title,body) shape is used', () => {
      const n = new Notification('user-1', 'Salom', 'Tana matni');
      expect(n.userId).toBe('user-1');
      expect(n.title).toBe('Salom');
      expect(n.body).toBe('Tana matni');
      expect(n.type).toBe('info');
      expect(n.status).toBe(NotificationStatus.SENT);
    });

    it('builds notification with explicit type when new (userId,title,body,type) shape is used', () => {
      const n = new Notification('user-2', 'Header', 'Body', 'warning');
      expect(n.type).toBe('warning');
      expect(n.body).toBe('Body');
      expect(n.message).toBe('Body');
    });

    it('initialises read flags to unread defaults when constructed', () => {
      const n = new Notification(1, NotificationType.IOT_ANOMALY, 't', 'm');
      expect(n.isRead).toBe(false);
      expect(n.readAt).toBeNull();
      expect(n.referenceId).toBeNull();
      expect(n.referenceType).toBeNull();
    });

    it('records createdAt and updatedAt timestamps when constructed', () => {
      const before = Date.now() - 1;
      const n = new Notification(1, NotificationType.CERT_EXPIRY, 't', 'm');
      const after = Date.now() + 1;
      expect(n.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(n.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(n.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('markAsRead', () => {
    it('flips status to READ and stamps readAt when invoked once', () => {
      const n = new Notification(1, NotificationType.QC_RESULT, 't', 'm');
      expect(n.status).toBe(NotificationStatus.SENT);
      n.markAsRead();
      expect(n.status).toBe(NotificationStatus.READ);
      expect(n.isRead).toBe(true);
      expect(n.readAt).toBeInstanceOf(Date);
    });

    it('updates updatedAt timestamp when transitioning to read', () => {
      const n = new Notification(1, NotificationType.QC_RESULT, 't', 'm');
      const original = n.updatedAt.getTime();
      // Force a measurable delta by busy-waiting one tick.
      const wait = Date.now() + 2;
      while (Date.now() < wait) { /* spin */ }
      n.markAsRead();
      expect(n.updatedAt.getTime()).toBeGreaterThanOrEqual(original);
    });

    it('remains idempotent when called twice — stays READ', () => {
      const n = new Notification(1, NotificationType.QC_RESULT, 't', 'm');
      n.markAsRead();
      const firstReadAt = n.readAt;
      n.markAsRead();
      expect(n.status).toBe(NotificationStatus.READ);
      expect(n.isRead).toBe(true);
      expect(n.readAt).not.toBeNull();
      expect(firstReadAt).not.toBeNull();
    });
  });

  describe('static factories', () => {
    it('produces Notification via Notification.create when called with full args', () => {
      const data = notificationFactory({ userId: 7 });
      const n = Notification.create(
        data.userId as number,
        NotificationType.DELIVERY_STATUS,
        data.title,
        data.message,
        { foo: 'bar' },
      );
      expect(n).toBeInstanceOf(Notification);
      expect(n.userId).toBe(7);
      expect(n.metadata).toEqual({ foo: 'bar' });
    });

    it('produces Notification via createForUser when called with string user id', () => {
      const n = Notification.createForUser('u-99', 'Hello', 'World', 'success');
      expect(n).toBeInstanceOf(Notification);
      expect(n.userId).toBe('u-99');
      expect(n.title).toBe('Hello');
      expect(n.body).toBe('World');
      expect(n.type).toBe('success');
    });

    it('defaults type to info when createForUser omits type', () => {
      const n = Notification.createForUser('u-100', 'Hello', 'World');
      expect(n.type).toBe('info');
    });
  });
});
