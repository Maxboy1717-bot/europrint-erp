/**
 * @module kanban-types
 * @description React page component. Route-level UI.
 */

import { format, isToday, isBefore, isThisWeek, addWeeks, startOfDay, endOfWeek } from "date-fns";
import { Image, FileVideo, FileText, FileSpreadsheet, File } from "lucide-react";
import type {
  KanbanBoard as KanbanBoardType,
  KanbanColumn,
  KanbanCard,
  TaskChecklist,
  TaskChecklistItem,
  TaskTag,
  TaskResult,
  TaskResultFile,
  TaskChatMessage,
  TaskTimeTrack,
} from "@shared/schema";

export interface ResultWithFiles extends TaskResult {
  creator?: { id: string; fullName: string };
  files: TaskResultFile[];
}

export const T = {
  uz: {
    views: { kanban: "Kanban", list: "Ro'yxat", deadlines: "Muddatlar", myPlan: "Mening rejam", calendar: "Kalendar", gantt: "Gant", dashboard: "Dashboard", allocation: "Resurslar" },
    flows: { title: "Potoklar", addFlow: "Poток qo'shish", name: "Nomi", type: "Turi", users: "Foydalanuvchilar", roundRobin: "Navbat bilan", leastBusy: "Eng kam bandga", random: "Tasodifiy", noFlows: "Potoklar yo'q", selectUsers: "Foydalanuvchilarni tanlang", assign: "Tayinlash" },
    allocation: { title: "Resurs taqsimoti", employee: "Xodim", today: "Bugun", thisWeek: "Bu hafta", thisMonth: "Bu oy", total: "Jami", noData: "Ma'lumotlar yo'q" },
    create: { task: "Vazifa", project: "Loyiha", template: "Shablon", createNew: "Yaratish" },
    roles: { all: "Barcha rollar", executor: "Men ijrochi", creator: "Men qo'yuvchi sifatida" },
    filters: { overdue: "Kechikkanlar", newComments: "Yangi kommentlar", filter: "Filtr", clear: "Tozalash" },
    columns: { overdue: "Kechikkan", today: "Bugun", thisWeek: "Bu hafta", nextWeek: "Keyingi hafta", noDeadline: "Muddatsiz" },
    priority: { urgent: "Kritik", high: "Yuqori", normal: "O'rtacha", low: "Past" },
    tabs: { main: "Asosiy", checklist: "Chek-list", results: "Natijalar", files: "Fayllar", activity: "Faoliyat" },
    fields: { title: "Sarlavha", description: "Tavsif", deadline: "Muddat", assignee: "Ijrochi", priority: "Ustuvorlik", tags: "Teglar", project: "Loyiha", observers: "Kuzatuvchilar", coExecutors: "Hamijrochilar" },
    table: { taskName: "Vazifa nomi", activity: "Faoliyat", deadline: "Muddat", creator: "Qo'yuvchi", assignee: "Ijrochi", project: "Loyiha", status: "Status" },
    actions: { save: "Saqlash", cancel: "Bekor qilish", delete: "O'chirish", add: "Qo'shish", send: "Yuborish", upload: "Yuklash", start: "Boshlash", stop: "To'xtatish" },
    notifications: { title: "Bildirishnomalar", markAllRead: "Barchasini o'qilgan", empty: "Bildirishnomalar yo'q", categories: "Kategoriyalar", allCategory: "Hammasi", taskCategory: "Vazifalar", reminderCategory: "Eslatmalar", automationCategory: "Avtomatik", items: "ta" },
    robots: { title: "Avtomatlashtirish robotlari", addRobot: "Robot qo'shish", trigger: "Trigger", action: "Harakat", onCreate: "Yaratilganda", onMove: "Ko'chirilganda", onComplete: "Tugallanganda", onDeadline: "Muddat kelganda", moveToColumn: "Ustun ko'chirish", sendNotification: "Bildirishnoma yuborish", assignUser: "Foydalanuvchi tayinlash", addTag: "Teg qo'shish" },
    templates: { title: "Shablonlar", name: "Shablon nomi", taskTitle: "Vazifa sarlavhasi", search: "Qidirish", empty: "Shablonlar yo'q", createNew: "Yangi shablon", edit: "Tahrirlash", apply: "Qo'llash" },
    empty: { selectBoard: "Doska tanlang", createBoard: "Yangi doska yaratish", noTasks: "Vazifalar topilmadi" },
    time: { tracking: "Vaqt kuzatuvi", target: "Maqsad", total: "Jami" },
    chat: { placeholder: "Xabar yozing... @ bilan eslatish", systemLog: "Tizim logi", mentionHint: "@ belgisi bilan foydalanuvchini eslatish" },
    board: { newBoard: "Yangi doska", newColumn: "Yangi ustun", newCard: "Yangi vazifa", addCard: "Karta qo'shish" },
    baskets: { title: "3 Savat Tizimi", incoming: "Kiruvchi savat", pending: "Kutish savati", outgoing: "Chiquvchi savat", moveToPending: "Ishlovga o'tkazish", moveToOutgoing: "Chiqishga o'tkazish", moveToIncoming: "← Kiruvchiga", archive: "Arxivlash", rule24h: "Kiruvchi 24 soatdan ko'p turmasligi kerak", overdueLabel: "Muddati o'tgan", empty: "Bo'sh" }
  },
  ru: {
    views: { kanban: "Канбан", list: "Список", deadlines: "Сроки", myPlan: "Мой план", calendar: "Календарь", gantt: "Гант", dashboard: "Дашборд", allocation: "Ресурсы" },
    flows: { title: "Потоки", addFlow: "Добавить поток", name: "Название", type: "Тип", users: "Пользователи", roundRobin: "По очереди", leastBusy: "Наименее занятому", random: "Случайно", noFlows: "Нет потоков", selectUsers: "Выберите пользователей", assign: "Назначить" },
    allocation: { title: "Распределение ресурсов", employee: "Сотрудник", today: "Сегодня", thisWeek: "Эта неделя", thisMonth: "Этот месяц", total: "Всего", noData: "Нет данных" },
    create: { task: "Задача", project: "Проект", template: "Шаблон", createNew: "Создать" },
    roles: { all: "Все роли", executor: "Я исполнитель", creator: "Я постановщик" },
    filters: { overdue: "Просроченные", newComments: "Новые комментарии", filter: "Фильтр", clear: "Очистить" },
    columns: { overdue: "Просрочено", today: "Сегодня", thisWeek: "На этой неделе", nextWeek: "На следующей неделе", noDeadline: "Без срока" },
    priority: { urgent: "Критичный", high: "Высокий", normal: "Средний", low: "Низкий" },
    tabs: { main: "Основное", checklist: "Чек-лист", results: "Результаты", files: "Файлы", activity: "Активность" },
    fields: { title: "Заголовок", description: "Описание", deadline: "Срок", assignee: "Исполнитель", priority: "Приоритет", tags: "Теги", project: "Проект", observers: "Наблюдатели", coExecutors: "Соисполнители" },
    table: { taskName: "Название задачи", activity: "Активность", deadline: "Срок", creator: "Постановщик", assignee: "Исполнитель", project: "Проект", status: "Статус" },
    actions: { save: "Сохранить", cancel: "Отмена", delete: "Удалить", add: "Добавить", send: "Отправить", upload: "Загрузить", start: "Начать", stop: "Остановить" },
    notifications: { title: "Уведомления", markAllRead: "Прочитано", empty: "Нет уведомлений", categories: "Категории", allCategory: "Все", taskCategory: "Задачи", reminderCategory: "Напоминания", automationCategory: "Автоматика", items: "шт" },
    robots: { title: "Роботы автоматизации", addRobot: "Добавить робота", trigger: "Триггер", action: "Действие", onCreate: "При создании", onMove: "При перемещении", onComplete: "При завершении", onDeadline: "При наступлении срока", moveToColumn: "Переместить в колонку", sendNotification: "Отправить уведомление", assignUser: "Назначить пользователя", addTag: "Добавить тег" },
    templates: { title: "Шаблоны", name: "Название шаблона", taskTitle: "Заголовок задачи", search: "Поиск", empty: "Нет шаблонов", createNew: "Новый шаблон", edit: "Редактировать", apply: "Применить" },
    empty: { selectBoard: "Выберите доску", createBoard: "Создать новую доску", noTasks: "Задачи не найдены" },
    time: { tracking: "Учёт времени", target: "Цель", total: "Всего" },
    chat: { placeholder: "Напишите сообщение... @ для упоминания", systemLog: "Системный лог", mentionHint: "Используйте @ для упоминания пользователей" },
    board: { newBoard: "Новая доска", newColumn: "Новая колонка", newCard: "Новая задача", addCard: "Добавить карточку" },
    baskets: { title: "Система 3-х корзин", incoming: "Входящая корзина", pending: "Корзина ожидания", outgoing: "Исходящая корзина", moveToPending: "В обработку", moveToOutgoing: "В исходящую", moveToIncoming: "← Входящая", archive: "В архив", rule24h: "Входящие не должны оставаться более 24 часов", overdueLabel: "Просрочено", empty: "Пусто" }
  }
};

export type Lang = "uz" | "ru";

export type CardWithOwner = KanbanCard & {
  id: string;
  title: string;
  priority?: string;
  columnId: string;
  relatedId?: string;
  dueDate?: string;
  owner?: { id: string; fullName: string; profileImageUrl?: string | null } | null;
  creator?: { id: string; fullName: string; profileImageUrl?: string | null } | null;
  subtasksCount?: number;
  subtasksCompleted?: number;
  commentsCount?: number;
  filesCount?: number;
  checklistProgress?: number;
  tags?: TaskTag[];
  activeTimeTrack?: TaskTimeTrack | null;
  totalTrackedTime?: number;
  targetTime?: number;
  estimatedTime?: number;
  status?: string;
  parentCardId?: string | null;
  projectId?: string | null;
};

export type CommentWithUser = {
  id: string;
  cardId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user?: { id: string; fullName: string; profileImageUrl?: string | null } | null;
};

export type ChatFileInfo = {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
};

export type ChatMessageWithUser = TaskChatMessage & {
  user?: { id: string; fullName: string; profileImageUrl?: string | null } | null;
  files?: ChatFileInfo[];
};

export type ChecklistWithItems = TaskChecklist & {
  items: TaskChecklistItem[];
};

export type ObserverWithUser = {
  id: string;
  cardId: string;
  userId: string;
  addedById: string | null;
  createdAt: string;
  user: { id: string; fullName: string; profileImageUrl?: string | null };
};

export type CoExecutorWithUser = {
  id: string;
  cardId: string;
  userId: string;
  addedById: string | null;
  createdAt: string;
  user: { id: string; fullName: string; profileImageUrl?: string | null };
};

export type BoardWithData = KanbanBoardType & {
  columns: KanbanColumn[];
  cards: CardWithOwner[];
};

export type Employee = {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
};

export type ViewMode = "kanban" | "list" | "deadlines" | "myPlan" | "calendar" | "gantt" | "dashboard" | "allocation";
export type RoleFilter = "all" | "executor" | "creator";

export type FilterState = {
  search: string;
  columnId: string | null;
  priority: string | null;
  assigneeId: string | null;
  overdue: boolean;
  hasNewComments: boolean;
  tagId: string | null;
  tagName: string | null;
};

export type KanbanTemplate = {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  priority: string;
  createdAt?: string | null;
};

export type NotificationCategory = "all" | "task" | "reminder" | "automation";

export type EmployeePerformance = {
  user: { id: string; fullName: string; profileImageUrl: string | null };
  totalTasks: number;
  totalTimeMinutes: number;
  totalResults: number;
};

export type TeamMetrics = {
  totalTasks: number;
  overdueTasks: number;
  thisWeekTasks: number;
  unassignedTasks: number;
  todayTimeMinutes: number;
};

export type TaskStats = {
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    acceptedNotCompleted: number;
    telegramTasks: number;
    overdueTasks: number;
    completionRate: number;
    avgCompletionDays: number;
  };
  weeklyTrend: { date: string; dayName: string; created: number; completed: number }[];
  timeTracking: { totalTrackedMinutes: number; totalTrackedHours: number };
  employeeStats: { userId: string; assigned: number; completed: number; onTime: number; late: number; avgCompletionTime: number }[];
};

export type AllocationData = {
  user: { id: string; fullName: string; profileImageUrl?: string | null };
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
};

export type TaskFlowWithUsers = {
  id: string;
  name: string;
  boardId: string | null;
  assignmentType: string;
  userIds: string[] | null;
  lastAssignedIndex: number;
  isActive: boolean;
  createdAt: string;
  users: { id: string; fullName: string; profileImageUrl?: string | null }[];
};

export const PRIORITY_CONFIG = {
  urgent: { color: "bg-red-500/20 text-red-400 border-red-500/40", dotColor: "bg-red-500" },
  high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/40", dotColor: "bg-orange-500" },
  normal: { color: "bg-blue-500/20 text-blue-400 border-blue-500/40", dotColor: "bg-blue-500" },
  low: { color: "bg-green-500/20 text-green-400 border-green-500/40", dotColor: "bg-green-500" },
};

export const DEADLINE_COLUMNS = {
  overdue: { color: "bg-red-50 dark:bg-red-950/30", headerBg: "bg-red-500", headerText: "text-white" },
  today: { color: "bg-lime-50 dark:bg-lime-950/30", headerBg: "from-lime-400 to-yellow-400", headerText: "text-gray-900" },
  thisWeek: { color: "bg-emerald-50 dark:bg-emerald-950/30", headerBg: "bg-emerald-500", headerText: "text-white" },
  nextWeek: { color: "bg-sky-50 dark:bg-sky-950/30", headerBg: "bg-blue-500", headerText: "text-white" },
  noDeadline: { color: "bg-gray-50 dark:bg-gray-900/30", headerBg: "bg-slate-500", headerText: "text-white" },
};

export type KanbanTranslations = typeof T.uz;

export const TAG_COLORS = [
  "bg-purple-500/20 text-purple-400 border-purple-500/40",
  "bg-pink-500/20 text-pink-400 border-pink-500/40",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  "bg-amber-500/20 text-amber-400 border-amber-500/40",
];

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimeShort(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatTimeHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const UZBEK_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"
];

export const UZBEK_WEEKDAYS = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"
];

export const STATUS_BADGES = {
  in_progress: { label: { uz: "Bajarilmoqda", ru: "В процессе" }, color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  waiting: { label: { uz: "Kutilmoqda", ru: "Ожидание" }, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  completed: { label: { uz: "Bajarildi", ru: "Завершено" }, color: "bg-green-500/20 text-green-400 border-green-500/40" },
  cancelled: { label: { uz: "Bekor qilindi", ru: "Отменено" }, color: "bg-gray-500/20 text-gray-400 border-gray-500/40" },
  active: { label: { uz: "Faol", ru: "Активно" }, color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

export function formatChatDateSeparator(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const weekday = UZBEK_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = UZBEK_MONTHS[date.getMonth()];
  return `${weekday}, ${day} ${month}`;
}

export function getDateKey(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return format(date, "yyyy-MM-dd");
}

export function formatDeadlineUzbek(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = UZBEK_MONTHS[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${hours}:${mins}`;
}

export function getDeadlineCategory(dueDate: string | null): keyof typeof DEADLINE_COLUMNS {
  if (!dueDate) return "noDeadline";
  const date = new Date(dueDate);
  const today = startOfDay(new Date());
  if (isBefore(date, today)) return "overdue";
  if (isToday(date)) return "today";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "thisWeek";
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  if (isBefore(date, nextWeekEnd)) return "nextWeek";
  return "noDeadline";
}

export function getFileIcon(mimeType: string | null, fileName: string) {
  if (!mimeType) {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return { icon: Image, color: "text-[var(--ep-green)]" };
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return { icon: FileVideo, color: "text-[var(--ep-purple)]" };
    if (['pdf'].includes(ext)) return { icon: FileText, color: "text-[var(--ep-red)]" };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: "text-[var(--ep-green)]" };
    if (['doc', 'docx', 'txt'].includes(ext)) return { icon: FileText, color: "text-[var(--ep-blue)]" };
    return { icon: File, color: "text-muted-foreground" };
  }
  if (mimeType.startsWith('image/')) return { icon: Image, color: "text-[var(--ep-green)]" };
  if (mimeType.startsWith('video/')) return { icon: FileVideo, color: "text-[var(--ep-purple)]" };
  if (mimeType === 'application/pdf') return { icon: FileText, color: "text-[var(--ep-red)]" };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { icon: FileSpreadsheet, color: "text-[var(--ep-green)]" };
  if (mimeType.includes('document') || mimeType.includes('word')) return { icon: FileText, color: "text-[var(--ep-blue)]" };
  return { icon: File, color: "text-muted-foreground" };
}

export function isImageFile(mimeType: string | null, fileName: string): boolean {
  if (mimeType?.startsWith('image/')) return true;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}
