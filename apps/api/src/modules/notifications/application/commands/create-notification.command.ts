export class CreateNotificationCommand {
  constructor(readonly userId: string,
    readonly title: string,
    readonly body: string,
    readonly type: string,
    readonly referenceId?: string,
    readonly referenceType?: string) {}
}
