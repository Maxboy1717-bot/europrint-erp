/**
 * @module finance-main-actions.controller
 * @description Write/action endpoints (POST GL/AP/AR/reverse, profitability recalc,
 * salary benchmark) split from finance-main.controller.ts per Rule 16 (≤ 300 lines).
 * Shares the `/finance` route prefix and FINANCE_ROLES guard with the read sibling.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { CurrentUser } from '@common/decorators/current-user.decorator';

interface AuthenticatedUser { id: number; sub?: number; }

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
  async createGlEntry(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateGlEntrySchema.parse(body);
    return this.accountingSvc.createGlDocument(dto as Record<string, unknown>, user?.sub ?? user?.id);
  }

  // F9 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): draft -> review -> post gate for manual journal
  // entries. Narrower @Roles than the class-level FINANCE_ROLES — the accountant/finance_manager
  // who DRAFTS a JE above cannot also be the one who approves it (create != approve, SoD).
  @ApiOperation({ summary: 'Approve gl entry draft' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gl-entries/:id/approve')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async approveGlEntry(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountingSvc.approveGlDocument(Number(id), user?.sub ?? user?.id);
  }

  @ApiOperation({ summary: 'Reject gl entry draft' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-entries/:id/reject')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async rejectGlEntry(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.accountingSvc.rejectGlDocument(Number(id), user?.sub ?? user?.id);
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
   *
   * A4 (governance fix, 2026-07-05): the actual UPDATE/computation used to run here via raw
   * `db.execute` directly in the controller. Now delegates to
   * FinanceAccountingService.recalculateProfitability (same SQL, same conditions, same computed
   * values — pure layer move). Controller only parses input and unwraps the Result; the 500-on-
   * DB-error behavior from Q6 (2026-07-04) is preserved via unwrapOrInternal.
   */
  @ApiOperation({ summary: 'Recalculate profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'DB error during recalculation' })
  @Post('profitability/recalculate')
  @HttpCode(HttpStatus.ACCEPTED)
  async recalculateProfitability(@Body() body: unknown) {
    const payload = (body ?? {}) as { orderId?: string };
    const result = await this.accountingSvc.recalculateProfitability(payload.orderId);
    const data = unwrapOrInternal(result);
    return { status: 'done', ...data };
  }

  /** POST /api/finance/ap/entries — create accounts-payable entry */
  @ApiOperation({ summary: 'Create ap entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ap/entries')
  @HttpCode(HttpStatus.CREATED)
  async createApEntry(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ApEntrySchema.parse(body);
    const result = await this.actionsSvc.createApEntry({ ...dto, createdBy: user?.sub ?? user?.id } as Record<string, unknown>);
    return unwrapOrInternal(result);
  }

  /** POST /api/finance/ar/entries — create accounts-receivable entry */
  @ApiOperation({ summary: 'Create ar entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ar/entries')
  @HttpCode(HttpStatus.CREATED)
  async createArEntry(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ArEntrySchema.parse(body);
    const result = await this.actionsSvc.createArEntry({ ...dto, createdBy: user?.sub ?? user?.id } as Record<string, unknown>);
    return unwrapOrInternal(result);
  }
}
