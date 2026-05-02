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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MmVendorsPrService } from '../application/mm-vendors-pr.service';
import {
  MmCreateVendorSchema, MmCreateVendorDto,
  MmUpdateVendorSchema, MmUpdateVendorDto,
  MmCreateRequisitionSchema, MmCreateRequisitionDto,
  MmUpdateRequisitionSchema, MmUpdateRequisitionDto,
} from '../dto/mm.dto';

const MM_WRITE_ROLES = ['ERP_MANAGER', 'mm_manager', 'warehouse_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('mm')
export class MmVendorsPrController {
  private readonly logger = new Logger(MmVendorsPrController.name);

  constructor(private readonly svc: MmVendorsPrService) {}

  @Get('vendors')
  async listVendors(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listVendors(search, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('vendors/:id')
  async getVendor(@Param('id') id: string) {
    const _rR = await this.svc.getVendor(safeInt(id, 0));
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Vendor not found');
    return r[0];
  }

  @Post('vendors')
  @UsePipes(new ZodValidationPipe(MmCreateVendorSchema))
  @Roles(...MM_WRITE_ROLES)
  async createVendor(@Body() body: MmCreateVendorDto) {
    assertRequired((body as Record<string, unknown>).name, 'name required');
    return unwrapOrThrow(await this.svc.createVendor(body));
  }

  @Patch('vendors/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateVendorSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateVendor(@Param('id') id: string, @Body() body: MmUpdateVendorDto) {
    const _rR = await this.svc.updateVendor(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Vendor not found');
    return r[0];
  }

  @Delete('vendors/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteVendor(@Param('id') id: string) {
    await this.svc.deleteVendor(safeInt(id, 0));
    return { deleted: true, id: safeInt(id, 0) };
  }

  @Get('purchase-requisitions')
  async listRequisitions(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listRequisitions(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('purchase-requisitions/:id')
  async getRequisition(@Param('id') id: string) {
    const _rGetRequisition = await this.svc.getRequisition(safeInt(id, 0));
    assertOk(_rGetRequisition);
    const r = _rGetRequisition.data as Record<string, unknown>;
    assertFound(r, 'Requisition not found');
    return r;
  }

  @Post('purchase-requisitions')
  @UsePipes(new ZodValidationPipe(MmCreateRequisitionSchema))
  @Roles(...MM_WRITE_ROLES)
  async createRequisition(@Body() body: MmCreateRequisitionDto, @CurrentUser() user: Record<string, unknown>) {
    assertRequired((body as Record<string, unknown>).title, 'title required');
    return unwrapOrThrow(await this.svc.createRequisition(body.title, (user?.id as number) ?? null, body.needed_by, body.notes, (body.items ?? []) as Array<Record<string, unknown>>));
  }

  @Patch('purchase-requisitions/:id')
  @UsePipes(new ZodValidationPipe(MmUpdateRequisitionSchema))
  @Roles(...MM_WRITE_ROLES)
  async updateRequisition(@Param('id') id: string, @Body() body: MmUpdateRequisitionDto) {
    const _rR = await this.svc.updateRequisition(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Requisition not found');
    return r[0];
  }

  @Delete('purchase-requisitions/:id')
  @UseGuards(RolesGuard)
  @Roles(...MM_WRITE_ROLES)
  async deleteRequisition(@Param('id') id: string) {
    await this.svc.deleteRequisition(safeInt(id, 0));
    return {};
  }
}
