/**
 * @module sd-quotations.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { safeInt } from '../../hr/common/db-rows';import {
Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  SdCreateQuotationSchema, SdCreateQuotationDto,
  SdCreateContractSchema, SdCreateContractDto,
  SdCalculatePriceSchema, SdCalculatePriceDto,
} from './dto/sd-quotations.dto';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdQuotationsService } from '../application/sd-quotations.service';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SD_ROLES)
@Controller('sd')
export class SdQuotationsController {
  private readonly logger = new Logger(SdQuotationsController.name);

  constructor(private readonly svc: SdQuotationsService) {}

  @Get('quotations')
  async listQuotations(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListQuotations = await this.svc.listQuotations(
      customerId ? safeInt(customerId, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListQuotations);
    return _rListQuotations.data;
  }

  @Post('quotations')
  @UsePipes(new ZodValidationPipe(SdCreateQuotationSchema))
  async createQuotation(@Body() body: SdCreateQuotationDto) {
    return unwrapOrThrow(await this.svc.createQuotation(body));
  }

  // NOTE: GET /sd/contracts olib tashlandi — SdContractsController ushlab turadi.

  @Post('contracts')
  @UsePipes(new ZodValidationPipe(SdCreateContractSchema))
  async createContract(@Body() body: SdCreateContractDto) {
    return unwrapOrThrow(await this.svc.createContract(body));
  }

  @Get('price-formulas')
  async listPriceFormulas(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listPriceFormulas(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Post('calculate-price')
  @UsePipes(new ZodValidationPipe(SdCalculatePriceSchema))
  async calculatePrice(@Body() body: SdCalculatePriceDto) {
    const _rCalculatePrice = await this.svc.calculatePrice(
      safeInt(body.product_id, 0),
      safeInt(body.quantity, 1),
      body.formula_id ? safeInt(body.formula_id, 0) : null,
    );
    assertOk(_rCalculatePrice);
    return _rCalculatePrice.data;
  }

  @Get('kpi/team')
  async getKpiTeam(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getKpiTeam(period ?? null));
  }

  @Get('kpi-targets')
  async getKpiTargets(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getKpiTargets(managerId ? safeInt(managerId, 0) : null));
  }

  @Get('reports/funnel')
  async getFunnelReport(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getFunnelReport(period ?? null));
  }

  @Post('quotations/:id/convert-to-order')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  async convertToOrder(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.convertToOrder(id));
  }

  @Post('quotations/:id/convert')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  async convertQuotation(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.convertToOrder(id));
  }

  @Post('quotations/:id/send')
  async sendQuotation(@Param('id') id: string) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations SET status = 'sent', updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi`);
    this.logger.log(`Quotation ${id} sent — email delivery should be queued separately`);
    return { id, sent: true, status: 'sent', updated_at: r.rows[0]['updated_at'] };
  }

  @Patch('quotations/:id/approve')
  async approveQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations SET status = 'approved', updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi`);
    return { id, approved: true, status: 'approved', updated_at: r.rows[0]['updated_at'] };
  }

  @Patch('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const allowed: Record<string, unknown> = {};
    for (const key of ['title', 'total_amount', 'currency', 'valid_until', 'notes', 'status', 'items']) {
      if (key in body) allowed[key] = body[key];
    }
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations
      SET
        title        = COALESCE(${allowed['title'] ?? null}, title),
        total_amount = COALESCE(${allowed['total_amount'] ?? null}, total_amount),
        currency     = COALESCE(${allowed['currency'] ?? null}, currency),
        valid_until  = COALESCE(${allowed['valid_until'] ?? null}, valid_until),
        notes        = COALESCE(${allowed['notes'] ?? null}, notes),
        status       = COALESCE(${allowed['status'] ?? null}, status),
        items        = COALESCE(${allowed['items'] ? JSON.stringify(allowed['items']) : null}, items),
        updated_at   = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi`);
    return { data: r.rows[0] };
  }

  // NOTE: PATCH /sd/contracts/:id/sign olib tashlandi — SdContractsController.sign() ushlab turadi.

  @Patch('kpi-targets/:id')
  async updateKpiTarget(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_kpi_targets
      SET
        target_value = COALESCE(${body['target_value'] ?? null}, target_value),
        period       = COALESCE(${body['period'] ?? null}, period),
        updated_at   = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    if (!r.rows[0]) throw new NotFoundException(`KPI target ${id} topilmadi`);
    return { data: r.rows[0] };
  }

  @Patch('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sales_orders
      SET status = 'cancelled', cancel_reason = ${body['reason'] ?? null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Order ${id} topilmadi`);
    return { id, cancelled: true, status: 'cancelled', updated_at: r.rows[0]['updated_at'] };
  }

  @Post('orders/:id/cancel')
  async postCancelOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sales_orders
      SET status = 'cancelled', cancel_reason = ${body['reason'] ?? null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Order ${id} topilmadi`);
    return { id, cancelled: true, status: 'cancelled', updated_at: r.rows[0]['updated_at'] };
  }

  @Patch('payments/:id/mark-paid')
  async markPaymentPaid(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE fi_payments
      SET status = 'paid', payment_date = COALESCE(${body['payment_date'] ?? null}, payment_date), updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Payment ${id} topilmadi`);
    return { id, paid: true, status: 'paid', updated_at: r.rows[0]['updated_at'] };
  }

  @Put('payments/:id/mark-paid')
  async putMarkPaymentPaid(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE fi_payments
      SET status = 'paid', payment_date = COALESCE(${body['payment_date'] ?? null}, payment_date), updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Payment ${id} topilmadi`);
    return { id, paid: true, status: 'paid', updated_at: r.rows[0]['updated_at'] };
  }

  @Put('contracts/:id/sign')
  async putSignContract(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_contracts
      SET status = 'signed', signature_data = ${body['signature_data'] ? JSON.stringify(body['signature_data']) : null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Contract ${id} topilmadi`);
    return { id, signed: true, status: 'signed', updated_at: r.rows[0]['updated_at'] };
  }

  @Put('price-formulas')
  async putPriceFormulas(@Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_price_formulas
      SET
        name        = COALESCE(${body['name'] ?? null}, name),
        formula     = COALESCE(${body['formula'] ?? null}, formula),
        description = COALESCE(${body['description'] ?? null}, description),
        updated_at  = NOW()
      WHERE id = ${body['id'] ?? null}
      RETURNING *
    `);
    return { updated: true, data: r.rows[0] ?? null };
  }

  @Delete('quotations/:id')
  async deleteQuotation(@Param('id') id: string) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations SET deleted_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, deleted_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi yoki allaqachon o'chirilgan`);
    return { deleted: true, id, deleted_at: r.rows[0]['deleted_at'] };
  }

  @Put('quotations/:id/approve')
  async putApproveQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations SET status = 'approved', updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi`);
    return { id, approved: true, status: 'approved', updated_at: r.rows[0]['updated_at'] };
  }

  @Put('quotations/:id/send')
  async putSendQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const r = await runQuery<Record<string, unknown>>(sql`
      UPDATE sd_quotations SET status = 'sent', updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, status, updated_at
    `);
    if (!r.rows[0]) throw new NotFoundException(`Quotation ${id} topilmadi`);
    this.logger.log(`Quotation ${id} sent — email delivery should be queued separately`);
    return { id, sent: true, status: 'sent', updated_at: r.rows[0]['updated_at'] };
  }
}
