/**
 * org-ai-exam-card.spec.ts — ORG Phase 4B: per-card AI exam wiring (AiExamService).
 *
 * Covers the card-scoped methods (assignExamToCard / getAttemptsByCard) delegating to the
 * repo with org_function_id + razryad, and wires AiExamController for the Q-29 test gate.
 */

import { AiExamService } from '../src/modules/ai/application/services/ai-exam.service';
import { AiExamController } from '../src/modules/ai/presentation/ai-exam.controller';
import type { DrizzleAiExamRepo } from '../src/modules/ai/infrastructure/repositories/drizzle-ai-exam.repo';
import { Ok, isOk } from '../src/common/result';

function makeRepo(over: Partial<Record<keyof DrizzleAiExamRepo, jest.Mock>> = {}): DrizzleAiExamRepo {
  return {
    findAllAttempts:    jest.fn().mockResolvedValue(Ok([])),
    findAttemptById:    jest.fn().mockResolvedValue(Ok(null)),
    assignExam:         jest.fn().mockResolvedValue(Ok({})),
    submitAttempt:      jest.fn().mockResolvedValue(Ok({})),
    deleteAttempt:      jest.fn().mockResolvedValue(Ok(undefined)),
    assignExamToCard:   jest.fn().mockResolvedValue(Ok({ id: 1, status: 'assigned', questionCount: 3 })),
    findAttemptsByCard: jest.fn().mockResolvedValue(Ok([{ id: 1, status: 'assigned' }])),
    ...over,
  } as unknown as DrizzleAiExamRepo;
}

describe('ORG per-card AI exam (AiExamService)', () => {
  it('AiExamController is wired to AiExamService', () => {
    const ctrl = new AiExamController(new AiExamService(makeRepo()));
    expect(ctrl).toBeInstanceOf(AiExamController);
  });

  it('assignExamToCard → delegates to repo with userId + orgFunctionId + razryadLevelId', async () => {
    const assign = jest.fn().mockResolvedValue(Ok({ id: 9, status: 'assigned', questionCount: 5 }));
    const svc = new AiExamService(makeRepo({ assignExamToCard: assign }));
    const r = await svc.assignExamToCard(6, 1, 4);
    expect(assign).toHaveBeenCalledWith(6, 1, 4);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.status).toBe('assigned');
  });

  it('assignExamToCard → null razryad passes through (razryad-agnostic pool)', async () => {
    const assign = jest.fn().mockResolvedValue(Ok({ id: 10, status: 'assigned', questionCount: 2 }));
    const svc = new AiExamService(makeRepo({ assignExamToCard: assign }));
    await svc.assignExamToCard(7, 2, null);
    expect(assign).toHaveBeenCalledWith(7, 2, null);
  });

  it('getAttemptsByCard → delegates to repo and returns the card attempts', async () => {
    const find = jest.fn().mockResolvedValue(Ok([{ id: 1, status: 'assigned' }, { id: 2, status: 'submitted' }]));
    const svc = new AiExamService(makeRepo({ findAttemptsByCard: find }));
    const r = await svc.getAttemptsByCard(1);
    expect(find).toHaveBeenCalledWith(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.length).toBe(2);
  });
});
