/**
 * @module sd-contracts.controller
 * @description NestJS controller. HTTP route handlers for SD Contracts.
 * NOTE: Contract creation (POST) is handled by SdQuotationsController (@Controller 'sd').
 * This controller handles GET list and PATCH sign only.
 */

import {
  Controller, Get, Patch, Param, Query, Body,
  UseGuards, UseInterceptors, InternalServerErrorException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db, runQuery } from '@shared/db';
import { sd_contracts } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { SdContractTermsRepository } from '../infrastructure/repositories/sd-contract-terms.repo';

const SD_ROLES = ['sales_manager', 'SALES', 'manager', 'director', 'super_admin', 'FINANCE_MANAGER', 'ACCOUNTANT'];

@ApiThrottle()
@ApiTags('Sd Contracts')
@ApiBearerAuth()
@Controller('sd/contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdContractsController {
  constructor(private readonly termsRepo: SdContractTermsRepository) {}

  // #78 (vision 06-sd): structured contract terms — payment/penalty(jarima)/penya + currency.
  // Rates are percentages (0..100); currency is ISO-3 (defaults to UZS in DB). All optional/partial.
  private static readonly TermsSchema = z.object({
    payment_terms: z.string().max(500).nullable().optional(),
    penalty_rate:  z.number().min(0).max(100).nullable().optional(),
    penya_rate:    z.number().min(0).max(100).nullable().optional(),
    currency:      z.string().length(3).nullable().optional(),
  });

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    try {
      // #04 SD fix: the Drizzle sd_contracts stub declares phantom columns (start_date/end_date/
      // total_amount/payment_terms) absent in live DB → db.select() threw 500. Raw SELECT * returns the
      // real columns only; the mapping below maps missing ones to null (honest, not fake).
      const res = await runQuery<Record<string, unknown>>(sql`SELECT * FROM sd_contracts ORDER BY created_at DESC`);
      let rows = (Array.isArray(res.rows) ? res.rows : []) as Array<Record<string, any>>;
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter((r) =>
          r.contract_number?.toLowerCase().includes(q),
        );
      }
      if (status) {
        rows = rows.filter((r) => r.status === status);
      }
      return rows.map((r) => ({
        id: String(r.id),
        contractNumber: r.contract_number ?? null,
        orderId: r.order_id ? String(r.order_id) : null,
        customerId: r.customer_id ? String(r.customer_id) : null,
        templateType: r.template_type ?? null,
        status: r.status ?? 'draft',
        startDate: r.start_date ?? null,
        endDate: r.end_date ?? null,
        totalAmount: r.total_amount ?? null,
        paymentTerms: r.payment_terms ?? null,
        penaltyRate: r.penalty_rate ?? null,
        penyaRate: r.penya_rate ?? null,
        currency: r.currency ?? null,
        notes: r.notes ?? null,
        signedAt: r.signed_at ? r.signed_at.toISOString() : null,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      }));
    } catch (e) {
      throw new InternalServerErrorException(String(e));
    }
  }

  @ApiOperation({ summary: 'Set structured terms (payment/penalty/penya)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/terms')
  @Roles('sales_manager', 'manager', 'director', 'super_admin', 'FINANCE_MANAGER')
  async setTerms(@Param('id') id: string, @Body() body: unknown) {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) throw new BadRequestException('Invalid ID');
    const parsed = SdContractsController.TermsSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);
    const result = await this.termsRepo.setTerms(numId, parsed.data);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') throw new NotFoundException(result.error.message);
      throw new InternalServerErrorException(result.error.message);
    }
    return result.data;
  }

  @ApiOperation({ summary: 'Sign' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/sign')
  @Roles('sales_manager', 'manager', 'director', 'super_admin')
  async sign(@Param('id') id: string) {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) return { ok: false, error: 'Invalid ID' };
      const result = await db.update(sd_contracts)
        .set({ status: 'signed', signed_at: new Date(), updated_at: new Date() })
        .where(eq(sd_contracts.id, numId))
        .returning();
      if (!result[0]) return { ok: false, error: 'Contract not found' };
      const r = result[0];
      return {
        id: String(r.id),
        contractNumber: r.contract_number ?? null,
        status: r.status,
        signedAt: r.signed_at ? r.signed_at.toISOString() : null,
      };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error)?.message || 'Sign error' };
    }
  }
}
