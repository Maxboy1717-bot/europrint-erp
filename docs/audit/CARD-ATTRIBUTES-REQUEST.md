# KARTA-ATRIBUTLARI — MA'LUMOT SO'ROVI (egasi to'ldiradi)

> **Nima uchun:** VISION-3340 re-triage bo'yicha eng katta ta'sirli owner-data
> bo'shlig'i — har LAVOZIM (position) uchun karta-atributlari. Bu bir maydon 8 ta
> root-cause'ni ochadi (Auth/RBAC, GL, Org, HR, Security). Manba: retriage doc
> "Owner-Data Themes" #1 (eng yuqori-leverage).
>
> **Qanday to'ldirish:** har qatordagi bo'sh kataklarni to'ldiring. Faqat LAVOZIM
> nomi oldindan to'ldirilgan — qolgan hamma ustun BO'SH (hech qanday qiymat
> taxmin qilinmagan). Ustunlar `org_departments` (kanonik karta jadvali)ga yoziladi.

## Ustun izohlari
| Ustun | Ma'no | Format |
|---|---|---|
| razryad_level_id | Malaka razryadi (1–6 shkala; `razryad_levels.id`) | butun son yoki bo'sh |
| rbac_tier | RBAC ruxsat darajasi (login/guard shu tierdan o'qiydi) | matn (masalan: operator/manager/director) |
| salary_type | Oylik turi | `monthly` / `hourly` / `piece` (dona-bay) |
| salary_min | Oylik vilkasi — minimal | son (so'm) |
| salary_max | Oylik vilkasi — maksimal | son (so'm) |
| base_salary | Bazaviy oylik (razryad koeff.gacha) | son (so'm) |
| otdeleniye_no | Bo'linma raqami (Vysotskiy-7: 1–7) | butun son 1–7 yoki bo'sh |

## Lavozimlar (93 ta position — org_departments.node_type='position')

| # | card_id | LAVOZIM (position) | razryad_level_id | rbac_tier | salary_type | salary_min | salary_max | base_salary | otdeleniye_no |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 139 | Avtopogruzchik Operatori |  |  |  |  |  |  |  |
| 2 | 85 | B2B Sotuv Mutaxassisi |  |  |  |  |  |  |  |
| 3 | 130 | Bog'bon |  |  |  |  |  |  |  |
| 4 | 114 | Bojxona Brokeri |  |  |  |  |  |  |  |
| 5 | 71 | Bosh Buxgalter |  |  |  |  |  |  |  |
| 6 | 99 | Bosh Buxgalter Yordamchisi |  |  |  |  |  |  |  |
| 7 | 64 | Bosh Direktor |  |  |  |  |  |  |  |
| 8 | 92 | Bosh Dizayner |  |  |  |  |  |  |  |
| 9 | 138 | Bosh Omborchi |  |  |  |  |  |  |  |
| 10 | 95 | Bosh Texnolog |  |  |  |  |  |  |  |
| 11 | 125 | Bosma Mashina Yordamchisi |  |  |  |  |  |  |  |
| 12 | 147 | Bosma Operatori |  |  |  |  |  |  |  |
| 13 | 145 | Bukuvchi-Yelimchi Operatori |  |  |  |  |  |  |  |
| 14 | 98 | Buxgalter |  |  |  |  |  |  |  |
| 15 | 82 | CRM Mutaxassisi |  |  |  |  |  |  |  |
| 16 | 77 | Dizayn Bo'lim Boshlig'i |  |  |  |  |  |  |  |
| 17 | 91 | Dizayner |  |  |  |  |  |  |  |
| 18 | 63 | Egasi |  |  |  |  |  |  |  |
| 19 | 123 | Elektrik |  |  |  |  |  |  |  |
| 20 | 141 | Flekso Operatori |  |  |  |  |  |  |  |
| 21 | 79 | Flekso Sex Boshlig'i |  |  |  |  |  |  |  |
| 22 | 134 | Flekso Smena Boshlig'i |  |  |  |  |  |  |  |
| 23 | 142 | Gofra Operatori |  |  |  |  |  |  |  |
| 24 | 152 | Haydovchi |  |  |  |  |  |  |  |
| 25 | 68 | HR Boshlig'i |  |  |  |  |  |  |  |
| 26 | 104 | HR Mutaxassisi |  |  |  |  |  |  |  |
| 27 | 103 | Iqtisodchi |  |  |  |  |  |  |  |
| 28 | 72 | Ishlab Chiqarish Boshlig'i |  |  |  |  |  |  |  |
| 29 | 97 | Ishlab Chiqarish Dispetcheri |  |  |  |  |  |  |  |
| 30 | 115 | IT Mutaxassis |  |  |  |  |  |  |  |
| 31 | 100 | Kassir |  |  |  |  |  |  |  |
| 32 | 150 | Kesish Operatori |  |  |  |  |  |  |  |
| 33 | 89 | Kontent Menejeri |  |  |  |  |  |  |  |
| 34 | 90 | Kopirayter |  |  |  |  |  |  |  |
| 35 | 119 | Kotiba |  |  |  |  |  |  |  |
| 36 | 131 | Kurer |  |  |  |  |  |  |  |
| 37 | 110 | Lab Mutaxassisi |  |  |  |  |  |  |  |
| 38 | 149 | Lakiylash Operatori |  |  |  |  |  |  |  |
| 39 | 148 | Laminatsiya Operatori |  |  |  |  |  |  |  |
| 40 | 107 | LMS Koordinatori |  |  |  |  |  |  |  |
| 41 | 76 | Logistika Boshlig'i |  |  |  |  |  |  |  |
| 42 | 113 | Logistika Koordinatori |  |  |  |  |  |  |  |
| 43 | 65 | Ma'muriy Direktor |  |  |  |  |  |  |  |
| 44 | 102 | Maosh Mutaxassisi |  |  |  |  |  |  |  |
| 45 | 70 | Marketing Boshlig'i |  |  |  |  |  |  |  |
| 46 | 86 | Marketing Mutaxassisi |  |  |  |  |  |  |  |
| 47 | 124 | Mexanik |  |  |  |  |  |  |  |
| 48 | 101 | Moliyaviy Tahlilchi |  |  |  |  |  |  |  |
| 49 | 133 | Namuna Olish Operatori |  |  |  |  |  |  |  |
| 50 | 62 | O'qitish Boshlig'i |  |  |  |  |  |  |  |
| 51 | 106 | O'qitish Mutaxassisi |  |  |  |  |  |  |  |
| 52 | 118 | Ofis Menejeri |  |  |  |  |  |  |  |
| 53 | 146 | Ofset Operatori |  |  |  |  |  |  |  |
| 54 | 80 | Ofset Sex Boshlig'i |  |  |  |  |  |  |  |
| 55 | 135 | Ofset Smena Boshlig'i |  |  |  |  |  |  |  |
| 56 | 73 | Ombor Boshlig'i |  |  |  |  |  |  |  |
| 57 | 136 | Ombor Smena Boshlig'i |  |  |  |  |  |  |  |
| 58 | 137 | Omborchi |  |  |  |  |  |  |  |
| 59 | 129 | Oshpaz |  |  |  |  |  |  |  |
| 60 | 128 | Oshxona Xodimi |  |  |  |  |  |  |  |
| 61 | 81 | PR Boshlig'i |  |  |  |  |  |  |  |
| 62 | 117 | PR Mutaxassisi |  |  |  |  |  |  |  |
| 63 | 93 | Preprint Mutaxassisi |  |  |  |  |  |  |  |
| 64 | 151 | Qadoqlash Operatori |  |  |  |  |  |  |  |
| 65 | 109 | QC Inspektori |  |  |  |  |  |  |  |
| 66 | 126 | Qo'riqchi |  |  |  |  |  |  |  |
| 67 | 78 | Rejalashtirish Boshlig'i |  |  |  |  |  |  |  |
| 68 | 96 | Rejalashtirish Mutaxassisi |  |  |  |  |  |  |  |
| 69 | 67 | Rivojlanish Direktori |  |  |  |  |  |  |  |
| 70 | 83 | Savdo Menejeri |  |  |  |  |  |  |  |
| 71 | 88 | SEO Mutaxassisi |  |  |  |  |  |  |  |
| 72 | 144 | Shtans Operatori |  |  |  |  |  |  |  |
| 73 | 111 | Sifat Auditori |  |  |  |  |  |  |  |
| 74 | 74 | Sifat Boshlig'i |  |  |  |  |  |  |  |
| 75 | 132 | Sifat Operatori |  |  |  |  |  |  |  |
| 76 | 87 | SMM Mutaxassisi |  |  |  |  |  |  |  |
| 77 | 69 | Sotuvlar Boshlig'i |  |  |  |  |  |  |  |
| 78 | 75 | Ta'minlash Boshlig'i |  |  |  |  |  |  |  |
| 79 | 112 | Ta'minlash Mutaxassisi |  |  |  |  |  |  |  |
| 80 | 173 | TEST-Operator |  |  |  |  |  |  |  |
| 81 | 66 | Texnik Direktor |  |  |  |  |  |  |  |
| 82 | 122 | Texnik Xodim |  |  |  |  |  |  |  |
| 83 | 94 | Texnolog |  |  |  |  |  |  |  |
| 84 | 143 | Tikuvchi Operatori |  |  |  |  |  |  |  |
| 85 | 116 | Tizim Administratori |  |  |  |  |  |  |  |
| 86 | 127 | Tozalovchi |  |  |  |  |  |  |  |
| 87 | 108 | Xavfsizlik Mutaxassisi |  |  |  |  |  |  |  |
| 88 | 153 | Yetkazib Berish Yordamchisi |  |  |  |  |  |  |  |
| 89 | 140 | Yig'uvchi |  |  |  |  |  |  |  |
| 90 | 84 | Yirik Mijozlar Menejeri |  |  |  |  |  |  |  |
| 91 | 105 | Yollovchi |  |  |  |  |  |  |  |
| 92 | 121 | Yuklovchi |  |  |  |  |  |  |  |
| 93 | 120 | Yurist |  |  |  |  |  |  |  |

---
_Avto-generatsiya 2026-07-08, jonli `europrint` (read-only). Strukturaviy org-birliklar
_(otdeleniye/department/section/director/ceo/owner) CHIQARILGAN — bu faqat per-LAVOZIM
_atribut varag'i. `base_salary` — so'ralgan qiymat (org_departments'da hozircha bunday
_ustun yo'q; berilgach oylik modeliga bog'lanadi)._
