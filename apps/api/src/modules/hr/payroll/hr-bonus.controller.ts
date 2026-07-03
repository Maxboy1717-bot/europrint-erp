/**
 * @module hr-bonus.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Moslashuvchan mukofot (bonus) mexanizmi (master-reja 3.15) — jarima mexanizmi
 * (`discipline_records` / `LateArrivalService`) bilan bir xil naqsh: rahbar mukofot
 * TAKLIF qiladi (pending), HR/DIRECTOR tasdiqlaydi (approved) → shundan keyin
 * `PayrollService.generatePeriodRows` uni davr-bonus sifatida `payroll_rows.bonus`
 * ga qo'shadi.
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { unwrapOrThrow } from '@common/http-result';
import type { AuthenticatedUser } from '@common/types/user.types';
import { BonusService } from './bonus.service';

const BONUS_GIVE_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'MANAGER', 'admin'] as const;
const BONUS_APPROVE_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'admin'] as const;

const CreateBonusSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  bonusType: z.string().min(1).max(30),
  amount: z.coerce.number().positive(),
  reason: z.string().min(5),
  bonusPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  bonusPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
});

const ListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('hr/bonuses')
export class HrBonusController {
  constructor(private readonly svc: BonusService) {}

  /** Rahbar mukofot taklif qiladi (holat: pending). */
  @Post()
  @Roles(...BONUS_GIVE_ROLES)
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateBonusSchema.parse(body);
    const r = await this.svc.createBonus({
      employeeId: dto.employeeId,
      bonusType: dto.bonusType,
      amount: dto.amount,
      reason: dto.reason,
      givenBy: user.id,
      bonusPeriodStart: dto.bonusPeriodStart ?? null,
      bonusPeriodEnd: dto.bonusPeriodEnd ?? null,
    });
    return { data: unwrapOrThrow(r) };
  }

  @Get()
  @Roles(...BONUS_APPROVE_ROLES)
  async list(@Query() query: unknown) {
    const dto = ListQuerySchema.parse(query);
    const r = await this.svc.list(dto.status, dto.limit ?? 50, dto.offset ?? 0);
    return { data: unwrapOrThrow(r) };
  }

  @Get('employee/:employeeId')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'MANAGER', 'admin', 'EMPLOYEE')
  async listByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    const r = await this.svc.listByEmployee(employeeId);
    return { data: unwrapOrThrow(r) };
  }

  /** HR/DIRECTOR mukofotni tasdiqlaydi — shundan keyin payroll'ga qo'shiladi. */
  @Post(':id/approve')
  @Roles(...BONUS_APPROVE_ROLES)
  async approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const r = await this.svc.approve(id, user.id);
    return { data: unwrapOrThrow(r) };
  }

  @Post(':id/reject')
  @Roles(...BONUS_APPROVE_ROLES)
  async reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const r = await this.svc.reject(id, user.id);
    return { data: unwrapOrThrow(r) };
  }
}
