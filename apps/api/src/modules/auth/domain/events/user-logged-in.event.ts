/**
 * @module user-logged-in.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
export class UserLoggedInEvent {
  constructor(public readonly userId: number,
    public readonly timestamp: Date,
    public readonly ipAddress: string,
    public readonly deviceInfo: string,
    public readonly success: boolean) {}

  static create(
    userId: number,
    ipAddress: string,
    deviceInfo: string,
    success: boolean = true,
  ): UserLoggedInEvent {
    return new UserLoggedInEvent(
      userId,
      _time.now(),
      ipAddress,
      deviceInfo,
      success,
    );
  }
}
