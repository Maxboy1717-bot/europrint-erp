/**
 * @module aggregate-root.base
 * @description Source module. See exports for details.
 */

import { DomainEvent } from './domain-event.base';
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];
  protected addDomainEvent(event: DomainEvent | any): void {
    this._domainEvents.push(event);
  }
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
