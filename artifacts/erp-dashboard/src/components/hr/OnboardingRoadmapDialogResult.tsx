/**
 * @module OnboardingRoadmapDialogResult
 * @description Result/preview step for OnboardingRoadmapDialog (step="result").
 * Split from OnboardingRoadmapDialog.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { Printer, ChevronRight, User, Calendar, BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { GeneratedRoadmap } from "./OnboardingRoadmapDialog.types";

const WEEK_COLORS: Record<number, { header: string; badge: string }> = {
  1: { header: "bg-blue-500/15 text-blue-400 border-b border-blue-500/20",   badge: "bg-blue-500" },
  2: { header: "bg-amber-500/15 text-amber-400 border-b border-amber-500/20", badge: "bg-amber-500" },
  3: { header: "bg-orange-500/15 text-orange-400 border-b border-orange-500/20", badge: "bg-orange-500" },
  4: { header: "bg-green-500/15 text-green-400 border-b border-green-500/20", badge: "bg-green-500" },
};

interface RoadmapResultProps {
  roadmapToShow: GeneratedRoadmap | null;
  onEdit: () => void;
  onClose: () => void;
}

export function OnboardingRoadmapDialogResult({ roadmapToShow, onEdit, onClose }: RoadmapResultProps) {
  const { t } = useTranslation("common");

  if (!roadmapToShow) {
    return (
      <div className="space-y-4 py-2">
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("yolXaritasiHaliYaratilmagan")}
        </div>
      </div>
    );
  }

  const safeWeeks      = Array.isArray(roadmapToShow.weeks) ? roadmapToShow.weeks : [];
  const safeRegs       = Array.isArray(roadmapToShow.reglamentlar) ? roadmapToShow.reglamentlar : [];
  const safeCheckpoints = Array.isArray(roadmapToShow.final_checkpoints) ? roadmapToShow.final_checkpoints : [];

  return (
    <div className="space-y-4 py-2 print:space-y-3">
      {/* Summary header */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 print:border print:border-gray-300 print:bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-bold text-base">{roadmapToShow.lavozim_nomi} — Yo'l Xaritasi</h2>
            {roadmapToShow.bolim && (
              <p className="text-sm text-muted-foreground">{roadmapToShow.bolim}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">{roadmapToShow.sinov_muddat_oy} oy sinov</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{t("nastavnik1")}<strong className="text-foreground">{roadmapToShow.nastavnik_name}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{t("kirishSanasi1")}<strong className="text-foreground">
              {roadmapToShow.kirish_sanasi
                ? new Date(roadmapToShow.kirish_sanasi).toLocaleDateString("uz-UZ")
                : "—"}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Regulations */}
      {safeRegs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-[var(--ep-blue)]" />
            <h3 className="font-semibold text-sm">{t("oqiladiganMateriallar")}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {safeRegs.map((r, i) => (
              <Badge key={`reg-${i}`} variant="outline" className="text-xs border-blue-500/40 text-blue-400">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Gantt */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-[var(--ep-yellow)]" />
          <h3 className="font-semibold text-sm">{t("ganttStyleJadval4Hafta")}</h3>
        </div>
        <div className="space-y-3">
          {safeWeeks.map((week) => {
            const colors = WEEK_COLORS[week.week] ?? WEEK_COLORS[4];
            const safeTasks = Array.isArray(week.tasks) ? week.tasks : [];
            return (
              <div key={week.week} className="border rounded-lg overflow-hidden">
                <div className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 ${colors.header}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors.badge}`}>
                    {week.week}
                  </span>
                  {week.label}
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  {safeTasks.map((task, ti) => (
                    <div key={ti} className="flex items-start gap-1.5 text-xs">
                      <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                      <span>{task}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs mt-2 pt-2 border-t border-border/40 text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="italic">{week.meeting}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final checkpoints */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
          <h3 className="font-semibold text-sm">{t("yakuniyChekList")}</h3>
        </div>
        <div className="space-y-1.5">
          {safeCheckpoints.map((cp, i) => (
            <div key={`cp-${i}`} className="flex items-start gap-2 text-xs">
              <div className="w-4 h-4 mt-0.5 border-2 border-emerald-500/50 rounded shrink-0" />
              <span>{cp}</span>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="print:hidden">
        <Button variant="outline" onClick={onEdit}>{t("edit")}</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          {t("print1")}
        </Button>
        <Button onClick={onClose}>{t("close2")}</Button>
      </DialogFooter>
    </div>
  );
}
