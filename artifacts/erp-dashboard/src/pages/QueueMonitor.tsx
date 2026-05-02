import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Activity, RefreshCw, AlertTriangle, CheckCircle, Clock,
  Play, Trash2, Loader2, Server, Inbox,
} from "lucide-react";

interface QueueStat {
  available: boolean;
  reason?: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueStatusResponse {
  queues: Record<string, QueueStat>;
  redisEnabled: boolean;
}

interface FailedJob {
  id: string;
  name: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
}

interface FailedJobsResponse {
  queue: string;
  total: number;
  jobs: FailedJob[];
}

const QUEUE_LABELS: Record<string, string> = {
  payroll: "Maosh (Payroll)",
  mrp: "MRP",
  "gl-post": "GL Posting",
  notify: "Bildirishnomalar",
  ai: "AI Tahlil",
  reports: "Hisobotlar",
  "payroll-dlq": "Payroll DLQ",
};

function statusBadge(value: number, type: "failed" | "active" | "waiting" | "completed" | "delayed") {
  if (type === "failed" && value > 0) return <Badge variant="destructive">{value}</Badge>;
  if (type === "active" && value > 0) return <Badge className="bg-blue-500">{value}</Badge>;
  if (type === "waiting" && value > 0) return <Badge className="bg-yellow-500">{value}</Badge>;
  if (type === "completed") return <Badge className="bg-green-600 text-white">{value}</Badge>;
  if (type === "delayed" && value > 0) return <Badge className="bg-orange-500">{value}</Badge>;
  return <Badge variant="outline">{value}</Badge>;
}

export default function QueueMonitor() {
  const { toast } = useToast();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery<QueueStatusResponse>({
    queryKey: ["/api/admin/queues/status"],
    refetchInterval: 10000,
  });

  const { data: failedData, isLoading: failedLoading, refetch: refetchFailed } = useQuery<FailedJobsResponse>({
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Navbat Monitori</h1>
            <p className="text-sm text-muted-foreground">BullMQ queue holati va xatoli joblar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={redisEnabled ? "default" : "destructive"} className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Redis: {redisEnabled ? "Ulandi" : "O'chirilgan"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Yangilash
          </Button>
        </div>
      </div>

      {statusLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(queues).map(([name, stat]) => (
            <Card
              key={name}
              className={`cursor-pointer transition-all border-2 ${
                selectedQueue === name ? "border-primary" : "border-transparent hover:border-muted"
              }`}
              onClick={() => setSelectedQueue(selectedQueue === name ? null : name)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{QUEUE_LABELS[name] ?? name}</span>
                  {stat.available ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!stat.available ? (
                  <p className="text-xs text-muted-foreground">{stat.reason}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span className="text-muted-foreground">Kutmoqda:</span>
                      {statusBadge(stat.waiting, "waiting")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">Aktiv:</span>
                      {statusBadge(stat.active, "active")}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Tugadi:</span>
                      {statusBadge(stat.completed, "completed")}
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">Xato:</span>
                      {statusBadge(stat.failed, "failed")}
                    </div>
                    {stat.delayed > 0 && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span className="text-muted-foreground">Kechiktirilgan:</span>
                        {statusBadge(stat.delayed, "delayed")}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedQueue && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Xatoli Joblar — {QUEUE_LABELS[selectedQueue] ?? selectedQueue}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchFailed()}
                  disabled={failedLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Yangilash
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearFailedMutation.mutate(selectedQueue)}
                  disabled={clearFailedMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Barchasini tozalash
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {failedLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !failedData?.jobs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                Xatoli job yo'q
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Xato sababi</TableHead>
                    <TableHead>Urinishlar</TableHead>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(failedData.jobs) ? failedData.jobs : []).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.id}</TableCell>
                      <TableCell className="text-sm">{job.name}</TableCell>
                      <TableCell className="text-sm text-red-500 max-w-xs truncate" title={job.failedReason}>
                        {job.failedReason ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.attemptsMade}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {job.finishedOn ? new Date(job.finishedOn).toLocaleString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryMutation.mutate({ queueName: selectedQueue, jobId: job.id })}
                          disabled={retryMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Qayta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
