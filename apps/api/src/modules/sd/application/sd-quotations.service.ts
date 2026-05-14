/**
 * @module sd-quotations.service
 * @description Sales-Distribution quotation + contract + price-formula service.
 *   The notable piece of business logic here is `calculatePrice` — a single
 *   place where bulk-discount tiers turn a base price into a customer-facing
 *   unit price. Everything else delegates to the repository.
 * @layer Application Service (SD)
 *
 * WHY DISCOUNT TIERS LIVE IN business.constants
 *   `BULK_DISCOUNT_SMALL` / `BULK_DISCOUNT_LARGE` define the qty threshold
 *   and discount rate. Two reasons they're constants, not config rows:
 *     1. Sales engineers needed *predictable* tiering — quotes are validated
 *        against these constants in QA tests; flipping them mid-run would
 *        invalidate open quotations.
 *     2. Tier names appear in the print-out (Contract template uses
 *        "5%+5% bulk discount applied") and changing tiers would invalidate
 *        countersigned PDFs.
 *   If you ever need per-customer pricing, build a `PriceFormula` row and
 *   route through `formulaId` — that's the configurable path.
 *
 * WHY THE STRICT ORDER `> BULK_DISCOUNT_LARGE > BULK_DISCOUNT_SMALL`
 *   The check uses `>` not `>=`, and `LARGE` is tested first. This means an
 *   order *equal* to the small threshold gets 0% — the tier is "more than X
 *   units". If business rules ever switch to inclusive thresholds, change
 *   the comparator here and update the contract template's wording in
 *   `print/templates/contract.tsx`.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { QUOTATION_BASE_NUMBER } from '@common/constants/app.constants';
import { safeCall, Result, AppError } from '@common/result';
import { BULK_DISCOUNT_LARGE, BULK_DISCOUNT_SMALL } from '@common/constants/business.constants';
import { SdQuotationsRepository } from './sd-quotations.repository';

@Injectable()
export class SdQuotationsService {
  constructor(private readonly repo: SdQuotationsRepository) {}

  async listQuotations(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listQuotations(customerId, status, lim, off);
  }

  async createQuotation(body: Record<string, unknown>) {
    return this.repo.createQuotation(body);
  }

  async listContracts(customerId: number | null, status: string | null, lim: number, off: number) {
    return this.repo.listContracts(customerId, status, lim, off);
  }

  async createContract(body: Record<string, unknown>) {
    return this.repo.createContract(body);
  }

  async listPriceFormulas(lim: number, off: number) {
    return this.repo.listPriceFormulas(lim, off);
  }

  /**
   * @description Compute a quoted unit price + total for a given product/qty.
   *   Currently uses a hardcoded `QUOTATION_BASE_NUMBER` because real per-SKU
   *   pricing lives in `price_formulas` — when `formulaId` is provided callers
   *   should hit a separate formula evaluation path. The discount band is
   *   applied uniformly:
   *     qty > LARGE.minQty → LARGE.rate
   *     qty > SMALL.minQty → SMALL.rate
   *     else                → 0%
   * @param productId - logging context; product price is NOT looked up here
   * @param quantity  - units ordered; drives discount band
   * @param formulaId - reserved for future per-formula pricing
   * @returns Ok({ unit_price, total_price, discount_percent, ... })
   */
  async calculatePrice(productId: number, quantity: number, formulaId: number | null) {
    return safeCall(async () => {
      const base = QUOTATION_BASE_NUMBER;
      // WHY ternary chain instead of an if/else block:
      //   Reviewer rule 6 forbids controller-level branching; keeping this as
      //   a single ternary keeps the function deterministic and small. The
      //   strict-greater-than comparator means edge-case quantities (exactly
      //   at a tier threshold) stay in the lower band — see module-level NOTE.
      const discount = quantity > BULK_DISCOUNT_LARGE.minQty ? BULK_DISCOUNT_LARGE.rate : quantity > BULK_DISCOUNT_SMALL.minQty ? BULK_DISCOUNT_SMALL.rate : 0;
      const unitPrice = base * (1 - discount);
      return {
        product_id: productId,
        quantity,
        formula_id: formulaId,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
        discount_percent: discount * 100,
        currency: 'UZS',
        calculated_at: _time.now(),
      };
    });
  }

  async getKpiTeam(period: string | null) {
    return safeCall(async () => {
      const r = await this.repo.getKpiTeam();
      if (!r.ok) throw new Error(r.error.message);
      return { team_kpi: r.data, period: period ?? 'monthly' };
    });
  }

  async getKpiTargets(managerId: number | null) {
    return this.repo.getKpiTargets(managerId);
  }

  async getFunnelReport(period: string | null) {
    return safeCall(async () => {
      const r = await this.repo.getFunnelReport();
      if (!r.ok) throw new Error(r.error.message);
      const data = r.data;
      return {
        ...data,
        conversion_rate: data['total_leads'] ? Number(data['won_deals'] ?? 0) / Number(data['total_leads'] ?? 1) * 100 : 0,
        period: period ?? 'monthly',
      };
    });
  }

  async convertToOrder(id: string): Promise<Result<{ order: { id: unknown; documentNumber: string } }, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.convertQuotationToOrder(id);
      if (!result.ok) throw new Error(result.error.message);
      if ('error' in result.data) throw new Error(result.data.error);
      const orderRow = (result.data as { order: Record<string, unknown> }).order;
      return {
        order: {
          id: orderRow['id'],
          documentNumber: String(orderRow['order_number'] ?? `QO-${id}`),
          status: orderRow['status'],
          totalAmount: orderRow['total_amount'],
          createdAt: orderRow['created_at'],
        },
      };
    });
  }
}
