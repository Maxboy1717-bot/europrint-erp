# OMBOR POS-TERMINAL INTERFEYS — SPEC (EGASI O'Z SO'ZLARIDAN)

> Manba: egasi 2026-06-02 "15 savol" ombor-intervyusi (claude-is-responding.md VERBATIM) + OMBOR-KASSIR-INTERVYU + BARCHA_JAVOBLAR (POS #1-60) + decisions/10,19.
> ⚠️ Egasi 2026-06-27: "men interfeys haqida ALLAQACHON javob berganman, qayta so'rmang — javoblarimdan quring". Bu spec = egasi javoblari, qayta-so'rov EMAS.

---

## 0. ASOSIY G'OYA (egasi VERBATIM)
> *"pos manitorga o'xshash bo'lsin dedim sizga, kirimga alohida chiqimga alohida ekran erpda alohida bo'lsin, lekin hamma datalar erpda qolsin deganman"*

**Terminal = do'kon kassasi/skaner uslubidagi ekran** (katta tugma, savat, tez amal) — quruq Excel-jadval EMAS. Omborchi uchun ERP ichida **alohida, sodda ekran**; data markaziy ERP bazasida qoladi. Egasi 3 rasm ko'rsatgan ("pos manitor chegarachi").

---

## 1. KIRISH (login)
- **ERP login** (SSO/JWT) — alohida POS login/smena oynasi YO'Q. Rol ERP'dan avtomatik tortiladi. Login = imzo (avtomatik). Smena boshqaruvi kerak emas, faqat audit-log (kim qachon kirdi/chiqdi).
- Qurilma: **responsive web** (PC + planshet + smartphone), native app yo'q. 30+ terminal bir vaqtda.

## 2. KIRGACH — OMBOR
- Xodim↔ombor: **warehouse_employees** jadvali (jonli DB: user_id, warehouse_id, role, **is_primary**, removed_at). Bir xodim **bir nechta omborga** biriktirilishi mumkin (is_primary=asosiysi). HR sozlaydi.
- 🔓 **OCHIQ #1:** is_primary ombori avto-ochiladimi (tanlov yo'q), yoki bir nechta bo'lsa tanlov chiqsinmi? *(egasi "bir necha omborga ega bo'ladi" degan → tanlov ehtimoli)*

## 3. AMAL TURLARI (egasi sanagan — bosh ekran tugmalari)
EXTERNAL_IN (tashqi kirim) · EXTERNAL_OUT (tashqi chiqim, faqat tayyor mahsulot) · INTERNAL_ISSUE (bo'limga berish) · INTERNAL_RETURN (qaytarish) · INTERNAL_TRANSFER (ombor ko'chirish) · DAMAGE (zarar akti).
MVP 1-navbat: **barkod-skan + EXTERNAL_IN/OUT**.

## 4. KIRIM ekrani (egasi VERBATIM)
> *"chiqim faqat skayner orqali, kirim esa qo'lda. barcode bo'lmasa qabul qilmaydi, har bir inventarga majburiy bu"*
- **Alohida ekran. Kiritish QO'LDA** (skaner+qo'lda ikkalasi). **Barkod MAJBURIY** — barkodsiz ERP qabul qilmaydi.
- **Barkod kirim paytida "tug'iladi"** — POS Monitor printeridan chiqadi (**ERP'dan emas!**). Etiket shabloni+o'lchami **har ombor turiga moslashadi** (rulon=katta+kg, oddiy=kichik, tayyor=boshqa), config-driven.
  > *"erp da emas pos manitordan chiqaradi buni dedim, har bir omborga o'lchamlari har bo'ladi"*
- Oqim: har tashqi material → **avval KARANTIN** → QC dalolatnoma+parametr (o'lcham/og'irlik/namlik/sifat) kiritmaguncha **BLOK** → QC 3 qaror: QABUL→asosiy ombor | REWORK→MES | CHIQARISH→ta'minotchiga qaytarish.
- Inventar pasporti faqat EXTERNAL_IN'da.

## 5. CHIQIM ekrani (egasi VERBATIM)
> *"faqat 1: skaner o'qiydi → material+qoldiq chiqadi → miqdor kiritadi → sabab/buyurtma → tasdiq"*
- **Alohida ekran. FAQAT skaner** — qo'lda chiqim YO'Q.
- ⛔ **BRON-BLOK:** agar AI-planning o'sha inventarni boshqa buyurtmaga bron qilgan bo'lsa → chiqim **BLOK** (faqat bo'sh qoldiq chiqadi). AI-planning buyurtma rejaga tushganda avto-bron qiladi. Bronni faqat **super_admin/direktor** favqulodda buzadi.

## 6. MIQDOR / OG'IRLIK
- Rulon: **kg + har rulon QR**; taxminiy m² AI hisoblaydi, qolgani qo'lda.
- 🔓 **OCHIQ #2:** tarozi terminalga avto-og'irlik yuborsinmi, yoki ekran-klaviaturadan qo'lda? *(egasi tarozi-avto-ulanishni aynan aytmagan)*

## 7. YAKUNLASH → SIFAT (QC)
- DAMAGE (zarar) → QC moduliga avto. Kirim → karantin → QC tasdiq.
- 🔓 **OCHIQ #3:** qaysi terminal-amal (chiqim/brak/kirim) yakunlangach QC-tasdiqga o'tadi? *(kirim→QC aniq; "har yakunlash→QC" aynan aytilmagan)*

## 8. OMBOR TURLARI (egasi 17-savol — markaziy ombor YO'Q)
7 asosiy: (1) Rulon qog'oz (eng qimmat, kg+QR) · (2) Tayyor mahsulot (+ijara) · (3) Hom-ashyo (kley/kraska) · (4) Xo'jalik (tozalash/idish/ofis/oziq-ovqat) · (5) Jihozlar (kompyuter/mebel/forma) · (6) Makulatura+brak (birga) · (7) Asbob-uskuna (qolip/STP/pichoq/klishe).
+ Boshqa modul: Karantin+QC ombori (→QC), Flekso+Ofset sex ombori (→Ishlab chiqarish, marshrut zanjiri).
- 🔓 **OCHIQ #5:** yakuniy kanonik ro'yxat (7 asosiy + sex + QC + 30+ DEPARTMENT). Egasi "13 tur" ham degan; jonli DB'da 9 seed.

## 9. ⭐ "OMBORLARDAN TASHQARI BO'LIMLAR" (egasi qayta ta'kidlagan)
- **Har bo'limning O'Z ICHKI OMBORI** = DEPARTMENT_* tip — 7 asosiy ombordan ALOHIDA. **30+ bo'lim** (oshxona, HR, dizayn, IT, har sex...), bo'lim kodi org-sxemadan.
- Bu yerda **overflow** yotadi: hom-ashyo 5 kg berildi, 3 kerak → +2 kg bo'lim ichki omboriga, hom-ashyo ombori −2. Bo'lim o'sha 2 kg'ni buyurtmaga ishlatsa → AI **ikkala ombordan** o'sha buyurtmaga rasxod qiladi.
- **Faqat o'sha bo'lim xodimlari** chiqim qila oladi. So'rov: Xodim → Bo'lim menejer tasdiq → Ombor xodimi beradi → Ledger DEBIT.
- Sex marshrut: hom-ashyo → flekso/ofset omboriga → sex sarflaydi → yarim-tayyor keyingi sexga (flekso→ofset→kashirovka→tigel→qadoqlash).

## 10. HAR HARAKAT → INVOYS PDF
- Har kirim/chiqim/transfer + ishlab-chiqarish bosqichi tugashi → avto-PDF. ERP'da saqlanadi + bot org-sxema bo'yicha yuboradi + download faqat ruxsat (sabab bilan).
- Raqamlash: Ombor+harakat-tur+yil+ketma-ket (mas. `HOM-KIRIM-2026-00001`). Imzo = ERP login.

## 11. AI KAMERA + SKANER
- AI kamera: kirim/chiqim surat/video + o'g'irlik nazorati + QR/shtrix o'qish + ovoz + KPP (mashina/haydovchi/yuk surati).
- Skaner: dedicated (USB/Bluetooth) + AI kamera (ZXing.js brauzer + OpenCV server fallback).

## 12. INVENTARIZATSIYA
- Tunda/dam kuni (ish to'xtamaydi), sikl-sanash (rulon haftalik, qolgani oylik), zona muzlatiladi, planshet-skaner bilan, tizim farqni avto. GL avto, moliya tasdiqlaydi.

## 13. RANG/VIZUAL
- 🔓 **OCHIQ #4:** egasi terminal-amal rang-kodini (kirim=yashil...) aynan aytmagan (org-karta/holat ranglarini aytgan). Dizayn-tizim tokenidan kelsinmi yoki amal-rang sxema?

---

## YAKUNIY — 5 OCHIQ (egasi HALI aytmagan, fabrikatsiya TAQIQ Q-40):
1. Login→ombor: avto-ochilish (is_primary) vs tanlov (bir necha ombor).
2. Miqdor: tarozi-avto vs ekran-klaviatura.
3. Yakunlash→QC: qaysi amal QC-tasdiqga o'tadi.
4. Rang: amal-rang sxema vs dizayn-token.
5. Ombor turlari yakuniy ro'yxat/son.

*Qolgan HAMMA narsa egasi VERBATIM bergan → qayta so'ralmaydi, shu spec bo'yicha quriladi.*
