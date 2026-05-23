/**
 * @module OnboardingRoadmapDialog.types
 * @description Types, interfaces and the pure roadmap-generator for OnboardingRoadmapDialog.
 * Split from OnboardingRoadmapDialog.tsx (Rule 16).
 */

// Canonik Employee interface — yagona manba: @workspace/types
export type { Employee } from '@workspace/types';

export interface RoadmapFormData {
  lavozim_nomi: string;
  bolim: string;
  nastavnik_id: string;
  kirish_sanasi: string;
  reglamentlar: string;
  haftalik_maqsadlar: [string, string, string, string];
  sinov_muddat_oy: string;
}

export interface RoadmapWeek {
  week: number;
  label: string;
  tasks: string[];
  meeting: string;
}

export interface GeneratedRoadmap {
  lavozim_nomi: string;
  bolim: string;
  nastavnik_name: string;
  kirish_sanasi: string;
  sinov_muddat_oy: number;
  weeks: RoadmapWeek[];
  final_checkpoints: string[];
  reglamentlar: string[];
}

export interface OnboardingRoadmapDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineEntryId: number;
  candidateName: string;
  vacancyTitle?: string | null;
}

/** Pure function — builds a GeneratedRoadmap from form data. No side effects. */
export function generateRoadmap(form: RoadmapFormData, nastavnikName: string): GeneratedRoadmap {
  const reglamentlar = form.reglamentlar
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  const weeks: RoadmapWeek[] = [
    {
      week: 1,
      label: "1-hafta: Materiallarni o'qish va adaptatsiya",
      tasks: [
        ...reglamentlar.slice(0, 3).map(r => `O'qish: ${r}`),
        "Kompaniya tuzilmasi va jarayonlar bilan tanishish",
        "Nastavnik bilan uchrashuv va reja tuzish",
      ],
      meeting: "Nastavnik bilan kirish suhbati",
    },
    {
      week: 2,
      label: "2-hafta: Amaliy vazifalar",
      tasks: [
        form.haftalik_maqsadlar[0] || "Asosiy vazifalarni o'rganish",
        ...reglamentlar.slice(3).map(r => `O'qish: ${r}`),
        "Birinchi mustaqil ish topshirig'ini bajarish",
      ],
      meeting: "Haftalik tekshiruv — 1-hafta natijalari",
    },
    {
      week: 3,
      label: "3-hafta: Mustaqil ishlash",
      tasks: [
        form.haftalik_maqsadlar[1] || "Mustaqil loyihada ishlash",
        "Jamoaviy uchrashuvlarda qatnashish",
        "Nastavnik ko'magida murakkab vazifalarni bajarish",
      ],
      meeting: "Haftalik tekshiruv — 2-hafta natijalari",
    },
    {
      week: 4,
      label: "4-hafta: Baholash va 30-kunlik chek-list",
      tasks: [
        form.haftalik_maqsadlar[2] || "Sinov muddati maqsadlari tekshiruvi",
        "30-kunlik baholash tayyorlash",
        form.haftalik_maqsadlar[3] || "Kelajakdagi rivojlanish rejasini tuzish",
      ],
      meeting: "30-kunlik rasmiy baholash (HR + Nastavnik)",
    },
  ];

  const sinov = parseInt(form.sinov_muddat_oy) || 3;
  const final_checkpoints = [
    `30-kun baholash: Asosiy kompetentsiyalar tekshiruvi`,
    `${Math.round(sinov * 30 / 2)}-kun oraliq tekshiruv: Nastavnik bilan progress sharhi`,
    `${sinov * 30}-kun (${sinov} oylik) yakuniy baholash: HR Director bilan suhbat`,
    "Sinov muddati yakuniy xulosasi va qaror qabul qilish",
  ];

  return {
    lavozim_nomi: form.lavozim_nomi,
    bolim: form.bolim,
    nastavnik_name: nastavnikName,
    kirish_sanasi: form.kirish_sanasi,
    sinov_muddat_oy: sinov,
    weeks,
    final_checkpoints,
    reglamentlar,
  };
}
