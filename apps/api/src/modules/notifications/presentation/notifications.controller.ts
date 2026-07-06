/**
 * @module notifications.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors, BadRequestException, InternalServerErrorException, UseGuards} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles} from '@common/decorators/roles.decorator';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CreateNotificationCommand} from '../application/commands/create-notification.command';
import { GetNotificationsQuery} from '../application/queries/get-notifications.query';
import { CreateNotificationDto} from './dto/notification.dto';
import { NotificationPreferencesService } from '../application/notification-preferences.service';
import { parseNotificationPreferences } from './dto/notification-preferences.dto';
import { NOTIFICATION_REPO, INotificationRepo } from '../domain/repositories/i-notification.repo';

@ApiThrottle()
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@UseInterceptors(AuditInterceptor)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prefsSvc: NotificationPreferencesService,
    @Inject(NOTIFICATION_REPO) private readonly notifRepo: INotificationRepo,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List notifications' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async listNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string) {
    const filters = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    const result = await this.queryBus.execute(new GetNotificationsQuery(String(user.id), filters));
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('/my')
  async getUserNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string) {
    const filters = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    const result = await this.queryBus.execute(
      new GetNotificationsQuery(String(user.id), filters));
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get unread count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('/my/unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.notifRepo.findUnreadCount(String(user.id));
    const unreadCount = result.ok ? (result.data ?? 0) : 0;
    return { statusCode: HttpStatus.OK, data: { unreadCount } };
  }

  @ApiOperation({ summary: 'Mark all read my' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/my/mark-all-read')
  async markAllReadMy(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prefsSvc.markAllRead(user.id);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @ApiOperation({ summary: 'Get preferences' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('/preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prefsSvc.getPreferences(user.id);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @ApiOperation({ summary: 'Update preferences' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('/preferences')
  async updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseNotificationPreferences(body);
    const result = await this.prefsSvc.updatePreferences(user.id, dto);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @ApiOperation({ summary: 'Mark as read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('/:id/read')
  async markAsRead(@Param('id') notificationId: string) {
    const result = await this.notifRepo.markAsRead(notificationId);
    if (!result.ok) throw new NotFoundException(await this.i18n.t('errors.notificationNotFoundWithId', { args: { id: notificationId } }));
    return { statusCode: HttpStatus.OK, data: { id: notificationId, isRead: true } };
  }

  @ApiOperation({ summary: 'Mark all as read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('/read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log({ userId: user.id }, 'Mark all notifications as read');
    const result = await this.notifRepo.markAllAsRead(String(user.id));
    const updated = result.ok ? (result.data ?? 0) : 0;
    return { statusCode: HttpStatus.OK, data: { updated } };
  }

  @ApiOperation({ summary: 'Patch mark all read my' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('/my/mark-all-read')
  async patchMarkAllReadMy(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prefsSvc.markAllRead(user.id);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @ApiOperation({ summary: 'Patch preferences' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('/preferences')
  async patchPreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseNotificationPreferences(body);
    const result = await this.prefsSvc.updatePreferences(user.id, dto);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('admin', 'super_admin')
  async createNotification(@Body() dto: CreateNotificationDto) {
    const cmd = new CreateNotificationCommand(
      dto.userId, dto.title, dto.body, dto.type, dto.referenceId, dto.referenceType);
    const result = await this.commandBus.execute(cmd);
    assertOk(result);
    this.logger.log({ notificationId: result.data.id, userId: dto.userId }, 'Notification created');
    return result.data;
  }
}
