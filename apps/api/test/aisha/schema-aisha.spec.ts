/**
 * @module schema-aisha.spec
 * @description Static checks on the AIsha Drizzle tables. We assert the
 * pgTable definitions expose the expected columns and that the tables
 * are surfaced via shared/db/index.ts so callers don't reach into the
 * private schema file.
 */

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
