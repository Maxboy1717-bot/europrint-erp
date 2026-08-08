## [B/TASDIQ] WMS / Ombor (10) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Rulon o'lchov maydonlari (kenglik/diametr/gramaj/og'irlik/uzunlik) | 2026-06-27 | TASDIQ-2146 §10 #1 | Karton zavod yadrosi | WMS rulon karta | To'liq 5 o'lcham maydoni | Ha | rulon_cards width/diameter/grammage/weight; rulon-card.controller.ts:58-116 |
| 2 | Gramaj g/m² standart tanlovli ro'yxat (80..300) | 2026-06-27 | TASDIQ-2146 §10 #2 | Xato kam | Rulon karta forma | Enum/seed 80..300 | Qisman | grammage_gsm erkin integer, enum yo'q |
| 3 | Rulon qoldig'i kg + uzunlik avto-hisob | 2026-06-27 | TASDIQ-2146 §10 #3 | Tarozida o'lchash | Rulon og'irlik | kg asosiy, uzunlik avto | Ha | rulon-card.service.ts:132-167 WmsRollCalc |
| 4 | Yarim/ochilgan status (To'liq/Ochilgan/Qoldiq), ochilgani avval | 2026-06-27 | TASDIQ-2146 §10 #4 | FIFO ochilgan | Rulon status | full/opened/remnant o'tish | Ha | wms-rulon-card.constants.ts:13-27; service:159-165 |
| 5 | Har rulonga noyob ID + QR/barcode yorliq | 2026-06-27 | TASDIQ-2146 §10 #5 | Aniq izlash | Rulon karta | roll_code+qr_label noyob | Ha | rulon-card.service.ts:60-99, 409 konflikt |
| 6 | Rulon manbasi (beruvchi+ishlab chiqaruvchi+sertifikat+sana) | 2026-06-27 | TASDIQ-2146 §10 #6 | To'liq izlanuvchanlik | Rulon karta | manufacturer alohida ustun | Qisman | supplier/certificate/received_date bor, manufacturer yo'q |
| 7 | Rulon turi (kraft/test-layner/...) + qoplama maydoni | 2026-06-27 | TASDIQ-2146 §10 #7 | Топлайнер╳местный | Rulon karta | enum tur + coating maydon | Qisman | roll_type varchar REAL, enum+coating yo'q |
| 8 | Namlik % + saqlash zonasi maydoni | 2026-06-27 | TASDIQ-2146 §10 #8 | Qog'oz namlikka sezgir | Rulon karta | humidity_pct+storage_zone | Ha | rulon-card.service.ts:109-110 |
| 9 | Material 5 toifa (xom/yordamchi/tayyor/yarim/chiqindi) | 2026-06-27 | TASDIQ-2146 §10 #9 | Toifalash | Material karta | 5-toifa enum/seed | Qisman | category+material_type bor, qat'iy enum tasdiqlanmadi |
| 10 | Material kodlash tizimi (ma'noli artikul KR-125-1400) | 2026-06-27 | TASDIQ-2146 §10 #10 | Dublikat oldini | Material karta | ma'noli kod sxemasi | Qisman | roll_code ma'noli; material KR-schema yo'q (EP-WMS-041) |
| 11 | O'lchov birliklari + avto-konvertatsiya (kg↔m↔m²) | 2026-06-27 | TASDIQ-2146 §10 #11 | Avto konversiya | Material/rulon | umumiy kg↔m² servis | Qisman | rulon kg→m bor, umumiy servis yo'q (EP-WMS-042) |
| 12 | Bir material — ko'p beruvchi (partiya darajasida) | 2026-06-27 | TASDIQ-2146 §10 #12 | Bitta karta | Material/partiya | supplier partiya darajasida | Ha | material_supplier_ratings + batch_lots |
| 13 | ABC/muhimlik klassifikatsiyasi (avto yillik sarf×narx) | 2026-06-27 | TASDIQ-2146 §10 #13 | Muhimlik | Analitika | ABC avto | Ha | abc_segment + abc-xyz.service.ts (EP-WMS-027/044) |
| 14 | Xavfli/maxsus material belgisi + alohida zona | 2026-06-27 | TASDIQ-2146 §10 #14 | Yong'in xavfsizligi | Material karta/zona | is_flammable bayroq ustuni | Qisman | hazard_zones bor, material bayroq yo'q (EP-WMS-045) |
| 15 | Kirim blankasi majburiy maydonlari | 2026-06-27 | TASDIQ-2146 §10 #15 | To'liq qayd | Goods receipt | receipt maydonlari | Ha | mm_goods_receipts to'liq ustunlar |
| 16 | Kirim PO bilan 3-tomonlama solishtirish | 2026-06-27 | TASDIQ-2146 §10 #16 | Farq belgilash | Goods receipt | 3-way match + tolerans | Qisman | PO FK bor, avto match+tolerans yo'q (EP-WMS-047) |
| 17 | Kirimda QC karantin darvozasi (karantin→QC OK→erkin) | 2026-06-27 | TASDIQ-2146 §10 #17 | Eng xavfsiz | Karantin | majburiy gate | Ha | wms-quarantine-gate.service.ts:88-106 BLOK |
| 18 | Qisman qabul (qabul/rad miqdor + rad sababi) | 2026-06-27 | TASDIQ-2146 §10 #18 | Qisman qabul | Goods receipt | qabul/rad+sabab modeli | Qisman | qc_passed_items bor, to'liq model yo'q (EP-WMS-049) |
| 19 | Kirim tarozi vazni va hujjat-vazn farqi (kg va %) | 2026-06-27 | TASDIQ-2146 §10 #19 | Vazn farqi | Karantin gate | tarozi-blanka qaydi | Qisman | checkWeightTolerance ±2% bor, blanka alohida emas |
| 20 | Kim kirim qila oladi — faqat ombor mas'uli | 2026-06-27 | TASDIQ-2146 §10 #20 | Rol nazorati | Guard/RBAC | @Roles cheklov | Ha | rulon-card.controller.ts:41-45 RolesGuard |
| 21 | Chiqim sabab turlari (IChiq/sotuv/brak/sinov/qaytarish/ko'chirish) | 2026-06-27 | TASDIQ-2146 §10 #21 | Movement turlari | Movements | to'liq sabab ro'yxat | Ha | material_movements + wms_transactions |
| 22 | Chiqim PP buyurtmaga majburiy bog'lanish | 2026-06-27 | TASDIQ-2146 §10 #22 | Tannarx aniq | Goods issue | ppId majburiy | Ha | goods-issue.handler.ts:35,85-90 |
| 23 | Norma (BOM) vs haqiqiy sarf solishtirish | 2026-06-27 | TASDIQ-2146 §10 #23 | Ortiqcha sarf signal | Goods issue | norma-fakt og'ish % | Qisman | texkarta gate bor, og'ish % yo'q (EP-WMS-054/104) |
| 24 | Chiqimda FIFO/FEFO qoidasi | 2026-06-27 | TASDIQ-2146 §10 #24 | Muddatli→FEFO | Batch tanlov | resolveStrategy | Ha | batch-selection.service.ts:56-91 |
| 25 | Manfiy qoldiqdan himoya | 2026-06-27 | TASDIQ-2146 §10 #25 | Ortiq chiqim BLOK | Goods issue | manfiy BLOK | Ha | batch-selection.service.ts:150-154 |
| 26 | Katta/qimmat chiqimni tasdiqlash (ikki imzo) | 2026-06-27 | TASDIQ-2146 §10 #26 | Rahbar tasdig'i | Goods issue | summa chegara workflow | Qisman | rol+audit bor, ikki-imzo yo'q (EP-WMS-057/101) |
| 27 | Inventarizatsiya turi+chastota (aylanma+yiliga 1) | 2026-06-27 | TASDIQ-2146 §10 #27 | Ish to'xtamaydi | Inventar | aylanma-vs-to'liq avto | Qisman | inventory_counts CRUD bor, chastota avto yo'q |
| 28 | Sanoq usuli ko'r-sanoq (raqam yashirin) | 2026-06-27 | TASDIQ-2146 §10 #28 | Halol natija | Inventar | ko'r-rejim | Yo'q | grep blind/ko'r yo'q — qurilmagan |
| 29 | Og'ish chegarasi+tasdiq (±1% avto, rahbar) | 2026-06-27 | TASDIQ-2146 §10 #29 | Avto-tuzatish | Inventar | ±1% chegara mantiq | Qisman | variance saqlanadi, avto-tuzatish yo'q (EP-WMS-060) |
| 30 | Og'ish sababi majburiy ro'yxatdan | 2026-06-27 | TASDIQ-2146 §10 #30 | Sabab aniq | Inventar | variance-reason enum | Yo'q | reason enum yo'q (EP-WMS-061) |
| 31 | Inventarizatsiyada zona/material muzlatish | 2026-06-27 | TASDIQ-2146 §10 #31 | Aniq natija | Inventar | freeze mexanizm | Yo'q | freeze logikasi yo'q (EP-WMS-062) |
| 32 | Tarozi bilan rulon sanog'i (ochilgan tortiladi) | 2026-06-27 | TASDIQ-2146 §10 #32 | Aniq sanoq | Inventar/rulon | ochilgan→tortish logika | Qisman | updateWeight bor, ajratuvchi sanoq yo'q (EP-WMS-063) |
| 33 | Min qoldiq + tushganda avto-ogohlantirish | 2026-06-27 | TASDIQ-2146 §10 #33 | Signal | Signal | min_stock + alert | Ha | min_stock_alerts + get-low-stock.handler.ts |
| 34 | Reorder nuqtasi + tavsiya miqdor (sarf×lead-time) | 2026-06-27 | TASDIQ-2146 §10 #34 | Aqlli buyurtma | Reorder | avto-reorder miqdor | Qisman | rop/eoq servis bor, lead-time DATA yo'q (EP-WMS-065) |
| 35 | Max qoldiq + oshsa ogohlantirish | 2026-06-27 | TASDIQ-2146 §10 #35 | Ortiqcha zaxira | Signal | max oshsa trigger | Qisman | max_stock bor, trigger tasdiqlanmadi (EP-WMS-066) |
| 36 | Mavsumiy/dinamik min-max (3-6 oy sarf avto) | 2026-06-27 | TASDIQ-2146 §10 #36 | Dinamik | Reorder | dinamik avto-hisob CRON | Yo'q | statik formula bor, dinamik yo'q (EP-WMS-067) |
| 37 | Lead time reorder hisobida (har beruvchiga) | 2026-06-27 | TASDIQ-2146 §10 #37 | Xavfsizlik zaxira | Reorder | lead-time qiymati | egasi-data | formula bor, DATA kiritilmagan (EP-WMS-068) |
| 38 | Karantin sabablari ro'yxati | 2026-06-27 | TASDIQ-2146 §10 #38 | To'liq sabab | Karantin | sabab holat-mashina | Ha | wms-quarantine.constants.ts:53-77 |
| 39 | Karantindan chiqarish faqat QC roli qaror | 2026-06-27 | TASDIQ-2146 §10 #39 | QC qaror | Karantin | applyQcDecision | Ha | wms-quarantine-gate.service.ts:56-71 |
| 40 | Karantin natijasi 4 yo'l (OK/past/brak/qaytarish) | 2026-06-27 | TASDIQ-2146 §10 #40 | To'liq yo'l | Karantin | 4-yo'l (past→arzon) | Qisman | 3 yo'l REAL, past→arzon yo'q |
| 41 | Karantinda turish muddati + oshsa ogohlantirish | 2026-06-27 | TASDIQ-2146 §10 #41 | Muddat nazorati | Karantin | max-muddat cron | Yo'q | muddat trigger yo'q (EP-WMS-072) |
| 42 | Ombor topologiyasi (zona→qator→javon→yacheyka) | 2026-06-27 | TASDIQ-2146 §10 #42 | Aniq topish | Topologiya | zona/bin struktura | Ha | warehouse_zones + warehouse_bins |
| 43 | Ichki ko'chirish blankasi (manba+maqsad+miqdor+xodim+sana) | 2026-06-27 | TASDIQ-2146 §10 #43 | To'liq qayd | Transfer | internal request | Ha | wms-counts.dto.ts:17-23 + audit |
| 44 | Ko'p ombor/filial + ombor-aro ko'chirish | 2026-06-27 | TASDIQ-2146 §10 #44 | Har ombor alohida | Transfer | from/to warehouse | Ha | warehouses 12 qator; internal-request |
| 45 | Yacheyka sig'imi + band/bo'sh + avto-joy taklifi | 2026-06-27 | TASDIQ-2146 §10 #45 | Avto joylash | Topologiya | avto-joy algoritm | Qisman | max_weight/occupancy bor, algoritm yo'q (EP-WMS-076) |
| 46 | Tayyor mahsulot zonasi alohida (sotuv shu yerdan) | 2026-06-27 | TASDIQ-2146 §10 #46 | FG ombori | FG ombor | FINISHED_GOODS + EXTERNAL_OUT | Ha | receive-fg.handler.ts |
| 47 | Partiya raqami + chiqim partiyaga (izlanuvchanlik) | 2026-06-27 | TASDIQ-2146 §10 #47 | Oldinga/orqaga izlash | Partiya | batch bog'lanish | Ha | goods-issue.handler decrementBatchLot |
| 48 | Yaroqlilik muddati + ogohlantirish + o'tganda bloklash | 2026-06-27 | TASDIQ-2146 §10 #48 | Muddat nazorati | Partiya | expiry BLOK | Ha | batch-selection.service.ts:116-131 FEFO BLOK |
| 49 | Partiya sifat ko'rsatkichi (gramaj/namlik/mustahkamlik) | 2026-06-27 | TASDIQ-2146 §10 #49 | Partiya pasporti | Partiya QC | QC natija biriktirish | Qisman | quality_status bor, to'liq model yo'q (EP-WMS-080) |
| 50 | Partiyalarni aralashtirishga ruxsat (imkon qadar bitta) | 2026-06-27 | TASDIQ-2146 §10 #50 | Bitta partiya | Goods issue | aralashsa ogohlantirish | Qisman | buildPlan span qiladi, biznes-qoida yo'q (EP-WMS-081) |
| 51 | Dead stock avto-belgilash (N kun harakatsiz) | 2026-06-27 | TASDIQ-2146 §10 #51 | O'lik zaxira hisobot | Analitika | N-kun avto-belgi cron | Qisman | last_movement_at + aging bor, N-cron yo'q (EP-WMS-082) |
| 52 | Qoldiq/obrezka qayta kirimga | 2026-06-27 | TASDIQ-2146 §10 #52 | Tejam | Movements | obrezka→qayta-kirim oqim | Qisman | remnant+INTERNAL_RETURN bor, avto-oqim yo'q |
| 53 | Texkarta-material moslik (mos kelmasa chiqim BLOK) | 2026-06-27 | TASDIQ-2146 §10 #53 | Brak oldini | Goods issue | outbound gate | Ha | outbound-enforcement.service checkIssueAllowed |
| 54 | Gofra qavat aralashtirishdan himoya (3╳5) | 2026-06-27 | TASDIQ-2146 §10 #54 | Qavat mos | Goods issue | layer-check BLOK | Ha | goods-issue.handler.ts:40,66 (EP-WMS-085) |
| 55 | Poddon (palet) birligini hisobga olish | 2026-06-27 | TASDIQ-2146 §10 #55 | Transport birligi | Movements | ikki-birlik konversiya | Qisman | ow_pallet_recoveries bor, konversiya yo'q |
| 56 | Ichki transport so'rovi (rohler) + kechikish izi | 2026-06-27 | TASDIQ-2146 §10 #56 | Material kerak oqim | Internal req | rohler-vazifa+kechikish | Qisman | internal-request bor, eskalatsiya yo'q (EP-WMS-087) |
| 57 | Bekor turishni ombor-yetishmasligiga bog'lash (KPI) | 2026-06-27 | TASDIQ-2146 §10 #57 | KPI | KPI/MES | logistika downtime KPI | Qisman | event bor, KPI hisob MES-da (EP-WMS-088) |
| 58 | Chiqindi/qoldiqni ajratib hisoblash (qayta ╳ chiqindi) | 2026-06-27 | TASDIQ-2146 §10 #58 | Daromad ajratish | Movements | ikki-tur ajratish | Qisman | remnant+makulatura bor, ajratuvchi hisob yo'q (EP-WMS-089) |
| 59 | Makulatura alohida zaxira + ruxsat-mahsulot ro'yxati | 2026-06-27 | TASDIQ-2146 §10 #59 | Past sifat nazorat | Material karta | substitute allow-list | Qisman | material-karta bor, allow-list yo'q (EP-WMS-090/101) |
| 60 | Grammaj kirim tekshiruvi (namuna, oshsa karantin) | 2026-06-27 | TASDIQ-2146 §10 #60 | Kirim sifat | Karantin | gramaj-spetsifik tolerans | Qisman | ±2% vazn bor, gramaj-maxsus yo'q (EP-WMS-091) |
| 61 | Import xom-ashyo in-transit holati (jo'natildi/bojxona/keldi) | 2026-06-27 | TASDIQ-2146 §10 #61 | Import kuzatuvi | Import | in-transit jadval | Yo'q | transit/eta/customs ustuni yo'q (EP-WMS-092) |
| 62 | Import lead-time va valyuta narxi reorder hisobida | 2026-06-27 | TASDIQ-2146 §10 #62 | Import ertaroq | Reorder | import bayroq+valyuta | egasi-data | formula bor, DATA yo'q (EP-WMS-093) |
| 63 | Beruvchi ishonchlilik reytingi (o'z vaqt%/brak%/narx) | 2026-06-27 | TASDIQ-2146 §10 #63 | Eng yaxshi beruvchi | Supplier | avto reyting trigger | Qisman | ratings jadval bor, avto-hisob yo'q (EP-WMS-094) |
| 64 | Import partiyaga bojxona/sertifikat (GTD/invoys) biriktirish | 2026-06-27 | TASDIQ-2146 §10 #64 | Audit toza | Import | fayl-biriktirish model | Yo'q | GTD attachment yo'q (EP-WMS-095) |
| 65 | Avans to'lov va yetkazish bog'lanishi (yopilmagan avanslar) | 2026-06-27 | TASDIQ-2146 §10 #65 | Avans nazorat | Finance | avans↔kirim solishtirish | Yo'q | bog'lanish yo'q (EP-WMS-096) |
| 66 | Tayyor mahsulot jo'natish (отгрузка) hujjati avto | 2026-06-27 | TASDIQ-2146 §10 #66 | Jo'natish hujjati | FG/SD | avto hujjat generatsiya | Qisman | EXTERNAL_OUT bor, to'liq hujjat A-yarmda yo'q (EP-WMS-097) |
| 67 | Haydovchi va mashinani jo'natishga biriktirish | 2026-06-27 | TASDIQ-2146 §10 #67 | Javobgarlik | SD/Логистика | haydovchi/mashina biriktirish | Yo'q | WMS modulida yo'q (EP-WMS-098) |
| 68 | EP-WMS-084: texkarta kod ≠ chiqarilayotgan → BLOK | 2026-06-27 | TASDIQ-2146 §10 #68 | Brak oldini | Goods issue | BOM mismatch BLOK | Ha | outbound-enforcement.service.ts:104-131 |
| 69 | EP-WMS-085: gofra qavat (3╳5) BLOK | 2026-06-27 | TASDIQ-2146 §10 #69 | Qavat mos | Goods issue | layer mismatch BLOK | Ha | outbound-enforcement.service.ts:106-116 |
| 70 | EP-WMS-086: poddon birligini alohida hisoblash | 2026-06-27 | TASDIQ-2146 §10 #70 | Ichki logistika | Movements | poddon-birlik kod | Yo'q | grep pallet=0; ow_pallet_recoveries o'qilmaydi |
| 71 | EP-WMS-087: rohler chaqirish + kechikish/eskalatsiya | 2026-06-27 | TASDIQ-2146 §10 #71 | Eskalatsiya | Internal req | 15/30/60 daq timing | Qisman | internal-requests CRUD bor, eskalatsiya timing yo'q |
| 72 | EP-WMS-088: bekor turish ombor-yetishmaslik KPI | 2026-06-27 | TASDIQ-2146 §10 #72 | KPI | KPI | material-logistika KPI reader | Qisman | warehouse_kpi_cache bor, reader yo'q |
| 73 | EP-WMS-089: chiqindi╳qoldiq ajratib hisoblash | 2026-06-27 | TASDIQ-2146 §10 #73 | Daromad╳utilizatsiya | Movements | ajratib hisob oqim | Qisman | INTERNAL_RETURN bor, ajratish yo'q |
| 74 | EP-WMS-090: makulatura alohida + ruxsat-mahsulot | 2026-06-27 | TASDIQ-2146 §10 #74 | Noto'g'ri buyurtma oldini | Material | material→izin-buyurtma bog' | Qisman | material_category_dept_rules bor, allow-list yo'q |
| 75 | EP-WMS-091: grammaj kirim (namuna ±tolerans→partiya karantin) | 2026-06-27 | TASDIQ-2146 §10 #75 | Sifat gate | Karantin | gramaj-maxsus+butun partiya | Qisman | ±2% vazn bor, gramaj-maxsus yo'q |
| 76 | EP-WMS-092: import in-transit (jo'natildi/bojxona/keldi+ETA) | 2026-06-27 | TASDIQ-2146 §10 #76 | Import kuzatuvi | Import | kiruvchi in-transit holat | Qisman | chiquvchi deliveries bor, kiruvchi yo'q |
| 77 | EP-WMS-093: import lead-time+valyuta reorder (bayroq) | 2026-06-27 | TASDIQ-2146 §10 #77 | Import ertaroq | Reorder | import bayroq+valyuta DATA | egasi-data | EOQ/ROP bor, DATA to'ldirilmagan |
| 78 | EP-WMS-094: beruvchi reyting avto (o'z-vaqt%/brak%/narx) | 2026-06-27 | TASDIQ-2146 §10 #78 | Eng yaxshi beruvchi | Supplier | reyting hisoblovchi | Yo'q | ratings jadval bor, hech kod yozmaydi/o'qimaydi |
| 79 | EP-WMS-095: import partiya GTD/sertifikat biriktirish | 2026-06-27 | TASDIQ-2146 §10 #79 | Audit toza | Import | fayl bog'lanish | Qisman | passports+storage infra bor, import-bog' tasdiqlanmadi |
| 80 | EP-WMS-096: avans↔yetkazish (yopilmagan avanslar) | 2026-06-27 | TASDIQ-2146 §10 #80 | Avans nazorat | Finance | avans-ko'rinish | Qisman | Finance infra bor, WMS-ko'rinish yo'q |
| 81 | EP-WMS-097: отгрузка hujjati (mijoz/mahsulot/haydovchi/mashina) | 2026-06-27 | TASDIQ-2146 §10 #81 | Jo'natish javobgarlik | Логистика | Delivery aggregate | Ha | deliveries + dispatch-delivery.handler (n=1) |
| 82 | EP-WMS-098: haydovchi+mashina biriktirish | 2026-06-27 | TASDIQ-2146 §10 #82 | Javobgarlik | Логистика | assign(driver,vehicle) | Ha | delivery.aggregate.ts:102; assign-driver.handler |
| 83 | EP-WMS-099: yetkazishni tasdiqlash (yetkazildi/qaytdi/qisman) | 2026-06-27 | TASDIQ-2146 §10 #83 | Sikl yopiladi | Логистика | qisman+imzo qaytish | Qisman | DELIVERED/FAILED bor, qisman+imzo yo'q |
| 84 | EP-WMS-100: material rezervatsiyasi (mavjud−band=erkin) | 2026-06-27 | TASDIQ-2146 §10 #84 | Ortiqcha va'da yo'q | Rezervatsiya | reserved_qty yangilash | Qisman | reserved_quantity ustun bor, mantiq to'liq emas; stock_reservations bo'sh |
| 85 | EP-WMS-101: material almashtirish (substitute/analog) | 2026-06-27 | TASDIQ-2146 §10 #85 | Ruxsat-analog | Material | substitutions jadval | Yo'q | grep=0; material_substitutions jadval yo'q |
| 86 | EP-WMS-102: razryad→ruxsat-amal matritsasi | 2026-06-27 | TASDIQ-2146 §10 #86 | Vakolat | RBAC | razryad→amal matritsa | Qisman | role_movement_permissions bor, razryad-bog' yo'q |
| 87 | EP-WMS-103: spisaniye jarayoni (material+sabab→Finance) | 2026-06-27 | TASDIQ-2146 §10 #87 | Finance zarar audit | Finance | spisaniye→GL oqim | Qisman | write_off_acts jadval bor (n=0), GL oqim tasdiqlanmadi |
| 88 | EP-WMS-104: norma og'ish tahlili (norma/fakt %) | 2026-06-27 | TASDIQ-2146 §10 #88 | Yo'qotish manbai | Analitika | norma-fakt reader | Yo'q | material_norms bor, taqqoslovchi reader yo'q |
| 89 | EP-WMS-105: qabulda foto-dalil (shikast→foto→reklamatsiya) | 2026-06-27 | TASDIQ-2146 §10 #89 | Isbot | Goods receipt | shikast→foto majburiy | Qisman | storage infra bor, validatsiya oqim yo'q |
| 90 | EP-WMS-106: beruvchiga qaytarish (zaxira↓+Finance kreditor↓) | 2026-06-27 | TASDIQ-2146 §10 #90 | Vozvrat | Finance | vozvrat→kreditor↓ atomik | Qisman | CHIQARISH+qaror oqim bor, Finance bog' tasdiqlanmadi |
| 91 | EP-WMS-107: kunlik qoldiq hisoboti rahbarga (CRON) | 2026-06-27 | TASDIQ-2146 §10 #91 | Avto hisobot | Reporting | CRON→CC yuborish | Qisman | dashboard endpoint bor, CRON writer yo'q |
| 92 | EP-WMS-108: kritik yetishmaslik proaktiv signal | 2026-06-27 | TASDIQ-2146 §10 #92 | Бекор туриш oldini | Signal | tugash-kun prognoz cron | Qisman | domain formula bor, CRON-signal tasdiqlanmadi |
| 93 | EP-WMS-109: ombor harakati GL avto o'tish (Dr/Cr) | 2026-06-27 | TASDIQ-2146 §10 #93 | Buxg↔ombor teng | Finance/GL | har harakat GL provodka | Ha | finance/wms-goods-issued.listener.ts:48-101 |
| 94 | EP-WMS-110: narx usuli (FIFO/o'rtacha) | 2026-06-27 | TASDIQ-2146 §10 #94 | KONFLIKT FIFO ustun | Finance/narx | FIFO-partiya narx GL-da | Qisman | batch FIFO bor, GL narx material_cards.unit_price'dan (partiya emas) |
| 95 | EP-WMS-111: kamomad mas'ul shaxsga (material-javobgar) | 2026-06-27 | TASDIQ-2146 §10 #95 | Javobgarlik | Inventar | zona→mas'ul→kamomad | Qisman | warehouse_employees+variance bor, avto-bog' yo'q |
| 96 | EP-WMS-112: Ombor↔POS Monitor rol ajratimi (bir DB) | 2026-06-27 | TASDIQ-2146 §10 #96 | Kanonik DB | Arxitektura | warehouse_stock kanonik | Ha | current_stock=view; pos+wms shu jadvalga |
| 97 | EP-WMS-113: material→ishlatiladigan buyurtmalar teskari | 2026-06-27 | TASDIQ-2146 §10 #97 | Ta'sir baholash | Analitika | teskari READ endpoint | Qisman | tech_card_bom bor (n=0), endpoint yo'q |
| 98 | EP-WMS-114: min partiya/qadoqlash birligi (reorder yaxlitlash) | 2026-06-27 | TASDIQ-2146 §10 #98 | Real buyurtma | Reorder | min-partiya qiymati | egasi-data | supplier_price_tiers bor, qiymat to'ldirilmagan |
| 99 | EP-WMS-115: zaxira aylanma tezligi (turnover days) | 2026-06-27 | TASDIQ-2146 §10 #99 | Zaxira optimal | Analitika | turnover ko'rsatkich | Ha | inventory-turnover.service + reports/turnover |
| 100 | EP-WMS-116: zona sig'imi to'lganlik % (import oldi) | 2026-06-27 | TASDIQ-2146 §10 #100 | Kirim oldi tekshir | Topologiya | to'lganlik% gating | Qisman | wms-overflow.service bor, sig'im to'ldirilmagan |
| 101 | EP-WMS-117: brak/karantin materialni sexga BLOK | 2026-06-27 | TASDIQ-2146 §10 #101 | Qat'iy blok | Karantin | canPostToMain BLOK | Ha | wms-quarantine-gate.service.ts:84-101 |
| 102 | EP-WMS-118: kam/ortiq kelganda ±% tolerantlik | 2026-06-27 | TASDIQ-2146 §10 #102 | Avto-qabul | Karantin | ±% tolerans | Ha | quarantine-gate.service.ts:126-157 (aniq % egasi) |
| 103 | EP-WMS-119: ombor/ichki logistika ЦКП KPI | 2026-06-27 | TASDIQ-2146 §10 #103 | Karta baho | KPI | bekor-turish→AI-baho bog' | Qisman | warehouse_kpi_cache bor, AI-baho bog' to'liq emas |
| 104 | EP-WMS-120: reorderda ko'p-beruvchi tender | 2026-06-27 | TASDIQ-2146 §10 #104 | Narx optimal | Supplier | tender/taklif solishtirish | Yo'q | tender oqim topilmadi |
| 105 | EP-WMS-121: ish vaqtidan tashqari amal nazorati | 2026-06-27 | TASDIQ-2146 §10 #105 | Shubhali harakat | Audit | smena-jadval avto-bayroq | Qisman | transactions audit bor, avto-bayroq yo'q |
| 106 | EP-WMS-122: yangi kartochka huquqi + dublikat ogohlantirish | 2026-06-27 | TASDIQ-2146 §10 #106 | Dublikat kamayadi | Material | AI-semantik dublikat | Qisman | card_suggestions bor, AI-dublikat yo'q |
| 107 | EP-WMS-123: material egasi bizniki╳mijoz moli (davalcheskiy) | 2026-06-27 | TASDIQ-2146 §10 #107 | Mijoz-mol ajratish | Material | owner/customer bayroq | Yo'q | grep=0; owner ustun yo'q |
| 108 | EP-WMS-124: smenalararo qoldiq topshirish (peresmenka) | 2026-06-27 | TASDIQ-2146 §10 #108 | Elektron akt | Inventar | peresmenka-akt oqim | Qisman | shifts+handover bor, akt→stock solishtirish yo'q |
| 109 | EP-WMS-125: material qayta ishlatish (vtorichka sifat-belgi) | 2026-06-27 | TASDIQ-2146 §10 #109 | Tejam | Material | ikkilamchi sifat belgi | Yo'q | grep=0; belgi yo'q |
| 110 | EP-WMS-126: material yoshi eskirish signali (muddatsizga) | 2026-06-27 | TASDIQ-2146 §10 #110 | Eski avval | Signal | kirim-yosh 6-oy signal | Yo'q | grep=0; aging faqat muddatli-FEFO |
| 111 | EP-WMS-127: namlik/harorat buzilsa signal (IoT) | 2026-06-27 | TASDIQ-2146 §10 #111 | Qog'oz sezgir | IoT | anomaliya→zaxira xavf | Qisman | iot modul to'liq, ombor-bog' tasdiqlanmadi |
| 112 | EP-WMS-128: bo'yoq/kley/lak maxsus saqlash+zona (xavf) | 2026-06-27 | TASDIQ-2146 §10 #112 | Xavfsizlik | Material/zona | xavf-turi+saqlash maydon | Yo'q | grep=0; xavf-bog' yo'q |
| 113 | EP-WMS-129: rulondan list zaxira (kg↓→dona↑) | 2026-06-27 | TASDIQ-2146 §10 #113 | Ikki o'lchov bog' | Rulon/list | kesish→list-yaratish handler | Qisman | roll_usage bor, handler tasdiqlanmadi |
| 114 | EP-WMS-130: namuna/probnik chiqim alohida (kamomad emas) | 2026-06-27 | TASDIQ-2146 §10 #114 | Kamomad emas | Movements | namuna sabab-kod | Yo'q | grep=0; probnik kod yo'q |
| 115 | EP-WMS-131: inventarizatsiya ABC chastota (A-hafta,C-yil) | 2026-06-27 | TASDIQ-2146 §10 #115 | Resurs optimal | Inventar | ABC→chastota CRON | Qisman | abc servis bor, avto-reja CRON yo'q |
| 116 | EP-WMS-132: blanka chop (QR)+ikki imzo+skan | 2026-06-27 | TASDIQ-2146 §10 #116 | Elektron+qog'oz dalil | Reporting | PDF+imzo+skan oqim | Qisman | barcode/label infra bor, to'liq oqim tasdiqlanmadi |
| 117 | EP-WMS-133: ombor ijarasi (mijoz molini saqlash) hisob+to'lov | 2026-06-27 | TASDIQ-2146 §10 #117 | Toza ajratish | Finance | mijoz-mol flag+ijara CRON | Qisman | rental CRUD bor, GL-flag+CRON tasdiqlanmadi; tarif egasi-data |
| 118 | EP-WMS-134: ombor ichida ko'chirish izi (eski→yangi+kim) | 2026-06-27 | TASDIQ-2146 §10 #118 | Rulon yo'qolmaydi | Transfer | ko'chirish audit | Ha | warehouse_transfers+stock_transfers; movements.service |
| 119 | v1 008/060: inventarizatsiya aniqlik % (GSD)+og'ish tasdiq | 2026-06-27 | TASDIQ-2146 §10 #119 | Aniqlik | Inventar | ±1% avto→rahbar gating | Qisman | GSD formula+variance bor, gating oqim tasdiqlanmadi |
| 120 | v1 059: sanoq usuli ko'r-sanoq (raqam yashirin) | 2026-06-27 | TASDIQ-2146 §10 #120 | Halol natija | Inventar | ko'r-rejim+2-sanoqchi | Yo'q | grep=0; ko'r-rejim yo'q |
| 121 | v1 062: inventarizatsiyada zona freeze | 2026-06-27 | TASDIQ-2146 §10 #121 | Aniq natija | Inventar | zona-muzlatish blok | Yo'q | grep=0; freeze yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Ko'r-sanoq (raqam yashirin) qurilmagan | 2026-06-27 | TASDIQ-2146 §10 #28 | blind-rejim logikasi yo'q | WMS |
| Og'ish sababi majburiy ro'yxat yo'q | 2026-06-27 | TASDIQ-2146 §10 #30 | variance-reason enum yo'q (EP-WMS-061), ro'yxat egasidan | WMS |
| Inventarizatsiyada zona muzlatish yo'q | 2026-06-27 | TASDIQ-2146 §10 #31 | freeze mexanizm yo'q (EP-WMS-062) | WMS |
| Dinamik min-max (3-6 oy sarf) yo'q | 2026-06-27 | TASDIQ-2146 §10 #36 | dinamik avto-hisob CRON yo'q (EP-WMS-067) | WMS |
| Lead time reorder (har beruvchiga) | 2026-06-27 | TASDIQ-2146 §10 #37 | formula bor, lead-time DATA egasidan (EP-WMS-068) | WMS |
| Karantin turish muddati signali yo'q | 2026-06-27 | TASDIQ-2146 §10 #41 | max-muddat trigger yo'q; muddat egasi-DATA (EP-WMS-072) | WMS |
| Import in-transit holati yo'q | 2026-06-27 | TASDIQ-2146 §10 #61 | transit/eta/customs qurilmagan (EP-WMS-092) | WMS/MM |
| Import lead-time+valyuta reorder | 2026-06-27 | TASDIQ-2146 §10 #62 | import bayroq+valyuta DATA egasidan (EP-WMS-093) | WMS/MM |
| Import GTD/invoys biriktirish yo'q | 2026-06-27 | TASDIQ-2146 §10 #64 | fayl-biriktirish model yo'q (EP-WMS-095) | WMS/MM |
| Avans↔kirim bog'lanish yo'q | 2026-06-27 | TASDIQ-2146 §10 #65 | Finance bog'liq, yopilmagan-avans yo'q (EP-WMS-096) | WMS/Finance |
| Haydovchi/mashina biriktirish (WMS-da) yo'q | 2026-06-27 | TASDIQ-2146 §10 #67 | SD/Логистика modulida (EP-WMS-098) | WMS/SD |
| Poddon birlik hisobi yo'q | 2026-06-27 | TASDIQ-2146 §10 #70 | grep=0; ow_pallet_recoveries o'qilmaydi (EP-WMS-086) | WMS |
| Import lead-time+valyuta (bayroq) DATA | 2026-06-27 | TASDIQ-2146 §10 #77 | EOQ/ROP bor, DATA to'ldirilmagan (EP-WMS-093) | WMS/MM |
| Beruvchi reyting hisoblovchi yo'q | 2026-06-27 | TASDIQ-2146 §10 #78 | jadval bor, kod yozmaydi/o'qimaydi (EP-WMS-094) | WMS/MM |
| Substitute/analog jadval yo'q | 2026-06-27 | TASDIQ-2146 §10 #85 | material_substitutions jadval yo'q (EP-WMS-101) | WMS |
| Norma og'ish tahlili reader yo'q | 2026-06-27 | TASDIQ-2146 §10 #88 | material_norms bor, taqqoslovchi yo'q (EP-WMS-104) | WMS/MES |
| Min partiya/qadoqlash birligi DATA | 2026-06-27 | TASDIQ-2146 §10 #98 | qiymat egasi/master-data (EP-WMS-114) | WMS/MM |
| Ko'p-beruvchi tender oqim yo'q | 2026-06-27 | TASDIQ-2146 §10 #104 | tender/taklif solishtirish topilmadi (EP-WMS-120) | WMS/MM |
| Davalcheskiy (mijoz moli) bayroq yo'q | 2026-06-27 | TASDIQ-2146 §10 #107 | owner/customer ustun yo'q (EP-WMS-123) | WMS |
| Vtorichka (ikkilamchi sifat) belgisi yo'q | 2026-06-27 | TASDIQ-2146 §10 #109 | grep=0; belgi yo'q (EP-WMS-125) | WMS |
| Material yoshi eskirish signali yo'q | 2026-06-27 | TASDIQ-2146 §10 #110 | grep=0; muddatsizga signal yo'q (EP-WMS-126) | WMS |
| Bo'yoq/kley xavf-turi+zona maydon yo'q | 2026-06-27 | TASDIQ-2146 §10 #112 | grep=0; xavf-bog' yo'q (EP-WMS-128) | WMS |
| Namuna/probnik chiqim sabab-kod yo'q | 2026-06-27 | TASDIQ-2146 §10 #114 | grep=0; probnik kod yo'q (EP-WMS-130) | WMS |
| Ko'r-sanoq (v1 059) yo'q | 2026-06-27 | TASDIQ-2146 §10 #120 | grep=0; ko'r-rejim+2-sanoqchi yo'q | WMS |
| Zona freeze (v1 062) yo'q | 2026-06-27 | TASDIQ-2146 §10 #121 | grep=0; freeze yo'q | WMS |
