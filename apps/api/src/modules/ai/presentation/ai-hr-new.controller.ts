/**
 * @module ai-hr-new.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus,
  BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '../../auth/guards/roles.guard';
import { Roles }       from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { Role }        from '../../auth/types/role';
import { unwrapOrBadRequest } from '@common/http-result';
import { AiHrNewService } from '../application/services/ai-hr-new.service';
import { CreateAiInterviewDto } from './dto/ai-hr-new.dto';

@ApiTags('§15 AI HR New')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-hr')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
export class AiHrNewController {
  private readonly logger = new Logger(AiHrNewController.name);

  constructor(
    private readonly service: AiHrNewService,
    private readonly i18n: I18nService,
  ) {}

  @Get('interviews')
  @ApiOperation({ summary: 'AI HR intervyular ro`yxati' })
  async getInterviews(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrBadRequest(await this.service.getInterviews(Number(page), Number(limit)));
  }

  @Post('interviews')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi AI HR intervyu yaratish' })
  async createInterview(@Body() dto: CreateAiInterviewDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrBadRequest(await this.service.createInterview(dto, String(user.id)));
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'AI HR dashboard statistikasi' })
  async getDashboard() {
    return unwrapOrBadRequest(await this.service.getDashboard());
  }

  @Get('providers')
  @ApiOperation({ summary: 'AI provayderlar konfiguratsiyasi' })
  async getProviders() {
    return unwrapOrBadRequest(await this.service.getProviders());
  }

  @Get('usage/budget')
  @ApiOperation({ summary: 'AI foydalanish byudjeti' })
  async getUsageBudget() {
    return unwrapOrBadRequest(await this.service.getUsageBudget());
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'AI vazifa tafsiloti' })
  async getTaskById(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.service.getTaskById(id));
  }

  // P1.7.1: POST /api/ai-hr/tasks/:taskType — submit an HR AI task by FE task key
  @Post('tasks/:taskType')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'HR AI vazifasini yuborish (FE task key orqali)' })
  async submitTask(
    @Param('taskType') taskType: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!taskType || typeof taskType !== 'string') {
      throw new BadRequestException(await this.i18n.t('validation.taskTypeRequired'));
    }
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    return unwrapOrBadRequest(await this.service.submitTask(taskType, payload, String(user.id)));
  }
}
