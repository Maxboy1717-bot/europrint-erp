/**
 * @module mm-vendor-invoice.service
 * @description Business-logic service for the MM vendor-invoice money flows:
 *   material supplier list, invoice approval (with SoD), 2-way match (PO ↔ invoice),
 *   3-way match (PO ↔ goods receipt ↔ invoice) and payment recording.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   ⚠ Tolerances are NEVER hardcoded — they come from `business_settings`
 *   (`mm.three_way_qty_tolerance_pct`, `mm.three_way_amount_tolerance_pct`,
 *   seeded by the boot guard in shared/db/invariants/migrations-schema.ts) and
 *   may be overridden per request by the caller.
 * @layer Application (MM)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr, AppError } from '@common/result';
import { getBusinessSettingNumber } from '../../../shared/config/business-settings.reader';
import {
  MM_VENDOR_INVOICE_REPO,
  type IMmVendorInvoiceRepo,
  type Row,
  type VendorInvoiceMatchBasis,
} from '../domain/repositories/i-mm-vendor-invoice.repo';
import type {
  MmMatchVendorInvoiceDto,
  MmThreeWayMatchDto,
  MmVendorInvoicePaymentDto,
} from '../presentation/dto/mm-vendor-invoice.dto';

/** business_settings kalitlari — qiymat ULUSH sifatida saqlanadi (0.05 = 5%). */
export const MM_QTY_TOLERANCE_KEY = 'mm.three_way_qty_tolerance_pct';
export const MM_AMOUNT_TOLERANCE_KEY = 'mm.three_way_amount_tolerance_pct';
/** Sozlama jadvalida qator bo'lmasa ishlatiladigan zaxira qiymat (reader hech qachon throw qilmaydi). */
const TOLERANCE_FALLBACK = 0.05;

/** Pul taqqoslashda numeric(18,2) yaxlitlash farqini yutish uchun. */
const MONEY_EPSILON = 0.005;

/** Tasdiqlash mumkin bo'lgan holatlar. */
const APPROVABLE_STATUSES = ['pending', 'matched', 'verified'];
/** To'lov qabul qiladigan holatlar. */
const PAYABLE_STATUSES = ['approved', 'partially_paid'];

interface VarianceLeg {
  /** Ulush: (actual - expected) / expected. `null` = baholab bo'lmadi (ma'lumot yo'q). */
  ratio: number | null;
  expected: number;
  actual: number;
  withinTolerance: boolean;
}

@Injectable()
export class MmVendorInvoiceService {
  private readonly logger = new Logger(MmVendorInvoiceService.name);

  constructor(
    @Inject(MM_VENDOR_INVOICE_REPO) private readonly repo: IMmVendorInvoiceRepo,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // A. GET /mm/materials/:id/suppliers
  // ─────────────────────────────────────────────────────────────────────────
  async getMaterialSuppliers(materialId: number): Promise<Result<Row[]>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err(AppErr('BAD_REQUEST', "Material id musbat butun son bo'lishi kerak"));
    }
    const exists = await this.repo.materialExists(materialId);
    if (!exists.ok) return Err(exists.error);
    if (!exists.data) return Err(AppErr('NOT_FOUND', `Material #${materialId} topilmadi`));

    return this.repo.findMaterialSuppliers(materialId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // B. PATCH /mm/vendor-invoices/:id/approve
  // ─────────────────────────────────────────────────────────────────────────
  async approveInvoice(
    invoiceId: number,
    userId: number | null,
    notes: string | null,
  ): Promise<Result<Row>> {
    if (!userId) return Err(AppErr('UNAUTHORIZED', 'Foydalanuvchi aniqlanmadi'));

    const basisRes = await this.loadBasis(invoiceId);
    if (!basisRes.ok) return Err(basisRes.error);
    const basis = basisRes.data;

    if (basis.status === 'approved') {
      return Err(AppErr('CONFLICT', `Hisob-faktura ${basis.invoiceNumber} allaqachon tasdiqlangan`));
    }
    if (!APPROVABLE_STATUSES.includes(basis.status)) {
      // CONFLICT → 409 (http-result.ts:49). 'INVALID_STATUS' u yerda mapping'siz
      // qolgan va 500 ga tushadi — shuning uchun ishlatilmaydi.
      return Err(AppErr('CONFLICT', `"${basis.status}" holatidagi hisob-faktura tasdiqlanmaydi`));
    }
    // AP nazorati: moslik tekshirilgan va FARQ chiqqan hisob-faktura shu yerdan
    // tasdiqlanmaydi — avval 3-tomonlama moslik hal qilinishi kerak.
    if (basis.matchStatus === 'variance') {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          "Farqli (variance) hisob-faktura tasdiqlanmaydi — avval 3-tomonlama moslikni hal qiling",
        ),
      );
    }
    // SoD (vazifalarni ajratish) — director/approval-request.aggregate.ts:37 naqshi.
    if (basis.createdBy !== null && basis.createdBy === userId) {
      return Err(AppErr('FORBIDDEN', "SoD buzilishi: hisob-fakturani yaratgan shaxs uni o'zi tasdiqlay olmaydi"));
    }

    const updated = await this.repo.approveInvoice(invoiceId, userId, notes);
    if (!updated.ok) return Err(updated.error);
    if (!updated.data) {
      return Err(AppErr('CONFLICT', 'Hisob-faktura holati o\'zgardi — qayta urinib ko\'ring'));
    }
    this.logger.log(`Vendor invoice ${invoiceId} approved by user ${userId}`);
    return Ok(updated.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // C. PATCH /mm/vendor-invoices/:id/match — 2 tomonlama (PO ↔ hisob-faktura)
  // ─────────────────────────────────────────────────────────────────────────
  async matchInvoiceToPo(
    invoiceId: number,
    dto: MmMatchVendorInvoiceDto,
  ): Promise<Result<Row>> {
    const basisRes = await this.loadBasis(invoiceId);
    if (!basisRes.ok) return Err(basisRes.error);
    const basis = basisRes.data;

    if (basis.poId === null || basis.poAmount === null) {
      return Err(AppErr('BAD_REQUEST', 'Hisob-fakturaga xarid buyurtmasi (PO) biriktirilmagan — moslashtirib bo\'lmaydi'));
    }

    const tolerance = await this.resolveTolerance(
      [dto.tolerance, dto.tolerance_pct],
      MM_AMOUNT_TOLERANCE_KEY,
    );
    const qtyTolerance = await this.resolveTolerance([dto.tolerance, dto.tolerance_pct], MM_QTY_TOLERANCE_KEY);

    const amount = this.leg(basis.poAmount, basis.invoiceAmount, tolerance, true);
    const quantity = this.leg(basis.poQty, basis.invoiceQty, qtyTolerance);

    const matched = amount.withinTolerance && quantity.withinTolerance;
    const outcome = {
      matchStatus: matched ? 'matched' : 'variance',
      matchScore: this.score(amount, quantity),
      priceVariance: this.round4(amount.ratio ?? 0),
      quantityVariance: this.round4(quantity.ratio ?? 0),
    };

    const saved = await this.repo.saveMatchOutcome(invoiceId, outcome, false);
    if (!saved.ok) return Err(saved.error);
    if (!saved.data) return Err(AppErr('NOT_FOUND', `Hisob-faktura #${invoiceId} topilmadi`));

    return Ok({
      invoice: saved.data,
      match_status: outcome.matchStatus,
      match_score: outcome.matchScore,
      amount_tolerance: tolerance,
      quantity_tolerance: qtyTolerance,
      amount: this.legPayload(amount),
      quantity: this.legPayload(quantity),
      reasons: this.reasons(amount, quantity, 'PO'),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // D. POST /mm/3way-match/:invoiceId — PO ↔ qabul ↔ hisob-faktura
  // ─────────────────────────────────────────────────────────────────────────
  async runThreeWayMatch(
    invoiceId: number,
    dto: MmThreeWayMatchDto,
    userId: number | null,
  ): Promise<Result<Row>> {
    const basisRes = await this.loadBasis(invoiceId);
    if (!basisRes.ok) return Err(basisRes.error);
    const basis = basisRes.data;

    if (basis.poId === null || basis.poAmount === null) {
      return Err(AppErr('BAD_REQUEST', "3-tomonlama moslik uchun xarid buyurtmasi (PO) biriktirilishi shart"));
    }
    if (basis.grId === null) {
      return Err(AppErr('BAD_REQUEST', "3-tomonlama moslik uchun qabul hujjati (GR) biriktirilishi shart"));
    }

    const amountTolerance = await this.resolveTolerance(
      [dto.amount_tolerance_pct, dto.tolerancePercent],
      MM_AMOUNT_TOLERANCE_KEY,
    );
    const qtyTolerance = await this.resolveTolerance(
      [dto.qty_tolerance_pct, dto.tolerancePercent],
      MM_QTY_TOLERANCE_KEY,
    );

    // Klassik 3-tomonlama moslik: summa PO ga, miqdor esa QABUL QILINGAN
    // miqdorga solishtiriladi (postavshchik yuborganiga emas).
    const amount = this.leg(basis.poAmount, basis.invoiceAmount, amountTolerance, true);
    const quantity = this.leg(basis.grQty, basis.invoiceQty, qtyTolerance);
    const receipt = this.leg(basis.poQty, basis.grQty, qtyTolerance);

    const matched = amount.withinTolerance && quantity.withinTolerance;
    const overallStatus = matched ? 'matched' : 'variance';
    const reasons = this.reasons(amount, quantity, 'qabul');
    if (!receipt.withinTolerance) {
      reasons.push(
        `Qabul miqdori PO dan farq qiladi: PO ${receipt.expected} ↔ qabul ${receipt.actual} (${this.pct(receipt.ratio)})`,
      );
    }

    const auditRes = await this.repo.insertThreeWayMatchResult({
      invoiceId,
      poId: basis.poId,
      grId: basis.grId,
      poAmount: basis.poAmount,
      grAmount: basis.grAmount,
      invoiceAmount: basis.invoiceAmount,
      priceVariancePercent: this.round4((amount.ratio ?? 0) * 100),
      quantityVariancePercent: this.round4((quantity.ratio ?? 0) * 100),
      overallStatus,
      tolerancePercent: this.round4(amountTolerance * 100),
      autoApproved: false,
      matchedBy: userId,
      notes: dto.notes ?? (reasons.length ? reasons.join('; ') : null),
      matchDetails: {
        amount: this.legPayload(amount),
        quantity: this.legPayload(quantity),
        receipt_vs_po: this.legPayload(receipt),
        amount_tolerance: amountTolerance,
        quantity_tolerance: qtyTolerance,
        reasons,
      },
    });
    if (!auditRes.ok) return Err(auditRes.error);

    const saved = await this.repo.saveMatchOutcome(
      invoiceId,
      {
        matchStatus: overallStatus,
        matchScore: this.score(amount, quantity),
        priceVariance: this.round4(amount.ratio ?? 0),
        quantityVariance: this.round4(quantity.ratio ?? 0),
      },
      true,
    );
    if (!saved.ok) return Err(saved.error);

    this.logger.log(`3-way match invoice ${invoiceId}: ${overallStatus}`);
    return Ok({
      invoice_id: invoiceId,
      overall_status: overallStatus,
      match_result: auditRes.data,
      invoice: saved.data ?? null,
      amount_tolerance: amountTolerance,
      quantity_tolerance: qtyTolerance,
      amount: this.legPayload(amount),
      quantity: this.legPayload(quantity),
      receipt_vs_po: this.legPayload(receipt),
      reasons,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // E. POST /mm/vendor-invoices/:id/payment
  // ─────────────────────────────────────────────────────────────────────────
  async recordPayment(
    invoiceId: number,
    dto: MmVendorInvoicePaymentDto,
    userId: number | null,
  ): Promise<Result<Row>> {
    const basisRes = await this.loadBasis(invoiceId);
    if (!basisRes.ok) return Err(basisRes.error);
    const basis = basisRes.data;

    if (!PAYABLE_STATUSES.includes(basis.status)) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          `Faqat tasdiqlangan hisob-faktura to'lanadi (hozirgi holat: "${basis.status}")`,
        ),
      );
    }
    if (basis.invoiceAmount <= 0) {
      return Err(AppErr('BAD_REQUEST', 'Hisob-faktura summasi 0 — to\'lov qayd etilmaydi'));
    }

    const currency = dto.currency ?? basis.currency;
    if (currency !== basis.currency && !dto.exchange_rate) {
      return Err(
        AppErr('BAD_REQUEST', `Valyuta hisob-fakturadan farq qiladi (${basis.currency}) — exchange_rate talab qilinadi`),
      );
    }

    const remaining = basis.invoiceAmount - basis.paidAmount;
    if (remaining <= MONEY_EPSILON) {
      return Err(AppErr('CONFLICT', 'Hisob-faktura to\'liq to\'langan'));
    }
    if (dto.amount - remaining > MONEY_EPSILON) {
      return Err(
        AppErr(
          'BAD_REQUEST',
          `To'lov summasi qoldiqdan oshib ketdi: qoldiq ${remaining}, so'ralgan ${dto.amount}`,
        ),
      );
    }

    // ⚠ GL: `gl_account_mappings` da postavshchikka to'lov (Dr 6000 Kreditorlar /
    // Cr bank) uchun MAPPING YO'Q (jonli DB, 2026-08-07 — mavjud turlar:
    // EXTERNAL_IN/OUT, DAMAGE, INTERNAL_*, INVENTORY_ADJ_*, ADVANCE,
    // FINANCIAL_AID, WASTE_OUT). Mapping egasi tomonidan kiritilmaguncha GL
    // provodkasi YOZILMAYDI — soxta provodka yozgandan ko'ra yozmagan afzal (Q-40).
    const recorded = await this.repo.recordPayment(
      {
        invoiceId,
        vendorId: basis.vendorId,
        paymentDate: dto.payment_date ?? new Date().toISOString().slice(0, 10),
        paymentMethod: dto.payment_method,
        amount: dto.amount,
        currency,
        exchangeRate: dto.exchange_rate ?? null,
        reference: dto.reference ?? null,
        bankAccount: dto.bank_account ?? null,
        notes: dto.notes ?? null,
        createdBy: userId,
      },
      {
        fullyPaidAtOrAbove: basis.invoiceAmount - MONEY_EPSILON,
        statusWhenFullyPaid: 'paid',
        statusWhenPartial: 'partially_paid',
      },
    );
    if (!recorded.ok) return Err(recorded.error);

    this.logger.log(
      `Vendor invoice ${invoiceId} payment ${dto.amount} ${currency} by user ${userId} → ${recorded.data.invoiceStatus}`,
    );
    return Ok({
      payment: recorded.data.payment,
      paid_total: recorded.data.paidTotal,
      invoice_status: recorded.data.invoiceStatus,
      invoice_amount: basis.invoiceAmount,
      remaining_amount: this.round4(basis.invoiceAmount - recorded.data.paidTotal),
      gl_posted: false,
      gl_skip_reason: "gl_account_mappings da postavshchikka to'lov turi yo'q — egasi qarori kerak",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Yordamchilar
  // ─────────────────────────────────────────────────────────────────────────

  private async loadBasis(invoiceId: number): Promise<Result<VendorInvoiceMatchBasis, AppError>> {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return Err(AppErr('BAD_REQUEST', "Hisob-faktura id musbat butun son bo'lishi kerak"));
    }
    const res = await this.repo.getMatchBasis(invoiceId);
    if (!res.ok) return Err(res.error);
    if (!res.data) return Err(AppErr('NOT_FOUND', `Hisob-faktura #${invoiceId} topilmadi`));
    return Ok(res.data);
  }

  /**
   * Chegara ulushi: so'rovda foiz (0..100) berilgan bo'lsa shundan, aks holda
   * business_settings dagi ulushdan (0.05 = 5%). Hech qachon hardcoded emas.
   */
  private async resolveTolerance(overridesPct: Array<number | undefined>, settingKey: string): Promise<number> {
    const override = overridesPct.find((v) => typeof v === 'number' && Number.isFinite(v));
    if (typeof override === 'number') return override / 100;
    return getBusinessSettingNumber(settingKey, TOLERANCE_FALLBACK);
  }

  /**
   * Bitta taqqoslash "oyog'i".
   * · Kutilgan (baza) qiymat yo'q/0 bo'lsa — baholanmaydi (`ratio = null`), moslikni
   *   bloklamaydi, sabab hisobotda ko'rsatiladi.
   * · `strictActual = true` (SUMMA oyog'i): haqiqiy qiymat 0 bo'lsa bu HAQIQIY farq —
   *   0 so'mlik hisob-faktura 1 mln so'mlik PO ga "mos" deb hisoblanmaydi.
   * · `strictActual = false` (MIQDOR oyog'i): hisob-faktura satrlari kiritilmagan
   *   bo'lishi mumkin (faqat sarlavha) — bunda miqdor baholanmaydi.
   */
  private leg(expected: number, actual: number, tolerance: number, strictActual = false): VarianceLeg {
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual)) {
      return { ratio: null, expected, actual, withinTolerance: true };
    }
    if (actual <= 0 && !strictActual) {
      return { ratio: null, expected, actual, withinTolerance: true };
    }
    const ratio = (actual - expected) / expected;
    return { ratio, expected, actual, withinTolerance: Math.abs(ratio) <= tolerance };
  }

  private legPayload(leg: VarianceLeg): Record<string, unknown> {
    return {
      expected: leg.expected,
      actual: leg.actual,
      variance_ratio: leg.ratio === null ? null : this.round4(leg.ratio),
      variance_percent: leg.ratio === null ? null : this.round4(leg.ratio * 100),
      evaluated: leg.ratio !== null,
      within_tolerance: leg.withinTolerance,
    };
  }

  /** 0..100 — eng katta chetlanishdan kelib chiqadi. */
  private score(amount: VarianceLeg, quantity: VarianceLeg): number {
    const worst = Math.max(Math.abs(amount.ratio ?? 0), Math.abs(quantity.ratio ?? 0));
    return this.round4(Math.min(100, Math.max(0, (1 - worst) * 100)));
  }

  private reasons(amount: VarianceLeg, quantity: VarianceLeg, qtyBaseline: string): string[] {
    const out: string[] = [];
    if (!amount.withinTolerance) {
      out.push(`Summa farqi: PO ${amount.expected} ↔ hisob-faktura ${amount.actual} (${this.pct(amount.ratio)})`);
    }
    if (!quantity.withinTolerance) {
      out.push(
        `Miqdor farqi: ${qtyBaseline} ${quantity.expected} ↔ hisob-faktura ${quantity.actual} (${this.pct(quantity.ratio)})`,
      );
    }
    if (quantity.ratio === null) {
      out.push('Miqdor baholanmadi — hisob-faktura satrlari yoki taqqoslash bazasi bo\'sh');
    }
    return out;
  }

  private pct(ratio: number | null): string {
    return ratio === null ? "baholanmadi" : `${this.round4(ratio * 100)}%`;
  }

  private round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }
}
