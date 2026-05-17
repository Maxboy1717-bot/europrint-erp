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
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrInternal } from '@common/http-result';
import { EmployeesCompatService } from './employees-compat.service';
import { CompatBodyDto, ProfileImageDto } from './dto/compat-body.dto';

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
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeesExtraController {
  constructor(private readonly svc: EmployeesCompatService) {}

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
