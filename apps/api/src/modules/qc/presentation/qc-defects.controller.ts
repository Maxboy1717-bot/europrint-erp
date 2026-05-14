/**
 * @module qc-defects.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrNotFoundDefined } from '@common/http-result';
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors , BadRequestException, NotFoundException} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ReportDefectCommand } from '../application/commands/report-defect.command';
import { ResolveDefectCommand } from '../application/commands/resolve-defect.command';
import { GetDefectsQuery } from '../application/queries/get-defects.query';
import { DefectStatus } from '../domain/aggregates/defect.aggregate';
import { ReportDefectDtoSchema, ResolveDefectDtoSchema, GetDefectsDtoSchema } from './dto/defect.dto';
import { DefectSeverity } from '../domain/aggregates/defect.aggregate';

enum Role {
  QC_MANAGER = 'qc_manager',
  PRODUCTION_MANAGER = 'production_manager',
  SUPER_ADMIN = 'super_admin',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('qc')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcDefectsController {
  private readonly logger = new Logger(QcDefectsController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('defects')
  async getDefects(@Query() queryParams: Record<string, unknown>) {

      const parsed = GetDefectsDtoSchema.parse(queryParams);
      const query = new GetDefectsQuery(parsed.severity as DefectSeverity, parsed.status as DefectStatus, parsed.productionOrderId, parsed.from ? new Date(parsed.from) : undefined, parsed.to ? new Date(parsed.to) : undefined, parsed.page, parsed.limit);
      const result = await this.queryBus.execute(query);
      assertOk(result);
      return result.data;
    
  }

  @Get('defects/stats')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async getDefectStats() {

      const result = await this.commandBus.execute({ type: 'GetDefectStatsQuery' });
      assertOk(result);
      return (result).data;
    
  }

  @Get('defects/:id')
  async getDefectById(@Param('id') id: string) {

      const result = await this.commandBus.execute({ type: 'GetDefectByIdQuery', id });
      return unwrapOrNotFoundDefined(result, 'Defect not found');
    
  }

  @Post('defects')
  @Roles(Role.QC_MANAGER, Role.PRODUCTION_MANAGER)
  async reportDefect(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {

      const parsed = ReportDefectDtoSchema.parse(body);
      const cmd = new ReportDefectCommand(parsed.inspectionId ?? null, parsed.productionOrderId ?? null, parsed.workCenterId ?? null, parsed.defectCode ?? '', parsed.description ?? '', parsed.severity as DefectSeverity, parsed.quantity ?? 0, parsed.unit ?? '', String(user.id ?? user.userId ?? 'system-user'));
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Defect reported');
      return (result).data;
    
  }

  @Patch('defects/:id/resolve')
  @Roles(Role.QC_MANAGER, Role.SUPER_ADMIN)
  async resolveDefect(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {

      const parsed = ResolveDefectDtoSchema.parse(body);
      const cmd = new ResolveDefectCommand(id, String(user?.id ?? user?.userId ?? 'system-user'), parsed.resolution);
      const result = await this.commandBus.execute(cmd);
      assertOk(result);
      this.logger.log('Defect resolved');
      return { statusCode: HttpStatus.OK, data: { id: (result).data } };
    
  }

  @Get('braks/cost-impact')
  async getBraksCostImpact() { return { data: [], totalCost: 0 }; }

  @Get('pending/qc')
  async getPendingQc() { return { data: [], total: 0 }; }

  @Patch('approve/finance/:orderId')
  async approveFinance(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, approved: true }; }

  @Post('approve/finance/:orderId')
  async postApproveFinance(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, approved: true }; }

  @Patch('approve/qc/:orderId')
  async approveQc(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, approved: true }; }

  @Post('approve/qc/:orderId')
  async postApproveQc(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, approved: true }; }

  @Patch('reject/:orderId')
  async rejectOrder(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, rejected: true }; }

  @Post('reject/:orderId')
  async postRejectOrder(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, rejected: true }; }

  @Patch('inspector-submit/:orderId')
  async inspectorSubmit(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, submitted: true }; }

  @Post('inspector-submit/:orderId')
  async postInspectorSubmit(@Param('orderId') orderId: string, @Body() body: Record<string, unknown>) { return { orderId, submitted: true }; }
}
