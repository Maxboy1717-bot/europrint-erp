/**
 * @module customer-rhythm.service
 * @description Customer purchase-rhythm (vision 14-marketing #11): average days between
 *   orders, only exposed after the first N orders (N configurable via marketing_settings,
 *   default 3). Returns Result<T> from @common/result; never throws.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleCustomerRhythmRepository } from '../infrastructure/repositories/drizzle-customer-rhythm.repo';

/** Public rhythm payload for one customer. */
export interface CustomerRhythm {
  customerId: number;
  /** Configured N (min orders before rhythm is computed). */
  minOrders: number;
  orderCount: number;
  /** True once orderCount >= minOrders and an interval could be computed. */
  rhythmAvailable: boolean;
  /** How many more orders are needed before rhythm becomes available (0 when available). */
  ordersUntilRhythm: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  /** Mean days between consecutive orders; null until rhythmAvailable. */
  avgIntervalDays: number | null;
  daysSinceLastOrder: number | null;
}

@Injectable()
export class CustomerRhythmService {
  private readonly logger = new Logger(CustomerRhythmService.name);

  constructor(private readonly repo: DrizzleCustomerRhythmRepository) {}

  /**
   * Compute a customer's purchase rhythm. Rhythm is only reported once the customer
   * has at least N orders (vision: "birinchi 3 buyurtmadan keyin hisoblanadi").
   */
  async getCustomerRhythm(customerId: number): Promise<Result<CustomerRhythm>> {
    const minResult = await this.repo.getRhythmMinOrders();
    if (!minResult.ok) return Err(minResult.error);
    const minOrders = minResult.data;

    const rhythmResult = await this.repo.getCustomerOrderRhythm(customerId);
    if (!rhythmResult.ok) return Err(rhythmResult.error);
    const raw = rhythmResult.data;

    const rhythmAvailable = raw.orderCount >= minOrders && raw.avgIntervalDays !== null;
    return Ok({
      customerId,
      minOrders,
      orderCount: raw.orderCount,
      rhythmAvailable,
      ordersUntilRhythm: rhythmAvailable ? 0 : Math.max(0, minOrders - raw.orderCount),
      firstOrderDate: raw.firstOrderDate,
      lastOrderDate: raw.lastOrderDate,
      avgIntervalDays: rhythmAvailable ? raw.avgIntervalDays : null,
      daysSinceLastOrder: raw.daysSinceLastOrder,
    });
  }
}
