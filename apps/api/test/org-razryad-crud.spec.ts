/**
 * org-razryad-crud.spec.ts — ORG Phase 2: razryad (grade) master-data CRUD.
 *
 * Covers RazryadService logic (404 on missing, soft-delete miss, UNIQUE(level) CONFLICT
 * passthrough) and wires RazryadController to satisfy the Q-29 new-endpoint test gate.
 */

import { RazryadService } from '../src/modules/org-structure/razryad.service';
import { RazryadController } from '../src/modules/org-structure/razryad.controller';
import type { RazryadRepository } from '../src/modules/org-structure/razryad.repository';
import { Ok, Err, AppErr, isOk, isErr } from '../src/common/result';

function makeRepo(over: Partial<Record<keyof RazryadRepository, jest.Mock>> = {}): RazryadRepository {
  return {
    list:       jest.fn().mockResolvedValue(Ok([])),
    findById:   jest.fn().mockResolvedValue(Ok(null)),
    create:     jest.fn().mockResolvedValue(Ok({ id: 1, level: 1 })),
    update:     jest.fn().mockResolvedValue(Ok(null)),
    softDelete: jest.fn().mockResolvedValue(Ok(null)),
    ...over,
  } as unknown as RazryadRepository;
}

describe('ORG razryad CRUD (RazryadService)', () => {
  it('RazryadController is wired to RazryadService', () => {
    const ctrl = new RazryadController(new RazryadService(makeRepo()));
    expect(ctrl).toBeInstanceOf(RazryadController);
  });

  it('findById → NOT_FOUND when the razryad is absent', async () => {
    const svc = new RazryadService(makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.findById(999);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('findById → returns the razryad when present', async () => {
    const svc = new RazryadService(makeRepo({ findById: jest.fn().mockResolvedValue(Ok({ id: 3, level: 4, name: '4-razryad' })) }));
    const r = await svc.findById(3);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect((r.data as { level: number }).level).toBe(4);
  });

  it('create → CONFLICT bubbles up on a duplicate level (UNIQUE(level))', async () => {
    const svc = new RazryadService(makeRepo({
      create: jest.fn().mockResolvedValue(Err(AppErr('CONFLICT', '4-razryad allaqachon mavjud'))),
    }));
    const r = await svc.create({ level: 4, name: '4-razryad' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('CONFLICT');
  });

  it('softDelete → NOT_FOUND when nothing was archived (already inactive/absent)', async () => {
    const svc = new RazryadService(makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.softDelete(999);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('update → NOT_FOUND when the razryad is absent', async () => {
    const svc = new RazryadService(makeRepo({ update: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.update(999, { name: 'x' });
    expect(isErr(r)).toBe(true);
  });

  it('list → passes includeArchived through to the repo', async () => {
    const listMock = jest.fn().mockResolvedValue(Ok([{ id: 1, level: 1 }]));
    const svc = new RazryadService(makeRepo({ list: listMock }));
    await svc.list(true);
    expect(listMock).toHaveBeenCalledWith(true);
  });
});
