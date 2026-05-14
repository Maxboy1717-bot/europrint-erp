/**
 * @module QueueMonitor
 * @description React page component. Route-level UI — state + orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Activity, RefreshCw, Server } from "lucide-react";
import { type QueueStatusResponse, type FailedJobsResponse } from "./QueueMonitorTypes";
import { QueueGridPanel, FailedJobsPanel } from "./QueueMonitorSections";
import { useTranslation } from '@/lib/i18n';

export default function QueueMonitor() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const {
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<QueueStatusResponse>({
    queryKey: ["/api/admin/queues/status"],
    refetchInterval: 10000,
  });

  const {
    data: failedData,
    isLoading: failedLoading,
    refetch: refetchFailed,
  } = useQuery<FailedJobsResponse>({
    queryKey: ["/api/admin/queues/failed", selectedQueue],
    queryFn: async () => {
      if (!selectedQueue) return { queue: "", total: 0, jobs: [] };
      const res = await apiRequest("GET", `/api/admin/queues/failed/${selectedQueue}`);
      return res.json();
    },
    enabled: !!selectedQueue,
  });

  const retryMutation = useMutation({
    mutationFn: async ({ queueName, jobId }: { queueName: string; jobId: string }) => {
      const res = await apiRequest("POST", `/api/admin/queues/retry/${queueName}/${jobId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Job qayta ishga tushirildi" });
      refetchFailed();
      refetchStatus();
    },
    onError: (err: Error) => {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    },
  });

  const clearFailedMutation = useMutation({
    mutationFn: async (queueName: string) => {
      const res = await apiRequest("DELETE", `/api/admin/queues/failed/${queueName}`);
      return res.json();
    },
    onSuccess: (_, queueName) => {
      toast({ title: "Tozalandi", description: `${queueName} failed jobs tozalandi` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/failed", queueName] });
      refetchStatus();
    },
    onError: (err: Error) => {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    },
  });

  const queues = statusData?.queues ?? {};
  const redisEnabled = statusData?.redisEnabled ?? false;

  const handleSelectQueue = (name: string) => {
    setSelectedQueue(prev => (prev === name ? null : name));
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("navbatMonitori")}</h1>
            <p className="text-sm text-muted-foreground">{t("bullmqQueueHolatiVaXatoli")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={redisEnabled ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <Activity className="h-3 w-3" />
            Redis: {redisEnabled ? "Ulandi" : "O'chirilgan"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      <QueueGridPanel
        queues={queues}
        statusLoading={statusLoading}
        selectedQueue={selectedQueue}
        onSelectQueue={handleSelectQueue}
      />

      {selectedQueue && (
        <FailedJobsPanel
          selectedQueue={selectedQueue}
          failedData={failedData}
          failedLoading={failedLoading}
          retryPending={retryMutation.isPending}
          clearPending={clearFailedMutation.isPending}
          onRefetch={() => refetchFailed()}
          onRetry={(jobId) => retryMutation.mutate({ queueName: selectedQueue, jobId })}
          onClearAll={() => clearFailedMutation.mutate(selectedQueue)}
        />
      )}
    </div>
  );
}
