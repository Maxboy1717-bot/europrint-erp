import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AiAgent {
  id: string;
  name: string;
  module: string;
  status: "active" | "paused" | "error";
  lastRunAt: string | null;
  successCount: number;
  errorCount: number;
  description: string;
}

const STATUS_CONFIG: Record<AiAgent["status"], { label: string; className: string; icon: typeof Activity }> = {
  active: { label: "Faol", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  paused: { label: "Pauza", className: "bg-yellow-100 text-yellow-700", icon: Activity },
  error:  { label: "Xato",  className: "bg-rose-100 text-rose-700", icon: AlertTriangle },
};

export default function AIAgentsPage() {
  const { t } = useTranslation('ai');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ items: AiAgent[] }>({
    queryKey: ["/api/ai-agents/list"],
    queryFn: () => apiRequest("GET", "/api/ai-agents/list"),
  });
  const agents = selectArray<AiAgent>(data, "items");

  const triggerMutation = useMutation({
    mutationFn: (agentId: string) => apiRequest("POST", `/api/ai-agents/${agentId}/trigger`),
    onSuccess: () => {
      toast({ title: t('agents.triggered', 'Agent ishga tushirildi') });
      void qc.invalidateQueries({ queryKey: ["/api/ai-agents/list"] });
    },
    onError: (err: Error) => {
      toast({ title: t('agents.triggerFailed', 'Xato'), description: err.message, variant: "destructive" });
    },
  });

  const renderAgentCard = (agent: AiAgent) => {
    const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.paused;
    const Icon = cfg.icon;
    return (
      <Card key={agent.id}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
          </div>
          <Badge className={cfg.className}>
            <Icon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">Modul:</span>
              <span className="ml-1 font-medium">{agent.module}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Muvaffaqiyat:</span>
              <span className="ml-1 font-medium text-emerald-600">{agent.successCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Xatolar:</span>
              <span className="ml-1 font-medium text-rose-600">{agent.errorCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Oxirgi:</span>
              <span className="ml-1 font-medium">{agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : "—"}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={triggerMutation.isPending}
            onClick={() => triggerMutation.mutate(agent.id)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {t('agents.trigger', 'Hozir ishga tushirish')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={t('agents.title', 'AI Agentlar')}
        description={t('agents.description', '6 ta AI agent: planning, sales-copilot, prepress, mes-monitor, supplier-rating, fraud-detect')}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{t('agents.empty', 'Hech qanday AI agent topilmadi')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(renderAgentCard)}
        </div>
      )}
    </div>
  );
}
