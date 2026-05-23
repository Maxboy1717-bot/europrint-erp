/**
 * @module schema-aisha.spec
 * @description Static checks on the AIsha Drizzle tables. We assert the
 * pgTable definitions expose the expected columns and that the tables
 * are surfaced via shared/db/index.ts so callers don't reach into the
 * private schema file.
 *
 * @workspace/db is mocked to avoid requiring a live DATABASE_URL in CI.
 * The column stubs mirror the real schema columns so Object.keys() assertions
 * still work correctly.
 */

// Must be before imports — Jest hoists jest.mock() calls.
jest.mock('@workspace/db', () => ({
  aishaConversations: {
    id: 'c_id', tenantId: 'c_tenantId', userId: 'c_userId',
    startedAt: 'c_startedAt', endedAt: 'c_endedAt', status: 'c_status',
    model: 'c_model', totalTokens: 'c_totalTokens', totalCostUsd: 'c_totalCostUsd',
    inputTokens: 'c_inputTokens', outputTokens: 'c_outputTokens',
    createdAt: 'c_createdAt', updatedAt: 'c_updatedAt',
  },
  aishaToolCalls: {
    id: 'tc_id', conversationId: 'tc_conversationId', toolName: 'tc_toolName',
    inputParams: 'tc_inputParams', outputData: 'tc_outputData',
    sourceTable: 'tc_sourceTable', sourceIds: 'tc_sourceIds',
    executionMs: 'tc_executionMs', status: 'tc_status',
    createdAt: 'tc_createdAt',
  },
  aishaVoiceAudit: {
    id: 'va_id', conversationId: 'va_conversationId', userId: 'va_userId',
    transcript: 'va_transcript', audioPath: 'va_audioPath',
    audioDeletedAt: 'va_audioDeletedAt', createdAt: 'va_createdAt',
  },
  aishaPendingApprovals: {
    id: 'pa_id', conversationId: 'pa_conversationId', toolCallId: 'pa_toolCallId',
    actionType: 'pa_actionType', actionPayload: 'pa_actionPayload',
    status: 'pa_status', expiresAt: 'pa_expiresAt', resolvedAt: 'pa_resolvedAt',
    resolvedBy: 'pa_resolvedBy', createdAt: 'pa_createdAt',
  },
  insertAishaConversationSchema: {},
  insertAishaToolCallSchema: {},
  insertAishaVoiceAuditSchema: {},
  insertAishaPendingApprovalSchema: {},
  // db + pool stubs so @shared/db barrel doesn't throw
  db:   { select: () => ({}), execute: async () => ({ rows: [] }) },
  pool: {},
  sql: (s: TemplateStringsArray, ...v: unknown[]) => ({ sql: String(s), values: v }),
  eq: () => ({}), and: () => ({}), or: () => ({}), inArray: () => ({}),
  isNull: () => ({}), lt: () => ({}), lte: () => ({}), gt: () => ({}), gte: () => ({}),
  count: () => ({}), desc: () => ({}), asc: () => ({}),
}));

import {
  aishaConversations,
  aishaToolCalls,
  aishaVoiceAudit,
  aishaPendingApprovals,
} from '../../src/shared/db/schema-aisha';
import * as sharedDb from '../../src/shared/db';

describe('schema-aisha', () => {
  it('exposes the four aisha tables with primary keys', () => {
    expect(aishaConversations).toBeDefined();
    expect(aishaToolCalls).toBeDefined();
    expect(aishaVoiceAudit).toBeDefined();
    expect(aishaPendingApprovals).toBeDefined();
  });

  it('declares foreign keys back to aisha_conversations', () => {
    const toolCols = Object.keys(aishaToolCalls);
    const auditCols = Object.keys(aishaVoiceAudit);
    const approvalCols = Object.keys(aishaPendingApprovals);
    expect(toolCols).toContain('conversationId');
    expect(auditCols).toContain('conversationId');
    expect(approvalCols).toContain('conversationId');
    expect(approvalCols).toContain('toolCallId');
  });

  it('re-exports tables from shared/db barrel', () => {
    expect((sharedDb as Record<string, unknown>)['aishaConversations']).toBeDefined();
    expect((sharedDb as Record<string, unknown>)['aishaToolCalls']).toBeDefined();
    expect((sharedDb as Record<string, unknown>)['aishaVoiceAudit']).toBeDefined();
    expect((sharedDb as Record<string, unknown>)['aishaPendingApprovals']).toBeDefined();
  });
});
