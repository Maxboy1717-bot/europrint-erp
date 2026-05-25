
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module FaceRecognitionMonitoringTypes
 * @description Types and label constants for FaceRecognitionMonitoring.
 */

export interface RecognitionStats {
  total: number;
  successful: number;
  failed: number;
  falsePositives: number;
  falseNegatives: number;
  avgConfidence: number;
  accuracy: number;
  dailyStats: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    falsePositives: number;
    falseNegatives: number;
  }>;
}

export interface RecognitionLog {
  id: string;
  cameraId: string | null;
  zoneId: string | null;
  employeeId: string | null;
  isRecognized: boolean;
  confidence: number;
  faceImageUrl: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  flaggedAs: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
  employeeName: string | null;
  cameraName: string | null;
}

export const labels = {
  uz: {
    title: "Yuz aniqlash monitoring",
    totalRecognitions: "Jami aniqlashlar",
    successful: "Muvaffaqiyatli",
    failed: "Muvaffaqiyatsiz",
    falsePositives: "Yolg'on ijobiy",
    falseNegatives: "Yolg'on salbiy",
    avgConfidence: "O'rtacha ishonchlilik",
    accuracy: "Aniqlik",
    recentLogs: "So'nggi loglar",
    chartTitle: "Aniqlash statistikasi (7 kun)",
    filterByStatus: "Status bo'yicha",
    all: "Barchasi",
    recognized: "Aniqlangan",
    unrecognized: "Aniqlanmagan",
    flagged: "Belgilangan",
    flag: "Belgilash",
    unflag: "Bekor qilish",
    markAsCorrect: "To'g'ri",
    markAsFalsePositive: "Yolg'on ijobiy",
    markAsFalseNegative: "Yolg'on salbiy",
    employee: "Xodim",
    camera: "Kamera",
    confidence: "Ishonchlilik",
    time: "Vaqt",
    status: "Holat",
    actions: "Harakatlar",
    unknown: "Noma'lum",
    noLogs: "Loglar topilmadi",
    flagSuccess: "Muvaffaqiyatli belgilandi",
    flagError: "Belgilashda xato",
  },
  ru: {
    title: tLabel('common.FaceRecognitionMonitoring.untitled', "Мониторинг распознавания лиц"),
    totalRecognitions: "Всего распознаваний",
    successful: "Успешные",
    failed: "Неуспешные",
    falsePositives: "Ложноположительные",
    falseNegatives: "Ложноотрицательные",
    avgConfidence: "Средняя достоверность",
    accuracy: "Точность",
    recentLogs: "Последние логи",
    chartTitle: "Статистика распознавания (7 дней)",
    filterByStatus: "По статусу",
    all: "Все",
    recognized: "Распознанные",
    unrecognized: "Нераспознанные",
    flagged: "Отмеченные",
    flag: "Отметить",
    unflag: "Снять отметку",
    markAsCorrect: "Верно",
    markAsFalsePositive: "Ложноположительный",
    markAsFalseNegative: "Ложноотрицательный",
    employee: "Сотрудник",
    camera: "Камера",
    confidence: "Достоверность",
    time: "Время",
    status: "Статус",
    actions: "Действия",
    unknown: "Неизвестен",
    noLogs: "Логи не найдены",
    flagSuccess: "Успешно отмечено",
    flagError: "Ошибка при отметке",
  },
} as const;

export type Lang = keyof typeof labels;
export type Labels = typeof labels[Lang];
