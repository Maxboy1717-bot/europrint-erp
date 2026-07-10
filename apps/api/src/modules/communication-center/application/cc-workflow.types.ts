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
export interface ApproveDto      { pin: string; comment?: string }
export interface RejectDto       { pin: string; rejectionReasonId?: string; comment?: string }
export interface ResubmitDto     { pin: string; aiBody: string; senderComment?: string }
export interface CancelDto       { pin: string; reason: string }
