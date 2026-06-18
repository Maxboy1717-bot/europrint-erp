# 11 — BOSQICH 8: MIJOZ MUNOSABATLARI (CRM)

> Lead → tarmoq → taklif → bitim → buyurtma → sadoqat.
> **Holat: 🔧 ~35% mavjud** — crm_leads/deals/contacts mavjud; AI scoring stub; SD integratsiya yo'q.
> Bog'liqlik: Bosqich 2 (SD) — deal → sales_order ko'prigi.

---

## 8.1 Kanonik jadvallar

```sql
crm_leads            -- potensial mijoz
crm_deals            -- bitim (lead dan hosil bo'ladi)
crm_contacts         -- aloqa shaxslari
crm_activities       -- qo'ng'iroq/uchrashuv/email yozuvi
crm_pipeline_stages  -- Kanban bosqichlari lug'at (lookup)
crm_tags             -- belgilash
```

⚠️ `crm_deals.assigned_by_id NOT NULL` — convert da hamesha fallback zanjiri: `user.id ?? lead.owner_id ?? adminId`.
⚠️ `crm_leads.id INT`, `crm_deals.lead_id INT` — type moslik zarur (UUID ↔ INT mismatch bo'lmaydi).

---

## 8.2 Pipeline (Kanban bosqichlari)

```ts
// crm_pipeline_stages seed:
const stages = [
  { order: 1, code: 'NEW',          name_uz: 'Yangi',           color: '#94A3B8' },
  { order: 2, code: 'QUALIFICATION', name_uz: 'Sifatlash',      color: '#3B82F6' },
  { order: 3, code: 'PROPOSAL',     name_uz: 'Taklif',          color: '#F59E0B' },
  { order: 4, code: 'NEGOTIATION',  name_uz: 'Muzokaralar',     color: '#8B5CF6' },
  { order: 5, code: 'CLOSED_WON',   name_uz: 'Yutilgan',        color: '#10B981' },
  { order: 6, code: 'CLOSED_LOST',  name_uz: 'Yo\'qotilgan',    color: '#EF4444' },
];

// Kanban drag: status_id (coarse state, FK → crm_pipeline_stages)
// Nozik holat: status_description (TEXT) — CHECK constraint buzilmaydi
```

---

## 8.3 Lead → Deal Konversiya

```ts
// POST /api/crm/leads/:id/convert
async convertLeadToDeal(leadId: number, userId: number): Promise<Result<CrmDeal>> {
  const lead = await this.leadRepo.findById(leadId);
  if (!lead.ok) return Err('Lead topilmadi');

  // ⚠️ assigned_by_id NOT NULL — fallback zanjiri:
  const assignedById = userId ?? lead.value.owner_id ?? await this.getDefaultAdminId();

  const deal = await this.dealRepo.create({
    lead_id: leadId,
    title: lead.value.company_name ?? lead.value.contact_name,
    stage_id: STAGE_NEW,
    assigned_by_id: assignedById,   // NOT NULL — hamesha qiymat bor
    assigned_to_id: userId,
    estimated_value: lead.value.budget_estimate,
  });

  await this.leadRepo.update(leadId, { status: 'CONVERTED', deal_id: deal.value.id });
  await this.eventBus.publish(new LeadConvertedEvent(leadId, deal.value.id));
  
  return deal;
}
```

---

## 8.4 Deal → SalesOrder Ko'prigi

```ts
// Deal yutilganda (CLOSED_WON) → sales_order yaratish:
@OnEvent('crm.deal.won')
async handleDealWon(event: DealWonEvent): Promise<void> {
  const deal = await this.dealRepo.findById(event.dealId);
  
  const order = await this.sdService.createOrderFromDeal({
    customerId: deal.customer_id ?? await this.getOrCreateCustomer(deal),
    dealId: deal.id,
    estimatedValue: deal.estimated_value,
    notes: deal.notes,
  });

  await this.dealRepo.update(event.dealId, { sales_order_id: order.id });
}
```

---

## 8.5 AI Lead Scoring

```ts
// AI scoring (har 24 soatda yoki yangi activity da):
interface LeadScore {
  score: number;          // 0-100
  tier: 'HOT' | 'WARM' | 'COLD';
  factors: {
    engagement: number;  // aktivlik soni va davomiyligi
    fit: number;         // ICP (Ideal Customer Profile) moslik
    timing: number;      // oxirgi kontakt + urgency
    budget: number;      // budget_estimate > threshold
  };
  next_action: string;   // 'Qo\'ng\'iroq qiling' | 'Taklif yuboring'
}

// Scoring hisoblash:
async scoreLeads(): Promise<void> {
  const leads = await this.leadRepo.findActiveLeads();
  for (const lead of leads) {
    const activities = await this.activityRepo.findByLeadId(lead.id);
    const score = this.calculateScore(lead, activities);
    await this.leadRepo.update(lead.id, { ai_score: score.score, ai_tier: score.tier });
    if (score.tier === 'HOT') {
      await this.eventBus.publish(new HotLeadDetectedEvent(lead.id, score));
    }
  }
}
```

---

## 8.6 Activity Tracking

```ts
// crm_activities — har aloqa yozuvi:
type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'DEMO' | 'NOTE' | 'TASK';

await this.db.insert(crmActivities).values({
  lead_id: dto.leadId,
  deal_id: dto.dealId,
  type: dto.type,
  subject: dto.subject,
  description: dto.description,
  outcome: dto.outcome,
  duration_minutes: dto.durationMinutes,
  created_by: userId,
  activity_at: dto.activityAt ?? new Date(),
});
```

---

## 8.7 Acceptance kriterlari

```
☐ Lead CRUD (yaratish/tahrirlash/o'chirish)
☐ Lead → Deal konversiya (assigned_by_id fallback bilan)
☐ Kanban drag (stage_id yangilanadi, CHECK constraint buzilmaydi)
☐ Deal CLOSED_WON → sales_order yaratiladi (SD integratsiya)
☐ Activity yozuvi (qo'ng'iroq/email/uchrashuv)
☐ AI lead scoring (score + tier)
☐ HotLeadDetectedEvent → menejer xabardorlik
☐ CRM dashboard: funnel, conversion rate, pipeline value
☐ tsc 0 + test PASS
```

---

## 8.8 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/crm/` | ✅ ko'chir, convert fix allaqachon |
| `lib/db/src/schema/crm-leads.ts` | ✅ ko'chir |
| `lib/db/src/schema/crm-deals.ts` | ✅ ko'chir (assigned_by_id fix) |
| `lib/db/src/schema/crm-activities.ts` | ✅ ko'chir |
| Deal → SalesOrder bridge | 🔲 yangi |
| AI lead scoring servis | 🔲 yangi |
| crm_pipeline_stages seed | 🔧 tekshir |

---
*Keyingi: [12_Bosqich9_AI_IOT.md](12_Bosqich9_AI_IOT.md)*
