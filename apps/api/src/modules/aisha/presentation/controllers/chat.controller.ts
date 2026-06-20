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
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AishaConfig } from '../../config/aisha.config';
import { CLAUDE_PORT, IClaudePort } from '../../domain/ports/i-claude-port';
import { ToolRegistry } from '../../application/tools/tool.registry';
import { AishaConversationService } from '../../application/conversation/aisha-conversation.service';

const ChatRequestSchema = z.object({
  message:   z.string().min(1).max(2_000),
  sessionId: z.string().optional(),
});

interface AuthedReq extends FastifyRequest {
  user?: { id?: number; userId?: number; sub?: number; role?: string };
}

interface ChatResponse {
  success: true;
  data: {
    reply:            string;
    sessionId:        string;
    conversationId?:  string;
    toolsUsed?:       string[];
    toolResults?:     Array<{ name: string; ok: boolean; result: unknown }>;
    pendingApprovals?: Array<{ toolUseId: string; name: string; input: Record<string, unknown>; stake: 'high' }>;
  };
}

const SYSTEM_PROMPT =
  "Sen — EuroPrint ERP'ning AI yordamchisi AIsha. Direktorga uzbek tilida " +
  "javob ber. Agar foydalanuvchi savol kerakli ma'lumotni tool orqali olish " +
  "kerak deb hisoblasang, mos toolni chaqir. Aniq raqamlar va manba (qaysi " +
  "tool, qaysi vaqt) bilan javob ber.";

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('aisha')
@UseGuards(JwtAuthGuard)
export class AishaChatController {
  private readonly logger = new Logger(AishaChatController.name);

  constructor(
    private readonly cfg: AishaConfig,
    @Inject(CLAUDE_PORT) private readonly claude: IClaudePort,
    private readonly tools: ToolRegistry,
    private readonly conversation: AishaConversationService,
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

  private routeOrReply(sessionId: string, messageLength: number): ChatResponse | null {
    if (!this.cfg.anthropicKey && !this.cfg.openaiKey && !this.cfg.googleAiKey) {
      this.logger.log({ sessionId, messageLength }, 'AIsha chat invoked but no LLM provider key is configured');
      return this.notConfiguredReply(sessionId);
    }
    if (!this.cfg.anthropicKey) {
      this.logger.log({ sessionId, hasOpenai: !!this.cfg.openaiKey, hasGoogle: !!this.cfg.googleAiKey }, 'AIsha chat: non-Anthropic provider configured, fallback not implemented yet');
      return this.errorReply(sessionId, 'Faqat Claude (Anthropic) provider qo\'llab-quvvatlanadi hozircha');
    }
    return null;
  }

  @ApiOperation({ summary: 'Chat' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('chat')
  async chat(@Body() body: unknown, @Req() req: AuthedReq): Promise<ChatResponse> {
    const dto = ChatRequestSchema.parse(body);
    const sessionId = dto.sessionId ?? randomUUID();
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub ?? 0;
    const routed = this.routeOrReply(sessionId, dto.message.length);
    if (routed) return routed;
    try {
      // #15 P0: full tool-execution loop — tools actually run (read tools execute; high-stake pause for approval).
      // The turn is persisted (conversation + transcript + tool_calls + pending_approvals) inside runTurn.
      const turnR = await this.conversation.runTurn(userId, dto.message, SYSTEM_PROMPT);
      if (!turnR.ok) return this.errorReply(sessionId, turnR.error.message);
      const { conversationId, reply, toolsUsed, toolResults, pendingApprovals } = turnR.data;
      this.logger.log({ sessionId, conversationId, replyLength: reply.length, toolsUsed: toolsUsed.length, ran: toolResults.length, pending: pendingApprovals.length }, 'AIsha chat answered via tool loop');
      return { success: true, data: { reply, sessionId, conversationId, toolsUsed, toolResults, pendingApprovals } };
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error({ sessionId, error: msg }, 'AIsha Claude stream failed');
      return this.errorReply(sessionId, msg);
    }
  }
}
