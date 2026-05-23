/**
 * @module CameraAIStatBento
 * @description KPI stat-card bento grid for CameraAIModernHub.
 * Split from CameraAIModernHub.tsx (Rule 16).
 */

import { Camera, Activity, AlertTriangle, Shield, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CameraAiRow } from "../types";

interface CameraStats {
  totalCameras?: number;
  activeCameras?: number;
  unresolvedAlerts?: number;
  safetyViolationsCount?: number;
}

interface CameraAIStatBentoProps {
  loading: boolean;
  stats: CameraStats | undefined;
  cameras: CameraAiRow[];
  lang: "uz" | "ru";
}

export function CameraAIStatBento({ loading, stats, cameras, lang }: CameraAIStatBentoProps) {
  if (loading) {
    return (
      <div className="cai-stat-bento">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const activeCams = (Array.isArray(cameras) ? cameras : []).filter((c) => c.isActive).length;

  return (
    <div className="cai-stat-bento">
      <div className="cai-stat-card">
        <div className="flex items-start justify-between gap-2">
          <Camera className="h-4 w-4 text-[var(--ep-cyan)] dark:text-cyan-400" />
          <Sparkles className="h-4 w-4 text-[var(--ep-purple)] opacity-60" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
          {lang === "uz" ? "Jami kameralar" : "Всего камер"}
        </p>
        <p className="cai-stat-value mt-1">{stats?.totalCameras ?? cameras.length}</p>
        <p className="text-xs text-muted-foreground">{lang === "uz" ? "Ro'yxat" : "В списке"}</p>
      </div>

      <div className="cai-stat-card">
        <Activity className="h-5 w-5 text-[var(--ep-green)] dark:text-emerald-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
          {lang === "uz" ? "Faol" : "Активны"}
        </p>
        <p className="cai-stat-value mt-1">{stats?.activeCameras ?? activeCams}</p>
        <p className="text-xs text-muted-foreground">{lang === "uz" ? "Real vaqt" : "Онлайн"}</p>
      </div>

      <div className="cai-stat-card cai-stat--alert">
        <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
          {lang === "uz" ? "Ochiq alertlar" : "Открытые алерты"}
        </p>
        <p className="cai-stat-value mt-1">{stats?.unresolvedAlerts ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{lang === "uz" ? "Hal qilinmagan" : "Не решены"}</p>
      </div>

      <div className="cai-stat-card">
        <Shield className="h-5 w-5 text-[var(--ep-purple)] dark:text-violet-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
          {lang === "uz" ? "Xavfsizlik yozuvi" : "Нарушения ТБ"}
        </p>
        <p className="cai-stat-value mt-1">{stats?.safetyViolationsCount ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{lang === "uz" ? "Jami" : "Всего"}</p>
      </div>
    </div>
  );
}
