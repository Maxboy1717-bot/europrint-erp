/**
 * @module domain-event.base
 * @description Source module. See exports for details.
 */

export class DomainEvent {
  readonly aggregateId: number;
  readonly aggregateName: string;
  readonly eventName: string;
  readonly createdAt: Date;

  constructor(props: {
    aggregateId: number;
    aggregateName: string;
    eventName: string;
    createdAt: Date;
  }) {
    this.aggregateId = props.aggregateId;
    this.aggregateName = props.aggregateName;
    this.eventName = props.eventName;
    this.createdAt = props.createdAt;
  }
}
