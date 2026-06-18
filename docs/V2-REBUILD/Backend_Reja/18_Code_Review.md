# 18 — KOD TEKSHIRISH CHECKLISTI (Code Review)

> Har PR (pull request) yoki sprint yakunida bu cheklistdan o'tadi.
> Manba: §15 tarixiy xatolar + LOYIHA_QOIDALARI.md CR-* qoidalari.
> Reviewer: Advisor (Claude) — bajaruvchi emas.

---

## 18.1 CR-SEC: Xavfsizlik

```
☐ SEC-1: Har @UseGuards ni @Roles yoki @Public(izoh) kuzatadi?
☐ SEC-2: @Public() lar asoslanganmi (// PUBLIC: sabab)?
☐ SEC-3: Hardcoded parol/token yo'qmi? (grep "??.*'Admin\|??.*'secret")
☐ SEC-4: sql.raw() faqat literal DDL bilan ishlatilganmi?
☐ SEC-5: JWT refresh token alohida JWT_REFRESH_SECRET bilan?
☐ SEC-6: JWT algorithms: ['HS256'] pin qilinganmi?
☐ SEC-7: OTP session limit bor (max 5 urinish)?
☐ SEC-8: .gitignore da backend.log* *.log.* bormi?
☐ SEC-9: Migration SQL da parol hash yo'qmi?
```

---

## 18.2 CR-FAKE: Soxta Data

```
☐ FAKE-1: "return { ok: true }" — hech qanday DB operatsiyasi yo'q?
☐ FAKE-2: "return { data: [] }" hardcoded — real query yo'q?
☐ FAKE-3: Controller 501 stub — FE ishlayotgandek ko'rsatadiemi?
☐ FAKE-4: "as unknown as T" production kodda bor?
☐ FAKE-5: "mock/stub/dummy/fake" nomlari production faylda?
☐ FAKE-6: @OnEvent listener faqat logger chaqirib to'xtaydimi?
☐ FAKE-7: Event yuboriladi, listener yo'qmi? (grep event nomi)
☐ FAKE-8: Outbox relay — domain_events da yozuv bormi?
```

---

## 18.3 CR-DB: Bazaviy

```
☐ DB-1: ALTER TABLE oldidan VIEW/TABLE tekshirilganmi?
☐ DB-2: Har yangi ustun nomi information_schema da tekshirilganmi?
☐ DB-3: ::text cast ishlatilganmi — kerakmi, zarurmi?
☐ DB-4: material_card_id emas material_id ishlatilganmi?
☐ DB-5: timestamptz ustunlarga regex ~ ishlatilganmi?
☐ DB-6: Yangi NOT NULL ustun DB default bilan (migration)?
☐ DB-7: NOT NULL ustun uchun fallback zanjiri bor?
☐ DB-8: Drizzle ustun nomlari live DB bilan to'g'rimi?
☐ DB-9: Yangi cron/service ishlatadigan jadval DB da bormi?
☐ DB-10: Drizzle-only jadval foydalanishdan oldin migration bormi?
```

---

## 18.4 CR-TWO: Ikki Dunyo

```
☐ TWO-1: Yangi jadval yaratishdan oldin §1 STANDARTLAR.md tekshirilganmi?
☐ TWO-2: JOIN ustun tiplari mos (UUID↔INT emasmi)?
☐ TWO-3: GL posting faqat "entries" jadvaliga (gl_journal_entries emas)?
☐ TWO-4: Ombor yozuvi faqat warehouse_stock (stocks/wms_stock emas)?
☐ TWO-5: current_stock = VIEW — unga INSERT/ALTER yo'qmi?
```

---

## 18.5 CR-API: Backend

```
☐ API-1: Ko'p jadval INSERT — db.transaction() ichidami?
☐ API-2: Har yangi query ustun nomlari live DB dan tekshirilganmi?
☐ API-3: transaction_type — map bilan (hardcoded string emas)?
☐ API-4: @Param id null bo'lsa NotFoundException?
☐ API-5: FE URL endpoint bilan mos (metod + yo'l)?
☐ API-6: Service faqat repository orqali DB (to'g'ridan db.* emas)?
☐ API-7: Biznes logika controller da emas (service/domain da)?
☐ API-8: queryKey mos (useQuery key = invalidateQueries key)?
☐ API-9: Magic number konstantaga chiqarilganmi?
☐ API-10: Bir jadvalda bitta yozuvchi (double-write yo'q)?
```

---

## 18.6 CR-EVT: Eventlar

```
☐ EVT-1: EventEmitter2.emit() + @EventsHandler birgami (xato)? (CQRS EventBus yoki @OnEvent kerak)
☐ EVT-2: Bir jadvalga nechta yozuvchi — double-write yo'qmi?
☐ EVT-3: SD→PP backbone link ishlaydi (golden-thread-chain-proof.cjs PASS)?
```

---

## 18.7 CR-FE: Frontend

```
☐ FE-1: useQuery da isLoading → Skeleton, isError → EPErrorState?
☐ FE-2: useMutation da onError handler (toast destructive)?
☐ FE-3: Har delete operatsiyasida ConfirmDialog?
☐ FE-4: Xom rang yo'q (check-design-tokens.mjs 0)?
☐ FE-5: Brand rang var(--ep-primary) = #FF902F (ko'k emas)?
☐ FE-6: Sahifa root = <div className="space-y-6"> (flex h-full emas)?
☐ FE-7: Co-located fayllar (Sections/Tabs/Charts/) ham tekshirilganmi?
☐ FE-8: Sentry faqat production da init?
☐ FE-9: EPPageHeader har listPage/dashboard da?
☐ FE-10: i18n: yangi matnlar tarjima fayllarida (hardcoded emas)?
```

---

## 18.8 CR-ARCH: Arxitektura

```
☐ ARCH-1: DDD 4-qavat: domain/ → application/ → infrastructure/ → presentation/?
☐ ARCH-2: Result<T> — Ok/Err, throw faqat tx rollback/HTTP filter?
☐ ARCH-3: Modul A modul B ning service/repo'sini to'g'ridan import qilmadimi?
☐ ARCH-4: Circular dependency yo'qmi (forwardRef() bor bo'lsa — nima sabab)?
☐ ARCH-5: Migration faylda -- APPROVED: owner (sana) belgilanganmi?
☐ ARCH-6: git add <aniq-fayl> (add -A ishlatilmadimi)?
☐ ARCH-7: Ishlayotgan kod o'chirilmadimi (Q-46)?
```

---

## 18.9 CR-VIZYON: Vizyon moslik

```
☐ VIZ-1: Razryad — tuzilma ichida (alohida sahifa emas)?
☐ VIZ-2: Karta (org_function) = asosiy ob'ekt (xodim ikkilamchi)?
☐ VIZ-3: AI moslik (karta ↔ xodim) ko'rsatilganmi?
☐ VIZ-4: Gofra formulasi to'g'ri (qalinlik, profil, material sarfi)?
☐ VIZ-5: Buyurtma oqimi to'liq (SD→PP→MES→QC→WMS→FIN)?
☐ VIZ-6: Operator tablet — oddiy (komplex dashboard emas)?
☐ VIZ-7: Direktor paneli — real DB dan (snapshot/direct query)?
```

---

## 18.10 Avtomatik tekshiruv buyrug'i (PR oldidan)

```bash
# Bitta buyruq bilan barcha avtomatik tekshiruvlar:
npx tsc -p apps/api/tsconfig.json --noEmit && \
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit && \
node scripts/check-design-tokens.mjs && \
node scripts/check-sidebar-routes.mjs && \
node scripts/check-schema-dups.js && \
node scripts/golden-thread-chain-proof.cjs && \
pnpm test:unit

# Agar hammasi PASS → PR yaratishga ruxsat.
# Bitta FAIL → to'xtat, tuzat.
```

---

## 18.11 Review natijasi

| Ball | Sifat | Harakat |
|------|-------|---------|
| 0 FAIL | A+ | Merge qilish mumkin |
| 1-3 FAIL | B | Minor fixes, keyin merge |
| 4-8 FAIL | C | Muhim tuzatmalar kerak |
| 9+ FAIL | D | Qayta yozish kerak |
| CR-SEC yoki CR-FAKE FAIL | — | Merge TAQIQ — avval tuzat |

---
*Hujjat oxiri · §15 STANDARTLAR.md bilan birga o'qiladi*
