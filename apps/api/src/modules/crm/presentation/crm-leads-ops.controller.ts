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
import { safeInt } from '@common/db/db-rows';
import { Body, Controller, Delete, Logger, Param, Patch, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { type Result } from '@common/result';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Leads Ops')
@Controller('crm/leads')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
export class CrmLeadsOpsController {
  private readonly logger = new Logger(CrmLeadsOpsController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateLeadDtoSchema))
  async update(@Param('id') id: string, @Body() body: UpdateLeadDto) {
    const r = await this.commandBus.execute<UpdateLeadCommand, Result<Record<string, unknown>>>(
      new UpdateLeadCommand(safeInt(id, 0), body),
    );
    return unwrapOrThrow(r);
  }

  @ApiOperation({ summary: 'Update stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/pipeline-stage')
  @UsePipes(new ZodValidationPipe(UpdateLeadStageDtoSchema))
  async updateStage(@Param('id') id: string, @Body() body: UpdateLeadStageDto) {
    const stageId = safeInt(body.stage_id, 0);
    const r = await this.commandBus.execute<UpdateLeadStageCommand, Result<Record<string, unknown>>>(
      new UpdateLeadStageCommand(safeInt(id, 0), stageId, body.notes),
    );
    return unwrapOrThrow(r);
  }

  @ApiOperation({ summary: 'Convert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/convert')
  @UsePipes(new ZodValidationPipe(ConvertLeadDtoSchema))
  async convert(@Param('id') id: string, @Body() body: ConvertLeadDto) {
    const defaultClosure = new Date();
    defaultClosure.setDate(defaultClosure.getDate() + DEFAULT_DAYS_TO_CLOSURE);
    const r = await this.commandBus.execute<ConvertLeadToDealCommand, Result<{ leadId: number; dealId: number }>>(
      new ConvertLeadToDealCommand(
        safeInt(id, 0),
        Number(body.expected_amount ?? 0),
        defaultClosure,
      ),
    );
    return unwrapOrThrow(r);
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const r = await this.commandBus.execute<DeleteLeadCommand, Result<{ deleted: true; id: number }>>(
      new DeleteLeadCommand(safeInt(id, 0)),
    );
    return unwrapOrThrow(r);
  }
}
