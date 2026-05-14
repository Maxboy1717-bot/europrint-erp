/**
 * @module types
 * @description React UI component.
 */

import { LucideIcon } from "lucide-react";

export interface PortretData {
  // Blok A — Lavozim tahlili (5 savol)
  position_name_variants?: string;  // 1. Lavozim nomi variantlari
  main_purpose?: string;            // 2. Lavozim maqsadi (QYM — Цель должности)
  vacancy_reason?: string;          // 3. Vakansiyani ochish sababi
  problem_solved?: string;          // 4. Bu odamni yollash qanday muammoni hal qiladi
  reports_to?: string;              // 5. Kimga hisobot beradi

  // Blok B — Demografik talablar (5 savol)
  age_min?: number;                 // 6. Yosh (min)
  age_max?: number;                 // 7. Yosh (max)
  gender?: string;                  // 8. Jins
  family_status?: string;           // 9. Oilaviy holat
  education_req?: string;           // 10. Ta'lim darajasi

  // Blok C — Vazifalar va natijalar (3 savol)
  department_duties?: string;       // 11. Bo'lim/jamoa vazifalari
  main_duties?: string;             // 12. Xodim majburiyatlari (Funksional)
  expected_result?: string;         // 13. Natija/mahsulot

  // Blok E — Tajriba va bilim (5 savol)
  danger_candidate?: string;        // 14. Xavfli nomzod tavsifi
  experience_required?: boolean;    // 15. Tajriba majburiymi?
  experience_field?: string;        // 15a. Soha + yillar
  current_employment?: string;      // 16. Hozir qayerda ishlaydi
  industry_experience?: string;     // 17. Soha tajribasi
  professional_skills?: string;     // 18. Kasb ko'nikmalari

  // III Bo'lim — Ish sharoitlari
  salary_min?: number;
  salary_max?: number;
  probation_months?: number;
  work_schedule?: string;
  travel_required?: string;
  social_package?: string[];
  additional_conditions?: string;

  // IV Bo'lim — Kandidatga suhbatda aytiladi (16 savol, Material №48 C qism)
  candidate_presentation?: {
    kompaniya_taqdimoti?: string;   // 1. Kompaniya haqida qisqacha taqdimot
    ish_tartibi?: string;           // 2. Ish tartibi va jarayonlar
    instrumentlar?: string;         // 3. Asbob-uskunalar / dasturlar
    guruh_javob?: string;           // 4. Guruhga javobgarlik (ha/yo'q + necha kishi)
    xizmat_safari?: string;         // 5. "yes" | "no"
    sinov_muddat?: string;          // 6. Sinov muddati (oy)
    sinov_maosh_min?: string;       // 7. Sinov davri maoshi — minimum
    sinov_maosh_max?: string;       // 8. Sinov davri maoshi — maximum
    asosiy_maosh?: string;          // 9. Asosiy ish haqi vilkasi
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
  traits: Record<string, number>;
  iq_min?: number;
  leadership_min?: number;
  replication_min?: number;
}

export interface PortretStep {
  id: string;
  icon: LucideIcon;
  title: string;
  full: string;
}

export interface HRRequest {
  id: number;
  request_type: string;
  priority: string;
  status: string;
  requester_name: string | null;
  created_at: string;
  comment: string | null;
}
