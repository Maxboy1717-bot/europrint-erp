/**
 * test/mes/mes-sos-escalation.service.spec.ts
 *
 * MesSosEscalationService orchestrates the SOS/downtime org-chain escalation
 * (usta → bo'lim → direktor) on top of MesSosEscalationRepository. The
 * meaningful branching logic lives in the service, not the repo:
 *   - assignOnRaise: no KARTA resolved for the work_center → assigned=false,
 *     no repo writes/notifications performed.
 *   - escalateOverdue: per overdue SOS, decides exhausted vs escalated based
 *     on whether a current department / parent department exists, and
 *     increments escalation_level by exactly 1 on escalation.
 *   - resolve: thin passthrough to repo.markResolved.
 */

import { MesSosEscalationService } from '../../src/modules/mes/application/mes-sos-escalation.service';
import {
  ChainNode,
  MesSosEscalationRepository,
} from '../../src/modules/mes/infrastructure/repositories/mes-sos-escalation.repo';

function buildRepo(overrides: Partial<jest.Mocked<MesSosEscalationRepository>> = {}): jest.Mocked<MesSosEscalationRepository> {
  return {
    resolveInitialDepartment: jest.fn().mockResolvedValue(null),
    assignInitialResponsible: jest.fn().mockResolvedValue({ id: 1 }),
    getParentDepartment: jest.fn().mockResolvedValue(null),
    findOverdue: jest.fn().mockResolvedValue([]),
    escalateTo: jest.fn().mockResolvedValue({ id: 1 }),
    markChainExhausted: jest.fn().mockResolvedValue(undefined),
    notifyResponsible: jest.fn().mockResolvedValue(undefined),
    markResolved: jest.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  } as unknown as jest.Mocked<MesSosEscalationRepository>;
}

describe('MesSosEscalationService.assignOnRaise', () => {
  it('returns assigned=false and performs no writes when work_center resolves to no KARTA', async () => {
    const repo = buildRepo({ resolveInitialDepartment: jest.fn().mockResolvedValue(null) });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.assignOnRaise(5, 999, 'machine jam');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ assigned: false, sosId: 5 });
    }
    expect(repo.assignInitialResponsible).not.toHaveBeenCalled();
    expect(repo.notifyResponsible).not.toHaveBeenCalled();
  });

  it('assigns the resolved KARTA, sets level 0, and notifies its head_user_id', async () => {
    const node: ChainNode = { department_id: 3, head_user_id: 42, name: 'Usta', parent_id: 9 };
    const repo = buildRepo({
      resolveInitialDepartment: jest.fn().mockResolvedValue(node),
      assignInitialResponsible: jest.fn().mockResolvedValue({ id: 5, current_department_id: 3 }),
    });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.assignOnRaise(5, 10, 'machine jam');

    expect(repo.assignInitialResponsible).toHaveBeenCalledWith(5, node);
    expect(repo.notifyResponsible).toHaveBeenCalledWith(42, 5, 'machine jam', 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        assigned: true,
        sosId: 5,
        department_id: 3,
        user_id: 42,
      });
    }
  });
});

describe('MesSosEscalationService.escalateOverdue', () => {
  it('marks chain exhausted (no repo escalation) when current_department_id is null', async () => {
    const repo = buildRepo({
      findOverdue: jest.fn().mockResolvedValue([
        { id: 1, current_department_id: null, escalation_level: 0, reason: 'jam', escalation_history: [] },
      ]),
    });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.escalateOverdue();

    expect(repo.markChainExhausted).toHaveBeenCalledWith(1);
    expect(repo.escalateTo).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ escalated: 0, exhausted: 1 });
    }
  });

  it('marks chain exhausted when there is no parent department (chain top reached)', async () => {
    const repo = buildRepo({
      findOverdue: jest.fn().mockResolvedValue([
        { id: 2, current_department_id: 7, escalation_level: 1, reason: 'jam', escalation_history: [] },
      ]),
      getParentDepartment: jest.fn().mockResolvedValue(null),
    });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.escalateOverdue();

    expect(repo.getParentDepartment).toHaveBeenCalledWith(7);
    expect(repo.markChainExhausted).toHaveBeenCalledWith(2);
    expect(repo.escalateTo).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ escalated: 0, exhausted: 1 });
    }
  });

  it('escalates to the parent department, incrementing escalation_level by 1 and notifying the new head', async () => {
    const parent: ChainNode = { department_id: 12, head_user_id: 99, name: 'Bo\'lim', parent_id: null };
    const repo = buildRepo({
      findOverdue: jest.fn().mockResolvedValue([
        { id: 3, current_department_id: 7, escalation_level: 1, reason: 'press down', escalation_history: [{ level: 0 }] },
      ]),
      getParentDepartment: jest.fn().mockResolvedValue(parent),
    });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.escalateOverdue();

    expect(repo.escalateTo).toHaveBeenCalledWith(3, 2, parent, [{ level: 0 }]);
    expect(repo.notifyResponsible).toHaveBeenCalledWith(99, 3, 'press down', 2);
    expect(repo.markChainExhausted).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ escalated: 1, exhausted: 0 });
    }
  });

  it('aggregates escalated/exhausted counts across multiple overdue SOS rows', async () => {
    const parent: ChainNode = { department_id: 20, head_user_id: 1, name: 'Direktor', parent_id: null };
    const repo = buildRepo({
      findOverdue: jest.fn().mockResolvedValue([
        { id: 10, current_department_id: 4, escalation_level: 0, reason: 'a', escalation_history: [] },
        { id: 11, current_department_id: null, escalation_level: 0, reason: 'b', escalation_history: [] },
      ]),
      getParentDepartment: jest.fn().mockResolvedValue(parent),
    });
    const svc = new MesSosEscalationService(repo);

    const result = await svc.escalateOverdue();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ escalated: 1, exhausted: 1 });
    }
  });
});

describe('MesSosEscalationService.resolve', () => {
  it('forwards sosId and resolvedBy to repo.markResolved', async () => {
    const repo = buildRepo();
    const svc = new MesSosEscalationService(repo);

    const result = await svc.resolve(8, 4);

    expect(repo.markResolved).toHaveBeenCalledWith(8, 4);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ sosId: 8, resolved: true });
    }
  });
});
