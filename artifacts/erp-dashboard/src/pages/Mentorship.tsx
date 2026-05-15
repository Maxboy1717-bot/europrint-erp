/**
 * @module Mentorship
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  mentorshipFormSchema,
  type MentorshipRecord,
  type Employee,
  type Course,
  type MentorshipFormValues,
} from "./MentorshipTypes";
import { MentorshipStatCards, MentorshipTable } from "./MentorshipSections";
import { MentorshipFormDialog, DeleteMentorshipDialog } from "./MentorshipDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function Mentorship() {
  const { t } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [isMentorshipDialogOpen, setIsMentorshipDialogOpen] = useState(false);
  const [deleteMentorshipId, setDeleteMentorshipId] = useState<string | null>(null);

  const { data: mentorships, isLoading: loadingMentorships, isError, error, refetch } = useQuery<MentorshipRecord[]>({
    queryKey: ["/api/mentorships"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const mentorshipForm = useForm<MentorshipFormValues>({
    resolver: zodResolver(mentorshipFormSchema),
    defaultValues: {
      mentorId: "",
      menteeId: "",
      courseId: "",
      deadline: "",
      bonusPercentage: 5,
      status: "active",
      notes: "",
    },
  });

  const createMentorshipMutation = useMutation({
    mutationFn: (data: MentorshipFormValues) => apiRequest("POST", "/api/mentorships", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      setIsMentorshipDialogOpen(false);
      mentorshipForm.reset();
      toast({ title: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const updateMentorshipMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PUT", `/api/mentorships/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      toast({ title: tCommon('updatedSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const deleteMentorshipMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mentorships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      toast({ title: tCommon('deletedSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const confirmDeleteMentorship = () => {
    if (deleteMentorshipId) {
      deleteMentorshipMutation.mutate(deleteMentorshipId);
      setDeleteMentorshipId(null);
    }
  };

  const activeMentorships = mentorships?.filter((m) => m.status === "active") || [];
  const uniqueMentors = new Set(mentorships?.map((m) => m.mentorId)).size || 0;
  const uniqueMentees = new Set(mentorships?.map((m) => m.menteeId)).size || 0;

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("lmsMentorlik")}</b></>}
        title={t("lmsMentorlik")}
        subtitle={t('mentors')}
      />
        </div>
        <Button
          data-testid="button-create-mentorship"
          onClick={() => setIsMentorshipDialogOpen(true)}
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tCommon('create')}
        </Button>
      </div>

      <MentorshipStatCards
        total={mentorships?.length || 0}
        active={activeMentorships.length}
        uniqueMentors={uniqueMentors}
        uniqueMentees={uniqueMentees}
      />

      <MentorshipTable
        mentorships={mentorships}
        isLoading={loadingMentorships}
        onStatusChange={(id, status) => updateMentorshipMutation.mutate({ id, status })}
        onDelete={setDeleteMentorshipId}
        onCreateClick={() => setIsMentorshipDialogOpen(true)}
      />

      <MentorshipFormDialog
        isOpen={isMentorshipDialogOpen}
        onOpenChange={setIsMentorshipDialogOpen}
        form={mentorshipForm}
        onSubmit={(data) => createMentorshipMutation.mutate(data)}
        isPending={createMentorshipMutation.isPending}
        employees={employees}
        courses={courses}
      />

      <DeleteMentorshipDialog
        deleteId={deleteMentorshipId}
        onOpenChange={(open) => { if (!open) setDeleteMentorshipId(null); }}
        onConfirm={confirmDeleteMentorship}
      />
    </div>
  );
}
