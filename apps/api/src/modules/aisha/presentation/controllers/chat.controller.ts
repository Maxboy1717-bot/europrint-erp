/**
 * @module chat.controller
 * @description Text-chat endpoint for AishaChatPanel.
 *
 * Behaviour ladder:
 *   1. No LLM key configured  → graceful "AIsha hali sozlanmagan" stub reply.
 *   2. ANTHROPIC_API_KEY set   → `AishaConversationService.runTurn()` drives the
 *      real tool-execution loop (up to MAX_TOOL_ITERATIONS): ask Claude, run any
 *      requested tools for real, feed results back, repeat until Claude stops
 *      calling tools. Blocks until the full turn resolves, then returns ONE
 *      final JSON reply.
 *   3. Claude errors           → falls back to the same stub as case 1 with the
 *      error message in the reply (so the UI shows a friendly message, not a 500).
 *
 * `sessionId` is passed straight through into `runTurn()` (#186 fix): the FE
 * opens `/api/aisha/stream/:sessionId` (aisha-sse.gateway.ts) BEFORE sending
 * this request, so `runTurn()` can push `tool_use`/`tool_result` events on
 * that same id while the loop runs — the ONLY way "buyruqni bajarish jarayoni"
 * is visible live, since this endpoint itself is a single blocking response,
 * not a stream.
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
import { Roles } from '@common/decorators/roles.decorator';
import { AishaConfig } from '../../config/aisha.config';
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
// SECURITY (audit 2026-08-06 T9): mirror FE DIRECTOR_ROLES — without this any
// authenticated employee could call Aisha (incl. self-approving HITL requests).
@Roles('director', 'admin', 'super_admin', 'manager')
export class AishaChatController {
  private readonly logger = new Logger(AishaChatController.name);

  constructor(
    private readonly cfg: AishaConfig,
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
    const role = req.user?.role ?? null;
    const routed = this.routeOrReply(sessionId, dto.message.length);
    if (routed) return routed;
    try {
      // #15 P0: full tool-execution loop — tools actually run (read tools execute; high-stake pause for approval).
      // The turn is persisted (conversation + transcript + tool_calls + pending_approvals) inside runTurn.
      // `role` is threaded into every tool's execute() (AishaToolContext) so role-gated tools
      // (get_employee_info, get_financial_summary) can enforce the same RBAC a REST endpoint would.
      const turnR = await this.conversation.runTurn(userId, role, dto.message, SYSTEM_PROMPT, sessionId);
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
