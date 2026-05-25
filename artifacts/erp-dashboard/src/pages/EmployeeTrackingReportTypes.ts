// i18next — employee tracking label data resolved at runtime

import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module EmployeeTrackingReportTypes
 * @description Types, interfaces, translations, and constants for EmployeeTrackingReport.
 */

// ── Language ──────────────────────────────────────────────────────────────────

export type Language = "uz" | "uz-cyr" | "ru";

// ── Domain interfaces ─────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  totalMinutes: number;
  workZoneMinutes: number;
  restZoneMinutes: number;
  detectionCount: number;
  status: string;
}

export interface ZoneHistory {
  id: string;
  userId: string;
  cameraId: string;
  zoneName: string;
  trackingDate: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  visitCount: number;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  photoUrl?: string;
}

// ── Translations ──────────────────────────────────────────────────────────────

export const translations = {
  uz: {
    title: tLabel('common.EmployeeTrackingReport.xodimlarKuzatuviHisoboti', "Xodimlar Kuzatuvi Hisoboti"),
    subtitle: "Zona va vaqt statistikasi",
    dailyAttendance: "Kunlik Davomad",
    weeklyStats: "Haftalik Statistika",
    zoneActivity: "Zona Faolligi",
    employeeDetails: "Xodim Ma'lumotlari",
    selectDate: "Sanani tanlang",
    selectEmployee: "Xodimni tanlang",
    allEmployees: "Barcha xodimlar",
    employee: "Xodim",
    firstSeen: "Birinchi ko'rilgan",
    lastSeen: "Oxirgi ko'rilgan",
    totalTime: "Jami vaqt",
    workZone: "Ish zonasi",
    restZone: "Dam olish",
    detections: "Aniqlashlar",
    status: "Holat",
    present: "Kelgan",
    absent: "Kelmagan",
    late: "Kechikkan",
    zone: "Zona",
    entryTime: "Kirish",
    exitTime: "Chiqish",
    duration: "Davomiylik",
    visits: "Tashriflar",
    hours: "soat",
    minutes: "daqiqa",
    noData: "Ma'lumot topilmadi",
    loading: "Yuklanmoqda...",
    today: "Bugun",
    thisWeek: "Bu hafta",
    thisMonth: "Bu oy",
    avgTimePerDay: "Kunlik o'rtacha vaqt",
    mostActiveZone: "Eng faol zona",
    totalDetections: "Jami aniqlashlar",
    presentEmployees: "Kelgan xodimlar",
    zoneDistribution: "Zona taqsimoti",
    timeTracking: "Vaqt kuzatuvi",
    productivity: "Samaradorlik",
  },
  'uz-cyr': {
    title: tLabel('common.EmployeeTrackingReport.xodimlarKuzatuviHisoboti', "Ходимлар Кузатуви Ҳисоботи"),
    subtitle: "Зона ва вақт статистикаси",
    dailyAttendance: "Кунлик Давомад",
    weeklyStats: "Ҳафталик Статистика",
    zoneActivity: "Зона Фаоллиги",
    employeeDetails: "Ходим Маълумотлари",
    selectDate: "Санани танланг",
    selectEmployee: "Ходимни танланг",
    allEmployees: "Барча ходимлар",
    employee: "Ходим",
    firstSeen: "Биринчи кўрилган",
    lastSeen: "Охирги кўрилган",
    totalTime: "Жами вақт",
    workZone: "Иш зонаси",
    restZone: "Дам олиш",
    detections: "Аниқлашлар",
    status: "Ҳолат",
    present: "Келган",
    absent: "Келмаган",
    late: "Кечиккан",
    zone: "Зона",
    entryTime: "Кириш",
    exitTime: "Чиқиш",
    duration: "Давомийлик",
    visits: "Ташрифлар",
    hours: "соат",
    minutes: "дақиқа",
    noData: "Маълумот топилмади",
    loading: "Юкланмоқда...",
    today: "Бугун",
    thisWeek: "Бу ҳафта",
    thisMonth: "Бу ой",
    avgTimePerDay: "Кунлик ўртача вақт",
    mostActiveZone: "Енг фаол зона",
    totalDetections: "Жами аниқлашлар",
    presentEmployees: "Келган ходимлар",
    zoneDistribution: "Зона тақсимоти",
    timeTracking: "Вақт кузатуви",
    productivity: "Самарадорлик",
  },
  ru: {
    title: tLabel('common.EmployeeTrackingReport.untitled', "Отчёт по Отслеживанию Сотрудников"),
    subtitle: tLabel('common.EmployeeTrackingReport.untitled', "Статистика зон и времени"),
    dailyAttendance: "Ежедневная Посещаемость",
    weeklyStats: "Недельная Статистика",
    zoneActivity: "Активность Зон",
    employeeDetails: "Данные Сотрудника",
    selectDate: "Выберите дату",
    selectEmployee: "Выберите сотрудника",
    allEmployees: "Все сотрудники",
    employee: "Сотрудник",
    firstSeen: "Первое появление",
    lastSeen: "Последнее появление",
    totalTime: "Общее время",
    workZone: "Рабочая зона",
    restZone: "Отдых",
    detections: "Обнаружения",
    status: "Статус",
    present: "Присутствует",
    absent: "Отсутствует",
    late: "Опоздал",
    zone: "Зона",
    entryTime: "Вход",
    exitTime: "Выход",
    duration: "Длительность",
    visits: "Посещения",
    hours: "часов",
    minutes: "минут",
    noData: "Данные не найдены",
    loading: "Загрузка...",
    today: "Сегодня",
    thisWeek: "Эта неделя",
    thisMonth: "Этот месяц",
    avgTimePerDay: "Среднее время в день",
    mostActiveZone: "Самая активная зона",
    totalDetections: "Всего обнаружений",
    presentEmployees: "Присутствующие сотрудники",
    zoneDistribution: "Распределение зон",
    timeTracking: "Отслеживание времени",
    productivity: "Продуктивность",
  },
} as const;

export type Translations = typeof translations.uz;

// ── Constants ─────────────────────────────────────────────────────────────────

export const ZONE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
