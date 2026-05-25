/**
 * @module departments-positions-compat.controller
 * @description Compat endpoints — `/api/departments` va `/api/positions` legacy
 *   URL'larini org_departments va org_functions jadvallariga yo'naltiradi.
 *   2026-05-21 da DepartmentsController + PositionsController o'chirilgan,
 *   FE'da bir nechta sahifa hali ham eski URL ishlatadi.
 *
 *   SQL queries are delegated to org-compat.repository.ts (PA2-14: no raw SQL in controllers).
 */

import { Controller, Get } from '@nestjs/common';
import { getCompatDepartments, getCompatPositions } from './org-compat.repository';

@Controller()
export class DepartmentsPositionsCompatController {
  @Get('departments')
  async getDepartments() {
    return { data: await getCompatDepartments() };
  }

  @Get('positions')
  async getPositions() {
    return { data: await getCompatPositions() };
  }
}
