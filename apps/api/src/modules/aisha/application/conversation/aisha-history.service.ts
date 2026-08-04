/**
 * @module aisha-history.service
 * @description Read + governance surface over the AIsha history tables. Thin
 * application service that delegates every query to AishaHistoryRepository and
 * returns Result<T> — controllers stay transport-only (Qoida 6).
 *
 *   - listConversations / getConversation  → history + transparency replay
 *   - listApprovals                        → HITL queue (aisha_pending_approvals)
 *   - approve                              → resume-after-approve: run the real tool
 *   - reject                               → real status UPDATE (no execution)
 *
 * `approve` is the resume-after-approve flow: it looks up the pending approval +
 * its tool_call, ACTUALLY executes the high-stake tool through the AIsha
 * ToolRegistry (the same registry runTurn uses), persists the real output back
 * onto the tool_call (output jsonb, source 'tool'/'tool_error', latency), then
 * flips the approval to approved. The executed result/error is returned to the
 * caller — never a silent no-op (Q-10/Q-40). Double-execution is impossible:
 * `findResumableApproval` only matches `pending` rows, so a re-approve resolves
 * to NOT_FOUND and the tool does not re-run.
 *
 * NON-GOAL (deferred): true LLM continuation — feeding the tool_result back to
 * Claude for a follow-on reply. The full Claude message array is not persisted,
 * so that step is intentionally out of scope; the scoped deliverable is
 * approve → tool executes → output persisted + returned.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppErr, Err } from '@common/result';
import { ToolRegistry } from '../tools/tool.registry';
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

/** What `approve` returns: the executed tool's outcome + the flipped approval. */
export interface ApprovalResumeResult {
  approval: ApprovalRow;
  tool: {
    name:   string;
    ok:     boolean;
    /** Tool data on success, or the tool's AppError on failure (surfaced, not swallowed). */
    result: unknown;
  };
}

@Injectable()
export class AishaHistoryService {
  private readonly logger = new Logger(AishaHistoryService.name);

  constructor(
    private readonly repo: AishaHistoryRepository,
    private readonly tools: ToolRegistry,
  ) {}

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

  /**
   * Resume-after-approve: run the approved high-stake tool for real, persist its
   * output, then flip the approval to approved. Returns the executed tool's
   * result/error alongside the updated approval. Re-approving an already-resolved
   * row returns NOT_FOUND and does NOT re-execute (the lookup only matches
   * `pending` rows — see findResumableApproval).
   */
  async approve(userId: number, approvalId: string): Promise<Result<ApprovalResumeResult>> {
    // 1) Load the pending approval + its tool_call. NOT_FOUND here doubles as the
    //    idempotency guard: an already approved/rejected (or foreign) row yields null.
    const lookup = await this.repo.findResumableApproval(userId, approvalId);
    if (!lookup.ok) return lookup as Result<ApprovalResumeResult>;
    const resumable = lookup.data;
    if (!resumable) {
      return Err(AppErr('NOT_FOUND', 'Tasdiq so\'rovi topilmadi yoki allaqachon hal qilingan'));
    }

    // 2) Resolve the tool from the same registry runTurn uses.
    const toolR = this.tools.getToolByName(resumable.toolName);
    if (!toolR.ok) return toolR as Result<ApprovalResumeResult>;

    // 3) ACTUALLY execute the high-stake tool (real INSERT/UPDATE/external call).
    const startMs = Date.now();
    // High-stake-only resume path (send_email/telegram/schedule_meeting) — none of these
    // are role-gated tools, so `role` isn't tracked at this call site (see AishaToolContext).
    const exec = await toolR.data.execute(resumable.input ?? {}, { userId, role: null });
    const latencyMs = Date.now() - startMs;
    const payload = exec.ok ? exec.data : exec.error;
    const source = exec.ok ? 'tool' : 'tool_error';

    // 4) Persist the real output back onto the tool_call row (non-fatal write;
    //    a DB hiccup must not lose the executed outcome we surface to the caller).
    const upd = await this.repo.updateToolCallOutput(resumable.toolCallId, payload, source, latencyMs);
    if (!upd.ok) {
      this.logger.warn(
        { approvalId, toolCallId: resumable.toolCallId, error: upd.error.message },
        'AIsha: tool_call output UPDATE failed (non-fatal)',
      );
    }

    // 5) Flip the approval → approved (caller-scoped, still-pending guard). If the
    //    row was resolved in a race between steps 1 and 5, treat as NOT_FOUND.
    const flip = await this.repo.markApprovalApproved(userId, approvalId);
    if (!flip.ok) return flip as Result<ApprovalResumeResult>;
    if (!flip.data) {
      return Err(AppErr('NOT_FOUND', 'Tasdiq so\'rovi topilmadi yoki allaqachon hal qilingan'));
    }

    // 6) Surface the executed tool's result/error — never a silent no-op.
    return {
      ok: true,
      data: {
        approval: flip.data,
        tool: { name: resumable.toolName, ok: exec.ok, result: payload },
      },
    };
  }

  async reject(userId: number, approvalId: string): Promise<Result<ApprovalRow>> {
    const r = await this.repo.setApprovalStatus(userId, approvalId, 'rejected');
    if (!r.ok) return r as Result<ApprovalRow>;
    if (!r.data) return Err(AppErr('NOT_FOUND', 'Tasdiq so\'rovi topilmadi yoki allaqachon hal qilingan'));
    return { ok: true, data: r.data };
  }
}
