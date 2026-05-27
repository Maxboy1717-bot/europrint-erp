# Ishlamaydigan Kod — To'liq Ro'yxat

**Audit sanasi:** 2026-05-27  
**Root:** `apps/api/src/modules`  
**Jami `notImplemented` chaqiruvlari:** 228 ta (40 fayl)

---

## 1. NOT_IMPLEMENTED / 501 Endpoint'lar

Barcha `return notImplemented(...)` chaqiruvlar HTTP 501 qaytaradi. Quyida fayl bo'yicha to'liq ro'yxat:

### ai moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `ai/presentation/ai.controller.ts` | 181 | GET /ai/forecast/demand |
| `ai/presentation/ai.controller.ts` | 189 | GET /ai/rush-orders |
| `ai/presentation/ai.controller.ts` | 198 | POST /ai/rush-orders/:id/approve |
| `ai/presentation/ai.controller.ts` | 208 | POST /ai/rush-orders/:id/reject |

### ai-agents moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `ai-agents/presentation/ai-agents.controller.ts` | 252 | POST /ai-agents/:agentId/trigger |

### compatibility moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `compatibility/europrint-control-director.controller.ts` | 124 | GET /europrint-control/menus/admin |
| `compatibility/saas.controller.ts` | 132 | GET /saas/tenants/:id/modules |
| `compatibility/saas.controller.ts` | 138 | PATCH /saas/tenants/:id/modules |
| `compatibility/saas.controller.ts` | 144 | POST /saas/tenants/:id/onboard |
| `compatibility/saas.controller.ts` | 156 | GET /orders-registry |
| `compatibility/saas.controller.ts` | 162 | POST /orders-registry |
| `compatibility/warehouse-catalog.controller.ts` | 72 | GET /warehouse/movements |

### design moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `design/presentation/design.controller.ts` | 154 | GET /design/notifications |
| `design/presentation/design.controller.ts` | 160 | GET /design/statistics |
| `design/presentation/design.controller.ts` | 166 | GET /design/tooling |
| `design/presentation/design.controller.ts` | 173 | GET /design/tooling/:id/wear-forecast |
| `design/presentation/design.controller.ts` | 181 | GET /design/orders/:id/messages |

### finance moduli (12 ta)
| Fayl | Satr | Endpoint |
|------|------|----------|
| `finance/presentation/finance-extended-payroll.controller.ts` | 32 | POST /finance-extended/payroll/calculate |
| `finance/presentation/finance-extended-payroll.controller.ts` | 41 | POST /finance-extended/payroll/ai-calculate |
| `finance/presentation/finance-extended-payroll.controller.ts` | 48 | GET /finance-extended/payroll-calculations |
| `finance/presentation/finance-extended-payroll.controller.ts` | 57 | PATCH /finance-extended/payroll-calculations/:id/approve |
| `finance/presentation/finance-extended-payroll.controller.ts` | 66 | POST /finance-extended/payroll-calculations/:id/approve |
| `finance/presentation/finance-extended-payroll.controller.ts` | 73 | GET /finance-extended/payroll-contracts |
| `finance/presentation/finance-extended-payroll.controller.ts` | 80 | GET /finance-extended/payroll-tax-rules |
| `finance/presentation/finance-extended-payroll.controller.ts` | 87 | GET /finance-extended/tax-calendar |
| `finance/presentation/finance-extended-payroll.controller.ts` | 94 | GET /finance-extended/salary-benchmark/:id |
| `finance/presentation/finance-main.controller.ts` | 106 | GET /finance/reports |
| `finance/presentation/finance-main.controller.ts` | 152 | GET /finance/loans |
| `finance/presentation/reports.controller.ts` | 77 | GET /reports/production-efficiency |

### hr moduli (47 ta — eng katta)
| Fayl | Stub soni | Asosiy endpoint'lar |
|------|-----------|---------------------|
| `hr/presentation/hr-dashboard-stubs.controller.ts` | 26 | adaptation, alumni, daily-reports, offboarding, onboarding-checklists, fp-cycle, hrc-tests (employee/public/stats), 360/reviewable, birthdays/settings, ai-interview, documents, employee-corp, operator-stats, enps, abc-analysis, referrals |
| `hr/presentation/hr-dashboard-stubs-write.controller.ts` | 9 | alumni/invite, abc-analysis/calculate, adaptation, ai-interview, birthdays/settings, offboarding, onboarding-checklists, referrals |
| `hr/presentation/hr-compat-a.controller.ts` | 6 | hrc-tests/questions (PATCH/DELETE), employee results, employee-skills DELETE, sessions, questions POST |
| `hr/presentation/hr-employees-ext.controller.ts` | 3 | employees/:id/documents (GET/GET/DELETE) |
| `hr/presentation/hr-dashboard-extra.controller.ts` | 3 | /hr/contracts, /hr-capital/courses, /hr-capital/stats |

### integration moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `integration/integration-employee.controller.ts` | 116 | GET /integration/employee-complaints |
| `integration/integration-employee.controller.ts` | 124 | GET /integration/employee-assessment-skips |
| `integration/integration-employee.controller.ts` | 132 | GET /integration/skill-gap |
| `integration/integration-employee.controller.ts` | 140 | GET /integration/employee-mentorships |
| `integration/integration-employee.controller.ts` | 148 | GET /integration/employee-mes-summary |
| `integration/integration-employee.controller.ts` | 156 | GET /integration/employee-wms-summary |
| `integration/integration-employee.controller.ts` | 164 | GET /integration/expense |
| `integration/integration-employee.controller.ts` | 174 | POST /integration/expense |
| `integration/integration-employee.controller.ts` | 182 | GET /integration/invoice |
| `integration/integration-employee.controller.ts` | 192 | POST /integration/invoice |

### iot moduli (19 ta)
| Fayl | Stub soni | Asosiy endpoint'lar |
|------|-----------|---------------------|
| `iot/presentation/iot-tablet.controller.ts` | 14 | tablet/shift, tablet/sessions (GET/POST), handover, material-kit-items/scan, production-sessions (create/crew/start/stop/defect/evaluation/material-return/inline-qc) |
| `iot/presentation/iot-sensors-main.controller.ts` | 2 | sensors/predictive-maintenance, sensors/alerts/:id/resolve |
| `iot/presentation/iot-main.controller.ts` | 2 | downtime-reason-codes, devices/:id (PATCH) |
| `iot/presentation/iot-alerts.controller.ts` | 1 | POST /iot/alerts |

### kanban moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `kanban/presentation/kanban-cards.controller.ts` | 182 | GET /kanban/chat-messages/:id/files |
| `kanban/presentation/kanban-cards.controller.ts` | 189 | POST /kanban/chat-messages/:id/files |
| `kanban/presentation/kanban-reports.controller.ts` | 236 | GET /kanban/projects |

### lms moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `lms/presentation/lms-misc.controller.ts` | 110 | GET /video-progress |
| `lms/presentation/lms-misc.controller.ts` | 176 | GET /progress |
| `lms/presentation/lms-misc.controller.ts` | 186 | GET /progress/user/:id |
| `lms/presentation/lms-lessons.controller.ts` | 131 | GET /modules |

### marketing moduli (57 ta — eng katta fayl)
Fayl: `marketing/presentation/marketing-analytics-stubs.controller.ts`

Barcha 57 ta endpoint stub — hech biri DB ga tegmaydi:
- NPS (stats, monthly, nps)
- Churn-risk (ai-signal, churn-risk)
- AI (hot-leads, ai-assistant)
- Leads (sources/summary, overdue-leads, contacts, convert-to-crm, delete)
- Inbox (stats, conversations, messages, reply, ai-reply, status)
- A/B tests, competitors
- Budget (GET/POST/byId)
- Calendar (GET/POST/byId)
- Exhibitions (CRUD + leads + QR)
- PR (GET/POST/byId)
- Settings (GET/POST/social-api CRUD/telegram-webhook)
- Website/Blog (CRUD + ai-generate + publish)
- Overview, recalculate-scores, settings/:id

### mm (Material Management) moduli (19 ta)
| Fayl | Stub soni | Endpoint'lar |
|------|-----------|--------------|
| `mm/presentation/mm-dashboard.controller.ts` | 16 | vendor-invoices (CRUD+approve+match+payment), three-way-match, fleet (maintenance/deliveries/status), vehicle-locations, driver-expenses, materials/:id/suppliers |
| `mm/presentation/mm-purchase-orders.controller.ts` | 3 | GET/:id, DELETE/:id, PATCH/:id |

### org-structure moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `org-structure/org-structure.controller.ts` | 222 | GET /org-structure/nodes/:nodeId/history |
| `org-structure/org-structure.controller.ts` | 231 | GET /org-structure/nodes/:nodeId/hr-requests |
| `org-structure/org-structure.controller.ts` | 242 | POST /org-structure/nodes/:nodeId/hr-requests |

### pos moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `pos/presentation/pos-stub.controller.ts` | 112 | GET /pos/sales/daily |
| `pos/presentation/pos-stub.controller.ts` | 116 | GET /pos/inventory/low-stock |
| `pos/presentation/pos-stub.controller.ts` | 120 | GET /pos/inventory/movements |
| `pos/presentation/pos-stub.controller.ts` | 124 | GET /pos/inventory/monthly-report |
| `pos/presentation/stock.controller.ts` | 103 | GET /pos/stock/movements |

### pp moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `pp/technology/technology.controller.ts` | 107 | GET /technology/cards |
| `pp/technology/technology.controller.ts` | 114 | POST /technology/cards/generate |
| `pp/technology/technology.controller.ts` | 121 | GET /technology/cards/:id |
| `pp/technology/technology.controller.ts` | 128 | POST /technology/cards/:id/optimize |
| `pp/production/production-reports.controller.ts` | 81 | GET /production-reports/orders |

### qc moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `qc/presentation/qc-new.controller.ts` | 116 | GET /qc/control-charts |
| `qc/presentation/qc-defects.controller.ts` | 129 | GET /qc/braks/cost-impact |
| `qc/presentation/qc-defects.controller.ts` | 137 | GET /qc/pending/qc |

### remaining moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `remaining/material-balance.controller.ts` | 123 | GET /material-balance/movements |

### sd moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `sd/presentation/sd-customers.controller.ts` | 402 | POST /sd/customers/:id/complaints |

### security moduli
| Fayl | Satr | Endpoint |
|------|------|----------|
| `security/presentation/security.controller.ts` | 189 | GET /security/daily-summary |
| `security/presentation/security.controller.ts` | 195 | GET /security/fire-sensors |
| `security/presentation/security.controller.ts` | 201 | GET /security/ppe-checks |
| `security/presentation/security.controller.ts` | 207 | GET /security/ppe-stats |
| `security/presentation/security.controller.ts` | 213 | GET /security/ppe-violations |

### wms moduli (17 ta)
| Fayl | Stub soni | Endpoint'lar |
|------|-----------|--------------|
| `wms/presentation/wms-barcode.controller.ts` | 8 | printer-config (CRUD), material-kits (GET/POST/status/items) |
| `wms/presentation/wms-integration.controller.ts` | 6 | mm/pending-deliveries, mm/reorder-suggestions, fi/stock-valuation, integration/summary, integration (GET/POST) |
| `wms/presentation/wms-catalog.controller.ts` | 2 | /warehouse/transactions, /warehouse/orders-by-date/:date |
| `wms/presentation/iot-enhanced.controller.ts` | 1 | GET /iot-enhanced/orders |

---

## 2. TODO/FIXME Marker'lar

| Fayl:Satr | Xabar | Tur |
|-----------|-------|-----|
| `finance/infrastructure/event-handlers/wms-fg-received.listener.ts:22` | TODO PA2-18: emit-side payload gap | TODO |
| `director/infrastructure/event-handlers/advance-bypass-approved.listener.ts:13` | TODO PA0: Logger-only audit — persist etilmaydi | TODO |
| `hr/recruitment/recruitment-funnel.service.ts:49` | TODO H.9-FOLLOW-UP: Funnel.create() va persist yo'q | TODO |
| `hr/recruitment/recruitment-funnel.service.ts:206` | TODO H.9-FOLLOW-UP: RecruitmentGateway subscribe yo'q | TODO |
| `logistics/infrastructure/event-handlers/order-status-changed-delivery.listener.ts:53` | TODO PA2-18: payload gap | TODO |
| `logistics/infrastructure/event-handlers/order-created-delivery.listener.ts:59` | TODO PA2-18: customerName + deliveryAddress yo'q | TODO |
| `iot/infrastructure/repositories/drizzle-iot-tablet.repo.ts:65` | TODO P3-31: worker_equipment_assignments jadvali yo'q | TODO |
| `iot/infrastructure/repositories/drizzle-iot-tablet.repo.ts:194` | TODO P3-31: shift_types FK muammosi | TODO |
| `iot/infrastructure/repositories/drizzle-iot-tablet.repo.ts:231` | TODO P3-31: sos_alerts jadvali schema'da bor, lekin wire yo'q | TODO |
| `iot/application/iot-tablet.service.ts:55` | TODO P3-31: QR-token auth yo'q | TODO |
| `mro/infrastructure/event-handlers/machine-stopped.listener.ts:36` | TODO PA2-18: event payload to'liq emas | TODO |
| `notifications/domain/services/telegram.service.ts:8` | TODO: delete this file — no consumers | TODO |
| `notifications/domain/services/sms.service.ts:6` | TODO: delete this file — no consumers | TODO |
| `crm/presentation/crm-deals.controller.ts:57` | TODO PA1-11: createQuickDeal CreateDealsCommand'ga o'tkazilmagan | TODO |
| `agents/production-agent.service.ts:34` | calculateOEE hardcoded 0.92/0.85/0.97 qaytaradi | TODO |
| `lms/infrastructure/event-handlers/cert-expiry.handler.ts:33` | TODO PA2-18: CertificateExpiredEvent hech kim publish qilmaydi | TODO |
| `pos/presentation/pos-stub.controller.ts:128` | TODO P3-26: migrate to /pos-v2/inventory | TODO |
| `storage/storage.module.ts:5` | TODO PA3-17: tiny-module merge candidate | TODO |
| `remaining/acl/*.ts` (14 ta fayl) | TODO PA2-14: typed Repository yo'q | TODO |
| `compatibility/acl/*.ts` (20+ ta fayl) | TODO PA2-14: drop once typed Repository ships | TODO |

---

## 3. Stub Return (DB write yo'q)

### `return { id: Date.now(), ...body }` pattern — DB ga yozmaydi

| Fayl | Satr | Endpoint | Xavf |
|------|------|----------|------|
| `design/presentation/design.controller.ts` | 191 | POST /design/orders/:id/approve | YUQORI — Dizayn tasdiqlash fake ID bilan |
| `design/presentation/design.controller.ts` | 202 | POST /design/orders/:id/messages | YUQORI — Xabar saqlanmaydi |
| `wms/presentation/wms-warehouse-gateway.controller.ts` | 205 | POST /warehouse/receipts/:id/items | YUQORI — Qabul item'i saqlanmaydi |
| `wms/presentation/inventory-materials.controller.ts` | 115 | POST /warehouse/materials | O'RTA — Material yaratilmaydi |
| `integration/sap/sap.controller.ts` | 87 | POST /integration/sap/... | YUQORI — SAP sync ishlaydi ko'rinadi, aslida yo'q |
| `crm/presentation/crm-leads.controller.ts` | 178 | POST /crm/leads/:id/messages | O'RTA — Lead xabari saqlanmaydi |
| `general/controllers/general-legacy-b.controller.ts` | 190 | POST (general endpoint) | O'RTA |
| `finance/presentation/gl-standalone.controller.ts` | 59 | POST /finance/gl/... | YUQORI — GL entry saqlanmaydi |
| `finance/presentation/finance-extended-income.controller.ts` | 86, 103 | POST /finance-extended/income/* | YUQORI |
| `compatibility/asset-management.controller.ts` | 192 | POST /assets/insurance | O'RTA |
| `iot/presentation/iot-sensors-main.controller.ts` | 145 | POST /iot/sensors/alerts | YUQORI |

### `return []` — bo'sh massiv, DB call yo'q

| Fayl | Satr | Metod | Xavf |
|------|------|-------|------|
| `wms/presentation/wms-extended.controller.ts` | 170 | `async getMovements()` | YUQORI — WMS harakatlar ko'rsatilmaydi |

### Hardcoded random/fake data

| Fayl | Satr | Tavsif | Xavf |
|------|------|--------|------|
| `design/infrastructure/repositories/design-extended.repository.ts` | 88 | `verifyDesign()` — `Math.random()` bilan "sifat tekshiruvi" | YUQORI — AI dizayn verify fake |
| `design/infrastructure/repositories/design-extended.repository.ts` | 91-93 | `generateMockup()` — `/mockups/...png` URL hardcoded, fayl yo'q | YUQORI |
| `design/infrastructure/repositories/design-extended.repository.ts` | 95-101 | `approveDesign` / `rejectDesign` — DB'ga yozmaydi | YUQORI |
| `agents/production-agent.service.ts` | 91-92 | `calculateOEE` — `a=0.92, p=0.85, q=0.97` hardcoded | O'RTA |

---

## 4. Bo'sh/Minimal Frontend Sahifalar

Frontend `src/pages/` katalogida barcha fayllar `.smoke.test.tsx` test fayllari ekan — asosiy sahifa fayllar boshqa joylarda. "Coming soon" yoki bo'sh sahifalar topilmadi.

Lekin backend stub endpoint'lari bilan bog'langan frontendda quyidagi sahifalar ishlaydi ko'rinadi, aslida backend 501 qaytaradi:
- Marketing sahifalari (NPS, churn-risk, budget, calendar, exhibitions, PR, website/blog)
- HR dashboard (contracts, capital courses/stats, offboarding, adaptation)
- Finance Extended (payroll, tax calendar, salary benchmark)
- IOT Tablet sahifasi (barcha production session action'lari)

---

## 5. Console.log Qoldiq Debug

Backend `apps/api/src/modules` ichida `console.log/error/warn` topilmadi (0 ta). Logger (NestJS Logger / custom Logger) ishlatilgan — bu yaxshi amaliyot.

---

## 6. Modul bo'yicha Stub Nisbati

| Modul | Stub (notImplemented) | Qo'shimcha stub return | Jami stub | Eslatma |
|-------|-----------------------|------------------------|-----------|---------|
| **marketing** | 57 | 0 | **57** | Butun modul stub — hech narsa ishlaydi |
| **hr** | 47 | 0 | **47** | dashboard-stubs, stubs-write, compat-a, employees-ext |
| **iot** | 19 | 1 | **20** | Tablet barcha action'lari stub |
| **mm** | 19 | 0 | **19** | vendor-invoices, fleet, purchase-orders |
| **wms** | 17 | 2 | **19** | barcode, integration, catalog, + fake return |
| **finance** | 12 | 2 | **14** | payroll butun stub, gl-standalone fake return |
| **integration** | 10 | 0 | **10** | expense, invoice, employee summaries |
| **design** | 5 | 4 | **9** | notifications/stats/tooling stub + fake verifyDesign |
| **pos** | 5 | 0 | **5** | sales/daily, inventory endpoints |
| **compatibility** | 7 | 1 | **8** | saas, warehouse-catalog, asset-management |
| **security** | 5 | 0 | **5** | PPE, fire-sensors, daily-summary |
| **pp** | 5 | 0 | **5** | technology cards, production-reports |
| **ai** | 4 | 0 | **4** | forecast/demand, rush-orders |
| **lms** | 4 | 0 | **4** | progress, video-progress, modules |
| **qc** | 3 | 0 | **3** | control-charts, cost-impact, pending/qc |
| **org-structure** | 3 | 0 | **3** | nodes history, hr-requests |
| **kanban** | 3 | 0 | **3** | chat-message files, projects |
| **ai-agents** | 1 | 0 | **1** | agentId/trigger |
| **sd** | 1 | 0 | **1** | customers/complaints |
| **remaining** | 1 | 0 | **1** | material-balance/movements |
| **JAMI** | **228** | **10** | **238** | |

---

## 7. Hardcoded Mock Data

### Backend
| Fayl | Satr | Mock turi | Muammo |
|------|------|-----------|--------|
| `agents/production-agent.service.ts:91-92` | — | OEE hardcoded `0.92/0.85/0.97` | MES ma'lumotlari o'qilmaydi |
| `design/infrastructure/repositories/design-extended.repository.ts:88` | — | `Math.random()` bilan verify score | Sifat tekshiruvi ishonarsiz |
| `design/infrastructure/repositories/design-extended.repository.ts:81` | — | `Array.from({length:count})` fake dizaynlar | AI generatsiya simulyatsiya |
| `design/infrastructure/repositories/design-extended.repository.ts:92` | — | `/mockups/${id}.png` — fayl yo'q | Broken URL |
| `design/infrastructure/repositories/design-extended.repository.ts:95-101` | — | approve/reject — faqat `Ok({id, status})` | DB update yo'q |

### Frontend
| Fayl | Mock turi |
|------|-----------|
| `pages/SuperAdminPanelSections.tsx:22` | Inline hardcoded array literal (id bilan) |

---

## 8. O'chirish Kerak bo'lgan Fayllar (TODO: delete)

| Fayl | Sabab |
|------|-------|
| `notifications/domain/services/telegram.service.ts` | "No consumers import from this path. TODO: delete" |
| `notifications/domain/services/sms.service.ts` | "No consumers import from this path. TODO: delete" |

---

## Xulosa

**Eng kritik muammolar:**

1. **Marketing moduli** — 57 ta endpoint, hammasi stub. Modul deployment ga tayyor emas.
2. **IOT Tablet** — production session'larini boshlatish/to'xtatish/defect/QC hammasi stub. Ishlab chiqarish monitoring ishlamaydi.
3. **Finance Payroll** — 9 ta stub. Ish haqi hisoblanmaydi.
4. **WMS/MM Integration** — Material harakatlar, vendor-invoices, fleet management hammasi stub.
5. **Design verify/approve** — `Math.random()` bilan "sifat tekshiruvi" — xavfli, ishonarsiz natijalar.
6. **`return { id: Date.now() }` pattern** — 11 ta joyda DB yozmay fake ID qaytaradi. Data loss xavfi yuqori.
