/** @module ProgramsTabTypes @description Shared interfaces, types, and constants for the ProgramsTab feature. No JSX. */

import type { AdaptationProgram } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
export interface TaskItem {
  title: string;
  description: string;
  day: number;
}

export interface CheckpointItem {
  day: number;
  title: string;
  description: string;
}

export interface ProgramFormState {
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  duration: number;
  durationType: string;
  departmentId: string;
  positionId: string;
  mentorRequired: boolean;
  status: string;
  tasks: TaskItem[];
  checkpoints: CheckpointItem[];
}

export const DEFAULT_FORM: ProgramFormState = {
  title: "",
  titleRu: "",
  description: "",
  descriptionRu: "",
  duration: 1,
  durationType: "day",
  departmentId: "all",
  positionId: "all",
  mentorRequired: true,
  status: "active",
  tasks: [],
  checkpoints: [],
};

export interface DepartmentItem {
  id: string;
  name: string;
}

export interface PositionItem {
  id: string;
  name: string;
}

export interface UpdateMutationPayload {
  id: string;
  data: Record<string, unknown>;
}

export interface ProgramsTabProps {
  programs: AdaptationProgram[];
  departments: DepartmentItem[];
  positions: PositionItem[];
}

export const PROGRAM_TEMPLATES = {
  "1-day": {
    title: "1 kunlik kirish dasturi",
    titleRu: "Программа введения на 1 день",
    duration: 1,
    durationType: "day" as const,
    description: tLabel('adaptation.ProgramsTab.birinchiIshKunidagiAsosiyTanishtirish', "Birinchi ish kunidagi asosiy tanishtirish va yo'l-yo'riq"),
    descriptionRu: "Основное знакомство и ориентация в первый рабочий день",
    tasks: [
      { title: tLabel('adaptation.ProgramsTab.kompaniyaBilanTanishish', "Kompaniya bilan tanishish"), description: tLabel('adaptation.ProgramsTab.kompaniyaTarixiMissiyaQadriyatlar', "Kompaniya tarixi, missiya, qadriyatlar"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.ishJoyiBilanTanishish', "Ish joyi bilan tanishish"), description: tLabel('adaptation.ProgramsTab.texnikaKirishKartalariDasturlar', "Texnika, kirish kartalari, dasturlar"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.jamoaBilanTanishish', "Jamoa bilan tanishish"), description: tLabel('adaptation.ProgramsTab.bolimAzolariBilanSuhbat', "Bo'lim a'zolari bilan suhbat"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.mentorBilanUchrashish', "Mentor bilan uchrashish"), description: tLabel('adaptation.ProgramsTab.birinchiYolYoriqlarOlish', "Birinchi yo'l-yo'riqlar olish"), day: 1 },
    ],
    checkpoints: [
      { day: 1, title: "Kirish kuni yakunlash", description: tLabel('adaptation.ProgramsTab.asosiyTushunchalarVaResurslarOlindi', "Asosiy tushunchalar va resurslar olindi") },
    ],
  },
  "1-week": {
    title: "1 haftalik adaptatsiya dasturi",
    titleRu: "Программа адаптации на 1 неделю",
    duration: 1,
    durationType: "week" as const,
    description: tLabel('adaptation.ProgramsTab.asosiyJarayonlarVaVazifalarBilan', "Asosiy jarayonlar va vazifalar bilan tanishish"),
    descriptionRu: "Знакомство с основными процессами и задачами",
    tasks: [
      { title: tLabel('adaptation.ProgramsTab.kompaniyaBilanTanishish', "Kompaniya bilan tanishish"), description: tLabel('adaptation.ProgramsTab.tarixiMissiyaQadriyatlar', "Tarixi, missiya, qadriyatlar"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.bolimBilanTanishish', "Bo'lim bilan tanishish"), description: tLabel('adaptation.ProgramsTab.jamoalarJarayonlarMaqsadlar', "Jamoalar, jarayonlar, maqsadlar"), day: 2 },
      { title: tLabel('adaptation.ProgramsTab.vazifalarBilanTanishish', "Vazifalar bilan tanishish"), description: tLabel('adaptation.ProgramsTab.asosiyMasuliyatlar', "Asosiy mas'uliyatlar"), day: 3 },
      { title: tLabel('adaptation.ProgramsTab.treningVaOquvMateriallar', "Trening va o'quv materiallar"), description: tLabel('adaptation.ProgramsTab.kerakliKonikmalarOrganish', "Kerakli ko'nikmalar o'rganish"), day: 4 },
      { title: "Birinchi vazifalarni bajarish", description: "Mentor nazorati ostida", day: 5 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta baholash", description: tLabel('adaptation.ProgramsTab.asosiyKonikmalarVaUmumiyTushunchalar', "Asosiy ko'nikmalar va umumiy tushunchalar") },
    ],
  },
  "1-month": {
    title: "1 oylik adaptatsiya dasturi",
    titleRu: "Программа адаптации на 1 месяц",
    duration: 1,
    durationType: "month" as const,
    description: tLabel('adaptation.ProgramsTab.toliqJarayonlargaKirishishVaMustaqil', "To'liq jarayonlarga kirishish va mustaqil ishlash"),
    descriptionRu: "Полное погружение в процессы и самостоятельная работа",
    tasks: [
      { title: "1-hafta: Kirish va tanishish", description: tLabel('adaptation.ProgramsTab.kompaniyaJamoaJarayonlar', "Kompaniya, jamoa, jarayonlar"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.2HaftaOquvVaTrening', "2-hafta: O'quv va trening"), description: tLabel('adaptation.ProgramsTab.kerakliKonikmalarniOzlashtirish', "Kerakli ko'nikmalarni o'zlashtirish"), day: 8 },
      { title: tLabel('adaptation.ProgramsTab.3HaftaAmaliyVazifalar', "3-hafta: Amaliy vazifalar"), description: tLabel('adaptation.ProgramsTab.mentorYordamiBilan', "Mentor yordami bilan"), day: 15 },
      { title: "4-hafta: Mustaqil ishlash", description: tLabel('adaptation.ProgramsTab.ozMasuliyatlariBoyicha', "O'z mas'uliyatlari bo'yicha"), day: 22 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta", description: tLabel('adaptation.ProgramsTab.asosiyTushunchalar', "Asosiy tushunchalar") },
      { day: 14, title: "2-hafta", description: tLabel('adaptation.ProgramsTab.oquvNatijalar', "O'quv natijalar") },
      { day: 21, title: "3-hafta", description: tLabel('adaptation.ProgramsTab.amaliyKonikmalar', "Amaliy ko'nikmalar") },
      { day: 30, title: "1-oy", description: tLabel('adaptation.ProgramsTab.toliqBaholashVaFeedback', "To'liq baholash va feedback") },
    ],
  },
  "3-month": {
    title: tLabel('adaptation.ProgramsTab.3OylikToliqAdaptatsiyaDasturi', "3 oylik to'liq adaptatsiya dasturi"),
    titleRu: "Полная программа адаптации на 3 месяца",
    duration: 3,
    durationType: "month" as const,
    description: "Keng qamrovli adaptatsiya va professional rivojlanish",
    descriptionRu: "Комплексная адаптация и профессиональное развитие",
    tasks: [
      { title: "1-oy: Asosiy adaptatsiya", description: tLabel('adaptation.ProgramsTab.jarayonlarKonikmalarMadaniyat', "Jarayonlar, ko'nikmalar, madaniyat"), day: 1 },
      { title: tLabel('adaptation.ProgramsTab.2OyChuqurOzlashtirish', "2-oy: Chuqur o'zlashtirish"), description: tLabel('adaptation.ProgramsTab.murakkabVazifalarLoyihalar', "Murakkab vazifalar, loyihalar"), day: 31 },
      { title: tLabel('adaptation.ProgramsTab.3OyToliqIntegratsiya', "3-oy: To'liq integratsiya"), description: tLabel('adaptation.ProgramsTab.mustaqilIshlashJamoaBilanHamkorlik', "Mustaqil ishlash, jamoa bilan hamkorlik"), day: 61 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta", description: "Kirish" },
      { day: 30, title: "1-oy", description: "Asosiy adaptatsiya" },
      { day: 60, title: "2-oy", description: tLabel('adaptation.ProgramsTab.chuqurOzlashtirish', "Chuqur o'zlashtirish") },
      { day: 90, title: "3-oy", description: "Yakuniy baholash" },
    ],
  },
};
