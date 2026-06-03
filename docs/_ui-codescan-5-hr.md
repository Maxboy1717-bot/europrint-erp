# UI KOD-SKAN 5 — HR / Org-sxema / Xodim profil

> Rol: 🔵 Tahlilchi (QAT'IY read-only — faqat shu hisobot yozildi, boshqa hech narsa o'zgartirilmadi)
> Sana: 2026-06-02
> Skan turi: FAQAT KOD qatlami (brauzer YO'Q). Har topilma fayl(:satr) dalili bilan.
> FE root (haqiqiy): `Uzbek-Language-Module/artifacts/erp-dashboard/src`
> Vizyon manbasi: `Uzbek-Language-Module/docs/ombor-pos-master-plan.md`
> Vizyon bandlari (skan brifi A+.9 / A+.10 deb atadi; master-plan'da § raqami quyidagicha joylashgan):
> - §3.8 "Asbob-uskuna ombori" → kichik jihoz xodim profilidagi **"Mening inventarim"** (podotchet + qaytarish); katta uskuna → org-sxema bo'yicha rahbarlarga akt bilan (`master-plan:84`)
> - §14.2 har inventar **Material 360 profili** · xodim balansi/podotchet (`master-plan:210`)
> - §15.1 integratsiya: **HR** (xodim/offboarding) · **org-sxema** (bo'limlar/tasdiq) (`master-plan:217`)
> - Brif A+.9 = org-sxema lavozim kartochka + **kerakli jihozlar ro'yxati**; A+.10 = profil **Mening jihozlarim/inventarim + PIN**

---

## 0. QISQA XULOSA (TL;DR)

HR modul — eng KATTA va eng YETUK modul (97 ta top-level HR/Org/Employee sahifa + 58 ta `employee-profile/` tab fayli). Org-sxema (`OrgStructureHierarchy` + `OrgNodeDetail` + Portret wizard) va Xodim profil (`EmployeeProfile` 20+ tab) **funksional jihatdan to'liq, real BE bilan ulangan, mutatsiyalar bor**. Dizayn-sifat ko'pchilik fayllarda yuqori (EP komponentlar, semantik token, i18n kalitlar).

LEKIN vizyonga moslik bo'yicha 2 ta TUB muammo bor:

1. **A+.10 "Mening jihozlarim/inventarim" — 3 ta turli sahifa/komponentga BO'LINGAN** (parchalanish):
   - `EmployeeInventory.tsx` (`/wms/employee-inventory`) — `material_cards` asosida, "mening inventarim" sarlavhasi
   - profil `AssetsTab` (`/api/assets/employee/:id`) — IT/asset (noutbuk, telefon, kalit)
   - profil `CorporateInventoryTab` (`/api/employees/:id/corporate-inventory`) — yana bir korporativ inventar (imzo + qaytarish)
   - + HR-darajadagi `HRAssetManagement` (`/hr/assets`) + Finance `AssetManagement` (`/accounting/asset-management`) = **jami 5 ta aktiv/inventar UI**, har biri boshqa endpoint, boshqa jadval. Vizyon BITTA "Mening inventarim" (podotchet) istaydi.
2. **A+.9 "kerakli jihozlar ro'yxati" — YO'Q.** Org-node Portret wizard (`OrgNodePortretTab`) lavozim kartochkasini batafsil to'ldiradi (Blok A–E + III/IV bo'lim), lekin "kerakli jihozlar" faqat **bitta erkin matn input** (`instrumentlar`, placeholder "noutbuk, CRM, maxsus kiyim" — `PortretSection4.tsx:53-58`). Strukturali ro'yxat (jihoz turi + miqdor + omborga bog'lanish) yo'q. Blok D nomi "TOOL TEST" — bu **shaxsiy fazilatlar testi** (Diqqat/Strategiya/Empatiya...), jihoz EMAS — chalkashlik manbai.
3. **PIN (A+.10) — profil UI'da umuman YO'Q.** Xodim profilida login/PIN maydoni yo'q; `TechAccessTab` ham PIN/parol ko'rsatmaydi. Tablet/POS PIN modeli HR profilga ulanmagan.

Tozalik darajasidagi kichik muammolar: `EmployeeProfile.tsx:309` xom rang `#F0F4F8`/`#fff`/`rgba(...)` (Qoida 21 buzilishi), `AssetsTab` hardcoded "jixozlar" (i18n yo'q + imlo: "jixoz"≠"jihoz"), `OrgNodeDetail` hardcoded "Xodimlar/Farzandlar/Rahbar", 3 ta `@deprecated` Employee sahifa hali turibdi, 1 ta `.bak.t2c` fayl.

---

## 1. SAHIFA INVENTARI

### 1.1 Top-level HR/Org/Employee sahifalar
- ✅ Top-level (`pages/`) HR/Org/Employee `.tsx` (smoke-test'siz): **97 ta fayl** (`ls | grep -iE "^(HR|Org|Employee)"`).
- ✅ `employee-profile/` subdir: **58 ta `.tsx`** (tablar + sections + dialogs + types), `profile-types.ts` markaziy tip fayli bilan.
- ✅ `hr-dashboard/` subdir: 4 tab (DisciplineTab, RiskTab, SafetyTab, TurnoverTab) + types.
- Komponent qatlami: `components/hr/portret/` (10 fayl), `components/hr/orgnode/` (11 fayl), `components/hr/org/` (TreeCanvas, KpiCard, AddNodeDialog...), `components/employee/` (ProfileHeader, TabNavigation, dialogs/).

### 1.2 Vizyon-yadrosi sahifalar (A+.9 / A+.10)
| Sahifa | Fayl | Route | Holat |
|--------|------|-------|-------|
| Org ierarxiya (daraxt) | `OrgStructureHierarchy.tsx` (289 q) | `/org-structure/hierarchy` | ✅ Wired (`HRRoutes.tsx:65`) |
| Org node detali + Portret | `OrgNodeDetail.tsx` (153 q) + `OrgNodePortretTab.tsx` (175 q) | `/org-structure/hierarchy/node/:id` | ✅ Wired (`HRRoutes.tsx:66`) |
| Org bo'limlar ro'yxati | `OrgDepartmentsPage.tsx` (249 q) | — | ⚠️ HRRoutes'da YO'Q (orphan? boshqa router'da bo'lishi mumkin) |
| Xodimlar ro'yxati | `Employees.tsx` (371 q) | `/employees` | ✅ Wired (`HRRoutes.tsx:54`) |
| Xodim profil | `EmployeeProfile.tsx` (357 q) | `/employees/:id` | ✅ Wired (`HRRoutes.tsx:55`) |
| Mening inventarim | `EmployeeInventory.tsx` (143 q) | `/wms/employee-inventory` | ✅ Wired (`WarehouseRoutes.tsx:70`) — lekin WMS routerda, HR'da emas |
| Aktiv boshqaruvi (HR) | `HRAssetManagement.tsx` (253 q) | `/hr/assets` | ✅ Wired (`HRRoutes.tsx:77`); `/assets`→redirect (`AppRouter.tsx:173`) |
| Aktiv boshqaruvi (Finance) | `AssetManagement.tsx` | `/accounting/asset-management` | ✅ Wired (`FinanceRoutes.tsx:53`) + sidebar (`constants.ts:383`) |

> Eslatma: `OrgDepartmentsPage.tsx` HR_ROUTES ro'yxatida yo'q — yo orphan, yo boshqa route faylda (skan HR/Finance/Warehouse routerlarni ko'rdi). ⚠️ tekshirish kerak.

---

## 2. i18n RAW-KALIT / RASVO MATN

### 2.1 Umumiy holat — YAXSHI
- ✅ Aksariyat sahifalar `useTranslation()` + `t('...')` yoki `tLabel('common.X.y','Default')` ishlatadi. Kalitlar camelCase (`meningInventarim`, `xodimProfili`, `mengaBerilganMateriallar`) — bu **i18n KALITLARI** (loader FLAT lookup, memory `session_2026-05-26_i18n_console_gaps.md`), rasvo xom matn EMAS. Misol: `EmployeeInventory.tsx:61,89,97`; `EmployeeProfile.tsx:311-312`.
- ✅ `tLabel('common.<Comp>.<key>', 'Default')` shakli — `employee-profile/` da 10 ta (AttendanceTabTypes/DocumentsTabTypes/OffboardingTabTypes). Bu default-fallback'li toza pattern.

### 2.2 ❌ Hardcoded UZ matn (i18n'siz) — TUZATISH KERAK
- ❌ `OrgNodeDetail.tsx:104-106` — KPI labellar inline literal: `label: "Xodimlar"`, `"Farzandlar"`, `"Rahbar"`, qiymat `"Vakant"` (`master-plan` org-sxema yadro ekranida i18n yo'q).
- ❌ `OrgNodeDetail.tsx:120-121` — Tab matni `Xodimlar ({node.employeeCount})`, `Farzandlar ({node.childCount})` — JSX ichida hardcoded.
- ❌ `employee-profile/AssetsTab.tsx:93,114,167` — `"Faol jixozlar"`, `Berilgan jixozlar`, `Qaytarilgan jixozlar` — **i18n yo'q + imlo xato** ("jixoz" → to'g'risi "jihoz"). A+.10 yadro tabida.
- ❌ `AssetsTab.tsx:126` — `t("hozirdaBerilganJixozYoq")` kaliti ham "jixoz" imlosi bilan (kalit nomida).
- ❌ `OrgNodePortretTab.tsx` — Blok sarlavhalari STEPS massivida hardcoded UZ: `"Lavozim tahlili"`, `"Demografik talablar"`, `"Vazifalar & Natijalar"`, `"TOOL TEST"`, `"Tajriba & Bilim"`, `"Ish sharoitlari"`, `"Kandidatga aytiladi"` (`OrgNodePortretTab.tsx:29-37`). Toast/tugma matnlari ham qisman hardcoded: `"Portret saqlandi ✓"` (:97), `"Saqlanmoqda..."` (:139,167).
- ❌ `EmployeeProfile.tsx` — toast/role labellar hardcoded: `"Rol muvaffaqiyatli yangilandi"` (:292), `"Xodim ma'lumotlari muvaffaqiyatli yangilandi"` (:293); `ROLE_OPTIONS` 19 ta label inline UZ (`:76`).
- ❌ `EmployeeProfile.tsx:303` — pie-chart label hardcoded: `"Kelgan"/"Kelmagan"/"Kechikkan"/"Kasallik"/"Ta'til"`.

### 2.3 Ruscha/inglizcha qoldiq
- ✅ FE sahifalarida ruscha qoldiq matn **topilmadi** (skan `[А-Яа-я]` JSX matnini izladi — faqat `PortretBlokD.tsx` traits izohlarida atayin RU dublikat bor: "A — Diqqat (Внимание)" — bu ikki-tilli ko'rsatma, qoldiq emas).
- ⚠️ Inglizcha: kod ichidagi NODE_TYPE/CONDITION map qiymatlari (`AssetsTab.tsx:47-65` CONDITION_LABELS/CATEGORY_LABELS) UZ'ga tarjima qilingan, lekin kalit inglizcha (`computer/laptop/phone`) — bu data-kalit, muammo emas.

---

## 3. DIZAYN TOKEN BUZILISHI (Qoida 21)

### 3.1 ❌ Inline xom rang (style={{ color/background }}) — BLOK darajasidagi buzilish
- ❌ `EmployeeProfile.tsx:309` — `style={{ background: "#F0F4F8", ... }}` — butun profil sahifa foni xom hex. Token (`var(--ep-*)`) o'rniga.
- ❌ `EmployeeProfile.tsx:310` — `style={{ background: "#fff", boxShadow: "2px 2px 8px rgba(163,177,198,0.35)" }}` — xom hex + rgba soya (neumorphism). Bu A+.10 yadro ekranida.
- ❌ `OrgNodeDetail.tsx:86` — `style={{ background: "rgba(255,255,255,0.25)", color: "white", ... }}` — Badge xom rgba.
- ⚠️ `OrgNodeDetail.tsx:82` — `linear-gradient(135deg, ${headerBg}dd, ${headerBg}99)` — bu DB'dan kelgan `node.color` (dinamik), token'ga ko'chirib bo'lmaydi; maqbul, lekin `headerBg` fallback `"#1d4ed8"` (`:61`) hardcoded.
- ⚠️ `OrgStructureHierarchy.tsx:245` — `backgroundImage: "radial-gradient(circle, #33333315 1px, ...)"` — daraxt-canvas nuqta-grid foni xom hex.
- ⚠️ `OrgStructureHierarchy.tsx:192-196,213-214,272` — `KpiCard color="#1d4ed8"`, `"#7c3aed"`, `"#16a34a"`, `"#dc2626"`, `"#b45309"` + `LEVEL_COLORS[lvl]` — daraja-rang palitri xom hex; bu daraxt-vizualizatsiya domeniga xos (token registriga ko'chirilishi mumkin).
- ⚠️ `EmployeeProfile.tsx:303` — pie-chart `color: "#10b981"` va h.k. (Recharts uchun hex kerak, lekin token-CSS-var orqali berish mumkin edi).

> employee-profile/ subdir va components/hr/ ichida ham bir nechta inline-rang fayl bor (skan: `components/hr/org/TreeNodeCard.tsx`, `orgnode/ChildrenTab.tsx`; `employee-profile/PersonalTabSections.tsx`, `AttendanceTabSections.tsx`, `DocumentsTabDialogs.tsx`, `WorkTabTypes.ts`, `DocumentsTabTypes.ts`) — ko'pchiligi data-driven yoki status-rang; chuqurroq audit kerak bo'lsa alohida.

### 3.2 Tailwind arbitrary hex `text-[#...]`
- ✅ Top-level HR/Org/Employee sahifalarda `text-[#hex]` / `bg-[#hex]` / `border-[#hex]` **topilmadi** (0 ta) — bu yaxshi, semantik class + `var(--ep-*)` ishlatilgan (masalan `text-[var(--ep-yellow)]`, `text-[var(--ep-green)]`).

---

## 4. DUBLIKAT / ESKI SAHIFALAR

### 4.1 ❌ Aktiv/Inventar — 5 KARRA parchalanish (eng jiddiy dublikat)
Vizyon (§3.8 + §14.2) BITTA "Mening inventarim" (podotchet + qaytarish, Material 360 bog'liq) istaydi. Kodda esa:

| # | Sahifa/Komponent | Endpoint | Jadval/Manba | Maqsad |
|---|------|----------|--------------|--------|
| 1 | `EmployeeInventory.tsx` (`/wms/employee-inventory`) | `GET /api/pos/employees/me/inventory` | material_cards / pos-movement | "Mening inventarim" (o'ziniki, material balans) |
| 2 | profil `AssetsTab` (tab `assets`) | `GET /api/assets/employee/:id` | assets (IT/HR) | Noutbuk/telefon/kalit/forma |
| 3 | profil `CorporateInventoryTab` (tab `corporate-inventory`) | `GET /api/employees/:id/corporate-inventory` | corporate_inventory | Korporativ inventar + imzo + qaytarish |
| 4 | `HRAssetManagement.tsx` (`/hr/assets`) | `GET /api/assets` | assets | HR butun aktivlar reestri |
| 5 | `AssetManagement.tsx` (`/accounting/asset-management`) | (Finance) | fixed assets | Asosiy vositalar (moliya) |

- ❌ #1 va #2 va #3 — **uchchovi xodim darajasidagi "menga berilgan narsalar"** ni ko'rsatadi, lekin uch xil endpoint/jadval/atama (material vs asset vs corporate-inventory). Foydalanuvchi uchun chalkash: "Mening inventarim" qayerda?
- ⚠️ #4 (HRAssetManagement) va #5 (Finance AssetManagement) — biri HR aktiv, biri moliya asosiy vosita; semantik ajralishi BOR, lekin `assets` jadvalini ikkalasi ham ishlatishi mumkin (`HRAssetManagement` `/api/assets`, Finance alohida) — chegarani aniqlashtirish kerak.
- Vizyon talabi: §3.8 "kichik → profil Mening inventarim (podotchet); katta → org-sxema bo'yicha rahbarlarga akt". Kodda bu **kichik/katta ajratish YO'Q**; har sahifa hammasini bir xil ko'rsatadi.

### 4.2 ⚠️ Asset assign mantiqi 2 joyda takrorlanadi
- `HRAssetManagement.tsx:121` — `POST /api/assets/:id/assign` (HR xodimga beradi).
- `CorporateInventoryTab.tsx:34` — `POST /api/employees/:id/corporate-inventory` (boshqa yo'l bilan beradi).
- ❌ Ikki xil "xodimga jihoz berish" oqimi → ma'lumot ikki jadvalga tarqaladi.

### 4.3 ❌ @deprecated lekin hali turgan sahifalar
- ❌ `EmployeeStats.tsx:1` — `// @deprecated 2026-05-27` (hali fayl bor, hali `EPPageHeader` bilan render qiladi).
- ❌ `EmployeeRating.tsx:1` — `// @deprecated 2026-05-27`.
- ❌ `EmployeeDailyKPIPanel.tsx:1` — `// @deprecated 2026-05-27`.
- → 3 tasi ham o'chirilmagan; agar route'dan uzilgan bo'lsa o'lik kod, ulanган bo'lsa eski dublikat (EmployeeProfile Performance tab KPI'ni o'z ichiga oladi).

### 4.4 ⚠️ Orphan / chiqindi
- ⚠️ `employee-profile/EditPersonalCardDialogs.tsx.bak.t2c` — backup fayl repoda turibdi (o'chirish nomzodi).
- ⚠️ `OrgDepartmentsPage.tsx` — HR_ROUTES'da ro'yxatga olinmagan (§1.2). Org node detali allaqachon bo'lim CRUD'ni qoplaydi → potensial dublikat/orphan.

### 4.5 Route dublikat
- ✅ Asosiy route dublikat topilmadi; `/assets` → `/hr/assets` redirect toza (`AppRouter.tsx:173`).

---

## 5. KOMPONENT QAYTA-ISHLATISH

### 5.1 ✅ Yaxshi — EP design-system shabloni
- ✅ `Employees.tsx` — **namunaviy**: `EPPageHeader` + `EPKpiCard` (4 tile) + `EPSkeletonKpiRow`/`EPSkeletonTable` + `EPEmptyState` + `EPErrorState` + `EPStatusPill` (`Employees.tsx:36-38, 186-258`). Fayl boshida migratsiya izohi ham bor (`:5-14`). 503'ni alohida `EPErrorState` bilan ushlaydi.
- ✅ `OrgStructureHierarchy.tsx` — `EPErrorState`, `EPStatusPill`, ajratilgan `components/hr/org/*` (KpiCard, TreeCanvas, AddNodeDialog) — toza dekompozitsiya.
- ✅ `OrgNodeDetail.tsx` — `EPStatusPill` + `ConfirmDialog` (o'chirish tasdiqi, Qoida 14 ✅ `:142-150`) + ajratilgan `components/hr/orgnode/*` tab komponentlar (MainTab/EmployeesTab/ChildrenTab/...).
- ✅ `EmployeeProfile.tsx` — 20+ tab `lazy()` + `Suspense` bilan (`:50-72`), `ProfileHeader`/`TabNavigation`/dialogs/ ajratilgan; `toArr<T>()` universal normalizator (`:83-93`) — defensив. Qoida 13 (fayl bo'lish) bo'yicha ham 357 qatorda saqlangan.

### 5.2 ⚠️ Nomuvofiqlik — har sahifa o'z header'i
- ⚠️ `HRAssetManagement.tsx:181-192` — `EPPageHeader` o'rniga **qo'lda `<h1>` + `<p>`** header (Employees.tsx EP shablonidan farqli). Bir xil modul ichida ikki xil sarlavha uslubi.
- ⚠️ `OrgNodeDetail.tsx:82-114` — o'ziga xos gradient-header (DB rangidan); EP shablon emas — lekin bu domen-spetsifik (node rangi), maqbul.
- ⚠️ `EmployeeInventory.tsx:57-65` — `EPPageHeader` ishlatmaydi, qo'lda div+icon header. A+.10 yadro sahifasi EP shabloniga moslashtirilishi kerak.
- ⚠️ `EmployeeProfile.tsx:310-313` — `EPPageHeader` ishlatadi (✅), lekin atrofidagi konteyner inline `#F0F4F8` fon bilan o'ralgan (§3.1) — EP token bilan to'qnashadi.

### 5.3 ✅ Data-fetch xavfsizligi
- ✅ Aksariyat query'lar `Array.isArray()` guard + `.catch(() => [])` bilan (`EmployeeInventory.tsx:46`, `AssetsTab.tsx:75-77`, `CorporateInventoryTab.tsx:27-29`). F1/F2/Array-safety qoidalariga mos.

---

## 6. VIZYONGA MOSLIK (kod nima ko'rsatadi vs vizyon istaydi)

### A+.9 — Org-sxema: lavozim kartochka + KERAKLI JIHOZLAR ro'yxati
| Vizyon istaydi | Kod ko'rsatadi | Holat |
|----------------|----------------|-------|
| Org-sxema lavozim kartochka | `OrgNodeDetail` + Portret wizard (Blok A–E, III/IV bo'lim) — juda batafsil lavozim profili | ✅ MAVJUD va boy |
| **Kerakli jihozlar ro'yxati** (strukturali: jihoz turi + miqdor, omborga bog'liq) | Faqat BITTA erkin matn input `instrumentlar` (placeholder "noutbuk, CRM, maxsus kiyim") — `PortretSection4.tsx:53-58` | ❌ STRUKTURALI RO'YXAT YO'Q |
| Jihoz → ombor/asbob-uskuna ombori (§3.8) bilan bog'lanish | Hech qanday bog'lanish yo'q; `instrumentlar` matni hech qayerga ulanmaydi | ❌ YO'Q |
| "TOOL TEST" = jihoz testi? | Blok D "TOOL TEST" — aslida **shaxsiy fazilatlar** psixometrik testi (A=Diqqat, B=Strategiya, ... J=Muloqot) `PortretBlokD.tsx:11-22` | ⚠️ NOM CHALKASH (jihoz emas) |

**Xulosa A+.9:** Lavozim kartochkasi a'lo darajada, lekin "kerakli jihozlar" vizyon talabi — strukturali ro'yxat sifatida YO'Q. Mavjud `instrumentlar` matn maydoni omborga/asbob-uskunaga bog'lanmaydi, ya'ni "yangi xodim kelganda kerakli jihozni avtomatik so'rash/akt" oqimini quvvatlamaydi.

### A+.10 — Xodim profili: Mening jihozlarim/inventarim + PIN
| Vizyon istaydi | Kod ko'rsatadi | Holat |
|----------------|----------------|-------|
| Profilda BITTA "Mening inventarim" (podotchet + qaytarish kuzatiladi, §3.8) | 3 ta turli komponent: `EmployeeInventory` (material), `AssetsTab` (IT-asset), `CorporateInventoryTab` (korporativ) — har biri boshqa endpoint | ⚠️ MAVJUD lekin 3 KARRA bo'lingan |
| Podotchet + qaytarish | `CorporateInventoryTab` (sign+return mutatsiya `:47-65`) va `AssetsTab` (return_date) — qaytarish bor | ✅ Qisman (ikki joyda) |
| Material 360 bog'lanish (§14.2: qoldiq+qiymat+tarix+kim'da) | `EmployeeInventory` qiymat/balans ko'rsatadi (`:53,80-84`) lekin Material 360 drill-down yo'q | ⚠️ Yarim |
| **PIN** (tablet/POS login uchun) | Profil UI'da PIN maydoni umuman YO'Q; `TechAccessTab` ham PIN/parol ko'rsatmaydi; faqat `hasPassword` badge (`EmployeeProfile.tsx:316`) | ❌ YO'Q |

**Xulosa A+.10:** "Mening inventarim" g'oyasi mavjud, lekin parchalangan (qaysi tab haqiqiy "mening inventarim"?). PIN — vizyon aniq so'ragan, kodda yo'q. Profil o'zi juda boy (20+ tab: Personal, Work, Finance, Attendance, Discipline, Development, Career, Performance, Goals, 1:1, ...) — bu vizyondan ANCHA ko'p (HR yetuk modul).

### §15.1 integratsiya (org-sxema ↔ HR ↔ ombor)
- ✅ Org-sxema rahbar/vakant/tasdiq ma'lumoti `OrgStructureHierarchy` (`stats`, `notify-vacancies`) — tasdiq-zanjir uchun asos bor.
- ❌ Org-node "kerakli jihozlar" → ombor so'rovi avtomatik oqimi yo'q (A+.9 bog'lanish uzilган).
- ⚠️ Xodim profil ↔ ombor: `EmployeeInventory` POS endpoint orqali material balansni ko'radi (`/api/pos/employees/me/inventory`) — bog'lanish BOR, lekin "akt bilan chiqim" (§3.8 katta uskuna) UI'da ko'rinmadi.

---

## 7. TOPILMALAR JADVALI (yagona ro'yxat)

| # | Topilma | Belgi | Fayl:satr |
|---|---------|-------|-----------|
| 1 | A+.9 kerakli jihozlar — strukturali ro'yxat yo'q, faqat 1 erkin matn | ❌ | `PortretSection4.tsx:53-58` |
| 2 | Blok D "TOOL TEST" = shaxsiy fazilatlar, jihoz emas (nom chalkash) | ⚠️ | `PortretBlokD.tsx:11-22`; `OrgNodePortretTab.tsx:33` |
| 3 | A+.10 "Mening inventarim" 3 karra bo'lingan (material/asset/corporate) | ❌ | `EmployeeInventory.tsx` + `AssetsTab.tsx` + `CorporateInventoryTab.tsx` |
| 4 | Aktiv/inventar jami 5 ta UI (HR + Finance + WMS + 2 tab) | ⚠️ | `HRRoutes:77`, `FinanceRoutes:53`, `WarehouseRoutes:70` |
| 5 | PIN (tablet login) profil UI'da yo'q | ❌ | `EmployeeProfile.tsx` (yo'q); `TechAccessTab.tsx` (yo'q) |
| 6 | Xom rang `#F0F4F8` / `#fff` / `rgba()` profil foni | ❌ | `EmployeeProfile.tsx:309-310` |
| 7 | Xom rgba Badge | ❌ | `OrgNodeDetail.tsx:86` |
| 8 | Daraxt-canvas + KPI xom hex palitra | ⚠️ | `OrgStructureHierarchy.tsx:192-196,245` |
| 9 | Hardcoded UZ "Xodimlar/Farzandlar/Rahbar/Vakant" | ❌ | `OrgNodeDetail.tsx:104-106,120-121` |
| 10 | Hardcoded "jixozlar" + imlo xato (jixoz≠jihoz) | ❌ | `AssetsTab.tsx:93,114,167,126` |
| 11 | Portret Blok sarlavhalari hardcoded UZ | ⚠️ | `OrgNodePortretTab.tsx:29-37` |
| 12 | Toast/role/pie labellar hardcoded | ⚠️ | `EmployeeProfile.tsx:76,292-293,303` |
| 13 | 3 ta @deprecated Employee sahifa hali bor | ❌ | `EmployeeStats.tsx:1`, `EmployeeRating.tsx:1`, `EmployeeDailyKPIPanel.tsx:1` |
| 14 | `.bak.t2c` backup fayl repoda | ⚠️ | `employee-profile/EditPersonalCardDialogs.tsx.bak.t2c` |
| 15 | `OrgDepartmentsPage` HR_ROUTES'da yo'q (orphan?) | ⚠️ | `OrgDepartmentsPage.tsx` |
| 16 | `HRAssetManagement` EP header o'rniga qo'lda h1 | ⚠️ | `HRAssetManagement.tsx:181-192` |
| 17 | `EmployeeInventory` EP shablon ishlatmaydi | ⚠️ | `EmployeeInventory.tsx:57-65` |
| 18 | Xodimga jihoz berish 2 oqim (asset/assign + corporate-inventory) | ⚠️ | `HRAssetManagement.tsx:121`; `CorporateInventoryTab.tsx:34` |
| — | Employees.tsx EP shablon namunaviy | ✅ | `Employees.tsx:36-258` |
| — | OrgNodeDetail o'chirish ConfirmDialog (Qoida 14) | ✅ | `OrgNodeDetail.tsx:142-150` |
| — | Array.isArray guard + catch keng qo'llangan | ✅ | `AssetsTab.tsx:75-84` va h.k. |
| — | Top-level sahifalarda `text-[#hex]` yo'q | ✅ | (0 ta) |
| — | Ruscha qoldiq matn yo'q | ✅ | (0 ta) |

---

## 8. TAVSIYALAR (faqat tahlil — bajarish egasi ruxsati bilan)

> Bular TAVSIYA; CLAUDE.md Qoida 23 bo'yicha tavsiya ≠ ruxsat. Hech biri bajarilmadi.

1. **A+.10 inventar konsolidatsiyasi (eng yuqori ustuvorlik):** xodim "Mening inventarim" uchun YAGONA tab/sahifa belgilang. `AssetsTab` (IT-asset) va `CorporateInventoryTab` (korporativ) va `EmployeeInventory` (material) ni bitta birlashtirilgan ko'rinishga (yoki bir tab ichida 3 bo'lim) jamlash; podotchet (§3.8) + qaytarish + Material 360 link bilan.
2. **A+.9 kerakli jihozlar:** org-node Portret'ga strukturali "Kerakli jihozlar" ro'yxati (jihoz turi + miqdor) qo'shib, asbob-uskuna ombori (§3.8) bilan bog'lash — yangi xodimda avto-so'rov oqimi uchun. Blok D nomini "Shaxsiy fazilatlar testi" deb aniqlashtirish (jihoz bilan chalkashmaslik uchun).
3. **PIN:** xodim profilига tablet/POS PIN maydoni (set/reset) qo'shish, `TechAccessTab` ichiga yoki "Kirish huquqlari" kartochkasiga (`EmployeeProfile.tsx:315-317`).
4. **Tozalik:** `EmployeeProfile.tsx:309-310` xom ranglarni `var(--ep-*)` token bilan almashtirish; `AssetsTab` "jixoz"→"jihoz" imlo + i18n; `OrgNodeDetail` KPI/tab matnlarini `t()`'ga; 3 ta @deprecated sahifa + `.bak.t2c` o'chirish (route uzilganini tasdiqlab).
5. **Bir xillik:** `HRAssetManagement` va `EmployeeInventory` ni `EPPageHeader` shabloniga keltirish.

---

*Skan FAQAT kod qatlamida bajarildi (brauzer yo'q). Vizual/runtime tasdiq (rang ko'rinishi, sahifa ochilishi, 503/404) asosiy sessiya brauzer-passida qo'shiladi.*
