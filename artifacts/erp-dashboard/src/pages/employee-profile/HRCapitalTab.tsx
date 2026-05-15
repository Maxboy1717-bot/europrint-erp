/**
 * @module HRCapitalTab
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Edit, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HRCapitalProfile, HRCapitalTabProps, FormState } from "./HRCapitalTabTypes";
import { EMPTY_FORM, buildFormFromProfile } from "./HRCapitalTabTypes";
import { HRCapitalSummaryCards, HRCapitalProfileView, HRCapitalTestHistory, VisotskiyInfoCard } from "./HRCapitalTabSections";
import { HRCapitalEditForm } from "./HRCapitalTabDialogs";
import { useTranslation } from '@/lib/i18n';

export function HRCapitalTab({ employeeId }: HRCapitalTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: profile, isLoading } = useQuery<HRCapitalProfile | null>({
    queryKey: ["/api/employees", employeeId, "capital-profile"],
    queryFn: async () => {
      const res = (await apiRequest('GET', `/api/employees/${employeeId}/capital-profile`)) as unknown as Response;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (profile && !editing) {
      setForm(buildFormFromProfile(profile));
    }
  }, [profile, editing]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormState) =>
      apiRequest("POST", `/api/employees/${employeeId}/capital-profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "capital-profile"] });
      setEditing(false);
      toast({ title: "HR Kapital profili saqlandi" });
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

  return (
    <div className="space-y-6">
      <HRCapitalSummaryCards profile={profile} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t("hrKapitalMalumotlari")}
            </CardTitle>
            <CardDescription>{t("visotskiyMetodologiyasiVaPsixologikProfil")}</CardDescription>
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
            data-testid="button-edit-hr-capital"
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
            <HRCapitalEditForm form={form} onChange={setForm} />
          ) : profile ? (
            <HRCapitalProfileView profile={profile} />
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("hrKapitalProfiliToldirilmagan")}</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setEditing(true)}
                data-testid="button-start-hr-capital"
              >
                {t("toldirish")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <HRCapitalTestHistory employeeId={employeeId} />

      <VisotskiyInfoCard />
    </div>
  );
}
