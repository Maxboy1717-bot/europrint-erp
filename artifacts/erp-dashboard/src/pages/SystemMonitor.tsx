import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import {
  Activity, Database, Clock, Cpu, HardDrive, Server,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SystemHealth {
  uptime?: { formatted?: string };
  nodeVersion?: string;
  memory?: { heapUsedMB?: number; heapTotalMB?: number };
  cpu?: { load1?: number; cores?: number };
  database?: { latencyMs?: number; status?: string };
}
interface DbStats {
  dbSize?: string;
  userCount?: number;
  tables?: { table_name: string; live_rows?: number | string }[];
}
interface Integration { key?: string; name?: string; type?: string; status?: string }
interface CronJob { name?: string; schedule?: string; module?: string }

function StatusBadge({ status }: { status: string }) {
  if (status === "ok" || status === "running" || status === "active" || status === "connected")
    return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Faol</Badge>;
  if (status === "warning" || status === "in_memory" || status === "default" || status === "default_key")
    return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"><AlertTriangle className="w-3 h-3 mr-1" />{status === "in_memory" ? "Xotirada" : "Ogohlantirish"}</Badge>;
  return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ulanmagan</Badge>;
}

export default function SystemMonitor() {
  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  const { data: dbStats, isLoading: loadingDb } = useQuery<DbStats>({
    queryKey: ["/api/system/db-stats"],
    refetchInterval: 60000,
  });

  const { data: cronJobs, isLoading: loadingCron } = useQuery<CronJob[]>({
    queryKey: ["/api/system/cron-jobs"],
  });

  const { data: integrations, isLoading: loadingIntegrations } = useQuery<Integration[]>({
    queryKey: ["/api/system/integrations"],
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
    queryClient.invalidateQueries({ queryKey: ["/api/system/db-stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/system/integrations"] });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tizim monitoring"
        description="Server holati, ma'lumotlar bazasi va integratsiyalar"
        actions={
          <Button variant="outline" size="default" onClick={handleRefresh} data-testid="button-refresh-monitor">
            <RefreshCw className="w-4 h-4 mr-2" />Yangilash
          </Button>
        }
      />

      {/* Server Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingHealth ? Array(4).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-28" />) : <>
          <Card data-testid="card-uptime">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Clock className="w-4 h-4" />Ishlash vaqti</div>
              <div className="text-2xl font-bold">{health?.uptime?.formatted || "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">Node {health?.nodeVersion}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-memory">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><HardDrive className="w-4 h-4" />Heap xotira</div>
              <div className="text-2xl font-bold">{health?.memory?.heapUsedMB || 0} <span className="text-sm font-normal">MB</span></div>
              <div className="text-xs text-muted-foreground mt-1">Jami: {health?.memory?.heapTotalMB} MB</div>
            </CardContent>
          </Card>
          <Card data-testid="card-cpu">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Cpu className="w-4 h-4" />CPU yuklanish</div>
              <div className="text-2xl font-bold">{health?.cpu?.load1 || "0.00"}</div>
              <div className="text-xs text-muted-foreground mt-1">{health?.cpu?.cores} yadrolar</div>
            </CardContent>
          </Card>
          <Card data-testid="card-database-status">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Database className="w-4 h-4" />Ma'lumotlar bazasi</div>
              <div className="text-2xl font-bold">{health?.database?.latencyMs || 0} <span className="text-sm font-normal">ms</span></div>
              <div className="mt-1"><StatusBadge status={health?.database?.status || "error"} /></div>
            </CardContent>
          </Card>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DB Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Database className="w-4 h-4" />Ma'lumotlar bazasi statistikasi</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDb ? <Skeleton className="h-40" /> : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DB hajmi</span>
                  <span className="font-medium">{dbStats?.dbSize || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jami xodimlar</span>
                  <span className="font-medium">{dbStats?.userCount || 0}</span>
                </div>
                {dbStats?.tables?.slice(0, 8).map((t: { table_name: string; live_rows?: number | string }) => (
                  <div key={t.table_name} className="flex justify-between text-xs" data-testid={`row-table-${t.table_name}`}>
                    <span className="text-muted-foreground font-mono">{t.table_name}</span>
                    <span>{Number(t.live_rows || 0).toLocaleString()} qator</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Zap className="w-4 h-4" />Integratsiyalar holati</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingIntegrations ? <Skeleton className="h-40" /> : (
              <div className="space-y-2">
                {integrations?.map((intg) => (
                  <div key={intg.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0" data-testid={`row-integration-${intg.key}`}>
                    <div>
                      <div className="text-sm font-medium">{intg.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{intg.type}</div>
                    </div>
                    <StatusBadge status={intg.status ?? "error"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cron Jobs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Activity className="w-4 h-4" />Cron ishlar ({cronJobs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCron ? <Skeleton className="h-32" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {cronJobs?.map((job, i) => (
                <div key={`k-${i}`} className="flex items-start gap-2 p-2 rounded-md border border-border/50" data-testid={`card-cron-${i}`}>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{job.name}</div>
                    <div className="text-xs text-muted-foreground">{job.schedule}</div>
                    <Badge variant="outline" className="text-xs mt-0.5">{job.module}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
