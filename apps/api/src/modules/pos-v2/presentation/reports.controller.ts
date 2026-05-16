/**
 * @module reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { parseSafe } from '@common/assertions';
import { unwrapOrThrow } from '@common/http-result';
import { UseInterceptors , BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller,
  Get,
  Query,
  UseGuards, Logger} from '@nestjs/common';
import { QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '@shared/guards/roles.guard';
import { Roles} from '@shared/decorators/roles.decorator';
import { CurrentUser} from '@shared/decorators/current-user.decorator';
import { Result, isErr } from '@common/result';
import {
 GetMovementReportQuery,
 GetEmployeeActivityQuery,
 GetLowStockQuery,
} from '../application/queries/get-movement-report.query';
import {
 MovementReportDtoSchema,
 EmployeeActivityReportDtoSchema,
 LowStockReportDtoSchema,
} from './dto/pos-v2.dto';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Reports')
@Controller('pos-v2/reports')
@UseGuards(RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
 constructor(private readonly queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Get movement report' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('movements')
 @Roles('WAREHOUSE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getMovementReport(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<Record<string, unknown>> {
 const dto = parseSafe(MovementReportDtoSchema, query, 'Invalid query parameters');
 const res = await this.queryBus.execute(
 new GetMovementReportQuery(
 dto.warehouseId,
 new Date(dto.from),
 new Date(dto.to),
 ),
 );
 return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Get employee activity' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('employee-activity')
 @Roles('HR_MANAGER', 'SUPER_ADMIN')
 async getEmployeeActivity(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<Record<string, unknown>> {
 const dto = parseSafe(EmployeeActivityReportDtoSchema, query, 'Invalid query parameters');
 const res = await this.queryBus.execute(
 new GetEmployeeActivityQuery(
 dto.userId,
 new Date(dto.from),
 new Date(dto.to),
 ),
 );
 return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Get low stock report' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('low-stock')
 @Roles('WAREHOUSE_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
 async getLowStockReport(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<Record<string, unknown>> {
 const dto = parseSafe(LowStockReportDtoSchema, query, 'Invalid query parameters');
 const res = await this.queryBus.execute(new GetLowStockQuery(dto.warehouseId));
 return unwrapOrThrow(res);
}
}
