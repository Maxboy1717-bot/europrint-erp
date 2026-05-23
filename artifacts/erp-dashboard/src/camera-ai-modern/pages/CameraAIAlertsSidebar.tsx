/**
 * @module CameraAIAlertsSidebar
 * @description Alerts list + quick links sidebar for CameraAIModernHub.
 * Split from CameraAIModernHub.tsx (Rule 16).
 */

import { Link } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CameraAlert {
  id: string | number;
  severity: string;
  title: string;
}

const severityClass: Record<string, string> = {
  low:      "border-l-blue-500 bg-blue-500/5",
  medium:   "border-l-amber-500 bg-amber-500/5",
  high:     "border-l-orange-500 bg-orange-500/5",
  critical: "border-l-red-500 bg-red-500/5",
};

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link href={to}>
      <span className="cai-link-row">
        {label}
        <ChevronRight className="h-4 w-4 text-[var(--ep-cyan)] shrink-0" />
      </span>
    </Link>
  );
}

interface CameraAIAlertsSidebarProps {
  alerts: CameraAlert[] | undefined;
  lang: "uz" | "ru";
}

export function CameraAIAlertsSidebar({ alerts, lang }: CameraAIAlertsSidebarProps) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="space-y-4">
      <div className="cai-panel">
        <div className="cai-panel-head">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
            {lang === "uz" ? "So'nggi ogohlantirishlar" : "Алерты"}
          </h3>
        </div>
        <div className="p-3 space-y-2 max-h-[340px] overflow-y-auto">
          {safeAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {lang === "uz" ? "Hozircha xavf yo'q" : "Пусто"}
            </p>
          ) : (
            safeAlerts.map((a) => (
              <div
                key={a.id}
                className={cn("cai-alert-row text-sm", severityClass[a.severity] ?? severityClass.medium)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium leading-snug line-clamp-2">{a.title}</span>
                  <Badge variant="outline" className="shrink-0 text-[9px] uppercase">
                    {a.severity}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="cai-panel">
        <div className="cai-panel-head">
          <h3 className="text-sm font-bold">{lang === "uz" ? "Tezkor havolalar" : "Ссылки"}</h3>
        </div>
        <div className="p-2 flex flex-col gap-0.5">
          <QuickLink to="/camera-live-monitoring" label={lang === "uz" ? "Jonli monitoring" : "Мониторинг"} />
          <QuickLink to="/camera-alerts" label={lang === "uz" ? "Hodisalar" : "События"} />
          <QuickLink to="/cameras" label={lang === "uz" ? "Kameralar CRUD" : "Список камер"} />
          <QuickLink to="/camera/monitoring" label={lang === "uz" ? "Yuz tanish" : "Лица"} />
          <QuickLink to="/camera-reports" label={lang === "uz" ? "Hisobotlar" : "Отчёты"} />
        </div>
      </div>
    </div>
  );
}
