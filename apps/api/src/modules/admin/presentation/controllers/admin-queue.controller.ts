import {
  Controller, Get, HttpCode, Param, Post, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { AdminQueueService } from '../../application/services/admin-queue.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Admin — Queue Monitor')
@ApiBearerAuth()
@Roles('super_admin', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('admin/queues')
export class AdminQueueController {
  constructor(private readonly svc: AdminQueueService) {}

  @Get('status')
  async getStatus() {
    return unwrapOrInternal(await this.svc.getStatus());
  }

  @Get('failed')
  async getAllFailed() {
    return unwrapOrInternal(await this.svc.getAllFailed());
  }

  @Get('failed/:queue')
  async getFailedByQueue(@Param('queue') queue: string) {
    return unwrapOrInternal(await this.svc.getFailedByQueue(queue));
  }

  @Post('retry/:queue/:jobId')
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    return unwrapOrInternal(await this.svc.retryJob(queue, jobId));
  }
}
