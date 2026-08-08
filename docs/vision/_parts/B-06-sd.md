## [B/TASDIQ] SD / Sotuv (06) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 06.1 | Buyurtma majburiy maydonlar (tur+o'lcham+tiraj+muddat+mijoz+narx) | 2026-06-27 | TASDIQ-2146 §06 #1 | Yarim buyurtma ishlab chiqarishga ketmasin | sales_orders/sales_order_items | O'lcham L×W×H item'da majburiy bo'lsin | Qisman — sales_order_items | O'lcham faqat PriceCalcInput'da, DB-majburiylik to'liq emas |
| 06.2 | Mahsulot turlari qattiq ro'yxati (~15 tur) | 2026-06-27 | TASDIQ-2146 §06 #2 | Toifali hisobot uchun katalog | product katalog jadvali | ~15 toifali strukturalangan katalog | Yo'q — erkin matn description | paperType enum bor, katalog jadvali topilmadi |
| 06.3 | O'lcham U×K×B → avto yuza (m²) + priklad % | 2026-06-27 | TASDIQ-2146 §06 #3 | Zagotovka avto hisoblanadi | sd-quotations.service.ts:84-87 | Priklad/qoldiq % qo'shilsin | egasi-data | RSC blank REAL; priklad % egasidan (GLUE_FLAP=40mm) |
| 06.4 | Tiraj birligi mahsulot turiga qarab (dona/m²/list) | 2026-06-27 | TASDIQ-2146 §06 #4 | Birlik aralashsa narx/ombor xato | sales_order_items.unit | Turdan avto birlik tanlash | Qisman | unit ustuni bor; avto-tanlash mexanizmi yo'q |
| 06.5 | Muddat: mijoz-so'ragan + zavod-va'dasi ikki sana | 2026-06-27 | TASDIQ-2146 §06 #5 | Kechikish tahlili uchun | sales_orders (delivery/requested) | Zavod-va'dasi CRP-quvvatdan | Qisman | Ikki sana bor; CRP ulanish isbotlanmadi |
| 06.6 | MOQ + kichik-partiya ustamasi | 2026-06-27 | TASDIQ-2146 §06 #6 | Kam tirajga ustama avto | narx-dvigatel (calculatePrice) | MOQ-tekshiruv + ustama logikasi | Yo'q | grep MOQ/moq → topilmadi |
| 06.7 | Narx formulasi har komponent ko'rinadi | 2026-06-27 | TASDIQ-2146 §06 #7 | To'liq shaffof kalkulyatsiya | sd-quotations.service.ts:73-125 | — (mavjud) | Ha — :73-125 | paper+print+die+prod+delivery→markup→VAT; seed bor |
| 06.8 | Qog'oz narxi ombor FIFO/o'rtacha tannarxdan | 2026-06-27 | TASDIQ-2146 §06 #8 | Real tannarx | narx-dvigatel ↔ warehouse_stock | FIFO avto-ulanish | Qisman | sd_price_formulas config; warehouse FIFO ulanmagan |
| 06.9 | Bo'yoq (rang×qoplama%×yuza) hisobi | 2026-06-27 | TASDIQ-2146 §06 #9 | Real bo'yoq sarfi | sd-quotations.service.ts:97-100 | Qoplama% (zalivka) qo'shilsin | Qisman | Rang soni bor; qoplama% formulada yo'q |
| 06.10 | Ish haqi marshrut tariflaridan yig'iladi | 2026-06-27 | TASDIQ-2146 §06 #10 | PP/sdelka bilan ulanish | sd-quotations.service.ts:106-107 | Marshrut-operatsiyalarga ajratish | Qisman | Bitta umumiy soat-tarif; PP ulanmagan |
| 06.11 | Qo'shimcha operatsiyalar alohida qator+tarif | 2026-06-27 | TASDIQ-2146 §06 #11 | Har qo'shimcha o'z tarifi | calculatePrice / sd_price_formulas | Tariflar formulaga ulansin | Qisman | lamination/embossing ustun bor; formulaga qo'shilmaydi |
| 06.12 | Klishe/shtamp alohida, mijoz to'laydi, takrorda olinmaydi | 2026-06-27 | TASDIQ-2146 §06 #12 | Bir martalik xarajat | sd-quotations.service.ts:103 | Egalik+muddat qo'shilsin | egasi-data | dieCost new/existing REAL; egalik+muddat egasidan |
| 06.13 | Narx pog'onasi (tiraj oshsa dona narx pasayadi) | 2026-06-27 | TASDIQ-2146 §06 #13 | Tirajga qarab avto narx | calculatePrice | Tiraj-narx pog'ona jadvali | Yo'q | BULK_DISCOUNT eslatilgan, logika yo'q |
| 06.14 | Chegirma turlari ro'yxati, har biri foiz limiti | 2026-06-27 | TASDIQ-2146 §06 #14 | Turlarga alohida limit | sd_customers.discount_rate | Tur-bo'yicha chegirma logikasi | Yo'q | Bitta umumiy discount_rate; tur ajratish yo'q |
| 06.15 | Chegirmalar jamlanish shifti (~15% maks) | 2026-06-27 | TASDIQ-2146 §06 #15 | Umumiy chegirma bloklansin | sd-quotations.repository.ts | Discount-cap tekshiruvi | Yo'q | checkDiscountCap grep topilmadi |
| 06.16 | Chegirmaga pog'onali ruxsat (0-5/5-10/10%+) | 2026-06-27 | TASDIQ-2146 §06 #16 | Karta-model RBAC eskalatsiya | approveQuotation @Roles | Foizga bog'liq avto-eskalatsiya | Qisman | RBAC bor; foizga-bog'liq eskalatsiya yo'q |
| 06.17 | Narx floor (tannarxdan past bloklanadi) | 2026-06-27 | TASDIQ-2146 §06 #17 | Zararga sotmaslik | calculatePrice | Min-marja floor-blok | Yo'q | margin qaytaradi; floor-blok yo'q |
| 06.18 | Mijoz ABC toifasi (80/15/5) avto | 2026-06-27 | TASDIQ-2146 §06 #18 | Yillik hajm bo'yicha avto | customer-abc.service.ts | — (mavjud) | Ha — computeAbc | Pareto REAL; to'lov-intizom tuzatma yo'q |
| 06.19 | Toifaga bog'liq imtiyoz-paket avto | 2026-06-27 | TASDIQ-2146 §06 #19 | Toifa = standart paket | sd_customers (limit/discount/terms) | Avto paket-qo'llash | egasi-data | Ustunlar bor; paket-qiymatlar egasidan |
| 06.20 | Kotirovka (KP) hujjat, raqam, PDF, convert | 2026-06-27 | TASDIQ-2146 §06 #20 | Alohida versiyalangan hujjat | sd_quotations / :161 | PDF generatsiya | Qisman | createQuotation/convert REAL; PDF yo'q, data=0 |
| 06.21 | Kotirovka amal muddati (14 kun) → muddati o'tgan | 2026-06-27 | TASDIQ-2146 §06 #21 | Eskirgan taklif belgilanadi | sd_quotations.valid_until | Avto status + narx-qayta-hisob | Qisman | valid_until bor; avto-cron yo'q |
| 06.22 | Kotirovka status zanjiri + har o'tishda sana | 2026-06-27 | TASDIQ-2146 §06 #22 | Aniq holat kuzatuvi | sd-quotations.service.ts:179-191 | To'liq 6-bosqich zanjir | Qisman | sent/approved REAL; ko'rilmoqda/rad/muddat to'liq emas |
| 06.23 | Kotirovka→Buyurtma aylantirish tugmasi | 2026-06-27 | TASDIQ-2146 §06 #23 | Bir tugma, ma'lumot ko'chadi | sd-quotations.service.ts:161 | — (mavjud) | Ha — convertToOrder | @Post convert; converted_to_order_id bor |
| 06.24 | Buyurtma statuslari zavod Rus statuslari | 2026-06-27 | TASDIQ-2146 §06 #24 | Xodim tushunadigan status | orders.constants.ts | Rus statuslar (Ожд.Сырьё...) | Qisman | Status-mashina inglizcha, vizyondan farq |
| 06.25 | IChga o'tkazish sharti (to'lov%+maket+limit OK) | 2026-06-27 | TASDIQ-2146 §06 #25 | Hamma yashil bo'lsa o'tadi | update-order-status.handler.ts:40-52 | Maket+limit gate birlashsin | Qisman | Avans-gate REAL; maket/limit gate isbotlanmadi |
| 06.26 | Maket/dizayn tasdig'i majburiy (imzo saqlanadi) | 2026-06-27 | TASDIQ-2146 §06 #26 | Mijoz tasdig'i saqlanadi | sales_orders.design/sample_flag | Avto bloklovchi darvoza | Qisman | Bayroq bor; bloklovchi gate yo'q |
| 06.27 | Shartnoma turlari (bir martalik/ramochnyy/spets) | 2026-06-27 | TASDIQ-2146 §06 #27 | Ikki daraja: bosh+spets | sd_contracts.template_type | Ikki-darajali struktura | Qisman | template_type bor; ikki-daraja modellanmagan, data=0 |
| 06.28 | Shartnoma strukturalangan shartlar (to'lov/jarima/penya) | 2026-06-27 | TASDIQ-2146 §06 #28 | Buyurtmaga avto tushadi | sd_contracts ustunlari | To'lov/valyuta/jarima maydonlari | Yo'q | Strukturalangan maydonlar yo'q, null'ga map |
| 06.29 | To'lov sharti turlari (100%/50-50/N kun/konsignatsiya) | 2026-06-27 | TASDIQ-2146 §06 #29 | Har biriga standart otsrochka | sales_orders.payment_terms | Qattiq enum/lookup | Qisman | Ustunlar bor; erkin matn, enum yo'q |
| 06.30 | Debitor limiti mijozga (oshsa bloklanadi) | 2026-06-27 | TASDIQ-2146 §06 #30 | Qarz nazorati | drizzle-sd-customers.repo.ts:72 | Limit qiymatlari + auto-blok | egasi-data | getCreditStatus REAL; qiymat egasidan, flag→direktor |
| 06.31 | Limit oshganda direktor tasdig'i bilan ochiladi | 2026-06-27 | TASDIQ-2146 §06 #31 | Sabab yozib ochiladi | repo:88 + advance_bypass_by | Aniq tasdiq-oqim | egasi-data | flag matni bor; oqim egasidan |
| 06.32 | Prosrochka → yangi buyurtma avto-tasdiqqa | 2026-06-27 | TASDIQ-2146 §06 #32 | Avto bayroq | sd_customers.open_debt/aging | Prosrochka→gate mexanizmi | Qisman | Aging ko'rsatkich bor, gate yo'q |
| 06.33 | Qayta buyurtma tugmasi (o'lcham/dizayn/shtamp ko'chadi) | 2026-06-27 | TASDIQ-2146 §06 #33 | Eskidan nusxa, tiraj yangilanadi | 360-view / convertToOrder | Nusxa-endpoint | Qisman | Tarix bor; nusxa-tugma topilmadi |
| 06.34 | Takrorda narx avto-qayta, eski narx yonida | 2026-06-27 | TASDIQ-2146 §06 #34 | Farq ko'rinadi | calculatePrice | Eski↔yangi solishtirish | Qisman | Avto-hisob bor; solishtirish yo'q |
| 06.35 | Mijoz kartasida mahsulot/dizayn arxivi | 2026-06-27 | TASDIQ-2146 §06 #35 | O'lcham/dizayn/shtamp/oxirgi narx | get360View / repo:92 | Mahsulot-arxiv jadvali | Qisman | 360-view bor; dizayn-arxiv strukturasi yo'q |
| 06.36 | Bir buyurtmada ko'p mahsulot (ko'p qator) | 2026-06-27 | TASDIQ-2146 §06 #36 | Har qator o'z narxi/muddati | sales_order_items | — (mavjud) | Ha | order 56 = 2 item REAL |
| 06.37 | Qisman yetkazish + qisman to'lov | 2026-06-27 | TASDIQ-2146 §06 #37 | Har partiyaga faktura/qabul | deliveries / sales_order_items | Ko'p-yetkazma zanjiri | Qisman | Ustunlar REAL; deliveries data minimal |
| 06.38 | Ortiqcha/kam ICh (+/-N%), faktura real chiqimdan | 2026-06-27 | TASDIQ-2146 §06 #38 | Real miqdordan hisob | sales_order_items.confirmed_qty | +/-N% og'ish qoidasi | Yo'q | confirmed/delivered bor; og'ish-qoida yo'q, N% egasidan |
| 06.39 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | 2026-06-27 | TASDIQ-2146 §06 #39 | Bosqichli jarima | cancelOrder :240 | order_cancellation_rules | Qisman | Bekor REAL; jarima-foiz yo'q, foiz egasidan |
| 06.40 | Sotuv KPI (hajm/bitim/o'rtacha/debitor/aging) | 2026-06-27 | TASDIQ-2146 §06 #40 | ShVB YO'NALISH 26 | sd-dashboard.service.ts | Haftalik + leaderboard | Qisman | getOverview/getQuotaStats REAL; haftalik to'liq emas |
| 06.41 | Lead voronka (lead→kotirovka→buyurtma) | 2026-06-27 | TASDIQ-2146 §06 #41 | Konversiya % ko'rinadi | sd-leads.controller.ts | To'liq voronka data | Qisman | CRUD REAL; sd_lead_activities=0, data minimal |
| 06.42 | Sotuvchi biriktiriladi + bonus marjadan | 2026-06-27 | TASDIQ-2146 §06 #42 | Chegirma bersa bonus kamayadi | sales_orders.assigned_to | Bonus=marjadan payroll ulanish | Qisman | Biriktirish REAL; bonus-logika topilmadi |
| 06.43 | Tasdiqlangan buyurtma avto PP'ga (oltin-ip) | 2026-06-27 | TASDIQ-2146 §06 #43 | Bir xil oltin-ip ID | update-order-status.handler.ts:72-110 | — (mavjud) | Ha | Atomik outbox sd.order.status_changed REAL |
| 06.44 | To'lov tasdiqlangach avto GL, debitor kamayadi | 2026-06-27 | TASDIQ-2146 §06 #44 | To'lov→GL avto DR/CR | sd-quotations.service.ts:247-261 | — (mavjud) | Ha | markPaymentPaid→postCustomerPayment REAL |
| 06.45 | Mijoz kartasi rekvizitlari (INN/bank/toifa/limit) | 2026-06-27 | TASDIQ-2146 §06 #45 | Faktura avto-to'ladi | sd_customers | — (mavjud) | Ha | To'liq rekvizit REAL, 15 qator data |
| 06.46 | Mijoz unikalligi (INN/telefon dublikat) | 2026-06-27 | TASDIQ-2146 §06 #46 | Dublikat ogohlantiradi | sd-customers.service.ts | Avto-dublikat tekshiruv | Qisman | Maydonlar bor; tekshiruv-logika isbotlanmadi |
| 06.47 | Narx/tiraj/muddat o'zgarish jurnali | 2026-06-27 | TASDIQ-2146 §06 #47 | Kim/qachon/eski→yangi | sd-quotations.service.ts:193-216 | — (mavjud) | Ha | updateQuotation versiya+getRevisions REAL |
| 06.48 | Karta-model RBAC (menejer/rahbar/direktor) | 2026-06-27 | TASDIQ-2146 §06 #48 | Tannarx faqat rahbar+ | Kontrollerlar @Roles | Row-scope + margin-mask | Qisman | Rol-guard bor; row-scope/margin-mask isbotlanmadi |
| 06.49 | Statuslar zavod real Rus ro'yxati | 2026-06-27 | TASDIQ-2146 §06 #49 | Xodim tushunadi | orders.constants.ts | Rus status enum | Yo'q | Ingliz machine-kodlar; Ojd.Syryo yo'q |
| 06.50 | Ojd.Syryo → Ta'minotga material signal | 2026-06-27 | TASDIQ-2146 §06 #50 | Uzilish yopiladi | SD ↔ MaterialRequiredEvent | Status + signal event | Yo'q | grep=0; status enum ham yo'q |
| 06.51 | Bosma yo'nalishi Ofset/Flekso (+AI tavsiya) | 2026-06-27 | TASDIQ-2146 §06 #51 | Sex+narx+muddatni belgilaydi | sales_orders/sd_quotation_items | napravlenie ustun+AI | Yo'q | Ustun yo'q; design-schema flexo boshqa kontekst |
| 06.52 | Mashina formati (72/52SM/KVA) tavsiya+narx | 2026-06-27 | TASDIQ-2146 §06 #52 | To'g'ri mashina=to'g'ri narx | SD kod/jadval | Format modeli+narx-farq | Yo'q | grep=0; CRP ulanish yo'q |
| 06.53 | Birlik (list/sht/m2) turdan avto | 2026-06-27 | TASDIQ-2146 §06 #53 | Birlik aralashsa xato | sales_order_items.unit | unit_conversion_rules | Qisman | unit erkin; avto-tanlash/jadval yo'q |
| 06.54 | Material kimniki — davalcheskoe belgisi | 2026-06-27 | TASDIQ-2146 §06 #54 | Mijoz materiali narxdan chiqsin | sales_orders/sd_quotation_items | material_owner ustuni | Yo'q | Ustun yo'q; crm ownerType boshqa ma'no |
| 06.55 | Mijoz fayllari (maket/trafaret) buyurtmaga | 2026-06-27 | TASDIQ-2146 §06 #55 | Dizayn-byuro faylsiz boshlamaydi | sd_customer_documents / ow_order_samples | Buyurtma-fayl jadvali | Qisman | Mijoz-darajasi bor; buyurtma-fayl ulanmagan |
| 06.56 | Buyurtma tasdig'idan TZ avto KB/DB ga (event) | 2026-06-27 | TASDIQ-2146 §06 #56 | Qo'l-topshiriq yo'qotadi | ow_tech_cards / sales_orders.tech_card_approved | Avto-event/listener | Qisman | Struktura bor (0 qator); event grep=0 |
| 06.57 | Gruzopodyomnost (kg) → gofra qatlam AI tavsiya | 2026-06-27 | TASDIQ-2146 §06 #57 | Konstruksiyani belgilaydi | sales_orders/sd_quotation_items | load_capacity + AI | Yo'q | Ustun yo'q; AI tavsiya yo'q |
| 06.58 | KP avto-PDF (logo+narx+to'lov+imzo) | 2026-06-27 | TASDIQ-2146 §06 #58 | Word qo'lda vaqt/xato | sd-quotations.controller.ts | PDF render endpoint | Yo'q | send/convert/approve bor; PDF yo'q |
| 06.59 | Kotirovka imzosi (komdir ism+tel) karta-modeldan avto | 2026-06-27 | TASDIQ-2146 §06 #59 | Rasmiy taklifda kontakt | sd_quotations | Avto-imzo/kontakt | Yo'q | signed_by/komdir ustun yo'q; PDF ham yo'q |
| 06.60 | KP yuborish huquqi faqat komdir/rahbar | 2026-06-27 | TASDIQ-2146 §06 #60 | Nazorat yo'qolmasin | sd-quotations.controller.ts approve | Rol-gate (komdir-only) | Qisman | approve endpoint bor; @Roles ko'rinmaydi |
| 06.61 | Debitor 'Daromadlar bo'limi' alohida rol | 2026-06-27 | TASDIQ-2146 §06 #61 | Qarz undirish alohida mas'ul | sd_customers.open_debt | debt-collector roli+biriktirish | Yo'q | Ko'rsatkich bor; rol-ajratish yo'q |
| 06.62 | Korporativ raqamdan aloqa + qo'ng'iroq jurnali (NO-2) | 2026-06-27 | TASDIQ-2146 §06 #62 | Mijoz kompaniyaniki | sd_customer_interactions | NO-2 telefon integratsiya | Qisman | interactions REAL; korporativ-raqam integratsiya yo'q |
| 06.63 | Menejer ketsa mijoz avto qayta biriktiriladi | 2026-06-27 | TASDIQ-2146 §06 #63 | Mijoz egasiz qolmasin | EmployeeDeactivated listener | Reassign event | Yo'q | manager_id bor; avto-o'tkazish hodisa yo'q |
| 06.64 | Lead bosqichi + konversiya % | 2026-06-27 | TASDIQ-2146 §06 #64 | Yutqazilgan leadlar ko'rinadi | sd-leads.controller / sd_lead_activities | To'liq oltin-ip konversiya | Qisman | Struktura bor; konversiya hisobi yuza |
| 06.65 | Mavsumiy mahsulot signal + o'tgan yil mijoz | 2026-06-27 | TASDIQ-2146 §06 #65 | Mavsum yutilmasin | SD cron/seasonal | Seasonal signal | Yo'q | grep=0; katalog ham yo'q |
| 06.66 | Mahsulot katalogi ~15 toifaga moslansin | 2026-06-27 | TASDIQ-2146 §06 #66 | Toifali hisobot ishlasin | product katalog jadvali | ~15 toifali lookup | Yo'q | product_type erkin matn; katalog yo'q |
| 06.67 | Stakan/pizza maxsus o'lcham shabloni | 2026-06-27 | TASDIQ-2146 §06 #67 | ml/diametr standartlari | sd_quotation_items | Tur-specifik shablon | Yo'q | Faqat L/W/H; ml/diametr yo'q |
| 06.68 | Rulonnye samokleyki rulon parametrlari | 2026-06-27 | TASDIQ-2146 §06 #68 | Gilza/rulon-dona kerak | sd_quotation_items | Rulon parametr ustunlari | Yo'q | grep=0; roll-belgisi yo'q |
| 06.69 | Summa/Ostalos (Jami/To'langan/Qoldiq) avto | 2026-06-27 | TASDIQ-2146 §06 #69 | Qoldiq=debitor real-vaqt | sales_orders | — (mavjud) | Ha | total/paid/balance/advance ustunlar REAL |
| 06.70 | Va'da sanasi ICh quvvatidan tasdiqlansin | 2026-06-27 | TASDIQ-2146 §06 #70 | Bajariladigan va'da | sales_orders + atp-check | CRP/MPS eng-erta sana | Qisman | atp-check bor; CRP-hisob to'liq emas |
| 06.71 | Va'da↔real → kechikish kuni+sababi | 2026-06-27 | TASDIQ-2146 §06 #71 | 'Muddatda bajarish %' KPI | requested/delivery_date | delay_risk + sabab qayd | Qisman | Ma'lumot bor; hisob-mantiq grep=0 |
| 06.72 | Upakovka turi (stepler/pallet/veryovka)→vaqt+material | 2026-06-27 | TASDIQ-2146 §06 #72 | O'rash ish-vaqti belgilaydi | sales_orders/sd_quotation_items | packaging_type ustuni | Yo'q | ow_packaging_records MES-darajasi, SD ulanmagan |
| 06.73 | Palletda dona soni + pallet o'lchami | 2026-06-27 | TASDIQ-2146 §06 #73 | Logistika (necha pallet/mashina) | sales_orders/sd_quotation_items | pallet_qty/size ustunlari | Yo'q | Ustun yo'q; ow_pallet_recoveries boshqa |
| 06.74 | Klishe/forma egaligi + arxiv muddati (3 yil) | 2026-06-27 | TASDIQ-2146 §06 #74 | Nizo oldi olinadi | ow_molds | Egalik+muddat ustunlari | egasi-data | Struktura bor (0 qator); egalik+muddat egasidan |
| 06.75 | Buyurtma rentabelligi real-vaqt, margin<X qizil | 2026-06-27 | TASDIQ-2146 §06 #75 | Zararga sotmasin | calculatePrice / cost_price | margin<floor qizil-blok | Qisman | Hisob bor; qizil-ogohlantirish/floor yo'q |
| 06.76 | Tannarx/margin RBAC (faqat rahbar+ ko'radi) | 2026-06-27 | TASDIQ-2146 §06 #76 | Tannarx sir himoyasi | calculatePrice / SdOrderProjection | forRole margin-mask | Qisman | cost/margin qaytadi; rol-mask grep=0 |
| 06.77 | To'lov sharti shabloni (50%+5kun; 100%; N kun) | 2026-06-27 | TASDIQ-2146 §06 #77 | Debitor sanog'i avtomatlashadi | sales_orders.payment_terms | Shablon lookup/enum | Qisman | Erkin saqlash; shablon-ro'yxat yo'q |
| 06.78 | Otgruzka+5 kun→qoldiq muddati avto+ogohlantirish | 2026-06-27 | TASDIQ-2146 §06 #78 | Postoplata otgruzkadan | sales_orders.balance_due_date | OrderShipped listener + cron | Qisman | Ustun bor; listener/cron yo'q |
| 06.79 | 100% avans → 5% chegirma avto | 2026-06-27 | TASDIQ-2146 §06 #79 | Siyosat har doim bajariladi | application/sd | advance=100→discount logika | Yo'q | advance_percent bor; bog'lanish grep=0 |
| 06.80 | Narx NDS'siz saqlanib QQS alohida qatorda | 2026-06-27 | TASDIQ-2146 §06 #80 | Taklif↔faktura mos | calculatePrice / tax_amount | tax_rates + QQS-to'lovchi belgi | Qisman | vatRate(12) bor; tax_rates jadval yo'q |
| 06.81 | Buyurtma o'zgartirish jurnali (tiraj/muddat/narx) | 2026-06-27 | TASDIQ-2146 §06 #81 | Nizoni hal qilish | sd_order_timeline / revisions | Field-level eski→yangi diff | Qisman | Status-darajasi bor; qiymat-diff emas |
| 06.82 | Maket tasdig'idan keyingina bosma — majburiy gate | 2026-06-27 | TASDIQ-2146 §06 #82 | Brak himoyasi | sales_orders (design/tech gate) | Hard-gate + mijoz-imzo | Qisman | Gate strukturasi bor; hard-blok yuza |
| 06.83 | Reklamatsiya buyurtma+sex/uchastka+sabab kodi | 2026-06-27 | TASDIQ-2146 §06 #83 | Brak ildiz-sababi ko'rinadi | sd_customer_complaints | Sex+sabab-kod + QC-event | Qisman | complaints REAL; granular bog'lanish/QC yo'q |
| 06.84 | Yangi vs takror mijoz har xil oqim | 2026-06-27 | TASDIQ-2146 §06 #84 | Takrordan qayta so'ramaslik | convert-to-order | Ikki alohida oqim | Yo'q | Ikki-oqim/nusxa-tugma yo'q |
| 06.85 | Faollik segmenti + ABC ikki o'lcham | 2026-06-27 | TASDIQ-2146 §06 #85 | Nofaolga kampaniya, Doimiyga sodiqlik | sd_customers.abc/segment | Avto faollik-segment cron | Qisman | ABC+segment ustun bor; avto-segment yuza |
| 06.86 | Buyurtma ID=oltin-ip, har bosqich shu ID ga | 2026-06-27 | TASDIQ-2146 §06 #86 | 'Buyurtmam qayerda' yagona javob | sales_orders.id + FK'lar | To'liq event-driven zanjir | Qisman | FK struktura tayyor; event-oqim yuza/uzuq |
| 06.87 | Yetkazish fakti (haydovchi+mashina+vaqt) qayd | 2026-06-27 | TASDIQ-2146 §06 #87 | Isbot + postoplata sanog'i | deliveries / repo:55 | — (mavjud) | Ha | driver/vehicle/delivered_at REAL INSERT, 1 qator |
| 06.88 | Kongrev va tisnenie ALOHIDA operatsiya | 2026-06-27 | TASDIQ-2146 §06 #88 | Har xil jihoz/forma/narx | sd_quotation_items | Ikki alohida ustun+tarif | Yo'q | grep=0; bitta embossing_price umumiy |
| 06.89 | Tisnenie rangi zoloto/serebro → ombor folga | 2026-06-27 | TASDIQ-2146 §06 #89 | Noto'g'ri folga to'xtatadi | SD kod / ombor folga | folga_color + ombor bog'lanish | Yo'q | grep=0 |
| 06.90 | Laminatsiya turi (glyants/mat/metal) ro'yxatdan | 2026-06-27 | TASDIQ-2146 §06 #90 | Har xil rulon/narx | sd_quotation_items.lamination | Tur enum/lookup | Yo'q | lamination boolean/erkin; tur yo'q |
| 06.91 | Lak turi (sploshnoy/trafaret/VD) + qoplama % | 2026-06-27 | TASDIQ-2146 §06 #91 | Har xil sarf/narx/jihoz | sd_quotation_items.special_coating | Lak-turi + coverage% | Yo'q | grep lak=0; bitta umumiy belgi |
| 06.92 | Kashirovka (offset+gofra) alohida operatsiya+narx | 2026-06-27 | TASDIQ-2146 §06 #92 | Alohida jihoz/vaqt | sd_quotation_items | Kashirovka belgisi+marshrut | Yo'q | grep=0 |
| 06.93 | Vysechka turi (avtotigel/rotatsion/plotter) | 2026-06-27 | TASDIQ-2146 §06 #93 | Usul tiraj+narxni belgilaydi | sd_quotation_items | die_cut_method lookup | Yo'q | is_new_die boolean bor, usul yo'q |
| 06.94 | Skleyka turi (avtomat/ruchnaya/FSM)→vaqt+narx | 2026-06-27 | TASDIQ-2146 §06 #94 | Usul narxni keskin o'zgartiradi | SD kod / sdelka-tarif | Skleyka-tur ustuni+tarif | Yo'q | grep=0 |
| 06.95 | Bez oborota/s oborotom (bir/ikki tomon) 2x | 2026-06-27 | TASDIQ-2146 §06 #95 | Ikki tomon=2x bo'yoq/mashina | calculatePrice | print_sides + 2x mantiq | Yo'q | grep=0; bir-tomonlama hisob |
| 06.96 | 3-makro/3-mikro gofra turi (lug'atdan) | 2026-06-27 | TASDIQ-2146 §06 #96 | Har xil flute/his/narx | sd_quotation_items | Makro/mikro turi | Yo'q | grep=0 |
| 06.97 | Gofroyashik qatlami (2/3/5-sloy) + AI yuk | 2026-06-27 | TASDIQ-2146 §06 #97 | Qatlam mustahkamlik+narx | sd_quotation_items.thickness_mm | layer_count + AI | Yo'q | thickness mm bor, qatlam-soni emas |
| 06.98 | Banderol alohida pozitsiya | 2026-06-27 | TASDIQ-2146 §06 #98 | Alohida bosma+qirqim+o'rov | SD kod | Banderol element | Yo'q | grep=0 |
| 06.99 | Latok standart SKU katalogi (Latok-449...) | 2026-06-27 | TASDIQ-2146 §06 #99 | SKU tanlansa spets avto=1 klik | SD kod/seed | Nomli SKU katalog | Yo'q | grep=0; erkin matn |
| 06.100 | 'Tex opisanie po bumagam' avto-matn | 2026-06-27 | TASDIQ-2146 §06 #100 | Izchil taklif, xato kamayadi | SD kod | Maydonlardan avto-matn | Yo'q | grep=0; manba ustunlar yo'q |
| 06.101 | Marka T22/profil S markaziy lug'atdan | 2026-06-27 | TASDIQ-2146 §06 #101 | Erkin matn tarqalmasin | SD/material reestri | Marka/profil lookup | Yo'q | grep=0 |
| 06.102 | Plyonka qalinligi (30/100 mkr) ro'yxatdan | 2026-06-27 | TASDIQ-2146 §06 #102 | Narx+ombor to'g'ri | SD kod | film_thickness lookup | Yo'q | grep=0 |
| 06.103 | 'Papka No' buyurtmaga bog'lansin (UNIQUE) | 2026-06-27 | TASDIQ-2146 §06 #103 | Jismoniy hujjat tez topiladi | sd_contracts.papka_no | sales_orders.folder_number+UNIQUE | Qisman | Shartnoma-darajasi bor; sales_orders'da yo'q |
| 06.104 | 'Zakaz 1S' eski raqamni ixtiyoriy saqlash | 2026-06-27 | TASDIQ-2146 §06 #104 | Migratsiya ko'prigi | sales_orders | order_1c ustuni | Yo'q | Ustun yo'q; crm_company_id boshqa |
| 06.105 | Qisman yetkazish + qisman faktura | 2026-06-27 | TASDIQ-2146 §06 #105 | Har partiyaga alohida faktura | deliveries / sd_invoices | invoice_type=partial + avto-GL | Qisman | Struktura bor; avto-faktura GL to'liq emas |
| 06.106 | Hisob-faktura raqami avto ketma-ketlik | 2026-06-27 | TASDIQ-2146 §06 #106 | Race-condition yo'q, audit | invoice_number_seq | Sequence-dan generatsiya | Qisman | SEQUENCE bor; service-ishlatish to'liq tasdiqlanmagan |
| 06.107 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | 2026-06-27 | TASDIQ-2146 §06 #107 | Zavod xarajatni qoplaydi | cancelOrder :240 | order_cancellation_rules | Yo'q | Faqat status='cancelled'; jarima yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| O'lcham→yuza priklad/qoldiq % | 2026-06-27 | TASDIQ-2146 §06 #3 | Priklad % egasidan kutiladi (GLUE_FLAP=40mm bor) | SD |
| MOQ + kichik-partiya ustamasi | 2026-06-27 | TASDIQ-2146 §06 #6 | Logika yo'q; MOQ qiymatlar egasidan | SD |
| Klishe/shtamp egalik+muddat | 2026-06-27 | TASDIQ-2146 §06 #12 | Egalik (mijoz/zavod)+muddat egasidan | SD |
| Narx pog'onasi (tiraj-narx) | 2026-06-27 | TASDIQ-2146 §06 #13 | Bulk-discount logika qurilmagan | SD |
| Chegirma turlari + limitlar | 2026-06-27 | TASDIQ-2146 §06 #14 | Tur-bo'yicha mexanizm yo'q | SD |
| Chegirma jamlanish shifti (~15%) | 2026-06-27 | TASDIQ-2146 §06 #15 | Discount-cap logika yo'q; foiz egasidan | SD |
| Narx floor (tannarxdan past blok) | 2026-06-27 | TASDIQ-2146 §06 #17 | Floor-blok qurilmagan | SD |
| Toifaga bog'liq imtiyoz-paket | 2026-06-27 | TASDIQ-2146 §06 #19 | Paket-qiymatlari egasidan | SD |
| Shartnoma strukturalangan shartlar | 2026-06-27 | TASDIQ-2146 §06 #28 | To'lov/valyuta/jarima maydonlari yo'q | SD |
| Debitor limiti (qiymat) | 2026-06-27 | TASDIQ-2146 §06 #30 | Limit qiymatlari egasidan | SD |
| Limit oshganda tasdiq-oqim | 2026-06-27 | TASDIQ-2146 §06 #31 | Aniq oqim egasidan | SD |
| Ortiqcha/kam ICh +/-N% og'ish | 2026-06-27 | TASDIQ-2146 §06 #38 | Og'ish-qoida yo'q; N% egasidan | SD |
| Statuslar zavod Rus ro'yxati | 2026-06-27 | TASDIQ-2146 §06 #49 | Ingliz machine-kodlar, vizyondan farq | SD |
| Ojd.Syryo→Ta'minot signal | 2026-06-27 | TASDIQ-2146 §06 #50 | Status+event qurilmagan | SD |
| Bosma yo'nalishi Ofset/Flekso+AI | 2026-06-27 | TASDIQ-2146 §06 #51 | napravlenie ustun+AI yo'q | SD |
| Mashina formati (72/52/KVA) tavsiya | 2026-06-27 | TASDIQ-2146 §06 #52 | Format modeli yo'q | SD |
| Material davalcheskoe belgisi | 2026-06-27 | TASDIQ-2146 §06 #54 | material_owner ustun yo'q | SD |
| Gruzopodyomnost→gofra AI tavsiya | 2026-06-27 | TASDIQ-2146 §06 #57 | load_capacity+AI yo'q | SD |
| KP avto-PDF | 2026-06-27 | TASDIQ-2146 §06 #58 | PDF render endpoint yo'q | SD |
| Kotirovka imzo (komdir) avto | 2026-06-27 | TASDIQ-2146 §06 #59 | signed_by yo'q; PDF ham yo'q | SD |
| Debitor 'Daromadlar bo'limi' rol | 2026-06-27 | TASDIQ-2146 §06 #61 | debt-collector rol-ajratish yo'q | SD |
| Menejer ketsa avto reassign | 2026-06-27 | TASDIQ-2146 §06 #63 | EmployeeDeactivated listener yo'q | SD |
| Mavsumiy signal + o'tgan yil mijoz | 2026-06-27 | TASDIQ-2146 §06 #65 | Seasonal cron yo'q; katalog yo'q | SD |
| Mahsulot katalogi ~15 toifa | 2026-06-27 | TASDIQ-2146 §06 #66 | Lookup-katalog qurilmagan | SD |
| Stakan/pizza maxsus shablon | 2026-06-27 | TASDIQ-2146 §06 #67 | Tur-specifik forma yo'q | SD |
| Rulonnye samokleyki parametr | 2026-06-27 | TASDIQ-2146 §06 #68 | Rulon parametr ustunlar yo'q | SD |
| Klishe/forma egalik+muddat (3 yil) | 2026-06-27 | TASDIQ-2146 §06 #74 | Egalik+muddat egasidan | SD |
| 100% avans→5% chegirma avto | 2026-06-27 | TASDIQ-2146 §06 #79 | Bog'lanish qurilmagan | SD |
| Yangi vs takror mijoz oqimi | 2026-06-27 | TASDIQ-2146 §06 #84 | Ikki-oqim/nusxa yo'q | SD |
| Kongrev vs tisnenie ajratish | 2026-06-27 | TASDIQ-2146 §06 #88 | Bitta umumiy tarif | SD |
| Tisnenie folga zoloto/serebro→ombor | 2026-06-27 | TASDIQ-2146 §06 #89 | folga_color+ombor bog'lanish yo'q | SD |
| Laminatsiya turi ro'yxatdan | 2026-06-27 | TASDIQ-2146 §06 #90 | Tur enum/lookup yo'q | SD |
| Lak turi + qoplama % | 2026-06-27 | TASDIQ-2146 §06 #91 | Lak-turi+coverage yo'q | SD |
| Kashirovka alohida operatsiya | 2026-06-27 | TASDIQ-2146 §06 #92 | Belgisi+marshrut yo'q | SD |
| Vysechka turi | 2026-06-27 | TASDIQ-2146 §06 #93 | die_cut_method lookup yo'q | SD |
| Skleyka turi→vaqt+narx | 2026-06-27 | TASDIQ-2146 §06 #94 | Skleyka-tur+tarif yo'q | SD |
| Bez/s oborotom 2x narx | 2026-06-27 | TASDIQ-2146 §06 #95 | print_sides+2x mantiq yo'q | SD |
| 3-makro/mikro gofra turi | 2026-06-27 | TASDIQ-2146 §06 #96 | Makro/mikro turi yo'q | SD |
| Gofroyashik qatlami + AI | 2026-06-27 | TASDIQ-2146 §06 #97 | layer_count+AI yo'q | SD |
| Banderol alohida pozitsiya | 2026-06-27 | TASDIQ-2146 §06 #98 | Element yo'q | SD |
| Latok SKU katalog | 2026-06-27 | TASDIQ-2146 §06 #99 | SKU katalog qurilmagan | SD |
| Tex opisanie avto-matn | 2026-06-27 | TASDIQ-2146 §06 #100 | Avto-matn+manba ustunlar yo'q | SD |
| Marka/profil lug'at | 2026-06-27 | TASDIQ-2146 §06 #101 | Markaziy lug'at yo'q | SD |
| Plyonka qalinligi ro'yxat | 2026-06-27 | TASDIQ-2146 §06 #102 | film_thickness lookup yo'q | SD |
| Zakaz 1S eski raqam | 2026-06-27 | TASDIQ-2146 §06 #104 | order_1c ustuni yo'q | SD |
| Bekor jarima bosqichga qarab | 2026-06-27 | TASDIQ-2146 §06 #107 | order_cancellation_rules yo'q; foiz egasidan | SD |
