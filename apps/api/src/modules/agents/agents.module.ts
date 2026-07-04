/**
 * Agents Module — 14 ta AI agent
 */
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { IotModule } from '../iot/iot.module';

import { AgentEventBusService } from './shared/agent-event-bus.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentAlertService } from './shared/agent-alert.service';

import { DirectorAgentService } from './director-agent.service';
import { LeadScoringAgentService } from './lead-scoring-agent.service';
import { ProductionAgentService } from './production-agent.service';
import { InventoryAgentService } from './inventory-agent.service';
import { CashflowAgentService } from './cashflow-agent.service';
import { SupplierAgentService } from './supplier-agent.service';
import { HrPerformanceAgentService } from './hr-performance-agent.service';
import { QualityAgentService } from './quality-agent.service';
import { SecurityAgentService } from './security-agent.service';
import { MarketingAgentService } from './marketing-agent.service';
import { LmsAgentService } from './lms-agent.service';
import { IotAgentService } from './iot-agent.service';
import { FacilitiesAgentService } from './facilities-agent.service';
import { StrategicAgentService } from './strategic-agent.service';

import { AgentsController } from './agents.controller';

@Module({
  imports:     [AiModule, IotModule],
  controllers: [AgentsController],
  providers: [
    AgentEventBusService,
    AgentAuditService,
    AgentAlertService,
    DirectorAgentService,
    LeadScoringAgentService,
    ProductionAgentService,
    InventoryAgentService,
    CashflowAgentService,
    SupplierAgentService,
    HrPerformanceAgentService,
    QualityAgentService,
    SecurityAgentService,
    MarketingAgentService,
    LmsAgentService,
    IotAgentService,
    FacilitiesAgentService,
    StrategicAgentService,
  ],
  exports: [
    // Shared services
    AgentEventBusService,
    AgentAuditService,
    AgentAlertService,
    // 14 ta agent service — barchasi eksport qilinadi
    DirectorAgentService,
    LeadScoringAgentService,
    ProductionAgentService,
    InventoryAgentService,
    CashflowAgentService,
    SupplierAgentService,
    HrPerformanceAgentService,
    QualityAgentService,
    SecurityAgentService,
    MarketingAgentService,
    LmsAgentService,
    IotAgentService,
    FacilitiesAgentService,
    StrategicAgentService,
  ],
})
export class AgentsModule {}
