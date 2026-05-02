export class AssignDriverCommand {
  constructor(readonly deliveryId: string,
    readonly driverId: string,
    readonly vehicleNumber: string) {}
}
