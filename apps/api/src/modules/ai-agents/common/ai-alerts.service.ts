/**
 * @module ai-alerts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';
import { IEmailSender, EMAIL_SENDER } from '@modules/notifications/domain/ports/i-email-sender.port';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface MesEmergencyStopEvent {
  machineId: string;
  reason:    string;
  timestamp: Date;
}

interface MesAnomalyAlertEvent {
  machineId: string;
  zScore:    number;
  value:     number;
  absZ:      number;
  timestamp: Date;
}

interface SalesCopilotAutoPriceEvent {
  orderId:    string;
  choice:     string;
  price:      number;
  confidence: number;
  timestamp:  Date;
}

interface SalesCopilotDirectorApprovalEvent {
  orderId:    string;
  price:      number;
  creditUtil: number;
  hitlReason: string | null;
  confidence: number;
  timestamp:  Date;
}

/** SB0504: emitted by AiFitService.evaluate() when a real (non-fallback) AI-fit score is below threshold. */
interface AiFitLowScoreEvent {
  employeeId: number;
  cardId:     number;
  fitScore:   number;
  summary:    string | null;
  timestamp:  Date;
}

type RecipientRow = { telegram_chat_id: string };

@Injectable()
export class AiAlertsService {
  private readonly logger = new Logger(AiAlertsService.name);

  constructor(
    @Inject(TELEGRAM_SENDER) private readonly telegram: ITelegramSender,
    @Inject(EMAIL_SENDER) private readonly email: IEmailSender,
  ) {}

  @OnEvent('mes.machine.emergency_stop')
  async onMesEmergencyStop(event: MesEmergencyStopEvent): Promise<void> {
    this.logger.error({
      msg:       'MES Emergency Stop — sending Telegram alert',
      machineId: event.machineId,
      reason:    event.reason,
    });
    const supervisors = await this.findSupervisors();
    const text = `🚨 <b>MASHINA AVTO-TO'XTATILDI</b>\n`
               + `🔧 Mashina: <code>${event.machineId}</code>\n`
               + `❗ Sabab: ${event.reason}\n`
               + `🕐 Vaqt: ${event.timestamp.toISOString()}`;
    await this.broadcastTelegram(supervisors, text, 'MES alert');
  }

  @OnEvent('mes.machine.anomaly_alert')
  async onMesAnomalyAlert(event: MesAnomalyAlertEvent): Promise<void> {
    this.logger.warn({
      msg:       'MES ALERT anomaly — HITL escalation via Telegram',
      machineId: event.machineId,
      zScore:    event.zScore,
      absZ:      event.absZ,
    });
    const supervisors = await this.findSupervisors();
    const text = this.buildAnomalyText(event);
    await this.broadcastTelegram(supervisors, text, 'anomaly alert');
  }

  private buildAnomalyText(event: MesAnomalyAlertEvent): string {
    return `⚠️ <b>MES ANOMALIYA OGOHLANTIRISHI</b>\n`
         + `🔧 Mashina: <code>${event.machineId}</code>\n`
         + `📊 Z-score: ${event.zScore.toFixed(2)} (|Z|=${event.absZ.toFixed(2)})\n`
         + `📈 Qiymat: ${event.value}\n`
         + `🕐 Vaqt: ${event.timestamp.toISOString()}\n`
         + `👤 <b>Inson qaroringiz kerak!</b> Jarayonni tekshiring.`;
  }

  @OnEvent('sales.copilot.auto_price')
  async onSalesCopilotAutoPrice(event: SalesCopilotAutoPriceEvent): Promise<void> {
    this.logger.log({
      msg:        'SalesCopilot auto-price executed — notifying sales managers and customer',
      orderId:    event.orderId,
      price:      event.price,
      confidence: event.confidence,
    });
    const managers = await this.findSalesManagers();
    const formatted = new Intl.NumberFormat('uz-UZ').format(event.price);
    const internalText = this.buildAutoPriceInternalText(event, formatted);
    await this.broadcastTelegram(managers, internalText, 'sales alert');
    await this.dispatchCustomerPriceEmail(event, formatted);
  }

  private buildAutoPriceInternalText(event: SalesCopilotAutoPriceEvent, formatted: string): string {
    return `💼 <b>AI Sales Copilot: Avto-narx belgilandi</b>\n`
         + `📦 Buyurtma: <code>${event.orderId}</code>\n`
         + `💰 Narx: ${formatted} UZS\n`
         + `🎯 Ishonch: ${Math.round(event.confidence * 100)}%\n`
         + `🏷 Variant: ${event.choice}`;
  }

  private async dispatchCustomerPriceEmail(event: SalesCopilotAutoPriceEvent, formatted: string): Promise<void> {
    const customerRow = await db.execute<{ email: string | null; name: string | null }>(sql`
      SELECT ca.email, ca.name
      FROM customer_orders co
      LEFT JOIN customer_accounts ca ON ca.id::text = co.customer_id
      WHERE co.order_number = ${event.orderId}
      LIMIT 1
    `).then((r) => r.rows[0]).catch(() => null);

    if (!customerRow?.email) return;
    const priceHtml = this.buildCustomerPriceHtml(event, formatted, customerRow.name);
    await this.email.send({
      to:      customerRow.email,
      subject: `EuroPrint — Buyurtma #${event.orderId} narx taklifi`,
      html:    priceHtml,
      text:    `Buyurtma #${event.orderId} uchun narx: ${formatted} UZS (${event.choice})`,
    }).catch((e: unknown) =>
      this.logger.warn({ msg: 'Customer price email failed', orderId: event.orderId, err: e }),
    );
  }

  private buildCustomerPriceHtml(event: SalesCopilotAutoPriceEvent, formatted: string, name: string | null): string {
    return `
        <h2>Buyurtmangiz uchun narx taklifi</h2>
        <p>Hurmatli <b>${name ?? 'Mijoz'}</b>,</p>
        <p>Buyurtma raqami <code>${event.orderId}</code> uchun AI tomonidan narx belgilandi:</p>
        <table style="border-collapse:collapse;width:100%;max-width:400px">
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><b>Narx</b></td>
              <td style="padding:8px;border:1px solid #e5e7eb">${formatted} UZS</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><b>Variant</b></td>
              <td style="padding:8px;border:1px solid #e5e7eb">${event.choice}</td></tr>
        </table>
        <p>Savol yoki murojaat uchun sales@europrint.uz manziliga yozing.</p>
      `;
  }

  @OnEvent('sales.copilot.director_approval_required')
  async onDirectorApprovalRequired(event: SalesCopilotDirectorApprovalEvent): Promise<void> {
    this.logger.log({
      msg:        'SalesCopilot soft-HITL: Director approval required',
      orderId:    event.orderId,
      price:      event.price,
      hitlReason: event.hitlReason,
    });
    const directors = await this.findDirectors();
    const directorText = this.buildDirectorApprovalText(event);
    await this.broadcastTelegram(directors, directorText, 'director notification');
  }

  private buildDirectorApprovalText(event: SalesCopilotDirectorApprovalEvent): string {
    const formatted = new Intl.NumberFormat('uz-UZ').format(event.price);
    const creditPct = (event.creditUtil * 100).toFixed(1);
    return `🔔 <b>Direktor tasdiqi kerak — AI Sales Copilot</b>\n\n`
         + `📦 Buyurtma: <code>${event.orderId}</code>\n`
         + `💰 Avto-narx: ${formatted} UZS\n`
         + `📊 Kredit ulushi: ${creditPct}%\n`
         + `🎯 Ishonch: ${Math.round(event.confidence * 100)}%\n`
         + `⚠️ Sabab: ${event.hitlReason ?? 'soft HITL chegarasi oshdi'}\n\n`
         + `Buyurtma bajarildi, lekin Siz tasdiqlashingiz yoki bekor qilishingiz mumkin.\n`
         + `ERP: /director/ai-audit`;
  }

  @OnEvent('ai.fit.low_score')
  async onAiFitLowScore(event: AiFitLowScoreEvent): Promise<void> {
    this.logger.warn({
      msg:        'AI-fit past-moslik ogohlantiruvi — HR ga Telegram yuborilmoqda',
      employeeId: event.employeeId,
      cardId:     event.cardId,
      fitScore:   event.fitScore,
    });
    const hrManagers = await this.findHrManagers();
    const text = this.buildLowFitAlertText(event);
    await this.broadcastTelegram(hrManagers, text, 'AI-fit low-score alert');
  }

  private buildLowFitAlertText(event: AiFitLowScoreEvent): string {
    return `⚠️ <b>AI-fit: past moslik aniqlandi</b>\n`
         + `👤 Xodim ID: <code>${event.employeeId}</code>\n`
         + `🗂 Karta ID: <code>${event.cardId}</code>\n`
         + `📉 Moslik bahosi: ${event.fitScore.toFixed(0)}/100\n`
         + (event.summary ? `📝 Xulosa: ${event.summary}\n` : '')
         + `🕐 Vaqt: ${event.timestamp.toISOString()}\n`
         + `👤 HR ko'rib chiqishi kerak — bu avtomatik bloklamaydi.`;
  }

  private async findHrManagers(): Promise<RecipientRow[]> {
    return db.execute<RecipientRow>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('hr_manager', 'hr_head', 'director')
      LIMIT 5
    `).then((r) => r.rows).catch(() => [] as RecipientRow[]);
  }

  private async findSupervisors(): Promise<RecipientRow[]> {
    return db.execute<RecipientRow>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
      LIMIT 5
    `).then((r) => r.rows).catch(() => [] as RecipientRow[]);
  }

  private async findSalesManagers(): Promise<RecipientRow[]> {
    return db.execute<RecipientRow>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('sales_manager', 'sales_head', 'director')
      LIMIT 3
    `).then((r) => r.rows).catch(() => [] as RecipientRow[]);
  }

  private async findDirectors(): Promise<RecipientRow[]> {
    try {
      const rows = await db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) = 'director'
        LIMIT 3
      `);
      return rows.rows;
    } catch (e) {
      this.logger.warn(`aiAlerts.directors lookup failed: ${String(e)}`);
      return [];
    }
  }

  private async broadcastTelegram(recipients: RecipientRow[], text: string, label: string): Promise<void> {
    await Promise.all(
      recipients.map((r) =>
        this.telegram.sendMessage(r.telegram_chat_id, text).catch((e: unknown) =>
          this.logger.warn({ msg: `Failed to send ${label}`, chatId: r.telegram_chat_id, err: e }),
        ),
      ),
    );
  }
}
