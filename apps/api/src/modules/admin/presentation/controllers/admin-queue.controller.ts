/**
 * @module admin-queue.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Delete, Get, HttpCode, Param, Post, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { AdminQueueService } from '../../application/services/admin-queue.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Admin — Queue Monitor')
@ApiBearerAuth()
@Roles('super_admin', 'director')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('admin/queues')
export class AdminQueueController {
  constructor(private readonly svc: AdminQueueService) {}

  @Get('status')
  @ApiOperation({ summary: 'Queue status summary' })
  @ApiResponse({ status: 200, description: 'Queue status snapshot' })
  async getStatus() {
    return unwrapOrInternal(await this.svc.getStatus());
  }

  @Get('failed')
  @ApiOperation({ summary: 'List all failed jobs across queues' })
  @ApiResponse({ status: 200, description: 'Failed jobs list' })
  async getAllFailed() {
    return unwrapOrInternal(await this.svc.getAllFailed());
  }

  @Get('failed/:queue')
  @ApiOperation({ summary: 'List failed jobs in a specific queue' })
  @ApiResponse({ status: 200, description: 'Failed jobs for queue' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  async getFailedByQueue(@Param('queue') queue: string) {
    return unwrapOrInternal(await this.svc.getFailedByQueue(queue));
  }

  @Post('retry/:queue/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 200, description: 'Job retried' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    return unwrapOrInternal(await this.svc.retryJob(queue, jobId));
  }

  @Delete('failed/:queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all failed jobs for a queue' })
  @ApiResponse({ status: 200, description: 'Failed jobs cleared' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  async clearFailedJobs(@Param('queue') queue: string) {
    return unwrapOrInternal(await this.svc.clearFailedJobs(queue));
  }
}
