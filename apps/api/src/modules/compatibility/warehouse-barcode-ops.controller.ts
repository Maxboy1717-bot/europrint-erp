/**
 * @module warehouse-barcode-ops.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get, Post, Body, Param, Query, HttpCode, HttpStatus , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseBarcodeOpsService } from './warehouse-barcode-ops.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BulkGenerateBarcodeDto, GenerateBarcodeDto, ScanBarcodeDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouse Barcode Ops (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseBarcodeOpsController {
  constructor(private readonly svc: WarehouseBarcodeOpsService) {}

  @Post('barcode/generate')
  @HttpCode(HttpStatus.OK)
  async generateBarcode(@Body() body: GenerateBarcodeDto) {
    return unwrapOrInternal(await this.svc.generateBarcode(body.type, body.entityId));
  }

  @Post('barcode/scan')
  @HttpCode(HttpStatus.OK)
  async scanBarcode(@Body() body: ScanBarcodeDto) {
    return unwrapOrInternal(await this.svc.scanBarcode(body.barcode));
  }

  @Post('barcode/bulk-generate')
  @HttpCode(HttpStatus.OK)
  async bulkGenerateBarcodes(@Body() body: BulkGenerateBarcodeDto) {
    return unwrapOrInternal(await this.svc.bulkGenerateBarcodes(body.entityIds ?? [], body.type));
  }

  @Get('barcode/print/:id')
  async getPrintPreview(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return unwrapOrInternal(await this.svc.getPrintPreview(id, type));
  }
}
