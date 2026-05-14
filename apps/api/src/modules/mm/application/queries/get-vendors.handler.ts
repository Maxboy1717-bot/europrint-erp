/**
 * @module get-vendors.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { db, vendors } from '@shared/db';
import { eq, count } from 'drizzle-orm';
import { GetVendorsQuery } from './get-vendors.query';

@Injectable()
@QueryHandler(GetVendorsQuery)
export class GetVendorsHandler implements IQueryHandler<GetVendorsQuery> {
  private readonly logger = new Logger(GetVendorsHandler.name);

  

  async execute(query: GetVendorsQuery): Promise<Result<{ items: unknown[]; total: number }>> {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const whereClause = query.isActive !== undefined ? eq(vendors.is_active, query.isActive) : undefined;

      const items = await db
        .select({
          id: vendors.id,
          name: vendors.name,
          tin: vendors.tin,
          phone: vendors.phone,
          email: vendors.email,
          address: vendors.address,
          payment_terms: vendors.payment_terms,
          rating: vendors.rating,
          is_active: vendors.is_active,
          created_at: vendors.created_at,
        })
        .from(vendors)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(vendors)
        .where(whereClause);

      this.logger.log(
        { isActive: query.isActive, page, limit },
        'Vendors retrieved');

      return Ok({
        items,
        total: countResult[0]?.count || 0,
      });
  }
}
