/**
 * @module RACIMatrixPageTypes
 * @description TypeScript interfaces, types, and pure helper functions for RACIMatrixPage.
 */

export interface RACIAssignment {
  role: "R" | "A" | "C" | "I";
  employeeName: string;
  position?: string;
}

export interface RACITask {
  id: string;
  taskName: string;
  taskNameRu?: string;
  description?: string;
  category: string;
  isActive?: boolean;
  assignments?: RACIAssignment[];
}

export interface BusinessStage {
  id: string;
  stageNumber: number;
  name: string;
  employeeMin?: number;
  employeeMax?: number;
  keyChallenges?: string[];
}

export interface Crisis {
  id: string;
  name: string;
  type: string;
  symptoms?: string[];
  solutions?: string[];
}

export const roleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (role) {
    case "R":
      return "default";
    case "A":
      return "destructive";
    case "C":
      return "secondary";
    case "I":
      return "outline";
    default:
      return "secondary";
  }
};

export const roleLabel = (role: string): string => {
  switch (role) {
    case "R":
      return "Responsible";
    case "A":
      return "Accountable";
    case "C":
      return "Consulted";
    case "I":
      return "Informed";
    default:
      return role;
  }
};
