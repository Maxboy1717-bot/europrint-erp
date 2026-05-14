/**
 * @module QCFinalInspectionTypes
 * @description TypeScript interfaces, types, and constants for QCFinalInspection page.
 */

export interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj?: number;
  status: string;
}

export interface FinalInspection {
  id: string;
  papkaOrderId: string;
  status: string;
  sampleQty: number;
  defectQty: number;
  defectRate: number;
  visualOk: boolean;
  dimensionsOk: boolean;
  printOk: boolean;
  packagingOk: boolean;
  comments?: string;
  inspectedAt: string;
}

// TZ_04 (04-08): statusMap ga qc_final qo'shildi
export const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Qoralama", color: "secondary" },
  pending_design: { label: "Dizayn kutilmoqda", color: "outline" },
  pending_tech: { label: "Texnik kutilmoqda", color: "outline" },
  pending_qc: { label: "QC kutilmoqda", color: "outline" },
  approved: { label: "Tasdiqlangan", color: "default" },
  ready_for_planning: { label: "Rejalashtirish uchun tayyor", color: "default" },
  planned: { label: "Rejalashtirilgan", color: "default" },
  production: { label: "Ishlab chiqarishda", color: "default" },
  qc_final: { label: "Yakuniy QC", color: "outline" },
  completed: { label: "Tugallangan", color: "default" },
  cancelled: { label: "Bekor qilingan", color: "destructive" },
};
