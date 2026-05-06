import { Injectable, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { ISalesOrdersFiRepository, SALES_ORDERS_FI_REPO } from './i-sales-orders-fi.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class SalesOrdersFiService {
  private readonly logger = new Logger(SalesOrdersFiService.name);

  constructor(@Inject(SALES_ORDERS_FI_REPO) private readonly repo: ISalesOrdersFiRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 20);
      const result = await this.repo.findAll(limit, (page - 1) * limit);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return {
        data: result.data.data,
        pagination: { total: result.data.count, page, limit },
      };
    });
  }

  async getSummary(filters: { from?: string; to?: string; status?: string } = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findAll(1000, 0);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      const rows = result.data.data;
      const filtered = rows.filter((r) => {
        if (filters.status && r['status'] !== filters.status) return false;
        if (filters.from && String(r['created_at'] ?? '') < filters.from) return false;
        if (filters.to && String(r['created_at'] ?? '') > filters.to) return false;
        return true;
      });
      const totalAmount = filtered.reduce((sum, r) => sum + Number(r['total_amount'] ?? 0), 0);
      const byStatus: Record<string, number> = {};
      for (const r of filtered) {
        const s = String(r['status'] ?? 'unknown');
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }
      return { totalOrders: filtered.length, totalAmount, byStatus };
    });
  }
}
