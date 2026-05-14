/**
 * @module GanttView
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, isToday, startOfDay, addDays, differenceInDays, getDay,
} from "date-fns";
import type { KanbanColumn } from "@shared/schema";
import { type CardWithOwner, type T, PRIORITY_CONFIG } from "./kanban-types";
import { getProp } from "./kanban-utils";

export function GanttView({
  cards,
  columns,
  onCardClick,
  t,
}: {
  cards: CardWithOwner[];
  columns: KanbanColumn[];
  onCardClick: (card: CardWithOwner) => void;
  t: typeof T.uz;
}) {
  const [startDate, setStartDate] = useState(() => {
    const today = startOfDay(new Date());
    return addDays(today, -7);
  });
  
  const daysToShow = 28;
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  const dayWidth = 40;
  
  const tasksWithDates = useMemo(() => {
    return cards
      .filter((card) => {
        // Backend snake_case fallback (due_date) yoki camelCase (dueDate)
        return card.dueDate ?? getProp<string>(card, 'dueDate', 'due_date');
      })
      .map((card) => {
        const dueDateStr = (card.dueDate ?? getProp<string>(card, 'dueDate', 'due_date')) as string;
        const dueDate = startOfDay(new Date(dueDateStr));
        const duration = card.estimatedTime ? Math.ceil(card.estimatedTime / (8 * 60)) : 1;
        const taskStart = addDays(dueDate, -duration + 1);
        return { ...card, dueDate: dueDateStr, taskStart, taskEnd: dueDate, duration };
      })
      .sort((a, b) => new Date(a.taskStart).getTime() - new Date(b.taskStart).getTime());
  }, [cards]);

  const getTaskPosition = (task: typeof tasksWithDates[0]) => {
    const taskStartOffset = differenceInDays(task.taskStart, startDate);
    const left = Math.max(0, taskStartOffset * dayWidth);
    const width = task.duration * dayWidth;
    const clippedLeft = taskStartOffset < 0 ? Math.abs(taskStartOffset) * dayWidth : 0;
    return { left, width: width - clippedLeft, visible: taskStartOffset + task.duration > 0 && taskStartOffset < daysToShow };
  };

  return (
    <div className="h-full flex flex-col" data-testid="gantt-view">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Oldingi hafta" onClick={() => setStartDate(addDays(startDate, -7))} data-testid="button-gantt-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Oldingi hafta</TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {format(startDate, "dd MMM")} - {format(addDays(startDate, daysToShow - 1), "dd MMM yyyy")}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Keyingi hafta" onClick={() => setStartDate(addDays(startDate, 7))} data-testid="button-gantt-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyingi hafta</TooltipContent>
          </Tooltip>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(new Date(), -7))} data-testid="button-gantt-today">
          Bugun
        </Button>
      </div>

      <ScrollArea className="flex-1 border rounded-lg">
        <div className="min-w-max">
          <div className="flex border-b bg-muted sticky top-0 z-10">
            <div className="w-64 p-2 border-r font-medium text-sm flex-shrink-0">Vazifa</div>
            <div className="flex">
              {(Array.isArray(days) ? days : []).map((day) => {
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                const isTodayDate = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`text-center text-xs p-1 border-r ${isWeekend ? "bg-muted/50" : ""} ${isTodayDate ? "bg-primary/10" : ""}`}
                    style={{ width: dayWidth }}
                  >
                    <div className="font-medium">{format(day, "dd")}</div>
                    <div className="text-muted-foreground">{format(day, "EEE").slice(0, 2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {(Array.isArray(tasksWithDates) ? tasksWithDates : []).map((task) => {
            const { left, width, visible } = getTaskPosition(task);
            const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
            // columnId camelCase yoki column_id snake_case (backend castTo() konvertatsiya qilmaydi)
            const rawTask = task as unknown as Record<string, unknown>;
            const taskColId = task.columnId ?? rawTask.column_id;
            const column = (Array.isArray(columns) ? columns : []).find((c) => String(c.id) === String(taskColId ?? ""));
            
            if (!visible) return null;
            
            return (
              <div key={task.id} className="flex border-b hover:bg-muted/30" data-testid={`gantt-row-${task.id}`}>
                <div className="w-64 p-2 border-r flex-shrink-0 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`} />
                  <span className="text-sm truncate">{task.title}</span>
                  {task.owner && (
                    <Avatar className="h-5 w-5 ml-auto flex-shrink-0">
                      <AvatarImage src={task.owner.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {String((task.owner as unknown as Record<string,unknown>).fullName ?? (task.owner as unknown as Record<string,unknown>).full_name ?? "?").split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="flex-1 relative" style={{ height: 36 }}>
                  <div className="flex absolute inset-0">
                    {(Array.isArray(days) ? days : []).map((day) => {
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      const isTodayDate = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r ${isWeekend ? "bg-muted/30" : ""} ${isTodayDate ? "bg-primary/10" : ""}`}
                          style={{ width: dayWidth }}
                        />
                      );
                    })}
                  </div>
                  <div
                    className={`absolute top-1 h-6 rounded cursor-pointer ${priorityConfig.color} border flex items-center px-2 overflow-hidden`}
                    style={{ left, width: Math.max(width, 30) }}
                    onClick={() => onCardClick(task)}
                    data-testid={`gantt-bar-${task.id}`}
                  >
                    <span className="text-[10px] truncate">{task.title}</span>
                  </div>
                  {task.relatedId && (
                    <div
                      className="absolute top-4 w-4 h-0.5 bg-muted-foreground"
                      style={{ left: left - 16 }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-y-2 border-l-muted-foreground border-y-transparent" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {tasksWithDates.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {t.empty.noTasks}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
