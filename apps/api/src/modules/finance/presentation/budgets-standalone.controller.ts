/**
 * @module budgets-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateBudgetLineSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const CreateBudgetSchema = z.object({
  name: z.string().min(1).max(200),
  fiscalYear: z.number().int().min(2000).max(3000).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  department: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Budgets Standalone')
@Controller('budgets')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT')
export class BudgetsStandaloneController {
  constructor(private readonly svc: BudgetsService) {}

  @ApiOperation({ summary: 'Get all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getAll(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateBudgetSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Get budget lines' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/lines')
  async getBudgetLines(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findBudgetLines(id, query));
  }

  @ApiOperation({ summary: 'Create budget line' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/lines')
  async createBudgetLine(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateBudgetLineSchema.parse(body);
    return unwrapOrInternal(await this.svc.createBudgetLine(id, dto as Record<string, unknown>));
  }
}
