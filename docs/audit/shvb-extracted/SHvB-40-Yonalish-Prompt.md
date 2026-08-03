# ШВБ → ERP: 40 Yo'nalishda To'liq Integratsiya Prompti

> **Foydalanish:** Bu promptni har bir yo'nalish bo'yicha alohida yoki guruh-guruh holda bajaring.  
> **Manba fayllar:** `/mnt/Архив/ШВБ/` — 237 fayl, 24 bo'lim  
> **Maqsad loyiha:** `Uzbek-Language-Module 3` — React 19 + NestJS + 29 i18n modul

---

## ASOSIY MASTER PROMPT

```
Sen EuroPrint Kokand ERP tizimining integratsiya mutaxassisissan.

Manba: /mnt/Архив/ШВБ/ papkasida 237 ta hujjat bor — bu EuroPrint Kokand'ning
2020-yilda ishlab chiqilgan "Школа Владельца Бизнеса" (ШВБ) biznes tizimi.

Maqsad loyiha: Uzbek-Language-Module 3
  - Frontend: artifacts/erp-dashboard/src/ (React 19, 326 sahifa)
  - Backend: apps/api/src/modules/ (NestJS 10.4, 36+ modul)
  - i18n: artifacts/erp-dashboard/src/locales/ (29 modul, UZ + RU)

Qoidalar:
  1. Har bir o'zgarish uchun avval ШВБ hujjatini o'qi, keyin kod yoz
  2. Barcha i18n kalitlari UZ va RU da teng bo'lishi shart (UZ kalit soni = RU kalit soni)
  3. LANGUAGE_STORAGE_KEY = 'europrint_language' (o'zgartirma)
  4. Yangi backend entity'lar uchun Drizzle ORM ishlatiladi (TypeORM emas)
  5. Har yangi sahifa uchun routing roleRoutes.ts da yangilanishi kerak
  6. Barcha kalitlar constants.ts da TRANSLATION_MODULES ga qo'shilishi kerak

Endi quyidagi yo'nalishni to'liq bajar:
```

---

## 40 TA YO'NALISH — ALOHIDA PROMPTLAR

---

### YO'NALISH 1: ЗВС Ariza Tizimi — Finance Moduli

```
ШВБ fayllarni o'qi:
  - /mnt/Архив/ШВБ/Финансовый Планирования/5 Бланк ЗВС.docx
  - /mnt/Архив/ШВБ/Финансовый Планирования/2020-10-12 Список заявок на одобрение.xlsx
  - /mnt/Архив/ШВБ/Финансовый Планирования/Регламент по ФП.docx

Keyin quyidagilarni bajар:

1. artifacts/erp-dashboard/src/locales/uz/finance.json ga qo'sh:
   zvs, zno, createZvs, zvsStatus, zvsPending, zvsApproved, zvsRejected,
   zvsDeadlineDay, fpDay, bankPaymentDay, cashPaymentDay,
   approvalLevel1, approvalLevel2, approvalLevel3,
   weeklyFinancePlan, zvsApprovalQueue, unpaidBillsList

2. Xuddi shu kalitlarni ru/finance.json ga rus tilida qo'sh

3. apps/api/src/modules/finance/ ichida yarat:
   - zvs/zvs.entity.ts (Drizzle schema: id, departmentId, submittedBy, amount,
     purpose, priority, status, level, weekDate, reviewedBy, reviewedAt, comment)
   - zvs/zvs.service.ts (create, findAll, approve, reject, getWeeklyQueue)
   - zvs/zvs.controller.ts (POST /zvs, GET /zvs, PATCH /zvs/:id/approve)
   - zvs/zvs.dto.ts (CreateZvsDto, UpdateZvsStatusDto)

4. artifacts/erp-dashboard/src/pages/FinanceApproval.tsx ga
   ЗВС bo'limini qo'sh — 3 ustunli Kanban: Kutilmoqda / Tasdiqlangan / Rad etilgan

5. artifacts/erp-dashboard/src/components/finance/ZvsWidget.tsx yarat:
   - Haftalik ФП tsikl progress (Ses→Chor→Pay→Dush)
   - Bugungi kun highlight
   - Kutilmoqda ЗВС soni badge

Tekshir: UZ kalit soni = RU kalit soni
```

---

### YO'NALISH 2: ЗНО Majburiyat Ariza Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Финансовый Планирования/ papkasidagi ЗНО hujjatlar

Bajар:

1. finance.json (uz + ru) ga qo'sh:
   zno, createZno, znoStatus, znoPending, znoApproved, znoRejected,
   znoFutureDate, znoObligation, znoList, znoVsZvs (farqi tushuntirilgan)

2. apps/api/src/modules/finance/zno/ yarat:
   - zno.entity.ts (id, departmentId, submittedBy, amount, futureDate,
     obligation, status, approvedBy, createdAt)
   - zno.service.ts (create, findAll, approve, reject, getByDepartment)
   - zno.controller.ts

3. artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx ga:
   ЗНО jadval qo'sh — kelajakdagi majburiyatlar ro'yxati, sana bo'yicha tartiblangan

4. CFODashboard.tsx ga qo'sh:
   - ЗВС vs ЗНО solishtiruv grafigi (Recharts BarChart)
   - Tasdiqlash matritsasi vizualizatsiya (3 daraja)
```

---

### YO'NALISH 3: 4 Hisob Raqam Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Финансовый Планирования/Копия 13 Справка о счетах.xlsx

Bajар:

1. finance.json (uz + ru) ga qo'sh:
   account1Main, accountTax, accountHead, accountWorkingCapital,
   accountBalance, accountMovement, accountStatement, fourAccounts

2. apps/api/src/modules/finance/accounts/ yarat:
   - account-types.enum.ts:
     enum AccountType { MAIN='main', TAX='tax', HEAD='head', WORKING_CAPITAL='working_capital' }
   - account-balance.entity.ts (id, accountType, balance, currency, updatedAt)
   - accounts.service.ts (getAllBalances, getMovements, updateBalance)
   - accounts.controller.ts (GET /accounts/balances, GET /accounts/:type/movements)

3. artifacts/erp-dashboard/src/components/finance/FourAccountsPanel.tsx yarat:
   4 ta karta: har biri hisob nomi, joriy balans, oxirgi harakat
   Rang kodi: MAIN=ko'k, TAX=to'q sariq, HEAD=yashil, WORKING_CAPITAL=binafsha

4. CFODashboard.tsx ga FourAccountsPanel komponentini qo'sh
```

---

### YO'NALISH 4: Haftalik ФП Tsikl Avtomatlash

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Финансовый Планирования/Регламент по ФП.docx

Bajар:

1. apps/api/src/modules/finance/cron/fp-cycle.cron.ts yarat:
   @Cron('0 9 * * 2') → Seshanba 09:00: ЗВС eslatmasi barcha bo'lim boshliqlarga
   @Cron('0 9 * * 3') → Chorshanba 09:00: ФП kuni eslatmasi moliya direktorga
   @Cron('0 8 * * 4') → Payshanba 08:00: Bank to'lov kuni eslatmasi
   @Cron('0 8 * * 1') → Dushanba 08:00: Naqd to'lov kuni eslatmasi

2. Har eslatma uchun:
   - Telegram xabar (telegraf orqali)
   - In-app notification (notifications moduli)
   - Email (agar konfiguratsiya mavjud bo'lsa)

3. finance.json ga qo'sh:
   fpCycleReminder, zvsTodayDeadline, fpDayToday, bankPaymentToday, cashPaymentToday

4. artifacts/erp-dashboard/src/components/finance/FpCycleTimeline.tsx yarat:
   Haftaning 7 kuni ko'rsatilgan timeline — moliyaviy amallar belgilangan
   Bugungi kun highlighted, o'tgan kunlar dimmed
```

---

### YO'NALISH 5: To'lanmagan Schyotlar Monitoring

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Финансовый Планирования/2020-09-09 Список неоплаченных счетов.xlsx

Bajар:

1. finance.json (uz + ru) ga qo'sh:
   unpaidInvoices, overdueInvoices, overdueByDays, unpaidTotal,
   markAsPaid, sendReminder, escalateToDirector, debtorList

2. apps/api/src/modules/finance/unpaid-invoices/ yarat:
   Entity: (id, vendorName, amount, dueDate, overdueDays, status, departmentId)
   Service: findAll, markAsPaid, getOverdueList, getTotalUnpaid
   Controller: REST endpointlari

3. artifacts/erp-dashboard/src/pages/AccountsPayable.tsx ga:
   ШВБ formatidagi to'lanmagan schyotlar jadval:
   - Rang: 0-7 kun=sariq, 8-30=to'q sariq, 30+=qizil
   - Qator bo'yicha: vendor, summa, muddati, kechikkan kun soni, amal tugmalar

4. Oylik avtomatik hisobot generatsiyasi (PDF export)
```

---

### YO'NALISH 6: Tasdiqlash Matritsasi

```
ШВБ reglamentidan:
  ≤ 500,000 so'm → Bo'lim boshlig'i
  ≤ 5,000,000    → Рек.Совет
  > 5,000,000    → Direktor

Bajар:

1. finance.json ga qo'sh:
   approvalMatrix, threshold1, threshold2, threshold3,
   autoApprove, requiresCouncil, requiresDirector, approvalHistory

2. apps/api/src/modules/finance/approval-matrix/ yarat:
   - approval-matrix.service.ts:
     getRequiredLevel(amount: number): 'dept_head' | 'rec_council' | 'director'
   - Middleware: har ЗВС yaratilganda avtomatik daraja belgilash

3. artifacts/erp-dashboard/src/components/finance/ApprovalMatrixCard.tsx yarat:
   3 ta daraja vizual ko'rinishda — chegaralar, ruxsat berilgan shaxslar, joriy oy statistika

4. ЗВС shaklida: summa kiritilganda — avtomatik "Bu tasdiqlash uchun X kerak" xabar
```

---

### YO'NALISH 7: Koordinatsiya Moduli — Yangi Modul

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Координация/Регламент по координации.docx

Bajар:

1. constants.ts ga 'coordination' qo'sh (29→30 modul)

2. locales/uz/coordination.json va ru/coordination.json yarat (15 kalit):
   coordination, councilSystem, founderCouncil, executiveCouncil,
   recommendationCouncil, recommendationCommittee, deputyCouncil,
   councilSchedule, meetingProtocol, councilMinutes,
   dokla, rasporyazhenie, createDokla, createRasporyazhenie,
   escalation, councilDecision

3. apps/api/src/modules/coordination/ yarat (to'liq NestJS modul):
   - council-levels.entity.ts (5 kengash ma'lumotlari)
   - dokla.entity.ts (fromUser, toUser, level, subject, body, problem, proposal)
   - rasporyazhenie.entity.ts (fromUser, toUser, task, deadline, status)
   - coordination.module.ts, coordination.service.ts, coordination.controller.ts

4. artifacts/erp-dashboard/src/pages/CoordinationPage.tsx yarat:
   - Chap panel: 5 kengash darajalari (ierarxik ko'rinish)
   - O'ng panel: Доклад yozish / Распоряжение berish shakllari
   - Pastki panel: Joriy ochiq докладlар va распоряженийlar

5. roleRoutes.ts ga CoordinationPage marshrutini qo'sh
```

---

### YO'NALISH 8: Доклад Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Писменная Коммуникация/ papkasidagi Доклад shablonlari

Bajар:

1. coordination.json ga qo'sh (qo'shimcha):
   doklaSubject, doklaProblem, doklaResult, doklaProposal,
   doklaFrom, doklaTo, doklaCouncilLevel, doklaStatus,
   doklaSent, doklaRead, doklaResolved, doklaArchived

2. apps/api/src/modules/coordination/dokla/:
   - dokla.entity.ts: {id, fromUserId, toUserId, councilLevel, subject,
     body, problem, result, proposal, status, createdAt, readAt, resolvedAt}
   - dokla.service.ts: create, findAll, markRead, markResolved, archive
   - dokla.controller.ts: full CRUD

3. artifacts/erp-dashboard/src/pages/DoklaPage.tsx yarat:
   ШВБ blank shaklni takrorlovchi forma:
   - Kimga (xodim qidirish)
   - Kengash darajasi tanlash
   - Mavzu, Muammo, Natija, Taklif maydonlari
   - Yuborish + Arxiv tugmalari

4. Bildirishnoma: Доклад yuborganda qabul qiluvchi push notification oladi
```

---

### YO'NALISH 9: Распоряжение Tizimi

```
ШВБ shablondan kelib chiqib:

Bajар:

1. coordination.json ga qo'sh:
   raspTask, raspDeadline, raspPriority, raspHigh, raspMedium, raspLow,
   raspAssigned, raspInProgress, raspDone, raspOverdue,
   raspAcceptedAt, raspCompletedAt, raspComment

2. apps/api/src/modules/coordination/rasporyazhenie/:
   Entity: {id, fromUserId, toUserId, task, deadline, priority, status,
            acceptedAt, completedAt, comment, createdAt}
   Service: create, findAll, accept, complete, markOverdue (cron)
   Controller: full REST

3. artifacts/erp-dashboard/src/pages/RasporyazheniePage.tsx yarat:
   - Berilgan распоряженийlar (muddati + holat ko'rsatilgan)
   - Qabul qilingan распоряженийlar (bajarish progress)
   - Overdue: qizil rang + direktor ogohlantiriladi

4. Cron: kuniga bir marta muddati o'tgan распоряженийlar status='overdue' ga o'tkaziladi
```

---

### YO'NALISH 10: Majlis Protokol Tizimi

```
ШВБ koordinatsiya reglamentidan:

Bajар:

1. coordination.json ga qo'sh:
   meetingAgenda, agendaItem, meetingDate, attendees, decisions,
   actionItems, nextMeetingDate, protocolSigned, protocolDownload

2. apps/api/src/modules/coordination/protocol/:
   Entity: {id, councilLevel, meetingDate, agenda, decisions, attendeeIds, nextMeeting}
   Service: create, findAll, generatePdf
   Controller: REST + PDF generatsiya endpoint

3. artifacts/erp-dashboard/src/components/coordination/MeetingProtocolForm.tsx yarat:
   - Sana va kengash turi
   - Kun tartibi (dynamic list)
   - Qarorlar ro'yxati
   - Keyingi majlis sanasi
   - PDF yuklab olish tugmasi

4. Barcha protokollar arxivida qidirish funksiyasi (kengash turi + sana bo'yicha)
```

---

### YO'NALISH 11: GSD — Lavozim Asosiy Statistikasi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Справочник статистик Аюбхон Last Finish.docx
  - /mnt/Архив/ШВБ/Регламентлар/2020-04-24 Регламент по статистикам.docx

Bajар:

1. hr.json (uz + ru) ga qo'sh:
   gsd, gsdDefinition, gsdTarget, gsdActual, gsdVariance, gsdTrend,
   weeklyGsdReport, gsdDynamics, prevWeekGsd, gsdHistory,
   assignGsd, gsdFormula, gsdUnit, gsdFrequency

2. apps/api/src/modules/hr/gsd/:
   - position-gsd.entity.ts: {id, positionId, gsdName, gsdFormula, targetValue,
     unit, frequency, isActive}
   - employee-gsd-history.entity.ts: {id, employeeId, weekDate, actual, target,
     variance, note, createdAt}
   - gsd.service.ts: assignGsd, recordWeekly, getHistory, getDepartmentSummary
   - gsd.controller.ts

3. artifacts/erp-dashboard/src/components/hr/GsdGraph.tsx yarat:
   - 12 oylik Recharts LineChart (actual vs target)
   - ReferenceLine: maqsad chizig'i
   - Trend ko'rsatkich: ↑ yashil / ↓ qizil

4. EmployeeProfile.tsx ga GsdGraph komponentini qo'sh

5. SevenFunctionsDashboard.tsx ga 7 otdelenie GSD paneli qo'sh
```

---

### YO'NALISH 12: Haftalik GSD Hisoboti

```
ШВБ Недельные Планы papkasidan:

Bajар:

1. dashboard.json (uz + ru) ga qo'sh:
   weeklyGsdSummary, gsdByDepartment, gsdLeaderboard, gsdTrend,
   topPerformer, needsImprovement, weeklyReportGenerated

2. apps/api/src/modules/hr/gsd/weekly-report.service.ts yarat:
   - generateWeeklyReport(): har bo'lim GSD xulosasi
   - getLeaderboard(): eng yuqori GSD xodimlar top-10
   - sendWeeklyDigest(): Dushanba 09:00 da rahbarlarga yuboriladi

3. artifacts/erp-dashboard/src/pages/ERPDailyReports.tsx ga:
   Haftalik GSD hisoboti bo'limi — barcha bo'limlar tabloda
   Export: XLSX formatida yuklab olish

4. DirectorDashboard.tsx ga:
   Haftalik GSD leaderboard widget (top 5 xodim)
```

---

### YO'NALISH 13: Holat Formulasi — Kompaniya Monitoring

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Формула Состояний/ papkasidagi barcha fayllar
  - /mnt/Архив/ШВБ/Формула Состояний/ДНЕВНИК ВЫПОЛНЕНИЯ.docx

Bajар:

1. director.json (uz + ru) ga qo'sh:
   stateFormula, companyState, stateNormal, stateRisk, stateCritical, stateGrowth,
   stateThreshold, autoStateDetect, stateHistory, stateChangeAlert,
   executionDiary, dailyStateLog, stateReasonNote

2. apps/api/src/modules/director/company-state/:
   - company-state.enum.ts: enum CompanyState { NORMAL, RISK, CRITICAL, GROWTH }
   - company-state-log.entity.ts: {id, state, kpis, detectedAt, resolvedAt, note}
   - company-state.service.ts:
     calculateState(): KPI asosida holat hisoblaydi
     getHistory(days: number): oxirgi N kunlik holat tarixi
     sendAlert(state): holat o'zgarganda bildirishnoma
   - state-thresholds.entity.ts: sozlanuvchi chegaralar

3. artifacts/erp-dashboard/src/components/director/CompanyStateWidget.tsx yarat:
   - Rangli katta indikator: 🟢/🟡/🟠/🔴
   - Qachondan beri shu holatda
   - Asosiy sabab KPI ko'rsatkichlari
   - O'tgan 30 kun mini-grafik

4. DirectorDashboard.tsx da CompanyStateWidget yuqorida ko'rinsin

5. Cron: har kuni 07:00 holat qayta hisoblanadi, o'zgansa direktor ogohlantiriladi
```

---

### YO'NALISH 14: Bajarish Kundaligi (Дневник Выполнения)

```
ШВБ: ДНЕВНИК ВЫПОЛНЕНИЯ.docx — real 2020 yozuvlar mavjud

Bajар:

1. director.json ga qo'sh:
   executionDiary, dailyEntry, dailyState, dailyMainKpi, dailyMainIssue,
   dailySolution, tomorrowPlan, weeklyHighlights, monthlyReview

2. apps/api/src/modules/director/diary/:
   - diary-entry.entity.ts: {id, date, state, mainKpiValue, mainIssue,
     solution, tomorrowPlan, authorId, createdAt}
   - diary.service.ts: create, findByDateRange, getMonthSummary

3. artifacts/erp-dashboard/src/pages/DirectorExtended.tsx ga:
   Kundalik yuritish shakli — har kuni direktоr to'ldirishi kerak
   - Bugungi holat tanlash
   - Asosiy KPI qiymati
   - Asosiy muammo va yechim
   - Ertangi reja

4. Oylik tahlil: 30 ta kundalik yozuvdan trend, takrorlanuvchi muammolar
```

---

### YO'NALISH 15: Ideal Kartina Paneli

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Стратегическое планирование/Идеальная картина.xlsx

Bajар:

1. director.json ga qo'sh:
   idealPicture, idealVsActual, weeklyProfitTarget, weeklyRevenueTarget,
   branchCountTarget, employeeCountTarget, idealProgress,
   gapAnalysis, timeToIdeal, quarterlyMilestone

2. apps/api/src/modules/director/ideal-picture/:
   - ideal-targets.entity.ts: {id, metric, idealValue, currentValue, unit, year}
   - ideal-picture.service.ts: getAll, updateCurrent, getProgress, getGapAnalysis
   - Seed: 100M foyda, 800M daromad, 15 filial, 500 xodim

3. artifacts/erp-dashboard/src/components/director/IdealPicturePanel.tsx yarat:
   Har ko'rsatkich uchun:
   - Progress bar: haqiqat / maqsad
   - Yil davomida trend grafigi
   - "Erishish uchun qancha qoldi" hisoblash

4. StrategicTasksPanel.tsx ga IdealPicturePanel qo'sh
```

---

### YO'NALISH 16: Lavozim Papkasi (Должностная Папка)

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Должностная Папка/ papkasidagi barcha 25 fayl

Bajар:

1. hr.json (uz + ru) ga qo'sh:
   positionFolder, folderSection, jobDescription, responsibilities,
   gsdSection, regulationSection, processSection, reportSection,
   trainingSection, folderCompletion, onboardingRoadmap,
   folderRequired, folderOptional, openFolder, downloadFolder

2. apps/api/src/modules/hr/position-folder/:
   - position-folder.entity.ts: {id, positionId, sections (JSONB), version, updatedAt}
   - folder-section.enum.ts: 6 ta bo'lim nomi
   - position-folder.service.ts: getByPosition, update, generatePdf
   - onboarding-progress.entity.ts: {employeeId, positionId, sectionsRead,
     completionPct, startedAt, completedAt}

3. artifacts/erp-dashboard/src/pages/HRDashboard.tsx ga:
   Lavozim papkasi paneli — har lavozim % to'liqlik bilan

4. artifacts/erp-dashboard/src/components/hr/PositionFolderViewer.tsx yarat:
   - 6 bo'lim akkordeon ko'rinishida
   - Har bo'lim o'qilganlik belgi
   - Tugallanish progress ring (0-100%)

5. LMS moduli bilan integratsiya: Papkaning 6-bo'limi (Ta'lim) LMS kurslarga yo'naltiradi
```

---

### YO'NALISH 17: Onboarding Yo'l Xaritasi

```
ШВБ Должностная Папка dan:

Bajар:

1. hr.json ga qo'sh:
   onboarding, onboardingRoadmap, onboardingDay, onboardingWeek,
   onboardingMonth, onboardingStatus, onboardingMentor,
   onboardingTasks, onboardingComplete, probationPeriod

2. apps/api/src/modules/hr/onboarding/:
   - onboarding-plan.entity.ts: {id, positionId, tasks (JSONB), duration: 90 days}
   - onboarding-progress.entity.ts: {employeeId, taskId, completedAt, mentorNote}
   - onboarding.service.ts: startOnboarding, completeTask, getProgress, assignMentor

3. artifacts/erp-dashboard/src/components/hr/OnboardingRoadmap.tsx yarat:
   - Stepper: 1-hafta / 2-hafta / 1-oy / 3-oy
   - Har bosqichda vazifalar ro'yxati
   - Mentor kim ekani ko'rsatilgan
   - % tugallanish progress bar

4. EmployeeProfile.tsx da yangi xodim uchun OnboardingRoadmap ko'rsatilsin
```

---

### YO'NALISH 18: Haftalik Reja Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Недельные Планы Ген директора/ barcha 8 fayl

Bajар:

1. hr.json + director.json ga qo'sh:
   weeklyPlan, weeklyTopTasks, task1-5, weeklyGsdTarget,
   successFactors, weeklyReview, prevWeekActual, thisWeekTarget,
   weeklyPlanCreate, weeklyPlanSubmit, weeklyPlanApprove

2. apps/api/src/modules/hr/weekly-plan/:
   - weekly-plan.entity.ts: {id, employeeId, weekDate, gsdTarget,
     task1..task5, successFactors, status, approvedBy}
   - weekly-plan.service.ts: create, findByEmployee, findByWeek, approve

3. artifacts/erp-dashboard/src/pages/HRExtended.tsx ga:
   Haftalik reja yaratish modali:
   - GSD maqsad kiritish (o'tgan hafta avtomatik ko'rsatiladi)
   - 5 ta asosiy vazifa maydoni
   - Muvaffaqiyat omillari

4. DirectorDashboard.tsx ga:
   Barcha bo'lim boshliqlarining haftalik rejasi — tasdiqlash holati bilan

5. Cron: Juma 17:00 da keyingi hafta reja topshirish eslatmasi
```

---

### YO'NALISH 19: 3-Savat Hujjat Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Система 3-х корзин/ barcha 6 fayl

Bajар:

1. kanban.json (uz + ru) ga qo'sh:
   threeBasketsSystem, incomingBasket, pendingBasket, outgoingBasket,
   basketRule24h, basketOverdue, moveToProcessing, moveToOutgoing,
   archiveDocument, personalProgram, dailyTaskList, basketStats

2. apps/api/src/modules/kanban/ kengaytir:
   - Existing Kanban entity ga basket_type field qo'sh:
     enum BasketType { INCOMING = 'incoming', PENDING = 'pending', OUTGOING = 'outgoing' }
   - Migration: ALTER TABLE kanban_tasks ADD COLUMN basket_type TEXT DEFAULT 'incoming'
   - kanban.service.ts ga: moveToBasket(), getOverdueIncoming(), getBasketStats()

3. artifacts/erp-dashboard/src/components/kanban/ThreeBaskets.tsx yarat:
   - 3 ustun: Kiruvchi / Kutilmoqda / Chiquvchi
   - Drag & drop (dnd-kit orqali) — mavjud bo'lsa ishlatilsin
   - Kiruvchi da 24 soatdan oshgan elementlar qizil highlight
   - Har savatda element soni badge

4. KanbanBoard.tsx boshida ThreeBaskets ko'rsatilsin

5. Cron: kuniga bir marta 24 soatdan oshgan INCOMING kartalar uchun egasiga eslatma
```

---

### YO'NALISH 20: Персональная Программа

```
ШВБ: /mnt/Архив/ШВБ/Система 3-х корзин/Персональная программа.docx

Bajар:

1. kanban.json ga qo'sh:
   personalProgram, programDay, programWeek, programTasks,
   programPriority, programTime, programDone, programRollover

2. apps/api/src/modules/kanban/personal-program/:
   - personal-task.entity.ts: {id, userId, title, priority, scheduledDate,
     scheduledTime, isCompleted, rolledOverFrom, createdAt}
   - personal-program.service.ts: create, findByDate, complete, rollover
   - Rollover mantiq: bajarilmagan task ertangi kunga o'tadi

3. artifacts/erp-dashboard/src/components/kanban/PersonalProgram.tsx yarat:
   - Kunlik dastur ko'rinishi: soat bo'yicha grid
   - Ustunlik rangi: Yuqori=qizil, O'rta=sariq, Past=yashil
   - Drag to reorder
   - Haftalik ko'rinishga o'tish tugmasi

4. KanbanBoard.tsx da toggle: Kanban / Personal Program ko'rinish
```

---

### YO'NALISH 21: 7-Otdelenie Tuzilmasi — HR Moduli

```
ШВБ: Справочник статистик dan 7 otdelenie ma'lumotlari

Bajар:

1. hr.json ga qo'sh:
   otdelenie, otdelenieNumber, otdelenieHead, otdelenieGsd,
   building, communication, finance, marketing, understanding,
   sales, administration, otdelenieMember, otdelenieKpi

2. apps/api/src/modules/core/departments/ kengaytir:
   - department.entity.ts ga otdelenie_number (1-7) va gsd_metric field qo'sh
   - Seed: 7 ta ШВБ otdeleniya standart ma'lumotlari

3. artifacts/erp-dashboard/src/pages/SevenFunctionsDashboard.tsx kengaytir:
   Har otdelenie uchun:
   - Rahbar ismi
   - Xodimlar soni
   - GSD qiymati (joriy vs maqsad)
   - Holat indikator (🟢/🟡/🔴)

4. OrgChartPage.tsx da 7 otdelenie ierarxiyasi ko'rsatilsin
```

---

### YO'NALISH 22: Rекомендательный Совет Sessiyasi

```
ШВБ koordinatsiya reglamentidan:
Seshanba kuni Рек.Совет — ЗВС ko'rib chiqadi

Bajар:

1. coordination.json ga qo'sh:
   recCouncilSession, sessionDate, sessionAgenda, zvsUnderReview,
   sessionDecision, approvedAmount, rejectedAmount, partialApproval,
   sessionClosed, nextSession

2. apps/api/src/modules/coordination/rec-council/:
   - rec-council-session.entity.ts: {id, sessionDate, councilLevel: 3,
     zvsIds (array), decisions (JSONB), totalApproved, totalRejected, closedAt}
   - rec-council.service.ts: createSession, addZvsToSession, closeSession,
     generateSessionReport

3. artifacts/erp-dashboard/src/pages/CoordinationPage.tsx ga:
   Рек.Совет sessiya bo'limi:
   - Joriy hafta sessiyasi: sana, holat, ЗВС ro'yxati
   - Ko'rib chiqish modali: ЗВС tafsilotlari + qaror berish
   - Sessiya yopish + hisobot generatsiya

4. Cron: Seshanba 08:45 da Рек.Совет a'zolariga: "Bugun sessiya bor, X ta ЗВС kutmoqda"
```

---

### YO'NALISH 23: Statistika Реглament Tizimi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Регламентлар/2020-04-24 Регламент по статистикам.docx

Bajар:

1. settings.json (uz + ru) ga qo'sh:
   statisticsRegulation, statDefinition, statFormula, statMeasure,
   statFrequency, statSource, statTarget, statOwner,
   statApproved, statChanged, regulationVersion

2. apps/api/src/modules/admin/stat-regulations/:
   - stat-regulation.entity.ts: {id, statName, definition, formula,
     unit, frequency, source, ownerId, targetValue, approvedAt, version}
   - CRUD + versioning (o'zgarish tarixi saqlanadi)

3. artifacts/erp-dashboard/src/pages/Settings.tsx ga:
   "Statistika Reglamenti" bo'lim — barcha GSD lar ro'yxati
   Qo'shish / Tahrirlash / Tarix ko'rish

4. LMS bilan integratsiya: Har yangi reglament → avto LMS test yaratiladi
```

---

### YO'NALISH 24: Kadrlar Statistikasi — HR GSD

```
ШВБ Справочник statistikdan 1-otdelenie (Построение) KPI lar:

Bajар:

1. hr.json ga qo'sh:
   hrKpi, onboardedCount, recruitedCount, adaptationRate,
   turnoverRate, trainingCompletionRate, hrEfficiency,
   vacancyFillTime, candidatesReviewed, offersExtended

2. apps/api/src/modules/hr/hr-kpi/:
   - hr-kpi-snapshot.entity.ts: haftalik HR statistika
   - hr-kpi.service.ts: haftalik hisoblash va saqlash

3. HRAIDashboard.tsx kengaytir:
   ШВБ formatidagi 1-otdelenie GSD paneli:
   - Qabul qilingan va onboarding tugagan xodimlar
   - Muddati o'tgan bo'sh lavozimlar
   - Bu oyda ketganlar (turnover)

4. AI integratsiya: hr-ai.service.ts ga
   analyzeHrKpis(): statistika asosida tavsiyalar beradi
```

---

### YO'NALISH 25: Marketing Statistikasi — 4-Otdelenie

```
ШВБ dan 4-otdelenie (Marketing) KPI tizimi:

Bajар:

1. marketing.json (uz + ru) ga qo'sh:
   marketingGsd, leadsCount, newLeads, qualifiedLeads, conversionRate,
   costPerLead, marketingRoi, campaignEfficiency, socialReach,
   marketingBudgetUsed, marketingBudgetRemain

2. apps/api/src/modules/marketing/ kengaytir:
   - marketing-kpi.entity.ts: haftalik marketing statistika
   - marketing-kpi.service.ts: haftalik hisoblash

3. MarketingDashboard.tsx kengaytir:
   ШВБ GSD: "Yangi leads soni — haftalik"
   - Joriy hafta leads
   - Marketing ROI grafigi
   - Kanal bo'yicha taqsimot (SMM, reklama, tavsiya)

4. marketing-ai.service.ts ga:
   analyzeCampaignEfficiency(): qaysi kanal eng samarali
```

---

### YO'NALISH 26: CRM Sotish Statistikasi — 6-Otdelenie

```
ШВБ dan 6-otdelenie (Продажи) KPI tizimi:
РО2 texnologiyalar papkasidagi savdo standartlari

Bajар:

1. sd.json (uz + ru) ga qo'sh:
   salesGsd, weeklySalesVolume, closedDeals, averageDealSize,
   conversionRate, salesCycleLength, customerRetention,
   debtorControl, salesTarget, salesVsTarget

2. apps/api/src/modules/sd/sales-kpi/:
   - sales-kpi.entity.ts: haftalik sotish statistika
   - Direktor uchun: haftalik sotish xulosasi

3. SDDashboard.tsx kengaytir:
   ШВБ GSD: "Haftalik sotuv hajmi (so'm)"
   - Joriy hafta vs o'tgan hafta taqqos
   - Menejer bo'yicha sotuv leaderboard
   - Debitorlik trend grafigi

4. SDKpi.tsx: ШВБ standartiga mos KPI hisobotini to'liq qayta ko'ring
```

---

### YO'NALISH 27: LMS — Lavozim Papkasi Kurslari

```
ШВБ: Должностная Папкaning 6-bo'limi (Ta'lim materiallari)

Bajар:

1. lms.json (uz + ru) ga qo'sh:
   positionCourse, regulationTest, mandatoryCourse, optionalCourse,
   courseAssignedTo, completionRequired, courseDeadline,
   gsdTrainingModule, onboardingCourse, folderLinkedCourse

2. apps/api/src/modules/lms/ kengaytir:
   - course.entity.ts ga position_id va is_mandatory field qo'sh
   - Avtomatik: Yangi xodim qabul qilinganda → lavozimga biriktirilgan
     barcha majburiy kurslar avtomatik tayinlanadi

3. LMSDashboard.tsx kengaytir:
   "Lavozim papkasi kurslari" filter:
   - Majburiy vs ixtiyoriy
   - Kurs bo'yicha xodimlar progress
   - Eng ko'p kechikkan kurslar

4. HRDashboard.tsx ga mini widget: Tugallanmagan majburiy kurslar soni
```

---

### YO'NALISH 28: LMS — Регламент Testlari

```
ШВБ: Har reglament xodimlar tomonidan bilinishi kerak

Bajар:

1. lms.json ga qo'sh:
   regulationTest, testFromRegulation, testPassRequired, testPassScore,
   regulationVersion, testRetake, testHistory, certifiedInRegulation

2. apps/api/src/modules/lms/ kengaytir:
   - Test entity ga regulation_id field qo'sh
   - Reglament yangilanganda: tegishli xodimlar qayta test topshiradi
   - Kechikish: 7 kun ichida o'tmasa — rahbarga bildirishnoma

3. LMSExtended.tsx ga:
   "Регламент Testlari" bo'lim:
   - Har reglament: o'tganlar/o'tmaganlar foizi
   - Topshirish muddati
   - Qayta topshirish tarix

4. Tests.tsx ga filter: "Регламент bo'yicha" filtri
```

---

### YO'NALISH 29: Inspektor Menejer Roli

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Описание должности Менеджер инспекции/ barcha 8 fayl

Bajар:

1. hr.json ga qo'sh:
   inspectionManager, inspectionSchedule, inspectionTarget,
   inspectionResult, inspectionScore, inspectionCriteria,
   violationFound, correctionPlan, inspectionReport,
   inspectionGsd, inspectedDepartment

2. apps/api/src/modules/hr/inspection/:
   - inspection.entity.ts: {id, inspectorId, departmentId, scheduledDate,
     criteria (JSONB), score, violations, correctionPlan, status}
   - inspection.service.ts: schedule, conduct, generateReport

3. artifacts/erp-dashboard/src/pages/HRExtended.tsx ga:
   "Inspeksiya" bo'lim:
   - Rejalangan tekshiruvlar jadvali
   - O'tkazilgan tekshiruvlar natijalari
   - Bo'lim bo'yicha umumiy ball

4. QCModule.tsx bilan integratsiya: ishlab chiqarish inspeksiyasi
```

---

### YO'NALISH 30: Yillik Xodimlar Anketa

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Хужжатлар/Корхона йиллик ички анкетаси.dotx

Bajар:

1. hr.json (uz + ru) ga qo'sh:
   annualSurvey, surveyQuestion, surveyAnswer, surveyAnonymous,
   surveyPeriod, surveyResult, satisfactionScore, departmentScore,
   surveyTrend, surveyPublished, surveyRequired

2. apps/api/src/modules/hr/annual-survey/:
   - survey.entity.ts: {id, title, year, isAnonymous, questions (JSONB)}
   - survey-response.entity.ts: {id, surveyId, employeeId (nullable if anon),
     answers (JSONB), submittedAt}
   - survey.service.ts: create, publish, respond, getResults, getDeptSummary

3. Questionnaire.tsx kengaytir yoki QuestionnaireTemplates.tsx ga:
   "Yillik Anketa" shabloni:
   - ШВБ dan olingan 17 savollik standart anketa
   - Anonim rejim toggle
   - Natijalarni rahbarga ko'rsatish holati sozlash

4. HRDashboard.tsx ga: "Anketa holati" widget (% topshirganlar)
```

---

### YO'NALISH 31: Приказлар (Rasmiy Buyruqlar) Tizimi

```
ШВБ: /mnt/Архив/ШВБ/Приказлар/ barcha 8 fayl

Bajар:

1. coordination.json ga qo'sh:
   order, createOrder, orderNumber, orderDate, orderSubject,
   orderBody, orderSignedBy, orderEffectiveDate, orderArchive,
   orderSearch, orderCategory, orderStatus

2. apps/api/src/modules/coordination/orders/:
   - order.entity.ts: {id, number, date, subject, body, signedBy,
     effectiveDate, category, status, attachmentUrl}
   - order.service.ts: create, findAll, search, archive, generatePdf

3. artifacts/erp-dashboard/src/components/coordination/OrdersRegistry.tsx yarat:
   - Rasмiy buyruqlar arxivi (qidiruv + filter)
   - Kategoriya: HR, Moliya, Operatsion, Strategik
   - Sana bo'yicha tartib
   - PDF yuklab olish

4. CoordinationPage.tsx ga OrdersRegistry bo'lim sifatida qo'sh
```

---

### YO'NALISH 32: Strategik Rejalashtirish Paneli

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Стратегическое планирование/ barcha 19 fayl

Bajар:

1. director.json ga qo'sh:
   strategicPlanning, annualPlan, quarterlyPlan, monthlyPlan,
   strategicDirection, keyInitiative, milestone, milestoneDeadline,
   strategicRisk, riskMitigation, planProgress, planDeviation

2. apps/api/src/modules/director/strategic-plan/:
   - strategic-goal.entity.ts: {id, title, description, deadline, owner,
     progress, keyResults (JSONB), status}
   - milestone.entity.ts: {id, goalId, title, deadline, completedAt}
   - strategic-plan.service.ts: create, updateProgress, getMilestones

3. StrategicTasksPanel.tsx kengaytir:
   - OKR formatidagi maqsadlar (Objective → Key Results)
   - Quarterly milestone jadvali
   - Maqsad bo'yicha mas'ul shaxs
   - Progress ring grafigi

4. DirectorDashboard.tsx ga strategik maqsadlar mini xulosa widget
```

---

### YO'NALISH 33: Taktik Rejalashtirish — Oylik

```
ШВБ taktik rejalashtirish formatidan:

Bajар:

1. director.json ga qo'sh:
   tacticalPlan, monthlyObjective, monthlyKpi, weeklyBreakdown,
   tacticalTask, taskOwner, taskDeadline, taskStatus,
   monthlyReview, monthlyActual, monthlyDeviation

2. apps/api/src/modules/director/tactical-plan/:
   - monthly-plan.entity.ts: {id, month, year, objectives (JSONB),
     weeklyTasks (JSONB), status}
   - monthly-plan.service.ts: create, findByMonth, review, generateReport

3. DirectorExtended.tsx ga:
   Oylik taktik reja ko'rinishi:
   - 4 hafta → har hafta uchun asosiy vazifalar
   - Hafta oxirida % bajarilish ko'rsatish
   - Oylik yakun hisobot generatsiya

4. Strategik reja bilan bog'liq: oylik maqsadlar strategik maqsaddan keladi
```

---

### YO'NALISH 34: Kaizen Metodologiyasi Integratsiyasi

```
ШВБ faylni o'qi:
  - /mnt/Архив/ШВБ/Кайзен Клуб/ barcha 8 fayl
  - /mnt/Архив/Кайзен Клуб/Кайзен Клуб.docx

Bajар:

1. lms.json + settings.json ga qo'sh:
   kaizen, kaizenClub, kaizenPrinciple, continuousImprovement,
   kaizenIdea, kaizenImplemented, kaizenImpact, kaizenMember,
   pdcaCycle, plan, do, check, act

2. apps/api/src/modules/lms/kaizen/:
   - kaizen-idea.entity.ts: {id, title, proposedBy, department,
     problem, solution, expectedImpact, status, implementedAt}
   - kaizen.service.ts: create, review, implement, measureImpact

3. artifacts/erp-dashboard/src/components/shared/KaizenBoard.tsx yarat:
   Kaizen taklif taxta:
   - Taklif berish shakli
   - Ko'rib chiqilayotgan takliflar
   - Amalga oshirilgan yaxshilanishlar (ta'sir bilan)

4. LMSDashboard.tsx ga KaizenBoard widget qo'sh
```

---

### YO'NALISH 35: Ombor Material Inventar — WMS

```
ШВБ da ombor 7-otdelenie (Администрация) ostida

Bajар:

1. wms.json (uz + ru) ga qo'sh (hozir 43 kalit, 15 ta qo'sh):
   inventoryAccuracy, stockCount, discrepancy, stockAlert,
   minStockLevel, maxStockLevel, reorderPoint, warehouseGsd,
   internalRequest, issueSlip, receiptNote, materialKit,
   warehouseInspection, dailyStockReport, weeklyInventory

2. apps/api/src/modules/wms/ kengaytir:
   - stock-alert.entity.ts: {id, materialId, currentStock,
     minLevel, alertType, resolvedAt}
   - Cron: kuniga 1 marta minStockLevel ostiga tushgan materiallar uchun alert

3. WMSDashboard.tsx kengaytir:
   ШВБ GSD: "Inventarizatsiya aniqligi (%)"
   - Kam qoldiq alertlar ro'yxati
   - Kunlik material harakatlar xulosa
   - Haftalik inventarizatsiya holati

4. MaterialBalance.tsx: WMS modul to'liq qamrov — endi barcha 43+15 kalit
```

---

### YO'NALISH 36: Xodim Reytingi va Bonus Tizimi

```
ШВБ GSD tizimidan: Reyting = GSD natijasiga qarab

Bajар:

1. hr.json ga qo'sh:
   employeeRating, ratingBasis, bonusCalculation, bonusAmount,
   bonusApproved, bonusMonth, ratingScore, ratingCategory,
   topEmployee, needsDevelopment, performancePip

2. apps/api/src/modules/hr/rating/:
   - employee-rating.entity.ts: {id, employeeId, period, gsdScore,
     qualitativeScore, totalScore, bonusAmount, category}
   - rating.service.ts: calculateMonthly, approveBonuses, generateReport

3. EmployeeRating.tsx kengaytir:
   ШВБ asosida reyting:
   - GSD foizi: 60% og'irlik
   - Sifatli ko'rsatkichlar: 40% og'irlik
   - Bonus summasi avtomatik hisoblaydi
   - Toifalar: A (>90%), B (70-90%), C (<70%)

4. PayrollAutomation.tsx bilan integratsiya: Bonus oylik maoshga qo'shiladi
```

---

### YO'NALISH 37: IoT — Ishlab Chiqarish Monitoring

```
ШВБ 7-otdelenie (Administratsiya) — Ishlab chiqarish monitoring:

Bajар:

1. iot.json (uz + ru) ga qo'sh:
   productionSensor, machineStatus, uptime, downtimeReason,
   shiftProductivity, qualityGate, sensorAlert, iotGsd,
   machineEfficiency, plannedVsActual, iotReport

2. apps/api/src/modules/iot/ kengaytir:
   - production-sensor.entity.ts: mashina holati sensorlari
   - downtime.entity.ts: to'xtash sabablari va muddati
   - MES bilan integratsiya: sensor → MES downtime avtomatik

3. IoTDashboard.tsx kengaytir:
   ШВБ GSD: "IT tizim uptime %"
   - Real vaqt mashina holati
   - Shift davomida unumdorlik
   - Sensordan keladigan alert tizimi

4. MESDashboard.tsx bilan birlash: ishlab chiqarish + IoT monitoring
```

---

### YO'NALISH 38: Telegram Bot — ШВБ Jarayonlari Uchun

```
ШВБ da operativlik muhim — Telegram asosiy aloqa kanali

Bajар:

1. notifications.json (uz + ru) ga qo'sh:
   telegramZvsReminder, telegramFpDay, telegramGsdReport,
   telegramStateAlert, telegramDoclaReceived, telegramRaspReceived,
   telegramKpiUpdate, telegramWeeklyDigest, telegramBotCommand

2. apps/api/src/modules/notifications/ kengaytir:
   - telegram-shvb.service.ts — ШВБ jarayonlari uchun maxsus handlerlar:
     /zvs_status — ЗВС holatini so'rash
     /my_gsd — mening haftalik GSD
     /company_state — joriy kompaniya holati
     /weekly_digest — haftalik xulosa

3. TelegramBotAdmin.tsx kengaytir:
   ШВБ bot komandalar ro'yxati
   Xabarnoma sozlamalari: kim nima oladi

4. Cron → Telegram integratsiya:
   - Seshanba 09:00: ЗВС eslatmasi (bo'lim boshliqlariga)
   - Dushanba 10:00: Haftalik GSD xulosasi (direkto'ga)
   - Har kun 18:00: Kompaniya holati (direktorga)
```

---

### YO'NALISH 39: AI Tahlil — ШВБ Ko'rsatkichlari Uchun

```
Module 3 da AI servislar mavjud — ularni ШВБ bilan bog'la

Bajар:

1. ai.json (uz + ru) ga qo'sh:
   aiAnalysis, aiGsdInsight, aiStateRecommendation, aiZvsOptimize,
   aiWeeklyForecast, aiRiskDetection, aiBenchmark, aiActionPlan

2. apps/api/src/modules/ai/ servislarni kengaytir:

   director-ai.service.ts ga:
   - analyzeCompanyState(): Holat formulasi asosida sabablar + tavsiyalar
   - predictNextWeekState(): KPI trendy asosida prognoz
   - generateWeeklyBriefing(): Direktor uchun haftalik AI xulosasi

   finance-ai.service.ts ga:
   - analyzeZvsRequests(): ЗВС naqshlarini tahlil etish
   - forecastCashFlow(): Moliya oqimi prognozi

   hr-ai.service.ts ga:
   - analyzeGsdTrends(): Kim o'smoqda, kim qolmoqda
   - suggestBonuses(): GSD asosida bonus tavsiyalar

3. DirectorDashboard.tsx ga:
   "AI Tavsiyalari" widget — har hafta yangilanadi
   Asosiy xavflar + tavsiya qilingan harakatlar
```

---

### YO'NALISH 40: To'liq Sinov va Sertifikatsiya

```
Barcha 39 yo'nalish bajarilgach — yakuniy tekshiruv

Bajар:

1. Playwright E2E testlar yoz:
   tests/shvb/zvs.spec.ts:
     - ЗВС yaratish → tasdiqlash → hisobot tekshirish
   tests/shvb/coordination.spec.ts:
     - Доклад yozish → qabul qiluvchiga yetish
   tests/shvb/gsd.spec.ts:
     - GSD qiymat kiritish → grafik yangilanish
   tests/shvb/company-state.spec.ts:
     - KPI o'zgarganda holat avtomatik o'zgarishi

2. i18n completeness test:
   tests/i18n/shvb-completeness.spec.ts:
   - Barcha yangi kalitlar UZ = RU tekshirish
   - Hech bir kalit bo'sh string emasligi
   - Interpolatsiya kalitlari to'g'ri formatda

3. API integration testlar (Vitest):
   - ЗВС lifecycle to'liq
   - Cron joblar to'g'ri ishlashi
   - Holat formulasi chegaralari

4. Performance tekshirish:
   - 76+ consumer bilan i18n context re-render yo'qligi
   - GSD grafigi 12 oy ma'lumot bilan render vaqti <200ms
   - ThreeBaskets widget 100+ element bilan ishlashi

5. Lokalizatsiya yakuniy tekshiruv:
   - Barcha 40 yo'nalish sahifalarini UZ va RU da ochib ko'rish
   - Har sahifada hech qanday kalit kodi (i.e. "gsd.target") ko'rinmasligi

6. Hujjat yaratish:
   - SHVB_INTEGRATION_COMPLETE.md — nima qilindi, qaysi fayllarga
   - Deployment checklist: migratsiya tartibi, muhit o'zgaruvchilar
   - Xodimlar uchun qo'llanma: yangi funksiyalar ishlatish
```

---

## BARCHA PROMPTLARNI KETMA-KET BAJARISH TARTIBI

```
1-HAFTA (Zudlik):
  ✅ Yo'nalish 1: ЗВС tizimi
  ✅ Yo'nalish 2: ЗНО tizimi
  ✅ Yo'nalish 3: 4 Hisob raqam
  ✅ Yo'nalish 4: Haftalik ФП tsikl
  ✅ Yo'nalish 7: Koordinatsiya moduli

2-HAFTA (Muhim):
  ✅ Yo'nalish 11: GSD tizimi
  ✅ Yo'nalish 13: Holat formulasi
  ✅ Yo'nalish 16: Lavozim papkasi
  ✅ Yo'nalish 18: Haftalik reja
  ✅ Yo'nalish 19: 3-Savat tizimi

3-4-HAFTA (O'rta):
  ✅ Yo'nalishlar 8-10: Доклад, Распоряжение, Protokol
  ✅ Yo'nalishlar 14-15: Kundalik, Ideal kartina
  ✅ Yo'nalishlar 21-22: 7-Otdelenie, Рек.Совет

1-2 OY (Kengaytirish):
  ✅ Yo'nalishlar 24-30: Statistika, LMS, Inspektor, Anketa
  ✅ Yo'nalishlar 31-36: Приказlar, Strategiya, Kaizen, Reyting

2-3 OY (Yakunlash):
  ✅ Yo'nalishlar 37-39: IoT, Telegram, AI
  ✅ Yo'nalish 40: Sinov va Sertifikatsiya
```

---

## UMUMIY NATIJA

```
40 yo'nalish bajarilgach:

i18n kalitlari:   3,209 → ~3,600 (UZ = RU, 100% sinxron)
Yangi modullar:   29 → 30 (coordination qo'shildi)
Yangi sahifalar:  326 → ~340
Yangi API:        36+ → 55+ NestJS modul
Qoplash:          62% → 98%+

ШВБ elementlari ERP da:
  ✅ ЗВС/ЗНО → Finance moduli
  ✅ 5 Kengash → Coordination moduli
  ✅ GSD tizimi → HR + Director modullar
  ✅ Holat formulasi → Director dashboard
  ✅ 3-Savat → Kanban moduli
  ✅ Lavozim papkasi → HR + LMS modullar
  ✅ Haftalik reja → HR + Director modullar
  ✅ Ideal kartina → Director dashboard
  ✅ Strategik reja → Director modullar
  ✅ Kaizen → LMS moduli
  ✅ AI tahlil → AI modullar
  ✅ Telegram → Notifications moduli
```

---

> **EuroPrint Kokand · ШВБ → ERP 40 Yo'nalish Prompti**  
> Har prompt mustaqil bajarilishi mumkin.  
> Ketma-ketlik: Zudlik → Muhim → O'rta → Kengaytirish → Yakunlash
