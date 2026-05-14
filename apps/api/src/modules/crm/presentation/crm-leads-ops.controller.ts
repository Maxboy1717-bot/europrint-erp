/**
 * @module crm-leads-ops.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { BadRequestException, Body, Controller, Delete, Logger, NotFoundException, Param, Patch, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmLeadsOpsService } from '../application/crm-leads-ops.service';
import {
  UpdateLeadDtoSchema, UpdateLeadDto,
  UpdateLeadStageDtoSchema, UpdateLeadStageDto,
  ConvertLeadDtoSchema, ConvertLeadDto,
} from './dto/crm-leads-ops.dto';

const CRM_WRITE_ROLES = ['sales_manager', 'super_admin', 'director', 'crm_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm/leads')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
export class CrmLeadsOpsController {
  private readonly logger = new Logger(CrmLeadsOpsController.name);

  constructor(private readonly svc: CrmLeadsOpsService) {}

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateLeadDtoSchema))
  async update(@Param('id') id: string, @Body() body: UpdateLeadDto) {
        const _rR = await this.svc.update(safeInt(id, 0), body);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Lead not found');
    return r[0];
  }

  @Patch(':id/pipeline-stage')
  @UsePipes(new ZodValidationPipe(UpdateLeadStageDtoSchema))
  async updateStage(@Param('id') id: string, @Body() body: UpdateLeadStageDto) {
    const stageId = safeInt(body.stage_id, 0);
    assertRequired(stageId, 'stage_id required');
        const _rR = await this.svc.updateStage(safeInt(id, 0), stageId, body.notes);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Lead stage not found');
    assertFound(r, 'Lead not found');
    return r[0];
  }

  @Post(':id/convert')
  @UsePipes(new ZodValidationPipe(ConvertLeadDtoSchema))
  async convert(@Param('id') id: string, @Body() body: ConvertLeadDto) {
    const _rConvert = await this.svc.convert(safeInt(id, 0), body.deal_name, body.expected_amount);
    assertOk(_rConvert);
    const r = _rConvert.data as Record<string, unknown>;
    assertFound(r, 'Lead not found');
    return r;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const _rDelete = await this.svc.delete(safeInt(id, 0));
    assertOk(_rDelete);
    const ok = _rDelete.data as Record<string, unknown>;
    assertFound(ok, 'Lead not found');
    return { deleted: true, id: safeInt(id, 0) };
  }
}
