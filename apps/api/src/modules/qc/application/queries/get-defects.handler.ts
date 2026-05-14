/**
 * @module get-defects.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { GetDefectsQuery } from './get-defects.query';

type DefectsResponse = { ok: boolean; data: { data: Record<string, unknown>[]; pagination: { page: number; limit: number; total: number; totalPages: number } } };
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@QueryHandler(GetDefectsQuery)
export class GetDefectsHandler implements IQueryHandler<GetDefectsQuery, DefectsResponse> {
  private readonly logger = new Logger(GetDefectsHandler.name);

  async execute(query: GetDefectsQuery): Promise<DefectsResponse> {
    const page = query.page || 1; const limit = query.limit || 20; const offset = (page - 1) * limit;
    const [countRows, items] = await Promise.all([
      exec(sql`SELECT COUNT(*)::int AS count FROM quality_defects_camera`),
      exec(sql`SELECT id, camera_id, work_center_id, product_name, defect_type, severity, description, image_url, ai_confidence, is_resolved, resolved_at, created_at FROM quality_defects_camera ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    this.logger.log({ page, limit, total }, 'Defects retrieved');
    return { ok: true, data: { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } };
  }
}
