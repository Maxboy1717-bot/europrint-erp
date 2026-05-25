/**
 * @module finance-extended.controller
 * @description NestJS controller. Categories sub-resource for `/finance-extended`.
 *
 * Rule 16 split (≤ 300 lines): the income-expense/inventory/assets/daily endpoints live in
 * `finance-extended-income.controller.ts`, and the payroll/tax/benchmark stubs live in
 * `finance-extended-payroll.controller.ts`. All three share the same `/finance-extended`
 * prefix and FINANCE_ROLES guard, so route paths and DI tokens are preserved for callers.
 * The two sibling controllers are re-exported below so existing consumers can keep importing
 * from this module path.
 */

import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceExtendedService } from '../finance-extended/finance-extended.service';
import { CreateIncomeCategorySchema, UpdateIncomeCategorySchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';
import { FINANCE_ROLES } from './finance-extended-dtos';

export { FinanceExtendedIncomeController } from './finance-extended-income.controller';
export { FinanceExtendedPayrollController } from './finance-extended-payroll.controller';

@ApiThrottle()
@ApiTags('Finance Extended')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedController {
  constructor(private readonly svc: FinanceExtendedService) {}

  @ApiOperation({ summary: 'Get categories' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('finance-categories')
  async getCategories(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findCategories(query));
  }

  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('finance-categories/:id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.findCategoryById(id));
  }

  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('finance-categories')
  async createCategory(@Body() body: unknown) {
    const dto = CreateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.createCategory(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('finance-categories/:id')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Patch category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('finance-categories/:id')
  async patchCategory(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('finance-categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteCategory(id));
  }
}
