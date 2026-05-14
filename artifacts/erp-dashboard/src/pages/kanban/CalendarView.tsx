/**
 * @module CalendarView
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, isToday, isSameMonth, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays,
} from "date-fns";
import { type CardWithOwner, type T, PRIORITY_CONFIG } from "./kanban-types";

export function CalendarView({
  cards,
  onCardClick,
  onCreateTask,
  t,
}: {
  cards: CardWithOwner[];
  onCardClick: (card: CardWithOwner) => void;
  onCreateTask: (date: Date) => void;
  t: typeof T.uz;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = addDays(monthStart, -getDay(monthStart) + 1);
  const endDate = addDays(monthEnd, 7 - getDay(monthEnd));
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const weekDays = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  
  const tasksByDate = useMemo(() => {
    const result: Record<string, CardWithOwner[]> = {};
    (Array.isArray(cards) ? cards : []).forEach((card) => {
      if (card.dueDate) {
        const dateKey = format(new Date(card.dueDate), "yyyy-MM-dd");
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(card);
      }
    });
    return result;
  }, [cards]);

  return (
    <div className="h-full flex flex-col" data-testid="calendar-view">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Oldingi oy" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Oldingi oy</TooltipContent>
          </Tooltip>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Keyingi oy" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyingi oy</TooltipContent>
          </Tooltip>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} data-testid="button-today">
          Bugun
        </Button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-px bg-border rounded-lg overflow-hidden flex-1">
        {(Array.isArray(weekDays) ? weekDays : []).map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
        
        {(Array.isArray(days) ? days : []).map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodays = isToday(day);
          
          return (
            <div
              key={dateKey}
              className={`bg-card min-h-[100px] p-1 cursor-pointer hover-elevate ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isTodays ? "ring-2 ring-primary ring-inset" : ""}`}
              onClick={() => dayTasks.length === 0 && onCreateTask(day)}
              data-testid={`calendar-day-${dateKey}`}
            >
              <div className={`text-xs mb-1 ${isTodays ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => {
                  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
                  return (
                    <div
                      key={task.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${priorityConfig.color}`}
                      onClick={(e) => { e.stopPropagation(); onCardClick(task); }}
                      data-testid={`calendar-task-${task.id}`}
                    >
                      {task.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayTasks.length - 3} ko'proq
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
