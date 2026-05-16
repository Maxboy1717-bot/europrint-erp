/**
 * @module mm-goods.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { MmGoodsService } from '../application/mm-goods.service';
import {
  MmCreateGoodsReceiptSchema, MmCreateGoodsReceiptDto,
  MmUpdateGoodsReceiptSchema, MmUpdateGoodsReceiptDto,
  MmCreateGoodsIssueSchema, MmCreateGoodsIssueDto,
  MmUpdateGoodsIssueSchema, MmUpdateGoodsIssueDto,
} from '../dto/mm.dto';

const MM_WRITE_ROLES = ['ERP_MANAGER', 'mm_manager', 'warehouse_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mm Goods')
@Controller('mm')
export class MmGoodsController {
  private readonly logger = new Logger(MmGoodsController.name);

  constructor(private readonly svc: MmGoodsService) {}

  @ApiOperation({ summary: 'List goods receipts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('goods-receipts')
  async listGoodsReceipts(@Query('poId') poId?: string, @Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listGoodsReceipts(poId ? safeInt(poId, 0) : null, status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get goods receipt' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('goods-receipts/:id')
  async getGoodsReceipt(@Param('id') id: string) {
    const _rGetGoodsReceipt = await this.svc.getGoodsReceipt(safeInt(id, 0));
    assertOk(_rGetGoodsReceipt);
    const r = _rGetGoodsReceipt.data as Record<string, unknown>;
    assertFound(r, 'Goods receipt not found');
    return r;
  }

  @ApiOperation({ summary: 'Create goods receipt' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('goods-receipts')
  @UsePipes(new ZodValidationPipe(MmCreateGoodsReceiptSchema))
  @Roles(...MM_WRITE_ROLES)
  async createGoodsReceipt(@Body() body: MmCreateGoodsReceiptDto) {
    assertRequired((body as Record<string, unknown>).purchase_order_id ?? (body as Record<string, unknown>).vendor_id, 'purchase_order_id required');
    return unwrapOrThrow(await this.svc.createGoodsReceipt(body.purchase_order_id, body.received_by, (body.items ?? []) as Array<Record<string, unknown>>, body.notes, body.delivery_note));
  }

  @ApiOperation({ summary: 'Update goods receipt' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('goods-receipts/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateGoodsReceiptSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateGoodsReceipt(@Param('id') id: string, @Body() body: MmUpdateGoodsReceiptDto) {
    const _rR = await this.svc.updateGoodsReceipt(safeInt(id, 0), body.status, body.notes);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Goods receipt not found');
    return r[0];
  }

  @ApiOperation({ summary: 'Delete goods receipt' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('goods-receipts/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteGoodsReceipt(@Param('id') id: string) {
    await this.svc.deleteGoodsReceipt(safeInt(id, 0));
    return {};
  }

  @ApiOperation({ summary: 'List goods issues' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('goods-issues')
  async listGoodsIssues(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listGoodsIssues(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get goods issue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('goods-issues/:id')
  async getGoodsIssue(@Param('id') id: string) {
    const _rGetGoodsIssue = await this.svc.getGoodsIssue(safeInt(id, 0));
    assertOk(_rGetGoodsIssue);
    const r = _rGetGoodsIssue.data as Record<string, unknown>;
    assertFound(r, 'Goods issue not found');
    return r;
  }

  @ApiOperation({ summary: 'Create goods issue' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('goods-issues')
  @UsePipes(new ZodValidationPipe(MmCreateGoodsIssueSchema))
  @Roles(...MM_WRITE_ROLES)
  async createGoodsIssue(@Body() body: MmCreateGoodsIssueDto) {
    return unwrapOrThrow(await this.svc.createGoodsIssue(body.issued_by, body.cost_center, body.work_order_id, (body.items ?? []) as Array<Record<string, unknown>>, body.notes));
  }

  @ApiOperation({ summary: 'Update goods issue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('goods-issues/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateGoodsIssueSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateGoodsIssue(@Param('id') id: string, @Body() body: MmUpdateGoodsIssueDto) {
    const _rR = await this.svc.updateGoodsIssue(safeInt(id, 0), body.status, body.notes);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Goods issue not found');
    return r[0];
  }

  @ApiOperation({ summary: 'Delete goods issue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('goods-issues/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteGoodsIssue(@Param('id') id: string) {
    await this.svc.deleteGoodsIssue(safeInt(id, 0));
    return {};
  }

  @ApiOperation({ summary: 'Three way match' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('three-way-match/:poId')
  async threeWayMatch(@Param('poId') poId: string) {
    return unwrapOrThrow(await this.svc.threeWayMatch(safeInt(poId, 0)));
  }

  @ApiOperation({ summary: 'Get currencies' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('currencies')
  async getCurrencies() {
    return unwrapOrThrow(await this.svc.getCurrencies());
  }

  @ApiOperation({ summary: 'Get price comparison' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('suppliers/price-comparison')
  async getPriceComparison(@Query('materialId') materialId?: string) {
    return unwrapOrThrow(await this.svc.getPriceComparison(materialId ? safeInt(materialId, 0) : null));
  }
}
