/**
 * @module assign-maintenance.command
 * @description Source module. See exports for details.
 */

export class AssignMaintenanceCommand {
  constructor(readonly maintenanceOrderId: string,
    readonly assignedToUserId: string) {}
}
