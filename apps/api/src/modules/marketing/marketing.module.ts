/**
 * @module marketing.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { CreateCampaignHandler } from './application/commands/create-campaign.handler';
import { UpdateCampaignHandler } from './application/commands/update-campaign.handler';
import { LaunchCampaignHandler } from './application/commands/launch-campaign.handler';
import { GetCampaignsHandler } from './application/queries/get-campaigns.handler';
import { GetCampaignHandler } from './application/queries/get-campaign.handler';
import { MarketingController } from './presentation/marketing.controller';
import { MarketingContentController } from './presentation/marketing-content.controller';
import { MarketingAnalyticsController, MarketingAnalyticsStubsController } from './presentation/marketing-analytics.controller';
import { MarketingExtService } from './application/marketing-ext.service';
import { DrizzleMarketingExtRepository } from './infrastructure/repositories/drizzle-marketing-ext.repo';
import { LeadsService } from './leads/leads.service';
import { LeadsRepository } from './leads/leads.repository';
import { CampaignsService } from './campaigns/campaigns.service';
import { CampaignsRepository } from './campaigns/campaigns.repository';
import { CAMPAIGN_REPO } from './domain/repositories/i-campaign.repo';
import { DrizzleCampaignRepository } from './infrastructure/repositories/drizzle-campaign.repo';

const commandHandlers = [CreateCampaignHandler, UpdateCampaignHandler, LaunchCampaignHandler];
const queryHandlers = [GetCampaignsHandler, GetCampaignHandler];
const repositories = [
  {
    provide: CAMPAIGN_REPO,
    useClass: DrizzleCampaignRepository,
  },
];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [MarketingController, MarketingContentController, MarketingAnalyticsController, MarketingAnalyticsStubsController],
  providers: [...commandHandlers, ...queryHandlers, ...repositories, DrizzleMarketingExtRepository, MarketingExtService, LeadsRepository, LeadsService, CampaignsRepository, CampaignsService],
  exports: [CAMPAIGN_REPO],
})
export class MarketingModule {}
