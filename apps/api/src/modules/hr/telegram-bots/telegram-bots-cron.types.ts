/**
 * @module telegram-bots-cron.types
 * @description Shared types for telegram-bots cron helpers (Rule 16 split).
 */

import type { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NotificationBotService } from './notification-bot.service';
import type { TelegramBotsRepository } from './telegram-bots.repository';
import type { AttendanceBotService } from './attendance-bot.service';

export interface IncidentPayload {
  severity: string;
  type: 'FIRE' | 'MEDICAL' | string;
  location: string;
  description?: string;
  responsiblePerson?: string;
  incidentTime?: string;
}

export interface CronDeps {
  logger: NodeJS.WritableStream | Logger;
  notif: NotificationBotService;
  repo: TelegramBotsRepository;
  cfg: ConfigService;
  attendance: AttendanceBotService;
}
