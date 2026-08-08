# EP-KAN — Kanban / Vazifalar — QAROR XARITASI (Decision Map)

> Jami **107** savol (v1: Q1–Q30 = 30 ta · v2 generic: Q1–Q55 = 55 ta · v2 kitob-grounded: K1–K52 = 22... = 52 ta) → **EP-KAN-001 … EP-KAN-137**.
> Har savol: ✅ JAVOBLANGAN (manba bilan) yoki 🔵 OCHIQ (A-default tavsiya — birinchi variant vizyonga eng mos).
> Modul kodi = **KAN** (raqamlash: `LOYIHA-BITGAN-XOLAT-2026-06-08.md` B-bo'lim). Modul og'irligi = **T3 (qo'llab-quvvatlovchi)** — ko'pi mavjud yoki sodda.
> ⭐ MUHIM ULANISH: 3-savat (incoming/pending/outgoing) hozir **Communication Center**'da BOR — `cc_documents.basket_state` ('inbox'/'pending'/'outbox') + `basket_owner_user_id` + harakat-tarixi + 24h SLA cron (`cc-sla.cron.ts`). Kanban 3-savati shu CC infratuzilmasiga ulanadi (qaytadan qurmasdan). Manba: `cc-baskets.repo.ts`.
> Manbalar: ShVB YO'NALISH 19 (3-savat) + 20 (Персональная программа) = `SHvB-40-Yonalish-Prompt.md`; Q134 rekruting-kanban 7-bosqich = `EUROPRINT_BARCHA_JAVOBLAR.md`.

**XULOSA:** Jami 137 — ✅ javoblangan **9**, 🔵 ochiq **128**. Javoblangan yadrolar: 3-savat tizimi (CC `basket_state` LIVE) · 24h cron (CC SLA cron LIVE) · shaxsiy dastur soatlik+rollover (ShVB Y19/Y20 build-prompt) · rekruting-kanban 7-bosqich + AI (Q134). Qolgan 128 = A-default (egasi tasdig'i kutiladi, qurishdan oldin).

---

## I QISM — v1 SAVOLLAR (yuqori daraja, Q1–Q30)

### EP-KAN-001 · 3-savat qaysi modulda yashaydi (v1-Q1)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3-savat = har xodimning shaxsiy "ish stoli", Kanban taxtalari uning ichidan ochiladi (yagona kirish nuqtasi). ⚠️ Texnik: savat MA'LUMOTI CC `basket_state`'da, Kanban shu ustidan birlashgan ko'rinish beradi.
- **Manba:** A-default; ShVB Y19; CC `cc-baskets.repo.ts` (mavjud infratuzilma)
- **action:** READ (`basket.unifiedDesktop`)
- **⤳ Ta'sir:** Communication Center (savat manbasi), Org (xodim ish stoli)

### EP-KAN-002 · Savatga nima tushadi (v1-Q2)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — hammasi: menga tegishli har qanday vazifa, doklad, rasporyajenie, tasdiq so'rovi, @belgilash, eslatma → bitta Kiruvchi savat.
- **Manba:** A-default; ShVB Y19
- **action:** EVENT (`basket.inboxRoute`)
- **⤳ Ta'sir:** Coordination (doklad/rasporyajenie), CC, NTF

### EP-KAN-003 · 24 soat qoidasi qanday ishlaydi (v1-Q3)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 24 soatda qizil belgi + egasiga eslatma, 48 soatda boshliqqa eskalatsiya (bosqichli bosim). Cron MAVJUD.
- **Manba:** ShVB Y19 ("Cron: kuniga bir marta 24 soatdan oshgan INCOMING uchun egasiga eslatma"); CC `cc-sla.cron.ts` (24h/48h SLA LIVE)
- **action:** CRON (`basket.overdue.escalate`)
- **⤳ Ta'sir:** Org (manager_id zanjiri), NTF

### EP-KAN-004 · 24 soat ish vaqtimi yoki astronomik (v1-Q4)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat ish soatlari + ish kunlari (kalendar + smena jadvali) — adolatli. ⚠️ smena jadvali bog'liqligi (HR) kerak.
- **Manba:** A-default
- **action:** CRON (`basket.overdue.workhours`)
- **⤳ Ta'sir:** HR (smena jadvali), Ishlab chiqarish (3 smena)

### EP-KAN-005 · "Kutilmoqda" savatining ma'nosi (v1-Q5)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "men boshqadan javob/natija kutyapman" (kim kutilayotgani + muddat ko'rsatiladi → to'siqni ochib beradi).
- **Manba:** A-default; CC `basket_state='pending'` (mavjud)
- **action:** UPDATE (`basket.moveToPending`)
- **⤳ Ta'sir:** CC, Coordination

### EP-KAN-006 · Chiquvchidan keyin nima bo'ladi (arxiv) (v1-Q6)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 24 soatdan keyin avtomat arxivga, lekin Tarix/Arxiv bo'limidan doim qidirib topiladi (toza savat + saqlangan tarix).
- **Manba:** A-default; CC harakat-tarixi jadvali (mavjud)
- **action:** CRON (`basket.outbox.archive`)
- **⤳ Ta'sir:** CC, Hisobotlar

### EP-KAN-007 · Shaxsiy dastur — kunlik soatlik ko'rinish (v1-Q7)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — kunlik soatlik grid (09:00…18:00) + har vazifaga vaqt (to'liq ShVB modeli). Build-prompt mavjud.
- **Manba:** ShVB Y20 ("PersonalProgram.tsx: Kunlik dastur — soat bo'yicha grid")
- **action:** CREATE (`personalProgram.daily`)
- **⤳ Ta'sir:** HR (kunlik reja), Hisobotlar (reja vs fakt)

### EP-KAN-008 · Rollover (bajarilmagan vazifa ertangi kunga) (v1-Q8)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomat ertangi kunga ko'chadi + "necha marta ko'chgan" sanagich (surunkali kechikish ko'rinadi). Rollover mantig'i build-prompt'da.
- **Manba:** ShVB Y20 (`rolledOverFrom` maydon + "rollover: bajarilmagan task ertangi kunga o'tadi")
- **action:** CRON (`personalProgram.rollover`)
- **⤳ Ta'sir:** Hisobotlar, HR

### EP-KAN-009 · Rollover necha martagacha (v1-Q9)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3 marta ko'chgach majburan boshliqqa ko'rinadi / "qayta rejalashtir" so'raydi (intizom).
- **Manba:** A-default; ShVB Y20 (rollover bor, chegara A-default)
- **action:** CRON (`personalProgram.rollover.limit`)
- **⤳ Ta'sir:** HR, Org (boshliq)

### EP-KAN-010 · Shaxsiy dastur ustuvorligi (rang kodi) (v1-Q10)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 3 daraja: Yuqori=qizil, O'rta=sariq, Past=yashil (sodda, ShVB ga mos). Build-prompt'da aniq.
- **Manba:** ShVB Y20 ("Ustunlik rangi: Yuqori=qizil, O'rta=sariq, Past=yashil")
- **action:** UPDATE (`task.priority.color`)
- **⤳ Ta'sir:** Butun Kanban UI

### EP-KAN-011 · Soat-blok (vaqt rejalashtirish) majburiymi (v1-Q11)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ixtiyoriy: yozsa kun-yuklamasi ko'rsatiladi, yozmasa oddiy ro'yxat (moslashuvchan).
- **Manba:** A-default
- **action:** UPDATE (`task.estimateTime`)
- **⤳ Ta'sir:** Shaxsiy dastur, Hisobotlar

### EP-KAN-012 · Vazifa kim tomonidan beriladi (v1-Q12)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — hamma yo'l: boshliq→bo'ysunuvchi, o'ziga, gorizontal (hamkasbga) — gorizontal so'rov qabul/rad qilinadi.
- **Manba:** A-default; Org gorizontal harakat (workflow_rules)
- **action:** CREATE (`task.assign`)
- **⤳ Ta'sir:** Org (gorizontal), Coordination

### EP-KAN-013 · Vazifani qabul qilish/rad etish (v1-Q13)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: qabul/rad (rad sababi majburiy) qadami bor (aniq mas'uliyat).
- **Manba:** A-default
- **action:** APPROVE/REJECT (`task.accept`)
- **⤳ Ta'sir:** HR (mas'uliyat), NTF

### EP-KAN-014 · Vazifa karta-modeliga bog'lanadimi (v1-Q14)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: vazifa ixtiyoriy ravishda lavozim-kartaga/GSD ga bog'lanadi, bajarilsa GSD ga avtomat hissa (karta-markazli vizyonga to'liq mos).
- **Manba:** A-default; karta-markazli model (`project_org_card_centric_model`)
- **action:** UPDATE (`task.linkCard`)
- **⤳ Ta'sir:** Org (KARTA/GSD), KPI

### EP-KAN-015 · Taxta (board) tuzilishi (v1-Q15)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — standart 4 ustun (Reja / Jarayonda / Tekshiruvda / Bajarildi) hammaga, lekin bo'lim qo'sha oladi (tartib + moslashuv).
- **Manba:** A-default
- **action:** CREATE (`board.columns`)
- **⤳ Ta'sir:** Hamma bo'lim taxtalari

### EP-KAN-016 · Taxta kimga tegishli (qamrov) (v1-Q16)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — uch tur: shaxsiy + bo'lim + loyiha taxta (keng qamrov).
- **Manba:** A-default
- **action:** CREATE (`board.scope`)
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik (ko'rinish)

### EP-KAN-017 · Observer (kuzatuvchi) roli (v1-Q17)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: vazifaga ko'p kuzatuvchi, ular faqat o'qiydi + bildirishnoma oladi (o'zgartira olmaydi). ⚠️ `kanban_observers` jadval mavjud.
- **Manba:** A-default; `schema-kanban.ts` (kanban_observers)
- **action:** CREATE (`task.addObserver`)
- **⤳ Ta'sir:** NTF, Org

### EP-KAN-018 · Observer kim bo'la oladi va avtomat qo'shiladimi (v1-Q18)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ikkalasi: qo'lda qo'shish + yuqori ustuvorlikdagi vazifaga boshliq avtomat kuzatuvchi.
- **Manba:** A-default; Org manager_id zanjiri
- **action:** EVENT (`task.autoObserver`)
- **⤳ Ta'sir:** Org-struktura

### EP-KAN-019 · Eslatma (reminder) turlari (v1-Q19)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ilova ichida + Telegram (egasi tanlaydi qaysi kanalda) — keng qamrov.
- **Manba:** A-default; ShVB Telegram asosiy kanal
- **action:** EVENT (`reminder.channel`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram), NTF

### EP-KAN-020 · Eslatma qachon yuboriladi (v1-Q20)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3 holat: yangi vazifa keldi + muddatga 1 kun qoldi + muddat o'tdi (yetarli, shovqinsiz).
- **Manba:** A-default
- **action:** CRON (`reminder.trigger`)
- **⤳ Ta'sir:** NTF, AI Integratsiya

### EP-KAN-021 · Shaxsiy eslatma (savatsiz) (v1-Q21)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: sana+vaqtli shaxsiy eslatma, faqat o'ziga ko'rinadi (to'liq ish stoli).
- **Manba:** A-default
- **action:** CREATE (`reminder.personal`)
- **⤳ Ta'sir:** Shaxsiy dastur

### EP-KAN-022 · Takrorlanuvchi vazifa (v1-Q22)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: kunlik/haftalik/oylik takror shabloni, belgilangan kunda avtomat shaxsiy dasturga tushadi (ritm).
- **Manba:** A-default; ShVB Y20 (odat ishlar)
- **action:** CRON (`task.recurring`)
- **⤳ Ta'sir:** HR (haftalik reja), Coordination

### EP-KAN-023 · Vazifa bo'limlararo (gorizontal) o'tkazish (v1-Q23)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — boshqa bo'limga uzatilgan vazifa o'sha bo'lim boshlig'ining Kiruvchi savatiga tushadi + iz qoladi (kim kimga uzatdi) — shaffof.
- **Manba:** A-default; Org gorizontal harakat (workflow_rules)
- **action:** UPDATE (`task.transferDept`)
- **⤳ Ta'sir:** Org (gorizontal), CC

### EP-KAN-024 · Doklad / Rasporyajenie bilan bog'lanish (v1-Q24)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: rasporyajenie chiqarilsa, ijrochining Kiruvchi savatiga avtomat vazifa tug'iladi va bog'lanadi (qaror→ijro yopiq).
- **Manba:** A-default; Coordination doklad/rasporyajenie oqimi
- **action:** EVENT (`task.fromRasporyajenie`)
- **⤳ Ta'sir:** Coordination, CC

### EP-KAN-025 · Vazifa statuslari ro'yxati (master-data) (v1-Q25)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — to'liq oqim: Yangi → Qabul qilindi → Jarayonda → Tekshiruvda → Bajarildi (+ Bekor/Rad) — aniq nazorat.
- **Manba:** A-default
- **action:** CREATE (`task.status.master`)
- **⤳ Ta'sir:** Hisobotlar, butun zavod

### EP-KAN-026 · Vazifa muddati o'tganda (kechikish) kim ko'radi (v1-Q26)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — xodimga qizil + boshlig'iga "bo'ysunuvchingizda kechikkan ish bor" xabari (vertikal nazorat).
- **Manba:** A-default; Org manager_id zanjiri
- **action:** CRON (`task.overdue.escalate`)
- **⤳ Ta'sir:** Org, NTF

### EP-KAN-027 · Bajarilgan ishni boshliq tasdiqlaydimi (v1-Q27)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yuqori ustuvorlik/topshiriq vazifalari boshliq tasdig'i bilan yopiladi, oddiylari avtomat (balans).
- **Manba:** A-default
- **action:** APPROVE (`task.closeApproval`)
- **⤳ Ta'sir:** HR, Coordination

### EP-KAN-028 · Kanban va shaxsiy dastur o'rtasida bog'liqlik (v1-Q28)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomat: taxtadan menga tegishli vazifa shaxsiy dasturga ham tushadi, xodim vaqt belgilaydi (yagona ko'rinish).
- **Manba:** A-default; ShVB Y20 ("Kanban vazifalari avtomatik soatlarga taqsimlanadi")
- **action:** EVENT (`task.toPersonalProgram`)
- **⤳ Ta'sir:** Shaxsiy dastur

### EP-KAN-029 · Vazifaga fayl/izoh biriktirish (v1-Q29)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: fayl + izoh tasmasi (kim qachon yozdi) vazifa ichida (to'liq kontekst). ⚠️ card-files mavjud.
- **Manba:** A-default; `schema-kanban.ts` (card-files)
- **action:** CREATE (`task.attachment`)
- **⤳ Ta'sir:** Sifat, Ombor (saqlash)

### EP-KAN-030 · Kunlik/haftalik shaxsiy hisobot (v1-Q30)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha: kunlik mini-yakun + haftalik "bajarildi/ko'chdi/kechikdi" hisoboti, GSD ga ulanadi (vizyonga mos).
- **Manba:** A-default; ShVB Y20
- **action:** READ (`report.dailyWeekly`)
- **⤳ Ta'sir:** KPI/GSD, HR

---

## II QISM — v2 GENERIC SAVOLLAR (granular, Q1–Q55)

### EP-KAN-031 · Savatlar (ustunlar) ro'yxati va tartibi (v2-Q1)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3 savat: "Bajariladi" → "Jarayonda" → "Bajarildi" (sodda, hamma tushunadi).
- **Manba:** A-default
- **action:** CREATE (`board.basketOrder`)
- **⤳ Ta'sir:** Butun Kanban

### EP-KAN-032 · Oldinga o'tish (savatdan savatga) kim huquqli (v2-Q2)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat mas'ul (ijrochi) suradi, "Bajarildi"ni boshliq tasdiqlaydi (nazorat saqlanadi).
- **Manba:** A-default
- **action:** UPDATE (`task.moveBasket.permission`)
- **⤳ Ta'sir:** HR (intizom), Hisobotlar

### EP-KAN-033 · Orqaga qaytarish qoidasi (Jarayonda → Bajariladi) (v2-Q3)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mumkin, lekin sabab majburiy va tarixga yoziladi (shaffof).
- **Manba:** A-default
- **action:** UPDATE (`task.moveBack`)
- **⤳ Ta'sir:** Hisobotlar

### EP-KAN-034 · "Bajarildi"dan qaytarib ochish (qayta ochish) (v2-Q4)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat boshliq qayta ochadi, sabab majburiy, "qayta ochildi" belgisi qoladi (javobgarlik aniq).
- **Manba:** A-default
- **action:** UPDATE (`task.reopen`)
- **⤳ Ta'sir:** Hisobotlar, HR

### EP-KAN-035 · Bir savatdan ikkitasini o'tkazib yuborish (sakrash) (v2-Q5)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sakrash taqiqlanadi, vazifa albatta "Jarayonda"dan o'tadi (vaqt o'lchanadi).
- **Manba:** A-default
- **action:** UPDATE (`task.noSkip`)
- **⤳ Ta'sir:** Hisobotlar (bajarilish tezligi)

### EP-KAN-036 · "Jarayonda" savatiga o'tish sharti (v2-Q6)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ijrochi va muddat to'ldirilgan bo'lsa gina "Jarayonda"ga o'tadi (tartib).
- **Manba:** A-default
- **action:** UPDATE (`task.startGuard`)
- **⤳ Ta'sir:** HR

### EP-KAN-037 · "Bajarildi"ga o'tish sharti (yopish dalili) (v2-Q7)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kamida bitta izoh majburiy; ba'zi turlarda rasm/fayl majburiy (dalilli). Sub-qaror: rasm/fayl Sifat/ta'mirlash turlarida majburiy (1-variant).
- **Manba:** A-default
- **action:** UPDATE (`task.closeGuard`)
- **⤳ Ta'sir:** Sifat nazorati

### EP-KAN-038 · WIP chegarasi (bir paytda nechta "Jarayonda") (v2-Q8)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bir paytda ko'pi bilan 3 ta "Jarayonda" (diqqat jamlanadi).
- **Manba:** A-default
- **action:** UPDATE (`task.wipLimit`)
- **⤳ Ta'sir:** HR (intizom)

### EP-KAN-039 · O'tish vaqtini avtomatik yozib borish (v2-Q9)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har o'tish vaqti avtomatik yoziladi, qo'lda o'zgartirib bo'lmaydi (ishonchli tahlil).
- **Manba:** A-default
- **action:** EVENT (`task.transition.log`)
- **⤳ Ta'sir:** Hisobotlar, HR

### EP-KAN-040 · Eskalatsiya sababi (nima bo'lsa ko'tariladi) (v2-Q10)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vazifa muddati o'tib 24 soat bo'lsa-yu hali "Bajarildi"ga o'tmagan bo'lsa (aniq va sodda).
- **Manba:** A-default; CC SLA cron (mavjud asos)
- **action:** CRON (`task.escalation.trigger`)
- **⤳ Ta'sir:** Org, NTF

### EP-KAN-041 · 24 soat qanday sanaladi (ish vaqti yoki astronomik) (v2-Q11)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat ish vaqti sanaladi (smena jadvaliga ko'ra) — adolatli. (v1-Q4 = EP-KAN-004 bilan bir mavzu.)
- **Manba:** A-default
- **action:** CRON (`task.escalation.workhours`)
- **⤳ Ta'sir:** HR (smena jadvali), Ishlab chiqarish (3 smena)

### EP-KAN-042 · Eskalatsiya kimga boradi (ko'tarilish manzili) (v2-Q12)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ijrochining bevosita boshlig'iga (org-strukturadagi keyingi yuqori daraja) — tabiiy zanjir.
- **Manba:** A-default; Org manager_id (keyingi yuqori daraja, `project_org_structure_vysotskiy7`)
- **action:** CRON (`task.escalation.route`)
- **⤳ Ta'sir:** Org-struktura (manager_id zanjiri), NTF

### EP-KAN-043 · Ikkinchi bosqich eskalatsiya (yana 24 soat) (v2-Q13)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, yana 24 soatdan keyin keyingi yuqori darajaga ko'tariladi (zanjir bo'ylab). Sub-qaror: CEO'da to'xtaydi (1-variant).
- **Manba:** A-default; Vysotskiy-7 zanjiri
- **action:** CRON (`task.escalation.tier2`)
- **⤳ Ta'sir:** Org, DIR

### EP-KAN-044 · Eskalatsiya xabari qaysi kanaldan keladi (v2-Q14)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ERP ichida + Telegram guruhga xabar (e'tibordan chetda qolmaydi).
- **Manba:** A-default; ShVB Telegram
- **action:** EVENT (`task.escalation.channel`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram), NTF

### EP-KAN-045 · Eskalatsiya hisobi (kim necha marta) (v2-Q15)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, oylik hisobotda "eskalatsiya soni" ko'rsatkichi (intizom o'lchanadi).
- **Manba:** A-default
- **action:** READ (`task.escalation.count`)
- **⤳ Ta'sir:** HR (intizom), Oylik (KPI)

### EP-KAN-046 · Eskalatsiyani bekor qilish (noto'g'ri ko'tarilsa) (v2-Q16)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — boshliq sabab yozib yopadi, lekin tarixda qoladi (moslashuvchan, shaffof).
- **Manba:** A-default
- **action:** UPDATE (`task.escalation.dismiss`)
- **⤳ Ta'sir:** Hisobotlar

### EP-KAN-047 · Muddati yo'q vazifa eskalatsiyaga tushadimi (v2-Q17)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — muddatsiz vazifa yaratilishiga yo'l qo'yilmaydi (muddat majburiy — muammo ildizdan yo'qoladi).
- **Manba:** A-default
- **action:** CREATE (`task.deadlineRequired`)
- **⤳ Ta'sir:** Hamma Kanban

### EP-KAN-048 · Shaxsiy kunlik dastur nima asosida tuziladi (v2-Q18)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kanban vazifalari + takrorlanuvchi odat ishlar avtomatik soatlarga taqsimlanadi (yagona manba).
- **Manba:** A-default; ShVB Y20
- **action:** EVENT (`personalProgram.build`)
- **⤳ Ta'sir:** HR (kunlik reja), Hisobotlar

### EP-KAN-049 · Dastur qadami (vaqt oralig'i) (v2-Q19)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 1 soatlik bo'laklar (08:00–09:00…) — sodda va yetarli.
- **Manba:** A-default; ShVB Y20 (soat bo'yicha grid)
- **action:** CREATE (`personalProgram.slot`)
- **⤳ Ta'sir:** Shaxsiy dastur UI

### EP-KAN-050 · Reja vs Fakt taqqoslash (v2-Q20)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, kun oxirida har bo'lakda "reja/fakt/farq" ko'rinadi (o'zini-o'zi nazorat).
- **Manba:** A-default
- **action:** READ (`personalProgram.planVsFact`)
- **⤳ Ta'sir:** HR (intizom), Oylik (KPI)

### EP-KAN-051 · Dasturni kim tasdiqlaydi (v2-Q21)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ertalab boshliq bir qarab tasdiqlaydi (yoki o'zgartiradi) — yo'naltirish.
- **Manba:** A-default
- **action:** APPROVE (`personalProgram.approve`)
- **⤳ Ta'sir:** Coordination, HR

### EP-KAN-052 · Kutilmagan ish kirib qolsa (rejaga sig'masa) (v2-Q22)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yangi vazifa rejaga qo'shiladi, siljigan ishlar avtomatik keyinga suriladi va belgilanadi (haqiqatga mos).
- **Manba:** A-default
- **action:** UPDATE (`personalProgram.reflow`)
- **⤳ Ta'sir:** Shaxsiy dastur

### EP-KAN-053 · Bo'sh soatlar (rejada teshik) (v2-Q23)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bo'sh soatlar sariq belgilanadi va sababini so'raydi (bo'shliq ko'rinadi).
- **Manba:** A-default
- **action:** READ (`personalProgram.gaps`)
- **⤳ Ta'sir:** HR

### EP-KAN-054 · Takrorlanuvchi kunlik ishlar (odat vazifalar) (v2-Q24)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bir marta sozlanadi, har kuni avtomatik paydo bo'ladi (qulay).
- **Manba:** A-default; ShVB Y20
- **action:** CRON (`personalProgram.habit`)
- **⤳ Ta'sir:** Shaxsiy dastur

### EP-KAN-055 · Dastur kun oxirida yopiladimi (kunlik yakun) (v2-Q25)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kun yopilgach o'zgartirib bo'lmaydi (faqat ko'rish) — ishonchli tarix.
- **Manba:** A-default
- **action:** CRON (`personalProgram.lockDay`)
- **⤳ Ta'sir:** Hisobotlar (reja/fakt)

### EP-KAN-056 · Vazifa kategoriyalari ro'yxati (v2-Q26)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Ishlab chiqarish / Sifat / Ta'mirlash / Ombor / Sotuv / Ma'muriy / Boshqa (fabrika tiliga mos).
- **Manba:** A-default
- **action:** CREATE (`task.category.master`)
- **⤳ Ta'sir:** Hisobotlar, barcha modullar

### EP-KAN-057 · Ustuvorlik darajalari (v2-Q27)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3 daraja: Shoshilinch / Oddiy / Past (sodda va yetarli). (v1-Q10 rang bilan mos.)
- **Manba:** A-default; ShVB Y20 (3 daraja rang)
- **action:** CREATE (`task.priority.master`)
- **⤳ Ta'sir:** Butun Kanban

### EP-KAN-058 · Ustuvorlikni kim belgilaydi (v2-Q28)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yaratuvchi taklif qiladi, boshliq tasdiqlaydi/o'zgartiradi (muvozanat).
- **Manba:** A-default
- **action:** UPDATE (`task.priority.set`)
- **⤳ Ta'sir:** Org

### EP-KAN-059 · "Shoshilinch" vazifa kunlik chegarasi (v2-Q29)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bir kunda ko'pi bilan 2 ta "Shoshilinch" (qadri saqlanadi).
- **Manba:** A-default
- **action:** UPDATE (`task.urgentLimit`)
- **⤳ Ta'sir:** HR

### EP-KAN-060 · Ustuvorlik tartibi (Kanbanda joylashuv) (v2-Q30)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — avtomatik: shoshilinch yuqorida, keyin muddati yaqinlari (o'zi tartiblanadi).
- **Manba:** A-default
- **action:** READ (`task.sortOrder`)
- **⤳ Ta'sir:** Kanban UI

### EP-KAN-061 · Kategoriyaga qarab mas'ulni avtomatik taklif (v2-Q31)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, kategoriya bo'yicha odatiy mas'ulni taklif qiladi (o'zgartirsa bo'ladi) — tez.
- **Manba:** A-default
- **action:** AI (`task.suggestAssignee`)
- **⤳ Ta'sir:** Org-struktura, AI Integratsiya

### EP-KAN-062 · Ustuvorlik muddatga ta'sir qiladimi (v2-Q32)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Shoshilinch → odatda shu kun oxiri muddat (o'zgartirsa bo'ladi) — izchil.
- **Manba:** A-default
- **action:** UPDATE (`task.priorityDeadline`)
- **⤳ Ta'sir:** Kanban

### EP-KAN-063 · Kun oxirida bajarilmagan vazifa nima bo'ladi (v2-Q33)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — avtomatik ertangi kunga ko'chiriladi va "ko'chirilgan" belgisi qoladi (hech narsa yo'qolmaydi). Rollover mantig'i build-prompt'da.
- **Manba:** ShVB Y20 (rollover: bajarilmagan task ertangi kunga o'tadi)
- **action:** CRON (`task.rollover`)
- **⤳ Ta'sir:** Shaxsiy dastur, Hisobotlar

### EP-KAN-064 · Necha marta ko'chirilganini sanash (v2-Q34)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, "3 marta ko'chirilgan" yozuvi; 3 dan oshsa boshliqqa signal (ildizni topadi). ⚠️ `rolledOverFrom` maydon mavjud, sanagich qo'shiladi.
- **Manba:** A-default; ShVB Y20 (`rolledOverFrom`)
- **action:** CRON (`task.rollover.count`)
- **⤳ Ta'sir:** 24-soat eskalatsiya, HR

### EP-KAN-065 · Ko'chirishda muddat o'zgaradimi (v2-Q35)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — muddat ertangi kunga suriladi, lekin "asl muddat o'tgan" belgisi saqlanadi (haqiqat ham, yangilik ham).
- **Manba:** A-default
- **action:** CRON (`task.rollover.deadline`)
- **⤳ Ta'sir:** Hisobotlar

### EP-KAN-066 · Qaysi vazifalar ko'chmaydi (istisno) (v2-Q36)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — aniq sanaga bog'langan vazifalar ko'chmaydi, faqat eskalatsiyaga tushadi (to'g'ri signal).
- **Manba:** A-default
- **action:** CRON (`task.rollover.exception`)
- **⤳ Ta'sir:** Savdo (mijoz muddati)

### EP-KAN-067 · Ko'chirish vaqti (qachon amalga oshadi) (v2-Q37)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har bo'limning smena tugashiga moslab ko'chiriladi (adolatli).
- **Manba:** A-default; 3 smena
- **action:** CRON (`task.rollover.timing`)
- **⤳ Ta'sir:** Ishlab chiqarish (3 smena), HR

### EP-KAN-068 · Ko'chgan vazifa ertangi rejada qayerda turadi (v2-Q38)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ko'chgan ish ertangi ro'yxatda yuqorida turadi (qarz birinchi yopiladi).
- **Manba:** A-default
- **action:** READ (`task.rollover.position`)
- **⤳ Ta'sir:** Shaxsiy dastur

### EP-KAN-069 · Ko'p marta ko'chgan vazifani avtomatik yopish/arxivlash (v2-Q39)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 10 kundan oshsa boshliqqa "yopaylikmi?" so'rovi chiqadi (tozalik, lekin nazorat bilan).
- **Manba:** A-default
- **action:** CRON (`task.rollover.autoClose`)
- **⤳ Ta'sir:** Org, Hisobotlar

### EP-KAN-070 · Kuzatuvchi roli nima (v2-Q40)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydi (aralashmasdan kuzatadi). ⚠️ v1-Q17 (A=faqat o'qiydi) bilan kichik tafovut — egasi muvofiqlashtiradi; bu yerda "izoh yozadi" tavsiya.
- **Manba:** A-default; `kanban_observers` mavjud
- **action:** READ (`observer.role`)
- **⤳ Ta'sir:** NTF

### EP-KAN-071 · Kuzatuvchini kim qo'shadi (v2-Q41)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yaratuvchi yoki mas'ul boshliq qo'shadi (nazorat).
- **Manba:** A-default
- **action:** UPDATE (`observer.addPermission`)
- **⤳ Ta'sir:** Xavfsizlik

### EP-KAN-072 · Kuzatuvchiga qaysi o'zgarishlar haqida xabar (v2-Q42)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — faqat muhim hodisalar: yopildi, kechikdi, eskalatsiya (kerakli xabar).
- **Manba:** A-default
- **action:** EVENT (`observer.notify`)
- **⤳ Ta'sir:** NTF, AI Integratsiya

### EP-KAN-073 · Avtomatik kuzatuvchi (boshliq o'z-o'zidan) (v2-Q43)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, bevosita boshliq avtomatik kuzatuvchi (lekin xabar oqimini boshqaradi) — tabiiy nazorat.
- **Manba:** A-default; Org manager_id zanjiri
- **action:** EVENT (`observer.autoManager`)
- **⤳ Ta'sir:** Org-struktura (manager_id)

### EP-KAN-074 · Kuzatuvchi sonining chegarasi (v2-Q44)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ko'pi bilan 5 kuzatuvchi (yetarli va toza).
- **Manba:** A-default
- **action:** UPDATE (`observer.limit`)
- **⤳ Ta'sir:** Kanban

### EP-KAN-075 · Kuzatuvchi maxfiy vazifani ko'ra oladimi (v2-Q45)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — maxfiy vazifaga faqat tasdiqlangan kuzatuvchi qo'shiladi, qolganlarga ko'rinmaydi (himoya).
- **Manba:** A-default
- **action:** READ (`observer.confidential`)
- **⤳ Ta'sir:** HR (maxfiy masalalar), Xavfsizlik

### EP-KAN-076 · Kuzatuvchining @eslatma (mention) qilishi (v2-Q46)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, @ bilan chaqirilgan odamga xabar boradi (aniq murojaat).
- **Manba:** A-default
- **action:** EVENT (`comment.mention`)
- **⤳ Ta'sir:** NTF

### EP-KAN-077 · Vazifaning majburiy maydonlari (v2-Q47)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sarlavha + mas'ul + muddat + kategoriya majburiy; izoh ixtiyoriy (to'liq va yengil).
- **Manba:** A-default
- **action:** CREATE (`task.requiredFields`)
- **⤳ Ta'sir:** Hamma Kanban

### EP-KAN-078 · Bitta vazifaga ko'p mas'ulmi yoki bitta (v2-Q48)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi (javobgarlik aniq).
- **Manba:** A-default
- **action:** CREATE (`task.assigneeModel`)
- **⤳ Ta'sir:** KPI/GSD, HR

### EP-KAN-079 · Vazifani boshqa odamga o'tkazish (qayta biriktirish) (v2-Q49)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — o'tkazishda sabab yoziladi, "X dan Y ga o'tdi" tarixda qoladi (shaffof).
- **Manba:** A-default
- **action:** UPDATE (`task.reassign`)
- **⤳ Ta'sir:** HR

### EP-KAN-080 · Kichik vazifalar (checklist) (v2-Q50)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ha, vazifa ichida belgilanadigan checklist; hammasi belgilanmaguncha yopilmaydi (to'liq nazorat).
- **Manba:** A-default
- **action:** CREATE (`task.checklist`)
- **⤳ Ta'sir:** Kanban

### EP-KAN-081 · Vazifa bilan ishlab chiqarish buyurtmasini bog'lash (v2-Q51)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ixtiyoriy ravishda buyurtma/stanok/mijozga bog'lanadi (kuchli aloqa).
- **Manba:** A-default
- **action:** UPDATE (`task.linkOrder`)
- **⤳ Ta'sir:** Ishlab chiqarish, Sotuv, Hisobotlar

### EP-KAN-082 · Bekor qilingan vazifa holati (yopilgandan farqi) (v2-Q52)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — alohida "Bekor qilindi" holati, sabab majburiy (toza hisob).
- **Manba:** A-default
- **action:** UPDATE (`task.cancel`)
- **⤳ Ta'sir:** Hisobotlar (haqiqiy bajarilish foizi)

### EP-KAN-083 · Vazifa izohlari va fayl biriktirish (v2-Q53)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — rasm + fayl + ovozli izoh biriktirsa bo'ladi (to'liq dalil). (v1-Q29 bilan bir mavzu, kengaytirilgan.)
- **Manba:** A-default; card-files mavjud
- **action:** CREATE (`task.attachment.media`)
- **⤳ Ta'sir:** Sifat nazorati, Ombor

### EP-KAN-084 · Vazifa ko'rinishi (kim qaysi vazifani ko'radi) (v2-Q54)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — xodim o'zini + bo'lim ishlarini, boshliq butun bo'limni, yuqori daraja yuqoridan ko'radi (bosqichli).
- **Manba:** A-default; Org-struktura
- **action:** READ (`task.visibility`)
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik

### EP-KAN-085 · Telegramdan vazifa yaratish/yopish (v2-Q55)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Telegramdan ochish/yopish/izoh, ERP bilan sinxron (qulay). ⚠️ CC Telegram bot infratuzilmasi mavjud (`cc-bot`).
- **Manba:** A-default; CC `cc-bot` (mavjud)
- **action:** CREATE (`task.viaTelegram`)
- **⤳ Ta'sir:** AI Integratsiya (Telegram bot), NTF

---

## III QISM — v2 KITOB-GROUNDED SAVOLLAR (K1–K52)

### EP-KAN-086 · НО-3 kun-yakuni hisoboti vazifaga aylanadimi (K1)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har ish kuni 17:30 da mas'ul savatiga "НО-3 kun-yakuni hisoboti" vazifasi avtomat tug'iladi, topshirilmasa ertasi qizil (intizom).
- **Manba:** A-default; kitob (Оргполитика НО-3 kun-yakuni)
- **action:** CRON (`task.no3.dailyReport`)
- **⤳ Ta'sir:** Coordination (doklad oqimi), HR intizom

### EP-KAN-087 · Aniqlangan kamchilik → tuzatish vazifasi (K2)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — aniqlangan kamchilik → aybdor xodim va boshlig'i savatiga "izoh ber / tuzat" vazifasi, 24h muddat (yopiq tsikl).
- **Manba:** A-default; kitob (kun-tartibi nazorati)
- **action:** EVENT (`task.fromDeficiency`)
- **⤳ Ta'sir:** Coordination, HR

### EP-KAN-088 · Kun-tartibi vaqt-bloklarini shaxsiy dasturdan himoyalash (K3)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — tanaffus/tushlik/namoz bloklari "qotirilgan band slot", ustiga vazifa qo'yilsa ogohlantiradi (real kun).
- **Manba:** A-default; kitob (tanaffus 10:00–10:20, tushlik 12:00–13:30, namoz vaqtlari)
- **action:** READ (`personalProgram.fixedSlots`)
- **⤳ Ta'sir:** HR, Shaxsiy dastur

### EP-KAN-089 · 3-smenalik tushlik — smena bo'yicha avtomat slot (K4)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — smena bo'yicha tushlik avtomat dasturga tushadi, smena oxirida "keyingi smenaga o'tkaziladigan ish" so'raladi (uzluksizlik).
- **Manba:** A-default; kitob (3-smenalik tushlik)
- **action:** CRON (`personalProgram.shiftLunch`)
- **⤳ Ta'sir:** Ishlab chiqarish (smena), HR

### EP-KAN-090 · Ta'tilda vazifa topshirish (handover) majburiy bosqichmi (K5)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ta'til boshidan oldin ochiq vazifalar ro'yxati chiqadi, har biriga o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi (uzluksizlik).
- **Manba:** A-default; kitob ("узлуксизлигини йўқолмаслиги")
- **action:** APPROVE (`task.vacationHandover`)
- **⤳ Ta'sir:** HR (ta'til so'rovi), Coordination

### EP-KAN-091 · O'rinbosarga o'tgan vazifa qaytadimi (K6)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vaqtinchalik o'tkazma: ta'til davrida o'rinbosar mas'ul, qaytganda avtomat asl egaga qaytadi, oraliq harakat tarixda (toza).
- **Manba:** A-default; kitob (vazifa o'tkazish)
- **action:** CRON (`task.handover.return`)
- **⤳ Ta'sir:** HR

### EP-KAN-092 · НО mas'ul-shaxs roli bo'yicha avtomat biriktiruv (K7)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — jarayon shabloni tanlansa, har qadam НО-1/РД-4/ТХ ga avtomat biriktiriladi (qoida-asosli).
- **Manba:** A-default; kitob (НО-1/НО-2/НО-3, РД-4, ТХ mas'ullar)
- **action:** EVENT (`task.template.autoAssign`)
- **⤳ Ta'sir:** HR (onboarding), Coordination (НО bo'lim)

### EP-KAN-093 · Vazifaga standart norma-vaqt (НО jadvalidagi 30/20 daqiqa) (K8)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har vazifa-turiga norma-vaqt master-data'da, bajarilgach norma/fakt solishtiriladi (o'lchanadigan).
- **Manba:** A-default; kitob (Suhbat 30 min, ТХ 20 min, buyruq 30 min)
- **action:** CREATE (`task.normTime`)
- **⤳ Ta'sir:** KPI/GSD, Ishlab chiqarish OEE

### EP-KAN-094 · Jarayon-shablon (НО-1…РД-4) = zanjir vazifa (K9)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — shablon = bog'langan qadamlar; oldingi yopilmaguncha keyingisi "qulflangan", yopilsa avtomat ochiladi (tartib).
- **Manba:** A-default; kitob (yangi xodim qabuli ketma-ketligi)
- **action:** EVENT (`task.template.chain`)
- **⤳ Ta'sir:** HR, Coordination

### EP-KAN-095 · Mentor (Мураббий) kuzatuv-vazifasi (K10)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — mentorga "shogird kuzatuvi" vazifasi o'qish-muddati bilan ochiladi, oxirida "tayyormi/yo'q" baho so'raladi (rasmiy mentorlik).
- **Manba:** A-default; kitob (Мураббий, o'qish muddati)
- **action:** CREATE (`task.mentorWatch`)
- **⤳ Ta'sir:** HR (adaptatsiya), LMS (darslik)

### EP-KAN-096 · Sinov muddati → qaror taymeri (K11)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — sinov tugashiga 3 kun qolganda НО-1/boshliqqa "sinov yakuni qarori" vazifasi tug'iladi (o'tkazib yuborilmaydi).
- **Manba:** A-default; kitob (синов муддати)
- **action:** CRON (`task.probationDecision`)
- **⤳ Ta'sir:** HR

### EP-KAN-097 · Ishlab chiqarish buyurtmasi Kanban kartaga aylanadimi (K12)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har buyurtma = ishlab chiqarish taxtasida karta, "Дата готовности" = muddat, holat ustun bo'ylab siljiydi (Excel o'rniga jonli taxta).
- **Manba:** A-default; Производство 2026.xlsx (Наименование/Тираж/Дата готовности/Статус)
- **action:** EVENT (`board.orderCard`)
- **⤳ Ta'sir:** Ishlab chiqarish (MES), Savdo, Ombor

### EP-KAN-098 · Texnologik bosqichlar (Направление производства) taxta ustuni (K13)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — taxta ustunlari = real texnologik bosqichlar (Флексо/Высечка/Резка/Ламинация…), karta bosqichma-bosqich o'tadi (zavod oqimi).
- **Manba:** A-default; Производство 2026.xlsx (Направление)
- **action:** CREATE (`board.techStageColumns`)
- **⤳ Ta'sir:** Ishlab chiqarish (marshrut), Sifat (har bosqich QC)

### EP-KAN-099 · Тираж + bajarilgan/qolgan progress kartada (K14)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kartada tiraj + progress-bar (7000/10000) — aniq holat.
- **Manba:** A-default; Производство 2026.xlsx (Тираж)
- **action:** READ (`card.progressBar`)
- **⤳ Ta'sir:** Ishlab chiqarish, Ombor (tayyor mahsulot)

### EP-KAN-100 · "Сумма осталось" (qoldiq to'lov) buyurtma kartasida (K15)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kartada to'lov holati ko'rinadi, qoldiq bo'lsa "Упаковка/Yetkazish" bosqichida ogohlantiradi (moliyaviy nazorat).
- **Manba:** A-default; Производство 2026.xlsx (Сумма/Сумма осталось)
- **action:** READ (`card.paymentBalance`)
- **⤳ Ta'sir:** Moliya (debitor), Savdo, Eltib berish

### EP-KAN-101 · Operator-stansiya biriktiruvi kartadan ko'rinadimi (K16)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — karta joriy bosqichi bo'yicha biriktirilgan operatorni avtomat ko'rsatadi (stansiya-operator master-data'dan) — javobgarlik aniq.
- **Manba:** A-default; Производство 2026.xlsx (operator-stansiya: Тигель—Юлдашева…)
- **action:** READ (`card.stationOperator`)
- **⤳ Ta'sir:** HR (stansiya biriktiruvi), Ishlab chiqarish

### EP-KAN-102 · Yordamchi (Ёрдамчи) roli kartada (K17)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — kartada "ijrochi" + "yordamchi" alohida rollar, har biriga hissa ulushi yoziladi (adolatli GSD).
- **Manba:** A-default; Производство 2026.xlsx (Ёрдамчи)
- **action:** UPDATE (`card.helperRole`)
- **⤳ Ta'sir:** KPI/GSD, HR

### EP-KAN-103 · Заявка (qog'oz/material so'rovi) → ta'minot vazifasi (K18)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — karta "Печать" bosqichiga yaqinlashganda kerakli qog'oz yo'q bo'lsa avtomat ta'minot savatiga "Заявка" vazifasi (uzluksiz ta'minot).
- **Manba:** A-default; Заявка бумаги.xlsx
- **action:** EVENT (`task.materialRequest`)
- **⤳ Ta'sir:** Ombor, Ta'minot, Ishlab chiqarish

### EP-KAN-104 · Buyurtma bekor qilinganda (Отменен) kartaga nima bo'ladi (K19)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Отменен" alohida holat, sabab majburiy, arxivga ketadi lekin hisobotda ko'rinadi (sababli iz).
- **Manba:** A-default; Производство 2026.xlsx (Статус: Отменен)
- **action:** UPDATE (`card.cancelled`)
- **⤳ Ta'sir:** Hisobotlar

### EP-KAN-105 · Дата готовности kechikishi eskalatsiyasi (savdoga ham) (K20)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Дата готовности o'tsa: ishlab chiqarish boshlig'i + savdo menejeriga avtomat xabar (mijozdan oldin biz bilamiz) — proaktiv.
- **Manba:** A-default; Производство 2026.xlsx (Дата готовности)
- **action:** CRON (`card.dueEscalation`)
- **⤳ Ta'sir:** Savdo, CRM (mijoz)

### EP-KAN-106 · "Примечание" (maxsus shart) karta yuzida (K21)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — maxsus shart karta yuzida badge bo'lib turadi, bosqichdan o'tishda tasdiqlatadi (xatosizlik).
- **Manba:** A-default; Производство 2026.xlsx (Примечание)
- **action:** READ (`card.noteBadge`)
- **⤳ Ta'sir:** Ishlab chiqarish, Sifat

### EP-KAN-107 · Korporativ raqam berish (НО-2) jarayon-shabloni (K22)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Korporativ raqam berish" shabloni: raqam ber → НО-2 yo'riqnoma → Инспекция nazoratga qo'shildi (har qadam vazifa).
- **Manba:** A-default; kitob (НО-2, Инспекция)
- **action:** EVENT (`task.template.corpNumber`)
- **⤳ Ta'sir:** HR, Inspeksiya/Hisobotlar

### EP-KAN-108 · Vazifa "лавозим папкаси" (lavozim-karta)ga bog'lanadimi (K23)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vazifa avval lavozim-kartaga, keyin xodimga ko'rinadi; xodim ketsa vazifa kartada qoladi (karta-markazli).
- **Manba:** A-default; karta-markazli model + kitob (lavozim papkalari)
- **action:** UPDATE (`task.linkPositionCard`)
- **⤳ Ta'sir:** Org-struktura (karta model), HR

### EP-KAN-109 · Vazifa toifasi seriya bo'yicha (Компания/Ташкилот/Производство) (K24)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vazifa toifasi master-data, filtr va hisobot shu bo'yicha (tartibli).
- **Manba:** A-default; kitob (siyosat seriyalari)
- **action:** CREATE (`task.policySeriesCategory`)
- **⤳ Ta'sir:** Hisobotlar

### EP-KAN-110 · Оргполитика "Харакатлар детализацияси" → vazifa-shablon manbai (K25)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har оргполитика → vazifa-shablon (qadamlar + mas'ul + vaqt), siyosat e'lon qilinganda faollashadi (siyosat→ijro yopiq).
- **Manba:** A-default; kitob (Харакатлар детализацияси)
- **action:** EVENT (`task.template.fromPolicy`)
- **⤳ Ta'sir:** Coordination, HR, butun zavod

### EP-KAN-111 · Vazifaga "Тасаввурдаги мукаммал манзара" (kutilgan natija) maydoni (K26)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har vazifaga "kutilgan natija" maydoni; tasdiqlovchi shunga qarab qabul qiladi (sifat darvozasi).
- **Manba:** A-default; kitob (Тасаввурдаги мукаммал манзара)
- **action:** CREATE (`task.expectedOutcome`)
- **⤳ Ta'sir:** Sifat nazorati, KPI

### EP-KAN-112 · Smena oxirida tugamagan buyurtmani keyingi smenaga estafeta (K27)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — smena oxirida tugamagan kartalar keyingi smenaga "o'tkazma" ro'yxati, qabul qiluvchi operator tasdiqlaydi (estafeta yopiq).
- **Manba:** A-default; kitob (3 smena)
- **action:** CRON (`card.shiftRelay`)
- **⤳ Ta'sir:** Ishlab chiqarish (smena), HR

### EP-KAN-113 · Brak/qayta ishlash (Резка/Высечка xatosi) vazifaga aylanadimi (K28)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — bosqichda brak belgilansa: miqdor + sabab + "qayta ishlash" vazifasi, GSD/sifatga ulanadi (yo'qotish ko'rinadi).
- **Manba:** A-default; kitob (Высечка/Резка/Каширование brak)
- **action:** EVENT (`task.reworkFromDefect`)
- **⤳ Ta'sir:** Sifat nazorati, Ombor (chiqit), Ishlab chiqarish

### EP-KAN-114 · Stansiya navbati (ochered) — kartalar tartibi (K29)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har stansiya ustunida kartalar Дата готовности + ustuvorlik bo'yicha avtomat saralanadi (adolatli navbat).
- **Manba:** A-default; Производство 2026.xlsx (ФСМ navbat)
- **action:** READ (`station.queueSort`)
- **⤳ Ta'sir:** Ishlab chiqarish rejasi (APS/CRP)

### EP-KAN-115 · "Академияга" (ichki) buyurtmalar alohida oqimmi (K30)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ichki ("Академия") va tashqi buyurtmalar belgi bilan ajraladi, tashqi to'lovli ustuvor (to'g'ri tartib).
- **Manba:** A-default; Производство 2026.xlsx ("Академияга")
- **action:** UPDATE (`order.internalFlag`)
- **⤳ Ta'sir:** Savdo, Ishlab chiqarish reja

### EP-KAN-116 · Kun boshida "bugungi reja"ni boshliqqa ko'rsatish (K31)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ertalab xodim "bugungi reja"ni tasdiqlaydi, boshliq ko'radi (faqat ko'rish) — shaffof.
- **Manba:** A-default; kitob (kun-tartibi nazorati)
- **action:** READ (`personalProgram.showToManager`)
- **⤳ Ta'sir:** Coordination, HR intizom

### EP-KAN-117 · Deadline cho'zish (muddat surish) tasdiqlanadimi (K32)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — boshliq bergan vazifa muddatini surish boshliq tasdig'i bilan (sabab); o'z vazifasini o'zi suradi (balans).
- **Manba:** A-default
- **action:** APPROVE (`task.extendDeadline`)
- **⤳ Ta'sir:** Org, HR

### EP-KAN-118 · Vazifani "qaytarish" (men bajarmayman) — sabab bilan (K33)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — qaytarish mumkin (sabab majburiy), bergan odamga qaytadi va u qayta yo'naltiradi (tirik oqim).
- **Manba:** A-default
- **action:** REJECT (`task.returnToSender`)
- **⤳ Ta'sir:** Coordination, NTF

### EP-KAN-119 · Shoshilinch belgisini kim qo'ya oladi (НО tartibiga mos) (K34)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Срочно" belgisini faqat boshliq/topshiriq beruvchi qo'yadi (belgi qadrli qoladi). ⚠️ v2-Q28 (yaratuvchi taklif→boshliq tasdiq) bilan mos.
- **Manba:** A-default; kitob (НО tartibi)
- **action:** UPDATE (`task.urgentPermission`)
- **⤳ Ta'sir:** HR

### EP-KAN-120 · Maxfiy vazifa (inspeksiya/qoidabuzarlik) — kim ko'radi (K35)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Maxfiy" belgisi: faqat beruvchi+ijrochi+boshliq ko'radi, taxtada ko'rinmaydi (maxfiylik).
- **Manba:** A-default; kitob (Инспекция)
- **action:** READ (`task.confidential`)
- **⤳ Ta'sir:** Inspeksiya bo'limi, HR, Xavfsizlik

### EP-KAN-121 · Vazifa-shablonga forma/blank biriktirish (ariza/буйруқ/Заявка) (K36)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — shablon vazifaga kerakli forma biriktirilgan keladi (Заявка, ariza, buyruq), to'ldirilib ilova qilinadi (tayyor namuna).
- **Manba:** A-default; kitob (har harakatga blank/forma)
- **action:** CREATE (`task.template.attachForm`)
- **⤳ Ta'sir:** Hujjat aylanmasi, HR

### EP-KAN-122 · Bosqich bog'liqligi (Ламинация Печать tugamasdan boshlanmaydi) (K37)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — karta "X tugamaguncha bloklangan" deb ko'rsatiladi, X yopilsa avtomat ochiladi (to'g'ri ketma-ketlik).
- **Manba:** A-default; kitob/marshrut (Ламинация←Печать)
- **action:** EVENT (`card.blockedBy`)
- **⤳ Ta'sir:** Ishlab chiqarish marshruti

### EP-KAN-123 · Bajarilgach sifat-baho (НО tasdig'i bilan) (K38)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — yopilishda ixtiyoriy sifat-baho (1-5) + izoh, GSD ga o'rtacha bo'lib ulanadi (sifat o'lchovi).
- **Manba:** A-default; kitob (НО tasdig'i)
- **action:** UPDATE (`task.qualityRating`)
- **⤳ Ta'sir:** KPI/GSD, HR reyting

### EP-KAN-124 · Bo'lim taxtasining kunlik "летучка" ko'rinishi (K39)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — taxtada "летучка rejimi": bugungi vazifalar + kechikkanlar + bloklarni bir ekranda (yig'ilish vositasi).
- **Manba:** A-default; Coordination (kunlik летучка)
- **action:** READ (`board.standupMode`)
- **⤳ Ta'sir:** Coordination (yig'ilish)

### EP-KAN-125 · @xabar vs @so'rov farqi (K40)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ikki xil: "@xabar" (faqat o'qish) va "@so'rov" (savatga vazifa tushadi, javob talab) — toza farq.
- **Manba:** A-default
- **action:** EVENT (`comment.mentionType`)
- **⤳ Ta'sir:** Coordination, savatlar

### EP-KAN-126 · Hayfa/ogohlantirish (взыскание) yozma iz (K41)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — hayfa = yozma iz (sabab+sana), takrorlanishi sanaladi, HR kartasiga ulanadi (adolatli va kuzatiladigan).
- **Manba:** A-default; kitob (взыскание)
- **action:** CREATE (`task.disciplinaryRecord`)
- **⤳ Ta'sir:** HR (intizom), KPI

### EP-KAN-127 · Mijoz buyurtmasi o'zgargach (Тираж/muddat) kartaga ta'sir (K42)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — savdoda buyurtma o'zgarsa karta avtomat yangilanadi + joriy operator ogohlantiriladi (boshlangan bo'lsa tasdiq so'raladi) — drift yo'q.
- **Manba:** A-default; Производство 2026.xlsx (Тираж o'zgarishi)
- **action:** EVENT (`card.orderSync`)
- **⤳ Ta'sir:** Savdo, Ishlab chiqarish

### EP-KAN-128 · Tayyor mahsulot (Упаковка) → ombor/yetkazish vazifasi (K43)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Упаковка" yopilsa: ombor qabul vazifasi + (to'lov to'liq bo'lsa) Eltib berish vazifasi avtomat tug'iladi (yopiq oqim).
- **Manba:** A-default; Производство 2026.xlsx (Упаковка bosqichi)
- **action:** EVENT (`card.toWarehouseDelivery`)
- **⤳ Ta'sir:** Ombor, Eltib berish, Moliya (to'lov sharti)

### EP-KAN-129 · Karta rangi mahsulot turi bo'yicha (5х слой/2х слой/гофра/картон) (K44)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — karta mahsulot-turi bo'yicha rang/teg oladi, taxtada tur bo'yicha filtr (tez ajratish).
- **Manba:** A-default; Производство 2026.xlsx (mahsulot turlari)
- **action:** READ (`card.productTypeColor`)
- **⤳ Ta'sir:** Ishlab chiqarish

### EP-KAN-130 · Qadam norma-vaqtdan oshsa eskalatsiya (НО 30/20 daqiqa) (K45)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — qadam norma-vaqtdan oshsa avtomat boshliqqa ko'rinadi/eslatma (qotib qolish ko'rinadi).
- **Manba:** A-default; kitob (НО norma-vaqt 30/20 min)
- **action:** CRON (`task.normTimeEscalation`)
- **⤳ Ta'sir:** Coordination, jarayon-shablonlar

### EP-KAN-131 · Arxivdan takror muammo aniqlash (naqsh) (K46)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — arxivdan takrorlanuvchi sabab/brak naqshlari oylik hisobotda ko'rsatiladi (AI yordamida) — ildizga ishlash.
- **Manba:** A-default; "muammo takrorlanmasin" tamoyili
- **action:** AI (`archive.patternDetect`)
- **⤳ Ta'sir:** Sifat nazorati, AI-tahlil, KPI

### EP-KAN-132 · Vazifa lavozimga beriladimi (ism emas) (K47)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — vazifa lavozim-kartaga beriladi, joriy egasi avtomat oladi; bo'sh karta bo'lsa boshliqqa tushadi (barqaror adres). (K23 = EP-KAN-108 bilan karta-markazli izchillik.)
- **Manba:** A-default; karta-markazli model
- **action:** CREATE (`task.assignToCard`)
- **⤳ Ta'sir:** Org-struktura (karta model), HR

### EP-KAN-133 · Stansiya kunlik norma — smenaviy plan-fakt (K48)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har stansiyaga kunlik norma; taxtada "bugun: 6000/8000" plan-fakt; smena yakunida hisobot (o'lchanadigan).
- **Manba:** A-default; Производство 2026.xlsx (stansiya norma)
- **action:** READ (`station.dailyNormPlanFact`)
- **⤳ Ta'sir:** Ishlab chiqarish (OEE), KPI/GSD, ish haqi

### EP-KAN-134 · Vazifa-vaqt logi (boshladim/tugatdim) — normaga taqqos (K49)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ixtiyoriy "boshladim/tugatdim" tugmasi vaqtni yozadi, normaga taqqoslanadi (o'lchanadigan, majburlamasdan).
- **Manba:** A-default; kitob (norma-vaqt K8 bilan bog'liq)
- **action:** EVENT (`task.timeLog`)
- **⤳ Ta'sir:** KPI/GSD, ish haqi (vaqtbay)

### EP-KAN-135 · Texnika xavfsizligi (ТХ) yo'riqnoma — takrorlanuvchi vazifa (K50)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — har stansiya operatoriga davriy "ТХ yo'riqnoma" vazifasi (Менеджер секции ТХ mas'ul), o'tmaganlar qizil ro'yxatda (xavfsizlik intizomi).
- **Manba:** A-default; kitob (ТХ yo'riqnoma 20 min, Менеджер секции ТХ)
- **action:** CRON (`task.safetyBriefingRecurring`)
- **⤳ Ta'sir:** HR (xavfsizlik), Ishlab chiqarish

### EP-KAN-136 · Заявка bumagi miqdori (Кг/Лист размер) ombor qoldig'iga taqqos (K51)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Заявка miqdori ombor qoldig'i bilan solishtiriladi: bor bo'lsa rezerv, yetmasa "sotib olish" vazifasi ta'minotga (uzluksiz).
- **Manba:** A-default; Заявка бумаги.xlsx (Грам/Кг/Лист размер)
- **action:** EVENT (`task.materialStockCheck`)
- **⤳ Ta'sir:** Ombor, Ta'minot

### EP-KAN-137 · Operatorni stansiyaga biriktirish o'zgarsa vazifa adresi (K52)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — stansiya-operator biriktiruvi master-data; o'zgarsa o'sha stansiyadagi ochiq kartalar yangi operatorga avtomat ko'rinadi (egasiz qolmaydi). (K47 karta-markazli bilan izchil.)
- **Manba:** A-default; Производство 2026.xlsx (operator-stansiya biriktiruvi)
- **action:** EVENT (`station.reassignTasks`)
- **⤳ Ta'sir:** HR, Ishlab chiqarish

---

## QO'SHIMCHA ESLATMALAR (build-spec uchun)

1. **3-savat = CC ustidan** — `cc_documents.basket_state` ('inbox'/'pending'/'outbox') + `basket_owner_user_id` + harakat-tarixi + `cc-sla.cron.ts` (24h/48h) LIVE. Kanban 3-savati shu manbadan birlashgan ko'rinish beradi; YANGI savat-jadval qurish SHART EMAS. (EP-KAN-001..006, 040..047 shunga tayanadi.)
2. **Shaxsiy dastur (soatlik + rollover)** — ShVB Y20 build-prompt aniq: `personal-task.entity.ts` ({scheduledTime, rolledOverFrom}) + `personal-program.service.ts` (create/findByDate/complete/rollover) + `PersonalProgram.tsx` (soat-grid + rang). EP-KAN-007, 008, 010, 048..055, 063 shu yerda.
3. **Mavjud Kanban infratuzilma:** `schema-kanban.ts` (kanban_tasks + basket_type, kanban_observers, card-files), `drizzle-kanban.repo.ts`, `kanban-extended-tables.sql`. ShVB Y19 migration `kanban_tasks ADD basket_type` — savat-modeli Kanban'da ham bor (CC'dan alohida); egasi qaysi savat-manbasi kanonik ekanini tasdiqlasin (CC ╳ kanban_tasks.basket_type — ikki dunyo riski).
4. **Karta-markazli izchillik:** EP-KAN-014/108/132/137 (vazifa→lavozim-karta→GSD) ORG (T1 poydevor) bilan bog'lanadi — ORG build-spec'i bilan muvofiqlashtirilsin.
5. **Rekruting-kanban 7-bosqich** (Q134: portret/upakovka/poток/tez ishlov/baholash/lavozimga kiritish/kuchaytirish + AI bosqichlari) ✅ javoblangan, lekin u HR/rekruting moduliga tegishli — bu yerda KAN registry'ga kiritilmadi (HR-da `RecruitingKanban.tsx` mavjud). Build paytida HR-KAN ko'prik sifatida belgilansin.

---

DONE: Kanban — 137 (javoblangan 9, ochiq 128).
