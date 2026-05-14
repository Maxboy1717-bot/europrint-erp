/**
 * @module reports-hub.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { execAiReportCategoriesSeed, execAiReportSubscriptionDelete } from '@common/database/queries-sd';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class ReportsHubRepository {
  async getCategoryCount(): Promise<Result<{ category_count: number }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ category_count: number }>(sql`SELECT COUNT(*)::int AS category_count FROM ai_report_categories`);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getDefinitionStats(): Promise<Result<{ total_definitions: number; active_definitions: number }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ total_definitions: number; active_definitions: number }>(sql`
        SELECT COUNT(*)::int AS total_definitions, COUNT(*) FILTER (WHERE is_active = true)::int AS active_definitions FROM ai_report_definitions
      `);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getRunStats(): Promise<Result<{ total_runs: number; completed_runs: number; failed_runs: number; running_runs: number }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ total_runs: number; completed_runs: number; failed_runs: number; running_runs: number }>(sql`
        SELECT COUNT(*)::int AS total_runs,
               COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_runs,
               COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_runs,
               COUNT(*) FILTER (WHERE status = 'running')::int AS running_runs
        FROM ai_report_runs WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getRecentRuns(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT r.*, d.name AS report_name
        FROM ai_report_runs r
        LEFT JOIN ai_report_definitions d ON d.id = r.report_id
        ORDER BY r.created_at DESC LIMIT 5
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getCategories(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT id, code, name, name_ru, icon, color, report_count, created_at FROM ai_report_categories ORDER BY name`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getDefinitions(categoryId: number | null, schedule: string | null, isActive: boolean | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT * FROM ai_report_definitions
        WHERE (${categoryId}::int IS NULL OR category_id = ${categoryId})
          AND (${schedule}::text IS NULL OR schedule = ${schedule})
          AND (${isActive}::boolean IS NULL OR is_active = ${isActive})
        ORDER BY sort_order NULLS LAST, name
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createDefinition(body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO ai_report_definitions (category_id, code, name, name_ru, description, schedule, is_active, query_template, output_format, sort_order, created_at, updated_at)
        VALUES (${body['categoryId'] ?? null}, ${body['code'] ?? null}, ${body['name'] ?? null}, ${body['nameRu'] ?? null}, ${body['description'] ?? null}, ${body['schedule'] ?? 'manual'}, ${body['isActive'] ?? true}, ${body['queryTemplate'] ?? null}, ${body['outputFormat'] ?? 'table'}, ${body['sortOrder'] ?? 99}, NOW(), NOW())
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getRuns(reportId: number | null, status: string | null, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT r.*, d.name AS report_name
        FROM ai_report_runs r
        LEFT JOIN ai_report_definitions d ON d.id = r.report_id
        WHERE (${reportId}::int IS NULL OR r.report_id = ${reportId})
          AND (${status}::text IS NULL OR r.status = ${status})
        ORDER BY r.created_at DESC LIMIT ${limit}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getRun(runId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT r.*, d.name AS report_name FROM ai_report_runs r LEFT JOIN ai_report_definitions d ON d.id = r.report_id WHERE r.id = ${runId}
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async findDefinition(defId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM ai_report_definitions WHERE id = ${defId} LIMIT 1`);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async insertRun(defId: number, userId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO ai_report_runs (report_id, status, triggered_by, started_at, created_at)
        VALUES (${defId}, 'completed', ${userId}, NOW(), NOW()) RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async countCategories(): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await runQuery<{ cnt: number }>(sql`SELECT COUNT(*)::int AS cnt FROM ai_report_categories`);
      return Number(rows.rows[0]?.cnt ?? 0);
      }, 'DB_ERROR');
  }

  async seedCategoriesData(): Promise<void> {
    await execAiReportCategoriesSeed();
  }

  async getSubscriptions(userId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT s.*, d.name AS report_name
        FROM ai_report_subscriptions s LEFT JOIN ai_report_definitions d ON d.id = s.report_id
        WHERE s.user_id = ${userId} ORDER BY s.created_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createSubscription(body: Row, userId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO ai_report_subscriptions (report_id, user_id, channel, created_at)
        VALUES (${body['reportId'] ?? null}, ${userId}, ${body['channel'] ?? 'email'}, NOW())
        ON CONFLICT (report_id, user_id) DO UPDATE SET channel = EXCLUDED.channel
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteSubscription(id: number, userId: number): Promise<void> {
    await execAiReportSubscriptionDelete(id, userId);
  }
}
