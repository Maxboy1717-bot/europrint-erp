# Agent 15 — AI Modullar va Agentlar: Asl Holat Tahlili (2026-06-02)

> READ-ONLY tahlil. Kod (Read/Grep, fayl:satr) + jonli DB (`europrint`@127.0.0.1:5432, `node _audit/q.cjs`) bilan tasdiqlangan.
> Savol: AI qancha integratsiyalashgan / real, qancha stub/placeholder?

---

## 0. QISQA XULOSA (TL;DR)

EuroPrint'da AI **arxitektura sifatida juda keng yozilgan** (4 ta alohida modul daraxti, ~145 endpoint, 40+ DB jadval, 54 FE fayl), lekin **amalda deyarli ishlatilmagan** va bitta tirik LLM provayderga (Claude) tayanadi.

- **LLM provayderlar:** 3 ta kod yo'li bor (OpenAI/Gemini/Claude), lekin jonli `.env`da **faqat `ANTHROPIC_API_KEY` to'ldirilgan** (haqiqiy `sk-ant-...` kalit, `apps/api/.env:57`). `OPENAI_API_KEY` va `GOOGLE_API_KEY` **bo'sh**; Gemini uchun kerakli nom (`GEMINI_API_KEY` / `GOOGLE_AI_API_KEY` / `AI_INTEGRATIONS_GEMINI_API_KEY`) **umuman o'rnatilmagan**. → Amalda **faqat Claude javob bera oladi**.
- **Env nomlari parchalangan (3 xil Gemini nomi):** `ai-router` `GEMINI_API_KEY` o'qiydi; `aisha` `GOOGLE_AI_API_KEY` o'qiydi; `env.schema`+`hr ai-interview`+`reference-image cron` `AI_INTEGRATIONS_GEMINI_API_KEY` o'qiydi — **bittasi ham bir-biriga mos kelmaydi**.
- **Jonli DB — AI hech qachon ishlatilmagan:** `ai_usage_logs=0`, `ai_decision_log=0`, `aisha_conversations=0`, `aisha_tool_calls=0`, `ai_providers_config=0`, `ai_prompts=0`, `ai_insights=0`, `forecast_series=0`, `ai_planning_plans=0`, `camera_ai_configs=0`. Faqat `agent_modules_registry=20` (seed) va `ai_interview_sessions=5` (test).
- **AIsha:** Director panelga ULANGAN (DirectorDashboard.tsx:143/232/235). Matn-chat Claude bilan **real ishlaydi** (kalit bor). Lekin **ovoz** (Whisper STT + ElevenLabs TTS + Picovoice wake) kalitlari bo'sh → ovoz qismi runtimeda ishlamaydi.
- **14 ta "AI agent":** faqat **5 tasi Claude chaqiradi** (director, lead-scoring, hr-performance, strategic, marketing); qolgan **9 tasi pure SQL/evristika/placeholder** (IoT/sensor, RUL, OEE, sifat-vision, xo'jalik = qattiq kodlangan qiymatlar). "14 AI agent" nomi **yarim-haqiqat** — ko'pchiligi AI emas, SQL hisobotchi.
- **AI kamera:** Aisha `analyze-camera-feed` tool — **haqiqiy Claude vision** (real base64 yuboradi). `reference-image-compare` cron — Gemini, lekin kalit yo'q VA `fileUri` ichki URL bilan strukturaviy buzuq.

**Bir jumlada:** AI "hamma joyda" — lekin asosan *skelet* sifatida. Bitta provayder (Claude) tirik, 2 tasi o'lik (kalit yo'q), runtime ma'lumotlari nol, va e'lon qilingan 14 agentning ~64% (9/14) AI emas.

---

## 1. AI MODUL DAraxtlari (4 ta alohida)

`apps/api/src/feature-modules.ts`da **4 ta AI moduli alohida ro'yxatdan o'tgan** (hammasi `app.module.ts`ga ulangan):

| Modul | Fayl | feature-modules.ts | Mazmuni |
|---|---|---|---|
| **AiModule** | `modules/ai/ai.module.ts` | :38 | AI Router + 15 controller (HR/CRM/Finance/WMS/Director/Marketing/Automation/Exam/Planning/Reservation/Insights/GPT/Forecast) |
| **AiAgentsModule** | `modules/ai-agents/ai-agents.module.ts` | :39 | 6 ta "kopilot" (sales/prepress/planner/mes/vision-qc/logistics) |
| **AgentsModule** | `modules/agents/agents.module.ts` | :44 | 14 ta "AI agent" service + 1 controller |
| **AishaModule** | `modules/aisha/aisha.module.ts` | :42 | Direktor ovozli AI yordamchisi + 25 tool |

> ⚠️ **Konseptual dublikat:** `modules/agents` (14 agent) va `modules/ai-agents` (6 kopilot) — ikkalasi ham "AI agent" deb ataladi, lekin alohida kod bazasi, alohida controller (`/api/agents/*` va `/api/ai-agents/*`), alohida audit jadvallari (`agents_audit_log` va `ai_decision_log`). Bu bo'linish FE'da ham aks etadi (`pages/agents/*` va `pages/AIAgentsPage.tsx`).

---

## 2. LLM PROVAYDER QATLAMI — REAL kod, lekin 1 ta tirik kalit

### 2.1 Kod yo'llari (hammasi real SDK chaqiruvi)

Ikkita mustaqil LLM chaqiruv qatlami bor, ikkalasi ham **haqiqiy SDK** ishlatadi (dinamik `import`):

**A. `modules/ai` — `AiRouterCallService` + `AiRouterService`** (`application/services/`):
- `callOpenAi()` → `openai` SDK, model `gpt-4o-mini` (`ai-router-call.service.ts:30`, `ai-router.service.ts:162`)
- `callGemini()` → `@google/generative-ai`, `gemini-1.5-flash` (:60 / :209)
- `callClaude()` → `@anthropic-ai/sdk`, `claude-3.7` (:89 / :224)
- `AiRouterService.call()` byudjet tekshiradi (`DAILY_BUDGET_USD=50`), provayder tartibini quradi, **fallback** qiladi, `ai_usage_logs`ga yozadi (`ai-router.service.ts:43-80`).

**B. `modules/aisha` — hex-arch portlar** (`infrastructure/external/`):
- `ClaudeAdapter` (`claude.adapter.ts`) — `IClaudePort`, streaming + tool-use + vision; `withRetry` (3 urinish, 30s timeout); `streamWithTools()` + `sendOneShot()`.
- `GeminiAdapter` (`gemini.adapter.ts`) — `IGeminiPort`, fallback (faqat matn).
- `ClaudeService`/`GeminiFallbackService` — eski **shim**lar (faqat adapterga delegate; `@deprecated`).

> Bular **stub emas** — to'liq, retry/timeout/cost-logging bilan yozilgan ishlab chiqarish darajasidagi adapterlar.

### 2.2 Jonli kalitlar — FAQAT Claude tirik

`apps/api/.env:56-59` (jonli, mahalliy):
```
ANTHROPIC_API_KEY=***ANTHROPIC-KEY-REMOVED***roj...   ← REAL, to'ldirilgan
OPENAI_API_KEY=                              ← BO'SH
GOOGLE_API_KEY=                              ← BO'SH (va bu nom hech qayerda o'qilmaydi!)
```

Natija (provayderlar bo'yicha):

| Provayder | Kalit holati | Amaliy natija |
|---|---|---|
| **Claude (Anthropic)** | ✅ Bor | **ISHLAYDI** — `callClaude` va Aisha chat real javob beradi |
| **OpenAI** | ❌ Bo'sh | `callOpenAi` → `Err('OPENAI_API_KEY konfiguratsiyasi yo'q')`; Whisper STT ishlamaydi |
| **Gemini** | ❌ Mos nom yo'q | Barcha Gemini yo'llari `Err` |

### 2.3 🔴 Env nomi PARCHALANISHI (kritik integratsiya nuqsoni)

Gemini uchun kodda **3 xil env nomi** ishlatiladi, va `.env`da **bittasi ham yo'q**:

| Fayl:satr | O'qiydigan nom | `.env`da bormi? |
|---|---|---|
| `ai-router-call.service.ts:61`, `ai-router.service.ts:210` | `GEMINI_API_KEY` | ❌ |
| `aisha/config/aisha.config.ts:40` | `GOOGLE_AI_API_KEY` | ❌ |
| `config/env.schema.ts:24`, `hr/ai-interview-v2/gemini-live.gateway.ts:83`, `cron/reference-image-compare.cron.ts:41` | `AI_INTEGRATIONS_GEMINI_API_KEY` | ❌ |

`.env`dagi `GOOGLE_API_KEY` (bo'sh) esa **hech qaysi kod tomonidan o'qilmaydi**. → Agar egasi Gemini'ni yoqmoqchi bo'lsa, qaysi nomni to'ldirishni bilmaydi; aslida 3 ta nomni ham to'ldirishi kerak. Bu **konfiguratsiya tuzog'i**.

### 2.4 ⭐ Fallback dizayni — Claude amalda HAMMA narsa uchun ishlaydi

`ai.types.ts:141`: `PROVIDER_FALLBACK = ['gemini', 'openai', 'claude']`. `buildProviderOrder` (`ai-router.service.ts:62`) avval afzal provayderni, keyin qolganlarini sinaydi. `TASK_PROVIDER_MAP` (40 task, :85-127) ko'pini gemini/openai'ga yo'naltirgan, lekin:

> Har qanday task: afzal (gemini/openai) → `Err` (kalit yo'q) → fallback gemini → openai → **claude (kalit bor) → JAVOB**.

Demak `AiRouterService.call()`ni ishlatadigan `ai-agents` (vision-qc, prepress, sales-copilot) `provider:'gemini'` so'rasa ham, **oxir-oqibat Claude javob beradi**. Bu yashirin lekin ishlaydigan xatti-harakat. ⚠️ **Ammo** vision-qc/prepress rasmni **URL matni** sifatida yuboradi (haqiqiy piksel emas) → Claude rasmni ko'rmaydi, ΔE/defektlarni **to'qiydi** (pastga qarang).

---

## 3. ENDPOINT INVENTARIZATSIYASI (~145 AI route)

| Modul | Controllerlar | Route dekoratori (taxminiy) |
|---|---|---|
| `modules/ai` | 15 ta (`ai`,`ai-hr`,`ai-crm`,`ai-finance`,`ai-wms`,`ai-director`,`ai-marketing`,`ai-automation`,`ai-exam`,`ai-hr-new`,`ai-planning`,`ai-reservation`,`insights`,`gpt`,`forecast-ext`) | **87** (`@Get/@Post/...`) |
| `modules/agents` | 1 ta (`agents.controller.ts`) | **51** (`/api/agents/*` — 14 agent) |
| `modules/ai-agents` | 1 ta (`ai-agents.controller.ts`) | **~14** (`/api/ai-agents/*`) |
| `modules/aisha` | 4 ta (`chat`,`voice`,`wake-config`,`sse-gateway`) | **6** (`/api/aisha/*`) |
| **JAMI** | **21 controller** | **~158 route** |

Hammasi guard bilan himoyalangan (`@UseGuards(JwtAuthGuard/RolesGuard)` + `@Roles(...)`), `@AiThrottle()` (LLM qimmat → rate-limit). **Guardsiz/`@Public` AI endpoint topilmadi** — xavfsizlik bu jihatda toza.

---

## 4. `modules/ai` — 15 controller: REAL vs STUB

### 4.1 ISHLAYDI (real)
- **`POST /api/ai/call`** (`ai.controller.ts:54`) — `AiRouterService.call()` → Claude'ga ketadi, `ai_usage_logs`ga yozadi. **REAL** (kalit bor).
- **`GET /api/ai/budget`** (:108) — `getUsageStats()` real DB agregatsiya (`ai_usage_logs`). **REAL** (lekin jadval bo'sh → 0 qaytaradi).
- **`AiPlanningService`** (`application/services/ai-planning.service.ts`) — `ai_planning_plans` jadvali ustida **CRUD** (create/approve/reject/execute/reschedule). **QISMAN**: workflow real, lekin "AI" yo'q — `getBatchGroups()` qattiq kodlangan `Mashina №1/№2` mock qaytaradi (:65-68); `getDashboard.avgMachineUtilization:84` hardcoded (:42); jadval bo'sh.
- HR/CRM/Finance/WMS/Director/Marketing AI servislari (`services/*-ai.service.ts`) — Drizzle repolar bilan, `AiRouterCallService` orqali Claude chaqiradi (insight matn generatsiyasi). **REAL kod**, lekin runtime ma'lumotlari nol (`ai_insights=0`, `ai_finance_insights=0`).

### 4.2 QISMAN-STUB / YO'Q (`ai.controller.ts` ichida)
- **`GET /ai/bottleneck/analysis`** (:169) → `{ bottlenecks: [], analyzedAt }` — **bo'sh stub**.
- **`GET /ai/forecast/demand`** (:176) → `notImplemented()` (501) — **YO'Q** (`#FX-5` deb belgilangan).
- **`GET /ai/rush-orders`** (:184) → `notImplemented()` (501) — **YO'Q**.
- **`POST /ai/rush-orders/:id/approve`** (:192), **`/reject`** (:201) → `notImplemented()` (501) — **YO'Q**.
- **`GET /ai/shift/recommendations`** (:211) → `{ recommendations: [] }` — **bo'sh stub**.

> Ya'ni `/api/ai/*` asosiy controllerda 7 routedan **2 tasi real** (call, budget), **5 tasi stub/501**. FE'da bularga mos sahifalar bor: `ai-planning/DemandForecastingPage.tsx`, `RushOrderPage.tsx`, `BottleneckAnalysisPage.tsx`, `AIShiftManagementPage.tsx` — ya'ni **FE tayyor, BE stub** (kontrakt drift).

---

## 5. AISHA — Direktorning ovozli AI yordamchisi

### 5.1 Holat: ULANGAN + matn-chat REAL, ovoz O'LIK

**Frontend ulanishi (tasdiqlangan):** `DirectorDashboard.tsx`:
- `:143` `<AIAdvisor />` — tez-savol chat (`POST /api/agents/director/ask`)
- `:232` `<AishaChatPanel isDirector />` — pastki-o'ng burchakdagi suzuvchi chat
- `:235` `<AishaPanel isDirector />` — wake-word orb paneli

→ "Director panelda Aisha bor" — **HA, tasdiqlandi** (3 ta komponent).

**Matn-chat (`POST /api/aisha/chat`, `chat.controller.ts`):**
- Kalit yo'q bo'lsa → muloyim stub ("AIsha hali sozlanmagan") (:67-76).
- `ANTHROPIC_API_KEY` bor bo'lsa → `claude.streamWithTools()`, 25 toolni Claude'ga taqdim etadi, javobni yig'adi (:93-107). **REAL** (kalit bor → ishlaydi).
- ⚠️ Lekin "tool-result dispatch **intentionally deferred**" (:88) — Claude toolni *so'raydi*, lekin chat controller toolni *bajarmaydi* (faqat nomini qaytaradi). To'liq tool-loop faqat SSE gateway'da.

**Frontend hook (`useAisha.ts`):** `POST /api/aisha/chat`, `GET /api/aisha/wake/config`, SSE `/api/aisha/stream/:id`, brauzer SpeechRecognition (mikrofon). To'liq yozilgan, Zod bilan validatsiya.

### 5.2 25 ta AIsha tool (`aisha.module.ts:100-108`)

Ro'yxatdan o'tgan 25 tool: `analyze_camera_feed`, `assign_task`, `compare_periods`, `create_reminder`, `detect_safety_violations`, `detect_workers_in_area`, `forecast_demand`, `generate_kpi_report`, `get_active_alerts`, `get_camera_snapshot`, `get_customer_info`, `get_employee_info`, `get_financial_summary`, `get_inventory_levels`, `get_machine_state_via_vision`, `get_machine_status`, `get_order_status`, `get_production_status`, `get_quality_metrics`, `get_today_briefing`, `list_available_cameras`, `schedule_meeting`, `send_email`, `send_telegram_to_team`, `what_if_simulation`.

- **`analyze_camera_feed`** (`analyze-camera-feed.tool.ts`) — **HAQIQIY Claude vision**: kamera kadrini base64 olib, `{type:'image', source:{base64}}` bilan `claude.sendOneShot` chaqiradi (:60-67). Provenance (kamera vaqti + model). **REAL multimodal** (agar `CameraSnapshotProvider` ulangan bo'lsa; `@Optional` → ulanmagan bo'lsa `Err`).
- Boshqa toollar (`get_financial_summary`, `get_inventory_levels` h.k.) — ERP DB'dan o'qish (provenance bilan). Ko'pi real DB query.

### 5.3 Ovoz pipeline — kalitlar BO'SH → O'LIK

`aisha.config.ts:61-77` `isFullyConfigured()` 7 kalit talab qiladi: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `PICOVOICE_ACCESS_KEY`, `GOOGLE_AI_API_KEY`, `AISHA_DIRECTOR_USER_ID`.

`.env`da bularning **faqat `ANTHROPIC_API_KEY` bor** → `isFullyConfigured()=false` → boot'da warn, ovozli yordamchi o'chiq:
- **Whisper STT** (`whisper.service.ts:41`) — `openaiKey` bo'sh → `transcribe` runtimeda `Err`.
- **ElevenLabs TTS** — `elevenLabsKey` bo'sh → ishlamaydi.
- **Picovoice wake-word** — `picovoiceKey` bo'sh → wake config bo'sh.

→ **AIsha = matn-chat ishlaydi (Claude), ovoz ishlamaydi.**

### 5.4 DB: Aisha hech qachon ishlatilmagan
`aisha_conversations=0`, `aisha_tool_calls=0`, `aisha_voice_audit=0`, `aisha_pending_approvals=0`. → Aisha jonli DB'da bironta suhbat yozmagan.

---

## 6. 14 TA "AI AGENT" (`modules/agents`) — faqat 5 tasi AI

`agents.controller.ts` (`/api/agents/*`, 51 route) 14 ta agent servisni ulaydi. **Faqat 5 tasi Claude chaqiradi** (grep `this.ai.callClaude`):

### 6.1 ✅ LLM (Claude) ishlatadigan agentlar (5)
| # | Agent | Fayl:satr | Claude nima uchun |
|---|---|---|---|
| 1 | **Director** | `director-agent.service.ts:140,163` | KPI xulosa (`director.kpi_explain`) + strategik maslahat (`askAdvisor`) |
| 2 | **Lead-scoring** | `lead-scoring-agent.service.ts:65` | Tijorat taklifi HTML generatsiyasi |
| 7 | **HR-performance** | `hr-performance-agent.service.ts:72` | Ishlash tahlili matni |
| 10 | **Marketing** | `marketing-agent.service.ts:37` | Kontent generatsiyasi |
| 14 | **Strategic** | `strategic-agent.service.ts:26` | Ssenariy tahlili |

> Bular ham asosan **SQL + ustiga Claude matn izohi**. Masalan lead-scoring **ball**ini SQL evristika hisoblaydi (source+age, :45-49), Claude faqat taklif matnini yozadi. Director KPI'ni SQL'dan oladi (6 ta query), Claude faqat 3-5 jumlalik xulosa yozadi (kalit yo'q bo'lsa → standart matn, :138-148).

### 6.2 🟡 LLM YO'Q — SQL/evristika (4)
- **Inventory** (forecast/ABC/critical/rolls) — SQL.
- **Cashflow** (cashflow/overdue/fraud) — SQL evristika.
- **Supplier** (scores/risks) — SQL.
- **Security** (access-attempts/audit-anomalies) — SQL.
- **LMS** (progress/expiry) — SQL.

### 6.3 🔴 PLACEHOLDER — qattiq kodlangan soxta qiymatlar (grep `placeholder|simulated|hardcoded`)
| Agent | Fayl:satr | Muammo |
|---|---|---|
| **IoT/Kamera** | `iot-agent.service.ts:32-54` | `collectSensorData` → qattiq `{vibration:1.2,temp:65.5,current:12.3}`; `detectAnomalies` shu soxta qiymatda; `predictFailure` (RUL) → qattiq `{daysLeft:60,confidence:0.85}`. **"InfluxDB kelajakda"** izohi. |
| **Quality** | `quality-agent.service.ts:24-28` | "AI Vision defect detection **placeholder**", "**simulated response**" |
| **Production** | `production-agent.service.ts:34-39,114` | `calculateOEE` — availability `downtime_events`dan REAL, lekin performance=0.85, quality=0.97 **qattiq kodlangan** (TODO `mes_machine_logs`) |
| **Facilities** | `facilities-agent.service.ts:25,39` | Utility bills + ofis materiallar **placeholder** |
| **Strategic** | `strategic-agent.service.ts:58` | Bitta "Placeholder" bo'limi |

### 6.4 Xulosa (14 agent)
- **5** Claude ishlatadi (lekin ko'pi SQL+izoh)
- **5** pure SQL (AI emas, hisobotchi)
- **~4** placeholder/qattiq-kod (IoT, Quality-vision, Facilities, Production-OEE qisman)
- **DB:** `agent_alerts=0`, `agents_audit_log` — agentlar jonli ishlatilmagan (faqat `agent_modules_registry=20` seed).

> ⚠️ **"14 AI agent" da'vosi yarim-haqiqat.** Aniqrog'i: 14 ta *avtomatlashtirilgan service* (cron bilan), ulardan ~5 tasi LLM, qolgani SQL yoki soxta.

---

## 7. `modules/ai-agents` — 6 ta kopilot

`ai-agents.controller.ts` (`/api/ai-agents/*`, ~14 route):

| Kopilot | Fayl | Holat |
|---|---|---|
| **Sales Copilot** | `sales/sales-copilot.service.ts:160` | `ai.call({provider:'gemini', crm.next_best_action})` → fallback Claude. Narx/chegirma evristika + LLM izoh. **QISMAN** |
| **Prepress Assistant** | `prepress/prepress-assistant.service.ts:113,173` | `ai.call({provider:'gemini', prepress.vision_preflight})` — rasmni **URL matn** sifatida yuboradi (haqiqiy piksel emas). **QISMAN-SOXTA** |
| **AI Planner** | `planning/planner.service.ts` | **REAL algoritm**: Johnson's rule + CPM (forward/backward pass) + EOQ. LLM YO'Q, lekin matematik haqiqiy. **ISHLAYDI** |
| **MES Monitor** | `mes/mes-monitor.service.ts` | OEE/anomaliya hisoblash (formula). **ISHLAYDI** (algoritmik) |
| **Vision QC** | `qc/vision-qc.service.ts:74` | `ai.call({provider:'gemini', mes.quality_prediction})` — ΔE so'raydi, lekin rasmni **URL matn** sifatida beradi → Claude rasmni ko'rmaydi, ΔE/defektlarni **to'qiydi**; parse fail bo'lsa default `deltaE=3.5`. **SOXTA-VISION** |
| **Logistics Router** | `logistics/router.service.ts` | VRP (marshrut optimallashtirish) algoritmi. **ISHLAYDI** (algoritmik) |

Boshqa endpointlar: `GET /ai-agents/list` (6 kopilot meta + `ai_decision_log` stat), `GET /ai-agents/audit/*` (real), `POST /ai-agents/:agentId/trigger` → `notImplemented()` (501, P3-26 — qo'lda trigger ulanmagan).

> **Eng kuchli qism shu modulda:** Planner (Johnson/CPM/EOQ), MES (OEE), Logistics (VRP) — **haqiqiy operatsion-tadqiqot algoritmlari, LLM kerak emas**. Bular AIning eng "real" qismi. Aksincha Vision QC va Prepress preflight — rasmni ko'rmasdan vision da'vo qiladi (soxta).

---

## 8. AI KAMERA

3 ta alohida "AI kamera" yo'li bor:

1. **Aisha `analyze_camera_feed` tool** (`analyze-camera-feed.tool.ts`) — **HAQIQIY Claude vision** (real base64). Eng to'g'ri yo'l. (5.2-bo'lim).
2. **`reference-image-compare.cron.ts`** (HR xona holati taqqoslash, har 2 soat) — Gemini `gemini-1.5-flash` bilan 2 rasmni taqqoslaydi. **🔴 IKKI BUZUQ:** (a) `AI_INTEGRATIONS_GEMINI_API_KEY` o'qiydi → kalit yo'q → har doim "Gemini disabled — skipping" (:48); (b) hatto kalit bo'lsa ham `fileData.fileUri` ichki URL beradi (:75-76) — Gemini ichki URL'ni o'qiy olmaydi (Files API upload kerak) → strukturaviy buzuq. **YO'Q-BUZUQ**.
3. **IoT `CameraAiService` / `camera-ai.controller.ts`** (`/api/camera-ai/*`) — **vision YO'Q**, faqat `camera_ai_configs` jadvali ustida CRUD/o'qish (summary/trends/quality/productivity/utilization/anomaly + prompt/rules yangilash). Jadval **bo'sh (=0)** → hamma read 0/null. Haqiqiy AI tahlil emas, konfiguratsiya paneli. *(Eslatma: FE chaqiradigan `/api/ai-camera/analyze-by-missions` va `/api/cameras` — bu controllerda EMAS, IoT-tablet modulida; mening doiramdan tashqari, `iot-tablet-asl-holat` hisobotiga qarang.)*

---

## 9. HR AI INTERVYU (Gemini Live)

`hr/ai-interview-v2/gemini-live.gateway.ts` — **WebSocket** orqali brauzer ↔ Gemini Live API (`gemini-2.0-flash-exp`, ovozli intervyu, o'zbekcha). Kod **to'liq va ishonarli** (token-gated, audio/text proxy, system-instruction). **🔴 LEKIN:** `AI_INTEGRATIONS_GEMINI_API_KEY` o'qiydi (:83) → kalit yo'q → ulanishda `'Gemini API key not configured'` xato qaytaradi. DB: `ai_interview_sessions=5` (test ma'lumot), `ai_hr_interviews`/`ai_interview_messages` h.k. mavjud. **QISMAN** (kod tayyor, kalit yo'q → ishlamaydi).

---

## 10. JONLI DB DALILLARI (AI hech qachon ishlatilmagan)

`node _audit/q.cjs` natijasi (2026-06-02):

| Jadval | Qator | Izoh |
|---|---|---|
| `ai_usage_logs` | **0** | Bironta LLM chaqiruvi yozilmagan |
| `ai_decision_log` | **0** | ai-agents kopilotlar ishlatilmagan |
| `aisha_conversations` | **0** | Aisha suhbat yo'q |
| `aisha_tool_calls` | **0** | Aisha tool ishlatilmagan |
| `aisha_voice_audit` | **0** | Ovoz yo'q |
| `ai_providers_config` | **0** | Provayder config DB'da seed qilinmagan |
| `ai_prompts` | **0** | Prompt kutubxonasi bo'sh |
| `ai_insights` | **0** | Insight generatsiya qilinmagan |
| `ai_finance_insights` | **0** | — |
| `forecast_series` | **0** | Bashorat ishlatilmagan |
| `ai_planning_plans` | **0** | AI reja yaratilmagan |
| `camera_ai_configs` | **0** | Kamera AI sozlanmagan |
| `agent_alerts` | **0** | Agent alert yo'q |
| `agent_modules_registry` | **20** | ✅ Seed (director/crm/production/.../mes/admin) |
| `ai_interview_sessions` | **5** | Test ma'lumot |

> **40+ AI jadval mavjud, lekin runtime ma'lumoti deyarli NOL.** Bu AIning *qurilgan lekin yoqilmagan* ekanini isbotlaydi (DB ham deyarli bo'sh — qurilish bosqichi, memory `reference_live_db_location.md` bilan mos).

---

## 11. FRONTEND AI SIRTI (54 fayl)

`grep -i "aisha|/api/ai|/api/agents"` → **54 FE fayl**. Asosiylari:
- **Aisha:** `components/aisha/` (AishaOrb, AishaPanel, AishaChatPanel, TransparencyPanel), `hooks/useAisha.ts`, `aisha/store.ts`, `lib/api/aisha.schema.ts`. To'liq, Zod-validatsiyalangan.
- **Agentlar:** `pages/agents/` (AgentsHub, Production/Quality/Strategic/HRPerformance/Procurement/Facilities Dashboard), `pages/AIAgentsPage.tsx`, `components/director/ModuleHealthGrid.tsx`, `hooks/useAgentAlerts.ts`.
- **AI modul sahifalari:** `AIFinancePage*`, `AiCrmPage`, `HRAIDashboard`, `AIProductionPlanning`, `AIReservation`, `AIExams`/`AllExams`, `ai-planning/*` (Demand/Bottleneck/RushOrder/Shift), `DirectorAiAudit`, `AiAutomationPage`, `AIInterviewPage`.
- **Kamera AI:** `camera-ai-modern/api.ts`.

> **FE AI sahifalari BE'dan oldinda:** Demand Forecasting / Rush Order / Bottleneck / Shift sahifalari mavjud, lekin BE `ai.controller.ts`da bu endpointlar 501/bo'sh stub (4.2-bo'lim). Kontrakt drift.

---

## 12. UMUMIY BAHO: AI qancha real?

| O'lcham | Holat |
|---|---|
| **Arxitektura / skelet** | 🟢 Juda keng — 4 modul, ~158 route, 40+ jadval, 25 tool, 14+6 agent, hex-arch portlar, retry/cost-logging. Ishlab chiqarish sifatli yozilgan. |
| **LLM provayderlar** | 🟡 3 yo'l real, lekin **1 tirik** (Claude). OpenAI+Gemini o'lik (kalit yo'q + nom parchalangan). |
| **Aisha** | 🟡 Matn-chat REAL (Claude), Director panelga ulangan; ovoz O'LIK (kalit yo'q). |
| **14 agent** | 🟡 5 LLM + 5 SQL + 4 placeholder. "AI agent" nomi shishirilgan. |
| **6 kopilot** | 🟡 Planner/MES/Logistics algoritm REAL; Vision-QC/Prepress soxta-vision; Sales qisman. |
| **AI kamera** | 🟡 Aisha vision tool REAL; reference-cron BUZUQ; IoT camera-ai faqat config CRUD. |
| **AI planning** | 🟡 ai-agents/planner REAL algoritm; ai/ai-planning faqat CRUD+mock. |
| **HR AI intervyu** | 🟡 Gemini Live kod tayyor, kalit yo'q → ishlamaydi. |
| **Runtime ishlatilishi** | 🔴 **DEYARLI NOL** — barcha AI jadvallari 0 qator. AI hech qachon jonli ishlatilmagan. |

### Integratsiya darajasi (sub'ektiv, dalilga asoslangan): **~35%**
- **Yozilgan (skelet):** ~90%
- **Tirik kalit bilan ishlaydigan:** ~30% (faqat Claude yo'llari)
- **Haqiqiy AI (LLM yoki jiddiy algoritm), soxta emas:** ~40% endpoint (Aisha chat+vision tool, 5 agent LLM, Planner/MES/Logistics algoritm, ai/call+budget)
- **Jonli ma'lumot bilan isbotlangan:** ~0%

---

## 13. ASOSIY MUAMMOLAR (egasi uchun, ustuvorlik bo'yicha)

1. **🔴 Gemini env nomi parchalangan (3 xil nom).** Birlashtirilsin → bitta `GEMINI_API_KEY` (yoki `AI_INTEGRATIONS_GEMINI_API_KEY`). Hozir `.env`dagi bo'sh `GOOGLE_API_KEY` hech qayerda o'qilmaydi.
2. **🔴 `reference-image-compare.cron` strukturaviy buzuq** — `fileUri` ichki URL Gemini'ga ishlamaydi (Files API upload kerak) + kalit nomi noto'g'ri. Kalit qo'shilsa ham ishlamaydi.
3. **🟠 Vision-QC va Prepress preflight rasmni ko'rmaydi** — `ai.call`ga rasm URL'i matn sifatida ketadi; Claude/Gemini piksel olmaydi → ΔE/defekt **to'qiladi**. Aisha `analyze_camera_feed` kabi real base64 yuborilsin.
4. **🟠 `ai.controller.ts` 5 stub** (bottleneck/demand-forecast/rush-orders×3/shift) — FE sahifalari bor, BE 501/bo'sh. Yoki BE yozilsin yoki FE `EPComingSoon` qilinsin.
5. **🟡 "14 AI agent" → aniqlik:** 9 tasi AI emas (SQL/placeholder). IoT/Quality/Facilities placeholderlar haqiqiy ma'lumotga ulansin yoki "coming soon" deb belgilansin.
6. **🟡 Aisha ovoz kalitlari** (OpenAI/ElevenLabs/Picovoice) yo'q → ovoz o'lik. Egasi xohlasa to'ldirilsin, aks holda UI "faqat matn" deb ko'rsatsin.
7. **🟡 Konseptual dublikat** `modules/agents` (14) va `modules/ai-agents` (6) — birlashtirish yoki aniq chegaralash ko'rib chiqilsin.

---

## 14. METODOLOGIYA / DALIL

- **Kod:** Read/Grep, fayl:satr keltirilgan (adapterlar, controllerlar, 14 agent, 6 kopilot, config, cron, FE).
- **DB:** `node _audit/q.cjs` — 15 AI jadval COUNT + agent_modules_registry ro'yxati.
- **Env:** `apps/api/.env` + root `.env` o'qildi (kalit holati).
- **Brauzer:** ishlatilmadi (umumiy resurs); FE ulanish kod asosida tasdiqlandi (DirectorDashboard.tsx:143/232/235, useAisha.ts). UI runtime xatti-harakati (chat real javob beradimi) **brauzerda tekshirilmagan** — kod asosida "ishlashi kerak (kalit bor)".

*Hisobot: agent15-ai-modullar | 2026-06-02 | READ-ONLY*
