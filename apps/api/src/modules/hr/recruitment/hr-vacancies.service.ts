import { Injectable } from '@nestjs/common';
import { DrizzleHrVacanciesRepository } from './repos/drizzle-hr-vacancies.repo';
import { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrVacanciesService {
  constructor(private readonly repo: DrizzleHrVacanciesRepository) {}

  findAll(): Promise<Result<Row[]>> {
    return this.repo.findAll();
  }

  findById(id: number): Promise<Result<Row | null>> {
    return this.repo.findById(id);
  }

  findPipeline(vacancyId?: number): Promise<Result<Row[]>> {
    return this.repo.findPipeline(vacancyId);
  }

  findPipelineById(id: number): Promise<Result<Row | null>> {
    return this.repo.findPipelineById(id);
  }

  updatePipelineStage(id: number, stage: string, userId: number): Promise<Result<Row>> {
    return this.repo.updatePipelineStage(id, stage, userId);
  }

  findKpi(): Promise<Result<Row[]>> {
    return this.repo.countByVacancy();
  }

  findUrgent(): Promise<Result<Row[]>> {
    return this.repo.findActiveVacancies();
  }

  findInternalBoard(): Promise<Result<Row[]>> {
    return this.repo.findInternalBoard();
  }

  findWorkerTypeStats(): Promise<Result<Row[]>> {
    return this.repo.countByVacancy();
  }

  findRoadmaps(): Promise<Result<Row[]>> {
    return this.repo.findPipeline();
  }

  findCandidateStats(): Promise<Result<{ total: number }>> {
    return this.repo.findCandidateCount();
  }

  findChannelsByVacancy(vacancyId: number): Promise<Result<Row[]>> {
    return this.repo.findChannelsByVacancy(vacancyId);
  }

  findRoadmapByPipeline(pipelineId: number): Promise<Result<Row[]>> {
    return this.repo.findRoadmapByPipeline(pipelineId);
  }

  findProbationJournal(pipelineId: number): Promise<Result<Row[]>> {
    return this.repo.findProbationJournal(pipelineId);
  }

  findProbationDates(pipelineId: number): Promise<Result<Row | null>> {
    return this.repo.findProbationDates(pipelineId);
  }

  findMarketAnalysisByVacancy(vacancyId: number): Promise<Result<Row | null>> {
    return this.repo.findMarketAnalysisByVacancy(vacancyId);
  }

  recordFunnelHistory(funnelId: string, stage: string, changedBy: string, notes?: string): Promise<Result<Row>> {
    return this.repo.recordFunnelHistory(funnelId, stage, changedBy, notes);
  }

  updateFunnelNotes(funnelId: number, notes: string): Promise<Result<Row>> {
    return this.repo.updateFunnelNotes(funnelId, notes);
  }

  addCandidateToFunnel(vacancyId: number, candidateId: number, note: string, source: string): Promise<Result<Row>> {
    return this.repo.addCandidateToFunnel(vacancyId, candidateId, note, source);
  }
}
