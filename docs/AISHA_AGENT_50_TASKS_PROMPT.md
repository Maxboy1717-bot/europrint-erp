# AIsha — 50 Atomic Tasks Agent Prompt (Director Dashboard Integration)

> **For AI agent (Claude Code, Cursor, etc.).** Give this prompt to the agent as-is.
> **Goal:** Build **AIsha** — a voice-activated AI assistant for the Director — fully integrated inside the existing Director Dashboard. The agent will create **50 atomic tasks** and execute them one by one.
> **Date:** 2026-05-15
> **Codebase:** EuroPrint ERP (NestJS + React + Drizzle)

---

## WHO YOU ARE

You are the **AIsha Implementation Agent**. Your mission: build AIsha — a voice-only AI assistant for the company's Director — by completing **50 atomic tasks**. AIsha lives **inside the existing Director Dashboard** (not as a standalone page), has **project-wide read/action access**, **must show data provenance** (where every piece of info comes from), and **can access AI cameras + regular surveillance cameras**.

**Project root:**
```
Uzbek-Language-Module/
├── apps/api/src/modules/director/        ← AIsha integrates here
├── apps/api/src/modules/iot/             ← Existing IoT (cameras, sensors)
├── apps/api/src/modules/camera/          ← Existing camera module (AI vision)
├── artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx  ← UI mount point
└── (55 other modules — AIsha reads them all)
```

---

## ⚠️ ONE-TIME PERMISSION (FIRST MESSAGE)

In your first message, request **a single blanket permission**:

```
I need read+write access to the following files and folders. I will NOT
ask permission again per task — I will complete all 50 tasks autonomously.

1.  apps/api/src/modules/director/**/*.ts        (integration point)
2.  apps/api/src/modules/aisha/**/*.ts            (NEW — to be created)
3.  apps/api/src/modules/iot/**/*.ts              (read — camera/sensor data)
4.  apps/api/src/modules/camera/**/*.ts           (read — AI vision)
5.  apps/api/src/modules/{55 modules}/**/*.ts     (read — for tool data sources)
6.  apps/api/src/app.module.ts                    (register new module)
7.  apps/api/src/shared/db/schema-*.ts            (add aisha tables)
8.  apps/api/src/locales/{uz,ru}/aisha.json       (NEW — i18n)
9.  apps/api/.env                                  (API keys)
10. apps/api/package.json                          (new deps)
11. artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx     (mount AIsha panel)
12. artifacts/erp-dashboard/src/components/aisha/**/*.tsx      (NEW)
13. artifacts/erp-dashboard/src/hooks/use-aisha.ts             (NEW)
14. artifacts/erp-dashboard/src/aisha/assets/aisha.ppn         (wake word file)
15. artifacts/erp-dashboard/package.json
16. docs/aisha-progress.md                                      (progress log)

Grant permission? (YES / NO)
```

If user says **YES** — proceed and never ask again until all 50 tasks are done.

---

## STRICT RULES

1. **50 tasks = 50 deliverables.** No skipping. No half-work.
2. Use `TaskCreate` to create **all 50 tasks at once** at the start.
3. **No `it.skip`, `xit`, `test.todo`** in any test file.
4. **No `expect(true).toBe(true)`.**
5. **No `any` type.** TypeScript strict mode.
6. **Each file ≤ 300 lines.** Split if larger.
7. **Each tool MUST emit a provenance record:** `{ source: 'db.sales_orders', timestamp, queriedFields }`.
8. **No `console.log` in production code.** Use the Logger.
9. **Each test name format:** `it('<verb> <expected> when <condition>')`.
10. After each task: run `pnpm test:api` and `pnpm typecheck` — both must pass before marking task complete.
11. **Never ask "should I continue?"** — complete all 50 tasks autonomously.
12. **The Result Pattern is mandatory** — return `Promise<Result<T>>`, no thrown errors in business logic.

---

## CRITICAL PRINCIPLE — TRANSPARENCY

Every piece of information AIsha gives the Director must be **traceable**. The UI shows:

```
┌──────────────────────────────────────────────┐
│ AIsha says:                                  │
│ "Sex-3 OEE is 65%, lower than yesterday."   │
│                                              │
│ Sources:                                     │
│ ▸ iot.oee_metrics (queried 2s ago)          │
│ ▸ mes.production_sessions (12 rows)         │
│ ▸ camera-3 snapshot (1s ago) [view feed]    │
└──────────────────────────────────────────────┘
```

Every tool must return a `provenance` object that the frontend renders inline.

---

## STEP 0 — SETUP (BEFORE TASK 1)

Run these commands first:

```bash
# 1. Install backend dependencies
pnpm --filter @europrint/api add elevenlabs

# 2. Install frontend dependencies
pnpm --filter erp-dashboard add @picovoice/porcupine-web @picovoice/web-voice-processor

# 3. Verify existing AI SDK packages (should already be installed)
grep -E "anthropic|openai|generative-ai" apps/api/package.json

# 4. Create module structure
mkdir -p apps/api/src/modules/aisha/{domain/{aggregates,value-objects,events,repositories},application/{commands,queries,tools,llm,voice},infrastructure/{streaming,audio,repositories},presentation/{controllers,dto}}

# 5. Create frontend structure
mkdir -p artifacts/erp-dashboard/src/components/aisha
mkdir -p artifacts/erp-dashboard/src/aisha/{voice,assets,hooks}

# 6. Verify Porcupine custom wake word file exists
# (User must train "Aisha" wake word at console.picovoice.ai)
ls artifacts/erp-dashboard/src/aisha/assets/aisha.ppn || echo "MISSING: train wake word at picovoice console"

# 7. Setup environment variables
cat >> apps/api/.env <<'EOF'
# AIsha — AI Voice Assistant
ANTHROPIC_API_KEY=sk-ant-XXXXX
OPENAI_API_KEY=sk-XXXXX
ELEVENLABS_API_KEY=XXXXX
ELEVENLABS_VOICE_ID=XB0fDUnXU5powFXDhCwa
PICOVOICE_ACCESS_KEY=XXXXX
GOOGLE_AI_API_KEY=AIzaSyXXXXX

AISHA_DIRECTOR_USER_ID=1
AISHA_WAKE_SENSITIVITY=0.7
AISHA_DAILY_BUDGET_USD=5
AISHA_AUDIO_RETENTION_MINUTES=3
EOF
```

---

## THE 50 TASKS

### PHASE 1 — Module Foundation (Tasks 1-6)

```
TASK 1: Create aisha module skeleton
- Path: apps/api/src/modules/aisha/aisha.module.ts
- Standard NestJS module with CqrsModule, EventEmitterModule
- Empty providers/controllers list (filled in later tasks)
- Min tests: 1 (module compiles)
```

```
TASK 2: Register aisha module in app.module
- Path: apps/api/src/app.module.ts (modify)
- Import AishaModule
- Add to imports array
- Min tests: 1 (app boots with aisha module)
```

```
TASK 3: Drizzle schema for AIsha tables
- Path: apps/api/src/shared/db/schema-aisha.ts (new file)
- Tables:
  • aisha_conversations (id, user_id, started_at, ended_at, status)
  • aisha_tool_calls (id, conversation_id, tool_name, input, output, source, latency_ms, created_at)
  • aisha_voice_audit (id, conversation_id, transcript, audio_deleted_at)
  • aisha_pending_approvals (id, conversation_id, tool_call_id, status, approved_at)
- Export from shared/db/index.ts
- Min tests: 3 (table structure, indexes, FK)
```

```
TASK 4: Apply migration for aisha tables
- Run drizzle-kit generate
- Verify migration file in apps/api/src/shared/db/migrations/
- Apply locally
- Min tests: 1 (tables created)
```

```
TASK 5: Environment configuration class
- Path: apps/api/src/modules/aisha/config/aisha.config.ts
- ConfigService-backed class
- Properties: anthropicKey, openaiKey, elevenLabsKey, voiceId, picovoiceKey, dailyBudgetUSD
- Throws if any required env var missing on startup
- Min tests: 4 (all keys load, missing key throws)
```

```
TASK 6: i18n for AIsha (uz + ru)
- Paths:
  • artifacts/erp-dashboard/src/locales/uz/aisha.json
  • artifacts/erp-dashboard/src/locales/ru/aisha.json
- Keys: listening, thinking, speaking, muted, error, confirmCommand, etc.
- Both languages 100% translated
- Min tests: 1 (i18n-check passes)
```

### PHASE 2 — Domain Layer (Tasks 7-11)

```
TASK 7: Conversation aggregate root
- Path: apps/api/src/modules/aisha/domain/aggregates/conversation.aggregate.ts
- Methods: start(), addCommand(), executeTool(), end()
- Emits domain events: ConversationStarted, CommandRecognized, ToolExecuted
- Min tests: 8 (lifecycle, state transitions, event emission)
```

```
TASK 8: VoiceCommand value object
- Path: apps/api/src/modules/aisha/domain/value-objects/voice-command.vo.ts
- Properties: transcript, language ('uz'|'ru'), confidence (0-1), durationMs
- Validation: transcript non-empty, confidence 0-1
- Min tests: 6 (valid/invalid inputs, equals())
```

```
TASK 9: ToolCall value object with provenance
- Path: apps/api/src/modules/aisha/domain/value-objects/tool-call.vo.ts
- Properties: toolName, input, output, provenance: { source, queriedAt, rowCount, fields }
- Provenance is REQUIRED — cannot be null
- Min tests: 5
```

```
TASK 10: PendingApproval value object
- Path: apps/api/src/modules/aisha/domain/value-objects/pending-approval.vo.ts
- Properties: toolCallId, stakeLevel ('medium'|'high'|'critical'), requiresPIN
- Methods: approve(), reject(), expire() (5 min TTL)
- Min tests: 6
```

```
TASK 11: Domain events
- Path: apps/api/src/modules/aisha/domain/events/
- Events:
  • conversation-started.event.ts
  • command-recognized.event.ts
  • tool-executed.event.ts
  • action-approved.event.ts
  • action-rejected.event.ts
- Min tests: 1 each = 5 total
```

### PHASE 3 — LLM Infrastructure (Tasks 12-17)

```
TASK 12: Claude service with streaming + tool use
- Path: apps/api/src/modules/aisha/application/llm/claude.service.ts
- Use @anthropic-ai/sdk
- Method: streamWithTools(messages, tools): AsyncIterator<StreamEvent>
- Handles: text deltas, tool_use blocks, tool_result blocks
- Min tests: 5 (mocked SDK)
```

```
TASK 13: Tool registry pattern
- Path: apps/api/src/modules/aisha/application/tools/tool.registry.ts
- Auto-discover all `*.tool.ts` files
- Register tool definitions for Claude
- Method: getToolByName(name): IAishaTool
- Min tests: 4
```

```
TASK 14: Gemini fallback service
- Path: apps/api/src/modules/aisha/application/llm/gemini-fallback.service.ts
- Triggers when Claude returns 5xx or timeouts after 5s
- Same interface as Claude service
- Min tests: 3 (mock, fallback trigger, normal path)
```

```
TASK 15: PII redaction layer
- Path: apps/api/src/modules/aisha/application/llm/pii-redactor.ts
- Redacts: phone numbers, INN, MFO, passport, salary fields
- Replace with [REDACTED:type]
- Apply before sending to LLM, restore in output
- Min tests: 7 (each PII type)
```

```
TASK 16: Daily token budget tracker
- Path: apps/api/src/modules/aisha/application/llm/budget-tracker.service.ts
- Redis-backed counter per user per day
- Method: checkBudget(userId, estimatedTokens): boolean
- Method: recordSpend(userId, actualTokens, cost)
- Min tests: 6
```

```
TASK 17: SSE gateway for streaming responses
- Path: apps/api/src/modules/aisha/infrastructure/streaming/aisha-sse.gateway.ts
- Fastify SSE endpoint: GET /api/aisha/stream/:conversationId
- Streams: text deltas, tool_calls, provenance, end signal
- Min tests: 4
```

### PHASE 4 — Voice Pipeline (Tasks 18-22)

```
TASK 18: Whisper STT service
- Path: apps/api/src/modules/aisha/application/voice/whisper.service.ts
- Use openai SDK
- Method: transcribe(audioBuffer): { text, language, confidence }
- Auto-detect uz/ru
- Min tests: 4 (mocked)
```

```
TASK 19: ElevenLabs TTS streaming service
- Path: apps/api/src/modules/aisha/application/voice/elevenlabs.service.ts
- Use elevenlabs SDK
- Method: synthesizeStream(text, voiceId): AsyncIterator<Buffer>
- Stream-as-you-go (sentence chunks)
- Min tests: 3
```

```
TASK 20: Voice upload controller
- Path: apps/api/src/modules/aisha/presentation/controllers/voice.controller.ts
- POST /api/aisha/voice/transcribe — multipart audio upload
- POST /api/aisha/voice/synthesize — text → audio stream
- Uses Fastify multipart
- Min tests: 4
```

```
TASK 21: Audio retention cron job
- Path: apps/api/src/modules/aisha/infrastructure/audio/audio-cleanup.cron.ts
- Runs every 5 minutes
- Deletes audio files older than AISHA_AUDIO_RETENTION_MINUTES (default 3)
- Updates aisha_voice_audit.audio_deleted_at
- Min tests: 3
```

```
TASK 22: Wake word config endpoint
- Path: apps/api/src/modules/aisha/presentation/controllers/wake-config.controller.ts
- GET /api/aisha/wake/config — returns Picovoice access key + .ppn URL
- PATCH /api/aisha/wake/sensitivity — Director-only
- Min tests: 4
```

### PHASE 5 — Read-only Tools (Tasks 23-32)

Each tool returns `{ data, provenance }` shape.

```
TASK 23: get_today_briefing tool
- Path: apps/api/src/modules/aisha/application/tools/get-today-briefing.tool.ts
- Aggregates from: sales_orders, production_orders, alerts, attendance
- Returns: 3 most important events of the day
- Provenance lists 4+ sources with timestamps
- Min tests: 5
```

```
TASK 24: get_production_status tool
- Aggregates: production_orders, work_centers, downtime_events
- Returns: planned vs actual, OEE, downtime
- Provenance: source tables + freshness
- Min tests: 5
```

```
TASK 25: get_machine_status tool
- Source: iot.machine_telemetry + downtime_events
- Input: machineId or machineName
- Returns: state, OEE, last downtime, current operator
- Provenance: includes IoT sensor timestamps
- Min tests: 6
```

```
TASK 26: get_order_status tool
- Source: sd.sales_orders + sd_orders (legacy compat)
- Input: orderId or customerName
- Returns: status, progress %, delivery date, customer
- Provenance: source + lastUpdated
- Min tests: 6
```

```
TASK 27: get_customer_info tool
- Source: crm.companies + crm.deals + sd.sales_orders
- Input: customerName or customerId
- Returns: CLV, last 6 months orders count + total, RFM score
- Provenance: 3 sources joined
- Min tests: 6
```

```
TASK 28: get_employee_info tool
- Source: hr.employees + hr.attendance + hr.kpi
- Input: employeeName or employeeId
- Returns: position, attendance today, current location, KPI
- Provenance: 3 sources
- Min tests: 6
```

```
TASK 29: get_inventory_levels tool
- Source: wms.warehouse_stock + mm.materials
- Input: itemName/SKU OR warehouseCode (optional)
- Returns: current stock, days until depletion (forecast), reorder point
- Provenance: stock + forecast model
- Min tests: 7
```

```
TASK 30: get_financial_summary tool
- Source: fi.gl_documents + fi.ap_invoices + fi.ar_invoices
- Returns: cash position, AP total, AR total, today's revenue
- Provenance: GL last close timestamp
- Min tests: 6
```

```
TASK 31: get_quality_metrics tool
- Source: qc.inspections + qc.reclamations
- Returns: today's brak %, defect rate per machine, open reclamations
- Provenance: QC system + timestamp
- Min tests: 5
```

```
TASK 32: get_active_alerts tool
- Source: security.alerts + iot.sensor_alerts + ai_agents.alerts
- Returns: top 10 unread alerts, severity
- Provenance: 3 alert sources, counts
- Min tests: 5
```

### PHASE 6 — Camera & AI Vision Tools (Tasks 33-38)

```
TASK 33: list_available_cameras tool
- Source: iot.cameras + camera.devices
- Returns: list of online cameras with: id, name, location, streamUrl
- Filter: online only, by zone (optional)
- Provenance: camera registry, last heartbeat
- Min tests: 5
```

```
TASK 34: get_camera_snapshot tool
- Input: cameraId
- Action: fetches latest frame from RTSP/HTTP stream
- Returns: base64 image + timestamp + cameraName
- Stores frame URL (for UI to display in transparency panel)
- Provenance: camera + capture timestamp
- Min tests: 4
```

```
TASK 35: analyze_camera_feed tool (Claude Vision)
- Input: cameraId + question (e.g. "how many workers are visible?")
- Action: capture frame → send to Claude with vision capability
- Returns: AI description + bounding boxes (if available)
- Provenance: camera frame timestamp + LLM model
- Min tests: 5
```

```
TASK 36: detect_workers_in_area tool
- Input: areaId (e.g. "sex-3") or cameraId
- Action: snapshot → AI count people in frame
- Returns: count, confidence, snapshot URL
- Provenance: camera + AI model
- Min tests: 5
```

```
TASK 37: detect_safety_violations tool
- Input: cameraId or areaId
- Checks for: missing helmet, missing vest, restricted area entry, machine guard removed
- Returns: violations list with severity + snapshot URL
- Provenance: camera + AI vision result
- Min tests: 6
```

```
TASK 38: get_machine_state_via_vision tool
- Input: machineId
- Action: get camera covering that machine → snapshot → AI analyzes (running/stopped/error)
- Combined with iot.machine_telemetry for cross-validation
- Returns: visual state + sensor state + match/mismatch flag
- Provenance: both camera + IoT sensor with timestamps
- Min tests: 5
```

### PHASE 7 — Analysis Tools (Tasks 39-42)

```
TASK 39: generate_kpi_report tool
- Input: period (today/week/month) + optional department filter
- Action: aggregates KPIs from all modules
- Returns: PDF URL + structured data
- Provenance: 8+ sources listed
- Min tests: 5
```

```
TASK 40: compare_periods tool
- Input: metric + period1 + period2
- Returns: comparison chart data, % change, statistical significance
- Provenance: source table + sample sizes
- Min tests: 5
```

```
TASK 41: forecast_demand tool
- Input: productCategory + horizonDays
- Action: time-series forecast (linear or moving avg)
- Returns: forecast values + confidence interval
- Provenance: historical data range + model
- Min tests: 4
```

```
TASK 42: what_if_simulation tool
- Input: scenario (e.g. "add 2 machines to Sex-3")
- Action: simulates impact on production, cost, ROI
- Returns: structured scenario analysis
- Provenance: model assumptions + source data
- Min tests: 4
```

### PHASE 8 — Action Tools (Tasks 43-47) [HIGH STAKE — REQUIRE VOICE CONFIRMATION]

```
TASK 43: send_telegram_to_team tool
- Input: recipients (departmentHeads/all/specificUserIds) + message
- Stake: HIGH (requires voice "yes" confirmation)
- Source: telegram bot + employees table
- Min tests: 7 (incl. approval flow)
```

```
TASK 44: send_email tool
- Input: recipients + subject + body + attachmentUrls (optional)
- Stake: HIGH
- Min tests: 6
```

```
TASK 45: schedule_meeting tool
- Input: attendees + datetime + topic + location
- Action: creates calendar event + Telegram invitations
- Stake: HIGH
- Min tests: 6
```

```
TASK 46: create_reminder tool
- Input: text + datetime + recurrence (optional)
- Stake: MEDIUM (auto-execute, audit log)
- Min tests: 5
```

```
TASK 47: assign_task tool
- Input: assignee + title + description + dueDate
- Action: creates Kanban card in employee's board
- Stake: MEDIUM
- Min tests: 5
```

### PHASE 9 — Director Dashboard Integration (Tasks 48-50)

```
TASK 48: AIsha panel in DirectorDashboard.tsx
- Path: artifacts/erp-dashboard/src/components/aisha/AishaPanel.tsx
- Mount inside DirectorDashboard.tsx (top-right corner, collapsible)
- Components:
  • AishaOrb (modern minimal design — indigo gradient, see design spec)
  • StatusText (Listening / Thinking / Speaking)
  • CommandHistory (last 5 commands)
  • MuteButton (F4 shortcut)
- Uses useWakeWord, useMicrophone, useSTT, useTTS hooks
- Modern Linear/Apple style — NOT dark HUD
- Min tests: 8 (render, RBAC, mute, wake trigger)
```

```
TASK 49: Transparency panel (DATA PROVENANCE UI)
- Path: artifacts/erp-dashboard/src/components/aisha/TransparencyPanel.tsx
- For every AIsha answer, shows side panel with:
  • Tool calls (which tools were called, in order)
  • Data sources (which DB tables/modules queried)
  • Timestamps (data freshness)
  • Camera snapshots (if camera tools used — show thumbnails)
  • Citation count
  • "View raw data" expandable section
- Slides in from right when AIsha responds
- Each source clickable → opens detail modal
- Min tests: 8
```

```
TASK 50: End-to-end test + pilot validation
- Path: artifacts/erp-dashboard/e2e/aisha-director-flow.spec.ts
- Test scenario:
  1. Director logs in
  2. Opens Director Dashboard
  3. Says "Aisha" (mock wake word)
  4. Asks "show me today's production status"
  5. Verifies orb pulses, status text changes
  6. Verifies response contains expected data
  7. Verifies TransparencyPanel shows correct sources
  8. Director says "send Telegram to team about meeting at 4pm"
  9. Verifies HIGH-stake approval flow triggered
  10. Director says "yes"
  11. Verifies Telegram action executed and audit logged
- Min tests: 5 (full E2E scenarios)
- Final deliverable: docs/aisha-final-report.md with screenshots
```

---

## TASK EXECUTION ORDER

Strict order — do NOT skip:

```
1. Read PHASE 1 setup (above)
2. Create all 50 TaskCreate entries
3. Execute Task 1 → 2 → 3 ... → 50 (in order, no skipping)
4. After each task: pnpm test + pnpm typecheck must pass
5. After every 10 tasks: measure coverage delta
6. Update docs/aisha-progress.md after each task
7. After task 50: produce final report
```

---

## PROVENANCE DATA SHAPE (CRITICAL)

Every tool must return this exact shape:

```typescript
type ToolResult<T> = {
  data: T;
  provenance: {
    sources: Array<{
      type: 'database' | 'api' | 'camera' | 'iot_sensor' | 'ai_model' | 'cache';
      identifier: string;        // e.g. 'sd.sales_orders'
      queriedAt: string;          // ISO timestamp
      rowCount?: number;
      latencyMs: number;
      freshness: 'live' | 'cached' | 'stale';
    }>;
    confidence: number;           // 0-1
    citations: Array<{
      label: string;              // e.g. "SO-2156"
      url?: string;                // optional link to detail page
      snippet?: string;
    }>;
    cameraSnapshots?: Array<{     // ONLY if camera tools used
      cameraId: string;
      cameraName: string;
      snapshotUrl: string;
      capturedAt: string;
    }>;
  };
};
```

This shape is used by **Task 49 (TransparencyPanel)** to render the source citations on the UI.

---

## TEMPLATE — Tool Implementation

```ts
// apps/api/src/modules/aisha/application/tools/get-machine-status.tool.ts
import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { db } from '@shared/db';
import { machineRegistry, downtimeEvents } from '@shared/db/schema';
import { eq } from 'drizzle-orm';
import { IAishaTool, ToolResult } from '../../domain/tool.interface';

@Injectable()
export class GetMachineStatusTool implements IAishaTool {
  readonly definition = {
    name: 'get_machine_status',
    description: "Returns a machine's current state, OEE, and last downtime.",
    input_schema: {
      type: 'object',
      properties: {
        machineId: { type: 'string', description: 'Machine ID or name' },
      },
      required: ['machineId'],
    },
  };

  async execute(input: { machineId: string }): Promise<Result<ToolResult<MachineStatus>>> {
    const startTime = Date.now();

    const machine = await db.select().from(machineRegistry).where(eq(machineRegistry.id, input.machineId));
    if (!machine[0]) return Err(`Machine ${input.machineId} not found`);

    const lastDowntime = await db.select().from(downtimeEvents)
      .where(eq(downtimeEvents.machineId, input.machineId))
      .orderBy(downtimeEvents.startedAt)
      .limit(1);

    const data: MachineStatus = {
      machineId: machine[0].id,
      name: machine[0].name,
      state: machine[0].currentState,
      oee: machine[0].currentOee,
      lastDowntime: lastDowntime[0] ?? null,
    };

    return Ok({
      data,
      provenance: {
        sources: [
          {
            type: 'database',
            identifier: 'iot.machine_registry',
            queriedAt: new Date().toISOString(),
            rowCount: 1,
            latencyMs: Date.now() - startTime,
            freshness: 'live',
          },
          {
            type: 'database',
            identifier: 'iot.downtime_events',
            queriedAt: new Date().toISOString(),
            rowCount: lastDowntime.length,
            latencyMs: Date.now() - startTime,
            freshness: 'live',
          },
        ],
        confidence: 1.0,
        citations: [
          { label: machine[0].name, url: `/iot/machines/${input.machineId}` },
        ],
      },
    });
  }
}
```

---

## TEMPLATE — Camera Tool Implementation

```ts
// apps/api/src/modules/aisha/application/tools/analyze-camera-feed.tool.ts
import { Injectable, Inject } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Result, Ok, Err } from '@common/result';
import { CameraService } from '../../../camera/camera.service';

@Injectable()
export class AnalyzeCameraFeedTool implements IAishaTool {
  readonly definition = {
    name: 'analyze_camera_feed',
    description: 'Analyzes a live camera frame using AI vision to answer a question.',
    input_schema: {
      type: 'object',
      properties: {
        cameraId: { type: 'string' },
        question: { type: 'string' },
      },
      required: ['cameraId', 'question'],
    },
  };

  constructor(
    private readonly cameraService: CameraService,
    @Inject('ANTHROPIC_CLIENT') private readonly claude: Anthropic,
  ) {}

  async execute(input: { cameraId: string; question: string }): Promise<Result<ToolResult<VisionResult>>> {
    const startTime = Date.now();

    // 1. Get camera snapshot
    const snapshot = await this.cameraService.captureFrame(input.cameraId);
    if (!snapshot.ok) return Err(snapshot.error.message);

    // 2. Send to Claude with vision
    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-6-20251022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: snapshot.data.base64 } },
          { type: 'text', text: input.question },
        ],
      }],
    });

    const description = response.content[0].type === 'text' ? response.content[0].text : '';

    return Ok({
      data: { description, cameraId: input.cameraId },
      provenance: {
        sources: [
          {
            type: 'camera',
            identifier: `camera.${input.cameraId}`,
            queriedAt: snapshot.data.capturedAt,
            latencyMs: Date.now() - startTime,
            freshness: 'live',
          },
          {
            type: 'ai_model',
            identifier: 'claude-sonnet-4-6-20251022',
            queriedAt: new Date().toISOString(),
            latencyMs: Date.now() - startTime,
            freshness: 'live',
          },
        ],
        confidence: 0.85,
        citations: [
          { label: `Camera ${input.cameraId}`, url: `/iot/cameras/${input.cameraId}` },
        ],
        cameraSnapshots: [
          {
            cameraId: input.cameraId,
            cameraName: snapshot.data.name,
            snapshotUrl: snapshot.data.url,
            capturedAt: snapshot.data.capturedAt,
          },
        ],
      },
    });
  }
}
```

---

## TEMPLATE — Frontend TransparencyPanel

```tsx
// artifacts/erp-dashboard/src/components/aisha/TransparencyPanel.tsx
import { useAishaStore } from '@/aisha/store';

export function TransparencyPanel() {
  const lastResponse = useAishaStore((s) => s.lastResponse);
  if (!lastResponse) return null;
  const { provenance } = lastResponse;

  return (
    <aside className="aisha-transparency-panel">
      <h3>Data sources</h3>
      <div className="sources-list">
        {provenance.sources.map((s, i) => (
          <div key={i} className="source-card">
            <span className={`type-badge type-${s.type}`}>{s.type}</span>
            <span className="identifier">{s.identifier}</span>
            <span className="latency">{s.latencyMs}ms</span>
            <span className={`freshness ${s.freshness}`}>{s.freshness}</span>
          </div>
        ))}
      </div>

      {provenance.cameraSnapshots && provenance.cameraSnapshots.length > 0 && (
        <>
          <h3>Camera snapshots</h3>
          <div className="camera-grid">
            {provenance.cameraSnapshots.map((cam) => (
              <a key={cam.cameraId} href={`/iot/cameras/${cam.cameraId}`}>
                <img src={cam.snapshotUrl} alt={cam.cameraName} />
                <div>{cam.cameraName} — {new Date(cam.capturedAt).toLocaleTimeString()}</div>
              </a>
            ))}
          </div>
        </>
      )}

      <h3>Citations</h3>
      <ul>
        {provenance.citations.map((c, i) => (
          <li key={i}>
            {c.url ? <a href={c.url}>{c.label}</a> : c.label}
            {c.snippet && <p className="snippet">{c.snippet}</p>}
          </li>
        ))}
      </ul>

      <div className="confidence">
        Confidence: {Math.round(provenance.confidence * 100)}%
      </div>
    </aside>
  );
}
```

---

## REPORTING PROGRESS

After each task, append a line to `docs/aisha-progress.md`:

```
| Task | Status | Files created | Tests | Coverage delta | Time |
|------|--------|---------------|-------|----------------|------|
| 1    | done   | 1             | 1     | +0.1%          | 12m  |
| 2    | done   | 1             | 1     | +0.1%          | 8m   |
...
```

After all 50 tasks, produce `docs/aisha-final-report.md`:

```markdown
# AIsha — Final Implementation Report

## Summary
- Tasks completed: 50/50
- New files: ~XX
- New tests: ~XX
- Backend lines: +XXXX
- Frontend lines: +XXXX

## Phase summary
- Phase 1 (Foundation): 6 tasks, X lines, X tests
- Phase 2 (Domain): 5 tasks, X lines, X tests
... etc.

## Tool inventory
- 12 read-only tools
- 6 camera/vision tools
- 4 analysis tools
- 5 action tools (high-stake)
- Total: 27 tools

## Provenance compliance
✅ All 27 tools return provenance shape
✅ TransparencyPanel renders all source types
✅ Camera snapshots displayed when applicable

## Test coverage
- Backend new code: ~XX%
- Frontend new code: ~XX%
- E2E Playwright: 1 full scenario

## Director pilot session
- Test scenarios passed: X/Y
- Latency p95: XXX ms
- Cost per day: $X.XX
- False wake word triggers: X / 8 hours

## Outstanding items
- ... (any deferred work)
```

---

## NEVER DO

- ❌ Skip a task ("not important")
- ❌ Mark a task complete without `pnpm test` passing
- ❌ Use `any` type in tool definitions
- ❌ Skip provenance — every tool MUST return it
- ❌ Hardcode API keys (use ConfigService)
- ❌ Make UI dark/futuristic (use modern Linear/Apple style — light, minimal)
- ❌ Mock business logic in tests (only mock external I/O)
- ❌ Add `console.log` to production
- ❌ Use `Promise.reject(new Error(...))` — use Result.Err
- ❌ Ask for permission per task (one-time blanket grant)
- ❌ Stop before task 50 ("good enough")

---

## ALWAYS DO

- ✅ Request one-time permission at start
- ✅ Create all 50 TaskCreate entries before starting work
- ✅ Execute in order: Task 1 → 50
- ✅ Run tests after each task
- ✅ Update docs/aisha-progress.md after each task
- ✅ Every tool returns `{ data, provenance }`
- ✅ TransparencyPanel shows every data source in UI
- ✅ Camera snapshots stored and displayed
- ✅ High-stake actions require voice confirmation
- ✅ Critical actions require PIN
- ✅ Audit log every conversation, tool call, action
- ✅ Use Result Pattern everywhere
- ✅ Final report with metrics + screenshots

---

## FINAL CHECKLIST (must all be true)

- [ ] All 50 tasks marked completed in TaskList
- [ ] `pnpm test:api` passes (no fails, no skips)
- [ ] `pnpm test:erp` passes
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 errors, 0 warnings)
- [ ] AIsha visible inside DirectorDashboard.tsx
- [ ] Wake word "Aisha" triggers with 95%+ accuracy
- [ ] TransparencyPanel renders for every response
- [ ] Camera snapshots display when camera tools used
- [ ] At least 27 tools registered and tested
- [ ] All API keys read from env (no hardcoded)
- [ ] Audit log table contains rows after pilot test
- [ ] docs/aisha-final-report.md written with all metrics
- [ ] Director pilot session passed (10+ commands tested)

---

## ONE-SENTENCE GOAL

> Build AIsha — a voice-only AI assistant integrated inside the Director Dashboard — with project-wide read access, AI camera vision, full data provenance shown in the UI, and 27 tools that let the Director run the company by speaking. Deliver in 50 atomic, verifiable tasks.

**Now start. Request permission once. Create the 50 tasks. Execute them. Report when done.**
