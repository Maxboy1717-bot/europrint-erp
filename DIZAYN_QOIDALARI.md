# EUROPRINT ERP — DIZAYN QOIDALARI (EP Design System)

> **Yagona dizayn tizimi.** Butun tizimda **bitta, bir xil** dizayn ishlatiladi — **har xil dizayn TAQIQLANGAN.**
> Kanonik manba: `artifacts/erp-dashboard/src/components/ep/` — EPPageHeader, EPKpiCard, EPCard, EPStatusPill, EPSkeleton*, EPErrorState, EPEmptyState.
> Estetika: **EP Linear Soft** · Brand **#FF902F** (issiq to'q sariq-to'q sariq) · Inter font · Modul-ranglar.
> Stack: React 19 + Vite + shadcn/ui + Tailwind CSS + CSS o'zgaruvchilari (token-based).
> Agent har UI ishida **shu hujjatga qaraydi** — [LOYIHA_QOIDALARI.md](LOYIHA_QOIDALARI.md) QISM 8 bilan.

---

## 0. ASOSIY QOIDALAR (buzilmas)

| # | Qoida |
|---|-------|
| D-1 | Faqat **token** (`var(--ep-*)`, `var(--mod-*)`) — xom rang (`#...`, `rgb()`) TAQIQ |
| D-2 | Faqat EP komponentlar — boshqa dizayn sistemi yoki bespoke komponent TAQIQ |
| D-3 | Har yangi sahifa: `EPPageHeader` + `space-y-6` root + EP komponentlar |
| D-4 | AppShell allaqachon `p-4 lg:p-6` + `overflowY:auto` beradi — sahifa root `space-y-6` XOLOS |
| D-5 | Status rangi **semantik** (success/warn/danger/info) — rangning o'zi emas, semantikasi muhim |
| D-6 | Bitta ekran — bitta vazifa; ortiqcha maydon yo'q |
| D-7 | loading/error/empty — HAR sahifada MAJBURIY |
| D-8 | i18n: hardcoded matn TAQIQ; faqat `t('key')` |
| D-9 | Destructive amal → `AlertDialog` (shadcn) tasdiq |
| D-10 | Qorong'i/yorug' tema: CSS o'zgaruvchilari orqali (token) |

---

## 1. RANGLAR (CSS tokens)

### 1.1 Global tokenlar (`--ep-*`)

| Token | Qiymat | Ishlatish |
|-------|--------|-----------|
| `--ep-primary` | `#FF902F` | ⭐ Brand asosiy, CTA, faol holat (**ORANGE** — blue EMAS!) |
| `--ep-primary-hover` | `#E07A20` | Hover holat |
| `--ep-primary-soft` | `rgba(255,144,47,.12)` | Yumshoq fon (brand pill) |
| `--ep-bg` | `#FAFAF9` | Sahifa foni (issiq oq) |
| `--ep-bg-muted` | `#F4F4F2` | Ikkilamchi fon |
| `--ep-surface` | `#FFFFFF` | Karta foni |
| `--ep-surface-muted` | `#F8F8F6` | Yumshoq karta/input |
| `--ep-border` | `#EBEAE6` | Chegara |
| `--ep-border-strong` | `#DEDCD6` | Kuchli chegara |
| `--ep-fg` | `#15171A` | Asosiy matn |
| `--ep-fg-muted` | `#6B6E72` | Ikkilamchi matn |
| `--ep-fg-subtle` | `#9A9CA0` | Uchinchi darajali |
| `--ep-fg-inverse` | `#FFFFFF` | Teskari (to'q fonda) |

### 1.2 Status tokenlar (semantik, andon bilan mos)

| Token | Qiymat | Andon | Matn |
|-------|--------|-------|------|
| `--ep-success` | `#2E8A5A` | 🟢 norma | `--ep-success-fg` |
| `--ep-success-soft` | `rgba(46,138,90,.12)` | fon | — |
| `--ep-warn` | `#B5891C` | 🟡 ogohlantirish | `--ep-warn-fg` |
| `--ep-warn-soft` | `rgba(181,137,28,.12)` | fon | — |
| `--ep-danger` | `#C0432F` | 🔴 xato/to'xtash | `--ep-danger-fg` |
| `--ep-danger-soft` | `rgba(192,67,47,.12)` | fon | — |
| `--ep-info` | `#3563AC` | ℹ️ ma'lumot | `--ep-info-fg` |
| `--ep-info-soft` | `rgba(53,99,172,.12)` | fon | — |

> ⭐ `--ep-primary = #FF902F` (ORANGE) — **BLUE EMAS**. Har qanday "tone-flip" tekshiruvida shu rangni hisobga ol.

### 1.3 Modul tokenlar (`--mod-*`)

Har modul o'z rang-aksenti: asosiy jadval/header/KPI ikonkalari shu rang.

| Modul | Token | Rang |
|-------|-------|------|
| Finance | `--mod-fi` | `#06B6D4` (cyan) |
| HR | `--mod-hr` | `#8B5CF6` (violet) |
| Production/PP | `--mod-pp` | `#F59E0B` (amber) |
| MES | `--mod-mes` | `#EF4444` (red) |
| Warehouse/WMS | `--mod-wms` | `#10B981` (emerald) |
| QC | `--mod-qc` | `#F97316` (orange) |
| CRM | `--mod-crm` | `#3B82F6` (blue) |
| SD (Savdo) | `--mod-sd` | `#06B6D4` (cyan, savdoga) |
| Analytics/Director | `--mod-dir` | `#6366F1` (indigo) |
| Admin | `--mod-admin` | `#6B7280` (gray) |
| Org | `--mod-org` | `#EC4899` (pink) |
| Camera/CC | `--mod-cc` | `#14B8A6` (teal) |
| POS | `--mod-pos` | `#84CC16` (lime) |
| IoT | `--mod-iot` | `#F59E0B` (amber) |
| AI | `--mod-ai` | `#A855F7` (purple) |

---

## 2. TIPOGRAFIKA

- **Sans:** `Inter` — UI, matn, sarlavhalar
- **Mono:** `JetBrains Mono` — **raqamlar, kod, lot/SKU, pul miqdori** (tabular numeric, o'ngga tekislangan)

**Tip shkalasi:**

| Daraja | Tailwind class | font-size | weight |
|--------|---------------|-----------|--------|
| h1 (sahifa sarlavha) | `text-2xl font-semibold` | 24px | 600 |
| h2 (bo'lim) | `text-xl font-semibold` | 20px | 600 |
| h3 (karta sarlavha) | `text-base font-medium` | 16px | 500 |
| body | `text-sm` | 14px | 400 |
| small/label | `text-xs` | 12px | 400/500 |
| caption | `text-xs font-medium uppercase tracking-wide` | 11px | 500 |

---

## 3. SPACING VA LAYOUT

**Sahifa qobig'i (AppShellModern.tsx:180):**
```
AppShellModern → p-4 lg:p-6 + overflowY:auto (shell beradi)
Sahifa root → space-y-6 (faqat shu, padding/scroll QAYTALAMA)
```

**XATO pattern (double-pad):**
```tsx
// ❌ NOTO'G'RI — shell allaqachon p beradi
<div className="flex h-full p-5 lg:p-6 gap-5 overflow-auto">

// ✅ TO'G'RI
<div className="space-y-6">
```

**Karta ichidagi spacing:** `p-4` (kichik) / `p-6` (katta karta).
**Grid gap:** `gap-4` (standart) / `gap-6` (keng).
**KPI kartalar:** `grid grid-cols-2 md:grid-cols-4 gap-4`.

---

## 4. EP KOMPONENTLAR (kanonik, majburiy)

### 4.1 EPPageHeader

Har sahifaning BOSH QISMI. Mavjud bo'lmasa → Class-B sahifa (to'ldirilishi kerak).

```tsx
<EPPageHeader
  title="Buyurtmalar"                          // sahifa sarlavhasi
  subtitle="Jami 48 ta faol buyurtma"         // ixtiyoriy
  icon={<ShoppingCart className="h-5 w-5" />} // ixtiyoriy
  actions={<Button>Yangi buyurtma</Button>}   // ixtiyoriy
/>
```

Xususiyatlar: `title` (req) · `subtitle` · `icon` · `actions` · `badge` (count) · `className`.

### 4.2 EPKpiCard

KPI metrika kartasi (yuqori qatorda, grid'da).

```tsx
<EPKpiCard
  title="Umumiy buyurtmalar"
  value="48"                          // asosiy raqam
  change={+12}                        // foiz o'zgarish (ixtiyoriy)
  trend="up"                          // 'up' | 'down' | 'neutral'
  icon={<TrendingUp />}
  color="var(--mod-sd)"               // modul rangi
/>
```

Xususiyatlar: `title` (req) · `value` (req) · `change` · `trend` · `icon` · `color` · `loading` (skeleton).

### 4.3 EPCard

Umumiy maqsadli karta konteyner.

```tsx
<EPCard>
  <EPCard.Header>
    <EPCard.Title>Yaqinda yaratilgan</EPCard.Title>
    <EPCard.Action><Button size="sm">Hammasi</Button></EPCard.Action>
  </EPCard.Header>
  <EPCard.Content>
    {/* jadval, ro'yxat, grafik */}
  </EPCard.Content>
</EPCard>
```

### 4.4 EPStatusPill

Status ko'rsatish (jadval ustunlari, karta holatlari).

```tsx
<EPStatusPill status="active" />          // yashil
<EPStatusPill status="pending" />         // sariq
<EPStatusPill status="cancelled" />       // qizil
<EPStatusPill status="draft" />           // kulrang

// Yoki to'g'ridan variant bilan:
<EPStatusPill variant="success" label="Tasdiqlangan" />
<EPStatusPill variant="warn" label="Kutilmoqda" />
<EPStatusPill variant="danger" label="Bekor qilindi" />
<EPStatusPill variant="info" label="Ko'rib chiqilmoqda" />
```

### 4.5 EPErrorState

Xato holati (isError === true).

```tsx
if (isError) return (
  <EPErrorState
    title="Ma'lumotlarni yuklashda xato"
    message={error?.message}
    onRetry={() => refetch()}
  />
);
```

### 4.6 EPEmptyState

Bo'sh holat (data?.length === 0).

```tsx
if (!data?.length) return (
  <EPEmptyState
    title="Buyurtmalar topilmadi"
    description="Yangi buyurtma qo'shing yoki filterni o'zgartiring"
    action={<Button onClick={openCreate}>Yangi buyurtma</Button>}
  />
);
```

### 4.7 EPSkeleton (loading holati)

```tsx
if (isLoading) return <EPSkeletonTable rows={5} cols={4} />;
// Yoki:
if (isLoading) return <EPSkeletonCard />;
if (isLoading) return <EPSkeletonList />;
```

---

## 5. SAHIFA TUZILMASI (standart pattern)

### 5.1 Ro'yxat sahifasi (ListPage)

```tsx
export function OrdersPage() {
  const { data, isLoading, isError, refetch } = useQuery({...});

  if (isLoading) return <EPSkeletonTable rows={8} cols={5} />;
  if (isError)   return <EPErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <EPPageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle', { count: data?.total })}
        actions={<Button onClick={openCreate}>{t('create')}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EPKpiCard title={t('orders.total')} value={String(data?.total ?? 0)} />
        {/* boshqa KPI kartalar */}
      </div>

      <EPCard>
        <EPCard.Content>
          {data?.items?.length ? (
            <Table>{/* jadval */}</Table>
          ) : (
            <EPEmptyState title={t('orders.empty')} />
          )}
        </EPCard.Content>
      </EPCard>
    </div>
  );
}
```

### 5.2 Dashboard sahifasi

```tsx
export function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <EPPageHeader title={t('finance.dashboard')} />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => <EPKpiCard key={kpi.key} {...kpi} color="var(--mod-fi)" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EPCard>{/* grafik 1 */}</EPCard>
        <EPCard>{/* grafik 2 */}</EPCard>
      </div>

      <EPCard>{/* katta jadval */}</EPCard>
    </div>
  );
}
```

---

## 6. TOKENLARNI TEKSHIRISH

Har commit'dan oldin:
```bash
node scripts/check-design-tokens.mjs
# 0 raw color → PASS
# Raw color topilsa → token bilan almashtir
```

Qabul qilinadigan tokenlar:
- `var(--ep-primary)` / `var(--ep-fg)` / `var(--ep-border)` / ... (§1.1)
- `var(--ep-success)` / `var(--ep-warn)` / `var(--ep-danger)` / `var(--ep-info)` (§1.2)
- `var(--mod-fi)` / `var(--mod-hr)` / ... (§1.3)
- Tailwind utility classes (text-gray-500 va h.k.) — ruxsat (token'ga yaqin)

**TAQIQLANGAN:**
- `#FF902F` (xom hex) — tokenga almashtir
- `rgb(...)` yoki `rgba(...)` inline — tokenga almashtir
- `style={{ color: '#...' }}` inline — className bilan tok

---

## 7. MODUL RANG QOIDASI

Har modul o'z `--mod-*` tokenini ishlatar:
- EPKpiCard `color` propida
- Section ikonkalarida (`text-[var(--mod-pp)]`)
- Progress bar / accent elementlarda

```tsx
// Production Planning sahifasida:
<EPKpiCard color="var(--mod-pp)" ... />
<span className="text-[var(--mod-pp)]"><Factory /></span>

// Finance sahifasida:
<EPKpiCard color="var(--mod-fi)" ... />
```

---

## 8. DARK / YORUG' TEMA

CSS o'zgaruvchilari `:root` (light) va `[data-theme="dark"]` (dark) blokida.
Komponentlar tokenlardan foydalangani uchun AVTOMATIK almashinadi.

```css
:root {
  --ep-bg: #FAFAF9;
  --ep-surface: #FFFFFF;
  --ep-fg: #15171A;
}
[data-theme="dark"] {
  --ep-bg: #0E0F11;
  --ep-surface: #17191C;
  --ep-fg: #ECECEC;
}
```

---

## 9. AI SAHIFALAR (Q-41)

AI vizualizatsiya sahifalari (AIFinancePage, AISHA va h.k.) uchun:
- EP token asosda qolsin, lekin **futuristik gradient** ruxsat — agar vizual zarur bo'lsa
- Asosiy qoida: funksional holat (loading/error/empty) EP pattern bo'yicha
- **Majburiy emas:** EPPageHeader — agar custom header talab qilsa, token bilan

---

## 10. TEKSHIRUV CHECKLISTI (har sahifa)

```
☐ EPPageHeader bor (yoki asosli istisno — AIPage/CashRegister kabi)
☐ Sahifa root: <div className="space-y-6"> (flex/h-full/overflow-auto EMAS)
☐ isLoading → EPSkeleton* (Skeleton EMAS, div pulsate EMAS)
☐ isError → EPErrorState (qizil div EMAS)
☐ !data?.length → EPEmptyState (bo'sh div EMAS)
☐ check-design-tokens.mjs: 0 raw color
☐ KPI kartalar EPKpiCard (div+hardcode EMAS)
☐ Status ko'rsatish EPStatusPill (badge div EMAS)
☐ i18n: hamma matn t('key') (hardcoded uzbek/rus EMAS)
☐ Co-located fayllar (*Sections/*Tabs/*Cards/*Charts/*Extra) ham tekshirildi
```

---

*Hujjat oxiri · [LOYIHA_QOIDALARI.md](LOYIHA_QOIDALARI.md) bilan birga o'qiladi*
*EuroPrint ERP · EP Design System · Versiya: 2026-06-18*
