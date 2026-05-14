/**
 * @module types
 * @description React UI component.
 */

import { z } from "zod";
import { UseFormReturn } from "react-hook-form";

export const employeeSchema = z.object({
  fullName: z.string().min(1, "To'liq ismni kiriting"),
  employeeId: z.string().min(1, "Tabel raqamini kiriting"),
  phone: z.string().min(1, "Telefon raqamini kiriting"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  shift: z.string().optional(),
  salaryType: z.string().optional(),
  workshopZone: z.string().optional(),
  status: z.string().optional(),
  telegramChatId: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  attestationDate: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  childrenCount: z.string().optional(),
  maritalStatus: z.string().optional(),
  childrenEducation: z.string().optional(),
  householdSize: z.string().optional(),
  householdMembers: z.string().optional(),
  housingType: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: {
    id: string;
    fullName: string;
    employeeId: string;
    phone?: string;
    departmentId?: string;
    positionId?: string;
    shift?: string;
    salaryType?: string;
    workshopZone?: string;
    status?: string;
    telegramChatId?: string;
    birthDate?: string;
    hireDate?: string;
    address?: string;
    attestationDate?: string;
    age?: number;
    gender?: string;
    childrenCount?: number;
    maritalStatus?: string;
    childrenEducation?: string;
    householdSize?: number;
    householdMembers?: string;
    housingType?: string;
    profileImageUrl?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface Department {
  id: string;
  name: string;
  nameRu?: string;
}

export interface Position {
  id: string;
  name: string;
  nameRu?: string;
  departmentId?: string;
}

export interface OrgDepartment {
  id: string;
  name: string;
  nameRu?: string;
  tskp?: string;
  hierarchyLevel: number;
  nodeType: string;
  headUserId?: string | null;
  headUserName?: string | null;
}

export interface FormSectionProps {
  form: UseFormReturn<EmployeeFormData>;
}
