import { Injectable, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { ITelegramSvcRepository, TELEGRAM_SVC_REPO } from './i-telegram-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class TelegramSvc {
  private readonly logger = new Logger(TelegramSvc.name);

  constructor(@Inject(TELEGRAM_SVC_REPO) private readonly telegramSvcRepo: ITelegramSvcRepository) {}

  async sendMessage(dto: { userId: string; message: string; groupId?: string }){
    const userId = parseInt(dto.userId, 10) || 1;
    const messageId = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await this.telegramSvcRepo.insertNotification({
      userId,
      title: 'Telegram',
      message: dto.message,
      type: 'telegram',
      read: false,
    });
    if (!result.ok) throw new InternalServerErrorException(result.error);

    return {
      status: 'delivered',
      message: dto.message,
      messageId,
      recipient: dto.userId,
      groupId: dto.groupId || null,
    };
  }

  async getStatus(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.telegramSvcRepo.countAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return {
      isActive: true,
      connectedUsers: result.data,
      version: '1.0.0',
    };
  
    });}

  async sendNotification(userId: number, title: string, message: string){
    return safeCall(async () => {
    const result = await this.telegramSvcRepo.insertNotification({ userId, title, message, type: 'telegram', read: false });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async sendBulk(userIds: number[], message: string){
    return safeCall(async () => {
    const results = await Promise.all( 
      (userIds ?? []).map(id => this.sendMessage({ userId: String(id), message }))
    );
    return { sent: results.length, failed: 0 };
  
    });}
}
