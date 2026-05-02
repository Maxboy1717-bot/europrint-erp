import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TelegramService } from '@modules/notifications/domain/services/telegram.service';
import { EmailNotificationService } from '@modules/notifications/domain/services/email-notification.service';
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

@Injectable()
export class AiAlertsService {
  private readonly logger = new Logger(AiAlertsService.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly email: EmailNotificationService,
  ) {}

  @OnEvent('mes.machine.emergency_stop')
  async onMesEmergencyStop(event: MesEmergencyStopEvent): Promise<void> {
    this.logger.error({
      msg:       'MES Emergency Stop — sending Telegram alert',
      machineId: event.machineId,
      reason:    event.reason,
    });

    const supervisors = await db.execute<{ telegram_chat_id: string }>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
      LIMIT 5
    `).then((r) => r.rows).catch(() => [] as { telegram_chat_id: string }[]);

    const text = `🚨 <b>MASHINA AVTO-TO'XTATILDI</b>\n`
               + `🔧 Mashina: <code>${event.machineId}</code>\n`
               + `❗ Sabab: ${event.reason}\n`
               + `🕐 Vaqt: ${event.timestamp.toISOString()}`;

    await Promise.all(
      supervisors.map((s) =>
        this.telegram.sendMessage(s.telegram_chat_id, text).catch((e: unknown) =>
          this.logger.warn({ msg: 'Failed to send MES alert', chatId: s.telegram_chat_id, err: e }),
        ),
      ),
    );
  }

  @OnEvent('mes.machine.anomaly_alert')
  async onMesAnomalyAlert(event: MesAnomalyAlertEvent): Promise<void> {
    this.logger.warn({
      msg:       'MES ALERT anomaly — HITL escalation via Telegram',
      machineId: event.machineId,
      zScore:    event.zScore,
      absZ:      event.absZ,
    });

    const supervisors = await db.execute<{ telegram_chat_id: string }>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
      LIMIT 5
    `).then((r) => r.rows).catch(() => [] as { telegram_chat_id: string }[]);

    const text = `⚠️ <b>MES ANOMALIYA OGOHLANTIRISHI</b>\n`
               + `🔧 Mashina: <code>${event.machineId}</code>\n`
               + `📊 Z-score: ${event.zScore.toFixed(2)} (|Z|=${event.absZ.toFixed(2)})\n`
               + `📈 Qiymat: ${event.value}\n`
               + `🕐 Vaqt: ${event.timestamp.toISOString()}\n`
               + `👤 <b>Inson qaroringiz kerak!</b> Jarayonni tekshiring.`;

    await Promise.all(
      supervisors.map((s) =>
        this.telegram.sendMessage(s.telegram_chat_id, text).catch((e: unknown) =>
          this.logger.warn({ msg: 'Failed to send anomaly alert', chatId: s.telegram_chat_id, err: e }),
        ),
      ),
    );
  }

  @OnEvent('sales.copilot.auto_price')
  async onSalesCopilotAutoPrice(event: SalesCopilotAutoPriceEvent): Promise<void> {
    this.logger.log({
      msg:        'SalesCopilot auto-price executed — notifying sales managers and customer',
      orderId:    event.orderId,
      price:      event.price,
      confidence: event.confidence,
    });

    const managers = await db.execute<{ telegram_chat_id: string }>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) IN ('sales_manager', 'sales_head', 'director')
      LIMIT 3
    `).then((r) => r.rows).catch(() => [] as { telegram_chat_id: string }[]);

    const formatted = new Intl.NumberFormat('uz-UZ').format(event.price);
    const internalText = `💼 <b>AI Sales Copilot: Avto-narx belgilandi</b>\n`
                       + `📦 Buyurtma: <code>${event.orderId}</code>\n`
                       + `💰 Narx: ${formatted} UZS\n`
                       + `🎯 Ishonch: ${Math.round(event.confidence * 100)}%\n`
                       + `🏷 Variant: ${event.choice}`;

    await Promise.all(
      managers.map((m) =>
        this.telegram.sendMessage(m.telegram_chat_id, internalText).catch((e: unknown) =>
          this.logger.warn({ msg: 'Failed to send sales alert', chatId: m.telegram_chat_id, err: e }),
        ),
      ),
    );

    // Customer-facing dispatch: send price proposal to customer via email
    const customerRow = await db.execute<{ email: string | null; name: string | null }>(sql`
      SELECT ca.email, ca.name
      FROM customer_orders co
      LEFT JOIN customer_accounts ca ON ca.id::text = co.customer_id
      WHERE co.order_number = ${event.orderId}
      LIMIT 1
    `).then((r) => r.rows[0]).catch(() => null);

    if (customerRow?.email) {
      const priceHtml = `
        <h2>Buyurtmangiz uchun narx taklifi</h2>
        <p>Hurmatli <b>${customerRow.name ?? 'Mijoz'}</b>,</p>
        <p>Buyurtma raqami <code>${event.orderId}</code> uchun AI tomonidan narx belgilandi:</p>
        <table style="border-collapse:collapse;width:100%;max-width:400px">
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><b>Narx</b></td>
              <td style="padding:8px;border:1px solid #e5e7eb">${formatted} UZS</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb"><b>Variant</b></td>
              <td style="padding:8px;border:1px solid #e5e7eb">${event.choice}</td></tr>
        </table>
        <p>Savol yoki murojaat uchun sales@europrint.uz manziliga yozing.</p>
      `;
      await this.email.send({
        to:      customerRow.email,
        subject: `EuroPrint — Buyurtma #${event.orderId} narx taklifi`,
        html:    priceHtml,
        text:    `Buyurtma #${event.orderId} uchun narx: ${formatted} UZS (${event.choice})`,
      }).catch((e: unknown) =>
        this.logger.warn({ msg: 'Customer price email failed', orderId: event.orderId, err: e }),
      );
    }
  }

  @OnEvent('sales.copilot.director_approval_required')
  async onDirectorApprovalRequired(event: SalesCopilotDirectorApprovalEvent): Promise<void> {
    this.logger.log({
      msg:        'SalesCopilot soft-HITL: Director approval required',
      orderId:    event.orderId,
      price:      event.price,
      hitlReason: event.hitlReason,
    });

    const directors = await db.execute<{ telegram_chat_id: string }>(sql`
      SELECT e.telegram_chat_id
      FROM employees e
      WHERE LOWER(e.status) = 'active'
        AND e.telegram_chat_id IS NOT NULL
        AND LOWER(e.role) = 'director'
      LIMIT 3
    `).then((r) => r.rows).catch(() => [] as { telegram_chat_id: string }[]);

    const formatted    = new Intl.NumberFormat('uz-UZ').format(event.price);
    const creditPct    = (event.creditUtil * 100).toFixed(1);
    const directorText = `🔔 <b>Direktor tasdiqi kerak — AI Sales Copilot</b>\n\n`
                       + `📦 Buyurtma: <code>${event.orderId}</code>\n`
                       + `💰 Avto-narx: ${formatted} UZS\n`
                       + `📊 Kredit ulushi: ${creditPct}%\n`
                       + `🎯 Ishonch: ${Math.round(event.confidence * 100)}%\n`
                       + `⚠️ Sabab: ${event.hitlReason ?? 'soft HITL chegarasi oshdi'}\n\n`
                       + `Buyurtma bajarildi, lekin Siz tasdiqlashingiz yoki bekor qilishingiz mumkin.\n`
                       + `ERP: /director/ai-audit`;

    await Promise.all(
      directors.map((d) =>
        this.telegram.sendMessage(d.telegram_chat_id, directorText).catch((e: unknown) =>
          this.logger.warn({ msg: 'Failed to notify director', chatId: d.telegram_chat_id, err: e }),
        ),
      ),
    );
  }
}
