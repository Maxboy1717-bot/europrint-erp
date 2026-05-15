/**
 * @module chat.controller
 * @description Minimal text-chat endpoint for AishaChatPanel.
 *
 * The full AIsha LLM stack (Claude + Gemini fallback + tool registry) is wired
 * in `application/llm/`, but ALL providers are optional — if no API keys are
 * configured, this endpoint must still respond gracefully so the panel does
 * not error out for every user without a paid Anthropic/OpenAI plan.
 *
 * Behaviour:
 *   - With no keys configured: returns a short stub reply explaining the
 *     assistant is not yet provisioned. Frontend keeps working.
 *   - With keys configured: delegates to the LLM service (TODO once the
 *     ClaudeService API surface stabilises and tool registry is finalised).
 *
 * Streaming responses live in `aisha-sse.gateway.ts` — this controller is
 * the simple request/response shape the AishaChatPanel uses today.
 */

import {
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AishaConfig } from '../../config/aisha.config';

const ChatRequestSchema = z.object({
  message:   z.string().min(1).max(2_000),
  sessionId: z.string().optional(),
});

interface ChatResponse {
  success: true;
  data: {
    reply:      string;
    sessionId:  string;
    toolsUsed?: string[];
  };
}

@Controller('aisha')
@UseGuards(JwtAuthGuard)
export class AishaChatController {
  private readonly logger = new Logger(AishaChatController.name);

  constructor(private readonly cfg: AishaConfig) {}

  @Post('chat')
  async chat(@Body() body: unknown): Promise<ChatResponse> {
    const dto = ChatRequestSchema.parse(body);
    const sessionId = dto.sessionId ?? randomUUID();

    // No LLM keys configured → graceful stub reply.
    if (!this.cfg.anthropicKey && !this.cfg.openaiKey && !this.cfg.googleAiKey) {
      this.logger.log(
        { sessionId, messageLength: dto.message.length },
        'AIsha chat invoked but no LLM provider key is configured',
      );
      return {
        success: true,
        data: {
          reply:
            "AIsha hali to'liq sozlanmagan — ANTHROPIC_API_KEY yoki " +
            "OPENAI_API_KEY .env'ga qo'shilgandan keyin javob bera oladi. " +
            "Hozirgi vaqtda voice va wake-word qismi ishlaydi.",
          sessionId,
          toolsUsed: [],
        },
      };
    }

    // TODO: wire to ClaudeService.runConversation(...) once the tool registry
    // and SSE gateway integration are stable. For now we return a placeholder
    // even when keys exist, so the panel renders without throwing.
    this.logger.log(
      { sessionId, messageLength: dto.message.length },
      'AIsha chat received — LLM integration pending',
    );
    return {
      success: true,
      data: {
        reply:
          "AIsha LLM integratsiyasi tayyorlanmoqda. Hozirda matningiz " +
          "qabul qilindi: \"" + dto.message.slice(0, 80) + "\". " +
          "Tez orada to'liq javob bera oladi.",
        sessionId,
        toolsUsed: [],
      },
    };
  }
}
