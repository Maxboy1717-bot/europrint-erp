/**
 * @module CareerTab
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Edit, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CareerData, CareerTabProps, CareerFormState } from "./CareerTabTypes";
import { buildFormFromProfile } from "./CareerTabTypes";
import {
  CareerKpiCards,
  CareerProfileReadView,
  CareerEmptyProfile,
  CareerAiCard,
  CareerTransferHistory,
} from "./CareerTabSections";
import { CareerEditForm } from "./CareerTabDialogs";
import { useTranslation } from '@/lib/i18n';

const INITIAL_FORM: CareerFormState = {
  nextRecommendedPosition: "",
  successionFor: "",
  crossTrainingStatus: "not_started",
  crossTrainingNotes: "",
  careerPathDirection: "",
  notes: "",
};

export function CareerTab({ employeeId }: CareerTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CareerFormState>(INITIAL_FORM);

  const { data: careerData, isLoading } = useQuery<CareerData>({
    queryKey: ["/api/hr/employees", employeeId, "career"],
    queryFn: async () => {
      return await apiRequest('GET', `/api/hr/employees/${employeeId}/career`);
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (careerData?.profile && !editing) {
      setForm(buildFormFromProfile(careerData.profile));
    }
  }, [careerData, editing]);

  const saveMutation = useMutation({
    mutationFn: async (data: CareerFormState) => {
      return apiRequest("POST", `/api/hr/employees/${employeeId}/career`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "career"] });
      setEditing(false);
      toast({ title: "Karera profili saqlandi" });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const profile = careerData?.profile ?? null;

  return (
    <div className="space-y-6">
      <CareerKpiCards careerData={careerData} profile={profile} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("kareraRejasi")}
            </CardTitle>
            <CardDescription>{t("successionPlanningVaKareraYonalishi")}</CardDescription>
          </div>
          <Button
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={() => {
              if (editing) {
                saveMutation.mutate(form);
              } else {
                setEditing(true);
                if (profile) setForm(buildFormFromProfile(profile));
              }
            }}
            disabled={saveMutation.isPending}
            data-testid="button-edit-career"
          >
            {editing ? (
              saveMutation.isPending ? "Saqlanmoqda..." : <><Check className="h-4 w-4 mr-1" />{t("Saqlash")}</>
            ) : (
              <><Edit className="h-4 w-4 mr-1" />{t("edit")}</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {editing ? (
            <CareerEditForm form={form} onChange={setForm} />
          ) : profile ? (
            <CareerProfileReadView profile={profile} onEdit={() => setEditing(true)} />
          ) : (
            <CareerEmptyProfile onStart={() => setEditing(true)} />
          )}
        </CardContent>
      </Card>

      <CareerAiCard aiRecommendedPosition={careerData?.aiRecommendedPosition} />
      <CareerTransferHistory transferHistory={careerData?.transferHistory ?? []} />
    </div>
  );
}
