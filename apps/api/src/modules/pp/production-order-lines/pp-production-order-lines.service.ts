/**
 * @module pp-production-order-lines.service
 * @description Business-logic service for production_order_lines (multi-line order, EP-PP-118 /
 *   vision 07-pp#124). Guards that the parent order exists before adding a line and translates
 *   a missing line into NOT_FOUND. Returns Result<T> from @common/result; never throws raw.
 */

import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  IPpProductionOrderLinesRepo,
  PP_PRODUCTION_ORDER_LINES_REPO,
  ProductionOrderLineRow,
  CreateOrderLineInput,
  UpdateOrderLineInput,
} from './i-pp-production-order-lines.repo';

@Injectable()
export class PpProductionOrderLinesService {
  constructor(
    @Inject(PP_PRODUCTION_ORDER_LINES_REPO)
    private readonly repo: IPpProductionOrderLinesRepo,
  ) {}

  async list(productionOrderId: number): Promise<Result<{ items: ProductionOrderLineRow[]; total: number }>> {
    const r = await this.repo.findByOrder(productionOrderId);
    if (!r.ok) return Err(r.error);
    return Ok({ items: r.data, total: r.data.length });
  }

  async create(productionOrderId: number, dto: CreateOrderLineInput): Promise<Result<ProductionOrderLineRow>> {
    const exists = await this.repo.orderExists(productionOrderId);
    if (!exists.ok) return Err(exists.error);
    if (!exists.data) return Err(AppErr('NOT_FOUND', `Buyurtma #${productionOrderId} topilmadi`));
    return this.repo.create(productionOrderId, dto);
  }

  async update(id: number, patch: UpdateOrderLineInput): Promise<Result<ProductionOrderLineRow>> {
    const r = await this.repo.update(id, patch);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Qator #${id} topilmadi`));
    return Ok(r.data);
  }

  async remove(id: number): Promise<Result<{ deleted: boolean }>> {
    const r = await this.repo.remove(id);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Qator #${id} topilmadi`));
    return Ok({ deleted: true });
  }
}
