/**
 * @module sod.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { PermissionSet } from '../cache/permission-set.interface'

/**
 * §6 - Separation of Duties (SoD) Guard
 * Qoidalar:
 * 1. Xarid yaratish + Xarid tasdiqlash (bir kishida YO'Q)
 * 2. Invoice yaratish + To'lov tasdiqlash (bir kishida YO'Q)
 * 3. Omborga qabul + Ombordan chiqim (bir tranzaksiyada YO'Q)
 * 4. HR ish haqi hisoblash + To'lov tasdiqlash (bir kishida YO'Q)
 * 5. Materialni yaratish + Materialni o'chirish (bir kishida YO'Q)
 * 6. CRM: RFM klasterlash ≠ Churn modeli joylashtirish (qat'iy ruxsat ajratish)
 *
 * Rule 6 uses strict permission co-presence enforcement: a user holding BOTH
 * crm.rfm:CLUSTER and crm.churn:RETRAIN is not permitted to execute either
 * endpoint. This is deterministic, fail-closed, and independent of audit-log
 * availability. Administrators must not grant both permissions to the same user.
 */

@Injectable()
export class SodGuard implements CanActivate {
  private readonly logger = new Logger(SodGuard.name)

  constructor(private readonly i18n: I18nService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const method = request.method
    const path = request.url || request.path || ''

    if (!user) {
      return true
    }

    const violations = this.checkViolations(user, method, path)

    if (violations.length > 0) {
      this.logger.warn(
        `SoD violation detected: userId=${(user as { id?: unknown }).id} path=${path} method=${method} violations=${violations.join(', ')}`,
      )
      throw new ForbiddenException(await this.i18n.t('errors.sodPolicyViolation'))
    }

    return true
  }

  private checkViolations(user: unknown, method: string, path: string): string[] {
    const violations: string[] = []
    const userData = user as { permissionSet?: { actions?: string[] }; permissions?: string[] }
    const permSet = userData.permissionSet as PermissionSet | undefined
    const permissions: string[] =
      permSet?.actions ?? (Array.isArray(userData.permissions) ? (userData.permissions as string[]) : [])

    if (
      (path.includes('/purchase-order') && method === 'POST') ||
      (path.includes('/purchase-order/approve') && method === 'PUT')
    ) {
      if (permissions.includes('po:create') && permissions.includes('po:approve')) {
        violations.push('Cannot both create and approve purchase orders')
      }
    }

    if (
      (path.includes('/invoice') && method === 'POST') ||
      (path.includes('/payment/approve') && method === 'PUT')
    ) {
      if (permissions.includes('invoice:create') && permissions.includes('payment:approve')) {
        violations.push('Cannot both create invoices and approve payments')
      }
    }

    if (
      (path.includes('/warehouse/receive') && method === 'POST') ||
      (path.includes('/warehouse/issue') && method === 'POST')
    ) {
      if (permissions.includes('warehouse:receive') && permissions.includes('warehouse:issue')) {
        violations.push('Cannot both receive and issue goods in warehouse')
      }
    }

    if (
      (path.includes('/payroll/calculate') && method === 'POST') ||
      (path.includes('/payroll/approve') && method === 'PUT')
    ) {
      if (permissions.includes('payroll:calculate') && permissions.includes('payroll:approve')) {
        violations.push('Cannot both calculate and approve payroll')
      }
    }

    // Rule 5: Material create + delete separation
    // Only triggers on specific MM materials endpoints, not on any URL containing 'material'
    const isMaterialEndpoint = /\/mm\/materials(\/\d+)?$/.test(path) || /\/materials(\/\d+)?$/.test(path);
    if (isMaterialEndpoint && (method === 'POST' || method === 'DELETE')) {
      if (permissions.includes('material:create') && permissions.includes('material:delete')) {
        violations.push('Cannot both create and delete materials')
      }
    }

    // Rule 6 (strict): RFM clustering (crm.rfm:CLUSTER) and churn model deployment
    // (crm.churn:RETRAIN) are mutually exclusive roles. A user holding both permissions
    // is blocked from executing either action. Administrators must assign these to
    // separate user accounts to enforce proper role separation.
    if (
      (path.includes('/crm/rfm/cluster') || path.includes('/crm/churn/retrain')) &&
      method === 'POST'
    ) {
      if (permissions.includes('crm.rfm:CLUSTER') && permissions.includes('crm.churn:RETRAIN')) {
        violations.push(
          'CRM SoD: crm.rfm:CLUSTER va crm.churn:RETRAIN ruxsatlari bir foydalanuvchida bo\'lishi mumkin emas',
        )
      }
    }

    return violations
  }
}
