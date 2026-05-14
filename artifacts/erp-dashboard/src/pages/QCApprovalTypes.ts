/**
 * @module QCApprovalTypes
 * @description TypeScript interfaces, types, and constants for QC Approval module.
 */

export interface QCOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  mahsulotTuri?: string;
  formatA?: number;
  formatB?: number;
  tiraj?: number;
  status: string;
}

export interface QCTestResult {
  id: string;
  orderId: string;
  category: string;
  parameter: string;
  result: string;
  status: string;
}

export const TEST_CATEGORIES = [
  { id: "physical", name: "Fizik" },
  { id: "mechanical", name: "Mexanik" },
  { id: "printability", name: "Bosma" },
  { id: "chemical", name: "Kimyoviy" },
  { id: "environmental", name: "Atrof-muhit" },
] as const;

export const TEST_PARAMS_BY_CATEGORY: Record<string, string[]> = {
  physical: ["Qalinlik (mm)", "Gramaj (g/m²)", "Namlik (%)", "Zich'lik"],
  mechanical: ["ECT (kN/m)", "FCT (kN/m)", "BST (kPa)", "CMT (N)"],
  printability: ["Sirt silliqlik", "Oqlik (%)", "Bo'yash sifati", "Rasmlar aniqligi"],
  chemical: ["pH daraja", "Namlik singdirish (%)", "Kimyoviy tarkib"],
  environmental: ["Harorat bardoshligi", "Namlik bardoshligi", "UV bardoshligi"],
};
