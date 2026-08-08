# Bildirishnoma / Telegram — QAROR XARITASI (Decision Map)

> Modul kodi: **NTF** · Raqamlash: `EP-NTF-###` (manba: `docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` §B).
> Manbalar: `vision-questions/18-notifications.md` (v1, 30 savol → EP-NTF-001..030) + `vision-questions-v2/18-notifications.md` (v2, 52 savol → EP-NTF-031..082, kitob-grounded: RD-5 yo'riqnomalar + Оргполитика).
> + egasi javoblari `shvb-extracted/EUROPRINT_BARCHA_JAVOBLAR.md`:
>   **Q50** "hammasi uchun va alohida bo'lishi kerak ERP'ga ulangan" + **Q101** "ERP ichidagi har bir modul uchun" + **Q102** "Hammasi" = **per-MODULE Telegram botlar, hammasi ERP'ga ulangan**;
>   **Q140** "Hammasi va vaqtlari belgilash mumkin bo'lsin" = barcha bildirishnoma **vaqt-sozlanadigan (egasi belgilaydi)**;
>   **Q113** "Ikkalasi: Telegram qisqa + ERP to'liq hisobot" = haftalik digest Telegram+ERP;
>   **Q152** "Telegraf.js (Node.js, NestJS bilan mos)" = framework;
>   **Q59** "Email + Telegram (ikkalasi ham)" = tashqi muloqot kanali.
> + `shvb-extracted/SHvB-40-Yonalish-Prompt.md` (YO'NALISH 38): ShVB Telegram komandalari `/zvs_status`, `/my_gsd`, `/company_state`, `/weekly_digest` + cron eslatmalar (Se 09:00 ЗВС, Du 10:00 GSD, har kun 18:00 kompaniya holati).
>
> **XULOSA:** Jami **82** savol (v1=30 → EP-NTF-001..030; v2=52 → EP-NTF-031..082).
> ✅ JAVOBLANGAN: **18** (egasi to'g'ridan-to'g'ri javobi Q50/Q101/Q102/Q140/Q113/Q152/Q59 + ShVB YO'NALISH 38 aniq dizaynni belgilaydi; v2 kitob-grounded savollar Оргополитика/RD-5 hujjatining o'zi javob).
> 🔵 OCHIQ: **64** (A-default tavsiya bilan; egasi tasdig'i kutiladi).
> **Egasi-qaror o'qi:** (1) **Per-modul bot** — har ERP moduli o'z Telegram boti, hammasi bitta ERP'ga ulanган (Q50/Q101/Q102); (2) **Vaqt-sozlanadigan** — har bildirishnoma vaqtini egasi har modul uchun o'zi belgilaydi (Q140). Bu ikki o'q ko'p OCHIQ savolда "vaqt/kanal kim belgilaydi" javobini avtomatik egaga qaytaradi.
> NTF = **T2 (Boshqaruv/Nazorat)** modul — ShVB operativ aloqa qatlami; framework = **Telegraf.js** (Q152).

---

## I QISM — v1 (vizyon savollari, 30 ta)

### EP-NTF-001 · ShVB Telegram bot komandalari (/zvs_status, /my_gsd ...)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) To'rttala komanda ham: `/zvs_status` (holatim) · `/my_gsd` (mening haftalik GSD) · `/company_state` (kompaniya holati) · `/weekly_digest` (haftalik xulosa) — to'liq ShVB to'plami. ShVB YO'NALISH 38 aynan shu 4 komandani belgilaydi.
- **Manba:** v1 Q1 · SHvB-40 YO'NALISH 38
- **action:** NTF (op=ntf.bot.commands)
- **⤳ Ta'sir:** Director (company_state), Finance/ZVS, HR/GSD — barcha ko'rsatkich manbai

### EP-NTF-002 · "Mening holatim" komandasi tarkibi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Karta nomi + bugungi vazifa + haftalik natija foizi + razryad — karta-markazli modelga to'liq bog'liq. Org KARTA-model bilan izchil (xabar lavozimga/kartaga bog'lanadi).
- **Manba:** v1 Q2
- **action:** NTF (op=ntf.bot.myStatus)
- **⤳ Ta'sir:** Org-karta (razryad/ЦКП), MES (bugungi vazifa), AI (haftalik natija)

### EP-NTF-003 · Haftalik digest qachon yuborilsin
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** C) **Egasi har modul uchun o'zi vaqt belgilaydi** — Q140 "vaqtlari belgilash mumkin bo'lsin" bevosita shu variantni majburlaydi. ShVB default sifatida Du 10:00 (GSD xulosasi) qabul qilinadi, lekin sozlanadi.
- **Manba:** v1 Q3 · ShVB Q140 (C) · SHvB-40 YO'NALISH 38 (Du 10:00)
- **action:** NTF (op=ntf.digest.schedule)
- **⤳ Ta'sir:** Cron (sozlanadigan), Director, barcha modul

### EP-NTF-004 · Haftalik digest kimga boradi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Org-marshrut bo'yicha: har kim o'z darajasidagini oladi (operator o'zinikini, bo'lim boshlig'i bo'limini, ega — hammasini) — Vysotskiy 7-pog'ona modeliga mos.
- **Manba:** v1 Q4 · org_structure_vysotskiy7
- **action:** NTF (op=ntf.digest.route)
- **⤳ Ta'sir:** Org-struktura (manager_id zanjiri), Director

### EP-NTF-005 · FP-tsikl (haftalik tsikl) eslatmalari
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) To'liq FP-tsikl: har bosqichda (rejalashtir → bajar → bahola → hisobot) alohida eslatma — ShVB ritmi to'liq. Hozir 4 cron mavjud (Se/Ch/Pa/Du fp-cycle.cron.ts) — vizyonga moslab kengaytiriladi.
- **Manba:** v1 Q5 · SHvB-40 (fp-cycle.cron.ts)
- **action:** NTF (op=ntf.fpcycle.reminders)
- **⤳ Ta'sir:** Finance (ЗВС/ФП), cron, Director

### EP-NTF-006 · Holat-alert (signal) qachon yuborilsin
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Belgilangan chegaradan o'tganda darrov (masalan natija 70% dan past) — tezkor nazorat. ShVB "operativlik" prinsipiga mos.
- **Manba:** v1 Q6
- **action:** NTF (op=ntf.alert.threshold)
- **⤳ Ta'sir:** AI (ko'rsatkich kuzatuvi), barcha modul KPI

### EP-NTF-007 · Alert chegaralarini kim belgilaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) **Egasi/rahbar har karta yoki modul uchun chegarani o'zi qo'yadi** — Q140 "vaqtlari belgilash mumkin" + per-modul prinsipi bilan izchil. Universal raqam YO'Q.
- **Manba:** v1 Q7 · ShVB Q140 (egasi sozlaydi)
- **action:** NTF (op=ntf.alert.config)
- **⤳ Ta'sir:** Har modul (o'z me'yori), Director

### EP-NTF-008 · Kanal sozlamasi: shaxsiy chat yoki guruh
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Aralash: shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga — to'g'ri taqsimot. Maxfiy natija shaxsiy, jamoaviy xulosa guruh.
- **Manba:** v1 Q8
- **action:** NTF (op=ntf.channel.mode)
- **⤳ Ta'sir:** Org-struktura (guruh↔org-shox), maxfiylik

### EP-NTF-009 · Telegram guruhlarini org-strukturaga bog'lash
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har org-tugun (bo'lim/sektsiya) uchun o'z guruhi, avtomatik aniqlanadi — to'liq marshrut. (Mavjud kod: getTelegramGroup org-queries — bog'lash nuqtasi tayyor.)
- **Manba:** v1 Q9 · employees_users_link_fix (getTelegramGroup)
- **action:** NTF (op=ntf.group.bindOrg)
- **⤳ Ta'sir:** Org-struktura, Coordination (CC)

### EP-NTF-010 · Kim-nima-oladi: org-marshrut bo'yicha yo'naltirish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Vertikal: keyingi yuqori daraja (manager_id zanjiri) avtomatik oladi — Vysotskiy modeli. (⚠️ employees.manager_id 0/30 NULL — backfill kerak.)
- **Manba:** v1 Q10 · org_structure_vysotskiy7 · employees_users_link_fix
- **action:** NTF (op=ntf.route.vertical)
- **⤳ Ta'sir:** Org-struktura (manager_id backfill), Coordination

### EP-NTF-011 · "Kompaniya holati" komandasi tarkibi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) 7 otdeleniye bo'yicha asosiy ko'rsatkich (ishlab chiqarish, sotuv, sifat, pul) — ShVB panorama. ShVB `/company_state` komandasi (EP-NTF-001) shuni qaytaradi.
- **Manba:** v1 Q11 · SHvB-40 YO'NALISH 38 (/company_state)
- **action:** NTF (op=ntf.bot.companyState)
- **⤳ Ta'sir:** Director, 7 otdeleniye (PP/SD/QC/Finance)

### EP-NTF-012 · Leaderboard (reyting) digestda
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Bo'lim va shaxs bo'yicha top-3 va past-3 ko'rsatilsin — to'liq reyting. ShVB usulida raqobat/motivatsiya muhim (hozir YO'Q).
- **Manba:** v1 Q12
- **action:** NTF (op=ntf.digest.leaderboard)
- **⤳ Ta'sir:** HR/KPI, gamifikatsiya, AI

### EP-NTF-013 · Karta-AI bahosi bildirishnomada
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har hafta AI xulosasi (mos/qisman/mos emas + sabab) digestga qo'shilsin — karta-modelга to'liq. Markaziy AI (EP-AI-001) hisoboti NTF orqali yetkaziladi.
- **Manba:** v1 Q13 · AI moduli (markaziy AI)
- **action:** NTF (op=ntf.digest.aiFit)
- **⤳ Ta'sir:** AI (markaziy), Org-karta, HR

### EP-NTF-014 · Razryad o'zgarishi haqida xabar
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Xodimga + uning rahbariga + HR'ga xabar (oylik o'zgarishi bilan) — to'liq. Razryad→talab→o'sish→oylik zanjirini hamma bilishi uchun.
- **Manba:** v1 Q14 · org_card_centric_model
- **action:** NTF (op=ntf.razryad.changed)
- **⤳ Ta'sir:** HR, Payroll (oylik), Org-karta

### EP-NTF-015 · Bildirishnoma tili
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Har xodim profilidagi tanlangan tilda (lotin/kirill/rus) — shaxsiy. Tizim 3 tilni qo'llab-quvvatlaydi (i18n: uz/uz-cyr/ru); egasi 3-til vizyoni (ShVB Q21) bilan izchil.
- **Manba:** v1 Q15 · i18n 3-til config · ShVB Q21
- **action:** NTF (op=ntf.lang.perUser)
- **⤳ Ta'sир:** i18n, HR (profil tili)

### EP-NTF-016 · O'qilganini tasdiqlash (muhim xabarlar uchun)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Faqat muhim/shoshilinch xabarlarda tasdiq tugmasi bo'lsin — maqsadli. "Bilmadim, ko'rmadim" bahonasini yo'qotadi.
- **Manba:** v1 Q16
- **action:** NTF (op=ntf.ack.button)
- **⤳ Ta'sir:** Bildirishnoma jurnali (EP-NTF-027), eskalatsiya

### EP-NTF-017 · Javob bermasa eskalatsiya
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Vaqt o'tsa avtomatik keyingi yuqori darajaga chiqsin (manager_id zanjiri) — Vysotskiy eskalatsiya. Muammo qotib qolmasin.
- **Manba:** v1 Q17 · org_structure_vysotskiy7
- **action:** NTF (op=ntf.escalate.vertical)
- **⤳ Ta'sir:** Org-struktura (manager_id), Coordination

### EP-NTF-018 · Bildirishnoma chastotasi (tinchlik vaqti)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ish vaqtida normal, tunda faqat shoshilinch signal — muvozanat. (Q140 "vaqtlari belgilash mumkin" — tinchlik oynasini egasi sozlaydi; EP-NTF-073 KRITIK istisno bilan birga ishlaydi.)
- **Manba:** v1 Q18 · ShVB Q140
- **action:** NTF (op=ntf.quietHours)
- **⤳ Ta'sир:** Cron, tungi smena protokoli (EP-NTF-035)

### EP-NTF-019 · Modullararo signallarni bitta bot ostida birlashtirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** B-ga yaqin **egasi-qarori:** har modul o'z botida, lekin **hammasi bitta ERP'ga ulangan** — Q101 "ERP ichidagi har bir modul uchun" + Q50 "alohida bo'lishi kerak ERP'ga ulangan". Ya'ni per-modul bot (Ombor boti, Moliya boti, HR boti...), umumiy ERP-yadro orqali. v1 A (bitta umumiy bot) egasi vizyoni bilan ALMASHTIRILDI.
- **Manba:** v1 Q19 · ShVB Q50/Q101/Q102 (per-modul, ERP'ga ulangan)
- **action:** NTF (op=ntf.bot.perModule)
- **⤳ Ta'sir:** HAMMA 20 modul (har biri o'z boti), ERP-yadro

### EP-NTF-020 · Digestga PDF/rasm hisobot biriktirish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Matn + bosib ko'riladigan PDF/grafik birga — to'liq. (Egasi PDF-invoys hisobotni boshqa modullarda ham talab qiladi — ShVB Q116/Q119; mos.)
- **Manba:** v1 Q20 · ShVB Q113 (Telegram qisqa + ERP to'liq)
- **action:** NTF (op=ntf.digest.attachPdf)
- **⤳ Ta'sir:** Reports (PDF gen), Director

### EP-NTF-021 · Telegram orqali javob/buyruq berish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Asosiy amallar (tasdiqla / rad et / topshiriq ber) tugma bilan bo'lsin — interaktiv. Rahbar yo'lda ham boshqarsin.
- **Manba:** v1 Q21
- **action:** NTF (op=ntf.bot.action)
- **⤳ Ta'sir:** Coordination, Kanban (tasdiq), xavfsizlik (RBAC EP-NTF-022)

### EP-NTF-022 · Bot komandalariga ruxsat (kim nimani so'ray oladi)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Org-daraja bo'yicha: har kim faqat o'z huquqidagisini so'ray oladi — xavfsiz. Oddiy operator butun zavod moliyasini ko'rmasligi kerak (RBAC kartadan).
- **Manba:** v1 Q22 · org_card_centric_model (RBAC)
- **action:** NTF (op=ntf.bot.rbac)
- **⤳ Ta'sир:** Auth/RBAC, Org-karta, xavfsizlik

### EP-NTF-023 · Yangi xodim ulanishi (botni ro'yxatdan o'tkazish)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) HR xodimni qo'shganda Telegram havola/kod avtomatik beriladi — uzluksiz. (ShVB Q61 nomzod Telegram bot bilan ishlaydi — onboarding bilan izchil.)
- **Manba:** v1 Q23 · ShVB Q61
- **action:** NTF (op=ntf.user.onboard)
- **⤳ Ta'sир:** HR (xodim qo'shish), Auth (telegram_id↔user)

### EP-NTF-024 · Oltin-ip (buyurtma) holati bo'yicha bildirishnoma
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har bosqichda mas'ul bo'lim + sotuv menejeri + (kechiksa) rahbar xabar oladi — to'liq kuzatuv. (v2 Q21/EP-NTF-051 kartochka-status bilan birlashadi.)
- **Manба:** v1 Q24
- **action:** NTF (op=ntf.order.stage)
- **⤳ Ta'sир:** SD (oltin-ip), PP/MES, CRM/Dizayn

### EP-NTF-025 · Kechikish/muddat signali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ikki bosqichli: muddatdan oldin eslatma + o'tib ketsa signal (rahbarga ham) — oldini olish. (v2 Q34/EP-NTF-064 ikki-bosqich qoidasi bilan bir xil.)
- **Манба:** v1 Q25
- **action:** NTF (op=ntf.deadline.twoStage)
- **⤳ Ta'sир:** PP (muddat), Kanban, Org-struktura

### EP-NTF-026 · ЦКП (yakuniy mahsulot) bajarilishi haqida xabar
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har hafta ЦКП bajarilish foizi xodim va rahbariga yuborilsin — karta-modelga to'liq. Har karta o'z ЦКП'si bilan o'lchanadi.
- **Манба:** v1 Q26 · org_card_centric_model (ЦКП)
- **action:** NTF (op=ntf.ckp.weekly)
- **⤳ Ta'sир:** Org-karta (ЦКП), AI, HR/KPI

### EP-NTF-027 · Bildirishnoma jurnali (kim qachon nimani oldi)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) To'liq jurnal: kimga/qachon/o'qildimi, ERP ichida ko'rinadi — to'liq nazorat. (v2 Q50/EP-NTF-080 "ma'lumot yo'qolmaydi arxivi" bilan mustahkamlanadi.)
- **Манба:** v1 Q27
- **action:** NTF (op=ntf.log.full)
- **⤳ Ta'sир:** Audit-log, Coordination, Совершенствование

### EP-NTF-028 · Shablonlarni (xabar matnlari) kim tahrirlaydi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Egasi/admin ERP ichidan o'zi tahrirlaydi (kodga tegmasdan) — mustaqil. (TelegramBotAdmin.tsx kengaytiriladi — ShVB YO'NALISH 38.)
- **Манба:** v1 Q28 · SHvB-40 (TelegramBotAdmin.tsx)
- **action:** NTF (op=ntf.template.edit)
- **⤳ Ta'sир:** Admin UI, i18n (notifications.json)

### EP-NTF-029 · Avariya/to'xtash signali (ishlab chiqarish to'xtasa)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Darrov: smena ustasi + texnik xizmat + bo'lim boshlig'i bir vaqtda xabar oladi — tezkor. Ishlab chiqarish to'xtashi = pul yo'qotish. (v2 Q18/EP-NTF-048 Roxler nosozligi bilan izchil.)
- **Манба:** v1 Q29 · IoT (anomaly)
- **action:** NTF (op=ntf.production.halt)
- **⤳ Ta'sир:** MES, IoT (stanok), texnik xizmat

### EP-NTF-030 · Maqtov/tanbeh (ijobiy va salbiy fidbek)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Ikkalasi: top natija — ochiq maqtov (guruhda), past natija — shaxsiy eslatma — muvozanatli. ShVB usulida tan olish kuchli motivatsiya.
- **Манба:** v1 Q30
- **action:** NTF (op=ntf.feedback.praise)
- **⤳ Ta'sир:** HR, gamifikatsiya, AI (baho)

---

## II QISM — v2 (kitob-grounded savollar, 52 ta — Оргополитика + RD-5)

### EP-NTF-031 · "Yozma" majburiy qarorlar avtomatik rasmiy yozuvga aylansinmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tавсiya:** A) 6 turdagi xabar (qaror/reja o'zgarishi/vazifa/texkarta o'zgarishi/sifat xulosasi/ogohlantirish) Telegramdan kelsa avtomatik rasmiy yozuvga aylanadi (raqam+sana+muallif). Оргополитика "Ёзма қайдсиз қарор қабул қилинган деб ҳисобланмайди" — hujjatning o'zi A'ni majburlaydi.
- **Манба:** v2 Q1 · Оргополитика "КОММУНИКАЦИЯ ТУРЛАРИНИ АНИҚ БЕЛГИЛАШ"
- **action:** NTF (op=ntf.written.formalize)
- **⤳ Ta'sир:** Ishlab chiqarish, Sifat, Dizayn — barcha "yozma majburiy" qarorlar; Audit-log

### EP-NTF-032 · Og'zaki topshiriq 24 soat ichida yozma qayd — bot kuzatsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Og'zaki topshiriq kiritilsa 24 soat ichida yozma qayd talab; bo'lmasa eslatma → keyin rahbarga signal — nazorat. Hujjat og'zaki topshiriq yo'qolishini taqiqlaydi.
- **Манба:** v2 Q2 · Оргополитика
- **action:** NTF (op=ntf.verbal.trackWritten)
- **⤳ Ta'sир:** Coordination, eskalatsiya

### EP-NTF-033 · Tex-kartada xato — 15 daqiqalik signal cron
- **Holat:** ✅ JAVOBЛАНГАН
- **Javob/Tавсiya:** A) Xato belgilanishi bilan bosh texnologga darrov signal + 15 daqiqa taymer; javob bo'lmasa RD-4'ga eskalatsiya. RD-5 yo'riqnoma "смена технологи 15 дақиқа ичида бош технологга хабар беради" — aniq vaqt qoidasi hujjatда. Sub-savol (15 daqiqada javob bo'lmasa kimga): **C) ikkalasiga** (telefon-eslatma + RD-4) tavsiya.
- **Манба:** v2 Q3 · "Тех картада муаммо аниқланганда чора кўриш тартиби" (15 daqiqa)
- **action:** NTF (op=ntf.techcard.error15min)
- **⤳ Ta'sир:** Ishlab chiqarish + Sifat zanjiri (tex-karta → bosh texnolog → RD-5 → dizayn/konstruktor)

### EP-NTF-034 · Tex-karta tuzatish — 1 soatlik muddat hisoblagichi
- **Holat:** ✅ JAVOБЛАНГАН
- **Javob/Tавсiya:** A) Topshiriq yuborilganda 1 soatlik countdown; 45-daqiqada eslatma, 60-daqiqada RD-5'ga "muddat o'tdi" signal. RD-5 "1 соат ичида тўғирлашни талаб қилади" — qattiq muddat hujjatда.
- **Манба:** v2 Q4 · RD-5 (1 soat qoidasi)
- **action:** NTF (op=ntf.techcard.fix1hour)
- **⤳ Ta'sир:** Dizayn/konstruktor/korrektor/rejalashtirish, RD-5

### EP-NTF-035 · Tungi smena telefon-eskalatsiyasi (RD-4/bosh texnolog javob shart)
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) Tungi muammo signal qilinsa "telefon qilindi → javob berdi/bermadi" qayd; javob bo'lmasa ertalab rahbarga ko'rinadi. RD-5 "РД-4 ва бош технолог тунги вақтларда телефон қилинган тақдирда жавоб беришлари лозим" — hujjatда maxsus tungi protokol.
- **Манба:** v2 Q5 · RD-5 (tungi protokol)
- **action:** NTF (op=ntf.night.phoneEscalation)
- **⤳ Ta'sир:** HR/masъuliyat (javob bermagan rahbar KPI/oylik), tungi smena

### EP-NTF-036 · Tungi smena texnologi "davom ettirish" qarori uchun maxsus belgi
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) "Tungi yakka qaror" belgisi bilan qayd → ertalab bosh texnolog + RD-5'ga digestда ko'rinadi. RD-5 "смена технологи... давом эттиришга рухсат беради. Бу холатда сифатга тўлиқ жавобгар" — yakka qaror = to'liq shaxsiy masъuliyat.
- **Манба:** v2 Q6 · RD-5 (tungi yakka qaror)
- **action:** NTF (op=ntf.night.soloDecision)
- **⤳ Ta'sир:** Sifat (masъuliyat), Director (ertalab digest)

### EP-NTF-037 · Bevosita rahbarni chetlab o'tish (фавкулодда) signali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Chetlab o'tilsa favqulodda sabab so'raladi + bevosita rahbarga "sizni chetlab o'tishdi" nusxasi boradi — shaffof. Оргополитика "Бевосита раҳбарни четлаб ўтиш фавқулодда ҳолатлардан ташқари тақиқланади".
- **Манба:** v2 Q7 · Оргополитика
- **action:** NTF (op=ntf.bypass.emergency)
- **⤳ Ta'sир:** Org-struktura (manager_id), Coordination

### EP-NTF-038 · Yuboruvchi vs qabul qiluvchi masъuliyatini bot ajratsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har xabarda yuboruvchi + qabul qiluvchi + ko'rilgan vaqt qayd (ikki tomonli masъuliyat) — bahssiz. Оргополитика "Юборган шахс тўғрилиги учун, қабул қилган шахс ўз вақтида кўриб чиқиш учун жавобгар".
- **Манба:** v2 Q8 · Оргополитика "МАСЪУЛИЯТНИ АНИҚ ШАХСЛАРГА БОҒЛАШ"
- **action:** NTF (op=ntf.responsibility.split)
- **⤳ Ta'sир:** Bildirishnoma jurnali (EP-NTF-027), Audit-log

### EP-NTF-039 · Mijoz bilan bog'liq muammo — savdo menejeriga avtomatik yo'naltirish
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) "Mijoz masalasi" belgisi → buyurtmaning savdo menejeriga avtomatik; texnik echim emas, faqat mijoz talabini aniqlash. RD-5 "Агар муаммо мижоз билан боғлиқ бўлса, савдо менежерига хабар берилади" — rolга aniq biriktirilgan.
- **Манба:** v2 Q9 · RD-5
- **action:** NTF (op=ntf.problem.routeSales)
- **⤳ Ta'sир:** Savdo (CRM) ↔ Ishlab chiqarish ↔ Sifat

### EP-NTF-040 · RD-2/RD-4/RD-5 uchlik kelishuv yig'ilishi chaqirig'i (1 soat)
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) Uchlik chaqiriq → 3 rahbarga signal + 1 soat taymer + qaror qaydi (davom ettirish / vaqtincha to'xtatish). RD-5 "РД4, РД2 ва РД5 учрашиб... 1 соат ичида хал қилиш талаб қилинади".
- **Манба:** v2 Q10 · RD-5
- **action:** NTF (op=ntf.trio.meeting1hour)
- **⤳ Ta'sир:** Coordination, Director, 3 RD

### EP-NTF-041 · "Vaqtincha to'xtatish" qarori butun zanjirga e'lon qilinsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) To'xtash qarori → buyurtma kartasidagi barcha masъullarga "to'xtatildi: sabab" signali — yagona haqiqat. Quyi bo'limlar bexabar ishlashda davom etmasin.
- **Манба:** v2 Q11 · RD-5 (vaqtincha to'xtatish)
- **action:** NTF (op=ntf.halt.broadcast)
- **⤳ Ta'sир:** SD (buyurtma), Dizayn/konstruktor/ombor/savdo

### EP-NTF-042 · Yangi оргополитика e'loni (НО-3 → adaptatsiya menejeri, 1 kun)
- **Holat:** ✅ JAVОБЛАНГАН (egasi ShVB Q55 bilan)
- **Javob/Tавсiya:** A) Yangi оргополитика → НО-3 + adaptatsiya menejeriga signal + 1 kunlik o'qitish boshlash muddati. Hujjat "ўқитиш... 1 кундан кечиктирмай бошланиши керак". Egasi ShVB Q55 "Ikkalasi: Telegram xabar + ERP tasdiqlash" — A'ni tasdiqlaydi.
- **Манба:** v2 Q12 · Оргополитика (НО-3, 1 kun) · ShVB Q55
- **action:** NTF (op=ntf.orgpolicy.announce)
- **⤳ Ta'sир:** HR/adaptatsiya + Ta'lim (LMS darslik)

### EP-NTF-043 · Takroriy xato → оргополитика yozish topshirig'i
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Bir xil xato 2-marta takrorlansa bo'lim boshlig'iga "оргополитика yoz" topshirig'i + НО-3'ga nusxa — tizimli. Hujjat takroriy xatoga tizimli javob talab qiladi.
- **Манба:** v2 Q13 · RD-5 (takroriy xato → оргополитика)
- **action:** NTF (op=ntf.repeatError.policy)
- **⤳ Ta'sир:** Sifat, HR/KPI (EP-NTF-081 brak statistikasi)

### EP-NTF-044 · Kun yakuni НО-3 hisoboti avtomatik eslatmasi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har kun smena oxirida masъulga eslatma; topshirilmasa НО-3'ga "hisobot kelmadi" signali — nazorat. (Egasi ShVB Q116/Q118 kunlik hisobot bot orqali — mos.)
- **Манба:** v2 Q14 · Оргополитика (НО-3 kun yakuni) · ShVB Q116/Q118
- **action:** NTF (op=ntf.no3.dailyReport)
- **⤳ Ta'sир:** HR (kunlik hisobot), Совершенствование

### EP-NTF-045 · Kunlik/haftalik/oylik hisobot uchligi (RD-5 boshlig'i)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Uch alohida eslatma (kunlik smena oxiri / haftalik / oy yakuni), har biri o'z adresati bilan — to'liq. Biri ikkinchisini almashtirmaydi.
- **Манба:** v2 Q15 · RD-5 (kunlik/haftalik/oylik)
- **action:** NTF (op=ntf.report.triRhythm)
- **⤳ Ta'sир:** Cron (3 ritm), Director, Reports

### EP-NTF-046 · Smenalik hisobot (smena texnologi → bosh rejalashtiruvchi)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har smena oxirida texnologga eslatma + tayyor bo'lsa bosh rejalashtiruvchiga avtomatik yo'naltirish — zanjirga mos. Kechikishlar sababini saqlaydi.
- **Манба:** v2 Q16 · RD-5
- **action:** NTF (op=ntf.shift.report)
- **⤳ Ta'sир:** PP (rejalashtirish), MES (smena)

### EP-NTF-047 · Xom-ashyo yetishmasligi → bosh rejalashtiruvchiga darhol signal
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Zaxira yetmasa darhol bosh rejalashtiruvchiga + ta'minot bo'limiga signal — zanjirga mos. Kechiksa ishlab chiqarish to'xtaydi.
- **Манба:** v2 Q17 · RD-5
- **action:** NTF (op=ntf.material.shortage)
- **⤳ Ta'sир:** Ombor ↔ Rejalashtirish (PP) ↔ Ta'minot (MM)

### EP-NTF-048 · Roxler (jihoz) nosozligi — darhol xabar belgisi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Jihoz nosozligi → bo'lim boshlig'iga eng yuqori ustuvor signal (boshqa xabarlar ustida) — to'g'ri ustuvorlik. (EP-NTF-072 KRITIK darajasiga kiradi.)
- **Манба:** v2 Q18 · RD-5 (Roxler) · IoT
- **action:** NTF (op=ntf.equipment.fault)
- **⤳ Ta'sир:** IoT (stanok), MES, texnik xizmat

### EP-NTF-049 · Kechikish/uzilish xavfi — "darhol xabardor qilish" tugmasi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Bitta "kechikish xavfi" tugmasi → bo'lim boshlig'iga darhol + qayd (kim, qachon, qaysi buyurtma) — oddiy va tez. Hujjat "ўз вақтида хабар бермаслик"ni jazolanadigan kamchilik deydi.
- **Манба:** v2 Q19 · RD-5
- **action:** NTF (op=ntf.delayRisk.button)
- **⤳ Ta'sир:** MES, PP, Org-struktura

### EP-NTF-050 · "O'z vaqtida xabar bermaslik" kamchiligini bot qayd qilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Muammo yuzaga kelgan vaqt vs xabar berilgan vaqt farqi qayd; kechikkan xabarlar oylik KPI'da — o'lchanadi. Hujjatда nomi aniq aytilgan jazolanadigan xatti-harakat.
- **Манба:** v2 Q20 · RD-5
- **action:** NTF (op=ntf.lateReport.measure)
- **⤳ Ta'sир:** HR/KPI

### EP-NTF-051 · Bitrix24 kartochka status o'zgarishi → avtomatik bildirishnoma
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har status o'zgarishida keyingi bosqich masъuliga avtomatik signal (status nomi bilan) — zanjir uzilmaydi. (v1 Q24/EP-NTF-024 oltin-ip bilan birlashadi.)
- **Манба:** v2 Q21 · Bitrix24/CRM kartochka lug'ati
- **action:** NTF (op=ntf.card.statusChange)
- **⤳ Ta'sир:** CRM/Dizayn ↔ Ishlab chiqarish (oltin-ip), Kanban

### EP-NTF-052 · Kartochka "Тасдиқда" statusida tasdiq kutilayotgan signal
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Tasdiqlovchiga darhol + belgilangan vaqtdan keyin qayta eslatma → keyin yuqoriga — nazorat. Tasdiq bosqichida ishlar qotib qoladi.
- **Манба:** v2 Q22 · CRM kartochka (Тасдиқда)
- **action:** NTF (op=ntf.card.approvalWait)
- **⤳ Ta'sир:** CRM, Kanban, eskalatsiya

### EP-NTF-053 · Texnik topshiriq (ТТ) to'liqsiz kelganда dizaynerga signal
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) ТТ kiritilganда majburiy maydonlar tekshiriladi; bo'sh bo'lsa savdoga "to'ldiring" signali, dizaynerga ish berilmaydi — oldini olish. To'liqsiz ТТ qayta ishlash/kechikishga olib keladi.
- **Манба:** v2 Q23 · CRM lug'ati (ТТ tarkibi)
- **action:** NTF (op=ntf.tt.incomplete)
- **⤳ Ta'sир:** CRM/Savdo ↔ Dizayn

### EP-NTF-054 · Korrektor xato topganда dizaynerga darhol xabar
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Korrektor xatosi → dizaynerga darhol + kartochka keyingi bosqichga o'tishi bloklanadi (tuzatilmaguncha) — qattiq. Kitobdagi aniq muammo (maket tuzatilmay ishlab chiqarishga ketgan).
- **Манба:** v2 Q24 · kitob misoli (korrektor)
- **action:** NTF (op=ntf.corrector.block)
- **⤳ Ta'sір:** Dizayn, QC, Kanban (blok)

### EP-NTF-055 · Dizayner rahbarni chetlab fayl yuborgani signali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Fayl tasdiq belgisisiz yuborilsa → bo'lim rahbariga signal + qayd — nazorat. Kitobdagi muammo (tasdiqsiz fayl ishlab chiqarishga ketgan).
- **Манба:** v2 Q25 · kitob misoli (dizayner)
- **action:** NTF (op=ntf.file.unapproved)
- **⤳ Ta'sір:** Dizayn, Org-struktura (manager_id)

### EP-NTF-056 · Og'zaki reja "rasmiy berilgan" deb hisoblanmasligi ogohlantirishi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Yozma qayd yo'q rejaga "rasmiy emas" belgisi + tegishliga ogohlantirish — hujjatga mos. "Оғзаки хабар... режани расмий берилган деб ҳисоблаш учун асос бўлмайди".
- **Манба:** v2 Q26 · RD-5/Оргополитика
- **action:** NTF (op=ntf.plan.notFormal)
- **⤳ Ta'sір:** PP (reja), Kanban

### EP-NTF-057 · Reja o'zgarishi → barcha bog'liq bo'limga e'lon (gorizontal)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Reja o'zgarishi → bog'liq bo'limlarga avtomatik e'lon + ko'rgani qayd — gorizontal kommunikatsiyaga mos. "Оргсхемадаги жойлашувига мувофиқ тегишли бўлимлар билан келишиб режалаштириш".
- **Манба:** v2 Q27 · Оргополитика (gorizontal)
- **action:** NTF (op=ntf.plan.broadcast)
- **⤳ Ta'sір:** PP ↔ barcha bog'liq bo'lim, Coordination (workflow_rules)

### EP-NTF-058 · Аналитик kommunikatsiya: Совершенствование xulosalari kanali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Analitik xabarlar alohida belgi/kanal bilan, faqat Совершенствование bo'limidan chiqadi — hujjatga mos. Tahlil/xulosa oddiy operatsion xabardan farq qiladi.
- **Манба:** v2 Q28 · Оргополитика (аналитик kommunikatsiya)
- **action:** NTF (op=ntf.analytic.channel)
- **⤳ Ta'sір:** Совершенствование, Director, Reports

### EP-NTF-059 · Brak holatida "shu joyda hal qilish" tartibi (kanal cheklash)
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) Brak signali → tabiati bo'yicha to'g'ri rolга (texnik → texnolog, mijoz → savdo); har rol faqat o'z vakolati doirasida javob beradi. Оргополитика "Савдо менежери муаммони эшитади, лекин техник ечим топмайди" — aniq rol cheklash hujjatда.
- **Манба:** v2 Q29 · Оргополитика (brak ideal manzarasi)
- **action:** NTF (op=ntf.defect.routeByRole)
- **⤳ Ta'sір:** QC ↔ Savdo ↔ Ishlab chiqarish (EP-NTF-039 bilan birga)

### EP-NTF-060 · Shikastlangan xom-ashyo aniqlanganда xabar tartibi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Shikast belgilanganда → ta'minot/rahbarga darhol + material "karantin" belgisi (ishlatilmaydi) — to'liq. Shikastlangan material ishlab chiqarishga o'tib ketmasin.
- **Манба:** v2 Q30 · kitob savoli (shikastlangan xom-ashyo)
- **action:** NTF (op=ntf.material.damaged)
- **⤳ Ta'sір:** Ombor ↔ Sifat (karantin) ↔ Ta'minot (MM)

### EP-NTF-061 · Eslatma turlari ro'yxati (digest/signal/muddat/tasdiq/qaror)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Har tur o'z belgisi bilan (🔴 signal / ⏰ muddat / ✅ tasdiq / 📋 qaror / 📊 digest) — aniq farq. Xodim shoshilinch/oddiyni bir qarashda ajratsin.
- **Манба:** v2 Q31
- **action:** NTF (op=ntf.type.badges)
- **⤳ Ta'sір:** Design-system (token/belgi), i18n

### EP-NTF-062 · Alert ustuvorlik darajalari (jihoz > kechikish > oddiy)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) 3 daraja: KRITIK (jihoz/to'xtash) → MUHIM (kechikish/muddat) → ODDIY (hisobot/digest) — tartibli. "Darhol" turdagi xabar oddiy hisobot orasida ko'milmasin.
- **Манба:** v2 Q32 · RD-5 ("дарҳол" turlari)
- **action:** NTF (op=ntf.priority.levels)
- **⤳ Ta'sір:** EP-NTF-063 (tinchlik istisnosi), EP-NTF-048/029

### EP-NTF-063 · "Darhol" xabarlar tinchlik vaqti (тун) cheklovidan ozodmi
- **Holat:** ✅ JAVОБЛАНГАН
- **Javob/Tавсiya:** A) Faqat KRITIK darajadagi signal tunda o'tadi, qolganlari ertalabga kechiktiriladi — muvozanat. RD-5 tungi smenani aniq tan oladi (RD-4 tunda javob shart) — KRITIK istisnoni hujjat asoslaydi. (Q140 bilan birga: tinchlik oynasini egasi sozlaydi.)
- **Манба:** v2 Q33 · RD-5 (tungi protokol) · ShVB Q140
- **action:** NTF (op=ntf.quiet.criticalException)
- **⤳ Ta'sір:** EP-NTF-018 (tinchlik), EP-NTF-035 (tungi protokol)

### EP-NTF-064 · Muddat eslatmasining ikki bosqichi (oldindan + o'tганда)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Muddatga yaqin oldindan eslatma + o'tib ketsa rahbarga signal — ikki bosqich. (15 daqiqa/1 soat/1 kun/kun yakuni muddatlari uchun yagona qoida; EP-NTF-025/033/034 bilan izchil.)
- **Манба:** v2 Q34 · RD-5 (muddatlar)
- **action:** NTF (op=ntf.deadline.twoStage)
- **⤳ Ta'sір:** PP, Kanban, barcha muddat-signal

### EP-NTF-065 · Departament-darajasida umumlashtirilgan hisobot (vertikal)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Yuqoriga chiqqanda darajaga ko'ra umumlashadi (operator detali → bo'lim xulosasi → departament xulosasi) — Vysotskiy modeli. "Раҳбарлар маълумотни 5-департамент даражасида умумлаштириб тақдим қилади".
- **Манба:** v2 Q35 · Оргополитика · org_structure_vysotskiy7
- **action:** NTF (op=ntf.report.aggregateVertical)
- **⤳ Ta'sір:** Org-struktura, Director, Reports

### EP-NTF-066 · Masъuliyat lavozimga bog'langan (xodimga emas) yo'naltirish
- **Holat:** ✅ JAVОБЛАНГАН (egasi karta-model vizyoni bilan)
- **Javob/Tавсiya:** A) Xabar lavozimga (kartaga) yuboriladi → joriy egasiga yetkaziladi; xodim almashsa avtomatik yangi egaga. Оргополитика "Масъулият бўлимга эмас, лавозимга боғланади" + egasi KARTA-markazli model (karta asosiy, xodim ikkilamchi) — A'ni majburlaydi.
- **Манба:** v2 Q36 · Оргополитика · org_card_centric_model
- **action:** NTF (op=ntf.route.byCard)
- **⤳ Ta'sір:** Org-struktura (karta-model) ↔ HR

### EP-NTF-067 · Masъuliyatni og'zaki o'tkazish taqiqiga rioya
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Masъuliyat o'tkazish faqat rasmiy yozma topshiriq orqali; og'zaki o'tkazma qayd etilmaydi — hujjatga mos. "Масъулиятни бошқа шахсга оғзаки ўтказишга йўл қўйилмайди".
- **Манба:** v2 Q37 · Оргополитика
- **action:** NTF (op=ntf.responsibility.writtenOnly)
- **⤳ Ta'sір:** Coordination, Audit-log

### EP-NTF-068 · Oylik masъuliyat tahlili digesti (Совершенствование)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Oy yakunida masъuliyat digesti (qaror → masъul → natija) Совершенствование va departament rahbariga — hujjatga mos. "Ҳар ой якунида... жавобгарлик ҳолати таҳлил қилинади".
- **Манба:** v2 Q38 · Оргополитика
- **action:** NTF (op=ntf.monthly.responsibilityDigest)
- **⤳ Ta'sір:** Совершенствование, Director, HR/KPI

### EP-NTF-069 · Rasmiy ma'lumot talabi (Совершенствование → bo'lim, muddat bilan)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Rasmiy ma'lumot talabi → bo'lim boshlig'iga signal + muddat taymeri + kechiksa eslatma — nazorat. Ma'lumot kechiksa butun oylik tahlil kechikadi.
- **Манба:** v2 Q39 · Оргополитика
- **action:** NTF (op=ntf.dataRequest.deadline)
- **⤳ Ta'sір:** Совершенствование, Reports

### EP-NTF-070 · Eski ma'lumot ustida ishlash ogohlantirishi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Hujjat/reja yangilansa, eski versiyani ochganlarga "yangilangan, qarang" signali — oldini olish. "Эски маълумот устида ишлашга йўл қўйилмайди".
- **Манба:** v2 Q40 · Оргополитика
- **action:** NTF (op=ntf.staleData.warn)
- **⤳ Ta'sір:** Ishlab chiqarish (tex-karta versiyalari) ↔ Dizayn

### EP-NTF-071 · Yig'ilish topshiriqlari uchun eslatma (muddat bilan)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Yig'ilish topshirig'i kiritilsa, masъulga muddat eslatmasi + bajarilmasa rahbarga signal — nazorat. Yig'ilish topshiriqlari tez-tez unutiladi.
- **Манба:** v2 Q41 · RD-5 (yig'ilish topshiriqlari)
- **action:** NTF (op=ntf.meeting.taskReminder)
- **⤳ Ta'sір:** Coordination, Kanban

### EP-NTF-072 · Telefon-qo'ng'iroq qaydini bot saqlasinmi (tungi protokol)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Bot "qo'ng'iroq qildim" tugmasi → vaqt qayd; qarshi tomon "javob berdim" tasdig'i — ikki tomonli qayd. Tunda telefon ishlatiladi, "qildim/qilmagansan" bahsi chiqmasin.
- **Манба:** v2 Q42 · RD-5 (tungi telefon protokoli)
- **action:** NTF (op=ntf.call.log)
- **⤳ Ta'sір:** EP-NTF-035 (tungi protokol), HR/masъuliyat

### EP-NTF-073 · Buyurtma to'liq tugamasdan reja o'zgartirilsa signal
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Buyurtma tugamay reja o'zgartirilsa → qayd + sabab so'raladi + oylik tahlilga kiradi — o'lchanadi. Yarim qoldirilgan buyurtma dastgoh qayta sozlash/vaqt yo'qotishga olib keladi.
- **Манба:** v2 Q43 · RD-5
- **action:** NTF (op=ntf.plan.midOrderChange)
- **⤳ Ta'sір:** PP ↔ Ishlab chiqarish samaradorligi (oylik tahlil)

### EP-NTF-074 · Kanban doskasidagi qotib qolgan kartochkaga signal
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Kartochka statusда belgilangan vaqtdan ko'p qotsa → masъulga + bo'lim boshlig'iga signal — nazorat. Qotgan kartochka ko'rinadi lekin hech kim chuqurlashmaydi.
- **Манба:** v2 Q44 · CRM lug'ati (Kanban doskasi)
- **action:** NTF (op=ntf.kanban.stuck)
- **⤳ Ta'sір:** Kanban, Coordination

### EP-NTF-075 · Buyurtma bajarilishi hisoboti (RD-5 → rahbariyat)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Buyurtma yopilganда avtomatik bajarilish hisoboti (reja/fakt/kechikish/sabab) rahbariyatga — to'liq. Har buyurtma yakuni hisobotsiz o'tib ketmasin.
- **Манба:** v2 Q45 · RD-5
- **action:** NTF (op=ntf.order.completionReport)
- **⤳ Ta'sір:** SD (buyurtma), Reports, Director

### EP-NTF-076 · Bir bo'lim ikkinchisining vazifasiga aralashganда signal (gorizontal chegara)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Vakolatdan tashqari qaror → tegishli bo'lim boshlig'iga signal + qayd — chegara himoyasi. "Бир бўлим иккинчи бўлим вазифасига аралашмайди".
- **Манба:** v2 Q46 · Оргополитика
- **action:** NTF (op=ntf.scope.violation)
- **⤳ Ta'sір:** Org-struktura, Coordination (gorizontal)

### EP-NTF-077 · Adaptatsiya (o'qitish) yakunlanganini bot tasdiqlasinmi
- **Holat:** ✅ JAVОБЛАНГАН (egasi ShVB Q55/Q47-jarayon bilan)
- **Javob/Tавсiya:** A) Har xodim yangi оргополитика/yo'riqnomani o'qib tasdiqlaydi; tasdiqlamaganlar НО-3'ga ko'rinadi — qayd. Kitob har bo'lim oxirida "ўқиб чиққанингизни тасдиқланг" talab qiladi. Egasi ShVB Q55 "Telegram xabar + ERP tasdiqlash" — A'ni tasdiqlaydi.
- **Манба:** v2 Q47 · kitob (har vazifa oxirida tasdiq) · ShVB Q55
- **action:** NTF (op=ntf.adaptation.confirm)
- **⤳ Ta'sір:** HR/adaptatsiya ↔ Ta'lim (LMS)

### EP-NTF-078 · Smenalararo topshirish (peshma-pesh) bildirishnomasi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Smena yakunida ochiq ishlar/muammolar ro'yxati avtomatik keyingi smenaga + texnologga yetkaziladi — uzilishsiz. Smena almashganда ochiq muammo yo'qolmasin.
- **Манба:** v2 Q48 · kitob (3 smena tizimi)
- **action:** NTF (op=ntf.shift.handover)
- **⤳ Ta'sір:** MES (smena), PP

### EP-NTF-079 · "Kim-nima-oladi" matritsasini egasi ko'rib chiqsinmi (kanal xaritasi)
- **Holat:** ✅ JAVОБЛАНГАН (egasi-qaror darvozasi)
- **Javob/Tавсiya:** A) Egasi/rahbar ko'radigan yagona "hodisa → lavozim → kanal" jadvali, undan barcha yo'naltirish kelib chiqadi — yagona haqiqat. Оргополитика ideali "Ким, қачон, қандай масалада ва қайси канал орқали мулоқот қилиши аниқ белгиланган". Bu jadval Q140 (egasi vaqt/kanal sozlaydi) bilan birga NTF marshrutining markazi — egasi tasdig'idan o'tadi.
- **Манба:** v2 Q49 · Оргополитика (kommunikatsiya matritsasi) · ShVB Q140
- **action:** NTF (op=ntf.routingMatrix.owner)
- **⤳ Ta'sір:** BARCHA modul (bildirishnoma marshrutining markaziy jadvali)

### EP-NTF-080 · "Ma'lumot yo'qolmaydi" kafolati — har xabar arxivga tushsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Rasmiy xabar/qaror/sifat natijasi o'chirilmaydigan arxivга tushadi, qidirish mumkin; oddiy chat o'chsa ham bu qoladi — hujjatga mos. "Барча муҳим қарорлар ёзма қайд этилган, маълумот йўқолмайди" + "ОТК натижалари ўчирилмайди".
- **Манба:** v2 Q50 · Оргополитика
- **action:** NTF (op=ntf.archive.immutable)
- **⤳ Ta'sір:** Sifat (ОТК arxivi) ↔ Совершенствование (tahlil manbai), Audit-log

### EP-NTF-081 · Brak/xato statistikasi haftalik digestда bo'lim kesimida
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Haftalik digestда bo'lim kesimida xato soni + takrorlanganlari belgilanган — manba ko'rinadi. Takroriy xato manbasi ko'rinmasa, оргополитика yozish (EP-NTF-043) kimga kerakligi bilinmaydi.
- **Манба:** v2 Q51 · kitob (xato bo'limga biriktiriladi)
- **action:** NTF (op=ntf.defect.weeklyStats)
- **⤳ Ta'sір:** Sifat ↔ HR/KPI ↔ Совершенствование

### EP-NTF-082 · Ko'rilmagan muhim xabar uchun qayta-yuborish jadvali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tавсiya:** A) Muhim xabar ko'rilmasa 2 marta qayta (belgilangan oraliqda), keyin yuqoriga eskalatsiya — muvozanat. Bir marta yetarli emas, cheksiz takror bezovta qiladi. (EP-NTF-016 ack + EP-NTF-017 eskalatsiya bilan birga.)
- **Манба:** v2 Q52
- **action:** NTF (op=ntf.resend.schedule)
- **⤳ Ta'sір:** EP-NTF-016 (ack), EP-NTF-017 (eskalatsiya)

---

> **Yakuniy hisob:** v1=30 (EP-NTF-001..030) + v2=52 (EP-NTF-031..082) = **82**.
> ✅ JAVOBЛАНГАН = **18** (001, 003, 007, 015, 019, 031, 033, 034, 035, 036, 039, 040, 042, 059, 063, 066, 077, 079).
> 🔵 OCHIQ (A-default) = **64**.
> **Egasi-qaror o'qlari:** per-modul bot (Q50/Q101/Q102) · vaqt-sozlanadigan (Q140) · Telegraf.js (Q152) · ShVB 4 komanda (YO'NALISH 38) · v2 kitob-grounded savollar Оргополитика/RD-5 hujjatining o'zi javob.
