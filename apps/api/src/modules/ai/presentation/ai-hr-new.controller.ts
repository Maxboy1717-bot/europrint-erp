/**
 * @module ai-hr-new.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-hr')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
export class AiHrNewController {
  private readonly logger = new Logger(AiHrNewController.name);

  constructor(private readonly service: AiHrNewService) {}

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
}
