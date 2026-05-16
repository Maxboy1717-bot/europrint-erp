/**
 * @module crm-bitrix-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmBitrixCompatService } from '../application/crm-bitrix-compat.service';
import { CreateRobotDtoSchema, CreateRobotDto, UpdateRobotDtoSchema, UpdateRobotDto } from './dto/crm-bitrix-compat.dto';
import { z } from 'zod';

const UpdateStageSchema = z.object({
  status: z.string().optional(),
  stageId: z.string().optional(),
  stage_id: z.string().optional(),
}).passthrough();

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const BITRIX_ROLES = ['admin', 'manager', 'hr_manager', 'director', 'super_admin'];

@UseGuards(RolesGuard)
@Roles(...BITRIX_ROLES)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('crm-bitrix')
export class CrmBitrixCompatController {
  private readonly logger = new Logger(CrmBitrixCompatController.name);

  constructor(private readonly svc: CrmBitrixCompatService) {}

  @Get('proposals')
  async listProposals(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listProposals(lim, off));
  }

  @Get('invoices')
  async listInvoices(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listInvoices(lim, off));
  }

  @Get('robots')
  async listRobots(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listRobots(lim, off));
  }

  @Get('robots/:id')
  async getRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getRobot(parseInt(id, 10) || 0));
  }

  @Post('robots')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(CreateRobotDtoSchema))
  async createRobot(@Body() body: CreateRobotDto) {
    return unwrapOrThrow(await this.svc.createRobot(body));
  }

  @Put('robots/:id')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(UpdateRobotDtoSchema))
  async updateRobot(@Param('id') id: string, @Body() body: UpdateRobotDto) {
    return unwrapOrThrow(await this.svc.updateRobot(parseInt(id, 10) || 0, body));
  }

  @Patch('robots/:id/toggle')
  @Roles('super_admin', 'director', 'manager')
  async toggleRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.toggleRobot(parseInt(id, 10) || 0));
  }

  @Delete('robots/:id')
  @Roles('super_admin', 'director')
  async deleteRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRobot(parseInt(id, 10) || 0));
  }

  @Patch('robots/:id')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(UpdateRobotDtoSchema))
  async patchRobot(@Param('id') id: string, @Body() body: UpdateRobotDto) {
    return unwrapOrThrow(await this.svc.updateRobot(parseInt(id, 10) || 0, body));
  }

  @Post('robots/:id/toggle')
  @Roles('super_admin', 'director', 'manager')
  async postToggleRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.toggleRobot(parseInt(id, 10) || 0));
  }

  @Patch('proposals/:id/stage')
  async updateProposalStage(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateStageSchema.parse(body);
    const status = String(dto.status ?? dto.stageId ?? dto.stage_id ?? '');
    return unwrapOrThrow(await this.svc.updateProposalStage(parseInt(id, 10) || 0, status));
  }

  @Patch('invoices/:id/stage')
  async updateInvoiceStage(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateStageSchema.parse(body);
    const status = String(dto.status ?? dto.stageId ?? dto.stage_id ?? '');
    return unwrapOrThrow(await this.svc.updateInvoiceStage(parseInt(id, 10) || 0, status));
  }
}
