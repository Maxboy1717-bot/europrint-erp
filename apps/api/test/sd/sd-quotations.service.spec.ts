/**
 * sd-quotations.service.spec.ts
 *
 * Unit tests for SdQuotationsService. The repository is mocked; price-tier and
 * funnel conversion calculations execute with real business logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdQuotationsService } from '../../src/modules/sd/application/sd-quotations.service';
import { SD_QUOTATIONS_REPO } from '../../src/modules/sd/domain/repositories/i-sd-quotations.repo';
import { QUOTATION_REPO } from '../../src/modules/sd/domain/repositories/i-quotation.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import {
  BULK_DISCOUNT_LARGE,
  BULK_DISCOUNT_SMALL,
} from '../../src/common/constants/business.constants';
import { QUOTATION_BASE_NUMBER } from '../../src/common/constants/app.constants';

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
  };
}

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
      ],
    }).compile();
    svc = module.get(SdQuotationsService);
  });

  it('returns 0 discount when quantity at or below SMALL threshold', async () => {
    const r = await svc.calculatePrice(1, BULK_DISCOUNT_SMALL.minQty, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.discount_percent).toBe(0);
      expect(r.data.unit_price).toBe(QUOTATION_BASE_NUMBER);
      expect(r.data.total_price).toBe(QUOTATION_BASE_NUMBER * BULK_DISCOUNT_SMALL.minQty);
    }
  });

  it('applies SMALL bulk discount when quantity above SMALL threshold', async () => {
    const qty = BULK_DISCOUNT_SMALL.minQty + 1;
    const r = await svc.calculatePrice(7, qty, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.discount_percent).toBeCloseTo(BULK_DISCOUNT_SMALL.rate * 100, 5);
      expect(r.data.unit_price).toBeCloseTo(QUOTATION_BASE_NUMBER * (1 - BULK_DISCOUNT_SMALL.rate), 5);
      expect(r.data.currency).toBe('UZS');
    }
  });

  it('applies LARGE bulk discount when quantity above LARGE threshold', async () => {
    const qty = BULK_DISCOUNT_LARGE.minQty + 1;
    const r = await svc.calculatePrice(7, qty, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.discount_percent).toBeCloseTo(BULK_DISCOUNT_LARGE.rate * 100, 5);
    }
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
});
