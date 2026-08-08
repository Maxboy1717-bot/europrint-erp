/**
 * @module sd-klishe-retention.controller
 * @description Transport-only. Klishe/forma ~3 yil saqlash muddati + hisobdan chiqarish akti
 *   (vision 06-sd#14): GET due-ro'yxat, GET aktlar, POST bitta klisheni hisobdan chiqarish.
 * @layer Presentation (SD)
 */

import {
  Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { KlisheRetentionService } from '../application/klishe-retention.service';

// 'manager' — SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
const KLISHE_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin', 'production_manager'];
const MoldIdSchema = z.string().uuid();

const WriteOffSchema = z.object({
  reason: z.string().max(2000).optional(),
});

@ApiThrottle()
@ApiTags('Sd Klishe Retention')
@ApiBearerAuth()
@Controller('sd')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...KLISHE_ROLES)
export class SdKlisheRetentionController {
  constructor(private readonly svc: KlisheRetentionService) {}

  @ApiOperation({ summary: 'Klishe/forma ~3 yil muddatiga yaqin/o\'tgan ro\'yxati' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('klishe-retention/due')
  async listDue(@Query('warnDays') warnDays?: string) {
    const w = warnDays !== undefined ? parseInt(warnDays, 10) : undefined;
    return unwrapOrThrow(await this.svc.listDue(Number.isNaN(w as number) ? undefined : w));
  }

  @ApiOperation({ summary: 'Hisobdan chiqarish aktlari ro\'yxati' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('klishe-retention/acts')
  async listActs() {
    return unwrapOrThrow(await this.svc.listActs());
  }

  @ApiOperation({ summary: 'Klisheni hisobdan chiqarish (write-off akti chiqariladi)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Already written off' })
  @Post('klishe-retention/:moldId/write-off')
  @Roles('sales_manager', 'manager', 'director', 'super_admin', 'production_manager')
  async writeOff(
    @Param('moldId') moldId: string,
    @Body(new ZodValidationPipe(WriteOffSchema)) body: z.infer<typeof WriteOffSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const id = MoldIdSchema.parse(moldId);
    return unwrapOrThrow(await this.svc.writeOff(id, { reason: body.reason, actedBy: user.id }));
  }
}
