/**
 * @module ExceptionLog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertOctagon,
  RefreshCw,
  ShieldAlert,
  Activity,
  TrendingUp,
  FileWarning,
  Plus,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { useToast } from "@/hooks/use-toast";

interface ExceptionStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  lastWeek: number;
  lastMonth: number;
}

interface ExceptionLogEntry {
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
  data: ExceptionLogEntry[];
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
  critical: "text-[var(--ep-red)] dark:text-red-400",
  high: "text-[var(--ep-primary)] dark:text-orange-400",
  medium: "text-[var(--ep-yellow)] dark:text-yellow-400",
  low: "text-[var(--ep-blue)] dark:text-blue-400",
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
          {loading ? <Skeleton className="h-7 w-16 mt-1 rounded-lg" /> : <p className="text-2xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const MODULES = ["SD","PP","MES","QC","WMS","FIN","HR","MRO","TIZIM"];

export default function ExceptionLog() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createExType, setCreateExType] = useState("");
  const [createModule, setCreateModule] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSeverity, setCreateSeverity] = useState("");

  const createMutation = useMutation({
    mutationFn: (payload: { exceptionType: string; module: string; description: string; reason: string; severity?: string }) =>
      apiRequest("POST", "/api/exceptions", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exceptions/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exceptions"] });
      toast({ title: "Istisno holat qayd etildi" });
      setIsCreateOpen(false);
      setCreateExType(""); setCreateModule(""); setCreateDescription(""); setCreateSeverity("");
    },
    onError: () => toast({ title: t("xatolik", "Xatolik"), variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!createExType || !createModule || createDescription.trim().length < 5) {
      toast({ title: "Tur, modul va tavsif (min 5 belgi) kiritilishi shart", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      exceptionType: createExType,
      module: createModule,
      description: createDescription.trim(),
      reason: createDescription.trim(),
      ...(createSeverity ? { severity: createSeverity } : {}),
    });
  };

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
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <AlertOctagon className="w-7 h-7" />
            {t("istisnoHolatlarLogi")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("tizimdaRoyBerganBarchaIstisno")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-refresh" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/exceptions/stats"] });
            queryClient.invalidateQueries({ queryKey: [`/api/exceptions`] });
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("refresh")}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Istisno qayd etish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title={t("jamiIstisno")} value={s?.total ?? 0} icon={AlertOctagon} loading={statsLoading} />
        <StatCard title={t("oxirgiHafta")} value={s?.lastWeek ?? 0} icon={Activity} loading={statsLoading} />
        <StatCard title={t("oxirgiOy")} value={s?.lastMonth ?? 0} icon={TrendingUp} loading={statsLoading} />
        <StatCard
          title={t("kritik")}
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
              {t("turlarBoyichaTaqsimot")}
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
                    <EPStatusPill tone="neutral">{cnt}</EPStatusPill>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">{t("barchaIstisnoHolatlar")}</CardTitle>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 h-9" data-testid="select-type-filter">
                <SelectValue placeholder={t("turBoyicha1")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("barchaTurlar")}</SelectItem>
                {Object.keys(EXCEPTION_LABELS).map((k) => (
                  <SelectItem key={k} value={k}>{EXCEPTION_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 h-9" data-testid="select-severity-filter">
                <SelectValue placeholder={t("darajasi")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                <SelectItem value="critical">{t("kritik")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("daraja")}</TableHead>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead>{t("xabar")}</TableHead>
                  <TableHead>{t("kimTomonidan")}</TableHead>
                  <TableHead>{t("Buyurtma")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(logs?.data) ? logs.data : []).map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`} className="hover:bg-muted/40 transition-colors">
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
                        <EPStatusPill tone="success">{t("halQilindi")}</EPStatusPill>
                      ) : (
                        <EPStatusPill tone="neutral">{t("ochiq")}</EPStatusPill>
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
                      {t("istisnoHolatlarTopilmadi")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Istisno holat qayd etish</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Istisno turi *</Label>
              <Select value={createExType} onValueChange={setCreateExType}>
                <SelectTrigger><SelectValue placeholder="Turni tanlang" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EXCEPTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Modul *</Label>
              <Select value={createModule} onValueChange={setCreateModule}>
                <SelectTrigger><SelectValue placeholder="Modul tanlang" /></SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tavsif (sabab) *</Label>
              <Textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Istisno holat tavsifi va sababi..."
                rows={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Daraja</Label>
              <Select value={createSeverity} onValueChange={setCreateSeverity}>
                <SelectTrigger><SelectValue placeholder="Darajani tanlang (ixtiyoriy)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Past</SelectItem>
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="high">Yuqori</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
