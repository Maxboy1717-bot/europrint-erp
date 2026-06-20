/**
 * @module aisha-history.repo
 * @description Persistence + read adapter for the AIsha conversation history and
 * HITL governance queue. Owns every row written to / read from the four AIsha
 * tables (`aisha_conversations`, `aisha_tool_calls`, `aisha_pending_approvals`,
 * `aisha_voice_audit`). All other AIsha layers go through this repo — none of
 * them touch `db.*` directly (Qoida 15).
 *
 * Data-access style mirrors the AIsha tools (RULE4_EXCEPTION): raw parametrised
 * SQL via `db.execute(sql\`…\`)` + `rowsOf<T>()`. AIsha is a loose query-adapter
 * over the ERP; pulling in Drizzle table builders here adds no value because the
 * columns are simple and fully owned by this module. Every parameter is bound
 * (`${value}`) — no `sql.raw` on variables (Qoida B).
 *
 * Columns matched live from information_schema (0 rows at build time):
 *   aisha_conversations    (id uuid PK, user_id int, started_at, ended_at,
 *                           status text, created_at, tenant_id int default 1)
 *   aisha_tool_calls       (id uuid PK, conversation_id uuid, tool_name text,
 *                           input jsonb, output jsonb, source text,
 *                           latency_ms int, created_at, tenant_id int default 1)
 *   aisha_pending_approvals(id uuid PK, conversation_id uuid, tool_call_id uuid,
 *                           status text default 'pending', approved_at, created_at)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Result, safeCall } from '@common/result';
import { rowsOf } from '../../application/tools/_helpers';

// ─── Row shapes (snake→camel projected in SQL) ───────────────────────────────

export interface ConversationListRow {
  id:           string;
  status:       string;
  startedAt:    string;
  endedAt:      string | null;
  createdAt:    string;
  firstMessage: string | null;
  messageCount: number;
  toolCount:    number;
}

export interface ConversationToolCallRow {
  id:        string;
  toolName:  string;
  input:     unknown;
  output:    unknown;
  source:    string | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface ConversationDetail {
  id:         string;
  userId:     number;
  status:     string;
  startedAt:  string;
  endedAt:    string | null;
  createdAt:  string;
  toolCalls:  ConversationToolCallRow[];
}

export interface ApprovalRow {
  id:             string;
  conversationId: string;
  toolCallId:     string;
  status:         string;
  approvedAt:     string | null;
  createdAt:      string;
  toolName:       string | null;
  input:          unknown;
}

export interface InsertToolCallInput {
  conversationId: string;
  toolName:       string;
  input:          Record<string, unknown>;
  output:         unknown;
  source:         string | null;
  latencyMs:      number | null;
}

const DEFAULT_TENANT_ID = 1;

@Injectable()
export class AishaHistoryRepository {
  private readonly logger = new Logger(AishaHistoryRepository.name);

  // ── Writes (persistence wiring — STEP 0) ───────────────────────────────────

  /** Create a conversation row, returning its generated uuid. */
  async insertConversation(userId: number): Promise<Result<{ id: string }>> {
    return safeCall<{ id: string }>(async () => {
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO aisha_conversations (user_id, status, tenant_id)
        VALUES (${userId}, 'active', ${DEFAULT_TENANT_ID})
        RETURNING id::text AS id
      `));
      const id = rows[0]?.id;
      if (!id) throw new Error('aisha_conversations INSERT did not return an id');
      return { id };
    });
  }

  /** Record one executed tool call, returning its generated uuid. */
  async insertToolCall(input: InsertToolCallInput): Promise<Result<{ id: string }>> {
    return safeCall<{ id: string }>(async () => {
      const inputJson = JSON.stringify(input.input ?? {});
      const outputJson = input.output === undefined ? null : JSON.stringify(input.output);
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO aisha_tool_calls
          (conversation_id, tool_name, input, output, source, latency_ms, tenant_id)
        VALUES (
          ${input.conversationId}, ${input.toolName},
          ${inputJson}::jsonb,
          ${outputJson}::jsonb,
          ${input.source}, ${input.latencyMs}, ${DEFAULT_TENANT_ID}
        )
        RETURNING id::text AS id
      `));
      const id = rows[0]?.id;
      if (!id) throw new Error('aisha_tool_calls INSERT did not return an id');
      return { id };
    });
  }

  /**
   * Record a HITL pending approval. The approval references a tool_call row, so
   * callers persist the high-stake tool_use as a tool_call first (output=null,
   * source='pending_approval') and pass that id here.
   */
  async insertPendingApproval(conversationId: string, toolCallId: string): Promise<Result<{ id: string }>> {
    return safeCall<{ id: string }>(async () => {
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO aisha_pending_approvals (conversation_id, tool_call_id, status)
        VALUES (${conversationId}, ${toolCallId}, 'pending')
        RETURNING id::text AS id
      `));
      const id = rows[0]?.id;
      if (!id) throw new Error('aisha_pending_approvals INSERT did not return an id');
      return { id };
    });
  }

  /**
   * Record the user's turn text as a transcript row. `aisha_voice_audit` is the
   * per-message log (transcript NOT NULL) — both voice and text turns land here,
   * which is what powers `firstMessage` / `messageCount` in the conversation list.
   */
  async insertTranscript(conversationId: string, transcript: string): Promise<Result<{ id: string }>> {
    return safeCall<{ id: string }>(async () => {
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO aisha_voice_audit (conversation_id, transcript)
        VALUES (${conversationId}, ${transcript})
        RETURNING id::text AS id
      `));
      const id = rows[0]?.id;
      if (!id) throw new Error('aisha_voice_audit INSERT did not return an id');
      return { id };
    });
  }

  /** Mark a conversation ended (best-effort; never blocks the turn). */
  async endConversation(conversationId: string): Promise<Result<void>> {
    return safeCall<void>(async () => {
      await db.execute(sql`
        UPDATE aisha_conversations
        SET status = 'ended', ended_at = now()
        WHERE id = ${conversationId} AND status <> 'ended'
      `);
    });
  }

  // ── Reads (history + transparency replay) ──────────────────────────────────

  /** List one user's conversations, newest first, with message/tool counts. */
  async listConversations(userId: number, limit: number, offset: number): Promise<Result<{ items: ConversationListRow[]; total: number }>> {
    return safeCall<{ items: ConversationListRow[]; total: number }>(async () => {
      const items = rowsOf<ConversationListRow>(await db.execute(sql`
        SELECT
          c.id::text                                        AS id,
          c.status                                          AS status,
          c.started_at::text                                AS "startedAt",
          c.ended_at::text                                  AS "endedAt",
          c.created_at::text                                AS "createdAt",
          (SELECT va.transcript FROM aisha_voice_audit va
             WHERE va.conversation_id = c.id
             ORDER BY va.created_at ASC LIMIT 1)            AS "firstMessage",
          (SELECT count(*)::int FROM aisha_voice_audit va2
             WHERE va2.conversation_id = c.id)             AS "messageCount",
          (SELECT count(*)::int FROM aisha_tool_calls tc
             WHERE tc.conversation_id = c.id)              AS "toolCount"
        FROM aisha_conversations c
        WHERE c.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `));
      const totalRows = rowsOf<{ total: number }>(await db.execute(sql`
        SELECT count(*)::int AS total FROM aisha_conversations WHERE user_id = ${userId}
      `));
      return { items, total: totalRows[0]?.total ?? 0 };
    });
  }

  /** Load one conversation (scoped to the caller) plus its tool-call transcript. */
  async getConversation(userId: number, conversationId: string): Promise<Result<ConversationDetail | null>> {
    return safeCall<ConversationDetail | null>(async () => {
      const head = rowsOf<{
        id: string; userId: number; status: string;
        startedAt: string; endedAt: string | null; createdAt: string;
      }>(await db.execute(sql`
        SELECT id::text AS id, user_id AS "userId", status,
               started_at::text AS "startedAt", ended_at::text AS "endedAt",
               created_at::text AS "createdAt"
        FROM aisha_conversations
        WHERE id = ${conversationId} AND user_id = ${userId}
        LIMIT 1
      `));
      const conv = head[0];
      if (!conv) return null;
      const toolCalls = rowsOf<ConversationToolCallRow>(await db.execute(sql`
        SELECT id::text AS id, tool_name AS "toolName", input, output, source,
               latency_ms AS "latencyMs", created_at::text AS "createdAt"
        FROM aisha_tool_calls
        WHERE conversation_id = ${conversationId}
        ORDER BY created_at ASC
      `));
      return { ...conv, toolCalls };
    });
  }

  // ── Governance queue (HITL) ────────────────────────────────────────────────

  /** List approvals for the caller's conversations, optionally filtered by status. */
  async listApprovals(userId: number, status: string | null, limit: number, offset: number): Promise<Result<{ items: ApprovalRow[]; total: number }>> {
    return safeCall<{ items: ApprovalRow[]; total: number }>(async () => {
      const statusFilter = status ? sql`AND pa.status = ${status}` : sql``;
      const items = rowsOf<ApprovalRow>(await db.execute(sql`
        SELECT
          pa.id::text              AS id,
          pa.conversation_id::text AS "conversationId",
          pa.tool_call_id::text    AS "toolCallId",
          pa.status                AS status,
          pa.approved_at::text     AS "approvedAt",
          pa.created_at::text      AS "createdAt",
          tc.tool_name             AS "toolName",
          tc.input                 AS input
        FROM aisha_pending_approvals pa
        JOIN aisha_conversations c ON c.id = pa.conversation_id
        LEFT JOIN aisha_tool_calls tc ON tc.id = pa.tool_call_id
        WHERE c.user_id = ${userId} ${statusFilter}
        ORDER BY pa.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `));
      const totalRows = rowsOf<{ total: number }>(await db.execute(sql`
        SELECT count(*)::int AS total
        FROM aisha_pending_approvals pa
        JOIN aisha_conversations c ON c.id = pa.conversation_id
        WHERE c.user_id = ${userId} ${statusFilter}
      `));
      return { items, total: totalRows[0]?.total ?? 0 };
    });
  }

  /**
   * Flip an approval row to a terminal status (caller-scoped). Only `pending`
   * rows can transition. `approve` stamps approved_at; both are real UPDATEs.
   * Returns null when the row is absent / not owned by the caller.
   */
  async setApprovalStatus(
    userId: number,
    approvalId: string,
    next: 'approved' | 'rejected',
  ): Promise<Result<ApprovalRow | null>> {
    return safeCall<ApprovalRow | null>(async () => {
      const approvedAt = next === 'approved' ? sql`now()` : sql`approved_at`;
      const updated = rowsOf<{ id: string }>(await db.execute(sql`
        UPDATE aisha_pending_approvals pa
        SET status = ${next}, approved_at = ${approvedAt}
        FROM aisha_conversations c
        WHERE pa.id = ${approvalId}
          AND c.id = pa.conversation_id
          AND c.user_id = ${userId}
          AND pa.status = 'pending'
        RETURNING pa.id::text AS id
      `));
      if (!updated[0]) return null;
      const rows = rowsOf<ApprovalRow>(await db.execute(sql`
        SELECT
          pa.id::text AS id, pa.conversation_id::text AS "conversationId",
          pa.tool_call_id::text AS "toolCallId", pa.status AS status,
          pa.approved_at::text AS "approvedAt", pa.created_at::text AS "createdAt",
          tc.tool_name AS "toolName", tc.input AS input
        FROM aisha_pending_approvals pa
        LEFT JOIN aisha_tool_calls tc ON tc.id = pa.tool_call_id
        WHERE pa.id = ${approvalId}
        LIMIT 1
      `));
      return rows[0] ?? null;
    });
  }
}
