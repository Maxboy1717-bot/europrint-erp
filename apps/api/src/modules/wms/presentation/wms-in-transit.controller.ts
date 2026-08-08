/**
 * @module wms-in-transit.controller
 * @description NestJS controller — import xom-ashyo YO'LDA kuzatuvi + import
 *   hujjatlari (GTD/invoys/sertifikat). HTTP transport qatlami; biznes-logika
 *   WmsInTransitService'da. Result unwrap qilinadi (unwrapOrThrow).
 * @layer Presentation (WMS)
 */

import {
  Body, Controller, Get, Logger, Param, Post, Query, UseGuards, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { safeInt } from '../../hr/common/db-rows';
import { WmsInTransitService } from '../application/wms-in-transit.service';
import {
  WmsCreateInTransitSchema, WmsCreateInTransitDto,
  WmsInTransitTransitionSchema, WmsInTransitTransitionDto,
  WmsAddImportDocumentSchema, WmsAddImportDocumentDto,
} from '../dto/wms-in-transit.dto';

const IT_READ = ['super_admin', 'warehouse_manager', 'director', 'finance_manager'];
const IT_WRITE = ['super_admin', 'warehouse_manager', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('WMS In-Transit')
@ApiBearerAuth()
@Controller('wms/in-transit')
export class WmsInTransitController {
  private readonly logger = new Logger(WmsInTransitController.name);

  constructor(private readonly svc: WmsInTransitService) {}

  @ApiOperation({ summary: 'Import jo\'natmalar ro\'yxati (yo\'lda)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shipments')
  @Roles(...IT_READ)
  async list(@Query('status') status?: string) {
    const r = await this.svc.list(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Bitta jo\'natma' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('shipments/:id')
  @Roles(...IT_READ)
  async getOne(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getOne(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Yangi import jo\'natmasi (shipped)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('shipments')
  @UsePipes(new ZodValidationPipe(WmsCreateInTransitSchema))
  @Roles(...IT_WRITE)
  async create(@Body() body: WmsCreateInTransitDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST in-transit shipment');
    return unwrapOrThrow(await this.svc.create(body as Record<string, unknown>, user?.id ?? null));
  }

  @ApiOperation({ summary: 'shipped → customs (bojxonaga yetdi)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / noto\'g\'ri o\'tish' })
  @Post('shipments/:id/customs')
  @UsePipes(new ZodValidationPipe(WmsInTransitTransitionSchema))
  @Roles(...IT_WRITE)
  async markCustoms(
    @Param('id') id: string,
    @Body() body: WmsInTransitTransitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.markCustoms(safeInt(id, 0), user?.id ?? null, body.date ?? null));
  }

  @ApiOperation({ summary: 'customs → arrived (keldi; karantin kirim ochiladi)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / noto\'g\'ri o\'tish' })
  @Post('shipments/:id/arrived')
  @UsePipes(new ZodValidationPipe(WmsInTransitTransitionSchema))
  @Roles(...IT_WRITE)
  async markArrived(
    @Param('id') id: string,
    @Body() body: WmsInTransitTransitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`POST in-transit arrived ${id}`);
    return unwrapOrThrow(await this.svc.markArrived(safeInt(id, 0), user?.id ?? null, body.date ?? null));
  }

  @ApiOperation({ summary: 'Jo\'natmani bekor qilish' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / noto\'g\'ri o\'tish' })
  @Post('shipments/:id/cancel')
  @Roles(...IT_WRITE)
  async cancel(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.cancel(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Jo\'natma hujjatlari (GTD/invoys/sertifikat)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shipments/:id/documents')
  @Roles(...IT_READ)
  async listDocuments(@Param('id') id: string) {
    const r = await this.svc.listDocuments(safeInt(id, 0));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Jo\'natmaga hujjat biriktirish' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('shipments/:id/documents')
  @UsePipes(new ZodValidationPipe(WmsAddImportDocumentSchema))
  @Roles(...IT_WRITE)
  async addDocument(
    @Param('id') id: string,
    @Body() body: WmsAddImportDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`POST in-transit document for shipment ${id}`);
    return unwrapOrThrow(await this.svc.addDocument(safeInt(id, 0), body as Record<string, unknown>, user?.id ?? null));
  }
}
