/**
 * test/mm/vendors.service.spec.ts
 *
 * VendorsService — CRUD over VendorsRepository. findAll returns the standard
 * pagination envelope; create normalises optional fields; remove triggers
 * soft-delete via repo.deactivate.
 */

import { VendorsService } from '../../src/modules/mm/vendors/vendors.service';
import { VendorsRepository } from '../../src/modules/mm/vendors/vendors.repository';

function buildRepo(overrides: Partial<jest.Mocked<VendorsRepository>> = {}): jest.Mocked<VendorsRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [], total: 0 } }),
    findOne: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    deactivate: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  } as unknown as jest.Mocked<VendorsRepository>;
}

const fakeI18n = { t: jest.fn().mockResolvedValue('Topilmadi') } as never;

describe('VendorsService', () => {
  it('findAll wraps repository rows in a pagination envelope with defaults', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({
        ok: true,
        data: { data: [{ id: 1, name: 'V1' }], total: 1 },
      }),
    });
    const svc = new VendorsService(repo, fakeI18n);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    expect(repo.findAll).toHaveBeenCalledWith(1, 10);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { total: 1, page: 1, limit: 10 } });
  });

  it('findAll honours supplied page and limit', async () => {
    const repo = buildRepo();
    const svc = new VendorsService(repo, fakeI18n);

    await svc.findAll({ page: 5, limit: 50 });

    expect(repo.findAll).toHaveBeenCalledWith(5, 50);
  });

  it('create normalises optional fields and forwards createdBy as string', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 99, name: 'Acme' } }),
    });
    const svc = new VendorsService(repo, fakeI18n);

    const r = await svc.create({ name: 'Acme', code: 'A-1', isActive: true }, 7);

    expect(r.ok).toBe(true);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme',
      code: 'A-1',
      isActive: true,
      createdBy: '7',
    }));
  });

  it('create defaults isActive to true and uses empty string for missing name', async () => {
    const repo = buildRepo();
    const svc = new VendorsService(repo, fakeI18n);

    await svc.create({});

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: '',
      isActive: true,
    }));
  });

  it('update forwards the patch dto to the repository after existence check', async () => {
    const repo = buildRepo({
      update: jest.fn().mockResolvedValue({ ok: true, data: { id: 4, name: 'Renamed' } }),
    });
    const svc = new VendorsService(repo, fakeI18n);

    const r = await svc.update(4, { name: 'Renamed' });

    expect(repo.update).toHaveBeenCalledWith(4, { name: 'Renamed' });
    expect(r.ok).toBe(true);
  });

  it('remove deactivates the vendor and returns localized confirmation', async () => {
    const repo = buildRepo();
    const svc = new VendorsService(repo, fakeI18n);

    const r = await svc.remove(13);

    expect(repo.deactivate).toHaveBeenCalledWith(13);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
  });
});
