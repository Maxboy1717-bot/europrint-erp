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

## ⚠️ TaskList holati (2026-08-05)

Sessiya davomida jarayon qayta ishga tushgan (crash) va shu bilan birga
**TaskList tool holati yo'qolgan** — `TaskList()` endi bo'sh qaytaradi, garchi
215 band ilgari o'sha tool orqali kuzatilgan bo'lsa ham. "Yagona haqiqat manbai
TaskList" yozuvi (yuqorida) shuning uchun endi TO'G'RI EMAS bu sessiya uchun —
**git log (`chore/schema-convergence`) + shu fayl** haqiqiy holat manbai.
TaskList'ni 215 ta band bilan qayta qurish o'rniga, git commit tarixi orqali
kuzatiladi (har commit item raqamiga ishora qiladi, masalan "fix(admin): #118 ...").

### Bu sessiyada tugallangan (commit+push, `chore/schema-convergence`):
- #119 — Lavozim yo'riqnoma fayl yuklash (2-bosqichli upload + positionName JOIN) — `dac0ccba`
- #118 — Admin Queue Monitor real BullMQ (edi 100% soxta) — `102c1efc`
- #122 — TenantFilterGuard global ro'yxatga olindi — `dc749dad`
- #123 — Backup/cron monitor sidebar'ga ulandi — `8039ab7f`
- #113 — Director Diary IDOR xavfsizlik tuzatildi (boshqa karta kundaligini o'qish/yozish) — `d23e650b`

### Egasi-data deb qayta tasniflangan (bu sessiya, kod kerak emas):
- #114 — Chiqindi (waste) → GL posting: kredit hisob tanlovi (Inventory 1000 vs COGS 9100) egasi qarori kerak
- #145 — CC field-level rol-tahrirlash: maydon×lavozim mapping + identity axis (position_code) egasi qarori kerak; positions=0 qator (blok)

### Bu sessiyada tugallangan (davomi — Workflow to'xtatilgandan keyin, to'g'ridan-to'g'ri):
- #104 — Director dashboard aiInsights: real karta-AI agregat (ckp_fact_values) — `a3a641a9`
- #191 — SD mijoz tahrirlash: "blacklist"/"blacklisted" mos kelmasligi + majburiy status-resend 400 — `a25d5fc4`
- #206 — Marketing dashboard totalSpent hech qachon hisoblanmagan — `429f37cd`
- #125 — Chat is_edited hech qachon saqlanmagan — `33634a35`
- #116 — Director kunlik daftar surunkali-muammo eskalatsiyasi (1-kunlik edi) — `b546a7f7`
- #126 — Chat @mention FE'da tutiladi, lekin BE'ning har bir bosqichida tashlanadi — `97d8809c`
- #101 — Director owner-summary kunlik digest FE'ga ulandi (BE tayyor edi, iste'molchisi yo'q edi) — `f1caa337`
- #168 — Kanban GanttView.tsx.bak.t2c o'lik orfan fayl o'chirildi — `accb4c5b`

**Jami bu sessiyada: 13 ta real commit** (xavfsizlik tuzatish ×1, yangi funksiya ×3, xato tuzatish ×8, o'lik kod tozalash ×1).

⚠️ **2026-08-05 davomida egasi aniq buyruq berdi: "workflow qilmasdan bajarish kerak"** — Workflow
tool tarmoq xatolari bilan qayta-qayta qulab tushgani sabab, shu paytdan boshlab barcha keyingi
tekshiruv+tuzatish ISHNI TO'G'RIDAN-TO'G'RI (Read/Grep/Edit/Bash, subagent/Workflow'siz) davom
ettirish kerak.

### Navbatda (buildable-fix, reja mavjud, hali qurilmagan — endi to'g'ridan-to'g'ri amalga oshiriladi):
- #101 (Director owner-summary FE ulanishi), #105 (SLA ko'p-bosqichli eskalatsiya), #113✅(bajarildi), #116 (kundalik surunkali-muammo eskalatsiya), #117 (setup-loss AI trigger)
- #85 (IoT camera-alerts producer + dead-cron tozalash), #118✅/#122✅/#123✅(bajarildi)
- #126 (chat @mention), #164 (kanban karta-markazli tayinlash)
- Fon-rejimda avval ishga tushirilgan (Workflow orqali, endi faqat natija sifatida o'qiladi) batchlar hali ham natija qaytarishi mumkin: Director #101-117 qolgan qismi, IoT #83-91, CC #144-156, Chat #125-143 qolgan qismi, Kanban #158-169 qolgan qismi, SD #189-195 qolgan qismi, Marketing #198-207 qolgan qismi, Finance #209-215, AI-Aisha #171-185 — bular kelganda o'qib, to'g'ridan-to'g'ri (Workflow'siz) amalga oshiriladi.
