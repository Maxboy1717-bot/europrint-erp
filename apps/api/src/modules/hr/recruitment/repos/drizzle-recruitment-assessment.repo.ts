/**
 * @module drizzle-recruitment-assessment.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@shared/db';
import {
  candidates, hrCandidateFunnels, hrToolTestResults, hrProductivityInterviews,
  hrReferencesChecks, hrJobOffers,
} from '@europrint/schemas';
import { sql, eq, desc } from 'drizzle-orm';
import type { CreateToolTestDto } from '../dto/tool-test.dto';
import type { CreateProductivityInterviewDto } from '../dto/productivity-interview.dto';
import type { CreateReferencesCheckDto, UpdateReferencesCheckDto } from '../dto/references-check.dto';
import type { CreateJobOfferDto, UpdateJobOfferStatusDto } from '../dto/job-offer.dto';

@Injectable()
export class DrizzleRecruitmentAssessmentRepository {
  async insertToolTest(values: typeof hrToolTestResults.$inferInsert) {
    try {
      const _testRows = await db.insert(hrToolTestResults).values(values).returning();
      return Array.isArray(_testRows) ? _testRows[0] : (_testRows as { rows: unknown[] })?.rows?.[0];
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.insertToolTest: ${String(e)}`);
    }
  }

  async updateFunnelProductivityCategory(funnelId: number, productivityCategory: string) {
    try {
      await db.update(hrCandidateFunnels)
        .set({ productivityCategory, updatedAt: _time.now() } as Partial<typeof hrCandidateFunnels.$inferInsert>)
        .where(eq(hrCandidateFunnels.id, funnelId));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.updateFunnelProductivityCategory: ${String(e)}`);
    }
  }

  async findToolTestById(toolTestId: number) {
    try {
      const [test] = await db.select().from(hrToolTestResults).where(eq(hrToolTestResults.id, toolTestId)).limit(1);
      if (!test) throw new NotFoundException(`Tool Test #${toolTestId} topilmadi`);
      return test;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findToolTestById: ${String(e)}`);
    }
  }

  async updateToolTestMatchScore(toolTestId: number, positionMatchScore: number, positionMatchNotes: string) {
    try {
      await db.update(hrToolTestResults)
        .set({ positionMatchScore, positionMatchNotes } as Partial<typeof hrToolTestResults.$inferInsert>)
        .where(eq(hrToolTestResults.id, toolTestId));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.updateToolTestMatchScore: ${String(e)}`);
    }
  }

  async findToolTestsByCandidate(candidateId: number) {
    try {
      return await db.select().from(hrToolTestResults)
        .where(eq(hrToolTestResults.candidateId, candidateId))
        .orderBy(desc(hrToolTestResults.testDate));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findToolTestsByCandidate: ${String(e)}`);
    }
  }

  async findCandidateById(candidateId: number) {
    try {
      const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, candidateId));
      if (!candidate) throw new NotFoundException(`Nomzod #${candidateId} topilmadi`);
      return candidate;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findCandidateById: ${String(e)}`);
    }
  }

  async insertProductivityInterview(dto: CreateProductivityInterviewDto, interviewerId: number) {
    try {
      const _intRows = await db.insert(hrProductivityInterviews).values({
        id: sql`DEFAULT`,
        candidateId: dto.candidateId,
        funnelId: dto.funnelId,
        interviewerId,
        productivityInterview: dto.productivityInterview ? JSON.stringify(dto.productivityInterview) : null,
        referenceCheck: dto.referenceCheck ? JSON.stringify(dto.referenceCheck) : null,
        finalDecision: dto.finalDecision ?? null,
        conductedAt: _time.now(),
      }).returning();
      return Array.isArray(_intRows) ? _intRows[0] : (_intRows as { rows: unknown[] })?.rows?.[0];
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.insertProductivityInterview: ${String(e)}`);
    }
  }

  async findProductivityInterviewsByCandidate(candidateId: number) {
    try {
      return await db.select().from(hrProductivityInterviews)
        .where(eq(hrProductivityInterviews.candidateId, candidateId))
        .orderBy(desc(hrProductivityInterviews.conductedAt));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findProductivityInterviewsByCandidate: ${String(e)}`);
    }
  }

  async findFunnelById(funnelId: number) {
    try {
      const [funnel] = await db.select({ id: hrCandidateFunnels.id })
        .from(hrCandidateFunnels)
        .where(eq(hrCandidateFunnels.id, funnelId))
        .limit(1);
      if (!funnel) throw new NotFoundException(`Funnel #${funnelId} topilmadi`);
      return funnel;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findFunnelById: ${String(e)}`);
    }
  }

  async insertReferencesCheck(dto: CreateReferencesCheckDto, checkedById: number) {
    try {
      const _refRows = await db.insert(hrReferencesChecks)
        .values({ ...dto, checkedById, checkedAt: _time.now() } as typeof hrReferencesChecks.$inferInsert)
        .returning();
      return Array.isArray(_refRows) ? _refRows[0] : (_refRows as { rows: unknown[] })?.rows?.[0];
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.insertReferencesCheck: ${String(e)}`);
    }
  }

  async findReferencesChecksByFunnel(funnelId: number) {
    try {
      return await db.select().from(hrReferencesChecks)
        .where(eq(hrReferencesChecks.funnelId, funnelId))
        .orderBy(desc(hrReferencesChecks.createdAt));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findReferencesChecksByFunnel: ${String(e)}`);
    }
  }

  async findReferencesCheckById(id: number) {
    try {
      const [existing] = await db.select({ id: hrReferencesChecks.id })
        .from(hrReferencesChecks)
        .where(eq(hrReferencesChecks.id, id))
        .limit(1);
      if (!existing) throw new NotFoundException(`References Check #${id} topilmadi`);
      return existing;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findReferencesCheckById: ${String(e)}`);
    }
  }

  async updateReferencesCheck(id: number, dto: UpdateReferencesCheckDto) {
    try {
      const [updated] = await db.update(hrReferencesChecks)
        .set({ ...dto, checkedAt: _time.now() } as Partial<typeof hrReferencesChecks.$inferInsert>)
        .where(eq(hrReferencesChecks.id, id))
        .returning();
      return updated;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.updateReferencesCheck: ${String(e)}`);
    }
  }

  async insertJobOffer(dto: CreateJobOfferDto, createdById: number) {
    try {
      const _offerRows = await db.insert(hrJobOffers).values({
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        offerExpiresAt: dto.offerExpiresAt ? new Date(dto.offerExpiresAt) : undefined,
        status: 'DRAFT', createdById,
      } as typeof hrJobOffers.$inferInsert).returning();
      return Array.isArray(_offerRows) ? _offerRows[0] : (_offerRows as { rows: unknown[] })?.rows?.[0];
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.insertJobOffer: ${String(e)}`);
    }
  }

  async findJobOffersByCandidate(candidateId: number) {
    try {
      return await db.select().from(hrJobOffers)
        .where(eq(hrJobOffers.candidateId, candidateId))
        .orderBy(desc(hrJobOffers.createdAt));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findJobOffersByCandidate: ${String(e)}`);
    }
  }

  async findJobOfferById(id: number) {
    try {
      const [offer] = await db.select().from(hrJobOffers).where(eq(hrJobOffers.id, id)).limit(1);
      if (!offer) throw new NotFoundException(`Job Offer #${id} topilmadi`);
      return offer;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.findJobOfferById: ${String(e)}`);
    }
  }

  async updateJobOffer(id: number, setValues: Record<string, unknown>) {
    try {
      const [updated] = await db.update(hrJobOffers)
        .set(setValues as Partial<typeof hrJobOffers.$inferInsert>)
        .where(eq(hrJobOffers.id, id))
        .returning();
      return updated;
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.updateJobOffer: ${String(e)}`);
    }
  }

  async markFunnelAsHired(funnelId: number) {
    try {
      await db.update(hrCandidateFunnels)
        .set({ funnelStage: 'HIRED', hiredAt: _time.now(), updatedAt: _time.now() })
        .where(eq(hrCandidateFunnels.id, funnelId));
    } catch (e) {
      throw new Error(`drizzle_recruitment_assessment.markFunnelAsHired: ${String(e)}`);
    }
  }
}
