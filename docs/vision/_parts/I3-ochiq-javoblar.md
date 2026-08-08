## Yo'naltirilgan intervyu — OCHIQ-JAVOBLAR (Manba I3)

**Manba:** `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md`. **Qachon:** 2026-06-08.

> Manba = decision-map'dagi 🔵 OCHIQ savollarga egasi javoblari (20 modul). "A" = decision-map A-tavsiyasi qabul qilindi. Quyida har MODULning egasi tomonidan berilgan DISTINKT qarorlari (yangi biznes-qarorlar, ⭐ override/tuzatishlar, hal qilingan ziddiyatlar) alohida qatorda; modul ichidagi ommaviy "=A / printsip-default qabul" bloklari bittada jamlangan. Status: `VISION-3340-RECONCILIATION-2026-07-04.md` (Area/SB) va `MASTER-STATUS-BOARD-2026-07-06.md` dan iqtibos; qoplanmasa — `cross-ref kerak`.

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qayerda (bo'lim/#) | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Modul | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Karta ATOMIK (1 o'rindiq); xodim ko'p karta; oylik/data profilga yig'iladi | ORG TUZATISH / Q4 | Karta=manba, profil=yig'indi | Org data-model | 1 karta=1 o'rindiq; merge/split yo'q | Qisman — Area04 karta-markaz DB bor, single-tree buzuq (17 root) | Org | Fundamental model |
| 2 | Kartani birlashtirish/bo'lish = YO'Q (arxivla+yangi) | ORG-064/065 | Atomiklik | Org mutatsiya | Merge/split mexanizmi qurilmaydi | cross-ref kerak | Org | — |
| 3 | Ko'p-karta oylik = har karta TO'LIQ oyligi kartada, profilga YIG'ILADI (cap emas) | ORG-066/142 | Adolatli hisob | Payroll agregatsiya | Stavka-ulush cap emas, profil yig'indi | cross-ref kerak (payroll card-gate bor, SB0001) | Org | 142 aniqlashtirdi |
| 4 | Smena karta = 3 ALOHIDA karta (Operator-01/02/03) | ORG-094 ⭐ | 1 karta=1 o'rindiq | Org struktura | "1 kartada ko'p stavka" RAD | cross-ref kerak | Org | — |
| 5 | 4/5-bo'lim = FUNKSIYA-tegi (alohida karta emas) | ORG-101 ⭐ | Vysotskiy model | Karta atributi | funksiya-teg maydoni | cross-ref kerak | Org | — |
| 6 | Bo'lim/daraja kodi kartada, LEKIN O'ZBEK TILIDA (НО→bo'lim boshlig'i) | ORG-102 ⭐ | Til lokalizatsiya | Ierarxiya nomlari | 7-bosqich nomlari uzbekcha | cross-ref kerak | Org | — |
| 7 | O'tish chegarasi (ball) = SOZLANADIGAN (60/75 qotmagan) | ORG-055 | Egasi/HR har razryadga | Imtihon master-data | Qotirilgan chegara olib tashlanadi | cross-ref kerak | Org | — |
| 8 | Qayta topshirish qoidasi = SOZLANADIGAN (14 kun/3 marta qotmagan) | ORG-056 | Moslashuvchan | Imtihon master-data | Sozlanadigan | cross-ref kerak | Org | — |
| 9 | Shtat-reja = B ALOHIDA (kartaga bog'lanmaydi) | ORG-139 | Ajratilgan yuritish | Shtat moduli | Alohida ekran | cross-ref kerak | Org | — |
| 10 | Javobgarlik = yo'riqnoma+moddiy FAYL kartada; jihoz+umumiy PROFILDA | ORG-109 | Hujjatli javobgarlik | Karta+profil | Fayl-biriktirish | cross-ref kerak | Org | — |
| 11 | Mutaxassis karta alohida shablon, LEKIN yagona org-daraxtda | ORG-140 / Q21 | Bitta ierarxiya | Org struktura | Yagona daraxt | Qisman — single-tree buzuq (Area04 17 root) | Org | — |
| 12 | Razryad pasayish = aniq sabab (AI taklif→RD-4 tasdiq) | ORG-134 | Adolat (global printsip) | Razryad oqimi | Tasdiq bilan | cross-ref kerak (razryad chain bor, Area04/19) | Org | — |
| 13 | Past-moslikda tayinlash ogohlantiradi, BLOKLAMAYDI | ORG-093 | Rahbar qaror | Tayinlash oqimi | Sabab so'rash | cross-ref kerak | Org | — |
| 14 | ЦКП ta'rifni HR yozadi; o'lchov SON/FOIZ/VAQT | ORG-049/111 / Q15 | Markaziy bir xil sifat | ЦКП meta | HR-authored ЦКП | Qisman — ckp column bor, target/formula 1/145 (SB0004) | Org | Data gap |
| 15 | ЦКП kaskad quyidan yuqoriga avto to'planadi | ORG-112/114 | Rahbar KPI | ЦКП agregatsiya | Cascade listener | Ha — RESOLVED ckp-cascade.listener (SB0014) | Org | BE real |
| 16 | ORG qolgan ~40 ochiq savol = A-tavsiya qabul (razryad/vakansiya/import/talab/huquq/lug'at) | ORG-043..137 | Standart qabul | Turli ORG qismlar | A-default | cross-ref kerak | Org | Jamlangan |
| 17 | Reyting toifa A/B/C chegarasi = SOZLANADI (admin panel) | HR-012 | Moslashuvchan | HR reyting | Sozlanadigan chegara | cross-ref kerak | HR | — |
| 18 | Reyting→bonus TAKLIF, HR/rahbar TASDIQ→Payroll | HR-014 | KPI'siz, tasdiqli | Bonus oqimi | Taklif+tasdiq | cross-ref kerak | HR | Q25 mos |
| 19 | Referral bonus lavozimga qarab, SOZLANADI | HR-021 | Recruitment | Referral | Sinovdan keyin to'lov | cross-ref kerak | HR | — |
| 20 | Statistik avto-ulanish (modullardan real raqam) | HR-037 | Qo'lda emas | HR metrik | Formulali avto | cross-ref kerak | HR | ORG-113 mos |
| 21 | Brak→mas'ul: IoT tabletga kiritiladi + qabulda tekshiriladi + manzilli javobgarlik | HR-057 ⭐ | Adolatli sabab | IoT/QC/MES | Tablet brak-kirim | Qisman — tablet ~70% (IOT-MES-CURRENT-STATE) | HR | → IoT/QC |
| 22 | TB-xavfsizlik CHEK-LIST har ish oldidan IoT tabletda, xodim tasdiqlaydi | HR-079 ⭐ | Xavfsizlik | IoT/MES | Chek-list ekran | Yo'q — hozir tizimda YO'Q (COR-130 GAP) | HR | Quriladi |
| 23 | Bekor turish: AI kamera nazorat, bahoga ta'sir FAQAT TASDIQ bilan | HR-082 ⭐ | Avto-jarima emas | HR/downtime | Tasdiqli ta'sir | cross-ref kerak | HR | Global printsip |
| 24 | Energiya tejash = javobgarlik bandi (hozir o'lchovsiz→keyin IoT счётчик) | HR-042 | Fazaviy | HR/IoT | Band, keyin metrik | cross-ref kerak | HR | — |
| 25 | GLOBAL PRINTSIP: AI kuzatadi/belgilaydi, salbiy ta'sir FAQAT inson tasdig'i bilan | Global bo'lim | Adolat, hech avto-jarima emas | Butun tizim | Barcha jarima/blok tasdiqli | cross-ref kerak | AI/HR/Global | Build rail #1 |
| 26 | ZIDDIYAT: narx = FIFO/FEFO | FIN-036 | Kanonik narxlash | Inventar narx | FIFO/FEFO | Qisman — QC→stock path real, FIFO/FEFO batch tasdiqlanmagan (SB0534) | Finance | Ziddiyat hal |
| 27 | ZIDDIYAT: QQS = faqat ICHKI (rasmiy fiskal yo'q) | FIN-055 | Ichki hisob | Soliq/GL | Fiskal yo'q | cross-ref kerak | Finance | Ziddiyat hal |
| 28 | Tushum 4-hisobga avto foiz taqsim; foizni faqat egasi/direktor | FIN-005/006 | Intizom | Cash taqsim | Avto-taqsim | cross-ref kerak | Finance | — |
| 29 | Vazn-farqi da'vo faqat hujjat+rasm bilan, qabul qilgan xodimga | FIN-038 ⭐ | Ko'r-avto emas | Kirim/da'vo | Dalilli chegirma | cross-ref kerak | Finance | Global printsip |
| 30 | Penya avto HISOBLANADI, qo'llash egasi/rahbar TASDIG'i bilan | FIN-062 ⭐ | Adolat | AR/penya | Tasdiqli penya | cross-ref kerak | Finance | Global printsip |
| 31 | Chegirma vakolat darajali (sotuvchi≤5%/rahbar≤15%/egasi>15%) sozlanadi | FIN-069 | RBAC kartadan | Narx/chegirma | Darajali vakolat | cross-ref kerak | Finance | — |
| 32 | Kredit limit mijozga; oshsa SD blok/tasdiq | FIN-060 | Kredit nazorat | SD gate | Limit gate | cross-ref kerak | Finance | SD-060 bilan bir |
| 33 | Finance qolgan ~25 savol = A (aging/FP-tsikl/kamomad/landed-cost/CoA/energiya-taqsim/kassa-limit/cash-flow) | FIN-008..085 | Standart qabul | Turli FIN | A-default | Qisman — CoA 42 hisob real (Area20); qolgan cross-ref | Finance | Jamlangan |
| 34 | Majlis turlari 4, LEKIN a'zolik/tuzilishi ORG-SXEMA bo'yicha | COR-037 ⭐ | Governance=org-chart | Coordination | Org-sxema a'zolik | cross-ref kerak | Coordination | Coordination-wide |
| 35 | Доклад formati 6-maydon O'ZBEKCHA + AI KAMERA доклад/протокол AVTO-tuzadi | COR-046 ⭐ | Avto protokol | AI/IoT kamera | Ovoz→transkripsiya→hisobot | cross-ref kerak | Coordination | → AI kamera |
| 36 | Распоряжение/topshiriq IJROSI = KANBAN'ga ko'chadi (Coordination'da emas) | COR-051/052/054/055 ⭐ | Chegaraviy printsip | Kanban↔COR | Relokatsiya Kanbanga | cross-ref kerak | Coordination | governance≠ijro |
| 37 | Приказ 4 kategoriya O'ZBEKCHA, raqam immutable (teshik yo'q) | COR-057/058 | Rasmiy hujjat | Prikaz reestr | Uzbek kategoriya+immutable | cross-ref kerak | Coordination | — |
| 38 | 24h reja avto→logistika/uchastka/ombor kartasiga (oltin-ip floor yadrosi) | COR-086 ⭐ | Floor koordinatsiya | Reja fan-out | Avto sutkalik reja | cross-ref kerak | Coordination | — |
| 39 | Downtime yozuvi sabab+vaqt+mas'ul→avto statistika (HR-082 bilan bir manba) | COR-087 ⭐ | Yagona manba | Downtime | Avto stat | cross-ref kerak | Coordination | — |
| 40 | Logistika STOP: techkarta-mos-emas→chiqish blok+dizaynerga; STOP faqat reja/dizayn rahbari | COR-088 ⭐ | Qattiq darvoza | Logistika gate | STOP oqimi | cross-ref kerak | Coordination | POS-032 mos |
| 41 | Priladka IoT TABLET orqali (operator sozlash vaqtini kiritadi) | COR-098 ⭐ | Floor tablet | IoT/MES | Tablet priladka | Qisman — tablet ~70% | Coordination | Kod tekshiruvi kerak edi |
| 42 | Smena chek-list IoT tabletda (material/qolip/dastgoh/xodim) | COR-130 ⭐ | Tayyorlik gate | IoT/MES | Chek-list | Yo'q — tizimda YO'Q, HR-079 bilan quriladi | Coordination | GAP |
| 43 | Podpisnoy gate: buyurtmachi imzosisiz IChQ'ga blok | COR-092 | Qattiq darvoza | Handoff gate | Imzo gate | cross-ref kerak | Coordination | — |
| 44 | Qolip tayyorligi holati → LEKIN ERP'da aynan qanday QAYTA ko'riladi | COR-093 ⚠️ | Aniqlanmagan | Qolip moduli | Build paytida aniqlanadi | Yo'q — ochiq (qayta ko'rish) | Coordination | Ochiq element |
| 45 | Coordination qolgan ~50 savol = A (kvorum/ovoz/davomat/arxiv/handoff/status-zanjir/AI-rejali dublikatlar) | COR-033..133 | Standart qabul | Turli COR | A-default | cross-ref kerak | Coordination | Jamlangan |
| 46 | Holat formulasi = 5 ko'rsatkich birga, har biriga sozlanadigan vazn | DIR-001 ⭐ | Yagona holat | Director holat | Weighted formula | Ha — RESOLVED director-holat.service configurable (Area09) | Director | "Biggest reversal" |
| 47 | Holat darajalari = 5 daraja (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ rangli) | DIR-029 ⭐ | Vizual holat | Director holat | 5-band klassifikator | Ha — RESOLVED band-threshold classifier (Area09) | Director | — |
| 48 | Kechikish/og'ish = majburiy sabab kategoriya→root-cause | DIR-037 | Tahlil | Director analitika | Sabab kategoriya | cross-ref kerak | Director | — |
| 49 | Karta produkt moslashuvchan 2-4 (lavozimga qarab) | DIR-033 | Moslashuvchan | Karta ЦКП | 2-4 slot | Qisman — multi-product slot UI yo'q (SB0005) | Director | — |
| 50 | Director qolgan ~71 savol = printsip-default (OKR karta, avto-dashboard, AI tahlil+tasdiq) + A-System defer | DIR-006..085 | Printsip qabul | Director | A-default | Qisman — 5 owner raqam/Telegram real (owner-summary.service, Area09) | Director | Jamlangan |
| 51 | Priklad % (qirqim qoldig'i) = mahsulot turiga qarab (master-data) | SD-033 | Har turga alohida | SD narx | Per-tur % | cross-ref kerak | SD | — |
| 52 | Klishe/shtamp: mijoz to'laydi→zavodda ~3 yil saqlanadi→takror olinmaydi | SD-042/125 ⭐ | Bir martalik | SD klishe | Saqlash+ogohlantirish | cross-ref kerak | SD | — |
| 53 | Buyurtma bekor jarimasi bosqichli: maket 30%/bosildi 70%/tayyor 100% (sozlanadi) | SD-069 | Bosqichli jarima | SD bekor | Foizli jarima | cross-ref kerak | SD | — |
| 54 | Tirajdan og'ish = ±10% (real chiqqan miqdordan hisob) | SD-068 | Ishlab chiqarish real | SD hisob | ±10% tolerans | cross-ref kerak | SD | — |
| 55 | SD qolgan ~20 savol = A (MOQ/chegirma/kotirovka/preyskurant/kredit-limit/bo'yoq-formula/oltin-ip signal) | SD-015..119 | Printsip qabul | SD | A-default | cross-ref kerak (SD reversal Area14) | SD | Jamlangan |
| 56 | Split = qisman YETKAZISH ruxsat, ISH bo'linmaydi (100% tugamaguncha) | PP-063 ⭐ | Kitob ziddiyati hal | PP split | Partiya-gate | cross-ref kerak | PP | — |
| 57 | Muzlatilgan zona = ~3 kun (faqat egasi/direktor ochadi) | PP-025 | Reja barqarorlik | PP muzlatish | Frozen window | cross-ref kerak | PP | — |
| 58 | Status sikli = to'liq 7 status + har o'tish jurnal | PP-082 | To'liq lifecycle | PP status | 7-status enum | cross-ref kerak (Area06 PP mixed) | PP | — |
| 59 | To'plam gate = to'liq komplekt qadoqdan oldin shart | PP-105 | Komplekt nazorat | PP gate | Set-gate | cross-ref kerak | PP | — |
| 60 | ZIDDIYAT#5: Reja ufqi = ko'p qatlamli (oylik→haftalik→kunlik→soatlik) | PP-001/067 | Ufq ziddiyati | PP reja | Multi-layer | cross-ref kerak | PP | Ziddiyat hal |
| 61 | PP qolgan ~67 savol = A (AI-reja/CRP-22stanok/norma/karta-razryad/zaxira/bo'sh-turish adolat) | PP-003..133 | Printsip qabul | PP | A-default | cross-ref kerak | PP | Jamlangan |
| 62 | Material yechish = norma avto-hisob + operator/usta TASDIG'i | MES-006 ⭐ | Xato sarf bloklanadi | MES material | Tasdiqli yechim | Qisman — 1.5 warehouse-issue guard DONE (board); MES data yo'q | MES | — |
| 63 | Sessiya = 3 bosqich (sozlash→asosiy→yakunlash) OEE aniq | MES-001 | OEE aniqlik | MES sessiya | 3-stage lifecycle | Qisman — schema bor, ishlatilmaydi (Area10) | MES | — |
| 64 | OEE darajasi = hamma (mashina+smena+brigada+sex) | MES-014 | To'liq OEE | MES OEE | Multi-level OEE | Qisman — OEE bor, spec'dan sodda (Area10) | MES | — |
| 65 | MES bonus = ball→A/B/C→TAKLIF→HR tasdiq | MES-027 | HR-014 mos | MES bonus | Tasdiqli bonus | cross-ref kerak | MES | Global printsip |
| 66 | MES qolgan ~45 savol = A (downtime/OEE-target/tablo/eskalatsiya/brigada/texkarta-adherence/AI-reja) | MES-005..082 | Printsip qabul | MES | A-default | Qisman — session VIEW, crew endpoint real (Area10) | MES | Jamlangan |
| 67 | AQL = standart 2.5 (partiyaga qarab namuna+qabul/rad) | QC-003 | Standart sampling | QC namuna | AQL 2.5 | cross-ref kerak | QC | — |
| 68 | Defekt og'irlik = 3 daraja (kritik 0%/jiddiy/kichik-kosmetik chegara) | QC-005 | Toifali qabul | QC defekt | 3-daraja | cross-ref kerak | QC | — |
| 69 | Sort = 1/2/3-sort+brak, har biriga narx koeffitsienti | QC-072 | Yaroqli tashlanmaydi | QC sort | Sort narxlash | cross-ref kerak | QC | — |
| 70 | Brak sababchisi = "kirim braki" va "shu bosqich braki" alohida | QC-090 | Adolatli sabab | QC brak | Manba ajratish | cross-ref kerak | QC | — |
| 71 | QC qolgan savollar = A (sertifikat PDF/fizik-normalar/DPMO/Pareto/COQ/kalibrovka/retest/karantin/8D) | QC-001..127 | Printsip qabul | QC | A-default (master-data) | Qisman — defect_catalog 23 qator real (Area18); qolgan cross-ref | QC | Jamlangan |
| 72 | Topologiya = tuzilmali manzil (Zona→Qator→Javon→Yacheyka) avto bo'sh-joy | WMS-073 | Aniq manzil | WMS topologiya | Structured bin | cross-ref kerak | WMS | Freeform BEKOR (G-ziddiyat) |
| 73 | Ombor-saqlash faqat TAYYOR MAHSULOT; saqlash haqi MENEJERGA (mijozga emas) | WMS-019/020 ⭐ | Davalcheskoye emas | WMS saqlash | Menejer-charge | cross-ref kerak | WMS | COR-104 mos |
| 74 | Tolerans = qabul ±2%/sanoq ±1% (oshsa rahbar tasdiq+sabab) | WMS-047/060 | Sifat nazorat | WMS tolerans | Tolerans gate | cross-ref kerak | WMS | POS-064 mos |
| 75 | Min/max = dinamik AI (3-6 oy sarfidan avto qayta-hisob) | WMS-067 | Mavsumga moslashuv | WMS reorder | Dinamik min/max | cross-ref kerak | WMS | — |
| 76 | ZIDDIYAT#1 narx=FIFO/FEFO; ZIDDIYAT#8 kanonik stok=warehouse_stock | WMS-079/110/001 | Kanonik tanlov | WMS stok/narx | warehouse_stock canon | Qisman — warehouse_stock canon RESOLVED (SB0289); FIFO batch qisman (SB0534) | WMS | Ziddiyat hal |
| 77 | WMS qolgan ~53 savol = A (3-way/qisman-qabul/rulon/namlik/kod/inventarizatsiya/dead-stock/avto-PR) | WMS-004..076 | Printsip qabul | WMS | A-default | Qisman — unit_of_measures 19, work_centers 12 real (Area18) | WMS | Jamlangan |
| 78 | Vendor reyting = sifat40+muddat30+narx20+hujjat10 (sozlanadi) | MM-002/040 | Foydali tanlov | MM vendor | Weighted rating | cross-ref kerak | MM | — |
| 79 | Valyuta = material KELGAN kuni MB kursi + asl valyuta saqlanadi | MM-054/058 | Valyuta ziddiyati hal | MM valyuta | Kirim-kuni kurs | cross-ref kerak | MM | — |
| 80 | Tender = 3+ so'rovnoma→5-ustun taqqoslash→ball→odam tasdiq; boshqa→sabab majburiy | MM-056/057 | Shaffof tanlov | MM tender | Comparison table | cross-ref kerak | MM | — |
| 81 | MM qolgan ~57 savol = A (vendor-karta/PO-format/3-way±3%/landed-cost/marshrut-Incoterms/safety-stock) | MM-001..089 | Printsip qabul | MM | A-default | cross-ref kerak | MM | Jamlangan |
| 82 | O'tish bali = kurs turiga qarab (xavfsizlik/TX 100%/oddiy 60-80%, HR sozlaydi) | LMS-009 | Kurs-turi | LMS imtihon | Per-kurs ball | cross-ref kerak | LMS | — |
| 83 | Darslik→oylik = Ha (darslik tugamasa o'sha karta oyligi YO'Q, oylik-gate) | LMS-027 ⭐ | Karta oylik-gate | Payroll gate | LMS-card-gate | Ha — RESOLVED lms-card-gate.service (Area03) + G7/G8 wired (board) | LMS | Q27 tasdiq |
| 84 | Murabbiy malakasi = min razryad + o'sha karta sertifikati | LMS-057 | Murabbiy sifat | LMS murabbiy | Malaka gate | cross-ref kerak | LMS | — |
| 85 | Murabbiy reyting = IKKI TOMONLAMA (yaxshi shogird→bonus, yomon→minus) | LMS-082 ⭐ | Natijaga javobgar | LMS reyting | Two-way rating | cross-ref kerak | LMS | Egasi override |
| 86 | LMS qolgan ~6 savol = A (micro-modul/sertifikat 1yil/kaizen→bonus/simulyatsiya) | LMS-011..078 | Printsip qabul | LMS | A-default | Ha — Area03 "eng to'liq hal" | LMS | Jamlangan |
| 87 | Voronka = Namuna→Klishe/STP→Narx→Shartnoma→Buyurtma (zavod jarayoni) | CRM-002 | Zavod voronka | CRM pipeline | Stage set | cross-ref kerak | CRM | — |
| 88 | Kanallar = HAMMASI (Telegram/WhatsApp/SMS/Email) + menejer TASHRIFI (field/outbound) | CRM-007 ⭐ | To'liq qamrov | CRM kanal | Multi-kanal+tashrif | cross-ref kerak | CRM | SD-076 mos |
| 89 | Egasizlantirmaslik = ~60 kun faolliksiz→qayta taqsim | CRM-063 | Faol boshqaruv | CRM mijoz | Idle-reassign | cross-ref kerak | CRM | — |
| 90 | Narx qayta-hisob = qog'oz ~5% oshsa→ta'sirlangan mijoz+vazifa | CRM-057 | Narx-feed | CRM narx | Auto-recalc trigger | cross-ref kerak (deal-won.listener real, Area15) | CRM | — |
| 91 | CRM qolgan ~8 savol = A (lead-scoring/segment ABC/yutqazish-sabab/telefoniya/STP-versiya/import) | CRM-012..085 | Printsip qabul | CRM | A-default | cross-ref kerak | CRM | Jamlangan |
| 92 | Kanallar = 8 (Instagram/Telegram/FB/sayt/ko'rgazma/qo'ng'iroq/tavsiya/diler) | MKT-031 | Kanal master-data | Marketing kanal | 8 kanal | cross-ref kerak | Marketing | — |
| 93 | Lid SLA = 15 daq javob; 4soat→signal; 24soat→boshqa sotuvchi | MKT-048 | Javob tezligi | Marketing SLA | SLA eskalatsiya | cross-ref kerak | Marketing | — |
| 94 | ROI = foyda asosli ((sotuv foydasi−xarajat)/xarajat, tannarxdan avto) | MKT-051 | Foyda ROI | Marketing analitika | Profit ROI | cross-ref kerak | Marketing | — |
| 95 | Egaga 5 raqam = Yangi/Yo'qolgan/Kichiklashayotgan mijoz+Trend+Eng katta xavf | MKT-116 ⭐ | Egasi diqqati | Owner digest | 5-number summary | Qisman — owner-summary.service real (Area09) | Marketing | — |
| 96 | Marketing qolgan savol = A (UTM/lid-sifat/taqsim/atribusiya/inbox/kontent/Bitrix-import) | MKT-003..091 | Printsip qabul | Marketing | A-default | cross-ref kerak | Marketing | Jamlangan |
| 97 | Taxta = 4 ustun (Reja/Jarayonda/Tekshiruvda/Bajarildi); 3-savat=shaxsiy ish stoli | KAN-015 | Kanban+savat | Kanban UI | 4-ustun+savat | cross-ref kerak | Kanban | — |
| 98 | Vazifa→karta = Ha (kartaga/GSD bog'lanadi, bajarilsa avto hissa) | KAN-014 | Karta-hissa | Kanban↔karta | Card-link | cross-ref kerak | Kanban | — |
| 99 | Tasdiq = vazifani TOPSHIRGAN odam tasdiqlaydi (boshliq shart emas) | KAN-027/032 ⭐ | Распоряжение-loop | Kanban tasdiq | Submitter-approve | cross-ref kerak | Kanban | Override |
| 100 | Rollover = 3 marta ko'chsa→majburan boshliqqa | KAN-009 | Eskalatsiya | Kanban rollover | 3-strike | cross-ref kerak | Kanban | — |
| 101 | Kanban qolgan ~99 savol = A (3-savat CC-manba/observer/eslatma/gorizontal/status/kunlik-GSD) | KAN-001..033 | Printsip qabul | Kanban | A-default | cross-ref kerak | Kanban | Jamlangan; 3-savat manba=CC (zidd#3) |
| 102 | Sensor rollout = HAMMA mashinaga BIRDAN (to'liq qamrov) | IOT-001 ⭐ | To'liq qamrov | IoT rollout | All-at-once | Yo'q — sensor hali O'RNATILMAGAN (Excel/qo'lda) | IoT | Override; fazaviy |
| 103 | A-System = EuroPrint TO'LIQ o'rnini bosadi, eski arxivga (bitta haqiqat) | IOT A-System / DIR-039 | Ikki dunyo yo'q | Butun tizim | Single source | cross-ref kerak | IoT | Build rail #6 |
| 104 | Andon = katta tablo (barcha mashina holati+qizil+jonli) | IOT-021 | Floor ko'rinish | IoT tablo | Andon board | cross-ref kerak | IoT | — |
| 105 | Energiya = mashina darajasida→tannarxga (sensorgacha umumiy счётчикdan) | IOT-018/030 | Fazaviy energiya | IoT/tannarx | Per-mashina→umumiy | cross-ref kerak | IoT | — |
| 106 | IoT qolgan ~42 savol = A fazaviy (anomaliya→Telegram/RUL/PM-jadval/energiya-hisobot/brak%) | IOT-006..061 | Printsip (sensorgacha) | IoT | A-default fazaviy | Yo'q — sensor yo'q, fazaga bog'liq | IoT | Jamlangan |
| 107 | Tarixiy import = Ha (eski tizim tarixi→AI o'rganadi; A-System arxivga) | AI-042 ⭐ | AI training | AI/import | One-time import | cross-ref kerak | AI | — |
| 108 | Kamera kross-check = Ha (xodim hisoboti↔kamera; nomoslik→signal) | AI-028 ⭐ | Halollik nazorat | AI kamera | Cross-check | cross-ref kerak | AI | — |
| 109 | AI-suhbat = ikkalasi (ЦКП/darslik o'qitish + ERP-data javob, RBAC) | AI-025 | Ta'lim+ma'lumot | AI chat | Dual-mode | cross-ref kerak (Aisha modul real, Area12) | AI | — |
| 110 | Ohang = quriluvchi (kamchilik+yaxshilash qadami; jazo emas) | AI-059 | O'sish ohangi | AI ohang | Constructive tone | cross-ref kerak | AI | — |
| 111 | AI qolgan ~49 savol = A (moslik/digest/prognoz/finance-AI/bottleneck/halol-noaniqlik/audit-izi) | AI-004..061 | Printsip qabul | AI | A-default | cross-ref kerak (Area12 "eng katta reversal") | AI | Jamlangan |
| 112 | Kanal = aralash (shaxsiy→shaxsiy chat, bo'lim→guruh) | NTF-008 | Marshrut | Bildirishnoma | Mixed channel | cross-ref kerak | NTF | — |
| 113 | Tinchlik vaqti = ish vaqtida normal, tunda faqat shoshilinch (egasi sozlaydi) | NTF-018 | Quiet hours | Bildirishnoma | Quiet window | cross-ref kerak | NTF | — |
| 114 | Telegram boshqaruv = Ha (tasdiqla/rad/topshiriq tugma) | NTF-021 | Interaktiv | Bildirishnoma | Inline tugma | cross-ref kerak | NTF | — |
| 115 | O'qildi tasdiq = faqat muhim/shoshilinch xabarda | NTF-016 | "Ko'rmadim" bahonasi yo'q | Bildirishnoma | Read-receipt | cross-ref kerak | NTF | — |
| 116 | NTF qolgan ~60 savol = A (mening-holatim/digest/vertikal-manager_id/leaderboard/eskalatsiya/jurnal) | NTF-002..041 | Printsip qabul | NTF | A-default | cross-ref kerak | NTF | Jamlangan |
| 117 | Texkarta guard = qizil ogohlantirish + QAT'IY BLOK (faqat smena/reja boshlig'i) | POS-032 | Qattiq gate | POS Monitor | Hard block | cross-ref kerak | POS | COR-088 mos |
| 118 | Material topshirish = topshirish AKTI (2 imzo)+audit-log | POS-050 ⭐ | Rasmiy akt | POS material | 2-signature akt | cross-ref kerak | POS | Zidd#4 nuance hal |
| 119 | Foto-dalil = Ha majburiy (buzuq/brak/katta farqda planshet kamerasi) | POS-069 | Dalil | POS qabul | Mandatory foto | cross-ref kerak | POS | — |
| 120 | POS qolgan ~20 savol = A (sikl-sanash/AI-anomaliya/chiqindi/poddon/prostoy/qisman-qabul/rezerv) | POS-017..081 | Printsip qabul | POS | A-default | Qisman — POS Monitor≠kassir tasdiqlangan (Area13) | POS | Jamlangan |
| 121 | Tasdiq marshruti = ORG-SXEMA yuqoriga, oxiri DIREKTORGA (summa-tier emas) | CC-028 ⭐ | Kuchli markaziy | CC tasdiq | Org-route→director | cross-ref kerak | CC | Override; build rail #5 |
| 122 | Kaskad = Ha (hujjat tasdiqlangach shablonga ko'ra avto-vazifa→Kanban) | CC-014 | Распоряжение-loop | CC↔Kanban | Cascade task | cross-ref kerak | CC | — |
| 123 | Hujjat AI = Ha (tasdiqdan oldin AI tahlil: mos/risk/tavsiya; qaror odamda) | CC-022 | Faza-2 AI | CC AI | Doc-AI review | cross-ref kerak | CC | — |
| 124 | Qaror asoslik = Ha ("asos: qaysi hujjat/raqam" maydon) | CC-042 | Nizoda himoya | CC audit | Basis field | cross-ref kerak | CC | — |
| 125 | CC qolgan ~20 savol = A (gorizontal-vakolat/maydon×rol/buyurtma-100%-gate/PIN-imzo/protokol) | CC-037..083 | Printsip qabul | CC | A-default | cross-ref kerak | CC | Jamlangan; 3-savat manba |
| 126 | AR-1 Responsive WEB (kompyuter+planshet+telefon), native app YO'Q | Vizyon A / AR-1 | Bitta kod baza | Arxitektura | Responsive-only | cross-ref kerak | Org/Arxitektura | Vizyon qo'shimcha |
| 127 | AR-2 Xato UX: kichik→toast, katta→modal | Vizyon A / AR-2 | UX standart | EP Design | Toast/modal | cross-ref kerak | Org/Arxitektura | — |
| 128 | AR-3 SSO/JWT, 30+ terminal, to'liq OFFLINE, audit 7 yil, UZ+RU | Vizyon A / AR-3 | Infra talab | Auth/infra | SSO+offline+audit | Qisman — card-login-gate real (Area05); offline cross-ref | Org/Arxitektura | — |
| 129 | TS-1 AI = Gemini API + Gemini LIVE (WebSocket) video-intervyu | Vizyon B / TS-1 | Tech qaror | AI stack | Gemini integratsiya | cross-ref kerak | AI | Majburiy tech |
| 130 | TS-2..5 Telegraf.js / BullMQ+EventEmitter2+outbox / WebRTC / server-PDF+ZPL/EPL | Vizyon B / TS-2..5 | Tech qaror | Stack | Belgilangan kutubxonalar | Qisman — outbox/event real (Area07 reversal) | AI/NTF/Arxitektura | Jamlangan tech |
| 131 | KAS-1 Kassir smena ochish/yopish+qoldiq+X/Z hisobot | Vizyon C / KAS-1 | Naqd nazorat | Finance sub-modul | Kassir moduli | Qisman — cashier_movements 9 qator, pin_hash bor (Area20) | Finance | POS≠kassir GAP |
| 132 | KAS-2 Oylik/avans tarqatish kassir orqali, har operatsiya PIN | Vizyon C / KAS-2 | PIN tasdiq | Finance kassir | Kassir-payroll+PIN | cross-ref kerak | Finance | — |
| 133 | POS-D1 Harakat taksonomiyasi (EXTERNAL_IN 5-bosqich/OUT/INTERNAL_ISSUE/RETURN/TRANSFER/DAMAGE) | Vizyon D / POS-D1 | Aniq oqim | POS/WMS harakat | Movement taxonomy | cross-ref kerak | POS/WMS | — |
| 134 | POS-D2 Minus saldo: aktiv→TO'LIQ BLOK; iste'mol→OGOHLANTIRISH+ruxsat | Vizyon D / POS-D2 | Adolatli blok | Stok nazorat | Type-based guard | Qisman — 1.5 ASSET hard-block/CONSUMABLE guard DONE (board) | POS/WMS | — |
| 135 | POS-D3 Barcode EAN-13+Code-128; kamera ZXing; topilmasa→toast+yangi karta+admin Telegram | Vizyon D / POS-D3 | Skanerlash | POS barcode | Barcode stack | cross-ref kerak (barcode-queue DONE, board) | POS | — |
| 136 | POS-D4 Xodim "Mening inventarim"; chiqishda hamma qaytariladi→keyin HR access | Vizyon D / POS-D4 | Moddiy javobgarlik | HR/inventar | Inventar sahifa | cross-ref kerak | POS/HR | — |
| 137 | HR-D1 AI rekruter 80%; 3-bosqich rezyume→AI live video(Gemini LIVE+WebRTC)→jonli | Vizyon E / HR-D1 | AI recruitment | HR recruitment | AI video-intervyu | cross-ref kerak | HR | — |
| 138 | HR-D2..D4 Surishtirish forma / testlar (Tool/IQ/Origin/Replication) / onboarding-checklist+2-mentor | Vizyon E / HR-D2..D4 | Recruitment+onboarding | HR | Forma+test+onboard | cross-ref kerak | HR | Jamlangan |
| 139 | WEB-1 Web B2B portal (mijoz web'dan buyurtma + web-lead→CRM) | Vizyon F / WEB-1 | B2B kanal | SD/CRM web | B2B portal | cross-ref kerak | SD/CRM | — |
| 140 | GT-1 Golden thread: avans 70% (lead→deal→SD→70%→IChQ→MES→QC→Ombor→Yetkazish→GL) | Vizyon F / GT-1 | Oltin ip yadrosi | Butun oqim | 70% fan-out | Qisman — golden-thread/outbox real (Area07 "biggest surprise") | SD/Coordination | Build rail |
| 141 | ZIDDIYAT-G: Bin location = TUZILMALI (Zona→Qator→Javon→Yacheyka); freeform BEKOR | Vizyon G | WMS-073 ustun | WMS bin | Structured bin | cross-ref kerak | WMS | Ziddiyat hal |
| 142 | HR-H1 Davomat 2 timestamp (xudud+ish-joyi); unikal ish-vaqti; kech→avto-hujjat(jarima tasdiqli); 3 kun sababsiz→BARCHA huquq blok | Vizyon H / HR-H1 | Aniq davomat | HR davomat | 2-timestamp+block | cross-ref kerak | HR | Chuqur tafsilot |
| 143 | HR-H2 360 baho: o'lchab bo'lmaydigan xodim→xizmat ko'rsatgan odamlar baholaydi | Vizyon H / HR-H2 | Adolatli baho | HR 360 | Service-based rating | cross-ref kerak | HR | — |
| 144 | HR-H3 Kunlik hisobot bot orqali ЦКП'dan→profil; uskunachi→avto PDF invoys; 3 soatda yubormasa "ishlamagan" | Vizyon H / HR-H3 | Kunlik hisobot | HR hisobot | Bot→PDF invoys | cross-ref kerak | HR | — |
| 145 | HR-H4 JARIMA tizimi TO'LIQ QAYTA YARATILADI (100 qoida nomutanosib→butun katalog qayta) | Vizyon H / HR-H4 ⚠️ | Nomutanosiblik | HR jarima | Full rebuild | Yo'q — revision talab | HR | Ochiq revision |
| 146 | HR-H5..H8 Qarz→oylikdan avto-chegirma / gamification / tabrik(egasi istisno) / AI-transkripsiya+partitioning | Vizyon H / HR-H5..H8 | Turli HR | HR | Jamlangan tafsilot | cross-ref kerak | HR | Jamlangan |
| 147 | POS-FIX1..5 supplier_tin/currency/per-qator og'irlik-sertifikat/narx-validatsiya/GL-kanonik ulanish | Vizyon I / POS input-audit | Saqlanmagan maydon | POS Kirim Wizard | 5 build-fix | Qisman — POS GL subledger (POS-FIX5) STILL-OPEN (auto-gl-posting.service:20, Area20) | POS | Fix ro'yxati |
| 148 | J: IoT-tablet ~70% QURILGAN (brak/downtime/inline-QC/handover real) — build shu asosda | Vizyon J | Holat yangilanishi | IoT/MES | Bugungi holat asos | Qisman — tablet real, GAP'lar CURRENT-STATE hujjatda | IoT/MES | Eslatma |

### Step 3 — Ochiq savollar
| Savol/Muammo | Qachon ko'tarilgan | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| PP-109 kod prefiks ma'nolari (KT/PT/E/GL...) | 2026-06-08 | OCHIQ-JAVOBLAR PP + yakuniy ro'yxat | Egasi MA'NOLARNI keyin kiritadi (master-data owner-input) | PP |
| MM Yoqilg'i/Transport = alohida 10-savollik deep-dive | 2026-06-08 | OCHIQ-JAVOBLAR MM-062/063/064 | Katta mavzu, alohida owner deep-dive kutilmoqda | MM |
| POS-037 Makulatura ombor | 2026-06-08 | OCHIQ-JAVOBLAR POS-037 | Egasi FAYL yuboradi→o'rganib loyihaga qo'shiladi | POS |
| COR-093 Qolip tayyorligi ERP'da aynan qanday | 2026-06-08 | OCHIQ-JAVOBLAR COR-093 ⚠️ | Build paytida / qolip-moduli bilan qayta ko'riladi | Coordination |
| HR-H4 Jarima katalogi (100 qoida) qayta yaratilishi | 2026-06-08 | OCHIQ-JAVOBLAR Vizyon H / HR-H4 | Butun jarima katalogi nomutanosib→to'liq revision talab | HR |
| IOT-001 Sensor rollout (hardware) | 2026-06-08 | OCHIQ-JAVOBLAR IoT | Sensorlar hali fizik O'RNATILMAGAN; mashina-ЦКП/energiya fazaviy | IoT |
| DIR-039 / A-System ко'chish (barcha A-System savollari) | 2026-06-08 | OCHIQ-JAVOBLAR ORG-133/DIR-039 | IoT bosqichiga DEFER (sensor o'rnatilgach) | IoT |
| ЦКП target/formula owner-data (tskp_target, ckp_formula_type 1/145) | 2026-07-04 status | RECONCILIATION SB0004 | Mexanizm bor, owner-data to'ldirilmagan | Org/Director |
| POS→kanonik GL ulanish (pos_gl_postings subledger) | 2026-07-04 status | RECONCILIATION Area20 / POS-FIX5 | auto-gl-posting.service.ts:20 subledger, canonical `entries`ga ulanmagan | POS/Finance |
