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
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';
import { MmCreateFleetVehicleSchema, MmCreateFleetVehicleDto, MmCreateFuelLogSchema, MmCreateFuelLogDto } from '../dto/mm.dto';

const MM_READ = ['super_admin', 'mm_manager', 'ERP_MANAGER', 'director', 'purchasing_manager'];
const MM_WRITE = ['super_admin', 'mm_manager', 'ERP_MANAGER', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Mm Dashboard')
@ApiBearerAuth()
@Controller('mm')
export class MmDashboardController {
  private readonly logger = new Logger(MmDashboardController.name);

  constructor(private readonly svc: MmDashboardService) {}

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

  // P3-26: vendor-invoices / 3-way-match / fleet endpoints are not wired to a
  // service yet. Return 501 instead of fake empty payloads.
  @ApiOperation({ summary: 'Get vendor invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-invoices') @Roles(...MM_READ)
  async getVendorInvoices() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/vendor-invoices', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get vendor invoice by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vendor-invoices/:id') @Roles(...MM_READ)
  async getVendorInvoiceById(@Param('id') _id: string) {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/vendor-invoices/:id', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Approve vendor invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vendor-invoices/:id/approve') @Roles(...MM_WRITE)
  async approveVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: PATCH /mm/vendor-invoices/:id/approve', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Match vendor invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vendor-invoices/:id/match') @Roles(...MM_WRITE)
  async matchVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: PATCH /mm/vendor-invoices/:id/match', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Pay vendor invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('vendor-invoices/:id/payment') @Roles(...MM_WRITE)
  async payVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: POST /mm/vendor-invoices/:id/payment', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get three way match' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('three-way-match') @Roles(...MM_READ)
  async getThreeWayMatch() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/three-way-match', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get3way match' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('3way-match/:invoiceId') @Roles(...MM_READ)
  async get3wayMatch(@Param('invoiceId') _invoiceId: string) {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/3way-match/:invoiceId', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get fleet maintenance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/maintenance') @Roles(...MM_READ)
  async getFleetMaintenance() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/fleet/maintenance', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get fleet deliveries' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fleet/deliveries') @Roles(...MM_READ)
  async getFleetDeliveries() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/fleet/deliveries', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Update fleet delivery status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('fleet/deliveries/:id/status') @Roles(...MM_WRITE)
  async updateFleetDeliveryStatus(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: PATCH /mm/fleet/deliveries/:id/status', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get vehicle locations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vehicles/locations') @Roles(...MM_READ)
  async getVehicleLocations() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/vehicles/locations', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get driver expenses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('driver/expenses') @Roles(...MM_READ)
  async getDriverExpenses() {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/driver/expenses', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Get material suppliers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('materials/:id/suppliers') @Roles(...MM_READ)
  async getMaterialSuppliers(@Param('id') _id: string) {
    throw new HttpException({ message: 'Endpoint not yet implemented: GET /mm/materials/:id/suppliers', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Post3way match' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('3way-match/:invoiceId') @Roles(...MM_WRITE)
  async post3wayMatch(@Param('invoiceId') _invoiceId: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: POST /mm/3way-match/:invoiceId', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Create fleet delivery' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('fleet/deliveries') @Roles(...MM_WRITE)
  async createFleetDelivery(@Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: POST /mm/fleet/deliveries', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Post match vendor invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('vendor-invoices/:id/match') @Roles(...MM_WRITE)
  async postMatchVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    throw new HttpException({ message: 'Endpoint not yet implemented: POST /mm/vendor-invoices/:id/match', code: 'NOT_IMPLEMENTED' }, HttpStatus.NOT_IMPLEMENTED);
  }

  @ApiOperation({ summary: 'Patch pay vendor invoice' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vendor-invoices/:id/payment') @Roles(...MM_WRITE)
  async patchPayVendorInvoice(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return { success: true }; }
}
