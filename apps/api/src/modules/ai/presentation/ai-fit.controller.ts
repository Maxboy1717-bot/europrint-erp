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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrNotFoundDefined, throwFromError } from '@common/http-result';
import { AiFitService, FitEvaluateSchema, type FitViewerContext } from '../application/services/ai-fit.service';

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

  /** SB0505 per-karta RBAC: viewer context passed to the service on every read/write. */
  private toViewer(user: AuthenticatedUser): FitViewerContext {
    return { userId: Number(user?.id ?? 0), role: user?.role };
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Xodim ↔ karta mosligini AI orqali baholash' })
  async evaluate(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = FitEvaluateSchema.parse(body);
    return unwrapOrThrow(await this.service.evaluate(dto, this.toViewer(user)));
  }

  @Get('scores')
  @ApiOperation({ summary: 'AI-fit baholar ro`yxati (employeeId/cardId filtri)' })
  async getScores(@Query() query: unknown, @CurrentUser() user: AuthenticatedUser) {
    const filters = FitScoresQuerySchema.parse(query);
    return unwrapOrThrow(await this.service.listScores(filters, this.toViewer(user)));
  }

  @Get('report/:employeeId')
  @ApiOperation({ summary: 'Xodimning eng so`nggi AI-fit hisoboti' })
  async getReport(@Param('employeeId', ParseIntPipe) employeeId: number, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.getReport(employeeId, this.toViewer(user));
    // SB0505 per-karta RBAC: a scope violation (FORBIDDEN) must surface as 403,
    // not the blanket 404 that unwrapOrNotFoundDefined maps every Err to.
    if (!result.ok && result.error?.code === 'FORBIDDEN') throwFromError(result.error);
    return unwrapOrNotFoundDefined(
      result,
      `AI-fit hisoboti topilmadi: xodim ${employeeId}`,
    );
  }
}
