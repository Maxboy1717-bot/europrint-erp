/**
 * @module bot-gateway.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrmBotService } from './bots/crm.bot';
import { MesBotService } from './bots/mes.bot';
import { HrBotService } from './bots/hr.bot';
import { LogisticsBotService } from './bots/logistics.bot';
import { FinBotService } from './bots/fin.bot';
import { QcBotService } from './bots/qc.bot';
import { DirectorBotService } from './bots/director.bot';
import { OmborBotService } from './bots/ombor.bot';
import { PosBotService } from './bots/pos.bot';
import { BotGatewayController } from './bot-gateway.controller';
import { TelegramAuthGuard } from './telegram-auth.guard';

@Module({
  imports: [ConfigModule],
  providers: [
    TelegramAuthGuard,
    CrmBotService,
    MesBotService,
    HrBotService,
    LogisticsBotService,
    FinBotService,
    QcBotService,
    DirectorBotService,
    OmborBotService,
    PosBotService,
  ],
  controllers: [BotGatewayController],
  exports: [
    CrmBotService, MesBotService, HrBotService,
    LogisticsBotService, FinBotService, QcBotService,
    DirectorBotService, OmborBotService, PosBotService,
  ],
})
export class BotGatewayModule {}
