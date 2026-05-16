/**
 * @module ReportsHubTypes
 * @description TypeScript interfaces, types, and constants for ReportsHub.
 * No JSX — pure types and data only.
 */

import {
  FileText,
  TrendingUp,
  GraduationCap,
  ShoppingCart,
  Factory,
  Package,
  Landmark,
  Users,
  UserCheck,
  Warehouse as WarehouseIcon,
  Shield,
  Megaphone,
  Cpu,
  Camera,
} from "lucide-react";
import type { AiReportCategory } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

export const iconMap: Record<string, typeof FileText> = {
  GraduationCap,
  ShoppingCart,
  Factory,
  Package,
  Landmark,
  Users,
  UserCheck,
  Warehouse: WarehouseIcon,
  Shield,
  Megaphone,
  Cpu,
  Camera,
  TrendingUp,
};

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

export const t = {
  uz: {
    title: tLabel('common.ReportsHub.hisobotlarMarkazi', "Hisobotlar markazi"),
    subtitle: "155+ avtomatlashtirilgan hisobotlarni boshqarish",
    totalReports: "Jami hisobotlar",
    runsToday: "Bugungi ishga tushirishlar",
    insightsGenerated: "Yaratilgan tahlillar",
    activeSubscriptions: "Faol obunalar",
    categories: "Kategoriyalar",
    reports: "Hisobotlar",
    recentRuns: "So'nggi ishga tushirishlar",
    subscriptions: "Obunalar",
    seedButton: "155+ hisobotlarni yaratish",
    seeding: "Yaratilmoqda...",
    generate: "Ishga tushirish",
    generating: "Ishga tushirilmoqda...",
    subscribe: "Obuna bo'lish",
    unsubscribe: "Obunadan chiqish",
    name: tLabel('common.ReportsHub.nomi', "Nomi"),
    module: "Modul",
    frequency: "Chastota",
    lastRun: "Oxirgi ishga tushirish",
    status: "Holat",
    actions: "Amallar",
    reportCount: "hisobot",
    noReports: "Hisobotlar topilmadi",
    noRuns: "Ishga tushirishlar topilmadi",
    noSubscriptions: "Obunalar topilmadi",
    back: "Orqaga",
    completed: "Yakunlangan",
    running: "Ishlayapti",
    failed: "Xatolik",
    pending: "Kutilmoqda",
    daily: "Kunlik",
    weekly: "Haftalik",
    monthly: "Oylik",
    realtime: "Real vaqt",
    active: "Faol",
    inactive: "Nofaol",
    generateSuccess: "Hisobot muvaffaqiyatli ishga tushirildi",
    subscribeSuccess: "Obuna muvaffaqiyatli yaratildi",
    unsubscribeSuccess: "Obuna bekor qilindi",
    seedSuccess: "Hisobotlar muvaffaqiyatli yaratildi",
    error: "Xatolik yuz berdi",
    loading: "Yuklanmoqda...",
    runId: "ID",
    report: "Hisobot",
    startedAt: "Boshlangan",
    duration: "Davomiyligi",
    channel: "Kanal",
    schedule: "Jadval",
  },
  ru: {
    title: tLabel('common.ReportsHub.untitled', "Центр отчётов"),
    subtitle: "Управление 155+ автоматизированными отчётами",
    totalReports: "Всего отчётов",
    runsToday: "Запусков сегодня",
    insightsGenerated: "Сгенерировано аналитик",
    activeSubscriptions: "Активных подписок",
    categories: "Категории",
    reports: "Отчёты",
    recentRuns: "Последние запуски",
    subscriptions: "Подписки",
    seedButton: "Создать 155+ отчётов",
    seeding: "Создаётся...",
    generate: "Запустить",
    generating: "Запускается...",
    subscribe: "Подписаться",
    unsubscribe: "Отписаться",
    name: tLabel('common.ReportsHub.untitled', "Название"),
    module: "Модуль",
    frequency: "Частота",
    lastRun: "Последний запуск",
    status: "Статус",
    actions: "Действия",
    reportCount: "отчётов",
    noReports: "Отчёты не найдены",
    noRuns: "Запуски не найдены",
    noSubscriptions: "Подписки не найдены",
    back: "Назад",
    completed: "Завершён",
    running: "Выполняется",
    failed: "Ошибка",
    pending: "Ожидание",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    realtime: "Реальное время",
    active: "Активен",
    inactive: "Неактивен",
    generateSuccess: "Отчёт успешно запущен",
    subscribeSuccess: "Подписка успешно создана",
    unsubscribeSuccess: "Подписка отменена",
    seedSuccess: "Отчёты успешно созданы",
    error: "Произошла ошибка",
    loading: "Загрузка...",
    runId: "ID",
    report: "Отчёт",
    startedAt: "Начат",
    duration: "Длительность",
    channel: "Канал",
    schedule: "Расписание",
  },
} as const;

export type Lang = keyof typeof t;
export type Translations = (typeof t)[Lang];

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

export interface DashboardData {
  totalReports: number;
  runsToday: number;
  insightsGenerated: number;
  activeSubscriptions: number;
  categories: AiReportCategory[];
}
