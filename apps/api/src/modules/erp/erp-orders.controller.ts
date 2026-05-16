/**
 * @module erp-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpExtraService } from './erp-extra.service';
import { safeInt } from '../hr/common/db-rows';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ErpBodySchema, ErpBodyDto } from './dto/erp.dto';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];
const ERP_WRITE = ['super_admin', 'director', 'production_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Erp Orders')
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpOrdersController {
  private readonly logger = new Logger(ErpOrdersController.name);

  constructor(private readonly svc: ErpExtraService) {}

  @ApiOperation({ summary: 'List orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders')
  async listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrThrow(await this.svc.listOrders(safeInt(page, 1), safeInt(limit, 50), status));
  }

  @ApiOperation({ summary: 'Get order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const r = await this.svc.getOrder(safeInt(id, 0));
    assertFound(r, 'Order not found');
    return r;
  }

  @ApiOperation({ summary: 'Create order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('orders')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createOrder(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createOrder(body));
  }

  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('orders/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateOrder(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateOrder(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Patch order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('orders/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchOrder(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateOrder(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('orders/:id')
  @Roles(...ERP_WRITE)
  async deleteOrder(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteOrder(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'List work centers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('work-centers')
  async listWorkCenters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listWorkCenters(safeInt(page, 1), safeInt(limit, 100)));
  }

  @ApiOperation({ summary: 'Get work center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('work-centers/:id')
  async getWorkCenter(@Param('id') id: string) {
    const r = await this.svc.getWorkCenter(safeInt(id, 0));
    assertFound(r, 'Work center not found');
    return r;
  }

  @ApiOperation({ summary: 'Create work center' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('work-centers')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createWorkCenter(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createWorkCenter(body));
  }

  @ApiOperation({ summary: 'Update work center' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('work-centers/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateWorkCenter(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateWorkCenter(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Patch work center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('work-centers/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchWorkCenter(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateWorkCenter(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Delete work center' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('work-centers/:id')
  @Roles(...ERP_WRITE)
  async deleteWorkCenter(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteWorkCenter(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Work center stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('work-centers/:id/stats')
  async workCenterStats(
    @Param('id') id: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return unwrapOrThrow(await this.svc.getWorkCenterStats(safeInt(id, 0), dateRange ?? ''));
  }

  @ApiOperation({ summary: 'List mrp runs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mrp-runs')
  async listMrpRuns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listMrpRuns(safeInt(page, 1), safeInt(limit, 20)));
  }

  @ApiOperation({ summary: 'Create mrp run' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('mrp-runs')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createMrpRun(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createMrpRun(body));
  }

  @ApiOperation({ summary: 'Calculate mrp run' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('mrp-runs/:runId/calculate')
  @Roles(...ERP_WRITE)
  async calculateMrpRun(@Param('runId') runId: string) {
    return unwrapOrThrow(await this.svc.calculateMrpRun(safeInt(runId, 0)));
  }

  @ApiOperation({ summary: 'List mrp results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mrp-results')
  async listMrpResults(@Query('runId') runId?: string) {
    return unwrapOrThrow(await this.svc.listMrpResults(runId ? safeInt(runId, 0) : undefined));
  }

  @ApiOperation({ summary: 'List purchase requisitions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('purchase-requisitions')
  async listPurchaseRequisitions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listPurchaseRequisitions(safeInt(page, 1), safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Dashboard stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard-stats')
  async dashboardStats() {
    return unwrapOrThrow(await this.svc.listDashboardStats());
  }
}
