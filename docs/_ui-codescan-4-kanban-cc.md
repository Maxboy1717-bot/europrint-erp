# MODUL 4 — Kanban / Kommunikatsiya Markazi (Koordinatsiya) — UI KOD-SKAN HISOBOTI

> **Rol:** Interfeys kod-tahlilchisi — QAT'IY READ-ONLY (brauzer YO'Q, faqat kod dalili).
> **Sana:** 2026-06-02
> **FE root:** `artifacts/erp-dashboard/src`
> **Vizyon manbasi:** `docs/ombor-pos-master-plan.md` + task brief (A+.18: CC alohida sahifa bo'lsin — tab'dan chiqarish; Kanban Bitrix24 uslubi; maxfiylik. Egasi: "dizayn yaxshi LEKIN ishlatish qiyin, vazifa ichidagi tab RASVO").
> **Eslatma:** `.claude/worktrees/agent-*/` ostidagi nusxalar = agent scratch dir, hisobotdan CHIQARILDI. Faqat asosiy `artifacts/erp-dashboard/src` tahlil qilindi.

---

## 0. XULOSA (TL;DR)

| Mezon | Baho |
|-------|------|
| (1) Sahifa inventari | ⚠️ 2 ta route (`/kanban`, `/coordination`) + 1 ta CC ichki tab; ~43 fayl |
| (2) i18n raw-kalit / rasvo | ❌ Kanbanda `tLabel('kanban.kanban-.untitled', ...)` buzuq namespace ×7; kirill RU fallback inline; CC toza |
| (3) Dizayn token buzilishi | ❌ Kanban butunlay inline-style + hardcoded hex (pages/kanban 63 hex + 76 inline; components/kanban 53 hex). CC toza (token ishlatadi) |
| (4) Dublikat / eski sahifa | ❌ **2 ta "3-Savat" implementatsiya** (CC=real, ThreeBasketsPanel=MOCK); 4 ta alohida Kanban; `.bak.t2c` orphan |
| (5) Komponent qayta-ishlatish | ⚠️ CC=shadcn (yaxshi); Kanban=o'ziniki, ep/* shablon ishlatmaydi |
| (6) Vizyonga moslik | ❌ CC tab ichida (vizyon: alohida sahifa); maxfiylik modeli YO'Q; Bitrix24 ko'rinishi bor lekin xom |

**ENG MUHIM 3 ta topilma:**
1. ❌ **CC alohida sahifa EMAS** — `coordination?tab=baskets` tab sifatida joylashgan (vizyon A+.18 buni aniq taqiqlaydi). Egasi "vazifa ichidagi tab RASVO" degani aynan shu.
2. ❌ **2 ta "3 Savat" tizimi parallel mavjud** — biri REAL (`components/cc/CommunicationCenter.tsx`, `/api/cc/baskets/*` ga uradi), ikkinchisi SOXTA MOCK (`components/kanban/ThreeBasketsPanel.tsx`, `INITIAL_ITEMS` hardcoded, hech qachon saqlanmaydi). Har Kanban sahifa ostida soxtasi ko'rinadi.
3. ❌ **Kanban dizayn-tizim qoidasini (Qoida 21) buzadi** — to'liq `style={{ }}` inline + hardcoded hex (`#5B9BD5`, `#2D3748`, `#EF4444`...) bilan qurilgan, `var(--ep-*)` token ishlatmaydi.

---

## 1. SAHIFA INVENTARI

### Route'lar (jonli)
| Route | Komponent | Fayl | Izoh |
|-------|-----------|------|------|
| `/kanban` | `KanbanBoard` | `routes/AnalyticsRoutes.tsx:42` | Asosiy "Buyurtmalar Kanbani" |
| `/coordination` | `CoordinationPage` | `routes/DirectorRoutes.tsx:34` | Koordinatsiya + CC (tab) + 5 Kengash |
| `/hr/recruiting-kanban`, `/hr/recruiting` | `RecruitingKanban` | `AnalyticsRoutes.tsx:43`, `HRRoutes.tsx:57` | **Alohida 3-Kanban** (HR domeni) |
| `/feedback` → redirect `/kanban` | — | `AppRouter.tsx:169` | Eski alias |

❗ **CC uchun alohida route YO'Q.** `AppRouter.tsx` da `/api/cc` yoki `communication-center` route yo'q (grep tasdiqladi). CC faqat `coordination?tab=baskets` orqali ochiladi.

### Fayl soni (asosiy tree, test/`.bak` chiqarilgan)
- `pages/kanban/` — **23 fayl** (KanbanCard, KanbanColumn, ListView, GanttView, CalendarView, MyPlanView, DashboardPanel, TaskDetailSheet, RobotsDialog, FlowsDialog, TemplatesDialog, ReportsDialog, NotificationsPanel, ResourceAllocationView, DeadlineColumn, TimeTrackingWidget + hook/types)
- `pages/kanban/detail/` — **8 fayl** (ChatPanel, ChecklistTabContent, FilesTabContent, MainTabContent(+Extras/Sections/Types), ResultsTabContent)
- `components/kanban/` — **6 fayl** (BoardHeader, BoardDialogs, KanbanBoardView, KanbanViewTabs, **ThreeBasketsPanel**, types)
- `components/cc/` — **6 fayl** (CommunicationCenter, BasketColumn, NewDocumentModal, DocumentDetailModal, PinPromptModal, GlobalInboxBadge)
- `pages/Coordination*` — **6 fayl** (CoordinationPage + Dialogs/Helpers/Overview/Sections/Types)

✅ Fayllar yaxshi bo'lingan (Qoida 13 — 900 qator chegarasiga rioya, orchestrator/sections/dialogs naqsh).
⚠️ Lekin Kanban juda **tarqoq**: `pages/kanban/` + `components/kanban/` + `pages/kanban/detail/` — 3 joyga sochilgan, KanbanColumn `pages/kanban/` va `crm/` da takrorlangan (`crm/KanbanColumn.tsx` — CRM uchun alohida).

---

## 2. i18n RAW-KALIT / RASVO MATN

### ❌ Kanban — buzuq i18n namespace (translit artefakti)
`pages/kanban/kanban-types.ts` da RU tarjima bloki **7 marta** bitta buzuq kalitga ishora qiladi:
```
kanban-types.ts:52  flows: { title: tLabel('kanban.kanban-.untitled', "Потоки"), ...
kanban-types.ts:53  allocation: { title: tLabel('kanban.kanban-.untitled', "Распределение ресурсов"), ...
kanban-types.ts:60  fields: { title: tLabel('kanban.kanban-.untitled', "Заголовок"), description: tLabel('kanban.kanban-.untitled', "Описание"), ...
kanban-types.ts:63  notifications: { title: tLabel('kanban.kanban-.untitled', "Уведомления"), ...
kanban-types.ts:65  templates: { title: tLabel('kanban.kanban-.untitled', "Шаблоны"), ...
```
- ❌ `kanban.kanban-.untitled` — namespace **`kanban-`** (oxirida tire) = i18n auto-translit skripti buzgan kalit. 7 xil RU label (Потоки/Заголовок/Описание/Уведомления/Шаблоны/Распределение...) hammasi **bitta** `untitled` kalitga bog'langan → tarjima fayli bu kalitni topsa, hammasi bir xil matn chiqaradi.
- ⚠️ UZ blokida ham camelCase artefakt kalitlar: `kanban.kanban-.potoklar`, `kanban.kanban-.nomi`, `kanban.kanban-.tavsif`, `kanban.kanban-.shablonNomi`, `kanban.kanban-.xabarYozingBilanEslatish` (`kanban-types.ts:30,38,41,43,46`).

### ❌ Kirill RU matni inline fallback sifatida
`kanban-types.ts` ichida butun RU bloki **kirill harf bilan kodda** yozilgan ("Потоки", "По очереди", "Наименее занятому", "Случайно", "Соисполнители" va h.k.) — bu i18n fayliga emas, kod ichiga qotirilgan. Bu vizyon "3 til (Lotin+Kirill+Rus)" tizimiga zid: matn fayldan emas, komponentdan keladi.

### ❌ Aralash til bir qatorda (RASVO)
`pages/kanban/kanban-types.ts:30` — UZ blokida ham aralashma:
```
addFlow: "Поток qo'shish"   // "Поток" = kirill RU + "qo'shish" = lotin UZ — bitta so'zda 2 til
```

### ❌ ThreeBasketsPanel — i18n umuman YO'Q
`components/kanban/ThreeBasketsPanel.tsx` — `tLabel(`/`t("`)` chaqiruvi **0 ta** (grep: 0). Demo ma'lumotlar to'g'ridan kodda, lotin UZ:
```
ThreeBasketsPanel.tsx:51  { subject: "Yangi shartnoma loyhasi", from: "Sardor T.", ... }
ThreeBasketsPanel.tsx:52  { subject: "Moliyaviy hisobot so'rovi", from: "Nilufar R.", ... }
```
`t.baskets.*` faqat props orqali keladi, lekin kartochka MATNI hardcoded.

### ✅ CC (CommunicationCenter) — i18n toza
`components/cc/CommunicationCenter.tsx` — `useTranslation("common")` + `t("kommunikatsiyaMarkazi")`, `t("kiruvchi")`, `t("kutish")`, `t("chiquvchi")`, `t("yangiHujjat")` ishlatadi (`:62-77`). To'g'ri naqsh.
⚠️ Bitta istisno: `CommunicationCenter.tsx:88` — "24 soat qoidasi" banneri **hardcoded UZ matn** (i18n emas).

### ✅ CoordinationPage — yaxshi, lekin inline ru-tekshiruv
`CoordinationPage.tsx` `useTranslation("coordination")` + `isRu` flag bilan inline ikki tilli (`isRu ? "Обзор" : "Umumiy"` — `:222`). Ishlaydi lekin i18n fayl o'rniga inline ternary ko'p (`CoordinationPageSections.tsx:55,65-68,81,...`). Lotin+Kirill+Rus 3-til tizimiga to'liq mos emas (faqat uz/ru ternary).

---

## 3. DIZAYN TOKEN BUZILISHI (Qoida 21)

### ❌ Kanban — to'liq inline-style + hardcoded hex
**Statistika (grep):**
| Joy | hardcoded hex | `style={{ }}` inline |
|-----|---------------|----------------------|
| `pages/kanban/` | **63** (5 fayl) | **76** (6 fayl) |
| `components/kanban/` | **53** (5 fayl) | (ko'p) |

**Eng yomon fayllar:**
- `pages/kanban/KanbanCard.tsx` — 35 hex + 40 inline-style. Butun rang palitrasi kodda qotirilgan:
  - `:17-22` `PRIORITY` = `#EF4444`/`#F59E0B`/`#3B82F6`/`#22C55E` + `labelColor`/`labelBg` raw rgba
  - `:42-49` `GRADIENTS` = 6 ta `linear-gradient(135deg,#6366F1,#8B5CF6)` ... avatar gradientlari
  - `:67-73` `TAG_PALETTE` = `#7C3AED`/`#DB2777`/`#0891B2`... teg ranglari
  - `:27-30` `deadlineStyle` = `#DC2626`/`#D97706`/`#2563EB`/`#6B7280` muddat ranglari
- `pages/kanban/KanbanColumn.tsx` — 16 hex + 20 inline; `:50-55` ustun accent ranglari hardcoded (`#94A3B8`, `#3B82F6`, `#F59E0B`, `#8B5CF6`) + xususiy `hexToRgba()` helper (`:35`)
- `components/kanban/ThreeBasketsPanel.tsx` — 19 hex; neumorfizm soyalari kodda (`PANEL_SHADOW`, `COL_SHADOW`, `CARD_SHADOW` `:12-16`), `ACCENT` rang obyekti (`#5B9BD5`/`#F5C96A`/`#6DC5A0` `:19-23`), `#2D3748`/`#A0AEC0`/`#C05050` matn ranglari ko'p marta
- `pages/KanbanBoard.tsx:103` — `style={{ background: "#F0F4FF", ... }}` (asosiy fon hardcoded)
- `pages/KanbanBoardSections.tsx:57-146` — EmptyBoardState butunlay inline: `#FFFFFF`, `#5B9BD5`, `#2D3748`, `#A0AEC0`, `#718096`, `#B0BEC5` + neumorfik `boxShadow` rgba

➡️ **Bu Qoida 21 ni ochiq buzadi** ("Inline `style={{ color }}` xom rang TAQIQLANGAN; `var(--ep-*)` token ishlating"). `scripts/check-design-tokens.mjs` diff-aware bo'lgani uchun eski kod o'tib ketgan, lekin butun Kanban dizayn-tizimdan tashqarida qurilgan.

### ✅ CC + Coordination — token/semantic class ishlatadi (yaxshi)
- `components/cc/CommunicationCenter.tsx` — `text-[var(--ep-blue)]`, `text-[var(--ep-yellow)]`, `text-[var(--ep-green)]`, `text-[var(--ep-red)]` + Tailwind semantic (`bg-blue-50`, `text-muted-foreground`) (`:59,69-73,136-139`). Inline xom rang yo'q.
- `pages/Coordination*` — `text-[var(--ep-blue)]`, `var(--ep-primary)`, `var(--ep-green)`, `var(--ep-red)` + `bg-muted/30` semantic (`CoordinationPage.tsx:150-169`). `text-[#hex]`/`bg-[#hex]` grep: **0 ta**.

➡️ **Aniq nomuvofiqlik:** CC va Koordinatsiya zamonaviy token tizimida, Kanban esa eski qo'lda-rang dizaynida. Ikki xil dizayn dunyosi bitta modulда.

---

## 4. DUBLIKAT / ESKI SAHIFALAR

### ❌ DUBLIKAT #1 — "3 Savat" tizimi 2 marta (eng jiddiy)
| | REAL versiya | MOCK versiya |
|--|--------------|--------------|
| Fayl | `components/cc/CommunicationCenter.tsx` | `components/kanban/ThreeBasketsPanel.tsx` |
| Ma'lumot | `/api/cc/baskets/{summary,inbox,pending,outbox}` (`:31-48`) | `INITIAL_ITEMS` hardcoded local state (`:50-56`) |
| Saqlanadimi | ✅ HA (real backend) | ❌ YO'Q — `setItems` faqat brauzer xotirasi (`:202-203`) |
| Qayerda | CoordinationPage → tab `baskets` (`CoordinationPageSections.tsx:237`) | Har Kanban sahifa ostida (`KanbanBoard.tsx:190`) |
| Dizayn | shadcn Card, token | inline neumorfizm, hardcoded hex |
| i18n | ✅ `t(...)` | ❌ yo'q |

➡️ Bitta biznes-kontsepsiya (3 savat: Kiruvchi/Kutish/Chiquvchi) **2 xil komponentda, 2 xil dizaynda, biri soxta**. Foydalanuvchi Kanbanда soxta savatni, Koordinatsiyada esa haqiqiy savatni ko'radi — chalkashlik. Vizyon §16.1 "Reuse — yangi jadval/komponent faqat mavjud mos kelmasa" ga zid.
**Tavsiya (faqat tavsiya, bajarish egasi ruxsati bilan):** `ThreeBasketsPanel.tsx` ni Kanbandan olib tashlash; CC ni yagona 3-savat manbai qilish.

### ❌ DUBLIKAT #2 — Kanban implementatsiyalari ko'p
4 ta alohida "kanban" turi parallel:
1. `pages/KanbanBoard.tsx` (+`pages/kanban/KanbanColumn.tsx`) — asosiy vazifa kanbani
2. `pages/RecruitingKanban.tsx` (+`components/recruiting/KanbanBoardGrid.tsx`) — HR rekruting
3. `pages/crm/KanbanColumn.tsx` — CRM bitimlar (alohida ustun komp.)
4. `components/kanban/KanbanBoardView.tsx` — yana bir board view qatlam
➡️ Har biri o'z drag-drop, o'z ustun komponenti bilan. `KanbanColumn` nomi 2 joyda (`pages/kanban/` va `pages/crm/`). Umumiy kanban primitive yo'q — qayta-ishlatish past.

### ❌ ESKI/ORPHAN fayl
- `pages/kanban/GanttView.tsx.bak.t2c` — `.bak` orphan (t2c = eski translit-batch artefakti). O'lik fayl, build'ga kirmaydi lekin repodan tozalanmagan.

### ✅ @deprecated yo'q
`pages/kanban/` da `@deprecated` belgisi grep: topilmadi. Route dublikati ham yo'q (`/feedback` faqat redirect).

### ⚠️ CC komponent izohi o'zini tab deb tan oladi
`components/cc/CommunicationCenter.tsx:4-5`:
```
* Embeddable React komponenti.
* CoordinationPage ichida `<TabsContent value="baskets">` ichiga joylashadi.
```
➡️ Kodning o'zi CC ni "tab ichiga joylashadi" deb hujjatlaydi — vizyon "alohida sahifa" talabiga to'g'ridan-to'g'ri zid (quyida §6).

---

## 5. KOMPONENT QAYTA-ISHLATISH

### ✅ CC — shadcn/ui primitiv ishlatadi (yaxshi)
`CommunicationCenter.tsx` — `Card`, `Button` (`@/components/ui/*`), `BasketColumn` umumiy komp. (`:13,15`). Modal'lar (`NewDocumentModal`, `DocumentDetailModal`) ajratilgan. To'g'ri kompozitsiya.

### ✅ Coordination — sections/dialogs/helpers naqsh (yaxshi)
`CoordinationPage.tsx` orchestrator → `OverviewSection`/`DoklaSection`/`RaspoSection`/`BasketsSection`/`CouncilsSection` + dialoglar (`:22-26`). `Card`, `Tabs`, `Badge`, `EPLoader`, `EPErrorState` (ep/* shablon) ishlatadi. Toza.

### ❌ Kanban — o'z dizayn dunyosi, ep/* shablon ishlatmaydi
- `KanbanCard`, `KanbanColumn`, `ThreeBasketsPanel`, `EmptyBoardState` — hammasi xom `<div style={{}}>` bilan qurilgan, `@/components/ui/*` yoki `@/components/ep/*` (`EPCard`, `EPButton` ...) **ishlatmaydi**.
- Vizyon/Qoida 21 "Yangi sahifa = mavjud shablon (ListPage/BoardPage) + PROPS — yangi dizayn EMAS" ga zid.
- ✅ Istisno: `pages/kanban/DashboardPanel.tsx`, `ListView.tsx`, `MyPlanView.tsx`, `CalendarView.tsx`, `DeadlineColumn.tsx` — bular Tailwind semantic class (`bg-muted`, `text-primary`, `ring-primary`) ishlatadi (toza). Demak Kanban ICHIDA ham nomuvofiqlik: bir qism token-friendly, asosiy board (Card/Column/Baskets) esa xom inline.

➡️ Kanban yagona uslubda emas — bu egasi "ishlatish qiyin" hissini kuchaytiradi.

---

## 6. VIZYONGA MOSLIK (A+.18 + master-plan)

> **Eslatma:** `docs/ombor-pos-master-plan.md` da "A+.18" raqamli band TOPILMADI (grep). Master-plan asosan Ombor/P2P haqida; Kommunikatsiya markazi faqat §7.2 va §15.1 da eslatiladi. Quyida task brief'dagi A+.18 talablarini kod bilan solishtiraman.

| Vizyon talabi (A+.18 / brief) | Kod holati | Baho |
|-------------------------------|-----------|------|
| **CC alohida sahifa bo'lsin — tab'dan chiqarish** | CC `coordination?tab=baskets` tab ichida (`sidebar/constants.ts:619`, `CoordinationPageSections.tsx:237`); alohida route yo'q | ❌ BAJARILMAGAN |
| **"Vazifa ichidagi tab RASVO" (egasi)** | Koordinatsiya 5 tab: overview/dokla/raspo/baskets/councils (`CoordinationPage.tsx:220-239`) — CC eng muhim funksiya tab ichiga ko'milgan | ❌ Egasi shikoyati kodda tasdiqlanadi |
| **Kanban Bitrix24 uslubi** | KanbanCard `:76` izoh "Bitrix24 uslubi"; robotlar/oqimlar/shablonlar/vaqt-kuzatuv bor (RobotsDialog/FlowsDialog/TemplatesDialog/TimeTrackingWidget) | ⚠️ QISMAN — Bitrix-funksiya bor, lekin xom inline dizayn (§3) "ishlatish qiyin" |
| **Maxfiylik (privacy/confidentiality)** | Faqat `roleFilter` (filtr, kirish nazorati EMAS — `BoardHeader.tsx:125,248`) + "HiddenFields" (yig'iladigan UI maydon, maxfiylik emas — `MainTabContentExtras.tsx:48`). Per-card `isPrivate`/`visibility`/`canView` modeli grep: **YO'Q** | ❌ Maxfiylik modeli yo'q |
| §7.2 "ta'minotchi CC orqali so'rov yozadi" | CC `NewDocumentModal` bor (`components/cc/`); 3-savat oqimi real (`/api/cc/baskets`) | ✅ Asos bor |
| Doklad↑/Rasporyajenie↓ (ШВБ metod.) | `CoordinationPage` real CRUD (`/api/coordination/dokla`, `/rasporyazhenie`) (`:83-141`) | ✅ Ishlaydi |

### Vizyon-farq xulosasi
- ❌ **Eng katta farq:** CC alohida sahifa emas. Sidebar "Kommunikatsiya Markazi" bosilganda `coordination?tab=baskets` ochiladi — ya'ni 5-tabli sahifaning ichidagi 4-tab. Bu A+.18 va egasi "tab RASVO" shikoyatining to'g'ridan-to'g'ri sababi. CC komponenti (`components/cc/CommunicationCenter.tsx`) allaqachon mustaqil, embeddable — uni alohida route'ga chiqarish texnik jihatdan oson (komponent tayyor, faqat route + sidebar URL kerak).
- ❌ **Maxfiylik:** vizyon "maxfiylik" deydi, lekin Kanban kartalarida hech qanday ko'rinish/kirish nazorati yo'q — hamma board hamma kartani ko'radi (faqat rol bo'yicha *filtrlash* bor, *yashirish* yo'q).
- ⚠️ **Bitrix24:** funksional jihatdan Bitrix24'ga yaqin (robot/oqim/shablon/Gantt/kalendar/resurs-taqsimot), lekin xom inline dizayn + soxta 3-savat panel "dizayn yaxshi lekin ishlatish qiyin" hissini beradi.

---

## 7. TOPILMALAR RO'YXATI (fayl:satr dalili bilan)

### ❌ Yomon / yo'q
1. CC alohida sahifa emas, tab ichida — `sidebar/constants.ts:619` (`url: "coordination?tab=baskets"`), `routes/DirectorRoutes.tsx:8-10` (izoh: "baskets tab sifatida joylashadi"), `CoordinationPageSections.tsx:237`
2. 2 ta "3-Savat" (real CC vs mock ThreeBasketsPanel) — `components/cc/CommunicationCenter.tsx:29-49` vs `components/kanban/ThreeBasketsPanel.tsx:50-56,202-203`
3. ThreeBasketsPanel soxta (hech narsa saqlamaydi, hardcoded ism) — `ThreeBasketsPanel.tsx:51-56`
4. Kanban hardcoded hex + inline-style (Qoida 21) — `KanbanCard.tsx:17-73`, `KanbanColumn.tsx:35-55`, `KanbanBoardSections.tsx:57-146`, `KanbanBoard.tsx:103`, `ThreeBasketsPanel.tsx:12-23`
5. Buzuq i18n namespace `kanban.kanban-.untitled` ×7 — `kanban-types.ts:52,53,60,63,65`
6. Kirill RU matni kodga qotirilgan + aralash til — `kanban-types.ts:30 ("Поток qo'shish")`, `:52-65`
7. Maxfiylik/ko'rinish nazorati yo'q — grep `isPrivate|visibility|canView` = 0 (`pages/kanban/`)
8. `.bak.t2c` orphan fayl — `pages/kanban/GanttView.tsx.bak.t2c`

### ⚠️ Tuzatish kerak
9. Kanban 3 papkaga tarqoq + `KanbanColumn` 2 nusxa — `pages/kanban/KanbanColumn.tsx` + `pages/crm/KanbanColumn.tsx`
10. 4 ta alohida Kanban (vazifa/rekruting/CRM/boardview) — qayta-ishlatish past
11. CC "24 soat" banneri hardcoded UZ — `CommunicationCenter.tsx:88`
12. Coordination i18n inline `isRu` ternary (3-til tizimiga to'liq mos emas) — `CoordinationPage.tsx:222`, `CoordinationPageSections.tsx:55-68`
13. Kanban ichida ham dizayn nomuvofiq (DashboardPanel/ListView token-friendly, Card/Column xom) — `KanbanCard.tsx` vs `DashboardPanel.tsx:83`

### ✅ Yaxshi
14. CC token + shadcn ishlatadi — `CommunicationCenter.tsx:59,69-73,136-139`
15. Coordination real CRUD (dokla/raspo) + ep/* shablon — `CoordinationPage.tsx:83-141`
16. CC real backend (`/api/cc/baskets/*`) + 30s refetch — `CommunicationCenter.tsx:31-48`
17. Fayllar Qoida 13 ga muvofiq bo'lingan (orchestrator/sections/dialogs)
18. @deprecated / route-dublikat yo'q

---

## 8. UMUMIY BAHO

**Kanban:** funksional boy (Bitrix24-yaqin: robot/oqim/shablon/Gantt/kalendar/resurs), LEKIN (a) butunlay dizayn-tizimdan tashqarida (inline hex), (b) i18n buzuq (`kanban-.untitled`), (c) ostida soxta 3-savat panel osilgan, (d) maxfiylik yo'q. Egasining "dizayn yaxshi lekin ishlatish qiyin" bahosi kodda ko'rinadi: ko'rinish ko'p, lekin uslub xom va nomuvofiq.

**Kommunikatsiya Markazi (CC):** kod sifati yaxshi (token, shadcn, real API, i18n), LEKIN vizyonga zid joyda — Koordinatsiya sahifasining 4-tabi ichida ko'milgan. Komponent allaqachon mustaqil/embeddable, shuning uchun alohida sahifaga chiqarish past xarajatli o'zgarish bo'lardi (texnik to'siq yo'q — faqat route + sidebar). Bu egasining "tab RASVO" shikoyatining aniq manbai.

**Eng katta arxitektura qarzi:** bitta "3 savat" kontsepsiyasi 2 marta (real + soxta), 2 xil dizaynda yozilgan — birini tanlab, ikkinchisini olib tashlash kerak (egasi ruxsati bilan).

---

*Hisobot READ-ONLY kod-skan asosida. Brauzer-vizual qatlam (login + ekran) asosiy sessiya tomonidan alohida qo'shiladi. Hech qanday kod/fayl o'zgartirilmadi.*
