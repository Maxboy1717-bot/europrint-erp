/**
 * @module candidates-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   candidates module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CandidatesCompatService } from './candidates-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  CandidateAclTranslator,
  type LegacyCandidateRow,
  type CandidateDto,
} from './acl/candidate-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('candidates')
export class CandidatesCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly candidateAcl = new CandidateAclTranslator();

  constructor(private readonly svc: CandidatesCompatService) {}

  @Get()
  async getCandidates(
    @Query('vacancyId') vacancyId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getCandidates(vacancyId, status, limit));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-3 (Recruitment) consumers
   * should target `/v2`; the legacy endpoint stays for backwards-compat.
   */
  @Get('v2')
  async getCandidatesV2(
    @Query('vacancyId') vacancyId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<CandidateDto[]> {
    const rows = unwrapOrInternal(await this.svc.getCandidates(vacancyId, status, limit)) as unknown as LegacyCandidateRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.candidateAcl.toDomain(row))
      .filter((r): r is { ok: true; data: CandidateDto } => r.ok)
      .map((r) => r.data);
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
