/**
 * @module recruitment-stats.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { candidates, vacancies, hrCandidateFunnels, hrToolTestResults } from '@europrint/schemas';
import { eq, and, count, desc, gte, lte, isNull, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type StageCount = { stage: string | null; cnt: number };
type CategoryCount = { category: string | null; cnt: number };
type SourceCount = { source: string | null; cnt: number };
type CountRow = { cnt: number };
type ChannelRow = {
  ch_key: string | null;
  vacancy_count: string;
  total_applications: string;
  hired_count: string;
  phone_screening_count: string;
  interview_count: string;
  conversion_rate: string;
};

@Injectable()
export class RecruitmentStatsRepository {
  async getStageCounts(recruiterId: number, weekStart: Date, weekEnd: Date) : Promise<Result<StageCount[]>>{
    return safeCall(async () => {
      return await db.select({ stage: hrCandidateFunnels.funnelStage, cnt: count() })
        .from(hrCandidateFunnels)
        .where(and(eq(hrCandidateFunnels.assignedRecruiterId, recruiterId), gte(hrCandidateFunnels.createdAt, weekStart), lte(hrCandidateFunnels.createdAt, weekEnd)))
        .groupBy(hrCandidateFunnels.funnelStage);
      }, 'DB_ERROR');
  }

  async getProductivityCounts(recruiterId: number, weekStart: Date, weekEnd: Date) : Promise<Result<CategoryCount[]>>{
    return safeCall(async () => {
      return await db.select({ category: hrCandidateFunnels.productivityCategory, cnt: count() })
        .from(hrCandidateFunnels)
        .where(and(eq(hrCandidateFunnels.assignedRecruiterId, recruiterId), gte(hrCandidateFunnels.createdAt, weekStart), lte(hrCandidateFunnels.createdAt, weekEnd)))
        .groupBy(hrCandidateFunnels.productivityCategory);
      }, 'DB_ERROR');
  }

  async getSourceCounts(recruiterId: number, weekStart: Date, weekEnd: Date) : Promise<Result<SourceCount[]>>{
    return safeCall(async () => {
      return await db.select({ source: hrCandidateFunnels.source, cnt: count() })
        .from(hrCandidateFunnels)
        .where(and(eq(hrCandidateFunnels.assignedRecruiterId, recruiterId), gte(hrCandidateFunnels.createdAt, weekStart), lte(hrCandidateFunnels.createdAt, weekEnd)))
        .groupBy(hrCandidateFunnels.source);
      }, 'DB_ERROR');
  }

  async countByStage(stage: string) : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [[row]] = await Promise.all([
        db.select({ cnt: count() }).from(hrCandidateFunnels).where(eq(hrCandidateFunnels.funnelStage, stage)),
      ]);
      return row;
      }, 'DB_ERROR');
  }

  async countRecentFlagmen(thirtyDaysAgo: Date) : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(hrCandidateFunnels).where(and(eq(hrCandidateFunnels.funnelStage, 'HIRED'), eq(hrCandidateFunnels.productivityCategory, 'FLAGMAN'), gte(hrCandidateFunnels.hiredAt, thirtyDaysAgo)));
      return row;
      }, 'DB_ERROR');
  }

  async countActiveVacancies() : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(vacancies).where(eq(vacancies.status, 'active'));
      return row;
      }, 'DB_ERROR');
  }

  async countRecentTests(thirtyDaysAgo: Date) : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(hrToolTestResults).where(gte(hrToolTestResults.testDate, thirtyDaysAgo));
      return row;
      }, 'DB_ERROR');
  }

  async countTotalNew() : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(hrCandidateFunnels).where(eq(hrCandidateFunnels.funnelStage, 'NEW'));
      return row;
      }, 'DB_ERROR');
  }

  async countTotalHired() : Promise<Result<CountRow | undefined>>{
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(hrCandidateFunnels).where(eq(hrCandidateFunnels.funnelStage, 'HIRED'));
      return row;
      }, 'DB_ERROR');
  }

  async getChannelAnalytics() : Promise<Result<ChannelRow[]>>{
    return safeCall(async () => {
      return await db.select({
        ch_key: hrCandidateFunnels.source,
        vacancy_count: sql<string>`cast(count(distinct ${hrCandidateFunnels.vacancyId}) as text)`,
        total_applications: sql<string>`cast(count(*) as text)`,
        hired_count: sql<string>`cast(sum(case when ${hrCandidateFunnels.funnelStage} = 'HIRED' then 1 else 0 end) as text)`,
        phone_screening_count: sql<string>`cast(sum(case when ${hrCandidateFunnels.funnelStage} in ('PHONE_SCREEN','INTERVIEW','OFFER_SENT','HIRED') then 1 else 0 end) as text)`,
        interview_count: sql<string>`cast(sum(case when ${hrCandidateFunnels.funnelStage} in ('INTERVIEW','OFFER_SENT','HIRED') then 1 else 0 end) as text)`,
        conversion_rate: sql<string>`cast(round(case when count(*) = 0 then 0 else (sum(case when ${hrCandidateFunnels.funnelStage} = 'HIRED' then 1 else 0 end)::numeric / count(*)) * 100 end, 1) as text)`,
      }).from(hrCandidateFunnels).where(isNull(hrCandidateFunnels.rejectedAt)).groupBy(hrCandidateFunnels.source).orderBy(desc(sql`count(*)`));
      }, 'DB_ERROR');
  }
}
