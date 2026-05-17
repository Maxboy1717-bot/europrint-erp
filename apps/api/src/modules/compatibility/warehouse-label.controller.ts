/**
 * @module warehouse-label.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   warehouse-label module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, UseGuards, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { WarehouseLabelCompatService } from './warehouse-label.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { LabelStatusDto, PrintJobDto, PrintLabelDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  LabelBatchAclTranslator,
  type LegacyLabelBatchRow,
  type LabelBatchDto,
} from './acl/label-batch-acl';

@ApiTags('Warehouse Label (ERP)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseLabelController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly batchAcl = new LabelBatchAclTranslator();

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

  /**
   * PA2-14 ACL-translated variant of label batches. New BC-5 (Warehouse)
   * consumers should target this route; `/label/batches` stays for
   * backwards-compat.
   */
  @Get('label/batches/v2')
  async getLabelBatchesV2(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ): Promise<LabelBatchDto[]> {
    const rows = unwrapOrInternal(await this.svc.getLabelBatches(warehouseId, status)) as unknown as LegacyLabelBatchRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.batchAcl.toDomain(row))
      .filter((r): r is { ok: true; data: LabelBatchDto } => r.ok)
      .map((r) => r.data);
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
