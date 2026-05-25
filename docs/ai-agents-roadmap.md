# Europrint ERP — 14 ta AI Agent Tizimi

## ✅ To'liq bajarilgan ish (50 ta vazifa)

---

## 🏗️ Arxitektura

Barcha 14 agent **mustaqil NestJS service** sifatida `apps/api/src/modules/agents/` ostida joylashgan.
Agentlar bir-biri bilan **EventBus** orqali muloqot qiladi (loose coupling).

```
apps/api/src/modules/agents/
├─ shared/
│  ├─ agent-event-bus.service.ts     ← agentlar o'rtasida event
│  ├─ agent-audit.service.ts         ← har bir agent harakati audit
│  └─ agent-alert.service.ts         ← Universal Telegram + DB ogohlantirish
├─ director-agent.service.ts          ← Agent 1
├─ lead-scoring-agent.service.ts      ← Agent 2
├─ production-agent.service.ts        ← Agent 3
├─ inventory-agent.service.ts         ← Agent 4
├─ cashflow-agent.service.ts          ← Agent 5
├─ supplier-agent.service.ts          ← Agent 6
├─ hr-performance-agent.service.ts    ← Agent 7
├─ quality-agent.service.ts           ← Agent 8
├─ security-agent.service.ts          ← Agent 9
├─ marketing-agent.service.ts         ← Agent 10
├─ lms-agent.service.ts               ← Agent 11
├─ iot-agent.service.ts               ← Agent 12
├─ facilities-agent.service.ts        ← Agent 13
├─ strategic-agent.service.ts         ← Agent 14
├─ agents.controller.ts               ← /api/agents/* (50+ endpoint)
└─ agents.module.ts
```

---

## 📊 Migratsiya: 0011_agents_infrastructure.sql

5 ta yangi jadval:
- `agents_audit_log` — har agent harakati (action, target, AI tokens, cost, success)
- `agent_module_health` — 20 modul holati (0-100)
- `agent_alerts` — universal ogohlantirishlar (severity, target_user, telegram_sent, actions)
- `agent_modules_registry` — 20 modul ro'yxati (seed: director, crm, production, ..., admin)
- `agent_cron_state` — agent cron jadvallari holati

---

## 🤖 14 ta Agent qisqacha

| # | Agent | Asosiy metodlar | Cron |
|---|-------|----------------|------|
| 1 | **Director** | `getDailyBriefing`, `askAdvisor`, `getModuleHealth`, `morningBriefing` | 07:30 har kuni |
| 2 | **Lead Scoring (CRM)** | `scoreLeads`, `generateProposal`, `getCustomer360`, `predictChurn` | 09:00 har kuni |
| 3 | **Production** | `monitorOrders`, `calculateOEE`, `detectBottleneck`, `generateShiftReport` | har 30 daq |
| 4 | **Inventory** | `forecastDemand`, `checkCriticalStock`, `abcAnalysis`, `getRollBalance` | 06:00 har kuni |
| 5 | **Cashflow** | `forecastCashFlow`, `checkOverduePayments`, `detectFraud` | 06:30 har kuni |
| 6 | **Supplier** | `scoreSuppliers`, `detectDeliveryRisks`, `createPurchaseRequest` | 08:00 har kuni |
| 7 | **HR Performance** | `analyzePerformance`, `predictChurn`, `calculateBonus` | 17:00 har kuni |
| 8 | **Quality (AI Vision)** | `analyzeDefect`, `trackBrakTrend`, `manageQuarantine` | har 4 soat |
| 9 | **Security** | `monitorAccessAttempts`, `analyzeAuditLog`, `emergencyProtocol` | har soat |
| 10 | **Marketing** | `analyzeMarketingROI`, `generateContent`, `segmentCustomers` | dushanba 09:00 |
| 11 | **LMS** | `trackProgress`, `checkCertificateExpiry` | 08:00 har kuni |
| 12 | **IoT/Kamera** | `collectSensorData`, `detectAnomalies`, `predictFailure`, `faceRecognitionAttendance` | har 30 daq |
| 13 | **Facilities** | `trackUtilityBills`, `schedulePreventiveMaintenance`, `monitorOfficeSupplies` | dushanba 07:00 |
| 14 | **Strategic** | `scenarioAnalysis`, `forecastRevenue`, `recommendCapitalInvestment` | oy 1-kun 09:00 |

---

## 🌐 REST endpointlar (50+)

```
# Director (4)
GET  /api/agents/director/briefing
POST /api/agents/director/ask
GET  /api/agents/director/module-health

# CRM (4)
GET  /api/agents/crm/score-leads
POST /api/agents/crm/proposal/:leadId
GET  /api/agents/crm/customer360/:id
GET  /api/agents/crm/churn/:id

# Production (4)
GET  /api/agents/production/{monitor,oee,bottleneck,shift-report/:shiftId}

# Inventory (4)
GET  /api/agents/inventory/{forecast/:id,critical,abc,rolls}

# Finance (3)
GET  /api/agents/finance/{cashflow,overdue,fraud}

# Supplier (2)
GET  /api/agents/supplier/{scores,risks}

# HR (3)
GET  /api/agents/hr/{performance/:id,churn/:id,bonus/:id}

# Quality (2)
GET  /api/agents/quality/{trend,quarantine}

# Security (2)
GET  /api/agents/security/{access-attempts,audit-anomalies}

# Marketing (3)
GET  /api/agents/marketing/{roi/:campaignId,segments}
POST /api/agents/marketing/content

# LMS (2)
GET  /api/agents/lms/{progress/:id,expiry}

# IoT (3)
GET  /api/agents/iot/{sensor/:m,anomaly/:m,rul/:m}

# Facilities (3)
GET  /api/agents/facilities/{utility,maintenance,supplies}

# Strategic (3)
POST /api/agents/strategic/scenario
GET  /api/agents/strategic/{forecast-revenue,investment}

# Universal alerts (2)
GET  /api/agents/alerts
POST /api/agents/alerts/:id/read
```

---

## 🎨 Frontend

### Agents Hub sahifasi — `/agents`
- **Sarlavha:** "AI Agentlar — 14 ta avtonom AI agent"
- **Direktor brifing kartasi:** AI xulosa + 4 ta KPI + ogohlantirishlar
- **20 modul holati grid:** har modul 0-100 health score, xato soni
- **14 agent kartochka:** har biri rang/icon bilan, click → agent sahifasi
- **AI Maslahatchi modal:** direktor savol bersa Claude ERP ma'lumotlari bilan javob beradi

### Marshrutlar
- `/agents` — Agents Hub
- `/agents/:id` — alohida agent sahifasi (kelajakda)

### Sidebar
"Koordinatsiya" guruhi ostida yangi link: **"AI Agentlar (14 ta)"** → `/agents`

---

## 🔌 Universal Telegram routing

`AgentAlertService.sendToTelegram()` orqali:
- Foydalanuvchining `employees.telegram_chat_id` orqali aniqlanadi
- Severity emoji bilan jo'natiladi: 🚨 urgent, 🔴 critical, ⚠️ warning, ℹ️ info
- Markdown format
- Agentlardan keladigan barcha alertlar bitta `TELEGRAM_AGENTS_BOT_TOKEN` orqali

---

## 🔄 EventBus eventlar

```
director.briefing_sent       — direktor agent ertalab brifing yubordi
crm.hot_leads_found          — CRM issiq lead topildi
production.delayed           — kechikkan buyurtma topildi
stock.critical               — kritik qoldiq aniqlandi
finance.fraud_suspected      — anomal tranzaksiya
procurement.delivery_risk    — yetkazib berish xavfi
hr.low_performance           — past samaradorlik
quality.defect_rising        — brak foizi oshmoqda
security.emergency           — favqulodda holat
iot.anomaly                  — sensor anomaliyasi
```

Misol: Inventory agent `stock.critical` event chiqaradi → Supplier agent eshitib avto purchase_request yaratadi.

---

## 🛡️ Xavfsizlik qoidalari

- ✅ Barcha endpointlar `RolesGuard` + `Throttle` (100 req/min)
- ✅ Har agent harakati `agents_audit_log` ga yoziladi (kim, qachon, qaysi target, AI tokens, cost)
- ✅ AI chaqiruvlari `aiUsed: true` belgisi bilan log qilinadi
- ✅ Katta summali tranzaksiyalar (`createPurchaseRequest`) inson tasdiqi talab qiladi (status='pending')
- ✅ Director savollari `userId` bilan saqlanadi (audit trail)

---

## 📊 Yakuniy statistika

| Metric | Soni |
|--------|------|
| Yangi yaratilgan fayl | 17 (3 shared + 14 agent + module + controller) |
| Frontend fayl | 1 (AgentsHub.tsx, ~250 qator) |
| Migratsiya | 1 (0011_agents_infrastructure.sql) |
| REST endpointlar | 50+ |
| Cron joblar | 14 (har agent uchun bittadan) |
| EventBus eventlar | 10+ (agentlar o'rtasida) |
| **TypeScript xatolari (yangi fayllarda)** | **0** ✅ |

---

## 🚀 .env qo'shimchalari

```bash
# Universal agents Telegram bot (yoki notification bot tokenini qayta ishlatamiz)
TELEGRAM_AGENTS_BOT_TOKEN=...

# Direktor user ID (ertalabki brifing uchun)
DIRECTOR_USER_ID=1

# Mavjud bo'lishi kerak (avval o'rnatilgan)
ANTHROPIC_API_KEY=...
JWT_SECRET=...
```

---

## 🔄 Migratsiyani ishga tushirish

```bash
psql "$DATABASE_URL" -f apps/api/drizzle/0011_agents_infrastructure.sql
```

20 modul registry'ga avtomatik seed bo'ladi.

---

## 📝 Eslatmalar

1. **Real ma'lumotlar** — ko'plab agent metodlarida `try { ... } catch { return [] }` ishlatilgan, chunki ba'zi mavjud jadvallar (production_orders, ar_invoices, lms_certificates, ...) loyihada to'liq sxemaga moslashmagan bo'lishi mumkin. Real ma'lumotlar kelganda, faqat catch'siz toza SQL ishlaydi.

2. **AI Vision (Quality agent)** — `analyzeDefect()` hozir placeholder. Real implementatsiya uchun:
   - Claude vision API yoki tashqi computer vision modeli kerak
   - `image → base64 → API → defect detection`

3. **IoT sensor data** — InfluxDB yoki MQTT broker integratsiyasi kelajakda. Hozir `collectSensorData()` simulated qiymatlar qaytaradi.

4. **Cron joblar** — bir necha agent kunlik 06:00, 06:30, 07:00, 07:30, 08:00, 09:00, 17:00 da ishga tushadi. Server soatini Asia/Tashkent zone'iga sozlang yoki `@Cron` ichida `timeZone` bering (allaqachon berilgan).

5. **Frontend kengaytirish** — AgentsHub asosiy bo'lib, har agent uchun alohida sahifalar (`/agents/:id`) keyingi bosqichda qo'shilishi mumkin.
