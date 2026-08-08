/**
 * @module cc-documents/types
 * @description Public types & DTOs for the cc-documents repository facade.
 */

import type { BasketState, Priority, Language, WorkflowState } from '../../../domain/types';
import type { AiQuestion } from '../../../application/cc-ai-interview.types';

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
  parentDocumentId: string | null;
  documentNumber: string;
  templateVersion: number;
  /** 20-cc#5: true faqat AI-intervyu orqali yaratilgan qoralamalar uchun (o'zgarmas belgi). */
  aiDraft?: boolean;
}

/**
 * Full-column template row for the super_admin-only template CRUD (owner decision
 * 2026-07-13: templates editable only by super_admin — see cc-documents.controller.ts
 * createTemplate/updateTemplate/deleteTemplate). Distinct from `TemplateRow` above,
 * which is the narrower projection used by the live document/workflow read path.
 */
export interface CcTemplateAdminRow {
  id:                   string;
  code:                 string;
  nameUz:               string;
  nameRu:               string;
  category:             string;
  // CC gap fix (docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md #25): soft-reference to
  // taxonomy_entries(category='document_type'/'contact_type', code) — no FK, matched by
  // category+code (schema-kanban.ts kanban_cards.task_type convention). NULL = not yet
  // classified.
  documentTypeCode:     string | null;
  contactTypeCode:      string | null;
  aiQuestions:          AiQuestion[];
  htmlTemplate:         string | null;
  version:              number;
  isActive:             boolean;
  defaultPriority:      Priority;
  maxFileSizeMb:        number;
  allowedFileTypes:     string[];
  printRequiresReason:  boolean;
  cooldownDays:         number | null;
  archiveAfterDays:     number | null;
  numberFormat:         string;
  inboxSlaHours:        number;
  reminderHours:        number;
  escalationHours:      number;
  isRecurring:          boolean;
  cronExpression:       string | null;
  testMode:             boolean;
  createdAt:            string;
  updatedAt:            string;
}

/**
 * Create-template input. Note: `version` is intentionally NOT settable here —
 * it is a workflow-routing key (cc_workflow_steps.template_version /
 * cc_documents.template_version, resolved live in cc-workflow.service.ts:77 at
 * draft-creation time) and stays owned by that separate versioning flow.
 */
export interface CreateTemplateInput {
  code:                 string;
  nameUz:               string;
  nameRu:               string;
  category:             string;
  documentTypeCode?:    string | null;
  contactTypeCode?:     string | null;
  aiQuestions?:         AiQuestion[];
  htmlTemplate?:        string | null;
  defaultPriority?:     Priority;
  maxFileSizeMb?:       number;
  allowedFileTypes?:    string[];
  printRequiresReason?: boolean;
  cooldownDays?:        number | null;
  archiveAfterDays?:    number | null;
  numberFormat?:        string;
  inboxSlaHours?:       number;
  reminderHours?:       number;
  escalationHours?:     number;
  isRecurring?:         boolean;
  cronExpression?:      string | null;
  testMode?:            boolean;
  isActive?:            boolean;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;
