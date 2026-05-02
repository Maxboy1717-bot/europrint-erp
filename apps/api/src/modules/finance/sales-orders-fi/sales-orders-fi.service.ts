import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { ISalesOrdersFiRepository, SALES_ORDERS_FI_REPO } from './i-sales-orders-fi.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class SalesOrdersFiService {
  constructor(@Inject(SALES_ORDERS_FI_REPO) private readonly repo: ISalesOrdersFiRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findAll(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}
}
