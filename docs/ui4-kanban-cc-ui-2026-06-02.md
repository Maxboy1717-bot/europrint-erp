# UI-4 — KANBAN + KOMMUNIKATSIYA (CC) UI tahlili (2026-06-02)

> **FAQAT TAHLIL (read-only)** — hech bir fayl o'zgartirilmadi. Brauzer ishlatilmadi —
> faqat kod (FE `artifacts/erp-dashboard/src` + BE `apps/api/src` + `apps/api/drizzle`).
> Manba vizyon: `docs/ombor-pos-master-plan.md` + `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`.

---

## 1. KANBAN — inventarizatsiya + hukm

### 1.1 Route'lar
| Route | Komponent | Manba |
|---|---|---|
| `/kanban` | `KanbanBoard` (lazy) | `routes/AnalyticsRoutes.tsx:20,42` |
| `/hr/recruiting-kanban` | `RecruitingKanban` | `routes/AnalyticsRoutes.tsx:21,43` |
| `/hr/recruiting` | `RecruitingKanban` | `routes/HRRoutes.tsx:57` |
| `/feedback` → redirect `/kanban` | — | `routes/AppRouter.tsx:169` |
| (CRM ichida) `pages/crm/KanbanColumn.tsx` | CRM voronka ustuni | sotuv pipeline |

Asosiy "Bitrix-uslubi" doska = **`/kanban`** (`pages/KanbanBoard.tsx`, 234 qator).

### 1.2 Asosiy fayllar
- `pages/KanbanBoard.tsx` — orkestrator (state + hooklar + shell)
- `pages/KanbanBoardSections.tsx` — view-switcher (8 ko'rinish)
- `hooks/useKanbanBoard.ts` (+ `.state` / `.mutations` / `.drag`) — biznes-mantiq
- `hooks/use-kanban-dnd.ts`, `hooks/use-kanban-realtime.ts` — drag-drop + realtime
- `components/kanban/` — `BoardHeader`, `KanbanBoardView`, `KanbanViewTabs`, `BoardDialogs`, **`ThreeBasketsPanel`**, `types.ts`
- `pages/kanban/` — `TaskDetailSheet`, `KanbanCard`, `ListView/GanttView/CalendarView/MyPlanView/...`, `RobotsDialog`, `FlowsDialog`, `TemplatesDialog`, `ReportsDialog`, `detail/ChatPanel` va h.k.

### 1.3 Wired yoki stub?
**WIRED — to'liq funksional dvigatel.** `useKanbanBoard.ts` real endpointlarga ulangan:
- `GET /api/kanban/boards` (ro'yxat) · `GET /api/kanban/boards/:id` (ustun+karta)
- `GET /api/kanban/employees` · `GET /api/kanban/templates`
- `GET /api/kanban/notifications/unread-count`
- Mutatsiyalar (`useKanbanBoard.mutations.ts`): board/column/card CREATE/UPDATE/DELETE/MOVE, quick-start.

**Drag-drop:** ✅ HAQIQIY — `@dnd-kit/core` (`PointerSensor` distance 8, `KeyboardSensor`),
`buildDragHandlers` → `moveCardMutation` (`useKanbanBoard.ts:172-180`). Karta ko'chirilganda DB ga PATCH.

**8 ko'rinish** (`KanbanBoardSections.tsx:211-316`): Kanban / List / Deadlines / Calendar / Gantt / MyPlan / Dashboard / Allocation.

**Ustunlar konfiguratsiyasi:** ✅ — ustun qo'shish (`showAddColumn` → `createColumnMutation`), o'chirish
(`deleteColumnMutation`), "Yangi doska" (super_admin), "Europrint tezkor boshlash" (`quickStartMutation`,
avtomatik 4 ustun: Kiruvchi/Rejada/Jarayonda/Yakunlangan — `KanbanBoardSections.tsx:146`).

### 1.4 Maxfiylik / Approval-chain — ⚠️ UI'da YO'Q
- **Privacy filtri faqat KOSMETIK.** `BoardHeader.tsx:248-266` da "Rol filtri" dropdown bor
  (`all` / `executor` / `creator`), `roleFilter` state'da saqlanadi (`useKanbanBoard.state.ts:58`),
  **lekin `filteredCards` useMemo'da hech qachon ishlatilmaydi** (`useKanbanBoard.ts:95-113` — faqat
  search/priority/assigneeId/overdue filtrlaydi). Ya'ni dropdown tanlash kartalarni filtrlamaydi.
  → "oddiy xodim faqat o'zinikini ko'radi" maxfiyligi **UI darajasida YO'Q**.
- **Approval-chain (tasdiq zanjiri) doskada YO'Q.** Kanban kartasida (`TaskDetailSheet`) tab'lar:
  Asosiy / Checklist / Fayllar / Natija / Chat — tasdiq-zanjiri ustuni yoki imzo bosqichi yo'q.
  Approval-chain faqat **CC modulida** (PIN imzo) mavjud, Kanban'da emas.

### 1.5 Test-axlat data
- ⚠️ "Salom / savol / 1231322 / Nima" kabi ustun/karta nomlari — bu **kod yoki DB-seed emas**,
  jonli DB'da test foydalanuvchi qo'lda yaratgan qatorlar (asl-holat hisobotidagi brauzer kuzatuvi
  bilan mos). FE/seed'da hardcoded emas. (Kodda "Salom/savol" mosliklari faqat aloqasiz test-savol
  dialoglarida: `AddQuestionDialog.tsx` va h.k.)

**HUKM (Kanban):** Dvigatel **ISHLAYDI** (~drag-drop + 8 view + CRUD + realtime) ✅, lekin
**maxfiylik UI darajasida yo'q** (rol filtri ulanmagan) ❌ va **approval-chain doskada yo'q** ❌.
Doskada `<ThreeBasketsPanel>` — **mock** (1.6 ga qarang).

### 1.6 Kanban ichidagi 3-Savat panel = MOCK ❌ (eng muhim aniqlanish)
`pages/KanbanBoard.tsx:190` → `<ThreeBasketsPanel t={t} />`.
`components/kanban/ThreeBasketsPanel.tsx:50-56` da **hardcoded `INITIAL_ITEMS`**:
"Yangi shartnoma loyhasi" (Sardor T.), "Moliyaviy hisobot so'rovi" (Nilufar R.), "QC tekshirish
natijasi" (Bobur X.), "Yangi uskunalar buyurtma" (Jasur K.), "HR bo'limiga hisobot" (Lola Y.).
**Hech qanday `useQuery`/`apiRequest` yo'q** — `useState(INITIAL_ITEMS)` + `moveItem` faqat local
state'ni o'zgartiradi (DB ga bormaydi). Bu **soxta demo** — haqiqiy CC (`/coordination?tab=baskets`)
bilan bog'lanmagan.

---

## 2. KANBAN — Vizyon → UI jadvali

| Vizyon nuqtasi (Bitrix-style) | UI holati | Dalil |
|---|---|---|
| Board columns + drag-drop | ✅ | `@dnd-kit`, `buildDragHandlers`→`moveCardMutation` (`useKanbanBoard.ts:172`) |
| Ustunlar konfiguratsiyalanadi | ✅ | add/delete column mutatsiyalari; quick-start 4 ustun |
| Ko'p ko'rinish (List/Gantt/Calendar...) | ✅ | 8 view (`KanbanBoardSections.tsx:211-316`) |
| super_admin doska yaratadi/sozlaydi | ✅ | "Yangi doska" + tezkor boshlash (`KanbanBoard.tsx:133,156`) |
| Maxfiylik (kim nimani ko'radi) | ❌ | rol filtri kosmetik — `filteredCards`da ishlatilmaydi |
| Approval-chain (tasdiq ustunlari/imzo) | ❌ | `TaskDetailSheet`da imzo/zanjir tab yo'q |
| 3-Savat ↔ real CC integratsiya | ❌ | `ThreeBasketsPanel` hardcoded `INITIAL_ITEMS` (mock) |
| Bildirishnoma/realtime | ✅ (qisman) | `use-kanban-realtime.ts` + unread-count query |
| Test-axlat tozaligi | ⚠️ | jonli DB'da test qatorlar (kod toza) |

---

## 3. KOMMUNIKATSIYA (CC) — inventarizatsiya + hukm

### 3.1 Route'lar
| Route | Komponent | Manba |
|---|---|---|
| `/coordination` | `CoordinationPage` (lazy) | `routes/DirectorRoutes.tsx:10,34` |
| `/coordination?tab=baskets` | `BasketsSection` → `<CommunicationCenter/>` | `CoordinationPage.tsx:237,273` |

CC alohida sahifa EMAS — `CoordinationPage` ning "baskets" tab'i sifatida joylashgan
(`DirectorRoutes.tsx:8-9` izoh). Tablar: Umumiy / Докладлар / Распоряжения / **3-Savat** / Kengashlar.

### 3.2 Asosiy fayllar
- `pages/CoordinationPage.tsx` (297) + `CoordinationPageSections/Overview/Dialogs/Types`
- `components/cc/CommunicationCenter.tsx` (153) — **haqiqiy 3-Savat** (embed)
- `components/cc/BasketColumn.tsx` — savat ustuni
- `components/cc/NewDocumentModal.tsx` (288) — **4-qadamli AI hujjat sehrgari**
- `components/cc/DocumentDetailModal.tsx` — hujjat ko'rish + amallar
- `components/cc/PinPromptModal.tsx` (130) — **PIN imzo** (approve/reject/cancel)
- `components/cc/GlobalInboxBadge.tsx` — global inbox badge

### 3.3 Wired yoki stub?
**WIRED — to'liq real API.** Hech qanday hardcoded/mock yo'q (Kanban panelidan farqli).

`CommunicationCenter.tsx` (3-Savat):
- `GET /api/cc/baskets/summary` (30s refetch)
- `GET /api/cc/baskets/inbox` · `.../pending` · `.../outbox`
- 24-soat qoidasi banneri (`CommunicationCenter.tsx:82-91`)

`CoordinationPage.tsx` (Doklad/Raspor):
- `GET /api/coordination/dokla` · `.../rasporyazhenie` · `.../stats` · `.../baskets`
- `POST /api/coordination/dokla` · `POST .../rasporyazhenie`
- `PATCH .../rasporyazhenie/:id/done` · `.../dokla/:id/read` · `.../dokla/:id/resolved`

### 3.4 3 Savat (Savat) — ✅ HAQIQIY
3 ustun: **Kiruvchi (inbox) / Kutish (pending) / Chiquvchi (outbox)** + ortda Arxiv
(`CommunicationCenter.tsx:94-113`). Badge'lar real summary'dan; `inboxOverdue` qizil alert.

### 3.5 PIN — ✅ HAQIQIY
- Yuborishda: `NewDocumentModal.tsx:233-245` qadam 4 = PIN (`type=password`, 4-8 raqam,
  `POST /api/cc/documents/:id/send` body `{pin}`).
- Tasdiq/Rad/Bekor: `PinPromptModal.tsx` — `POST /api/cc/documents/:id/{approve|reject|cancel}`,
  PIN regex `^\d{4,8}$`, rad sababini tanlash (`GET .../rejection-reasons`), bekor uchun majburiy izoh.

### 3.6 14 hujjat turi — ✅ TASDIQLANDI
`GET /api/cc/templates` (`NewDocumentModal.tsx:59`). Manba seed `apps/api/drizzle/0006_communication_center.sql:310-394`
da **AYNAN 14 shablon**: ADVANCE, VACATION, SALARY_RAISE, IMPROVEMENT, DOKLAD, REPORT, TRAINING,
FIX_ERRORS, FINANCIAL_AID, CONTRACT_END, TRANSFER, SCHEDULE_CHANGE, ORDER, ZRS_ZVS.
Har biri `ai_questions` JSONB + `number_format` + SLA (inbox/reminder/escalation soatlari).

### 3.7 AI hujjat generatsiya UI — ✅ HAQIQIY (4 qadam)
`NewDocumentModal.tsx`:
1. **Tur tanlash** — `GET /api/cc/templates`
2. **AI intervyu** — `POST /api/cc/ai/start` → `GET /api/cc/ai/sessions/:id` →
   `POST .../answer` (savol-javob, choice/text/date/number)
3. **Ko'rib chiqish** — `POST .../finalize` → AI matn (read-only Textarea, mavzu)
4. **PIN imzolash** → `POST /api/cc/documents/:id/send`

**HUKM (CC):** **TO'LIQ WIRED + REAL** ✅ — 3 savat, PIN, 14 hujjat turi, 4-qadamli AI sehrgar,
24h qoida, Doklad↑/Raspor↓, statistika, rad-sabablari hammasi haqiqiy endpoint bilan.
Yagona kamchilik (kod emas, **data**): jonli DB'da 0 hujjat (asl-holat: `cc_documents=0`) —
"qurilgan-lekin-ishlatilmagan qobiq". UI tomondan stub yo'q.

---

## 4. CC — Vizyon → UI jadvali

| Vizyon nuqtasi | UI holati | Dalil |
|---|---|---|
| Alohida sahifa | ⚠️ | `/coordination?tab=baskets` (tab, alohida URL emas) |
| 3 Savat (Kiruvchi/Kutish/Chiquvchi) | ✅ | `CommunicationCenter.tsx:94-113` real API |
| PIN imzo | ✅ | `NewDocumentModal` qadam 4 + `PinPromptModal` (4-8 raqam) |
| 14 hujjat turi | ✅ | seed `0006_..sql:310-394` = 14 shablon; `GET /api/cc/templates` |
| AI hujjat generatsiya | ✅ | 4-qadamli sehrgar (`/api/cc/ai/start|answer|finalize`) |
| 24 soat qoidasi | ✅ | banner (`CommunicationCenter.tsx:82`) + SLA seed |
| Doklad ↑ / Rasporyajenie ↓ | ✅ | `CoordinationPage` tab + mutatsiyalar |
| Rad sababi / bekor izohi | ✅ | `PinPromptModal.tsx:88-114` |
| Haqiqiy ishlatilgan (data) | ❌ | jonli DB 0 hujjat (kod ayb emas) |

---

## 5. Test / placeholder data (ko'rinadigan)

| Joy | Holat | Dalil |
|---|---|---|
| Kanban 3-Savat panel | ❌ MOCK | `ThreeBasketsPanel.tsx:50-56` hardcoded `INITIAL_ITEMS` (5 soxta karta, useQuery yo'q) |
| "Salom/savol/1231322/Nima" ustun/karta | ⚠️ DB test-qator | kod/seed'da YO'Q — jonli DB'ga test user qo'lda kiritgan (asl-holat brauzer kuzatuvi) |
| CC 3-Savat (`CommunicationCenter`) | ✅ toza | mock yo'q, hammasi `/api/cc/baskets/*` |
| CC shablonlar | ✅ real seed | 14 shablon `0006_communication_center.sql` |

---

## 6. Tavsiyalar (faqat tavsiya — bajarish egasi ruxsatisiz EMAS, CLAUDE.md Qoida 23)

1. **Kanban `ThreeBasketsPanel` mock'ni o'chirib, real CC ga ulash** — `INITIAL_ITEMS` o'rniga
   `GET /api/cc/baskets/*` (yoki butun panelni olib tashlab, `/coordination?tab=baskets` ga link).
   Bu "soxta demo" muammosini yopadi.
2. **Kanban rol filtri (maxfiylik)ni haqiqiy qilish** — `roleFilter` ni `filteredCards`
   useMemo'ga ulash (`useKanbanBoard.ts:95`), yoki BE darajasida board-membership/owner bo'yicha
   kartalarni cheklash. Hozir dropdown ko'rinadi-yu ishlamaydi (yolg'on signal).
3. **Kanban kartaga approval-chain** — `TaskDetailSheet`ga tasdiq-zanjiri/imzo bosqichi qo'shish
   (CC PIN imzosi modelidan foydalanib), agar vizyon kartalar uchun tasdiq talab qilsa.
4. **Jonli DB'dagi Kanban test-axlat qatorlarini tozalash** ("Salom/savol/1231322") — bu data
   masalasi, kod emas; demo-tozalash skripti yoki qo'lda o'chirish.
5. **CC ni real ishlatishga undash** — 0 hujjat muammosi UI emas, foydalanish/onboarding masalasi.

---

*UI-4 tahlil 2026-06-02 — read-only (kod + seed). Hech narsa o'zgartirilmadi.*
