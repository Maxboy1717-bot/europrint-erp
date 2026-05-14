# 260 sahifa uchun universal shablon tizimi

EuroPrint ERP'da **260+ sahifa** bor — har biriga alohida dizayn kerak emas. Hammasi quyidagi **5 ta universal shablon**dan birini ishlatadi va bir xil komponentlardan tashkil topadi.

Yangi sahifa = **yangi PROPS**, **yangi dizayn EMAS**.

---

## Universal shellsiz biror sahifa qurilmaydi

Har bir sahifa **avtomatik ravishda** quyidagilarni meros qiladi:

- **Sidebar** (260px, oq, gradient promo card bilan) — `<Sidebar/>` orqali
- **Topbar** (greeting / title / breadcrumb / actions) — `<Topbar/>` orqali
- **Warm-blush page bg** + **18px rounded white cards**
- **Inter shrifti**, **#FF902F brand orange**, **#E94560 coral aksent**
- **Bir xil komponentlar:** `.kpi`, `.card`, `.btn`, `.pill`, `.tbl`, `.tabs`, `.seg`, `.pbar`
- **Bir xil animatsiyalar:** hover-lift, shimmer, count-up, gradient-shift

Bu tushuncha **fundamental**: hech qachon yangi shell yoki yangi color palette yaratilmaydi. Faqat shablon tanlanadi va PROPS toʻldiriladi.

---

## 5 ta universal shablon

### 1. `<ListPage/>` — eng koʻp ishlatiladigan (~60%)

Har qanday CRUD roʻyxat: **Xodimlar, Mijozlar, Buyurtmalar, Mahsulotlar, Hisob-fakturalar, Yetkazib beruvchilar, Maxsulot kartochkalari, …**

**Anatomy:**
- 4 ta mini KPI kartochka (Jami / Faol / Yangi / Muddati oʻtgan)
- Tablar (`Hammasi · Faol · Kutilmoqda · Yopilgan`) + qidiruv + filter
- Cheksiz ustunli jadval (avatar + matn + monospace ID + status pill + summa)
- Sahifalash

**Misol — Xodimlar:**
```jsx
<ListPage
  title="Xodimlar"
  breadcrumb={<><b>Dashboard</b> / HR / Xodimlar</>}
  primaryAction="Yangi xodim"
  kpis={[
    { label:'Jami', value:'412', delta:'3%', deltaTrend:'up', icon:'users', iconBg:'var(--ep-primary)' },
    { label:'Faol', value:'376', icon:'check', iconBg:'#15171A' },
    { label:'Taʼtilda', value:'24', icon:'umbrella', iconBg:'var(--accent-coral)' },
    { label:'Yangi bu oy', value:'8', delta:'+3', deltaTrend:'up', icon:'plus', iconBg:'#7A4FB1' },
  ]}
  statusMap={{ active: <span className="pill success">Faol</span>, ... }}
  columns={[
    { key:'name',    label:'Xodim',   render: r => <><span className="av">{r.av}</span><b>{r.name}</b></> },
    { key:'dept',    label:'Boʻlim' },
    { key:'phone',   label:'Telefon', cellStyle:{ fontFamily:'var(--font-mono)' } },
    { key:'status',  label:'Holat' },
    { key:'salary',  label:'Maosh', headStyle:{textAlign:'right'}, cellStyle:{textAlign:'right',fontWeight:600} },
  ]}
  rows={[...]}
/>
```

**Qaysi 260 sahifa shu shablonni ishlatadi (~150 ta):**
HR → Xodimlar / Boʻlimlar / Lavozimlar / Davomat / Taʼtillar / Maoshlar / KPI / Trening · MM → Mahsulotlar / Kategoriyalar / Materiallar / BOM / Yetkazib beruvchilar · SD → Mijozlar / Leadlar / Bitimlar / Kotirovkalar / Buyurtmalar · WMS → Omborlar / Joylar / Inventar / Yetkazib berishlar · POS → Smenalar / Kassirlar / Operatsiyalar · MES → Smenalar / Operatorlar / Mashinalar · QC → Reklamatsiyalar / Tekshirishlar · IoT → Sensorlar / Hodisalar · FI → Hisob-fakturalar / Toʻlovlar / Xarajatlar / Hisoblar · Sistema → Loglar / Foydalanuvchilar / Rollar · va boshqalar.

---

### 2. `<DetailPage/>` — yagona yozuv (~25%)

Bitta yozuvni koʻrish: **Buyurtma tafsiloti, Xodim profili, Mijoz kartochkasi, Mahsulot kartochkasi, Hisob-faktura, …**

**Anatomy:**
- Hero meta strip (4 ta ustun: ID / Mijoz / Summa / Sana)
- Chap ustun (2/3): tablar (Umumiy / Hujjatlar / Tarix / Sharhlar) + section cardlar (qator-qator key–value)
- Oʻng ustun (1/3): "Asosiy" maʼlumotlar + "Tarix" timeline

**Misol — Buyurtma tafsiloti:**
```jsx
<DetailPage
  title="Buyurtma #EP-24108"
  breadcrumb={<>Dashboard / Buyurtmalar / #EP-24108</>}
  status="Yoʻlda · 65%"
  statusCls="warning"
  meta={[
    { label:'Mijoz', value:'Korzinka Online', sub:'B2B kontrakt #2024-018' },
    { label:'Mahsulot', value:'Banner 5×3m', sub:'×12 dona' },
    ...
  ]}
  sections={[
    { title:'Mijoz maʼlumotlari', fields:[
        { label:'Kompaniya', value:'Korzinka Online MChJ' }, ...
    ]},
    { title:'Buyurtma tafsiloti', fields:[ ... ]},
    ...
  ]}
  sidePanel={<>...</>}
/>
```

**Qaysi 260 sahifa shu shablonni ishlatadi (~70 ta):**
Har qanday yozuvning batafsil ko'rinishi.

---

### 3. `<FormPage/>` — yaratish/tahrirlash (~10%)

**Anatomy:**
- Topbar: breadcrumb + title + 3 ta tugma (Bekor / Qoralama / Saqlash & yuborish)
- Chap (2/3): bir necha "guruh kartochka" — har biri 1 yoki 2 ustunli forma maydonlari
- Oʻng (1/3): maslahat paneli + qora "Avtomatik saqlash" kartochka

**Misol — Yangi buyurtma yaratish:**
```jsx
<FormPage
  title="Yangi buyurtma yaratish"
  breadcrumb={<>Dashboard / Buyurtmalar / Yangi</>}
  groups={[
    { title:'Mijoz', columns:2, fields:[
        { label:'Mijoz', required:true, type:'select', options:[...] },
        { label:'Kontakt shaxs', placeholder:'F.I.SH' },
        { label:'Telefon' },
        { label:'Email', type:'email' },
    ]},
    { title:'Mahsulot & spetsifikatsiya', columns:2, fields:[ ... ]},
    { title:'Yetkazish', columns:2, fields:[ ... ]},
  ]}
/>
```

**Maydon turlari:** `text` (default), `email`, `number`, `date`, `select` (`options:[{value,label}]`), `textarea` (`rows`).

---

### 4. `<SettingsPage/>` — sozlamalar (~3%)

**Anatomy:**
- Chap mini-menu (240px) — guruh + items (Hisob, Tashkilot, Integratsiya…)
- Oʻng kontent — sectionlar bilan toʻldiriladi (Profil, Bildirishnomalar, …)
- Pastda Cancel / Save tugmalari

**Qaysi sahifalar:** Sistema sozlamalari, Kompaniya sozlamalari, Foydalanuvchi profili, Integratsiya, Notifikatsiyalar.

---

### 5. `<EmptyStatePage/>` — ma'lumot yo'q (~2%)

**Anatomy:** markazda 120×120 gradient ikona + sarlavha + 1–2 jumla matn + 2 ta CTA (Excel'dan import + Yangi qoʻshish).

Yangi modul birinchi marta ochilganda ko'rinadi.

---

## Yangi sahifa qoʻshish — 4 qadam

1. **Shablonni tanlang** — yangi sahifa qaysi shablonga toʻgʻri keladi?
   - Koʻp yozuvni koʻrsatish kerakmi? → `ListPage`
   - Bitta yozuvni koʻrsatish kerakmi? → `DetailPage`
   - Ma'lumot yaratish/tahrirlash kerakmi? → `FormPage`
   - Sozlamalarmi? → `SettingsPage`
   - Hali maʼlumot yoʻqmi? → `EmptyStatePage`

2. **Sidebar'ga qoʻshing** (`AppShell.jsx` NAV obʼekti):
   ```jsx
   { id: 'my-page', ic: 'package', lbl: 'Yangi sahifa' }
   ```

3. **Route qoʻshing** (`index.html` `map` obʼekti):
   ```jsx
   'my-page': <ListPage title="..." kpis={...} columns={...} rows={...}/>,
   ```

4. **Qoidalar:**
   - Yangi rang ishlatmang — faqat `--ep-primary`, `--accent-coral`, neutrallar
   - Yangi font ishlatmang — faqat Inter
   - Yangi card stil yaratmang — `.card` ishlatang
   - Status pill faqat 8 ta variantdan: `success / warning / danger / info / primary / coral / purple / neutral`

---

## Joriy demo ERP-da koʻrinadigan 12 ta sahifa

Sidebar'dagi har bir element haqiqiy sahifaga yoʻnaltirilgan:

| Sidebar yorligʻi | Shablon | Vazifa |
|---|---|---|
| Bosh sahifa | `DashboardPage` (maxsus) | KPI + chart + map + alerts |
| Analitika | `AnalyticsPage` (maxsus) | KPI + busy hours heatmap + ranking lists |
| Kalendar | `EmptyStatePage` | "Hodisa qoʻshish" CTA |
| Buyurtmalar | `ListPage` | Buyurtmalar roʻyxati |
| Kuzatuv (detail) | `DetailPage` | #EP-24108 buyurtma tafsiloti |
| Yangi buyurtma | `FormPage` | Yaratish formasi |
| Ombor | `WarehousePage` (maxsus) | Inventar + capacity donut |
| Haydovchilar | `ListPage` | Haydovchilar roʻyxati |
| Hisob-faktura | `ListPage` | INV roʻyxati |
| Xabarlar | `EmptyStatePage` | "Suhbat boshlash" CTA |
| Bildirishnomalar | `EmptyStatePage` | "Hammasi oʻqildi" |
| Sozlamalar | `SettingsPage` | Profile + notifs + …pages |

**Maxsus sahifalar** (`DashboardPage`, `AnalyticsPage`, `WarehousePage`) — odatdagi shablonga sigʻmaganda yoziladi (faqat 5–10% sahifalar shunday boʻladi).

---

## Mavjud komponentlar (qayta foydalaniladigan)

Bularning hammasi shablonlar ichida avtomatik ishlatiladi, lekin maxsus sahifalarda ham qoʻllash mumkin:

- `<KpiCard icon="package" color iconBg label value delta deltaTrend/>`
- `<BarChart data calloutIndex/>` — pattern-striped vertical bars
- `<Donut size thickness segments centerLabel centerValue/>`
- `<FormField label hint required>...<FormInput/></FormField>`
- `<Icon name size stroke/>` — 50+ outline ikon
- `<Topbar title breadcrumb greet actions/>`
- `<Sidebar active onChange/>`

**CSS classlar:** `.card / .card.hover-lift`, `.btn / .btn-primary / .btn-secondary / .btn-dark / .btn-outline`, `.pill.{success,warning,danger,info,primary,coral,purple,neutral}`, `.tbl`, `.tabs / .tab.active`, `.seg button`, `.pbar / .pbar.coral`, `.alert-row`, `.av`, `.bar-grp .bar.{solid,stripe,coral,dark}`.

---

## Qaysi 260 sahifaning AY oʻzgaradigan qismi?

Faqat 4 ta narsa:
1. **PROPS** (data, columns, labels) — har sahifa uchun har xil
2. **Tanlangan shablon** (List / Detail / Form / Settings / Empty)
3. **Sidebar yorligʻi va ikon**
4. **`status` pill ranglari** (8 ta variantdan)

**Hech qachon oʻzgarmaydigan narsa:**
- Sidebar tartibi, brand mark, foydalanuvchi pill
- Topbar layout, search box, ikon button
- Page bg, card stil, border-radius, shadow
- Font, ranglar, masofalar, ikonografiya
- Tugma, pill, table, KPI card hammasi

Shu tarzda 260 ta sahifa **kuni-tunda mukammal** — yangi dizayner yangi sahifa qoʻshganda ham, hammasi bir xil koʻrinadi.
