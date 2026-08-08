/**
 * @module recruitment.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable , Logger} from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { RecruitmentFunnelService } from './recruitment-funnel.service';
import { RecruitmentAssessmentService } from './recruitment-assessment.service';
import { RecruitmentStatsService } from './recruitment-stats.service';
import type { CreateFunnelDto, MoveFunnelStageDto, QuickScreeningDto, ListFunnelDto } from './dto/create-funnel.dto';
import type { CreateToolTestDto } from './dto/tool-test.dto';
import type { CreateProductivityInterviewDto } from './dto/productivity-interview.dto';
import type { CreateReferencesCheckDto, UpdateReferencesCheckDto } from './dto/references-check.dto';
import type { CreateJobOfferDto, UpdateJobOfferStatusDto } from './dto/job-offer.dto';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    private readonly funnelSvc: RecruitmentFunnelService,
    private readonly assessmentSvc: RecruitmentAssessmentService,
    private readonly statsSvc: RecruitmentStatsService,
  ) {}

  // Funnel delegation
  createFunnel(dto: CreateFunnelDto, createdById: number): Promise<Result<object, AppError>> { this.logger.log(`Yangi funnel yaratilmoqda: candidateId=${dto.candidateId ?? ''}`); return this.funnelSvc.createFunnel(dto, createdById); }
  listFunnels(query: ListFunnelDto) { return this.funnelSvc.listFunnels(query); }
  getFunnelById(id: number) { return this.funnelSvc.getFunnelById(id); }
  getFunnelKanban(vacancyId?: number) { return this.funnelSvc.getFunnelKanban(vacancyId); }
  getFunnelKanbanHc(vacancyId?: number) { return this.funnelSvc.getFunnelKanbanHc(vacancyId); }
  moveFunnelStage(funnelId: number, dto: MoveFunnelStageDto, changedById: number) { this.logger.log(`Funnel #${funnelId} bosqich o'zgardi -> ${dto.newStage ?? ''}`); return this.funnelSvc.moveFunnelStage(funnelId, dto, changedById); }
  quickScreening(funnelId: number, dto: QuickScreeningDto, userId: number) { return this.funnelSvc.quickScreening(funnelId, dto, userId); }

  // Assessment delegation
  createToolTest(dto: CreateToolTestDto, testedById: number) { return this.assessmentSvc.createToolTest(dto, testedById); }
  matchPositionProfile(toolTestId: number, positionKey: string) { return this.assessmentSvc.matchPositionProfile(toolTestId, positionKey); }
  getToolTestByCandidate(candidateId: number) { return this.assessmentSvc.getToolTestByCandidate(candidateId); }
  createProductivityInterview(dto: CreateProductivityInterviewDto, interviewerId: number) { return this.assessmentSvc.createProductivityInterview(dto, interviewerId); }
  getProductivityInterview(candidateId: number) { return this.assessmentSvc.getProductivityInterview(candidateId); }
  createReferencesCheck(dto: CreateReferencesCheckDto, checkedById: number) { return this.assessmentSvc.createReferencesCheck(dto, checkedById); }
  getReferencesChecksByFunnel(funnelId: number) { return this.assessmentSvc.getReferencesChecksByFunnel(funnelId); }
  updateReferencesCheck(id: number, dto: UpdateReferencesCheckDto) { return this.assessmentSvc.updateReferencesCheck(id, dto); }
  createJobOffer(dto: CreateJobOfferDto, createdById: number) { this.logger.log(`Ish taklifi yaratilmoqda candidateId=${dto.candidateId ?? ""}`); return this.assessmentSvc.createJobOffer(dto, createdById); }
  getJobOffersByCandidate(candidateId: number) { return this.assessmentSvc.getJobOffersByCandidate(candidateId); }
  getJobOfferById(id: number) { return this.assessmentSvc.getJobOfferById(id); }
  updateJobOfferStatus(id: number, dto: UpdateJobOfferStatusDto) { return this.assessmentSvc.updateJobOfferStatus(id, dto); }

  // Stats delegation
  getWeeklyStatistics(recruiterId: number, weekStart: Date) { return this.statsSvc.getWeeklyStatistics(recruiterId, weekStart); }
  runHrHealthCheck() { return this.statsSvc.runHrHealthCheck(); }
  getChannelAnalytics() { return this.statsSvc.getChannelAnalytics(); }
}
