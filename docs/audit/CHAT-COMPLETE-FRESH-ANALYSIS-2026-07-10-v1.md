# CHAT / XABARLASHUV MODULI — TO'LIQ YANGI CHUQUR AUDIT (v1)

> Sana: 2026-07-11 · Rejim: **READ-ONLY** (hech qanday kod/schema/DB o'zgartirilmagan) · Metodologiya namunasi: `SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md` + `NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md` (faqat FORMAT uchun; chat faktlari nol-ishonch bilan qaytadan chiqarildi).
> Maqsad (egasi qo'ygan me'yor): ichki ERP chat **haqiqiy messenger** (Telegram/WhatsApp darajasi) kabi ishlashi — real-time yetkazish, ishonchli saqlash, xabar yo'qolmasligi, zaif ulanishda ham javobgar, ishonchli o'qildi/yetkazildi holati.
> Har bir da'vo `fayl:satr` yoki jonli DB so'rovi bilan tasdiqlangan (Q-40). Server jonli-HTTP tekshiruvi qilinmadi (build fazasi); WS-qo'l siqish (handshake) statik kod bilan tasdiqlandi, jonli emas — bu aniq belgilangan.

---

## 0. ENG KRITIK TOPILMA (bittasi)

**Chat real-time'i "poor-connection"da xabar YO'QOTADI va, ehtimol, hozir umuman autentifikatsiyadan o'tolmaydi.**

Ikki bog'liq nuqson bir vaqtda mavjud:

1. **WS autentifikatsiya kontrakt-drifti (P0, kod-tasdiqli, jonli-tasdiqlanmagan).** Frontend chat soketi `io('/chat', { withCredentials:true, ... })` — **token UMUMAN uzatmaydi**, faqat httpOnly cookie'ga tayanadi (`hooks/chat/ChatSocketProvider.tsx:32-39`, izoh `:26-27`). Backend gateway esa tokenni **faqat** `handshake.auth.token` yoki `Authorization` sarlavhasidan oladi va **cookie'ni umuman o'qimaydi** (`apps/api/src/modules/chat/chat.gateway.ts:73-75`); token yo'q bo'lsa — `client.disconnect()` (`:77-80`). Taqqoslash uchun ishlaydigan sibling soket-klient tokenni ochiq uzatadi: `hooks/use-kanban-realtime.ts:48` → `auth: { token }`. REST `JwtAuthGuard` cookie'ni o'qiydi (`common/guards/jwt-auth.guard.ts:48`), lekin chat gateway o'qimaydi. Natija: chat WS qo'l siqishi tokensiz keladi → rad etiladi → **real-time chat ishlamaydi** (yagona soket-klient shu nuqsonga uchragan).

2. **Ulanish yo'qolganda xabar yo'qolishi (P0).** Hatto autentifikatsiya tuzatilsa ham: (a) soket 3 marta/5s dan keyin butunlay taslim bo'ladi va `disconnect()` chaqiradi (`ChatSocketProvider.tsx:37-39,56-59`); (b) qayta ulanishda faqat `get_rooms` yuboriladi — **o'tkazib yuborilgan xabarlar qayta olinmaydi** (`:43-45`), aktiv xonaning xabarlari ham yangilanmaydi; (c) **optimistik yuborish yo'q** — xabar faqat server `new_message` qaytargandan keyin ekранda paydo bo'ladi (`:116`), "yuborilmoqda/yuborildi/xato" holati yo'q; (d) offline-navbat faqat soket `null` bo'lgan holni qamraydi, uzilgan (disconnected) soketni emas (`hooks/chat/useChatSocket.ts:48-52`).

Telegram/WhatsApp me'yori "xabar yo'qolmaydi + zaif ulanishda javobgar" bevosita buziladi. Bu ikki nuqson §10 dagi eng yuqori ustuvorlik (P0) zanjirining boshi.

---

## 1. TO'LIQ YUZA INVENTARIZATSIYASI (yangi)

### Jonli DB holati (kompaniya bugun RESET qilingan)
`node _audit/q.cjs` bilan tasdiqlandi (2026-07-11): `users`=1 (admin). Barcha chat jadvallari **bo'sh**:

| Jadval | Satrlar |
|---|---|
| chat_rooms / chat_members / chat_messages | 0 / 0 / 0 |
| chat_reactions / chat_polls / chat_poll_votes | 0 / 0 / 0 |
| chat_user_presence / chat_starred_messages | 0 / 0 |
| chat_join_requests / chat_message_tasks / chat_push_subscriptions | 0 / 0 / 0 |
| chat_custom_emoji / chat_emoji_packs | 0 / **1** (seed) |
| chat_video_calls / task_chat_messages / social_messages / support_messages | 0 / 0 / 0 / 0 |

→ Xona/ishtirokchi/presence'ga bog'liq har qanday xususiyat hozir **DATA-gated**; §2 dagi holat kod bilan tasdiqlangan, jonli-ma'lumot bilan emas.

### Yuza №1 — To'liq sahifa `/chat` (KANONIK inson-chati)
- **Yo'l**: `App.tsx:99` — `location === "/chat" || startsWith("/chat/")` → `ChatPageFull` (`pages/chat/ChatPage.tsx`), `PrivateRoute` + `ChatSocketProvider` ichida, AppShell'siz to'liq ekran (`App.tsx:99-109`).
- **Sidebar**: `components/sidebar/constants.ts:667-678` — `chat` moduli, 4 nav-element ("Xabarlar / To'g'ridan-to'g'ri / Guruhlar / Kanallar") — **4 tasi ham bir xil `url:"chat"`** (DM/Guruh/Kanal farqi kosmetik, alohida route emas). Top-bar tugma: `AppShellModern.tsx:34-53`.
- **Nima qiladi**: `ChatLayout.tsx` orkestratori — soket callbacklar (`useChatSocket`), Zustand `useChatStore`, `SocketReconnectBanner`, sidebar, MessageArea, Thread/Info asides, modallar. Transport = **Socket.IO WS** (`/chat` namespace, `transports:['websocket','polling']`, `chat.gateway.ts:34-47`) + `/chat` REST. → real-time **polling emas, WS** (tasdiqlandi).
- **Reachability**: reachable, faqat `PrivateRoute` (har autentifikatsiyalangan foydalanuvchi; `use-role-menus.ts:108` har rolga `/chat` beradi).

### Yuza №2 — Suzuvchi ChatWidget
- `components/chat/ChatWidget.tsx` — pastki-o'ng suzuvchi launcher + unread badge; `App.tsx:125` da montaj qilingan, **`/chat*` dan tashqari har autentifikatsiyalangan sahifada** (to'liq-ekran shoxi widget'ni render qilmaydi).
- **Shared backend**: ChatPage bilan **bir xil** soket (`getSharedSocket`/`useChatSocket` modul-darajali singleton, `useChatSocket.ts:9,21-32`) va **bir xil** `useChatStore`. Silo emas — bitta soket, bitta store.

### Yuza №3 — ChatAdminPage (`/chat/admin`) — **ORPHAN (unreachable)**
- `pages/chat/ChatAdminPage.tsx` — xona moderatsiyasi, audit-log, a'zolarni o'chirish/rol o'zgartirish; `/api/chat/admin/*` REST'ni chaqiradi.
- **Regressiya TASDIQLANDI**: `"/chat/admin".startsWith("/chat/")` → `App.tsx:99` uni tutib **oddiy ChatPage'ni** render qiladi; `AppRouter.tsx:196-200` dagi maxsus route (admin/director-gated) **hech qachon ishga tushmaydi**. ChatAdminPage sidebar'da ham yo'q → **na URL, na nav orqali ochib bo'lmaydi**.
- ⚠️ Ajratish: **backend admin endpointlari TIRIK** (`chat-ext.controller.ts:131-203`, `admin/director` rol-gated) — faqat FE sahifasi yetib bo'lmaydigan.

### Yuza №4 — Kanban ichki chat (`pages/kanban/detail/ChatPanel.tsx`) — ALOHIDA SILO
- REST-only (WS yo'q, `useChatStore` yo'q, prop-driven). `GET/POST /api/kanban/cards/:id/chat` → `kanban-cards.controller.ts:269-287` → jadval **`kanban_card_comments`** (`drizzle-kanban-cards.repo.ts:189,200`). Fayl: `task_chat_message_files`.
- ⚠️ Prompt eslatgan `task_chat_messages` jadvali **mavjud emas** (grep=0; DB'da bo'sh yozuv sifatida bor lekin kanban chat uni ishlatmaydi). Kanban chat asosiy `chat_messages` bilan **hech narsa bo'lishmaydi**; o'z @mention→bildirishnoma fan-out'i bor (`drizzle-kanban-cards.repo.ts:202-215`).

### Yuza №5 — `hr-v2/chat` REST prefiks (legacy alias)
- `chat-advanced.controller.ts:38` va `chat-advanced-uploads.controller.ts:37` prefiksi `hr-v2/chat`, lekin **bir xil ChatModule** ichida, **bir xil ChatService/ChatGateway**ni chaqiradi — alohida "HR chat" mahsuloti EMAS, eski nomlash qoldig'i. FE'da `hr-v2/chat` chaqiruvi **umuman yo'q** (grep=0). `ChatAdvancedController` **ro'yxatdan o'tmagan → orphan** (§5).

### Alohida (inson-chatiga tegishli emas — chalkashmaslik uchun)
- `components/aisha/AishaChatPanel.tsx` — AI yordamchi (`/api/aisha/chat`), `/aisha` route, director-only.
- `components/crm/activity/WhatsAppForm.tsx` — CRM tashqi WhatsApp murojaati.

### Kanonik vs orphan xulosa
- **Kanonik inson-chati** = ChatPage (`/chat`) + ChatWidget + `apps/api/src/modules/chat/*` (WS gateway + `/chat` REST). Bitta backend, bitta data-model (`chat_*`).
- **Orphan/o'lik**: ChatAdvancedController (ro'yxatsiz), ChatAdminPage (yo'l soyalangan), `hr-v2/chat` (FE ishlatmaydi), `PushService.sendToUser` (0 chaqiruvchi), FCM/APNS dispatch (stub).

---

## 2. MESSENGER-PARITY XUSUSIYAT AUDITI (YADRO)

### 2.1 Real-time

| Jihat | Holat | Isbot |
|---|---|---|
| Transport | **WS (Socket.IO)** | `chat.gateway.ts:34-47` namespace `/chat`, `transports:['websocket','polling']` |
| Bitta xabar E2E | **EXISTS (persist→broadcast)** | pastda |
| Persist atomik/lossy? | **Persist AVVAL, keyin broadcast (yaxshi)** | `chat-gateway-helper.service.ts:77-86` |
| Reconnect catch-up | **ABSENT (lossy)** | `ChatSocketProvider.tsx:43-45` |

**Bitta xabar E2E izi**: FE `useChatSocket.sendMessage` → `emit('message:send')` (`useChatSocket.ts:45-53`) → gateway `handleSendMessage` (`chat.gateway.ts:186-200`) → `helper.handleSendMessage` (`chat-gateway-helper.service.ts:68-100`) → `chatService.sendMessage` → `msgRepo.insertMessage` (**DB INSERT**, `chat-message-base.repository.ts:76-97`) → `incrementUnreadForOthers` → natija qurildi → `server.to('room:'+roomId).emit('new_message', message)` (`:86`) → har a'zoga `unread_count`/`room_updated` (`:88-94`) → Telegram xabar (`:96`). FE `new_message` handleri store'ga qo'shadi (`ChatSocketProvider.tsx:116-154`).
→ **Persist-then-broadcast** — DB'ga yozilmaguncha broadcast yo'q; server-tomonda yo'qotish yo'q. **Lekin**: sender'ga alohida ACK yo'q (u xonada bo'lgani uchun `new_message` echo orqali ko'radi) → optimistik UI yo'q, sekin tarmoqda kechikish ko'rinadi.

**Reconnect catch-up**: qayta ulanishda faqat `get_rooms` (`ChatSocketProvider.tsx:45`). Aktiv xona xabarlari yoki uzilish davomida kelgan xabarlar **avtomatik olinmaydi** → foydalanuvchi xonani qo'lda qayta ochmaguncha ular ko'rinmaydi. **Lossy view** (P0). `reconnectionAttempts:3, reconnectionDelay:5000` (`:37-39`) → ~15s dan keyin butunlay taslim + `disconnect()` (`:56-59`) — poor-connection'ga qarshi.

### 2.2 Saqlash (Persistence)

- **Persisted-before-ack**: HA — INSERT broadcastdan avval (`chat-gateway-helper.service.ts:83-86`). Ack-before-persist poygasi yo'q.
- **Tartib kafolati**: `chat_messages.id` = **integer serial** (DB-proof: `information_schema` id=integer), fetch `created_at DESC` keyin `.reverse()` (`chat-message.service.ts:44-46`). Bir vaqtli yuborishlar serial-id + insert-vaqti bilan tartiblanadi — barqaror.
- **client_msg_id**: DB'da `client_msg_id text` ustuni **bor**, lekin `insertMessage` uni **hech qachon yozmaydi** (`chat-message-base.repository.ts:76-97`) → idempotentlik/dedup kaliti yo'q (optimistik yuborish qo'shilsa dublikat xavfi).
- **Offline-navbat**: `pendingQueue` faqat `socket===null` (montajgacha) holni qamraydi (`useChatSocket.ts:48-52`); uzilgan soketda emit socket.io ichki buferiga tushadi, ammo 3-urinishdan keyin `disconnect()` bo'lsa **yo'qoladi**. Ishonchli offline-navbat YO'Q.

### 2.3 Holat (Status)

| Xususiyat | Holat | Isbot |
|---|---|---|
| Yetkazildi (delivered) per-message | **ABSENT** | hech qayerda per-message delivered yo'q |
| O'qildi (read) per-message | **PARTIAL — faqat xona darajasi** | `mark:read` butun xonani belgilaydi (`chat-gateway-helper.service.ts:102-112`); tik'lar `readByOthers` (xona-flag)dan (`MessageBubble.tsx:384-386`, `MessageArea.tsx:151`) |
| Typing indikator | **EXISTS (real, efemer)** | `handleTyping` → `user_typing` broadcast (`chat-gateway-helper.service.ts:136-153`), FE 4s timeout (`ChatSocketProvider.tsx:234-246`) |
| Online/presence | **PARTIAL** | in-memory `userSockets` + `chat_user_presence` ONLINE/OFFLINE persist (`chat.gateway.ts:113,134`); `last_seen_at` saqlanadi |

⚠️ Presence stale-riski: server qulasa (Windows nest-watch, Q-44) OFFLINE yozilmaydi → DB'da **stale ONLINE** qoladi (`findOnlineUsers` `status='ONLINE'` bilan, `chat-presence.repository.ts:65-73`); heartbeat/TTL yo'q. "last seen X oldin" UI ko'rsatilmaydi.

### 2.4 Xususiyatlar

| Xususiyat | Holat | Isbot / muammo |
|---|---|---|
| Edit (+tarix markeri) | **PARTIAL — is_edited HECH QACHON o'rnatilmaydi** | `updateMessageContent` faqat `{content}` set qiladi (`chat-message-base.repository.ts:131-150`); `is_edited` faqat o'qiladi (`chat-message.service.ts:29`). "Tahrirlangan" belgisi hech qachon chiqmaydi — **yashil-yolg'on** (§3) |
| Delete | **soft, faqat "hamma uchun"** | `softDeleteMessage` `isDeleted=true`, faqat sender (`:152-166`). "Men uchun" yo'q, hard-delete yo'q |
| Reactions | **EXISTS** | `toggleReaction` WS+REST, `chat_reactions` (`chat-message-ext.service.ts:162-183`) |
| Forwarding (atribut) | **EXISTS (faqat REST)** | `forwardMessage` + `forward_from_id`/`forwardFrom` (`chat-message-ext.service.ts:20-72`). WS gateway'da forward handleri **yo'q** → FE `hr-v2/chat` advanced-uploads REST orqali |
| Pinning | **EXISTS (amalda 1 ta pin)** | `findPinnedMessage ... LIMIT 1` (`chat-message-base.repository.ts:196-218`) |
| Reply/threading | **EXISTS** | `reply_to_id`, `thread_root_id`, `thread_count`, ThreadPanel (`chat-message-ext.service.ts:74-126`) |
| @mentions | **BROKEN — silent drop** | MentionInput yig'adi → `useChatSocket.sendMessage` `mentionedUserIds` uzatadi (`useChatSocket.ts:45-52`) → gateway data-tipi uni **o'z ichiga olmaydi** (`chat.gateway.ts:189`) → `insertMessage` `mentioned_user_ids`ni **yozmaydi**. Mention→bildirishnoma trigger yo'q (§3) |
| Search | **EXISTS lekin ILIKE-scan** | `content ILIKE '%q%'` (`chat-notification.repository.ts:123`), FTS indeks yo'q → miqyosda sekin; `limit 30` |

### 2.5 Media

- **Yuklash**: presigned-uslub URL `UploadService.requestUrl` (`upload.service.ts:35-53`); **hajm limiti DTO'da** (`max 100*1024*1024`, `chat-uploads.controller.ts:46-47`). Saqlash = **lokal disk** (`storage.controller.ts`, `UPLOADS_DIR`, kengaytma allowlist `ALLOWED_UPLOAD_EXT`, path-traversal himoyasi `:139-141`).
- ⚠️ **Realtime event nomi mos emas**: `completeUpload` `sendMessage`ni chaqirib **`message:new`** emit qiladi (`chat-uploads.controller.ts:165`), lekin FE faqat **`new_message`**ni tinglaydi (`ChatSocketProvider.tsx:116`) → **yuklangan fayl real-time'da boshqalarda ko'rinmaydi** (refresh'gacha). Dead event (§3).
- **Thumbnails**: haqiqiy generatsiya **yo'q** — faqat `?thumb=1` URL konvensiyasi (`upload.service.ts:50`).
- **Voice**: EXISTS (VoiceRecorder/VoiceMessagePlayer).
- ⚠️ **Attachment access control**: fayl yetkazish global `JwtAuthGuard` bilan (anonim=401), lekin **xona-a'zoligiga bog'lanmagan** — image/media tiplari har autentifikatsiyalangan foydalanuvchiga OCHIQ (`storage.controller.ts:267-296`, hujjatlar rol-gated `:281-288`). Ya'ni boshqa xona rasmi URL'ini bilgan/topgan har qanday logindagi user ko'ra oladi (16-baytli random qiyinlashtiradi, lekin membership tekshiruvi yo'q).

### 2.6 Guruhlar

- **1:1 DM**: EXISTS — `getOrCreateDirectRoom` 2-a'zoli dedup (`chat-room.repository.ts:35-56`).
- **Guruh**: EXISTS — `createGroupRoom` ADMIN/MEMBER rollar (`chat-room.service.ts:65-77`); a'zo qo'shish EXISTS; a'zo o'chirish admin ext controller.
- **Broadcast/kanal**: MINIMAL — `type='CHANNEL'` + `is_read_only` flag bor (`createGroupRoom` type param), lekin guruhdan farq faqat type maydonida; sidebar "Kanallar" bir xil `/chat`ga ishora (kosmetik).
- **Dept/rol auto-guruh**: EXISTS — ulanishda `getOrCreateDepartmentRooms` (`chat.gateway.ts:100`) foydalanuvchi bo'limlari uchun CONTEXT/department xonalar yaratadi. ⚠️ Reset tufayli `org_departments`=0 → hozir auto dept-xona yaratilmaydi (DATA-gated).

### 2.7 Bildirishnomalar

- **In-app yangi xabar**: `unread_count` WS event + badge; hosila (derived) bildirishnoma ro'yxati `/chat/notifications` (`chat-ext.controller.ts:45-50`). **Markaziy notifications-jadvaliga yozuv YO'Q** — `findUnreadForUser` jonli SELECT (`chat-notification.repository.ts:22-44`).
- ⚠️ **Push (web/FCM/APNS) O'LIK**: subscribe/unsubscribe saqlaydi (`chat-uploads.controller.ts:87-115`), `sendToUser` + web-push implementatsiya bor (`push.service.ts:71-155`), lekin `sendToUser` **0 chaqiruvchi** (grep) → yangi xabarda push **hech qachon yuborilmaydi**. FCM/APNS = **stub** (log + `return true`, haqiqiy yuborish yo'q, `push.service.ts:136-155`) — yashil-yolg'on. WEB_PUSH VAPID bo'lsa real, lekin chaqirilmaydi.
- **Telegram bridge**: EXISTS — `sendTelegramNotification` → `notificationBot.handleErpEvent({event:'chat.new_message'})` (`chat-gateway-helper.service.ts:198-215`; builder `notification-bot-event-builders.ts:88`). **Yagona ishlaydigan offline kanal.**
- ⚠️ **Mute/DND hurmat qilinmaydi**: `is_muted`/`muted_until` bor (`toggleMemberMute`), lekin Telegram-xabar yo'li muted a'zolarni **filtрlamaydi** (`chat-gateway-helper.service.ts:204-211`); unread ham muted xonani sanaydi.
- **Unread badge aniqligi**: display **last_read_at hosilasidan** (`chat-room.repository.ts:129,216-226`) — satrlarga mos, aniq. `unread_count` **ustuni yoziladi lekin display uchun o'qilmaydi** (ortiqcha yozuv, §3).

### 2.8 Xavfsizlik / RBAC

- **Non-participant o'qish**: BLOKLANGAN — har service metodi `checkMembership`; `getMessages` a'zo bo'lmasa `ForbiddenException` (`chat-message.service.ts:41-43`). Qator-skoping to'g'ri.
- **Kontent shifri**: **PLAINTEXT** — `chat_messages.content text`, at-rest shifr yo'q (fakt).
- **Attachment access**: autentifikatsiyalangan, lekin **xona-skopingsiz** (§2.5).
- **RBAC**: barcha chat controllerlar `JwtAuthGuard + RolesGuard`, barcha rollar; `admin/*` faqat `admin/director` (`chat-ext.controller.ts:134,145,...`). ⚠️ `updateRoom` (rename/avatar/description) faqat **a'zolikni** tekshiradi, admin-only emas (`chat.controller.ts:227-247`) — har a'zo xona nomini o'zgartira oladi.

---

## 3. MA'LUMOT YAXLITLIGI (green-lie tekshiruvi)

| # | Nuqson | Isbot | Ta'sir |
|---|---|---|---|
| D1 | **Edit `is_edited`ni o'rnatmaydi** | `chat-message-base.repository.ts:131-150` faqat `{content}` | Edit "muvaffaqiyatli" (200) lekin "tahrirlangan" belgisi hech qachon chiqmaydi — yashil-yolg'on |
| D2 | **@mention `mentioned_user_ids` tushib qoladi** | FE uzatadi (`useChatSocket.ts:52`) ↔ gateway/insert yozmaydi (`chat.gateway.ts:189`, `chat-message-base.repository.ts:84-93`) | Mention saqlanmaydi, mention→bildirishnoma yo'q |
| D3 | **`client_msg_id` yozilmaydi** | ustun bor, INSERT yozmaydi | Idempotentlik/dedup kaliti yo'q |
| D4 | **Fayl yuklash realtime event nomi mos emas** | REST `message:new` (`chat-uploads.controller.ts:165`) ↔ FE `new_message` (`ChatSocketProvider.tsx:116`) | Yuklangan fayl boshqalarda real-time ko'rinmaydi |
| D5 | **REST send broadcast qilmaydi** | `POST /chat/rooms/:id/messages` (`chat.controller.ts:109-122`) gateway.emit chaqirmaydi | Agar REST ishlatilsa WS klientlar o'tkazib yuboradi (FE WS ishlatadi → latent) |
| D6 | **`unread_count` ustuni ortiqcha** | `incrementUnreadForOthers` yozadi (`chat-message-base.repository.ts:179-190`), display hosiladan o'qiydi | Bekor yozuv; drift potensiali (display buzilmaydi, chunki timestamp manba) |
| D7 | **Drizzle schema ↔ DB tip drifti** | `message_id`/`assigned_to` DB=int, schema=varchar → repo raw SQL bilan aylanib o'tadi (`chat-notification.repository.ts:134,193`) | Mo'rt; kelajakdagi refactor xavfi |

Har "success" DB-proof: yuqoridagi INSERT/UPDATE'lar `.returning()` bilan haqiqiy yozuv qaytaradi (fake-create emas) — asosiy yuborish/reaction/pin real. Muammo **belgi maydonlari** (is_edited, mentioned_user_ids, client_msg_id) va **event/nom** darajasida.

**Orphaned attachments**: `requestUrl` URL beradi, `completeUpload` xabar yaratadi; agar client yuklab keyin `completeUpload` chaqirmasa — diskda egasiz fayl qoladi (GC yo'q). Reset holatida 0.

---

## 4. RBAC TO'G'RILIGI

| Chat turi | Mo'ljallangan siyosat | Haqiqiy | Baho |
|---|---|---|---|
| Xona o'qish/yozish | Faqat a'zo | `checkMembership` har metodda (`chat-message.service.ts`, `chat-room.service.ts:87-90`) | ✅ To'g'ri skoping |
| DM | 2 a'zo | `findDirectRoom` COUNT=2 dedup (`chat-room.repository.ts:50`) | ✅ |
| Admin panel (arxiv/o'chirish/rol) | admin/director | `chat-ext.controller.ts:134-203` `@Roles('admin','director')` | ✅ BE to'g'ri (FE sahifasi yetib bo'lmaydigan — §1/§5) |
| Xona tahriri (nom/avatar) | Admin bo'lishi kerak | Faqat a'zolik tekshiriladi (`chat.controller.ts:235`) | ⚠️ Unscoped (har a'zo o'zgartiradi) |
| Attachment yetkazish | Xona a'zosi | Faqat autentifikatsiya (image ochiq) | ⚠️ Xona-skopingsiz |
| WS join/send/typing | Faqat a'zo | `isRoomMember` (`chat-gateway-helper.service.ts:45,141`) | ✅ |

Data-gap tufayli inert: reset → 1 user, xonalar 0 → RBAC amalda sinovdan o'tmagan, lekin kod-darajada to'g'ri (yuqoridagi 2 ⚠️ dan tashqari).

---

## 5. ORPHAN SWEEP (100% ishonch)

| Element | Turi | Isbot | Status |
|---|---|---|---|
| `ChatAdvancedController` (`hr-v2/chat`) | BE controller | `chat.module.ts:47-53` da yo'q; grep `ChatAdvancedController` = faqat o'z ta'rifi | **ORPHAN** — 5 route o'lik (`chat-advanced.controller.ts:51,71,95,122,164`) |
| `PushService.sendToUser` + dispatch (`push.service.ts:71-155`) | BE metod | 0 chaqiruvchi (grep `apps/api/src`) | **O'LIK metod** |
| `sendFcm`/`sendApns` (`push.service.ts:136-155`) | BE stub | log+`return true` | **Stub (green-lie), erishilmas** |
| ChatAdminPage (`/chat/admin`) | FE sahifa | Yo'l `App.tsx:99` bilan soyalangan + sidebar'da yo'q | **Erishib bo'lmaydigan yuza** |
| `AppRouter.tsx` `/chat`, `/chat/admin` routelari | FE route | `App.tsx:99` avval tutadi | **O'lik route** |
| FE `components/chat/**` | — | Har biri kamida 1 importer (subagent to'liq graf) | **Orphan YO'Q** |

Xulosa: BE'da 1 ta to'liq orphan controller + 1 o'lik metod-zanjiri; FE'da 1 erishib bo'lmaydigan sahifa. FE komponentlar toza.

---

## 6. CROSS-MODULE INTEGRATSIYA

- **Telegram bot bridge** (qattiq bog'liqlik): `chat-gateway-helper.service.ts:96,198-215` → `NotificationBotService.handleErpEvent('chat.new_message')` (HR telegram-bots moduli, `chat.module.ts:30,34`). Event-kontrakt o'zgarsa chat offline-alert buziladi.
- **Bildirishnoma tizimi**: chat **markaziy notifications-jadvaliga yozmaydi**; hosila-o'qish (`chat-notification.repository.ts:22-44`). Push subscription saqlanadi, ishlatilmaydi (§2.7).
- **HR "hr-v2/chat"**: asosiy chatning **dublikat REST prefiksi** (bir xil ChatService), FE ishlatmaydi — alohida HR chat emas.
- **Kanban/CC ichki chat**: Kanban `kanban_card_comments` (alohida modul/jadval, `chat_messages` emas); o'z @mention→bildirishnoma fan-out'i. CC gateway alohida (`cc.gateway.ts`).
- **Eksport qilingan** `ChatService/ChatGateway/PushService/UploadService` (`chat.module.ts:66`) — tashqi consumerlar imzo o'zgarsa buziladi.
- **Bog'liqlik xaritasi**: Chat ichini o'zgartirsa buziladigan: FE (REST `/chat` + WS event nomlari `new_message/unread_count/room_updated/user_typing/message:*/reaction:updated/poll:updated`), HR Telegram event-kontrakt. **Xavfsiz (bog'liq emas)**: Kanban card-chat, Aisha AI, CRM WhatsApp, orphan ChatAdvancedController (o'chirsa 0 ta'sir).

---

## 7. DIZAYN / UI IZCHILLIK

- **Token tizimi**: chat to'liq-sahifasi **bespoke `--tg-*`** (Telegram-uslub) token to'plamini ishlatadi (`ChatPage.tsx:19`, `MessageArea.tsx:93-117`, `MentionInput.tsx:205,274`) — EP `--ep-*`/`--mod-*` EMAS. Qoida 21 (dizayn-token) chetlanishi, lekin **ataylab** messenger ko'rinishi uchun (WhatsApp-uslub SVG fon `MessageArea.tsx:107-113`). EP tokeni faqat chekkalarda: `SocketReconnectBanner.tsx:44`, `ChatAdminPage.tsx:92`.
- **Mavjud messenger-UX**: bubble + me/other alignment (`MessageArea.tsx:132`), sana separatori + avatar/ism guruhlash (`:83-89,133-135`), scroll-to-bottom (yaqin bo'lsa) + scroll tugma (`:64-80,174-186`), typing dots (`TypingIndicator.tsx`), tik'lar (`MessageBubble.tsx:384-386`), edited markeri (faqat UI — D1), pin/reactions/reply-preview, Enter-yuborish/Shift+Enter (`MentionInput.tsx:174-177`), biriktirish tugma.
- **Yetishmayotgan/zaif**: (a) **unread ajratuvchi** ("yangi xabarlar" chizig'i) yo'q — faqat sana separatori; (b) **emoji tugma ishlamaydi** — `onClick`/picker yo'q (`MentionInput.tsx:276-281`); (c) `SocketReconnectBanner` faqat to'liq-sahifada, widgetda emas (`ChatLayout.tsx:335`) → widget foydalanuvchisi uzilishni ko'rmaydi; (d) Kanban ChatPanel yengilroq (receipts/typing/reactions yo'q).

---

## 8. VIZYON SOLISHTIRUVI

Manba: `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` + `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md`. Master-planda **maxsus "Chat/Messaging" moduli bo'limi YO'Q** — chat faqat bog'liqlik sifatida.

| Vizyon element | Manba | Reallik | Klassifikatsiya |
|---|---|---|---|
| Yangi xabarda Telegram-alert | `chat-gateway-helper.service.ts:96-215` | Ishlaydi | **BUILT** |
| Web/FCM/APNS push chat eventida | `push.service.ts:71-155` | Subscription bor, dispatch chaqirilmaydi; FCM/APNS stub | **PARTIAL (o'lik)** |
| Orgsxema birligida Telegram-guruh-ID | CHAT-TARIXI:50 | Chat xonalari org-unit Telegram-guruhga bog'lanmagan | **MISSING** |
| Telegram bot to'liq + offline qoralama; CC→Kanban→kassir oqim | CHAT-TARIXI:75 | Bot alert bor; offline qoralama/merged oqim chat modulida yo'q | **PARTIAL** |
| AI yordamida hujjat/xabar yozish (CC) | CHAT-TARIXI:72 | Chat composer'da AI yordam yo'q | **MISSING** |
| **ERP chat = rasmiy audit-kanal, Telegram norasmiy** (Item #46) | MASTER-PLAN:4180-4185 | "Yo'q" — rasmiy-kanal/audit-flag dizayni yo'q | **MISSING** |
| Kengash qarorlari chat-poll orqali (tarixiy) | MASTER-PLAN:4248,4257 | Poll infra bor (`chat_polls`) | **BUILT (poll qismi)** |
| @mention saqlash + trigger | (implitsit messenger) | Tushib qoladi (D2) | **MISSING** |

---

## 9. MODERNIZATSIYA GAPS (§2 dan tashqari) — har biri MAVJUD chat yuzasiga ulanadi

1. **AI smart-reply / tez-javob** — yo'q. Ulanish: composer `MentionInput.tsx` ustiga taklif-chip qatori.
2. **Avto-tarjima (uz/ru/uz-cyr ko'p tilli xodimlar uchun)** — yo'q. Ulanish: `MessageBubble.tsx` ichida per-xabar "Tarjima" tugma (memory: Yandex-translate infra mavjud). YANGI sahifa emas.
3. **Thread/xona xulosalash (summarization)** — yo'q. Ulanish: `ThreadPanel.tsx` yoki xona-info panelida "Xulosa" tugma.
4. **Aqlli qidiruv (semantik)** — hozir ILIKE-scan (§2.4). Ulanish: mavjud `ChatSearchPanel.tsx`.

Barchasi mavjud chat komponentlariga prop/tugma sifatida ulanadi — alohida sahifa ochilmaydi (egasi qoidasi).

---

## 10. YAXLIT TAVSIYALAR (bog'liqlik-tartibli, min 30)

> Threshold/son qiymatlar (reconnect urinishlar, kechikish, typing timeout 4s, upload 100MB, search min 2, sahifa 50, preview 100) — bular egasi-savoli EMAS: `business_settings`ga default+CRUD bilan chiqadi (memory `feedback_threshold_values_always_crud`). Quyida faqat qurish-ishlari.

**P0 — Real-time ishonchlilik yadrosi (avval)**
1. **WS auth drift'ni tuzatish** — gateway cookie'dan `access_token`ni o'qisin (REST guard kabi) YOKI FE `auth:{token}` uzatsin (kanban-realtime kabi). Manba: §0/§2.1. P0. *Birga:* #2,#3.
2. **Reconnect siyosati** — cheksiz eksponensial backoff (`reconnectionAttempts:Infinity`) + `disconnect()` olib tashlash; qiymatlar → `business_settings`. Manba: §2.1. P0. *Birga:* #1,#3.
3. **Reconnect catch-up** — qayta ulanishda aktiv xona + `before` cursor bilan o'tkazilgan xabarlarni qayta olish (`get_messages`). Manba: §2.1. P0. *Birga:* #1,#2.
4. **Optimistik yuborish + client_msg_id** — FE pending-bubble ("yuborilmoqda"), `client_msg_id` yuborish/yozish/dedup, server echo bilan yarashtirish. Manba: §2.1/§2.2/D3. P0. *Birga:* #5.
5. **Ishonchli offline-navbat** — uzilgan (nafaqat null) soketda navbat + reconnectda flush + xato holati. Manba: §2.2. P0. *Birga:* #4.

**P1 — Xabar yaxlitligi va yashil-yolg'onlar**
6. **`is_edited` o'rnatish** — edit UPDATE'ga `isEdited:true, editedAt:NOW()` qo'shish. Manba: D1. P1.
7. **@mention saqlash + trigger** — gateway data-tipiga `mentionedUserIds`, insertga `mentioned_user_ids`, mention→bildirishnoma. Manba: D2. P1. *Birga:* #14.
8. **Fayl-upload event nomini tuzatish** — `message:new` → `new_message` (yoki FE ikkalasini tinglasin). Manba: D4. P1.
9. **REST send/upload broadcast qilsin** — `chat.controller.ts` send + completeUpload gateway.emit bilan xonaga yuborsin (yoki dual-path'ni WS-only qilish — §arxitektura qarori). Manba: D5. P1. *Birga:* #26.
10. **Delete siyosati** — "men uchun / hamma uchun" ajratish (soft-delete-scope). Manba: §2.4. P1. *(Siyosat qarori — pastda.)*
11. **Attachment xona-skoping** — `storage.controller` chat-fayllarida xona a'zoligini tekshirsin. Manba: §2.5/§2.8. P1.
12. **`updateRoom` admin-gate** — nom/avatar o'zgartirishni xona ADMIN roliga cheklash. Manba: §4. P1.
13. **Presence TTL/heartbeat** — stale-ONLINE oldini olish (last_seen + davriy tozalash), "last seen" UI. Manba: §2.3. P1.

**P1 — Bildirishnoma va yetib bo'lmaydigan yuzalar**
14. **Web-push wire** — `sendToUser`ni yangi-xabar/mention oqimiga ulash (mute/DND hurmat bilan). Manba: §2.7/§5. P1. *Birga:* #7,#15.
15. **FCM/APNS stubni to'ldirish yoki olib tashlash** — real yuborish yoki o'chirish (green-lie yo'q). Manba: §2.7/§5. P1.
16. **Mute/DND'ni Telegram+unread yo'lida hurmat qilish** — muted a'zolarni filtrlash. Manba: §2.7. P1.
17. **ChatAdminPage'ni erishimli qilish** — `App.tsx:99` `/chat/admin`ni maxsus tutsin (yoki ChatPage ichida admin-tab) + sidebarga admin/director uchun. Manba: §1/§5. P1.

**P2 — Orphan/tozalash, qidiruv, kanal, dizayn**
18. **ChatAdvancedController o'chirish** (orphan, 0 ta'sir). Manba: §5. P2.
19. **`hr-v2/chat` prefiksni `chat`ga birlashtirish** (legacy alias retire). Manba: §1/§6. P2. *(Arxitektura qarori.)*
20. **Search'ni FTS'ga o'tkazish** — `tsvector` + GIN indeks (ILIKE-scan o'rniga). Manba: §2.4. P2.
21. **`unread_count` ortiqcha yozuvni olib tashlash** yoki manba qilib bittasini tanlash. Manba: D6. P2.
22. **Drizzle schema ↔ DB tip drift** — `chat_messages`/`chat_message_tasks` tiplarni moslash (raw-SQL workaround'lardan qutulish). Manba: D7. P2.
23. **Kanal (CHANNEL) semantikasi** — read-only broadcast, obuna, guruhdan haqiqiy farq + sidebar/DM/Guruh/Kanal alohida ko'rinish. Manba: §2.6/§1. P2. *(Siyosat qarori.)*
24. **Unread ajratuvchi ("yangi xabarlar" chizig'i)** — MessageArea'ga. Manba: §7. P2.
25. **Emoji picker'ni ishga tushirish** (`MentionInput.tsx:276`). Manba: §7. P2.
26. **SocketReconnectBanner'ni widgetga ham** montaj qilish. Manba: §7. P2.
27. **Orphaned attachment GC** — `completeUpload`siz fayllarni tozalash. Manba: §3. P2.
28. **Per-message read receipts** — "seen by" (xona-daraja o'rniga per-message), Telegram-parity. Manba: §2.3. P2. *Birga:* #4.
29. **Dizayn: `--tg-*` tokenlarni EP-token registriga hujjatlashtirish** (Qoida-21 istisnosini rasmiylashtirish). Manba: §7. P2.

**P2 — Modernizatsiya (mavjud yuzaga ulangan)**
30. **AI smart-reply** composer'ga (§9.1). P2.
31. **Avto-tarjima** MessageBubble'ga (§9.2). P2.
32. **Thread/xona xulosalash** ThreadPanel'ga (§9.3). P2.

### Egasi-qarori kutayotgan (arxitektura/siyosat — son emas)
- **Delete siyosati**: "men uchun / hamma uchun / faqat sender / admin ham" — qaysi model (#10).
- **Rasmiy audit-kanal (Item #46)**: ERP chat immutable/audit-flagli rasmiy kanal bo'ladimi (retention/immutability dizayni) (#Vizyon).
- **Send arxitekturasi**: dual REST+WS saqlanadimi yoki WS-only (#9/#26).
- **Kanal vs guruh**: haqiqiy broadcast-kanal semantikasi kerakmi (#23).
- **`hr-v2/chat` prefiks**: retire qilinadimi (#19).
- **At-rest shifr**: chat kontenti shifrlansinmi (hozir plaintext, §2.8).

> Barcha threshold/limit qiymatlari `business_settings` (default+CRUD), egasi-savoli emas.

### Tavsiya etilgan bajarish tartibi (zanjir)
```
[#1 WS-auth] ─┬─▶ [#2 reconnect] ─▶ [#3 catch-up] ─▶ [#4 optimistik+client_msg_id] ─▶ [#5 offline-navbat]
              │                                              │
              │                                              ▼
              │                                       [#28 per-message read]
              ▼
[#6 is_edited] [#7 @mention]─▶[#14 web-push]─▶[#15 FCM/APNS]─▶[#16 mute]
[#8 event-nom] [#9 REST broadcast]─▶[#26 WS-only?]   [#17 admin-page erishim]
[#11 attach-scope] [#12 room admin-gate] [#13 presence TTL]
        │
        ▼
[#18 orphan del]─▶[#19 prefix merge]  [#20 FTS]  [#21 unread col]  [#22 schema-drift]
[#23 kanal] [#24 unread-divider] [#25 emoji] [#27 GC] [#29 token-doc]
        │
        ▼
[#30 smart-reply] [#31 tarjima] [#32 xulosa]   (modernizatsiya — oxirida)
```

---

*Audit tugadi. READ-ONLY: faqat ushbu fayl yaratildi; hech qanday kod/schema/DB/config o'zgartirilmadi.*
