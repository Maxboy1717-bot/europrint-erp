/**
 * @module admin-auth.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller,
  Logger, UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

// NOTE: POST auth/refresh was here but duplicated AuthController. Route moved to
// apps/api/src/modules/auth/presentation/auth.controller.ts (canonical, cookie-aware).
@ApiTags('Admin Auth (Legacy)')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller()
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);
}
