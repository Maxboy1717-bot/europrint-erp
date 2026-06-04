/**
 * @module pos-department.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { sql, db } from '@workspace/db';
import type { SQL } from 'drizzle-orm';
/**
 * POS — Department Guard
 */

import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const DEPARTMENT_REQUIRED = 'departmentRequired';

type Row = Record<string, unknown>;
const exec = (q: SQL): Promise<Row[]> =>
  db.select().from(sql`(${q}) _q`).then(rows => rows as Row[]);

@Injectable()
export class PosDepartmentGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isDeptRequired = this.reflector.getAllAndOverride<boolean>(DEPARTMENT_REQUIRED, [context.getHandler(), context.getClass()]);
    if (!isDeptRequired) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    const exemptRoles = ['admin', 'warehouse_manager', 'pos_manager', 'finance_head', 'hr_manager', 'qc_inspector'];
    if (exemptRoles.includes(user.role)) return true;
    const departmentCode = request.body?.departmentCode ?? request.query?.departmentCode ?? request.params?.departmentCode;
    if (!departmentCode) return true;
    if (user.departmentCode !== departmentCode) throw new ForbiddenException(`Siz faqat ${user.departmentCode} bo'limiga tegishli ma'lumotlarga kirish huquqiga egasiz`);
    return true;
  }
}

@Injectable()
export class PosWarehouseAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    const fullAccessRoles = ['admin', 'warehouse_manager', 'pos_manager', 'finance_head'];
    if (fullAccessRoles.includes(user.role)) return true;
    const warehouseId = request.body?.warehouseId ?? request.body?.fromWarehouseId ?? request.body?.toWarehouseId ?? request.query?.warehouseId ?? request.params?.warehouseId;
    if (!warehouseId) return true;
    const access = await exec(sql`SELECT 1 FROM warehouse_access_grants wag WHERE wag.user_id = ${user.id} AND wag.warehouse_id = ${warehouseId} AND wag.is_active = TRUE AND (wag.expires_at IS NULL OR wag.expires_at > NOW()) UNION SELECT 1 FROM department_warehouse_map dwm JOIN users u ON u.department = dwm.department_code WHERE u.id = ${user.id} AND dwm.warehouse_id = ${warehouseId} LIMIT 1`);
    if (access.length === 0) throw new ForbiddenException(`Ombor ${warehouseId} ga kirishga ruxsatingiz yo'q`);
    return true;
  }
}
