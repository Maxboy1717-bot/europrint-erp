/**
 * test/compatibility/employees-compat-sub.service.create-complaint-seq.spec.ts
 *
 * C8.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): createComplaint() generated hr_conflict_reports.id
 * inline as 'CR-'||LPAD(COUNT(*)+1,3,'0') — a TOCTOU read-max race (id is the PRIMARY KEY, so a
 * collision already failed loudly rather than silently duplicating). Now uses
 * nextval('hr_conflict_report_seq') instead.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRawSql = jest.fn();
jest.mock('@shared/db', () => ({ rawSql: (...args: unknown[]) => mockRawSql(...args) }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { EmployeesCompatSubService } from '../../src/modules/compatibility/employees-compat-sub.service';

describe('EmployeesCompatSubService.createComplaint — C8.4 nextval id generation', () => {
  let service: EmployeesCompatSubService;

  beforeEach(() => {
    mockRawSql.mockReset();
    service = new EmployeesCompatSubService({ t: jest.fn(async (k: string) => k) } as never);
  });

  it('generates the id via nextval(hr_conflict_report_seq), not COUNT(*)', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ id: 'CR-004', severity: 'low', status: 'open', created_at: '2026-07-07' }] });

    const result = await service.createComplaint('1', { party2: '2', description: 'test' });

    expect(result.ok).toBe(true);
    const text = sqlText(mockRawSql.mock.calls[0][0]);
    expect(text).toContain("nextval('hr_conflict_report_seq')");
    expect(text).not.toContain('COUNT(*)');
  });

  it('returns the generated id from RETURNING', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ id: 'CR-005', severity: 'high', status: 'open', created_at: '2026-07-07' }] });

    const result = await service.createComplaint('1', { party2: '2', severity: 'high' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe('CR-005');
  });
});
