/**
 * @module requests.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Material Requests Controller
 * Bo'lim material so'rovlari
 */

import {Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Ip, ParseIntPipe, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { CurrentUser }       from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard }   from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { PosRequestService } from '../application/services/pos-request.service';

import {
  CreateMaterialRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  IssueFromRequestDto,
  RequestFilterDto,
  CreateTransferDto,
} from '../dto/request.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('POS — Material So\'rovlar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/requests')
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);
  constructor(private readonly requestService: PosRequestService) {}

  // ─── Ro'yxat ─────────────────────────────────────────────────────────────

  @Get()
  @RequirePermission('pos.requests.read')
  @ApiOperation({ summary: 'So\'rovlar ro\'yxati' })
  async findAll(@Query() filter: RequestFilterDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.requestService.findAll(filter, user.id, user.role));
  }

  // ─── Tafsilot ─────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('pos.requests.read')
  @ApiOperation({ summary: 'So\'rov tafsilotlari' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.requestService.findOne(id));
  }

  // ─── Yaratish ─────────────────────────────────────────────────────────────

  @Post()
  @RequirePermission('pos.requests.create')
  @ApiOperation({ summary: 'Material so\'rov yaratish (avtomatik pending ga o\'tadi)' })
  async createRequest(@Body() dto: CreateMaterialRequestDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.requestService.createRequest(dto, user.id, ip));
  }

  // ─── Tasdiqlash ───────────────────────────────────────────────────────────

  @Patch('approve')
  @RequirePermission('pos.requests.approve')
  @ApiOperation({ summary: 'So\'rovni tasdiqlash (bo\'lim mudiri)' })
  async approveRequest(@Body() dto: ApproveRequestDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.requestService.approveRequest(dto, user.id, ip));
  }

  // ─── Rad Etish ────────────────────────────────────────────────────────────

  @Patch('reject')
  @RequirePermission('pos.requests.approve')
  @ApiOperation({ summary: 'So\'rovni rad etish' })
  async rejectRequest(@Body() dto: RejectRequestDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.requestService.rejectRequest(dto, user.id, ip));
  }

  // ─── Berish ───────────────────────────────────────────────────────────────

  @Post('issue')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'So\'rovdan material berish (INTERNAL_ISSUE harakati yaratadi)' })
  async issueFromRequest(@Body() dto: IssueFromRequestDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.requestService.issueFromRequest(dto, user.id, ip));
  }
}
