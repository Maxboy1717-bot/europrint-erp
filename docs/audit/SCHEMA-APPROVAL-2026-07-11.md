# SCHEMA-APPROVAL — Egasi qarori (2026-07-11)

> **Egasi (Muslimbek) chat orqali TASDIQLADI:** "schema-approval beraman, keyingi itemlarni oching"
> (2026-07-11). Bu Q-35 (Jadval yaratish = egasi ruxsati) bo'yicha **umumiy ruxsat**.

## Nima ochildi
Yangi `CREATE TABLE` / `ALTER ADD COLUMN` / yangi enum-qiymat / additive seed-migration
**endi ruxsat etilgan** — `_PHASE2-OWNER-DECISIONS-2026-07-11.md` dagi **"Schema sign-off (Q-35)"**
toifasidagi itemlar (369 ta) uchun. Har migration fayliga majburiy izoh:

```
-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
```
(pre-commit `check-unauthorized-migration.mjs` shu izohni qidiradi.)

## Nima OCHILMAYDI (schema-approval BU EMAS)
Schema ruxsati faqat **struktura** yaratishga. Quyidagilar hali ham egasi-DATA/qarorini kutadi
(fabrication TAQIQ — MENEJER mandati: faqat un-fabricatable DATA so'raladi):

1. **Master-data qiymatlari** — masalan #89 ~30-mashina to'liq ro'yxati (nom/tur/quvvat), razryad
   koeffitsientlari, OEE-target raqamlari, brak% shiftlari, kVt reytinglari, unit-per-machine.
2. **GL hisob-raqam mapping'lari** — "zavod zarari", "material isrofi", "yo'ldagi tovar" debit/credit
   juftliklari (Finance-03 SoD bilan bog'liq).
3. **Threshold/policy qiymatlari** — eskalatsiya vaqtlari (15/30 min), tasdiqlash summalari,
   kafolat oynasi kunlari, namuna N-rulon, zona to'lganlik %.
4. **Blocked modullar** — Org-01 (struktura/`head_user_id`), HR-02 (razryad/oylik), Finance-03 (SoD
   user-provisioning), AI-17 (kredensiallar), bilingual/Cyrillic — schema-approval bularni OCHMAYDI.
5. **Kim-kimni** (org-graf), **AI kalit** — un-fabricatable, egasi beradi.

## Amaliyot (build-disiplin, o'zgarmaydi)
- Har schema o'zgarishi **vizyonga** mos (master-plan = haqiqat manbai, Q-40).
- Yangi jadval = mavjud kanonik jadvallar bilan **dublikat emasligini** tekshir (STANDARTLAR §15).
- Har yozuv yo'li uchun **DB-proof** (rollback-tx yoki live SELECT).
- Single-writer, bitta item = bitta commit, pre-commit tsc + migration-check gate.
- Schema tayyor lekin DATA yetishmasa: **strukturani + plumbing'ni qur**, default/NULL bilan ishlasin,
  DATA-bo'shlig'ini `SAVOLLAR-VA-MUAMMOLAR` MD'ga yoz (yarim qoldirma — Q-33).

## Manba
- Ochiladigan itemlar: `docs/audit/_PHASE2-OWNER-DECISIONS-2026-07-11.md` (Schema sign-off 369).
- To'liq item-plan: `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md`.
- Qolgan savollar: `docs/audit/SAVOLLAR-VA-MUAMMOLAR-2026-07-11.md` (bu to'lqinda yaratiladi).
