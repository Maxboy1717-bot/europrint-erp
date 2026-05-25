/**
 * @module schema-aisha
 * @description Canonical definitions live in lib/db/src/schema/aisha-schema.ts
 * Re-exported here for backward compatibility with apps/api consumers.
 */

// Canonical definitions sourced from @workspace/db — do NOT redefine here.
export {
  aishaConversations,
  aishaToolCalls,
  aishaVoiceAudit,
  aishaPendingApprovals,
  insertAishaConversationSchema,
  insertAishaToolCallSchema,
  insertAishaVoiceAuditSchema,
  insertAishaPendingApprovalSchema,
} from '@workspace/db';
export type {
  AishaConversation,
  InsertAishaConversation,
  AishaToolCall,
  InsertAishaToolCall,
  AishaVoiceAudit,
  InsertAishaVoiceAudit,
  AishaPendingApproval,
  InsertAishaPendingApproval,
} from '@workspace/db';
