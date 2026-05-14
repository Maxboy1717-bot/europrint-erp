/**
 * @module sd-contracts.controller
 * @description NestJS controller. HTTP route handlers for SD Contracts.
 */

import {
  Controller, Get, Patch, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db } from '@shared/db';
import { sd_contracts } from '@shared/db';
import { eq, ilike, and, desc } from 'drizzle-orm';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'FINANCE_MANAGER', 'ACCOUNTANT'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('sd/contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdContractsController {

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
