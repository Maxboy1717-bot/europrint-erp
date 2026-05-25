/**
 * @module lead-updated.event
 * @description Domain event emitted when Lead contact fields are patched via UpdateLeadCommand.
 * Downstream: CRM activity log, analytics pipeline, notification services.
 */

export class LeadUpdatedEvent {
  readonly aggregateId: number;
  readonly eventName = 'LeadUpdated' as const;
  readonly data: { leadId: number; updatedFields: string[] };

  constructor(leadId: number, updatedFields: string[]) {
    this.aggregateId = leadId;
    this.data = { leadId, updatedFields };
  }
}
