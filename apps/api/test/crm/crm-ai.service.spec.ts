/**
 * crm-ai.service.spec.ts
 *
 * Unit tests for CrmAiService. CrmAiRepository is mocked; the real heuristic
 * lead-scoring formula (base 30 + email/phone/company/activity boosts) and
 * deal-forecast probability are exercised.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmAiService } from '../../src/modules/crm/application/crm-ai.service';
import { CRM_AI_REPO } from '../../src/modules/crm/domain/repositories/i-crm-ai.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import { CRM_LARGE_DEAL_THRESHOLD } from '../../src/common/constants/app.constants';

type RepoMock = {
  getLeadWithActivity: jest.Mock;
  updateLeadScore: jest.Mock;
  getLeadWithDeals: jest.Mock;
  updateLeadScoreSimple: jest.Mock;
  getDealWithActivity: jest.Mock;
  getLeadDashboard: jest.Mock;
  getDealDashboard: jest.Mock;
  getEntityActivities: jest.Mock;
  getRecentActivity: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    getLeadWithActivity: jest.fn(),
    updateLeadScore: jest.fn(),
    getLeadWithDeals: jest.fn(),
    updateLeadScoreSimple: jest.fn(),
    getDealWithActivity: jest.fn(),
    getLeadDashboard: jest.fn(),
    getDealDashboard: jest.fn(),
    getEntityActivities: jest.fn(),
    getRecentActivity: jest.fn(),
  };
}

describe('CrmAiService', () => {
  let svc: CrmAiService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmAiService,
        { provide: CRM_AI_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmAiService);
  });

  it('returns NOT_FOUND when analyzeLeadAi lead missing', async () => {
    repo.getLeadWithActivity.mockResolvedValue(Ok(null));
    const r = await svc.analyzeLeadAi(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('caps lead score at 100 for fully-populated lead', async () => {
    repo.getLeadWithActivity.mockResolvedValue(
      Ok({
        email: 'a@x.com',
        phone: '+998',
        company_id: 7,
        activity_count: 10,
        last_activity_at: new Date().toISOString(),
        stage_name: 'qualified',
      }),
    );
    repo.updateLeadScore.mockResolvedValue(Ok({}));
    const r = await svc.analyzeLeadAi(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { score: number };
      expect(data.score).toBeLessThanOrEqual(100);
      expect(data.score).toBeGreaterThanOrEqual(70);
    }
  });

  it('returns "low" activity level when activity_count is 0', async () => {
    repo.getLeadWithActivity.mockResolvedValue(
      Ok({ activity_count: 0, stage_name: 'new' }),
    );
    repo.updateLeadScore.mockResolvedValue(Ok({}));
    const r = await svc.analyzeLeadAi(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { analysis: { activity_level: string } };
      expect(data.analysis.activity_level).toBe('low');
    }
  });

  it('returns NOT_FOUND when scoreLeadV2 lead missing', async () => {
    repo.getLeadWithDeals.mockResolvedValue(Ok(null));
    const r = await svc.scoreLeadV2(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('grades A when scoreLeadV2 features yield high intent', async () => {
    repo.getLeadWithDeals.mockResolvedValue(
      Ok({ company_id: 7, activities: 5, deals: 2 }),
    );
    repo.updateLeadScoreSimple.mockResolvedValue(Ok({}));
    const r = await svc.scoreLeadV2(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { grade: string; score: number };
      expect(data.score).toBe(25 + 40 + 35);
      expect(data.grade).toBe('A');
    }
  });

  it('lowers forecast probability when deal amount exceeds large threshold', async () => {
    repo.getDealWithActivity.mockResolvedValue(
      Ok({
        activities: 1,
        age_days: 60,
        expected_amount: CRM_LARGE_DEAL_THRESHOLD + 1,
      }),
    );
    const r = await svc.forecastDeal(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { win_probability: number };
      expect(data.win_probability).toBe(20);
    }
  });

  it('clamps probability to min 5 in forecastDeal', async () => {
    repo.getDealWithActivity.mockResolvedValue(
      Ok({
        activities: 0,
        age_days: 100,
        expected_amount: CRM_LARGE_DEAL_THRESHOLD + 1,
      }),
    );
    const r = await svc.forecastDeal(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { win_probability: number };
      expect(data.win_probability).toBeGreaterThanOrEqual(5);
    }
  });

  it('returns Err when forecastDeal target missing', async () => {
    repo.getDealWithActivity.mockResolvedValue(Ok(null));
    const r = await svc.forecastDeal(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });
});
