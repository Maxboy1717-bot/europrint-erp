/**
 * @module warehouse-label.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseLabelCompatService } from './warehouse-label.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { LabelStatusDto, PrintJobDto, PrintLabelDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouse Label (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseLabelController {
  constructor(private readonly svc: WarehouseLabelCompatService) {}

  @Post('label/print')
  @HttpCode(HttpStatus.OK)
  async printLabel(@Body() body: PrintLabelDto) {
    return unwrapOrInternal(await this.svc.printLabel(body));
  }

  @Get('label/batches')
  async getLabelBatches(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getLabelBatches(warehouseId, status));
  }

  @Get('label/history')
  async getPrintHistory(
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getPrintHistory(warehouseId, parseInt(limit ?? '50', 10) || 50));
  }

  @Patch('label/batches/:id/status')
  async updateBatchStatus(
    @Param('id') id: string,
    @Body() body: LabelStatusDto,
  ) {
    return unwrapOrInternal(await this.svc.updateBatchStatus(id, body.status, body.notes));
  }

  @Post('label/print-job')
  @HttpCode(HttpStatus.CREATED)
  async createLabelPrintJob(@Body() body: PrintJobDto) {
    return unwrapOrInternal(await this.svc.createLabelPrintJob(body.batchId, body.format, body.copies ?? 1));
  }
}
