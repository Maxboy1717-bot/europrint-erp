import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('mm')
export class MmGoodsController {
  private readonly logger = new Logger(MmGoodsController.name);

  constructor(private readonly svc: MmGoodsService) {}

  @Get('goods-receipts')
  async listGoodsReceipts(@Query('poId') poId?: string, @Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listGoodsReceipts(poId ? safeInt(poId, 0) : null, status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('goods-receipts/:id')
  async getGoodsReceipt(@Param('id') id: string) {
    const _rGetGoodsReceipt = await this.svc.getGoodsReceipt(safeInt(id, 0));
    assertOk(_rGetGoodsReceipt);
    const r = _rGetGoodsReceipt.data as Record<string, unknown>;
    assertFound(r, 'Goods receipt not found');
    return r;
  }

  @Post('goods-receipts')
  @UsePipes(new ZodValidationPipe(MmCreateGoodsReceiptSchema))
  @Roles(...MM_WRITE_ROLES)
  async createGoodsReceipt(@Body() body: MmCreateGoodsReceiptDto) {
    assertRequired((body as Record<string, unknown>).purchase_order_id ?? (body as Record<string, unknown>).vendor_id, 'purchase_order_id required');
    return unwrapOrThrow(await this.svc.createGoodsReceipt(body.purchase_order_id, body.received_by, (body.items ?? []) as Array<Record<string, unknown>>, body.notes, body.delivery_note));
  }

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

  @Delete('goods-receipts/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteGoodsReceipt(@Param('id') id: string) {
    await this.svc.deleteGoodsReceipt(safeInt(id, 0));
    return {};
  }

  @Get('goods-issues')
  async listGoodsIssues(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listGoodsIssues(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('goods-issues/:id')
  async getGoodsIssue(@Param('id') id: string) {
    const _rGetGoodsIssue = await this.svc.getGoodsIssue(safeInt(id, 0));
    assertOk(_rGetGoodsIssue);
    const r = _rGetGoodsIssue.data as Record<string, unknown>;
    assertFound(r, 'Goods issue not found');
    return r;
  }

  @Post('goods-issues')
  @UsePipes(new ZodValidationPipe(MmCreateGoodsIssueSchema))
  @Roles(...MM_WRITE_ROLES)
  async createGoodsIssue(@Body() body: MmCreateGoodsIssueDto) {
    return unwrapOrThrow(await this.svc.createGoodsIssue(body.issued_by, body.cost_center, body.work_order_id, (body.items ?? []) as Array<Record<string, unknown>>, body.notes));
  }

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

  @Delete('goods-issues/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteGoodsIssue(@Param('id') id: string) {
    await this.svc.deleteGoodsIssue(safeInt(id, 0));
    return {};
  }

  @Get('three-way-match/:poId')
  async threeWayMatch(@Param('poId') poId: string) {
    return unwrapOrThrow(await this.svc.threeWayMatch(safeInt(poId, 0)));
  }

  @Get('currencies')
  async getCurrencies() {
    return unwrapOrThrow(await this.svc.getCurrencies());
  }

  @Get('suppliers/price-comparison')
  async getPriceComparison(@Query('materialId') materialId?: string) {
    return unwrapOrThrow(await this.svc.getPriceComparison(materialId ? safeInt(materialId, 0) : null));
  }
}
