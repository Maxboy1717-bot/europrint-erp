/**
 * @module analytics-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { AnalyticsExtendedBaseRepository } from './analytics-extended-base.repository';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  lmsTestAttempts, mentorships, lmsEvents,
  applications, applicationResponses, surveysTable, surveyResponses,
  broadcastsTable, employee_skills, hrEmployees, appUsers,
  hrDepartments, lmsCourses,
} from '@shared/db';

type Row = Record<string, unknown>;
const n = (r: Row | undefined, k: string) => safeNum(r?.[k] ?? '0') || 0;
const ip = (r: Row | undefined, k: string) => parseInt(String(r?.[k] ?? '0'), 10) || 0;


@Injectable()
export class AnalyticsExtendedRepository extends AnalyticsExtendedBaseRepository {
  async findMentorshipsStats(): Promise<Result<{ total: number; active: number; completed: number; topMentors: { mentorName: string; menteeCount: number }[] }>> {

    return safeCall(async () => {
      const [[row], topRows] = await Promise.all([
        db.select({
          total: sql<string>`COUNT(*)`,
          active: sql<string>`COUNT(*) FILTER (WHERE status='active')`,
          completed: sql<string>`COUNT(*) FILTER (WHERE status='completed')`,
        }).from(mentorships),
        db.select({
          mentor_name: appUsers.full_name,
          mentee_count: sql<string>`COUNT(${mentorships.id})`,
        }).from(mentorships)
          .innerJoin(appUsers, sql`${appUsers.id} = ${mentorships.mentor_id}`)
          .groupBy(appUsers.full_name)
          .orderBy(sql`COUNT(${mentorships.id}) DESC`)
          .limit(5),
      ]);
      const r = row as Row | undefined;
      type MR = { mentor_name: string; mentee_count: string };
      return { total: ip(r, 'total'), active: ip(r, 'active'), completed: ip(r, 'completed'), topMentors: ((topRows ?? []) as MR[]).map(r2 => ({ mentorName: r2.mentor_name ?? '', menteeCount: parseInt(r2.mentee_count, 10) || 0 })) };
    }, 'DB_ERROR');
  }

  async findEventsStats(): Promise<Result<{ total: number; scheduled: number; completed: number; byType: { type: string; count: number }[] }>> {

    return safeCall(async () => {
      const [[row], byTypeRows] = await Promise.all([
        db.select({
          total: sql<string>`COUNT(*)`,
          scheduled: sql<string>`COUNT(*) FILTER (WHERE status='scheduled')`,
          completed: sql<string>`COUNT(*) FILTER (WHERE status='completed')`,
        }).from(lmsEvents),
        db.select({
          type: lmsEvents.type,
          cnt: sql<string>`COUNT(*)`,
        }).from(lmsEvents)
          .groupBy(lmsEvents.type)
          .orderBy(sql`COUNT(*) DESC`),
      ]);
      const r = row as Row | undefined;
      type EV = { type: string; cnt: string };
      return { total: ip(r, 'total'), scheduled: ip(r, 'scheduled'), completed: ip(r, 'completed'), byType: ((byTypeRows ?? []) as EV[]).map(r2 => ({ type: r2.type ?? 'other', count: parseInt(r2.cnt, 10) || 0 })) };
    }, 'DB_ERROR');
  }

  async findApplicationsStats(): Promise<Result<{ totalApplications: number; totalResponses: number; pendingResponses: number; approvedResponses: number; rejectedResponses: number }>> {

    return safeCall(async () => {
      const [row] = await db.select({
        apps: sql<string>`COUNT(${applications.id})`,
        resp: sql<string>`COUNT(DISTINCT ${applicationResponses.id})`,
        pending: sql<string>`COUNT(DISTINCT ${applicationResponses.id}) FILTER (WHERE ${applicationResponses.status}='pending')`,
        approved: sql<string>`COUNT(DISTINCT ${applicationResponses.id}) FILTER (WHERE ${applicationResponses.status}='approved')`,
        rejected: sql<string>`COUNT(DISTINCT ${applicationResponses.id}) FILTER (WHERE ${applicationResponses.status}='rejected')`,
      }).from(applications)
        .leftJoin(applicationResponses, sql`${applicationResponses.application_id} = ${applications.id}`);
      const r = row as Row | undefined;
      return { totalApplications: ip(r, 'apps'), totalResponses: ip(r, 'resp'), pendingResponses: ip(r, 'pending'), approvedResponses: ip(r, 'approved'), rejectedResponses: ip(r, 'rejected') };
    }, 'DB_ERROR');
  }

  async findSurveysStats(): Promise<Result<{ total: number; active: number; closed: number; totalResponses: number; responseRate: number }>> {

    return safeCall(async () => {
      const [[row], [respRow]] = await Promise.all([
        db.select({
          total: sql<string>`COUNT(*)`,
          active: sql<string>`COUNT(*) FILTER (WHERE status='active')`,
          closed: sql<string>`COUNT(*) FILTER (WHERE status='closed')`,
        }).from(surveysTable),
        db.select({ cnt: sql<string>`COUNT(*)` }).from(surveyResponses),
      ]);
      const r = row as Row | undefined;
      const total = ip(r, 'total'); const totalResp = ip(respRow as Row, 'cnt');
      return { total, active: ip(r, 'active'), closed: ip(r, 'closed'), totalResponses: totalResp, responseRate: total > 0 ? Math.round((totalResp / total) * 100) : 0 };
    }, 'DB_ERROR');
  }

  async findBroadcastsStats(): Promise<Result<{ total: number; totalRecipients: number; totalSuccess: number; totalFailed: number; successRate: number }>> {

    return safeCall(async () => {
      const [row] = await db.select({
        total: sql<string>`COUNT(*)`,
        recipients: sql<string>`COALESCE(SUM(${broadcastsTable.recipients_count}),0)`,
        succ: sql<string>`COALESCE(SUM(${broadcastsTable.success_count}),0)`,
        fail: sql<string>`COALESCE(SUM(${broadcastsTable.failed_count}),0)`,
      }).from(broadcastsTable);
      const r = row as Row | undefined;
      const succ = ip(r, 'succ'); const fail = ip(r, 'fail'); const tot = succ + fail;
      return { total: ip(r, 'total'), totalRecipients: ip(r, 'recipients'), totalSuccess: succ, totalFailed: fail, successRate: tot > 0 ? Math.round((succ / tot) * 100) : 0 };
    }, 'DB_ERROR');
  }

  async findSkillsStats(): Promise<Result<{ totalSkills: number; totalUserSkills: number; verifiedSkills: number; byCategory: { category: string; count: number }[] }>> {

    return safeCall(async () => {
      const [[row], catRows] = await Promise.all([
        // Converged 2026-05-31: employee_skills is the live source (user_skills frozen/empty).
        db.select({
          total: sql<string>`COUNT(DISTINCT ${employee_skills.skillName})`,
          user_skills: sql<string>`COUNT(${employee_skills.id})`,
          verified: sql<string>`COUNT(${employee_skills.id}) FILTER (WHERE confirmed_at IS NOT NULL)`,
        }).from(employee_skills),
        db.select({
          category: sql<string>`skill_category`,
          cnt: sql<string>`COUNT(*)`,
        }).from(employee_skills)
          .groupBy(sql`skill_category`)
          .orderBy(sql`COUNT(*) DESC`),
      ]);
      const r = row as Row | undefined;
      type SR = { category: string; cnt: string };
      return { totalSkills: ip(r, 'total'), totalUserSkills: ip(r, 'user_skills'), verifiedSkills: ip(r, 'verified'), byCategory: ((catRows ?? []) as SR[]).map(r2 => ({ category: r2.category ?? 'other', count: parseInt(r2.cnt, 10) || 0 })) };
    }, 'DB_ERROR');
  }

  async findEmployeeStats(): Promise<Result<{ newEmployees: number; departedEmployees: number; activeEmployees: number; nonParticipatingEmployees: number; studyingEmployees: number }>> {

    return safeCall(async () => {
      const [row] = await db.select({
        new_emp: sql<string>`COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))`,
        departed: sql<string>`COUNT(*) FILTER (WHERE is_active=false AND updated_at >= DATE_TRUNC('month', CURRENT_DATE))`,
        active: sql<string>`COUNT(*) FILTER (WHERE is_active=true)`,
        non_participating: sql<string>`(SELECT COUNT(DISTINCT u.id) FROM users u LEFT JOIN lms_enrollments e ON e.user_id = u.id WHERE e.id IS NULL)`,
        studying: sql<string>`(SELECT COUNT(DISTINCT user_id) FROM lms_enrollments WHERE status='in_progress')`,
      }).from(hrEmployees);
      const r = row as Row | undefined;
      return { newEmployees: ip(r, 'new_emp'), departedEmployees: ip(r, 'departed'), activeEmployees: ip(r, 'active'), nonParticipatingEmployees: ip(r, 'non_participating'), studyingEmployees: ip(r, 'studying') };
    }, 'DB_ERROR');
  }

  async findScoreDistribution(): Promise<Result<{ ranges: { range: string; count: number }[] }>> {

    return safeCall(async () => {
      const [row] = await db.select({
        r0_20: sql<string>`COUNT(*) FILTER (WHERE score < 20)`,
        r20_40: sql<string>`COUNT(*) FILTER (WHERE score BETWEEN 20 AND 39)`,
        r40_60: sql<string>`COUNT(*) FILTER (WHERE score BETWEEN 40 AND 59)`,
        r60_80: sql<string>`COUNT(*) FILTER (WHERE score BETWEEN 60 AND 79)`,
        r80_100: sql<string>`COUNT(*) FILTER (WHERE score >= 80)`,
      }).from(lmsTestAttempts);
      const r = row as Row | undefined;
      return { ranges: [{ range: '0-20', count: ip(r, 'r0_20') }, { range: '20-40', count: ip(r, 'r20_40') }, { range: '40-60', count: ip(r, 'r40_60') }, { range: '60-80', count: ip(r, 'r60_80') }, { range: '80-100', count: ip(r, 'r80_100') }] };
    }, 'DB_ERROR');
  }

  async findAiGeneralAnalysis(): Promise<Result<{ analysis: string; generatedAt: string; stats: Record<string, unknown> }>> {

    return safeCall(async () => {
      const [[uRow], [cRow], [taRow]] = await Promise.all([
        db.select({ total: sql<string>`COUNT(*)` }).from(appUsers),
        db.select({
          total: sql<string>`COUNT(*)`,
          active: sql<string>`COUNT(*) FILTER (WHERE is_active=true)`,
        }).from(lmsCourses),
        db.select({
          total: sql<string>`COUNT(*)`,
          passed: sql<string>`COUNT(*) FILTER (WHERE passed=true)`,
          avg: sql<string>`AVG(score)::numeric`,
        }).from(lmsTestAttempts).where(sql`created_at >= NOW() - INTERVAL '7 days'`),
      ]);
      const u = uRow as Row; const c = cRow as Row; const ta = taRow as Row;
      const total = parseInt(String(ta.total ?? '0'), 10) || 0;
      const passed = parseInt(String(ta.passed ?? '0'), 10) || 0;
      const avgScore = safeNum(ta.avg ?? '0') || 0;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      const stats = { users: parseInt(String(u.total ?? '0'), 10), totalCourses: parseInt(String(c.total ?? '0'), 10), activeCourses: parseInt(String(c.active ?? '0'), 10), weeklyAttempts: total, weeklyPassRate: passRate, avgScore: Math.round(avgScore) };
      const analysis = `Tizim barqaror ishlayapti. So'nggi 7 kunda ${stats.weeklyAttempts} ta test urinishi, o'tish darajasi ${stats.weeklyPassRate}%, o'rtacha ball ${stats.avgScore}. Jami ${stats.users} foydalanuvchi, ${stats.activeCourses} ta faol kurs.`;
      return { analysis, generatedAt: _time.now().toISOString(), stats };
    }, 'DB_ERROR');
  }

  async findSkillsMatrix(): Promise<Result<{ subject: string; A: number; B: number }[]>> {

    return safeCall(async () => {
      const rows = await db.select({
        subject: hrDepartments.name,
        A: sql<string>`COUNT(DISTINCT ${employee_skills.id})`,
        B: sql<string>`COUNT(DISTINCT ${employee_skills.id}) FILTER (WHERE confirmed_at IS NOT NULL)`,
      }).from(hrDepartments)
        .leftJoin(hrEmployees, sql`${hrEmployees.department_id} = ${hrDepartments.id}`)
        .leftJoin(employee_skills, sql`${employee_skills.employeeId} = ${hrEmployees.id}`)
        .groupBy(hrDepartments.name)
        .orderBy(sql`COUNT(DISTINCT ${employee_skills.id}) DESC`)
        .limit(10);
      type MR = { subject: string; A: string; B: string };
      return ((rows ?? []) as MR[]).map(row => ({ subject: row.subject ?? '', A: parseInt(row.A, 10) || 0, B: parseInt(row.B, 10) || 0 }));
    }, 'DB_ERROR');
  }
}
