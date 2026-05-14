/**
 * @module assign-driver.command
 * @description Source module. See exports for details.
 */

export class AssignDriverCommand {
  constructor(readonly deliveryId: string,
    readonly driverId: string,
    readonly vehicleNumber: string) {}
}
