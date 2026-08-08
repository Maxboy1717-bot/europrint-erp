/**
 * @module QualityDefectsCameraPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface QualityDefect {
  id: string | number;
  defect_type?: string;
  defectType?: string;
  product_name?: string;
  productName?: string;
  severity?: string;
  status?: string;
  camera_id?: string;
  cameraId?: string;
  location?: string;
  confidence?: number;
  description?: string;
  detected_at?: string;
  detectedAt?: string;
  order_number?: string;
  orderNumber?: string;
  quantity?: number;
}

const SEVERITY_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; cls: string }> = {
  critical: { label: "qcSevKritik",  variant: "destructive", cls: "bg-red-100 text-destructive"    },
  high:     { label: "qcSevYuqori",  variant: "destructive", cls: "bg-red-100 text-destructive"    },
  medium:   { label: "qcSevOrtacha", variant: "secondary",   cls: "bg-amber-100 text-[var(--ep-yellow)]"    },
  low:      { label: "qcSevPast",    variant: "outline",     cls: "bg-green-50 text-[var(--ep-green)]"     },
};

const STATUS_LABELS: Record<string, string> = {
  open:        "qcStatOchiq",
  resolved:    "qcStatHalQilindi",
  pending:     "qcStatKutilmoqda",
  in_review:   "qcStatKoribChiqilmoqda",
};

export default function QualityDefectsCameraPage() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    QualityDefect[] | { data?: QualityDefect[] }
  >({
    queryKey: ["/api/iot/quality-defects", statusFilter, severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter   !== "all") params.set("status",   statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      return await apiRequest("GET", `/api/iot/quality-defects?${params}`);
    },
    refetchInterval: 60_000,
  });

  const defects: QualityDefect[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: QualityDefect[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="iot"
      title={t("kameraSifatKamchiliklari")}
      icon={<Camera className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{t("daraja1")}</span>
            {["all", "critical", "high", "medium", "low"].map(s => (
              <Button
                key={s}
                variant={severityFilter === s ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSeverityFilter(s)}
                data-testid={`filter-severity-${s}`}
              >
                {s === "all" ? t("qcBarchasi") : (SEVERITY_MAP[s]?.label ? t(SEVERITY_MAP[s].label) : s)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{t("holat1")}</span>
            {["all", "open", "in_review", "resolved"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-status-${s}`}
              >
                {s === "all" ? t("qcBarchasi") : (STATUS_LABELS[s] ? t(STATUS_LABELS[s]) : s)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-60 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : defects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
              <p className="text-muted-foreground">{t("kamchilikTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {defects.map(d => {
              const severity    = d.severity ?? "medium";
              const sc          = SEVERITY_MAP[severity] ?? SEVERITY_MAP.medium;
              const defectType  = d.defect_type ?? d.defectType ?? "—";
              const productName = d.product_name ?? d.productName;
              const camera      = d.camera_id ?? d.cameraId;
              const detectedAt  = d.detected_at ?? d.detectedAt;
              const orderNo     = d.order_number ?? d.orderNumber;
              return (
                <Card key={d.id} className="hover:shadow-md transition-shadow" data-testid={`card-defect-${d.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded flex items-center justify-center shrink-0 ${sc.cls}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{defectType}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                            {productName && <span>📦 {productName}</span>}
                            {orderNo     && <span>#{orderNo}</span>}
                            {camera      && <span>📷 {camera}</span>}
                            {d.location  && <span>📍 {d.location}</span>}
                            {d.confidence !== undefined && (
                              <span>{t("qcAniqlik")}: {Math.round(d.confidence * 100)}%</span>
                            )}
                            {d.quantity !== undefined && <span>{t("qcMiqdor")}: {d.quantity}</span>}
                            {detectedAt && (
                              <span>{new Date(detectedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>
                            )}
                          </div>
                          {d.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{d.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant={sc.variant} className="text-xs">{t(sc.label)}</Badge>
                          {d.status && d.status !== "open" && (
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[d.status] ? t(STATUS_LABELS[d.status]) : d.status}
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
