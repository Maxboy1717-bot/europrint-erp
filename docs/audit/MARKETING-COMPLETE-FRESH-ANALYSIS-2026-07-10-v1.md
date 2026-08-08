# Marketing Moduli — To'liq Yangi Tekshiruv (v1)

> **Sana:** 2026-07-10 · **Rol:** 🔵 Tahlilchi · **READ-ONLY** — hech bir kod, sxema, konfiguratsiya yoki ma'lumot o'zgartirilmadi.
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` va `BEGIN…ROLLBACK` probe'lari (har biri qaytarib olindi).
>
> **Metodologiya.** `docs/audit/` dagi hech bir hujjat Marketing bo'yicha haqiqat manbai sifatida ishlatilmadi; ular faqat "qayerga qarash" ko'rsatkichi bo'ldi. `SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md` faqat **struktura namunasi** sifatida ishlatildi. Har bir da'vo **shu tahlirda** olingan `fayl:qator` yoki `SQL + natija` bilan qo'llab-quvvatlangan. Tekshirilmagan narsalar `unverified` deb belgilangan (Q-40).
>
> **Ish tartibi:** deterministik inventar (marshrut/endpoint/rol skriptlari) → 7 mustaqil read-only agent → **har bir P0 da'vo shaxsan qayta tekshirildi**.

⚠️ **Parallel sessiya.** Ish daraxtida bitta commit qilinmagan o'zgarish bor: `apps/api/src/modules/compatibility/crm-extended.controller.ts` (`git status: M`). Bu fayl `@Controller('marketing')` bazasiga ham ega (`:100`), shuning uchun Marketing qamroviga tegadi. Phase-3 commit'laridan oldin qayta tekshirilsin (Q-24).

---

## 0. Eng kritik topilma (bir jumlada)

**Marketing modulida ma'lumot bor, lekin u ekranga yetib bormaydi.** Modulning uchta eng qimmatli ekrani jonli ma'lumotga qarshi **bo'sh yoki noto'g'ri** ko'rsatadi, va uchalasining sababi FE↔BE shartnoma xatosi:

| Ekran | Bazada | Ekranda | Sabab |
|---|---|---|---|
| **Lidlar** (`/marketing/leads`) | **14 lid** | bo'sh ro'yxat | BE `{data,total,page,limit}` konverti qaytaradi; `api-request.ts:282-291` faqat `{ok:true,data}` ni ochadi; sahifada `select: selectArray` yo'q → `Array.isArray(leads)` false → `[]` |
| **ROI / ROAS** (`/marketing/analytics`) | byudjet **59 000 000**, sarf **31 650 000** | **`Infinity%`** | repo `spent_amount AS "spentAmount"` (`campaigns.repository.ts:25`), FE `c.spent` o'qiydi (`MarketingExtended.tsx:59`) → `totalSpent=0` → `roi = (59M−0)/0` (`:60`) |
| **Byudjet** (`/marketing/budget`) | `marketing_budget_lines` da **12 qator** | "byudjet yozuvlari yo'q" | sahifa `marketing_budget_items` (0 qator) ni o'qiydi va yozadi (`drizzle-marketing-group2.repo.ts:206,239`) — **butunlay boshqa jadval** |

Yonidagi ikkinchi P0 (SD/CRM dagi bilan bir xil sinf): **117 Marketing endpointidan 74 tasi `manager` roli uchun 403 qaytaradi**, chunki BE `marketing_manager` talab qiladi va jonli bazada bunday rolga ega **birorta foydalanuvchi yo'q** (27 foydalanuvchi `manager`). FE esa `useAuth.tsx:17` da `manager → director` aliasini qo'llaydi va izohda *"Mirror backend ROLE_ALIASES"* deydi — **backend'da bunday alias jadvali umuman mavjud emas** (grep: 0 natija).

---

## 1. SAHIFA INVENTARI (noldan chiqarilgan)

### 1.1 Manba va usul

Sidebar: `artifacts/erp-dashboard/src/components/sidebar/constants.ts:150-176` (guruh `tz02` "Marketing", `defaultUrl: marketing/dashboard`).
Marshrutlar: `routes/CRMRoutes.tsx:92-107` (`MARKETING_ROUTES`).
Rol darvozasi: `routes/AppRouter.tsx:110` → `<ModuleGroup roles={MARKETING_ROLES}>`; `roleConstants.ts:24` → `MARKETING_ROLES = ['admin','manager','director']`.

### 1.2 Raqamlar (shu tahlirda hisoblangan)

| O'lchov | Qiymat |
|---|---|
| `/marketing/*` ro'yxatdan o'tgan marshrut | **16** |
| Sidebar orqali ochiladi | **16 / 16** |
| **ORPHAN marshrut** | **0** |
| Sidebar yozuvi (separator'siz) | 16 |
| Sahifa komponenti (5 tasi bitta tab-host) | 12 |
| FE fayl (test'siz) | 29 fayl, ~5 965 qator |
| BE controller | 8 (+1 compat) — **hammasi ro'yxatda** |
| BE endpoint (`/marketing/*`) | **117** |
| FE→BE unikal chaqiruv | 53 |
| **FE chaqiradi, BE'da yo'q (drift)** | **0** |
| **BE bor, FE hech qachon chaqirmaydi** | **24** |

> ⚠️ **Feature-flag nuance.** `constants.ts:740-742` izohi: *"Marketing (tz02) backend has ~60/99 endpoints returning 501"* va modul `FEATURE_MARKETING` bo'lmasa yashiriladi. Lekin bayroq **default `true`** (`lib/feature-flags.ts:33`), ya'ni modul **ko'rinadi**. Ustiga, shu tahlirdagi grep bo'yicha Marketing BE'da **birorta ham `501`/`notImplemented` yo'q** (faqat bitta doc-izoh, `marketing-analytics.controller.ts:5`). **Izoh eskirgan.**

### 1.3 Sahifalar ro'yxati

| # | Yo'l | Komponent | Sidebar | Route |
|---|---|---|---|---|
| 1 | `/marketing/dashboard` | MarketingDashboard | `constants.ts:155` | `CRMRoutes.tsx:92` |
| 2 | `/marketing/leads` | MarketingLeads | `:156` | `:95` |
| 3 | `/marketing/campaigns` | MarketingCampaigns | `:157` | `:93` |
| 4 | `/marketing/content` | MarketingContent | `:159` | `:94` |
| 5 | `/marketing/social-inbox` | MarketingSocialInbox | `:160` | `:101` |
| 6 | `/marketing/calendar` | MarketingCalendar | `:161` | `:96` |
| 7 | `/marketing/exhibitions` | MarketingExhibitions | `:163` | `:97` |
| 8 | `/marketing/pr` | MarketingPR | `:164` | `:98` |
| 9 | `/marketing/analytics` | MarketingExtended → tab `roi` | `:166` | `:103` |
| 10 | `/marketing/seo` | MarketingExtended → tab `seo` | `:167` | `:104` |
| 11 | `/marketing/ab-testing` | MarketingExtended → tab `ab` | `:168` | `:105` |
| 12 | `/marketing/competitors` | MarketingExtended → tab `comp` | `:169` | `:106` |
| 13 | `/marketing/nps-churn` | MarketingExtended → tab `nps` | `:170` | `:107` |
| 14 | `/marketing/website-cms` | MarketingWebsiteCMS | `:172` | `:102` |
| 15 | `/marketing/budget` | MarketingBudget | `:173` | `:99` |
| 16 | `/marketing/settings` | MarketingSettings | `:174` | `:100` |

Tab xaritasi `MarketingExtendedTypes.ts:84-90` — 5 marshrut ↔ 5 tab, **orphan tab yo'q**.

### 1.4 Sahifalar: nima qiladi ↔ nima qilyapti ↔ nima buzuq

Barcha nomlangan controllerlar ro'yxatda: `marketing.module.ts:53-62`, `app.module.ts:142`; compat — `compatibility.module.ts:109-110`.

---

**1. `/marketing/dashboard` — Dashboard**
*Maqsad:* marketing umumiy ko'rinishi — 7 stat karta, faol kampaniyalar, lid-manba kanallari, byudjet xulosasi, mijoz segmentlari, AI hot-lidlar, AI-yordamchi chat, NPS va churn panellari.
*Bugun:* asosiy manba `GET /api/marketing/dashboard/stats` (`marketing-content.controller.ts:41` → `drizzle-marketing-ext.repo.ts:116`) — **real so'rovlar** `marketing_campaigns` + `marketing_leads` ustida.
*Buzuq:*
- **"Sarflangan"/"Qoldiq" doim noto'g'ri** — `getDashboardStats` `totalSpent` ni **umuman qaytarmaydi** (`repo:139-147`), FE `stats?.totalSpent` o'qiydi → 0; "Qoldiq" = to'liq byudjet.
- **"Faol kampaniyalar" paneli doim bo'sh** — `GET /api/marketing/campaigns` konvert qaytaradi, sahifada `select: selectArray` yo'q (`MarketingDashboard.tsx:33-35`) → `[]`, holbuki 4 kampaniya faol.
- **NPS paneli doim `—`** — BE `{npsScore,promoters,passives,detractors,monthlyTrend}` (`repo:439`), FE `avgScore/monthlyAvg/totalResponses/lastComments` kutadi (`MarketingDashboardTypes.ts:62-68`) — kalitlar mos emas, holbuki `nps_responses` da 9 qator bor.
- **Churn paneli doim "barcha mijozlar faol"** — BE **massiv** qaytaradi, FE `{total,customers,riskCounts}` obyekt kutadi (`Types.ts:40-44`).
- **AI-yordamchi — green-lie.** `POST /marketing/ai-assistant` (`marketing-analytics-stubs.controller.ts:230`) xabarni `marketing_settings` ga saqlaydi va **qattiq yozilgan** javob qaytaradi: `'AI provayder hali ulanmagan. So'rovingiz qabul qilindi.'` (`:239`), `ai_provider:'pending'`. Ekranda bu javob AI javobi sifatida ko'rsatiladi.

**2. `/marketing/leads` — Lidlar**
*Maqsad:* lid quvuri — filtrlash (hammasi / issiq ≥60 / muddati o'tgan / yo'qotilgan), yaratish/tahrirlash, CRM'ga konvertatsiya, kontakt jurnali, ballarni qayta hisoblash, yo'qotish tahlili.
*Bugun:* 11 endpoint, hammasi jonli va real. **Yozuv yo'llari haqiqiy** (rollback-probe bilan tasdiqlangan): lid yaratish `marketing_leads` 14→15; CRM'ga konvertatsiya `crm_leads` 16→17 va `marketing_leads.crm_lead_id` to'ladi; **ballarni qayta hisoblash 12 qatorni o'zgartiradi** (masalan `demo-lead-002` 54→60) — echo emas.
*Buzuq:*
- 🔴 **Ro'yxat 14 qator borligiga qaramay bo'sh** — konvert bug'i (yuqorida). Tuzatish: `MarketingLeads.tsx:62` ga `select: selectArray<MarketingLead>` qo'shish (aynan `MarketingCampaigns.tsx:126` qilgani kabi).
- 🟠 **Voronka dialogi bosqichlarni ko'rsatmaydi** — BE `{stages,total,conversionRate}` (`repo:420`), FE `FunnelStage[]` kutadi (`MarketingLeadsDialogs.tsx:192`).
- Yaratish DTO'si (`marketing-analytics.controller.ts:34-41`) faqat name/email/phone/source/status/notes ni oq ro'yxatga oladi; `company/channel/score/lostReason` `.passthrough()` orqali o'tadi va repo ularni yozadi — ishlaydi, lekin shartnoma nozik.

**3. `/marketing/campaigns` — Kampaniyalar**
*Maqsad:* kampaniya CRUD, ishga tushirish, kengaytiriladigan statistika (lidlar, konversiya, ROI, ROAS, CPL, CPA).
*Bugun:* 6 endpoint, hammasi real; yozadigan jadval — **`marketing_campaigns`** (6 qator), `campaigns` (0 qator) **emas** (`campaigns.repository.ts:34,51`). Yaratish va ishga tushirish rollback-probe bilan **REAL** deb tasdiqlangan.
*Buzuq:*
- 🔴 **Statistika har doim nol** — `drizzle-marketing-ext.repo.ts:83-95` `marketing_ads` ni faqat `/^\d+$/.test(id)` bo'lsa qo'shadi. Jonli DB: `marketing_campaigns.id` = **varchar** (`demo-camp-002`), `marketing_ads.campaign_id` = **integer** → hech qachon mos kelmaydi → impressions/clicks/conversions = 0, ROAS/CPL/CPA = `—`.
- 🟠 **Progress bar soxta** — `MarketingCampaigns.tsx:272` kenglikni status bo'yicha qattiq yozadi (`completed→100%`, `active→65%`, aks holda `15%`), real ko'rsatkich emas.
- `manager` roli ro'yxat GET'ida **403** (`marketing.controller.ts:62` `sales_manager` talab qiladi).

**4. `/marketing/content` — Kontent**
*Maqsad:* kontent postlari kartochkalari, statuslar, platforma filtri, yaratish/tahrirlash dialogi (Kontent + AI tab), publish/delete.
*Bugun:* CRUD `marketing_content_posts` ustida (`drizzle-marketing-ext.repo.ts:151-204`); AI-generate esa **boshqa jadvalga** — `marketing_content` (`stubs:131`).
*Buzuq:*
- 🔴 **Ro'yxat hech qachon chizilmaydi** — BE `{data,total,page,limit}` (`repo:157`), konvert ochilmaydi, `Array.isArray` false (`MarketingContent.tsx:142`).
- 🔴 **Yaratish `NOT NULL` cheklovida yiqiladi.** Repo faqat `title, content, post_type, author_id` beradi (`repo:170-175`), `platform` ni **hech qachon**. Jonli DB: `platform` va `content` — **NOT NULL, default yo'q**.
  **Rollback-probe (shu tahlirda):** `INSERT INTO marketing_content_posts (title,content,post_type,author_id) VALUES ('probe',NULL,'blog',NULL)` → **`XATO: значение NULL в столбце "platform" … нарушает`**.
  Ustiga FE `body` yuboradi, repo `content` o'qiydi (`MarketingContent.tsx:186`). Shu sababli `marketing_content_posts` = 0 qator.
- FE `hashtags/scheduledAt/status/platform/mediaUrls/campaignId` — hech biri saqlanmaydi.
- **AI-generate — green-lie.** Model chaqirilmaydi; `ai_provider:'pending'` (`stubs:135`). Ustiga, u yozgan draft `marketing_content` ga tushadi, ro'yxat esa uni **hech qachon so'ramaydi**.

**5. `/marketing/social-inbox` — Social Inbox**
*Maqsad:* ikki panelli inbox — suhbatlar ro'yxati (platforma/status filtri, 15 s poll), yozishma, javob qutisi, "AI javob", status o'zgartirish.
*Bugun:* 6 endpoint, hammasi real SQL — lekin **`social_conversations` = 0**, **`social_messages` = 0**.
*Buzuq:*
- 🔴 **Tashqi integratsiya umuman yo'q.** Butun `modules/marketing` bo'ylab `axios|fetch(|HttpService|telegram.org|graph.facebook` — **0 natija**. Yagona "webhook" endpoint (`stubs:679`) faqat `social_api_configs` ga token/URL yozadi; Telegram'ning `setWebhook` ini **chaqirmaydi**. **Kiruvchi xabar qabul qiluvchi endpoint yo'q.**
- `social_messages` ga yagona yozuvchilar — `reply` (`:357`) va `ai-reply` (`:377`), ikkalasi ham `direction='outbound'`. Ya'ni **javob saqlanadi, lekin hech qayerga yuborilmaydi**.
- **AI javob — green-lie**: "AI provayder hali ulanmagan" matnini `social_messages` ga yozadi (`:370-385`).

**6. `/marketing/calendar` — Taqvim**
*Maqsad:* oylik grid, "yangi reja" dialogi, kunlar bo'yicha tadbirlar, o'chirish.
*Bugun:* `marketing_calendar_events` ustida (`drizzle-marketing-group2.repo.ts:282-334`); jadval va repo **ishlaydi** (rollback-probe: to'g'ri sana bilan INSERT → OK).
*Buzuq:*
- 🔴 **Yaratish bu formadan hech qachon muvaffaqiyatli bo'lmaydi.** `CreateCalendarEventSchema` **`.strict()`** va `startDate` (`YYYY-MM-DD`) talab qiladi (`marketing-group2.controller.ts:59-66`). FE esa `{title, content, platform, type, status, scheduledDate, assignedTo}` yuboradi (`MarketingCalendar.tsx:62`) — `startDate` yo'q, 5 ta ortiqcha kalit → **ZodError 400**.
  **Rollback-probe:** repo fallback `start_date=''` → **`XATO: неверный синтаксис для типа date: ""`**; to'g'ri sana bilan → OK.
- 🟠 **Grid doim bo'sh** — repo `startDate` (camelCase) qaytaradi, FE `e.scheduledDate` o'qiydi (`MarketingCalendar.tsx:82`).
- 🟠 **`?month&year` filtri e'tiborsiz** — BE `from`/`to` o'qiydi (`ctrl:208-211`).

**7. `/marketing/exhibitions` — Ko'rgazmalar**
*Maqsad:* ko'rgazma kartochkalari, statistika, lid sub-paneli, QR tugmasi.
*Bugun:* 7 endpoint, `exhibitions` + `exhibition_leads` ustida real SQL. **Yaratish SQL darajasida ishlaydi** (rollback-probe: 1→2).
*Buzuq:*
- 🔴 **Byudjet kiritilsa 400** — FE matn maydonini **string** sifatida yuboradi (`MarketingExhibitions.tsx:139`), BE `z.number().optional()` (`stubs:47`).
- 🟠 **Sanalar doim tushib qoladi** — FE `startDate/endDate` (camel), INSERT `dto.start_date/end_date` (snake) o'qiydi (`stubs:472-473`).
- 🟠 `nameRu`, `teamMembers` — ustunlar mavjud, lekin INSERT/UPDATE ularni yozmaydi.
- QR tugmasi faqat `qr_code` ustuniga satr yozadi — haqiqiy QR rasm emas.

**8. `/marketing/pr` — PR Faoliyat**
*Maqsad:* PR faoliyatlari (matbuot relizi, media chiqish) CRUD.
*Bugun:* 4 endpoint, `pr_activities` ustida real SQL. **Yaratish to'liq ishlaydi** (rollback-probe: 0→1). `pr_activities` = 0 shunchaki hali hech narsa yaratilmagani uchun.
*Buzuq:* sahifa sarlavhasi **literal** — `title="Marketing {t('prMedia')}"` (`MarketingPR.tsx:79`) → ekranda jingalak qavslar ko'rinadi. `reach` maydoni ko'rsatiladi, lekin forma uni yig'maydi.

**9. `/marketing/analytics` — Tahlil (ROI/ROAS)** *(MarketingExtended → `roi`)*
*Maqsad:* 4 KPI (kampaniya soni, jami byudjet, sarflangan, ROI%) + kampaniyalar jadvali.
*Buzuq (uch qatlamli):*
- 🔴 **`Infinity%`** — repo `spentAmount` qaytaradi (`campaigns.repository.ts:25`), FE `c.spent` o'qiydi (`MarketingExtended.tsx:59`) → `totalSpent=0`; `roi = totalBudget>0 ? ((totalBudget−totalSpent)/totalSpent)*100 : 0` (`:60`) → `59 000 000 / 0`.
  **DB tasdig'i:** `SELECT sum(budget), sum(spent_amount) FROM marketing_campaigns` → `59 000 000` / `31 650 000` — ya'ni **haqiqiy sarf mavjud**.
- 🔴 **Bu ROI emas** — formula `(budget − spent)/spent` (byudjet utilizatsiyasi), va **daromad umuman olinmaydi**.
- 🔴 **Haqiqiy ROI dvigateli mavjud, lekin chaqirilmaydi** — `GET /marketing/analytics/channel-roi` (`marketing-analytics.controller.ts:216` → `drizzle-marketing-ext.repo.ts:588-614`) sarfni `marketing_ads.spent_amount` dan, daromadni `crm_deals.amount (status='won')` dan oladi. FE uni **hech qachon chaqirmaydi** (§4).

**10. `/marketing/seo` — SEO Monitoring** *(tab `seo`)*
🔴 **100% qattiq yozilgan.** Barcha qatorlar `MarketingExtendedTypes.ts:92-99` dagi `seoKeywords` literal massividan; KPI'lar shu literaldan TSX ichida hisoblanadi (`MarketingExtendedSections.tsx:113,117,121`). **Birorta BE chaqiruvi yo'q** (grep: `api/marketing/seo` → 0). Butunlay soxta ekran.

**11. `/marketing/ab-testing` — A/B Testing** *(tab `ab`)*
*Bugun:* `GET/POST /marketing/ab-tests` (`stubs:398,403`) → `marketing_ab_tests`. **Yaratish real** (rollback-probe OK).
*Buzuq:*
- 🔴 **Ro'yxat doim bo'sh** — BE `{items:[...]}` qaytaradi (`stubs:400`), FE massiv kutadi (`MarketingExtended.tsx:99`).
- 🔴 **Statistika hech qachon hisoblanmaydi** — `impressions/clicks/conversions` DB-default `0` bo'lib qoladi; ularni **oshiradigan yozuv yo'li yo'q** → A% va B% doim `0%`. Ahamiyatlilik (significance) testi yo'q.

**12. `/marketing/competitors` — Raqobatchilar** *(tab `comp`)*
*Bugun:* `GET /marketing/competitors` (`marketing-group2.controller.ts:287`) → `sd_customer_competitors` ustidan `GROUP BY`.
*Buzuq:*
- 🔴 **`competitors` / `marketing_competitors` jadvallari umuman mavjud emas** (jonli DB tekshiruvi). Manba — `sd_customer_competitors`, **0 qator**.
- 🔴 **Maydon nomlari mos emas** — repo `{name, customersCount, avgOurShare, avgTheirShare, switchRisk}` (`repo:341-346`), FE `{share, price, quality, delivery, weakness, companyName}` kutadi (`MarketingExtendedTypes.ts:64-73`) → ulush bari `width:${undefined}%`, qolganlari `—`.
- Yaratish formasi yo'q (faqat o'qish).

**13. `/marketing/nps-churn` — NPS va Churn** *(tab `nps`)*
*Bugun:* NPS **haqiqatan kodda hisoblanadi** (promoter ≥9, detractor <7, `(pro−det)/total*100` — `drizzle-marketing-ext.repo.ts:451-475`) va `nps_responses` da 9 qator bor. NPS javobi yozish **real INSERT**.
*Buzuq:*
- 🔴 **Oylik NPS kartalari doim bo'sh** — BE `{monthlyTrend:[...]}` (`stubs:150`), FE massiv kutadi; ustiga `monthlyTrend` elementlari faqat `{month,score}`, FE `responses/promoters/passives/detractors` kutadi.
- 🔴 **Churn ro'yxati doim bo'sh** — BE **massiv**, FE `{total,customers,riskCounts}` obyekt kutadi; maydon nomlari ham boshqa (`customerId` vs `id`).

**14. `/marketing/website-cms` — Web sayt CMS**
*Bugun:* blog CRUD + publish `blog_posts` ustida — **real** (`marketing-group2.controller.ts:101-146`). Katalog `/api/admin/products` ustida real CRUD.
*Buzuq:*
- 🔴 **Blog saqlashda maydonlar tushadi** — `createBlogPost` (`repo:134-145`) faqat `title/slug/body/excerpt/isPublished/authorId` yozadi; FE `coverImage/seoTitle/seoDescription/tags/isAiGenerated/viewCount` yuboradi va ko'rsatadi.
- **AI-generate — green-lie** (`stubs:710`, `ai_provider:'pending'`).
- `website_pages` (0 qator) bu sahifada **umuman ishlatilmaydi** — ishlatilmagan jadval, buzuq yo'l emas.
- Sarlavha raw `<h1>` (`:141`), `EPPageHeader` emas.

**15. `/marketing/budget` — Byudjet**
*Maqsad:* yillik byudjet moddalari, reja/fakt/qoldiq KPI, kategoriya bo'yicha guruhlash.
*Buzuq:*
- 🔴 **Noto'g'ri jadval.** Sahifa `marketing_budget_items` (**0 qator**) ni o'qiydi va yozadi (`drizzle-marketing-group2.repo.ts:206,239`; `marketing-group2.controller.ts:199`). Jonli 12 qator esa **`marketing_budget_lines`** da (boshqa ustunlar: `description`/`approved_by`) va **hech qachon o'qilmaydi**.
- 🔴 **Fakt sarf bilan taqqoslash yo'q** — `actualAmount` qo'lda kiritiladigan forma maydoni (`MarketingBudget.tsx:107`); `entries` yoki `marketing_ads` bilan hech qanday bog'lanish yo'q.
- Yaratish yo'li o'zi ishlaydi (rollback-probe: `marketing_budget_items` ga INSERT OK).

**16. `/marketing/settings` — Sozlamalar**
*Bugun:* 6 endpoint. **Social-API konfiguratsiyasi CRUD toza va real**; o'qishda `bot_token`/`webhook_secret`/`access_token` **maskalanadi** (`stubs:622-625`) — yaxshi amaliyot.
*Buzuq:*
- 🔴 **Umumiy sozlamalarni saqlash semantik jihatdan buzuq.** FE `{key, value, category, description}` obyektini yuboradi (`MarketingSettingsTypes.ts:17-22`), BE esa `z.record(z.string()).parse(body)` qilib **har bir forma maydon-nomini alohida qator** sifatida yozadi (`stubs:630-637`): `key="key"`, `key="value"`, `key="category"`… Ya'ni tanlangan sozlama **o'z nomi ostida hech qachon saqlanmaydi**. Ustiga bo'sh maydonlar `undefined` bo'ladi (`MarketingSettings.tsx:91`) → `z.record(z.string())` 400.
- `marketing_settings` = 0 shu sababdan.

---
## 2. MA'LUMOT YAXLITLIGI (har entity uchun, noldan)

### 2.1 ⚠️ Validatsiya qatlami haqida muhim fakt

Global pipe — `@anatine/zod-nestjs` `ZodValidationPipe` (`main-bootstrap.ts:197`) — faqat **ZodDto klass** sifatida yozilgan parametrlarni validatsiya qiladi. `campaign.dto.ts:9,25` `z.infer` **tipi**, ya'ni kampaniya DTO'si **umuman ishlamaydi**. Qolgan Marketing handlerlari `Schema.parse(body)` ni **handler ichida** chaqiradi — ular ishlaydi.

> Kinoya: `platform`/`status` kampaniyada **faqat DTO ishlamagani uchun** saqlanadi. Agar `CreateCampaignDtoSchema` yoqilsa, `platform` fake-save'ga aylanardi.

### 2.2 Kanonik jadval qarori (repo SQL bo'yicha)

| Entity | Raqobatchi jadvallar | **Kanonik (kod tegadi)** | Dalil |
|---|---|---|---|
| Kampaniya | `campaigns`(0) vs `marketing_campaigns`(6) | **`marketing_campaigns`** | `campaigns.repository.ts:33,51,66`; `marketing.controller.ts:100-103` izohi CQRS yo'li tashlanganini aytadi |
| Kontent | `content_posts`(0) vs `marketing_content`(0) vs `marketing_content_posts`(0) | **`marketing_content_posts`** (CRUD) | `drizzle-marketing-ext.repo.ts:153,170,183,197`. `marketing_content` ga faqat AI-stub yozadi (`stubs:131`). `content_posts` — hech kim tegmaydi |
| Byudjet | `budgets`(0) vs `marketing_budget_items`(0) vs **`marketing_budget_lines`(12)** | **`marketing_budget_items`** (kod) | `drizzle-marketing-group2.repo.ts:206,237`; `marketing-group2.controller.ts:199`. **12 qatorli `marketing_budget_lines` hech qachon o'qilmaydi** |

### 2.3 ⛔ To'rtta bloklangan / o'lik CREATE — rollback-probe bilan isbotlangan

| Entity | Sabab | Isbot (shu tahlirda, `BEGIN…ROLLBACK`) |
|---|---|---|
| **Kontent posti** | DTO `.passthrough()` **emas** (`marketing-ext.dto.ts:9-15`) → FE `platform`/`body` chiqarib tashlanadi; repo `content`/`platform` ni **hech qachon** bermaydi (`repo:170-175`). Jonli: ikkalasi **NOT NULL, default yo'q** | `INSERT (title,content,post_type,author_id) VALUES ('probe',NULL,'blog',NULL)` → **`XATO: NULL в столбце "platform"`**; `platform` qo'shilsa → **`XATO: NULL в столбце "content"`**; ikkalasi berilsa → OK |
| **Lid kontakti** | Jonli `marketing_lead_contacts.lead_id` = **integer**, `contacted_by` = **integer**; haqiqiy lid id'lari — **varchar slug** (`demo-lead-004`) | `INSERT … lead_id='demo-lead-004'` → **`XATO: неверный синтаксис для типа integer`** |
| **Taqvim tadbiri** | `CreateCalendarEventSchema` **`.strict()`**, `startDate` majburiy (`marketing-group2.controller.ts:59-66`); FE `scheduledDate` + 5 ortiqcha kalit yuboradi | Repo/DB sog'lom (to'g'ri sana bilan INSERT → OK); repo fallback `start_date=''` → **`XATO: неверный синтаксис для типа date: ""`** |
| **Blog posti (CMS)** | `CreateBlogPostSchema` **`.strict()`** faqat `titleUz/titleRu/slug/bodyUz/bodyRu/excerpt/authorId` qabul qiladi; FE doim `coverImage/seoTitle/seoDescription/tags` yuboradi | Kod-isbot; DB/id qatlami sog'lom |

### 2.4 Fake-save / jimgina tushib qolgan maydonlar

| Entity | Amal | Tushib qolgan | Dalil |
|---|---|---|---|
| Kontent | CREATE+UPDATE | `platform, status, hashtags, scheduledAt, body`; DTO qabul qilgan `tags, category` ham yozilmaydi | `marketing-ext.dto.ts:9-15` ↔ `repo:170-189` |
| **Inbox javobi** | reply | ⭐ **xabar matni** — FE `{text}` yuboradi (`MarketingSocialInbox.tsx:68`), handler `dto.message ?? dto.content` o'qiydi (`stubs:360`) → `text` ustuniga **bo'sh satr** yoziladi | fresh o'qish |
| Ko'rgazma | CREATE | `startDate`, `endDate` (camel↔snake), `nameRu`, `teamMembers` | `stubs:472-473` |
| Blog | CREATE | `coverImage, seoTitle, seoDescription, tags, isAiGenerated, viewCount` | `drizzle-marketing-group2.repo.ts:134-145` |
| Kampaniya | — | `goals` ustuni hech kim tomonidan yozilmaydi (uxlab yotgan) | — |

### 2.5 Tur-drifti (TYPE-DRIFT)

| Joy | Drift | Oqibat |
|---|---|---|
| `marketing_lead_contacts.lead_id` (int) ↔ `marketing_leads.id` (varchar) | integer vs varchar slug | Har qanday kontakt yaratish `22P02` |
| `marketing_ads.campaign_id` (int) ↔ `marketing_campaigns.id` (varchar) | integer vs varchar | Reklama statistikasi kampaniyaga **hech qachon** qo'shilmaydi → impressions/clicks/conversions = 0 |
| `social_messages.conversation_id` (int) ↔ `social_conversations.id` (varchar) | `parseInt(slug)` → `0` | Xabarlar yetim qolishi mumkin (0 qator — **unverified** runtime'da) |

### 2.6 Green-lie tekshiruvi (rollback-probe yoki yetib bo'lmas yo'l bilan)

| Amal | Verdikt | Dalil |
|---|---|---|
| Kampaniya create / launch / pause | **REAL** | probe: `marketing_campaigns` 6→7; `demo-camp-005` → `status='active'` |
| Lid create | **REAL** | probe: 14→15 |
| **Lid ballarini qayta hisoblash** | **REAL** | probe: 12 qator o'zgardi (`demo-lead-002` 54→60) — echo emas |
| Lid → CRM konvertatsiya | **REAL** | probe: `crm_leads` 16→17, `crm_lead_id` to'ladi |
| Churn AI-signal | **REAL** | `UPDATE marketing_leads.score` |
| Lid soft-delete | **REAL** | 0 qator bo'lsa `NOT_FOUND` |
| PR create/update | **REAL** | probe: `pr_activities` 0→1 |
| Ko'rgazma create | **PARTIAL** | qator tushadi, sanalar/`name_ru`/`team_members` yo'qoladi; byudjet kiritilsa 400 |
| Byudjet moddasi create | **REAL** (yozuv qatlami) | probe OK — lekin **noto'g'ri jadval** (§2.2) |
| A/B test create | **REAL** | probe OK |
| NPS javob create | **REAL** | probe OK |
| Blog publish | **REAL** | `UPDATE … RETURNING` |
| **Kontent create** | ⛔ **UNREACHABLE** | 23502 × 2 (§2.3) |
| **Lid kontakti create** | ⛔ **UNREACHABLE** | 22P02 (§2.3) |
| **Taqvim create** | ⛔ **UNREACHABLE (FE 400)** | `.strict()` |
| **Blog create** | ⛔ **UNREACHABLE (FE 400)** | `.strict()` |
| **Inbox javob** | 🟠 **PARTIAL** | qator tushadi, **matn bo'sh** |
| **AI-yordamchi** | ⛔ **GREEN-LIE** | qattiq yozilgan javob (`stubs:239`) |
| AI-generate (kontent / blog) | **REAL (halol stub)** | draft qator yoziladi, `ai_provider:'pending'` |
| AI-javob (inbox) | **REAL (halol stub)** | placeholder qator yoziladi |
| **A/B stop / g'olibni e'lon** | ⛔ **UNREACHABLE (route yo'q)** | faqat `GET`+`POST /ab-tests` |
| **Byudjetni qayta hisoblash** | ⛔ **UNREACHABLE (route yo'q)** | endpoint mavjud emas |
| **Raqobatchi sync** | ⛔ **route yo'q** | faqat `GET`, read-only |
| Sozlamalar / social-API CRUD | **REAL** | parametrlangan `INSERT … ON CONFLICT` |

> **Muhim nuance:** `marketing-analytics-stubs.controller.ts` nomiga qaramay, **har bir handler real SQL bajaradi**; `501`/`notImplemented` **birorta ham yo'q**. Yagona soxta xatti-harakat — AI handlerlarining qattiq yozilgan javobi (`ai_provider:'pending'`), va ular baribir qator yozadi.

---

## 3. RBAC TO'G'RILIGI (mavjudligi emas — to'g'riligi)

### 3.1 Mo'ljallangan siyosat

Global guard zanjiri: `app.module.ts:195-199` — `FastifyThrottlerGuard → JwtAuthGuard → RolesGuard → SodGuard → PermissionGuard`.

`RolesGuard` (`common/guards/roles.guard.ts`):
- `@Roles()` metadata yo'q → `return true` (`:61-67`) — har qanday autentifikatsiyalangan foydalanuvchi.
- Bypass (`:89-91`): `admin | super_admin | director`.
- Aks holda literal solishtirish (`:93-100`), **alias jadvali yo'q**.

Satr-scoping helperlari loyihada mavjud — `modules/crm/common/crm-row-scope.ts:15-30` va `common/auth/owner-scope.ts:15-32` — lekin **ikkalasi ham `modules/marketing` da hech qayerda import qilinmaydi**.

**Mo'ljal:** privilegiyali rollar hammasini ko'radi; oddiy egasi faqat o'ziniki (`assigned_to = self`); identifikatsiyasiz — hech narsa.

### 3.2 ⛔ P0 — Rol satri nomuvofiqligi

Jonli `users`:

| role | soni |
|---|---|
| `manager` | **27** |
| `super_admin` | 3 |
| `director` | 1 |
| `employee` | 1 |

`SELECT count(*) FROM users WHERE role IN ('marketing_manager','marketing','content_manager')` → **0**
`SELECT count(*) FROM employees WHERE COALESCE(role,'')='marketing_manager'` → **0** (31 xodimning hammasida `role` NULL)

Marketing controllerlaridagi `@Roles` chastotasi (shu tahlirda sanalgan): `super_admin` 78, **`marketing_manager` 74**, `director` 50, `manager` 10, `sales_manager` 8.

**Dasturiy hisob (117 endpoint):**

| Real rol (soni) | Kira oladi | 403 |
|---|---|---|
| `super_admin` (3) | **117** | 0 |
| `director` (1) | **117** | 0 |
| **`manager` (27)** | **43** | **74** |
| `employee` (1) | 0 | 117 |
| `marketing_manager` (**0**) | — | — |

**`@Roles` siz endpoint — 0 ta** (SD/CRM dan yaxshiroq: u yerda ochiq endpointlar bor edi).

### 3.3 ⭐ FE↔BE alias yolg'oni

`artifacts/erp-dashboard/src/hooks/useAuth.tsx:16-19`:
```ts
// Mirror backend ROLE_ALIASES so UI permissions consistently match server authorization
const ROLE_ALIASES: Record<string,string> = {
  admin: "super_admin", …
  director: "director", ceo: "director", manager: "director",   // ← manager → director
  …
};
```
`hasRole` (`:123-129`) shu aliasni qo'llaydi.

**Lekin backend'da `ROLE_ALIASES`/`normalizeRole`/`roleAlias` — grep bo'yicha 0 natija.** Izoh noto'g'ri.

Oqibat: `manager` roli FE'da `director` ga aylanadi → sahifa ochiladi; backend esa literal `manager` ni ko'radi va 74/117 endpointda **403** beradi. FE `MARKETING_ROLES` (`roleConstants.ts:24`) ham `super_admin` va `marketing_manager` ni **o'z ichiga olmaydi** — `super_admin` faqat `hasRole` ning short-circuit'i tufayli o'tadi.

### 3.4 Uch holat bo'yicha tasnif

**Marketing modulida (a) ham, (b) ham yo'q — hamma narsa (c).** Hech bir list/detail so'rovi egalik bo'yicha filtrlamaydi; faqat `deleted_at` va path `:id`.

| Entity | Holat | Izoh |
|---|---|---|
| **Lidlar** | **(c) — haqiqiy bo'shliq** | `marketing_leads.assigned_to` **yoziladi** (`leads.repository.ts:61-74`), lekin **hech bir o'qish yo'li uni filtrlamaydi**. DB: 14/14 lid `assigned_to = 1` |
| Kampaniyalar | (c) — latent | `created_by` ustuni bor, WHERE'da ishlatilmaydi |
| Ko'rgazma, PR, blog, byudjet, taqvim, sozlamalar, A/B, inbox | (c) — **loyihaviy** | Bu tashkilot-umumiy resurslar; egalik tushunchasi yo'q, shuning uchun hammaga ko'rinishi to'g'ri |

**Ildiz sabab:** Marketing `LeadsRepository`/`LeadsService` hech qachon `crmOwnerScope`/`scopedOwnerId` ga ulanmagan (bu helperlar CRM-modul-lokal).

### 3.5 IDOR ro'yxati (kenglik bo'yicha, oshirib yubormasdan)

1. **Lidlar — haqiqiy bo'shliq (o'rta).** `assigned_to` egalikni kodlaydi, lekin e'tiborsiz. `manager` (27 foydalanuvchi) **har qanday lidni o'qiy va tahrirlay oladi**: `GET/PUT /marketing/leads/:id`, `PATCH /:id/status` (class `@Roles(super_admin,director,manager)`), repo egalikni tekshirmaydi. (`PATCH /:id`, `convert-to-crm`, `DELETE` — `marketing_manager`/`sales_manager` bilan yopilgan, ya'ni `manager` ular uchun 403.)
2. **Kampaniyalar — latent (past).** `created_by` e'tiborsiz, lekin endpointlar `sales_manager`/privilegiyaliga yopiq; `sales_manager` foydalanuvchi yo'q → amalda faqat 4 privilegiyali kiradi.
3. Ko'rgazma / PR / blog / byudjet / taqvim / sozlamalar / A/B / inbox — egalik ustuni yo'q, umumiy ko'rinish loyihaviy. Klassik IDOR emas.

**Anonim IDOR yo'q** — `@Roles` siz yoki `@Public()` marketing endpointi mavjud emas.

### 3.6 Public / webhook

- **Marketing qamrovida `@Public()` — 0 ta.**
- Yagona "webhook" shaklidagi route — `POST /marketing/settings/setup-telegram-webhook` (`stubs:679`) — autentifikatsiyalangan, faqat token saqlaydi.
- Sozlamalarni o'qishda `bot_token`/`webhook_secret`/`access_token` **maskalanadi** (`stubs:622-625`) — yaxshi amaliyot.
- ⚠️ Haqiqiy ommaviy lid/social intake `modules/bot-gateway/bot-gateway.controller.ts:47-48` (`@Public() @Controller('bot')`) va `crm-auto-lead` da — bazasi `/marketing` emas, shuning uchun bu qamrovdan tashqarida. **Ularning imzo-gardi bu tahlirda tekshirilmadi (`unverified`).**

---

## 4. ORPHAN SWEEP (100% ishonch)

### 4.1 Frontend

**Orphan marshrut — 0.** 16/16 `/marketing/*` marshruti sidebar'da. `MarketingExtended` ning 5 tabi ham 5 marshrutga to'liq mos (`MarketingExtendedTypes.ts:84-90`) — orphan tab yo'q.

29 Marketing FE fayli (test'siz, ~5 965 qator) tekshirildi: har biri yo marshrutda, yo o'z sahifasining yordamchi fayli. **O'lik sahifa yo'q.**

### 4.2 Backend

8 controller (+1 compat) — **hammasi ro'yxatda, birortasi ham o'lik emas**.

**Lekin 117 endpointdan 24 tasini FE hech qachon chaqirmaydi** — har birining FE'da yo'l-satri **0 marta** uchraydi:

| Guruh | Endpointlar | Baho |
|---|---|---|
| ⭐ **Haqiqiy analitika dvigateli** | `/analytics/{overview,campaigns,channel-roi,conversion,audience,order-trend}` (6) | **Eng qimmat yo'qotish.** `channel-roi` sarfni `marketing_ads` dan, daromadni `crm_deals (won)` dan oladi (`drizzle-marketing-ext.repo.ts:588-614`) — ROI tabi uni chaqirmasdan o'zining buzuq matematikasini hisoblaydi |
| Email shablonlari | `/email/templates` (+`/:id`) — 4 | Butun sirt ishlatilmaydi (`marketing_email_templates` = 0) |
| Social hisoblar / postlar | `/social/{accounts,posts}` (+`/:id`) — 6 | Inbox sahifasi ularni chaqirmaydi |
| NPS so'rovlari | `/nps-requests` (+`/:id/responded`) — 2 | Avtomatik NPS zanjiri (§5) |
| Menejer KPI / mijoz ritmi | `/managers/kpi`, `/customers/:id/rhythm` — 2 | Hech qayerda ko'rinmaydi |
| Kontent analitikasi / taqvimi | `/content/{analytics,calendar}` — 2 | — |
| Hisobotlar | `/reports` (+`/:id`) — 2 | — |
| Boshqa | `/papka-lookup`, `/design-workload`, `/marketing` (root) — 3 | — |

> **Muhim:** bu 24 tasi "o'lik kod" emas — **ulanmagan qiymat**. Ayniqsa `analytics/*` guruhi: haqiqiy ROI hisoblovchi allaqachon yozilgan.

---

## 5. INTEGRATSIYA VA BOG'LIQLIK XARITASI (DB-isbot bilan)

### 5.1 Event inventari

**Marketing chiqaradi (jami 1 ta emit):**

| Event | Emitter | Tinglovchi | Holat |
|---|---|---|---|
| `CampaignCreatedEvent` | `create-campaign.handler.ts:34` | **hech kim** | 🔴 zero-listener |
| `CampaignActivatedEvent` | e'lon qilingan (`domain/events/index.ts:11`), **hech qachon chiqarilmaydi** | — | 🔴 o'lik klass |
| `CampaignCompletedEvent` | e'lon qilingan (`:18`), chiqarilmaydi | — | 🔴 o'lik klass |

**Marketing tinglaydi (1 ta):**

| Event | Listener | Emitter | Ro'yxatda | Yozadi |
|---|---|---|---|---|
| `DELIVERY_COMPLETED` | `nps-auto-request.listener.ts:18` | `logistics.controller.ts:143` | ✅ `marketing.module.ts:78` | `nps_requests` |

### 5.2 Zanjirlar

**(a) Marketing lid → CRM lid** — 🟠 **qisman ishlaydi**
Konverter `stubs:286-318`: `INSERT INTO crm_leads (…)` (`:297`) + `UPDATE marketing_leads SET crm_lead_id=…, status='converted'` (`:312`). Qiymat bo'yicha **nusxa**, FK yo'q.
DB: `marketing_leads` 14 qator, `crm_lead_id` **2 tasida** to'ldirilgan; ikkala `crm_leads` qatori mavjud.
🔴 **Lekin egalik yo'qoladi:** konverter `assigned_to`/`manager_id` yozmaydi → yaratilgan `crm_leads` qatorlari **egasiz**, ya'ni CRM'ning owner-scoped ko'rinishida ko'rinmaydi.
🔴 **Dedup yo'q:** `marketing_leads` da yagona indeks — `marketing_leads_pkey`. Telefon/email bo'yicha unique yo'q.

**(b) Kampaniya → SD daromadi (ROI)** — 🔴 **butunlay uzilgan**
- `sales_orders`, `entries`, `sd_customers` da **`campaign_id` ustuni yo'q** — attribusiya yo'li mavjud emas.
- Yagona daromad qo'shilishi — `getAttributedRevenueByCampaign` (`drizzle-marketing-ext.repo.ts:50`): `marketing_campaigns → marketing_leads(campaign_id) → crm_deals(lead_id)`. Ikkala qo'shilish ham nol beradi:
  - `marketing_leads.campaign_id` — **0/14** to'ldirilgan; ustiga tur drifti (int ↔ campaigns.id varchar).
  - `crm_deals.lead_id` — **0/5** to'ldirilgan; tur ham semantika ham noto'g'ri (uuid ↔ `crm_leads.id` int).
- Natija: attribusiya xaritasi `{}` → **6 kampaniyaning hammasida ROI = 0**.

**(c) Byudjet → Finance/GL** — 🔴 **yo'l umuman yo'q**
Kanonik ledger `entries` (BASE TABLE). Marketing'da GL joylash servisini chaqiruvchi kod **yo'q**. `entries WHERE document_type ILIKE '%market%'` → **0 qator**. `marketing_budget_items` = 0.

**(d) Social / webhook intake** — 🔴 **kiruvchi yo'l yo'q**
Marketing'da `@Public()` = 0. Telegram webhook endpointi faqat token saqlaydi, `setWebhook` chaqirmaydi. `social_messages` ga yagona yozuvchilar — `reply`/`ai-reply`, ikkalasi `direction='outbound'`.
`SELECT source, count(*) FROM marketing_leads GROUP BY 1` → `google 3, instagram 3, tiktok 2, telegram 2, email 2, website 1, facebook 1` — **hammasi qo'lda kiritilgan teglar**, 0 tasi webhook'dan.

**(e) NPS avtomatik so'rovi** — 🟠 **ulangan, lekin hech qachon ishlamagan**
Listener ro'yxatda; emitter `logistics.controller.ts:143` (`@Patch(':id/complete')`, `@Roles(SUPER_ADMIN, DIRECTOR)`).
🔴 **FE `/api/logistics` ni hech qachon chaqirmaydi** (grep: 0 natija) → endpoint UI'dan yetib bo'lmas.
DB: `deliveries` = 1 (`delivered`), `nps_requests` = **0**. Zanjir hech qachon ishga tushmagan.

**(f) Marketing → Notifications/Telegram** — yo'q. Yangi lid haqida hech kim xabar bermaydi.

### 5.3 Bog'liqlik xaritasi

- **Marketing tayanadi:** Logistics (`DELIVERY_COMPLETED`), CRM (`crm_leads`, `crm_deals` — menejer-KPI, win-back, ROI o'qishlari), WMS/Logistics (`deliveries`, `qc_reclamations` o'qish).
- **Marketing'ga tayanadi:** **hech kim.** `CampaignCreatedEvent` tinglovchisiz; birorta modul marketing jadvallarini o'qimaydi.
- **FK'lar:** marketing jadvallariga/dan **atigi bitta** FK — `marketing_content_posts.author_id → users`. `campaign_id`, `crm_lead_id`, `lead_id`, `social_messages` — **hech birida FK yo'q**.

### 5.4 Tuzatish → boshqa modullarda nima uyg'onadi

| # | Tuzatish | Blast radius | Xavf |
|---|---|---|---|
| 1 | Konverterga `assigned_to` qo'shish + telefon/email unique indeks | Konvert qilingan `crm_leads` **sotuv CRM'ida ko'rinadi** va egasi bo'ladi. Yangi listener yo'q | 🟠 O'rta |
| 2 | `marketing_leads.campaign_id` ni to'ldirish + tur birlashtirish | `getAttributedRevenueByCampaign` ning **birinchi** qo'shilishi qator beradi | 🟠 O'rta |
| 3 | `crm_deals.lead_id` ni to'ldirish + to'g'ri kalit | 2+3 birga → **kampaniya ROI birinchi marta nolga teng bo'lmagan qiymat ko'rsatadi** | 🔴 Yuqori (2 bilan birga) |
| 4 | ROI tabini `channel-roi` ga ulash | Haqiqiy ROI dvigateli ishga tushadi | 🟢 Past (o'qish-only) |
| 5 | Logistics `complete` ni FE'ga ulash | NPS zanjiri **birinchi marta** ishlaydi → `nps_requests` yoziladi; **bir vaqtda** Finance `DeliveryCompletedListener` ham uyg'onadi | 🔴 Yuqori (ikki modul) |
| 6 | Byudjet → GL joylash | Yangi servis qurish kerak (uxlab yotgan listener yo'q) | 🔴 Yuqori (yangi buxgalteriya yozuvi) |
| 7 | Social webhook qabul qiluvchi | `social_messages`/`social_api_configs` to'ladi; avtomatik lid yaratish mumkin bo'ladi | 🟠 O'rta |
| 8 | `CampaignCreatedEvent` ga tinglovchi | Hozir hech kim kutmaydi — greenfield | 🟢 Past |

**Tuzatish tartibi:** kontent/kalendar/blog/kontakt create'larini ochish → 1 → 2+3 → 4 → 5 → 6/7.

---

## 6. DIZAYN / UI IZCHILLIGI

### 6.1 Etalon naqshlar

| Element | Kanonik | Ta'rif |
|---|---|---|
| Sahifa sarlavhasi | `EPPageHeader` | `components/ep/EPPageHeader.tsx:97` (`DIZAYN_QOIDALARI.md:132`) |
| Yuklanish | `EPSkeletonTable/Card/List` | `components/ep/EPSkeleton.tsx:54,73` |
| Bo'sh holat | `EPEmptyState` | `components/ep/EPEmptyState.tsx:42` |
| Xato holat | `EPErrorState` | `components/ep/EPErrorState.tsx:105` |
| O'chirish tasdiqi | `ConfirmDialog` | `components/ui/confirm-dialog.tsx:29` |
| Ildiz | `<div className="space-y-6">` (AppShell allaqachon `p-4 lg:p-6` beradi) | `DIZAYN_QOIDALARI.md:107,113-119` |

Auditlanayotgan qoidalar: **Qoida 21** (xom rang, `CLAUDE.md:796-802`), **Qoida 14** (o'chirish tasdiqi, `:536-538`), **Qoida 13** (fayl ≤900 qator, `:504-508`), **F2** (`onError`, `:642`).

### 6.2 Natija

✅ **Qattiq, skript bilan tekshiriladigan qoidalar — to'liq bajarilgan:**
- **Xom rang: 0 ta.** 21 Marketing faylida birorta inline `style={{color/background}}`, `rgb()/rgba()` yoki Tailwind `[#hex]` yo'q.
- **O'chirish tasdiqi: 100%.** Har bir DELETE `ConfirmDialog` orqali (Budget `:165`, Calendar `:156`, Campaigns `:281`, Content `:297`, Exhibitions, PR, WebsiteCMS, Leads).
- **Fayl hajmi:** eng kattasi `MarketingWebsiteCMSCatalog.tsx` = 424 qator. 900 chegarasidan oshgan fayl yo'q.

❌ **EP-komponent qoidalari — tizimli chetlanish:**

| Chetlanish | Miqdor | Namunalar |
|---|---|---|
| Raw `<Skeleton>` (`EPSkeleton*` o'rniga) | **~18 joy, deyarli har sahifa** | `Dashboard.tsx:70`, `Leads.tsx:194`, `Campaigns.tsx:50,180`, `Budget.tsx:70`, `Settings.tsx:129` |
| Inline `<div>` bo'sh holat (`EPEmptyState` o'rniga) | **~16 joy** | `Budget.tsx:134`, `Campaigns.tsx:221`, `ExtendedSections.tsx:74,242,329,362` |
| Ikki karra padding (`p-5 lg:p-6` ildizda) | **9 sahifa** | Content, Calendar, Exhibitions, PR, Extended, Budget, Settings, SocialInbox `:124`, WebsiteCMS `:139` |
| `EPPageHeader` yo'q | 2 sahifa | `WebsiteCMS.tsx:141` (raw `<h1>`), `SocialInbox.tsx:125` (custom top bar) |
| `useMutation` da `onError` yo'q (F2) | **~20 mutatsiya, 11 faylda** | `Budget.tsx:48`, `Calendar.tsx:55`, `PR.tsx:44,49`, `Exhibitions.tsx:87,92,109`, `Leads.tsx:96,107,127,135` |
| Raw matn yuklanish | 1 | `WebsiteCMSCatalog.tsx:223` |

### 6.3 Modul rang tokeni

🔴 **`--mod-marketing` tokeni umuman mavjud emas.** CSS'da faqat 6 modul tokeni bor: `--mod-sd, --mod-pp, --mod-hr, --mod-warehouse, --mod-fi, --mod-org` (`erp-modern-ui/ep-motion-helpers.css:25-36`). Birorta Marketing sahifasi `--mod-*` ishlatmaydi — umumiy `var(--ep-green/blue/red)` bilan bo'yaydi.

Ustiga, `DIZAYN_QOIDALARI.md:63-83` 15 modul tokenini nomlaydi va **Marketing'ni umuman sanamaydi**; hujjatdagi qiymatlar CSS'dan farq qiladi (masalan `--mod-sd`: hujjat `#06B6D4`, CSS `#3563AC`). Marketing akcenti **avval hujjatga ham, CSS'ga ham qo'shilishi kerak**.

---
## 7. VIZYON TAQQOSLASH

### 7.1 Manba va usul

Master vizyon rejasi `docs/audit/` ichidan qidirish bilan topildi: **`FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md`** (27 640 qator).

Marketing bo'limi: **`## [Module 14] Marketing`** — 17583-qator, **99 item** (`### [Marketing-14] Item 1..99`).

Reja har item uchun `- **Current status:** Ha | Qisman | Yo'q | STALE-DOC` va evidence saqlaydi; uning bahosi asosan **kod mavjudligiga** tayanadi. Bu tahlil unga **runtime haqiqatini** qo'shadi (Q-40): "kod bor" ≠ "ishlaydi".

Rejaning o'z statistikasi: `Ha` **2**, `Qisman` **20**, `Yo'q` **73**, `STALE-DOC` **4**.

`STALE-DOC` = manba vizyon hujjatidagi status eskirgan → tasnifda `MISSING`.

### 7.2 Reja `Ha` bergan 2 itemning shu tahlirdagi qayta tekshiruvi

Yolg'on `Ha` eng xavflisi. **Ikkalasini ham shaxsan tekshirdim — ikkalasi ham pasaytirildi.**

| Item | Reja | Yakuniy | Shu tahlirdagi dalil |
|---|---|---|---|
| #49 Lid SD'ga o'tkazilganda ikki-event handshake | `Ha` | ⛔ **MISSING** | `convert-to-crm` (`marketing-analytics-stubs.controller.ts:286-318`) faqat `INSERT INTO crm_leads` + `UPDATE marketing_leads` qiladi. Butun `modules/marketing` da **atigi 1 ta `eventBus.publish`** bor — `CampaignCreatedEvent` (`create-campaign.handler.ts:34`), va u **tinglovchisiz**. Handshake yo'q, event yo'q |
| #60 NPS buyurtma yopilgach avto DB'ga | `Ha` | 🟠 **PARTIAL** | Listener ro'yxatda (`nps-auto-request.listener.ts:18`, `marketing.module.ts:78`) — kod real. Lekin emitter `logistics.controller.ts:143` **FE'dan hech qachon chaqirilmaydi** (grep `/api/logistics` → 0) va `nps_requests` = **0 qator**. Zanjir hech qachon ishga tushmagan |

### 7.3 Yakuniy tasnif

| Tasnif | Marketing (99) | % |
|---|---|---|
| **FULLY DELIVERED** | **0** | **0 %** |
| **PARTIALLY DELIVERED** | **21** | **21.2 %** |
| **MISSING** | **78** | **78.8 %** |

> Reja `Ha` = 2 (2 %) degan. Runtime tekshiruvi uni **0 ga** tushirdi. **Marketing modulida to'liq yetkazilgan birorta vizyon-item yo'q.**
>
> Taqqoslash uchun (bir xil metodologiya, oldingi tahlil): SD/CRM 292 itemdan 10 tasi FULLY (3.4 %). Marketing **undan ham past**.

Quyida **99 itemning to'liq ro'yxati**; birortasi "mayda" deb tashlanmadi.


### 7.3 Module-14 Marketing — 99 item

| # | Vizyon itemi | Reja | **Yakuniy** | Fresh dalil / izoh |
|---|---|---|---|---|
| 1 | AI lid-skoring oylik avto-kalibrovka + versiyalash + rahbar tasdiq | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan (reja tuzatgan). |
| 2 | Telefon +998 avto-normalizatsiya + dublikat merge (birinchi karta kanonik) | `Yo'q` | **MISSING** |  |
| 3 | Lid eskirish croni HR ABSENT tekshirsin + eskalatsiya | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan (reja tuzatgan). |
| 4 | Byudjet tugaganda soft ogohlantirish + yangi kampaniya tasdiq + 24s eskalatsiya | `Yo'q` | **MISSING** |  |
| 5 | Inbox SLA faqat ish soatlarida hisoblansin | `Yo'q` | **MISSING** |  |
| 6 | Ikki kanaldan bir telefon = merge; oxirgi teginish asosiy, birinchi ham qayd | `Yo'q` | **MISSING** |  |
| 7 | Aktiv QC reklamatsiya bo'lsa NPS so'rovi keyinga suriladi | `Yo'q` | **MISSING** |  |
| 8 | Dizayn bosqichiga o'tganda marketing→dizayn Kanban vazifasi avto-yaratiladi | `Yo'q` | **MISSING** |  |
| 9 | "Reklama xarajati" GL sub-kodi marketing boshliq+bosh hisobchi sozlaydi, owner ruxsati | `Yo'q` | **MISSING** |  |
| 10 | Offline lidlar lokal saqlanib, aloqa tiklanganda avto-sinxron + dedup | `Yo'q` | **MISSING** |  |
| 11 | "Ritm" birinchi 3 buyurtmadan keyin hisoblanadi, N sozlanadi | `Yo'q` | **MISSING** |  |
| 12 | "Kichiklashgan buyurtma" signali faqat pul qiymati kamayganda | `Yo'q` | **MISSING** |  |
| 13 | 90 kun oynada lid ikki kampaniyaga tegsa ROI oxirgi kampaniyaga to'liq | `Yo'q` | **MISSING** |  |
| 14 | Namuna materiali yetmasa ariza "material kutilmoqda" + MM avto-signal | `Yo'q` | **MISSING** |  |
| 15 | Sodiqlik imtiyozi toifa tushishida faqat yangi buyurtmalarga ta'sir | `Yo'q` | **MISSING** |  |
| 16 | Sifatli lid 30 kun ichida sotilmasa sotuvchi KPI'ga tushadi | `Yo'q` | **MISSING** |  |
| 17 | Raqobatchi kartochkasiga har 3 oyda "yangilash" vazifasi + 90 kun eskirgan filtri | `Qisman` | **PARTIAL** |  |
| 18 | Bitrix24 "Sdo'cha"/"Aktivlik" alohida crm_activities jadvaliga | `Qisman` | **PARTIAL** |  |
| 19 | Marketing KPI har "sifatli lid" event'ida real-time yangilanadi | `Yo'q` | **MISSING** |  |
| 20 | Promo-kod 1 mijoz/1 kampaniya default, boshliq cheklashni sozlaydi | `Yo'q` | **MISSING** |  |
| 21 | Mavsumiy talab kalendari PP/MPS ga "orientir" signal | `Yo'q` | **MISSING** |  |
| 22 | Lid mahsulot turi to'lsa mos menejer+preyskurant tavsiya, rahbar tasdiq | `Yo'q` | **MISSING** |  |
| 23 | "Oprosny list" draft holatda qisman saqlanadi; to'liq bo'lmaguncha SD'ga o'tkazish bloklanadi | `Yo'q` | **MISSING** |  |
| 24 | Egaga "5 raqam" hisoboti Director dashboard widget sifatida | `Yo'q` | **MISSING** |  |
| 25 | Noto'g'ri spam faqat qo'lda tiklanadi; AI faqat ogohlantirish | `Yo'q` | **MISSING** |  |
| 26 | Tavsiya bonusi CRM kartaga; to'lov alohida "tavsiya bonusi" chiqim Moliyada | `Yo'q` | **MISSING** |  |
| 27 | QC sifat muammosida mijozga umumiy xabar, menejerga to'liq ichki | `Yo'q` | **MISSING** |  |
| 28 | "Bo'sh davr aksiyasi" ega+savdo boshlig'i Kanban tasdiq, 48s→avto "kechiktirildi" | `Yo'q` | **MISSING** |  |
| 29 | Mijoz ABC toifalash real-time har buyurtma yopilganda; A→B da tavsiya | `Qisman` | **PARTIAL** |  |
| 30 | Diler AR balansini faqat moliya+marketing boshliq ko'radi (field RBAC) | `Yo'q` | **MISSING** |  |
| 31 | Ko'rgazma follow-up 48 soati HR ish-kunlari kalendariga ko'ra | `Yo'q` | **MISSING** |  |
| 32 | Lid to'lov intizomi belgisi AR'dan kunlik cron, 48s→eslatma | `Yo'q` | **MISSING** |  |
| 33 | ROI foyda formulasida tannarx Moliyadan (FIFO) | `Yo'q` | **MISSING** |  |
| 34 | Upsell AI tavsiyasi real-time; 90 kun saqlanadi, keyin "eskirgan" | `Yo'q` | **MISSING** |  |
| 35 | Ijtimoiy statistika webhook real-time sync; limitda 15 daq retry→"qo'lda yangilash" | `Yo'q` | **MISSING** |  |
| 36 | Mijoz yillik forecast PP/MPS ga "orientir"; ±30% ogohlantirish | `Yo'q` | **MISSING** |  |
| 37 | Round-robin: menejer ABSENT→keyingiga; ish yuklama limiti sozlanadi | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan (reja tuzatgan). |
| 38 | LMS darslik tugalanmasa HR signal, Payroll gate; 1 ish kuni kechikish | `Yo'q` | **MISSING** |  |
| 39 | "Takror qil"da eski narx o'rniga yangi joriy narx avto; sotuvchi draft tasdiqlaydi | `Qisman` | **PARTIAL** |  |
| 40 | Iliq lid topshirilgach SD 15 daq "qabul" bermasa savdo boshlig'iga eskalatsiya | `Yo'q` | **MISSING** |  |
| 41 | Yangi Pantone kodi yuklanganda dizaynga avto-bildirishnoma + QC/Dizayn xabardor | `Yo'q` | **MISSING** |  |
| 42 | Menejer ogohlantirishni ko'rib lid ishini davom ettirsa audit-log'da (7 yil) | `Yo'q` | **MISSING** |  |
| 43 | Diler faqat marketing xodimi nomidan kiritiladi, "manba: diler" maydoni | `Yo'q` | **MISSING** |  |
| 44 | Mahsulot rentabelligi field-RBAC himoyalangan, CSV eksportda ham yashirin | `Yo'q` | **MISSING** |  |
| 45 | Ko'rgazma komandirovka xarajati HR'dan avto-ulanadi, ROI'ga qo'shiladi | `Yo'q` | **MISSING** |  |
| 46 | 3 oy buyurtma bermagan mijozga win-back avto-start, SD aktiv lid tekshiruv | `Yo'q` | **MISSING** |  |
| 47 | "Yangi mahsulot turi talabi" statistikasi oylik 6-departamentga | `Yo'q` | **MISSING** |  |
| 48 | Kontakt o'zgarish Kanban vazifasi joriy menejer nomiga, 48s | `Yo'q` | **MISSING** |  |
| 49 | Lid SD'ga o'tkazilganda "o'tkazildi"→"bog'langan" ikki-event handshake | `Ha` | **MISSING** | ⭐ Fresh: `convert-to-crm` (`marketing-analytics-stubs.controller.ts:286`) faqat `INSERT crm_leads` + `UPDATE marketing_leads` qiladi; birorta event chiqarmaydi. Butun Marketing modulida jami **1 ta** `eventBus.publish` bor (`CampaignCreatedEvent`), u ham tinglovchisiz. Ikki-event handshake yo'q. |
| 50 | Telegram bot webhook ishlamasa polling rejimiga o'tadi (fallback) | `Yo'q` | **MISSING** |  |
| 51 | Marketing material/brending arxivi versiya bilan | `Qisman` | **PARTIAL** |  |
| 52 | Mijoz NPS (buyurtma yopilgach avto 0-10+izoh) | `STALE-DOC` | **MISSING** | Manba vizyon hujjatidagi status eskirgan (reja tuzatgan). |
| 53 | Bitrix24→ERP ko'chirish (ERP yagona manba) | `Qisman` | **PARTIAL** |  |
| 54 | Churn per-mijoz-ritm bo'yicha erta sezish | `Qisman` | **PARTIAL** |  |
| 55 | 'Kichiklashgan buyurtmalar' signali (summa/razmer tushishi) | `Yo'q` | **MISSING** |  |
| 56 | Mijoz brend pasporti (logo/Pantone/CMYK/shrift/taqiq) | `Yo'q` | **MISSING** |  |
| 57 | Mahsulot namunalari portfolio (Panda/Tefal katalogi) | `Qisman` | **PARTIAL** |  |
| 58 | Опросный лист (brif) lid'dan avto old-to'ldirish | `Yo'q` | **MISSING** |  |
| 59 | Lid mahsulot turi (ofset/gofra/etiketka/flekso) majburiy | `Yo'q` | **MISSING** |  |
| 60 | NPS buyurtma yopilgach avto (0-10+izoh) DB'ga saqlanadi (EP-MKT-082) | `Ha` | **PARTIAL** | ⭐ Fresh: `NpsAutoRequestListener` (`nps-auto-request.listener.ts:18`) ro'yxatda (`marketing.module.ts:78`), `DELIVERY_COMPLETED` ni tinglaydi. Lekin `nps_requests` = **0 qator**, `deliveries` = 1 (delivered). Eventni chiqaruvchi `logistics.controller.ts:143` — FE `/api/logistics` ni **hech qachon chaqirmaydi**. Zanjir hech qachon ishlamagan. |
| 61 | Bitrix24 o'rnini ERP bosadi, lid/mijoz ko'chiriladi (EP-MKT-083) | `Yo'q` | **MISSING** |  |
| 62 | Churn har mijoz RITMIga nisbatan → menejerga signal (EP-MKT-084) | `Qisman` | **PARTIAL** |  |
| 63 | Nosirov 'Kichiklashgan buyurtmalar' avto (EP-MKT-085) | `Yo'q` | **MISSING** |  |
| 64 | Har mijoz BREND pasporti (EP-MKT-086) | `Yo'q` | **MISSING** |  |
| 65 | Oldingi ishlar (Panda/Tefal/Ganga) mahsulot-turi portfolio (EP-MKT-087) | `Qisman` | **PARTIAL** |  |
| 66 | Lid talabi опросный лист ga old-to'ldirilib o'tadi (EP-MKT-088) | `Yo'q` | **MISSING** |  |
| 67 | Lid mahsulot turi (ofset/gofra/etiketka/flekso/blanka) majburiy (EP-MKT-089) | `Yo'q` | **MISSING** |  |
| 68 | Lid menejerga avto biriktiriladi, egasiz lid qizil (EP-MKT-090) | `Qisman` | **PARTIAL** |  |
| 69 | Mijoz/lid to'lov intizomi belgisi (AR qarz) marketingga (EP-MKT-091) | `Yo'q` | **MISSING** |  |
| 70 | Mavsumiy talab kalendari ('shu oyda qo'ng'iroq qil') (EP-MKT-092) | `Yo'q` | **MISSING** |  |
| 71 | Voronkaga 'Namuna→tasdiqda→Tasdiqlandi (подписной лист)' bosqichlari (EP-MKT-093) | `Yo'q` | **MISSING** |  |
| 72 | Fizik namuna XARAJATI (material+vaqt)→konversiya/ROI (EP-MKT-094) | `Qisman` | **PARTIAL** |  |
| 73 | Yirik mijozdan yillik prognoz→ishlab chiqarish/material rejasiga (EP-MKT-095) | `Yo'q` | **MISSING** |  |
| 74 | Lid noodatiy talab→texnik imkoniyat avto tekshiruv (EP-MKT-096) | `Yo'q` | **MISSING** |  |
| 75 | Papka № (PT/KT/E) bo'yicha 'takror qil' tugmasi (EP-MKT-097) | `Yo'q` | **MISSING** |  |
| 76 | Mijoz 'wallet share'—upsell AI tavsiyasi (EP-MKT-098) | `Yo'q` | **MISSING** |  |
| 77 | NPS oldidan oxirgi brak/reklamatsiya ko'rinadi (EP-MKT-099) | `Yo'q` | **MISSING** |  |
| 78 | Yutilgan/yo'qolgan lid'da raqib nomi+sabab majburiy (EP-MKT-100) | `Qisman` | **PARTIAL** |  |
| 79 | Yangi menejer uchun savdo skripti+FAQ (lavozim darsligi) (EP-MKT-101) | `Yo'q` | **MISSING** |  |
| 80 | Mijoz/lid hudud+eksport belgisi+hudud savdo xaritasi (EP-MKT-102) | `Yo'q` | **MISSING** |  |
| 81 | Mijozda bir necha kontakt+'asosiy kontakt o'zgardi'→aloqa vazifasi (EP-MKT-103) | `Qisman` | **PARTIAL** |  |
| 82 | Dormant eski mijoz ro'yxati+win-back vazifasi (EP-MKT-104) | `Qisman` | **PARTIAL** |  |
| 83 | Mijoz ABC toifa avto+har toifaga xizmat darajasi (EP-MKT-105) | `Qisman` | **PARTIAL** |  |
| 84 | Mahsulot-turi talab statistikasi→6-departamentga hisobot (EP-MKT-106) | `Yo'q` | **MISSING** |  |
| 85 | Mijozga buyurtma holati (%) ko'rinadigan link/bot (EP-MKT-107) | `Yo'q` | **MISSING** |  |
| 86 | Sodiqlik imtiyozi (yillik hajm)→avto chegirma qoidasi (EP-MKT-108) | `Yo'q` | **MISSING** |  |
| 87 | Marketing dizayn bandligini (kanban yuki) ko'rib va'da bermaydi (EP-MKT-109) | `Yo'q` | **MISSING** |  |
| 88 | Ishlab chiqarish bo'sh quvvati→'bo'sh davr aksiyasi' signali (EP-MKT-110) | `Yo'q` | **MISSING** |  |
| 89 | Mijoz/mahsulot foyda darajasi (rol-maxfiy) marketingga fokus (EP-MKT-111) | `Yo'q` | **MISSING** |  |
| 90 | Savdo menejer kartasida faollik+natija statistikasi (EP-MKT-112) | `Yo'q` | **MISSING** |  |
| 91 | Dizayn yangilash takliflari→опросный лист old-to'ldirish (EP-MKT-113) | `Yo'q` | **MISSING** |  |
| 92 | Mijoz aksiya kalendari+'shu sanadan oldin quti kerak' eslatma (EP-MKT-114) | `Yo'q` | **MISSING** |  |
| 93 | Byudjet zavod-real moddalar (ko'rgazma/vakil/namuna/katalog)+HR komandirovka (EP-MKT-115) | `Qisman` | **PARTIAL** |  |
| 94 | Egaga aniq 5 raqam+'diqqat talab' widget (EP-MKT-116) | `Yo'q` | **MISSING** |  |
| 95 | Lid'da 'kim tavsiya qildi'+tavsiya zanjiri+bonus qoidasi (EP-MKT-117) | `Yo'q` | **MISSING** |  |
| 96 | Lid→SD dan oldin rekvizit (STIR/shartnoma/manzil) to'liqlik darvozasi (EP-MKT-118) | `Yo'q` | **MISSING** |  |
| 97 | Ko'rgazma lidlari sotuvga ulanib kuzatiladi+follow-up 48s (EP-MKT-059/060) | `Qisman` | **PARTIAL** |  |
| 98 | Raqobatchi kartochkasi (nomi/mahsulot/narx/kuchli-zaif) muntazam (EP-MKT-078) | `Qisman` | **PARTIAL** |  |
| 99 | Ijtimoiy inbox barcha kanalni bitta oynaga+lidga aylantirish (EP-MKT-062/064) | `Qisman` | **PARTIAL** |  |
---

## 8. MODERNIZATSIYA BO'SHLIQLARI (faqat MAVJUD 16 sahifa — yangi sahifa yo'q)

> Qoida: yangi sahifa taklif qilinmaydi. Har bir bo'shliq — mavjud ekrandagi yetishmayotgan imkoniyat. Ma'lumot hali mavjud bo'lmasa, **"bloklangan → oldin nima kerak"** deb belgilanadi.

### 8.1 Dashboard (`/marketing/dashboard`)
- Sarflangan/qoldiq ko'rsatkichlari — `getDashboardStats` `totalSpent` qaytarmaydi (`repo:139-147`). **Bloklangan emas** — `SUM(spent_amount)` mavjud (31 650 000).
- Trend (o'tgan oyga nisbatan ±%) — hech bir kartada yo'q.
- Drill-down: "Yangi lidlar" kartasi bosilganda `/marketing/leads?status=new` ga o'tishi kerak.
- AI-yordamchi — **bloklangan**: haqiqiy AI provayder kaliti kerak (owner-DATA).
- Real-time: dashboard `refetchInterval` ishlatmaydi.

### 8.2 Lidlar (`/marketing/leads`)
- **Ustun bo'yicha saralash yo'q** — `EPTable` (`components/ep/EPTable.tsx:69`) allaqachon mavjud, adoption = 0.
- Server-side pagination BE'da bor (`{data,total,page,limit}`), FE ishlatmaydi.
- **Bulk amallar** (ko'p lidni biriktirish/o'chirish) yo'q.
- **CSV/Excel eksport** yo'q.
- Kanban ko'rinishi (status bo'yicha) yo'q — faqat jadval.
- Dedup ogohlantirishi — **bloklangan**: `marketing_leads` da telefon/email unique indeks yo'q (yagona indeks `marketing_leads_pkey`) → Q-35 sxema tasdig'i kerak.
- Lid tarixi/timeline — **bloklangan**: `marketing_lead_contacts` yozib bo'lmaydi (22P02, §2.3).

### 8.3 Kampaniyalar (`/marketing/campaigns`)
- Real progress-bar (sana yoki byudjet utilizatsiyasi bo'yicha) — hozir status'dan qattiq yozilgan (`:272`). **Bloklangan emas**.
- Kampaniya statistikasi — **bloklangan**: `marketing_campaigns.id` (varchar) ↔ `marketing_ads.campaign_id` (int) tur drifti hal qilinishi kerak (Q-35).
- Kampaniyani nusxalash (duplicate) tugmasi yo'q.
- Statuslar bo'yicha filtr chipi yo'q.

### 8.4 Kontent (`/marketing/content`)
- **Avval create tuzatilishi shart** (§2.3) — usiz hech qanday modernizatsiya ma'noga ega emas.
- Media yuklash (rasm/video) — **bloklangan**: `media_urls` ustuni bor, storage integratsiyasi yo'q.
- Rejalashtirilgan post uchun kalendar ko'rinishi — `content/calendar` endpointi **allaqachon mavjud, chaqirilmaydi** (§4.2).
- Platforma bo'yicha oldindan ko'rish (preview) yo'q.

### 8.5 Social Inbox (`/marketing/social-inbox`)
- **Avval javob matni tuzatilsin** (§2.4) — hozir bo'sh satr yoziladi.
- Kiruvchi xabar — **bloklangan**: webhook qabul qiluvchi endpoint yo'q (§5.2d). Bu qurilmaguncha inbox doim bo'sh.
- O'qilmagan hisoblagichi, biriktirish, teg — hech biri yo'q.
- Poll (15 s) o'rniga WebSocket — **bloklangan**: gateway yo'q.

### 8.6 Taqvim (`/marketing/calendar`)
- **Avval create tuzatilsin** (`.strict()` + `startDate`, §2.3).
- Drag-and-drop ko'chirish yo'q.
- Hafta/kun ko'rinishi yo'q (faqat oy).
- Kampaniya/kontent bilan bog'lash — **bloklangan**: `marketing_calendar_events` da `campaign_id` ustuni yo'q.

### 8.7 Ko'rgazmalar (`/marketing/exhibitions`)
- **Avval sana/byudjet shartnomasi tuzatilsin** (§2.4).
- Lid → CRM konvertatsiya tugmasi `exhibition_leads` uchun yo'q (marketing lidlar uchun bor).
- ROI (ko'rgazma byudjeti ↔ olingan bitim) — **bloklangan**: `exhibition_leads` → `crm_deals` bog'lanishi yo'q.
- QR — hozir faqat matn ustuni; haqiqiy QR generatsiya yo'q.

### 8.8 PR Faoliyat (`/marketing/pr`)
- Sarlavhadagi literal `{t('prMedia')}` bug'i (`:79`).
- `reach` va `sentiment` ustunlari bor, forma ularni yig'maydi. **Bloklangan emas**.
- Media fayl biriktirish — **bloklangan** (storage).

### 8.9 Tahlil / ROI (`/marketing/analytics`)
- **`Infinity%` tuzatilsin** (`spent` → `spentAmount`, `/0` gard).
- **`channel-roi` ga ulanish** — dvigatel tayyor (`repo:588-614`). **Bloklangan emas** (o'qish-only), lekin nolga teng bo'lmagan natija uchun `campaign_id` to'ldirilishi kerak.
- Vaqt oralig'i tanlagichi, grafik (chart) yo'q.
- Eksport yo'q.

### 8.10 SEO (`/marketing/seo`)
- **To'liq bloklangan.** Hozir 100% qattiq yozilgan (`MarketingExtendedTypes.ts:92-99`). Kerak: (1) SEO jadvali (Q-35), (2) tashqi provayder (owner-DATA: kalit). Undan oldin har qanday "modernizatsiya" soxta bo'ladi.

### 8.11 A/B Testing (`/marketing/ab-testing`)
- `{items:[]}` konvert bug'i tuzatilsin.
- **Stop / g'olibni e'lon qilish route'i yo'q** — qurilishi kerak (`PATCH /ab-tests/:id`).
- Statistik ahamiyatlilik hisobi yo'q.
- Impressions/clicks/conversions — **bloklangan**: ularni oshiradigan yozuv yo'li mavjud emas.

### 8.12 Raqobatchilar (`/marketing/competitors`)
- **Bloklangan.** `competitors`/`marketing_competitors` jadvallari **umuman yo'q**; manba `sd_customer_competitors` (0 qator) va maydon nomlari FE bilan mos emas. Kerak: shartnoma birlashtirish + ma'lumot kiritish formasi (yangi sahifa emas, mavjud tabga dialog).

### 8.13 NPS va Churn (`/marketing/nps-churn`)
- `{monthlyTrend}` va churn obyekt/massiv shartnomalari tuzatilsin — **bloklangan emas** (9 NPS javobi bor).
- NPS avtomatik so'rovi — **bloklangan**: Logistics `complete` FE'dan chaqirilmaydi (§5.2e).
- Churn sabab-tahlili yo'q.

### 8.14 Web sayt CMS (`/marketing/website-cms`)
- **Avval blog create tuzatilsin** (`.strict()`, §2.3).
- SEO maydonlari (`seoTitle/seoDescription`) formada bor, saqlanmaydi.
- `EPPageHeader` yo'q (raw `<h1>`).
- Rich-text editor yo'q (oddiy textarea).
- `website_pages` jadvali (0 qator) bu sahifada ishlatilmaydi — sahifa CMS'i **bloklangan**: `ecommerce/website.service.ts` ga ulash kerak.

### 8.15 Byudjet (`/marketing/budget`)
- 🔴 **Jadval qarori kerak** (`marketing_budget_items` vs 12 qatorli `marketing_budget_lines`) — bu **owner qarori + Q-35**.
- Fakt sarfni avtomatik olish — **bloklangan**: GL yo'li yo'q (`entries` da 0 marketing qatori).
- Byudjet oshib ketganda ogohlantirish yo'q.
- Qayta hisoblash route'i yo'q.

### 8.16 Sozlamalar (`/marketing/settings`)
- 🔴 **`z.record` semantik bug'i tuzatilsin** (§1.4-16) — hozir sozlama nomi hech qachon saqlanmaydi.
- Tokenlarni maskalash **allaqachon to'g'ri** (`stubs:622-625`) — namuna sifatida boshqa modullarga ko'chirish mumkin.
- Ulanishni sinash ("Test connection") tugmasi yo'q — **bloklangan**: tashqi HTTP chaqiruv qatlami yo'q (`axios|fetch` = 0 natija).

### 8.17 Modul-keng (barcha 16 sahifa)
- **`--mod-marketing` tokeni yaratilsin** (avval `DIZAYN_QOIDALARI.md`, keyin CSS).
- Raw `<Skeleton>` → `EPSkeleton*` (~18 joy).
- Inline bo'sh holat → `EPEmptyState` (~16 joy).
- `useMutation` `onError` (~20 mutatsiya) — F2 qoidasi buzilgan.
- Ikki karra padding olib tashlansin (9 sahifa).
- `EPTable` adoption (hozir 0) — saralash/pagination shu bilan keladi.

---

## 9. KONSOLIDATSIYALANGAN TAVSIYALAR (34 ta, bog'liqlik tartibida)

**Ustuvorlik:** 🔴 P0 (yolg'on/yetib bo'lmas) · 🟠 P1 (buzuq imkoniyat) · 🟡 P2 (sifat) · 🟢 P3 (yaxshilash)
**Harakat turi:** `FIX` kod · `SCHEMA` (Q-35 tasdiq kerak) · `DATA` (owner ma'lumoti) · `DECISION` (owner qarori) · `BUILD` yangi kod

### To'lqin 0 — Owner qarorlari (hech narsa bularsiz boshlanmaydi)

| # | Tavsiya | Tur | Bog'liq |
|---|---|---|---|
| **1** | 🔴 **Rol qarori.** `manager` (27 foydalanuvchi) 74/117 endpointda 403. Variantlar: **(a)** `users.role` ni `marketing_manager` ga migratsiya (`SCHEMA`+`DATA`, Q-35), **(b)** BE `@Roles` ro'yxatlariga `'manager'` qo'shish (`FIX`, tez), **(c)** backend'da haqiqiy `ROLE_ALIASES` qurish (`BUILD`) va `useAuth.tsx:16` izohini rostga aylantirish. **Owner tanlaydi.** | DECISION | — |
| **2** | 🔴 **Byudjet jadvali qarori.** Kod `marketing_budget_items` (0 qator) ni, ma'lumot `marketing_budget_lines` (12 qator) da. Qaysi biri kanonik? Migratsiya kerakmi? | DECISION + SCHEMA | — |
| **3** | 🔴 **AI provayder kaliti.** 3 ta green-lie (`ai_provider:'pending'`) va SEO/raqobatchi tahlili shusiz haqiqiy bo'lolmaydi. | DATA | — |
| **4** | 🟠 **`marketing_campaigns.id` tur qarori.** varchar slug qoladimi yoki integer'ga ko'chiriladimi? `marketing_ads.campaign_id` (int) shunga bog'liq. | DECISION + SCHEMA | — |

### To'lqin 1 — Yetib bo'lmas yo'llarni ochish (mustaqil, parallel qilinadi)

| # | Tavsiya | Tur | Dalil | Bog'liq |
|---|---|---|---|---|
| **5** | 🔴 Kontent create'ni tuzatish: DTO'ga `platform` qo'shish, FE `body`→`content`, repo INSERT'ga ikkalasini berish | FIX | `marketing-ext.dto.ts:9-15`, `repo:170-175`, 23502×2 | — |
| **6** | 🔴 Taqvim create'ni tuzatish: FE `scheduledDate`→`startDate`, ortiqcha 5 kalitni olib tashlash (yoki `.strict()` ni bo'shatish) | FIX | `marketing-group2.controller.ts:59-66` ↔ `MarketingCalendar.tsx:62` | — |
| **7** | 🔴 Blog create'ni tuzatish: `.strict()` ga `coverImage/seoTitle/seoDescription/tags` qo'shish **va** repo'da ularni yozish | FIX | `ctrl:34-42`, `repo:134-145` | — |
| **8** | 🔴 Lid-kontakt tur driftini tuzatish: `marketing_lead_contacts.lead_id` int → varchar | SCHEMA | probe 22P02 | 1 |
| **9** | 🔴 Inbox javob matnini tuzatish: handler `dto.text` ni ham o'qisin | FIX | `MarketingSocialInbox.tsx:68` ↔ `stubs:360` | — |
| **10** | 🔴 Ko'rgazma sana/byudjet shartnomasi: `dto.startDate` (camel) o'qish, `budget: z.coerce.number()` | FIX | `stubs:47,472-473` | — |
| **11** | 🔴 Sozlamalar `z.record` bug'i: `{key,value}` juftligini to'g'ri UPSERT qilish | FIX | `stubs:630-637` | — |
| **12** | 🔴 AI green-lie'larini **UI'da halol belgilash** (kalit kelguncha "AI hali ulanmagan" badge'i) | FIX | `stubs:239,135,385` | 3 |

### To'lqin 2 — Konvert/shartnoma bug'lari (bir xil sinf, birga qilinadi)

| # | Tavsiya | Tur | Dalil |
|---|---|---|---|
| **13** | 🔴 `MarketingLeads.tsx:62` ga `select: selectArray<MarketingLead>` — 14 lid ekranga chiqadi | FIX | `api-request.ts:282-291` |
| **14** | 🔴 `MarketingDashboard.tsx:33` ga `selectArray` — faol kampaniyalar paneli to'ladi | FIX | — |
| **15** | 🔴 `MarketingContent.tsx:142` konvertini ochish | FIX | `repo:157` |
| **16** | 🔴 A/B `{items:[]}` konvertini ochish | FIX | `stubs:400` |
| **17** | 🔴 Dashboard NPS/churn shartnomalarini moslashtirish (`npsScore` vs `avgScore`; massiv vs obyekt) | FIX | `repo:439` ↔ `MarketingDashboardTypes.ts:62-68,40-44` |
| **18** | 🔴 Voronka dialogi shartnomasi (`{stages}` vs `FunnelStage[]`) | FIX | `repo:420` ↔ `MarketingLeadsDialogs.tsx:192` |
| **19** | 🔴 Raqobatchilar shartnomasi (`customersCount/avgOurShare` vs `share/price/quality`) | FIX | `repo:341-346` ↔ `Types.ts:64-73` |
| **20** | 🟠 Taqvim `startDate` vs `scheduledDate` o'qish drifti + `?month&year`→`from/to` | FIX | `MarketingCalendar.tsx:82`, `ctrl:208-211` |
| **21** | 🟠 **Umumiy yechim:** `api-request.ts` unwrapper'iga `{data,total,page,limit}` va `{items}` konvertlarini qo'shish — bu 13-16, 20 ni bir joyda hal qiladi. **Blast radius: butun ilova** → alohida tekshiruv kerak | FIX | `api-request.ts:280-294` |

### To'lqin 3 — ROI haqiqati (2→3→4 ketma-ket)

| # | Tavsiya | Tur | Bog'liq |
|---|---|---|---|
| **22** | 🔴 `MarketingExtended.tsx:59` `c.spent` → `c.spentAmount`; `:60` ga `/0` gardi | FIX | — |
| **23** | 🔴 ROI tabini **`GET /marketing/analytics/channel-roi`** ga ulash (o'z matematikasini o'chirish) | FIX | 22 |
| **24** | 🔴 `marketing_leads.campaign_id` ni to'ldirish (0/14) + tur birlashtirish | SCHEMA + DATA | 4 |
| **25** | 🔴 `crm_deals.lead_id` ni to'ldirish (0/5) + to'g'ri kalit turi | SCHEMA + DATA | 24 |
| **26** | 🟠 `marketing_ads.campaign_id` ni `marketing_campaigns.id` ga FK bilan bog'lash → kampaniya statistikasi nolni tark etadi | SCHEMA | 4 |

> 24+25 birga bajarilmasa, 23 baribir **0 ROI** ko'rsatadi (dvigatel to'g'ri, ma'lumot yo'q). Buni owner tushunishi muhim.

### To'lqin 4 — Zanjirlarni ulash

| # | Tavsiya | Tur | Blast radius |
|---|---|---|---|
| **27** | 🔴 Konverterga `assigned_to`/`manager_id` qo'shish — hozir konvert qilingan `crm_leads` **egasiz** | FIX | 🟠 CRM ko'rinishi o'zgaradi |
| **28** | 🟠 `marketing_leads` ga telefon/email bo'yicha unique indeks (dedup) | SCHEMA | 🟢 |
| **29** | 🟠 Logistics `PATCH /:id/complete` ni FE'ga ulash → NPS zanjiri **birinchi marta** ishlaydi | BUILD | 🔴 Finance `DeliveryCompletedListener` ham uyg'onadi — birga sinash |
| **30** | 🟠 Marketing lidlarga row-scoping (`assigned_to` ni WHERE'ga) — hozir 27 `manager` har qanday lidni ko'radi | FIX | 1 |
| **31** | 🟡 `CampaignCreatedEvent` ga tinglovchi (notifikatsiya) yoki eventni olib tashlash; 2 o'lik event klassini o'chirish | FIX/BUILD | 🟢 |
| **32** | 🟡 Social webhook qabul qiluvchi (`@Public()` + imzo tekshiruvi) — inbox'ni jonlantiradi | BUILD | 🟠 |

### To'lqin 5 — Sifat va dizayn (parallel, bloklanmagan)

| # | Tavsiya | Tur |
|---|---|---|
| **33** | 🟡 `--mod-marketing` tokenini `DIZAYN_QOIDALARI.md` + CSS'ga qo'shish; 9 sahifadagi ikki karra padding'ni olib tashlash; `WebsiteCMS`/`SocialInbox` ga `EPPageHeader` | FIX |
| **34** | 🟡 ~18 raw `<Skeleton>` → `EPSkeleton*`; ~16 inline bo'sh holat → `EPEmptyState`; ~20 `useMutation` ga `onError` (F2); `constants.ts:738-746` dagi **eskirgan 501-izohini** o'chirish | FIX |

### 9.1 Bajarish tartibi

```
  ┌──────────────────────────────────────────────────────────┐
  │ TO'LQIN 0 — OWNER (bloklovchi)                            │
  │   1 rol · 2 byudjet-jadval · 3 AI kalit · 4 campaign.id  │
  └───────────┬──────────────────────────────────────────────┘
              │
   ┌──────────┴───────────┬─────────────────────┐
   ▼                      ▼                     ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ TO'LQIN 1      │  │ TO'LQIN 2        │  │ TO'LQIN 5        │
│ create'larni   │  │ konvert/shartnoma│  │ dizayn + sifat   │
│ ochish 5-12    │  │ 13-21            │  │ 33-34            │
│ (parallel)     │  │ (parallel)       │  │ (mustaqil)       │
└───────┬────────┘  └────────┬─────────┘  └──────────────────┘
        │                    │
        └─────────┬──────────┘
                  ▼
        ┌───────────────────────┐
        │ TO'LQIN 3 — ROI       │
        │ 22 → 23               │
        │ 24 → 25 → 26          │  ← 24/25 siz 23 baribir 0 beradi
        └──────────┬────────────┘
                   ▼
        ┌───────────────────────┐
        │ TO'LQIN 4 — zanjirlar │
        │ 27 → 28 → 30          │
        │ 29 (Finance bilan)    │
        │ 31 · 32               │
        └───────────────────────┘
```

**Eng tez qiymat (1 kun, owner qarorisiz):** 13, 14, 22 — uchta bir qatorli tuzatish; lidlar ro'yxati to'ladi, faol kampaniyalar ko'rinadi, `Infinity%` yo'qoladi.

---

## Ilova A — Tekshiruv metodikasi

- **Marshrut inventari:** `mk_inv.py` — `CRMRoutes.tsx` + `constants.ts` + `AppRouter.tsx` ni parse qiladi.
- **Endpoint inventari:** `mk_be.py` — 9 controllerdan 117 endpoint; FE'dan 148 chaqiruv (53 unikal); drift = 0.
- **Rol yetib borish:** `mk_rbac.py` — `RolesGuard` mantiqini (`:61-100`) aynan takrorlaydi.
- **Vizyon:** `mk_vision.py` — `FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md:17583` dan 99 item.
- **DB:** jonli `europrint`; barcha yozuv probe'lari `BEGIN … ROLLBACK`.

## Ilova B — Rad etilgan da'volar (verify-don't-trust)

Quyidagi da'volar tekshiruvda **yiqildi** va hisobotga kiritilmadi:

| Da'vo | Nima uchun noto'g'ri |
|---|---|
| "Marketing BE'da ~60/99 endpoint 501 qaytaradi" (`constants.ts:740`) | Grep: `modules/marketing` da **0 ta** `501`/`notImplemented`. Izoh eskirgan |
| "Marketing moduli feature-flag bilan yashiringan" | `feature-flags.ts:33` → default **`true`**. Modul ko'rinadi |
| "`marketing-analytics-stubs.controller.ts` — stublar" | Fayl nomiga qaramay **48 handlerning hammasi real SQL** bajaradi |
| "`return {ok:true}` = green-lie" | Bular Result-pattern konstruktorlari |
| "AI-generate green-lie, hech narsa yozmaydi" | Aslida **real INSERT** qiladi (`marketing_content` / `blog_posts`); faqat matn qattiq yozilgan → "halol stub" |
| "`campaigns` jadvali kanonik" | Repo raw SQL **`marketing_campaigns`** ga tegadi (`campaigns.repository.ts:33,51,66`); `campaigns` = 0 qator, orphan |
| "`@Roles` bor, lekin guard yo'q" | `RolesGuard` — global `APP_GUARD` (`app.module.ts:197`) |
| "Marketing'da orphan sahifalar bor" | 16/16 marshrut sidebar'da; orphan = **0** |

## Ilova C — Tekshirilmagan (`unverified`)

1. `modules/bot-gateway` va `crm-auto-lead` ning `@Public()` imzo-gardi — `/marketing` bazasida emas, qamrovdan tashqarida.
2. `social_messages.conversation_id` `parseInt` drifti — 0 qator, runtime'da sinalmadi.
3. Ko'rgazma `budget: z.number()` 400 — kod-isbot bor, runtime HTTP so'rovi yuborilmadi.
4. `MarketingExtended` tabining brauzerdagi vizual holati — Phase 4 (browser verification) hali bajarilmagan.
