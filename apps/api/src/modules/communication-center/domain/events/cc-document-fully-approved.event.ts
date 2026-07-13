/**
 * @module cc-document-fully-approved.event
 * @description G4: CC hujjat TO'LIQ tasdiqlanganda (workflow_state='approved',
 *   oxirgi bosqich imzolandi) chiqadigan CQRS domain event.
 *
 *   Publisher: CcWorkflowService.approve — faqat moliyaviy shablonlar
 *   (ADVANCE / FINANCIAL_AID) uchun, executeApproveTransaction 'finalized'
 *   qaytarganda.
 *
 *   Listenerlar (ikkalasi ham mustaqil, bir-birini almashtirmaydi):
 *   - CcApprovedKassirListener — kassirga "to'lovga tayyor" bildirishnoma
 *     yaratadi (cc_notifications). To'lov AVTO yaratilmaydi — kassir PIN +
 *     ochiq smena talab qilinadi (cashier-hub KAS-1); bu faqat
 *     bildirishnoma-ko'prik.
 *   - CcApprovedGlPostingListener (20-cc#49, P0, owner 2026-07-11) — `amount`
 *     musbat bo'lsa va gl_account_mappings'da shablon uchun xaritalash
 *     mavjud bo'lsa, kanonik `entries` jurnaliga balanslashgan GL yozuvi
 *     yaratadi (Dr xarajat/debitor, Cr Kassa).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CcDocumentFullyApprovedEventProps {
  documentId:     string;
  documentNumber: string;
  templateCode:   string;
  senderUserId:   number;
  subject:        string;
  /** GL Auto-post (20-cc#49): ai_answers.amount qiymati (masalan ADVANCE/FINANCIAL_AID —
   *  ikkalasida ham shablon darajasida required:true). Summasiz/aniqlanmagan bo'lsa null —
   *  CcApprovedGlPostingListener GL yozuvi yaratmaydi (Q-40, fabrikatsiya taqiq). Optional —
   *  eski listener (kassir-ko'prik) buni e'tiborsiz qoldiradi (additive, regressiya yo'q). */
  amount?:        number | null;
  /** GL Auto-post: hujjatni SO'NGGI tasdiqlagan foydalanuvchi (GL entries.created_by attributsiyasi
   *  uchun — senderUserId so'rov beruvchi, bu esa tasdiqlovchi, ular boshqa-boshqa shaxs). */
  approverUserId?: number;
}

export class CcDocumentFullyApprovedEvent extends DomainEvent {
  constructor(public readonly props: CcDocumentFullyApprovedEventProps) {
    super(props.documentId, 'CcDocumentFullyApproved');
  }
}
