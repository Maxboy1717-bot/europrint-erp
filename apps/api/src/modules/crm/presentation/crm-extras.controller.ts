/**
 * @module crm-extras.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired } from '@common/assertions';
import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { safeInt } from '../../hr/common/db-rows';import {  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmExtrasService } from '../application/crm-extras.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CreateCommentDtoSchema, CreateCommentDto, CreateTaskDtoSchema, CreateTaskDto } from './dto/crm-extras.dto';

const CRM_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'crm_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...CRM_ROLES)
@ApiTags('Crm Extras')
@Controller('crm')
export class CrmExtrasController {
  private readonly logger = new Logger(CrmExtrasController.name);

  constructor(private readonly svc: CrmExtrasService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List comments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('comments')
  async listComments(
    @Query('leadId') leadId?: string, @Query('dealId') dealId?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListComments = await this.svc.listComments(
      leadId ? safeInt(leadId, 0) : null,
      dealId ? safeInt(dealId, 0) : null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListComments);
    return _rListComments.data;
  }

  @ApiOperation({ summary: 'Create comment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('comments')
  @UsePipes(new ZodValidationPipe(CreateCommentDtoSchema))
  async createComment(@Body() body: CreateCommentDto) {
    assertRequired(body.text, await this.i18n.t('validation.textRequired'));
    const _rCreateComment = await this.svc.createComment(
      body.lead_id ? safeInt(body.lead_id, 0) : null,
      body.deal_id ? safeInt(body.deal_id, 0) : null,
      body.text,
      body.author_id ? safeInt(body.author_id, 0) : 1,
    );
    assertOk(_rCreateComment);
    return _rCreateComment.data;
  }

  @ApiOperation({ summary: 'Get history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('history')
  async getHistory(
    @Query('entityType') entityType?: string, @Query('entityId') entityId?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rGetHistory = await this.svc.getHistory(
      entityType ?? null,
      entityId ? safeInt(entityId, 0) : null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rGetHistory);
    return _rGetHistory.data;
  }

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @ApiOperation({ summary: 'Get pipeline' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pipeline')
  async getPipeline(@Query('stageId') stageId?: string) {
    return unwrapOrThrow(await this.svc.getPipeline(stageId ? safeInt(stageId, 0) : null));
  }

  @ApiOperation({ summary: 'List tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tasks')
  async listTasks(
    @Query('assignedTo') assignedTo?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListTasks = await this.svc.listTasks(
      assignedTo ? safeInt(assignedTo, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListTasks);
    return _rListTasks.data;
  }

  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('tasks')
  @UsePipes(new ZodValidationPipe(CreateTaskDtoSchema))
  async createTask(@Body() body: CreateTaskDto) {
    assertRequired(body.title, await this.i18n.t('errors.titleRequired'));
    return unwrapOrThrow(await this.svc.createTask(body));
  }

  @ApiOperation({ summary: 'List proposals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('proposals')
  async listProposals(
    @Query('dealId') dealId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return unwrapOrThrow(
      await this.svc.listProposals(
        safeInt(limit, 50),
        safeInt(offset, 0),
        dealId ? safeInt(dealId, 0) : null,
      ),
    );
  }

  @ApiOperation({ summary: 'Get nba' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('nba')
  async getNba(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return unwrapOrThrow(await this.svc.getNba(entityType ?? '', safeInt(entityId, 0)));
  }

  @ApiOperation({ summary: 'Get root' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getRoot() {
    return { module: 'crm', status: 'active' };
  }
}
