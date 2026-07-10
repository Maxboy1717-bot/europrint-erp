/**
 * @module mm-reconciliation.controller
 * @description Vendor sverka akti (reconciliation act) endpoints — transport only,
 *   delegates to MmReconciliationService / MmReconciliationPdfService.
 *   GET /api/mm/reconciliation/digest         -> month-end discrepancy digest (JSON)
 *   GET /api/mm/reconciliation/:vendorId       -> reconciliation act (JSON)
 *   GET /api/mm/reconciliation/:vendorId/pdf   -> reconciliation act (PDF, "Akt yaratish")
 * @layer Presentation (MM)
 */

import {
  Controller, Get, Param, Query, Res, UseGuards, UseInterceptors, InternalServerErrorException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { safeInt } from '../../hr/common/db-rows';
import { MmReconciliationService } from '../application/mm-reconciliation.service';
import { MmReconciliationPdfService } from '../application/mm-reconciliation-pdf.service';

@ApiThrottle()
@ApiTags('Mm Reconciliation')
@Controller('mm')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('mm_manager', 'warehouse_manager', 'finance_manager', 'cfo', 'director', 'super_admin')
export class MmReconciliationController {
  constructor(
    private readonly svc: MmReconciliationService,
    private readonly pdf: MmReconciliationPdfService,
  ) {}

  @ApiOperation({ summary: 'Month-end vendor discrepancy digest (sverka)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reconciliation/digest')
  async digest(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrThrow(await this.svc.getMonthDigest(from, to));
  }

  @ApiOperation({ summary: 'On-demand vendor reconciliation act (sverka akti)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reconciliation/:vendorId')
  async getAct(
    @Param('vendorId') vendorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return unwrapOrThrow(await this.svc.getReconciliation(safeInt(vendorId, 0), from, to));
  }

  @ApiOperation({ summary: 'Vendor reconciliation act as PDF' })
  @ApiResponse({ status: 200, description: 'application/pdf' })
  @Get('reconciliation/:vendorId/pdf')
  async getActPdf(
    @Param('vendorId') vendorId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: FastifyReply,
  ) {
    const act = unwrapOrThrow(await this.svc.getReconciliation(safeInt(vendorId, 0), from, to));
    const pdfRes = await this.pdf.generate({
      vendorName: act.vendorName ?? `Vendor #${act.vendorId}`,
      fromDate: act.fromDate,
      toDate: act.toDate,
      openingBalance: act.openingBalance,
      goodsReceived: act.goodsReceived,
      invoiced: act.invoiced,
      payments: act.payments,
      closingBalance: act.closingBalance,
      discrepancy: act.discrepancy,
      hasDiscrepancy: act.hasDiscrepancy,
      generatedAt: act.generatedAt,
    });
    if (!pdfRes.ok) throw new InternalServerErrorException(pdfRes.error.message);
    const buffer = pdfRes.data;
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="sverka-akti-vendor-${act.vendorId}-${act.fromDate}_${act.toDate}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }
}
