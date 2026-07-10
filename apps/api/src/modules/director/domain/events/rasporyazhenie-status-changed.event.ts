/**
 * @module rasporyazhenie-status-changed.event
 * @description Domain event payload. Emitted via the CQRS event bus when a
 *   rasporyazhenie (dept directive) status changes. OutboxEventWriter (subscribed
 *   to the same bus) atomically persists it to domain_events; the director-side
 *   RasporyazhenieStatusChangedListener then recomputes the COR completion %.
 *
 *   Vision: 04-coordination #4 — Event-driven Rasporyazheniye status -> COR % update.
 *   Mirrors the canonical OrderStatusChangedEvent shape (extends DomainEvent).
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class RasporyazhenieStatusChangedEvent extends DomainEvent {
  readonly aggregateName: string = 'Rasporyazhenie';

  constructor(
    public readonly rasporyazhenieId: number,
    public readonly newStatus: string,
    public readonly changedBy: number,
  ) {
    super(rasporyazhenieId, 'RasporyazhenieStatusChanged');
  }
}
