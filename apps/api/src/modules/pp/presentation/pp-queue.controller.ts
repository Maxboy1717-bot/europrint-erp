/**
 * @module pp-queue.controller
 * @description Wave 6 (500K build): NestJS controller exposing the ranked production queue
 *              (ProductionPriorityService.buildQueue) — frozen segment + flexible ZARUR→deadline→band.
 */

import { Controller, Get, Param, ParseIntPipe, Res, UseGuards, UseInterceptors, StreamableFile, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GetProductionQueueQuery } from '../application/queries/get-production-queue.query';
import { GetSalesOrderQueuePositionQuery } from '../application/queries/get-sales-order-queue-position.query';
import { PpPlanExportService } from '../application/services/pp-plan-export.service';
import type { FastifyReply } from 'fastify';
import { Readable } from 'stream';

const QUEUE_ROLES = ['super_admin', 'director', 'production_manager', 'planner', 'operator'];
// Modul-06 #47: the SD order card (viewed by sales managers) reads its own queue slot;
// base GET /pp/queue excludes sales_manager, so the by-sales-order read widens the roles.
const SALES_ORDER_QUEUE_ROLES = [...QUEUE_ROLES, 'sales_manager'];

@ApiThrottle()
@ApiTags('Pp Queue')
@Controller('pp/queue')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpQueueController {
  private readonly logger = new Logger(PpQueueController.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly planExport: PpPlanExportService,
  ) {}

  @ApiOperation({ summary: 'Get ranked production queue (frozen + flexible: ZARUR → deadline → band)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...QUEUE_ROLES)
  async getQueue() {
    this.logger.log('Getting ranked production queue');
    return unwrapOrThrow(await this.queryBus.execute(new GetProductionQueueQuery({})));
  }

  /**
   * EP-PP-129 (Modul-07 #41): download the current ranked production plan as a
   * CSV snapshot for audit. Same data source as GET /pp/queue (the ranked plan);
   * the controller stays transport-only (Rule 6) — it runs the query, hands the
   * REAL rows to the serializer, and streams. Empty queue → header-only CSV.
   */
  @ApiOperation({ summary: 'Export the ranked production plan as a CSV snapshot (audit) — EP-PP-129' })
  @ApiResponse({ status: 200, description: 'CSV attachment (text/csv)' })
  @Get('plan/export')
  @Roles(...QUEUE_ROLES)
  async exportPlanCsv(@Res({ passthrough: true }) res: FastifyReply): Promise<StreamableFile> {
    this.logger.log('Exporting ranked production plan as CSV snapshot');
    const rows = unwrapOrThrow(await this.queryBus.execute(new GetProductionQueueQuery({})));
    const csv = this.planExport.serializePlanCsv(rows);
    const filename = 'production-plan.csv';
    void res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
  }

  /**
   * Modul-06 #47: surface queue_position (=rank in the ranked plan) + estimated_start
   * (production_orders.scheduled_start) for ONE sales order, so the SD order card can
   * show where the order sits in production. Transport-only (Rule 6): delegates the
   * lookup + ranking to the query handler. 404 when no production order links the
   * sales order yet.
   */
  @ApiOperation({ summary: "Get a sales order's production queue_position + estimated_start (SD order card) — Modul-06 #47" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'No production order linked to this sales order' })
  @Get('sales-order/:salesOrderId')
  @Roles(...SALES_ORDER_QUEUE_ROLES)
  async getSalesOrderQueuePosition(@Param('salesOrderId', ParseIntPipe) salesOrderId: number) {
    this.logger.log(`Getting production queue position for sales order ${salesOrderId}`);
    return unwrapOrThrow(await this.queryBus.execute(new GetSalesOrderQueuePositionQuery(salesOrderId)));
  }
}
