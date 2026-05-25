import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailNotificationService {
  async sendNotification(to: string, subject: string, body: string, link?: string): Promise<void> {
    // Stub: delegate to email provider in production
  }
}
