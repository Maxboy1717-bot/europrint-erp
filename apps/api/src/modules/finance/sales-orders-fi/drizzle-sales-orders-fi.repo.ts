import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { salesOrders } from '@europrint/schemas';
import { count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ISalesOrdersFiRepository } from './i-sales-orders-fi.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleSalesOrdersFiRepository implements ISalesOrdersFiRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(salesOrders),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Sotuv buyurtmalar topilmadi'); }
  }
}
