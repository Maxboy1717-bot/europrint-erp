/**
 * @module crm-lead-created.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `crm.lead.created` topic. The AI automation listener was previously
 *   listening via `@OnEvent('crm.lead.created')`; it now subscribes to this
 *   class.
 *
 *   No production code currently publishes this event on the CQRS bus or the
 *   EventEmitter2 namespace — the listener was already a dead-letter prior
 *   to migration. EventBridge will re-emit to the legacy string topic if a
 *   publisher is added later (entry in event-bridge.service.ts).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CrmLeadCreatedEventProps {
  leadId: number;
  userId: number;
}

export class CrmLeadCreatedEvent extends DomainEvent {
  constructor(public readonly props: CrmLeadCreatedEventProps) {
    super(String(props.leadId), 'CrmLeadCreated');
  }
}
