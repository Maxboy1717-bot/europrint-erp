import { DrizzleService } from '../database/drizzle.service';

// Test ma'lumot factory — integration test uchun REAL DB ga yozadi.
// Ishlatish: jest.spec.ts fayllarida, e2e test larida.
// Hech qachon: production codeda yoki migration da.
//
// Qoida (14_Test.md): integration test = REAL DB (mock emas!)
// Factory: har test o'z ma'lumotini yaratadi, cleanup da o'chiradi.

export abstract class BaseFactory<TInsert, TSelect> {
  constructor(protected readonly db: DrizzleService) {}

  abstract build(overrides?: Partial<TInsert>): TInsert;
  abstract create(overrides?: Partial<TInsert>): Promise<TSelect>;
  abstract table(): unknown;

  protected merge<T>(defaults: T, overrides?: Partial<T>): T {
    return { ...defaults, ...overrides };
  }
}

// ─── YORDAMCHI FUNKSIYALAR ─────────────────────────────────────────────────

let _seq = 0;

/** Har safar ortuvchi raqam — dup ID lardan qochish uchun */
export function seq(): number {
  return ++_seq;
}

/** Tasodifiy 6-belgi string (test email va nomlarga) */
export function rand(prefix = 'test'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Bugundan N kun oldin/keyin sana */
export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
