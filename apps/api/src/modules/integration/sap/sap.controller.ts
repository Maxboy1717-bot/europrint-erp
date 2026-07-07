/**
 * @module sap.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, NotFoundException,
  Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SapService } from './sap.service';
import { SapUpdateSalesOrderSchema, SapUpdateSalesOrderDto } from './dto/sap.dto';

const CreateSapSalesOrderSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  items: z.array(z.record(z.unknown())).optional(),
  totalAmount: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const SAP_ROLES = ['super_admin', 'director', 'sales_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Sap')
@Controller('sap')
@UseGuards(RolesGuard)
@Roles(...SAP_ROLES)
export class SapController {
  private readonly logger = new Logger(SapController.name);

  constructor(
    private readonly svc: SapService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List sales orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('sales-orders')
  async listSalesOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListSalesOrders = await this.svc.listSalesOrders(
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListSalesOrders);
    return _rListSalesOrders.data;
  }

  @ApiOperation({ summary: 'Get sales order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('sales-orders/:id')
  async getSalesOrder(@Param('id') id: string) {
    const _rGetSalesOrder = await this.svc.getSalesOrder(safeInt(id, 0));
    assertOk(_rGetSalesOrder);
    const r = _rGetSalesOrder.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.salesOrderNotFoundWithId', { args: { id } }));
    return r;
  }

  @ApiOperation({ summary: 'Update sales order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('sales-orders/:id')
  @UsePipes(new ZodValidationPipe(SapUpdateSalesOrderSchema))
  async updateSalesOrder(@Param('id') id: string, @Body() body: SapUpdateSalesOrderDto) {
    return unwrapOrThrow(await this.svc.updateSalesOrder(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Create sales order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sales-orders')
  @HttpCode(HttpStatus.CREATED)
  async createSalesOrder(@Body() body: unknown) {
    const dto = CreateSapSalesOrderSchema.parse(body);
    return unwrapOrThrow(await this.svc.createSalesOrder(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Patch sales order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('sales-orders/:id')
  async patchSalesOrder(@Param('id') id: string, @Body() body: SapUpdateSalesOrderDto) {
    return unwrapOrThrow(await this.svc.updateSalesOrder(safeInt(id, 0), body as SapUpdateSalesOrderDto));
  }

  @ApiOperation({ summary: 'Delete sales order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('sales-orders/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSalesOrder(@Param('id') id: string) {
    const result = await this.svc.deleteSalesOrder(safeInt(id, 0));
    const row = unwrapOrThrow(result);
    if (!row) throw new NotFoundException(await this.i18n.t('errors.salesOrderNotFoundWithId', { args: { id } }));
    return { id: safeInt(id, 0), deleted: true };
  }
}
