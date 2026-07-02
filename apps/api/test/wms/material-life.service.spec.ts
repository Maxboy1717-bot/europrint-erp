/**
 * @file material-life.service.spec.ts
 * @description MaterialLifeService (W4-MATERIAL-LIFE) — unit testlar (mock repo).
 *
 * Qoplangan stsenariylar (Q-40 real enforcement):
 *   1. getLife: materialId validatsiyasi, NOT_FOUND, muvaffaqiyatli o'qish, repo xatosi.
 *   2. updateLife: materialId validatsiyasi, mavjud emas → NOT_FOUND (yozilmaydi),
 *      mavjud → repo.updateLifeAttrs chaqiriladi.
 *   3. listSubstitutes: materialId validatsiyasi.
 *   4. addSubstitute: materialId/substituteId validatsiyasi, o'z-o'ziga analog
 *      taqiqi (materialId === substituteId), ikkala tomon mavjudligi tekshiruvi,
 *      sukut qiymatlar (priority/isApproved/notes).
 *   5. removeSubstitute: id validatsiyasi.
 *   6. getAgingAlerts / getHazardStock: to'g'ridan repo'ga o'tkazish (passthrough).
 *
 * Mock repo — DB ga tegmaydi; faqat servis mantig'i (validatsiya + orkestratsiya)
 * tekshiriladi (test/wms/wms-quarantine-gate.service.spec.ts uslubiga mos).
 */

// Shared DB stub — application servislari @common/result orqali shared/db ni
// transitive reference qilishi mumkin.
jest.mock('../../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { MaterialLifeService } from '../../src/modules/wms/application/material-life.service';
import type {
  IMaterialLifeRepo,
  MaterialLifeView,
  SubstituteRow,
  CreateSubstituteInput,
} from '../../src/modules/wms/domain/repositories/i-material-life.repo';
import { SUBSTITUTE_DEFAULT_PRIORITY } from '../../src/modules/wms/domain/constants/material-life.constants';
import { Ok, Err } from '../../src/common/result';

function makeLifeView(materialId: number): MaterialLifeView {
  return {
    materialId,
    name: 'Test material',
    ownerType: 'own',
    hazardClass: null,
    storageCondition: null,
    ageAlertDays: null,
    isRecyclable: false,
    palletUnitQty: null,
    isSample: false,
  };
}

function makeMockRepo(overrides: Partial<jest.Mocked<IMaterialLifeRepo>> = {}): jest.Mocked<IMaterialLifeRepo> {
  return {
    materialExists: jest.fn(async () => Ok(true)),
    getLifeView: jest.fn(async (materialId: number) => Ok(makeLifeView(materialId))),
    updateLifeAttrs: jest.fn(async (materialId: number) => Ok(makeLifeView(materialId))),
    listSubstitutes: jest.fn(async () => Ok<SubstituteRow[]>([])),
    addSubstitute: jest.fn(async (input: CreateSubstituteInput) =>
      Ok<SubstituteRow>({
        id: 1,
        materialId: input.materialId,
        substituteId: input.substituteId,
        substituteName: 'Analog',
        priority: input.priority,
        isApproved: input.isApproved,
        notes: input.notes,
      }),
    ),
    removeSubstitute: jest.fn(async () => Ok(undefined)),
    listAgingAlerts: jest.fn(async () => Ok([])),
    listHazardStock: jest.fn(async () => Ok([])),
    ...overrides,
  };
}

describe('MaterialLifeService', () => {
  describe('getLife', () => {
    it('noto\'g\'ri materialId (0) → VALIDATION, repo chaqirilmaydi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.getLife(0);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.getLifeView).not.toHaveBeenCalled();
    });

    it('noto\'g\'ri materialId (butun son emas) → VALIDATION', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.getLife(1.5);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('repo null qaytarsa → NOT_FOUND', async () => {
      const repo = makeMockRepo({ getLifeView: jest.fn(async () => Ok(null)) });
      const svc = new MaterialLifeService(repo);

      const res = await svc.getLife(5);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });

    it('mavjud material → Ok(view)', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.getLife(5);

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.materialId).toBe(5);
    });

    it('repo DB xatosi propagatsiya qilinadi', async () => {
      const repo = makeMockRepo({
        getLifeView: jest.fn(async () => Err({ code: 'DB_ERROR', message: 'boom' })),
      });
      const svc = new MaterialLifeService(repo);

      const res = await svc.getLife(5);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
    });
  });

  describe('updateLife', () => {
    it('noto\'g\'ri materialId → VALIDATION, materialExists chaqirilmaydi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.updateLife(-1, { hazardClass: 'toxic' });

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.materialExists).not.toHaveBeenCalled();
    });

    it('material mavjud emas → NOT_FOUND, updateLifeAttrs YOZILMAYDI', async () => {
      const repo = makeMockRepo({ materialExists: jest.fn(async () => Ok(false)) });
      const svc = new MaterialLifeService(repo);

      const res = await svc.updateLife(5, { hazardClass: 'toxic' });

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
      expect(repo.updateLifeAttrs).not.toHaveBeenCalled();
    });

    it('material mavjud → repo.updateLifeAttrs berilgan atributlar bilan chaqiriladi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.updateLife(5, { hazardClass: 'flammable', isRecyclable: true });

      expect(res.ok).toBe(true);
      expect(repo.updateLifeAttrs).toHaveBeenCalledWith(5, { hazardClass: 'flammable', isRecyclable: true });
    });

    it('materialExists DB xatosi propagatsiya qilinadi', async () => {
      const repo = makeMockRepo({
        materialExists: jest.fn(async () => Err({ code: 'DB_ERROR', message: 'boom' })),
      });
      const svc = new MaterialLifeService(repo);

      const res = await svc.updateLife(5, {});

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
      expect(repo.updateLifeAttrs).not.toHaveBeenCalled();
    });
  });

  describe('listSubstitutes', () => {
    it('noto\'g\'ri materialId → VALIDATION', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.listSubstitutes(0);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.listSubstitutes).not.toHaveBeenCalled();
    });

    it('to\'g\'ri materialId → repo.listSubstitutes chaqiriladi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.listSubstitutes(7);

      expect(res.ok).toBe(true);
      expect(repo.listSubstitutes).toHaveBeenCalledWith(7);
    });
  });

  describe('addSubstitute', () => {
    it('noto\'g\'ri materialId → VALIDATION', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(0, { substituteId: 2 }, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.materialExists).not.toHaveBeenCalled();
    });

    it('noto\'g\'ri substituteId → VALIDATION', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(1, { substituteId: -5 }, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.materialExists).not.toHaveBeenCalled();
    });

    it('materialId === substituteId → VALIDATION (o\'z-o\'ziga analog taqiq), repo chaqirilmaydi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(3, { substituteId: 3 }, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.materialExists).not.toHaveBeenCalled();
      expect(repo.addSubstitute).not.toHaveBeenCalled();
    });

    it('asosiy material mavjud emas → NOT_FOUND', async () => {
      const repo = makeMockRepo({
        materialExists: jest.fn(async (id: number) => Ok(id !== 1)),
      });
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(1, { substituteId: 2 }, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
      expect(repo.addSubstitute).not.toHaveBeenCalled();
    });

    it('analog material mavjud emas → NOT_FOUND', async () => {
      const repo = makeMockRepo({
        materialExists: jest.fn(async (id: number) => Ok(id !== 2)),
      });
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(1, { substituteId: 2 }, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
      expect(repo.addSubstitute).not.toHaveBeenCalled();
    });

    it('ikkala material mavjud, priority berilmagan → SUBSTITUTE_DEFAULT_PRIORITY va isApproved=true sukut qiymatlar bilan yaratiladi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(1, { substituteId: 2 }, 9);

      expect(res.ok).toBe(true);
      expect(repo.addSubstitute).toHaveBeenCalledWith({
        materialId: 1,
        substituteId: 2,
        priority: SUBSTITUTE_DEFAULT_PRIORITY,
        isApproved: true,
        notes: null,
        createdBy: 9,
      });
    });

    it('berilgan priority/isApproved/notes qiymatlar sukutni bekor qiladi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.addSubstitute(
        1,
        { substituteId: 2, priority: 5, isApproved: false, notes: 'sinov uchun' },
        9,
      );

      expect(res.ok).toBe(true);
      expect(repo.addSubstitute).toHaveBeenCalledWith({
        materialId: 1,
        substituteId: 2,
        priority: 5,
        isApproved: false,
        notes: 'sinov uchun',
        createdBy: 9,
      });
    });
  });

  describe('removeSubstitute', () => {
    it('noto\'g\'ri id → VALIDATION, repo chaqirilmaydi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.removeSubstitute(0, 1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.removeSubstitute).not.toHaveBeenCalled();
    });

    it('to\'g\'ri id → repo.removeSubstitute userId bilan chaqiriladi', async () => {
      const repo = makeMockRepo();
      const svc = new MaterialLifeService(repo);

      const res = await svc.removeSubstitute(4, 9);

      expect(res.ok).toBe(true);
      expect(repo.removeSubstitute).toHaveBeenCalledWith(4, 9);
    });
  });

  describe('getAgingAlerts / getHazardStock (passthrough)', () => {
    it('getAgingAlerts repo.listAgingAlerts natijasini qaytaradi', async () => {
      const repo = makeMockRepo({
        listAgingAlerts: jest.fn(async () =>
          Ok([{ stockId: 1, materialId: 2, materialName: 'X', warehouseId: 1, quantity: 10, ageDays: 30, ageAlertDays: 20 }]),
        ),
      });
      const svc = new MaterialLifeService(repo);

      const res = await svc.getAgingAlerts();

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toHaveLength(1);
    });

    it('getHazardStock repo.listHazardStock natijasini qaytaradi', async () => {
      const repo = makeMockRepo({ listHazardStock: jest.fn(async () => Ok([makeLifeView(9)])) });
      const svc = new MaterialLifeService(repo);

      const res = await svc.getHazardStock();

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([makeLifeView(9)]);
    });
  });
});
