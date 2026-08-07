/**
 * @module mm-dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  Logger,
  Query,
  InternalServerErrorException, UsePipes, HttpException, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MmDashboardService } from '../application/mm-dashboard.service';
import { MmVendorRatingService } from '../application/mm-vendor-rating.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';
import { MmCreateFleetVehicleSchema, MmCreateFleetVehicleDto, MmCreateFuelLogSchema, MmCreateFuelLogDto, MmCreateFleetDeliverySchema, MmCreateFleetDeliveryDto, MmUpdateFleetDeliveryStatusSchema, MmUpdateFleetDeliveryStatusDto } from '../dto/mm.dto';
import { MmVendorInvoiceService } from '../application/mm-vendor-invoice.service';
import {
  MmApproveVendorInvoiceSchema, MmApproveVendorInvoiceDto,
  MmMatchVendorInvoiceSchema, MmMatchVendorInvoiceDto,
  MmThreeWayMatchSchema, MmThreeWayMatchDto,
  MmVendorInvoicePaymentSchema, MmVendorInvoicePaymentDto,
} from './dto/mm-vendor-invoice.dto';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Zod schema for POST /mm/vendor-performance
const VendorPerformanceSchema = z.object({
  vendor_id: z.number().int().positive({ message: 'vendor_id musbat butun son bo\'lishi kerak' }),
  quality:   z.number().min(0).max(100, { message: 'quality 0-100 orasida bo\'lishi kerak' }),
  delivery:  z.number().min(0).max(100, { message: 'delivery 0-100 orasida bo\'lishi kerak' }),
  price:     z.number().min(0).max(100, { message: 'price 0-100 orasida bo\'lishi kerak' }),
  document:  z.number().min(0).max(100, { message: 'document 0-100 orasida bo\'lishi kerak' }),
  notes:     z.string().max(1000).optional(),
});
type VendorPerformanceDto = z.infer<typeof VendorPerformanceSchema>;

const MM_READ = ['super_admin', 'mm_manager', 'director', 'purchasing_manager'];
const MM_WRITE = ['super_admin', 'mm_manager', 'director'];
/** Hisob-fakturani tasdiqlash — MM + moliya menejeri. */
const MM_INVOICE_APPROVE = ['super_admin', 'director', 'mm_manager', 'finance_manager'];
/** PUL chiqimi — eng tor doira (konservativ: egasi boshqacha qaror qilmaguncha). */
const MM_PAYMENT = ['super_admin', 'director', 'finance_manager'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Mm Dashboard')
@ApiBearerAuth()
@Controller('mm')
export class MmDashboardController {
  private readonly logger = new Logger(MmDashboardController.name);

  constructor(
    private readonly svc: MmDashboardService,
    private readonly ratingService: MmVendorRatingService,
    private readonly invoiceSvc: MmVendorInvoiceService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  @Roles(...MM_READ)
  async getDashboard() {
    this.logger.log('GET mm dashboard');
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @ApiOperation({ summary: 'Get vendor ratings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-ratings')
  @Roles(...MM_READ)
  async getVendorRatings() {
    this.logger.log('GET vendor ratings');
    return unwrapOrThrow(await this.svc.getVendorRatings());
  }

  @ApiOperation({ summary: 'Get mrp results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mrp-results')
  @Roles(...MM_READ)
  async getMrpResults(@Query('materialId') materialId?: string) {
    this.logger.log('GET MRP results');
    return unwrapOrThrow(await this.svc.getMrpResults(materialId ? safeInt(materialId, 0) : undefined));
  }

  @ApiOperation({ summary: 'Run mrp' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('mrp-run')
  @UseInterceptors(AuditInterceptor)
  @Roles(...MM_WRITE)
  async runMrp() {
    this.logger.log('POST run MRP');
    return unwrapOrThrow(await this.svc.runMrp());
  }

  @ApiOperation({ summary: 'Get fleet vehicles' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/vehicles')
  @Roles(...MM_READ)
  async getFleetVehicles() {
    this.logger.log('GET fleet vehicles');
    return unwrapOrThrow(await this.svc.getFleetVehicles());
  }

  @ApiOperation({ summary: 'Create fleet vehicle' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('fleet/vehicles')
  @UsePipes(new ZodValidationPipe(MmCreateFleetVehicleSchema))
  @Roles(...MM_WRITE)
  async createFleetVehicle(@Body() body: MmCreateFleetVehicleDto) {
    this.logger.log('POST fleet vehicle');
    return unwrapOrThrow(await this.svc.createFleetVehicle(body));
  }

  @ApiOperation({ summary: 'Get fuel logs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/fuel-logs')
  @Roles(...MM_READ)
  async getFuelLogs(@Query('vehicleId') vehicleId?: string) {
    this.logger.log('GET fuel logs');
    return unwrapOrThrow(await this.svc.getFuelLogs(vehicleId ? safeInt(vehicleId, 0) : undefined));
  }

  @ApiOperation({ summary: 'Create fuel log' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('fleet/fuel-logs')
  @UsePipes(new ZodValidationPipe(MmCreateFuelLogSchema))
  @Roles(...MM_WRITE)
  async createFuelLog(@Body() body: MmCreateFuelLogDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST fuel log');
    return unwrapOrThrow(await this.svc.createFuelLog(body, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Get supplier performance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('supplier-performance')
  @Roles(...MM_READ)
  async getSupplierPerformance() {
    this.logger.log('GET supplier performance');
    return unwrapOrThrow(await this.svc.getSupplierPerformance());
  }

  @ApiOperation({ summary: 'Get price history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('materials/:id/price-history')
  @Roles(...MM_READ)
  async getPriceHistory(@Param('id') id: string) {
    this.logger.log(`GET price history for material ${id}`);
    return unwrapOrThrow(await this.svc.getPriceHistory(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get vendor invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-invoices') @Roles(...MM_READ)
  async getVendorInvoices() {
    this.logger.log('GET vendor invoices');
    return unwrapOrThrow(await this.svc.getVendorInvoices());
  }

  @ApiOperation({ summary: 'Get vendor invoice by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vendor-invoices/:id') @Roles(...MM_READ)
  async getVendorInvoiceById(@Param('id') id: string) {
    const row = unwrapOrThrow(await this.svc.getVendorInvoiceById(safeInt(id, 0)));
    if (!row) throw new HttpException(await this.i18n.t('errors.vendorInvoiceNotFoundWithId', { args: { id } }), HttpStatus.NOT_FOUND);
    return row;
  }

  @ApiOperation({ summary: 'Approve vendor invoice (SoD: creator cannot approve their own invoice)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'SoD violation' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Invoice not in an approvable status' })
  @Patch('vendor-invoices/:id/approve')
  @UseInterceptors(AuditInterceptor)
  @UsePipes(new ZodValidationPipe(MmApproveVendorInvoiceSchema))
  @Roles(...MM_INVOICE_APPROVE)
  async approveVendorInvoice(
    @Param('id') id: string,
    @Body() body: MmApproveVendorInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`PATCH approve vendor invoice ${id}`);
    return unwrapOrThrow(
      await this.invoiceSvc.approveInvoice(safeInt(id, 0), user?.id ?? null, body?.notes ?? null),
    );
  }

  @ApiOperation({ summary: '2-way match: purchase order ↔ vendor invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'No purchase order linked to the invoice' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vendor-invoices/:id/match')
  @UseInterceptors(AuditInterceptor)
  @UsePipes(new ZodValidationPipe(MmMatchVendorInvoiceSchema))
  @Roles(...MM_WRITE)
  async matchVendorInvoice(@Param('id') id: string, @Body() body: MmMatchVendorInvoiceDto) {
    this.logger.log(`PATCH match vendor invoice ${id}`);
    return unwrapOrThrow(await this.invoiceSvc.matchInvoiceToPo(safeInt(id, 0), body ?? {}));
  }

  @ApiOperation({ summary: 'Record a payment against a vendor invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Overpayment / currency mismatch' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Duplicate reference or already fully paid' })
  @ApiResponse({ status: 422, description: 'Invoice is not approved' })
  @Post('vendor-invoices/:id/payment')
  @UseInterceptors(AuditInterceptor)
  @UsePipes(new ZodValidationPipe(MmVendorInvoicePaymentSchema))
  @Roles(...MM_PAYMENT)
  async payVendorInvoice(
    @Param('id') id: string,
    @Body() body: MmVendorInvoicePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`POST payment for vendor invoice ${id}`);
    return unwrapOrThrow(await this.invoiceSvc.recordPayment(safeInt(id, 0), body, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Get three way match' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('three-way-match') @Roles(...MM_READ)
  async getThreeWayMatch() {
    this.logger.log('GET three-way match');
    return unwrapOrThrow(await this.svc.getThreeWayMatch());
  }

  @ApiOperation({ summary: 'Get 3-way match by invoice id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('3way-match/:invoiceId') @Roles(...MM_READ)
  async get3wayMatch(@Param('invoiceId') invoiceId: string) {
    const row = unwrapOrThrow(await this.svc.getVendorInvoiceById(safeInt(invoiceId, 0)));
    if (!row) throw new HttpException(await this.i18n.t('errors.vendorInvoiceNotFoundWithId', { args: { id: invoiceId } }), HttpStatus.NOT_FOUND);
    return row;
  }

  @ApiOperation({ summary: 'Get fleet maintenance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/maintenance') @Roles(...MM_READ)
  async getFleetMaintenance() {
    this.logger.log('GET fleet maintenance');
    return unwrapOrThrow(await this.svc.getFleetMaintenance());
  }

  @ApiOperation({ summary: 'Get fleet deliveries' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/deliveries') @Roles(...MM_READ)
  async getFleetDeliveries() {
    this.logger.log('GET fleet deliveries');
    return unwrapOrThrow(await this.svc.getFleetDeliveries());
  }

  @ApiOperation({ summary: 'Update fleet delivery status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('fleet/deliveries/:id/status')
  @UsePipes(new ZodValidationPipe(MmUpdateFleetDeliveryStatusSchema))
  @Roles(...MM_WRITE)
  async updateFleetDeliveryStatus(@Param('id') id: string, @Body() body: MmUpdateFleetDeliveryStatusDto) {
    this.logger.log(`PATCH fleet delivery ${id} status -> ${body.status}`);
    const row = unwrapOrThrow(await this.svc.updateFleetDeliveryStatus(safeInt(id, 0), body.status));
    if (!row) throw new HttpException(await this.i18n.t('errors.deliveryNotFoundWithId', { args: { id } }), HttpStatus.NOT_FOUND);
    return row;
  }

  @ApiOperation({ summary: 'Get vehicle locations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vehicles/locations') @Roles(...MM_READ)
  async getVehicleLocations() {
    this.logger.log('GET vehicle locations');
    return unwrapOrThrow(await this.svc.getVehicleLocations());
  }

  @ApiOperation({ summary: 'Get driver expenses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('driver/expenses') @Roles(...MM_READ)
  async getDriverExpenses() {
    this.logger.log('GET driver expenses');
    return unwrapOrThrow(await this.svc.getDriverExpenses());
  }

  @ApiOperation({ summary: 'Get material suppliers (purchase history + price list)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @Get('materials/:id/suppliers') @Roles(...MM_READ)
  async getMaterialSuppliers(@Param('id') id: string) {
    this.logger.log(`GET suppliers for material ${id}`);
    return unwrapOrThrow(await this.invoiceSvc.getMaterialSuppliers(safeInt(id, 0)));
  }

  @ApiOperation({ summary: '3-way match: purchase order ↔ goods receipt ↔ invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Invoice has no purchase order / goods receipt' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('3way-match/:invoiceId')
  @UseInterceptors(AuditInterceptor)
  @UsePipes(new ZodValidationPipe(MmThreeWayMatchSchema))
  @Roles(...MM_WRITE)
  async post3wayMatch(
    @Param('invoiceId') invoiceId: string,
    @Body() body: MmThreeWayMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`POST 3-way match for invoice ${invoiceId}`);
    return unwrapOrThrow(
      await this.invoiceSvc.runThreeWayMatch(safeInt(invoiceId, 0), body ?? {}, user?.id ?? null),
    );
  }

  @ApiOperation({ summary: 'Create fleet delivery' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('fleet/deliveries')
  @UsePipes(new ZodValidationPipe(MmCreateFleetDeliverySchema))
  @Roles(...MM_WRITE)
  async createFleetDelivery(@Body() body: MmCreateFleetDeliveryDto) {
    this.logger.log('POST fleet delivery');
    return unwrapOrThrow(await this.svc.createFleetDelivery(body));
  }

  // Q-46 (dublikat marshrutlar o'chirildi, 2026-08-07):
  //   · `POST   /mm/vendor-invoices/:id/match`   — `PATCH .../match` ning aynan nusxasi
  //     edi (bir xil yo'l, bir xil body, bir xil 501). FE (LogisticsDashboard.tsx:97)
  //     PATCH ishlatadi → PATCH qoldi, POST o'chirildi.
  //   · `PATCH  /mm/vendor-invoices/:id/payment` — `POST .../payment` ning nusxasi
  //     edi ("fi_payments kerak" deb 501 qaytarardi). To'lov = YANGI resurs yaratish,
  //     shuning uchun POST kanonik; PATCH o'chirildi. Haqiqiy jadval `invoice_payments`
  //     (jonli DB da mavjud) — `fi_payments` hech qachon bo'lmagan.

  @ApiOperation({ summary: 'Record vendor performance score (4-factor formula: quality 40% + delivery 30% + price 20% + document 10%)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post('vendor-performance')
  @Roles(...MM_WRITE)
  async createVendorPerformance(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    // 1. Validate input with Zod
    const parsed = VendorPerformanceSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        { message: await this.i18n.t('validation.invalidInputData'), errors: parsed.error.flatten().fieldErrors },
        HttpStatus.BAD_REQUEST,
      );
    }
    const dto: VendorPerformanceDto = parsed.data;

    // 2. Compute weighted score via pure service (no side effects)
    const ratingResult = this.ratingService.computeRating({
      quality:  dto.quality,
      delivery: dto.delivery,
      price:    dto.price,
      document: dto.document,
    });
    if (!ratingResult.ok) {
      throw new HttpException(
        { message: ratingResult.error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
    const { score, grade, breakdown } = ratingResult.data;

    // 3. Persist to mm_vendor_ratings
    // Columns: vendor_id, quality_score, delivery_score, price_score, notes, rated_at, rater_id
    // document_score has no DB column — stored in notes JSON alongside grade + breakdown
    const notesJson = JSON.stringify({
      grade,
      document_score: dto.document,
      breakdown,
      user_notes: dto.notes ?? null,
    });

    const r = await db.execute(sql`
      INSERT INTO mm_vendor_ratings
        (vendor_id, quality_score, delivery_score, price_score, notes, rated_at, rater_id)
      VALUES (
        ${dto.vendor_id}::int,
        ${dto.quality}::numeric,
        ${dto.delivery}::numeric,
        ${dto.price}::numeric,
        ${notesJson},
        NOW(),
        ${user?.id ?? null}::int
      )
      RETURNING id, vendor_id, quality_score, delivery_score, price_score, notes, rated_at
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? null;

    this.logger.log(`POST vendor-performance: vendor=${dto.vendor_id} score=${score} grade=${grade} by user=${user?.id}`);
    return {
      message: 'Sotuvchi unumdorligi saqlandi',
      data: { ...row, computed_score: score, grade },
    };
  }
}
