# FINANCE / GL — Decision Map (EP-FIN) — 2026-06-08

> Manba savollar: v1 (32) + v2 (54) = **86**. Kodlar: v1 → EP-FIN-001..032, v2 → EP-FIN-033..086 (fayl tartibida).
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` (460 real javob — POS Q41-46/Q43 GL, Q35 FIFO, Q119/Q182 xodim qarzi, HR Q58/Q181 payroll, Q77-83/Q108 hujjat-workflow + immutable, Org-7 = 5-Moliya otdeleniye), `SHvB-40-Yonalish-Prompt.md` (ZVS/ZNO, 4-hisob, FP-tsikl, approval 500k/5M/director, unpaid aging), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-kod, action turlari), vizyon master reja (ShVB 2020 + karta-model).
> v1 kontekst: ZVS/ZNO backend bor (jadval/ekran yo'q), FP-tsikl cron ishlaydi, 4-hisob+matritsa qisman. Har savol birinchi varianti (A) = vizyonga eng mos = tavsiya.

## Xulosa
- **Jami:** 86
- **✅ JAVOBLANGAN:** 56 (ShVB reglament + 460 javob + kitob hujjatlari + oltin-ip/karta-model vizyon bilan bevosita tasdiqlangan)
- **🔵 OCHIQ:** 30 (egasi keyin hal qiladi; har biriga A-default tavsiya — ShVB/kitob/karta-modelga eng mos variant; 3 ta KONFLIKT belgilangan: EP-FIN-036 FIFO╳weighted-avg, EP-FIN-055 QQS rasmiy-darajasi, + sub-savollar)

---

## I QISM — v1 (32 savol) — EP-FIN-001..032

### EP-FIN-001 · ZVS arizasi (haftalik byudjet so'rovi) ekrani
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq ekran (kiritish + ro'yxat + holat), ShVB blankiga mos. ShVB reglamentida ZVS yadro forma; FP-tsikl arizadan boshlanadi.
- **Manba:** SHvB-40 YO'NALISH 1 (ZVS forma + Kanban) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (3-savat), Org-karta (bo'lim), Byudjet

### EP-FIN-002 · ZNO arizasi (majburiyat/to'lov so'rovi) ekrani
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq ZNO ekran (yetkazib beruvchi, summa, hujjat, ZVS ga bog'lab). ShVB: ZVS byudjet ajratadi, ZNO real to'lovni boshlaydi.
- **Manba:** SHvB-40 YO'NALISH 2 (ZNO entity + dashboard) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Kreditor (AP), MM (yetkazib beruvchi), Kassa/bank

### EP-FIN-003 · ZVS/ZNO ni 3-savatli koordinatsiyaga ulash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik koordinatsiya savatiga + 24/48 soat muddat. Hujjat org-sxema bo'yicha yuradi, sakramaydi.
- **Manba:** BARCHA_JAVOBLAR Org-7 §4/§7 (hujjat vert+goriz) + HR Q79-80 (avans ariza marshruti) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, NTF (eslatma), Org-karta (marshrut)

### EP-FIN-004 · 4-hisob ajratish (MAIN / TAX / HEAD / WORKING)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'rttala hisob alohida + har biri balans/harakat. ShVB poydevori (Справка о счетах).
- **Manba:** SHvB-40 YO'NALISH 3 (AccountType enum MAIN/TAX/HEAD/WORKING_CAPITAL) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** GL, Kassa/bank, Dashboard

### EP-FIN-005 · Tushumni 4-hisobga avtomatik taqsimlash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik foiz bilan taqsim (intizom kafolati). ShVB ruhi avtomatga moyil, lekin foiz-qiymat va trigger nuqtasi egasidan.
- **Manba:** v1-A (A-default) — egasidan tasdiq kutiladi
- **action:** EVENT
- **⤳ Ta'sir:** Kassa (kirim trigger), GL, 4-hisob

### EP-FIN-006 · Taqsim foizlarini kim belgilaydi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat egasi (direktor) o'zgartiradi, qolganlar ko'radi. Pul taqsimoti = eng xavfli sozlama.
- **Manba:** v1-A (A-default) + karta-model (vakolat kartaga)
- **action:** UPDATE
- **⤳ Ta'sir:** RBAC (egasi-only), 4-hisob, Audit-log

### EP-FIN-007 · Tasdiqlash matritsasi: summalik bosqichlar (500k / 5M / direktor)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 bosqich (bo'lim ≤500k / Рек.Совет ≤5M / direktor >5M) avtomatik tanlanadi. ShVB reglament aniq chegara beradi.
- **Manba:** SHvB-40 YO'NALISH 6 (approval-matrix getRequiredLevel) + v1-A
- **action:** APPROVE
- **⤳ Ta'sir:** ZVS/ZNO, Coordination (Рек.Совет), Org-karta

### EP-FIN-008 · Tasdiqlash chegaralari sozlanadigan bo'lsinmi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sozlamada ekrandan o'zgartiriladigan chegara (inflyatsiya bilan moslashuvchan, dasturchi kerak emas).
- **Manba:** v1-A (A-default)
- **action:** UPDATE
- **⤳ Ta'sir:** Approval-matrix, Settings, Egasi (vakolat)

### EP-FIN-009 · Tasdiqlovchini lavozimga emas, kartaga bog'lash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tasdiqlovchi = karta (lavozim), egasi avtomatik topiladi. Karta-model poydevori: odam almashsa karta qoladi.
- **Manba:** Karta-model vizyon (MASTER) + BARCHA_JAVOBLAR Org-7 §6 (rol kartadan) + v1-A
- **action:** APPROVE
- **⤳ Ta'sir:** Org-karta (resolver), Approval, Coordination

### EP-FIN-010 · Tasdiqlash muddati o'tib ketsa nima bo'ladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yuqori bosqichga avtomatik eskalatsiya + ogohlantirish. 460 javob: eslatma 2x → eskalatsiya → HR/rahbar xabardor.
- **Manba:** BARCHA_JAVOBLAR HR Q122 (2x eslatma + eskalatsiya) + v1-A
- **action:** CRON
- **⤳ Ta'sир:** Coordination, NTF, Org-karta (keyingi daraja)

### EP-FIN-011 · Haftalik FP-tsikl jadvali (Se/Ch/Pa/Du)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram eslatma (cron bor). ShVB reglament ritmi.
- **Manba:** SHvB-40 YO'NALISH 4 (fp-cycle.cron Se/Ch/Pa/Du) + v1-A
- **action:** CRON
- **⤳ Ta'sир:** NTF/Telegram, ZVS/ZNO, Dashboard timeline

### EP-FIN-012 · FP-tsikl kunlarini egasi o'zgartira oladimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ekrandan kunlarni o'zgartirish mumkin (bank/bayram kuniga moslashuvchan).
- **Manba:** v1-A (A-default)
- **action:** UPDATE
- **⤳ Ta'sир:** FP-cron, Settings

### EP-FIN-013 · FP-tsikl eslatmalari qayerga boradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Telegram + ERP bildirishnoma birga. 460 javob: ko'p joyda "Telegram + ERP ikkalasi".
- **Manba:** BARCHA_JAVOBLAR HR Q113/Q55 (Telegram+ERP) + SHvB-40 YO'NALISH 38 + v1-A
- **action:** CRON
- **⤳ Ta'sир:** NTF, Telegram-bot, Org-karta (routing)

### EP-FIN-014 · To'lanmagan schyotlar yoshi (aging) ko'rinishi (0-30/31-60/61-90/90+)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq aging (4 guruh + jami + eng eski yuqorida). ShVB "Список неоплаченных счетов".
- **Manba:** SHvB-40 YO'NALISH 5 (unpaid-invoices aging rang-kodli) + v1-A
- **action:** READ
- **⤳ Ta'sир:** Kreditor/debitor, ZNO, Dashboard

### EP-FIN-015 · Aging — debitor (bizga qarz) va kreditor (biz qarzdor) alohidami
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ikki alohida ekran (debitor / kreditor), har birida aging (aralashmaydi). ShVB unpaid asosan kreditor; debitor SD ga ulanadi.
- **Manba:** v1-A (A-default) + SHvB-40 YO'NALISH 5 (debtorList)
- **action:** READ
- **⤳ Ta'sир:** SD (debitor), MM (kreditor), Aging

### EP-FIN-016 · Eski qarz haqida avtomatik ogohlantirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kunlik avtomatik alert (90+ kun = direktorga ham). ShVB: escalateToDirector + sendReminder.
- **Manba:** SHvB-40 YO'NALISH 5 (sendReminder/escalateToDirector) + v1-A
- **action:** CRON
- **⤳ Ta'sир:** NTF, Aging, Org-karta (direktor)

### EP-FIN-017 · Byudjet rejalash darajasi (umumiy ╳ bo'lim/karta)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bo'lim (va karta) bo'yicha byudjet, ZVS shunga taqqoslanadi. Karta-model: har karta o'z byudjet/limitini biladi.
- **Manba:** Karta-model vizyon (MASTER) + v1-A
- **action:** CREATE
- **⤳ Ta'sир:** Org-karta (limit), ZVS, Xarajat-markaz

### EP-FIN-018 · ZVS so'rovini byudjetga taqqoslash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik taqqoslash + qolgan summa + oshsa ogohlantirish. Tasdiqlovchi ko'r-ko'rona tasdiqlamaydi.
- **Manba:** SHvB-40 YO'NALISH 6 (summa→matritsa xabar) + EP-FIN-017 byudjet + v1-A
- **action:** READ
- **⤳ Ta'sир:** Byudjet, ZVS, Approval

### EP-FIN-019 · Byudjet davri (haftalik/oylik/yillik)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — haftalik asosiy + oylik/yillik jamlanma. ShVB haftalik FP ritmiga mos.
- **Manba:** SHvB-40 (FP haftalik) + v1-A
- **action:** READ
- **⤳ Ta'sир:** Byudjet, FP-tsikl, Hisobotlar

### EP-FIN-020 · Kassa (naqd) hisobi tizimda
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kassa to'liq ERP ichida (har kirim/chiqim + kunlik qoldiq). 460 javob: 1C yo'q, ERP moliya yetarli; pul harakati 4-hisob/aging bilan bog'lanadi.
- **Manба:** BARCHA_JAVOBLAR POS Q44 (1C yo'q, ERP FI) + v1-A
- **action:** CREATE
- **⤳ Ta'sир:** GL, 4-hisob, POS (kirim/chiqim)

### EP-FIN-021 · Kassa va POS/ombor bilan bog'lanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik bog'lanish: POS/ombor harakati kassa+GL ga o'zi yoziladi. POS Q43: har harakatda Debit/Credit avtomatik.
- **Манба:** BARCHA_JAVOBLAR POS Q43 (avto GL) + Q58 (real-time REST MM/FI/MES/HR/QC) + v1-A
- **action:** EVENT
- **⤳ Ta'sир:** POS/WMS, GL, Kassa

### EP-FIN-022 · GL-buxgalteriya: yagona daftar (canonical)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yagona kanonik GL (kassa, ZNO, payroll hammasi shunga yozadi). Oltin-ip vizyoni "uzilishsiz GL"; memory: kanonik = `gl_entries` (gl_journal_entries SAP #76 da migratsiya).
- **Манба:** MASTER oltin-ip (LOYIHA-BITGAN §A.2) + memory GL-decision (kanonik gl_entries) + v1-A
- **action:** CREATE
- **⤳ Ta'sир:** HAMMA moliya-yozadigan modul (POS/Payroll/ZNO/SD/MM)

### EP-FIN-023 · Buxgalteriya yozuvi har doim ikki tomonlama (debet/kredit)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — doim ikki tomonlama, balanslashmasa yozuv qabul qilinmaydi. POS Q43 Debit/Credit; buxgalteriya asosiy qonuni.
- **Манба:** BARCHA_JAVOBLAR POS Q43 (Debit/Credit) + v1-A
- **action:** CREATE
- **⤳ Ta'sир:** GL (invariant), barcha posting

### EP-FIN-024 · Hisoblar rejasi (COA) standarti (BHMS ╳ ShVB sodda)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — milliy BHMS hisoblar rejasi + ShVB 4-hisob ustiga qo'yiladi (rasmiy + boshqaruv birga). Memory: CoA seed 42 BHMS allaqachon bor.
- **Манба:** memory master-data (CoA 42 BHMS seed) + v1-A
- **action:** CREATE
- **⤳ Ta'sир:** GL, 4-hisob, Soliq-hisobot

### EP-FIN-025 · Tasdiqlangan ZNO avtomatik GL yozuviga aylansinmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik GL yozuvi (tasdiq→to'lov→daftar). POS Q43 avto-GL ruhi; uzluksiz zanjir.
- **Манба:** BARCHA_JAVOBLAR POS Q43 (avto GL) + v1-A
- **action:** EVENT
- **⤳ Ta'sір:** ZNO, GL, Kassa/bank

### EP-FIN-026 · To'lov so'roviga hujjat (chek/shartnoma) biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — hujjat biriktirish majburiy (ma'lum summadan yuqorida). Оргполитика: og'zaki ma'lumot qaror asosi emas (v2 Q16 bilan bir).
- **Манба:** kitob оргполитика (v2 Q16) + BARCHA_JAVOBLAR HR Q77 (hamma hujjat ERP) + v1-A
- **action:** CREATE
- **⤳ Ta'sір:** ZNO, Hujjat-ombori, Audit

### EP-FIN-027 · Kompaniya holati ko'rsatkichiga moliyani ulash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — moliya ko'rsatkichlari holat formulasiga kiradi (kam kassa/katta qarz = XAVF). ShVB holat-formulasi boshqaruv paneliga ulanadi.
- **Манба:** SHvB-40 YO'NALISH 13 (company-state KPI) + LOYIHA-BITGAN §A.3 + v1-A
- **action:** EVENT
- **⤳ Ta'sір:** Director (holat), Dashboard, AI

### EP-FIN-028 · Telegram ShVB komandasi: /zvs_status
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — asosiy buyruqlar (/zvs_status, /company_state, /weekly_digest). ShVB Telegram = asosiy operativ kanal.
- **Манба:** SHvB-40 YO'NALISH 38 (telegram-shvb /zvs_status) + BARCHA_JAVOBLAR HR Q101 (har modul boti) + v1-A
- **action:** READ
- **⤳ Ta'sір:** NTF/Telegram, ZVS, Director-holat

### EP-FIN-029 · ZVS/ZNO statuslari ro'yxati (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq 6 holatli oqim (Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad, qaytarish bilan). ShVB approval matritsasi = ko'p bosqich.
- **Манба:** SHvB-40 YO'NALISH 1/6 (status oqim) + v1-A
- **action:** CREATE
- **⤳ Ta'sір:** ZVS/ZNO, Coordination, Master-data

### EP-FIN-030 · Moliya rollarini kim-nima-qiladi (SoD master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har rolga aniq huquq (kassir kiritadi, boshliq tekshiradi, direktor tasdiqlaydi) = vazifa bo'linishi (SoD). Rollar org-sxemadan; SodGuard mavjud.
- **Манба:** BARCHA_JAVOBLAR Org-7 §6 (RBAC kartadan) + memory (4 global guard SodGuard) + v1-A
- **action:** APPROVE
- **⤳ Ta'sір:** RBAC/SoD, Org-karta, Approval

### EP-FIN-031 · Hisobotlar to'plami (kunlik kassa/haftalik FP/oylik P&L/aging)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq to'plam + PDF eksport. POS Q55/Q56: PDF+Excel, GL/ABC hisobotlar.
- **Манба:** BARCHA_JAVOBLAR POS Q55-57 (PDF+Excel hisobot) + v1-A
- **action:** EXPORT
- **⤳ Ta'sір:** Hisobotlar, Dashboard, Director

### EP-FIN-032 · Karta-model integratsiya: moliyaviy mas'uliyat kartaga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kartaga byudjet limiti + tasdiqlash huquqi biriktiriladi. Karta-model poydevori (MASTER).
- **Манба:** Karta-model vizyon (MASTER) + LOYIHA-BITGAN §C (ORG poydevor) + v1-A
- **action:** UPDATE
- **⤳ Ta'sір:** Org-karta, Byudjet, Approval

---

## II QISM — v2 (54 savol, kitob-grounded) — EP-FIN-033..086

### EP-FIN-033 · Режа қоғози → Бухгалтерия avtomatik ulanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ombor chiqim/kirim qaydidan avtomatik Режа қоғози tuziladi va moliyaga oqadi. Oltin-ip: ombor→moliya uzilishsiz; kitob "qo'lda topshirish" muammosini bartaraf.
- **Манба:** kitob Режа қоғози hujjati (v2 manba) + oltin-ip vizyon + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** Ombor (chiqim/kirim), MES (sarf), Coordination

### EP-FIN-034 · Камомад (qog'oz kamomadi) moliyaviy aks-etishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Камомад kg × narx = zarar summasi avtomatik, smenaga bog'lanadi. Sub-savol "zararni kimga yozish (smena/IchQ bo'lim/umumiy)" = egasi belgilaydi.
- **Манба:** kitob (Бухгалтерия Камомад nazorati) + v2-A; sub-qaror egasidan
- **action:** EVENT
- **⤳ Ta'sір:** Ombor, MES, HR (javobgarlik/KPI)

### EP-FIN-035 · Rejada 1200 / faktda 1500 — qaysi qiymat tannarxga kiradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat haqiqatda ishlatilgan kg (berilgan − qaytarilgan) tannarxga. Kitob aniq shu vaziyatni yozadi; real sarf = to'g'ri tannarx.
- **Манба:** kitob Режа қоғози (1200/1500 misol) + v2-A
- **action:** READ
- **⤳ Ta'sір:** SD (narx), PP (norma), Ombor

### EP-FIN-036 · Qog'oz narxini kim/qayerdan oladi (tannarx uchun)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A (v2) — o'rtacha tortilgan narx (weighted average), barqaror. ⚠️ ZIDDIYAT: 460 javob POS Q35 = FIFO. Egasi hal qilsin (FIFO standart-javob ╳ weighted-avg v2-tavsiya). Tan olingan: aktiv standart = FIFO.
- **Манба:** BARCHA_JAVOBLAR POS Q35 (FIFO) ╳ v2-A (weighted avg) — KONFLIKT, egasidan
- **action:** READ
- **⤳ Ta'sір:** Ombor (partiya), MM (xarid), tannarx

### EP-FIN-037 · Счёт-фактура (kelgan rulon) tizimda ro'yxatga olinishi → AP
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Счёт-фактура kiritilganda avtomatik kreditor qarz (AP) yoziladi, aging boshlanadi. Kitob Счёт-фактура № maydoni; to'lov nazorati.
- **Манба:** kitob (Счёт-фактура jadvali) + EP-FIN-014 aging + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** Ombor (kirim), MM (yetkazib beruvchi), Kreditor aging

### EP-FIN-038 · Счёт-фактура vazni farqi (kelgan gr ╳ qabul gr) → da'vo
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — farq avtomatik hisoblanib yetkazib beruvchi to'lovidan chegirma (da'vo). Kitob ikkala maydonni alohida beradi = tizimli farq.
- **Манба:** kitob (kelgan/qabul gr maydonlari) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** MM, Kreditor to'lov, Ombor QC

### EP-FIN-039 · Станоклар норма → ish haqi/tannarx asosimi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har stanok normasi × ish haqi stavkasi = operatsiya tannarxi (material + mehnat). Kitob normasi Ген.Директор tasdiqlagan = tannarx asosi.
- **Манба:** kitob "Станоклар норма.xlsx" (Утверждено Ген.Директор) + v2-A
- **action:** READ
- **⤳ Ta'sір:** PP (norma), MES, HR (ish haqi), SD (narx)

### EP-FIN-040 · "иш йук" (ish yo'q) vaqti — bo'sh turgan stanok xarajati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "иш йук" soatlari × stanok soatlik xarajati = yo'qotilgan quvvat hisobi (oylik hisobot). Kitob Norма Excelda qayd qiladi = yashirin zarar.
- **Манба:** kitob (Norма "иш йук" qaydi) + v2-A
- **action:** READ
- **⤳ Ta'sір:** MES, PP, boshqaruv hisoboti

### EP-FIN-041 · Брак va Макулатура moliyaviy hisobi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Брак = to'liq zarar, Макулатура = qisman qaytariladigan qoldiq (sotuvga). Sub-savol "makulatura sotuvi qaysi hisobga (asosiy/boshqa daromad/zararni kamaytirish)" = egasidan.
- **Манба:** kitob (Брак/Макулатура/Рулон брак kg maydonlari) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** Ombor, QC, SD (chiqindi sotuvi)

### EP-FIN-042 · Гильза (gilza) qaytarish — depozit/qaytariladigan tara hisobi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — gilza qaytariladigan tara depoziti sifatida alohida hisoblanadi (yo'qolish ko'rinadi). Kitob "Гильза" maydoni.
- **Манба:** kitob (Гильза maydoni) + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** Ombor, MM

### EP-FIN-043 · Хайдовчи/Транспорт xarajati — yetkazib berish tannarxi (landed cost)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — transport summasi material kirim tannarxiga taqsimlanadi (landed cost). Kitob "Транспорт тури/Автомобиль/Хайдовчи" maydonlari.
- **Манба:** kitob (transport maydonlari) + v2-A
- **action:** READ
- **⤳ Ta'sір:** MM (xarid), Ombor, tannarx

### EP-FIN-044 · Клей tayyorlash xarajati (Крустик сода/Краxмал/Бура)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yelim tarkibiy moddalari alohida sarf-norma bilan, ortiqchasi zarar (nazorat). Kitob retsept maydonlari.
- **Манба:** kitob (Клей тайёрлаш maydonlari) + v2-A
- **action:** READ
- **⤳ Ta'sір:** MM, MES, tannarx

### EP-FIN-045 · Haftalik "berilgan xom-ashyo hisoboti" → moliya
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — haftalik sarf hisoboti avtomatik moliyaga tushadi, byudjet bilan taqqoslanadi (erta ogohlantirish). Kitob "Флексо берилган хом ашё ҳафталик" + оргполитика "bitta manba".
- **Манба:** kitob (haftalik hisobot hujjati) + EP-FIN-018 byudjet-taqqos + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** PP, Ombor, byudjet

### EP-FIN-046 · Buyurtmalar tahlili (listlar bo'yicha) — daromad o'sish ko'rinishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — daromad dashboard (list-soni + summa, oy/yil taqqos, o'sish %). Kitobda format bor; egasi o'sish dinamikasini xohlaydi.
- **Манба:** kitob ("Buyurtmalar tahlili" + "O'sish surati 2017/2018") + LOYIHA-BITGAN §A.6 (70% tahlil) + v2-A
- **action:** READ
- **⤳ Ta'sір:** SD, boshqaruv hisoboti

### EP-FIN-047 · "Faqat bitta bo'lim ma'lumotni shakllantiradi" — moliya raqamlarining egasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tannarx/qarz = Бухгалтерия egaligida, sotiш narxi = SD egaligida, boshqalar o'qiydi. Оргполитика "bitta egа" + karta-model master-data egaligi.
- **Манба:** kitob оргполитика (МАЪЛУМОТ САҚЛАШ) + karta-model + v2-A
- **action:** APPROVE
- **⤳ Ta'sір:** Barcha modullar, master-data

### EP-FIN-048 · "Og'zaki ma'lumot qaror asosi emas" — to'lov tasdig'i hujjatsiz bo'lmasin
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har to'lov so'roviga hujjat majburiy, bo'lmasa tasdiqlash bloklanadi. Оргполитика to'g'ridan-to'g'ri taqiqlaydi; 460 javob: hamma hujjat ERP da (EP-FIN-026 bilan bir).
- **Манба:** kitob оргполитика + BARCHA_JAVOBLAR HR Q77 + v2-A
- **action:** APPROVE
- **⤳ Ta'sір:** ZNO, Approval, Hujjat-ombori

### EP-FIN-049 · Avans hisoboti (подотчёт) — naqd berilgan pul hisoboti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avans berildi → xodim chek bilan hisob beradi → qoldiq qaytariladi (to'liq tsikl). Sub "hisob bermagan avans muddat o'tsa" → 460 javob: oylikdan avtomatik chegiriladi (Q182).
- **Манба:** BARCHA_JAVOBLAR HR Q119/Q182 (kassadan olgan pul → oylikdan chegirma) + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** HR (ish haqi), Kassa, Approval

### EP-FIN-050 · Xarajat kategoriyalari (xarajat moddalari) ro'yxati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — standart xarajat moddalari ro'yxati (sozlanadigan), har xarajat bittasiga bog'lanadi. Toifasiz tahlil imkonsiz; BHMS COA bilan moslanadi.
- **Манба:** EP-FIN-024 BHMS COA + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** Byudjet, Hisobotlar, GL

### EP-FIN-051 · Energiya (elektr/gaz/suv) xarajati — stanokga taqsimlash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — stanok soatlik energiya quvvati × ish soati → tannarxga taqsim. Kitob stanoklari (SM-52/72, KBA-105, гофра) ko'p energiya yeydi.
- **Манба:** kitob (stanok ro'yxati) + v2-A
- **action:** READ
- **⤳ Ta'sір:** MES (soat), tannarx, byudjet

### EP-FIN-052 · Stanok amortizatsiyasi — asosiy vositalar reestri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har stanok asosiy vosita kartochkasi (qiymat, muddat, oylik amortizatsiya). POS Q46: amortizatsiyani FI moduli hal qiladi; memory: depreciation.service mavjud.
- **Манба:** BARCHA_JAVOBLAR POS Q46 (FI amortizatsiya) + memory (depreciation.service) + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** MES (jihoz), tannarx, soliq

### EP-FIN-053 · Valyuta — import xom-ashyo (qog'oz/kimyo) valyutada
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'p valyuta + kun kursi → so'mda avtomatik, kurs farqi alohida hisob. POS Q36: "har qanday valyuta — qaysi valyutada xarajat bo'lsa o'sha".
- **Манба:** BARCHA_JAVOBLAR POS Q36 (har valyuta) + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** MM (import), Kreditor, tannarx

### EP-FIN-054 · Kreditor (yetkazib beruvchi) to'lov muddati — Счёт-фактура shartlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har yetkazib beruvchi to'lov muddati profili → aging shu muddatga nisbatan. Hozir aging faqat sana; shartnoma muddati har xil.
- **Манба:** v2-A + EP-FIN-014 aging
- **action:** CREATE
- **⤳ Ta'sір:** MM, Aging, ZNO

### EP-FIN-055 · Soliqlar (QQS/НДС) — Счёт-фактурада ajratish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har fakturada QQS stavkasi + summasi ajratiladi, kirim/chiqim QQS reestri. ⚠️ POS Q45: "faqat ichki hisobot" (rasmiy fiskal yo'q) — QQS reestri ichki tahlil uchun. Egasi rasmiy soliq integratsiya darajasini aniqlasin.
- **Манба:** v2-A ╳ BARCHA_JAVOBLAR POS Q45 (faqat ichki hisobot) — egasidan
- **action:** CREATE
- **⤳ Ta'sір:** SD (chiqim faktura), MM (kirim faktura), soliq-hisobot

### EP-FIN-056 · Mehnat haqi soliqlari (ИНПС/ЖШДС) → moliya GL ulanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — payroll yopilganda avtomatik GL: xarajat (ish haqi) + kreditor (soliq, xodim). 460 javob Q181: hamma komponent avtomatik Payroll; memory: payroll GL lines insert mavjud (INPS8/JSHD12).
- **Манба:** BARCHA_JAVOBLAR HR Q181 (hamma payroll avto) + memory (payroll GL lines) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** HR (payroll), GL, soliq

### EP-FIN-057 · To'lov usuli (naqd/plastik/o'tkazma/o'zaro hisob)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'lov usuli majburiy maydon, har usul o'z hisobiga (kassa/bank) bog'lanadi. POS Q36/Q44 ERP FI; naqd qattiq nazorat.
- **Манба:** v2-A + EP-FIN-020 kassa + EP-FIN-004 4-hisob
- **action:** CREATE
- **⤳ Ta'sір:** Kassa, bank, ZNO

### EP-FIN-058 · Bir nechta bank hisobi (so'm/valyuta) — qoldiq ko'rinishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har bank hisobi alohida, umumiy qoldiq dashboard. ShVB Справка о счетах + ko'p valyuta (EP-FIN-053).
- **Манба:** SHvB-40 YO'NALISH 3 (hisob справка) + v2-A
- **action:** READ
- **⤳ Ta'sір:** Kassa, ZNO, byudjet

### EP-FIN-059 · To'lov kalendari (kun bo'yicha kirim/chiqim prognozi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kun bo'yicha kirim/chiqim kalendari + qoldiq prognozi (cash-flow). Bo'shliq oldindan ko'rinadi; AI forecastCashFlow bilan mos.
- **Манба:** SHvB-40 YO'NALISH 39 (finance-ai forecastCashFlow) + v2-A
- **action:** READ
- **⤳ Ta'sір:** Aging, ZNO, byudjet

### EP-FIN-060 · Debitor (mijoz qarzi) limiti — SD ga bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz kredit limiti → oshsa SD buyurtmasi bloklanadi/tasdiqqa chiqadi. Sub "limitni kim oshira oladi (egasi/moliya rahbari/sotiш rahbari)" = egasidan (karta-vakolat).
- **Манба:** v2-A + karta-model (vakolat); sub-qaror egasidan
- **action:** APPROVE
- **⤳ Ta'sір:** SD, CRM, Aging

### EP-FIN-061 · Qisman to'lov va to'lovni fakturalarga taqsimlash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'lov fakturalarga qo'lda/avtomatik (eng eski avval) taqsimlanadi (aniq aging).
- **Манба:** v2-A + EP-FIN-014 aging
- **action:** UPDATE
- **⤳ Ta'sір:** SD, Aging, Debitor

### EP-FIN-062 · Пеня/jarima — kechikkan to'lovga
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — shartnomaga ko'ra пеня foizi avtomatik (kechikkan kun × stavka). Intizom; egasi standart stavka/qo'llashni tasdiqlasin.
- **Манба:** v2-A
- **action:** EVENT
- **⤳ Ta'sір:** SD, Aging, Kreditor

### EP-FIN-063 · Inventarizatsiya farqi (ombor sanоq) → moliya
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sanoq farqi avtomatik GL tuzatmasi (kamomad=zarar, ortiqcha=daromad), lekin moliya tekshiradi/tasdiqlaydi. POS Q52-53: inventar GL avtomatik + moliya tasdiq.
- **Манба:** BARCHA_JAVOBLAR POS Q52-53 (inventar GL avto + moliya tasdiq) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** Ombor, GL, tannarx

### EP-FIN-064 · Davr yopish (oy yopilishi) — qulflangan davrga yozuv taqiqi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — davr yopilganda qulflanadi, faqat egasi/moliya rahbari ocha oladi. Immutable tasdiqlangan hujjat (HR Q83) ruhiga mos; mumtoz buxgalteriya.
- **Манба:** BARCHA_JAVOBLAR HR Q83 (immutable tasdiqlangan) + v2-A
- **action:** UPDATE
- **⤳ Ta'sір:** GL, Hisobotlar, Audit

### EP-FIN-065 · Совершенствование bo'limi → moliyaviy tahlil roli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — moliyaviy og'ish hisobotlari Совершенствование oylik tahliliga avtomatik kiradi (yagona tahlil markazi). Оргполитика tahlil rolini shu bo'limga beradi; Org-7: 6-Rivojlanish.
- **Манба:** kitob оргполитика + BARCHA_JAVOBLAR Org-7 (6-Rivojlanish) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** Coordination, Hisobotlar, boshqaruv

### EP-FIN-066 · Byudjet-fakt og'ishiga talab (расмий талаб) jo'natish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — og'ish chegaradan oshsa → mas'ul kartaga avtomatik tushuntirish talabi (Coordination). Kitob расмий ёзма талаб mexanizmi; karta-model javobgarlik.
- **Манба:** kitob оргполитика (расмий талаб) + karta-model + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** Coordination, byudjet, karta-model

### EP-FIN-067 · Buyurtma rentabelligi (har buyurtmadan foyda)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har buyurtma yopilganda rentabellik kartochkasi (daromad − to'liq tannarx). Sub "zararli buyurtma topilsa (narx qayta/ogohlantirish/qabul qilinmaydi)" → EP-FIN-073 minimal narx bilan birga egasidan. Oltin-ip yakuni = foyda.
- **Манба:** LOYIHA-BITGAN §A.2 (oltin-ip→foyda) + §A.6 (70% tahlil) + v2-A
- **action:** READ
- **⤳ Ta'sір:** SD, PP, tannarx

### EP-FIN-068 · Минимал buyurtma narxi / narxdan past sotuv taqiqi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — narx tannarxdan past bo'lsa → bloklash yoki egasi tasdig'i (zararga sotuv oldi olinadi). EP-FIN-076 marjinal-narx bilan bog'liq.
- **Манба:** v2-A + EP-FIN-067 rentabellik
- **action:** APPROVE
- **⤳ Ta'sір:** SD, tannarx, Approval

### EP-FIN-069 · Chegirma (skidka) vakolat darajasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — chegirma vakolat darajasi (sotuvchi ≤5%, rahbar ≤15%, egasi >15%). Karta-model vakolat; aniq foizlar egasidan.
- **Манба:** v2-A + karta-model (vakolat)
- **action:** APPROVE
- **⤳ Ta'sір:** SD, Approval, karta-model

### EP-FIN-070 · О'заро hisob (vzaimозачёт / barter) hisobi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — o'zaro hisob akti tuziladi, ikki tomon qarzi bir vaqtda yopiladi (hujjatli). Hujjatsiz qolsa nazorat yo'qoladi (оргполитика).
- **Манба:** v2-A + EP-FIN-048 (hujjat majburiy)
- **action:** CREATE
- **⤳ Ta'sір:** SD, MM, debitor/kreditor

### EP-FIN-071 · Yetkazib beruvchini moliyaviy baholash (eng arzon/ishonchli)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yetkazib beruvchi reytingi: narx + brak% + kechikiш (eng foydali tanlov). Eng arzon ≠ eng foydali (yashirin brak xarajati).
- **Манба:** v2-A
- **action:** READ
- **⤳ Ta'sір:** MM, QC (brak), Ombor

### EP-FIN-072 · Naqd kassa limiti va kunlik inkассация
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kassa limiti + oshsa inkассация (bankka topshirish) eslatmasi (xavfsizlik). Klassik naqd nazorat qoidasi; aniq limit egasidan.
- **Манба:** v2-A + EP-FIN-020 kassa
- **action:** CRON
- **⤳ Ta'sір:** Kassa, bank

### EP-FIN-073 · Ish haqi avansi (oyning yarmida) hisobi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avans HR payroll tsiklida qayd → oxirgi hisob avansni chegiradi. 460 javob Q181 (hamma payroll avto) + Q182 (oylikdan chegirma).
- **Манба:** BARCHA_JAVOBLAR HR Q181/Q182 + memory (payroll compute) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** HR, kassa/bank

### EP-FIN-074 · Jarima/ushlanma (xodim zarari) ish haqidan
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — zarar summasi → tasdiqlansa ish haqidan ushlanma (qonuniy chegara ichida). 460 javob: jarima tasdiqlanmasa yozilmaydi (Q108) + zarar oylikdan chegiriladi (Q182). Sub "maks ushlanma foizi" = egasi/yurist.
- **Манба:** BARCHA_JAVOBLAR HR Q108 (jarima tasdiq) + Q182 (oylikdan chegirma) + v2-A; sub egasidan
- **action:** EVENT
- **⤳ Ta'sір:** HR, MES (brak), karta-model

### EP-FIN-075 · Loyiha/buyurtma avans to'lovi (mijozdan oldindan)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mijoz avansi alohida (kreditor-mijoz) hisob → yetkazilgach daromadga o'tadi. Avans daromad emas; accrual to'g'riligi (EP-FIN-081 bilan bir).
- **Манба:** v2-A + EP-FIN-081 (accrual standart)
- **action:** CREATE
- **⤳ Ta'sір:** SD, soliq, debitor

### EP-FIN-076 · Quvvat-narx: bo'sh quvvat ortganda narx pasaytirish qarori
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bo'sh quvvat + marjinal-narx tahlili → qaror egaga chiqadi (aqlli to'ldirish). EP-FIN-040 ("иш йук") + EP-FIN-068 minimal-narx bilan bog'liq.
- **Манба:** v2-A + EP-FIN-040/068
- **action:** READ
- **⤳ Ta'sір:** PP (quvvat), SD (narx), MES

### EP-FIN-077 · Tannarx versiyasi (norma o'zgarganda tarix)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norма/narx versiyali (amal qilish sanasi bilan) → har buyurtma o'z davridagi qiymat bilan. Kitob normasi sanali; immutable tarix (HR Q83/Q107 versiya tarixi).
- **Манба:** kitob (sanali norма hujjati) + BARCHA_JAVOBLAR HR Q107 (versiya tarixi) + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** PP (norма), tannarx, hisobotlar

### EP-FIN-078 · Xarajat-markazi (бўлим/участка bo'yicha xarajат)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har xarajat xarajат-markaziga (bo'limga) bog'lanadi → bo'lim-bo'yicha hisobот (javobgarlik). Kitobda bo'limlar aniq (Флексо/Офсет); karta-model.
- **Манба:** kitob (Флексо/Офсет bo'limlari) + karta-model + EP-FIN-017 byudjet + v2-A
- **action:** CREATE
- **⤳ Ta'sір:** Barcha ishlаб chiqариш bo'limlari, byudjet, karta-model

### EP-FIN-079 · Daromad tan olish vaqti (yetkazilganda / to'langanда)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yetkazilganda (akт/накладной bilan) tan olinadi (standart accrual). To'g'ri foyda/soliq; EP-FIN-075 mijoz avansi bilan izchil.
- **Манба:** v2-A + EP-FIN-075 (avans ≠ daromad)
- **action:** READ
- **⤳ Ta'sір:** SD, soliq, hisobotlar

### EP-FIN-080 · To'lov so'rovi (ЗНО) navbati/ustuvorligi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'lov ustuvorlik darajasi (sozlanadigan) → navbat avtomatik taklif (ish haqi > soliq > xom-ashyo > boshqa). Pul cheklanganda kritik to'lov kechikmaydi; aniq tartib egasidan.
- **Манба:** v2-A
- **action:** READ
- **⤳ Ta'sір:** ZNO, kassa, byudjet

### EP-FIN-081 · Pul aylanма davri (mijoz to'lashi − biz to'lashimiz)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — pul aylanма davri dashboard (debitor kun − kreditor kun + ombor kun) — likвidlik nazorati. AI cash-flow bilan mos.
- **Манба:** v2-A + EP-FIN-059 to'lov-kalendar
- **action:** READ
- **⤳ Ta'sір:** Aging, ombor, byudjet

### EP-FIN-082 · Moliyaviy dashboard egasi uchun (1 ekran)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — egaga moliya dashboardи (qoldiq + 7-kun prognoz + qarzlar + foyda). 460 javob Q123: direktorga to'liq, har modul asosiy ko'rsatkichlari.
- **Манба:** BARCHA_JAVOBLAR HR Q123 (direktor to'liq dashboard) + LOYIHA-BITGAN §A.6 + v2-A
- **action:** READ
- **⤳ Ta'sір:** Barcha moliya ekranlari, boshqaruv

### EP-FIN-083 · "Режа қоғози"da imzo/qabul-topshириш zanjiri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har bosqichda elektron tasdiq (kim berdi / kim oldi / qachon) — uzilmas zanjir. Kitob "Qabul qildim: F.I.O/Imzo"; 460 javob: hujjat status zanjiri + imzo tasdiq (Q77-78).
- **Манба:** kitob (Режа қоғози imzo) + BARCHA_JAVOBLAR HR Q77-78 (imzo/status zanjiri) + v2-A
- **action:** APPROVE
- **⤳ Ta'sір:** Ombor, Coordination, karta-model

### EP-FIN-084 · Faktura-to'lov-yetkaziш uchligi (3-way match)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3-way match: zakaz=faktura=kirim bo'lmasa to'lов bloklanadi (ortiqcha to'lov oldi olinadi). POS Q22 EXTERNAL_OUT: Ombor menejer + Moliya + AI to'lov tekshiruv; kitob kelgan/qabul farqi (EP-FIN-038).
- **Манба:** BARCHA_JAVOBLAR POS Q22 (moliya+AI to'lov tekshiruv) + kitob (qabul gr) + v2-A
- **action:** APPROVE
- **⤳ Ta'sір:** MM, Ombor, ZNO, kreditor

### EP-FIN-085 · Brak% chegarasi oshsa tannarx ogohlantiruvi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — brak% > norма → tannarx og'ishi + ogohlantirish (erta nazorat). Kitob "Станоклар норма брак %"; QC bilan ulanadi.
- **Манба:** kitob (норма брак %) + v2-A
- **action:** EVENT
- **⤳ Ta'sір:** QC, MES, tannarx

### EP-FIN-086 · Yangi material/stanok narxini kim kiritadi (master-data egaligi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — narx master-data faqat Бухгалтерия/moliya kartasi egaligida, boshqalar o'qiydi (yagona haqiqat). Оргполитика "bitta egа" + karta-model (EP-FIN-047 bilan bir).
- **Манба:** kitob оргполитика + karta-model + EP-FIN-047 + v2-A
- **action:** APPROVE
- **⤳ Ta'sір:** Master-data, barcha modullar, karta-model

---

DONE: Finance — 86 (javoblangan 56, ochiq 30)
