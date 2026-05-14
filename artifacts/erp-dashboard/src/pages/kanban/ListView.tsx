/**
 * @module ListView
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Clock, AlertTriangle, Flame } from "lucide-react";
import { format, isBefore, isToday, startOfDay } from "date-fns";
import type { KanbanColumn } from "@shared/schema";
import { type CardWithOwner, type T, PRIORITY_CONFIG, STATUS_BADGES, getDeadlineCategory } from "./kanban-types";
import { getPersonName, getInitials } from "./kanban-utils";

export function ListView({
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedCards = useMemo(() => {
    if (!sortColumn) return cards;

    return [...cards].sort((a, b) => {
      let aVal: string, bVal: string;

      switch (sortColumn) {
        case "title": aVal = (a.title ?? "").toLowerCase(); bVal = (b.title ?? "").toLowerCase(); break;
        case "activity": aVal = a.updatedAt || ""; bVal = b.updatedAt || ""; break;
        case "deadline": aVal = a.dueDate || "9999"; bVal = b.dueDate || "9999"; break;
        case "creator": aVal = a.creator?.fullName || ""; bVal = b.creator?.fullName || ""; break;
        case "assignee": aVal = a.owner?.fullName || ""; bVal = b.owner?.fullName || ""; break;
        default: return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [cards, sortColumn, sortDirection]);

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(column)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const lang = "uz" as const;

  const getStatusBadge = (status: string | undefined) => {
    const statusKey = status || "active";
    const statusConfig = STATUS_BADGES[statusKey as keyof typeof STATUS_BADGES] || STATUS_BADGES.active;
    return (
      <Badge className={`text-[10px] ${statusConfig.color}`} data-testid={`badge-status-${statusKey}`}>
        {statusConfig.label[lang]}
      </Badge>
    );
  };

  const getDeadlineBadgeClass = (dueDate: string | null) => {
    if (!dueDate) return "";
    const category = getDeadlineCategory(dueDate);
    switch (category) {
      case "overdue": return "bg-[var(--ep-red)] text-white";
      case "today": return "bg-[var(--ep-green)] text-white";
      case "thisWeek": return "bg-[var(--ep-green)] text-white";
      case "nextWeek": return "bg-[var(--ep-blue)] text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getDeadlineLabel = (dueDate: string) => {
    const category = getDeadlineCategory(dueDate);
    const date = new Date(dueDate);
    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    switch (category) {
      case "overdue": return `Kechikkan`;
      case "today": return `Bugun, ${timeStr}`;
      default: return format(date, "dd.MM.yyyy");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card dark:bg-slate-900">
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow className="bg-background dark:bg-slate-800 hover:bg-muted/40 transition-colors">
            <SortHeader column="title">{t.table.taskName}</SortHeader>
            <SortHeader column="activity">{t.table.activity}</SortHeader>
            <SortHeader column="deadline">{t.table.deadline}</SortHeader>
            <SortHeader column="creator">{t.table.creator}</SortHeader>
            <SortHeader column="assignee">{t.table.assignee}</SortHeader>
            <TableHead>{t.table.project}</TableHead>
            <TableHead>{t.table.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(sortedCards) ? sortedCards : []).map((card, idx) => {
            const priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
            const isOverdue = card.dueDate && isBefore(new Date(card.dueDate), startOfDay(new Date()));
            const isHighPriority = card.priority === "high" || card.priority === "urgent";
            const isTodayDeadline = card.dueDate && isToday(new Date(card.dueDate));

            return (
              <TableRow
                key={card.id}
                className={`cursor-pointer hover-elevate ${idx % 2 === 0 ? "bg-background/50 dark:bg-slate-800/50" : ""}`}
                onClick={() => onCardClick(card)}
                data-testid={`list-row-${card.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isHighPriority ? (
                      <Flame className={`h-4 w-4 flex-shrink-0 animate-pulse ${card.priority === "urgent" ? "text-[var(--ep-red)]" : "text-[var(--ep-primary)]"}`} data-testid={`icon-flame-${card.id}`} />
                    ) : (
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`} />
                    )}
                    <span className="font-medium">{card.title}</span>
                    {card.tags && card.tags.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-[var(--ep-purple)] dark:text-purple-400">+{card.tags.length}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm" data-testid={`cell-activity-${card.id}`}>
                  {card.updatedAt ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(card.updatedAt), "dd.MM HH:mm")}
                    </span>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {card.dueDate ? (
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium ${getDeadlineBadgeClass(card.dueDate)}`}>
                      {isOverdue && <AlertTriangle className="h-3 w-3" />}
                      {getDeadlineLabel(card.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {card.creator ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-2 ring-white dark:ring-slate-800">
                        <AvatarImage src={card.creator.profileImageUrl || undefined} />
                        <AvatarFallback className="text-[9px] text-white">{getInitials(getPersonName(card.creator))}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getPersonName(card.creator)}</span>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {card.owner ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-2 ring-white dark:ring-slate-800">
                        <AvatarImage src={card.owner.profileImageUrl || undefined} />
                        <AvatarFallback className="text-[9px] text-white">{getInitials(getPersonName(card.owner))}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getPersonName(card.owner)}</span>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground" data-testid={`cell-project-${card.id}`}>-</TableCell>
                <TableCell data-testid={`cell-status-${card.id}`}>
                  {getStatusBadge(card.status)}
                </TableCell>
              </TableRow>
            );
          })}

          {sortedCards.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-[13px] text-muted-foreground">
                {t.empty.noTasks}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table></div>
    </div>
  );
}
