/**
 * DirectorAiAuditSections.tsx
 * Summary cards, agent overview tab, hard-block tab, decisions tab
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, CheckCircle, ShieldAlert, AlertTriangle, Clock } from "lucide-react";
import {
  AgentStat, Decision, HardBlockStat,
  AGENT_ICON_MAP, AGENT_LABEL_KEY,
  autoRateColor, confidenceColor, formatAgeSec,
} from "./DirectorAiAuditTypes";
import { EPStatusPill } from "@/components/ep";

// ─── Summary Cards ────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  totalDecisions: number; totalAuto: number;
  totalBlocked: number; totalOverridden: number;
  avgConf: number; t: (key: string) => string;
}

export function AiSummaryCards({ totalDecisions, totalAuto, totalBlocked, totalOverridden, avgConf, t }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">{t('totalDecisions')}</p><p className="text-3xl font-bold">{totalDecisions.toLocaleString()}</p></div>
          <Activity className="w-8 h-8 text-[var(--ep-blue)]" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('autoExecuted')}</p>
            <p className="text-3xl font-bold text-[var(--ep-green)]">{totalAuto.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{totalDecisions > 0 ? Math.round((totalAuto / totalDecisions) * 100) : 0}% {t('autoRateLabel')}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-[var(--ep-green)]" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('blockedForHuman')}</p>
            <p className="text-3xl font-bold text-[var(--ep-primary)]">{totalBlocked.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('overriddenCount')}: {totalOverridden}</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-[var(--ep-primary)]" />
        </div>
      </CardContent></Card>
      <Card><CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">{t('avgConfidenceStat')}</p><p className="text-3xl font-bold text-[var(--ep-purple)]">{Math.round(avgConf * 100)}%</p></div>
          <AlertTriangle className="w-8 h-8 text-[var(--ep-purple)]" />
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Agent Overview Tab ───────────────────────────────────────────────────────

interface AgentOverviewTabProps { stats: AgentStat[]; isLoading: boolean; onSelect: (code: string) => void; t: (key: string) => string; }

export function AgentOverviewTab({ stats, isLoading, onSelect, t }: AgentOverviewTabProps) {
  if (isLoading) return <div className="text-center py-12 text-[13px] text-muted-foreground">{t('loading')}</div>;
  if (stats.length === 0) return <div className="text-center py-12 text-[13px] text-muted-foreground">{t('noDecisions')}</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((agent) => (
        <Card key={agent.agentCode} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(agent.agentCode)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span>{AGENT_ICON_MAP[agent.agentCode] ?? '🤖'}</span>
              {t(AGENT_LABEL_KEY[agent.agentCode] ?? 'title') || agent.agentCode}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('totalDecisionsLabel')}</span>
              <span className="font-medium">{agent.total}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('autoRateLabel')}</span>
                <span className={`font-medium ${autoRateColor(agent.autoRate)}`}>{Math.round(agent.autoRate * 100)}%</span>
              </div>
              <Progress value={agent.autoRate * 100} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('avgConfLabel')}</span>
              <Badge className={confidenceColor(agent.avgConfidence)}>{Math.round(agent.avgConfidence * 100)}%</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('avgLatencyLabel')}</span>
              <span className="font-medium">{Math.round(agent.avgLatency)} ms</span>
            </div>
            {agent.overrideCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('humanOverrideLabel')}</span>
                <Badge variant="outline" className="text-[var(--ep-primary)] border-orange-300">{agent.overrideCount}</Badge>
              </div>
            )}
            {agent.totalCostUsd > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalCostLabel')}</span>
                <span className="font-medium">${agent.totalCostUsd.toFixed(4)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Hard Block Tab ───────────────────────────────────────────────────────────

interface HardBlockTabProps { hardBlocks: HardBlockStat[]; hardBlockByAgent: Record<string, HardBlockStat[]>; isLoading: boolean; t: (key: string) => string; }

export function HardBlockTab({ hardBlocks, hardBlockByAgent, isLoading, t }: HardBlockTabProps) {
  if (isLoading) return <div className="text-center py-12 text-[13px] text-muted-foreground">{t('loading')}</div>;
  if (hardBlocks.length === 0) return <div className="text-center py-12 text-[13px] text-muted-foreground">{t('noBlockedDecisions')}</div>;
  return (
    <div className="space-y-4">
      {Object.entries(hardBlockByAgent).map(([agentCode, blocks]) => (
        <Card key={agentCode}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span>{AGENT_ICON_MAP[agentCode] ?? '🤖'}</span>
              {t(AGENT_LABEL_KEY[agentCode] ?? 'title') || agentCode}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blocks.map((b) => (
                <div key={b.guardType} className="flex items-center justify-between py-1 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--ep-primary)]" />
                    <span className="text-sm font-mono">{b.guardType}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <EPStatusPill tone="neutral">{b.blockedCount} ta</EPStatusPill>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" /><span>{formatAgeSec(b.avgBlockedAgeSec)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Decisions Tab ────────────────────────────────────────────────────────────

interface DecisionsTabProps {
  decisions: Decision[]; isLoading: boolean;
  selectedAgent: string; onSelectAgent: (code: string) => void;
  onlyIncorrect: boolean; onToggleIncorrect: (v: boolean) => void;
  t: (key: string) => string;
}

export function DecisionsTab({ decisions, isLoading, selectedAgent, onSelectAgent, onlyIncorrect, onToggleIncorrect, t }: DecisionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(AGENT_LABEL_KEY).map(([code, labelKey]) => (
            <Button key={code} variant={selectedAgent === code ? 'default' : 'outline'} size="sm" onClick={() => onSelectAgent(code)}>
              {AGENT_ICON_MAP[code]} {t(labelKey)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch id="only-incorrect" checked={onlyIncorrect} onCheckedChange={onToggleIncorrect} />
          <Label htmlFor="only-incorrect" className="text-sm cursor-pointer">{t('onlyIncorrectLabel')}</Label>
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-[13px] text-muted-foreground">{t('loading')}</div>
      ) : decisions.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-muted-foreground">
          {onlyIncorrect ? t('noIncorrectDecisions') : t('noDecisionsForAgent')}
        </div>
      ) : (
        <div className="space-y-2">
          {(Array.isArray(decisions) ? decisions : []).map((d) => (
            <Card key={d.id} className={`p-4 ${d.humanOverride ? 'border-orange-200' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={d.autoExecuted ? 'default' : 'secondary'}>
                      {d.autoExecuted ? `✅ ${t('autoTag')}` : `👤 ${t('humanTag')}`}
                    </Badge>
                    {d.humanOverride && (
                      <Badge variant="outline" className="text-[var(--ep-primary)] border-orange-300">{t('overriddenTag')}</Badge>
                    )}
                    <span className="text-sm font-medium">{d.decision?.action ?? 'N/A'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.entityType} • {d.entityId} • {d.modelVersion}</div>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={confidenceColor(Number(d.confidence))}>{Math.round(Number(d.confidence) * 100)}%</Badge>
                  <div className="text-xs text-muted-foreground">{d.latencyMs}ms</div>
                  <div className="text-xs text-muted-foreground">{d.createdAt ? new Date(d.createdAt).toLocaleString('uz') : ''}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
