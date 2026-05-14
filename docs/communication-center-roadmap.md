# Europrint ERP — Kommunikatsiya Markazi + POS Monitor + HR

## ✅ To'liq bajarilgan ish (20 ta vazifa)

---

### 🔧 Communication Center (Coordination) — Backend

| # | Vazifa | Holati | Fayl(lar) |
|---|--------|--------|-----------|
| 1 | DB sxemasi (15 ta jadval + AI sessions) | ✅ | `lib/db/src/schema/communication-center.ts` |
| 2 | SQL migratsiya | ✅ | `apps/api/drizzle/0006_communication_center.sql` |
| 3 | PIN imzolash jadval | ✅ | `apps/api/drizzle/0007_cc_user_pins.sql` |
| 4 | Workflow steps seed (14 hujjat turi) | ✅ | `apps/api/drizzle/0008_cc_workflow_steps_seed.sql` |
| 5 | Vysotskiy 7 funksiya org tuzilma | ✅ | `apps/api/drizzle/0009_vysotskiy_7_otdeleniye_seed.sql` |
| 6 | HR daily reports + AI davomat schema | ✅ | `apps/api/drizzle/0010_hr_daily_reports_attendance.sql` |
| 7 | Workflow engine (sequential + parallel + delegation) | ✅ | `cc-workflow.service.ts` |
| 8 | PIN service (bcrypt + sha256 audit signature) | ✅ | `cc-pin.service.ts` |
| 9 | Document number generator | ✅ | `cc-document-number.service.ts` |
| 10 | Org resolver (CEO, MANAGER_OF_SENDER, DEPT_HEAD, POSITION:CODE) | ✅ | `cc-org-resolver.service.ts` |
| 11 | AI Claude intervyu service | ✅ | `cc-ai-interview.service.ts` |
| 12 | **PDF generator** (kompaniya blanki + imzolar zanjiri + QR URL) | ✅ | `cc-pdf.service.ts` |
| 13 | Socket.IO real-time gateway | ✅ | `cc.gateway.ts` |
| 14 | Cron jobs (24h SLA + escalation + delegation cleanup) | ✅ | `cc-sla.cron.ts` |
| 15 | Telegram bot (komandalar + tasdiqlash flow) | ✅ | `cc-bot.service.ts` |
| 16 | Event listener (cc.spawn) | ✅ | `cc-event.listener.ts` |
| 17 | Webhook endpoint (HMAC-SHA256) | ✅ | `cc-webhook.controller.ts` |

**Endpointlar (jami 25 ta):**
```
GET  /api/cc/baskets/{inbox|pending|outbox|summary|:id}
POST /api/cc/baskets/:id/move
POST /api/cc/pin
GET  /api/cc/pin/status
GET  /api/cc/templates
GET  /api/cc/documents/:id/{rejection-reasons,pdf}
POST /api/cc/documents/draft
POST /api/cc/documents/:id/{send,approve,reject,resubmit,cancel,complaint,print}
POST /api/cc/ai/start
POST /api/cc/ai/sessions/:id/{answer,finalize}
GET  /api/cc/ai/sessions/:id
POST /api/cc/webhooks/:source
```

---

### 🎨 Frontend — Communication Center

| # | Vazifa | Holati | Fayl(lar) |
|---|--------|--------|-----------|
| 1 | CommunicationCenter komponenti (light theme) | ✅ | `components/cc/CommunicationCenter.tsx` |
| 2 | BasketColumn + DocumentCard | ✅ | `components/cc/BasketColumn.tsx` |
| 3 | NewDocumentModal (4 qadamli AI intervyu) | ✅ | `components/cc/NewDocumentModal.tsx` |
| 4 | DocumentDetailModal | ✅ | `components/cc/DocumentDetailModal.tsx` |
| 5 | PinPromptModal | ✅ | `components/cc/PinPromptModal.tsx` |
| 6 | **GlobalInboxBadge** (sidebar headerga qo'shilgan) | ✅ | `components/cc/GlobalInboxBadge.tsx` + `AppShellModern.tsx` |
| 7 | CoordinationPage'ga "baskets" tab integratsiya | ✅ | `pages/CoordinationPage.tsx` |
| 8 | Sidebar linki "Kommunikatsiya Markazi" | ✅ | `components/sidebar/constants.ts` |

---

### 🖥️ POS Monitor — To'liq qayta dizayn

| # | Vazifa | Holati | Fayl(lar) |
|---|--------|--------|-----------|
| 1 | **Light theme transformatsiyasi** (Dark Neon → CRM uslubi) | ✅ | `pos-monitor/styles/pos-theme.css` |
| 2 | PosLoader light fon | ✅ | `pos-monitor/PosMonitorApp.tsx` |
| 3 | PosLogin particles light | ✅ | `pos-monitor/pages/PosLogin.tsx` |
| 4 | PosDashboard movement turi ranglari | ✅ | `pos-monitor/pages/PosDashboard.tsx` |

**CSS o'zgaruvchilari (CRM workspace bilan bir xil):**
```css
--pos-bg:        #F8FAFC      (oq fon)
--pos-card:      #FFFFFF      (oq card)
--pos-accent:    #3B82F6      (ko'k)
--pos-text:      #1E293B      (slate)
--pos-shadow-card: 4px 4px 12px rgba(163,177,198,0.32), -2px -2px 8px rgba(255,255,255,0.80)
```

---

### 📦 Migratsiyalar (DB)

Barcha 17 ta migratsiya muvaffaqiyatli qo'llanilgan, DB'da 749+ jadval mavjud.

**CC asosiy jadvallar (17 ta):**
- `cc_branches`, `cc_document_templates`, `cc_workflow_steps`, `cc_rejection_reasons`
- `cc_documents`, `cc_basket_history`, `cc_approvals`, `cc_attachments`
- `cc_audit_trail`, `cc_document_versions`, `cc_delegations`, `cc_print_log`
- `cc_notifications`, `cc_complaints`, `cc_notification_prefs`, `cc_user_pins`, `cc_ai_sessions`

**HR yangi jadvallar (5 ta):**
- `hr_daily_reports` — kunlik xodim hisobotlari (telegram bot orqali)
- `hr_ai_attendance` — AI kamera davomat hodisalari
- `hr_late_arrivals` — kech qolish hujjatlari
- `hr_user_blocks` — 3 kun sababsiz blok
- `hr_health_alerts` — AI sog'liq kuzatuvi

**Org structure:**
- 7 ta otdeleniye (Vysotskiy modeli) yaratilgan: OTD1-OTD7
- Standart pozitsiyalar: CEO, CFO, HR_HEAD, KASSIR, SECURITY

**CC seed:**
- 14 ta hujjat shabloni (ADVANCE, VACATION, SALARY_RAISE, ...)
- 84 ta rejection reason
- 33 ta workflow step (har shablon uchun)

---

### 📊 Statistika

| Tur | Soni |
|-----|------|
| Yaratilgan/o'zgartirilgan fayl | 30+ |
| DB migratsiyalar | 5 ta yangi (0006-0010) |
| Backend endpoints | 25 ta |
| TypeScript xatolari (mening fayllarimda) | **0** |
| HR/POS/Org seed jadvallar | 22 ta |

---

### 🚧 Kelajakda qilish kerak (ikkinchi bosqich)

Quyidagilar mavjud lekin to'liq integratsiya kerak:

1. **HR daily report bot** — endpoint mavjud (`apps/api/src/modules/hr/daily-report/`) lekin `user_id` vs `employee_id` ziddiyati bor — ikkita schema'ni birlashtirish kerak.
2. **AI camera real integratsiya** — schema (`hr_ai_attendance`) mavjud, lekin kamera yuz aniqlash backend service yo'q.
3. **POS Monitor pre-existing TS errors** — `PosAdminSections.tsx`, `pos-monitor.api.ts` (mening tahrirlarimdan emas).
4. **CC PDF QR rasm** — hozir URL matn shaklida; chiqaruvchi `qrcode` paketi qo'shilsa rasm bo'lishi mumkin.
5. **HR/Inspeksiya AI kamera "ideal rasm"** — har 2 soatda ideal bilan taqqoslash modul kerak.
6. **Rekruter Gemini LIVE intervyu** — WebRTC + Gemini API (eksperimental).

---

### 🔄 Migratsiyalarni qayta ishga tushirish (kerak bo'lsa)

```bash
psql "postgresql://postgres:postgres@localhost:5432/europrint" -f apps/api/drizzle/0006_communication_center.sql
psql "postgresql://postgres:postgres@localhost:5432/europrint" -f apps/api/drizzle/0007_cc_user_pins.sql
psql "postgresql://postgres:postgres@localhost:5432/europrint" -f apps/api/drizzle/0008_cc_workflow_steps_seed.sql
psql "postgresql://postgres:postgres@localhost:5432/europrint" -f apps/api/drizzle/0009_vysotskiy_7_otdeleniye_seed.sql
psql "postgresql://postgres:postgres@localhost:5432/europrint" -f apps/api/drizzle/0010_hr_daily_reports_attendance.sql
```

Hammasi `IF NOT EXISTS` va `ON CONFLICT DO NOTHING` bilan — xavfsiz qayta ishga tushirsa bo'ladi.

---

### 🌍 .env qo'shimchalari

```bash
TELEGRAM_CC_BOT_TOKEN=...        # Coordination Telegram bot
CC_WEBHOOK_SECRET=...            # Webhook HMAC-SHA256
ANTHROPIC_API_KEY=...            # Claude AI intervyu uchun (mavjud bo'lishi kerak)
JWT_SECRET=...                   # Mavjud bo'lishi kerak
PUBLIC_BASE_URL=https://erp.europrint.uz   # PDF QR URL uchun
```

---

### 📝 Qo'shimcha

Backend module (`CommunicationCenterModule`) `app.module.ts`'da ro'yxatdan o'tkazilgan, tayyor.

Frontend Sidebar konfiguratsiyasiga "Kommunikatsiya Markazi" linki qo'shilgan — `coordination?tab=baskets`.

Global Inbox Badge (`<GlobalInboxBadge />`) `AppShellModern.tsx` headeriga qo'shildi — barcha ERP modul sahifalarida ko'rinadi, har 30 sekundda yangilanadi.
