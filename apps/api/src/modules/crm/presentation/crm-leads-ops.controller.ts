/**
 * @module crm-leads-ops.controller
 * @description NestJS controller. HTTP route handlers; delegates exclusively to
 * CQRS handlers via CommandBus (Sprint 2 A.3 — single path per endpoint).
 *
 * Previously this controller called CrmLeadsOpsService.* directly. That service
 * is now retired; every operation is dispatched as a command:
 *   - PATCH /:id                    → UpdateLeadCommand
 *   - PATCH /:id/pipeline-stage     → UpdateLeadStageCommand
 *   - POST  /:id/convert            → ConvertLeadToDealCommand
 *   - DELETE /:id                   → DeleteLeadCommand
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { Body, Controller, Delete, Logger, NotFoundException, Param, Patch, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { isErr, type Result } from '@common/result';
import {
  UpdateLeadDtoSchema, UpdateLeadDto,
  UpdateLeadStageDtoSchema, UpdateLeadStageDto,
  ConvertLeadDtoSchema, ConvertLeadDto,
} from './dto/crm-leads-ops.dto';
import { UpdateLeadCommand } from '../application/commands/update-lead.handler';
import { UpdateLeadStageCommand } from '../application/commands/update-lead-stage.handler';
import { DeleteLeadCommand } from '../application/commands/delete-lead.handler';
import { ConvertLeadToDealCommand } from '../application/commands/convert-lead-to-deal.handler';

const CRM_WRITE_ROLES = ['sales_manager', 'super_admin', 'director', 'crm_manager'];
const DEFAULT_DAYS_TO_CLOSURE = 30;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm/leads')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
export class CrmLeadsOpsController {
  private readonly logger = new Logger(CrmLeadsOpsController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateLeadDtoSchema))
  async update(@Param('id') id: string, @Body() body: UpdateLeadDto) {
    const r = (await this.commandBus.execute(new UpdateLeadCommand(safeInt(id, 0), body))) as Result<unknown>;
    if (isErr(r)) {
      if (r.error.code === 'NOT_FOUND') throw new NotFoundException(r.error.message);
      throw new Error(r.error.message);
    }
    return r.data;
  }

  @Patch(':id/pipeline-stage')
  @UsePipes(new ZodValidationPipe(UpdateLeadStageDtoSchema))
  async updateStage(@Param('id') id: string, @Body() body: UpdateLeadStageDto) {
    const stageId = safeInt(body.stage_id, 0);
    const r = (await this.commandBus.execute(new UpdateLeadStageCommand(safeInt(id, 0), stageId, body.notes))) as Result<unknown>;
    if (isErr(r)) {
      if (r.error.code === 'NOT_FOUND') throw new NotFoundException(r.error.message);
      throw new Error(r.error.message);
    }
    return r.data;
  }

  @Post(':id/convert')
  @UsePipes(new ZodValidationPipe(ConvertLeadDtoSchema))
  async convert(@Param('id') id: string, @Body() body: ConvertLeadDto) {
    const defaultClosure = new Date();
    defaultClosure.setDate(defaultClosure.getDate() + DEFAULT_DAYS_TO_CLOSURE);
    const r = (await this.commandBus.execute(new ConvertLeadToDealCommand(
      safeInt(id, 0),
      Number(body.expected_amount ?? 0),
      defaultClosure,
    ))) as Result<unknown>;
    if (isErr(r)) {
      if (r.error.code === 'NOT_FOUND') throw new NotFoundException(r.error.message);
      throw new Error(r.error.message);
    }
    return r.data;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const r = (await this.commandBus.execute(new DeleteLeadCommand(safeInt(id, 0)))) as Result<unknown>;
    if (isErr(r)) {
      if (r.error.code === 'NOT_FOUND') throw new NotFoundException(r.error.message);
      throw new Error(r.error.message);
    }
    return r.data;
  }
}
