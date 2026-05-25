
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module camera-heatmap-types
 * @description Interfaces, types, and constants for the Camera Heatmap page.
 *              No JSX — pure TypeScript only.
 */

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
  zone: string;
  violations: number;
}

export interface Zone {
  id: string;
  name: string;
  nameRu: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeatmapData {
  zones: Zone[];
  heatmapData: HeatmapCell[];
  period: string;
  metric: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  time: string;
  zone: string;
}

export interface ZoneStat {
  zone: string;
  zoneName: string;
  duration: number;
  percentage: number;
}

export interface EmployeeHeatmapData {
  employee: Employee;
  trajectory: TrajectoryPoint[];
  zoneStats: ZoneStat[];
  totalActiveTime: number;
  totalIdleTime: number;
  violations: number;
  productivity: number;
}

export interface ZoneActivity {
  zone: string;
  visits: number;
  totalDuration: number;
  avgDuration: number;
}

export interface Department {
  id: string;
  name: string;
  nameRu: string;
}

export interface ZoneActivityResponse {
  department: Department;
  zoneActivities: ZoneActivity[];
}

// ---------------------------------------------------------------------------
// Derived / view types
// ---------------------------------------------------------------------------

export interface ZoneWithColor extends Zone {
  /** Resolved display name (uz or ru depending on selected language) */
  name: string;
  /** Tailwind bg-* class for the zone dot */
  color: string;
}

// ---------------------------------------------------------------------------
// Union literal types
// ---------------------------------------------------------------------------

export type Language = "uz" | "ru";
export type Period = "today" | "week" | "month";
export type Metric = "movement" | "violations" | "productivity";
export type ViewMode = "general" | "employee" | "zone";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ZONE_COLORS: Record<string, string> = {
  production: "bg-blue-500",
  warehouse:  "bg-green-500",
  loading:    "bg-yellow-500",
  office:     "bg-purple-500",
};

/** Static time-slot data used in the general view "By Time" card. */
export const TIME_SLOTS: [string, number][] = [
  ["08:00-10:00", 0.65],
  ["10:00-12:00", 0.82],
  ["12:00-14:00", 0.48],
  ["14:00-16:00", 0.87],
  ["16:00-18:00", 0.71],
];

// ---------------------------------------------------------------------------
// i18n translations map
// ---------------------------------------------------------------------------

export type Translations = typeof UZ_TRANSLATIONS;

export const UZ_TRANSLATIONS = {
  title:             "Issiqlik Xaritasi",
  subtitle:          tLabel('common.camera-heatmap-.ishlabChiqarishMaydonidaFaollikVizualizatsiyasi', "Ishlab chiqarish maydonida faollik vizualizatsiyasi"),
  back:              "Orqaga",
  today:             "Bugun",
  week:              "Hafta",
  month:             "Oy",
  movement:          "Harakat",
  violations:        "Buzilishlar",
  productivity:      "Samaradorlik",
  legend:            "Izoh",
  low:               "Past",
  medium:            "O'rta",
  high:              "Yuqori",
  zones:             "Zonalar",
  production:        "Ishlab chiqarish",
  warehouse:         "Ombor",
  loading:           "Yuklash",
  office:            "Ofis",
  hotspots:          "Faol nuqtalar",
  generalView:       "Umumiy ko'rinish",
  employeeView:      "Xodim bo'yicha",
  zoneActivityView:  "Bo'lim bo'yicha",
  selectEmployee:    "Xodimni tanlang",
  selectDepartment:  "Bo'limni tanlang",
  trajectory:        "Harakat traektoriyasi",
  timeInZones:       "Zonalarda o'tkazgan vaqt",
  activeTime:        "Faol vaqt",
  idleTime:          "Bo'sh vaqt",
  productivityScore: "Samaradorlik balli",
  minutes:           "daqiqa",
  noEmployee:        "Xodim tanlanmagan",
  noDepartment:      "Bo'lim tanlanmagan",
  zoneActivity:      "Bo'lim bo'yicha faollik",
  zoneName:          "Zona nomi",
  visits:            "Tashrif",
  duration:          "Davomiyliq",
  avgDuration:       "O'rtacha davomiyliq",
  byTime:            "Vaqt bo'yicha",
  totalVisits:       "Jami tashrif",
  totalTime:         "Jami vaqt",
  avgTime:           "O'rtacha vaqt",
  statistics:        "Statistika",
  mapDescription:    "Ishlab chiqarish maydonidagi faollik xaritasi",
};

export const RU_TRANSLATIONS: Translations = {
  title:             tLabel('common.camera-heatmap-.untitled', "Тепловая карта"),
  subtitle:          tLabel('common.camera-heatmap-.untitled', "Визуализация активности на производстве"),
  back:              "Назад",
  today:             "Сегодня",
  week:              "Неделя",
  month:             "Месяц",
  movement:          "Движение",
  violations:        "Нарушения",
  productivity:      "Производительность",
  legend:            "Легенда",
  low:               "Низкая",
  medium:            "Средняя",
  high:              "Высокая",
  zones:             "Зоны",
  production:        "Производство",
  warehouse:         "Склад",
  loading:           "Погрузка",
  office:            "Офис",
  hotspots:          "Горячие точки",
  generalView:       "Общий вид",
  employeeView:      "По сотруднику",
  zoneActivityView:  "По зонам",
  selectEmployee:    "Выберите сотрудника",
  selectDepartment:  "Выберите отдел",
  trajectory:        "Траектория движения",
  timeInZones:       "Время в зонах",
  activeTime:        "Активное время",
  idleTime:          "Время простоя",
  productivityScore: "Балл производительности",
  minutes:           "минут",
  noEmployee:        "Сотрудник не выбран",
  noDepartment:      "Отдел не выбран",
  zoneActivity:      "Активность по зонам",
  zoneName:          "Название зоны",
  visits:            "Посещения",
  duration:          "Продолжительность",
  avgDuration:       "Средняя длительность",
  byTime:            "По времени",
  totalVisits:       "Всего посещений",
  totalTime:         "Общее время",
  avgTime:           "Среднее время",
  statistics:        "Статистика",
  mapDescription:    "Карта активности производственной площади",
};

// ---------------------------------------------------------------------------
// Pure helpers (no React dependency)
// ---------------------------------------------------------------------------

/**
 * Returns a Tailwind bg-* class based on 0–1 intensity value.
 */
export function getIntensityColor(intensity: number): string {
  if (intensity < 0.3)  return "bg-green-200";
  if (intensity < 0.5)  return "bg-yellow-200";
  if (intensity < 0.7)  return "bg-orange-300";
  if (intensity < 0.85) return "bg-red-400";
  return "bg-red-600";
}
