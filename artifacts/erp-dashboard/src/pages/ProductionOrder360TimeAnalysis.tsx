/**
 * @module ProductionOrder360TimeAnalysis
 * @description React page component. Route-level UI.
 */

import { AlertTriangle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from '@/lib/i18n';

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}d`;
  return `${m} daqiqa`;
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: React.ReactNode; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color || ""}`}>{value}</p>
          </div>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color || "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export interface Downtime {
  reasonDescription?: string;
  reasonCode?: string;
  eventType?: string;
  durationSeconds?: number | null;
  startedAt?: string;
  isPlanned?: boolean;
}

export interface ProductionOrder360TimeAnalysisProps {
  totalRunningSeconds?: number;
  totalStoppedSeconds?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  downtimes?: Downtime[];
  totalDowntimeMins?: number;
  leadTimeDays?: number | null;
}

export default function ProductionOrder360TimeAnalysis({
  totalRunningSeconds = 0,
  totalStoppedSeconds = 0,
  plannedStartDate,
  plannedEndDate,
  actualStartDate,
  actualEndDate,
  downtimes,
  totalDowntimeMins,
  leadTimeDays,
}: ProductionOrder360TimeAnalysisProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={Zap} label={t("ishlashVaqti")} value={fmtTime(totalRunningSeconds)} color="text-[var(--ep-green)]" />
        <KpiCard icon={Clock} label={t("toxtashVaqti")} value={fmtTime(totalStoppedSeconds)} color="text-[var(--ep-yellow)]" />
        <KpiCard icon={AlertTriangle} label={t("rejalashtirilmaganToxtash")} value={`${totalDowntimeMins} daq`} color="text-[var(--ep-red)]" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t("sanaRejasiVsHaqiqati")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <InfoRow label={t("rejaBoshlanish")} value={plannedStartDate} />
          <InfoRow label={t("rejaTugash")} value={plannedEndDate} />
          <InfoRow label={t("haqiqiyBoshlanish")} value={actualStartDate} />
          <InfoRow label={t("haqiqiyTugash")} value={actualEndDate} />
          {leadTimeDays != null && (
            <InfoRow label={t("umumiyDavr")} value={`${leadTimeDays} kun`} />
          )}
        </CardContent>
      </Card>

      {(downtimes?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("toxtashHodisalari")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {downtimes?.map((dt, i) => (
              <div key={`k-${i}`} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{dt.reasonDescription || dt.reasonCode || "Sabab yo'q"}</p>
                  <p className="text-xs text-muted-foreground">
                    {dt.eventType === "planned_stop" ? "Rejalashtirilgan" : "Rejalashtirilmagan"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{dt.durationSeconds ? fmtTime(Number(dt.durationSeconds)) : "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {dt.startedAt ? new Date(dt.startedAt).toLocaleTimeString("uz-UZ") : "—"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
