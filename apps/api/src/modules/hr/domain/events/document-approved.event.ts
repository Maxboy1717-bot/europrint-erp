/**
 * @module document-approved.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   HR document workflow `document.approved` topic (HrV2Events.DOCUMENT_APPROVED).
 *
 *   The `DocumentWorkflowProcessor.handleDocumentApproved` listener was
 *   previously listening via `@OnEvent(HrV2Events.DOCUMENT_APPROVED)`; it now
 *   subscribes to this class. EventBridge re-emits to the legacy string topic
 *   for any non-migrated consumers (`gamification.service.ts`,
 *   `telegram-bots.service.ts`) — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Publisher: DocumentWorkflowService.approveStep / processDocument.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface DocumentApprovedEventProps {
  documentId: number;
  employeeId?: number;
  documentType?: string;
}

export class DocumentApprovedEvent extends DomainEvent {
  constructor(public readonly props: DocumentApprovedEventProps) {
    super(String(props.documentId), 'DocumentApproved');
  }
}
