/**
 * POS — Telegram Mini App History Controller
 * History, Pending Approvals, Warehouses endpoints
 */
import {
  Controller,
  Get,
  Query,
  Headers,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PosTelegramService } from '../application/services/pos-telegram.service';
import { PosMiniAppService } from '../application/services/pos-mini-app.service';
import { Public } from '@common/decorators/public.decorator';
import { resolveSession } from './mini-app.controller';

@ApiTags('POS — Telegram Mini App')
@Public()
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/mini-app')
export class MiniAppHistoryController {
  private readonly logger = new Logger(MiniAppHistoryController.name);
  constructor(
    private readonly telegramService: PosTelegramService,
    private readonly miniAppService: PosMiniAppService,
  ) {}

  @Get('history')
  @ApiOperation({ summary: 'Xodim harakatlari tarixi' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async getHistory(
    @Headers('x-tg-session') sessionToken: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    const lmt = Math.min(Number(limit ?? 20), 50);
    const ofs = Number(offset ?? 0);
    return unwrapOrThrow(await this.miniAppService.getHistory(userId, lmt, ofs));
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Menejer uchun kutilayotgan so\'rovlar' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async getPendingApprovals(@Headers('x-tg-session') sessionToken: string) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    return unwrapOrThrow(await this.miniAppService.getPendingApprovals(userId));
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'Foydalanuvchi uchun mavjud omborlar' })
  @ApiHeader({ name: 'x-tg-session', description: 'Mini App sessiya tokeni' })
  async getWarehouses(@Headers('x-tg-session') sessionToken: string) {
    const { userId } = await resolveSession(this.telegramService, sessionToken);
    return unwrapOrThrow(await this.miniAppService.getWarehouses(userId));
  }
}
