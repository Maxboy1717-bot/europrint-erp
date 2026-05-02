export class DispatchDeliveryCommand {
  constructor(readonly deliveryId: string,
    readonly orderId: number,
    readonly driverId: number) {}
}

export class CompleteDeliveryCommand {
  constructor(
    readonly deliveryId: string,
    readonly orderId: number,
  ) {}
}

export class UpdateDeliveryLocationCommand {
  constructor(
    readonly deliveryId: string,
    readonly lat: number,
    readonly lng: number,
  ) {}
}
