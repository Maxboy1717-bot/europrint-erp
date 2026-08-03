# OMBOR / WMS — Decision Map (EP-WMS) — 2026-06-08

> Manba savollar: v1 (31) + v2 (103) = **134**. Kodlar: v1 → EP-WMS-001..031, v2 → EP-WMS-032..134 (fayl tartibida).
> ⭐ MUHIM: POS Monitor moduli = zavod ombori tablet interfeysi (kassa EMAS). `EUROPRINT_BARCHA_JAVOBLAR.md` dagi 60 POS javobining ko'pi AYNAN ombor qarorlari — shuning uchun ko'p WMS savol allaqachon JAVOBLANGAN.
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` POS Q15-60 (movement turlari Q21-28, ombor turlari Q29, karantin Q30, QC 3-qaror Q31, bin Q33, FIFO/FEFO Q35-37, minus saldo Q38, real-time stok Q39, GL Q43, xodim inventar Q47-51, inventarizatsiya Q52-54, hisobot Q55-57, label Q19, barcode Q15-20), `kitob-extracted/` (Ички логистика/Таъминот/Элтиб бериш bo'lim boshliqlari — топлайнер╳местный, грамаж, 3/5 qavat gofra, поддон, рохлер, бекор туриш, чиқинди/қолдиқ, материалы заказчика), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-kod, action turlari), vizyon master reja (ShVB 2020 + karta-model).
> action turlari: `CREATE / READ / UPDATE / DELETE / APPROVE / REJECT / EVENT / CRON / AI / LOGIN / EXPORT`.
> Texnik kontekst (memory): kanonik zaxira = `warehouse_stock` (`current_stock` = uning view'i); `stocks`/`orders` parallel-dunyolar muammosi; har savol birinchi varianti (A) = vizyonga eng mos = tavsiya.

## Xulosa
- **Jami:** 134 (v1=31, v2=103)
- **✅ JAVOBLANGAN:** 75 (POS 60-javob ombor qarorlari + kitob bo'lim-yo'riqnomalari + ShVB/karta-model vizyon bilan bevosita tasdiqlangan)
- **🔵 OCHIQ:** 59 (egasi keyin hal qiladi; har biriga A-default tavsiya = ShVB/kitob/POS-javoblarga eng mos variant)
- **KONFLIKT belgilangan:** EP-WMS-079/EP-WMS-110 (narxlash — POS Q35 "FIFO" ╳ v2 Q79-A "o'rtacha tortilgan"); EP-WMS-001 (kanonik zaxira — memory `warehouse_stock` ╳ `stocks` parallel-dunyo).

---

## I QISM — v1 (31 savol) — EP-WMS-001..031

### EP-WMS-001 · Qoldiq nima asosda hisoblanadi (kanonik zaxira jadvali)
- **Holat:** ✅ JAVOBLANGAN (KONFLIKT-rails)
- **Javob/Tavsiya:** A — bitta kanonik jadval, qolgani view. POS Q39 "Real-time (har harakat darhol PostgreSQL ga)". Memory: kanonik = `warehouse_stock`, `current_stock` = uning view'i; `stocks` parallel-dunyo (DROP/migratsiya egasi qaroriga).
- **Manba:** BARCHA_JAVOBLAR POS Q39 + memory `project_two_worlds_phase12` (warehouse_stock kanonik) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Butun WMS, Finance (zaxira qiymati), MES, Hisobotlar

### EP-WMS-002 · Ombor turlari ro'yxati (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 6+ standart tur. POS Q29 aniq beradi: MAIN, QUARANTINE, PRODUCTION_*, FINISHED_GOODS, DEPARTMENT_* (30+), QC, DEFECTIVE.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + ShVB 7-otdeleniye (Administratsiya) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Ombor Dashboard filtri, Hisobot, Org-7

### EP-WMS-003 · Mol qabul qilish (kirim) jarayoni
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq qabul oqimi sifat darvozasi bilan. POS Q21 EXTERNAL_IN = 5 bosqich: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL. POS Q30: barcha tashqi kirim avval karantinga.
- **Manba:** BARCHA_JAVOBLAR POS Q21 + Q30 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (sifat darvozasi), Finance (GL), MM (yetkazib beruvchi)

### EP-WMS-004 · Mol qabul → buyurtma (PO) bilan bog'lash (3-way match)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik 3-tomonlama moslik (PO ↔ qabul akti ↔ schyot). ShVB nazorat ruhi mos; lekin tolerans % egasidan (v2 Q16/Q87 bilan bog'liq).
- **Manba:** v1-A (A-default) + ShVB 3-way nazorat
- **action:** CREATE
- **⤳ Ta'sir:** MM (PO), Finance (kreditor), Таъминот

### EP-WMS-005 · Ichki ko'chirish (omborlar orasi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A/B aralash — POS Q25 INTERNAL_TRANSFER: bir xil tip = tezkor (tasdiqsiz), boshqa tip = menejer tasdiq. Yo'lda holat ko'rinishi A bilan to'ldiriladi.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Ombor turlari, Audit-log, ichki logistika

### EP-WMS-006 · Ko'chirishga ruxsat (kim tasdiqlaydi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — summaga/tipga qarab darajali. POS Q25: bir xil tip tasdiqsiz, boshqa tip ombor menejer; POS Q23 INTERNAL_ISSUE = menejer 1 imzo. ShVB matritsasiga mos.
- **Manba:** BARCHA_JAVOBLAR POS Q23 + Q25 + ShVB approval-matrix + v1-A
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Org-karta (razryad), ShVB matritsa

### EP-WMS-007 · Inventarizatsiya (sanash) jarayoni
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A+B — POS Q52 "Tunda yoki dam olish kunida (ish to'xtatilmaydi)"; aylanma + to'liq sanash (v2 Q27/Q100 bilan). GSD aniqlik ko'rsatkichi ShVB dan.
- **Manba:** BARCHA_JAVOBLAR POS Q52 + Q53 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zaxira tasdig'i), GSD ko'rsatkich, GL

### EP-WMS-008 · Inventarizatsiya aniqlik foizi (GSD ko'rsatkich)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik aniqlik% = (to'g'ri / jami)×100, har sanashdan keyin saqlanadi, trend. ShVB GSD ruhi mos; formula/saqlash modeli egasidan.
- **Manba:** v1-A (A-default) + ShVB GSD (haftalik statistika)
- **action:** CREATE
- **⤳ Ta'sir:** GSD-panel, Org-karta (omborchi KPI), Director dashboard

### EP-WMS-009 · Inventarizatsiya farqini kim tasdiqlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — farq akti → ombor boshlig'i + moliya tasdig'i, GL ga yoziladi. POS Q53: "Avtomatik, lekin moliya bo'limi tekshiradi va tasdiqlaydi".
- **Manba:** BARCHA_JAVOBLAR POS Q53 + v1-A
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (GL), Audit-iz, ombor boshlig'i

### EP-WMS-010 · Kam-qoldiq darajalari (min/max/reorder)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har material uchun 3 daraja (min/max/reorder), sarfga qarab avto-hisob. Qisman bor (`low_stock_alerts`); to'liq model + avto-hisob egasi tasdig'i bilan (v2 Q33-37).
- **Manba:** v1-A (A-default) + mavjud `low_stock_alerts`
- **action:** CREATE
- **⤳ Ta'sir:** MM (xarid), MES (uzilish oldi), v2 Q33-37

### EP-WMS-011 · Kam-qoldiq ogohlantirish kimga boradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — omborchi + xarid + ombor boshlig'iga, ilovada + Telegram. POS Q59 "To'liq Telegram Mini App (so'rov, xabar)"; HR Q140 "Hammasi, vaqtlari belgilash mumkin".
- **Manba:** BARCHA_JAVOBLAR POS Q59 + HR Q140 + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** CC/NTF, Telegram bot, Таъминот

### EP-WMS-012 · Kam-qoldiq → avtomatik xarid arizasi (PR)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik PR (ZVS/ZNO) loyihasi, xarid faqat tasdiqlaydi. ShVB ZVS oqimiga ulanadi; avto-trigger egasidan.
- **Manba:** v1-A (A-default) + ShVB ZVS/xarid oqimi
- **action:** EVENT
- **⤳ Ta'sir:** Finance (ZVS), MM, Таъминот

### EP-WMS-013 · Kunlik stok hisoboti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik kunlik hisobot (kirim/chiqim/ko'chirish/qoldiq), ertalab rahbarga. POS Q57 "Ombor menejer (kunlik)"; kitob "кун якунида хисобот".
- **Manba:** BARCHA_JAVOBLAR POS Q57 + kitob (kunlik hisobot tartibi) + v1-A
- **action:** CRON
- **⤳ Ta'sir:** CC/NTF, Director dashboard, ShVB GSD

### EP-WMS-014 · Rulon qoldig'i (qog'oz/karton rulonlari)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har rulon alohida birlik (ID, boshlang'ich og'irlik/metr, joriy qoldiq), kesilganda yangilanadi. Kod `/warehouse/rolls` JONLI (memory). Karton zavodi yadrosi.
- **Manba:** memory (warehouse/rolls jonli) + vizyon (karton rulon) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish/sarf), v2 Q1-8 (rulon kartochkasi)

### EP-WMS-015 · Rulon qoldig'i (ostatok) qayta ishlatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ostatok reestri (o'lcham/sifat), yangi buyurtmaga avto-taklif. ShVB kaizen/tejamkorlik mos; avto-taklif modeli egasidan (v2 Q52/Q94 bilan).
- **Manba:** v1-A (A-default) + ShVB kaizen + kitob (қолдиқ chiqarish)
- **action:** CREATE
- **⤳ Ta'sir:** MES (qoldiqdan kichik buyurtma), Finance (tejam)

### EP-WMS-016 · Karantin (brak/tekshiruvdagi material)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — alohida karantin holati, QC qaror chiqarmaguncha bloklangan. POS Q30 "Barcha EXTERNAL_IN avval karantinga, QC tasdiqlasa → asosiy omborga".
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q29 (QUARANTINE ombori) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** QC, MES (karantin material berilmaydi)

### EP-WMS-017 · Karantindan chiqish qarori
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — QC/sifat bo'limi qaror. POS Q31 aniq 3 qaror: QABUL → asosiy ombor | REWORK → MES | CHIQARISH → ta'minotchiga qaytish. Har qaror loglanadi.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v1-A
- **action:** APPROVE
- **⤳ Ta'sir:** QC (yakuniy qaror), MES (rework), Таъминот (qaytarish)

### EP-WMS-018 · Yaroqlilik muddati / partiya (FEFO)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — partiya + yaroqlilik sanasi, FEFO + ogohlantirish. POS Q37 "Muddatli → FEFO, muddatsiz → FIFO". Code-128 partiya barkodi (POS Q15).
- **Manba:** BARCHA_JAVOBLAR POS Q37 + Q15 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (muddati o'tgan brak), Chiqim, v2 Q48

### EP-WMS-019 · Ombor-ijara (tashqi mijoz molini saqlash)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'liq ijara moduli (ijarachi/maydon/shartnoma/oylik haq), moliyaga ulanadi. Kod `wms-rental` bor; kitob "материалы заказчика (давальческий)" tushunchasi mavjud. To'liq biznes-model egasidan.
- **Manba:** v1-A (A-default) + kod `wms-rental` + kitob (заказчик materiali)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (daromad), SD, v2 Q92/Q102

### EP-WMS-020 · Ombor-ijara to'lovi va moliya (GL) bog'lanishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — oylik avtomatik schyot (maydon×tarif), debitorlik/GL ga. ShVB to'lanmagan schyotlar oqimiga mos; tarif modeli (hajm×kun/oylik fiks/poddon×kun) egasidan (v2 Q102 sub-savol).
- **Manba:** v1-A (A-default) + ShVB unpaid-aging
- **action:** CREATE
- **⤳ Ta'sir:** Finance (GL daromad, debitor), SD

### EP-WMS-021 · Ombor xaritasi / joylashuv (locator)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** B (POS realizatsiyasi) — POS Q33 bin location = Freeform (operator yozadi: A-3-12, Tokcha-5, istalgan matn). To'liq zona→qator→javon→yacheyka strukturasi v2 Q42 da OCHIQ qoladi.
- **Manba:** BARCHA_JAVOBLAR POS Q33 + v1
- **action:** CREATE
- **⤳ Ta'sir:** Chiqim ko'rsatmasi, tsiklik sanash, v2 Q42-45

### EP-WMS-022 · Barkod / QR bilan ishlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — barcha amallar barkod orqali (tablet). POS Q15 EAN-13 + Code-128; Q16 dedicated scanner + AI kamera (ZXing.js); Q60 MVP-1 = barcode skan. Kod `wms-barcode` bor.
- **Manba:** BARCHA_JAVOBLAR POS Q15-17 + Q60 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** POS Monitor tablet, kirim/chiqim/sanash

### EP-WMS-023 · Ombor bo'limi GSD/ЦКП (karta-model integratsiyasi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — omborchi kartasiga 2-3 GSD (aniqlik%, kirim/chiqim tezligi, kam-qoldiq holatlari). Karta-modelga to'liq ulanadi; aniq GSD ro'yxati egasidan (v2 Q88 bilan).
- **Manba:** v1-A (A-default) + karta-model (har lavozim GSD) + ShVB
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (omborchi), AI-baho, oylik

### EP-WMS-024 · Omborchi razryadi → vakolat darajasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — razryadga bog'liq vakolat (past = oddiy kirim/chiqim, yuqori = inventarizatsiya/farq tuzatish). Karta-model razryad→talab→o'sish zanjiri; matritsa egasidan (v2 Q71).
- **Manba:** v1-A (A-default) + karta-model (razryad) + HR Q132 (orgsxemada belgilash)
- **action:** CREATE
- **⤳ Ta'sir:** HR/org-karta, RBAC, ombor xavfsizlik

### EP-WMS-025 · Ombor ↔ ishlab chiqarish (MES) bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik rezerv + chiqim. POS Q58 "To'liq ERP integratsiya: MM, FI, MES, HR, QC — Real-time REST API"; POS Q39 real-time stok.
- **Manba:** BARCHA_JAVOBLAR POS Q58 + Q39 + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** MES (material talab), real-time qoldiq, v2 Q22/Q69

### EP-WMS-026 · Ombor ↔ tayyor mahsulot (FG) qabuli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — MES tayyor mahsulot chiqarganda avtomatik kanonik FG omboriga kirim. POS Q29 FINISHED_GOODS ombori, Q34 "tayyor mahsulot bir xil POS da". Memory: `stocks`╳`warehouse_stock` ikkilanish → kanonik = `warehouse_stock`.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q34 + memory (FG kanonik) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** MES, SD (FG rezerv), Finance

### EP-WMS-027 · ABC tahlil (qaysi material muhim)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik ABC (aylanma/qiymat), tsiklik sanash chastotasini bog'laydi. POS Q56 hisobotlar ro'yxatida "ABC tahlil" bor. Kod `wms-catalog` da ABC bor.
- **Manba:** BARCHA_JAVOBLAR POS Q56 + kod `wms-catalog` + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya chastotasi, Hisobot, v2 Q13/Q100

### EP-WMS-028 · Sekin aylanuvchi / o'lik zaxira (dead stock)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — N kun harakatlanmagan material ro'yxati + ogohlantirish (sotish/qaytarish taklifi). ShVB tejamkorlik mos; N-chegara egasidan (v2 Q51/Q84/Q95).
- **Manba:** v1-A (A-default) + ShVB (muzlagan pul)
- **action:** CRON
- **⤳ Ta'sir:** Finance (zaxira qiymati), Sotuv (chegirma)

### EP-WMS-029 · Ombor inspeksiyasi (ShVB inspektor-menejer)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — rejali inspeksiya (mezon + ball + buzilish + tuzatish), GSD ga. HR Q29 inspeksiya bo'limida "Ombor" bor; HR Q97-98 "har xona ideal rasm orqali AI nazorat (har 2 soatda)".
- **Manba:** BARCHA_JAVOBLAR HR Q29 + Q97-98 + ShVB inspektor-menejer + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Inspeksiya moduli, AI-kamera, GSD

### EP-WMS-030 · Ombor harakatlari to'liq tarixi (audit izi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har amal o'zgarmas log (foydalanuvchi + vaqt + miqdor + sabab, faqat qo'shiladi). POS Q6 "To'liq: har klik, har o'zgarish, IP, timestamp"; Q7 7 yil retention; Q27 bekor faqat DRAFT, aks holda teskari harakat.
- **Manba:** BARCHA_JAVOBLAR POS Q6 + Q7 + Q27 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Audit, Finance, nizo-isboti

### EP-WMS-031 · Telegram orqali ombor so'rovlari (ShVB bot)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ombor komandalar to'plami (qoldiq/kam-qoldiq/kunlik). POS Q59 "To'liq Telegram Mini App: barcode skan, so'rov, tarix, tasdiqlash". HR Q101 har modul uchun alohida bot.
- **Manba:** BARCHA_JAVOBLAR POS Q59 + HR Q101 + v1-A
- **action:** READ
- **⤳ Ta'sir:** CC/NTF, Telegram bot, operativ boshqaruv

---

## II QISM — v2 (103 savol) — EP-WMS-032..134

### EP-WMS-032 · Rulon kartochkasida asosiy o'lchov maydonlari (v2 Q1)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Kenglik (mm) + Diametr + Zichlik/gramaj (g/m²) + Og'irlik (kg) + Uzunlik (m). Karton zavodi yadrosi; kitob "грамаж" kalit ko'rsatkich.
- **Manba:** kitob (грамаж, rulon o'lchovlari) + vizyon (karton) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish/sarf), Sotuv (kg/m² narx), Finance

### EP-WMS-033 · Gramaj (zichlik) o'lchov birligi va diapazoni (v2 Q2)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — g/m² tanlovli ro'yxat (80..300). Kitobda gramaj asosiy sifat ko'rsatkichi; standart ro'yxat xatoni kamaytiradi.
- **Manba:** kitob (грамаж sifat kaliti) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** master-data, QC, kirim tekshiruvi (v2 Q60)

### EP-WMS-034 · Rulon qoldig'ini o'lchash usuli (v2 Q3)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — og'irlik (kg) asosiy + uzunlik avto-hisob (gramaj×kenglik). Tarozi-ulanish (qo'lda/avto) sub-savol egasidan.
- **Manba:** v2-A (A-default) + kitob (tarozi)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya (v2 Q32), MES sarf

### EP-WMS-035 · Yarim rulon (ochilgan rulon) statusi (v2 Q4)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — status: To'liq / Ochilgan / Qoldiq; ochilganlar avval taklif. FIFO buzilmasligi uchun; model egasidan.
- **Manba:** v2-A (A-default) + FIFO mantiq
- **action:** CREATE
- **⤳ Ta'sir:** MES (ochilgan rulon birinchi), FIFO

### EP-WMS-036 · Rulonning noyob raqami (rulon ID/yorliq) (v2 Q5)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har rulonga noyob ID + bosma yorliq (QR/barcode). POS Q19 "Label avtomatik (EXTERNAL_IN tasdiqlanganda) + qo'lda reprint, ZPL/EPL/PDF"; yorliqni ombor xodimi/avto.
- **Manba:** BARCHA_JAVOBLAR POS Q19 + Q15 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Barkod, kuzatuv, partiya

### EP-WMS-037 · Rulon manbasi (yetkazib beruvchi + sertifikat) (v2 Q6)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yetkazib beruvchi + ishlab chiqaruvchi + sertifikat + kelgan sana. POS Q40 "Inventar pasporti faqat EXTERNAL_IN da"; kitob Таъминот izlanuvchanlik.
- **Manba:** BARCHA_JAVOBLAR POS Q40 + kitob (Таъминот, sertifikat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (reklamatsiya), Таъминот (reyting), v2 Q63

### EP-WMS-038 · Rulon rangi/turi va qoplama (v2 Q7)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tur (kraft/test-layner/flyuting/beliy/makulatura) + qoplama maydoni. Kitobda топлайнер╳местный (makulatura) ajratimi aniq.
- **Manba:** kitob (топлайнер, местный/макулатура, gofra) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, v2 Q59

### EP-WMS-039 · Namlik va saqlash sharti maydoni (v2 Q8)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — namlik (%) + tavsiya etilgan saqlash zonasi. Qog'oz namlikka sezgir; IoT bilan (v2 Q96) bog'lanadi; chegaralar egasidan.
- **Manba:** v2-A (A-default) + vizyon (qog'oz namlik)
- **action:** CREATE
- **⤳ Ta'sir:** QC, IoT (v2 Q96), saqlash zona

### EP-WMS-040 · Material asosiy toifalari (v2 Q9)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Xom-ashyo (rulon) / Yordamchi (kley/bo'yoq/skotch/sim) / Tayyor mahsulot / Yarim tayyor / Chiqindi. POS Q29 ombor turlari shu toifalarni qamraydi.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + kitob (material turlari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (toifa qiymati), Hisobot

### EP-WMS-041 · Material kodlash tizimi (artikul) (v2 Q10)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ma'noli kod (KR-125-1400) + avto-tartib raqam. Dublikat oldini oladi; kodlash sxemasi egasidan (v2 Q91 bilan).
- **Manba:** v2-A (A-default) + memory (master-data dublikat muammo)
- **action:** CREATE
- **⤳ Ta'sir:** MM master-data, dublikat oldini olish

### EP-WMS-042 · O'lchov birliklari va konvertatsiya (v2 Q11)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — asosiy birlik (kg) + avto-konvertatsiya (kg↔m↔m²) gramaj/kenglik orqali. POS Q36 "har qanday valyuta" narxni qamraydi; birlik konvertatsiya formulasi egasidan.
- **Manba:** v2-A (A-default) + kitob (qog'oz kg↔m²)
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf), Sotuv (narxlash), Finance

### EP-WMS-043 · Bir material — bir nechta yetkazib beruvchi (v2 Q12)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bitta material kartasi, partiya/kirim darajasida yetkazib beruvchi saqlanadi. Kitob Таъминот bir nechta beruvchi bilan ishlaydi.
- **Manba:** kitob (Таъминот, etkazib beruvchilar) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MM, partiya, v2 Q63 (reyting)

### EP-WMS-044 · ABC / muhimlik klassifikatsiyasi (v2 Q13)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ABC avtomatik (yillik sarf×narx). POS Q56 ABC tahlil hisobotda bor; EP-WMS-027 bilan bir.
- **Manba:** BARCHA_JAVOBLAR POS Q56 + kod `wms-catalog` + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya chastotasi, Hisobot

### EP-WMS-045 · Xavfli/maxsus materiallar belgisi (v2 Q14)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Yonuvchi/Kimyoviy/Maxsus saqlash" bayroqlari + alohida zona. Bo'yoq/kley/eritgich uchun; v2 Q97 bilan. Model egasidan.
- **Manba:** v2-A (A-default) + vizyon (yong'in xavfsizligi)
- **action:** CREATE
- **⤳ Ta'sir:** xavfsizlik, alohida zona (v2 Q97)

### EP-WMS-046 · Kirim blankasi majburiy maydonlari (v2 Q15)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Sana + Yetkazib beruvchi + Hujjat raqami + Material + Miqdor + Birlik + Partiya + Qabul qiluvchi + Javon. POS Q41-42 harakat akti PDF maydonlari; Q21 EXTERNAL_IN 5-bosqich.
- **Manba:** BARCHA_JAVOBLAR POS Q41-42 + Q21 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (kreditor), MM (PO solishtirish)

### EP-WMS-047 · Buyurtma (PO) bilan solishtirish (v2 Q16)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — PO bilan 3-tomonlama solishtirish, farq belgilanadi. ShVB nazorat; tolerans (±2%/±5%/0%) sub-savol egasidan (v2 Q87 bilan).
- **Manba:** v2-A (A-default) + ShVB 3-way + EP-WMS-004
- **action:** CREATE
- **⤳ Ta'sir:** MM, Finance (to'lov), v2 Q87

### EP-WMS-048 · Kirimda sifat tekshiruvi (QC) bog'lanishi (v2 Q17)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avval karantin → QC OK → erkin zonaga. POS Q30 aynan shu; eng xavfsiz.
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q21 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (kirim inspeksiyasi), MES (faqat OK material)

### EP-WMS-049 · Qisman qabul (kam/buzuq kelgan tovar) (v2 Q18)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — qabul qilingan/rad etilgan miqdor alohida + rad sababi. ShVB nazorat ruhi mos; model egasidan (v2 Q74 foto bilan).
- **Manba:** v2-A (A-default) + kitob (qisman qabul)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот (reyting), Finance (faqat qabul uchun to'lov)

### EP-WMS-050 · Kirim tarozi vazni va farq (v2 Q19)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — hujjat vazni + tarozi vazni + farq (kg va %) avtomatik. Qog'oz vazn bo'yicha; tolerans egasidan (v2 Q87).
- **Manba:** v2-A (A-default) + kitob (vazn nazorati)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (pul nazorati), v2 Q87

### EP-WMS-051 · Kim kirim qila oladi (huquq) (v2 Q20)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat ombor mas'uli/qabul qiluvchi roli. POS Q12 "Faqat o'sha bo'lim xodimlari chiqim qila oladi"; rol ERP dan (Q10).
- **Manba:** BARCHA_JAVOBLAR POS Q12 + Q10 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR/Rollar, Audit (kim kiritdi)

### EP-WMS-052 · Chiqim sababi (turlari) (v2 Q21)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Ishlab chiqarishga / Sotuvga / Brak / Sinov / Qaytarish / Ichki ko'chirish. POS Q21-26 movement turlari aynan shu sabablarni qamraydi (INTERNAL_ISSUE/EXTERNAL_OUT/DAMAGE/RETURN/TRANSFER).
- **Manba:** BARCHA_JAVOBLAR POS Q21-26 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf), Finance (xarajat), Hisobot

### EP-WMS-053 · Ishlab chiqarish buyurtmasiga bog'lash (v2 Q22)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — chiqim ishlab chiqarish buyurtmasiga majburiy bog'lanadi. POS Q58 to'liq MES integratsiya; kitob "техкарта мослиги" (v2 Q53).
- **Manba:** BARCHA_JAVOBLAR POS Q58 + kitob (texkarta) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** MES (BOM/sarf), Finance (buyurtma tannarxi)

### EP-WMS-054 · Norma bilan solishtirish (rejadagi sarf) (v2 Q23)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — norma vs haqiqiy farq foizda, ortiqcha bo'lsa ogohlantirish. Kitob texkarta normasi mavjud; chegara egasidan (v2 Q73 bilan).
- **Manba:** v2-A (A-default) + kitob (texkarta norma)
- **action:** CREATE
- **⤳ Ta'sir:** MES (sarf normasi), QC (chiqindi sababi), v2 Q73

### EP-WMS-055 · Chiqimda FIFO/FEFO qoidasi (v2 Q24)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — FIFO standart, kley/bo'yoqqa FEFO. POS Q37 aynan: muddatli → FEFO, muddatsiz → FIFO.
- **Manba:** BARCHA_JAVOBLAR POS Q37 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (muddati o'tgan brak), partiya

### EP-WMS-056 · Manfiy qoldiqdan himoya (v2 Q25)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — POS Q38 aniq: Aktivlar → TO'LIQ BLOK; iste'mol materiallar → OGOHLANTIRISH + ruxsat.
- **Manba:** BARCHA_JAVOBLAR POS Q38 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Aniq hisob, MES, Finance

### EP-WMS-057 · Chiqimni tasdiqlash (ikki imzo) (v2 Q26)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — belgilangan summadan yuqori chiqim rahbar tasdig'i. POS Q22 EXTERNAL_OUT = ombor menejer + moliya + AI; Q23 INTERNAL_ISSUE = menejer 1 imzo. Chegara sub-savol (A-toifa/summa) v2 Q101.
- **Manba:** BARCHA_JAVOBLAR POS Q22-23 + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** nazorat, Finance, v2 Q101

### EP-WMS-058 · Inventarizatsiya turi va chastotasi (v2 Q27)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — aylanma sanoq (A-toifa tez-tez) + yiliga 1 to'liq. POS Q52 "tunda/dam olishda, ish to'xtatilmaydi"; ABC chastota (v2 Q100).
- **Manba:** BARCHA_JAVOBLAR POS Q52 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zaxira tasdig'i), ABC

### EP-WMS-059 · Sanoq usuli (ko'r sanoq) (v2 Q28)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ko'r sanoq (raqam yashirin). Halol natija; usul egasidan.
- **Manba:** v2-A (A-default) + ShVB (halol inventarizatsiya)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi (GSD), audit

### EP-WMS-060 · Og'ish (farq) chegarasi va tasdiqlash (v2 Q29)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ±1% gacha avto-tuzatish, undan yuqori rahbar tasdig'i + sabab. POS Q53 moliya tasdiqlaydi; aniq % egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q53 (moliya tasdiq)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (zarar/foyda), v2 Q80

### EP-WMS-061 · Og'ish sababi ro'yxati (v2 Q30)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sabab majburiy ro'yxatdan (o'lchov xatosi / o'g'irlik / namlik / chiqindi yozilmagan / hujjat xatosi). Takror sabab tahlili; ro'yxat egasidan.
- **Manba:** v2-A (A-default)
- **action:** CREATE
- **⤳ Ta'sir:** QC/Audit (takror sabab tahlili)

### EP-WMS-062 · Inventarizatsiya vaqtida harakatni muzlatish (v2 Q31)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sanalayotgan zona muzlatiladi, tugagach ochiladi. POS Q52 ish to'xtatilmaydi (zona-darajali muzlatish mos); model egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q52
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi, MES

### EP-WMS-063 · Tarozi bilan rulon sanog'i (v2 Q32)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ochilgan rulonlar tortiladi, to'liq rulonlar kartochka vazni bo'yicha. Balansli; usul egasidan.
- **Manba:** v2-A (A-default) + kitob (tarozi)
- **action:** CREATE
- **⤳ Ta'sir:** Inventarizatsiya aniqligi, rulon qoldiq

### EP-WMS-064 · Minimal qoldiq (signal nuqtasi) (v2 Q33)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har materialga min qoldiq + tushganda avto-ogohlantirish. Qisman bor (`low_stock_alerts`); to'liq model egasidan (EP-WMS-010 bilan).
- **Manba:** v2-A (A-default) + mavjud `low_stock_alerts`
- **action:** CREATE
- **⤳ Ta'sir:** MM (avto-zayavka), MES (uzilish oldi)

### EP-WMS-065 · Reorder (qayta buyurtma) nuqtasi va miqdori (v2 Q34)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — reorder nuqtasi + tavsiya miqdor (sarf tezligi × lead time). Aqlli; formula egasidan (v2 Q37/Q83 bilan).
- **Manba:** v2-A (A-default)
- **action:** CREATE
- **⤳ Ta'sir:** MM (avto-zayavka loyihasi), v2 Q37/Q83

### EP-WMS-066 · Maksimal qoldiq (ortiqcha zaxira) (v2 Q35)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — max qoldiq + oshganda ogohlantirish. Muzlatilgan kapital/joy nazorati; qiymat egasidan.
- **Manba:** v2-A (A-default) + ShVB (muzlatilgan kapital)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (muzlatilgan kapital)

### EP-WMS-067 · Mavsumiy / dinamik min-max (v2 Q36)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — dinamik (oxirgi 3-6 oy sarfiga avto-qayta hisob). Karton mavsumiy; AI/avto model egasidan.
- **Manba:** v2-A (A-default)
- **action:** CRON
- **⤳ Ta'sir:** MM, AI (prognoz)

### EP-WMS-068 · Yetkazib berish muddati (lead time) hisobi (v2 Q37)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har beruvchiga lead time + xavfsizlik zaxirasi reorder hisobida. Kitob Таъминот import lead-time uzun; model egasidan (v2 Q62 import bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот, import muddati)
- **action:** CREATE
- **⤳ Ta'sir:** MM (beruvchi muddati), v2 Q62

### EP-WMS-069 · Karantin sabablari ro'yxati (v2 Q38)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Sifat kutilmoqda / Brak shubhasi / Namlik / Reklamatsiya / Muddat o'tgan / Hujjat yo'q. POS Q30 karantin + Q31 QC qaror oqimini qamraydi.
- **Manba:** BARCHA_JAVOBLAR POS Q30-31 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (qaror), MES (karantin berilmaydi)

### EP-WMS-070 · Karantindan chiqarish (kim va qanday) (v2 Q39)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat sifat nazorati roli qaror bilan (OK/Brak/Qaytarish). POS Q31 aynan QC 3-qaror.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** QC (yakuniy qaror)

### EP-WMS-071 · Karantin natijasi (qaror variantlari) (v2 Q40)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — OK→erkin / Past→arzon ishga / Brak→chiqindi / Qaytarish→beruvchiga. POS Q31 (QABUL/REWORK/CHIQARISH) + Q26 DAMAGE→QC.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + Q26 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (qaytarish→kredit), Таъминот (reklamatsiya)

### EP-WMS-072 · Karantinda turish muddati (v2 Q41)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — belgilangan kundan oshsa rahbarga ogohlantirish. Unutilgan karantin oldini oladi; muddat egasidan.
- **Manba:** v2-A (A-default)
- **action:** CRON
- **⤳ Ta'sir:** karantin zona, muzlatilgan pul

### EP-WMS-073 · Ombor topologiyasi (zona/qator/javon) (v2 Q42)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Zona → Qator → Javon → Yacheyka (A-12-3-2). POS Q33 hozir freeform; to'liq struktura keyingi bosqich, egasi tanlovi (freeform╳struktura).
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q33 (freeform = hozirgi)
- **action:** CREATE
- **⤳ Ta'sir:** Chiqim ("qaysi javondan"), v2 Q45/Q103

### EP-WMS-074 · Ichki ko'chirish blankasi (v2 Q43)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ko'chirish harakati (manba + maqsad + miqdor + xodim + sana). POS Q25 INTERNAL_TRANSFER harakat turi; Q6 to'liq audit.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + Q6 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** locator, audit, v2 Q103

### EP-WMS-075 · Bir nechta ombor / filial (v2 Q44)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har ombor alohida, ombor-aro ko'chirish harakat sifatida. POS Q29 ko'p ombor turi (PRODUCTION_*, DEPARTMENT_* 30+); Q32 faqat doimiy omborlar.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q32 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Hisobot (ombor bo'yicha qoldiq)

### EP-WMS-076 · Yacheyka sig'imi va band/bo'sh holati (v2 Q45)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sig'im + band/bo'sh + avto-joy taklifi. Tartibli ombor; model egasidan (v2 Q85 to'lganlik% bilan).
- **Manba:** v2-A (A-default)
- **action:** CREATE
- **⤳ Ta'sir:** kirim joy taklifi, v2 Q85

### EP-WMS-077 · Tayyor mahsulot zonasi alohida (v2 Q46)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor mahsulot ombori alohida, sotuvga shu yerdan. POS Q29 FINISHED_GOODS alohida tur; Q22 EXTERNAL_OUT faqat tayyor mahsulot ombori.
- **Manba:** BARCHA_JAVOBLAR POS Q29 + Q22 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Sotuv (FG rezerv), MES (FG topshirish)

### EP-WMS-078 · Partiya (batch) raqami (v2 Q47)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kirim = partiya, chiqim partiyaga bog'lanadi (oldinga/orqaga izlash). POS Q15 Code-128 partiya uchun; Q40 inventar pasporti EXTERNAL_IN da.
- **Manba:** BARCHA_JAVOBLAR POS Q15 + Q40 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (reklamatsiya izlash), MES (qaysi partiya qaysi buyurtma)

### EP-WMS-079 · Yaroqlilik muddati (kley/bo'yoq/kimyo) (v2 Q48)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yaroqlilik sanasi + N kun oldin ogohlantirish + o'tganda bloklash. POS Q37 FEFO muddatli materialga. Ogohlantirish kuni (30/15/7) sub-savol egasidan.
- **Manba:** BARCHA_JAVOBLAR POS Q37 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC, Chiqim (muddati o'tgan bloklanadi)

### EP-WMS-080 · Partiya bo'yicha sifat ko'rsatkichi (v2 Q49)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — partiyaga QC natijalari (gramaj/namlik/mustahkamlik) biriktiriladi. Kitob grammaj/sifat kalit; partiya pasporti modeli egasidan.
- **Manba:** v2-A (A-default) + kitob (грамаж, сифат)
- **action:** CREATE
- **⤳ Ta'sir:** QC (partiya pasporti), MES

### EP-WMS-081 · Partiyalarni aralashtirishga ruxsat (v2 Q50)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — imkon qadar bitta partiyadan, kerak bo'lsa ogohlantirish bilan ruxsat. Rang/gramaj tafovuti; qoida egasidan.
- **Manba:** v2-A (A-default) + kitob (gramaj/rang farqi)
- **action:** CREATE
- **⤳ Ta'sir:** QC, MES (bir buyurtma = bir partiya tavsiyasi)

### EP-WMS-082 · Eski/harakatsiz zaxira (dead stock) (v2 Q51)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — N kundan harakatsiz "o'lik zaxira" + hisobot. EP-WMS-028 bilan bir; N-chegara egasidan.
- **Manba:** v2-A (A-default) + ShVB (muzlagan pul)
- **action:** CRON
- **⤳ Ta'sir:** Finance (zaxira kamaytirish), Sotuv (chegirma)

### EP-WMS-083 · Qoldiq/oraliq kesindi (obrezka) hisobi (v2 Q52)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — foydalanish mumkin obrezka qoldiq sifatida qayta kirimga. Kitob ichki logistika "қолдиқлар чиқариш" rasmiy vazifa; INTERNAL_RETURN (POS Q24).
- **Manba:** kitob (қолдиқ chiqarish) + BARCHA_JAVOBLAR POS Q24 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MES (qoldiqdan kichik buyurtma), Finance (chiqindi kamayadi)

### EP-WMS-084 · Texkarta-material mosligi tekshiruvi (v2 Q53)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim bloklanadi. Kitob aniq misol: топлайнер kerak, омборчи местный (макулатура) tayyorlagan → brak. Override sub-savol (faqat IchLog/ishlab chiqarish boshlig'i+sabab).
- **Manba:** kitob (топлайнер╳местный texkarta mosligi) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** PP (texkarta) ↔ WMS ↔ MES

### EP-WMS-085 · Gofra qavatini aralashtirishdan himoya (3╳5 qavat) (v2 Q54)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har chiqim buyurtma+texkartaga bog'lanadi; boshqa buyurtmaga skanlasa ogohlantirish. Kitob misol: 5-qavat va 3-qavat gofra aralashtirilgan → reja buzilgan.
- **Manba:** kitob (3/5 qavat gofra aralashish) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** PP, MES, ichki logistika

### EP-WMS-086 · Poddon (palet) birligini hisobga olish (v2 Q55)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — poddon = qadoq/transport birligi, har poddonda dona/kg, ikki birlikda ko'rsatadi. Kitob ichki logistika "поддонлар, ярим тайёр маҳсулотлар"ni participalarga yetkazadi.
- **Manba:** kitob (поддон, ichki logistika) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, MES qadoqlash

### EP-WMS-087 · Ichki transport so'rovi (rohler chaqirish) + kechikish izi (v2 Q56)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sex "material kerak" so'rovi → rohlerchiga vazifa → bajarildi belgisi → kechikish ko'rinadi. Kitob: ichki logistika boshlig'i "рохлерчиларга аниқ вазифалар"; бекор туриш eng katta yo'qotish. Eskalatsiya sub-savol (IchLog boshlig'i/smena/Coordination).
- **Manba:** kitob (рохлер, бекор туриш) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** ichki logistika, MES (bekor turish), Coordination

### EP-WMS-088 · "Bekor turish" sababini ombor-yetishmasligiga bog'lash (KPI) (v2 Q57)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — downtime sabab kodida "material yetishmovchiligi (logistika)" alohida, oyiga hisoblanadi. Kitob statistika: "Ички логистика сабабли юзага келган кечикишлар сони".
- **Manba:** kitob (ichki logistika KPI, бекор туриш) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** MES, ichki logistika KPI, IoT, v2 Q88

### EP-WMS-089 · Chiqindi va qoldiqni ajratib hisobga olish (v2 Q58)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ikki turga: qayta ishlatiladigan qoldiq (omborga/makulatura) ╳ chiqindi (utilizatsiya). Kitob: ichki logistika boshlig'i "чиқиндилар ва қолдиқларни белгиланган тартибда чиқариш" rasmiy vazifa; makulatura daromad.
- **Manba:** kitob (чиқинди/қолдиқ chiqarish) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, Finance (makulatura savdosi), MES brak

### EP-WMS-090 · Местный (makulatura) qog'ozni alohida zaxira boshqarish (v2 Q59)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — alohida kartochka + ruxsat etilgan mahsulotlar ro'yxati. Kitob: местный = toplaynerga arzon past-sifatli muqobil, faqat ruxsat etilgan buyurtmalarga.
- **Manba:** kitob (местный/макулатура ruxsat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, v2 Q70

### EP-WMS-091 · Grammaj bo'yicha kirim tekshiruvi (v2 Q60)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — namuna grammaji o'lchanadi, ±tolerans, oshsa karantin. Kitob: grammaj texkarta kaliti ("унинг грамажи, сифати"); xato grammaj = butun partiya noto'g'ri.
- **Manba:** kitob (грамаж sifat kaliti) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, QC, karantin

### EP-WMS-092 · Import xom-ashyo yo'lda (in-transit) holati (v2 Q61)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — import buyurtmasi bosqichli holat (jo'natildi/bojxona/keldi) + taxminiy kelish sanasi. Kitob: Таъминот boshlig'i "импорт хом ашёларни етказиб келиш"ga mas'ul.
- **Manba:** kitob (Таъминот, импорт хом ашё) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, PP/MRP (lead-time), Finance (avans)

### EP-WMS-093 · Import lead-time va valyuta narxi (v2 Q62)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "import/mahalliy" bayroq + lead-time + valyuta, reorder import uchun ertaroq. POS Q36 "har qanday valyuta"; lead-time modeli egasidan.
- **Manba:** v2-A (A-default) + kitob (import) + BARCHA_JAVOBLAR POS Q36
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MRP, Finance

### EP-WMS-094 · Yetkazib beruvchi ishonchliligi reytingi (v2 Q63)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har kirim avtomatik reytingga ta'sir (kechikdi/brak) → reyting ko'rinadi. Kitob Таъминот bir nechta beruvchi bilan ishlaydi → ishonchlilik kerak.
- **Manba:** kitob (Таъминот, етказиб берувчилар) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, Finance

### EP-WMS-095 · Import partiyasiga bojxona/sertifikat hujjat biriktirish (v2 Q64)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har import partiyasiga fayl (GTD/sertifikat/invoys) biriktiriladi va qidiriladi. Kitob importda hujjat majburiy; model egasidan.
- **Manba:** v2-A (A-default) + kitob (import hujjat)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance, QC

### EP-WMS-096 · Avans to'lov va yetkazib berish bog'lanishi (v2 Q65)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — buyurtma → avans (Finance) → kirim solishtiriladi, yopilmagan avanslar ro'yxati. Kitob import avans bilan; ShVB unpaid-aging mos; model egasidan.
- **Manba:** v2-A (A-default) + kitob (import avans) + ShVB unpaid
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance

### EP-WMS-097 · Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati (v2 Q66)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — jo'natish hujjati buyurtmaga bog'lanib avtomatik (mijoz/mahsulot/miqdor/haydovchi/mashina). POS Q22 EXTERNAL_OUT + Q41 harakat akti PDF; kitob Элтиб бериш boshlig'i "логистика ва транспорт".
- **Manba:** BARCHA_JAVOBLAR POS Q22 + Q41 + kitob (Элтиб бериш) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, Элтиб бериш, Finance

### EP-WMS-098 · Haydovchi va mashinani jo'natishga biriktirish (v2 Q67)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — haydovchi + mashina raqami + chiqish vaqti + yetkazildi belgisi. Kitob Элтиб бериш boshlig'i "хайдовчилар" bilan ishlaydi.
- **Manba:** kitob (Элтиб бериш, хайдовчилар) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Элтиб бериш, SD, CC

### EP-WMS-099 · Yetkazib berishni tasdiqlash (mijoz qabul qildi) (v2 Q68)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — haydovchi qaytganda "yetkazildi/qaytdi/qisman" + sabab → sikl yopiladi. Jo'natish ≠ yetkazish; model egasidan.
- **Manba:** v2-A (A-default) + kitob (Элтиб бериш)
- **action:** UPDATE
- **⤳ Ta'sir:** Элтиб бериш, SD, reklamatsiya (QC)

### EP-WMS-100 · Material rezervatsiyasi (buyurtmaga band qilish) (v2 Q69)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — reja material bandlaydi (mavjud−band=erkin), erkin qoldiq ko'rinadi. Ikki buyurtma to'qnashuvini oldini oladi; model egasidan (PP/MRP bilan).
- **Manba:** v2-A (A-default) + kitob (reja, бекор туриш)
- **action:** CREATE
- **⤳ Ta'sir:** PP/MRP, SD, ichki logistika

### EP-WMS-101 · Material almashtirish (substitute) ruxsati (v2 Q70)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har materialga "ruxsat etilgan analog" ro'yxati; faqat shulardan, tasdiq bilan. Kitob: omborchi o'zicha местный chiqarsa nazoratsiz brak; analog oldindan belgilanadi. Model egasidan.
- **Manba:** v2-A (A-default) + kitob (toplayner/местный almashish)
- **action:** CREATE
- **⤳ Ta'sir:** PP texkarta, QC, ichki logistika

### EP-WMS-102 · Omborchi razryadi → ruxsat etilgan amal darajasi (v2 Q71)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — razryad → vakolat matritsasi (kirim/chiqim/inventarizatsiya/spisaniye alohida). Karta-model razryad asosli; matritsa egasidan (EP-WMS-024 bilan).
- **Manba:** v2-A (A-default) + karta-model (razryad)
- **action:** CREATE
- **⤳ Ta'sir:** HR/org-karta, ombor xavfsizlik

### EP-WMS-103 · Material hisobdan chiqarish (spisaniye) jarayoni (v2 Q72)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — spisaniye akti (material+sabab+miqdor+tasdiqlovchi → Finance zarariga). POS Q26 DAMAGE → QC moduliga avtomatik; auditga ochiq.
- **Manba:** BARCHA_JAVOBLAR POS Q26 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Finance (zarar), QC, audit

### EP-WMS-104 · Sarfni norma bilan og'ish tahlili (pere-raskhod) (v2 Q73)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har buyurtma yopilganda norma/fakt og'ishi % , chegaradan oshsa signal. Kitob texkarta norma mavjud; EP-WMS-054 bilan bir; chegara egasidan.
- **Manba:** v2-A (A-default) + kitob (texkarta norma)
- **action:** EVENT
- **⤳ Ta'sir:** PP norma, MES, Finance, QC

### EP-WMS-105 · Tovar qabulda foto-dalil (v2 Q74)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "shikast bor" belgilansa foto majburiy → reklamatsiyaga. POS Q16-17 AI kamera mavjud; HR Q129 inspeksiya foto (dalil/before-after) madaniyati.
- **Manba:** BARCHA_JAVOBLAR POS Q16-17 + HR Q129 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, QC, Finance

### EP-WMS-106 · Yetkazib beruvchiga qaytarish (vozvrat) jarayoni (v2 Q75)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qaytarish hujjati → zaxira kamayadi + Finance kreditor kamayadi. POS Q31 CHIQARISH → ta'minotchiga qaytish; kirimning teskarisi.
- **Manba:** BARCHA_JAVOBLAR POS Q31 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, Finance, QC

### EP-WMS-107 · Kunlik qoldiq hisoboti rahbarga avtomatik (v2 Q76)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik kunlik hisobot (qoldiq + harakat + signal) → CC orqali rahbarga. POS Q57 ombor menejer kunlik; kitob "кун якунида хисобот". EP-WMS-013 bilan bir.
- **Manba:** BARCHA_JAVOBLAR POS Q57 + kitob (kunlik hisobot) + v2-A
- **action:** CRON
- **⤳ Ta'sir:** CC, NTF, director dashboard

### EP-WMS-108 · Kritik material yetishmasligi proaktiv signal (v2 Q77)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — reja sarfi vs joriy qoldiq → "X material Y kunda tugaydi" prognoz + signal. PP/MRP bilan; signal-oluvchi sub-savol (Таъминот+IchLog / faqat ombor / Coordination) egasidan.
- **Manba:** v2-A (A-default) + kitob (бекор туриш oldini olish)
- **action:** CRON
- **⤳ Ta'sir:** PP/MRP, Таъминот, CC

### EP-WMS-109 · Ombor harakatining buxgalteriyaga (GL) avtomatik o'tishi (v2 Q78)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har harakat GL provodkasi (zaxira debet/kredit). POS Q43 "Avtomatik — har harakatda Debit/Credit (5-bosqich: AI hisoblaydi)". Memory: GL kanonik = `gl_entries`.
- **Manba:** BARCHA_JAVOBLAR POS Q43 + memory (gl_entries kanonik) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Finance/GL, audit

### EP-WMS-110 · Material narxini hisoblash usuli (FIFO/o'rtacha) (v2 Q79)
- **Holat:** ✅ JAVOBLANGAN (KONFLIKT)
- **Javob/Tavsiya:** ⚠️ KONFLIKT — POS Q35 aniq "FIFO narxi (partiya narxi bo'yicha)" deydi; v2 Q79-A esa "o'rtacha tortilgan" tavsiya qiladi. ⭐ POS-javob ustun = **FIFO** (egasi 2026-04-12 da javob bergan). Import valyuta kursi muzlatish (kelgan kun/oy oxiri) sub-savol egasidan.
- **Manba:** BARCHA_JAVOBLAR POS Q35 (FIFO) ╳ v2 Q79-A (o'rtacha) — POS ustun
- **action:** CREATE
- **⤳ Ta'sir:** Finance, PP tannarx

### EP-WMS-111 · Inventarizatsiya kamomadini mas'ul shaxsga bog'lash (v2 Q80)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har zona/material mas'ul shaxsga (материально-ответственное лицо) biriktiriladi; kamomad o'shanga. ShVB javobgarlik ruhi mos; model egasidan.
- **Manba:** v2-A (A-default) + ShVB (mas'uliyat)
- **action:** CREATE
- **⤳ Ta'sir:** HR, Finance, ombor xavfsizlik

### EP-WMS-112 · Ombor ↔ POS Monitor (zavod tableti) rol ajratimi (v2 Q81)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — POS Monitor = tezkor sex-pol amallari (skan kirim/chiqim/sanoq) → bir DB; WMS = to'liq boshqaruv/hisobot. Bitta haqiqat manbai. POS Q1 "ERP ichida modul, ERP DB ning bir qismi"; memory: kanonik = `warehouse_stock`.
- **Manba:** BARCHA_JAVOBLAR POS Q1 + memory `project_pos_monitor_purpose` (zavod ombori tableti) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** POS, WMS, Finance

### EP-WMS-113 · Material "kim uchun kritik" teskari ko'rinish (v2 Q82)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — material → "ishlatiladigan mahsulotlar/buyurtmalar" teskari ko'rinish. Yetishmovchilik ta'sirini darhol baholash; model egasidan.
- **Manba:** v2-A (A-default) + kitob (texkarta material bog'liqligi)
- **action:** READ
- **⤳ Ta'sir:** PP, ichki logistika, prioritet

### EP-WMS-114 · Yetkazib beruvchi minimal partiya / qadoqlash birligi (v2 Q83)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — min partiya + qadoqlash birligi → reorder yaxlitlanadi. Real buyurtma uchun; model egasidan (EP-WMS-065 bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот qadoqlash)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, MRP

### EP-WMS-115 · Zaxira aylanma tezligi (turnover days) ko'rsatkichi (v2 Q84)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — aylanma kunlari + signal (juda sekin/tez). EP-WMS-028/082 dead-stock dan farqli; chegaralar egasidan.
- **Manba:** v2-A (A-default) + ShVB (zaxira optimallashtirish)
- **action:** CREATE
- **⤳ Ta'sir:** Finance, Таъминот, director KPI

### EP-WMS-116 · Ombor zonasi sig'imi to'lganlik foizi (import oldidan) (v2 Q85)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — zona sig'imi + band hajm → to'lganlik %; kirim oldidan tekshiriladi. Import katta partiyaga joy; model egasidan (EP-WMS-076 bilan).
- **Manba:** v2-A (A-default) + kitob (import partiya)
- **action:** READ
- **⤳ Ta'sir:** Таъминот, ichki logistika

### EP-WMS-117 · Brak/karantin materialni sexga chiqishini qattiq bloklash (v2 Q86)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — brak/karantin statusli material chiqimda qat'iy bloklanadi (tizim ruxsat bermaydi). POS Q30 karantin bloklash + Q38 minus/blok mantiq; kitob brak oldini olish.
- **Manba:** BARCHA_JAVOBLAR POS Q30 + Q38 + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** QC, MES, ichki logistika

### EP-WMS-118 · Yetkazib beruvchidan kam/ortiq kelganda tolerantlik (v2 Q87)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ±% tolerantlik (masalan ±2%) ichida avto-qabul, tashqarisida tasdiqlash. Rulon vazni aniq emas; aniq % egasidan (EP-WMS-047/050 bilan).
- **Manba:** v2-A (A-default) + kitob (rulon vazn farqi)
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, kirim, Finance

### EP-WMS-119 · Ombor/ichki logistika ЦКП KPI (bekor turish + kechikishlar) (v2 Q88)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ombor KPI paneli (logistika kechikishlari + reja bajarilishi% + bekor turish daqiqalari). Kitob aniq statistikalar: "Ички логистика сабабли кечикишлар сони", "режа бажарилиш даражаси (%)". Karta-AI baho sub-savol (IchLog boshlig'i kartasiga / faqat bo'lim).
- **Manba:** kitob (ichki logistika statistikalari) + karta-model + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** org-karta KPI, MES, director

### EP-WMS-120 · Reorderda bir nechta beruvchiga tender (taklif solishtirish) (v2 Q89)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — reorder → 2-3 beruvchiga so'rov → taklif solishtirish → tanlash. Kitob Таъминот ko'p beruvchi bilan; narx optimal; model egasidan (ShVB ZVS bilan).
- **Manba:** v2-A (A-default) + kitob (Таъминот) + ShVB
- **action:** CREATE
- **⤳ Ta'sir:** Таъминот, MM, Finance

### EP-WMS-121 · Ish vaqtidan tashqari ombor amali nazorati (v2 Q90)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ish vaqtidan tashqari amal alohida belgilanadi (sabab + tasdiq). POS Q6 to'liq audit (timestamp); HR Q108/Q112 ish vaqtidan tashqari harakat hujjat+sabab madaniyati; kitob qat'iy smena/tanaffus.
- **Manba:** BARCHA_JAVOBLAR POS Q6 + HR Q108/Q112 + kitob (smena) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** HR (smena), audit, xavfsizlik

### EP-WMS-122 · Yangi material kartochkasi ochish huquqi + dublikat ogohlantirish (v2 Q91)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yangi kartochka faqat MM roli + tasdiq + o'xshash nom ogohlantirishi. POS Q18 "skanlashda topilmasa → yangi kartochka yaratish"; HR Q51 dublikat oldini olish (pasport+INPS+telefon) — material uchun analog mantiq.
- **Manba:** BARCHA_JAVOBLAR POS Q18 + HR Q51 (dublikat) + memory (master-data dublikat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MM, master-data, barcha modullar

### EP-WMS-123 · Material kim uchun: bizniki ╳ mijoz moli (davalcheskiy) (v2 Q92)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har zaxiraga "egasi" (biz/mijoz X), mijoz materiali faqat o'sha mijoz buyurtmasiga. Kitob "материалы заказчика" (давальческий) tushunchasi mavjud.
- **Manba:** kitob (материалы заказчика/давальческий) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** SD, ichki logistika, Finance (mulk emas), v2 Q19/Q102

### EP-WMS-124 · Smenalararo qoldiq topshirish (peresmenka akti) (v2 Q93)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — smena oxirida kalit materiallar qoldig'i qayd etilib keyingi smenaga topshiriladi (elektron akt). Kitob "3 сменалик" ishlab chiqarish; javobgarlik smenaga; model egasidan.
- **Manba:** v2-A (A-default) + kitob (3 смена)
- **action:** CREATE
- **⤳ Ta'sir:** HR (smena), MES, inventarizatsiya

### EP-WMS-125 · Material qaytib ishlatish (vtorichka) — chala rulon/kesindi qaytishi (v2 Q94)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yaroqli qoldiq "ikkilamchi" sifatida qaytadi (sifati pas belgisi). Kitob qoldiq chiqarish vazifasi; POS Q24 INTERNAL_RETURN (sabab majburiy).
- **Manba:** kitob (қолдиқ) + BARCHA_JAVOBLAR POS Q24 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** ichki logistika, Finance, QC

### EP-WMS-126 · Material yoshi (saqlanish vaqti) eskirish signali (v2 Q95)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kirim sanasidan yosh, ogohlantirish chegarasi (masalan 6 oy); eski material avval ishlatiladi. Qog'oz namlik tortadi; chegara egasidan.
- **Manba:** v2-A (A-default) + vizyon (qog'oz eskirishi)
- **action:** CRON
- **⤳ Ta'sir:** FIFO, dead-stock, QC

### EP-WMS-127 · Namlik/harorat sharoiti buzilganda signal (IoT) (v2 Q96)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — IoT datchik → chegaradan chiqsa signal + log. Qog'oz namlikka sezgir; signal-oluvchi (ombor+QC / faqat ko'rinish) sub-savol egasidan. Memory: IoT anomaly handler hozir no-op.
- **Manba:** v2-A (A-default) + memory (IoT mavjud, anomaly stub)
- **action:** EVENT
- **⤳ Ta'sir:** IoT, QC, MM

### EP-WMS-128 · Bo'yoq/kley/lak maxsus saqlash sharti va zona (v2 Q97)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — maxsus materialga "saqlash sharti" + "xavf turi" maydoni, alohida zona. Bosma/karton zavodi yong'in xavfi; EP-WMS-045 bilan; model egasidan.
- **Manba:** v2-A (A-default) + vizyon (bo'yoq/kley xavfi)
- **action:** CREATE
- **⤳ Ta'sir:** MM, QC, xavfsizlik

### EP-WMS-129 · Rulondan kesilgan formatlar (list) zaxirasi (v2 Q98)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kesish operatsiyasi rulon (kg) ni kamaytirib list (dona) zaxirasini yaratadi (ikki o'lchov bog'lanadi). MES kesish bilan; model egasidan.
- **Manba:** v2-A (A-default) + kitob (kesish/sex zaxirasi)
- **action:** CREATE
- **⤳ Ta'sir:** MES (kesish), ichki logistika

### EP-WMS-130 · Material namuna/probnik chiqimini alohida hisoblash (v2 Q99)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "namuna chiqimi" alohida sabab kodi, kichik miqdor — kamomad emas, izlanadi. POS Q21 sabab-kodli chiqimga mos; model egasidan.
- **Manba:** v2-A (A-default) + BARCHA_JAVOBLAR POS Q21 (sabab-kod)
- **action:** CREATE
- **⤳ Ta'sir:** QC, dizayn, Finance

### EP-WMS-131 · Inventarizatsiyani ABC bo'yicha chastotaga ajratish (sikl sanoq) (v2 Q100)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ABC ga qarab sanoq chastotasi (A-haftalik, B-oylik, C-yillik). POS Q52 aylanma inventarizatsiya + POS Q56 ABC tahlil → birgalikda; EP-WMS-027/058 bilan.
- **Manba:** BARCHA_JAVOBLAR POS Q52 + Q56 + v2-A
- **action:** CRON
- **⤳ Ta'sir:** inventarizatsiya, Finance, ABC

### EP-WMS-132 · Kirim/chiqim blankasini chop etish va ikki imzo (v2 Q101)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tizim blanka chop etadi (QR), ikki imzo, skani biriktiriladi. POS Q41 harakat akti PDF + Q19 label chop; HR Q77/Q104 har hujjat ERP da yoziladi + pechat + imzo statusi.
- **Manba:** BARCHA_JAVOBLAR POS Q41 + Q19 + HR Q77/Q104 + v2-A
- **action:** EXPORT
- **⤳ Ta'sir:** audit, Finance, ombor

### EP-WMS-133 · Ombor ijarasi (mijoz molini saqlash) hisobi va to'lov (v2 Q102)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mijoz moli alohida belgi, qiymatsiz (bizniki emas) + ijara Finance'ga oylik. Kitob давальческий + kod `wms-rental`; tarif (hajm×kun / oylik fiks / poddon×kun) sub-savol egasidan. EP-WMS-019/020/123 bilan.
- **Manba:** v2-A (A-default) + kitob (заказчик moli) + kod `wms-rental`
- **action:** CREATE
- **⤳ Ta'sir:** Finance (daromad), SD, ombor

### EP-WMS-134 · Ombor ichida ko'chirish (peremeshcheniye) izi (v2 Q103)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har ko'chirish (eski→yangi joy + kim) qayd etiladi, joriy joy doim aniq. POS Q25 INTERNAL_TRANSFER + Q6 to'liq audit (har o'zgarish); EP-WMS-074 bilan.
- **Manba:** BARCHA_JAVOBLAR POS Q25 + Q6 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** locator, audit, ichki logistika

---

*Yangilangan: 2026-06-08 | EP-WMS-001..134 (v1=31, v2=103). JAVOBLANGAN 75 / OCHIQ 59. Asosiy kashfiyot: POS Monitor 60-javobning ~46 tasi (Q15-60) AYNAN ombor qarorlari — WMS savollarining yarmidan ko'pi shu bilan yopildi. Kitob ichki-logistika/Таъминот/Элтиб-бериш yo'riqnomalari v2 Q53-Q103 ni gruntladi (топлайнер╳местный, грамаж, 3/5 qavat, поддон, рохлер, бекор туриш, чиқинди/қолдиқ, материалы заказчика). KONFLIKT: EP-WMS-110 narxlash (POS Q35 FIFO ╳ v2-A o'rtacha → FIFO ustun); EP-WMS-001 kanonik zaxira (warehouse_stock ╳ stocks parallel-dunyo).*
