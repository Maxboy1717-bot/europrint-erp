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
import { MmCreateFleetVehicleSchema, MmCreateFleetVehicleDto, MmCreateFuelLogSchema, MmCreateFuelLogDto } from '../dto/mm.dto';
import { notImplemented } from '@common/exceptions/not-implemented';
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

const MM_READ = ['super_admin', 'mm_manager', 'ERP_MANAGER', 'director', 'purchasing_manager'];
const MM_WRITE = ['super_admin', 'mm_manager', 'ERP_MANAGER', 'director'];

// FEATURE_FLAGGED: vendor-invoice / 3-way-match / fleet logistics endpoints
// (tracking #FX-2) - not wired to a service yet. Returning 501 instead of fake
// payloads so the InvoiceVerification & LogisticsDashboard pages can render a
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
    if (!row) throw new HttpException(`Vendor invoice #${id} topilmadi`, HttpStatus.NOT_FOUND);
    return row;
  }

  @ApiOperation({ summary: 'Approve vendor invoice' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Patch('vendor-invoices/:id/approve') @Roles(...MM_WRITE)
  async approveVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('PATCH /mm/vendor-invoices/:id/approve');
  }

  @ApiOperation({ summary: 'Match vendor invoice' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Patch('vendor-invoices/:id/match') @Roles(...MM_WRITE)
  async matchVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('PATCH /mm/vendor-invoices/:id/match');
  }

  @ApiOperation({ summary: 'Pay vendor invoice' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Post('vendor-invoices/:id/payment') @Roles(...MM_WRITE)
  async payVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('POST /mm/vendor-invoices/:id/payment');
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
    if (!row) throw new HttpException(`Vendor invoice #${invoiceId} topilmadi`, HttpStatus.NOT_FOUND);
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
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Get('fleet/deliveries') @Roles(...MM_READ)
  async getFleetDeliveries() { return notImplemented('GET /mm/fleet/deliveries'); }

  @ApiOperation({ summary: 'Update fleet delivery status' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Patch('fleet/deliveries/:id/status') @Roles(...MM_WRITE)
  async updateFleetDeliveryStatus(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('PATCH /mm/fleet/deliveries/:id/status');
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

  @ApiOperation({ summary: 'Get material suppliers' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Get('materials/:id/suppliers') @Roles(...MM_READ)
  async getMaterialSuppliers(@Param('id') _id: string) {
    return notImplemented('GET /mm/materials/:id/suppliers');
  }

  @ApiOperation({ summary: 'Create 3-way match (POST mirror)' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Post('3way-match/:invoiceId') @Roles(...MM_WRITE)
  async post3wayMatch(@Param('invoiceId') _invoiceId: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('POST /mm/3way-match/:invoiceId');
  }

  @ApiOperation({ summary: 'Create fleet delivery' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Post('fleet/deliveries') @Roles(...MM_WRITE)
  async createFleetDelivery(@Body() _body: Record<string, unknown>) {
    return notImplemented('POST /mm/fleet/deliveries');
  }

  @ApiOperation({ summary: 'Match vendor invoice (POST mirror)' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-2' })
  @Post('vendor-invoices/:id/match') @Roles(...MM_WRITE)
  async postMatchVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return notImplemented('POST /mm/vendor-invoices/:id/match');
  }

  @ApiOperation({ summary: 'Patch pay vendor invoice' })
  @ApiResponse({ status: 501, description: 'Not implemented — needs fi_payments table' })
  @Patch('vendor-invoices/:id/payment') @Roles(...MM_WRITE)
  async patchPayVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException("To'lov hali amalga oshirilmagan — fi_payments jadval qurilgach ishlaydi", HttpStatus.NOT_IMPLEMENTED);
  }

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
        { message: 'Noto\'g\'ri kiritilgan ma\'lumotlar', errors: parsed.error.flatten().fieldErrors },
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
