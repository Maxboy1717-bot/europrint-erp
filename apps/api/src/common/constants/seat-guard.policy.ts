/**
 * @module seat-guard.policy
 * @description EP-ORG-002 KARTA 1-o'rin guard rejimi — KONFIGURATSIYALANADIGAN, default NON-BREAKING.
 *
 *   Vizyon-rels (egasi 2026-06-26, T18-C1-AUTH-ORG #3): jonli data ko'p-xodim/karta stake
 *   modelida bo'lishi mumkin → DESTRUCTIVE UNIQUE CONSTRAINT / DB-trigger QO'SHILMAYDI. Faqat
 *   APP-qatlam guard, va u KONFIGURATSIYALANADIGAN. Default rejim hech kimni bloklamaydi (warn).
 *
 *   3 rejim (env `CARD_SEAT_GUARD_MODE`):
 *     - 'warn'    (DEFAULT, NON-BREAKING): position-karta band bo'lsa ham assign QABUL qilinadi;
 *                 faqat `warning` qaytariladi (log + javobda). Jonli data buzilmaydi.
 *     - 'stake'   : ulush-cap (stake-sum ≤ 1.0) bo'yicha boshqariladi — seat soni emas, ulush
 *                 yig'indisi tekshiriladi (ko'p-xodim/karta ulush bilan ruxsat etiladi).
 *     - 'enforce' : qat'iy 1-seat (position-karta band → RAD). Faqat egasi yoqsa (productionda
 *                 seat-split tugagach).
 *
 *   FABRIKATSIYA YO'Q: noma'lum/bo'sh qiymat → 'warn' (eng xavfsiz, non-breaking).
 *   Yagona manba: shu fayl. Iste'molchi: org-mutations.repo.assignUser.
 */

/** KARTA 1-o'rin guard rejimlari. */
export type SeatGuardMode = 'warn' | 'stake' | 'enforce';

/** Default rejim — NON-BREAKING (jonli data buzilmaydi). */
export const SEAT_GUARD_DEFAULT_MODE: SeatGuardMode = 'warn';

/**
 * Xom env qiymatini (CARD_SEAT_GUARD_MODE) xavfsiz SeatGuardMode'ga aylantiradi.
 * Noma'lum/bo'sh/null → 'warn' (default non-breaking). Katta-kichik harf farqsiz.
 * @param raw ConfigService.get<string>('CARD_SEAT_GUARD_MODE') natijasi
 */
export function resolveSeatGuardMode(raw: string | null | undefined): SeatGuardMode {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'enforce') return 'enforce';
  if (v === 'stake') return 'stake';
  return SEAT_GUARD_DEFAULT_MODE; // 'warn' + har qanday noma'lum qiymat
}
