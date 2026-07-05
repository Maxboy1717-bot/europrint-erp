/**
 * @module mini-app.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertAuth } from '@common/assertions';
/**
 * POS — Telegram Mini App Controller
 * Auth, Barcode, Materials, Requests endpoints
 */
import { Controller, Get, Post, Patch, Param, Body, Query, Headers, UnauthorizedException, ForbiddenException, ParseIntPipe, HttpCode, HttpStatus, Logger, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { PosTelegramService } from '../application/services/pos-telegram.service';
import { PosBarcodeService } from '../application/services/pos-barcode.service';
import { PosRequestService } from '../application/services/pos-request.service';
import { PosMiniAppService } from '../application/services/pos-mini-app.service';
import { Public } from '@common/decorators/public.decorator';
import { CreateRequestLineSchema } from '../dto/request.dto';
import { safeJsonParse } from '@shared/utils/safe-json';

const TgAuthSchema = z.object({ initData: z.string().min(1) });
class TgAuthDto extends createZodDto(TgAuthSchema) {}

const TgBarcodeSchema = z.object({ barcode: z.string().min(1), warehouseId: z.string().optional() });
class TgBarcodeDto extends createZodDto(TgBarcodeSchema) {}

const TgCreateRequestSchema = z.object({
  departmentCode: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(CreateRequestLineSchema).min(1),
});
class TgCreateRequestDto extends createZodDto(TgCreateRequestSchema) {}

const TgApproveSchema = z.object({ notes: z.string().optional() });
class TgApproveDto extends createZodDto(TgApproveSchema) {}

const TgRejectSchema = z.object({ reason: z.string().min(1) });
class TgRejectDto extends createZodDto(TgRejectSchema) {}

export async function resolveSession(
  telegramService: PosTelegramService,
  token: string | undefined,
): Promise<{ userId: number; telegramUserId: bigint }> {
  assertAuth(token, "Mini App sessiya tokeni yo'q");
  return telegramService.validateSession(token.replace('Bearer ', ''));
}

/**
 * Approve/reject gate: mini-app is @Public() so there is no JWT-populated
 * request.user for RolesGuard/PermissionGuard to read. Resolves the caller's
 * role+department directly (admin-tier roles bypass department scoping;
 * 'manager' role may only act on requests from their own department).
 */
export async function assertCanManageRequest(
  miniAppService: PosMiniAppService,
  userId: number,
  requestId: number,
): Promise<void> {
  const result = await miniAppService.canManageRequest(userId, requestId);
  if (!result.ok || !result.data) {
    throw new ForbiddenException("Bu so'rovni tasdiqlash/rad etish uchun ruxsatingiz yo'q");
  }
}

@ApiTags('POS — Telegram Mini App')
@Public()
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/mini-app')
export class MiniAppController {
  private readonly logger = new Logger(MiniAppController.name);
  constructor(
    private readonly telegramService: PosTelegramService,
    private readonly barcodeService: PosBarcodeService,
    private readonly requestService: PosRequestService,
    private readonly miniAppService: PosMiniAppService,
  ) {}

  @Post('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram initData orqali sessiya yaratish' })
  async authenticate(@Body() dto: TgAuthDto) {
    const params = new URLSearchParams(dto.initData);
    const userStr = params.get('user');
    assertAuth(userStr, "initData da user yo'q");
    let tgUser: { id: number; first_name?: string; last_name?: string; username?: string };
    const parsed = safeJsonParse<{ id: number; first_name?: string; last_name?: string; username?: string } | null>(userStr, null);
    assertAuth(parsed?.id, "initData dan foydalanuvchi ma'lumotlari o'qib bo'lmadi");
    tgUser = parsed;
    const session = await this.telegramService.createOrRenewSession({ telegramUserId: BigInt(tgUser.id), initData: dto.initData });
    const _rUser = await this.miniAppService.getUserDetails(session.userId);
    const user = (_rUser.ok ? _rUser.data : {}) as Record<string, unknown>;
    return { token: session.token, expiresAt: session.expiresAt, user: { id: session.userId, firstName: tgUser.first_name ?? user?.first_name ?? '', lastName: tgUser.last_name ?? user?.last_name ?? '', username: tgUser.username ?? '', role: user?.role ?? '', departmentCode: user?.department_code ?? '', departmentName: user?.department_name ?? '' } };
  }

  @Post('barcode/scan')
  @ApiOperation({ summary: 'Barcode skanerlash — material topish' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async scanBarcode(@Headers('x-tg-session') sessionToken: string, @Body() dto: TgBarcodeDto) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    return unwrapOrInternal(await this.barcodeService.scanBarcode({ barcode: dto.barcode, warehouseId: dto.warehouseId }, userId));
  }

  @Get('materials')
  @ApiOperation({ summary: 'Material qidirish (ism, barcode)' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async searchMaterials(@Headers('x-tg-session') sessionToken: string, @Query('q') q: string, @Query('warehouseId') warehouseId?: string) {
    await resolveSession(this.telegramService, sessionToken);
    return unwrapOrThrow(await this.miniAppService.searchMaterials(q, warehouseId));
  }

  @Post('requests')
  @ApiOperation({ summary: 'Material so\'rov yaratish (INTERNAL_ISSUE)' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async createRequest(@Headers('x-tg-session') sessionToken: string, @Body() dto: TgCreateRequestDto) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    return unwrapOrInternal(await this.requestService.createRequest({ departmentCode: dto.departmentCode, notes: dto.notes, lines: dto.lines }, userId));
  }

  @Patch('requests/:id/approve')
  @ApiOperation({ summary: 'So\'rovni tasdiqlash (menejer)' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async approveRequest(@Headers('x-tg-session') sessionToken: string, @Param('id', ParseIntPipe) id: number, @Body() dto: TgApproveDto) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    await assertCanManageRequest(this.miniAppService, userId, id);
    return unwrapOrInternal(await this.requestService.approveRequest({ requestId: id, notes: dto.notes }, userId));
  }

  @Patch('requests/:id/reject')
  @ApiOperation({ summary: 'So\'rovni rad etish (menejer)' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async rejectRequest(@Headers('x-tg-session') sessionToken: string, @Param('id', ParseIntPipe) id: number, @Body() dto: TgRejectDto) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    await assertCanManageRequest(this.miniAppService, userId, id);
    return unwrapOrInternal(await this.requestService.rejectRequest({ requestId: id, rejectionReason: dto.reason }, userId));
  }
}
