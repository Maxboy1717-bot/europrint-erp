/**
 * Unit tests for EnpsRepository.
 * Uses db chain + raw runQuery for listSurveys / getPendingSurveys.
 */

import { makeDbChain, makeRunQuery } from '../_setup/db-mock';

const dbStub = makeDbChain([]);
const runQueryMock = makeRunQuery([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: runQueryMock,
  enps_surveys: { id: 'es.id', status: 'es.status' },
  enps_responses: { id: 'er.id', survey_id: 'er.survey_id', score: 'er.score' },
}));

import { EnpsRepository } from '../../src/modules/hr/enps/enps.repository';

describe('EnpsRepository', () => {
  let repo: EnpsRepository;
  beforeEach(() => {
    repo = new EnpsRepository();
    dbStub.__setResolved([]);
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
  });

  describe('createSurvey', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, title: 'Q1 eNPS' }]);
      const r = await repo.createSurvey({ title: 'Q1 eNPS', period: 'Q1', endDate: '2025-03-31' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, title: 'Q1 eNPS' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createSurvey({ title: 'X', period: 'Q1', endDate: '2025-03-31' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert fail'));
      const r = await repo.createSurvey({ title: 'X', period: 'Q1', endDate: '2025-03-31' });
      expect(r.ok).toBe(false);
    });
  });

  describe('launchSurvey', () => {
    it('returns Ok with active row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'active' }]);
      const r = await repo.launchSurvey(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'active' });
    });

    it('returns Ok with empty object when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.launchSurvey(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.launchSurvey(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('closeSurvey', () => {
    it('returns Ok with closed row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'closed' }]);
      const r = await repo.closeSurvey(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'closed' });
    });

    it('returns Ok with empty object when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.closeSurvey(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.closeSurvey(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('submitResponse', () => {
    it('returns Ok with inserted response when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7, survey_id: 1, score: 9 }]);
      const r = await repo.submitResponse({ surveyId: 1, employeeId: 2, score: 9 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, survey_id: 1, score: 9 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.submitResponse({ surveyId: 1, employeeId: 2, score: 8 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.submitResponse({ surveyId: 1, employeeId: 2, score: 5 });
      expect(r.ok).toBe(false);
    });
  });

  describe('getSurveyResults', () => {
    it('returns Ok with aggregated row when query succeeds', async () => {
      dbStub.__setResolved([{ total_responses: 50, avg_score: 8.4, promoters: 30, passives: 15, detractors: 5 }]);
      const r = await repo.getSurveyResults(1);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.total_responses).toBe(50);
        expect(r.data.promoters).toBe(30);
      }
    });

    it('returns Ok with empty object when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getSurveyResults(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getSurveyResults(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('listSurveys', () => {
    it('returns Ok with rows when runQuery succeeds', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Q1' }, { id: 2 }] });
      const r = await repo.listSurveys();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no surveys', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.listSurveys();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.listSurveys();
      expect(r.ok).toBe(false);
    });
  });

  describe('getPendingSurveys', () => {
    it('returns Ok with pending rows when present', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ survey_id: 1, title: 'Q1', pending_count: 12 }] });
      const r = await repo.getPendingSurveys();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when nothing pending', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getPendingSurveys();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getPendingSurveys();
      expect(r.ok).toBe(false);
    });
  });
});
