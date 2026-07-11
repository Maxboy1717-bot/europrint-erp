/**
 * @module notification-icon.util
 * @description #111 (Notifications-18) — bitta sof funksiya: {type, priority} → icon/emoji.
 *   Turli chaqiruv joylarida alohida-alohida yozilgan inline emoji tanlovlarini bitta
 *   joyga jamlaydi (proof-of-concept: `infrastructure/external/telegram-bot.adapter.ts`
 *   dagi `sendAlert()` ichidagi `urgencyEmoji` literal obyekti shu funksiyaga ko'chirildi).
 *   Sof funksiya — DB/HTTP/side-effect yo'q, hech qachon throw qilmaydi.
 *
 *   Boshqa 2-3 chaqiruv joyi (bu item da ATAYLAB TEGILMAGAN — alohida keng sweep kerak,
 *   chunki ular apps/api/src/modules/notifications tashqarisida joylashgan):
 *     - apps/api/src/modules/hr/telegram-bots/notification-templates.ts (turga qarab
 *       ✅/📋/📊 ni qo'lda tanlaydi)
 *     - apps/api/src/modules/bot-gateway/bots/qc.bot.ts va ombor.bot.ts (xabar turiga
 *       qarab bir xil emoji to'plamini alohida-alohida takrorlaydi)
 *     - apps/api/src/cron/manager-daily-routine.cron.ts, vacancy-deadline.cron.ts va
 *       boshqa bir nechta cron — shu emoji to'plamini yana takrorlaydi.
 */

import { NotificationType } from './domain/enums/notification-type.enum';

/** `notifications.priority` ustuni (low/normal/high/urgent) va Telegram `TelegramUrgency`
 *  (low/medium/high) — ikkalasini ham qamrab oladi. */
export type NotificationIconPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';

/** Muayyan bildirishnoma turi bo'yicha icon — aniqroq bo'lgani uchun priority'dan ustun turadi. */
const TYPE_ICON: Record<string, string> = {
  [NotificationType.QC_RESULT]: '✅',
  qc_failed: '🔴',
  [NotificationType.ORDER_STATUS]: '📋',
  [NotificationType.STOCK_ALERT]: '📊',
  [NotificationType.CERT_EXPIRY]: '⏰',
  [NotificationType.ADVANCE_REMINDER]: '⏰',
  [NotificationType.IOT_ANOMALY]: '🔴',
  [NotificationType.DELIVERY_STATUS]: '📋',
};

/** Priority-darajasi bo'yicha zaxira icon — `type` noma'lum yoki xaritada topilmasa ishlatiladi. */
const PRIORITY_ICON: Record<string, string> = {
  low: '🔵',
  normal: '🟡',
  medium: '🟡',
  high: '🔴',
  urgent: '🔴',
};

/** `type`/`priority` aniq bo'lmaganda qaytariladigan neytral standart. Aniq "nega shu raqam"
 *  emas — shunchaki telegram-bot.adapter.ts'dagi avvalgi 'medium' xatti-harakatiga mos neytral
 *  rang; kelajakda `business_settings`ga ko'chirilishi mumkin. */
const DEFAULT_ICON = '🟡';

/**
 * Bitta bildirishnoma uchun icon/emoji tanlaydi: avval `type` (aniqroq), keyin `priority`
 * (zaxira), aks holda neytral standart. Case-insensitive, bo'sh/undefined/noma'lum qiymatlarga
 * bardoshli.
 */
export function getNotificationIcon(params: {
  type?: string | null;
  priority?: string | null;
}): string {
  const type = (params.type ?? '').toString().trim().toLowerCase();
  if (type && type in TYPE_ICON) {
    return TYPE_ICON[type];
  }
  const priority = (params.priority ?? '').toString().trim().toLowerCase();
  if (priority && priority in PRIORITY_ICON) {
    return PRIORITY_ICON[priority];
  }
  return DEFAULT_ICON;
}
