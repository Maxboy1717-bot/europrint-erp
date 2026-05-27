/**
 * @module AssessmentTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, TrendingUp, TrendingDown, Minus, Users, UserCheck, Shield, Link2, Plus, Brain } from "lucide-react";
import { apiRequest, queryClient, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { EPStatusPill } from "@/components/ep";

import { tLabel } from '@/lib/i18n/tLabel';
interface Assessment {
  id: string;
  employeeId: string;
  reviewerType: string;
  reviewerName: string;
  score: number;
  comment: string;
  isAnonymous: boolean;
  createdAt: string;
  periodYear: number;
  periodMonth: number;
}

interface AssessmentTabProps {
  employeeId: string;
}

const REVIEWER_TYPES = [
  { value: "manager", label: "Rahbar bahosi", icon: Shield, color: "bg-blue-500/10 text-[var(--ep-blue)] border-blue-500/20" },
  { value: "peer", label: "Hamkasb bahosi (anonim)", icon: Users, color: "bg-green-500/10 text-[var(--ep-green)] border-green-500/20" },
  { value: "subordinate", label: "Qo'l ostidagi xodim", icon: UserCheck, color: "bg-purple-500/10 text-[var(--ep-purple)] border-purple-500/20" },
  { value: "service_chain", label: "Xizmat zanjiri", icon: Link2, color: "bg-orange-500/10 text-[var(--ep-primary)] border-orange-500/20" },
];

function StarRating({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5]).map((s) => (
        <Star
          key={s}
          className={`${iconSize} ${s <= score ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function AssessmentTab({employeeId }: AssessmentTabProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    reviewerType: "manager",
    reviewerName: "",
    score: 3,
    comment: "",
    isAnonymous: false,
  });

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/hr/employees", employeeId, "assessments"],
    queryFn: async () => {
      let json: unknown;
      try { json = await apiRequest<unknown>('GET', `/api/hr/employees/${employeeId}/assessments`); }
      catch { return []; }
      if (Array.isArray(json)) return json as Assessment[];
      const obj = json as { data?: unknown };
      return Array.isArray(obj?.data) ? (obj.data as Assessment[]) : [];
    },
    enabled: !!employeeId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", `/api/hr/employees/${employeeId}/assessments`, {
        ...data,
        reviewerName: data.isAnonymous ? undefined : data.reviewerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "assessments"] });
      setDialogOpen(false);
      setForm({ reviewerType: "manager", reviewerName: "", score: 3, comment: "", isAnonymous: false });
      toast({ title: "Baho muvaffaqiyatli qo'shildi" });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const byType = REVIEWER_TYPES.map((rt) => {
    const typeAssessments = (Array.isArray(assessments) ? assessments : []).filter((a) => a.reviewerType === rt.value);
    const avg = typeAssessments.length > 0
      ? (Array.isArray(typeAssessments) ? typeAssessments : []).reduce((sum, a) => sum + a.score, 0) / typeAssessments.length
      : null;
    return { ...rt, assessments: typeAssessments, avg };
  });

  const overallAvg = assessments.length > 0
    ? (Array.isArray(assessments) ? assessments : []).reduce((sum, a) => sum + a.score, 0) / assessments.length
    : null;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const recentAssessments = (Array.isArray(assessments) ? assessments : []).filter((a) => {
    const assessmentDate = new Date(a.periodYear, a.periodMonth - 1, 1);
    return assessmentDate >= sixMonthsAgo;
  });

  const monthBuckets: Record<string, { total: number; count: number }> = {};
  (Array.isArray(recentAssessments) ? recentAssessments : []).forEach((a) => {
    const key = `${a.periodYear}/${String(a.periodMonth).padStart(2, "0")}`;
    if (!monthBuckets[key]) {
      monthBuckets[key] = { total: 0, count: 0 };
    }
    monthBuckets[key].total += a.score;
    monthBuckets[key].count += 1;
  });

  const trendData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, count }]) => ({
      month,
      avg: parseFloat((total / count).toFixed(1)),
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("umumiy360Baho")}</p>
                {overallAvg ? (
                  <>
                    <p className="text-2xl font-bold text-[var(--ep-yellow)]">{overallAvg.toFixed(1)}/5</p>
                    <StarRating score={Math.round(overallAvg)} size="sm" />
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
              <Brain className="h-6 w-6 text-[var(--ep-yellow)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("baholarSoni")}</p>
                <p className="text-2xl font-bold text-[var(--ep-blue)]">{assessments.length}</p>
              </div>
              <Users className="h-6 w-6 text-[var(--ep-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('trend1')}</p>
                {trendData.length >= 2 ? (
                  <div className="flex items-center gap-1">
                    {trendData[trendData.length - 1].avg > trendData[trendData.length - 2].avg ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-[var(--ep-green)]" />
                        <span className="text-lg font-bold text-[var(--ep-green)]">{t("osish")}</span>
                      </>
                    ) : trendData[trendData.length - 1].avg < trendData[trendData.length - 2].avg ? (
                      <>
                        <TrendingDown className="h-5 w-5 text-[var(--ep-red)]" />
                        <span className="text-lg font-bold text-[var(--ep-red)]">{t("kamayish")}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-bold text-muted-foreground">{t("barqaror")}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-lg font-bold text-muted-foreground">{t("malumotYoq")}</p>
                )}
              </div>
              <TrendingUp className="h-6 w-6 text-[var(--ep-green)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("kategoriyalarBoyichaBaholar")}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-assessment">
              <Plus className="h-4 w-4 mr-2" />
              {t("bahoQoshish")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("yangi360Baho")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
          <Label>{t("bahovchiTuri")}</Label>
                <Select value={form.reviewerType} onValueChange={(v) => setForm({ ...form, reviewerType: v })}>
                  <SelectTrigger data-testid="select-reviewer-type" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(REVIEWER_TYPES) ? REVIEWER_TYPES : []).map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon-check"
                    checked={form.isAnonymous}
                    onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                    className="h-4 w-4"
                    data-testid="checkbox-anonymous"
                  />
                  <Label htmlFor="anon-check">{t("anonim")}</Label>
                </div>
              </div>
              {!form.isAnonymous && (
                <div className="space-y-1">
          <Label>{t("bahovchiIsmi")}</Label>
                  <Input
                    value={form.reviewerName}
                    onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                    placeholder={t("ismFamiliya")}
                    data-testid="input-reviewer-name"
                  />
                </div>
              )}
              <div className="space-y-1">
          <Label>{t("baho15")}</Label>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, score: s })}
                      className="focus:outline-none"
                      data-testid={`star-${s}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${s <= form.score ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-medium text-muted-foreground ml-1">{form.score}/5</span>
                </div>
              </div>
              <div className="space-y-1">
          <Label>{t("Izoh")}</Label>
                <Input
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder={t("qoshimchaIzoh")}
                  data-testid="input-assessment-comment"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => addMutation.mutate(form)}
                disabled={addMutation.isPending}
                data-testid="button-save-assessment"
              >
                {addMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(byType) ? byType : []).map((rt) => (
            <Card key={rt.value} className={`border ${rt.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <rt.icon className="h-4 w-4" />
                  {rt.label}
                  {rt.avg !== null && (
                    <EPStatusPill tone="neutral" className="ml-auto">
                      {rt.avg.toFixed(1)}/5
                    </EPStatusPill>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rt.assessments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StarRating score={Math.round(rt.avg || 0)} />
                      <span className="text-sm text-muted-foreground">
                        {rt.assessments.length} ta baho
                      </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {rt.assessments.slice(-3).map((a) => (
                        <div key={a.id} className="text-sm border rounded-md p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {a.isAnonymous ? "Anonim" : a.reviewerName || "Noma'lum"}
                            </span>
                            <StarRating score={a.score} size="sm" />
                          </div>
                          {a.comment && (
                            <p className="text-muted-foreground mt-1 text-xs">{a.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm">{t("bahoYoq")}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Baho trendi (so'nggi 6 oy)
            </CardTitle>
            <CardDescription>{t("oylikOrtacha360BahoDinamikasi")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg" name={tLabel('employee-profile.AssessmentTab.ortachaBaho', "O'rtacha baho")} stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
