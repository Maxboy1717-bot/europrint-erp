/** @module CoordinationPageSections @description Tab-content section components for CoordinationPage: DoklaSection, RaspoSection, BasketsSection, and CouncilsSection. Receive data and callbacks as props; own no state or queries. OverviewSection lives in CoordinationPageOverview.tsx. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Clock, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { CommunicationCenter } from "@/components/cc/CommunicationCenter";
import { DoklaStatusBadge, RaspoStatusBadge, PriorityDot } from "./CoordinationPageHelpers";
import {
  COUNCIL_LEVELS, shortDate, isOverdue,
  type Council, type Dokla, type Raspo, type DoklaStatus, type RaspoStatus,
} from "./CoordinationPageTypes";
import type { UseMutateFunction } from "@tanstack/react-query";

import { EPLoader } from "@/components/ep";
// ─── DoklaSection ─────────────────────────────────────────────────────────
interface DoklaSectionProps {
  doklads: Dokla[];
  doklaLoading: boolean;
  doklaSearch: string;
  setDoklaSearch: (v: string) => void;
  doklaStatusFilter: DoklaStatus | "";
  setDoklaStatusFilter: (v: DoklaStatus | "") => void;
  onCreateDokla: () => void;
  onMarkRead: UseMutateFunction<unknown, unknown, string>;
  onMarkResolved: UseMutateFunction<unknown, unknown, string>;
}

export function DoklaSection({
  doklads, doklaLoading, doklaSearch, setDoklaSearch,
  doklaStatusFilter, setDoklaStatusFilter, onCreateDokla,
  onMarkRead, onMarkResolved,
}: DoklaSectionProps) {
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";

  const filtered = doklads.filter(d => {
    const matchSearch = !doklaSearch
      || d.subject.toLowerCase().includes(doklaSearch.toLowerCase())
      || (d.from_name || "").toLowerCase().includes(doklaSearch.toLowerCase());
    const matchStatus = !doklaStatusFilter || d.status === doklaStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <TabsContent value="dokla" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder={isRu ? "Поиск по теме..." : "Mavzu bo'yicha qidirish..."}
            value={doklaSearch}
            onChange={e => setDoklaSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-2 py-1.5 text-sm"
          value={doklaStatusFilter}
          onChange={e => setDoklaStatusFilter(e.target.value as DoklaStatus | "")}
        >
          <option value="">{isRu ? "Все статусы" : "Barcha holat"}</option>
          <option value="sent">{isRu ? "Отправлено" : "Yuborildi"}</option>
          <option value="read">{isRu ? "Прочитано" : "O'qildi"}</option>
          <option value="resolved">{isRu ? "Решено" : "Hal qilindi"}</option>
        </select>
        <Button size="sm" onClick={onCreateDokla}>
          <ArrowUp className="w-3.5 h-3.5 mr-1.5" />{t("createDokla")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {doklaLoading && (
            <div className="flex justify-center py-8"><EPLoader tone="muted" className="w-5 h-5" /></div>
          )}
          {!doklaLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{isRu ? "Докладов нет" : "Докладлар yo'q"}</p>
          )}
          {!doklaLoading && filtered.map(d => (
            <div key={d.id} className="flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors" data-testid={`dokla-row-${d.id}`}>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowUp className="w-3.5 h-3.5 text-[var(--ep-blue)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{d.subject}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.council_level}-kengash</span>
                </div>
                {d.problem && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.problem}</p>}
                <p className="text-[11px] text-muted-foreground mt-0.5">{d.from_name || "—"} · {shortDate(d.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <DoklaStatusBadge status={d.status} />
                <div className="flex gap-1">
                  {d.status === "sent" && (
                    <button
                      className="text-[10px] text-[var(--ep-yellow)] hover:text-amber-800 font-semibold border border-amber-200 rounded px-1.5 py-0.5"
                      onClick={() => onMarkRead(d.id)}
                      title={isRu ? "Отметить как прочитанное" : "O'qildi deb belgilash"}
                    >
                      {isRu ? "O'qildi" : "O'qildi"}
                    </button>
                  )}
                  {d.status !== "resolved" && (
                    <button
                      className="text-[10px] text-[var(--ep-green)] hover:text-emerald-800 font-semibold border border-emerald-200 rounded px-1.5 py-0.5"
                      onClick={() => onMarkResolved(d.id)}
                      title={isRu ? "Решено" : "Hal qilindi"}
                    >✓</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── RaspoSection ─────────────────────────────────────────────────────────
interface RaspoSectionProps {
  rasporyazheniya: Raspo[];
  raspoLoading: boolean;
  raspoSearch: string;
  setRaspoSearch: (v: string) => void;
  raspoStatusFilter: RaspoStatus | "";
  setRaspoStatusFilter: (v: RaspoStatus | "") => void;
  onCreateRaspo: () => void;
  onMarkDone: UseMutateFunction<unknown, unknown, string>;
}

export function RaspoSection({
  rasporyazheniya, raspoLoading, raspoSearch, setRaspoSearch,
  raspoStatusFilter, setRaspoStatusFilter, onCreateRaspo, onMarkDone,
}: RaspoSectionProps) {
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";

  const filtered = rasporyazheniya.filter(r => {
    const matchSearch = !raspoSearch
      || r.task.toLowerCase().includes(raspoSearch.toLowerCase())
      || r.to_user.toLowerCase().includes(raspoSearch.toLowerCase());
    const matchStatus = !raspoStatusFilter || r.status === raspoStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <TabsContent value="raspo" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder={isRu ? "Поиск по заданию..." : "Topshiriq bo'yicha qidirish..."}
            value={raspoSearch}
            onChange={e => setRaspoSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-2 py-1.5 text-sm"
          value={raspoStatusFilter}
          onChange={e => setRaspoStatusFilter(e.target.value as RaspoStatus | "")}
        >
          <option value="">{isRu ? "Все статусы" : "Barcha holat"}</option>
          <option value="assigned">{isRu ? "Назначено" : "Topshirildi"}</option>
          <option value="in_progress">{isRu ? "В работе" : "Bajarilmoqda"}</option>
          <option value="done">{isRu ? "Выполнено" : "Bajarildi"}</option>
          <option value="overdue">{isRu ? "Просрочено" : "Muddati o'tdi"}</option>
        </select>
        <Button size="sm" onClick={onCreateRaspo}>
          <ArrowDown className="w-3.5 h-3.5 mr-1.5" />{t("createRasporyazhenie")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {raspoLoading && (
            <div className="flex justify-center py-8"><EPLoader tone="muted" className="w-5 h-5" /></div>
          )}
          {!raspoLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{isRu ? "Нет распоряжений" : "Распоряжения yo'q"}</p>
          )}
          {!raspoLoading && filtered.map(r => {
            const overdue = r.status !== "done" && isOverdue(r.deadline);
            return (
              <div key={r.id} className={cn("flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors", overdue && "bg-red-50/40")} data-testid={`raspo-row-${r.id}`}>
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-[var(--ep-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.task}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{isRu ? "Кому:" : "Kimga:"} <b>{r.to_user}</b></span>
                    {r.from_name && <span className="text-[11px] text-muted-foreground">{isRu ? "От:" : "Kimdan:"} {r.from_name}</span>}
                    <span className={cn("text-[11px] flex items-center", overdue ? "text-[var(--ep-red)] font-semibold" : "text-muted-foreground")}>
                      <Clock className="w-2.5 h-2.5 mr-0.5" />
                      {shortDate(r.deadline)}
                      {overdue && ` (${isRu ? "просрочено" : "kechikdi"})`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <RaspoStatusBadge status={r.status} />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <PriorityDot p={r.priority} />{r.priority}
                    </span>
                    {r.status !== "done" && (
                      <button
                        className="text-[10px] text-[var(--ep-green)] hover:text-emerald-800 font-semibold border border-emerald-200 rounded px-1.5 py-0.5 ml-1"
                        onClick={() => onMarkDone(r.id)}
                      >✓</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── BasketsSection ───────────────────────────────────────────────────────
export function BasketsSection() {
  return (
    <TabsContent value="baskets" className="mt-4">
      {/* Yangi Kommunikatsiya Markazi (3 Savat Tizimi)
          To'liq AI + workflow + PIN imzolash + bildirishnomalar
          bilan ishlovchi yangi modul. */}
      <CommunicationCenter />
    </TabsContent>
  );
}

// ─── CouncilsSection ──────────────────────────────────────────────────────
interface CouncilsSectionProps {
  councils: Council[];
  councilsLoading: boolean;
}

export function CouncilsSection({ councils, councilsLoading }: CouncilsSectionProps) {
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";

  return (
    <TabsContent value="councils" className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">{t("escalationRule")} · {t("escalationProtocol")}</p>

      {councilsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="border-2 shadow-none animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!councilsLoading && councils.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {isRu ? "Советы не найдены" : "Kengashlar topilmadi"}
        </p>
      )}

      {!councilsLoading && councils.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {councils.map((c, i) => {
            const style = COUNCIL_LEVELS[i % COUNCIL_LEVELS.length];
            const Icon = style.icon;
            return (
              <Card key={c.id} className={cn("border-2 shadow-none", style.color.replace("bg-", "border-").split(" ")[0])}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", style.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground">{c.council_type}</div>
                      <div className="font-semibold text-sm leading-tight">{c.name}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  {c.description && (
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{c.description}</span>
                    </div>
                  )}
                  <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1", style.badgeClass)}>
                    {c.council_type}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </TabsContent>
  );
}
