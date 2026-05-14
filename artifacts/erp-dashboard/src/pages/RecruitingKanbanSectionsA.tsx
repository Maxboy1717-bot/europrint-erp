/**
 * @module RecruitingKanbanSectionsA
 * @description Stats bar and filter bar section components for the Recruiting Kanban page.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase, TrendingUp, Users, CheckCircle, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, Zap, BookOpen,
  Globe, Bot, CalendarDays, MessageSquare,
} from "lucide-react";
import {
  StatCard, ChannelDots, ChannelStatusPanel, VacancyMarketBadge,
} from "@/components/recruiting/helpers";
import { queryClient } from "@/lib/queryClient";
import type {
  StatsBarProps,
  FilterBarProps,
  VacancyPanelProps,
} from "./RecruitingKanbanTypes";

// ─── Stats Bar ───────────────────────────────────────────────────────────────

export function RecruitingStatsBar({
  entries,
  activeCount,
  hiredCount,
  rejectedCount,
  conversionRate,
  openVacancies,
  urgentVacancies,
  aiSessionsCount,
  probationCount,
}: StatsBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard icon={Users} label={t("jamiNomzodlar")} value={entries.length} />
      <StatCard icon={TrendingUp} label={t("faolJarayonlar")} value={activeCount} />
      <StatCard icon={CheckCircle} label={t("qabulQilindi")} value={hiredCount} color="bg-green-500" />
      <StatCard icon={XCircle} label={t("radEtildi")} value={rejectedCount} color="bg-red-500" />
      <StatCard icon={TrendingUp} label={t("samaradorlik")} value={`${conversionRate}%`} />
      <StatCard icon={Briefcase} label={t("ochiqVakansiya")} value={openVacancies.length} color="bg-indigo-500" />
      <StatCard icon={AlertTriangle} label={t("Shoshilinch")} value={urgentVacancies.length} color="bg-red-500" />
      <StatCard icon={Bot} label={t("aiSessiyalar")} value={aiSessionsCount} color="bg-violet-500" />
      <StatCard icon={CalendarDays} label={t("sinovDavri")} value={probationCount} color="bg-emerald-500" />
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

export function RecruitingFilterBar({
  showProbationOnly,
  setShowProbationOnly,
  probationTotalCount,
  filterVacancy,
  setFilterVacancy,
  openVacancies,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Button
        size="sm"
        variant={showProbationOnly ? "default" : "outline"}
        onClick={() => setShowProbationOnly(p => !p)}
        className={
          showProbationOnly
            ? "bg-emerald-600 hover:bg-[var(--ep-green)]/90 border-emerald-600"
            : "border-emerald-500/40 text-emerald-400 hover:bg-[var(--ep-green)]/90/10"
        }
        data-testid="button-filter-probation"
      >
        <CalendarDays className="w-3.5 h-3.5 mr-1" />
        Sinov Davri ({probationTotalCount})
      </Button>
      {showProbationOnly && (
        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
          {t("faqatSinovDavrida")}
        </span>
      )}
    </div>
  );
}

// ─── Vacancy Panel ───────────────────────────────────────────────────────────

export function RecruitingVacancyPanel({
  openVacancies,
  filterVacancy,
  setFilterVacancy,
  vacancyPanelOpen,
  setVacancyPanelOpen,
  entries,
  channelPanelVacancyId,
  setChannelPanelVacancyId,
  setPortretVacancy,
  openingContextRoom,
  handleOpenVacancyChat,
}: VacancyPanelProps) {
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVacancyPanelOpen(!vacancyPanelOpen)}
        className="mb-2 gap-2"
        data-testid="button-toggle-vacancies"
      >
        <Briefcase className="w-4 h-4" />
        Vakansiyalar ({openVacancies.length})
        {vacancyPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>

      {vacancyPanelOpen && (
        <div className="bg-muted/60 rounded-xl p-4 mb-3 border border-border/50">
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              size="sm"
              variant={filterVacancy === "all" ? "default" : "outline"}
              onClick={() => setFilterVacancy("all")}
              data-testid="filter-vacancy-all"
            >
              {t("hammasi")}
            </Button>
            {(Array.isArray(openVacancies) ? openVacancies : []).map(v => (
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
            {openVacancies.length === 0 && (
              <span className="text-sm text-muted-foreground">{t("ochiqVakansiyalarYoq")}</span>
            )}
          </div>

          {openVacancies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(Array.isArray(openVacancies) ? openVacancies : []).map(v => {
                const entryCount = (Array.isArray(entries) ? entries : []).filter(e => e.vacancy_id === v.id).length;
                const hasPortret = !!v.portret;
                return (
                  <Card
                    key={v.id}
                    className={`cursor-pointer transition-all ${filterVacancy === String(v.id) ? "ring-2 ring-primary" : ""} ${v.is_urgent ? "border-red-500/40" : ""}`}
                    onClick={() => setFilterVacancy(filterVacancy === String(v.id) ? "all" : String(v.id))}
                    data-testid={`vacancy-card-${v.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-1 justify-between mb-1">
                        <div className="font-medium text-sm truncate leading-tight">{v.title}</div>
                        {v.is_urgent && (
                          <Badge className="bg-[var(--ep-red)] text-white text-[9px] px-1 py-0 shrink-0">
                            <Zap className="w-2.5 h-2.5" />
                          </Badge>
                        )}
                      </div>
                      {v.department_name && (
                        <div className="text-xs text-muted-foreground truncate">{v.department_name}</div>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{entryCount} nomzod</Badge>
                        {v.vacancy_type && <EPStatusPill tone="neutral" className="text-[10px]">{v.vacancy_type}</EPStatusPill>}
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
                          className={`h-6 text-[10px] px-2 ${hasPortret ? "border-purple-500/40 text-purple-400" : ""}`}
                          onClick={e => { e.stopPropagation(); setPortretVacancy(v); }}
                        >
                          <BookOpen className="w-2.5 h-2.5 mr-1" />
                          {hasPortret ? "Portret ✓" : "Portret"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-6 text-[10px] px-2 gap-0.5 ${channelPanelVacancyId === v.id ? "border-primary/50 text-primary" : "border-border/40"}`}
                          onClick={e => {
                            e.stopPropagation();
                            setChannelPanelVacancyId(channelPanelVacancyId === v.id ? null : v.id);
                          }}
                          data-testid={`button-channels-${v.id}`}
                        >
                          <Globe className="w-2.5 h-2.5" />{t("kanallar")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 gap-0.5 border-blue-500/40 text-blue-400 hover:bg-[var(--ep-blue)]/90/10"
                          onClick={e => { e.stopPropagation(); handleOpenVacancyChat(v.id, v.title); }}
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
                            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] })}
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
          <EPStatusPill tone="neutral" className="text-xs">
            Filtr: {(Array.isArray(openVacancies) ? openVacancies : []).find(v => String(v.id) === filterVacancy)?.title}
          </EPStatusPill>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setFilterVacancy("all")}>
            {t("tozalash1")}
          </Button>
        </div>
      )}
    </div>
  );
}

import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
