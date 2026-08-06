/**
 * @module aisha.schema
 * @description Zod schemas for the AIsha module HTTP API. Every fetch
 *   response from `/api/aisha/*` is validated against one of these schemas
 *   before reaching the React tree — so the components can assume the
 *   payload shape is exactly what's typed here.
 *
 *   Inferred types are re-exported via `z.infer<>` so callers don't have
 *   to keep a second TS interface in sync.
 *
 *   Where the runtime backend response differs from the canonical
 *   `{ success, data: { ... } }` envelope, the schemas use `.passthrough()`
 *   plus permissive unions so older response shapes still validate.
 */
import { z } from 'zod';

// ─── Chat ────────────────────────────────────────────────────────────────────

export const AishaRoleSchema = z.enum(['user', 'assistant']);

export const AishaMessageSchema = z.object({
  role:      AishaRoleSchema,
  content:   z.string(),
  timestamp: z.number().int().nonnegative(),
});

export const AishaChatRequestSchema = z.object({
  message:   z.string().min(1).max(2000),
  sessionId: z.string().optional(),
});

// Item #171-185 wave: a chat turn that requested a high-stake tool (send_email /
// send_telegram_to_team / schedule_meeting / assign_task) pauses and reports it here —
// distinct from AishaApprovalSchema below (that's the persisted GET /approvals queue row;
// this is the ephemeral per-turn signal the backend's ChatResponse.data carries, keyed by
// the LLM's tool_use id rather than the DB approval id).
export const AishaPendingApprovalSchema = z.object({
  toolUseId: z.string(),
  name:      z.string(),
  input:     z.record(z.unknown()),
  stake:     z.literal('high'),
});

export const AishaChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    reply:            z.string(),
    sessionId:        z.string(),
    conversationId:   z.string().optional(),
    toolsUsed:        z.array(z.string()).optional(),
    pendingApprovals: z.array(AishaPendingApprovalSchema).optional(),
  }),
});

// ─── Wake config ─────────────────────────────────────────────────────────────
// Backend (`GET /api/aisha/wake/config`) returns:
//   { accessKey, ppnUrl, sensitivity, voiceId }
// Spec asks for:
//   { success, data: { enabled, sensitivity, keyword } }
// We accept both shapes via a union — the hook normalises into a single
// view-model so the panel doesn't care which envelope the backend uses.

const WakeConfigDataSchema = z.object({
  enabled:     z.boolean().optional(),
  sensitivity: z.number().min(0).max(1),
  keyword:     z.string().optional(),
  accessKey:   z.string().optional(),
  ppnUrl:      z.string().optional(),
  voiceId:     z.string().optional(),
});

export const AishaWakeConfigSchema = z.union([
  z.object({
    success: z.boolean(),
    data:    WakeConfigDataSchema,
  }),
  WakeConfigDataSchema,
]);

// ─── History list (GET /api/aisha/conversations) ─────────────────────────────

export const AishaConversationListItemSchema = z.object({
  id:           z.string(),
  status:       z.string(),
  startedAt:    z.string().nullable().optional(),
  endedAt:      z.string().nullable().optional(),
  createdAt:    z.string().nullable().optional(),
  firstMessage: z.string().nullable().optional(),
  messageCount: z.number().int().nonnegative().default(0),
  toolCount:    z.number().int().nonnegative().default(0),
});

export const AishaConversationListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(AishaConversationListItemSchema),
    total: z.number().int().nonnegative(),
    page:  z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  }),
});

// ─── Conversation detail (GET /api/aisha/conversations/:id) ───────────────────

export const AishaToolCallSchema = z.object({
  id:        z.string(),
  toolName:  z.string(),
  input:     z.unknown(),
  output:    z.unknown(),
  source:    z.string().nullable().optional(),
  latencyMs: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export const AishaConversationDetailResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id:        z.string(),
    userId:    z.number().int(),
    status:    z.string(),
    startedAt: z.string().nullable().optional(),
    endedAt:   z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    toolCalls: z.array(AishaToolCallSchema),
  }),
});

// ─── Approvals queue (GET /api/aisha/approvals) ───────────────────────────────

export const AishaApprovalSchema = z.object({
  id:             z.string(),
  conversationId: z.string(),
  toolCallId:     z.string(),
  status:         z.string(),
  approvedAt:     z.string().nullable().optional(),
  createdAt:      z.string().nullable().optional(),
  toolName:       z.string().nullable().optional(),
  input:          z.unknown(),
});

export const AishaApprovalListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(AishaApprovalSchema),
    total: z.number().int().nonnegative(),
    page:  z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  }),
});

// POST /api/aisha/approvals/:id/approve — resumes and actually executes the tool;
// the response carries the real executed result (never a silent no-op, Q-10/Q-40).
export const AishaApprovalResumeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    approval: AishaApprovalSchema,
    tool: z.object({
      name:   z.string(),
      ok:     z.boolean(),
      result: z.unknown(),
    }),
  }),
});

// POST /api/aisha/approvals/:id/reject
export const AishaApprovalRejectResponseSchema = z.object({
  success: z.boolean(),
  data: AishaApprovalSchema,
});

// ─── Stream (SSE) events ─────────────────────────────────────────────────────

export const AishaStreamEventSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text_delta'),  text:    z.string() }),
  z.object({
    kind:  z.literal('tool_use'),
    id:    z.string(),
    name:  z.string(),
    input: z.record(z.unknown()),
  }),
  z.object({
    kind:    z.literal('tool_result'),
    id:      z.string(),
    content: z.unknown(),
  }),
  z.object({ kind: z.literal('done'),  stopReason: z.string().nullable() }),
  z.object({ kind: z.literal('error'), message:    z.string() }),
]);

// ─── Inferred types ──────────────────────────────────────────────────────────

export type AishaRole          = z.infer<typeof AishaRoleSchema>;
export type AishaMessage       = z.infer<typeof AishaMessageSchema>;
export type AishaChatRequest   = z.infer<typeof AishaChatRequestSchema>;
export type AishaChatResponse  = z.infer<typeof AishaChatResponseSchema>;
export type AishaWakeConfig    = z.infer<typeof AishaWakeConfigSchema>;
export type AishaStreamEvent   = z.infer<typeof AishaStreamEventSchema>;
export type AishaConversationListItem = z.infer<typeof AishaConversationListItemSchema>;
export type AishaToolCall             = z.infer<typeof AishaToolCallSchema>;
export type AishaConversationDetail   = z.infer<typeof AishaConversationDetailResponseSchema>['data'];
export type AishaApproval             = z.infer<typeof AishaApprovalSchema>;
export type AishaPendingApproval      = z.infer<typeof AishaPendingApprovalSchema>;
export type AishaApprovalResumeResult = z.infer<typeof AishaApprovalResumeResponseSchema>['data'];

/**
 * Normalised wake-config view-model used by the React tree. Hides the
 * "spec vs. real backend" envelope difference so consumers don't branch.
 */
export interface AishaWakeConfigView {
  enabled:     boolean;
  sensitivity: number;
  keyword:     string;
}

export function normaliseWakeConfig(input: AishaWakeConfig): AishaWakeConfigView {
  const data = 'data' in input ? input.data : input;
  return {
    enabled:     data.enabled ?? true,
    sensitivity: data.sensitivity,
    keyword:     data.keyword ?? 'aisha',
  };
}
