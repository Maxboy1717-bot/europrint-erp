/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class UserDeactivatedEvent {
  readonly eventName = 'UserDeactivated';
  constructor(
    readonly userId: number,
    readonly by: number,
    readonly reason: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class UserRolePromotedEvent {
  readonly eventName = 'UserRolePromoted';
  constructor(
    readonly userId: number,
    readonly oldRole: string,
    readonly newRole: string,
    readonly by: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}
