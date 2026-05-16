/**
 * @module users-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { UsersCompatService } from './users-compat.service';
import { unwrapOrInternal } from '@common/http-result';
import { UserAclTranslator, type LegacyUserRow, type UserDto } from './acl/user-acl';

@ApiThrottle()
@Controller('users')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'HR_MANAGER', 'HR_SPECIALIST', 'MANAGER')
export class UsersCompatController {
  /**
   * PA2-14 ACL demonstrator. Instantiated inline because the translator is a
   * pure (stateless) class; in a fuller migration this would move to the DI
   * graph via the IAclTranslator token.
   */
  private readonly userAcl = new UserAclTranslator();

  constructor(private readonly svc: UsersCompatService) {}

  /**
   * Legacy backwards-compat endpoint — returns raw rows untouched. Kept so
   * existing UI consumers do not break while the migration is in progress.
   */
  @Get()
  async listUsers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.listUsers(page, limit, search));
  }

  /**
   * PA2-14 ACL-translated variant: same data, validated + camelCased through
   * IAclTranslator. New BC-6 (Platform) callers should target this route.
   * Rows that fail validation are dropped — the legacy endpoint still serves
   * them for forensic access.
   */
  @Get('v2')
  async listUsersV2(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<{ data: UserDto[]; total: number; page: number; limit: number }> {
    const result = await this.svc.listUsers(page, limit, search);
    // Cast through unknown: the legacy service returns Record<string, unknown>[];
    // the ACL translator narrows + validates each row in toDomain() below.
    const payload = unwrapOrInternal(result) as unknown as {
      data: LegacyUserRow[];
      total: number;
      page: number;
      limit: number;
    };
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const translated = rows
      .map((row) => this.userAcl.toDomain(row))
      .filter((r): r is { ok: true; data: UserDto } => r.ok)
      .map((r) => r.data);
    return { data: translated, total: payload.total, page: payload.page, limit: payload.limit };
  }
}
