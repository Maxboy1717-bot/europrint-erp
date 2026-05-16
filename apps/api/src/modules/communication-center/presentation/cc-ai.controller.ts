/**
 * /api/cc/ai/*  —  AI hujjat to'ldirish endpointlari
 *
 *   POST /api/cc/ai/start                       — sessiya boshlash, birinchi savol
 *   POST /api/cc/ai/sessions/:id/answer         — javob, keyingi savol
 *   POST /api/cc/ai/sessions/:id/finalize       — Claude'dan rasmiy matn + draft saqlash
 *   GET  /api/cc/ai/sessions/:id                — joriy holat
 */

import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CcAiInterviewService } from '../application/cc-ai-interview.service';

// ── DTO ───────────────────────────────────────────────────────────────
const StartSchema = z.object({
  templateId: z.string().uuid(),
  language:   z.enum(['uz', 'ru']).optional(),
  channel:    z.enum(['web', 'telegram']).optional(),
});
const AnswerSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
const FinalizeSchema = z.object({
  senderName:     z.string().max(200).optional(),
  senderPosition: z.string().max(200).optional(),
});

@Throttle({ default: { limit: 60, ttl: 60_000 } })
@ApiTags('Cc Ai')
@ApiBearerAuth()
@Controller('cc/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcAiController {
  constructor(private readonly ai: CcAiInterviewService) {}

  @ApiOperation({ summary: 'Start' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('start')
  start(
    @Body(new ZodValidationPipe(StartSchema)) body: z.infer<typeof StartSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.ai.start({
      userId:     user.id,
      templateId: body.templateId,
      language:   body.language,
      channel:    body.channel,
    });
  }

  @ApiOperation({ summary: 'Answer' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sessions/:id/answer')
  answer(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(AnswerSchema)) body: { value: unknown },
    @CurrentUser() user: { id: number },
  ) {
    return this.ai.answer({ sessionId, userId: user.id, value: body.value });
  }

  @ApiOperation({ summary: 'Finalize' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sessions/:id/finalize')
  finalize(
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(FinalizeSchema)) body: z.infer<typeof FinalizeSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.ai.finalize({
      sessionId, userId: user.id,
      senderName: body.senderName, senderPosition: body.senderPosition,
    });
  }

  @ApiOperation({ summary: 'State' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('sessions/:id')
  state(@Param('id') sessionId: string, @CurrentUser() user: { id: number }) {
    return this.ai.getSessionState(sessionId, user.id);
  }
}
