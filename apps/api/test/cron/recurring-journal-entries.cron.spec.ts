/**
 * test/cron/recurring-journal-entries.cron.spec.ts
 *
 * F11 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): RecurringJournalEntriesCron reads active
 * gl_documents templates and generates a pending_review draft instance once per period
 * (monthly/quarterly/yearly), never posting to `entries` directly — the generated instance
 * still goes through F9's approve/reject gate.
 */

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args) }));

import { RecurringJournalEntriesCron } from '../../src/cron/recurring-journal-entries.cron';
import { CronStatusService } from '../../src/cron/cron-status.service';

const lines = [
  { accountCode: '9400', accountName: "Ma'muriyat xarajatlari", debit: 2000000, credit: 0 },
  { accountCode: '6000', accountName: 'Kreditorlar', debit: 0, credit: 2000000 },
];

describe('RecurringJournalEntriesCron', () => {
  let cronStatus: jest.Mocked<Pick<CronStatusService, 'recordSuccess' | 'recordFailure'>>;
  let cron: RecurringJournalEntriesCron;

  beforeEach(() => {
    mockRunQuery.mockReset();
    cronStatus = { recordSuccess: jest.fn(), recordFailure: jest.fn() };
    cron = new RecurringJournalEntriesCron(cronStatus as unknown as CronStatusService);
  });

  it('generates a new draft instance for a monthly template not yet generated this period', async () => {
    mockRunQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, document_number: 'RECUR-1', description: 'Ijara', total_debit: '2000000', total_credit: '2000000', metadata: { lines, frequency: 'monthly', lastGeneratedPeriod: null } }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT new draft instance
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // UPDATE template lastGeneratedPeriod

    await cron.run();

    expect(mockRunQuery).toHaveBeenCalledTimes(3);
    const insertCall = mockRunQuery.mock.calls[1][0];
    const insertText = (insertCall.queryChunks ?? [])
      .map((c: unknown) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : ''))
      .join('');
    expect(insertText).toMatch(/INSERT INTO gl_documents/);
    expect(insertText).toMatch(/manual_journal/);
    expect(insertText).toMatch(/pending_review/);
    expect(cronStatus.recordSuccess).toHaveBeenCalledWith('RecurringJournalEntriesCron');
    expect(cronStatus.recordFailure).not.toHaveBeenCalled();
  });

  it('skips a template already generated for the current period (idempotent, no duplicate draft)', async () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    mockRunQuery.mockResolvedValueOnce({
      rows: [{ id: 1, document_number: 'RECUR-1', description: 'Ijara', total_debit: '2000000', total_credit: '2000000', metadata: { lines, frequency: 'monthly', lastGeneratedPeriod: thisMonth } }],
    });

    await cron.run();

    expect(mockRunQuery).toHaveBeenCalledTimes(1); // only the SELECT — no INSERT/UPDATE
    expect(cronStatus.recordSuccess).toHaveBeenCalledWith('RecurringJournalEntriesCron');
  });

  it('reports failure honestly when the query itself throws (never fabricates success)', async () => {
    mockRunQuery.mockRejectedValueOnce(new Error('connection lost'));

    await cron.run();

    expect(cronStatus.recordFailure).toHaveBeenCalledWith('RecurringJournalEntriesCron', expect.stringContaining('connection lost'));
    expect(cronStatus.recordSuccess).not.toHaveBeenCalled();
  });

  it('logs a per-template error and continues for a template with invalid frequency, without crashing the run', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [{ id: 2, document_number: 'RECUR-2', description: null, total_debit: '1000', total_credit: '1000', metadata: { lines, frequency: 'weekly', lastGeneratedPeriod: null } }],
    });

    await cron.run();

    expect(mockRunQuery).toHaveBeenCalledTimes(1); // no INSERT attempted for the bad template
    expect(cronStatus.recordSuccess).toHaveBeenCalledWith('RecurringJournalEntriesCron');
  });
});
