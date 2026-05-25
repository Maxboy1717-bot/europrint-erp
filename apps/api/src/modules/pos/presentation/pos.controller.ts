/**
 * @module pos.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller, Get, Post, Put, Delete, Param, Body,
  Query, ParseIntPipe, UseGuards, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { PosService } from '../application/services/pos.service';
import { PosInventoryService } from '../application/services/pos-inventory.service';
import {
  CreateMovementTypeDto, GrantWarehouseAccessDto,
  CreateMovementDto, AddMovementLineDto, UpdateMovementStatusDto,
  CreateInventoryPassportDto, AssignBarcodeDto, CreatePdfTemplateDto,
} from '../dto/pos.dto';
import { unwrapOrInternal } from '@common/http-result';

/**
 * §38 POS Controller — 5 ta endpoint guruhi:
 * 1. /pos/movement-types
 * 2. /pos/warehouse-access
 * 3. /pos/movements
 * 4. /pos/passports + /pos/barcodes
 * 5. /pos/pdf-templates
 */
@ApiTags('POS — §38 Harakatlar va Inventar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('legacy/pos')
export class PosController {
  private readonly logger = new Logger(PosController.name);
  constructor(private readonly service: PosService,
    private readonly inventoryService: PosInventoryService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // §38.1 MOVEMENT TYPES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('movement-types')
  @RequirePermission('pos.movement-types.read')
  @ApiOperation({ summary: 'Barcha harakat turlari' })
  async getMovementTypes() {
    return unwrapOrInternal(await this.service.getMovementTypes());
  }

  @Post('movement-types')
  @RequirePermission('pos.movement-types.write')
  @ApiOperation({ summary: 'Yangi harakat turi yaratish' })
  async createMovementType(@Body() dto: CreateMovementTypeDto) {
    return unwrapOrInternal(await this.service.createMovementType(dto));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // §38.2 WAREHOUSE ACCESS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('warehouse-access/:userId')
  @RequirePermission('pos.warehouse-access.read')
  @ApiOperation({ summary: 'Foydalanuvchi ombor huquqlari' })
  async getUserAccess(@Param('userId', ParseIntPipe) userId: number) {
    return unwrapOrInternal(await this.service.getUserWarehouseAccess(userId));
  }

  @Post('warehouse-access')
  @RequirePermission('pos.warehouse-access.write')
  @ApiOperation({ summary: 'Ombor huquqini berish yoki yangilash' })
  async grantAccess(@Body() dto: GrantWarehouseAccessDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.service.grantWarehouseAccess(dto, user.id));
  }

  @Delete('warehouse-access/:userId/:warehouseId')
  @RequirePermission('pos.warehouse-access.delete')
  @ApiOperation({ summary: 'Ombor huquqini olib qo\'yish' })
  async revokeAccess(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('warehouseId') warehouseId: string,
  ) {
    return unwrapOrInternal(await this.service.revokeWarehouseAccess(userId, warehouseId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // §38.3 MOVEMENTS — Harakat jurnali
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('movements')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakatlar ro\'yxati' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.service.getMovements(warehouseId, status));
  }

  @Get('movements/stats')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat statistikasi' })
  async getStats() {
    return unwrapOrInternal(await this.inventoryService.getStats());
  }

  @Get('movements/:id')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat tafsilotlari (qatorlar bilan)' })
  async getMovement(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.getMovementById(id));
  }

  @Post('movements')
  @RequirePermission('pos.movements.write')
  @ApiOperation({ summary: 'Yangi harakat yaratish' })
  async createMovement(@Body() dto: CreateMovementDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.service.createMovement(dto, user.id));
  }

  @Post('movements/:id/lines')
  @RequirePermission('pos.movements.write')
  @ApiOperation({ summary: 'Harakatga mahsulot qatori qo\'shish' })
  async addLine(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMovementLineDto,
  ) {
    return unwrapOrInternal(await this.service.addMovementLine(id, dto));
  }

  @Put('movements/:id/status')
  @RequirePermission('pos.movements.write')
  @ApiOperation({ summary: 'Harakat holatini yangilash (approve/complete/cancel)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovementStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.service.updateMovementStatus(id, dto));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // §38.4 INVENTORY PASSPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('passports')
  @RequirePermission('pos.passports.read')
  @ApiOperation({ summary: 'Inventar pasportlari ro\'yxati' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getPassports(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrInternal(await this.inventoryService.getPassports(warehouseId));
  }

  @Get('passports/:id')
  @RequirePermission('pos.passports.read')
  @ApiOperation({ summary: 'Pasport tafsilotlari (barkodlar bilan)' })
  async getPassport(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.inventoryService.getPassportById(id));
  }

  @Post('passports')
  @RequirePermission('pos.passports.write')
  @ApiOperation({ summary: 'Yangi inventar pasporti yaratish' })
  async createPassport(@Body() dto: CreateInventoryPassportDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.inventoryService.createPassport(dto, user.id));
  }

  // ─── Barcodes ─────────────────────────────────────────────────────────────

  @Get('barcodes/lookup')
  @RequirePermission('pos.passports.read')
  @ApiOperation({ summary: 'Barkod orqali mahsulot topish' })
  @ApiQuery({ name: 'code', required: true })
  async lookupBarcode(@Query('code') code: string) {
    return unwrapOrInternal(await this.inventoryService.lookupBarcode(code));
  }

  @Post('barcodes')
  @RequirePermission('pos.passports.write')
  @ApiOperation({ summary: 'Pasportga barkod biriktirish' })
  async assignBarcode(@Body() dto: AssignBarcodeDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.inventoryService.assignBarcode(dto, user.id));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // §38.5 PDF TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('pdf-templates')
  @RequirePermission('pos.pdf-templates.read')
  @ApiOperation({ summary: 'PDF shablonlar ro\'yxati' })
  async getPdfTemplates() {
    return unwrapOrInternal(await this.inventoryService.getPdfTemplates());
  }

  @Get('pdf-templates/:id')
  @RequirePermission('pos.pdf-templates.read')
  @ApiOperation({ summary: 'PDF shablon tafsilotlari' })
  async getPdfTemplate(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.inventoryService.getPdfTemplateById(id));
  }

  @Post('pdf-templates')
  @RequirePermission('pos.pdf-templates.write')
  @ApiOperation({ summary: 'Yangi PDF shablon yaratish' })
  async createPdfTemplate(@Body() dto: CreatePdfTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.inventoryService.createPdfTemplate(dto, user.id));
  }

}
