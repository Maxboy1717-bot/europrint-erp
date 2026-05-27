/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/presentation/hr-employees.controller.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-extra.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   employees-extra module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { EmployeesCompatService } from './employees-compat.service';
import { CompatBodyDto, ProfileImageDto } from './dto/compat-body.dto';
import {
  EmployeesExtraAclTranslator,
  type LegacyEmployeeExtraRow,
} from './acl/employees-extra-acl';

const HR_ROLES = [
  'HR_MANAGER',
  'HR_SPECIALIST',
  'SUPER_ADMIN',
  'DIRECTOR',
  'ADMIN',
  'MANAGER',
] as const;

@ApiThrottle()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeesExtraController {
  private readonly acl = new EmployeesExtraAclTranslator();

  constructor(private readonly svc: EmployeesCompatService) {}

  /**
   * GET /api/employees/extra/:id — Bitrix-style read endpoint added in Wave 13 PR2
   * for ACL symmetry with other compatibility/ controllers. Delegates to the
   * canonical `EmployeesCompatService.getEmployee` and translates the raw
   * snake_case row through `EmployeesExtraAclTranslator` so legacy consumers
   * get the camelCase envelope shape (mirrors `employee-file-acl.ts`).
   *
   * Path is `extra/:id` (not `:id`) to avoid clashing with the existing
   * `GET /api/employees/:id` route on `EmployeesCompatController`.
   */
  @Get('extra/:id')
  async getEmployeeExtra(@Param('id') id: string) {
    const row = unwrapOrThrow(await this.svc.getEmployee(id)) as unknown as LegacyEmployeeExtraRow;
    const translated = this.acl.toDomain(row);
    if (!translated.ok) {
      throw new NotFoundException(translated.error.message);
    }
    return translated.data;
  }

  /**
   * PATCH /api/employees/:id — partial update.
   * Frontend `useEmployeeMutation.updateMutation` PATCH method'ni ishlatadi.
   * Service `updateEmployee` partial body bilan ishlash uchun moslangan.
   */
  @Patch(':id')
  async patchEmployee(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateEmployee(id, body));
  }

  /**
   * POST /api/employees/:id/profile-image — rasm URL'ni saqlash.
   * Frontend `EmployeeDialog.tsx` `handleAfterSubmit` shu endpoint chaqiradi.
   * Hozircha body.url URL ko'rinishida yuboriladi (FormData multipart kelajakda).
   */
  @Post(':id/profile-image')
  @HttpCode(HttpStatus.OK)
  async uploadProfileImage(
    @Param('id') id: string,
    @Body() body: ProfileImageDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.updateProfileImage(id, body.url, user.id));
  }

  /** Corporate inventory stub'lar — ko'chirildi audit qoidasi 1 (300+ qator) tufayli */
  @Post(':id/corporate-inventory/:itemId/sign')
  @HttpCode(HttpStatus.OK)
  signCorporateInventory(@Param('id') _id: string, @Param('itemId') _itemId: string) {
    return { signed: true };
  }

  @Post(':id/corporate-inventory/:itemId/return')
  @HttpCode(HttpStatus.OK)
  returnCorporateInventory(@Param('id') _id: string, @Param('itemId') _itemId: string) {
    return { returned: true };
  }
}
