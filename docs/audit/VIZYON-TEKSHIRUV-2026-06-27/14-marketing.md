# 14 — Marketing — Mustaqil Tekshiruv (Adversarial Audit)

**Sana:** 2026-06-27
**Tekshiruvchi:** Independent verifier (kod + jonli DB)
**Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (5292–5691)

## Yakuniy raqamlar

- Savol soni (qTotal): **99**
- Doc da'vo: **vizyon 48%**
- egasi-data: **2** (14.61, 14.94)
- Real holat (verifikatsiya): **bor=9, qisman=45, yoq=43**, egasi-data=2
- **Recomputed realPct = round(100·(9 + 0.5·45)/(99−2)) = round(3150/97) = 32%**
- Claim aniqligi: **confirmed=97, refuted=2**

> ⚠️ Eslatma: doc sarlavhasi "48%" desa-da, uning O'Z bor/qisman/yoq taqsimoti (~10 bor / 44 qisman) ham faqat ~33% beradi. Header 48% raqami bayroqlar taqsimotidan yuqori (aspiratsion). Mening realPct=32%.

## Umumiy xulosa

Bu modul hujjati **juda aniq**. Tekshirilgan har bir struktura-da'vosi (jadval nomi, ustun, endpoint, satr raqami, formula) jonli kod/DB bilan tasdiqlandi. Satr raqamlari deyarli aniq (convert-to-crm:280, recalculate-scores:258, exhibitions:454/474, nps:154, getChurnRisk:653, days:683-685, getLossAnalysis:93, next_follow_up izoh:481 — barchasi mos). Negative da'volar (utm=0, bitrix=0, wallet=0, opros=0, brand_passport=0, round-robin=0, product_type yo'q) ham jonli grep bilan tasdiqlandi.

## REFUTED CLAIMS (overstated/noaniq)

- **14.60** — Doc ✅ **bor** deb belgilagan ("NPS avtomatik yig'iladi+saqlanadi"). Reality: POST /nps REAL INSERT (9 qator) bor, lekin **buyurtma-yopilganda AVTO-trigger YO'Q** (qo'lda POST — doc Isbot o'zi tan oladi). Bir xil NPS funksiyasi 14.52 da **qisman** belgilangan → 14.60 ichki ziddiyat. Real holat = **qisman**, bor emas.
- **14.25** — Doc "atribusiya-oyna **konfiguratsiyasi YO'Q**" degan. Reality: `MKT_ATTRIBUTION_WINDOW_DAYS=90` konstantasi MAVJUD (marketing-roi.constants.ts:121, EP-MKT-055) va `MKT_ROI_DEFAULT_CONFIG` ichida. Konfig mavjud, faqat so'rov-filtri sifatida QO'LLANILMAGAN. Status (yoq) to'g'ri, lekin "konfiguratsiya yo'q" sub-da'vosi noto'g'ri.

---

## Per-savol

## 14.1 — Q1 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: MKT_CHANNELS 8 kanal + MKT_CHANNEL_OTHER='boshqa'; marketing_leads.channel/source (14 qator).
- Tekshiruv: marketing-roi.constants.ts:25-39 aynan 8 kanal massiv + 'boshqa' ✓. marketing_leads.channel + source ustunlari mavjud ✓. count=14 ✓.

## 14.2 — Q2 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: campaign_id bor, UTM/sub-manba ustuni yo'q; ads.platform faqat kanal.
- Tekshiruv: marketing_leads.campaign_id mavjud ✓; marketing/ utm grep=0 ✓.

## 14.3 — Q3 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: budget_lines(12) + budget CRUD; category/year/month/planned/actual; kanal o'lchovi yo'q.
- Tekshiruv: marketing_budget_lines count=12 ✓; ustunlar year/month/category/planned_amount/actual_amount ✓; kanal ustuni yo'q ✓. (Eslatma: budget DELETE endpoint `marketing_budget_items`ga yozadi — jadval-bo'linish nuance, lekin xulosa to'g'ri.)

## 14.4 — Q4 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: category erkin matn, 6 qat'iy tur enum yo'q.
- Tekshiruv: marketing-ext.dto.ts:14,23 `category: z.string().max(MAX_NAME_LENGTH).optional()` — erkin, optional ✓. (Doc "min2 max50" deb yozgan — aniq emas, lekin "erkin matn, enum yo'q" xulosasi to'g'ri.)

## 14.5 — Q5 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: convert-to-crm marketing_leads→crm_leads INSERT (CRM, SD emas); SD avto+event yo'q.
- Tekshiruv: stubs:288 INSERT INTO crm_leads ✓ (sd_customers emas); event emit yo'q ✓.

## 14.6 — Q6 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: marketing_campaigns 16 ustun; owner=created_by; 'kutilgan lid' yo'q.
- Tekshiruv: 16 ustun (id..deleted_at) ✓; created_by bor; expected-lead ustuni yo'q ✓.

## 14.7 — Q7 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: type enum email/sms/social/telegram/promotion = format, maqsad emas.
- Tekshiruv: campaign.dto.ts:12 aynan shu enum ✓; maqsad-turi maydoni yo'q ✓.

## 14.8 — Q8 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: status enum 5 (draft/active/paused/completed/cancelled); 'approved' yo'q.
- Tekshiruv: campaign.dto.ts:28 aynan 5 status ✓; approved yo'q ✓.

## 14.9 — Q9 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: target_audience JSONB + DTO{region,ageGroup,interests}; sektor enum yo'q.
- Tekshiruv: marketing_campaigns.target_audience ustuni ✓; campaign.dto.ts:16-20 targetAudience{region,ageGroup,interests} ✓; sanoat enum yo'q ✓.

## 14.10 — Q10 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: targetAudience.region string; eksport bayrog'i/struktura yo'q.
- Tekshiruv: DTO region: z.string().optional() ✓; eksport bayrog'i yo'q ✓.

## 14.11 — Q11 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getCampaignStats real + exhibitions roi; campaigns'da expected maydon yo'q.
- Tekshiruv: drizzle-marketing-ext.repo.ts:71 getCampaignStats real ✓; exhibitions.roi/deal_value ustunlari ✓; expected ustun yo'q ✓.

## 14.12 — Q12 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_campaigns'da promo_code/discount yo'q.
- Tekshiruv: 16 ustun ichida promo_code/discount yo'q ✓.

## 14.13 — Q13 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: score+status bor, getHotLeads real, recalculate ball; 3-daraja enum emas.
- Tekshiruv: marketing_leads.score+status ✓; repo:466 getHotLeads real ✓; recalculate-scores stubs:258 ✓; status erkin matn ✓.

## 14.14 — Q14 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: recalculate-scores faqat 2 omil (channel+status), 5 mezon yo'q.
- Tekshiruv: stubs:262-275 score = 30 + channel(organic/referral) + status — aynan 2 omil ✓; 5 mezon yo'q ✓.

## 14.15 — Q15 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: phone/source/channel ustun bor, create optional, majburiy validatsiya yo'q, mahsulot-qiziqish yo'q.
- Tekshiruv: leads.service.ts:47 `phone: ... || undefined` optional ✓; product-interest ustuni yo'q ✓.

## 14.16 — Q16 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: telefon dublikat tekshiruvi yo'q.
- Tekshiruv: leads.service create/repository create da dup-check yo'q ✓.

## 14.17 — Q17 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: assigned_to bor, avto-taqsimlash logikasi yo'q.
- Tekshiruv: marketing_leads.assigned_to ✓; marketing/ round-robin/assignLead/autoAssign grep=0 ✓.

## 14.18 — Q18 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getOverdueLeads READ real; cron eskalatsiya yo'q.
- Tekshiruv: stubs:252 + repo:483 getOverdueLeads real ✓; cron/qayta-taqsim yo'q ✓.

## 14.19 — Q19 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getMarketingFunnel real + crm_lead_stages; status erkin matn.
- Tekshiruv: analytics.controller:202 getMarketingFunnel real ✓; crm_lead_stages count=6 ✓; status erkin ✓.

## 14.20 — Q20 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: lost_reason ustun + getLossAnalysis real (repo:93); enum yo'q.
- Tekshiruv: marketing_leads.lost_reason ✓; leads.repository.ts:93 getLossAnalysis breakdown/percent real ✓; enum yo'q ✓.

## 14.21 — Q21 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: ROI%=(revenue−spend)/spend×100 profit-based; profitAbsolute=revenue−spend.
- Tekshiruv: marketing-roi.service.ts:36-45 EP-MKT-051 profit-based ROI + profitAbsolute=revenue−spend ✓.

## 14.22 — Q22 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: CPL=spend/leads; getChannelRoi per-kanal rollup real.
- Tekshiruv: constants EP-MKT-052 CPL ✓; marketing-ext.service.ts:77 getChannelRoi + repo getChannelRollup real ✓.

## 14.23 — Q23 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: ChannelRoiRow.cac (ext.service:31)=spend/conversions.
- Tekshiruv: marketing-ext.service.ts:31 cac: number|null, EP-MKT-053 CAC=spend/conversions ✓.

## 14.24 — Q24 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: CAC bor lekin LTV/CAC 12-oylik yo'q (CRM RFM alohida).
- Tekshiruv: getChannelRoi CAC bor ✓; marketing modulida LTV/12-oy yo'q ✓.

## 14.25 — Q25 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Doc: ROI vaqt-oyna filtri yo'q; "atribusiya-oyna konfiguratsiyasi YO'Q".
- Tekshiruv: **MKT_ATTRIBUTION_WINDOW_DAYS=90 konstantasi MAVJUD** (constants:121, EP-MKT-055) + MKT_ROI_DEFAULT_CONFIG. So'rov-filtri qo'llanilmagan (status yoq to'g'ri), ammo "konfiguratsiya yo'q" da'vosi noto'g'ri — konstanta bor.

## 14.26 — Q26 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: source single-touch; multi-touch yo'q.
- Tekshiruv: marketing_leads.source bitta ustun ✓; first/last touch model yo'q ✓.

## 14.27 — Q27 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: exhibitions(23 ustun) + createExhibition/update/delete real (stubs:454).
- Tekshiruv: exhibitions 23 ustun ✓ (count=1); stubs:454/505/536 CRUD real ✓.

## 14.28 — Q28 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: POST exhibitions/:id/leads (stubs:474) real INSERT + QR.
- Tekshiruv: stubs:474 INSERT exhibition_leads real ✓; QR stubs:445/496 ✓.

## 14.29 — Q29 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: exhibitions lead_count/deal_count/value/roi struktura bor; exhibition_leads(0)→sotuv event yo'q.
- Tekshiruv: ustunlar bor ✓; exhibition_leads count=0 ✓; avto-bog'lash yo'q ✓.

## 14.30 — Q30 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: ko'rgazma follow-up cron/jadval yo'q.
- Tekshiruv: follow-up logika yo'q; repo:481 izoh "no next_follow_up_at column" ✓.

## 14.31 — Q31 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: GET exhibitions barcha ustun; yillik agregat endpoint yo'q.
- Tekshiruv: stubs:420 GET exhibitions real ✓; maxsus agregat endpoint yo'q ✓.

## 14.32 — Q32 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: social_conversations+messages jadval + inbox endpoints real + FE; jadval bo'sh, provayder ulanmagan.
- Tekshiruv: stubs:318-386 inbox real ✓; count 0/0 ✓; FE MarketingSocialInbox.tsx ✓; provayder yo'q ✓.

## 14.33 — Q33 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getInboxStats real; SLA daqiqa/signal yo'q.
- Tekshiruv: repo:623 getInboxStats real ✓; SLA logika yo'q ✓.

## 14.34 — Q34 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: tables + convert-to-crm bor; 'create lead from conversation' endpoint yo'q.
- Tekshiruv: jadvallar bor; convert-to-crm:280 bor; suhbat→lid maxsus endpoint yo'q ✓.

## 14.35 — Q35 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: marketing_email_templates + email/templates CRUD (analytics:138); inboxga bog'lanmagan.
- Tekshiruv: analytics.controller:138-161 email/templates CRUD real ✓; inbox bilan ulanmagan ✓.

## 14.36 — Q36 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: status PATCH bor; assigned_to/qulflash yo'q.
- Tekshiruv: stubs:379 PATCH status real ✓; mas'ul biriktirish yo'q ✓.

## 14.37 — Q37 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: spam-filtr/papka yo'q.
- Tekshiruv: status PATCH bor; spam logika yo'q ✓.

## 14.38 — Q38 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: marketing_calendar_events + calendar CRUD (group2:197) + FE.
- Tekshiruv: group2:197-259 calendar CRUD real ✓; FE MarketingCalendar.tsx ✓ (jadval 0 qator, lekin mexanizm real).

## 14.39 — Q39 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: marketing_content(16 ustun) + content/posts CRUD + FE; createContentPost real INSERT.
- Tekshiruv: 16 ustun ✓; content.controller:46-87 CRUD real ✓; FE MarketingContent.tsx ✓.

## 14.40 — Q40 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: status + publishContentPost (draft→published); 5-bosqich oqim yo'q.
- Tekshiruv: content.controller:83 publishContentPost real ✓; 5-stage approve yo'q ✓.

## 14.41 — Q41 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: type ustun bor; 5-6 rukn enum + haftalik muvozanat yo'q.
- Tekshiruv: marketing_content.type ✓; enum/muvozanat yo'q ✓.

## 14.42 — Q42 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getContentAnalytics real + marketing_social_posts; 'postdan kelgan lid' atribusiya yo'q.
- Tekshiruv: repo:197 getContentAnalytics real ✓; marketing_social_posts jadval ✓; post→lid yo'q ✓.

## 14.43 — Q43 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: post-vaqti eslatma cron yo'q.
- Tekshiruv: avto-eslatma logika yo'q ✓.

## 14.44 — Q44 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: convert-to-crm faqat INSERT; auto-trigger/accepted/event yo'q.
- Tekshiruv: stubs:280 to'g'ridan INSERT ✓; emit=0 ✓.

## 14.45 — Q45 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_leads'da namuna so'rov maydoni/lid→PP event yo'q.
- Tekshiruv: marketing_leads ustunlarida sample yo'q ✓.

## 14.46 — Q46 [DOC: bor] → [VERIFIED: bor] (confirmed)
- Doc: getDashboardStats+getMarketingOverview real + getAnalyticsOverview + FE.
- Tekshiruv: repo:101 getDashboardStats real ✓; analytics:169 getAnalyticsOverview ✓; FE Dashboard+Panels+Sections ✓.

## 14.47 — Q47 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: conversionRate/costPerLead/roi + funnel/channel-roi; xodim-kesim KPI yo'q.
- Tekshiruv: funnel/channel-roi real ✓; per-employee KPI agregatsiya yo'q ✓.

## 14.48 — Q48 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: sd_customer_competitors + GET competitors (group2:265 GROUP BY); 0 qator.
- Tekshiruv: group2:265 GET competitors real ✓; sd_customer_competitors count=0 ✓.

## 14.49 — Q49 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: UTM jadval/logika yo'q.
- Tekshiruv: marketing/ utm grep=0 ✓.

## 14.50 — Q50 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getChurnRisk real READ; avto win-back/segment yo'q.
- Tekshiruv: repo:653 getChurnRisk real ✓; win-back yaratish yo'q ✓.

## 14.51 — Q51 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: ecommerce portfolio/blog + storage; marketing material kutubxonasi jadval yo'q.
- Tekshiruv: marketing-maxsus versiyalangan material jadval yo'q ✓.

## 14.52 — Q52 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: nps_responses(9) + nps CRUD + getNpsStats real; avto-trigger yo'q.
- Tekshiruv: count=9 ✓; stubs:148-174 + repo:424 getNpsStats real ✓; avto event yo'q ✓.

## 14.53 — Q53 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: ERP struktura tayyor; Bitrix ko'prik kodi yo'q.
- Tekshiruv: lid/kampaniya/inbox slice qurilgan ✓; marketing/ bitrix grep=0 ✓.

## 14.54 — Q54 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getChurnRisk (repo:653) real LEKIN qat'iy 30/60/90 (680-683); per-customer ritm emas.
- Tekshiruv: repo:653 getChurnRisk ✓; 683-685 days>=90/60/30 qat'iy ✓; B-variant ✓.

## 14.55 — Q55 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: buyurtma-trend kamayish logika/jadval yo'q.
- Tekshiruv: marketing/ai shrink/foyda-kg grep=0 ✓.

## 14.56 — Q56 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: brand_passport jadval/maydon yo'q.
- Tekshiruv: brand_passport grep=0 ✓ (brand_templates jadval bor lekin 0 qator).

## 14.57 — Q57 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: website-media portfolio CRUD (portfolio_items); B2B mahsulot-turi savdo-vositasi emas.
- Tekshiruv: ecommerce portfolio bor; marketing/savdo product-type portfolio yo'q ✓.

## 14.58 — Q58 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: опросный лист jadval/lid→brief ko'chirish yo'q.
- Tekshiruv: opros/опросн grep=0 ✓.

## 14.59 — Q59 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_leads'da product_type yo'q.
- Tekshiruv: jonli schema — product_type ustuni yo'q ✓.

## 14.60 — EP-MKT-082 [DOC: bor] → [VERIFIED: qisman] (CLAIM: refuted)
- Doc: nps_responses=9; POST /nps real INSERT (:154); getNpsStats real → ✅ bor.
- Tekshiruv: POST/getNpsStats real ✓, 9 qator ✓ — LEKIN **buyurtma-yopilganda AVTO-trigger YO'Q** (doc o'zi "qo'lda POST" deydi). Savol "avtomatik" deydi; bir xil funksiya 14.52'da qisman belgilangan. Real holat = **qisman**, bor emas.

## 14.61 — EP-MKT-083 [DOC: egasi-data] → [VERIFIED: egasi-data] (confirmed)
- Doc: decisions OCHIQ; Bitrix integratsiya yo'q; o'tish rejasi egasidan.
- Tekshiruv: marketing/ bitrix grep=0 ✓; egasi qarori.

## 14.62 — EP-MKT-084 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getChurnRisk bor lekin qat'iy 30/60/90; per-customer ritm yo'q; churn_model_params ishlatilmaydi.
- Tekshiruv: repo:653/683-685 qat'iy chegara ✓; churn_model_params count=0 ✓.

## 14.63 — EP-MKT-085 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing-agent.service faqat ROI/content/segment; shrink yo'q.
- Tekshiruv: marketing-agent.service.ts bor; shrink/foyda-kg grep=0 ✓.

## 14.64 — EP-MKT-086 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: brand_templates BO'SH (0); brand_passport kod-hit=0.
- Tekshiruv: brand_templates count=0 ✓; brand_passport grep=0 ✓.

## 14.65 — EP-MKT-087 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: website_portfolio=0, portfolio_items=0; marketing/savdo portfolio yo'q.
- Tekshiruv: website_portfolio count=0 ✓; portfolio_items count=0 ✓.

## 14.66 — EP-MKT-088 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: опросн kod-hit=0; lid→brief zanjir yo'q.
- Tekshiruv: opros grep=0 ✓.

## 14.67 — EP-MKT-089 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_leads'da product_type yo'q (jonli schema).
- Tekshiruv: jonli schema id..converted_at, product_type yo'q ✓.

## 14.68 — EP-MKT-090 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: assigned_to bor; avto-biriktirish yo'q; convert-to-crm real; egasiz-qizil yo'q.
- Tekshiruv: assigned_to ustun ✓; round-robin grep=0 ✓; convert:280 real ✓.

## 14.69 — EP-MKT-091 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: decisions OCHIQ; lid kartasida to'lov-intizom signali yo'q.
- Tekshiruv: churn-risk openDebt o'qiydi lekin lid-kartasi AR-belgisi yo'q ✓.

## 14.70 — EP-MKT-092 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: seasonal faqat ai/forecast; marketing mavsumiy kalendar yo'q.
- Tekshiruv: marketing seasonal yo'q; calendar_events kontent uchun ✓.

## 14.71 — EP-MKT-093 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: подписной voronka bosqichi kod-hit=0; crm_lead_stages bor lekin bu bosqichlar yo'q.
- Tekshiruv: crm_lead_stages count=6, B2B namuna→подписной yo'q ✓.

## 14.72 — EP-MKT-094 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: ow_order_samples bor (0) lekin ustunlar id/order_id/iteration/.../customer_decision; XARAJAT/ROI ustuni yo'q.
- Tekshiruv: ow_order_samples 8 ustun — aynan doc ko'rsatgani, cost/material/ROI yo'q ✓.

## 14.73 — EP-MKT-095 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing yillik mijoz-forecast jadval/endpoint yo'q.
- Tekshiruv: marketing forecast CREATE yo'q ✓.

## 14.74 — EP-MKT-096 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: lid→dastgoh-format tekshiruv yo'q.
- Tekshiruv: texnik chegara solishtirish kodi yo'q ✓.

## 14.75 — EP-MKT-097 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: 'takror qil' tugmasi qurilmagan; reorder hits faqat crm-custom-fields.
- Tekshiruv: mijoz-karta papka-ro'yxat + takror tugma yo'q ✓.

## 14.76 — EP-MKT-098 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: wallet.share kod-hit=0; marketing-ai faqat content/adCopy/sentiment/seo.
- Tekshiruv: wallet share grep=0 ✓; marketing-ai.service.ts bor ✓.

## 14.77 — EP-MKT-099 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: NPS↔qc_reclamations bog'lash yo'q.
- Tekshiruv: nps_responses'da brak-tarix bog'lanish yo'q ✓.

## 14.78 — EP-MKT-100 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: getLossAnalysis (repo:93) lost_reason breakdown real; competitor ustun yo'q.
- Tekshiruv: leads.repository.ts:93 getLossAnalysis real ✓; marketing_leads'da competitor ustuni yo'q ✓.

## 14.79 — EP-MKT-101 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: savdo-skript/FAQ kutubxonasi yo'q (faqat email shablon).
- Tekshiruv: marketing'da skript/FAQ + LMS-karta darslik yo'q ✓.

## 14.80 — EP-MKT-102 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_leads'da region/export ustuni yo'q.
- Tekshiruv: jonli schema — region/export yo'q ✓.

## 14.81 — EP-MKT-103 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: marketing_lead_contacts + GET/POST/DELETE contacts (group2:275-293); 'asosiy o'zgardi' belgisi yo'q.
- Tekshiruv: group2:275-293 leads/:id/contacts GET/POST real ✓ (jadval 0 qator); 'primary changed' flag yo'q ✓. (Nuance: :293 DELETE `leads/:id` lid o'chiradi, kontaktni emas.)

## 14.82 — EP-MKT-104 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: dormant ro'yxat + win-back kampaniya marketingda yo'q (SD/CRM RFM da).
- Tekshiruv: sd_customers.win_back_potential bor; marketing avto-segment yo'q ✓.

## 14.83 — EP-MKT-105 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: sd_customers.abc_class+abc_computed_at bor; marketingda 'xizmat darajasi' yo'q.
- Tekshiruv: ABC SD'da; marketing service-level + qayta-hisob yo'q ✓.

## 14.84 — EP-MKT-106 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: product_type yo'q → tur-talab statistikasi yo'q; 6-departament hisobot yo'q.
- Tekshiruv: 14.67 bilan izchil ✓.

## 14.85 — EP-MKT-107 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: mijozga buyurtma-holat link/bot yo'q.
- Tekshiruv: status-kuzatuv bot kodi yo'q ✓.

## 14.86 — EP-MKT-108 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: sodiqlik avto-imtiyoz qoidasi yo'q.
- Tekshiruv: loyalty discount rule kodi yo'q ✓.

## 14.87 — EP-MKT-109 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing↔dizayn kanban-yuk ko'rinishi yo'q.
- Tekshiruv: bog'lanish kodi yo'q ✓.

## 14.88 — EP-MKT-110 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: ishlab chiqarish bo'sh-quvvat→marketing event yo'q.
- Tekshiruv: bandlik↔marketing event yo'q ✓.

## 14.89 — EP-MKT-111 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketingda foyda-daraja ko'rinishi + RBAC-maxfiy yo'q.
- Tekshiruv: foyda/dona-kg marketingga ulanmagan ✓.

## 14.90 — EP-MKT-112 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: menejer karta faollik↔natija stat yo'q; sd_lead_activities yig'ilmaydi.
- Tekshiruv: marketing karta-stat qurilmagan ✓.

## 14.91 — EP-MKT-113 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: dizayn-upsell taklif + опросн old-to'ldirish yo'q.
- Tekshiruv: опросн grep=0 ✓.

## 14.92 — EP-MKT-114 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: mijoz aksiya-kalendari + proaktiv eslatma yo'q.
- Tekshiruv: marketingda yo'q ✓.

## 14.93 — EP-MKT-115 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: marketing_budget_items/lines + budget CRUD (group2:145-186); zavod-real modda + HR komandировка ulanish yo'q.
- Tekshiruv: group2:145-191 budget CRUD real ✓; HR-link yo'q ✓.

## 14.94 — EP-MKT-116 [DOC: egasi-data] → [VERIFIED: egasi-data] (confirmed)
- Doc: decisions OCHIQ; dashboard bor lekin egaga-maxsus 5-raqam widget yo'q.
- Tekshiruv: MarketingDashboard.tsx bor ✓; 5-raqam egasidan.

## 14.95 — EP-MKT-117 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: marketing_leads'da referrer ustuni yo'q; employee_referrals=HR.
- Tekshiruv: jonli schema referrer yo'q ✓.

## 14.96 — EP-MKT-118 [DOC: yo'q] → [VERIFIED: yoq] (confirmed)
- Doc: convert-to-crm faqat name/phone/email/source ko'chiradi; rekvizit darvozasi yo'q.
- Tekshiruv: stubs:288-301 INSERT — STIR/shartnoma/manzil tekshiruvi yo'q ✓.

## 14.97 — EP-MKT-059/060 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: exhibitions CRUD + leads + QR; exhibition_leads(0); 48-soat follow-up yo'q ('no next_follow_up_at').
- Tekshiruv: stubs:420-496 real ✓; count=0 ✓; repo:481 izoh ✓.

## 14.98 — EP-MKT-078 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: GET /competitors real aggregate; sd_customer_competitors=0; alohida CRUD yo'q.
- Tekshiruv: group2:265 GET competitors real ✓; count=0 ✓; CRUD yo'q ✓.

## 14.99 — EP-MKT-062/064 [DOC: qisman] → [VERIFIED: qisman] (confirmed)
- Doc: inbox endpoints real; tables bor (0/0); AI-reply=pending; webhook yo'q.
- Tekshiruv: stubs:318-386 real ✓; counts 0/0 ✓; stubs:361-366 AI 'pending' ✓.
