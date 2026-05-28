/**
 * @module core-departments-compat.controller
 * @description Compat endpoint — `/api/core/departments` (OrgDepartmentsPage.tsx LIVE sahifa).
 *   2026-05-21 da DepartmentsController o'chirilgan; bu sahifa yangi `/api/core/*` URL
 *   ishlatadi. org_departments jadvaliga GET/POST/DELETE(soft) yo'naltiradi.
 *
 *   Doira: faqat tirik consumer (OrgDepartmentsPage GET+POST+DELETE). `coreApi`
 *   (lib/api/misc.ts) PUT + positions chaqiruvlari O'LIK (hech qayerda import qilinmagan),
 *   shu sabab PUT/positions ataylab QO'SHILMAGAN.
 *
 *   SQL org-compat.repository.ts ga delegatsiya (PA2-14: controllerda raw SQL yo'q).
 */

import {
  Controller, Get, Post, Delete, Body, Param,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';
import {
  getCoreDepartments,
  createCoreDepartment,
  softDeleteCoreDepartment,
} from './org-compat.repository';

const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional(),
});

@Controller('core/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'hr_manager', 'director')
export class CoreDepartmentsCompatController {
  @Get()
  async getAll() {
    return { data: unwrapOrInternal(await getCoreDepartments()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const dto = CreateDepartmentSchema.parse(body);
    return unwrapOrInternal(await createCoreDepartment(dto.name, dto.code));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await softDeleteCoreDepartment(id));
  }
}
