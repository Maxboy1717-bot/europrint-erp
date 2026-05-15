/**
 * @module manager-bot.types
 * @description Shared types for manager-bot handler modules.
 */

import type { Logger } from '@nestjs/common';
import type { TelegramBotsRepository } from '../telegram-bots.repository';
import type { DocumentWorkflowService } from '../../document-workflow/document-workflow.service';

export interface PendingReject {
  documentId: number;
  stepId: number;
  step: 'awaiting_reason';
}

export interface LinkSession {
  step: 'awaiting_phone';
}

export interface HandlersDeps {
  telegramRepo: TelegramBotsRepository;
  documentWorkflow: DocumentWorkflowService;
  pendingRejects: Map<number, PendingReject>;
  linkSessions: Map<number, LinkSession>;
  logger: Logger;
}
