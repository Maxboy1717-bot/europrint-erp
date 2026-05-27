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
import {
  MentorAclTranslator,
  type LegacyMentorRow,
  type MentorDto,
} from './acl/mentor-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('mentorships')
export class MentorshipsCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly mentorAcl = new MentorAclTranslator();

  constructor(private readonly svc: MentorshipsCompatService) {}

  @Get()
  async getMentorships(
    @Query('mentorId') mentorId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrDefault(await this.svc.getMentorships(mentorId, status), []);
  }

  /**
   * PA2-14 ACL-translated variant. New BC-3 (Mentorship) consumers
   * should target `/v2`; the legacy endpoint stays for backwards-compat.
   */
  @Get('v2')
  async getMentorshipsV2(
    @Query('mentorId') mentorId?: string,
    @Query('status') status?: string,
  ): Promise<MentorDto[]> {
    const rows = unwrapOrInternal(await this.svc.getMentorships(mentorId, status)) as unknown as LegacyMentorRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.mentorAcl.toDomain(row))
      .filter((r): r is { ok: true; data: MentorDto } => r.ok)
      .map((r) => r.data);
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
