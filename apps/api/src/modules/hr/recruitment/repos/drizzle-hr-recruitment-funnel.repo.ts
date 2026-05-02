import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { candidates, hrCandidateFunnels, hrFunnelHistory, hrReferencesChecks } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IHrRecruitmentFunnelRepository } from './i-hr-recruitment-funnel.repo';

type CandidateFunnelRow = typeof hrCandidateFunnels.$inferSelect;
type FunnelHistoryRow = typeof hrFunnelHistory.$inferSelect;

@Injectable()
export class DrizzleHrRecruitmentFunnelRepository implements IHrRecruitmentFunnelRepository {
  async findCandidateById(id: number) {
    try {
      const [row] = await db.select({ id: candidates.id, full_name: candidates.full_name }).from(candidates).where(and(eq(candidates.id, id), isNull(candidates.deleted_at)));
      return Ok(row || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Nomzod #${id} topilmadi`); }
  }

  async findActiveFunnelForCandidate(candidateId: number) {
    try {
      const [row] = await db.select({ id: hrCandidateFunnels.id }).from(hrCandidateFunnels).where(and(eq(hrCandidateFunnels.candidateId, candidateId), eq(hrCandidateFunnels.isActive, true))).limit(1);
      return Ok(row || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Faol funnel tekshirishda xatolik'); }
  }

  async createFunnel(dto: unknown, createdById: number) {
    try {
      const d = dto as Record<string, unknown>;
      const row: Omit<typeof hrCandidateFunnels.$inferInsert, 'id'> = {
        candidateId: (d['candidateId'] as number | undefined) ?? 0,
        vacancyId: d['vacancyId'] as number | undefined,
        funnelStage: 'NEW',
        productivityCategory: 'UNKNOWN',
        isActive: true,
        source: d['source'] as string | undefined,
        assignedRecruiterId: (d['assignedRecruiterId'] as number | undefined) ?? createdById,
        notes: d['notes'] as string | undefined,
      };
      const [created] = await db.insert(hrCandidateFunnels).values(row as typeof hrCandidateFunnels.$inferInsert).returning();
      return Ok(created as CandidateFunnelRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Funnel yaratishda xatolik'); }
  }

  async insertFunnelHistory(dto: { funnelId: number; fromStage: string | null; toStage: string; changedById: number; notes?: string }) {
    try {
      const row: Omit<typeof hrFunnelHistory.$inferInsert, 'id'> = {
        funnelId: String(dto.funnelId),
        stage: dto.toStage,
        fromStage: dto.fromStage,
        changedBy: String(dto.changedById),
        notes: dto.notes,
      };
      const [inserted] = await db.insert(hrFunnelHistory).values(row as typeof hrFunnelHistory.$inferInsert).returning();
      return Ok(inserted as FunnelHistoryRow);
    } catch (e: unknown) { return Err((e as Error)?.message || "Tarix qo'shishda xatolik"); }
  }

  async listFunnels(query: { stage?: string; vacancyId?: number; recruiterId?: number; productivityCategory?: string; page: number; limit: number }) {
    try {
      const { stage, vacancyId, recruiterId, productivityCategory, page, limit } = query;
      const offset = (page - 1) * limit;
      const filters = [eq(hrCandidateFunnels.isActive, true)];
      if (stage) filters.push(eq(hrCandidateFunnels.funnelStage, String(stage)));
      if (vacancyId) filters.push(eq(hrCandidateFunnels.vacancyId, vacancyId));
      if (recruiterId) filters.push(eq(hrCandidateFunnels.assignedRecruiterId, recruiterId));
      if (productivityCategory) filters.push(eq(hrCandidateFunnels.productivityCategory, String(productivityCategory)));
      const where = filters.length > 1 ? and(...filters) : filters[0];
      const [totalRow] = await db.select({ count: count() }).from(hrCandidateFunnels).where(where);
      const total = Number(totalRow?.count ?? 0);
      const data = await db.select({
        id: hrCandidateFunnels.id, funnelStage: hrCandidateFunnels.funnelStage, productivityCategory: hrCandidateFunnels.productivityCategory, source: hrCandidateFunnels.source,
        screeningScore: hrCandidateFunnels.screeningScore, candidateId: hrCandidateFunnels.candidateId, vacancyId: hrCandidateFunnels.vacancyId,
        assignedRecruiterId: hrCandidateFunnels.assignedRecruiterId, createdAt: hrCandidateFunnels.createdAt, updatedAt: hrCandidateFunnels.updatedAt,
        candidateName: candidates.full_name, candidatePhone: candidates.phone, candidateEmail: candidates.email,
      }).from(hrCandidateFunnels).leftJoin(candidates, eq(hrCandidateFunnels.candidateId, candidates.id)).where(where).orderBy(desc(hrCandidateFunnels.updatedAt)).limit(limit).offset(offset);
      return Ok({ data, total, page, limit });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Funnellar topilmadi'); }
  }

  async getFunnelById(id: number) {
    try {
      const [row] = await db.select().from(hrCandidateFunnels).where(eq(hrCandidateFunnels.id, id)).limit(1);
      return Ok((row as CandidateFunnelRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Funnel #${id} topilmadi`); }
  }

  async getFunnelKanban(vacancyId?: number) {
    try {
      const filters = [eq(hrCandidateFunnels.isActive, true)];
      if (vacancyId) filters.push(eq(hrCandidateFunnels.vacancyId, vacancyId));
      const where = filters.length > 1 ? and(...filters) : filters[0];
      const rows = await db.select({
        id: hrCandidateFunnels.id, funnelStage: hrCandidateFunnels.funnelStage, productivityCategory: hrCandidateFunnels.productivityCategory,
        source: hrCandidateFunnels.source, screeningScore: hrCandidateFunnels.screeningScore, candidateId: hrCandidateFunnels.candidateId,
        candidateName: candidates.full_name, candidatePhone: candidates.phone, updatedAt: hrCandidateFunnels.updatedAt,
      }).from(hrCandidateFunnels).leftJoin(candidates, eq(hrCandidateFunnels.candidateId, candidates.id)).where(where).orderBy(desc(hrCandidateFunnels.updatedAt));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Kanban topilmadi'); }
  }

  async countReferencesChecks(funnelId: number): Promise<Result<number>> {
    try {
      const [row] = await db.select({ cnt: count() }).from(hrReferencesChecks).where(eq(hrReferencesChecks.funnelId, funnelId));
      return Ok(Number(row?.cnt ?? 0));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Navedenie spravok sanashda xatolik'); }
  }

  async updateFunnel(id: number, data: Record<string, unknown>) {
    try {
      const patch: Partial<typeof hrCandidateFunnels.$inferInsert> = {
        ...(data.funnelStage !== undefined ? { funnelStage: data.funnelStage as string } : {}),
        ...(data.productivityCategory !== undefined ? { productivityCategory: data.productivityCategory as string } : {}),
        ...(data.source !== undefined ? { source: data.source as string } : {}),
        ...(data.assignedRecruiterId !== undefined ? { assignedRecruiterId: data.assignedRecruiterId as number } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive as boolean } : {}),
        ...(data.notes !== undefined ? { notes: data.notes as string } : {}),
        ...(data.screeningScore !== undefined ? { screeningScore: data.screeningScore as string } : {}),
        ...(data.initialScreeningNotes !== undefined ? { initialScreeningNotes: data.initialScreeningNotes as string } : {}),
        ...(data.quickRejectionReason !== undefined ? { quickRejectionReason: data.quickRejectionReason as string } : {}),
        ...(data.rejectedAt !== undefined ? { rejectedAt: data.rejectedAt as Date } : {}),
        ...(data.hiredAt !== undefined ? { hiredAt: data.hiredAt as Date } : {}),
        ...(data.isQuickRejected !== undefined ? { isQuickRejected: data.isQuickRejected as boolean } : {}),
        updatedAt: _time.now(),
      };
      const [updated] = await db.update(hrCandidateFunnels).set(patch).where(eq(hrCandidateFunnels.id, id)).returning();
      return Ok(updated as CandidateFunnelRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Funnel yangilashda xatolik'); }
  }
}
