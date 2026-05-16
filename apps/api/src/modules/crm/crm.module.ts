/**
 * @module crm.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TelegramModule } from '../../telegram/telegram.module';
import { CrmLeadsController } from './presentation/crm-leads.controller';
import { CrmLeadsOpsController } from './presentation/crm-leads-ops.controller';
import { CrmDealsController } from './presentation/crm-deals.controller';
import { CrmContactsController } from './presentation/crm-contacts.controller';
import { CrmCompaniesController } from './presentation/crm-companies.controller';
import { CrmActivitiesController } from './presentation/crm-activities.controller';
import { CrmExtrasController } from './presentation/crm-extras.controller';
import { CrmCommsController } from './presentation/crm-comms.controller';
import { CrmCustomFieldsController } from './presentation/crm-custom-fields.controller';
import { CrmAiExtendedController } from './presentation/crm-ai-extended.controller';
import { CreateLeadHandler } from './application/commands/create-lead.handler';
import { QualifyLeadHandler } from './application/commands/qualify-lead.handler';
import { CreateDealHandler } from './application/commands/create-deal.handler';
import { MarkDealWonHandler } from './application/commands/mark-deal-won.handler';
import { MarkDealLostHandler } from './application/commands/mark-deal-lost.handler';
import { ConvertLeadToDealHandler } from './application/commands/convert-lead-to-deal.handler';
import { UpdateDealHandler } from './application/commands/update-deal.handler';
import { UpdateDealStageHandler } from './application/commands/update-deal-stage.handler';
import { DeleteDealHandler } from './application/commands/delete-deal.handler';
import { ListLeadsHandler } from './application/queries/list-leads.handler';
import { GetLeadByIdHandler } from './application/queries/get-lead-by-id.handler';
import { CrmPipelineHandler } from './application/queries/crm-pipeline.handler';
import { DrizzleLeadRepository } from './infrastructure/repositories/drizzle-lead.repo';
import { DrizzleDealRepository } from './infrastructure/repositories/drizzle-deal.repo';
import { LEAD_REPO } from './domain/repositories/i-lead.repo';
import { DEAL_REPO } from './domain/repositories/i-deal.repo';
import { DealWonListener } from './infrastructure/event-handlers/deal-won.listener';
import { WebsiteOrderLeadListener } from './listeners/website-order-lead.listener';
import { WebsiteContactLeadListener } from './listeners/website-contact-lead.listener';
import { WebsiteLeadService } from './listeners/website-lead.service';
import { WebsiteLeadRepository } from './listeners/website-lead.repository';
import { loggerProvider } from '../shared/infrastructure/logger.provider';
import { LeadScorerService } from './domain/services/lead-scorer.service';
import { CrmAiController } from './presentation/crm-ai.controller';
import { CrmAutoLeadController } from './presentation/crm-auto-lead.controller';
import { CrmBitrixCompatController } from './presentation/crm-bitrix-compat.controller';
import { CrmFollowupCompatController } from './presentation/crm-followup-compat.controller';
import { CRM_DEALS_REPO } from './deals/i-crm-deals.repo';
import { DrizzleCrmDealsRepository } from './deals/drizzle-crm-deals.repo';
import { DealsService } from './deals/deals.service';
import { CRM_CONTACTS_REPO } from './contacts/i-crm-contacts.repo';
import { DrizzleCrmContactsRepository } from './contacts/drizzle-crm-contacts.repo';
import { ContactsService } from './contacts/contacts.service';
import { CRM_LEADS_REPO } from './leads/i-crm-leads.repo';
import { DrizzleCrmLeadsRepository } from './leads/drizzle-crm-leads.repo';
import { LeadsService } from './leads/leads.service';
import { CRM_PIPELINES_REPO } from './pipelines/i-crm-pipelines.repo';
import { DrizzleCrmPipelinesRepository } from './pipelines/drizzle-crm-pipelines.repo';
import { PipelinesService } from './pipelines/pipelines.service';
import { CrmActivitiesService } from './application/crm-activities.service';
import { CrmActivitiesRepository } from './infrastructure/repositories/crm-activities.repository';
import { CRM_ACTIVITIES_REPO } from './domain/repositories/i-crm-activities.repo';
import { CrmAiService } from './application/crm-ai.service';
import { CrmAiRepository } from './infrastructure/repositories/crm-ai.repository';
import { CRM_AI_REPO } from './domain/repositories/i-crm-ai.repo';
import { CrmAutoLeadService } from './application/crm-auto-lead.service';
import { CrmAutoLeadRepository } from './infrastructure/repositories/crm-auto-lead.repository';
import { CRM_AUTO_LEAD_REPO } from './domain/repositories/i-crm-auto-lead.repo';
import { CrmBitrixCompatService } from './application/crm-bitrix-compat.service';
import { CrmBitrixCompatRepository } from './application/crm-bitrix-compat.repository';
import { CrmCompaniesService } from './application/crm-companies.service';
import { CrmCompaniesRepository } from './infrastructure/repositories/crm-companies.repository';
import { CRM_COMPANIES_REPO } from './domain/repositories/i-crm-companies.repo';
import { CrmContactsService } from './application/crm-contacts.service';
import { CrmContactsRepository } from './infrastructure/repositories/crm-contacts.repository';
import { CRM_CONTACTS_APP_REPO } from './domain/repositories/i-crm-contacts-app.repo';
import { CrmFollowupCompatService } from './application/crm-followup-compat.service';
import { CrmFollowupCompatRepository } from './application/crm-followup-compat.repository';
import { CrmLeadsOpsRepository } from './infrastructure/repositories/crm-leads-ops.repository';
import { CRM_LEADS_OPS_REPO } from './domain/repositories/i-crm-leads-ops.repo';
import { UpdateLeadHandler } from './application/commands/update-lead.handler';
import { UpdateLeadStageHandler } from './application/commands/update-lead-stage.handler';
import { DeleteLeadHandler } from './application/commands/delete-lead.handler';
import { CrmExtrasService } from './application/crm-extras.service';
import { CrmExtrasRepository } from './application/crm-extras.repository';
import { CrmCommsService } from './application/crm-comms.service';
import { CrmCommsRepository } from './application/crm-comms.repository';
import { CrmCustomFieldsService } from './application/crm-custom-fields.service';
import { CrmCustomFieldsRepository } from './infrastructure/repositories/crm-custom-fields.repository';
import { CRM_CUSTOM_FIELDS_REPO } from './domain/repositories/i-crm-custom-fields.repo';
import { CrmAiExtendedService } from './application/crm-ai-extended.service';
import { LeadScorerV2Service } from './domain/services/lead-scorer-v2.service';
import { EloRatingService } from './domain/services/elo-rating.service';
import { RfmService } from './analytics/rfm.service';
import { ClvService } from './analytics/clv.service';
import { ChurnService } from './analytics/churn.service';
import { FunnelService } from './analytics/funnel.service';
import { CohortService } from './analytics/cohort.service';
import { KMeansService } from './analytics/kmeans.service';
import { ChurnRetrainService } from './analytics/churn-retrain.service';
import { CrmAnalyticsController } from './presentation/crm-analytics.controller';

const commandHandlers = [
  CreateLeadHandler, QualifyLeadHandler, CreateDealHandler,
  MarkDealWonHandler, MarkDealLostHandler, ConvertLeadToDealHandler,
  UpdateLeadHandler, UpdateLeadStageHandler, DeleteLeadHandler,
  UpdateDealHandler, UpdateDealStageHandler, DeleteDealHandler,
];
const queryHandlers = [ListLeadsHandler, GetLeadByIdHandler, CrmPipelineHandler];
const eventListeners = [
  DealWonListener,
  WebsiteOrderLeadListener,    // Trigger 21
  WebsiteContactLeadListener,  // Trigger 22
];

const repositories = [
  { provide: LEAD_REPO, useClass: DrizzleLeadRepository },
  { provide: DEAL_REPO, useClass: DrizzleDealRepository },
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), ConfigModule, TelegramModule],
  controllers: [
    CrmLeadsController,
    CrmLeadsOpsController,
    CrmDealsController,
    CrmContactsController,
    CrmCompaniesController,
    CrmActivitiesController,
    CrmAiController,
    CrmAutoLeadController,
    CrmBitrixCompatController,
    CrmFollowupCompatController,
    CrmExtrasController,
    CrmCommsController,
    CrmCustomFieldsController,
    CrmAiExtendedController,
    CrmAnalyticsController,
  ],
  providers: [
    loggerProvider,
    ...commandHandlers,
    ...queryHandlers,
    ...eventListeners,
    ...repositories,
    LeadScorerService,
    { provide: CRM_DEALS_REPO, useClass: DrizzleCrmDealsRepository },
    DealsService,
    { provide: CRM_CONTACTS_REPO, useClass: DrizzleCrmContactsRepository },
    ContactsService,
    { provide: CRM_LEADS_REPO, useClass: DrizzleCrmLeadsRepository },
    LeadsService,
    { provide: CRM_PIPELINES_REPO, useClass: DrizzleCrmPipelinesRepository },
    PipelinesService,
    { provide: CRM_ACTIVITIES_REPO, useClass: CrmActivitiesRepository },
    CrmActivitiesService,
    { provide: CRM_AI_REPO, useClass: CrmAiRepository },
    CrmAiService,
    { provide: CRM_AUTO_LEAD_REPO, useClass: CrmAutoLeadRepository },
    CrmAutoLeadService,
    CrmBitrixCompatRepository,
    CrmBitrixCompatService,
    { provide: CRM_COMPANIES_REPO, useClass: CrmCompaniesRepository },
    CrmCompaniesService,
    { provide: CRM_CONTACTS_APP_REPO, useClass: CrmContactsRepository },
    CrmContactsService,
    CrmFollowupCompatRepository,
    CrmFollowupCompatService,
    { provide: CRM_LEADS_OPS_REPO, useClass: CrmLeadsOpsRepository },
    CrmExtrasRepository,
    CrmExtrasService,
    CrmCommsRepository,
    CrmCommsService,
    { provide: CRM_CUSTOM_FIELDS_REPO, useClass: CrmCustomFieldsRepository },
    CrmCustomFieldsService,
    CrmAiExtendedService,
    LeadScorerV2Service,
    EloRatingService,
    RfmService,
    ClvService,
    ChurnService,
    FunnelService,
    CohortService,
    KMeansService,
    ChurnRetrainService,
    // Trigger 21/22 — Saytdan CRM Lead
    WebsiteLeadRepository,
    WebsiteLeadService,
  ],
  exports: [LEAD_REPO, DEAL_REPO, LeadScorerService, LeadScorerV2Service, EloRatingService, RfmService, ClvService, ChurnService, FunnelService, CohortService, KMeansService, ChurnRetrainService],
})
export class CrmModule {}
