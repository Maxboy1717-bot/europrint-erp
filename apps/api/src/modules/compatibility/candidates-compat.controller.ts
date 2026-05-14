/**
 * @module candidates-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CandidatesCompatService } from './candidates-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('candidates')
export class CandidatesCompatController {
  constructor(private readonly svc: CandidatesCompatService) {}

  @Get()
  async getCandidates(
    @Query('vacancyId') vacancyId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getCandidates(vacancyId, status, limit));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCandidate(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createCandidate(body));
  }

  @Get(':id')
  async getCandidate(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCandidate(id));
  }

  @Put(':id')
  async updateCandidate(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateCandidate(id, body));
  }

  @Delete(':id')
  async deleteCandidate(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteCandidate(id));
  }
}
