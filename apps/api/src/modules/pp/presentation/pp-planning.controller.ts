/**
 * @module pp-planning.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PpPlanningService } from '../application/pp-planning.service';
import { safeInt } from '../../hr/common/db-rows';
import { PpCreateScheduleEntrySchema, PpCreateScheduleEntryDto, PpUpdateOperationSchema, PpUpdateOperationDto } from '../dto/pp.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';

import { MS_PER_DAY } from '@common/constants/app.constants';
const PLAN_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Pp Planning')
@Controller('planning')
@UseGuards(RolesGuard)
@Roles(...PLAN_ROLES)
export class PpPlanningController {
  private readonly logger = new Logger(PpPlanningController.name);

  constructor(private readonly svc: PpPlanningService) {}

  @ApiOperation({ summary: 'Get schedule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('schedule')
  async getSchedule(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const s = startDate || new Date(Date.now() - 7 * MS_PER_DAY).toISOString();
    const e = endDate || new Date(Date.now() + 7 * MS_PER_DAY).toISOString();
    return unwrapOrThrow(await this.svc.getSchedule(s, e));
  }

  @ApiOperation({ summary: 'Create schedule entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('schedule')
  @UsePipes(new ZodValidationPipe(PpCreateScheduleEntrySchema))
  async createScheduleEntry(@Body() body: PpCreateScheduleEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.createScheduleEntry(body, user.id));
  }

  @ApiOperation({ summary: 'Update operation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('operations/:id')
  @UsePipes(new ZodValidationPipe(PpUpdateOperationSchema))
  async updateOperation(
    @Param('id') id: string,
    @Body() body: PpUpdateOperationDto,
  ) {
    return unwrapOrThrow(await this.svc.updateOperation(safeInt(id, 0), body));
  }
}
