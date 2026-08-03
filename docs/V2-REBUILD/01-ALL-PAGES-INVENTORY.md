# EuroPrint ERP v2 — TO'LIQ SAHIFALAR INVENTARI (ko'chirish katalogi)

> **Maqsad:** v2 ni 0 dan TOZA quramiz (yangi papkada, Textil usulida) — LEKIN eski loyihadagi HAMMA qimmatli ishni
> (sahifa, kod, schema, modul) ko'chiramiz. Bu fayl = eski loyihaning **HAMMA sahifasi** bitta joyda, modul bo'yicha.
> Har sahifa: nomi · route · vazifasi · **ko'chirish holati** (KO'CHIR = ishlaydi, toza ko'chiriladi / QAYTA = buzuq, toza qayta yoziladi / DUP = dublikat, birlashtiriladi / TEKSHIR = holati aniqlanmagan).
>
> ⚠️ **Vazifa ustuni hozir taxminiy** (sarlavhadan olingan) — **EGASI bilan aniqlashtiriladi** (modul-modul). Bu v1 ro'yxat.
> Manba: `artifacts/erp-dashboard/src/components/sidebar/constants.ts` (jonli sidebar — egasi curated ro'yxati).
> Tartib: Textil usuli — avval bu spec ANIQ bo'ladi → keyin toza fazali qurish + ishlaydigan kod ko'chirish.

**JAMI: 20 modul guruhi · ~280 sahifa.** (Separator/sarlavhalar sanalmaydi.)

---

## tz01 — SAVDO VA CRM (16 sahifa) · default: sd/dashboard
| # | Sahifa | Route | Vazifa (taxminiy — aniqlashtirilsin) | Holat |
|---|---|---|---|---|
| 1 | SD Dashboard | `sd/dashboard` | Savdo umumiy panel (KPI/grafik) | KO'CHIR |
| 2 | Mijozlar | `sd/customers` | Mijoz kartochkalari (CRUD) | KO'CHIR |
| 3 | Lidlar | `crm-workspace` | Lid/potensial mijoz workspace | KO'CHIR |
| 4 | Sotish Paneli | `sales` | Sotuv operatsion panel | KO'CHIR |
| 5 | AI CRM | `ai/crm` | AI-yordamli CRM tahlil | TEKSHIR (AI) |
| 6 | Taklifnomalar | `sd/sales-quotes` | Narx taklifnomalari (kotirovka) | KO'CHIR |
| 7 | Buyurtmalar | `sd/sales-orders` | Sotuv buyurtmalari | KO'CHIR |
| 8 | Papka Buyurtmalari | `papka-orders` | Papka (ishlab chiqarish) buyurtmalari | TEKSHIR (ikki-dunyo?) |
| 9 | Shartnomalar | `sd/contracts` | Mijoz shartnomalari | KO'CHIR |
| 10 | Buyurtma Yaratish | `order-create` | Yangi buyurtma yaratish formasi | KO'CHIR |
| 11 | Buyurtma Workflow | `order-workflow` | Buyurtma jarayoni (kanban) | KO'CHIR |
| 12 | Ombor Ijara | `sd/warehouse-rental` | Tayyor mahsulot ombor ijarasi | KO'CHIR |
| 13 | To'lovlar | `sd/sales-payments` | Sotuv to'lovlari | KO'CHIR |
| 14 | 70% Avans Nazorat | `sd/advance-control` | Avans to'lov nazorati | KO'CHIR |
| 15 | KPI | `sd/kpi` | Savdo KPI maqsadlari | KO'CHIR |
| 16 | Sozlamalar | `sd/settings` | Modul sozlamalari | KO'CHIR |

## tz02 — MARKETING (16 sahifa) · default: marketing/dashboard · ⚠️ feature-flag bilan yashirin (BE ~60/99 endpoint 501)
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Dashboard | `marketing/dashboard` | Marketing panel | TEKSHIR (501 ko'p) |
| 2 | Lidlar | `marketing/leads` | Marketing lidlari | DUP (tz01 lidlar?) |
| 3 | Kampaniyalar | `marketing/campaigns` | Kampaniya boshqaruvi | TEKSHIR |
| 4 | Kontent | `marketing/content` | Kontent boshqaruvi | TEKSHIR |
| 5 | Social Inbox | `marketing/social-inbox` | Ijtimoiy tarmoq inbox | TEKSHIR |
| 6 | Taqvim | `marketing/calendar` | Marketing taqvimi | TEKSHIR |
| 7 | Ko'rgazmalar | `marketing/exhibitions` | Ko'rgazma/tadbir | TEKSHIR |
| 8 | PR Faoliyat | `marketing/pr` | PR boshqaruvi | TEKSHIR |
| 9 | Tahlil (ROI/ROAS) | `marketing/analytics` | Marketing analitika | TEKSHIR |
| 10 | SEO Monitoring | `marketing/seo` | SEO kuzatuv | TEKSHIR |
| 11 | A/B Testing | `marketing/ab-testing` | A/B test | TEKSHIR |
| 12 | Raqobatchilar | `marketing/competitors` | Raqobat tahlili | TEKSHIR |
| 13 | NPS va Churn | `marketing/nps-churn` | NPS/churn metrikasi | TEKSHIR |
| 14 | Web sayt CMS | `marketing/website-cms` | Veb-sayt CMS | TEKSHIR |
| 15 | Byudjet | `marketing/budget` | Marketing byudjeti | TEKSHIR |
| 16 | Sozlamalar | `marketing/settings` | Modul sozlamalari | TEKSHIR |

## tz03 — DIZAYN (12 sahifa) · default: design/dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Dizayn Dashboard | `design/dashboard` | Dizayn panel | KO'CHIR |
| 2 | Dizayn Buyurtmalar | `design/orders` | Dizayn buyurtmalari | KO'CHIR |
| 3 | Dizayn Tasdiqlash | `design/approval` | Maket tasdiqlash | KO'CHIR |
| 4 | AI Generator | `design/generator` | AI dizayn generatori | TEKSHIR (AI) |
| 5 | AI Dizayn Tekshiruvi | `design/ai-review` | AI maket tekshiruvi | TEKSHIR (AI) |
| 6 | 3D Mockup | `design/3d-mockup` | 3D mockup ko'rinish | TEKSHIR |
| 7 | Dizayn Taqqoslash | `design/comparison` | Versiya taqqoslash | KO'CHIR |
| 8 | Dizayn Kutubxona | `design/library` | Dizayn arxivi | KO'CHIR |
| 9 | Brend Guidelines | `design/brand-guidelines` | Brend qoidalari | KO'CHIR |
| 10 | Qoliplar Boshqaruvi | `design/templates` | Qolip/shablon boshqaruvi | KO'CHIR |
| 11 | Asboblar va Plastinalar | `design/tools` | Asbob/plastina ro'yxati | KO'CHIR |
| 12 | Dizayn Tannarxi | `design/costing` | Dizayn xarajati | KO'CHIR |

## tz04 — SIFAT NAZORATI (17 sahifa) · default: qc/dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | QC Dashboard | `qc/dashboard` | Sifat panel | KO'CHIR |
| 2 | Qog'oz Parametrlari | `qc/lab` | Laboratoriya parametrlari | KO'CHIR |
| 3 | Material Testlari | `qc/tests` | Material sinovlari | KO'CHIR |
| 4 | Parametrlar | `qc/parameters` | Sifat parametrlari | KO'CHIR |
| 5 | Normalar | `qc/standards` | Sifat normalari | KO'CHIR |
| 6 | Inline QC | `qc/approval` | Jarayon ichi nazorat | KO'CHIR |
| 7 | Yakuniy Tekshiruv | `qc/final` | Yakuniy QC | KO'CHIR (col-drift?) |
| 8 | Yetkazuvchi Sifati | `qc/vendor-quality` | Yetkazuvchi sifati | KO'CHIR |
| 9 | Brak Boshqaruvi | `qc/defect-management` | Brak boshqaruvi | KO'CHIR |
| 10 | Reklamatsiya | `qc/complaints` | Shikoyat/reklamatsiya | KO'CHIR |
| 11 | Sifat Sertifikatlari | `qc/certificates` | Sertifikatlar | KO'CHIR |
| 12 | ISO Hujjatlari | `qc/iso` | ISO hujjatlari | KO'CHIR |
| 13 | Sifat Trendi | `qc/trends` | Sifat trend tahlili | KO'CHIR |
| 14 | AI Tahlil | `qc/ai-analysis` | AI sifat tahlili | TEKSHIR (AI) |
| 15 | Hisobotlar | `qc/reports` | QC hisobotlari | KO'CHIR |
| 16 | Sozlamalar | `qc/settings` | Modul sozlamalari | KO'CHIR |

## tz05 — TEXNOLOGIYA (13 sahifa) · default: tech/approval
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Texnik Tasdiqlash | `tech/approval` | Texnik tasdiq | KO'CHIR |
| 2 | Texnik Kartalar | `tech/cards` | Texkarta (AI-generate) | DUP (technology_cards v2 master) |
| 3 | BOM Tarkib | `erp/pp/bom` | BOM tarkibi | KO'CHIR |
| 4 | Material Muqobili | `tech/material-alternatives` | Material muqobillari | KO'CHIR |
| 5 | Marshrutlar | `erp/pp/routing` | Ishlab chiqarish marshruti | KO'CHIR |
| 6 | Stanoq Tanlash | `tech/machine-selection` | Stanok tanlash | KO'CHIR |
| 7 | Vaqt va Tannarx | `tech/time-cost` | Vaqt/tannarx hisobi | KO'CHIR |
| 8 | Xarajat Optimizatsiya | `tech/cost-optimization` | Xarajat optimallashtirish | TEKSHIR |
| 9 | Mijoz Maxsus Talablar | `tech/client-requirements` | Mijoz talablari | KO'CHIR |
| 10 | O'zgarishlar Tarixi | `tech/change-history` | Versiya tarixi | KO'CHIR |
| 11 | Parallel Buyurtmalar | `tech/parallel-orders` | Parallel buyurtma | TEKSHIR |

## tz06 — AI REJALASHTIRISH (16 sahifa) · default: ai-production-planning
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | AI Rejalashtirish | `ai-production-planning` | AI 7-qadam reja (markaz) | QAYTA (vizyon — to'liq qur) |
| 2 | AI Rezervatsiya | `pp/ai-reservation` | AI material rezerv | TEKSHIR (AI) |
| 3 | PP Dashboard | `pp/dashboard` | Rejalashtirish panel | KO'CHIR |
| 4 | Rejalashtirish | `planning` | Kunlik/haftalik reja | KO'CHIR |
| 5 | Smena Boshqaruvi | `pp/shift-management` | Smena rejasi | QAYTA (vizyon) |
| 6 | Parallel Jarayonlar | `pp/parallel-processes` | Parallel jarayon | TEKSHIR |
| 7 | Quvvat Rejasi | `erp/pp/capacity` | CRP quvvat rejasi | KO'CHIR |
| 8 | Rush Order | `pp/rush-orders` | Shoshilinch buyurtma | KO'CHIR |
| 9 | Bottleneck Tahlili | `pp/bottleneck` | TOC bottleneck | QAYTA (vizyon) |
| 10 | Demand Forecasting | `pp/demand-forecast` | Talab prognozi | TEKSHIR (AI) |
| 11 | What-if Tahlil | `pp/what-if` | Ssenariy tahlili | TEKSHIR (stub?) |
| 12 | Yetkazish Kalkulyator | `pp/delivery-calculator` | ATP yetkazish hisobi | KO'CHIR |
| 13 | Energiya Optimizatsiya | `pp/energy-optimization` | Energiya optimal | TEKSHIR |
| 14 | OEE Monitor | `pp/oee-monitor` | OEE kuzatuv | DUP (mes/oee, iot/oee) |
| 15 | KPI va Og'ish | `pp/kpi-deviation` | Plan-fakt og'ish | QAYTA (vizyon) |
| 16 | Real-time Progress | `pp/realtime-progress` | Real-time progress | TEKSHIR |

## tz07 — ISHLAB CHIQARISH / MES (18 sahifa) · default: mes/dashboard-home
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | MES Dashboard | `mes/dashboard-home` | MES panel | KO'CHIR |
| 2 | IoT Planshet | `iot/tablet` | Operator planshet hub | KO'CHIR (vizyon-asos) |
| 3 | Kunlik Reja | `iot/daily-view` | Kunlik smena reja | KO'CHIR |
| 4 | Ish Markazlari | `mes/work-centers` | Work-center master | KO'CHIR |
| 5 | Mahsulotlar | `mes/products` | Mahsulot master | KO'CHIR |
| 6 | Buyurtmalar | `production/orders` | Ishlab chiqarish buyurtmalari | KO'CHIR |
| 7 | To'xtashlar | `mes/downtimes` | Downtime qayd | KO'CHIR |
| 8 | Xodim Tayinlashlari | `mes/workers` | Operator tayinlash | KO'CHIR |
| 9 | OEE Monitoring | `mes/oee-monitor` | OEE | DUP (pp/oee, iot/oee) |
| 10 | Sabablar Logi | `mes/reason-log` | Sabab kodlari | KO'CHIR |
| 11 | Ishlab Chiqarish Monitor | `iot/dashboard` | IoT/ishlab chiqarish monitor | DUP (tz15 iot/dashboard) |
| 12 | Zona Boshqaruvi | `mes/zone-management` | Zona boshqaruvi | TEKSHIR |
| 13 | Texnik Xizmat So'rovi | `mes/maintenance-request` | Ta'mir so'rovi | KO'CHIR |
| 14 | Gamifikatsiya | `mes/gamification` | Operator gamifikatsiya | KO'CHIR |
| 15 | Uskuna Normalari | `mes/machine-norms` | Stanok normalari | KO'CHIR |
| 16 | Smena Topshirish | `mes/smena-handover` | Smena handover | KO'CHIR |
| 17 | Kaizen Boshqaruvi | `kaizen` | Kaizen takliflar | KO'CHIR |

## tz08 — OMBOR / WMS (10 sahifa) · default: wms/overview
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Moliya nazorati | `wms/overview` | Ombor moliya nazorati | KO'CHIR |
| 2 | Omborlar | `wms/warehouses` | Ombor master | KO'CHIR |
| 3 | Xarid so'rovi (P2P) | `wms/procurement` | Xarid so'rovi | KO'CHIR |
| 4 | POS Monitor (kirim/chiqim) | `pos-monitor` | Zavod ombori tablet (kirim/chiqim) | KO'CHIR (kanonik POS) |
| 5 | Inventarizatsiya | `wms/inventory` | Inventarizatsiya | KO'CHIR |
| 6 | Qabul Akti (GRN) | `wms/grn` | Qabul akti | KO'CHIR |
| 7 | Reservation Panel | `wms/reservation` | Material rezerv | KO'CHIR |
| 8 | Material 360° | `inventory/materials` | Material 360 ko'rinish | KO'CHIR |
| 9 | Tayyor Mahsulot Ijara | `wms/rental` | Tayyor mahsulot ijara | DUP (tz01 ombor-ijara?) |

## tz09 — TA'MINOT / MM + LOGISTIKA (16 sahifa) · default: mm/dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | MM Dashboard | `mm/dashboard` | Ta'minot panel | KO'CHIR |
| 2 | Yetkazuvchilar | `mm/vendors` | Vendor master | KO'CHIR |
| 3 | Xarid Buyurtmalari | `mm/purchase-orders` | Xarid buyurtmalari (PO) | KO'CHIR |
| 4 | Xarajat Nazorati | `integration/expense-management` | Xarajat boshqaruvi | KO'CHIR |
| 5 | Chek Bot | `mm/check-bot` | Chek/faktura bot | TEKSHIR |
| 6 | Kreditor Qarzlar | `mm/creditor-debts` | Kreditor qarzlar | KO'CHIR |
| 7 | Yetkazuvchi Baho | `integration/vendor-performance` | Vendor reyting | KO'CHIR |
| 8 | Supplier Portal | `mm/supplier-portal` | Yetkazuvchi portali | TEKSHIR |
| 9 | Transport Parki | `logistics/transport` | Transport parki | TEKSHIR |
| 10 | Marshrut Rejalashtirish | `logistics/route-planning` | Marshrut reja | TEKSHIR |
| 11 | GPS Monitoring | `logistics/gps` | GPS kuzatuv | TEKSHIR |
| 12 | Yoqilg'i Nazorati | `logistics/fuel` | Yoqilg'i nazorat (10Q owner-pending) | TEKSHIR (vizyon) |
| 13 | Haydovchi Boshqaruvi | `logistics/drivers` | Haydovchi boshqaruvi | TEKSHIR |
| 14 | Mashina Jadvali | `logistics/vehicle-schedule` | Mashina jadvali | TEKSHIR |

## tz10 — MOLIYA / FINANCE (25 sahifa) · default: cfo-dashboard · ⚠️GL/payroll = ehtiyot
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | CFO | `cfo` | CFO umumiy | KO'CHIR |
| 2 | CFO Dashboard | `cfo-dashboard` | CFO panel | KO'CHIR |
| 3 | AI Moliya | `ai/finance` | AI moliya tahlili | TEKSHIR (AI/Q-41) |
| 4 | Bosh Buxgalter | `finance-dashboard` | Buxgalteriya panel | KO'CHIR ✅(dizayn done) |
| 5 | GL Hujjatlar | `accounting/gl-documents` | GL hujjatlar | KO'CHIR ⚠️GL |
| 6 | Hisoblar Rejasi | `accounting/chart-of-accounts` | Hisoblar rejasi (CoA) | KO'CHIR ⚠️GL |
| 7 | Davr Yopish | `accounting/period-closing` | Davr yopish | KO'CHIR ⚠️GL |
| 8 | Pul Oqimi | `finance/cashflow` | Cash flow | KO'CHIR |
| 9 | Byudjet | `finance/budgets` | Byudjet | KO'CHIR |
| 10 | Foyda Tahlili | `finance/profitability` | Foyda tahlili | KO'CHIR |
| 11 | Hisobotlar | `finance/reports` | Moliya hisobotlari | KO'CHIR |
| 12 | Debitorlar | `accounting/ar` | Debitor (AR) | KO'CHIR |
| 13 | Kreditorlar | `accounting/ap` | Kreditor (AP) | KO'CHIR |
| 14 | Moliya Tasdiqlash | `finance/approval` | To'lov tasdiqlash | TEKSHIR |
| 15 | Kassa | `accounting/cash-register` | Kassa | KO'CHIR |
| 16 | Kirim/Chiqim | `accounting/income-expense` | Kirim/chiqim | KO'CHIR |
| 17 | POS Monitor | `pos-monitor` | (DUP tz08) | DUP |
| 18 | Ish Haqi | `accounting/payroll-automation` | Ish haqi avtomatlashtirish | KO'CHIR ⚠️payroll |
| 19 | Buyurtma Tannarxi | `finance/order-costing` | Buyurtma tannarxi | KO'CHIR |
| 20 | Ombor Hisobi | `accounting/materials` | Material hisobi | KO'CHIR |
| 21 | Inventarizatsiya | `accounting/inventory-valuation` | Inventar baholash | KO'CHIR |
| 22 | Asosiy Vositalar | `accounting/asset-management` | Asosiy vositalar | KO'CHIR |
| 23 | Xarajat Markazlari | `fi/cost-centers` | Cost-center | KO'CHIR |
| 24 | Transfer Pricing | `fi/transfer-pricing` | Transfer narx | TEKSHIR |
| 25 | Ichki Soliqlar | `fi/tax-management` | Soliq boshqaruvi | TEKSHIR |
| 26 | Soliq Kalendari | `fi/tax-calendar` | Soliq taqvimi | TEKSHIR |
| 27 | Audit Log | `fi/audit-log` | Moliya audit log | KO'CHIR |
| 28 | Moliyaviy Risk AI | `fi/risk-ai` | AI risk tahlili | TEKSHIR (AI) |

## tz11 — XODIMLAR / HR (30 sahifa) · default: hr-dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | HR Dashboard | `hr-dashboard` | HR panel | KO'CHIR |
| 2 | Org Tuzilma | `org-structure/hierarchy` | Org-struktura (Vysotskiy 7) | KO'CHIR (poydevor) |
| 3 | HR Xarita | `hr-map` | HR xarita | KO'CHIR |
| 4 | Rekruting Voronka | `hr/recruiting` | Rekruting voronka | KO'CHIR |
| 5 | AI Intervyu | `ai-hr/interviews` | AI intervyu | TEKSHIR (AI) |
| 6 | Xodimlar | `employees` | Xodim 360 profil | KO'CHIR |
| 7 | AI HR Dashboard | `ai-hr/dashboard` | AI HR panel | TEKSHIR (AI) |
| 8 | Maqsadlar | `goals` | OKR/maqsadlar | KO'CHIR |
| 9 | Smena Jadvali | `shift-schedule` | Smena jadvali | KO'CHIR |
| 10 | Bildirishnomalar | `notifications` | Bildirishnomalar | KO'CHIR |
| 11 | Aktivlar | `assets` | Xodim aktivlari | KO'CHIR |
| 12 | Ta'til va Kasallik | `hr/vacation-sick` | Ta'til/kasallik | KO'CHIR |
| 13 | Xodim Baholash | `integration/employee-rating` | Xodim reyting | KO'CHIR |
| 14 | Ko'nikmalar Matritsasi | `skills-matrix` | Ko'nikma matritsasi | KO'CHIR (DUP tz12 olib tashlangan) |
| 15 | Mentorlik | `mentorship` | Mentorlik | DUP (tz12) |
| 16 | Succession Planning | `hr/succession` | Vorislik rejasi | TEKSHIR |
| 17 | Onboarding | `hr/onboarding` | Onboarding | KO'CHIR |
| 18 | Offboarding | `hr/offboarding` | Offboarding | KO'CHIR |
| 19 | Intizom | `discipline` | Intizom | KO'CHIR |
| 20 | Sog'liq Nazorati | `hr/health-monitoring` | Sog'liq nazorati | TEKSHIR |
| 21 | Kasbiy O'sish | `hr/career-path` | Karyera yo'li | TEKSHIR |
| 22 | Xavfsizlik | `hr/safety` | Mehnat xavfsizligi | TEKSHIR |
| 23 | Kunlik Hisobot | `hr/daily-reports` | Kunlik hisobot | KO'CHIR |
| 24 | Reception | `hr/reception` | Reception | KO'CHIR |
| 25 | Referral Tizimi | `hr/referrals` | Referral | TEKSHIR |
| 26 | HR Brend Boshqaruv | `hr/brand` | HR brend | TEKSHIR |
| 27 | Haftalik Reja | `weekly-plan` | Haftalik reja | KO'CHIR |
| — | Rekruting Kanbani | `hr/recruiting-kanban` | (kanban guruhida) | DUP→kanban |

## tz12 — TA'LIM / LMS (20 sahifa) · default: lms-dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | LMS Dashboard | `lms-dashboard` | LMS panel | KO'CHIR |
| 2 | Kurslar | `courses` | Kurslar | KO'CHIR |
| 3 | Darslar | `lessons` | Darslar | KO'CHIR |
| 4 | HR Capital Testlar | `hr-capital/tests` | HR capital test | KO'CHIR |
| 5 | Kurs Muallifi | `lms/course-author` | Kurs yaratish | TEKSHIR |
| 6 | Testlar | `tests` | Testlar | KO'CHIR |
| 7 | Imtihonlar | `all-exams` | Imtihonlar | KO'CHIR |
| 8 | AI Imtihonlar | `ai-exams` | AI imtihon | TEKSHIR (AI) |
| 9 | Sertifikatlar | `certificates` | Sertifikatlar | KO'CHIR |
| 10 | Operator Sertifikatsiyasi | `lms/operator-certification` | Operator sertifikat | KO'CHIR |
| 11 | Test Boshqaruvi | `lms/test-management` | Test boshqaruvi | KO'CHIR |
| 12 | Mentorlik | `mentorship` | (DUP tz11) | DUP |
| 13 | Leaderboard | `lms/leaderboard` | Reyting | KO'CHIR |
| 14 | Tadbirlar | `events-calendar` | Tadbir taqvimi | KO'CHIR |
| 15 | Bilim Bazasi | `lms/knowledge-base` | Bilim bazasi | KO'CHIR |
| 16 | Micro-learning | `lms/micro-learning` | Mikro-o'qish | TEKSHIR |
| 17 | HR ↔ LMS | `integration/hr-lms` | HR-LMS integratsiya | KO'CHIR |
| 18 | O'quv Byudjeti | `lms/learning-budget` | O'quv byudjeti | TEKSHIR |
| 19 | Statistika | `analytics` | LMS statistika | DUP (umumiy analytics) |

## tz13 — XAVFSIZLIK (14 sahifa) · default: camera-safety
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Xavfsizlik Holati | `camera-safety` | Xavfsizlik holati | KO'CHIR |
| 2 | Yuz Tanish Kuzatuv | `camera/monitoring` | Yuz tanish | TEKSHIR |
| 3 | Yuz Ro'yxatdan O'tish | `face-registration` | Yuz ro'yxati | TEKSHIR |
| 4 | Davomat | `security/attendance` | Davomat | KO'CHIR |
| 5 | Zona Ruxsatlari | `security/zone-access` | Zona ruxsat | TEKSHIR |
| 6 | Jonli Monitoring | `camera-live-monitoring` | Jonli kamera | TEKSHIR |
| 7 | Kameralar | `cameras` | Kamera master | DUP (tz15 cameras) |
| 8 | Hodisalar | `camera-alerts` | Kamera hodisalari | DUP (tz15?) |
| 9 | PPE Nazorati | `security/ppe` | PPE nazorat | TEKSHIR |
| 10 | Xavfli Material | `security/hazmat` | Xavfli material | TEKSHIR |
| 11 | Evakuatsiya Rejasi | `security/evacuation` | Evakuatsiya | TEKSHIR |
| 12 | Tashrif Nazorati | `security/visitors` | Mehmon nazorati | TEKSHIR |
| 13 | Xavfsizlik Reytingi | `security/rating` | Xavfsizlik reyting | TEKSHIR |

## tz14 — XO'JALIK / MRO (16 sahifa) · default: mro/dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | MRO Dashboard | `mro/dashboard` | MRO panel | KO'CHIR |
| 2 | Ta'mirlash Buyurtmalari | `integration/mro` | Ta'mir buyurtmalari | KO'CHIR |
| 3 | Preventive Maintenance | `mro/preventive` | Profilaktik ta'mir | KO'CHIR |
| 4 | MRO Ehtiyot Qismlar | `mro/spare-parts` | Ehtiyot qismlar | KO'CHIR |
| 5 | Elektr/Gaz/Suv | `mro/utilities` | Kommunal | KO'CHIR |
| 6 | Xarajat Nazorati | `mro/expense-control` | MRO xarajat | KO'CHIR |
| 7 | Oshxona va Ovqat | `mro/kitchen` | Oshxona | TEKSHIR |
| 8 | Forma Boshqaruvi | `mro/uniforms` | Forma | TEKSHIR |
| 9 | Ofis Inventari | `mro/office-inventory` | Ofis inventar | TEKSHIR |
| 10 | Tozalash Xizmati | `mro/cleaning` | Tozalash | TEKSHIR |
| 11 | Chiqindi Nazorati | `europrint/waste-tracking` | Chiqindi | KO'CHIR |
| 12 | Sanitariya | `mro/sanitation` | Sanitariya | TEKSHIR |
| 13 | Bino Inventari | `mro/building-inventory` | Bino inventar | TEKSHIR |
> ⭐ ESLATMA: bu yerda **Uskuna-360** (uskuna qo'shish/o'chirish + barcha ma'lumot, egasi intervyusi) = `mro_equipment` master. v2'da MRO/Uskuna moduli markaziy — egasi real uskunalarni kiritadi.

## tz15 — IOT VA KAMERA (16 sahifa) · default: camera-dashboard
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | IoT Dashboard | `iot/dashboard` | IoT panel | DUP (tz07) |
| 2 | Sensor Monitoring | `iot/sensor-monitoring` | Sensor kuzatuv | KO'CHIR |
| 3 | Mashina Holati | `camera-machines` | Mashina holati | KO'CHIR |
| 4 | Kamera Dashboard | `camera-dashboard` | Kamera panel | KO'CHIR |
| 5 | Kameralar | `cameras` | (DUP tz13) | DUP |
| 6 | Issiqlik Xaritasi | `camera-heatmap` | Heatmap | KO'CHIR |
| 7 | AI Nazorat Hub | `camera-ai` | AI kamera hub | TEKSHIR (AI) |
| 8 | Sifat Nazorati | `camera-quality` | Kamera QC | KO'CHIR |
| 9 | Xodim Monitoring | `camera-employees` | Xodim kamera | KO'CHIR |
| 10 | Xodim Reytingi | `camera-employee-ratings` | Xodim reyting (kamera) | KO'CHIR |
| 11 | AI Sozlamalar | `camera-settings` | Kamera sozlamalari | KO'CHIR |
| 12 | Predictive Maintenance | `iot/predictive-maintenance` | Bashoratli ta'mir | TEKSHIR |
| 13 | OEE Live | `iot/oee-live` | OEE jonli | DUP (oee) |
| 14 | Digital Twin | `iot/digital-twin` | Raqamli egizak | TEKSHIR (stub?) |
| 15 | Ogohlantirishlar | `iot/alerts` | IoT alert | KO'CHIR |
| 16 | Hisobotlar | `camera-reports` | Kamera hisobotlari | KO'CHIR |

## tz16 — DIREKTOR (18 sahifa) · default: europrint/director
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Direktor Dashboard | `europrint/director` | Direktor panel | KO'CHIR |
| 2 | AIsha (AI Yordamchi) | `aisha` | AI yordamchi (Layer A) | KO'CHIR (Q-41 futuristik) |
| 3 | Nazorat Markazi | `europrint/control` | Control center | KO'CHIR |
| 4 | Auditor Panel | `europrint/auditor` | Auditor | KO'CHIR |
| 5 | Buxgalter Ko'rinishi | `europrint/accountant` | Buxgalter view | KO'CHIR |
| 6 | Kunlik KPI | `finance/daily-kpi` | Kunlik KPI | DUP (tz10?) |
| 7 | Kunlik KPI Baholash | `europrint/employee-kpi` | Xodim KPI | KO'CHIR |
| 8 | Strategik Rejalashtirish | `europrint/strategic` | Strategik reja | KO'CHIR |
| 9 | Hisobotlar Markazi | `europrint/reports-hub` | Hisobot markazi | KO'CHIR |
| 10 | AI Xulosa | `director/ai-summary` | AI xulosa | TEKSHIR (AI) |
| 11 | Muammoli Nuqtalar | `director/problem-points` | Muammo nuqtalari | TEKSHIR |
| 12 | 14 AI Agent Hub | `agents` | AI agentlar hub | DUP (coordination) |
| 13 | Ishlab Chiqarish Agent | `agents/production` | Production AI | DUP |
| 14 | HR Agent | `agents/hr-performance` | HR AI | DUP |
| 15 | Sifat Agent | `agents/quality` | Quality AI | DUP |
| 16 | Strategik Agent | `agents/strategic` | Strategic AI | DUP |
| 17 | Xo'jalik Agent | `agents/facilities` | Facilities AI | DUP |
| 18 | Ideal Rasm | `ideal-rasm` | Ideal holat (vizyon) | KO'CHIR |

## tz17 — ADMIN PANEL / SaaS (14 sahifa) · default: super-admin
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Super Admin Panel | `super-admin` | Super admin | KO'CHIR |
| 2 | Tenant Boshqaruvi | `saas/tenant-management` | Tenant (SaaS) | TEKSHIR |
| 3 | Yangi Zavod Onboarding | `saas/onboarding` | Zavod onboarding | TEKSHIR |
| 4 | Litsenziya va Tariflar | `saas/licensing` | Litsenziya | TEKSHIR |
| 5 | Modul Yoqish/O'chirish | `saas/module-control` | Modul control | TEKSHIR |
| 6 | Monitoring | `saas/monitoring` | Tizim monitoring | TEKSHIR |
| 7 | Xatolar Logi | `saas/error-log` | Xato log | KO'CHIR |
| 8 | Istisno Holatlar | `admin/exceptions` | Istisnolar | TEKSHIR |
| 9 | Navbat Monitori | `admin/queues` | Queue monitor | KO'CHIR |
| 10 | Arizalar | `applications` | Arizalar | DUP (kanban) |
| 11 | Sozlamalar | `settings` | Tizim sozlamalari | KO'CHIR |
| 12 | Telegram Admin | `telegram/admin` | Telegram admin | KO'CHIR |

## kanban — VAZIFALAR (4 sahifa) · default: kanban
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Buyurtmalar Kanbani | `kanban` | Buyurtma kanban | KO'CHIR |
| 2 | Rekruting Kanbani | `hr/recruiting-kanban` | Rekruting kanban | KO'CHIR |
| 3 | Strategik Vazifalar | `strategic-tasks` | Strategik vazifa | KO'CHIR |
| 4 | Ilovalar | `applications` | (DUP tz17) | DUP |

## coordination — KOORDINATSIYA (10 sahifa) · default: coordination
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Kommunikatsiya Markazi | `coordination?tab=baskets` | Kommunikatsiya | KO'CHIR |
| 2 | 5 Kengash Tizimi | `coordination?tab=councils` | 5 kengash | KO'CHIR |
| 3 | Hisobot Yuborish | `coordination?tab=dokla` | ZVS hisobot | KO'CHIR |
| 4 | Ko'rsatma Berish | `coordination?tab=raspo` | ZNO ko'rsatma | KO'CHIR |
| 5-10 | AI Agentlar (6 ta) | `agents/*` | (DUP tz16) | DUP |

## chat — CHAT (1 unique sahifa) · default: chat
| # | Sahifa | Route | Vazifa | Holat |
|---|---|---|---|---|
| 1 | Xabarlar/DM/Guruh/Kanal | `chat` | Ichki chat (4 link, 1 sahifa) | KO'CHIR |

---

## XULOSA + KEYINGI QADAM

**Statistika:** 20 modul guruhi · ~280 sidebar yozuvi · ~230 noyob sahifa (dublikatlardan tashqari).
**Dublikatlar (v2'da birlashtiriladi):** OEE (3 joy), AI agents (tz16+coordination), cameras/alerts (tz13+tz15),
iot/dashboard (tz07+tz15), Mentorlik (tz11+tz12), applications (tz17+kanban), POS Monitor (tz08+tz10), analytics.
**⚠️ zonalar:** Marketing (501 ko'p, flag bilan yashirin) · Finance GL/payroll (ehtiyot) · AI sahifalar (Q-41) · papka-orders (ikki-dunyo).

**KEYINGI QADAM (egasi bilan):**
1. Bu ro'yxatni **aniqlashtirish** — har sahifaning VAZIFASI (taxminiy ustun) sizning intervyungiz bo'yicha to'g'rilanadi; qaysi qoladi/birlashtiriladi/o'chadi.
2. Modul-modul: BE modullari + DB jadvallari + ishlaydigan funksiyalarni shu ro'yxatga bog'lash (ko'chirish rejasi).
3. Yangi toza papka + Textil tuzilmasi (Vizyon→Spec→Konstitutsiya→Bosqich plan) → toza fazali qurish, ishlaydigan kodni ko'chirib.

> Bu v1 inventar. Egasi har modulni ko'rib, vazifa/holatni aniqlaydi — keyin v2 qurish boshlanadi.
