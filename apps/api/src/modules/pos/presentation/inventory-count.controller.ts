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
import { PosPdfService }            from '../application/services/pos-pdf.service';

import {
  CreateInventoryCountDto,
  RecordActualQtyDto,
  BulkRecordActualQtyDto,
  ApproveInventoryCountDto,
  CountFilterDto,
} from '../dto/inventory-count.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('POS — Inventarizatsiya')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/inventory-counts')
export class InventoryCountController {
  private readonly logger = new Logger(InventoryCountController.name);
  constructor(private readonly countService: PosInventoryCountService,
    private readonly pdfService:   PosPdfService) {}

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
