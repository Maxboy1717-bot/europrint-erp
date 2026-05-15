/**
 * @module what-if-simulation.tool
 * @description Lightweight back-of-envelope simulator. The LLM passes a
 * structured scenario; we evaluate three predefined templates (add machines,
 * raise price, change shift). Real Monte-Carlo lives in the AI Planning
 * module — this is the conversational shortcut.
 */

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';

export type ScenarioKind = 'add_machines' | 'raise_price' | 'change_shift';

export interface WhatIfResult {
  scenario:   ScenarioKind;
  productionDelta: number;
  costDelta:       number;
  roiMonths:       number;
  assumptions:     string[];
}

@Injectable()
export class WhatIfSimulationTool implements IAishaTool {
  readonly definition = {
    name: 'what_if_simulation',
    description: 'Ssenariy modellashtirish: mashina qo\'shish, narx, smena.',
    input_schema: {
      type: 'object' as const,
      properties: {
        scenario: { type: 'string', description: 'add_machines | raise_price | change_shift' },
        param:    { type: 'string', description: 'Raqamli parametr (masalan: 2)' },
      },
      required: ['scenario', 'param'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<WhatIfResult>>> {
    const scenario = String(input['scenario'] ?? '') as ScenarioKind;
    const param = parseFloat(String(input['param'] ?? '0'));
    if (!['add_machines','raise_price','change_shift'].includes(scenario)) {
      return Err(AppErr('VALIDATION', `Noma'lum scenario: ${scenario}`));
    }
    if (!Number.isFinite(param)) return Err(AppErr('VALIDATION', 'param raqam bo\'lishi kerak'));

    return safeCall<ToolResult<WhatIfResult>>(() => {
      const start = Date.now();
      let result: WhatIfResult;
      switch (scenario) {
        case 'add_machines':
          result = {
            scenario, productionDelta: 35 * param, costDelta: 250_000 * param, roiMonths: 14,
            assumptions: [`har bir mashina kuniga +35 birlik`, `boshlang\'ich xarajat $250 000/dona`],
          };
          break;
        case 'raise_price':
          result = {
            scenario, productionDelta: 0, costDelta: 0, roiMonths: 1,
            assumptions: [`elastiklik -0.4`, `narx oshishi ${param}%`],
          };
          break;
        case 'change_shift':
          result = {
            scenario, productionDelta: 18 * param, costDelta: 90_000 * param, roiMonths: 6,
            assumptions: [`smena +${param} soat`, `tunchi tarif +30%`],
          };
          break;
      }
      return Promise.resolve(provResult<WhatIfResult>({
        data: result,
        sources: [provSource({ type: 'ai_model', identifier: 'aisha.what_if_v1', startMs: start, freshness: 'live' })],
        confidence: 0.6,
      }));
    });
  }
}
