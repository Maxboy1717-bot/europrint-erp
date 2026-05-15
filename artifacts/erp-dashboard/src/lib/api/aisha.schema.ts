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

export const AishaChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    reply:     z.string(),
    sessionId: z.string(),
    toolsUsed: z.array(z.string()).optional(),
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
