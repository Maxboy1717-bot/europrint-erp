/**
 * @module EuroprintControlPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings2, ShieldCheck, Activity, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface ModuleHealth {
  module?: string;
  name?: string;
  status?: string;
  lastCheck?: string;
  last_check?: string;
  errorCount?: number;
  error_count?: number;
  message?: string;
}

interface ValidationSummary {
  total?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  lastRun?: string;
  last_run?: string;
}

interface AuditLog {
  id: string | number;
  action?: string;
  entity_type?: string;
  entityType?: string;
  user_id?: number;
  userId?: number;
  created_at?: string;
  createdAt?: string;
  details?: string;
}

interface AuditorDashboard {
  totalRules?: number;
  activeRules?: number;
  violationsToday?: number;
  totalAuditLogs?: number;
  systemHealth?: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  healthy: <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />,
  warning: <AlertCircle  className="h-4 w-4 text-[var(--ep-yellow)]" />,
  error:   <XCircle      className="h-4 w-4 text-destructive" />,
  ok:      <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />,
};

export default function EuroprintControlPage() {
  const { t } = useTranslation("common");
  const { data: dashboard, isLoading: loadingDash, isError: errDash, refetch: retryDash } =
    useQuery<AuditorDashboard | { data?: AuditorDashboard }>({
      queryKey: ["/api/europrint-control/auditor-dashboard"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/europrint-control/auditor-dashboard");
        return res.json();
      },
    });

  const { data: healthRaw, isLoading: loadingHealth } =
    useQuery<ModuleHealth[] | { data?: ModuleHealth[] }>({
      queryKey: ["/api/europrint-control/module-health"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/europrint-control/module-health");
        return res.json();
      },
    });

  const { data: validationRaw, isLoading: loadingValidation } =
    useQuery<ValidationSummary | { data?: ValidationSummary }>({
      queryKey: ["/api/europrint-control/validation-summary"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/europrint-control/validation-summary");
        return res.json();
      },
    });

  const { data: auditLogsRaw, isLoading: loadingLogs } =
    useQuery<AuditLog[] | { data?: AuditLog[]; logs?: AuditLog[] }>({
      queryKey: ["/api/europrint-control/audit-logs"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/europrint-control/audit-logs?limit=20");
        return res.json();
      },
    });

  if (errDash) return <EPErrorState onRetry={retryDash} />;

  const dash: AuditorDashboard =
    (dashboard as { data?: AuditorDashboard })?.data ?? (dashboard as AuditorDashboard) ?? {};

  const healthItems: ModuleHealth[] = Array.isArray(healthRaw)
    ? healthRaw
    : (healthRaw as { data?: ModuleHealth[] })?.data ?? [];

  const validation: ValidationSummary =
    (validationRaw as { data?: ValidationSummary })?.data ?? (validationRaw as ValidationSummary) ?? {};

  const auditLogs: AuditLog[] = Array.isArray(auditLogsRaw)
    ? auditLogsRaw
    : (auditLogsRaw as { data?: AuditLog[] })?.data
      ?? (auditLogsRaw as { logs?: AuditLog[] })?.logs
      ?? [];

  return (
    <ModulePage
      module="admin"
      title={t("europrintBoshqaruvMarkazi")}
      icon={<Settings2 className="h-5 w-5" />}
    >
      <div className="space-y-6">
        {/* KPI summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Umumiy qoidalar",    value: dash.totalRules,       icon: <ShieldCheck className="h-4 w-4 text-[var(--ep-blue)]" />,    bg: "bg-blue-100" },
            { label: "Faol qoidalar",       value: dash.activeRules,      icon: <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />, bg: "bg-green-100" },
            { label: "Bugungi buzilishlar", value: dash.violationsToday,  icon: <AlertCircle  className="h-4 w-4 text-[var(--ep-yellow)]" />, bg: "bg-amber-100" },
            { label: "Audit loglari",       value: dash.totalAuditLogs,   icon: <Activity     className="h-4 w-4 text-[var(--ep-purple)]" />, bg: "bg-purple-100" },
          ].map(({ label, value, icon, bg }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    {icon}
                  </div>
                  <div>
                    {loadingDash
                      ? <Skeleton className="h-6 w-12 mb-0.5 rounded-lg" />
                      : <p className="text-xl font-bold">{value ?? "—"}</p>}
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("modulHolati")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHealth ? (
                <div className="space-y-3">
                  {([1, 2, 3]).map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1 rounded-lg" />
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : healthItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t("malumotYoq")}</p>
              ) : (
                <div className="space-y-3">
                  {healthItems.map((m, i) => {
                    const status = (m.status ?? "healthy").toLowerCase();
                    const name   = m.module ?? m.name ?? `Modul ${i + 1}`;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        {STATUS_ICON[status] ?? STATUS_ICON.healthy}
                        <span className="text-sm flex-1 truncate">{name}</span>
                        {(m.errorCount ?? m.error_count ?? 0) > 0 && (
                          <EPStatusPill tone="danger" className="text-xs">
                            {m.errorCount ?? m.error_count} xato
                          </EPStatusPill>
                        )}
                        <Badge
                          variant={status === "healthy" || status === "ok" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("validatsiyaXulosasi")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingValidation ? (
                <div className="space-y-3">
                  {([1, 2, 3]).map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : Object.keys(validation).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t("malumotYoq")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Jami",      value: validation.total,   color: "text-foreground" },
                    { label: "O'tdi",     value: validation.passed,  color: "text-[var(--ep-green)]" },
                    { label: "Xatolik",   value: validation.failed,  color: "text-destructive" },
                    { label: "O'tkazib",  value: validation.skipped, color: "text-muted-foreground" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg bg-muted/40 p-3 text-center">
                      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                  {(validation.lastRun ?? validation.last_run) && (
                    <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      So'nggi tekshiruv: {new Date(validation.lastRun ?? validation.last_run ?? "").toLocaleString("uz-UZ")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit logs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t("oxirgiAuditLoglari")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLogs ? (
              <div className="p-4 space-y-3">
                {([1, 2, 3, 4]).map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1 rounded-lg" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t("loglarTopilmadi")}</p>
            ) : (
              <div className="divide-y max-h-72 overflow-y-auto">
                {auditLogs.map(log => {
                  const ts = log.created_at ?? log.createdAt;
                  const entity = log.entity_type ?? log.entityType;
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{log.action ?? "—"}</span>
                        {entity && (
                          <span className="text-muted-foreground ml-2 text-xs">({entity})</span>
                        )}
                        {log.details && (
                          <span className="text-muted-foreground ml-1 text-xs truncate"> — {log.details}</span>
                        )}
                      </div>
                      {ts && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(ts).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
