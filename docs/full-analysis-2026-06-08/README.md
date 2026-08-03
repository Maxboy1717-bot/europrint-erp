# EuroPrint ERP — To'liq Forensik Tahlil (2026-06-08)

> **Hujjat turi:** REPORT-ONLY. Bu tahlil davomida hech qanday ilova kodi, sxema, migratsiya yoki konfiguratsiya **o'zgartirilmadi** — faqat shu papkadagi hisobot fayllari yaratildi.
> **Tahlil chegarasi:** `Uzbek-Language-Module/` (canonical monorepo nusxasi).
> **Til:** o'zbekcha (texnik nomlar — fayl yo'llari, jadval/ustun nomlari, kod — asl holida).

---

## Bu nima

Bu — EuroPrint ERP monorepo'sining **poydevor (foundation)** tahlili: tizimni xaritalovchi va inventarizatsiya qiluvchi 6 ta hisobot (1-4 va 7-fazalar). Modul bo'yicha chuqur tahlillar (04-19, 23) va yakuniy executive summary (00) **keyingi bosqichda** tayyorlanadi (pastdagi "Keyingi bosqich" bo'limiga qarang).

Har bir hisobot **verify-don't-trust** tamoyilida — har bir da'vo kod (`fayl:satr`) bilan mustaqil tasdiqlangan. Mavjud eski auditlar (`schema-canon-map.md`, `two-worlds-analysis.md`, `_drift_report_fresh.txt` va boshqalar) kontekst sifatida o'qildi, lekin qayta tasdiqlandi.

---

## Hisobotlar

| # | Hisobot | Bir qatorli xulosa |
|---|---|---|
| 01 | [01-architecture-monorepo.md](./01-architecture-monorepo.md) | pnpm monorepo (NestJS+Fastify · React 19+Vite · Drizzle+PG); sxemaning **uch yuzaliligi** va `@europrint/schemas` compile-vs-runtime rezolyutsiya nomuvofiqligi — eng tizimli zaiflik. |
| 02 | [02-database-schema-overview.md](./02-database-schema-overview.md) | Canonical Drizzle: **670 jadval, 8 110 ustun, 96 fayl**. To'liq ustun ro'yxati → `02-schema-columns.csv`. |
| 03 | [03-db-drift-and-duplicates.md](./03-db-drift-and-duplicates.md) | Drift kamaygan, lekin **`material_card_id` vs `material_id`** (DB'da 0 ta material_card_id), superset fragmentatsiyasi (`attendance` 4x), `stock_ledger` collision. |
| 20 | [20-frontend-routing-sidebar.md](./20-frontend-routing-sidebar.md) | **wouter** router; 492 marshrut, 270 sidebar link — **0 buzuq havola**; 50 legacy alias; atigi **6 haqiqiy placeholder**. |
| 21 | [21-api-endpoint-inventory.md](./21-api-endpoint-inventory.md) | **2 977 endpoint** / 341 controller; **0 aniq dublikat marshrut**; 171 stub/dead; 5 ta global guard barchasini himoyalaydi (24 `@Public`). To'liq → `21-endpoints.csv`. |
| 22 | [22-testing-and-build-health.md](./22-testing-and-build-health.md) | Etuk test stack (Jest+Vitest+Playwright+Stryker); oxirgi FE Vitest run **1413 test, 0 fail** (2026-06-06); ~411 sayoz skaffold. |

### Hamroh (ma'lumot) fayllar

- `02-schema-columns.csv` — har bir Drizzle ustun + tip (8 110 qator).
- `03-drift-report-snapshot-2026-05-25.txt` — eski to'liq drift ro'yxati (73 Drizzle-only, 527 ustun).
- `03-drift-sets-current.json` — joriy to'plam taqqoslari (Drizzle-only / DB-only / overlap).
- `20-routes-and-nav.csv` — barcha marshrut va sidebar nav itemlar.
- `21-endpoints.csv` — barcha 2 977 endpoint (method, path, file:line, handler, guards, kind, frontend-caller).

---

## Eng muhim 6 ta topilma (poydevor bo'yicha)

1. **`material_card_id` vs `material_id` (P0):** live DB'da `material_id` bilan 95 ta ustun, `material_card_id` bilan **0 ta**; kod esa `material_card_id`ni 82 faylda ishlatadi. Hatto bitta faylda JS-prop/SQL-nom ziddiyati (`mm-material-cards.ts:114` vs `:142`). → 03-hisobot.
2. **Sxemaning uch yuzaliligi (P1):** canonical `lib/db` · backend superset `apps/api/src/shared/db` · frontend `shared-schema.ts`. `@europrint/schemas` TS'da mahalliy superset'ga, runtime'da canonical `dist/cjs`ga resolve bo'ladi (`apps/api/tsconfig.json:14` vs `package.json:6`). → 01-hisobot.
3. **Backend superset fragmentatsiyasi (P2):** 21+ jadval bir nechta `schema-*` faylda har xil ustun bilan qayta ta'riflangan (`attendance` 4x, `users` 3x). → 03-hisobot.
4. **GL funksional dublikatsiyasi (P2):** `trial-balance` uch xil controllerda (`reports`, `finance/gl`, `gl`) — lekin hammasi **haqiqiy** SQL (sintetik emas). → 21-hisobot.
5. **Test chuqurligi (P2):** stack etuk va oxirgi FE run yashil (1413/0), lekin ~411 sayoz skaffold (149 BE stub + 262 FE smoke) soxta ishonch beradi. → 22-hisobot.
6. **Tozalik (P3):** orfan paketlar (`api-zod`, `api-client-react`...), dublikat nusxalar (`agent1-wt`, `.claude/worktrees/*`), 50 legacy URL alias. → 01, 20-hisobot.

---

## REPORT-ONLY tasdiqi

`git status` va fayl mtime tekshiruvi bilan tasdiqlangan: `apps/`, `artifacts/`, `lib/` ostidagi hech qanday fayl bu sessiya davomida (2026-06-08 ~13:24 UTC dan keyin) o'zgartirilmadi yoki yaratilmadi — eng yangi manba fayl 2026-06-07. Repo ish-daraxtida oldindan mavjud (commit qilinmagan) o'zgarishlar bor edi (`.claude/`, `apps/api/drizzle/*` — mtimes 2026-05-14/15), ular bu tahlilga aloqasiz. Bu tahlil **faqat** `docs/full-analysis-2026-06-08/` ichida yangi fayllar yaratdi.

---

## Keyingi bosqich (hali tayyorlanmagan)

Foydalanuvchi tasdig'i bilan birinchi navbatda poydevor fazalari bajarildi. Quyidagilar keyingi bosqichlar uchun:

- **04-auth-and-permissions** — global guard'lar (`app.module.ts:193-197`) va 24 `@Public` endpoint auditi, tenant scoping.
- **05-17** — modul bo'yicha chuqur tahlillar (HR, Finance, POS/Ombor, Inventory, Sales, Production, Procurement, Tasks, Reports).
- **18-notifications-and-events**, **19-i18n-coverage** (uz/ru/uz-cyr; uz-cyr'da 1 namespace kam).
- **23-dead-code-and-stubs** (171 stub endpoint, 6 placeholder sahifa, orfan paketlar).
- **00-EXECUTIVE-SUMMARY** — barcha gap'larni yagona ustuvor backlog (P0-P3) va modul scorecard'iga jamlash.

---

*Yaratilgan: 2026-06-08 · Tahlil vositasi: forensik statik tahlil (parser + grep + kross-referens).*
