import React from "react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase, ChevronDown, ChevronUp, AlertTriangle, Zap, BookOpen,
  Globe, MessageSquare,
} from "lucide-react";
import {
  ChannelDots, ChannelStatusPanel, VacancyMarketBadge,
} from "@/components/recruiting/helpers";
import type { PipelineEntry, Vacancy } from "@/components/recruiting/types";
import { tLabel } from "@/lib/i18n/tLabel";

export interface VacancyFilterPanelProps {
  open: boolean;
  onToggle: () => void;
  openVacancies: Vacancy[];
  entries: PipelineEntry[];
  filterVacancy: string;
  setFilterVacancy: (val: string) => void;
  channelPanelVacancyId: number | null;
  setChannelPanelVacancyId: React.Dispatch<React.SetStateAction<number | null>>;
  setPortretVacancy: (v: Vacancy | null) => void;
  onOpenVacancyChat: (vacancyId: number, vacancyTitle: string) => void;
  openingContextRoom: number | null;
}

/**
 * Filter + cards panel above the Kanban board.
 *
 * Extracted from `RecruitingKanban.tsx` to keep the page < 300 lines
 * (Rule 13). All behaviour is preserved — same data-testid hooks,
 * same callbacks. Pure presentation + lifted state.
 */
export function VacancyFilterPanel({
  open,
  onToggle,
  openVacancies,
  entries,
  filterVacancy,
  setFilterVacancy,
  channelPanelVacancyId,
  setChannelPanelVacancyId,
  setPortretVacancy,
  onOpenVacancyChat,
  openingContextRoom,
}: VacancyFilterPanelProps) {
  const safeVacancies = Array.isArray(openVacancies) ? openVacancies : [];
  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="mb-2 gap-2"
        data-testid="button-toggle-vacancies"
      >
        <Briefcase className="w-4 h-4" />
        Vakansiyalar ({safeVacancies.length})
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>
      {open && (
        <div className="bg-surface-container rounded-xl p-4 mb-3 border border-border/50">
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              size="sm"
              variant={filterVacancy === "all" ? "default" : "outline"}
              onClick={() => setFilterVacancy("all")}
              data-testid="filter-vacancy-all"
            >
              Hammasi
            </Button>
            {safeVacancies.map(v => (
              <Button
                key={v.id}
                size="sm"
                variant={filterVacancy === String(v.id) ? "default" : "outline"}
                onClick={() => setFilterVacancy(filterVacancy === String(v.id) ? "all" : String(v.id))}
                data-testid={`filter-vacancy-${v.id}`}
                className={`max-w-[200px] truncate ${v.is_urgent ? "border-red-500/50" : ""}`}
              >
                {v.is_urgent && <AlertTriangle className="w-3 h-3 mr-1 text-red-400" />}
                {v.title}
              </Button>
            ))}
            {safeVacancies.length === 0 && (
              <span className="text-sm text-muted-foreground">{tLabel("recruiting.no_open_vacancies", "Ochiq vakansiyalar yo'q")}</span>
            )}
          </div>
          {safeVacancies.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {safeVacancies.map(v => {
                const entryCount = safeEntries.filter(e => e.vacancy_id === v.id).length;
                const hasPortret = !!v.portret;
                return (
                  <Card
                    key={v.id}
                    className={`cursor-pointer transition-all ${
                      filterVacancy === String(v.id) ? "ring-2 ring-primary" : ""
                    } ${v.is_urgent ? "border-red-500/40" : ""}`}
                    onClick={() => setFilterVacancy(filterVacancy === String(v.id) ? "all" : String(v.id))}
                    data-testid={`vacancy-card-${v.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-1 justify-between mb-1">
                        <div className="font-medium text-sm truncate leading-tight">{v.title}</div>
                        {v.is_urgent && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 shrink-0">
                            <Zap className="w-2.5 h-2.5" />
                          </Badge>
                        )}
                      </div>
                      {v.department_name && (
                        <div className="text-xs text-muted-foreground truncate">{v.department_name}</div>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{entryCount} nomzod</Badge>
                        {v.vacancy_type && <Badge variant="secondary" className="text-[10px]">{v.vacancy_type}</Badge>}
                        {v.deadline_working_days && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                            SLA: {v.deadline_working_days} k.k.
                          </Badge>
                        )}
                      </div>
                      <ChannelDots channels={v.channels} />
                      <VacancyMarketBadge vacancyId={v.id} />
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-6 text-[10px] px-2 ${
                            hasPortret ? "border-purple-500/40 text-purple-400" : ""
                          }`}
                          onClick={e => { e.stopPropagation(); setPortretVacancy(v); }}
                        >
                          <BookOpen className="w-2.5 h-2.5 mr-1" />
                          {hasPortret ? "Portret ✓" : "Portret"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-6 text-[10px] px-2 gap-0.5 ${
                            channelPanelVacancyId === v.id ? "border-primary/50 text-primary" : "border-border/40"
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            setChannelPanelVacancyId(channelPanelVacancyId === v.id ? null : v.id);
                          }}
                          data-testid={`button-channels-${v.id}`}
                        >
                          <Globe className="w-2.5 h-2.5" />{tLabel("common.VacancyFilterPanel.tsx.kanallar", "Kanallar")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 gap-0.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                          onClick={e => { e.stopPropagation(); onOpenVacancyChat(v.id, v.title); }}
                          data-testid={`button-vacancy-chat-${v.id}`}
                          disabled={openingContextRoom === v.id}
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          {openingContextRoom === v.id ? "..." : "Chat"}
                        </Button>
                      </div>
                      {channelPanelVacancyId === v.id && (
                        <div className="mt-2" onClick={e => e.stopPropagation()}>
                          <ChannelStatusPanel
                            vacancy={v}
                            onUpdate={() =>
                              queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] })
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
      {filterVacancy !== "all" && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            Filtr: {safeVacancies.find(v => String(v.id) === filterVacancy)?.title}
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setFilterVacancy("all")}>
            {tLabel("common.VacancyFilterPanel.tsx.tozalash", "× Tozalash")}
          </Button>
        </div>
      )}
    </div>
  );
}
