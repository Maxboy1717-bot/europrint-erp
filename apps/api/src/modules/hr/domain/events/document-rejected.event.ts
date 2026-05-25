/**
 * @module document-rejected.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   HR document workflow `document.rejected` topic (HrV2Events.DOCUMENT_REJECTED).
 *
 *   The `DocumentWorkflowProcessor.handleDocumentRejected` listener was
 *   previously listening via `@OnEvent(HrV2Events.DOCUMENT_REJECTED)`; it now
 *   subscribes to this class. EventBridge re-emits to the legacy string topic
 *   for any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Publisher: DocumentWorkflowService.rejectStep.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface DocumentRejectedEventProps {
  documentId: number;
  rejectionReason?: string;
  documentType?: string;
  employeeId?: number;
  content?: Record<string, unknown>;
}

export class DocumentRejectedEvent extends DomainEvent {
  constructor(public readonly props: DocumentRejectedEventProps) {
    super(String(props.documentId), 'DocumentRejected');
  }
}
