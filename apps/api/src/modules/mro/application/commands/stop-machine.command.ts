/**
 * @module stop-machine.command
 * @description Source module. See exports for details.
 */

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
