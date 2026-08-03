## Yo'naltirilgan intervyu — OMBOR · POS · KASSIR · TA'MINOT (Manba I2)

**Manba:** `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` (asli `EUROPRINT-INTERVYU-SAVOL-JAVOB.md`, 59 savol, egasi to'g'ridan-to'g'ri javoblari, 1-4 iyun). **Qachon:** 2026-06-08 (intervyu 1-4 iyun).

### Step 2 — Qarorlar jadvali (OMBOR/POS/KASSIR)

| # | Savol/Talab | Qayerda (savol#) | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|
| 1 | POS Monitor hozirgi holati egasi xohlagani EMAS — to'liq qayta loyihalash | §0, s2 | "umuman man xohlagan narsa emas" | POS Monitor FE+BE | BE+FE to'liq tahlil + qayta dizayn | **cross-ref kerak** | board/memory: POS ~81% doc, lekin "qayta loyihalash" bajarilgani hujjatlanmagan |
| 2 | Hech kim qog'oz bilan kelmaydi — BARCHA chiqim (oylik/avans ham) CC + Kanban → kassirga | §0, s14 | qog'ozsiz, markazlashgan naqd nazorati | Finance-Kassir, CC, Kanban | Kassir+CC 3-savat+Kanban birlashuvi | Qisman | memory: kassir sub-modul qurilmoqda; birlashuv to'liq emas |
| 3 | ERP = MS Office kabi; saqlab-olish/eksport CHEKLANGAN (faqat sabab bilan) | §0, s14 | ma'lumot chiqib ketishini oldini olish | CC, umumiy export | Export gating | **cross-ref kerak** | — |
| 4 | Markaziy ombor YO'Q — 7 asosiy ombor (rulon/tayyor-mahsulot/hom-ashyo/xo'jalik/jihozlar/makulatura-brak/asbob-uskuna) | §1, s17 | real ombor taksonomiyasi | WMS | 7 ombor tipi + tegishli tiplar | **cross-ref kerak** | ombor taksonomiyasi WMS'da bormi — cross-ref |
| 5 | Karantin+Sifat ombori → QC moduli; Flekso+Ofset → PP; Mexaniklar alohida sahifa | §1, s17 | modul chegaralari | QC, PP, WMS | Ombor→modul biriktirish | **cross-ref kerak** | — |
| 6 | Ombor ko'rinishi = Excel jadval (kartochka EMAS) | §1, s16 | egasi UI talabi | WMS FE | Jadval-ko'rinish | **cross-ref kerak** | — |
| 7 | Hom-ashyo overflow: 5kg berilsa +2kg bo'lim ichki omboriga, hom-ashyo -2 belgilaydi; AI ikkala ombordan rasxod | §2, s22-24 | real chiqim mantiqi + isrofni nazorat | WMS, MES, AI | Overflow + DEPARTMENT_* ichki ombor | **cross-ref kerak** | A5: har bo'limda DEPARTMENT_* tip ichki ombor |
| 8 | HAR tashqi material → karantin/QC gate; QC dalolatnoma+parametr kiritmaguncha BLOK | §3, s31-33 | sifat gate, xavfsizlik | QC, WMS | QC-gate blok + kelish-bildirishnoma | **cross-ref kerak** | memory: QC kalibrovka qurilgan; material-gate blok cross-ref |
| 9 | Rulon qog'oz: har rulon kg+QR+taxminiy m²(AI); 500→400 bo'linmaydi lekin qaytish nazorat | §4, s35-37 | eng qimmat material nazorati | WMS, IoT | rulon karta kg+QR+m² | **cross-ref kerak** | — |
| 10 | Ish boshlashdan oldin IoT tablet so'roviga nisbatan skaner → keyin ish (o'zidan rasxod) | §4, s42 | material-ish bog'lash | IoT/MES | pre-work skan gate | **cross-ref kerak** | — |
| 11 | Makulatura+brak+QC-rad = bitta ombor; brak NORMASI har buyurtmaga; normadan oshiq → xodimdan ushlanadi | §5, s39-48 | isrof/o'g'irlik nazorati | WMS, HR-Payroll, QC | brak-norma + ushlab qolish trigger | **cross-ref kerak** | vision-1000-answers HR#5 bilan bog'liq (salbiy ball faqat rahbar tasdiq bilan) |
| 12 | Ishxonadan chiqadigan HAR narsa to'liq ERP rasxod (o'g'irlik oldini olish) | §5/§14, s48-49 | to'liq moddiy javobgarlik | WMS, IoT, Security | har chiqim ERP-yozuv | **cross-ref kerak** | — |
| 13 | Tayyor mahsulot KIRIM MES'dan (planning+MES real), faqat buyurtmaga, menejer javobgar | §6, s50-54 | tayyor-mahsulot manbai | MES, WMS, SD | MES→WMS kirim listener | **cross-ref kerak** | golden-thread MES→WMS cross-ref |
| 14 | Tayyor mahsulot CHIQIM: AI kamera suratga oladi+buyurtmaga bog'laydi, invoys QR o'qiydi, ombor+xavfsizlik tasdiqlaydi | §6, s52 | chiqim nazorati (kuchli AI kamera) | IoT/AI, WMS | AI-kamera chiqim-gate | **cross-ref kerak** | — |
| 15 | Tayyor mahsulot IJARA: 30 kun bepul → keyin kunlik m²ga pul → menejerga (sozlanadigan) | §6, s53 + A2 | ombor ijara daromadi | WMS, Finance | ijara-hisoblash cron + PDF | **cross-ref kerak** | A2: SOZLANADIGAN (muhim mijozga moslash) |
| 16 | Lahtak (qoldiq): aybdor profiliga/tayyor-mahsulot omboriga o'tadi; aybdorni ombor menejeri qo'lda belgilaydi | §6, s54 | qoldiq javobgarligi | WMS, HR | lahtak-javobgarlik | **cross-ref kerak** | — |
| 17 | 1 ta kassir: oylik+avans tarqatadi + HAMMA naqdni nazorat qiladi | §8, s9-14 | markaziy naqd nazorati | Finance-Kassir | kassir sub-modul | Qisman | memory: FinanceExtendedPayroll real qurilgan |
| 18 | Oylik/avans NAVBATI = xodim REYTINGIga qarab (reyting formulasi keyinga) | §8, s12 + §16 | reyting-asosli to'lov navbati | Finance, HR | reyting→navbat | **Yo'q** | egasi KEYINGA qoldirdi (s12: "chalg'ib ketamiz") — OCHIQ |
| 19 | Har xodim kunlik ishlagan pulini har kuni PDF oladi (Telegram+ERP) | §8, s63 + A4/A7 | shaffoflik | Finance, NTF | kunlik-PDF avto-gen | **cross-ref kerak** | A4: uskunachi=real ishlab chiqargani; ofis=oylik÷ish-kuni; A7: kun oxirida avto |
| 20 | HAR SO'M HISOBLI: pul olsa xodim profiliga → omborga kirim bo'lmaguncha profilda qarz | §8, s64 | to'liq podotchet | Finance-Kassir | profil-qarz tizimi | **cross-ref kerak** | — |
| 21 | Chek (taksi): xodim yuklaydi → AI o'qiydi+solishtiradi → ODAM (kassir/moliya) yakuniy tasdiqlaydi | §8, s68, s11 | E1 printsip (inson qaror) | Finance, AI | chek-AI + inson-tasdiq | **cross-ref kerak** | — |
| 22 | Oylik/avans/kredit — jarima va mukofot pullaridan ALOHIDA turadi | §8, s67 | pul-oqim ajratish | Finance-Kassir | alohida hisob | **cross-ref kerak** | — |
| 23 | Ta'minot-zanjiri: savdo→AI ombor tekshiradi→ta'minotchi so'rov→CC 3-savat→Kanban(org-sxema tasdiq)→xarid→logistika→ombor barcode kirim | §9, s5-6 | oltin-ip xarid tomoni | SD, MM, CC, Kanban, WMS, Logistics | to'liq procurement zanjiri | **cross-ref kerak** | memory: golden-thread qisman; MM 3-way match bor |
| 24 | Kanban UMUMIY emas — org-sxema bo'yicha faqat tegishlilarga ko'rinadi | §10, s14 | maxfiylik (avans arizasi faqat rahbarga) | Kanban | scoped-ko'rinish | **cross-ref kerak** | — |
| 25 | Kanban doskalari STANDART — faqat super admin yaratadi | §10, s14 | standartlashtirish | Kanban | doska-yaratish RBAC | **cross-ref kerak** | memory: Kanban zaif (15%) |
| 26 | AI planning `/erp-dashboard/planning`; data savdo menejeri (+ ishlab chiqarish rahbari qism) | §11, s37-38 | AI reja | AI, PP | AI-planning | **Yo'q/Qisman** | memory: AI-planning OCHIQ bo'shliq |
| 27 | Pres kirim: POS sahifa→kg kirit→printer shtrix-kod→yopishtir→ERP avto kirim + AI kamera | §12, s43-44 | yarim-tayyor kirim | POS, IoT | pres-kirim oqimi | **cross-ref kerak** | — |
| 28 | Raqamlash = Ombor+harakat-turi+yil+ketma-ket (HOM-KIRIM-2026-00001) | §13, s29 | hujjat raqamlash standarti | WMS, umumiy | raqam-seq format | **cross-ref kerak** | memory: prikaz raqam-seq qurilgan (o'xshash pattern) |
| 29 | PDF = bitta umumiy zamonaviy shablon; imzo = ERP login (avtomatik) | §13, s26-28 | hujjat standarti | umumiy | PDF-shablon + login-imzo | **cross-ref kerak** | — |
| 30 | O'g'irlik oldini olish: AI kamera+OVOZ tahlili; mashina+haydovchi to'liq yoziladi (xavfsizlik xodimi) | §14, s48-49 | to'liq nazorat | IoT/AI, Security | kamera+ovoz+mashina-jurnal | **cross-ref kerak** | — |
| 31 | Inventarizatsiya = sikl-sanash: rulon/hom-ashyo haftalik, qolgani oylik; tunda/dam kuni, zona muzlatiladi | §17 A6 | ish to'xtatmasdan sanash | WMS | cycle-count | **cross-ref kerak** | — |
| 32 | Jihozlar ombori (kompyuter/mebel/forma) ≠ Asbob-uskuna (qolip/STP/pichoq/klishe) | §17 A1 | taksonomiya aniqligi | WMS | 2 alohida ombor tip | **cross-ref kerak** | — |
| 33 | Flekso/Ofset ombori = PP routing zanjiri: hom-ashyo→flekso→ofset→kashirovka→tigel→qadoqlash; qoldiq nazorat | §17 A3 | ishlab chiqarish marshruti | PP | routing zanjiri | **cross-ref kerak** | ⭐ PP routing = shu zanjir |

### Step 3 — Ochiq savollar (OMBOR/POS/KASSIR)

| Savol/Muammo | Qachon ko'tarilgan | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Xodim reyting formulasi (oylik/avans navbatini belgilaydi) | 2026-06-08 (s12) | OMBOR-KASSIR §16 | Egasi ATAYLAB keyinga qoldirdi ("chalg'ib ketamiz"); ko'p narsa shunga bog'liq (18-qator to'lov navbati) | Finance/HR |
| POS↔Ombor eski/yangi oqim birlashtirish | 2026-06-08 (s1) | OMBOR-KASSIR §16 | Texnik, build-da hal qilinishi kerak; two-worlds bilan bog'liq | POS/WMS |
| CC 3-Savat hujjat oqimi TO'LIQ EMAS | 2026-06-08 (s14) | OMBOR-KASSIR §10 | Egasi "keyingi rejalarga to'liq qilish" dedi; ta'minot-zanjiri shunga bog'liq | CC |
| POS Monitor to'liq qayta loyihalash bajarilganmi | 2026-06-08 (s2) | OMBOR-KASSIR §0 | Egasi "xohlaganim emas" dedi; qayta-dizayn holati hujjatlarda tasdiqlanmagan | POS |
| AI planning haqiqatan qurilganmi | 2026-06-08 (s37-38) | OMBOR-KASSIR §11 | memory: AI-planning OCHIQ bo'shliq sifatida belgilangan | AI/PP |
