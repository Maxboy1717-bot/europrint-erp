import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors, BadRequestException, InternalServerErrorException, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles} from '@common/decorators/roles.decorator';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CreateNotificationCommand} from '../application/commands/create-notification.command';
import { GetNotificationsQuery} from '../application/queries/get-notifications.query';
import { CreateNotificationDto} from './dto/notification.dto';
import { NotificationPreferencesService } from '../application/notification-preferences.service';
import { parseNotificationPreferences } from './dto/notification-preferences.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
    private readonly prefsSvc: NotificationPreferencesService) {}

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

  @Get('/my/unread-count')
  async getUnreadCount(@CurrentUser() _user: AuthenticatedUser) {
    return { statusCode: HttpStatus.OK, data: { unreadCount: 0 } };
  }

  @Post('/my/mark-all-read')
  async markAllReadMy(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prefsSvc.markAllRead(user.id);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @Get('/preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.prefsSvc.getPreferences(user.id);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @Put('/preferences')
  async updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseNotificationPreferences(body);
    const result = await this.prefsSvc.updatePreferences(user.id, dto);
    assertOk(result);
    return { statusCode: HttpStatus.OK, data: result.data };
  }

  @Patch('/:id/read')
  async markAsRead(@Param('id') notificationId: string) {
    return { statusCode: HttpStatus.OK, data: { id: notificationId, isRead: true } };
  }

  @Patch('/read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log({ userId: user.id }, 'Mark all notifications as read');
    return { statusCode: HttpStatus.OK, data: { updated: 0 } };
  }

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
