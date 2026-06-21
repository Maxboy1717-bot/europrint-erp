/**
 * aisha-history-resume.service.spec.ts — resume-after-approve flow.
 *
 * Proves that approving a pending high-stake approval ACTUALLY runs the tool
 * (registry.getToolByName(...).execute called), persists the real output back
 * onto the tool_call (updateToolCallOutput), flips the approval to approved, and
 * surfaces the executed result/error to the caller — never a silent no-op.
 * Also proves the double-execution guard: when the approval is no longer
 * resumable (already resolved), approve returns NOT_FOUND and does NOT execute.
 *
 * Repo + ToolRegistry are mocked; the service's approve() is the unit under test.
 */

import { AishaHistoryService } from '../../src/modules/aisha/application/conversation/aisha-history.service';
import { Ok, Err, AppErr } from '../../src/common/result';
import type {
  ResumableApprovalRow,
  ApprovalRow,
} from '../../src/modules/aisha/infrastructure/persistence/aisha-history.repo';

const APPROVAL_ID = '11111111-1111-1111-1111-111111111111';
const TOOL_CALL_ID = '22222222-2222-2222-2222-222222222222';
const CONV_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = 7;

function makeApprovedRow(): ApprovalRow {
  return {
    id: APPROVAL_ID,
    conversationId: CONV_ID,
    toolCallId: TOOL_CALL_ID,
    status: 'approved',
    approvedAt: '2026-06-21T00:00:00.000Z',
    createdAt: '2026-06-21T00:00:00.000Z',
    toolName: 'send_email',
    input: { to: 'a@b.com', subject: 's', body: 'b' },
  };
}

function makeResumable(): ResumableApprovalRow {
  return {
    approvalId: APPROVAL_ID,
    conversationId: CONV_ID,
    toolCallId: TOOL_CALL_ID,
    toolName: 'send_email',
    input: { to: 'a@b.com', subject: 's', body: 'b' },
    output: null,
  };
}

describe('AishaHistoryService.approve — resume-after-approve', () => {
  it('EXECUTES the approved tool, persists its output, flips approval, returns the result', async () => {
    const execute = jest.fn(async (input: Record<string, unknown>) =>
      Ok({ data: { messageId: 'msg_1', to: [String(input['to'])] }, provenance: { sources: [], confidence: 1, citations: [] } }));
    const repo = {
      findResumableApproval: jest.fn(async () => Ok(makeResumable())),
      updateToolCallOutput: jest.fn(async () => Ok(undefined)),
      markApprovalApproved: jest.fn(async () => Ok(makeApprovedRow())),
    };
    const tools = { getToolByName: jest.fn(() => Ok({ definition: { name: 'send_email' }, execute })) };
    const svc = new AishaHistoryService(repo as never, tools as never);

    const r = await svc.approve(USER_ID, APPROVAL_ID);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // the real tool ran with the persisted input
      expect(execute).toHaveBeenCalledWith({ to: 'a@b.com', subject: 's', body: 'b' });
      // output persisted back with source 'tool' and a measured latency
      expect(repo.updateToolCallOutput).toHaveBeenCalledTimes(1);
      const [tcId, , source, latency] = repo.updateToolCallOutput.mock.calls[0] as [string, unknown, string, number];
      expect(tcId).toBe(TOOL_CALL_ID);
      expect(source).toBe('tool');
      expect(typeof latency).toBe('number');
      // approval flipped + executed result surfaced
      expect(repo.markApprovalApproved).toHaveBeenCalledWith(USER_ID, APPROVAL_ID);
      expect(r.data.approval.status).toBe('approved');
      expect(r.data.tool).toEqual({
        name: 'send_email',
        ok: true,
        result: { data: { messageId: 'msg_1', to: ['a@b.com'] }, provenance: { sources: [], confidence: 1, citations: [] } },
      });
    }
  });

  it('SURFACES a tool AppError (e.g. provider-missing) — not a silent no-op, and persists source tool_error', async () => {
    const toolErr = AppErr('EXTERNAL_SERVICE', "EmailSender provayderi yo'q");
    const execute = jest.fn(async () => Err(toolErr));
    const repo = {
      findResumableApproval: jest.fn(async () => Ok(makeResumable())),
      updateToolCallOutput: jest.fn(async () => Ok(undefined)),
      markApprovalApproved: jest.fn(async () => Ok(makeApprovedRow())),
    };
    const tools = { getToolByName: jest.fn(() => Ok({ definition: { name: 'send_email' }, execute })) };
    const svc = new AishaHistoryService(repo as never, tools as never);

    const r = await svc.approve(USER_ID, APPROVAL_ID);
    // tool failure is carried in the body (ok=true envelope, tool.ok=false), not thrown away
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tool.ok).toBe(false);
      expect(r.data.tool.result).toEqual(toolErr);
      const [, , source] = repo.updateToolCallOutput.mock.calls[0] as [string, unknown, string, number];
      expect(source).toBe('tool_error');
      // approval still flipped to approved (the decision was made; the side-effect failed)
      expect(r.data.approval.status).toBe('approved');
    }
  });

  it('does NOT re-execute an already-resolved approval — returns NOT_FOUND (double-execution guard)', async () => {
    const execute = jest.fn();
    const repo = {
      findResumableApproval: jest.fn(async () => Ok(null)), // not pending → not resumable
      updateToolCallOutput: jest.fn(),
      markApprovalApproved: jest.fn(),
    };
    const tools = { getToolByName: jest.fn(() => Ok({ definition: { name: 'send_email' }, execute })) };
    const svc = new AishaHistoryService(repo as never, tools as never);

    const r = await svc.approve(USER_ID, APPROVAL_ID);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(execute).not.toHaveBeenCalled();
    expect(repo.updateToolCallOutput).not.toHaveBeenCalled();
    expect(repo.markApprovalApproved).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when the tool is unknown (no execution, no flip)', async () => {
    const repo = {
      findResumableApproval: jest.fn(async () => Ok({ ...makeResumable(), toolName: 'ghost_tool' })),
      updateToolCallOutput: jest.fn(),
      markApprovalApproved: jest.fn(),
    };
    const tools = { getToolByName: jest.fn(() => Err(AppErr('NOT_FOUND', 'Tool topilmadi: ghost_tool'))) };
    const svc = new AishaHistoryService(repo as never, tools as never);

    const r = await svc.approve(USER_ID, APPROVAL_ID);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.updateToolCallOutput).not.toHaveBeenCalled();
    expect(repo.markApprovalApproved).not.toHaveBeenCalled();
  });
});
