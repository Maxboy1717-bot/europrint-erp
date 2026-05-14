/**
 * @module fi.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FiService } from '../fi/fi.service';
import { CreateAccountingPeriodSchema, CreatePaymentSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const FI_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('fi')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FI_ROLES)
export class FiController {
  constructor(private readonly svc: FiService) {}

  @Get('accounting-periods')
  async getAccountingPeriods(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAccountingPeriods(query));
  }

  @Post('accounting-periods')
  async createAccountingPeriod(@Body() body: Record<string, unknown>) {
    const dto = CreateAccountingPeriodSchema.parse(body);
    return unwrapOrInternal(await this.svc.createAccountingPeriod(dto));
  }

  @Post('accounting-periods/:id/close')
  async closeAccountingPeriod(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.closeAccountingPeriod(id));
  }

  @Post('gl-documents/:id/post')
  async postGlDocument(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.postGlDocument(id));
  }

  @Get('payments')
  async getPayments(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findPayments(query));
  }

  @Post('payments')
  async createPayment(@Body() body: Record<string, unknown>) {
    const dto = CreatePaymentSchema.parse(body);
    return unwrapOrInternal(await this.svc.createPayment(dto as Record<string, unknown>));
  }

  /** GET /api/fi/cost-centers — list cost centers for budget management */
  @Get('cost-centers')
  async getCostCenters() {
    return this.svc.getCostCenters();
  }

  /** POST /api/fi/cost-centers — create a cost center */
  @Post('cost-centers')
  @HttpCode(HttpStatus.CREATED)
  async createCostCenter(@Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.createCostCenter(body));
  }

  /** PATCH /api/fi/cost-centers/:id — update a cost center */
  @Patch('cost-centers/:id')
  async updateCostCenter(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapOrInternal(await this.svc.updateCostCenter(id, body));
  }

  /** DELETE /api/fi/cost-centers/:id — delete a cost center */
  @Delete('cost-centers/:id')
  async deleteCostCenter(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteCostCenter(id));
  }

  /** GET /api/fi/stats — revenue, expenses, unpaid invoices summary */
  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  /** GET /api/fi/recent-transactions — recent income/expense transactions */
  @Get('recent-transactions')
  async getRecentTransactions() {
    return unwrapOrInternal(await this.svc.getRecentTransactions());
  }

  /** GET /api/fi/gl-documents — list GL documents */
  @Get('gl-documents')
  async getGlDocuments(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findGlDocuments(query));
  }

  /** POST /api/fi/gl-documents — create a GL document */
  @Post('gl-documents')
  @HttpCode(HttpStatus.CREATED)
  async createGlDocument(@Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.createGlDoc(body));
  }

  /** GET /api/fi/profit-centers — list profit centers */
  @Get('profit-centers')
  async getProfitCenters() {
    return unwrapOrInternal(await this.svc.findProfitCenters());
  }

  /** POST /api/fi/profit-centers — create a profit center */
  @Post('profit-centers')
  @HttpCode(HttpStatus.CREATED)
  async createProfitCenter(@Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.createProfitCenter(body));
  }

  /** PATCH /api/fi/profit-centers/:id — update a profit center */
  @Patch('profit-centers/:id')
  async updateProfitCenter(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return unwrapOrInternal(await this.svc.updateProfitCenter(id, body));
  }

  /** DELETE /api/fi/profit-centers/:id — delete a profit center */
  @Delete('profit-centers/:id')
  async deleteProfitCenter(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteProfitCenter(id));
  }
}
