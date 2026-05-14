/** @module HRBrandPageTypes @description TypeScript interfaces, types, and constants for HRBrandPage. No JSX. */

export interface Review {
  name: string;
  position: string;
  text: string;
  rating: number;
}

export interface BrandData {
  presentation: { goal: string; values: string; mission: string };
  channels: { telegram: string; instagram: string; linkedin: string; olx: string };
  benefits: string[];
  reviews: Review[];
  stats: { employees_count: string; avg_tenure: string; growth_percent: string };
  vacancy_template: string;
}

export interface PortretData {
  position_name_variants?: string;
  main_purpose?: string;
  main_duties?: string;
  expected_result?: string;
  professional_skills?: string;
  experience_field?: string;
  education_req?: string;
  age_min?: number;
  age_max?: number;
  gender?: string;
  salary_min?: number;
  salary_max?: number;
  work_schedule?: string;
  social_package?: string[];
  candidate_presentation?: { kompaniya_taqdimoti?: string };
  danger_candidate?: string;
}

export interface OrgNode {
  id: number;
  name: string;
}

export const EMPTY_BRAND: BrandData = {
  presentation: { goal: "", values: "", mission: "" },
  channels: { telegram: "", instagram: "", linkedin: "", olx: "" },
  benefits: [],
  reviews: [],
  stats: { employees_count: "", avg_tenure: "", growth_percent: "" },
  vacancy_template: "",
};

export const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  olx: "OLX",
};

export const CHANNEL_PLACEHOLDERS: Record<string, string> = {
  telegram: "Telegram uchun vakansiya e'loni shabloni...",
  instagram: "Instagram uchun qisqa va rasmli post matni...",
  linkedin: "LinkedIn uchun professional e'lon matni...",
  olx: "OLX uchun batafsil vakansiya e'loni...",
};
