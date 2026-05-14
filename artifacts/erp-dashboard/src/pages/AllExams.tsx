/**
 * @module AllExams
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Trophy, Clock, ClipboardList, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState, EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function AllExams() {
  const { t } = useTranslation('common');
  const { data: regularAttempts = [], isLoading: isLoadingRegular, isError, refetch} = useQuery<Array<{
    id: string;
    userName: string;
    testName: string;
    startedAt: string;
    finishedAt: string | null;
    score: number | null;
    passed: boolean;
  }>>({
    queryKey: ["/api/attempts/all"],
  });

  const { data: aiAttempts = [], isLoading: isLoadingAI } = useQuery<Array<{
    id: string;
    userName: string;
    positionName: string;
    startedAt: string;
    completedAt: string | null;
    analyzedAt: string | null;
    score: number | null;
    status: string;
  }>>({
    queryKey: ["/api/ai-exam/attempts"],
  });

  const qc = useQueryClient();

  const submitAttemptMutation = useMutation({
    mutationFn: (attemptId: string) =>
      apiRequest("POST", `/api/attempts/${attemptId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/attempts/all"] });
    },
  });

  const isLoading = isLoadingRegular || isLoadingAI;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <div>
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-5 w-96 mt-2 rounded-lg" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadExamData = (exam: { id: string }, type: "regular" | "ai") => {
    const dataStr = JSON.stringify(exam, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-exam-${exam.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (startedAt: string, finishedAt: string | null) => {
    if (!finishedAt) return "—";
    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}d ${seconds}s`;
  };

  if (regularAttempts.length === 0 && aiAttempts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="ep-h1">Barcha Imtihonlar</h1>
          <p className="text-muted-foreground">Xodimlarning barcha imtihon natijalari</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ClipboardList}
              title="Imtihonlar topilmadi"
              description="Hozircha hech qanday imtihon urinishi mavjud emas. Xodimlar imtihon topshirganidan keyin natijalar shu yerda ko'rsatiladi."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Barcha Imtihonlar</b></>}
        title="Barcha Imtihonlar"
        subtitle="Xodimlarning barcha imtihon natijalari"
      />
      </div>

      {/* Regular Test Attempts */}
      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            Oddiy Test Imtihonlari
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Barcha test urinishlari va ularning natijalari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-l-lg">Xodim</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Test</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Boshlangan</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Tugatilgan</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Davomiyligi</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Ball</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('status4')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-r-lg">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularAttempts.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={8} className="text-center py-8 text-[13px] text-muted-foreground">
                    Imtihon urinishlari topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(regularAttempts) ? regularAttempts : []).map((attempt) => (
                  <TableRow key={attempt.id} className="border-none hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium px-6 text-foreground">{attempt.userName}</TableCell>
                    <TableCell className="px-6 text-foreground">{attempt.testName}</TableCell>
                    <TableCell className="px-6 text-foreground">
                      {format(new Date(attempt.startedAt), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      {attempt.finishedAt
                        ? format(new Date(attempt.finishedAt), "dd.MM.yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDuration(attempt.startedAt, attempt.finishedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      <span className="font-bold">{attempt.score || "—"}</span>
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge className={attempt.passed ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                        {attempt.passed ? "O'tdi" : attempt.finishedAt ? "O'tmadi" : "Jarayonda"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center gap-1">
                        {!attempt.finishedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => submitAttemptMutation.mutate(attempt.id)}
                            disabled={submitAttemptMutation.isPending}
                            data-testid={`button-submit-attempt-${attempt.id}`}
                            className="hover:bg-muted text-foreground"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadExamData(attempt, "regular")}
                          data-testid={`button-download-regular-${attempt.id}`}
                          className="hover:bg-muted text-foreground"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      {/* AI Exam Attempts */}
      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="w-5 h-5 text-primary" />
            AI Imtihonlar (35 savollik)
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            GPT tomonidan yaratilgan va tahlil qilingan imtihonlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-l-lg">Xodim</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Lavozim</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Boshlangan</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Tugatilgan</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Tahlil qilingan</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Ball</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('status3')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-r-lg">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiAttempts.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={8} className="text-center py-8 text-[13px] text-muted-foreground">
                    AI imtihon urinishlari topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(aiAttempts) ? aiAttempts : []).map((attempt) => (
                  <TableRow key={attempt.id} className="border-none hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium px-6 text-foreground">{attempt.userName}</TableCell>
                    <TableCell className="px-6 text-foreground">{attempt.positionName}</TableCell>
                    <TableCell className="px-6 text-foreground">
                      {format(new Date(attempt.startedAt), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      {attempt.completedAt
                        ? format(new Date(attempt.completedAt), "dd.MM.yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      {attempt.analyzedAt
                        ? format(new Date(attempt.analyzedAt), "dd.MM.yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-6 text-foreground">
                      <span className="font-bold">{attempt.score || "—"}</span>
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge
                        className={
                          attempt.status === "analyzed"
                            ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                            : attempt.status === "completed"
                            ? "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                            : "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                        }
                      >
                        {attempt.status === "analyzed"
                          ? "Tahlil qilingan"
                          : attempt.status === "completed"
                          ? "Tugatilgan"
                          : "Jarayonda"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadExamData(attempt, "ai")}
                        data-testid={`button-download-ai-${attempt.id}`}
                        className="hover:bg-muted text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
