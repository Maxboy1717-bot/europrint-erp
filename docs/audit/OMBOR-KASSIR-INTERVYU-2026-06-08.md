# OMBOR · POS · KASSIR · TA'MINOT-ZANJIRI — EGASI INTERVYUSI (build-spec asos) — 2026-06-08

> Manba: `EUROPRINT-INTERVYU-SAVOL-JAVOB.md` (59 savol, 1-4 iyun, egasi to'g'ridan-to'g'ri javoblari).
> Bu — egasining ANIQ vizyoni. Build paytida WMS/POS/Finance-Kassir/CC/Kanban/Supply shu hujjatga amal qiladi.

## 0. ⚠️ ASOSIY OGOHLANTIRISH (egasi)
- **POS Monitor HOZIRGI holati = egasi xohlagani EMAS** (2-savol: "umuman man xohlagan narsa emas"). Build'dan oldin BE+FE to'liq tahlil + qayta loyihalash.
- **Hech kim qog'oz bilan kelmaydi** — BARCHA chiqim (hatto oylik/avans) **Kommunikatsiya Markazi + Kanban orqali → kassirga** (14-savol).
- **ERP = Microsoft Office kabi**; saqlab-olish/eksport CHEKLANGAN — faqat ba'zi hujjat, aniq sabab ko'rsatilib (14-savol).

## 1. OMBOR TAKSONOMIYASI (17-savol — markaziy ombor YO'Q)
**Tashqaridan kirim + ichkariga chiqim qiladigan omborlar:**
1. **Rulon qog'oz ombori** — eng qimmat, kg + har rulon QR
2. **Tayyor mahsulot ombori** (+ ijara varianti)
3. **Hom ashyo ombori** — asosiy (kley/kraska/ishlab chiqarishga ketadigan xom ashyo)
4. **Xo'jalik ombori** — tozalash/idish/ofis/oziq-ovqat (kundalik)
5. **Jihozlar ombori**
6. **Makulatura va brak ombori** (birga + QC-rad materiallar)
7. **Asbob-uskunalar ombori**

**Boshqa modullarga tegishli omborlar:**
- **Karantin ombori + Sifat nazorati ombori** → **QC moduli** (faqat ERP'da)
- **Flekso ombori + Ofset ombori** → **Ishlab chiqarish moduli**
- **Mexaniklar uchun alohida sahifa** (ishlab chiqarish ombori)

**Ko'rinish:** Excel'ga o'xshash JADVAL (kartochka emas, 16-savol). Har ombor jadvali avval tartiblanadi (nomi + ma'lumot + ishlatiladimi + kerak/keraksiz — 8-savol, agent ro'yxat qiladi).

## 2. HOM ASHYO ombori (22-24 savol)
- **KIRIM:** tashqaridan → avval **Karantin/QC** → keyin ombor.
- **CHIQIM (overflow mantiq):** 3 kg kraska kerak, lekin idish 5 kg → 5 kg beriladi → **bo'lim ichki omboriga +2 kg** o'tadi; hom-ashyo ombori **-2 belgilaydi** (keyingi safar kam berish uchun); bo'lim o'sha 2 kg'ni biror buyurtmaga ishlatsa → **AI ikkala ombordan ham o'sha buyurtmaga rasxod** qiladi.
- O'lchov birliklari turlicha.

## 3. KARANTIN + SIFAT NAZORATI gate (31-33 savol)
- **HAR tashqi material** → karantin (hatto piyoz ham QC'dan o'tadi).
- Logistika/ta'minotchi **kelish vaqti/holatini oldindan belgilaydi → QC'ga bildirishnoma**.
- Material jismonan omborga tushadi, LEKIN QC **dalolatnoma + parametrlar** (o'lcham/og'irlik/namlik/sifat) kiritmaguncha **BLOK** — boshqa omborlar foydalana olmaydi.

## 4. RULON QOG'OZ ombori (35-37 savol) — eng qimmat, doim nazorat
- Har rulon **kg + QR** (kattaroq barcode) + **taxminiy m²** (AI hisoblaydi, qolgani qo'lda kirim).
- 500 kg rulon, ishlab chiqarish 400 kg kerak → **bo'lib bo'lmaydi**, lekin **qaytishi + qolishi nazorat** qilinadi (hom ashyo kabi).
- Ba'zilari **list** ko'rinishida ham keladi.
- Ishlab chiqarish: **ish boshlashdan oldin IoT tablet so'roviga nisbatan skaner** → keyin ish boshlaydi (o'zidan rasxod).

## 5. MAKULATURA / BRAK ombori (39-48 savol)
- Bitta ombor (makulatura + brak + QC-rad).
- **Brak NORMASI** har buyurtmaga (AI/menejer belgilaydi); **normadan oshiq → xodimdan ushlanadi** (46-savol).
- **CHIQIM:** POS Monitor orqali (ombor menejeri); ortiqchasini AI aniqlaydi.
- ⭐ **Ishxonadan chiqadigan HAR narsa to'liq ERP'dan rasxod/chiqim** — o'g'irlik to'liq oldi olinadi.

## 6. TAYYOR MAHSULOT ombori (50-54 savol)
- **KIRIM:** MES'dan (planning reja + MES real holat birga); faqat buyurtmaga, har zakaz unikal; **menejer javobgar**.
- **CHIQIM:** AI kameralar har chiqishni **suratga oladi + buyurtmaga bog'laydi**; AI **invoys QR/barcode o'qiydi**; mashina gaplashilgan bo'lsa **rasxodini tasdiqlaydi** (ombor + xavfsizlik xodimi qanchaga gaplashilganini tasdiqlaydi). Bu yerga **kuchli AI kameralar**.
- **IJARA:** tayyor mahsulot belgilangan muddat (30 kun) **bepul**, keyin **har kun m²(kv)ga pul** → buyurtmani olgan **menejerga** (sozlamalardan; menejerga har kuni PDF).
- **Lahtak (qoldiq):** mahsulot chiqgach lahtak qolsa → kimning aybi bilan qolgan bo'lsa → **avtomatik o'sha (aybdor) profiliga/tayyor-mahsulot omboriga** o'tadi, klientga yetib borguncha; keyin yechiladi. Aybdorni ombor menejeri qo'lda belgilaydi (54-savol).

## 7. XO'JALIK ombori (56-57 savol)
- Tozalash, idish, ofis kerak-yarog'i, oziq-ovqat (kundalik xo'jalik).
- Chiqim: **so'rov bilan + davriy normaviy** (ikkalasi).

## 8. 💵 KASSIR / NAQD-PUL NAZORATI (9-14 savol) — eng muhim
- **1 ta kassir**: oylik + avans tarqatadi + **HAMMA naqd pulni nazorat** qiladi.
- **Oylik/avans NAVBATI = xodim REYTINGIga qarab** (reyting formulasi keyinga qoldirildi — 12-savol).
- Har xodim **kunlik ishlagan pulini har kuni PDF** qabul qiladi.
- ⭐ **HAR SO'M HISOBLI:** istalgan xodim biror narsaga pul olsa → **xodim profiliga yoziladi** → o'sha narsa **uning nomidan omborga kirim** bo'lmaguncha → **profilda qarz** bo'lib turadi.
  - Misol: ta'minotchi logistika mashinasiga 1 mln oldi → **omborchi + xavfsizlik xodimi shofyordan so'rab tasdiqlaydi**. Ruchkaga 5 ming oldi → omborga kirim bo'lmaguncha profilda.
- **Xodim profili ko'rsatadi:** jami qancha olgan / nimaga / qanchasi tasdiqda / qancha qarz.
- **Oylik / avans / kredit** — **jarima va mukofot pullaridan ALOHIDA** turadi.
- **Chek (taksi misoli):** xodim chekni bar yoki ERP orqali yuklaydi → **AI o'qiydi + solishtiradi** → **ODAM (kassir/moliya) yakuniy tasdiqlaydi** (11-savol) → keyin yopadi (profildan butunlay emas).
- Savdoga qaratilgan pul tizimi ham bor; o'qish/safar/onlayn xarid kabi **o'lchash qiyin** xarajatlar alohida aniqlanadi (13-savol).
- Xarajat turlari: alohida kategoriya + bitta tizim "sabab" bilan + ba'zilari ombor orqali, ba'zilari (o'qish/safar) faqat profil-qarz orqali (14-savol).
- ⭐ **BIRLASHTIRISH:** Kassir + Kommunikatsiya Markazi 3-Savat + Kanban → bitta tizim; kassir hisobotlari **avtomatik**; kirim/chiqim to'g'rilanadi.

## 9. TA'MINOT-ZANJIRI (procurement, 5-6 savol — oltin-ip xarid tomoni)
```
Savdo buyurtma ochadi
  → AI omborni tekshiradi (bor/yo'q)
  → yo'qlarini Ta'minotchiga beradi
  → Ta'minotchi so'rov tayyorlaydi
  → Kommunikatsiya Markazi 3-Savat (hujjat oqimi)
  → /erp-dashboard/kanban (tasdiqlovchilar — ORG-SXEMA bo'yicha)
  → tasdiqlansa sotib olinadi
  → Logistikaga beriladi
  → Ombor barcode/shtrix-kod bilan KIRIM
```

## 10. KANBAN + CC tuzatishlari (14-savol)
- **Kanban UMUMIY bo'lmasin** — kimga tegishli bo'lsa **faqat shularga** ko'rinadi (org-sxema bo'yicha; mas. avans arizam faqat rahbarlarimga).
- **Kanban doskalari STANDART** — faqat **super admin** yaratadi.
- **Kommunikatsiya Markazi 3-Savat hujjat oqimi TO'LIQ EMAS** → keyingi rejalarga to'liq qilish.

## 11. AI PLANNING (37-38 savol)
- Bu rejalashtirishni **AI** `/erp-dashboard/planning` bajaradi.
- Ma'lumotni asosan **savdo menejerlari** kiritadi; bir qismini (ip/paddon kabi qo'shimcha) **ishlab chiqarish rahbarlari**.

## 12. PRES kirim (43-44 savol)
- Pres operatori: **POS sahifa → kg kiritadi → printerdan shtrix-kod → yopishtiradi → ERP avtomatik kirim** + AI kamera nazorat.

## 13. RAQAMLASH / TEMPLATE / IMZO
- Raqam = **Ombor + harakat-turi + yil + ketma-ket** (mas. `HOM-KIRIM-2026-00001`, 29-savol).
- PDF = **bitta umumiy zamonaviy shablon**, ichidagi ma'lumot harakatga qarab o'zgaradi (28-savol).
- Imzo = **ERP login** (tizimga kirish = imzo, avtomatik — 26-savol).
- Har harakat: harakat akti (PDF) + invoys (alohida PDF).

## 14. 🚚 O'G'IRLIK OLDINI OLISH (48-49 savol)
- Ishxonadan chiqadigan **har narsa to'liq ERP rasxod**.
- **AI kamera + OVOZ tahlili**; kirib/chiqib ketgan **mashinalar yozib boriladi**; **xavfsizlik xodimi mashina + haydovchi ma'lumotini to'liq kiritadi**; suratlar + data (49-savol — hamma omborga tegishli).

---
## 15. ⤳ MODULLARGA TA'SIR (build-da o'zgaradi)
| Modul | O'zgarish |
|---|---|
| **WMS** | Ombor taksonomiyasi (7+QC+IChQ); hom-ashyo overflow; rulon kg+QR+m²; QC-gate blok; Excel-jadval ko'rinish; raqamlash; xo'jalik/jihozlar/asbob ombor |
| **POS Monitor** | ⚠️ TO'LIQ qayta loyihalash (egasi: "xohlaganim emas"); pres-kirim oqimi; chiqim AI-nazorat |
| **Finance — KASSIR** | Yangi to'liq kassir sub-modul: podotchet/har-som-hisobli/profil-qarz/chek-AI/kunlik-PDF/reyting-navbat |
| **CC (3-Savat)** | Hujjat oqimi TO'LIQ qilinadi; kassir+kanban bilan birlashadi; eksport cheklash |
| **Kanban** | Org-sxema scoped ko'rinish; super-admin-only doskalar |
| **SD/PP/AI** | Ta'minot-zanjiri (savdo→AI-tekshiruv→ta'minot→CC→kanban→xarid→logistika→kirim); AI planning |
| **QC** | Karantin/sifat ombor + dalolatnoma-gate + kelish-bildirishnoma |
| **IoT/MES** | Rulon/material skaner ish-oldidan; tayyor-mahsulot MES-kirim; AI kamera (chiqim+ovoz) |

## 16. ⏳ KEYINGA QOLDIRILDI (egasi)
- **Xodim reyting formulasi** (12-savol: "chalg'ib ketamiz, keyingiga") — oylik/avans navbatini belgilaydi.
- POS↔Ombor eski/yangi oqim birlashtirish (1-savol — texnik, build-da).

## 17. ANIQLOVCHI JAVOBLAR (egasi, 2026-06-08)
- **A1. Jihozlar ≠ Asbob-uskuna:** Jihozlar ombori = kompyuter/mebel/forma (ofis/ish-joy jihozi); Asbob-uskunalar ombori = ishlab chiqarish asboblari (**qolip/STP, pichoq, klishe**).
- **A2. Tayyor mahsulot ijara:** standart **30 kun bepul → keyin kunlik m²**, lekin **SOZLANADIGAN** (muhim mijoz/shartnomaga moslash mumkin).
- ⭐ **A3. Flekso/Ofset (sex) ombori = ishlab chiqarish marshrut zanjiri:** hom-ashyo ombori → **flekso/ofset omboriga material keladi** (rulon qog'oz/hom ashyo) → sex **sarf qiladi (ishlab chiqaradi)** → **yarim-tayyor keyingi sexga**: **flekso → ofset → kashirovka → tigel → qadoqlash** → qoldiq/qaytish **nazoratda** (rulon 500→400 mantig'i). ⤳ PP routing zanjiri shu.
- **A4. Kunlik 'ishlagan pul' PDF:** uskunada ishlovchi = **real ishlab chiqargani** bo'yicha; boshqa xodim (ofis/farrosh/dizayner) = **oylik ÷ ish kunlari** (kunlik ulush).
- **A5. Bo'lim ichki ombori:** har bo'limning **o'z ichki ombori bor (DEPARTMENT_* tip)** — overflow (+2kg), bo'limga berilgan material shu yerda; 7 asosiy ombordan alohida tip.
- **A6. Inventarizatsiya:** **sikl-sanash** — rulon/hom-ashyo (eng qimmat) **tez-tez** (haftalik), qolgani **davriy** (oylik); **tunda/dam kuni** (ish to'xtamaydi), zona muzlatiladi.
- **A7. Kassir kunlik PDF:** **kun oxirida avto-generatsiya** → **Telegram + ERP** → xodim ko'radi (qabul qilganini belgilaydi).
