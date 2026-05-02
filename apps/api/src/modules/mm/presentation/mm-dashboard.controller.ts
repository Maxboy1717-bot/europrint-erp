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
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mm')
export class MmDashboardController {
  private readonly logger = new Logger(MmDashboardController.name);

  constructor(private readonly svc: MmDashboardService) {}

  @Get('dashboard')
  @Roles(...MM_READ)
  async getDashboard() {
    this.logger.log('GET mm dashboard');
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @Get('vendor-ratings')
  @Roles(...MM_READ)
  async getVendorRatings() {
    this.logger.log('GET vendor ratings');
    return unwrapOrThrow(await this.svc.getVendorRatings());
  }

  @Get('mrp-results')
  @Roles(...MM_READ)
  async getMrpResults(@Query('materialId') materialId?: string) {
    this.logger.log('GET MRP results');
    return unwrapOrThrow(await this.svc.getMrpResults(materialId ? safeInt(materialId, 0) : undefined));
  }

  @Post('mrp-run')
  @UseInterceptors(AuditInterceptor)
  @Roles(...MM_WRITE)
  async runMrp() {
    this.logger.log('POST run MRP');
    return unwrapOrThrow(await this.svc.runMrp());
  }

  @Get('fleet/vehicles')
  @Roles(...MM_READ)
  async getFleetVehicles() {
    this.logger.log('GET fleet vehicles');
    return unwrapOrThrow(await this.svc.getFleetVehicles());
  }

  @Post('fleet/vehicles')
  @UsePipes(new ZodValidationPipe(MmCreateFleetVehicleSchema))
  @Roles(...MM_WRITE)
  async createFleetVehicle(@Body() body: MmCreateFleetVehicleDto) {
    this.logger.log('POST fleet vehicle');
    return unwrapOrThrow(await this.svc.createFleetVehicle(body));
  }

  @Get('fleet/fuel-logs')
  @Roles(...MM_READ)
  async getFuelLogs(@Query('vehicleId') vehicleId?: string) {
    this.logger.log('GET fuel logs');
    return unwrapOrThrow(await this.svc.getFuelLogs(vehicleId ? safeInt(vehicleId, 0) : undefined));
  }

  @Post('fleet/fuel-logs')
  @UsePipes(new ZodValidationPipe(MmCreateFuelLogSchema))
  @Roles(...MM_WRITE)
  async createFuelLog(@Body() body: MmCreateFuelLogDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST fuel log');
    return unwrapOrThrow(await this.svc.createFuelLog(body, user?.id ?? null));
  }

  @Get('supplier-performance')
  @Roles(...MM_READ)
  async getSupplierPerformance() {
    this.logger.log('GET supplier performance');
    return unwrapOrThrow(await this.svc.getSupplierPerformance());
  }

  @Get('materials/:id/price-history')
  @Roles(...MM_READ)
  async getPriceHistory(@Param('id') id: string) {
    this.logger.log(`GET price history for material ${id}`);
    return unwrapOrThrow(await this.svc.getPriceHistory(safeInt(id, 0)));
  }

  @Get('vendor-invoices') @Roles(...MM_READ)
  async getVendorInvoices() { return { data: [], total: 0 }; }

  @Get('vendor-invoices/:id') @Roles(...MM_READ)
  async getVendorInvoiceById(@Param('id') id: string) { return { id, status: 'pending' }; }

  @Patch('vendor-invoices/:id/approve') @Roles(...MM_WRITE)
  async approveVendorInvoice(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, approved: true }; }

  @Patch('vendor-invoices/:id/match') @Roles(...MM_WRITE)
  async matchVendorInvoice(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, matched: true }; }

  @Post('vendor-invoices/:id/payment') @Roles(...MM_WRITE)
  async payVendorInvoice(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, paid: true }; }

  @Get('three-way-match') @Roles(...MM_READ)
  async getThreeWayMatch() { return { data: [], total: 0 }; }

  @Get('3way-match/:invoiceId') @Roles(...MM_READ)
  async get3wayMatch(@Param('invoiceId') invoiceId: string) { return { invoiceId, matched: false }; }

  @Get('fleet/maintenance') @Roles(...MM_READ)
  async getFleetMaintenance() { return { data: [], total: 0 }; }

  @Get('fleet/deliveries') @Roles(...MM_READ)
  async getFleetDeliveries() { return { data: [], total: 0 }; }

  @Patch('fleet/deliveries/:id/status') @Roles(...MM_WRITE)
  async updateFleetDeliveryStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Get('vehicles/locations') @Roles(...MM_READ)
  async getVehicleLocations() { return { data: [] }; }

  @Get('driver/expenses') @Roles(...MM_READ)
  async getDriverExpenses() { return { data: [], total: 0 }; }

  @Get('materials/:id/suppliers') @Roles(...MM_READ)
  async getMaterialSuppliers(@Param('id') id: string) { return { data: [], materialId: id }; }
}
