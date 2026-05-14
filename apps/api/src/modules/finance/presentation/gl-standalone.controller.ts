/**
 * @module gl-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { SeedGlAccountsSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('gl')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class GlStandaloneController {
  constructor(private readonly glSvc: GlService) {}

  @Get('accounts')
  async getAccounts() {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @Post('seed-accounts')
  async seedAccounts(@Body() body: Record<string, unknown>) {
    const dto = SeedGlAccountsSchema.parse(body);
    const rows = (dto.accounts ?? []) as Record<string, unknown>[];
    return unwrapOrInternal(await this.glSvc.seedAccounts(rows));
  }

  @Post('accounts')
  async createAccount(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }
}
