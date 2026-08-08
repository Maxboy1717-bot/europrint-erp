/**
 * @module inventory-count.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Inventory Count Controller
 * Inventarizatsiya endpointlari
 */

import {Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Ip, Res, ParseIntPipe, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { FastifyReply } from 'fastify';

import { CurrentUser }       from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard }   from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { PosInventoryCountService } from '../application/services/pos-inventory-count.service';
import { PosVarianceConfigService } from '../application/services/pos-variance-config.service';
import { PosPdfService }            from '../application/services/pos-pdf.service';
import { z } from 'zod';

import {
  CreateInventoryCountDto,
  RecordActualQtyDto,
  BulkRecordActualQtyDto,
  ApproveInventoryCountDto,
  CountFilterDto,
} from '../dto/inventory-count.dto';
import { unwrapOrInternal } from '@common/http-result';

// P4: farq avto-tasdiq chegarasini belgilash (egasi-DATA). warehouseId=null → global default.
const SetVarianceConfigSchema = z.object({
  warehouseId:           z.number().int().positive().nullable().optional(),
  autoApproveQtyPct:     z.number().min(0),
  autoApproveValueUzs:   z.number().min(0),
  notes:                 z.string().max(500).optional(),
});

@ApiTags('POS — Inventarizatsiya')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/inventory-counts')
export class InventoryCountController {
  private readonly logger = new Logger(InventoryCountController.name);
  constructor(private readonly countService: PosInventoryCountService,
    private readonly varianceConfig: PosVarianceConfigService,
    private readonly pdfService:   PosPdfService) {}

  // ─── P4: Farq chegarasi konfiguratsiyasi (egasi-DATA) ─────────────────────

  @Get('variance-config')
  @RequirePermission('pos.inventory_count.read')
  @ApiOperation({ summary: 'Farq avto-tasdiq chegarasi (ombor yoki global default)' })
  async getVarianceConfig(@Query('warehouseId') warehouseId?: string) {
    const whId = warehouseId != null && warehouseId !== '' ? Number(warehouseId) : null;
    return unwrapOrInternal(await this.varianceConfig.getThreshold(whId));
  }

  @Patch('variance-config')
  @RequirePermission('pos.inventory_count.approve')
  @ApiOperation({ summary: 'Farq avto-tasdiq chegarasini belgilash (egasi-DATA)' })
  async setVarianceConfig(@Body() body: unknown) {
    const dto = SetVarianceConfigSchema.parse(body);
    return unwrapOrInternal(
      await this.varianceConfig.setThreshold(dto.warehouseId ?? null, dto.autoApproveQtyPct, dto.autoApproveValueUzs, dto.notes),
    );
  }

  // ─── Ro'yxat ─────────────────────────────────────────────────────────────

  @Get()
  @RequirePermission('pos.inventory_count.read')
  @ApiOperation({ summary: 'Inventarizatsiyalar ro\'yxati' })
  async findAll(@Query() filter: CountFilterDto) {
    return unwrapOrInternal(await this.countService.findAll(filter));
  }

  // ─── Yaratish ─────────────────────────────────────────────────────────────

  @Post()
  @RequirePermission('pos.inventory_count.create')
  @ApiOperation({ summary: 'Yangi inventarizatsiya boshlash (stock snapshot oladi)' })
  async createCount(@Body() dto: CreateInventoryCountDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.countService.createCount(dto, user.id, ip));
  }

  // ─── Haqiqiy Miqdor Kiritish ──────────────────────────────────────────────

  @Post('lines/record')
  @RequirePermission('pos.inventory_count.record')
  @ApiOperation({ summary: 'Bitta satr uchun haqiqiy miqdor kiritish' })
  async recordActualQty(@Body() dto: RecordActualQtyDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.countService.recordActualQty(dto, user.id, ip));
  }

  @Post('lines/bulk-record')
  @RequirePermission('pos.inventory_count.record')
  @ApiOperation({ summary: 'Ko\'p satr uchun toplu haqiqiy miqdor kiritish' })
  async bulkRecordActualQty(@Body() dto: BulkRecordActualQtyDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.countService.bulkRecordActualQty(dto, user.id));
  }

  // ─── Farq Hisoboti ────────────────────────────────────────────────────────

  @Get(':id/variance')
  @RequirePermission('pos.inventory_count.read')
  @ApiOperation({ summary: 'Inventarizatsiya farq hisoboti' })
  async getVariance(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.countService.getVarianceReport(id));
  }

  // ─── P4: Farq avto-tasdiq / eskalatsiya qarori ────────────────────────────

  @Get(':id/variance-decision')
  @RequirePermission('pos.inventory_count.read')
  @ApiOperation({ summary: 'Farq chegarasi: avto-tasdiq (AUTO_APPROVE) yoki menejer-tasdiq (ESCALATE)' })
  async getVarianceDecision(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.countService.evaluateVarianceDecision(id));
  }

  // ─── Tasdiqlash ───────────────────────────────────────────────────────────

  @Patch('approve')
  @RequirePermission('pos.inventory_count.approve')
  @ApiOperation({ summary: 'Inventarizatsiyani tasdiqlash (GL tuzatmalarni qo\'llash)' })
  async approveCount(@Body() dto: ApproveInventoryCountDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.countService.approveCount(dto, user.id, ip));
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  @Get(':id/pdf')
  @RequirePermission('pos.inventory_count.read')
  @ApiOperation({ summary: 'Inventarizatsiya hisoboti PDF' })
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: FastifyReply,
  ) {
    const buffer = await this.pdfService.generateInventoryCountPdf(id);
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="inventory-count-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }
}
