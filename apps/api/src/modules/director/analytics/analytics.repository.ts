/**
 * @module analytics.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const np = (v: unknown) => safeNum(v ?? '0') || 0;
const ni = (v: unknown) => parseInt(String(v ?? '0'), 10) || 0;

export interface StatsRow { totalUsers: number; totalCourses: number; activeCourses: number; totalTests: number; passedTests: number; passRate: number; averageScore: number; avgTestScore: number; completionRate: number; averageTestTime: number; completedCourses: number }
export interface CourseProgressRow { courseId: string; courseTitle: string; enrolled: number; completed: number; completionRate: number }
export interface UserActivityRow { date: string; activeUsers: number }
export interface TestResultRow { testId: string; testTitle: string; totalAttempts: number; passRate: number; averageScore: number }
export interface LearningOutcomesRow { averageScore: number; completionRate: number; passRate: number }
export interface FunnelRow { enrolled: number; started: number; completed: number; passed: number }
export interface DeptRow { departmentId: string; departmentName: string; userCount: number; completionRate: number; averageScore: number }
export interface PosRow { positionId: string; positionName: string; userCount: number; completionRate: number; averageScore: number }
export interface LeaderEmpRow { userId: string; fullName: string; positionName: string; departmentName: string; overallScore: number; completedCourses: number; passedTests: number; averageScore: number; totalBonus: number }
export interface LeaderDeptRow { departmentId: string; departmentName: string; userCount: number; completedAssignments: number; totalAssignments: number; completionRate: number; averageScore: number }
export interface LeaderCourseRow { courseId: string; title: string; enrolled: number; completed: number; certificatesIssued: number; completionRate: number; passRate: number; averageScore: number; effectivenessScore: number }

@Injectable()
export class AnalyticsRepository {
  async findStats(): Promise<Result<StatsRow>> {

    return safeCall(async () => {
      const [uRows, cRows, tRows, scRows] = await Promise.all([
        runQuery<Row>(sql`SELECT COUNT(*) AS cnt FROM users`),
        runQuery<Row>(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active=true) AS active FROM lms_courses`),
        runQuery<Row>(sql`SELECT COUNT(*) AS total FROM lms_tests`),
        runQuery<Row>(sql`SELECT AVG(score)::numeric AS avg_score, COUNT(*) FILTER (WHERE passed=true) AS passed, COUNT(*) AS total FROM lms_test_attempts`),
      ]);
      const u = uRows.rows[0] ?? {}; const c = cRows.rows[0] ?? {};
      const t = tRows.rows[0] ?? {}; const sc = scRows.rows[0] ?? {};
      const totalAttempts = ni(sc.total); const passedAttempts = ni(sc.passed);
      return { totalUsers: ni(u.cnt), totalCourses: ni(c.total), activeCourses: ni(c.active), totalTests: ni(t.total), passedTests: passedAttempts, passRate: totalAttempts>0?Math.round((passedAttempts/totalAttempts)*100):0, averageScore: np(sc.avg_score), avgTestScore: np(sc.avg_score), completionRate: 0, averageTestTime: 0, completedCourses: 0 };
    }, 'DB_ERROR');
  }

  async findCourseProgress(): Promise<Result<CourseProgressRow[]>> {

    return safeCall(async () => {
      type CR = { id: string; title: string; enrolled: number; completed: number };
      const rows = (await runQuery<CR>(sql`SELECT c.id, c.title, COUNT(e.id) AS enrolled, COUNT(e.id) FILTER (WHERE e.status='completed') AS completed FROM lms_courses c LEFT JOIN lms_enrollments e ON e.course_id = c.id GROUP BY c.id, c.title ORDER BY enrolled DESC LIMIT 20`)).rows as CR[];
      return (Array.isArray(rows) ? rows : []).map(row => { const en=ni(row.enrolled); const co=ni(row.completed); return { courseId: row.id, courseTitle: row.title??'', enrolled: en, completed: co, completionRate: en>0?Math.round((co/en)*100):0 }; });
    }, 'DB_ERROR');
  }

  async findUserActivity(): Promise<Result<UserActivityRow[]>> {

    return safeCall(async () => {
      type AR = { date: string; active_users: number };
      const rows = (await runQuery<AR>(sql`SELECT DATE(created_at)::text AS date, COUNT(DISTINCT user_id) AS active_users FROM lms_test_attempts WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC`)).rows as AR[];
      return (Array.isArray(rows) ? rows : []).map(row => ({ date: row.date, activeUsers: ni(row.active_users) }));
    }, 'DB_ERROR');
  }

  async findTestResults(): Promise<Result<TestResultRow[]>> {

    return safeCall(async () => {
      type TR = { id: string; title: string; total: number; avg_score: string; passed: number };
      const rows = (await runQuery<TR>(sql`SELECT t.id, t.title, COUNT(a.id) AS total, AVG(a.score)::numeric AS avg_score, COUNT(a.id) FILTER (WHERE a.passed=true) AS passed FROM lms_tests t LEFT JOIN lms_test_attempts a ON a.test_id = t.id GROUP BY t.id, t.title ORDER BY total DESC LIMIT 20`)).rows as TR[];
      return (Array.isArray(rows) ? rows : []).map(row => { const tot=ni(row.total); const pas=ni(row.passed); return { testId: row.id, testTitle: row.title??'', totalAttempts: tot, passRate: tot>0?Math.round((pas/tot)*100):0, averageScore: np(row.avg_score) }; });
    }, 'DB_ERROR');
  }

  async findLearningOutcomes(): Promise<Result<LearningOutcomesRow>> {

    return safeCall(async () => {
      type LOR = { avg: string; pass_rate: string; completion_rate: string };
      const rows = (await runQuery<LOR>(sql`SELECT AVG(score)::numeric AS avg, COUNT(*) FILTER (WHERE passed=true)::float / NULLIF(COUNT(*),0)*100 AS pass_rate, (SELECT COUNT(*) FILTER (WHERE status='completed')::float / NULLIF(COUNT(*),0)*100 FROM lms_enrollments) AS completion_rate FROM lms_test_attempts`)).rows as LOR[];
      const row = rows[0] ?? {} as LOR;
      return { averageScore: np(row.avg), completionRate: np(row.completion_rate), passRate: np(row.pass_rate) };
    }, 'DB_ERROR');
  }

  async findFunnel(): Promise<Result<FunnelRow>> {

    return safeCall(async () => {
      type FR = { enrolled: number; started: number; completed: number; passed: number };
      const rows = (await runQuery<FR>(sql`SELECT COUNT(*) AS enrolled, COUNT(*) FILTER (WHERE status != 'enrolled') AS started, COUNT(*) FILTER (WHERE status='completed') AS completed, (SELECT COUNT(*) FILTER (WHERE passed=true) FROM lms_test_attempts) AS passed FROM lms_enrollments`)).rows as FR[];
      const row = rows[0] ?? {} as FR;
      return { enrolled: ni(row.enrolled), started: ni(row.started), completed: ni(row.completed), passed: ni(row.passed) };
    }, 'DB_ERROR');
  }

  async findByDepartment(): Promise<Result<DeptRow[]>> {

    return safeCall(async () => {
      type DR = { id: string; name: string; user_count: number; avg_score: string; completion_rate: string };
      const rows = (await runQuery<DR>(sql`SELECT d.id, d.name, COUNT(DISTINCT u.id) AS user_count, AVG(ta.score)::numeric AS avg_score, COUNT(DISTINCT e.id) FILTER (WHERE e.status='completed')::float / NULLIF(COUNT(DISTINCT e.id),0)*100 AS completion_rate FROM departments d JOIN employees emp ON emp.department_id = d.id JOIN users u ON u.id = emp.user_id LEFT JOIN lms_enrollments e ON e.user_id = u.id LEFT JOIN lms_test_attempts ta ON ta.user_id = u.id GROUP BY d.id, d.name ORDER BY user_count DESC`)).rows as DR[];
      return (Array.isArray(rows) ? rows : []).map(row => ({ departmentId: row.id, departmentName: row.name??'', userCount: ni(row.user_count), completionRate: np(row.completion_rate), averageScore: np(row.avg_score) }));
    }, 'DB_ERROR');
  }

  async findByPosition(): Promise<Result<PosRow[]>> {

    return safeCall(async () => {
      type PR = { id: string; title: string; user_count: number; avg_score: string };
      const rows = (await runQuery<PR>(sql`SELECT p.id, p.title, COUNT(DISTINCT u.id) AS user_count, AVG(ta.score)::numeric AS avg_score FROM positions p JOIN employees emp ON emp.position_id = p.id JOIN users u ON u.id = emp.user_id LEFT JOIN lms_test_attempts ta ON ta.user_id = u.id GROUP BY p.id, p.title ORDER BY user_count DESC LIMIT 15`)).rows as PR[];
      return (Array.isArray(rows) ? rows : []).map(row => ({ positionId: row.id, positionName: row.title??'', userCount: ni(row.user_count), completionRate: 0, averageScore: np(row.avg_score) }));
    }, 'DB_ERROR');
  }

  async findLeaderboardEmployees(): Promise<Result<LeaderEmpRow[]>> {
    // Join path: users.id → employees.user_id → lms_enrollments.employee_id
    // lms_enrollments.user_id (uuid) is always NULL; use employee_id (integer) instead.
    // lms_test_attempts.user_id is text, no integer FK — excluded from join to avoid type mismatch.
    return safeCall(async () => {
      type LR = { id: string; full_name: string; position_name: string; dept_name: string; avg_score: string; completed_courses: number; passed_tests: number };
      const rows = (await runQuery<LR>(sql`SELECT u.id, (u.first_name || ' ' || u.last_name) AS full_name, p.title AS position_name, d.name AS dept_name, AVG(e.score)::numeric AS avg_score, COUNT(DISTINCT e.id) FILTER (WHERE e.status='completed') AS completed_courses, 0 AS passed_tests FROM users u LEFT JOIN employees emp ON emp.user_id = u.id LEFT JOIN positions p ON p.id = emp.position_id LEFT JOIN departments d ON d.id = emp.department_id LEFT JOIN lms_enrollments e ON e.employee_id = emp.id GROUP BY u.id, u.first_name, u.last_name, p.title, d.name ORDER BY avg_score DESC NULLS LAST LIMIT 20`)).rows as LR[];
      return (Array.isArray(rows) ? rows : []).map(row => ({ userId: row.id, fullName: row.full_name??'', positionName: row.position_name??'', departmentName: row.dept_name??'', overallScore: np(row.avg_score), completedCourses: ni(row.completed_courses), passedTests: ni(row.passed_tests), averageScore: np(row.avg_score), totalBonus: 0 }));
    }, 'DB_ERROR');
  }

  async findLeaderboardDepartments(): Promise<Result<LeaderDeptRow[]>> {

    return safeCall(async () => {
      type DR2 = { id: string; name: string; total: number; completed: number; user_count: number; avg_score: string };
      const rows = (await runQuery<DR2>(sql`SELECT d.id, d.name, COUNT(DISTINCT e.id) AS total, COUNT(DISTINCT e.id) FILTER (WHERE e.status='completed') AS completed, COUNT(DISTINCT emp.id) AS user_count, AVG(ta.score)::numeric AS avg_score FROM departments d LEFT JOIN employees emp ON emp.department_id = d.id LEFT JOIN lms_enrollments e ON e.user_id = emp.user_id LEFT JOIN lms_test_attempts ta ON ta.user_id = emp.user_id GROUP BY d.id, d.name ORDER BY avg_score DESC NULLS LAST`)).rows as DR2[];
      return (Array.isArray(rows) ? rows : []).map(row => { const tot=ni(row.total); const comp=ni(row.completed); return { departmentId: row.id, departmentName: row.name??'', userCount: ni(row.user_count), completedAssignments: comp, totalAssignments: tot, completionRate: tot>0?Math.round((comp/tot)*100):0, averageScore: np(row.avg_score) }; });
    }, 'DB_ERROR');
  }

  async findLeaderboardCourses(): Promise<Result<LeaderCourseRow[]>> {

    return safeCall(async () => {
      type CourseR = { id: string; title: string; enrolled: number; completed: number; certs: number; avg_score: string; pass_rate: string };
      const rows = (await runQuery<CourseR>(sql`SELECT c.id, c.title, COUNT(DISTINCT e.id) AS enrolled, COUNT(DISTINCT e.id) FILTER (WHERE e.status='completed') AS completed, COUNT(DISTINCT cert.id) AS certs, AVG(ta.score)::numeric AS avg_score, COUNT(ta.id) FILTER (WHERE ta.passed=true)::float / NULLIF(COUNT(ta.id),0)*100 AS pass_rate FROM lms_courses c LEFT JOIN lms_enrollments e ON e.course_id = c.id LEFT JOIN lms_certificates cert ON cert.course_id = c.id LEFT JOIN lms_test_attempts ta ON ta.course_id = c.id GROUP BY c.id, c.title ORDER BY enrolled DESC LIMIT 10`)).rows as CourseR[];
      return (Array.isArray(rows) ? rows : []).map(row => { const en=ni(row.enrolled); const co=ni(row.completed); return { courseId: row.id, title: row.title??'', enrolled: en, completed: co, certificatesIssued: ni(row.certs), completionRate: en>0?Math.round((co/en)*100):0, passRate: np(row.pass_rate), averageScore: np(row.avg_score), effectivenessScore: np(row.avg_score) }; });
    }, 'DB_ERROR');
  }
}
