/**
 * @module finance-accounting.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired, assertValidated } from '@common/assertions';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { safeInt } from '../../hr/common/db-rows';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceAccountingService } from '../application/finance-accounting.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { FinanceGlDocumentBodySchema, FinanceGlDocumentBodyDto, FinanceClosePeriodSchema, FinanceClosePeriodDto } from './dto/finance.dto';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { unwrapOrInternal } from '@common/http-result';
@ApiThrottle()
@ApiTags('Finance Accounting')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'admin')
export class FinanceAccountingController {
  private readonly logger = new Logger(FinanceAccountingController.name);

  constructor(private readonly svc: FinanceAccountingService) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    const row = await this.svc.getDashboard();
    return {
      glDocuments: { total: Number(row.gl_total) || 0, posted: Number(row.gl_posted) || 0 },
      glEntries: Number(row.gl_entries) || 0,
      periods: { open: Number(row.periods_open) || 0, closed: Number(row.periods_closed) || 0 },
      accountsReceivable: { total: Number(row.ar_total) || 0, unpaid: Number(row.ar_unpaid) || 0 },
      accountsPayable: { total: Number(row.ap_total) || 0, unpaid: Number(row.ap_unpaid) || 0 },
    };
  }

  @ApiOperation({ summary: 'Get accounts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounts')
  async getAccounts(
    @Query('type') type?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, MAX_QUERY_LIMIT) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) || 0 : 0;
    return unwrapOrInternal(await this.svc.getAccounts(type, limit, offset));
  }

  @ApiOperation({ summary: 'Get gl documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl-documents')
  async getGlDocuments(
    @Query('status') status?: string,
    @Query('documentType') documentType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    return unwrapOrInternal(await this.svc.getGlDocuments(status, documentType, startDate, endDate, limitParam, offsetParam));
  }

  @ApiOperation({ summary: 'Create gl document' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-documents')
  @UsePipes(new ZodValidationPipe(FinanceGlDocumentBodySchema))
  async createGlDocument(@Body() body: FinanceGlDocumentBodyDto) {
    const doc = await this.svc.createGlDocument(body);
    assertRequired(doc, 'GL hujjat yaratishda xatolik');
    return doc;
  }

  @ApiOperation({ summary: 'Get periods' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('periods')
  async getPeriods() {
    return unwrapOrInternal(await this.svc.getPeriods());
  }

  @ApiOperation({ summary: 'Close period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('periods/:id/close')
  @UsePipes(new ZodValidationPipe(FinanceClosePeriodSchema))
  async closePeriod(@Param('id') id: string, @Body() body: FinanceClosePeriodDto) {
    const periodId = safeInt(id, 0);
    const period = await this.svc.getPeriod(periodId);
    assertFound(period, 'Davr topilmadi');
    assertValidated((period as Record<string, unknown>).status !== 'closed', 'Davr allaqachon yopilgan');
    const closedBy = body.closedBy ? Number(body.closedBy) : null;
    return unwrapOrInternal(await this.svc.closePeriod(periodId, closedBy));
  }

  @ApiOperation({ summary: 'Get materials' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('materials')
  async getMaterials(
    @Query('warehouseId') warehouseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('moveType') moveType?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    return unwrapOrInternal(await this.svc.getMaterials(warehouseId, startDate, endDate, moveType, limitParam, offsetParam));
  }

  @ApiOperation({ summary: 'Get materials by order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('materials/by-order')
  async getMaterialsByOrder(@Query('orderId') orderId?: string) {
    if (!orderId) return [];
    return unwrapOrInternal(await this.svc.getMaterialsByOrder(orderId));
  }

  @ApiOperation({ summary: 'Get inventory valuation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-valuation')
  async getInventoryValuation() {
    const { materials, summary } = await this.svc.getInventoryValuation();
    return {
      materials,
      summary: {
        totalItems: Number(summary.totalItems) || 0,
        totalStock: Number(summary.totalStock) || 0,
        totalValue: Number(summary.totalValue) || 0,
      },
    };
  }
}
