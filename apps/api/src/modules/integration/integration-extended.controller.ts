/**
 * @module integration-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, HttpCode, Param, Post, Put, Query,
  UseGuards, UseInterceptors, UsePipes, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { IntegrationExtendedMroRepository } from './integration-extended-mro.repo';
import {
  CreateEquipmentSchema, CreateEquipmentDto,
  CreateMroRequestSchema, CreateMroRequestDto,
  CreateMroItemSchema, CreateMroItemDto,
  CreateExpenseRequestSchema, CreateExpenseRequestDto,
  ApproveActionSchema, ApproveActionDto,
  InvoiceMatchSchema, InvoiceMatchDto,
} from './dto/mro.dto';

const ADMIN_ROLES    = ['admin', 'super_admin', 'manager', 'director'] as const;
const ALL_ROLES      = ['admin', 'super_admin', 'manager', 'director', 'employee', 'hr_manager', 'warehouse', 'warehouse_manager', 'accountant', 'finance'] as const;
const FINANCE_ROLES  = ['admin', 'super_admin', 'manager', 'director', 'accountant', 'finance'] as const;
const MRO_ROLES      = ['admin', 'super_admin', 'manager', 'director', 'warehouse', 'warehouse_manager'] as const;

@ApiThrottle()
@ApiTags('Integration Extended')
@ApiBearerAuth()
@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class IntegrationExtendedController {
  constructor(private readonly repo: IntegrationExtendedMroRepository) {}

  @ApiOperation({ summary: 'Get equipment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('equipment')
  @Roles(...MRO_ROLES)
  async getEquipment() {
    const r = await this.repo.findFlatEquipment();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Create equipment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('equipment')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateEquipmentSchema))
  async createEquipment(@Body() dto: CreateEquipmentDto) {
    const r = await this.repo.insertFlatEquipment(
      dto.name, dto.category ?? 'general', dto.status ?? 'active',
      dto.location ?? null, dto.purchaseDate ?? null, dto.nextMaintenanceDate ?? null,
    );
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get flat requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('requests')
  @Roles(...MRO_ROLES)
  async getFlatRequests(@Query('status') status?: string) {
    const r = await this.repo.findFlatRequests(status);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Create flat request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateMroRequestSchema))
  async createFlatRequest(@Body() dto: CreateMroRequestDto) {
    const r = await this.repo.insertFlatRequest(
      dto.itemId ?? null, dto.requestedQuantity ?? 1,
      dto.reason ?? null, dto.requestedBy ?? null, dto.priority ?? 'normal',
    );
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get flat items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('items')
  @Roles(...MRO_ROLES)
  async getFlatItems(@Query('category') category?: string) {
    const r = await this.repo.findFlatItems(category);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Create flat item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateMroItemSchema))
  async createFlatItem(@Body() dto: CreateMroItemDto) {
    const r = await this.repo.insertFlatItem(
      dto.name, dto.category ?? 'general', dto.unit ?? 'dona',
      dto.currentStock ?? 0, dto.minStock ?? 0, dto.unitCost ?? 0,
      dto.location ?? null, dto.supplier ?? null,
    );
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get flat stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  @Roles(...ALL_ROLES)
  async getFlatStats() {
    const r = await this.repo.getFlatStats();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get mro overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mro')
  @Roles(...ALL_ROLES)
  async getMroOverview() {
    const r = await this.repo.getMroOverview();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get shifts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts')
  @Roles(...ALL_ROLES)
  async getShifts() {
    const r = await this.repo.findShifts();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get all expense requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense/expense-requests/all')
  @Roles(...ALL_ROLES)
  async getAllExpenseRequests() {
    const r = await this.repo.findExpenseRequests(undefined);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get expense requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense/expense-requests')
  @Roles(...ALL_ROLES)
  async getExpenseRequests(@Query('status') status?: string) {
    const r = await this.repo.findExpenseRequests(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { requests: items, total: items.length };
  }

  @ApiOperation({ summary: 'Create expense request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('expense/expense-requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateExpenseRequestSchema))
  async createExpenseRequest(@Body() dto: CreateExpenseRequestDto) {
    const r = await this.repo.insertExpenseRequest(
      dto.title, dto.amount, dto.category ?? 'general',
      dto.description ?? null, dto.requestedBy ?? null,
    );
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get expense stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense/expense-stats')
  @Roles(...ALL_ROLES)
  async getExpenseStats() {
    const r = await this.repo.getExpenseStats();
    const raw = r.ok ? (r.data as Record<string, unknown>) : {};
    return {
      byStatus: [
        { status: 'pending',   count: Number(raw['pending'] ?? 0),   totalAmount: 0 },
        { status: 'approved',  count: Number(raw['approved'] ?? 0),  totalAmount: Number(raw['total_approved_amount'] ?? 0) },
        { status: 'submitted', count: 0, totalAmount: 0 },
      ],
      byCategory: [],
      totalRequests: Number(raw['total_requests'] ?? 0),
    };
  }

  @ApiOperation({ summary: 'Get advance payments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense/advance-payments')
  @Roles(...ALL_ROLES)
  async getAdvancePayments() {
    const r = await this.repo.findAdvancePayments();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Approve expense request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('expense-requests/:id/approve')
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(ApproveActionSchema))
  async approveExpenseRequest(@Param('id') id: string, @Body() dto: ApproveActionDto) {
    const r = await this.repo.approveExpenseRequest(id, dto.action, dto.comments ?? '');
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get gl postings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl/stock-gl-postings')
  @Roles(...FINANCE_ROLES)
  async getGlPostings(@Query('status') status?: string, @Query('type') type?: string) {
    const r = await this.repo.findGlPostings(status, type);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get gl stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl/stock-gl-postings/stats')
  @Roles(...FINANCE_ROLES)
  async getGlStats() {
    const r = await this.repo.getGlPostingStats();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get gl account mapping' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl/gl-account-mapping')
  @Roles(...FINANCE_ROLES)
  async getGlAccountMapping() {
    const r = await this.repo.findGlAccountMapping();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get vendor invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('invoice/vendor-invoices')
  @Roles(...FINANCE_ROLES)
  async getVendorInvoices(@Query('matchStatus') matchStatus?: string) {
    const r = await this.repo.findVendorInvoices(matchStatus);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get three way match stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('invoice/three-way-match/stats')
  @Roles(...FINANCE_ROLES)
  async getThreeWayMatchStats() {
    const r = await this.repo.getThreeWayMatchStats();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get three way match results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('invoice/three-way-match/results')
  @Roles(...FINANCE_ROLES)
  async getThreeWayMatchResults() {
    const r = await this.repo.findThreeWayMatchResults();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Perform three way match' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('invoice/three-way-match/:invoiceId')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(InvoiceMatchSchema))
  async performThreeWayMatch(@Param('invoiceId') invoiceId: string, @Body() dto: InvoiceMatchDto) {
    const r = await this.repo.performThreeWayMatch(invoiceId, dto.tolerancePercent ?? 5);
    return r.ok ? r.data : { ok: false };
  }
}
