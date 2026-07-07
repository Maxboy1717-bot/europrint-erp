/**
 * @module sd-leads.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdLeadsService } from '../application/sd-leads.service';
import {
  SdCreateLeadSchema, SdCreateLeadDto,
  SdUpdateLeadSchema, SdUpdateLeadDto,
  SdConvertLeadSchema, SdConvertLeadDto,
  SdAddLeadActivitySchema, SdAddLeadActivityDto,
} from '../dto/sd.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';

const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];
const SD_ADMIN_ROLES = ['sales_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Sd Leads')
@ApiBearerAuth()
@Controller('sd/leads')
export class SdLeadsController {
  private readonly logger = new Logger(SdLeadsController.name);

  constructor(private readonly svc: SdLeadsService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('status') status?: string, @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const _rList = await this.svc.list(status, assignedTo ? safeInt(assignedTo, 0) : null,
      search ? `%${search}%` : null, safeInt(limit, 50), safeInt(offset, 0));
    assertOk(_rList);
    return _rList.data;
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    return unwrapOrThrow(await this.svc.getStats());
  }

  @ApiOperation({ summary: 'Export' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(...SD_ADMIN_ROLES)
  async export(@Query('from') from?: string, @Query('to') to?: string, @Query('status') status?: string) {
    return unwrapOrThrow(await this.svc.exportLeads(from, to, status));
  }

  @ApiOperation({ summary: 'Bulk import leads from CSV rows' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('import')
  @Roles(...SD_ADMIN_ROLES)
  async importLeads(@Body() body: { rows: Array<Record<string, string>> }) {
    let imported = 0; let skipped = 0; const errors: string[] = [];
    for (const row of (Array.isArray(body.rows) ? body.rows : [])) {
      if (!row.title) { skipped++; continue; }
      const r = await this.svc.create({
        title: row.title,
        source: row.source ?? null,
        expected_amount: row.amount ? Number(row.amount) : null,
        notes: row.notes ?? null,
      });
      if (r.ok) imported++; else { skipped++; errors.push(`${row.title}: ${r.error?.message ?? 'error'}`); }
    }
    return { imported, skipped, errors };
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rR = await this.svc.getById(safeInt(id, 0));
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.leadNotFound'));
    return r[0];
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(SdCreateLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async create(@Body() body: SdCreateLeadDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(SdUpdateLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async update(@Param('id') id: string, @Body() body: SdUpdateLeadDto) {
    const _rR = await this.svc.update(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.leadNotFound'));
    return r[0];
  }

  @ApiOperation({ summary: 'Update status' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const _rR = await this.svc.updateStatus(safeInt(id, 0), body.status);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, await this.i18n.t('errors.leadNotFound'));
    return r[0];
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles(...SD_ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    await this.svc.delete(safeInt(id, 0));
    return { deleted: true, id: safeInt(id, 0) };
  }

  @ApiOperation({ summary: 'Convert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/convert')
  @UsePipes(new ZodValidationPipe(SdConvertLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async convert(@Param('id') id: string, @Body() body: SdConvertLeadDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.convert(safeInt(id, 0), body.notes, user.id));
  }

  @ApiOperation({ summary: 'Add activity' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/activities')
  @UsePipes(new ZodValidationPipe(SdAddLeadActivitySchema))
  @Roles(...SD_WRITE_ROLES)
  async addActivity(@Param('id') id: string, @Body() body: SdAddLeadActivityDto) {
    return unwrapOrThrow(await this.svc.addActivity(safeInt(id, 0), body.type, body.subject, body.notes, body.employee_id));
  }

  @ApiOperation({ summary: 'Get activities' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getActivities(safeInt(id, 0)));
  }
}
