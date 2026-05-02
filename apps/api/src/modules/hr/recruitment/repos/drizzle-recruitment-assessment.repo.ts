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
    const _testRows = await db.insert(hrToolTestResults).values(values).returning();
    return Array.isArray(_testRows) ? _testRows[0] : (_testRows as { rows: unknown[] })?.rows?.[0];
  }

  async updateFunnelProductivityCategory(funnelId: number, productivityCategory: string) {
    await db.update(hrCandidateFunnels)
      .set({ productivityCategory, updatedAt: _time.now() } as Partial<typeof hrCandidateFunnels.$inferInsert>)
      .where(eq(hrCandidateFunnels.id, funnelId));
  }

  async findToolTestById(toolTestId: number) {
    const [test] = await db.select().from(hrToolTestResults).where(eq(hrToolTestResults.id, toolTestId)).limit(1);
    if (!test) throw new NotFoundException(`Tool Test #${toolTestId} topilmadi`);
    return test;
  }

  async updateToolTestMatchScore(toolTestId: number, positionMatchScore: number, positionMatchNotes: string) {
    await db.update(hrToolTestResults)
      .set({ positionMatchScore, positionMatchNotes } as Partial<typeof hrToolTestResults.$inferInsert>)
      .where(eq(hrToolTestResults.id, toolTestId));
  }

  async findToolTestsByCandidate(candidateId: number) {
    return db.select().from(hrToolTestResults)
      .where(eq(hrToolTestResults.candidateId, candidateId))
      .orderBy(desc(hrToolTestResults.testDate));
  }

  async findCandidateById(candidateId: number) {
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, candidateId));
    if (!candidate) throw new NotFoundException(`Nomzod #${candidateId} topilmadi`);
    return candidate;
  }

  async insertProductivityInterview(dto: CreateProductivityInterviewDto, interviewerId: number) {
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
  }

  async findProductivityInterviewsByCandidate(candidateId: number) {
    return db.select().from(hrProductivityInterviews)
      .where(eq(hrProductivityInterviews.candidateId, candidateId))
      .orderBy(desc(hrProductivityInterviews.conductedAt));
  }

  async findFunnelById(funnelId: number) {
    const [funnel] = await db.select({ id: hrCandidateFunnels.id })
      .from(hrCandidateFunnels)
      .where(eq(hrCandidateFunnels.id, funnelId))
      .limit(1);
    if (!funnel) throw new NotFoundException(`Funnel #${funnelId} topilmadi`);
    return funnel;
  }

  async insertReferencesCheck(dto: CreateReferencesCheckDto, checkedById: number) {
    const _refRows = await db.insert(hrReferencesChecks)
      .values({ ...dto, checkedById, checkedAt: _time.now() } as typeof hrReferencesChecks.$inferInsert)
      .returning();
    return Array.isArray(_refRows) ? _refRows[0] : (_refRows as { rows: unknown[] })?.rows?.[0];
  }

  async findReferencesChecksByFunnel(funnelId: number) {
    return db.select().from(hrReferencesChecks)
      .where(eq(hrReferencesChecks.funnelId, funnelId))
      .orderBy(desc(hrReferencesChecks.createdAt));
  }

  async findReferencesCheckById(id: number) {
    const [existing] = await db.select({ id: hrReferencesChecks.id })
      .from(hrReferencesChecks)
      .where(eq(hrReferencesChecks.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException(`References Check #${id} topilmadi`);
    return existing;
  }

  async updateReferencesCheck(id: number, dto: UpdateReferencesCheckDto) {
    const [updated] = await db.update(hrReferencesChecks)
      .set({ ...dto, checkedAt: _time.now() } as Partial<typeof hrReferencesChecks.$inferInsert>)
      .where(eq(hrReferencesChecks.id, id))
      .returning();
    return updated;
  }

  async insertJobOffer(dto: CreateJobOfferDto, createdById: number) {
    const _offerRows = await db.insert(hrJobOffers).values({
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      offerExpiresAt: dto.offerExpiresAt ? new Date(dto.offerExpiresAt) : undefined,
      status: 'DRAFT', createdById,
    } as typeof hrJobOffers.$inferInsert).returning();
    return Array.isArray(_offerRows) ? _offerRows[0] : (_offerRows as { rows: unknown[] })?.rows?.[0];
  }

  async findJobOffersByCandidate(candidateId: number) {
    return db.select().from(hrJobOffers)
      .where(eq(hrJobOffers.candidateId, candidateId))
      .orderBy(desc(hrJobOffers.createdAt));
  }

  async findJobOfferById(id: number) {
    const [offer] = await db.select().from(hrJobOffers).where(eq(hrJobOffers.id, id)).limit(1);
    if (!offer) throw new NotFoundException(`Job Offer #${id} topilmadi`);
    return offer;
  }

  async updateJobOffer(id: number, setValues: Record<string, unknown>) {
    const [updated] = await db.update(hrJobOffers)
      .set(setValues as Partial<typeof hrJobOffers.$inferInsert>)
      .where(eq(hrJobOffers.id, id))
      .returning();
    return updated;
  }

  async markFunnelAsHired(funnelId: number) {
    await db.update(hrCandidateFunnels)
      .set({ funnelStage: 'HIRED', hiredAt: _time.now(), updatedAt: _time.now() })
      .where(eq(hrCandidateFunnels.id, funnelId));
  }
}
