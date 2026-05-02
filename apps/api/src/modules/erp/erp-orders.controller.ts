import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpExtraService } from './erp-extra.service';
import { safeInt } from '../hr/common/db-rows';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ErpBodySchema, ErpBodyDto } from './dto/erp.dto';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];
const ERP_WRITE = ['super_admin', 'director', 'production_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpOrdersController {
  private readonly logger = new Logger(ErpOrdersController.name);

  constructor(private readonly svc: ErpExtraService) {}

  @Get('orders')
  async listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrThrow(await this.svc.listOrders(safeInt(page, 1), safeInt(limit, 50), status));
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const r = await this.svc.getOrder(safeInt(id, 0));
    assertFound(r, 'Order not found');
    return r;
  }

  @Put('orders/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateOrder(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateOrder(safeInt(id, 0), body));
  }

  @Get('work-centers')
  async listWorkCenters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listWorkCenters(safeInt(page, 1), safeInt(limit, 100)));
  }

  @Get('work-centers/:id')
  async getWorkCenter(@Param('id') id: string) {
    const r = await this.svc.getWorkCenter(safeInt(id, 0));
    assertFound(r, 'Work center not found');
    return r;
  }

  @Put('work-centers/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateWorkCenter(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateWorkCenter(safeInt(id, 0), body));
  }

  @Get('work-centers/:id/stats')
  async workCenterStats(
    @Param('id') id: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return unwrapOrThrow(await this.svc.getWorkCenterStats(safeInt(id, 0), dateRange ?? ''));
  }

  @Get('mrp-runs')
  async listMrpRuns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listMrpRuns(safeInt(page, 1), safeInt(limit, 20)));
  }

  @Post('mrp-runs')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createMrpRun(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createMrpRun(body));
  }

  @Post('mrp-runs/:runId/calculate')
  @Roles(...ERP_WRITE)
  async calculateMrpRun(@Param('runId') runId: string) {
    return unwrapOrThrow(await this.svc.calculateMrpRun(safeInt(runId, 0)));
  }

  @Get('mrp-results')
  async listMrpResults(@Query('runId') runId?: string) {
    return unwrapOrThrow(await this.svc.listMrpResults(runId ? safeInt(runId, 0) : undefined));
  }

  @Get('purchase-requisitions')
  async listPurchaseRequisitions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listPurchaseRequisitions(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Get('dashboard-stats')
  async dashboardStats() {
    return unwrapOrThrow(await this.svc.listDashboardStats());
  }
}
