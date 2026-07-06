/**
 * @module telegram-bots.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller, Get, Post, Body, Headers, Logger, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { TelegramBotsService } from './telegram-bots.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { requireInternalSecret } from '@common/internal-secret';
import {
  TelegramSendMessageSchema, TelegramSendMessageDto,
  TelegramBroadcastSchema, TelegramBroadcastDto,
  TelegramVacancyPublishedSchema, TelegramVacancyPublishedDto,
  TelegramNotifyEmployeeSchema, TelegramNotifyEmployeeDto,
  TelegramNotifyHrSchema, TelegramNotifyHrDto,
} from './dto/telegram-bots.dto';
import { unwrapOrInternal } from '@common/http-result';

@Roles('admin', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Telegram Bots')
@ApiBearerAuth()
@Controller('hr-v2/telegram-bots')
export class TelegramBotsController {
  private readonly logger = new Logger(TelegramBotsController.name);
  constructor(
    private readonly svc: TelegramBotsService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Get status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('status')
  getStatus() {
    return { bots: this.svc.getBotStatus(), timestamp: _time.now() };
  }

  @ApiOperation({ summary: 'Send message' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('send')
  @UsePipes(new ZodValidationPipe(TelegramSendMessageSchema))
  async sendMessage(
    @Headers('x-internal-secret') secret: string,
    @Body() body: TelegramSendMessageDto
  ) {
    requireInternalSecret(secret, await this.i18n.t('errors.internalSecretMissingOrInvalid'));
    return unwrapOrInternal(await this.svc.sendMessage(body.bot_type, String(body.chat_id), body.message));
  }

  @ApiOperation({ summary: 'Broadcast' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('broadcast')
  @UsePipes(new ZodValidationPipe(TelegramBroadcastSchema))
  async broadcast(@Body() body: TelegramBroadcastDto) {
    return unwrapOrInternal(await this.svc.broadcastToAll(body.bot_type || 'notification', body.message));
  }

  @ApiOperation({ summary: 'Internal vacancy published' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('internal-vacancy-published')
  @UsePipes(new ZodValidationPipe(TelegramVacancyPublishedSchema))
  async internalVacancyPublished(
    @Headers('x-internal-secret') secret: string,
    @Body() body: TelegramVacancyPublishedDto
  ) {
    requireInternalSecret(secret, await this.i18n.t('errors.internalSecretMissingOrInvalid'));
    await this.svc.onInternalVacancyPublished(body);
    return {};
  }

  @ApiOperation({ summary: 'Notify employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('notify-employee')
  @UsePipes(new ZodValidationPipe(TelegramNotifyEmployeeSchema))
  async notifyEmployee(
    @Headers('x-internal-secret') secret: string,
    @Body() body: TelegramNotifyEmployeeDto
  ) {
    requireInternalSecret(secret, await this.i18n.t('errors.internalSecretMissingOrInvalid'));
    await this.svc.notifyEmployee(body.employeeId, body.message);
    return {};
  }

  @ApiOperation({ summary: 'Notify hr' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('notify-hr')
  @UsePipes(new ZodValidationPipe(TelegramNotifyHrSchema))
  async notifyHr(
    @Headers('x-internal-secret') secret: string,
    @Body() body: TelegramNotifyHrDto
  ) {
    requireInternalSecret(secret, await this.i18n.t('errors.internalSecretMissingOrInvalid'));
    await this.svc.notifyHrGroup(body.message);
    return {};
  }
}
