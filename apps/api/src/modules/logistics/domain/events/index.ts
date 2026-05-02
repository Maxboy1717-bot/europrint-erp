export class DeliveryDispatchedEvent {
  constructor(readonly deliveryId: string,
    readonly orderId: number,
    readonly driverId: number) {}
}

export class DeliveryCompletedEvent {
  constructor(
    readonly deliveryId: string,
    readonly orderId: number,
  ) {}
}

export class DeliveryLocationUpdatedEvent {
  constructor(
    readonly deliveryId: string,
    readonly lat: number,
    readonly lng: number,
  ) {}
}
