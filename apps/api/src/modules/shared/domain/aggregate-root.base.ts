/**
 * @module aggregate-root.base
 * @description Base class for DDD aggregates. Provides domain-event book-keeping
 * and a default `toJSON()` that produces a stable FE-facing shape:
 *   - drops `_domainEvents` (internal book-keeping, not a payload field)
 *   - strips leading `_` from private fields so `_id` serialises as `id`
 *   - converts `Set` instances to arrays
 *
 * Subclasses with nested value objects (Money, SoStatus, ...) should override
 * `toJSON()` to flatten those — SalesOrder is the reference example.
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

  toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      if (key === '_domainEvents') continue;
      const cleanKey = key.startsWith('_') ? key.slice(1) : key;
      const val = (this as unknown as Record<string, unknown>)[key];
      if (val instanceof Set) {
        out[cleanKey] = [...val];
      } else {
        out[cleanKey] = val;
      }
    }
    return out;
  }
}
