# 13 — BOSQICH 10: DIREKTOR PANELI (DIR)

> Real-time zavod holati → KPI → moliya xulosasi → Andon → strategik BI.
> **Holat: 🔧 ~30% mavjud** — asosiy dashboard mavjud; Andon WebSocket stub; real BI yo'q.
> Bog'liqlik: Barcha modul tayyor bo'lgandan keyin (oltin zanjir ishlashi shart).

---

## 10.1 Kanonik jadvallar

```sql
director_snapshots   -- kunlik KPI snapshot (har tunda yaratiladi)
andon_signals        -- Andon signal yozuvi (real-time + tarix)
kpi_targets          -- KPI maqsad qiymatlari (oy/kvartal bo'yicha)
kpi_actuals          -- KPI haqiqiy qiymatlar (kunlik hisoblash)
```

---

## 10.2 Asosiy KPI Paneli

Direktor har kuni ko'radigan 12 ta KPI:

```ts
interface DirectorDashboard {
  // Ishlab chiqarish:
  oee_today: number;              // % (MES dan)
  production_vs_plan: number;     // % (work_orders)
  active_work_orders: number;     // (MES)
  maintenance_overdue: number;    // (equipment)

  // Sifat:
  defect_rate_today: number;      // % (QC)
  qc_pass_rate_today: number;     // % (QC)

  // Moliya:
  revenue_month: number;          // UZS (FIN entries)
  expense_month: number;          // UZS (FIN entries)
  profit_margin: number;          // % (daromad - xarajat)
  accounts_receivable: number;    // UZS (debitorlik)

  // Xodimlar:
  attendance_today: number;       // % (HR)
  open_vacancies: number;         // (HR)
}
```

---

## 10.3 Andon Taxtasi (Real-time)

Andon — zavod pollida ko'rinadigan ekran. Har mashina holati rang bilan.

```ts
// WebSocket gateway (Andon real-time):
@WebSocketGateway({ namespace: '/andon', cors: true })
export class AndonGateway {
  @SubscribeMessage('subscribe')
  async subscribe(client: Socket) {
    // Har 5 sekundda holat yuborish:
    const interval = setInterval(async () => {
      const status = await this.getWorkCenterStatus();
      client.emit('status', status);
    }, 5000);
    client.on('disconnect', () => clearInterval(interval));
  }
}

// WorkCenter holati:
interface WorkCenterStatus {
  workCenterId: number;
  code: string;           // 'OFFSET-1'
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN' | 'SETUP';
  currentOrderId?: number;
  oeeToday: number;       // %
  alertCount: number;
  color: string;          // '#10B981' GREEN / '#EF4444' RED / '#F59E0B' YELLOW
}
```

---

## 10.4 Moliya Xulosasi (Director view)

```ts
// Director uchun moliya xulosasi (entries jadvalidan):
async getFinancialSummary(month: string): Promise<DirectorFinSummary> {
  const revenue = await this.db.select({ total: sum(entries.amount) })
    .from(entries)
    .innerJoin(accounts, eq(entries.accountId, accounts.id))
    .where(and(
      like(accounts.code, '9%'),     // Daromad hisoblari
      eq(entries.side, 'CREDIT'),
      sql`DATE_TRUNC('month', entries.posted_at) = ${month}::date`,
    ));

  const expenses = await this.db.select({ total: sum(entries.amount) })
    .from(entries)
    .innerJoin(accounts, eq(entries.accountId, accounts.id))
    .where(and(
      like(accounts.code, '7%'),     // Xarajat hisoblari
      eq(entries.side, 'DEBIT'),
      sql`DATE_TRUNC('month', entries.posted_at) = ${month}::date`,
    ));

  return {
    revenue: Number(revenue[0]?.total ?? 0),
    expenses: Number(expenses[0]?.total ?? 0),
    profit: Number(revenue[0]?.total ?? 0) - Number(expenses[0]?.total ?? 0),
  };
}
```

---

## 10.5 Kunlik Snapshot (Cron)

```ts
// Har kecha 23:55 da (direktorda ertasiga tayyorlash):
@Cron('55 23 * * *')
async createDailySnapshot(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const snapshot = {
    date: today,
    oee: await this.mesService.getOeeForDate(today),
    production_qty: await this.mesService.getTotalProductionQty(today),
    defect_rate: await this.qcService.getDefectRate(today),
    revenue: await this.finService.getDailyRevenue(today),
    attendance_pct: await this.hrService.getAttendancePct(today),
  };

  await this.db.insert(directorSnapshots).values(snapshot)
    .onConflictDoUpdate({ target: [directorSnapshots.date], set: snapshot });
}
```

---

## 10.6 Strategik Hisobotlar

Direktor uchun tarixiy tahlil (oy/kvartal/yil):

| Hisobot | Manba | Endpoint |
|---------|-------|---------|
| OEE trend | director_snapshots | GET /api/director/reports/oee?from=&to= |
| Sifat trend | qc + director_snapshots | GET /api/director/reports/quality |
| Moliya P&L | entries + accounts | GET /api/director/reports/pnl |
| Xodim unumdorligi | HR + MES | GET /api/director/reports/workforce |
| Mijoz tahlili | SD + CRM | GET /api/director/reports/customers |

---

## 10.7 Acceptance kriterlari

```
☐ Real-time dashboard (12 KPI, har 30 sekunda yangilanadi)
☐ Andon taxtasi WebSocket (har work_center rangli holat)
☐ Moliya xulosasi (revenue/expense/profit entries dan)
☐ Kunlik snapshot cron (23:55, director_snapshots)
☐ OEE/sifat/moliya trend hisobotlar
☐ Andon signal yozuvi (IoT anomaliya → andon_signals)
☐ KPI maqsad vs actual (kpi_targets vs kpi_actuals)
☐ tsc 0 + test PASS
```

---

## 10.8 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/director/` | ✅ ko'chir, real data to'ldir |
| `lib/db/src/schema/director-snapshots.ts` | 🔧 tekshir/yaratish |
| `lib/db/src/schema/andon-signals.ts` | 🔲 yangi |
| `lib/db/src/schema/kpi-targets.ts` | 🔲 yangi |
| Andon WebSocket gateway | 🔧 stub → real |
| Daily snapshot cron | 🔲 yangi |

---
*Keyingi: [14_Test.md](14_Test.md)*
