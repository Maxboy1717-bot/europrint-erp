export class StopMachineCommand {
  constructor(readonly maintenanceId: string,
    readonly machineId: string) {}
}

export class CompleteMaintenceCommand {
  constructor(
    readonly maintenanceId: string,
    readonly machineId: string,
  ) {}
}
