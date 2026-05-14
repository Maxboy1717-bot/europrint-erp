/**
 * @module notification-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import { TelegramBotsRepository } from './telegram-bots.repository';
import { NOTIFICATION_TEMPLATES, NotificationTemplateKey, renderTemplate } from './notification-templates';
import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';

export interface ErpEventPayload {
  event: string;
  employeeId?: number;
  chatId?: number | string;
  data?: Record<string, unknown>;
}

export interface SendNotificationDto {
  userId: number;
  templateKey: NotificationTemplateKey;
  params: Record<string, string>;
}

type TCtxWithChat = Context & { chat?: { id?: number } };
type D = Record<string, unknown>;

@Injectable()
export class NotificationBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private readonly pendingLateReasons = new Map<string, string>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_NOTIFICATION_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[notification-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Notification Bot token not configured (TELEGRAM_NOTIFICATION_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Notification Bot launch error: ${errMsg(err)}`));
        this.logger.log('Notification Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Notification Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() { this.bot?.stop('Notification Bot stopped'); }

  async getEmployeeChatId(employeeId: number): Promise<string | undefined> {
    try {
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(employeeId);
      return (chatIdR.ok ? (chatIdR.data as string | null) : null) ?? undefined;
    } catch (e) { this.logger.warn('[NotifBot] getEmployeeChatId failed', String(e)); }
  }

  registerLateReasonPending(chatId: string, employeeId: string): void {
    this.pendingLateReasons.set(String(chatId), employeeId);
  }

  async sendNotification(dto: SendNotificationDto): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const chatId = await this.getEmployeeChatId(dto.userId);
      if (!chatId) {
        this.logger.debug(`sendNotification: no chatId for userId=${dto.userId}`);
        return;
      }
      const tpl = NOTIFICATION_TEMPLATES[dto.templateKey];
      const message = renderTemplate(tpl.template_uz, dto.params);
      await this.sendRaw(chatId, message);
    });
  }

  private async sendRaw(chatId: string | number, message: string): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      this.logger.error(`sendRaw error: ${errMsg(err)}`);
    }
  }

  private registerStartCommand(bot: Telegraf<Context>): void {
    bot.command('start', async (ctx: Context) => {
      if (!(ctx as TCtxWithChat).chat?.id) return;
      await ctx.reply(
        '🔔 <b>EuroPrint Notification Bot</b>\n\nUshbu bot ERP tizimidagi muhim xabarlarni yetkazib beradi.\n\n' +
        'Buyruqlar:\n/sozlamalar — Bildirishnoma sozlamalari\n/ulash — Hisobni ulash',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerSozlamalarCommand(bot: Telegraf<Context>): void {
    bot.command('sozlamalar', async (ctx: Context) => {
      await ctx.reply(
        '⚙️ <b>Bildirishnoma sozlamalari</b>\n\n' +
        '✅ Hujjat tasdiqlash/rad etish\n✅ Kechikish ogohlantirishlari\n✅ Adaptatsiya xavfi\n' +
        '✅ PIP eslatmalari\n✅ Kunlik hisobot eslatmasi\n✅ Ta\'til tasdiqlash\n' +
        '✅ Maosh bildirishnomasi\n✅ Tug\'ilgan kun tabriklari\n\n' +
        'Barcha bildirishnomalar ERP orqali boshqariladi:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerUlashCommand(bot: Telegraf<Context>): void {
    bot.command('ulash', async (ctx: Context) => {
      const chatId = (ctx as TCtxWithChat).chat?.id;
      await ctx.reply(
        `🔗 <b>Hisobni ulash</b>\n\nChat ID: <code>${chatId}</code>\n\n` +
        'Ushbu chat ID ni HR bo\'limiga yuboring va ular ERP tizimida akkauntingizga ulashadi.\n\n' +
        'Yoki ERP da o\'zingiz ulashingiz mumkin:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerInboundTextHandler(bot: Telegraf<Context>): void {
    bot.on(message('text' as never), async (ctx: Context) => {
      const chatId = String((ctx as TCtxWithChat).chat?.id ?? '');
      if (!chatId) return;
      const employeeId = this.pendingLateReasons.get(chatId);
      if (!employeeId) return;
      const text = ((ctx as Context & { message?: { text?: string } }).message?.text ?? '').trim();
      if (!text) return;
      if (text.length < 30) {
        await ctx.reply(
          `❌ Sabab juda qisqa (${text.length} ta belgi). Kamida 30 ta belgi yozing va qayta yuboring.`,
          { parse_mode: 'HTML' },
        );
        return;
      }
      this.pendingLateReasons.delete(chatId);
      await this.eventEmitter.emitAsync('telegram.late_reason_received', { employeeId, reason: text });
    });
  }

  private registerCommands(bot: Telegraf<Context>): void {
    this.registerStartCommand(bot);
    this.registerSozlamalarCommand(bot);
    this.registerUlashCommand(bot);
    this.registerInboundTextHandler(bot);
  }

  async sendNotificationRaw(chatId: number | string, message: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    } catch (err) {
      this.logger.error(`sendNotificationRaw error: ${err instanceof Error ? errMsg(err) : String(err)}`);
      return false;
    }
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    return this.sendNotificationRaw(chatId, message);
  }

  async broadcastTemplate(templateKey: keyof typeof NOTIFICATION_TEMPLATES, params: Record<string, string>): Promise<number> {
    if (!this.bot) return 0;
    const tpl = NOTIFICATION_TEMPLATES[templateKey];
    const message = renderTemplate(tpl.template_uz, params);
    const chatIdsR = await this.telegramRepo.getAllActiveChatIds();
    const chatIds = chatIdsR.ok ? chatIdsR.data as string[] : [];
    let sent = 0;
    for (const chatId of chatIds) {
      if (await this.sendNotificationRaw(chatId, message)) sent++;
    }
    return sent;
  }

  async handleErpEvent(payload: ErpEventPayload): Promise<string | undefined> {
    const { event, employeeId, data } = payload;
    let chatId: string | undefined = payload.chatId ? String(payload.chatId) : undefined;
    if (!chatId && employeeId) chatId = await this.getEmployeeChatId(employeeId);
    if (!chatId) { this.logger.debug(`handleErpEvent: no chatId for event=${event}`); return undefined; }
    const message = this.buildEventMessage(event, data ?? {});
    if (message) await this.sendNotificationRaw(chatId, message);
    return chatId;
  }

  private buildDocumentEventMessage(event: string, d: D): string | undefined {
    const link = '<a href="https://erp.europrint.uz">erp.europrint.uz</a>';
    if (event === 'document.step.notify' || event === 'document.submitted')
      return renderTemplate(NOTIFICATION_TEMPLATES.APPROVAL_PENDING.template_uz, {
        document_title: String(d['documentTitle'] ?? 'Hujjat'),
        submitter_name: String(d['submitterName'] ?? 'Xodim'),
        submitted_at: String(d['submittedAt'] ?? _time.now().toLocaleString('uz')),
        url: 'https://erp.europrint.uz',
      });
    if (event === 'document.approved')
      return renderTemplate(NOTIFICATION_TEMPLATES.DOC_SIGNED.template_uz, {
        document_title: String(d['documentTitle'] ?? 'Hujjat'),
        signer_name: String(d['approverName'] ?? 'HR'),
        signed_at: String(d['approvedAt'] ?? _time.now().toLocaleString('uz')),
        url: 'https://erp.europrint.uz',
      });
    if (event === 'document.rejected')
      return renderTemplate(NOTIFICATION_TEMPLATES.DOC_REJECTED.template_uz, {
        document_title: String(d['documentTitle'] ?? 'Hujjat'),
        approver_name: String(d['approverName'] ?? 'HR'),
        rejection_reason: String(d['rejectionReason'] ?? 'Sabab ko\'rsatilmagan'),
        url: 'https://erp.europrint.uz',
      });
    if (event === 'document.overdue')
      return `⚠️ <b>Hujjat muddati o'tgan!</b>\n\nHujjat: ${String(d['documentTitle'] ?? 'Hujjat')}\nDeadline: ${String(d['deadline'] ?? 'Belgilanmagan')}\n\nImzolash uchun: ${link}`;
    return;
  }

  private buildPipEventMessage(event: string, d: D): string | undefined {
    const link = '<a href="https://erp.europrint.uz">erp.europrint.uz</a>';
    if (event === 'pip.progress.reminder' || event === 'pip.progress_updated')
      return `📋 <b>PIP eslatma</b>\n\nBajarish muddati: ${String(d['dueDate'] ?? 'Belgilanmagan')}\nQolgan maqsadlar: ${String(d['pendingGoals'] ?? 0)} ta\n\nMaqsadlaringizni bajarishni davom eting!\n${link}`;
    if (event === 'pip.started')
      return `📋 <b>Ishlash yaxshilash rejasi (PIP) boshlandi</b>\n\nDavomiyligi: ${String(d['durationDays'] ?? 30)} kun\nMaqsadlar soni: ${String(d['goalsCount'] ?? 0)} ta\n\nBatafsil: ${link}`;
    if (event === 'pip.completed')
      return `✅ <b>PIP muvaffaqiyatli yakunlandi!</b>\n\nBarcha maqsadlar bajarildi.\nRahmat, siz yaxshi natijalarga erishdingiz!🎉`;
    if (event === 'pip.failed')
      return `❌ <b>PIP yakunlandi — maqsadlar bajarilmadi</b>\n\nHR bo'limi bilan muloqot o'tkaziladi.\nBatafsil: ${link}`;
    return;
  }

  private buildHrEventMessage(event: string, d: D): string | undefined {
    const link = '<a href="https://erp.europrint.uz">erp.europrint.uz</a>';
    if (event === 'attendance.late')
      return renderTemplate(NOTIFICATION_TEMPLATES.LATE_ARRIVAL_REASON.template_uz, {
        late_minutes: String(d['lateMinutes'] ?? 0),
        arrival_time: String(d['arrivalTime'] ?? 'Noma\'lum'),
        date: String(d['date'] ?? _time.now().toISOString().split('T')[0]),
      });
    if (event === 'adaptation.at_risk')
      return `⚠️ <b>Adaptatsiya xavfi!</b>\n\nXodim: ${String(d['employeeName'] ?? 'Xodim')}\nAdaptatsiya kuni: ${String(d['adaptationDay'] ?? '')}\nXavf darajasi: <b>${String(d['riskLevel'] ?? 'o\'rta')}</b>\nSabab: ${String(d['reason'] ?? 'Adaptatsiya ko\'rsatkichlari past')}\n\nBatafsil: ${link}`;
    if (event === 'discipline.issued')
      return `⚠️ <b>Intizom chorasi qo'llanildi</b>\n\nTur: ${String(d['disciplineType'] ?? 'Ogohlantirishlar')}\nSabab: ${String(d['reason'] ?? 'Ko\'rsatilmagan')}\n\nBatafsil: ${link}`;
    if (event === 'employee.blocked')
      return renderTemplate(NOTIFICATION_TEMPLATES.ABSENCE_BLOCKED.template_uz, {
        hr_phone: String(d['hrPhone'] ?? '+998900000000'),
      });
    if (event === 'employee.unblocked')
      return `✅ <b>Kirish tiklandi</b>\n\nERP kirishingiz qayta tiklandi.\n${link}`;
    return;
  }

  private buildMiscEventMessage(event: string, d: D): string | undefined {
    const link = '<a href="https://erp.europrint.uz">erp.europrint.uz</a>';
    if (event === 'gamification.badge.awarded')
      return `🏆 <b>Yangi nishon!</b>\n\n${String(d['badgeName'] ?? 'Nishon')} oldingi nishon qo'lga kiritildi!\n${String(d['badgeDescription'] ?? '')}\n\nTabriklaymiz!🎉`;
    if (event === 'gamification.points.awarded')
      return `⭐ <b>+${String(d['points'] ?? 0)} ball!</b>\n\n${String(d['reason'] ?? 'Ball berildi')}\n\nUmumiy ball: ${String(d['totalPoints'] ?? '')}`;
    if (event === 'shift.assigned')
      return `🕐 <b>Smena belgilandi</b>\n\nSana: ${String(d['date'] ?? '')}\nTur: ${String(d['shiftType'] ?? '')}\nVaqt: ${String(d['startTime'] ?? '')} – ${String(d['endTime'] ?? '')}`;
    if (event === 'offboarding.started')
      return `📋 <b>Ishdan chiqish jarayoni boshlandi</b>\n\nOxirgi ish kuni: ${String(d['lastWorkingDay'] ?? 'Belgilanmagan')}\n\nHR bilan yuzlashuv sanasi kelishiladi.`;
    if (event === 'recruitment.candidate_hired')
      return renderTemplate(NOTIFICATION_TEMPLATES.OFFER_ACCEPTED.template_uz, {
        name: String(d['name'] ?? 'Hurmatli nomzod'),
        start_date: String(d['startDate'] ?? 'Kelishiladi'),
      });
    if (event === 'chat.new_message')
      return `💬 <b>Yangi xabar</b>\n\nKim: ${String(d['senderName'] ?? 'Xodim')}\nChat: ${String(d['roomName'] ?? 'Guruh')}\nXabar: ${String(d['preview'] ?? '')}\n\nKo'rish: ${link}`;
    if (event === 'penalty.assigned')
      return renderTemplate(NOTIFICATION_TEMPLATES.PENALTY_ASSIGNED.template_uz, {
        name: String(d['name'] ?? ''),
        penalty_type: String(d['penaltyType'] ?? 'Jarima'),
        amount: String(d['amount'] ?? ''),
        reason: String(d['reason'] ?? ''),
        appeal_deadline: String(d['appealDeadline'] ?? ''),
        url: 'https://erp.europrint.uz',
      });
    if (event === 'reward.given')
      return renderTemplate(NOTIFICATION_TEMPLATES.REWARD_GIVEN.template_uz, {
        name: String(d['name'] ?? ''),
        reward_title: String(d['rewardTitle'] ?? 'Mukofot'),
        reward_value: String(d['rewardValue'] ?? ''),
        reason: String(d['reason'] ?? ''),
      });
    return;
  }

  private buildEventMessage(event: string, data: D): string | undefined {
    return (
      this.buildDocumentEventMessage(event, data) ??
      this.buildPipEventMessage(event, data) ??
      this.buildHrEventMessage(event, data) ??
      this.buildMiscEventMessage(event, data)
    );
  }

  getInstance(): Telegraf<Context> | null { return this.bot; }
}
