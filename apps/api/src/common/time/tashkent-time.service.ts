import { Injectable } from '@nestjs/common';
import { TZDate } from '@date-fns/tz';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

/**
 * TashkentTimeService — Toshkent vaqt zonasi uchun markazlashgan vaqt xizmati.
 *
 * Muammo: new Date() UTC qaytaradi. O'zbekiston UTC+5 — 5 soat farq.
 * Muddat, AR aging, ish haqi hisoblarida buning ahamiyati katta.
 *
 * Barcha new Date() to'g'ridan-to'g'ri ishlatish o'rniga bu servis ishlatilsin.
 *
 * Ishlatish:
 *   constructor(private readonly time: TashkentTimeService) {}
 *   const today = this.time.now();
 *   const days = this.time.diffInDays(invoiceDate, today);
 */
@Injectable()
export class TashkentTimeService {
  private readonly TIMEZONE = 'Asia/Tashkent';

  /**
   * Hozirgi Toshkent vaqtini qaytaradi.
   */
  now(): Date {
    return new TZDate(Date.now(), this.TIMEZONE);
  }

  /**
   * Toshkent vaqtiga moslashtirilgan bugun — soat 00:00:00.
   */
  today(): Date {
    return startOfDay(new TZDate(Date.now(), this.TIMEZONE));
  }

  /**
   * Berilgan sananing Toshkent vaqtida 00:00:00 ga o'tkazilgan nusxasi.
   */
  startOfDay(date: Date): Date {
    return startOfDay(new TZDate(date, this.TIMEZONE));
  }

  /**
   * Ikki sana orasidagi kunlar farqi (to'liq kun, Toshkent vaqtida).
   * from < to → musbat son.
   *
   * @example diffInDays(invoice.createdAt, today) // 32 kun o'tgan
   */
  diffInDays(from: Date, to: Date): number {
    return this.diffCalendarDays(from, to);
  }

  /**
   * Ikki sananing Toshkent kalendar kunlari farqi — date-fns-tz orqali.
   * Soat, minut va sekund e'tiborga olinmaydi — faqat kalendar kuni muhim.
   * a < b → musbat son.
   *
   * @example diffCalendarDays(new Date('2026-04-01'), new Date('2026-04-10')) // 9
   */
  diffCalendarDays(a: Date, b: Date): number {
    const tzA = new TZDate(a, this.TIMEZONE);
    const tzB = new TZDate(b, this.TIMEZONE);
    return differenceInCalendarDays(tzB, tzA);
  }

  /**
   * Sanaga N kun qo'shish.
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Sanaga N ish kuni qo'shish (shanba va yakshanba o'tkazib yuboriladi).
   * @example addBusinessDays(new Date('2026-04-24'), 3) // 2026-04-29 (shanba/yakshanba o'tkaziladi)
   */
  addBusinessDays(date: Date, days: number): Date {
    const result = new TZDate(date, this.TIMEZONE);
    let added = 0;
    const step = days >= 0 ? 1 : -1;
    const target = Math.abs(days);
    while (added < target) {
      result.setDate(result.getDate() + step);
      const dow = result.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return new Date(result);
  }

  /**
   * Sana o'tgan (due date) ekanligini tekshirish.
   */
  isOverdue(dueDate: Date): boolean {
    return differenceInCalendarDays(
      new TZDate(dueDate, this.TIMEZONE),
      new TZDate(Date.now(), this.TIMEZONE),
    ) < 0;
  }

  /**
   * ISO sanani Toshkent vaqtida formatlash: "YYYY-MM-DD".
   */
  formatDate(date: Date): string {
    return new TZDate(date, this.TIMEZONE).toLocaleDateString('en-CA');
  }
}
