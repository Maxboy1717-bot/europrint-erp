/**
 * @module CareerTabSections
 * @description Display sections (read-only views) for CareerTab.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, Target, ArrowRight, Users, Brain, History } from "lucide-react";
import type { CareerData, CareerProfile } from "./CareerTabTypes";
import { CROSS_TRAINING_LABELS, TRANSFER_TYPE_LABELS } from "./CareerTabTypes";
import { useTranslation } from '@/lib/i18n';

interface KpiCardsProps {
  careerData: CareerData | undefined;
  profile: CareerProfile | null | undefined;
}

export function CareerKpiCards({ careerData, profile }: KpiCardsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("joriyLavozimdagiVaqt")}</p>
              <p className="text-xl font-bold text-[var(--ep-blue)]">{careerData?.timeInPosition || "—"}</p>
            </div>
            <Briefcase className="h-6 w-6 text-[var(--ep-blue)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">AI tavsiya lavozim</p>
              <p className="text-sm font-bold text-[var(--ep-purple)] leading-snug mt-1">
                {careerData?.aiRecommendedPosition || "—"}
              </p>
            </div>
            <Brain className="h-6 w-6 text-[var(--ep-purple)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("aralashTayyorlov")}</p>
              {profile?.crossTrainingStatus ? (
                <Badge className={`mt-1 ${CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.color}`}>
                  {CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.label}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{t("belgilanmagan1")}</p>
              )}
            </div>
            <TrendingUp className="h-6 w-6 text-[var(--ep-green)]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProfileReadViewProps {
  profile: CareerProfile;
  onEdit: () => void;
}

export function CareerProfileReadView({ profile, onEdit }: ProfileReadViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("keyingiTavsiyaEtilganLavozim")}</p>
        <p className="font-medium flex items-center gap-2 mt-1">
          <ArrowRight className="h-4 w-4 text-primary" />
          {profile.nextRecommendedPosition || "Belgilanmagan"}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("vorislikRejasi")}</p>
        <p className="font-medium flex items-center gap-2 mt-1">
          <Users className="h-4 w-4 text-primary" />
          {profile.successionFor || "Belgilanmagan"}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("kareraYonalishi")}</p>
        <p className="font-medium mt-1">{profile.careerPathDirection || "—"}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("aralashTayyorlov")}</p>
        <div className="mt-1 flex items-center gap-2">
          {profile.crossTrainingStatus ? (
            <Badge className={CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.color}>
              {CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.label}
            </Badge>
          ) : "—"}
          {profile.crossTrainingNotes && (
            <span className="text-sm text-muted-foreground">{profile.crossTrainingNotes}</span>
          )}
        </div>
      </div>
      {profile.notes && (
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">{t("eslatmalar")}</p>
          <p className="font-medium mt-1">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}

interface EmptyProfileProps {
  onStart: () => void;
}

export function CareerEmptyProfile({ onStart }: EmptyProfileProps) {
  return (
    <div className="text-center py-8">
      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground">{t("kareraProfiliToldirilmagan")}</p>
      <Button size="sm" className="mt-3" onClick={onStart} data-testid="button-start-career-edit">
        {t("toldirish")}
      </Button>
    </div>
  );
}

interface AiCardProps {
  aiRecommendedPosition: string | undefined;
}

export function CareerAiCard({ aiRecommendedPosition }: AiCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {t("aiKareraTavsiyasi")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/5 rounded-md p-4 border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">{t("tavsiyaEtilganKeyingiQadam")}</p>
          <p className="font-semibold">{aiRecommendedPosition || "Malaka oshirish kerak"}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("ushbuTavsiyaXodimningJoriyRoli")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransferHistoryProps {
  transferHistory: import("./CareerTabTypes").TransferRecord[];
}

export function CareerTransferHistory({ transferHistory }: TransferHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t("lavozimOzgarishlariTarixi")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Array.isArray(transferHistory) && transferHistory.length > 0 ? (
          <div className="space-y-3" data-testid="transfer-history-list">
            {transferHistory.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`transfer-record-${t.id}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {TRANSFER_TYPE_LABELS[t.transferType] || t.transferType}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(t.fromDepartment || t.fromPosition) && (
                      <span className="text-sm text-muted-foreground">
                        {t.fromPosition || t.fromDepartment}
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {t.toPosition || t.toDepartment || "—"}
                    </span>
                  </div>
                  {t.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{t.reason}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(t.transferDate).toLocaleDateString("uz-UZ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t("otkazmaTarixiTopilmadi")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
