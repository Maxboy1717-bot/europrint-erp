/**
 * @module cc-document-fully-approved.event
 * @description G4: CC hujjat TO'LIQ tasdiqlanganda (workflow_state='approved',
 *   oxirgi bosqich imzolandi) chiqadigan CQRS domain event.
 *
 *   Publisher: CcWorkflowService.approve — faqat moliyaviy shablonlar
 *   (ADVANCE / FINANCIAL_AID) uchun, executeApproveTransaction 'finalized'
 *   qaytarganda.
 *
 *   Listener: CcApprovedKassirListener — kassirga "to'lovga tayyor"
 *   bildirishnoma yaratadi (cc_notifications). To'lov AVTO yaratilmaydi —
 *   kassir PIN + ochiq smena talab qilinadi (cashier-hub KAS-1); bu faqat
 *   bildirishnoma-ko'prik.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CcDocumentFullyApprovedEventProps {
  documentId:     string;
  documentNumber: string;
  templateCode:   string;
  senderUserId:   number;
  subject:        string;
}

export class CcDocumentFullyApprovedEvent extends DomainEvent {
  constructor(public readonly props: CcDocumentFullyApprovedEventProps) {
    super(props.documentId, 'CcDocumentFullyApproved');
  }
}
