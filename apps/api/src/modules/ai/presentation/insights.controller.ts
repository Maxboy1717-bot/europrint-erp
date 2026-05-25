/**
 * @module insights.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '../../auth/guards/roles.guard';
import { Roles }       from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { Role }        from '../../auth/types/role';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { InsightsService } from '../application/services/insights.service';
import { GenerateInsightDto, InsightItem } from './dto/ai-insights.dto';

@ApiTags('§15 AI Insights')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insights')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
export class InsightsController {
  private readonly logger = new Logger(InsightsController.name);

  constructor(private readonly service: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha AI tushunchalar ro`yxati' })
  async getAll(@CurrentUser() user: AuthenticatedUser) {
    const r = await this.service.getAll(String(user.id));
    return r.ok ? { items: r.data, total: r.data.length } : { items: [] as InsightItem[], total: 0 };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'AI tushunchalar umumiy ko`rinishi' })
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    const r = await this.service.getAll(String(user.id));
    const all = r.ok ? r.data : [];
    const unread = (Array.isArray(all) ? all : []).filter((i) => !i.isRead).length;
    return { total: all.length, unread, read: all.length - unread };
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi AI tushuncha generatsiya qilish' })
  async generate(@Body() dto: GenerateInsightDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrBadRequest(await this.service.generate(dto.module, String(user.id)));
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Tushunchani o`qilgan deb belgilash' })
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrNotFound(await this.service.markRead(id, String(user.id)));
  }
}
