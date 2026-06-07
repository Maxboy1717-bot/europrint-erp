/**
 * @module get-budget-by-id.handler
 * @description CQRS query handler: fetch a single budgets row by id.
 *   Returns Err when not found — controller uses assertOkOrThrow → NotFoundException.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err } from '@common/result';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { GetBudgetByIdQuery } from './get-budget-by-id.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

@Injectable()
@QueryHandler(GetBudgetByIdQuery)
export class GetBudgetByIdHandler implements IQueryHandler<GetBudgetByIdQuery> {
  private readonly logger = new Logger(GetBudgetByIdHandler.name);

  async execute(query: GetBudgetByIdQuery) {
    try {
      const rows = await exec(sql`SELECT * FROM budgets WHERE id::text = ${query.id} LIMIT 1`);
      if (!rows[0]) return Err(`Budget ${query.id} topilmadi`);
      this.logger.log(`Budget id=${query.id} found`);
      return Ok(rows[0]);
    } catch (e) {
      return Err(String(e));
    }
  }
}
