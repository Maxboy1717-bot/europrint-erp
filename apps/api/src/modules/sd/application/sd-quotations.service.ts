/**
 * @module sd-quotations.service
 * @description Sales-Distribution quotation + contract + price-formula service. The core business logic
 *   is `calculatePrice` (EP-SD-037) — a real config-driven cost engine that reads the live
 *   `sd_price_formulas` row and builds paper/print/die/labour/delivery from the carton dims + colours +
 *   qty, then applies markup% + VAT%. Everything else delegates to the repository.
 * @layer Application Service (SD)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Inject, Logger } from '@nestjs/common';
import { safeCall, Result, AppError, Ok, Err, AppErr } from '@common/result';
import { GlPostingService } from '@modules/finance/domain/services/gl-posting.service';

/** EP-SD-037 price-engine input (carton dims + colours + qty). */
export type PriceCalcInput = {
  productType?: string;
  paperType?: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  thicknessMm?: number;
  printColors: number;
  quantity: number;
  isNewDie: boolean;
};
import { ISdQuotationsRepo, SD_QUOTATIONS_REPO } from '../domain/repositories/i-sd-quotations.repo';
import {
  IQuotationRepo,
  QUOTATION_REPO,
  QuotationUpdatePatch,
  KpiTargetPatch,
  PriceFormulaPatch,
} from '../domain/repositories/i-quotation.repo';

type Row = Record<string, unknown>;

@Injectable()
export class SdQuotationsService {
  private readonly logger = new Logger(SdQuotationsService.name);
  constructor(
    @Inject(SD_QUOTATIONS_REPO) private readonly repo: ISdQuotationsRepo,
    @Inject(QUOTATION_REPO) private readonly quotationRepo: IQuotationRepo,
    private readonly gl: GlPostingService,
  ) {}

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
   * EP-SD-037 — REAL config-driven price engine. Reads the live `sd_price_formulas` row and builds the
   * cost from the carton dimensions + colors + qty, then applies the configured markup + VAT. Every
   * component is returned for the FE breakdown (paperCost/printCost/dieCost/productionCost/deliveryCost).
   */
  async calculatePrice(input: PriceCalcInput) {
    return safeCall(async () => {
      const f = await this.quotationRepo.getPriceSettings();
      const cfg = (f.ok ? f.data : null) ?? {};
      const num = (v: unknown, d = 0): number => { const n = Number(v); return Number.isFinite(n) ? n : d; };
      const round2 = (x: number): number => Math.round(x * 100) / 100;

      const qty = Math.max(1, num(input.quantity, 1));
      const L = num(input.lengthMm), W = num(input.widthMm), H = num(input.heightMm);
      const colors = Math.max(0, num(input.printColors));

      // RSC carton blank area per unit (m²): blank = (2*(L+W)+glueFlap) × (H+W). Real geometry, not a constant.
      const GLUE_FLAP_MM = 40;
      const MM2_PER_M2 = 1_000_000;
      const areaPerUnitM2 = ((2 * (L + W) + GLUE_FLAP_MM) * (H + W)) / MM2_PER_M2;

      const paperRates: Record<string, number> = {
        'B-flute': num(cfg.paper_b_price), 'C-flute': num(cfg.paper_c_price),
        'BC-flute': num(cfg.paper_bc_price), 'E-flute': num(cfg.paper_e_price),
      };
      const paperRate = paperRates[input.paperType ?? 'B-flute'] ?? num(cfg.paper_b_price);
      const paperCost = areaPerUnitM2 * paperRate * qty;

      // Print = plates per colour (one-time klishe) + the per-job run rate for that colour count.
      const printRunRate = colors >= 4 ? num(cfg.print_4color_price)
        : colors >= 2 ? num(cfg.print_2color_price)
        : colors >= 1 ? num(cfg.print_1color_price) : 0;
      const printCost = colors > 0 ? num(cfg.plate_cost_per_color) * colors + printRunRate : 0;

      // Die/shtamp: new vs existing (EP-SD-042/125 klishe ownership).
      const dieCost = input.isNewDie ? num(cfg.die_cost_new) : num(cfg.die_cost_existing);

      // Labour throughput assumption: 1 labour-hour per UNITS_PER_LABOR_HOUR units.
      const UNITS_PER_LABOR_HOUR = 1000;
      const productionCost = num(cfg.hourly_labor_rate) * (qty / UNITS_PER_LABOR_HOUR);

      const deliveryCost = num(cfg.delivery_base_cost);

      const costPrice = paperCost + printCost + dieCost + productionCost + deliveryCost;
      const markupPercent = num(cfg.default_markup_percent, 35);
      const vatRate = num(cfg.vat_rate, 12);
      const priceBeforeVat = costPrice * (1 + markupPercent / 100);
      const totalPrice = priceBeforeVat * (1 + vatRate / 100);
      const unitPrice = qty > 0 ? totalPrice / qty : 0;

      return {
        paperCost: round2(paperCost), printCost: round2(printCost), dieCost: round2(dieCost),
        productionCost: round2(productionCost), deliveryCost: round2(deliveryCost),
        costPrice: round2(costPrice), unitPrice: round2(unitPrice), totalPrice: round2(totalPrice),
        margin: round2(totalPrice - costPrice), markupPercent, vatRate,
        areaPerUnitM2: round2(areaPerUnitM2), quantity: qty, currency: 'UZS', calculated_at: _time.now(),
      };
    });
  }

  async getKpiTeam(period: string | null): Promise<Result<{ team_kpi: Row[]; period: string }, AppError>> {
    // Parse "YYYY-MM" or fall back to the current calendar month so the FE period
    // selector is honoured end-to-end (previously year/month were dropped here).
    const now = new Date();
    let year  = now.getFullYear();
    let month = now.getMonth() + 1;
    if (period) {
      const parts = period.match(/^(\d{4})-(\d{2})$/);
      if (parts) {
        year  = parseInt(parts[1] ?? String(year),  10);
        month = parseInt(parts[2] ?? String(month), 10);
      }
    }
    const r = await this.repo.getKpiTeam(year, month);
    if (!r.ok) return Err(r.error);
    return Ok({ team_kpi: r.data, period: period ?? `${year}-${String(month).padStart(2, '0')}` });
  }

  async getKpiTargets(managerId: number | null) {
    return this.repo.getKpiTargets(managerId);
  }

  async getFunnelReport(period: string | null) {
    const r = await this.repo.getFunnelReport();
    if (!r.ok) return r;
    const data = r.data;
    return Ok({
      ...data,
      conversion_rate: data['total_leads'] ? Number(data['won_deals'] ?? 0) / Number(data['total_leads'] ?? 1) * 100 : 0,
      period: period ?? 'monthly',
    });
  }

  async convertToOrder(id: string): Promise<Result<{ order: { id: unknown; documentNumber: string } }, AppError>> {
    const result = await this.repo.convertQuotationToOrder(id);
    if (!result.ok) return result as Result<{ order: { id: unknown; documentNumber: string } }, AppError>;
    if ('error' in result.data) return Err(AppErr('INTERNAL', result.data.error));
    const orderRow = (result.data as { order: Record<string, unknown> }).order;
    return Ok({
      order: {
        id: orderRow['id'],
        documentNumber: String(orderRow['order_number'] ?? `QO-${id}`),
        status: orderRow['status'],
        totalAmount: orderRow['total_amount'],
        createdAt: orderRow['created_at'],
      },
    });
  }

  // ── Status-transition methods (formerly inline SQL in the controller) ────────

  async sendQuotation(id: string): Promise<Result<Row>> {
    const r = await this.quotationRepo.sendQuotation(id);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Quotation ${id} topilmadi`));
    return Ok({ id, sent: true, status: 'sent', updated_at: r.data['updated_at'] });
  }

  async approveQuotation(id: string): Promise<Result<Row>> {
    const r = await this.quotationRepo.approveQuotation(id);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Quotation ${id} topilmadi`));
    return Ok({ id, approved: true, status: 'approved', updated_at: r.data['updated_at'] });
  }

  async updateQuotation(id: string, body: Record<string, unknown>): Promise<Result<{ data: Row }>> {
    const patch: QuotationUpdatePatch = {};
    for (const key of ['title', 'total_amount', 'currency', 'valid_until', 'notes', 'status', 'items'] as const) {
      if (key in body) (patch as Record<string, unknown>)[key] = body[key];
    }
    const r = await this.quotationRepo.updateQuotation(id, patch);
    if (!r.ok) return r as Result<{ data: Row }>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Quotation ${id} topilmadi`));
    return Ok({ data: r.data });
  }

  async deleteQuotation(id: string): Promise<Result<Row>> {
    const r = await this.quotationRepo.softDeleteQuotation(id);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Quotation ${id} topilmadi yoki allaqachon o'chirilgan`));
    return Ok({ deleted: true, id, deleted_at: r.data['deleted_at'] });
  }

  async updateKpiTarget(id: string, body: Record<string, unknown>): Promise<Result<{ data: Row }>> {
    // FE sends { revenueTarget, orderCountTarget, newCustomerTarget }.
    // revenueTarget → quota_amount (the only column available without DDL).
    // orderCountTarget / newCustomerTarget need new columns — DEFERRED (no DDL here).
    // Legacy callers may send target_value or quota_amount directly — all honoured.
    const patch: KpiTargetPatch = {
      quota_amount: body['revenueTarget'] ?? body['quota_amount'] ?? body['target_value'],
      period: body['period'],
    };
    const r = await this.quotationRepo.updateKpiTarget(id, patch);
    if (!r.ok) return r as Result<{ data: Row }>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `KPI target ${id} topilmadi`));
    return Ok({ data: r.data });
  }

  async cancelOrder(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
    const r = await this.quotationRepo.cancelSalesOrder(id, body['reason']);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Order ${id} topilmadi`));
    return Ok({ id, cancelled: true, status: 'cancelled', updated_at: r.data['updated_at'] });
  }

  async markPaymentPaid(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
    const r = await this.quotationRepo.markPaymentPaid(id, body['payment_date']);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Payment ${id} topilmadi`));
    // EP-SD-030: on payment confirm, post the GL leg to the canonical `entries` ledger
    // (DR Kassa 5010 / CR Debitorlar 4000). Non-fatal — the payment IS recorded; a GL hiccup
    // is logged + retryable, never blocks the paid status or fakes a posting.
    const amount = Number(r.data['amount'] ?? 0);
    if (amount > 0) {
      const gl = await this.gl.postCustomerPayment(Number.isFinite(Number(id)) ? Number(id) : 0, amount);
      if (!gl.ok) this.logger.warn(`[EP-SD-030] GL post failed for payment ${id}: ${String(gl.error)}`);
      else this.logger.log(`[EP-SD-030] payment ${id} → entries ledger (${amount})`);
    }
    return Ok({ id, paid: true, status: 'paid', updated_at: r.data['updated_at'] });
  }

  async signContract(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
    const r = await this.quotationRepo.signContract(id, body['signature_data']);
    if (!r.ok) return r as Result<Row>;
    if (!r.data) return Err(AppErr('NOT_FOUND', `Contract ${id} topilmadi`));
    return Ok({ id, signed: true, status: 'signed', updated_at: r.data['updated_at'] });
  }

  async upsertPriceFormula(body: Record<string, unknown>): Promise<Result<Row | null, AppError>> {
    // `body` is the validated SDSettings partial (camelCase price fields). The repo
    // whitelists which columns it writes, so passing the object straight through is
    // safe. Returns the saved row (no more "{ updated: true }" lie on a 0-row update).
    return this.quotationRepo.upsertPriceFormula(body as PriceFormulaPatch);
  }

  async getPriceSettings(): Promise<Result<Row | null, AppError>> {
    return this.quotationRepo.getPriceSettings();
  }
}
