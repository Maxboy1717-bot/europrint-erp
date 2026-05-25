/**
 * DirectorAiAuditTypes.ts
 * Interfaces and constants for DirectorAiAudit
 */

export interface AgentStat {
  agentCode:     string;
  total:         number;
  autoCount:     number;
  overrideCount: number;
  avgConfidence: number;
  avgLatency:    number;
  totalCostUsd:  number;
  autoRate:      number;
  errorRate:     number;
}

export interface Decision {
  id:            string;
  agentCode:     string;
  entityType:    string;
  entityId:      string;
  confidence:    string;
  autoExecuted:  boolean;
  humanOverride: unknown;
  modelVersion:  string;
  latencyMs:     number;
  createdAt:     string;
  decision:      { action: string; confidence: number; alternatives: unknown[] };
}

export interface HardBlockStat {
  agentCode:        string;
  guardType:        string;
  blockedCount:     number;
  avgBlockedAgeSec: number;
}

export const AGENT_ICON_MAP: Record<string, string> = {
  sales_copilot:      '💼',
  prepress_assistant: '🎨',
  planner:            '📅',
  mes_monitor:        '🏭',
  vision_qc:          '🔍',
  router:             '🚚',
};

export const AGENT_LABEL_KEY: Record<string, string> = {
  sales_copilot:      'agentSalesCopilot',
  prepress_assistant: 'agentPrepressAssistant',
  planner:            'agentPlanner',
  mes_monitor:        'agentMesMonitor',
  vision_qc:          'agentVisionQc',
  router:             'agentRouter',
};

export function autoRateColor(rate: number): string {
  if (rate >= 0.8) return 'text-[var(--ep-green)]';
  if (rate >= 0.6) return 'text-[var(--ep-yellow)]';
  return 'text-[var(--ep-red)]';
}

export function confidenceColor(conf: number): string {
  if (conf >= 0.85) return 'bg-green-100 text-green-800';
  if (conf >= 0.70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function formatAgeSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}
