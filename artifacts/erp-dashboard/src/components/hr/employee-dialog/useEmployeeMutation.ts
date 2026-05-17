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

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest<{ id?: string | number }>('POST', "/api/employees", data);
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
      return await apiRequest('PATCH', `/api/employees/${employeeId}`, data);
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
