# ZIDDIYATLAR HAL QILINDI — Egasi qarori 2026-06-08

> Decision-map agentlari topgan 9 cross-modul ziddiyat. Egasi hal qildi. Build paytida SHU qarorlar ustun.

1. **Narxlash** = **FIFO/FEFO** (muddatli mahsulot→FEFO, muddatsiz→FIFO; partiya narxi). Manba: POS Q35-37. → Finance/WMS/MM. (weighted-average RAD etildi.)
2. **Kunlik hisobot oylik-gate** = **2 xil cutoff**: oddiy kunlik hisobot **3 soat** (BARCHA Q118), ЦКП/natija hisoboti **16 soat** (KARTALAR Q18). Ikkalasi alohida. → ORG/HR/AI/Payroll.
3. **3-savat** = **Communication Center = MANBA**. Hamma hujjat CC orqali xodimning 3 savatiga (kiruvchi/kutilmoqda/chiquvchi) tushadi. Kanban-savat = CC'ga ulangan KO'RINISH, alohida jadval emas. Bitta haqiqat (cc_documents kanonik). → Kanban/CC.
4. **Smena** = **kuzatiladi** (ishlab chiqarish/ЦКП/oylik uchun har kartaga smena jadvali), lekin **alohida smena-login/ochish-yopish YO'Q** (Q11: faqat audit). → MES/HR/POS.
5. **Ishlab chiqarish reja gorizonti** = **ko'p qatlamli: oylik → haftalik → kunlik → soatlik** (strategik vizyon + kitobdagi operatsion dastgoh rejasi birga, MRP/MPS kabi). → PP/Director.
6. **Soliq/QQS** = **faqat ichki hisobot** (rasmiy fiskal/QQS integratsiya YO'Q). Manba: POS Q45. → Finance.
7. **Bitrix24 ko'chirish** = **CSV/Excel bir martalik import**; Bitrix butunlay **o'chiriladi** (Q33). API-ko'prik YO'Q. → CRM/Marketing.
8. **Kanonik ombor-stok jadvali** = **warehouse_stock** (current_stock = view shunga; `stocks` parallel birlashtiriladi). → WMS.
9. **CRP** = `work_centers.efficiency_rate` ustuni qo'shiladi (toza fix; mavjud /api/pp/crp 503 yopiladi). → PP.
