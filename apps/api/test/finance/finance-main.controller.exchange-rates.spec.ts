/**
 * test/finance/finance-main.controller.exchange-rates.spec.ts
 *
 * M2 (Magic-Numbers Fix Loop, 2026-07-05): proves GET /finance/exchange-rates
 * prefers a live `exchange_rates` row over the hardcoded RATE_*_UZS fallback
 * constants, and only falls back when the table has no matching row.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { FinanceMainController } from '../../src/modules/finance/presentation/finance-main.controller';
import { rawSql } from '@shared/db';
import { RATE_USD_UZS, RATE_EUR_UZS, RATE_RUB_UZS, RATE_CNY_UZS } from '@common/constants/app.constants';

function makeController(): FinanceMainController {
  // Unused by getExchangeRates() — stubbed only to satisfy the constructor signature.
  return new FinanceMainController(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe('FinanceMainController.getExchangeRates()', () => {
  let ctrl: FinanceMainController;

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
    ctrl = makeController();
  });

  it('prefers exchange_rates DB rows when present (source: db)', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({
      rows: [
        { cur: 'USD', rate: '12550.0000', rate_date: '2026-07-05' },
        { cur: 'EUR', rate: '13600.0000', rate_date: '2026-07-05' },
      ],
    });

    const r = await ctrl.getExchangeRates();

    expect(r.source).toBe('db');
    expect(r.rates.USD).toBe(12550);
    expect(r.rates.EUR).toBe(13600);
    // Confirms the DB value, not the hardcoded fallback, won:
    expect(r.rates.USD).not.toBe(RATE_USD_UZS);
  });

  it('falls back to RATE_*_UZS constants only when the table has no rows', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const r = await ctrl.getExchangeRates();

    expect(r.source).toBe('default');
    expect(r.rates).toEqual({
      USD: RATE_USD_UZS,
      EUR: RATE_EUR_UZS,
      RUB: RATE_RUB_UZS,
      CNY: RATE_CNY_UZS,
    });
  });

  it('falls back to defaults when the query throws (DB error, not just empty)', async () => {
    (rawSql as jest.Mock).mockRejectedValueOnce(new Error('connection reset'));

    const r = await ctrl.getExchangeRates();

    expect(r.source).toBe('default');
    expect(r.rates.RUB).toBe(RATE_RUB_UZS);
  });
});
