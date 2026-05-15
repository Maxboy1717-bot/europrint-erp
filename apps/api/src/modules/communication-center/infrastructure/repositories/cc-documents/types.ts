/**
 * @module cc-documents/types
 * @description Public types & DTOs for the cc-documents repository facade.
 */

import type { BasketState, Priority, Language, WorkflowState } from '../../../domain/types';

export interface DocumentRow {
  id:                string;
  documentNumber:    string;
  templateId:        string;
  templateVersion:   number;
  senderUserId:      number;
  branchId:          string | null;
  basketState:       BasketState;
  basketOwnerUserId: number | null;
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;
  workflowState:     WorkflowState;
  currentStepOrder:  number;
  subject:           string;
  aiBody:            string;
  aiAnswers:         Record<string, unknown>;
  senderComment:     string | null;
  priority:          Priority;
  language:          Language;
  parentDocumentId:  string | null;
  version:           number;
  cancelledByUserId: number | null;
  cancelledReason:   string | null;
  cancelledAt:       string | null;
  createdAt:         string;
  updatedAt:         string;
  archivedAt:        string | null;
}

export interface TemplateRow {
  id:               string;
  code:             string;
  nameUz:           string;
  nameRu:           string;
  category:         string;
  version:          number;
  isActive:         boolean;
  defaultPriority:  Priority;
  numberFormat:     string;
  inboxSlaHours:    number;
  reminderHours:    number;
  escalationHours:  number;
}

export interface WorkflowStepRow {
  id:                   string;
  templateId:           string;
  templateVersion:      number;
  stepOrder:            number;
  stepType:             'sequential' | 'parallel';
  approverPositionCode: string;
  rejectionStops:       boolean;
  timeLimitHours:       number;
  isMandatory:          boolean;
}

export interface CreateDraftInput {
  templateId:    string;
  senderUserId:  number;
  subject:       string;
  aiBody:        string;
  aiAnswers:     Record<string, unknown>;
  senderComment: string | null;
  priority:      Priority;
  language:      Language;
  branchId:      string | null;
  documentNumber: string;
  templateVersion: number;
}
