# EuroPrint ERP — To'liq Remediation Reja (2026-05-18)

**Audit asosida tuzilgan**: `session_2026-05-18_full_audit.md` (5,110 fayl, 22 reviewer, 702 test spec)

**Hozirgi holat**: PASS=13 / FAIL=11 (memory PASS=24/FAIL=0 deb da'vo qilgan — eskirgan)

---

## 📋 Reja qisqacha (5 faza, 17 vazifa)

| Faza | Nomi | Vazifalar | Taxminiy vaqt |
|---|---|---|---|
| **PHASE 1** | 🔴 BLOKERLAR | 3 | 0.5 kun |
| **PHASE 2** | 🟠 Funksional buglar | 2 | 0.5 kun |
| **PHASE 3** | 🟡 Texnik qarz | 2 | 3-5 kun |
| **PHASE 4** | 🧹 Tozalash | 3 | 1-2 kun |
| **PHASE 5** | 🏗️ Arxitektura | 7 | 1-3 hafta |

---

## PHASE 1 — 🔴 BLOKERLAR (CI ishlamayapti)

### 1.1 — Backend test svit (uuid v14 ESM)

**Muammo**: 144 test suite / 435 test FAIL. pnpm `"uuid": ">=14.0.0"` override → uuid v14 ESM-only → Jest `transformIgnorePatterns` pnpm-hoisted yo'lga to'g'ri kelmaydi.

**Fayllar**:
- `apps/api/test/jest.config.js` qator 13-15

**Hozirgi kod**:
```js
transformIgnorePatterns: [
  'node_modules/(?!(uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)',
],
```

**Tuzatish (A — yaxshi)**:
```js
transformIgnorePatterns: [
  'node_modules/(?!.*?(?:uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)',
],
```

**Tuzatish (B — soddaroq)**: pnpm override'ni o'zgartirish:
```json
"uuid": "^9.0.1"
```

**Tekshirish**: `pnpm --filter @europrint/api run test` → 144 suite endi PASS bo'lishi kerak.

---

### 1.2 — IdealVsActualPanel crash bug

**Fayl**: `artifacts/erp-dashboard/src/components/director/IdealVsActualPanel.tsx:94`

**Bug**: `{data && (...)}` faqat data ni tekshiradi, `data.orders` ni emas. Agar API `{}` qaytarsa → `Cannot read properties of undefined (reading 'completed')`.

**Tuzatish**:
```tsx
// QO'SHISH: data.orders mavjudligini tekshirish
{data && data.orders && (
  <div className="pt-2 border-t">
    {/* yoki: data?.orders?.completed bilan optional chaining */}
    {data.orders.completed}/{data.orders.total} ({data.orders.completion_pct}%)
```

**Tekshirish**: `DirectorDashboard.test.tsx > triggers a toast when the refresh-all button is clicked` — endi uncaught exception bermaydi.

---

### 1.3 — HRAlertBanner smoke test

**Fayl**: `artifacts/erp-dashboard/src/pages/HRAlertBanner.smoke.test.tsx`

**Bug**: TestProviders `isLoading=true` qaytaradi → component `null` qaytaradi → `expect(container.firstChild).not.toBeNull()` FAIL.

**Variantlar**:
- **A**: Smoke test'ni isLoading skeleton render qiladigan qilish (component ham o'zgartiriladi)
- **B**: Test'da `vi.mock("@tanstack/react-query")` bilan loading bo'lmagan state qo'yish
- **C**: Smoke test assertion'ni `toBeInTheDocument()` yoki shunchaki `not.toThrow()` qilish

**Tavsiya: B**. Test 1 qatorda mock qo'shadi:
```tsx
vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useQuery: () => ({ data: { data: [] }, isLoading: false }),
}));
```

---

## PHASE 2 — 🟠 FUNKSIONAL BUGLAR

### 2.1 — 3 ta same-file route duplicate (Fastify rejects)

**Bug 1**: `POST /api/auth/refresh` ikkita controller'da:
- `apps/api/src/modules/auth/presentation/auth.controller.ts`
- `apps/api/src/modules/general/controllers/admin-auth.controller.ts`

**Tuzatish**: `admin-auth.controller.ts` dagi `refresh` ni `/api/admin/auth/refresh` ga ko'chirish yoki to'liq o'chirish (auth.controller.ts asosiy).

**Bug 2**: `POST /api/attempts/:id/submit` BIR FAYLDA ikki marta:
- `apps/api/src/modules/lms/presentation/lms-attempts.controller.ts`

**Tuzatish**: Ikkinchi `@Post(':id/submit')` decoratorini topib, `@Post(':id/submit-final')` yoki o'chirish.

**Bug 3**: `GET /api/hr-v2/daily-reports/employee/:id` BIR FAYLDA ikki marta:
- `apps/api/src/modules/hr/daily-report/daily-report.controller.ts`

**Tuzatish**: Dublikatdan birini olib tashlash.

**Verify**: `node check-route-dups.mjs | head -5` — 32 → 29 ga tushishi kerak.

---

### 2.2 — 29 ta cross-controller route duplicate

**Asosiy klasterlar**:

| Klaster | Misol | Sabab |
|---|---|---|
| hr-dashboard-stubs vs hr-dashboard | `GET /api/hr/360/reviewable` | Stub controller commented out @ providers, lekin fayl turibdi |
| warehouse legacy | `GET /api/warehouse/warehouses` | `general-legacy-b.controller.ts` + `wms-gateway-warehouses.controller.ts` |
| HR offboarding | `GET /api/hr/offboarding/cases` | hr-offboarding + hr-dashboard-stubs |

**Tuzatish strategiyasi**:
1. Memory'da aytilgandek `hr.providers.ts` da `// TODO HR-STUB-DUP` qatorlarini to'liq olib tashlash
2. `hr-dashboard-stubs.controller.ts` + `hr-dashboard-stubs-write.controller.ts` fayllarini o'chirish (route'lar `hr-dashboard.controller.ts` da bor)
3. Yoki: stub'larni `/v2` prefiks bilan qayta yoritish

**Verify**: `node check-route-dups.mjs` → 0 duplicate bo'lishi kerak.

---

## PHASE 3 — 🟡 TEXNIK QARZ

### 3.1 — 169 ta katta fayl (Rule 16, >300 lines)

**Eng katta yangi violator'lar (`pos-monitor/` papkasi — memory bunga e'tibor bermagan)**:

| Fayl | Qator | Strategiya |
|---|---:|---|
| `pos-monitor/pages/PosMyInventory.tsx` | 475 | Types + Table + Filters + Dialogs |
| `pos-monitor/pages/PosMaterials.tsx` | 401 | Types + Helpers + Table + Dialog |
| `pos-monitor/pages/PosMaterial360.tsx` | 394 | 4 ta tab komponentga |
| `pos-monitor/hooks/useOfflineSync.ts` | 389 | Hook + queue helper + storage helper |
| `pos-monitor/api/pos-monitor.api.ts` | 377 | 3 ta domain API faylga bo'lish |
| `pages/WarehouseMaterial360.tsx` | 372 | Types + Sections |
| `pos-monitor/PosMonitorApp.tsx` | 367 | Routes + Layout + ProvidersTree |
| `pos-monitor/pages/PosMovementKirimSteps.tsx` | 358 | Steps array + step components |

**Reja**: Har bir failni `*Types.ts`, `*Helpers.tsx`, `*Sections.tsx`, `*Dialogs.tsx`, `*Tabs.tsx` larga bo'lish (Qoida 13 namunasi).

**Avtomatlashtirish**: Yo'q — har biri qo'lda; xato qilish oson.

**Verify**: `bash scripts/reviewer-file-size.sh` → 0 FAIL.

**Sprint hisobi**:
- Sprint A: pos-monitor/ (8 fayl) — 1 kun
- Sprint B: warehouse/ + WarehouseHub12 oilasi (10 fayl) — 1 kun
- Sprint C: qolgan 151 ta fayl batch'lar bilan — 3 kun

---

### 3.2 — 165 ta uzun funksiya (Rule 17, >30 lines)

**Memory'da H.14 deb belgilangan**: `learning-bot.onProgressCompleted (~65)`, `recruitment-bot.publishVacancy (~55)`.

**Misol topilmasi**:
- `apps/api/src/telegram/handlers/ai-reports.handler.ts:32` (40 lines)

**Reja**: 
1. `bash scripts/reviewer-function-size.sh` chiqishidan to'liq ro'yxat olish
2. Har 30+ funksiyani `extractMethod` qilish: prepareX(), buildY(), persistZ() pattern
3. Test qoplama bilan boshlash (Funnel, OnboardingPlan aggregatlar misolida)

**Sprint hisobi**: 165 ÷ 8 ta/kun = ~3 ish kuni.

---

## PHASE 4 — 🧹 TOZALASH

### 3.1 — 105 orphan page + 24 orphan script delete

**Ma'lumotlar manbai**:
- `orphan-pages.txt` (find-orphan-pages.mjs natijasi)
- `orphan-scripts.txt` (find-orphan-scripts.mjs natijasi)

**Eng katta orphan pages**:
- `EmployeeProfileMockup` (18.9 KB)
- `planning/PlanningTabPanels` (18.8 KB)
- `warehouse/TransfersTab` (18.5 KB)
- `analytics/OutcomesTab` (17.0 KB)
- `kanban/TemplatesDialog` (16.4 KB)
- (105 ta jami, 772.8 KB)

**Eng katta orphan scripts**:
- `scripts/audit-full-system.ts` (33.5 KB) — agentlar ishlatadi?
- `scripts/src/master-audit.sh` (21.0 KB)
- `scripts/audit-backend-coverage.ts` (19.7 KB)
- `scripts/i18n-full-audit.mjs` (16.0 KB)

**EHTIYOT**: orphan tekshiruvi reference qidiradi, lekin dinamik `import()` yoki external `bash`/`node` chaqiruvini ko'rmasligi mumkin. Avval har birini quick `grep` bilan tasdiqlash.

**Reja**:
1. `orphan-pages.txt` ni qayta tekshirish: grep har bir fayl uchun
2. Ishonchli orphan'larni `git rm` qilish (single PR)
3. Orphan scripts uchun ham xuddi shunday

**Sprint hisobi**: 1 kun (verifikatsiya + commit).

---

### 4.2 — 718 UZ + 20 RU i18n English-leak

**Top namespace'lar (UZ)**:
- common: 548 ta key
- finance: 36
- production: 16
- mro: 15
- hr: 13
- crm: 12
- ai: 11
- warehouse: 11
- navigation: 9
- iot: 8

**Misollar**:
- `common/k1Step = "1 && step"` — bu hatto inglizcha emas, kod fragmenti!
- `common/customer001 = "customer-001"` — placeholder
- `common/k404DeadButton = "404, dead button"` — dev artifact
- `ai/forecastDesc = "Croston/TSB sporadic demand ..."` — technical term

**Strategiya**: 
1. `audit-i18n-strict-report.json` dan to'liq ro'yxat
2. Avto-tarjima Anthropic API orqali (Sonnet 4.6) bilan batch'lar
3. Yoki: ru'yxatni inson tarjimoniga berish (mavjud `apply-uz-translations.mjs` skripti bor)

**Sprint hisobi**: Avtomatik bilan 0.5 kun, manual bilan 2 kun.

---

### 4.3 — 261 hardcoded JSX strings → t()

**Manba**: `audit-hardcoded-report.json`, `i18n-tsx-hardcoded.csv`

**Strategiya**:
- Mavjud `convert-jsx-to-t.mjs` va `fix-i18n-leaks.mjs` skriptlarini ishga tushirish
- Avval dry-run qilib, keyin commit'lar bilan

**Sprint hisobi**: 0.5 kun.

---

## PHASE 5 — 🏗️ ARXITEKTURA / INFRASTRUKTURA

### 5.1 — ARCHITECTURE_RULES.md va CLAUDE.md yangilash

**Fayllar**:
- `ARCHITECTURE_RULES.md` — qator 18-43 jadval (22/22 PASS deydi, lekin haqiqat boshqacha)
- `CLAUDE.md` — eski FAIL 143 / FAIL 678 da'volar (allaqachon hal qilingan), eski `admin.seed.ts` va `legacy.service.ts` "TUZATILISHI KERAK" deydi (allaqachon tuzatilgan)

**Reja**:
1. `bash scripts/run-all-reviewers.sh` real natijani jadvalga qo'yish
2. CLAUDE.md "Hozirgi holat" qatorlarini PASS ga o'zgartirish
3. Hozirgi yangi violator'larni ro'yxatga olish (169 file-size, 165 function-size, 32 dup routes)

**Sprint**: 1 soat.

---

### 5.2 — run-all-reviewers.sh parser bug

**Fayl**: `scripts/run-all-reviewers.sh` qator ~80-95

**Bug**: `grep -oE '(^|[^A-Za-z])FAIL:[[:space:]]*[0-9]+' | tail -1` har qanday `FAIL: N` tokenni ushlaydi. Magic Numbers reviewer "PASS: 0 magic-number candidates" deydi (0 violation) — lekin aggregator FAIL 1 deb belgilaydi.

**Tuzatish**:
```bash
# Eski:
fail_line=$(echo "$stripped" | grep -oE '(^|[^A-Za-z])FAIL:[[:space:]]*[0-9]+' | tail -1)

# Yangi: faqat standart summary qatordan oling
fail_line=$(echo "$stripped" | grep -E 'PASS:[[:space:]]+[0-9]+.*\|.*FAIL:[[:space:]]+[0-9]+' | tail -1)
if [ -z "$fail_line" ]; then
    # Yoki "FAIL: N description" yagona qator
    fail_line=$(echo "$stripped" | grep -E '^[[:space:]]*FAIL[[:space:]]*:?[[:space:]]+[0-9]+' | tail -1)
fi
```

**Verify**: `bash scripts/run-all-reviewers.sh` → aggregat sonlar individual run bilan to'g'ri kelishi kerak.

**Sprint**: 1 soat.

---

### 5.3 — madge o'rnatish (Rule 11)

**Hozir**: `reviewer-circular-deps.sh` "WARN: madge not installed locally — skipping precise scan." — qoida tekshirilmagan.

**Tuzatish**:
```bash
pnpm add -wD madge
# yoki:
pnpm dlx madge --circular --extensions ts apps/api/src/modules
```

**Verify**: 0 cycle topilishi kerak (memory ushlamagan yangi cycle'lar bormi).

**Sprint**: 30 daqiqa.

---

### 5.4 — Wave 4: @OnEvent → @EventsHandler (142 qoldi)

**Hozir**: 142 ta `@OnEvent` decorator 67 ta faylda (memory "70 qoldi" deydi — qayta hisoblash kerak).

**Eng yirik klasterlar**:
- `hr/telegram-bots/*` — 32 (8 fayl)
- `pos/secondary-events.handler.ts` — 12
- `pos/pos.events.ts` — 10
- `hr/attendance/territory.gateway.ts` — 6
- `hr/telegram-bots/telegram-bots-pip-events.service.ts` — 14
- `telegram-bots-cron.service.ts` + `telegram-bots-cron-recruitment.service.ts` — 4

**Qaror kerak**:
- Telegram bot lifecycle uchun @OnEvent qoldirish (memory tavsiyasi)
- Gateway broadcast'lar uchun @OnEvent (real-time push)
- POS event'lar uchun @EventsHandler CQRS pattern

**Sprint hisobi**: 5-7 kun.

---

### 5.5 — Wave 7 notifications port architectural decision

**Blokirovka**: `notifications/domain/services/{telegram,email,sms}.service.ts` shim'lar mavjud emas, lekin legacy service'larda 6 ta method bor (`sendDirectorDailyReport`, `notifyLowStock*`, `sendEmail({to,subject,html})`) port contract'da yo'q.

**Variantlar**:
- **A**: Shimlarni qayta yaratish (eski pattern saqlab)
- **B**: Port contract'larni kengaytirib, 23 consumer'ni TELEGRAM_SENDER/EMAIL_SENDER/SMS_SENDER token'lariga ko'chirish
- **C**: Hozirgi holatni saqlab, legacy services'ni @Injectable() qoldirish (qaror — "ataylab"); EventBridge orqali notification fan-out qilish

**Tavsiya**: **B** — DDD pattern bilan moslashadi, lekin 2-3 kun. C — eng tez (qaror sifatida qayd qilish kifoya).

---

### 5.6 — Multi-tenancy tenant_id columns (Wave 6 Tier-2)

**Hozir**: 5 ta schema'da 12 ta `tenantId` reference (scaffolding only — TenantId VO, ALS context, middleware tayyor; lekin ko'p schema'da column yo'q).

**Reja**:
1. Top 20 ta schema (employees, attendance, leave, kpi, salesOrders, salesInvoices, posTransactions, ...) ga `tenantId uuid` column qo'shish
2. Drizzle migration generate
3. Existing data'ni single tenant'ga backfill
4. RLS (Row-Level Security) policy yaratish
5. Repository'larni `tenantId` filter bilan yangilash

**Sprint hisobi**: 5 kun (schema 1 kun, migration 1 kun, repo refactor 2 kun, test 1 kun).

---

### 5.7 — Wave 11: 234 ta stub implementation

**Manba**: `docs/stub-endpoint-catalog.md` (639 qator, 240 stubs inventarsi)

**P1 (oldin):**
- IoT production sessions
- Payroll calc pipeline
- MM vendor invoices (Tier-1)

**P2 (keyin):**
- Marketing analytics — `marketing-analytics-stubs.controller.ts` (57 endpoint, alohida sprint kerak)
- Communication center
- Sales quotation flow

**Strategiya**: Har bir P1 stub uchun:
1. Frontend consumer'ni topish
2. Schema'ni tekshirish
3. Service + Repository qo'shish
4. Controller'da real impl
5. Test spec yozish

**Sprint hisobi**: P1 — 5 kun, P2 — 2 hafta.

---

## 🎯 Yakuniy yo'l xaritasi (timeline)

| Hafta | Phase | Asosiy ish |
|---|---|---|
| **1-hafta** | PHASE 1 + 2 | BLOCKERS + bugs (1 kun); route duplicates (0.5 kun); BUFFER |
| **2-hafta** | PHASE 3 | File size (1.5 kun); Function size (3 kun); BUFFER |
| **3-hafta** | PHASE 4 | Orphan cleanup (1 kun); i18n (2 kun); hardcoded (0.5 kun) |
| **4-hafta** | PHASE 5 part 1 | Docs (1 soat); aggregator fix (1 soat); madge (30 min); Wave 4 boshlanishi (4 kun) |
| **5-hafta** | PHASE 5 part 2 | Wave 4 davom (3 kun); Wave 7 qaror (1 kun); Multi-tenancy start (2 kun) |
| **6-hafta** | PHASE 5 part 3 | Multi-tenancy davom (3 kun); Wave 11 P1 (2 kun) |
| **7-9 hafta** | PHASE 5 final | Wave 11 P2 marketing analytics (10-14 kun) |

**Jami**: ~7-9 hafta to'liq remediation.

---

## ✅ "Definition of Done" har bir vazifa uchun

1. Kod yangilangan + commit
2. Tegishli reviewer skripti PASS qaytaradi
3. `pnpm run typecheck` + `pnpm run lint` + `pnpm run test` (BE + FE) — barchasi yashil
4. Manual verify: rasm/screenshot yoki playwright test
5. Memory'ga session log yozish

---

## 📊 Muvaffaqiyat ko'rsatkichlari (KPI)

| Metrika | Hozir | Maqsad |
|---|---:|---:|
| Reviewer PASS | 13/24 | 24/24 |
| BE test FAIL | 144 suite | 0 |
| FE test FAIL | 1 | 0 |
| Route duplicates | 32 | 0 |
| File-size violations | 169 | 0 |
| Function-size violations | 165 | 0 |
| Orphan pages | 105 | 0 |
| i18n leaks (UZ+RU) | 738 | < 50 |
| Hardcoded JSX | 261 | 0 |
| Stub endpoints | 234 | < 50 |
| @OnEvent qoldigi | 142 | < 30 |
| Multi-tenant schema'lar | 5 | 20+ |
| Score (memory: 82/100) | 82 | 92+ |

---

*Reja avtomatlashtirilgan audit asosida (2026-05-18). Real ishni boshlashdan oldin har bir fayl statusini qayta tasdiqlash kerak — kod o'zgargan bo'lishi mumkin.*
