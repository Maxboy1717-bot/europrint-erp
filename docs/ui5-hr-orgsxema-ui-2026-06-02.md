# UI-5 — HR / Org-sxema (org-chart) UI tahlili

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (read-only, kod asosida — brauzer ishlatilmadi)
**Frontend ildiz:** `artifacts/erp-dashboard/src`
**Vision manba:** `docs/ombor-pos-master-plan.md`, memory: org-node "Portret" wizard, org struktura markaziy

> Eslatma: `.claude/worktrees/agent-*` ostidagi nusxalar boshqa sessiyalarga tegishli —
> e'tibordan chetda qoldirildi. Faqat kanonik `artifacts/erp-dashboard/src` tahlil qilindi.

---

## 1. Sahifa inventari (wired / stub)

Marshrutlar manbasi: `src/routes/HRRoutes.tsx` (HR_ROUTES, AI_HR_ROUTES, SELF_SERVICE_ROUTES),
`src/routes/WarehouseRoutes.tsx`, `src/routes/StubRoutes.tsx`.
Sidebar manbasi: `src/components/sidebar/constants.ts` (tz11 = "Xodimlar" guruhi).

### Org-sxema (org-chart) yadrosi — TO'LIQ WIRED ✅

| Sahifa | Route | Fayl | API | Holat |
|--------|-------|------|-----|-------|
| Org Tuzilma (tree) | `/org-structure/hierarchy` | `pages/OrgStructureHierarchy.tsx` | `GET /api/org-structure/hierarchy`, `GET /api/org-structure/stats` | ✅ wired |
| Org Node Detail | `/org-structure/hierarchy/node/:id` | `pages/OrgNodeDetail.tsx` | `GET /api/org-structure/nodes/:id` (useOrgNodeData) | ✅ wired |
| HR Xarita | `/hr-map` | `pages/HRMap.tsx` | — | sidebar tz11 |
| Org bo'limlar | `/...` (OrgDepartmentsPage) | `pages/OrgDepartmentsPage.tsx` | `/api/org-departments` | mavjud |

### Xodim 360° profil — TO'LIQ WIRED ✅

| Sahifa | Route | Fayl | Holat |
|--------|-------|------|-------|
| Xodimlar ro'yxati | `/employees` | `pages/Employees.tsx` | ✅ |
| Xodim profili (18 tab) | `/employees/:id` | `pages/EmployeeProfile.tsx` + `pages/employee-profile/*` | ✅ wired, CRUD ko'p |
| Mening inventarim | `/wms/employee-inventory` | `pages/EmployeeInventory.tsx` | ✅ wired |

### HR modulining qolgan sahifalari (sidebar tz11 da faol)

`hr-dashboard`, `hr/recruiting`, `ai-hr/interviews`, `goals`, `shift-schedule`,
`assets` (HRAssetManagement), `hr/vacation-sick`, `skills-matrix`, `mentorship`,
`hr/succession`, `hr/onboarding`, `hr/offboarding`, `discipline`,
`hr/health-monitoring`, `hr/career-path`, `hr/safety`, `hr/daily-reports`,
`hr/reception`, `hr/referrals`, `hr/brand`, `weekly-plan` — barchasi route +
sidebar + sahifa fayli mavjud (HR_ROUTES da 50+ lazy import).

---

## 2. Org-chart UI batafsil

**Fayl:** `pages/OrgStructureHierarchy.tsx` (290 qator) + `components/hr/org/*`.

- **Tree view:** ✅ `TreeCanvas` (`components/hr/org/TreeCanvas.tsx`) — rekursiv daraxt,
  zoom (wheel + tugmalar 10%–300%), pan/drag (mouse), Fit-to-screen, Reset
  (`OrgStructureHierarchy.tsx:71-102`).
- **Node kartochkalari:** ✅ `TreeNodeCard.tsx` — har node rang (`color`/`LEVEL_COLORS`),
  daraja, rahbar/vakant holati, bola soni; `onNodeClick` → detail sahifaga navigatsiya
  (`OrgStructureHierarchy.tsx:261`).
- **KPI panel:** ✅ jami bo'limlar / nodes / xodimlar / vakant / 30 kun o'zgarish
  (`KpiCard`, `stats` query, satr 192-197).
- **Filtr/qidiruv:** ✅ ism/rahbar qidiruv, daraja (0–4), holat (all/vakant/band) filtri
  (`filterTree`, satr 140-156).
- **Struktura tahrirlash (drag/edit):** ✅
  - Qo'shish: `AddNodeDialog` → `POST` (satr 278), har node ostiga "+" bilan bola qo'shish.
  - Ko'chirish (drag): `onMoveNode` → `PATCH /api/org-structure/nodes/:id/move` (satr 60-69, 263).
  - Tahrirlash: `OrgNodeDetail` → `EditDialog` → `PATCH /api/org-structure/nodes/:id`
    (`components/hr/orgnode/EditDialog.tsx:45`) — nom UZ/RU, turi, rang, TSKP/QYAM, tavsif.
  - Ko'chirish dialog: `MoveDialog`; O'chirish: `ConfirmDialog` bilan (Qoida 14 bajarilgan).
- **Eksport:** ✅ PDF / Excel blob yuklab olish (`/api/org-structure/export/pdf|excel`, satr 106-130).
- **Vakant xabarnoma:** ✅ `POST /api/org-departments/notify-vacancies` (satr 54-58).

### OrgNodeDetail — lavozim (node) kartasi tablari

`pages/OrgNodeDetail.tsx` da 8 tab (satr 117-137):
`main` (asosiy + rahbar — `MainTab.tsx`), `employees`, `children`, `vacant`,
`folder` (hujjatlar), `stats`, **`portret`** (Portret wizard), `history`.

- **MainTab** (`components/hr/orgnode/MainTab.tsx`): node ID, nom UZ/RU, turi, daraja,
  ota-node, holat + rahbar kartasi (tayinlangan/vakant) + TSKP(QYAM) + tavsif kartalari.
- **HistoryTab** (`components/hr/orgnode/HistoryTab.tsx`): `GET /api/org-structure/nodes/:id/history`
  ni o'qiydi va render qiladi. ⚠️ Memory'ga ko'ra BE `getNodeHistory` 501 bo'lishi mumkin —
  bo'sh holatda "Hozircha tarix mavjud emas" ko'rsatadi (FE sinmaydi).

### "Portret" wizard — TO'LIQ WIRED ✅

**Fayl:** `pages/OrgNodePortretTab.tsx` (175 qator) + `components/hr/portret/*`
(PortretBlokA–E, Section3, Section4, HRRequestDialog, HRRequestsHistory).

- 7 bosqichli sehrgar: Blok A (Lavozim tahlili), B (Demografik), C (Vazifa/Natija),
  D (TOOL TEST — IQ/leadership/replication ballari), E (Tajriba/Bilim),
  III (Ish sharoitlari), IV (Kandidatga aytiladi).
- Progress bar (% to'ldirilgan), step navigatsiya, Oldingi/Keyingi/Saqlash.
- API: `GET/POST /api/org-structure/nodes/:id/portret` (JSONB `portret_data`),
  `GET /api/org-structure/nodes/:id/hr-requests`, "HR ga so'rov" → `HRRequestDialog`.
- Bu memory `project_portret_persist_done.md` bilan mos (backend REAL, upsert JSONB).

---

## 3. "Mening jihozlarim" (my equipment) — QISMAN ✅ / ⚠️

Vision: jihoz 3 joyda sinxron (org-node "kerakli jihozlar" → xodimga biriktirish → "mening jihozlarim").

Mavjud UI bo'laklari:

| Komponent | Route/joy | API | Maqsad |
|-----------|-----------|-----|--------|
| **EmployeeInventory** ("Mening inventarim") | `/wms/employee-inventory` | `GET /api/pos/employees/me/inventory`, `/api/auth/me` | ✅ Joriy foydalanuvchining materiallar balansi (kirim/qaytarilgan/balans/qiymat) |
| **AssetsTab** (profil "assets" tab) | `/employees/:id` | `GET /api/assets/employee/:id` | ✅ Xodimga biriktirilgan jihozlar (faol/qaytarilgan, kategoriya, S/N) — read-only |
| **CorporateInventoryTab** (profil "corporate-inventory") | `/employees/:id` | `GET/POST/PATCH /api/employees/:id/corporate-inventory` (+sign/return) | ✅ To'liq CRUD: qo'shish, imzo, qaytarish |
| **HRAssetManagement** | `/assets` (sidebar "Aktivlar") | `/api/assets...` | aktiv boshqaruv |
| EquipmentPage | `/equipment` | — | StubRoutes ichida (jihoz placeholder) |

**Xulosa:** "Mening jihozlarim/inventarim" ekrani **bor va wired** (EmployeeInventory +
profil AssetsTab/CorporateInventoryTab). Lekin **vision'dagi "3 joy sinxron" zanjirining
boshlanishi — Portret/org-node ichidagi "kerakli jihozlar" modeli — YO'Q** (memory
`project_portret_persist_done.md`: "kerakli jihozlar" modeli yo'q). Portret wizard'da
jihoz talabi maydoni mavjud emas (`OrgNodePortretTab` DEFAULT_PORTRET'da jihoz yo'q).
Ya'ni org-node → xodim → mening jihozlarim avtomatik fan-out hali ulanmagan; har uch
ekran alohida API'lardan o'qiydi.

---

## 4. Xodim profili — tablar va tahrirlash (Phase-3 ✅)

**Fayl:** `pages/EmployeeProfile.tsx` (~340+ qator) + `pages/employee-profile/*` (60+ fayl).

Tablar (`EmployeeProfile.tsx:318-339`, `components/employee/TabNavigation.tsx`):
`personal`, `work`, `documents`, `discipline`, `development`, `adaptation`, `career`,
`assets`, `obligations`, `attendance`, `daily-reports`, `finance`, `performance`,
`goals`, `one-on-one`, `corporate-inventory`, `monthly-report`,
(+ shartli) `offboarding`, `machine-operator`.

**Personal tab** (`employee-profile/PersonalTab.tsx`) — Phase-3 dizayni:
- 4 read-only kartochka: `PersonalInfoCard`, `ContactInfoCard`, `WorkConditionsCard`,
  `FamilyInfoCard` (`PersonalTabSections.tsx`).
- 3 tahrirlanadigan PII kartasi per-card dialog bilan: `PassportCard`, `BankAccountCard`,
  `EmergencyContactCard` → `POST /api/employees/:id/passport | bank-accounts | emergency-contacts`.

**Tahrir dialoglari (mutationlar) — juda boy:** passport, bank, emergency, contract,
salary-history, bonus, fine, overtime, cash-advance, leave-request, sick-leave,
business-trip, role (`PATCH /api/hr/employees/:id`), umumiy edit (`EmployeeProfile.tsx:280-293`).
Har biri `invalidateQueries` + toast. Qoida F2 (onError) asosan bajarilgan.

**Xulosa:** Profil tablari (personal/contact/work/family) va tahrir dialoglari
✅ TO'LIQ (memory "Phase-3 profile edit done" tasdiqlandi).

---

## 5. PIN autentifikatsiya (HR kontekstida)

- **PinPromptModal** (`components/cc/PinPromptModal.tsx`): 4–8 raqamli PIN bilan hujjat
  **approve/reject/cancel** → `POST /api/cc/documents/:id/{action}` body'da `pin`.
  Bu **Coordination Center (CC) hujjat workflow'i** uchun, sof HR emas.
- **IoTLoginPanel** (`pages/iot/IoTLoginPanel.tsx`) + `useIoTTabletAuth.ts`: IoT tablet uchun
  PIN-login (zavod terminali).
- **OrderWorkflowPage** ham PIN ishlatadi.

**Xulosa:** PIN auth FE'da **bor va wired**, lekin asosan CC hujjat tasdiqlash va IoT tablet
uchun. HR/org-chart sahifalarida to'g'ridan-to'g'ri PIN ekrani **yo'q** — vision'dagi
"lavozim kartasi + PIN" g'oyasi hali org-chart UI'ga ulanmagan (⚠️).

---

## 6. Vision → UI moslik jadvali

| Vision elementi | UI holati | Dalil |
|-----------------|-----------|-------|
| Org-chart daraxt ko'rinishi | ✅ TO'LIQ | `OrgStructureHierarchy.tsx` + `TreeCanvas.tsx`, zoom/pan/drag |
| Node/lavozim kartalari (detallar bilan) | ✅ TO'LIQ | `TreeNodeCard.tsx`, `OrgNodeDetail` 8 tab, `MainTab` rahbar+QYAM |
| Struktura tahrirlash (qo'sh/ko'chir/tahrir/o'chir) | ✅ TO'LIQ | Add/Move/Edit/Delete dialoglar, `/move` `/nodes/:id` API |
| "Portret" wizard (lavozim portreti) | ✅ TO'LIQ | `OrgNodePortretTab.tsx` 7 bosqich, JSONB persist |
| Xodim profili (personal/contact/work/family) | ✅ TO'LIQ | `PersonalTab.tsx` 4 karta + 3 PII dialog |
| "Mening jihozlarim" ekrani | ✅ qisman | `EmployeeInventory.tsx`, `AssetsTab`, `CorporateInventoryTab` |
| Jihoz 3-joy sinxron (org-node "kerakli jihozlar" → xodim → mening) | ❌ YO'Q | Portret'da jihoz talabi maydoni yo'q; uch ekran alohida API |
| Lavozim kartasi + PIN auth | ⚠️ qisman | PIN faqat CC/IoT (`PinPromptModal`, `IoTLoginPanel`), org-chart'da yo'q |
| Org-node tarixi (history) | ⚠️ FE wired, BE ehtimol 501 | `HistoryTab.tsx` → `/nodes/:id/history` |

---

## 7. Dublikat / o'chirilgan HR sahifalar

Memory (`session_2026-05-27_hr_pages_redelete.md`): 19 HR sahifa o'chirilgan,
tz11 = 26 item, faqat Reception + Haftalik Reja qoldirilgan.

Hozirgi holat — **regress yo'q, lekin sidebar kengaygan:**
- tz11 ("Xodimlar") da hozir **~37 item** (separatorlar bilan), 22+ faol HR sahifa
  (`constants.ts:394-438`). Ya'ni o'chirilgan sahifalar qaytmagan, balki yangi/boshqa
  sahifalar (gamification, birthdays, conflict, alumni, enps, pip, milestones — HR_ROUTES
  satr 84-95) qo'shilgan. Bularning ko'pi sidebar'da emas, faqat route'da
  ("Newly implemented HR pages" izohi).
- Reception (`hr/reception`) va Haftalik Reja (`weekly-plan`) hamon mavjud (satr 431, 437).
- Org-chart bo'yicha dublikat **topilmadi**: bitta kanonik `OrgStructureHierarchy` +
  `OrgNodeDetail`. (Worktree nusxalaridagi `OrgChartPage.tsx` kanonik daraxtda yo'q —
  faqat parallel agent worktreelarida, e'tiborga olinmadi.)
- `routes/__tests__/hrRouteDedup.test.ts` mavjud — HR route dublikat himoyasi bor.

---

## 8. Tavsiyalar (faqat tahlil — bajarish uchun egasi ruxsati kerak)

1. **Jihoz 3-joy zanjirini ulash:** Portret wizard'ga "kerakli jihozlar" (required equipment)
   bloki qo'shish (org-node darajasida), so'ng xodimga biriktirilganda `CorporateInventoryTab`/
   `AssetsTab`/`EmployeeInventory` avtomatik to'lishi — hozir uch ekran uzilgan.
2. **HistoryTab BE 501 tekshirish:** `GET /api/org-structure/nodes/:id/history` real
   javob qaytarishini tasdiqlash (memory'da 501 belgilangan).
3. **PIN + org-chart:** agar vision "lavozim kartasiga PIN bilan kirish" bo'lsa,
   `PinPromptModal` namunasini org-chart/HR kontekstiga moslashtirish kerak.
4. **Sidebar tozalik:** HR_ROUTES'dagi yangi sahifalar (gamification/birthdays/conflict/
   alumni/enps/pip/milestones) sidebar'da ko'rinmaydi — atayinmi yoki unutilgan, aniqlash.
5. **EquipmentPage stub:** `/equipment` hali StubRoutes'da — agar kerak bo'lsa real qilish
   yoki olib tashlash.

---

*Tayyorladi: 🔵 Tahlilchi sessiyasi — faqat `docs/` ga yozildi, kod/DB o'zgartirilmadi.*
