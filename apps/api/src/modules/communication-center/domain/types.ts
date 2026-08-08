/**
 * Communication Center — Phase 1 shared domain types
 */

export type BasketState = 'inbox' | 'pending' | 'outbox' | 'archived';
export type WorkflowState =
  | 'draft' | 'sent' | 'in_progress'
  | 'approved' | 'rejected' | 'cancelled' | 'archived';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type Language = 'uz' | 'ru';

export interface BasketSummary {
  inbox:        number;
  pending:      number;
  outbox:       number;
  inboxOverdue: number;
}

export interface BasketCardRow {
  id:                string;
  documentNumber:    string;
  subject:           string;
  templateCode:      string;
  templateNameUz:    string;
  templateNameRu:    string;
  priority:          Priority;
  language:          Language;
  basketState:       BasketState;
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;
  workflowState:     WorkflowState;
  currentStepOrder:  number;
  senderUserId:      number;
  senderName:        string | null;
  basketOwnerUserId: number | null;
  sensitivityTier:   string | null; // Doc Control tier (oddiy|maxfiy|juda-maxfiy) — drives FE watermark
  createdAt:         string;
  updatedAt:         string;
}
