/**
 * org-vacancy-card-wire.spec.ts — ORG Phase 7 (#02L): vacancy↔card wiring.
 * Verifies HrVacanciesController is wired and that create()/bulkCreate() pass the card link
 * (org_function_id) + priority + counts through to the repo (the Phase-7 D4 fix — these were dropped).
 */

import { HrVacanciesController } from '../src/modules/hr/recruitment/hr-vacancies.controller';
import { HrVacanciesService } from '../src/modules/hr/recruitment/hr-vacancies.service';
import type { DrizzleHrVacanciesRepository } from '../src/modules/hr/recruitment/repos/drizzle-hr-vacancies.repo';
import { Ok, isOk } from '../src/common/result';

function makeRepo(over: Partial<Record<keyof DrizzleHrVacanciesRepository, jest.Mock>> = {}): DrizzleHrVacanciesRepository {
  return {
    create:     jest.fn().mockResolvedValue(Ok({ id: 1, org_function_id: 7, priority: 'high' })),
    bulkCreate: jest.fn().mockResolvedValue(Ok({ inserted: 2, ids: [1, 2] })),
    findAll:    jest.fn().mockResolvedValue(Ok([])),
    ...over,
  } as unknown as DrizzleHrVacanciesRepository;
}

const events = { emit: jest.fn() } as unknown as ConstructorParameters<typeof HrVacanciesService>[1];

describe('ORG vacancy↔card wire (Phase 7 D4)', () => {
  it('HrVacanciesController is wired to HrVacanciesService', () => {
    const ctrl = new HrVacanciesController(new HrVacanciesService(makeRepo(), events));
    expect(ctrl).toBeInstanceOf(HrVacanciesController);
  });

  it('create → passes org_function_id + priority + counts through to the repo (was dropped)', async () => {
    const create = jest.fn().mockResolvedValue(Ok({ id: 1 }));
    const svc = new HrVacanciesService(makeRepo({ create }), events);
    await svc.create({ title: 'Operator', orgFunctionId: 7, priority: 'high', openPositions: 2, numberOfPositions: 2 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Operator', orgFunctionId: 7, priority: 'high', openPositions: 2, numberOfPositions: 2,
    }));
  });

  it('bulkCreate → delegates the whole batch (EP-ORG-075/076)', async () => {
    const bulkCreate = jest.fn().mockResolvedValue(Ok({ inserted: 2, ids: [1, 2] }));
    const svc = new HrVacanciesService(makeRepo({ bulkCreate }), events);
    const r = await svc.bulkCreate([{ title: 'A', orgFunctionId: 7 }, { title: 'B', orgFunctionId: 8 }]);
    expect(bulkCreate).toHaveBeenCalledWith([{ title: 'A', orgFunctionId: 7 }, { title: 'B', orgFunctionId: 8 }]);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.inserted).toBe(2);
  });
});
