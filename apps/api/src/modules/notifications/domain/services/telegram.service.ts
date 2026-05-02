import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Err , Ok } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Result } from '@common/types/result.type';
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly cfg: ConfigService,
  ) {
    this.botToken = this.cfg.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }
  async sendMessage(chatId: string, message: string): Promise<Result<void>> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured');
      return Ok(undefined);
    }
    return this.httpService
      .post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      })
      .toPromise()
      .then(() => {
        this.logger.debug('Telegram message sent');
        return Ok(undefined);
      })
      .catch((error) => {
        this.logger.error('Failed to send Telegram message');
        return Err((error as Error).message);
      });
  }
  async sendAlert(
    chatId: string,
    title: string,
    body?: string,
    urgency?: 'low' | 'medium' | 'high',
  ): Promise<Result<void>>;
  async sendAlert(
    chatId: string,
    title: string,
    bodyOrUrgency?: string | 'low' | 'medium' | 'high',
    urgencyOrUndefined?: 'low' | 'medium' | 'high',
  ): Promise<Result<void>> {
    let body = '';
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    if (
      typeof bodyOrUrgency === 'string' &&
      !['low', 'medium', 'high'].includes(bodyOrUrgency)
    ) {
      body = bodyOrUrgency;
      urgency = (urgencyOrUndefined as 'low' | 'medium' | 'high') || 'medium';
    } else if (
      typeof bodyOrUrgency === 'string' &&
      ['low', 'medium', 'high'].includes(bodyOrUrgency)
    ) {
      urgency = bodyOrUrgency as 'low' | 'medium' | 'high';
    }
    const urgencyEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    }[urgency];
    const timestamp = _time.now().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const message = `${urgencyEmoji} <b>${urgency.toUpperCase()}: ${title}</b>${body ? `\n${body}` : ''}\n\n⏰ ${timestamp}`;
    return this.sendMessage(chatId, message);
  }
  async sendOrderStatusUpdate(
    managerId: number,
    orderId: number,
    status: string,
  ): Promise<Result<void>> {
    const message = `Order #${orderId} status changed to: ${status}`;
    this.logger.log('Order status update');
    return Ok(undefined);
  }
  async sendAdvanceReminder(
    managerId: number,
    orderId: number,
    remaining: number,
  ): Promise<Result<void>> {
    const message = `Order #${orderId}: ${remaining} days remaining for advance`;
    this.logger.log('Advance reminder');
    return Ok(undefined);
  }
  async sendCertExpiry(
    employeeId: number,
    certName: string,
    expiresAt: Date,
  ): Promise<Result<void>> {
    const message = `Certificate "${certName}" expires at ${expiresAt.toDateString()}`;
    this.logger.log('Certificate expiry');
    return Ok(undefined);
  }
  async sendStockAlert(
    warehouseManagerId: number,
    materialId: number,
    currentQty: number,
  ): Promise<Result<void>> {
    const message = `Stock alert for material #${materialId}: Current qty=${currentQty}`;
    this.logger.log('Stock alert');
    return Ok(undefined);
  }
  async sendQcResult(
    productionManagerId: number,
    orderId: number,
    passed: boolean,
  ): Promise<Result<void>> {
    const status = passed ? 'PASSED' : 'FAILED';
    const message = `QC result for order #${orderId}: ${status}`;
    this.logger.log('QC result');
    return Ok(undefined);
  }
}