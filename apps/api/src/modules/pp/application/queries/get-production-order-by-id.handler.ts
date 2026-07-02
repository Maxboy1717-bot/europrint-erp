/**
 * @module get-production-order-by-id.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db, production_orders_int } from '@shared/db';
import { eq } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/types/result.type';
import { GetProductionOrderByIdQuery } from './get-production-order-by-id.query';

@Injectable()
@QueryHandler(GetProductionOrderByIdQuery)
export class GetProductionOrderByIdHandler
  implements IQueryHandler<GetProductionOrderByIdQuery>
{
  private readonly logger = new Logger(GetProductionOrderByIdHandler.name);

  async execute(query: GetProductionOrderByIdQuery): Promise<Result<Record<string, unknown>>> {
    try {
      // production_orders.id is INTEGER in the live DB (not UUID) — compare directly
      // against the numeric query.id instead of coercing to a string.
      const rows = await db
        .select()
        .from(production_orders_int)
        .where(eq(production_orders_int.id, query.id))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return Err({ code: 'NOT_FOUND', message: `Ishlab chiqarish buyurtmasi topilmadi: ${query.id}` });
      }

      this.logger.debug(`Production order fetched: id=${query.id}`);
      return Ok(row as Record<string, unknown>);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error fetching production order ${query.id}: ${msg}`);
      return Err({ code: 'DB_ERROR', message: msg });
    }
  }
}
