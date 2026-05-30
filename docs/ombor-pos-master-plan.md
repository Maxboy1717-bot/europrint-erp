# EuroPrint — OMBOR + MOLIYA NAZORAT TIZIMI — TO'LIQ QOIDALAR

> Yagona spetsifikatsiya. 74+ savolli intervyu + vizyon asosida. Fazalarga bo'linmagan —
> bitta to'liq qoidalar to'plami. Har qoida raqamlangan va majburiy.

---

## §0. TIZIM NIMA

Bu moliya tomonidan to'liq nazorat qilinadigan, ko'p-omborli, barcode-asosli material nazorat
tizimi. Har inventar (eng kichigidan — "piyozgacha") barcode/QR oladi. Har xarid ombordan
prixod + kassadan rasxod bo'lib o'tadi. Xodim/ta'minotchi podotchet bilan javobgar. Bo'limlar
tur-omborlardan oladi va nimaga ishlatganini (zakazga bog'lab) yozadi. Markaziy ombor YO'Q —
o'rniga moliya rahbari uchun dashboard.

---

## §1. UMUMIY QOIDALAR

1.1. Modul ERP ning **umumiy PostgreSQL** bazasidan foydalanadi — alohida DB ulanishi YO'Q. NestJS modul.
1.2. Auth — **ERP SSO/JWT** orqali; rol ERP'dan avtomatik. POS o'z login/rol YARATMAYDI.
1.3. Frontend **yagona responsive** (PC + planshet + smartfon). Alohida native ilova YO'Q.
1.4. Interfeys 3 til: **o'zbek (lotin), o'zbek (kirill), rus** — foydalanuvchi tanlaydi. Har matn `tLabel` bilan.
1.5. **Offline:** internet uzilsa skan/kirim/chiqim local (IndexedDB) saqlanadi, qaytganda avto-sync (konflikt hal qilinadi).
1.6. Xato: kichik → toast/banner; katta/konflikt → modal dialog.
1.7. **Audit log to'liq:** har o'zgarish — kim, qachon, IP, eski/yangi qiymat, user-agent — yoziladi.
1.8. **Data 7 yil saqlanadi.** 7 yildan oldin avtomatik o'chirish TAQIQ; 7 yildan keyin arxivlash (o'chirmaslik).
1.9. **30+ terminal** bir omborga bir vaqtda yozsa ma'lumot buzilmasligi uchun PostgreSQL **transaction + qator-bloklash (FOR UPDATE)** majburiy. Harakat raqami SEQUENCE orqali (race yo'q).
1.10. **Config-driven (kengaytiriladigan):** ombor turi, akt turi, bildirishnoma, dashboard widget, kassa qoidalari — config jadval orqali; yangi qo'shish = 1 qator (kod o'zgartmasdan). Kengaytirish uchun `rules` JSONB.
1.11. **Toza boshlash:** eski ombor/material data arxivlanadi; yangi tuzilma erkin quriladi.
1.12. **Buzmaslik:** har o'zgarish additive; schema ADD-ONLY; mavjud ishlaydigan kod buzilmaydi. Mavjud jadval/servis qayta ishlatiladi (duplikat YO'Q).
1.13. **UI rasvo bo'lmasin:** har sahifa EP dizayn-tizim komponentlari + semantic token (raw hex/rgb TAQIQ).

---

## §2. ROLLAR VA RUXSAT

2.1. Rollar ERP'dan: ombor xodimi, ombor menejer, QC inspektor, moliya boshlig'i, kassir, **ta'minotchi (ichki snabjenets — maxsus rol)**, bo'lim menejer, rahbarlar (org-sxema), direktor, admin.
2.2. **Smena boshqaruvi YO'Q** (faqat audit log: kim qachon kirdi/chiqdi). Shift open/close kodi bo'lmasin.
2.3. **Ruxsat ikki o'lchovli:** (a) ombor/bo'lim cheklovi — har kim faqat o'z ombori/bo'limini ko'radi/ishlaydi; (b) org-sxema ierarxiyasi — rahbar quyi bo'limlarni, direktor/moliya hammasini.
2.4. **Har omborga biriktirilgan xodim + menejer** — faqat o'sha operatsiya qiladi (kirim/chiqim).
2.5. Bo'lim omboridan **faqat o'sha bo'lim xodimi** chiqim qila oladi.
2.6. Bitta xodim **bir necha bo'lim omboridan** ola oladi (many-to-many), HR sozlaydi.
2.7. **Tasdiq delegatsiyasi:** tasdiqlovchi rahbar ta'til/kasal bo'lsa → org-sxema bo'yicha **o'rinbosar** tasdiqlaydi (HR holati bilan).

---

## §3. OMBOR TURLARI VA HAR BIRINING QOIDALARI

3.0. Ombor turlari **config jadval** (`warehouse_types`): code, nom (uz/ru), kategoriya, ikonka, kirim oqimi, chiqim oqimi, karantin kerakmi, QC kerakmi, o'lchov asosi, etiket shabloni, `rules` JSONB. Har tur = **alohida sahifa, yagona dvigatel**. Yangi tur = 1 qator.

**3.1. HOM ASHYO ombori (raw_material)**
- Kirim: ta'minot (P2P) → **karantin** → **QC** → asosiy ombor.
- Chiqim: ishlab chiqarishga (rezerv/sarf).
- Kirimda barcode/QR avto + chop.

**3.2. RULON QOG'OZ ombori (paper_rolls)** — hom ashyo ichidan ajratilgan alohida ombor
- Kirim: P2P → karantin → QC.
- **Har rulon alohida QR:** o'lcham, **og'irlik (kg)**, partiya, yetkazuvchi, narx, sana.
- O'lchov **kg bo'yicha**; qisman ishlatilsa sarflangan kg ayriladi.

**3.3. HO'JALIK ombori (household_mro)**
- Kirim: P2P xarid.
- Chiqim: xodim/bo'limga iste'molga (podotchet); sarflanadi, qaytarish kutilmaydi.

**3.4. TAYYOR MAHSULOT ombori (finished_goods)**
- Kirim: **MES (ishlab chiqarish) → QC → ombor**; har dona/partiya QR.
- **Make-to-order:** har buyurtma individual; faqat buyurtma asosida ishlab chiqariladi (stockka emas). **AI rejalashtiradi** (BOM + hom ashyo rezerv + ishlab chiqarish → tayyor → buyurtmaga).
- Chiqim: **sotuv buyurtmasiga bog'lab** → moliya tasdiq → skan → jo'natish + **hisob-faktura**. Faqat tayyor mahsulot ombordan.

**3.5. ISHLAB CHIQARISH ombori (production)**
- Brak shu yerga tushadi va **hammaga ko'rinib turadi**. Yarim tayyor (WIP) shu yerda.

**3.6. BRAK/DEFEKT ombori (defective)**
- Kirim: QC rad etgan yoki ishlab chiqarish braki.
- Chiqim (QC tanlaydi): rework (MES) / utilizatsiya (akt) / yetkazuvchiga qaytarish / chegirmali sotish.

**3.7. MAKULATURA ombori (waste_paper)** — juda muhim
- Kirim: ishlab chiqarish chiqindisi (qirqim/brak qog'oz).
- Chiqim: sotish / qayta ishlash; qiymati moliyaga.

**3.8. ASBOB-USKUNA ombori (tools_equipment)**
- Kirim: P2P xarid.
- Chiqim: **kichik** (ruchka/qog'oz/kompyuter) → xodim profilidagi **"Mening inventarim"** (podotchet + qaytarish kuzatiladi); **katta uskuna** (rolik/yangi mashina) → org-sxema bo'yicha **rahbarlarga akt bilan** chiqim.
- Buzilsa → zarar akti → xodim hisobiga.

**3.9. BO'LIM omborlari (department_warehouse)** — org-sxemadagi har katta bo'lim (Ofset, Flexo...)
- Kirim: tur-ombordan **transfer** (so'rov → bo'lim menejer tasdiq).
- Chiqim: **ishga (zakazga) sarflash** — qaysi mahsulot/buyurtma uchun ishlatilgani yoziladi; rasxod moliyaga.
- **Norma:** AI tarixiy o'rtacha sarf asosida norma tavsiya qiladi; chetlanish belgilanadi (ortiqcha olish kamayadi).

3.10. **Karantin** = oraliq HOLAT (alohida ombor emas). **Ko'chma (mobil) ombor YO'Q** — faqat doimiy omborlar.
3.11. **Bin location freeform** — operator istalgan matn yozadi (A-3-12, Tokcha-5); qattiq struktura majburlanmaydi.

---

## §4. HARAKAT TURLARI QOIDALARI

4.1. **EXTERNAL_IN (tashqi kirim) — 5 bosqich:** DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL. Har bosqich tasdiq (`movementConfirmations`).
4.2. **EXTERNAL_OUT (tashqi chiqim):** faqat tayyor mahsulot ombordan. Tasdiq zanjiri: **Ombor menejer + Moliya + AI (to'lov tekshiruvi)** — uchalasi.
4.3. **INTERNAL_ISSUE (bo'limga berish):** ombor menejer 1 imzo.
4.4. **INTERNAL_RETURN (qaytarish):** **sabab MAJBURIY**; tasdiq kerak emas. Iste'mol qaytsa → stok; aktiv qaytsa → QC.
4.5. **INTERNAL_TRANSFER (ko'chirish):** bir xil tur omborlar orasida tezkor (tasdiqsiz); boshqa tur orasida menejer tasdiq. **Yuboruvchi beradi + qabul qiluvchi tasdiqlaydi** (ikki tomon).
4.6. **DAMAGE (zarar):** avtomatik QC moduliga o'tadi.
4.7. **Bekor qilish:** faqat DRAFT holatda. Tasdiqlangan harakatda — teskari (reverse) harakat yoziladi.
4.8. **Bitta harakatda cheksiz son material** (cheklov yo'q).
4.9. **Inventar pasporti** faqat EXTERNAL_IN da yaratiladi.

---

## §5. QC (SIFAT NAZORATI) QOIDALARI

5.1. Barcha EXTERNAL_IN avval **karantinga** tushadi; QC tasdiqlasa asosiy omborga o'tadi.
5.2. QC **3 qaror:** QABUL → asosiy ombor | REWORK → MES (qayta ishlash) | RAD → ta'minotchiga qaytarish YOKI brak ombori (QC tanlaydi).
5.3. Mijoz tayyor mahsulotni qaytarsa → QC tekshiruv → qayta sotish / brak; qaytim kirim + **dalolatnoma** (kim qatnashgani bilan).

---

## §6. BARCODE / QR / ETIKET QOIDALARI

6.1. **Har inventar** barcode/QR oladi (eng kichigigacha).
6.2. Format: **EAN-13** (savdo) + **Code-128** (partiya) + **QR**. Tur-maxsus (rulon = boy QR).
6.3. Generatsiya: kirimda **avtomatik** + termal printer (ZPL/EPL) darhol chop etadi. Yetkazuvchi barcode'i bo'lsa o'qiydi, bo'lmasa yangi.
6.4. **Etiket termal printer** (Zebra/TSC) + **tur-maxsus shablon** (rulon kg/o'lcham, oddiy material, tayyor mahsulot uchun alohida).
6.5. **Skanerlash 2 usul:** dedicated scanner (USB/Bluetooth) + AI kamera (brauzer BarcodeDetector/ZXing). Material qabulida ham kamera ulanadi.
6.6. **Material topilmasa:** (a) toast xato, (b) qo'lda qidirish, (c) yangi kartochka ochish, (d) admin Telegram xabar — to'rttala.
6.7. **Material kartochka:** AI tavsiya (skan/foto → nom/tur/birlik) + qo'lda kengaytirilgan maydonlar. **Bitta asosiy birlik**/material.

---

## §7. XARID–TO'LOV (P2P) QOIDALARI — YADRO (hamma omborda bir xil)

7.1. **Ta'minotchi = bizning ICHKI XODIM** (snabjenets, maxsus rol); u TASHQI yetkazuvchilar bilan ishlaydi. Podotchet ichki ta'minotchida.
7.2. **So'rov:** ta'minotchi Kommunikatsiya markazi orqali yozadi — nima / qancha / qayerdan / qachon olishi.
7.3. **Tasdiq:** so'rov **org-sxema bo'yicha DIREKTORGACHA** ko'tariladi; oradagi **HAR rahbar ketma-ket** tasdiqlaydi (eng yaqin rahbar → yuqori → direktor). Daraja **summaga qarab** (kichik summa kamroq bosqich, katta — direktorgacha) — `approvalMatrixConfig`.
7.4. **Pul:** rahbar/moliya belgilaydi — (a) kassir **avans** beradi (ta'minotchi nomiga podotchet), YOKI (b) ta'minotchi **o'z puli** bilan oladi → keyin reimburse.
7.5. **Xarid:** ta'minotchi tashqi vendordan **qo'lda tanlab** oladi (tasdiq bilan). **Logistika** zanjir ichida: yetkazuvchi/o'z transport/3-tomon; yetkazish narxi **tannarxga** (FIFO).
7.6. **Chek-bot:** ta'minotchi Telegram chek-bot orqali chek **rasmini** tashlaydi; bot **AI/OCR** bilan summa/tovarni o'qiydi → **3-tomonlama solishtiruv** (chek + so'rov + ombor kirim).
7.7. **Ombor kirim:** chek tasdiqlangach tovar tegishli tur-omborga **prixod** bo'ladi + barcode/QR avto.
7.8. **Reconcile (podotchet yopilishi):** ombor kirimdan keyin ta'minotchi/xodim podotchetidan pul yechiladi (avans → settled).
7.9. **Vendorga to'lov:** naqd (avans bilan) / bank o'tkazma / qarz (kreditor). Import bo'lsa bojxona xarajati tannarxga.
7.10. **Kassa = naqd nazorati:** har xarid (naqd yoki o'tkazma) — nima bo'lishidan qat'iy nazar — ombordan prixod/rasxod bo'lib o'tadi; pul olgan xodim nomiga yoziladi. Omborga kirim bo'lganda kassadan chiqim.

---

## §8. TA'MINOTCHI (VENDOR) QOIDALARI

8.1. **Tashqi yetkazuvchi reyestri:** nom/INN/kontakt/bank/kategoriya + xarid tarixi + chek arxivi.
8.2. **AI reyting:** narx + sifat (QC o'tish %) + muddat (yetkazish tezligi) birlashtirib reyting/tavsiya beradi.
8.3. **Tanlash:** ichki ta'minotchi qo'lda tanlaydi (tasdiq bilan); AI tavsiya yordam beradi.
8.4. **Narx:** doimiy vendor — shartnoma + prays-list; bir martalik — spot; AI narx kuzatuvi (qimmatlashsa ogohlantirish/boshqa vendor tavsiya).
8.5. **Takroriy xarid:** AI bashorat (qoldiq/sarf tezligi) → avto-so'rov; jadval bo'yicha; qo'lda — hammasi.
8.6. Ta'minotchilar turlari: doimiy/bir martalik, mahalliy/import, ishlab chiqaruvchi/diler, tovar/xizmat.

---

## §9. NARX, STOK, MOLIYA QOIDALARI

9.1. **Narxlash FIFO** (partiya narxi); FIFO tannarx hisoblash servisi.
9.2. **FEFO/FIFO:** muddatli material → FEFO (muddati qisqa birinchi); muddatsiz → FIFO (eski kelgan birinchi). Tanlov servis qatlamida.
9.3. **Ko'p-valyuta:** har valyuta saqlanadi (xarajat valyutasi) + **UZS ekvivalent** (kirim kunidagi kurs). Ikkalasi.
9.4. **Minus saldo:** aktiv material → **TO'LIQ BLOK**; iste'mol material → **OGOHLANTIRISH + ruxsat** (override sababi bilan).
9.5. **Stok real-time:** har harakat darhol PostgreSQL ga yoziladi (batch/kechiktirilgan yangilash YO'Q).
9.6. **GL (buxgalteriya):** har harakatda Debit/Credit avtomatik — standart harakat → qat'iy GL jadval; nostandart → **AI tavsiya** → **moliya tasdiqlaydi** (AWAITING_REVIEW). 5-bosqich.
9.7. **Bo'lim byudjet/norma:** AI tarix asosida tavsiya; limit oshsa ogohlantirish/blok.
9.8. **Amortizatsiya FI moduli** hal qiladi; POS faqat inventarni kuzatadi (POS ichida amortizatsiya YO'Q).
9.9. **1C integratsiya YO'Q** (ERP moliya yetarli). **Tashqi soliq/fiskal hisobot YO'Q** (faqat ichki).

---

## §10. XODIM MODDIY JAVOBGARLIK (PODOTCHET) QOIDALARI

10.1. Xodim **"Mening inventarim"** sahifasidan o'z balansini (mobil/web) ko'radi.
10.2. **Podotchet:** xodim/ta'minotchi qaytar yoki hisob berguncha uning balansida (javobgarlikda) turadi.
10.3. Iste'mol material qaytsa → stok; aktiv qaytsa → QC.
10.4. **Bo'lim so'rov workflow:** xodim → bo'lim menejer tasdiq → ombor xodimi beradi → ledger DEBIT. Ichki so'rov **majburiy tasdiqlanadi** (tasdiqsiz chiqim YO'Q).
10.5. **Ishdan chiqishda** xodim hamma narsani qaytaradi → keyin HR access beradi (POS↔HR offboarding bloki).

---

## §11. INVENTARIZATSIYA QOIDALARI

11.1. **Ikki usul birga:** davriy to'liq sanash (oylik/choraklik, tunda/dam kuni, ishni bloklamasdan) + kunlik cycle count.
11.2. Farq topilsa → **moliya tasdig'i bilan** GL tuzatish (avto GL, lekin moliya tekshiradi).
11.3. So'rov navbati **FIFO** (birinchi kelgan so'rov birinchi bajariladi).

---

## §12. HUJJAT / AKT QOIDALARI

12.1. Har harakatda kerakli hujjat **PDF:** harakat akti + (chiqimda) **hisob-faktura** alohida PDF.
12.2. PDF tarkibi: harakat raqami, sana, materiallar ro'yxati, kim topshirdi/qabul qildi, kompaniya rekvizitlari.
12.3. **Akt turlari (config-driven, kengaytiriladi):** kirim/qabul akti · chiqim akti + faktura · inventarizatsiya + farq dalolatnomasi · brak/zarar dalolatnomasi (komissiya imzosi) · asbob berish/qaytarish akti · utilizatsiya akti.
12.4. **Raqamlash:** Ombor + Tur + Yil + ketma-ket (masalan RM-KIRIM-2026-00001).

---

## §13. BILDIRISHNOMA QOIDALARI (config-driven)
13.1. Kam qoldiq (minimal darajadan past — qayta buyurtma).
13.2. Muddati tugashi (FEFO).
13.3. Byudjet/norma oshdi.
13.4. Tasdiq kutmoqda / podotchet muddati o'tdi.
13.5. **Har kirim/chiqim hodisasi** bo'yicha ham.

---

## §14. HISOBOT VA DASHBOARD QOIDALARI

14.1. Hisobot formatlari: **PDF + Excel/CSV**.
14.2. Hisobotlar: harakat jurnali · ombor qoldiqlari · xodim balansi/podotchet · inventarizatsiya akti · GL · ABC/aylanma/muddat tahlili · **har inventar Material 360 profili** (qoldiq+qiymat, butun kirim/chiqim tarixi sana/vaqt, narx+partiya+yetkazuvchi+chek, QR/QC/passport, hozir kimda).
14.3. **Moliya rahbari Dashboard** (real-time): KPI kartochka+grafik · har ombor qoldiq+qiymat (drill-down ombor→material) · bo'lim rasxodi · podotchet qarzlari · kassa harakati · ogohlantirish paneli.
14.4. **Analytics auditoriya:** AI (rejalashtirish) + Direktor (strategik) + Moliya (oylik) + Ombor menejer (kunlik).

---

## §15. INTEGRATSIYA QOIDALARI
15.1. ERP modullari bilan real-time (REST/event): **MM** (ta'minot) · **FI** (moliya/GL) · **MES** (tayyor mahsulot) · **HR** (xodim/offboarding) · **QC** · **org-sxema** (bo'limlar/tasdiq) · **Kommunikatsiya markazi** (so'rov) · **Logistika**.
15.2. **Telegram Mini App = web bilan TENG** (barcode skan · so'rov · tarix · tasdiq · chek-bot — hammasi).

---

## §16. TEXNIK / QURISH QOIDALARI
16.1. Yangi jadval faqat mavjud mos kelmasa. Reuse: tasdiq (`approvalMatrixConfig`/`multiLevelApprovalHistory`), avans (`advancePayments`), vendor (`vendors`), kirim (`pos-movement` EXTERNAL_IN), podotchet (`employee_ledger`).
16.2. Har o'zgarish: aniq reja → to'liq bajarish → BE/FE tsc 0 → jonli test → alohida commit (selective `git add`). **Yarim ish YO'Q.**
16.3. DB: migration `.sql` (`apps/api/src/shared/db/migrations/`) → ruxsat bilan jonli DB; **ADD-ONLY**.
16.4. Har FE matn `tLabel('common.ns.key','Default')`; har rang EP token (raw hex/rgb TAQIQ); pre-commit guard'lar PASS.
16.5. **Eski rasvo UI** (WMS extended sahifalar + pos-monitor/ eski sahifalar) yangi toza UI tayyor bo'lgach o'chiriladi/redirect.

---

## §17. BAJARILGAN (jonli, commit qilingan)
- Ombor tip taksonomiyasi + `warehouse_types` config-registri (9 tur) — jonli DB.
- P2P xarid-to'lov zanjiri YADRO (jonli test): org-sxema tasdiq-zanjir resolver · so'rov yaratish ·
  approve/reject zanjir bo'ylab · avans/podotchet · chek qabul + podotchet reconcile.
- Endpoint: GET approval-chain · POST/GET requests · POST decide · POST receive.
- FE: procurement.api.ts client + toza ProcurementPage (/wms/procurement).
