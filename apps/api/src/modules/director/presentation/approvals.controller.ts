import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Role } from '@common/constants/roles.constants';
import { HitlDocumentType } from '../domain/enums/hitl-document-type.enum';
import { ApprovalRequest } from '../domain/aggregates/approval-request.aggregate';
import { CreateApprovalRequestCommand } from '../application/commands/create-approval-request.command';
import { ApproveRequestCommand } from '../application/commands/approve-request.command';
import { RejectRequestCommand } from '../application/commands/reject-request.command';
import { GetPendingApprovalsQuery } from '../application/queries/get-pending-approvals.query';
import { GetApprovalHistoryQuery } from '../application/queries/get-approval-history.query';
import {
  CreateApprovalRequestDto,
  CreateApprovalRequestDtoSchema,
  ApproveDto,
  ApproveDtoSchema,
  RejectDto,
  RejectDtoSchema,
  GetPendingDto,
  GetPendingDtoSchema,
  ApprovalResponse,
} from './dto/approval.dto';

@ApiTags('Director — HITL Approvals')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('director/approvals')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ApprovalsController {
  private readonly logger = new Logger(ApprovalsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Get all approvals (root — returns pending list)' })
  async getApprovals(@Query() query: GetPendingDto) {
    const parsedQuery = GetPendingDtoSchema.parse(query);
    const result = await this.queryBus.execute(
      new GetPendingApprovalsQuery(
        parsedQuery.documentType as HitlDocumentType | undefined,
        parsedQuery.page,
        parsedQuery.limit,
      ),
    );
    assertOk(result);
    return {
      items: (result?.data?.items ?? []).map((item: ApprovalRequest) => this.mapToResponse(item)),
      total: result.data.total,
    };
  }

  @Get('pending')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Get pending HITL approvals' })
  async getPendingApprovals(@Query() query: GetPendingDto) {
    const parsedQuery = GetPendingDtoSchema.parse(query);
    const result = await this.queryBus.execute(
      new GetPendingApprovalsQuery(
        parsedQuery.documentType as HitlDocumentType | undefined,
        parsedQuery.page,
        parsedQuery.limit,
      ),
    );
    assertOk(result);
    return {
      items: (result?.data?.items ?? []).map((item: ApprovalRequest) => this.mapToResponse(item)),
      total: result.data.total,
    };
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Get approval statistics' })
  async getStats(@CurrentUser() _user: AuthenticatedUser) {
    const result = await this.queryBus.execute(new GetPendingApprovalsQuery());
    assertOk(result);
    return {
      pending: result.data.total,
      approvedToday: 0,
      rejectedToday: 0,
      avgApprovalTimeHours: 0,
    };
  }

  @Get('history')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get approval history' })
  async getHistory(@Query() query: GetPendingDto) {
    const parsedQuery = GetPendingDtoSchema.parse(query);
    const result = await this.queryBus.execute(
      new GetApprovalHistoryQuery(
        parsedQuery.documentType as HitlDocumentType | undefined,
        undefined,
        parsedQuery.page,
        parsedQuery.limit,
      ),
    );
    assertOk(result);
    return {
      items: (result?.data?.items ?? []).map((item: ApprovalRequest) => this.mapToResponse(item)),
      total: result.data.total,
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER, Role.PRODUCTION_MANAGER)
  @ApiOperation({ summary: 'Request approval for a document' })
  async create(@Body() body: CreateApprovalRequestDto, @CurrentUser() user: AuthenticatedUser) {
    const parsedBody = CreateApprovalRequestDtoSchema.parse(body);
    const result = await this.commandBus.execute(
      new CreateApprovalRequestCommand(
        parsedBody.documentType as HitlDocumentType,
        parsedBody.documentId,
        parsedBody.documentNumber || null,
        parsedBody.amount,
        parsedBody.currency,
        String(user.id),
        parsedBody.notes || null,
      ),
    );
    assertOk(result);
    return this.mapToResponse(result.data);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Approve a pending request' })
  async approve(@Param('id') id: string, @Body() body: ApproveDto, @CurrentUser() user: AuthenticatedUser) {
    const parsedBody = ApproveDtoSchema.parse(body);
    const result = await this.commandBus.execute(new ApproveRequestCommand(id, String(user.id), parsedBody.notes));
    assertOk(result);
    return this.mapToResponse(result.data);
  }

  @Patch(':id/reject')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Reject a pending request' })
  async reject(@Param('id') id: string, @Body() body: RejectDto, @CurrentUser() user: AuthenticatedUser) {
    const parsedBody = RejectDtoSchema.parse(body);
    const result = await this.commandBus.execute(new RejectRequestCommand(id, String(user.id), parsedBody.reason));
    assertOk(result);
    return this.mapToResponse(result.data);
  }

  private mapToResponse(approval: ApprovalRequest): ApprovalResponse {
    return {
      id: approval.id,
      documentType: approval.documentType,
      documentId: approval.documentId,
      documentNumber: approval.documentNumber,
      amount: approval.amount,
      currency: approval.currency,
      status: approval.status,
      requestedBy: approval.requestedBy,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      rejectedBy: approval.rejectedBy,
      rejectedAt: approval.rejectedAt,
      rejectionReason: approval.rejectionReason,
      notes: approval.notes,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
    };
  }
}
