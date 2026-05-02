import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EmployeeFormData } from "./types";

interface UseEmployeeMutationProps {
  isEdit: boolean;
  employeeId?: string;
  onAfterSubmit: (empId: string) => Promise<void>;
}

export function useEmployeeMutation({ isEdit, employeeId, onAfterSubmit }: UseEmployeeMutationProps) {
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Xatolik yuz berdi");
      return response.json();
    },
    onSuccess: async (data) => {
      await onAfterSubmit(data.id).catch(() => null);
      toast({ title: "Xodim muvaffaqiyatli qo'shildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Xatolik yuz berdi");
      return response.json();
    },
    onSuccess: async () => {
      if (employeeId) await onAfterSubmit(employeeId).catch(() => null);
      toast({ title: "Xodim ma'lumotlari yangilandi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    const cleanData: Record<string, unknown> = {};
    const numericFields = ["age", "childrenCount", "householdSize"];
    const floatFields = ["latitude", "longitude"];
    const clearableFields = [
      "departmentId", "positionId", "shift", "salaryType", "workshopZone",
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
