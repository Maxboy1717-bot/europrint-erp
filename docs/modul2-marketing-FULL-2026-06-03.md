# MODUL 2 — MARKETING — TO'LIQ CHUQUR TAHLIL (rasmiy, intervyu uchun)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | QAT'IY READ-ONLY — hech narsa o'zgartirilmadi
> Usul: har sahifa→FE fayl→endpoint→BE handler→DB jadval. Jonli DB (_audit/q.cjs) + BE kod.
> ⭐ VERIFY-DON'T-TRUST: halol 501 stub (`return stub(...)`) ≠ echo yolg'on — ajratildi.
> ⚠️ Vizyon arxiv `EUROPRINT_BARCHA_JAVOBLAR.md` repoda YO'Q — `gap1-vizyon-moslik` + watch-itemlar bo'yicha.

---

# QADAM 1 — KASHF

## Jami: 12 alohida sahifa (16 route)
| # | Sahifa | Route |
|---|---|---|
| 1 | Marketing Dashboard | /marketing/dashboard |
| 2 | Marketing Campaigns | /marketing/campaigns |
| 3 | Marketing Content | /marketing/content |
| 4 | Marketing Leads | /marketing/leads |
| 5 | Marketing Calendar | /marketing/calendar |
| 6 | Marketing Budget | /marketing/budget |
| 7 | Marketing Website CMS | /marketing/website-cms |
| 8 | Marketing Exhibitions | /marketing/exhibitions |
| 9 | Marketing PR | /marketing/pr |
| 10 | Marketing Social Inbox | /marketing/social-inbox |
| 11 | **Marketing Settings** | /marketing/settings ⭐ lead-gen config |
| 12 | **Marketing Extended** | /marketing/analytics + /seo + /ab-testing + /competitors + /nps-churn (**5 route→1**) |

## BE controllerlar (real vs stub — ANIQ ajratilgan)
- **REAL:** `marketing-group2.controller` (blog/budget/calendar/competitors-GET/leads-contacts), `marketing-content.controller` (content/posts CRUD+publish, social/accounts), `marketing-analytics.controller` (leads CRUD+status+funnel), `marketing.controller` (campaigns, social/posts)
- **STUB (501, `return stub(...)`):** `marketing-analytics-stubs.controller.ts` — exhibitions(hammasi), pr(hammasi), settings + settings/social-api + setup-telegram-webhook, inbox(hammasi), content/ai-generate, blog/ai-generate, churn-risk/ai-signal, ai-assistant, ab-tests, leads/:id/convert-to-crm

## DB jadvallari
- ✅ MAVJUD (lekin 0 qator — qurilish bosqichi): marketing_campaigns, marketing_content_posts, marketing_budget_lines, marketing_calendar_events, marketing_leads, blog_posts, marketing_social_accounts, marketing_settings
- ❌ **YO'Q:** marketing_exhibitions, marketing_pr, marketing_inbox_conversations (→ shuning uchun 501)

---

# QADAM 2 — HAR SAHIFA (A–G)

## 🟢 1. Marketing Dashboard — `/marketing/dashboard`
**A.** FE: `pages/MarketingDashboard.tsx`. **FUNKSIYA:** Marketing rahbari uchun umumiy panel — kampaniyalar, NPS, segmentlar, issiq lidlar, blog statistikasi.
**B.** Faqat o'qish (read-only panel). ✅ `/dashboard/stats`, `/campaigns`, `/nps`, `/segments`, `/website/blog` REAL; 🔴 `/ai/hot-leads`, `/churn-risk/ai-signal` STUB 501.
**C.** Real DB o'qish (jadvallar bo'sh → 0). FE pul hisoblamaydi.
**D.** 🟡 ba'zi AI kartalar 501 (stub:87).
**E.** 🟢 (asosiy panel real). **F.** vizyon: ko'rsatilmagan (panel). **G.** "Issiq lidlar AI" kartasi bo'sh (501).

## 🟢 2. Marketing Campaigns — `/marketing/campaigns`
**FUNKSIYA:** Reklama kampaniyalarini yaratish/tahrirlash/o'chirish + statistika.
**B.** ✅ Yaratish/tahrir/o'chirish → `/marketing/campaigns` CQRS REAL (marketing-group2). Forma maydonlari: nom, kanal, byudjet, sana, holat.
**C.** marketing_campaigns(0). **D.** —. **E.** 🟢. **F.** ✅ kampaniya boshqaruvi REAL (~85%). **G.** —.

## 🟢 3. Marketing Content — `/marketing/content`
**FUNKSIYA:** Ijtimoiy tarmoq postlari + ijtimoiy akkauntlar boshqaruvi.
**B.** ✅ Post CRUD+publish → `/content/posts` (marketing-content:46-83) REAL. ✅ Social akkaunt CRUD → `/social/accounts` (:103-118) REAL. 🔴 "AI-generatsiya" → `/content/ai-generate` STUB 501 (stubs:51).
**⚠️ RASM:** `mediaUrls: string[]` — **fayl yuklash YO'Q, faqat URL matn maydoni**.
**C.** marketing_content_posts(0), marketing_social_accounts(✅). **D.** 🟡 ai-generate stub; rasm yuklash yo'q.
**E.** 🟢. **F.** vizyon: ko'rsatilmagan. **G.** Rasmni fayldan yuklay olmaydi (URL yopishtirishi kerak); AI bilan post yarata olmaydi.

## 🟢 4. Marketing Leads — `/marketing/leads`
**FUNKSIYA:** Marketing lidlari (web/ko'rgazma manbali), voronka, yo'qotish tahlili.
**B.** ✅ Lid CRUD+status → `/marketing/leads` (marketing-analytics:89-126) REAL. ✅ `/funnel`, `/leads/loss-analysis`, `/recalculate-scores` REAL. 🔴 "CRM-ga aylantirish" → `/leads/:id/convert-to-crm` STUB 501 (stubs:114).
**C.** marketing_leads(0). **D.** 🟡 convert-to-crm stub.
**E.** 🟢. **F.** 🟡 lid yaratish real, CRM-ga ulanish yo'q. **G.** Marketing lidini CRM voronkasiga avtomatik o'tkaza olmaydi.

## 🟢 5. Marketing Calendar — `/marketing/calendar` — ✅ tadbirlar kalendari CRUD REAL (marketing-group2:183-202). marketing_calendar_events(0). **F.** ✅ kontent kalendar REAL.
## 🟢 6. Marketing Budget — `/marketing/budget` — ✅ byudjet CRUD REAL (marketing-group2:140-172). marketing_budget_lines(0). FE byudjet/jami ko'rsatadi (BE'dan). **F.** ✅ byudjet REAL.

## 🟢 7. Marketing Website CMS — `/marketing/website-cms`
**FUNKSIYA:** Veb-sayt blog/yangiliklarini boshqarish (UZ/RU, SEO).
**B.** ✅ Blog CRUD+publish → `/website/blog` (marketing-group2:85-129) REAL. Forma: titleUz/Ru, slug, bodyUz/Ru, excerpt, **coverImage (URL)**, seoTitle, seoDescription, tags. 🔴 "AI-generatsiya" → `/blog/ai-generate` STUB 501.
**⚠️ RASM:** `coverImage` = URL matn maydoni (`coverRasmUrl` label) — fayl yuklash YO'Q.
**E.** 🟢. **F.** vizyon: ko'rsatilmagan. **G.** Muqova rasmini fayldan yuklay olmaydi (URL).

## 🔴 8. Marketing Exhibitions — `/marketing/exhibitions`
**FUNKSIYA:** Ko'rgazma boshqaruvi (lid yig'ish, QR).
**B.** 🔴 BUTUN CRUD STUB 501 (stubs:146-164: getExhibitions/createExhibition/leads/qr).
**C.** ❌ **`marketing_exhibitions` jadval DB'da YO'Q**.
**D.** 🔴 stub (jadval yo'q). **E.** 🔴. **F.** vizyon: ko'rsatilmagan. **G.** Ko'rgazma yarata/boshqara olmaydi.

## 🔴 9. Marketing PR — `/marketing/pr`
**B.** 🔴 BUTUN CRUD STUB 501 (stubs:168-174). **C.** ❌ `marketing_pr` jadval YO'Q. **E.** 🔴. **G.** PR e'lon yarata olmaydi.

## 🔴 10. Marketing Social Inbox — `/marketing/social-inbox`
**FUNKSIYA:** Ijtimoiy tarmoq xabarlari yagona inbox (javob, AI-javob).
**B.** 🔴 BUTUN inbox STUB 501 (stubs:124-136: conversations/reply/ai-reply/status). **C.** ❌ `marketing_inbox_conversations` jadval YO'Q.
**E.** 🔴. **F.** Lead-gen bilan bog'liq (kanal xabarlari) — ❌. **G.** Ijtimoiy tarmoq xabarlarini ko'ra/javob bera olmaydi.

## 🔴 11. Marketing Settings — `/marketing/settings` ⭐⭐ ENG MUHIM (lead-gen config)
**A.** FE: `pages/MarketingSettings.tsx`. **FUNKSIYA:** Ijtimoiy tarmoq API kalitlari + Telegram webhook + umumiy sozlama. 3 tab: API / Webhooks / Umumiy.
**B.** FE TO'LIQ qurilgan: createMutation (`POST /marketing/settings`:42), updateMutation (`PATCH`:54), apiCreateMutation (`POST /settings/social-api`:63), apiUpdateMutation (`PATCH`:75), webhook setup (`/setup-telegram-webhook`). Maydonlar: API kalit, webhookSecret, ...
**🔴 LEKIN BARCHA BE HANDLER STUB 501** (stubs:178-196: getSettings/saveSettings/socialApi/setupTelegramWebhook).
**C.** ⚠️ `marketing_settings` + `marketing_social_accounts` jadvallar MAVJUD, lekin handler ularga yozmaydi (501).
**D.** 🔴 **FE forma to'liq, BE 501** — foydalanuvchi API kalit kiritadi, "Saqlash" bosadi → 501 xato → hech narsa saqlanmaydi.
**E.** 🔴. **F. ⭐ Lead-gen kanallar (Q5/Q20):** ❌ **0%** — bu sahifa kanal ulanishining poydevori, lekin butunlay 501. **G.** LinkedIn/Telegram API kalitini saqlay OLMAYDI → kanal hech qachon ulanmaydi.

## 🟡 12. Marketing Extended — `/marketing/analytics` + `/seo` + `/ab-testing` + `/competitors` + `/nps-churn` (**5 route→1**)
**FUNKSIYA:** Analitika, SEO, A/B test, raqobatchilar, NPS — hammasi bitta sahifada (5 menyu havola).
**B.** ✅ `/nps/monthly`, `/campaigns`, `/churn-risk`, `/competitors` (GET, group2:214) REAL; 🔴 `/ab-tests` STUB 501 (stubs:140).
**E.** 🟡. **G.** A/B testlarni ko'ra olmaydi (501); SEO real ma'lumotsiz.

---

# QADAM 3 — MODUL UMUMIY

## Sahifa jadvali
| Sahifa | Holat | Asosiy muammo | Vizyon % |
|---|---|---|---|
| Dashboard | 🟢 | AI kartalar stub | panel |
| Campaigns | 🟢 | — | ~85 |
| Content | 🟢 | ai-generate stub, rasm URL-only | bonus |
| Leads | 🟢 | convert-to-crm stub | ~70 |
| Calendar | 🟢 | — | ✅ kontent kalendar |
| Budget | 🟢 | — | ✅ byudjet |
| Website CMS | 🟢 | ai-generate stub, rasm URL-only | bonus |
| Exhibitions | 🔴 | jadval yo'q + 501 | — |
| PR | 🔴 | jadval yo'q + 501 | — |
| Social Inbox | 🔴 | jadval yo'q + 501 | ❌ lead-gen |
| **Settings** | 🔴 | **FE to'liq, BE 501 (lead-gen config)** | ❌ Q5/Q20 |
| Extended (5→1) | 🟡 | ab-tests stub | — |

**Jami: 7 🟢 · 1 🟡 · 4 🔴 → taxminan ~58% real (sahifa darajasi).**
⚠️ LEKIN vizyon YADROSI (lead-gen kanallar) = **0%**.

## ⭐ VIZYON WATCH-ITEM VERDIKTLARI (egasi MAXSUS so'ragan)
| Watch | Vizyon | Holat | Dalil |
|---|---|---|---|
| **Lead-gen kanallar** (LinkedIn/HH.uz/UZjob/MyJob/Telegram auto-post) | Q5/Q20 | 🔴 **0%** | Kanal kodi YO'Q (grep: LinkedIn/HH.uz/UZjob = 0). `settings/social-api` + `setup-telegram-webhook` = **501** → API kalit ham saqlanmaydi. social_posts DB'da saqlanadi, lekin **haqiqiy kanalga ketmaydi** |
| **HR↔Marketing vakansiya-reklama** | Q172 | 🔴 **0%** | vakansiya→marketing-post workflow YO'Q (faqat hr-vacancies bozor-maosh tahlili bor, aloqasiz) |
| **Kampaniya boshqaruvi** | — | 🟢 REAL | marketing-group2 CQRS |
| **Kontent kalendar** | — | 🟢 REAL | /marketing/calendar |
| **Byudjet** | — | 🟢 REAL | /marketing/budget |

## ⭐ ZANJIR / INTEGRATSIYA MUAMMOLARI
1. 🔴 **Marketing ↔ tashqi kanallar (Q5/Q20)** — UZILGAN. social-api/telegram config 501 → LinkedIn/HH.uz/UZjob/Telegram ulanmagan. Post DB'da qoladi, kanalga ketmaydi
2. 🔴 **Marketing ↔ HR (Q172)** — YO'Q. Vakansiya marketing kanaliga avtomatik joylanmaydi
3. 🔴 **Marketing lid ↔ CRM** — UZILGAN. `/marketing/leads/:id/convert-to-crm` 501 → marketing lidi CRM voronkasiga o'tmaydi
4. 🔴 **Social Inbox** — kanal xabarlarini qabul qilish yo'q (jadval yo'q + 501)

## DB MUAMMOLARI
- ❌ **3 jadval YO'Q:** marketing_exhibitions, marketing_pr, marketing_inbox_conversations (Exhibitions/PR/Inbox sahifalari shuning uchun 501)
- ⚠️ marketing_settings + marketing_social_accounts jadval MAVJUD, lekin handler 501 (jadval bor, kod ulanmagan)
- Barcha marketing jadval 0 qator (qurilish bosqichi)

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Lead-gen kanallar 0% (Q5/Q20)** — eng muhim vizyon. Settings 501 → API kalit saqlanmaydi → LinkedIn/Telegram/HH.uz ulanmaydi. Post yoziladi, lekin yuborilmaydi
2. 🔴 **HR↔Marketing vakansiya-reklama (Q172)** — umuman yo'q
3. 🔴 **Marketing lid → CRM convert 501** — lid CRM'ga o'tmaydi
4. 🔴 **3 sahifa to'liq stub** (Exhibitions/PR/Social Inbox — jadval ham yo'q)
5. 🟡 **Rasm yuklash yo'q** — kontent/blog faqat URL matn (fayl yuklab bo'lmaydi)

---

## XULOSA (egasiga)
Marketing **yadrosi ishlaydi** (kampaniya, kontent, lid, kalendar, byudjet, blog — real DB CRUD). LEKIN egasining **lead-gen vizyoni (Q5/Q20) — 0%:**
- Ijtimoiy tarmoqqa avtomatik post YO'Q — `settings/social-api` 501, API kalit ham saqlanmaydi, kanal kodi (LinkedIn/HH.uz/UZjob/Telegram) yozilmagan
- HR vakansiya-reklama (Q172) YO'Q
- 3 sahifa (Exhibitions/PR/Inbox) jadvalsiz 501

> Hech narsa o'zgartirilmadi (read-only). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
