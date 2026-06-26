/**
 * @module ai-daily-report.controller
 * @description A75 — Kunlik AI-chatbot endpoint. Mashinasiz (MES'siz) xodim o'z
 *   kunlik ЦКП-hisobotini erkin matn (chat) orqali yuboradi; AI undan tarkibiy
 *   faktni (actualValue + xulosa) ajratadi va tasdiq uchun qaytaradi.
 *
 *   Bu endpoint ЦКП-faktni YOZMAYDI — ajratilgan qiymat FE tomonidan tasdiqlanib
 *   kanonik `POST /api/org-structure/ckp/fact` ga yuboriladi (golden-thread egasi).
 *   AI-kalit yo'q → graceful: needsManualValue=true, fabrikatsiya YO'Q (Q-40).
 *
 * @layer Presentation (AI)
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Body, Controller, Post,
  UseGuards, UseInterceptors, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { unwrapOrBadRequest } from '@common/http-result';
import {
  AiDailyReportService,
  DailyReportSubmitSchema,
} from '../application/services/ai-daily-report.service';

@ApiTags('§15 AI Kunlik Hisobot')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/daily-report')
export class AiDailyReportController {
  private readonly logger = new Logger(AiDailyReportController.name);

  constructor(private readonly service: AiDailyReportService) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({
    summary: 'Kunlik ЦКП-hisobotni AI-chat orqali yuborish (mashinasiz xodim)',
    description:
      'Xodim kunlik natijasini erkin matnda yozadi; AI tarkibiy ЦКП-faktni (actualValue+xulosa) ' +
      'ajratadi. AI-kalit yo\'q bo\'lsa needsManualValue=true qaytaradi (soxta son YO\'Q). ' +
      'Ajratilgan qiymat tasdiqdan keyin kanonik /api/org-structure/ckp/fact ga yuboriladi.',
  })
  @ApiResponse({ status: 200, description: 'Tarkibiy fakt ajratildi (tasdiq kutilmoqda)' })
  @ApiResponse({ status: 400, description: 'Birlamchi karta topilmadi yoki noto\'g\'ri so\'rov' })
  async submit(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = DailyReportSubmitSchema.parse(body);
    this.logger.log(`[A75] Kunlik hisobot: user=${user.id} date=${dto.factDate}`);
    return unwrapOrBadRequest(await this.service.submit(user.id, dto));
  }
}
