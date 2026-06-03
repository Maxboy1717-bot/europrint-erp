# EuroPrint — Master-Data Audit (butun tizim) — 2026-05-31

> READ-ONLY. Maqsad: (1) barcha modullarda master-data sahifalarini topish,
> (2) DUPLIKAT/USTMA-UST joylarni aniqlash — qaysi ma'lumot ikki joyda yashaydi.
> Usul: har sahifa FE chaqiruvi → BE controller → service → **haqiqiy DB jadval**
> gacha kuzatildi (5 parallel agent + qo'lda tekshiruv). Kalit: **DB jadval bo'yicha guruhlash**.

> Master-data = poydevor ma'lumot (kim/nima/qayer, kam o'zgaradi): xodim, mijoz,
> yetkazuvchi, material, ombor, hisob rejasi, BOM, ko'nikma, narx. EMAS: kundalik
> operatsiyalar (buyurtma, to'lov, davomad — ular tranzaksiya).

---

## 1. MASTER-DATA SAHIFALAR (modul bo'yicha, DB jadval bilan)

### HR / Ta'lim
| Sahifa | Ma'lumot | Holat | DB jadval |
|---|---|---|---|
| Employees, EmployeeProfile | Xodim master | 🟢 | `employees` (+ `employee_bank_accounts`, `salary_history`, `payroll_advances`, `disciplinary_actions`, `employee_skills`, `career_paths`) |
| OrgStructureHierarchy, OrgDepartmentsPage | Org daraxti: bo'lim + lavozim | 🟢 | `org_departments` + `employee_org_departments` + `org_functions` |
| SkillsMatrix | Ko'nikma katalogi + xodim ko'nikmalari | 🟢 | `skill_catalog` + `employee_skills` |
| Mentorship / Succession / CareerPath | Mentor / vorislik / karyera | 🟢 | `mentors` / `succession_plans` / `career_paths` + `career_path_steps` |
| Onboarding / Offboarding | Ishga olish/bo'shatish rejalari | 🟢 | `hr_onboarding_plans`, `hr_job_descriptions` / `offboarding_cases` |
| HRAssetManagement | Aktiv reestri (HR) | 🟢 | `asset_items_ext` + `employee_assets` |
| Courses / Lessons / Tests (LMS) | Kurs/dars/test katalogi | 🟢 | `courses_table`, `lms_lessons`, `lms_tests`, `lms_questions` |
| HR Capital Courses / Tests | HR-Capital kurs/test | 🔴 501 stub | **hech narsa** (yozmaydi) |
| Applications / Recruiting | Nomzodlar | 🟢 | `hr_applications`, vacancies/funnel |

### Finance
| Sahifa | Ma'lumot | Holat | DB jadval |
|---|---|---|---|
| ChartOfAccounts | Hisob rejasi | 🟢 | `accounts` |
| GLChartOfAccounts | Hisob rejasi | 🟡 (read URL buzuq) | `accounts` (BIR XIL!) |
| FinanceExtended (cost/profit centers) | Xarajat/foyda markazlari | 🟢 | `cost_centers`, `profit_centers` |
| BudgetManagement | Byudjet tuzilmasi | 🟢 | `budgets`, `budget_lines` |
| AssetManagement | Asosiy vosita reestri (Finance) | 🟡 (ba'zi stub) | `asset_items` + `asset_maintenance`/`asset_disposals`/`asset_transfers` |
| PeriodClosing | Hisobot davrlari | 🟢 | `accounting_periods` |
| PayrollAutomation | Ish haqi hisoblash sozlamasi | 🟢 | `payroll_calculations` + `payroll_contracts` |
| SettingsTabTax | Soliq stavkalari (QQS/INPS) | 🟡 | `system_settings` (alohida jadval YO'Q) |

### Sales / CRM / Marketing
| Sahifa | Ma'lumot | Holat | DB jadval |
|---|---|---|---|
| SDCustomers | Mijoz master (SD) | 🟢 | `sd_customers` (+ contacts/documents) |
| CRMWorkspace | Kompaniya/kontakt master (CRM) | 🟢 | `crm_companies` + `crm_contacts` |
| CRMSettings | CRM maxsus maydonlar | 🟢 | `crm_custom_fields` |
| SDContracts | Sotuv shartnomalari | 🟢 | `sd_contracts` |
| PricingTiers | Miqdor-pog'ona narxi | 🟢 | `price_tier` (Finance modulida!) |
| SDSettings | Narx formulasi (markup/QQS) | 🟢 | `sd_price_formulas` |
| SDLeads / MarketingLeads | Sotuv/marketing lidlari | 🟢/🟡 | `sd_leads` / `marketing_leads` |

### WMS / Materiallar / MM
| Sahifa | Ma'lumot | Holat | DB jadval |
|---|---|---|---|
| MaterialCardsPage | Material kartochkalari | 🔴 (POST 404) | GET `material_cards`; POST handler YO'Q |
| RawMaterialsPage | Xom ashyo | 🟡 | `raw_materials` + `material_cards` |
| WMSMaterials | Material + stok | 🟡 | `mm_materials` (UCHINCHI jadval) |
| PosMaterialNew (POS) | Material yaratish | 🟢 | `material_cards` |
| ERPProductsTab | Mahsulot master | 🟢 | `material_cards` (alias) |
| MMVendors / MMExtended | Yetkazuvchi master | 🟢 | `vendors` |
| BarcodeSystem | Barkod partiyalari | 🟢 | `warehouse_batches` (FK→`material_cards`) |
| WarehousesPage / WMSDashboard | Omborlar | 🟢 | `warehouses` |
| BOMManagement | Spetsifikatsiya (BOM) | 🟢 | `bom_headers` + `bom_items` |

### MES / Production / QC / Design / Admin
| Sahifa | Ma'lumot | Holat | DB jadval |
|---|---|---|---|
| RoutingConfiguration | Marshrut master | 🟢 | `routings`, `pp_routing_operations` |
| ERPWorkCentersTab | Ish markazlari | 🟢 | `work_centers` |
| EquipmentPage | Uskuna reestri | 🟢 | `mro_equipment` |
| QCModule / QCStandards | Sifat standartlari/parametrlari | 🟢 | `qc_standards`, `qc_parameters` |
| cameras-management | Kamera qurilmalari | 🟢 | `cameras` |
| IotSensorsPage / IoTExtended | IoT sensorlar | 🟢 | `iot_sensors` |
| Settings | Tizim sozlamalari | 🟢 | `system_settings`, `contact_settings`, `guidelines` |
| CalendarEvents | Ishlab chiqarish kalendari | 🟢 | `calendar_events` |
| OrgNodePortretTab | Org node portreti | 🔴 stub | hech narsa |

---

## 2. ⭐ USTMA-UST / DUPLIKAT JADVAL (ASOSIY NATIJA)

Tasnif: **(a)** chin duplikat (bir jadval, bir maqsad — bittasi o'chsin) · **(b)**
umumiy master ikki joyda ko'rsatilgan (bir jadval, ataylab — yaxshi) · **(c)**
ZIDDIYAT (bir tushuncha uchun ikki jadval — yaxlitlik xavfi, birlashtirish shart).

| # | Tushuncha | Sahifalar (modul) | Jadval(lar) | Tasnif | Izoh |
|---|---|---|---|---|---|
| 1 | **Hisob rejasi** | ChartOfAccounts (Fin) + GLChartOfAccounts (Fin) | ikkalasi `accounts` | **(a) DUPLIKAT** | Bir xil jadval, bir xil POST. GLChartOfAccounts read URL'i buzuq. Bittasini o'chiring. |
| 2 | **Mijoz** | SDCustomers (SD) + CRMWorkspace (CRM) + e-commerce | `sd_customers` / `crm_companies` / (ecommerce) | **(c) ZIDDIYAT** | UCH alohida jadval, BIR-BIRIGA BOG'LANMAGAN. Bitta mijoz 3 marta kiritiladi, sinxron yo'q. **Eng katta muammo.** |
| 3 | **Material** | MaterialCards, RawMaterials, WMSMaterials, PosMaterialNew, ERPProducts | `material_cards` / `mm_materials` / `materials` / `raw_materials` | **(c) ZIDDIYAT** | TO'RT material jadvali. 3 xil "material yaratish" 3 xil jadvalga yozadi; MaterialCardsPage create butunlay buzuq. |
| 4 | **Aktiv/Asosiy vosita** | AssetManagement (Fin) + HRAssetManagement (HR) | `asset_items` / `asset_items_ext` | **(c) ZIDDIYAT** | Ikki parallel aktiv reestri (`asset_items` ↔ `asset_items_ext` — deyarli egizak). Birlashtirish kerak. |
| 5 | **BOM (spetsifikatsiya)** | BOMManagement (ERP, jonli) | `bom_headers`/`bom_items` — ERP raw-SQL + PP Drizzle | **(a) DUPLIKAT (kod)** | Bir xil jadval, lekin IKKI kod yo'li (ERP jonli + PP uxlab yotgan, FE'siz). Uxlayotgan PP BOM stack'ni o'chiring. |
| 6 | **Ish markazlari** | ERPWorkCentersTab (ERP, jonli) | `work_centers` — ERP + PP (uxlayotgan) | **(a) DUPLIKAT (kod)** | Bir jadval, ERP jonli + PP dormant controller. PP stack'ni o'chiring. |
| 7 | **Lavozim** | EmployeeDialog dropdown / Succession / legacy HR | `org_functions` / `positions` / `hr_positions` | **(c) ZIDDIYAT** | UCH lavozim jadvali, yagona egasi yo'q. |
| 8 | **Bo'lim** | OrgDepartments + OrgStructure + HR Departments | hammasi `org_departments` (+ legacy `hr_departments`) | **(b) UMUMIY** (lekin legacy `hr_departments` (c)) | Asosiysi bitta jadval, 3 kirish nuqtasi — bu yaxshi. Lekin eski `hr_departments` alohida — uni tekshiring. |
| 9 | **Xodim shaxsi** | Employees (HR) vs Onboarding/parol/payroll | `employees` vs `users` | **(c) ZIDDIYAT** | Bir odam ikki jadvalda (`employees.id` vs `users`). Onboarding `users`'dan, qolgani `employees`'dan o'qiydi. FK noaniqligi. |
| 10 | **Ish haqi** | PayrollAutomation (Fin) + FinanceDashboard + HR EmployeeProfile | `payroll_calculations`/`payroll_contracts` + `payroll_periods`/`payroll_rows` + `salary_history`/`payroll_advances` | **(c) ZIDDIYAT** | Ish haqi sozlamasi Finance va HR o'rtasida 5+ jadvalga bo'lingan. (`payroll_periods` Finance↔HR umumiy — bu qismi (b) yaxshi.) |
| 11 | **Ko'nikma** | SkillsMatrix (jonli) vs hr-v2/skills-matrix (uxlayotgan) | `skill_catalog`/`employee_skills` vs alohida scoring | **(a) DUPLIKAT (kod)** | Jonli SkillsMatrix ishlaydi; uxlayotgan `hr-v2/skills-matrix` controller FE'siz. Uni o'chiring. |
| 12 | **Lid** | SDLeads + CRM leads + MarketingLeads | `sd_leads` / `crm_leads` / `marketing_leads` | **(c) ZIDDIYAT** | UCH lid jadvali; Marketing→CRM "convert" stub (ishlamaydi). |
| 13 | **Narx** | PricingTiers (Fin) + SDSettings (SD) | `price_tier` vs `sd_price_formulas` | **(c) tekshirish** | Ikki "narx" manbasi (miqdor-pog'ona vs markup-formula) — turli maqsad bo'lishi mumkin, lekin ikki modul egalik qiladi. |
| 14 | **Tizim sozlamalari** | Settings (jonli) vs legacy `/api/system` | `system_settings` vs `settings` | **(a) DUPLIKAT** | Ikki sozlama jadvali. Eski `settings`'ni o'chiring. |
| 15 | **Uskuna** | EquipmentPage (jonli) vs ERP work-center join | `mro_equipment` vs `equipment` | **(c) tekshirish** | Tahrirlanadigan reestr `mro_equipment`; eski `equipment` faqat JOIN uchun. Eski'ni tekshiring. |
| 16 | **Kurs/Test** | LMS Courses/Tests (jonli) vs HR Capital Courses/Tests (501) | `courses_table`/`lms_tests` vs hech narsa | **(a) DUPLIKAT** | HR Capital sahifalari konseptual takror, lekin hech narsa saqlamaydi (501). O'chiring yoki LMS'ga ulang. |

---

## 3. TAVSIYA — egasi avval HAL QILISHI shart bo'lganlari

**🔴 Eng yuqori (ma'lumot yaxlitligi xavfi — ustiga qurishdan OLDIN):**
1. **#2 Mijoz (3 jadval)** — bitta mijoz SD/CRM/e-commerce'da uch xil. Bu eng katta. Bitta `customers` master kerak yoki aniq sinxron.
2. **#3 Material (4 jadval)** — `material_cards` ni yagona manba qiling; `mm_materials`/`materials`/`raw_materials` ni unga birlashtiring; MaterialCards create'ni tuzating.
3. **#4 Aktiv (2 jadval)** — `asset_items` va `asset_items_ext` ni bittaga.
4. **#9 Xodim `employees` vs `users`** — yagona shaxs modeli (FK aniqlang).
5. **#7 Lavozim (3 jadval)** — `org_functions` ni yagona qiling.

**🟠 O'rta (chin duplikat — bittasini o'chirish oson, past xavf):**
6. **#1 Hisob rejasi** — GLChartOfAccounts'ni o'chiring (ChartOfAccounts qoladi).
7. **#5, #6, #11 uxlayotgan PP/skills stack** — FE'siz dormant kod, o'chiring.
8. **#14 Settings** — eski `settings` jadvalini o'chiring.
9. **#16 HR Capital Courses/Tests** — 501 stub, o'chiring yoki LMS'ga ulang.

**🟡 Past (tekshirish, ehtimol yaxshi):**
10. **#12 Lid** — 3 jadval, lekin modul-spetsifik bo'lishi mumkin; "convert" bridge'ni tuzating.
11. **#13 Narx**, **#15 Uskuna** — turli maqsad bo'lishi mumkin, tasdiqlang.

**Yaxshi (tegmang):** Yetkazuvchi (`vendors` — yagona, toza), Bo'lim asosiy `org_departments` (umumiy, to'g'ri), Ombor `warehouses` (bir jadval, ko'p yozuvchi — kod tartibsiz lekin jadval bitta), `payroll_periods` Finance↔HR umumiyligi.

---

*Tahlil: 5 parallel agent har sahifani DB jadvalgacha kuzatdi. Har jadval-xaritasi
repository yozish nuqtasida tasdiqlangan. Bu hujjat REJA — hech qanday kod o'zgartirilmadi.*
