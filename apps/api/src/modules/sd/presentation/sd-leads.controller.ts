import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdLeadsService } from '../application/sd-leads.service';
import {
  SdCreateLeadSchema, SdCreateLeadDto,
  SdUpdateLeadSchema, SdUpdateLeadDto,
  SdConvertLeadSchema, SdConvertLeadDto,
  SdAddLeadActivitySchema, SdAddLeadActivityDto,
} from '../dto/sd.dto';

const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];
const SD_ADMIN_ROLES = ['sales_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('sd/leads')
export class SdLeadsController {
  private readonly logger = new Logger(SdLeadsController.name);

  constructor(private readonly svc: SdLeadsService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const _rList = await this.svc.list(status, assignedTo ? safeInt(assignedTo, 0) : null,
      search ? `%${search}%` : null, safeInt(limit, 50), safeInt(offset, 0));
    assertOk(_rList);
    return _rList.data;
  }

  @Get('stats')
  async getStats() {
    return unwrapOrThrow(await this.svc.getStats());
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(...SD_ADMIN_ROLES)
  async export(@Query('from') from?: string, @Query('to') to?: string, @Query('status') status?: string) {
    return unwrapOrThrow(await this.svc.exportLeads(from, to, status));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rR = await this.svc.getById(safeInt(id, 0));
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'SD Lead not found');
    return r[0];
  }

  @Post()
  @UsePipes(new ZodValidationPipe(SdCreateLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async create(@Body() body: SdCreateLeadDto) {
    assertRequired((body as Record<string, unknown>).full_name, 'full_name required');
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(SdUpdateLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async update(@Param('id') id: string, @Body() body: SdUpdateLeadDto) {
    const _rR = await this.svc.update(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'SD Lead not found');
    return r[0];
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(...SD_WRITE_ROLES)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const _rR = await this.svc.updateStatus(safeInt(id, 0), body.status);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'SD Lead not found');
    return r[0];
  }

  @Delete(':id')
  @Roles(...SD_ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    await this.svc.delete(safeInt(id, 0));
    return { deleted: true, id: safeInt(id, 0) };
  }

  @Post(':id/convert')
  @UsePipes(new ZodValidationPipe(SdConvertLeadSchema))
  @Roles(...SD_WRITE_ROLES)
  async convert(@Param('id') id: string, @Body() body: SdConvertLeadDto) {
    return unwrapOrThrow(await this.svc.convert(safeInt(id, 0), body.notes));
  }

  @Post(':id/activities')
  @UsePipes(new ZodValidationPipe(SdAddLeadActivitySchema))
  @Roles(...SD_WRITE_ROLES)
  async addActivity(@Param('id') id: string, @Body() body: SdAddLeadActivityDto) {
    return unwrapOrThrow(await this.svc.addActivity(safeInt(id, 0), body.type, body.subject, body.notes, body.employee_id));
  }

  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getActivities(safeInt(id, 0)));
  }
}
