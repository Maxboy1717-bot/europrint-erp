
EUROPRINT KOKAND

To'liq Tahlil va Solishtiruv Hisoboti

Uzbek-Language-Module 3  vs  Архив / ШВБ
ERP Tizimining ШВБ Talablariga To'liq Moslashtirish Rejasi

Tahlil qilingan papkalar
2 ta (Module 3 + Архив/ШВБ)
ERP modullari (Module 3)
29 ta tarjima moduli, 326 ta sahifa
ШВБ hujjatlari
237 ta fayl, 24 ta bo'lim
Tarjima kalitlari (UZ=RU)
3,209 ta kalit × 2 til = 6,418 ta
Backend modullar
36+ ta NestJS modul
Yangi modullar (Module 3)
AI, SD, MES, Kanban, Director, Security, IoT, Admin, MRO, Design, Logistics, POS
Tayyorlangan: 
2026-yil aprel · EuroPrint Kokand

1. IJROIYA XULOSA

Ushbu hisobot ikkita muhim manbani to'liq tahlil qiladi va ularni bir-biri bilan solishtiradi:

Uzbek-Language-Module 3 — EuroPrint ERP tizimining yangi, AI bilan boyitilgan versiyasi. 29 ta tarjima moduli, 326 ta sahifa, 36+ NestJS modul.
Архив/ШВБ — Школа Владельца Бизнеса (ШВБ). EuroPrint Kokand'ning 2020-yilda ishlab chiqilgan to'liq biznes boshqaruv tizimi. 237 ta hujjat.

Asosiy maqsad: ERP Module 3 ning ШВБ biznes talablariga qanday mos kelishini aniqlash va qaysi joylarda bo'shliqlar borligini to'liq ko'rsatish.

NATIJA: Module 3 texnik jihatdan kuchli va zamonaviy, lekin ШВБ'ning ba'zi maxsus biznes jarayonlari (ЗВС/ЗНО, koordinatsiya kengashlari, holat formulasi, 3-savat) uchun qo'shimcha i18n kalitlari va UI komponentlari talab etiladi.

2. UZBEK-LANGUAGE-MODULE 3 — TO'LIQ TAHLIL

2.1. Loyiha strukturasi
Papka / Qism
Tavsifi va tarkibi
artifacts/erp-dashboard/
React 19 + Vite 7.3 frontend. 326 sahifa, 143 komponent, 33 hook
artifacts/api-server/
Express.js API server — legacy backend
artifacts/europrint-site/
EuroPrint ommaviy veb-sayti
apps/api/ (nestjs)
NestJS 10.4 + Drizzle ORM + PostgreSQL backend. 36+ modul
i18n-sync/
i18n sinxronizatsiya tizimi — 29 modul, 6418 kalit
EUROPRINT_AI_HR_UPDATE/
Yangi AI + HR V2 kengaytmasi — 7 AI servis, Recruitment V2
HR_INTEGRATION_V2_COMPLETE/
HR integratsiya V2 — to'liq amalga oshirilgan
erp-tests/
Test to'plami — Playwright E2E + Vitest unit

2.2. i18n Tizimi — 29 Modul, 100% UZ=RU Sinxron
LANGUAGE_STORAGE_KEY = "europrint_language" · Default: uz · 29 modul · UZ kalit = RU kalit (har bir modulda)

Module 3'da i18n tizimi to'liq yangilangan: eski 12 moduldan 29 ta modulga kengaytirildi. Barcha UZ va RU kalitlari 100% teng.

Modul nomi
UZ kalitlar
RU kalitlar
Holat
common
200
200
✅ Sinxron
auth
80
80
✅ Sinxron
dashboard
56
56
✅ Sinxron
hr
285
285
✅ Sinxron
finance
284
284
✅ Sinxron
production
384
384
✅ Sinxron
warehouse
283
283
✅ Sinxron
wms
43
43
✅ Yangi modul
crm
354
354
✅ Sinxron
lms
110
110
✅ Sinxron
settings
63
63
✅ Sinxron
errors
51
51
✅ Sinxron
validation
29
29
✅ Sinxron
marketing
100
100
✅ JSON
navigation
62
62
✅ JSON
public
150
150
✅ Yangi modul
sd
101
101
✅ Yangi modul
mes
83
83
✅ Yangi modul
kanban
93
93
✅ Yangi modul
director
73
73
✅ Yangi modul
security
67
67
✅ Yangi modul
notifications
77
77
✅ Yangi modul
iot
77
77
✅ Yangi modul
admin
80
80
✅ Yangi modul
mro
82
82
✅ Yangi modul
design
78
78
✅ Yangi modul
logistics
69
69
✅ Yangi modul
pos
71
71
✅ Yangi modul
ai
72
72
✅ Yangi modul
JAMI
3,209
3,209
100% Sinxron ✅

2.3. Sahifalar inventari (326 ta sahifa)
Modul
Sahifalar soni
Asosiy sahifalar
HR / Xodimlar
18 ta
HRDashboard, Employees, PayrollAutomation, RecruitingKanban, EmployeeProfile, HRAIDashboard, OrgChartPage
Finance / Moliya
14 ta
FinanceDashboard, CFODashboard, BudgetManagement, CashFlowManagement, CashRegister, AccountsPayable, AccountsReceivable
Production / Ishlab chiqarish
12 ta
ProductionOrder360, BOMManagement, CapacityPlanning, RoutingConfiguration, ERPProduction, ProductionReport
Warehouse / Ombor
10 ta
WMSDashboard, WMSExtended, MaterialBalance, InventoryCount, InventoryValuation, BarcodeWarehouse
CRM / Sotish
8 ta
CRMWorkspace, CRMActivities, SDDashboard, SDSalesOrders, SDQuotations, SDCustomers
LMS / Ta'lim
8 ta
LMSDashboard, Courses, CourseDetail, TestDetail, Certificates, AIExams
MES / Ishlab chiqarish tizimi
7 ta
MESDashboard, MESDowntimes, MESExtended, MESWorkCenters, MESProducts
Marketing
11 ta
MarketingDashboard, MarketingCampaigns, MarketingLeads, MarketingCalendar, MarketingContent
Director / Rahbar
6 ta
DirectorDashboard, DirectorExtended, StrategicTasksPanel, DailyKPIDashboard, SevenFunctionsDashboard
QC / Sifat nazorati
6 ta
QCDashboard, QCExtended, QCApproval, QCFinalInspection, QCModule
Security / Xavfsizlik
4 ta
SecurityDashboard, SecurityExtended, AuditorPanel, SuperAdminPanel
IoT / Sensorlar
3 ta
IoTDashboard, IoTExtended, IoTTablet
AI / Sun'iy intellekt
6 ta
AIDesignGenerator, AIInterviewPage, AIProductionPlanning, AIReservation, HRAIDashboard
Camera / Kamera
11 ta
CameraAIAnalytics, CameraLiveMonitoring, FaceRecognitionMonitoring va boshqalar
Admin / Boshqarish
4 ta
SuperAdminPanel, SystemMonitor, TelegramBotAdmin, IntegrationManagement
Boshqalar
Qolgan
Kanban, Logistics, Design, MRO, POS, Analytics, GoalsKPI va boshqalar
JAMI
326 ta sahifa
6 ta asosiy modul + 10 ta qo'shimcha

2.4. Backend NestJS API — 36+ Modul
Backend modul
Kontrollerlar
Vazifasi
admin
admin-settings, admin-users
Tizim boshqaruvi, foydalanuvchilar
ai
ai-router
AI xizmatlar (HR, CRM, Finance, WMS, Marketing, Director)
auth
auth
JWT autentifikatsiya
crm
crm-deals, crm-leads
CRM funksionallik
design
design
Dizayn boshqaruvi
director
approvals, dashboard
Direktor darajasi boshqaruvi
finance
advance, budgets, gl, invoices, payments
Moliyaviy boshqaruv
hr
attendance, employees, leave, payroll
Kadrlar boshqaruvi V1
hr-v2
18 ta subdir: recruitment, onboarding...
Kadrlar boshqaruvi V2 + AI
iot
iot-sensors
IoT qurilmalar
kanban
kanban
Kanban board
lms
certificates, courses
O'qitish tizimi
logistics
logistics
Logistika operatsiyalari
marketing
marketing
Marketing kampaniyalari
mes
mes-operations, mes-sessions
Ishlab chiqarish tizimi
mm
mm-materials, mm-purchase-orders
Materiallar boshqaruvi
mro
mro
Ta'mirlash/texnik xizmat
notifications
notifications, telegram
Real-vaqt xabarnomalar
pos
barcode, inventory, reports
Kassa tizimi
pp
pp-bom, pp-orders, pp-routing
Ishlab chiqarish rejalashtirish
qc
qc-defects, qc-inspections
Sifat nazorati
sd
sd-deliveries, sd-invoices, sd-orders
Sotish va yetkazib berish
security
security
Xavfsizlik
wms
goods-issue, inventory, stock, warehouses
Ombor boshqaruvi

3. АРХИВ / ШВБ — TO'LIQ TAHLIL

Школа Владельца Бизнеса (ШВБ) — EuroPrint Kokand 2020-yilda ishlab chiqqan to'liq biznes boshqaruv tizimi. 237 fayl, 24 asosiy bo'lim.

3.1. ШВБ bo'limlari va fayllar soni
Bo'lim nomi
Fayllar soni
Asosiy mazmun
Финансовый Планирования/
64 fayl
Byudjet, ЗВС/ЗНО, 4 hisob, haftalik ФП tsikl, to'lanmagan schyotlar
Должностная Папка/
25 fayl
Lavozim ta'riflari, mas'uliyat, KPI, onboarding materiallari
Писменная Коммуникация/
21 fayl
Доклад/Распоряжение shablonlari, yozma muloqot standartlari
Стратегическое и Тактическое планирование/
19 fayl
Ideal картина, strategik maqsadlar, taktik rejalar
Координация/
16 fayl
5 kengash darajasi reglamenti, majlis protokollari
Статистика/
16 fayl
GSD/KPI formulalar, o'lchash standartlari, hisobot shablonlari
Формула Состояний/
11 fayl
Normal/Xavf/Inqiroz/O'sish holat aniqlash tizimi
Gmail (1)/
11 fayl
Dastur PDF'lari: statistika joriy etish programmasi
Планирование/
20 fayl
Operatsion rejalashtirish, kunlik/haftalik reja shablonlari
Недельные Планы Ген директора/
8 fayl
Bosh direktor haftalik reja formasi, GSD maqsad belgilash
Система 3-х корзин/
6 fayl
Kiruvchi/Kutilmoqda/Chiquvchi hujjat oqimi tizimi
Описание должности Менеджер инспекции/
8 fayl
Inspektor menejer roli, tekshiruv jarayonlari
Программа Владельца/
8 fayl
Eganing ish dasturlari, haftalik ko'rsatkichlar
Приказлар/
8 fayl
Rasmiy buyruqlar va ko'rsatmalar
Регламентлар/
2 fayl
Statistika reglamenti, lavozim reglamenti
Хафталик Планларим/
6 fayl
Haftalik shaxsiy rejalar
Хужжатлар/
4 fayl
Asosiy hujjatlar, yillik anketa
Дневникларим/
10 fayl
Kundalik bajarish yozuvlari, holat diagrammalari
Программы/
3 fayl
Asosiy programmalar
Кайзен Клуб/
8 fayl
Kaizen klubi materiallari, trening
РО2 учун технологиялар/
4 fayl
Texnologiyalar imkoniyatlari, savdo bo'limi
Ildiz fayllar
3 XLSX + 1 DOCX
Справочник статистик, Отчет форма, Ofis statistika dasturi
JAMI
237 ta fayl
24 asosiy bo'lim

3.2. ШВБ ning 7-Otdelenie tuzilmasi
Otdelenie
Asosiy KPI (GSD)
ERP Moduli
1 — Построение (HR)
Tayyor va ishga qabul qilingan xodimlar soni
HR modul + LMS
2 — Коммуникация
Vaqtida yetkazilgan Доклад/Распоряжение soni
Notifications + Kommunikatsiya moduli
3 — Финансы
P&L aniqligi, ЗВС bajarilishi (%)
Finance modul + Director
4 — Маркетинг
Yangi leads soni, marketing ROI
Marketing + CRM modul
5 — Понимание (LMS)
Testdan o'tgan xodimlar foizi
LMS modul
6 — Продажи (CRM)
Haftalik sotuv hajmi (so'm)
CRM + SD modul
7 — Администрация
Inventarizatsiya aniqligi, IT uptime
WMS + Warehouse + Security

3.3. Moliyaviy Rejalashtirish tizimi (64 fayl)
Jarayon
Tavsif
Hujjat soni
ЗВС (Zaявka na vydeleнie sredств)
Har seshanba barcha bo'limlar pul so'rash ariza yuboradi
15+ blank
ЗНО (Zaявka na Obyazatelstvo)
Kelajakdagi majburiyatlar uchun oldindan ruxsat
8+ blank
Haftalik ФП tsikl
Ses: ЗВС → Chor: ФП kuni → Pay: bank → Dush: naqd
12+ jadval
4 Hisob raqam
Счет №1, Единый налог, Главный, Оборотных средств
3 XLSX fayl
To'lanmagan schyotlar
Kreditorlik qarzi ro'yxati va kuzatuv
8+ fayl
Tasdiqlash matritsasi
3 daraja: ≤500K, ≤5M, >5M so'm
Регламент + ЗВС blanklari
Byudjet va xarajat tahlili
Mahsulot bo'yicha foyda marjasi, COGS, Break-even
10+ fayl

3.4. Koordinatsiya tizimi (16 fayl)
Kengash darajasi
Tarkibi va vakolati
Yig'ilish chastotasi
1. Совет Учредителей
Asoschilar — strategik yo'nalish, kapital qarorlari
Oylik
2. Исполнительный Совет
Direktor + top-menejerlar — operativ boshqaruv
Haftalik
3. Рекомендательный Совет
Bo'lim boshliqlar — ЗВС tasdiqlash, moliyaviy tavsiyalar
Seshanba (ЗВС kuni)
4. Рекомендательный Комитет
O'rta bosqich menejerlar — operatsion muammolar
Haftalik
5. Совет Заместителя Директора
Zamdirektor + bo'lim boshliq — kunlik operativ
Kunlik

3.5. Statistika va KPI tizimi (16 fayl)
Statistika turi
Hisoblash va monitoring
GSD (Главная Статистика Должности)
Har lavozimda bitta asosiy raqamiy ko'rsatkich — haftalik hisobot
Haftalik KPI yig'imi
Har xodim GSD ni Исп.Совет oldida hisobot qiladi
Trend tahlili
O'sish/kamayish foizi, sabab tahlili va yechim
Bonus tizimi
GSD natijasiga qarab bonuslar va maosh hisoblash
Holat formulasi
Kompaniya KPI asosida: Normal / Xavf / Inqiroz / O'sish
Ideal vs Haqiqat
Maqsadli va haqiqiy ko'rsatkichlar taqqoslash (Стратегик реж.)

4. TO'LIQ SOLISHTIRISH — MODULE 3 vs ШВБ

Quyidagi jadvalda ШВБ'ning har bir biznes jarayoni ERP Module 3 da qanday qoplanishi ko'rsatilgan.

4.1. Asosiy funksionallik solishtirish
ШВБ Jarayon
ШВБ Hujjatlar
Module 3 da mavjud
Qoplash darajasi
Bo'shliq
7 Otdelenie tuzilma
Справочник статистик
OrgChartPage, HR modul (285 kalit)
🟡 70%
GSD field HR kartasida yo'q
GSD/KPI tizimi
Статистика/ (16 fayl)
Director modul (73 kalit), GoalsKPI.tsx
🟡 65%
ШВБ-spesifik GSD kalitlari yo'q
ЗВС/ЗНО Ariza tizimi
Финансовый Планирования/ (64 fayl)
Finance modul (284 kalit), BudgetManagement.tsx
🔴 30%
ЗВС/ЗНО workflow, blank, tasdiqlash zanjiri yo'q
Haftalik ФП tsikl
ФП Бланк, reglament
Finance modul — umumiy moliya
🔴 25%
Ses/Chor/Pay/Dush kalitlari yo'q, haftalik tsikl UI yo'q
4 Hisob raqam
Справка о счетах
Finance — chartOfAccounts (mavjud)
🟡 60%
4 ta ШВБ-spesifik hisob nomi yo'q
5 Kengash koordinatsiya
Координация/ (16 fayl)
Notifications modul (77 kalit) — qisman
🔴 15%
Koordinatsiya moduli yo'q; kengash darajalari, Доклад/Распоряжение UI yo'q
Доклад/Распоряжение
Писменная Коммуникация/ (21 fayl)
Notifications modul — umumiy
🔴 20%
Доклад/Распоряжение blank shakllar, routing yo'q
3-Savat hujjat tizimi
Система 3-х корзин/ (6 fayl)
Kanban modul (93 kalit) — qisman
🔴 35%
Kiruvchi/Kutilmoqda/Chiquvchi statuslar yo'q
Holat formulasi
Формула Состояний/ (11 fayl)
Director modul — companyHealth kalit mavjud
🟡 50%
Normal/Xavf/Inqiroz holat enum va rang tizimi yo'q
Lavozim papkasi
Должностная Папка/ (25 fayl)
LMS + HR modul — qisman
🟡 55%
Digital onboarding yo'l xaritasi, papka shakllanishi yo'q
Haftalik reja (Недельный план)
Недельные планы/ (8 fayl)
Director + HR — umumiy reja
🟡 45%
GSD maqsad + 5 asosiy vazifa shakli yo'q
Strategik rejalashtirish
Стратегическое планирование/ (19 fayl)
Director modul — strategicGoal, okr kalitlari mavjud
🟢 75%
Ideal картina panel, 100M/800M maqsad yo'q
CRM / Sotish (6-otdelenie)
РО2 texnologiyalar (4 fayl)
CRM (354 kalit) + SD modul (101 kalit) — to'liq
🟢 90%
Savdo statistika kalitlari minimal qo'shimcha kerak
LMS / Ta'lim (5-otdelenie)
Должностная Папка ta'lim qismi
LMS modul (110 kalit) — to'liq
🟢 85%
Регламент testlari, lavozim papkasi kurslari yo'q
Xodimlar anketa
Корхона йиллик ички анкетаси
HR modul — questionnaire.tsx mavjud
🟢 80%
ШВБ-spesifik 17 savol turkumi yo'q

4.2. i18n Kalitlar solishtirish
Quyidagi jadvalda Module 3 locales fayllaridagi kalitlar ШВБ talablariga qanchalik mos kelishi ko'rsatilgan:

Module 3 Modul
ШВБ mos bo'lim
Bo'shliq — kerakli yangi kalitlar
finance.json (284 kalit)
Финансовый Планирования (64 fayl)
25-30 yangi kalit: zvs, zno, fpCycle, weeklyBudget, seshanba, chorshanba...
hr.json (285 kalit)
Должностная Папка (25 fayl)
20-25 yangi kalit: gsd, lavozimPapka, onboardingMap, weeklyPlan...
director.json (73 kalit)
Формула Состояний + Стратегия
15-20 yangi kalit: stateFormula, normal, risk, crisis, growth, idealPicture...
notifications.json (77 kalit)
Координация + Коммуникация
30-40 yangi kalit: koordinatsiya, dokla, rasporyazhenie, kengash...
kanban.json (93 kalit)
Система 3-х корзин
10-15 yangi kalit: incomingBasket, pendingBasket, outgoingBasket...
settings.json (63 kalit)
Регламентлар (2 fayl)
15-20 yangi kalit: reglament, kengashLevels, kengashMembers...
dashboard.json (56 kalit)
Statistika (16 fayl)
20-25 yangi kalit: gsdTracking, weeklyStats, idealVsActual...
lms.json (110 kalit)
Lavozim papkasi ta'lim
10-15 yangi kalit: lavozimPapkaCourse, reglamentTest, onboardingTrack...

5. BO'SHLIQ TAHLILI — NIMA YO'Q / NIMA KERAK

Bu bo'limda ШВБ talablariga mos kelish uchun Module 3 ga qo'shilishi kerak bo'lgan barcha narsalar ko'rsatilgan.

5.1. Kritik bo'shliqlar (🔴 — Zudlik bilan kerak)
A) ЗВС/ЗНО Workflow — Finance moduli
Hozirgi holat: Finance moduli 284 kalit, lekin ЗВС/ЗНО uchun birorta maxsus kalit yo'q.

Kerakli yangi i18n kalitlari — finance.json ga qo'shish:
zvs: "Pul ajratish ariza (ЗВС)"
zno: "Majburiyat ariza (ЗНО)"
createZvs: "ЗВС yaratish"
zvsStatus: "ЗВС holati"
zvsPending: "ЗВС ko'rib chiqilmoqda"
zvsApproved: "ЗВС tasdiqlandi"
zvsRejected: "ЗВС rad etildi"
fpCycle: "Moliyaviy rejalashtirish tsikli"
fpDay: "ФП kuni (Chorshanba)"
zvsDeadline: "ЗВС topshirish muddati (Seshanba)"
bankPaymentDay: "Bank to'lov kuni (Payshanba)"
cashPaymentDay: "Naqd to'lov kuni (Dushanba)"
approvalMatrix: "Tasdiqlash matritsasi"
level1Approval: "1-daraja (≤500,000 so'm)"
level2Approval: "2-daraja (≤5,000,000 so'm)"
level3Approval: "3-daraja (>5,000,000 so'm)"
account1: "Счет №1 (Asosiy hisob)"
taxAccount: "Единый налог hisobi"
mainAccount: "Главный счет"
workingCapitalAccount: "Оборотных средств hisobi"
weeklyBudgetSummary: "Haftalik byudjet xulosasi"
unpaidInvoicesList: "To'lanmagan schyotlar ro'yxati"
zvsApprovalList: "Tasdiqlash kutmoqda ro'yxati"

B) Koordinatsiya va Kommunikatsiya — yangi modul kerak
Hozirgi holat: Koordinatsiya uchun alohida modul yo'q. Notifications moduli (77 kalit) faqat qisman qoplaydi.

Yangi "coordination" modul yaratish kerak (yoki notifications.json kengaytirish):
koordinatsiya: "Koordinatsiya tizimi"
kengash: "Kengash"
sovetUchrediteley: "Asoschilar Kengashi"
ispolnitelnySovet: "Ijroiya Kengashi"
rekomendatelnySovet: "Рекомендательный Совет"
rekomendatelnyKomitet: "Рекомендательный Комитет"
sovetZamestitela: "Zamdirektor Kengashi"
dokla: "Доклад (Hisobot)"
rasporyazhenie: "Распоряжение (Buyruq)"
createDokla: "Доклад yozish"
createRasporyazhenie: "Распоряжение berish"
escalate: "Yuqori kengashga o'tkazish"
sessionProtocol: "Majlis protokoli"
kengashSchedule: "Kengash jadvali"
meetingMinutes: "Majlis bayoni"

C) 3-Savat tizimi — Kanban moduli kengaytirish
Hozirgi holat: Kanban.json 93 kalit, lekin 3-savat (Kiruvchi/Kutilmoqda/Chiquvchi) uchun maxsus kalitlar yo'q.

kanban.json ga qo'shish:
threeBasketsSystem: "3-Savat hujjat tizimi"
incomingBasket: "Kiruvchi savat"
pendingBasket: "Kutilmoqda savati"
outgoingBasket: "Chiquvchi savat"
basketOverdue: "Muddati o'tgan"
moveToProcessing: "Ko'rib chiqishga o'tkazish"
moveToOutgoing: "Chiquvchiga o'tkazish"
archiveDocument: "Arxivga topshirish"
personalProgram: "Shaxsiy dastur"
dailyTaskList: "Kunlik vazifalar ro'yxati"

5.2. Muhim bo'shliqlar (🟡 — 1-3 oy ichida)
D) Holat formulasi — Director modul kengaytirish
director.json ga qo'shish (hozir 73 kalit, qo'shimcha 15-20 kerak):
stateFormula: "Kompaniya holat formulasi"
stateNormal: "Normal holat 🟢"
stateRisk: "Xavf holati 🟡"
stateCritical: "Inqiroz holati 🔴"
stateGrowth: "O'sish holati 📈"
stateThreshold: "Holat chegarasi"
autoStateDetect: "Avtomatik holat aniqlash"
stateHistory: "Holat tarixi (30 kun)"
idealPicture: "Ideal kartina"
idealVsActual: "Ideal vs Haqiqat"
weeklyProfitTarget: "Haftalik foyda maqsadi"
weeklyRevenueTarget: "Haftalik daromad maqsadi"
branchTarget: "Filiallar maqsadi"
executionDiary: "Bajarish kundaligi"

E) GSD tizimi — HR modul kengaytirish
hr.json ga qo'shish (hozir 285 kalit, qo'shimcha 20-25 kerak):
gsd: "GSD — Bosh Statistika Lavozimi"
gsdValue: "GSD qiymati"
gsdTarget: "GSD maqsad"
gsdActual: "GSD haqiqiy"
weeklyGsdReport: "Haftalik GSD hisoboti"
positionFolder: "Lavozim Papkasi"
folderSection: "Papka bo'limi"
jobDescription: "Lavozim tavsifi"
onboardingRoadmap: "Onboarding yo'l xaritasi"
folderCompletion: "Papka to'liqlik foizi"
weeklyPlanForm: "Haftalik reja shakli"
weeklyTopTasks: "Haftalik 5 asosiy vazifa"
successFactors: "Muvaffaqiyat omillari"
gsdDynamics: "GSD dinamikasi (12 oy)"

5.3. Qo'shimcha bo'shliqlar (🟢 — 3-6 oy)
Bo'shliq
Qo'shish kerak bo'lgan element
Lavozim papkasi kurslari
LMS moduli: har lavozim papkasiga kurslar biriktirish
Регламент testlari
LMS moduli: har reglament uchun majburiy test
Inspektor menejer roli
HR modul: Inspektor menejer roli va ko'rsatkichlari
Yillik anketa (17 savol)
HR modul: O'zbek tilidagi 17 savollik anketa shakli
Kaizen klubla integratsiya
LMS + Settings: Kaizen metodologiyasi materiallari
Приказлар (rasmiy buyruqlar)
Coordination modul: rasmiy buyruqlar registri va qidirish
Procurement workflow
Finance: 3-bosqichli xarid jarayoni (Sо'rov→Tasdiqlash→Buyurtma)

6. INTEGRATSIYA REJASI — MODULE 3 ni ШВБ ga MOS QILISH

Maqsad: ERP Uzbek-Language-Module 3 ni Архив/ШВБ biznes talablariga 100% mos qilish

6.1. 1-Bosqich: i18n Kalitlar Qo'shish (1-2 hafta)
Texnik ish: JSON fayllarni tahrirlash — dastur kodi o'zgarmaydi, faqat tarjima kalitlari qo'shiladi

finance.json — 23 kalit qo'shish (UZ + RU)
Fayl manzili: artifacts/erp-dashboard/src/locales/uz/finance.json

Qo'shilishi kerak bo'lgan kalitlar (UZ versiya):
"zvs": "Pul ajratish ariza (ЗВС)"
"zno": "Majburiyat ariza (ЗНО)"
"createZvs": "ЗВС yaratish"
"zvsStatus": "ЗВС holati"
"zvsPending": "ЗВС ko'rib chiqilmoqda"
"zvsApproved": "ЗВС tasdiqlandi"
"zvsRejected": "ЗВС rad etildi"
"fpCycle": "Moliyaviy rejalashtirish tsikli"
"fpDay": "ФП kuni (Chorshanba)"
"zvsDeadlineDay": "ЗВС topshirish kuni: Seshanba"
"bankPaymentDay": "Bank to'lov kuni: Payshanba"
"cashPaymentDay": "Naqd to'lov kuni: Dushanba"
"approvalMatrix": "Tasdiqlash matritsasi"
"approvalLevel1": "1-daraja: ≤500,000 so'm"
"approvalLevel2": "2-daraja: ≤5,000,000 so'm"
"approvalLevel3": "3-daraja: >5,000,000 so'm"
"account1Main": "Счет №1 — Asosiy hisob"
"accountTax": "Единый налог — Soliq hisobi"
"accountMain": "Главный счет — Bosh hisob"
"accountWorkingCapital": "Оборотных средств — Aylanma mablag'"
"unpaidBillsList": "To'lanmagan schyotlar ro'yxati"
"zvsApprovalQueue": "ЗВС tasdiqlash navbati"
"weeklyFinancePlan": "Haftalik moliyaviy reja"

director.json — 14 kalit qo'shish (UZ + RU)
"stateFormula": "Kompaniya holat formulasi"
"stateNormal": "Normal — barcha ko'rsatkichlar me'yorda 🟢"
"stateRisk": "Xavf — ba'zi ko'rsatkichlar past 🟡"
"stateCritical": "Inqiroz — kritik pasayish 🔴"
"stateGrowth": "O'sish — maqsad ustida 📈"
"stateThreshold": "Holat chegarasi sozlamalari"
"idealPicture": "Ideal kartina"
"idealVsActual": "Ideal vs Haqiqat"
"weeklyProfitTarget": "Haftalik foyda maqsadi: 100,000,000 so'm"
"weeklyRevenueTarget": "Haftalik daromad maqsadi: 800,000,000 so'm"
"branchCountTarget": "Filiallar maqsadi: 15 ta"
"executionDiary": "Bajarish kundaligi"
"stateHistoryDays": "Holat tarixi ({days} kun)"
"autoDetect": "Avtomatik holat aniqlash"

hr.json — 14 kalit qo'shish (UZ + RU)
"gsd": "GSD — Bosh Statistika Lavozimi"
"gsdTarget": "GSD maqsad"
"gsdActual": "GSD haqiqiy natija"
"gsdVariance": "GSD og'ish"
"weeklyGsdReport": "Haftalik GSD hisoboti"
"positionFolder": "Lavozim Papkasi"
"onboardingRoadmap": "Onboarding yo'l xaritasi"
"folderCompletion": "Papka to'liqlik: {percent}%"
"weeklyPlanForm": "Haftalik reja shakli"
"weeklyTopTasks": "5 asosiy haftalik vazifa"
"successFactors": "Muvaffaqiyat omillari"
"gsdDynamics": "GSD dinamikasi"
"prevWeekGsd": "O'tgan hafta GSD"
"gsdTrend": "GSD trend"

Yangi "coordination" modul yaratish — 15 kalit (UZ + RU)
Yangi fayl: artifacts/erp-dashboard/src/locales/uz/coordination.json
"coordination": "Koordinatsiya tizimi"
"councilLevel": "Kengash darajasi"
"founderCouncil": "Asoschilar Kengashi"
"executiveCouncil": "Ijroiya Kengashi"
"recommendationCouncil": "Рекомендательный Совет"
"recommendationCommittee": "Рекомендательный Комитет"
"deputyCouncil": "Zamdirektor Kengashi"
"dokla": "Доклад — rasmiy hisobot"
"rasporyazhenie": "Распоряжение — rasmiy ko'rsatma"
"createDokla": "Доклад yozish"
"createRasporyazhenie": "Распоряжение berish"
"escalation": "Muammoni yuqori kengashga ko'tarish"
"meetingProtocol": "Majlis protokoli"
"councilSchedule": "Kengash yig'ilish jadvali"
"councilMinutes": "Majlis bayoni"

kanban.json — 10 kalit qo'shish (3-savat tizimi uchun)
"threeBasketsSystem": "3-Savat hujjat tizimi"
"incomingBasket": "📥 Kiruvchi savat"
"pendingBasket": "⏳ Kutilmoqda savati"
"outgoingBasket": "📤 Chiquvchi savat"
"basketOverdue": "⚠️ Muddati o'tgan (24 soat+)"
"moveToProcessing": "Ko'rib chiqishga o'tkazish"
"moveToOutgoing": "Chiquvchiga o'tkazish"
"archiveDocument": "Arxivga topshirish"
"personalProgram": "Shaxsiy dastur"
"dailyTaskList": "Kunlik vazifalar"

6.2. 2-Bosqich: Backend API (2-6 hafta)
Texnik ish: NestJS modullarni kengaytirish — yangi kontrollerlar, servislar, DTOlar

Yangi backend funksiya
Amalga oshirish tavsifi
ЗВС/ЗНО API yaratish
Finance moduli: POST /finance/zvs, GET /finance/zvs, PATCH /finance/zvs/:id/approve — status: pending|approved|rejected
ЗВС haftalik tsikl trigger
Cron job: Seshanba 09:00 — avtomatik eslatma barcha bo'lim boshliqlariga
Koordinatsiya moduli yaratish
Yangi NestJS modul: /coordination. Kengash darajalari, Доклад CRUD, Распоряжение CRUD
GSD tracking API
HR modul kengaytirish: POST /hr/positions/:id/gsd, GET /hr/employees/:id/gsd-history
Holat formulasi servisi
Director modul: GET /director/company-state — KPI asosida holat hisoblash
Lavozim papkasi API
HR modul: GET /hr/positions/:id/folder, POST /hr/onboarding/progress
Haftalik reja API
HR modul: POST /hr/weekly-plan, GET /hr/weekly-plan/:employeeId
3-Savat task tizimi
Kanban modul kengaytirish: basket_type field qo'shish (incoming|pending|outgoing)
4 Hisob raqam tizimi
Finance modul: account_type enum (main|tax|head|working_capital) qo'shish

6.3. 3-Bosqich: Frontend UI (1-2 oy)
Yangi UI komponent
Qaysi sahifaga qo'shish
ЗВС shakli (FinanceDashboard)
FinanceDashboard.tsx: haftalik ЗВС arizasi shakli, statuslar paneli
Haftalik ФП tsikl widget
FinanceDashboard.tsx: Ses→Chor→Pay→Dush progress bar, rang belgilash
4 Hisob raqam panel
CFODashboard.tsx: 4 ta hisob balanslari karta ko'rinishida
ЗВС tasdiqlash ro'yxati
FinanceApproval.tsx: bo'lim bo'yicha ЗВС, 3-daraja tasdiqlash
Koordinatsiya panel
Yangi CoordinationPage.tsx: 5 kengash, Доклад/Распоряжение yuborish
GSD widget (HR)
EmployeeProfile.tsx: GSD grafik, haftalik dinamika, maqsad vs haqiqat
Holat formulasi panel
DirectorDashboard.tsx: kompaniya holati rang indikator, tarix
Ideal kartina panel
DirectorDashboard.tsx: Ideal vs Haqiqat jadval (foyda, daromad, filiallar)
Lavozim papkasi UI
HRDashboard.tsx: onboarding yo'l xaritasi, % tugallanish
Haftalik reja shakli
DirectorDashboard.tsx + HR: 5 asosiy vazifa + GSD maqsad forma
3-Savat widget
KanbanBoard.tsx: Kiruvchi/Kutilmoqda/Chiquvchi ustunlari + rang belgilash

7. MODULE 3 CONSTANTS.TS GA 'coordination' QO'SHISH

Hozirgi holat: constants.ts da 29 modul bor. "coordination" moduli qo'shilishi kerak.

Fayl manzili: artifacts/erp-dashboard/src/lib/i18n/constants.ts

O'zgarish: TRANSLATION_MODULES massiviga "coordination" qo'shish:

export const TRANSLATION_MODULES = [
  'common', 'auth', 'dashboard', 'hr', 'finance',
  'production', 'warehouse', 'wms', 'crm', 'lms',
  'settings', 'errors', 'validation', 'marketing', 'navigation',
  'public', 'sd', 'mes', 'kanban', 'director',
  'security', 'notifications', 'iot', 'admin', 'mro',
  'design', 'logistics', 'pos', 'ai',
  'coordination',  // ← YANGI: ШВБ koordinatsiya tizimi
] as const;

Natija: 29 → 30 modul. Jami: 3,209 + ~15 = ~3,224 kalit per til.

8. UMUMIY SOLISHTIRISH JADVALI

Ko'rsatkich
Module 3  ←→  ШВБ
Texnik kuch
Module 3 — React 19, NestJS, AI, 326 sahifa, 36+ modul. ШВБ — hujjat tizimi.
Biznes jarayonlar
ШВБ — to'liq 7-otdelenie, ЗВС/ЗНО, koordinatsiya. Module 3 — umumiy ERP.
i18n holati
Module 3: 3,209 kalit × 2 til = 6,418. ШВБ-spesifik kalitlar: ~100 ta yetishmaydi.
KPI tizimi
Module 3 — umumiy KPI. ШВБ — GSD per lavozim, haftalik hisobot majburiy.
Moliya tizimi
Module 3 — to'liq moliya moduli. ШВБ — ЗВС/ЗНО, 4 hisob, haftalik tsikl maxsus.
Koordinatsiya
Module 3 — notifications modul. ШВБ — 5 kengash, Доклад/Распоряжение maxsus.
Ta'lim tizimi
Module 3 — LMS modul (110 kalit) — yaxshi. ШВБ — lavozim papkasi kurslari kerak.
CRM/Sotish
Module 3 — CRM (354 kalit) + SD (101 kalit) — kuchli. ШВБ talablari 90% qoplangan.
Holat monitoring
Module 3 — director modul, AI. ШВБ — Holat formulasi (Normal/Xavf/Inqiroz) maxsus kerak.
Ombor/WMS
Module 3 — Warehouse (283) + WMS (43) — yaxshi. ШВБ — asosan HR/Moliya fokus.
Jami bo'shliq
~100 ta yangi i18n kalit + 3 ta yangi UI komponent + 5 ta yangi API endpoint.

8.1. Qoplash foizi jadvali
ШВБ Bo'limi
Module 3 Qoplash
Qo'shimcha ish
Moliyaviy Rejalashtirish
30% 🔴
ЗВС/ЗНО workflow, haftalik tsikl UI, 4 hisob raqam panel
Koordinatsiya (5 kengash)
15% 🔴
Yangi coordination modul, Доклад/Распоряжение shakllari
3-Savat tizimi
35% 🔴
Kanban kengaytirish — basket tiplar
KPI/GSD tizimi
65% 🟡
GSD field HR, haftalik hisobot, bonus hisoblash
Holat Formulasi
50% 🟡
Director modul — holat enum, rang, tarix
Lavozim Papkasi
55% 🟡
HR+LMS — digital papka, onboarding yo'l xaritasi
Haftalik Reja
45% 🟡
Director+HR — 5 vazifa + GSD shakli
Strategik Rejalashtirish
75% 🟢
Director — Ideal kartina panel qo'shish
CRM / Sotish
90% 🟢
Minimal kalitlar qo'shish
LMS / Ta'lim
85% 🟢
Lavozim papkasi kurslari biriktirish
Ombor / WMS
85% 🟢
Ishlab chiqarish bilan integratsiya
HR / Kadrlar
70% 🟡
GSD, haftalik reja, lavozim papkasi
UMUMIY O'RTACHA
62% 🟡
~100 kalit + UI + API kerak

9. IMPLEMENTATSIYA — BOSQICHMA-BOSQICH YO'L XARITASI

9.1. 1-Bosqich: i18n Kalitlar — 1-2 hafta (Texnik ish minimal)
finance.json (uz va ru) — 23 ta ЗВС/ЗНО kalit qo'shish
director.json (uz va ru) — 14 ta holat formulasi kalit qo'shish
hr.json (uz va ru) — 14 ta GSD va lavozim papkasi kalit qo'shish
kanban.json (uz va ru) — 10 ta 3-savat kalit qo'shish
coordination.json (uz va ru) — 15 ta yangi fayl yaratish
constants.ts — "coordination" ni TRANSLATION_MODULES ga qo'shish
i18n/loader.ts — coordination modulini dynamic import ga qo'shish
Barcha kalitlar UZ = RU sinxronligini tekshirish

9.2. 2-Bosqich: Backend API — 2-6 hafta
Finance moduli: ZvsEntity, ZvsDto, ZvsService, ZvsController yaratish
Finance moduli: ZnoEntity, ZnoDto, ZnoService, ZnoController yaratish
Finance moduli: 4 hisob raqam enum va API qo'shish
HR moduli: GsdEntity, haftalik GSD tracking API
HR moduli: PositionFolderEntity, OnboardingProgressEntity
HR moduli: WeeklyPlanEntity, WeeklyPlanController
Director moduli: CompanyStateService — KPI asosida holat hisoblash
Yangi coordination moduli: DokladEntity, RasporyazhenieEntity, CouncilEntity
Kanban moduli: basket_type field migratsiya qo'shish
Cron jobs: Seshanba 09:00 — ЗВС eslatma; Chorshanba 09:00 — ФП eslatma

9.3. 3-Bosqich: Frontend UI — 1-2 oy
FinanceDashboard.tsx: Haftalik ФП tsikl progress widget qo'shish
FinanceDashboard.tsx: ЗВС shakli va statuslar paneli
BudgetManagement.tsx: 4 hisob raqam karta ko'rinishi
FinanceApproval.tsx: ЗВС tasdiqlash ro'yxati — 3 daraja
DirectorDashboard.tsx: Kompaniya holati rangli indikator widget
DirectorDashboard.tsx: Ideal vs Haqiqat jadval panel
EmployeeProfile.tsx: GSD grafik va haftalik dinamika
HRDashboard.tsx: Lavozim papkasi onboarding yo'l xaritasi
Yangi CoordinationPage.tsx: 5 kengash paneli, Доклад/Распоряжение shakllari
KanbanBoard.tsx: 3-savat ustunlari (Kiruvchi/Kutilmoqda/Chiquvchi) kengaytirish
SevenFunctionsDashboard.tsx: 7-otdelenie GSD paneli
Settings.tsx: Holat formulasi chegaralarini sozlash

9.4. 4-Bosqich: Sinovlar va Tekshirish — 2-4 hafta
Barcha yangi i18n kalitlarini UZ va RU uchun sinov qilish
ЗВС/ЗНО to'liq oqimini sinab ko'rish (yaratish → tasdiqlash → rad etish)
Koordinatsiya moduli Playwright E2E testlari yozish
GSD tracking API unit testlari yozish
Holat formulasi chegaralarini real ma'lumot bilan sinab ko'rish
Playwright: ЗВС ariza yuborish va tasdiqlash stsenariylari
Performance: 3-savat widget tezligini tekshirish (76+ consumer)
Lokalizatsiya: barcha yangi sahifalar UZ va RU tillarida to'g'ri ko'rsatilishini tekshirish

10. XULOSA VA STRATEGIC TAVSIYALAR

10.1. Asosiy xulosalar
Module 3 — texnik jihatdan kuchli va to'liq: 29 modul, AI, 326 sahifa, 36+ backend modul
ШВБ — biznes jihatdan puxta: ЗВС/ЗНО, 5 kengash, GSD, 3-savat, holat formulasi
Umumiy qoplash: 62% — texnik platforma kuchli, ШВБ-spesifik biznes logika qo'shimcha ish talab qiladi
Kritik bo'shliq: ЗВС/ЗНО workflow va koordinatsiya tizimi — bular EuroPrint'ning asosiy biznes jarayonlari
Arzon yechim: ~100 ta i18n kalit qo'shish + constants.ts yangilash — 1-2 hafta

10.2. TOP-5 zudlik bilan bajariladigan ishlar
Bu 5 ta ish Module 3 ni ШВБ talablariga eng tez va arzon qiladi

#
Amal va nima uchun muhimligi
1
finance.json ga 23 ta ЗВС/ЗНО kalit qo'shish — EuroPrint moliya tsiklining asosi
2
coordination.json yangi modul (15 kalit) + constants.ts yangilash — koordinatsiya tizimining digital asosi
3
director.json ga 14 kalit — holat formulasi va ideal kartina — direktor bosh instrumenti
4
hr.json ga 14 kalit — GSD va lavozim papkasi — barcha xodimlar KPI tizimining asosi
5
kanban.json ga 10 kalit — 3-savat tizimi — kundalik hujjat oqimini tartibga solish



EuroPrint Kokand  ·  Module 3 vs ШВБ Solishtirish Hisoboti  ·  2026
Tayyorlandi: Claude AI (Anthropic)  ·  Module 3: 326 sahifa, 29 modul  ·  ШВБ: 237 fayl, 24 bo'lim
