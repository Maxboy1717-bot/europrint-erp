/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class MroMaintenanceStopEvent {
  constructor(readonly maintenanceId: string,
    readonly machineId: string) {}
}

export class MroMaintenanceCompleteEvent {
  constructor(
    readonly maintenanceId: string,
    readonly machineId: string,
  ) {}
}
