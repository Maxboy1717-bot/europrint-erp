/**
 * @module AdaptationTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Star, TrendingUp, AlertTriangle, Briefcase, Pencil } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface AdaptationData {
  recordId?: number | null;
  mentorId?: number | null;
  mentorName?: string | null;
  mentorEmail?: string | null;
  mentorPhone?: string | null;
  professionalMasterId?: number | null;
  professionalMasterName?: string | null;
  professionalMasterEmail?: string | null;
  professionalMasterPhone?: string | null;
  assignedDate?: string | null;
  currentWeek?: number;
  totalWeeks?: number;
  overallScore?: number | null;
  weeklyScores?: { week: number; score: number; comment?: string; reviewedAt?: string }[];
  status?: string;
  hrNotes?: string | null;
  programName?: string | null;
}

interface Props {
  employeeId: number | string;
  isHr?: boolean;
}

function ScoreCircle({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color =
    score >= 4 ? "text-green-400 border-green-400 bg-green-50 dark:bg-green-950/30" :
    score >= 3 ? "text-amber-400 border-amber-400 bg-amber-50 dark:bg-amber-950/30" :
                 "text-red-400 border-red-400 bg-red-50 dark:bg-red-950/30";
  const sz = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-9 h-9 text-sm" : "w-12 h-12 text-base";
  return (
    <div className={`${sz} rounded-full border-2 flex items-center justify-center font-bold ${color}`}>
      {score.toFixed(1)}
    </div>
  );
}

function MentorCard({
  title, name, email, phone, icon: Icon, iconColor,
  recordId, field, isHr, onSaved,
}: {
  title: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  icon: React.ElementType;
  iconColor: string;
  recordId?: number | null;
  field: "mentor_id" | "professional_master_id";
  isHr?: boolean;
  onSaved?: () => void;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (empId: number) =>
      apiRequest("PATCH", `/api/hr/adaptation/${recordId}`, { [field]: empId }),
    onSuccess: () => {
      toast({ title: "Tayinlandi", description: `${title} yangilandi` });
      setOpen(false);
      onSaved?.();
    },
    onError: () => toast({ title: "Xato", description: "Saqlashda muammo", variant: "destructive" }),
  });

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="font-semibold text-foreground text-sm truncate">{name ?? "Tayinlanmagan"}</p>
          {email && <p className="text-xs text-muted-foreground mt-0.5 truncate">{email}</p>}
          {phone && <p className="text-xs text-muted-foreground truncate">{phone}</p>}
        </div>
        {isHr && recordId && (
          <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { setVal(""); setOpen(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </CardContent>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title} tayinlash</DialogTitle>
            </DialogHeader>
            <div className="space-y-1">
          <Label>{t("xodimId")}</Label>
              <Input type="number" placeholder={t("xodimIdKiriting")} value={val} onChange={e => setVal(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("Bekor")}</Button>
              <Button
                disabled={!val || mutation.isPending}
                onClick={() => mutation.mutate(parseInt(val))}
              >
                {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function AdaptationTab({ employeeId, isHr }: Props) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/hr/adaptation", employeeId],
    queryFn: () =>
      apiRequest("GET", `/api/hr/adaptation/${employeeId}`),
    enabled: !!employeeId,
  });

  const ad: AdaptationData = (data && !data.error) ? data : {};
  const weeklyScores = Array.isArray(ad.weeklyScores) ? ad.weeklyScores : [];
  const overallScore = ad.overallScore ?? (weeklyScores.length
    ? (Array.isArray(weeklyScores) ? weeklyScores : []).reduce((sum, w) => sum + w.score, 0) / weeklyScores.length
    : null);

  const status = ad.status ?? (
    overallScore === null ? "not_started" :
    overallScore < 3.0 ? "at_risk" :
    overallScore >= 4.5 ? "excellent" :
    "on_track"
  );

  const statusConfig = {
    not_started: { label: "Boshlanmagan", color: "bg-slate-200 text-slate-600" },
    at_risk:     { label: "Xavf ostida",  color: "bg-red-100 text-[var(--ep-red)]" },
    on_track:    { label: "Muvofiq",      color: "bg-amber-100 text-[var(--ep-yellow)]" },
    excellent:   { label: "A'lo",         color: "bg-green-100 text-[var(--ep-green)]" },
    completed:   { label: "Yakunlangan",  color: "bg-blue-100 text-[var(--ep-blue)]" },
  }[status] ?? { label: status, color: "bg-slate-200 text-slate-600" };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/hr/adaptation", employeeId] });

  if (isLoading) {
    return <div className="space-y-4">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score */}
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            {overallScore !== null ? (
              <ScoreCircle score={overallScore} size="lg" />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">—</div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t("umumiyBall")}</p>
              <p className="font-semibold text-foreground">{overallScore !== null ? `${overallScore.toFixed(1)} / 5.0` : "Ma'lumot yo'q"}</p>
              {ad.programName && <p className="text-xs text-muted-foreground mt-0.5">{ad.programName}</p>}
              <Badge className={`text-xs mt-1 ${statusConfig.color}`}>{statusConfig.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-2">{t("moslashuvJarayoni")}</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium">
                {ad.currentWeek ?? weeklyScores.length} / {ad.totalWeeks ?? 12} hafta
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((ad.currentWeek ?? weeklyScores.length) / (ad.totalWeeks ?? 12)) * 100}%` }}
              />
            </div>
            {ad.assignedDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Boshlangan: {new Date(ad.assignedDate).toLocaleDateString("uz-UZ")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* HR Notes (compact) */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">{t("hrIzohi")}</p>
            <p className="text-sm text-foreground line-clamp-4">
              {ad.hrNotes ?? <span className="text-muted-foreground/50 italic">{t("izohYoq")}</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dual Mentor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MentorCard
          title={t("moslashuvMentori30Kun")}
          name={ad.mentorName}
          email={ad.mentorEmail}
          phone={ad.mentorPhone}
          icon={User}
          iconColor="bg-primary/10"
          recordId={ad.recordId}
          field="mentor_id"
          isHr={isHr}
          onSaved={invalidate}
        />
        <MentorCard
          title={t("professionalUsta90Kun")}
          name={ad.professionalMasterName}
          email={ad.professionalMasterEmail}
          phone={ad.professionalMasterPhone}
          icon={Briefcase}
          iconColor="bg-amber-100 dark:bg-amber-950/30"
          recordId={ad.recordId}
          field="professional_master_id"
          isHr={isHr}
          onSaved={invalidate}
        />
      </div>

      {/* At-risk warning */}
      {overallScore !== null && overallScore < 3.0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-[var(--ep-red)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--ep-red)] dark:text-red-400 text-sm">{t("moslashuvXavfOstida")}</p>
            <p className="text-xs text-[var(--ep-red)] dark:text-red-500 mt-0.5">
              {t("umumiyBall30Dan")}
            </p>
          </div>
        </div>
      )}

      {/* Weekly scores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            {t("haftalikBaholash")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyScores.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("haftalikBaholashlarHaliKiritilmagan")}</p>
              <p className="text-xs mt-1 opacity-60">{t("hrMentorTomonidanBaholashAmalga")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(weeklyScores) ? weeklyScores : []).map(ws => (
                <div key={ws.week} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{ws.week}H</span>
                  </div>
                  <ScoreCircle score={ws.score} size="sm" />
                  <div className="flex-1 min-w-0">
                    {ws.comment && <p className="text-xs text-muted-foreground line-clamp-1">{ws.comment}</p>}
                    {ws.reviewedAt && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(ws.reviewedAt).toLocaleDateString("uz-UZ")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <div className="w-20 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ws.score >= 4 ? "bg-green-400" : ws.score >= 3 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${ws.score * 20}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
