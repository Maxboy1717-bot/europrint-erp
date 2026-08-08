/**
 * @module bot-gateway.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Logger, Param, Post, HttpCode, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { Public } from '@modules/auth/infrastructure/decorators/public.decorator';
import { CrmBotService } from './bots/crm.bot';
import { MesBotService } from './bots/mes.bot';
import { HrBotService } from './bots/hr.bot';
import { LogisticsBotService } from './bots/logistics.bot';
import { FinBotService } from './bots/fin.bot';
import { QcBotService } from './bots/qc.bot';
import { DirectorBotService } from './bots/director.bot';
import { OmborBotService } from './bots/ombor.bot';
import { PosBotService } from './bots/pos.bot';
import { TelegramAuthGuard } from './telegram-auth.guard';
import type { BotMessage, InlineKeyboard } from './bots/bot.helpers';
import type { TelegramWebhookRequest } from './telegram-auth.guard';

const BOT_NAMES = ['crm', 'mes', 'hr', 'logistics', 'fin', 'qc', 'director', 'ombor', 'pos'] as const;
type BotName = (typeof BOT_NAMES)[number];

// Zod schema (Rule 3) — validates the incoming Telegram webhook payload.
const TelegramUpdateSchema = z.object({
  message: z.object({
    chat: z.object({ id: z.union([z.number(), z.string()]).optional() }).optional(),
    from: z.object({ id: z.union([z.number(), z.string()]).optional() }).optional(),
    text: z.string().optional(),
    entities: z.array(z.object({
      type: z.string(),
      offset: z.number(),
      length: z.number(),
    })).optional(),
  }).optional(),
  callback_query: z.object({
    from: z.object({ id: z.union([z.number(), z.string()]).optional() }).optional(),
    data: z.string().optional(),
    message: z.object({ chat: z.object({ id: z.union([z.number(), z.string()]).optional() }).optional() }).optional(),
  }).optional(),
}).passthrough();

type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;

@Public()
@Controller('bot')
@Throttle({ default: { limit: 300, ttl: 60 } })
@UseGuards(TelegramAuthGuard)
export class BotGatewayController {
  private readonly logger = new Logger(BotGatewayController.name);
  private readonly bots: Record<BotName, { handle(msg: BotMessage): Promise<unknown> }>;

  constructor(
    crm:       CrmBotService,
    mes:       MesBotService,
    hr:        HrBotService,
    logistics: LogisticsBotService,
    fin:       FinBotService,
    qc:        QcBotService,
    director:  DirectorBotService,
    ombor:     OmborBotService,
    pos:       PosBotService,
  ) {
    this.bots = { crm, mes, hr, logistics, fin, qc, director, ombor, pos };
  }

  @Post(':bot/webhook')
  @HttpCode(200)
  async webhook(
    @Param('bot') bot: string,
    @Body() rawBody: unknown,
    @Req() req: TelegramWebhookRequest,
  ) {
    const botSvc = this.bots[bot as BotName];
    if (!botSvc) return {};

    const body: TelegramUpdate = TelegramUpdateSchema.parse(rawBody);
    const message  = body?.message;
    // For callback_query, Telegram sends the originating chat in callback_query.message.chat.id
    const chatId   = String(
      message?.chat?.id ??
      body?.callback_query?.message?.chat?.id ??
      body?.callback_query?.from?.id ??
      '',
    );
    const userId   = message?.from?.id ? String(message.from.id) : undefined;
    const text     = message?.text ?? body?.callback_query?.data ?? '';

    const entities         = message?.entities;
    const commandEntity    = entities ? entities.find((e) => e.type === 'bot_command') : undefined;
    const command          = commandEntity ? text.slice(commandEntity.offset, commandEntity.offset + commandEntity.length) : undefined;

    // Unlinked Telegram user — return a bot-native denial message instead of 401
    if (req.botLinked === false && chatId) {
      return {
        method:     'sendMessage',
        chat_id:    chatId,
        text:       '⚠️ Siz ERP ga bog\'lanmagan. Iltimos, HR bo\'limiga murojaat qiling.',
        parse_mode: 'HTML',
      };
    }

    const msg: BotMessage = {
      chatId,
      userId,
      text,
      command,
      employeeId: req.botEmployee?.id,
      role:       req.botEmployee?.role,
    };

    // Don't silently swallow handler errors — log them with the bot slug + chat
    // so an on-call engineer can trace which command crashed.
    const reply = await botSvc.handle(msg).catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Bot handler failed [${bot} · chat=${chatId} · cmd=${command ?? text.slice(0, 40)}]: ${errMsg}`,
      );
      return {
        text: '❌ Xizmat vaqtincha mavjud emas. Iltimos, qayta urinib ko\'ring.',
        parse: 'HTML' as const,
        success: false,
      };
    });

    if (!chatId) return {};

    // Return Telegram webhook reply method — Telegram will deliver this message to the user
    // without a separate outbound API call.
    const r = reply as { text?: string; parse?: string; replyMarkup?: InlineKeyboard };
    return {
      method:       'sendMessage',
      chat_id:      chatId,
      text:         r.text ?? '✅ Bajarildi',
      parse_mode:   r.parse === 'HTML' ? 'HTML' : undefined,
      // Item 18-notif#17 — carry the bot's inline keyboard through to Telegram so
      // night-shift users get tap-to-act buttons (PRIMARY channel), not just text.
      reply_markup: r.replyMarkup && r.replyMarkup.length ? { inline_keyboard: r.replyMarkup } : undefined,
    };
  }
}
