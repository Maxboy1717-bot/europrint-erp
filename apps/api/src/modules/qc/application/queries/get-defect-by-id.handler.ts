/**
 * @module get-defect-by-id.handler
 * @description CQRS query handler: fetch single row from qc_defects by id.
 *   Returns Ok(null) when not found — controller uses unwrapOrNotFoundDefined
 *   to surface a 404 in that case.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { GetDefectByIdQuery } from './get-defect-by-id.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

@Injectable()
@QueryHandler(GetDefectByIdQuery)
export class GetDefectByIdHandler implements IQueryHandler<GetDefectByIdQuery> {
  private readonly logger = new Logger(GetDefectByIdHandler.name);

  async execute(query: GetDefectByIdQuery): Promise<{ ok: true; data: Row | null }> {
    const rows = await exec(sql`
      SELECT * FROM qc_defects WHERE id::text = ${query.id} LIMIT 1
    `);
    const row = rows[0] ?? null;
    this.logger.log(`Defect id=${query.id} ${row ? 'found' : 'not found'}`);
    return { ok: true, data: row };
  }
}
