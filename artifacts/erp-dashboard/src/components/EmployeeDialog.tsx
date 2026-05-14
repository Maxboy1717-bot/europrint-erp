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
  Department, 
  Position, 
  OrgDepartment 
} from "./hr/employee-dialog/types";
import { BasicInfoSection } from "./hr/employee-dialog/BasicInfoSection";
import { PositionSection } from "./hr/employee-dialog/PositionSection";
import { ContractSection } from "./hr/employee-dialog/ContractSection";
import { PersonalInfoSection } from "./hr/employee-dialog/PersonalInfoSection";
import { HouseholdSection } from "./hr/employee-dialog/HouseholdSection";
import { OrgStructureSection } from "./hr/employee-dialog/OrgStructureSection";
import { ProfileImageSection } from "./hr/employee-dialog/ProfileImageSection";
import { useEmployeeMutation } from "./hr/employee-dialog/useEmployeeMutation";
import { apiRequest } from '@/lib/queryClient';

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
  const { toast } = useToast();
  const isEdit = !!employee;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOrgDepts, setSelectedOrgDepts] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  // Modal ochilganda chaqiruvlar — yopiq bo'lsa hech narsa chaqirilmaydi (auth tekshirilmagan ham)
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: open === true,
  });

  const { data: allPositions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: open === true,
  });

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
      shift: "",
      salaryType: "",
      workshopZone: "",
      status: "active",
      telegramChatId: "",
      birthDate: "",
      hireDate: "",
      address: "",
      attestationDate: "",
      age: "",
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
        shift: employee.shift || "",
        salaryType: employee.salaryType || "",
        workshopZone: employee.workshopZone || "",
        status: employee.status || "active",
        telegramChatId: employee.telegramChatId || "",
        birthDate: employee.birthDate || "",
        hireDate: employee.hireDate || "",
        address: employee.address || "",
        attestationDate: employee.attestationDate || "",
        age: employee.age?.toString() || "",
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
        age: "",
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
    // Profile image — FormData (Content-Type avtomatik), faqat Authorization header
    if (selectedFile) {
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        await apiRequest('POST', `/api/employees/${empId}/profile-image`);
      } catch {
        // Silently fail — asosiy xodim yaratilgan, rasm yuklash optional
      }
    }
    // Org functions — JSON, Authorization header bilan
    const orgRes = await apiRequest('POST', `/api/employees/${empId}/assign-org-functions`, { orgDepartmentIds: selectedOrgDepts });
    if (!orgRes.ok) {
      const orgError = await orgRes.json().catch(() => ({ error: "Funktsiyalarni saqlashda xatolik" }));
      toast({
        title: "Ogohlantirish",
        description: orgError.message || orgError.error || "Tashkiliy funksiyalarni saqlashda xatolik",
        variant: "destructive",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
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
              <section><h3 className="text-lg font-medium mb-4">Asosiy ma'lumotlar</h3><BasicInfoSection form={form} /></section>
              <section><h3 className="text-lg font-medium mb-4">Bo'lim va Lavozim</h3><PositionSection form={form} departments={departments} positions={allPositions} /></section>
              <section><h3 className="text-lg font-medium mb-4">Shartnoma va Ish haqi</h3><ContractSection form={form} /></section>
              <section><h3 className="text-lg font-medium mb-4">Shaxsiy ma'lumotlar</h3><PersonalInfoSection form={form} /></section>
              <section><h3 className="text-lg font-medium mb-4">Uy-joy va Joylashuv</h3><HouseholdSection form={form} /></section>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
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


