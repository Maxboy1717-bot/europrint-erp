# OCHIQ savollar — egasi javoblari (build uchun) — 2026-06-08

> Decision-map'dagi 🔵 OCHIQ savollarga egasi javoblari. Build paytida SHU javoblar ustun.
> A = decision-map'dagi A-tavsiya qabul qilindi. O'zgartirilganlar alohida yozilgan.

## ORG / KARTALAR

### 1-qism (EP-ORG-043…062)
- **EP-ORG-043** Razryad jadval ustunlari = **A + razryad KARTA ICHIDA ko'rinadi, darajasiga qarab RANGLI** (nom+raqam+min-talab+oylik-bandi+imtihon-turi+sertifikat+tavsif). [bog'liq: KARTALAR Q36 karta rangi]
- **EP-ORG-044** Razryad nomlash = A (raqam+nom, "4-razryad — Katta mashinist").
- **EP-ORG-045** Razryad oylik bandi = A ("dan-gacha" oraliq; bo'lim taklif→HR tasdiq).
- **EP-ORG-046** Razryad imtihon turi = A (nazariy test + amaliy sinov, ikkalasi).
- **EP-ORG-047** Sertifikat/litsenziya = A (kartada ro'yxat + amal muddati; 30 kun ogohlantirish).
- **EP-ORG-049** ЦКП o'lchov turi = A — **ЦКП ta'rifini HR matn qilib yozadi**; o'lchov = SON / FOIZ / VAQT (kartaga moslab). [KARTALAR Q15 bilan bir xil]
- **EP-ORG-051** ЦКП norma joyi = A (kartada standart norma + xodimga shaxsiy tuzatish).
- **EP-ORG-053** Savol-bank tuzilishi = A (karta-turi + razryad bo'yicha; matn/variant/javob/qiyinlik).
- **EP-ORG-055** O'tish chegarasi (ball) = **SOZLANADIGAN** (qotirilgan 60/75% emas — egasi/HR har razryadga sozlaydi, master-data).
- **EP-ORG-056** Qayta topshirish qoidasi = **SOZLANADIGAN** (14 kun / yiliga 3 marta qotirilmaydi — sozlanadi).
- **EP-ORG-058** Shablon o'zgarsa eski kartalar = A (o'zgarmaydi; ixtiyoriy "moslashtirish" tugma).
- **EP-ORG-059** Shablon boshlang'ich to'plami = A (zavodga xos 10-15 lavozim tayyor).
- **EP-ORG-060** I.o. tayinlash = A (muddatli i.o., sana bilan, avtomatik qaytadi).
- **EP-ORG-061** I.o. davridagi oylik = A (o'z oyligi + i.o. ustamasi).
- **EP-ORG-062** I.o. huquqlari = A (kunlik operatsiya=ha, pul/kadr qaror=yo'q, eskalatsiya).

### 2-qism (EP-ORG-064…092)
- ⭐ **TUZATISH:** Karta = ATOMIK (1 o'rindiq). Xodim KO'P karta egallashi mumkin; oylik/data **kartalardan XODIM PROFILIGA yig'iladi** (KARTALAR Q4 tasdiq). Karta=manba, profil=yig'indi.
- **EP-ORG-064** Kartani birlashtirish = **YO'Q** (atomik; struktura o'zgarsa eski karta arxivlanadi + yangi yaratiladi, merge YO'Q).
- **EP-ORG-065** Kartani bo'lish = **YO'Q** (atomik; merge/split mexanizmi yo'q).
- **EP-ORG-066** Ko'p-karta oylik = A (stavka ulushi 0.5+0.5=1.0, oylik kartalardan profilга yig'iladi, max 1.0; oshsa owner ruxsati).
- **EP-ORG-072** Vakansiya aging = A (0-14 yashil/15-45 sariq/45+ qizil+ogohlantirish).
- **EP-ORG-073** Vakansiya prioritet = A (3 daraja: kritik/o'rta/past).
- **EP-ORG-074** Vakansiya SLA = A (kritik 14/o'rta 30/past 60 kun).
- **EP-ORG-075** Ommaviy import = A (Excel shablon + xato satrlar ajratiladi).
- **EP-ORG-076** Import xatolari = A (to'g'ri yuklanadi, xatolar ro'yxat bilan qaytariladi).
- **EP-ORG-080** "Bo'sh kartalar" filtri = A (tayyor filtr + aging saralash).
- **EP-ORG-082** Saqlangan ko'rinishlar = A (shaxsiy saqlangan filtr).
- **EP-ORG-087** Kartadagi talablar ro'yxati = A (strukturali: tur/daraja/majburiy — AI o'qiydi).
- **EP-ORG-092** Razryad attestatsiya = A (muddatli qayta tasdiqlash).

### 3-qism (EP-ORG-093…)
- **EP-ORG-093** Past-moslikda tayinlash = A (ogohlantiradi+sabab so'raydi, BLOKLAMAYDI; rahbar/owner qaror).
- ⭐ **EP-ORG-094** Smena karta = **3 ta ALOHIDA karta** (Operator-01/02/03, har biri 1 o'rindiq=1 xodim). Q2 tasdiq: 1 karta=1 o'rindiq; "1 kartada ko'p stavka" RAD etildi.
- **EP-ORG-096** Mahsulot slotlari = A (kartada bir nechta mahsulot/ish, har biri alohida hisoblanadi).
- **EP-ORG-097** Xato-katalog = A (har kartada tipik xatolar katalogi, hodisa shundan tanlanadi → statistika).
- **EP-ORG-098** Ijobiy baho = A (AI baho IKKI tomonlama: xato − + yaxshi ish +).
- ⭐ **EP-ORG-101** 4/5 bo'lim = HA, lekin **FUNKSIYA sifatida** (alohida karta EMAS): 4=bevosita ishlab chiqarish (dastgoh/operator), 5=qo'llab-quvvatlash (sifat/reja/dizayn/konstruktor) — kartada funksiya-tegi.
- ⭐ **EP-ORG-102** Bo'lim/daraja kodi = HA kartada belgilansin, LEKIN **O'ZBEK TILIDA**. НО=Nachalnik Otdela=bo'lim boshlig'i, RO=Rukovoditel Otdela=bo'lim rahbari — 7-bosqich ierarxiya nomlari o'zbekchaga o'giriladi (har karta o'z daraja-nomiga ega).
- **EP-ORG-106** Malaka talablari = A (strukturali: ta'lim/tajriba-yil/dastur/ko'nikma — AI/recruitment solishtiradi).
- **EP-ORG-109** Javobgarlik = lavozim-yo'riqnomasi + moddiy javobgarlik oldindan kartada **FAYL** tarzda; jihoz-javobgarligi + umumiy = xodim **PROFILIDA** + standart kartalarda; qo'lda ham kiritiladi.
- **EP-ORG-110** Huquqlar = A (kartadagi huquq = haqiqiy ERP harakati; RBAC kartadan).
- **EP-ORG-111** ЦКП kim yozadi = A — **HR** ta'rif + o'lchov usulini yozadi (markaziy, bir xil sifat). KARTALAR Q15 tasdiq.
- **EP-ORG-112** ЦКП kaskad = A (quyi kartalar natijasi → yuqoriga avtomatik to'planadi).
- **EP-ORG-114** Rahbar KPI = A (quyi kartalardan to'planadi — 112 bilan bir xil).
- **EP-ORG-113** Avto-statistika = A (natija raqamlari modullardan avtomatik to'ladi, qo'lda emas).
- **EP-ORG-117** Siyosatlar = A (turi bo'yicha kartaga avtomatik biriktiriladi).
- **EP-ORG-118** Unvon = A (lavozim nomi + unvon/rutba alohida maydon, razryad bilan birga).
- **EP-ORG-127** Ish-yo'riqnoma = A (karta 2 qatlam: vazifa ta'rifi + amaliy qadamlar).
- **EP-ORG-129** Lug'at = A (karta atamalar lug'ati + darslikda tooltip).
- **EP-ORG-130** ЦКП formula turi = A (4 tur: miqdor%/sifat/muddat%/holat — kartaga mosi).
- ⏭️ **EP-ORG-133** Majburiy tizim-qaydlari (A-System o'rni) = **IoT bosqichiga KO'CHIRILDI**. ⭐ A-System'ga aloqador BARCHA savol → IoT modulida ko'riladi (hozir aloqasi yo'q).
- **EP-ORG-134** Razryad pasayish = A (aniq sababdan: stat-pasayish + takror-xato + qayta-imtihon yiqilish; AI taklif → RD-4 tasdiq).
- **EP-ORG-135** Tugallanmagan karta = A (bo'sh slot "tugallanmagan" + javobgar rahbarga to'ldirish topshirig'i).
- **EP-ORG-136** Vakant ish = A (ЦКП vaqtincha yuqori/qo'shni kartaga o'tadi, ish to'xtamaydi).
- **EP-ORG-137** Karta eskirishi = A (oxirgi-ko'rib-chiqilgan sana; 1 yil oshsa "ko'rib chiqing" eslatma).
- **EP-ORG-139** Shtat-reja = **B — ALOHIDA** (kartaga bog'lanmaydi, alohida yuritiladi).
- **EP-ORG-140** Mutaxassis karta = A (alohida mutaxassis shabloni: ЦКП tex-karta/loyiha bilan) — LEKIN hammasi **BITTA org-sxema ierarxiyasida** (yagona daraxt, KARTALAR Q21).
- ⭐ **EP-ORG-142** Ko'p-karta oylik = **Har karta o'z TO'LIQ oyligini KARTADA ko'rsatadi; XODIM PROFILIGA hamma kartalar oyligi YIG'ILADI** (066 aniqlandi: stavka-ulush-cap EMAS, balki profil yig'indisi).

> ✅ **ORG / KARTALAR — barcha 54 ochiq savolga javob berildi (143/143 hal).** Modul build-spec'ga tayyor.

## HR
- **EP-HR-012** Reyting toifa chegarasi = A=85+ / B=70-84 / C=<70 — **SOZLANADI** (admin panel).
- **EP-HR-014** Reyting→bonus = toifa bonus foizini **TAKLIF** qiladi, **HR/rahbar tasdiqlaydi** → Payroll (KARTALAR Q25 bilan mos: bonus sozlanadigan, KPI'siz).
- **EP-HR-021** Referral bonus = lavozimga qarab summa/ta'til (**SOZLANADI**), nomzod sinovdan o'tgach to'lanadi.
- **EP-HR-037** Statistik avto-ulanish = A (formulali metrik, modullardan avtomatik real raqam; ORG-113 bilan mos).
- **EP-HR-042** Energiya tejash = A (javobgarlik bandi, hozircha o'lchovsiz; keyin IoT/счётчик metrikasiga ulanadi).
- **EP-HR-047** Glossariy = A (lavozimga bog'langan lug'at + tooltip; ORG-129 bilan mos).
- ⭐ **EP-HR-057** Brak→mas'ul = brak **IoT tabletga** boshidan kiritiladi + **qabulда tekshiriladi**; keyin chiqsa **sifat nazorati / sex yetakchisi / texnolog** javob beradi (manzilli mas'uliyat). → IoT/QC/MES.
- ⭐ **EP-HR-079** TB-xavfsizlik = HA + **har ishni boshlashdan oldin IoT tabletда CHEK-LIST** ko'rinadi, xodim **tasdiqlaydi**. → IoT/MES.
- ⭐ **EP-HR-082** Bekor turish = Ha — mas'ul lavozimga bog'lanadi; **AI kameralar har xodimni nazorat qiladi**; bahoga ta'sir **FAQAT TASDIQ orqali** (avto-jarima EMAS; material/qolip kabi xodimsiz to'xtash hisobga olinmaydi).

> ✅ **HR — barcha 9 ochiq savol hal (82/82).**

---
## ⭐ GLOBAL PRINTSIP (hamma modulда amal qiladi)
**AI KUZATADI va BELGILAYDI** (kamera, downtime, brak, past-moslik, kech-kelish), **lekin SALBIY ta'sir (jarima / ball pasayishi / blok / razryad tushishi) FAQAT inson TASDIG'i bilan** amalga oshadi — hech qachon avtomatik emas. Adolatli. (Misol: HR-082 downtime, HR-057 brak, ORG-093 past-moslik, ORG-134 razryad-pasayish, BARCHA Q128 jarima — hammasi shu printsip.)
---

## Finance / GL
> ⚖️ ZIDDIYAT-hal: **EP-FIN-036** narx = **FIFO/FEFO**; **EP-FIN-055** QQS = **faqat ichki** (rasmiy fiskal yo'q).
- **EP-FIN-005** Tushum 4-hisobga taqsim = A (avtomatik foiz bilan, intizom).
- **EP-FIN-006** Taqsim foizini kim = A (faqat egasi/direktor o'zgartiradi).
- **EP-FIN-008** Tasdiqlash chegarasi = A (ekrandan sozlanadi, dasturchisiz).
- **EP-FIN-015** Aging = A (debitor/kreditor 2 alohida ekran, aralashmaydi).
- **EP-FIN-012** FP-tsikl kunlar = A (ekrandan o'zgartiriladi, bayram/bankga moslashuvchan).
- **EP-FIN-034** Kamomad = A (kg × narx = zarar avtomatik, smenaga bog'lanadi).
- ⭐ **EP-FIN-038** Vazn-farqi da'vo = Ha — LEKIN faqat **hujjat + rasmlar bilan**, **qabul qilgan xodimga** bog'lanadi (ko'r-ko'rona avto-chegirma emas; global printsip).
- **EP-FIN-040** Bo'sh stanok ("иш йук") = A (bo'sh soat × stanok xarajati = yashirin zarar, oylik hisobot).
- **EP-FIN-041** Brak/Makulatura = A (Брак=to'liq zarar; Макулатура=qisman qaytariladigan qoldiq).
- **EP-FIN-042** Gilza/tara = A (qaytariladigan tara depoziti, yo'qolish ko'rinadi).
- **EP-FIN-043** Transport = A (landed cost — material kirim tannarxiga taqsimlanadi).
- **EP-FIN-044** Yelim retsept = A (kraxmal/soda/bura sarf-norma bilan; ortiqcha = zarar).
- **EP-FIN-050** Xarajat toifalari = A (standart moddalar ro'yxati, sozlanadigan; har xarajat 1 toifaga).
- **EP-FIN-051** Energiya taqsim = A (stanok quvvati × ish soati → tannarxga taqsim).
- **EP-FIN-054** Kreditor to'lov muddati = A (har yetkazuvchi muddat profili; aging shunga nisbatan).
- **EP-FIN-059** To'lov kalendari = A (kunlik kirim/chiqim + qoldiq prognozi, cash-flow).
- **EP-FIN-060** Kredit limit = A (mijoz limiti; oshsa SD buyurtma blok/tasdiqqa; limitni egasi/moliya oshiradi).
- **EP-FIN-061** Qisman to'lov = A (eng eski faktura avval/FIFO; qo'lda taqsimlash ham mumkin).
- ⭐ **EP-FIN-062** Penya = avto HISOBLANADI (kechikkan kun × stavka), lekin qo'llash **egasi/rahbar TASDIG'i** bilan (global printsip).
- **EP-FIN-068** Zararga sotuv = A (tannarxdan past → blok yoki egasi tasdig'i).
- **EP-FIN-069** Chegirma vakolat = A (darajali: sotuvchi ≤5% / rahbar ≤15% / egasi >15%, kartadan, sozlanadi).
- **EP-FIN-070** O'zaro hisob = A (взаимозачёт akti, ikki tomon qarzi bir vaqtda yopiladi, hujjatli).
- **EP-FIN-071** Yetkazuvchi reyting = A (narx + brak% + kechikish; eng foydali tanlov).
- **EP-FIN-072** Kassa limit = A (naqd limiti + oshsa inkassatsiya eslatmasi, xavfsizlik).
- **EP-FIN-076** Quvvat-narx = A (bo'sh quvvat + marjinal-narx tahlili → qaror egaga).
- **EP-FIN-080** To'lov navbati = A (ustuvorlik navbati, sozlanadigan; kritik to'lov — oylik/soliq — kechikmaydi).
- **EP-FIN-081** Pul aylanma = A (cash conversion cycle dashboard, likvidlik nazorati).
- **EP-FIN-085** Brak%→tannarx = A (brak% > norma → tannarx og'ishi + ogohlantirish; QC bilan ulanadi).

> ✅ **Finance / GL — barcha 30 ochiq savol hal (86/86).** + 2 ziddiyat hal: 036 FIFO/FEFO, 055 faqat ichki QQS.

## Coordination
- **EP-COR-033** Kvorum = A (2/3 qatnashsa; yetmasa "maslahat majlisi", qaror kuchsiz).
- **EP-COR-034** Ovoz berish = A (oddiy ko'pchilik; teng bo'lsa Rais hal qiladi).
- **EP-COR-035** Vakil = A (yozma ishonchnoma bilan ovoz beradi, kvorumga sanaladi).
- **EP-COR-036** Manfaat to'qnashuvi = A (aloqador a'zo chetlashtiriladi, ovozi sanalmaydi).
- ⭐ **EP-COR-037** Majlis turlari = A (4 tur: Operativ/Oylik/Choraklik/Favqulodda) — LEKIN **hammasi ORG-SXEMA bo'yicha**: kengash a'zoligi/tuzilishi/qatnashchilar karta ierarxiyasi (7-otdeleniye darajalari)dan kelib chiqadi. (⭐ Coordination-wide printsip: kengash/majlis strukturasi = org-sxema.)
- **EP-COR-039** Chaqiriq muddati = A (oddiy 2 ish kuni; favqulodda kamida 3 soat oldin).
- **EP-COR-040** Kun tartibi = A (1 ish kuni oldin qulflanadi; keyin faqat Rais ruxsati bilan band qo'shiladi).
- **EP-COR-041** Davomat = A (4 holatli avto; sababsiz yo'q 3 marta = HR ogohlantirish; kim qatnashishi org-sxema bo'yicha).
- **EP-COR-042** Majlis vaqti = A (Operativ 30 daq / Oylik 90 daq maqsad; oshsa qoldirilgan bandlar keyingiga ko'chadi).
- **EP-COR-043** Доклад turlari = A (3 tur: rejali / so'rovga-javob / muammo; org-sxema bo'yicha kim beradi).
- ⭐ **EP-COR-046** Доклад formati = A (6 maydon: Davr/Bajarilgan/Reja-fakt/Muammo/Taklif/Ilova) + **O'ZBEKCHA atamalar** + ⭐ **majlis xonasidagi AI KAMERA dokladni/протоколni AVTO-tuzadi** (ovoz→transkripsiya→hisobot). → AI/IoT kamera.
- ⭐ **EP-COR-051** Распоряжение (farmoyish/topshiriq) = **KANBAN doskaga ko'chiriladi** — Coordination'da EMAS. ⭐ **Chegaraviy printsip:** topshiriq/vazifa IJROSI = KANBAN; kengash/majlis governance (доклад/протокол/приказ/ovoz) = Coordination.
- **EP-COR-052** Bajaruvchi = bitta asosiy mas'ul + ixtiyoriy yordamchilar (→ Kanban tomonida amal qiladi).
- ⭐ **EP-COR-054, EP-COR-055** Распоряжение lifecycle (rad etish/muddat so'rash; 8-holatli oqim) → **KANBAN** (распоряжение Kanban'da yashaydi).
- **EP-COR-057** Приказ = A (4 kategoriya **O'ZBEKCHA**: Kadrlar/Asosiy/Moliya/Xo'jalik, har biriga prefiks+raqam qatori; rasmiy hujjat Coordination'da qoladi).
- **EP-COR-058** Raqam tartibi = A (raqam saqlanadi, teshik yo'q; bekor приказ "Bekor qilindi" holatida, immutable/qonuniy).
- **EP-COR-067** E'tiroz = A ("alohida fikr" yoziladi, protokolga ilova).
- **EP-COR-069** Qaror bajarilishi = A (holat + foiz; majlis boshida avto "o'tgan qarorlar holati"; ijro ma'lumoti Kanban'dan).
- **EP-COR-070** Bajarilmagan qaror = A (avto keyingi majlisga "bajarilmagan qaror" bo'limida; mas'ul sabab tushuntiradi).
- **EP-COR-071** Bajarish dalili = A (yuqori/shoshilinch'ga majburiy, oddiyga ixtiyoriy).
- **EP-COR-073** Bajarish reytingi = A (oylik: o'z vaqtida% / kechikkan%; baholashga ulanadi, ta'sir tasdiq bilan — global printsip).
- **EP-COR-075** Arxiv qidiruv = A (ko'p mezonli: sana oralig'i + mavzu/kalit + mas'ul + raqam + holat).
- **EP-COR-079** Arxiv eksport = A (bir tugmada davr hisoboti: qarorlar+bajarilish%+kechikkanlar → PDF/Excel).
- **EP-COR-081** Majlis qoldirish = A (avto keyingi sanaga; tayyor dokladlar + kun tartibi saqlanadi).
- **EP-COR-082** Favqulodda majlis = A (3 soatda, yengil kvorum 50%; keyingi oddiy majlisda tasdiqlanadi).
- ⭐ **EP-COR-086** 24h reja = A (har kuni 1-sutkalik reja avto → logistika/uchastka/ombor kartasiga; o'zgarsa push+log). [oltin-ip floor yadrosi]
- ⭐ **EP-COR-087** Downtime yozuvi = A (sabab + vaqt + mas'ul bo'lim → avto statistika; HR-082 bilan bir manba).
- ⭐ **EP-COR-088** Logistika STOP = A (techkarta-mos-emas → chiqish bloklanadi + dizaynerga xabar; STOP'ni faqat reja/dizayn rahbari yechadi).
- **EP-COR-090** Handoff uzluksizlik = A (har topshirish vaqt bilan; savdo→dizayn→IChQ; uzilish ko'rinadi).
- **EP-COR-091** Status zanjiri = A (4 status: TT keldi → Dizayn → Tasdiqda/podpisnoy → IChQ ga; Bitrix o'rniga tizimda).
- **EP-COR-092** Podpisnoy gate = A (buyurtmachi imzosi bo'lmasa IChQ ga o'tkazish bloklanadi, qattiq darvoza).
- ⚠️ **EP-COR-093** Qolip tayyorligi = Ha (holat: tayyor/buyurtilgan/kerak emas → IChQ rejasiga) — LEKIN **ERP'da aynan qanday bo'lishi QAYTA ko'rib chiqiladi** (build paytida / qolip-moduli bilan aniqlanadi).
- **EP-COR-094** Ichki transport = A (reestr: holat soz/ta'mirda/band + band jadval).
- **EP-COR-095** Chiqindi = A (uchastka "to'ldi" signal → logistika topshiriq → bajarish tasdig'i; yopiq tsikl).
- **EP-COR-096** Bo'lim marshruti = A (bo'lim-zanjiri/algoritm turi → keyingi bo'lim avto; org-sxema bo'limlari bilan).
- ⭐ **EP-COR-098** Priladka = **IoT TABLET orqali** (operator IoT tabletда sozlash vaqtini kiritadi). ⚠️ Action: IoT-tablet + MES joriy holati O'RGANILADI (kod tekshiruvi).
- **EP-COR-099** Smena handover = A (yozuv: tugamagan buyurtma + ochiq STOP + eslatma → keyingi smenaga; alohida login YO'Q, faqat audit — ziddiyat 4).
- **EP-COR-100** Bilim blanki = A (muvaffaqiyatli-harakat / odatiy-xato blanki davriy → AI tahlilga kiradi; ShVB bilim-yig'ish).

> ⭐ **OPERATOR IoT-TABLET = floor markazi:** brak kiritish (HR-057), TB chek-list (HR-079), downtime (HR-082/COR-087), priladka (COR-098) — hammasi operator tabletida. IoT/MES build'da markaziy.

- **EP-COR-103** Tayyorlik % = A (o'tilgan bo'lim / jami bo'lim, real vaqtda).
- **EP-COR-104** Menejer-egasi = A (buyurtma menejerga bog'lanadi; kechikish/STOP/handoff menejerga ham).
- ⭐ **EP-COR-105** Turniket = A (topshiriqda turniket holati ko'rinadi; ishda yo'qqa bermaslik; AI kamera davomati bilan).
- **EP-COR-107** Harakatsiz signal = A (X soat harakatsiz → rahbarga "harakatsiz" signal; yumshoq nazorat).
- **EP-COR-109** Yuklama = A (har xodimda ochiq ish ko'rinadi + bir tugmada qayta biriktirish).
- **EP-COR-110** Ustuvorlik = A (1/2/keyingi navbat → reja shunga qarab).
- **EP-COR-111** Material signal = A (uchastka "yetishmadi" → logistika+ombor+reja bir vaqtda xabardor).
- **EP-COR-112** Gofra mos = A (skaner gofra-turini techkarta bilan solishtiradi → mos emas ogohlantirish).

> ⭐ **AI-REJALASHTIRISH PRINTSIPI (egasi):** "AI rejalashtiradi buyurtmalarni xolos." Reja/navbat/marshrut/ustuvorlik/material-muvozanat = AI avtomatik (qo'lda config emas); koordinatsiya signallari AI orqali. Bu — Coordination + PP + AI ga tegishli.
> **Shu printsipga avto-qabul (AI-rejali / dublikat):** EP-COR-115 (yig'ilish↔topshiriq ulanishi), 116 (=HR-042 energiya javobgarligi), 118 (rasmiy ma'lumot so'rovi hujjati), 121 (plan-fakt kechikish→AI signal), 122 (=HR-057 brak→mas'ul), 123 (norma-fakt→AI signal), 125 (razmer optim→AI taklif→tasdiq), 126 (=096 yo'nalish-marshrut), 127 (kechikkan-start→AI signal), 128 (=110 shoshilinch bayrog'i), 129 (ichki xizmat so'rovi: so'rovchi→bajaruvchi+tasdiq). Hammasi A-default.

- **EP-COR-113** Dizayn↔konstruktor = A (alohida handoff: o'lcham/begovka/vysechka tasdig'i bilan).
- **EP-COR-124** Operator+yordamchi = A (dastgohga juftlik, ikkisi ham signal oladi; IoT ekipaj master/shogird bilan mos).
- ⭐ **EP-COR-130** Smena chek-list = A (IoT tabletда tayyorlik: material/qolip/dastgoh/xodim; tasdiqsiz bekor-turish hisoblanmaydi). **Hozir tizimda YO'Q — HR-079 TB chek-list bilan birga quriladi** (IOT-MES-CURRENT-STATE GAP).
- **EP-COR-133** TT gate = A (TT majburiy maydonlari to'liq bo'lmasa dizaynga o'tmaydi, qattiq darvoza).

> ✅ **Coordination — barcha 62 ochiq savol hal (135/135).** Relokatsiyalar: распоряжение(051/052/054/055)→**Kanban**; доклад/протокол→**AI kamera avto-tuzadi**; floor → **operator IoT-tablet** (mavjud, kengaytiriladi); **AI-rejalashtirish printsipi** (PP/AI).

---
> 🏁 **BUGUN HAL QILINGAN MODULLAR (4):** ORG (143) · HR (82) · Finance (86) · Coordination (135). Keyingi: Director.
---

## Director / Strategiya
**Usul:** egasi tanlovi — o'rnatilgan printsiplar avto-qo'llandi; faqat 4 YANGI qaror so'raldi.

**Yangi qarorlar (egasi):**
- ⭐ **EP-DIR-001** Holat formulasi = **5 ko'rsatkich birga** (pul oqimi + ishlab chiqarish reja% + buyurtma + xodim + sifat), har biriga **sozlanadigan vazn**.
- ⭐ **EP-DIR-029** Holat darajalari = **5 daraja** (OSISH / NORMAL / EHTIYOT / XAVF / INQIROZ, rangli).
- **EP-DIR-037** Kechikish/og'ish = **majburiy sabab kategoriyasi** (material/transport/operator/qolip/boshqa) → root-cause tahlil.
- **EP-DIR-033** Karta produkt = **moslashuvchan 2-4** (lavozimga qarab), har biriga statistika.

**Printsip-asosli avto-qabul (A-default, 71 ta):**
- *Kartaga bog'lash (oltin ip):* 016 OKR(kompaniya→bo'lim→karta), 019, 023, 024, 031 position_purpose, 032 ЦКП, 041 tipik-xatolar+AI, 042 muvaffaqiyatli-harakat→ideal, 043 javobgarlik, 047 nazorat-varaqasi, 051 malaka-talab, 052 lavozim-vositalari, 071 ko'rsatkich→mas'ul-karta, 079 karta-AI agregat.
- *Avto-to'ldirish / real-time dashboard (Excel ustunlari):* 009, 013, 036 reja%, 037 counters, 038 downtime, 040 sutkalik-reja, 045 energiya, 046 turniket, 053 reja/fakt/qoldiq, 054, 055 brak, 056, 057 den/noch, 058 ishchi-norma%, 059 operatsiya-norma, 060 lak, 061 pragon/CRP, 062 tayyorlik%, 063 sikl-vaqt, 064 priladka, 069 trend, 073 real-time+snapshot, 082 haftalik, 083 yo'nalish, 084 algoritm-turi, 085 5S-tozalik.
- *AI tahlil + tavsiya (+inson tasdig'i):* 026 kunlik strategik AI, 065 kichik-buyurtma tahlil, 066 razmer-optim tavsiya, 070 trend→holat avto, 074 root-cause, 075 aralashish-riski alert, 076 xato-tasnif.
- *Sozlanadigan chegara:* 002, 021 chastota, 022 versiya, 080 ideal-qiymat.
- *Boshqa standart:* 006 alert→boshliq+sababchi-karta, 008, 010, 014, 027 Telegram, 028 digest, 030, 034 Vysotskiy-7 format(5-Dept/13/Sektsiya), 035 5-Dept drill, 048, 049 senariy-AI-imtihon, 050 yo'riqnoma-versiya+imzo, 067 buyurtma-kod-format, 068 2-o'q(dept╳operatsiya), 072 hisobot-reglament, 077 chiqindi, 078 info-request-workflow, 081 paddon.
- ⏭️ **EP-DIR-039 A-System ko'chish = IoT bosqichiga DEFER** (ORG-133: A-System savollari IoT'da).

> ✅ **Director — barcha 76 ochiq hal (85/85):** 4 yangi + 71 printsip + 1 defer.

---
> 🏁 **HAL QILINGAN MODULLAR (5):** ORG · HR · Finance · Coordination · Director. Keyingi: SD (Sotuv).
---

## SD / Sotuv (oltin-ip yadrosi)
**Yangi biznes-qarorlar (egasi):**
- **EP-SD-033** Priklad % (qirqim qoldig'i) = **mahsulot turiga qarab** (har turga alohida %, master-data).
- ⭐ **EP-SD-042 / EP-SD-125** Klishe/shtamp = **mijoz to'laydi (bir martalik) → ZAVODда saqlanadi (≈3 yil, keyin ogohlantirish) → takror buyurtmada qayta olinmaydi**.
- **EP-SD-069** Buyurtma bekor jarimasi = **bosqichli: maket 30% / bosildi 70% / tayyor 100%** (foizlar sozlanadigan).
- **EP-SD-068** Tirajdan og'ish = **±10%** (hisob real chiqqan miqdordan).

**Printsip-asosli avto-qabul (A-default, 20 ta):**
- *Governance/karta:* 015 (rahbar taklif→yuqori tasdiq), 017 (leaderboard reja-fakt%).
- *Tahlil:* 024 (yo'qotilgan buyurtma sabab: narx/muddat/raqobat/sifat + haftalik).
- *Sozlanadigan chegara (qiymat master-data):* 036 MOQ + kichik-partiya ustamasi, 045 chegirma shifti (≈15%), 049 toifa imtiyoz paketi, 051 kotirovka 14 kun + muddati o'tganда narx avto-yangilanadi (FIFO), 082 preyskurant davriy + indeksatsiya bandi.
- *Kredit nazorati (FIN bilan bir xil):* 060 debitor limit, 061 oshganda blok+direktor tasdiq, 062 prosrochka avto-bayroq.
- *Shartnoma:* 057 (bosh yillik + har buyurtmaga spetsifikatsiya).
- *Narx/mahsulot:* 039 bo'yoq formula (rang+qoplama%+yuza, tarif master-data), 103 mashina-format narx (CRP), 118 stakan/pizza shablon, 119 rulon-etiketka param, 116 mavsumiy mahsulot signal.
- *Oltin ip:* 101 "Ожд.Сырьё" → Ta'minotga avto signal + sotuvga ko'rinadi.
- *Kanal:* 076 buyurtma manbai (telefon/Telegram/sayt/tashrif/takror).

> ✅ **SD / Sotuv — barcha 24 ochiq hal (138/138):** 4 yangi biznes-qaror + 20 printsip.

---
> 🏁 **HAL QILINGAN MODULLAR (6):** ORG · HR · Finance · Coordination · Director · SD. Keyingi: PP (Rejalashtirish).
---

## PP / Rejalashtirish (oltin-ip)
**Yangi qarorlar (egasi):**
- ⭐ **EP-PP-063** Split = **qisman YETKAZISH ruxsat (SD), lekin ISH bo'linmaydi** — har partiya 100% tugamaguncha keyingiga o'tilmaydi. [kitob ziddiyati hal]
- **EP-PP-025** Muzlatilgan zona = Ha, yaqin **~3 kun** muzlatilgan (faqat egasi/direktor ochadi).
- **EP-PP-082** Status sikli = **to'liq 7 status** (Reja→Tasdiqlangan→Ishga tushgan→Jarayonda→Sifatda→Tugadi→Yopildi +Bekor/To'xtatilgan) + har o'tish jurnal.
- **EP-PP-105** To'plam gate = Ha (to'liq komplekt qadoqdan oldin shart; biri qolsa ogohlantirish).

**Hal qilingan ziddiyat:** EP-PP-001/067 Reja ufqi = **ziddiyat #5** (ko'p qatlamli: oylik→haftalik→kunlik→soatlik).

**Printsip-asosli avto-qabul (A-default, ~67 ta):**
- *AI-rejalashtirish (egasi printsipi):* 003 (AI taklif→odam tasdiq), 009, 010, 011, 024 ATP, 062, 084 gang-run, 095 AI raskroy, 106 o'tgan-yil-fakt, 130 AI smena-to'ldirish, 131 bottleneck/TOC.
- *Stanok/CRP (real 22+ stanok):* 004, 005 Gantt, 008 CRP, 016/074 2-smena(den/noch), 046-052, 132 xodim-cheklovli CRP.
- *Norma (real Excel):* 019 texkarta+IoT avto-tuzatish, 033-044, 094 list↔dona, 102 priladka rang-formula, 112-114, 117 format-stanok, 122 post-press.
- *Karta/razryad:* 017, 018, 038, 075.
- *Status/buyurtma:* 026/118 multi-line, 083, 099 tayyorlik%, 086 algoritm-turi, 103 papka№, 104 takror, 125 maket-qaytarish.
- *Zaxira:* 068 rezerv, 069 zagotovka, 071 reorder.
- *Reja-fakt:* 054, 056 sozlanadigan chegara, 111 bottleneck-bosqich.
- *Adolat:* 128 (bo'sh-turish KPIga ta'sir qilmaydi — global adolat).
- *Boshqa:* 129 Excel eksport, 133 buyurtma turi (to'liq/yarim/xizmat).
- ⏳ **EP-PP-109 Kod lug'ati (KT/PT/E/GL prefiks) = master-data; egasi MA'NOLARNI keyin kiritadi.** → 📌 PENDING OWNER-INPUT.

> ✅ **PP / Rejalashtirish — barcha 73 ochiq hal (136/136):** 4 yangi + ziddiyat#5/063 + 67 printsip + 1 owner-input.

---
> 🏁 **HAL QILINGAN MODULLAR (7):** ORG · HR · Finance · Coordination · Director · SD · PP. Keyingi: MES.
> 📌 **PENDING OWNER-INPUT:** PP-109 kod prefikslari ma'nosi (KT/PT/E/GL...).
---

## MES / Ishlab chiqarish (oltin-ip; operator IoT-tablet MAVJUD)
**Yangi qarorlar (egasi):**
- ⭐ **EP-MES-006** Material yechish = **norma avto-hisob + operator/usta TASDIG'i** (xato sarf bloklanadi; keyin to'liq avto+GL).
- **EP-MES-001** Sessiya = **3 bosqich** (sozlash → asosiy → yakunlash; OEE aniq).
- **EP-MES-014** OEE darajasi = **hamma daraja** (mashina + smena + brigada + sex).
- **EP-MES-027** MES bonus = **ball → A/B/C → bonus TAKLIF → HR tasdiq** (HR-014 + global printsip).

**Printsip-asosli avto-qabul (A-default, 45 ta):**
- *OEE/monitoring:* 013 downtime (operator darhol), 015 OEE target (mashina/sexga sozlanadigan), 016 jonli sex-tablo, 017 1-5 daq yangilanish, 018 to'xtagan-mashina bosqichli eskalatsiya (15daq→usta/30daq→direktor).
- *Karta-model:* 005 brigada (brigadir tasdiq + HR doimiy tarkib), 020 GSD vaznli, 021 razryad↔natija↔o'sish, 026 vaznli ball (sozlanadigan).
- *Texkarta:* 030 adherence checklist + chetlashuv qaydi.
- *AI/avto:* 063 smena reja avto-tuzish (B→A bosqichma-bosqich), 070 bottleneck/yarim-tayyor qoldiq.
- *+ qolgan* material/brigada/smena tafsilotlari (031-062, 064-082) A-default (OEE/karta-model amaliyoti).

> 🛠️ **Build asos:** `IOT-MES-CURRENT-STATE-2026-06-08.md` — IoT-tablet ~70% qurilgan. GAP: kanonik sessiya jadvali (`production_sessions`╳`mes_sessions`), operator-rol guard, TB/smena chek-list (HR-079/COR-130), event-handler ulanishi, OEE realligi.

> ✅ **MES / Ishlab chiqarish — barcha 49 ochiq hal (82/82):** 4 yangi + 45 printsip.

---
> 🏁 **HAL QILINGAN MODULLAR (8):** ORG · HR · Finance · Coordination · Director · SD · PP · MES. Keyingi: QC (Sifat).
---

## QC / Sifat (oltin-ip)
**Yangi qarorlar (egasi):**
- **EP-QC-003** AQL = **standart AQL 2.5** (partiya hajmiga qarab namuna + qabul/rad chegarasi).
- **EP-QC-005** Defekt og'irlik = **3 daraja** (kritik 0% o'tmaydi / jiddiy / kichik kosmetik chegara bilan).
- **EP-QC-072** Sort = **1/2/3-sort + brak, har biriga narx koeffitsienti** (yaroqli mahsulot tashlanmaydi, arzonroq sotiladi).
- **EP-QC-090** Brak sababchisi = **"kirim braki" (oldingi bosqich) va "shu bosqich braki" alohida** (adolatli sabab).

**Printsip-asosli avto-qabul (A-default, qiymat master-data):**
- *Sertifikat:* 014/060-064 (avto PDF, sertifikat№ ketma-ket SF-2026-NNNNN, real o'lchov natijalari, uz/ru/en shablon, laborant+sifat-boshlig'i imzo+QR).
- *Fizik/kimyo normalar:* 015 (gramaj/namlik/RCT/BCT/qalinlik min-max), 016 oziq-ovqat (makulatura→ozuqaga emas blok).
- *Tahlil:* 018 DPMO/sigma (boshda brak%), 020 Pareto, 025 COQ.
- *Qaytarish:* 066 qabul forma, 069 sabab+ayb tomoni (zavod/mijoz/logistika).
- *Asbob/retest:* 073 kalibrovka muddati, 075 retest (chegara zonasi 2 namuna), 084 brak chegara (≤2% operatsiyaga).
- *Karta-model:* 021 razryad-ruxsat (ОТК final), 022 operator o'z-nazorat, 023 sifat GSD→karta→bonus.
- *Allaqachon hal:* bosqichli nazorat (001), inspeksiya-plan→texkarta (002), brak qaror QABUL/REWORK/CHIQARISH (010), karantin (009), reklamatsiya (011-013), 8D/CAPA (013/127), final-jo'natish gate (008), pre-production gate (006/007), anomaliya→СОЗ Telegram (024).

> ✅ **QC / Sifat — barcha ochiq hal:** 4 yangi biznes-qaror + qolgani A-default (qiymat master-data).

---
> 🏁 **HAL QILINGAN MODULLAR (9):** ORG · HR · Finance · Coordination · Director · SD · PP · MES · QC. Keyingi: WMS (Ombor).
---

## WMS / Ombor (oltin-ip)
**Yangi qarorlar (egasi):**
- **EP-WMS-073** Topologiya = **tuzilmali manzil** (Zona→Qator→Javon→Yacheyka, mas. A-12-3-2; avto bo'sh-joy taklif).
- ⭐ **EP-WMS-019/020** Ombor-saqlash = **Ha, faqat TAYYOR MAHSULOT** (xom-ashyo davalcheskoye EMAS); saqlash haqi **MIJOZGA emas, javobgar MENEJERGA yoziladi** (COR-104 menejer-egasi bilan mos).
- **EP-WMS-047/060** Tolerans = **qabul ±2% / sanoq ±1%** (oshsa rahbar tasdig'i + majburiy sabab).
- **EP-WMS-067** Min/max = **dinamik AI** (oxirgi 3-6 oy sarfidan avto-qayta hisob, mavsumga moslashadi).

**Hal qilingan ziddiyatlar:** EP-WMS-079/110 narx = **FIFO/FEFO** (ziddiyat #1); EP-WMS-001 kanonik stok = **warehouse_stock** (ziddiyat #8).

**Printsip-asosli avto-qabul (A-default, qiymat master-data):**
- *Qabul:* 004 3-way match, 049 qisman qabul + rad sabab(foto), 050 tarozi vazn-farqi, 026 kirim QC→karantin.
- *Qoldiq/reorder:* 010/064 min/max/reorder, 065 reorder(sarf×lead-time), 066 max, 068 lead-time + safety stock, 028 dead-stock N kun.
- *Inventarizatsiya:* 008 aniqlik% GSD, 059 ko'r-sanoq, 061 og'ish sabab ro'yxat, 062 zona muzlatish, 063 tarozi rulon sanoq.
- *Rulon:* 015 ostatok→avto-taklif, 034 kg+uzunlik avto, 035 to'liq/ochilgan/qoldiq (FIFO).
- *Material:* 039 namlik+zona, 041 ma'noli kod (KR-125-1400), 042 birlik konvertatsiya(kg↔m↔m²), 045 hazmat bayroq+zona, 054 norma-vs-fakt.
- *Topologiya:* 076 yacheyka sig'im+avto-joy.
- *Karta-model:* 023 omborchi GSD (aniqlik%/tezlik), 024 razryad→vakolat.
- *Avto-xarid:* 012 kam-qoldiq→avto PR (ZVS/ZNO loyiha→tasdiq); 072 karantin muddat→ogohlantirish.

> ✅ **WMS / Ombor — barcha 59 ochiq hal (134/134):** 4 yangi + 2 ziddiyat + 53 printsip.

---
> 🏁 **HAL QILINGAN MODULLAR (10):** ...ORG · HR · FIN · COR · DIR · SD · PP · MES · QC · WMS. Keyingi: MM (Ta'minot).
---

## MM / Ta'minot (oltin-ip)
**Yangi qarorlar (egasi):**
- **EP-MM-002/040** Vendor reyting = **sifat 40% + muddat 30% + narx 20% + hujjat 10%** (og'irlik sozlanadi).
- **EP-MM-054/058** Valyuta = **material KELGAN (kirim) kuni MB kursi** + asl valyuta saqlanadi (ziddiyat hal).
- **EP-MM-056/057** Tender = **3+ so'rovnoma → 5-ustun taqqoslash** (narx/muddat/to'lov/reyting/masofa) → umumiy ball → odam tasdiq; eng-arzondan boshqasi → sabab majburiy.
- ⏳ **EP-MM-062/063/064 Yoqilg'i/Transport = KATTA MAVZU → alohida 10-savollik deep-dive keyin** (📌 PENDING OWNER deep-dive).

**Printsip-asosli avto-qabul (A-default):**
- *Vendor:* 001/041 reyting avto+menejer izoh, 003 past-reyting→ogohlantirish+direktor tasdiq, 029/044 ko'p-postavshik taqqoslash, 030/042 shartnoma karta (30 kun ogohlantirish), 043 to'lov sharti, 067 to'lov muddati kirim sanasidan, 068 avans→PO.
- *PO/ariza:* 005 PO format (PO-2026-NNNNNN), 046 ariza 7 maydon, 048 rad→sabab+qayta, 049 arizadan avto-buyurtma, 025 tasdiq chegara sozlanadigan.
- *3-way/narx:* 018/052 3-way match (±3%→blok), 033 landed cost (=FIN-043), 053 narx-tarix.
- *Transport:* 019/061 marshrut+yo'l-varaqasi+yetkazish-sharti (Incoterms), 020 haydovchi/mashina master-data.
- *Zaxira:* 010 min/safety stock (asosiy xom-ashyodan boshlab).
- *Allaqachon hal:* laboratoriya o'tish% (079), konflikt-interes siyosati (067), import (boj/NDS/broker 038/089).

> ✅ **MM / Ta'minot — barcha 65 ochiq hal (140/140):** 3 yangi + ziddiyat + printsip; ⏳ Yoqilg'i 10-savol PENDING.

---
> 🏁 **HAL QILINGAN MODULLAR (11) — T1 + MM TUGADI!** ORG · HR · FIN · COR · DIR · SD · PP · MES · QC · WMS · MM. Keyingi: T2 — LMS.
> 📌 **PENDING OWNER DEEP-DIVE:** (1) PP-109 kod prefiks ma'nolari (KT/PT/E/GL); (2) MM Yoqilg'i/Transport 10-savol.
---

## LMS / Ta'lim (T2)
> Yadro hal: darslik **KARTAGA** biriktiriladi (xodimga emas); darslik tugamasa o'sha karta oyligi yo'q.

**Yangi qarorlar (egasi):**
- **EP-LMS-009** O'tish bali = **kurs turiga qarab** (xavfsizlik/TX 100% / oddiy 60-80%, HR sozlaydi).
- ⭐ **EP-LMS-027** Darslik→oylik = **Ha** (darslik tugamasa o'sha karta oyligi YO'Q, oylik-gate; tashlasa AI eslatadi) — KARTALAR Q27 tasdiq.
- **EP-LMS-057** Murabbiy malakasi = **min razryad + o'sha karta sertifikati** + (ixtiyoriy) murabbiylik moduli.
- ⭐ **EP-LMS-082** Murabbiy reyting = **IKKI TOMONLAMA** (yaxshi shogird→bonus, yomon→minus) [egasi override: murabbiy natijaga javobgar].

**Printsip-asosli avto-qabul (A-default):**
- 011 micro-modul ket-ket (xavfsizlik), 019 sertifikat 1 yil + qayta-test eslatma, 022 kaizen→bonus, 058 murabbiy zaxira (yuqori rahbar/yondosh karta + AI nazariy), 072 davriy qayta-tasdiq (yiliga bir qisqa test), 078 "ishdagi vaziyat" interaktiv simulyatsiya.

> ✅ **LMS / Ta'lim — barcha 10 ochiq hal (85/85):** 4 yangi + 6 printsip.

---
> 🏁 **HAL QILINGAN (12):** + LMS. Keyingi: CRM.
---

## CRM (T3)
> Yadro hal: Bitrix→CSV import (ziddiyat #7), 360°, rol-RBAC maxfiylik, AI kamera, hujjat org-marshrut.

**Yangi qarorlar (egasi):**
- **EP-CRM-002** Voronka = Namuna → Klishe/STP tasdiq → Narx → Shartnoma → Buyurtma (zavod jarayoni; keyin tahrir).
- ⭐ **EP-CRM-007** Kanallar = **HAMMASI** (Telegram+WhatsApp+SMS+Email) + ⭐ **menejer TASHRIFI** (borib topib keladi — field/outbound sotuv ham kuzatiladi; SD-076 tashrif manbai bilan mos).
- **EP-CRM-063** Egasizlantirmaslik = Ha, ~60 kun faolliksiz → boshliq paneliga qayta taqsimlashga.
- **EP-CRM-057** Narx qayta-hisob = Ha, qog'oz narxi ~5% oshsa → ta'sirlangan mijozlar + "narxni qayta ko'r" vazifasi (Ta'minot narx-feed bilan).

**Printsip-asosli (A-default):**
- 012 lead scoring (avto, mezon egasidan), 018 segment (oborot/sodiqlik + ABC avto), 020 yutqazilgan sabab (majburiy ro'yxat: format/narx/muddat/raqobat), 024 qarz ogohlantirish (=FIN/SD limit), 028 telefoniya (qo'ng'iroq→karta), 079 STP versiya tarixi, 081 import-bog'liqlik toifasi, 085 mijoz↔tajribali-operator tarixi.

> ✅ **CRM — barcha 12 ochiq hal (85/85):** 4 yangi + 8 printsip.

---
> 🏁 **HAL QILINGAN (13):** + CRM. Keyingi: Marketing.
---

## Marketing (T3)
**Yangi qarorlar (egasi):**
- **EP-MKT-031** Kanallar = **8** (Instagram/Telegram/FB/sayt/ko'rgazma/qo'ng'iroq/tavsiya/diler) + boshqa.
- **EP-MKT-048** Lid SLA = 15 daq javob; 4 soat→signal; 24 soat→boshqa sotuvchiga.
- **EP-MKT-051** ROI = **foyda asosli** ((sotuv foydasi − xarajat)/xarajat; tannarxdan avto).
- ⭐ **EP-MKT-116** Egaga 5 raqam = **Yangi / Yo'qolgan / Kichiklashayotgan mijoz + Savdo trendi + Eng katta xavf** (+ diqqat-talab).

**Printsip-asosli (A-default):** 003 kanal master-data, 032 UTM sub-manba, 044 lid-sifat 5-mezon, 045 majburiy (telefon+manba+mahsulot), 047 taqsim (mahsulot+hudud/round-robin), 049 voronka(=CRM-002), 050 yo'qotish sabab, 055 atribusiya 90 kun (B2B), 056 oxirgi+birinchi teginish, 062 yagona inbox, 063 inbox SLA, 071 kontent 5-6 rukn, 077 marketing KPI, 079 UTM, 083 Bitrix→ERP (ziddiyat#7), 088 опросный лист→brif, 091 to'lov-intizom signal (Finance'dan).

> ✅ **Marketing — barcha ochiq hal:** 4 yangi + printsip.

---
> 🏁 **HAL QILINGAN (14):** + Marketing. Keyingi: Kanban.
---

## Kanban (T3)
> Yadro hal: 3-savat = **CC manba** (ziddiyat #3); распоряжение/topshiriq = **Kanban'da** (COR-051..055).

**Yangi qarorlar (egasi):**
- **EP-KAN-015** Taxta = **4 ustun** (Reja/Jarayonda/Tekshiruvda/Bajarildi; bo'lim qo'sha oladi). 3-savat (Kiruvchi/Kutilmoqda/Chiquvchi) = shaxsiy ish stoli, alohida.
- **EP-KAN-014** Vazifa→karta = Ha (kartaga/GSD bog'lanadi, bajarilsa avto hissa).
- ⭐ **EP-KAN-027/032** Tasdiq = **vazifani TOPSHIRGAN odam tasdiqlaydi** (topshiruvchi, boshliq bo'lishi shart emas; распоряжение-loop yopiladi) [override].
- **EP-KAN-009** Rollover = 3 marta ko'chsa → majburan boshliqqa.

**Printsip-asosli (A-default, standart Kanban, ~99 ta):** 001-006 3-savat(CC manba)+savat semantikasi, 011 soat-blok ixtiyoriy, 012 vazifa berish (vertikal+gorizontal+o'ziga), 013 qabul/rad (sabab majburiy), 016 taxta qamrov (shaxsiy/bo'lim/loyiha), 017/018 observer, 019-021 eslatma (ilova+Telegram, 3 holat), 022 takror vazifa, 023 gorizontal+iz, 024 распоряжение→vazifa avto (COR), 025/031 statuslar, 026 kechikish→vertikal, 028 shaxsiy-dastur sync, 029 fayl/izoh, 030 kunlik/haftalik→GSD, 033 orqaga sabab+tarix.

> ✅ **Kanban — barcha 107 ochiq hal:** 4 yangi + printsip.

---
> 🏁 **HAL QILINGAN (15):** + Kanban. Keyingi: IoT (A-System savollari shu yerda).
---

## IoT (T3)
> Egasi cheklov: sensor hali **O'RNATILMAGAN** (Excel/qo'lda); mashina-ЦКП IoT'dan keyin avto. AI-kamera (xona/davomat/himoya) allaqachon hal (460 javob).

**Yangi qarorlar (egasi):**
- ⭐ **EP-IOT-001** Sensor rollout = **HAMMA mashinaga BIRDAN** (override — to'liq qamrov).
- ⭐ **A-System (DIR-039)** = **EuroPrint TO'LIQ o'rnini bosadi, eski arxivga** (bitta haqiqat manbai; "ikki dunyo" yo'q).
- **EP-IOT-021** Andon = Ha (katta tablo: barcha mashina holati + qizil + jonli).
- **EP-IOT-018/030** Energiya = mashina darajasida → tannarxga avto (sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi).

**Printsip-asosli (A-default, fazaviy — sensor o'rnatilgach):** 006 anomaliya→Telegram, 007 chegara admin, 008 anomaliya→texnik vazifa+mexanik, 009 telemetriya 3-6 oy+downsampling, 015 RUL (qoida→AI), 016/017 PM jadval+ishlar, 019/020 energiya hisobot+birlik-GSD, 023 "aloqa yo'q" holati, 026 defekt→mashina+smena (MES), 034 tigel udar/list, 035 rang-seksiya, 041 Andon keyingi-ish, 043 gofra м2↔ombor, 044 lak, 045 plyonka isrof, 047 rezka kirim, 049 ish-soni+sozlash, 050/051 brak% chegara (mashina turiga), 052 кашировка taqqoslash, 053 yuklanish%/bottleneck, 055 ФСМ, 056 qolip udar-resurs, 058 smena topshirish, 060 gofra namlik/yelim, 061 bo'yoq→ombor.

> ✅ **IoT — barcha 46 ochiq hal (83/83):** 4 yangi + fazaviy A-default.

---
> 🏁 **HAL QILINGAN (16):** + IoT. Keyingi: AI.
---

## AI (T2 — markaziy-AI)
> Yadro hal: bitta markaziy AI (KARTALAR Q30), hisobot 3-tomon (Q31). Global printsip: AI tahlil→inson tasdiq, audit izi, halol noaniqlik.

**Yangi qarorlar (egasi):**
- ⭐ **EP-AI-042** Tarixiy import = **Ha** (eski tizim tarixiy ma'lumoti bir marta import → AI o'rganadi; A-System arxivga).
- ⭐ **EP-AI-028** Kamera kross-check = **Ha** (xodim hisoboti ↔ kamera ko'rgani solishtiriladi; nomoslik → rahbar/HR signal).
- **EP-AI-025** AI-suhbat = **ikkalasi** (ЦКП/darslik o'qitish + ERP ma'lumotidan javob, RBAC doirasida).
- **EP-AI-059** Ohang = **quriluvchi** (kamchilik + aniq yaxshilash qadami; jazo emas, o'sish).

**Printsip-asosli (A-default):** 004 moslik(% + rang + izoh), 007 haftalik digest, 012 director sabab, 013/023/057 prognoz (markaziy + o'z-aniqlik), 015-017 finance-AI (ЗВС/cashflow/aging), 018 HR GSD trend, 021/022 bottleneck (butun zanjir), 036-038 banklar (tipik-xato+muvaffaqiyat+blank), 040/041 downtime/og'ish daraja, 043 nazorat-varaqasi mazmun, 046 javobgarlik-band baho, 047 energiya(счётчик bo'lsa), 049 takror-xato, 050 ehtiyoj signal, 053 isbot-havola drill-down, 054 halol noaniqlik, 055 sozlanadigan ostona, 056 ikki-karta asosiy+bog'liq, 058 yangi-xodim moslashish, 060 rad-qaror jurnali, 061 davr oynasi.

> ✅ **AI — barcha 53 ochiq hal (95/95):** 4 yangi + printsip.

---
> 🏁 **HAL QILINGAN (17):** + AI. Keyingi: Bildirishnoma (Telegram).
---

## Bildirishnoma / Telegram (T3)
> Yadro hal: per-modul bot (Q50/101/102), vaqt-sozlanadigan (Q140), org-marshrut (Vysotskiy vertikal).

**Yangi qarorlar (egasi):**
- **EP-NTF-008** Kanal = **aralash** (shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga).
- **EP-NTF-018** Tinchlik vaqti = **ish vaqtida normal, tunda faqat shoshilinch** (oynani egasi sozlaydi).
- **EP-NTF-021** Telegram boshqaruv = **Ha** (tasdiqla/rad/topshiriq tugma bilan).
- **EP-NTF-016** O'qildi tasdiq = **faqat muhim/shoshilinch xabarda** ("ko'rmadim" bahonasi yo'q).

**Printsip-asosli (A-default):** 002 "mening holatim"(karta+vazifa+natija+razryad), 004 haftalik digest org-marshrut, 005 FP-tsikl, 006 holat-alert, 009 guruh↔org, 010 vertikal(manager_id), 011 7-otdeleniye holat, 012 leaderboard top/past-3, 013 karta-AI digest, 014 razryad-xabar (xodim+rahbar+HR), 017 javobsiz→eskalatsiya, 020 PDF, 022 bot-ruxsat (org-RBAC), 023 yangi-xodim ulanish, 024 oltin-ip holat, 025 kechikish 2-bosqich, 026 ЦКП bajarilish, 027 bildirishnoma jurnali, 028 shablon tahrir (egasi/admin), 029 avariya signal, 030 maqtov/tanbeh, 032 og'zaki→yozma 24 soat, 037 chetlab-o'tish signal, 038 yuboruvchi/qabul masъuliyat, 041 to'xtatish→zanjir.

> ✅ **Bildirishnoma — barcha 64 ochiq hal (82/82):** 4 yangi + printsip.

---
> 🏁 **HAL QILINGAN (18):** + NTF. Keyingi: POS Monitor.
---

## POS Monitor (T3 — zavod ombor tableti)
**Yangi qarorlar (egasi):**
- **EP-POS-032** Texkarta guard = **qizil ogohlantirish + QAT'IY BLOK** (faqat smena/reja boshlig'i ruxsati; COR-088 STOP bilan mos).
- ⭐ **EP-POS-050** Material topshirish = **topshirish AKTI (2 imzo: topshiruvchi/qabul qiluvchi) + audit-log** (ombor materiali = rasmiy akt; ishlab chiqarish smena-login'idan farqli — ziddiyat #4 nuance hal).
- ⏳ **EP-POS-037 Makulatura ombor = egasi FAYL yuboradi → o'rganib loyihaga qo'shiladi** (📌 PENDING OWNER FILE).
- **EP-POS-069** Foto-dalil = **Ha, majburiy** (buzuq qabul/brak/katta farqда planshet kamerasidan foto).

**Printsip-asosli (A-default; ko'pi WMS/COR/QC takрori):** 017 sikl-sanash, 020/077 AI anomaliya→boshliq, 036 chiqindi→makulatura kirim, 038/039 poddon/tara (qaytariladigan balans), 041 prostoy "material kutyapman" tugma, 044 norma-fakt anomaliya, 046 A-System almashtiradi (DIR-039), 049 lab-namuna chiqim, 052 qisman qabul (=WMS-049), 056 omborchi GSD (reja%/kechikish/og'ish), 062 davальческое (=WMS-019), 064 avto-tasdiq limit (=WMS-060 ±1%), 066 rezerv, 067 shoshilinch chiqim (sabab+boshliq), 068 bichish qisman chiqim, 070 offline konflikt→"tekshirilsin", 076 buyurtma o'zgarishi→qaytarish, 079 boshlang'ich qoldiq (bir martalik to'liq inventar), 081 topshirish-nizo→boshliq.

> ✅ **POS Monitor — barcha 25 ochiq hal (82/82):** 3 yangi + 1 pending-fayl + printsip.

---
> 🏁 **HAL QILINGAN (19):** + POS. Keyingi: CC (oxirgi modul!).
> 📌 **PENDING OWNER FILE:** POS-037 makulatura ombor (egasi fayl yuboradi).
---

## CC / Communication Center / Hujjat (T2 — 3-savat manbai)
> Yadro hal: CC = 3-savat MANBA (ziddiyat #3); hujjat org-marshrut (vert+goriz); immutable; PIN-imzo.

**Yangi qarorlar (egasi):**
- ⭐ **EP-CC-028** Tasdiq marshruti = **ORG-SXEMA bo'yicha yuqoriga, hammasi oxiri DIREKTORGA** (summa-tier EMAS; kuchli markaziy nazorat) [override].
- **EP-CC-014** Kaskad = Ha (hujjat tasdiqlangach shablonga ko'ra avto-vazifa → Kanbanga; распоряжение-loop).
- **EP-CC-022** Hujjat AI = Ha (tasdiqdan oldin AI qisqa tahlil: mos/risk/tavsiya; qaror odamda, faza 2).
- **EP-CC-042** Qaror asoslik = Ha ("asos: qaysi hujjat/raqam" maydon; manba kuzatiladi, nizoda himoya).

**Printsip-asosli (A-default):** 037 gorizontal vakolat matritsa, 038 analitik→Совершенствование, 044 maydon×rol tahrir-huquq, 045 ma'lumot-talab hujjati (=COR-118), 048 buyurtma-100% gate (PP-063), 050 tungi-smena qaror hujjat (+Telegram eskalatsiya), 057 опросный лист→texkarta 4-punkt moslik, 070 darajalararo umumlashtirish, 071 rol-maydon huquq (texnik-yechim=texnolog), 078 bo'limlararo qaror protokol (РД-2/4/5 PIN-imzo), 079 tashkiliy-xato avto-qayd, 083 smena biriktirish hujjat (→MES/HR domeni).

> ✅ **CC / Hujjat — barcha 24 ochiq hal (84/84):** 4 yangi + printsip.

---

# 🎉🎉 BARCHA 20 MODUL — OCHIQ SAVOLLAR TO'LIQ HAL QILINDI! 🎉🎉

| # | Modul | Tier | Holat |
|---|---|---|---|
| 1 | ORG/KARTALAR | T1 | ✅ 143/143 |
| 2 | HR | T1 | ✅ 82/82 |
| 3 | Finance/GL | T1 | ✅ 86/86 |
| 4 | Coordination | T2 | ✅ 135/135 |
| 5 | Director | T2 | ✅ 85/85 |
| 6 | SD/Sotuv | T1 | ✅ 138/138 |
| 7 | PP/Reja | T1 | ✅ 136/136 |
| 8 | MES | T1 | ✅ 82/82 |
| 9 | QC/Sifat | T1 | ✅ to'liq |
| 10 | WMS/Ombor | T1 | ✅ 134/134 |
| 11 | MM/Ta'minot | T1 | ✅ 140/140 |
| 12 | LMS | T2 | ✅ 85/85 |
| 13 | CRM | T3 | ✅ 85/85 |
| 14 | Marketing | T3 | ✅ to'liq |
| 15 | Kanban | T3 | ✅ 107/107 |
| 16 | IoT | T3 | ✅ 83/83 |
| 17 | AI | T2 | ✅ 95/95 |
| 18 | Bildirishnoma | T3 | ✅ 82/82 |
| 19 | POS Monitor | T3 | ✅ 82/82 (1 fayl-pending) |
| 20 | CC/Hujjat | T2 | ✅ 84/84 |

**~2094 savol — har biri JAVOBLANGAN (egasi javobi yoki printsip-default).**

## 📌 OCHIQ QOLGAN (egasidan keyin):
1. **PP-109** — kod prefiks ma'nolari (KT/PT/E/GL/GL...).
2. **MM Yoqilg'i/Transport** — alohida 10-savollik deep-dive.
3. **POS-037 Makulatura ombor** — egasi FAYL yuboradi → o'rganib qo'shiladi.

## ⭐ Asosiy kesishuvchi printsiplar (build rails):
1. **AI kuzatadi/belgilaydi → salbiy ta'sir faqat inson TASDIG'i bilan** (adolatli).
2. **Karta-markaz** — oylik/ruxsat/GSD/darslik hammasi kartadan; karta atomik.
3. **AI rejalashtiradi** — buyurtma reja/navbat/marshrut AI avtomatik.
4. **Operator IoT-tablet** — brak/TB-chek-list/downtime/priladka shu yerda (mavjud, kengaytiriladi).
5. **Org-sxema marshruti** — kengash/hujjat/bildirishnoma/tasdiq hammasi org-chart bo'yicha; tasdiq oxiri DIREKTORGA.
6. **Bitta haqiqat** — A-System/Bitrix to'liq almashtiriladi, eski arxivga.

---

# 📎 VIZYON-HUJJAT (270 Q) bilan solishtirish — QO'SHIMCHALAR (2026-06-08)
> Manba: `EUROPRINT-VIZYON-HUJJAT.md` (22 vizyon punkti). ~90% allaqachon 20 modulда qoplangan.
> Quyidagilar — hujjatда ANIQ bo'lib, bizning qarorlarда yetarlicha YOZILMAGAN → qo'shildi.

## A. Arxitektura / UX (butun tizim)
- **AR-1** Responsive WEB (kompyuter+planshet+telefon), **alohida native app YO'Q** (bitta kod baza).
- **AR-2** Xato UX: kichik xato → **toast**; katta xato → **modal** (EP Design standartiga qo'shiladi).
- **AR-3** SSO yagona login/JWT; 30+ terminal birga; **to'liq offline**; audit 7 yil; UZ+RU.

## B. Tech-stack (build MAJBURIY — vizyon #8 texnik qarorlar)
- **TS-1** AI = **Gemini API** (Google AI Studio) + **Gemini LIVE** (WebSocket) — AI video-intervyu uchun.
- **TS-2** Telegram bot = **Telegraf.js**.
- **TS-3** Workflow/queue = **BullMQ + EventEmitter2** (mavjud stack) + **outbox**.
- **TS-4** Video-intervyu = ERP ichida **WebRTC** sahifa.
- **TS-5** PDF = server tomonda; Label = **ZPL/EPL/PDF** (barcode printer).

## C. KASSIR — naqd-nazorat markazi (vizyon #2) ⚠️ GAP → Finance sub-modul
> 20 modulда alohida yozilmagan edi — Finance ichiga qo'shiladi (POS Monitor ≠ kassir).
- **KAS-1** Smena **ochish/yopish** + qoldiq nazorati; kunlik **X/Z hisobot**.
- **KAS-2** Oylik/avans **tarqatish kassir orqali**; har operatsiya **PIN** bilan tasdiq.

## D. POS/WMS detallar (vizyon #1) — qo'shiladi
- **POS-D1** Harakat turlari taksonomiyasi: **EXTERNAL_IN (5-bosqich: DRAFT→KARANTIN→QC→OMBOR_MENEJER→AI_GL)** · EXTERNAL_OUT (faqat tayyor mahsulot; Ombor+Moliya+AI) · INTERNAL_ISSUE (1 imzo) · INTERNAL_RETURN (sabab, tasdiqsiz) · INTERNAL_TRANSFER (bir xil tip tezkor / boshqa tip menejer) · DAMAGE→QC. Bekor faqat DRAFT; tasdiqlangan→teskari harakat.
- **POS-D2** Minus saldo: **aktiv → TO'LIQ BLOK**; iste'mol material → **OGOHLANTIRISH + ruxsat**.
- **POS-D3** Barcode = **EAN-13 + Code-128**; AI kamera = ZXing.js; material topilmasa → toast + qo'lda qidirish + yangi kartochka + admin Telegram.
- **POS-D4** Xodim **"Mening inventarim"** sahifasi (moddiy javobgarlik balansi); **chiqishda hamma narsa qaytariladi → keyin HR access beradi**.

## E. HR detallar (vizyon #11-13)
- **HR-D1** AI rekruter **80%**; 3-bosqich: rezyume (Telegram bot, lavozimga xos savol) → **AI live video (Gemini LIVE+WebRTC, javob VA o'zini-tutishini baholaydi)** → jonli intervyu.
- **HR-D2** Surishtirish forma (ota-ona/mahalla/sobiq ish joyi); rad nomzodlar arxivда (AI+qo'lda qidiruv).
- **HR-D3** Testlar: **Tool Test / IQ / Liderlik (Origin) / Replication** — online + AI adaptiv + Telegram bot.
- **HR-D4** Onboarding checklist (passport/INPS/shartnoma: topshirildi/yo'q); 2 mentor (adaptatsiya + kasbiy usta); haftalik baho (1-5, 5 ko'rsatkich).

## F. Savdo/Web (vizyon #14-15)
- **WEB-1** **Web B2B portal** — mijoz web'dan buyurtma bera oladi + web lead→CRM.
- **GT-1** Golden thread: avans **70%** (CRM lead→deal→SD→avans 70%→IChQ→MES→QC→Ombor→Yetkazish→GL).

## ✅ G. ZIDDIYAT — HAL QILINDI
- **Bin location (ombor joyi):** VIZYON-HUJJAT = freeform ╳ EP-WMS-073 = tuzilmali. **EGASI TASDIQLADI = TUZILMALI manzil** (Zona→Qator→Javon→Yacheyka). Freeform BEKOR. WMS-073 ustun.

---

# 📎 VIZYON-TOLIQ (270 Q to'liq) — CHUQUR TAFSILOTLAR (2026-06-08)
> Manba: `EUROPRINT-VIZYON-TOLIQ.md` (270 raw Q&A + POS/IoT input-audit). ~95% qoplangan;
> quyidagilar = javoblardagi ANIQ tafsilotlar (qarorlarда yumshoq qolgan) → qo'shildi.

## H. HR — chuqur tafsilotlar (egasi javoblari)
- **HR-H1 Davomat (Q88/Q108):** 2 timestamp — **xudud-kirish vaqti + ish-joyiga kelish vaqti**; har kirish → bot HR menejerga; **ish-joyida qancha + xududда qancha** alohida; har xodimga **UNIKAL ish vaqti** (sozlanadi); kech → avto-hujjat (jarima **faqat tasdiqlansa**); ish vaqtida tashqariga chiqish → hujjat (ba'zi lavozim hujjatsiz, lekin sabab yozadi); **3 kun sababsiz → BARCHA huquq blok, HR dalolatnoma yozmaguncha**. Eshik xavfsizlik xodimi faqat kirish/ketishni ta'minlaydi.
- **HR-H2 360 baho (Q114):** uskunada ishlamaydigan/o'lchab bo'lmaydigan xodim (farrosh/oshpaz/dizayner) → **xizmat ko'rsatgan odamlar baholaydi** (mas. ofis farroshini o'sha xona xodimlari); har kuni, sabab majburiy (30+ belgi).
- **HR-H3 Kunlik hisobot (Q116/Q119):** HAR lavozim → bot orqali ЦКП'dan kunlik hisobot → profilga; uskunachi → **avto PDF invoys**: qancha ishladi vs kutilgan natija, to'liq oylik, avans, ish-joyidan qarzlari, kassadan olgan puli (omborga kirim bo'lmagan buyum ham). 3 soatda yubormasa → o'sha kun "ishlamagan" (HR o'zgartirsa, hisobot majburiy).
- **HR-H4 ⚠️ JARIMA tizimi (Q126/Q127) = TO'LIQ QAYTA YARATILADI** (revision): 100 qoida + nomutanosib (mushtlashish 100K ╳ telefon 200K) → butun jarima katalogi qayta tuziladi; AI kameralar orqali jarima xodim profiliga.
- **HR-H5 Qarz/inventar (Q182/Q183):** xodim qarzi → karta'da, **oylikdan avto-chegirma**, qaytarish muddati; inventar → imzo (ERP) + chiqishda qaytarish cheklisti + foto/AI kamera.
- **HR-H6 Gamification (Q165-167):** badge + leaderboard + ball (admin panel'dan yangi badge); motivatsiya.
- **HR-H7 Tabrik (Q195):** tug'ilgan kun/yillik → avto Telegram; **egasi (1-xodim) ИSTISNO** (unga bormaydi); qolganlarga 7:30 ertalab.
- **HR-H8 Boshqa:** AI intervyu = faqat **transkripsiya** saqlanadi (video emas, Q53); biometrik rozilik **mehnat shartnomada** (Q161); DB **partitioning** (3 yildan eski → arxiv, Q156); HR brend = **europrint.uz** careers + rekruter→HR-brend topshiriq (Q12/Q99/Q193).

## I. POS — INPUT-AUDIT (2026-06-04) → BUILD-FIX ro'yxati
> POS Kirim Wizard yaxshi qurilgan (atomik stok), LEKIN bir nechta maydon ekranda bor — saqlanmaydi:
- **POS-FIX1** `pos_movements.supplier_tin` ustuni YO'Q → **STIR/INN yo'qoladi** (huquqiy hujjat uchun shart).
- **POS-FIX2** `currency` ustuni bor, lekin FE yubormaydi → **valyuta yo'qoladi** (USD/EUR kirim xato).
- **POS-FIX3** per-qator **og'irlik/sertifikat** yo'qoladi (faqat jami + 1-qator saqlanadi; rulon uchun jiddiy).
- **POS-FIX4** narx/og'irlik **tekshiruvsiz** (0/manfiy o'tadi) → noto'g'ri GL summa.
- **POS-FIX5** AI_GL → `pos_gl_postings` (POS-lokal)ga yozadi, asosiy moliyaga ulanmagan → **kanonik GL'ga ulanadi**.

## J. IoT-tablet — eslatma
> VIZYON-TOLIQ (2026-06-04) tabletда ish-yozish 501/stub deydi. AMMO **bugungi `IOT-MES-CURRENT-STATE-2026-06-08.md`** = tablet ~70% QURILGAN (brak/downtime/inline-QC/handover real). Bugungi holat YANGIROQ — build shu asosda (GAP'lar o'sha hujjatda).

