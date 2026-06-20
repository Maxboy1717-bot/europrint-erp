/**
 * @module aisha-history.service
 * @description Read + governance surface over the AIsha history tables. Thin
 * application service that delegates every query to AishaHistoryRepository and
 * returns Result<T> — controllers stay transport-only (Qoida 6).
 *
 *   - listConversations / getConversation  → history + transparency replay
 *   - listApprovals                        → HITL queue (aisha_pending_approvals)
 *   - approve / reject                     → real status UPDATE on an approval row
 *
 * Approve performs the minimal correct status flip (pending → approved, stamps
 * approved_at). Resuming the actual high-stake tool from a persisted approval is
 * a deeper flow (it needs the original Claude message context to feed the
 * tool_result back) — that is NOT faked here; see FOLLOW-UP in approve().
 */

import { Injectable } from '@nestjs/common';
import { Result, AppErr, Err } from '@common/result';
import {
  AishaHistoryRepository,
  type ConversationListRow,
  type ConversationDetail,
  type ApprovalRow,
} from '../../infrastructure/persistence/aisha-history.repo';

export interface ConversationListResult {
  items: ConversationListRow[];
  total: number;
  page:  number;
  limit: number;
}

export interface ApprovalListResult {
  items: ApprovalRow[];
  total: number;
  page:  number;
  limit: number;
}

@Injectable()
export class AishaHistoryService {
  constructor(private readonly repo: AishaHistoryRepository) {}

  async listConversations(userId: number, page: number, limit: number): Promise<Result<ConversationListResult>> {
    const offset = (page - 1) * limit;
    const r = await this.repo.listConversations(userId, limit, offset);
    if (!r.ok) return r as Result<ConversationListResult>;
    return { ok: true, data: { items: r.data.items, total: r.data.total, page, limit } };
  }

  async getConversation(userId: number, conversationId: string): Promise<Result<ConversationDetail>> {
    const r = await this.repo.getConversation(userId, conversationId);
    if (!r.ok) return r as Result<ConversationDetail>;
    if (!r.data) return Err(AppErr('NOT_FOUND', 'Suhbat topilmadi'));
    return { ok: true, data: r.data };
  }

  async listApprovals(userId: number, status: string | null, page: number, limit: number): Promise<Result<ApprovalListResult>> {
    const offset = (page - 1) * limit;
    const r = await this.repo.listApprovals(userId, status, limit, offset);
    if (!r.ok) return r as Result<ApprovalListResult>;
    return { ok: true, data: { items: r.data.items, total: r.data.total, page, limit } };
  }

  async approve(userId: number, approvalId: string): Promise<Result<ApprovalRow>> {
    // FOLLOW-UP: approving only flips the governance row. Actually re-running the
    // high-stake tool (send_email / send_telegram_to_team / schedule_meeting) and
    // feeding its tool_result back to Claude requires replaying the conversation
    // context, which the stateless chat surface does not retain. That resume step
    // is intentionally out of scope for this read/governance task.
    const r = await this.repo.setApprovalStatus(userId, approvalId, 'approved');
    if (!r.ok) return r as Result<ApprovalRow>;
    if (!r.data) return Err(AppErr('NOT_FOUND', 'Tasdiq so\'rovi topilmadi yoki allaqachon hal qilingan'));
    return { ok: true, data: r.data };
  }

  async reject(userId: number, approvalId: string): Promise<Result<ApprovalRow>> {
    const r = await this.repo.setApprovalStatus(userId, approvalId, 'rejected');
    if (!r.ok) return r as Result<ApprovalRow>;
    if (!r.data) return Err(AppErr('NOT_FOUND', 'Tasdiq so\'rovi topilmadi yoki allaqachon hal qilingan'));
    return { ok: true, data: r.data };
  }
}
