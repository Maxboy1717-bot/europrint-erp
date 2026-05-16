/**
 * @module tool-bootstrap.service
 * @description Registers every concrete AIsha tool into the central
 * `ToolRegistry` on application bootstrap. Each tool is itself
 * `@Injectable()`, so NestJS DI supplies the dependencies; we just collect
 * them into the registry once so the chat / SSE layers can iterate tool
 * definitions when invoking Claude with tool-use.
 *
 * Adding a new tool:
 *   1. Implement `IAishaTool` and `@Injectable()`-decorate the class.
 *   2. Register the class in `AishaModule.providers`.
 *   3. Inject it here and append to the constructor list.
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ToolRegistry } from './tool.registry';

import { AnalyzeCameraFeedTool }       from './analyze-camera-feed.tool';
import { AssignTaskTool }               from './assign-task.tool';
import { ComparePeriodsTool }           from './compare-periods.tool';
import { CreateReminderTool }           from './create-reminder.tool';
import { DetectSafetyViolationsTool }   from './detect-safety-violations.tool';
import { DetectWorkersInAreaTool }      from './detect-workers-in-area.tool';
import { ForecastDemandTool }           from './forecast-demand.tool';
import { GenerateKpiReportTool }        from './generate-kpi-report.tool';
import { GetActiveAlertsTool }          from './get-active-alerts.tool';
import { GetCameraSnapshotTool }        from './get-camera-snapshot.tool';
import { GetCustomerInfoTool }          from './get-customer-info.tool';
import { GetEmployeeInfoTool }          from './get-employee-info.tool';
import { GetFinancialSummaryTool }      from './get-financial-summary.tool';
import { GetInventoryLevelsTool }       from './get-inventory-levels.tool';
import { GetMachineStateViaVisionTool } from './get-machine-state-via-vision.tool';
import { GetMachineStatusTool }         from './get-machine-status.tool';
import { GetOrderStatusTool }           from './get-order-status.tool';
import { GetProductionStatusTool }      from './get-production-status.tool';
import { GetQualityMetricsTool }        from './get-quality-metrics.tool';
import { GetTodayBriefingTool }         from './get-today-briefing.tool';
import { ListAvailableCamerasTool }     from './list-available-cameras.tool';
import { ScheduleMeetingTool }          from './schedule-meeting.tool';
import { SendEmailTool }                from './send-email.tool';
import { SendTelegramToTeamTool }       from './send-telegram-to-team.tool';
import { WhatIfSimulationTool }         from './what-if-simulation.tool';

@Injectable()
export class AishaToolBootstrap implements OnModuleInit {
  private readonly logger = new Logger(AishaToolBootstrap.name);

  constructor(
    private readonly registry: ToolRegistry,
    // 25 tools — order matches the import list above
    private readonly t01: AnalyzeCameraFeedTool,
    private readonly t02: AssignTaskTool,
    private readonly t03: ComparePeriodsTool,
    private readonly t04: CreateReminderTool,
    private readonly t05: DetectSafetyViolationsTool,
    private readonly t06: DetectWorkersInAreaTool,
    private readonly t07: ForecastDemandTool,
    private readonly t08: GenerateKpiReportTool,
    private readonly t09: GetActiveAlertsTool,
    private readonly t10: GetCameraSnapshotTool,
    private readonly t11: GetCustomerInfoTool,
    private readonly t12: GetEmployeeInfoTool,
    private readonly t13: GetFinancialSummaryTool,
    private readonly t14: GetInventoryLevelsTool,
    private readonly t15: GetMachineStateViaVisionTool,
    private readonly t16: GetMachineStatusTool,
    private readonly t17: GetOrderStatusTool,
    private readonly t18: GetProductionStatusTool,
    private readonly t19: GetQualityMetricsTool,
    private readonly t20: GetTodayBriefingTool,
    private readonly t21: ListAvailableCamerasTool,
    private readonly t22: ScheduleMeetingTool,
    private readonly t23: SendEmailTool,
    private readonly t24: SendTelegramToTeamTool,
    private readonly t25: WhatIfSimulationTool,
  ) {}

  onModuleInit(): void {
    try {
      this.registry.registerAll([
        this.t01, this.t02, this.t03, this.t04, this.t05,
        this.t06, this.t07, this.t08, this.t09, this.t10,
        this.t11, this.t12, this.t13, this.t14, this.t15,
        this.t16, this.t17, this.t18, this.t19, this.t20,
        this.t21, this.t22, this.t23, this.t24, this.t25,
      ]);
      this.logger.log(`Registered ${this.registry.size()} AIsha tools`);
    } catch (err) {
      this.logger.error(
        { error: (err as Error).message },
        'AIsha tool registration failed — chat will fall back to no-tools mode',
      );
    }
  }
}
