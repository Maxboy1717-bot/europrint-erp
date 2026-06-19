/**
 * @file rulon-card.service.spec.ts
 * @description RulonCardService — unit testlar (mock repo + REAL WmsRollCalcService).
 *
 * Tasdiqlanadigan biznes-qoidalar:
 *   1. create() taxminiy uzunlikni WmsRollCalcService.estimatedLengthM orqali hisoblaydi
 *      (qo'lda hisoblangan etalon 100kg/120gsm/1000mm → 833.333 m).
 *   2. updateCurrentWeight() qoldiq uzunlikni QAYTA hisoblaydi + full→opened o'tadi.
 *   3. changeStatus() o'tish qoidalarini (full→opened→remnant) majburlaydi;
 *      noto'g'ri o'tish → Err(INVALID_TRANSITION).
 *   4. Invalid kirish (gsm=0, kenglik=0, og'irlik>boshlang'ich) → Err.
 *
 * Repo MOCK qilinadi; matematik miya REAL (Q-46 REUSE isboti).
 */

// @workspace/db dist'dan kelishi mumkin — RulonCard tipi faqat type sifatida ishlatiladi.
import { RulonCardService } from '../src/modules/wms/application/rulon-card.service';
import { WmsRollCalcService } from '../src/modules/wms/domain/services/wms-roll-calc.service';
import type {
  IRulonCardRepo,
  RulonCardCreateData,
} from '../src/modules/wms/domain/repositories/i-rulon-card.repo';
import { Ok, Err, AppErr } from '../src/common/result';

// ─── Mock repo (Q-46: faqat repo mock, matematik xizmat real) ────────────────

type AnyRow = Record<string, unknown>;

function makeMockRepo(overrides: Partial<IRulonCardRepo> = {}): jest.Mocked<IRulonCardRepo> {
  return {
    findAll: jest.fn(async () => Ok({ items: [], total: 0 })),
    findById: jest.fn(async () => Ok(null)),
    findByRollCode: jest.fn(async () => Ok(null)),
    create: jest.fn(async (data: RulonCardCreateData) => Ok({ id: 1, ...data } as unknown as never)),
    updateWeight: jest.fn(async (id, w, len, status) =>
      Ok({ id, currentWeightKg: w, estimatedLengthM: len, status: status ?? 'full' } as unknown as never),
    ),
    updateStatus: jest.fn(async (id, status) => Ok({ id, status } as unknown as never)),
    ...overrides,
  } as jest.Mocked<IRulonCardRepo>;
}

function buildService(repo: IRulonCardRepo): RulonCardService {
  // Real matematik xizmat — mock EMAS.
  return new RulonCardService(repo, new WmsRollCalcService());
}

describe('RulonCardService', () => {
  // ── 1. create() — taxminiy uzunlik WmsRollCalcService orqali ─────────────────
  describe('create', () => {
    it('taxminiy uzunlikni WmsRollCalcService orqali hisoblaydi (100kg/120gsm/1000mm → 833.333 m)', async () => {
      const repo = makeMockRepo();
      const svc = buildService(repo);

      const res = await svc.create({
        widthMm: 1000,
        grammageGsm: 120,
        initialWeightKg: 100,
        rollType: 'kraft',
      });

      expect(res.ok).toBe(true);
      // repo.create chaqirilgan va estimatedLengthM = '833.333' (DB scale 3)
      expect(repo.create).toHaveBeenCalledTimes(1);
      const passed = (repo.create as jest.Mock).mock.calls[0][0] as RulonCardCreateData;
      expect(Number(passed.estimatedLengthM)).toBeCloseTo(833.333, 2);
      // Yangi rulon = full; currentWeight = initialWeight
      expect(passed.status).toBe('full');
      expect(passed.currentWeightKg).toBe('100');
      expect(passed.rollCode).toMatch(/^RULON-\d{4}-\d{6}$/);
    });

    it('takroriy roll_code → Err(CONFLICT)', async () => {
      const repo = makeMockRepo({
        findByRollCode: jest.fn(async () => Ok({ id: 9, rollCode: 'RULON-X' } as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.create({
        rollCode: 'RULON-X',
        widthMm: 1000,
        grammageGsm: 120,
        initialWeightKg: 100,
        rollType: 'kraft',
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('CONFLICT');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('invalid o\'lcham (gramaj=0) → Err(VALIDATION), repo.create chaqirilmaydi', async () => {
      const repo = makeMockRepo();
      const svc = buildService(repo);

      const res = await svc.create({
        widthMm: 1000,
        grammageGsm: 0,
        initialWeightKg: 100,
        rollType: 'kraft',
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('VALIDATION');
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  // ── 2. updateCurrentWeight() — qoldiq uzunlik qayta hisob ────────────────────
  describe('updateCurrentWeight', () => {
    const card: AnyRow = {
      id: 5,
      widthMm: 1000,
      grammageGsm: 120,
      initialWeightKg: '100',
      currentWeightKg: '100',
      status: 'full',
    };

    it('og\'irlik 50kg ga kamaysa → uzunlik qayta hisob (416.667 m) + full→opened', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok(card as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.updateCurrentWeight(5, 50);
      expect(res.ok).toBe(true);

      expect(repo.updateWeight).toHaveBeenCalledTimes(1);
      const [, weightStr, lengthStr, nextStatus] = (repo.updateWeight as jest.Mock).mock.calls[0];
      expect(weightStr).toBe('50');
      // 50 × 1e6 / (120 × 1000) = 416.666...
      expect(Number(lengthStr)).toBeCloseTo(416.667, 2);
      expect(nextStatus).toBe('opened');
    });

    it('og\'irlik 0 → uzunlik 0 + remnant', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok(card as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.updateCurrentWeight(5, 0);
      expect(res.ok).toBe(true);
      const [, weightStr, lengthStr, nextStatus] = (repo.updateWeight as jest.Mock).mock.calls[0];
      expect(weightStr).toBe('0');
      expect(lengthStr).toBe('0');
      expect(nextStatus).toBe('remnant');
    });

    it('joriy og\'irlik boshlang\'ichdan oshsa → Err(VALIDATION)', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok(card as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.updateCurrentWeight(5, 150);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('VALIDATION');
      expect(repo.updateWeight).not.toHaveBeenCalled();
    });

    it('karta topilmasa → Err(NOT_FOUND)', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok(null)),
      });
      const svc = buildService(repo);

      const res = await svc.updateCurrentWeight(999, 10);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('NOT_FOUND');
    });
  });

  // ── 3. changeStatus() — o'tish qoidalari ─────────────────────────────────────
  describe('changeStatus', () => {
    it('full → opened RUXSAT', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok({ id: 7, status: 'full' } as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.changeStatus(7, 'opened');
      expect(res.ok).toBe(true);
      expect(repo.updateStatus).toHaveBeenCalledWith(7, 'opened');
    });

    it('full → remnant RUXSAT', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok({ id: 7, status: 'full' } as unknown as never)),
      });
      const svc = buildService(repo);
      const res = await svc.changeStatus(7, 'remnant');
      expect(res.ok).toBe(true);
    });

    it('remnant → opened TAQIQ → Err(INVALID_TRANSITION)', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok({ id: 8, status: 'remnant' } as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.changeStatus(8, 'opened');
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('INVALID_TRANSITION');
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('opened → full TAQIQ → Err(INVALID_TRANSITION)', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok({ id: 9, status: 'opened' } as unknown as never)),
      });
      const svc = buildService(repo);

      const res = await svc.changeStatus(9, 'full');
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('INVALID_TRANSITION');
    });
  });

  // ── 4. getById ───────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('mavjud bo\'lsa Ok(card)', async () => {
      const repo = makeMockRepo({
        findById: jest.fn(async () => Ok({ id: 3, rollCode: 'RULON-3' } as unknown as never)),
      });
      const svc = buildService(repo);
      const res = await svc.getById(3);
      expect(res.ok).toBe(true);
    });

    it('topilmasa Err(NOT_FOUND)', async () => {
      const repo = makeMockRepo({ findById: jest.fn(async () => Ok(null)) });
      const svc = buildService(repo);
      const res = await svc.getById(404);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('NOT_FOUND');
    });

    it('repo xato qaytarsa Err propagate', async () => {
      const repo = makeMockRepo({ findById: jest.fn(async () => Err(AppErr('DB_ERROR', 'db down'))) });
      const svc = buildService(repo);
      const res = await svc.getById(1);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('DB_ERROR');
    });
  });
});
