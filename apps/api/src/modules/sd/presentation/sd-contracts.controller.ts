/**
 * @module sd-contracts.controller
 * @description NestJS controller. HTTP route handlers for SD Contracts.
 */

import {
  Controller, Get, Patch, Post, Body, Param, Query,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db, runQuery } from '@shared/db';
import { sd_contracts } from '@shared/db';
import { sql } from 'drizzle-orm';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const CreateContractSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().max(10).optional(),
  endDate: z.string().max(10).optional(),
  totalAmount: z.union([z.string(), z.number()]).optional(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  templateType: z.string().max(30).optional(),
}).passthrough();

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'FINANCE_MANAGER', 'ACCOUNTANT'];

@ApiThrottle()
@ApiTags('Sd Contracts')
@ApiBearerAuth()
@Controller('sd/contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdContractsController {

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    try {
      let rows = await db.select().from(sd_contracts).orderBy(desc(sd_contracts.created_at));
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter((r) =>
          r.contract_number?.toLowerCase().includes(q) ||
          r.order_number?.toLowerCase().includes(q) ||
          r.papka_no?.toLowerCase().includes(q),
        );
      }
      if (status) {
        rows = rows.filter((r) => r.status === status);
      }
      return rows.map((r) => ({
        id: String(r.id),
        contractNumber: r.contract_number ?? null,
        orderId: r.order_id ? String(r.order_id) : null,
        orderNumber: r.order_number ?? null,
        templateType: r.template_type ?? null,
        papkaNo: r.papka_no ?? null,
        status: r.status ?? 'draft',
        signedAt: r.signed_at ? r.signed_at.toISOString() : null,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      }));
    } catch (_e) {
      return [];
    }
  }

  @ApiOperation({ summary: 'Create contract' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('sales_manager', 'director', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    try {
      const dto = CreateContractSchema.parse(body);
      const contractNumber = `CNT-${Date.now()}`;
      const orderId = dto.orderId != null ? parseInt(String(dto.orderId), 10) : null;
      const customerId = dto.customerId != null ? parseInt(String(dto.customerId), 10) : null;
      const totalAmount = parseFloat(String(dto.totalAmount ?? '0')) || 0;
      const r = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO sd_contracts
          (order_id, contract_number, template_type, status, customer_id,
           start_date, end_date, total_amount, payment_terms, notes)
        VALUES
          (${orderId}, ${contractNumber}, ${dto.templateType ?? 'standard'}, 'draft', ${customerId},
           ${dto.startDate ?? null}, ${dto.endDate ?? null}, ${totalAmount}, ${dto.paymentTerms ?? null}, ${dto.notes ?? null})
        RETURNING *
      `);
      const row = r.rows[0];
      if (!row) throw new Error('Insert returned no rows');
      return {
        id: String(row['id']),
        contractNumber: row['contract_number'] ?? contractNumber,
        status: row['status'] ?? 'draft',
        createdAt: row['created_at'] ? new Date(String(row['created_at'])).toISOString() : new Date().toISOString(),
      };
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Create error';
      throw new (await import('@nestjs/common').then(m => m.BadRequestException))(msg);
    }
  }

  @ApiOperation({ summary: 'Sign' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/sign')
  @Roles('sales_manager', 'director', 'super_admin')
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
