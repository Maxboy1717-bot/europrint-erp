import { candidates, hrCandidateFunnels, hrFunnelHistory } from '@europrint/schemas';
import { Result } from '@common/result';

type CandidateFunnelRow = typeof hrCandidateFunnels.$inferSelect;
type FunnelHistoryRow = typeof hrFunnelHistory.$inferSelect;

type CandidateBasicRow = { id: typeof candidates.$inferSelect['id']; full_name: typeof candidates.$inferSelect['full_name'] };
type ActiveFunnelRow = { id: typeof hrCandidateFunnels.$inferSelect['id'] };

type FunnelListItem = {
  id: number;
  funnelStage: string | null;
  productivityCategory: string | null;
  source: string | null;
  screeningScore: string | null;
  candidateId: number;
  vacancyId: number | null;
  assignedRecruiterId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  candidateName: string | null;
  candidatePhone: string | null;
  candidateEmail: string | null;
};

type FunnelKanbanRow = {
  id: number;
  funnelStage: string | null;
  productivityCategory: string | null;
  source: string | null;
  screeningScore: string | null;
  candidateId: number;
  candidateName: string | null;
  candidatePhone: string | null;
  updatedAt: Date | null;
};

export interface IHrRecruitmentFunnelRepository {
  findCandidateById(id: number): Promise<Result<CandidateBasicRow | null>>;
  findActiveFunnelForCandidate(candidateId: number): Promise<Result<ActiveFunnelRow | null>>;
  createFunnel(dto: unknown, createdById: number): Promise<Result<CandidateFunnelRow>>;
  insertFunnelHistory(dto: { funnelId: number; fromStage: string | null; toStage: string; changedById: number; notes?: string }): Promise<Result<FunnelHistoryRow>>;
  listFunnels(query: { stage?: string; vacancyId?: number; recruiterId?: number; productivityCategory?: string; page: number; limit: number }): Promise<Result<{ data: FunnelListItem[]; total: number; page: number; limit: number }>>;
  getFunnelById(id: number): Promise<Result<CandidateFunnelRow | null>>;
  getFunnelKanban(vacancyId?: number): Promise<Result<FunnelKanbanRow[]>>;
  countReferencesChecks(funnelId: number): Promise<Result<number>>;
  updateFunnel(id: number, data: Record<string, unknown>): Promise<Result<CandidateFunnelRow>>;
}

export const HR_RECRUITMENT_FUNNEL_REPO = 'IHrRecruitmentFunnelRepository';
