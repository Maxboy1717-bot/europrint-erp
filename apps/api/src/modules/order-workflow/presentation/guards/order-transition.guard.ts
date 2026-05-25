/**
 * @module order-transition.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';
import { owOrders } from '@shared/db';
import { AuthenticatedUser } from '../../../../common/types/user.types';

const SCOPED_ROLES = new Set(['SALES_MANAGER']);
const ADMIN_ROLES  = new Set(['SUPER_ADMIN', 'DIRECTOR']);

@Injectable()
export class OrderTransitionGuard implements CanActivate {
  private readonly logger = new Logger(OrderTransitionGuard.name);

  constructor(private readonly i18n: I18nService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req  = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) return false;

    const role = String(user.role ?? '');
    if (ADMIN_ROLES.has(role)) return true;

    const orderId = req.params?.id as string | undefined;
    if (!orderId) return true;

    if (SCOPED_ROLES.has(role)) {
      const rows = await db.select({ assignedSalesManager: owOrders.assignedSalesManager })
        .from(owOrders)
        .where(eq(owOrders.id, orderId))
        .limit(1);

      if (!rows[0]) {
        throw new NotFoundException(await this.i18n.t('errors.orderNotFound'));
      }

      const mgr = rows[0].assignedSalesManager;
      if (mgr !== null && mgr !== user.id) {
        this.logger.warn({ msg: 'IDOR urinish', actorId: user.id, assignedMgr: mgr, orderId });
        throw new ForbiddenException(await this.i18n.t('errors.noOrderAccess'));
      }
    }

    return true;
  }
}
