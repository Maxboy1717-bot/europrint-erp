/**
 * @module audit-all.decorator
 * @description `@AuditAll()` applied to a controller class causes EVERY endpoint
 *   to be logged in the `audit_log` table via the AuditAllInterceptor.
 *   Use `@SkipAudit()` on a single method to opt out (e.g., health-check).
 */

import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AuditAllInterceptor } from '../interceptors/audit-all.interceptor';

export const AUDIT_ALL_KEY = 'audit:all';
export const SKIP_AUDIT_KEY = 'audit:skip';

export function AuditAll(): ClassDecorator {
  return applyDecorators(
    SetMetadata(AUDIT_ALL_KEY, true),
    UseInterceptors(AuditAllInterceptor),
  ) as ClassDecorator;
}

export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
