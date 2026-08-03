# P46 — NTF — Bildirishnoma + Telegram: NTF core: 5-table DDL + log CRUD + routing/template/quiet-config + bell + center fix

> Bajaruvchi: Muslimbek | To'lqin: Wave 1 | Bog'liqlik: P01 (schema barrel) TUGAGAN bo'lishi shart
> Yozilgan: 2026-06-19 | Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-21-NTF-2026-06-08.md`

---

## 0. ROL VA QOIDALAR

**Sen BAJARUVCHI agentsan.** Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki har direktiva boshida takrorlanadi — bular buzilsa FAZA YAKUNLANMAGAN hisoblanadi:

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
    `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila,
    ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Wave:** 1  
**dependsOn:** `["P01"]` — P01 (lib/db schema barrel) tugagan bo'lishi shart. Boshlanishdan oldin tekshir:
```bash
# P01 tekshiruvi:
ls Uzbek-Language-Module/lib/db/src/schema/index.ts   # mavjudmi?
# ntf-schema.ts barrel ga qo'shilganmi (P46 o'zi qo'shadi — P01 barreli mavjudligi kifoya)
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil:**

```
OWNED FILES (P46):
├── lib/db/src/schema/ntf-schema.ts                           [YANGI — yaratiladi]
├── apps/api/src/modules/notifications/infrastructure/repositories/
│   ├── ntf-log.repository.ts                                 [YANGI — yaratiladi]
│   ├── ntf-template.repository.ts                            [YANGI — yaratiladi]
│   └── ntf-routing.repository.ts                             [YANGI — yaratiladi]
├── apps/api/src/modules/notifications/application/
│   ├── ntf.service.ts                                        [YANGI — yaratiladi]
│   ├── ntf-template.service.ts                               [YANGI — yaratiladi]
│   └── ntf-routing.service.ts                                [YANGI — yaratiladi]
├── apps/api/src/modules/notifications/presentation/
│   └── ntf-log.controller.ts                                 [YANGI — yaratiladi]
├── apps/api/src/modules/notifications/notifications.module.ts [MAVJUD — o'zgartirish]
├── artifacts/erp-dashboard/src/pages/NotificationCenter.tsx  [MAVJUD — o'zgartirish (endpoint fix)]
├── artifacts/erp-dashboard/src/erp-modern-ui/AppShellModern.tsx [MAVJUD — Bell qo'shish]
├── artifacts/erp-dashboard/src/pages/NtfRoutingMatrix.tsx    [YANGI — yaratiladi]
└── artifacts/erp-dashboard/src/pages/NtfScheduleConfig.tsx   [YANGI — yaratiladi]
```

**DDL DARVOZASI:** Bu paket 5 ta yangi jadval talab qiladi. Migration fayli yoziladi LEKIN `GATED` belgisi bilan — egasi `-- APPROVED: <ism> <sana>` izohini migration faylga qo'shib "ha, bajar" demaguncha `pnpm drizzle-kit push` ISHGA TUSHIRILMAYDI. §5 da to'liq DDL ko'rsatilgan.

**Mavjud `notifications.module.ts` o'zgartiriladi** — yangi provayderlar qo'shiladi, lekin MAVJUD provayderlar O'CHIRILMAYDI (Q-46 / Q-39).

**Mavjud `notifications.controller.ts`** — bu fayl TOUCHED EMAS (owned emas). Yangi `ntf-log.controller.ts` alohida controller sifatida yaratiladi va modulga ro'yxatdan o'tkaziladi.

---

## 2. VIZYON

### 2.1 Asosiy maqsad (EP-NTF-001..082 dan Phase 1 qismi)

NTF moduli ERP ning "asab tizimi" — har bir modul voqealarini yetkazib beradi. P46 Wave-1 maqsadi: **5 ta asosiy jadval yaratish + log CRUD + routing/template/quiet-config + Bell + NotificationCenter endpointini to'g'irlash.**

### 2.2 Egasi overridelari (OCHIQ-JAVOBLAR — bular A-defaultdan ustun turadi)

| Kod | Override |
|-----|----------|
| EP-NTF-008 | MIXED kanal: shaxsiy natijalar → shaxsiy chat; bo'lim xulosasi → guruh |
| EP-NTF-015 | Bildirishnoma tili = foydalanuvchi profilidagi til (uz/uz-cyr/ru) — shaxsiy; `ntf_log.user_lang` ustuni saqlab, shablon render shu tilga qarab qilinadi (MASTER-SAVOL-JAVOB EP-NTF-015) |
| EP-NTF-018 | Quiet hours = ish vaqtida normal, tunida faqat CRITICAL o'tadi; modul bo'yicha konfigurlash mumkin (Q140) |
| EP-NTF-021 | Telegram inline keyboard = HA (tasdiqlash/rad etish/tayinlash tugmalari); callback_query handler P47 da qo'shiladi |
| EP-NTF-016 | ACK faqat IMPORTANT+CRITICAL uchun (INFO uchun emas) |

### 2.3 Arxitektura printsiplari

- **E2 (karta-markazli routing):** Bildirishnoma SHAXSGA emas, LAVOZIMGA yo'naltiriladi. Xodim o'zgarsa, yangi egasi oladi. `ntf_routing_matrix` jadval bu haqiqatning yagona manbai (EP-NTF-079).
- **E5 (vertikal routing):** Eskalatsiya `employees.manager_id` zanjiri orqali — Vysotskiy 7 model.
- **EP-NTF-080 (immutable log):** `ntf_log` jadvaliga yozilgan qatorlar YANGILANMAYDI — faqat `read_at` va `ack_at` ustunlari UPDATE qilinadi (bu ikkisi EXCEPTION, qolgan barcha ustunlar IMMUTABLE).
- **EP-NTF-018 (quiet hours):** Bildirishnoma yuborishdan oldin `ntf_schedule_config.quiet_start..quiet_end` tekshiriladi. Agar quiet vaqt va priority != CRITICAL → BullMQ delayed queue (keyingi ertalab).

### 2.4 Qabul mezoni (vizyon bo'yicha — Q-40)

| Xususiyat | Qabul mezoni |
|-----------|--------------|
| `ntf_log` jadval | Real INSERT → `SELECT * FROM ntf_log` qaytaradi |
| `ntf_templates` jadval | Admin tahrir → reload → ko'rinadi |
| `ntf_routing_matrix` jadval | PUT endpoint → DB yangilanadi |
| `ntf_schedule_config` jadval | Quiet hours: quiet vaqtda INFO yuborilmaydi (BullMQ queue) |
| `ntf_bot_config` jadval | Token HECH QACHON DB da saqlanmaydi — faqat env kalit nomi |
| Bell icon | AppShellModern headerida Bell ko'rinadi, unread count badge ishlaydi |
| NotificationCenter | `/api/notifications/my` ni chaqiradi (eski `/api/pos/notifications` EMAS) |
| `NtfRoutingMatrix.tsx` | Admin sahifada routing matrix ko'rinadi va tahrirlanadi |
| `NtfScheduleConfig.tsx` | Admin sahifada schedule config ko'rinadi va tahrirlanadi |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (EXISTS) — bularni O'ZGARTIRMA, faqat kengaytir

**DB / Schema:**
- `lib/db/src/schema/core/core-users.ts:36` — `notifications` pgTable mavjud: id, userId, type, title, message, read, body, isRead, priority, readAt, sentViaTelegram, telegramMessageId, metadata. **Bu jadval saqlanadi.**
- `lib/db/src/schema/hr-safety.ts:95` — `notification_logs` pgTable mavjud (HR module uchun, kanal/status CHECK). **Bu jadval ham saqlanadi — P46 bilan bog'liq emas.**
- `ntf_log`, `ntf_templates`, `ntf_routing_matrix`, `ntf_schedule_config`, `ntf_bot_config` — **MAVJUD EMAS** (yaratiladi).

**BE (NestJS):**
- `notifications.module.ts:1-86` — NotificationsModule mavjud. CQRS (CreateNotification/MarkRead/GetNotifications), 3 adapter (SMS/Email/Telegram), DrizzleNotificationRepo, TelegramSvc, NotificationPreferencesService, OrphanEventsListener va boshqa event handlerlar. **Bularning BARCHASI saqlanadi.**
- `notifications.controller.ts:1-180` — NotificationsController mavjud: GET `/notifications`, GET `/notifications/my`, GET `/notifications/my/unread-count`, PATCH `/:id/read`, PATCH `/read-all`, POST `/notifications`, GET/PUT/PATCH `/preferences`. JwtAuthGuard qo'yilgan. **Bu fayl TOUCHED EMAS — P46 owned emas.**
- `telegram.service.ts (notifications/telegram/):1-203` — TelegramSvc: DB ga avval yozadi, keyin Telegram API ga jo'natadi. ConfigService ishlatadi. **SAQLANADI.**
- `telegram-bot.adapter.ts:109-158` — `sendOrderStatusUpdate()`, `sendCertExpiry()`, `sendStockAlert()`, `sendQcResult()` — **STUB** (faqat `logger.log()` + `Ok(undefined)`). Bu buzuq kod — lekin P46 uchun EMAS (Wave 2+). **Bu faylga TEGMA.**
- `drizzle-telegram-svc.repo.ts:1-40` — `getUserChatId?()` — IMPLEMENT QILINMAGAN (optional interface). Bu `TelegramSvc.sendMessage()` ni doim `status:'pending'` qaytarishiga sabab. **P46 uchun EMAS — Wave 2 vazifasi.**

**FE:**
- `AppShellModern.tsx:144-153` — Header o'ng tomonda: `GlobalInboxBadge`, `ChatHeaderButton`, `DesignNotifications`, `LanguageSwitcher`, `ThemeToggleModern`, `UserAvatarButton`. **Bell icon YO'Q.**
- `NotificationCenter.tsx:61` — **BUZUQ:** `/api/pos/notifications` chaqirilmoqda (POS endpoint). To'g'risi: `/api/notifications/my`.
- `NotificationCenter.tsx:70-71` — **QOIDA BUZILISHI:** `useState + setInterval(30s)` ishlatilmoqda — useQuery/useMutation o'rniga (F1/F2 violation).
- `NotificationCenter.tsx:74-78` — markRead: `/api/pos/notifications/${id}/read` — **BUZUQ** endpoint.
- `NotificationCenter.tsx:81-85` — markAllRead: `/api/pos/notifications/read-all` — **BUZUQ** endpoint.
- `NtfRoutingMatrix.tsx` — **MAVJUD EMAS** (yaratiladi).
- `NtfScheduleConfig.tsx` — **MAVJUD EMAS** (yaratiladi).

### 3.2 Yo'q (MISSING) — P46 yaratadi

```
ntf_log, ntf_templates, ntf_routing_matrix, ntf_schedule_config, ntf_bot_config (5 jadval)
NtfLogRepository, NtfTemplateRepository, NtfRoutingRepository
NtfService, NtfTemplateService, NtfRoutingService
NtfLogController (GET/PATCH /api/ntf/log + /api/ntf/templates + /api/ntf/routing-matrix)
Bell icon + unread badge (AppShellModern header)
NtfRoutingMatrix.tsx (admin sahifa)
NtfScheduleConfig.tsx (admin sahifa)
```

### 3.3 Buzuq/Soxta (BROKEN/FAKE) — P46 to'g'irlaydi

| Fayl | Qator | Muammo | Tuzatish |
|------|-------|--------|----------|
| `NotificationCenter.tsx` | 61 | `/api/pos/notifications` — noto'g'ri endpoint | `/api/notifications/my` ga o'zgartir |
| `NotificationCenter.tsx` | 70-71 | `useState + setInterval` — F1/F2 buzilishi | `useQuery` + `queryClient.invalidateQueries` ga o'zgartir |
| `NotificationCenter.tsx` | 74-78 | `markRead` noto'g'ri endpoint | `/api/notifications/:id/read` → `PATCH` |
| `NotificationCenter.tsx` | 74 | `catch: noop comment` — F2 buzilishi | `onError` handler qo'sh, toast ko'rsat |
| `NotificationCenter.tsx` | 81-85 | `markAllRead` noto'g'ri endpoint | `/api/notifications/my/mark-all-read` → `POST` |

---

## 4. ISH (qadam-baqadam)

### Qadam 0: P01 bog'liqligini tekshir (READ-ONLY)

```bash
# P01 tugaganini tasdiqlash:
ls Uzbek-Language-Module/lib/db/src/schema/index.ts
# ntf-schema.ts barrel ga keyinroq qo'shiladi (Qadam 1 dan keyin)
```

Agar `index.ts` mavjud bo'lmasa — TO'XTA, P01 tugashini kut.

---

### Qadam 1: DDL — `lib/db/src/schema/ntf-schema.ts` (YANGI fayl)

**Fayl:** `lib/db/src/schema/ntf-schema.ts`

Bu fayl Drizzle ORM yordamida 5 ta yangi jadval ta'rifini o'z ichiga oladi. **Fayl yaratiladi — lekin migration ISHGA TUSHIRILMAYDI** (§5 da GATED migration mavjud, egasi ruxsatini kutadi).

```typescript
// lib/db/src/schema/ntf-schema.ts
import {
  pgTable, serial, integer, varchar, text, boolean,
  timestamp, time, jsonb, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { users } from './core/core-users';
import { orgFunctions } from './org-functions'; // P01/P04 dan
```

**Jadval 1 — `ntf_templates`** (EP-NTF-028: admin-editable, no code deploy):
```typescript
export const ntfTemplates = pgTable('ntf_templates', {
  id:            serial('id').primaryKey(),
  moduleCode:    varchar('module_code', { length: 30 }).notNull(),
  eventType:     varchar('event_type', { length: 60 }).notNull(),
  lang:          varchar('lang', { length: 10 }).notNull(),          // 'uz'|'ru'|'uz-cyr'
  titleTemplate: text('title_template').notNull(),
  bodyTemplate:  text('body_template').notNull(),
  priority:      varchar('priority', { length: 20 }).default('INFO'), // INFO|IMPORTANT|CRITICAL
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniqModuleEventLang: uniqueIndex('ntf_templates_module_event_lang_uidx')
    .on(t.moduleCode, t.eventType, t.lang),
}));
```

**Jadval 2 — `ntf_log`** (EP-NTF-027: immutable archive, EP-NTF-080):
```typescript
export const ntfLog = pgTable('ntf_log', {
  id:             serial('id').primaryKey(),
  templateId:     integer('template_id').references(() => ntfTemplates.id),    // NULLABLE
  recipientUserId: integer('recipient_user_id').references(() => users.id).notNull(),
  recipientCardId: integer('recipient_card_id'),                               // FK org_functions.id — NULLABLE (Phase 1 bo'lsa ham)
  senderUserId:   integer('sender_user_id'),                                   // NULLABLE (system events)
  channel:        varchar('channel', { length: 20 }).notNull(),                // personal|group|email|sms
  sentAt:         timestamp('sent_at', { withTimezone: true }).defaultNow(),
  readAt:         timestamp('read_at', { withTimezone: true }),
  ackAt:          timestamp('ack_at', { withTimezone: true }),
  requiresAck:    boolean('requires_ack').default(false),                      // EP-NTF-016: faqat IMPORTANT+CRITICAL
  priority:       varchar('priority', { length: 20 }).notNull().default('INFO'), // INFO|IMPORTANT|CRITICAL
  payload:        jsonb('payload'),                                             // event context
  archived:       boolean('archived').default(false),
  idempotencyKey: varchar('idempotency_key', { length: 128 }),                 // UNIQUE — duplicate yuborishni oldini olish
  moduleCode:     varchar('module_code', { length: 30 }),
  userLang:       varchar('user_lang', { length: 10 }),                        // EP-NTF-015: foydalanuvchi tili (uz|ru|uz-cyr) — shablon render uchun
}, (t) => ({
  idempotencyUidx:   uniqueIndex('ntf_log_idempotency_key_uidx').on(t.idempotencyKey),
  recipientUserIdx:  index('ntf_log_recipient_user_idx').on(t.recipientUserId),
  sentAtIdx:         index('ntf_log_sent_at_idx').on(t.sentAt),
  priorityIdx:       index('ntf_log_priority_idx').on(t.priority),
}));
```

> ⚠️ IMMUTABLE qoida (EP-NTF-080): `ntf_log` ga yozilgan qatorlarni UPDATE QILMA. Faqat `readAt` va `ackAt` ustunlari uchun UPDATE ruxsat etiladi — repository metodlarida bu cheklov aniq yozilishi shart.

**Jadval 3 — `ntf_routing_matrix`** (EP-NTF-079: owner-editable):
```typescript
export const ntfRoutingMatrix = pgTable('ntf_routing_matrix', {
  id:               serial('id').primaryKey(),
  eventCode:        varchar('event_code', { length: 60 }).notNull(),
  roleCode:         varchar('role_code', { length: 50 }).notNull(),
  channel:          varchar('channel', { length: 20 }).default('personal'),    // personal|group|both
  quietHoursExempt: boolean('quiet_hours_exempt').default(false),
  thresholdValue:   varchar('threshold_value', { length: 50 }),                // EP-NTF-006/007: owner konfiguratsiya
}, (t) => ({
  uniqEventRole: uniqueIndex('ntf_routing_matrix_event_role_uidx')
    .on(t.eventCode, t.roleCode),
  eventCodeIdx:  index('ntf_routing_matrix_event_code_idx').on(t.eventCode),
}));
```

**Jadval 4 — `ntf_schedule_config`** (EP-NTF-018: per-module quiet hours, Q140):
```typescript
export const ntfScheduleConfig = pgTable('ntf_schedule_config', {
  id:          serial('id').primaryKey(),
  moduleCode:  varchar('module_code', { length: 30 }).notNull(),
  eventCode:   varchar('event_code', { length: 60 }).notNull(),
  cronExpr:    varchar('cron_expr', { length: 100 }),
  isActive:    boolean('is_active').default(true),
  quietStart:  time('quiet_start'),       // masalan: '22:00'
  quietEnd:    time('quiet_end'),         // masalan: '07:00'
}, (t) => ({
  uniqModuleEvent: uniqueIndex('ntf_schedule_config_module_event_uidx')
    .on(t.moduleCode, t.eventCode),
}));
```

**Jadval 5 — `ntf_bot_config`** (EP-NTF-019: per-module bot registry):
```typescript
export const ntfBotConfig = pgTable('ntf_bot_config', {
  id:              serial('id').primaryKey(),
  moduleCode:      varchar('module_code', { length: 30 }).notNull(),
  botTokenEnvKey:  varchar('bot_token_env_key', { length: 100 }).notNull(),   // ❗ ENV KALIT NOMI — token qiymati EMAS
  isActive:        boolean('is_active').default(true),
  lastPing:        timestamp('last_ping', { withTimezone: true }),
}, (t) => ({
  moduleCodeUidx: uniqueIndex('ntf_bot_config_module_code_uidx').on(t.moduleCode),
}));
```

> ⛔ XAVFSIZLIK (Q-30 / Qoida A): `botTokenEnvKey` ustuniga HECH QACHON haqiqiy bot token qiymati yozilmaydi — faqat env o'zgaruvchi nomi (masalan: `'NTF_HR_BOT_TOKEN'`). Token `ConfigService.getOrThrow(row.botTokenEnvKey)` orqali olinadi.

**Export va barrel ro'yxatdan o'tkazish:**

`ntf-schema.ts` faylning eng pastiga qo'sh:
```typescript
// Type exports
export type NtfLog           = typeof ntfLog.$inferSelect;
export type NewNtfLog        = typeof ntfLog.$inferInsert;
export type NtfTemplate      = typeof ntfTemplates.$inferSelect;
export type NtfRoutingRule   = typeof ntfRoutingMatrix.$inferSelect;
export type NtfSchedule      = typeof ntfScheduleConfig.$inferSelect;
export type NtfBotConfig     = typeof ntfBotConfig.$inferSelect;
```

Keyin `lib/db/src/schema/index.ts` ga qo'sh (FAQAT shu qatorni, boshqa hech narsani o'zgartirma):
```typescript
export * from './ntf-schema';
```

---

### Qadam 2: NtfLogRepository

**Fayl:** `apps/api/src/modules/notifications/infrastructure/repositories/ntf-log.repository.ts`

```typescript
/**
 * @module ntf-log.repository
 * NtfLog — immutable bildirishnoma arxivi. INSERT + read_at/ack_at UPDATE only.
 * EP-NTF-080: sent qatorlar BOSHQA ustunlar bo'yicha YANGILANMAYDI.
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { ntfLog, NtfLog, NewNtfLog } from '@europrint/schemas';
import { Result, Ok, Err, AppErr } from '@common/result';

export const NTF_LOG_REPO = Symbol('NTF_LOG_REPO');

export interface INtfLogRepository {
  insert(dto: NewNtfLog): Promise<Result<NtfLog>>;
  findByRecipient(recipientUserId: number, limit?: number): Promise<Result<NtfLog[]>>;
  findUnread(recipientUserId: number): Promise<Result<NtfLog[]>>;
  markRead(id: number): Promise<Result<void>>;           // EP-NTF-080: faqat readAt yangilanadi
  markAck(id: number): Promise<Result<void>>;            // EP-NTF-016: faqat ackAt yangilanadi
  findAll(filters: NtfLogFilters): Promise<Result<{ rows: NtfLog[]; total: number }>>;
}

export interface NtfLogFilters {
  moduleCode?: string;
  priority?: string;
  archived?: boolean;
  page: number;
  limit: number;
}

@Injectable()
export class DrizzleNtfLogRepository implements INtfLogRepository {
  async insert(dto: NewNtfLog): Promise<Result<NtfLog>> {
    try {
      const rows = await db.insert(ntfLog).values(dto).returning();
      if (!rows[0]) return Err(AppErr('DB_ERROR', 'ntf_log INSERT qaytarmadi'));
      return Ok(rows[0]);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async findByRecipient(recipientUserId: number, limit = 50): Promise<Result<NtfLog[]>> {
    try {
      const rows = await db
        .select()
        .from(ntfLog)
        .where(eq(ntfLog.recipientUserId, recipientUserId))
        .orderBy(desc(ntfLog.sentAt))
        .limit(limit);
      return Ok(rows);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async findUnread(recipientUserId: number): Promise<Result<NtfLog[]>> {
    try {
      const rows = await db
        .select()
        .from(ntfLog)
        .where(and(eq(ntfLog.recipientUserId, recipientUserId), isNull(ntfLog.readAt)))
        .orderBy(desc(ntfLog.sentAt))
        .limit(100);
      return Ok(rows);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  // EP-NTF-080: faqat readAt yangilanadi — boshqa ustunlar IMMUTABLE
  async markRead(id: number): Promise<Result<void>> {
    try {
      await db
        .update(ntfLog)
        .set({ readAt: new Date() })
        .where(eq(ntfLog.id, id));
      return Ok(undefined);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  // EP-NTF-016: faqat ackAt yangilanadi
  async markAck(id: number): Promise<Result<void>> {
    try {
      await db
        .update(ntfLog)
        .set({ ackAt: new Date() })
        .where(eq(ntfLog.id, id));
      return Ok(undefined);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async findAll(filters: NtfLogFilters): Promise<Result<{ rows: NtfLog[]; total: number }>> {
    try {
      const conditions: Parameters<typeof and>[] = [];
      if (filters.moduleCode) conditions.push(eq(ntfLog.moduleCode, filters.moduleCode) as any);
      if (filters.priority)   conditions.push(eq(ntfLog.priority, filters.priority) as any);
      if (filters.archived !== undefined) {
        conditions.push(eq(ntfLog.archived, filters.archived) as any);
      }

      const offset = (filters.page - 1) * filters.limit;
      const rows = await db
        .select()
        .from(ntfLog)
        .where(conditions.length ? and(...(conditions as any[])) : undefined)
        .orderBy(desc(ntfLog.sentAt))
        .limit(filters.limit)
        .offset(offset);

      // NOTE: Drizzle COUNT lateral — alohida so'rov (N+1 oldini olish uchun bitta additional query)
      const countRows = await db.select().from(ntfLog)
        .where(conditions.length ? and(...(conditions as any[])) : undefined);
      return Ok({ rows, total: countRows.length });
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
```

---

### Qadam 3: NtfTemplateRepository

**Fayl:** `apps/api/src/modules/notifications/infrastructure/repositories/ntf-template.repository.ts`

```typescript
/**
 * @module ntf-template.repository
 * NtfTemplates — admin-editable bildirishnoma shablonlari (EP-NTF-028).
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and } from 'drizzle-orm';
import { ntfTemplates, NtfTemplate } from '@europrint/schemas';
import { Result, Ok, Err, AppErr } from '@common/result';

export const NTF_TEMPLATE_REPO = Symbol('NTF_TEMPLATE_REPO');

export interface INtfTemplateRepository {
  findAll(): Promise<Result<NtfTemplate[]>>;
  findByModuleEventLang(
    moduleCode: string,
    eventType: string,
    lang: string,
  ): Promise<Result<NtfTemplate | null>>;
  update(id: number, patch: Partial<Pick<NtfTemplate, 'titleTemplate' | 'bodyTemplate' | 'priority'>>): Promise<Result<NtfTemplate>>;
}

@Injectable()
export class DrizzleNtfTemplateRepository implements INtfTemplateRepository {
  async findAll(): Promise<Result<NtfTemplate[]>> {
    try {
      const rows = await db.select().from(ntfTemplates);
      return Ok(rows);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async findByModuleEventLang(
    moduleCode: string,
    eventType: string,
    lang: string,
  ): Promise<Result<NtfTemplate | null>> {
    try {
      const rows = await db
        .select()
        .from(ntfTemplates)
        .where(
          and(
            eq(ntfTemplates.moduleCode, moduleCode),
            eq(ntfTemplates.eventType, eventType),
            eq(ntfTemplates.lang, lang),
          ),
        )
        .limit(1);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async update(
    id: number,
    patch: Partial<Pick<NtfTemplate, 'titleTemplate' | 'bodyTemplate' | 'priority'>>,
  ): Promise<Result<NtfTemplate>> {
    try {
      const rows = await db
        .update(ntfTemplates)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(ntfTemplates.id, id))
        .returning();
      if (!rows[0]) return Err(AppErr('NOT_FOUND', `NtfTemplate #${id} topilmadi`));
      return Ok(rows[0]);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
```

---

### Qadam 4: NtfRoutingRepository

**Fayl:** `apps/api/src/modules/notifications/infrastructure/repositories/ntf-routing.repository.ts`

```typescript
/**
 * @module ntf-routing.repository
 * NtfRoutingMatrix + NtfScheduleConfig + NtfBotConfig — routing va jadval.
 * EP-NTF-079: yagona haqiqat manbai "kim nimani oladi".
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and } from 'drizzle-orm';
import {
  ntfRoutingMatrix, ntfScheduleConfig, ntfBotConfig,
  NtfRoutingRule, NtfSchedule, NtfBotConfig,
} from '@europrint/schemas';
import { Result, Ok, Err, AppErr } from '@common/result';

export const NTF_ROUTING_REPO = Symbol('NTF_ROUTING_REPO');

export interface INtfRoutingRepository {
  findAllRules(): Promise<Result<NtfRoutingRule[]>>;
  findRulesByEvent(eventCode: string): Promise<Result<NtfRoutingRule[]>>;
  updateRule(
    id: number,
    patch: Partial<Pick<NtfRoutingRule, 'channel' | 'quietHoursExempt' | 'thresholdValue'>>,
  ): Promise<Result<NtfRoutingRule>>;

  findScheduleForEvent(moduleCode: string, eventCode: string): Promise<Result<NtfSchedule | null>>;
  findAllSchedules(): Promise<Result<NtfSchedule[]>>;
  updateSchedule(
    id: number,
    patch: Partial<Pick<NtfSchedule, 'cronExpr' | 'isActive' | 'quietStart' | 'quietEnd'>>,
  ): Promise<Result<NtfSchedule>>;

  findBotConfig(moduleCode: string): Promise<Result<NtfBotConfig | null>>;
  findAllBotConfigs(): Promise<Result<NtfBotConfig[]>>;
}

@Injectable()
export class DrizzleNtfRoutingRepository implements INtfRoutingRepository {
  async findAllRules(): Promise<Result<NtfRoutingRule[]>> {
    try {
      return Ok(await db.select().from(ntfRoutingMatrix));
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async findRulesByEvent(eventCode: string): Promise<Result<NtfRoutingRule[]>> {
    try {
      return Ok(await db.select().from(ntfRoutingMatrix).where(eq(ntfRoutingMatrix.eventCode, eventCode)));
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async updateRule(
    id: number,
    patch: Partial<Pick<NtfRoutingRule, 'channel' | 'quietHoursExempt' | 'thresholdValue'>>,
  ): Promise<Result<NtfRoutingRule>> {
    try {
      const rows = await db.update(ntfRoutingMatrix).set(patch).where(eq(ntfRoutingMatrix.id, id)).returning();
      if (!rows[0]) return Err(AppErr('NOT_FOUND', `RoutingRule #${id} topilmadi`));
      return Ok(rows[0]);
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async findScheduleForEvent(moduleCode: string, eventCode: string): Promise<Result<NtfSchedule | null>> {
    try {
      const rows = await db
        .select()
        .from(ntfScheduleConfig)
        .where(and(eq(ntfScheduleConfig.moduleCode, moduleCode), eq(ntfScheduleConfig.eventCode, eventCode)))
        .limit(1);
      return Ok(rows[0] ?? null);
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async findAllSchedules(): Promise<Result<NtfSchedule[]>> {
    try {
      return Ok(await db.select().from(ntfScheduleConfig));
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async updateSchedule(
    id: number,
    patch: Partial<Pick<NtfSchedule, 'cronExpr' | 'isActive' | 'quietStart' | 'quietEnd'>>,
  ): Promise<Result<NtfSchedule>> {
    try {
      const rows = await db.update(ntfScheduleConfig).set(patch).where(eq(ntfScheduleConfig.id, id)).returning();
      if (!rows[0]) return Err(AppErr('NOT_FOUND', `ScheduleConfig #${id} topilmadi`));
      return Ok(rows[0]);
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async findBotConfig(moduleCode: string): Promise<Result<NtfBotConfig | null>> {
    try {
      const rows = await db.select().from(ntfBotConfig).where(eq(ntfBotConfig.moduleCode, moduleCode)).limit(1);
      return Ok(rows[0] ?? null);
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async findAllBotConfigs(): Promise<Result<NtfBotConfig[]>> {
    try {
      return Ok(await db.select().from(ntfBotConfig));
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }
}
```

---

### Qadam 5: NtfService (application qatlami)

**Fayl:** `apps/api/src/modules/notifications/application/ntf.service.ts`

```typescript
/**
 * @module ntf.service
 * NTF asosiy xizmat: log kiritish, o'qish, read/ack belgilash.
 * Controller db ga to'g'ridan teg olmaydi — faqat shu service orqali.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { NTF_LOG_REPO, INtfLogRepository, NtfLogFilters } from '../infrastructure/repositories/ntf-log.repository';
import { NtfLog, NewNtfLog } from '@europrint/schemas';

// Zod sxema (controller validatsiyasi uchun eksport)
import { z } from 'zod';
export const CreateNtfLogSchema = z.object({
  recipientUserId: z.number().int().positive(),
  channel:         z.enum(['personal', 'group', 'email', 'sms']),
  priority:        z.enum(['INFO', 'IMPORTANT', 'CRITICAL']).default('INFO'),
  templateId:      z.number().int().positive().optional(),
  recipientCardId: z.number().int().positive().optional(),
  senderUserId:    z.number().int().positive().optional(),
  payload:         z.record(z.unknown()).optional(),
  moduleCode:      z.string().max(30).optional(),
  idempotencyKey:  z.string().max(128).optional(),
  requiresAck:     z.boolean().optional(),
  // EP-NTF-015: foydalanuvchi tili — employees.lang yoki users.language dan olinadi
  userLang:        z.enum(['uz', 'ru', 'uz-cyr']).optional(),
});
export type CreateNtfLogDto = z.infer<typeof CreateNtfLogSchema>;

@Injectable()
export class NtfService {
  constructor(
    @Inject(NTF_LOG_REPO) private readonly logRepo: INtfLogRepository,
  ) {}

  async logNotification(dto: CreateNtfLogDto): Promise<Result<NtfLog>> {
    // requiresAck: EP-NTF-016 — faqat IMPORTANT+CRITICAL
    const requiresAck = dto.requiresAck ?? (dto.priority === 'IMPORTANT' || dto.priority === 'CRITICAL');
    const newLog: NewNtfLog = {
      ...dto,
      requiresAck,
      archived: false,
    };
    return this.logRepo.insert(newLog);
  }

  async getUnread(recipientUserId: number): Promise<Result<NtfLog[]>> {
    return this.logRepo.findUnread(recipientUserId);
  }

  async getLog(filters: NtfLogFilters): Promise<Result<{ rows: NtfLog[]; total: number }>> {
    return this.logRepo.findAll(filters);
  }

  async markRead(id: number): Promise<Result<void>> {
    return this.logRepo.markRead(id);
  }

  // EP-NTF-016: ack faqat requiresAck=true qatorlar uchun mantiqan ma'noli
  async markAck(id: number): Promise<Result<void>> {
    return this.logRepo.markAck(id);
  }
}
```

---

### Qadam 6: NtfTemplateService

**Fayl:** `apps/api/src/modules/notifications/application/ntf-template.service.ts`

```typescript
/**
 * @module ntf-template.service
 * Shablon olish va render (EP-NTF-028).
 * renderTemplate: ${var} o'rniga qiymat qo'yish.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  NTF_TEMPLATE_REPO,
  INtfTemplateRepository,
} from '../infrastructure/repositories/ntf-template.repository';
import { NtfTemplate } from '@europrint/schemas';

import { z } from 'zod';
export const UpdateTemplateSchema = z.object({
  titleTemplate: z.string().min(1).max(500).optional(),
  bodyTemplate:  z.string().min(1).max(4000).optional(),
  priority:      z.enum(['INFO', 'IMPORTANT', 'CRITICAL']).optional(),
});
export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;

@Injectable()
export class NtfTemplateService {
  constructor(
    @Inject(NTF_TEMPLATE_REPO) private readonly templateRepo: INtfTemplateRepository,
  ) {}

  /**
   * EP-NTF-015: lang = foydalanuvchi profilidan (uz/uz-cyr/ru).
   * Caller: NtfService.logNotification(dto.userLang ?? 'uz') ga o'tkazadi.
   * Fallback zanjiri: uz-cyr → uz → null (ru uchun: ru → uz → null).
   */
  async getTemplate(
    moduleCode: string,
    eventType: string,
    lang: string,
  ): Promise<Result<NtfTemplate | null>> {
    const result = await this.templateRepo.findByModuleEventLang(moduleCode, eventType, lang);
    if (!result.ok) return result;
    // fallback: uz-cyr → uz, ru → uz, uz → null
    if (!result.data && lang !== 'uz') {
      return this.templateRepo.findByModuleEventLang(moduleCode, eventType, 'uz');
    }
    return result;
  }

  /** ${var_name} → qiymat bilan almashtirish */
  renderTemplate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const trimmed = key.trim();
      return String(vars[trimmed] ?? `{${trimmed}}`);
    });
  }

  async getAllTemplates(): Promise<Result<NtfTemplate[]>> {
    return this.templateRepo.findAll();
  }

  async updateTemplate(id: number, dto: UpdateTemplateDto): Promise<Result<NtfTemplate>> {
    return this.templateRepo.update(id, dto);
  }
}
```

---

### Qadam 7: NtfRoutingService

**Fayl:** `apps/api/src/modules/notifications/application/ntf-routing.service.ts`

```typescript
/**
 * @module ntf-routing.service
 * EP-NTF-079: routing matrix + EP-NTF-018: quiet hours tekshiruvi.
 * E2: karta-markazli routing (card/lavozim bo'yicha, shaxs bo'yicha emas).
 * E5: vertikal eskalatsiya manager_id zanjiri orqali.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  NTF_ROUTING_REPO,
  INtfRoutingRepository,
} from '../infrastructure/repositories/ntf-routing.repository';
import { NtfRoutingRule, NtfSchedule, NtfBotConfig } from '@europrint/schemas';

import { z } from 'zod';
export const UpdateRoutingRuleSchema = z.object({
  channel:          z.enum(['personal', 'group', 'both']).optional(),
  quietHoursExempt: z.boolean().optional(),
  thresholdValue:   z.string().max(50).optional(),
});
export const UpdateScheduleSchema = z.object({
  cronExpr:    z.string().max(100).optional(),
  isActive:    z.boolean().optional(),
  quietStart:  z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format').optional(),
  quietEnd:    z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format').optional(),
});

export interface OrgContext {
  cardId?: number;
  roleCode?: string;
  moduleCode?: string;
}

@Injectable()
export class NtfRoutingService {
  constructor(
    @Inject(NTF_ROUTING_REPO) private readonly routingRepo: INtfRoutingRepository,
  ) {}

  /** EP-NTF-079: eventCode + roleCode mos keladigan routing qoidalarini qaytaradi */
  async resolveRecipients(
    eventCode: string,
    orgContext: OrgContext,
  ): Promise<Result<NtfRoutingRule[]>> {
    const result = await this.routingRepo.findRulesByEvent(eventCode);
    if (!result.ok) return result;
    // roleCode bo'yicha filter (agar berilgan bo'lsa)
    const rules = Array.isArray(result.data) ? result.data : [];
    const filtered = orgContext.roleCode
      ? rules.filter(r => r.roleCode === orgContext.roleCode || r.roleCode === '*')
      : rules;
    return Ok(filtered);
  }

  /** EP-NTF-018: quiet hours aktiv ekanligini tekshirish */
  async isQuietHours(moduleCode: string, eventCode: string): Promise<Result<boolean>> {
    const schedResult = await this.routingRepo.findScheduleForEvent(moduleCode, eventCode);
    if (!schedResult.ok) return schedResult;
    const sched = schedResult.data;
    if (!sched || !sched.quietStart || !sched.quietEnd) return Ok(false);

    const now = new Date();
    const [startH, startM] = sched.quietStart.split(':').map(Number);
    const [endH, endM]     = sched.quietEnd.split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins   = endH * 60 + endM;

    // Tungi quiet (masalan 22:00 → 07:00) zanjirini ham qo'llaydi
    const isQuiet = startMins > endMins
      ? nowMins >= startMins || nowMins < endMins
      : nowMins >= startMins && nowMins < endMins;
    return Ok(isQuiet);
  }

  async getAllRules(): Promise<Result<NtfRoutingRule[]>> {
    return this.routingRepo.findAllRules();
  }

  async updateRule(
    id: number,
    dto: z.infer<typeof UpdateRoutingRuleSchema>,
  ): Promise<Result<NtfRoutingRule>> {
    return this.routingRepo.updateRule(id, dto);
  }

  async getAllSchedules(): Promise<Result<NtfSchedule[]>> {
    return this.routingRepo.findAllSchedules();
  }

  async updateSchedule(
    id: number,
    dto: z.infer<typeof UpdateScheduleSchema>,
  ): Promise<Result<NtfSchedule>> {
    return this.routingRepo.updateSchedule(id, dto);
  }

  async getAllBotConfigs(): Promise<Result<NtfBotConfig[]>> {
    return this.routingRepo.findAllBotConfigs();
  }
}
```

---

### Qadam 8: NtfLogController

**Fayl:** `apps/api/src/modules/notifications/presentation/ntf-log.controller.ts`

> ⚠️ Bu YANGI controller. Mavjud `notifications.controller.ts` ga TEGMA (u owned emas).

```typescript
/**
 * @module ntf-log.controller
 * NTF log CRUD + template + routing matrix endpointlari.
 * Barcha endpointlar JwtAuthGuard bilan himoyalangan.
 * Routing matrix admin/director uchun cheklangan (EP-NTF-079).
 */
import {
  Body, Controller, Get, Param, ParseIntPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { NtfService, CreateNtfLogSchema } from '../application/ntf.service';
import { NtfTemplateService, UpdateTemplateSchema } from '../application/ntf-template.service';
import {
  NtfRoutingService,
  UpdateRoutingRuleSchema,
  UpdateScheduleSchema,
} from '../application/ntf-routing.service';

@ApiTags('NTF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ntf')
export class NtfLogController {
  constructor(
    private readonly ntfSvc:      NtfService,
    private readonly templateSvc: NtfTemplateService,
    private readonly routingSvc:  NtfRoutingService,
  ) {}

  // ─── Log endpoints ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Barcha NTF loglarni ko'rish (admin)' })
  @Get('log')
  @Roles('admin', 'super_admin', 'director')
  async getLog(
    @Query('moduleCode') moduleCode?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.ntfSvc.getLog({
      moduleCode,
      priority,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { data: result.data.rows, total: result.data.total };
  }

  @ApiOperation({ summary: 'Mening o'qilmagan bildirishnomalarim (ntf_log)' })
  @Get('unread')
  async getUnread(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.ntfSvc.getUnread(user.id);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { data: result.data };
  }

  @ApiOperation({ summary: 'Bildirishnomani o'qilgan deb belgilash' })
  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    const result = await this.ntfSvc.markRead(id);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { id, readAt: new Date() };
  }

  @ApiOperation({ summary: 'Bildirishnomani tasdiqlash (ACK) — faqat IMPORTANT+CRITICAL' })
  @Patch(':id/ack')
  async markAck(@Param('id', ParseIntPipe) id: number) {
    const result = await this.ntfSvc.markAck(id);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { id, ackAt: new Date() };
  }

  @ApiOperation({ summary: 'Yangi NTF log yozuvi (admin/service)' })
  @Post('log')
  @Roles('admin', 'super_admin')
  async createLog(@Body() body: unknown) {
    const dto = CreateNtfLogSchema.parse(body);
    const result = await this.ntfSvc.logNotification(dto);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return result.data;
  }

  // ─── Template endpoints ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Barcha shablon ro'yxati' })
  @Get('templates')
  @Roles('admin', 'super_admin', 'director')
  async getTemplates() {
    const result = await this.templateSvc.getAllTemplates();
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { data: result.data };
  }

  @ApiOperation({ summary: 'Shablon tahrirlash — admin deploy kerak emas (EP-NTF-028)' })
  @Patch('templates/:id')
  @Roles('admin', 'super_admin')
  async updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateTemplateSchema.parse(body);
    const result = await this.templateSvc.updateTemplate(id, dto);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return result.data;
  }

  // ─── Routing matrix endpoints ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Routing matrix (EP-NTF-079) — admin/director only' })
  @Get('routing-matrix')
  @Roles('admin', 'super_admin', 'director')
  async getRoutingMatrix() {
    const result = await this.routingSvc.getAllRules();
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { data: result.data };
  }

  @ApiOperation({ summary: 'Routing qoidasini yangilash — egasi/admin' })
  @Patch('routing-matrix/:id')
  @Roles('admin', 'super_admin')
  async updateRoutingRule(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateRoutingRuleSchema.parse(body);
    const result = await this.routingSvc.updateRule(id, dto);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return result.data;
  }

  // ─── Schedule config endpoints ────────────────────────────────────────────

  @ApiOperation({ summary: 'Barcha jadval konfiguratsiyalari (EP-NTF-018)' })
  @Get('schedules')
  @Roles('admin', 'super_admin', 'director')
  async getSchedules() {
    const result = await this.routingSvc.getAllSchedules();
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return { data: result.data };
  }

  @ApiOperation({ summary: 'Quiet hours / cron konfiguratsiyasini yangilash' })
  @Patch('schedules/:id')
  @Roles('admin', 'super_admin')
  async updateSchedule(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateScheduleSchema.parse(body);
    const result = await this.routingSvc.updateSchedule(id, dto);
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    return result.data;
  }

  // ─── Bot config endpoints ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Per-modul bot konfiguratsiyalari (EP-NTF-019)' })
  @Get('bot-configs')
  @Roles('admin', 'super_admin')
  async getBotConfigs() {
    const result = await this.routingSvc.getAllBotConfigs();
    if (!result.ok) throw new Error(result.error?.message ?? 'Xatolik');
    // ⛔ botTokenEnvKey HAM xavfsiz — bu faqat ENV kalit nomi (token qiymati emas)
    return { data: result.data };
  }
}
```

---

### Qadam 9: notifications.module.ts yangilash

**Fayl:** `apps/api/src/modules/notifications/notifications.module.ts`

MAVJUD barcha provayderlar SAQLANADI (Q-46). Faqat yangi P46 provayderlar QO'SHILADI:

```typescript
// Yangi importlar (mavjud importlar o'CHIRILMAYDI — faqat qo'shiladi):
import { NtfLogController } from './presentation/ntf-log.controller';
import { NtfService } from './application/ntf.service';
import { NtfTemplateService } from './application/ntf-template.service';
import { NtfRoutingService } from './application/ntf-routing.service';
import { DrizzleNtfLogRepository, NTF_LOG_REPO } from './infrastructure/repositories/ntf-log.repository';
import { DrizzleNtfTemplateRepository, NTF_TEMPLATE_REPO } from './infrastructure/repositories/ntf-template.repository';
import { DrizzleNtfRoutingRepository, NTF_ROUTING_REPO } from './infrastructure/repositories/ntf-routing.repository';
```

`@Module()` dekoratoriga:

```typescript
// controllers masiviga qo'sh:
controllers: [NotificationsController, NtfLogController],

// providers masiviga qo'sh (... mavjud provayderlar):
providers: [
  ...commandHandlers, ...eventHandlers, ...queryHandlers,
  ...senders, ...repositories,
  TelegramSvc, NotificationPreferencesService,
  NotificationPreferencesRepository,
  NotificationSchemaService, NotificationSchemaRepository,
  // P46 yangi provayderlar:
  NtfService, NtfTemplateService, NtfRoutingService,
  { provide: NTF_LOG_REPO,      useClass: DrizzleNtfLogRepository },
  { provide: NTF_TEMPLATE_REPO, useClass: DrizzleNtfTemplateRepository },
  { provide: NTF_ROUTING_REPO,  useClass: DrizzleNtfRoutingRepository },
],

// exports masiviga ham qo'sh:
exports: [
  ...existingExports,
  NtfService, NtfTemplateService, NtfRoutingService,
],
```

---

### Qadam 10: NotificationCenter.tsx to'g'irlash

**Fayl:** `artifacts/erp-dashboard/src/pages/NotificationCenter.tsx`

**Muammo 1 (qator 61):** `/api/pos/notifications` → `/api/notifications/my`  
**Muammo 2 (qator 70-71):** `useState+setInterval` → `useQuery`  
**Muammo 3 (qator 74-85):** noto'g'ri markRead/markAllRead endpointlar + noop catch  
**Muammo 4:** `useMutation` `onError` handler yo'q (F2 buzilishi)  

**To'g'irilgan fayl (to'liq qayta yozish — mavjud TYPE_CONFIG/fmtDate/Notification interfeyslari SAQLANADI):**

```tsx
/**
 * NotificationCenter.tsx — TO'G'IRILGAN
 * ❌ Eski: /api/pos/notifications (noto'g'ri) + useState+setInterval (F1/F2 buzilishi)
 * ✅ Yangi: /api/notifications/my + useQuery/useMutation (Qoida F1/F2)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { useState } from "react";

// Notification interfeysi, TYPE_CONFIG, fmtDate — SAQLANADI (mavjud kod)
// ... (to'g'irilgan qismilar quyida)
```

**O'zgartirilayotgan qismlar (oldin/keyin):**

```tsx
// ❌ OLDIN (qator 51-86):
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // ...
  const load = async () => {
    const r = await apiRequest("GET", "/api/pos/notifications"); // NOTO'G'RI
    // ...
  };
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000); // NOTO'G'RI pattern
    return () => clearInterval(t);
  }, []);
  const markRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/pos/notifications/${id}/read`); // NOTO'G'RI
      setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
    } catch { /* noop */ } // F2 buzilishi
  };

// ✅ KEYIN:
export default function NotificationCenter() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['/api/notifications/my'],
    queryFn: () => apiRequest<{ data?: Notification[]; rows?: Notification[] } | Notification[]>(
      'GET', '/api/notifications/my'
    ),
    refetchInterval: 30_000,
  });

  const notifications: Notification[] = (() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    return (rawData as any).data ?? (rawData as any).rows ?? [];
  })();

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications/my'] }),
    onError: () => toast({ title: "O'qilgan deb belgilanmadi", variant: "destructive" }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/notifications/my/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications/my'] }),
    onError: () => toast({ title: "Barcha o'qilgan belgilashda xatolik", variant: "destructive" }),
  });

  const markRead = (id: number) => markReadMutation.mutate(id);
  const markAllRead = () => markAllReadMutation.mutate();
  const loading = isLoading;
  // ... qolgan JSX SAQLANADI (filter logikasi, render — faqat handler bind o'zgaradi)
```

---

### Qadam 11: AppShellModern.tsx — Bell icon qo'shish

**Fayl:** `artifacts/erp-dashboard/src/erp-modern-ui/AppShellModern.tsx`

**Qo'shilayotgan yangi komponent** (mavjud ChatHeaderButton pattern ga o'xshash):

```tsx
// ❌ MAVJUD HOLAT (qator 144-148):
<div className="flex items-center gap-1 shrink-0">
  <GlobalInboxBadge />
  <ChatHeaderButton />
  <DesignNotifications />    // bu bell emas — design preview uchun
  ...

// ✅ KEYIN:
// Yuqoriga import qo'sh:
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Yangi NtfBellButton funksiyasi (fayl ichida — ChatHeaderButton yonida):
function NtfBellButton() {
  const { t } = useTranslation("common");
  const { data } = useQuery({
    queryKey: ['/api/notifications/my/unread-count'],
    queryFn: () => apiRequest<{ data: { unreadCount: number } }>(
      'GET', '/api/notifications/my/unread-count'
    ),
    refetchInterval: 60_000,
  });
  const unreadCount = data?.data?.unreadCount ?? 0;

  return (
    <Link href="/notifications">
      <button
        type="button"
        className="relative flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={t("bildirishnomalar") ?? "Bildirishnomalar"}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </Link>
  );
}

// Headerga qo'sh — GlobalInboxBadge DAN OLDIN:
<div className="flex items-center gap-1 shrink-0">
  <NtfBellButton />      {/* P46: NTF bell + unread badge */}
  <GlobalInboxBadge />
  <ChatHeaderButton />
  <DesignNotifications />
  ...
```

---

### Qadam 12: NtfRoutingMatrix.tsx (admin sahifa)

**Fayl:** `artifacts/erp-dashboard/src/pages/NtfRoutingMatrix.tsx`

```tsx
/**
 * NtfRoutingMatrix.tsx — EP-NTF-079 admin routing matrix sahifasi.
 * Admin/director uchun: "kim nimani oladi" sozlamalari.
 * URL: /settings/ntf/routing (P50 AdminRoutes ga qo'shadi)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface RoutingRule {
  id: number;
  eventCode: string;
  roleCode: string;
  channel: 'personal' | 'group' | 'both';
  quietHoursExempt: boolean;
  thresholdValue?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  personal: 'Shaxsiy',
  group:    'Guruh',
  both:     'Ikkalasi (EP-NTF-008)',
};

export default function NtfRoutingMatrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [editChannel, setEditChannel] = useState<string>('personal');

  const { data, isLoading } = useQuery({
    queryKey: ['/api/ntf/routing-matrix'],
    queryFn: () => apiRequest<{ data: RoutingRule[] }>('GET', '/api/ntf/routing-matrix'),
  });

  const rules: RoutingRule[] = Array.isArray(data?.data) ? data.data : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, channel }: { id: number; channel: string }) =>
      apiRequest('PATCH', `/api/ntf/routing-matrix/${id}`, { channel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ntf/routing-matrix'] });
      toast({ title: "Routing qoida yangilandi" });
      setEditId(null);
    },
    onError: () => toast({ title: "Yangilashda xatolik", variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">NTF Routing Matrix</h1>
          <p className="text-sm text-muted-foreground">
            EP-NTF-079 — Kim nimani qaysi kanaldan oladi (egasi sozlaydi)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Routing qoidalari ({rules.length} ta)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">Event kodi</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Kanal</th>
                <th className="text-left p-3">Quiet hours exempt</th>
                <th className="text-left p-3">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{rule.eventCode}</td>
                  <td className="p-3">
                    <Badge variant="outline">{rule.roleCode}</Badge>
                  </td>
                  <td className="p-3">
                    {editId === rule.id ? (
                      <Select value={editChannel} onValueChange={setEditChannel}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CHANNEL_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">{CHANNEL_LABELS[rule.channel] ?? rule.channel}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${rule.quietHoursExempt ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {rule.quietHoursExempt ? '✓ Exempt (CRITICAL)' : '—'}
                    </span>
                  </td>
                  <td className="p-3">
                    {editId === rule.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: rule.id, channel: editChannel })}
                          disabled={updateMutation.isPending}
                        >
                          Saqlash
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                          Bekor
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditId(rule.id); setEditChannel(rule.channel); }}
                      >
                        Tahrirlash
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Routing qoidalari yo'q. Migratsiya amalga oshirilganmi?
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Qadam 13: NtfScheduleConfig.tsx (admin sahifa)

**Fayl:** `artifacts/erp-dashboard/src/pages/NtfScheduleConfig.tsx`

```tsx
/**
 * NtfScheduleConfig.tsx — EP-NTF-018 quiet hours + cron schedule admin sahifasi.
 * URL: /settings/ntf/schedule (P50 AdminRoutes ga qo'shadi)
 * Q140: har modul uchun alohida quiet hours sozlash mumkin.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScheduleConfig {
  id: number;
  moduleCode: string;
  eventCode: string;
  cronExpr?: string;
  isActive: boolean;
  quietStart?: string;
  quietEnd?: string;
}

export default function NtfScheduleConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ScheduleConfig>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['/api/ntf/schedules'],
    queryFn: () => apiRequest<{ data: ScheduleConfig[] }>('GET', '/api/ntf/schedules'),
  });

  const schedules: ScheduleConfig[] = Array.isArray(data?.data) ? data.data : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<ScheduleConfig> }) =>
      apiRequest('PATCH', `/api/ntf/schedules/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ntf/schedules'] });
      toast({ title: "Jadval yangilandi" });
      setEditId(null);
      setEditData({});
    },
    onError: () => toast({ title: "Yangilashda xatolik", variant: "destructive" }),
  });

  const startEdit = (sched: ScheduleConfig) => {
    setEditId(sched.id);
    setEditData({ quietStart: sched.quietStart, quietEnd: sched.quietEnd, cronExpr: sched.cronExpr });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">NTF Jadval Konfiguratsiyasi</h1>
        <p className="text-sm text-muted-foreground">
          EP-NTF-018 / Q140 — Har modul uchun quiet hours va cron sozlamalari
        </p>
        <p className="text-xs text-amber-600 mt-1 font-medium">
          ⚠️ Quiet hours: CRITICAL bildirishnomalar doim o'tadi (EP-NTF-063). INFO/IMPORTANT bloklanadi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Jadval sozlamalari ({schedules.length} ta)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">Modul</th>
                <th className="text-left p-3">Event</th>
                <th className="text-left p-3">Cron</th>
                <th className="text-left p-3">Quiet Start</th>
                <th className="text-left p-3">Quiet End</th>
                <th className="text-left p-3">Holat</th>
                <th className="text-left p-3">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map(sched => (
                <tr key={sched.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs font-mono">{sched.moduleCode}</Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">{sched.eventCode}</td>
                  <td className="p-3">
                    {editId === sched.id ? (
                      <Input
                        className="h-7 text-xs w-32"
                        value={editData.cronExpr ?? ''}
                        onChange={e => setEditData(p => ({ ...p, cronExpr: e.target.value }))}
                        placeholder="0 18 * * *"
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {sched.cronExpr ?? '—'}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editId === sched.id ? (
                      <Input
                        className="h-7 text-xs w-20"
                        value={editData.quietStart ?? ''}
                        onChange={e => setEditData(p => ({ ...p, quietStart: e.target.value }))}
                        placeholder="22:00"
                      />
                    ) : (
                      <span className="text-xs">{sched.quietStart ?? '—'}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editId === sched.id ? (
                      <Input
                        className="h-7 text-xs w-20"
                        value={editData.quietEnd ?? ''}
                        onChange={e => setEditData(p => ({ ...p, quietEnd: e.target.value }))}
                        placeholder="07:00"
                      />
                    ) : (
                      <span className="text-xs">{sched.quietEnd ?? '—'}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={sched.isActive ? "default" : "secondary"}>
                      {sched.isActive ? 'Aktiv' : 'Nofaol'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {editId === sched.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: sched.id, patch: editData })}
                          disabled={updateMutation.isPending}
                        >
                          Saqlash
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setEditData({}); }}>
                          Bekor
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(sched)}>
                        Tahrirlash
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Jadval konfiguratsiyasi yo'q. Migratsiya amalga oshirilganmi?
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5. DDL — GATED MIGRATION

> **⛔ DARVOZA:** Quyidagi SQL faqat egasi `-- APPROVED: <ism> <sana>` izohini qo'shib "ha, bajar" deganidan keyin ishga tushiriladi. Siz migration faylni YOZASIZ lekin `pnpm drizzle-kit push` yoki `psql -f ...` ISHGA TUSHIRMAYSIZ.

**Migration fayl:** `apps/api/src/database/migrations/d6-ntf-core-5tables.sql`

```sql
-- GATED: P46 NTF core infrastructure — 5 yangi jadval
-- APPROVED: <egasi ismi> <ruxsat sanasi>
-- Bajaruvchi: Muslimbek | Sana: 2026-06-19
-- EP-NTF: Phase 1 DDL (EP-NTF-027/028/079/018/019)
-- ISHGA TUSHIRISH: egasi "APPROVED:" qatorini to'ldirgandan keyin
--   psql $DATABASE_URL -f apps/api/src/database/migrations/d6-ntf-core-5tables.sql
--   YOKI: pnpm --filter @europrint/api run db:migrate

-- Jadval 1: ntf_templates (EP-NTF-028: admin-editable, no code deploy)
CREATE TABLE IF NOT EXISTS ntf_templates (
    id             SERIAL PRIMARY KEY,
    module_code    VARCHAR(30) NOT NULL,
    event_type     VARCHAR(60) NOT NULL,
    lang           VARCHAR(10) NOT NULL,   -- 'uz' | 'ru' | 'uz-cyr'
    title_template TEXT        NOT NULL,
    body_template  TEXT        NOT NULL,
    priority       VARCHAR(20) DEFAULT 'INFO',  -- INFO | IMPORTANT | CRITICAL
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ntf_templates_module_event_lang_uidx UNIQUE (module_code, event_type, lang)
);
COMMENT ON TABLE ntf_templates IS 'EP-NTF-028: Admin kodi deploy qilmasdan shablon tahrirlashi';

-- Jadval 2: ntf_log (EP-NTF-027: audit log; EP-NTF-080: immutable)
CREATE TABLE IF NOT EXISTS ntf_log (
    id                SERIAL PRIMARY KEY,
    template_id       INTEGER REFERENCES ntf_templates(id),
    recipient_user_id INTEGER NOT NULL REFERENCES users(id),
    recipient_card_id INTEGER,              -- FK: org_functions(id) — NULLABLE (karta bo'lmasa ham)
    sender_user_id    INTEGER,              -- NULL = system event
    channel           VARCHAR(20) NOT NULL CHECK (channel IN ('personal','group','email','sms')),
    sent_at           TIMESTAMPTZ DEFAULT NOW(),
    read_at           TIMESTAMPTZ,          -- EP-NTF-080 EXCEPTION: faqat shu yangilanadi
    ack_at            TIMESTAMPTZ,          -- EP-NTF-080 EXCEPTION: faqat shu yangilanadi (EP-NTF-016)
    requires_ack      BOOLEAN DEFAULT false, -- EP-NTF-016: faqat IMPORTANT+CRITICAL
    priority          VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (priority IN ('INFO','IMPORTANT','CRITICAL')),
    payload           JSONB,
    archived          BOOLEAN DEFAULT false,
    idempotency_key   VARCHAR(128),
    module_code       VARCHAR(30),
    user_lang         VARCHAR(10),          -- EP-NTF-015: foydalanuvchi tili (uz|ru|uz-cyr) — shablon render uchun
    CONSTRAINT ntf_log_idempotency_key_uidx UNIQUE (idempotency_key)
);
COMMENT ON TABLE ntf_log IS 'EP-NTF-027/080: Immutable bildirishnoma log. Faqat read_at/ack_at UPDATE qilinadi.';
CREATE INDEX IF NOT EXISTS ntf_log_recipient_user_idx ON ntf_log (recipient_user_id);
CREATE INDEX IF NOT EXISTS ntf_log_sent_at_idx        ON ntf_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS ntf_log_priority_idx       ON ntf_log (priority);
CREATE INDEX IF NOT EXISTS ntf_log_module_code_idx    ON ntf_log (module_code);

-- Jadval 3: ntf_routing_matrix (EP-NTF-079: owner-editable, yagona haqiqat manbai)
CREATE TABLE IF NOT EXISTS ntf_routing_matrix (
    id                SERIAL PRIMARY KEY,
    event_code        VARCHAR(60) NOT NULL,
    role_code         VARCHAR(50) NOT NULL,
    channel           VARCHAR(20) DEFAULT 'personal' CHECK (channel IN ('personal','group','both')),
    quiet_hours_exempt BOOLEAN DEFAULT false,
    threshold_value   VARCHAR(50),           -- EP-NTF-006/007: owner sozlashi
    CONSTRAINT ntf_routing_matrix_event_role_uidx UNIQUE (event_code, role_code)
);
COMMENT ON TABLE ntf_routing_matrix IS 'EP-NTF-079: Kim nimani qaysi kanaldan oladi — egasi sozlaydi';
CREATE INDEX IF NOT EXISTS ntf_routing_matrix_event_code_idx ON ntf_routing_matrix (event_code);

-- Jadval 4: ntf_schedule_config (EP-NTF-018/Q140: per-module quiet hours)
CREATE TABLE IF NOT EXISTS ntf_schedule_config (
    id          SERIAL PRIMARY KEY,
    module_code VARCHAR(30) NOT NULL,
    event_code  VARCHAR(60) NOT NULL,
    cron_expr   VARCHAR(100),
    is_active   BOOLEAN DEFAULT true,
    quiet_start TIME,    -- masalan: '22:00'
    quiet_end   TIME,    -- masalan: '07:00'
    CONSTRAINT ntf_schedule_config_module_event_uidx UNIQUE (module_code, event_code)
);
COMMENT ON TABLE ntf_schedule_config IS 'EP-NTF-018/Q140: Per-modul quiet hours va cron jadval';

-- Jadval 5: ntf_bot_config (EP-NTF-019: per-module bot registry)
-- ⛔ XAVFSIZLIK: bot_token_env_key — ENV KALIT NOMI, TOKEN QIYMATI EMAS
CREATE TABLE IF NOT EXISTS ntf_bot_config (
    id                SERIAL PRIMARY KEY,
    module_code       VARCHAR(30) UNIQUE NOT NULL,
    bot_token_env_key VARCHAR(100) NOT NULL,  -- masalan: 'NTF_HR_BOT_TOKEN' (qiymat EMAS)
    is_active         BOOLEAN DEFAULT true,
    last_ping         TIMESTAMPTZ
);
COMMENT ON TABLE ntf_bot_config IS 'EP-NTF-019: Per-modul bot registry. bot_token_env_key = ENV kalit nomi ONLY.';

-- Seed: NtfBotConfig — default modul botlari (token env keylar bilan)
INSERT INTO ntf_bot_config (module_code, bot_token_env_key, is_active) VALUES
    ('hr',         'TELEGRAM_HR_BOT_TOKEN',         false),
    ('fin',        'TELEGRAM_FIN_BOT_TOKEN',         false),
    ('mes',        'TELEGRAM_MES_BOT_TOKEN',         false),
    ('director',   'TELEGRAM_DIRECTOR_BOT_TOKEN',    false),
    ('ombor',      'TELEGRAM_OMBOR_BOT_TOKEN',       false),
    ('pos',        'TELEGRAM_POS_BOT_TOKEN',         false),
    ('crm',        'TELEGRAM_CRM_BOT_TOKEN',         false)
ON CONFLICT (module_code) DO NOTHING;

-- Seed: ntf_schedule_config — default quiet hours
INSERT INTO ntf_schedule_config (module_code, event_code, is_active, quiet_start, quiet_end) VALUES
    ('global', 'all.info',      true, '22:00', '07:00'),
    ('global', 'all.important', true, '23:00', '06:00')
ON CONFLICT (module_code, event_code) DO NOTHING;
```

---

## 6. QABUL MEZONI

Har bir qator TEKSHIRILADI — hech biri "ehtimol ishlaydi" holida qolmaydi:

- [ ] **BE tsc 0:** `pnpm --filter @europrint/api run build` — 0 xato
- [ ] **FE tsc 0:** `pnpm --filter erp-dashboard run typecheck` — 0 xato
- [ ] **DDL GATED:** migration fayl yozilgan, lekin `-- APPROVED:` bo'sh, `pnpm drizzle-kit push` ISHGA TUSHIRILMAGAN
- [ ] **DB-proof (migratsiya ruxsat berilsa):**
  ```sql
  -- ntf_log real INSERT:
  INSERT INTO ntf_log (recipient_user_id, channel, priority, module_code)
  VALUES (1, 'personal', 'INFO', 'test')
  RETURNING id, sent_at;
  -- Keyin GET /api/ntf/unread?userId=1 → qaytaradimi?
  ```
- [ ] **NotificationCenter endpoint to'g'ri:** `/api/notifications/my` chaqirilmoqda (`/api/pos/notifications` EMAS) — DevTools Network tab tekshiruvi
- [ ] **Bell icon ko'rinadi:** AppShellModern headerida Bell icon va unread count badge mavjud
- [ ] **markRead ishlaydi:** Bildirishnomaga bosilganda `PATCH /api/notifications/:id/read` yuboriladi
- [ ] **onError handler:** markRead xato bo'lsa toast ko'rinadi (F2 qoida)
- [ ] **useQuery pattern:** `useState+setInterval` YO'Q — `useQuery({refetchInterval:30000})` ishlatilmoqda
- [ ] **NtfRoutingMatrix.tsx:** `/api/ntf/routing-matrix` so'rovi yuboriladi, natija jadvalda ko'rinadi
- [ ] **NtfScheduleConfig.tsx:** `/api/ntf/schedules` so'rovi yuboriladi, tahrirlash ishlaydi
- [ ] **Routing matrix PUT:** PATCH `/api/ntf/routing-matrix/:id` → DB yangilanadi → reload → ko'rinadi
- [ ] **Result<T> pattern:** Barcha repo/service metodlari `Promise<Result<T>>` qaytaradi — `throw/null` YO'Q
- [ ] **Zod validatsiya:** Hamma `@Body()` Zod bilan parse qilinmoqda — `class-validator` YO'Q
- [ ] **Bot token xavfsizligi:** `ntf_bot_config` jadvalda haqiqiy token qiymati YO'Q — faqat env kalit nomi
- [ ] **ReviewER skriptlar:**
  ```bash
  bash scripts/reviewer-result-pattern.sh   # 0 FAIL
  bash scripts/reviewer-jwt-guard.sh        # PASS
  bash scripts/reviewer-process-env.sh      # PASS
  ```
- [ ] **Golden thread regress yo'q:** Mavjud notifikatsiya endpointlari (GET /api/notifications/my/unread-count va boshqalar) hamon ishlaydi

---

## 7. SELF-VERIFY

### 7.1 BE tekshiruvi

```bash
# Backend typecheck:
cd Uzbek-Language-Module && pnpm --filter @europrint/api run build
# 0 error bo'lishi shart

# Backend ishga tushirish (agar DDL ruxsat berilgan bo'lsa):
pnpm --filter @europrint/api run dev:unsafe

# Smoke test — NtfLogController:
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3030/api/ntf/routing-matrix
# → { "data": [...] } yoki [] (jadval bo'sh bo'lsa ham 200)

curl -H "Authorization: Bearer <TOKEN>" http://localhost:3030/api/ntf/schedules
# → { "data": [...] }

curl -H "Authorization: Bearer <TOKEN>" http://localhost:3030/api/ntf/templates
# → { "data": [...] }

# NtfLog yaratish (admin token bilan):
curl -X POST http://localhost:3030/api/ntf/log \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"recipientUserId":1,"channel":"personal","priority":"INFO","moduleCode":"test"}'
# → { "id": 1, "sentAt": "...", "recipientUserId": 1, ... }

# O'qilmagan bildirishnomalar (user 1):
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3030/api/ntf/unread
# → { "data": [{ "id":1, ... }] }

# markRead:
curl -X PATCH http://localhost:3030/api/ntf/1/read \
  -H "Authorization: Bearer <TOKEN>"
# → { "id": 1, "readAt": "..." }

# DB-proof (agar DDL ruxsat berilgan bo'lsa):
psql $DATABASE_URL -c "SELECT id, channel, priority, read_at FROM ntf_log WHERE id = 1;"
# → read_at NULL → markRead dan keyin to'ldirilgan
```

### 7.2 FE tekshiruvi

```bash
# FE typecheck:
pnpm --filter erp-dashboard run typecheck
# 0 error bo'lishi shart

# FE ishga tushirish:
pnpm --filter erp-dashboard run dev

# Browser tekshiruvi:
# 1. http://localhost:5173/notifications — sahifa ochiladi
# 2. DevTools → Network → /api/notifications/my chaqirilmoqda (POS emas)
# 3. Header da Bell icon ko'rinadi
# 4. /settings/ntf/routing — NtfRoutingMatrix sahifasi ochiladi
# 5. /settings/ntf/schedule — NtfScheduleConfig sahifasi ochiladi
# 6. Routing matrix qoidasini tahrirlash → Saqlash → DB yangilanadi → reload → ko'rinadi
```

### 7.3 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh
# Natija: FAIL: 0 (yangi fayllar ham)

bash scripts/reviewer-jwt-guard.sh
# NtfLogController @UseGuards(JwtAuthGuard) borligini tekshiradi

bash scripts/reviewer-process-env.sh
# NtfBotConfig: process.env.* TO'G'RIDAN ISHLATILMAYDI
```

---

## 8. COMMIT

**Tartib:** har mantiqiy guruh alohida commit. `-A` yoki `.` TAQIQ.

```bash
# Commit 1: Schema DDL (lib/db)
git add lib/db/src/schema/ntf-schema.ts
git add lib/db/src/schema/index.ts
git commit -m "feat(ntf): add ntf-schema.ts — 5 table DDL (ntf_log/templates/routing_matrix/schedule_config/bot_config) EP-NTF-027/028/079/018/019 [GATED]"

# Commit 2: BE repos + services
git add apps/api/src/modules/notifications/infrastructure/repositories/ntf-log.repository.ts
git add apps/api/src/modules/notifications/infrastructure/repositories/ntf-template.repository.ts
git add apps/api/src/modules/notifications/infrastructure/repositories/ntf-routing.repository.ts
git add apps/api/src/modules/notifications/application/ntf.service.ts
git add apps/api/src/modules/notifications/application/ntf-template.service.ts
git add apps/api/src/modules/notifications/application/ntf-routing.service.ts
git commit -m "feat(ntf): NtfLog/Template/Routing repos + services (Result<T>, Zod, Drizzle)"

# Commit 3: BE controller + module wiring
git add apps/api/src/modules/notifications/presentation/ntf-log.controller.ts
git add apps/api/src/modules/notifications/notifications.module.ts
git commit -m "feat(ntf): NtfLogController (GET/PATCH log/templates/routing-matrix/schedules) + module providers"

# Commit 4: FE — NotificationCenter fix + Bell + admin pages
git add artifacts/erp-dashboard/src/pages/NotificationCenter.tsx
git add artifacts/erp-dashboard/src/erp-modern-ui/AppShellModern.tsx
git add artifacts/erp-dashboard/src/pages/NtfRoutingMatrix.tsx
git add artifacts/erp-dashboard/src/pages/NtfScheduleConfig.tsx
git commit -m "fix(ntf): NotificationCenter endpoint /api/pos/notifications→/api/notifications/my + useQuery; Bell icon; NtfRoutingMatrix/NtfScheduleConfig admin pages"

# Commit 5: Migration (GATED)
git add apps/api/src/database/migrations/d6-ntf-core-5tables.sql
git commit -m "chore(ntf): add d6-ntf-core-5tables.sql migration [GATED — egasi APPROVED: kerak]"
```

**Har commit dan keyin:**
```bash
# BE boot tekshiruvi (Windows: nest watch crash bo'lsa Q-44 protokoli):
curl http://localhost:3030/api/auth/health
# → 200 OK bo'lishi shart (butun server tushgan bo'lsa qayta ishga tushir)
```

---

## 9. EGAGA HISOBOT (Uzbek lotin)

Bajaruvchi har commit dan keyin quyidagi format bilan hisobot beradi:

```
P46 Wave-1 holati:

✅ Bajarildi:
- lib/db/src/schema/ntf-schema.ts — 5 ta yangi jadval ta'rifi (ntf_log/templates/routing_matrix/schedule_config/bot_config)
- NtfLogRepository + NtfTemplateRepository + NtfRoutingRepository (Result<T>, Drizzle)
- NtfService + NtfTemplateService + NtfRoutingService (application qatlami)
- NtfLogController — GET/PATCH /api/ntf/log|templates|routing-matrix|schedules|bot-configs
- NotificationCenter.tsx — /api/pos/notifications → /api/notifications/my to'g'irlandi; useQuery/useMutation
- AppShellModern.tsx — Bell icon + unread badge qo'shildi
- NtfRoutingMatrix.tsx + NtfScheduleConfig.tsx — admin sahifalar yaratildi
- d6-ntf-core-5tables.sql — GATED migration (egasi APPROVED: kutilmoqda)

🔒 GATED (egasi ruxsatini kutmoqda):
- d6-ntf-core-5tables.sql — "APPROVED: <ism> <sana>" qo'shilsin → migration ishga tushiriladi

⏭️ Keyingi (P46 tomonidan emas):
- EP-NTF-023 onboarding link (Wave 2)
- ShVB 4 buyruq (/zvs_status /my_gsd /company_state /weekly_digest) (Wave 2)
- BullMQ escalation (Wave 3+)
- P50 AdminRoutes ga /settings/ntf/routing va /settings/ntf/schedule qo'shish (P50 egasi)
```

---

## 10. DEFERRED (P46 EMAS)

Quyidagilar P46 Wave-1 da BAJARILMAYDI — to'g'ri fazaga qoldiriladi:

| Xususiyat | Sabab | Faza |
|-----------|-------|------|
| `sendOrderStatusUpdate/sendCertExpiry/sendStockAlert/sendQcResult` stub → real | Wave 2 | Wave 2 |
| `DrizzleTelegramSvcRepository.getUserChatId` implementatsiya | Wave 2 | Wave 2 |
| ShVB 4 buyruq (`/zvs_status` va boshqalar) | Wave 2 | Wave 2 |
| BullMQ quiet hours queue | Wave 3 | Wave 3 |
| DigestService | Wave 3 | Wave 3 |
| EscalationService (15-daqiqa, 1-soat countdowns) | Wave 4 | Wave 4 |
| P50 AdminRoutes ga ntf routelar qo'shish | P50 egasi | Wave 1 P50 |
| `DrizzleTelegramSvcRepository.getUserChatId` — telegram_chat_id → employees.telegram_id | Wave 2 | Wave 2 |
| EP-NTF-035/036 (tungi telefon-eskalatsiya + yakka qaror belgisi) — `NightProtocolHandler` | Wave 3/P47 | Wave 3 |
| EP-NTF-012 leaderboard digest ichida (top-3/past-3 by ЦКП%) | Wave 3/P47 | Wave 3 |
| EP-NTF-021 inline callback_query handler (`APPROVE_/REJECT_/ASSIGN_`) | Wave 2/P47 | Wave 2 |

---

*P46 directive yozildi: 2026-06-19 | Paket: NTF — Bildirishnoma + Telegram Wave 1 | Q-47 compliant*
*Tuzatildi: 2026-06-19 — EP-NTF-015 (user_lang ustun + getTemplate fallback) qo'shildi; deferred ro'yxatiga EP-NTF-035/036/012/021 qo'shildi (00-INTERVYU-MOSLIK moslik auditi asosida)*
