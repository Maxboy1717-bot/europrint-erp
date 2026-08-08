/**
 * @module cc-workflow.types
 * @description DTOs extracted from cc-workflow.service.ts to keep main file <300 lines.
 */

import type { Priority, Language } from '../domain/types';

export interface CreateDraftDto {
  templateId:    string;
  subject:       string;
  aiBody:        string;
  aiAnswers?:    Record<string, unknown>;
  senderComment?: string;
  priority?:     Priority;
  language?:     Language;
  branchId?:     string;
  parentDocumentId?: string;
}

export interface SendDocumentDto { pin: string }
// 20-cc#89: ERP web Zod sxemasida MAJBURIY (cc-documents.controller.ts ApproveSchema/RejectSchema)
// — qaysi hujjatga asoslanib qaror qilinganini yozadi. Bu yerda ixtiyoriy, chunki Telegram bot
// (cc-bot.service.ts) ham shu DTO'ni ishlatadi va hali bu maydonni so'ramaydi (alohida
// conversation-flow qadam kerak — bu safar qamrovdan tashqarida, keyingi bosqichda qo'shiladi).
export interface ApproveDto      { pin: string; comment?: string; referenceDocumentNumber?: string }
export interface RejectDto       { pin: string; rejectionReasonId?: string; comment?: string; referenceDocumentNumber?: string }
export interface ResubmitDto     { pin: string; aiBody: string; senderComment?: string }
export interface CancelDto       { pin: string; reason: string }
