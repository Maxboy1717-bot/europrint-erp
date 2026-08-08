/**
 * @module fi.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FiService } from '../fi/fi.service';
import { CreateAccountingPeriodSchema, CreatePaymentSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const FI_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

const CreateCostCenterSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parentId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
}).passthrough();

const UpdateCostCenterSchema = CreateCostCenterSchema.partial();

const CreateProfitCenterSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parentId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
}).passthrough();

const UpdateProfitCenterSchema = CreateProfitCenterSchema.partial();

const CreateGlDocumentSchema = z.object({
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  postingDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  lines: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Fi')
@Controller('fi')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FI_ROLES)
export class FiController {
  constructor(private readonly svc: FiService) {}

  @ApiOperation({ summary: 'Get accounting periods' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounting-periods')
  async getAccountingPeriods(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAccountingPeriods(query));
  }

  @ApiOperation({ summary: 'Create accounting period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('accounting-periods')
  async createAccountingPeriod(@Body() body: unknown) {
    const dto = CreateAccountingPeriodSchema.parse(body);
    return unwrapOrInternal(await this.svc.createAccountingPeriod(dto));
  }

  @ApiOperation({ summary: 'Close accounting period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('accounting-periods/:id/close')
  async closeAccountingPeriod(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.closeAccountingPeriod(id));
  }

  @ApiOperation({ summary: 'Post gl document' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gl-documents/:id/post')
  async postGlDocument(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.postGlDocument(id));
  }

  @ApiOperation({ summary: 'Get payments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('payments')
  async getPayments(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findPayments(query));
  }

  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('payments')
  async createPayment(@Body() body: unknown) {
    const dto = CreatePaymentSchema.parse(body);
    return unwrapOrInternal(await this.svc.createPayment(dto as Record<string, unknown>));
  }

  /** GET /api/fi/cost-centers — list cost centers for budget management */
  @ApiOperation({ summary: 'Get cost centers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cost-centers')
  async getCostCenters() {
    return this.svc.getCostCenters();
  }

  /** POST /api/fi/cost-centers — create a cost center */
  @ApiOperation({ summary: 'Create cost center' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cost-centers')
  @HttpCode(HttpStatus.CREATED)
  async createCostCenter(@Body() body: unknown) {
    const dto = CreateCostCenterSchema.parse(body);
    return unwrapOrInternal(await this.svc.createCostCenter(dto as Record<string, unknown>));
  }

  /** PATCH /api/fi/cost-centers/:id — update a cost center */
  @ApiOperation({ summary: 'Update cost center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('cost-centers/:id')
  async updateCostCenter(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateCostCenterSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCostCenter(id, dto as Record<string, unknown>));
  }

  /** DELETE /api/fi/cost-centers/:id — delete a cost center */
  @ApiOperation({ summary: 'Delete cost center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('cost-centers/:id')
  async deleteCostCenter(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteCostCenter(id));
  }

  /** GET /api/fi/stats — revenue, expenses, unpaid invoices summary */
  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  /** GET /api/fi/recent-transactions — recent income/expense transactions */
  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('recent-transactions')
  async getRecentTransactions() {
    return unwrapOrInternal(await this.svc.getRecentTransactions());
  }

  /** GET /api/fi/gl-documents — list GL documents */
  @ApiOperation({ summary: 'Get gl documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl-documents')
  async getGlDocuments(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findGlDocuments(query));
  }

  /** POST /api/fi/gl-documents — create a GL document */
  @ApiOperation({ summary: 'Create gl document' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-documents')
  @HttpCode(HttpStatus.CREATED)
  async createGlDocument(@Body() body: unknown) {
    const dto = CreateGlDocumentSchema.parse(body);
    return unwrapOrInternal(await this.svc.createGlDoc(dto as Record<string, unknown>));
  }

  /** GET /api/fi/profit-centers — list profit centers */
  @ApiOperation({ summary: 'Get profit centers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('profit-centers')
  async getProfitCenters() {
    return unwrapOrInternal(await this.svc.findProfitCenters());
  }

  /** POST /api/fi/profit-centers — create a profit center */
  @ApiOperation({ summary: 'Create profit center' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('profit-centers')
  @HttpCode(HttpStatus.CREATED)
  async createProfitCenter(@Body() body: unknown) {
    const dto = CreateProfitCenterSchema.parse(body);
    return unwrapOrInternal(await this.svc.createProfitCenter(dto as Record<string, unknown>));
  }

  /** PATCH /api/fi/profit-centers/:id — update a profit center */
  @ApiOperation({ summary: 'Update profit center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('profit-centers/:id')
  async updateProfitCenter(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateProfitCenterSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateProfitCenter(id, dto as Record<string, unknown>));
  }

  /** DELETE /api/fi/profit-centers/:id — delete a profit center */
  @ApiOperation({ summary: 'Delete profit center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('profit-centers/:id')
  async deleteProfitCenter(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteProfitCenter(id));
  }

  /** GET /api/fi/tax-summary — current-month tax aggregate from fi_invoices */
  @ApiOperation({ summary: 'Get current-month tax summary from fi_invoices' })
  @ApiResponse({ status: 200, description: 'totalThisMonth, paid, pending, overdue' })
  @Get('tax-summary')
  async getTaxSummary() {
    return unwrapOrInternal(await this.svc.getTaxSummary());
  }
}
