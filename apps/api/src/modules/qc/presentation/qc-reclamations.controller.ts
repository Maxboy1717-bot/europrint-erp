import { assertOk, unwrapOrNotFoundDefined } from '@common/http-result';
import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Query, UseGuards, UseInterceptors , BadRequestException, NotFoundException} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CreateReclamationCommand } from '../application/commands/create-reclamation.command';
import { GetReclamationsQuery } from '../application/queries/get-reclamations.query';
import { CreateReclamationDtoSchema, GetReclamationsDtoSchema } from './dto/defect.dto';
import { ReclamationStatus } from '../domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../domain/aggregates/defect.aggregate';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

enum Role {
  QC_MANAGER = 'qc_manager',
  PRODUCTION_MANAGER = 'production_manager',
  SALES_MANAGER = 'sales_manager',
  SUPER_ADMIN = 'super_admin',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('qc')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcReclamationsController {
  private readonly logger = new Logger(QcReclamationsController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('reclamations')
  async getReclamations(@Query() queryParams: Record<string, unknown>) {

      const parsed = GetReclamationsDtoSchema.parse(queryParams);
      const query = new GetReclamationsQuery(parsed.status as ReclamationStatus, parsed.severity as DefectSeverity, parsed.from ? new Date(parsed.from) : undefined, parsed.to ? new Date(parsed.to) : undefined, parsed.page, parsed.limit);
      const result = await this.queryBus.execute(query);
      assertOk(result);
      return result.data;
    
  }

  @Get('reclamations/stats')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async getReclamationStats() {
    const result = await runQuery(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'new') AS new_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30_days,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) FILTER (WHERE resolved_at IS NOT NULL), 1) AS avg_resolution_days
      FROM qc_reclamations
    `);
    return result.rows[0] ?? {};
  }

  @Get('reclamations/:id')
  async getReclamationById(@Param('id') id: string) {

      const result = await this.commandBus.execute({ type: 'GetReclamationByIdQuery', id });
      return unwrapOrNotFoundDefined(result, 'Reclamation not found');
    
  }

  @Post('reclamations')
  @Roles(Role.SALES_MANAGER, Role.QC_MANAGER, Role.SUPER_ADMIN)
  async createReclamation(@Body() body: Record<string, unknown>) {

      const parsed = CreateReclamationDtoSchema.parse(body);
      const cmd = new CreateReclamationCommand(parsed.customerName ?? '', parsed.customerId ?? null, parsed.orderId ?? null, parsed.description ?? '', parsed.severity as DefectSeverity);
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Reclamation created');
      return (result).data;
    
  }
}
