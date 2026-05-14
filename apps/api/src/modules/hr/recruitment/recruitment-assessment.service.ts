/**
 * @module recruitment-assessment.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { hrToolTestResults } from '@europrint/schemas';
import type { ProductivityCategory } from './dto/create-funnel.dto';
import type { CreateToolTestDto } from './dto/tool-test.dto';
import type { CreateProductivityInterviewDto } from './dto/productivity-interview.dto';
import type { CreateReferencesCheckDto, UpdateReferencesCheckDto } from './dto/references-check.dto';
import type { CreateJobOfferDto, UpdateJobOfferStatusDto } from './dto/job-offer.dto';
import { Result, safeCall } from '@common/result';
import { DrizzleRecruitmentAssessmentRepository } from './repos/drizzle-recruitment-assessment.repo';

const POSITION_IDEAL_PROFILES: Record<string, Record<string, { min?: number; max?: number }>> = {
  SALES_MANAGER:          { B: { min: 15 }, E: { min: 25 }, F: { min: 20 }, J: { min: 30 } },
  ACCOUNTANT:             { A: { min: 40 }, C: { min: 10 }, H: { max: -10 } },
  HR_MANAGER:             { E: { min: 30 }, I: { min: 15 }, J: { min: 25 }, F: { min: 20 } },
  HR_RECRUITER:           { E: { min: 25 }, I: { min: 20 }, J: { min: 35 }, F: { min: 15 } },
  WAREHOUSE_MANAGER:      { A: { min: 35 }, C: { min: 5  }, H: { max: -20 } },
  PRODUCTION_SUPERVISOR:  { B: { min: 10 }, E: { min: 20 }, F: { min: 25 }, G: { min: 5 } },
  IT_DEVELOPER:           { A: { min: 50 }, B: { max: -10 }, D: { min: 20 } },
  MARKETING_MANAGER:      { B: { min: 20 }, E: { min: 30 }, J: { min: 25 }, I: { min: 10 } },
  LOGISTICS_MANAGER:      { A: { min: 30 }, C: { min: 15 }, H: { max: -15 }, F: { min: 10 } },
  DIRECTOR:               { B: { min: 30 }, D: { min: 40 }, E: { min: 30 }, F: { min: 35 } },
};

@Injectable()
export class RecruitmentAssessmentService {
  private readonly logger = new Logger(RecruitmentAssessmentService.name);

  constructor(private readonly repo: DrizzleRecruitmentAssessmentRepository) {}

  async createToolTest(dto: CreateToolTestDto, testedById: number) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yaratilmoqda`);
      const points = [dto.pointA, dto.pointB, dto.pointC, dto.pointD, dto.pointE, dto.pointF, dto.pointG, dto.pointH, dto.pointI, dto.pointJ];
      const totalScore = (Array.isArray(points) ? points : []).reduce((sum, p) => sum + (p ?? 0), 0);
      const flagmanIndicator = (dto.pointD ?? 0) + (dto.pointE ?? 0) + (dto.pointF ?? 0);
      const processnikIndicator = (dto.pointH ?? 0) - (dto.pointD ?? 0);
      let categoryResult: ProductivityCategory = 'UNKNOWN';
      if (flagmanIndicator >= 60) categoryResult = 'FLAGMAN';
      else if (processnikIndicator >= 20 && (dto.pointD ?? 0) < 20) categoryResult = 'PROTSESSNIK';
      else if (totalScore < -50) categoryResult = 'TRABLDAYKER';

      const result = await this.repo.insertToolTest({
        ...dto, totalScore, categoryResult, testedById, testDate: _time.now(), isValid: true,
      } as typeof hrToolTestResults.$inferInsert);

      if (dto.funnelId) {
        await this.repo.updateFunnelProductivityCategory(dto.funnelId, categoryResult);
      }
      return { ...(result as Record<string, unknown>), interpretation: this.interpretToolTest(dto) };
    });
  }

  private interpretToolTest(dto: CreateToolTestDto) {
    const s = (v: number | undefined) => {
      if (v === undefined) return 'LOW';
      if (Math.abs(v) >= 80) return 'COMPULSIVE';
      if (v >= 30) return 'HIGH';
      if (v >= 0) return 'MEDIUM';
      return 'LOW';
    };
    return {
      attention:     { value: dto.pointA, label: 'Diqqat (Внимание)',        status: s(dto.pointA) },
      strategy:      { value: dto.pointB, label: 'Strategiya (Стратегия)',    status: s(dto.pointB) },
      control:       { value: dto.pointC, label: 'Nazorat (Контроль)',        status: s(dto.pointC) },
      confidence:    { value: dto.pointD, label: 'Ishonch (Уверенность)',     status: s(dto.pointD) },
      energy:        { value: dto.pointE, label: 'Energiya (Энергия)',        status: s(dto.pointE) },
      decisiveness:  { value: dto.pointF, label: "Qat'iyat (Решительность)", status: s(dto.pointF) },
      defense:       { value: dto.pointG, label: 'Himoya (Оборона)',          status: s(dto.pointG) },
      tactics:       { value: dto.pointH, label: 'Taktika (Тактика)',         status: s(dto.pointH) },
      empathy:       { value: dto.pointI, label: 'Empatiya (Эмпатия)',        status: s(dto.pointI) },
      communication: { value: dto.pointJ, label: 'Muloqot (Общение)',         status: s(dto.pointJ) },
    };
  }

  async matchPositionProfile(toolTestId: number, positionKey: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const test = await this.repo.findToolTestById(toolTestId);
      const idealProfile = POSITION_IDEAL_PROFILES[positionKey];
      if (!idealProfile) return { matchScore: null, message: `'${positionKey}' uchun ideal profil aniqlanmagan` };

      const pointMap: Record<string, number | null> = {
        A: test.pointA != null ? Number(test.pointA) : null, B: test.pointB != null ? Number(test.pointB) : null, C: test.pointC != null ? Number(test.pointC) : null, D: test.pointD != null ? Number(test.pointD) : null, E: test.pointE != null ? Number(test.pointE) : null,
        F: test.pointF != null ? Number(test.pointF) : null, G: test.pointG != null ? Number(test.pointG) : null, H: test.pointH != null ? Number(test.pointH) : null, I: test.pointI != null ? Number(test.pointI) : null, J: test.pointJ != null ? Number(test.pointJ) : null,
      };

      let matchedCriteria = 0;
      let totalCriteria = 0;
      const details: Array<{ point: string; required: { min?: number; max?: number }; actual: number | null; passed: boolean }> = [];

      for (const [pointKey, requirement] of Object.entries(idealProfile)) {
        totalCriteria++;
        const actual = pointMap[pointKey] ?? null;
        let passed = false;
        if (actual !== null) {
          if (requirement.min !== undefined && actual < requirement.min) passed = false;
          else if (requirement.max !== undefined && actual > requirement.max) passed = false;
          else { passed = true; matchedCriteria++; }
        }
        details.push({ point: pointKey, required: requirement, actual, passed });
      }

      const matchScore = totalCriteria > 0 ? Math.round((matchedCriteria / totalCriteria) * 100) : 0;
      await this.repo.updateToolTestMatchScore(toolTestId, matchScore, positionKey);
      return { matchScore, details, positionKey, recommendation: matchScore >= 70 ? 'SUITABLE' : 'NOT_SUITABLE' };
    });
  }

  async getToolTestByCandidate(candidateId: number) {
    return safeCall(async () => this.repo.findToolTestsByCandidate(candidateId));
  }

  async createProductivityInterview(dto: CreateProductivityInterviewDto, interviewerId: number) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yaratilmoqda`);
      await this.repo.findCandidateById(dto.candidateId);

      const interview = dto.productivityInterview;
      let productivityCategory: ProductivityCategory = 'UNKNOWN';
      if (interview) {
        if (interview.hasConcreteResults && interview.canWorkIndependently) productivityCategory = 'FLAGMAN';
        else if (!interview.hasConcreteResults && interview.overallScore >= 5) productivityCategory = 'PROTSESSNIK';
        else if (interview.overallScore < 5) productivityCategory = 'TRABLDAYKER';
      }

      const result = await this.repo.insertProductivityInterview(dto, interviewerId);
      if (dto.funnelId) {
        await this.repo.updateFunnelProductivityCategory(dto.funnelId, productivityCategory);
      }
      return { ...(result as Record<string, unknown>), classifiedAs: productivityCategory };
    });
  }

  async getProductivityInterview(candidateId: number) {
    return safeCall(async () => this.repo.findProductivityInterviewsByCandidate(candidateId));
  }

  async createReferencesCheck(dto: CreateReferencesCheckDto, checkedById: number) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yaratilmoqda`);
      await this.repo.findFunnelById(dto.funnelId);
      return this.repo.insertReferencesCheck(dto, checkedById);
    });
  }

  async getReferencesChecksByFunnel(funnelId: number) {
    return safeCall(async () => this.repo.findReferencesChecksByFunnel(funnelId));
  }

  async updateReferencesCheck(id: number, dto: UpdateReferencesCheckDto) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yangilanmoqda`);
      await this.repo.findReferencesCheckById(id);
      return this.repo.updateReferencesCheck(id, dto);
    });
  }

  async createJobOffer(dto: CreateJobOfferDto, createdById: number) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yaratilmoqda`);
      await this.repo.findCandidateById(dto.candidateId);
      return this.repo.insertJobOffer(dto, createdById);
    });
  }

  async getJobOffersByCandidate(candidateId: number) {
    return safeCall(async () => this.repo.findJobOffersByCandidate(candidateId));
  }

  async getJobOfferById(id: number) {
    return safeCall(async () => this.repo.findJobOfferById(id));
  }

  async updateJobOfferStatus(id: number, dto: UpdateJobOfferStatusDto) {
    return safeCall(async () => {
      this.logger.log(`recruitment assessment: yangilanmoqda`);
      const existing = await this.repo.findJobOfferById(id);
      const setValues: Record<string, unknown> = { status: dto.status, updatedAt: _time.now() };
      if (dto.status === 'SENT') setValues['sentAt'] = _time.now();
      else if (dto.status === 'ACCEPTED' || dto.status === 'DECLINED') setValues['respondedAt'] = _time.now();
      if (dto.declineReason) setValues['declineReason'] = dto.declineReason;
      const updated = await this.repo.updateJobOffer(id, setValues);
      if (dto.status === 'ACCEPTED' && existing.funnelId) {
        await this.repo.markFunnelAsHired(existing.funnelId);
      }
      return updated;
    });
  }
}
