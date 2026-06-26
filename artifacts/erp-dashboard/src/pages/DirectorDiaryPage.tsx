/**
 * @module DirectorDiaryPage
 * @description Manager daily diary: open today's entry, save draft, submit.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Send, Save } from "lucide-react";
import { EPStatusPill, EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

interface DiaryEntry {
  id: number;
  date: string;
  status: string;
  main_issue?: string | null;
  solution?: string | null;
  tomorrow_plan?: string | null;
  main_kpi_value?: number | null;
}

export default function DirectorDiaryPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [mainIssue, setMainIssue] = useState("");
  const [solution, setSolution] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");

  const { data, isLoading } = useQuery<DiaryEntry>({
    queryKey: ["/api/director/diary"],
  });

  useEffect(() => {
    if (data) {
      setMainIssue(data.main_issue ?? "");
      setSolution(data.solution ?? "");
      setTomorrowPlan(data.tomorrow_plan ?? "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/director/diary/${data?.id}`, {
        main_issue: mainIssue.trim() || null,
        solution: solution.trim() || null,
        tomorrow_plan: tomorrowPlan.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/diary"] });
      toast({ title: "Qoralama saqlandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/director/diary/${data?.id}/submit`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/diary"] });
      toast({ title: "Kunlik hisobot topshirildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const isSubmitted = data?.status === "submitted";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        icon={<BookOpen className="h-5 w-5 text-primary" />}
        title={t("kunlikKundalik", "Kunlik kundalik")}
        status={
          data ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline">{data.date}</Badge>
              {isSubmitted ? (
                <EPStatusPill tone="success">{t("topshirildi", "Topshirildi")}</EPStatusPill>
              ) : (
                <EPStatusPill tone="neutral">{t("qoralama", "Qoralama")}</EPStatusPill>
              )}
            </div>
          ) : null
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("bugungiHisobot", "Bugungi hisobot")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-1.5 block">
                {t("asosiyMuammo", "Asosiy muammo / to'siq")}
              </Label>
              <Textarea
                value={mainIssue}
                onChange={(e) => setMainIssue(e.target.value)}
                placeholder={t("muammoNi", "Bugun qanday muammo yuzaga keldi?")}
                rows={4}
                disabled={isSubmitted}
                data-testid="textarea-main-issue"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">
                {t("yechim", "Yechim / chora")}
              </Label>
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder={t("yechimNi", "Muammoni qanday hal qildingiz?")}
                rows={4}
                disabled={isSubmitted}
                data-testid="textarea-solution"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">
                {t("ertankiReja", "Ertanki reja")}
              </Label>
              <Textarea
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder={t("ertankiRejaNi", "Ertaga nima qilishni rejalashtiryapsiz?")}
                rows={4}
                disabled={isSubmitted}
                data-testid="textarea-tomorrow-plan"
              />
            </div>

            {!isSubmitted && (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !data}
                  data-testid="button-save-diary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Saqlash")}
                </Button>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !data}
                  data-testid="button-submit-diary"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("topshirish", "Topshirish")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
