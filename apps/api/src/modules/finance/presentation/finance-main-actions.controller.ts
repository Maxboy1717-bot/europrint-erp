/**
 * @module finance-main-actions.controller
 * @description Write/action endpoints (POST GL/AP/AR/reverse, profitability recalc,
 * salary benchmark) split from finance-main.controller.ts per Rule 16 (≤ 300 lines).
 * Shares the `/finance` route prefix and FINANCE_ROLES guard with the read sibling.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Logger, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceActionsService } from '../application/finance-actions.service';
import { FinanceAccountingService } from '../application/finance-accounting.service';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

const CreateGlEntrySchema = z.object({
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  postingDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  reversalOf: z.union([z.string(), z.number()]).optional(),
  lines: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

const ApEntrySchema = z.object({
  vendorId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

const ArEntrySchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Finance Main Actions')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceMainActionsController {
  private readonly logger = new Logger(FinanceMainActionsController.name);
  constructor(
    private readonly actionsSvc: FinanceActionsService,
    private readonly accountingSvc: FinanceAccountingService,
  ) {}

  // Q1 (SAP-conformance fix, 2026-07-04): previously delegated to GlService.postDocument(),
  // which only inserted a `gl_documents` header row and never posted to the canonical `entries`
  // ledger (SAP#76: entries is the ONE money ledger). Now delegates to the same honest engine
  // already used by POST /api/accounting/gl-documents (FinanceAccountingService.createGlDocument
  // -> GlPostingService.postJournal -> entries). No FE caller existed for this route (grep-verified),
  // so this is a pure correctness fix with zero behavioral risk to existing consumers.
  @ApiOperation({ summary: 'Create gl entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-entries')
  @HttpCode(HttpStatus.CREATED)
  async createGlEntry(@Body() body: unknown) {
    const dto = CreateGlEntrySchema.parse(body);
    return this.accountingSvc.createGlDocument(dto as Record<string, unknown>);
  }

  // Q2 (SAP-conformance fix, 2026-07-04): "reversed" status now checked against the canonical
  // `entries` ledger (entry_number LIKE 'REV-{id}-%', matching GlPostingService's own reference
  // convention) instead of a gl_documents [REVERSAL]-tagged header, since POST .../reverse below
  // no longer writes gl_documents at all.
  @ApiOperation({ summary: 'Get gl entry reverse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gl-entries/:id/reverse')
  async getGlEntryReverse(@Param('id') id: string) {
    type Row = Record<string, unknown>;
    const entryR = await db.execute(sql`
      SELECT id, entry_number, entry_date, document_type, debit_account, credit_account,
             amount, description, currency, created_at
      FROM entries WHERE id::text = ${id} LIMIT 1
    `);
    const entry = (((entryR as { rows?: Row[] }).rows) ?? [])[0] ?? null;
    const revR = await db.execute(sql`
      SELECT id, entry_number, amount, description, created_at
      FROM entries
      WHERE entry_number LIKE ${'REV-' + id + '-%'}
      ORDER BY created_at DESC LIMIT 20
    `);
    const reversals = (((revR as { rows?: Row[] }).rows) ?? []);
    return { entryId: id, entry, reversed: reversals.length > 0, reversals };
  }

  // Q2 (SAP-conformance fix, 2026-07-04): previously inserted a `[REVERSAL]`-tagged `gl_documents`
  // header only (via glSvc.postDocument) — no mirrored entry ever reached the canonical `entries`
  // ledger, so the trial balance never reflected the reversal. Now delegates to
  // FinanceAccountingService.reverseEntry(), which fetches the ORIGINAL entry's real debit/credit
  // accounts + amount and posts a genuinely mirrored (swapped) balanced entry via the same ONE
  // engine (GlPostingService.postJournal). No request body needed — the reversal amount/accounts
  // are derived from the original entry, not caller-supplied (this is more correct than the old
  // design, which let the caller pass arbitrary disconnected lines).
  @ApiOperation({ summary: 'Post gl entry reverse' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gl-entries/:id/reverse')
  @HttpCode(HttpStatus.ACCEPTED)
  async postGlEntryReverse(@Param('id') id: string) {
    return this.accountingSvc.reverseEntry(Number(id));
  }

  @ApiOperation({ summary: 'Get salary benchmark' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('salary-benchmark/:userId')
  async getSalaryBenchmark(@Param('userId') userId: string) {
    const r = await this.actionsSvc.getSalaryBenchmark();
    const row = unwrapOrThrow(r);
    return {
      data: {
        userId,
        market_min: row['market_min'] ?? null,
        market_median: row['market_median'] ?? null,
        market_max: row['market_max'] ?? null,
        market_avg: row['market_avg'] ?? null,
        sample_size: Number(row['sample_size'] ?? 0),
        currency: 'UZS',
      },
    };
  }

  /**
   * POST /api/finance/profitability/recalculate — real recalculation:
   * UPDATE order_costings SET gross_profit = selling_price - total_cost,
   *   profit_margin = (selling_price - total_cost) / NULLIF(selling_price,0) * 100,
   *   calculated_at = NOW()
   * Optionally scoped to a single orderId.
   */
  @ApiOperation({ summary: 'Recalculate profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'DB error during recalculation' })
  @Post('profitability/recalculate')
  @HttpCode(HttpStatus.ACCEPTED)
  async recalculateProfitability(@Body() body: unknown) {
    try {
      const payload = (body ?? {}) as { orderId?: string };
      type Row = Record<string, unknown>;
      const r = await db.execute(
        payload.orderId
          ? sql`
              UPDATE order_costings
              SET gross_profit  = (selling_price::numeric - total_cost::numeric),
                  profit_margin = ROUND(
                    (selling_price::numeric - total_cost::numeric)
                    / NULLIF(selling_price::numeric, 0) * 100, 4
                  ),
                  calculated_at = NOW()
              WHERE sales_order_id::text = ${payload.orderId}
                 OR production_order_id::text = ${payload.orderId}
              RETURNING id, gross_profit, profit_margin, calculated_at
            `
          : sql`
              UPDATE order_costings
              SET gross_profit  = (selling_price::numeric - total_cost::numeric),
                  profit_margin = ROUND(
                    (selling_price::numeric - total_cost::numeric)
                    / NULLIF(selling_price::numeric, 0) * 100, 4
                  ),
                  calculated_at = NOW()
              RETURNING id, gross_profit, profit_margin, calculated_at
            `,
      );
      const rows = (((r as { rows?: Row[] }).rows) ?? []);
      this.logger.log(`Profitability recalc done: ${rows.length} rows updated orderId=${payload.orderId ?? 'all'}`);
      return { status: 'done', updated: rows.length, orderId: payload.orderId ?? null, recalcAt: _time.now().toISOString() };
    } catch (e) {
      this.logger.error(`recalculateProfitability: ${(e as Error).message}`);
      // Q6 (2026-07-04): was silently swallowed into a 202 { status: 'error' } body —
      // caller (and any monitoring) saw "Accepted" for a failed DB write. Now surfaces
      // as a real 500 so failures are visible as failures (Q-40 catch-swallow-return-success fix).
      throw new InternalServerErrorException((e as Error).message);
    }
  }

  /** POST /api/finance/ap/entries — create accounts-payable entry */
  @ApiOperation({ summary: 'Create ap entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ap/entries')
  @HttpCode(HttpStatus.CREATED)
  async createApEntry(@Body() body: unknown) {
    const dto = ApEntrySchema.parse(body);
    const result = await this.actionsSvc.createApEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }

  /** POST /api/finance/ar/entries — create accounts-receivable entry */
  @ApiOperation({ summary: 'Create ar entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ar/entries')
  @HttpCode(HttpStatus.CREATED)
  async createArEntry(@Body() body: unknown) {
    const dto = ArEntrySchema.parse(body);
    const result = await this.actionsSvc.createArEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }
}
