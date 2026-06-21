/**
 * @module ai-fit.controller
 * @description NestJS controller for the AI-fit per-card scorer (P36). HTTP route
 *   handlers; delegates to AiFitService and returns unwrapped Result data.
 * @layer Presentation (AI)
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Param, Query, Body,
  ParseIntPipe, UseGuards, UseInterceptors, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/types/role';
import { unwrapOrBadRequest, unwrapOrInternal, unwrapOrNotFoundDefined } from '@common/http-result';
import { AiFitService, FitEvaluateSchema } from '../application/services/ai-fit.service';

const FitScoresQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  cardId:     z.coerce.number().int().positive().optional(),
  limit:      z.coerce.number().int().positive().max(100).optional(),
}).strict();

@ApiTags('§15 AI Fit')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/fit')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
export class AiFitController {
  private readonly logger = new Logger(AiFitController.name);

  constructor(private readonly service: AiFitService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Xodim ↔ karta mosligini AI orqali baholash' })
  async evaluate(@Body() body: unknown) {
    const dto = FitEvaluateSchema.parse(body);
    return unwrapOrBadRequest(await this.service.evaluate(dto));
  }

  @Get('scores')
  @ApiOperation({ summary: 'AI-fit baholar ro`yxati (employeeId/cardId filtri)' })
  async getScores(@Query() query: unknown) {
    const filters = FitScoresQuerySchema.parse(query);
    return unwrapOrInternal(await this.service.listScores(filters));
  }

  @Get('report/:employeeId')
  @ApiOperation({ summary: 'Xodimning eng so`nggi AI-fit hisoboti' })
  async getReport(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrNotFoundDefined(
      await this.service.getReport(employeeId),
      `AI-fit hisoboti topilmadi: xodim ${employeeId}`,
    );
  }
}
