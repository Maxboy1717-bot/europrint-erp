/**
 * test/compatibility/mentorships-compat.service.card-cap.spec.ts
 *
 * SB0071 follow-up (2026-07-07): `mentors.card_id` was surfaced read-only —
 * createMentorship/updateMentorship never accepted or wrote it, and nothing enforced the
 * "max MENTORS_PER_CARD_CAP (2) active mentors per card" business rule. These tests prove:
 *   - createMentorship writes card_id (INSERT) when provided, and is unaffected when omitted.
 *   - createMentorship/updateMentorship reject with BadRequestException (BAD_REQUEST) once the
 *     card already has MENTORS_PER_CARD_CAP non-deleted mentors.
 *   - updateMentorship excludes the mentor's own row from the cap count (COALESCE re-save/move).
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { MentorshipsCompatService } from '../../src/modules/compatibility/mentorships-compat.service';
import { rawSql } from '@shared/db';
import { MENTORS_PER_CARD_CAP } from '../../src/common/constants/business.constants';

// The real drizzle-orm `sql` tag is used (not mocked) so that nesting a conditional
// sql`` fragment (the exclude/mentor filter) inside the outer query behaves exactly like
// production. A nested fragment shows up as one chunk carrying its own `queryChunks` — this
// walks the tree and stringifies interpolated params too, so assertions can grep the SQL text.
function sqlText(node: unknown): string {
  const chunks = (node as { queryChunks?: unknown[] })?.queryChunks;
  if (!Array.isArray(chunks)) return node == null ? '' : String(node);
  return chunks.map((c) => {
    if (c && typeof c === 'object' && 'queryChunks' in (c as object)) return sqlText(c);
    if (c && typeof c === 'object' && 'value' in (c as object)) return (c as { value: string[] }).value.join('');
    return String(c);
  }).join(' ');
}

const i18n = { t: jest.fn(async (key: string) => key) } as never;

describe('MentorshipsCompatService — card_id cap enforcement (SB0071 follow-up)', () => {
  let svc: MentorshipsCompatService;

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
    svc = new MentorshipsCompatService(i18n);
  });

  it('MENTORS_PER_CARD_CAP is 2 (documents the business rule under test)', () => {
    expect(MENTORS_PER_CARD_CAP).toBe(2);
  });

  it('createMentorship: below the cap — counts, then inserts with card_id', async () => {
    (rawSql as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // cap check
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Ali', card_id: 5, created_at: 'now' }] }); // insert

    const result = await svc.createMentorship({ name: 'Ali', card_id: 5 });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 10, name: 'Ali', card_id: 5, created_at: 'now' });
    expect(rawSql).toHaveBeenCalledTimes(2);
    const countCall = sqlText((rawSql as jest.Mock).mock.calls[0][0]);
    expect(countCall).toMatch(/SELECT COUNT\(\*\)/);
    expect(countCall).toMatch(/card_id = /);
    const insertCall = sqlText((rawSql as jest.Mock).mock.calls[1][0]);
    expect(insertCall).toMatch(/INSERT INTO mentors/);
    expect(insertCall).toMatch(/card_id/);
  });

  it('createMentorship: card_id omitted — skips the cap check entirely, inserts card_id as null', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 11, name: 'Vali', card_id: null, created_at: 'now' }] });

    const result = await svc.createMentorship({ name: 'Vali' });

    expect(result.ok).toBe(true);
    expect(rawSql).toHaveBeenCalledTimes(1); // no COUNT query issued
    const insertCall = sqlText((rawSql as jest.Mock).mock.calls[0][0]);
    expect(insertCall).toMatch(/INSERT INTO mentors/);
  });

  it('createMentorship: cap already reached — rejects BAD_REQUEST, never inserts', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [{ count: MENTORS_PER_CARD_CAP }] });

    const result = await svc.createMentorship({ name: 'Sardor', card_id: 5 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toBe('validation.mentorCardCapReached');
    }
    expect(rawSql).toHaveBeenCalledTimes(1); // only the COUNT check — no INSERT attempted
  });

  it('updateMentorship: below the cap (excluding own row) — writes card_id via COALESCE', async () => {
    (rawSql as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // cap check (self excluded)
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Ali', card_id: 5, updated_at: 'now' }] }); // update

    const result = await svc.updateMentorship('10', { card_id: 5 });

    expect(result.ok).toBe(true);
    expect(rawSql).toHaveBeenCalledTimes(2);
    const countCall = sqlText((rawSql as jest.Mock).mock.calls[0][0]);
    expect(countCall).toMatch(/id != /);
    const updateCall = sqlText((rawSql as jest.Mock).mock.calls[1][0]);
    expect(updateCall).toMatch(/UPDATE mentors/);
    expect(updateCall).toMatch(/card_id = COALESCE/);
  });

  it('updateMentorship: cap already reached by other mentors — rejects BAD_REQUEST, never updates', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [{ count: MENTORS_PER_CARD_CAP }] });

    const result = await svc.updateMentorship('10', { card_id: 5 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('BAD_REQUEST');
    expect(rawSql).toHaveBeenCalledTimes(1);
  });

  it('updateMentorship: card_id omitted — skips the cap check, leaves card_id unchanged via COALESCE', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 10, name: 'Ali', card_id: 5, updated_at: 'now' }] });

    const result = await svc.updateMentorship('10', { name: 'Ali' });

    expect(result.ok).toBe(true);
    expect(rawSql).toHaveBeenCalledTimes(1); // no COUNT query issued
  });
});
