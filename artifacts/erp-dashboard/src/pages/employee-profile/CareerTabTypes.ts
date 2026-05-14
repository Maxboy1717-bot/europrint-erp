/**
 * @module CareerTabTypes
 * @description Types and constants for CareerTab.
 */

export interface CareerProfile {
  nextRecommendedPosition?: string;
  successionFor?: string;
  crossTrainingStatus?: string;
  crossTrainingNotes?: string;
  careerPathDirection?: string;
  notes?: string;
}

export interface TransferRecord {
  id: string;
  transferDate: string;
  transferType: string;
  fromDepartment: string | null;
  toDepartment: string | null;
  fromPosition: string | null;
  toPosition: string | null;
  reason: string | null;
}

export interface CareerData {
  profile: CareerProfile | null;
  timeInPosition: string;
  aiRecommendedPosition: string;
  currentRole: string;
  hireDate: string;
  transferHistory: TransferRecord[];
}

export interface CareerTabProps {
  employeeId: string;
}

export interface CareerFormState {
  nextRecommendedPosition: string;
  successionFor: string;
  crossTrainingStatus: string;
  crossTrainingNotes: string;
  careerPathDirection: string;
  notes: string;
}

export const CROSS_TRAINING_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Boshlanmagan", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Davom etmoqda", color: "bg-yellow-500/10 text-[var(--ep-yellow)]" },
  completed: { label: "Bajarildi", color: "bg-green-500/10 text-[var(--ep-green)]" },
};

export const TRANSFER_TYPE_LABELS: Record<string, string> = {
  department: "Bo'lim o'zgarishi",
  position: "Lavozim o'zgarishi",
  promotion: "Ko'tarilish",
  demotion: "Tushirilish",
  work_center: "Ish markazi o'zgarishi",
};

export function buildFormFromProfile(profile: CareerProfile): CareerFormState {
  return {
    nextRecommendedPosition: profile.nextRecommendedPosition || "",
    successionFor: profile.successionFor || "",
    crossTrainingStatus: profile.crossTrainingStatus || "not_started",
    crossTrainingNotes: profile.crossTrainingNotes || "",
    careerPathDirection: profile.careerPathDirection || "",
    notes: profile.notes || "",
  };
}
