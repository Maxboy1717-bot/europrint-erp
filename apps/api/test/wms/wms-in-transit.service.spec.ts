/**
 * @file wms-in-transit.service.spec.ts
 * @description Import xom-ashyo YO'LDA kuzatuvi — WmsInTransitService unit testlari
 *   (mock repo, DB ga tegmaydi).
 *
 * Qoplangan stsenariylar:
 *   1. Holat-mashinasi: shipped → customs → arrived; noto'g'ri o'tishlar BLOK.
 *   2. markArrived: "arrived" bo'lganda karantin darvozasiga DRAFT qabul ochiladi
 *      (createGoodsReceiptDraft) va goodsReceiptId jo'natmaga biriktiriladi.
 *   3. markArrived: goods-receipt yaratish muvaffaqiyatsiz bo'lsa, holat
 *      YANGILANMAYDI (updateStatus chaqirilmaydi).
 *   4. cancel: faqat shipped/customs holatidan ruxsat (arrived dan bekor qilib
 *      bo'lmaydi — IN_TRANSIT_TRANSITIONS.arrived = []).
 *   5. NOT_FOUND: getOne/markCustoms/markArrived/cancel/addDocument mavjud
 *      bo'lmagan jo'natma uchun.
 *   6. list/listDocuments/create/addDocument — repo'ga to'g'ri delegatsiya.
 */

import { WmsInTransitService } from '../../src/modules/wms/application/wms-in-transit.service';
import type { IWmsInTransitRepo } from '../../src/modules/wms/domain/repositories/i-wms-in-transit.repo';
import { Ok, Err } from '../../src/common/result';

type Row = Record<string, unknown>;

// ─── Mock repo factory ───────────────────────────────────────────────────────
function makeMockRepo(initialStatus: string | null, id = 1): {
  repo: jest.Mocked<IWmsInTransitRepo>;
  currentStatus: () => string | null;
} {
  let current: string | null = initialStatus;

  const repo: jest.Mocked<IWmsInTransitRepo> = {
    listShipments: jest.fn(async () => Ok<Row[]>([{ id, status: current }])),
    findShipment: jest.fn(async (shipmentId: number) =>
      shipmentId === id ? Ok<Row | null>({ id, status: current }) : Ok<Row | null>(null),
    ),
    createShipment: jest.fn(async (body: Row) => Ok<Row>({ id, status: 'shipped', ...body })),
    updateStatus: jest.fn(async (_id: number, status: string, patch?: Row) => {
      current = status;
      return Ok<Row>({ id, status, ...(patch ?? {}) });
    }),
    createGoodsReceiptDraft: jest.fn(async () => Ok<{ id: number }>({ id: 501 })),
    listDocuments: jest.fn(async () => Ok<Row[]>([{ id: 1, type: 'invoice' }])),
    addDocument: jest.fn(async (shipmentId: number, body: Row) =>
      Ok<Row>({ id: 1, shipmentId, ...body }),
    ),
  };

  return { repo, currentStatus: () => current };
}

describe('WmsInTransitService (mock repo)', () => {
  describe('markCustoms (shipped → customs)', () => {
    it("shipped holatidagi jo'natma customs ga o'tadi", async () => {
      const { repo, currentStatus } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.markCustoms(1, 42, '2026-07-01');

      expect(res.ok).toBe(true);
      expect(repo.updateStatus).toHaveBeenCalledWith(1, 'customs', { customsDate: '2026-07-01' });
      expect(currentStatus()).toBe('customs');
    });

    it("customs holatidan customs ga qayta o'tish — noto'g'ri o'tish (Err)", async () => {
      const { repo } = makeMockRepo('customs');
      const svc = new WmsInTransitService(repo);

      const res = await svc.markCustoms(1, 42);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it("mavjud bo'lmagan jo'natma → NOT_FOUND", async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.markCustoms(999, 42);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });
  });

  describe('markArrived (customs → arrived, karantin darvozasi)', () => {
    it("customs holatidagi jo'natma arrived ga o'tadi va DRAFT qabul ochiladi", async () => {
      const { repo, currentStatus } = makeMockRepo('customs');
      const svc = new WmsInTransitService(repo);

      const res = await svc.markArrived(1, 42, '2026-07-02');

      expect(res.ok).toBe(true);
      expect(repo.createGoodsReceiptDraft).toHaveBeenCalledTimes(1);
      expect(repo.updateStatus).toHaveBeenCalledWith(1, 'arrived', {
        arrivedDate: '2026-07-02',
        goodsReceiptId: 501,
      });
      expect(currentStatus()).toBe('arrived');
    });

    it("shipped dan to'g'ridan arrived ga o'tish — noto'g'ri o'tish (Err), darvoza ochilmaydi", async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.markArrived(1, 42);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(repo.createGoodsReceiptDraft).not.toHaveBeenCalled();
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it("karantin qabul yaratish muvaffaqiyatsiz bo'lsa — holat YANGILANMAYDI", async () => {
      const { repo, currentStatus } = makeMockRepo('customs');
      repo.createGoodsReceiptDraft.mockResolvedValueOnce(
        Err({ code: 'DB_ERROR', message: 'karantin qabul ochilmadi' }),
      );
      const svc = new WmsInTransitService(repo);

      const res = await svc.markArrived(1, 42);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
      expect(repo.updateStatus).not.toHaveBeenCalled();
      expect(currentStatus()).toBe('customs');
    });
  });

  describe('cancel', () => {
    it("shipped holatidan bekor qilinadi", async () => {
      const { repo, currentStatus } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.cancel(1);

      expect(res.ok).toBe(true);
      expect(currentStatus()).toBe('cancelled');
    });

    it("arrived holatidan bekor qilib bo'lmaydi (yakuniy holat)", async () => {
      const { repo } = makeMockRepo('arrived');
      const svc = new WmsInTransitService(repo);

      const res = await svc.cancel(1);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it("mavjud bo'lmagan jo'natma → NOT_FOUND", async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.cancel(999);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });
  });

  describe('getOne / create / list / documents — repo delegatsiyasi', () => {
    it('getOne: topilsa Ok(data)', async () => {
      const { repo } = makeMockRepo('shipped', 7);
      const svc = new WmsInTransitService(repo);

      const res = await svc.getOne(7);

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toMatchObject({ id: 7, status: 'shipped' });
    });

    it('getOne: topilmasa NOT_FOUND', async () => {
      const { repo } = makeMockRepo('shipped', 7);
      const svc = new WmsInTransitService(repo);

      const res = await svc.getOne(999);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });

    it('create: repo.createShipment ga to\'g\'ri argumentlar bilan delegatsiya', async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);
      const body = { supplierName: 'ACME', cargoDescription: 'gofra qog\'oz' };

      const res = await svc.create(body, 42);

      expect(repo.createShipment).toHaveBeenCalledWith(body, 42);
      expect(res.ok).toBe(true);
    });

    it('list: status filtri repo ga uzatiladi', async () => {
      const { repo } = makeMockRepo('customs');
      const svc = new WmsInTransitService(repo);

      await svc.list('customs');

      expect(repo.listShipments).toHaveBeenCalledWith('customs');
    });

    it('listDocuments: repo.listDocuments ga delegatsiya', async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.listDocuments(1);

      expect(repo.listDocuments).toHaveBeenCalledWith(1);
      expect(res.ok).toBe(true);
    });

    it('addDocument: jo\'natma mavjud bo\'lsa repo.addDocument chaqiriladi', async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);
      const doc = { type: 'invoice', number: 'INV-1' };

      const res = await svc.addDocument(1, doc, 42);

      expect(repo.addDocument).toHaveBeenCalledWith(1, doc, 42);
      expect(res.ok).toBe(true);
    });

    it('addDocument: jo\'natma topilmasa NOT_FOUND, repo.addDocument chaqirilmaydi', async () => {
      const { repo } = makeMockRepo('shipped');
      const svc = new WmsInTransitService(repo);

      const res = await svc.addDocument(999, { type: 'invoice' }, 42);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
      expect(repo.addDocument).not.toHaveBeenCalled();
    });
  });
});
