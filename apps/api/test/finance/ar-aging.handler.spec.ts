/**
 * test/finance/ar-aging.handler.spec.ts
 *
 * Unit tests for ArAgingHandler. CfoConfigService is mocked along with
 * the shared runQuery helper to avoid real DB access.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import Decimal from 'decimal.js';
import { runQuery } from '@shared/db';
import {
  ArAgingHandler,
  ArAgingQuery,
} from '../../src/modules/finance/application/queries/ar-aging.handler';
import { CfoConfigService } from '../../src/modules/finance/domain/services/cfo-config.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeCfo(rates: Record<string, number>) {
  const map = new Map<string, Decimal>();
  for (const [k, v] of Object.entries(rates)) map.set(k, new Decimal(v));
  return {
    getMap: jest.fn().mockResolvedValue(Ok(map)),
  } as unknown as CfoConfigService;
}

async function buildHandler(cfo: CfoConfigService): Promise<ArAgingHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ArAgingHandler,
      { provide: CfoConfigService, useValue: cfo },
    ],
  }).compile();
  return module.get(ArAgingHandler);
}

describe('ArAgingHandler', () => {
  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
  });

  const defaultRates = {
    ar_ecl_rate_0_30: 0.02,
    ar_ecl_rate_31_60: 0.08,
    ar_ecl_rate_61_90: 0.20,
    ar_ecl_rate_91_plus: 0.50,
  };

  it('returns zero totals when no outstanding invoices exist', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });
    const handler = await buildHandler(makeCfo(defaultRates));

    const result = await handler.execute(new ArAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAr).toBe(0);
      expect(result.data.totalEcl).toBe(0);
    }
  });

  it('aggregates buckets by SQL grouping result', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        { bucket: '0-30', invoice_count: 3, remaining: 5_000_000 },
        { bucket: '31-60', invoice_count: 2, remaining: 2_000_000 },
        { bucket: '90+',   invoice_count: 1, remaining: 1_000_000 },
      ],
    });
    const handler = await buildHandler(makeCfo(defaultRates));

    const result = await handler.execute(new ArAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAr).toBe(8_000_000);
      expect(result.data.current.invoiceCount).toBe(3);
      expect(result.data.thirtyDays.amount).toBe(2_000_000);
      expect(result.data.ninetyDaysPlus.amount).toBe(1_000_000);
    }
  });

  it('computes ECL using configured rates per bucket', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ bucket: '0-30', invoice_count: 1, remaining: 1_000_000 }],
    });
    const handler = await buildHandler(makeCfo({ ar_ecl_rate_0_30: 0.05 }));

    const result = await handler.execute(new ArAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.current.ecl).toBe(50_000);
  });

  it('falls back to default ECL rates when config map errors', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ bucket: '61-90', invoice_count: 1, remaining: 1_000_000 }],
    });
    const cfo = {
      getMap: jest.fn().mockResolvedValue(Err(AppErr('INTERNAL', 'down'))),
    } as unknown as CfoConfigService;
    const handler = await buildHandler(cfo);

    const result = await handler.execute(new ArAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.sixtyDays.ecl).toBe(200_000);
  });

  it('calculates percentage split summing to 100 when AR is positive', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        { bucket: '0-30',  invoice_count: 1, remaining: 5_000_000 },
        { bucket: '31-60', invoice_count: 1, remaining: 5_000_000 },
      ],
    });
    const handler = await buildHandler(makeCfo(defaultRates));

    const result = await handler.execute(new ArAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.current.percentage).toBe(50);
      expect(result.data.thirtyDays.percentage).toBe(50);
    }
  });
});
