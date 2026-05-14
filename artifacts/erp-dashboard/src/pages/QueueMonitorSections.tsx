/**
 * @module QueueMonitorSections
 * @description Queue display cards, failed-job table, and status panels for QueueMonitor.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, RefreshCw, AlertTriangle, CheckCircle, Clock, Play, Trash2, Inbox } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type QueueStat, type FailedJob, type FailedJobsResponse, QUEUE_LABELS } from "./QueueMonitorTypes";
import { EPStatusPill, EPLoader } from "@/components/ep";

// ─── Helper ───────────────────────────────────────────────────────────────

export function statusBadge(value: number, type: "failed" | "active" | "waiting" | "completed" | "delayed") {
  if (type === "failed" && value > 0) return <EPStatusPill tone="danger">{value}</EPStatusPill>;
  if (type === "active" && value > 0) return <EPStatusPill tone="info">{value}</EPStatusPill>;
  if (type === "waiting" && value > 0) return <EPStatusPill tone="warning">{value}</EPStatusPill>;
  if (type === "completed") return <EPStatusPill tone="success">{value}</EPStatusPill>;
  if (type === "delayed" && value > 0) return <Badge className="bg-orange-500">{value}</Badge>;
  return <Badge variant="outline">{value}</Badge>;
}

// ─── QueueCard ────────────────────────────────────────────────────────────

interface QueueCardProps {
  name: string;
  stat: QueueStat;
  selected: boolean;
  onSelect: () => void;
}

export function QueueCard({ name, stat, selected, onSelect }: QueueCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all border-2 ${
        selected ? "border-primary" : "border-transparent hover:border-muted"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{QUEUE_LABELS[name] ?? name}</span>
          {stat.available ? (
            <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!stat.available ? (
          <p className="text-xs text-muted-foreground">{stat.reason}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[var(--ep-yellow)]" />
              <span className="text-muted-foreground">Kutmoqda:</span>
              {statusBadge(stat.waiting, "waiting")}
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-[var(--ep-blue)]" />
              <span className="text-muted-foreground">Aktiv:</span>
              {statusBadge(stat.active, "active")}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-[var(--ep-green)]" />
              <span className="text-muted-foreground">Tugadi:</span>
              {statusBadge(stat.completed, "completed")}
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-[var(--ep-red)]" />
              <span className="text-muted-foreground">Xato:</span>
              {statusBadge(stat.failed, "failed")}
            </div>
            {stat.delayed > 0 && (
              <div className="flex items-center gap-1 col-span-2">
                <Clock className="h-3 w-3 text-[var(--ep-primary)]" />
                <span className="text-muted-foreground">Kechiktirilgan:</span>
                {statusBadge(stat.delayed, "delayed")}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── QueueGridPanel ───────────────────────────────────────────────────────

interface QueueGridPanelProps {
  queues: Record<string, QueueStat>;
  statusLoading: boolean;
  selectedQueue: string | null;
  onSelectQueue: (name: string) => void;
}

export function QueueGridPanel({ queues, statusLoading, selectedQueue, onSelectQueue }: QueueGridPanelProps) {
  if (statusLoading) {
    return (
      <div className="flex justify-center py-12">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.entries(queues).map(([name, stat]) => (
        <QueueCard
          key={name}
          name={name}
          stat={stat}
          selected={selectedQueue === name}
          onSelect={() => onSelectQueue(name)}
        />
      ))}
    </div>
  );
}

// ─── FailedJobsPanel ──────────────────────────────────────────────────────

interface FailedJobsPanelProps {
  selectedQueue: string;
  failedData: FailedJobsResponse | undefined;
  failedLoading: boolean;
  retryPending: boolean;
  clearPending: boolean;
  onRefetch: () => void;
  onRetry: (jobId: string) => void;
  onClearAll: () => void;
}

export function FailedJobsPanel({
  selectedQueue,
  failedData,
  failedLoading,
  retryPending,
  clearPending,
  onRefetch,
  onRetry,
  onClearAll,
}: FailedJobsPanelProps) {
  return (
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
              onClick={onRefetch}
              disabled={failedLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Yangilash
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={clearPending}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Barchasini tozalash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Barcha xato ishlarni o'chirishni tasdiqlang</AlertDialogTitle>
                  <AlertDialogDescription>
                    «{selectedQueue}» navbatidagi barcha muvaffaqiyatsiz ishlar o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearAll} className="bg-red-600 hover:bg-[var(--ep-red)]/90">
                    O'chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {failedLoading ? (
          <div className="flex justify-center py-8">
            <EPLoader size={24} />
          </div>
        ) : !failedData?.jobs?.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)]" />
            Xatoli job yo'q
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
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
              {(Array.isArray(failedData.jobs) ? failedData.jobs : []).map((job: FailedJob) => (
                <TableRow key={job.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs">{job.id}</TableCell>
                  <TableCell className="text-sm">{job.name}</TableCell>
                  <TableCell className="text-sm text-[var(--ep-red)] max-w-xs truncate" title={job.failedReason}>
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
                      onClick={() => onRetry(job.id)}
                      disabled={retryPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Qayta
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
