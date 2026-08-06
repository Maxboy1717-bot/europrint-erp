/**
 * @module chat-presence-cleanup.cron
 * @description audit 2026-08-06 T17 — presence TTL sweep. ChatGateway writes ONLINE on
 *   connect and OFFLINE on disconnect, but a lost disconnect event (server crash,
 *   Q-44 nest-watch tree-kill) left users "ONLINE" forever — live DB showed a row stuck
 *   ONLINE for 3+ weeks. This cron marks ONLINE rows older than the CRUD-configurable
 *   chat.presence_ttl_minutes (business_settings, default 5) as OFFLINE every minute.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getBusinessSettingNumber } from '../../shared/config/business-settings.reader';
import { ChatPresenceRepository } from './repositories/chat-presence.repository';

const PRESENCE_TTL_MINUTES_DEFAULT = 5;

@Injectable()
export class ChatPresenceCleanupCron {
  private readonly logger = new Logger(ChatPresenceCleanupCron.name);

  constructor(private readonly presenceRepo: ChatPresenceRepository) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepStalePresence(): Promise<void> {
    const ttl = await getBusinessSettingNumber('chat.presence_ttl_minutes', PRESENCE_TTL_MINUTES_DEFAULT);
    const r = await this.presenceRepo.sweepStaleOnline(ttl);
    if (r.ok && r.data > 0) {
      this.logger.log(`Presence sweep: ${r.data} ta stale-ONLINE foydalanuvchi OFFLINE qilindi (TTL=${ttl} daqiqa)`);
    }
  }
}
