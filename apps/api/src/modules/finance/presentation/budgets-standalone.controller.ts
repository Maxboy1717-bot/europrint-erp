import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateBudgetLineSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('budgets')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT')
export class BudgetsStandaloneController {
  constructor(private readonly svc: BudgetsService) {}

  @Get()
  async getAll(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.create(body));
  }

  @Get(':id/lines')
  async getBudgetLines(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findBudgetLines(id, query));
  }

  @Post(':id/lines')
  async createBudgetLine(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const dto = CreateBudgetLineSchema.parse(body);
    return unwrapOrInternal(await this.svc.createBudgetLine(id, dto as Record<string, unknown>));
  }
}
