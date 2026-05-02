import { assertFound, assertRequired } from '@common/assertions';
import { BadRequestException, Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { KaizenService } from '../application/kaizen.service';
import {
  KaizenCreateSuggestionSchema, KaizenCreateSuggestionDto,
  KaizenUpdateSuggestionSchema, KaizenUpdateSuggestionDto,
} from './dto/director.dto';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const REVIEW_ROLES = ['director', 'hr_manager', 'department_head', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('kaizen')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('director', 'super_admin', 'manager', 'employee')
export class KaizenController {
  private readonly logger = new Logger(KaizenController.name);

  constructor(private readonly svc: KaizenService) {}

  @Post('suggestions')
  @UsePipes(new ZodValidationPipe(KaizenCreateSuggestionSchema))
  async createSuggestion(
    @Body() body: KaizenCreateSuggestionDto,
    @CurrentUser() user: { id: number },
  ) {
    const { title, description, category, expected_benefit } = body;
    assertRequired(title, 'title va description majburiy');
    assertRequired(description, 'title va description majburiy');
    return unwrapOrInternal(await this.svc.createSuggestion(title, description, category ?? 'general', expected_benefit ?? null, user.id));
  }

  @Get('suggestions')
  async listSuggestions(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.listSuggestions(status ?? null, category ?? null, lim, off));
  }

  @Get('suggestions/:id')
  async getSuggestion(@Param('id') id: string) {
    const _rData = await this.svc.getSuggestion(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @Patch('suggestions/:id')
  @Roles(...REVIEW_ROLES)
  @UsePipes(new ZodValidationPipe(KaizenUpdateSuggestionSchema))
  async updateSuggestion(
    @Param('id') id: string,
    @Body() body: KaizenUpdateSuggestionDto,
    @CurrentUser() user: { id: number },
  ) {
    const { status, review_comment, implementation_notes } = body;
    return unwrapOrInternal(await this.svc.updateSuggestion(parseInt(id, 10), status ?? null, review_comment ?? null, implementation_notes ?? null, user.id));
  }

  @Patch('suggestions/:id/status')
  @Roles(...REVIEW_ROLES)
  @UsePipes(new ZodValidationPipe(KaizenUpdateSuggestionSchema))
  async updateSuggestionStatus(
    @Param('id') id: string,
    @Body() body: KaizenUpdateSuggestionDto,
    @CurrentUser() user: { id: number },
  ) {
    const { status, review_comment } = body;
    return unwrapOrInternal(await this.svc.updateSuggestion(parseInt(id, 10), status ?? null, review_comment ?? null, null, user.id));
  }

  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }
}
