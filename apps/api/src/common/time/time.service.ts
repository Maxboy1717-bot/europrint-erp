/**
 * TimeService — TZ-D15: Asia/Tashkent zone-aware vaqt xizmati.
 *
 * TashkentTimeService uchun to'liq muvofiq alias va kengaytma.
 * Barcha new Date() to'g'ridan-to'g'ri ishlatilish o'rniga shu servis ishlatilsin.
 *
 * Ishlatish:
 *   constructor(private readonly time: TimeService) {}
 *   const today = this.time.now();
 *   const days  = this.time.diffInDays(from, to);
 */
import { Injectable } from '@nestjs/common';
import { TashkentTimeService } from './tashkent-time.service';

export { TashkentTimeService };

@Injectable()
export class TimeService extends TashkentTimeService {
  /**
   * Hozirgi vaqt (UTC+5, Asia/Tashkent).
   * new Date() o'rniga foydalanilsin.
   */
  override now(): Date {
    return super.now();
  }

  /**
   * Berilgan ISO sanani Date ob'ektiga xavfsiz aylantirish.
   * Invalid sana yoki noto'g'ri tur → null.
   */
  parseDate(iso: unknown): Date | null {
    if (iso instanceof Date) return isNaN(iso.getTime()) ? null : iso;
    const asDate =
      typeof iso === 'string' || typeof iso === 'number' ? new Date(iso) : null;
    return asDate !== null && !isNaN(asDate.getTime()) ? asDate : null;
  }

  /**
   * N oydan keyingi sana (Toshkent vaqtida).
   */
  addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  /**
   * Oy boshini qaytaradi (Toshkent vaqtida, 1-kuni 00:00:00).
   */
  startOfMonth(date: Date): Date {
    const d = this.startOfDay(date);
    d.setDate(1);
    return d;
  }

  /**
   * Sana oralig'i [start, end] ichida ekanligini tekshiradi.
   */
  isInRange(date: Date, start: Date, end: Date): boolean {
    const t = date.getTime();
    return t >= start.getTime() && t <= end.getTime();
  }
}
