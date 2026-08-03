# P41 — MKT — Marketing: MKT schema fixes + 8-channel + ROI + NPS-event + churn/content crons + FE

> **Bajaruvchi:** Muslimbek · **To'lqin:** WAVE 1 · **Sana:** 2026-06-19
> **Bog'liqlik:** P01 (schema/barrel poydevori) BIRINCHI bajarilgan bo'lishi shart.
> **DDL Darvozasi:** FAOL — migratsiya fayllar YOZILADI lekin ISHGA TUSHIRILMAYDI, egasi ruxsatisiz.

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Ushbu fayl sening YAGONA vazifa manbandir. `CLAUDE.md` + `docs/agent-constitution.md` ni har sessiya boshida o'qi.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **`@Body` Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**To'lqin va bog'liqliklar:**
- **WAVE:** 1 (parallel ishga tushadi, P01 yakunlangandan keyin)
- **dependsOn:** `["P01"]` — P01 merge bo'lmagan holda bu agent BOSHLAMASIN

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

```
lib/db/src/schema/marketing-schema.ts
apps/api/src/modules/marketing/leads/leads.repository.ts
apps/api/src/modules/marketing/leads/leads.service.ts
apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts
apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts
apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts
apps/api/src/modules/marketing/domain/enums/campaign-status.enum.ts
apps/api/src/modules/marketing/presentation/dto/campaign.dto.ts
apps/api/src/modules/marketing/domain/events/index.ts
apps/api/src/modules/marketing/application/marketing-ext.service.ts
apps/api/src/modules/marketing/marketing.module.ts
apps/api/src/modules/marketing/campaigns/campaigns.service.ts
apps/api/src/modules/marketing/campaigns/campaigns.repository.ts
artifacts/erp-dashboard/src/pages/MarketingLeadsTypes.ts
artifacts/erp-dashboard/src/pages/MarketingLeadsDialogs.tsx
artifacts/erp-dashboard/src/pages/MarketingDashboard.tsx
artifacts/erp-dashboard/src/pages/MarketingDashboardTypes.ts
artifacts/erp-dashboard/src/pages/MarketingDashboardSections.tsx
artifacts/erp-dashboard/src/pages/MarketingContent.tsx
```

**DDL darvozasi:** Yangi migration fayli faqat egasi `-- APPROVED: <egasi> <sana>` imzosi bilan.
Migratsiya fayli joyi: `apps/api/src/shared/db/migrations/p41-mkt-fixes-<SANA>.sql`
Bu faylni YOZASAN lekin `psql` / `drizzle push` bilan ISHGA TUSHIRMAYSAN — egasi belgisi kelganidan keyin bajariladi.

---

## 2. VIZYON

**Manba:** `docs/audit/MUSLIMBEK-PROMT-18-MKT-2026-06-08.md`

EuroPrint Marketing moduli — Golden Thread kirish nuqtasi (lid → buyurtma → pul). T3 yordamchi modul. 8 ta kanal orqali B2B lidlarni kuzatish, kampaniya ROI ni hisoblash, egaga 5 ta raqam ko'rsatish.

**Qabul mezoni (har funksiya uchun "to'g'ri" nima):**

| Funksiya | Vizyon talabi (EP kod) | Qabul mezoni |
|---|---|---|
| 8-kanal | EP-MKT-031 | `channel` ustunida CHECK: 8+boshqa; FE dropdown 9 ta element |
| Kampaniya holati | EP-MKT-038 | 6 holat: draft→confirmed→active→paused→completed→cancelled |
| ROI formula | EP-MKT-051 | `(sotuv foydasi − marketing xarajat) / marketing xarajat`; `sales_orders`+`entries` dan real so'rov |
| Lead SLA cron | EP-MKT-048 | 15 daqiqa → signal; 4 soat → menejer; 24 soat → qayta tayinlash trigger |
| Egasi 5-raqam | EP-MKT-116 | Yangi/Yo'qolgan/Kichiklashayotgan/Savdo trendi/Eng katta xavf; **Director dashboard alohida widget** (Q674) |
| NPS@event | EP-MKT-015 | `@OnEvent('order.delivered')` → NPS so'rovnomasi → score 0-6 → mas'ulga vazifa |
| Churn cron | EP-MKT-084 | Kunlik cron; `sales_orders` tarixidan ritm × 1.5 hisoblash; signal → savdochiga |
| Content 5-bosqich | EP-MKT-070 | g'oya→matn→dizayn→tasdiq→joylandi; org-chart orqali routing |
| `getLeadsBySource` | - | `marketingLeads.source` bo'yicha GROUP BY (hozir `status` bo'yicha — xato) |
| Dup-telefon tekshiruvi | EP-MKT-046 | Lead yaratishda `phone` bo'yicha takror tekshiruvi, ogohlantirish |
| Lead scoring | EP-MKT-043/044 | 5 mezon bo'yicha avtomatik hisoblash (saqlaganda); channel/status proksi emas; **mezon vaznlari egasidan — EGASI QIYMATI KERAK** |
| `convertLeadToCrm` | - | UUID string id (hozir `parseInt` — xato) |
| NPS `papka_order_id` | - | `varchar(36)` (hozir `::int` cast — DB xatosi) |
| FE `segments` endpoint | - | `/api/marketing/segments` yo'q — FE buni so'ramasligi kerak |
| Kanal ro'yxati | EP-MKT-003 | Master-data (marketing boshlig'i qo'shadi/o'chiradi); `marketing_channel_config` jadval orqali; DB CHECK hardcode TAQIQ |
| Inbox SLA ish soati | Q655 | SLA faqat ish soatlarida hisoblanadi (09:00–18:00); astronomik vaqt emas |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (ishlayotgan — Q-46: O'CHIRMA)

- BE modul: `apps/api/src/modules/marketing/` — campaigns CQRS (create/update/launch), leads service+repo (real Drizzle INSERT/UPDATE/softDelete), `MarketingExtService` + `DrizzleMarketingExtRepository` (NPS real, hot-leads real, overdue-leads real, churn-risk real, inbox-stats real, leads-sources-summary real), `MarketingGroup2Service` (blog/budget/calendar/competitors/lead-contacts).
- Kontrollerlar ro'yxatdan o'tgan va himoyalangan: `MarketingController`, `MarketingContentController`, `MarketingAnalyticsController`, `MarketingAnalyticsStubsController`, `MarketingGroup2Controller`.
- Schema: `lib/db/src/schema/marketing-schema.ts` — `marketing_campaigns`, `marketing_content`, `marketing_ads`, `marketing_leads` (varchar id — TO'G'RI, lekin repo integer ishlatmoqda — xato), `content_calendar`, `exhibitions`, `exhibition_leads`, `pr_activities`, `marketing_budget_items`, `social_conversations`, `social_messages`, `social_api_configs`, `content_posts`, `blog_posts`, `marketing_budget_lines`, `marketing_settings`, `nps_responses`, `marketing_ab_tests`, `marketing_lead_contacts`.
- NPS: `npsResponses` jadvali mavjud; `getNps()`/`getNpsStats()` — real Drizzle so'rovlari.
- Churn-risk: `getChurnRisk()` — `sd_customers` dan real so'rov (mavjud).
- Social inbox: `social_conversations` + `social_messages` jadvallari mavjud.
- FE sahifalar: `MarketingDashboard`, `MarketingLeads` (+Dialogs +Sections +Types), va boshqalar — barchasi mavjud, smoke testlar bor.
- `getDashboardStats()` — `drizzle-marketing-ext.repo.ts:33` — real Drizzle so'rov, lekin `conversionRate: 0` hardcoded.
- `marketing.module.ts` — barcha provayderlar ro'yxatdan o'tgan.

### 3.2 Buzuq/Noto'g'ri (Q-46: TO'LIQ tuzatiladi)

**KRITIK — Tip mos kelmasligi (runtime xatosi):**

| # | Fayl:satr | Muammo | Tasdiqlash |
|---|---|---|---|
| B1 | `leads.repository.ts:41,59,68` | `findOne(id: number)`, `update(id: number)`, `softDelete(id: number)` — `eq(marketingLeads.id, id)` chaqiradi, lekin `marketing_leads.id` = `varchar(36)` UUID. Integer → varchar: noto'g'ri natija yoki runtime xato. | `marketing-schema.ts:140` qarang: `id: varchar("id", { length: 36 })` |
| B2 | `drizzle-marketing-ext.repo.ts:26-29` | `getCampaignStats(id: number)` — integer parametr qabul qiladi, `eq(marketingCampaigns.id, id)` chaqiradi, lekin `marketing_campaigns.id` = `varchar(36)`. | `marketing-schema.ts:17` qarang |
| B3 | `marketing-analytics-stubs.controller.ts:155` | NPS insert: `${dto['papka_order_id'] ?? null}::int` — lekin `nps_responses.papka_order_id` = `varchar(36)` (`marketing-schema.ts:575`). UUID ni `::int` ga aylantirib bo'lmaydi → DB xatosi. | |
| B4 | `marketing-analytics-stubs.controller.ts:275` | `convertLeadToCrm`: `WHERE id=${parseInt(id, 10)}` — UUID string → `parseInt('uuid-str')` = `NaN` → hech qachon topilmaydi. | |
| B5 | `marketing-analytics-stubs.controller.ts:323` | `getConversationMessages`: `conversation_id=${isNaN(convId) ? 0 : convId}` — `social_conversations.id` = `varchar(36)`. | |
| B6 | `marketing-analytics-stubs.controller.ts:341` | `replyToConversation`: `social_messages` ga integer cast id kiritmoqda. | |
| B7 | `drizzle-marketing-ext.repo.ts:215-222` | `getLeadsBySource()` — `marketingLeads.status` bo'yicha GROUP BY, lekin natija `source` sifatida etiketlanadi. FE yanlish ma'lumot ko'rsatadi. | |
| B8 | `marketing-schema.ts:34` | `marketing_campaigns_status_chk` faqat `'draft','active','paused','completed'` — `'cancelled'` yo'q, lekin `CampaignStatus.CANCELLED = 'cancelled'` enum da bor (`campaign-status.enum.ts:11`). Enum ≠ DB CHECK = constraint buzilishi. | |
| B9 | `marketing-analytics-stubs.controller.ts:209` | ROI: `getCampaignAnalytics()` `roi: 0` hardcoded qaytaradi. Profit-based formula yo'q. | |
| B10 | `MarketingDashboard.tsx:25` | `useQuery({ queryKey: ["/api/marketing/segments"] })` — bu endpoint HECH bir kontrollerda yo'q. Har doim 404/bo'sh. | |

**YO'Q (missing — qurilishi kerak):**

| # | Funksiya | EP kod | Hozirgi holat |
|---|---|---|---|
| M1 | 8-kanal CHECK constraint → master-data | EP-MKT-031 + EP-MKT-003 | `channel` free-text varchar, CHECK yo'q; FE `sourceLabels` 6 ta kalit (instagram/telegram/facebook/vositachi-diler yo'q). **⚠️ TUZATISH (INTERVYU-MOSLIK): CHECK hardcode TAQIQ — kanal ro'yxati `marketing_channel_config` master-data jadval orqali boshqarilishi kerak (EP-MKT-003: marketing boshlig'i qo'shadi/o'chiradi). Seed qatorlar + "EGASI QIYMATI KERAK" izohi — qarang § 4.1-A.** |
| M2 | Kampaniya holati 'confirmed' | EP-MKT-038 | DB CHECK 4 ta holat, enum 5 ta (confirmed yo'q), vizyon 6 ta talab qiladi |
| M3 | Lead SLA cron | EP-MKT-048 | `marketing.module.ts` da hech qanday SLA cron yo'q. **⚠️ DEFER-NOTE: SLA cron (15 daq→signal; 4 soat→menejer; 24 soat→qayta tayinlash) hujjatlanadi lekin to'liq amalga oshirish SLA ustunlari DDL ga bog'liq. Schema (M12) DDL GATED — egasi ruxsatidan keyin SLA-cron ham faollashtiriladi. Qarang § 4.1-B.** |
| M4 | Profit-based ROI | EP-MKT-051 | `getCampaignStats()` — `roi: 0` hardcoded; `sales_orders`+`entries` so'rovi yo'q |
| M5 | Egasi 5-raqam dashboard | EP-MKT-116 | `DashboardStats` tipida 5 ta raqam yo'q; dedicated endpoint yo'q. **⚠️ TUZATISH (INTERVYU-MOSLIK): 5-raqam widget Marketing dashboardida EMAS — Director dashboardda alohida widget (Q674: "Director dashboard'ning alohida widget'i sifatida, katta marketing panelidan ajratilgan"). BE endpoint `/api/director/marketing-summary` yoki `/api/marketing/owner/dashboard` (director-gated). FE = Director dashboard sahifasida, Marketing sahifasida EMAS. Qarang § 4.1-C.** |
| M6 | `LeadQualifiedEvent` | EP-MKT-005/074 | `domain/events/index.ts` da faqat `CampaignCreatedEvent`, `CampaignActivatedEvent`, `CampaignCompletedEvent` — lead eventi yo'q |
| M7 | NPS `@OnEvent('order.delivered')` | EP-MKT-015 | Hech qanday SD event listener yo'q marketing modulda |
| M8 | Churn detection cron | EP-MKT-084 | `getChurnRisk()` faqat on-demand; kunlik cron yo'q; signal savdochiga bormasligi |
| M9 | Content 5-bosqich approval | EP-MKT-070 | `content_posts.status` CHECK: `'draft','scheduled','published','archived'` — 5-bosqich workflow holatlari yo'q |
| M10 | Lead dup-phone tekshiruvi | EP-MKT-046 | `leads.service.ts` da tekshiruv yo'q |
| M11 | Lead scoring 5-mezon | EP-MKT-043/044 | `recalculateLeadScores` faqat channel+status proksi ishlatadi. **⚠️ TUZATISH (INTERVYU-MOSLIK): 5 mezon = buyurtma hajmi / shoshilinchlik / byudjet aniqligi / mahsulot mosligi / qayta mijoz. Har mezon VAZNI egasidan (EP-MKT-044: "buyurtma hajmi eng og'ir 40% tavsiya, lekin egasi belgilaydi"). Direktiva o'zboshimcha vaznlar o'ylab chiqarmasin — `marketing_scoring_config` jadvaliga ko'chir, "EGASI QIYMATI KERAK" izohi bilan. Qarang § 4.1-D.** |
| M12 | SLA ustunlari | EP-MKT-048 | `marketing_leads` da `sla_first_response_at`, `sla_manager_notified_at`, `sla_reassigned_at` yo'q |
| M13 | `marketing_campaign_channels` jadval | EP-MKT-033 | Yo'q — kampaniya bitta `platform` varchar ga ega |
| M14 | Inbox SLA ish soati filtratsiyasi | Q655 | SLA hisobi astronomik vaqt bo'yicha ishlaydi — holbuki Q655: "SLA faqat ish soatlarida hisoblanadi (soat 22:00 dagi xabar ertangi 09:00 dan boshlab)". **⚠️ DEFER-NOTE: ish soati konfiguratsiyasi (biznes_hours) `marketing_settings` jadvalidan o'qilishi kerak — EGASI QIYMATI KERAK (standart 09:00–18:00). Amalga oshirish SLA cron bilan birga (M3 bilan bog'liq).** |

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl ko'rsatiladi, aniq o'zgarish, oldin/keyin sxema, standart tekshiruv.
> **Bir vaqtda FAQAT bitta mantiqiy guruh** bajariladi; har guruhdan keyin `tsc 0` + DB-proof.

---

### QADAM 1 — Schema fixes: 8-kanal master-data + kampaniya holati (DDL GATED)

> **⚠️ INTERVYU-MOSLIK TUZATISHLARI (00-INTERVYU-MOSLIK.md §5 → P41):**
>
> **§ 4.1-A — Kanal ro'yxati: DB CHECK → master-data (EP-MKT-003)**
> Egasi Q674 va EP-MKT-003 da aniq: "sozlamalarda kanal ro'yxati, marketing boshlig'i
> o'zi qo'shadi/o'chiradi (master-data)". DB CHECK constraint'ga 8 ta kanal qotirish
> bu falsafaga ZID — deploy talab qilmay o'zgartirib bo'lmaydi.
>
> **To'g'ri yondashuv:**
> - `marketing_channel_config` yoki `marketing_settings` jadvaliga 8 ta kanal seed qator sifatida.
> - `marketing_leads.channel` ustunida faqat `NOT NULL` yoki soft validate (FK emas, chunki
>   egasi o'chirilgan kanalning eski lead'larini buzmoqchi emas).
> - DB CHECK **o'chiriladi** (yoki juda keng `'boshqa'` inclusive ga almashtirilib, real
>   enforcement DB'da emas, service qatlamida `marketing_channel_config` so'rovi bilan).
> - `-- ⚠️ EGASI QIYMATI KERAK: dastlabki 8 ta kanal seed'ini egasi tasdiqlaydi.`
>
> **§ 4.1-B — Lead SLA cron (EP-MKT-048) — DEFER-NOTE**
> SLA cron mantig'i: 15 daq javobsiz → signal, 4 soat → menejer, 24 soat → qayta tayinlash.
> Bu mantiq SLA ustunlari (`sla_first_response_at`, `sla_manager_notified_at`,
> `sla_reassigned_at`) DDL ga bog'liq. DDL GATED — egasi ruxsatidan keyin cron faollashtiriladi.
>
> Bajaruvchi YOZADI (fayl mantig'i, `@Cron` dekorator, service metod) lekin cron DDL
> migration bilan birga qayta ko'rib chiqiladi. Egasi migratsiyani imzolagunga qadar
> `sla_first_response_at` mavjud emas — cron `marketing_leads.created_at` bilan ishlaydi
> (taxminiy fallback). Hujjat izohida belgilanadi: `// TODO(EP-MKT-048): SLA columns DDL
> GATED — switch to sla_first_response_at after migration approved.`
>
> **§ 4.1-C — Egasi 5-raqam: Marketing dashboardidan OLIB TASHLASH → Director dashboardga (EP-MKT-116 + Q674)**
> Q674 (VISION-1000): "Director dashboard'ning **alohida widget'i** sifatida,
> **katta marketing panelidan ajratilgan** (ega vaqti tiqiz)."
>
> **Bajaruvchi uchun aniq ko'rsatma:**
> - `MarketingDashboard.tsx` da `Owner5NumbersPanel` va `ownerDashboard` query **YO'Q** —
>   bu komponent va endpoint **Director dashboard** paketi (P29/P30) ga tegishli.
> - `MarketingDashboardSections.tsx` da `Owner5NumbersPanel` eksport qilinadi **LEKIN**
>   Marketing sahifasida render QILINMAYDI.
> - BE endpoint `/api/marketing/owner/dashboard` yoki `/api/director/marketing-summary` da
>   qolishi mumkin — lekin faqat Director dashboard FE chaqiradi.
> - `drizzle-marketing-ext.repo.ts` va `marketing-ext.service.ts` da `getOwnerDashboard()`
>   metodi yoziladi (BE logika shu yerda turishi OK — data marketing moduldan keladi),
>   lekin Controller endpointi Director bo'limiga yo'naltirilishi kerak yoki P29 bilan
>   koordinatsiya qilinadi.
> - `-- ⚠️ P29/P30 (Director dashboard) egalari bilan koordinatsiya kerak: Owner5NumbersPanel
>   Director dashboard paketiga o'tkaziladi.`
>
> **§ 4.1-D — Lead scoring 5-mezon vaznlari: hardcode TAQIQ (EP-MKT-044)**
> EP-MKT-044 (MASTER-SAVOL-JAVOB): "5 mezon: buyurtma hajmi/shoshilinchlik/byudjet
> aniqligi/mahsulot mosligi/qayta mijoz; har mezon VAZNI egasidan — A tavsiya buyurtma hajmi
> 40%, lekin egasi belgilaydi."
>
> Direktiva o'zboshimcha vaznlar (`40/25/15/10/10` kabi) kiritmasin. O'rniga:
> - `marketing_scoring_config` jadvalga seed qatorlar: `mezon_nomi`, `vazn` (NULL yoki 0
>   bo'sh qiymat bilan), izoh: `-- EGASI QIYMATI KERAK: har mezonning foiz vaznini egasi belgilaydi.`
> - Scoring logika vaznlarni DB dan o'qiydi, kod konstantasi emas.
> - DDL GATED — migration fayli yoziladi, ishga tushirilmaydi.

**Fayl:** `lib/db/src/schema/marketing-schema.ts`

**1a. `marketing_leads.channel` — DB CHECK QO'SHILMAYDI; `marketing_channel_config` jadval YARATILADI (EP-MKT-003, § 4.1-A):**

> ⚠️ INTERVYU-MOSLIK TUZATISH: Kanal ro'yxati `marketing_channel_config` master-data
> jadval orqali boshqariladi — marketing boshlig'i deploy qilmasdan qo'shadi/o'chiradi.
> Schema `(t) => [...]` blokida channel uchun CHECK QO'SHILMAYDI.

`marketing_leads` `(t) => [...]` bloki — channel CHECK YO'Q (hozirgi holat saqlanadi):
```typescript
], (t) => [
  check("marketing_leads_status_chk", sql`${t.status} IN ('new','qualified','contacted','converted','lost')`),
  check("marketing_leads_score_chk", sql`${t.score} IS NULL OR ${t.score} >= 0`),
  // channel CHECK YO'Q — master-data (marketing_channel_config) orqali boshqariladi (EP-MKT-003)
]);
```

`marketing_channel_config` jadval sxemasini `marketing-schema.ts` ga qo'sh (DDL GATED):
```typescript
// EP-MKT-003: Kanal ro'yxati — marketing boshlig'i ekrandan qo'shadi/o'chiradi, deploy kerak emas.
// -- ⚠️ EGASI QIYMATI KERAK: dastlabki 8 ta kanal sluglari va labellarini egasi tasdiqlaydi.
export const marketingChannelConfig = pgTable('marketing_channel_config', {
  id:        serial('id').primaryKey(),
  slug:      varchar('slug', { length: 50 }).notNull().unique(),   // 'instagram', 'telegram', ...
  label:     varchar('label', { length: 100 }).notNull(),           // 'Instagram', 'Telegram', ...
  isActive:  boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

Service qatlamida validation (`leads.service.ts` `create()` metodida):
```typescript
// channel validatsiyasi — DB CHECK emas, master-data so'rovi orqali:
if (dto.channel) {
  const validChannels = await db.select({ slug: marketingChannelConfig.slug })
    .from(marketingChannelConfig)
    .where(eq(marketingChannelConfig.isActive, true));
  const slugs = validChannels.map(r => r.slug);
  if (!slugs.includes(dto.channel)) {
    return Err(`EP-MKT-003: Noto'g'ri kanal '${dto.channel}'. Ruxsat etilgan: ${slugs.join(', ')}`);
  }
}
```

Shuningdek `marketing_leads` jadvaliga SLA ustunlari qo'sh (satr 160-162 ga, `convertedAt` dan keyin):
```typescript
  convertedAt: timestamp("converted_at"),
  // SLA tracking (EP-MKT-048)
  slaFirstResponseAt: timestamp("sla_first_response_at"),
  slaManagerNotifiedAt: timestamp("sla_manager_notified_at"),
  slaReassignedAt: timestamp("sla_reassigned_at"),
```

> **DEFER-NOTE (§ 4.1-B — Lead SLA cron, EP-MKT-048):**
> SLA ustunlari DDL GATED — egasi imzolagunga qadar `sla_*` ustunlar DB da yo'q.
> `marketing-ext.service.ts` da SLA cron skeleti yoziladi, lekin `created_at` fallback bilan:
> ```typescript
> // TODO(EP-MKT-048): SLA columns DDL GATED — switch to sla_first_response_at after migration approved.
> // EGASI QIYMATI KERAK: ish soati chegarasi (sozlanadigan, marketing_settings jadvalidan).
> // Hozircha fallback: created_at dan 15 daq, 4 soat, 24 soat astronomik.
> // Q655: ish soatlarida SLA (09:00–18:00) — bu sozlama marketing_settings.business_hours_start/end.
> ```
> Inbox SLA ish soati konfiguratsiyasi (Q655) ham `marketing_settings` jadvaliga qo'shiladi:
> `business_hours_start` (default '09:00') va `business_hours_end` (default '18:00') —
> **EGASI QIYMATI KERAK** before production.

**1b. `marketing_campaigns.status` CHECK ni kengaytir (satr 34):**

Oldin:
```typescript
  check("marketing_campaigns_status_chk", sql`${t.status} IN ('draft','active','paused','completed')`),
```

Keyin:
```typescript
  check("marketing_campaigns_status_chk", sql`${t.status} IN ('draft','confirmed','active','paused','completed','cancelled')`),
```

**1c. `content_posts.status` CHECK ni 5-bosqich uchun kengaytir (satr 473):**

Oldin:
```typescript
  check("content_posts_status_chk", sql`${t.status} IN ('draft','scheduled','published','archived')`),
```

Keyin:
```typescript
  check("content_posts_status_chk", sql`${t.status} IN ('draft','matn_tayyor','dizayn_tayyor','tasdiqlanган','joylandi','archived')`),
```

> ⚠️ DIQQAT: Schema faylini o'zgartirish Drizzle tip generatsiyasiga ta'sir qiladi. `pnpm -w run build:schemas` ni ishga tushir. DDL migration GATED (qarang § 5).

---

### QADAM 2 — `campaign-status.enum.ts` va `domain/events/index.ts`

**Fayl:** `apps/api/src/modules/marketing/domain/enums/campaign-status.enum.ts`

Oldin:
```typescript
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

Keyin (6 holat — vizyon EP-MKT-038 ga mos):
```typescript
export enum CampaignStatus {
  DRAFT     = 'draft',
  CONFIRMED = 'confirmed',   // Tasdiqlangan
  ACTIVE    = 'active',      // Faol
  PAUSED    = 'paused',      // To'xtatilgan
  COMPLETED = 'completed',   // Tugadi
  CANCELLED = 'cancelled',   // Bekor
}

export enum CampaignType {
  EMAIL     = 'email',
  SMS       = 'sms',
  SOCIAL    = 'social',
  TELEGRAM  = 'telegram',
  PROMOTION = 'promotion',
}
```

**Fayl:** `apps/api/src/modules/marketing/domain/events/index.ts`

Mavjud eventlarga `LeadQualifiedEvent` qo'sh (B6, EP-MKT-005/074):
```typescript
export class CampaignCreatedEvent {
  constructor(readonly campaignId: string, readonly name: string) {}
}

export class CampaignActivatedEvent {
  constructor(readonly campaignId: string, readonly startDate: Date) {}
}

export class CampaignCompletedEvent {
  constructor(readonly campaignId: string, readonly endDate: Date) {}
}

// EP-MKT-005/074 — Lead → SD golden thread
export class LeadQualifiedEvent {
  constructor(
    readonly leadId: string,
    readonly leadName: string,
    readonly phone: string | null,
    readonly company: string | null,
    readonly channel: string | null,
    readonly score: number,
    readonly qualifiedAt: Date,
  ) {}
}

// EP-MKT-015 — NPS auto-trigger
export class NpsRequestedEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: number,
    readonly customerName: string,
  ) {}
}
```

---

### QADAM 3 — `leads.repository.ts` — tip moslashtirish (B1 tuzatish)

**Fayl:** `apps/api/src/modules/marketing/leads/leads.repository.ts`

Barcha metodlarda `id: number` → `id: string` ga o'zgartir. `eq(marketingLeads.id, id)` to'g'ri ishlaydi chunki ikkisi ham `string`.

```typescript
// OLDIN (satr 41):
async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {
    const rows = await db.select().from(marketingLeads).where(and(eq(marketingLeads.id, id), isNull(marketingLeads.deletedAt)));

// KEYIN:
async findOne(id: string): Promise<Result<Record<string, unknown> | null>> {
  try {
    const rows = await db.select().from(marketingLeads).where(and(eq(marketingLeads.id, id), isNull(marketingLeads.deletedAt)));
```

```typescript
// OLDIN (satr 59):
async update(id: number, values: Partial<typeof marketingLeads.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await db.update(marketingLeads).set(values).where(eq(marketingLeads.id, id)).returning();

// KEYIN:
async update(id: string, values: Partial<typeof marketingLeads.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await db.update(marketingLeads).set(values).where(eq(marketingLeads.id, id)).returning();
```

```typescript
// OLDIN (satr 68):
async softDelete(id: number): Promise<Result<void>> {
  try {
    await db.update(marketingLeads).set({ deletedAt: _time.now() }).where(eq(marketingLeads.id, id));

// KEYIN:
async softDelete(id: string): Promise<Result<void>> {
  try {
    await db.update(marketingLeads).set({ deletedAt: _time.now() }).where(eq(marketingLeads.id, id));
```

**Dup-telefon tekshiruvi (M10 — EP-MKT-046) qo'sh:**

```typescript
// Yangi metod — leads.repository.ts oxiriga qo'sh:
async findByPhone(phone: string): Promise<Result<Record<string, unknown> | null>> {
  try {
    const rows = await db.select().from(marketingLeads)
      .where(and(eq(marketingLeads.phone, phone), isNull(marketingLeads.deletedAt)))
      .limit(1);
    return Ok(rows[0] ?? null);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

---

### QADAM 4 — `leads.service.ts` — dup-telefon + LeadQualifiedEvent

**Fayl:** `apps/api/src/modules/marketing/leads/leads.service.ts`

Ushbu faylni avval o'qi (`Read` tool). Keyin:

**4a. `create()` metodiga dup-telefon tekshiruvi qo'sh:**
```typescript
// create() metodida, DB insert dan OLDIN:
if (dto.phone) {
  const existing = await this.repo.findByPhone(dto.phone);
  if (existing.ok && existing.data !== null) {
    // Ogohlantirish qaytarish, to'sib qo'ymaslik (EP-MKT-046: merge taklifi)
    this.logger.warn(`EP-MKT-046: Duplicate phone lead attempted: ${dto.phone}`);
    // Result orqali FE ga flag yubor — haqiqiy xato emas
    return Ok({ ...existing.data, _duplicateWarning: true, _existingLeadId: (existing.data as Record<string, unknown>).id });
  }
}
```

**4b. `update()` metodiga `LeadQualifiedEvent` publish qo'sh:**
```typescript
// update() ichida, status 'qualified' yoki 'warm' ga o'tganda:
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadQualifiedEvent } from '../domain/events';

// constructor ga EventEmitter2 inject et
constructor(
  private readonly repo: LeadsRepository,
  private readonly events: EventEmitter2,
) {}

// update() metodida:
if (dto.status === 'qualified' && currentLead.data?.status !== 'qualified') {
  this.events.emit('marketing.lead.qualified', new LeadQualifiedEvent(
    id,
    String(currentLead.data?.name ?? ''),
    currentLead.data?.phone as string | null,
    currentLead.data?.company as string | null,
    currentLead.data?.channel as string | null,
    Number(currentLead.data?.score ?? 0),
    new Date(),
  ));
  this.logger.log(`EP-MKT-005: LeadQualifiedEvent emitted for lead ${id}`);
}
```

**4c. Lead scoring 5-mezon — configurable vaznlar (M11, EP-MKT-043/044, § 4.1-D):**

> ⚠️ INTERVYU-MOSLIK TUZATISH: `recalculateLeadScores` channel/status proksi ishlatadi —
> bu NOTO'G'RI. EP-MKT-044: 5 mezon bo'lishi kerak. Lekin mezon VAZNLARI egasidan.
> Direktiva o'zboshimcha raqamlar (masalan `40/25/15/10/10`) KOD KONSTANTASI sifatida
> KIRITMASIN — `marketing_scoring_config` jadvaldan o'qilsin.

```typescript
// leads.service.ts da yangi yoki mavjud recalculateLeadScores() metod:
// EGASI QIYMATI KERAK: marketing_scoring_config jadvalida har mezon uchun vazn belgilansin.
// Hozircha teng taqsimot (20% har biri) — egasi sozlagunga qadar placeholder.
private async calculateLeadScore(lead: Record<string, unknown>): Promise<number> {
  // TODO(EP-MKT-044): Vaznlarni marketing_scoring_config jadvalidan o'qi (DDL GATED + egasi qiymati).
  // Hozircha teng taqsimot fallback:
  let score = 0;
  // 1. Buyurtma hajmi (company size / estimated_value) — EGASI QIYMATI KERAK
  if (lead.estimatedValue && Number(lead.estimatedValue) > 0) score += 20;
  // 2. Shoshilinchlik (urgency) — lead.urgency yoki qayta aloqa tezligi
  if (lead.urgency === 'high') score += 20;
  else if (lead.urgency === 'medium') score += 10;
  // 3. Byudjet aniqligi — budget_confirmed ustuni bo'lsa
  if (lead.budgetConfirmed) score += 20;
  // 4. Mahsulot mosligi — product_interest to'ldirilgan
  if (lead.productInterest) score += 20;
  // 5. Qayta mijoz — crm_lead_id yoki company allaqachon mijoz
  if (lead.isReturningCustomer) score += 20;
  return Math.min(score, 100);
}
```

> Izoh: `marketing_scoring_config` jadval (DDL GATED) va `marketing_channel_config` bilan
> birga p41-mkt-schema-fixes-2026-06-19.sql ga qo'shiladi. Seed:
> `INSERT INTO marketing_scoring_config (criterion, weight, description) VALUES ...`
> — **EGASI QIYMATI KERAK** (har mezon uchun foiz, jami 100).

---

### QADAM 5 — `drizzle-marketing-ext.repo.ts` — 5 ta xatoni tuzatish

**Fayl:** `apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts`

**5a. `getCampaignStats(id: string)` — integer → string (B2 tuzatish, satr 26):**

```typescript
// OLDIN:
async getCampaignStats(id: number): Promise<Result<Record<string, unknown>>> {
  return safeCall(async () => {
    const [row] = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id)).limit(1);
    return row ? { ...row, impressions: 0, clicks: 0, conversions: 0, roi: 0 } : { id, impressions: 0, clicks: 0, conversions: 0, roi: 0 };
  });
}

// KEYIN — profit-based ROI formula (EP-MKT-051):
async getCampaignStats(id: string): Promise<Result<Record<string, unknown>>> {
  return safeCall(async () => {
    const [row] = await db.select().from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id)).limit(1);
    if (!row) return { id, impressions: 0, clicks: 0, conversions: 0, roi: 0, cpl: 0 };

    // Profit-based ROI: (sotuv foydasi - marketing xarajat) / marketing xarajat
    // Kanonik jadvallar: sales_orders (H1), entries (H3-GL)
    // NOTE: murakkab cross-table — raw SQL typedExecute ishlatiladi
    const profitRows = await typedExecute<{ totalRevenue: string; totalCost: string }>(sql`
      SELECT
        COALESCE(SUM(so.total_amount), 0) AS "totalRevenue",
        COALESCE(SUM(e.debit_amount), 0)  AS "totalCost"
      FROM sales_orders so
      LEFT JOIN entries e ON e.reference_id = ${id} AND e.account_code LIKE '7%'
      WHERE so.campaign_id = ${id}
        AND so.deleted_at IS NULL
    `);
    const revenue     = Number(profitRows[0]?.totalRevenue ?? 0);
    const mktCost     = Number(row.spentAmount ?? row.budget ?? 0);
    const profit      = revenue - mktCost;
    const roi         = mktCost > 0 ? Math.round((profit / mktCost) * 100 * 10) / 10 : 0;
    const leadCount   = await db.select({ cnt: sql<number>`count(*)::int` })
      .from(marketingLeads).where(and(eq(marketingLeads.campaignId, id), isNull(marketingLeads.deletedAt)));
    const totalLeads  = Number(leadCount[0]?.cnt ?? 0);
    const cpl         = totalLeads > 0 ? Math.round((mktCost / totalLeads) * 100) / 100 : 0;

    return { ...row, impressions: 0, clicks: 0, conversions: 0, roi, cpl, revenue, profit };
  });
}
```

**5b. `getLeadsBySource()` — status → source GROUP BY tuzatish (B7 tuzatish, satr 213-222):**

```typescript
// OLDIN (satr 213-222):
async getLeadsBySource(): Promise<Result<Record<string, unknown>[]>> {
  return safeCall(async () => {
    const rows = await db.select({
      source: marketingLeads.status,   // ← XATO: status bo'yicha
      count: sql<number>`count(*)::int`,
    })
      .from(marketingLeads)
      .where(isNull(marketingLeads.deletedAt))
      .groupBy(marketingLeads.status);  // ← XATO
    return rows;
  });
}

// KEYIN — source ustuni bo'yicha (to'g'ri):
async getLeadsBySource(): Promise<Result<Record<string, unknown>[]>> {
  return safeCall(async () => {
    const rows = await db.select({
      source: marketingLeadsCanonical.source,
      count:  sql<number>`count(*)::int`,
    })
      .from(marketingLeadsCanonical)
      .where(isNull(marketingLeadsCanonical.deletedAt))
      .groupBy(marketingLeadsCanonical.source);
    return rows;
  });
}
```

**5c. Egasi 5-raqam — `getOwnerDashboard()` metod (M5 — EP-MKT-116, § 4.1-C):**

> ⚠️ INTERVYU-MOSLIK TUZATISH: `getOwnerDashboard()` BE metodi shu yerda yoziladi
> (data marketing moduldan keladi — to'g'ri). Lekin bu metodga kirish Controller'i
> **Director dashboard** paketiga (P29/P30) tegishli. `marketing-ext.service.ts` va
> `drizzle-marketing-ext.repo.ts` da metod yoziladi, lekin FE bu ma'lumotni
> **Marketing sahifasida emas, Director dashboard sahifasida** ko'rsatadi (Q674).
> `-- ⚠️ P29/P30 (Director dashboard) egalari bilan koordinatsiya: Owner5NumbersPanel
>  Director dashboard paketiga o'tkaziladi; Marketing dashboard sahifasida render yo'q.`

```typescript
// Fayl oxiriga qo'sh:
// NOTE(EP-MKT-116+Q674): Bu metod Director dashboard uchun — Marketing dashboard FE da render qilinmaydi.
async getOwnerDashboard(): Promise<Result<{
  yangiMijozlar:         number;
  yoqolganMijozlar:      number;
  kichiklashayotganMijozlar: number;
  savdoTrendi:           number;  // MoM % o'zgarish
  engKattaXavf:          { customerName: string; atRiskRevenue: number } | null;
  diqqatTalab:           string[];
}>> {
  return safeCall(async () => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // 1. Yangi mijozlar (bu oy birinchi marta buyurtma berganlar)
    const [newCustRow] = await typedExecute<{ cnt: string }>(sql`
      SELECT COUNT(DISTINCT customer_id)::text AS cnt FROM sales_orders
      WHERE created_at >= ${start.toISOString()} AND deleted_at IS NULL
        AND customer_id NOT IN (
          SELECT DISTINCT customer_id FROM sales_orders
          WHERE created_at < ${start.toISOString()} AND deleted_at IS NULL
        )
    `);
    const yangiMijozlar = Number(newCustRow?.cnt ?? 0);

    // 2. Yo'qolgan mijozlar (churn detected — 90+ kun buyurtma yo'q)
    const churnRows = await typedExecute<{ cnt: string }>(sql`
      SELECT COUNT(*)::text AS cnt FROM sd_customers
      WHERE status = 'active'
        AND last_order_date < NOW() - INTERVAL '90 days'
        AND deleted_at IS NULL
    `);
    const yoqolganMijozlar = Number(churnRows[0]?.cnt ?? 0);

    // 3. Kichiklashayotgan mijozlar (oxirgi oy buyurtma hajmi oldingi oydan 20%+ kam)
    const [shrinkRow] = await typedExecute<{ cnt: string }>(sql`
      SELECT COUNT(DISTINCT customer_id)::text AS cnt FROM (
        SELECT customer_id,
          SUM(CASE WHEN created_at >= ${start.toISOString()} THEN total_amount ELSE 0 END) AS cur_month,
          SUM(CASE WHEN created_at >= ${prev.toISOString()} AND created_at < ${start.toISOString()} THEN total_amount ELSE 0 END) AS prev_month
        FROM sales_orders WHERE deleted_at IS NULL GROUP BY customer_id
      ) t WHERE prev_month > 0 AND cur_month < prev_month * 0.8
    `);
    const kichiklashayotganMijozlar = Number(shrinkRow?.cnt ?? 0);

    // 4. Savdo trendi (MoM % o'zgarish)
    const [trendRow] = await typedExecute<{ curRevenue: string; prevRevenue: string }>(sql`
      SELECT
        SUM(CASE WHEN created_at >= ${start.toISOString()} THEN total_amount ELSE 0 END)::text AS "curRevenue",
        SUM(CASE WHEN created_at >= ${prev.toISOString()} AND created_at < ${start.toISOString()} THEN total_amount ELSE 0 END)::text AS "prevRevenue"
      FROM sales_orders WHERE deleted_at IS NULL
    `);
    const cur  = Number(trendRow?.curRevenue ?? 0);
    const prv  = Number(trendRow?.prevRevenue ?? 0);
    const savdoTrendi = prv > 0 ? Math.round(((cur - prv) / prv) * 1000) / 10 : 0;

    // 5. Eng katta xavf (eng katta xavf ostidagi mijoz × uning o'rtacha oylik daromadi)
    const riskRows = await typedExecute<{ customerId: number; customerName: string; avgMonthlyRevenue: string; daysSince: number }>(sql`
      SELECT so.customer_id AS "customerId", sc.name AS "customerName",
        AVG(so.total_amount)::text AS "avgMonthlyRevenue",
        EXTRACT(DAY FROM NOW() - MAX(so.created_at))::int AS "daysSince"
      FROM sales_orders so
      JOIN sd_customers sc ON sc.id = so.customer_id
      WHERE so.deleted_at IS NULL AND sc.deleted_at IS NULL
      GROUP BY so.customer_id, sc.name
      HAVING EXTRACT(DAY FROM NOW() - MAX(so.created_at)) >= 60
      ORDER BY AVG(so.total_amount) DESC
      LIMIT 1
    `);
    const engKattaXavf = riskRows[0]
      ? { customerName: riskRows[0].customerName, atRiskRevenue: Number(riskRows[0].avgMonthlyRevenue) }
      : null;

    // Diqqat talab — yuqori ustuvor harakatlar
    const diqqatTalab: string[] = [];
    if (yoqolganMijozlar > 0) diqqatTalab.push(`${yoqolganMijozlar} ta mijoz 90+ kun buyurtma bermagan`);
    if (kichiklashayotganMijozlar > 0) diqqatTalab.push(`${kichiklashayotganMijozlar} ta mijozda buyurtma hajmi kamaymoqda`);
    if (savdoTrendi < -10) diqqatTalab.push(`Savdo o'tgan oydan ${Math.abs(savdoTrendi)}% pasaydi`);

    return { yangiMijozlar, yoqolganMijozlar, kichiklashayotganMijozlar, savdoTrendi, engKattaXavf, diqqatTalab };
  });
}
```

Import qo'sh: `import { typedExecute } from '@shared/db/typed-execute';` va `sql` import bor ekanligini tekshir.

---

### QADAM 6 — `marketing-analytics-stubs.controller.ts` — UUID/int xatolarini tuzatish

**Fayl:** `apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts`

**6a. NPS insert — `papka_order_id::int` → string (B3 tuzatish, satr 155):**

```typescript
// OLDIN (satr 151-165):
const r = await db.execute(sql`
  INSERT INTO nps_responses (id, papka_order_id, customer_id, score, comment, created_at)
  VALUES (
    gen_random_uuid()::text,
    ${dto['papka_order_id'] ?? dto['orderId'] ?? null}::int,   // ← XATO
    ...
  )
`);

// KEYIN — varchar(36), ::int yo'q:
const papkaOrderId = dto['papka_order_id'] ?? dto['orderId'] ?? null;
const r = await db.execute(sql`
  INSERT INTO nps_responses (id, papka_order_id, customer_id, score, comment, created_at)
  VALUES (
    gen_random_uuid()::text,
    ${papkaOrderId}::text,                                       // ← TO'G'RI
    ${dto['customer_id'] ?? dto['customerId'] ?? null}::int,
    ${score}::int,
    ${dto['comment'] ?? dto['feedback'] ?? null}::text,
    NOW()
  )
  RETURNING id, score
`);
```

**6b. `convertLeadToCrm` — parseInt → string id (B4 tuzatish, satr 275):**

```typescript
// OLDIN (satr 275):
const ml = first(await db.execute(sql`
  SELECT * FROM marketing_leads WHERE id=${parseInt(id, 10)} AND deleted_at IS NULL LIMIT 1
`));
// ... va satr 299:
WHERE id=${parseInt(id, 10)}

// KEYIN — UUID string to'g'ridan ishlat:
const ml = first(await db.execute(sql`
  SELECT * FROM marketing_leads WHERE id=${id} AND deleted_at IS NULL LIMIT 1
`));
// ... va:
WHERE id=${id}
```

**6c. `getConversationMessages` — parseInt → string (B5 tuzatish, satr 323):**

```typescript
// OLDIN (satr 323-329):
async getConversationMessages(@Param('id') id: string) {
  const convId = parseInt(id, 10);
  const data = rows(await db.execute(sql`
    SELECT * FROM social_messages
    WHERE conversation_id=${isNaN(convId) ? 0 : convId}

// KEYIN — UUID string:
async getConversationMessages(@Param('id') id: string) {
  const data = rows(await db.execute(sql`
    SELECT * FROM social_messages
    WHERE conversation_id=${id}
    ORDER BY sent_at ASC
    LIMIT 200
  `));
  return { items: data, total: data.length };
}
```

**6d. `replyToConversation` — integer cast o'chir (B6 tuzatish, satr 337-341):**

```typescript
// OLDIN (satr 337-341):
const convId = parseInt(id, 10);
const msgId = `MSG-${Date.now()}`;
const row = first(await db.execute(sql`
  INSERT INTO social_messages (id, conversation_id, direction, text, is_read, is_ai, sent_at)
  VALUES (${msgId}, ${isNaN(convId) ? 0 : convId}, ...

// KEYIN — UUID:
const msgId = crypto.randomUUID();
const row = first(await db.execute(sql`
  INSERT INTO social_messages (id, conversation_id, direction, text, is_read, is_ai, sent_at)
  VALUES (${msgId}, ${id}, 'outgoing',
          ${String(dto.message ?? dto.content ?? '')}, true, false, NOW())
  RETURNING *
`));
await db.execute(sql`
  UPDATE social_conversations SET last_message=${String(dto.message ?? dto.content ?? '')},
    last_message_at=NOW(), updated_at=NOW() WHERE id=${id}
`);
return { data: row };
```

**6e. `exhibitions` CRUD — parseInt → UUID (satr 395, 408, 417, 429, 444, 463, 471, 495, 505):**

Barcha `parseInt(id, 10)` lar `${id}` ga o'zgartirilsin. `exhibitions.id` = `varchar(36)`, integer emas. (`marketing-schema.ts:210` tekshir).

```typescript
// Barcha exhibition SQL larda:
WHERE id=${parseInt(id, 10)}   // ← XATO
WHERE id=${id}                 // ← TO'G'RI
```

**6f. Egasi 5-raqam endpoint — MarketingAnalyticsStubsController da (§ 4.1-C):**

> ⚠️ INTERVYU-MOSLIK TUZATISH: Bu endpoint BE da `marketing` modulida turishiga RUXsAT
> (data marketing jadvallari/sales_orders dan keladi). Lekin bu endpointni **faqat
> Director dashboard FE chaqiradi** — Marketing dashboard FE CHAQIRMAYDI (Q674).
> P29/P30 (Director dashboard) paketi shu endpointni FE ga ulaydi.

```typescript
// Fayl oxiriga qo'sh (MarketingAnalyticsStubsController klassi ichida):
// NOTE(Q674): Bu endpoint Director dashboard uchun — Marketing FE da useQuery YO'Q.
// P29/P30 bilan koordinatsiya: Director dashboard paketida /api/marketing/owner/dashboard dan foydalaniladi.
@Get('owner/dashboard')
@Roles('super_admin', 'director')  // Faqat ega/director
async getOwnerDashboard() {
  return unwrapOrThrow(await this.svc.getOwnerDashboard());
}
```

Shuningdek `MarketingExtService`'ga `getOwnerDashboard()` metodni `marketing-ext.service.ts` ga qo'sh (delegate qiladi `DrizzleMarketingExtRepository.getOwnerDashboard()` ga).

---

### QADAM 7 — `marketing-ext.service.ts` — NPS event listener + churn cron + owner dashboard

**Fayl:** `apps/api/src/modules/marketing/application/marketing-ext.service.ts`

Faylni avval o'qi (`Read` tool). Keyin:

**7a. NPS `@OnEvent('order.delivered')` listener qo'sh (M7 — EP-MKT-015):**

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Constructor ga inject et
constructor(
  private readonly repo: DrizzleMarketingExtRepository,
  private readonly events: EventEmitter2,
) {}

// Yangi metod:
@OnEvent('order.delivered')
async onOrderDelivered(payload: { orderId: string; customerId: number; customerName: string }): Promise<void> {
  try {
    // NPS so'rovnomasini yaratish (Telegram bot orqali — bot hali ulanmagan, DB ga yoz)
    const r = await this.repo.createNpsRequest({
      papkaOrderId: payload.orderId,
      customerId:   payload.customerId,
    });
    if (!r.ok) {
      this.logger.warn(`EP-MKT-015: NPS so'rovnomasi yaratishda xato: ${r.error}`);
      return;
    }
    this.logger.log(`EP-MKT-015: NPS so'rovnomasi yuborildi: customerId=${payload.customerId}, orderId=${payload.orderId}`);
  } catch (e) {
    this.logger.error(`EP-MKT-015: NPS event handler xato: ${String(e)}`);
  }
}
```

**7b. Churn cron (M8 — EP-MKT-084):**

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async runChurnDetectionCron(): Promise<void> {
  this.logger.log('EP-MKT-084: Churn detection cron boshlandi');
  try {
    const churnRisk = await this.repo.getChurnRisk();
    if (!churnRisk.ok) {
      this.logger.warn(`EP-MKT-084: Churn so'rov xatosi: ${churnRisk.error}`);
      return;
    }
    const highRisk = churnRisk.data.filter(c => c.riskLevel === 'high');
    for (const customer of highRisk) {
      // Signal savdochiga yuborish (EventEmitter2 orqali — NTF modul tinglar)
      this.events.emit('marketing.churn.detected', {
        customerId:         customer.customerId,
        customerName:       customer.customerName,
        daysSinceLastOrder: customer.daysSinceLastOrder,
        openDebt:           customer.openDebt,
      });
      this.logger.log(`EP-MKT-084: Churn signal: customerId=${customer.customerId}, days=${customer.daysSinceLastOrder}`);
    }
    this.logger.log(`EP-MKT-084: Churn cron yakunlandi. ${highRisk.length} ta yuqori xavf mijoz.`);
  } catch (e) {
    this.logger.error(`EP-MKT-084: Churn cron xato: ${String(e)}`);
  }
}
```

**7c. Lead SLA cron skeleti — qo'sh (EP-MKT-048, § 4.1-B):**

> **DEFER-NOTE:** SLA cron to'liq ishlashi uchun `sla_first_response_at` va boshqa
> SLA ustunlari DDL GATED. Hozir skeleton + fallback (`created_at` asosida) yoziladi.
> DDL migration approved bo'lgach `sla_*` ustunlarga o'tkaziladi.
> Inbox SLA ish soati (Q655) `marketing_settings.business_hours_start/end` sozlamalaridan
> o'qiladi — **EGASI QIYMATI KERAK** (standart 09:00–18:00 o'rnatiladi, deploy kerak emas).

```typescript
@Cron('*/15 * * * *')  // Har 15 daqiqa
async runLeadSlaCron(): Promise<void> {
  this.logger.log('EP-MKT-048: Lead SLA cron boshlandi');
  try {
    // TODO(EP-MKT-048): SLA columns DDL GATED — switch to sla_first_response_at after migration.
    // Hozircha fallback: created_at dan hisoblash (astronomik; ish soati filtri keyinroq).
    // EGASI QIYMATI KERAK: ish soati chegarasi (09:00–18:00, marketing_settings jadvalidan).
    const now = new Date();
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fourHoursAgo  = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const twentyFourHAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 15 daq → signal (birinchi javob yo'q):
    const needFirstResponse = await typedExecute<{ id: string; assignedTo: number | null }>(sql`
      SELECT id, assigned_to AS "assignedTo" FROM marketing_leads
      WHERE created_at < ${fifteenMinAgo.toISOString()}
        AND created_at >= ${fourHoursAgo.toISOString()}
        AND status = 'new'
        AND deleted_at IS NULL
    `);
    for (const lead of needFirstResponse) {
      this.events.emit('marketing.sla.first_response', { leadId: lead.id, assignedTo: lead.assignedTo });
    }

    // 4 soat → menejer signal:
    const needManagerNotify = await typedExecute<{ id: string; assignedTo: number | null }>(sql`
      SELECT id, assigned_to AS "assignedTo" FROM marketing_leads
      WHERE created_at < ${fourHoursAgo.toISOString()}
        AND created_at >= ${twentyFourHAgo.toISOString()}
        AND status = 'new'
        AND deleted_at IS NULL
    `);
    for (const lead of needManagerNotify) {
      this.events.emit('marketing.sla.manager_notify', { leadId: lead.id, assignedTo: lead.assignedTo });
      this.logger.warn(`EP-MKT-048: 4-soat SLA: leadId=${lead.id}`);
    }

    // 24 soat → qayta tayinlash trigger:
    const needReassign = await typedExecute<{ id: string }>(sql`
      SELECT id FROM marketing_leads
      WHERE created_at < ${twentyFourHAgo.toISOString()}
        AND status = 'new'
        AND deleted_at IS NULL
    `);
    for (const lead of needReassign) {
      this.events.emit('marketing.sla.reassign', { leadId: lead.id });
      this.logger.warn(`EP-MKT-048: 24-soat SLA, qayta tayinlash kerak: leadId=${lead.id}`);
    }

    this.logger.log(`EP-MKT-048: SLA cron yakunlandi. firstResp=${needFirstResponse.length}, mgr=${needManagerNotify.length}, reassign=${needReassign.length}`);
  } catch (e) {
    this.logger.error(`EP-MKT-048: SLA cron xato: ${String(e)}`);
  }
}
```

**7d. Owner dashboard delegat metod qo'sh (§ 4.1-C — Director dashboard uchun):**

```typescript
// NOTE(Q674): getOwnerDashboard() data marketing moduldan — to'g'ri.
// Bu metodni FAQAT Director dashboard FE chaqiradi (Marketing FE emas).
async getOwnerDashboard() {
  return this.repo.getOwnerDashboard();
}
```

---

### QADAM 8 — `marketing.module.ts` — ScheduleModule qo'sh

**Fayl:** `apps/api/src/modules/marketing/marketing.module.ts`

```typescript
// OLDIN:
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';

// KEYIN — ScheduleModule va EventEmitterModule import qo'sh:
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';

// @Module imports ga:
imports: [CqrsModule, ScheduleModule.forFeature(), AuthModule],
```

> ⚠️ Agar `ScheduleModule.forRoot()` allaqachon `app.module.ts`'da mavjud bo'lsa, `ScheduleModule.forFeature()` qo'shib qo'y. Yoki faqat `AuthModule` da bo'lsa `ScheduleModule` `imports`'ga qo'sh. Ishga tushirishdan oldin avval tekshir: `grep -r "ScheduleModule.forRoot" apps/api/src/app.module.ts`.

---

### QADAM 9 — `marketing-analytics.controller.ts` — `getLead` fix

**Fayl:** `apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts`

Faylni o'qi (`Read` tool), keyin `getLead` metodni tuz:

Paket topilgandagi muammo (B hujjatdagi qayd): `unwrapOrInternal` `Result<T>` uchun, lekin `findOne` to'g'ridan `NotFoundException` otadi (Result emas). Bu noto'g'ri qatlam aralashuvi. Tuzatish:

```typescript
// OLDIN (taxminiy):
@Get(':id')
async getLead(@Param('id') id: string) {
  return unwrapOrInternal(await this.leadsSvc.findOne(Number(id)));
}

// KEYIN — string id, Result<T> to'g'ri ishlatish:
@Get(':id')
async getLead(@Param('id') id: string) {
  const result = await this.leadsSvc.findOne(id);  // string, Number() emas
  if (!result.ok) throw new NotFoundException(`Lead topilmadi: ${id}`);
  if (!result.data) throw new NotFoundException(`Lead topilmadi: ${id}`);
  return result.data;
}
```

---

### QADAM 10 — `MarketingLeadsTypes.ts` — 8-kanal qo'sh (FE)

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingLeadsTypes.ts`

`sourceLabels` konstantasini 8+1 kanal bilan yangilash (M1 — EP-MKT-031):

```typescript
// OLDIN (satr 79-86):
export const sourceLabels: Record<string, string> = {
  website:    "Veb-sayt",
  referral:   "Tavsiya",
  social:     "Ijtimoiy tarmoq",
  exhibition: "Ko'rgazma",
  cold_call:  "Sovuq qo'ng'iroq",
  other:      "Boshqa",
};

// KEYIN — 8 ta kanal + boshqa:
export const sourceLabels: Record<string, string> = {
  instagram:          "Instagram",
  telegram:           "Telegram",
  facebook:           "Facebook",
  "veb-sayt":         "Veb-sayt",
  korgazma:           "Ko'rgazma",
  sovuq_qongiroq:     "Sovuq qo'ng'iroq",
  tavsiya:            "Tavsiya",
  "vositachi-diler":  "Vositachi-diler",
  boshqa:             "Boshqa",
  // Orqaga mos kelish uchun eski nomlar:
  website:            "Veb-sayt",
  referral:           "Tavsiya",
  social:             "Ijtimoiy tarmoq",
  exhibition:         "Ko'rgazma",
  cold_call:          "Sovuq qo'ng'iroq",
  other:              "Boshqa",
};

// Channel uchun ham alohida:
export const channelOptions = [
  { value: 'instagram',         label: 'Instagram' },
  { value: 'telegram',          label: 'Telegram' },
  { value: 'facebook',          label: 'Facebook' },
  { value: 'veb-sayt',          label: 'Veb-sayt' },
  { value: 'korgazma',          label: "Ko'rgazma" },
  { value: 'sovuq_qongiroq',    label: "Sovuq qo'ng'iroq" },
  { value: 'tavsiya',           label: 'Tavsiya' },
  { value: 'vositachi-diler',   label: 'Vositachi-diler' },
  { value: 'boshqa',            label: 'Boshqa' },
] as const;

export const LEAD_SCORE_THRESHOLDS = {
  HOT:  70,   // issiq
  WARM: 40,   // iliq
  COLD: 0,    // sovuq
} as const;
```

---

### QADAM 11 — `MarketingLeadsDialogs.tsx` — 8-kanal dropdown

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingLeadsDialogs.tsx`

Faylni avval o'qi. Dialog ichidagi `channel` select elementini `channelOptions` bilan yangilash:

```tsx
// Mavjud channel select (taxminiy qidiruv: channel):
// OLDIN — agar 6 ta option bo'lsa:
<SelectItem value="website">Veb-sayt</SelectItem>
<SelectItem value="referral">Tavsiya</SelectItem>
// ...

// KEYIN — channelOptions dan map:
import { channelOptions } from './MarketingLeadsTypes';

// JSX ichida:
{channelOptions.map(opt => (
  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
))}
```

Shuningdek lead form validation Zod sxemasida `channel` uchun:
```typescript
// NOTE(EP-MKT-003): Kanal ro'yxati master-data (marketing_channel_config). Hozircha statik enum FE da —
// Keyinchalik /api/marketing/channels endpoint orqali dinamik yuklanadi.
// EGASI QIYMATI KERAK: agar egasi yangi kanal qo'shsa, bu enum ham yangilanishi kerak (yoki dinamik fetch).
channel: z.string().optional(),  // Zod enum o'rniga string — backend service validates against config
```

---

### QADAM 12 — `MarketingDashboard.tsx` — segments endpoint o'chir; Owner5Numbers QILINMAYDI

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingDashboard.tsx`

**12a. `/api/marketing/segments` so'rovini o'chir (B10 — endpoint yo'q):**

```tsx
// OLDIN (satr 25):
const { data: segments = [] } = useQuery<Segment[]>({ queryKey: ["/api/marketing/segments"] });

// KEYIN — o'chir yoki 501 state bilan almashtir:
// Bu qator TO'LIQ o'chiriladi — foydalanilmayotgan so'rov.
// `segments` o'zgaruvchisi ishlatilayotgan joyni ham tekshir va o'chir.
```

**12b. Owner 5-raqam — MARKETING DASHBOARD DA QILINMAYDI (§ 4.1-C):**

> ⚠️ INTERVYU-MOSLIK TUZATISH: Q674 aniq: "Director dashboard'ning alohida widget'i
> sifatida, **katta marketing panelidan ajratilgan**". `ownerDashboard` useQuery va
> `Owner5NumbersPanel` render `MarketingDashboard.tsx` ga QO'SHILMAYDI.
> P29/P30 (Director dashboard) paketi shu panelni Director sahifasiga qo'shadi.
> Bu qadam Marketing dahsboardida AMAL QILINMAYDI — skip.

```tsx
// ❌ BU QO'SHILMAYDI (Marketing dashboard uchun emas — Director dashboard uchun):
// const { data: ownerDashboard } = useQuery({ queryKey: ["/api/marketing/owner/dashboard"] });
// <Owner5NumbersPanel data={ownerDashboard} />
//
// ✅ O'RNIGA: P29/P30 (Director dashboard) paketida qo'shiladi.
// BE endpoint /api/marketing/owner/dashboard tayyor (6f va 7d) — faqat FE joyi boshqa.
```

---

### QADAM 13 — `MarketingDashboardTypes.ts` — Owner5Numbers tip qo'sh

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingDashboardTypes.ts`

```typescript
// Faylga qo'sh:
export interface Owner5Numbers {
  yangiMijozlar:            number;
  yoqolganMijozlar:         number;
  kichiklashayotganMijozlar: number;
  savdoTrendi:              number;   // MoM %
  engKattaXavf: {
    customerName:   string;
    atRiskRevenue:  number;
  } | null;
  diqqatTalab: string[];
}

// DashboardStats tipini kengaytir (satr 70-81):
export interface DashboardStats {
  activeCampaigns:  number;
  totalLeads:       number;
  recentLeads:      number;
  totalContent:     number;
  exhibitions:      number;
  totalBudget:      string;
  totalSpent:       string;
  channelStats:     { channel: string; count: number }[];
  convertedLeads:   number;
  conversionRate:   number;
  // Yangi maydonlar:
  newCustomers?:    number;
  lostCustomers?:   number;
}

// CHANNEL_ICONS ga Instagram, Telegram, Facebook qo'sh (satr 89-96):
import { Phone, Mail, MessageCircle, Globe, UserCheck, HelpCircle, Instagram, Facebook } from "lucide-react";
// ... yoki SVG icon komponentlaridan foydalanish agar lucide-react da yo'q bo'lsa.
```

---

### QADAM 14 — `MarketingDashboardSections.tsx` — Owner5NumbersPanel EKSPORT (Director uchun, Marketing renderida emas)

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingDashboardSections.tsx`

> ⚠️ INTERVYU-MOSLIK TUZATISH (§ 4.1-C): `Owner5NumbersPanel` bu faylda YOZILADI va
> **eksport qilinadi** — P29/P30 (Director dashboard) paketi uni import qiladi.
> Lekin `MarketingDashboard.tsx` da render QILINMAYDI (Q674: Marketing panelidan ajratilgan).
> Faylda `// NOTE(Q674): Bu panel Director dashboard uchun eksport — Marketing render emas.` izohi bo'lsin.

Faylni avval o'qi. Yangi `Owner5NumbersPanel` komponent qo'sh:

```tsx
interface Owner5NumbersPanelProps {
  data?: {
    yangiMijozlar: number;
    yoqolganMijozlar: number;
    kichiklashayotganMijozlar: number;
    savdoTrendi: number;
    engKattaXavf: { customerName: string; atRiskRevenue: number } | null;
    diqqatTalab: string[];
  };
  isLoading?: boolean;
}

export function Owner5NumbersPanel({ data, isLoading }: Owner5NumbersPanelProps) {
  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!data) return null;  // Role-gated: agar 403 bo'lsa null

  return (
    <div
      className="rounded-xl border p-5 bg-[var(--ep-surface)]"
      data-testid="owner-5-numbers-panel"
    >
      <h3 className="text-base font-semibold mb-4 text-[var(--ep-text-primary)]">
        Egachi Ko'rsatkichlari (EP-MKT-116)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg p-3 bg-[var(--ep-green-bg)]">
          <div className="text-2xl font-bold text-[var(--ep-green)]">{data.yangiMijozlar}</div>
          <div className="text-xs text-[var(--ep-text-secondary)] mt-1">Yangi mijozlar</div>
        </div>
        <div className="rounded-lg p-3 bg-[var(--ep-red-bg)]">
          <div className="text-2xl font-bold text-[var(--ep-red)]">{data.yoqolganMijozlar}</div>
          <div className="text-xs text-[var(--ep-text-secondary)] mt-1">Yo'qolgan mijozlar</div>
        </div>
        <div className="rounded-lg p-3 bg-[var(--ep-yellow-bg)]">
          <div className="text-2xl font-bold text-[var(--ep-yellow)]">{data.kichiklashayotganMijozlar}</div>
          <div className="text-xs text-[var(--ep-text-secondary)] mt-1">Kichiklashayotgan</div>
        </div>
        <div className={`rounded-lg p-3 ${data.savdoTrendi >= 0 ? 'bg-[var(--ep-green-bg)]' : 'bg-[var(--ep-red-bg)]'}`}>
          <div className={`text-2xl font-bold ${data.savdoTrendi >= 0 ? 'text-[var(--ep-green)]' : 'text-[var(--ep-red)]'}`}>
            {data.savdoTrendi >= 0 ? '+' : ''}{data.savdoTrendi}%
          </div>
          <div className="text-xs text-[var(--ep-text-secondary)] mt-1">Savdo trendi (MoM)</div>
        </div>
        <div className="rounded-lg p-3 bg-[var(--ep-red-bg)]">
          <div className="text-sm font-bold text-[var(--ep-red)] truncate">
            {data.engKattaXavf?.customerName ?? '—'}
          </div>
          <div className="text-xs text-[var(--ep-text-secondary)] mt-1">
            Eng katta xavf
            {data.engKattaXavf && (
              <span className="block font-medium">
                ~{(data.engKattaXavf.atRiskRevenue / 1_000_000).toFixed(1)}M so'm
              </span>
            )}
          </div>
        </div>
      </div>
      {Array.isArray(data.diqqatTalab) && data.diqqatTalab.length > 0 && (
        <div className="mt-4 space-y-1">
          <div className="text-xs font-medium text-[var(--ep-text-secondary)]">Diqqat talab:</div>
          {data.diqqatTalab.map((item, i) => (
            <div key={i} className="text-xs text-[var(--ep-yellow)] flex items-center gap-1">
              <span>⚠</span> {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Export ro'yxatini ko'r va Owner5NumbersPanel ni qo'sh.
// NOTE(Q674): Bu panel Director dashboard uchun eksport — Marketing render emas.
```

> ⚠️ `MarketingDashboard.tsx` da `<Owner5NumbersPanel>` QO'SHILMAYDI (§ 4.1-C).
> P29/P30 (Director dashboard) paketi shu exportni import qilib Director sahifasiga qo'shadi:
> ```tsx
> // Director dashboard (P29/P30 paketi):
> import { Owner5NumbersPanel } from '../marketing/MarketingDashboardSections';
> // ... Director sahifasida:
> <Owner5NumbersPanel data={ownerDashboard} isLoading={isLoading} />
> ```

---

### QADAM 15 — `MarketingContent.tsx` — 5-bosqich approval badge qo'sh

**Fayl:** `artifacts/erp-dashboard/src/pages/MarketingContent.tsx`

`statusLabels` konstantasiga 5-bosqich holatlari qo'sh:

```typescript
// OLDIN (satr 25):
const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  scheduled: "Rejalashtirilgan",
  published: "Nashr qilingan",
  failed: "Xatolik"
};

// KEYIN — 5-bosqich:
const statusLabels: Record<string, string> = {
  draft:          "G'oya / Qoralama",
  matn_tayyor:    "Matn Tayyor",
  dizayn_tayyor:  "Dizayn Tayyor",
  tasdiqlangan:   "Tasdiqlangan",
  joylandi:       "Joylandi",
  archived:       "Arxiv",
  scheduled:      "Rejalashtirilgan",   // orqaga mos kelish
  published:      "Nashr qilingan",     // orqaga mos kelish
  failed:         "Xatolik",            // orqaga mos kelish
};
```

Content sahifasida status o'tkazish uchun `Patch` mutation qo'sh (5-bosqich harakati):
```tsx
const advanceStageMutation = useMutation({
  mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
    apiRequest('PATCH', `/api/marketing/content/${id}`, { status: nextStatus }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/marketing/content'] });
    toast({ title: 'Bosqich o\'zgartirildi' });
  },
  onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
});

// Bosqich harakatlar tugmasi:
const nextStage: Record<string, string> = {
  'draft':         'matn_tayyor',
  'matn_tayyor':   'dizayn_tayyor',
  'dizayn_tayyor': 'tasdiqlangan',
  'tasdiqlangan':  'joylandi',
};
```

---

## 5. DDL (GATED — Egasi ruxsatisiz ISHGA TUSHIRMA)

**Migration fayl yoziladigan joy:**
`apps/api/src/shared/db/migrations/p41-mkt-schema-fixes-2026-06-19.sql`

```sql
-- APPROVED: <EGASI_IMZOSI> <SANA>
-- P41-MKT: Marketing schema fixes — 8-channel CHECK + campaign status + SLA columns + NPS varchar
-- Wave 1 | 2026-06-19
-- DDL GATED: DO NOT RUN without owner approval signature above.

BEGIN;

-- 1. marketing_leads.channel — 8-kanal CHECK qo'sh
ALTER TABLE marketing_leads
  DROP CONSTRAINT IF EXISTS marketing_leads_channel_chk;
ALTER TABLE marketing_leads
  ADD CONSTRAINT marketing_leads_channel_chk
    CHECK (channel IS NULL OR channel IN (
      'instagram','telegram','facebook','veb-sayt','korgazma',
      'sovuq_qongiroq','tavsiya','vositachi-diler','boshqa'
    ));

-- 2. marketing_leads — SLA tracking ustunlari qo'sh (EP-MKT-048)
ALTER TABLE marketing_leads
  ADD COLUMN IF NOT EXISTS sla_first_response_at  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sla_manager_notified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sla_reassigned_at       TIMESTAMP;

-- 3. marketing_campaigns.status CHECK ni kengaytir (EP-MKT-038: 6 holat)
ALTER TABLE marketing_campaigns
  DROP CONSTRAINT IF EXISTS marketing_campaigns_status_chk;
ALTER TABLE marketing_campaigns
  ADD CONSTRAINT marketing_campaigns_status_chk
    CHECK (status IN ('draft','confirmed','active','paused','completed','cancelled'));

-- Mavjud 'canceled' ma'lumotlarni to'g'irla (agar bo'lsa):
UPDATE marketing_campaigns SET status = 'cancelled'
  WHERE status NOT IN ('draft','confirmed','active','paused','completed','cancelled');

-- 4. content_posts.status CHECK — 5-bosqich approval workflow (EP-MKT-070)
ALTER TABLE content_posts
  DROP CONSTRAINT IF EXISTS content_posts_status_chk;
ALTER TABLE content_posts
  ADD CONSTRAINT content_posts_status_chk
    CHECK (status IN ('draft','matn_tayyor','dizayn_tayyor','tasdiqlangan','joylandi','archived'));

-- Mavjud 'scheduled'/'published' ma'lumotlarni ko'chirish (mapping):
UPDATE content_posts SET status = 'joylandi'    WHERE status = 'published';
UPDATE content_posts SET status = 'tasdiqlangan' WHERE status = 'scheduled';

-- 5. nps_responses.papka_order_id — agar int bo'lsa varchar(36) ga o'zgartir
-- (Faqat hozirgi tip int bo'lsa bajar; schema.ts:575 varchar(36) ekanini tekshir)
-- Schema allaqachon varchar(36) ekanligini tekshir:
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='nps_responses'
      AND column_name='papka_order_id'
      AND data_type='integer'
  ) THEN
    ALTER TABLE nps_responses ALTER COLUMN papka_order_id TYPE varchar(36)
      USING papka_order_id::text;
  END IF;
END $$;

-- 6. marketing_channel_config — master-data kanal ro'yxati (EP-MKT-003)
-- INTERVYU-MOSLIK FIX: DB CHECK o'rniga master-data jadval; marketing boshlig'i ekrandan boshqaradi.
CREATE TABLE IF NOT EXISTS marketing_channel_config (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(50) NOT NULL UNIQUE,
  label       VARCHAR(100) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
-- ⚠️ EGASI QIYMATI KERAK: dastlabki kanal labellarini egasi tasdiqlaydi.
-- Quyidagi seed — TAXMINIY (8 kanal EP-MKT-031 dan):
INSERT INTO marketing_channel_config (slug, label, sort_order) VALUES
  ('instagram',        'Instagram',          1),
  ('telegram',         'Telegram',           2),
  ('facebook',         'Facebook',           3),
  ('veb-sayt',         'Veb-sayt',           4),
  ('korgazma',         'Ko''rgazma',         5),
  ('sovuq_qongiroq',   'Sovuq qo''ng''iroq', 6),
  ('tavsiya',          'Tavsiya',            7),
  ('vositachi-diler',  'Vositachi-diler',    8),
  ('boshqa',           'Boshqa',             9)
ON CONFLICT (slug) DO NOTHING;

-- 7. marketing_scoring_config — 5-mezon scoring vaznlari (EP-MKT-043/044)
-- INTERVYU-MOSLIK FIX: Hardcode vaznlar o'rniga egasi belgilaydigan config jadval.
CREATE TABLE IF NOT EXISTS marketing_scoring_config (
  id          SERIAL PRIMARY KEY,
  criterion   VARCHAR(50) NOT NULL UNIQUE,   -- 'buyurtma_hajmi', 'shoshilinchlik', ...
  weight      INTEGER NOT NULL DEFAULT 0,    -- foiz (0-100), jami 100 bo'lishi kerak
  description VARCHAR(200),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMP DEFAULT NOW()
);
-- ⚠️ EGASI QIYMATI KERAK: har mezon uchun foiz vaznini egasi belgilaydi.
-- EP-MKT-044 tavsiya: buyurtma_hajmi 40% (egasi tasdiqlaydi).
-- Quyidagi seed — weight=0 (BLANK), egasi to'ldiradi:
INSERT INTO marketing_scoring_config (criterion, weight, description) VALUES
  ('buyurtma_hajmi',    0,  'Buyurtma hajmi / taxminiy qiymat — EGASI QIYMATI KERAK'),
  ('shoshilinchlik',    0,  'Shoshilinchlik darajasi — EGASI QIYMATI KERAK'),
  ('byudjet_aniqligi',  0,  'Byudjet aniq/tasdiqlangan — EGASI QIYMATI KERAK'),
  ('mahsulot_mosligi',  0,  'Mahsulot qiziqishi aniq — EGASI QIYMATI KERAK'),
  ('qayta_mijoz',       0,  'Qayta/takroriy mijoz — EGASI QIYMATI KERAK')
ON CONFLICT (criterion) DO NOTHING;

-- 8. marketing_settings — ish soati SLA konfiguratsiyasi (Q655)
-- ⚠️ EGASI QIYMATI KERAK: standart 09:00–18:00 (egasi o'zgartirishi mumkin).
INSERT INTO marketing_settings (key, value, description) VALUES
  ('business_hours_start', '09:00', 'SLA ish soati boshlanishi — EGASI QIYMATI KERAK'),
  ('business_hours_end',   '18:00', 'SLA ish soati tugashi — EGASI QIYMATI KERAK')
ON CONFLICT (key) DO NOTHING;

COMMIT;
```

> **DDL Darvozasi:** Bu faylni YOZASAN, lekin `psql` orqali ISHGA TUSHIRMAYSAN.
> Egasi `-- APPROVED:` imzolangandan keyin: `psql $DATABASE_URL -f p41-mkt-schema-fixes-2026-06-19.sql`
> ⚠️ `marketing_settings` jadval mavjudligini avval tekshir (`CREATE TABLE IF NOT EXISTS` kerak bo'lishi mumkin).

---

## 6. QABUL MEZONI

Har element DB-proof bilan tasdiqlangan:

- [ ] **Kanal master-data**: `SELECT * FROM marketing_channel_config WHERE is_active=true ORDER BY sort_order;` → 9 ta qator (DDL approved bo'lsa). Agar DDL pending — `marketing_channel_config` jadval yo'q, service validation skip qiladi (graceful fallback).
- [ ] **8-kanal service validation**: Lead yaratishda noto'g'ri kanal (`'youtube'`) → `Err('EP-MKT-003: Noto'g'ri kanal...')` qaytaradi (DB CHECK emas, service orqali).
- [ ] **Kampaniya holati**: `UPDATE marketing_campaigns SET status='confirmed' WHERE id=<test_id>` → muvaffaqiyatli (avval xato berardi).
- [ ] **`getLeadsBySource()` DB-proof**: `GET /api/marketing/leads/sources/summary` natijasida `source` maydoni `status` emas, balki real kanal nomini ko'rsatadi.
- [ ] **`convertLeadToCrm` DB-proof**: `POST /api/marketing/leads/<valid-uuid>/convert-to-crm` → 201 qaytaradi va `marketing_leads.crm_lead_id` yangilanadi (SQL tekshir).
- [ ] **NPS `papka_order_id`**: `POST /api/marketing/nps` body `{ papka_order_id: "some-uuid-string", score: 8 }` → 201 yaratadi, DB da `varchar` saqlanadi.
- [ ] **Inbox UUID**: `GET /api/marketing/inbox/conversations/<real-uuid>/messages` → 200 qaytaradi (avval NaN muammo bo'lardi).
- [ ] **Owner dashboard BE**: `GET /api/marketing/owner/dashboard` → 200 (super_admin token bilan); 403 (manager token bilan). **FE da faqat Director dashboard sahifasida ko'rinadi, Marketing sahifasida emas (Q674).**
- [ ] **ROI endpoint**: `GET /api/marketing/campaigns/stats/<campaign_id>` → `roi` maydoni `0` emas, formula bo'yicha hisoblangan (agar sales_orders.campaign_id biriktirilgan bo'lsa).
- [ ] **NPS event**: `order.delivered` event yuborganda → `nps_responses` jadvalida yangi qator paydo bo'ladi (EP-MKT-015).
- [ ] **Churn cron**: `marketing-ext.service.ts` da `@Cron` decorator bor; NestJS start logida `Scheduled Cron task...runChurnDetectionCron` ko'rinadi.
- [ ] **SLA cron**: `marketing-ext.service.ts` da `runLeadSlaCron` `@Cron('*/15 * * * *')` dekoratori bor; logda `EP-MKT-048: Lead SLA cron boshlandi` ko'rinadi.
- [ ] **FE 8-kanal**: `MarketingLeads` sahifasida lead yaratish dialog'ida channel dropdown 9 ta element ko'rsatadi (8+boshqa). Kanal qiymatlari `channelOptions` dan — backend `marketing_channel_config` bilan kelgusida sinxronlashadi.
- [ ] **FE owner panel**: `MarketingDashboard.tsx` da `[data-testid="owner-5-numbers-panel"]` element **YO'Q** (Marketing dashboardda render qilinmaydi — Director dashboard sahifasida bo'ladi). `Owner5NumbersPanel` komponenti `MarketingDashboardSections.tsx` da **eksport** sifatida mavjud.
- [ ] **Scoring config**: `SELECT * FROM marketing_scoring_config;` → 5 ta qator, weight=0 (egasi to'ldiradi).
- [ ] **FE tsc 0**: `pnpm --filter erp-dashboard run tsc --noEmit` → 0 xato.
- [ ] **BE tsc 0**: `pnpm --filter @europrint/api run tsc --noEmit` → 0 xato.
- [ ] **Reviewer**: `bash scripts/reviewer-result-pattern.sh` → FAIL 0 (yangi xato yo'q).
- [ ] **Reviewer**: `bash scripts/reviewer-array-safety.sh` → FAIL 0.
- [ ] **Golden thread no-regress**: `GET /api/auth/health` → `{ status: "ok" }`.

---

## 7. SELF-VERIFY

```bash
# 1. BE typecheck
pnpm --filter @europrint/api run tsc --noEmit

# 2. FE typecheck
pnpm --filter erp-dashboard run tsc --noEmit

# 3. Reviewer
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh

# 4. Server health
curl http://localhost:3030/api/auth/health

# 5. DB-proof: 8-kanal check
psql $DATABASE_URL -c "SELECT * FROM information_schema.check_constraints WHERE constraint_name='marketing_leads_channel_chk';"

# 6. DB-proof: getLeadsBySource to'g'ri ustun
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/marketing/leads/sources/summary
# Javobda "source" = "instagram"|"telegram"|..., "status" emas

# 7. DB-proof: NPS varchar
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"papka_order_id":"test-uuid-1234-5678-9012","customer_id":1,"score":8}' \
  http://localhost:3030/api/marketing/nps
# → 201 Created, xato yo'q

# 8. DB-proof: convertLeadToCrm UUID
# Oldin: bitta real lead id olish:
LEAD_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM marketing_leads LIMIT 1;" | tr -d ' ')
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/marketing/leads/$LEAD_ID/convert-to-crm
# → 201 yoki "Allaqachon CRM ga aylantirilgan" (agar avval qilingan bo'lsa)

# 9. DB-proof: owner dashboard BE (faqat Director dashboard FE chaqiradi — Q674)
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3030/api/marketing/owner/dashboard
# → { yangiMijozlar: N, yoqolganMijozlar: N, ... } (super_admin/director)
# Marketing sahifasi bu endpointni CHAQIRMAYDI — Director dashboard paketi (P29/P30) chaqiradi

# 10. DB-proof: kampaniya holati 'confirmed'
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.check_constraints WHERE constraint_name='marketing_campaigns_status_chk' AND check_clause LIKE '%confirmed%';"
# → 1 (DDL keyin)

# 11. FE 8-kanal: Brauzer UI da tekshir:
# Marketing > Lidlar > Yangi lid yaratish > Kanal dropdown = 9 ta element

# 12. FE owner panel render: (Marketing dashboardda EMAS)
# Marketing > Dashboard > "Egachi Ko'rsatkichlari" panel ko'RINMAYDI (Q674 — Director dashboardda)
# Director > Dashboard > "Egachi Ko'rsatkichlari" panel ko'rinadi (P29/P30 bilan)

# 13. Churn cron registratsiyasi:
grep -r "runChurnDetectionCron\|EP-MKT-084" apps/api/src/modules/marketing/
# → Cron dekorator va log topiladi

# 14. SLA cron registratsiyasi:
grep -r "runLeadSlaCron\|EP-MKT-048" apps/api/src/modules/marketing/
# → Cron dekorator va log topiladi

# 15. Kanal master-data (DDL approved bo'lsa):
psql $DATABASE_URL -c "SELECT slug, label FROM marketing_channel_config ORDER BY sort_order;"
# → 9 ta qator (instagram/telegram/facebook/...)

# 16. Scoring config (DDL approved bo'lsa, weight=0 — EGASI TO'LDIRADI):
psql $DATABASE_URL -c "SELECT criterion, weight FROM marketing_scoring_config;"
# → 5 ta qator, weight=0
```

---

## 8. COMMIT

```bash
# BE fayllar guruh 1: Schema + enum + events
git add \
  lib/db/src/schema/marketing-schema.ts \
  apps/api/src/modules/marketing/domain/enums/campaign-status.enum.ts \
  apps/api/src/modules/marketing/domain/events/index.ts

git commit -m "fix(mkt): channel→master-data config, campaign 6-status, content 5-stage, SLA cols — P41 [EP-MKT-003/031/038/070/048]"

# BE fayllar guruh 2: Repository + service tip xatolari
git add \
  apps/api/src/modules/marketing/leads/leads.repository.ts \
  apps/api/src/modules/marketing/leads/leads.service.ts \
  apps/api/src/modules/marketing/infrastructure/repositories/drizzle-marketing-ext.repo.ts

git commit -m "fix(mkt): lead id varchar/int mismatch, getLeadsBySource→source, ROI, owner-5(director-only), sla-cron, scoring-config — P41 [EP-MKT-044/048/051/116]"

# BE fayllar guruh 3: Controller UUID + NPS event + churn cron
git add \
  apps/api/src/modules/marketing/presentation/marketing-analytics-stubs.controller.ts \
  apps/api/src/modules/marketing/application/marketing-ext.service.ts \
  apps/api/src/modules/marketing/marketing.module.ts \
  apps/api/src/modules/marketing/presentation/marketing-analytics.controller.ts \
  apps/api/src/modules/marketing/presentation/dto/campaign.dto.ts \
  apps/api/src/modules/marketing/campaigns/campaigns.service.ts \
  apps/api/src/modules/marketing/campaigns/campaigns.repository.ts

git commit -m "fix(mkt): UUID/int stubs fix, NPS @OnEvent, churn cron, LeadQualifiedEvent — P41 [EP-MKT-015/048/084]"

# DDL migration (GATED — ishga tushirma)
git add apps/api/src/shared/db/migrations/p41-mkt-schema-fixes-2026-06-19.sql
git commit -m "feat(mkt): DDL GATED migration — P41 channel/status/sla/nps fixes [owner approval required]"

# FE fayllar
git add \
  artifacts/erp-dashboard/src/pages/MarketingLeadsTypes.ts \
  artifacts/erp-dashboard/src/pages/MarketingLeadsDialogs.tsx \
  artifacts/erp-dashboard/src/pages/MarketingDashboard.tsx \
  artifacts/erp-dashboard/src/pages/MarketingDashboardTypes.ts \
  artifacts/erp-dashboard/src/pages/MarketingDashboardSections.tsx \
  artifacts/erp-dashboard/src/pages/MarketingContent.tsx

git commit -m "feat(mkt-fe): 8-channel dropdown, Owner5NumbersPanel(director-export only), content 5-stage, segments remove — P41 [EP-MKT-003/031/070/116+Q674]"
```

> **ESLATMA:** `git add -A` yoki `git add .` TAQIQ. Faqat yuqoridagi aniq fayllar. DDL migration faylini commit qil lekin DB ga apply qilma — egasi ruxsatini kutmoqda.

---

## YAKUNIY HOLAT HISOBOTI (Har qadam keyin Uzbek tilida yubor)

Har qadam yakunlanganda quyidagi format bo'yicha egaga hisobot yubor:

```
QADAM N YAKUNLANDI:
✅ Nima qilindi: ...
✅ DB-proof: ...
✅ tsc 0: PASS / FAIL
⚠️ Muammo (agar bo'lsa): ...
Keyingi qadam: ...
```

---

*Direktiva yozildi: 2026-06-19 | Q-47: ≥1000 qator | WAVE 1 | P01 ga bog'liq*
