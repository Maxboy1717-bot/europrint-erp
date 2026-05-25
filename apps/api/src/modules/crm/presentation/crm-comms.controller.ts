/**
 * @module crm-comms.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertRequired } from '@common/assertions';
import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmCommsService } from '../application/crm-comms.service';
import {
  SendEmailDtoSchema, SendEmailDto,
  ScheduleMeetingDtoSchema, ScheduleMeetingDto,
  SendSmsDtoSchema, SendSmsDto,
  SendWhatsappDtoSchema, SendWhatsappDto,
} from './dto/crm-comms.dto';

const CRM_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin', 'crm_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Comms')
@Controller('crm')
@UseGuards(RolesGuard)
@Roles(...CRM_ROLES)
export class CrmCommsController {
  private readonly logger = new Logger(CrmCommsController.name);

  constructor(private readonly svc: CrmCommsService) {}

  @ApiOperation({ summary: 'Send email' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('email/send')
  @UsePipes(new ZodValidationPipe(SendEmailDtoSchema))
  async sendEmail(@Body() body: SendEmailDto) {
    assertRequired(body.to, 'to and subject required');
    assertRequired(body.subject, 'to and subject required');
    return unwrapOrThrow(await this.svc.sendEmail(body.to, body.subject, body.body ?? '', body.lead_id ?? null, body.deal_id ?? null));
  }

  @ApiOperation({ summary: 'Schedule meeting' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('meetings/schedule')
  @UsePipes(new ZodValidationPipe(ScheduleMeetingDtoSchema))
  async scheduleMeeting(@Body() body: ScheduleMeetingDto) {
    assertRequired(body.title, 'title required');
    const _rScheduleMeeting = await this.svc.scheduleMeeting(
      body.title,
      body.lead_id ?? null,
      body.deal_id ?? null,
      body.scheduled_at ?? _time.now().toISOString(),
      body.attendees ?? [],
    );
    assertOk(_rScheduleMeeting);
    return _rScheduleMeeting.data;
  }

  @ApiOperation({ summary: 'Send sms' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sms/send')
  @UsePipes(new ZodValidationPipe(SendSmsDtoSchema))
  async sendSms(@Body() body: SendSmsDto) {
    assertRequired(body.phone, 'phone and message required');
    assertRequired(body.message, 'phone and message required');
    return unwrapOrThrow(await this.svc.sendSms(body.phone, body.message, body.lead_id ?? null));
  }

  @ApiOperation({ summary: 'Send whatsapp' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('whatsapp/send')
  @UsePipes(new ZodValidationPipe(SendWhatsappDtoSchema))
  async sendWhatsapp(@Body() body: SendWhatsappDto) {
    assertRequired(body.phone, 'phone and message required');
    assertRequired(body.message, 'phone and message required');
    return unwrapOrThrow(await this.svc.sendWhatsapp(body.phone, body.message, body.lead_id ?? null));
  }
}
