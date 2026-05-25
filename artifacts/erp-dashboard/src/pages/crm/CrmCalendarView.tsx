/**
 * @module CrmCalendarView
 * @description Calendar view for CRM workspace — renders items by creation date.
 * Split from CRMWorkspace.tsx (Rule 16).
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, isToday, isSameMonth, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays,
} from "date-fns";
import { uz, ru } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";

type CalItem   = { id: number; title: string; color: string };
type CalStage  = { stageId: string; color: string | null };
type CalEntity = { id: number | string; [key: string]: unknown };

interface CrmCalendarViewProps {
  items: CalEntity[];
  stages: CalStage[];
  onItemClick: (id: number) => void;
}

export function CrmCalendarView({ items, stages, onItemClick }: CrmCalendarViewProps) {
  const { t, language } = useTranslation("crm");
  const dateLocale = language === "ru" ? ru : uz;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const startDay   = addDays(monthStart, -((getDay(monthStart) + 6) % 7));
  const endDay     = addDays(monthEnd, (7 - ((getDay(monthEnd) + 6) % 7)) % 7);
  const days       = eachDayOfInterval({ start: startDay, end: endDay });

  const WEEK_LABELS = language === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

  const stageColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of stages) m[s.stageId] = s.color ?? "#6B7280";
    return m;
  }, [stages]);

  const itemsByDate = useMemo(() => {
    const result: Record<string, CalItem[]> = {};
    for (const item of (Array.isArray(items) ? items : [])) {
      const ds = (item["dateCreate"] as string) ?? (item["createdAt"] as string);
      if (!ds) continue;
      const d = new Date(ds);
      if (isNaN(d.getTime())) continue;
      const key = format(d, "yyyy-MM-dd");

      const rawTitle =
        (item["title"] as string) ??
        [(item["lastName"] as string), (item["name"] as string)].filter(Boolean).join(" ");

      const stageId =
        (item["statusId"] as string) ??
        (item["stageId"] as string) ??
        (item["status"] as string) ??
        "";
      const color = stageColorMap[stageId] ?? "#6B7280";

      if (!result[key]) result[key] = [];
      result[key].push({ id: item.id as number, title: rawTitle || "—", color });
    }
    return result;
  }, [items, stageColorMap]);

  return (
    <div className="flex-1 overflow-auto p-4" data-testid="crm-calendar-view">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label={t("calendar.prevMonth")} data-testid="crm-cal-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold min-w-[180px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>
          <Button
            variant="outline" size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label={t("calendar.nextMonth")} data-testid="crm-cal-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} data-testid="crm-cal-today">
          {t("calendar.today")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border/60">
        {WEEK_LABELS.map((d) => (
          <div key={d} className="bg-muted/60 py-2 text-center text-xs font-semibold text-muted-foreground tracking-wide">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key      = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDate[key] ?? [];
          const inMonth  = isSameMonth(day, currentMonth);
          const isTodays = isToday(day);
          return (
            <div
              key={key}
              className={[
                "bg-card min-h-[88px] p-1.5 transition-colors",
                !inMonth && "opacity-35",
                isTodays && "ring-2 ring-primary ring-inset",
              ].filter(Boolean).join(" ")}
              data-testid={`crm-cal-day-${key}`}
            >
              <span className={[
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold mb-0.5",
                isTodays ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              ].join(" ")}>
                {format(day, "d")}
              </span>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium text-white leading-snug hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: it.color }}
                    onClick={() => onItemClick(it.id)}
                    data-testid={`crm-cal-item-${it.id}`}
                  >
                    {it.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1 leading-tight">
                    {t("calendar.morePlus", { n: String(dayItems.length - 3) })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
