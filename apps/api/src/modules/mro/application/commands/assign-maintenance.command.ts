export class AssignMaintenanceCommand {
  constructor(readonly maintenanceOrderId: string,
    readonly assignedToUserId: string) {}
}
