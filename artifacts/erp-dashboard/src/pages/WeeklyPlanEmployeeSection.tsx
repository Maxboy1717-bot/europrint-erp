/**
 * @module WeeklyPlanEmployeeSection
 * @description Employee-facing "My Plan" card components for WeeklyPlanPage.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Plus, Target } from "lucide-react";
import type { WeeklyPlan } from "./WeeklyPlanPageTypes";
import { getWeekLabel } from "./WeeklyPlanPageTypes";
import { statusBadge } from "./WeeklyPlanPageSections";
import { useTranslation } from '@/lib/i18n';

interface MyPlanViewProps {
  myPlan: WeeklyPlan | undefined;
  editMode: boolean;
  isLoading: boolean;
  week: string;
  gsdTarget: string;
  tasks: string[];
  successFactors: string;
  resourcesNeeded: string;
  isSubmitPending: boolean;
  onGsdTargetChange: (v: string) => void;
  onTaskChange: (tasks: string[]) => void;
  onSuccessFactorsChange: (v: string) => void;
  onResourcesNeededChange: (v: string) => void;
  onSubmit: () => void;
  onEdit: (plan: WeeklyPlan) => void;
  onCancelEdit: () => void;
  onStartCreate: () => void;
}

export function MyPlanSection({
  myPlan, editMode, isLoading, week,
  gsdTarget, tasks, successFactors, resourcesNeeded,
  isSubmitPending,
  onGsdTargetChange, onTaskChange, onSuccessFactorsChange, onResourcesNeededChange,
  onSubmit, onEdit, onCancelEdit, onStartCreate,
}: MyPlanViewProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {t("meningRejam")}
          </CardTitle>
          {myPlan && !editMode && (
            <div className="flex items-center gap-2">
              {statusBadge(myPlan.status)}
              {myPlan.status !== "approved" && (
                <Button variant="outline" size="sm" onClick={() => onEdit(myPlan)}>
                  {t("edit")}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : myPlan && !editMode ? (
          <MyPlanReadView plan={myPlan} />
        ) : (
          <MyPlanEditForm
            gsdTarget={gsdTarget}
            tasks={tasks}
            successFactors={successFactors}
            resourcesNeeded={resourcesNeeded}
            isSubmitPending={isSubmitPending}
            editMode={editMode}
            onGsdTargetChange={onGsdTargetChange}
            onTaskChange={onTaskChange}
            onSuccessFactorsChange={onSuccessFactorsChange}
            onResourcesNeededChange={onResourcesNeededChange}
            onSubmit={onSubmit}
            onCancel={onCancelEdit}
          />
        )}
        {!myPlan && !editMode && !isLoading && (
          <div className="text-center py-6">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {getWeekLabel(week)} hafta uchun reja topshirilmagan
            </p>
            <Button onClick={onStartCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> {t("rejaYaratish")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MyPlanReadView({ plan }: { plan: WeeklyPlan }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("gsdMaqsad")}</p>
        <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{plan.gsdTarget}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("top5Vazifalar")}</p>
        <ol className="space-y-1.5">
          {(Array.isArray(plan.top5Tasks) ? plan.top5Tasks as string[] : []).map((task, i) => (
            <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground">{task}</span>
            </li>
          ))}
        </ol>
      </div>
      {plan.successFactors && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("muvaffaqiyatOmillari")}</p>
          <p className="text-sm text-foreground">{plan.successFactors}</p>
        </div>
      )}
      {plan.resourcesNeeded && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("kerakResurslar")}</p>
          <p className="text-sm text-foreground">{plan.resourcesNeeded}</p>
        </div>
      )}
      {plan.status === "approved" && plan.approvedAt && (
        <div className="flex items-center gap-2 text-sm text-[var(--ep-green)]">
          <CheckCircle className="w-4 h-4" />
          <span>Tasdiqlangan: {new Date(plan.approvedAt).toLocaleDateString("uz-UZ")}</span>
        </div>
      )}
    </div>
  );
}

interface EditFormProps {
  gsdTarget: string;
  tasks: string[];
  successFactors: string;
  resourcesNeeded: string;
  isSubmitPending: boolean;
  editMode: boolean;
  onGsdTargetChange: (v: string) => void;
  onTaskChange: (tasks: string[]) => void;
  onSuccessFactorsChange: (v: string) => void;
  onResourcesNeededChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function MyPlanEditForm({
  gsdTarget, tasks, successFactors, resourcesNeeded,
  isSubmitPending, editMode,
  onGsdTargetChange, onTaskChange, onSuccessFactorsChange, onResourcesNeededChange,
  onSubmit, onCancel,
}: EditFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {t("gsdMaqsad")}<span className="text-destructive">*</span>
        </label>
        <Textarea value={gsdTarget} onChange={(e) => onGsdTargetChange(e.target.value)} placeholder={t("buHaftaErishmoqchiBolganAsosiy")} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {t("top5Vazifalar")}<span className="text-destructive">*</span>
        </label>
        <div className="space-y-2">
          {(Array.isArray(tasks) ? tasks : []).map((task, i) => (
            <div key={`k-${i}`} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <Input value={task} onChange={(e) => { const next = [...tasks]; next[i] = e.target.value; onTaskChange(next); }} placeholder={`${i + 1}-vazifa`} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">{t("muvaffaqiyatOmillari")}</label>
        <Textarea value={successFactors} onChange={(e) => onSuccessFactorsChange(e.target.value)} placeholder={t("nimaBolsaMuvaffaqiyatgaErishiladi")} rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">{t("kerakResurslar")}</label>
        <Textarea value={resourcesNeeded} onChange={(e) => onResourcesNeededChange(e.target.value)} placeholder={t("maqsadgaErishishUchunNimaKerak")} rows={2} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSubmit} disabled={isSubmitPending} className="flex-1">
          {isSubmitPending ? "Saqlanmoqda..." : editMode ? "Yangilash" : "Topshirish"}
        </Button>
        {editMode && <Button variant="outline" onClick={onCancel}>{t("Bekor")}</Button>}
      </div>
    </div>
  );
}
