import { Body, Controller, Param, Post, HttpCode, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import type { BotMessage } from './bots/bot.helpers';
import type { TelegramWebhookRequest } from './telegram-auth.guard';

const BOT_NAMES = ['crm', 'mes', 'hr', 'logistics', 'fin', 'qc', 'director', 'ombor', 'pos'] as const;
type BotName = (typeof BOT_NAMES)[number];

interface TelegramUpdate {
  message?: {
    chat?:     { id?: number | string };
    from?:     { id?: number | string };
    text?:     string;
    entities?: { type: string; offset: number; length: number }[];
  };
  callback_query?: {
    from?:    { id?: number | string };
    data?:    string;
    message?: { chat?: { id?: number | string } };
  };
}

@Public()
@Controller('bot')
@Throttle({ default: { limit: 300, ttl: 60 } })
@UseGuards(TelegramAuthGuard)
export class BotGatewayController {
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
    @Body() body: TelegramUpdate,
    @Req() req: TelegramWebhookRequest,
  ) {
    const botSvc = this.bots[bot as BotName];
    if (!botSvc) return {};

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

    const reply = await botSvc.handle(msg).catch(() => ({
      text: '❌ Xizmat vaqtincha mavjud emas. Iltimos, qayta urinib ko\'ring.', parse: 'HTML' as const, success: false,
    }));

    if (!chatId) return {};

    // Return Telegram webhook reply method — Telegram will deliver this message to the user
    // without a separate outbound API call.
    const r = reply as { text?: string; parse?: string };
    return {
      method:     'sendMessage',
      chat_id:    chatId,
      text:       r.text ?? '✅ Bajarildi',
      parse_mode: r.parse === 'HTML' ? 'HTML' : undefined,
    };
  }
}
