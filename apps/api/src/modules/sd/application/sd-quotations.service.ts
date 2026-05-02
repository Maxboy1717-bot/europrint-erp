import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { QUOTATION_BASE_NUMBER } from '@common/constants/app.constants';
import { safeCall, Result, AppError } from '@common/result';
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

  async calculatePrice(productId: number, quantity: number, formulaId: number | null) {
    return safeCall(async () => {
      const base = QUOTATION_BASE_NUMBER;
      const discount = quantity > 100 ? 0.1 : quantity > 50 ? 0.05 : 0;
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
