/**
 * @module advance-bypass-approved.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 *
 * PA2-18: extracted from the anonymous shape previously published inline by
 * approve-advance-bypass.handler.ts so director-side listeners can subscribe
 * via canonical `@EventsHandler(AdvanceBypassApprovedEvent)`.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class AdvanceBypassApprovedEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly bypassBy: number,
    public readonly reason: string,
  ) {
    super(orderId, 'AdvanceBypassApproved');
  }
}
