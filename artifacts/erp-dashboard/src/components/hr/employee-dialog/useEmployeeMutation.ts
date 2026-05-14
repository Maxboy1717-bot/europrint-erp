/**
 * @module useEmployeeMutation
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import { EmployeeFormData } from "./types";

interface UseEmployeeMutationProps {
  isEdit: boolean;
  employeeId?: string;
  onAfterSubmit: (empId: string) => Promise<void>;
}

/**
 * Auth header bilan fetch — JWT token avtomatik qo'shiladi.
 * fetch() to'g'ridan-to'g'ri ishlatish o'rniga shu funksiyani chaqiring.
 */
const authFetch = (url: string, init: RequestInit = {}): Promise<Response> => {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  return fetch(url, { ...init, headers, credentials: "include" });
};

export function useEmployeeMutation({ isEdit, employeeId, onAfterSubmit }: UseEmployeeMutationProps) {
  const { toast } = useToast();

  // NestJS GlobalExceptionFilter `{statusCode, message, error}` qaytaradi —
  // `message` asosiy xato matn (string yoki array). `.error` faqat HTTP status nomi.
  const extractErrorMessage = async (response: Response): Promise<string> => {
    try {
      const body = await response.json();
      if (typeof body?.message === "string") return body.message;
      if (Array.isArray(body?.message)) return body.message.join(", ");
      if (typeof body?.error === "string") return body.error;
      return `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  };

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
      const response = await authFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));
      return response.json();
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
      const response = await authFetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));
      return response.json();
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
