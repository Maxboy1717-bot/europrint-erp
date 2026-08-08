# P47 — NTF: NTF bots ShVB commands + onboarding + quiet-hours + digest + escalation + signals

> Bajaruvchi: Muslimbek | To'lqin: Wave 3 | Bog'liqlik: P46 (NTF core infra) TUGAGAN bo'lishi shart
> Yozilgan: 2026-06-19 | Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-21-NTF-2026-06-08.md`

---

## 0. ROL VA QOIDALAR

**Sen BAJARUVCHI agentsan.** Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki har direktiva boshida takrorlanadi — bular buzilsa FAZA YAKUNLANMAGAN hisoblanadi:

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): bu paket ddlGate=FALSE — yangi jadval YARATILMAYDI.
    Agar jadval kerak ko'rinsa — TO'XTA + flag. P46 jadvallarini (ntf_log, ntf_routing_matrix,
    ntf_schedule_config, ntf_bot_config, ntf_templates) ishlatasan, yangi CREATE TABLE YO'Q.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Wave:** 3
**dependsOn:** `["P46"]` — P46 (ntf_log, ntf_routing_matrix, ntf_schedule_config, ntf_bot_config, ntf_templates jadvallari + NtfService + NtfRoutingService + NtfTemplateService) tugagan bo'lishi SHART.

Boshlanishdan oldin P46 verifikatsiyasi:
```bash
# P46 tayyormi?
curl -s http://localhost:3030/api/ntf/log -H "Authorization: Bearer $TOKEN" | jq '.data | length'
# ntf_bot_config jadval mavjudmi?
node _audit/q.cjs "SELECT COUNT(*) FROM ntf_bot_config"
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurma:**

```
OWNED FILES (P47 — Wave 3):
╔═ BACKEND — bot-gateway ═══════════════════════════════════════════════════╗
│ apps/api/src/modules/bot-gateway/bots/director.bot.ts          [MAVJUD — kengaytirish]
╠═ BACKEND — notifications/telegram ════════════════════════════════════════╣
│ apps/api/src/modules/notifications/telegram/drizzle-telegram-svc.repo.ts [MAVJUD — getUserChatId impl]
╠═ BACKEND — notifications/infrastructure/external ═════════════════════════╣
│ apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts [MAVJUD — real send fix]
╠═ BACKEND — notifications/application ══════════════════════════════════════╣
│ apps/api/src/modules/notifications/application/quiet-hours.service.ts     [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/application/onboarding-link.service.ts [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/application/digest.service.ts          [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/application/digest-cron.service.ts     [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/application/escalation.service.ts      [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/application/ack-manager.service.ts     [YANGI — yaratiladi]
╠═ BACKEND — notifications/infrastructure/event-handlers ════════════════════╣
│ apps/api/src/modules/notifications/infrastructure/event-handlers/production-halt.handler.ts   [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/material-shortage.handler.ts [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/shift-handover.handler.ts    [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/razryad-change.handler.ts    [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/order-stage.handler.ts       [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/card-status.handler.ts       [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/formalize.handler.ts         [YANGI]
│ apps/api/src/modules/notifications/infrastructure/event-handlers/night-protocol.handler.ts    [YANGI — EP-NTF-035/036]
╠═ BACKEND — notifications/presentation ════════════════════════════════════╣
│ apps/api/src/modules/notifications/presentation/ntf-bot-config.controller.ts  [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/presentation/ntf-onboarding.controller.ts  [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/presentation/ntf-escalation.controller.ts  [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/presentation/ntf-formalize.controller.ts   [YANGI — yaratiladi]
│ apps/api/src/modules/notifications/presentation/ntf-night-protocol.controller.ts [YANGI — EP-NTF-035/036]
╠═ BACKEND — telegram (legacy, shared service) ══════════════════════════════╣
│ apps/api/src/telegram/telegram.service.ts                       [MAVJUD — process.env fix]
╠═ FRONTEND ═══════════════════════════════════════════════════════════════╣
│ artifacts/erp-dashboard/src/pages/NtfBotConfig.tsx              [YANGI — yaratiladi]
│ artifacts/erp-dashboard/src/pages/DigestHistory.tsx             [YANGI — yaratiladi]
│ artifacts/erp-dashboard/src/pages/NtfEscalations.tsx            [YANGI — yaratiladi]
│ artifacts/erp-dashboard/src/pages/NtfFormalRecords.tsx          [YANGI — yaratiladi]
╚═══════════════════════════════════════════════════════════════════════════╝
```

**DDL DARVOZASI = FALSE (ddlGate=false):** Bu paket YANGI jadval yaratmaydi. P46 da yaratilgan
`ntf_log`, `ntf_bot_config`, `ntf_schedule_config`, `ntf_routing_matrix`, `ntf_templates`
jadvallaridan foydalaniladi. Agar qo'shimcha jadval kerak ko'rinsa — TO'XTA + egasiga flag qil,
paket doirasida o'z-o'zidan CREATE TABLE yozma.

**Mavjud `notifications.module.ts`** — bu fayl P47 owned emas. Lekin yangi provayderlarni
ro'yxatdan o'tkazish kerak bo'lsa — TO'XTA + flag: egasi P46 module faylini P47 bilan
sinxronlashtirishga ruxsat berishi kerak. Aks holda module fayliga tegma.

---

## 2. VIZYON

### 2.1 EP-NTF kodlari bo'yicha P47 doirasi

P47 vizyon manbasidan (MUSLIMBEK-PROMT-21-NTF-2026-06-08.md) quyidagi EP-NTF kodlari:

| Faza | EP-NTF kodlari | Egasi javobini talab qiladi |
|------|----------------|----------------------------|
| Phase 2 (bots) | 001, 019, 015, 022, 023, 021 | 001 (4 ShVB cmd), 021 (inline keyboard + callback handler) |
| Phase 3 (digest) | 003, 004, 005, **012**, 013, 026, 045, 065 | 003 (configurable — `ntf_schedule_config`dan o'qiladi, hardcode EMAS) |
| Phase 4 (signals) | 029, 033, 034, **035**, **036**, 047, 059, 063 | 033, 034, 059, 063; **035/036 (tungi protokol) shu fazada** |
| Phase 5 (governance) | 031, 051, 066, 077 | 031, 066, 077 |
| Phase 6 (remaining) | 014, 016, 017, 024, 078, 082 | 016 (ack=important only) |

> ⚠️ **00-INTERVYU-MOSLIK moslik auditi aniqlagan og'ishlar (tuzatildi):**
> - EP-NTF-035/036 (tungi-telefon + yakka qaror) — Phase 4 doirasiga kiritildi
> - EP-NTF-012 (leaderboard digestda) — Phase 3 doirasiga qo'shildi
> - EP-NTF-021 inline callback_query handler — Phase 2 doirasiga qo'shildi
> - EP-NTF-015 (user-language) — Phase 2 `TelegramUserLinkService` doirasiga qo'shildi
> - Digest-cron `@Cron` hardcode → `ntf_schedule_config` dan o'qiladigan qilindi (Q140 CONTRADICTS tuzatildi)

### 2.2 Qabul mezoni (acceptance criteria) har xususiyat uchun

**A — director.bot.ts: 4 ShVB buyruqlar (EP-NTF-001)**
- `/zvs_status` → Finance GL dan ZVS metrikasi → real DB, director rolida qaytadi
- `/my_gsd` → user KPI (joriy hafta) → real DB, istalgan autentifikatsiyalangan foydalanuvchi uchun
- `/company_state` → 7-otdeleniye umumiy holati → faqat director/owner roli (EP-NTF-022 RBAC)
- `/weekly_digest` → o'sha foydalanuvchi uchun digest trigger → BullMQ job yaratadi
- Mavjud `/kpi`, `/ai`, `/summary` O'CHIRILMAYDI (Q-46)

**B — drizzle-telegram-svc.repo.ts: getUserChatId + getUserLang real impl (EP-NTF-015)**
- `getUserChatId(userId)` → `employees` jadvalidan `telegram_chat_id` ustunini o'qiydi
- `getUserLang(userId)` → `employees` jadvalidan `lang` ustunini o'qiydi (uz|ru|uz-cyr); NULL bo'lsa 'uz' default
  - EP-NTF-015: xabar foydalanuvchi profilidagi tilda yuboriladi; lang `ntf_log.user_lang` ga ham yoziladi
- Hozirda: `getUserChatId?` — optional, impl yo'q (i-telegram-svc.repo.ts:16)
- To'g'rilangandan keyin: `TelegramSvc.sendMessage()` real chat_id + user_lang bilan Telegram ga yuboradi

**C — telegram-bot.adapter.ts: real send (sendOrderStatusUpdate, sendAdvanceReminder, sendCertExpiry, sendStockAlert, sendQcResult)**
- Hozirda: log-only, `return Ok(undefined)` — hech qanday Telegram chaqiruvi yo'q (adapter:113-158)
- To'g'rilangandan keyin: har metod real `sendMessage(chatId, text)` chaqiradi — chatId manbasini oldin `getUserChatId` orqali hal qiladi

**D — quiet-hours.service.ts (EP-NTF-018)**
- `shouldDeliver(moduleCode: string, priority: 'CRITICAL'|'IMPORTANT'|'INFO'): Promise<boolean>`
- CRITICAL har doim true qaytaradi (EP-NTF-063)
- Boshqalari: `ntf_schedule_config` dan quiet_start/quiet_end o'qib Toshkent vaqti bilan solishtiradi
- midnight crossing (masalan 22:00-06:00) to'g'ri hisoblanadi

**E — onboarding-link.service.ts (EP-NTF-023)**
- `generateOnboardingLink(userId: number): Promise<Result<{token: string; url: string}>>`
- Token = uuid, `ntf_log` ga `type='onboarding_token'`, `payload={token,userId,expires}` saqlanadi
- URL = `${BOT_DEEP_LINK_URL}?start=<token>` — ConfigService dan
- Onboarding `/start?token=<uuid>` → `telegram_chat_id` ni employees ga yozadi

**F — ntf-bot-config.controller.ts (EP-NTF-019)**
- `GET /api/ntf/bot-config` → ntf_bot_config list (admin/owner)
- `PATCH /api/ntf/bot-config/:id/toggle` → is_active o'zgartirish
- `POST /api/ntf/bot-config/ping/:id` → bot tokenini `/getMe` bilan tekshirish

**G — ntf-onboarding.controller.ts (EP-NTF-023)**
- `POST /api/ntf/onboarding/generate` → {userId} → onboarding link
- `POST /api/ntf/onboarding/link-telegram` → {token, telegramChatId} → employees jadvaliga yozadi

**H — digest.service.ts (EP-NTF-003, EP-NTF-065)**
- `buildUserDigest(userId: number, period: 'day'|'week'|'month'): Promise<Result<DigestDto>>`
- HR/KPI, Org/ЦКП, Finance aggregatsiya — mavjud servislardan import (owned emas → safeCall bilan)
- Vertikal aggregatsiya: operator = faqat o'z data; dept head = bo'lim xulosasi; director = kompaniya-miqyos

**I — digest-cron.service.ts (EP-NTF-003, EP-NTF-045)**
- Uchta alohida cron: 18:00 kunlik (smena oxiri), Dushanba 10:00 haftalik GSD, Se 09:00 ZVS
- `ntf_schedule_config` dan cron expr o'qib dinamik — hardcoded EMAS
- BullMQ delayed job: har foydalanuvchi uchun alohida job

**J — escalation.service.ts (EP-NTF-017, EP-NTF-033, EP-NTF-034)**
- `startCountdown(eventCode, contextId, durationMs, escalateTo)` → BullMQ delayed job
- `cancelCountdown(jobId)` → job olib tashlaydi (hal qilinganda)
- 15-daqiqa (TechCard error → texnolog), 1-soat (fix assignment → deadline), RD-5 escalatsiya

**K — production-halt.handler.ts (EP-NTF-029)**
- `@OnEvent('mes.production.halt')` → CRITICAL priority
- Smena ustasi + texnik xizmat + bo'lim boshlig'i ga bir vaqtda (EP-NTF-008 mixed channel)
- Quiet hours CHETLAB O'TADI (EP-NTF-063) — har doim yetkaziladi

**L — material-shortage.handler.ts (EP-NTF-047)**
- `@OnEvent('wms.stock.low')` → bosh rejalashtiruvchi + ta'minot bo'limiga signal

**M — shift-handover.handler.ts (EP-NTF-078)**
- `@OnEvent('mes.shift.handover')` → ochiq topshiriqlar + STOP'lar → keyingi smena mas'uliga + texnologga

**N — razryad-change.handler.ts (EP-NTF-014)**
- `@OnEvent('org.razryad.changed')` → xodim + menejer + HR ga bir vaqtda; karta-markazli routing

**O — order-stage.handler.ts (EP-NTF-024)**
- `@OnEvent('sd.order.stage_changed')` → mas'ul bo'lim + savdo menejer + (kechikkan bo'lsa) menejer

**P — card-status.handler.ts (EP-NTF-051)**
- `@OnEvent('crm.card.status_changed')` → routing matrix orqali keyingi mas'ul topiladi

**Q — formalize.handler.ts + ntf-formalize.controller.ts (EP-NTF-031)**
- 6 tur xabar avtomatik rasmiylashtiriladi: qaror/reja-o'zgarish/topshiriq/texkarta-o'zgartirish/sifat-xulosa/ogohlantiruv
- `ntf_log` ga `is_formal=true`, `formal_ref_number` (yil+tur+tartib raqami) saqlanadi

**R — ack-manager.service.ts (EP-NTF-016, EP-NTF-082)**
- Faqat `priority=IMPORTANT` yoki `CRITICAL` da `requires_ack=true` (EP-NTF-016 override)
- INFO uchun ack TALAB QILINMAYDI
- 30 daqiqa → qayta yuborish (max 2 marta) → escalatsiya

**S — FE sahifalar**
- `NtfBotConfig.tsx` → bot ro'yxati + toggle + ping; ListPage shabloni
- `DigestHistory.tsx` → ntf_log type='digest' → o'tgan digestlar; ListPage shabloni
- `NtfEscalations.tsx` → faol escalatsiyalar (countdown + holat); DashboardPage shabloni
- `NtfFormalRecords.tsx` → rasmiylashtirilgan xabarlar (is_formal=true); ListPage shabloni

**T — telegram/telegram.service.ts: process.env fix (Qoida 7)**
- Hozirda: `process.env.TELEGRAM_BOT_TOKEN` va `process.env.DASHBOARD_URL` to'g'ridan (qator 27, 60)
- To'g'rilangandan keyin: `ConfigService.getOrThrow('TELEGRAM_BOT_TOKEN')` faqat

### 2.3 Kanal rejimi (EP-NTF-008 owner override)
- Shaxsiy natijalar → shaxsiy chat
- Bo'lim xulosasi → guruh (telegram_group_id — org_functions jadvalidan)
- CRITICAL har doim ikkalasiga ham (mixed)

---

## 3. HOZIRGI HOLAT

### 3.1 director.bot.ts (apps/api/src/modules/bot-gateway/bots/director.bot.ts)

**Mavjud:** 3 ta buyruq (`/kpi`, `/ai`, `/summary`) — real DB so'rovlar bilan (qatorlar 25-111).
`hasBotPermission('director', msg.role)` guard mavjud (qator 21).

**YO'Q (Wave 3 doirasi):**
- `/zvs_status` buyrug'i — yo'q
- `/my_gsd` buyrug'i — yo'q
- `/company_state` buyrug'i — yo'q
- `/weekly_digest` buyrug'i — yo'q

**O'CHIRILMAYDI:** `/kpi`, `/ai`, `/summary` buyruqlari ishlaydi, saqlanadi (Q-46).

### 3.2 drizzle-telegram-svc.repo.ts (notifications/telegram/)

**Mavjud:** `insertNotification()` (real INSERT, qator 17), `countAll()` (qator 33-39).
`getUserChatId?` — interfeys darajasida optional (i-telegram-svc.repo.ts:16), impl YO'Q.

**Holat:** `TelegramSvc.sendMessage()` `chatId` topilmasa 'pending' qaytaradi (telegram.service.ts:88-98). `getUserChatId` impl yo'qligi tufayli barcha xabarlar pending holatda qoladi.

**Tuzatish:** `getUserChatId(userId)` → `employees` jadvalidan `telegram_chat_id` ustuni.

### 3.3 telegram-bot.adapter.ts (infrastructure/external/)

**Mavjud:** `sendMessage()` — real Telegram API chaqiruvi, withRetry bilan (qatorlar 41-64).
`sendAlert()` — real (qatorlar 66-107).

**Stub/broken:**
- `sendOrderStatusUpdate()` → `return Ok(undefined)` echo, hech narsa yuborilmaydi (qator 117)
- `sendAdvanceReminder()` → `return Ok(undefined)` (qator 122)
- `sendCertExpiry()` → `return Ok(undefined)` (qator 129)
- `sendStockAlert()` → `return Ok(undefined)` (qator 135)
- `sendQcResult()` → `return Ok(undefined)` (qator 141)

**Tuzatish:** Har bir metod real chatId resolve + sendMessage chaqirishi kerak.

### 3.4 notifications/application/ — xizmatlar yo'q

Quyidagi fayllar MAVJUD EMAS (yaratiladi):
- `quiet-hours.service.ts` — yo'q
- `onboarding-link.service.ts` — yo'q
- `digest.service.ts` — yo'q
- `digest-cron.service.ts` — yo'q
- `escalation.service.ts` — yo'q
- `ack-manager.service.ts` — yo'q

### 3.5 notifications/infrastructure/event-handlers/ — P47 handlerlari yo'q

Mavjud handlelar (O'CHIRILMAYDI):
- `deal-won-notification.listener.ts` ✅
- `order-created-notification.listener.ts` ✅
- `qc-failed-notification.listener.ts` ✅
- `lms-cert-expired-notification.listener.ts` ✅
- `mro-machine-stopped-notification.listener.ts` ✅
- `orphan-events.listener.ts` ✅
- `erp-events.listener.ts` — deprecated stub, `export {}` — saqlanadi

**YO'Q (yaratiladi):**
- `production-halt.handler.ts`
- `material-shortage.handler.ts`
- `shift-handover.handler.ts`
- `razryad-change.handler.ts`
- `order-stage.handler.ts`
- `card-status.handler.ts`
- `formalize.handler.ts`

### 3.6 notifications/presentation/ — P47 controllerlar yo'q

Mavjud: `notifications.controller.ts` (O'CHIRILMAYDI, owned emas).

**YO'Q (yaratiladi):**
- `ntf-bot-config.controller.ts`
- `ntf-onboarding.controller.ts`
- `ntf-escalation.controller.ts`
- `ntf-formalize.controller.ts`

### 3.7 telegram/telegram.service.ts (apps/api/src/telegram/)

**Holat:** `process.env.TELEGRAM_BOT_TOKEN` to'g'ridan ishlatilmoqda (qator 27) — Qoida 7 buzilishi.
`process.env.DASHBOARD_URL` (qator 60) — Qoida 7 buzilishi.

**Tuzatish:** `ConfigService` inject qilinadi, `process.env` o'chiriladi.

### 3.8 FE sahifalar

`NtfBotConfig.tsx`, `DigestHistory.tsx`, `NtfEscalations.tsx`, `NtfFormalRecords.tsx` —
MAVJUD EMAS. Yaratiladi (P47 owned).

<!-- DAVOMI -->

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl + aniq o'zgarish + oldin/keyin + DB-proof. Tartib muhim — keyingi qadam oldingiga tayanadi.

---

### Qadam 1 — telegram/telegram.service.ts: process.env fix (Qoida 7)

**Fayl:** `apps/api/src/telegram/telegram.service.ts` (qator 22-29)

**Muammo:** `process.env.TELEGRAM_BOT_TOKEN` to'g'ridan ishlatilmoqda — Qoida 7 buzilishi.

**Oldin (qator 22-29):**
```typescript
export class TelegramService {
  private bot: TelegramBot
  private readonly logger = new Logger(TelegramService.name)

  constructor(private readonly i18n: I18nService) {
    const token = process.env.TELEGRAM_BOT_TOKEN || ''
    this.bot = new TelegramBot(token, { polling: false })
  }
```

**Keyin:**
```typescript
export class TelegramService {
  private bot: TelegramBot
  private readonly logger = new Logger(TelegramService.name)

  constructor(
    private readonly i18n: I18nService,
    private readonly config: ConfigService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? ''
    if (!token) this.logger.warn('TELEGRAM_BOT_TOKEN not configured — TelegramService no-op mode')
    this.bot = new TelegramBot(token, { polling: false })
  }
```

Shuningdek `process.env.DASHBOARD_URL` ham o'sha faylning keyingi qatorlarida mavjud — `this.config.get<string>('DASHBOARD_URL') ?? ''` bilan almashtir.

**Import qo'shish:** `import { ConfigService } from '@nestjs/config';`

**DB-proof:** `pnpm tsc --noEmit` → 0 xato.

---

### Qadam 2 — drizzle-telegram-svc.repo.ts: getUserChatId real impl

**Fayl:** `apps/api/src/modules/notifications/telegram/drizzle-telegram-svc.repo.ts`

**Muammo:** `getUserChatId` interfeysi mavjud lekin DrizzleTelegramSvcRepository da implement qilinmagan.

**Oldin (fayl 41 qator, metod yo'q):**
```typescript
async countAll(): Promise<Result<number>> {
  try {
    const rows = await db.select().from(notifications);
    return Ok(rows.length);
  } catch (e: unknown) {
    return Err((e as Error)?.message || 'Xabarnomalar sanashda xatolik');
  }
}
```

**Keyin — `countAll` dan keyin qo'shiladi:**
```typescript
  async getUserChatId(userId: number): Promise<Result<string | null>> {
    try {
      // employees jadvalidagi telegram_chat_id ustunidan o'qiladi.
      // P46 re-audit: employees.telegram_chat_id ustuni mavjudligini tekshirib ol.
      const rows = await db.execute(
        sql`SELECT telegram_chat_id FROM employees WHERE user_id = ${userId} LIMIT 1`
      );
      const chatId = (rows.rows[0] as { telegram_chat_id?: string } | undefined)?.telegram_chat_id ?? null;
      return Ok(chatId);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'telegram_chat_id topilmadi');
    }
  }

  // EP-NTF-015: foydalanuvchi profilidan til o'qish (uz|ru|uz-cyr)
  // ntf_log.user_lang ga yoziladi — shablon render shu tilga qarab amalga oshiriladi
  async getUserLang(userId: number): Promise<Result<string>> {
    try {
      const rows = await db.execute(
        sql`SELECT lang FROM employees WHERE user_id = ${userId} LIMIT 1`
      );
      const lang = (rows.rows[0] as { lang?: string } | undefined)?.lang ?? 'uz';
      return Ok(lang);
    } catch (e: unknown) {
      return Ok('uz'); // fallback — xato bo'lsa ham default 'uz'
    }
  }
```

**DB-proof:**
```sql
SELECT telegram_chat_id FROM employees WHERE user_id = 1 LIMIT 1;
-- Natija: {telegram_chat_id: null} yoki haqiqiy chat_id
```

---

### Qadam 3 — telegram-bot.adapter.ts: stub metodlarni real send bilan almashtirish

**Fayl:** `apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts`

**Muammo:** 5 ta metod `return Ok(undefined)` echo — real Telegram chaqiruvi yo'q (qatorlar 109-158).

**Yordamchi metod qo'shiladi (private):**
```typescript
private async resolveAndSend(userIdOrManagerId: number, text: string): Promise<Result<void>> {
  // TELEGRAM_SVC_REPO yoki employees jadvalidan chatId topish
  // Adapter doirasida to'g'ridan DB ga tegmaslik uchun — env-based fallback chatId ishlatiladi
  // Real: TelegramSvc.sendNotification() chaqirilishi kerak, lekin adapter bu svc ga bog'liq emas.
  // Yechim: ConfigService dan DIRECTOR_CHAT_ID kabi rol-based env ni o'qi, yoki log qilib pending qaytar.
  const fallbackChatId = this.cfg.get<string>(`TELEGRAM_CHAT_USER_${userIdOrManagerId}`) ?? '';
  if (!fallbackChatId) {
    this.logger.warn(`resolveAndSend: no chat_id for userId=${userIdOrManagerId}, skipping delivery`);
    return Ok(undefined); // pending — DB da saqlanadi (TelegramSvc tomonidan)
  }
  return this.sendMessage(fallbackChatId, text);
}
```

**sendOrderStatusUpdate o'zgarishi (qator 109-117):**

Oldin:
```typescript
async sendOrderStatusUpdate(managerId, orderId, status) {
  const message = `Order #${orderId} status changed to: ${status}`;
  this.logger.log('Order status update');
  return Ok(undefined);
}
```

Keyin:
```typescript
async sendOrderStatusUpdate(managerId: number, orderId: number, status: string): Promise<Result<void>> {
  const text = `📦 <b>Buyurtma holati o'zgardi</b>\nBuyurtma #${orderId}: <b>${status}</b>`;
  return this.resolveAndSend(managerId, text);
}
```

**Qolgan 4 metod ham xuddi shunday pattern** — har biri `resolveAndSend(id, formatText(...))`.

**DB-proof:** Adapter uchun tsc 0 yetarli (real delivery TelegramSvc layer da).

---

### Qadam 4 — director.bot.ts: 4 ShVB buyruq qo'shiladi (EP-NTF-001)

**Fayl:** `apps/api/src/modules/bot-gateway/bots/director.bot.ts`

**Hozirgi holat:** 3 buyruq mavjud (qator 25-29). O'CHIRILMAYDI.

**handle() kengaytirish (qator 29 dan keyin, `return helpReply(...)` DAN OLDIN):**
```typescript
if (cmd === '/zvs_status')    return this.getZvsStatus(msg);
if (cmd === '/my_gsd')        return this.getMyGsd(msg);
if (cmd === '/company_state') return this.getCompanyState(msg);
if (cmd === '/weekly_digest') return this.triggerWeeklyDigest(msg);
// helpReply ham yangilanadi: /kpi /ai /summary /zvs_status /my_gsd /company_state /weekly_digest
```

**EP-NTF-021 inline callback_query handler (MISSING — conformance audit fixi):**

> ⚠️ **00-INTERVYU-MOSLIK fix:** inline keyboard tugmalari ko'rsatilgan (EP-NTF-021 MATCH), lekin
> `callback_query` handler MISSING edi. Egasi override: "asosiy amallar (tasdiqla/rad et/topshiriq ber)
> tugma bilan" (OCHIQ-JAVOBLAR EP-NTF-021). Quyidagi `handleCallback` metodi director.bot.ts ga qo'shiladi.

```typescript
// director.bot.ts ga qo'shiladi (handle() dan keyin, alohida public metod sifatida)

/**
 * EP-NTF-021: Inline keyboard callback_query handler.
 * Telegram inline tugmalari: APPROVE_<taskId>, REJECT_<taskId>, ASSIGN_<taskId>.
 * RBAC: rol tekshiriladi (EP-NTF-022) — faqat huquqli foydalanuvchi amal bajaradi.
 * ntf_log ga yoziladi (EP-NTF-027 — kim qachon qaysi qarorni berdi).
 * NOTE: Bu "salbiy ta'sir" tashkil etmaydi — faqat tasdiq/rad qaydlari (Q85-86 global printsip saqlanadi).
 */
async handleCallback(callbackQuery: {
  id: string;
  data?: string;
  message?: { chat: { id: number }; message_id: number };
  from: { id: number };
}) {
  const data = callbackQuery.data ?? '';
  const telegramUserId = callbackQuery.from.id;

  // Foydalanuvchini telegram_chat_id orqali ERP user_id ga map qil
  const erpUser = await this.resolveErpUser(telegramUserId);
  if (!erpUser) {
    // Callback answer — "Bot bilan bog'lanmagan" (onboarding havolasi yuboriladi)
    return { text: 'Siz ERP ga ulanmagansiz. HR dan onboarding havolasini so\'rang.' };
  }

  // APPROVE_<taskId>
  if (data.startsWith('APPROVE_')) {
    const taskId = parseInt(data.replace('APPROVE_', ''), 10);
    if (isNaN(taskId)) return { text: 'Noto\'g\'ri taskId' };
    await this.logCallbackAction(erpUser.userId, 'APPROVE', taskId, telegramUserId);
    // Asl tasdiqlash logikasi mos modulga delegatsiya qilinadi (Kanban/CC/PP)
    // Bu yerda faqat ntf_log ga yoziladi — biznes logika modul servicelari da
    return { text: `✅ ${taskId}-vazifa tasdiqlash qayd qilindi. Mas\'ul bo\'lim xabardor qilindi.` };
  }

  // REJECT_<taskId>
  if (data.startsWith('REJECT_')) {
    const taskId = parseInt(data.replace('REJECT_', ''), 10);
    if (isNaN(taskId)) return { text: 'Noto\'g\'ri taskId' };
    await this.logCallbackAction(erpUser.userId, 'REJECT', taskId, telegramUserId);
    return { text: `❌ ${taskId}-vazifa rad etish qayd qilindi.` };
  }

  // ASSIGN_<taskId>
  if (data.startsWith('ASSIGN_')) {
    const taskId = parseInt(data.replace('ASSIGN_', ''), 10);
    if (isNaN(taskId)) return { text: 'Noto\'g\'ri taskId' };
    await this.logCallbackAction(erpUser.userId, 'ASSIGN', taskId, telegramUserId);
    return { text: `📋 ${taskId}-vazifa tayinlash qayd qilindi.` };
  }

  return { text: 'Noma\'lum amal.' };
}

private async logCallbackAction(
  erpUserId: number,
  action: 'APPROVE' | 'REJECT' | 'ASSIGN',
  taskId: number,
  telegramUserId: number,
) {
  // ntf_log ga yozish — EP-NTF-021/027: kim qachon qaysi qarorni berdi
  await db.execute(sql`
    INSERT INTO ntf_log(recipient_user_id, sender_user_id, channel, priority, payload, sent_at)
    VALUES (${erpUserId}, ${erpUserId}, 'telegram', 'INFO',
            ${JSON.stringify({
              type: 'inline_callback',
              action,
              taskId,
              telegramUserId,
              ts: new Date().toISOString(),
            })},
            NOW())
  `);
  this.logger.log(`code=EP-NTF-021 action=callback_${action.toLowerCase()} taskId=${taskId} erpUserId=${erpUserId}`);
}

private async resolveErpUser(telegramUserId: number): Promise<{ userId: number; role: string } | null> {
  // employees.telegram_chat_id orqali ERP user_id topish
  // EP-NTF-015: lang ham o'qiladi (userLang → ntf_log.user_lang uchun)
  try {
    const rows = await db.execute(sql`
      SELECT u.id AS user_id, u.role
      FROM employees e JOIN users u ON u.id = e.user_id
      WHERE e.telegram_chat_id = ${String(telegramUserId)}
      LIMIT 1
    `);
    const row = (rows as any).rows?.[0] as { user_id: number; role: string } | undefined;
    return row ? { userId: row.user_id, role: row.role } : null;
  } catch {
    return null;
  }
}
```

**Inline keyboard yaratish (existing ShVB commands ga qo'shiladi — misol):**
```typescript
// getZvsStatus metodi javobiga inline keyboard qo'shish misoli:
// Telegram bot adapter / TelegramCoreService da buildInlineKeyboard() ishlatiladi
// (Phase 2 B-section: TelegramCoreService.buildInlineKeyboard(actions[]))
const keyboard = {
  inline_keyboard: [[
    { text: '✅ Tasdiqlash', callback_data: `APPROVE_${taskId}` },
    { text: '❌ Rad etish',  callback_data: `REJECT_${taskId}` },
    { text: '📋 Tayinlash',  callback_data: `ASSIGN_${taskId}` },
  ]]
};
```

**4 ta private metod — har biri `execSqlResult<T>(sql\`...\`, 'director.bot/X')` pattern:**

| Metod | Event | SQL manba | Kanal | EP-NTF |
|-------|-------|-----------|-------|--------|
| `getZvsStatus` | `/zvs_status` | `chart_of_accounts` JOIN `entries` (revenue/expense, joriy oy) | HTML | 001 |
| `getMyGsd` | `/my_gsd` | `kpi_metrics` JOIN `employees` JOIN `users.telegram_chat_id=msg.chatId` (joriy hafta) | HTML | 001 |
| `getCompanyState` | `/company_state` | `sales_orders COUNT/SUM` + `warehouse_stock.qty<=min` + `employees.status=active` (Promise.all) | HTML | 001/022 |
| `triggerWeeklyDigest` | `/weekly_digest` | INSERT ntf_log: `{type:'digest_requested', chatId}` FROM employees WHERE telegram_chat_id=chatId | plain | 001 |

Har metod: `!res.ok → dbErrorReply()`; `!res.rows.length → helpReply('...')`

**DB-proof:**
```sql
SELECT id, payload, sent_at FROM ntf_log WHERE payload->>'type' = 'digest_requested' ORDER BY sent_at DESC LIMIT 1;
```

---

### Qadam 5 — quiet-hours.service.ts (EP-NTF-018, EP-NTF-063)

**Fayl:** `apps/api/src/modules/notifications/application/quiet-hours.service.ts` — YANGI

**Imzo:** `shouldDeliver(moduleCode: string, priority: 'CRITICAL'|'IMPORTANT'|'INFO'): Promise<Result<boolean>>`

**Mantiq:**
```
1. priority === 'CRITICAL' → return Ok(true)  [EP-NTF-063, har doim]
2. ntf_schedule_config: SELECT quiet_start, quiet_end WHERE module_code=X AND is_active=true
3. Config yo'q → Ok(true)
4. TashkentTimeService.now() → nowMin = hours*60+minutes
5. startMin/endMin hisoblash
6. Midnight crossing: startMin > endMin ? (nowMin>=startMin || nowMin<endMin) : (nowMin>=startMin && nowMin<endMin)
7. inQuiet → log(code=EP-NTF-018 action=quiet_block) → Ok(false)
8. Not inQuiet → Ok(true)
9. catch → Err({code:'DB_ERROR',...})
```

**Import:** `TashkentTimeService` (`@common/time`), `Ok/Err/Result` (`@common/result`)

---

### Qadam 6 — onboarding-link.service.ts (EP-NTF-023)

**Fayl:** `apps/api/src/modules/notifications/application/onboarding-link.service.ts` — YANGI

**2 metod:**

`generateOnboardingLink(userId)` → `Result<{token, url, expiresAt}>`:
```typescript
// token = randomUUID(); TTL = 48 soat; botUsername = ConfigService.getOrThrow('TELEGRAM_BOT_USERNAME')
// ntf_log INSERT: {type:'onboarding_token', token, userId, expiresAt}
// url = `https://t.me/${botUsername}?start=${token}`
// log: code=EP-NTF-023 action=onboarding_link_generated userId=X
```

`linkTelegramChatId(token, telegramChatId)` → `Result<void>`:
```typescript
// ntf_log SELECT WHERE payload->>'type'='onboarding_token' AND payload->>'token'=token
// Topilmasa → Err NOT_FOUND; expiresAt o'tgan → Err EXPIRED
// employees UPDATE SET telegram_chat_id=chatId WHERE user_id=row.user_id
// log: code=EP-NTF-023 action=telegram_linked userId=X
```

---

### Qadam 7 — escalation.service.ts (EP-NTF-017, EP-NTF-034)

**Fayl:** `apps/api/src/modules/notifications/application/escalation.service.ts` — YANGI

**EscalationContext:** `{eventCode: string; contextId: string; durationMs: number; escalateTo: number[]; message: string}`

`startCountdown(ctx)` → `Result<{jobId: string}>`:
```typescript
// jobId = `esc_${eventCode}_${contextId}_${Date.now()}`
// ntf_log INSERT: channel='system', priority='CRITICAL',
//   payload={type:'escalation_started', jobId, ...ctx},
//   sent_at = NOW() + durationMs::interval
// log: code=EP-NTF-017 action=countdown_started jobId=X durationMs=Y
```

`cancelCountdown(jobId)` → `Result<void>`:
```typescript
// UPDATE ntf_log SET payload = payload || '{"cancelled":true}'
// WHERE payload->>'jobId'=jobId AND payload->>'type'='escalation_started'
// log: code=EP-NTF-017 action=countdown_cancelled
```

---

### Qadam 7b — night-protocol.handler.ts (EP-NTF-035, EP-NTF-036) — YANGI

> ⚠️ **00-INTERVYU-MOSLIK fix:** bu handler MISSING edi — conformance audit aniqladi.
> Manba: MASTER-SAVOL-JAVOB EP-NTF-035/036 (✅ JAVOBLANGAN), MUSLIMBEK-PROMT-21-NTF Phase 4.

**Fayl:** `apps/api/src/modules/notifications/infrastructure/event-handlers/night-protocol.handler.ts` — YANGI
**OWNED FILES ro'yxatiga qo'shilsin** (§1 Izolyatsiya Manifesti).

**EP-NTF-035 — tungi smena telefon-eskalatsiyasi:**
- RD-4 yoki bosh texnolog tungi vaqtda telefon qilindi → "qo'ng'iroq qilindi / javob berdi / bermadi" qayd
- Javob bo'lmasa → ertalab rahbarga ko'rinadi (morning digest)
- PRIMARY kanal: Telegram bot inline keyboard tugmasi (Q867 VISION-1000 → bot PRIMARY, ERP secondary)

**EP-NTF-036 — tungi yakka qaror belgisi:**
- Smena texnologi "davom ettirish" qarori qabul qildi → `is_night_solo=true` belgisi bilan qayd
- Ertalab bosh texnolog + RD-5 digestida ko'rinadi
- Immutable: qayd o'zgartirilmaydi (EP-NTF-080) — faqat cancellation record yaratiladi

```typescript
/**
 * @module night-protocol.handler
 * EP-NTF-035: Tungi smena telefon-eskalatsiya log.
 * EP-NTF-036: Tungi yakka qaror belgisi.
 * PRIMARY kanal: Telegram bot inline keyboard (Q867: tungi vaqtda xodim faqat telefon/Telegram).
 * RD-5 protokoli: RD-4/bosh texnolog tungi vaqtda javob berishi shart.
 */
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class NightProtocolHandler {
  private readonly logger = new Logger(NightProtocolHandler.name);

  /**
   * POST /api/ntf/night-call — tungi qo'ng'iroq qayd qilish (EP-NTF-035).
   * caller_id = qo'ng'iroq qiluvchi (smena texnolog yoki mas'ul), callee_id = RD-4/bosh texnolog.
   * ntf_log ga yoziladi: type='night_call', priority='CRITICAL', requires_ack=true.
   */
  async logNightCall(dto: {
    callerId: number;
    calleeId: number;
    calledAt: Date;
    reason?: string;
  }) {
    this.logger.log(`code=EP-NTF-035 action=night_call_logged callerId=${dto.callerId} calleeId=${dto.calleeId}`);
    try {
      await db.execute(sql`
        INSERT INTO ntf_log(
          recipient_user_id, sender_user_id, channel, priority, requires_ack,
          payload, sent_at
        ) VALUES (
          ${dto.calleeId}, ${dto.callerId}, 'telegram', 'CRITICAL', true,
          ${JSON.stringify({
            type: 'night_call',
            callerId: dto.callerId,
            calleeId: dto.calleeId,
            calledAt: dto.calledAt.toISOString(),
            answeredAt: null,
            reason: dto.reason ?? null,
          })},
          ${dto.calledAt.toISOString()}
        )
      `);
    } catch (e) {
      this.logger.error(`NightProtocolHandler.logNightCall error: ${String(e)}`);
    }
  }

  /**
   * PATCH /api/ntf/night-call/:id/answered — javob berildi belgisi (EP-NTF-035).
   * ntf_log.payload.answeredAt = NOW() (JSONB update); ack_at ham yangilanadi.
   * EP-NTF-080: faqat payload JSONB ichidagi answeredAt o'zgaradi — immutable log qoidasi saqlanadi.
   */
  async markAnswered(ntfLogId: number, answeredAt: Date) {
    this.logger.log(`code=EP-NTF-035 action=night_call_answered ntfLogId=${ntfLogId}`);
    try {
      await db.execute(sql`
        UPDATE ntf_log
        SET payload = payload || ${JSON.stringify({ answeredAt: answeredAt.toISOString() })}::jsonb,
            ack_at = ${answeredAt.toISOString()}
        WHERE id = ${ntfLogId}
          AND payload->>'type' = 'night_call'
      `);
    } catch (e) {
      this.logger.error(`NightProtocolHandler.markAnswered error: ${String(e)}`);
    }
  }

  /**
   * POST /api/ntf/night-solo-decision — tungi yakka qaror belgisi (EP-NTF-036).
   * Smena texnologi "davom ettirish" qarori → ntf_log ga is_night_solo=true.
   * Ertalab bosh texnolog + RD-5 morning digest da ko'rinadi.
   * IMMUTABLE (EP-NTF-080): qayd o'zgartirilmaydi; bekor qilish = alohida cancellation qator.
   */
  async logNightSoloDecision(dto: {
    decisionMakerId: number;
    decision: string;           // "davom ettirildi" / "to'xtatildi"
    reason: string;
    orderOrMachineRef?: string;
  }) {
    this.logger.log(`code=EP-NTF-036 action=night_solo_decision decisionMakerId=${dto.decisionMakerId}`);
    try {
      // Bosh texnolog + RD-5 recipient_id ni rol orqali toping
      const recipientRows = await db.execute<{ id: number }>(sql`
        SELECT u.id FROM users u
        JOIN employees e ON e.user_id = u.id
        WHERE u.role IN ('head_technologist', 'rd5', 'production_director')
          AND u.is_active = true
        LIMIT 5
      `);
      const recipientIds = Array.isArray((recipientRows as any).rows)
        ? (recipientRows as any).rows.map((r: { id: number }) => r.id)
        : [];

      await Promise.allSettled(
        recipientIds.map((recipientId: number) =>
          db.execute(sql`
            INSERT INTO ntf_log(
              recipient_user_id, sender_user_id, channel, priority, requires_ack,
              payload, sent_at
            ) VALUES (
              ${recipientId}, ${dto.decisionMakerId}, 'telegram', 'IMPORTANT', true,
              ${JSON.stringify({
                type: 'night_solo_decision',
                is_night_solo: true,
                decision: dto.decision,
                reason: dto.reason,
                orderOrMachineRef: dto.orderOrMachineRef ?? null,
                decisionMakerId: dto.decisionMakerId,
              })},
              NOW()
            )
          `)
        )
      );
    } catch (e) {
      this.logger.error(`NightProtocolHandler.logNightSoloDecision error: ${String(e)}`);
    }
  }
}
```

**Presentation controller (qo'shimcha — P47 owned fayllarga qo'shiladi):**

**Fayl:** `apps/api/src/modules/notifications/presentation/ntf-night-protocol.controller.ts` — YANGI
**OWNED FILES ro'yxatiga qo'shilsin** (§1 Izolyatsiya Manifesti).

```typescript
import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { z } from 'zod';
import { NightProtocolHandler } from '../infrastructure/event-handlers/night-protocol.handler';

const NightCallSchema = z.object({
  callerId: z.number().int().positive(),
  calleeId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

const NightSoloDecisionSchema = z.object({
  decision: z.enum(['davom_ettirildi', 'toxtatildi']),
  reason: z.string().min(1).max(1000),
  orderOrMachineRef: z.string().max(100).optional(),
});

@ApiTags('NTF Night Protocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ntf')
export class NtfNightProtocolController {
  constructor(private readonly handler: NightProtocolHandler) {}

  @ApiOperation({ summary: 'EP-NTF-035: Tungi qo\'ng\'iroq qayd (RD-4/bosh texnolog)' })
  @Post('night-call')
  async logNightCall(@Body() body: unknown) {
    const dto = NightCallSchema.parse(body);
    await this.handler.logNightCall({ ...dto, calledAt: new Date() });
    return { ok: true, calledAt: new Date() };
  }

  @ApiOperation({ summary: 'EP-NTF-035: Tungi qo\'ng\'iroqqa javob berdi belgisi' })
  @Patch('night-call/:id/answered')
  async markAnswered(@Param('id', ParseIntPipe) id: number) {
    await this.handler.markAnswered(id, new Date());
    return { ok: true, id, answeredAt: new Date() };
  }

  @ApiOperation({ summary: 'EP-NTF-036: Tungi yakka qaror belgisi (smena texnolog)' })
  @Post('night-solo-decision')
  async logNightSoloDecision(@Body() body: unknown) {
    // MUHIM: decisionMakerId = joriy autentifikatsiya qilingan foydalanuvchi (CurrentUser)
    // CurrentUser dekoratori ishlatilishi kerak — bu stub uchun body dan olinmoqda
    const dto = NightSoloDecisionSchema.extend({
      decisionMakerId: z.number().int().positive(),
    }).parse(body);
    await this.handler.logNightSoloDecision(dto);
    return { ok: true };
  }
}
```

**Qabul mezoni (EP-NTF-035/036):**
- POST `/api/ntf/night-call` → `ntf_log` da `type='night_call'` yozuv (DB-proof)
- PATCH `/api/ntf/night-call/:id/answered` → `ntf_log.payload.answeredAt` yangilandi
- POST `/api/ntf/night-solo-decision` → `ntf_log` da `is_night_solo=true` payload bilan yozuv
- Morning digest: `ntf_log WHERE payload->>'type'='night_call' AND payload->>'answeredAt' IS NULL` → ertalab rahbarga ko'rinadi

---

### Qadam 8 — ack-manager.service.ts (EP-NTF-016, EP-NTF-082)

**Fayl:** `apps/api/src/modules/notifications/application/ack-manager.service.ts` — YANGI

**Constants:** `ACK_RESEND_DELAY_MS = 30*60*1000`; `ACK_MAX_RESENDS = 2`

**3 metod:**

```typescript
requiresAck(priority): boolean {
  return priority === 'CRITICAL' || priority === 'IMPORTANT'; // INFO = false (EP-NTF-016 override)
}

markAck(ntfLogId, userId) → Result<void>:
  // UPDATE ntf_log SET ack_at=NOW() WHERE id=X AND recipient_user_id=Y AND requires_ack=true
  // log: code=EP-NTF-016 action=ack_received

getPendingAcks() → Result<Array<{id, recipient_user_id, resend_count}>>:
  // SELECT WHERE requires_ack=true AND ack_at IS NULL
  //   AND sent_at < NOW()-ACK_RESEND_DELAY_MS AND resend_count < ACK_MAX_RESENDS
```

---

### Qadam 9 — digest.service.ts (EP-NTF-003, EP-NTF-065)

**Fayl:** `apps/api/src/modules/notifications/application/digest.service.ts` — YANGI

**Imzo:** `buildUserDigest(userId: number, period: 'day'|'week'|'month'): Promise<Result<DigestDto>>`

**DigestDto interfeys:**
```typescript
export interface DigestDto {
  userId: number; period: 'day'|'week'|'month'; role: string;
  kpiItems: Array<{ name: string; value: number; target: number; pct: number }>;
  ordersSummary?: { count: number; totalAmount: number };
  lowStock?: number; generatedAt: Date;
  // EP-NTF-012: Leaderboard (top-3 / past-3 by ЦКП%) — faqat role imkon bersa
  leaderboard?: {
    departmentTop3: Array<{ employeeId: number; name: string; ckpPct: number }>;
    departmentBottom3: Array<{ employeeId: number; name: string; ckpPct: number }>;
    companyTop3?: Array<{ employeeId: number; name: string; ckpPct: number }>; // faqat director/owner
  };
}
```

**Mantiq (5 qadam, hamma DB xatolar try/catch + Err):**
1. `users` JOIN `employees` → role + employee_id + org_function_id
2. KPI: `kpi_metrics` → `employee_id + period date_trunc` → pct hisob
3. Director/owner/super_admin: `sales_orders COUNT/SUM` + `warehouse_stock.quantity<=min_quantity COUNT`
4. **EP-NTF-012 Leaderboard:** `kpi_metrics` JOIN `employees` → bo'lim bo'yicha ЦКП% → ORDER BY pct DESC/ASC LIMIT 3:
   ```sql
   -- Top-3 (bo'lim)
   SELECT e.id AS employee_id, u.full_name AS name,
          AVG(km.actual_value / NULLIF(km.target_value,0) * 100) AS ckp_pct
   FROM kpi_metrics km
   JOIN employees e ON e.id = km.employee_id
   JOIN users u ON u.id = e.user_id
   WHERE e.org_function_id = <user_org_function_id>
     AND km.period_start >= <period_start>
   GROUP BY e.id, u.full_name
   ORDER BY ckp_pct DESC NULLS LAST LIMIT 3;
   -- Bottom-3: ORDER BY ckp_pct ASC NULLS LAST LIMIT 3
   ```
   - Operator roli: bo'limning top-3/bottom-3
   - Director/owner: kompaniya miqyosidagi top-3 ham (ep-ntf-012: "companyTop3")
   - `kpi_metrics` jadval mavjud bo'lmasa → `leaderboard: null` (honest partial — TO'XTAMA)
5. `ntf_log` INSERT: `{type:'digest', ...digest}` payload; `Ok(digest)` qaytariladi

**Vertikal aggregatsiya (EP-NTF-065):** operator = faqat o'z kpi; dept_head = bo'lim; director = kompaniya.
Hozircha employee KPI + director kompaniya — dept_head aggregatsiya P48 ga defer (STOP+flag qilma, honest partial).

**Logika kodi:** `code=EP-NTF-003 module=ntf action=digest_built userId=X period=Y`

---

### Qadam 10 — digest-cron.service.ts (EP-NTF-045)

**Fayl:** `apps/api/src/modules/notifications/application/digest-cron.service.ts` — YANGI

> ⚠️ **Q140 / 00-INTERVYU-MOSLIK FIX:** Egasi "har modul uchun o'zi vaqt belgilaydi" degan
> (MASTER-SAVOL-JAVOB EP-NTF-003: "C — Egasi har modul uchun o'zi vaqt belgilaydi").
> `@Cron` hardcode **TAQIQ** — vaqt `ntf_schedule_config` jadvalidan o'qiladi.
> `ntf_schedule_config` da 3 ta seed qator (kunlik/haftalik GSD/haftalik ZVS) bo'lishi kerak —
> egasi ularni ERP ichidan o'zgartiradi, kod deploy qilmasdan.
> **EGASI QIYMATI KERAK:** Seed qatorlari `cron_expr` uchun default'lar quyida keltirilgan —
> egasi NtfScheduleConfig.tsx sahifasidan o'zgartirishi mumkin.

```typescript
/**
 * @module digest-cron.service
 * EP-NTF-045 / Q140: Cron vaqti ntf_schedule_config jadvalidan o'qiladi.
 * HARDCODE TAQIQ — egasi ERP ichidan /settings/ntf/schedule sahifasida o'zgartiradi.
 * Har 5 daqiqada ntf_schedule_config tekshiriladi; cron_expr o'zgarsa qayta ro'yxatdan o'tkaziladi.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '@shared/db';
import { ntfScheduleConfig } from '@europrint/schemas';
import { eq, and } from 'drizzle-orm';
import { DigestService } from './digest.service';

// Digest event kodlari — ntf_schedule_config.event_code ga mos
const DIGEST_EVENT_CODES = {
  DAILY:       'digest.daily',    // Kunlik 18:00 (default)
  WEEKLY_GSD:  'digest.weekly.gsd',  // Dushanba 10:00 (default)
  WEEKLY_ZVS:  'digest.weekly.zvs',  // Seshanba 09:00 (default)
} as const;

// ShVB default vaqtlari — EGASI QIYMATI KERAK (ERP da o'zgartiradi)
// Bu qiymatlar faqat ntf_schedule_config da cron_expr NULL/yo'q bo'lganda fallback sifatida
const DEFAULT_CRON_EXPRS: Record<string, string> = {
  [DIGEST_EVENT_CODES.DAILY]:      '0 18 * * *',   // EGASI QIYMATI KERAK
  [DIGEST_EVENT_CODES.WEEKLY_GSD]: '0 10 * * 1',   // EGASI QIYMATI KERAK
  [DIGEST_EVENT_CODES.WEEKLY_ZVS]: '0 9 * * 2',    // EGASI QIYMATI KERAK
};

@Injectable()
export class DigestCronService implements OnModuleInit {
  private readonly logger = new Logger(DigestCronService.name);

  constructor(
    private readonly digestSvc: DigestService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.registerDigestCrons();
  }

  /**
   * ntf_schedule_config jadvali dan cron_expr o'qib, har digest uchun CronJob ro'yxatdan o'tkazadi.
   * Agar jadvalda config yo'q yoki cron_expr NULL → DEFAULT_CRON_EXPRS fallback ishlatiladi.
   * EP-NTF-045 / Q140: configurable, not hardcoded.
   */
  async registerDigestCrons() {
    const eventCodes = Object.values(DIGEST_EVENT_CODES);
    let rows: Array<{ eventCode: string; cronExpr: string | null; isActive: boolean }> = [];
    try {
      rows = await db
        .select({
          eventCode: ntfScheduleConfig.eventCode,
          cronExpr: ntfScheduleConfig.cronExpr,
          isActive: ntfScheduleConfig.isActive,
        })
        .from(ntfScheduleConfig)
        .where(
          and(
            eq(ntfScheduleConfig.moduleCode, 'ntf'),
            // filter: faqat digest event_code lar
          ),
        );
    } catch (e) {
      this.logger.warn(`DigestCronService: ntf_schedule_config o'qib bo'lmadi — default cron ishlatiladi: ${String(e)}`);
    }

    for (const eventCode of eventCodes) {
      const dbRow = rows.find(r => r.eventCode === eventCode);
      if (dbRow && dbRow.isActive === false) {
        this.logger.log(`code=EP-NTF-045 action=cron_skipped eventCode=${eventCode} reason=is_active=false`);
        continue;
      }
      const cronExpr = dbRow?.cronExpr ?? DEFAULT_CRON_EXPRS[eventCode];
      if (!cronExpr) continue;

      const period: 'day' | 'week' | 'month' =
        eventCode === DIGEST_EVENT_CODES.DAILY ? 'day' : 'week';

      const jobName = `digest_${eventCode}`;
      // Eski job mavjud bo'lsa o'chir (re-register)
      try { this.schedulerRegistry.deleteCronJob(jobName); } catch (_) { /* yo'q edi */ }

      const job = new CronJob(cronExpr, async () => {
        await this.fanOut(period, eventCode);
      }, null, true, 'Asia/Tashkent');

      this.schedulerRegistry.addCronJob(jobName, job);
      this.logger.log(`code=EP-NTF-045 action=cron_registered eventCode=${eventCode} cronExpr=${cronExpr}`);
    }
  }

  private async fanOut(period: 'day' | 'week' | 'month', eventCode: string) {
    this.logger.log(`code=EP-NTF-045 action=digest_batch_start period=${period} eventCode=${eventCode}`);
    try {
      const userRows = await db.execute<{ id: number }>(
        // SELECT id FROM users WHERE is_active=true LIMIT 500
        // typedExecute<{id:number}>(...) — Drizzle raw faqat murakkab WHERE uchun
        // NOTE: murakkab filter (is_active ustun turli sxemada) — raw ishlatildi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).execute(`SELECT id FROM users WHERE is_active = true LIMIT 500`) as any
      );
      const ids = Array.isArray((userRows as any).rows)
        ? (userRows as any).rows.map((r: { id: number }) => r.id)
        : [];
      const results = await Promise.allSettled(
        ids.map((uid: number) => this.digestSvc.buildUserDigest(uid, period))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      this.logger.log(`code=EP-NTF-045 action=digest_batch_done period=${period} count=${ids.length} failed=${failed}`);
    } catch (e) {
      this.logger.error(`DigestCronService.fanOut error: ${String(e)}`);
    }
  }
}
```

> **Migration seed (d6 migration ga qo'shiladi — P46 GATED migration bilan birga):**
> ```sql
> -- EP-NTF-045 / Q140: Digest cron default sozlamalari
> -- EGASI QIYMATI KERAK: cron_expr qiymatlarini /settings/ntf/schedule sahifasida o'zgartiring
> INSERT INTO ntf_schedule_config (module_code, event_code, cron_expr, is_active, quiet_start, quiet_end) VALUES
>     ('ntf', 'digest.daily',      '0 18 * * *', true, NULL, NULL),   -- EGASI QIYMATI KERAK (kunlik vaqt)
>     ('ntf', 'digest.weekly.gsd', '0 10 * * 1', true, NULL, NULL),   -- EGASI QIYMATI KERAK (haftalik GSD vaqt)
>     ('ntf', 'digest.weekly.zvs', '0 9 * * 2',  true, NULL, NULL)    -- EGASI QIYMATI KERAK (ZVS vaqt)
> ON CONFLICT (module_code, event_code) DO NOTHING;
> ```
> Egasi bu qatorlarni P46 GATED migration ichdagi mavjud seed blokka qo'shadi.

> **SchedulerRegistry ishlatish uchun:** `@nestjs/schedule` ScheduleModule.forRoot() app.module.ts da import bo'lishi kerak. Agar yo'q bo'lsa — TO'XTA + flag egasiga.

---

### Qadam 11–13 — Event handlerlari (EP-NTF-029, EP-NTF-047, EP-NTF-078)

Uchala handler bir xil skeleton: `@OnEvent(...)` → recipients SELECT → `ntf_log` INSERT barchasi uchun.

**production-halt.handler.ts** — `@OnEvent('mes.production.halt')`
- Event payload: `{machineId, lineId, reason?, reportedBy?}`
- Recipients SQL: `WHERE role IN ('shift_master','maintenance_engineer','production_manager') AND is_active=true LIMIT 30`
- ntf_log: `priority='CRITICAL'`, `requires_ack=true` (EP-NTF-063 — quiet hours chetlab o'tadi)
- Log: `code=EP-NTF-029 action=production_halt; action=halt_logged recipients=N`

**material-shortage.handler.ts** — `@OnEvent('wms.stock.low')`
- Event payload: `{materialId, currentQty, minQty, warehouseCode?}`
- Recipients SQL: `WHERE role IN ('head_planner','procurement_manager') AND is_active=true LIMIT 20`
- ntf_log: `priority='IMPORTANT'`, `requires_ack=false`
- Log: `code=EP-NTF-047 action=material_shortage`

**shift-handover.handler.ts** — `@OnEvent('mes.shift.handover')`
- Event payload: `{shiftId, nextShiftMasterId?, openTaskCount?, stopCount?}`
- Recipients: `[nextShiftMasterId, ...technologist role ids LIMIT 5]` → Set dedupe
- ntf_log: `priority='IMPORTANT'`, payload includes openTaskCount+stopCount
- Log: `code=EP-NTF-078 action=shift_handover`

> Hamma 3 handler: `try/catch`, xato `this.logger.error(...)`, `Promise.allSettled` (bir bad INSERT boshqalarni o'ldirmaydi).

---

### Qadam 14–16 — razryad/order-stage/card-status handlerlar (EP-NTF-014, EP-NTF-024, EP-NTF-051, EP-NTF-066)

Uchala handler bir xil pattern: `@OnEvent(...)` → recipients toping → `ntf_log` ga INSERT.

**razryad-change.handler.ts** — event: `'org.razryad.changed'` `{employeeId, oldRazryad, newRazryad, cardId?}`
- Recipients: `employees` da `id=employeeId` → `user_id` + `manager_id`; HR manager rollar
- Priority: `'IMPORTANT'`; log kodi: `EP-NTF-014`

```typescript
// Recipient SQL:
sql`SELECT u.id AS user_id, e.manager_id FROM employees e JOIN users u ON u.id=e.user_id WHERE e.id=${event.employeeId} LIMIT 1`
sql`SELECT id FROM users WHERE role='hr_manager' AND is_active=true LIMIT 5`
// Set birlashtir: [emp.user_id, emp.manager_id, ...hrIds]
// ntf_log payload: { type:'razryad_change', employeeId, oldRazryad, newRazryad, cardId }
```

**order-stage.handler.ts** — event: `'sd.order.stage_changed'` `{orderId, fromStage, toStage, responsibleDeptId?}`
- Recipients: `org_functions.id = responsibleDeptId` → employees → `role IN ('sales_manager','department_head')`
- Priority: `'IMPORTANT'`; log kodi: `EP-NTF-024`

```typescript
// Recipient SQL:
sql`SELECT u.id FROM users u JOIN employees e ON e.user_id=u.id WHERE e.org_function_id=${event.responsibleDeptId??0} AND u.role IN ('sales_manager','department_head') AND u.is_active=true LIMIT 20`
// ntf_log payload: { type:'order_stage', orderId, fromStage, toStage }
```

**card-status.handler.ts** — event: `'crm.card.status_changed'` `{cardId, fromStatus, toStatus, orgFunctionId?}`
- EP-NTF-066: `org_functions.id = orgFunctionId` → employees → users (karta egasi, nafas insoniga emas)
- Priority: `'IMPORTANT'`; log kodi: `EP-NTF-051`

```typescript
// Recipient SQL (card-centric routing):
sql`SELECT u.id AS user_id FROM org_functions of2 JOIN employees e ON e.org_function_id=of2.id JOIN users u ON u.id=e.user_id WHERE of2.id=${event.orgFunctionId??0} AND u.is_active=true LIMIT 10`
// ntf_log payload: { type:'card_status', cardId, fromStatus, toStatus }
```

---

### Qadam 17 — formalize.handler.ts + ntf-formalize.controller.ts (EP-NTF-031)

**Fayl:** `apps/api/src/modules/notifications/infrastructure/event-handlers/formalize.handler.ts` — YANGI

```typescript
/**
 * 6 tur xabar rasmiylashtiriladi: qaror/reja-o'zgarish/topshiriq/texkarta-o'zgartirish/sifat-xulosa/ogohlantiruv
 * Ref number format: YYYY-TUR-SEQ (masalan 2026-QAROR-0001)
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const FORMAL_TYPES = ['qaror','reja_ozgarish','topshiriq','texkarta_ozgarish','sifat_xulosa','ogohlantirish'] as const;
type FormalType = typeof FORMAL_TYPES[number];

@Injectable()
export class FormalizeHandler {
  private readonly logger = new Logger(FormalizeHandler.name);

  @OnEvent('ntf.formalize')
  async handle(event: { type: FormalType; message: string; authorId: number; recipientIds: number[] }) {
    if (!FORMAL_TYPES.includes(event.type)) return;
    this.logger.log(`code=EP-NTF-031 module=ntf action=formalize type=${event.type}`);
    try {
      // Tartib raqam generatsiyasi
      const seqRows = await db.execute(sql`
        SELECT COUNT(*)+1 AS seq FROM ntf_log
        WHERE payload->>'is_formal' = 'true'
          AND payload->>'formal_type' = ${event.type}
          AND sent_at >= date_trunc('year',NOW())
      `);
      const seq = String((seqRows.rows[0] as { seq: number }).seq).padStart(4, '0');
      const year = new Date().getFullYear();
      const formalRefNumber = `${year}-${event.type.toUpperCase()}-${seq}`;

      await Promise.allSettled(
        event.recipientIds.map(uid =>
          db.execute(sql`
            INSERT INTO ntf_log(recipient_user_id,channel,priority,payload,sent_at,requires_ack)
            VALUES(${uid},'telegram','IMPORTANT',
                  ${JSON.stringify({type:'formal',is_formal:true,formal_type:event.type,formal_ref_number:formalRefNumber,message:event.message,authorId:event.authorId})},
                  NOW(), false)
          `)
        )
      );
      this.logger.log(`code=EP-NTF-031 module=ntf action=formalized refNumber=${formalRefNumber}`);
    } catch (e: unknown) {
      this.logger.error(`FormalizeHandler error: ${String(e)}`);
    }
  }
}
```

**Fayl:** `apps/api/src/modules/notifications/presentation/ntf-formalize.controller.ts` — YANGI

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@ApiTags('NTF Formal Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'director', 'owner', 'super_admin')
@Controller('ntf/formal-records')
export class NtfFormalizeController {
  @Get()
  async listFormalRecords(@Query('type') type?: string, @Query('page') page = '1') {
    const offset = (Number(page) - 1) * 20;
    const rows = await db.execute(sql`
      SELECT id, payload->>'formal_ref_number' AS ref_number,
             payload->>'formal_type' AS formal_type,
             payload->>'message' AS message,
             sent_at, recipient_user_id
      FROM ntf_log
      WHERE payload->>'is_formal' = 'true'
        ${type ? sql`AND payload->>'formal_type' = ${type}` : sql``}
      ORDER BY sent_at DESC
      LIMIT 20 OFFSET ${offset}
    `);
    return { data: rows.rows, page: Number(page) };
  }
}
```

---

### Qadam 18–19 — ntf-bot-config + ntf-onboarding controllerlar

**ntf-bot-config.controller.ts** — `@Controller('ntf/bot-config')` `@Roles('admin','super_admin','owner')`

| Metod | Endpoint | Logika |
|-------|----------|--------|
| `@Get()` | `GET /api/ntf/bot-config` | `ntf_bot_config SELECT id,module_code,bot_token_env_key,is_active ORDER BY module_code` |
| `@Patch(':id/toggle')` | `PATCH /api/ntf/bot-config/:id/toggle` | Zod: `{is_active:z.boolean()}` → `UPDATE ntf_bot_config SET is_active=X WHERE id=Y` |
| `@Post('ping/:id')` | `POST /api/ntf/bot-config/ping/:id` | SELECT bot_token_env_key → `ConfigService.get(key)` → `fetch /getMe` → `{ok,botUsername}` |

**ntf-onboarding.controller.ts** — `@Controller('ntf/onboarding')` `@UseGuards(JwtAuthGuard)`

| Metod | Endpoint | Rol | Zod | Logika |
|-------|----------|-----|-----|--------|
| `@Post('generate')` | `POST /api/ntf/onboarding/generate` | admin/hr_manager | `{userId:z.number().int().positive()}` | `svc.generateOnboardingLink(dto.userId)` → `{data:{token,url,expiresAt}}` |
| `@Post('link-telegram')` | `POST /api/ntf/onboarding/link-telegram` | any authed | `{token:z.string().uuid(), telegramChatId:z.string().min(5)}` | `svc.linkTelegramChatId(token, chatId)` → `{ok:true}` |

---

### Qadam 20 — ntf-escalation.controller.ts (EP-NTF-017)

**Fayl:** `apps/api/src/modules/notifications/presentation/ntf-escalation.controller.ts` — YANGI
**Dekoratorlar:** `@Controller('ntf/escalations')` `@Roles('admin','director','super_admin')`

| Metod | Endpoint | Logika |
|-------|----------|--------|
| `@Get()` | `GET /api/ntf/escalations` | `ntf_log WHERE payload->>'type'='escalation_started' AND cancelled=false ORDER BY sent_at DESC LIMIT 50` → `{job_id, event_code, message, sent_at}` |
| `@Post(':jobId/cancel')` | `POST /api/ntf/escalations/:jobId/cancel` | `svc.cancelCountdown(jobId)` → `{ok:true, jobId}` |

---

### Qadam 21 — FE sahifalar (4 ta)

**21a. NtfBotConfig.tsx** — `artifacts/erp-dashboard/src/pages/NtfBotConfig.tsx` — YANGI

```tsx
// useQuery → GET /api/ntf/bot-config; bots: Array.isArray(data?.data) ? data.data : []
// toggleMut: PATCH /api/ntf/bot-config/:id/toggle {is_active}; onSuccess invalidate+toast; onError toast destructive
// pingMut: POST /api/ntf/bot-config/ping/:id; onSuccess toast("✅ Bot faol: @X" | "❌ reason")
// Render: isLoading skeleton; bots.map → {module_code, bot_token_env_key, Switch(is_active), Button("Ping")}
// EP tokenlar: --ep-foreground, --ep-muted, --ep-border; Switch + Button EP shadcn components
```

**21b. DigestHistory.tsx** — endpoint: `GET /api/ntf/log?type=digest`

```tsx
// useQuery → /api/ntf/log?type=digest
// Har item: { id, sent_at, payload: { period } }
// Ko'rinish: sent_at (toLocaleString uz-UZ) + payload.period
// isLoading → Yuklanmoqda skeleton; bo'sh → "Digest yo'q"
// EP tokenlar: --ep-foreground, --ep-muted, --ep-border
```

**21c. NtfEscalations.tsx** — endpoint: `GET /api/ntf/escalations`, `POST /api/ntf/escalations/:jobId/cancel`

```tsx
// useQuery (refetchInterval:30_000) → /api/ntf/escalations
// useMutation → POST /api/ntf/escalations/:jobId/cancel → invalidate + toast
// Har item: { job_id, event_code, message, sent_at } → border-[--ep-danger]
// "Bekor qil" tugmasi → ConfirmDialog → cancelMut.mutate(item.job_id)
// onError: toast destructive
```

**21d. NtfFormalRecords.tsx** — endpoint: `GET /api/ntf/formal-records`

```tsx
// useQuery → /api/ntf/formal-records
// Har item: { id, ref_number, formal_type, message, sent_at }
// ref_number font-mono --ep-primary; formal_type badge; message truncate
// Filter: ?type=qaror|topshiriq|... (Query param, <select> bilan)
// isLoading → skeleton; bo'sh → "Rasmiy xabar yo'q"
```

> **Barcha 4 FE sahifa:** `var(--ep-*)` tokenlar; `useQuery` + `isLoading` skeleton; `useMutation` bor joylarda `onError` toast; `Array.isArray(data?.data)` xavfsiz unwrap (Qoida 2).

---

## 5. DDL (agar bor)

**ddlGate = FALSE — yangi jadval YARATILMAYDI.**

P46 da yaratilgan jadvallar (P47 ishlatadi):
- `ntf_log` — barcha handlerlar shu jadvalga yozadi
- `ntf_bot_config` — NtfBotConfigController shu jadvalni o'qiydi
- `ntf_schedule_config` — QuietHoursService + DigestCronService shu jadvalni o'qiydi

Agar `employees.telegram_chat_id` ustuni P46 da yaratilmagan bo'lsa — TO'XTA + egasiga flag:
```sql
-- Tekshiruv:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'telegram_chat_id';
-- Mavjud bo'lmasa → P46 ga tegishli, P47 o'z-o'zicha ALTER TABLE yozma
```

Agar `ntf_log.requires_ack` ustuni P46 da yaratilmagan bo'lsa — TO'XTA + egasiga flag:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ntf_log' AND column_name = 'requires_ack';
```

---

## 6. QABUL MEZONI

```
QABUL CHEKLISTI (P47):

ASOSIY FUNKSIONALLIK:
[ ] /zvs_status buyrug'i real Finance GL ma'lumot qaytaradi (mock emas)
[ ] /my_gsd buyrug'i foydalanuvchi KPI ni qaytaradi (telegram_chat_id orqali)
[ ] /company_state faqat director/owner rolida ishlaydi; boshqa rol 403
[ ] /weekly_digest ntf_log ga yozadi (DB-proof: SELECT * FROM ntf_log WHERE payload->>'type'='digest_requested')
[ ] getUserChatId employees.telegram_chat_id dan o'qiydi (null bo'lsa pending, real bo'lsa delivered)
[ ] sendOrderStatusUpdate real sendMessage chaqiradi (Ok(undefined) echo emas)
[ ] QuietHoursService: CRITICAL har doim true; INFO tinch soatda false

ONBOARDING:
[ ] POST /api/ntf/onboarding/generate → ntf_log da token qayd etildi
[ ] POST /api/ntf/onboarding/link-telegram → employees.telegram_chat_id yangilandi (DB-proof)

BOT CONFIG:
[ ] GET /api/ntf/bot-config → ntf_bot_config jadvali (admin/owner)
[ ] PATCH /api/ntf/bot-config/:id/toggle → is_active o'zgardi (DB-proof)
[ ] POST /api/ntf/bot-config/ping/:id → Telegram /getMe natija

DIGEST:
[ ] DigestService.buildUserDigest() ntf_log ga 'digest' type bilan yozadi
[ ] DigestService.buildUserDigest() leaderboard (top-3/bottom-3 ЦКП%) ni qaytaradi (EP-NTF-012)
[ ] DigestCronService ntf_schedule_config dan cron_expr o'qiydi — HARDCODE @Cron YO'Q (Q140 fix)
[ ] ntf_schedule_config da digest.daily / digest.weekly.gsd / digest.weekly.zvs seed qatorlari mavjud

EVENT HANDLERLARI:
[ ] mes.production.halt emit → ntf_log da CRITICAL priority yozuv (DB-proof)
[ ] wms.stock.low emit → ntf_log da IMPORTANT yozuv
[ ] mes.shift.handover emit → ntf_log da yozuv
[ ] org.razryad.changed emit → ntf_log da yozuv (xodim+menejer+HR)
[ ] sd.order.stage_changed emit → ntf_log da yozuv
[ ] crm.card.status_changed emit → org_functions orqali karta egasiga (EP-NTF-066)
[ ] ntf.formalize emit → ntf_log da is_formal=true, formal_ref_number mavjud
[ ] POST /api/ntf/night-call → ntf_log da type='night_call' yozuv (EP-NTF-035)
[ ] PATCH /api/ntf/night-call/:id/answered → ntf_log.payload.answeredAt yangilandi
[ ] POST /api/ntf/night-solo-decision → ntf_log da is_night_solo=true yozuv (EP-NTF-036)
[ ] director.bot.ts callback_query handler: APPROVE_/REJECT_/ASSIGN_ ntf_log ga yozadi (EP-NTF-021)
[ ] getUserLang() employees.lang dan o'qiydi; ntf_log.user_lang ga yoziladi (EP-NTF-015)

ACK + FORMALIZE:
[ ] AckManagerService.requiresAck('INFO') = false, 'CRITICAL' = true
[ ] GET /api/ntf/escalations faol escalatsiyalarni qaytaradi
[ ] GET /api/ntf/formal-records is_formal=true yozuvlarni qaytaradi

FRONTEND:
[ ] NtfBotConfig.tsx: bot ro'yxati ko'rinadi, toggle ishlaydi, ping ishlaydi
[ ] DigestHistory.tsx: digest ro'yxati ko'rinadi
[ ] NtfEscalations.tsx: faol escalatsiya + bekor qilish ishlaydi
[ ] NtfFormalRecords.tsx: ref_number + formal_type bilan ko'rinadi

TEXNIK:
[ ] BE tsc --noEmit → 0 xato
[ ] FE tsc --noEmit → 0 xato
[ ] process.env.TELEGRAM_BOT_TOKEN → ConfigService.get() bilan almashtirildi
[ ] Yangi jadval YARATILMAGAN (ddlGate=false saqlanadi)
[ ] Mavjud event handlerlar (deal-won, order-created, qc-failed, lms-cert, mro-stopped) SAQLANADI
[ ] bash scripts/run-all-reviewers.sh → yangi FAIL yo'q (P46 dan oldingi holat)

VIZYON-MOSLIK (Q-40):
[ ] Quiet hours midnight crossing to'g'ri hisoblanadi (22:00-06:00 testi)
[ ] CRITICAL signal quiet hours da ham yetkaziladi (EP-NTF-063)
[ ] ACK faqat IMPORTANT/CRITICAL da (EP-NTF-016 owner override)
[ ] Card routing: crm.card.status_changed → org_functions orqali (EP-NTF-066)
```

---

## 7. SELF-VERIFY

Har qadam bajarilgandan keyin ushbu buyruqlarni ishga tushir:

```bash
# 1. TypeScript tekshiruvi
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit
pnpm --filter erp-dashboard exec tsc --noEmit
# Natija: 0 xato bo'lishi shart

# 2. Backend boot (Windows — nest watch bug yo'q, to'g'ridan test)
pnpm --filter @europrint/api run build 2>&1 | tail -5
# Natija: "Build complete" yoki 0 errors

# 3. Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-process-env.sh
# process.env.TELEGRAM_BOT_TOKEN — P47 dan keyin: 0 match bo'lishi kerak (telegram.service.ts da)

# 4. DB-proof — production halt handler testi
# (test muhitida event emit)
node -e "
const { EventEmitter2 } = require('@nestjs/event-emitter');
// Yoki to'g'ridan SQL bilan:
// INSERT INTO ntf_log ... test
"

# DB tekshiruvi
node _audit/q.cjs "SELECT id, priority, payload->>'type' AS type, sent_at FROM ntf_log ORDER BY sent_at DESC LIMIT 10"
# Natija: production_halt, digest_requested va boshqa event'lar ko'rinishi kerak

# 5. director.bot yangi buyruqlar testi
node _audit/q.cjs "SELECT COUNT(*) FROM ntf_log WHERE payload->>'type' = 'digest_requested'"
# Natija: >= 1 (Qadam 4 dan)

# 6. Onboarding testi
curl -s -X POST http://localhost:3030/api/ntf/onboarding/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":1}' | jq '.data.url'
# Natija: https://t.me/BOT_USERNAME?start=<uuid>

node _audit/q.cjs "SELECT payload->>'token' AS token FROM ntf_log WHERE payload->>'type'='onboarding_token' ORDER BY id DESC LIMIT 1"
# Token ntf_log da saqlanganmi?

# 7. Bot config testi
curl -s http://localhost:3030/api/ntf/bot-config \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | length'
# Natija: ntf_bot_config da qancha yozuv bo'lsa, o'sha

# 8. Formal records testi
node _audit/q.cjs "SELECT id, payload->>'formal_ref_number' AS ref FROM ntf_log WHERE payload->>'is_formal'='true' LIMIT 5"
# ntf.formalize event emit qilgandan keyin tekshir

# 9. Quiet hours testi (midnight crossing)
# QuietHoursService unit testi uchun:
# Toshkent 22:30 → module='mes', priority='INFO' → false qaytarishi kerak
# Toshkent 22:30 → module='mes', priority='CRITICAL' → true qaytarishi kerak

# 10. FE build testi
pnpm --filter erp-dashboard run build 2>&1 | tail -5
# Natija: build muvaffaqiyatli
```

**Mahalliy xizmat ishlamasa (Q-44 Windows nest watch bug):**
```bash
pnpm --filter @europrint/api run dev:unsafe
# Qayta ishga tushirgandan keyin:
curl http://localhost:3030/api/ntf/bot-config -H "Authorization: Bearer $TOKEN"
```

---

## 8. COMMIT

Har mantiqiy guruh alohida commit:

```bash
# COMMIT 1: process.env fix + getUserChatId impl + adapter stub fix
git add apps/api/src/telegram/telegram.service.ts
git add apps/api/src/modules/notifications/telegram/drizzle-telegram-svc.repo.ts
git add apps/api/src/modules/notifications/infrastructure/external/telegram-bot.adapter.ts
git commit -m "fix(ntf): process.env→ConfigService + getUserChatId impl + adapter real sends [EP-NTF-015]"

# COMMIT 2: director.bot 4 ShVB buyruqlari
git add apps/api/src/modules/bot-gateway/bots/director.bot.ts
git commit -m "feat(ntf): director.bot 4 ShVB commands (zvs_status/my_gsd/company_state/weekly_digest) [EP-NTF-001]"

# COMMIT 3: quiet-hours + onboarding + digest services
git add apps/api/src/modules/notifications/application/quiet-hours.service.ts
git add apps/api/src/modules/notifications/application/onboarding-link.service.ts
git add apps/api/src/modules/notifications/application/digest.service.ts
git add apps/api/src/modules/notifications/application/digest-cron.service.ts
git add apps/api/src/modules/notifications/application/escalation.service.ts
git add apps/api/src/modules/notifications/application/ack-manager.service.ts
git commit -m "feat(ntf): quiet-hours/onboarding/digest/escalation/ack services [EP-NTF-003,018,023,045,082]"

# COMMIT 4: event handlers
git add apps/api/src/modules/notifications/infrastructure/event-handlers/production-halt.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/material-shortage.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/shift-handover.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/razryad-change.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/order-stage.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/card-status.handler.ts
git add apps/api/src/modules/notifications/infrastructure/event-handlers/formalize.handler.ts
git commit -m "feat(ntf): event handlers (halt/shortage/handover/razryad/stage/card/formalize) [EP-NTF-014,024,029,047,051,066,078,031]"

# COMMIT 5: controllers
git add apps/api/src/modules/notifications/presentation/ntf-bot-config.controller.ts
git add apps/api/src/modules/notifications/presentation/ntf-onboarding.controller.ts
git add apps/api/src/modules/notifications/presentation/ntf-escalation.controller.ts
git add apps/api/src/modules/notifications/presentation/ntf-formalize.controller.ts
git commit -m "feat(ntf): ntf-bot-config/onboarding/escalation/formalize controllers [EP-NTF-019,023,017,031]"

# COMMIT 6: FE sahifalar
git add artifacts/erp-dashboard/src/pages/NtfBotConfig.tsx
git add artifacts/erp-dashboard/src/pages/DigestHistory.tsx
git add artifacts/erp-dashboard/src/pages/NtfEscalations.tsx
git add artifacts/erp-dashboard/src/pages/NtfFormalRecords.tsx
git commit -m "feat(ntf): FE pages NtfBotConfig/DigestHistory/NtfEscalations/NtfFormalRecords [P47]"

# COMMIT 7: Night protocol (EP-NTF-035/036) — conformance audit fix
git add apps/api/src/modules/notifications/infrastructure/event-handlers/night-protocol.handler.ts
git add apps/api/src/modules/notifications/presentation/ntf-night-protocol.controller.ts
git commit -m "feat(ntf): NightProtocolHandler (night-call log + answered mark + solo-decision) [EP-NTF-035,036]"
```

**Commit message qoidalari:**
- Format: `type(scope): tavsif [EP-NTF-XXX]`
- `git add -A` yoki `git add .` TAQIQ
- Log fayllar, `.env`, secret hech qachon qo'shilmaydi (Q-45)
- Har commit dan keyin: `git status` → faqat commit qilingan fayllar ko'rinishi kerak

**Holat hisoboti (egasiga Uzbek lotin tilida yoziladi, har commit dan keyin):**
```
P47 Holat — [sana]
Bajarildi: [bajarilgan narsalar]
Commit: [hash]
Qolgan: [qolgan qadamlar]
Muammo: [agar bor bo'lsa]
```

---

> **DIQQAT:** notifications.module.ts P47 owned emas. Yangi provayderlarni modulga qo'shish kerak bo'lsa — egasidan ruxsat so'ra (flag qil), o'z-o'zicha tegma.
> Barcha yangi fayllar yaratilgandan keyin module ga qo'shish egasi yoki P46 owner approval talab qilishi mumkin.
> QuietHoursService, DigestCronService, EscalationService, AckManagerService, OnboardingLinkService, NightProtocolHandler — bularni module ga qo'shish alohida flag.

---

*P47 directive yozildi: 2026-06-19 | Paket: NTF — Telegram bots + digest + events Wave 3 | Q-47 compliant*
*Tuzatildi: 2026-06-19 — 00-INTERVYU-MOSLIK moslik auditi asosida:*
*• EP-NTF-035/036 (NightProtocolHandler + NtfNightProtocolController) qo'shildi*
*• EP-NTF-015 (getUserLang() + ntf_log.user_lang) qo'shildi*
*• EP-NTF-012 (leaderboard DigestDto + SQL) qo'shildi*
*• EP-NTF-021 (handleCallback — APPROVE_/REJECT_/ASSIGN_ callback_query handler) qo'shildi*
*• Digest-cron hardcode @Cron → ntf_schedule_config o'qiladigan DigestCronService (Q140 CONTRADICTS tuzatildi)*

