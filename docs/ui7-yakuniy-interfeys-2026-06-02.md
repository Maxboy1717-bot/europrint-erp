# UI-7 — YAKUNIY INTERFEYS HOLATI (UI/UX SINTEZ) 2026-06-02

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (UI-7 SINTEZ) — QAT'IY READ-ONLY. Hech bir kod/DB/commit o'zgartirilmadi; faqat shu hisobot yozildi (Qoida 23).
**Metod:** 6 ta yangi UI sub-hisobotni (UI-1…UI-6) birlashtirgan sintez. Brauzer ishlatilmadi — har topilma manba sub-hisobot bilan iqtibos qilinadi.
**Manba hisobotlar:**
- `docs/ui1-dizayn-tizimi-2026-06-02.md` (dizayn-tizimi, tokenlar, shell, a11y, i18n)
- `docs/ui2-ombor-ui-2026-06-02.md` (Ombor/WMS/POS Monitor)
- `docs/ui3-kassir-ui-2026-06-02.md` (Kassir / POS-pul)
- `docs/ui4-kanban-cc-ui-2026-06-02.md` (Kanban + Kommunikatsiya Markazi)
- `docs/ui5-hr-orgsxema-ui-2026-06-02.md` (HR / Org-sxema)
- `docs/ui6-mes-iot-tablet-ui-2026-06-02.md` (MES / IoT Planshet)

---

## 1. UMUMIY UI YETUKLIK — modul bo'yicha

| Modul | Wired % (taxminiy) | UX bahosi | Eng katta bo'shliq | Manba |
|---|---|---|---|---|
| **IoT / Planshet** | ~95% | **A** | To'liq "Equipment 360" yo'q; mexanik ish stoli yo'q; offline-sync to'liqligi noaniq | UI-6 §3, §5 |
| **Kommunikatsiya Markazi (CC)** | ~95% | **A−** | Faqat data bo'sh (jonli DB 0 hujjat); alohida URL emas — `/coordination?tab=baskets` | UI-4 §3 |
| **HR / Org-sxema** | ~90% | **A−** | Jihoz 3-joy sinxron zanjiri yo'q; org-node "kerakli jihozlar" modeli yo'q; HistoryTab BE 501 | UI-5 §2, §3, §6 |
| **MES** | ~80% | **B+** | Flekso/Ofset sex-maxsus UI yo'q; marshrut grafik vizuali yo'q; 6 route→1 fayl (`MESExtended`); qoldiq/kamomad yo'q | UI-6 §1, §2 |
| **Ombor / WMS (kanonik)** | ~75% | **B** | 3 avlod UI yonma-yon; rulon parent-child + per-kg yo'q; faktura PDF yo'q; bron (reserved_quantity) UI yo'q | UI-2 §0, §2 |
| **Kanban** | ~70% (dvigatel) | **C+** | Maxfiylik filtri ulanmagan; approval-chain yo'q; 3-Savat panel MOCK | UI-4 §1 |
| **Dizayn-tizimi (transversal)** | — | **B** | 4-5 raqobat sahifa-sarlavha shabloni; a11y past; token 3-qatlam murakkab | UI-1 §8 |
| **Kassir / POS-pul** | ~0% (vizyon ma'nosida) | **F** | Vizyon-kassir (avans/podotchet/qarz/oylik) UI umuman YO'Q; mavjud `CashRegister` = noto'g'ri konsepsiya (retail POS) | UI-3 §1, §3 |

> Eslatma: "Wired %" — sahifa real BE endpointga ulanganligi (mutation+query), vizyon to'liqligi emas. Masalan MES 80% wired bo'lsa-da, Flekso/Ofset domeni vizyon bo'yicha yo'q.

---

## 2. TRANSVERSAL (cross-cutting) DIZAYN-TIZIMI MUAMMOLARI

UI-1 topgan tizim-darajadagi muammolar modul hisobotlarida AYNAN qanday namoyon bo'lishi:

### 2.1 Raqobatlashuvchi sahifa-sarlavha shablonlari (UI-1 §3)
- UI-1: **4-5 ta raqobat** — `ModulePage` / `PageHeader` / `EPPageHeader` / `ModuleSectionHeader` + lokal kopiyalar (`ChartOfAccountsSections.tsx:233`, `FaceRegistrationSections.tsx:25`). 178 sahifa `ModulePage`/`PageHeader` import qiladi, lekin yagona kanonik yo'q.
- Modul aksi: bu fragmentatsiya har modulda "toza dizayn, lekin har xil shablon" sifatida ko'rinadi — UI-2 kanonik `Warehouse*` EP/ui ishlatadi, eski POS SPA esa o'z inline-stilini (UI-2 §1.3).

### 2.2 Kompozit komponent takrorlanishi (UI-1 §5)
- EmptyState ×4, KPI/Stat karta ×3, Confirm-dialog ×2, DataTable ×2 (`dizayn-new/` tashlangan refaktor qoldig'i). Atomlar (Card 200+/Table 217/Button/Toast 317) bitta — kompozitlar tarqoq (UI-1 §5).
- `sonner` o'lik dependency (0 fayl), faqat shadcn toast ishlatiladi (UI-1 §5).

### 2.3 Token qatlamlari murakkabligi (UI-1 §2)
- 3 qatlamli override: `design-tokens.css` → `europrint-mockup-theme.css` → `kit.css`. Sharh/qiymat nomuvofiqligi: sharhda `#FF902F`, bazaviy qiymat `#ff5d2e`, faqat Qatlam 2 to'g'rilaydi — "qaysi qatlam g'olib" noaniqligi (UI-1 §2, §4).
- Chat sahifasi global ERP tema'ni `[data-chat-page] !important` bilan bekor qiladi — global qatlamlar juda keng ekanining belgisi (texnik qarz, UI-1 §4).

### 2.4 A11y (accessibility) — tizimli kam (UI-1 §6)
- aria-* faqat 73 faylda, role= faqat 11 faylda (1144+ sahifaga juda kam). Radix primitivlari "tekin" a11y beradi, lekin maxsus interaktiv elementlar (rang-status nuqtalari, custom chiplar, jadval saralash) aria'siz.
- Modul aksi: UI-2 `.status-dot` faqat rang bilan (matn alternativasi yo'q); WMSMaterials rang-kodli mavjudlik (qizil/orange) — rang-asoslangan signal (UI-1 §6 + UI-2 §3).

### 2.5 i18n hardcoded matnlar (UI-1 §7)
- 993 fayl `useTranslation` ishlatadi (yuqori integratsiya), lekin ~2675 hardcoded TSX qoldiq + RU bo'shliqlar.
- Modul aksi — eng yomon ikki joy:
  - **Eski POS SPA** (UI-2 §1.3): raw camelCase i18n kalit (263/39 fayl), dual i18n, RU rejimda buzuq matn.
  - **StockReservation** (UI-2 §1.2, §3): uz/ru tilni `tLabel` o'rniga QO'LDA toggle qiladi — ERP i18n bilan nomuvofiq.

---

## 3. ENG KUCHLI vs ENG ZAIF UI MODULLAR

### 3.1 Eng kuchli (production-ready) ✅
- **IoT / Planshet (`IoTTablet.tsx`)** — UI-6 §3: "eng yetuk, production-ready UI". login→smena→sessiya→chek-list(skan)→ishlab chiqarish→brak/downtime/QC/handover/SOS, hammasi real mutation. Katta tugma (56–96px), `inputMode=numeric`, energiya tejash overlay, auto-stop (signal 30s), tokenli auth (public emas, UI-6 §6).
- **Kommunikatsiya Markazi (CC)** — UI-4 §3: TO'LIQ WIRED + REAL. 3 savat, PIN imzo (4-8 raqam), 14 hujjat turi (seed bilan tasdiqlandi), 4-qadamli AI sehrgar, 24h qoida, Doklad↑/Raspor↓. Mock yo'q.
- **HR Org-sxema + Portret** — UI-5 §2: TreeCanvas zoom/pan/drag, add/move/edit/delete dialoglar, PDF/Excel eksport, 7-bosqichli Portret wizard (JSONB persist), 18-tab xodim profili.

### 3.2 Eng zaif ❌
- **Kassir / POS-pul** — UI-3 §1: vizyon ma'nosidagi kassir UI **umuman yo'q**. Mavjud `CashRegister.tsx` = retail do'kon POS'i (savat/QQS/chek) — noto'g'ri konsepsiya. 8 vizyon xususiyatdan **0 to'liq**, 4 qisman/yondosh, 4 yo'q (podotchet/avans-berish/oylik-payout/kassir-PIN).
- **Kanban** — UI-4 §1: dvigatel ishlaydi (drag-drop + 8 view + CRUD + realtime), LEKIN 3 jiddiy bo'shliq:
  - Maxfiylik filtri KOSMETIK — `roleFilter` `filteredCards` useMemo'da ishlatilmaydi (UI-4 §1.4). "Xodim faqat o'zinikini ko'radi" yolg'on signal.
  - Approval-chain doskada yo'q (UI-4 §1.4).
  - 3-Savat panel = MOCK (`ThreeBasketsPanel.tsx:50-56` hardcoded `INITIAL_ITEMS`, useQuery yo'q, UI-4 §1.6) — eng muhim aniqlanish.

---

## 4. VIZYON → UI BO'SHLIQLARI (konsolidatsiya)

Barcha 6 hisobotdan yig'ilgan, vizyonda bor lekin UI yo'q/qisman xususiyatlar:

| # | Vizyon xususiyat | UI holati | Manba | FE/BE |
|---|---|---|---|---|
| 1 | **Kassir ish-o'rni** (avans-berish, podotchet/employee_ledger, qarz ro'yxati, reconcile, oylik payout, kassa qoldiq) | ❌ YO'Q (vizyon ma'nosida) | UI-3 §3 | BE qisman tayyor (`procurement.api.ts` advance/reimburse/reconcile) → FE qurish kerak |
| 2 | **Barcode ota-bola (parent-child, rulon split)** | ❌ YO'Q (DB `parent_barcode_id` bor, FE/BE 0) | UI-2 §2 | BE+FE |
| 3 | **Per-rulon kg / qisman sarf** | ❌ YO'Q (qoldiq jadval umumiy qty) | UI-2 §2 | BE+FE |
| 4 | **Jihoz 3-joy sinxron** (org-node "kerakli jihozlar" → xodim → mening jihozlarim) | ❌ Zanjir uzilgan (uch ekran alohida API; Portret'da jihoz maydoni yo'q) | UI-5 §3 | BE+FE |
| 5 | **Kanban maxfiylik** (kim nimani ko'radi) | ❌ Filtr ulanmagan (kosmetik) | UI-4 §1.4 | FE (yoki BE board-membership) |
| 6 | **Kanban approval-chain / 3-Savat real** | ❌ Doskada imzo yo'q; panel MOCK | UI-4 §1.4, §1.6 | FE (CC API mavjud) |
| 7 | **MES Flekso / Ofset alohida chiziqlar** (sex-maxsus) | ❌ Umumlashtirilgan "work center" | UI-6 §1.6 | FE (BE `type` bor) |
| 8 | **Invoice / faktura PDF** | ⚠️ Qisman (harakat akti PDF bor, faktura yo'q) | UI-2 §2 | BE+FE |
| 9 | **Bron (reserved_quantity)** | ⚠️ `StockReservation` = AI-batch optimizatsiya, haqiqiy bron emas | UI-2 §2 | BE+FE |
| 10 | **AI-kamera foto-aniqlash** (object/material) | ⚠️ Barcode-kamera bor; `/ai-camera` stub (lekin `camera-ai-modern` hub real) | UI-2 §2, UI-6 §3.6 | FE (redirect) + BE |
| 11 | **Marshrut grafik vizual** (flow/Gantt) | ⚠️ Faqat operatsiya-strip (ArrowRight) | UI-6 §1.3 | FE |
| 12 | **Equipment 360** (to'liq jihoz-360 sahifa) | ⚠️ `EquipmentPage` jadval + buyurtma-360 tab; to'liq 360 yo'q | UI-6 §3.5 | FE (BE qisman) |
| 13 | **Mexanik ish stoli** | ⚠️ Predictive maintenance tab bilan qoplangan; alohida UI yo'q | UI-6 §3.4 | FE |
| 14 | **Org-node tarixi (history)** | ⚠️ FE wired, BE ehtimol 501 | UI-5 §6 | BE |
| 15 | **Lavozim kartasi + PIN auth** (org-chart) | ⚠️ PIN faqat CC/IoT; org-chart'ga ulanmagan | UI-5 §5 | FE |
| 16 | **Offline-sync (IndexedDB, planshet §1.5)** | ⚠️ Alerts queue bor; to'liqligi noaniq | UI-6 §5 | FE+BE |

**Jami:** ❌ to'liq yo'q = 6 · ⚠️ qisman = 10.

---

## 5. "3 AVLOD UI YONMA-YON" MAVZUSI (generatsion drift)

UI-2 Ombor modulida aniq topdi (UI-2 §0): **3 avlod UI yonma-yon**:
1. YANGI kanonik (`Warehouse*` + `PosMonitorPage` + `warehouse.api.ts`) — EP/ui + `tLabel` + semantik token, 0 inline xom rang.
2. O'RTA avlod (`{WMS,MM,Material,Stock,Inventory}*`) — toza dizayn, lekin funksional dublikat + boshqa BE endpoint.
3. ESKI POS SPA (`pos-monitor/pages/*`, 25 sahifa) — raw-kalit i18n + xom hex + dual i18n; sidebar'da yo'q, deep-link tirik.

Bu generatsion drift boshqa joylarda ham ko'rinadi:
- **Endpoint bo'linishi (UI-2 §5):** Ombor FE'da 6 turli BE prefiks (`/api/pos/warehouse-config/*`, `/api/pos/wms/*`, `/api/warehouse/dashboard/*`, `/api/inventory/materials`, `/api/ai-reservation/*`, `/api/mm/*`) — backend ham 3 avlod bo'lingani aksi.
- **Dizayn-tizimi (UI-1 §5):** `components/dizayn-new/` (DataTable/EmptyState) = "yangi tashlangan/refaktor qoldiq" — to'liq joriy etilmagan avlod, kanonik `ui/table` bilan yonma-yon.
- **Sahifa-sarlavha (UI-1 §3):** `ModulePage` (eski) / `PageHeader` (o'rta) / `EPPageHeader` (yangi EP brend) — uchala avlod birga.
- **Toast (UI-1 §5):** `sonner` o'rnatilgan (yangi avlod niyat) lekin 0 fayl — shadcn toast (joriy) ishlatiladi.
- **MES (UI-6 §1.1):** 6 route → bitta `MESExtended.tsx` — granularlik past, yarim ko'chirilgan domen.
- **Kassir (UI-3 §1):** `CashRegister` (retail POS, eski/noto'g'ri konsepsiya) hali turibdi, vizyon-kassir esa hech qachon qurilmagan — konseptual drift.

---

## 6. KEYINGI BAJARISH UCHUN USTUVOR UI ISH RO'YXATI (tartiblangan)

> ⚠️ Hammasi TAVSIYA (Qoida 23). Bajarish faqat egasi aniq "ha, bajar" deganda. Bitta Bajaruvchi 🟢.

### Daraja 1 — Yolg'on signal / xavfli (darhol)
1. **Kanban maxfiylik filtrini ulash** (UI-4 §1.4) — `roleFilter` ni `filteredCards` useMemo'ga (`useKanbanBoard.ts:95`) ulash yoki BE board-membership cheklov. Hozir dropdown ko'rinadi-yu ishlamaydi = yolg'on maxfiylik signali. **Pure-FE** (yoki BE-cheklov tanlovi).
2. **Kanban 3-Savat MOCK'ni real CC'ga ulash** (UI-4 §1.6) — `INITIAL_ITEMS` hardcoded o'rniga `GET /api/cc/baskets/*` yoki panelni `/coordination?tab=baskets` linkka almashtirish. Soxta demo'ni yopadi. **Pure-FE** (CC API mavjud).

### Daraja 2 — Yo'qolgan vizyon yadrosi (yuqori qiymat)
3. **Kassir ish-o'rni qurish** (UI-3 §2) — avans-berish, podotchet balans+qarz, reconcile, oylik payout, kassa qoldiq. BE API qisman tayyor (`procurement.api.ts`). **FE asosiy + BE to'ldirish.**
4. **Jihoz 3-joy zanjirini ulash** (UI-5 §3, §8) — Portret wizard'ga "kerakli jihozlar" bloki (org-node), so'ng xodimga biriktirilganda CorporateInventory/Assets/EmployeeInventory avto-to'lishi. **BE+FE.**
5. **Rulon parent-child + per-kg UI** (UI-2 §2, §6) — PosMonitor qoldiq jadvaliga rulon-kg/split. **BE+FE.**

### Daraja 3 — Generatsion drift tozalash (texnik qarz)
6. **Eski POS SPA → redirect/o'chirish** (UI-2 §6) — avval PosMonitorPage [To'liq Kirim/Chiqim] (`:657-671`) eski SPA'ga bog'langanini kanonik EP oqimga ko'chirish, keyin 25 SPA sahifa o'chirish. **FE.**
7. **Ombor dashboard konsolidatsiya 4→1** (UI-2 §4) — `WMSDashboard`+`WarehouseKpiHub`+`MMDashboard` widgetlarini `WarehouseDashboardPage`ga. **FE.**
8. **Sahifa-sarlavha shablonini bittaga keltirish** (UI-1 §10) — `EPPageHeader` kanonik; `ModulePage`/`PageHeader`/`ModuleSectionHeader` + lokal kopiyalar ko'chirish. **Pure-FE.**
9. **Kompozit dedup** (UI-1 §10) — EmptyState ×4→1, KPI ×3→`EPKpiCard`, confirm ×2→1, `dizayn-new/` tozalash, `sonner` o'lik dep olib tashlash. **Pure-FE.**

### Daraja 4 — UX/sifat polishi
10. **POS Monitor amaliy tugmalarini kattalashtirish** (UI-2 §6) — [Kirim]/[Chiqim] `h-7 text-xs` → planshet/qo'lqop touch-target. **Pure-FE.**
11. **ProcurementPage UX** (UI-2 §6) — raw user ID o'rniga xodim/rahbar qidiruv-dropdown (BE approval-chain tayyor). **Pure-FE.**
12. **MES Flekso/Ofset domen ko'rinishi** (UI-6 §7) — `type` bo'yicha filtr/ko'rinish. **Pure-FE.**
13. **A11y minimumi** (UI-1 §10) — kanonik shablonga aria-label/role; status-dot matn alternativasi; kliklanadigan `<div>`→`<button>`. **Pure-FE.**
14. **i18n yopish** (UI-1, UI-2) — StockReservation `tLabel`ga; eski POS SPA raw-kalit; qolgan ~2675 hardcoded TSX. **Pure-FE.**
15. **Token qatlam soddalashtirish + Chat `!important` reset** (UI-1 §10) — 3 qatlamni 1-2 ga; global override kengligini kamaytirish. **Pure-FE.**

### Daraja 5 — BE-bog'liq (alohida BE sessiya)
16. **HistoryTab BE 501** (UI-5 §8) — `GET /api/org-structure/nodes/:id/history` real javob. **BE.**
17. **Faktura PDF** (UI-2 §2) + **haqiqiy bron (reserved_quantity)** (UI-2 §5) + **AI-kamera foto-aniqlash** (UI-2, UI-6). **BE+FE.**

---

## 7. YAKUNIY HUKM

- **Kuchli yadro:** IoT planshet, CC, HR org-sxema/Portret — uchchalasi production-ready, real mutation, mock yo'q (UI-4/5/6).
- **Eng katta yagona bo'shliq:** **Kassir** — vizyon roli (moliya naqd-nazorat) butunlay UI'siz; mavjud retail POS chalg'ituvchi (UI-3).
- **Eng xavfli yolg'on signal:** Kanban maxfiylik filtri (ko'rinadi-yu ishlamaydi) + 3-Savat mock paneli (UI-4).
- **Eng katta texnik qarz:** Ombor modulida 3 avlod UI + 6 BE endpoint prefiks; dizayn-tizimida 4-5 sahifa-sarlavha shabloni + kompozit takror (UI-1, UI-2).
- **Transversal zaiflik:** A11y tizimli kam (aria 73 fayl) va ~2675 hardcoded TSX qoldiq (UI-1).

---

*UI-7 sintez 2026-06-02 — 🔵 Read-only. 6 sub-hisobot birlashtirildi; har topilma manba bilan iqtibos qilindi. Faqat shu `.md` fayl yozildi; kod/DB/commit o'zgartirilmadi (Qoida 23).*
