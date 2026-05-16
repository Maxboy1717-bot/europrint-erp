/** @module ProgramsTab @description Route-level page component. Owns state, mutations, and top-level layout for adaptation programs. */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AdaptationProgram } from "@shared/schema";

import {
  DEFAULT_FORM,
  PROGRAM_TEMPLATES,
  type ProgramFormState,
  type ProgramsTabProps,
  type UpdateMutationPayload,
  type TaskItem,
  type CheckpointItem,
} from "./ProgramsTabTypes";
import {
  TemplatesDialog,
  ProgramFormDialog,
  DeleteConfirmDialog,
} from "./ProgramsTabDialogs";
import { ProgramsTable } from "./ProgramsTabTable";
import { useTranslation } from '@/lib/i18n';

export function ProgramsTab({ programs, departments, positions }: ProgramsTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AdaptationProgram | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState<ProgramFormState>(DEFAULT_FORM);

  const setField = <K extends keyof ProgramFormState>(
    key: K,
    value: ProgramFormState[K],
  ) => setForm(prev => ({ ...prev, [key]: value }));

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/adaptation/programs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setIsDialogOpen(false);
      toast({ title: "Dastur muvaffaqiyatli yaratildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Dastur yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: UpdateMutationPayload) =>
      apiRequest("PUT", `/api/adaptation/programs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setIsDialogOpen(false);
      toast({ title: "Dastur muvaffaqiyatli yangilandi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Dasturni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/adaptation/programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setDeleteId(null);
      toast({ title: "Dastur o'chirildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Dasturni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const openProgramDialog = (program?: AdaptationProgram) => {
    if (program) {
      setForm({
        title: program.title || "",
        titleRu: program.titleRu || "",
        description: program.description || "",
        descriptionRu: program.descriptionRu || "",
        duration: program.duration || 1,
        durationType: program.durationType || "day",
        departmentId: program.departmentId || "all",
        positionId: program.positionId || "all",
        mentorRequired: program.mentorRequired ?? true,
        status: program.status || "active",
        tasks: (Array.isArray(program.tasks) ? program.tasks : []) as TaskItem[],
        checkpoints: (Array.isArray(program.checkpoints)
          ? program.checkpoints
          : []) as CheckpointItem[],
      });
      setEditingProgram(program);
    } else {
      setForm(DEFAULT_FORM);
      setEditingProgram(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.titleRu.trim()) {
      toast({ title: "Xatolik", description: "Nomi (UZ va RU) majburiy", variant: "destructive" });
      return;
    }
    if (form.tasks?.find(t => !t.title.trim())) {
      toast({ title: "Xatolik", description: "Barcha vazifalar nomini kiriting", variant: "destructive" });
      return;
    }
    if (form.checkpoints?.find(c => !c.title.trim())) {
      toast({ title: "Xatolik", description: "Barcha tekshirish nuqtalarini to'ldiring", variant: "destructive" });
      return;
    }

    const data = {
      title: form.title,
      titleRu: form.titleRu,
      description: form.description || null,
      descriptionRu: form.descriptionRu || null,
      positionId: form.positionId === "all" ? null : form.positionId,
      departmentId: form.departmentId === "all" ? null : form.departmentId,
      duration: form.duration,
      durationType: form.durationType,
      tasks: form.tasks,
      checkpoints: form.checkpoints,
      mentorRequired: form.mentorRequired,
      status: form.status,
    };

    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUseTemplate = (templateKey: string) => {
    const template = PROGRAM_TEMPLATES[templateKey as keyof typeof PROGRAM_TEMPLATES];
    setForm({
      title: template.title,
      titleRu: template.titleRu,
      description: template.description,
      descriptionRu: template.descriptionRu,
      duration: template.duration,
      durationType: template.durationType,
      departmentId: "all",
      positionId: "all",
      mentorRequired: true,
      status: "active",
      tasks: template.tasks,
      checkpoints: template.checkpoints,
    });
    setEditingProgram(null);
    setShowTemplates(false);
    setIsDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("adaptatsiyaDasturlari")}</CardTitle>
            <CardDescription>{t("k1Kun1Hafta1Oy")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <TemplatesDialog
              open={showTemplates}
              onOpenChange={setShowTemplates}
              onUseTemplate={handleUseTemplate}
            />
            <ProgramFormDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              editingProgram={editingProgram}
              form={form}
              setField={setField}
              departments={departments}
              positions={positions}
              isPending={isPending}
              onSubmit={handleSubmit}
              onOpenNew={() => openProgramDialog()}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ProgramsTable
          programs={programs}
          departments={departments}
          positions={positions}
          onEdit={openProgramDialog}
          onDelete={setDeleteId}
        />
      </CardContent>

      <DeleteConfirmDialog
        deleteId={deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </Card>
  );
}
