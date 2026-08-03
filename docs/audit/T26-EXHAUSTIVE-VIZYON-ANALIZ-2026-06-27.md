# EUROPRINT ERP — T26 EXHAUSTIVE VIZYON-ANALIZ + FIX-LOOP (HALOL TUZATISH)

> Egasi: "butun loyiha vizyonga qarshi QAYTA-TAHLIL + to'liq hisobot + topilgan kamchiliklarni TUZAT — loop".
> Bu hisobot oldingi "85% / 0 gap" da'voni **rad etadi** — u 3-klaster NAMUNA edi, exhaustive emas.
> T26b = 6 agent, high-effort, 1M token, 224 jonli-tekshiruv (q.cjs + kod). Q-29 verify-don't-trust.

---

## 0. ⭐ HALOL HAQIQAT (namuna ≠ exhaustive)

| Ko'rsatkich | Oldingi (T24 namuna) | **T26b EXHAUSTIVE** |
|---|---|---|
| Vizyon-moslik | 85% | **56%** |
| done | — | 60 |
| **buildable-gap** | 0 | **75** |
| owner-data | — | 10 (kengaytirilgan ~30 qiymat) |
| gated | — | 1 |
| stale-empty (kod-to'g'ri, data-yo'q) | — | 15 |

**Modul-bo'yicha vizyon:** ЦКП/HR/LMS/Razryad **66%** · Org/Auth/Sec **52%** · Golden/PP/MES **52%** · QC/WMS/SD **58%** · CRM/AI/IoT **48%** · Director/Fin/Master/FE **62%**.

⭐ **MUHIM:** Analiz ko'p "master-plan STALE" topdi — ya'ni oldingi to'lqinlar (T1-T25) qurgan narsa master-rejada "yo'q" deb belgilangan, lekin ASLIDA bor (payroll-gate, CKP-kaskad, razryad-execution, error_catalog, LMS-gate — hammasi DONE). Demak 60 done REAL. Lekin 75 yangi gap ham REAL.

---

## 1. FIX-LOOP TRIAJ (75 buildable-gap → 3 guruh)

### A. HAQIQIY BUILDABLE — HOZIR quriladi (fabrikatsiyasiz, ~50)

**🔴 Golden-thread yopilishi (eng yuqori vizyon-qiymat):**
1. MRP natija `production_orders`ga persist emas — SD→PP zanjir uzuq (run-mrp.handler) ⭐
2. QcReworkEvent YETIM — listener yo'q (submit-inspection publish qiladi, hech kim tinglamaydi) ⭐
3. Golden-thread durability — domain_events=0, faqat SD outbox; PP/MES/QC/WMS/FIN in-process (restart→yo'qoladi) ⭐
4. Golden-thread dead-letter/broken-alarm — listener fail→silent logger.error+return
5. Operator→karta ЦКП-feed (MES_COMPLETED→ckp_fact_values, operator→karta map)

**🟠 Director-halqa (qurilgan-lekin-ulanmagan):**
6. DirectorHolatService→controller endpoint yo'q (5-KPI holat hisoblanmaydi) ⭐
7. Kunlik 07:00 company-state cron yo'q (company_state_log=0)
8. Director analytics faqat LMS JOIN — FIN/PP/MES/QC/HR/WMS agregat yo'q
9. Payroll→Kassir oylik avto-taqsim listener yo'q (cashier_movements=0) ⭐

**🟡 PP/MES backbone:**
10. pp_order_status_log + 7+2 state-machine guard yo'q
11. PP master-jadvallar yo'q (plan_fact/reason_codes/material_reservations/shift_plans/code_dict/material_policies)
12. PP frozen-zone transition guard (ustun bor, guard yo'q)
13. production_orders org_department_id/card_id FK yo'q (karta-markazli emas)
14. MES norma-versiya jadval yo'q (tarixiy sessiya norma yo'qoladi)
15. MES OEE kaskad-agregat + sex-tablo endpoint yo'q
16. MES shift-handover acceptance-gate yo'q (incoming usta tasdig'i)
17. MES downtime 6-kategoriya enum + duration ustun konsolidatsiya
18. PP/MES AI-planning taklif→tasdiq workflow yo'q

**🟢 QC/WMS/SD:**
19. QC sertifikat avto-generatsiya (QcPassed→SF-YYYY-NNNNN) yo'q
20. QC supplier-reyting 4-faktor formula soxta (currentRating=5 placeholder)
21. POS auto-GL kanonik entries'ga ulanmagan (pos_gl_postings subledger)
22. SD lost-orders + reklamatsiya endpointlari yo'q
23. POS movement 5-tur state-machine guard yarim

**🔵 CRM/AI/IoT:**
24. IotGateway o'lik (providers'da yo'q, push=0%)
25. CRM kanal INBOUND ingest yo'q (Telegram/WhatsApp→auto-lead)
26. CRM voronka pipelines/stages seed yo'q + proposals STP-gate
27. CRM churn/lead-aging cron yo'q (60-kun→qayta-taqsim)
28. AI-fit scheduler yo'q (faqat manual POST)
29. AI-CKP kunlik chatbot controller yo'q
30. IoT predictive mes_telemetry╳iot_sensor_readings ajralgan
31. IoT downtime 3-tier eskalatsiya (15/30/60min) yo'q
32. Razryad attestatsiya (muddatli qayta-tasdiq) + mentor 2-tomonlama workflow

**🎨 FE-buildable:**
33. Razryad decrease FE tugmasi (BE tayyor, FE hardcoded 'increase')
34. ЦКП multi-product slot UI (BE tayyor)
35. Razryad rangli vizualizatsiya
36. Director 4-hisob widget + holat-endpoint FE-ulash
37. FE org-token (--mod-org, --ep-org-l0..l6) + F1/F2 (EPSkeleton/onError)
38. LMS kurs 3-bosqich tasdiq
39. material_cards.kod regex + sd_customers.segment ABC-autohisob

### B. XAVFLI — flag-orqasida quriladi (OFF default, login-gate patterni)
- Tenant isolation global guard (TENANT_ISOLATION_ENABLED OFF — null tenant_id buzmasin)
- card_permissions kanonik jadval (CARD_PERMISSION_SOURCE_READY OFF — RBAC buzmasin)
- Card 2-imzo aktivatsiya, i.o.-scoped RBAC, field-level RBAC projection, absence-block→approval

### C. OWNER-DATA-bog'liq — struktura tayyor, qiymat kutadi (~30 qiymat)
Ierarxiya (20 root→1 Egasi+7 otdeleniye, otdeleniye_no 1-7) · razryad-band (exam_pass/min_months/salary) · ЦКП-norma+deadline(16h↔3h) · head_user_id 127/145 · users.card_id 31/32 · work-center↔karta map + per-stanok norma · workflow_rules · AI-kalit (OpenAI/Gemini) · material.unit_price · holat-formula 5-vazn · OKR · 4-hisob-split% · sd_customers ABC.

---

## 2. FIX-LOOP TARTIBI (yopiq-tsikl davom)
Har to'lqin: file-izolyatsiya · 2-3 agent throttle-xavfsiz · Result/Zod/Drizzle · additiv migration (APPROVED: egasi "hamma vizyon") · agent commit qilmaydi → men tsc-yashil tasdiqlab commit · Q-46 ishlayotgan kod tegilmaydi · Q-40 fabrikatsiya yo'q (graceful no-op).

**To'lqin tartibi (qiymat bo'yicha):** T27 golden-thread+Director halqa → T28 PP/MES backbone → T29 QC/WMS/SD → T30 CRM/AI/IoT → T31 FE-buildable → qayta-analiz.

*Halol (Q-29): bu hisobot exhaustive jonli-tekshiruvga asoslangan, namuna emas. Oldingi 85% over-claim edi — to'g'rilandi. Haqiqiy holat 56%, lekin 75 gap'ning ~50 tasi fabrikatsiyasiz quriladi.*
