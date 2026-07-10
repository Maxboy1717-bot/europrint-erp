/**
 * @module wms-gtd.controller
 * @description Vision 10-warehouse#10 — GTD (bojxona yuk deklaratsiyasi) yetishmovchilik
 *   bayrog'i HTTP yuzasi. GTD raqamini yozish, import qabulini "GTD talab qilinadi" deb
 *   belgilash va muddati o'tgan yetishmovchiliklar ro'yxati. Delegatsiya GtdFlagService'ga
 *   (Qoida 6); Result → unwrapOrThrow (Qoida 1/11). Qabulni BLOKLAMAYDI — faqat bayroq+ogohlantirish.
 */
import { Body, Controller, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { GtdFlagService } from '../application/gtd-flag.service';

const GTD_READ = ['super_admin', 'director', 'manager', 'warehouse_manager', 'finance', 'finance_manager'];
const GTD_WRITE = ['super_admin', 'director', 'manager', 'warehouse_manager'];

const SetGtdNumberSchema = z.object({ gtdNumber: z.string().trim().min(1).max(40) });

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms GTD')
@ApiBearerAuth()
@Controller('wms/gtd')
export class WmsGtdController {
  constructor(private readonly svc: GtdFlagService) {}

  @ApiOperation({ summary: 'Muddati o\'tgan GTD (bojxona) yetishmovchiliklari' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('missing')
  @Roles(...GTD_READ)
  async listMissing() {
    const r = await this.svc.listMissing();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Import qabulini "GTD talab qilinadi" deb belgilash (14-kunlik soat)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post(':receiptId/require')
  @Roles(...GTD_WRITE)
  async markRequired(@Param('receiptId') receiptId: string) {
    return unwrapOrThrow(await this.svc.markRequired(Number(receiptId)));
  }

  @ApiOperation({ summary: 'GTD (bojxona) raqamini kiritish — yetishmovchilik bayrog\'ini o\'chiradi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Put(':receiptId')
  @Roles(...GTD_WRITE)
  async setNumber(@Param('receiptId') receiptId: string, @Body() body: unknown) {
    const dto = SetGtdNumberSchema.parse(body ?? {});
    return unwrapOrThrow(await this.svc.setNumber(Number(receiptId), dto.gtdNumber));
  }
}
