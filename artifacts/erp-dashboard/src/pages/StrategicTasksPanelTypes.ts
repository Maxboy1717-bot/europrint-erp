/**
 * @module StrategicTasksPanelTypes
 * @description Types, interfaces, and constants for StrategicTasksPanel.
 */

import type { StrategicTask, StrategicCategory } from "@shared/schema";

export const STATUS_OPTIONS = [
  { value: "planned", label: "Rejalashtirilgan", labelRu: "Запланировано", color: "bg-slate-500/20 text-muted-foreground dark:text-muted-foreground" },
  { value: "in_progress", label: "Jarayonda", labelRu: "В процессе", color: "bg-blue-500/20 text-[var(--ep-blue)] dark:text-blue-400" },
  { value: "testing", label: "Sinovda", labelRu: "Тестирование", color: "bg-purple-500/20 text-[var(--ep-purple)] dark:text-purple-400" },
  { value: "completed", label: "Bajarildi", labelRu: "Завершено", color: "bg-green-500/20 text-[var(--ep-green)] dark:text-green-400" },
  { value: "on_hold", label: "Kutilmoqda", labelRu: "На паузе", color: "bg-yellow-500/20 text-[var(--ep-yellow)] dark:text-yellow-400" },
  { value: "cancelled", label: "Bekor qilingan", labelRu: "Отменено", color: "bg-red-500/20 text-[var(--ep-red)] dark:text-red-400" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Past", labelRu: "Низкий", color: "bg-blue-500/20 text-[var(--ep-blue)] dark:text-blue-400" },
  { value: "medium", label: "O'rta", labelRu: "Средний", color: "bg-yellow-500/20 text-[var(--ep-yellow)] dark:text-yellow-400" },
  { value: "high", label: "Yuqori", labelRu: "Высокий", color: "bg-orange-500/20 text-[var(--ep-primary)] dark:text-orange-400" },
  { value: "critical", label: "Kritik", labelRu: "Критический", color: "bg-red-500/20 text-[var(--ep-red)] dark:text-red-400" },
];

export type TaskWithCategory = StrategicTask & {
  categoryName?: string | null;
  categoryCode?: string | null;
  categoryColor?: string | null;
};

export type DashboardData = {
  totalTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byPhase: Record<string, number>;
  completedCount: number;
  completionRate: number;
  overdueCount: number;
};

export type CategoriesResponse = {
  count: number;
  categories: StrategicCategory[];
};

export type TasksResponse = {
  count: number;
  tasks: TaskWithCategory[];
};
