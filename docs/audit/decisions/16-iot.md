# IoT — Decision Map (EP-IOT) — 2026-06-08

> Manba savollar: v1 (`vision-questions/16-iot.md`, 30) + v2 (`vision-questions-v2/16-iot.md`, 53) = **83**. Kodlar: v1 → EP-IOT-001..030, v2 → EP-IOT-031..083 (fayl tartibida).
> Status manbalari: `EUROPRINT_BARCHA_JAVOBLAR.md` (460 real javob — **AI kamera markaziy**: Q57 yuz qo'shish + inspeksiya + real-time davomat, Q88 davomat + kayfiyat + sog'liq AI kamera orqali [Excel/turniket → AI kamera], Q98 ideal-xona rasm bilan **har 2 soatda** AI taqqoslash, Q108 kirish vaqti + ish-joyi vaqti + hudud vaqti, Q116/Q119 uskunada ishlaydigan xodim avto-kunlik hisobot → rasmiy invoys PDF, Q128 jarima AI kameralar orqali xodim profiliga; Q97 har bo'lim/xona ideal-rasm AI nazorat), `SHvB-40-Yonalish-Prompt.md` (**YO'NALISH 37 — IoT/Ishlab chiqarish monitoring**: productionSensor/machineStatus/uptime/downtimeReason/shiftProductivity/qualityGate/sensorAlert/iotGsd/machineEfficiency/plannedVsActual; `production-sensor.entity` + `downtime.entity`; **MES bilan integratsiya** sensor → MES downtime avto; "IT tizim uptime %" GSD; MESDashboard bilan birlash), `LOYIHA-BITGAN-XOLAT-2026-06-08.md` (EP-kod IOT, action turlari, modul og'irligi **T3 — QO'LLAB-QUVVATLOVCHI**, oltin-ip, karta-model GSD/ЦКП), kitob (Станоклар норма / А·Б·С смена / норма штук 1 час / udar/list / брак% / иш йук — v2 grounding).
> Egasi muhim cheklov: **IoT hali O'RNATILMAGAN — hozir Excel/qo'lda yuritiladi; mashina ЦКП IoT/MES'dan keyin avto**. Shuning uchun mashina-sensor (Q1-Q9, Q13-Q20 v1; v2 sensor/energiya/kompressor) deyarli hammasi 🔵 OCHIQ "C/keyin → A-default reja", lekin **AI kamera** yo'nalishi (xona inspeksiya, himoya, davomat) 460 javobda ✅ JAVOBLANGAN (chunki AI kamera = boshlang'ich, sensor emas). Har savol birinchi varianti (A) = vizyonga/kitobga eng mos = tavsiya.

## Xulosa
- **Jami:** 83
- **✅ JAVOBLANGAN:** 37 (AI kamera yo'nalishi 460 javobda aniq [Q56/Q57/Q88/Q89/Q97/Q98/Q108/Q128] + ShVB YO'NALISH 37 IoT-MES integratsiya/GSD/downtime modeli + kitob grounding [Станоклар норма reestri/birlik м2·лист·штук·удар/А·Б·С смена/брак%/иш йук/колиб/переделка/настройка/отработано часов/Папка№/норма-tasdiq imzo zanjiri/ремонт tarixi/operator+yordamchi] + karta-model GSD/ЦКП→oylik + master-reestr yagona-haqiqat + iot-tablet controller mavjud)
- **🔵 OCHIQ:** 46 (egasi keyin hal qiladi — IoT sensor hali O'RNATILMAGAN = ko'pi "fazaviy" [energiya/kompressor/lak/plyonka/namlik/idle tok/predictive]; har biriga A-default tavsiya: o'lchov-imkoni bo'lganda eng to'g'ri model; sub-savollar ham A-default)

---

## I QISM — v1 (30 savol) — EP-IOT-001..030

### EP-IOT-001 · Sensor qaysi mashinalarga qo'yiladi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avval 3-5 ta asosiy mashina (eng ko'p to'xtaydigan/eng qimmati). IoT hali o'rnatilmagan (egasi); bosqichma-bosqich joriy = tez natija, kam xarajat. Kitob bo'yicha eng kritik nomzodlar: Гофра линия, KBA-105/SM-72 (ofset), ФСМ.
- **Manba:** v1-A + egasi (IoT hali yo'q, Excel/qo'lda) + kitob (asosiy mashinalar)
- **action:** CREATE
- **⤳ Ta'sir:** CAPEX (Moliya), mashina-reestr (EP-IOT-029), bosqichli joriy etish

### EP-IOT-002 · Mashina holati ranglari (master-ro'yxat)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 holat: Ishlayapti(yashil)/To'xtagan(qizil)/Sozlanmoqda(sariq)/Nosoz(qora)/O'chiq(kulrang). ShVB YO'NALISH 37 `machineStatus` real holatlarni talab; kitob "ремонтда" + "настройка" + "иш йук" 5 holatga aniq mos.
- **Manba:** ShVB Y37 (machineStatus) + kitob (ремонт/настройка/иш йук) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** Andon ekran (EP-IOT-021), holat hisoboti, MES

### EP-IOT-003 · Mashina uptime (ish vaqti) ko'rsatkichi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik (sensor signalidan, smena/kun/hafta) + GSD'ga ulash. ShVB YO'NALISH 37: `uptime` + "IT tizim uptime %" GSD; karta-model — mashina GSD operatorga (EP-IOT-025). IoT o'rnatilguncha qo'lda/MES'dan; o'rnatilgach avto.
- **Manba:** ShVB Y37 (uptime, iotGsd) + karta-model (GSD) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** ShVB GSD (EP-IOT-051), OEE (EP-IOT-014), karta GSD (EP-IOT-025)

### EP-IOT-004 · To'xtash (downtime) sababini yozish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor sabab ro'yxatidan operator tanlaydi (planlangan/planlanmagan ajraladi). ShVB YO'NALISH 37 `downtime.entity` + `downtimeReason`; MES'da `downtime_reason_codes` allaqachon bor. Kitobning real sabablari (иш йук/колиб/переделка) tayyor ro'yxatga aylanadi.
- **Manba:** ShVB Y37 (downtime.entity, downtimeReason) + MES (downtime_reason_codes mavjud) + kitob + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-005 (sabab ro'yxati), Pareto tahlil, MES integratsiya

### EP-IOT-005 · To'xtash sabablari ro'yxati (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 8-10 standart sabab (ta'mirlash/material yo'q/qolip almashtirish/sozlash/tozalash/tok yo'q/operator yo'q/sifat). Kitob real sabablarni beradi: **иш йук** (EP-IOT-036), **колиб тайёр эмас** (EP-IOT-037), **переделка** (EP-IOT-038), **настройка муракаб** (EP-IOT-039) — bular ro'yxatga majburiy kiradi.
- **Manba:** kitob (иш йук/колиб/переделка/настройка real izohlar) + v1-A + MES downtime kodlari
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-036..039 (kitob sabablari), MPS/MRP, ShVB

### EP-IOT-006 · Anomaliya (g'ayrioddiy holat) ogohlantirishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik aniqlash + darhol ogohlantirish (sex ekrani + Telegram). ShVB YO'NALISH 37 `sensorAlert`. IoT sensor o'rnatilgandan keyin (hozir yo'q) — fazaviy.
- **Manba:** ShVB Y37 (sensorAlert) + v1-A + egasi (sensor hali yo'q)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat (EP-IOT-008), Telegram (EP-IOT-028), CC marshrut (EP-IOT-024)

### EP-IOT-007 · Anomaliya chegaralarini kim belgilaydi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har mashina turi uchun chegara admin/ishlab chiqarish boshlig'i sozlaydi. Kitobning norma-tasdiq zanjiri (РД4→Ген.Директор, EP-IOT-024 v2/Q24) chegara ham nazoratli o'rnatilishini ko'rsatadi. AI avto-chegara (B) keyin.
- **Manba:** v1-A + kitob (norma tasdiq zanjiri) + egasi (sensor hali yo'q)
- **action:** UPDATE
- **⤳ Ta'sir:** Anomaliya signal sifati, mashina-turi master-data

### EP-IOT-008 · Anomaliya kelganda nima bo'ladi (workflow)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avto: texnik xizmat vazifasi ochiladi + mas'ul mexanikga xabar + jurnal. Karta-model: xabar to'g'ri kartaga (mexanik). IoT sensor o'rnatilgach faollashadi.
- **Manba:** v1-A + karta-model (xabar marshrut, EP-IOT-024) + ShVB Y37 (sensorAlert)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat (EP-IOT-016), CC, jurnal

### EP-IOT-009 · Telemetriya tarixini saqlash muddati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — batafsil 3-6 oy, keyin kunlik o'rtachaga siqib uzoq saqlash (downsampling). Tahlil + baza joyiga muvozanat. Texnik qaror; IoT o'rnatilgach amal qiladi.
- **Manba:** v1-A + texnik amaliyot (time-series downsampling)
- **action:** CRON
- **⤳ Ta'sir:** Baza hajmi, trend tahlil, OEE tarixi

### EP-IOT-010 · Kamera-AI bilan xona inspeksiyasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI rasm baholaydi + ball + anomaliya. Q97: har bo'lim/xona ideal-rasm orqali AI nazorat; Q98: ideal-xona bilan **har 2 soatda** taqqoslash. ShvB inspektor-menejer yo'nalishi (Y29) bilan to'liq mos. Bu sensor EMAS → hozir joriy etiladigan boshlang'ich.
- **Manba:** BARCHA_JAVOBLAR Q97/Q98 (ideal-xona AI taqqoslash, har 2 soatda) + ShVB Y29 (inspektor) + v1-A
- **action:** AI
- **⤳ Ta'sir:** HR inspeksiya, EP-IOT-011/012, xavfsizlik (EP-IOT-047/048)

### EP-IOT-011 · Kamera-AI nimani tekshiradi (master-ro'yxat)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5-7 mezon (tozalik/himoya vositasi/yo'lak/tartib/xavfsizlik). Q29 (inspeksiya: Checklist + Foto + Xarita), Q97 (har bo'lim/xona checklist + ideal-rasm). Mezon ro'yxati izchil ball uchun shart.
- **Manba:** BARCHA_JAVOBLAR Q29/Q97 (checklist + ideal-rasm mezonlari) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-010 (ball), HR inspeksiya, EP-IOT-047 (himoya vositasi)

### EP-IOT-012 · Inspeksiya buzilishini tuzatish jurnali
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har buzilish → mas'ul → muddat → tuzatildi tasdig'i (yopiq sikl). Q40 (etika: jurnal + bosqichli jazo + xodim ko'radi), Q128 (jarima → xodim profiliga), Q69 (qoidabuzarlikni inspektor + HR + bo'lim boshlig'i ko'radi). Yopiq sikl = javobgarlik.
- **Manba:** BARCHA_JAVOBLAR Q40/Q69/Q128 (jurnal + javobgarlik + profil) + ShVB Y29 (correctionPlan) + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** HR jarima/intizom, QC reklamatsiya, audit

### EP-IOT-013 · MES bilan ulanish (ish buyrug'i ↔ mashina)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — sensor hisoblagich → MES buyrug'iga avto bog'lanadi (chiqarilgan dona avto-yoziladi). ShVB YO'NALISH 37: "MES bilan integratsiya — sensor → MES downtime avto", MESDashboard bilan birlash. Oltin-ip yadrosi. IoT sensorsiz hozir qo'lda; o'rnatilgach avto.
- **Manba:** ShVB Y37 (MES integratsiya, MESDashboard birlash) + oltin-ip + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** MES (avto bajarildi), EP-IOT-040 (Папка bog'lash), EP-IOT-026 (defekt)

### EP-IOT-014 · OEE (umumiy samaradorlik) ko'rsatkichi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — to'liq OEE (3 omil: vaqt + tezlik + sifat) avtomatik + trend. ShVB YO'NALISH 37 `machineEfficiency` + `plannedVsActual`; MES'da OEE snapshot allaqachon bor. Kitob: норма штук (tezlik) + брак% (sifat) + ишлаган соат (vaqt) = 3 omil to'liq.
- **Manba:** ShVB Y37 (machineEfficiency) + MES (OEE snapshot mavjud) + kitob (norma/брак/соат) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-003 (uptime), EP-IOT-051 (GSD), mashina taqqoslash

### EP-IOT-015 · RUL — qolgan resurs (predictive maintenance)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — oddiy qoidaga asoslangan prognoz (ish soati/sikl bo'yicha) avval; ishonchli, tez. AI prognoz (B) keyin (ko'p data kerak). Kitob udar-resurs (EP-IOT-004 v2/Q4, EP-IOT-026 v2/Q26 qolip udar) bu yo'nalishni qo'llab-quvvatlaydi.
- **Manba:** v1-A + kitob (udar/sikl resurs) + egasi (data hali yo'q)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat jadvali (EP-IOT-016), qolip resursi (EP-IOT-026 v2)

### EP-IOT-016 · Texnik xizmat jadvali (reja-profilaktika)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik jadval (ish soatiga bog'liq) + eslatma + bajarildi belgisi. Kitob "ремонтда" tarixini (EP-IOT-042 v2) tizimlashtirish bilan bog'liq. TPM checklist (EP-IOT-050 v2) ham shu yo'nalish.
- **Manba:** v1-A + kitob (ремонт tarixi) + egasi (sensorsiz: ish-soati MES'dan)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-017 (ishlar ro'yxati), EP-IOT-042/043 v2 (tarix/ehtiyot qism)

### EP-IOT-017 · Texnik xizmat ishlari ro'yxati (master-data)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mashina turi bo'yicha standart ishlar + davriylik jadvali (yog'lash/filtr/kamar/kalibrlash). Izchil bajarish; mexanik unutmaydi.
- **Manba:** v1-A + texnik amaliyot (TPM)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-016 (jadval), EP-IOT-046 v2 (kalibrovka)

### EP-IOT-018 · Energiya (tok) iste'molini kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mashina darajasida o'lchash (har mashina necha kVt) — sababni topadi. IoT energiya-sensor hali yo'q (egasi); o'rnatish CAPEX talab — fazaviy. Avval umumiy sex hisoblagichi (B) bo'lishi mumkin.
- **Manba:** v1-A + egasi (sensor hali yo'q)
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-019/020 (energiya hisobot/birlik), EP-IOT-030 (Finance tannarx)

### EP-IOT-019 · Energiya bo'yicha hisobot va ogohlantirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — norma + oshganda ogohlantirish + haftalik energiya hisoboti. Bo'sh turib tok yeyish (EP-IOT-034 v2) eng oson tejaladigan xarajat. Energiya-sensor o'rnatilgach.
- **Manba:** v1-A + egasi (sensorsiz)
- **action:** CRON
- **⤳ Ta'sir:** Moliya (tejash), EP-IOT-034 v2 (idle tok)

### EP-IOT-020 · Birlik mahsulotga energiya sarfi (ShVB statistikasi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik (energiya / MES dona) + GSD'ga ulash. ShVB GSD ko'rsatkichi. Energiya-sensor + MES dona ikkalasi kerak → fazaviy.
- **Manba:** v1-A + ShVB GSD (karta-model) + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** ShVB GSD (EP-IOT-051), tannarx, samaradorlik trendi

### EP-IOT-021 · Sex katta ekrani (Andon tablosi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — katta tablo: barcha mashina holati + to'xtaganlari qizil + jonli yangilanadi. Tez ko'rinish, boshliq tepada turmaydi. Andon = norma vs haqiqiy (EP-IOT-036 v2/Q36) bilan birlashadi.
- **Manba:** v1-A + ShVB Y37 (machineStatus jonli) + kitob (Andon norma)
- **action:** READ
- **⤳ Ta'sir:** EP-IOT-036 v2 (target vs haqiqiy), EP-IOT-011 v2 (hozirgi+keyingi ish)

### EP-IOT-022 · Operator tableti (mashina yonida)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashinada tablet: holat + to'xtash sababi + defekt + smena hisoboti. Audit: iot-tablet controller allaqachon bor. Q116/Q119: uskunada ishlaydigan xodim avto-kunlik hisobot → invoys PDF. Qo'l ish joylari ham tabletdan (EP-IOT-016 v2/Q16).
- **Manba:** audit (iot-tablet controller mavjud) + BARCHA_JAVOBLAR Q116/Q119 + v1-A
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-027 (smena hisobot), EP-IOT-016/027 v2 (qo'l/defekt sabab tablet)

### EP-IOT-023 · Sensor uzilganda / signal kelmasa
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Aloqa yo'q" alohida holat sifatida ko'rsatiladi + texnikga xabar. Halol hisob: "signal yo'q" ≠ "to'xtagan". Bu EP-IOT-041 v2 (noma'lum vaqt ajratish) bilan bir mantiq.
- **Manba:** v1-A + EP-IOT-041 v2 (data sifati)
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-041 v2 (noma'lum vaqt), OEE data sifati

### EP-IOT-024 · Holat va xabarlar kimga boradi (karta-model)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — xabar turi bo'yicha kartaga marshrutlanadi (anomaliya→mexanik, uzun to'xtash→sex boshlig'i). Karta-model poydevor: har xabar to'g'ri lavozim kartasiga. Q78/Q79/Q132: hujjat/xabar org-sxema bo'yicha (vertikal+gorizontal), CC orqali.
- **Manba:** BARCHA_JAVOBLAR Q78/Q79/Q132 (org-sxema marshrut) + karta-model + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** CC (Comm.Center), NTF, EP-IOT-028 (Telegram)

### EP-IOT-025 · Mashina samaradorligini kartaga bog'lash (GSD)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mashina OEE/uptime → operator/mexanik kartasi GSD'ga avto kiradi. Karta-model: natija lavozimga bog'lanadi; operator o'z mashinasi uchun javob beradi. Q116 (uskuna xodimi STKP/hisobot avto). Adolatlilik uchun idle/material chiqarib tashlanadi (EP-IOT-052 v2).
- **Manba:** karta-model (GSD lavozimga) + BARCHA_JAVOBLAR Q116 + ShVB Y37 (iotGsd) + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** HR (KPI/bonus), ShVB GSD, EP-IOT-052 v2 (adolatli bog'lash)

### EP-IOT-026 · Defekt/sifat muammosini mashinaga bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — defekt → mashina + smena + vaqt avto bog'lanadi (MES orqali). Qaysi mashina ko'p brak chiqaradi → sozlash/ta'mir kerakligi. Kitob брак% + смена (А/Б/С) bilan bog'liq (EP-IOT-008/010 v2).
- **Manba:** v1-A + kitob (брак% + смена) + MES integratsiya
- **action:** EVENT
- **⤳ Ta'sir:** QC (Pareto), EP-IOT-027 v2 (defekt sabab), EP-IOT-021 v2 (brak chegarasi)

### EP-IOT-027 · IoT smena hisoboti (avtomatik)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avto smena hisoboti + sex boshlig'iga/Telegram'ga yuboriladi. Q116/Q119: uskunada ishlaydigan xodim hisoboti **avtomatik yuboriladi, rasmiy invoys PDF** (qancha ishlagani/kutilgan natija/oylik/avans/qarz). ShVB Y37 `shiftProductivity` + `iotReport`.
- **Manba:** BARCHA_JAVOBLAR Q116/Q119 (avto invoys PDF) + ShVB Y37 (iotReport) + v1-A
- **action:** CRON
- **⤳ Ta'sir:** ShVB haftalik statistika, HR (xodim hisoboti), Telegram

### EP-IOT-028 · Telegram orqali IoT xabarlari (ShVB bot)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — faqat muhim hodisalar (uzun to'xtash, anomaliya, ta'mir kerak) Telegram'ga. Q101/Q102: har modul uchun alohida bot (ERP'ga ulangan); Q140: bildirishnoma vaqtlari sozlanadi. Shovqinsiz = foydali.
- **Manba:** BARCHA_JAVOBLAR Q101/Q102/Q140 (modul boti + sozlanadi) + ShVB Y38 + v1-A
- **action:** EVENT
- **⤳ Ta'sir:** NTF, CC marshrut (EP-IOT-024), tungi smena (EP-IOT-049 v2)

### EP-IOT-029 · Mashinalar reestri (master-data)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — yagona mashinalar reestri (nomi/turi/inventar/sex/sana/mas'ul karta) — barcha IoT/ta'mir/sifat shunga bog'lanadi. Yagona haqiqat manbai. Kitob "Станоклар норма" ro'yxati 1:1 seed (EP-IOT-031 v2).
- **Manba:** v1-A + kitob (Станоклар норма reestri) + master-data prinsip (yagona haqiqat)
- **action:** CREATE
- **⤳ Ta'sir:** **Hamma IoT operatsiyasi**, EP-IOT-031 v2 (kitob nomlari), texnik xizmat, defekt

### EP-IOT-030 · Energiya iste'molini Finance bilan bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — energiya sarfi → tannarxga avto qo'shiladi (Finance bilan ulanadi). To'liq biznes ko'rinish; energiya = real pul. Energiya-sensor (EP-IOT-018) o'rnatilgach faollashadi → fazaviy.
- **Manba:** v1-A + oltin-ip (tannarx) + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Finance (tannarx/foyda), EP-IOT-018/020 (energiya)

---

## II QISM — v2 (kitob-grounded, 53 savol) — EP-IOT-031..083

### EP-IOT-031 · Mashina reestri "Станоклар норма" jadvaliga 1:1 mos
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — reestr xuddi "Станоклар норма" nomlari bilan seed (SM-52/SM-72/KBA-105/Тигель 1-10/Гофра линия/ФСМ/...). Zavod allaqachon shu nomlar bilan ishlaydi; yangi nom = smena tabeli bilan nomuvofiqlik.
- **Manba:** kitob (Станоклар норма.xlsx aniq nomlar) + EP-IOT-029 v1 (yagona reestr) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MES, Ishlab chiqarish (norma), Smena tabeli, EP-IOT-029

### EP-IOT-032 · Har mashinaga "норма штук 1 час" qiymati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashina kartasida norма/soat + norма/12 soat saqlanadi; IoT haqiqiy bilan solishtiradi (performance % avto). Kitob "норма штук 1 час" + "за 12 часов" aniq bor. **Sub (norma kim tasdiqlaydi):** A — "Согласовано РД4 + Утверждено Ген.Директор" imzo-zanjir (kitobdagidek, EP-IOT-024 v2 bilan bir).
- **Manba:** kitob (норма штук 1 час/12 часов + РД4/Ген.Директор imzo) + v2-A + sub-A
- **action:** CREATE
- **⤳ Ta'sir:** OEE Performance, EP-IOT-024 v2 (tasdiq zanjiri), HR (oylik)

### EP-IOT-033 · O'lchov birligi mashinaga qarab (м2/лист/штук/удар)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashinada o'z birligi. Kitob aniq: Гофра=м2, ofset=лист, Тигель=удар/лист, qolgan=штук. Hammasini "dona"ga keltirsak gofra/tigel xato chiqadi.
- **Manba:** kitob (м2/лист/штук/удар aniq taqsimot) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** OEE, Ishlab chiqarish hisoboti, Norma, EP-IOT-004 v2 (udar)

### EP-IOT-034 · Tigel uchun "удар/лист" hisoblagichi alohida
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Тигель'da udar va лист ikkalasi alohida hisoblanadi (resurs + ishlab chiqarish). Tigel resursi udar soniga bog'liq. **Sub (udar→texnik xizmat eslatmasi):** Ha — har N mln udarda eslatma (EP-IOT-026 v2 qolip resursi bilan bir). IoT zarba-sensor hali yo'q → fazaviy.
- **Manba:** kitob (Тигель udar/лист) + v2-A + sub-Ha + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** EP-IOT-026 v2 (qolip resursi), Texnik xizmat, OEE

### EP-IOT-035 · SM/KBA bosma ranglar soni (seksiya) kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har bosma ishi uchun rang/seksiya soni (4+0/4+4) yoziladi (texnik topshiriqdan). Bo'yoq sarfi/plastina/tezlik rang soniga bog'liq. Texnik karta (PP)dan keladi, IoT o'qiydi.
- **Manba:** kitob (ofset SM/KBA + краска) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** Ombor (bo'yoq), Dizayn (rang), Norma, EP-IOT-031 v2 (bo'yoq daraja)

### EP-IOT-036 · "иш йук" (idle) alohida holat sifatida
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Иш йук" alohida toifa (rejalashtirish kamchiligi), nosozlikdan ajraladi. Kitob takror: "ходимлар иш йуклиги сабабли...". Aralashtirsak nosozlik statistikasi buziladi, ShVB noto'g'ri xulosa.
- **Manba:** kitob (иш йук real izohlar) + EP-IOT-005 (sabab ro'yxati) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MPS/MRP (rejalashtirish), ShVB samaradorlik, EP-IOT-029 v2 (muqobil ish)

### EP-IOT-037 · "Колиб тайёрланмагани" to'xtash sababi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Колиб тайёр эмас" alohida sabab + mas'ul bo'lim (qolip tsexi) biriktiriladi. Kitob real: "уз вактида колибни таергарлик курмаганимиз сабабли -4 соат". Javobgarlik aniq.
- **Manba:** kitob ("колиб таергарлик -4 соат" real izoh) + EP-IOT-005 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Qolip/штамп tsexi, Ishlab chiqarish reja, EP-IOT-053 v2 (plastina holati)

### EP-IOT-038 · "Иш икки марта кайта урилган" (переделка) brak sabab kodi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Кайта урилди (переделка)" sabab kodi + qisqa izoh. Kitob: "иш икки марта кайта урилган колиб яримтали + подрезка". Qayta urish = vaqt + material yo'qotish; sababi yozilsa takror oldini olinadi.
- **Manba:** kitob ("кайта урилган" real izoh) + EP-IOT-005 + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** QC (брак%), Norma, EP-IOT-027 v2 (defekt sabab ro'yxati)

### EP-IOT-039 · "Билма заказ настройкаси муракаб" — setup vaqti alohida
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — setup vaqti alohida holat (сozlanmoqda) sifatida sanaladi, OEE'da hisobga olinadi. Kitob: "Билма заказ настройкаси муракаб - вакт кетди". Setup ishlash vaqtiga qo'shilsa norма soxta past.
- **Manba:** kitob ("настройка муракаб - вакт кетди") + EP-IOT-002 (sozlanmoqda holati) + v2-A
- **action:** UPDATE
- **⤳ Ta'sir:** OEE (Availability), Norma, Smena hisoboti, EP-IOT-019 v2 (ish soni)

### EP-IOT-040 · Smena (А/Б/С) bo'yicha holat va norma ajratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har smena (А/Б/С) bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktiriladi. Kitobda smenalar А/Б/С belgilangan. ShVB smena boshliqlarini taqqoslash uchun shart.
- **Manba:** kitob (А/Б/С смена) + Q132/Q133 (smena orgsxemadan) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** HR (smena boshlig'i KPI), ShVB, EP-IOT-010 v2 (smena KPI)

### EP-IOT-041 · "Станокдаги ишлар · кейинги иши" navbat Andon'da
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har mashina kartasida "hozirgi ish + keyingi ish" MES'dan kelib ko'rsatiladi. Operator keyingi ishni ko'rsa, qolip/material oldindan tayyorlanadi → to'xtash kamayadi. Zavodda qog'ozda allaqachon yuritiladi.
- **Manba:** kitob (Станокдаги Ишлар + кейинги иши tabel) + EP-IOT-021 (Andon) + v2-A
- **action:** READ
- **⤳ Ta'sir:** MES (ish navbati), Ishlab chiqarish reja, EP-IOT-039 v2 (НЗП)

### EP-IOT-042 · Har mashinaga operator va yordamchi biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — smena yozuvida operator + yordamchi(lar) biriktiriladi (HR kartasidan). Kitob tabel: "Оператор: ___ / Ёрдамчи: ___". Brak/rekord kimning smenasida — KPI/o'qitish manzili aniq.
- **Manba:** kitob (Оператор/Ёрдамчи tabel) + karta-model + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR (KPI, darslik), karta-model, EP-IOT-025 (mashina GSD→karta)

### EP-IOT-043 · Гофра линия м2 hisoblagich Ombor (karton) bilan bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ishlab chiqarilgan м2 ↔ sarflangan material м2 avto solishtiriladi, farq ogohlantiriladi. Farq = yo'qotish/brak → isrof/o'g'irlik ko'rinadi. Гофра м2-sensor o'rnatilgach.
- **Manba:** kitob (Гофра м2) + oltin-ip (material balans) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor, Sifat (brak), Moliya, EP-IOT-030 v2 (gofra namlik)

### EP-IOT-044 · UV/Трафаретный лак sarfi kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — лак mashinalarida varaq/m2 → lak sarf normasi (haqiqiy ↔ kutilgan). Lak qimmat material; sarf normasi nazorati. Sensor/qo'lda hisob — fazaviy.
- **Manba:** kitob (UV лак/Трафаретный лак) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (лак/химикат), Moliya

### EP-IOT-045 · Ламинация plyonka (рулон) sarfi va isrofi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — plyonka sarfi + isrof % har ишда yoziladi, chegaradan oshsa ogohlantiriladi. Yuqori isrof = sozlama/operator muammosi. Fazaviy.
- **Manba:** kitob (Ламинация катта/кичик/полуавтомат) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (plyonka), Sifat

### EP-IOT-046 · Степлер/Склейка — qo'l mehnati mashinalari IoT'ga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — qo'l ish joylari tabletdan qo'lda kiritiladi (норма штук bilan solishtiriladi), sensor yo'q. Qo'l joylariga sensor qiyin/qimmat; lekin norma (kitobda bor) hisoblanishi kerak. IoT umuman o'rnatilmagan = bu eng real yo'l.
- **Manba:** kitob (Степлер 1/2/3, Склейка, Окошка norma) + egasi (IoT yo'q, qo'lda) + EP-IOT-022 (tablet) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Operator tableti, Norma, EP-IOT-037 v2 (Окошка)

### EP-IOT-047 · Резка material kirim nuqtasi (zanjir boshi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Резка chiqishi keyingi bosqich uchun "kirish miqdori" bo'lib zanjir bo'ylab kuzatiladi. Keyingi mashina braki oldingi varaq sonidan o'lchanadi; Резка raqami bo'lmasa zanjir yo'qotishini kuzatib bo'lmaydi.
- **Manba:** kitob (Резка birinchi operatsiya) + oltin-ip (operatsiya zanjiri) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** MES (operatsiya zanjiri), Sifat, EP-IOT-039 v2 (НЗП)

### EP-IOT-048 · "отработано часов" vs 12 soatlik smena
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — smena = 12 soat baza; ishlangan/bo'sh/sozlash/remont soatlarga bo'linadi. Kitob "отработано часов" + "норма штук за 12 часов". Bu ShVB asosiy yo'qotish ko'rsatkichi. **Sub (smena uzunligi 8/10/12 mashinaga qarab):** Ha — mashina/sexga qarab sozlanadi (EP-IOT-003 v1 smena soatlari sozlanadi bilan bir).
- **Manba:** kitob (отработано часов + 12 часов) + Кун тартиби (12 soat) + v2-A + sub-Ha
- **action:** EVENT
- **⤳ Ta'sir:** OEE (vaqt tahlili), ShVB, EP-IOT-044 v2 (norma sabab tahlili)

### EP-IOT-049 · "ко-во работ" (ish/buyurtma soni) smenada
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — smenada bajarilgan ish soni + har biriga sozlash vaqti sanaladi. Kitob "ко-во работ". Ko'p kichik ish = ko'p sozlash = past norма; buni bilmasak operatorni noto'g'ri ayblaymiz.
- **Manba:** kitob ("ко-во работ") + EP-IOT-039 v2 (setup) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Norma (adolatli baho), EP-IOT-044 v2 (sabab tahlili)

### EP-IOT-050 · Брак % chegaradan oshganda avto ogohlantirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — брак % chegaradan oshsa → smena boshlig'i + sifatga darhol signal (ekran + Telegram). Kitobda "брак %" ustuni bor. Brak kech bilinsa partiya yaroqsiz; erta to'xtatish kerak.
- **Manba:** kitob (брак % ustuni) + v2-A + EP-IOT-028 (Telegram)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (QC), ShVB, Telegram, EP-IOT-051 v2 (brak chegarasi)

### EP-IOT-051 · Brak chegarasi mashina turiga qarab
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har mashina turiga o'z brak chegarasi (ishlab chiqarish boshlig'i belgilaydi). Gofra/ofset/tigel/kashировка normal brak% turlicha; bitta umumiy chegara = noaniq.
- **Manba:** kitob (mashina turlari farqi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** EP-IOT-050 v2 (brak ogohlantirish), QC

### EP-IOT-052 · Авто vs ручная кашировка samaradorligi taqqoslash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — авто/yarim-avto/qo'l кашировка solishtirma hisoboti (m2/soat, brak, mehnat). Egasi avto-mashina investitsiya qaytishini raqamda ko'rishi uchun. Kitob кашировка 3 turda.
- **Manba:** kitob (кашировка авто/полуавтомат/ручная) + v2-A
- **action:** READ
- **⤳ Ta'sir:** Moliya (CAPEX qaror), ShVB, EP-IOT-001 v1 (sensor ustuvorligi)

### EP-IOT-053 · Mashina "иш %" (yuklanish foizi) ko'rsatkichi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har mashina yuklanish % (kun/hafta) + bo'g'iz (bottleneck) belgilanadi. Kitobda "иш %". Doim band = bo'g'iz; doim bo'sh = ortiqcha quvvat → reja/investitsiya.
- **Manba:** kitob ("иш %") + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish quvvat rejasi (CRP), ShVB

### EP-IOT-054 · "Согласовано РД4 / Утверждено Ген.Директор" norma tasdiq zanjiri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma o'zgarishi РД (ishlab chiqarish boshlig'i) → Direktor tasdig'idan o'tadi (audit jurnali bilan). Kitob hisoboti imzo bilan tasdiqlanadi (Yulchiev M. + Pozilov A.). Norma o'zgarsa oylik o'zgaradi → faqat tasdiqlangani amal qiladi.
- **Manba:** kitob (Согласовано РД4 + Утверждено Ген.Директор real imzo) + Q78/Q79 (org-sxema hujjat marshrut) + v2-A
- **action:** APPROVE
- **⤳ Ta'sir:** HR (oylik), ShVB, Audit, EP-IOT-032 v2 (norma)

### EP-IOT-055 · ФСМ tezligi va uzilishi (зажор)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ФСМ tezlik + tiqilish soni kuzatiladi, ko'paysa ogohlantiriladi. Ko'p tiqilish = karton namligi/sozlama muammosi. ФСМ-sensor o'rnatilgach.
- **Manba:** kitob (ФСМ большой/маленький/полуавтомат) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (karton namligi), Ombor

### EP-IOT-056 · Тигель/висечка qolip (штамп) resursini udar soniga bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har qolip kartasi + udar hisoblagichi + resurs chegarasi → almashtirish eslatmasi. Eskirgan qolip brak beradi; oldindan eslatsa partiya buzilmaydi (EP-IOT-037 v2 qolip muammosi bilan bir). EP-IOT-034 v2 (udar) bilan bog'liq.
- **Manba:** kitob (die-cut qolip resursi) + EP-IOT-034 v2 + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Qolip tsexi, Sifat, Texnik xizmat, EP-IOT-034 v2

### EP-IOT-057 · Defekt sababini operator tabletdan tanlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — tayyor sabab ro'yxati (kitobdagi real holatlardan: qolip yarim/podrezka/rang ketdi/karton ho'l) + ixtiyoriy izoh. Erkin matn tahlil qilib bo'lmaydi; Pareto (eng ko'p brak sababi) chiqadi.
- **Manba:** kitob (real defekt sabablari) + EP-IOT-022 (tablet) + EP-IOT-038 v2 (переделka) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Sifat (Pareto), Operator tableti, QC

### EP-IOT-058 · Smena topshirish (А→Б) paytida mashina holati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — smena topshirish ekrani: tugatilmagan ish + mashina holati + qolip/material + izoh. Topshirilmasa keyingi smena nimadan boshlashini bilmaydi → yana sozlash/yo'qotish.
- **Manba:** kitob (А→Б→С smena) + EP-IOT-040 v2 (smena ajratish) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** ShVB, MES, HR

### EP-IOT-059 · "иш йук" soatlarida muqobil ishga (паддон/арчиш) o'tkazish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Иш йук → muqobil ish (арчиш/паддон/тозалаш)" qayd etiladi, vaqt alohida sanaladi. Kitob: "ходимлар иш йуклиги учун арчишда ишлади", "паддон кадоклаган". Bo'sh turmagan xodim mehnati hisobga olinmasa = soxta past samaradorlik + norozilik.
- **Manba:** kitob (арчиш/паддон real izohlar) + EP-IOT-036 v2 (иш йук) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** HR (mehnat hisobi, oylik), ShVB

### EP-IOT-060 · Гофра намлик/клей (yelim) parametri kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — gofra linia yelim harorati + namlik sensor bilan, chegaradan chiqsa ogohlantirish. Yelim/namlik noto'g'ri = qatlam ko'chishi (расслоение) → butun rulon brak. Maxsus sensor — fazaviy.
- **Manba:** kitob (Гофра линия sifat) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Sifat (qatlam ko'chishi), Ombor (karton/yelim), EP-IOT-043 v2

### EP-IOT-061 · Ofset бо'yoq (краска) qutisi darajasi kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bo'yoq darajasi past bo'lsa ogohlantirish + Ombordan avto talab. Bo'yoq o'rtada tugasa rang o'zgaradi (brak)/to'xtash. Sensor/qo'lda — fazaviy.
- **Manba:** kitob (SM/KBA краска) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (bo'yoq talab), Sifat (rang), EP-IOT-035 v2

### EP-IOT-062 · Автовысечка картон vs гофра ajratish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — картон va гофра висечка alohida o'lchanadi (o'z normasi bilan). Kitobda 2 qator (картон/гофра). Karton va gofra normasi/braki/tezligi har xil; aralashtirsak hisobot noto'g'ri.
- **Manba:** kitob (Автовысечка картон/гофра 2 qator) + EP-IOT-033 v2 (birlik) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Norma, Hisobot, EP-IOT-031 v2 (reestr)

### EP-IOT-063 · Mashina ON/OFF vaqti avto yozish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mashina ON/OFF avto yoziladi + tabel rejasi bilan solishtiriladi (kechikish ko'rinadi). Smena 8:00 da boshlanishi kerak, mashina 8:40 da yonsa = yo'qotish. Tok-sensor o'rnatilgach.
- **Manba:** kitob (ish boshlanish vaqti) + Q108 (kirish vaqti nazorati) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** HR (intizom), ShVB, Energiya, EP-IOT-064 v2 (idle tok)

### EP-IOT-064 · Энергия idle (бекор ёниб турган) vaqtni topish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ishlash tok ↔ bo'sh (idle) tok ajratiladi, bo'sh tok ogohlantiriladi. Bo'sh yonib turgan mashina pulni yeydi, mahsulot yo'q = eng oson tejaladigan xarajat. Energiya-sensor o'rnatilgach.
- **Manba:** kitob (idle) + EP-IOT-019 v1 (energiya hisobot) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Moliya (energiya xarajat), ShVB, EP-IOT-063 v2

### EP-IOT-065 · Kompressor/havo (пневматика) bosimi kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kompressor bosimi + havo uzilishi sensor bilan, tushsa ogohlantirish. Bosim tushsa bir necha mashina birdan sekinlashadi/to'xtaydi; bitta kompressor nazorati ko'p mashinani himoya qiladi. Sensor — fazaviy.
- **Manba:** kitob (tigel/ФСМ/висечка havoda ishlaydi) + v2-A + egasi (sensorsiz)
- **action:** EVENT
- **⤳ Ta'sir:** Texnik xizmat, ShVB (yashirin to'xtash sababi)

### EP-IOT-066 · Andon normaga nisbatan real bajarish (target ↔ haqiqiy)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Andon: target vs haqiqiy + ortda qolish % (qizil/yashil). Operator o'z natijasini target bilan real vaqtda ko'rsa, o'zini tezlashtiradi; kitob normasi qog'ozda emas, ekranda jonli. EP-IOT-021 (Andon) bilan bir.
- **Manba:** kitob (норма штук target) + EP-IOT-021 (Andon) + EP-IOT-032 v2 (norma) + v2-A
- **action:** READ
- **⤳ Ta'sir:** ShVB, Operator motivatsiyasi, EP-IOT-052 v2 (bonus)

### EP-IOT-067 · Окошка (deraza yelimlash) alohida bosqich
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Окошка alohida operatsiya + plyonka sarfi + brak. Qo'shimcha material (oyna plyonka) + vaqt; alohida bo'lmasa narx/norма noto'g'ri.
- **Manba:** kitob (Окошка) + EP-IOT-046 v2 (qo'l ish joylari) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ombor (oyna plyonka), Narx (Costing)

### EP-IOT-068 · Тиснение/Конгрев (folga) folga sarfi va udar
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — folga sarfi (м/ish) + udar soni kuzatiladi, isrof ko'rsatiladi. Folga qimmat; har bosishga qancha folga ketishi → xarajat/isrof. Sensor/qo'lda — fazaviy.
- **Manba:** kitob (Тигель тиснение/конгрев) + EP-IOT-034 v2 (udar) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (folga), Moliya

### EP-IOT-069 · Mashina-mashina yarim tayyor (НЗП) kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har buyurtma operatsiya zanjiri bo'ylab kuzatiladi (qaysi mashinada, qancha kutdi). Ish bir necha mashinadan o'tadi (Резка→Печать→Лак→Висечка→ФСМ→Степлер→Упаковка); qayerda qotib qolgani bilinmasa savdo muddat ayta olmaydi.
- **Manba:** kitob (operatsiya zanjiri) + oltin-ip (НЗП) + EP-IOT-047 v2 (Резка zanjir) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** MES, Savdo (muddat), Ishlab chiqarish reja

### EP-IOT-070 · "Папка №" (buyurtma papkasi) IoT yozuviga bog'lash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — har mashina ishi "Папка №" + buyurtma kodiga bog'lanadi. Kitob har ish "Папка №" (18660, 19868) bilan yuritiladi. Zavod papka raqami bilan ishlaydi; IoT papkaga ulanmasa buyurtmani topib bo'lmaydi.
- **Manba:** kitob (Папка № real raqamlar) + oltin-ip (buyurtma kuzatuvi) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** MES, Savdo, Costing, EP-IOT-013 v1 (MES bog'lash)

### EP-IOT-071 · Sensor signal yo'qolsa "noma'lum" vaqt ajratish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sensor uzilgan vaqt "ma'lumot yo'q" sifatida ajratiladi (uptime'ga ham, downtime'ga ham qo'shilmaydi) — halol hisob. "Ishladi" desak soxta yaxshi, "to'xtadi" desak soxta yomon. EP-IOT-023 v1 (sensor uzilishi) bilan bir.
- **Manba:** v2-A + EP-IOT-023 v1 (sensor uzilganda) + data-sifati prinsipi
- **action:** EVENT
- **⤳ Ta'sir:** OEE, Data sifati, EP-IOT-023 v1

### EP-IOT-072 · Mashina texnik xizmat tarixi qog'ozdan IoT'ga
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — mashina kartasida ta'mir tarixi (sana/ish/qism/xarajat) — eskirish va MTBF ko'rinadi. Zavodda "ремонтда" yozuvlari allaqachon bor. Qaysi mashina tez-tez sinadi → almashtirish/kapital ta'mir qarori. Q77 (barcha hujjat ERP'da).
- **Manba:** kitob ("ремонтда" mavjud yozuvlar) + Q77 (hujjatlar ERP'da) + EP-IOT-016 v1 (texnik xizmat) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Texnik xizmat, Moliya (CAPEX), EP-IOT-016 v1

### EP-IOT-073 · Texnik xizmat ehtiyot qismi Ombor bilan bog'lash
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ta'mirda ishlatilgan qism Ombordan chiqim + min. zaxira ogohlantirish (подшипник/ремень/нож). Ehtiyot qism hisobsiz ishlatilsa kerakli payt yo'q bo'ladi.
- **Manba:** oltin-ip (ombor-ta'mir bog'lanish) + EP-IOT-016 v1 + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** Ombor (ehtiyot qism), Texnik xizmat

### EP-IOT-074 · "Norma bajarilmadi" sababi avto tahlil
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — norma bajarilmaganda avto sabab tahlili (downtime breakdown) ko'rsatiladi: "3 soat иш йук + 1 soat сozlash". Operator "ulgurmadim" desa yetarli emas; obyektiv baho kerak. Kitob real sabablar (EP-IOT-036..039 v2) shu tahlilga material.
- **Manba:** kitob (real sabablar majmuasi) + EP-IOT-036..039/048 v2 (downtime/idle/setup) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** ShVB, HR (KPI), Norma, EP-IOT-052 v2 (adolatli bonus)

### EP-IOT-075 · Brak material qayta ishlatish (макулатура) kuzatish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — brak miqdori → makulatura/qayta ishlash sifatida yoziladi (to'liq material balansi). Brak material ham pul; qancha makulaturaga ketdi/qaytdi bilinmasa yo'qotish to'liq ko'rinmaydi.
- **Manba:** kitob (брак material) + oltin-ip (material balans) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Ombor, Moliya, Ekologiya hisoboti

### EP-IOT-076 · Mashina sertifikat/kalibrovka muddati eslatmasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har sensor/o'lchagich kalibrovka muddati + eslatma (tarozi/harorat/bosim). Kalibrlanmagan sensor noto'g'ri o'qiydi → barcha IoT raqami yolg'on. Sensor o'rnatilgach.
- **Manba:** v2-A + data-ishonchi prinsipi + egasi (sensorsiz)
- **action:** CRON
- **⤳ Ta'sir:** Sifat (data ishonchi), Texnik xizmat, EP-IOT-071 v2

### EP-IOT-077 · Kamera-AI operator himoya vositasi (qo'lqop/ko'zoynak) tekshirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kamera-AI himoya vositasini tekshiradi, yo'q bo'lsa ogohlantiradi/qayd etadi. Q57 (AI kamera: yuz + inspeksiya + real-time), Q56 (honadagi AI kamera nazorat qiladi). Mashina yonida jarohat xavfi yuqori. AI kamera = boshlang'ich (sensor emas).
- **Manba:** BARCHA_JAVOBLAR Q56/Q57 (AI kamera nazorat) + ShVB Y29 (inspeksiya) + v2-A
- **action:** AI
- **⤳ Ta'sir:** Xavfsizlik (Техника хавфсизлиги), HR, EP-IOT-011 (mezon)

### EP-IOT-078 · Kamera-AI xavfli zonada odam yo'qligini tekshirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kamera-AI xavfli zonani kuzatadi, odam kirsa darhol ogohlantiradi. Висечка/тигель barmoq kesishi mumkin; AI eng og'ir baxtsiz hodisa oldini oladi. Q57/Q89 (AI kamera real-time + holat kuzatish). AI kamera yo'nalishi joriy etilmoqda.
- **Manba:** BARCHA_JAVOBLAR Q57/Q89 (AI kamera real-time kuzatish) + v2-A
- **action:** AI
- **⤳ Ta'sir:** Xavfsizlik, Texnik xizmat (mashina to'xtatish), EP-IOT-077 v2

### EP-IOT-079 · Tungi smena (С) avto nazorat kuchaytirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — tungi smenada anomaliya/idle chegarasi pasaytiriladi + masofadan xabar (Telegram). Tunda nazoratchi kam; mashina bo'sh tursa/sinса hech kim ko'rmaydi. Q108 (kirish/chiqish vaqti nazorati) bilan bog'liq.
- **Manba:** kitob (С смена) + EP-IOT-028 (Telegram) + Q108 + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** ShVB, Telegram bot, HR (tungi smena)

### EP-IOT-080 · Mashina boshlashdan oldin "tayyorlik tekshiruvi" (checklist)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mashina boshlashdan oldin majburiy checklist (yog'/tozalik/qolip/material), to'ldirilmasa ish ochilmaydi. Tayyorgarliksiz boshlangani uchun to'xtash (EP-IOT-037/039 v2) ko'p; checklist xatoni boshida ushlaydi. Q16/Q95 (onboarding/checklist HR belgilaydi) modeliga mos.
- **Manba:** TPM amaliyot + kitob (qolip/material kechikish muammosi) + Q16/Q95 (checklist) + v2-A
- **action:** CREATE
- **⤳ Ta'sir:** Texnik xizmat (TPM), Sifat, ShVB, EP-IOT-050 v1 (checklist)

### EP-IOT-081 · Mashina samaradorligi GSD/ЦКП ShVB'ga uzatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — IoT ko'rsatkichlari (uptime/norма%/brak) avto ShVB GSD'ga (ishlab chiqarish bo'limi statistikasi) uzatiladi. Vizyon: har bo'lim o'z ЦКП/statistikasi bilan o'lchanadi; qo'lda emas, avto. Egasi: "mashina ЦКП IoT/MES'dan keyin avto". ShVB Y37 `iotGsd`.
- **Manba:** egasi (mashina ЦКП IoT/MES'dan avto) + ShVB Y37 (iotGsd) + karta-model (Vysotskiy 7) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** ShVB (Vysotskiy 7), karta-model, Statistik bo'lim, EP-IOT-003/014/025

### EP-IOT-082 · Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — bonusga ta'sir qiladi, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi) — adolatli. Sensor xatosi yoki "иш йук" (operator aybi emas) oylikka noto'g'ri ta'sir qilmasligi kerak. Q116 (uskuna xodimi hisoboti → oylik), karta-model GSD→bonus.
- **Manba:** karta-model (GSD→oylik adolatli) + BARCHA_JAVOBLAR Q116 + EP-IOT-074 v2 (sabab tahlili) + v2-A
- **action:** EVENT
- **⤳ Ta'sir:** HR (oylik/bonus), ShVB, karta-model, EP-IOT-059 v2 (muqobil ish hisobi)

### EP-IOT-083 · Ofset plastina (колиб/CTP) tayyorlik holati navbatda
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mashina navbatidagi har ish yonida "plastina/qolip tayyor" indikatori (preprint'dan). Plastina tayyor bo'lmasa mashina kutadi (EP-IOT-037 v2 qolip muammosi turkumi); navbatda holat ko'rinsa preprint oldindan tayyorlaydi.
- **Manba:** kitob (ofset plastina kutish muammosi) + EP-IOT-041 v2 (navbat) + EP-IOT-037 v2 + v2-A
- **action:** READ
- **⤳ Ta'sir:** Dizayn/Preprint, MES, Ishlab chiqarish reja

---

DONE: IoT — 83 (javoblangan 37, ochiq 46).
