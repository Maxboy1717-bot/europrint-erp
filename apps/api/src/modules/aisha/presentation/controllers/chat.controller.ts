/**
 * @module chat.controller
 * @description Text-chat endpoint for AishaChatPanel.
 *
 * Behaviour ladder:
 *   1. No LLM key configured  → graceful "AIsha hali sozlanmagan" stub reply.
 *   2. ANTHROPIC_API_KEY set   → calls ClaudeService.streamWithTools(), collects
 *      every text_delta into a single reply, records which tools the LLM used.
 *      Tools are pulled from the global ToolRegistry so the LLM can call into
 *      any of the 25 registered AIsha tools (camera, KPI, alerts, …).
 *   3. Claude errors           → falls back to the same stub as case 1 with the
 *      error message in the reply (so the UI shows a friendly message, not a 500).
 *
 * Streaming SSE responses live in `aisha-sse.gateway.ts` — this controller is
 * the simple request/response shape AishaChatPanel uses today.
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
import { ClaudeService } from '../../application/llm/claude.service';
import { ToolRegistry } from '../../application/tools/tool.registry';

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

const SYSTEM_PROMPT =
  "Sen — EuroPrint ERP'ning AI yordamchisi AIsha. Direktorga uzbek tilida " +
  "javob ber. Agar foydalanuvchi savol kerakli ma'lumotni tool orqali olish " +
  "kerak deb hisoblasang, mos toolni chaqir. Aniq raqamlar va manba (qaysi " +
  "tool, qaysi vaqt) bilan javob ber.";

@Controller('aisha')
@UseGuards(JwtAuthGuard)
export class AishaChatController {
  private readonly logger = new Logger(AishaChatController.name);

  constructor(
    private readonly cfg: AishaConfig,
    private readonly claude: ClaudeService,
    private readonly tools: ToolRegistry,
  ) {}

  private notConfiguredReply(sessionId: string): ChatResponse {
    return { success: true, data: {
      reply:
        "AIsha hali to'liq sozlanmagan — ANTHROPIC_API_KEY yoki OPENAI_API_KEY " +
        ".env'ga qo'shilgandan keyin javob bera oladi. Hozirgi vaqtda voice va " +
        "wake-word qismi ishlaydi.",
      sessionId,
      toolsUsed: [],
    }};
  }

  private errorReply(sessionId: string, err: string): ChatResponse {
    return { success: true, data: {
      reply: `AIsha javob bera olmadi: ${err}. Qayta urinib ko'ring yoki keyinroq sinab ko'ring.`,
      sessionId,
      toolsUsed: [],
    }};
  }

  /**
   * Drain the Claude stream, accumulating text deltas and tool-use names.
   * Tool-result dispatch is intentionally deferred — invoking tools mid-stream
   * requires a multi-turn loop with the LLM (call tool → feed result back).
   * For the simple request/response chat surface, we just surface which tools
   * the LLM asked for; SSE gateway is where the streaming loop lives.
   */
  private async collectClaudeReply(message: string): Promise<{ reply: string; toolsUsed: string[] }> {
    let reply = '';
    const toolsUsed: string[] = [];
    const toolDefinitions = this.tools.size() > 0 ? this.tools.getDefinitions() : undefined;
    for await (const ev of this.claude.streamWithTools({
      messages: [{ role: 'user', content: message }],
      system:   SYSTEM_PROMPT,
      tools:    toolDefinitions as Array<Record<string, unknown>> | undefined,
    })) {
      if (ev.kind === 'text_delta') reply += ev.text;
      else if (ev.kind === 'tool_use') toolsUsed.push(ev.name);
      else if (ev.kind === 'error') throw new Error(ev.message);
    }
    return { reply: reply.trim() || "AIsha javob bermadi (bo'sh oqim).", toolsUsed };
  }

  @Post('chat')
  async chat(@Body() body: unknown): Promise<ChatResponse> {
    const dto = ChatRequestSchema.parse(body);
    const sessionId = dto.sessionId ?? randomUUID();

    if (!this.cfg.anthropicKey && !this.cfg.openaiKey && !this.cfg.googleAiKey) {
      this.logger.log(
        { sessionId, messageLength: dto.message.length },
        'AIsha chat invoked but no LLM provider key is configured',
      );
      return this.notConfiguredReply(sessionId);
    }

    if (!this.cfg.anthropicKey) {
      // OpenAI / Google fallback not yet wired through — emit a friendly note.
      this.logger.log(
        { sessionId, hasOpenai: !!this.cfg.openaiKey, hasGoogle: !!this.cfg.googleAiKey },
        'AIsha chat: non-Anthropic provider configured, fallback not implemented yet',
      );
      return this.errorReply(sessionId, 'Faqat Claude (Anthropic) provider qo\'llab-quvvatlanadi hozircha');
    }

    try {
      const { reply, toolsUsed } = await this.collectClaudeReply(dto.message);
      this.logger.log(
        { sessionId, replyLength: reply.length, toolsUsed: toolsUsed.length },
        'AIsha chat answered via Claude',
      );
      return { success: true, data: { reply, sessionId, toolsUsed } };
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error({ sessionId, error: msg }, 'AIsha Claude stream failed');
      return this.errorReply(sessionId, msg);
    }
  }
}
