import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { SapRepository } from './sap.repository';

@Injectable()
export class SapService {
  constructor(private readonly repo: SapRepository) {}

  async listSalesOrders(status: string | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listSalesOrders(status, lim, off);
  }

  async getSalesOrder(id: number) {
    return this.repo.getSalesOrder(id);
  }

  async updateSalesOrder(id: number, body: Record<string, unknown>) {
    return this.repo.updateSalesOrder(id, body);
  }
}
