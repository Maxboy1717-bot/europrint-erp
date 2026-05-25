/**
 * @module DirectorAiAudit
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Brain } from "lucide-react";
import { AgentStat, Decision, HardBlockStat } from "./DirectorAiAuditTypes";
import {
  AiSummaryCards, AgentOverviewTab, HardBlockTab, DecisionsTab,
} from "./DirectorAiAuditSections";

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
    enabled: !!selectedAgent,
    refetchInterval: 60_000,
  });

  const stats: AgentStat[]    = statsQ.data ?? [];
  const hardBlocks: HardBlockStat[] = hardBlockQ.data ?? [];
  const decisions: Decision[] = decisionsQ.data ?? [];

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
            <Brain className="w-6 h-6 text-[var(--ep-purple)]" />
            {t('auditTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auditDesc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { statsQ.refetch(); hardBlockQ.refetch(); decisionsQ.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> {t('refresh')}
        </Button>
      </div>

      <AiSummaryCards
        totalDecisions={totalDecisions}
        totalAuto={totalAuto}
        totalBlocked={totalBlocked}
        totalOverridden={totalOverridden}
        avgConf={avgConf}
        t={t}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('agentOverview')}</TabsTrigger>
          <TabsTrigger value="hardblock">{t('hardBlockTab')}</TabsTrigger>
          <TabsTrigger value="decisions">{t('decisionsHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AgentOverviewTab stats={stats} isLoading={statsQ.isLoading} onSelect={setSelectedAgent} t={t} />
        </TabsContent>

        <TabsContent value="hardblock" className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('hardBlockDesc')}</p>
          <HardBlockTab hardBlocks={hardBlocks} hardBlockByAgent={hardBlockByAgent} isLoading={hardBlockQ.isLoading} t={t} />
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <DecisionsTab
            decisions={decisions}
            isLoading={decisionsQ.isLoading}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onlyIncorrect={onlyIncorrect}
            onToggleIncorrect={setOnlyIncorrect}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
