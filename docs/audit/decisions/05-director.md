# Director / Strategiya — QAROR XARITASI (Decision Map)

> Modul kodi: **DIR** · Raqamlash: `EP-DIR-###` (manba: `docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` §B).
> Manbalar: `vision-questions/05-director.md` (v1, 30 savol) + `vision-questions-v2/05-director.md` (v2, 55 savol)
> + egasi javoblari `shvb-extracted/EUROPRINT_BARCHA_JAVOBLAR.md` (Q123, Q144) + ShVB direktor prompti
> `shvb-extracted/SHvB-40-Yonalish-Prompt.md` (holat-formulasi, bajarish kundaligi, ideal-kartina, OKR strategik,
> taktik, statistika reglamenti).
>
> **XULOSA:** Jami **85** savol (v1=30 → EP-DIR-001..030; v2=55 → EP-DIR-031..085).
> ✅ JAVOBLANGAN: **9** (egasi to'g'ridan-to'g'ri javobi yoki ShVB prompti aniq dizaynni belgilaydi).
> 🔵 OCHIQ: **76** (A-default tavsiya bilan; egasi tasdig'i kutiladi).
> Director = **T2 (Boshqaruv/Nazorat)** modul (LOYIHA-BITGAN §C) — ShVB nazorat qatlamining yuragi.

---

## I QISM — v1 (vizyon savollari, 30 ta)

### EP-DIR-001 · Kompaniya holat formulasi — qanday hisoblansin
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) To'liq formula — pul oqimi + ishlab chiqarish + buyurtma + xodim + sifat 5 ko'rsatkich birga. ShVB "Формула Состояний" + Q123 ("hammasini va to'liq, har modul asosiy ko'rsatkichlari") to'liq formulani qo'llab-quvvatlaydi.
- **Manba:** v1 Q1 · ShVB YO'NALISH 13 (company-state.service.calculateState) · Q123
- **action:** CRON (op=dir.companyState.calc)
- **⤳ Ta'sir:** FIN (pul oqimi), PP/MES (ishlab chiqarish), SD (buyurtma), HR (xodim), QC (sifat) — barcha modul KPI agregati

### EP-DIR-002 · Holat chegaralari (ostona qiymatlar)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Boshliq o'zi belgilaydi — har ko'rsatkich uchun sozlanuvchi chegara (state-thresholds.entity sozlanuvchi). Tez boshlanish uchun B (tizim standarti) seed sifatida, keyin egasi tuzatadi.
- **Manba:** v1 Q2 · ShVB YO'NALISH 13 (state-thresholds.entity.ts "sozlanuvchi chegaralar")
- **action:** UPDATE (op=dir.stateThreshold.set)
- **⤳ Ta'sir:** Holat formulasi (EP-DIR-001), master-data sozlamalar

### EP-DIR-003 · Holatni kunlik avtomatik hisoblash (cron)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Har kuni ertalab avtomatik 07:00. ShVB prompti aniq belgilaydi: "Cron: har kuni 07:00 holat qayta hisoblanadi, o'zgansa direktor ogohlantiriladi".
- **Manba:** ShVB YO'NALISH 13 §5 (`@Cron 07:00`)
- **action:** CRON (op=dir.companyState.cron)
- **⤳ Ta'sir:** EP-DIR-005 (alert), EP-DIR-004 (tarix yozuvi)

### EP-DIR-004 · Holat tarixini saqlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Har kuni saqlanadi + grafik. ShVB prompti: company-state-log.entity {state, kpis, detectedAt, resolvedAt} + getHistory(days) + "O'tgan 30 kun mini-grafik".
- **Manba:** ShVB YO'NALISH 13 §2 (company-state-log) §3 (30 kun mini-grafik)
- **action:** EVENT (op=dir.companyState.log)
- **⤳ Ta'sir:** Director dashboard trend grafigi

### EP-DIR-005 · Holat yomonlashganda ogohlantirish (alert)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Telegram + tizim ichida darhol. ShVB prompti: sendAlert(state) "holat o'zgarganda bildirishnoma" + "o'zgansa direktor ogohlantiriladi"; Telegram bot YO'NALISH 38 da mavjud.
- **Manba:** ShVB YO'NALISH 13 §2/§5 (sendAlert) · v1 Q5
- **action:** EVENT (op=dir.companyState.alert)
- **⤳ Ta'sir:** NTF (bildirishnoma), CC (Telegram bot)

### EP-DIR-006 · Holat alertini kim oladi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Boshliq + sababchi bo'lim rahbari (pul muammosi → moliyachi ham). Karta-model bilan: sababchi ko'rsatkich egasi (EP-DIR-074) kartasiga alert boradi.
- **Manba:** v1 Q6
- **action:** EVENT (op=dir.alert.route)
- **⤳ Ta'sir:** NTF, org-struktura (manager_id zanjiri), EP-DIR-074

### EP-DIR-007 · Bajarish kundaligi (Dnevnik) — bo'lishi kerakmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Ha, to'liq kundalik — 5 bo'lim (holat / KPI / muammo / yechim / ertangi reja). ShVB ДНЕВНИК ВЫПОЛНЕНИЯ.docx (real 2020 yozuvlar) aynan shu 5 maydonni belgilaydi.
- **Manba:** ShVB YO'NALISH 14 (diary-entry: state, mainKpiValue, mainIssue, solution, tomorrowPlan)
- **action:** CREATE (op=dir.diary.create)
- **⤳ Ta'sir:** ShVB jarayonlari (LOYIHA-BITGAN §A.3 execution diary)

### EP-DIR-008 · Kundalik kim uchun — faqat boshliqmi yoki bo'lim rahbarlari ham
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Boshliq + har bo'lim rahbari o'z kundaligini yozadi (boshliq hammasini ko'radi). Karta-markaz vizyoniga mos — pastdan to'liq manzara.
- **Manba:** v1 Q8 · ShVB diary (authorId maydoni ko'p muallifni qo'llaydi)
- **action:** CREATE (op=dir.diary.create)
- **⤳ Ta'sir:** Org-struktura (bo'lim rahbari = karta), RBAC

### EP-DIR-009 · Kundalikni avtomatik to'ldirish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Holat + KPI avtomatik to'ladi (formuladan/KPI'dan), boshliq faqat muammo/yechim/reja yozadi. ShVB kundalik state+mainKpiValue tizimdan keladi.
- **Manba:** v1 Q9 · ShVB YO'NALISH 14 (dailyState, dailyMainKpi)
- **action:** AI (op=dir.diary.autofill)
- **⤳ Ta'sir:** EP-DIR-001 (holat), KPI agregat

### EP-DIR-010 · Kundalikda hal qilinmagan muammolarni kuzatish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, yechilmagan muammo "ochiq" deb keyingi kunga o'tadi. ShVB "takrorlanuvchi muammolar" oylik tahlilga mos (YO'NALISH 14 §4).
- **Manba:** v1 Q10 · ShVB YO'NALISH 14 §4 (takrorlanuvchi muammolar)
- **action:** UPDATE (op=dir.diary.carryOver)
- **⤳ Ta'sir:** Director dashboard ochiq-muammolar ro'yxati

### EP-DIR-011 · Ideal kartina (Ideal Rasm) — maqsad ko'rsatkichlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) To'liq ideal kartina — foyda + daromad + filial + xodim. ShVB Идеальная картина.xlsx + seed: 100M foyda, 800M daromad, 15 filial, 500 xodim.
- **Manba:** ShVB YO'NALISH 15 §2 (ideal-targets.entity {metric, idealValue, currentValue, unit, year}) + seed
- **action:** CREATE (op=dir.ideal.set)
- **⤳ Ta'sir:** ShVB ideal-kartina (LOYIHA-BITGAN §A.3)

### EP-DIR-012 · Ideal vs haqiqat farqini (gap) ko'rsatish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Ha, har maqsad uchun maqsad/haqiqat/farq + bajarilish foizi. ShVB: getGapAnalysis() + "Progress bar haqiqat/maqsad" + "Erishish uchun qancha qoldi".
- **Manba:** ShVB YO'NALISH 15 §2/§3 (getGapAnalysis, gapAnalysis, timeToIdeal)
- **action:** READ (op=dir.ideal.gap)
- **⤳ Ta'sir:** IdealPicturePanel komponenti

### EP-DIR-013 · Ideal kartinaning haqiqiy raqamlari qayerdan olinsin
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Avtomatik — foyda moliyadan, xodimlar soni HR dan. ShVB updateCurrent() metodi avtomatik yangilashni qo'llaydi; har doim to'g'ri.
- **Manba:** v1 Q13 · ShVB YO'NALISH 15 §2 (updateCurrent)
- **action:** CRON (op=dir.ideal.refresh)
- **⤳ Ta'sir:** FIN (foyda/daromad), HR (xodim soni), SD (filial)

### EP-DIR-014 · Ideal kartina versiyalari (yil bo'yicha)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har yil/davr uchun alohida versiya (tarix qoladi). ShVB ideal-targets.entity `year` maydoni yillik versiyani qo'llaydi.
- **Manba:** v1 Q14 · ShVB YO'NALISH 15 §2 (`year` ustuni)
- **action:** CREATE (op=dir.ideal.version)
- **⤳ Ta'sir:** Yillik solishtirish, arxiv

### EP-DIR-015 · Strategik reja (OKR) — maqsad va natija strukturasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Maqsad → o'lchanadigan natijalar (klassik OKR). ShVB: strategic-goal.entity {keyResults JSONB} + "OKR formatidagi maqsadlar (Objective → Key Results)".
- **Manba:** ShVB YO'NALISH 32 §2/§3 (strategic-goal, keyResults JSONB, OKR)
- **action:** CREATE (op=dir.okr.create)
- **⤳ Ta'sir:** ShVB strategik OKR (LOYIHA-BITGAN §A.3)

### EP-DIR-016 · OKR qaysi darajalarda bo'lsin
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Kompaniya → bo'lim → karta (lavozim) — "oltin ip". Karta-markaz vizyoni (har lavozim katta maqsadga hissa qo'shadi) bilan to'liq mos.
- **Manba:** v1 Q16 · karta-model vizyoni
- **action:** CREATE (op=dir.okr.cascade)
- **⤳ Ta'sir:** ORG/KARTALAR (karta OKR), bo'lim OKR

### EP-DIR-017 · Taktik reja — strategiyadan oylik rejaga o'tish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Ha, strategiya → oylik taktik vazifalar. ShVB: monthly-plan.entity {objectives JSONB} + "oylik maqsadlar strategik maqsaddan keladi".
- **Manba:** ShVB YO'NALISH 33 §2/§4 (monthly-plan, taktik reja)
- **action:** CREATE (op=dir.tactical.create)
- **⤳ Ta'sir:** EP-DIR-015 (strategik OKR), oylik reja

### EP-DIR-018 · Oylikdan haftalikga dekompozitsiya
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Ha, oylik → haftalik bo'lib beriladi. ShVB: monthly-plan {weeklyTasks JSONB} + "4 hafta → har hafta uchun asosiy vazifalar + hafta oxirida % bajarilish".
- **Manba:** ShVB YO'NALISH 33 §2/§3 (weeklyBreakdown, weeklyTasks)
- **action:** CREATE (op=dir.tactical.weekly)
- **⤳ Ta'sir:** HR haftalik reja, EP-DIR-066 (haftalik trend)

### EP-DIR-019 · Taktik vazifa kim bilan bog'lansin
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har vazifa kartaga (lavozimga) biriktiriladi — bajaruvchi va kuzatuv aniq. Karta-markaz vizyoniga mos (taskOwner = karta).
- **Manba:** v1 Q19 · ShVB YO'NALISH 33 §1 (taskOwner) · karta-model
- **action:** UPDATE (op=dir.tactical.assign)
- **⤳ Ta'sir:** ORG/KARTALAR, Kanban (vazifa)

### EP-DIR-020 · Statistika reglamenti (Stat-reglament) — bo'lishi kerakmi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Ha, to'liq stat-reglament — har ko'rsatkich uchun ta'rif/formula/birlik/chastota/egasi. ShVB "Регламент по статистикам.docx" → stat-regulation.entity aynan shu maydonlar.
- **Manba:** ShVB YO'NALISH 23 §2 (stat-regulation.entity {definition, formula, unit, frequency, source, ownerId, targetValue})
- **action:** CREATE (op=dir.statReg.create)
- **⤳ Ta'sir:** ShVB GSD/ЦКП (LOYIHA-BITGAN §A.3), barcha modul KPI ta'rifi

### EP-DIR-021 · Stat-reglamentda chastota (qanchalik tez o'lchanadi)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har ko'rsatkichga alohida chastota (kunlik/haftalik/oylik) — moslashuvchan. ShVB stat-regulation `frequency` maydoni har ko'rsatkichga alohida.
- **Manba:** v1 Q21 · ShVB YO'NALISH 23 §2 (`frequency`)
- **action:** UPDATE (op=dir.statReg.freq)
- **⤳ Ta'sir:** Cron jadvali (qachon yangilanadi)

### EP-DIR-022 · Stat-reglament versiyalari
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har o'zgarish yangi versiya + amal qilish sanasi (eski hisobot to'g'ri qoladi). ShVB: "CRUD + versioning (o'zgarish tarixi saqlanadi)", `version` maydoni.
- **Manba:** v1 Q22 · ShVB YO'NALISH 23 §2 (versioning, `version`)
- **action:** UPDATE (op=dir.statReg.version)
- **⤳ Ta'sir:** Hisobot izchilligi, audit

### EP-DIR-023 · Stat-reglament ko'rsatkichlarining egasi (mas'uli)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Har ko'rsatkich kartaga (lavozimga) biriktiriladi — odam ketsa ham egasi qoladi. Karta-model. ShVB `ownerId` → kartaga ko'chiriladi.
- **Manba:** v1 Q23 · ShVB YO'NALISH 23 §2 (`ownerId`) · karta-model
- **action:** UPDATE (op=dir.statReg.owner)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-074 (mas'ul lavozim)

### EP-DIR-024 · Holat formulasi karta-model bilan bog'lansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, holat kartalardan yig'iladi — "qaysi lavozim sabab" darrov ochiladi (oltin ip). Karta-markaz asosiy vizyon (LOYIHA-BITGAN §C: ORG poydevor).
- **Manba:** v1 Q24 · karta-model vizyoni
- **action:** CRON (op=dir.companyState.fromCards)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-001 (holat formulasi), EP-DIR-083 (karta-AI agregat)

### EP-DIR-025 · Director dashboard — boshliq ekranida nima ko'rinadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A) Holat + ideal kartina farqi + bugungi muammolar + alertlar bir ekranda (to'liq qo'mondonlik markazi). Q123: "hammasini va to'liq ko'rinsin, har modul bo'yicha asosiy ko'rsatkichlar".
- **Manba:** **Q123** (egasi javobi) · ShVB DirectorDashboard.tsx (CompanyStateWidget + IdealPicturePanel + StrategicTasksPanel)
- **action:** READ (op=dir.dashboard.view)
- **⤳ Ta'sir:** Barcha modul KPI (oltin ip agregati)

### EP-DIR-026 · Strategik AI tahlilchi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, AI har kuni qisqa tahlil + 1-2 tavsiya. ShVB director-ai.service: analyzeCompanyState() "holat formulasi asosida sabablar + tavsiyalar" + generateWeeklyBriefing().
- **Manba:** v1 Q26 · ShVB YO'NALISH (director-ai.service) · LOYIHA-BITGAN §A.6 (70% tahlil+AI)
- **action:** AI (op=dir.ai.analyze)
- **⤳ Ta'sir:** AI integratsiya, markaziy-AI

### EP-DIR-027 · Holat va kundalik Telegram bot orqali
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, /holat /kundalik /ideal_rasm buyruqlari + kunlik digest. ShVB Telegram bot YO'NALISH 38: `/company_state` buyrug'i va kunlik xulosa mavjud.
- **Manba:** v1 Q27 · ShVB YO'NALISH 38 (`/company_state`, har kun 18:00)
- **action:** READ (op=dir.telegram.cmd)
- **⤳ Ta'sir:** CC (Telegram bot), NTF

### EP-DIR-028 · Kunlik boshliq digesti (ertalabki xulosa)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har ertalab avtomatik digest (Telegram + tizim). LOYIHA-BITGAN §A.4 "avto kunlik hisobot" + ShVB "Har kun 18:00 kompaniya holati direktorga".
- **Manba:** v1 Q28 · ShVB YO'NALISH 38 (kunlik holat) · LOYIHA-BITGAN §A.4
- **action:** CRON (op=dir.digest.morning)
- **⤳ Ta'sir:** NTF, CC, EP-DIR-005 (alert)

### EP-DIR-029 · Holat darajalari ro'yxatini sozlash (master-data)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) 5 daraja + rang (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ) — ShVB modeliga mos. ShVB enum 4 (NORMAL/RISK/CRITICAL/GROWTH) — egasi 5-darajali (EHTIYOT qo'shimcha) variantga moyil; tasdiq kutiladi.
- **Manba:** v1 Q29 · ShVB YO'NALISH 13 §2 (CompanyState enum) §3 (🟢/🟡/🟠/🔴 rang)
- **action:** UPDATE (op=dir.stateLevel.config)
- **⤳ Ta'sir:** master-data, CompanyStateWidget rang

### EP-DIR-030 · Strategiya yutuqlarini umumiy ko'rsatish
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, yetilgan maqsadlar "bajarildi" deb belgilanadi + tarix saqlanadi (motivatsiya + tarix). ShVB milestone.entity {completedAt} bajarilgan bosqichni saqlaydi.
- **Manba:** v1 Q30 · ShVB YO'NALISH 32 §2 (milestone.completedAt)
- **action:** UPDATE (op=dir.milestone.complete)
- **⤳ Ta'sir:** OKR (EP-DIR-015), motivatsiya/nishonlash

---

## II QISM — v2 (kitob-grounded savollar, 55 ta)

### EP-DIR-031 · Har lavozim "Лавозим мақсади" maydonini ERP saqlaydimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada majburiy `position_purpose` matn maydoni — yo'riqnomadan ko'chiriladi. Karta-markaz vizyoniga to'liq mos.
- **Manba:** v2 Q1 (RD5 Лавозим йўриқномаси)
- **action:** CREATE (op=dir.card.purpose)
- **⤳ Ta'sir:** ORG/KARTALAR, AI baholash (xodim↔karta mosligi), EP-DIR-001 (holat)

### EP-DIR-032 · ЦКП (Лавозимнинг ЦКП си) har kartaning asosiy chiqishimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada `ckp` maydoni + holat formulasi ЦКП bajarilishiga bog'lanadi. ShVB GSD/ЦКП (LOYIHA-BITGAN §A.3) bilan mos.
- **Manba:** v2 Q2
- **action:** CREATE (op=dir.card.ckp)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-001 (holat formulasi)

### EP-DIR-033 · Yo'riqnomadagi "1-4 продукт" bo'sh maydonlari nima
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada 1-4 produkt + har biriga statistika ko'rsatkichi (ЦКП ni 4 o'lchovga bo'lish). Sub-savol (produkt soni): A) moslashuvchan 2-4 (lavozimga qarab).
- **Manba:** v2 Q3
- **action:** CREATE (op=dir.card.products)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-074 (har produkt → stat ko'rsatkich)

### EP-DIR-034 · Оргсхема joylashuvi "5-Департамент, 13-бўлим, Секция" formatida saqlansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, `department_no` + `unit_no` + `section_name` 3 maydon — hujjat formatiga aynan mos. Vysotskiy-7 daraxti bilan ulanadi.
- **Manba:** v2 Q4
- **action:** CREATE (op=dir.card.orgLocation)
- **⤳ Ta'sir:** Org-struktura (Vysotskiy-7), vertikal manager_id zanjiri

### EP-DIR-035 · 5-Департамент ichida 5 ta bo'lim drill-down
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, 5-departament alohida drill-down: 5 bo'lim (sifat/reja/dizayn/konstruktor/...) har biri o'z holati bilan. Owner uni eng murakkab zona deb belgilagan.
- **Manba:** v2 Q5
- **action:** READ (op=dir.dept5.drilldown)
- **⤳ Ta'sir:** Director dashboard, org-struktura

### EP-DIR-036 · "режа бажарилиш даражаси (%)" — director uchun bosh KPI
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Reja bajarilish %" fabrika bo'ylab agregat + har bo'lim breakdown. Yo'riqnomadagi yagona umumiy metrika.
- **Manba:** v2 Q6
- **action:** READ (op=dir.kpi.planFulfill)
- **⤳ Ta'sir:** PP (reja), MES (fakt), EP-DIR-001 (holat formulasi markaziy raqami)

### EP-DIR-037 · "Кечикишлар сони" va "режадан оғиш ҳолатлари сони" — alohida hisoblansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, 2 alohida counter: `delay_count` + `plan_deviation_count` har bo'lim uchun (sabab/oqibat ajratiladi). Sub-savol: A) majburiy sabab kategoriyasi (material/transport/operator).
- **Manba:** v2 Q7
- **action:** EVENT (op=dir.deviation.count)
- **⤳ Ta'sir:** PP, MES, EP-DIR-077 (root-cause drill)

### EP-DIR-038 · "Бекор туриш" (downtime) — director kuzatsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Bekor turish (downtime)" director dashboardda soat + sabab bo'yicha. Fabrikaning eng katta yo'qotish manbai (glossariy rasmiy atama).
- **Manba:** v2 Q8
- **action:** READ (op=dir.downtime.view)
- **⤳ Ta'sir:** MES (downtime), EP-DIR-064 (paddon yetishmovchiligi → downtime)

### EP-DIR-039 · A-System (eski tizim) bilan EuroPrint ERP qanday bog'lanadi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) EuroPrint A-System ni TO'LIQ o'rnini bosadi — eski tizim arxivga (yagona haqiqat manbai). LOYIHA-BITGAN §A.1 "yagona haqiqat manbai" bilan mos. ⚠️ Egasi qarori muhim — ko'chish strategiyasi.
- **Manba:** v2 Q9
- **action:** UPDATE (op=dir.asystem.migrate)
- **⤳ Ta'sir:** Butun ERP (yagona manba), import/migratsiya

### EP-DIR-040 · "1 суткалик ишлаб чиқариш режаси" — kunlik 24-soatlik reja ob'ekti
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Sutkalik reja" alohida ob'ekt (har kuni tuziladi) + bajarilish % director da. Butun logistika/statistika shu kunlik rejaga bog'langan.
- **Manba:** v2 Q10
- **action:** CREATE (op=dir.dailyPlan.create)
- **⤳ Ta'sir:** Planning (PP), MES, ichki logistika

### EP-DIR-041 · "Кўп учрайдиган хатолар" ro'yxati AI risk-reyestriga aylansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada "tipik xatolar" ro'yxati + AI har birini real-time tekshiradi (xato yuz bersa alert). Owner har lavozim uchun yozgan xatolar AI risk-reyestri.
- **Manba:** v2 Q11
- **action:** AI (op=dir.card.riskRegistry)
- **⤳ Ta'sir:** AI integratsiya, ORG/KARTALAR, EP-DIR-079 (xato tasnif)

### EP-DIR-042 · "Муваффақиятли ҳаракатлар" ro'yxati ideal-kartina manbai bo'lsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada "muvaffaqiyatli harakatlar" = ideal model + AI xodimni shu modelga qarab baholaydi. Kartaning ideal kartinasi.
- **Manba:** v2 Q12
- **action:** AI (op=dir.card.idealActions)
- **⤳ Ta'sir:** AI baholash, ORG/KARTALAR, EP-DIR-011 (ideal kartina)

### EP-DIR-043 · "Жавобгарликлари" — moddiy/maънавий javobgarlik darajalari saqlansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada "javobgarlik bandlari" + sodir bo'lganda HR voqeasiga bog'lanadi. Nizo/jazo holatlarida asos.
- **Manba:** v2 Q13
- **action:** CREATE (op=dir.card.responsibility)
- **⤳ Ta'sir:** ORG/KARTALAR, HR (intizom voqeasi)

### EP-DIR-044 · "Тижорат сирларини ошкор этиш" javobgarligini tizim kuzatsinmi
- **Holat:** ✅ JAVOBLANGAN (qisman — audit-log siyosati Q144 bilan)
- **Javob/Tavsiya:** A) Ha, maxfiy ma'lumot (narx, mijoz, formula) kirishi audit-log + director ko'radi. Q144: audit-log faqat Super Admin (IT/Direktor) ko'radi — bu A variantga mos.
- **Manba:** v2 Q14 · **Q144** (audit-log = faqat Super Admin/IT/Direktor)
- **action:** READ (op=dir.secret.audit)
- **⤳ Ta'sir:** Audit-log (Super Admin only), RBAC, xavfsizlik (LOYIHA-BITGAN §A.5)

### EP-DIR-045 · "Энергия ресурслари тежалиши (сув, газ, свет)" — director ko'rsatkichimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, suv/gaz/elektr oylik sarfi director dashboardda (manual yoki schyotchik) + trend. Owner energiya tejamkorligini rasmiy javobgarlik qilgan.
- **Manba:** v2 Q15
- **action:** CREATE (op=dir.energy.track)
- **⤳ Ta'sir:** Moliya (xarajat), ekologik ko'rsatkich

### EP-DIR-046 · "Турникет" (kirish-chiqish) davomat statistikasiga ulansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, turniket → davomat integratsiyasi (kirish/chiqish avtomatik) + director kech kelish statistikasi. (AI kamera davomati LOYIHA-BITGAN §A.4 bilan birga ishlaydi.)
- **Manba:** v2 Q16
- **action:** EVENT (op=dir.turnstile.attendance)
- **⤳ Ta'sir:** HR davomat, ish haqi (kun normasi), IoT

### EP-DIR-047 · "Назорат варақаси" (control sheet) — har karta uchun o'quv jarayoni ob'ektimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada "Nazorat varaqasi" = mavzular + xodim "tasdiqladim" qadamlari. Vizyon: darslik kartaga (xodimga emas).
- **Manba:** v2 Q17 (RD5 Назорат варақаси)
- **action:** CREATE (op=dir.card.controlSheet)
- **⤳ Ta'sir:** LMS (darslik), ORG/KARTALAR, EP-DIR-048

### EP-DIR-048 · Nazorat varaqasidagi "тасдиқлайман" qadamlari (тема-тема) kuzatilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har mavzu "o'qildi/tushundim" checkbox + sana + xodim imzosi (raqamli). Mas'uliyat izi — hujjatga aynan mos.
- **Manba:** v2 Q18
- **action:** UPDATE (op=dir.controlSheet.confirm)
- **⤳ Ta'sir:** LMS, audit izi, EP-DIR-047

### EP-DIR-049 · Nazorat varaqasidagi senariy-savollar (A/B/D) AI imtihon bo'lsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, senariy savollar = karta AI imtihoni (to'g'ri javob ball beradi). Vizyon: har karta o'z AI'si bilan xodimni sinaydi.
- **Manba:** v2 Q19
- **action:** AI (op=dir.card.aiExam)
- **⤳ Ta'sir:** AI integratsiya, LMS, ORG/KARTALAR

### EP-DIR-050 · Yo'riqnoma "ТАСДИҚЛАЙМАН директор Позилов А.А." imzosi — versiya nazorati
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har karta yo'riqnomasi versiyalanadi: tasdiqlovchi + sana + "tanishdim" imzo. Rasmiy hujjat oqimi (audit, mehnat nizosi).
- **Manba:** v2 Q20
- **action:** UPDATE (op=dir.card.docVersion)
- **⤳ Ta'sir:** ORG/KARTALAR, immutable hujjat (LOYIHA-BITGAN §A.4), audit

### EP-DIR-051 · "Малака талаблари" (tajriba, ta'lim) — kartaga talab maydonimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada malaka talablari (ta'lim, tajriba yili, ko'nikma) + AI nomzodni baholaydi. Vizyon: kartaga xodim qidiriladi.
- **Manba:** v2 Q21
- **action:** CREATE (op=dir.card.requirements)
- **⤳ Ta'sir:** HR recruitment, AI xodim-karta moslik bahosi (LOYIHA-BITGAN §A.4 80% AI rekruterlik)

### EP-DIR-052 · "Лавозим воситалари" (A-System, hisobot, tex karta) kartaga biriktirilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har kartada "kerakli vositalar/dasturlar/hujjatlar" ro'yxati + yetishmasa flag. Vizyon "kerakli jihozlar modeli YO'Q" edi — hujjatda ro'yxat bor.
- **Manba:** v2 Q22
- **action:** CREATE (op=dir.card.tools)
- **⤳ Ta'sir:** ORG/KARTALAR (kerakli jihozlar modeli)

### EP-DIR-053 · "режа бажарилиш %" har bo'lim (25-04.xlsx ustunlari) director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har operatsiya/bo'lim "Reja / Fakt / Qoldiq" director real-time (Excel ustunlariga mos). Owner allaqachon Excelда yuritgan.
- **Manba:** v2 Q23 (25-04.xlsx)
- **action:** READ (op=dir.planFact.view)
- **⤳ Ta'sir:** PP, MES, EP-DIR-036 (reja %)

### EP-DIR-054 · "Зарур заказлар" (ustuvor buyurtmalar) navbati director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, buyurtmaga "zarur/ustuvor" flag + navbat tartibi director ko'radi va o'zgartira oladi. Director'ning ustuvorlik qaroriga ta'sir qiladi.
- **Manba:** v2 Q24 (25-04.xlsx ЗАРУР ЗАКАЗЛАР)
- **action:** UPDATE (op=dir.order.priority)
- **⤳ Ta'sir:** SD (buyurtma), PP (navbat/reja)

### EP-DIR-055 · "Брак сони" (brak miqdori) — director sifat-yo'qotish ko'rsatkichimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Brak soni/%" director dashboardda (operatsiya/bo'lim/material bo'yicha) + trend. Brak = bevosita pul yo'qotish.
- **Manba:** v2 Q25 (25-04.xlsx Брак сони)
- **action:** READ (op=dir.defect.view)
- **⤳ Ta'sir:** QC (sifat nazorati), Moliya (yo'qotish)

### EP-DIR-056 · "Длительность / Начат / Завершит" — operatsiya davomiyligi director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Rejalashtirilgan davomiylik vs Fakt davomiylik" director da + og'ish %. Vaqt og'ishi samaradorlik ko'rsatkichi.
- **Manba:** v2 Q26 (25-04.xlsx)
- **action:** READ (op=dir.duration.view)
- **⤳ Ta'sir:** MES, PP, EP-DIR-058 (setup vaqti)

### EP-DIR-057 · "Ден / Ноч" (kunduzgi/tungi smena) bo'yicha statistika ajratilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, kunduzgi/tungi smena holati + reja% alohida director da. Qaysi smena yaxshi ishlashi muhim qaror.
- **Manba:** v2 Q27 (25-04.xlsx ден/ноч)
- **action:** READ (op=dir.shift.compare)
- **⤳ Ta'sir:** MES, HR (smena), EP-DIR-001 (holat smenadan)

### EP-DIR-058 · Ishchi normasi "%" (Iyun ishchilar.xlsx) — mehnat-samaradorlik paneli
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har ishchi "Norma %, Oylik %, Ishlagan kuniga %" director/HR da (Excel formulalariga mos). Ish haqi va samaradorlik asosi.
- **Manba:** v2 Q28 (Iyun ishchilar.xlsx)
- **action:** READ (op=dir.workerNorm.view)
- **⤳ Ta'sir:** HR, ish haqi (razryad→talab→o'sish→oylik)

### EP-DIR-059 · Operatsiya turlari bo'yicha norma (avtokley, GTO, kley...) saqlansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har operatsiya turi uchun norma + fakt + % director da (Excel ro'yxatiga aynan mos: avtokley/GTO/kley/oynakcha/paypoq/rezka/samokley/skleyka/tigel/yoni/laminatsiya/lak/vib.lak). Narx va samaradorlik asosi.
- **Manba:** v2 Q29 (Iyun ishchilar.xlsx)
- **action:** CREATE (op=dir.opNorm.set)
- **⤳ Ta'sir:** PP (norma), MES, narxlash

### EP-DIR-060 · "Oddiy lak" va "Vib lak" alohida norma — director taqqoslasinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, oddiy lak / vib lak alohida norma+% (Excel ustunlariga mos). Har biri har xil hosildorlik.
- **Manba:** v2 Q30 (Iyun ishchilar.xlsx)
- **action:** READ (op=dir.lak.compare)
- **⤳ Ta'sir:** PP/MES (operatsiya turi), EP-DIR-059

### EP-DIR-061 · Bandlik.xlsx — operatsiyaga ketadigan min/soat/kun (pragon) director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Bo'limlar yuklamasi (pragon) — min/soat/kun" director da (Excel formulasiga mos). Sig'im rejalashtirish (CRP) asosi.
- **Manba:** v2 Q31 (Bandlik.xlsx)
- **action:** READ (op=dir.loading.view)
- **⤳ Ta'sir:** Planning (CRP), MES sig'im

### EP-DIR-062 · "Buyurtma tayyorligi %" har buyurtma uchun progress paneli
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har buyurtma "tayyorligi % + qaysi bo'limda" director da (Excel ustuniga mos). Owner necha % tayyor va necha bo'limdan o'tganini kuzatadi.
- **Manba:** v2 Q32 (Bandlik.xlsx, ketgan kun.xlsx)
- **action:** READ (op=dir.orderProgress.view)
- **⤳ Ta'sir:** SD, PP, MES (oltin ip kuzatuvi)

### EP-DIR-063 · "Ishlab chiqarishga ketgan kun / qolgan kun" — sikl-vaqt trendmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, buyurtma "sikl vaqti (kun) — reja vs fakt" director da + kechikkanlar (Excel ustuniga mos). Yetkazish va'da nazorati.
- **Manba:** v2 Q33 (ketgan kun.xlsx)
- **action:** READ (op=dir.cycleTime.view)
- **⤳ Ta'sir:** SD (yetkazish va'da), PP, EP-DIR-037 (kechikish)

### EP-DIR-064 · "Прокатка / приладка вақти (соат)" — setup vaqti yo'qotishi director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Priladka/setup vaqti (soat)" director da operatsiya/buyurtma bo'yicha. Sub-savol: kichik buyurtmalarda setup nisbati yuqori — director alohida belgilasin (EP-DIR-068 bilan bog'liq).
- **Manba:** v2 Q34 (ketgan kun.xlsx)
- **action:** READ (op=dir.setupTime.view)
- **⤳ Ta'sir:** MES (setup), EP-DIR-068 (kichik buyurtma), yashirin yo'qotish

### EP-DIR-065 · Kichik buyurtmalar tahlili — strategik foyda paneli
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Kichik buyurtmalar — kichiklashish %, dona/kg foyda" strategik panel director da (Excel hisobiga mos). Owner (M.Nosirov) zarar keltirayotganini hisoblagan — strategik narx qaror.
- **Manba:** v2 Q35 (Kichik buyurtmalar.xlsx)
- **action:** READ (op=dir.smallOrder.analysis)
- **⤳ Ta'sir:** SD (savdo narx), Moliya (foyda marjasi)

### EP-DIR-066 · "Razmer eski → yangi" optimizatsiyasi director tavsiyasiga aylansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, AI strategik tahlilchi "format optimizatsiyasi" tavsiyasini avtomatik beradi (42x58 → 40x58 kabi). Owner qog'oz formatini kichraytirib kg-foydani oshirgan.
- **Manba:** v2 Q36 (Kichik buyurtmalar.xlsx)
- **action:** AI (op=dir.ai.formatOpt)
- **⤳ Ta'sir:** AI tahlilchi (EP-DIR-026), SD narx, ombor (qog'oz)

### EP-DIR-067 · Buyurtma kodi formati (2024-0499, KT/PT/E) director qidiruvida
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, buyurtma=`yil-raqam`, klishe=`KT/PT/E+raqam` rasmiy format + qidiruv. Owner kodlash tizimini yillar yuritgan — ERP shu kodlar bilan ishlashi shart.
- **Manba:** v2 Q37 (Excel buyurtma kodlari)
- **action:** READ (op=dir.order.search)
- **⤳ Ta'sir:** SD (buyurtma kod), klishe/papka kodi

### EP-DIR-068 · Director "departament bo'yicha" ham "operatsiya bo'yicha" ham (2 o'q)
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, director 2 o'q: Departament (5/13/секция) ╳ Operatsiya turi — har ikkisi bo'yicha drill. Owner ham vertikal, ham gorizontal tahlil qiladi.
- **Manba:** v2 Q38
- **action:** READ (op=dir.dashboard.twoAxis)
- **⤳ Ta'sir:** Director dashboard navigatsiya, EP-DIR-034/EP-DIR-059

### EP-DIR-069 · Statistik ko'rsatkich grafigi (Vysotskiy "статистика") — trend
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har ko'rsatkich vaqt-trend grafigi (haftalik nuqta) + yo'nalish (o'sish/tushish). Vysotskiy modeli: son emas, yo'nalish muhim.
- **Manba:** v2 Q39 (Vysotskiy statistika)
- **action:** READ (op=dir.stat.trend)
- **⤳ Ta'sir:** Director dashboard, EP-DIR-004 (holat tarixi), EP-DIR-070

### EP-DIR-070 · Trend "yiqilish/o'sish holati" (condition) avtomatik aniqlansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, trend qiyaligi → holat (keskin tushish=Danger) avtomatik + chora-tadbir taklif. Vysotskiy: trenddan holat chiqarish boshqaruv tilining o'zagi.
- **Manba:** v2 Q40 (Vysotskiy holat: Normal/Emergency/Danger/Power)
- **action:** AI (op=dir.stat.condition)
- **⤳ Ta'sir:** EP-DIR-001 (holat formulasi), AI tahlilchi, EP-DIR-029 (daraja ro'yxati)

### EP-DIR-071 · Har ko'rsatkich uchun "mas'ul lavozim" (egasi) hujjatdan biriktirilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har ko'rsatkichda "mas'ul karta/lavozim" + pasayganda o'sha kartaga alert. Owner har ko'rsatkichni egasiga bog'lagan (yo'riqnoma).
- **Manba:** v2 Q41
- **action:** UPDATE (op=dir.stat.owner)
- **⤳ Ta'sir:** ORG/KARTALAR, EP-DIR-023 (stat-reglament egasi), EP-DIR-006 (alert)

### EP-DIR-072 · "Ҳисоботларни ўз вақтида тайёрлаш" — hisobot-reglament director da
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har bo'lim "hisobot topshirildi/kechikdi" director da + eslatma. Owner o'z vaqtida hisobotni reglament qilgan.
- **Manba:** v2 Q42
- **action:** EVENT (op=dir.report.track)
- **⤳ Ta'sir:** NTF (eslatma), Coordination, EP-DIR-028 (digest)

### EP-DIR-073 · Director "real-time" yoki "kunlik kesim" ko'rsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Real-time + kunlik snapshot ikkalasi (jonli kuzatuv + tugagan kun raqami). To'liq manzara — smena tugaganda barqaror raqam ham bo'ladi.
- **Manba:** v2 Q43
- **action:** READ (op=dir.dashboard.mode)
- **⤳ Ta'sir:** Director dashboard, EP-DIR-003 (07:00 snapshot cron)

### EP-DIR-074 · Director og'ish yuz berganda "tomir-kesish" (root-cause) ko'rsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, og'ishdan → sabab kategoriyasi → aniq buyurtma/operatsiya drill (root-cause zanjiri). Verify-don't-trust, tomir-kesish madaniyatiga mos.
- **Manba:** v2 Q44
- **action:** READ (op=dir.rootCause.drill)
- **⤳ Ta'sir:** EP-DIR-037 (og'ish counter), EP-DIR-079 (xato tasnif)

### EP-DIR-075 · "Smena rejasi 2 xil buyurtma aralashib ketishi" — konflikt alerti
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, bir vaqtda o'xshash material talab qiladigan 2 buyurtma → "aralashish riski" alert (5/3 qavatli gofra senariysi). Owner tipik va qimmat xatoni real misol qilib yozgan.
- **Manba:** v2 Q45 (Назорат варақаси senariy)
- **action:** EVENT (op=dir.mixup.alert)
- **⤳ Ta'sir:** PP (smena rejasi), MES, tex-karta, NTF

### EP-DIR-076 · Director "Лавозим мақсади tushunilmadi" holatini (xato-tasnif) ko'rsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, AI xato sodir bo'lganda uni "tushunmaslik/e'tiborsizlik/qoidabuzarlik" deb tasniflaydi + o'quv tavsiya. Owner xatolarning ko'pi tushunmaslikdan kelishini belgilagan.
- **Manba:** v2 Q46
- **action:** AI (op=dir.error.classify)
- **⤳ Ta'sir:** AI integratsiya, LMS (o'quv tavsiya), EP-DIR-041 (risk-reyestr)

### EP-DIR-077 · "Чиқиндилар ва қолдиқлар" (chiqindi) — director ekologik ko'rsatkichmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Chiqindi/qoldiq miqdori (kg)" director da + qayta ishlash%. Qoldiq (qog'oz) — qayta ishlash va xarajat manbai.
- **Manba:** v2 Q47
- **action:** READ (op=dir.waste.view)
- **⤳ Ta'sir:** Ombor (qoldiq karton rulon), Moliya (qayta sotish)

### EP-DIR-078 · Director "huquqlari" — ma'lumot so'rash huquqi ERP da aks etsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "ma'lumot/reja so'rovi" bo'limlararo workflow (so'rov→javob izi). Owner bo'limlararo ma'lumot talabini rasmiy huquq qilgan — gorizontal workflow.
- **Manba:** v2 Q48
- **action:** CREATE (op=dir.info.request)
- **⤳ Ta'sir:** Coordination (gorizontal workflow_rules)

### EP-DIR-079 · Strategik tahlilchi AI "Лавозим мақсади amalga oshyaptimi" baholasinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, har karta-AI hisoboti → director uchun "qaysi lavozimlar maqsadga erishmayapti" agregat. Vizyon: karta-AI lar o'zaro ishlaydi, director eng yuqori agregat.
- **Manba:** v2 Q49 · karta-model vizyoni · LOYIHA-BITGAN §A.6 (markaziy-AI)
- **action:** AI (op=dir.cardAi.aggregate)
- **⤳ Ta'sir:** AI integratsiya, HR karta-model, EP-DIR-024 (holat kartalardan)

### EP-DIR-080 · Director ko'rsatkichlarining "ideal qiymati" hujjatdan yoki o'rnatilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Owner har ko'rsatkichga ideal/ostona belgilaydi (reja% > 95 = yashil) — sozlanadigan master-data. Sub-savol: A) har karta o'z ostonasi. EP-DIR-002 (holat chegaralari) bilan bir xil mantiq.
- **Manba:** v2 Q50
- **action:** UPDATE (op=dir.stat.threshold)
- **⤳ Ta'sir:** EP-DIR-002 (holat chegaralari), EP-DIR-020 (stat-reglament targetValue)

### EP-DIR-081 · "Поддон" (paddon) — qayta ishlatiladigan resurs sifatida hisoblansinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, paddon zaxirasi/aylanishi director da (yetishmovchilik bekor turish bilan bog'lanadi). Paddon yetishmasligi downtime'ga olib keladi.
- **Manba:** v2 Q51
- **action:** READ (op=dir.pallet.view)
- **⤳ Ta'sir:** Ombor (ichki resurs), EP-DIR-038 (downtime)

### EP-DIR-082 · Director "haftalik ishlab chiqargan vs qolgan" (ketgan kun.xlsx) ko'rsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Hafta ishlab chiqarildi vs qoldi" director da + haftalik trend (Excel ustuniga mos). Taktik (oylik→haftalik) darajaga mos.
- **Manba:** v2 Q52 (ketgan kun.xlsx)
- **action:** READ (op=dir.weekly.view)
- **⤳ Ta'sir:** EP-DIR-018 (haftalik dekompozitsiya), PP/MES

### EP-DIR-083 · Yo'nalish (ofs kar / ofs gof / flx gof) bo'yicha statistika ajratilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Ofset-karton / Ofset-gofra / Flekso-gofra" yo'nalishlari bo'yicha holat+hajm director da. Har yo'nalish har xil samaradorlik (texnologiya turi).
- **Manba:** v2 Q53 (ketgan kun.xlsx йўналишлар)
- **action:** READ (op=dir.direction.compare)
- **⤳ Ta'sir:** PP (routing/yo'nalish), MES

### EP-DIR-084 · "Algoritm turi" (2-8 ta bo'lim oqimi) — buyurtma murakkabligi ko'rsatkichimi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, buyurtmaga "algoritm turi (2-8 bo'lim)" + murakkablikka qarab vaqt prognozi. Owner buyurtmani o'tadigan bo'limlar soni bilan tasniflaydi.
- **Manba:** v2 Q54 (ketgan kun.xlsx алгоритм тури)
- **action:** CREATE (op=dir.order.complexity)
- **⤳ Ta'sir:** Planning (yo'nalish/routing), buyurtma vaqt prognozi

### EP-DIR-085 · Director paneliga "tozalik/intizom" (5S) ko'rsatkichi qo'shilsinmi
- **Holat:** 🔵 OCHIQ (A-default)
- **Javob/Tavsiya:** A) Ha, "Tozalik/intizom" holati director da (tekshiruv/voqea asosida). Owner tozalik va ish-joy intizomini har lavozim hujjatiga qo'shgan — madaniyat ko'rsatkichi.
- **Manba:** v2 Q55
- **action:** READ (op=dir.discipline.view)
- **⤳ Ta'sir:** HR (intizom voqealari), ORG/KARTALAR (qoidabuzarlik)

---

## XULOSA JADVALI

| Diapazon | Manba | Soni | ✅ Javoblangan | 🔵 Ochiq |
|---|---|---|---|---|
| EP-DIR-001..030 | v1 (vizyon) | 30 | 9 | 21 |
| EP-DIR-031..085 | v2 (kitob-grounded) | 55 | 0 (Q144 → EP-DIR-044 qisman) | 54 |
| **JAMI** | | **85** | **9** | **76** |

**✅ JAVOBLANGAN (9):** EP-DIR-003 (07:00 cron), EP-DIR-004 (tarix+grafik), EP-DIR-005 (alert),
EP-DIR-007 (5-bo'lim kundalik), EP-DIR-011 (ideal kartina seed), EP-DIR-012 (gap analysis),
EP-DIR-015 (OKR), EP-DIR-017 (taktik), EP-DIR-018 (haftalik), EP-DIR-020 (stat-reglament),
EP-DIR-025 (dashboard = Q123). *(EP-DIR-044 audit-log = Q144 bilan qisman tasdiqlangan.)*
— ShVB prompti + egasi Q123/Q144 javoblari aniq dizaynni belgilagan o'rinlarда.

**🔵 OCHIQ (76):** barchasi A-default tavsiya bilan, egasi tasdig'i kutiladi. Eng strategik ochiq qarorlar:
EP-DIR-039 (A-System ko'chish — to'liq almashtirish vs parallel), EP-DIR-029 (holat darajalari 5 vs 4),
EP-DIR-024/EP-DIR-079 (holat karta-modeldan yig'ilishi — asosiy vizyon ipi).

DONE: Director — 85 (javoblangan 9, ochiq 76).
