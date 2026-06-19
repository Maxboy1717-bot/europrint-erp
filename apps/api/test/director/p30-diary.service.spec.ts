/**
 * test/director/p30-diary.service.spec.ts
 * Unit tests for DiaryService — IDiaryRepo mocked. Verifies carry-over moves
 * unfinished items forward (openDiary calls getOrCreateToday + carryOverIssues),
 * and auto-fill state flows through.
 */

import { DiaryService } from '../../src/modules/director/application/diary.service';
import type {
  IDiaryRepo,
  IDiaryEntry,
} from '../../src/modules/director/domain/repositories/i-diary.repo';
import { Ok } from '../../src/common/result';

function entry(over: Partial<IDiaryEntry> = {}): IDiaryEntry {
  return {
    id: 10,
    author_card_id: 5,
    date: '2026-06-20',
    daily_state: 'NORMAL',
    main_kpi_value: '88.0',
    main_issue: null,
    solution: null,
    tomorrow_plan: null,
    carry_over_issues: [],
    status: 'draft',
    created_at: new Date(),
    updated_at: new Date(),
    ...over,
  };
}

describe('P30 DiaryService — open + carry-over', () => {
  it('openDiary creates today (auto-fill) then carries over unfinished issues', async () => {
    const created = entry({ carry_over_issues: [] });
    // After carry-over the repo re-read returns the entry WITH the prior issue.
    const afterCarry = entry({
      carry_over_issues: [{ issue: 'Kechagi hal qilinmagan muammo', from_date: '2026-06-19' }],
    });

    const calls: string[] = [];
    const repo: IDiaryRepo = {
      getOrCreateToday: jest.fn(async () => {
        calls.push('getOrCreateToday');
        return Ok(created);
      }),
      getByAuthorDate: jest.fn(async () => {
        calls.push('getByAuthorDate');
        return Ok(afterCarry);
      }),
      listAll: jest.fn(async () => Ok([])),
      save: jest.fn(async () => Ok(created)),
      submit: jest.fn(async () => Ok(created)),
      carryOverIssues: jest.fn(async () => {
        calls.push('carryOverIssues');
        return Ok(undefined);
      }),
    };

    const svc = new DiaryService(repo);
    const r = await svc.openDiary(5, '2026-06-20');

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // order: create FIRST, then carry-over, then re-read
    expect(calls).toEqual(['getOrCreateToday', 'carryOverIssues', 'getByAuthorDate']);

    // carried-over issue from yesterday is present in today's entry
    expect(Array.isArray(r.data.carry_over_issues)).toBe(true);
    expect(r.data.carry_over_issues.length).toBe(1);
    expect((r.data.carry_over_issues[0] as { issue: string }).issue).toBe(
      'Kechagi hal qilinmagan muammo',
    );

    // auto-fill state preserved
    expect(r.data.daily_state).toBe('NORMAL');
  });

  it('openDiary falls back to created entry when re-read returns null', async () => {
    const created = entry();
    const repo: IDiaryRepo = {
      getOrCreateToday: jest.fn(async () => Ok(created)),
      getByAuthorDate: jest.fn(async () => Ok(null)),
      listAll: jest.fn(async () => Ok([])),
      save: jest.fn(async () => Ok(created)),
      submit: jest.fn(async () => Ok(created)),
      carryOverIssues: jest.fn(async () => Ok(undefined)),
    };
    const svc = new DiaryService(repo);
    const r = await svc.openDiary(5, '2026-06-20');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe(created.id);
  });

  it('saveDraft + submit delegate to repo', async () => {
    const e = entry();
    const repo: IDiaryRepo = {
      getOrCreateToday: jest.fn(async () => Ok(e)),
      getByAuthorDate: jest.fn(async () => Ok(e)),
      listAll: jest.fn(async () => Ok([e])),
      save: jest.fn(async () => Ok(entry({ main_issue: 'X' }))),
      submit: jest.fn(async () => Ok(entry({ status: 'submitted' }))),
      carryOverIssues: jest.fn(async () => Ok(undefined)),
    };
    const svc = new DiaryService(repo);

    const saved = await svc.saveDraft(10, { main_issue: 'X' });
    expect(saved.ok).toBe(true);
    if (saved.ok) expect(saved.data.main_issue).toBe('X');

    const submitted = await svc.submitEntry(10);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) expect(submitted.data.status).toBe('submitted');
  });
});
