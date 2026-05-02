import { Module } from '@nestjs/common';
import { TelegramBotsService } from './telegram-bots.service';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { TelegramBotsPipEventsService } from './telegram-bots-pip-events.service';
import { TelegramBotsPipEventsRepository } from './telegram-bots-pip-events.repository';
import { TelegramBotsCronService } from './telegram-bots-cron.service';
import { TelegramBotsController } from './telegram-bots.controller';
import { HrBotService } from './hr-bot.service';
import { RecruitmentBotService } from './recruitment-bot.service';
import { ReportBotService } from './report-bot.service';
import { ReportBotDataService } from './report-bot-data.service';
import { ReportBotDataRepository } from './report-bot-data.repository';
import { NotificationBotService } from './notification-bot.service';
import { BotSchemaService } from './bot-schema.service';
import { BotSchemaRepository } from './bot-schema.repository';
import { ManagerBotService } from './manager-bot.service';
import { AttendanceBotService } from './attendance-bot.service';
import { LearningBotService } from './learning-bot.service';
import { BoomerangEmbeddingService } from './boomerang-embedding.service';
import { DocumentWorkflowModule } from '../document-workflow/document-workflow.module';

@Module({
  imports: [DocumentWorkflowModule],
  controllers: [TelegramBotsController],
  providers: [
    BotSchemaRepository,
    BotSchemaService,
    HrBotService,
    RecruitmentBotService,
    ReportBotService,
    ReportBotDataRepository,
    ReportBotDataService,
    NotificationBotService,
    TelegramBotsRepository,
    TelegramBotsService,
    TelegramBotsPipEventsRepository,
    TelegramBotsPipEventsService,
    TelegramBotsCronService,
    ManagerBotService,
    AttendanceBotService,
    LearningBotService,
    BoomerangEmbeddingService,
  ],
  exports: [TelegramBotsService, NotificationBotService, ManagerBotService, AttendanceBotService, LearningBotService],
})
export class TelegramBotsModule {}
