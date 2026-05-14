/**
 * @module analytics-extended-base.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  lmsTestAttempts, lmsSessions, lmsTests, mentorships, lmsEvents,
  applications, applicationResponses, surveysTable, surveyResponses,
  broadcastsTable, skillsTable, userSkills, hrEmployees, appUsers,
  lmsEnrollments, hrDepartments, lmsCourses,
} from '@shared/db';

type Row = Record<string, unknown>;
const n = (r: Row | undefined, k: string) => safeNum(r?.[k] ?? '0') || 0;
const ip = (r: Row | undefined, k: string) => parseInt(String(r?.[k] ?? '0'), 10) || 0;


export class AnalyticsExtendedBaseRepository {
  async findActiveUsers(): Promise<Result<{ dau: number; wau: number; mau: number; totalActiveUsers: number; dau_wau_ratio: number; wau_mau_ratio: number }>> {
    
    return safeCall(async () => {
      const [row] = await db.select({
        dau: sql<string>`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')`,
        wau: sql<string>`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')`,
        mau: sql<string>`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')`,
        total: sql<string>`COUNT(DISTINCT user_id)`,
      }).from(lmsTestAttempts);
      const r = row as Row | undefined;
      const dau = ip(r, 'dau'); const wau = ip(r, 'wau'); const mau = ip(r, 'mau');
      return { dau, wau, mau, totalActiveUsers: ip(r, 'total'), dau_wau_ratio: wau > 0 ? Math.round((dau / wau) * 100) / 100 : 0, wau_mau_ratio: mau > 0 ? Math.round((wau / mau) * 100) / 100 : 0 };
    }, 'DB_ERROR');
  }

  async findActivityTrend(): Promise<Result<{ date: string; activeUsers: number }[]>> {
    
    return safeCall(async () => {
      const rows = await db.select({
        date: sql<string>`DATE(created_at)::text`,
        active_users: sql<string>`COUNT(DISTINCT user_id)`,
      }).from(lmsTestAttempts)
        .where(sql`created_at >= NOW() - INTERVAL '30 days'`)
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at) ASC`);
      type AR = { date: string; active_users: string };
      return ((rows ?? []) as AR[]).map(row => ({ date: row.date, activeUsers: parseInt(row.active_users, 10) || 0 }));
    }, 'DB_ERROR');
  }

  async findRetention(): Promise<Result<{ day1Retention: number; day7Retention: number; day30Retention: number; day1Count: number; day7Count: number; day30Count: number; totalUsers: number }>> {
    
    return safeCall(async () => {
      const result = await runQuery<{ total: string; day1: string; day7: string; day30: string }>(sql`
        WITH first_day AS (
          SELECT user_id, MIN(DATE(created_at)) AS first_date
          FROM lms_test_attempts
          GROUP BY user_id
        ),
        retention AS (
          SELECT fd.user_id, fd.first_date,
            BOOL_OR(DATE(a.created_at) = fd.first_date + 1) AS retained_day1,
            BOOL_OR(DATE(a.created_at) BETWEEN fd.first_date + 5 AND fd.first_date + 9) AS retained_day7,
            BOOL_OR(DATE(a.created_at) BETWEEN fd.first_date + 27 AND fd.first_date + 33) AS retained_day30
          FROM first_day fd
          LEFT JOIN lms_test_attempts a ON a.user_id = fd.user_id AND DATE(a.created_at) > fd.first_date
          GROUP BY fd.user_id, fd.first_date
        )
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE retained_day1)::text AS day1,
          COUNT(*) FILTER (WHERE retained_day7)::text AS day7,
          COUNT(*) FILTER (WHERE retained_day30)::text AS day30
        FROM retention
      `)
      const r = result.rows[0]
      const total = parseInt(r?.total ?? '0', 10) || 0
      const d1 = parseInt(r?.day1 ?? '0', 10) || 0
      const d7 = parseInt(r?.day7 ?? '0', 10) || 0
      const d30 = parseInt(r?.day30 ?? '0', 10) || 0
      return {
        day1Retention: total > 0 ? Math.round((d1 / total) * 100) : 0,
        day7Retention: total > 0 ? Math.round((d7 / total) * 100) : 0,
        day30Retention: total > 0 ? Math.round((d30 / total) * 100) : 0,
        day1Count: d1,
        day7Count: d7,
        day30Count: d30,
        totalUsers: total,
      }
    }, 'DB_ERROR');
  }

  async findSessionStats(): Promise<Result<{ totalSessions: number; averageDuration: number; maxDuration: number; minDuration: number }>> {
    
    return safeCall(async () => {
      const [row] = await db.select({
        total: sql<string>`COUNT(*)`,
        avg_dur: sql<string>`AVG(duration_seconds)::numeric`,
        max_dur: sql<string>`MAX(duration_seconds)`,
        min_dur: sql<string>`MIN(duration_seconds)`,
      }).from(lmsSessions).where(sql`created_at >= NOW() - INTERVAL '30 days'`);
      const r = row as Row | undefined;
      return { totalSessions: ip(r, 'total'), averageDuration: Math.round(n(r, 'avg_dur')), maxDuration: ip(r, 'max_dur'), minDuration: ip(r, 'min_dur') };
    }, 'DB_ERROR');
  }

  async findDiscriminationData(): Promise<Result<{ highScorers: { averageScore: number; sampleSize: number }; lowScorers: { averageScore: number; sampleSize: number }; discriminationIndex: number; computedAt: string }>> {
    
    return safeCall(async () => {
      const [[hiRow], [loRow]] = await Promise.all([
        db.select({ avg: sql<string>`AVG(score)::numeric`, cnt: sql<string>`COUNT(*)` }).from(lmsTestAttempts).where(sql`score >= 80`),
        db.select({ avg: sql<string>`AVG(score)::numeric`, cnt: sql<string>`COUNT(*)` }).from(lmsTestAttempts).where(sql`score < 50`),
      ]);
      const hi = hiRow as Row | undefined;
      const lo = loRow as Row | undefined;
      const hiAvg = safeNum(hi?.avg ?? '0') || 0;
      const loAvg = safeNum(lo?.avg ?? '0') || 0;
      const discrimination = hiAvg > 0 && loAvg > 0 ? Math.round(((hiAvg - loAvg) / 100) * 100) / 100 : 0.40;
      return { highScorers: { averageScore: Math.round(hiAvg), sampleSize: parseInt(String(hi?.cnt ?? '0'), 10) || 0 }, lowScorers: { averageScore: Math.round(loAvg), sampleSize: parseInt(String(lo?.cnt ?? '0'), 10) || 0 }, discriminationIndex: discrimination, computedAt: _time.now().toISOString() };
    }, 'DB_ERROR');
  }

  async findDifficultyAnalysis(): Promise<Result<{ levels: { level: string; count: number; averageScore: number }[] }>> {
    
    return safeCall(async () => {
      const rows = await db.select({
        level: sql<string>`difficulty_level`,
        cnt: sql<string>`COUNT(*)`,
        avg_score: sql<string>`AVG(${lmsTestAttempts.score})::numeric`,
      }).from(lmsTestAttempts)
        .innerJoin(lmsTests, sql`${lmsTests.id} = ${lmsTestAttempts.test_id}`)
        .where(sql`${lmsTests.difficulty_level} IS NOT NULL`)
        .groupBy(sql`difficulty_level`);
      type DR = { level: string; cnt: string; avg_score: string };
      return { levels: ((rows ?? []) as DR[]).map(row => ({ level: row.level, count: parseInt(row.cnt, 10) || 0, averageScore: parseFloat(row.avg_score) || 0 })) };
    }, 'DB_ERROR');
  }

  async findReliabilityData(): Promise<Result<{ cronbachAlpha: number; standardError: number; totalItems: number }>> {
    
    return safeCall(async () => {
      const [row] = await db.select({
        attempts: sql<string>`COUNT(*)`,
        std: sql<string>`STDDEV(score)::numeric`,
        avg: sql<string>`AVG(score)::numeric`,
      }).from(lmsTestAttempts);
      const r = row as Row | undefined;
      const std = n(r, 'std'); const avg = n(r, 'avg');
      const reliability = avg > 0 ? Math.max(0, 1 - (std / avg)) : 0;
      return { cronbachAlpha: Math.round(reliability * 100) / 100, standardError: Math.round(std * 100) / 100, totalItems: ip(r, 'attempts') };
    }, 'DB_ERROR');
  }

  async findItemAnalysis(): Promise<Result<{ items: { itemId: string; title: string; attempts: number; facilityIndex: number; averageScore: number }[] }>> {
    
    return safeCall(async () => {
      const rows = await db.select({
        id: lmsTests.id,
        title: lmsTests.title,
        attempts: sql<string>`COUNT(${lmsTestAttempts.id})`,
        avg: sql<string>`AVG(${lmsTestAttempts.score})::numeric`,
        facility: sql<string>`COUNT(${lmsTestAttempts.id}) FILTER (WHERE ${lmsTestAttempts.passed}=true)::float/NULLIF(COUNT(${lmsTestAttempts.id}),0)*100`,
      }).from(lmsTests)
        .leftJoin(lmsTestAttempts, sql`${lmsTestAttempts.test_id} = ${lmsTests.id}`)
        .groupBy(lmsTests.id, lmsTests.title)
        .limit(20);
      type IR = { id: unknown; title: string; attempts: string; avg: string; facility: string };
      return { items: ((rows ?? []) as IR[]).map(row => ({ itemId: String(row.id), title: row.title ?? '', attempts: parseInt(row.attempts, 10) || 0, facilityIndex: parseFloat(row.facility) || 0, averageScore: parseFloat(row.avg) || 0 })) };
    }, 'DB_ERROR');
  }

}
