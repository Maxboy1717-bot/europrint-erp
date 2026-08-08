/** @module CoordinationPageOverview @description Overview tab content for CoordinationPage: council hierarchy, weekly schedule, escalation path, and latest-activity cards. Receives data and navigation callbacks as props. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, TrendingUp, CalendarDays, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { DoklaStatusBadge, RaspoStatusBadge } from "./CoordinationPageHelpers";
import { COUNCIL_LEVELS, shortDate, type Dokla, type Raspo } from "./CoordinationPageTypes";

import { EPLoader } from "@/components/ep";
interface OverviewSectionProps {
  doklads: Dokla[];
  rasporyazheniya: Raspo[];
  doklaLoading: boolean;
  raspoLoading: boolean;
  onGoToDokla: () => void;
  onGoToRaspo: () => void;
}

export function OverviewSection({
  doklads, rasporyazheniya, doklaLoading, raspoLoading,
  onGoToDokla, onGoToRaspo,
}: OverviewSectionProps) {
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";

  return (
    <TabsContent value="overview" className="space-y-4 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Council hierarchy */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("councilSystem")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {COUNCIL_LEVELS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.level} className={cn("flex items-center gap-3 rounded-xl border-2 p-3 transition-shadow hover:shadow-sm", c.color)} data-testid={`council-level-${c.level}`}>
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold opacity-50">{c.level}-daraja</span>
                        <span className="text-sm font-semibold">{t(c.key)}</span>
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">{t(c.purposeKey)}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", c.badgeClass)}>
                      {t(c.freqKey)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Weekly schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {t("councilSchedule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { day: isRu ? "Понедельник" : "Dushanba",  event: isRu ? "Наличные платежи" : "Naqd to'lovlar",         color: "border-l-rose-400"    },
                { day: isRu ? "Вторник"     : "Seshanba",   event: `${t("recommendationCouncil")} · ЗВС`,                 color: "border-l-emerald-400" },
                { day: isRu ? "Среда"       : "Chorshanba", event: isRu ? "Финансовый план (ФП)" : "Moliyaviy reja (ФП)", color: "border-l-blue-400"    },
                { day: isRu ? "Четверг"     : "Payshanba",  event: isRu ? "Банковские платежи" : "Bank to'lovlari",       color: "border-l-amber-400"   },
                { day: isRu ? "Пятница"     : "Juma",       event: t("executiveCouncil"),                                 color: "border-l-violet-400"  },
              ].map((s, i) => (
                <div key={i} className={cn("pl-3 py-1.5 border-l-2 rounded-r", s.color)}>
                  <p className="text-xs font-semibold">{s.day}</p>
                  <p className="text-xs text-muted-foreground">{s.event}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Escalation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--ep-yellow)]" />
                {t("escalation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[...COUNCIL_LEVELS].reverse().map((c, i) => (
                  <div key={c.level} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", c.badgeClass)}>
                      {c.level}
                    </span>
                    <span className="truncate">{t(c.key)}</span>
                    {i < COUNCIL_LEVELS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 ml-auto" />}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{t("escalationProcess")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Latest activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--ep-blue)]">
                <ArrowUp className="w-3.5 h-3.5" />{isRu ? "Последние Докладлар" : "Oxirgi Докладлар"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={onGoToDokla}>
                {isRu ? "Все" : "Hammasi"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {doklaLoading && <EPLoader tone="muted" className="w-4 h-4" />}
            {!doklaLoading && doklads.slice(0, 4).map(d => (
              <div key={d.id} className="flex items-center gap-2 p-2 rounded-md bg-blue-50 hover:bg-blue-100/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{d.subject}</p>
                  <p className="text-[11px] text-muted-foreground">{d.from_name || "—"} · {shortDate(d.created_at)}</p>
                </div>
                <DoklaStatusBadge status={d.status} />
              </div>
            ))}
            {!doklaLoading && doklads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">{isRu ? "Нет докладов" : "Докладлар yo'q"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--ep-primary)]">
                <ArrowDown className="w-3.5 h-3.5" />{isRu ? "Последние Распоряжения" : "Oxirgi Распоряжения"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={onGoToRaspo}>
                {isRu ? "Все" : "Hammasi"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {raspoLoading && <EPLoader tone="muted" className="w-4 h-4" />}
            {!raspoLoading && rasporyazheniya.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-md bg-orange-50 hover:bg-orange-100/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.task}</p>
                  <p className="text-[11px] text-muted-foreground">{r.to_name ?? r.to_user} · {shortDate(r.deadline)}</p>
                </div>
                <RaspoStatusBadge status={r.status} />
              </div>
            ))}
            {!raspoLoading && rasporyazheniya.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">{isRu ? "Нет распоряжений" : "Распоряжения yo'q"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
