/**
 * @module AddTestDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
;

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface AddTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTestDialog({ open, onOpenChange }: AddTestDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    titleRu: "",
    courseId: "none",
    moduleId: "",
    departmentId: "none",
    passPercentage: "80",
    timeLimit: "",
    maxAttempts: "3",
    randomizeQuestions: true,
  });

  interface Course {
    id: string;
    title: string;
  }

  interface Department {
    id: string;
    name: string;
  }

  interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
  }

  const { data: coursesResponse } = useQuery<{ data: Course[]; pagination: PaginationInfo }>({
    queryKey: ["/api/courses"],
  });
  const courses = coursesResponse?.data || [];

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/org-departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/tests", {
        ...data,
        passPercentage: parseInt(data.passPercentage),
        timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null,
        maxAttempts: parseInt(data.maxAttempts),
        courseId: data.courseId === "none" ? null : data.courseId,
        moduleId: data.moduleId || null,
        departmentId: data.departmentId === "none" ? null : data.departmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Test muvaffaqiyatli yaratildi",
      });
      onOpenChange(false);
      setFormData({
        title: "",
        titleRu: "",
        courseId: "none",
        moduleId: "",
        departmentId: "none",
        passPercentage: "80",
        timeLimit: "",
        maxAttempts: "3",
        randomizeQuestions: true,
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Test yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiTestYaratish")}</DialogTitle>
          <DialogDescription>
            {t("testUchunAsosiyParametrlarniBelgilang")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
          <Label htmlFor="testTitle">{t("testNameUz")} *</Label>
            <Input
              id="testTitle"
              placeholder={t("texnikaXavfsizligiTesti")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="input-test-title"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="testTitleRu">{t("testNameRu")} *</Label>
            <Input
              id="testTitleRu"
              placeholder={t("safetyTestPlaceholder")}
              value={formData.titleRu}
              onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
              required
              data-testid="input-test-title-ru"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="testCourse">{t("courseOptional")}</Label>
            <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
              <SelectTrigger data-testid="select-test-course" className="h-9">
                <SelectValue placeholder={t("kursniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("boglanmagan")}</SelectItem>
                {(Array.isArray(courses) ? courses : []).map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="testDepartment">{t("departmentOptional")}</Label>
              <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                <SelectTrigger data-testid="select-test-department" className="h-9">
                  <SelectValue placeholder={t("bolimniTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("Barchasi")}</SelectItem>
                  {(Array.isArray(departments) ? departments : []).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label htmlFor="passPercentage">{t("otishFoizi")}</Label>
              <Input
                id="passPercentage"
                type="number"
                min="1"
                max="100"
                value={formData.passPercentage}
                onChange={(e) => setFormData({ ...formData, passPercentage: e.target.value })}
                required
                data-testid="input-pass-percentage"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="timeLimit">{t("timeMinutes")}</Label>
              <Input
                id="timeLimit"
                type="number"
                placeholder="30"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                data-testid="input-time-limit"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="maxAttempts">{t("urinishlar")}</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                required
                data-testid="input-max-attempts"
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-2">
            <Label htmlFor="randomize" className="cursor-pointer">
              {t("savollarniAralashtirish")}
            </Label>
            <Switch
              id="randomize"
              checked={formData.randomizeQuestions}
              onCheckedChange={(checked) => setFormData({ ...formData, randomizeQuestions: checked })}
              data-testid="switch-randomize"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-test">
              {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
