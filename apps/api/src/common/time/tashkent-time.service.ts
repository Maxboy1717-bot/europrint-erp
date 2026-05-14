/**
 * @module tashkent-time.service
 * @description Centralised time service that always operates in
 *   `Asia/Tashkent` (UTC+5). Provides `now`, `today`, `startOfDay`,
 *   `diffInDays`, `diffCalendarDays`, `addDays`, `addBusinessDays`,
 *   `isOverdue`, and `formatDate` — all timezone-aware.
 *
 *   Inject into any service that touches business-meaningful dates:
 *     constructor(private readonly time: TashkentTimeService) {}
 *     const today = this.time.now();
 *     const overdue = this.time.diffInDays(invoiceDate, today);
 * @layer Service (cross-cutting time helper)
 *
 * WHY ALL DATE LOGIC GOES THROUGH THIS SERVICE
 *   Raw `new Date()` returns UTC. Uzbekistan operates UTC+5 — every
 *   business date (invoice creation, payroll cutoff, AR aging) must be
 *   computed against Tashkent's calendar day boundaries, not UTC's.
 *
 *   Concrete failure modes that motivated this service:
 *     - Invoice created at 23:30 Tashkent (= 18:30 UTC) gets sorted into
 *       the wrong day on UTC servers → aging math drifts by 1 day, dunning
 *       letters fire one day late.
 *     - Payroll cutoff "1st of month 00:00" interpreted as UTC = 05:00
 *       Tashkent → first 5 hours of a pay period missing.
 *     - Daylight saving in EU offices (not applicable to UZ, but customers
 *       in different TZs) → DST drift on cross-border invoices.
 *
 * WHY @date-fns/tz INSTEAD OF moment / luxon
 *   date-fns is tree-shakable (smaller bundle), TypeScript-native, and
 *   the TZDate wrapper composes with date-fns calendar helpers like
 *   `differenceInCalendarDays`. Moment is deprecated; Luxon would also
 *   work but date-fns is already used elsewhere in the codebase.
 *
 * WHY addBusinessDays SKIPS SAT (6) + SUN (0)
 *   UZ standard work week is Mon-Fri. The factory floor runs 7 days but
 *   "business days" in finance/legal contexts (invoice due dates, NDA
 *   responses) skip the weekend. If/when we add public holiday support
 *   (Navruz, Mustaqillik kuni), extend this method with a holiday list.
 *
 * WHY formatDate USES 'en-CA' LOCALE
 *   en-CA's default date format is ISO 'YYYY-MM-DD'. Other locales
 *   give DD/MM/YYYY or MM/DD/YYYY — ambiguous for storage. We never
 *   display this format to users (UI uses 'uz-UZ'/'ru-RU'); it's for
 *   internal API + JSON serialisation.
 *
 * WHY ALL METHODS RETURN `Date` (not string or epoch)
 *   Keeps the contract uniform with raw `new Date()` so callers can
 *   continue using date-fns / formatting in their own way. The internal
 *   TZDate is converted back to plain Date at the boundary so Drizzle's
 *   timestamp serializer handles it the same.
 */
import { Injectable } from '@nestjs/common';
import { TZDate } from '@date-fns/tz';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

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
