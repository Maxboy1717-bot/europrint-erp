/**
 * @module barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Barcode Controller
 * EAN-13 skanerlash, tayinlash, label chop
 */

import {Controller, Get, Post, Body, Query, Param,
  UseGuards, ParseIntPipe, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { CurrentUser }       from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard }   from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { PosBarcodeService } from '../application/services/pos-barcode.service';

import {
  ScanBarcodeDto,
  AssignBarcodeDto,
  PrintLabelDto,
  ReviewAiSuggestionDto,
  GenerateEan13Dto,
} from '../dto/barcode.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('POS — Barcode')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/barcode')
export class BarcodeController {
  private readonly logger = new Logger(BarcodeController.name);
  constructor(private readonly barcodeService: PosBarcodeService) {}

  // ─── Skanerlash ───────────────────────────────────────────────────────────

  @Post('scan')
  @RequirePermission('pos.barcode.scan')
  @ApiOperation({ summary: 'EAN-13 barcode skanerlash (Redis cache → DB → AI)' })
  async scan(@Body() dto: ScanBarcodeDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.barcodeService.scanBarcode(dto, user.id));
  }

  // ─── Tayinlash ────────────────────────────────────────────────────────────

  @Post('assign')
  @RequirePermission('pos.barcode.assign')
  @ApiOperation({ summary: 'Material kartochkaga barcode tayinlash' })
  async assign(@Body() dto: AssignBarcodeDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.barcodeService.assignBarcode(dto, user.id));
  }

  // ─── Label Chop ───────────────────────────────────────────────────────────

  @Post('print')
  @RequirePermission('pos.barcode.print')
  @ApiOperation({ summary: 'Label chop etish navbatiga qo\'shish' })
  async queuePrint(@Body() dto: PrintLabelDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.barcodeService.queuePrint(dto, user.id));
  }

  // ─── EAN-13 Generatsiya ───────────────────────────────────────────────────

  @Post('generate-ean13')
  @RequirePermission('pos.barcode.assign')
  @ApiOperation({ summary: 'EAN-13 barcode generatsiya (GS1 algoritmi)' })
  generateEan13(@Body() dto: GenerateEan13Dto) {
    return { barcode: this.barcodeService.generateEan13(dto) };
  }

  // ─── AI Taklif Ko'rib Chiqish ─────────────────────────────────────────────

  @Post('ai-suggestion/review')
  @RequirePermission('pos.material_card.create')
  @ApiOperation({ summary: 'AI kartochka taklifini tasdiqlash / rad etish' })
  async reviewAiSuggestion(@Body() dto: ReviewAiSuggestionDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.barcodeService.reviewAiSuggestion(dto, user.id));
  }

  // ─── Kutilayotgan Takliflar ───────────────────────────────────────────────

  @Get('ai-suggestion/pending')
  @RequirePermission('pos.material_card.create')
  @ApiOperation({ summary: 'Ko\'rib chiqilmagan AI takliflar ro\'yxati' })
  getPendingSuggestions() {
    // materialCardSuggestions da PENDING statusdagilar
    return { message: 'GET /pos/barcode/ai-suggestion/pending' };
  }
}
