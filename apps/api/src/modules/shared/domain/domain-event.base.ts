import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
export abstract class DomainEvent {
  public readonly occurredAt: Date = _time.now();
  constructor(public readonly aggregateId: string | number,
    public readonly eventName: string) {}
}
