/**
 * @module SafetyViolationsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface SafetyViolation {
  id: string | number;
  violation_type?: string;
  violationType?: string;
  severity?: string;
  status?: string;
  camera_id?: string;
  cameraId?: string;
  location?: string;
  employee_name?: string;
  employeeName?: string;
  description?: string;
  detected_at?: string;
  detectedAt?: string;
  confidence?: number;
}

const SEVERITY_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  critical: { label: "Kritik",    variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
  high:     { label: "Yuqori",    variant: "destructive", icon: <AlertCircle   className="h-3 w-3" /> },
  medium:   { label: "O'rtacha",  variant: "secondary",   icon: <AlertCircle   className="h-3 w-3" /> },
  low:      { label: "Past",      variant: "outline",     icon: <CheckCircle2  className="h-3 w-3" /> },
};

const STATUS_LABELS: Record<string, string> = {
  open:     "Ochiq",
  resolved: "Hal qilindi",
  pending:  "Kutilmoqda",
};

export default function SafetyViolationsPage() {
  const { t } = useTranslation("common");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");

  const { data: rawData, isLoading, isError, refetch } = useQuery<SafetyViolation[] | { data?: SafetyViolation[] }>({
    queryKey: ["/api/safety-violations", severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (statusFilter   !== "all") params.set("status",   statusFilter);
      return await apiRequest("GET", `/api/safety-violations?${params}`);
    },
  });

  const violations: SafetyViolation[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: SafetyViolation[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="iot"
      title={t("xavfsizlikBuzilishlari")}
      icon={<ShieldAlert className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground self-center mr-1">{t("darajasi1")}</span>
            {["all", "critical", "high", "medium", "low"].map(s => (
              <Button
                key={s}
                variant={severityFilter === s ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSeverityFilter(s)}
                data-testid={`filter-severity-${s}`}
              >
                {s === "all" ? "Barchasi" : (SEVERITY_MAP[s]?.label ?? s)}
              </Button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground self-center mr-1">{t("holat1")}</span>
            {["all", "open", "pending", "resolved"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-status-${s}`}
              >
                {s === "all" ? "Barchasi" : (STATUS_LABELS[s] ?? s)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : violations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("xavfsizlikBuzilishlariTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {violations.map(v => {
              const severity = v.severity ?? "medium";
              const sc = SEVERITY_MAP[severity] ?? SEVERITY_MAP.medium;
              const vType    = v.violation_type ?? v.violationType ?? "—";
              const empName  = v.employee_name ?? v.employeeName;
              const camera   = v.camera_id ?? v.cameraId;
              const detectedAt = v.detected_at ?? v.detectedAt;
              return (
                <Card key={v.id} className="hover:shadow-md transition-shadow" data-testid={`card-violation-${v.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${
                      severity === "critical" || severity === "high"
                        ? "bg-destructive/10"
                        : "bg-amber-100"
                    }`}>
                      <ShieldAlert className={`h-4 w-4 ${
                        severity === "critical" || severity === "high"
                          ? "text-destructive"
                          : "text-[var(--ep-yellow)]"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{vType}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                            {v.location && <span>📍 {v.location}</span>}
                            {camera    && <span>📷 Kamera: {camera}</span>}
                            {empName   && <span>👤 {empName}</span>}
                            {v.confidence !== undefined && (
                              <span>Aniqlik: {Math.round(v.confidence * 100)}%</span>
                            )}
                            {detectedAt && (
                              <span>{new Date(detectedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>
                            )}
                          </div>
                          {v.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{v.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant={sc.variant} className="gap-1 text-xs">
                            {sc.icon}{sc.label}
                          </Badge>
                          {v.status && v.status !== "open" && (
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[v.status] ?? v.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
