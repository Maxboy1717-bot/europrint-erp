/**
 * @module mm-vendors-pr.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MmVendorsPrService } from '../application/mm-vendors-pr.service';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  MmCreateVendorSchema, MmCreateVendorDto,
  MmUpdateVendorSchema, MmUpdateVendorDto,
  MmCreateRequisitionSchema, MmCreateRequisitionDto,
  MmUpdateRequisitionSchema, MmUpdateRequisitionDto,
} from '../dto/mm.dto';

const MM_WRITE_ROLES = ['mm_manager', 'warehouse_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mm Vendors Pr')
@Controller('mm')
export class MmVendorsPrController {
  private readonly logger = new Logger(MmVendorsPrController.name);

  constructor(private readonly svc: MmVendorsPrService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List vendors' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendors')
  async listVendors(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listVendors(search, safeInt(limit, 50), safeInt(offset, 0)));
  }

  /**
   * List vendor performance ratings from mm_vendor_ratings (canonical write table).
   * GET /api/mm/vendor-performance
   * Score = quality*0.4 + delivery*0.3 + price*0.2 + document*0.1
   * document_score is stored inside the notes JSON field (see POST createVendorPerformance).
   */
  @ApiOperation({ summary: 'List vendor performance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-performance')
  async listVendorPerformance(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    try {
      const r = await rawSql(sql`
        SELECT
          mvr.id::text AS id,
          mvr.vendor_id AS "vendorId",
          mv.name AS "vendorName",
          ROUND(
            (COALESCE(mvr.quality_score, 0) * 0.4 +
             COALESCE(mvr.delivery_score, 0) * 0.3 +
             COALESCE(mvr.price_score, 0) * 0.2 +
             COALESCE(
               (CASE
                 WHEN mvr.notes IS NOT NULL AND mvr.notes ~ '^\s*\{'
                 THEN ((mvr.notes::json)->>'document_score')::numeric
                 ELSE NULL
               END), 0
             ) * 0.1)::numeric, 2
          ) AS score,
          ROUND((COALESCE(mvr.delivery_score, 0) / 100.0)::numeric, 4) AS "onTimeRate",
          ROUND((COALESCE(mvr.quality_score, 0) / 100.0)::numeric, 4) AS "qualityRate",
          mvr.rated_at::date::text AS period,
          mvr.rated_at AS "createdAt"
        FROM mm_vendor_ratings mvr
        LEFT JOIN mm_vendors mv ON mv.id = mvr.vendor_id
        WHERE (${period ?? null}::text IS NULL OR mvr.rated_at::date::text = ${period ?? null})
        ORDER BY mvr.rated_at DESC LIMIT ${lim}
      `);
      return (r as { rows?: Record<string, unknown>[] }).rows ?? [];
    } catch (e) {
      this.logger.error('listVendorPerformance failed', e);
      return [];
    }
  }

  @ApiOperation({ summary: 'Get vendor' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vendors/:id')
  async getVendor(@Param('id') id: string) {
    const _rR = await this.svc.getVendor(safeInt(id, 0));
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.vendorNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Create vendor' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vendors')
  @UsePipes(new ZodValidationPipe(MmCreateVendorSchema))
  @Roles(...MM_WRITE_ROLES)
  async createVendor(@Body() body: MmCreateVendorDto) {
    assertRequired((body as Record<string, unknown>).name, await this.i18n.t('validation.nameRequired'));
    return unwrapOrThrow(await this.svc.createVendor(body));
  }

  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vendors/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateVendorSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateVendor(@Param('id') id: string, @Body() body: MmUpdateVendorDto) {
    const _rR = await this.svc.updateVendor(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.vendorNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Delete vendor' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('vendors/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteVendor(@Param('id') id: string) {
    await this.svc.deleteVendor(safeInt(id, 0));
    return { deleted: true, id: safeInt(id, 0) };
  }

  @ApiOperation({ summary: 'List requisitions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('purchase-requisitions')
  async listRequisitions(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listRequisitions(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @ApiOperation({ summary: 'Get requisition' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('purchase-requisitions/:id')
  async getRequisition(@Param('id') id: string) {
    const _rGetRequisition = await this.svc.getRequisition(safeInt(id, 0));
    assertOk(_rGetRequisition);
    const r = _rGetRequisition.data as Record<string, unknown>;
    assertFound(r, await this.i18n.t('errors.requisitionNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r;
  }

  @ApiOperation({ summary: 'Create requisition' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('purchase-requisitions')
  @UsePipes(new ZodValidationPipe(MmCreateRequisitionSchema))
  @Roles(...MM_WRITE_ROLES)
  async createRequisition(@Body() body: MmCreateRequisitionDto, @CurrentUser() user: Record<string, unknown>) {
    assertRequired((body as Record<string, unknown>).title, await this.i18n.t('errors.titleRequired'));
    return unwrapOrThrow(await this.svc.createRequisition(body.title, (user?.id as number) ?? null, body.needed_by, body.notes, (body.items ?? []) as Array<Record<string, unknown>>));
  }

  @ApiOperation({ summary: 'Update requisition' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('purchase-requisitions/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateRequisitionSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateRequisition(@Param('id') id: string, @Body() body: MmUpdateRequisitionDto) {
    const _rR = await this.svc.updateRequisition(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.requisitionNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r[0];
  }

  @ApiOperation({ summary: 'Delete requisition' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('purchase-requisitions/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteRequisition(@Param('id') id: string) {
    await this.svc.deleteRequisition(safeInt(id, 0));
    return {};
  }
}
