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
  Res,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { Public } from '@common/decorators/public.decorator';
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

// CRM-13#5: static 1x1 transparent GIF served by the public KP-view pixel endpoint below.
const TRANSPARENT_GIF_1X1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64',
);

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

  // CRM-13#5 — KP pixel tracking: the emailed proposal (KP) embeds this URL as an <img> tag;
  // when the recipient's mail client loads it, we idempotently stamp viewed_at once (mirrors
  // CC #47 markViewed's "WHERE viewed_at IS NULL" first-view pattern — see
  // cc-documents-write.repo.ts). The write is best-effort and its Result is intentionally not
  // checked: the pixel must always render even if the DB write fails, so it never shows as a
  // broken image. Public: the recipient has no ERP session to authenticate with.
  @Public()
  @Get('proposals/:id/view.gif')
  async proposalViewPixel(@Param('id') id: string, @Res() res: FastifyReply) {
    const proposalId = parseInt(id, 10) || 0;
    if (proposalId > 0) {
      await this.svc.markProposalViewed(proposalId);
    }
    res
      .header('Content-Type', 'image/gif')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate')
      .header('X-Content-Type-Options', 'nosniff')
      .send(TRANSPARENT_GIF_1X1);
  }

  @Patch('invoices/:id/stage')
  async updateInvoiceStage(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateStageSchema.parse(body);
    const status = String(dto.status ?? dto.stageId ?? dto.stage_id ?? '');
    // invoices.id is a uuid — pass the raw id (parseInt(id) -> NaN -> 0 matched nothing).
    return unwrapOrThrow(await this.svc.updateInvoiceStage(id, status));
  }

  @Delete('proposals/:id')
  @Roles('super_admin', 'director', 'manager')
  async deleteProposal(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteProposal(parseInt(id, 10) || 0));
  }

  @Delete('invoices/:id')
  @Roles('super_admin', 'director', 'manager')
  async deleteInvoice(@Param('id') id: string) {
    // invoices.id is a uuid — pass the raw id (parseInt(id) -> NaN -> 0 matched nothing).
    return unwrapOrThrow(await this.svc.deleteInvoice(id));
  }
}
