/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class WorkCenterCapacityChangedEvent {
  readonly eventName = 'WorkCenterCapacityChanged';
  constructor(
    readonly workCenterId: string,
    readonly oldCapacity: number,
    readonly newCapacity: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class WorkCenterOutOfServiceEvent {
  readonly eventName = 'WorkCenterOutOfService';
  constructor(
    readonly workCenterId: string,
    readonly reason: string,
    readonly by: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}
