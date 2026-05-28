/**
 * @module useEmployeeMutation
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeFormData } from "./types";

interface UseEmployeeMutationProps {
  isEdit: boolean;
  employeeId?: string;
  onAfterSubmit: (empId: string) => Promise<void>;
}

export function useEmployeeMutation({ isEdit, employeeId, onAfterSubmit }: UseEmployeeMutationProps) {
  const { toast } = useToast();

  const safeToast = (title: string, description?: string, variant?: "destructive") => {
    try {
      toast({ title, description, variant });
    } catch (e) {
      // Toast hook nadir holatda bug bersa — console fallback
      // eslint-disable-next-line no-console
      console.warn("[useEmployeeMutation] toast failed:", e, { title, description });
    }
  };

  /** Split "Ali Vali Valiyev" → firstName="Ali", middleName="Vali", lastName="Valiyev" */
  const splitFullName = (data: Record<string, unknown>): Record<string, unknown> => {
    if (typeof data.fullName !== 'string') return data;
    const parts = data.fullName.trim().split(/\s+/);
    let firstName: string;
    let middleName: string | undefined;
    let lastName: string;

    if (parts.length >= 3) {
      firstName  = parts[0] ?? '';
      middleName = parts.slice(1, parts.length - 1).join(' ');
      lastName   = parts[parts.length - 1] ?? '';
    } else if (parts.length === 2) {
      firstName = parts[0] ?? '';
      lastName  = parts[1] ?? '';
    } else {
      firstName = parts[0] ?? '';
      lastName  = parts[0] ?? '';
    }

    const { fullName: _dropped, ...rest } = data;
    return { ...rest, firstName, lastName, ...(middleName ? { middleName } : {}) };
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest<{ id?: string | number }>('POST', "/api/hr/employees", splitFullName(data));
    },
    onSuccess: async (data) => {
      const id = data?.id ? String(data.id) : "";
      if (id) await onAfterSubmit(id).catch(() => null);
      safeToast("Xodim muvaffaqiyatli qo'shildi");
    },
    onError: (error: Error) => {
      safeToast("Xatolik", error?.message ?? "Noma'lum xato", "destructive");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest('PATCH', `/api/hr/employees/${employeeId}`, splitFullName(data));
    },
    onSuccess: async () => {
      if (employeeId) await onAfterSubmit(employeeId).catch(() => null);
      safeToast("Xodim ma'lumotlari yangilandi");
    },
    onError: (error: Error) => {
      safeToast("Xatolik", error?.message ?? "Noma'lum xato", "destructive");
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    const cleanData: Record<string, unknown> = {};
    // Phase 2 / Task 2.5 — managerId is an integer FK; baseSalary is a
    // decimal stored as digit-only string from BaseSalaryInput. Both pass
    // through with type coercion below.
    const numericFields = ["age", "childrenCount", "householdSize", "managerId"];
    const floatFields = ["latitude", "longitude", "baseSalary"];
    const clearableFields = [
      "departmentId", "positionId", "managerId", "baseSalary",
      "shift", "salaryType", "workshopZone",
      "telegramChatId", "birthDate", "hireDate", "address", "attestationDate",
      "gender", "maritalStatus", "childrenEducation", "householdMembers",
      "housingType", "age", "childrenCount", "householdSize", "latitude", "longitude",
    ];

    Object.entries(data).forEach(([key, value]) => {
      const isEmpty = value === undefined || value === null || value === "";
      if (isEmpty) {
        if (isEdit && clearableFields.includes(key)) cleanData[key] = null;
        return;
      }
      if (numericFields.includes(key)) {
        const parsed = parseInt(value as string, 10);
        cleanData[key] = isNaN(parsed) ? null : parsed;
      } else if (floatFields.includes(key)) {
        const parsed = parseFloat(value as string);
        cleanData[key] = isNaN(parsed) ? null : parsed;
      } else {
        cleanData[key] = value;
      }
    });

    if (isEdit) updateMutation.mutate(cleanData);
    else createMutation.mutate(cleanData);
  };

  return {
    onSubmit,
    isPending: createMutation.isPending || updateMutation.isPending
  };
}
