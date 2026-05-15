/**
 * @module FaceRecognitionMonitoring
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecognitionStats, RecognitionLog } from "./FaceRecognitionMonitoringTypes";
import { labels } from "./FaceRecognitionMonitoringTypes";
import { StatsCards, RecognitionChart, LogsTable } from "./FaceRecognitionMonitoringSections";
import { EPErrorState } from "@/components/ep";

export default function FaceRecognitionMonitoring() {
  const [lang,   setLang]   = useState<"uz" | "ru">("uz");
  const [filter, setFilter] = useState<string>("all");
  const { toast }           = useToast();
  const { isAuthenticated } = useAuth();
  const t = labels[lang];

  const { data: stats, isLoading: statsLoading, isError, refetch } = useQuery<RecognitionStats>({
    queryKey: ["/api/camera/recognition-stats"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<RecognitionLog[]>({
    queryKey: ["/api/camera/recognition-logs", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (filter === "recognized")   params.set("isRecognized", "true");
      if (filter === "unrecognized") params.set("isRecognized", "false");
      if (filter === "flagged")      params.set("flaggedAs", "false_positive");
      return await apiRequest("GET", `/api/camera/recognition-logs?${params}`);
    },
    enabled: !!isAuthenticated,
  });

  const flagMutation = useMutation({
    mutationFn: async ({ id, flaggedAs }: { id: string; flaggedAs: string }) =>
      apiRequest("PATCH", `/api/camera/recognition-logs/${id}/flag`, { flaggedAs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-stats"] });
      toast({ title: t.flagSuccess });
    },
    onError: () => toast({ title: t.flagError, variant: "destructive" }),
  });

  const unflagMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("PATCH", `/api/camera/recognition-logs/${id}/unflag`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-stats"] });
      toast({ title: t.flagSuccess });
    },
    onError: () => toast({ title: t.flagError, variant: "destructive" }),
  });

  const getFlagBadge = (flaggedAs: string | null) => {
    if (!flaggedAs) return null;
    switch (flaggedAs) {
      case "correct":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t.markAsCorrect}</Badge>;
      case "false_positive":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t.markAsFalsePositive}</Badge>;
      case "false_negative":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">{t.markAsFalseNegative}</Badge>;
      default:
        return null;
    }
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant={lang === "uz" ? "default" : "outline"} size="sm"
            onClick={() => setLang("uz")} data-testid="button-lang-uz">
            UZ
          </Button>
          <Button variant={lang === "ru" ? "default" : "outline"} size="sm"
            onClick={() => setLang("ru")} data-testid="button-lang-ru">
            RU
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} statsLoading={statsLoading} t={t} />

      <RecognitionChart stats={stats} statsLoading={statsLoading} t={t} />

      <LogsTable
        logs={logs}
        logsLoading={logsLoading}
        filter={filter}
        onFilterChange={setFilter}
        t={t}
        getFlagBadge={getFlagBadge}
        onFlag={(id, flaggedAs) => flagMutation.mutate({ id, flaggedAs })}
        onUnflag={(id) => unflagMutation.mutate(id)}
        flagPending={flagMutation.isPending}
        unflagPending={unflagMutation.isPending}
      />
    </div>
  );
}
