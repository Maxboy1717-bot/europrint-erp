/**
 * @module mentorships-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   mentorships module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MentorshipsCompatService } from './mentorships-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('mentorships')
export class MentorshipsCompatController {
  constructor(private readonly svc: MentorshipsCompatService) {}

  @Get()
  async getMentorships(
    @Query('mentorId') mentorId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrDefault(await this.svc.getMentorships(mentorId, status), []);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMentorship(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createMentorship(body));
  }

  @Get(':id')
  async getMentorship(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getMentorship(id));
  }

  @Put(':id')
  async updateMentorship(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateMentorship(id, body));
  }

  @Patch(':id')
  async patchMentorship(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateMentorship(id, body));
  }

  @Delete(':id')
  async deleteMentorship(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteMentorship(id));
  }
}
