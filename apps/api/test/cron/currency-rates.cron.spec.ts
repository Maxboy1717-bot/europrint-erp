/**
 * test/cron/currency-rates.cron.spec.ts
 *
 * F6 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): CurrencyRatesCron used to log a fabricated
 * `✅ processed=5` daily without ever fetching or writing anything. It now fetches the real CBU
 * feed and writes to `exchange_rates`, or fails HONESTLY (CronStatusService.recordFailure) —
 * never reports success without having written or already-current data.
 */

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args) }));

import { CurrencyRatesCron } from '../../src/cron/currency-rates.cron';
import { CronStatusService } from '../../src/cron/cron-status.service';

function makeCbuResponse(overrides: Partial<Record<string, string>> = {}) {
  const base = [
    { Ccy: 'USD', Nominal: '1', Rate: '11973.90', Date: '06.07.2026' },
    { Ccy: 'EUR', Nominal: '1', Rate: '13700.54', Date: '06.07.2026' },
    { Ccy: 'RUB', Nominal: '1', Rate: '154.82', Date: '06.07.2026' },
    { Ccy: 'CNY', Nominal: '1', Rate: '1765.25', Date: '06.07.2026' },
    { Ccy: 'GBP', Nominal: '1', Rate: '15987.55', Date: '06.07.2026' },
  ];
  return base.map((r) => (overrides[r.Ccy] !== undefined ? { ...r, Rate: overrides[r.Ccy] } : r));
}

describe('CurrencyRatesCron — F6 real feed (honest, no fabricated success)', () => {
  let cronStatus: jest.Mocked<Pick<CronStatusService, 'recordSuccess' | 'recordFailure'>>;
  let cron: CurrencyRatesCron;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockRunQuery.mockReset();
    cronStatus = { recordSuccess: jest.fn(), recordFailure: jest.fn() };
    cron = new CurrencyRatesCron(cronStatus as unknown as CronStatusService);
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it('fetches the real CBU feed and inserts a new row per tracked currency', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeCbuResponse() });
    mockRunQuery.mockResolvedValue({ rows: [] }); // update currencies (no rows) / existence check (none) / insert

    await cron.run();

    expect(fetchMock).toHaveBeenCalledWith('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', expect.anything());
    // 4 currencies × (UPDATE currencies + existence check + insert) = 12 calls
    expect(mockRunQuery).toHaveBeenCalledTimes(12);
    expect(cronStatus.recordSuccess).toHaveBeenCalledWith('CurrencyRatesCron');
    expect(cronStatus.recordFailure).not.toHaveBeenCalled();
  });

  // F6 sub-fix 2: currencies.exchange_rate and exchange_rates were two disconnected sources of
  // truth that silently diverged. The cron now updates currencies.exchange_rate every run.
  it('syncs currencies.exchange_rate on every successful fetch, not just exchange_rates', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeCbuResponse() });
    mockRunQuery.mockResolvedValue({ rows: [] });

    await cron.run();

    const updateCurrenciesCalls = mockRunQuery.mock.calls.filter((call) => {
      const chunks = (call[0] as { queryChunks?: unknown[] }).queryChunks ?? [];
      const text = chunks
        .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
        .join('');
      return /UPDATE currencies/.test(text);
    });
    expect(updateCurrenciesCalls).toHaveLength(4); // USD, EUR, RUB, CNY
  });

  it('skips a currency already inserted today (idempotent) without double-posting', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => makeCbuResponse() });
    mockRunQuery
      .mockResolvedValueOnce({ rows: [] }) // USD: update currencies
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // USD: already exists today
      .mockResolvedValueOnce({ rows: [] }) // EUR: update currencies
      .mockResolvedValueOnce({ rows: [] }) // EUR: no existing
      .mockResolvedValueOnce({ rows: [] }) // EUR insert
      .mockResolvedValueOnce({ rows: [] }) // RUB: update currencies
      .mockResolvedValueOnce({ rows: [] }) // RUB: no existing
      .mockResolvedValueOnce({ rows: [] }) // RUB insert
      .mockResolvedValueOnce({ rows: [] }) // CNY: update currencies
      .mockResolvedValueOnce({ rows: [] }) // CNY: no existing
      .mockResolvedValueOnce({ rows: [] }); // CNY insert

    await cron.run();

    // USD: 2 calls (update currencies + existence check, no insert) + 3 others × 3 = 11
    expect(mockRunQuery).toHaveBeenCalledTimes(11);
    expect(cronStatus.recordSuccess).toHaveBeenCalledWith('CurrencyRatesCron');
  });

  it('reports FAILURE (never fabricated success) when the CBU fetch itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network unreachable'));

    await cron.run();

    expect(mockRunQuery).not.toHaveBeenCalled();
    expect(cronStatus.recordFailure).toHaveBeenCalledWith('CurrencyRatesCron', expect.stringContaining('network unreachable'));
    expect(cronStatus.recordSuccess).not.toHaveBeenCalled();
  });

  it('reports FAILURE when the CBU response is missing all tracked currencies (no silent success)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ Ccy: 'GBP', Nominal: '1', Rate: '15987.55', Date: '06.07.2026' }] });

    await cron.run();

    expect(cronStatus.recordFailure).toHaveBeenCalledWith('CurrencyRatesCron', expect.any(String));
    expect(cronStatus.recordSuccess).not.toHaveBeenCalled();
  });

  it('reports FAILURE on a non-2xx HTTP response instead of pretending success', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    await cron.run();

    expect(cronStatus.recordFailure).toHaveBeenCalledWith('CurrencyRatesCron', expect.stringContaining('503'));
    expect(cronStatus.recordSuccess).not.toHaveBeenCalled();
  });
});
