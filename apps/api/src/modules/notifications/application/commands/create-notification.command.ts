/**
 * @module create-notification.command
 * @description Source module. See exports for details.
 */

export class CreateNotificationCommand {
  constructor(readonly userId: string,
    readonly title: string,
    readonly body: string,
    readonly type: string,
    readonly referenceId?: string,
    readonly referenceType?: string,
    // 18-notif #88 — originating actor id (e.g. admin who triggered POST /notifications).
    // Undefined for system/cron-generated notifications (no human actor) — sender_id stays NULL.
    readonly senderId?: string) {}
}
