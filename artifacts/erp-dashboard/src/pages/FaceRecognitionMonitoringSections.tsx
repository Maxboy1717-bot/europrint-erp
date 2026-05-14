/**
 * @module FaceRecognitionMonitoringSections
 * @description Section components for FaceRecognitionMonitoring.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Target, TrendingUp, Flag,
  User, Camera as CameraIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";
import type { RecognitionStats, RecognitionLog, Labels } from "./FaceRecognitionMonitoringTypes";

export function StatsCards({
  stats,
  statsLoading,
  t,
}: {
  stats?: RecognitionStats;
  statsLoading: boolean;
  t: Labels;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRecognitions}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold" data-testid="text-total-recognitions">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.successful}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-green)]" data-testid="text-successful">{stats?.successful || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.failed}</CardTitle>
            <XCircle className="h-4 w-4 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-red)]" data-testid="text-failed">{stats?.failed || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.accuracy}</CardTitle>
            <Target className="h-4 w-4 text-[var(--ep-blue)]" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-blue)]" data-testid="text-accuracy">{stats?.accuracy || 0}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.falsePositives}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-primary)]" data-testid="text-false-positives">{stats?.falsePositives || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.falseNegatives}</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--ep-purple)]" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-purple)]" data-testid="text-false-negatives">{stats?.falseNegatives || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function RecognitionChart({
  stats,
  statsLoading,
  t,
}: {
  stats?: RecognitionStats;
  statsLoading: boolean;
  t: Labels;
}) {
  const chartData = stats?.dailyStats?.map((d) => ({
    ...d,
    date: format(new Date(d.date), "MM/dd"),
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <Skeleton className="h-[300px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="successful" stroke="#22c55e" name={t.successful} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name={t.failed} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="falsePositives" stroke="#f97316" name={t.falsePositives} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="falseNegatives" stroke="#a855f7" name={t.falseNegatives} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function LogsTable({
  logs,
  logsLoading,
  filter,
  onFilterChange,
  t,
  getFlagBadge,
  onFlag,
  onUnflag,
  flagPending,
  unflagPending,
}: {
  logs?: RecognitionLog[];
  logsLoading: boolean;
  filter: string;
  onFilterChange: (v: string) => void;
  t: Labels;
  getFlagBadge: (flaggedAs: string | null) => React.ReactNode;
  onFlag: (id: string, flaggedAs: string) => void;
  onUnflag: (id: string) => void;
  flagPending: boolean;
  unflagPending: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>{t.recentLogs}</CardTitle>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-filter">
            <SelectValue placeholder={t.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="recognized">{t.recognized}</SelectItem>
            <SelectItem value="unrecognized">{t.unrecognized}</SelectItem>
            <SelectItem value="flagged">{t.flagged}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {logsLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.employee}</TableHead>
                  <TableHead>{t.camera}</TableHead>
                  <TableHead>{t.confidence}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.time}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(logs) ? logs : []).map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.employeeName || t.unknown}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CameraIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{log.cameraName || t.unknown}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.confidence > 0.8 ? "default" : "secondary"}>
                        {(log.confidence * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.isRecognized ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />{t.recognized}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" />{t.unrecognized}
                          </Badge>
                        )}
                        {getFlagBadge(log.flaggedAs)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.timestamp), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {log.flaggedAs ? (
                          <Button variant="ghost" size="sm" onClick={() => onUnflag(log.id)}
                            disabled={unflagPending} data-testid={`button-unflag-${log.id}`}>
                            {t.unflag}
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm"
                              onClick={() => onFlag(log.id, "correct")}
                              disabled={flagPending} className="text-[var(--ep-green)]"
                              data-testid={`button-flag-correct-${log.id}`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm"
                              onClick={() => onFlag(log.id, "false_positive")}
                              disabled={flagPending} className="text-[var(--ep-red)]"
                              data-testid={`button-flag-false-positive-${log.id}`}>
                              <Flag className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm"
                              onClick={() => onFlag(log.id, "false_negative")}
                              disabled={flagPending} className="text-[var(--ep-primary)]"
                              data-testid={`button-flag-false-negative-${log.id}`}>
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{t.noLogs}</div>
        )}
      </CardContent>
    </Card>
  );
}
