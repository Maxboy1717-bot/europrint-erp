import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import {
  hrJobDescriptions,
  hrMotivationPlans,
} from '@europrint/schemas';
import { eq, and, desc } from 'drizzle-orm';
import type { CreateJobDescriptionDto } from './dto/onboarding.dto';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class OnboardingJobService {
  private readonly logger = new Logger(OnboardingJobService.name);
  // ──────────────────── JOB DESCRIPTIONS ──────────────────────────────────

  async createJobDescription(dto: CreateJobDescriptionDto, createdById: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    this.logger.log(`onboarding job: yaratilmoqda`);
    await db
      .update(hrJobDescriptions)
      .set({ isCurrentVersion: false } as never)
      .where(
        and(
          eq(hrJobDescriptions.positionId, dto.positionId),
          eq(hrJobDescriptions.isCurrentVersion, true),
        ),
      );

    const existing = await db
      .select({ version: hrJobDescriptions.version })
      .from(hrJobDescriptions)
      .where(eq(hrJobDescriptions.positionId, dto.positionId))
      .orderBy(desc(hrJobDescriptions.version))
      .limit(1);

    const newVersion = (existing[0]?.version ?? 0) + 1;

    const _jdRows = await db
      .insert(hrJobDescriptions)
      .values({ ...dto, version: newVersion, isCurrentVersion: true, createdById } as never)
      .returning();

    return _jdRows[0];
  
    });}

  async listJobDescriptions(positionId?: number){
    return safeCall(async () => {
    const filters = [eq(hrJobDescriptions.isCurrentVersion, true)];
    if (positionId) filters.push(eq(hrJobDescriptions.positionId, positionId));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    return db
      .select()
      .from(hrJobDescriptions)
      .where(where)
      .orderBy(desc(hrJobDescriptions.updatedAt));
  
    });}

  async approveJobDescription(id: number, approvedById: number){
    return safeCall(async () => {
    this.logger.log(`Onboarding ish jarayoni bajarilmoqda`);
    const [updated] = await db
      .update(hrJobDescriptions)
      .set({ updatedAt: _time.now() })
      .where(eq(hrJobDescriptions.id, id))
      .returning();
    if (!updated) throw new NotFoundException(`Job Description #${id} topilmadi`);
    return updated;
  
    });}

  // ──────────────────── MOTIVATION PLANS ──────────────────────────────────

  async createMotivationPlan(
    employeeId: number,
    data: {
      toneScaleLevel?: number;
      toneScaleDescription?: string;
      orientationType?: string;
      orientationNotes?: string;
      motivationFactors?: Record<string, unknown>;
      actionPlan?: unknown[];
    },
    createdById: number,
  ){
    return safeCall(async () => {
    this.logger.log(`onboarding job: yaratilmoqda`);
    await db
      .update(hrMotivationPlans)
      .set({ isActive: false, updatedAt: _time.now() } as never)
      .where(and(eq(hrMotivationPlans.employeeId, employeeId), eq(hrMotivationPlans.isActive, true)));

    const _planRows = await db
      .insert(hrMotivationPlans)
      .values({ employeeId, createdById, isActive: true, ...data } as never)
      .returning();

    return _planRows[0];
  
    });}

  async getEmployeeMotivationPlan(employeeId: number){
    return safeCall(async () => {
    const [plan] = await db
      .select()
      .from(hrMotivationPlans)
      .where(and(eq(hrMotivationPlans.employeeId, employeeId), eq(hrMotivationPlans.isActive, true)))
      .orderBy(desc(hrMotivationPlans.createdAt))
      .limit(1);
    return plan ?? null;
  
    });}
}
