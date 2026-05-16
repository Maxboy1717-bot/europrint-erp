/**
 * @module tools-contract.spec
 * @description Cross-cutting test: every AIsha tool exposes the correct
 * Anthropic tool-definition shape. We don't need to round-trip the DB —
 * the contract test catches the most common drift (missing name, missing
 * required, wrong type).
 */

jest.mock('@shared/db', () => ({ db: { execute: () => Promise.resolve({ rows: [] }) } }));

import { GetTodayBriefingTool } from '../../src/modules/aisha/application/tools/get-today-briefing.tool';
import { GetProductionStatusTool } from '../../src/modules/aisha/application/tools/get-production-status.tool';
import { GetMachineStatusTool } from '../../src/modules/aisha/application/tools/get-machine-status.tool';
import { GetOrderStatusTool } from '../../src/modules/aisha/application/tools/get-order-status.tool';
import { GetCustomerInfoTool } from '../../src/modules/aisha/application/tools/get-customer-info.tool';
import { GetEmployeeInfoTool } from '../../src/modules/aisha/application/tools/get-employee-info.tool';
import { GetInventoryLevelsTool } from '../../src/modules/aisha/application/tools/get-inventory-levels.tool';
import { GetFinancialSummaryTool } from '../../src/modules/aisha/application/tools/get-financial-summary.tool';
import { GetQualityMetricsTool } from '../../src/modules/aisha/application/tools/get-quality-metrics.tool';
import { GetActiveAlertsTool } from '../../src/modules/aisha/application/tools/get-active-alerts.tool';
import { ListAvailableCamerasTool } from '../../src/modules/aisha/application/tools/list-available-cameras.tool';
import { GetCameraSnapshotTool } from '../../src/modules/aisha/application/tools/get-camera-snapshot.tool';
import { GenerateKpiReportTool } from '../../src/modules/aisha/application/tools/generate-kpi-report.tool';
import { ComparePeriodsTool } from '../../src/modules/aisha/application/tools/compare-periods.tool';
import { ForecastDemandTool } from '../../src/modules/aisha/application/tools/forecast-demand.tool';
import { WhatIfSimulationTool } from '../../src/modules/aisha/application/tools/what-if-simulation.tool';
import { CreateReminderTool } from '../../src/modules/aisha/application/tools/create-reminder.tool';
import { AssignTaskTool } from '../../src/modules/aisha/application/tools/assign-task.tool';
import { SendEmailTool } from '../../src/modules/aisha/application/tools/send-email.tool';
import { ScheduleMeetingTool } from '../../src/modules/aisha/application/tools/schedule-meeting.tool';
import { DetectWorkersInAreaTool } from '../../src/modules/aisha/application/tools/detect-workers-in-area.tool';
import { DetectSafetyViolationsTool } from '../../src/modules/aisha/application/tools/detect-safety-violations.tool';
import { GetMachineStateViaVisionTool } from '../../src/modules/aisha/application/tools/get-machine-state-via-vision.tool';
import { AnalyzeCameraFeedTool } from '../../src/modules/aisha/application/tools/analyze-camera-feed.tool';
import { SendTelegramToTeamTool } from '../../src/modules/aisha/application/tools/send-telegram-to-team.tool';
import { ClaudeService } from '../../src/modules/aisha/application/llm/claude.service';
import type { IAishaTool } from '../../src/modules/aisha/domain/tool.interface';

const claudeStub = { sendOneShot: () => Promise.resolve({ ok: true, data: 'ok' }) } as unknown as ClaudeService;

function build(): IAishaTool[] {
  return [
    new GetTodayBriefingTool(),
    new GetProductionStatusTool(),
    new GetMachineStatusTool(),
    new GetOrderStatusTool(),
    new GetCustomerInfoTool(),
    new GetEmployeeInfoTool(),
    new GetInventoryLevelsTool(),
    new GetFinancialSummaryTool(),
    new GetQualityMetricsTool(),
    new GetActiveAlertsTool(),
    new ListAvailableCamerasTool(),
    new GetCameraSnapshotTool(),
    new AnalyzeCameraFeedTool(claudeStub),
    new DetectWorkersInAreaTool(claudeStub),
    new DetectSafetyViolationsTool(claudeStub),
    new GetMachineStateViaVisionTool(claudeStub),
    new GenerateKpiReportTool(),
    new ComparePeriodsTool(),
    new ForecastDemandTool(),
    new WhatIfSimulationTool(),
    new SendTelegramToTeamTool(),
    new SendEmailTool(),
    new ScheduleMeetingTool(),
    new CreateReminderTool(),
    new AssignTaskTool(),
  ];
}

describe('AIsha tool contracts', () => {
  const tools = build();

  it('exposes 25 tools', () => {
    expect(tools).toHaveLength(25);
  });

  it.each(tools.map(t => [t.definition.name, t]))(
    'tool "%s" has valid Anthropic definition',
    (_name, tool) => {
      const t = tool as IAishaTool;
      expect(t.definition.name).toMatch(/^[a-z_]+$/);
      expect(typeof t.definition.description).toBe('string');
      expect(t.definition.description.length).toBeGreaterThan(0);
      expect(t.definition.input_schema.type).toBe('object');
      expect(t.definition.input_schema.properties).toBeDefined();
    },
  );

  it('tool names are unique', () => {
    const names = tools.map(t => t.definition.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('what_if_simulation runs purely in-memory and returns valid provenance', async () => {
    const sim = new WhatIfSimulationTool();
    const r = await sim.execute({ scenario: 'add_machines', param: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.provenance.sources.length).toBeGreaterThan(0);
    expect(r.data.provenance.confidence).toBeLessThanOrEqual(1);
  });

  it('what_if_simulation rejects unknown scenarios', async () => {
    const sim = new WhatIfSimulationTool();
    const r = await sim.execute({ scenario: 'nope', param: 1 });
    expect(r.ok).toBe(false);
  });

  it('compare_periods rejects unknown metric', async () => {
    const cmp = new ComparePeriodsTool();
    const r = await cmp.execute({ metric: 'x', period1: '2026-01-01..2026-01-31', period2: '2026-02-01..2026-02-28' });
    expect(r.ok).toBe(false);
  });

  it('get_machine_status validates machineId', async () => {
    const t = new GetMachineStatusTool();
    const r = await t.execute({});
    expect(r.ok).toBe(false);
  });

  it('get_customer_info validates customerName', async () => {
    const t = new GetCustomerInfoTool();
    const r = await t.execute({});
    expect(r.ok).toBe(false);
  });

  it('send_email validates required fields', async () => {
    const t = new SendEmailTool();
    const r = await t.execute({ to: '', subject: '', body: '' });
    expect(r.ok).toBe(false);
  });

  it('create_reminder validates text/dueAt', async () => {
    const t = new CreateReminderTool();
    const r = await t.execute({});
    expect(r.ok).toBe(false);
  });

  it('forecast_demand validates horizon range', async () => {
    const t = new ForecastDemandTool();
    const r = await t.execute({ productCategory: 'x', horizonDays: '999' });
    expect(r.ok).toBe(false);
  });
});
