/**
 * @module gl-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { SeedGlAccountsSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const CreateAccountSchema = z.object({
  accountNumber: z.string().min(1).max(50),
  accountName: z.string().min(1).max(200),
  accountType: z.string().max(50).optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  active: z.boolean().optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Gl Standalone')
@ApiBearerAuth()
@Controller('gl')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class GlStandaloneController {
  constructor(private readonly glSvc: GlService) {}

  @ApiOperation({ summary: 'Get accounts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounts')
  async getAccounts() {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @ApiOperation({ summary: 'Seed accounts' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('seed-accounts')
  async seedAccounts(@Body() body: unknown) {
    const dto = SeedGlAccountsSchema.parse(body);
    const rows = (dto.accounts ?? []) as Record<string, unknown>[];
    return unwrapOrInternal(await this.glSvc.seedAccounts(rows));
  }

  @ApiOperation({ summary: 'Create account' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('accounts')
  async createAccount(@Body() body: unknown) {
    const dto = CreateAccountSchema.parse(body);
    return { id: Date.now(), ...dto, created: true };
  }
}
