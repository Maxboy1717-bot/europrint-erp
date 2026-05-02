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
