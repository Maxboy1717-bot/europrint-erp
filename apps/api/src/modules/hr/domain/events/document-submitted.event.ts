/**
 * @module document-submitted.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   HR document workflow `document.submitted` topic (HrV2Events.DOCUMENT_SUBMITTED).
 *
 *   The `DocumentWorkflowProcessor.handleDocumentSubmitted` listener was
 *   previously listening via `@OnEvent(HrV2Events.DOCUMENT_SUBMITTED)`; it now
 *   subscribes to this class. EventBridge re-emits to the legacy string topic
 *   for any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Publisher: DocumentWorkflowService.submitDocument.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface DocumentSubmittedEventProps {
  documentId: number;
  employeeId: number;
  documentType: string;
  title: string;
}

export class DocumentSubmittedEvent extends DomainEvent {
  constructor(public readonly props: DocumentSubmittedEventProps) {
    super(String(props.documentId), 'DocumentSubmitted');
  }
}
