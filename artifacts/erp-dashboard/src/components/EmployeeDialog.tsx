/**
 * @module EmployeeDialog
 * @description React UI component.
 */

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { queryClient, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  employeeSchema,
  EmployeeFormData,
  EmployeeDialogProps,
  OrgDepartment
} from "./hr/employee-dialog/types";
import { BasicInfoSection } from "./hr/employee-dialog/BasicInfoSection";
// PositionSection (legacy Bo'lim/Lavozim → /api/departments + /api/positions) removed —
// employee dept/function is owned by the org-schema (OrgStructureSection / org_departments).
import { ContractSection } from "./hr/employee-dialog/ContractSection";
import { PersonalInfoSection } from "./hr/employee-dialog/PersonalInfoSection";
import { HouseholdSection } from "./hr/employee-dialog/HouseholdSection";
import { OrgStructureSection } from "./hr/employee-dialog/OrgStructureSection";
import { ProfileImageSection } from "./hr/employee-dialog/ProfileImageSection";
import { ManagerSalarySection } from "./hr/employee-dialog/ManagerSalarySection";
import { useEmployeeMutation } from "./hr/employee-dialog/useEmployeeMutation";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const isEdit = !!employee;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOrgDepts, setSelectedOrgDepts] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  // Modal ochilganda chaqiruvlar — yopiq bo'lsa hech narsa chaqirilmaydi (auth tekshirilmagan ham)
  const { data: orgDepartments = [] } = useQuery<OrgDepartment[]>({
    queryKey: ["/api/org-departments"],
    enabled: open === true,
  });

  // Edit rejimida: xodim allaqachon biriktirilgan funksiyalarni olamiz
  // (rahbar bo'lgan + ishlovchi bo'lgan barcha funksiyalar)
  const { data: assignedDeptsData } = useQuery<{ orgDepartmentIds: string[] }>({
    queryKey: [`/api/employees/${employee?.id}/org-departments`],
    enabled: open === true && !!employee?.id,
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      employeeId: "",
      phone: "",
      departmentId: "",
      positionId: "",
      managerId: "",
      baseSalary: "",
      shift: "",
      salaryType: "",
      workshopZone: "",
      status: "active",
      telegramChatId: "",
      birthDate: "",
      hireDate: "",
      address: "",
      attestationDate: "",
      gender: "",
      childrenCount: "",
      maritalStatus: "",
      childrenEducation: "",
      householdSize: "",
      householdMembers: "",
      housingType: "",
      latitude: "",
      longitude: "",
    },
  });

  const lastInitializedId = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      lastInitializedId.current = null;
      return;
    }
    
    const currentKey = employee?.id ?? "__new__";
    if (lastInitializedId.current === currentKey) {
      return;
    }
    
    lastInitializedId.current = currentKey;
    
    if (employee) {
      setPreviewUrl(employee.profileImageUrl || null);
      setSelectedFile(null);
      setOrgSearchQuery("");
      
      form.reset({
        fullName: employee.fullName || "",
        employeeId: employee.employeeId || "",
        phone: employee.phone || "",
        departmentId: employee.departmentId || "",
        positionId: employee.positionId || "",
        managerId: employee.managerId !== undefined && employee.managerId !== null
          ? String(employee.managerId)
          : "",
        baseSalary: employee.baseSalary !== undefined && employee.baseSalary !== null
          ? String(employee.baseSalary)
          : "",
        shift: employee.shift || "",
        salaryType: employee.salaryType || "",
        workshopZone: employee.workshopZone || "",
        status: employee.status || "active",
        telegramChatId: employee.telegramChatId || "",
        birthDate: employee.birthDate || "",
        hireDate: employee.hireDate || "",
        address: employee.address || "",
        attestationDate: employee.attestationDate || "",
        gender: employee.gender || "",
        childrenCount: employee.childrenCount?.toString() || "",
        maritalStatus: employee.maritalStatus || "",
        childrenEducation: employee.childrenEducation || "",
        householdSize: employee.householdSize?.toString() || "",
        householdMembers: employee.householdMembers || "",
        housingType: employee.housingType || "",
        latitude: employee.latitude?.toString() || "",
        longitude: employee.longitude?.toString() || "",
      });
      
      // Xodim'ning barcha biriktirilgan funksiyalari (rahbar + ishlovchi)
      // Backend'dan kelgan haqiqiy assignment'lar (employee_org_departments orqali)
      if (Array.isArray(assignedDeptsData?.orgDepartmentIds)) {
        setSelectedOrgDepts(assignedDeptsData.orgDepartmentIds);
      } else if (orgDepartments.length > 0) {
        // Fallback: backend assignedDeptsData kelmasa, faqat rahbar bo'lgan funksiyalar
        const fallbackIds = orgDepartments
          .filter(d => String(d.headUserId) === String(employee.id))
          .map(d => String(d.id));
        setSelectedOrgDepts(fallbackIds);
      }
    } else {
      form.reset({
        fullName: "",
        employeeId: "",
        phone: "",
        departmentId: "",
        positionId: "",
        shift: "",
        salaryType: "",
        workshopZone: "",
        status: "active",
        telegramChatId: "",
        birthDate: "",
        hireDate: "",
        address: "",
        attestationDate: "",
        gender: "",
        childrenCount: "",
        maritalStatus: "",
        childrenEducation: "",
        householdSize: "",
        householdMembers: "",
        housingType: "",
        latitude: "",
        longitude: "",
      });
      setPreviewUrl(null);
      setSelectedFile(null);
      setSelectedOrgDepts([]);
      setOrgSearchQuery("");
    }
  }, [open, employee, form, orgDepartments, assignedDeptsData]);

  const handleAfterSubmit = async (empId: string) => {
    // Profile image — 2-step upload (bug fix: FormData was built but never sent, and the
    // profile-image endpoint expects {imageUrl}, not a raw file, so a fixed single-call
    // version still couldn't have worked). Same PUT /storage/upload -> POST {imageUrl}
    // pattern already used by FolderTab.tsx/CashierHub.tsx.
    if (selectedFile) {
      try {
        const safeName = selectedFile.name.replace(/[^\w.\-]+/g, "_");
        const key = `hr-employees/${empId}/${Date.now()}-${safeName}`;
        const fd = new FormData();
        fd.append("file", selectedFile, selectedFile.name);
        await apiRequest('PUT', `/api/storage/upload?key=${encodeURIComponent(key)}&mime=${encodeURIComponent(selectedFile.type || "application/octet-stream")}`, fd);
        await apiRequest('POST', `/api/hr/employees/${empId}/profile-image`, { imageUrl: `/api/storage/${key}` });
      } catch {
        // Silently fail — asosiy xodim yaratilgan, rasm yuklash optional
      }
    }
    // Org functions — JSON, apiRequest throws on non-2xx
    try {
      await apiRequest('POST', `/api/employees/${empId}/assign-org-functions`, { orgDepartmentIds: selectedOrgDepts });
    } catch (e) {
      const msg = (e as { message?: string })?.message;
      toast({
        title: "Ogohlantirish",
        description: msg || "Tashkiliy funksiyalarni saqlashda xatolik",
        variant: "destructive",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-departments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
    onOpenChange(false);
  };

  const { onSubmit, isPending } = useEmployeeMutation({
    isEdit,
    employeeId: employee?.id,
    onAfterSubmit: handleAfterSubmit
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{isEdit ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Xodim ma'lumotlarini o'zgartiring" : "Yangi xodim ma'lumotlarini kiriting"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProfileImageSection 
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              setSelectedFile={setSelectedFile}
              onToast={(t, d, v) => toast({ title: t, description: d, variant: v })}
            />

            <OrgStructureSection 
              orgSearchQuery={orgSearchQuery} 
              setOrgSearchQuery={setOrgSearchQuery}
              selectedOrgDepts={selectedOrgDepts}
              setSelectedOrgDepts={setSelectedOrgDepts}
              orgDepartments={orgDepartments}
              employee={employee}
            />

            <div className="space-y-8">
              <section><h3 className="text-lg font-medium mb-4">{t("asosiyMalumotlar")}</h3><BasicInfoSection form={form} /></section>
              {/* Phase 2 / Task 2.5 — manager autocomplete + currency-formatted base salary with grade picker */}
              <section><h3 className="text-lg font-medium mb-4">Rahbar va asosiy maosh</h3><ManagerSalarySection form={form} excludeEmployeeId={employee?.id} /></section>
              <section><h3 className="text-lg font-medium mb-4">{t("shartnomaVaIshHaqi")}</h3><ContractSection form={form} /></section>
              {/* Personal + household/GPS are profile-level detail — shown only when
                  EDITING, so "Yangi xodim qo'shish" stays lean (core fields only).
                  These get filled after the employee exists (edit profile). */}
              {isEdit && (
                <>
                  <section><h3 className="text-lg font-medium mb-4">{t("shaxsiyMalumotlar")}</h3><PersonalInfoSection form={form} /></section>
                  <section><h3 className="text-lg font-medium mb-4">{t("uyJoyVaJoylashuv")}</h3><HouseholdSection form={form} /></section>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


