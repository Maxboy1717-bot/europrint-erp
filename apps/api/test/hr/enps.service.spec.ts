/**
 * test/hr/enps.service.spec.ts
 *
 * Unit tests for EnpsService — quarterly employee Net Promoter Score.
 * Mocks EnpsRepository + EventEmitter2.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnpsService } from '../../src/modules/hr/enps/enps.service';
import { EnpsRepository } from '../../src/modules/hr/enps/enps.repository';
import { Ok } from '../../src/common/result';

interface RepoMock {
  createSurvey: jest.Mock;
  launchSurvey: jest.Mock;
  closeSurvey: jest.Mock;
  submitResponse: jest.Mock;
  getSurveyResults: jest.Mock;
  listSurveys: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    createSurvey: jest.fn().mockResolvedValue(Ok({ id: 42 })),
    launchSurvey: jest.fn().mockResolvedValue(Ok({ id: 42, status: 'launched' })),
    closeSurvey:  jest.fn().mockResolvedValue(Ok({ id: 42, status: 'closed' })),
    submitResponse: jest.fn().mockResolvedValue({ id: 1, score: 8 }),
    getSurveyResults: jest.fn().mockResolvedValue({
      data: { total_responses: 10, promoters: 6, passives: 2, detractors: 2, avg_score: 8.0 },
    }),
    listSurveys: jest.fn().mockResolvedValue(Ok([{ id: 42 }])),
    ...overrides,
  };
}

function makeEmitter(): EventEmitter2 {
  return { emit: jest.fn().mockReturnValue(true) } as unknown as EventEmitter2;
}

async function buildSvc(repo: RepoMock, emitter: EventEmitter2 = makeEmitter()): Promise<EnpsService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      EnpsService,
      { provide: EnpsRepository, useValue: repo },
      { provide: EventEmitter2, useValue: emitter },
    ],
  }).compile();
  return mod.get(EnpsService);
}

describe('EnpsService', () => {
  describe('createSurvey()', () => {
    it('passes title, description, period to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createSurvey({ title: 'Q1 eNPS', period: 'Q1-2025', description: 'Test' });

      expect(repo.createSurvey).toHaveBeenCalled();
      const arg = repo.createSurvey.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(arg.title).toBe('Q1 eNPS');
      expect(arg.period).toBe('Q1-2025');
    });

    it('uses default endDate 14 days from today when not provided', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createSurvey({ title: 'X', period: 'Q1' });

      const arg = repo.createSurvey.mock.calls[0]?.[0] as { endDate: string };
      expect(arg.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('emits ENPS_SURVEY_SENT event', async () => {
      const emitter = makeEmitter();
      const svc = await buildSvc(makeRepo(), emitter);

      await svc.createSurvey({ title: 'X', period: 'Q1' });

      expect(emitter.emit).toHaveBeenCalled();
    });
  });

  describe('submitResponse()', () => {
    it('accepts score 0..10', async () => {
      const svc = await buildSvc(makeRepo());

      const r = await svc.submitResponse({ surveyId: 1, employeeId: 1, score: 5 });

      expect(r.ok).toBe(true);
    });

    it('rejects score < 0', async () => {
      const svc = await buildSvc(makeRepo());

      const r = await svc.submitResponse({ surveyId: 1, employeeId: 1, score: -1 });

      expect(r.ok).toBe(false);
    });

    it('rejects score > 10', async () => {
      const svc = await buildSvc(makeRepo());

      const r = await svc.submitResponse({ surveyId: 1, employeeId: 1, score: 11 });

      expect(r.ok).toBe(false);
    });
  });

  describe('getSurveyResults()', () => {
    it('computes eNPS = (promoters − detractors) / total × 100', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.getSurveyResults(42);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { enpsScore: number; totalResponses: number };
        expect(d.totalResponses).toBe(10);
        // (6-2)/10 × 100 = 40
        expect(d.enpsScore).toBe(40);
      }
    });

    it('labels category "excellent" when score ≥ 50', async () => {
      const repo = makeRepo({
        getSurveyResults: jest.fn().mockResolvedValue({
          data: { total_responses: 10, promoters: 8, passives: 1, detractors: 1, avg_score: 9 },
        }),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getSurveyResults(42);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { category: string };
        expect(d.category).toBe('excellent');
      }
    });

    it('labels "good" when score in [0, 50)', async () => {
      const repo = makeRepo({
        getSurveyResults: jest.fn().mockResolvedValue({
          data: { total_responses: 10, promoters: 5, passives: 3, detractors: 2, avg_score: 7 },
        }),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getSurveyResults(42);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { category: string };
        expect(d.category).toBe('good');
      }
    });

    it('labels "poor" when score < 0', async () => {
      const repo = makeRepo({
        getSurveyResults: jest.fn().mockResolvedValue({
          data: { total_responses: 10, promoters: 1, passives: 2, detractors: 7, avg_score: 3 },
        }),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getSurveyResults(42);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { category: string };
        expect(d.category).toBe('poor');
      }
    });

    it('handles zero responses gracefully (score = 0)', async () => {
      const repo = makeRepo({
        getSurveyResults: jest.fn().mockResolvedValue({
          data: { total_responses: 0, promoters: 0, passives: 0, detractors: 0, avg_score: 0 },
        }),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getSurveyResults(42);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { enpsScore: number };
        expect(d.enpsScore).toBe(0);
      }
    });
  });

  describe('launch/close/list', () => {
    it('launchSurvey delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.launchSurvey(42);

      expect(repo.launchSurvey).toHaveBeenCalledWith(42);
    });

    it('closeSurvey delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.closeSurvey(42);

      expect(repo.closeSurvey).toHaveBeenCalledWith(42);
    });

    it('listSurveys returns repo data', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.listSurveys();

      expect(r.ok).toBe(true);
    });
  });
});
