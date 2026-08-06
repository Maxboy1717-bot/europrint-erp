/**
 * @module sd-quotations.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Put, Query, Res, Logger, InternalServerErrorException,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  SdCreateQuotationSchema, SdCreateQuotationDto,
  SdCreateContractSchema, SdCreateContractDto,
  SdCalculatePriceSchema, SdCalculatePriceDto,
  SdRollParamsSchema, SdRollParamsDto,
} from './dto/sd-quotations.dto';
import { unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdQuotationsService } from '../application/sd-quotations.service';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { FastifyReply } from 'fastify';
import { SdQuotationPdfService } from '../invoices/sd-quotation-pdf.service';

// 'manager' — SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
const SD_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin'];

type Body_ = Record<string, unknown>;

// 06-sd#147 — per-order gofra layer count for a quotation line. Standard corrugated wall
// counts: 2 (single-face), 3 (single-wall), 5 (double-wall), 7 (triple-wall). Coerced
// ('3'/3 both parse); matches the DB CHECK on sd_quotation_items.layer_count.
const SdItemLayerCountSchema = z.object({
  layerCount: z.coerce.number().int().refine((v) => [2, 3, 5, 7].includes(v), {
    message: "layerCount 2, 3, 5 yoki 7 bo'lishi kerak",
  }),
});

/**
 * SDSettings price-settings PUT body — a PARTIAL set of camelCase price fields
 * (only the ones the user changed). All optional, non-negative numbers; unknown
 * keys are stripped. Maps to the singleton `sd_price_formulas` row (id=1).
 */
const SdPriceSettingsSchema = z.object({
  paperBPrice: z.number().nonnegative().optional(),
  paperCPrice: z.number().nonnegative().optional(),
  paperBcPrice: z.number().nonnegative().optional(),
  paperEPrice: z.number().nonnegative().optional(),
  print1ColorPrice: z.number().nonnegative().optional(),
  print2ColorPrice: z.number().nonnegative().optional(),
  print4ColorPrice: z.number().nonnegative().optional(),
  plateCostPerColor: z.number().nonnegative().optional(),
  dieCostNew: z.number().nonnegative().optional(),
  laminationPrice: z.number().nonnegative().optional(),
  embossingPrice: z.number().nonnegative().optional(),
  kashirovkaPrice: z.number().nonnegative().optional(),
  perforationPrice: z.number().nonnegative().optional(),
  deliveryBaseCost: z.number().nonnegative().optional(),
  storageFreedays: z.number().int().nonnegative().optional(),
  storageDailyRate: z.number().nonnegative().optional(),
  defaultMarkupPercent: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
});

// 06-sd#107 — per-order load capacity (kg) for a quotation line. Positive, coerced
// ('12.5'/12.5 both parse). Drives the non-blocking flute/layer recommendation.
const SdItemLoadCapacitySchema = z.object({
  loadCapacityKg: z.coerce.number().positive().max(100000),
});

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SD_ROLES)
@ApiTags('Sd Quotations')
@ApiBearerAuth()
@Controller('sd')
export class SdQuotationsController {
  private readonly logger = new Logger(SdQuotationsController.name);
  constructor(
    private readonly svc: SdQuotationsService,
    private readonly pdfSvc: SdQuotationPdfService,
  ) {}

  @ApiOperation({ summary: 'List quotations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quotations')
  async listQuotations(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const r = await this.svc.listQuotations(
      customerId ? safeInt(customerId, 0) : null, status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Create quotation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('quotations') @UsePipes(new ZodValidationPipe(SdCreateQuotationSchema))
  async createQuotation(@Body() body: SdCreateQuotationDto) { return unwrapOrThrow(await this.svc.createQuotation(body)); }

  @ApiOperation({ summary: 'Kotirovka (KP) PDF' })
  @ApiResponse({ status: 200, description: 'PDF fayl' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('quotations/:id/pdf')
  async downloadQuotationPdf(@Param('id') id: string, @Res() res: FastifyReply) {
    // unwrapOrThrow: NOT_FOUND -> 404 (throwFromError mapping), otherwise narrows to the data.
    const data = unwrapOrThrow(await this.svc.getQuotationPdfData(id));
    const pdfR = await this.pdfSvc.generateQuotationPdf(data);
    if (!pdfR.ok) {
      this.logger.error(`KP PDF generatsiya xatoligi (id=${id}): ${pdfR.error.message}`);
      throw new InternalServerErrorException(pdfR.error.message);
    }
    const buffer = pdfR.data;
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="kp-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }

  // NOTE: GET /sd/contracts olib tashlandi — SdContractsController ushlab turadi.

  @ApiOperation({ summary: 'Create contract' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('contracts') @UsePipes(new ZodValidationPipe(SdCreateContractSchema))
  async createContract(@Body() body: SdCreateContractDto) { return unwrapOrThrow(await this.svc.createContract(body)); }

  @ApiOperation({ summary: 'Get price settings (singleton row, camelCase)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('price-formulas')
  async getPriceFormulas() {
    return unwrapOrThrow(await this.svc.getPriceSettings());
  }

  @ApiOperation({ summary: 'Calculate price' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('calculate-price') @UsePipes(new ZodValidationPipe(SdCalculatePriceSchema))
  async calculatePrice(@Body() body: SdCalculatePriceDto, @CurrentUser() user: AuthenticatedUser) {
    // EP-SD-037: pass carton dims/colours/qty to the real price engine (reads sd_price_formulas).
    // EP-SD-043 (vision 06-sd #43): the viewer's role decides whether costPrice/margin leave the
    // service — sales_manager/SALES get the customer price only; director+ see the full breakdown.
    const r = await this.svc.calculatePrice({
      productType: body.productType,
      paperType: body.paperType,
      lengthMm: Number(body.lengthMm ?? 0),
      widthMm: Number(body.widthMm ?? 0),
      heightMm: Number(body.heightMm ?? 0),
      thicknessMm: body.thicknessMm != null ? Number(body.thicknessMm) : undefined,
      printColors: Number(body.printColors ?? 0),
      printSides: Number(body.printSides ?? 1),
      quantity: Number(body.quantity ?? 1),
      isNewDie: body.isNewDie === true,
      kashirovka: body.kashirovka === true,
      lamination: body.lamination === true,
      embossing: body.embossing === true,
      perforation: body.perforation === true,
      advancePercent: body.advancePercent != null ? Number(body.advancePercent) : undefined,
    }, user?.role);
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Get kpi team' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kpi/team')
  async getKpiTeam(
    @Query('period') period?: string,
    @Query('year')   year?: string,
    @Query('month')  month?: string,
  ) {
    // FE sends ?year=YYYY&month=M separately; build a "YYYY-MM" period string so the
    // service can parse it. A pre-composed ?period=YYYY-MM is also accepted as-is.
    const resolvedPeriod = period
      ?? (year && month ? `${year}-${month.padStart(2, '0')}` : null);
    return unwrapOrThrow(await this.svc.getKpiTeam(resolvedPeriod));
  }

  @ApiOperation({ summary: 'Get kpi targets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kpi-targets')
  async getKpiTargets(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getKpiTargets(managerId ? safeInt(managerId, 0) : null));
  }

  @ApiOperation({ summary: 'Get funnel report' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/funnel')
  async getFunnelReport(@Query('period') period?: string) { return unwrapOrThrow(await this.svc.getFunnelReport(period ?? null)); }

  @ApiOperation({ summary: 'Convert to order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('quotations/:id/convert-to-order') @HttpCode(HttpStatus.OK) @UseInterceptors(AuditInterceptor)
  async convertToOrder(@Param('id') id: string) { return unwrapOrThrow(await this.svc.convertToOrder(id)); }

  @ApiOperation({ summary: 'Convert quotation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('quotations/:id/convert') @HttpCode(HttpStatus.OK) @UseInterceptors(AuditInterceptor)
  async convertQuotation(@Param('id') id: string) { return unwrapOrThrow(await this.svc.convertToOrder(id)); }

  // ── Status-transition routes (delegated to SdQuotationsService) ──────────────

  @ApiOperation({ summary: 'Send quotation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('quotations/:id/send')
  async sendQuotation(@Param('id') id: string) { return unwrapOrThrow(await this.svc.sendQuotation(id)); }

  @ApiOperation({ summary: 'Put send quotation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('quotations/:id/send')
  async putSendQuotation(@Param('id') id: string) { return unwrapOrThrow(await this.svc.sendQuotation(id)); }

  @ApiOperation({ summary: 'Approve quotation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quotations/:id/approve')
  async approveQuotation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) { return unwrapOrThrow(await this.svc.approveQuotation(id, user.id)); }

  @ApiOperation({ summary: 'Put approve quotation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('quotations/:id/approve')
  async putApproveQuotation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) { return unwrapOrThrow(await this.svc.approveQuotation(id, user.id)); }

  @ApiOperation({ summary: 'Update quotation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.updateQuotation(id, body)); }

  @ApiOperation({ summary: 'Set quotation line load capacity (kg) + flute/layer rec (06-sd#107)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quotation-items/:id/load-capacity')
  @UsePipes(new ZodValidationPipe(SdItemLoadCapacitySchema))
  async setItemLoadCapacity(@Param('id') id: string, @Body() body: { loadCapacityKg: number }) {
    return unwrapOrThrow(await this.svc.setItemLoadCapacity(id, body.loadCapacityKg));
  }

  @ApiOperation({ summary: 'Delete quotation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('quotations/:id')
  async deleteQuotation(@Param('id') id: string) { return unwrapOrThrow(await this.svc.deleteQuotation(id)); }

  @ApiOperation({ summary: 'Set quotation line gofra layer count (2/3/5-sloy) + non-blocking load hint (06-sd#147)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quotation-items/:id/layer-count')
  @UsePipes(new ZodValidationPipe(SdItemLayerCountSchema))
  async setItemLayerCount(@Param('id') id: string, @Body() body: { layerCount: number }) {
    return unwrapOrThrow(await this.svc.setItemLayerCount(id, body.layerCount));
  }

  // NOTE: PATCH /sd/contracts/:id/sign olib tashlandi — SdContractsController.sign() ushlab turadi.

  @ApiOperation({ summary: 'Update kpi target' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('kpi-targets/:id')
  async updateKpiTarget(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.updateKpiTarget(id, body)); }

  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.cancelOrder(id, body)); }

  @ApiOperation({ summary: 'Post cancel order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('orders/:id/cancel')
  async postCancelOrder(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.cancelOrder(id, body)); }

  @ApiOperation({ summary: 'Mark payment paid' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('payments/:id/mark-paid')
  async markPaymentPaid(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.markPaymentPaid(id, body)); }

  @ApiOperation({ summary: 'Put mark payment paid' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('payments/:id/mark-paid')
  async putMarkPaymentPaid(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.markPaymentPaid(id, body)); }

  @ApiOperation({ summary: 'Put sign contract' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('contracts/:id/sign')
  async putSignContract(@Param('id') id: string, @Body() body: Body_) { return unwrapOrThrow(await this.svc.signContract(id, body)); }

  @ApiOperation({ summary: 'Put price formulas' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('price-formulas')
  @UsePipes(new ZodValidationPipe(SdPriceSettingsSchema))
  async putPriceFormulas(@Body() body: Body_) { return unwrapOrThrow(await this.svc.upsertPriceFormula(body)); }

  @ApiOperation({ summary: 'Set self-adhesive roll parameters on a quotation line (EP-SD-118)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quotation-items/:itemId/roll-params')
  @UsePipes(new ZodValidationPipe(SdRollParamsSchema))
  async setItemRollParams(@Param('itemId') itemId: string, @Body() body: SdRollParamsDto) {
    return unwrapOrThrow(await this.svc.setItemRollParams(safeInt(itemId, 0), body));
  }
}
