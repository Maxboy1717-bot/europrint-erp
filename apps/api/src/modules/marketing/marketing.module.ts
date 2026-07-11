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
import { MarketingGroup2Controller } from './presentation/marketing-group2.controller';
import { MarketingExtService } from './application/marketing-ext.service';
import { OrderTrendService } from './application/order-trend.service';
import { MarketingGroup2Service } from './application/marketing-group2.service';
import { DrizzleMarketingExtRepository } from './infrastructure/repositories/drizzle-marketing-ext.repo';
import { DrizzleMarketingGroup2Repository } from './infrastructure/repositories/drizzle-marketing-group2.repo';
import { LeadsService } from './leads/leads.service';
import { LeadsRepository } from './leads/leads.repository';
import { CampaignsService } from './campaigns/campaigns.service';
import { CampaignsRepository } from './campaigns/campaigns.repository';
import { CAMPAIGN_REPO } from './domain/repositories/i-campaign.repo';
import { DrizzleCampaignRepository } from './infrastructure/repositories/drizzle-campaign.repo';
import { MarketingRoiService } from './application/marketing-roi.service';
import { NpsRequestsController } from './presentation/nps-requests.controller';
import { NpsRequestsRepository } from './infrastructure/repositories/nps-requests.repository';
import { NpsAutoRequestListener } from './infrastructure/listeners/nps-auto-request.listener';
import { ManagerKpiController } from './presentation/manager-kpi.controller';
import { ManagerKpiService } from './application/manager-kpi.service';
import { DrizzleManagerKpiRepository } from './infrastructure/repositories/drizzle-manager-kpi.repo';
import { WinBackRepository } from './infrastructure/repositories/win-back.repository';
import { WinBackCron } from './infrastructure/cron/win-back.cron';
import { CustomerRhythmController } from './presentation/customer-rhythm.controller';
import { CustomerRhythmService } from './application/customer-rhythm.service';
import { DrizzleCustomerRhythmRepository } from './infrastructure/repositories/drizzle-customer-rhythm.repo';
import { PromoCodesController } from './presentation/promo-codes.controller';
import { PromoCodesService } from './promo-codes/promo-codes.service';
import { PromoCodesRepository } from './promo-codes/promo-codes.repository';

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
  controllers: [
    MarketingController,
    MarketingContentController,
    MarketingAnalyticsController,
    MarketingAnalyticsStubsController,
    MarketingGroup2Controller,
    NpsRequestsController,
    CustomerRhythmController,
    ManagerKpiController,
    PromoCodesController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...repositories,
    DrizzleMarketingExtRepository,
    MarketingExtService,
    OrderTrendService,
    DrizzleMarketingGroup2Repository,
    MarketingGroup2Service,
    LeadsRepository,
    LeadsService,
    CampaignsRepository,
    CampaignsService,
    MarketingRoiService,
    NpsRequestsRepository,
    NpsAutoRequestListener,
    DrizzleCustomerRhythmRepository,
    CustomerRhythmService,
    WinBackRepository,
    WinBackCron,
    ManagerKpiService,
    DrizzleManagerKpiRepository,
    PromoCodesRepository,
    PromoCodesService,
  ],
  exports: [CAMPAIGN_REPO, MarketingRoiService],
})
export class MarketingModule {}
