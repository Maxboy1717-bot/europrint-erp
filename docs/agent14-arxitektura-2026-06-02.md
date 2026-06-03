# AGENT14 — ARXITEKTURA + KOD SIFATI + DDD TAHLILI (2026-06-02)

> **FAQAT TAHLIL** — hech bir fayl o'zgartirilmadi. Har da'vo kod (Read/Grep) + reviewer skript + jonli DB bilan
> tasdiqlangan, fayl:satr bilan. Backend root: `apps/api/src`. Schema: `lib/db/src/schema` + `apps/api/src/shared/db`.

---

## 0. QISQA HUKM (executive summary)

Bu kod bazasi **muhandislik intizomi bo'yicha kuchli, lekin arxitektura izchilligi bo'yicha bo'lingan**.

- **ISHLAYDI yaxshi:** Fayl hajmi intizomi a'lo (qo'lda yozilgan eng katta BE fayl 595 satr, FE 892 satr — 900 chegarasidan past); reviewer-larning aksariyati PASS; xavfsizlik qatlami (5 global guard) joyida; event-driven (112 `@OnEvent`, 196 emit) va CQRS (169 handler) real qurilgan.
- **QISMAN/MUAMMO:** **Ikki parallel yozuv-yo'li** (CQRS+aggregate vs flat-slice to'g'ridan repo) butun kod bo'ylab yonma-yon yashaydi — bu eng katta arxitektura qarzi. **Ikki parallel schema olami** (`@workspace/db` vs `@europrint/schemas` stub barrel) bir xil jadvalni nomuvofiq tiplar bilan belgilaydi. DDD aggregatlarning 40/41 i anemik. `compatibility` moduli "minimallashtirilgan" deyilgan, lekin 115 fayl / 14,819 satr / 30 controller.
- **YOLG'ON/ESKIRGAN:** CLAUDE.md dagi reviewer baseline raqamlari **juda eskirgan** (array-safety 678 FAIL deyilgan → hozir 5; result-pattern 143 → hozir 2). Kod bazasi o'sha hujjatdan beri sezilarli yaxshilangan. `reviewer-file-size.sh` da `head -2000` bug bor — 2552 fayl jim o'tkazib yuboriladi.

**Umumiy arxitektura bahosi: B− / C+.** Mikro-daraja (fayl, funksiya, guard, Result pattern) yaxshi; makro-daraja (yagona yozuv-yo'li, yagona schema, modul chegaralari) bo'lingan.

---

## 1. RAQAMLAR (asosiy o'lchovlar)

| O'lchov | Qiymat | Manba |
|---|---|---|
| Modul papkalari | 52 (`apps/api/src/modules/`) | `ls modules/` |
| Ro'yxatga olingan NestJS modullari | ~62 (app.module + feature-modules) | `app.module.ts:42-56` |
| Controllers (`@Controller`) | **344** | grep |
| `@Injectable` servislar | **1115** | grep |
| Repository fayllari | **513** (`.repo.ts`=283 + `.repository.ts`=230) | find |
| CQRS handler (`.handler.ts`) | **169** | find |
| DDD aggregat fayllari | **41** | find |
| Value object (`.vo.ts`) | **21** | find |
| Domain event (`.event.ts`) | **63** | find |
| `@OnEvent` listener fayllari / dekoratorlar | 42 / **112** | grep |
| `.emit()/.emitAsync()` chaqiruvlar | **196** | grep |
| Saga fayllari | 1 | find |
| pgTable chaqiruvlari (jami) | **1149** (lib/db 696 + apps/api 453) | grep |
| Noyob jadval nomlari | **912** | grep -u |
| **Dublikat pgTable nomlari (>1 ta'rif)** | **154** | grep+uniq |
| schema-dup ratchet baseline | **165** (PASS, o'smagan) | `reviewer-schema-dup.mjs` |
| `@deprecated`/DUPLICATE_REMOVED markerlar | 54 fayl | grep |
| TODO/FIXME/HACK/XXX | 103 | grep |
| FE fayllar (.ts/.tsx) | 2079 | find |

---

## 2. DDD — AGGREGATLAR VA INVARIANT HIMOYASI

### 2.1. Holat: aggregatlar BOR, lekin aksariyati ANEMIK va kuchsiz ulangan

`scripts/audit-anemic-domain.mjs` natijasi: **41 aggregatdan 40 tasida** kamida bitta anemik-domen belgisi bor:
- **32 ta** aggregatda public mutable maydonlar bor (enkapsulyatsiya buzilgan)
- **12 ta** `constructor(public ...)` ishlatadi (tashqaridan to'g'ridan mutatsiya mumkin)
- Getter umuman yo'q bo'lganlar ko'p (masalan `deal.aggregate` methods=18 / getters=0; `lead.aggregate` methods=22 / getters=0)

**Yagona toza misol (etalon):** `apps/api/src/modules/hr/domain/aggregates/payroll-record.aggregate.ts` — private `props` bag, factory `createFromEmployee`/`fromProps` `Result<T>` qaytaradi, invariant guardlar real (`posted` o'zgarmas: `:139,:177,:212`; `increaseSalary` yangi>eski: `:143`; `decreaseSalary` yangi<eski: `:181`), domain event buffer (`:232 getDomainEvents`/`:236 clearDomainEvents`). **Bu qanday bo'lishi kerakligining namunasi** — qolgan 40 tasi shu darajaga yetmagan.

### 2.2. Aggregatlar ASOSAN ZAIF ULANGAN (orphan domain xavfi)

Aggregatlarning domain qatlamidan TASHQARIDA nechta faylda ishlatilishi (= haqiqatan yozuv-yo'liga ulanganmi):

| Aggregat | Non-domain consumer | Hukm |
|---|---|---|
| `order.aggregate` | **21** fayl | ✅ haqiqatan ulangan (order-workflow yadrosi) |
| `material.aggregate` | 5 | ✅ ulangan |
| `kanban-task.aggregate` | 5 | ✅ ulangan |
| `lead.aggregate` | 4 | ⚠️ qisman (handler + repo) |
| `deal.aggregate` | 3 | ⚠️ qisman |
| `budget.aggregate` | 3 | ⚠️ qisman |
| `production-session.aggregate` | 2 | ⚠️ kam |
| `purchase-order.aggregate` | 2 | ⚠️ kam |
| **`payroll-record.aggregate`** | **1** | ❌ deyarli orphan (eng sifatli, lekin eng kam ishlatilgan!) |
| `employee.aggregate` | 1 | ❌ deyarli orphan |
| `invoice.aggregate` | 1 | ❌ deyarli orphan |

**Xulosa:** sifatli yozilgan aggregatlar (payroll-record, employee, invoice) amalda yozuv-yo'liga deyarli ulanmagan — haqiqiy CRUD ularni chetlab Drizzle reposiga to'g'ridan boradi. Ya'ni DDD qatlam **deklarativ, lekin yarim-faol**.

---

## 3. ENG KATTA ARXITEKTURA QARZI — IKKI PARALLEL YOZUV-YO'LI ⚠️

Har bir asosiy modulda **bir vaqtning o'zida ikki xil yozuv arxitekturasi** yashaydi:
1. **DDD/CQRS yo'li:** `domain/aggregates/*` → `application/commands/*.handler.ts` → `infrastructure/repositories/drizzle-*.repo.ts`
2. **To'g'ridan-CRUD yo'li:** flat slice papka `<modul>/<slice>/drizzle-<slice>.repo.ts` (aggregat YO'Q, ko'pincha raw SQL)

Module bo'yicha (`find`):

| Modul | CQRS handler | infra-repo | flat-slice repo |
|---|---|---|---|
| crm | 12 | 20 | 5 |
| sd | 6 | 10 | 4 |
| hr | 9 | 9 | 9 |
| finance | 6 | 16 | 10 |
| mes | 4 | 5 | 1 |
| wms | 6 | 7 | 3 |
| pp | 5 | 4 | 4 |
| qc | 4 | 12 | 1 |

### 3.1. KONKRET DALIL — CRM `crm_deals` jadvali uchun IKKI repo, IKKI ZID MODEL

`crm.module.ts` **ikkala** reponi ham wire qiladi (ikkalasi `crm_deals` jadvaliga yozadi):

- **Aggregat repo:** `crm/infrastructure/repositories/drizzle-deal.repo.ts:12` — `import { crmDeals } from '@shared/db'` (Drizzle ORM), izoh: "Live crm_deals has no lead_id column → store the lead link in metadata (jsonb)" (`:25`).
- **Flat-slice repo:** `crm/deals/drizzle-crm-deals.repo.ts` — **raw SQL**, izoh: "Bitrix-style crm_deals table (live columns: date_create/date_modify..." (`:3`), `currency_id (not currency), close_date (not...)` (`:65`).

**Ya'ni bir xil jadval haqida ikki repo IKKI ZID MENTAL MODELGA ega** (biri ORM + jsonb metadata, ikkinchisi raw SQL + Bitrix ustunlar). Bu **haqiqiy texnik xavf**: schema o'zgarsa ikki joyni sinxron tutish kerak; yangi dasturchi qaysi biri kanonik ekanini bilmaydi.

**Tavsiya:** har modul uchun BITTA kanonik yozuv-yo'lini tanlab (ko'pchilik faol kod flat-slice/to'g'ridan repoga tayanadi), DDD aggregat yo'lini yo to'liq ulash, yo olib tashlash — lekin bu **katta nazorat ostidagi refactor**, blind avtomatlashtirib bo'lmaydi.

---

## 4. SCHEMA SIFATI — IKKI PARALLEL OLAM + DUBLIKAT pgTable

### 4.1. 154 dublikat pgTable, 912 noyob jadval, 1149 ta'rif

Eng ko'p takrorlangan: `attendance` ×4; `users`/`materials`/`salary_history`/`lms_tests`/`leave_requests`/`inventory_counts`/`courses`/`accounting_periods` ×3; yana ~145 tasi ×2.

`scripts/reviewer-schema-dup.mjs` ratchet baseline = **165** (PASS — yangi dublikat qo'shilmagan). Bu **ratchet himoyasi ishlaydi**, lekin mavjud 165 dublikat hal qilinmagan.

### 4.2. NEGA dublikat — ikki nomuvofiq schema olami (memory bilan tasdiq + qayta tekshirildi)

- **Olam (a):** `lib/db/src/schema/*` = `@workspace/db` (~77 fayl import qiladi). 96 fayl, 696 pgTable.
- **Olam (b):** `apps/api/src/shared/db/schema-*.ts` + `schema-compat-*` stublar, `@europrint/schemas` barrel orqali (~95 repo import qiladi). 54 fayl, 453 pgTable.

**Barrel precedence tasdiqlandi** — `apps/api/src/shared/db/europrint-compat.ts` (64 satr): `export * from './schema'` (`:6`) THEN explicit `export { salaryHistory } from './schema-compat-5'` (`:16`) + yana ~10 explicit blok. TS qoidasi bo'yicha explicit named re-export `export *` ni **ustun qiladi** → 95 repo stub-tip oladi, kanonik emas.

**Tip nomuvofiqligi:** `users.id` uch joyda uch xil — `lib/db` `serial`(int), `schema-compat-1a` `integer`, `schema-core.ts:28` `uuid`(string). Jonli DB qo'lda migratsiya qilingan superset bo'lgani uchun ish vaqtida xato yo'q, **lekin hech bir yagona Drizzle schema DBni qayta yarata olmaydi** (`drizzle-kit push` emas, `pg_dump` orqali provision).

**Hukm:** "dublikat pgTable" auditlari ish-vaqti correctness bug'ini ko'rsatmaydi (DB superset hammasini qondiradi), lekin **comprehension qarzi** real — ikki olamni jismonan birlashtirish = ~95 reponi nomuvofiq-PK stublardan ko'chirish = katta nazorat ostidagi refactor.

---

## 5. MODUL CHEGARALARI — overlap, ghost, monolit

### 5.1. ✅ ISHLAYDI: app.module toza
`app.module.ts` 219 satr (300 chegara ostida), feature-modullar `feature-modules.ts` barrelga ajratilgan; 5 global guard + 3 interceptor to'g'ri tartibda (`:193-213`). Bu yaxshi.

### 5.2. ⚠️ QISMAN — overlapping/bo'lingan modul juftliklari

| Domen | Modullar | Fayl/controller | Muammo |
|---|---|---|---|
| AI | `ai`(88f/15c) + `ai-agents`(11f/1c) + `aisha`(55f/4c) + `agents`(19f/1c) | **173 fayl, 4 modul** | 4 ta AI moduli — chegaralar tiniq emas, ehtimol birlashtirish kerak |
| POS | `pos`(24c) + `pos-v2`(4c) | 2 modul | v1/v2 yonma-yon; FE `pos-monitor` yagonaga ko'chirilgan, BE hali bo'lingan |
| Material/ombor | `mm`(55f/7c) + `wms`(93f/22c) | 2 modul | material vs warehouse chegarasi (master-data overlap memory) |
| Finance | `fi`(1f/0c) + `finance`(154f/31c) | `fi` deyarli ghost | `fi/tax/general-tax.service.ts` yagona fayl — `finance` ichiga ko'chirilsin |

### 5.3. ⚠️ Ghost modul-papkalari (`.module.ts` YO'Q, lekin wire qilingan)
`fi`, `camera`, `applications`, `hr-assets`, `feedback-360` — har biri 1-2 service fayl, o'z `.module.ts` siz. Tekshirildi: HAMMASI tashqarida ishlatiladi (CameraService 7 fayl, GeneralTaxService 2, qolganlari 1) → **dead emas, lekin strukturaviy noto'g'ri joylashgan** (parent modulga provider sifatida tiqilgan, o'z chegarasi yo'q).

### 5.4. ❌ MONOLIT — `compatibility` moduli (CLAUDE.md bilan ZID)
CLAUDE.md `app.module.ts:163-164` da "Legacy & Compatibility (minimallashtirilgan)" deydi. **Haqiqat:** `compatibility/` = **115 fayl, 14,819 satr, 30 controller**. Bu eng katta yashirin monolit — `cfo`, `saas`, `europrint-control`, `crm-extended`, 12+ `*-compat` controller. Bu modul "vaqtinchalik" deb belgilangan, lekin amalda doimiy ulkan yuk. **Refactor maqsadi:** controllerlarni tegishli domen modullariga qaytarib taqsimlash.

---

## 6. NAMING / STRUKTURA IZCHILLIGI

| Mavzu | Holat | Dalil |
|---|---|---|
| Repo qo'shimchasi | ❌ **ikki konvensiya** | `.repo.ts` ×283 va `.repository.ts` ×230 yonma-yon — yagona standart yo'q |
| Repo prefiks | ⚠️ qisman | `drizzle-*.repo.ts` ×130 (yaxshi pattern), lekin hamma joyda emas |
| Modul ichki struktura | ⚠️ aralash | ba'zi modul `domain/application/infrastructure` (DDD), ba'zisi flat-slice (`crm/deals/`, `crm/leads/`) — bir modulda IKKALASI ham (crm) |
| Aggregat nomi | ✅ izchil | `*.aggregate.ts`, `*.vo.ts`, `*.event.ts`, `*.handler.ts` toza |
| Til | ⚠️ aralash | kod izohlar o'zbek+ingliz aralash (loyiha normasi); FE POS SPA da raw camelCase kalitlar (boshqa agent hisoboti) |

---

## 7. DEAD CODE / TOZALIK

- **Dead code:** ghost-dir servislar dead EMAS (hammasi wired). `@deprecated`/DUPLICATE_REMOVED markerlar 54 faylda — bu o'tgan dedup sessiyalaridan qolgan, asosan stub re-export shimlar (memory bo'yicha 9/11 barrel blok olib bo'lmaydi).
- **TODO/FIXME/HACK:** 103 ta — o'rtacha (1115 service uchun past zichlik).
- **`any` ishlatish:** reviewer-any-type FAIL=2 (`drizzle-downtime.repo.ts:118 as any`, +1) — juda past.
- **`as unknown` stub:** reviewer FAIL=0, WARN=1 — yaxshi.
- **Eng katta fayllar (generated):** `migrations-drift.ts` (3632 satr, AUTO-GENERATED data, `:3-18` izoh) + `schema-db-only-generated.ts` (1088 satr). Bular **data fayllar, refactor past-prioritet**, lekin reviewer ularni ko'rmaydi (8-bo'limga qarang).

---

## 8. REVIEWER NATIJALARI — HOZIRGI HOLAT (CLAUDE.md baseline ESKIRGAN)

`scripts/reviewer-*.sh` jonli ishga tushirildi (2026-06-02):

| Reviewer | Qoida | HOZIR | CLAUDE.md da yozilgan | Izoh |
|---|---|---|---|---|
| reviewer-array-safety | Array.isArray | **FAIL: 5** (PASS 1170) | FAIL: **678** | ✅ dramatik yaxshilangan |
| reviewer-result-pattern | Result\<T\> | **FAIL: 2** (PASS 181, WARN 6) | FAIL: **143** | ✅ dramatik yaxshilangan |
| reviewer-as-unknown | as unknown stub | **FAIL: 0** (WARN 1) | FAIL: 3 | ✅ tuzatilgan |
| reviewer-any-type | any taqiq | FAIL: 2 | — | past |
| reviewer-raw-sql | raw SQL | FAIL: 3, WARN 80 | ~200+ | qisman (WARN ko'p) |
| reviewer-file-size | 900 satr | **PASS: 0** ⚠️BUG | FAIL: 1 | aslida 2 fayl >900 (8.1) |
| reviewer-function-size | 150 satr | PASS: 0 | — | ✅ |
| reviewer-controller-logic | Rule 6 | PASS: 0 | bir necha violator | ✅ |
| reviewer-repository-layer | Rule 15 db.* | PASS: 0 | bir necha violator | ✅ (lekin heuristik tor) |
| reviewer-try-catch | Rule 9 | PASS: 0 | — | ✅ |
| reviewer-jwt-guard | Rule 8 | PASS | PASS | ✅ |
| reviewer-schema-dup | dup ratchet | PASS: 165 | baseline 174→165 | ✅ ratchet ishlaydi |
| reviewer-orphan-schema | import qilinmagan pgTable | **FAIL: 722** | — | ⚠️ schema-bloat (4.1/4.2 ni tasdiqlaydi) |
| reviewer-non-null | Rule 13 `!` | PASS: 0 | 9 fayl | ✅ tuzatilgan |
| reviewer-try-catch | Rule 9 | PASS: 0 | — | ✅ |
| reviewer-circular-deps | Rule 11 | SKIP (madge yo'q) | — | ⚠️ enable qilinmagan |

> **MUHIM:** CLAUDE.md ("Hozirgi Tekshiruv Holati" jadvali) array-safety=678, result-pattern=143 deydi — bu **eskirgan**. Real holat ancha yaxshi. CLAUDE.md yangilanishi kerak.

### 8.1. ❌ `reviewer-file-size.sh` da REAL BUG
`scripts/reviewer-file-size.sh:22` — `find ... | head -2000`. Loyihada bu pattern bo'yicha **4552 fayl** bor → **2552 fayl jim o'tkazib yuboriladi**. Natijada 2 ta haqiqatan 900+ fayl (`shared/db/invariants/migrations-drift.ts` 3632 satr, `schema-db-only-generated.ts` 1088 satr) topilmaydi va reviewer noto'g'ri "PASS: 0" deydi. Bular generated fayllar bo'lgani uchun amaliy zarar past, lekin **CI gate ishonchsiz** — `head -2000` olib tashlanishi yoki `*.generated.ts`/`migrations-drift` ataylab istisno qilinishi kerak.

---

## 9. ARXITEKTURA KUCHLI TOMONLARI (adolat uchun)

1. **Fayl-bo'lish intizomi a'lo.** Qo'lda yozilgan eng katta BE fayl = `hr-dashboard.repository.ts` 595 satr; FE = `PosMonitorPage.tsx` 892 satr. 900 qoidasi haqiqatan hurmat qilinadi (faqat 2 generated fayl oshadi).
2. **Xavfsizlik qatlami markazlashgan.** 5 global guard (`app.module.ts:193-197`) — Throttler/Jwt/Roles/Sod/Permission. Har controller himoyalangan (reviewer PASS).
3. **Event-driven + CQRS real qurilgan.** 112 `@OnEvent`, 196 emit, 169 handler, outbox pattern (`OutboxModule`), Phase-4 fan-out saga (memory bilan tasdiq). Bu skeleton mavjud va ishlaydi.
4. **Result pattern keng joriy.** 181 PASS, faqat 2 FAIL. `throw` o'rniga `Result<T>` deyarli hamma joyda.
5. **Ratchet himoyalari ishlaydi.** schema-dup (165), no-new-stubs, design-tokens, sidebar-regress — yangi qarz qo'shilishini bloklaydi.
6. **app.module toza** (219 satr, barrel-ajratilgan).

---

## 10. REFACTOR KERAK JOYLAR (prioritet bilan)

### 🔴 KATTA (nazorat ostida, blind emas)
1. **Ikki yozuv-yo'lini birlashtirish** (3-bo'lim) — har modulda CQRS+aggregat vs flat-slice repo. CRM `crm_deals` ikki zid model (3.1) — eng yaqqol. Maqsad: modulga BITTA kanonik repo.
2. **Ikki schema olamini birlashtirish** (4-bo'lim) — ~95 repo stub-barreldan kanonik `@workspace/db` ga. Memory: faqat ~19 mexanik ko'chirildi, ~155 consumer-side migratsiya talab qiladi. **Inson nazorati shart.**
3. **`compatibility` monolitini taqsimlash** (5.4) — 115 fayl/30 controllerni domen modullariga qaytarish.

### 🟠 O'RTA
4. **DDD aggregatlarni to'liq ulash yoki olib tashlash** (2-bo'lim) — payroll-record/employee/invoice sifatli lekin orphan; qaror: ular yozuv-yo'li bo'lsin yoki o'chsin (deklarativ qoldirmaslik).
5. **AI modul konsolidatsiyasi** (5.2) — ai/ai-agents/aisha/agents (173 fayl) chegaralarini aniqlashtirish.
6. **`fi` ghost modulni `finance` ga qo'shish** (5.2) — 1 fayl.

### 🟡 KICHIK (tezda)
7. **`reviewer-file-size.sh:22` `head -2000` bug** ni tuzatish (8.1) — CI ishonchini tiklash.
8. **Repo naming standartlash** — `.repo.ts` vs `.repository.ts` (513 fayl) bittaga.
9. **CLAUDE.md reviewer baseline raqamlarini yangilash** (678→5, 143→2) — hujjat eskirgan.
10. **`madge` o'rnatib circular-deps reviewer yoqish** (hozir SKIP).
11. **2 generated fayl** (migrations-drift, schema-db-only) — `.gitattributes` linguist-generated yoki bo'lish (past prioritet, data).

---

## 11. XULOSA

EuroPrint ERP arxitekturasi **ikki yuzli**: mikro-darajada intizomli (fayl hajmi, guard, Result pattern, event/CQRS skeleton — hammasi yaxshi), makro-darajada bo'lingan (ikki yozuv-yo'li, ikki schema olami, 4 AI moduli, 14,819-satrli compatibility monolit). Bu **bir necha avlod refactor va dedup sessiyalarining qatlamlanishi** natijasi — har sessiya yangi toza qatlam qo'shgan, lekin eskisini to'liq olib tashlamagan, shuning uchun yangi+eski yonma-yon. Eng muhim arxitektura qarzi — **bitta jadval ortida ikki repo/ikki model** (CRM da isbotlangan) va **ikki nomuvofiq schema olami**. Ikkalasi ham real, lekin ish-vaqti correctness bug'i EMAS (DB superset qoplaydi) — ular **comprehension/maintenance qarzi**. CLAUDE.md dagi reviewer raqamlari sezilarli eskirgan: kod amalda o'sha hujjat ko'rsatganidan ancha sog'lom (array-safety 678→5, result-pattern 143→2). Yagona haqiqiy reviewer bug'i — `file-size.sh` `head -2000` (2552 fayl jim o'tkaziladi). Tavsiya: yangi qatlam qo'shishni to'xtatib, **konvergensiya** ga o'tish (bitta yozuv-yo'li, bitta schema, compatibility taqsimoti) — lekin bu inson nazorati ostida, gate (tsc) bilan, blind avtomatsiz.

*Tahlil 2026-06-02 — kod (Read/Grep) + 13 reviewer skript jonli ishga tushirildi + DB struktura. Hech narsa o'zgartirilmadi.*
