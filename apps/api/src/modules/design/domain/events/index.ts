export class DesignRequestedEvent {
  constructor(readonly designOrderId: string,
    readonly salesOrderId: number,
    readonly customerId: number) {}
}

export class DesignApprovedEvent {
  constructor(
    readonly designOrderId: string,
    readonly salesOrderId: number,
  ) {}
}

export class DesignRejectedEvent {
  constructor(
    readonly designOrderId: string,
    readonly salesOrderId: number,
    readonly reason: string,
  ) {}
}
