/**
 * @module types
 * @description React UI component.
 */

export interface NodeEmployee {
  id: number;
  fullName: string;
  employeeId?: string;
  phone?: string;
  role?: string;
  status?: string;
  salary?: number | null;
  yearsOfService?: number | null;
}

export interface ChildNode {
  id: number;
  name: string;
  color: string;
  nodeType: string;
  employeeCount: number;
}

export interface NodeDetail {
  id: number;
  name: string;
  nameRu?: string;
  description?: string;
  descriptionRu?: string;
  color: string;
  tskp?: string;
  tskpRu?: string;
  parentId?: number | null;
  parentName?: string | null;
  hierarchyLevel: number;
  nodeType: string;
  isActive: boolean;
  headUserId?: number | null;
  headUserName?: string | null;
  headUserEmployeeId?: string | null;
  razryadLevelId?: number | null;
  // VISION node=karta — to'liq karta-maydonlari
  salaryType?: string | null;
  minSalary?: number | string | null;
  maxSalary?: number | string | null;
  rbacTier?: string | null;
  tskpTarget?: number | string | null;
  tskpMeasurementUnit?: string | null;
  workSchedule?: string | null;
  currentState?: string | null;
  bonusConfig?: string | null;
  employeeCount: number;
  childCount: number;
  vacantChildCount?: number;
  employees: NodeEmployee[];
  children: ChildNode[];
}

export interface HistoryEntry {
  id: number;
  action: string;
  changedBy: string;
  changedAt: string;
  details: string;
}

export interface FolderItem {
  id: number;
  nodeId: number;
  itemType: "document" | "video" | "test";
  title: string;
  url?: string;
  description?: string;
  lmsCourseId?: number;
  createdAt: string;
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  owner: "Egasi",
  top_director: "Bosh Direktor",
  director: "Direktor",
  department: "Bo'lim",
  section: "Sektor",
};

export const LEVEL_COLORS: Record<number, string> = {
  0: "#7c3aed",
  1: "#1d4ed8",
  2: "#16a34a",
  3: "#b45309",
  4: "#dc2626",
};
