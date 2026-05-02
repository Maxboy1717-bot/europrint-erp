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
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmExtrasService } from '../application/crm-extras.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CreateCommentDtoSchema, CreateCommentDto, CreateTaskDtoSchema, CreateTaskDto } from './dto/crm-extras.dto';

const CRM_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'crm_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...CRM_ROLES)
@Controller('crm')
export class CrmExtrasController {
  private readonly logger = new Logger(CrmExtrasController.name);

  constructor(private readonly svc: CrmExtrasService) {}

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

  @Post('comments')
  @UsePipes(new ZodValidationPipe(CreateCommentDtoSchema))
  async createComment(@Body() body: CreateCommentDto) {
    assertRequired(body.text, 'text required');
    const _rCreateComment = await this.svc.createComment(
      body.lead_id ? safeInt(body.lead_id, 0) : null,
      body.deal_id ? safeInt(body.deal_id, 0) : null,
      body.text,
      body.author_id ? safeInt(body.author_id, 0) : 1,
    );
    assertOk(_rCreateComment);
    return _rCreateComment.data;
  }

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

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @Get('pipeline')
  async getPipeline(@Query('stageId') stageId?: string) {
    return unwrapOrThrow(await this.svc.getPipeline(stageId ? safeInt(stageId, 0) : null));
  }

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

  @Post('tasks')
  @UsePipes(new ZodValidationPipe(CreateTaskDtoSchema))
  async createTask(@Body() body: CreateTaskDto) {
    assertRequired(body.title, 'title required');
    return unwrapOrThrow(await this.svc.createTask(body));
  }

  @Get('proposals')
  async listProposals(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listProposals(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('nba')
  async getNba(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return unwrapOrThrow(await this.svc.getNba(entityType ?? '', safeInt(entityId, 0)));
  }

  @Get()
  async getRoot() {
    return { module: 'crm', status: 'active' };
  }
}
