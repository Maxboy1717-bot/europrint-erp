# P11 — SD (Sales Distribution): SD FE OrderDetail + Maket + repeat-order + reclamation + KPI

> Bajaruvchi direktiva · Wave 4 · dependsOn: ["P10"] · ddlGate: false
> Yozildi: 2026-06-19 · Q-47 ≥1000 qator · Uzbek (lotin)

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Wave:** 4 | **dependsOn:** ["P10"] | **ddlGate:** false (FE-only paket; DDL kerak bo'lsa GATED)

**Dizayn qoidalari (Q-41/Qoida 21/Qoida 13):**
- EP Linear Soft token: `var(--ep-*)`, `var(--mod-*)` — inline hex TAQIQ
- SD modul rangi: `--ep-primary: #FF902F` (orange family)
- Shablon: `ListPage` / `DetailPage` / `FormPage` / `DashboardPage` — yangi dizayn TAQIQ
- Tab: maks 2 daraja (Q-42); 3+ TAQIQ
- Fayl ≤ 900 qator; funksiya ≤ 150 qator (Qoida 13)
- Har `useQuery` → loading holati (F1); har `useMutation` → onError handler (F2)
- Forma: REAL saqlaydi — POST/PUT → BE → DB → qayta yuklashda ko'rinadi (Q-43)

---

## 1. IZOLYATSIYA MANIFESTI

**Bu agent FAQAT quyidagi 7 faylga tegadi:**

```
artifacts/erp-dashboard/src/pages/SDOrderDetail.tsx        ← YANGI (mavjud emas)
artifacts/erp-dashboard/src/pages/SDOrderDetailTabs.tsx    ← YANGI (mavjud emas)
artifacts/erp-dashboard/src/pages/SDOrderDetailTypes.ts    ← YANGI (mavjud emas)
artifacts/erp-dashboard/src/pages/SDLostOrders.tsx         ← YANGI (mavjud emas)
artifacts/erp-dashboard/src/pages/SDCustomers.tsx          ← MAVJUD — KENGAYTIRISH (602 qator)
artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx        ← MAVJUD — KENGAYTIRISH (563 qator)
artifacts/erp-dashboard/src/pages/SDKpi.tsx                ← MAVJUD — KENGAYTIRISH (453 qator)
```

**Boshqa fayllarga tegish TAQIQ.** Agar qo'shimcha fayl kerak bo'lib qolsa (masalan, sidebar route yoki BE endpoint) — TO'XTA va egaga flag qil. Route/sidebar ro'yxatga olish P50 da amalga oshiriladi — bu agentda YO'Q.

**ddlGate:** Bu paket FE-only. DDL talab qilinmaydi chunki:
- SDOrderDetail, SDLostOrders, LeaderboardWidget — mavjud BE endpointlarga ulaning
- `sd_lost_orders` jadval yo'q → `SDLostOrders.tsx` `{ items: [], total: 0 }` fallback bilan `EPComingSoon` ko'rsatadi (Qoida 10 to'g'ri holati)
- `maket_approved` ustun yo'q → Maket tab "DDL kerak" holat xabarini ko'rsatadi, fake ma'lumot EMAS

Agar P10 (backend) natijasida yangi endpoint yoki jadval yaratilgan bo'lsa — P10 commit hashini tekshir va shu endpointlarga ulan.

---

## 2. VIZYON

### Manba hujjatlar
- `docs/audit/MUSLIMBEK-PROMT-04-SD-2026-06-08.md` — SD 7-bosqich build rejasi
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` — egasi tasdiqlagan o'zgarishlar
- `docs/XARITA-REJA-YONALISH-2026-06-07.md` — loyiha master rejasi

### Vizyon xulosasi

**SD = T1 oltin-ip moduli.** Bitta `sales_order.id` pastki oqimdagi har bir yozuvni belgilaydi: TZ → material → ishlab chiqarish → yetkazib berish → to'lov → GL (24 000 mijoz, 20 yillik takroriy buyurtmalar).

**7 build bosqich:**
1. Ph1: Mijoz CRUD + ABC
2. Ph2: Kotirovka (KP) hayot sikli + PDF
3. Ph3: Buyurtma holat mashina + oltin-ip voqealari
4. Ph4: Narx formulasi + mahsulot katalogi
5. Ph5: To'lov + debitor + yetkazib berish + GL
6. Ph6: Savdo KPI + leaderboard + hisobotlar
7. Ph7: Shartnomalar + reklamatsiya + arxiv

**Egasi tasdiqlagan maxsus qoidalar (OVERRIDE):**
- **EP-SD-033**: Priklad % — mahsulot turi bo'yicha (har turda o'z %, master-data) ⏸ **DEFERRED (P09/P10 da ham qoldirilgan — PP/MES bilan birgalikda)**
- **EP-SD-042/125**: Klishe/shtamp — mijoz bir marta to'laydi → zavodda saqlanadi (~3 yil, keyin ogohlantirish)
- **EP-SD-069**: Bekor qilish jarimasi — bosqichli: maket 30% / bosma 70% / tayyor 100% (sozlanuvchi %)
- **EP-SD-068**: Tiraj og'ish — ±N% mumkin; hisob real chiqqan miqdordan. **EGASI QIYMATI KERAK** (N% ni egasi master-data orqali belgilaydi). FE: `BuyurtmaTab` da `orderedQty / actualQty / tolerancePercent / deviationStatus` ko'rsatiladi.
- **EP-SD-076**: source_channel = **master-data lookup** (`sd_source_channel_lookup`). FE create-order forma: dropdown `sd_source_channel_lookup` dan yuklanadi — hardcode IN list TAQIQ.
- **EP-SD-056/133**: Maket tasdiqlanishi — bosma BLOKLANADI maket tasdiqlanmasdan
- **EP-SD-079/132**: O'zgartirish jurnali — har maydon o'zgarishi audit logda
- **EP-SD-024**: Yo'qotilgan buyurtmalar — `sd_lost_orders` jadval (sabab kodi bilan)
- **EP-SD-016/017**: Leaderboard — haftalik reyting, o'rin o'zgarishi strelkasi bilan
- **EP-SD-065**: Mahsulotlar arxivi mijozda — "Qayta buyurtma" bir bosish

### Qabul mezoni (har feature uchun)

| Feature | Qabul sharti |
|---------|-------------|
| SDOrderDetail 4-tab | Buyurtma/Mahsulot/Maket/Tarix — hamma tab renders; Maket tab faqat gate holat ko'rsatadi (DDL kerak); Tarix tab change_log endpointdan olinadi |
| Maket tab | `maket_approved` yo'q → "DDL kerak, P09/P10 dan keyin" xabari + EPComingSoon; fake data YO'Q |
| Repeat order button | Tugma bosilganda eski order ma'lumotlari bilan yangi order yaratish dialogi ochiladi; POST → `/api/sd/orders` → DB ga yoziladi → orderlar ro'yxati yangilanadi |
| ReclamationCreateDialog | order_id prepopuliatsiya → sabab tanlash → POST `/api/sd/reclamations` yoki `/api/qc/claims` → toast muvaffaqiyat/xato |
| SDLostOrders | GET `/api/sd/lost-orders` → agar 404/500 → EPComingSoon ko'rsatiladi; agar 200 → jadval ko'rsatiladi; CREATE dialog → POST → DB-proof |
| SDCustomers arxiv tab | Mijoz 360 ko'rinishida "Mahsulotlar arxivi" tab → GET `/api/sd/customers/:id/orders` → jadval; "Qayta buyurtma" tugma → SDSalesOrders create dialog prepopulate |
| LeaderboardWidget (SDKpi) | GET `/api/sd/kpi/team` → sort by totalSales DESC → reyting raqam + o'rin o'zgarishi belgisi; stub bo'lsa — bo'sh jadval, xato emas |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar (REAL)

**`SDSalesOrders.tsx`** — 563 qator — REAL sahifa:
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:130` — `export default function SDSalesOrders()`
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:143` — `useQuery(["/api/sd/orders", ...])` — REAL
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:155` — `useQuery(["/api/sd/orders", selected?.id])` — detail panel
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:175` — `statusMut` — PATCH `/api/sd/orders/:id/status`
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:186` — `cancelMut` — PATCH `/api/sd/orders/:id/cancel`
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:193` — `createMut` — POST `/api/sd/orders`
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:285` — split panel: chap (ro'yxat) + o'ng (detail)
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:310` — detail panel: status badge + summary cards + timeline + payments
- **MUAMMO**: Detail panel — to'liq sahifa emas, side-panel. Vizyonda `OrderDetailPage` 4-tab bilan alohida sahifa kerak (EP-SD-056/079/132). Hozirgi panel Maket tab va Tarix (change journal) ni ko'rsatmaydi.
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx:358` — `cancelMut` — `prompt()` ishlatadi ❌ (Qoida 14: ConfirmDialog kerak)

**`SDCustomers.tsx`** — 602 qator — REAL sahifa:
- `artifacts/erp-dashboard/src/pages/SDCustomers.tsx:102` — `export default function SDCustomers()`
- `artifacts/erp-dashboard/src/pages/SDCustomers.tsx:176` — 360 query — GET `/api/sd/customers/:id/360`
- `artifacts/erp-dashboard/src/pages/SDCustomers.tsx:122` — `tab360` state: `"orders" | "contacts"` — faqat 2 tab
- **MUAMMO**: 360 ko'rinishda "Mahsulotlar arxivi" tab YO'Q (EP-SD-065). Faqat `orders` va `contacts` bor.
- **MUAMMO**: "Qayta buyurtma" tugma YO'Q (EP-SD-065/135).

**`SDKpi.tsx`** — 453 qator — REAL sahifa:
- `artifacts/erp-dashboard/src/pages/SDKpi.tsx:104` — `useQuery(["/api/sd/kpi/team", year, month])` — REAL
- `artifacts/erp-dashboard/src/pages/SDKpi.tsx:129` — `useQuery(["/api/sd/kpi-targets"])` — REAL (lekin BE stub)
- `artifacts/erp-dashboard/src/pages/SDKpi.tsx:256` — team KPI jadval — sort by totalSales DESC
- **MUAMMO**: `LeaderboardWidget` YO'Q — haftalik reyting, o'rin o'zgarishi strelkasi ko'rsatilmaydi (EP-SD-016/017)
- **MUAMMO**: KPI target qayta yuklash stub — `getKpiTargets()` BE da `Ok([])` qaytaradi (broken/fake)

### 3.2 Mavjud bo'lmagan fayllar (MISSING)

```
artifacts/erp-dashboard/src/pages/SDOrderDetail.tsx      ← YO'Q
artifacts/erp-dashboard/src/pages/SDOrderDetailTabs.tsx  ← YO'Q
artifacts/erp-dashboard/src/pages/SDOrderDetailTypes.ts  ← YO'Q
artifacts/erp-dashboard/src/pages/SDLostOrders.tsx       ← YO'Q
```

### 3.3 Buzuq / Soxta (BROKEN/FAKE)

| Fayl:qator | Muammo | Tur |
|------------|--------|-----|
| `SDSalesOrders.tsx:358` | `prompt()` bekor qilish sababi uchun — Qoida 14 buzilishi | BROKEN |
| `SDKpi.tsx:129..140` | `kpi-targets` query → BE `Ok([])` stub qaytaradi | FAKE (BE) |
| `SDCustomers.tsx:122` | `tab360`: faqat `"orders"\|"contacts"` — `"archive"` tab yo'q | MISSING |
| `SDSalesOrders.tsx:310..388` | Detail panel = side panel, 4-tab sahifa EMAS | MISSING |

### 3.4 BE endpoint holati (P10 ga bog'liq)

P10 dan keyin mavjud bo'lishi kutilgan endpointlar:

| Endpoint | Holat | Izoh |
|---------|-------|------|
| `GET /api/sd/orders/:id` | REAL (P10) | detail ma'lumot |
| `GET /api/sd/orders/:id/change-log` | P10 da bo'lmasa — 404 fallback | EP-SD-079 |
| `GET /api/sd/customers/:id/orders` | REAL (P10 yoki P01) | arxiv uchun |
| `POST /api/sd/orders` (repeat) | REAL (mavjud) | Qayta buyurtma |
| `GET /api/sd/lost-orders` | P10 da bo'lmasa — 404 fallback | EP-SD-024 |
| `POST /api/sd/lost-orders` | P10 da bo'lmasa — GATED | EP-SD-024 |
| `POST /api/sd/reclamations` yoki `/api/qc/claims` | P10/P07 | EP-SD-081/134 |
| `GET /api/sd/kpi/team` | REAL (mavjud) | leaderboard uchun |
| `GET /api/sd/kpi-targets` | REAL route, STUB data | getKpiTargets() Ok([]) |

---

## 4. ISH (qadam-baqadam)

> **BOSHLASHDAN OLDIN:** `git status` + `git log -5` + P10 commit'i tekshir (P10 qaysi endpointlarni qo'shdi?). Keyin faqat owned fayllar bilan ish boshlang.

---

### QADAM 1 — SDOrderDetailTypes.ts yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDOrderDetailTypes.ts`
**Holat:** Mavjud emas → YANGI YARATISH

Bu fayl barcha type definitsiyalar, konstantalar va enum-larni saqlaydi. SDOrderDetail.tsx va SDOrderDetailTabs.tsx shu fayldan import qiladi.

```typescript
// artifacts/erp-dashboard/src/pages/SDOrderDetailTypes.ts
// SD OrderDetail sahifasi uchun barcha type definitsiyalar
// EP-SD-031/054/056/079/132/133 — buyurtma maydonlari va holat mashina

export type OrderTabId = "buyurtma" | "mahsulot" | "maket" | "tarix";

export interface OrderDetailData {
  id: string;
  documentNumber: string;
  moduleStatus: string;
  overallStatus: string;
  totalValue: number;
  advancePaidAmount: number;
  balanceDueAmount: number;
  requestedDeliveryDate: string | null;
  promisedDeliveryDate: string | null;
  deliveryAddress: string | null;
  currency: string;
  // EP-SD-076 manbai-kanal
  sourceChannel: string | null;
  // EP-SD-098 papka nomeri
  papkaNumber: string | null;
  // EP-SD-099 zakaz 1S
  zakaz1s: string | null;
  // EP-SD-102 yo'nalish
  direction: "ofset" | "flekso" | null;
  // EP-SD-105 davalcheskoe material
  isDavalcheskoe: boolean;
  // EP-SD-106 fayl/trafaret havolasi
  designFileUrl: string | null;
  // EP-SD-056/133 maket tasdiqlanishi
  maketApproved: boolean;
  maketApprovedAt: string | null;
  maketApprovedBy: string | null;
  // EP-SD-068 Tiraj og'ish (Quantity Deviation) — DDL gated, NULL = hali qo'shilmagan
  orderedQuantity: number | null;
  actualQuantity: number | null;
  // EGASI QIYMATI KERAK: tolerance_percent NULL = hali belgilanmagan
  tolerancePercent: number | null;
  // 'within' | 'over' | 'under' | null
  deviationStatus: string | null;
  // Bog'liq ma'lumotlar
  customer: { id: number; title: string; name?: string } | null;
  timeline: OrderTimelineItem[];
  payments: OrderPaymentItem[];
  items: OrderLineItem[];
}

export interface OrderTimelineItem {
  id: string;
  status: string;
  note: string | null;
  createdAt: string | null;
  changedBy?: string | null;
}

export interface OrderPaymentItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  dueDate: string | null;
}

export interface OrderLineItem {
  id: string;
  productId: number | null;
  description: string;
  orderQuantity: number;
  unit: string;
  netPrice: number;
  deliveryStatus?: string | null;
}

export interface ChangeLogItem {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
  epOpCode?: string | null;
}

export interface LostOrderRow {
  id: number;
  salesOrderId: number;
  documentNumber?: string;
  reasonCategory: "narx" | "muddat" | "raqobatchi" | "sifat" | "boshqa";
  notes: string | null;
  managerId: number | null;
  lostAt: string;
  customerTitle?: string | null;
}

export interface RepeatOrderForm {
  companyId: string;
  sourceOrderId: string;
  totalAmount: string;
  currency: string;
  designFlag: boolean;
  sampleFlag: boolean;
  // Ko'chirilgan maydonlar
  papkaNumber?: string;
  direction?: string;
  sourceChannel?: string;
}

// EP-SD-024 yo'qotilgan buyurtma sabab kodlari
export const LOST_REASON_LABELS: Record<string, string> = {
  narx: "Narx yuqori",
  muddat: "Muddat mos kelmaydi",
  raqobatchi: "Raqobatchi tanlandi",
  sifat: "Sifat talabi",
  boshqa: "Boshqa sabab",
};

// EP-SD-054/100 holat makinasi
export const ORDER_STATUS_LABELS: Record<string, string> = {
  sales: "Sotuv",
  design: "Dizayn",
  tech: "Texnolog",
  pp: "Rejalashtirish",
  production: "Ishlab chiqarish",
  qc: "Sifat nazorati",
  warehouse: "Tayyor mahsulot",
  delivery: "Yetkazib berish",
  finance: "To'lov/Yopish",
  closed: "Yopilgan",
  cancelled: "Bekor qilingan",
  ozhd_syryo: "Ожд.Сырьё",
  ozhd_production: "Ожд.Производство",
};

export const ORDER_NEXT_STATUS: Record<string, string> = {
  sales: "design",
  design: "tech",
  tech: "pp",
  pp: "production",
  production: "qc",
  qc: "warehouse",
  warehouse: "delivery",
  delivery: "finance",
  finance: "closed",
};

// EP-SD-022 reklamatsiya sabab kodlari
export const RECLAMATION_REASON_LABELS: Record<string, string> = {
  rang: "Rang farqi",
  skleyka: "Yapishtirishda nuqson",
  olcham: "O'lcham mos emas",
  bosma: "Bosma sifati",
  boshqa: "Boshqa",
};
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 2 — SDOrderDetailTabs.tsx yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDOrderDetailTabs.tsx`
**Holat:** Mavjud emas → YANGI YARATISH
**Hajm maqsadi:** ≤ 900 qator

Bu fayl 4 ta tab komponentini saqlaydi: BuyurtmaTab, MahsulotTab, MaketTab, TarixTab.

```typescript
// artifacts/erp-dashboard/src/pages/SDOrderDetailTabs.tsx
// SD OrderDetail 4 tab komponenti
// EP-SD-031/056/079/132/133 — maydonlar, maket gate, change journal

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { useTranslation } from "@/lib/i18n";
import { fmt } from "@/lib/sd-helpers";
import { EPStatusPill } from "@/components/ep";
import {
  OrderDetailData, OrderLineItem, ChangeLogItem, ReclamationReasonLabels,
  ORDER_STATUS_LABELS, RECLAMATION_REASON_LABELS,
} from "./SDOrderDetailTypes";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, FileText, History, Package } from "lucide-react";
```

**BuyurtmaTab komponenti** — order asosiy ma'lumotlari:

```typescript
interface BuyurtmaTabProps {
  detail: OrderDetailData;
  onStatusAdvance: (status: string) => void;
  isPending: boolean;
}

export function BuyurtmaTab({ detail, onStatusAdvance, isPending }: BuyurtmaTabProps) {
  const { t } = useTranslation("common");
  const nextStatus = ORDER_NEXT_STATUS[detail.moduleStatus];

  return (
    <div className="space-y-4">
      {/* Moliyaviy xulosa */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/20 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {tLabel("sd.order.total", "Jami summa")}
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {fmt(detail.totalValue)} {detail.currency || "UZS"}
          </div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {tLabel("sd.order.paid", "To'langan")}
          </div>
          <div className="text-xl font-bold font-mono text-[var(--ep-green)]">
            {fmt(detail.advancePaidAmount)} {detail.currency || "UZS"}
          </div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {tLabel("sd.order.balance", "Qoldiq")}
          </div>
          <div className="text-xl font-bold font-mono text-[var(--ep-red)]">
            {fmt(detail.balanceDueAmount)} {detail.currency || "UZS"}
          </div>
        </div>
      </div>

      {/* Asosiy maydonlar */}
      <div className="bg-card rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tLabel("sd.order.details", "Buyurtma tafsilotlari")}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {detail.requestedDeliveryDate && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.deliveryDate", "Mijoz so'ragan muddat")}:</span>
              <span className="ml-2 font-medium">{detail.requestedDeliveryDate.slice(0, 10)}</span>
            </div>
          )}
          {detail.promisedDeliveryDate && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.promisedDate", "Zavod va'dasi")}:</span>
              <span className="ml-2 font-medium">{detail.promisedDeliveryDate.slice(0, 10)}</span>
            </div>
          )}
          {detail.sourceChannel && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.channel", "Manbai/kanal")}:</span>
              <span className="ml-2 font-medium">{detail.sourceChannel}</span>
            </div>
          )}
          {detail.papkaNumber && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.papka", "Papka №")}:</span>
              <span className="ml-2 font-mono font-medium">{detail.papkaNumber}</span>
            </div>
          )}
          {detail.zakaz1s && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.zakaz1s", "Заказ 1С")}:</span>
              <span className="ml-2 font-mono font-medium">{detail.zakaz1s}</span>
            </div>
          )}
          {detail.direction && (
            <div>
              <span className="text-muted-foreground">{tLabel("sd.order.direction", "Yo'nalish")}:</span>
              <span className="ml-2 font-medium capitalize">{detail.direction}</span>
            </div>
          )}
          {detail.isDavalcheskoe && (
            <div className="col-span-2">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                {tLabel("sd.order.davalcheskoe", "Давальческое материал")}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* EP-SD-068: Tiraj og'ish ko'rsatgichi (DDL gated — ustunlar yo'q bo'lsa ko'rsatilmaydi) */}
      {/* MUHIM: tolerance_percent NULL = EGASI QIYMATI KERAK — hardcode ko'rsatilmaydi */}
      {detail.orderedQuantity != null && (
        <div className="bg-card rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tLabel("sd.order.tirajOgish", "Tiraj og'ish (EP-SD-068)")}
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">
                {tLabel("sd.order.orderedQty", "Buyurtma tiraj")}
              </span>
              <span className="font-mono font-medium text-foreground">
                {detail.orderedQuantity.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {tLabel("sd.order.actualQty", "Haqiqiy tiraj")}
              </span>
              <span className="font-mono font-medium text-foreground">
                {detail.actualQuantity != null
                  ? detail.actualQuantity.toLocaleString()
                  : <span className="text-muted-foreground">—</span>}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {tLabel("sd.order.tolerance", "Tolerans")}
              </span>
              {detail.tolerancePercent != null ? (
                <span className="font-mono font-medium text-foreground">
                  ±{detail.tolerancePercent}%
                </span>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
                  {tLabel("sd.order.tolerancePending", "EGASI QIYMATI KERAK")}
                </Badge>
              )}
            </div>
          </div>
          {/* Og'ish holat badge */}
          {detail.deviationStatus && (
            <div className="pt-1">
              <Badge
                variant="outline"
                className={
                  detail.deviationStatus === "within"
                    ? "text-green-700 border-green-300 bg-green-50"
                    : detail.deviationStatus === "over"
                    ? "text-amber-700 border-amber-300 bg-amber-50"
                    : "text-red-700 border-red-300 bg-red-50"
                }
                data-testid="badge-deviation-status"
              >
                {detail.deviationStatus === "within" && tLabel("sd.deviation.within", "Tolerans ichida")}
                {detail.deviationStatus === "over" && tLabel("sd.deviation.over", "Ortiqcha tiraj")}
                {detail.deviationStatus === "under" && tLabel("sd.deviation.under", "Yetishmagan tiraj")}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Holat o'tkazish tugmasi */}
      {nextStatus && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onStatusAdvance(nextStatus)}
            disabled={isPending}
            data-testid={`btn-advance-to-${nextStatus}`}
          >
            {tLabel("sd.order.advanceTo", "Keyingiga o'tkazish")}:{" "}
            {ORDER_STATUS_LABELS[nextStatus] || nextStatus}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**MahsulotTab komponenti** — buyurtma qatorlari:

```typescript
interface MahsulotTabProps {
  items: OrderLineItem[];
  orderId: string;
  onRepeatOrder: () => void;
  isCompleted: boolean;
}

export function MahsulotTab({ items, orderId, onRepeatOrder, isCompleted }: MahsulotTabProps) {
  const rows = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tLabel("sd.order.items", "Mahsulot qatorlari")}
        </h4>
        {/* EP-SD-065/135 — Qayta buyurtma faqat tugatilgan buyurtmalarda */}
        {isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRepeatOrder}
            data-testid="btn-repeat-order"
          >
            <Package className="w-3.5 h-3.5 mr-1.5" />
            {tLabel("sd.order.repeatOrder", "Qayta buyurtma")}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border border-dashed rounded-lg">
          {tLabel("sd.order.noItems", "Mahsulot qatorlari yo'q")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                  {tLabel("sd.col.description", "Tavsif")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                  {tLabel("sd.col.qty", "Miqdor")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                  {tLabel("sd.col.unit", "Birlik")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                  {tLabel("sd.col.price", "Narx")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                  {tLabel("sd.col.total", "Jami")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item, idx) => (
                <TableRow
                  key={item.id || idx}
                  className="hover:bg-muted/40 border-none"
                  data-testid={`row-order-item-${idx}`}
                >
                  <TableCell className="py-2 px-4 font-medium text-foreground">
                    {item.description || tLabel("sd.order.noDesc", "Tavsif yo'q")}
                  </TableCell>
                  <TableCell className="py-2 px-4 font-mono text-foreground">
                    {item.orderQuantity}
                  </TableCell>
                  <TableCell className="py-2 px-4 text-muted-foreground">
                    {item.unit}
                  </TableCell>
                  <TableCell className="py-2 px-4 font-mono text-foreground">
                    {fmt(item.netPrice)}
                  </TableCell>
                  <TableCell className="py-2 px-4 font-mono font-semibold text-foreground">
                    {fmt(item.orderQuantity * item.netPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

**MaketTab komponenti** — maket tasdiqlanish darvozasi (EP-SD-056/133):

```typescript
interface MaketTabProps {
  detail: OrderDetailData;
  maketDdlReady: boolean; // P09/P10 da maket_approved ustun qo'shilganmi?
}

export function MaketTab({ detail, maketDdlReady }: MaketTabProps) {
  // Agar DDL hali tayyor bo'lmasa — aniq xabar ko'rsat, fake data EMAS
  if (!maketDdlReady) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <div className="text-sm font-medium text-foreground">
          {tLabel("sd.maket.ddlPending", "Maket tasdiqlanish funksiyasi")}
        </div>
        <div className="text-xs text-muted-foreground max-w-sm">
          {tLabel(
            "sd.maket.ddlPendingDesc",
            "Bu funksiya sales_orders jadvaliga maket_approved, maket_approved_at, maket_approved_by maydonlarini talab qiladi. P09 (DDL) bajarilgandan keyin faollashadi."
          )}
        </div>
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
          DDL: EP-SD-056/133 · P09 keyin
        </Badge>
      </div>
    );
  }

  // DDL tayyor bo'lsa — maket holat ko'rinishi
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tLabel("sd.maket.status", "Maket tasdiqlanish holati")}
        </h4>
        {detail.maketApproved ? (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <div className="text-sm font-medium text-green-700">
                {tLabel("sd.maket.approved", "Maket tasdiqlangan")}
              </div>
              {detail.maketApprovedAt && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {detail.maketApprovedAt.slice(0, 16).replace("T", " ")}
                  {detail.maketApprovedBy && ` · ${detail.maketApprovedBy}`}
                </div>
              )}
              {detail.designFileUrl && (
                <a
                  href={detail.designFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline mt-1 inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  {tLabel("sd.maket.viewFile", "Maket faylini ko'rish")}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-700">
                {tLabel("sd.maket.notApproved", "Maket tasdiqlanmagan")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tLabel("sd.maket.notApprovedDesc", "Bosma bosqichi bloklanган. Maketni tasdiqlang.")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**TarixTab komponenti** — o'zgartirish jurnali + holat tarixi (EP-SD-079/132):

```typescript
interface TarixTabProps {
  orderId: string;
  timeline: OrderDetailData["timeline"];
}

export function TarixTab({ orderId, timeline }: TarixTabProps) {
  const { data: changeLogRaw, isLoading } = useQuery({
    queryKey: ["/api/sd/orders", orderId, "change-log"],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${orderId}/change-log`),
    enabled: !!orderId,
    // 404 = endpoint yo'q (P10 tayyorlanmagan) → bo'sh array
    retry: false,
  });

  const changeLog: ChangeLogItem[] = (() => {
    if (!changeLogRaw) return [];
    if (Array.isArray(changeLogRaw)) return changeLogRaw as ChangeLogItem[];
    const d = changeLogRaw as { items?: ChangeLogItem[]; data?: ChangeLogItem[] };
    return Array.isArray(d.items) ? d.items : (Array.isArray(d.data) ? d.data : []);
  })();

  const timelineRows = Array.isArray(timeline) ? timeline : [];

  return (
    <div className="space-y-6">
      {/* O'zgartirish jurnali */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tLabel("sd.tarix.changeLog", "Maydon o'zgarishlari (EP-SD-079/132)")}
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-cl-${i}`} className="h-10 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : changeLog.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
            {tLabel("sd.tarix.noChanges", "O'zgartirish jurnali mavjud emas yoki hali to'ldirilmagan")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-none">
                  <TableHead className="text-xs py-2 px-4">{tLabel("sd.col.field", "Maydon")}</TableHead>
                  <TableHead className="text-xs py-2 px-4">{tLabel("sd.col.oldValue", "Eski qiymat")}</TableHead>
                  <TableHead className="text-xs py-2 px-4">{tLabel("sd.col.newValue", "Yangi qiymat")}</TableHead>
                  <TableHead className="text-xs py-2 px-4">{tLabel("sd.col.changedBy", "Kim")}</TableHead>
                  <TableHead className="text-xs py-2 px-4">{tLabel("sd.col.changedAt", "Qachon")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeLog.map((cl, idx) => (
                  <TableRow key={cl.id || idx} className="hover:bg-muted/40 border-none text-sm">
                    <TableCell className="py-2 px-4 font-mono text-xs text-muted-foreground">{cl.fieldName}</TableCell>
                    <TableCell className="py-2 px-4 text-[var(--ep-red)]">{cl.oldValue ?? "—"}</TableCell>
                    <TableCell className="py-2 px-4 text-[var(--ep-green)]">{cl.newValue ?? "—"}</TableCell>
                    <TableCell className="py-2 px-4">{cl.changedBy ?? "—"}</TableCell>
                    <TableCell className="py-2 px-4 text-xs text-muted-foreground">
                      {cl.changedAt?.slice(0, 16).replace("T", " ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Holat tarixi */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          {tLabel("sd.tarix.statusHistory", "Holat tarixi")}
        </h4>
        {timelineRows.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            {tLabel("sd.tarix.noTimeline", "Holat tarixi yo'q")}
          </div>
        ) : (
          <div className="space-y-3">
            {timelineRows.map((tl, idx) => (
              <div key={tl.id || idx} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1">
                  <EPStatusPill label={ORDER_STATUS_LABELS[tl.status] || tl.status} tone="info" />
                  {tl.note && (
                    <div className="text-xs text-muted-foreground mt-1">{tl.note}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {tl.createdAt?.slice(0, 16).replace("T", " ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**ReclamationCreateDialog komponenti** (EP-SD-081/134):

```typescript
interface ReclamationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderNumber: string;
  customerId?: number;
}

export function ReclamationCreateDialog({
  open, onOpenChange, orderId, orderNumber, customerId,
}: ReclamationDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");

  const reclamMut = useMutation({
    mutationFn: (body: { orderId: string; reasonCode: string; notes: string }) =>
      // EP-SD-081/134: QC moduli claims endpointiga yuborish
      apiRequest("POST", "/api/sd/reclamations", {
        salesOrderId: Number(body.orderId),
        reasonCode: body.reasonCode,
        notes: body.notes,
        customerId: customerId ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders", orderId] });
      toast({ title: tLabel("sd.reklam.success", "Reklamatsiya yaratildi") });
      onOpenChange(false);
      setReasonCode("");
      setNotes("");
    },
    onError: () =>
      toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  function handleSubmit() {
    if (!reasonCode) {
      toast({ title: tLabel("sd.reklam.noReason", "Sabab tanlang"), variant: "destructive" });
      return;
    }
    reclamMut.mutate({ orderId, reasonCode, notes });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tLabel("sd.reklam.title", "Reklamatsiya ochish")} — {orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.reklam.reason", "Sabab kodi")} *
            </Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger className="mt-1.5" data-testid="select-reklam-reason">
                <SelectValue placeholder={tLabel("sd.reklam.selectReason", "Sababni tanlang")} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECLAMATION_REASON_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.reklam.notes", "Izoh")}
            </Label>
            <Textarea
              className="mt-1.5"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={tLabel("sd.reklam.notesPlaceholder", "Muammo haqida batafsil...")}
              data-testid="textarea-reklam-notes"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tLabel("sd.cancel", "Bekor qilish")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reclamMut.isPending || !reasonCode}
              data-testid="btn-reklam-submit"
            >
              {reclamMut.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.reklam.submit", "Reklamatsiya yuborish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**RepeatOrderDialog komponenti** (EP-SD-065/135):

```typescript
interface RepeatOrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceOrder: OrderDetailData | null;
  customers: { id: number; title?: string; name?: string }[];
}

export function RepeatOrderDialog({
  open, onOpenChange, sourceOrder, customers,
}: RepeatOrderDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("UZS");

  // sourceOrder dan maydonlarni ko'chirish
  const prefilled: Partial<RepeatOrderForm> = sourceOrder
    ? {
        companyId: String(sourceOrder.customer?.id ?? ""),
        sourceOrderId: sourceOrder.id,
        papkaNumber: sourceOrder.papkaNumber ?? undefined,
        direction: sourceOrder.direction ?? undefined,
        sourceChannel: sourceOrder.sourceChannel ?? undefined,
        designFlag: false, // yangi buyurtma uchun dizayn belgisi qayta belgilanadi
        sampleFlag: false,
      }
    : {};

  const createMut = useMutation({
    mutationFn: (body: { companyId: number; totalAmount: number; currency: string; sourceOrderId?: string }) =>
      apiRequest("POST", "/api/sd/orders", {
        companyId: body.companyId,
        totalAmount: body.totalAmount,
        currency: body.currency,
        designFlag: false,
        sampleFlag: false,
        // EP-SD-135: oldingi buyurtma ID ni meta sifatida yuborish
        notes: body.sourceOrderId ? `Qayta buyurtma: ${body.sourceOrderId}` : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: tLabel("sd.repeatOrder.success", "Qayta buyurtma yaratildi") });
      onOpenChange(false);
      setTotalAmount("");
    },
    onError: () =>
      toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  function handleSubmit() {
    const amount = Number(totalAmount);
    if (!amount || amount <= 0) {
      toast({ title: tLabel("sd.order.invalidAmount", "Summa noto'g'ri"), variant: "destructive" });
      return;
    }
    const companyId = Number(prefilled.companyId);
    if (!companyId) {
      toast({ title: tLabel("sd.order.noCustomer", "Mijoz belgilanmagan"), variant: "destructive" });
      return;
    }
    createMut.mutate({
      companyId,
      totalAmount: amount,
      currency,
      sourceOrderId: prefilled.sourceOrderId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tLabel("sd.repeatOrder.title", "Qayta buyurtma")}
            {sourceOrder && ` — ${sourceOrder.documentNumber}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Mijoz — prefilled, o'qiladigan */}
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.order.customer", "Mijoz")}
            </Label>
            <div className="mt-1.5 px-3 py-2 bg-muted/40 rounded-md text-sm font-medium text-foreground">
              {sourceOrder?.customer?.title || sourceOrder?.customer?.name
                || tLabel("sd.order.unknownCustomer", "Mijoz ma'lumoti yo'q")}
            </div>
          </div>

          {/* Yangi summa */}
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.order.totalAmount", "Jami summa")} *
            </Label>
            <input
              type="number"
              className="mt-1.5 w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              placeholder="0"
              min={0}
              data-testid="input-repeat-total"
            />
          </div>

          {/* Valyuta */}
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.order.currency", "Valyuta")}
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1.5" data-testid="select-repeat-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UZS">UZS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ko'chirilgan maydonlar ko'rsatish */}
          {prefilled.papkaNumber && (
            <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
              <span className="font-medium">{tLabel("sd.order.copiedFields", "Ko'chirildi")}:</span>{" "}
              Papka №{prefilled.papkaNumber}
              {prefilled.direction && ` · ${prefilled.direction}`}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tLabel("sd.cancel", "Bekor qilish")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || !totalAmount}
              data-testid="btn-repeat-submit"
            >
              {createMut.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.repeatOrder.submit", "Buyurtma yaratish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 3 — SDOrderDetail.tsx yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDOrderDetail.tsx`
**Holat:** Mavjud emas → YANGI YARATISH
**Hajm maqsadi:** ≤ 900 qator

Bu fayl `SDSalesOrders.tsx` dagi side-panel o'rniga to'liq 4-tab DetailPage sahifasini ifodalaydi. **Diqqat:** `SDSalesOrders.tsx` dagi side-panel o'chirilmaydi (Q-46 ishlab turgan kod) — yangi sahifa sifatida yaratiladi; routing P50 da qo'shiladi.

```typescript
/**
 * @module SDOrderDetail
 * @description SD Buyurtma Tafsilotlari — 4-tab sahifa (Buyurtma/Mahsulot/Maket/Tarix)
 * EP-SD-031/056/065/079/132/133 — oltin-ip asosiy sahifasi
 * Route: /sd/orders/:id (P50 da ro'yxatga olinadi)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { useTranslation } from "@/lib/i18n";
import { fmt } from "@/lib/sd-helpers";
import { EPPageHeader, EPStatusPill } from "@/components/ep";
import { ArrowLeft, AlertTriangle, Loader2, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  OrderDetailData, OrderTabId, ORDER_STATUS_LABELS, ORDER_NEXT_STATUS,
} from "./SDOrderDetailTypes";
import {
  BuyurtmaTab, MahsulotTab, MaketTab, TarixTab,
  ReclamationCreateDialog, RepeatOrderDialog,
} from "./SDOrderDetailTabs";

// ---------------------------------------------------------------------------
// Props: orderId prop orqali yoki internal state orqali
// ---------------------------------------------------------------------------

interface SDOrderDetailProps {
  orderId: string;
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Cancel ConfirmDialog (inline — Qoida 14: prompt() TAQIQ)
// ---------------------------------------------------------------------------

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function CancelOrderDialog({ open, onOpenChange, onConfirm, isPending }: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  function handleConfirm() {
    if (!reason.trim()) {
      toast({ title: tLabel("sd.order.cancelReasonRequired", "Sabab kiriting"), variant: "destructive" });
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) setReason(""); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--ep-red)]">
            {tLabel("sd.order.cancelTitle", "Buyurtmani bekor qilish")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              {tLabel("sd.order.cancelWarning", "Bu amalni qaytarib bo'lmaydi. Bekor qilish sababi EP-SD-069 jarima hisobi uchun kerak.")}
            </span>
          </div>
          <div>
            <Label className="text-sm font-medium">
              {tLabel("sd.order.cancelReason", "Bekor qilish sababi")} *
            </Label>
            <Textarea
              className="mt-1.5"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={tLabel("sd.order.cancelReasonPlaceholder", "Sabab kiriting...")}
              data-testid="textarea-cancel-reason"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setReason(""); onOpenChange(false); }}>
              {tLabel("sd.cancel", "Qaytish")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending || !reason.trim()}
              data-testid="btn-confirm-cancel"
            >
              {isPending
                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                : <XCircle className="w-4 h-4 mr-1" />}
              {tLabel("sd.order.confirmCancel", "Ha, bekor qilish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SDOrderDetail({ orderId, onBack }: SDOrderDetailProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<OrderTabId>("buyurtma");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [reclamDialog, setReclamDialog] = useState(false);
  const [repeatDialog, setRepeatDialog] = useState(false);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<OrderDetailData>({
    queryKey: ["/api/sd/orders", orderId],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${orderId}`),
    enabled: !!orderId,
  });

  // Mijozlar (RepeatOrderDialog uchun)
  const { data: customersRaw } = useQuery({
    queryKey: ["/api/sd/customers", "dropdown"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200"),
    enabled: !!orderId,
  });
  const customers: { id: number; title?: string; name?: string }[] = (() => {
    if (!customersRaw) return [];
    if (Array.isArray(customersRaw)) return customersRaw;
    const d = customersRaw as { data?: unknown[]; items?: unknown[] };
    return Array.isArray(d.data) ? (d.data as { id: number }[]) :
           Array.isArray(d.items) ? (d.items as { id: number }[]) : [];
  })();

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const statusMut = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${orderId}/status`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders", orderId] });
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: tLabel("sd.order.statusUpdated", "Holat yangilandi") });
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) =>
      apiRequest("PATCH", `/api/sd/orders/${orderId}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders", orderId] });
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: tLabel("sd.order.cancelled", "Buyurtma bekor qilindi") });
      setCancelDialog(false);
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  // ---------------------------------------------------------------------------
  // DDL tekshirish — maket_approved mavjudligini aniqlash
  // Agar P09/P10 maket ustunlarini qo'shgan bo'lsa, detail da ko'rinadi
  // ---------------------------------------------------------------------------
  const maketDdlReady = detail !== undefined && "maketApproved" in (detail as object);

  // ---------------------------------------------------------------------------
  // Loading / Error holat
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{t("Yuklanmoqda...")}</span>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <div className="text-sm text-muted-foreground">
          {tLabel("sd.order.loadError", "Buyurtma yuklanmadi")}
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          {tLabel("sd.retry", "Qayta urinish")}
        </Button>
      </div>
    );
  }

  const isCompleted = detail.overallStatus === "COMPLETED" || detail.moduleStatus === "closed";
  const isCancelled = detail.overallStatus === "CANCELLED" || detail.moduleStatus === "cancelled";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const TABS: { id: OrderTabId; label: string }[] = [
    { id: "buyurtma", label: tLabel("sd.tab.order", "Buyurtma") },
    { id: "mahsulot", label: tLabel("sd.tab.items", "Mahsulot") },
    { id: "maket", label: tLabel("sd.tab.maket", "Maket") },
    { id: "tarix", label: tLabel("sd.tab.history", "Tarix") },
  ];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <EPPageHeader
            breadcrumb={
              <>
                {t("dashboard9")}
                <b className="text-foreground">
                  {tLabel("sd.order.detail", "Buyurtma tafsilotlari")}
                </b>
              </>
            }
            title={detail.documentNumber}
            subtitle={detail.customer?.title || detail.customer?.name || ""}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EPStatusPill
            label={ORDER_STATUS_LABELS[detail.moduleStatus] || detail.moduleStatus}
            tone={
              isCompleted ? "success" :
              isCancelled ? "danger" :
              detail.moduleStatus === "ozhd_syryo" ? "warning" : "info"
            }
          />
          {/* Reklamatsiya tugmasi — tugatilgan yoki bekor qilingan buyurtmalarda ham */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReclamDialog(true)}
            data-testid="btn-open-reklam"
          >
            {tLabel("sd.order.reklam", "Reklamatsiya")}
          </Button>
          {!isCancelled && (
            <Button
              size="sm"
              variant="outline"
              className="text-[var(--ep-red)] border-red-200 hover:bg-red-50"
              onClick={() => setCancelDialog(true)}
              data-testid="btn-cancel-order"
            >
              {tLabel("sd.order.cancel", "Bekor qilish")}
            </Button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-order-${tab.id}`}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
            {tab.id === "maket" && !detail.maketApproved && !isCancelled && !isCompleted && (
              <span className="ml-1.5 inline-flex items-center justify-center w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "buyurtma" && (
          <BuyurtmaTab
            detail={detail}
            onStatusAdvance={(status) => statusMut.mutate({ status })}
            isPending={statusMut.isPending}
          />
        )}
        {activeTab === "mahsulot" && (
          <MahsulotTab
            items={detail.items}
            orderId={orderId}
            onRepeatOrder={() => setRepeatDialog(true)}
            isCompleted={isCompleted}
          />
        )}
        {activeTab === "maket" && (
          <MaketTab
            detail={detail}
            maketDdlReady={maketDdlReady}
          />
        )}
        {activeTab === "tarix" && (
          <TarixTab
            orderId={orderId}
            timeline={detail.timeline}
          />
        )}
      </div>

      {/* Dialogs */}
      <CancelOrderDialog
        open={cancelDialog}
        onOpenChange={setCancelDialog}
        onConfirm={(reason) => cancelMut.mutate(reason)}
        isPending={cancelMut.isPending}
      />
      <ReclamationCreateDialog
        open={reclamDialog}
        onOpenChange={setReclamDialog}
        orderId={orderId}
        orderNumber={detail.documentNumber}
        customerId={detail.customer?.id}
      />
      <RepeatOrderDialog
        open={repeatDialog}
        onOpenChange={setRepeatDialog}
        sourceOrder={detail}
        customers={customers}
      />
    </div>
  );
}
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 4 — SDSalesOrders.tsx: prompt() → CancelOrderDialog (Qoida 14)

**Fayl:** `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx`
**Qator:** 358-366 — `prompt()` bekor qilish

**OLDIN** (`SDSalesOrders.tsx:358`):
```tsx
// ❌ Qoida 14 buzilishi — prompt() brauzer dialog
onClick={() => {
  const reason = prompt("Bekor qilish sababi:");
  if (reason && detail) cancelMut.mutate({ id: detail.id, reason });
}}
```

**KEYIN** — `CancelOrderDialog` state qo'shing va `prompt()` ni almashtiring:

`SDSalesOrders.tsx` da quyidagi o'zgarishlar:
1. `useState` orqali `[cancelDialogOpen, setCancelDialogOpen]` va `[cancelReason, setCancelReason]` qo'shing
2. `CancelOrderDialog` komponentini `SDOrderDetailTabs.tsx` dan import qiling (yoki inline yozing)
3. `prompt()` o'rniga `setCancelDialogOpen(true)` chaqiring

**Aniq o'zgarish — `SDSalesOrders.tsx` importlari:**
```typescript
// Qo'shing (import bloki oxiriga):
import { CancelOrderDialog } from "./SDOrderDetailTabs";
```

**Aniq o'zgarish — state (SDSalesOrders funksiya ichida, mavjud state qatorlardan keyin):**
```typescript
// Qo'shing ~142-qator dan keyin:
const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
```

**Aniq o'zgarish — bekor qilish tugmasi (~360-qator):**
```tsx
// O'CHIRING: prompt() qatori
// QO'SHING:
onClick={() => { if (detail) setCancelConfirmId(detail.id); }}
```

**Aniq o'zgarish — Dialog (JSX oxirida, boshqa dialoglar yoniga):**
```tsx
<CancelOrderDialog
  open={!!cancelConfirmId}
  onOpenChange={open => { if (!open) setCancelConfirmId(null); }}
  onConfirm={(reason) => {
    if (cancelConfirmId) cancelMut.mutate({ id: cancelConfirmId, reason });
    setCancelConfirmId(null);
  }}
  isPending={cancelMut.isPending}
/>
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 5 — SDCustomers.tsx: "Mahsulotlar arxivi" tab qo'shish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDCustomers.tsx`
**Mavjud holat:** `tab360` — `"orders" | "contacts"` (qator 122)
**Kerak:** `"orders" | "contacts" | "archive"` (EP-SD-065)

**5.1 — Type o'zgartirish** (`SDCustomers.tsx:122`):

**OLDIN:**
```typescript
const [tab360, setTab360] = useState<"orders" | "contacts">("orders");
```

**KEYIN:**
```typescript
const [tab360, setTab360] = useState<"orders" | "contacts" | "archive">("orders");
```

**5.2 — Archive query qo'shing** (360 query blokidan keyin, ~182-qatordan keyin):

```typescript
// EP-SD-065: Mahsulotlar arxivi (buyurtmalar tarixi)
const { data: archiveRaw } = useQuery({
  queryKey: ["/api/sd/customers", view360Dialog.customerId, "orders"],
  queryFn: () =>
    apiRequest("GET", `/api/sd/customers/${view360Dialog.customerId}/orders?limit=50`),
  enabled: !!view360Dialog.customerId && view360Dialog.open && tab360 === "archive",
});
const archiveOrders: { documentNumber: string; status: string; totalValue: number; createdAt: string }[] =
  (() => {
    if (!archiveRaw) return [];
    if (Array.isArray(archiveRaw)) return archiveRaw;
    const d = archiveRaw as { data?: unknown[]; items?: unknown[] };
    return Array.isArray(d.data) ? (d.data as typeof archiveOrders) :
           Array.isArray(d.items) ? (d.items as typeof archiveOrders) : [];
  })();
```

**5.3 — 360 dialog tab bar ichiga "Mahsulotlar arxivi" tab qo'shish**

360 dialog ichidagi tab bar ni toping (tab360 ishlatilgan joy). `contacts` dan keyin:

```tsx
{/* EP-SD-065 Mahsulotlar arxivi */}
<button
  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
    tab360 === "archive" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
  }`}
  onClick={() => setTab360("archive")}
  data-testid="tab-360-archive"
>
  {tLabel("sd.customers.archive", "Mahsulotlar arxivi")}
</button>
```

**5.4 — Archive tab contenti** (360 dialog ichidagi tab content):

```tsx
{tab360 === "archive" && (
  <div className="mt-4 space-y-2">
    {archiveOrders.length === 0 ? (
      <div className="text-sm text-center text-muted-foreground py-6 border border-dashed rounded-lg">
        {tLabel("sd.customers.noArchive", "Buyurtmalar tarixi yo'q")}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-none">
              <TableHead className="text-xs py-2 px-3">{tLabel("sd.col.docNum", "Buyurtma №")}</TableHead>
              <TableHead className="text-xs py-2 px-3">{tLabel("sd.col.status", "Holat")}</TableHead>
              <TableHead className="text-xs py-2 px-3">{tLabel("sd.col.total", "Summa")}</TableHead>
              <TableHead className="text-xs py-2 px-3">{tLabel("sd.col.date", "Sana")}</TableHead>
              <TableHead className="text-xs py-2 px-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archiveOrders.map((o, idx) => (
              <TableRow key={`arch-${idx}`} className="hover:bg-muted/40 border-none text-sm">
                <TableCell className="py-2 px-3 font-mono font-bold text-foreground">
                  {o.documentNumber}
                </TableCell>
                <TableCell className="py-2 px-3">
                  <EPStatusPill
                    label={ORDER_STATUS_LABELS[o.status] || o.status}
                    tone={o.status === "closed" ? "success" : "info"}
                  />
                </TableCell>
                <TableCell className="py-2 px-3 font-mono text-foreground">
                  {fmt(o.totalValue)}
                </TableCell>
                <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                  {o.createdAt?.slice(0, 10)}
                </TableCell>
                <TableCell className="py-2 px-3">
                  {/* EP-SD-065/135: Qayta buyurtma — SDSalesOrders ga yuboriladi */}
                  {(o.status === "closed" || o.status === "completed") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary"
                      onClick={() => {
                        // 360 dialogi yopiladi, foydalanuvchi SDSalesOrders sahifaga o'tadi
                        setView360Dialog({ open: false });
                        // Note: to'liq repeat-order flow SDOrderDetail.tsx da
                        toast({ title: tLabel("sd.customers.repeatHint", "Buyurtma sahifasida 'Qayta buyurtma' tugmasidan foydalaning") });
                      }}
                      data-testid={`btn-archive-repeat-${idx}`}
                    >
                      {tLabel("sd.customers.repeatOrder", "Qayta buyurtma")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
)}
```

Qo'shimcha import kerak (`SDCustomers.tsx` boshida):
```typescript
import { ORDER_STATUS_LABELS } from "./SDOrderDetailTypes";
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 6 — SDKpi.tsx: LeaderboardWidget qo'shish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDKpi.tsx`
**Muammo:** LeaderboardWidget yo'q (EP-SD-016/017)

**6.1 — Leaderboard state qo'shing** (SDKpi.tsx, mavjud state qatorlardan keyin ~96-qator):

```typescript
// EP-SD-016/017: Haftalik leaderboard
// Mavjud /api/sd/kpi/team dan olinadigan ma'lumot, haftalik reyting bilan
const [showLeaderboard, setShowLeaderboard] = useState(true);
```

**6.2 — Leaderboard qismi** (SDKpi.tsx, Team KPI Table bloki ichiga qo'shing):

Team jadval `sort((a, b) => ...)` qismi allaqachon mavjud (~256-260-qatorlar). Leaderboard shu jadvalning kengaytmasi — o'rin o'zgarishi strelkasi qo'shiladi.

**Mavjud team array** dan `prevRank` ni simulatsiya qilish uchun index ishlatamiz (haqiqiy haftalik delta P10 backendda tayyorlanishi kerak — shu sababli shu sprint da faqat rank pozitsiyasi ko'rsatiladi, strelka placeholder):

SDKpi.tsx da Team KPI Table `<TableHead>` blokiga yangi ustun qo'shish:

```tsx
// Mavjud TableHead lardan OLDIN (rank uchun):
<TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4 w-12">
  {tLabel("sd.col.rank", "O'rin")}
</TableHead>
```

Va `<TableRow>` ichiga (birinchi `<TableCell>` ni almashtirish EMAS, qo'shish):

```tsx
// Mavjud '#' cell ni kengaytirish:
<TableCell className="py-2 px-4 text-muted-foreground font-medium">
  <div className="flex items-center gap-1.5">
    <span>#{i + 1}</span>
    {/* EP-SD-017: O'rin o'zgarishi — backend haftali delta yuborguncha placeholder */}
    {i === 0 && (
      <span className="text-[var(--ep-green)] text-xs font-bold" title={tLabel("sd.kpi.topRank", "Eng yuqori o'rin")}>
        ▲
      </span>
    )}
  </div>
</TableCell>
```

**6.3 — Leaderboard widget header** (Team KPI block sarlavhasiga):

```tsx
// Mavjud h3 ga qo'shimcha:
<div className="flex items-center justify-between">
  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    {t("menejerlarReytingi")} — {tLabel("sd.kpi.leaderboard", "Leaderboard")}
  </h3>
  <Badge variant="outline" className="text-xs text-muted-foreground">
    {tLabel("sd.kpi.weekly", "Haftalik")}
  </Badge>
</div>
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 7 — SDLostOrders.tsx yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/SDLostOrders.tsx`
**Holat:** Mavjud emas → YANGI YARATISH (EP-SD-024)

```typescript
/**
 * @module SDLostOrders
 * @description Yo'qotilgan buyurtmalar ro'yxati (EP-SD-024)
 * GET /api/sd/lost-orders → agar yo'q → EPComingSoon
 * CREATE dialog → POST /api/sd/lost-orders → real DB INSERT
 * Route: /sd/lost-orders (P50 da ro'yxatga olinadi)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { tLabel } from "@/lib/i18n/tLabel";
import { useTranslation } from "@/lib/i18n";
import { fmt } from "@/lib/sd-helpers";
import { EPPageHeader, EPStatusPill } from "@/components/ep";
import { Plus, TrendingDown, AlertTriangle } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";

import { LostOrderRow, LOST_REASON_LABELS } from "./SDOrderDetailTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LostOrdersResponse {
  data: LostOrderRow[];
  total: number;
}

interface CreateLostOrderForm {
  salesOrderId: string;
  reasonCategory: string;
  notes: string;
}

const EMPTY_FORM: CreateLostOrderForm = {
  salesOrderId: "",
  reasonCategory: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SDLostOrders() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState<CreateLostOrderForm>({ ...EMPTY_FORM });

  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------

  const { data, isLoading, isError, error, refetch } = useQuery<LostOrdersResponse>({
    queryKey: ["/api/sd/lost-orders", search, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      if (search) params.set("search", search);
      return apiRequest("GET", `/api/sd/lost-orders?${params}`);
    },
    enabled: isAuthenticated === true,
    // 404 yoki 500 → endpoint yo'q → EPComingSoon ko'rsatiladi
    retry: false,
  });

  const rows: LostOrderRow[] = Array.isArray(data?.data) ? data.data : [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // -------------------------------------------------------------------------
  // Mutation
  // -------------------------------------------------------------------------

  const createMut = useMutation({
    mutationFn: (body: CreateLostOrderForm) =>
      apiRequest("POST", "/api/sd/lost-orders", {
        salesOrderId: Number(body.salesOrderId) || null,
        reasonCategory: body.reasonCategory,
        notes: body.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/lost-orders"] });
      toast({ title: tLabel("sd.lost.created", "Yo'qotilgan buyurtma qayd etildi") });
      setCreateDialog(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: () =>
      toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  function handleSubmit() {
    if (!form.reasonCategory) {
      toast({ title: tLabel("sd.lost.noReason", "Sabab tanlang"), variant: "destructive" });
      return;
    }
    createMut.mutate(form);
  }

  // -------------------------------------------------------------------------
  // Agar endpoint yo'q bo'lsa — aniq xabar (Qoida 10 / Q-40)
  // -------------------------------------------------------------------------

  const endpointMissing = isError && (
    error instanceof Error &&
    (error.message.includes("404") || error.message.includes("501") || error.message.includes("500"))
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
          breadcrumb={
            <>{t("dashboard9")}<b className="text-foreground">{tLabel("sd.lost.title", "Yo'qotilgan buyurtmalar")}</b></>
          }
          title={tLabel("sd.lost.title", "Yo'qotilgan buyurtmalar")}
          subtitle={tLabel("sd.lost.subtitle", "EP-SD-024 — Sabab tahlili")}
          actions={
            <Button
              size="sm"
              onClick={() => setCreateDialog(true)}
              data-testid="btn-add-lost"
            >
              <Plus className="w-4 h-4 mr-1" />
              {tLabel("sd.lost.add", "Qayd etish")}
            </Button>
          }
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder={tLabel("sd.lost.search", "Buyurtma qidirish...")}
        />
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          {tLabel("sd.refresh", "Yangilash")}
        </Button>
      </div>

      {/* Endpoint yo'q holat */}
      {endpointMissing ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              {tLabel("sd.lost.endpointMissing", "Backend endpoint tayyorlanmagan")}
            </div>
            <div className="text-xs text-muted-foreground max-w-sm">
              {tLabel(
                "sd.lost.endpointMissingDesc",
                "GET /api/sd/lost-orders va POST /api/sd/lost-orders endpointlari P10 (backend) da tayyorlanishi kerak. sd_lost_orders jadval + DDL = P09."
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">
              DDL: P09 · EP-SD-024
            </span>
            <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">
              BE: P10
            </span>
          </div>
          {/* CREATE dialog hali ham mavjud — egasi tekshirishi uchun */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateDialog(true)}
            data-testid="btn-add-lost-anyway"
          >
            {tLabel("sd.lost.tryAdd", "Qayd etishga urinish")}
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} className="h-12 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <TrendingDown className="w-10 h-10 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">
            {tLabel("sd.lost.empty", "Yo'qotilgan buyurtmalar yo'q")}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border/40 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                    {tLabel("sd.col.orderId", "Buyurtma")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                    {tLabel("sd.col.customer", "Mijoz")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                    {tLabel("sd.col.reason", "Sabab")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                    {tLabel("sd.col.notes", "Izoh")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                    {tLabel("sd.col.date", "Sana")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/40 border-none"
                    data-testid={`row-lost-${row.id}`}
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-foreground text-sm">
                      {row.documentNumber || `#${row.salesOrderId}`}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-foreground">
                      {row.customerTitle || "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <EPStatusPill
                        label={LOST_REASON_LABELS[row.reasonCategory] || row.reasonCategory}
                        tone={
                          row.reasonCategory === "narx" ? "warning" :
                          row.reasonCategory === "raqobatchi" ? "danger" : "neutral"
                        }
                      />
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                      {row.notes || "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                      {row.lostAt?.slice(0, 10)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={v => { if (!v) setForm({ ...EMPTY_FORM }); setCreateDialog(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tLabel("sd.lost.addTitle", "Yo'qotilgan buyurtma qayd etish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">
                {tLabel("sd.lost.orderRef", "Buyurtma ID")}
              </Label>
              <input
                type="number"
                className="mt-1.5 w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.salesOrderId}
                onChange={e => setForm(f => ({ ...f, salesOrderId: e.target.value }))}
                placeholder="Buyurtma ID kiriting"
                data-testid="input-lost-order-id"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                {tLabel("sd.lost.reason", "Sabab kodi")} *
              </Label>
              <Select
                value={form.reasonCategory}
                onValueChange={v => setForm(f => ({ ...f, reasonCategory: v }))}
              >
                <SelectTrigger className="mt-1.5" data-testid="select-lost-reason">
                  <SelectValue placeholder={tLabel("sd.lost.selectReason", "Sababni tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOST_REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">
                {tLabel("sd.lost.notesLabel", "Izoh")}
              </Label>
              <Textarea
                className="mt-1.5"
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={tLabel("sd.lost.notesPlaceholder", "Qo'shimcha ma'lumot...")}
                data-testid="textarea-lost-notes"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setForm({ ...EMPTY_FORM }); setCreateDialog(false); }}>
                {tLabel("sd.cancel", "Bekor qilish")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMut.isPending || !form.reasonCategory}
                data-testid="btn-lost-submit"
              >
                {createMut.isPending
                  ? tLabel("sd.saving", "Saqlanmoqda...")
                  : tLabel("sd.lost.submit", "Qayd etish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Tekshirish:** `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

## 5. DDL (GATED)

Bu paket FE-only. Lekin quyidagi DDL talab qilinadi va GATED — egasi ruxsatisiz ISHGA TUSHIRILMAYDI:

```sql
-- ================================================================
-- P11 GATED DDL — Egasi ruxsatisiz ISHGA TUSHIRILMAYDI
-- APPROVED: [egasi] [sana]
-- ================================================================

-- EP-SD-056/133: Maket tasdiqlanish maydonlari (sales_orders)
-- MaketTab "maketDdlReady" tekshiruvi shu ustunlarni kutadi
-- ALTER TABLE sales_orders
--   ADD COLUMN IF NOT EXISTS maket_approved BOOLEAN DEFAULT FALSE,
--   ADD COLUMN IF NOT EXISTS maket_approved_at TIMESTAMPTZ,
--   ADD COLUMN IF NOT EXISTS maket_approved_by VARCHAR(100),
--   ADD COLUMN IF NOT EXISTS maket_file_url TEXT;

-- EP-SD-024: Yo'qotilgan buyurtmalar jadvali
-- SDLostOrders.tsx "endpointMissing" tekshiruvi shu jadvalga bog'liq
-- CREATE TABLE IF NOT EXISTS sd_lost_orders (
--   id SERIAL PRIMARY KEY,
--   sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
--   reason_category VARCHAR(30) NOT NULL CHECK (reason_category IN ('narx','muddat','raqobatchi','sifat','boshqa')),
--   notes TEXT,
--   manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
--   lost_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_sales_order ON sd_lost_orders(sales_order_id);
-- CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_reason ON sd_lost_orders(reason_category);
-- CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_lost_at ON sd_lost_orders(lost_at DESC);

-- EP-SD-079/132: Buyurtma o'zgartirish jurnali
-- TarixTab /change-log endpoint shu jadvaldan o'qiydi
-- CREATE TABLE IF NOT EXISTS sd_order_change_log (
--   id SERIAL PRIMARY KEY,
--   order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
--   field_name VARCHAR(100) NOT NULL,
--   old_value TEXT,
--   new_value TEXT,
--   changed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
--   changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   ep_op_code VARCHAR(30)
-- );
-- CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_order ON sd_order_change_log(order_id);
-- CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_at ON sd_order_change_log(changed_at DESC);
```

**Muhim:** Bu SQL HOZIR ishga tushirilmaydi. Egasi tasdiqlangach, P09 migration faylida `-- APPROVED: [egasi] [sana]` bilan qo'shiladi.

---

## 6. QABUL MEZONI

Quyidagi barcha shartlar bajarilishi kerak:

### FE TypeScript
- [ ] `pnpm --filter erp-dashboard exec tsc --noEmit` → **0 xato**
- [ ] `pnpm --filter erp-dashboard run build` → **muvaffaqiyatli**

### Fayl tekshiruv
- [ ] `SDOrderDetailTypes.ts` — type va konstantalar faqat, JSX yo'q
- [ ] `SDOrderDetailTabs.tsx` — BuyurtmaTab, MahsulotTab, MaketTab, TarixTab, ReclamationCreateDialog, RepeatOrderDialog eksport qilingan
- [ ] `SDOrderDetail.tsx` — 4-tab sahifa, `orderId` prop qabul qiladi
- [ ] `SDLostOrders.tsx` — ListPage + CreateDialog, endpoint yo'q → aniq xabar
- [ ] `SDCustomers.tsx` — `tab360` uchrinchi qiymat `"archive"` qo'shilgan; `Mahsulotlar arxivi` tab mavjud
- [ ] `SDSalesOrders.tsx` — `prompt()` o'chirilgan, `CancelOrderDialog` bor
- [ ] `SDKpi.tsx` — rank ustuni va "Leaderboard" sarlavha qo'shilgan

### Real saqlash DB-proof (Q-40/Q-43)
- [ ] **ReclamationCreateDialog:** POST `/api/sd/reclamations` → 201/200 → DB da yozuv paydo bo'ladi; FE toast "Reklamatsiya yaratildi" ko'rsatadi
- [ ] **RepeatOrderDialog:** POST `/api/sd/orders` → yangi buyurtma DB da paydo bo'ladi; SDSalesOrders ro'yxati yangilanadi
- [ ] **SDLostOrders CreateDialog:** POST `/api/sd/lost-orders` (endpoint mavjud bo'lsa) → DB da `sd_lost_orders` qatori; yoki aniq xabar (404 → EPComingSoon)
- [ ] **SDCustomers arxiv tab:** GET `/api/sd/customers/:id/orders` → real javob yoki bo'sh jadval (fake data EMAS)
- [ ] **TarixTab change-log:** GET `/api/sd/orders/:id/change-log` → real javob yoki bo'sh jadval (404 → "Jurnali mavjud emas")

### Vizyon-moslik (Q-40/12 qoida)
- [ ] MaketTab — DDL yo'q holatda "DDL kerak" xabari, fake `maket_approved: true` EMAS
- [ ] SDLostOrders — endpoint yo'q holatda aniq texnik xabar + DDL/BE havolalar
- [ ] TarixTab — change_log endpoint yo'q holatda "mavjud emas" xabari, fake log EMAS
- [ ] LeaderboardWidget (SDKpi) — rank ustun va sarlavha qo'shilgan; dummy strelka placeholder (haqiqiy haftalik delta P10 BE da)

### Dizayn (Qoida 21/Q-41)
- [ ] Inline hex (`#XXXXXX`) ishlatilmagan — faqat `var(--ep-*)` tokenlar
- [ ] SD modul rangi: `--ep-primary` (orange)
- [ ] Tab maksimal 2 daraja (Q-42): SDOrderDetail → 4 tab (1-daraja faqat)

### Regressiya yo'q (Q-39/Q-46)
- [ ] `SDSalesOrders.tsx` — mavjud list + create + status ISHLASHDA davom etadi
- [ ] `SDCustomers.tsx` — mavjud list/add/edit/delete/360 ISHLASHDA davom etadi
- [ ] `SDKpi.tsx` — mavjud team table, funnel, target edit ISHLASHDA davom etadi
- [ ] `prompt()` o'chirildi, `CancelOrderDialog` uni to'liq almashtirdi

### Oltin-ip regressiya yo'q
- [ ] POST `/api/sd/orders` (repeat) → mavjud endpoint ishlaydi
- [ ] PATCH `/api/sd/orders/:id/status` → mavjud endpoint ishlaydi
- [ ] PATCH `/api/sd/orders/:id/cancel` → mavjud endpoint ishlaydi

---

## 7. SELF-VERIFY

Quyidagi buyruqlarni tartibda bajaring:

### 7.1 TypeScript tekshiruv
```bash
# FE TypeScript — 0 xato bo'lishi kerak
pnpm --filter erp-dashboard exec tsc --noEmit

# FE build
pnpm --filter erp-dashboard run build
```

### 7.2 Reviewer skriptlar
```bash
# Array.isArray tekshiruv — 0 FAIL
bash scripts/reviewer-array-safety.sh

# as unknown stub tekshiruv
bash scripts/reviewer-as-unknown.sh

# Barcha reviewerlar
bash scripts/run-all-reviewers.sh
```

### 7.3 DB-proof (jonli tekshiruv)

**Test 1 — Repeat order:**
```bash
# 1. Mavjud buyurtma ID ni oling
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/sd/orders?limit=1

# 2. RepeatOrderDialog orqali yangi buyurtma yarating (FE dan)

# 3. Yangi buyurtma DB da paydo bo'lganini tekshiring
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/sd/orders?limit=5" | jq '.data[0]'
```

**Test 2 — Reclamation:**
```bash
# Reklamatsiya endpoint mavjudligini tekshiring
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"salesOrderId": 1, "reasonCode": "rang", "notes": "Test reklamatsiya"}' \
  http://localhost:3030/api/sd/reclamations

# Javob: 201 (muvaffaqiyat) yoki 501 (endpoint yo'q — SDOrderDetailTabs.tsx da toast ko'rsatiladi)
```

**Test 3 — Lost orders:**
```bash
# Endpoint mavjudligini tekshiring
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/sd/lost-orders

# Javob: 200 (mavjud) → SDLostOrders jadval ko'rsatadi
# Yoki: 404/501 → SDLostOrders "Backend endpoint tayyorlanmagan" xabari ko'rsatadi
```

**Test 4 — Customer orders archive:**
```bash
# Mijoz buyurtmalari arxivi
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/sd/customers/1/orders?limit=10"
# Javob: 200 + data array → SDCustomers "Mahsulotlar arxivi" tabida ko'rsatiladi
```

**Test 5 — Change log:**
```bash
# Buyurtma o'zgartirish jurnali
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3030/api/sd/orders/1/change-log"
# Javob: 200 (mavjud) yoki 404 (yo'q → TarixTab bo'sh jadval)
```

**Test 6 — CancelDialog (Qoida 14 fix):**
```bash
# SDSalesOrders sahifasida buyurtma tanlang
# "Bekor qilish" tugmasini bosing
# → prompt() EMAS, Dialog ochilishi kerak
# → Sabab matnini kiriting
# → "Ha, bekor qilish" → PATCH /api/sd/orders/:id/cancel
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test bekor qilish"}' \
  http://localhost:3030/api/sd/orders/1/cancel
```

### 7.4 Vizyon tekshiruv (Q-40)

```bash
# MaketTab DDL holat — sales_orders da maket_approved ustun bormi?
# (Docker postgres bilan)
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND column_name LIKE 'maket%';"

# Natija: 0 qator → MaketTab "DDL kerak" ko'rsatadi ✓
# Natija: maket_approved qator → MaketTab real holat ko'rsatadi ✓
```

---

## 8. COMMIT

**Muhim:** `git add -A` TAQIQ. Faqat aniq owned fayllar.

```bash
# QADAM 1 — Yangi fayllar
git add artifacts/erp-dashboard/src/pages/SDOrderDetailTypes.ts
git add artifacts/erp-dashboard/src/pages/SDOrderDetailTabs.tsx
git add artifacts/erp-dashboard/src/pages/SDOrderDetail.tsx
git add artifacts/erp-dashboard/src/pages/SDLostOrders.tsx

git commit -m "feat(sd-fe): add SDOrderDetail 4-tab page, SDLostOrders, ReclamationDialog, RepeatOrderDialog [EP-SD-056/065/079/081/132/133/134]"

# QADAM 2 — Mavjud fayllar o'zgartirish
git add artifacts/erp-dashboard/src/pages/SDCustomers.tsx
git add artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx
git add artifacts/erp-dashboard/src/pages/SDKpi.tsx

git commit -m "feat(sd-fe): add customer archive tab, fix cancel prompt->dialog, add leaderboard header [EP-SD-024/065/016/017]"
```

**Commit format:** `feat(sd-fe): <nima bajariJdi> [EP-SD-###]`
- Har commit = bitta mantiqiy guruh
- Birinchi commit: yangi fayllar
- Ikkinchi commit: mavjud fayllar

---

## QO'SHIMCHA ESLATMALAR

### Nima qilinmaydi (P50 ga qoldirildi)
- Route/sidebar ro'yxatga olish (`SDOrderDetail`, `SDLostOrders` routelari)
- App.tsx yoki router.tsx o'zgartirish
- BE endpoint yaratish (P10 da)
- DDL migration ishga tushirish (P09 da)

### Nima flag qilingan (egaga xabar berish kerak)
- `SDOrderDetail.tsx` route (`/sd/orders/:id`) P50 da qo'shilishi kerak
- `SDLostOrders.tsx` route (`/sd/lost-orders`) P50 da qo'shilishi kerak
- `ReclamationCreateDialog` — POST `/api/sd/reclamations` endpoint P10 da tayyorlanishi kerak; agar P10 da yo'q bo'lsa — toast "501 Endpoint tayyorlanmagan" ko'rsatiladi
- `maket_approved` DDL — egasi ruxsati bilan P09 migration da

### Edge-holatlar
- `RepeatOrderDialog`: mijoz ID yo'q → toast "Mijoz belgilanmagan", form submit BLOKLANADI
- `ReclamationCreateDialog`: sabab tanlanmagan → toast "Sabab tanlang", submit BLOKLANADI
- `SDLostOrders`: endpoint 500 qaytarsa → "Backend endpoint tayyorlanmagan" xabari
- `TarixTab`: `/change-log` 404 → "Jurnali mavjud emas" — xato toast EMAS
- `MaketTab`: `maket_approved` ustun yo'q → "DDL kerak" panel — `maketApproved: true` fake data EMAS (Q-40)
- `SDCustomers` arxiv: `/customers/:id/orders` 404 → bo'sh jadval — xato toast EMAS

### Array.isArray qoidasi (Qoida 2)
Har `map()`/`filter()` dan oldin `Array.isArray()` tekshiruvi. Barcha yangi fayllar bu qoidaga rioya qiladi. Agar reviewer `reviewer-array-safety.sh` FAIL ko'rsatsa — darhol tuzatiladi.

---

*P11 direktiva yakunlandi · Q-47 ≥1000 qator · Wave 4 · 2026-06-19*
