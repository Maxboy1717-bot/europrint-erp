/**
 * @module AddCourseDialog
 * @description React UI component.
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
;
import { Separator } from "@/components/ui/separator";
import { CourseBasicInfoForm } from "./lms/CourseBasicInfoForm";
import { CourseContentForm } from "./lms/CourseContentForm";
import { CourseSettingsForm } from "./lms/CourseSettingsForm";
import { MentorForm } from "./lms/MentorForm";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface Course {
  id: string;
  code: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  isRequired: boolean;
  level: "beginner" | "intermediate" | "advanced";
  departmentId: string | null;
  mentorId: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
}

export function AddCourseDialog({ open, onOpenChange, course }: AddCourseDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const isEditMode = !!course;
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    titleRu: "",
    description: "",
    descriptionRu: "",
    departmentId: "all",
    mentorId: "",
    isRequired: false,
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (isEditMode && course) {
      setFormData({
        code: course.code,
        title: course.title,
        titleRu: course.titleRu,
        description: course.description,
        descriptionRu: course.descriptionRu,
        departmentId: course.departmentId || "all",
        mentorId: course.mentorId || "",
        isRequired: course.isRequired,
        level: course.level,
        startDate: course.startDate || "",
        endDate: course.endDate || "",
      });
    }
  }, [course, isEditMode, open]);

  const [mentorData, setMentorData] = useState({
    name: "",
    bio: "",
    source: "",
    achievements: "",
    experience: "",
    expertise: "",
    userId: "",
  });

  interface OrgDepartment {
    id: string;
    name: string;
  }

  interface Employee {
    id: string;
    fullName: string;
    employeeId: string;
  }

  interface Mentor {
    id: string;
    name: string;
    source?: string;
  }

  const { data: orgDepartments = [] } = useQuery<OrgDepartment[]>({
    queryKey: ["/api/org-departments"],
  });

  const { data: employeesResponse } = useQuery<{ data: Employee[] } | Employee[]>({
    queryKey: ["/api/employees"],
  });
  
  const employees = Array.isArray(employeesResponse) ? employeesResponse : (employeesResponse?.data || []);

  const { data: mentors = [] } = useQuery<Mentor[]>({
    queryKey: ["/api/mentors"],
  });

  const createMentorMutation = useMutation({
    mutationFn: async (data: typeof mentorData) => {
      return await apiRequest("POST", "/api/mentors", data);
    },
    onSuccess: (newMentor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      setFormData({ ...formData, mentorId: newMentor.id });
      setShowMentorForm(false);
      setMentorData({
        name: "",
        bio: "",
        source: "",
        achievements: "",
        experience: "",
        expertise: "",
        userId: "",
      });
      toast({
        title: "Muvaffaqiyat",
        description: "Mentor muvaffaqiyatli qo'shildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Mentor qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        departmentId: data.departmentId === "all" ? null : data.departmentId,
      };
      
      if (isEditMode && course) {
        return await apiRequest("PUT", `/api/courses/${course.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/courses", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Muvaffaqiyat",
        description: isEditMode ? "Kurs muvaffaqiyatli yangilandi" : "Kurs muvaffaqiyatli yaratildi",
      });
      onOpenChange(false);
      setFormData({
        code: "",
        title: "",
        titleRu: "",
        description: "",
        descriptionRu: "",
        departmentId: "all",
        mentorId: "",
        isRequired: false,
        level: "beginner",
        startDate: "",
        endDate: "",
      });
      setShowMentorForm(false);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: isEditMode ? "Kurs yangilanishda xatolik yuz berdi" : "Kurs yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMentorMutation.mutate(mentorData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{isEditMode ? "Kursni tahrirlash" : "Yangi kurs qo'shish"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Kurs ma'lumotlarini yangilang" : "Yangi o'quv kursini yaratish uchun quyidagi ma'lumotlarni kiriting"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CourseBasicInfoForm formData={formData} setFormData={(partial) => setFormData((prev) => ({ ...prev, ...partial }))} orgDepartments={orgDepartments} />
          <CourseContentForm formData={formData} setFormData={(partial) => setFormData((prev) => ({ ...prev, ...partial }))} />

          <Separator className="my-4" />

          <MentorForm 
            showMentorForm={showMentorForm}
            setShowMentorForm={setShowMentorForm}
            mentorId={formData.mentorId}
            setMentorId={(id) => setFormData({ ...formData, mentorId: id })}
            mentors={mentors}
            mentorData={mentorData}
            setMentorData={setMentorData}
            handleMentorSubmit={handleMentorSubmit}
            createMentorPending={createMentorMutation.isPending}
            employees={employees}
          />

          <Separator className="my-4" />

          <CourseSettingsForm formData={formData} setFormData={(partial) => setFormData((prev) => ({ ...prev, ...partial }))} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
              {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              {isEditMode ? "Yangilash" : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
