/**
 * @module LeadHeader
 * @description React UI component.
 */

import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Lead, STAGE_CONFIG } from "./types";

interface LeadHeaderProps {
  lead: Lead | null;
  leadId: number | null;
  leadScore: number;
  currentStage: { name: string; color: string; stageId: string } | null;
  onStageChange: (stageId: string) => void;
}

export function LeadHeader({ lead, leadId, leadScore, currentStage, onStageChange }: LeadHeaderProps) {
  const scoreColor = leadScore >= 70 ? "text-[var(--ep-green)]" : leadScore >= 40 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
  const scoreBg = leadScore >= 70 ? "bg-green-100" : leadScore >= 40 ? "bg-yellow-100" : "bg-red-100";

  return (
    <SheetHeader className="p-6 pb-4 bg-green-500 border-b">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SheetTitle data-testid="text-lead-title" className="text-xl">
            {lead?.title || "Yuklanmoqda..."}
          </SheetTitle>
          <SheetDescription>
            Lead #{leadId} • {lead?.dateCreate && format(new Date(lead.dateCreate), "dd.MM.yyyy HH:mm")}
          </SheetDescription>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-2">
        {currentStage && (
          <Badge style={{ backgroundColor: currentStage.color, color: "white" }} className="w-fit">
            {STAGE_CONFIG[lead?.statusId || ""]?.icon} {currentStage.name}
          </Badge>
        )}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${scoreBg} ${scoreColor}`}>
          <TrendingUp className="h-3 w-3" />
          Score: {leadScore}/100
        </div>
        {lead?.opportunity ? (
          <Badge variant="outline" className="text-[var(--ep-green)] border-green-300">
            {lead.opportunity.toLocaleString()} UZS
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex gap-1">
        {(["NEW", "IN_PROGRESS", "ANALYSIS", "FINAL", "CONVERTED"]).map((s) => {
          const stages = ["NEW", "IN_PROGRESS", "ANALYSIS", "FINAL", "CONVERTED", "WON", "LOST"];
          const currentIdx = stages.indexOf(lead?.statusId || "NEW");
          const thisIdx = stages.indexOf(s);
          const active = thisIdx <= currentIdx;
          return (
            <button
              key={s}
              onClick={() => onStageChange(s)}
              className={`flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-80 ${active ? "" : "bg-gray-200"}`}
              style={{ backgroundColor: active ? STAGE_CONFIG[s]?.color : undefined }}
              title={STAGE_CONFIG[s]?.label}
            />
          );
        })}
      </div>
    </SheetHeader>
  );
}
