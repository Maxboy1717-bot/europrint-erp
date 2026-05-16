/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class NotificationReadEvent {
  readonly eventName = 'NotificationRead';
  constructor(
    readonly notificationId: string,
    readonly userId: number | string,
    readonly by: number,
    readonly readAt: Date = new Date(),
  ) {}
}

export class NotificationExpiredEvent {
  readonly eventName = 'NotificationExpired';
  constructor(
    readonly notificationId: string,
    readonly userId: number | string,
    readonly expiredAt: Date = new Date(),
  ) {}
}
