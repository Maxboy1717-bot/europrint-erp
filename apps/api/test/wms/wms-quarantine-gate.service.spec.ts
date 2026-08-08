/**
 * @file wms-quarantine-gate.service.spec.ts
 * @description WMS karantin 5-bosqichli darvozasi — unit testlar (mock repo).
 *
 * Qoplangan stsenariylar (Q-40 real enforcement):
 *   1. KARANTIN holatidagi qabul QC_PASS siz MAIN ga o'tolmaydi (BLOK).
 *   2. QC_PASS holatidagi qabul MAIN ga o'tadi (ruxsat).
 *   3. Og'irlik ±2% ichida → auto-qabul (approval kerak emas).
 *   4. Og'irlik ±2% dan yuqori → menejer bayrog'i + majburiy sabab shart (BLOK).
 *   5. Noto'g'ri o'tish (masalan DRAFT → MAIN, KARANTIN → MAIN) → Err.
 *   6. QC qarori: QABUL → QC_PASS, CHIQARISH → REJECT (faqat KARANTIN dan).
 *   7. TOCTOU guard (VISION-3340 #41): SELECT ↔ UPDATE oynasida holat parallel
 *      o'zgargan bo'lsa → Err('CONFLICT'), yozuv muvaffaqiyat deb hisoblanMAYdi;
 *      repository UPDATE ga `AND status IS NOT DISTINCT FROM <expected>` guard
 *      qo'shadi va 0-qator RETURNING ni CONFLICT ga aylantiradi.
 *
 * Mock repo — DB ga tegmaydi; faqat darvoza mantig'i tekshiriladi.
 * Repository SQL matni esa drizzle PgDialect (sqlToQuery) orqali tekshiriladi —
 * xuddi test/iot/iot-tablet.controller.material-return-upsert.spec.ts naqshi.
 */

// Shared DB stub — domen/application servislari @common/result orqali
// shared/db ni transitive reference qilishi mumkin.
jest.mock('../../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { runQuery } from '../../src/shared/db';
import { QuarantineGateService } from '../../src/modules/wms/domain/services/quarantine-gate.service';
import { WmsQuarantineGateService } from '../../src/modules/wms/application/wms-quarantine-gate.service';
import { WmsQuarantineRepository } from '../../src/modules/wms/infrastructure/repositories/wms-quarantine.repository';
import type {
  IWmsQuarantineRepo,
  ReceiptStatusRow,
} from '../../src/modules/wms/domain/repositories/i-wms-quarantine.repo';
import { Ok, Err } from '../../src/common/result';

/** Interfeys bilan bir xil audit shakli (mock impl'larda takror yozmaslik uchun). */
type UpdateAudit = {
  userId?: number | null;
  completed?: boolean;
  note?: string | null;
  expectedStatus?: string | null;
};

// ─── Mock repo factory ───────────────────────────────────────────────────────
function makeMockRepo(initialStatus: string | null, id = 1): {
  repo: jest.Mocked<IWmsQuarantineRepo>;
  lastUpdate: () => { status: string } | null;
} {
  let current = initialStatus;
  let captured: { status: string } | null = null;

  const repo: jest.Mocked<IWmsQuarantineRepo> = {
    findReceiptStatus: jest.fn(async (receiptId: number) =>
      receiptId === id
        ? Ok<ReceiptStatusRow | null>({ id, status: current })
        : Ok<ReceiptStatusRow | null>(null),
    ),
    updateReceiptStatus: jest.fn(async (_receiptId: number, status: string, audit?: UpdateAudit) => {
      // Real repo guard'iga sodiq mock (VISION-3340 #41): expectedStatus
      // berilsa va joriy holatga mos kelmasa — 0 qator → CONFLICT, yozuv YO'Q.
      if (audit && audit.expectedStatus !== undefined && audit.expectedStatus !== current) {
        return Err<ReceiptStatusRow>({ code: 'CONFLICT', message: `Qabul ${id}: holat parallel o'zgargan` });
      }
      current = status;
      captured = { status };
      return Ok<ReceiptStatusRow>({ id, status });
    }),
  };

  return { repo, lastUpdate: () => captured };
}

/**
 * TOCTOU poygasini simulyatsiya qiluvchi repo: findReceiptStatus ESKI (stale)
 * holatni qaytaradi, updateReceiptStatus esa guard'ni haqiqiy DB holatiga
 * (actualDbStatus — parallel tranzaksiya allaqachon o'zgartirgan) qarshi
 * tekshiradi. Guard uzatilmasa yozuv "muvaffaqiyatli" o'tib ketadi — shu
 * bilan servis guard'ni HAR DOIM uzatishi ham isbotlanadi.
 */
function makeRacyRepo(readStatus: string, actualDbStatus: string, id = 1): jest.Mocked<IWmsQuarantineRepo> {
  return {
    findReceiptStatus: jest.fn(async () => Ok<ReceiptStatusRow | null>({ id, status: readStatus })),
    updateReceiptStatus: jest.fn(async (_receiptId: number, status: string, audit?: UpdateAudit) => {
      if (audit?.expectedStatus !== undefined && audit.expectedStatus !== actualDbStatus) {
        return Err<ReceiptStatusRow>({ code: 'CONFLICT', message: `Qabul ${id}: holat parallel o'zgargan` });
      }
      return Ok<ReceiptStatusRow>({ id, status });
    }),
  };
}

describe('QuarantineGateService (sof domen)', () => {
  const gate = new QuarantineGateService();

  describe('validateTransition / canPostToMain', () => {
    it('KARANTIN → MAIN: ruxsat ETILMAYDI (QC_PASS shart)', () => {
      const r = gate.validateTransition('KARANTIN', 'MAIN');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
    });

    it('QC_PASS → MAIN: ruxsat ETILADI', () => {
      const r = gate.validateTransition('QC_PASS', 'MAIN');
      expect(r.ok).toBe(true);
    });

    it('DRAFT → MAIN: noto\'g\'ri o\'tish → Err', () => {
      const r = gate.validateTransition('DRAFT', 'MAIN');
      expect(r.ok).toBe(false);
    });

    it('DRAFT → KARANTIN: ruxsat ETILADI', () => {
      const r = gate.validateTransition('DRAFT', 'KARANTIN');
      expect(r.ok).toBe(true);
    });

    it('canPostToMain: KARANTIN holatida BLOK (BUSINESS_RULE_VIOLATION)', () => {
      const r = gate.canPostToMain('KARANTIN');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('canPostToMain: QC_PASS holatida ruxsat', () => {
      const r = gate.canPostToMain('QC_PASS');
      expect(r.ok).toBe(true);
    });

    it('noma\'lum holat → INVALID_TRANSITION', () => {
      const r = gate.validateTransition('FOO', 'MAIN');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
    });

    it('legacy "completed" → MAIN, "draft" → DRAFT normalizatsiya', () => {
      // 'completed' = MAIN; MAIN dan boshqa holatga o'tish yo'q
      expect(gate.validateTransition('draft', 'karantin').ok).toBe(true);
      expect(gate.canPostToMain('passed').ok).toBe(true); // passed -> QC_PASS
    });
  });

  describe('checkWeightTolerance (±2%)', () => {
    it('±2% ichida (1%) → auto-qabul, approval kerak emas', () => {
      const r = gate.checkWeightTolerance({ expected: 100, actual: 101 });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.withinTolerance).toBe(true);
        expect(r.data.requiresApproval).toBe(false);
      }
    });

    it('chegarada (aniq 2%) → auto-qabul', () => {
      const r = gate.checkWeightTolerance({ expected: 100, actual: 102 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.withinTolerance).toBe(true);
    });

    it('±2% dan yuqori (5%) + managerFlag YO\'Q → BLOK', () => {
      const r = gate.checkWeightTolerance({ expected: 100, actual: 105 });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('±2% dan yuqori + managerFlag bor lekin sabab YO\'Q → INVALID_REASON', () => {
      const r = gate.checkWeightTolerance({ expected: 100, actual: 105, managerFlag: true });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('INVALID_REASON');
    });

    it('±2% dan yuqori + managerFlag + sabab → ruxsat (requiresApproval=true)', () => {
      const r = gate.checkWeightTolerance({
        expected: 100, actual: 105, managerFlag: true, reason: 'Namlik yo\'qotgan',
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.withinTolerance).toBe(false);
        expect(r.data.requiresApproval).toBe(true);
      }
    });

    it('kutilgan og\'irlik <= 0 → INVALID_QUANTITY', () => {
      const r = gate.checkWeightTolerance({ expected: 0, actual: 10 });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
    });
  });

  describe('resolveQcDecision', () => {
    it('QABUL (KARANTIN dan) → QC_PASS', () => {
      const r = gate.resolveQcDecision('KARANTIN', 'QABUL');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('QC_PASS');
    });

    it('CHIQARISH (KARANTIN dan) → REJECT', () => {
      const r = gate.resolveQcDecision('KARANTIN', 'CHIQARISH');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('REJECT');
    });

    it('QC qarori DRAFT holatida → Err (KARANTIN shart)', () => {
      const r = gate.resolveQcDecision('DRAFT', 'QABUL');
      expect(r.ok).toBe(false);
    });
  });
});

describe('WmsQuarantineGateService (DB enforcement, mock repo)', () => {
  const gate = new QuarantineGateService();

  it('KARANTIN holatidagi qabul QC_PASS siz MAIN ga o\'tolmaydi', async () => {
    const { repo, lastUpdate } = makeMockRepo('KARANTIN');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(1, 42);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('BUSINESS_RULE_VIOLATION');
    // Eng muhimi: holat DB da O'ZGARTIRILMAGAN (BLOK haqiqiy).
    expect(repo.updateReceiptStatus).not.toHaveBeenCalled();
    expect(lastUpdate()).toBeNull();
  });

  it('QC_PASS holatidagi qabul MAIN ga o\'tadi', async () => {
    const { repo, lastUpdate } = makeMockRepo('QC_PASS');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(1, 42);

    expect(res.ok).toBe(true);
    expect(repo.updateReceiptStatus).toHaveBeenCalledWith(1, 'MAIN', expect.objectContaining({ completed: true }));
    expect(lastUpdate()?.status).toBe('MAIN');
  });

  it('sendToQuarantine: DRAFT → KARANTIN', async () => {
    const { repo, lastUpdate } = makeMockRepo('DRAFT');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.sendToQuarantine(1, 7);

    expect(res.ok).toBe(true);
    expect(lastUpdate()?.status).toBe('KARANTIN');
  });

  it('sendToQuarantine: QC_PASS dan KARANTIN ga qaytarish noto\'g\'ri → Err', async () => {
    const { repo } = makeMockRepo('QC_PASS');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.sendToQuarantine(1, 7);

    expect(res.ok).toBe(false);
    expect(repo.updateReceiptStatus).not.toHaveBeenCalled();
  });

  it('applyQcDecision QABUL: KARANTIN → QC_PASS', async () => {
    const { repo, lastUpdate } = makeMockRepo('KARANTIN');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.applyQcDecision(1, 'QABUL', 9, 'ok');

    expect(res.ok).toBe(true);
    expect(lastUpdate()?.status).toBe('QC_PASS');
  });

  it('to\'liq oqim: DRAFT → KARANTIN → QC_PASS → MAIN', async () => {
    const { repo, lastUpdate } = makeMockRepo('DRAFT');
    const svc = new WmsQuarantineGateService(gate, repo);

    expect((await svc.sendToQuarantine(1, 1)).ok).toBe(true);
    expect(lastUpdate()?.status).toBe('KARANTIN');

    // KARANTIN dan to'g'ridan MAIN — BLOK
    expect((await svc.releaseToMain(1, 1)).ok).toBe(false);

    expect((await svc.applyQcDecision(1, 'QABUL', 1, null)).ok).toBe(true);
    expect(lastUpdate()?.status).toBe('QC_PASS');

    expect((await svc.releaseToMain(1, 1)).ok).toBe(true);
    expect(lastUpdate()?.status).toBe('MAIN');
  });

  it('topilmagan qabul → NOT_FOUND', async () => {
    const { repo } = makeMockRepo('KARANTIN');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(999, 1);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
  });

  it('repo DB xatosi propagatsiya qilinadi', async () => {
    const repo: jest.Mocked<IWmsQuarantineRepo> = {
      findReceiptStatus: jest.fn(async () => Err({ code: 'DB_ERROR', message: 'boom' })),
      updateReceiptStatus: jest.fn(),
    };
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(1, 1);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
  });
});

// ─── VISION-3340 #41: TOCTOU poyga guard (servis qatlami) ───────────────────
describe('WmsQuarantineGateService — TOCTOU guard (VISION-3340 #41)', () => {
  const gate = new QuarantineGateService();

  it("releaseToMain: o'qilganda QC_PASS, yozguncha parallel MAIN bo'lgan → CONFLICT (ikkilangan release BLOK)", async () => {
    const repo = makeRacyRepo('QC_PASS', 'MAIN');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(1, 42);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CONFLICT');
    // Guard repo ga AYNAN o'qilgan holat bilan uzatilgan.
    expect(repo.updateReceiptStatus).toHaveBeenCalledWith(
      1,
      'MAIN',
      expect.objectContaining({ expectedStatus: 'QC_PASS' }),
    );
  });

  it("applyQcDecision: o'qilganda KARANTIN, parallel REJECT bo'lgan → CONFLICT", async () => {
    const repo = makeRacyRepo('KARANTIN', 'REJECT');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.applyQcDecision(1, 'QABUL', 9, null);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CONFLICT');
    expect(repo.updateReceiptStatus).toHaveBeenCalledWith(
      1,
      'QC_PASS',
      expect.objectContaining({ expectedStatus: 'KARANTIN' }),
    );
  });

  it("sendToQuarantine: o'qilganda DRAFT, parallel KARANTIN bo'lgan → CONFLICT", async () => {
    const repo = makeRacyRepo('DRAFT', 'KARANTIN');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.sendToQuarantine(1, 7);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CONFLICT');
    expect(repo.updateReceiptStatus).toHaveBeenCalledWith(
      1,
      'KARANTIN',
      expect.objectContaining({ expectedStatus: 'DRAFT' }),
    );
  });

  it('guard mos kelsa yozuv o\'tadi (poyga yo\'q holat regressiyasi)', async () => {
    const repo = makeRacyRepo('QC_PASS', 'QC_PASS');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.releaseToMain(1, 42);

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.status).toBe('MAIN');
  });

  it("expectedStatus = aynan o'qilgan XOM holat (legacy 'draft' normalizatsiya qilinMAYdi)", async () => {
    // DB da legacy kichik harfli 'draft' saqlangan bo'lsa guard ham XOM 'draft'
    // bilan solishtirilishi shart — normalizatsiya qilingan 'DRAFT' bilan emas,
    // aks holda guard hech qachon mos kelmay har doim CONFLICT bo'lardi.
    const repo = makeRacyRepo('draft', 'draft');
    const svc = new WmsQuarantineGateService(gate, repo);

    const res = await svc.sendToQuarantine(1, 7);

    expect(res.ok).toBe(true);
    expect(repo.updateReceiptStatus).toHaveBeenCalledWith(
      1,
      'KARANTIN',
      expect.objectContaining({ expectedStatus: 'draft' }),
    );
  });
});

// ─── VISION-3340 #41: guarded UPDATE SQL (repository qatlami) ───────────────
describe('WmsQuarantineRepository — guarded UPDATE (VISION-3340 #41)', () => {
  const repoUnderTest = new WmsQuarantineRepository();
  const dialect = new PgDialect();
  const mockRunQuery = runQuery as jest.Mock;

  beforeEach(() => {
    mockRunQuery.mockReset();
  });

  /** Oxirgi runQuery chaqiruvining REAL parametrlangan SQL matni + paramlari. */
  function renderedSql(): { text: string; params: unknown[] } {
    const q = mockRunQuery.mock.calls[0]?.[0] as SQL;
    const { sql: text, params } = dialect.sqlToQuery(q);
    return { text: text.replace(/\s+/g, ' ').trim(), params };
  }

  it("expectedStatus berilsa WHERE ga NULL-xavfsiz holat sharti qo'shiladi (parametrlangan)", async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 5, status: 'KARANTIN' }] });

    const res = await repoUnderTest.updateReceiptStatus(5, 'KARANTIN', {
      userId: 1,
      expectedStatus: 'DRAFT',
    });

    expect(res.ok).toBe(true);
    const { text, params } = renderedSql();
    expect(text).toContain('AND status IS NOT DISTINCT FROM');
    // Holat qiymati SQL matniga yopishtirilmagan — parametr sifatida bog'langan.
    expect(params).toContain('DRAFT');
    expect(text).not.toContain("'DRAFT'");
  });

  it("expectedStatus berilmasa eski xatti-harakat saqlanadi (guard YO'Q — regressiya)", async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 5, status: 'KARANTIN' }] });

    const res = await repoUnderTest.updateReceiptStatus(5, 'KARANTIN', { userId: 1 });

    expect(res.ok).toBe(true);
    const { text } = renderedSql();
    expect(text).not.toContain('IS NOT DISTINCT FROM');
  });

  it('guard bilan 0-qator RETURNING → CONFLICT (muvaffaqiyat deb hisoblanMAYdi)', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });

    const res = await repoUnderTest.updateReceiptStatus(5, 'MAIN', {
      userId: 1,
      completed: true,
      expectedStatus: 'QC_PASS',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CONFLICT');
  });

  it("guard YO'Q holatda 0-qator → NOT_FOUND (mavjud semantika buzilmagan)", async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });

    const res = await repoUnderTest.updateReceiptStatus(999, 'KARANTIN', { userId: 1 });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
  });

  it('runQuery istisnosi throw qilinmaydi — Err(DB_ERROR) qaytadi (Result pattern)', async () => {
    mockRunQuery.mockRejectedValueOnce(new Error('connection lost'));

    const res = await repoUnderTest.updateReceiptStatus(5, 'KARANTIN', {
      userId: 1,
      expectedStatus: 'DRAFT',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
  });
});
