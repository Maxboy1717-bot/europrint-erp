/**
 * telegram-bot.service.ts
 * Telegram bot xabarnomalar — to'g'ridan-to'g'ri Bot API orqali.
 *
 * .env:
 *   TELEGRAM_BOT_TOKEN=12345:ABC...
 *   TELEGRAM_DEFAULT_CHAT_ID=  (umumiy guruh, ixtiyoriy)
 *
 * Bot Token olish:
 *   1. Telegram da @BotFather ga yozing
 *   2. /newbot — yangi bot yaratish
 *   3. Token ni .env ga qo'ying
 *
 * Foydalanuvchi chat ID si users.telegram_id da saqlanadi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppError } from '@common/result';

interface TgLogEntry {
  chatId:   string;
  text:     string;
  status:   'sent' | 'failed';
  error?:   string;
  sentAt:   Date;
}

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly logs: TgLogEntry[] = [];

  constructor(private readonly configService: ConfigService) {}

  private get token(): string | null {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? null;
  }

  /**
   * Bitta xodimga xabar yuborish.
   */
  async sendMessage(chatId: string | number, text: string, opts?: { parseMode?: 'HTML' | 'Markdown' }): Promise<Result<{ sent: boolean }, AppError>> {
    if (!this.token) {
      this.logger.warn('[Telegram] TELEGRAM_BOT_TOKEN sozlanmagan');
      this.logs.push({ chatId: String(chatId), text, status: 'failed', error: 'No token', sentAt: new Date() });
      return Err({ message: 'Telegram bot sozlanmagan', code: 'EXTERNAL_SERVICE' });
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: opts?.parseMode ?? 'HTML',
          disable_web_page_preview: true,
        }),
      });
      const data = await res.json() as { ok: boolean; description?: string };

      if (data.ok) {
        this.logs.push({ chatId: String(chatId), text, status: 'sent', sentAt: new Date() });
        this.logger.log(`[Telegram] ✅ chat=${chatId}: ${text.substring(0, 60)}`);
        return Ok({ sent: true });
      }
      this.logs.push({ chatId: String(chatId), text, status: 'failed', error: data.description, sentAt: new Date() });
      this.logger.warn(`[Telegram] ❌ chat=${chatId}: ${data.description}`);
      return Err({ message: data.description ?? 'unknown', code: 'EXTERNAL_SERVICE' });
    } catch (e) {
      this.logs.push({ chatId: String(chatId), text, status: 'failed', error: String(e), sentAt: new Date() });
      this.logger.error(`[Telegram] xato: ${String(e)}`);
      return Err({ message: String(e), code: 'EXTERNAL_SERVICE' });
    }
  }

  /** Bir nechta xodimga */
  async sendToMany(chatIds: Array<string | number>, text: string): Promise<{ sent: number; failed: number }> {
    let sent = 0, failed = 0;
    for (const id of chatIds) {
      const r = await this.sendMessage(id, text);
      if (r.ok && r.data.sent) sent++; else failed++;
    }
    return { sent, failed };
  }

  /** Past stok xabarnomasi */
  async notifyLowStock(chatId: string | number, materialName: string, current: number, min: number, unit: string) {
    const text = `<b>⚠️ Past stok</b>\n\n` +
                 `📦 <b>${materialName}</b>\n` +
                 `Joriy: ${current} ${unit}\n` +
                 `Minimum: ${min} ${unit}\n\n` +
                 `<i>To'ldirish kerak</i>`;
    return this.sendMessage(chatId, text);
  }

  /** Karantin 48+ soat */
  async notifyQuarantineExpired(chatId: string | number, movementNumber: string, hours: number, supplier?: string) {
    const text = `<b>🔬 QC tekshiruvi kerak</b>\n\n` +
                 `📋 <b>${movementNumber}</b>\n` +
                 (supplier ? `🚛 ${supplier}\n` : '') +
                 `⏰ Karantinda: ${hours} soat\n\n` +
                 `<i>QC inspektor qarori kutmoqda</i>`;
    return this.sendMessage(chatId, text);
  }

  /** Zarar akti */
  async notifyDamage(chatId: string | number, movementNumber: string, amount: number, desc?: string) {
    const text = `<b>⚡ Zarar akti</b>\n\n` +
                 `📋 <b>${movementNumber}</b>\n` +
                 `💰 Summa: ${amount.toLocaleString('uz-UZ')} UZS\n` +
                 (desc ? `\n${desc}` : '') +
                 `\n\n<i>Tasdiqlash kerak</i>`;
    return this.sendMessage(chatId, text);
  }

  /** Tasdiqlash kerak */
  async notifyApprovalRequired(chatId: string | number, movementNumber: string, type: string) {
    const text = `<b>📋 Tasdiqlash kerak</b>\n\n` +
                 `Hujjat: <b>${movementNumber}</b>\n` +
                 `Turi: ${type}\n\n` +
                 `<i>Ko'rib chiqing va tasdiqlang</i>`;
    return this.sendMessage(chatId, text);
  }

  /** Konfiguratsiya holati */
  getStatus() {
    return {
      configured:    !!this.token,
      defaultChatId: this.configService.get<string>('TELEGRAM_DEFAULT_CHAT_ID') ?? null,
      logsCount:     this.logs.length,
    };
  }

  /** Test xabar */
  async testMessage(chatId: string | number): Promise<Result<{ sent: boolean }, AppError>> {
    return this.sendMessage(chatId, '<b>🤖 EuroPrint ERP — Test</b>\n\nBot to\'g\'ri sozlangan!', { parseMode: 'HTML' });
  }

  /** Logs */
  getLogs(limit = 100): TgLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }
}
