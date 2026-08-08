## [B/TASDIQ] CRM (13) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Lid→bitim voronka + bosqich konversiyasi | 2026-06-27 | TASDIQ-2146 §13 #1 | Sotuv oqimini ko'rish | CRM voronka | To'liq voronka + conversionRate | Ha — funnel.service.ts:9; crm_lead_stages=6 | ShVB conversionRate/salesCycleLength jonli |
| 2 | Voronka bosqichlarini kim belgilaydi (zavod jarayoni) | 2026-06-27 | TASDIQ-2146 §13 #2 | Zavod jarayoniga moslash | Pipeline-konfig | Egasi tahrir qiladigan bosqich nomlari | egasi-data — crm_stages=0 BO'SH | Aniq bosqich nomlari egasidan |
| 3 | Ko'p manba + manba majburiy | 2026-06-27 | TASDIQ-2146 §13 #3 | Lid manbasini kuzatish | Lid ingest | source majburiy yozish | Ha — crm-auto-lead.controller.ts:71; ingestCall/Form/Telegram | source='call'/'web_form'/'telegram' |
| 4 | Vebsayt+Telegramdan avto lid + bildirishnoma | 2026-06-27 | TASDIQ-2146 §13 #4 | Lid yo'qotmaslik | Lid avtomatlashtirish | Avto INSERT + notif | Ha — website-contact-lead.listener.ts; website-lead.service.ts:47 | notifySalesGroup jonli |
| 5 | Avto sotuvchiga biriktirish (round-robin/hudud) | 2026-06-27 | TASDIQ-2146 §13 #5 | Adolatli taqsimot | Lid assign | pickNextSalesManager | Ha — website-lead.repository.ts:37 | 30-kun eng kam lidli manager |
| 6 | Faollik jurnali (qo'ng'iroq/xat/uchrashuv) | 2026-06-27 | TASDIQ-2146 §13 #6 | Audit izi | Faollik | crm_activities log | Ha — crm-comms.repository.ts; crm_activities jonli | type+subject+notes INSERT |
| 7 | Aloqa kanallari (SMS/Email/TG/WhatsApp) kartada | 2026-06-27 | TASDIQ-2146 §13 #7 | Ko'p kanal aloqa | Comms | Real yuborish (provayder) | Qisman — crm-comms.service.ts faqat log, {sent:true} | Provayder integratsiyasi yo'q; WhatsApp/SMS egasidan |
| 8 | Yozishma tarixi avto kartada | 2026-06-27 | TASDIQ-2146 §13 #8 | To'liq kontekst | Comms arxiv | Ikki-tomonlama sinxron | Qisman — faqat chiquvchi log (notes) | Kelgan xabar sinxroni + korp-akkaunt arxiv yo'q |
| 9 | Vazifa+eslatma+eskalatsiya | 2026-06-27 | TASDIQ-2146 §13 #9 | Ijro nazorati | Tasks | Avto eslatma+eskalatsiya CRON | Qisman — crm_tasks jonli(7); listTasks real | CRON eslatma/eskalatsiya tasdiqlanmadi |
| 10 | Kechikkan vazifa boshliq paneliga | 2026-06-27 | TASDIQ-2146 §13 #10 | Nazorat | Supervisor | Avto-eskalatsiya panel | Qisman — MarketingLeads.tsx:65 overdue-leads useQuery | Avto Telegram signal tasdiqlanmadi |
| 11 | Hot-lead avto ajratish (faollik+summa) | 2026-06-27 | TASDIQ-2146 §13 #11 | Ustuvor lid | Lead scoring | AI tahlil ajratish | Ha — crm-lead-scoring.service.ts TIER_HOT_MIN=70 | hot/warm/cold jonli |
| 12 | Lead scoring 5 mezon vaznli ball | 2026-06-27 | TASDIQ-2146 §13 #12 | Ob'ektiv ballash | Scoring formula | Mezon/vazn egasidan | egasi-data — crm-lead-scoring.constants.ts default vazn bor | per-tenant override egasidan |
| 13 | AI Next Best Action (taklif+inson tasdiq) | 2026-06-27 | TASDIQ-2146 §13 #13 | Sotuvchiga yordam | AI NBA | getNextBestAction | Ha — crm-ai.service.ts:94; crm-extended ai/nba | recommended_action+reasoning |
| 14 | AI churn bashorati + qaytarish vazifasi | 2026-06-27 | TASDIQ-2146 §13 #14 | Mijoz saqlash | Churn | Logistik-regressiya + rescue | Ha — churn.service.ts; churn-rescue/:id | 5 feature, HIGH>0.7 |
| 15 | Mijoz 360° (buyurtma+to'lov+qarz+shikoyat) | 2026-06-27 | TASDIQ-2146 §13 #15 | Yagona ko'rinish | 360 view | ERP modul bog'lash | Ha — customer-360.builder.ts; Customer360View.tsx | orders/payments/openDebt/complaints/NPS |
| 16 | Oltin ip: bitim yutilsa→sales_order avto | 2026-06-27 | TASDIQ-2146 §13 #16 | Vizyon yadrosi | Golden-thread | DealWon→CreateOrder | Ha — crm-deals.controller.ts:133; sd/deal-won.listener.ts | Idempotent real zanjir |
| 17 | Yagona kanonik mijoz bazasi | 2026-06-27 | TASDIQ-2146 §13 #17 | Bir manba | Master-data | sd_customers kanonik | Ha — sd_customers(15); lead-converted-customer.listener.ts | won-lead→sd_customers INSERT |
| 18 | Mijoz segmentlari (VIP/asosiy/oddiy) | 2026-06-27 | TASDIQ-2146 §13 #18 | Segmentatsiya | Segment | Segment nomlari egasidan | egasi-data — sd_customers.segment CHECK bor | Aniq mezon/nom egasidan |
| 19 | RFM/CLV panelga | 2026-06-27 | TASDIQ-2146 §13 #19 | Mijoz qadri | Analitika | RFM+CLV hisob | Ha — rfm.service.ts; clv.service.ts; CrmRfmClusters.tsx | kmeans cluster |
| 20 | Yutqazish sababi majburiy + hisobot | 2026-06-27 | TASDIQ-2146 §13 #20 | Sabab tahlili | Loss analysis | Majburiy sabab ro'yxat | egasi-data — MarketingLeads.tsx:79 lossAnalysis bor | Sabab ro'yxati egasidan |
| 21 | KP tayyorlash+yuborish+holat kuzatish | 2026-06-27 | TASDIQ-2146 §13 #21 | Taklif nazorati | Proposals | KP holat tracking | Qisman — sd-quotations bor; crm_proposals BO'SH(0) | Ko'rildi/qabul tracking tasdiqlanmadi |
| 22 | Karta-model integratsiya (sotuvchi o'ziniki) | 2026-06-27 | TASDIQ-2146 §13 #22 | Ma'lumot chegarasi | RBAC | Row-level filtr | Qisman — @Roles guard bor, row-level yo'q | WHERE assigned_to filtri topilmadi |
| 23 | Yopilgan bitim→sotuvchi KPI/ЦКП avto | 2026-06-27 | TASDIQ-2146 §13 #23 | KPI bog'lash | KPI/GSD | Event→GSD yangilash | Qisman — DealWonEvent+notif listener bor | GSD-yangilash zanjiri noaniq |
| 24 | Qarz limitidan oshsa blok+tasdiq | 2026-06-27 | TASDIQ-2146 §13 #24 | Kredit nazorati | Debtor control | Avto-blok oqim+LIMIT | egasi-data — openDebt hisob; is_blocked bor | LIMIT qiymati + avto-blok kodi egasidan |
| 25 | Shikoyat/reklamatsiya kartada qizil belgi | 2026-06-27 | TASDIQ-2146 §13 #25 | Sifat izi | 360 complaints | QC→CRM event | Qisman — 360.builder:124 complaints filter | QcReclamationOpenedEvent zanjiri tasdiqlanmadi |
| 26 | Avto follow-up kampaniyalari (30/60/90) | 2026-06-27 | TASDIQ-2146 §13 #26 | Mijoz faollashtirish | Follow-up | Jimlik CRON kampaniya | Qisman — crm_followup_activities jonli; churn-rescue bor | 30/60/90 CRON kodi tasdiqlanmadi |
| 27 | Boshliq CRM dashboard (voronka+reyting+signal) | 2026-06-27 | TASDIQ-2146 §13 #27 | Boshqaruv | Dashboard | Supervisor panel | Ha — crm-auto-lead.controller.ts:53 supervisor-dashboard | getSupervisorDashboard real SQL |
| 28 | Telefon qo'ng'irog'ini yozib kartaga | 2026-06-27 | TASDIQ-2146 §13 #28 | Aloqa izi | Telefoniya | ATS integratsiya | Yo'q — call/recording jadvali yo'q | Provayder egasidan |
| 29 | Mobil CRM (sotuvchi tashqarida) | 2026-06-27 | TASDIQ-2146 §13 #29 | Sayohatda ish | Mobil | PWA oflayn | Qisman — FE responsive + TG bot ingest | PWA oflayn/conflict tasdiqlanmadi |
| 30 | Ma'lumot kirish chegarasi (o'ziniki) | 2026-06-27 | TASDIQ-2146 §13 #30 | Maxfiylik | RBAC | Row+field level | Qisman — faqat rol-guard | Row/field-level yashirish yo'q |
| 31 | НО-2: korporativ raqam menejer kartasiga | 2026-06-27 | TASDIQ-2146 §13 #31 | Raqam egaligi | Telefon tartibi | Raqam biriktirish+o'tkazish | Yo'q — corporate.number jadval yo'q | НО-2 qurilmagan |
| 32 | НО-2: abonent doirasi cheklovi + flag | 2026-06-27 | TASDIQ-2146 §13 #32 | Aloqa nazorati | Whitelist | Doira tekshiruv webhook | Yo'q — abonent grep 0 | Qurilmagan |
| 33 | НО-2: qo'ng'iroq nazorati Инспекция paneliga | 2026-06-27 | TASDIQ-2146 §13 #33 | Inspeksiya | Telefoniya | Jurnal→panel | Yo'q — telefoniya yo'q | EP-CRM-028 bilan bir |
| 34 | Сифат boshlig'i↔mijoz aloqasi kartada | 2026-06-27 | TASDIQ-2146 §13 #34 | Yagona 360 | 360 tag | Sifat-teg aloqa | Qisman — 360 umumiy interactions | Сифат-teg mexanizmi tasdiqlanmadi |
| 35 | Korporativ TG/biznes-akkaunt→CRM, menejer ketsa qoladi | 2026-06-27 | TASDIQ-2146 §13 #35 | Akkaunt egaligi | Corp akkaunt | Biznes-akkaunt arxiv+o'tkazish | Yo'q — kodi yo'q | Bot ingest bor, korp-egalik yo'q |
| 36 | Debitor qarz Даромадлар bo'limiga (savdoda emas) | 2026-06-27 | TASDIQ-2146 §13 #36 | Vazifa ajratish | Debtor routing | Даромадлар routing | Yo'q — grep 0 | Bo'lim qurilmagan |
| 37 | Qarz holatini faqat Finance yangilaydi | 2026-06-27 | TASDIQ-2146 §13 #37 | Xolislik | Debt feed | Finance avto-feed+savdo-blok | Qisman — openDebt payments/orders dan hisob | Manba-ajratish noaniq |
| 38 | Qarz aloqasi bir tarixda ko'rinadi | 2026-06-27 | TASDIQ-2146 §13 #38 | Yagona tarix | 360 tag | Даромадлар aloqa→360 | Yo'q — bo'lim qurilmagan | EP-CRM-036 bilan bir |
| 39 | Папка№ — buyurtma papkasi kartada | 2026-06-27 | TASDIQ-2146 §13 #39 | Zavod papka-raqami | Папка | Папка jadval+raqamlash | Yo'q — grep 0 | Qurilmagan |
| 40 | Прошло дней — avto hisoblagich+limit signal | 2026-06-27 | TASDIQ-2146 §13 #40 | Muddat nazorati | Папка | Days-elapsed hisoblagich | Yo'q — Папка tizimi yo'q | Faqat overdue-leads (buyurtma emas) |
| 41 | Mijoz qog'oz profili saqlash+pre-fill | 2026-06-27 | TASDIQ-2146 §13 #41 | Takror kirit yo'q | Spetsifikatsiya | Qog'oz-profil maydoni | Yo'q — jadval yo'q | Zavod-spets qurilmagan |
| 42 | Примечание papkadan kartaga | 2026-06-27 | TASDIQ-2146 §13 #42 | To'liq kontekst | Папка izoh | Papka-izoh→karta | Yo'q — Папка yo'q | crm_comments umumiy, Заявка emas |
| 43 | ГП-kod takror buyurtma tugmasi | 2026-06-27 | TASDIQ-2146 §13 #43 | Qayta buyurtma | Takror-order | ГП-kod tarix+tugma | Yo'q — mexanizm yo'q | crm_products umumiy |
| 44 | Mahsulot konstruksiya parametrlari kartada | 2026-06-27 | TASDIQ-2146 §13 #44 | Texnik profil | Product profil | Sloy/o'lcham profili | Yo'q — CRM kartada yo'q | technology_cards PP-da, bog'lanish tasdiqlanmadi |
| 45 | Mijoz maket/logotip kutubxonasi (versiyalar) | 2026-06-27 | TASDIQ-2146 §13 #45 | Brend eslash | Maket lib | Versiyalangan kutubxona | Yo'q — yo'q | crm_documents umumiy, maket-versiya emas |
| 46 | ГП topshirish 3-imzo elektron blanka | 2026-06-27 | TASDIQ-2146 §13 #46 | Yuk nazorati | Blanka | 3-imzo elektron gate | Yo'q — CRM-da yo'q | EP-SD-138 da bo'lishi mumkin |
| 47 | Yetkazilgach karta yangilash + follow-up | 2026-06-27 | TASDIQ-2146 §13 #47 | Proaktiv | Delivery | Avto keyingi eslatma | Qisman — 360 orders holat; yetkazish event bor | Avto follow-up ulanish tasdiqlanmadi |
| 48 | Haydovchi/transport mijoz kartasida | 2026-06-27 | TASDIQ-2146 §13 #48 | Yetkazish izi | Logistika | Transport tarix→360 | Yo'q — CRM kartada yo'q | Logistika bog'lanish tasdiqlanmadi |
| 49 | Razmer plan↔aslida farqi qulf+flag | 2026-06-27 | TASDIQ-2146 §13 #49 | O'lcham nazorati | O'lcham gate | Qulf+farq flag | Yo'q — yo'q | Qisqartirish-jadval qurilmagan |
| 50 | Format o'zgarishi elektron rozilik | 2026-06-27 | TASDIQ-2146 §13 #50 | Rozilik izi | Rozilik | Elektron rozilik saqlash | Yo'q — yo'q | Menejer-rozilik ustunlari qurilmagan |
| 51 | Dizayn/o'lcham kelishuvi alohida voronka bosqichi | 2026-06-27 | TASDIQ-2146 §13 #51 | Bosqich nazorati | Voronka | Dizayn bosqichi+mas'ul+limit | Yo'q — crm_lead_stages generic | Bosqich qurilmagan |
| 52 | Шошилмаслик — o'lcham tasdiqsiz PP ga o'tmaydi | 2026-06-27 | TASDIQ-2146 §13 #52 | Brak oldi | PP gate | Gate-bayroq | Yo'q — gate yo'q | Tamoyil qurilmagan |
| 53 | Mijoz mahsulot/biznes profili (nima qadoqlaydi) | 2026-06-27 | TASDIQ-2146 §13 #53 | Mijoz konteksti | Company profil | Biznes-profil maydoni | Qisman — crm_companies(4) bor | 'Nima qadoqlaydi' maydoni tasdiqlanmadi |
| 54 | Asosiy mijoz bayrog'i+ustuvorlik+zaxira | 2026-06-27 | TASDIQ-2146 §13 #54 | Strategik mijoz | VIP flow | VIP→PP+WMS zanjir | Qisman — segment 'vip' bor | Ustuvorlik+zaxira event tasdiqlanmadi |
| 55 | Mijoz kg-trend + pasayish signali | 2026-06-27 | TASDIQ-2146 §13 #55 | Trend nazorati | Trend | kg-asosli trend | Yo'q — summa asosida | kg-asos yo'q |
| 56 | Чиқимли/чиқимсиз narx varianti | 2026-06-27 | TASDIQ-2146 §13 #56 | Savdo dalili | Narx | Chiqim-mantiq narx | Yo'q — yo'q | Qisqartirish-jadval qurilmagan |
| 57 | Qog'oz narxi o'zgarsa→qayta-narx vazifasi | 2026-06-27 | TASDIQ-2146 §13 #57 | Narx yangilash | Narx feed | Trigger CRON+% chegara | egasi-data — kod zaif | Trigger% + Ta'minot feed egasidan |
| 58 | Mijoz×format narx jadvali | 2026-06-27 | TASDIQ-2146 §13 #58 | Ko'p-format narx | Narx jadval | Per-format narx | Yo'q — bitta umumiy yozuv | Qurilmagan |
| 59 | Yutilgan bitim→PP reja navbatiga avto | 2026-06-27 | TASDIQ-2146 §13 #59 | Stanok yuklash | PP reja | sales_order→PP navbat | Qisman — DealWon→sales_order bor | CRM darajada PP-navbat tasdiqlanmadi |
| 60 | Muddat stanok yukidan avto hisob | 2026-06-27 | TASDIQ-2146 §13 #60 | Real va'da | CRP | Stanok-yuk muddat | Yo'q — CRM-da yo'q | work_centers bor, ulanish tasdiqlanmadi |
| 61 | Mahsulot→stanok marshruti, muddat navbatdan | 2026-06-27 | TASDIQ-2146 §13 #61 | Marshrut moslik | Routing | Mahsulot-stanok mos | Yo'q — CRM-da yo'q | PP routing bo'lishi mumkin |
| 62 | Савдо рахбари=hamma, менежер=o'ziniki | 2026-06-27 | TASDIQ-2146 §13 #62 | Ko'rinish chegarasi | RBAC | Row-scope filtr | Qisman — @Roles farqlanadi | Row-scope filtr yo'q (EP-CRM-022/030) |
| 63 | Egasizlantirmaslik: N kun faolliksiz→reassign | 2026-06-27 | TASDIQ-2146 §13 #63 | Adolat | Reassign CRON | Egasizlantirish CRON | egasi-data — kod tasdiqlanmadi | N (30/60) egasidan |
| 64 | Menejer kunlik kg+summa boshliqqa | 2026-06-27 | TASDIQ-2146 §13 #64 | Kunlik hisob | Report | kg-asosli hisobot | Qisman — supervisor-dashboard summa | kg-asos tasdiqlanmadi |
| 65 | Yangi menejer mentor davri (RD-4) gate | 2026-06-27 | TASDIQ-2146 §13 #65 | Sinov nazorati | Mentor gate | Sinov bayroq+mentor tasdiq | Yo'q — CRM-da yo'q | HR sinov bo'lishi mumkin |
| 66 | Ommaviy eksport blok+ruxsat+log | 2026-06-27 | TASDIQ-2146 §13 #66 | Ma'lumot himoya | Export gate | Eksport-blok+log | Yo'q — export-controller yo'q | НО-2 qurilmagan |
| 67 | Kontakt ko'rish chegarasi (field-level) | 2026-06-27 | TASDIQ-2146 §13 #67 | Maxfiylik | Field RBAC | maskContact/hideContact | Yo'q — kod yo'q | Faqat rol-guard |
| 68 | CRM audit jurnali Инспекция ko'rinadi | 2026-06-27 | TASDIQ-2146 §13 #68 | Audit | Audit log | CRM ko'rish/eksport audit | Qisman — audit_log+crm_history jonli | Инспекция-panel filtri tasdiqlanmadi |
| 69 | Avans bayrog'i+foiz, avanssiz PP ga o'tmaydi | 2026-06-27 | TASDIQ-2146 §13 #69 | To'lov gate | Avans gate | Avans-bayroq+PP-blok | Yo'q — gate yo'q | To'lov 360 ko'rinadi, gate qurilmagan |
| 70 | Odatiy to'lov turi mijozda (naqd/o'tkazma/bartar) | 2026-06-27 | TASDIQ-2146 §13 #70 | To'lov profili | Customer field | To'lov-turi maydoni | Yo'q — sd_customers da yo'q | Saqlanmaydi |
| 71 | USD-bog'liq narx + kurs ogohlantirish | 2026-06-27 | TASDIQ-2146 §13 #71 | Valyuta xavfi | Narx | Multi-valyuta+kurs signal | Yo'q — yo'q | Qurilmagan |
| 72 | Brak/qaytarish kartada + sabab kodi | 2026-06-27 | TASDIQ-2146 §13 #72 | Ildiz sabab | 360 defect | Sabab-kod+QC event | Qisman — 360 complaints umumiy | Strukturali sabab-kod+QC tasdiqlanmadi |
| 73 | Ochiq reklamatsiya→yangi yuk ogohlantirish | 2026-06-27 | TASDIQ-2146 §13 #73 | Sifat gate | Reklamatsiya | Bayroq+blok/ogohlantirish | Yo'q — CRM-da yo'q | QC→CRM event tasdiqlanmadi |
| 74 | Kompensatsiya/chegirma tarixi+suiiste'mol flag | 2026-06-27 | TASDIQ-2146 §13 #74 | Suiiste'mol nazorati | Discount | Tarix+suiiste'mol bayroq | Yo'q — yo'q | Qurilmagan |
| 75 | Oylik диог mijoz kesimida (kg) | 2026-06-27 | TASDIQ-2146 §13 #75 | Boshqaruv ko'rinishi | Report | kg-kesim hisobot | Yo'q — cohort umumiy | kg-diog emas |
| 76 | Yillik hajm mijoz kesimida (top ro'yxat) | 2026-06-27 | TASDIQ-2146 §13 #76 | Strategik | Report | kg yillik top-mijoz | Qisman — RFM/CLV oborot top | kg-kesim tasdiqlanmadi |
| 77 | Buyurtma↔tayyor↔chiqarilgan real-vaqt kartada | 2026-06-27 | TASDIQ-2146 §13 #77 | Real-vaqt holat | 360 order | 3-holat MES/Ombor→CRM | Qisman — 360 orders status | kg 3-holat real-vaqt zanjiri tasdiqlanmadi |
| 78 | Mijoz ostida mahsulot liniyalari (narx/hajm/brak) | 2026-06-27 | TASDIQ-2146 §13 #78 | Ko'p-liniya | Product line | Per-liniya struktura | Yo'q — yo'q | crm_products umumiy katalog |
| 79 | STP/format versiya tarixi | 2026-06-27 | TASDIQ-2146 §13 #79 | Versiya izi | STP versiya | Versiyalash | egasi-data — kod yo'q, vision OCHIQ | Model egasidan/Dizayn bilan |
| 80 | Korp-raqam aloqa teglash (mijoz/shaxsiy) | 2026-06-27 | TASDIQ-2146 §13 #80 | Maxfiylik | Corp tag | Aloqa-teg | Yo'q — korp-raqam yo'q | EP-CRM-031 bilan bir |
| 81 | Import-bog'liqlik toifasi + ta'sirlangan mijoz | 2026-06-27 | TASDIQ-2146 §13 #81 | Proaktiv | Import risk | Toifa+SupplyImportIssueEvent | egasi-data — yo'q, vision OCHIQ | Manba egasidan (Ta'minot feed) |
| 82 | Mijoz ombor kirish talablari saqlash | 2026-06-27 | TASDIQ-2146 §13 #82 | Yetkazish | Logistika | Kirish-talab maydoni | Yo'q — tasdiqlanmadi | Logistika-bog'lanish qurilmagan |
| 83 | Kelishilgan o'rash/qadoqlash usuli kartada | 2026-06-27 | TASDIQ-2146 §13 #83 | Qadoqlash izi | Product field | O'rash-usul biriktirish | Yo'q — yo'q | Qurilmagan |
| 84 | Namuna/Академияга sotuvdan ajratish | 2026-06-27 | TASDIQ-2146 §13 #84 | Daromad ajratish | Order type | Namuna-turi ajratish | Yo'q — CRM-da yo'q | PP namuna-ustuvorlik tasdiqlanmadi |
| 85 | Mijoz↔mas'ul operator/usta tarixi | 2026-06-27 | TASDIQ-2146 §13 #85 | Sifat barqarorlik | PP reja | Operator-bog'lanish | egasi-data — yo'q, vision OCHIQ | Reja-qoidasi egasidan/PP bilan |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Voronka bosqich nomlarini kim belgilaydi (zavod) | 2026-06-27 | TASDIQ-2146 §13 #2 | crm_stages=0; aniq nomlar egasidan | CRM |
| Lead scoring mezon/vazn | 2026-06-27 | TASDIQ-2146 §13 #12 | per-tenant override egasidan | CRM |
| Segment nomlari/mezonlari | 2026-06-27 | TASDIQ-2146 §13 #18 | Aniq segment mezoni egasidan | CRM |
| Yutqazish sabab ro'yxati | 2026-06-27 | TASDIQ-2146 §13 #20 | Sabab ro'yxati egasidan | CRM |
| Qarz LIMIT qiymati + avto-blok | 2026-06-27 | TASDIQ-2146 §13 #24 | LIMIT + Finance bog'lanish egasidan | CRM/Finance |
| Telefoniya/ATS integratsiya | 2026-06-27 | TASDIQ-2146 §13 #28 | Provayder egasidan; kod yo'q | CRM |
| НО-2 korporativ raqam biriktirish/o'tkazish | 2026-06-27 | TASDIQ-2146 §13 #31 | corporate.number jadval yo'q | CRM |
| НО-2 abonent doirasi whitelist | 2026-06-27 | TASDIQ-2146 §13 #32 | Doira tekshiruv qurilmagan | CRM |
| НО-2 qo'ng'iroq nazorati Инспекция | 2026-06-27 | TASDIQ-2146 §13 #33 | Telefoniya yo'q | CRM |
| Korp TG/biznes-akkaunt egalik+o'tkazish | 2026-06-27 | TASDIQ-2146 §13 #35 | Korp-akkaunt kodi yo'q | CRM |
| Даромадлар debtor routing | 2026-06-27 | TASDIQ-2146 §13 #36 | Bo'lim qurilmagan | CRM/Finance |
| Даромадлар aloqa→360 bir tarix | 2026-06-27 | TASDIQ-2146 §13 #38 | Bo'lim qurilmagan | CRM |
| Папка№ buyurtma papkasi | 2026-06-27 | TASDIQ-2146 §13 #39 | Papka-raqamlash yo'q | CRM |
| Прошло дней avto hisoblagich | 2026-06-27 | TASDIQ-2146 §13 #40 | Папка tizimi yo'q | CRM |
| Mijoz qog'oz profili saqlash+pre-fill | 2026-06-27 | TASDIQ-2146 §13 #41 | Zavod-spets qurilmagan | CRM |
| Примечание papka-izoh→karta | 2026-06-27 | TASDIQ-2146 §13 #42 | Папка yo'q | CRM |
| ГП-kod takror-buyurtma tugmasi | 2026-06-27 | TASDIQ-2146 §13 #43 | Mexanizm qurilmagan | CRM |
| Mahsulot konstruksiya profili kartada | 2026-06-27 | TASDIQ-2146 §13 #44 | technology_cards bog'lanish yo'q | CRM/PP |
| Maket/logotip kutubxonasi (versiya) | 2026-06-27 | TASDIQ-2146 §13 #45 | Maket-versiya lib yo'q | CRM |
| ГП 3-imzo elektron blanka | 2026-06-27 | TASDIQ-2146 §13 #46 | CRM-da tasdiqlanmadi | CRM/SD |
| Haydovchi/transport 360 tarix | 2026-06-27 | TASDIQ-2146 §13 #48 | Logistika bog'lanish yo'q | CRM/Logistika |
| Razmer plan↔aslida qulf+flag | 2026-06-27 | TASDIQ-2146 §13 #49 | O'lcham-nazorat yo'q | CRM |
| Format o'zgarishi elektron rozilik | 2026-06-27 | TASDIQ-2146 §13 #50 | Rozilik ustunlari yo'q | CRM |
| Dizayn/o'lcham voronka bosqichi | 2026-06-27 | TASDIQ-2146 §13 #51 | Bosqich qurilmagan | CRM |
| Шошилмаслик PP gate-bayroq | 2026-06-27 | TASDIQ-2146 §13 #52 | Gate yo'q | CRM/PP |
| Чиқимли/чиқимсиз narx varianti | 2026-06-27 | TASDIQ-2146 §13 #56 | Chiqim-mantiq yo'q | CRM |
| Qog'oz narx→qayta-narx trigger% | 2026-06-27 | TASDIQ-2146 §13 #57 | Trigger% + feed egasidan | CRM/Ta'minot |
| Mijoz×format narx jadvali | 2026-06-27 | TASDIQ-2146 §13 #58 | Per-format narx yo'q | CRM |
| Muddat stanok yukidan avto | 2026-06-27 | TASDIQ-2146 §13 #60 | CRP bog'lanish yo'q | CRM/PP |
| Mahsulot→stanok marshruti | 2026-06-27 | TASDIQ-2146 §13 #61 | Marshrut moslik yo'q | CRM/PP |
| Egasizlantirish N kun reassign | 2026-06-27 | TASDIQ-2146 §13 #63 | N (30/60) egasidan; kod yo'q | CRM |
| Mentor davri (RD-4) bitim-gate | 2026-06-27 | TASDIQ-2146 §13 #65 | CRM-da gate yo'q | CRM/HR |
| Ommaviy eksport blok+ruxsat+log | 2026-06-27 | TASDIQ-2146 §13 #66 | Export-gate yo'q | CRM |
| Field-level kontakt yashirish | 2026-06-27 | TASDIQ-2146 §13 #67 | maskContact kodi yo'q | CRM |
| Avans bayrog'i+PP-blok gate | 2026-06-27 | TASDIQ-2146 §13 #69 | Gate yo'q | CRM |
| Odatiy to'lov turi maydoni | 2026-06-27 | TASDIQ-2146 §13 #70 | sd_customers da yo'q | CRM |
| USD-narx+kurs ogohlantirish | 2026-06-27 | TASDIQ-2146 §13 #71 | Multi-valyuta yo'q | CRM |
| Ochiq reklamatsiya→yangi yuk blok | 2026-06-27 | TASDIQ-2146 §13 #73 | QC→CRM event yo'q | CRM/QC |
| Kompensatsiya/chegirma tarix+suiiste'mol | 2026-06-27 | TASDIQ-2146 §13 #74 | Qurilmagan | CRM |
| Oylik диог kg mijoz kesimi | 2026-06-27 | TASDIQ-2146 §13 #75 | kg-diog yo'q | CRM |
| Mijoz ostida mahsulot liniyalari | 2026-06-27 | TASDIQ-2146 §13 #78 | Per-liniya struktura yo'q | CRM |
| STP/format versiya tarixi | 2026-06-27 | TASDIQ-2146 §13 #79 | Model egasidan/Dizayn bilan | CRM/Dizayn |
| Korp-raqam aloqa teglash | 2026-06-27 | TASDIQ-2146 §13 #80 | Korp-raqam yo'q | CRM |
| Import-bog'liqlik toifasi + event | 2026-06-27 | TASDIQ-2146 §13 #81 | Manba egasidan (Ta'minot feed) | CRM/Ta'minot |
| Mijoz ombor kirish talablari | 2026-06-27 | TASDIQ-2146 §13 #82 | Logistika-bog'lanish yo'q | CRM/Logistika |
| Kelishilgan o'rash/qadoqlash usuli | 2026-06-27 | TASDIQ-2146 §13 #83 | Qurilmagan | CRM |
| Namuna/Академияга daromaddan ajratish | 2026-06-27 | TASDIQ-2146 §13 #84 | PP namuna-ustuvorlik yo'q | CRM/PP |
| Mijoz↔operator/usta tarixi | 2026-06-27 | TASDIQ-2146 §13 #85 | Reja-qoidasi egasidan/PP bilan | CRM/PP |
