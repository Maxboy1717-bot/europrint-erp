/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   COUNT(*) FILTER (WHERE ...) aggregate-filter clauses for multi-status
 *   tallies in a single round-trip, AVG(EXTRACT(EPOCH FROM (resolved_at -
 *   created_at)) / 86400) FILTER (WHERE resolved_at IS NOT NULL) for
 *   conditional resolution-time average, all rolled into one stats query.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module qc-reclamations.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrNotFoundDefined } from '@common/http-result';
import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Query, UseGuards, UseInterceptors , BadRequestException, NotFoundException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { CreateReclamationCommand } from '../application/commands/create-reclamation.command';
import { GetReclamationsQuery } from '../application/queries/get-reclamations.query';
import { GetReclamationByIdQuery } from '../application/queries/get-reclamation-by-id.query';
import { CreateReclamationDtoSchema, GetReclamationsDtoSchema } from './dto/defect.dto';
import { ReclamationStatus } from '../domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../domain/aggregates/defect.aggregate';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';

enum Role {
  QC_MANAGER = 'qc_manager',
  PRODUCTION_MANAGER = 'production_manager',
  SALES_MANAGER = 'sales_manager',
  SUPER_ADMIN = 'super_admin',
}

@ApiThrottle()
@ApiTags('Qc Reclamations')
@Controller('qc')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcReclamationsController {
  private readonly logger = new Logger(QcReclamationsController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get reclamations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reclamations')
  async getReclamations(@Query() queryParams: Record<string, unknown>) {

      const parsed = GetReclamationsDtoSchema.parse(queryParams);
      const query = new GetReclamationsQuery(parsed.status as ReclamationStatus, parsed.severity as DefectSeverity, parsed.from ? new Date(parsed.from) : undefined, parsed.to ? new Date(parsed.to) : undefined, parsed.page, parsed.limit);
      const result = await this.queryBus.execute(query);
      assertOk(result);
      return result.data;
    
  }

  @ApiOperation({ summary: 'Get reclamation stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reclamations/stats')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async getReclamationStats() {
    const result = await runQuery(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'new') AS new_count,
        COUNT(*) FILTER (WHERE status = 'investigating') AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS closed_count,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30_days,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) FILTER (WHERE resolved_at IS NOT NULL), 1) AS avg_resolution_days
      FROM qc_reclamations
    `);
    return result.rows[0] ?? {};
  }

  @ApiOperation({ summary: 'Get reclamation by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('reclamations/:id')
  async getReclamationById(@Param('id') id: string) {

      const result = await this.queryBus.execute(new GetReclamationByIdQuery(safeInt(id, 0)));
      return unwrapOrNotFoundDefined(result, 'Reclamation not found');

  }

  @ApiOperation({ summary: 'Create reclamation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('reclamations')
  @Roles(Role.SALES_MANAGER, Role.QC_MANAGER, Role.SUPER_ADMIN)
  async createReclamation(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

      const parsed = CreateReclamationDtoSchema.parse(body);
      const cmd = new CreateReclamationCommand(parsed.customerName ?? '', parsed.customerId ?? null, parsed.orderId ?? null, parsed.description ?? '', parsed.severity as DefectSeverity, user.id);
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Reclamation created');
      return (result).data;
    
  }
}
