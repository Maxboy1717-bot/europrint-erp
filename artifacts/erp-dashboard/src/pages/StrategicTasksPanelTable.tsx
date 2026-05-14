/**
 * @module StrategicTasksPanelTable
 * @description Tasks table with expandable rows for StrategicTasksPanel.
 */

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, type TaskWithCategory } from "./StrategicTasksPanelTypes";

import { useTranslation } from '@/lib/i18n';
interface TasksTableProps {
  tasks: TaskWithCategory[];
  isLoading: boolean;
  expandedTaskId: string | null;
  onToggleExpand: (id: string) => void;
}

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return opt ? <Badge className={opt.color}>{opt.label}</Badge> : <Badge>{status}</Badge>;
}

function getPriorityBadge(priority: string) {
  const opt = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return opt ? <Badge className={opt.color}>{opt.label}</Badge> : <Badge>{priority}</Badge>;
}

export function TasksTable({tasks, isLoading, expandedTaskId, onToggleExpand }: TasksTableProps) {
  const { t } = useTranslation('common');
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {([1, 2, 3, 4, 5]).map((i) => (
          <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground" data-testid="text-no-tasks">
        Vazifalar topilmadi
      </div>
    );
  }

  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">#</TableHead>
          <TableHead>Sarlavha</TableHead>
          <TableHead className="hidden md:table-cell">Kategoriya</TableHead>
          <TableHead>Muhimlik</TableHead>
          <TableHead>Holat</TableHead>
          <TableHead className="hidden lg:table-cell w-full sm:w-[120px]">{t('progress5')}</TableHead>
          <TableHead className="hidden lg:table-cell">Maqsad sanasi</TableHead>
          <TableHead className="w-[40px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(tasks) ? tasks : []).map((task) => (
          <>
            <TableRow
              key={task.id}
              className="cursor-pointer hover-elevate hover:bg-muted/40 transition-colors"
              data-testid={`row-task-${task.id}`}
              onClick={() => onToggleExpand(task.id)}
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                {task.taskNumber}
              </TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell className="hidden md:table-cell">
                {task.categoryName && (
                  <Badge variant="outline" style={task.categoryColor ? { borderColor: task.categoryColor, color: task.categoryColor } : undefined}>
                    {task.categoryName}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{getPriorityBadge(task.priority)}</TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <Progress value={task.progressPercent} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-8">{task.progressPercent}%</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {task.targetDate || "—"}
              </TableCell>
              <TableCell>
                {expandedTaskId === task.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>
            {expandedTaskId === task.id && (
              <TableRow key={`${task.id}-details`} className="hover:bg-muted/40 transition-colors">
                <TableCell colSpan={8} className="bg-muted/30">
                  <div className="p-4 space-y-3">
                    {task.titleRu && (
                      <div>
                        <span className="text-xs text-muted-foreground">Название (RU):</span>
                        <p className="text-sm">{task.titleRu}</p>
                      </div>
                    )}
                    {task.description && (
                      <div>
                        <span className="text-xs text-muted-foreground">Tavsif:</span>
                        <p className="text-sm">{task.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {task.phase && (
                        <div>
                          <span className="text-xs text-muted-foreground">Bosqich:</span>
                          <p>{task.phase}</p>
                        </div>
                      )}
                      {task.targetModule && (
                        <div>
                          <span className="text-xs text-muted-foreground">Modul:</span>
                          <p>{task.targetModule}</p>
                        </div>
                      )}
                      {task.startDate && (
                        <div>
                          <span className="text-xs text-muted-foreground">Boshlanish:</span>
                          <p>{task.startDate}</p>
                        </div>
                      )}
                      {task.estimatedHours && (
                        <div>
                          <span className="text-xs text-muted-foreground">Taxminiy soatlar:</span>
                          <p>{task.estimatedHours} soat</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground">Avtomatlashtirish:</span>
                        <p>{task.isAutomatable ? "Ha" : "Yo'q"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sanoatga mos:</span>
                        <p>{task.industryAdaptable ? "Ha" : "Yo'q"}</p>
                      </div>
                    </div>
                    {task.notes && (
                      <div>
                        <span className="text-xs text-muted-foreground">Izohlar:</span>
                        <p className="text-sm">{task.notes}</p>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table></div>
  );
}
