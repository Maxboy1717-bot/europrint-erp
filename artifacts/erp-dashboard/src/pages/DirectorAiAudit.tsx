import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Brain, CheckCircle, AlertTriangle, Activity, ShieldAlert, Clock } from "lucide-react";

interface AgentStat {
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

interface Decision {
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

interface HardBlockStat {
  agentCode:        string;
  guardType:        string;
  blockedCount:     number;
  avgBlockedAgeSec: number;
}

const AGENT_ICON_MAP: Record<string, string> = {
  sales_copilot:      '💼',
  prepress_assistant: '🎨',
  planner:            '📅',
  mes_monitor:        '🏭',
  vision_qc:          '🔍',
  router:             '🚚',
};

const AGENT_LABEL_KEY: Record<string, string> = {
  sales_copilot:      'agentSalesCopilot',
  prepress_assistant: 'agentPrepressAssistant',
  planner:            'agentPlanner',
  mes_monitor:        'agentMesMonitor',
  vision_qc:          'agentVisionQc',
  router:             'agentRouter',
};

function autoRateColor(rate: number) {
  if (rate >= 0.8) return 'text-green-600';
  if (rate >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function confidenceColor(conf: number) {
  if (conf >= 0.85) return 'bg-green-100 text-green-800';
  if (conf >= 0.70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function formatAgeSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

export default function DirectorAiAudit() {
  const { t } = useTranslation('ai');
  const [selectedAgent, setSelectedAgent] = useState<string>('sales_copilot');
  const [onlyIncorrect, setOnlyIncorrect] = useState(false);

  const statsQ = useQuery<AgentStat[]>({
    queryKey: ['ai-agents-stats'],
    queryFn:  () => apiRequest('GET', '/api/ai-agents/audit/stats'),
    refetchInterval: 30_000,
  });

  const hardBlockQ = useQuery<HardBlockStat[]>({
    queryKey: ['ai-hard-block-stats'],
    queryFn:  () => apiRequest('GET', '/api/ai-agents/audit/hard-block-stats'),
    refetchInterval: 60_000,
  });

  const decisionsQ = useQuery<Decision[]>({
    queryKey: ['ai-decisions', selectedAgent, onlyIncorrect],
    queryFn:  () => apiRequest(
      'GET',
      `/api/ai-agents/audit/${selectedAgent}/decisions?limit=20${onlyIncorrect ? '&onlyIncorrect=true' : ''}`,
    ),
    enabled:  !!selectedAgent,
    refetchInterval: 60_000,
  });

  const stats: AgentStat[]      = statsQ.data ?? [];
  const hardBlocks: HardBlockStat[] = hardBlockQ.data ?? [];
  const decisions: Decision[]   = decisionsQ.data ?? [];

  const totalDecisions  = stats.reduce((s, a) => s + a.total, 0);
  const totalAuto       = stats.reduce((s, a) => s + a.autoCount, 0);
  const totalBlocked    = stats.reduce((s, a) => s + (a.total - a.autoCount), 0);
  const totalOverridden = stats.reduce((s, a) => s + a.overrideCount, 0);
  const avgConf         = stats.length > 0
    ? stats.reduce((s, a) => s + a.avgConfidence, 0) / stats.length
    : 0;

  const hardBlockByAgent = hardBlocks.reduce<Record<string, HardBlockStat[]>>((acc, h) => {
    (acc[h.agentCode] ??= []).push(h);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            {t('auditTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('auditDesc')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { statsQ.refetch(); hardBlockQ.refetch(); decisionsQ.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('refresh')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalDecisions')}</p>
                <p className="text-3xl font-bold">{totalDecisions.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('autoExecuted')}</p>
                <p className="text-3xl font-bold text-green-600">{totalAuto.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {totalDecisions > 0 ? Math.round((totalAuto / totalDecisions) * 100) : 0}% {t('autoRateLabel')}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('blockedForHuman')}</p>
                <p className="text-3xl font-bold text-orange-600">{totalBlocked.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {t('overriddenCount')}: {totalOverridden}
                </p>
              </div>
              <ShieldAlert className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('avgConfidenceStat')}</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(avgConf * 100)}%
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('agentOverview')}</TabsTrigger>
          <TabsTrigger value="hardblock">{t('hardBlockTab')}</TabsTrigger>
          <TabsTrigger value="decisions">{t('decisionsHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {statsQ.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noDecisions')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((agent) => (
                <Card key={agent.agentCode} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedAgent(agent.agentCode); }}>
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
                        <span className={`font-medium ${autoRateColor(agent.autoRate)}`}>
                          {Math.round(agent.autoRate * 100)}%
                        </span>
                      </div>
                      <Progress value={agent.autoRate * 100} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('avgConfLabel')}</span>
                      <Badge className={confidenceColor(agent.avgConfidence)}>
                        {Math.round(agent.avgConfidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('avgLatencyLabel')}</span>
                      <span className="font-medium">{Math.round(agent.avgLatency)} ms</span>
                    </div>
                    {agent.overrideCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('humanOverrideLabel')}</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {agent.overrideCount}
                        </Badge>
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
          )}
        </TabsContent>

        <TabsContent value="hardblock" className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('hardBlockDesc')}</p>
          {hardBlockQ.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
          ) : hardBlocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('noBlockedDecisions')}</div>
          ) : (
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
                            <ShieldAlert className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-mono">{b.guardType}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="secondary">{b.blockedCount} ta</Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatAgeSec(b.avgBlockedAgeSec)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(AGENT_LABEL_KEY).map(([code, labelKey]) => (
                <Button
                  key={code}
                  variant={selectedAgent === code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAgent(code)}
                >
                  {AGENT_ICON_MAP[code]} {t(labelKey)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="only-incorrect"
                checked={onlyIncorrect}
                onCheckedChange={setOnlyIncorrect}
              />
              <Label htmlFor="only-incorrect" className="text-sm cursor-pointer">
                {t('onlyIncorrectLabel')}
              </Label>
            </div>
          </div>

          {decisionsQ.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
          ) : decisions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {onlyIncorrect ? t('noIncorrectDecisions') : t('noDecisionsForAgent')}
            </div>
          ) : (
            <div className="space-y-2">
              {decisions.map((d) => (
                <Card key={d.id} className={`p-4 ${d.humanOverride ? 'border-orange-200' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={d.autoExecuted ? 'default' : 'secondary'}>
                          {d.autoExecuted ? `✅ ${t('autoTag')}` : `👤 ${t('humanTag')}`}
                        </Badge>
                        {d.humanOverride && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            {t('overriddenTag')}
                          </Badge>
                        )}
                        <span className="text-sm font-medium">{d.decision?.action ?? 'N/A'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.entityType} • {d.entityId} • {d.modelVersion}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={confidenceColor(Number(d.confidence))}>
                        {Math.round(Number(d.confidence) * 100)}%
                      </Badge>
                      <div className="text-xs text-muted-foreground">{d.latencyMs}ms</div>
                      <div className="text-xs text-muted-foreground">
                        {d.createdAt ? new Date(d.createdAt).toLocaleString('uz') : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
