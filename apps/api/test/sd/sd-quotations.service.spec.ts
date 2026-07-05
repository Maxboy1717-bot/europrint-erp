/**
 * sd-quotations.service.spec.ts
 *
 * Unit tests for SdQuotationsService. The repository + GL service are mocked; the EP-SD-037 price
 * engine runs with REAL logic against a mocked sd_price_formulas config — config-driven, no constant.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdQuotationsService } from '../../src/modules/sd/application/sd-quotations.service';
import { SD_QUOTATIONS_REPO } from '../../src/modules/sd/domain/repositories/i-sd-quotations.repo';
import { QUOTATION_REPO } from '../../src/modules/sd/domain/repositories/i-quotation.repo';
import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  listQuotations: jest.Mock;
  createQuotation: jest.Mock;
  listContracts: jest.Mock;
  createContract: jest.Mock;
  listPriceFormulas: jest.Mock;
  getKpiTeam: jest.Mock;
  getKpiTargets: jest.Mock;
  getFunnelReport: jest.Mock;
  convertQuotationToOrder: jest.Mock;
  getPriceSettings: jest.Mock;
  approveQuotation: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listQuotations: jest.fn(),
    createQuotation: jest.fn(),
    listContracts: jest.fn(),
    createContract: jest.fn(),
    listPriceFormulas: jest.fn(),
    getKpiTeam: jest.fn(),
    getKpiTargets: jest.fn(),
    getFunnelReport: jest.fn(),
    convertQuotationToOrder: jest.fn(),
    getPriceSettings: jest.fn(),
    approveQuotation: jest.fn(),
  };
}

// Live sd_price_formulas-shaped config — the engine must READ these, not a hardcoded constant.
const PRICE_CFG = {
  paper_b_price: 4200, paper_c_price: 4500, paper_bc_price: 5200, paper_e_price: 3900,
  print_1color_price: 15000, print_2color_price: 22000, print_4color_price: 38000,
  plate_cost_per_color: 250000, die_cost_new: 1800000, die_cost_existing: 0,
  hourly_labor_rate: 25000, delivery_base_cost: 50000, default_markup_percent: 35, vat_rate: 12,
};

describe('SdQuotationsService', () => {
  let svc: SdQuotationsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdQuotationsService,
        { provide: SD_QUOTATIONS_REPO, useValue: repo },
        { provide: QUOTATION_REPO, useValue: repo },
        { provide: GlPostingService, useValue: { postCustomerPayment: jest.fn().mockResolvedValue(Ok(1)) } },
      ],
    }).compile();
    svc = module.get(SdQuotationsService);
  });

  // ── EP-SD-037 config-driven price engine (replaces the old hardcoded-constant tests) ──
  it('calculatePrice READS sd_price_formulas and returns a real breakdown (not a constant)', async () => {
    repo.getPriceSettings.mockResolvedValue(Ok(PRICE_CFG));
    const r = await svc.calculatePrice({
      productType: 'box', paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100,
      thicknessMm: 3, printColors: 0, quantity: 1000, isNewDie: false,
    });
    expect(repo.getPriceSettings).toHaveBeenCalled();
    expect(r.ok).toBe(true);
    if (r.ok) {
      // area = (2*(300+200)+40)*(100+200)/1e6 = 0.312 m² (rounded to 0.31 in the return); the
      // UNrounded area drives paperCost = 0.312*4200*1000 = 1,310,400.
      expect(r.data.areaPerUnitM2).toBeCloseTo(0.31, 2);
      expect(r.data.paperCost).toBeCloseTo(1_310_400, 0);
      expect(r.data.productionCost).toBe(25_000);   // hourly_labor_rate * (1000/1000)
      expect(r.data.deliveryCost).toBe(50_000);
      expect(r.data.costPrice).toBeCloseTo(1_385_400, 0);
      // total = 1,385,400 * 1.35 (markup) * 1.12 (VAT) = 2,094,724.8 — NOT the old fake constant
      expect(r.data.totalPrice).toBeCloseTo(2_094_724.8, 0);
      expect(r.data.currency).toBe('UZS');
    }
  });

  it('calculatePrice scales with config (doubling the paper rate roughly doubles paper cost)', async () => {
    repo.getPriceSettings.mockResolvedValue(Ok(PRICE_CFG));
    const a = await svc.calculatePrice({ paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100, printColors: 0, quantity: 1000, isNewDie: false });
    repo.getPriceSettings.mockResolvedValue(Ok({ ...PRICE_CFG, paper_b_price: 8400 }));
    const b = await svc.calculatePrice({ paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100, printColors: 0, quantity: 1000, isNewDie: false });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(b.data.paperCost).toBeCloseTo(a.data.paperCost * 2, 0); // config-driven, not constant
  });

  it('calculatePrice adds plate (per colour) + run cost when colours > 0', async () => {
    repo.getPriceSettings.mockResolvedValue(Ok(PRICE_CFG));
    const r = await svc.calculatePrice({
      paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100, printColors: 2, quantity: 1000, isNewDie: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.printCost).toBe(250_000 * 2 + 22_000); // plate×colours + 2-colour run
  });

  it('calculatePrice charges die_cost_new only when isNewDie', async () => {
    repo.getPriceSettings.mockResolvedValue(Ok(PRICE_CFG));
    const a = await svc.calculatePrice({ paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100, printColors: 0, quantity: 1000, isNewDie: true });
    const b = await svc.calculatePrice({ paperType: 'B-flute', lengthMm: 300, widthMm: 200, heightMm: 100, printColors: 0, quantity: 1000, isNewDie: false });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) { expect(a.data.dieCost).toBe(1_800_000); expect(b.data.dieCost).toBe(0); }
  });

  it('forwards listQuotations arguments to repository', async () => {
    repo.listQuotations.mockResolvedValue(Ok([{ id: 1 }]));
    const r = await svc.listQuotations(42, 'draft', 10, 5);
    expect(repo.listQuotations).toHaveBeenCalledWith(42, 'draft', 10, 5);
    expect(r.ok).toBe(true);
  });

  it('computes conversion_rate when funnel report contains leads', async () => {
    repo.getFunnelReport.mockResolvedValue(
      Ok({ total_leads: 100, won_deals: 25, qualified: 60 } as Record<string, unknown>),
    );
    const r = await svc.getFunnelReport('weekly');
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.conversion_rate).toBeCloseTo(25, 5);
      expect(data.period).toBe('weekly');
    }
  });

  it('returns Err when funnel report repo fails', async () => {
    repo.getFunnelReport.mockResolvedValue(Err(AppErr('DB_ERROR', 'pg down')));
    const r = await svc.getFunnelReport(null);
    expect(r.ok).toBe(false);
  });

  it('returns Err when convertToOrder repository fails', async () => {
    repo.convertQuotationToOrder.mockResolvedValue(Err(AppErr('DB_ERROR', 'tx aborted')));
    const r = await svc.convertToOrder('q-99');
    expect(r.ok).toBe(false);
  });

  it('returns Err when convertToOrder returns embedded error payload', async () => {
    repo.convertQuotationToOrder.mockResolvedValue(Ok({ error: 'already converted' }));
    const r = await svc.convertToOrder('q-99');
    expect(r.ok).toBe(false);
  });

  it('returns mapped order payload on successful conversion', async () => {
    repo.convertQuotationToOrder.mockResolvedValue(
      Ok({
        order: {
          id: 555,
          order_number: 'SO-2026-0001',
          status: 'new',
          total_amount: '1000',
          created_at: '2026-05-15',
        },
      }),
    );
    const r = await svc.convertToOrder('q-1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.order.id).toBe(555);
      expect(r.data.order.documentNumber).toBe('SO-2026-0001');
    }
  });

  // B14 (2026-07-05): approveQuotation() never threaded the current user into the
  // resulting sales_orders.created_by_user_id -- this proves the wiring now works.
  it('passes approvedBy through to the repo when approving a quotation', async () => {
    repo.approveQuotation.mockResolvedValue(Ok({ id: 'q-1', status: 'approved', updated_at: '2026-07-05' }));
    await svc.approveQuotation('q-1', 42);
    expect(repo.approveQuotation).toHaveBeenCalledWith('q-1', 42);
  });
});
