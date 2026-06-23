/**
 * @module pp-queue.controller
 * @description Wave 6 (500K build): NestJS controller exposing the ranked production queue
 *              (ProductionPriorityService.buildQueue) — frozen segment + flexible ZARUR→deadline→band.
 */

import { Controller, Get, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GetProductionQueueQuery } from '../application/queries/get-production-queue.query';

const QUEUE_ROLES = ['super_admin', 'director', 'production_manager', 'planner', 'operator'];

@ApiThrottle()
@ApiTags('Pp Queue')
@Controller('pp/queue')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpQueueController {
  private readonly logger = new Logger(PpQueueController.name);

  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get ranked production queue (frozen + flexible: ZARUR → deadline → band)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...QUEUE_ROLES)
  async getQueue() {
    this.logger.log('Getting ranked production queue');
    return unwrapOrThrow(await this.queryBus.execute(new GetProductionQueueQuery({})));
  }
}
