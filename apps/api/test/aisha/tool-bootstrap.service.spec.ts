/**
 * @module tool-bootstrap.service.spec
 * @description Verifies that AishaToolBootstrap registers every injected tool
 * into ToolRegistry on module init, and that a duplicate-tool registration
 * is swallowed (logged) rather than crashing the application.
 */

import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AishaToolBootstrap } from '../../src/modules/aisha/application/tools/tool-bootstrap.service';
import { ToolRegistry } from '../../src/modules/aisha/application/tools/tool.registry';
import type { IAishaTool } from '../../src/modules/aisha/domain/tool.interface';
import { Ok } from '../../src/common/result';

function mkTool(name: string): IAishaTool {
  return {
    definition: {
      name,
      description: 'test',
      input_schema: { type: 'object', properties: {} },
    },
    execute: () => Promise.resolve(Ok({
      data: null,
      provenance: {
        sources: [{ type: 'database', identifier: 't', queriedAt: 'now', latencyMs: 1, freshness: 'live' }],
        confidence: 1, citations: [],
      },
    })),
  };
}

describe('AishaToolBootstrap', () => {
  // 25 distinct stub tools matching the bootstrap constructor arity
  const TOOL_NAMES = [
    'analyze_camera_feed', 'assign_task', 'compare_periods', 'create_reminder',
    'detect_safety_violations', 'detect_workers_in_area', 'forecast_demand',
    'generate_kpi_report', 'get_active_alerts', 'get_camera_snapshot',
    'get_customer_info', 'get_employee_info', 'get_financial_summary',
    'get_inventory_levels', 'get_machine_state_via_vision', 'get_machine_status',
    'get_order_status', 'get_production_status', 'get_quality_metrics',
    'get_today_briefing', 'list_available_cameras', 'schedule_meeting',
    'send_email', 'send_telegram_to_team', 'what_if_simulation',
  ];

  function buildBootstrap(registry: ToolRegistry): AishaToolBootstrap {
    const tools = TOOL_NAMES.map(mkTool);
    return new (AishaToolBootstrap as unknown as new (
      registry: ToolRegistry,
      ...tools: IAishaTool[]
    ) => AishaToolBootstrap)(registry, ...tools);
  }

  it('registers every injected tool into the registry on onModuleInit', () => {
    const registry = new ToolRegistry();
    const bootstrap = buildBootstrap(registry);

    bootstrap.onModuleInit();

    expect(registry.size()).toBe(TOOL_NAMES.length);
    for (const name of TOOL_NAMES) {
      const r = registry.getToolByName(name);
      expect(r.ok).toBe(true);
    }
  });

  it('does not throw when duplicate tools collide — registration failure must not crash startup', () => {
    const registry = new ToolRegistry();
    // Pre-register one tool name so registerAll() will hit a duplicate
    registry.register(mkTool('analyze_camera_feed'));
    const bootstrap = buildBootstrap(registry);
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    expect(() => bootstrap.onModuleInit()).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('is wireable through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ToolRegistry,
        { provide: AishaToolBootstrap, useFactory: (reg: ToolRegistry) => buildBootstrap(reg), inject: [ToolRegistry] },
      ],
    }).compile();
    expect(moduleRef.get(AishaToolBootstrap)).toBeInstanceOf(AishaToolBootstrap);
    await moduleRef.close();
  });
});
