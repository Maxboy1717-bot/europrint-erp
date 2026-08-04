# VISION GAP MASTER PLAN — 2026-08-03

> Manba: 18 modul bo'yicha avtonom kashfiyot to'lqini (2026-08-03), oxirgi to'liq
> cross-reference (FULL-VISION-EXTRACTION-2026-07-07, ~4786 qator) va modul-maxsus
> "COMPLETE-FRESH-ANALYSIS" audit fayllariga asoslangan. Har bir band jonli kod
> bilan tasdiqlangan (Q-29 verify-don't-trust) — stale audit da'volari emas.
>
> **Yagona haqiqat manbai endi Task ro'yxati (TaskList).** Bu fayl — statik
> suratga olingan xulosa, real vaqtdagi holat uchun TaskList'ni tekshiring.

## Umumiy holat (bu to'lqin boshlanishida)

Oxirgi to'liq cross-reference (2026-07-07): **Ha (to'liq ishlaydi) ~2% · Qisman
~42% · Yo'q ~59%**. "Hujjatlashtirilgan ~65%" — bu yashirin ishlaydigan funksional
degani EMAS: ~62% umuman yo'q + ~35% mexanizm bor-u ishga tushmaydi + faqat ~2.5%
chindan ulangan.

## Bu to'lqinda topilgan: 215 band, 18 modul

| Modul | Band soni | P0 | Egasi-data |
|---|---|---|---|
| HR-Org | 21 | 2 | 2 |
| MES | 18 | 2 | 1 |
| QC | 12 | 0 | 1 |
| WMS | 8 | 1 | 1 |
| LMS | 11 | 0 | 1 |
| PP | 12 | 1 | 1 |
| IoT | 9 | 0 | 3 |
| POS | 8 | 2 | 0 |
| Director | 18 | 0 | 0 |
| Admin | 7 | 0 | 1 |
| Chat | 19 | 0 | 2 |
| CC | 13 | 2 | 8 |
| Kanban | 13 | 1 | 3 |
| AI/Aisha | 16 | 1 | 2 |
| SD | 10 | 3 | 2 |
| Marketing | 12 | 2 | 2 |
| Finance | 8 | 1 | 1 |
| Notifications | 0 | — | — |
| **Jami** | **215** | **15** | **~28** |

## Bajarilish jarayoni

1. **P0 to'lqin 1** (9 band: HR-RBAC, HR-onboarding-ID, MES×2, WMS, POS×2, PP,
   Kanban) — ✅ **TUGADI**, tekshirilib commit+push qilindi (9 commit,
   `chore/schema-convergence`).
2. **P0 to'lqin 2** (6 band: SD×3, Marketing×2, Finance×1) — ⏳ ishga tushirilmoqda.
3. **P1 to'lqinlar** — ~110+ band, modul bo'yicha guruhlab, verify+fix+typecheck+
   commit+push pattern bilan davom etadi.
4. **Egasi-data (~28 band)** — hech qachon avtonom yopilmaydi; CRUD-with-defaults
   patterniga mos kelmaydiganlari (real tashkiliy ma'lumot, biznes qarorlari, API
   kalitlari) alohida ro'yxatda saqlanadi.

## Egasi qaroriga muhtoj bandlar (avtonom yopib bo'lmaydi)

- **CC**: org/employee/council seed data (0 qator), field-level rol-tahrirlash
  huquqi qoidasi, CC↔boshqa-modul event kontrakti
- **Kanban**: ShVB shaxsiy jadval formati, karta-lavozim modeli, bosqich bog'liqligi
- **IoT**: Camera-AI GATED migratsiya tasdig'i, kanonik machines registry,
  energiya-hisoblagich manbasi
- **HR**: razryad_levels real qiymatlar (maosh oralig'i, imtihon o'tish %)
- **QC**: oziq-ovqat/kimyoviy xavfsizlik materiallar katalogi
- **Finance**: kassir PIN-ustun migratsiyasi + real PIN'lar
- **AI/Aisha**: bonus-mezon jadvali, card_folders maydon strukturasi
- **Marketing**: real ijtimoiy tarmoq/AI provider kalitlari
- **SD**: yetkazish→ombor qayta yoqish qarori, shartnoma ustun migratsiyasi

To'liq ro'yxat va tafsilot — TaskList'da `[EGASI-DATA]` prefiksi bilan belgilangan.

## Qoidalar (bu to'lqin davomida amal qiladi)

- Har band: **verify-first** — audit da'vosi jonli koddan tasdiqlanadi, aks holda
  "allaqachon tuzatilgan" deb belgilanadi (bir necha marta shunday chiqdi).
- Har fix: BE+FE typecheck 0 xato, mavjud testlar o'tishi shart.
- Yangi CREATE TABLE — faqat mavjud, allaqachon tasdiqlangan vizyon-spec asosida,
  Q-35 APPROVED marker bilan; haqiqiy yangi biznes qaror — egasiga qoldiriladi.
- Commit format: `fix(<modul>): <qisqa tavsif>` — har band alohida commit.
- Subagent commit qilmaydi — bosh sessiya tekshirib, commit+push qiladi (Q-31).
