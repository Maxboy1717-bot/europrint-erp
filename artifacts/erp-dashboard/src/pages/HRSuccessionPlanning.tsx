/**
 * @module HRSuccessionPlanning
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ModulePage } from "@/components/ui/module-page";
import { AlertTriangle, UserCheck, Star, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EMPTY_PLAN_FORM, type NewPlanForm } from "./HRSuccessionPlanningTypes";
import { KeyPositionsTab, CareerPlansTab, CandidatesTab, NineBoxMatrixTab } from "./HRSuccessionPlanningSections";
import { NewPlanDialog } from "./HRSuccessionPlanningDialogs";
import { Card as CardPrimitive, CardContent } from "@/components/ui/card";
import { useTranslation } from '@/lib/i18n';

export default function HRSuccessionPlanning() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState<NewPlanForm>(EMPTY_PLAN_FORM);

  const { data: keyPositions = [], isLoading: posLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/key-positions"],
  });

  const { data: candidates = [], isLoading: candLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/candidates"],
  });

  const { data: careerPlans = [], isLoading: plansLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/career-plans"],
  });

  // FIX (2026-07-13): NewPlanDialog had no target-position field at all (targetPositionId
  // stayed "" forever, so every created plan lost its target position). Load the real
  // positions list so the dialog can offer an actual Select.
  const { data: positionsResp } = useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["/api/hr/positions"],
  });
  const positions = Array.isArray(positionsResp?.data) ? positionsResp.data : [];

  const createPlanMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiRequest("POST", "/api/succession/career-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/succession/career-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/succession/key-positions"] });
      setNewPlanOpen(false);
      setNewPlanForm(EMPTY_PLAN_FORM);
      toast({ title: "Vorislik rejasi yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const criticalCount = (Array.isArray(keyPositions) ? keyPositions : []).filter(
    (p) => p.riskLevel === "critical" || p.riskLevel === "high" || Number(p.succession_plans) === 0,
  ).length;

  return (
    <ModulePage
      module="hr"
      title={t("vorislikRejalash")}
      subtitle={t("lavozimVorisligiVaIstedodZaxirasi")}
      icon={<Users className="h-6 w-6" />}
    >
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                {posLoading ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className="text-2xl font-bold" data-testid="stat-critical-positions">{criticalCount}</p>}
                <p className="text-sm text-muted-foreground">{t("xavfliLavozimlar")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-[var(--ep-green)]" />
              <div>
                {candLoading ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className="text-2xl font-bold" data-testid="stat-candidates">{candidates.length}</p>}
                <p className="text-sm text-muted-foreground">{t("potentsialNomzodlar")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-[var(--ep-yellow)]" />
              <div>
                {plansLoading ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className="text-2xl font-bold" data-testid="stat-plans">{careerPlans.length}</p>}
                <p className="text-sm text-muted-foreground">{t("faolVorislikRejalari")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-succession-overview">{t("asosiyLavozimlar")}</TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-succession-plans">{t("vorislikRejalari")}</TabsTrigger>
          <TabsTrigger value="candidates" data-testid="tab-succession-candidates">{t("nomzodlar")}</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-succession-matrix">{t("k9BlokMatrix")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <KeyPositionsTab positions={keyPositions} isLoading={posLoading} />
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>{t("vorislikRejalari")}</CardTitle>
                <CardDescription>{t("xodimlarningLavozimgaTayyorlanishRejalari")}</CardDescription>
              </div>
              <NewPlanDialog
                open={newPlanOpen}
                onOpenChange={setNewPlanOpen}
                form={newPlanForm}
                onFormChange={setNewPlanForm}
                isPending={createPlanMutation.isPending}
                onSubmit={() => createPlanMutation.mutate(newPlanForm as unknown as Record<string, string>)}
                positions={positions}
              />
            </CardHeader>
            <CareerPlansTab plans={careerPlans} isLoading={plansLoading} />
          </Card>
        </TabsContent>

        <TabsContent value="candidates">
          <CandidatesTab candidates={candidates} isLoading={candLoading} />
        </TabsContent>

        <TabsContent value="matrix">
          <NineBoxMatrixTab candidates={candidates} />
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
