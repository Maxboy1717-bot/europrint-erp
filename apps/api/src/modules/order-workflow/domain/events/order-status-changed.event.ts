export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly fromStatus: string | undefined,
    public readonly toStatus: string,
    public readonly changedBy: number,
    public readonly changedAt: Date,
  ) {}
}
