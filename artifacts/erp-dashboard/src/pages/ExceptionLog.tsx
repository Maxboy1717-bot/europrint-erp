import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertOctagon,
  RefreshCw,
  ShieldAlert,
  Activity,
  TrendingUp,
  FileWarning,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface ExceptionStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  lastWeek: number;
  lastMonth: number;
}

interface ExceptionLog {
  id: string;
  exceptionType: string;
  severity: string;
  message: string;
  details: Record<string, unknown> | null;
  createdBy: string | null;
  creatorName: string | null;
  orderId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface LogsResponse {
  data: ExceptionLog[];
  total: number;
  page: number;
  limit: number;
}

const EXCEPTION_LABELS: Record<string, string> = {
  advance_bypass: "Avans o'tkazib yuborish",
  status_force: "Status majburiy o'zgartirish",
  qc_failed: "QC muvaffaqiyatsiz",
  qc_bypass: "QC o'tkazib yuborish",
  design_reject: "Dizayn rad etish",
  advance_block: "Avans bloklash",
  material_shortage: "Material yetishmovchilik",
  machine_breakdown: "Mashina nosozligi",
  delivery_failed: "Yetkazib berish muvaffaqiyatsiz",
  employee_absent: "Xodim yo'qligi",
  material_not_returned: "Material qaytarilmadi",
  cert_expiry: "Sertifikat muddati",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-blue-600 dark:text-blue-400",
};

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="h-7 w-16 mt-1" /> : <p className="text-2xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExceptionLog() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const params = new URLSearchParams();
  if (typeFilter !== "all") params.set("type", typeFilter);
  if (severityFilter !== "all") params.set("severity", severityFilter);
  params.set("limit", "50");

  const { data: stats, isLoading: statsLoading } = useQuery<{ success: boolean; data: ExceptionStats }>({
    queryKey: ["/api/exceptions/stats"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<LogsResponse>({
    queryKey: [`/api/exceptions?${params.toString()}`],
  });

  const s = stats?.data;

  const severityBadge = (severity: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "secondary",
    };
    const labels: Record<string, string> = {
      critical: "Kritik",
      high: "Yuqori",
      medium: "O'rta",
      low: "Past",
    };
    return <Badge variant={map[severity] || "secondary"}>{labels[severity] || severity}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <AlertOctagon className="w-7 h-7" />
            Istisno Holatlar Logi
          </h1>
          <p className="text-sm text-muted-foreground">
            Tizimda ro'y bergan barcha istisno holatlar va favqulodda qarorlar
          </p>
        </div>
        <Button
          variant="outline"
          data-testid="button-refresh"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/exceptions/stats"] });
            queryClient.invalidateQueries({ queryKey: [`/api/exceptions`] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Jami istisno" value={s?.total ?? 0} icon={AlertOctagon} loading={statsLoading} />
        <StatCard title="Oxirgi hafta" value={s?.lastWeek ?? 0} icon={Activity} loading={statsLoading} />
        <StatCard title="Oxirgi oy" value={s?.lastMonth ?? 0} icon={TrendingUp} loading={statsLoading} />
        <StatCard
          title="Kritik"
          value={s?.bySeverity?.critical ?? 0}
          icon={ShieldAlert}
          loading={statsLoading}
        />
      </div>

      {s && Object.keys(s.byType).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileWarning className="w-5 h-5" />
              Turlar bo'yicha taqsimot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(s.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, cnt]) => (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted text-sm cursor-pointer hover-elevate"
                    data-testid={`badge-type-${type}`}
                    onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                  >
                    <span className="text-muted-foreground">{EXCEPTION_LABELS[type] || type}</span>
                    <Badge variant="secondary">{cnt}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Barcha istisno holatlar</CardTitle>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44" data-testid="select-type-filter">
                <SelectValue placeholder="Tur bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                {Object.keys(EXCEPTION_LABELS).map((k) => (
                  <SelectItem key={k} value={k}>{EXCEPTION_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40" data-testid="select-severity-filter">
                <SelectValue placeholder="Darajasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="high">Yuqori</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="low">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Daraja</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Xabar</TableHead>
                  <TableHead>Kim tomonidan</TableHead>
                  <TableHead>Buyurtma</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(logs?.data) ? logs.data : []).map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell>{severityBadge(log.severity)}</TableCell>
                    <TableCell className="text-sm">
                      {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-sm">{log.creatorName || log.createdBy || "Tizim"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.orderId ? log.orderId.slice(0, 8) + "…" : "—"}
                    </TableCell>
                    <TableCell>
                      {log.resolvedAt ? (
                        <Badge variant="default">Hal qilindi</Badge>
                      ) : (
                        <Badge variant="secondary">Ochiq</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                {(logs?.data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Istisno holatlar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
