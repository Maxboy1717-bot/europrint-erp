# EuroPrint ERP — Barcha Savol-Javoblar (To'liq Arxiv)

**Tayyorlangan:** 2026-04-12  |  3 modul bo'yicha to'liq javoblar

---

## MUNDARIJA

1. [🖥️ POS Monitor Moduli](#pos) — 50 savol
2. [👥 HR / Rekruter Moduli](#hr) — 200 savol
3. [🏢 Orgsxema Moduli](#org) — Tashkiliy tuzilma qarorlari

---

<a name="pos"></a>

# 🖥️ POS MONITOR MODULI
*50 savol asosida to'liq talablar*

## ⚙️ Umumiy Texnik Arxitektura

**1. Stack va joylashuv**
> ✅ NestJS + PostgreSQL. ERP ichida modul (alohida server yo'q). ERP DB ning bir qismi.

**2. Autentifikatsiya**
> ✅ SSO — ERP login/JWT token ulashish (yagona kirish)

**3. Qurilma**
> ✅ Responsive web — PC + planshet + smartphone. Alohida native app yo'q.

**4. Til**
> ✅ O'zbek + Rus (foydalanuvchi tanlaydi)

**5. Bir vaqtda terminallar**
> ✅ 30+ terminal bir vaqtda ishlaydi

**6. Audit log**
> ✅ To'liq: har bir klik, har bir o'zgarish, IP manzil, timestamp

**7. Data retention**
> ✅ 7 yil (O'zbekiston soliq talabi)

**8. Offline rejim**
> ✅ To'liq offline rejim ishlaydi (internet o'chsa ham)

**9. Xato xabarlari**
> ✅ Kichik xato → toast; Katta xato → modal dialog


## 👤 Foydalanuvchilar va Rollar

**10. Kirish tizimi**
> ✅ ERP login bilan kiradi, rol ERP dan avtomatik tortib olinadi

**11. Smena boshqaruvi**
> ✅ Kerak emas — faqat audit log (kim qachon kirdi/chiqdi)

**12. Bo'lim ombori chiqim huquqi**
> ✅ Faqat o'sha bo'lim xodimlari chiqim qila oladi

**13. Bo'limlar soni**
> ✅ 30+ bo'lim (oshxona, HR, dizayn, IT, har bir sex...)

**14. Xodim bir necha bo'limdan olishi**
> ✅ Ha — bir necha bo'lim omboridan ola oladi (HR tomonidan sozlanadi)


## 📷 Barcode va AI Kamera

**15. Barcode format**
> ✅ EAN-13 (standart savdo barkodi) + Code-128 partiya uchun

**16. Skanerlash texnologiyasi**
> ✅ Ikkalasi: Dedicated scanner (USB/Bluetooth) + AI kamera (ZXing.js brauzerda)

**17. AI kamera bilan barcode o'qish**
> ✅ ZXing.js (brauzer) + OpenCV (server fallback noaniq barkodlar uchun)

**18. Skanerlashda material topilmasa**
> ✅ Toast xato + Qo'lda qidirish + Yangi kartochka yaratish + Admin Telegram xabar

**19. Label chop etish**
> ✅ Avtomatik (EXTERNAL_IN tasdiqlanganda) + Qo'lda reprint; Format: ZPL/EPL/PDF

**20. Kamera qabul paytida**
> ✅ AI kameraga ulanadi — shtrix kodi orqali o'qiydi


## 📦 Harakat Turlari (Movement Types)

**21. EXTERNAL_IN — Tashqi kirim**
> ✅ 5 bosqich: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL

**22. EXTERNAL_OUT — Tashqi chiqim**
> ✅ FAQAT tayyor mahsulot ombori. Tasdiq: Ombor menejer + Moliya + AI (to'lov tekshiruv)

**23. INTERNAL_ISSUE — Bo'limga berish**
> ✅ Ombor menejer 1 imzo bilan tasdiqlaydi

**24. INTERNAL_RETURN — Qaytarish**
> ✅ Sabab majburiy. Tasdiq kerak emas.

**25. INTERNAL_TRANSFER — Ombor ko'chirish**
> ✅ Bir xil tip = tezkor (tasdiqlash yo'q). Boshqa tip = menejer tasdiq.

**26. DAMAGE — Zarar akti**
> ✅ QC moduliga avtomatik o'tadi

**27. Harakatni bekor qilish**
> ✅ Faqat DRAFT holatda. Tasdiqlangan — teskari harakat yoziladi.

**28. Bitta harakatda materiallar**
> ✅ Cheksiz material bo'lishi mumkin


## 🏪 Ombor Tuzilishi

**29. Ombor turlari**
> ✅ MAIN, QUARANTINE, PRODUCTION_*, FINISHED_GOODS, DEPARTMENT_* (30+), QC, DEFECTIVE

**30. Karantin ombori**
> ✅ Barcha EXTERNAL_IN kirimlar avval karantinga. QC tasdiqlasa → asosiy omborga.

**31. QC 3 qaror**
> ✅ QABUL → asosiy ombor | REWORK → MES | CHIQARISH → ta'minotchiga qaytish

**32. Ko'chma ombor**
> ✅ Yo'q — faqat doimiy omborlar

**33. Bin location**
> ✅ Freeform (operator o'zi yozadi: A-3-12, Tokcha-5, istalgan matn)

**34. Tayyor mahsulot POS da**
> ✅ Ha — bir xil POS tizimida boshqariladi


## 💰 Narx va Stok

**35. Narxlash usuli**
> ✅ FIFO narxi (partiya narxi bo'yicha)

**36. Valyuta**
> ✅ Har qanday valyuta — qaysi valyutada xarajat bo'lsa o'sha

**37. FIFO/FEFO qoidasi**
> ✅ Muddatli → FEFO (muddati qisqa birinchi). Muddatsiz → FIFO (eski kelgan birinchi)

**38. Minus saldo**
> ✅ Aktivlar → TO'LIQ BLOK. Iste'mol materiallar → OGOHLANTIRISH + ruxsat

**39. Stok hisob**
> ✅ Real-time (har harakat darhol PostgreSQL ga yoziladi)

**40. Inventar pasporti**
> ✅ Faqat tashqi kirimda (EXTERNAL_IN)


## 📄 Hujjatlar va Buxgalteriya

**41. Har bir harakatda hujjatlar**
> ✅ Harakat akti (PDF) + Hisob-faktura invoice (alohida PDF)

**42. PDF da nima ko'rinadi**
> ✅ Harakat raqami, sana, materiallar ro'yxati, kim topshirdi/qabul qildi, kompaniya rekvizitlari

**43. GL posting**
> ✅ Avtomatik — har harakatda Debit/Credit yoziladi (5-bosqich: AI hisoblaydi)

**44. 1C integratsiya**
> ✅ Yo'q — ERP moliya moduli yetarli

**45. Soliq/fiskal hisobot**
> ✅ Faqat ichki hisobot

**46. Amortizatsiya**
> ✅ FI moduli hal qiladi (POS faqat inventar kuzatadi)


## 👷 Xodim Moddiy Javobgarlik

**47. Xodim balansini ko'rishi**
> ✅ Ha — mobil/web orqali 'Mening inventarim' sahifasidan ko'radi

**48. Iste'mol material qaytarish**
> ✅ Material turiga qarab (iste'mol → stokka, aktiv → QC ga)

**49. Xodim chiqishda inventar**
> ✅ Barcha narsani qaytarishi shart, keyin HR access beradi

**50. Bo'lim so'rov workflow**
> ✅ Xodim → Bo'lim menejer tasdiq → Ombor xodimi beradi → Ledger DEBIT

**51. Ichki so'rov (request)**
> ✅ Ha, tasdiqlanadigan so'rov majburiy


## 🔢 Inventarizatsiya

**52. O'tkazish vaqti**
> ✅ Tunda yoki dam olish kunida (ish to'xtatilmaydi)

**53. GL posting**
> ✅ Avtomatik — lekin moliya bo'limi tekshiradi va tasdiqlaydi

**54. So'rov navbati**
> ✅ FIFO — birinchi kelgan so'rov birinchi bajariladi


## 📊 Hisobotlar va Integratsiyalar

**55. Hisobot formatlari**
> ✅ PDF + Excel/CSV

**56. POS dan hisobotlar**
> ✅ Harakat jurnali, xodim balansi, ombor qoldiqlari, inventarizatsiya akti, GL, ABC tahlil

**57. Analytics kim uchun**
> ✅ AI (rejalashtirish) + Direktor (strategik) + Moliya (oylik) + Ombor menejer (kunlik)

**58. ERP integratsiya**
> ✅ To'liq: MM, FI, MES, HR, QC — Real-time REST API

**59. Telegram mini-app**
> ✅ To'liq Telegram Mini App — barcode skan, so'rov, tarix, tasdiqlash

**60. Eng muhim funksiya birinchi**
> ✅ Barcode skanerlash + EXTERNAL_IN/OUT harakatlar (MVP 1-navbat)


*Jami: 60 ta javob*

---

<a name="hr"></a>

# 👥 HR / REKRUTER MODULI (210 Savol)

## 🔍 Rekrutment va vakansiyalar (Q1–Q40)

**Q1. EuroPrint da HR bo'limi tuzilmasi qanday?**
> ✅ Hozircha HR bo'limi yo'q / yangi tashkil etilmoqda

**Q2. EuroPrint da hozir xodimlar soni qancha?**
> ✅ 400 ta

**Q3. Rekruter bo'limi uchun asosiy muammo nima?**
> ✅ Hammasi va siz savollarni C:\Users\AzzA\Downloads\Telegram Desktop\HR va C:\Users\AzzA\Downloads\Telegram Desktop\Новая папка dan olib berishingiz kerak

**Q4. Hujjatda yozilgan vakansiya topish standart muddatlari quyidagicha: Oddiy lavozim — 15 ish kuni, Murakkab — 25 kun, Top-menejment — 40 kun. ERP tizimida bu muddatlar avtomatik nazorat qilinsinmi?**
> ✅ 1-2 va muddatlar o'zgarishi mumkin

**Q5. Hujjatda vakansiya e'lon tarqatish kanallari ko'rsatilgan: LinkedIn, HH.uz, UZjob, My Job, Telegram kanallari. ERP tizim bu kanallarni qanday boshqarsin?**
> ✅ 1 Har bir kanalga alohida status (e'lon berildi / berilmadi) ⏎  2 Avtomatik post — Telegram bot orqali yuborish

**Q6. Hujjatda yozilgan: nomzod rezyumeni 1 kun ichida ko'rib chiqish, suhbat 2 kun, offer 3 kun. Bu muddatlar o'tganda tizim nima qilsin?**
> ✅ Buni AI orqali qilish kerak rekruter ishlarini 80 % AI bajaradi, nomzod telegram orqali 2 bosqichda intervyu qiladi 3 bosqichga o'tganda kompaniyada rahbar bilan yoki masul xodim bilan intervyu jonli bo'lib o'tadi, Gemini LIVE api kod olinib erp tizimda rekruter AI nomzodga link yuboradi bu link har bir nomzod uchun har hil bo'ladi, Qaysi lavozim yoki bo'limga kirib turgan bo'lsa o'sha bo'yicha AI live vidoe orqali intervyu oladi bu 2 bosqich 1 bosqich rezyume oladi har bir lavozim uchun alohida va har xil rezyume olishi kerak sabab lavozimga qarab savol javoblar o'zgaradi lekin standart savollar bo'ladi hammasida, AI faqat javoblarga qarab emas balki nomzodni o'zini tutishi va xolatini ham baholashi kerak bu juda muhim, va ishga olinmagan nomzod rekruter arxivida saqlanishi kerak butun boshli baza bo'lib, AI shunda rekruterni ishlarini oson qiladi

**Q7. Gemini LIVE AI intervyu tizimi uchun: 1-bosqich (rezyume) Telegram bot orqali bo'lsin. 2-bosqich (live video) uchun qanday platforma kerak?**
> ✅ ERP ichida o'zimizning video sahifa (WebRTC)

**Q8. Hujjatda testlar ko'rsatilgan: Tool Test, IQ Test, Liderlik (Origin) testi, Replication testi. Bu testlar qanday o'tkazilsin?**
> ✅ ERP ichida online test moduli ⏎  2 AI orqali adaptiv test (savol javobga qarab o'zgaradi)  3 Telegram bot orqali test (link yuboriladi)

**Q9. Hujjatda 'surishtirish' bo'limi bor: ota-ona, mahalla, sobiq ish joylari bo'yicha ma'lumot to'plash. ERP bu jarayonni qanday boshqarsin?**
> ✅ Rekruter to'ldiradi + forma bor (structured form)

**Q10. Nomzodlar arxivi haqida: ishga olinmagan nomzodlar bazada saqlansin. Bu arxivni qanday ishlatmoqchisiz?**
> ✅ Ikkalasi ham (AI + qo'lda qidirish)

**Q11. Hujjatda nomzod portret (ideal xodim kartinasi) yaratish ko'rsatilgan. Bu portretni kim yaratadi?**
> ✅ Tayyor shablon — tanlash kerak

**Q12. Hujjatda 'employer branding' (ish beruvchi brendi) ko'rsatilgan. ERP qanday yordam bersin?**
> ✅ 1-2-3 bo'lishi kerak yani erp dan tashqi bo'lgan web saytda bo'ladi

**Q13. Hujjatda nomzod maxfiyligi ko'rsatilgan: nomzod ma'lumotlari raqobatchilarga ketmasligi. ERP da kirish huquqlari qanday bo'lsin?**
> ✅ Role-based: Rekruter > HR Menejer > Direktor

**Q14. Adaptatsiya bo'limi: yangi xodim qabul qilingandan keyin adaptatsiya jarayoni qanday boshlansin?**
> ✅ 1-4 bo'ladi

**Q15. Adaptatsiya haftalik baholash (1-5 shkala, 5 ko'rsatkich). Bu bahoni kim beradi?**
> ✅ 2-4 bo'ladi

**Q16. ERP tizimida xodimning ish joyiga kirishi (onboarding): hujjatlar, buyruqlar, joy ko'rsatish. Bular qanday ro'yxatdan o'tkazilsin?**
> ✅ Checklist — HR belgilaydi (passport, INPS, shartnoma — topshirildi/yo'q)

**Q17. ERP fronted (UI) qismi haqida: rekruter paneli qanday ko'rinishda bo'lsin?**
> ✅ Hammasi kerak

**Q18. ERP frontend texnologiyasi: frontend qismni qaysi texnologiyada yozish kerak?**
> ✅ Nima ishlatilayotgan bo'lsa shu (mavjud stack)

**Q19. Frontend da allaqachon mavjud: RecruitingKanban.tsx, AIInterviewPage.tsx, Adaptation.tsx, HRAIDashboard.tsx. Bularni qayta yozamizmi yoki ustiga qo'shamizmi?**
> ✅ Mavjudiga qo'shimcha funksiyalar qo'shamiz

**Q20. Hujjatda 'nomzodlar oqimini yaratish' uchun kanallar: LinkedIn, HH.uz, UZjob, MyJob, Telegram. ERP da e'lon yaratganda qaysi kanalga avvaldan link ketsin?**
> ✅ Barcha kanallarga bir vaqtda

**Q21. Gemini LIVE AI video intervyu: AI qaysi tilda gaplashsin?**
> ✅ 3 tilda: O'zbek + Rus + Ingliz (nomzod tanlaydi)

**Q22. AI nomzodning o'zini tutishini baholaydi (yuz ifodasi, gavda holati). Buning uchun kamera ruxsati talab qilinadi. Nomzod kamera berishdan bosh tortsa nima bo'lsin?**
> ✅ 2-3 yani 3 marta qayta imkondan keyin intervty bekor qilingsiz

**Q23. Hujjatda 'mahsuldorlik bo'yicha intervyu' ko'rsatilgan: nomzodning o'tmishdagi natijalari faktlar bilan tekshiriladi. AI bu bosqichda qanday savol bersin?**
> ✅ Hammasi

**Q24. Hujjatda ko'rsatilgan testlar: Tool Test (kasbiy asbob-uskunalar bilimi), IQ Test, Liderlik testi, Replication testi. Bu testlarni hozir ERP da bor mi yoki yangidan yozamizmi?**
> ✅ Yangidan yozamiz — hujjat asosida

**Q25. Hujjatda 'tavsiyanomalар olish' ko'rsatilgan: sobiq rahbarlardan nomzod haqida ma'lumot. ERP bu jarayonni qanday avtomatlashtirilsin?**
> ✅ Rekruter qo'lda yozadi (sobiq rahbar nomi, telefon, nima dedi)

**Q26. AI intervyu natijasini rekruterga qanday taqdim etsin?**
> ✅ Hammasi kerak ekan

**Q27. Hujjatda 'ish beruvchi brendini tarqatish' va 'kompaniya PR-saytini shakllantirish' ko'rsatilgan. Tashqi sayt careers.europrint.uz bo'ladimi?**
> ✅ Mavjud europrint.uz saytga bo'lim qo'shamiz

**Q28. Hujjatda oylik statistik hisobotlar ko'rsatilgan: nechta nomzod, nechta intervyu, nechta qabul qilindi. Bu hisobotlar qayerda ko'rinsin?**
> ✅ 4 va alohida rekruter dashbordi bo'lsin

**Q29. Hujjatda inspeksiya bo'limi bor: Offset, Flexo, Ombor, Ofis. Inspeksiya moduli frontend da qanday ko'rinishda bo'lsin?**
> ✅ Hammasi: Checklist + Foto + Xarita

**Q30. Hujjatda rag'batlantirish bo'limi bor: 3 qismli taqdimнoma (yutuq + o'lchovdagi dalil + kompaniyaga ta'sir). Bu jarayonni kim boshlaydi?**
> ✅ Mentor + bo'lim boshlig'i + HR

**Q31. 400 xodim bilan 'xodim yo'li' (employee journey): har bir xodimning lavozimga kirganidan boshlab karriera tarixini kuzatish. Bu kerakmi?**
> ✅ Ha, to'liq timeline: qabul > adaptatsiya > baholash > lavozim o'zgarishi

**Q32. Hujjatda 'kichik lavozim papkasi' tizimi ko'rsatilgan: har bir lavozim uchun papka (hujjatlar, yo'riqnomalar, orgpolitikalar). ERP da bu qanday bo'lsin?**
> ✅ Har bir lavozim uchun ERP da virtual papka: hujjatlar, video, testlar

**Q33. Hujjatda 'Bitrix24 bilan sinxronlashtirish' ko'rsatilgan. ERP bilan Bitrix24 qanday ishlaydi?**
> ✅ Bitrix24 o'rniga to'liq ERP ishlatiladi (Bitrix24 olib tashlanadi)

**Q34. Hujjatda rekruter xorijiy bo'limi bor: xorijdan kelgan nomzodlar uchun alohida jarayon. Bu qanday farq qilsin?**
> ✅ Ikkalasi ham (relocation + alohida pipeline)

**Q35. Hujjatda 'kechiktirmay qidiruv' ko'rsatilgan: navbatdan tashqari tezkor yollash (urgent hiring). Bu holat qanday belgilansin?**
> ✅ Hammasi: URGENT teg + qisqa muddat + Telegram xabar

**Q36. AI intervyu uchun Gemini LIVE API: bu API hali beta/experimental. Agar API ishlamay qolsa fallback nima bo'lsin?**
> ✅ Intervyu keyinroqqa qoldiriladi (reschedule)

**Q37. 400 xodim bor, yangi yollash bo'limi noldan qurilmoqda. Birinchi navbatda (MVP) qaysi funksiyalar ishlashi kerak?**
> ✅ Hammasi navbat bilan

**Q38. Hujjatda 'kadrlar hisobi' bo'limi bor: xodim keldi/ketdi hisobi. ERP da xodim ishdan ketganda nima bo'lsin?**
> ✅ Hammasi: Exit interview + Checklist + Arxiv

**Q39. ERP tizimi mobile versiyasi: rekruter telefon/planshetten ishlayolsin. Qanday bo'lsin?**
> ✅ Hozircha faqat desktop (mobil keyinroq)

**Q40. Hujjatda 'etika bo'limi' va 'tartib-qoidalar' ko'rsatilgan. Xodim tartib buzsa tizimda qanday qayd etilsin?**
> ✅ Hammasi: jurnal + bosqichli jazo + xodim ko'radi


## 🤖 AI intervyu va Telegram (Q41–Q80)

**Q41. Hujjatda 'kommunikatsiya' bo'limi bor: xodimlar ichki muloqot. ERP da ichki xabar (internal messaging) bo'lsinmi?**
> ✅ Ha, ERP ichida chat: xodimdan xodimga xabar

**Q42. Rekruter va HR panel: tizimga kirish qanday bo'lsin?**
> ✅ Mavjud ERP login tizimi yetarli, o'zgartirmaymiz

**Q43. Hujjatda 'maxfiy siyosatlar' ko'rsatilgan: ba'zi lavozim hujjatlari maxfiy. ERP da maxfiy hujjatlarni kim ko'radi?**
> ✅ Rol-asosli: har bir hujjatga alohida ruxsat

**Q44. Hujjatda 'statistika' bo'limi bor (Abdullayev bo'limi). Qanday HR statistikalar kerak?**
> ✅ Hammasi

**Q45. Hujjatda 'reception' bo'limi bor: tashrif buyuruvchilar, qo'ng'iroqlar, pochta. Bu ERP da kerakmi?**
> ✅ Ha, kiruvchi qo'ng'iroqlar va tashrif jurnali

**Q46. Hujjatda 'raqamlashtirish' ko'rsatilgan: barcha lavozim hujjatlarini skanerlab elektron shaklda saqlash. Hujjatlarni qayerda saqlash kerak?**
> ✅ ERP serverida (o'zimizning server)

**Q47. Hujjatda 'til siyosati' ko'rsatilgan: hujjatlar qaysi tilda yozilishi kerak. ERP interfeysi qaysi tilda bo'lsin?**
> ✅ O'zbek + Rus (ikki tilli)

**Q48. Hujjatda choraklik audit jadvali ko'rsatilgan (yanvar, aprel, iyul, oktyabr). Audit natijalari kimga yetkazilsin?**
> ✅ Direktor + HR menejer

**Q49. EuroPrint printing kompaniyasi. Offset va Flexo bo'limlari bor. Inspeksiyada qaysi bo'lim birinchi navbatda nazorat qilinsin?**
> ✅ Hammasi teng ustuvor (rotatsiya bilan)

**Q50. 50-savol! Umumiy savol: HR tizimi uchun Telegram bot bo'lsinmi? Va bu bot kim uchun?**
> ✅ hammasi uchun va alohida bo'lishi kerak erp ga ulangan bo'lib

**Q51. Hujjatda 'dublikaт papkalarning oldini olish' ko'rsatilgan. ERP da bir xodim uchun bir nechta profil yaratilmasligi uchun qanday tekshirish bo'lsin?**
> ✅ Hammasi: pasport + INPS + telefon

**Q52. Hujjatda 'vakolatlar va javobgarlik chegaralari' ko'rsatilgan. Qaysi lavozim qanday huquqqa ega bo'lsin?**
> ✅ Hammasi\

**Q53. Gemini AI intervyu yozuvlari: video/audio yozib saqlash kerakmi?**
> ✅ Faqat transkripsiya saqlansin (video emas)

**Q54. Hujjatda 'yagona standart' ko'rsatilgan: barcha bo'limlar uchun bir xil lavozim papka formati. ERP da shablon tizimi qanday bo'lsin?**
> ✅ Ikkalasi (global + bo'limga xos moslashish)

**Q55. Hujjatda 'yangi siyosatlarni kiritish tartibi' ko'rsatilgan. Yangi orgpolitika tasdiqlanganda barcha tegishli xodimlar xabardor qilinsinmi?**
> ✅ Ikkalasi: Telegram xabar + ERP tasdiqlash

**Q56. Hujjatda 'ish joylari ta'minlash' ko'rsatilgan (2-bo'lim): kompyuter, stol, forma, kalit, kirish karta. Yangi xodim uchun bu narsalar tayyor ekanligini kim nazorat qilsin?**
> ✅ 3 va honadagi AI kamera nazorat qiladi

**Q57. Kamera AI integratsiyasi: mavjud ERP da CameraAIAnalytics.tsx sahifasi bor. HR bilan qanday bog'lansin?**
> ✅ Hammasi: yuz qo'shish + inspeksiya + real-time davomat

**Q58. ERP da mavjud 'PayrollAutomation.tsx' (ish haqi moduli). Rekruter offer qilganda ish haqi ma'lumoti qayerdan olinsin?**
> ✅ Offer da belgilangan maosh avtomatik Payroll ga o'tsin

**Q59. Hujjatda 'pochta jo'natmalari' bo'limi bor. Kompaniya nomidan xatlar, hujjatlar, tashqi muloqot. Bu ERP da qanday bo'lsin?**
> ✅ Email + Telegram (ikkalasi ham)

**Q60. Rekruter ishini 80% AI bajaradi dedingiz. Qolgan 20% rekruter qo'lda nima qilsin?**
> ✅ Hammasini

**Q61. AI 1-bosqich: Telegram bot nomzoddan rezyume oladi. Bu rezyume qanday formatda bo'lsin?**
> ✅ Ikkalasi: avval fayl so'raydi, keyin qo'shimcha savollar

**Q62. Har bir lavozim uchun alohida AI savol banki kerak. Masalan: offset bosuvchi uchun boshqa savollar, buxgalter uchun boshqa. Bu savol bankini kim to'ldiradi?**
> ✅ 1-va 2 to'liq

**Q63. Hujjatda 'kadrlar bo'limlari' ko'rsatilgan: EuroPrint da nechtа bo'lim bor? (Offset, Flexo, Ombor, Ofis va boshqalar)**
> ✅ orgsxemada bor bo'ladi barcha bo'limlar

**Q64. Xodim o'z profilini ERP da ko'rishi va ma'lumotlarini yangilashini xohlaysizmi?**
> ✅ Ha, lekin faqat ko'radi, HR ruxsatisiz o'zgartira olmaydi

**Q65. Hujjatda 'succession planning' (kadrlar zaxirasi) mavjud ERP sahifasida bor: HRSuccessionPlanning.tsx. Bu modul qanday ishlash kerak?**
> ✅ Har bir muhim lavozim uchun zaxira nomzod belgilanadi

**Q66. AI video intervyuda nomzodning yuz ifodasini tahlil qilish: qaysi ma'lumotlar baholansin?**
> ✅ 1-2 va qo'shimchalari bir

**Q67. Hujjatda 'tezkor nomzod topish kanallar' ko'rsatilgan: talaba bazalari, eski xodimlar. Boomerang hire (eski xodimni qayta yollash) bo'lsinmi?**
> ✅ Ha + avtomatik: yangi vakansiya ochilganda eski xodimga Telegram xabar

**Q68. Hujjatda 'xodim nomzod ko'rsatishi' (referral) tizimi haqida gap bor. Xodimlar o'z do'stlarini tavsiya qilsa bonus berilsinmi?**
> ✅ Ha, tavsiya qilingan nomzod qabul qilinsa xodimga bonus (pul/ta'til)

**Q69. Hujjatda inspeksiya tekshiruv jarayoni bor. Inspektor topilgan qoidabuzarlikni kim ko'rishi mumkin?**
> ✅ Inspektor + HR menejer + Bo'lim boshlig'i (o'z bo'limi)

**Q70. ERP da xodimlarning KPI tizimi bor. HR baholash KPI bilan bog'lansinmi?**
> ✅ KPI alohida modul, HR bilan bog'lamymiz

**Q71. Hujjatda LMS (o'quv tizimi) bog'liqligi bor: xodim lavozimga kirishi uchun testlardan o'tishi kerak. ERP LMS bilan qanday bog'lansin?**
> ✅ O'zi LMS yani o'qitish tizimi bor bu erpda buni integratsiya qilish kerak

**Q72. Hujjatda ko'rsatilgan 'amaliy topshiriqlar' (praktik vazifalar) rekruter va adaptatsiya menejeri uchun. ERP da xodim amaliy topshiriq topshirishini qanday amalga oshirsin?**
> ✅ Mentor tasdiqlaydi (qog'oz emas, ERP da belgilaydi)

**Q73. Hujjatda 'arxivlash tizimi' ko'rsatilgan: lavozim papkalarini arxivga o'tkazish muddati. Arxiv qanday muddatda bo'lsin?**
> ✅ Lavozim turiga qarab: rahbar — 10 yil, ishchi — 3 yil

**Q74. Hujjatda 'elektron kommunikatsiyalar' bo'limi bor. Xodimlarning korporativ email/telefon ishlatishini ERP nazorat qilsinmi?**
> ✅ Ha, korporativ email/telefon ERP da ro'yxatga olinsin

**Q75. 75-savol! HR CAPITAL kurs materiallari (Новая папка PDF larida) ERP o'quv bazasiga yuklansinmi?**
> ✅ Bu faqat erp tizimini shu asosda qurish uchun kerak

**Q76. Nomzod 2-bosqich AI video intervyuni tugatganida tizim nima qilsin?**
> ✅ Hammasi: nomzodga xabar + rekruterga xabar + 48 soat muddat

**Q77. Hujjatda 'sinxronlashtirish' ko'rsatilgan: elektron va qog'oz nusxa mos kelishi. Hozir qog'oz hujjatlar digitallashtirilganmi?**
> ✅ Hamma hujjatlar erp ichida bo'ladi va pechat qilish imkoni bo'lishi kerak, bu hujjat agar rahbar imzosini talab qilsa har kuni malum vaqtda rahbar imzolaganini yoki imzolamaganini belgilashi kerak imzolamagan bo'lsa sabablarini aytishi kerak, Butun tizimdagi barcha hujjatlar erp orqali yoziladi va saqlanadi hujjat yozgan xodim xujjat taqdiri nima bo'lganini belgilashi kerak va sabablari bo'lsa yozishi kerak

**Q78. Hujjat imzo tizimi: rahbar elektron imzo qo'yadimi yoki fizik imzo skanerlanadimi?**
> ✅ Rahbar fizik imzo qo'yganda va uni yozgan xodim qabul qilganda rahbar imzoladi deb belgilashi yoki umuman xujjat statusini belgilashi kerak, xodim hujjat statusini belgilasa kim imzo qo'ygan bo'lsa telegram bot va erp orqali imzolagan xodimga boradi agar to'g'ri bo'lsa tasdiqlaydi to'g'ri bo'lmasa yo'q, Hujjatlar hammasi orgsxema bo'yicha yurishi kerak vetikal va gorizontal xolatda

**Q79. Hujjat org-sxema bo'yicha yurishi: vertikal (yuqoridan pastga) va gorizontal (bo'limdan bo'limga). Qanday misol bilan tushuntirishingiz mumkin?**
> ✅ masalan ishlab chiqarish xodimi avans uchun ariza yozadi ariza birinchi vertikal yuradi keyin gorizontal yuradi, umuman hujjatlar sakramasligi kerak hammasi

**Q80. Hujjat workflow: Ishchi avans ariza yozadi. Qanday ketma-ketlikda borsin?**
> ✅ Org-sxemadan avtomatik aniqlansin (tizim o'zi chizadi)


## 👤 Xodim profili va onboarding (Q81–Q120)

**Q81. Hujjat workflow engine: org-sxemadan avtomatik routing uchun qaysi qoida asos bo'lsin?**
> ✅ Hammasi konfiguratsiya qilinadi: Admin panel dan yo'l chiziladi

**Q82. Hujjat tasdiqlanmasa (rahbar 'Yo'q' desa): nomzodga yoki xodimga qaytayotganda izoh majburiymi?**
> ✅ 1 va 4 bosqich

**Q83. Hujjat muzey arxivida: eski tasdiqlangan hujjatlar o'chirilmasin. Hujjat tahrirlash mumkinmi?**
> ✅ Yo'q, tasdiqlangan hujjat o'zgartirib bo'lmaydi (immutable)

**Q84. Hujjatda 'kompaniya tartib-qoidalari' (etika) bo'limi bor. Xodim tartibga kirganligini imzolashi kerakmi?**
> ✅ Hammasi: onboarding + yillik + o'zgarishda

**Q85. ERP rekruter dashboard da qanday ko'rsatkichlar birinchi ko'rinishi kerak?**
> ✅ Hammasi

**Q86. AI intervyu uchun alohida link yaratiladi. Link qancha muddatga amal qilsin?**
> ✅ 24 soat (1 kun)

**Q87. Nomzod AI intervyudan 'o'tmadi' (past ball oldi). Tizim nima qilsin?**
> ✅ Rekruter ko'radi, keyin arxiv + xabar + 6 oy muddat

**Q88. Hujjatda kadrlar bo'limi uchun 'tabel' (davomat jurnali) ko'rsatilgan. Tabel hozir qanday yuritilmoqda?**
> ✅ Hozir exzelda turniket orqali olinadi, erp ishga tushganda barcha davomatlar ai kamera orqali olinadi, hattoki xodiim kayfiyati xolati va sog'lig'ini ham AI kuzatib hisobot berishi kerak

**Q89. AI kamera xodim sog'lig'ini kuzatadi. Bu juda muhim xususiyat. Qaysi holatlar aniqlanganda HR ga xabar ketsin?**
> ✅ Hammasi

**Q90. 90-savol! Juda muhim: ERP tizimining asosiy dushmanlari nima? (Xodimlar tizimga qarshilik ko'rsatishi mumkin)**
> ✅ Barcha risklar bor, lekin boshlaymiz

**Q91. Hujjatda 'sinov muddati' (probation period) ko'rsatilgan. ERP sinov muddatini qanday kuzatsin?**
> ✅ Hammasi: eslatma + baholash + avtomatik o'tish

**Q92. Xodim lavozimi o'zgarganda (promotion/transfer) ERP da nima yangilansin?**
> ✅ Hammasi va hr/career-path o'tib so'ng keyingi bosqichlarga o'tishi kerak

**Q93. Career path (kariyer yo'li): xodim qanday o'sishi mumkinligini ko'rsinmi?**
> ✅ Hammasi: xodim ko'radi + HR rejalashtiradi + bo'lim kariyer narvoni

**Q94. ERP da xodimlar org-sxema ko'rinishi: mavjud OrgChartPage.tsx sahifasi bor. HR bilan qanday bog'lansin?**
> ✅ Hammasi: bo'sh lavozim + papka + xodim kartochkasi

**Q95. Hujjatda 'lavozimga kirish' bo'limi bor: xodim birinchi kuni nima qilishi kerak. Bu 'birinchi kun' checklisti ERP da bo'lsinmi?**
> ✅ Hammasi: Telegram + ERP + Mentor tasdiqlash

**Q96. ERP da ta'til boshqaruvi mavjud (LeaveModule). Ta'til HR tizimi bilan qanday bog'lansin?**
> ✅ Hammasi

**Q97. Hujjatda inspeksiya uchun 'chek-list shablonlari' ko'rsatilgan. Har bir bo'lim uchun alohida checklist kerakmi?**
> ✅ 1-2 va xar bir bo'lim va xona ideal rasmi orqali AI ham nazorat qiladi bo'lim va xonalarni

**Q98. Bo'lim ideal rasm (reference image) tizimi: har bir xona/bo'limning 'ideal holati' fotosurati ERP da saqlanadi. AI hozirgi holatni ideal bilan taqqoslaydi. Bu taqqoslash qachon bo'lsin?**
> ✅ Har 2 soatda: kamera suratga oladi va taqqoslaydi

**Q99. Rekruter uchun AI yordamchi: rekruter vakansiya yozayotganda AI matn taklif qilsinmi?**
> ✅ 2-4 to'g'ri rekruter tasdiqlash va taxrirlashi mumkin, bu asosan HR  brend bilan shug'ullanadigan marketing bo'limga tegishli bo'ladi, Rekruter barcha vakansiyalar bo'yicha HR brendga topshiriq beradi

**Q100. 100-savol! Katta savol: Barcha shu 99 ta savol bo'yicha eng muhim 3 ta narsa nima, birinchi navbatda nima yozilishi kerak?**
> ✅ Hammasi parallel, komandaga bo'lib beriladi

**Q101. Telegram bot arxitekturasi: har bir maqsad uchun alohida bot dedingiz. Botlarning nomi/maqsadi:**
> ✅ Erp ichidagi har bir modul uichun dedim bu botlarni

**Q102. HR moduli uchun Telegram bot: qanday funksiyalar bo'lsin?**
> ✅ Hammasi

**Q103. ERP tizimining ranglar sxemasi va dizayni: HR bo'limi qanday ko'rinishda bo'lsin?**
> ✅ Mavjud ERP dizayniga mos (bir xil rang sxema)

**Q104. Hujjat chop etish (pechat) funksiyasi: qanday hujjatlar chop etilishi kerak?**
> ✅ Har qanday hujjat

**Q105. ERP da xodim profilida nima ko'rinishi kerak?**
> ✅ Hozirgi xolatiga qo'shimchalar qilish kerak o'zgartirmasdan

**Q106. Mavjud EmployeeProfile.tsx sahifasi bor. Qanday qo'shimchalar qilish kerak?**
> ✅ Hammasi bu huddi davlatda insondi qanday malumotlari bo'lsa o'shalar

**Q107. Hujjat muallifi kimligini ko'rish: har bir hujjat kimning nomi bilan bog'langan bo'lsin?**
> ✅ To'liq versiya tarixi: kim, qachon, nima o'zgartirdi

**Q108. AI kamera va yuz tanish tizimi: xodim ish joyiga kirish uchun yuz skaneri ishlatilsinmi?**
> ✅ birinchi xodim kompaniya xudidiga kirgan vaqti va ish joyiga kelgan vaqti bo'lishi kerak, har bir kirish bot orqali hr menejerga habar bo'lib kelishi kerak, ishga kech qolganlarga avtomatik hujjat tayyorlanishi kerak va jarima tasdiqlanmasa yozilmasligi kerak, xar bir xodimni unikal ish vaqti bo'lishi mumkin shunga qarab belgilash kerak Xar bir xodim ish joyida qancha bo'ldi va ishxona xudida qancha bo'ldi bu ham kerak, ish vaqtida tashqariga chiqish ham hujjat orqali bo'ladi bazi xodimlarga xujjat kerak emas lekin sababini yozishi kerak, 3 kun xodim sababsiz ishga kelmasa erp xodimni bloklashi kerak va har qanday xuquqidan mahrum qilishi kerak qachon HR bo'limi dalolatnoma yozib xodimni blokdan chiqarmaguncha,

**Q109. Kech kelish hujjati avtomatik tayyorlanadi. Bu hujjat qanday nomlansin?**
> ✅ shabloni bor va buni xavfsizlik xodimi kuzatishi kerak 1-3 to'g'ri

**Q110. 3 kun sababsiz kelmasa ERP xodimni bloklaydi. Xavfsizlik xodimi ham nazoratda bo'lsinmi?**
> ✅ Yo'q bu faqat eshik oldida xodimlarni kelishini va ketishini taminlaydi xolos

**Q111. Xodim bloklanganda: ERP da nima imkoniyatdan mahrum bo'ladi?**
> ✅ Hammasi bo'ladi

**Q112. Xodim ish vaqtida tashqariga chiqish hujjati: ba'zi lavozimlar uchun hujjat kerak emas dedingiz. Qanday ro'yxat bo'lsin?**
> ✅ 1-2 va xodimdan telegram bot orqali avtomatik so'rov va sababini yozish

**Q113. Hujjatda 'statistika' sektsiyasi bor. HR uchun haftalik avtomatik hisobot qanday ko'rinishda bo'lsin?**
> ✅ Ikkalasi: Telegram qisqa + ERP to'liq hisobot

**Q114. Xodimning ish sifatini baholash (360 daraja): xodimni kollegalar ham baholaydi. Bu kerakmi?**
> ✅ Har kuni belgilashi mumkin va baholashni sabablarini yozishi kerak, Qanday baholaydi yani xozir farrosh yoki oshpaz dizayner va shunga o'xshash xodimlarni baholash kerak uskunada ish qilmaydigan va ishini baholash imkoni yo'q xodimlarni u xodim kimga xizmat qilsa o'sha xodimlar bal qo'yishi mumkin masalan ofis farrosh uchun o'sha xonadigi xodimlar ishini baholashi kerak

**Q115. Kunlik xodim baholash tizimi: baholashda sabablar majburiy. Minimum sabab uzunligi?**
> ✅ 30+ belgi (bir jumla)

**Q116. Xodimlar bir-birini baholaydi. Baholash nima maqsadda ishlatilsin?**
> ✅ Hammasi uchun va har kuni ishdan keyin qaysi lavozimda bo'lishidan qatiy nazar stkp si orqali xodimdan xisobot olinadi va xodim profiliga saqlanadi bu bot orqali amalga oshadi, uskunada ishlaydigan xodimlar uchun hisoboti avtomatik yuboriladi rasmiy invoys bo'ladi har bir pdf

**Q117. Kunlik hisobot bot orqali: har kuni ishdan keyin xodimdan hisobot so'raladi. Hisobot qanday savollar bo'lsin?**
> ✅ Kombinatsiya: Vazifalar + Miqdor + Ertangi reja

**Q118. Xodim kunlik hisobotini kechiktirsa nima bo'lsin?**
> ✅ Hammasi va agar 3 soatda xisobot yuborilmasa o'sha kuni ishlamagan xisobida saqlanadi HR menejer qachon buni o'zgartirsa shunda xisoboti bo'lishi majburiy keyin o'zgaradi

**Q119. Uskunada ishlaydigan xodimlar (Offset, Flexo mashinasi operatorlari) uchun hisobot invoys sifatida PDF bo'ladi. Bu PDF nima ma'lumot bo'lsin?**
> ✅ 4 va qancha ishlagani aslida undan kutilgan natija oylik to'liq oyda avans va ishxonadan olgan qarzlari agar kassadan pul olgan bo'lsa masalan biror buyumga omborga kirim bo'lmasa bu ham ko'rsatish kerak

**Q120. 120-savol! Xodim oylik 'Shaxsiy hisobot kartasi' bo'lsin: barcha ma'lumotlar bir PDF da. Bu kimga ko'rinsin?**
> ✅ Barcha rahbarlik zanjiri ko'radi


## 📋 Hujjatlar, siyosatlar va xavfsizlik (Q121–Q160)

**Q121. Hujjat workflow: avans ariza misoli. Org-sxemadan avtomatik yo'l aniqlanadi. Tasdiqlash muddati qancha bo'lsin?**
> ✅ Hujjat turiga qarab: ta'til 24 soat, avans 4 soat

**Q122. Menejer muddat ichida tasdiqlamаsa nima bo'lsin?**
> ✅ Eslatma (2x) + keyin eskalatstiya + HR xabardor

**Q123. ERP tizimida direktoр dashboard: direktor har kuni ERPga kirsa nima ko'rsin?**
> ✅ Hammasini va to'liq ko'rinsin har bir modul bo'yicha asosiy ko'rsatgichlar

**Q124. Hujjatda 'pochta jo'natmalari' sektsiyasi bor: tashqi xatlar, posylkalar. Bu ERP da kerakmi?**
> ✅ Reception moduli bilan birlashtirilsin

**Q125. Hujjatda 'kompaniya tartib-qoidalari TAHLIL' Excel fayli bor (inspeksiya papkasida). Bu fayl nima ma'lumot?**
> ✅ Faylni o'qib keyin qaror qilaman

**Q126. Excel faylda jarima tizimi tahlili bor: 100 ta qoida, ziddiyatlar, nomutanosib jarimalar ko'rsatilgan. Masalan: mushtlashish = 100K, telefon = 200K (telefon qimmatroq). Bu jarimalar ERP da to'g'rilansinmi?**
> ✅ Jarima tizimini qayta yaratish (to'liq revision)

**Q127. Jarima tizimida Excel: 'Xavfsizlik: 400K, Mushtlashish: ISHDAN BO'SHATISH' tavsiya qilingan. Qanday jarima darajalari bo'lsin?**
> ✅ Qayta to'g'irlab chiqiladi hammasi

**Q128. ERP da jarima qo'llash jarayoni: xodimga jarima belgilanganida nima bo'lsin?**
> ✅ 1-2 va AI kameralar orqali buni hammasi xodim profiliga tushadi

**Q129. Hujjatda inspeksiya 'Rasmiār' papkasi bor: tekshiruv fotolari. ERP da inspeksiya fotolari qanday saqlansin?**
> ✅ Hammasi: Dalil fotosi + Umumiy + Before/After

**Q130. ERP da xodimlar shikoyat qilish imkoni bo'lsinmi? (Masalan: menejerga nisbatan shikoyat)**
> ✅ 1-2 tanlash xuquqi bo'lsin

**Q131. Hujjatda 'tashkiliy asoslar' sektsiyasi bor. Kompaniya missiyasi, qadriyatlari ERP da ko'rinsinmi?**
> ✅ 1-2-3 hammasi bo'lishi kerak

**Q132. Hujjatda 'smenaboshchi' (shift supervisor) roli ko'rsatilgan. Bu rol ERP da qanday huquqlarga ega bo'lsin?**
> ✅ orgsxemaga amal qilinadi bunda yani orgsxemada belgilash kerak

**Q133. ERP da smena jadvali (ShiftSchedule.tsx mavjud). HR bilan qanday bog'lansin?**
> ✅ Hammasi

**Q134. Rekruting kanban: hujjatda 7 bosqich (портрет, упаковка, поток, tez ishlov, baholash, lavozimga kiritish, kuchaytirish). Kanban da ustunlar:**
> ✅ Barcha 7 bosqich + AI bosqichlari ham qo'shilgan

**Q135. ERP da xodimlarning ko'nikmalari (SkillsMatrix.tsx mavjud). HR bilan qanday bog'lansin?**
> ✅ Hammasi: Vacancy match + Adaptation growth + Position requirements

**Q136. Hujjatda Rekruter xorijiy bo'limi bor. Xorijiy nomzodlar uchun rezyume Telegram boti qaysi tilda bo'lsin?**
> ✅ Hozircha faqat O'zbekistondagi nomzodlar, xorijiy keyinroq

**Q137. ERP HR dashboardida (HRDashboard.tsx) qanday yangi widgetlar qo'shish kerak?**
> ✅ Hammasi

**Q138. Nomzod AI intervyu oldin: nomzodga qanday tayyorgarlik ma'lumoti yuborilsin?**
> ✅ 1-2 bo'lishi kerak aniq vaqtda linkga kirishi kerak

**Q139. AI intervyu sahifasi dizayni: nomzod linkka kirganda nima ko'rsin?**
> ✅ EuroPrint logotipi + 'Xush kelibsiz, [Ism]' + kamera tekshiruvi + Boshlash tugmasi

**Q140. 140-savol! ERP tizim notifikatsiyalari: qaysi bildirishnomalar eng muhim (har doim yuborilsin)?**
> ✅ Hammasi va vaqtlari belgilash mumkin bo'lsin

**Q141. ERP da xodimlar ro'yxati (Employees.tsx mavjud). 400 xodim uchun qidiruv va filtrlar qanday bo'lsin?**
> ✅ Hammasi va xodim profilidagi malumotlar ham qo'shilsin

**Q142. Rag'batlantirish moduli: Oy yaxshi xodimi tanlovini o'tkazish. Bu qanday bo'lsin?**
> ✅ Kriterialar bo'yicha avtomatik + rahbariyat tasdiqlaydi

**Q143. Hujjatda 'tashkiliy asoslar' da kompaniya tuzilmasi ko'rsatilgan. ERP da bo'limlar yaratish va o'chirish qanday bo'lsin?**
> ✅ 2 va 3: HR yaratadi + Direktor tasdiqlaydi + Avtomatik shablonlar

**Q144. ERP da 'audit log': kim nima qildi, qachon. Bu jurnalni kim ko'rishi mumkin?**
> ✅ Faqat Super Admin (IT/Direktor)

**Q145. Xodimlar orasida mentorlash (Mentorship.tsx mavjud). HR moduli bilan qanday bog'lansin?**
> ✅ Har bir xodimga 2 mentor: adaptatsiya mentori + kasbiy usta

**Q146. ERP da xodim shartnomasi: shartnoma muddati tugashiga 30 kun qolsa ogohlantirish ketadi. Shartnoma turlari qanday bo'lsin?**
> ✅ Hammasi: Muddatli + Muddatsiz + Sinov + Loyiha

**Q147. Hujjatda 'kuchli kadr zaxirasi yaratish' usuli ko'rsatilgan. ERP da iste'dodli xodimlarni aniqlash kriteriyalari qanday bo'lsin?**
> ✅ Hammasi

**Q148. ERP da xodimning 'liderlik salohiyati' baholash testi bo'lsinmi? (Hujjatda: Origin Liderlik testi ko'rsatilgan)**
> ✅ Hammasi: yillik + zaxira + lavozim o'zgarish

**Q149. Hujjatda Replication testi bor (metodologiya bo'yicha: rahbar o'z yutuqlarini jamoaga o'rgatishi). Bu test ERP da qanday ishlaydi?**
> ✅ LMS ichida modul sifatida: rahbar dars yaratadi, xodimlar o'qiydi

**Q150. 150-savol! Yarim yo'l! Endi texnik savollar: Backend NestJS da AI integratsiya. Gemini API kaliti qayerdan olinadi?**
> ✅ Google AI Studio (aistudio.google.com) dan API kalit olish kerak

**Q151. AI intervyu real-time ovoz/video uchun Gemini LIVE API: bu WebSocket orqali ishlaydi. NestJS da bu qanday implement qilinsin?**
> ✅ Arxitektura siz belgilang (texnik qaror sizga)

**Q152. Telegram bot qurish uchun qaysi framework ishlatilsin?**
> ✅ Telegraf.js (Node.js, NestJS bilan mos)

**Q153. ERP backend da hujjat PDF generatsiya: server tomonida PDF yaratish uchun qaysi kutubxona ishlatilsin?**
> ✅ replit hal qiladi

**Q154. Hujjat workflow engine uchun: NestJS da hujjat routing tizimi qanday qurilsin?**
> ✅ Siz belgilang (mavjud ERP stack: BullMQ + EventEmitter2 bor)

**Q155. ERP da real-time yangilanishlar: xodim holati o'zgarganda dashboardda darhol ko'rinsin. Qaysi texnologiya?**
> ✅ Mavjud ERP arxitekturasiga qarab (siz belgilang)

**Q156. Database: PostgreSQL da 400 xodim + kunlik hisobotlar = katta ma'lumot. Arxivlash strategiyasi:**
> ✅ 3 yildan eski ma'lumotlar arxiv tablega o'tsin (partitioning)

**Q157. ERP da rol tizimi: yangi rollar qo'shish kerak. Hozirgi rollarga qo'shimcha qaysi rollar kerak?**
> ✅ orgsxemada belgilanadi hammasi

**Q158. ERP tizim deployment: hozir qayerda joylashgan?**
> ✅ Hali deploy qilinmagan (development stage)

**Q159. ERP ishlash uchun internet kerak. Agar internet uzilsa (O'zbekiston muammosi) kritik funksiyalar qanday ishlaydi?**
> ✅ Offline mode: asosiy ma'lumotlar local saqlangan

**Q160. 160-savol! ERP security: 400 xodim ma'lumotlari. Backup (zaxira nusxa) qancha muddat saqlash kerak?**
> ✅ Real-time replication (2ta server, doimo sinxron)


## 💰 Maosh, bonus, rivojlanish (Q161–Q200)

**Q161. ERP frontend da xodimning biometrik ma'lumotlari (yuz tanish) saqlash: GDPR/O'zbekiston qonuni bo'yicha xodim ruxsat berishi kerakmi?**
> ✅ Mehnat shartnomaga kiritiladi (boshidayoq rozi bo'ladi)

**Q162. Hujjatda ko'rsatilgan 'kuchli nomzod raqobatchilarga ketmasligi' uchun nima qilinsin? ERP tizimda:**
> ✅ Hammasi: tezlik + muloqot + madaniyat

**Q163. ERP da HR menejerning kunlik rutini qanday bo'lsin? (Tizim unga har kuni nima ko'rsatsin)**
> ✅ Hammasi: 3 ta vaqtda kunlik routine notification

**Q164. Xodimning ish faoliyati: ERP real-time 'xodim hozir nima qilyapti' ko'rsatsinmi?**
> ✅ 1-2-4 bo'lishi kerak tahlil uchun

**Q165. ERP da xodimlarning motivatsiyasini oshirish uchun: 'Gamification' (o'yin usullari) kerakmi?**
> ✅ 1 Ha: unvonlar (badge), reyting jadvali (leaderboard), ball to'plash korparativ muhitni oshirish uchun

**Q166. Leaderboard (reyting jadvali): qaysi ko'rsatkich asosida?**
> ✅ Hammasi

**Q167. Badge (unvon) tizimi: qanday unvonlar bo'lsin?**
> ✅ Hammasi + Admin panel dan yangi badge qo'shish imkoni

**Q168. ERP da 'Internal Job Posting' (ichki vakansiya): mavjud xodim yangi lavozimga o'tishini so'rasin. Qanday ishlaydi?**
> ✅ hammasi

**Q169. Hujjatda ko'rsatilgan: yangi xodim 1-oy, 3-oy, 6-oy milestone'lari. ERP ular uchun nima qilsin?**
> ✅ Hammasi: baholash + HR eslatma + tabrik + badge

**Q170. ERP da xodimlarning ta'lim va sertifikatlar (Certificates.tsx mavjud). HR bilan qanday bog'lansin?**
> ✅ Hammasi

**Q171. ERP da xodimlarni gruh bo'yicha tartibga solish: departament ichida subgruhlar bo'lsinmi? (Masalan: Offset bo'limida - 1-smenа, 2-smena, Operatorlar, Sozlovchilar)**
> ✅ Bo'lim > Lavozim (org-sxema to'liq)

**Q172. HR va Marketing integratsiyasi: vakansiya e'loni uchun Marketing bo'limi reklama yaratadi dediɡiz. Bu workflow qanday bo'lsin?**
> ✅ 1-2-3

**Q173. ERP da 'Disiplin tarixi' xodim profilida ko'rinadi. Bu ma'lumot necha yil saqlansin?**
> ✅ Abadiy (saqlanib qoladi)

**Q174. Hujjatda 'Nazorat varaqasi' (checklist) tizimi bor: xodim o'rganish jarayonini tasdiqlaydi. ERP da bu qanday ishlaydi?**
> ✅ Hammasi: O'qdi tasdiqlash + Mentor tekshirish + Mini-test

**Q175. Hujjatda 'Amaliy topshiriqlar' to'plami bor (Rekruter va Adaptatsiya uchun). Bu topshiriqlar ERP da qanday muhit beradi?**
> ✅ Hammasi: Task + Rubrika + Real vaziyat

**Q176. ERP da xodim 'tashqi ta'lim' olsa (kurs, seminar, sertifikat to'lovini kompaniya to'laydi). Bu qanday formatlashtirilsin?**
> ✅ Hammasi: Ariza + Shartnoma + Natija

**Q177. Xodim kompaniya to'lagan kurs/sertifikatni tugatgandan keyin ERP da nima bo'lishi kerak?**
> ✅ Hammasi

**Q178. Xodim ichki bilim uzatish (Knowledge Transfer) qilishi kerak bo'lsa — format qanday?**
> ✅ 1-2 bo'ladi

**Q179. Xodim stajirovka/amaliyot o'tkazsa (ichki yoki tashqi stajyor qabul qilish) — ERP da qanday boshqarilsin?**
> ✅ hammasi

**Q180. Xodim ish faoliyatini yaxshilash rejasi (PIP — Performance Improvement Plan) kerak bo'lganda qanday ishlash kerak?**
> ✅ hammasi

**Q181. Xodim ish haqini hisoblashda qanday komponentlar avtomatik Payroll ga o'tishi kerak?**
> ✅ Hammasi

**Q182. Xodim ombor/kassa dan mol-mulk yoki pul olsa (qarz sifatida) — ERP da qanday kuzatilsin?**
> ✅ Xodim kartochkasida ko'rinadi,Oylik to'lovdan avtomatik chegiriladi,Qaytarish muddati belgilanadi,HR va rahbar ko'radi

**Q183. Korporativ telefon, noutbuk, forma kiyim kabi inventar xodimga berilganda ERP da qanday bo'lishi kerak?**
> ✅ Xodim profili > Inventar bo'limi,Xodim imzo (ERP da tasdiqlaydi),Ishdan ketganda qaytarish cheklisti,Inventar holati foto + AI kamera

**Q184. Favqulodda vaziyat (yong'in, baxtsiz hodisa, tibbiy yordam kerak) bo'lganda ERP/bot qanday ishlashi kerak?**
> ✅ Xavfsizlik xodimi darhol Telegram xabar oladi,ERP da hodisa jurnaliga yoziladi,Tibbiy yordam protokoli ko'rsatiladi,Hujjat avtomatik tayyorlanadi

**Q185. Xodimlar o'rtasida konflikt (mojarо) yuzaga kelsa — ERP da qanday boshqarilsin?**
> ✅ Natija xodim profiliga tushadi,HR tekshiradi va mojaroni ro'yxatga oladi,Xodim anonimnom shikoyat yuborishi mumkin,Mediatsiya jarayoni ERP da kuzatiladi

**Q186. Xodim ta'til (mehnat ta'tili, o'quv ta'tili, tug'ruq ta'tili) so'raganda qanday jarayon bo'lishi kerak?**
> ✅ Xodim ERP/bot da ariza yozadi,Rahbar tasdiqlaydi (24 soat),HR kalendarida ko'rinadi,Payroll avtomatik hisoblanadi

**Q187. Xodim ishdan bo'shatilganda (offboarding) to'liq jarayon qanday bo'lsin?**
> ✅ ERP kirish blokirovkasi,Hisob-kitob va oxirgi to'lov,Inventar qaytarish cheklisti,Exit interview (ERP da savol-javob),xodim aniq sabablari aytishi kerak nimaga ketib turganini va sabablari aniq bo'lmasa hisob kitobga o'tmaydi

**Q188. Xodim boshqa lavozimga ko'chirilganda (ichki transfer/rotatsiya) ERP da nima o'zgarishi kerak?**
> ✅ Adaptatsiya qayta boshlanadi,Ruxsatlar (permission) qayta belgilanadi,Yangi shartnoma/qo'shimcha shartnoma,Lavozim + bo'lim + rahbar avtomatik yangilanadi

**Q189. Mehnat intizomi: xodimga 'tanbeh' yoki 'hayfsan' (rasmiy ogohlantirish) berilganda qanday jarayon?**
> ✅ Profilda saqlanadi + muddatli (6 oy),Rahbar ham imzolaydi,Xodim o'qib imzolaydi (ERP da),HR hujjat tayyorlaydi (shablon asosida)

**Q190. Rekruter ishi samaradorligini o'lchash uchun qanday KPI ko'rsatkichlari kerak?**
> ✅ AI bosqichidan o'tgan nomzodlar foizi,Qancha vakansiya yopdi (oylik),Qabul qilingan nomzodlar sifati,Vakansiya yopish vaqti (Time-to-Fill),Yana qo'shimchalar bor

**Q191. HR bo'limi uchun qanday asosiy hisobotlar kerak (oylik/choraklik)?**
> ✅ Mukofot va jarima hisoboti,Rekrutment hisoboti,Davomat va kechikish hisoboti,Xodimlar harakati hisoboti,Yana qo'shimchalar bor

**Q192. ERP tizimida xodimlar uchun 'O'zim haqimda' sahifasi qanday ko'rinishi kerak?**
> ✅ Shaxsiy ma'lumotlar + hujjatlar,Ish tarixi (kompaniya ichida),Mukofot va intizom tarixi,Rivojlanish va ta'lim

**Q193. HR brendini mustahkamlash uchun ERP qanday imkoniyatlar berishi kerak?**
> ✅ Xodim muvaffaqiyat tarixi,Yangi xodim onboarding kiti,Nomzod tajribasi (Candidate Experience),Vakansiya sahifasi (europrint.uz)

**Q194. Xodimlar so'rovnomasi (eNPS, ishga qoniqish) qanday o'tkazilsin?**
> ✅ Natija asosida avtomatik tavsiya,Telegram bot orqali avtomatik (choraklik),HR dashboard da tahlil,Anonim (xodim kim ekanini bilmaydi HR)

**Q195. Kompaniyada muhim sanalar (tug'ilgan kun, ish yilligini nishonlash) qanday boshqarilsin?**
> ✅ Avtomatik Telegram tabrik (xodimga),HR + Rahbarga eslatma,Korporativ tabriklash sayti/sahifa,Xodim kelmasligi kerak bu birinchi xodimdan tashqari hammaga borsin kechki payt xodimga, ertalab 7:30 hammaga borishi kerak telegram orqali

**Q196. Xodim ishga kelmaslik sababini (kasallik, oilaviy holat) qanday rasmiylashtirishi kerak?**
> ✅ Hujjat (kasallik varaqasi) yuklaydi,Bot orqali sabab yozadi (real vaqtda),Rahbar tasdiqlaydi,HR avtomatik hisobotga kiritadi,Tayyor shablon asosidan savollarga javob berib ariza to'ldiradi

**Q197. ERP tizimiga yangi modul yoki funksiya qo'shilganda xodimlarni o'qitish qanday bo'lishi kerak?**
> ✅ LMS da video qo'llanma (ichki),Bot orqali xabar + link,FAQ sahifa ERP ichida,Majburiy: ko'rmasdan ishlatib bo'lmaydi

**Q198. Kelajakda ERP ga qo'shilishi mumkin bo'lgan qo'shimcha tizimlar bilan integratsiya rejalashtirilganmi?**
> ✅ Hali aniq emas, keyinroq hal qilinadi

**Q199. ERP loyihasining birinchi bosqichida (MVP) eng muhim 5 modul qaysilar deb hisoblaysiz?**
> ✅ Adaptatsiya + Mentorlik,Hujjat aylanishi (Document Workflow),Davomat + AI kamera + bloklash,Rekrutment (AI + Telegram + 3 bosqich)

**Q200. Savol 200/200 (OXIRGI) — ERP tizimi muvaffaqiyatli ishga tushganda kompaniya uchun eng muhim natija nima bo'lishi kerak?**
> ✅ yana 10 ta berilmagan savolliaarni qo'shing va qolib ketgan narsalarni ham


## 🏗️ Texnik arxitektura va qo'shimcha (Q201–Q210)

*(Bu guruh uchun javoblar arxivda saqlanmagan)*


---

<a name="org"></a>

# 🏢 ORGSXEMA / TASHKILIY TUZILMA MODULI

*EuroPrint — Vysotskiy 7 funksiya modeli asosida*

## ⚙️ Tizim Qarorlari

**1. Tuzilma modeli**
> ✅ Vysotskiy 7 funksiya modeli — 7 otdeleniye tizimi

**2. Ierarxiya**
> ✅ Egasi → Bosh direktor → 7 otdeleniye → Otdellar → Sektsiyalar → Sektorlar

**3. QYM (Qimmatli Yakuniy Mahsulot)**
> ✅ Har bo'lim va lavozim uchun alohida QYM (ЦКП ruscha) belgilanadi

**4. Hujjatlar bog'liqligi**
> ✅ Barcha hujjatlar orgsxema bo'yicha yuradi — vertikal va gorizontal

**5. Lavozim papkasi**
> ✅ Har lavozim uchun ERP da virtual papka: hujjatlar, video, testlar

**6. Bo'limlar soni**
> ✅ 30+ bo'lim (7 otdeleniye ichida)

**7. Tasdiqlash zanjiri**
> ✅ Hujjatlar orgsxema bo'yicha yuqoriga va yonboshga ketadi

**8. ERP integratsiya**
> ✅ Barcha modullar (HR, POS, Dokument, Davomat) orgsxema strukturasiga bog'liq

**9. UI ko'rinishi**
> ✅ Interaktiv daraxt + drag-and-drop + Bo'lim/Lavozim CRUD

**10. Eksport**
> ✅ PDF + Excel formatida eksport qilinadi


## 🏗️ 7 Otdeleniye Tuzilmasi

| # | Otdeleniye | Vazifasi |
|---|-----------|----------|
| 7 | Ma'muriy bo'lim | Egasi ofisi, Rasmiy masalalar, Bosh direktor ofisi |
| 1 | Qurilish bo'linmasi | Yo'naltirish va personal, Kommunikatsiyalar, Marketing |
| 2 | Tarqatish bo'linmasi | Savdo, CRM, Mijozlar xizmati |
| 3 | Ishlab chiqarish | Offset, Flexo, Digital, Prepress |
| 4 | Texnik ta'minot | Uskunalar, IT, Xom ashyo |
| 5 | Moliya | Buxgalteriya, Kassa, Budjet |
| 6 | Rivojlanish | IT/ERP, Marketing strategiyasi, Innovatsiya |


## 📌 ERP da Orgsxema Bog'liqliklari

**1. HR moduli**
> ✅ Xodim qaysi bo'limda — orgsxemadan olinadi. Rahbar, mentor — ierarxiya bo'yicha

**2. Hujjat workflow**
> ✅ Tasdiqlash zanjiri orgsxema bo'yicha: vertikal (yuqoriga) + gorizontal (yonboshga)

**3. POS ombor**
> ✅ Har bo'limning o'z ombori — DEPARTMENT_* tip. Bo'lim kodi orgsxemadan

**4. Davomat/Kirish**
> ✅ Qaysi xodim qaysi xonada, qaysi bo'limda — AI kamera orgsxemaga qarab

**5. Telegram routing**
> ✅ Bildirishnomalar qaysi guruhga ketadi — bo'lim/otdeleniyaga qarab belgilanadi

**6. Rollar va huquqlar**
> ✅ Role-based access — orgsxemadagi lavozimga qarab avtomatik

