# 13 — CRM — Mustaqil tekshiruv (2026-06-27)

**Modul:** CRM (85 savol)
**Doc self-claim:** 58% vizyon coverage
**Tekshiruvchi realPct (verifiable only, egasi-data chiqarib):** 33% (bor=13, qisman=24, yoq=38; denom=75)
**Claim accuracy:** 82 confirmed / 3 refuted

## Umumiy xulosa
CRM moduli doc'i juda aniq yozilgan. Kod-bazaviy "bor" da'volari (funnel, lead-scoring, churn, customer-360, golden-thread deal→sales_order, lead→sd_customers, supervisor-dashboard, RFM/CLV) JONLI tasdiqlandi. Zavod-spetsifik "yoq" da'volari (НО-2 telefoniya, папка-tizimi, ГП-kod takror-buyurtma, plan/aslida o'lcham, korporativ raqam) haqiqatan qurilmagan. Asosiy noaniqliklar — DB-constraint da'volari.

## REFUTED CLAIMS (overstated/wrong evidence)
- **13.18** — Doc: "sd_customers.segment CHECK ∈ {vip/regular/new/potential} jonli mavjud". REALITY: `sd_customers` da segment uchun HECH QANDAY CHECK constraint yo'q (`pg_constraint` → 0 check); jonli qiymatlar = NULL va 'B2B' (vip/regular/new/potential EMAS). Ustun bor, lekin CHECK da'vosi noto'g'ri. (egasi-data — denom'dan tashqari)
- **13.39** — Doc: "Папка/Заявка jadval yoki kod YO'Q (grep papka→0; information_schema da папка jadvali yo'q)". REALITY: `papka_orders` VA `mes_papka_orders` jadvallari MAVJUD. CRM-mijoz папка-ro'yxati funksiyasi haqiqatan yo'q (status=yoq to'g'ri), lekin "папка jadvali yo'q" dalili faktik noto'g'ri.
- **13.54** — Doc: "sd_customers.segment 'vip' qiymati bor". REALITY: jonli segment qiymatlari NULL/B2B — 'vip' qiymati yo'q va CHECK yo'q (faqat varchar, nazariy belgilanishi mumkin). Yengil overstatement.

---

## 13.1 — Q (EP-CRM) [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Lid→bitim voronka bosqichlari + konversiya foizi
- Doc Isbot: crm_lead_stages=6 jonli; funnel.service.ts conversion formula; FE funnelData
- Tekshiruv: `crm_lead_stages`=6 qator, nomlar AYNAN mos (Yangi lid/Jarayonda/Tahlil/Yakunlash/Konvertatsiya/Yo'qotildi). funnel.service.ts:144 conversionRate=movedToNext/entered×100, calculateConversion() (134). MarketingLeads.tsx:67 funnelData useQuery. TASDIQ.

## 13.2 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: crm_stages=0; crm_lead_stages=6 generic, zavod bosqichlari yo'q
- Tekshiruv: `crm_stages`=0 qator tasdiq; crm_lead_stages generic nomlar tasdiq. egasi-data.

## 13.3 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: auto-lead/sources endpoint; ingestCall/Form/Telegram source yozadi
- Tekshiruv: crm-auto-lead.controller.ts:71 GET auto-lead/sources. Repo (infrastructure) ingestCallLead source='call' (76), ingestFormLead source=form_name??'web_form' (93), ingestTelegramLead source='telegram' (108) — real db.insert(crmLeads). TASDIQ.

## 13.4 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: website-contact-lead.listener @EventsHandler→handleWebsiteContact; notifySalesGroup; telegram ingest
- Tekshiruv: website-contact-lead.listener.ts:24 @EventsHandler(WebsiteContactSubmittedEvent)→leadSvc.handleWebsiteContact (39). website-lead.service.ts:99 notifySalesGroup → telegram.sendMessage (113). TASDIQ.

## 13.5 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: website-lead.repository.ts:37 pickNextSalesManager round-robin SQL
- Tekshiruv: pickNextSalesManager() line 37 — GROUP BY e.id ORDER BY COUNT(l.id) ASC LIMIT 1, oxirgi 30 kun, role='sales_manager'+is_active. JONLI SQL tasdiq.

## 13.6 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: crm_activities jonli (3 qator); comms repo har aloqa INSERT type+subject+notes+status; crm-activities.controller
- Tekshiruv: `crm_activities`=3 qator. crm-comms.repository.ts logEmail/logSms/logWhatsapp/scheduleMeeting db.insert(crm_activities) type+subject+notes+status (19-84). crm-activities.controller.ts mavjud. TASDIQ.

## 13.7 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: comms controller endpoints bor, lekin service faqat log + {sent:true}, provayder yo'q
- Tekshiruv: crm-comms.controller.ts:51/62/80/91 email/meetings/sms/whatsapp. crm-comms.service.ts:16-39 repo.logEmail/logSms/logWhatsapp → Ok({sent:true}) — HAQIQATDA yubormaydi. Aniq tasvirlangan. qisman.

## 13.8 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: notes log yoziladi, ikki-tomonlama sync yo'q
- Tekshiruv: comms repo faqat chiquvchi log (notes). Kelgan xabar sinxroni yo'q. qisman.

## 13.9 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: crm_tasks jonli (7); listTasks real; CRON eskalatsiya yo'q
- Tekshiruv: `crm_tasks`=7 qator. crm-extras-tasks.repository.ts:23 listTasks(due_date/status/assigned_to) real Drizzle. CRON eskalatsiya topilmadi. qisman.

## 13.10 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: MarketingLeads.tsx:65 overdue-leads useQuery; supervisor-dashboard bor; avto-eskalatsiya noaniq
- Tekshiruv: MarketingLeads.tsx:65 '/api/marketing/leads/automation/overdue-leads' — AYNAN. supervisor-dashboard endpoint bor. Avto-eskalatsiya yo'q. qisman.

## 13.11 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: crm-lead-scoring.service TIER_HOT_MIN=70/WARM=40; lead-scoring-agent; quick-score endpoint
- Tekshiruv: crm-lead-scoring.constants.ts TIER_HOT_MIN=70 (166), TIER_WARM_MIN=40 (172). service.ts:364 hot/warm/cold. agents/lead-scoring-agent.service.ts mavjud. quick-score/:entityType/:id (controller:42). TASDIQ.

## 13.12 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: vaznlar .30/.25/.20/.15/.10=1.0 + SOURCE_QUALITY_MAP; owner overrides
- Tekshiruv: constants budget .30/engagement .25/recency .20/source .15/fit .10 (46-58), SCORING_WEIGHT_SUM=1.0, SOURCE_QUALITY_MAP (111). "owner per-tenant overrides" izoh. egasi-data.

## 13.13 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: crm-ai.service.ts:94 getNextBestAction; crm-extended ai/nba endpoint
- Tekshiruv: application/crm-ai.service.ts:94 getNextBestAction→recommended_action+alternatives+reasoning (105). crm-extended.controller.ts:82 GET ai/nba/:entityType/:entityId. TASDIQ.

## 13.14 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: churn.service logistik P(churn)=σ(...), 5 feature, HIGH>0.7/MEDIUM>0.4; churn/predict; churn-rescue
- Tekshiruv: churn.service.ts sigmoid (69), 5 feature (rfmRecency/complaints/daysSinceContact/tickets/late), risk HIGH>0.7 MEDIUM>0.4 (93). crm-analytics.controller.ts:98 POST churn/predict. churn-rescue endpoint (auto-lead:63). TASDIQ.

## 13.15 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: customer-360.builder orders/payments/openDebt/complaints/contacts/NPS/competitors; FE Customer360View 360 endpoint
- Tekshiruv: customer-360.builder.ts orders(99)/payments(187)/openDebt=revenue−paid(190)/complaints filter type='complaint'(124)/contacts(87)/nps(127)/competitors(205). FE = components/sd/Customer360View.tsx (pages/ EMAS, lekin mavjud); sd-customers.controller.ts:195 GET :id/360. TASDIQ.

## 13.16 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: markWon→MarkDealWonCommand→DealWonEvent; deal-won.listener→CreateOrderCommand→sales_order idempotent back-link
- Tekshiruv: crm-deals.controller.ts:135 markWon→MarkDealWonCommand. sd/deal-won.listener.ts:20 @EventsHandler(DealWonEvent)→CreateOrderCommand (53), idempotent guard (_findExistingOrder), _linkDealToOrder golden-thread back-link (127). JONLI ZANJIR. TASDIQ.

## 13.17 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: sd_customers jonli (15); lead-converted-customer.listener INSERT segment='new' idempotent; 360 o'qiydi
- Tekshiruv: `sd_customers`=15 qator. lead-converted-customer.listener.ts:49 INSERT sd_customers segment='new' WHERE NOT EXISTS (idempotent). TASDIQ.

## 13.18 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: REFUTED)
- Doc Isbot: "sd_customers.segment CHECK ∈ {vip/regular/new/potential} jonli mavjud"; ABC kod
- Tekshiruv: `sd_customers` da segment uchun CHECK constraint YO'Q (pg_constraint check=0). Jonli segment qiymatlari = NULL, 'B2B'. CHECK da'vosi NOTO'G'RI (overstated). Ustun mavjud, ABC_SCORE_WEIGHT kod bor. egasi-data, lekin dalil refuted.

## 13.19 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: rfm/clv/kmeans service; rfm/cluster endpoint; FE CrmRfmClusters
- Tekshiruv: analytics/rfm.service.ts, clv.service.ts, kmeans.service.ts mavjud. crm-analytics.controller.ts:89 POST rfm/cluster. FE CrmRfmClusters.tsx mavjud. TASDIQ.

## 13.20 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: MarketingLeads.tsx:79 loss-analysis useQuery; sabab ro'yxati egasidan
- Tekshiruv: MarketingLeads.tsx:80 '/api/marketing/leads/loss-analysis' (doc :79, deyarli aniq). egasi-data.

## 13.21 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: sd-quotations KP bor; crm_proposals JONLI lekin BO'SH (0); holat-tracking yo'q
- Tekshiruv: `crm_proposals`=0 qator tasdiq. sd-quotations service SD'da. Holat-tracking yo'q. qisman.

## 13.22 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: CRM_READ_ROLES @Roles bor; row-level assigned_to filtri yo'q
- Tekshiruv: crm-leads.controller.ts:81 CRM_READ_ROLES=[sales_manager/SALES/crm_manager/director/super_admin], :89 @Roles. Row-level WHERE assigned_to=current_user TOPILMADI. qisman.

## 13.23 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: deal-won-notification.listener bor; GSD-yangilash zanjiri noaniq
- Tekshiruv: notifications/deal-won-notification.listener.ts mavjud. CRM bitim→GSD/ЦКП avto-ulanish kodi tasdiqlanmadi. qisman.

## 13.24 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Doc Isbot: 360 openDebt; sd_customers.is_blocked bor; avto-blok kodi yo'q, LIMIT egasidan
- Tekshiruv: is_blocked ustun MAVJUD (information_schema). openDebt hisoblanadi. Avto-blok oqimi yo'q. egasi-data.

## 13.25 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: 360 builder complaints filter type='complaint'; QC event + qizil zanjiri yo'q
- Tekshiruv: customer-360.builder.ts:124 complaints filter type='complaint'. QcReclamationOpenedEvent→CRM yo'q. qisman.

## 13.26 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: crm_followup_activities jonli; churn-rescue bor; 30/60/90 CRON yo'q
- Tekshiruv: `crm_followup_activities` jadval mavjud (0 qator). churn-rescue endpoint bor. CRON kampaniya yo'q. qisman.

## 13.27 — [DOC: ✅ bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Doc Isbot: supervisor-dashboard endpointlar; getSupervisorDashboard real SQL
- Tekshiruv: crm-auto-lead.controller.ts:53 GET supervisor-dashboard. crm-extended:72/77 supervisor/dashboard + ai/supervisor-dashboard. repo:37 getSupervisorDashboard real Drizzle (leads_30d/open_deals/pipeline_value). TASDIQ.

## 13.28 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: telefoniya/ATS yo'q; call/phone/recording jadvali yo'q
- Tekshiruv: CRM call/phone jadvali yo'q (faqat chat_video_calls, aisha_tool_calls — CRM telefoniya emas). yoq.

## 13.29 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: FE responsive + Telegram ingest; PWA oflayn tasdiqlanmadi
- Tekshiruv: ingestTelegramLead bor; PWA-oflayn CRM-spetsifik yo'q. qisman.

## 13.30 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: @Roles guard bor; row-level + field-level yo'q
- Tekshiruv: 13.22 bilan bir — rol-guard bor, row/field-level yo'q. qisman.

## 13.31 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Doc Isbot: korporativ raqam/SIM biriktirish jadvali yo'q
- Tekshiruv: corporate-number jadval/kod topilmadi. НО-2 telefon-tartib qurilmagan. yoq.

## 13.32 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: abonent-doira/whitelist yo'q. yoq.

## 13.33 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: Inspeksiya qo'ng'iroq-nazorat paneli yo'q; telefoniya yo'q. yoq.

## 13.34 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: 360 complaints/interactions umumiy; Sifat-bo'lim alohida teg yo'q. qisman.

## 13.35 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: korporativ biznes-akkaunt biriktirish/arxivlash yo'q. yoq.

## 13.36 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: Даромадлар-dept routing kodi/jadvali yo'q. yoq.

## 13.37 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: 360 openDebt payments/orders dan hisoblaydi (xolis); Finance-feed ajratish noaniq
- Tekshiruv: customer-360.builder.ts:190 openDebt=totalRevenue−sum(payments) — hisoblanadi. Manba-ajratish noaniq. qisman.

## 13.38 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: Даромадлар aloqa-teg 360°ga yo'q. yoq.

## 13.39 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: REFUTED)
- Doc Isbot: "Папка jadval yo'q (grep papka→0; information_schema da папка jadvali yo'q)"
- Tekshiruv: `papka_orders` VA `mes_papka_orders` jadvallari MAVJUD (information_schema). Dalil FAKTIK NOTO'G'RI. CRM-mijoz папка-ro'yxati funksiyasi haqiqatan yo'q → status yoq to'g'ri, lekin "jadval yo'q" da'vosi refuted.

## 13.40 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: 'Прошло дней' buyurtma-hisoblagich yo'q (faqat overdue-leads). yoq.

## 13.41 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: mijoz qog'oz-profili (format/gramm) yo'q. yoq.

## 13.42 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: папка-izoh yo'q; crm_comments umumiy (3 qator). yoq.

## 13.43 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: ГП-kod takror-buyurtma yo'q; crm_products (2 qator) umumiy katalog. yoq.

## 13.44 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: konstruksiya-parametr profili CRM-da yo'q. yoq.

## 13.45 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: maket/logotip kutubxonasi yo'q; crm_documents (0 qator) umumiy. yoq.

## 13.46 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: ГП-topshirish 3-imzo elektron blanka CRM-da yo'q. yoq.

## 13.47 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: 360 orders status + golden-thread; avto keyingi-buyurtma eslatmasi yo'q. qisman.

## 13.48 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: haydovchi/transport tarixi 360°da yo'q. yoq.

## 13.49 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: plan/aslida o'lcham farqi-qulf yo'q. yoq.

## 13.50 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: format-o'zgarish elektron rozilik yo'q. yoq.

## 13.51 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: crm_lead_stages=6 generic (nomlar tasdiqlangan), 'Dizayn/o'lcham' bosqichi yo'q. yoq.

## 13.52 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: 'O'lcham tasdiqlandi' gate-bayroq yo'q. yoq.

## 13.53 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: crm_companies jonli (4); biznes-profili maydoni tasdiqlanmadi
- Tekshiruv: `crm_companies`=4 qator. 'nima qadoqlaydi' profili yo'q. qisman.

## 13.54 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: REFUTED)
- Doc Isbot: "sd_customers.segment 'vip' qiymati bor (asosiy belgilash mumkin)"
- Tekshiruv: jonli segment qiymatlari NULL/'B2B' — 'vip' qiymati YO'Q, CHECK yo'q. Varchar bo'lgani uchun nazariy yozilishi mumkin, lekin "vip qiymati bor" overstated. VIP→PP ustuvorlik zanjiri yo'q. qisman.

## 13.55 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: churn recency/RFM umumiy; kg-asosida trend yo'q. qisman.

## 13.56 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: chiqimli/chiqimsiz narx-varianti yo'q. yoq.

## 13.57 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Tekshiruv: qog'oz-narx→qayta-hisob CRON yo'q; trigger% egasidan. egasi-data.

## 13.58 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: mijoz×format narx-jadvali yo'q. yoq.

## 13.59 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: DealWonEvent→sales_order (golden-thread) real; sales_order→PP reja-navbati CRM darajada emas. qisman.

## 13.60 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: stanok-yuk asosida real-muddat CRM-da yo'q. yoq.

## 13.61 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: mahsulot→stanok-marshrut CRM-da yo'q. yoq.

## 13.62 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: @Roles director/sales_manager farqlanadi; row-scope yo'q. qisman.

## 13.63 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Tekshiruv: egasizlantirish CRON kodi yo'q; N egasidan. egasi-data.

## 13.64 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: supervisor-dashboard summa/pipeline_value beradi; KG-asosida emas. qisman.

## 13.65 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: mentor-tasdiq bitim-gate CRM-da yo'q. yoq.

## 13.66 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: eksport-blok/log mexanizmi yo'q. yoq.

## 13.67 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: field-level kontakt-yashirish kodi yo'q. yoq.

## 13.68 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Doc Isbot: audit_log bor; crm_entity_history/crm_history jonli; Инспекция filtri tasdiqlanmadi
- Tekshiruv: crm_history/crm_entity_history jadvallari MAVJUD (lekin 0 qator). CRM-eksport audit + Инспекция filtri yo'q. qisman.

## 13.69 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: avans-bayroq + avanssiz-PP-blok gate yo'q. yoq.

## 13.70 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: odatiy-to'lov-turi maydoni yo'q. yoq.

## 13.71 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: USD-bog'liq narx + kurs-ogohlantirish yo'q. yoq.

## 13.72 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: 360 complaints umumiy; sabab-kodi struktura + QC event yo'q. qisman.

## 13.73 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: ochiq-reklamatsiya bayroq + yangi-yuk-blok yo'q. yoq.

## 13.74 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: kompensatsiya/chegirma tarixi + suiiste'mol bayroq yo'q. yoq.

## 13.75 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: oylik kg mijoz-kesim yo'q; cohort.service umumiy. yoq.

## 13.76 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: RFM/CLV top-mijoz (summa); yillik KG-kesim yo'q. qisman.

## 13.77 — [DOC: 🟡 qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Tekshiruv: 360 builder recentOrders status; 3-holat real-vaqt MES/Ombor→CRM zanjiri yo'q. qisman.

## 13.78 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: mijoz-liniya kesim struktura yo'q; crm_products umumiy. yoq.

## 13.79 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Tekshiruv: STP/format versiyalash yo'q; vision-da ochiq. egasi-data.

## 13.80 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: korporativ-raqam aloqa-teglash yo'q. yoq.

## 13.81 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Tekshiruv: import-bog'liqlik toifa + SupplyImportIssueEvent yo'q; vision-da ochiq. egasi-data.

## 13.82 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: ombor-kirish-talablari maydoni yo'q. yoq.

## 13.83 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: o'rash/qadoqlash usuli mijoz mahsulotiga yo'q. yoq.

## 13.84 — [DOC: ❌ yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Tekshiruv: namuna/Академияга buyurtma-turi yo'q. yoq.

## 13.85 — [DOC: 🔑 egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Tekshiruv: mijoz↔operator bog'lanish yo'q; vision-da ochiq. egasi-data.

---

## Hisob
- qTotal=85, egasiData=10, verifiable=75
- borReal=13, qismanReal=24, yoqReal=38
- realPct = round(100×(13 + 0.5×24)/75) = round(100×25/75) = **33%**
- claimedPct (doc self) = 58
- confirmed=82, refuted=3 (13.18, 13.39, 13.54)
