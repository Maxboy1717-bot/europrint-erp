/**
 * @module InternalJobBoardSections
 * @description VacancyCard section for InternalJobBoard.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, DollarSign, Clock, Users, Send,
  ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { InternalVacancy } from "./InternalJobBoardTypes";
import { EPStatusPill } from "@/components/ep";

interface VacancyCardProps {
  vacancy: InternalVacancy;
  onApply: (v: InternalVacancy) => void;
}

export function VacancyCard({ vacancy, onApply }: VacancyCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-all ${vacancy.is_urgent ? "border-red-500/40" : "border-border/50"}`}
      data-testid={`internal-vacancy-card-${vacancy.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base text-foreground">{vacancy.title}</h3>
              {vacancy.is_urgent && (
                <Badge className="bg-[var(--ep-red)] text-white gap-1 text-[10px]">
                  <Zap className="w-2.5 h-2.5" />
                  SHOSHILINCH
                </Badge>
              )}
              <EPStatusPill tone="neutral" className="text-xs">Ichki</EPStatusPill>
            </div>
            {vacancy.department_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Building2 className="w-3 h-3" />
                {vacancy.department_name}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onApply(vacancy)}
            className="shrink-0 gap-1"
            data-testid={`button-apply-${vacancy.id}`}
          >
            <Send className="w-3.5 h-3.5" />
            Ariza berish
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {vacancy.salary_min && (
            <div className="flex items-center gap-1 text-xs text-[var(--ep-green)] bg-green-50 rounded px-2 py-0.5">
              <DollarSign className="w-3 h-3" />
              {Number(vacancy.salary_min).toLocaleString()}
              {vacancy.salary_max ? ` – ${Number(vacancy.salary_max).toLocaleString()}` : "+"} so'm
            </div>
          )}
          {vacancy.deadline_working_days && (
            <div className="flex items-center gap-1 text-xs text-[var(--ep-yellow)] bg-amber-50 rounded px-2 py-0.5">
              <Clock className="w-3 h-3" />
              SLA: {vacancy.deadline_working_days} k.k.
            </div>
          )}
          {vacancy.applicant_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
              <Users className="w-3 h-3" />
              {vacancy.applicant_count} ariza
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(vacancy.created_at).toLocaleDateString("uz-UZ")}
          </div>
        </div>

        {vacancy.description && (
          <div className="mb-2">
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
              {vacancy.description}
            </p>
          </div>
        )}

        {vacancy.requirements && expanded && (
          <div className="mb-2">
            <p className="text-xs font-medium text-foreground mb-1">Talablar:</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{vacancy.requirements}</p>
          </div>
        )}

        {vacancy.portret?.salary_min && expanded && (
          <div className="bg-muted/30 rounded-lg p-2 mt-2 text-xs space-y-1">
            {vacancy.portret.main_purpose && (
              <div>
                <span className="text-muted-foreground">Maqsad: </span>
                {String(vacancy.portret.main_purpose).slice(0, 150)}
              </div>
            )}
            {vacancy.portret.work_schedule && (
              <div>
                <span className="text-muted-foreground">Grafik: </span>
                {String(vacancy.portret.work_schedule)}
              </div>
            )}
          </div>
        )}

        {(vacancy.description || vacancy.requirements) && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 mt-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Kamroq" : "Ko'proq"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
