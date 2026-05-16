/**
 * @module kaizen.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { BadRequestException, Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@ApiTags('Kaizen')
@ApiBearerAuth()
@Controller('kaizen')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('director', 'super_admin', 'manager', 'employee')
export class KaizenController {
  private readonly logger = new Logger(KaizenController.name);

  constructor(private readonly svc: KaizenService) {}

  @ApiOperation({ summary: 'Create suggestion' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'List suggestions' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get suggestion' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('suggestions/:id')
  async getSuggestion(@Param('id') id: string) {
    const _rData = await this.svc.getSuggestion(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @ApiOperation({ summary: 'Update suggestion' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update suggestion status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }
}
