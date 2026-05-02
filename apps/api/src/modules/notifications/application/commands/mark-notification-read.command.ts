export class MarkNotificationReadCommand {
  constructor(readonly notificationId: string) {}
}

export class CreateNotificationCommand {
  constructor(
    readonly userId: number,
    readonly type: string,
    readonly title: string,
    readonly message: string,
    readonly metadata?: Record<string, unknown>,
  ) {}
}
