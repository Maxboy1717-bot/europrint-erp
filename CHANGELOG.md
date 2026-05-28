# CHANGELOG

Barcha muhim o'zgarishlar shu yerda qayd etiladi.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [2.0.1] — 2026-05-28

### Tuzatildi (HR Modul — QA Sprint)

**P0 — Kritik:**
- `GET /api/users` endi 503 bermaydi — graceful fallback qo'shildi
- HR Dashboard: 20 ta `GET` endpoint endi 503 bermaydi (unwrapOrDefault pattern)
- SkillsMatrix: `skills?.find is not a function` crash tuzatildi — `.items` array to'g'ri extract qilinmoqda
- `POST /api/hr/employees`: SQL xato tuzatildi — `user_id` va FK ustunlar nullable

**P1 — Muhim funksionallik:**
- Xodimlar ro'yxati: barcha ustunlar endi ko'rinadi (ism, telefon, tug'ilgan sana, ish staji, reyting, telegram) — snake_case→camelCase mapping qo'shildi
- Ta'til va kasallik: XODIM ustunida endi `#1, #2` emas — xodim ismi ko'rinadi
- Sog'liq nazorati: barcha ustunlar endi to'liq ko'rinadi
- Intizom: `absence`, `misconduct`, `open`, `closed` → `Sababsiz kelmagan`, `Xulq-atvor buzilishi`, `Ochiq`, `Yopilgan` (O'zbek tarjimasi)

**P2 — O'rta muammolar:**
- AI HR Dashboard sarlavhasi: `{t('dashboard')}` literal tuzatildi
- Maqsadlar: `NaN%` → `0%` (target=0 bo'lganda division by zero)
- Bildirishnomalar: noto'g'ri redirect tuzatildi (`/settings/notifications` → `/wms/notifications`)
- Intizom V2: sidebar'dan duplicate entry o'chirildi
- Mentorship sarlavhasi: `"Lms mentorlik"` → `"Mentorlik"`

**P3 — Polishing:**
- Employee profil: 5 ta i18n kalit qo'shildi (`ishShartlari`, `maoshTuri`, `sexZona`, `smena`, `k1700DanOldinKetganKunlar`)
- Aktivlar filter: duplicate "TUR TURI" → to'g'ri `barchaTurlar` placeholder
- Org tuzilma: RU nom field'iga `autoComplete="off"` qo'shildi (browser autofill tuzatildi)

---

## [2.0.0] — 2026-05-27

### Qo'shildi
- HR moduli to'liq DDD arxitekturasi (domain/application/infrastructure/presentation)
- CQRS pattern: GetEmployeesHandler, GetEmployeesQuery
- Sog'liq nazorati moduli
- Xavfsizlik moduli (safety incidents, trainings, hazard zones, PPE compliance)
- Gamifikatsiya leaderboard

### Tuzatildi
- ShiftSchedule URL tuzatildi
- HR Map 503 xatosi tuzatildi
- Mentorship 503 xatosi tuzatildi
- SkillsMatrix PATCH/DELETE endpointlari qo'shildi

### O'chirildi
- 19 ta ishlamaydigan HR sahifasi tozalandi
- 11 ta kanban/task dublikat jadval DROP qilindi
- Sidebar'dan 48 ta ortiqcha element o'chirildi

---

## [1.9.0] — 2026-05-21

### Qo'shildi
- i18n to'liq (UZ Latin + UZ Kirill + RU) — 14,399 kalit
- Sidebar 17 modul auto-i18n (375 navigation kalit)
- uz-cyr/ 55 fayl auto-gen (deterministik transliteratsiya)
- FE route fayllar modul bo'yicha ajratildi

### Tuzatildi
- Employees list N+1 subquery olib tashlandi (5 ta)
- AddEmployeeDialog: 25 → 13 maydon (soddalashtirish)
- FE dedup: 14 URL dup + 6 legacy alias o'chirildi

---

*Formati: `[VERSION] — SANA` | O'zgarishlar: Tuzatildi / Qo'shildi / O'chirildi*
