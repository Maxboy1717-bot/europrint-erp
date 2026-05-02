import { LucideIcon } from "lucide-react";

export interface PortretData {
  // Blok A — Lavozim tahlili (5 savol)
  position_name_variants?: string;  // 1. Lavozim nomi variantlari
  main_purpose?: string;            // 2. Lavozim maqsadi (QYM — Цель должности)
  vacancy_reason?: string;          // 3. Vakansiyani ochish sababi
  problem_solved?: string;          // 4. Bu odamni yollash qanday muammoni hal qiladi
  reports_to?: string;              // 5. Kimga hisobot beradi (tuzilish konteksti)

  // Blok B — Demografik talablar (5 savol)
  age_min?: number;                 // 6. Yosh (min)
  age_max?: number;                 // 7. Yosh (max)
  gender?: string;                  // 8. Jins
  family_status?: string;           // 9. Oilaviy holat (izoh)
  education_req?: string;           // 10. Ta'lim darajasi

  // Blok C — Vazifalar va natijalar (3 savol)
  department_duties?: string;       // 11. Bo'lim/jamoa qanday vazifalarni bajaradi?
  main_duties?: string;             // 12. Xodim qanday majburiyatlarni bajaradi? (Funksional)
  expected_result?: string;         // 13. Xodimdan qanday aniq mahsulot/natija kutiladi?

  // Blok E — Tajriba va bilim (5 savol)
  danger_candidate?: string;        // 14. Qanday turdagi odam zarar yetkazishi mumkin?
  experience_required?: boolean;    // 15. Oldingi ish tajribasi majburiymi?
  experience_field?: string;        // 15a. Soha + yillar (Ha bo'lsa)
  current_employment?: string;      // 16. Hozir kandidat qayerda ishlayotgan bo'lishi mumkin?
  industry_experience?: string;     // 17. Ma'lum sohada tajriba kerakmi?
  professional_skills?: string;     // 18. Kasb ko'nikmalari (dasturlar, tillar, sertifikatlar)
  target_worker_type?: "FLAGMAN" | "PROTSESSNIK" | "";  // Maqsadli xodim turi

  // III Bo'lim — Ish sharoitlari (kandidatga beriladigan ma'lumot)
  salary_min?: number;              // Ish haqi (minimum)
  salary_max?: number;              // Ish haqi (maximum)
  probation_months?: number;        // Sinov muddati (oy)
  work_schedule?: string;           // Ish grafigi
  travel_required?: string;         // Xizmat safari
  social_package?: string[];        // Ijtimoiy paket
  additional_conditions?: string;   // Qo'shimcha shartlar va imtiyozlar

  // IV Bo'lim — Kandidatga suhbatda aytiladi (16 savol, Material №48 C qism)
  candidate_presentation?: {
    kompaniya_taqdimoti?: string;   // 1. Kompaniya haqida qisqacha taqdimot
    ish_tartibi?: string;           // 2. Ish tartibi va jarayonlar (kompaniyada qanday ishlaydi)
    instrumentlar?: string;         // 3. Qanday asbob-uskunalar/dasturlar ishlatiladi
    guruh_javob?: string;           // 4. Guruhga javobgarlik (ha/yo'q + necha kishi)
    xizmat_safari?: string;         // 5. "yes" | "no"
    sinov_muddat?: string;          // 6. Sinov muddati (oy)
    sinov_maosh_min?: string;       // 7. Sinov davri maoshi — minimum
    sinov_maosh_max?: string;       // 8. Sinov davri maoshi — maximum
    asosiy_maosh?: string;          // 9. Asosiy ish haqi vilkasi (suhbatda aytiladi)
    martaba?: string;               // 10. Martaba o'sishi imkoniyatlari
    tatil_kun?: string;             // 11. Yillik ta'til kunlari
    ish_rejimi?: string;            // 12. Ish rejimi (soatlar, grafik)
    shartnoma_tur?: string;         // 13. "unlimited" | "limited" | "gpc" | "ip"
    jalb_qiluvchi?: string;         // 14. Asosiy jalb qiluvchi omil
    sotsial_paket?: string;         // 15. Ijtimoiy paket
    oqutish?: string;               // 16. O'qitish imkoniyatlari
  };
}

export interface ToolTestReqs {
  traits: Record<string, number>;  // A-J, -100..+100 shkala
  iq_min?: number;
  leadership_min?: number;
  replication_min?: number;
}

export interface ChannelData {
  [key: string]: {
    active: boolean;
    views?: number;
    applications?: number;
    posted_date?: string;
  };
}

export interface Step {
  id: string;
  icon: LucideIcon;
  title: string;
  full: string;
}

export const TOOL_TRAITS: { key: string; label: string; description: string }[] = [
  { key: "A", label: "A — Diqqat (Внимание)",         description: "Tafsilotlarga e'tibor, ziyraklik" },
  { key: "B", label: "B — Strategiya (Стратегия)",     description: "Uzoqni ko'rish, rejalashtirish" },
  { key: "C", label: "C — Nazorat (Контроль)",         description: "Emotsiyalarni boshqarish, sakin bo'lish" },
  { key: "D", label: "D — Ishonch (Уверенность)",      description: "O'ziga va qarorlariga ishonch" },
  { key: "E", label: "E — Energiya (Энергия)",         description: "Faollik, harakatchanlik darajasi" },
  { key: "F", label: "F — Qat'iylik (Решительность)", description: "Tez va aniq qaror qabul qilish" },
  { key: "G", label: "G — Bardosh (Оборона)",          description: "Tanqid va bosimga chidamlilik" },
  { key: "H", label: "H — Taktika (Тактика)",          description: "Operativ fikrlash, moslashuvchanlik" },
  { key: "I", label: "I — Empatiya (Эмпатия)",         description: "Oadamlarni tushunish, his qilish" },
  { key: "J", label: "J — Muloqot (Общение)",          description: "Kommunikatsiya, aloqa o'rnatish" },
];

export const CHANNELS_LIST = [
  { key: "HH_UZ",     label: "hh.uz",      color: "bg-red-500"    },
  { key: "UZJOB",     label: "UZjobs.uz",  color: "bg-blue-500"   },
  { key: "MYJOB",     label: "MyJob.uz",   color: "bg-green-500"  },
  { key: "OLX_UZ",    label: "OLX.uz",     color: "bg-teal-500"   },
  { key: "TELEGRAM",  label: "Telegram",   color: "bg-sky-500"    },
  { key: "INSTAGRAM", label: "Instagram",  color: "bg-pink-500"   },
  { key: "LINKEDIN",  label: "LinkedIn",   color: "bg-indigo-500" },
  { key: "FACEBOOK",  label: "Facebook",   color: "bg-blue-700"   },
];
