# HR Modul — Production-Tayyorlik Auditi (2026-08-08)

> Ko'lam: sidebar `tz11` "Xodimlar" bo'limining barcha 28 sahifasi (TASHKILOT, REKRUTING, 360° PROFIL,
> DAVOMAT VA SMENA, BAHOLASH, ONBOARDING, OFFBOARDING, NAZORAT, HR V2, YANGI TIZIMLAR, HR BREND, HAFTALIK REJA).
> Metodologiya: har sahifa uchun FE `useQuery`/`useMutation` → BE controller/endpoint → BE
> service/repo → DB jadval zanjiri tekshirildi (Q-29 verify-don't-trust). DB 2026-07-11'da
> to'liq reset qilingan (0 xodim) — "bo'sh ro'yxat" o'zi bug emas; tekshirilgan narsa — kod-yo'li
> real ishlaydimi, ma'lumot kiritilsa saqlanadimi.

## Xulosa

**28 sahifadan 22 tasi (79%) to'liq real, oxirigacha ulangan (✅).** 6 tasida (21%) aniq,
tuzatiladigan FE↔BE kontrakt drift bor (Q-18/Q-40/Q-43 buzilishi) — hech biri egasi-DATA yoki
arxitektura qaroriga bog'liq emas, barchasi texnik fix. Fantom jadval yoki umuman ulanmagan
endpoint topilmadi.

## ✅ To'liq ishlaydi (22)

`hr-dashboard`, `org-structure/hierarchy`, `org-structure/error-catalog`, `hr/recruiting`,
`employees`, `ai-hr/dashboard`, `goals`, `shift-schedule`, `settings/notifications` (umumiy
tizim sahifasi, HR-maxsus emas), `assets`→`hr/assets`, `integration/employee-rating`,
`mentorship`, `hr/succession`, `hr/onboarding`, `hr/offboarding`, `discipline`,
`hr/health-monitoring`, `hr/career-path`, `hr/safety`, `hr/referrals`, `hr/brand`, `weekly-plan`.

## ⚠️ Qisman — tuzatildi shu sessiyada (6)

| # | Sahifa | Muammo | Task |
|---|---|---|---|
| 1 | `hr-map` | KPI karta doim 0 (`stats.total.employees` mos kelmaydi) + "AI marshrutlar" soxta-muvaffaqiyat | #12 |
| 2 | `ai-hr/interviews` | "Yangi intervyu" formasi har safar 400 (`jobTitle`≠`positionTitle`) | #13 |
| 3 | `hr/vacation-sick` | BE approve/reject bor, FE'da tugma yo'q | #14 |
| 4 | `skills-matrix` | "Biriktirish" formasi 400 (FE/BE maydon-nomi drift, FK yo'q) | #15 |
| 5 | `hr/daily-reports` | HR-override tugmasi status o'zgartirmaydi (Zod maydon tashlaydi) | #16 |
| 6 | `hr/reception` | Check-in'dan keyingi badge-preview "undefined"/"Invalid Date" | #17 |

Har birining aniq fayl:satr dalili tegishli TaskCreate yozuvida va commit xabarida.

## Metodologik eslatma

Audit 7 ta parallel general-purpose agent orqali (sidebar guruhlariga mos klasterlar) bajarildi,
har biri READ-ONLY (Qoida 23 — Tahlilchi rol). Topilgan 6 muammo keyin asosiy sessiyada
tasdiqlandi va to'g'irlandi (Qoida 23 — Bajaruvchi rol, alohida bosqich).
